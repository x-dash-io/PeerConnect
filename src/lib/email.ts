const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@peerconnect.app"
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000"

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

  if (!RESEND_API_KEY) {
    console.log(`[Email] Would send password reset to ${email}`)
    console.log(`[Email] Reset URL: ${resetUrl}`)
    return
  }

  const { Resend } = await import("resend")
  const resend = new Resend(RESEND_API_KEY)

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset your PeerConnect password",
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  })
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`

  if (!RESEND_API_KEY) {
    console.log(`[Email] Would send verification to ${email}`)
    console.log(`[Email] Verification URL: ${verifyUrl}`)
    return
  }

  const { Resend } = await import("resend")
  const resend = new Resend(RESEND_API_KEY)

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your PeerConnect email",
    html: `
      <p>Welcome to PeerConnect!</p>
      <p><a href="${verifyUrl}">Click here to verify your email</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  })
}

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  if (!RESEND_API_KEY) {
    console.log(`[Email] Would send to ${options.to}: ${options.subject}`)
    return
  }

  const { Resend } = await import("resend")
  const resend = new Resend(RESEND_API_KEY)

  await resend.emails.send({
    from: FROM_EMAIL,
    to: options.to,
    subject: options.subject,
    html: options.html,
  })
}
