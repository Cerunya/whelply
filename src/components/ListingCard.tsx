import Link from 'next/link'
import type { ListingStatus } from '@prisma/client'

type ListingCardProps = {
  id: string
  slug?: string | null
  listingType?: string
  breedName: string
  kennelName: string
  puppyName?: string | null
  city?: string | null
  state?: string | null
  priceCents?: number | null
  isBoosted: boolean
  imageUrl?: string | null
  tint?: 'male' | 'female' | 'sold' | null
  sticker?: boolean
  status?: ListingStatus
}

export default function ListingCard({
  id, slug, listingType, breedName, kennelName, puppyName, city, state, priceCents, isBoosted, imageUrl, tint, sticker = false, status = 'available',
}: ListingCardProps) {
  const price = priceCents
    ? `${(priceCents / 100).toLocaleString('de-DE')} €`
    : 'Auf Anfrage'
  const location = [city, state].filter(Boolean).join(', ')
  const basePath = listingType === 'puppy' || !listingType ? '/welpen' : '/inserate'

  let cardClasses = sticker
    ? 'relative rounded-[26px] border overflow-hidden transition-all duration-200 hover:-translate-y-1 '
    : 'rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 '
  if (tint === 'sold') {
    cardClasses += 'border-stone-300 bg-stone-100 opacity-60'
  } else if (tint === 'male') {
    cardClasses += sticker
      ? 'border-[#B8D4EE] bg-[#D6E8F8] shadow-[7px_7px_0_#EDE4CE] hover:shadow-[9px_9px_0_#EDE4CE]'
      : 'border-blue-300 bg-blue-100'
  } else if (tint === 'female') {
    cardClasses += sticker
      ? 'border-[#E9BCD0] bg-[#F5D8E4] shadow-[7px_7px_0_#EDE4CE] hover:shadow-[9px_9px_0_#EDE4CE]'
      : 'border-pink-300 bg-pink-100'
  } else if (isBoosted) {
    cardClasses += sticker
      ? 'border-honey bg-white shadow-[7px_7px_0_#EDE4CE] ring-1 ring-honey/30 hover:shadow-[9px_9px_0_#EDE4CE]'
      : 'border-honey bg-white ring-1 ring-honey/30'
  } else {
    cardClasses += sticker
      ? 'border-cream-deep bg-white shadow-[7px_7px_0_#EDE4CE] hover:shadow-[9px_9px_0_#EDE4CE]'
      : 'border-cream-deep bg-white hover:border-forest/20'
  }

  return (
    <Link href={`${basePath}/${slug || id}`} className="group block h-full">
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
            <span className={`absolute top-2 ${sticker ? 'right-2' : 'left-2'} bg-honey text-white text-xs font-semibold px-2.5 py-1 rounded-full`}>
              {!sticker && '★ '}Topanzeige
            </span>
          )}
        </div>
        {sticker && (
          <span className="mx-3 mt-3 inline-flex w-fit rounded-lg border border-forest/10 bg-[#EAF3EC] px-3 py-1.5 text-xs font-bold text-forest shadow-[3px_3px_0_rgba(27,58,45,0.08)] md:absolute md:left-3 md:top-3 md:m-0 md:px-3 md:py-2">
            {status === 'sold' ? 'Verkauft' : status === 'reserved' ? 'Reserviert' : 'Frei'}
          </span>
        )}

        <div className={`${sticker ? 'p-4 pb-6 sm:p-5 sm:pb-7' : 'p-4'} flex flex-col flex-1`}>
          <p className={`${sticker ? 'text-[11px] font-bold' : 'text-xs font-semibold'} text-forest uppercase tracking-wider mb-1`}>
            {breedName}
          </p>
          <h3 className={`${sticker ? 'text-base font-bold sm:text-lg' : 'text-sm font-semibold'} text-stone-900 leading-snug mb-0.5 group-hover:text-forest transition-colors line-clamp-1`}>
            {puppyName || kennelName}
          </h3>
          {puppyName && (
            <p className={`text-xs ${sticker ? 'text-stone-500 mb-4' : 'text-stone-400 mb-3'} line-clamp-1`}>{kennelName}</p>
          )}
          {!puppyName && <div className={sticker ? 'mb-4' : 'mb-3'} />}
          <div className={`mt-auto flex items-center justify-between border-t ${sticker ? 'flex-wrap gap-2 border-forest/10 pt-4' : 'border-cream-deep pt-2'}`}>
            <span className={`text-xs ${sticker ? 'text-stone-500' : 'text-stone-400'} flex items-center gap-1`}>
              {!sticker && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              {location || 'Deutschland'}
            </span>
            <span className={`${sticker ? 'text-base' : 'text-sm'} font-bold text-forest`}>{price}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
