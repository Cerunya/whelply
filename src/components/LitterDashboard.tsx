'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LitterImageUploader from './LitterImageUploader'
import SaveToast from './SaveToast'

type Litter = {
  id: string
  breedId: number
  breedName: string
  name: string | null
  damId: string | null
  sireId: string | null
  damName: string | null
  sireName: string | null
  sireExternal: string | null
  expectedDate: string | null
  bornDate: string | null
  puppyCount: number | null
  status: string
  notes: string | null
  imageUrl: string | null
}

type DogOption = { id: string; name: string; sex: string; breedId: number }
type Breed = { id: number; nameDe: string }

type Puppy = {
  listingId: string
  dogId: string | null
  name: string
  sex: string | null
  status: string
  priceCents: number | null
  imageUrl: string | null
}

const STATUS_LABELS: Record<string, string> = {
  planned: 'Geplant',
  pregnant: 'Trächtig',
  born: 'Geboren',
  available: 'Welpen abgabebereit',
  sold_out: 'Ausverkauft',
}

export default function LitterDashboard({
  litter,
  puppies,
  breeds = [],
  dams = [],
  sires = [],
}: {
  litter: Litter
  puppies: Puppy[]
  breeds?: Breed[]
  dams?: DogOption[]
  sires?: DogOption[]
}) {
  const router = useRouter()
  const [status, setStatus] = useState(litter.status)
  const [selectedStatus, setSelectedStatus] = useState(litter.status)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Wurf-Details (bearbeitbar)
  const [details, setDetails] = useState({
    breedId: String(litter.breedId),
    name: litter.name ?? '',
    damId: litter.damId ?? '',
    sireId: litter.sireId ?? '',
    sireExternal: litter.sireExternal ?? '',
    expectedDate: litter.expectedDate ?? '',
    bornDate: litter.bornDate ?? '',
    puppyCount: litter.puppyCount ? String(litter.puppyCount) : '',
    notes: litter.notes ?? '',
  })
  const [savingDetails, setSavingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [detailsSuccess, setDetailsSuccess] = useState(false)

  const matchingDams = dams.filter((d) => d.breedId === Number(details.breedId))
  const matchingSires = sires.filter((s) => s.breedId === Number(details.breedId))

  const hasPuppies = puppies.length > 0

  function handleDetailsChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    if (name === 'breedId') {
      // Bei Rassenwechsel Mutter/Vater zurücksetzen, falls sie nicht mehr zur neuen Rasse passen
      const newBreedId = Number(value)
      const damStillValid = dams.some((d) => d.id === details.damId && d.breedId === newBreedId)
      const sireStillValid = sires.some((s) => s.id === details.sireId && s.breedId === newBreedId)
      setDetails({
        ...details,
        breedId: value,
        damId: damStillValid ? details.damId : '',
        sireId: sireStillValid ? details.sireId : '',
      })
    } else {
      setDetails({ ...details, [name]: value })
    }
    setDetailsSuccess(false)
  }

  async function handleDetailsSave() {
    setDetailsError('')
    setDetailsSuccess(false)
    setSavingDetails(true)

    const res = await fetch(`/api/wuerfe/${litter.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        breedId: Number(details.breedId),
        name: details.name || null,
        damId: details.damId || null,
        sireId: details.sireId || null,
        sireExternal: details.sireId ? null : (details.sireExternal || null),
        expectedDate: details.expectedDate || null,
        bornDate: details.bornDate || null,
        puppyCount: details.puppyCount ? Number(details.puppyCount) : null,
        notes: details.notes || null,
      }),
    })
    setSavingDetails(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setDetailsError(data.error ?? 'Fehler beim Speichern.')
      return
    }

    setDetailsSuccess(true)
    router.refresh()
  }

  async function handleStatusSave() {
    setError('')
    setSuccess(false)

    if ((selectedStatus === 'available' || selectedStatus === 'sold_out') && !hasPuppies) {
      setError('Du musst zuerst mindestens einen Welpen hinzufügen, bevor der Wurf als "abgabebereit" oder "ausverkauft" markiert werden kann.')
      return
    }

    setSaving(true)
    const res = await fetch(`/api/wuerfe/${litter.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: selectedStatus }),
    })
    setSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Fehler beim Speichern.')
      return
    }

    setStatus(selectedStatus)
    setSuccess(true)
    router.refresh()
  }

  const labelClass = 'block text-sm font-medium text-stone-700 mb-1.5'
  const inputClass = 'w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest bg-white'

  return (
    <div className="min-h-screen bg-cream font-sans">
      <header className="bg-white border-b border-cream-deep sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/dashboard" className="text-stone-400 hover:text-stone-700 transition-colors text-sm">
            ← Dashboard
          </Link>
          <span className="text-stone-300">|</span>
          <h1 className="font-semibold text-stone-800 text-sm">Wurf verwalten</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">
          {litter.breedName}
        </h2>
        <p className="text-stone-400 text-sm mb-8">
          {litter.damName && `Mutter: ${litter.damName}`}
          {litter.damName && litter.sireName && ' · '}
          {litter.sireName && `Vater: ${litter.sireName}`}
          {litter.bornDate && ` · Geboren am ${new Date(litter.bornDate).toLocaleDateString('de-DE')}`}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
            {error}
          </div>
        )}

        {/* Wurf-Details */}
        <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-6 space-y-5">
          <h3 className="font-serif text-lg font-bold text-stone-900">Wurf-Details</h3>

          {detailsError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {detailsError}
            </div>
          )}

          <div>
            <label className={labelClass}>Wurfname (optional)</label>
            <input
              type="text"
              name="name"
              value={details.name}
              onChange={handleDetailsChange}
              placeholder="z.B. „A-Wurf“, „Frühlingswurf 2026“..."
              className={inputClass}
            />
            <p className="text-xs text-stone-400 mt-1">
              Hilft, mehrere Würfe derselben Rasse zu unterscheiden. Ohne Namen wird die Rasse angezeigt.
            </p>
          </div>

          <div>
            <label className={labelClass}>Rasse <span className="text-red-400">*</span></label>
            <select name="breedId" value={details.breedId} onChange={handleDetailsChange} className={inputClass}>
              {breeds.map((b) => (
                <option key={b.id} value={b.id}>{b.nameDe}</option>
              ))}
            </select>
            {hasPuppies && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠ Eine Änderung der Rasse wird auf alle bereits eingetragenen Welpen dieses Wurfs übertragen.
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Mutterhündin</label>
            <select name="damId" value={details.damId} onChange={handleDetailsChange} className={inputClass}>
              <option value="">Nicht angegeben</option>
              {matchingDams.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Deckrüde</label>
            <select name="sireId" value={details.sireId} onChange={handleDetailsChange} className={inputClass}>
              <option value="">Externer Deckrüde / nicht angegeben</option>
              {matchingSires.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {!details.sireId && (
            <div>
              <label className={labelClass}>Name des externen Deckrüden</label>
              <input
                type="text"
                name="sireExternal"
                value={details.sireExternal}
                onChange={handleDetailsChange}
                placeholder="Falls der Deckrüde nicht auf Whelply registriert ist"
                className={inputClass}
              />
            </div>
          )}

          {(selectedStatus === 'planned' || selectedStatus === 'pregnant') && (
            <div>
              <label className={labelClass}>Erwartetes Datum</label>
              <input
                type="text"
                name="expectedDate"
                value={details.expectedDate}
                onChange={handleDetailsChange}
                placeholder="z.B. Ende Mai 2026"
                className={inputClass}
              />
              <p className="text-xs text-stone-400 mt-1">
                Freitext — muss kein genaues Datum sein.
              </p>
            </div>
          )}

          {(selectedStatus === 'born' || selectedStatus === 'available' || selectedStatus === 'sold_out') && (
            <div>
              <label className={labelClass}>Geburtsdatum</label>
              <input
                type="date"
                name="bornDate"
                value={details.bornDate}
                onChange={handleDetailsChange}
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className={labelClass}>Anzahl Welpen (geplant)</label>
            <input
              type="number"
              name="puppyCount"
              value={details.puppyCount}
              onChange={handleDetailsChange}
              min="1"
              max="20"
              placeholder="z.B. 6"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Notizen</label>
            <textarea
              name="notes"
              value={details.notes}
              onChange={handleDetailsChange}
              rows={3}
              placeholder="Besonderheiten zum Wurf, Farben, Gesundheitstests der Eltern..."
              className={inputClass + ' resize-none'}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDetailsSave}
              disabled={savingDetails}
              className="bg-forest text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-forest-light transition-colors disabled:opacity-40"
            >
              {savingDetails ? 'Speichert...' : 'Details speichern'}
            </button>
            {detailsSuccess && (
              <p className="text-xs text-green-600">✓ Gespeichert.</p>
            )}
          </div>
        </div>

        {/* Titelbild */}
        <div className="mb-6">
          <label className={labelClass}>Titelbild / Ankündigungsbild</label>
          <LitterImageUploader litterId={litter.id} initialUrl={litter.imageUrl} />
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-6">
          <label className={labelClass}>Wurf-Status</label>
          <div className="flex gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setSuccess(false) }}
              disabled={saving}
              className={inputClass}
            >
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleStatusSave}
              disabled={saving || selectedStatus === status}
              className="bg-forest text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-forest-light transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              {saving ? 'Speichert...' : 'Speichern'}
            </button>
          </div>
          {success && (
            <p className="text-xs text-green-600 mt-2">✓ Status gespeichert.</p>
          )}
          {!hasPuppies && (
            <p className="text-xs text-amber-600 mt-2">
              ⚠ Noch keine Welpen eingetragen. "Welpen abgabebereit" und "Ausverkauft" können
              erst gewählt werden, wenn mindestens ein Welpe unten hinzugefügt wurde.
            </p>
          )}
        </div>

        {/* Welpen-Liste */}
        <div className="bg-white rounded-2xl border border-cream-deep p-7">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Welpen ({puppies.length}{litter.puppyCount ? ` von ${litter.puppyCount}` : ''})
            </h3>
            <Link
              href={`/dashboard/wurf/${litter.id}/welpe-hinzufuegen`}
              className="bg-forest text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-forest-light transition-colors"
            >
              + Welpe hinzufügen
            </Link>
          </div>

          {puppies.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-8">
              Noch keine Welpen eingetragen.
            </p>
          ) : (
            <div className="space-y-2">
              {puppies.map((puppy) => (
                <Link
                  key={puppy.listingId}
                  href={`/dashboard/inserat/${puppy.listingId}`}
                  className="flex items-center gap-4 p-3 rounded-xl border border-cream-deep hover:border-forest/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-cream-dark overflow-hidden flex items-center justify-center flex-shrink-0">
                    {puppy.imageUrl ? (
                      <img src={puppy.imageUrl} alt={puppy.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-6 h-6 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-stone-800 text-sm">{puppy.name}</p>
                    <p className="text-xs text-stone-400">
                      {puppy.sex === 'male' ? 'Rüde' : puppy.sex === 'female' ? 'Hündin' : ''}
                      {puppy.priceCents ? ` · ${(puppy.priceCents / 100).toLocaleString('de-DE')} €` : ' · Auf Anfrage'}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    puppy.status === 'available' ? 'bg-green-50 text-green-700'
                    : puppy.status === 'reserved' ? 'bg-amber-50 text-amber-700'
                    : puppy.status === 'sold' ? 'bg-stone-200 text-stone-600'
                    : 'bg-stone-100 text-stone-500'
                  }`}>
                    {puppy.status === 'available' ? 'Aktiv'
                      : puppy.status === 'reserved' ? 'Reserviert'
                      : puppy.status === 'sold' ? 'Verkauft'
                      : 'Entwurf'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <SaveToast show={success || detailsSuccess} />
    </div>
  )
}
