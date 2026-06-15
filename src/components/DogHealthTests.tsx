'use client'

import { useState } from 'react'

type HealthTest = {
  id: string
  name: string
  result: string
  testDate: string | null
}

export default function DogHealthTests({
  dogId,
  initialTests,
}: {
  dogId: string
  initialTests: HealthTest[]
}) {
  const [tests, setTests] = useState<HealthTest[]>(initialTests)
  const [name, setName] = useState('')
  const [result, setResult] = useState('')
  const [testDate, setTestDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch(`/api/hunde/${dogId}/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, result, testDate: testDate || null }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Fehler beim Speichern.')
      return
    }

    setTests((prev) => [...prev, data])
    setName('')
    setResult('')
    setTestDate('')
  }

  async function handleDelete(testId: string) {
    const res = await fetch(`/api/hunde/${dogId}/tests/${testId}`, { method: 'DELETE' })
    if (res.ok) {
      setTests((prev) => prev.filter((t) => t.id !== testId))
    }
  }

  const inputClass = 'w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest bg-white'

  return (
    <div className="bg-white rounded-2xl border border-cream-deep p-7">
      <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">Gesundheitstests</h3>
      <p className="text-xs text-stone-400 mb-4">
        z.B. HD/ED-Auswertung, DNA-Augenuntersuchung, Gentests — erscheinen auf dem Profil dieses Hundes.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {tests.length > 0 && (
        <div className="space-y-2 mb-4">
          {tests.map((test) => (
            <div key={test.id} className="flex items-center justify-between gap-3 bg-cream rounded-xl px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-800">
                  {test.name}: <span className="font-normal text-stone-600">{test.result}</span>
                </p>
                {test.testDate && (
                  <p className="text-xs text-stone-400">
                    {new Date(test.testDate).toLocaleDateString('de-DE')}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(test.id)}
                className="text-stone-400 hover:text-red-500 transition-colors flex-shrink-0"
                aria-label="Entfernen"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Test (z.B. HD/ED)"
          required
          maxLength={100}
          className={inputClass}
        />
        <input
          type="text"
          value={result}
          onChange={(e) => setResult(e.target.value)}
          placeholder="Ergebnis (z.B. HD-A, frei)"
          required
          maxLength={100}
          className={inputClass}
        />
        <input
          type="date"
          value={testDate}
          onChange={(e) => setTestDate(e.target.value)}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={loading || !name || !result}
          className="bg-forest text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-forest-light transition-colors disabled:opacity-40 whitespace-nowrap"
        >
          + Hinzufügen
        </button>
      </form>
    </div>
  )
}
