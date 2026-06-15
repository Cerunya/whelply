-- Gesundheitstests werden als Freitext statt einzelner Datensätze gepflegt
-- (Züchter dokumentieren oft sehr viele Tests — einzelne Einträge wären zu umständlich)
ALTER TABLE "dogs" ADD COLUMN "health_info" TEXT;

DROP TABLE "dog_health_tests";
