export type BreedSearchEntry = {
  id: number
  nameDe: string
  nameEn?: string | null
  slug: string
}

// Umgangssprachliche Namen, historische Bezeichnungen und verbreitete Schreibweisen.
// Die offiziellen deutschen und englischen Namen werden automatisch ergänzt.
export const BREED_ALIASES: Record<string, string[]> = {
  'australian-shepherd': ['Aussie', 'Australian Sheepdog', 'Australischer Schäferhund', 'Australien Shepherd'],
  'miniature-american-shepherd': ['Mini Aussie', 'Mini American Shepherd', 'Miniature Australian Shepherd', 'Miniatur Australian Shepherd', 'Miniatur Amerikanischer Schäferhund'],
  'australian-kelpie': ['Kelpie', 'Australian Working Kelpie', 'Working Kelpie'],
  'australian-cattle-dog': ['Blue Heeler', 'Red Heeler', 'Queensland Heeler', 'ACD', 'Australischer Cattle Dog'],
  'australian-stumpy-tail-cattle-dog': ['Stumpy', 'Stumpy Tail Cattle Dog'],
  'bearded-collie': ['Beardie'],
  'border-collie': ['Border', 'Bordercollie'],
  'collie-rough': ['Collie', 'Langhaarcollie', 'Langhaar Collie', 'Rough Collie', 'Lassie'],
  'collie-smooth': ['Kurzhaarcollie', 'Kurzhaar Collie', 'Smooth Collie'],
  'shetland-sheepdog': ['Sheltie', 'Shetland Collie', 'Shetland Sheep Dog'],
  'old-english-sheepdog': ['Bobtail', 'Old English Sheep Dog', 'Altenglischer Schäferhund'],
  'german-shepherd-dog': ['Schäferhund', 'DSH', 'German Shepherd', 'German Shepherd Dog', 'Alsatian', 'Elsässer Schäferhund'],
  'white-swiss-shepherd-dog': ['Weisser Schäferhund', 'Weißer Schäferhund', 'Schweizer Schäferhund', 'White Swiss Shepherd', 'Berger Blanc Suisse'],
  'belgian-shepherd-dog': ['Belgischer Hirtenhund', 'Chien de Berger Belge', 'Belgian Shepherd'],
  'groenendael': ['Belgischer Schäferhund Groenendael', 'Belgian Shepherd Groenendael'],
  'laekenois': ['Belgischer Schäferhund Laekenois', 'Laekense Herder', 'Belgian Shepherd Laekenois'],
  'malinois': ['Mechelaar', 'Mechelse Herder', 'Belgischer Schäferhund Malinois', 'Belgian Shepherd Malinois'],
  'tervueren': ['Tervuren', 'Belgischer Schäferhund Tervueren', 'Belgian Shepherd Tervuren'],
  'dutch-shepherd-dog': ['Hollandse Herder', 'Holländischer Hirtenhund', 'Dutch Shepherd'],
  'catalan-sheepdog': ['Gos d’Atura Català', 'Katalanischer Hirtenhund'],
  'portuguese-sheepdog': ['Cão da Serra de Aires', 'Portugiesischer Hirtenhund'],
  'polish-lowland-sheepdog': ['PON', 'Polski Owczarek Nizinny'],
  'polish-tatra-shepherd': ['Owczarek Podhalanski', 'Tatra Schäferhund'],
  'welsh-corgi-pembroke': ['Corgi', 'Corgi Pembroke', 'Pembroke Welsh Corgi', 'Pembroke'],
  'welsh-corgi-cardigan': ['Corgi Cardigan', 'Cardigan Welsh Corgi', 'Cardigan'],
  'dachshund': ['Dackel', 'Teckel', 'Doxie', 'Wiener Dog'],
  'dachshund-kurzhaar': ['Kurzhaardackel', 'Kurzhaar Dackel', 'Kurzhaarteckel', 'Glatthaardackel'],
  'dachshund-langhaar': ['Langhaardackel', 'Langhaar Dackel', 'Langhaarteckel'],
  'dachshund-rauhaar': ['Rauhaardackel', 'Rauhaar Dackel', 'Drahthaardackel', 'Rauhaarteckel'],
  'poodle': ['Caniche', 'Pudelhund', 'Doodle'],
  'pudel-gross': ['Großpudel', 'Königspudel', 'Standardpudel', 'Standard Poodle', 'Doodle'],
  'zwergpudel': ['Zwerg Pudel', 'Miniature Poodle', 'Doodle'],
  'toypudel': ['Toy Pudel', 'Toy Poodle', 'Doodle'],
  'german-spitz': ['Spitz', 'Deutscher Spitz'],
  'grossspitz': ['Groß Spitz', 'Gross Spitz'],
  'kleinspitz': ['Klein Spitz'],
  'mittelspitz': ['Mittel Spitz'],
  'wolfsspitz': ['Wolfspitz', 'Keeshond', 'Wolfsspitz Keeshond'],
  'pomeranian': ['Pom', 'Pomeranian', 'Deutscher Zwergspitz', 'Zwerg Spitz'],
  'french-bulldog': ['Frenchie', 'Französische Bulldogge', 'Bouledogue Français', 'French Bulldog'],
  'bulldog': ['Englische Bulldogge', 'English Bulldog', 'British Bulldog'],
  'italian-cane-corso': ['Cane Corso', 'Italienischer Cane Corso'],
  'dobermann': ['Doberman', 'Dobermann Pinscher', 'Doberman Pinscher'],
  'rottweiler': ['Rottie', 'Rottweiler Metzgerhund'],
  'great-dane': ['Dogge', 'Deutsche Dogge', 'Great Dane'],
  'boxer': ['Deutscher Boxer', 'German Boxer'],
  'mastiff': ['Englischer Mastiff', 'English Mastiff', 'Old English Mastiff'],
  'neapolitan-mastiff': ['Neapolitanischer Mastiff', 'Mastino'],
  'saint-miguel-cattle-dog': ['Cão de Fila de São Miguel', 'Cao de Fila de Sao Miguel', 'Fila de São Miguel'],
  'golden-retriever': ['Golden', 'Goldie'],
  'labrador-retriever': ['Labrador', 'Labbi', 'Lab'],
  'flat-coated-retriever': ['Flat Coated Retriever', 'Flatcoat', 'Flat Coated'],
  'chesapeake-bay-retriever': ['Chessie', 'Chesapeake'],
  'nova-scotia-duck-tolling-retriever': ['Toller', 'Nova Scotia Retriever', 'Duck Toller'],
  'english-cocker-spaniel': ['Cocker Spaniel', 'English Cocker', 'Englischer Cocker Spaniel'],
  'american-cocker-spaniel': ['American Cocker', 'Amerikanischer Cocker Spaniel'],
  'english-springer-spaniel': ['Springer Spaniel', 'English Springer', 'Englischer Springer Spaniel'],
  'german-short-haired-pointing-dog': ['Deutsch Kurzhaar', 'German Shorthaired Pointer', 'GSP', 'Deutscher Kurzhaar Vorstehhund'],
  'german-wire-haired-pointing-dog': ['Deutsch Drahthaar', 'German Wirehaired Pointer', 'Deutscher Drahthaar Vorstehhund'],
  'hungarian-short-haired-pointer-vizsla': ['Magyar Vizsla', 'Vizsla', 'Ungarischer Vorstehhund', 'Kurzhaar Vizsla'],
  'hungarian-wire-haired-pointer': ['Drahthaar Vizsla', 'Drótzörü Magyar Vizsla'],
  'weimaraner': ['Weimaraner Vorstehhund', 'Weimaraner Jagdhund'],
  'italian-pointing-dog': ['Bracco Italiano'],
  'german-spaniel': ['Deutscher Wachtelhund', 'Wachtelhund'],
  'german-hunting-terrier': ['Deutscher Jagdterrier', 'Jagdterrier'],
  'jack-russell-terrier': ['Jack Russell', 'JRT', 'Jack Russel Terrier'],
  'parson-russell-terrier': ['Parson Russell', 'PRT', 'Parson Jack Russell'],
  'yorkshire-terrier': ['Yorkie', 'Yorkshire'],
  'west-highland-white-terrier': ['Westie', 'West Highland Terrier'],
  'scottish-terrier': ['Scottie', 'Schottischer Terrier'],
  'bull-terrier': ['Bullterrier', 'English Bull Terrier', 'Englischer Bullterrier'],
  'miniature-bull-terrier': ['Miniatur Bullterrier', 'Mini Bull Terrier'],
  'staffordshire-bull-terrier': ['Staffy', 'Staffi', 'Stafford', 'Staffbull', 'Staffordshire Bullterrier'],
  'american-staffordshire-terrier': ['Amstaff', 'Am Staff', 'American Staffordshire'],
  'airedale-terrier': ['Airedale', 'König der Terrier'],
  'cairn-terrier': ['Cairn'],
  'basenji': ['Kongo Terrier', 'Kongo-Terrier'],
  'shiba': ['Shiba Inu', 'Japanischer Shiba'],
  'akita': ['Akita Inu', 'Japanischer Akita'],
  'american-akita': ['American Akita', 'Amerikanischer Akita'],
  'samoyed': ['Samojede', 'Sammy', 'Samoyede'],
  'siberian-husky': ['Husky', 'Siberian Husky', 'Sibirischer Husky'],
  'alaskan-malamute': ['Malamute', 'Alaska Malamute'],
  'chow-chow': ['Chow', 'Chow Chow'],
  'finnish-spitz': ['Finnen Spitz', 'Finnischer Spitz', 'Suomenpystykorva'],
  'japanese-spitz': ['Japan Spitz', 'Japanischer Spitz', 'Nihon Supittsu'],
  'norwegian-elkhound-grey': ['Norwegischer Elchhund', 'Grauer Elchhund', 'Norsk Elghund Grå'],
  'norwegian-elkhound-black': ['Schwarzer Elchhund', 'Norsk Elghund Sort'],
  'rhodesian-ridgeback': ['Ridgeback', 'Afrikanischer Löwenhund'],
  'dalmatian': ['Dalmatiner', 'Dalmatinischer Hund'],
  'afghan-hound': ['Afghane', 'Afghanischer Windhund', 'Afghan Hound'],
  'borzoi-russian-hunting-sighthound': ['Barsoi', 'Borzoi', 'Russischer Wolfshund'],
  'italian-sighthound': ['Iggy', 'Italienisches Windspiel', 'Piccolo Levriero Italiano', 'Italian Greyhound'],
  'greyhound': ['Englischer Windhund', 'English Greyhound'],
  'irish-wolfhound': ['Irischer Wolfshund', 'Irish Wolfhound'],
  'deerhound': ['Deerhound', 'Schottischer Hirschhund'],
  'newfoundland': ['Neufundländer', 'Newfie', 'Newfoundland'],
  'leonberger': ['Leo'],
  'st-bernard': ['Bernhardiner', 'St. Bernhard', 'Sankt Bernhardshund', 'Saint Bernard'],
  'bernese-mountain-dog': ['Berner', 'Berner Sennenhund', 'Bernese Mountain Dog'],
  'great-swiss-mountain-dog': ['Grosser Schweizer Sennenhund', 'Großer Schweizer Sennenhund'],
  'appenzell-cattle-dog': ['Appenzeller Sennenhund', 'Appenzeller'],
  'entlebuch-cattle-dog': ['Entlebucher Sennenhund', 'Entlebucher'],
  'maltese': ['Malteser', 'Maltese', 'Malteser Hund'],
  'bichon-frise': ['Bichon Frisé', 'Bichon'],
  'havanese': ['Havaneser', 'Bichon Havanais'],
  'coton-de-tulear': ['Coton de Tuléar', 'Coton'],
  'shih-tzu': ['Shih Tzu', 'Shihtzu'],
  'chihuahua': ['Chihuahueño', 'Chi'],
  'pug': ['Mops', 'Pug'],
  'boston-terrier': ['Boston'],
  'lhasa-apso': ['Lhasa'],
  'tibetan-terrier': ['Tibet Terrier', 'Tibet-Terrier'],
  'tibetan-spaniel': ['Tibet Spaniel', 'Tibet-Spaniel'],
  'cavalier-king-charles-spaniel': ['Cavalier', 'Cavie', 'Cavalier King Charles'],
  'continental-toy-spaniel': ['Papillon', 'Phalène', 'Kontinentaler Zwergspaniel'],
  'miniature-schnauzer': ['Zwergschnauzer', 'Mini Schnauzer', 'Miniature Schnauzer'],
  'giant-schnauzer': ['Riesenschnauzer', 'Giant Schnauzer'],
  'schnauzer': ['Mittelschnauzer', 'Standard Schnauzer'],
  'miniature-pinscher': ['Zwergpinscher', 'Min Pin', 'Miniature Pinscher'],
  'german-pinscher': ['Deutscher Pinscher', 'German Pinscher'],
  'pyrenean-mountain-dog': ['Pyrenäenberghund', 'Patou', 'Great Pyrenees'],
  'tibetan-mastiff': ['Do Khyi', 'Tibetdogge', 'Tibetan Mastiff'],
  'estrela-mountain-dog': ['Serra da Estrela Berghund', 'Cão da Serra da Estrela'],
  'kangal-shepherd-dog': ['Kangal', 'Kangal Hirtenhund'],
  'caucasian-shepherd-dog': ['Kaukasischer Owtscharka', 'Kaukasischer Schäferhund'],
  'central-asia-shepherd-dog': ['Zentralasiatischer Owtscharka', 'Mittelasiatischer Owtscharka'],
  'south-russian-shepherd-dog': ['Südrussischer Owtscharka'],
}

export function normalizeBreedName(value: string) {
  return value
    .toLocaleLowerCase('de')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const BREED_NAME_ALIASES: Record<string, string[]> = {
  'staffordshire bull terrier': ['Staffy', 'Staffi'],
  'staffordshire bullterrier': ['Staffy', 'Staffi'],
  'italienisches windspiel': ['Iggy'],
  'piccolo levriero italiano': ['Iggy'],
  'italian greyhound': ['Iggy'],
}

export function breedSearchNames(breed: Omit<BreedSearchEntry, 'id'>) {
  const officialNames = [breed.nameDe, breed.nameEn ?? '']
  const nameAliases = officialNames.flatMap((name) => BREED_NAME_ALIASES[normalizeBreedName(name)] ?? [])
  return [...officialNames, ...(BREED_ALIASES[breed.slug] ?? []), ...nameAliases]
}

export function findBreedByName(name: string, breeds: BreedSearchEntry[]) {
  const needle = normalizeBreedName(name)
  if (!needle) return null
  const exact = breeds.find((breed) => breedSearchNames(breed).some((alias) => normalizeBreedName(alias) === needle))
  if (exact) return exact.id
  return breeds.find((breed) => {
    const official = normalizeBreedName(breed.nameDe)
    return official.includes(needle) || needle.includes(official)
  })?.id ?? null
}
