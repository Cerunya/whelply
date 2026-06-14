'use client'

import { useEffect, useState } from 'react'

export default function SaveToast({
  show,
  message = 'Gespeichert',
}: {
  show: boolean
  message?: string
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), 2500)
      return () => clearTimeout(timer)
    }
  }, [show])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-forest text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 max-w-[90vw]">
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span>{message}</span>
    </div>
  )
}
