'use client'

export default function CookieSettingsButton() {
  return (
    <button
      onClick={() => (window as any).__openCookieBanner?.()}
      className="text-white/60 hover:text-white transition-colors cursor-pointer"
    >
      Cookie-Einstellungen
    </button>
  )
}
