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
  { label: 'Waldgrün (Standard)', value: '#2d5a3d' },
  { label: 'Terracotta', value: '#b5552b' },
  { label: 'Nachtblau', value: '#1f3a5f' },
  { label: 'Bordeaux', value: '#7a2233' },
  { label: 'Taubenblau', value: '#4a6b7c' },
  { label: 'Senfgelb', value: '#c08a1e' },
  { label: 'Anthrazit', value: '#2c2c2c' },
  { label: 'Lavendel', value: '#5b5ea6' },
]

const ACCENT_PRESETS = [
  { label: 'Honig (Standard)', value: '#e0a72e' },
  { label: 'Salbeigrün', value: '#8aa68a' },
  { label: 'Koralle', value: '#e08a6e' },
  { label: 'Gold', value: '#d4af37' },
  { label: 'Himmelblau', value: '#7fb3d5' },
  { label: 'Rosé', value: '#d99aa6' },
  { label: 'Mintgrün', value: '#6dbf9e' },
  { label: 'Kupfer', value: '#b87333' },
]

const BG_PRESETS = [
  { label: 'Creme (Standard)', value: '#FAF8F4' },
  { label: 'Weiß', value: '#FFFFFF' },
  { label: 'Hellgrau', value: '#F3F4F6' },
  { label: 'Warmbeige', value: '#F5F0E8' },
  { label: 'Salbei', value: '#EFF4EF' },
  { label: 'Lavendel hell', value: '#F3F2F8' },
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
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'unchanged'>('idle')
  const [subdomainError, setSubdomainError] = useState('')
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [themeColor, setThemeColor] = useState(breeder.themeColor ?? '#2d5a3d')
  const [themeAccentColor, setThemeAccentColor] = useState(breeder.themeAccentColor ?? '#e0a72e')
  const [themeBgColor, setThemeBgColor] = useState(breeder.themeBgColor ?? '#FAF8F4')
  const [themeNavColor, setThemeNavColor] = useState(breeder.themeNavColor ?? '')
  const [themeFont, setThemeFont] = useState(breeder.themeFont ?? '')
  const [themeAlign, setThemeAlign] = useState(breeder.themeAlign ?? 'left')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (checkTimer.current) clearTimeout(checkTimer.current)

    const trimmed = subdomain.trim().toLowerCase()
    if (!trimmed) {
      setSubdomainStatus('idle')
      setSubdomainError('')
      return
    }
    if (trimmed === (breeder.subdomain ?? '')) {
      setSubdomainStatus('unchanged')
      setSubdomainError('')
      return
    }

    setSubdomainStatus('checking')
    checkTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profil/check-subdomain?subdomain=${encodeURIComponent(trimmed)}`)
        const data = await res.json()
        if (data.available) {
          setSubdomainStatus('available')
          setSubdomainError('')
        } else {
          setSubdomainStatus(data.error?.includes('vergeben') ? 'taken' : 'invalid')
          setSubdomainError(data.error ?? 'Ungültig.')
        }
      } catch {
        setSubdomainStatus('idle')
      }
    }, 500)

    return () => {
      if (checkTimer.current) clearTimeout(checkTimer.current)
    }
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
      setError('Bitte gültige Hex-Farbwerte verwenden (z.B. #2d5a3d).')
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
      setError(data.error ?? 'Fehler beim Zurücksetzen.')
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
            ← Dashboard
          </Link>
          <span className="text-stone-300">|</span>
          <h1 className="font-semibold text-stone-800 text-sm">Theme & Branding</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">
            Theme & Branding
          </h1>
          <p className="text-stone-400 text-sm">
            Passe das Erscheinungsbild deiner öffentlichen Züchterseite an: {breeder.kennelName}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

      {/* Subdomain */}
      <div className="bg-white rounded-2xl border border-cream-deep p-6">
        <h2 className="font-serif text-lg font-bold text-stone-900 mb-1">Eigene Subdomain</h2>
        <p className="text-sm text-stone-400 mb-4">
          Reserviere deinen Wunschnamen schon jetzt. Die Subdomain (z.B. <span className="font-mono">{subdomain || 'deinname'}.whelply.de</span>)
          wird in einer kommenden Phase aktiviert — deine Wahl ist dann bereits gesichert.
        </p>
        <label className={labelClass}>Subdomain</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="z.B. vom-gruenen-tal"
            className={inputClass + ' flex-1'}
            maxLength={30}
          />
          <span className="text-sm text-stone-400 whitespace-nowrap">.whelply.de</span>
        </div>
        {subdomainStatus === 'checking' && (
          <p className="text-xs text-stone-400 mt-1.5">Prüfe Verfügbarkeit...</p>
        )}
        {subdomainStatus === 'available' && (
          <p className="text-xs text-green-600 mt-1.5">✓ Verfügbar</p>
        )}
        {subdomainStatus === 'unchanged' && breeder.subdomain && (
          <p className="text-xs text-stone-400 mt-1.5">Aktuell reserviert für dich.</p>
        )}
        {(subdomainStatus === 'taken' || subdomainStatus === 'invalid') && (
          <p className="text-xs text-red-500 mt-1.5">{subdomainError}</p>
        )}
      </div>

      {/* Farben — alle Farboptionen in einem Block */}
      <div className="bg-white rounded-2xl border border-cream-deep p-6 space-y-8">
        <h2 className="font-serif text-lg font-bold text-stone-900">Farben</h2>

        {/* Primär- und Akzentfarbe */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          <div>
            <label className={labelClass}>Primärfarbe (Hero-Hintergrund)</label>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="color"
                value={themeColor}
                onChange={(e) => { setThemeColor(e.target.value); setSuccess(false) }}
                className="w-12 h-10 rounded-lg border border-stone-200 cursor-pointer"
              />
              <input
                type="text"
                value={themeColor}
                onChange={(e) => { setThemeColor(e.target.value); setSuccess(false) }}
                className={inputClass + ' flex-1 font-mono'}
                maxLength={7}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => { setThemeColor(preset.value); setSuccess(false) }}
                  title={preset.label}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${themeColor.toLowerCase() === preset.value ? 'border-stone-900' : 'border-white'}`}
                  style={{ backgroundColor: preset.value }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Akzentfarbe (Badges, Hervorhebungen)</label>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="color"
                value={themeAccentColor}
                onChange={(e) => { setThemeAccentColor(e.target.value); setSuccess(false) }}
                className="w-12 h-10 rounded-lg border border-stone-200 cursor-pointer"
              />
              <input
                type="text"
                value={themeAccentColor}
                onChange={(e) => { setThemeAccentColor(e.target.value); setSuccess(false) }}
                className={inputClass + ' flex-1 font-mono'}
                maxLength={7}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => { setThemeAccentColor(preset.value); setSuccess(false) }}
                  title={preset.label}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${themeAccentColor.toLowerCase() === preset.value ? 'border-stone-900' : 'border-white'}`}
                  style={{ backgroundColor: preset.value }}
                />
              ))}
            </div>
          </div>
        
        </div>

        {/* Hintergrundfarbe */}
        <div>
          <label className={labelClass}>Hintergrundfarbe (Inhaltsbereich)</label>
          <p className="text-xs text-stone-400 mb-3">
            Farbe der halbtransparenten Inhalts-Panels — besonders sichtbar mit Hintergrundbild.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
          {BG_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setThemeBgColor(preset.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border-2 transition-colors ${
                themeBgColor === preset.value ? 'border-forest' : 'border-stone-200'
              }`}
            >
              <span className="w-4 h-4 rounded-full border border-stone-300 inline-block" style={{ backgroundColor: preset.value }} />
              {preset.label}
            </button>
          ))}
        </div>
          <div className="flex items-center gap-3">
          <input
            type="color"
            value={themeBgColor || '#FAF8F4'}
            onChange={(e) => setThemeBgColor(e.target.value)}
            className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer"
          />
          <input
            type="text"
            value={themeBgColor}
            onChange={(e) => setThemeBgColor(e.target.value)}
            placeholder="#FAF8F4"
            className={inputClass + ' flex-1'}
            maxLength={7}
          />
          </div>
        </div>

        {/* Tab-Navigationsfarbe */}
        <div>
          <label className={labelClass}>Tab-Navigationsfarbe</label>
          <p className="text-xs text-stone-400 mb-3">
            Hintergrundfarbe der Tab-Leiste. Leer lassen = Primärfarbe wird verwendet.
          </p>

          Hintergrundfarbe der Tab-Leiste unter dem Header. Leer lassen für weißen Hintergrund.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={themeNavColor || themeColor || '#2d5a3d'}
            onChange={(e) => setThemeNavColor(e.target.value)}
            className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer"
          />
          <input
            type="text"
            value={themeNavColor}
            onChange={(e) => setThemeNavColor(e.target.value)}
            placeholder="Leer = weiß (standard)"
            className={inputClass + ' flex-1'}
            maxLength={7}
          />
          {themeNavColor && (
            <button type="button" onClick={() => setThemeNavColor('')} className="text-xs text-stone-400 hover:text-stone-700 whitespace-nowrap">
              Zurücksetzen
            </button>
          )}
          </div>
        </div>
      </div>

      {/* Schriftart */}
      <div className="bg-white rounded-2xl border border-cream-deep p-6">
        <h2 className="font-serif text-lg font-bold text-stone-900 mb-1">Schriftart (Züchtername)</h2>
        <p className="text-sm text-stone-400 mb-1">
          Wähle eine Schriftart für den großen Züchternamen im Hero-Bereich deiner Seite.
        </p>
        <p className="text-xs text-stone-400 mb-4">
          Weitere Schriften findest du auf{' '}
          <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer" className="text-forest underline">
            fonts.google.com
          </a>
          {' '}— den Namen einfach unten ins Freitextfeld eintragen.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setThemeFont(f.value)}
              className={`px-3 py-2 rounded-xl text-sm border-2 transition-colors text-left ${
                themeFont === f.value ? 'border-forest bg-cream' : 'border-stone-200 hover:border-stone-300'
              }`}
              style={{ fontFamily: f.value ? `'${f.value}', serif` : 'Georgia, serif' }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={themeFont}
            onChange={(e) => setThemeFont(e.target.value)}
            placeholder="Eigener Google-Font-Name, z.B. Cinzel"
            className={inputClass}
          />
        </div>
        {themeFont && (
          <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(themeFont)}:wght@400;700&display=swap`} />
        )}
        {themeFont && (
          <p className="mt-3 text-2xl font-bold text-stone-700" style={{ fontFamily: `'${themeFont}', serif` }}>
            {breeder.kennelName} ← Vorschau
          </p>
        )}
      </div>

      {/* Ausrichtung */}
      <div className="bg-white rounded-2xl border border-cream-deep p-6">
        <h2 className="font-serif text-lg font-bold text-stone-900 mb-1">Textausrichtung (Header)</h2>
        <p className="text-sm text-stone-400 mb-4">
          Wie sollen Züchtername und Infos im Hero-Bereich angeordnet sein?
        </p>
        <div className="flex gap-3">
          {[
            { value: 'left', label: 'Links' },
            { value: 'center', label: 'Mitte' },
            { value: 'right', label: 'Rechts' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setThemeAlign(opt.value)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${
                themeAlign === opt.value ? 'border-forest bg-cream text-forest' : 'border-stone-200 text-stone-500 hover:border-stone-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bilder */}
      <div className="bg-white rounded-2xl border border-cream-deep p-6">
        <h2 className="font-serif text-lg font-bold text-stone-900 mb-1">Hintergrundbild</h2>
        <p className="text-sm text-stone-400 mb-4">
          Erscheint hinter dem gesamten Inhalt deiner Züchterseite. Wird sofort gespeichert.
          Empfohlen: ca. 1600×1200px, ruhiges Motiv ohne zu viel Kontrast.
        </p>
        <BreederImageUploader
          purpose="background"
          initialUrl={breeder.backgroundImageUrl}
          label="Hintergrundbild"
          hint="Hintergrund für die ganze Seite"
          aspect="aspect-video"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="bg-forest text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-forest-light transition-colors disabled:opacity-40"
        >
          {loading ? 'Wird gespeichert...' : 'Speichern'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="text-sm text-stone-400 hover:text-stone-700 transition-colors disabled:opacity-40"
        >
          Farben zurücksetzen
        </button>
        <Link
          href={`/zuechter/${breeder.zuechterSlug}`}
          target="_blank"
          className="ml-auto text-sm text-forest font-semibold hover:underline"
        >
          Vorschau ansehen →
        </Link>
      </div>

        <SaveToast show={success} />
      </main>
    </div>
  )
}
