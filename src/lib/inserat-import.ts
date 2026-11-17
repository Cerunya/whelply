import { findBreedByName, type BreedSearchEntry } from './breed-aliases'

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

type Breed = BreedSearchEntry

function decodeEntities(value: string) {
  const entities: Record<string, string> = { '&amp;': '&', '&quot;': '"', '&#039;': "'", '&apos;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ', '&auml;': 'ä', '&ouml;': 'ö', '&uuml;': 'ü', '&Auml;': 'Ä', '&Ouml;': 'Ö', '&Uuml;': 'Ü', '&szlig;': 'ß' }
  return value.replace(/&(?:amp|quot|#039|apos|lt|gt|nbsp|auml|ouml|uuml|Auml|Ouml|Uuml|szlig);/g, (entity) => entities[entity] ?? entity).replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
}

function plainText(html: string) {
  return decodeEntities(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? plainText(value).slice(0, maxLength) : ''
}

function parsePrice(value: unknown): number | null {
  if (typeof value === 'number' && value > 0) return Math.round(value * 100)
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/[^\d,.]/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : null
}

function findBreed(name: string, breeds: Breed[]) {
  return findBreedByName(name, breeds)
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

function snautzField(html: string, className: string) {
  const match = html.match(new RegExp(`<div[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>([\\s\\S]*?)</div>\\s*</div>`, 'i'))
  return match?.[1]?.replace(/^\s*<div[^>]*>[\s\S]*?<\/div>/, '') ?? ''
}

export function parseSnautz(html: string, breeds: Breed[]): ImportedListing {
  const title = cleanText(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1], 80)
  const category = cleanText(snautzField(html, 'field-classified-category'), 100)
  const breedName = cleanText(snautzField(html, 'field-dog-breed'), 100)
  const age = cleanText(snautzField(html, 'field-birthdate'), 100)
  const description = cleanText(snautzField(html, 'field-more-info'), 2000)
  if (!title || !breedName) throw new Error('Das Snautz-Inserat konnte nicht gelesen werden. Prüfe den Link und ob das Inserat noch öffentlich ist.')

  const text = plainText(html)
  const males = cleanText(snautzField(html, 'field-males'), 20)
  const females = cleanText(snautzField(html, 'field-females'), 20)
  const sexText = cleanText(snautzField(html, 'field-sex') || snautzField(html, 'field-gender'), 50).toLocaleLowerCase('de')
  const isLitter = Boolean(males || females)
  const type = /deckrüden/i.test(category)
    ? 'stud'
    : /welpe/i.test(title) || (/\b(?:Wochen|Monate)\b/i.test(age) && !/\bJahr/i.test(age)) ? 'puppy' : 'adult_dog'
  const sex = type === 'stud'
    ? 'male'
    : isLitter ? null : sexText.includes('hündin') || /hündin/i.test(title) ? 'female' : sexText.includes('rüde') || /rüde/i.test(title) ? 'male' : null

  const galleryHtml = html.split(/id=["']carousel["']/i)[0]
  const images = Array.from(galleryHtml.matchAll(/data-srcset=["']([^"']*bilder\.snautz\.de[^"']*)["']/gi), (match) => {
    const candidates = match[1].split(',').map((candidate) => candidate.trim().split(/\s+/)[0]).filter(Boolean)
    return candidates[candidates.length - 1]
  }).filter((url): url is string => Boolean(url)).filter((url, index, urls) => urls.indexOf(url) === index).slice(0, 8)

  return {
    title,
    type,
    breedId: findBreed(breedName, breeds),
    breedName,
    sex,
    priceCents: parsePrice(snautzField(html, 'field-price')),
    description,
    images,
    hasPedigree: /ahnentafel|zuchtnachweis|\bpapiere\b/i.test(text) && !/(?:keine|ohne)\s+(?:ahnentafel|zuchtnachweis|papiere)/i.test(text),
    isVaccinated: /geimpft/i.test(text),
    isDewormed: /entwurmt/i.test(text),
    isChipped: /gechipt|geschipt/i.test(text),
  }
}
