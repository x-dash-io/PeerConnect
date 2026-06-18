import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()

  cookieStore.delete("authjs.session-token")
  cookieStore.delete("__Secure-authjs.session-token")
  cookieStore.delete("next-auth.session-token")
  cookieStore.delete("__Secure-next-auth.session-token")

  const origin = request.nextUrl.origin
  return NextResponse.redirect(new URL("/login", origin))
}
