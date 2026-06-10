-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('buyer', 'breeder', 'service', 'admin');

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('none', 'email_verified', 'kennel_verified', 'doc_verified');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('free', 'pro', 'premium');

-- CreateEnum
CREATE TYPE "LitterStatus" AS ENUM ('planned', 'pregnant', 'born', 'available', 'sold_out');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('puppy', 'stud', 'adult_dog');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('draft', 'available', 'reserved', 'sold', 'expired');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('vet', 'groomer', 'pension', 'trainer', 'other');

-- CreateEnum
CREATE TYPE "BoostType" AS ENUM ('top_24h', 'top_7d', 'homepage_7d', 'etalon_top');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'buyer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "breeder_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kennel_name" TEXT NOT NULL,
    "verband" TEXT,
    "mitgliedsnummer" TEXT,
    "verification_level" "VerificationLevel" NOT NULL DEFAULT 'none',
    "bio" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "state" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "breeder_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breeds" (
    "id" SERIAL NOT NULL,
    "fci_number" INTEGER NOT NULL,
    "name_de" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "fci_group" INTEGER NOT NULL,
    "fci_section" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "breeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dogs" (
    "id" TEXT NOT NULL,
    "breeder_id" TEXT NOT NULL,
    "breed_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sex" "Sex" NOT NULL,
    "birth_date" DATE,
    "color" TEXT,
    "chip_number" TEXT,
    "pedigree_number" TEXT,
    "titles" TEXT,
    "is_stud" BOOLEAN NOT NULL DEFAULT false,
    "is_for_sale" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "litters" (
    "id" TEXT NOT NULL,
    "breeder_id" TEXT NOT NULL,
    "breed_id" INTEGER NOT NULL,
    "dam_id" TEXT,
    "sire_id" TEXT,
    "sire_external" TEXT,
    "expected_date" DATE,
    "born_date" DATE,
    "puppy_count" INTEGER,
    "status" "LitterStatus" NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "litters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "breeder_id" TEXT NOT NULL,
    "breed_id" INTEGER NOT NULL,
    "type" "ListingType" NOT NULL,
    "litter_id" TEXT,
    "dog_id" TEXT,
    "title" TEXT,
    "description" TEXT,
    "price_cents" INTEGER,
    "sex" "Sex",
    "status" "ListingStatus" NOT NULL DEFAULT 'draft',
    "boost_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boosts" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "boost_type" "BoostType" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "stripe_payment_id" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "breeder_id" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'free',
    "stripe_sub_id" TEXT,
    "stripe_customer_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_providers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "description" TEXT,
    "street" TEXT,
    "city" TEXT,
    "zip" TEXT,
    "state" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "phone" TEXT,
    "website" TEXT,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "breeder_id" TEXT,
    "dog_id" TEXT,
    "litter_id" TEXT,
    "listing_id" TEXT,
    "service_id" TEXT,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");
CREATE UNIQUE INDEX "breeder_profiles_user_id_key" ON "breeder_profiles"("user_id");
CREATE UNIQUE INDEX "breeder_profiles_kennel_name_key" ON "breeder_profiles"("kennel_name");
CREATE UNIQUE INDEX "breeds_fci_number_key" ON "breeds"("fci_number");
CREATE UNIQUE INDEX "breeds_slug_key" ON "breeds"("slug");
CREATE UNIQUE INDEX "dogs_chip_number_key" ON "dogs"("chip_number");
CREATE UNIQUE INDEX "subscriptions_breeder_id_key" ON "subscriptions"("breeder_id");
CREATE UNIQUE INDEX "subscriptions_stripe_sub_id_key" ON "subscriptions"("stripe_sub_id");
CREATE UNIQUE INDEX "service_providers_user_id_key" ON "service_providers"("user_id");
CREATE UNIQUE INDEX "media_storage_key_key" ON "media"("storage_key");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "breeder_profiles" ADD CONSTRAINT "breeder_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dogs" ADD CONSTRAINT "dogs_breeder_id_fkey" FOREIGN KEY ("breeder_id") REFERENCES "breeder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dogs" ADD CONSTRAINT "dogs_breed_id_fkey" FOREIGN KEY ("breed_id") REFERENCES "breeds"("id") ON UPDATE CASCADE;
ALTER TABLE "litters" ADD CONSTRAINT "litters_breeder_id_fkey" FOREIGN KEY ("breeder_id") REFERENCES "breeder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "litters" ADD CONSTRAINT "litters_breed_id_fkey" FOREIGN KEY ("breed_id") REFERENCES "breeds"("id") ON UPDATE CASCADE;
ALTER TABLE "litters" ADD CONSTRAINT "litters_dam_id_fkey" FOREIGN KEY ("dam_id") REFERENCES "dogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "litters" ADD CONSTRAINT "litters_sire_id_fkey" FOREIGN KEY ("sire_id") REFERENCES "dogs"("id") ON UPDATE CASCADE;
ALTER TABLE "listings" ADD CONSTRAINT "listings_breeder_id_fkey" FOREIGN KEY ("breeder_id") REFERENCES "breeder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listings" ADD CONSTRAINT "listings_breed_id_fkey" FOREIGN KEY ("breed_id") REFERENCES "breeds"("id") ON UPDATE CASCADE;
ALTER TABLE "listings" ADD CONSTRAINT "listings_litter_id_fkey" FOREIGN KEY ("litter_id") REFERENCES "litters"("id") ON UPDATE CASCADE;
ALTER TABLE "listings" ADD CONSTRAINT "listings_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "dogs"("id") ON UPDATE CASCADE;
ALTER TABLE "boosts" ADD CONSTRAINT "boosts_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_breeder_id_fkey" FOREIGN KEY ("breeder_id") REFERENCES "breeder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_providers" ADD CONSTRAINT "service_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media" ADD CONSTRAINT "media_breeder_id_fkey" FOREIGN KEY ("breeder_id") REFERENCES "breeder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media" ADD CONSTRAINT "media_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "dogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media" ADD CONSTRAINT "media_litter_id_fkey" FOREIGN KEY ("litter_id") REFERENCES "litters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media" ADD CONSTRAINT "media_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media" ADD CONSTRAINT "media_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
