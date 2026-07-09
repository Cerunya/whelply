ALTER TABLE "breeder_profiles" ADD COLUMN IF NOT EXISTS "theme_bg_fixed" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "breeder_profiles" ADD COLUMN IF NOT EXISTS "theme_bg_overlay" TEXT;
