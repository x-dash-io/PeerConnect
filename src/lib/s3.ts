import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// Your S3 / R2 bucket must have a CORS policy allowing the app origin.
// Example policy for Cloudflare R2:
//   [
//     {
//       "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
//       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
//       "AllowedHeaders": ["*"],
//       "ExposeHeaders": ["ETag"]
//     }
//   ]
// The "ExposeHeaders: ETag" is required for multipart uploads to work.

export const BUCKET = process.env.CLOUDFLARE_R2_BUCKET || process.env.AWS_S3_BUCKET

const isS3Configured =
  (process.env.CLOUDFLARE_R2_ACCESS_KEY &&
    process.env.CLOUDFLARE_R2_SECRET_KEY &&
    process.env.CLOUDFLARE_R2_BUCKET &&
    process.env.CLOUDFLARE_R2_ENDPOINT) ||
  (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && BUCKET)

export const s3 = new S3Client({
  region: process.env.AWS_REGION || "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || "missing",
    secretAccessKey:
      process.env.CLOUDFLARE_R2_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || "missing",
  },
})

export function requireS3() {
  if (!isS3Configured || !BUCKET) {
    throw new Error(
      "S3/R2 not configured. Set CLOUDFLARE_R2_ACCESS_KEY, CLOUDFLARE_R2_SECRET_KEY, CLOUDFLARE_R2_BUCKET, and CLOUDFLARE_R2_ENDPOINT (or AWS equivalents).",
    )
  }
}

if (!isS3Configured) {
  console.warn(
    "\x1b[33m[S3] Cloudflare R2 or AWS credentials/bucket missing. File uploads will fail.\x1b[0m",
  )
}

export async function createMultipartUpload(key: string, contentType: string) {
  const cmd = new CreateMultipartUploadCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })
  const res = await s3.send(cmd)
  return { uploadId: res.UploadId!, key }
}

export async function getUploadPartUrl(key: string, uploadId: string, partNumber: number) {
  const cmd = new UploadPartCommand({
    Bucket: BUCKET,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  })
  return getSignedUrl(s3, cmd, { expiresIn: 3600 }) // 1 hour
}

export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[],
) {
  const cmd = new CompleteMultipartUploadCommand({
    Bucket: BUCKET,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  })
  return s3.send(cmd)
}

export async function abortMultipartUpload(key: string, uploadId: string) {
  const cmd = new AbortMultipartUploadCommand({
    Bucket: BUCKET,
    Key: key,
    UploadId: uploadId,
  })
  return s3.send(cmd)
}

export async function getDownloadUrl(key: string, expiresIn = 900) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return getSignedUrl(s3, cmd, { expiresIn })
}

export function generateS3Key(userId: string, filename: string): string {
  const ext = filename.split(".").pop()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `uploads/${userId}/${timestamp}-${random}.${ext}`
}
