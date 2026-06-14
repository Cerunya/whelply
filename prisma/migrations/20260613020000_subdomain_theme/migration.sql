-- Subdomain + Theme-Editor: eigene Subdomain (kennelname.whelply.de) und
-- anpassbare Primär-/Akzentfarbe pro Züchter
ALTER TABLE "breeder_profiles" ADD COLUMN "subdomain" TEXT;
ALTER TABLE "breeder_profiles" ADD COLUMN "theme_color" TEXT;
ALTER TABLE "breeder_profiles" ADD COLUMN "theme_accent_color" TEXT;
CREATE UNIQUE INDEX "breeder_profiles_subdomain_key" ON "breeder_profiles"("subdomain");

-- Media: "purpose" unterscheidet Header-/Hintergrundbild bei breederId-Medien
ALTER TABLE "media" ADD COLUMN "purpose" TEXT;
