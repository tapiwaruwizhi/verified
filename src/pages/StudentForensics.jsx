import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import IntegrityBadge from '../components/analytics/IntegrityBadge';
import TimelinePlayer from '../components/analytics/TimelinePlayer';
import WPMGraph from '../components/analytics/WPMGraph';

export default function StudentForensics() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(null);
  const [user, setUser] = useState(null);
  const [currentTimelinePosition, setCurrentTimelinePosition] = useState(0);
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get('id'));
    base44.auth.me().then(setUser).catch(() => navigate(createPageUrl('Home')));
  }, []);

  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => base44.entities.Session.filter({ id: sessionId }).then(r => r[0]),
    enabled: !!sessionId
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events', sessionId],
    queryFn: () => base44.entities.Event.filter({ session_id: sessionId }, 'timestamp'),
    enabled: !!sessionId
  });

  const { data: revealRequest } = useQuery({
    queryKey: ['reveal-request', sessionId, user?.email],
    queryFn: () => base44.entities.RevealRequest.filter({ 
      session_id: sessionId, 
      student_email: user.email 
    }).then(r => r[0]),
    enabled: !!sessionId && !!user
  });

  // Security check
  const hasAccess = session && user && 
    session.student_email === user.email && 
    revealRequest?.status === 'approved';

  useEffect(() => {
    if (!events.length) return;

    const relevantEvents = events.filter(e => e.timestamp <= currentTimelinePosition);
    if (relevantEvents.length > 0) {
      const lastEvent = relevantEvents[relevantEvents.length - 1];
      setDisplayedText(lastEvent.text_snapshot || session?.final_text || '');
    } else {
      setDisplayedText('');
    }
  }, [currentTimelinePosition, events, session]);

  const sessionDuration = session?.end_time && session?.start_time
    ? new Date(session.end_time) - new Date(session.start_time)
    : 0;

  if (!session || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600 mb-6">
              {revealRequest?.status === 'pending' 
                ? 'Your request is pending teacher approval.'
                : revealRequest?.status === 'denied'
                ? 'Your request to view forensic data was denied.'
                : 'You need teacher approval to view forensic recordings.'}
            </p>
            <Button onClick={() => navigate(createPageUrl('MySubmissions'))}>
              Back to Submissions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('MySubmissions'))}
            className="flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Submissions
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">My Writing Process</h1>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span>Submitted {format(new Date(session.end_time), 'PPp')}</span>
              </div>
            </div>
            <IntegrityBadge score={session.integrity_score} size="lg" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Final Document */}
          <Card className="shadow-md">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg">Final Document</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-slate-50 rounded-lg p-6 max-h-96 overflow-y-auto">
                <p className="whitespace-pre-wrap text-slate-700 leading-relaxed font-serif">
                  {displayedText || session.final_text}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>{session.word_count} words</span>
                <span>{Math.round(session.net_writing_time / 60)} minutes</span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="shadow-md">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg">Session Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <TimelinePlayer
                events={events}
                sessionDuration={sessionDuration}
                onTimeUpdate={setCurrentTimelinePosition}
              />
            </CardContent>
          </Card>

          {/* WPM Graph */}
          <Card className="shadow-md">
            <CardContent className="p-6">
              <WPMGraph events={events} sessionDuration={sessionDuration} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}