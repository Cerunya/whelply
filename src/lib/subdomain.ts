// Reservierte Subdomains — dürfen nicht von Züchtern belegt werden,
// da sie für System-Routen, zukünftige Features oder allgemein verwirrend wären.
export const RESERVED_SUBDOMAINS = new Set([
  'www', 'app', 'api', 'admin', 'dashboard', 'mail', 'email', 'ftp',
  'preview', 'static', 'assets', 'cdn', 'media', 'images', 'img',
  'support', 'help', 'docs', 'blog', 'shop', 'store', 'status',
  'dev', 'test', 'staging', 'demo', 'login', 'register', 'auth',
  'welpen', 'hunde', 'zuechter', 'zuchtrueden', 'rassen', 'dienste',
  'whelply', 'impressum', 'datenschutz', 'agb', 'kontakt', 'about',
  'null', 'undefined', 'true', 'false',
])

const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$/

/**
 * Validiert eine Subdomain. Gibt bei Fehler eine deutsche Fehlermeldung zurück,
 * sonst null (= gültig).
 */
export function validateSubdomain(value: string): string | null {
  if (value.length < 3) return 'Mindestens 3 Zeichen.'
  if (value.length > 30) return 'Maximal 30 Zeichen.'
  if (!SUBDOMAIN_REGEX.test(value)) {
    return 'Nur Kleinbuchstaben, Zahlen und Bindestriche (nicht am Anfang/Ende).'
  }
  if (RESERVED_SUBDOMAINS.has(value)) {
    return 'Diese Subdomain ist reserviert.'
  }
  return null
}
