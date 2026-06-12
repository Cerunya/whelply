'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Breeder = {
  id: string
  kennelName: string
  displayName: string | null
  email: string
  verificationLevel: string
  createdAt: string
  listingCount: number
  litterCount: number
  dogCount: number
}

type Listing = {
  id: string
  title: string | null
  breedName: string
  kennelName: string
  status: string
  viewCount: number
  createdAt: string
}

type Stats = {
  totalUsers: number
  totalBreeders: number
  totalListings: number
  activeListings: number
  totalViews: number
}

export default function AdminDashboard({
  breeders,
  listings,
  stats,
}: {
  breeders: Breeder[]
  listings: Listing[]
  stats: Stats
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'overview' | 'breeders' | 'listings'>('overview')
  const [busyId, setBusyId] = useState<string | null>(null)

  async function deleteListing(id: string) {
    if (!confirm('Inserat wirklich endgültig löschen?')) return
    setBusyId(id)
    const res = await fetch(`/api/admin/listings/${id}`, { method: 'DELETE' })
    setBusyId(null)
    if (res.ok) router.refresh()
    else alert('Fehler beim Löschen.')
  }

  async function deleteBreeder(id: string) {
    if (!confirm('Züchter-Konto wirklich endgültig löschen? Alle Inserate, Würfe und Hunde werden mitgelöscht.')) return
    setBusyId(id)
    const res = await fetch(`/api/admin/breeders/${id}`, { method: 'DELETE' })
    setBusyId(null)
    if (res.ok) router.refresh()
    else alert('Fehler beim Löschen.')
  }

  async function toggleVerification(id: string, current: string) {
    setBusyId(id)
    const next = current === 'none' ? 'verband' : 'none'
    const res = await fetch(`/api/admin/breeders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationLevel: next }),
    })
    setBusyId(null)
    if (res.ok) router.refresh()
    else alert('Fehler beim Aktualisieren.')
  }

  const tabClass = (active: boolean) =>
    `px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
      active ? 'bg-forest text-white' : 'bg-white border border-cream-deep text-stone-600 hover:border-forest/30'
    }`

  return (
    <div className="min-h-screen bg-cream font-sans">
      <header className="bg-white border-b border-cream-deep sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="font-serif text-lg font-bold text-stone-900">Whelply Admin</h1>
          <Link href="/dashboard" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
            Zum normalen Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Nutzer', value: stats.totalUsers },
            { label: 'Züchter', value: stats.totalBreeders },
            { label: 'Inserate gesamt', value: stats.totalListings },
            { label: 'Aktive Inserate', value: stats.activeListings },
            { label: 'Aufrufe gesamt', value: stats.totalViews },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-cream-deep p-4">
              <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
              <p className="text-xs text-stone-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('overview')} className={tabClass(tab === 'overview')}>Übersicht</button>
          <button onClick={() => setTab('breeders')} className={tabClass(tab === 'breeders')}>Züchter ({breeders.length})</button>
          <button onClick={() => setTab('listings')} className={tabClass(tab === 'listings')}>Inserate ({listings.length})</button>
        </div>

        {tab === 'overview' && (
          <div className="bg-white rounded-2xl border border-cream-deep p-7">
            <h2 className="font-serif text-xl font-bold text-stone-900 mb-2">Übersicht</h2>
            <p className="text-sm text-stone-500">
              Verwalte Züchter-Konten und Inserate über die Tabs oben. Karteileichen (leere Konten ohne
              Aktivität) findest du im Tab "Züchter" — sortiert nach Erstellungsdatum.
            </p>
          </div>
        )}

        {tab === 'breeders' && (
          <div className="bg-white rounded-2xl border border-cream-deep overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-cream-dark text-stone-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Zwinger</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">E-Mail</th>
                  <th className="px-4 py-3 font-medium">Inserate</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Würfe</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Hunde</th>
                  <th className="px-4 py-3 font-medium">Verifiziert</th>
                  <th className="px-4 py-3 font-medium text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-deep">
                {breeders.map((b) => {
                  const isEmpty = b.listingCount === 0 && b.litterCount === 0 && b.dogCount === 0
                  return (
                    <tr key={b.id} className={isEmpty ? 'bg-red-50/30' : ''}>
                      <td className="px-4 py-3 font-medium text-stone-800">
                        {b.displayName || b.kennelName}
                        {isEmpty && (
                          <span className="ml-2 text-xs text-red-400 font-normal">leer</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-stone-500 hidden md:table-cell">{b.email}</td>
                      <td className="px-4 py-3 text-stone-600">{b.listingCount}</td>
                      <td className="px-4 py-3 text-stone-600 hidden md:table-cell">{b.litterCount}</td>
                      <td className="px-4 py-3 text-stone-600 hidden md:table-cell">{b.dogCount}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleVerification(b.id, b.verificationLevel)}
                          disabled={busyId === b.id}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                            b.verificationLevel !== 'none'
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                          }`}
                        >
                          {b.verificationLevel !== 'none' ? '✓ Verifiziert' : 'Nicht verifiziert'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteBreeder(b.id)}
                          disabled={busyId === b.id}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                        >
                          Löschen
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'listings' && (
          <div className="bg-white rounded-2xl border border-cream-deep overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-cream-dark text-stone-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Rasse</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Züchter</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Aufrufe</th>
                  <th className="px-4 py-3 font-medium text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-deep">
                {listings.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3 font-medium text-stone-800">
                      <Link href={`/welpen/${l.id}`} target="_blank" className="hover:text-forest">
                        {l.title || l.breedName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden md:table-cell">{l.breedName}</td>
                    <td className="px-4 py-3 text-stone-500 hidden md:table-cell">{l.kennelName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        l.status === 'available' ? 'bg-green-50 text-green-700'
                        : l.status === 'reserved' ? 'bg-amber-50 text-amber-700'
                        : l.status === 'sold' ? 'bg-stone-200 text-stone-600'
                        : 'bg-stone-100 text-stone-500'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{l.viewCount}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteListing(l.id)}
                        disabled={busyId === l.id}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
