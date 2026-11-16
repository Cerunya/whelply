import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseEdogs, parseTierweltText } from '@/lib/inserat-import'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.discriminatedUnion('platform', [
  z.object({ platform: z.literal('edogs'), url: z.string().url(), ownershipConfirmed: z.literal(true) }),
  z.object({ platform: z.literal('tierwelt'), text: z.string().min(30).max(30000), imageText: z.string().max(8000).default(''), ownershipConfirmed: z.literal(true) }),
])

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } })
  if (!breeder) return NextResponse.json({ error: 'Züchter-Profil nicht gefunden' }, { status: 404 })
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Bitte alle Importdaten prüfen und bestätigen, dass es dein eigenes Inserat ist.' }, { status: 400 })
  const breeds = await prisma.breed.findMany({ select: { id: true, nameDe: true }, orderBy: { nameDe: 'asc' } })

  try {
    if (parsed.data.platform === 'tierwelt') {
      return NextResponse.json(parseTierweltText(parsed.data.text, parsed.data.imageText, breeds))
    }

    const source = new URL(parsed.data.url)
    if (source.protocol !== 'https:' || !['edogs.de', 'www.edogs.de'].includes(source.hostname) || !/\/\d+\.html$/.test(source.pathname)) {
      return NextResponse.json({ error: 'Bitte einen gültigen Link zu einem einzelnen edogs-Inserat eingeben.' }, { status: 400 })
    }
    const response = await fetch(source, { headers: { 'User-Agent': 'Whelply-Inseratimport/1.0', Accept: 'text/html' }, signal: AbortSignal.timeout(15000) })
    if (!response.ok) return NextResponse.json({ error: `edogs-Inserat nicht erreichbar (Status ${response.status}).` }, { status: 422 })
    const finalUrl = new URL(response.url)
    if (!['edogs.de', 'www.edogs.de'].includes(finalUrl.hostname)) return NextResponse.json({ error: 'Ungültige Weiterleitung.' }, { status: 400 })
    const length = Number(response.headers.get('content-length') ?? 0)
    if (length > 2_000_000) return NextResponse.json({ error: 'Die Inseratsseite ist zu groß.' }, { status: 422 })
    const buffer = await response.arrayBuffer()
    if (buffer.byteLength > 2_000_000) return NextResponse.json({ error: 'Die Inseratsseite ist zu groß.' }, { status: 422 })
    let html: string
    try {
      html = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
    } catch {
      // Einige edogs-Seiten sind trotz UTF-8-Header als Windows-1252 kodiert.
      html = new TextDecoder('windows-1252').decode(buffer)
    }
    return NextResponse.json(parseEdogs(html, breeds))
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Der Import ist fehlgeschlagen.' }, { status: 422 })
  }
}
