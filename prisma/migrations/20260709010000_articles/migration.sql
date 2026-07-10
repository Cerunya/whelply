CREATE TABLE IF NOT EXISTS "articles" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "excerpt" TEXT,
  "content" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'ratgeber',
  "cover_image_url" TEXT,
  "meta_title" TEXT,
  "meta_description" TEXT,
  "breed_id" INTEGER,
  "author_name" TEXT,
  "is_published" BOOLEAN NOT NULL DEFAULT false,
  "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "articles_slug_key" ON "articles"("slug");
ALTER TABLE "articles" ADD CONSTRAINT "articles_breed_id_fkey" FOREIGN KEY ("breed_id") REFERENCES "breeds"("id") ON DELETE SET NULL ON UPDATE CASCADE;
