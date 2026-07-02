import { prisma } from './prisma'

// Resend wird per fetch aufgerufen (kein npm-Package nötig solange API Key gesetzt ist)
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'alerts@whelply.de'
const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://whelply.de'

function buildEmailHtml(opts: {
  listings: { id: string; name: string; breed: string; price: string; kennelName: string; imageUrl?: string }[]
  label: string
  unsubscribeUrl: string
}) {
  const { listings, label, unsubscribeUrl } = opts

  const cards = listings.map((l) => `
    <tr>
      <td style="padding:8px 0; border-bottom:1px solid #f0ece3;">
        ${l.imageUrl ? `<img src="${l.imageUrl}" alt="${l.name}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;display:inline-block;vertical-align:middle;margin-right:12px;">` : ''}
        <span style="vertical-align:middle;">
          <strong style="display:block;color:#1c1917;">${l.name}</strong>
          <span style="color:#78716c;font-size:13px;">${l.breed} · ${l.kennelName}</span><br>
          <span style="color:#b45309;font-weight:600;">${l.price}</span>
        </span>
        <a href="${BASE_URL}/welpen/${l.id}" style="display:inline-block;margin-left:16px;padding:6px 14px;background:#2d5a3d;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;vertical-align:middle;">Ansehen</a>
      </td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Neue Welpen auf Whelply</title></head>
<body style="font-family:Georgia,serif;background:#faf8f3;margin:0;padding:20px;">
  <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #f0ece3;overflow:hidden;">
    <tr>
      <td style="background:#2d5a3d;padding:24px 32px;">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:bold;">Whelply</h1>
        <p style="color:#fff;opacity:0.8;margin:4px 0 0;font-size:14px;">Neue Welpen: ${label}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px;">
        <p style="color:#1c1917;margin:0 0 16px;">Heute wurden <strong>${listings.length} neue Welpen</strong> eingetragen:</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${cards}
        </table>
        <div style="margin-top:24px;text-align:center;">
          <a href="${BASE_URL}/welpen" style="display:inline-block;padding:12px 28px;background:#b45309;color:#fff;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;">
            Alle Welpen ansehen →
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px;border-top:1px solid #f0ece3;text-align:center;">
        <p style="color:#a8a29e;font-size:12px;margin:0;">
          Du erhältst diese E-Mail weil du einen Welpen-Alert für <strong>${label}</strong> eingerichtet hast.<br>
          <a href="${unsubscribeUrl}" style="color:#a8a29e;">Abmelden</a> · 
          <a href="${BASE_URL}" style="color:#a8a29e;">Whelply.de</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendWelpenAlerts() {
  if (!RESEND_API_KEY) {
    console.warn('[welpen-alerts] RESEND_API_KEY nicht gesetzt — übersprungen.')
    return
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

  // Neue Inserate der letzten 24h
  const newListings = await prisma.listing.findMany({
    where: {
      status: 'available',
      type: 'puppy',
      createdAt: { gte: yesterday },
      breeder: { isActive: true, isPublished: true },
    },
    include: {
      breed: { select: { id: true, nameDe: true } },
      breeder: { select: { kennelName: true, state: true } },
      dog: { select: { name: true } },
      media: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
  })

  if (newListings.length === 0) {
    console.log('[welpen-alerts] Keine neuen Inserate heute.')
    return
  }

  // Alle aktiven Alerts
  const alerts = await prisma.welpenAlert.findMany({
    include: { breed: { select: { nameDe: true } } },
  })

  let sent = 0
  let errors = 0

  for (const alert of alerts) {
    // Passende Inserate für diesen Alert filtern
    const matching = newListings.filter((l) => {
      const breedMatch = !alert.breedId || l.breed.id === alert.breedId
      const stateMatch = !alert.state || l.breeder.state === alert.state
      return breedMatch && stateMatch
    })

    if (matching.length === 0) continue

    const label = [alert.breed?.nameDe, alert.state].filter(Boolean).join(' · ') || 'Alle Welpen'
    const unsubscribeUrl = `${BASE_URL}/welpen-alert/abmelden/${alert.unsubscribeToken}`

    const listingsData = matching.map((l) => ({
      id: l.id,
      name: l.title ?? l.dog?.name ?? l.breed.nameDe,
      breed: l.breed.nameDe,
      kennelName: l.breeder.kennelName,
      price: l.priceCents ? `${(l.priceCents / 100).toLocaleString('de-DE')} €` : 'Preis auf Anfrage',
      imageUrl: l.media[0]?.url,
    }))

    const html = buildEmailHtml({ listings: listingsData, label, unsubscribeUrl })

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `Whelply Alerts <${FROM_EMAIL}>`,
          to: [alert.email],
          subject: `${matching.length} neue Welpen: ${label}`,
          html,
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }),
      })

      if (res.ok) {
        await prisma.welpenAlert.update({
          where: { id: alert.id },
          data: { lastSentAt: new Date() },
        })
        sent++
      } else {
        const err = await res.text()
        console.error(`[welpen-alerts] Fehler bei ${alert.email}:`, err)
        errors++
      }
    } catch (e) {
      console.error(`[welpen-alerts] Netzwerkfehler bei ${alert.email}:`, e)
      errors++
    }
  }

  console.log(`[welpen-alerts] ${sent} E-Mails gesendet, ${errors} Fehler.`)
}
