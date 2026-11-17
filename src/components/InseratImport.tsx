'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardHeader from './DashboardHeader'
import type { ImportedListing } from '@/lib/inserat-import'

type Breed = { id: number; nameDe: string }

export default function InseratImport({ breeds }: { breeds: Breed[] }) {
  const router = useRouter()
  const [platform, setPlatform] = useState<'edogs' | 'snautz'>('edogs')
  const [url, setUrl] = useState('')
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false)
  const [preview, setPreview] = useState<ImportedListing | null>(null)
  const [priceEuro, setPriceEuro] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [createdId, setCreatedId] = useState('')

  const inputClass = 'min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30'
  const labelClass = 'mb-1.5 block text-sm font-medium text-stone-700'

  async function loadPreview() {
    setLoading(true)
    setError('')
    setPreview(null)
    try {
      const response = await fetch('/api/inserat-import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, url, ownershipConfirmed }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Import fehlgeschlagen')
      setPreview(data)
      setPriceEuro(data.priceCents ? String(data.priceCents / 100) : '')
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  function update<K extends keyof ImportedListing>(key: K, value: ImportedListing[K]) {
    setPreview((current) => current ? { ...current, [key]: value } : current)
  }

  async function createDraft() {
    if (!preview?.breedId) { setError('Bitte wähle eine Rasse aus.'); return }
    setSaving(true)
    setError('')
    setCreatedId('')
    try {
      const response = await fetch('/api/inserate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: preview.title || null, type: preview.type, breedId: preview.breedId,
          priceCents: priceEuro ? Math.round(Number(priceEuro) * 100) : null,
          sex: preview.sex, description: preview.description || null, status: 'draft',
          hasPedigree: preview.hasPedigree, isVaccinated: preview.isVaccinated,
          isDewormed: preview.isDewormed, isChipped: preview.isChipped,
        }),
      })
      const created = await response.json()
      if (!response.ok) throw new Error(created.error || 'Inserat konnte nicht angelegt werden')
      setCreatedId(created.id)
      if (preview.images.length) {
        const imageResponse = await fetch(`/api/inserate/${created.id}/import-bilder`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ urls: preview.images }),
        })
        if (!imageResponse.ok) {
          const imageError = await imageResponse.json().catch(() => null)
          throw new Error(`Entwurf angelegt, aber Bilder nicht übernommen: ${imageError?.error || 'Fehler beim Bildimport'}`)
        }
      }
      router.push(`/dashboard/inserat/${created.id}`)
      router.refresh()
    } catch (err: any) { setError(err.message) } finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-cream">
      <DashboardHeader title="Inserat importieren" backHref="/dashboard" backLabel="Dashboard" />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8"><div className="flex flex-wrap items-center gap-3"><h1 className="font-serif text-3xl font-bold text-stone-900">Eigenes Inserat übernehmen</h1><span className="rounded-full bg-honey/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-honey">Beta</span></div><p className="mt-2 text-sm leading-relaxed text-stone-500">Importiere dein edogs- oder Snautz-Inserat, prüfe alle Angaben und speichere es zunächst als Entwurf.</p></div>
        <section className="rounded-2xl border border-cream-deep bg-white p-5 sm:p-7">
          <label className={labelClass} htmlFor="import-platform">Plattform</label>
          <select id="import-platform" value={platform} onChange={(event) => { setPlatform(event.target.value as 'edogs' | 'snautz'); setUrl(''); setPreview(null); setError('') }} className={`${inputClass} mb-5`}>
            <option value="edogs">edogs.de</option>
            <option value="snautz">snautz.de</option>
          </select>
          <label className={labelClass} htmlFor="import-url">Link zu deinem {platform === 'edogs' ? 'edogs' : 'Snautz'}-Inserat</label>
          <input id="import-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder={platform === 'edogs' ? 'https://www.edogs.de/…/1234567.html' : 'https://www.snautz.de/a/hund/…-123456789'} className={inputClass}/>
          <p className="mt-2 text-xs leading-relaxed text-stone-400">Das Inserat muss öffentlich aufrufbar sein. Whelply liest es einmalig aus.</p>
          <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-stone-600"><input type="checkbox" checked={ownershipConfirmed} onChange={(event) => setOwnershipConfirmed(event.target.checked)} className="mt-1 h-4 w-4 rounded border-stone-300 text-forest"/><span>Ich bestätige, dass dies mein eigenes Inserat ist und ich Texte und Bilder auf Whelply verwenden darf.</span></label>
          <button type="button" onClick={loadPreview} disabled={loading || !ownershipConfirmed || !url} className="mt-5 min-h-11 w-full rounded-xl bg-forest px-5 text-sm font-bold text-white disabled:opacity-40">{loading ? 'Daten werden gelesen…' : 'Vorschau erstellen'}</button>
        </section>
        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}{createdId && <Link href={`/dashboard/inserat/${createdId}`} className="ml-2 font-semibold underline">Zum Entwurf</Link>}</div>}
        {preview && <section className="mt-8 rounded-2xl border border-cream-deep bg-white p-5 sm:p-7">
          <div className="mb-6"><p className="text-[11px] font-bold uppercase tracking-wider text-honey">Importierte Daten</p><h2 className="mt-1 font-serif text-2xl font-bold text-forest">Vorschau prüfen</h2><p className="mt-1 text-sm text-stone-400">Ergänze fehlende Angaben. Es wird noch nichts veröffentlicht.</p></div>
          <div className="space-y-4">
            <div><label className={labelClass}>Titel</label><input value={preview.title} onChange={(event) => update('title', event.target.value)} className={inputClass}/></div>
            <div className="grid gap-4 sm:grid-cols-2"><div><label className={labelClass}>Art</label><select value={preview.type} onChange={(event) => update('type', event.target.value as ImportedListing['type'])} className={inputClass}><option value="puppy">Welpe</option><option value="adult_dog">Erwachsener Hund</option><option value="stud">Deckrüde</option></select></div><div><label className={labelClass}>Geschlecht</label><select value={preview.sex ?? ''} onChange={(event) => update('sex', (event.target.value || null) as ImportedListing['sex'])} className={inputClass}><option value="">Nicht angegeben</option><option value="male">Rüde</option><option value="female">Hündin</option></select></div></div>
            <div><label className={labelClass}>Rasse {preview.breedName && !preview.breedId && <span className="font-normal text-honey">· „{preview.breedName}“ bitte manuell zuordnen</span>}</label><select value={preview.breedId ?? ''} onChange={(event) => update('breedId', Number(event.target.value) || null)} className={inputClass}><option value="">Rasse auswählen</option>{breeds.map((breed) => <option key={breed.id} value={breed.id}>{breed.nameDe}</option>)}</select></div>
            <div><label className={labelClass}>Preis in € (leer = auf Anfrage)</label><input type="number" min="1" step="1" value={priceEuro} onChange={(event) => setPriceEuro(event.target.value)} className={inputClass}/></div>
            <div><label className={labelClass}>Beschreibung</label><textarea value={preview.description} onChange={(event) => update('description', event.target.value)} rows={7} className={inputClass}/></div>
            <div className="flex flex-wrap gap-3">{([['hasPedigree', 'Ahnentafel'], ['isVaccinated', 'Geimpft'], ['isDewormed', 'Entwurmt'], ['isChipped', 'Gechippt']] as const).map(([key, label]) => <label key={key} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-cream-deep px-3 text-sm"><input type="checkbox" checked={preview[key]} onChange={(event) => update(key, event.target.checked)} className="h-4 w-4 text-forest"/>{label}</label>)}</div>
            {preview.images.length > 0 && <div><label className={labelClass}>{preview.images.length} Bilder werden übernommen</label><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{preview.images.map((image, index) => <img key={`${image}-${index}`} src={image} alt={`Importvorschau ${index + 1}`} className="aspect-square w-full rounded-xl border border-cream-deep object-cover"/>)}</div></div>}
          </div>
          <button type="button" onClick={createDraft} disabled={saving || !preview.breedId} className="mt-6 min-h-12 w-full rounded-xl bg-forest px-5 text-sm font-bold text-white disabled:opacity-40">{saving ? 'Entwurf und Bilder werden gespeichert…' : 'Als Entwurf auf Whelply anlegen'}</button>
        </section>}
      </main>
    </div>
  )
}
