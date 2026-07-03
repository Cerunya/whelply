CREATE TABLE IF NOT EXISTS "conversations" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "user_id"    TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "breeder_id" TEXT NOT NULL REFERENCES "breeder_profiles"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("user_id", "breeder_id")
);

CREATE TABLE IF NOT EXISTS "messages" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "conversation_id" TEXT NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "sender_role"     TEXT NOT NULL,
  "content"         TEXT NOT NULL,
  "read_at"         TIMESTAMP(3),
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "messages_conversation_id_idx" ON "messages"("conversation_id");
