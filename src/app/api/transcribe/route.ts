import { auth } from "@/lib/auth"
import { getDownloadUrl } from "@/lib/s3"
import { db } from "@/lib/db"
import { messages } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
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
    // Stream the audio file from S3 via a 5-minute signed URL
    const signedUrl = await getDownloadUrl(s3Key, 300)
    const audioResponse = await fetch(signedUrl)

    if (!audioResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch audio from S3" }, { status: 502 })
    }

    const audioBuffer = await audioResponse.arrayBuffer()
    const audioFile = new File([audioBuffer], "audio.webm", { type: "audio/webm" })

    // Transcribe with Whisper
    const result = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    })

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
