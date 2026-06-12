// Einmaliges Skript: setzt CORS-Policy auf den whelply-media Bucket.
// Ausführen im App-Container: node scripts/set-cors.js
// Danach kann diese Datei gelöscht werden.

const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3')

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: 'garage',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
})

async function main() {
  const command = new PutBucketCorsCommand({
    Bucket: process.env.MINIO_BUCKET ?? 'whelply-media',
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: ['https://whelply.de'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedHeaders: ['*'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  })

  await s3.send(command)
  console.log('✅ CORS-Policy erfolgreich gesetzt.')
}

main().catch((err) => {
  console.error('❌ Fehler:', err)
  process.exit(1)
})
