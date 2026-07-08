ALTER TABLE "dogs"
  ADD COLUMN IF NOT EXISTS "page_card_color" TEXT,
  ADD COLUMN IF NOT EXISTS "page_text_color" TEXT,
  ADD COLUMN IF NOT EXISTS "page_heading_color" TEXT,
  ADD COLUMN IF NOT EXISTS "page_bg_fixed" BOOLEAN NOT NULL DEFAULT true;
