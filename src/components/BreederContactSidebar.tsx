'use client'

import NachrichtButton from './NachrichtButton'

type BreederContactSidebarProps = {
  kennelName: string
  displayName: string | null
  fullName?: string | null
  showFullName?: boolean
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
  verband?: string | null
  verificationLevel?: string
  breederId?: string
  isLoggedIn?: boolean
  isOwnProfile?: boolean
}

export default function BreederContactSidebar({
  kennelName, displayName, fullName, showFullName,
  city, state, street, zip, showAddress,
  phone, showPhone, website,
  socialInstagram, socialFacebook, socialTiktok, socialYoutube,
  verband, verificationLevel,
  breederId, isLoggedIn = false, isOwnProfile = false,
}: BreederContactSidebarProps) {
  const shownName = displayName || kennelName

  return (
    <div className="sticky top-20 bg-white/95 backdrop-blur-sm rounded-2xl border border-cream-deep shadow-sm p-6 space-y-5">

      {/* Name + optionaler Vor-/Nachname */}
      <div className="space-y-1">
        <p className="font-serif font-bold text-stone-900 text-base leading-tight">{shownName}</p>
        {showFullName && fullName && (
          <p className="text-sm text-stone-500">{fullName}</p>
        )}
      </div>

      {/* Verband + Verifiziert */}
      {(verband || (verificationLevel && verificationLevel !== 'none')) && (
        <div className="flex items-center gap-2 flex-wrap">
          {verband && (
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cream border border-cream-deep text-stone-600">
              {verband}
            </span>
          )}
          {verificationLevel && verificationLevel !== 'none' && (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-700">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Verifiziert
            </span>
          )}
        </div>
      )}

      {/* Trennlinie wenn beides vorhanden */}
      {(verband || (verificationLevel && verificationLevel !== 'none')) && (showAddress || showPhone) && (
        <hr className="border-cream-deep" />
      )}

      {/* Adresse */}
      {showAddress && (street || city) && (
        <div className="flex items-start gap-2.5 text-sm text-stone-600">
          <svg className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div>
            {street && <p>{street}</p>}
            {(zip || city) && <p>{[zip, city, state].filter(Boolean).join(' ')}</p>}
          </div>
        </div>
      )}

      {/* Telefon */}
      {showPhone && phone && (
        <div className="flex items-center gap-2.5 text-sm text-stone-600">
          <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <a href={`tel:${phone}`} className="hover:text-forest transition-colors">{phone}</a>
        </div>
      )}

      {/* Website */}
      {website && (
        <div className="flex items-center gap-2.5 text-sm">
          <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
          </svg>
          <a href={website.startsWith('http') ? website : `https://${website}`}
            target="_blank" rel="noopener noreferrer"
            className="text-forest hover:underline truncate max-w-[180px]">{website.replace(/^https?:\/\//, '')}</a>
        </div>
      )}

      {/* Social Icons */}
      {(socialInstagram || socialFacebook || socialTiktok || socialYoutube) && (
        <div className="flex items-center gap-2 flex-wrap">
          {socialInstagram && (
            <a href={`https://instagram.com/${socialInstagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-stone-600 bg-cream border border-cream-deep rounded-full px-3 py-1.5 hover:border-stone-300 transition-colors">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              Instagram
            </a>
          )}
          {socialFacebook && (
            <a href={`https://facebook.com/${socialFacebook}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-stone-600 bg-cream border border-cream-deep rounded-full px-3 py-1.5 hover:border-stone-300 transition-colors">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </a>
          )}
          {socialYoutube && (
            <a href={`https://youtube.com/@${socialYoutube}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-stone-600 bg-cream border border-cream-deep rounded-full px-3 py-1.5 hover:border-stone-300 transition-colors">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
              YouTube
            </a>
          )}
          {socialTiktok && (
            <a href={`https://tiktok.com/@${socialTiktok}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-stone-600 bg-cream border border-cream-deep rounded-full px-3 py-1.5 hover:border-stone-300 transition-colors">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.05a8.16 8.16 0 004.77 1.52V7.11a4.85 4.85 0 01-1-.42z"/></svg>
              TikTok
            </a>
          )}
        </div>
      )}

      {/* Nachricht schreiben */}
      {breederId && (
        <NachrichtButton
          breederId={breederId}
          kennelName={kennelName}
          isLoggedIn={isLoggedIn}
          isOwnProfile={isOwnProfile}
        />
      )}

    </div>
  )
}
