import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StruggleHeatmap({ text, events }) {
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Analyze paragraphs for editing intensity
  const analyzeParagraphs = () => {
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, idx) => {
      const startPos = text.indexOf(paragraph);
      const endPos = startPos + paragraph.length;

      // Count edits in this paragraph
      const editsInParagraph = events.filter(event => {
        const pos = event.payload?.position;
        return pos >= startPos && pos <= endPos && 
               (event.event_type === 'delete' || event.event_type === 'insert');
      });

      const deleteEvents = editsInParagraph.filter(e => e.event_type === 'delete');
      const editRatio = deleteEvents.length / Math.max(paragraph.length, 1);

      // Calculate dwell time (time spent on this paragraph)
      const relevantEvents = events.filter(e => {
        const pos = e.payload?.position;
        return pos >= startPos && pos <= endPos;
      });

      const dwellTime = relevantEvents.length > 1 
        ? relevantEvents[relevantEvents.length - 1].timestamp - relevantEvents[0].timestamp
        : 0;

      // Determine struggle level
      let struggleLevel = 'low';
      if (editRatio > 0.3 || dwellTime > 120000) { // High edits or >2 min
        struggleLevel = 'high';
      } else if (editRatio > 0.15 || dwellTime > 60000) { // Medium edits or >1 min
        struggleLevel = 'medium';
      }

      return {
        text: paragraph,
        editRatio,
        dwellTime,
        struggleLevel,
        editCount: editsInParagraph.length
      };
    });
  };

  const paragraphAnalysis = analyzeParagraphs();

  const getStruggleColor = (level) => {
    switch (level) {
      case 'high':
        return 'bg-rose-100 border-rose-300';
      case 'medium':
        return 'bg-amber-100 border-amber-300';
      default:
        return 'bg-emerald-100 border-emerald-300';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Writing Struggle Analysis</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="flex items-center gap-2"
        >
          {showHeatmap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showHeatmap ? 'Hide' : 'Show'} Heatmap
        </Button>
      </div>

      {showHeatmap && (
        <>
          <div className="flex items-center gap-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-100 border border-emerald-300 rounded" />
              <span>Flow State (Low Edits)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-100 border border-amber-300 rounded" />
              <span>Moderate Struggle</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-rose-100 border border-rose-300 rounded" />
              <span>High Struggle</span>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {paragraphAnalysis.map((para, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all',
                  getStruggleColor(para.struggleLevel)
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <span className="text-xs font-medium text-slate-600">
                    Paragraph {idx + 1}
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500">
                      {para.editCount} edits
                    </span>
                    <span className="text-slate-500">
                      {Math.round(para.dwellTime / 1000)}s dwell time
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {para.text}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <strong>Interpretation:</strong> High-struggle areas show where students revised extensively. 
            This is often where they needed to think critically - valuable learning moments.
          </div>
        </>
      )}
    </div>
  );
}