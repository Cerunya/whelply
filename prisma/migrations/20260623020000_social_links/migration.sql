-- Social Media Links für Züchter-Profile
ALTER TABLE "breeder_profiles" ADD COLUMN IF NOT EXISTS "social_instagram" TEXT;
ALTER TABLE "breeder_profiles" ADD COLUMN IF NOT EXISTS "social_facebook" TEXT;
ALTER TABLE "breeder_profiles" ADD COLUMN IF NOT EXISTS "social_tiktok" TEXT;
ALTER TABLE "breeder_profiles" ADD COLUMN IF NOT EXISTS "social_youtube" TEXT;
