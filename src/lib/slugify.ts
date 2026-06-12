/**
 * Wandelt einen Zwingernamen in einen URL-Slug um.
 * "vom Schwarzen Tal" → "vom-schwarzen-tal"
 * Umlaute werden transliteriert: "Müller" → "mueller"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // verbleibende Akzente entfernen
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
