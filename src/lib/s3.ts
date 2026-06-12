import { S3Client } from '@aws-sdk/client-s3'

// Interner Docker-Hostname für Server-zu-Server-Kommunikation (kein TLS-Problem)
// Für presigned URLs (falls später extern benötigt) würde MINIO_ENDPOINT_PUBLIC verwendet
export const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT, // z.B. http://garage-xxxx:3900 (intern)
  region: 'garage',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
})

export const MINIO_BUCKET = process.env.MINIO_BUCKET ?? 'whelply-media'
