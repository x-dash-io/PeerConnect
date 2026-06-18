import { config } from "dotenv"
config({ path: ".env.local" })
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import bcrypt from "bcryptjs"
import { customAlphabet } from "nanoid"
import { users, conversations, conversationParticipants, messages } from "../src/lib/schema"

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 21)
const generateId = () => nanoid()

const connectionString = process.env.DATABASE_URL!
if (!connectionString) {
  console.error("DATABASE_URL is not set")
  process.exit(1)
}

const client = postgres(connectionString, { max: 1 })
const db = drizzle(client)

const SEED_PASSWORD = "password123"

const seedUsers = [
  {
    id: generateId(),
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "PEER" as const,
    bio: "Product designer who loves clean interfaces",
  },
  {
    id: generateId(),
    name: "Bob Martinez",
    email: "bob@example.com",
    role: "BUSINESS" as const,
    bio: "Running a small SaaS company",
  },
  {
    id: generateId(),
    name: "Carol Chen",
    email: "carol@example.com",
    role: "FREELANCER" as const,
    bio: "Full-stack developer available for projects",
  },
  {
    id: generateId(),
    name: "Dave Wilson",
    email: "dave@example.com",
    role: "PEER" as const,
    bio: "Engineering manager at a fintech startup",
  },
  {
    id: generateId(),
    name: "Eve Santos",
    email: "eve@example.com",
    role: "FREELANCER" as const,
    bio: "UX researcher and content strategist",
  },
]

async function seed() {
  console.log("Seeding database...")

  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10)
  const now = new Date()

  // Insert users
  for (const u of seedUsers) {
    await db
      .insert(users)
      .values({
        id: u.id,
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        bio: u.bio,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({ target: users.email })

    console.log(`  + User: ${u.name} (${u.email}) [${u.role}]`)
  }

  // Create a few conversations between users
  const convos = [
    {
      between: [0, 1],
      messages: ["Hey Bob, how's the SaaS going?", "Going great! Just hit 100 users."],
    },
    {
      between: [0, 2],
      messages: ["Carol, are you free for a project?", "Sure, send me the details!"],
    },
    {
      between: [1, 3],
      messages: ["Dave, want to grab coffee?", "Absolutely, Thursday works for me."],
    },
  ]

  for (const c of convos) {
    const convId = generateId()
    const user1 = seedUsers[c.between[0]]
    const user2 = seedUsers[c.between[1]]

    await db.insert(conversations).values({ id: convId, type: "DIRECT", createdAt: now })

    await db.insert(conversationParticipants).values([
      { conversationId: convId, userId: user1.id, joinedAt: now },
      { conversationId: convId, userId: user2.id, joinedAt: now },
    ])

    // Insert messages with staggered timestamps
    for (let i = 0; i < c.messages.length; i++) {
      const senderId = i % 2 === 0 ? user1.id : user2.id
      const msgTime = new Date(now.getTime() + i * 60_000) // 1 min apart

      await db.insert(messages).values({
        id: generateId(),
        conversationId: convId,
        senderId,
        content: c.messages[i],
        type: "TEXT",
        status: "DELIVERED",
        createdAt: msgTime,
        updatedAt: msgTime,
      })
    }

    console.log(`  + Conversation: ${user1.name} <-> ${user2.name} (${c.messages.length} messages)`)
  }

  console.log("\n Seed complete!")
  console.log(`\n   Login with any seeded user:`)
  console.log(`   Email:    alice@example.com (or bob, carol, dave, eve)`)
  console.log(`   Password: ${SEED_PASSWORD}`)

  await client.end()
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
