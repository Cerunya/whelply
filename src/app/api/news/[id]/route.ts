import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { s3, MINIO_BUCKET } from '@/lib/s3'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().min(1).max(5000),
})

async function getOwnedPost(userId: string, postId: string) {
  const breeder = await prisma.breederProfile.findUnique({ where: { userId } })
  if (!breeder) return null
  const post = await prisma.newsPost.findUnique({ where: { id: postId } })
  if (!post || post.breederId !== breeder.id) return null
  return post
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const post = await getOwnedPost(session.user.id, params.id)
  if (!post) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  await prisma.newsPost.update({
    where: { id: params.id },
    data: { title: parsed.data.title, content: parsed.data.content },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const post = await getOwnedPost(session.user.id, params.id)
  if (!post) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const media = await prisma.media.findMany({ where: { newsPostId: params.id } })
  for (const m of media) {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: MINIO_BUCKET, Key: m.storageKey }))
    } catch {
      // ignorieren falls Datei bereits weg
    }
  }

  await prisma.newsPost.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
