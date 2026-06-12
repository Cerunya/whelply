import { S3Client } from '@aws-sdk/client-s3'

export const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: 'us-east-1', // MinIO ignoriert die Region, AWS SDK braucht sie aber
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true, // wichtig für MinIO (S3-Style URLs statt Subdomain-Style)
})

export const MINIO_BUCKET = process.env.MINIO_BUCKET ?? 'whelply-media'
