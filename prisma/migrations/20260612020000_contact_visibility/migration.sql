-- Schalter, ob Telefonnummer und Adresse öffentlich auf der Züchter-Seite angezeigt werden
ALTER TABLE "breeder_profiles" ADD COLUMN "show_phone" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "breeder_profiles" ADD COLUMN "show_address" BOOLEAN NOT NULL DEFAULT false;
