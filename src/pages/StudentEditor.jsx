import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, differenceInDays, isPast } from 'date-fns';
import WritingCanvas from '../components/editor/WritingCanvas';
import { toast } from 'sonner';

export default function StudentEditor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate('/'));
    
    // Check URL params for specific assignment or course
    const params = new URLSearchParams(window.location.search);
    const assignmentId = params.get('assignment');
    const courseId = params.get('course');
    
    if (assignmentId) {
      // Auto-select assignment from URL
      setTimeout(() => {
        const assignment = assignments.find(a => a.id === assignmentId);
        if (assignment) handleStartAssignment(assignment);
      }, 500);
    }
  }, []);

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => base44.entities.Assignment.list('-created_date'),
    enabled: !!user,
    select: (data) => data.filter(a => a.status === 'active')
  });

  const createSessionMutation = useMutation({
    mutationFn: async (assignmentId) => {
      const session = await base44.entities.Session.create({
        assignment_id: assignmentId,
        student_email: user.email,
        student_name: user.full_name,
        start_time: new Date().toISOString(),
        status: 'in_progress',
        user_agent: navigator.userAgent,
        net_writing_time: 0,
        integrity_score: 100,
        paste_count: 0,
        focus_lost_count: 0
      });
      return session;
    },
    onSuccess: (session) => {
      setCurrentSession(session);
      toast.success('Session started. Begin writing.');
    }
  });

  const submitSessionMutation = useMutation({
    mutationFn: async () => {
      // Get current session data first to ensure we have the latest final_text
      const sessionData = await base44.entities.Session.filter({ id: currentSession.id });
      const currentSessionData = sessionData[0];
      
      if (!currentSessionData?.final_text || currentSessionData.final_text.trim().length === 0) {
        throw new Error('Cannot submit empty essay. Please write some content first.');
      }

      // Calculate final metrics from events
      const events = await base44.entities.Event.filter({ session_id: currentSession.id });
      
      const pasteCount = events.filter(e => e.event_type === 'paste').length;
      const focusLostCount = events.filter(e => e.event_type === 'focus_lost').length;
      
      const coherenceScore = currentSessionData?.coherence_score || 100;

      // Calculate integrity score with strict paste penalties
      let integrityScore = 100;
      
      // Severe penalty for large pastes (>100 words)
      const largePastes = events.filter(e => {
        if (e.event_type !== 'paste') return false;
        const wordCount = (e.payload?.text || '').split(/\s+/).filter(Boolean).length;
        return wordCount > 100;
      }).length;
      
      integrityScore -= largePastes * 30; // -30% per large paste
      integrityScore -= (pasteCount - largePastes) * 5; // -5% per regular paste
      integrityScore -= focusLostCount * 3; // -3% per focus loss
      
      // Apply coherence penalty
      integrityScore = integrityScore * (coherenceScore / 100);
      
      integrityScore = Math.max(0, Math.min(100, integrityScore));

      const endTime = new Date().toISOString();
      const netWritingTime = (new Date(endTime) - new Date(currentSession.start_time)) / 1000;

      return base44.entities.Session.update(currentSession.id, {
        end_time: endTime,
        status: 'submitted',
        net_writing_time: netWritingTime,
        integrity_score: integrityScore,
        paste_count: pasteCount,
        focus_lost_count: focusLostCount
      });
    },
    onSuccess: () => {
      toast.success('Essay submitted successfully!');
      queryClient.invalidateQueries(['sessions']);
      setCurrentSession(null);
      setSelectedAssignment(null);
      navigate(createPageUrl('MySubmissions'));
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit essay');
    }
  });

  const handleStartAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    createSessionMutation.mutate(assignment.id);
  };

  const handleSubmit = async () => {
    if (!confirm('Submit your essay? This action cannot be undone.')) {
      return;
    }
    
    // Wait for any pending saves
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Force a final save before submitting
    try {
      const session = await base44.entities.Session.filter({ id: currentSession.id });
      const currentData = session[0];
      
      if (!currentData?.final_text || currentData.word_count < 10) {
        toast.error('Please write at least 10 words before submitting.');
        return;
      }
      
      submitSessionMutation.mutate();
    } catch (error) {
      toast.error('Failed to verify essay. Please try again.');
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!currentSession) {
    // Check if coming from course or assignment URL
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('course');

    const filteredAssignments = courseId 
      ? assignments.filter(a => a.course_id === courseId)
      : assignments;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Writing Assignments</h1>
            <p className="text-slate-600">Select an assignment to begin writing</p>
          </div>

          <div className="grid gap-4">
            {filteredAssignments.map(assignment => {
              const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
              const isOverdue = dueDate && isPast(dueDate);
              const isDueSoon = dueDate && differenceInDays(dueDate, new Date()) <= 3;

              return (
                <Card key={assignment.id} className={`p-6 hover:shadow-lg transition-shadow ${
                  isOverdue ? 'border-rose-300 border-2' : isDueSoon ? 'border-amber-300 border-2' : ''
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-slate-900">
                          {assignment.title}
                        </h3>
                        {dueDate && (
                          <Badge variant="outline" className={`${
                            isOverdue 
                              ? 'border-rose-300 bg-rose-50 text-rose-700'
                              : isDueSoon
                              ? 'border-amber-300 bg-amber-50 text-amber-700'
                              : 'border-slate-300 bg-slate-50 text-slate-700'
                          }`}>
                            Due {format(dueDate, 'MMM d, h:mm a')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-600 mb-4 whitespace-pre-wrap line-clamp-3">
                        {assignment.prompt}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>{assignment.subject}</span>
                        <span>•</span>
                        <span>{assignment.grade_level}</span>
                        <span>•</span>
                        <span>{assignment.word_target} words</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleStartAssignment(assignment)}
                      className="ml-4 bg-slate-900 hover:bg-slate-800"
                    >
                      Start Writing
                    </Button>
                  </div>
                </Card>
              );
            })}

            {filteredAssignments.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                No active assignments available
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {selectedAssignment?.title}
            </h2>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={submitSessionMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Submit Essay
          </Button>
        </div>
      </div>

      {/* Writing Canvas */}
      <div className="max-w-5xl mx-auto py-8">
        <div className="bg-white rounded-lg shadow-2xl min-h-[600px]">
          <WritingCanvas
            sessionId={currentSession.id}
            initialText=""
          />
        </div>
      </div>
    </div>
  );
}