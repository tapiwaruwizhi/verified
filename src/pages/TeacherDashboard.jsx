import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Link } from "react-router-dom"
import { createPageUrl } from "@/utils"
import { Search, FileText, Users, TrendingUp, Eye } from "lucide-react"
import IntegrityBadge from "../components/analytics/IntegrityBadge"
import { format } from "date-fns"
import { apiFetch } from "@/lib/api"

export default function TeacherDashboard() {
  const [searchQuery, setSearchQuery] = useState("")

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => apiFetch("/sessions"),
  })

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => apiFetch("/assignments"),
  })

  const filteredSessions = sessions.filter(
    (session) =>
      session.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.studentEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    totalSubmissions: sessions.filter((s) => s.status === "submitted").length,
    averageIntegrity:
      sessions.length > 0
        ? Math.round(
            sessions.reduce((sum, s) => sum + (s.integrityScore || 0), 0) /
              sessions.length
          )
        : 0,
    flaggedSessions: sessions.filter((s) => (s.integrityScore || 0) < 70)
      .length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      <div className="max-w-7xl mx-auto p-8">

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Forensic Dashboard
          </h1>
          <p className="text-slate-600">
            Process-based assessment analytics
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">
                    Total Submissions
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {stats.totalSubmissions}
                  </p>
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
                  <p className="text-sm text-slate-500 mb-1">
                    Avg Integrity
                  </p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {stats.averageIntegrity}%
                  </p>
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
                  <p className="text-sm text-slate-500 mb-1">
                    Flagged Sessions
                  </p>
                  <p className="text-3xl font-bold text-rose-600">
                    {stats.flaggedSessions}
                  </p>
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
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">Student</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">Assignment</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">Submitted</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">Words</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">Grade</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">Integrity</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">Status</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => {
                    const assignment = assignments.find(
                      (a) => a.id === session.assignmentId
                    )

                    return (
                      <tr key={session.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-slate-900">
                              {session.studentName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {session.studentEmail}
                            </p>
                          </div>
                        </td>

                        <td className="p-4 text-sm text-slate-700">
                          {assignment?.title || "Unknown"}
                        </td>

                        <td className="p-4 text-sm text-slate-600">
                          {session.endTime
                            ? format(new Date(session.endTime), "MMM d, HH:mm")
                            : "-"}
                        </td>

                        <td className="p-4 text-sm font-medium text-slate-700">
                          {session.wordCount || 0}
                        </td>

                        <td className="p-4">
                          {session.grade !== null && session.grade !== undefined ? (
                            <span className="font-bold">
                              {session.grade}%
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="p-4">
                          <IntegrityBadge
                            score={session.integrityScore || 0}
                            size="sm"
                            showLabel={false}
                          />
                        </td>

                        <td className="p-4">
                          <span className="text-xs font-medium">
                            {session.status}
                          </span>
                        </td>

                        <td className="p-4">
                          {session.status === "submitted" && (
                            <Link
                              to={createPageUrl(`SessionAnalysis?id=${session.id}`)}
                              className="inline-flex items-center gap-1.5 text-sm text-blue-600"
                            >
                              <Eye className="w-4 h-4" />
                              Analyze
                            </Link>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
