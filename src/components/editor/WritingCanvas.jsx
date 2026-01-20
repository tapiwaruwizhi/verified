import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function WritingCanvas({ sessionId, onEventCapture, initialText = '' }) {
  const [text, setText] = useState(initialText);
  const [isSaving, setIsSaving] = useState(false);
  const quillRef = useRef(null);
  const lastKeystrokeTime = useRef(Date.now());
  const sessionStartTime = useRef(Date.now());
  const eventBuffer = useRef([]);

  const captureEvent = (eventType, payload = {}) => {
    const editor = quillRef.current?.getEditor();
    const event = {
      session_id: sessionId,
      timestamp: Date.now() - sessionStartTime.current,
      event_type: eventType,
      payload: {
        ...payload,
        position: editor?.getSelection()?.index || 0
      },
      text_snapshot: text
    };
    
    eventBuffer.current.push(event);
    onEventCapture?.(event);

    // Batch save events every 10 events
    if (eventBuffer.current.length >= 10) {
      flushEvents();
    }
  };

  const flushEvents = async () => {
    if (eventBuffer.current.length === 0) return;
    
    const eventsToSave = [...eventBuffer.current];
    eventBuffer.current = [];
    
    try {
      await base44.entities.Event.bulkCreate(eventsToSave);
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  };

  const calculateCoherence = (text) => {
    // Detect gibberish/random typing patterns
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length < 10) return 100;

    // Check for repeated characters (aaaa, 1111, etc.)
    const repeatedPattern = words.filter(w => /(.)\1{3,}/.test(w)).length;
    
    // Check for keyboard mashing (asdfgh, qwerty patterns)
    const keyboardPatterns = ['asdf', 'qwer', 'zxcv', 'hjkl', '1234', '5678'];
    const mashingScore = words.filter(w => 
      keyboardPatterns.some(p => w.toLowerCase().includes(p))
    ).length;

    // Check average word length (gibberish tends to be very short or very long)
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    const lengthAnomaly = avgWordLength < 2 || avgWordLength > 12;

    // Calculate coherence penalty
    let coherence = 100;
    coherence -= (repeatedPattern / words.length) * 50;
    coherence -= (mashingScore / words.length) * 40;
    if (lengthAnomaly) coherence -= 20;

    return Math.max(0, coherence);
  };

  const handleKeyDown = (e) => {
    const now = Date.now();
    const flightTime = now - lastKeystrokeTime.current;
    lastKeystrokeTime.current = now;

    // Bot detection: suspiciously fast typing
    if (flightTime < 10 && flightTime > 0) {
      captureEvent('insert', { 
        text: e.key, 
        flight_time: flightTime,
        flag: 'possible_bot'
      });
    } else if (e.key.length === 1) {
      captureEvent('insert', { 
        text: e.key, 
        flight_time: flightTime
      });
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      captureEvent('delete', { flight_time: flightTime });
    }
  };

  const handlePaste = (e) => {
    const pastedText = e.clipboardData?.getData('text/plain') || '';
    const wordCount = pastedText.split(/\s+/).filter(Boolean).length;

    if (wordCount > 5) {
      captureEvent('paste', { 
        text: pastedText,
        length: pastedText.length,
        word_count: wordCount
      });

      toast.warning('Paste Recorded. Please Cite.', {
        description: `${wordCount} words detected. Add proper citations.`,
        duration: 5000
      });
    }
  };

  const handleChange = (content, delta, source, editor) => {
    const plainText = editor.getText();
    setText(content);
    setIsSaving(true);
    
    // Debounced auto-save with coherence check
    clearTimeout(window.textSaveTimeout);
    window.textSaveTimeout = setTimeout(async () => {
      try {
        const coherenceScore = calculateCoherence(plainText);
        await base44.entities.Session.update(sessionId, {
          final_text: content,
          word_count: plainText.split(/\s+/).filter(Boolean).length,
          coherence_score: coherenceScore
        });
        setIsSaving(false);

        // Warn if gibberish detected
        if (coherenceScore < 50) {
          toast.warning('Low coherence detected', {
            description: 'Your text appears to contain random characters. This will affect your integrity score.',
            duration: 4000
          });
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
        setIsSaving(false);
      }
    }, 2000);
  };

  // Focus tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        captureEvent('focus_lost');
        toast.info('Tab switch detected', { 
          description: 'Focus tracking recorded',
          duration: 2000 
        });
      } else {
        captureEvent('focus_gained');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup: flush remaining events on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      flushEvents();
    };
  }, []);

  // Idle detection
  useEffect(() => {
    let idleTimer;
    let isIdle = false;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      
      if (isIdle) {
        captureEvent('idle_end');
        isIdle = false;
      }

      idleTimer = setTimeout(() => {
        captureEvent('idle_start');
        isIdle = true;
      }, 30000); // 30 seconds of inactivity
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer);
    });

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
    };
  }, []);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'blockquote'],
      [{ 'align': [] }],
      ['clean']
    ]
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'link', 'blockquote', 'align'
  ];

  return (
    <div className="relative w-full h-full flex flex-col">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        modules={modules}
        formats={formats}
        placeholder="Begin writing your essay..."
        className="flex-1 bg-white"
        style={{ height: 'calc(100% - 100px)' }}
      />
      
      {/* Live Status Indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 shadow-sm z-10">
        <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
        <span className="text-xs text-slate-600">
          {isSaving ? 'Saving Process...' : 'Process Recorded'}
        </span>
      </div>

      {/* Word Count */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 shadow-sm z-10">
        <span className="text-xs text-slate-600 font-medium">
          {text ? quillRef.current?.getEditor().getText().split(/\s+/).filter(Boolean).length || 0 : 0} words
        </span>
      </div>

      <style jsx>{`
        :global(.ql-container) {
          font-family: Georgia, serif;
          font-size: 16px;
          line-height: 1.8;
        }
        :global(.ql-editor) {
          padding: 3rem;
          min-height: 100%;
        }
        :global(.ql-toolbar) {
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
          background: #f8fafc;
        }
      `}</style>
    </div>
  );
}