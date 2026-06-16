import { auth } from "@/lib/auth"
import { getDownloadUrl } from "@/lib/s3"
import { db } from "@/lib/db"
import { messages } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { csrfGuard } from "@/lib/csrf"

export async function POST(req: NextRequest) {
  const guard = csrfGuard(req)
  if (guard) return guard

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { messageId, s3Key } = await req.json()

  if (!messageId || !s3Key) {
    return NextResponse.json({ error: "Missing messageId or s3Key" }, { status: 400 })
  }

  // Fetch the message
  const [message] = await db
    .select({ id: messages.id, metadata: messages.metadata })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1)

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 })
  }

  // Return cached transcription if already done
  const existingMeta = (message.metadata ?? {}) as Record<string, unknown>
  if (typeof existingMeta.transcription === "string") {
    return NextResponse.json({ transcription: existingMeta.transcription, cached: true })
  }

  try {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Transcription is not configured" }, { status: 503 })
    }

    const signedUrl = await getDownloadUrl(s3Key, 600)

    const form = new FormData()
    form.append("model", "whisper-large-v3-turbo")
    form.append("file", await fetch(signedUrl).then((r) => r.blob()), "audio.webm")

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("[Transcribe] Groq error:", errText)
      return NextResponse.json({ error: "Transcription failed" }, { status: 502 })
    }

    const result = (await res.json()) as { text: string }
    const transcription = result.text

    // Cache the transcription in message metadata
    await db
      .update(messages)
      .set({
        metadata: { ...existingMeta, transcription },
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId))

    return NextResponse.json({ transcription })
  } catch (error) {
    console.error("[Transcribe] Error:", error)
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 })
  }
}
