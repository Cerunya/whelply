CREATE TABLE products (
  id TEXT NOT NULL PRIMARY KEY,
  asin TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  image_url TEXT,
  affiliate_tag TEXT NOT NULL DEFAULT 'whelply-21',
  category TEXT NOT NULL DEFAULT 'zubehoer',
  description TEXT,
  price_cents INTEGER,
  price_updated_at TIMESTAMP(3),
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
