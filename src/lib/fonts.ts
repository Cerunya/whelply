// Kuratierte Google-Fonts-Auswahl für den Artikel-Editor.
// Wird im RichEditor (Dropdown), im Markdown-Renderer (Validierung)
// und im FontLoader (Google-Fonts-URL) verwendet.

export type FontOption = {
  name: string      // Google-Fonts-Familienname
  label: string     // Anzeigename im Dropdown
  fallback: string  // CSS-Fallback-Stack
}

export const AVAILABLE_FONTS: FontOption[] = [
  { name: 'Playfair Display', label: 'Playfair Display (elegant)', fallback: 'Georgia, serif' },
  { name: 'Lora', label: 'Lora (Serif)', fallback: 'Georgia, serif' },
  { name: 'Merriweather', label: 'Merriweather (Serif)', fallback: 'Georgia, serif' },
  { name: 'EB Garamond', label: 'EB Garamond (klassisch)', fallback: 'Georgia, serif' },
  { name: 'Inter', label: 'Inter (modern)', fallback: 'system-ui, sans-serif' },
  { name: 'Open Sans', label: 'Open Sans (klar)', fallback: 'system-ui, sans-serif' },
  { name: 'Montserrat', label: 'Montserrat (geometrisch)', fallback: 'system-ui, sans-serif' },
  { name: 'Poppins', label: 'Poppins (rund)', fallback: 'system-ui, sans-serif' },
  { name: 'Nunito', label: 'Nunito (weich)', fallback: 'system-ui, sans-serif' },
  { name: 'Oswald', label: 'Oswald (schmal)', fallback: "'Arial Narrow', sans-serif" },
  { name: 'Bebas Neue', label: 'Bebas Neue (kompakt)', fallback: 'Impact, sans-serif' },
  { name: 'Caveat', label: 'Caveat (handschriftlich)', fallback: 'cursive' },
  { name: 'Dancing Script', label: 'Dancing Script (verspielt)', fallback: 'cursive' },
  { name: 'Courier Prime', label: 'Courier Prime (Schreibmaschine)', fallback: 'monospace' },
]

/** Font-Option per Namen finden (case-insensitive) */
export function getFont(name: string): FontOption | undefined {
  const n = name.trim().toLowerCase()
  return AVAILABLE_FONTS.find((f) => f.name.toLowerCase() === n)
}

/** Google-Fonts-CSS-URL für eine Liste von Font-Namen (nur bekannte, dedupliziert) */
export function googleFontsUrl(fontNames: string[]): string {
  const seen = new Set<string>()
  const families: string[] = []
  for (const n of fontNames) {
    const f = getFont(n)
    if (f && !seen.has(f.name)) {
      seen.add(f.name)
      families.push(`family=${f.name.replace(/ /g, '+')}:wght@400;700`)
    }
  }
  if (families.length === 0) return ''
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`
}
