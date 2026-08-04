/**
 * Generiert SEO-freundliche Slugs für Inserate.
 * Format: {titel}-an{nummer}
 * Beispiel: kruemel-an42, schwarzer-mini-aussie-an1234
 */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export function generateListingSlug(params: {
  title?: string | null
  breedName: string
  listingNumber: number
}): string {
  const name = slugify(params.title || params.breedName)
  return `${name}-an${params.listingNumber}`
}
