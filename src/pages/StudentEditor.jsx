import React, { useState, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Send } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { createPageUrl } from "@/utils"
import WritingCanvas from "../components/editor/WritingCanvas"
import { toast } from "sonner"
import { useAuth } from "@/lib/AuthContext"
import { apiFetch } from "@/lib/api"

export default function StudentEditor() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  /** @type {React.MutableRefObject<{ flushEvents: () => Promise<void> } | null>} */
  const canvasRef = useRef(null)

  const [selectedAssignment, setSelectedAssignment] =
    useState(null)
  const [currentSession, setCurrentSession] =
    useState(null)

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => apiFetch("/assignments"),
    enabled: !!user,
  })

  const createSessionMutation = useMutation({
    mutationFn: (assignmentId) =>
      apiFetch("/sessions", {
        method: "POST",
        body: JSON.stringify({
          assignmentId,
          studentEmail: user.email,
          studentName: user.fullName,
          startTime: new Date().toISOString(),
        }),
      }),
    onSuccess: (session) => {
      setCurrentSession(session)
      toast.success("Session started.")
    },
  })

  const submitSessionMutation = useMutation({
    mutationFn: async () => {
      await canvasRef.current?.flushEvents()

      return apiFetch(`/sessions/${currentSession.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "submitted",
          endTime: new Date().toISOString(),
        }),
      })
    },
    onSuccess: () => {
      toast.success("Essay submitted")
      queryClient.invalidateQueries({
        queryKey: ["sessions"],
      })
      navigate(createPageUrl("MySubmissions"))
    },
  })

  if (!currentSession) {
    return (
      <div className="p-8">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="p-6 mb-4">
            <h3>{assignment.title}</h3>
            <Button
              onClick={() =>
                createSessionMutation.mutate(assignment.id)
              }
            >
              Start Writing
            </Button>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="p-8">
      <WritingCanvas
        ref={canvasRef}
        sessionId={currentSession.id}
      />

      <Button
        onClick={() => submitSessionMutation.mutate()}
        className="mt-6 bg-emerald-600"
      >
        <Send className="w-4 h-4 mr-2" />
        Submit Essay
      </Button>
    </div>
  )
}
