-- Erweitert breeder_profiles um Anzeigename und private Adressdaten
ALTER TABLE "breeder_profiles" ADD COLUMN "display_name" TEXT;
ALTER TABLE "breeder_profiles" ADD COLUMN "street" TEXT;
ALTER TABLE "breeder_profiles" ADD COLUMN "zip" TEXT;
