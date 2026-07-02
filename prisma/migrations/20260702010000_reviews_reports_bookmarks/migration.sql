-- Übergabe-Optionen auf BreederProfile
ALTER TABLE "breeder_profiles"
  ADD COLUMN IF NOT EXISTS "handover_location" TEXT,
  ADD COLUMN IF NOT EXISTS "visit_possible" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "dam_visit_possible" BOOLEAN NOT NULL DEFAULT FALSE;

-- Bewertungen
CREATE TABLE IF NOT EXISTS "reviews" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "user_id"    TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "breeder_id" TEXT NOT NULL REFERENCES "breeder_profiles"("id") ON DELETE CASCADE,
  "rating"     INTEGER NOT NULL,
  "title"      TEXT,
  "content"    TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("user_id", "breeder_id")
);

-- Meldungen
CREATE TABLE IF NOT EXISTS "reports" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "user_id"    TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "listing_id" TEXT NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
  "reason"     TEXT NOT NULL,
  "comment"    TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Merkliste
CREATE TABLE IF NOT EXISTS "bookmarks" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "user_id"    TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "listing_id" TEXT REFERENCES "listings"("id") ON DELETE CASCADE,
  "litter_id"  TEXT REFERENCES "litters"("id") ON DELETE CASCADE,
  "breeder_id" TEXT REFERENCES "breeder_profiles"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
