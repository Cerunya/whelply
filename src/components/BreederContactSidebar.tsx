'use client'

import NachrichtButton from './NachrichtButton'

// Hinweis: Adresse, Telefon, Website und Social-Links werden hier bewusst
// nicht mehr angezeigt — sie leben auf der Kontaktseite (/kontakt).
// Die Props bleiben im Typ, damit alle bestehenden Seiten unverändert
// weiter funktionieren.

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
  diditStatus?: string | null
  breederId?: string
  isLoggedIn?: boolean
  isOwnProfile?: boolean
}

export default function BreederContactSidebar({
  kennelName, displayName, fullName, showFullName, slug,
  verband, verificationLevel, diditStatus,
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

      {/* Vertrauen: Verifizierung + Verband als dezente Zeilen (keine Pillen) */}
      {(diditStatus === 'approved' || verificationLevel === 'doc_verified' || verband) && (
        <div className="space-y-1.5 border-t border-cream-deep pt-4">
          {diditStatus === 'approved' && (
            <a href="/badges#id-geprueft" className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-green-700 transition-colors">
              <svg className="w-3.5 h-3.5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              ID geprüft
            </a>
          )}
          {verificationLevel === 'doc_verified' && (
            <a href="/badges#zucht-verifiziert" className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-green-700 transition-colors">
              <svg className="w-3.5 h-3.5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Zucht verifiziert
            </a>
          )}
          {verband && (
            <p className="flex items-center gap-1.5 text-xs text-stone-500">
              <svg className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Mitglied im {verband}
            </p>
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

      {/* Verweis auf die Kontaktseite (dort liegen Adresse, Telefon, Website, Socials) */}
      <a href={`/zuechter/${slug}/kontakt`}
        className="flex items-center justify-center gap-1.5 text-xs font-semibold text-forest hover:underline">
        Alle Kontaktdaten
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </a>

    </div>
  )
}
