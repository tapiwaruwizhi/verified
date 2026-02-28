import React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Calendar,
  Award,
  BookOpen,
  CheckCircle,
} from "lucide-react"
import { format, isPast, differenceInDays } from "date-fns"
import { useNavigate } from "react-router-dom"
import { createPageUrl } from "@/utils"
import { useAuth } from "@/lib/AuthContext"
import { apiFetch } from "@/lib/api"

export default function StudentAssignments() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  /* ---------------- Queries ---------------- */

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => apiFetch("/assignments?status=active"),
    enabled: !!user,
  })

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => apiFetch("/courses"),
  })

  const { data: sessions = [] } = useQuery({
    queryKey: ["my-sessions"],
    queryFn: () => apiFetch(`/sessions?studentEmail=${user.email}`),
    enabled: !!user,
  })

  /* ---------------- Helpers ---------------- */

  const getCourse = (courseId) =>
    courses.find((c) => c.id === courseId)

  const getAssignmentStatus = (assignment) => {
    const session = sessions.find(
      (s) => s.assignmentId === assignment.id
    )

    if (session?.status === "submitted" || session?.status === "reviewed")
      return { status: "submitted", session }

    if (session?.status === "in_progress")
      return { status: "in_progress", session }

    if (assignment.dueDate && isPast(new Date(assignment.dueDate)))
      return { status: "overdue", session: null }

    return { status: "available", session: null }
  }

  /* ---------------- Mutations ---------------- */

  const createSessionMutation = useMutation({
    mutationFn: (assignment) =>
      apiFetch("/sessions", {
        method: "POST",
        body: JSON.stringify({
          assignmentId: assignment.id,
          studentEmail: user.email,
          studentName: user.fullName,
          startTime: new Date().toISOString(),
          status: "in_progress",
        }),
      }),
    onSuccess: (_, assignment) => {
      queryClient.invalidateQueries({ queryKey: ["my-sessions"] })
      navigate(
        createPageUrl("StudentEditor") +
          `?assignment=${assignment.id}`
      )
    },
  })

  const startAssignment = (assignment) => {
    createSessionMutation.mutate(assignment)
  }

  const continueAssignment = (session) => {
    navigate(
      createPageUrl("StudentEditor") +
        `?assignment=${session.assignmentId}`
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            My Assignments
          </h1>
          <p className="text-slate-600">
            View and complete your writing assignments
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto" />
          </div>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">
                No assignments available yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const { status, session } =
                getAssignmentStatus(assignment)

              const course = getCourse(
                assignment.courseId
              )

              const daysUntilDue = assignment.dueDate
                ? differenceInDays(
                    new Date(assignment.dueDate),
                    new Date()
                  )
                : null

              return (
                <Card
                  key={assignment.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex justify-between">
                      <div>
                        <div className="flex gap-2 mb-2">
                          {course && (
                            <Badge variant="outline">
                              <BookOpen className="w-3 h-3 mr-1" />
                              {course.name}
                            </Badge>
                          )}

                          {status === "submitted" && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Submitted
                            </Badge>
                          )}

                          {status === "in_progress" && (
                            <Badge className="bg-blue-100 text-blue-800">
                              In Progress
                            </Badge>
                          )}

                          {status === "overdue" && (
                            <Badge className="bg-red-100 text-red-800">
                              Overdue
                            </Badge>
                          )}
                        </div>

                        <CardTitle className="text-xl mb-1">
                          {assignment.title}
                        </CardTitle>

                        <CardDescription>
                          {assignment.prompt}
                        </CardDescription>
                      </div>

                      <Badge className="bg-purple-100 text-purple-800">
                        <Award className="w-3 h-3 mr-1" />
                        {assignment.maxGrade || 100} pts
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-6 text-sm text-slate-600">
                        {assignment.dueDate && (
                          <div className="flex gap-2 items-center">
                            <Calendar className="w-4 h-4" />
                            Due{" "}
                            {format(
                              new Date(assignment.dueDate),
                              "MMM d, yyyy"
                            )}
                            {daysUntilDue >= 0 && (
                              <Badge variant="outline">
                                {daysUntilDue === 0
                                  ? "Today"
                                  : `${daysUntilDue}d left`}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2 items-center">
                          <FileText className="w-4 h-4" />
                          {assignment.wordTarget} words
                        </div>

                        {session?.grade !== undefined && (
                          <div className="flex gap-2 font-medium">
                            <Award className="w-4 h-4" />
                            Grade: {session.grade}/
                            {assignment.maxGrade || 100}
                          </div>
                        )}
                      </div>

                      <div>
                        {status === "available" && (
                          <Button
                            onClick={() =>
                              startAssignment(assignment)
                            }
                          >
                            Start Assignment
                          </Button>
                        )}

                        {status === "in_progress" && (
                          <Button
                            onClick={() =>
                              continueAssignment(session)
                            }
                          >
                            Continue Writing
                          </Button>
                        )}

                        {status === "submitted" && (
                          <Button
                            variant="outline"
                            onClick={() =>
                              navigate(
                                createPageUrl(
                                  "MySubmissions"
                                )
                              )
                            }
                          >
                            View Submission
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
