import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { files } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { fileId } = await req.json()

  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 })
  }

  await db
    .update(files)
    .set({ uploadStatus: "COMPLETE", updatedAt: new Date() })
    .where(eq(files.id, fileId))

  return NextResponse.json({ success: true })
}
