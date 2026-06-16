import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { text } = await req.json()

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 })
  }

  if (text.length > 5000) {
    return NextResponse.json({ error: "Text is too long (max 5000 characters)" }, { status: 400 })
  }

  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "AI polishing is not configured" }, { status: 503 })
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful writing assistant. Rewrite the user's message to be more professional, clear, and polite while preserving the original intent and key details. Keep the same approximate length. Do not add any explanation or greeting — output only the rewritten message.",
          },
          {
            role: "user",
            content: text,
          },
        ],
        max_tokens: 1000,
        temperature: 0.5,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[AI Polish] OpenAI error:", err)
      return NextResponse.json({ error: "AI polishing failed" }, { status: 502 })
    }

    const data = await res.json()
    const polished = data.choices?.[0]?.message?.content?.trim()

    if (!polished) {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 502 })
    }

    return NextResponse.json({ original: text, polished })
  } catch (err) {
    console.error("[AI Polish] Error:", err)
    return NextResponse.json({ error: "AI polishing failed" }, { status: 502 })
  }
}
