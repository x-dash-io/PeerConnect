import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Prevent multiple connections in development (Next.js hot reload)
declare global {
  var __db: ReturnType<typeof drizzle> | undefined
}

const connectionString = process.env.DATABASE_URL!

// For local dev (postgres-js driver)
const client = postgres(connectionString, {
  max: process.env.NODE_ENV === "production" ? 10 : 1,
})

export const db = global.__db || drizzle(client, { schema })

if (process.env.NODE_ENV !== "production") {
  global.__db = db
}
