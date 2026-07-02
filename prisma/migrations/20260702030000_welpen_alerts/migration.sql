CREATE TABLE IF NOT EXISTS "welpen_alerts" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "email"      TEXT NOT NULL,
  "breed_id"   INTEGER REFERENCES "breeds"("id") ON DELETE SET NULL,
  "state"      TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "welpen_alerts_email_idx" ON "welpen_alerts"("email");
