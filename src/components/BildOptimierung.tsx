'use client'

import { useState } from 'react'

// Ruft /api/admin/media-optimize in einer Schleife auf, bis alle Bilder geprüft sind.
// Jeder Aufruf verarbeitet 15 Medien-Einträge (serverseitig auf max. 30 begrenzt).
export default function BildOptimierung() {
  const [running, setRunning] = useState(false)
  const [processed, setProcessed] = useState(0)
  const [total, setTotal] = useState<number | null>(null)
  const [optimized, setOptimized] = useState(0)
  const [savedBytes, setSavedBytes] = useState(0)
  const [failed, setFailed] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function run() {
    setRunning(true)
    setError('')
    setDone(false)
    setProcessed(0)
    setOptimized(0)
    setSavedBytes(0)
    setFailed(0)

    let offset = 0
    let accProcessed = 0
    let accOptimized = 0
    let accSaved = 0
    let accFailed = 0

    try {
      for (;;) {
        const res = await fetch('/api/admin/media-optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offset, limit: 15 }),
        })
        const d = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(d.error || `Fehler ${res.status}`)
        }
        accProcessed += d.processed
        accOptimized += d.optimized
        accSaved += d.savedBytes
        accFailed += d.failed
        setProcessed(accProcessed)
        setOptimized(accOptimized)
        setSavedBytes(accSaved)
        setFailed(accFailed)
        setTotal(d.total)
        if (d.done) break
        offset = d.nextOffset
      }
      setDone(true)
    } catch (e: any) {
      setError(e?.message || 'Unbekannter Fehler')
    } finally {
      setRunning(false)
    }
  }

  const pct = total ? Math.min(100, Math.round((processed / total) * 100)) : 0

  return (
    <div className="bg-white rounded-2xl border border-cream-deep p-6">
      <p className="text-sm text-stone-500 mb-4">
        Komprimiert zu große Bilder nachträglich (alte Uploads von vor der automatischen
        Komprimierung). Dateien über 250 KB werden auf max. 1600 px verkleinert und mit
        78 % Qualität neu gespeichert — URLs und Zuordnungen bleiben unverändert.
        Kann jederzeit wiederholt werden; bereits kleine Bilder werden übersprungen.
      </p>

      <button
        onClick={run}
        disabled={running}
        className="bg-forest text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-forest/90 transition-colors disabled:opacity-50"
      >
        {running ? 'Optimiere…' : 'Bilder jetzt optimieren'}
      </button>

      {(running || done || error) && (
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-cream-deep rounded-full overflow-hidden">
              <div
                className="h-full bg-forest rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-stone-400 whitespace-nowrap">
              {processed}{total ? ` von ${total}` : ''} geprüft
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            {optimized} optimiert
            {savedBytes > 0 && ` · ${(savedBytes / 1024 / 1024).toFixed(1)} MB eingespart`}
            {failed > 0 && ` · ${failed} fehlgeschlagen`}
          </p>
          {done && (
            <p className="text-sm text-green-700 font-medium mt-2">
              ✓ Fertig — alle Bilder wurden geprüft.
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
