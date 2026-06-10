import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const previewPassword = process.env.PREVIEW_PASSWORD

  if (!previewPassword || password !== previewPassword) {
    return NextResponse.json({ error: 'wrong password' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('preview_access', previewPassword, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 Tage
    path: '/',
  })
  return response
}
