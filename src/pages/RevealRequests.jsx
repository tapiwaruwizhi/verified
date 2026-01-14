import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RevealRequests() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['reveal-requests'],
    queryFn: () => base44.entities.RevealRequest.list('-created_date')
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list()
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => base44.entities.Assignment.list()
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ requestId, status, notes }) => {
      const user = await base44.auth.me();
      return base44.entities.RevealRequest.update(requestId, {
        status,
        reviewed_by: user.email,
        reviewed_at: new Date().toISOString(),
        admin_notes: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reveal-requests']);
      setSelectedRequest(null);
      setAdminNotes('');
      toast.success('Request reviewed');
    }
  });

  const handleApprove = (request) => {
    reviewMutation.mutate({
      requestId: request.id,
      status: 'approved',
      notes: adminNotes
    });
  };

  const handleDeny = (request) => {
    if (!adminNotes.trim()) {
      toast.error('Please provide a reason for denial');
      return;
    }
    reviewMutation.mutate({
      requestId: request.id,
      status: 'denied',
      notes: adminNotes
    });
  };

  const getSession = (sessionId) => sessions.find(s => s.id === sessionId);
  const getAssignment = (assignmentId) => assignments.find(a => a.id === assignmentId);

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const reviewedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Forensic Data Requests</h1>
          <p className="text-slate-600">Review student requests to access their writing process recordings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-amber-600">{pendingRequests.length}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Approved</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {requests.filter(r => r.status === 'approved').length}
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
                  <p className="text-sm text-slate-500 mb-1">Denied</p>
                  <p className="text-3xl font-bold text-rose-600">
                    {requests.filter(r => r.status === 'denied').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-rose-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <Card className="mb-6 border-amber-200 shadow-md">
            <CardHeader className="border-b border-slate-100 bg-amber-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Pending Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {pendingRequests.map(request => {
                const session = getSession(request.session_id);
                const assignment = getAssignment(session?.assignment_id);
                const isExpanded = selectedRequest?.id === request.id;

                return (
                  <div key={request.id} className="border-b border-slate-100 last:border-b-0">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-1">{request.student_name}</h3>
                          <p className="text-sm text-slate-600 mb-2">{request.student_email}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span>{assignment?.title || 'Unknown Assignment'}</span>
                            <span>•</span>
                            <span>Requested {format(new Date(request.requested_at), 'MMM d, HH:mm')}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(createPageUrl(`SessionAnalysis?id=${session.id}`))}
                          className="flex items-center gap-1.5"
                        >
                          <Eye className="w-4 h-4" />
                          View Session
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 space-y-4">
                          <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">
                              Admin Notes (optional for approval, required for denial)
                            </label>
                            <Textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="Add notes about this decision..."
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleApprove(request)}
                              disabled={reviewMutation.isPending}
                              className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve Access
                            </Button>
                            <Button
                              onClick={() => handleDeny(request)}
                              disabled={reviewMutation.isPending}
                              variant="destructive"
                              className="flex items-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Deny
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedRequest(null);
                                setAdminNotes('');
                              }}
                              variant="outline"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {!isExpanded && (
                        <div className="flex gap-3 mt-4">
                          <Button
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            Review Request
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Reviewed Requests */}
        <Card className="shadow-md">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg">Request History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Student</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Assignment</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Requested</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Reviewed By</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewedRequests.map(request => {
                    const session = getSession(request.session_id);
                    const assignment = getAssignment(session?.assignment_id);

                    return (
                      <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4">
                          <p className="font-medium text-slate-900">{request.student_name}</p>
                          <p className="text-xs text-slate-500">{request.student_email}</p>
                        </td>
                        <td className="p-4 text-sm text-slate-700">
                          {assignment?.title || 'Unknown'}
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {format(new Date(request.requested_at), 'MMM d, HH:mm')}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            request.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {request.reviewed_by || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {reviewedRequests.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  No reviewed requests yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}