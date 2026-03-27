import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const authProxy = auth((req) => {
  const isAuth = !!req.auth
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register")

  if (isAuthPage) {
    if (isAuth) return NextResponse.redirect(new URL("/dashboard", req.url))
    return NextResponse.next()
  }

  const isProtected = req.nextUrl.pathname.startsWith("/dashboard")
  if (isProtected && !isAuth) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
})

export { authProxy as proxy }

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
}
