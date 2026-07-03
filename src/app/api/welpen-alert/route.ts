import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const schema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  breedId: z.number().int().optional(),
  state: z.string().optional(),
})

const RESEND_API_KEY = process.env.RESEND_API_KEY
const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://whelply.de'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { email, breedId, state } = parsed.data

  // Doppelte Abonnements vermeiden
  const existing = await prisma.welpenAlert.findFirst({
    where: { email, breedId: breedId ?? null, state: state ?? null },
  })
  if (existing) {
    return NextResponse.json({ message: 'Du erhältst bereits Alerts für diese Suche.' })
  }

  const unsubscribeToken = randomBytes(32).toString('hex')

  const alert = await prisma.welpenAlert.create({
    data: {
      email,
      breedId: breedId ?? null,
      state: state ?? null,
      unsubscribeToken,
    },
    include: { breed: { select: { nameDe: true } } },
  })

  const label = [alert.breed?.nameDe, state].filter(Boolean).join(' · ') || 'Alle Welpen'
  const unsubscribeUrl = `${BASE_URL}/welpen-alert/abmelden/${unsubscribeToken}`

  // Bestätigungsmail senden
  if (RESEND_API_KEY) {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Georgia,serif;background:#faf8f3;margin:0;padding:20px;">
  <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #f0ece3;overflow:hidden;">
    <tr>
      <td style="background:#2d5a3d;padding:24px 32px;">
        <h1 style="color:#fff;margin:0;font-size:24px;">Whelply</h1>
        <p style="color:#fff;opacity:0.8;margin:4px 0 0;font-size:14px;">Welpen-Alert eingerichtet</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <p style="color:#1c1917;font-size:16px;margin:0 0 16px;">Dein Alert wurde erfolgreich eingerichtet!</p>
        <div style="background:#f5f0e8;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
          <p style="margin:0;color:#78716c;font-size:13px;">Du wirst täglich benachrichtigt über:</p>
          <p style="margin:8px 0 0;color:#2d5a3d;font-weight:bold;font-size:16px;">${label}</p>
        </div>
        <p style="color:#78716c;font-size:14px;margin:0 0 24px;">
          Sobald neue Welpen in dieser Kategorie eingetragen werden, bekommst du morgens eine E-Mail.
        </p>
        <a href="${BASE_URL}/welpen" style="display:inline-block;padding:12px 28px;background:#b45309;color:#fff;border-radius:12px;text-decoration:none;font-weight:bold;">
          Jetzt Welpen ansehen →
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px;border-top:1px solid #f0ece3;text-align:center;">
        <p style="color:#a8a29e;font-size:12px;margin:0;">
          Du möchtest keine Alerts mehr? <a href="${unsubscribeUrl}" style="color:#a8a29e;">Abmelden</a>
        </p>
      </td>
    </tr>
  </table>
</body></html>`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Whelply Alerts <alerts@whelply.de>',
        to: [email],
        subject: `✓ Alert eingerichtet: ${label}`,
        html,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    }).catch((e) => console.error('[welpen-alert] Bestätigungsmail fehlgeschlagen:', e))
  }

  return NextResponse.json({ message: 'Alert eingerichtet! Du erhältst eine Bestätigungsmail und wirst täglich über neue Welpen informiert.' })
}
