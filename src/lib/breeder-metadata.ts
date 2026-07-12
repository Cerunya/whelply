import type { Metadata } from 'next'
import { getBreederBySlug } from '@/lib/breeder'
import { getBreederCanonicalUrl } from '@/lib/subdomain'

/**
 * Generiert Metadata mit kanonischer URL für Züchterseiten.
 * Importiere diese Funktion in jeder `/zuechter/[slug]/...` Page.
 *
 * Beispiel:
 * ```ts
 * export async function generateMetadata({ params }: Props): Promise<Metadata> {
 *   return generateBreederMetadata(params.slug, '/wuerfe', 'Würfe & Planung')
 * }
 * ```
 */
export async function generateBreederMetadata(
  slug: string,
  subPath: string = '',
  titleSuffix?: string
): Promise<Metadata> {
  const breeder = await getBreederBySlug(slug)
  if (!breeder) return { title: 'Züchter nicht gefunden' }

  const name = breeder.displayName || breeder.kennelName
  const title = titleSuffix ? `${titleSuffix} — ${name}` : name
  const canonical = getBreederCanonicalUrl(breeder.subdomain, slug, subPath)

  return {
    title: `${title} | Whelply`,
    alternates: {
      canonical,
    },
  }
}
