import { S3Client } from '@aws-sdk/client-s3'

export const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: 'garage', // Garage erfordert exakt diese Region (s.a. garage.toml: s3_region)
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true, // S3-Style URLs statt Subdomain-Style — von Garage benötigt
})

export const MINIO_BUCKET = process.env.MINIO_BUCKET ?? 'whelply-media'