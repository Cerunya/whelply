'use client'

import { useState } from 'react'

// Formular für /admin/einstellungen — Boost-Preis + Frequenz-Deckel.
// Speichert über PATCH /api/admin/einstellungen in platform_settings.
export default function EinstellungenForm({
  initialPriceCents,
  initialCooldownDays,
}: {
  initialPriceCents: number
  initialCooldownDays: number
}) {
  const [priceEuro, setPriceEuro] = useState(
    (initialPriceCents / 100).toFixed(2).replace('.', ',')
  )
  const [cooldownDays, setCooldownDays] = useState(String(initialCooldownDays))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const priceCents = Math.round(parseFloat(priceEuro.replace(',', '.')) * 100)
  const validPrice = Number.isFinite(priceCents) && priceCents >= 50 && priceCents <= 50000
  const cooldown = Math.round(Number(cooldownDays))
  const validCooldown = Number.isFinite(cooldown) && cooldown >= 1 && cooldown <= 30

  // Stripe-Gebühr für europäische Standardkarten: 1,5 % + 0,25 €
  const stripeFeeCents = validPrice ? priceCents * 0.015 + 25 : 0
  const netCents = validPrice ? priceCents - stripeFeeCents : 0

  async function save() {
    if (!validPrice || !validCooldown) return
    setSaving(true)
    setError(null)
    setSaved(false)
    const res = await fetch('/api/admin/einstellungen', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boostPriceCents: priceCents, boostCooldownDays: cooldown }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Fehler beim Speichern.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Preis */}
      <div className="bg-white rounded-2xl border border-cream-deep p-6">
        <h2 className="font-semibold text-stone-900 mb-1">Preis der Topanzeige</h2>
        <p className="text-xs text-stone-400 mb-4">
          Einmalzahlung für 24 Stunden im Empfohlen-Bereich. Gilt für alle <strong>neuen</strong> Käufe —
          bereits gekaufte Boosts behalten ihren damaligen Preis.
        </p>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={priceEuro}
              onChange={(e) => setPriceEuro(e.target.value)}
              className="border border-stone-200 rounded-xl px-4 py-2.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-forest/30"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">€</span>
          </div>
          {validPrice && (
            <p className="text-xs text-stone-400">
              ≈ <strong className="text-stone-600">{(netCents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</strong> netto
              nach Stripe-Gebühr (1,5 % + 0,25 €)
            </p>
          )}
        </div>
        {!validPrice && (
          <p className="text-xs text-red-500 mt-2">
            Bitte einen Betrag zwischen 0,50 € und 500,00 € eingeben (Stripe-Mindestbetrag: 0,50 €).
          </p>
        )}
      </div>

      {/* Frequenz-Deckel */}
      <div className="bg-white rounded-2xl border border-cream-deep p-6">
        <h2 className="font-semibold text-stone-900 mb-1">Frequenz-Deckel</h2>
        <p className="text-xs text-stone-400 mb-4">
          Wie oft darf dasselbe Inserat geboostet werden? Verhindert, dass wenige Züchter den
          Empfohlen-Bereich dauerhaft belegen. Gilt sofort — auch rückwirkend für kürzlich
          gekaufte Boosts.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={30}
            value={cooldownDays}
            onChange={(e) => setCooldownDays(e.target.value)}
            className="border border-stone-200 rounded-xl px-4 py-2.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-forest/30"
          />
          <p className="text-sm text-stone-600">
            Tage Sperrzeit = <strong>1 Boost {cooldown === 7 ? 'pro Woche' : cooldown === 1 ? 'pro Tag' : `alle ${cooldownDays} Tage`}</strong> pro Inserat
          </p>
        </div>
        {!validCooldown && (
          <p className="text-xs text-red-500 mt-2">Bitte einen Wert zwischen 1 und 30 Tagen eingeben.</p>
        )}
      </div>

      {/* Speichern */}
      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving || !validPrice || !validCooldown}
          className="bg-forest text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-forest-light transition-colors disabled:opacity-40"
        >
          {saving ? 'Speichern…' : 'Einstellungen speichern'}
        </button>
        {saved && (
          <span className="text-sm text-green-700 font-medium">✓ Gespeichert — gilt sofort</span>
        )}
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>

      <p className="text-xs text-stone-400">
        Hinweis: Bei einer Preisänderung muss nichts in Stripe geändert werden — der Preis wird bei
        jedem Kauf direkt von Whelply an Stripe übergeben.
      </p>
    </div>
  )
}
