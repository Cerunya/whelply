'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  listingId?: string
  litterId?: string
  breederId?: string
  initialBookmarked?: boolean
  isLoggedIn: boolean
  size?: 'sm' | 'md'
}

export default function BookmarkButton({ listingId, litterId, breederId, initialBookmarked = false, isLoggedIn, size = 'md' }: Props) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, litterId, breederId }),
      })
      const data = await res.json()
      if (res.ok) setBookmarked(data.bookmarked)
    } finally {
      setLoading(false)
    }
  }

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  const btnSize = size === 'sm' ? 'p-1.5' : 'p-2'

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      title={bookmarked ? 'Aus Merkliste entfernen' : 'Zur Merkliste hinzufügen'}
      className={`${btnSize} rounded-full transition-colors ${
        bookmarked
          ? 'text-honey bg-honey/10 hover:bg-honey/20'
          : 'text-stone-400 bg-white/80 hover:text-honey hover:bg-honey/10'
      } border border-cream-deep shadow-sm`}
    >
      <svg className={iconSize} fill={bookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  )
}
