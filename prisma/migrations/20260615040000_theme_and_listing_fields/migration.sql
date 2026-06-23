-- Theme-Erweiterung: mehr Designoptionen für Züchterseiten
ALTER TABLE "breeder_profiles" ADD COLUMN "theme_bg_color" TEXT;
ALTER TABLE "breeder_profiles" ADD COLUMN "theme_nav_color" TEXT;
ALTER TABLE "breeder_profiles" ADD COLUMN "theme_font" TEXT;
ALTER TABLE "breeder_profiles" ADD COLUMN "theme_align" TEXT;

-- Welpen-Zusatzinfos (Gesundheit, Ahnentafel, Geburtsort)
ALTER TABLE "listings" ADD COLUMN "has_pedigree" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "listings" ADD COLUMN "is_vaccinated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "listings" ADD COLUMN "is_dewormed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "listings" ADD COLUMN "is_chipped" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "listings" ADD COLUMN "is_insured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "listings" ADD COLUMN "birth_location" TEXT;
ALTER TABLE "listings" ADD COLUMN "chip_number" TEXT;
