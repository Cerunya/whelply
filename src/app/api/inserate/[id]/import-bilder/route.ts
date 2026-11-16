import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { s3, MINIO_BUCKET } from '@/lib/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { z } from 'zod'

const schema = z.object({ urls: z.array(z.string().url()).min(1).max(8) })

function isPrivateIp(ip: string) {
  if (ip.includes(':')) return /^(::1|::|fe80:|fc|fd|ff)/i.test(ip) || /^::ffff:(?:127|10|192\.168|169\.254)\./i.test(ip)
  const [a, b] = ip.split('.').map(Number)
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224
}

async function assertSafeUrl(raw: string) {
  const url = new URL(raw)
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('Nur normale HTTPS-Bildlinks sind erlaubt.')
  if (url.hostname === 'localhost' || url.hostname.endsWith('.local')) throw new Error('Ungültige Bildadresse.')
  const addresses = isIP(url.hostname) ? [{ address: url.hostname }] : await lookup(url.hostname, { all: true })
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) throw new Error('Die Bildadresse ist nicht öffentlich erreichbar.')
  return url
}

async function fetchImage(raw: string) {
  let url = await assertSafeUrl(raw)
  let response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { Accept: 'image/avif,image/webp,image/png,image/jpeg' } })
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get('location')
    if (!location) throw new Error('Bildweiterleitung ohne Ziel.')
    url = await assertSafeUrl(new URL(location, url).toString())
    response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000), headers: { Accept: 'image/avif,image/webp,image/png,image/jpeg' } })
  }
  if (!response.ok) throw new Error(`Bild nicht erreichbar (${response.status}).`)
  if (!/^image\/(jpeg|png|webp|avif)$/i.test(response.headers.get('content-type') ?? '')) throw new Error('Der Link enthält kein unterstütztes Bildformat.')
  const length = Number(response.headers.get('content-length') ?? 0)
  if (length > 20 * 1024 * 1024) throw new Error('Ein Bild ist größer als 20 MB.')
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length > 20 * 1024 * 1024) throw new Error('Ein Bild ist größer als 20 MB.')
  return buffer
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } })
  if (!breeder) return NextResponse.json({ error: 'Züchter-Profil nicht gefunden' }, { status: 404 })
  const listing = await prisma.listing.findUnique({ where: { id: params.id }, select: { breederId: true } })
  if (!listing || listing.breederId !== breeder.id) return NextResponse.json({ error: 'Inserat nicht gefunden' }, { status: 404 })
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Bildlinks' }, { status: 400 })

  try {
    let existingCount = await prisma.media.count({ where: { listingId: params.id } })
    for (const url of parsed.data.urls) {
      const raw = await fetchImage(url)
      const buffer = await sharp(raw).rotate().resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer()
      const storageKey = `listings/${params.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`
      await s3.send(new PutObjectCommand({ Bucket: MINIO_BUCKET, Key: storageKey, Body: buffer, ContentType: 'image/webp' }))
      await prisma.media.create({ data: { storageKey, url: `/api/media/${storageKey}/view`, listingId: params.id, isPrimary: existingCount === 0, sortOrder: existingCount } })
      existingCount++
    }
    return NextResponse.json({ ok: true, count: parsed.data.urls.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Bildimport fehlgeschlagen' }, { status: 422 })
  }
}
