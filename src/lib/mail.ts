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
