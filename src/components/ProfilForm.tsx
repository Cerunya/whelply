'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SaveToast from './SaveToast'
import RichEditor from './RichEditor'
import DashboardHeader from './DashboardHeader'
import BreederImageUploader from './BreederImageUploader'
import VerifizierungSection from './VerifizierungSection'
import { VERBAENDE } from '@/lib/verbaende'

const BUNDESLAENDER = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen',
  'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen',
  'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen',
  'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen',
]

type BreederData = {
  kennelName: string
  displayName: string | null
  fullName: string
  showFullName: boolean
  isPublished: boolean
  isActive: boolean
  bio: string | null
  cardImageUrl: string | null
  website: string | null
  socialInstagram: string | null
  socialFacebook: string | null
  socialTiktok: string | null
  socialYoutube: string | null
  verband: string | null
  mitgliedsnummer: string | null
  memberships: { verband: string; mitgliedsnummer: string | null }[]
  phone: string | null
  street: string | null
  zip: string | null
  city: string | null
  state: string | null
  showPhone: boolean
  showAddress: boolean
  handoverLocation: string
  visitPossible: boolean
  damVisitPossible: boolean
}

export default function ProfilForm({ breeder, verification }: { breeder: BreederData; verification?: { level: string; verifiedAt: string | null; rejectReason: string | null; diditStatus?: string | null; idDocPending?: boolean; idDocRejectReason?: string | null } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [memberships, setMemberships] = useState(
    breeder.memberships.length > 0
      ? breeder.memberships.map((m) => ({ verband: m.verband, mitgliedsnummer: m.mitgliedsnummer ?? '' }))
      : breeder.verband
        ? [{ verband: breeder.verband, mitgliedsnummer: breeder.mitgliedsnummer ?? '' }]
        : []
  )
  const [form, setForm] = useState({
    displayName: breeder.displayName ?? '',
    fullName: breeder.fullName ?? '',
    showFullName: breeder.showFullName ?? false,
    isPublished: breeder.isPublished ?? true,
    isActive: breeder.isActive ?? true,
    bio: breeder.bio ?? '',
    website: breeder.website ?? '',
    socialInstagram: breeder.socialInstagram ?? '',
    socialFacebook: breeder.socialFacebook ?? '',
    socialTiktok: breeder.socialTiktok ?? '',
    socialYoutube: breeder.socialYoutube ?? '',
    phone: breeder.phone ?? '',
    street: breeder.street ?? '',
    zip: breeder.zip ?? '',
    city: breeder.city ?? '',
    state: breeder.state ?? '',
    showPhone: breeder.showPhone,
    showAddress: breeder.showAddress,
    handoverLocation: breeder.handoverLocation ?? '',
    visitPossible: breeder.visitPossible ?? false,
    damVisitPossible: breeder.damVisitPossible ?? false,
  })


  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked })
    } else {
      setForm({ ...form, [name]: value })
    }
    setSuccess(false)
  }

  function updateMembership(index: number, field: 'verband' | 'mitgliedsnummer', value: string) {
    setMemberships((current) => current.map((membership, i) => i === index ? { ...membership, [field]: value } : membership))
    setSuccess(false)
  }

  function addMembership() {
    setMemberships((current) => [...current, { verband: '', mitgliedsnummer: '' }])
    setSuccess(false)
  }

  function removeMembership(index: number) {
    setMemberships((current) => current.filter((_, i) => i !== index))
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/profil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        memberships: memberships.filter((membership) => membership.verband),
      }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Fehler beim Speichern.')
      return
    }

    setSuccess(true)
    router.refresh()
  }

  const labelClass = 'block text-sm font-medium text-stone-700 mb-1.5'
  const inputClass = 'w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest bg-white'

  return (
    <div className="min-h-screen bg-cream font-sans">
      <DashboardHeader title="Profil" />

      {verification && (
        <div className="max-w-xl mx-auto px-4 mt-4 mb-4">
          <VerifizierungSection
            verificationLevel={verification.level}
            verifiedAt={verification.verifiedAt}
            rejectReason={verification.rejectReason}
            diditStatus={verification.diditStatus ?? null}
            idDocPending={verification.idDocPending ?? false}
            idDocRejectReason={verification.idDocRejectReason ?? null}
          />
        </div>
      )}

      <main className="max-w-xl mx-auto px-4 py-12">
        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Profil</h2>
        <p className="text-stone-400 text-sm mb-8">
          Zwingername: <span className="font-medium text-stone-600">{breeder.kennelName}</span>
          {' '}(nicht änderbar{memberships.length > 0 ? ` — ${memberships.map((m) => m.verband).filter(Boolean).join(', ')}-registriert` : ''})
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
              Profil gespeichert.
            </div>
          )}

          {/* Öffentliches Profil */}
          <div className="bg-white rounded-2xl border border-cream-deep p-7 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-stone-800 text-sm uppercase tracking-wide">
                  Öffentliches Profil
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  Diese Angaben sind für Besucher auf deiner Züchter-Seite sichtbar.
                </p>
              </div>
            </div>

            <div>
              <label className={labelClass}>Anzeigename</label>
              <input
                type="text"
                name="displayName"
                value={form.displayName}
                onChange={handleChange}
                placeholder={breeder.kennelName}
                className={inputClass}
              />
              <p className="text-xs text-stone-400 mt-1">
                Leer lassen um deinen Zwingernamen ({breeder.kennelName}) zu verwenden.
              </p>
            </div>



            <div>
              <label className={labelClass}>Vorschaubild für Züchter-Verzeichnis</label>
              <p className="text-xs text-stone-400 mb-3">
                Erscheint als Hintergrund deiner Karte im Züchter-Verzeichnis. Querformat empfohlen, min. 600×300 px.
              </p>
              <BreederImageUploader
                purpose="card"
                initialUrl={breeder.cardImageUrl}
                label="Karten-Vorschaubild"
                hint="Querformat empfohlen · JPG, PNG oder WebP"
                aspect="aspect-[2/1]"
              />
            </div>

            <div>
              <label className={labelClass}>Webseite</label>
              <input
                type="url"
                name="website"
                value={form.website}
                onChange={handleChange}
                placeholder="https://..."
                className={inputClass}
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-stone-700 mb-3">Social Media</p>
              <div className="space-y-3">
                {[
                  { key: 'socialInstagram', label: 'Instagram', placeholder: 'https://instagram.com/deinname' },
                  { key: 'socialFacebook', label: 'Facebook', placeholder: 'https://facebook.com/deinname' },
                  { key: 'socialTiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@deinname' },
                  { key: 'socialYoutube', label: 'YouTube', placeholder: 'https://youtube.com/@deinkanal' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-stone-400 w-20 flex-shrink-0">{label}</span>
                    <input
                      type="url"
                      name={key}
                      value={form[key as keyof typeof form] as string}
                      onChange={handleChange}
                      placeholder={placeholder}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3">
                <p className="text-sm font-semibold text-stone-700">Zuchtverbände</p>
                <p className="mt-1 text-xs text-stone-400">
                  Füge für jede Rasse beziehungsweise Mitgliedschaft einen Verband hinzu. Die Mitgliedsnummer ist optional und kann pro Verband abweichen.
                </p>
              </div>
              <div className="space-y-3">
                {memberships.map((membership, index) => (
                  <div key={index} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelClass} htmlFor={`verband-${index}`}>Verband {index + 1}</label>
                        <select
                          id={`verband-${index}`}
                          value={membership.verband}
                          onChange={(e) => updateMembership(index, 'verband', e.target.value)}
                          className={inputClass}
                        >
                          <option value="">— Verband wählen —</option>
                          {VERBAENDE.map((v) => (
                            <option key={v.value} value={v.value}>{v.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass} htmlFor={`mitgliedsnummer-${index}`}>Mitgliedsnummer</label>
                        <input
                          id={`mitgliedsnummer-${index}`}
                          type="text"
                          maxLength={50}
                          value={membership.mitgliedsnummer}
                          onChange={(e) => updateMembership(index, 'mitgliedsnummer', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMembership(index)}
                      className="mt-2 text-xs font-medium text-stone-400 hover:text-red-600"
                    >
                      Mitgliedschaft entfernen
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addMembership}
                className="mt-3 rounded-xl border border-forest/25 px-4 py-2.5 text-sm font-semibold text-forest hover:bg-forest/5"
              >
                + Weiteren Verband hinzufügen
              </button>
              <div>
                <a href="mailto:info@whelply.de?subject=Verband%20vorschlagen&body=Hallo%2C%0A%0Aich%20möchte%20folgenden%20Verband%20vorschlagen%3A%0A%0AName%3A%20%0AWebsite%3A%20%0A%0ADanke!" className="text-xs text-forest hover:underline mt-2 inline-block">
                  Dein Verband fehlt? Vorschlagen →
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Stadt</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Bundesland</label>
                <select name="state" value={form.state} onChange={handleChange} className={inputClass}>
                  <option value="">Nicht angegeben</option>
                  {BUNDESLAENDER.map((bl) => (
                    <option key={bl} value={bl}>{bl}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Private Kontaktdaten */}
          <div className="bg-white rounded-2xl border border-cream-deep p-7 space-y-5">
            <h3 className="font-semibold text-stone-800 text-sm uppercase tracking-wide">
              Private Kontaktdaten
            </h3>
            <p className="text-xs text-stone-400 -mt-3">
              Standardmäßig nicht öffentlich sichtbar. Nötig für Verifizierung und Kontaktaufnahme durch Whelply.
              Du kannst unten festlegen, ob diese Angaben auf deiner Züchter-Seite angezeigt werden sollen.
            </p>

            <div>
              <label className={labelClass}>Vor- / Nachname</label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="z.B. Maria Mustermann"
                className={inputClass}
              />
              <p className="text-xs text-stone-400 mt-1">
                Optionaler echter Name — wird nur angezeigt wenn unten aktiviert.
              </p>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="showFullName"
                  checked={form.showFullName}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-stone-300 text-forest accent-forest"
                />
                <span className="text-sm text-stone-700">Namen auf der Züchterseite anzeigen</span>
              </label>
            </div>

            <div>
              <label className={labelClass}>Telefonnummer</label>
              <input
                type="tel"
                name="phone"
                maxLength={20}
                value={form.phone}
                onChange={handleChange}
                placeholder="+49 ..."
                className={inputClass}
              />
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="showPhone"
                  checked={form.showPhone}
                  onChange={handleChange}
                  className="w-4 h-4 accent-forest"
                />
                <span className="text-xs text-stone-500">
                  Telefonnummer auf meiner Züchter-Seite öffentlich anzeigen
                </span>
              </label>
            </div>

            <div>
              <label className={labelClass}>Straße & Hausnummer</label>
              <input
                type="text"
                name="street"
                value={form.street}
                onChange={handleChange}
                className={inputClass}
              />
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="showAddress"
                  checked={form.showAddress}
                  onChange={handleChange}
                  className="w-4 h-4 accent-forest"
                />
                <span className="text-xs text-stone-500">
                  Vollständige Adresse (Straße + PLZ) auf meiner Züchter-Seite öffentlich anzeigen.
                  Stadt und Bundesland sind unabhängig davon immer sichtbar.
                </span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>PLZ</label>
                <input
                  type="text"
                  name="zip"
                  value={form.zip}
                  onChange={handleChange}
                  maxLength={5}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest text-white py-3 rounded-xl text-sm font-bold hover:bg-forest-light transition-colors disabled:opacity-40"
          >
            {loading ? 'Wird gespeichert...' : 'Profil speichern'}
          </button>
        </form>
      </main>
      <SaveToast show={success} />
    </div>
  )
}
