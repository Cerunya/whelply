-- Fügt Aufruf-Zähler für Inserate hinzu (Statistik im Züchter-Dashboard und Admin)
ALTER TABLE "listings" ADD COLUMN "view_count" INTEGER NOT NULL DEFAULT 0;
