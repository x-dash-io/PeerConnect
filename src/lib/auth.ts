import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "./db"
import { users } from "./schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { generateId } from "./id"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1)

        if (!user || !user.password) return null

        const valid = await bcrypt.compare(credentials.password as string, user.password)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as Record<string, unknown>).role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        ;(session.user as unknown as Record<string, unknown>).role = token.role
      }
      return session
    },
  },
})

// Helper to register a new user
export async function registerUser(data: {
  name: string
  email: string
  password: string
  role?: "PEER" | "BUSINESS" | "FREELANCER"
}) {
  const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1)
  if (existing.length > 0) throw new Error("Email already registered")

  const hashedPassword = await bcrypt.hash(data.password, 10)
  const id = generateId()

  const [user] = await db
    .insert(users)
    .values({
      id,
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || "PEER",
      updatedAt: new Date(),
    })
    .returning()

  return user
}
