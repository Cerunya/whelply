-- "Erwartetes Datum" wird zu einem Freitext-Feld (z.B. "Ende Mai 2026"),
-- da der genaue Termin bei geplanten Würfen meist noch unbekannt ist.
ALTER TABLE "litters" ALTER COLUMN "expected_date" TYPE TEXT USING "expected_date"::TEXT;
