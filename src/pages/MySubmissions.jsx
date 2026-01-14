import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import IntegrityBadge from '../components/analytics/IntegrityBadge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MySubmissions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate(createPageUrl('Home')));
  }, []);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['my-sessions', user?.email],
    queryFn: () => base44.entities.Session.filter({ student_email: user.email }, '-created_date'),
    enabled: !!user
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => base44.entities.Assignment.list()
  });

  const { data: revealRequests = [] } = useQuery({
    queryKey: ['reveal-requests', user?.email],
    queryFn: () => base44.entities.RevealRequest.filter({ student_email: user.email }),
    enabled: !!user
  });

  const requestRevealMutation = useMutation({
    mutationFn: async (sessionId) => {
      const session = sessions.find(s => s.id === sessionId);
      return base44.entities.RevealRequest.create({
        session_id: sessionId,
        student_email: user.email,
        student_name: user.full_name,
        requested_at: new Date().toISOString(),
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reveal-requests']);
      toast.success('Request submitted', {
        description: 'Your teacher will review your request to view the forensic data.'
      });
    }
  });

  const getRevealStatus = (sessionId) => {
    return revealRequests.find(r => r.session_id === sessionId);
  };

  const canViewForensics = (sessionId) => {
    const request = getRevealStatus(sessionId);
    return request?.status === 'approved';
  };

  const submittedSessions = sessions.filter(s => s.status === 'submitted');
  const inProgressSessions = sessions.filter(s => s.status === 'in_progress');

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Submissions</h1>
          <p className="text-slate-600">View your essay submissions and integrity scores</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total Submitted</p>
                  <p className="text-3xl font-bold text-slate-900">{submittedSessions.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Avg Integrity</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {submittedSessions.length > 0
                      ? Math.round(submittedSessions.reduce((sum, s) => sum + s.integrity_score, 0) / submittedSessions.length)
                      : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">In Progress</p>
                  <p className="text-3xl font-bold text-amber-600">{inProgressSessions.length}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions List */}
        <Card className="border-none shadow-md">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg">Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Assignment</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Submitted</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Words</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Integrity</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Forensics</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {submittedSessions.map(session => {
                    const assignment = assignments.find(a => a.id === session.assignment_id);
                    const revealStatus = getRevealStatus(session.id);
                    const canView = canViewForensics(session.id);

                    return (
                      <tr key={session.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <p className="font-medium text-slate-900">{assignment?.title || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{assignment?.subject}</p>
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {format(new Date(session.end_time), 'MMM d, HH:mm')}
                        </td>
                        <td className="p-4 text-sm text-slate-700 font-medium">
                          {session.word_count || 0}
                        </td>
                        <td className="p-4">
                          <IntegrityBadge score={session.integrity_score || 0} size="sm" showLabel={false} />
                        </td>
                        <td className="p-4">
                          {canView ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(createPageUrl(`StudentForensics?id=${session.id}`))}
                              className="flex items-center gap-1.5"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          ) : revealStatus?.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-amber-600">
                              <Clock className="w-4 h-4" />
                              Pending
                            </span>
                          ) : revealStatus?.status === 'denied' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-rose-600">
                              <XCircle className="w-4 h-4" />
                              Denied
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => requestRevealMutation.mutate(session.id)}
                              disabled={requestRevealMutation.isPending}
                            >
                              Request Access
                            </Button>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            {session.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {submittedSessions.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  No submissions yet. Start writing your first essay!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">About Forensic Data</p>
                <p className="text-blue-700">
                  To protect academic integrity, detailed forensic recordings (keystroke timeline, WPM graphs, etc.) 
                  are only accessible with teacher approval. You can request access to review your own writing process data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}