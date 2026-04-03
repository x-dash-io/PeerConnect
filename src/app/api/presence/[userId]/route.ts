import { getUserPresence } from "@/lib/redis"
import { NextResponse } from "next/server"

export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const presence = await getUserPresence(userId)
  return NextResponse.json(presence || { status: "offline", lastSeen: null })
}
