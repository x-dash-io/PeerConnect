import { auth } from "@/lib/auth"
import { s3, BUCKET } from "@/lib/s3"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { db } from "@/lib/db"
import { messages } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { csrfGuard } from "@/lib/csrf"

// Dynamic imports for heavy libs
async function extractText(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase()

  if (mimeType === "application/pdf" || ext === "pdf") {
    // pdfjs-dist v6+ uses different API
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
    // Set up worker for pdfjs-dist
    const pdfDocument = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise
    let text = ""
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map((item: { str: string }) => item.str).join(" ") + "\n"
    }
    return text.slice(0, 20000)
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword" ||
    ext === "docx" ||
    ext === "doc"
  ) {
    const mammoth = await import("mammoth")
    const { value: html } = await mammoth.convertToHtml({
      buffer,
    })
    // Strip HTML tags
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 20000)
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel" ||
    ext === "xlsx" ||
    ext === "xls"
  ) {
    const XLSX = await import("xlsx")
    const workbook = XLSX.read(buffer, { type: "buffer" })
    let text = ""
    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name]
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]
      text += rows.map((row) => row.filter(Boolean).join(", ")).join("\n") + "\n"
    }
    return text.slice(0, 20000)
  }

  // text/*
  return buffer.toString("utf-8").slice(0, 20000)
}

export async function POST(req: NextRequest) {
  const guard = csrfGuard(req)
  if (guard) return guard

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { s3Key, filename, mimeType, messageId } = await req.json()

  if (!s3Key || !filename) {
    return NextResponse.json({ error: "Missing s3Key or filename" }, { status: 400 })
  }

  // Check for cached summary
  if (messageId) {
    const [msg] = await db
      .select({ metadata: messages.metadata })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1)

    if (msg) {
      const meta = (msg.metadata ?? {}) as Record<string, unknown>
      if (typeof meta.summary === "string") {
        return NextResponse.json({
          summary: meta.summary,
          cached: true,
          charCount: meta.summaryCharCount ?? 0,
        })
      }
    }
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "AI summarization is not configured" }, { status: 503 })
  }

  try {
    // Download file from S3
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key })
    const { Body } = await s3.send(cmd)
    if (!Body) throw new Error("Empty file from S3")

    const chunks: Uint8Array[] = []
    for await (const chunk of Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // Extract text
    const extracted = await extractText(buffer, mimeType, filename)

    if (!extracted.trim()) {
      return NextResponse.json({ error: "No extractable text found in document" }, { status: 422 })
    }

    // Summarize via GROQ
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content:
              "Summarize the following document concisely in 3-5 bullet points. Capture the key topics, findings, or takeaways. Use clear, plain language. Output only the bullet points, one per line, starting with •",
          },
          { role: "user", content: extracted },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[Summarize] GROQ error:", err)
      return NextResponse.json({ error: "Summarization failed" }, { status: 502 })
    }

    const data = await res.json()
    const summary = data.choices?.[0]?.message?.content?.trim()

    if (!summary) {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 502 })
    }

    // Cache in message metadata
    if (messageId) {
      const [msg] = await db
        .select({ metadata: messages.metadata })
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1)

      if (msg) {
        const existingMeta = (msg.metadata ?? {}) as Record<string, unknown>
        await db
          .update(messages)
          .set({
            metadata: { ...existingMeta, summary, summaryCharCount: extracted.length },
            updatedAt: new Date(),
          })
          .where(eq(messages.id, messageId))
      }
    }

    return NextResponse.json({ summary, charCount: extracted.length })
  } catch (err) {
    console.error("[Summarize] Error:", err)
    return NextResponse.json({ error: "Summarization failed" }, { status: 500 })
  }
}
