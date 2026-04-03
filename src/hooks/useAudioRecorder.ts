import { useRef, useState, useCallback } from "react"

export type RecordingState = "idle" | "recording" | "stopped"

export interface AudioRecorderReturn {
  state: RecordingState
  duration: number
  audioBlob: Blob | null
  analyser: AnalyserNode | null
  start: () => Promise<void>
  stop: () => void
  cancel: () => void
}

export function useAudioRecorder(): AudioRecorderReturn {
  const [state, setState] = useState<RecordingState>("idle")
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up Web Audio analyser for live waveform
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const src = ctx.createMediaStreamSource(stream)
      const analyserNode = ctx.createAnalyser()
      analyserNode.fftSize = 256
      analyserNode.smoothingTimeConstant = 0.8
      src.connect(analyserNode)
      setAnalyser(analyserNode)

      // Prefer audio/webm, fallback to supported type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : ""

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        })
        setAudioBlob(blob)
        // Release mic
        streamRef.current?.getTracks().forEach((t) => t.stop())
      }

      recorder.start(100) // collect every 100ms
      mediaRecorderRef.current = recorder
      setState("recording")

      let secs = 0
      timerRef.current = setInterval(() => setDuration(++secs), 1000)
    } catch (err) {
      console.error("[AudioRecorder] Failed to start:", err)
      throw err
    }
  }, [])

  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop()
    clearInterval(timerRef.current)
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close()
    }
    setState("stopped")
  }, [])

  const cancel = useCallback(() => {
    mediaRecorderRef.current?.stop()
    clearInterval(timerRef.current)
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close()
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setAudioBlob(null)
    setAnalyser(null)
    setDuration(0)
    setState("idle")
  }, [])

  return { state, duration, audioBlob, analyser, start, stop, cancel }
}
