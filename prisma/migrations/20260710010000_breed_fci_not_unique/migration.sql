-- FCI-Nummer ist nicht unique, da Varietäten (z.B. Spitz, Dachshund, Pudel) dieselbe Nummer teilen
DROP INDEX IF EXISTS "breeds_fci_number_key";
