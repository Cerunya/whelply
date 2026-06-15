-- Dog: optionaler Vorstellungstext für die große Einzel-Darstellung auf der Züchterseite
ALTER TABLE "dogs" ADD COLUMN "description" TEXT;

-- Aktuelles/News: eigene Unterseite pro Züchter
CREATE TABLE "news_posts" (
    "id" TEXT NOT NULL,
    "breeder_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_posts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "news_posts_breeder_id_idx" ON "news_posts"("breeder_id");

ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_breeder_id_fkey" FOREIGN KEY ("breeder_id") REFERENCES "breeder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Media: optionale Bilder zu News-Posts
ALTER TABLE "media" ADD COLUMN "news_post_id" TEXT;
ALTER TABLE "media" ADD CONSTRAINT "media_news_post_id_fkey" FOREIGN KEY ("news_post_id") REFERENCES "news_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
