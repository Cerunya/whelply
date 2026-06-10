import Link from 'next/link'

type ListingCardProps = {
  id: string
  breedName: string
  kennelName: string
  city?: string | null
  state?: string | null
  priceCents?: number | null
  isBoosted: boolean
}

export default function ListingCard({
  id, breedName, kennelName, city, state, priceCents, isBoosted,
}: ListingCardProps) {
  const price = priceCents ? `${(priceCents / 100).toLocaleString('de-DE')} €` : 'Preis auf Anfrage'
  const location = [city, state].filter(Boolean).join(', ')

  return (
    <Link href={`/welpen/${id}`} className="group block">
      <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 ${isBoosted ? 'border-amber-300 ring-1 ring-amber-200' : 'border-stone-200'}`}>
        {/* Foto-Platzhalter */}
        <div className="bg-stone-100 aspect-[4/3] flex items-center justify-center relative">
          <svg className="w-12 h-12 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {isBoosted && (
            <span className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-xs font-medium px-2 py-0.5 rounded-full">
              Topanzeige
            </span>
          )}
        </div>

        <div className="p-4">
          <p className="text-xs text-stone-400 font-medium uppercase tracking-wide mb-1">{breedName}</p>
          <h3 className="font-semibold text-stone-900 text-sm leading-snug mb-2 group-hover:text-stone-600 transition-colors">
            {kennelName}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400">
              {location || 'Deutschland'}
            </span>
            <span className="text-sm font-semibold text-stone-800">{price}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
