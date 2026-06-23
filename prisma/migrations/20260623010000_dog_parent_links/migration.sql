-- Direkte Eltern-Verknüpfung am Hund-Datensatz für den Stammbaum.
-- Bisher wurde der Stammbaum über Wurf-Relationen (littersAsSire/AsDam) approximiert,
-- was zu falschen Ergebnissen führte (Hund erschien als sein eigener Vorfahr).
ALTER TABLE "dogs" ADD COLUMN "parent_sire_id" TEXT;
ALTER TABLE "dogs" ADD COLUMN "parent_dam_id" TEXT;

ALTER TABLE "dogs" ADD CONSTRAINT "dogs_parent_sire_id_fkey"
  FOREIGN KEY ("parent_sire_id") REFERENCES "dogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "dogs" ADD CONSTRAINT "dogs_parent_dam_id_fkey"
  FOREIGN KEY ("parent_dam_id") REFERENCES "dogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "dogs_parent_sire_id_idx" ON "dogs"("parent_sire_id");
CREATE INDEX "dogs_parent_dam_id_idx" ON "dogs"("parent_dam_id");
