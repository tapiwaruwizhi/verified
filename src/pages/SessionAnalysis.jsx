import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import IntegrityBadge from '../components/analytics/IntegrityBadge';
import TimelinePlayer from '../components/analytics/TimelinePlayer';
import WPMGraph from '../components/analytics/WPMGraph';
import StruggleHeatmap from '../components/analytics/StruggleHeatmap';
import CitationChecker from '../components/analytics/CitationChecker';

export default function SessionAnalysis() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(null);
  const [currentTimelinePosition, setCurrentTimelinePosition] = useState(0);
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get('id'));
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

  const { data: assignment } = useQuery({
    queryKey: ['assignment', session?.assignment_id],
    queryFn: () => base44.entities.Assignment.filter({ id: session.assignment_id }).then(r => r[0]),
    enabled: !!session?.assignment_id
  });

  // Update displayed text based on timeline position
  useEffect(() => {
    if (!events.length) return;

    // Find the event closest to current timeline position
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

  const handleExportCertificate = () => {
    const certificate = `
CERTIFICATE OF AUTHORSHIP
VerifiEd Process Verification System

Student: ${session.student_name}
Email: ${session.student_email}
Assignment: ${assignment?.title}

Session Details:
- Start Time: ${format(new Date(session.start_time), 'PPpp')}
- End Time: ${format(new Date(session.end_time), 'PPpp')}
- Net Writing Time: ${Math.round(session.net_writing_time / 60)} minutes
- Word Count: ${session.word_count}

Integrity Metrics:
- Overall Score: ${session.integrity_score}%
- Paste Events: ${session.paste_count}
- Focus Loss Events: ${session.focus_lost_count}

Certificate Hash: ${btoa(session.id + session.created_date).substring(0, 64)}

This certificate verifies that the writing process was recorded and analyzed.
Generated: ${format(new Date(), 'PPpp')}
    `.trim();

    const blob = new Blob([certificate], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificate_${session.student_name}_${Date.now()}.txt`;
    a.click();
  };

  if (!session || !events) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <Button
              onClick={handleExportCertificate}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Certificate
            </Button>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {assignment?.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span>{session.student_name}</span>
                <span>•</span>
                <span>{session.student_email}</span>
                <span>•</span>
                <span>Submitted {format(new Date(session.end_time), 'PPp')}</span>
              </div>
            </div>
            <IntegrityBadge score={session.integrity_score} size="lg" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Document & Struggle Map */}
          <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Final Document
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="prose prose-sm max-w-none">
                  <div className="bg-slate-50 rounded-lg p-6 max-h-96 overflow-y-auto">
                    <p className="whitespace-pre-wrap text-slate-700 leading-relaxed font-serif">
                      {displayedText || session.final_text}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                  <span>{session.word_count} words</span>
                  <span>{Math.round(session.net_writing_time / 60)} minutes writing time</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardContent className="p-6">
                <StruggleHeatmap text={session.final_text} events={events} />
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Evidence Locker */}
          <div className="space-y-6">
            {/* Session Metadata */}
            <Card className="shadow-md">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-lg">Session Metadata</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 mb-1">Start Time</p>
                    <p className="font-medium text-slate-900">
                      {format(new Date(session.start_time), 'HH:mm:ss')}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">End Time</p>
                    <p className="font-medium text-slate-900">
                      {format(new Date(session.end_time), 'HH:mm:ss')}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Paste Events</p>
                    <p className="font-medium text-slate-900">{session.paste_count}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Focus Lost</p>
                    <p className="font-medium text-slate-900">{session.focus_lost_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Player */}
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

            {/* Citation Checker */}
            <Card className="shadow-md">
              <CardContent className="p-6">
                <CitationChecker events={events} finalText={session.final_text} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}