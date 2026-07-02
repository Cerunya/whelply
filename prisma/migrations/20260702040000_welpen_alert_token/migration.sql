ALTER TABLE "welpen_alerts"
  ADD COLUMN IF NOT EXISTS "unsubscribe_token" TEXT,
  ADD COLUMN IF NOT EXISTS "last_sent_at" TIMESTAMP(3);

-- Bestehende Zeilen mit zufälligem Token befüllen
UPDATE "welpen_alerts" SET "unsubscribe_token" = gen_random_uuid()::text WHERE "unsubscribe_token" IS NULL;

-- Jetzt NOT NULL setzen
ALTER TABLE "welpen_alerts" ALTER COLUMN "unsubscribe_token" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "welpen_alerts_unsubscribe_token_key" ON "welpen_alerts"("unsubscribe_token");
