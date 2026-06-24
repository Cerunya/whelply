'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import BreederImageUploader from './BreederImageUploader'
import SaveToast from './SaveToast'

type BreederTheme = {
  subdomain: string | null
  themeColor: string | null
  themeAccentColor: string | null
  themeBgColor: string | null
  themeNavColor: string | null
  themeFont: string | null
  themeAlign: string | null
  kennelName: string
  headerImageUrl: string | null
  backgroundImageUrl: string | null
  zuechterSlug: string
}

const COLOR_PRESETS = [
  { label: 'Waldgrün', value: '#2d5a3d' },
  { label: 'Terracotta', value: '#b5552b' },
  { label: 'Nachtblau', value: '#1f3a5f' },
  { label: 'Bordeaux', value: '#7a2233' },
  { label: 'Taubenblau', value: '#4a6b7c' },
  { label: 'Senfgelb', value: '#c08a1e' },
  { label: 'Anthrazit', value: '#2c2c2c' },
  { label: 'Lavendel', value: '#5b5ea6' },
]

const ACCENT_PRESETS = [
  { label: 'Honig', value: '#e0a72e' },
  { label: 'Salbei', value: '#8aa68a' },
  { label: 'Koralle', value: '#e08a6e' },
  { label: 'Gold', value: '#d4af37' },
  { label: 'Himmelblau', value: '#7fb3d5' },
  { label: 'Rose', value: '#d99aa6' },
  { label: 'Mint', value: '#6dbf9e' },
  { label: 'Kupfer', value: '#b87333' },
]

const BG_PRESETS = [
  { label: 'Creme', value: '#FAF8F4' },
  { label: 'Weiss', value: '#FFFFFF' },
  { label: 'Hellgrau', value: '#F3F4F6' },
  { label: 'Warmbeige', value: '#F5F0E8' },
  { label: 'Salbei', value: '#EFF4EF' },
  { label: 'Lavendel', value: '#F3F2F8' },
]

const FONT_OPTIONS = [
  { label: 'Georgia (Standard)', value: '' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Cormorant Garamond', value: 'Cormorant Garamond' },
  { label: 'Josefin Sans', value: 'Josefin Sans' },
  { label: 'Raleway', value: 'Raleway' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Lora', value: 'Lora' },
  { label: 'Cinzel', value: 'Cinzel' },
  { label: 'Dancing Script', value: 'Dancing Script' },
  { label: 'Great Vibes', value: 'Great Vibes' },
]

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/

export default function ThemeEditor({ breeder }: { breeder: BreederTheme }) {
  const [subdomain, setSubdomain] = useState(breeder.subdomain ?? '')
  const [subdomainStatus, setSubdomainStatus] = useState<'idle'|'checking'|'available'|'taken'|'invalid'|'unchanged'>('idle')
  const [subdomainError, setSubdomainError] = useState('')
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [themeColor, setThemeColor] = useState(breeder.themeColor ?? '#2d5a3d')
  const [themeAccentColor, setThemeAccentColor] = useState(breeder.themeAccentColor ?? '#e0a72e')
  const [themeBgColor, setThemeBgColor] = useState(breeder.themeBgColor ?? '#FAF8F4')
  const [themeNavColor, setThemeNavColor] = useState(breeder.themeNavColor ?? '')
  const [themeFont, setThemeFont] = useState(breeder.themeFont ?? '')
  const [themeAlign, setThemeAlign] = useState(breeder.themeAlign ?? 'left')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function validateSubdomain(s: string) {
    if (s.length < 3) return 'Mindestens 3 Zeichen.'
    if (s.length > 30) return 'Maximal 30 Zeichen.'
    if (!/^[a-z0-9-]+$/.test(s)) return 'Nur Kleinbuchstaben, Ziffern und Bindestriche.'
    if (s.startsWith('-') || s.endsWith('-')) return 'Darf nicht mit einem Bindestrich beginnen oder enden.'
    return null
  }

  useEffect(() => {
    if (subdomain === (breeder.subdomain ?? '')) {
      setSubdomainStatus('unchanged')
      return
    }
    if (subdomain === '') { setSubdomainStatus('idle'); return }
    const err = validateSubdomain(subdomain)
    if (err) { setSubdomainStatus('invalid'); setSubdomainError(err); return }
    setSubdomainStatus('checking')
    if (checkTimer.current) clearTimeout(checkTimer.current)
    checkTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/subdomain-check?sub=${subdomain}`).catch(() => null)
      if (!res) return
      const data = await res.json().catch(() => ({}))
      setSubdomainStatus(data.available ? 'available' : 'taken')
      setSubdomainError(data.available ? '' : 'Diese Subdomain ist bereits vergeben.')
    }, 600)
  }, [subdomain, breeder.subdomain])

  async function handleSave() {
    setError('')
    setSuccess(false)
    if (subdomainStatus === 'taken' || subdomainStatus === 'invalid') {
      setError(subdomainError || 'Bitte korrigiere die Subdomain.')
      return
    }
    const colorsToCheck = [themeColor, themeAccentColor]
    if (themeBgColor) colorsToCheck.push(themeBgColor)
    if (themeNavColor) colorsToCheck.push(themeNavColor)
    if (colorsToCheck.some((c) => !HEX_REGEX.test(c))) {
      setError('Bitte gueltige Hex-Farbwerte verwenden (z.B. #2d5a3d).')
      return
    }
    setLoading(true)
    const res = await fetch('/api/profil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subdomain: subdomain.trim().toLowerCase(),
        themeColor,
        themeAccentColor,
        themeBgColor: themeBgColor || null,
        themeNavColor: themeNavColor || null,
        themeFont: themeFont || null,
        themeAlign: themeAlign || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Fehler beim Speichern.')
      setLoading(false)
      return
    }
    setSuccess(true)
    setLoading(false)
  }

  async function handleReset() {
    setError('')
    setSuccess(false)
    setLoading(true)
    setThemeColor('#2d5a3d')
    setThemeAccentColor('#e0a72e')
    setThemeBgColor('#FAF8F4')
    setThemeNavColor('')
    setThemeFont('')
    setThemeAlign('left')
    const res = await fetch('/api/profil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeColor: '', themeAccentColor: '', themeBgColor: null, themeNavColor: null, themeFont: null, themeAlign: null }),
    })
    if (res.ok) {
      setSuccess(true)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Fehler beim Zuruecksetzen.')
    }
    setLoading(false)
  }

  const labelClass = 'block text-sm font-semibold text-stone-700 mb-1.5'
  const inputClass = 'w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-colors'

  return (
    <div className="min-h-screen bg-cream font-sans">
      <header className="bg-white border-b border-cream-deep sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/dashboard" className="text-stone-400 hover:text-stone-700 transition-colors text-sm">
            Dashboard
          </Link>
          <span className="text-stone-300">/</span>
          <h1 className="font-serif text-lg font-bold text-stone-900">Theme &amp; Branding</h1>
          <div className="ml-auto">
            <Link
              href={`/zuechter/${breeder.zuechterSlug}`}
              target="_blank"
              className="text-sm text-forest font-semibold hover:underline"
            >
              Seite ansehen {'->'}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-5 py-4">
            {error}
          </div>
        )}

        {/* Subdomain */}
        <div className="bg-white rounded-2xl border border-cream-deep p-6">
          <h2 className="font-serif text-lg font-bold text-stone-900 mb-1">Subdomain</h2>
          <p className="text-sm text-stone-400 mb-4">
            Reserviere eine eigene Adresse wie <span className="font-mono text-stone-600">deinzwinger.whelply.de</span>
          </p>
          <div className="flex items-center gap-0 rounded-xl border border-stone-200 overflow-hidden">
            <span className="px-3 py-2.5 bg-cream text-stone-400 text-sm border-r border-stone-200 whitespace-nowrap">whelply.de/</span>
            <input
              type="text"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="dein-zwinger"
              className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white"
              maxLength={30}
            />
          </div>
          {subdomainStatus === 'checking' && <p className="text-xs text-stone-400 mt-1.5">Wird geprueft...</p>}
          {subdomainStatus === 'available' && <p className="text-xs text-green-600 mt-1.5">Verfuegbar!</p>}
          {subdomainStatus === 'taken' && <p className="text-xs text-red-500 mt-1.5">{subdomainError}</p>}
          {subdomainStatus === 'invalid' && <p className="text-xs text-red-500 mt-1.5">{subdomainError}</p>}
          {subdomainStatus === 'unchanged' && breeder.subdomain && <p className="text-xs text-stone-400 mt-1.5">Aktuell reserviert fuer dich.</p>}
        </div>

        {/* Farben - alle zusammen */}
        <div className="bg-white rounded-2xl border border-cream-deep p-6 space-y-8">
          <h2 className="font-serif text-lg font-bold text-stone-900">Farben</h2>

          {/* Primaer + Akzent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Primaerfarbe (Hero + Tab-Nav)</label>
              <div className="flex items-center gap-3 mb-3">
                <input type="color" value={themeColor}
                  onChange={(e) => { setThemeColor(e.target.value); setSuccess(false) }}
                  className="w-12 h-10 rounded-lg border border-stone-200 cursor-pointer" />
                <input type="text" value={themeColor}
                  onChange={(e) => { setThemeColor(e.target.value); setSuccess(false) }}
                  className={inputClass + ' flex-1 font-mono'} maxLength={7} />
              </div>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((p) => (
                  <button key={p.value} type="button"
                    onClick={() => { setThemeColor(p.value); setSuccess(false) }}
                    title={p.label}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${themeColor.toLowerCase() === p.value ? 'border-stone-900' : 'border-white'}`}
                    style={{ backgroundColor: p.value }} />
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Akzentfarbe (Badges, Buttons)</label>
              <div className="flex items-center gap-3 mb-3">
                <input type="color" value={themeAccentColor}
                  onChange={(e) => { setThemeAccentColor(e.target.value); setSuccess(false) }}
                  className="w-12 h-10 rounded-lg border border-stone-200 cursor-pointer" />
                <input type="text" value={themeAccentColor}
                  onChange={(e) => { setThemeAccentColor(e.target.value); setSuccess(false) }}
                  className={inputClass + ' flex-1 font-mono'} maxLength={7} />
              </div>
              <div className="flex flex-wrap gap-2">
                {ACCENT_PRESETS.map((p) => (
                  <button key={p.value} type="button"
                    onClick={() => { setThemeAccentColor(p.value); setSuccess(false) }}
                    title={p.label}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${themeAccentColor.toLowerCase() === p.value ? 'border-stone-900' : 'border-white'}`}
                    style={{ backgroundColor: p.value }} />
                ))}
              </div>
            </div>
          </div>

          {/* Hintergrundfarbe */}
          <div>
            <label className={labelClass}>Hintergrundfarbe (Inhalts-Panels)</label>
            <p className="text-xs text-stone-400 mb-3">
              Farbe der halbtransparenten Panels -- besonders sichtbar mit Hintergrundbild.
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {BG_PRESETS.map((p) => (
                <button key={p.value} type="button"
                  onClick={() => setThemeBgColor(p.value)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border-2 transition-colors ${themeBgColor === p.value ? 'border-forest' : 'border-stone-200'}`}>
                  <span className="w-4 h-4 rounded-full border border-stone-300 inline-block" style={{ backgroundColor: p.value }} />
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input type="color" value={themeBgColor || '#FAF8F4'}
                onChange={(e) => setThemeBgColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer" />
              <input type="text" value={themeBgColor}
                onChange={(e) => setThemeBgColor(e.target.value)}
                placeholder="#FAF8F4" className={inputClass + ' flex-1'} maxLength={7} />
            </div>
          </div>

          {/* Tab-Navigationsfarbe */}
          <div>
            <label className={labelClass}>Tab-Navigationsfarbe</label>
            <p className="text-xs text-stone-400 mb-3">
              Leer lassen = Primaerfarbe wird verwendet.
            </p>
            <div className="flex items-center gap-3">
              <input type="color" value={themeNavColor || themeColor || '#2d5a3d'}
                onChange={(e) => setThemeNavColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer" />
              <input type="text" value={themeNavColor}
                onChange={(e) => setThemeNavColor(e.target.value)}
                placeholder="Leer = Primaerfarbe"
                className={inputClass + ' flex-1'} maxLength={7} />
              {themeNavColor && (
                <button type="button" onClick={() => setThemeNavColor('')}
                  className="text-xs text-stone-400 hover:text-stone-700 whitespace-nowrap">
                  Zuruecksetzen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Schriftart */}
        <div className="bg-white rounded-2xl border border-cream-deep p-6">
          <h2 className="font-serif text-lg font-bold text-stone-900 mb-1">Schriftart (Zuchtname)</h2>
          <p className="text-sm text-stone-400 mb-1">
            Schriftart fuer den grossen Zuechternamen im Hero-Bereich.
          </p>
          <p className="text-xs text-stone-400 mb-4">
            Weitere Schriften auf{' '}
            <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer" className="text-forest underline">
              fonts.google.com
            </a>
            {' '}-- Namen unten eintragen.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            {FONT_OPTIONS.map((f) => (
              <button key={f.value} type="button"
                onClick={() => setThemeFont(f.value)}
                className={`px-3 py-2 rounded-xl text-sm border-2 transition-colors text-left ${themeFont === f.value ? 'border-forest bg-cream' : 'border-stone-200 hover:border-stone-300'}`}
                style={{ fontFamily: f.value ? `'${f.value}', serif` : 'Georgia, serif' }}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input type="text" value={themeFont}
              onChange={(e) => setThemeFont(e.target.value)}
              placeholder="Eigener Google-Font-Name"
              className={inputClass} />
          </div>
          {themeFont && (
            <p className="mt-3 text-2xl font-bold text-stone-700" style={{ fontFamily: `'${themeFont}', serif` }}>
              {breeder.kennelName} Vorschau
            </p>
          )}
        </div>

        {/* Ausrichtung */}
        <div className="bg-white rounded-2xl border border-cream-deep p-6">
          <h2 className="font-serif text-lg font-bold text-stone-900 mb-1">Textausrichtung (Header)</h2>
          <p className="text-sm text-stone-400 mb-4">
            Wie sollen Zuechternamen und Infos im Hero-Bereich angeordnet sein?
          </p>
          <div className="flex gap-3">
            {[
              { value: 'left', label: 'Links' },
              { value: 'center', label: 'Mitte' },
              { value: 'right', label: 'Rechts' },
            ].map((opt) => (
              <button key={opt.value} type="button"
                onClick={() => setThemeAlign(opt.value)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${themeAlign === opt.value ? 'border-forest bg-cream text-forest' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hintergrundbild */}
        <div className="bg-white rounded-2xl border border-cream-deep p-6">
          <h2 className="font-serif text-lg font-bold text-stone-900 mb-1">Hintergrundbild</h2>
          <p className="text-sm text-stone-400 mb-4">
            Erscheint hinter dem gesamten Inhalt deiner Zuechterseite. Wird sofort gespeichert.
          </p>
          <BreederImageUploader
            purpose="background"
            initialUrl={breeder.backgroundImageUrl}
            label="Hintergrundbild"
            hint="Empfohlen: ca. 1600x1200px, ruhiges Motiv"
            aspect="aspect-video"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleSave} disabled={loading}
            className="bg-forest text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-forest-light transition-colors disabled:opacity-40">
            {loading ? 'Wird gespeichert...' : 'Speichern'}
          </button>
          <button type="button" onClick={handleReset} disabled={loading}
            className="text-sm text-stone-400 hover:text-stone-700 transition-colors disabled:opacity-40">
            Farben zuruecksetzen
          </button>
        </div>
      </main>

      {success && <SaveToast />}
    </div>
  )
}
