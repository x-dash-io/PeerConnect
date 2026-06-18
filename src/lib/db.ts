import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

// Prevent multiple connections in development (Next.js hot reload)
declare global {
  var __db: ReturnType<typeof drizzle> | undefined
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables")
}

// For local dev and standard postgres (node-postgres)
const pool = new Pool({
  connectionString,
  max: process.env.NODE_ENV === "production" ? 10 : 1,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
})

// Error handling for the pool
pool.on("error", (err) => {
  console.error("[Database] Unexpected error on idle client", err)
  if (err.message.includes("ECONNREFUSED")) {
    console.warn(
      "\x1b[33m[Database] Connection Refused! Is your PostgreSQL server running on port 5432?\x1b[0m",
    )
  }
})

export const db = global.__db || drizzle(pool, { schema })

if (process.env.NODE_ENV !== "production") {
  global.__db = db
}

export async function closeDb(): Promise<void> {
  await pool.end()
}
