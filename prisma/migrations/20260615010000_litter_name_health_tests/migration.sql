-- Litter: optionaler Wurfname
ALTER TABLE "litters" ADD COLUMN "name" TEXT;

-- Gesundheitstests pro Zuchthund
CREATE TABLE "dog_health_tests" (
    "id" TEXT NOT NULL,
    "dog_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "test_date" DATE,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dog_health_tests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "dog_health_tests_dog_id_idx" ON "dog_health_tests"("dog_id");

ALTER TABLE "dog_health_tests" ADD CONSTRAINT "dog_health_tests_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "dogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
