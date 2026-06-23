-- Abgabe-/Abholdatum der Welpen (wird relevant, sobald der Wurf geboren ist —
-- ersetzt die "Anzahl Welpen (geplant)"-Angabe im Dashboard für diese Phase)
ALTER TABLE "litters" ADD COLUMN "handover_date" DATE;
