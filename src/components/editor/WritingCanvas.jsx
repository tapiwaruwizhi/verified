import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react"
import { toast } from "sonner"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"
import "@/styles/quill.css"

/**
 * @typedef {{
 *   sessionId: string,
 *   onEventCapture?: (event: any) => void,
 *   initialText?: string
 * }} WritingCanvasProps
 */

/**
 * @typedef {{
 *   flushEvents: () => Promise<void>
 * }} WritingCanvasHandle
 */

/** @type {React.ForwardRefExoticComponent<
 *   WritingCanvasProps & React.RefAttributes<WritingCanvasHandle>
 * >}
 */
const WritingCanvas = forwardRef(
  ({ sessionId, onEventCapture, initialText = "" }, ref) => {
    const [text, setText] = useState(initialText)
    const [isSaving, setIsSaving] = useState(false)

    const quillRef = useRef(null)
    const lastKeystrokeTime = useRef(Date.now())
    const sessionStartTime = useRef(Date.now())
    const eventBuffer = useRef([])
    const textSaveTimeout = useRef(null)

    const captureEvent = (eventType, payload = {}) => {
      const editor = quillRef.current?.getEditor()

      const event = {
        session_id: sessionId,
        timestamp: Date.now() - sessionStartTime.current,
        event_type: eventType,
        payload: {
          ...payload,
          position: editor?.getSelection()?.index || 0,
        },
        text_snapshot: text,
      }

      eventBuffer.current.push(event)
      onEventCapture?.(event)

      if (eventBuffer.current.length >= 10) {
        flushEvents()
      }
    }

    const flushEvents = async () => {
      if (!eventBuffer.current.length) return

      const eventsToSave = [...eventBuffer.current]
      eventBuffer.current = []

      try {
        await fetch("/api/events/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(eventsToSave),
        })
      } catch (err) {
        console.error("Event flush failed", err)
      }
    }

    useImperativeHandle(ref, () => ({
      flushEvents,
    }))

    useEffect(() => {
      return () => {
        if (textSaveTimeout.current) {
          clearTimeout(textSaveTimeout.current)
        }
        flushEvents()
      }
    }, [])

    useEffect(() => {
      const editor = quillRef.current?.getEditor()
      if (!editor) return

      const root = editor.root

      const handlePaste = (e) => {
        const pastedText =
          e.clipboardData?.getData("text/plain") || ""

        const wordCount = pastedText
          .split(/\s+/)
          .filter(Boolean).length

        if (wordCount > 5) {
          captureEvent("paste", {
            text: pastedText,
            word_count: wordCount,
          })

          toast.warning("Paste recorded", {
            description: `${wordCount} words detected.`,
          })
        }
      }

      root.addEventListener("paste", handlePaste)

      return () => {
        root.removeEventListener("paste", handlePaste)
      }
    }, [sessionId])

    const handleKeyDown = (e) => {
      const now = Date.now()
      const flightTime = now - lastKeystrokeTime.current
      lastKeystrokeTime.current = now

      if (e.key.length === 1) {
        captureEvent("insert", {
          text: e.key,
          flight_time: flightTime,
        })
      } else if (e.key === "Backspace" || e.key === "Delete") {
        captureEvent("delete", { flight_time: flightTime })
      }
    }

    const handleChange = (content, _delta, _source, editor) => {
      const plainText = editor.getText()
      setText(content)
      setIsSaving(true)

      clearTimeout(textSaveTimeout.current)

      textSaveTimeout.current = setTimeout(async () => {
        try {
          await fetch(`/api/sessions/${sessionId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              final_text: content,
              word_count: plainText
                .split(/\s+/)
                .filter(Boolean).length,
            }),
          })
          setIsSaving(false)
        } catch {
          setIsSaving(false)
        }
      }, 2000)
    }

    return (
      <div className="relative w-full h-full flex flex-col">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Begin writing..."
          className="flex-1 bg-white"
        />

        <div className="absolute top-4 right-4 text-xs">
          {isSaving ? "Saving..." : "Saved"}
        </div>
      </div>
    )
  }
)

export default WritingCanvas
