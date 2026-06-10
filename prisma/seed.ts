import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const breeds = [
  // Gruppe 1
  { fciNumber: 166, nameDe: "Deutscher Schäferhund", nameEn: "German Shepherd Dog", fciGroup: 1, fciSection: 1, slug: "deutscher-schaeferhund" },
  { fciNumber: 342, nameDe: "Australian Shepherd", nameEn: "Australian Shepherd", fciGroup: 1, fciSection: 1, slug: "australian-shepherd" },
  { fciNumber: 297, nameDe: "Weißer Schweizer Schäferhund", nameEn: "White Swiss Shepherd Dog", fciGroup: 1, fciSection: 1, slug: "weisser-schweizer-schaeferhund" },
  { fciNumber: 56,  nameDe: "Belgischer Schäferhund", nameEn: "Belgian Shepherd", fciGroup: 1, fciSection: 1, slug: "belgischer-schaeferhund" },
  { fciNumber: 44,  nameDe: "Beauceron", nameEn: "Beauceron", fciGroup: 1, fciSection: 1, slug: "beauceron" },
  { fciNumber: 299, nameDe: "Border Collie", nameEn: "Border Collie", fciGroup: 1, fciSection: 1, slug: "border-collie" },
  { fciNumber: 88,  nameDe: "Shetland Sheepdog", nameEn: "Shetland Sheepdog", fciGroup: 1, fciSection: 1, slug: "shetland-sheepdog" },
  { fciNumber: 38,  nameDe: "Welsh Corgi Pembroke", nameEn: "Welsh Corgi Pembroke", fciGroup: 1, fciSection: 1, slug: "welsh-corgi-pembroke" },
  { fciNumber: 39,  nameDe: "Welsh Corgi Cardigan", nameEn: "Welsh Corgi Cardigan", fciGroup: 1, fciSection: 1, slug: "welsh-corgi-cardigan" },
  // Gruppe 2
  { fciNumber: 45,  nameDe: "Dobermann", nameEn: "Dobermann", fciGroup: 2, fciSection: 1, slug: "dobermann" },
  { fciNumber: 182, nameDe: "Berner Sennenhund", nameEn: "Bernese Mountain Dog", fciGroup: 2, fciSection: 3, slug: "berner-sennenhund" },
  { fciNumber: 58,  nameDe: "Rottweiler", nameEn: "Rottweiler", fciGroup: 2, fciSection: 2, slug: "rottweiler" },
  { fciNumber: 144, nameDe: "Boxer", nameEn: "Boxer", fciGroup: 2, fciSection: 2, slug: "boxer" },
  { fciNumber: 343, nameDe: "Cane Corso", nameEn: "Cane Corso", fciGroup: 2, fciSection: 2, slug: "cane-corso" },
  { fciNumber: 183, nameDe: "Großer Schweizer Sennenhund", nameEn: "Great Swiss Mountain Dog", fciGroup: 2, fciSection: 3, slug: "grosser-schweizer-sennenhund" },
  { fciNumber: 182, nameDe: "Schnauzer", nameEn: "Schnauzer", fciGroup: 2, fciSection: 1, slug: "schnauzer" },
  { fciNumber: 183, nameDe: "Zwergschnauzer", nameEn: "Miniature Schnauzer", fciGroup: 2, fciSection: 1, slug: "zwergschnauzer" },
  // Gruppe 3
  { fciNumber: 85,  nameDe: "Yorkshire Terrier", nameEn: "Yorkshire Terrier", fciGroup: 3, fciSection: 4, slug: "yorkshire-terrier" },
  { fciNumber: 85,  nameDe: "West Highland White Terrier", nameEn: "West Highland White Terrier", fciGroup: 3, fciSection: 2, slug: "west-highland-white-terrier" },
  { fciNumber: 6,   nameDe: "Airedale Terrier", nameEn: "Airedale Terrier", fciGroup: 3, fciSection: 1, slug: "airedale-terrier" },
  { fciNumber: 345, nameDe: "Jack Russell Terrier", nameEn: "Jack Russell Terrier", fciGroup: 3, fciSection: 2, slug: "jack-russell-terrier" },
  // Gruppe 4
  { fciNumber: 148, nameDe: "Dackel", nameEn: "Dachshund", fciGroup: 4, fciSection: 1, slug: "dackel" },
  // Gruppe 5
  { fciNumber: 243, nameDe: "Alaskan Malamute", nameEn: "Alaskan Malamute", fciGroup: 5, fciSection: 1, slug: "alaskan-malamute" },
  { fciNumber: 270, nameDe: "Siberian Husky", nameEn: "Siberian Husky", fciGroup: 5, fciSection: 1, slug: "siberian-husky" },
  { fciNumber: 212, nameDe: "Samojede", nameEn: "Samoyed", fciGroup: 5, fciSection: 1, slug: "samojede" },
  { fciNumber: 257, nameDe: "Shiba", nameEn: "Shiba", fciGroup: 5, fciSection: 5, slug: "shiba" },
  { fciNumber: 205, nameDe: "Chow-Chow", nameEn: "Chow Chow", fciGroup: 5, fciSection: 5, slug: "chow-chow" },
  { fciNumber: 97,  nameDe: "Deutscher Spitz", nameEn: "German Spitz", fciGroup: 5, fciSection: 4, slug: "deutscher-spitz" },
  { fciNumber: 291, nameDe: "Eurasier", nameEn: "Eurasier", fciGroup: 5, fciSection: 5, slug: "eurasier" },
  // Gruppe 6
  { fciNumber: 161, nameDe: "Beagle", nameEn: "Beagle", fciGroup: 6, fciSection: 1, slug: "beagle" },
  { fciNumber: 163, nameDe: "Basset Hound", nameEn: "Basset Hound", fciGroup: 6, fciSection: 1, slug: "basset-hound" },
  { fciNumber: 84,  nameDe: "Bloodhound", nameEn: "Bloodhound", fciGroup: 6, fciSection: 1, slug: "bloodhound" },
  { fciNumber: 153, nameDe: "Dalmatiner", nameEn: "Dalmatian", fciGroup: 6, fciSection: 3, slug: "dalmatiner" },
  // Gruppe 7
  { fciNumber: 119, nameDe: "Deutsch Kurzhaar", nameEn: "German Shorthaired Pointer", fciGroup: 7, fciSection: 1, slug: "deutsch-kurzhaar" },
  { fciNumber: 120, nameDe: "Deutsch Drahthaar", nameEn: "German Wirehaired Pointer", fciGroup: 7, fciSection: 1, slug: "deutsch-drahthaar" },
  { fciNumber: 99,  nameDe: "Weimaraner", nameEn: "Weimaraner", fciGroup: 7, fciSection: 1, slug: "weimaraner" },
  { fciNumber: 57,  nameDe: "Vizsla", nameEn: "Hungarian Vizsla", fciGroup: 7, fciSection: 1, slug: "vizsla" },
  // Gruppe 8
  { fciNumber: 122, nameDe: "Labrador Retriever", nameEn: "Labrador Retriever", fciGroup: 8, fciSection: 1, slug: "labrador-retriever" },
  { fciNumber: 111, nameDe: "Golden Retriever", nameEn: "Golden Retriever", fciGroup: 8, fciSection: 1, slug: "golden-retriever" },
  { fciNumber: 5,   nameDe: "English Cocker Spaniel", nameEn: "English Cocker Spaniel", fciGroup: 8, fciSection: 2, slug: "english-cocker-spaniel" },
  { fciNumber: 128, nameDe: "English Springer Spaniel", nameEn: "English Springer Spaniel", fciGroup: 8, fciSection: 2, slug: "english-springer-spaniel" },
  { fciNumber: 312, nameDe: "Nova Scotia Duck Tolling Retriever", nameEn: "Nova Scotia Duck Tolling Retriever", fciGroup: 8, fciSection: 1, slug: "nova-scotia-duck-tolling-retriever" },
  // Gruppe 9
  { fciNumber: 218, nameDe: "Chihuahua", nameEn: "Chihuahua", fciGroup: 9, fciSection: 6, slug: "chihuahua" },
  { fciNumber: 172, nameDe: "Pudel", nameEn: "Poodle", fciGroup: 9, fciSection: 2, slug: "pudel" },
  { fciNumber: 208, nameDe: "Shih Tzu", nameEn: "Shih Tzu", fciGroup: 9, fciSection: 5, slug: "shih-tzu" },
  { fciNumber: 136, nameDe: "Cavalier King Charles Spaniel", nameEn: "Cavalier King Charles Spaniel", fciGroup: 9, fciSection: 7, slug: "cavalier-king-charles-spaniel" },
  { fciNumber: 101, nameDe: "Französische Bulldogge", nameEn: "French Bulldog", fciGroup: 9, fciSection: 11, slug: "franzoesische-bulldogge" },
  { fciNumber: 65,  nameDe: "Malteser", nameEn: "Maltese", fciGroup: 9, fciSection: 1, slug: "malteser" },
  { fciNumber: 215, nameDe: "Bichon Frisé", nameEn: "Bichon Frisé", fciGroup: 9, fciSection: 1, slug: "bichon-frise" },
  { fciNumber: 189, nameDe: "Shar Pei", nameEn: "Shar Pei", fciGroup: 2, fciSection: 2, slug: "shar-pei" },
  { fciNumber: 286, nameDe: "American Cocker Spaniel", nameEn: "American Cocker Spaniel", fciGroup: 8, fciSection: 2, slug: "american-cocker-spaniel" },
  { fciNumber: 309, nameDe: "Berger Australien (Mini)", nameEn: "Miniature American Shepherd", fciGroup: 1, fciSection: 1, slug: "miniature-american-shepherd" },
  // Gruppe 10
  { fciNumber: 162, nameDe: "Whippet", nameEn: "Whippet", fciGroup: 10, fciSection: 3, slug: "whippet" },
  { fciNumber: 158, nameDe: "Greyhound", nameEn: "Greyhound", fciGroup: 10, fciSection: 3, slug: "greyhound" },
];

async function main() {
  console.log("🌱 Starte Seed: FCI-Rassen...");

  // Deduplizieren nach fciNumber (nimm ersten Eintrag pro Nummer)
  const seen = new Set<number>();
  const unique = breeds.filter((b) => {
    if (seen.has(b.fciNumber)) return false;
    seen.add(b.fciNumber);
    return true;
  });

  let count = 0;
  for (const breed of unique) {
    await prisma.breed.upsert({
      where: { slug: breed.slug },
      update: { nameDe: breed.nameDe, nameEn: breed.nameEn },
      create: breed,
    });
    count++;
  }

  console.log(`✅ ${count} Rassen importiert.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });