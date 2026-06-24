import Link from 'next/link'

type BreederContactSidebarProps = {
  kennelName: string
  displayName: string | null
  slug: string
  city: string | null
  state: string | null
  street: string | null
  zip: string | null
  showAddress: boolean
  phone: string | null
  showPhone: boolean
  website: string | null
  socialInstagram: string | null
  socialFacebook: string | null
  socialTiktok: string | null
  socialYoutube: string | null
  themeColor: string | null
  themeAccentColor: string | null
}

function SocialIcon({ type }: { type: string }) {
  if (type === 'instagram') return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
  if (type === 'facebook') return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
  if (type === 'tiktok') return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  )
  if (type === 'youtube') return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
    </svg>
  )
  return null
}

export default function BreederContactSidebar({
  kennelName, displayName, slug, city, state, street, zip, showAddress, phone, showPhone,
  website, socialInstagram, socialFacebook, socialTiktok, socialYoutube,
  themeColor, themeAccentColor,
}: BreederContactSidebarProps) {
  const accent = themeAccentColor || themeColor || '#2d5a3d'

  const socials = [
    { type: 'instagram', href: socialInstagram, label: 'Instagram' },
    { type: 'facebook', href: socialFacebook, label: 'Facebook' },
    { type: 'tiktok', href: socialTiktok, label: 'TikTok' },
    { type: 'youtube', href: socialYoutube, label: 'YouTube' },
  ].filter((s) => s.href)

  return (
    <div className="sticky top-20 bg-white/90 rounded-2xl border border-cream-deep p-5 space-y-4">
      <div>
        <h3 className="font-serif font-bold text-stone-900 text-sm">{kennelName}</h3>
        {displayName && displayName !== kennelName && (
          <p className="text-xs text-stone-500 mt-0.5">{displayName}</p>
        )}
      </div>

      {(city || state || (showAddress && street)) && (
        <div className="flex items-start gap-2 text-sm text-stone-600">
          <svg className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div>
            {showAddress && street && <p>{street}</p>}
            {showAddress && zip && city ? (
              <p>{zip} {city}{state ? `, ${state}` : ''}</p>
            ) : (
              <p>{[city, state].filter(Boolean).join(', ')}</p>
            )}
          </div>
        </div>
      )}

      {showPhone && phone && (
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <a href={`tel:${phone}`} className="hover:underline">{phone}</a>
        </div>
      )}

      {website && (
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <a href={website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{website.replace(/^https?:\/\//, '')}</a>
        </div>
      )}

      {socials.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {socials.map(({ type, href, label }) => (
            <a
              key={type}
              href={href!}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-cream-deep text-stone-600 hover:border-stone-300 hover:text-stone-900 transition-colors"
            >
              <SocialIcon type={type} />
              {label}
            </a>
          ))}
        </div>
      )}

      <div className="pt-1">
        <Link
          href={`/zuechter/${slug}`}
          className="block w-full text-center text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors text-white"
          style={{ backgroundColor: accent }}
        >
          Kontakt aufnehmen
        </Link>
      </div>
    </div>
  )
}
