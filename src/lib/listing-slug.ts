/**
 * Generiert SEO-freundliche Slugs für Inserate.
 * Format: {rasse}-{typ}-{geschlecht}-{titel/name}-{kurzid}
 * Beispiel: australian-shepherd-welpe-ruede-nugget-a8f3b2
 */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export function generateListingSlug(params: {
  breedName: string
  type: string
  sex?: string | null
  title?: string | null
  id: string
}): string {
  const parts: string[] = []

  // Rasse
  parts.push(slugify(params.breedName))

  // Typ
  if (params.type === 'puppy') parts.push('welpe')
  else if (params.type === 'adult') parts.push('hund')
  else if (params.type === 'stud') parts.push('deckruede')

  // Geschlecht
  if (params.sex === 'male') parts.push('ruede')
  else if (params.sex === 'female') parts.push('huendin')

  // Titel/Name (falls vorhanden)
  if (params.title) {
    parts.push(slugify(params.title).slice(0, 30))
  }

  // Kurze ID (letzte 8 Zeichen der cuid)
  parts.push(params.id.slice(-8))

  return parts.join('-')
}
