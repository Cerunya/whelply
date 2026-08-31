'use client'

import { useState, useEffect } from 'react'

type DayHours = { open: boolean; from1: string; to1: string; from2: string; to2: string }

const DAY_MAP = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

function isOpenNow(hours: Record<string, DayHours>): boolean {
  const now = new Date()
  const dayName = DAY_MAP[now.getDay()]
  const day = hours[dayName]
  if (!day?.open) return false

  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  function timeToMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + (m || 0)
  }

  // Slot 1
  if (currentMinutes >= timeToMinutes(day.from1) && currentMinutes < timeToMinutes(day.to1)) return true
  // Slot 2
  if (day.from2 && day.to2 && day.from2 !== day.to2) {
    if (currentMinutes >= timeToMinutes(day.from2) && currentMinutes < timeToMinutes(day.to2)) return true
  }

  return false
}

export default function OpenStatus({ hours, contactColor }: { hours: Record<string, DayHours>; contactColor: string }) {
  const [open, setOpen] = useState<boolean | null>(null)

  useEffect(() => {
    setOpen(isOpenNow(hours))
    const interval = setInterval(() => setOpen(isOpenNow(hours)), 60000)
    return () => clearInterval(interval)
  }, [hours])

  if (open === null) return null

  return (
    <div
      className="rounded-2xl p-4 text-center font-bold text-sm border-2"
      style={{
        backgroundColor: open ? contactColor + '10' : '#fef2f2',
        borderColor: open ? contactColor : '#fca5a5',
        color: open ? contactColor : '#dc2626',
      }}
    >
      {open ? '● Aktuell geöffnet' : '● Aktuell geschlossen'}
    </div>
  )
}
