import Link from 'next/link'

type ListingCardProps = {
  id: string
  breedName: string
  kennelName: string
  puppyName?: string | null
  city?: string | null
  state?: string | null
  priceCents?: number | null
  isBoosted: boolean
  imageUrl?: string | null
  tint?: 'male' | 'female' | 'sold' | null
}

export default function ListingCard({
  id, breedName, kennelName, puppyName, city, state, priceCents, isBoosted, imageUrl, tint,
}: ListingCardProps) {
  const price = priceCents
    ? `${(priceCents / 100).toLocaleString('de-DE')} €`
    : 'Auf Anfrage'
  const location = [city, state].filter(Boolean).join(', ')

  let cardClasses = 'rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 '
  if (tint === 'sold') {
    cardClasses += 'border-stone-300 bg-stone-100 opacity-60'
  } else if (tint === 'male') {
    cardClasses += 'border-blue-300 bg-blue-100'
  } else if (tint === 'female') {
    cardClasses += 'border-pink-300 bg-pink-100'
  } else if (isBoosted) {
    cardClasses += 'border-honey bg-white ring-1 ring-honey/30'
  } else {
    cardClasses += 'border-cream-deep bg-white hover:border-forest/20'
  }

  return (
    <Link href={`/welpen/${id}`} className="group block h-full">
      <div className={cardClasses + ' flex flex-col h-full'}>
        {/* Bild oder Platzhalter */}
        <div className="bg-cream-dark aspect-[3/2] flex items-center justify-center relative overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={breedName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-cream-deep flex items-center justify-center">
              <svg className="w-8 h-8 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          )}
          {isBoosted && (
            <span className="absolute top-2 left-2 bg-honey text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              ★ Topanzeige
            </span>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <p className="text-xs text-forest font-semibold uppercase tracking-wider mb-1">
            {breedName}
          </p>
          <h3 className="font-semibold text-stone-900 text-sm leading-snug mb-0.5 group-hover:text-forest transition-colors line-clamp-1">
            {puppyName || kennelName}
          </h3>
          {puppyName && (
            <p className="text-xs text-stone-400 mb-3 line-clamp-1">{kennelName}</p>
          )}
          {!puppyName && <div className="mb-3" />}
          <div className="mt-auto flex items-center justify-between pt-2 border-t border-cream-deep">
            <span className="text-xs text-stone-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {location || 'Deutschland'}
            </span>
            <span className="text-sm font-bold text-forest">{price}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
