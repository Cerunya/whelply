import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendMail } from '@/lib/mail'

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(10).max(5000),
  privacy: z.literal(true),
  website: z.string().max(200).optional().default(''),
})

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Bitte fülle alle Pflichtfelder korrekt aus.' }, { status: 400 })

  // Das unsichtbare Feld bleibt für Menschen leer und fängt einfache Spam-Bots ab.
  if (parsed.data.website) return NextResponse.json({ ok: true })

  const { name, email, subject, message } = parsed.data
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1c1917;line-height:1.6"><h2>Neue Kontaktanfrage über Whelply</h2><p><strong>Name:</strong> ${escapeHtml(name)}<br><strong>E-Mail:</strong> ${escapeHtml(email)}<br><strong>Betreff:</strong> ${escapeHtml(subject)}</p><div style="margin-top:24px;padding:16px;background:#faf8f3;border-radius:8px;white-space:pre-wrap">${escapeHtml(message)}</div></body></html>`
  const sent = await sendMail(process.env.SUPPORT_EMAIL ?? 'info@whelply.de', `Kontakt: ${subject}`, html, email)
  if (!sent) return NextResponse.json({ error: 'Die Nachricht konnte gerade nicht gesendet werden. Bitte versuche es später erneut oder schreibe an info@whelply.de.' }, { status: 502 })
  return NextResponse.json({ ok: true })
}
