-- Entfernt den historischen Fehleintrag mit der ungültigen FCI-Nummer 280.
-- Der Cão de Fila de São Miguel ist bereits korrekt unter FCI-Nr. 340 eingetragen.

CREATE TEMP TABLE fila_duplicate ON COMMIT DROP AS
SELECT wrong.id AS duplicate_id, correct.id AS canonical_id
FROM breeds wrong
JOIN breeds correct ON correct.fci_number = 340
WHERE wrong.fci_number = 280
  AND wrong.slug = 'cao-de-fila-de-sao-miguel';

UPDATE dogs d SET breed_id = r.canonical_id
FROM fila_duplicate r WHERE d.breed_id = r.duplicate_id;
UPDATE litters l SET breed_id = r.canonical_id
FROM fila_duplicate r WHERE l.breed_id = r.duplicate_id;
UPDATE listings l SET breed_id = r.canonical_id
FROM fila_duplicate r WHERE l.breed_id = r.duplicate_id;
UPDATE welpen_alerts a SET breed_id = r.canonical_id
FROM fila_duplicate r WHERE a.breed_id = r.duplicate_id;
UPDATE articles a SET breed_id = r.canonical_id
FROM fila_duplicate r WHERE a.breed_id = r.duplicate_id;

DELETE FROM breeds b
USING fila_duplicate r WHERE b.id = r.duplicate_id;
