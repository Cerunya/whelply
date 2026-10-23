const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL ?? 'noreply@whelply.de'
const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://whelply.de'

function wrapHtml(title: string, body: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:Georgia,serif;background:#faf8f3;margin:0;padding:20px;">
<table width="560" align="center" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #f0ece3;overflow:hidden;">
<tr><td style="background:#2d5a3d;padding:24px 32px;">
<h1 style="color:#fff;margin:0;font-size:22px;">Whelply</h1>
</td></tr>
<tr><td style="padding:32px;">${body}</td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid #f0ece3;text-align:center;">
<p style="color:#a8a29e;font-size:11px;margin:0;">Diese E-Mail wurde automatisch versendet. Bitte antworte nicht darauf.<br>
<a href="${BASE_URL}" style="color:#a8a29e;">Whelply.de</a></p>
</td></tr>
</table></body></html>`
}

export async function sendMail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn('[mail] RESEND_API_KEY nicht gesetzt')
    return false
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: `Whelply <${FROM_EMAIL}>`, to: [to], subject, html }),
    })
    return res.ok
  } catch (e) {
    console.error('[mail] Fehler:', e)
    return false
  }
}

export async function sendPasswordChangeConfirmation(email: string, token: string) {
  const url = `${BASE_URL}/passwort-bestaetigen?token=${token}`
  const html = wrapHtml('Passwort-Änderung bestätigen', `
    <h2 style="color:#1c1917;margin:0 0 12px;font-size:20px;">Passwort-Änderung bestätigen</h2>
    <p style="color:#57534e;line-height:1.6;margin:0 0 24px;">
      Du hast eine Änderung deines Passworts angefordert. Klicke auf den Button um die Änderung zu bestätigen.
      <br><br>Wenn du diese Änderung <strong>nicht</strong> angefordert hast, ignoriere diese E-Mail — dein Passwort bleibt unverändert.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${url}" style="display:inline-block;padding:14px 32px;background:#2d5a3d;color:#fff;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;">
        Passwort-Änderung bestätigen
      </a>
    </div>
    <p style="color:#a8a29e;font-size:12px;margin:24px 0 0;">Dieser Link ist 30 Minuten gültig.</p>
  `)
  return sendMail(email, 'Passwort-Änderung bestätigen — Whelply', html)
}

export async function sendPasswordResetLink(email: string, token: string) {
  const url = `${BASE_URL}/passwort-zuruecksetzen?token=${token}`
  const html = wrapHtml('Passwort zurücksetzen', `
    <h2 style="color:#1c1917;margin:0 0 12px;font-size:20px;">Passwort zurücksetzen</h2>
    <p style="color:#57534e;line-height:1.6;margin:0 0 24px;">
      Du hast angefordert, dein Passwort zurückzusetzen. Klicke auf den Button um ein neues Passwort zu vergeben.
      <br><br>Wenn du dies <strong>nicht</strong> angefordert hast, ignoriere diese E-Mail.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${url}" style="display:inline-block;padding:14px 32px;background:#2d5a3d;color:#fff;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;">
        Neues Passwort vergeben
      </a>
    </div>
    <p style="color:#a8a29e;font-size:12px;margin:24px 0 0;">Dieser Link ist 1 Stunde gültig.</p>
  `)
  return sendMail(email, 'Passwort zurücksetzen — Whelply', html)
}

export async function sendEmailVerification(email: string, token: string) {
  const url = `${BASE_URL}/email-bestaetigen?token=${token}`
  const html = wrapHtml('E-Mail-Adresse bestätigen', `
    <h2 style="color:#1c1917;margin:0 0 12px;font-size:20px;">Willkommen bei Whelply!</h2>
    <p style="color:#57534e;line-height:1.6;margin:0 0 24px;">
      Bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren.
      Erst danach kannst du dich einloggen.
      <br><br>Wenn du dich <strong>nicht</strong> registriert hast, ignoriere diese E-Mail einfach.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${url}" style="display:inline-block;padding:14px 32px;background:#2d5a3d;color:#fff;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;">
        E-Mail-Adresse bestätigen
      </a>
    </div>
    <p style="color:#a8a29e;font-size:12px;margin:24px 0 0;">Dieser Link ist 24 Stunden gültig.</p>
  `)
  return sendMail(email, 'Bitte bestätige deine E-Mail-Adresse — Whelply', html)
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Admin hat die Zuchtstätte verifiziert (Toggle im Admin-Dashboard)
export async function sendKennelVerified(email: string, kennelName: string) {
  const html = wrapHtml('Zuchtstätte verifiziert', `
    <h2 style="color:#1c1917;margin:0 0 12px;font-size:20px;">Deine Zuchtstätte wurde verifiziert ✓</h2>
    <p style="color:#57534e;line-height:1.6;margin:0 0 24px;">
      Gute Nachrichten: Deine Zuchtstätte <strong>${esc(kennelName)}</strong> wurde von uns geprüft und verifiziert.
      Dein Profil zeigt jetzt das Verifizierungs-Badge und gewinnt damit mehr Vertrauen bei Interessenten.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${BASE_URL}/dashboard" style="display:inline-block;padding:14px 32px;background:#2d5a3d;color:#fff;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;">
        Zum Dashboard
      </a>
    </div>
  `)
  return sendMail(email, 'Deine Zuchtstätte wurde verifiziert — Whelply', html)
}

// Admin hat die manuelle ID-Prüfung freigegeben
export async function sendIdVerificationApproved(email: string) {
  const html = wrapHtml('Identität bestätigt', `
    <h2 style="color:#1c1917;margin:0 0 12px;font-size:20px;">Deine Identität wurde bestätigt ✓</h2>
    <p style="color:#57534e;line-height:1.6;margin:0 0 24px;">
      Deine eingereichten Ausweisdokumente wurden geprüft und freigegeben.
      Dein Profil erhält jetzt das Badge <strong>„ID geprüft"</strong>.
      Aus Datenschutzgründen wurden die hochgeladenen Dokumente anschließend gelöscht.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${BASE_URL}/dashboard" style="display:inline-block;padding:14px 32px;background:#2d5a3d;color:#fff;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;">
        Zum Dashboard
      </a>
    </div>
  `)
  return sendMail(email, 'Deine Identität wurde bestätigt — Whelply', html)
}

// Admin hat die manuelle ID-Prüfung abgelehnt
export async function sendIdVerificationRejected(email: string, reason: string) {
  const html = wrapHtml('ID-Prüfung abgelehnt', `
    <h2 style="color:#1c1917;margin:0 0 12px;font-size:20px;">Deine ID-Prüfung konnte nicht bestätigt werden</h2>
    <p style="color:#57534e;line-height:1.6;margin:0 0 12px;">
      Leider konnten wir deine eingereichten Ausweisdokumente nicht bestätigen.
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 16px;margin:0 0 16px;">
      <p style="color:#991b1b;font-size:13px;font-weight:bold;margin:0 0 4px;">Grund:</p>
      <p style="color:#7f1d1d;font-size:14px;margin:0;">${esc(reason)}</p>
    </div>
    <p style="color:#57534e;line-height:1.6;margin:0 0 24px;">
      Du kannst die Prüfung jederzeit erneut starten — lade dazu deine Dokumente im Dashboard unter
      <strong>„Verifizierung"</strong> noch einmal hoch. Achte dabei auf gut lesbare, vollständige Aufnahmen.
      Aus Datenschutzgründen wurden die bisherigen Dokumente gelöscht.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${BASE_URL}/dashboard" style="display:inline-block;padding:14px 32px;background:#2d5a3d;color:#fff;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;">
        Erneut verifizieren
      </a>
    </div>
  `)
  return sendMail(email, 'Deine ID-Prüfung — Whelply', html)
}
