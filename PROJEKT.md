# Whelply.de — Projektgedächtnis
<!-- Diese Datei am Anfang jeder neuen Claude-Konversation einfügen -->
<!-- Letzte Aktualisierung: 2026-06-10 -->

## Was wir bauen
Deutsche Rassehunde-Plattform. Nur FCI-anerkannte Rassen. Kein Tierschutz, keine Mischlinge, keine Designerrassen (Maltipoo etc.). Inspiriert von chiens-de-france.com, aber moderner, mit KI-Features, und mit klarem Fokus auf seriöse VDH-Züchter.

## Domain
**whelply.de** (stand Juni 2026 frei, registrieren!)

## Tech-Stack (Coolify-kompatibel, self-hosted)
| Dienst | Technologie |
|--------|-------------|
| Frontend/Backend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Datenbank | PostgreSQL 16 (Coolify Service) |
| ORM | Prisma 5 |
| Auth | Auth.js v5 (NextAuth) |
| Dateispeicher | MinIO (Coolify Service, S3-kompatibel) |
| E-Mail | Resend (kostenlos bis 3k/Monat) |
| Zahlungen | Stripe |
| KI | Anthropic API (Claude) |
| Deployment | Coolify (self-hosted auf Homeserver) |

## Infrastruktur
- Server: **Teclast M20 Pro** — Intel N95 12th Gen (4×3,4 GHz), 8 GB DDR4, 256 GB NVMe SSD
- Coolify bereits aufgesetzt ✅
- Hardware ist ausreichend für den Start
- Optional: 8 GB SO-DIMM DDR4 (~15–20 €) falls zweiter RAM-Slot vorhanden

## Verifikationskonzept
- **FCI-Zwingername** als Pflichtfeld bei Züchter-Registrierung (UNIQUE constraint)
- Optionales Feld: Verband (VDH, ÖKV, SKG, ASCA...) + Mitgliedsnummer → "Verifizierter Züchter"-Badge
- Rasseliste = FCI-offizielle Liste (~355 Rassen), einmalig in DB importiert → Maltipoo etc. automatisch ausgeschlossen
- Falschangaben = Vertragsverletzung + sofortige Sperrung (in AGB)

## Pricing-Modell
| Produkt | Preis | Status |
|---------|-------|--------|
| Basis-Account | 0 € | immer kostenlos, max. 3 Inserate |
| 24h Topanzeige | 1,00 € | Einmalkauf, sofort buchbar — Kern-Feature |
| Pro-Abo | 14,90 €/Monat (10,90 jährl.) | unbegrenzte Inserate + KI-Features |
| Premium-Abo | 29,90 €/Monat (21,90 jährl.) | + Custom Domain + Messaging + Featured |
| Dienstleister Premium | 9,90 €/Monat | Tierärzte, Groomer, Pensionen |
| AdSense | — | nur auf Content-Seiten (Ratgeber, Rasselexikon), nicht auf Inseraten |
| Affiliates | CPA | Agila/HanseMerkur Versicherung, Purina/Royal Canin |

**Wichtig:** Erst kostenlos wachsen bis ~200 Züchter, dann Pro-Abo einführen.

## Datenbankschema (fertig, in prisma/schema.prisma)
9 Tabellen: `users`, `breeder_profiles`, `breeds`, `dogs`, `litters`, `listings`, `boosts`, `subscriptions`, `service_providers` + `media` (polymorph) + Auth.js-Tabellen

Wichtige Constraints:
- `kennel_name` UNIQUE auf `breeder_profiles`
- `listings.type = 'puppy'` → `litter_id NOT NULL, dog_id NULL` (App-Schicht)
- `price_cents` INTEGER (100 = 1,00 €)
- `boost_expires_at > NOW()` steuert Boost-Status automatisch

## Projektdateien (bereits erstellt)
- `prisma/schema.prisma` — vollständiges DB-Schema
- `prisma/seed.ts` — ~55 FCI-Rassen zum Import
- `package.json` — alle Dependencies
- `docker-compose.yml` — PostgreSQL + MinIO lokal
- `.env.example` — alle benötigten Umgebungsvariablen
- `README.md` — Setup-Anleitung

## Coolify Setup (Schritt-für-Schritt, für spätere Konversationen)
1. Coolify öffnen → Services → "+ New Service" → PostgreSQL
   - Name: whelply-db, DB: whelply, User: whelply, Passwort: selbst wählen
2. Connection String notieren → wird DATABASE_URL
3. Application anlegen → GitHub Repo verbinden
4. Environment Variables eintragen (aus .env.example)
5. Post-deploy Hook: `npx prisma migrate deploy && npx prisma db seed`

## Abgeschlossene Tasks
- [x] Task 1: Analyse chiens-de-france.com (Seitenstruktur, Nutzerflows, Kernfunktionen, Lücken)
- [x] Task 2: Datenbankschema (ERD + Prisma Schema)
- [x] Task 3: Tech-Stack + Projektgrundgerüst (package.json, docker-compose, .env.example, seed)

## Offene Tasks
- [ ] Task 4: Next.js Projektstruktur + erste API-Routes
- [ ] Task 5: Authentifizierung (Auth.js Setup, Züchter-Registrierung mit Zwingername)
- [ ] Task 6: Frontend — Startseite + Welpen-Suchseite
- [ ] Task 7: Züchter-Dashboard (Inserate verwalten, Würfe eintragen)
- [ ] Task 8: Boost-Zahlung (Stripe Payment Intent für 1€)
- [ ] Task 9: KI-Features (Rassen-Finder, Textgenerator für Inserate)
- [ ] Task 10: SEO + Deployment auf Coolify

## Wichtige Entscheidungen / Nicht nochmal diskutieren
- Projektname: **Whelply** — Domain whelply.de
- Keine Mischlinge, kein Tierschutz — hart kodiert durch FCI-Rassenliste
- Kein VDH-API verfügbar → Honor-System + AGB reicht als Abschreckung
- Stripe statt PayPal für Zahlungen (bessere Developer Experience)
- MinIO statt Cloudinary (self-hosted, kein externer Dienst nötig)
- Resend statt SMTP-Server (einfacher, zuverlässiger, kostenlos im Start)
- Teclast M20 Pro ist ausreichend, kein Hardware-Kauf nötig
