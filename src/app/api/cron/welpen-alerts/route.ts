import { NextRequest, NextResponse } from 'next/server'
import { sendWelpenAlerts } from '@/lib/mail-alerts'

// Dieser Endpoint wird täglich von einem Cron-Job aufgerufen.
// Absichern mit einem geheimen Token (CRON_SECRET in Coolify setzen).
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await sendWelpenAlerts()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cron/welpen-alerts]', err)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
