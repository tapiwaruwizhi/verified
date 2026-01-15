import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BookOpen, Clock, FileText, Calendar, ChevronRight, AlertCircle } from 'lucide-react';
import { format, differenceInDays, isPast, isFuture } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function Courses() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.filter({ status: 'active' }),
    enabled: !!user
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => base44.entities.Assignment.list('-created_date'),
    enabled: !!user
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['my-sessions', user?.email],
    queryFn: () => base44.entities.Session.filter({ student_email: user.email }),
    enabled: !!user
  });

  const getAssignmentsForCourse = (courseId) => {
    return assignments.filter(a => a.course_id === courseId && a.status === 'active');
  };

  const getSessionForAssignment = (assignmentId) => {
    return sessions.find(s => s.assignment_id === assignmentId);
  };

  const getDeadlineStatus = (dueDate) => {
    if (!dueDate) return { label: 'No deadline', color: 'slate', urgent: false };
    
    const due = new Date(dueDate);
    const daysUntil = differenceInDays(due, new Date());

    if (isPast(due)) {
      return { label: 'Overdue', color: 'rose', urgent: true };
    } else if (daysUntil === 0) {
      return { label: 'Due today', color: 'rose', urgent: true };
    } else if (daysUntil === 1) {
      return { label: 'Due tomorrow', color: 'amber', urgent: true };
    } else if (daysUntil <= 3) {
      return { label: `${daysUntil} days left`, color: 'amber', urgent: true };
    } else if (daysUntil <= 7) {
      return { label: `${daysUntil} days left`, color: 'blue', urgent: false };
    } else {
      return { label: format(due, 'MMM d'), color: 'slate', urgent: false };
    }
  };

  const colorClasses = {
    blue: 'bg-blue-100 border-blue-200',
    emerald: 'bg-emerald-100 border-emerald-200',
    purple: 'bg-purple-100 border-purple-200',
    amber: 'bg-amber-100 border-amber-200',
    rose: 'bg-rose-100 border-rose-200',
    slate: 'bg-slate-100 border-slate-200',
    indigo: 'bg-indigo-100 border-indigo-200',
    pink: 'bg-pink-100 border-pink-200'
  };

  const colorTextClasses = {
    blue: 'text-blue-900',
    emerald: 'text-emerald-900',
    purple: 'text-purple-900',
    amber: 'text-amber-900',
    rose: 'text-rose-900',
    slate: 'text-slate-900',
    indigo: 'text-indigo-900',
    pink: 'text-pink-900'
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Get all active assignments not in any course
  const unassignedAssignments = assignments.filter(a => 
    !a.course_id && a.status === 'active'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Courses</h1>
          <p className="text-slate-600">View your courses and upcoming assignments</p>
        </div>

        {/* Urgent Deadlines Banner */}
        {assignments.some(a => {
          const status = getDeadlineStatus(a.due_date);
          return status.urgent && a.status === 'active' && !getSessionForAssignment(a.id);
        }) && (
          <Card className="mb-6 border-rose-300 bg-rose-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-rose-900 mb-1">Urgent Deadlines</h3>
                  <p className="text-sm text-rose-700">
                    You have {assignments.filter(a => {
                      const status = getDeadlineStatus(a.due_date);
                      return status.urgent && a.status === 'active' && !getSessionForAssignment(a.id);
                    }).length} assignment(s) due soon that haven't been submitted yet.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Courses Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.map(course => {
            const courseAssignments = getAssignmentsForCourse(course.id);
            const pendingAssignments = courseAssignments.filter(a => !getSessionForAssignment(a.id));
            const completedAssignments = courseAssignments.filter(a => getSessionForAssignment(a.id));

            return (
              <Card key={course.id} className={`shadow-md border-2 ${colorClasses[course.color] || colorClasses.blue}`}>
                <CardHeader className="border-b border-slate-200/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-5 h-5 text-slate-600" />
                        <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                          {course.code || course.subject}
                        </span>
                      </div>
                      <CardTitle className={`text-xl ${colorTextClasses[course.color] || colorTextClasses.blue}`}>
                        {course.name}
                      </CardTitle>
                      {course.teacher_name && (
                        <p className="text-sm text-slate-600 mt-1">{course.teacher_name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">
                        {courseAssignments.length}
                      </div>
                      <div className="text-xs text-slate-500">assignments</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {course.description && (
                    <p className="text-sm text-slate-600 mb-4">{course.description}</p>
                  )}

                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-slate-700">
                        <span className="font-semibold">{pendingAssignments.length}</span> pending
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span className="text-slate-700">
                        <span className="font-semibold">{completedAssignments.length}</span> submitted
                      </span>
                    </div>
                  </div>

                  {/* Assignments List */}
                  <div className="space-y-2">
                    {courseAssignments.slice(0, 3).map(assignment => {
                      const session = getSessionForAssignment(assignment.id);
                      const deadlineStatus = getDeadlineStatus(assignment.due_date);

                      return (
                        <div
                          key={assignment.id}
                          className="bg-white rounded-lg p-3 border border-slate-200 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-900 text-sm truncate">
                                {assignment.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                {assignment.due_date && (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      deadlineStatus.color === 'rose' 
                                        ? 'border-rose-300 bg-rose-50 text-rose-700'
                                        : deadlineStatus.color === 'amber'
                                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                                        : 'border-slate-300 bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {deadlineStatus.label}
                                  </Badge>
                                )}
                                <span className="text-xs text-slate-500">
                                  {assignment.word_target} words
                                </span>
                              </div>
                            </div>
                            <Link to={createPageUrl(`StudentEditor?assignment=${assignment.id}`)}>
                              <Button size="sm" variant={session ? 'outline' : 'default'}>
                                {session ? 'View' : 'Start'}
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}

                    {courseAssignments.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">
                        No assignments yet
                      </p>
                    )}

                    {courseAssignments.length > 3 && (
                      <div className="text-center pt-2">
                        <Link 
                          to={createPageUrl(`StudentEditor?course=${course.id}`)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View all {courseAssignments.length} assignments →
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Standalone Assignments (not in any course) */}
        {unassignedAssignments.length > 0 && (
          <Card className="mt-6 shadow-md">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg">Other Assignments</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-3">
                {unassignedAssignments.map(assignment => {
                  const session = getSessionForAssignment(assignment.id);
                  const deadlineStatus = getDeadlineStatus(assignment.due_date);

                  return (
                    <div
                      key={assignment.id}
                      className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 mb-1">
                            {assignment.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <Badge variant="outline" className="bg-white">
                              {assignment.subject}
                            </Badge>
                            {assignment.due_date && (
                              <Badge 
                                variant="outline" 
                                className={`${
                                  deadlineStatus.color === 'rose' 
                                    ? 'border-rose-300 bg-rose-50 text-rose-700'
                                    : deadlineStatus.color === 'amber'
                                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                                    : 'border-slate-300 bg-slate-50 text-slate-700'
                                }`}
                              >
                                <Calendar className="w-3 h-3 mr-1" />
                                {deadlineStatus.label}
                              </Badge>
                            )}
                            <span className="text-slate-500">{assignment.word_target} words</span>
                          </div>
                        </div>
                        <Link to={createPageUrl(`StudentEditor?assignment=${assignment.id}`)}>
                          <Button size="sm" variant={session ? 'outline' : 'default'}>
                            {session ? 'View' : 'Start'}
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {courses.length === 0 && unassignedAssignments.length === 0 && (
          <Card className="shadow-md">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Courses Yet</h3>
              <p className="text-slate-600">
                Your teacher will add you to courses and assign essays soon.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}