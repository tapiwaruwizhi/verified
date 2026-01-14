import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, FileText, Users, TrendingUp, Eye } from 'lucide-react';
import IntegrityBadge from '../components/analytics/IntegrityBadge';
import { format } from 'date-fns';

export default function TeacherDashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list('-created_date')
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => base44.entities.Assignment.list()
  });

  const filteredSessions = sessions.filter(session => 
    session.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.student_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalSubmissions: sessions.filter(s => s.status === 'submitted').length,
    averageIntegrity: sessions.length > 0 
      ? Math.round(sessions.reduce((sum, s) => sum + (s.integrity_score || 0), 0) / sessions.length)
      : 0,
    flaggedSessions: sessions.filter(s => s.integrity_score < 70).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Forensic Dashboard</h1>
          <p className="text-slate-600">Process-based assessment analytics</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total Submissions</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalSubmissions}</p>
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
                  <p className="text-3xl font-bold text-emerald-600">{stats.averageIntegrity}%</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Flagged Sessions</p>
                  <p className="text-3xl font-bold text-rose-600">{stats.flaggedSessions}</p>
                </div>
                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-rose-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by student name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-slate-200"
            />
          </div>
        </div>

        {/* Sessions Table */}
        <Card className="border-none shadow-md">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Student</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Assignment</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Submitted</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Words</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Integrity</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map(session => {
                    const assignment = assignments.find(a => a.id === session.assignment_id);
                    return (
                      <tr key={session.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-slate-900">{session.student_name}</p>
                            <p className="text-xs text-slate-500">{session.student_email}</p>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-700">
                          {assignment?.title || 'Unknown'}
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {session.end_time ? format(new Date(session.end_time), 'MMM d, HH:mm') : '-'}
                        </td>
                        <td className="p-4 text-sm text-slate-700 font-medium">
                          {session.word_count || 0}
                        </td>
                        <td className="p-4">
                          <IntegrityBadge score={session.integrity_score || 0} size="sm" showLabel={false} />
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            session.status === 'submitted' 
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {session.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {session.status === 'submitted' && (
                            <Link 
                              to={createPageUrl(`SessionAnalysis?id=${session.id}`)}
                              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              <Eye className="w-4 h-4" />
                              Analyze
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredSessions.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  {searchQuery ? 'No sessions found' : 'No sessions yet'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}