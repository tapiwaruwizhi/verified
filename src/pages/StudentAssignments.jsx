import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Award, BookOpen, Clock, CheckCircle } from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function StudentAssignments() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate(createPageUrl('Home')));
  }, []);

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => base44.entities.Assignment.filter({ status: 'active' }),
    enabled: !!user
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list()
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['my-sessions'],
    queryFn: () => base44.entities.Session.filter({ student_email: user.email }),
    enabled: !!user
  });

  const getAssignmentStatus = (assignment) => {
    const session = sessions.find(s => s.assignment_id === assignment.id);
    if (session?.status === 'submitted' || session?.status === 'reviewed') {
      return { status: 'submitted', session };
    }
    if (session?.status === 'in_progress') {
      return { status: 'in_progress', session };
    }
    if (assignment.due_date && isPast(new Date(assignment.due_date))) {
      return { status: 'overdue', session: null };
    }
    return { status: 'available', session: null };
  };

  const getCourse = (courseId) => courses.find(c => c.id === courseId);

  const startAssignment = async (assignment) => {
    const session = await base44.entities.Session.create({
      assignment_id: assignment.id,
      student_email: user.email,
      student_name: user.full_name,
      start_time: new Date().toISOString(),
      status: 'in_progress'
    });
    navigate(createPageUrl('StudentEditor') + `?assignment_id=${assignment.id}`);
  };

  const continueAssignment = (session) => {
    navigate(createPageUrl('StudentEditor') + `?assignment_id=${session.assignment_id}`);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Assignments</h1>
          <p className="text-slate-600">View and complete your writing assignments</p>
        </div>

        {loadingAssignments ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          </div>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No assignments available yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map(assignment => {
              const { status, session } = getAssignmentStatus(assignment);
              const course = getCourse(assignment.course_id);
              const daysUntilDue = assignment.due_date ? differenceInDays(new Date(assignment.due_date), new Date()) : null;

              return (
                <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {course && (
                            <Badge variant="outline" className="text-xs">
                              <BookOpen className="w-3 h-3 mr-1" />
                              {course.name}
                            </Badge>
                          )}
                          {status === 'submitted' && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Submitted
                            </Badge>
                          )}
                          {status === 'in_progress' && (
                            <Badge className="bg-blue-100 text-blue-800">
                              In Progress
                            </Badge>
                          )}
                          {status === 'overdue' && (
                            <Badge className="bg-red-100 text-red-800">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl mb-1">{assignment.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {assignment.prompt}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <Badge className="bg-purple-100 text-purple-800">
                          <Award className="w-3 h-3 mr-1" />
                          {assignment.max_grade || 100} pts
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm text-slate-600">
                        {assignment.due_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Due {format(new Date(assignment.due_date), 'MMM d, yyyy')}</span>
                            {daysUntilDue !== null && daysUntilDue >= 0 && (
                              <Badge variant="outline" className="text-xs">
                                {daysUntilDue === 0 ? 'Today' : `${daysUntilDue}d left`}
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>{assignment.word_target} words</span>
                        </div>
                        {session?.grade !== undefined && (
                          <div className="flex items-center gap-2 font-medium text-slate-900">
                            <Award className="w-4 h-4" />
                            <span>Grade: {session.grade}/{assignment.max_grade || 100}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {status === 'available' && (
                          <Button onClick={() => startAssignment(assignment)}>
                            Start Assignment
                          </Button>
                        )}
                        {status === 'in_progress' && (
                          <Button onClick={() => continueAssignment(session)}>
                            Continue Writing
                          </Button>
                        )}
                        {status === 'submitted' && (
                          <Button variant="outline" onClick={() => navigate(createPageUrl('MySubmissions'))}>
                            View Submission
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}