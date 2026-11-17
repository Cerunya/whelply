import { PrismaClient } from "@prisma/client";
import breeds from "./fci-breeds.json";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starte Seed: vollständige FCI-Rasseliste...");

  // Keine vorhandenen Datensätze löschen: Rassen können bereits mit Hunden,
  // Würfen, Inseraten und Alerts verknüpft sein.
  for (const breed of breeds) {
    const existing = await prisma.breed.findFirst({
      where: { OR: [{ fciNumber: breed.fciNumber }, { slug: breed.slug }] },
      select: { id: true },
    });
    if (!existing) await prisma.breed.create({ data: breed });
  }

  console.log(`✅ ${breeds.length} offizielle FCI-Rassen abgeglichen.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
