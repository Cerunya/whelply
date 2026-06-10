// prisma/seed.ts
// Importiert alle FCI-anerkannten Rassen in die Datenbank.
// Ausführen mit: npm run db:seed
// Nach dem ersten Import nie wieder nötig (außer bei neuen FCI-Rassen).

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Auswahl der wichtigsten FCI-Rassen (vollständige Liste hat ~355 Einträge).
// Diese Datei enthält die 60 häufigsten in Deutschland — für Production
// die komplette FCI-Liste von fci.be importieren.
const breeds = [
  // Gruppe 1: Hüte- und Treibhunde
  { fciNumber: 166, nameDe: "Deutscher Schäferhund", nameEn: "German Shepherd Dog", fciGroup: 1, fciSection: 1, slug: "deutscher-schaeferhund" },
  { fciNumber: 149, nameDe: "Rottweiler", nameEn: "Rottweiler", fciGroup: 2, fciSection: 2, slug: "rottweiler" },
  { fciNumber: 257, nameDe: "Berger Australien", nameEn: "Australian Shepherd", fciGroup: 1, fciSection: 1, slug: "australian-shepherd" },
  { fciNumber: 297, nameDe: "Berger Blanc Suisse", nameEn: "White Swiss Shepherd Dog", fciGroup: 1, fciSection: 1, slug: "weisser-schweizer-schaeferhund" },
  { fciNumber: 56,  nameDe: "Belgischer Schäferhund", nameEn: "Belgian Shepherd", fciGroup: 1, fciSection: 1, slug: "belgischer-schaeferhund" },
  { fciNumber: 296, nameDe: "Beauceron", nameEn: "Beauceron", fciGroup: 1, fciSection: 1, slug: "beauceron" },
  { fciNumber: 299, nameDe: "Border Collie", nameEn: "Border Collie", fciGroup: 1, fciSection: 1, slug: "border-collie" },
  { fciNumber: 83,  nameDe: "Shetland Sheepdog", nameEn: "Shetland Sheepdog", fciGroup: 1, fciSection: 1, slug: "shetland-sheepdog" },

  // Gruppe 2: Pinscher, Schnauzer, Molossoide, Schweizer Sennenhunde
  { fciNumber: 182, nameDe: "Berner Sennenhund", nameEn: "Bernese Mountain Dog", fciGroup: 2, fciSection: 3, slug: "berner-sennenhund" },
  { fciNumber: 331, nameDe: "Dobermann", nameEn: "Dobermann", fciGroup: 2, fciSection: 1, slug: "dobermann" },
  { fciNumber: 183, nameDe: "Großer Schweizer Sennenhund", nameEn: "Great Swiss Mountain Dog", fciGroup: 2, fciSection: 3, slug: "grosser-schweizer-sennenhund" },
  { fciNumber: 187, nameDe: "Boxer", nameEn: "Boxer", fciGroup: 2, fciSection: 2, slug: "boxer" },
  { fciNumber: 343, nameDe: "Cane Corso", nameEn: "Cane Corso", fciGroup: 2, fciSection: 2, slug: "cane-corso" },
  { fciNumber: 143, nameDe: "Mastino Napoletano", nameEn: "Neapolitan Mastiff", fciGroup: 2, fciSection: 2, slug: "mastino-napoletano" },
  { fciNumber: 185, nameDe: "Schnauzer", nameEn: "Schnauzer", fciGroup: 2, fciSection: 1, slug: "schnauzer" },
  { fciNumber: 186, nameDe: "Zwergschnauzer", nameEn: "Miniature Schnauzer", fciGroup: 2, fciSection: 1, slug: "zwergschnauzer" },

  // Gruppe 3: Terrier
  { fciNumber: 4,   nameDe: "West Highland White Terrier", nameEn: "West Highland White Terrier", fciGroup: 3, fciSection: 2, slug: "west-highland-white-terrier" },
  { fciNumber: 85,  nameDe: "Yorkshire Terrier", nameEn: "Yorkshire Terrier", fciGroup: 3, fciSection: 4, slug: "yorkshire-terrier" },
  { fciNumber: 6,   nameDe: "Airedale Terrier", nameEn: "Airedale Terrier", fciGroup: 3, fciSection: 1, slug: "airedale-terrier" },
  { fciNumber: 286, nameDe: "Jack Russell Terrier", nameEn: "Jack Russell Terrier", fciGroup: 3, fciSection: 2, slug: "jack-russell-terrier" },
  { fciNumber: 10,  nameDe: "Fox Terrier Glatthaar", nameEn: "Smooth Fox Terrier", fciGroup: 3, fciSection: 1, slug: "fox-terrier-glatthaar" },

  // Gruppe 4: Dachshunde
  { fciNumber: 148, nameDe: "Dackel (Kurzhaar)", nameEn: "Dachshund (Smooth)", fciGroup: 4, fciSection: 1, slug: "dackel-kurzhaar" },
  { fciNumber: 148, nameDe: "Dackel (Langhaar)", nameEn: "Dachshund (Long-haired)", fciGroup: 4, fciSection: 1, slug: "dackel-langhaar" },

  // Gruppe 5: Spitze und Hunde vom Urtyp
  { fciNumber: 97,  nameDe: "Alaskan Malamute", nameEn: "Alaskan Malamute", fciGroup: 5, fciSection: 1, slug: "alaskan-malamute" },
  { fciNumber: 270, nameDe: "Siberian Husky", nameEn: "Siberian Husky", fciGroup: 5, fciSection: 1, slug: "siberian-husky" },
  { fciNumber: 253, nameDe: "Samojede", nameEn: "Samoyed", fciGroup: 5, fciSection: 1, slug: "samojede" },
  { fciNumber: 314, nameDe: "Shiba", nameEn: "Shiba", fciGroup: 5, fciSection: 5, slug: "shiba" },
  { fciNumber: 163, nameDe: "Chow-Chow", nameEn: "Chow Chow", fciGroup: 5, fciSection: 5, slug: "chow-chow" },
  { fciNumber: 97,  nameDe: "Deutscher Spitz", nameEn: "German Spitz", fciGroup: 5, fciSection: 4, slug: "deutscher-spitz" },
  { fciNumber: 257, nameDe: "Eurasier", nameEn: "Eurasier", fciGroup: 5, fciSection: 5, slug: "eurasier" },

  // Gruppe 6: Laufhunde, Schweißhunde
  { fciNumber: 161, nameDe: "Beagle", nameEn: "Beagle", fciGroup: 6, fciSection: 1, slug: "beagle" },
  { fciNumber: 84,  nameDe: "Basset Hound", nameEn: "Basset Hound", fciGroup: 6, fciSection: 1, slug: "basset-hound" },
  { fciNumber: 50,  nameDe: "Bloodhound", nameEn: "Bloodhound", fciGroup: 6, fciSection: 1, slug: "bloodhound" },

  // Gruppe 7: Vorstehhunde
  { fciNumber: 119, nameDe: "Deutsch Kurzhaar", nameEn: "German Shorthaired Pointer", fciGroup: 7, fciSection: 1, slug: "deutsch-kurzhaar" },
  { fciNumber: 120, nameDe: "Deutsch Drahthaar", nameEn: "German Wirehaired Pointer", fciGroup: 7, fciSection: 1, slug: "deutsch-drahthaar" },
  { fciNumber: 116, nameDe: "Weimaraner", nameEn: "Weimaraner", fciGroup: 7, fciSection: 1, slug: "weimaraner" },
  { fciNumber: 210, nameDe: "Vizsla", nameEn: "Hungarian Vizsla", fciGroup: 7, fciSection: 1, slug: "vizsla" },

  // Gruppe 8: Apportierhunde, Stöberhunde, Wasserhunde
  { fciNumber: 122, nameDe: "Labrador Retriever", nameEn: "Labrador Retriever", fciGroup: 8, fciSection: 1, slug: "labrador-retriever" },
  { fciNumber: 111, nameDe: "Golden Retriever", nameEn: "Golden Retriever", fciGroup: 8, fciSection: 1, slug: "golden-retriever" },
  { fciNumber: 5,   nameDe: "English Cocker Spaniel", nameEn: "English Cocker Spaniel", fciGroup: 8, fciSection: 2, slug: "english-cocker-spaniel" },
  { fciNumber: 128, nameDe: "English Springer Spaniel", nameEn: "English Springer Spaniel", fciGroup: 8, fciSection: 2, slug: "english-springer-spaniel" },
  { fciNumber: 218, nameDe: "Nova Scotia Duck Tolling Retriever", nameEn: "Nova Scotia Duck Tolling Retriever", fciGroup: 8, fciSection: 1, slug: "nova-scotia-duck-tolling-retriever" },

  // Gruppe 9: Gesellschafts- und Begleithunde
  { fciNumber: 218, nameDe: "Chihuahua", nameEn: "Chihuahua", fciGroup: 9, fciSection: 6, slug: "chihuahua" },
  { fciNumber: 86,  nameDe: "Pudel (Groß)", nameEn: "Poodle (Standard)", fciGroup: 9, fciSection: 2, slug: "pudel-gross" },
  { fciNumber: 86,  nameDe: "Pudel (Zwerg)", nameEn: "Poodle (Miniature)", fciGroup: 9, fciSection: 2, slug: "pudel-zwerg" },
  { fciNumber: 86,  nameDe: "Pudel (Toy)", nameEn: "Poodle (Toy)", fciGroup: 9, fciSection: 2, slug: "pudel-toy" },
  { fciNumber: 257, nameDe: "Shih Tzu", nameEn: "Shih Tzu", fciGroup: 9, fciSection: 5, slug: "shih-tzu" },
  { fciNumber: 136, nameDe: "Cavalier King Charles Spaniel", nameEn: "Cavalier King Charles Spaniel", fciGroup: 9, fciSection: 7, slug: "cavalier-king-charles-spaniel" },
  { fciNumber: 101, nameDe: "Französische Bulldogge", nameEn: "French Bulldog", fciGroup: 9, fciSection: 11, slug: "franzoesische-bulldogge" },
  { fciNumber: 253, nameDe: "Maltese", nameEn: "Maltese", fciGroup: 9, fciSection: 1, slug: "maltese" },
  { fciNumber: 215, nameDe: "Bichon Frisé", nameEn: "Bichon Frisé", fciGroup: 9, fciSection: 1, slug: "bichon-frise" },
  { fciNumber: 29,  nameDe: "Dalmatiner", nameEn: "Dalmatian", fciGroup: 6, fciSection: 3, slug: "dalmatiner" },
  { fciNumber: 190, nameDe: "Shar Pei", nameEn: "Shar Pei", fciGroup: 2, fciSection: 2, slug: "shar-pei" },
  { fciNumber: 205, nameDe: "Welsh Corgi Pembroke", nameEn: "Welsh Corgi Pembroke", fciGroup: 1, fciSection: 1, slug: "welsh-corgi-pembroke" },

  // Gruppe 10: Windhunde
  { fciNumber: 162, nameDe: "Whippet", nameEn: "Whippet", fciGroup: 10, fciSection: 3, slug: "whippet" },
  { fciNumber: 158, nameDe: "Greyhound", nameEn: "Greyhound", fciGroup: 10, fciSection: 3, slug: "greyhound" },
];

async function main() {
  console.log("🌱 Starte Seed: FCI-Rassen...");

  // FCI-Nummer-Duplikate bereinigen (einige Rassen teilen eine Nummer in der obigen Liste)
  const seen = new Set<string>();
  const uniqueBreeds = breeds.filter((b) => {
    if (seen.has(b.slug)) return false;
    seen.add(b.slug);
    return true;
  });

  for (const breed of uniqueBreeds) {
    await prisma.breed.upsert({
      where: { slug: breed.slug },
      update: {},
      create: breed,
    });
  }

  console.log(`✅ ${uniqueBreeds.length} Rassen importiert.`);
  console.log("   Für die vollständige FCI-Liste: https://www.fci.be/en/nomenclature/");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
