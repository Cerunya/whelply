export type ImportedListing = {
  title: string
  type: 'puppy' | 'stud' | 'adult_dog'
  breedId: number | null
  breedName: string
  sex: 'male' | 'female' | null
  priceCents: number | null
  description: string
  images: string[]
  hasPedigree: boolean
  isVaccinated: boolean
  isDewormed: boolean
  isChipped: boolean
}

type Breed = { id: number; nameDe: string }

function decodeEntities(value: string) {
  const entities: Record<string, string> = { '&amp;': '&', '&quot;': '"', '&#039;': "'", '&apos;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ', '&auml;': 'ä', '&ouml;': 'ö', '&uuml;': 'ü', '&Auml;': 'Ä', '&Ouml;': 'Ö', '&Uuml;': 'Ü', '&szlig;': 'ß' }
  return value.replace(/&(?:amp|quot|#039|apos|lt|gt|nbsp|auml|ouml|uuml|Auml|Ouml|Uuml|szlig);/g, (entity) => entities[entity] ?? entity).replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
}

function plainText(html: string) {
  return decodeEntities(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? decodeEntities(value).replace(/\s+/g, ' ').trim().slice(0, maxLength) : ''
}

function parsePrice(value: unknown): number | null {
  if (typeof value === 'number' && value > 0) return Math.round(value * 100)
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/[^\d,.]/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : null
}

function findBreed(name: string, breeds: Breed[]) {
  const normalize = (text: string) => text.toLocaleLowerCase('de').replace(/[^a-zäöüß]+/g, ' ').trim()
  const needle = normalize(name)
  if (!needle) return null
  return breeds.find((breed) => normalize(breed.nameDe) === needle)?.id
    ?? breeds.find((breed) => normalize(breed.nameDe).includes(needle) || needle.includes(normalize(breed.nameDe)))?.id
    ?? null
}

function detail(text: string, label: string) {
  const labels = ['Preis', 'Einstelldatum', 'Kategorie', 'Rasse', 'Geschlecht', 'Alter', 'Geburtsland', 'Größe', 'Ahnentafel', 'Weitere Merkmale', 'Beschreibung', 'Standort', 'Anbieter']
  const match = text.match(new RegExp(`${label} ([\\s\\S]*?)(?: ${labels.join('|')}) `))
  return match?.[1]?.trim() ?? ''
}

export function parseEdogs(html: string, breeds: Breed[]): ImportedListing {
  const scripts = Array.from(html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))
  let product: any = null
  for (const script of scripts) {
    try {
      const data = JSON.parse(script[1].trim())
      if (data['@type'] === 'Product') { product = data; break }
    } catch {}
  }
  if (!product) throw new Error('Das edogs-Inserat konnte nicht gelesen werden. Prüfe den Link und ob das Inserat noch öffentlich ist.')
  const text = plainText(html)
  const category = detail(text, 'Kategorie')
  const breedName = detail(text, 'Rasse')
  const sexText = detail(text, 'Geschlecht').toLocaleLowerCase('de')
  const type = /deckrüden/i.test(category) ? 'stud' : /welpenwurf/i.test(text) || /welpe/i.test(detail(text, 'Alter')) ? 'puppy' : 'adult_dog'
  const imageList: any[] = Array.isArray(product.image) ? product.image : product.image ? [product.image] : []
  return {
    title: cleanText(product.name, 80),
    type,
    breedId: findBreed(breedName, breeds),
    breedName: cleanText(breedName, 100),
    sex: sexText.includes('hündin') ? 'female' : sexText.includes('rüde') ? 'male' : null,
    priceCents: parsePrice(product.offers?.price),
    description: cleanText(product.description, 2000),
    images: imageList.filter((url): url is string => typeof url === 'string').slice(0, 8),
    hasPedigree: /ahnentafel/i.test(text) && !/Ahnentafel (?:keine|nein)/i.test(text),
    isVaccinated: /geimpft/i.test(text),
    isDewormed: /entwurmt/i.test(text),
    isChipped: /gechipt/i.test(text),
  }
}
