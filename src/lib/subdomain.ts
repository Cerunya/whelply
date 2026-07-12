/**
 * Subdomain-Utilities für Whelply
 *
 * Validierung: nur Kleinbuchstaben, Ziffern und Bindestriche,
 * 3-30 Zeichen, darf nicht mit Bindestrich beginnen/enden.
 * Reservierte Namen werden blockiert.
 */

const RESERVED = new Set([
  'www',
  'api',
  'admin',
  'mail',
  'ftp',
  'app',
  'dashboard',
  'cdn',
  'static',
  'media',
  'blog',
  'shop',
  'preview',
  'staging',
  'test',
  'dev',
  'help',
  'support',
  'status',
  'docs',
])

const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$/

export function isValidSubdomain(value: string): boolean {
  if (!value || !SUBDOMAIN_REGEX.test(value)) return false
  if (RESERVED.has(value)) return false
  return true
}

export function normalizeSubdomain(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)
}

/**
 * Gibt die kanonische URL für eine Züchterseite zurück.
 * Wenn der Züchter eine Subdomain hat, wird diese bevorzugt.
 *
 * @param slug - Züchter-Slug (z.B. "bella-vom-waldrand")
 * @param subdomain - Züchter-Subdomain (z.B. "bella") oder null
 * @param path - Unterseite (z.B. "/wuerfe", "/kontakt") oder "" für Hauptseite
 */
export function getBreederCanonicalUrl(
  subdomain: string | null,
  slug: string,
  path: string = ''
): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://whelply.de'

  if (subdomain) {
    // https://bella.whelply.de oder https://bella.whelply.de/wuerfe
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'whelply.de'
    const protocol = base.startsWith('https') ? 'https' : 'http'
    return `${protocol}://${subdomain}.${baseDomain}${path}`
  }

  // Fallback: /zuechter/slug/path
  return `${base}/zuechter/${slug}${path}`
}


export function validateSubdomain(value: string): string | null {
  if (!value) return 'Bitte eine Subdomain eingeben.'
  if (value.length < 3) return 'Mindestens 3 Zeichen.'
  if (value.length > 30) return 'Maximal 30 Zeichen.'
  if (!SUBDOMAIN_REGEX.test(value)) return 'Nur Kleinbuchstaben, Ziffern und Bindestriche erlaubt.'
  if (RESERVED.has(value)) return 'Diese Subdomain ist reserviert.'
  return null
}