# Whelply.de — Projektgedächtnis
<!-- Diese Datei am Anfang jeder neuen Claude-Konversation einfügen -->
<!-- Letzte Aktualisierung: 2026-06-14 -->

## Was wir bauen
Deutsche Rassehunde-Plattform. Nur FCI-anerkannte Rassen. Kein Tierschutz, keine Mischlinge, keine Designerrassen (Maltipoo etc.). Inspiriert von chiens-de-france.com, aber moderner, mit KI-Features, und mit klarem Fokus auf seriöse VDH-Züchter.

## Domain
**whelply.de** ✅ live

## Tech-Stack (Coolify-kompatibel, self-hosted)
| Dienst | Technologie |
|--------|-------------|
| Frontend/Backend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Datenbank | PostgreSQL 16 (Coolify Service) |
| ORM | Prisma 5 |
| Auth | Auth.js v5 (NextAuth) |
| Dateispeicher | MinIO (Coolify Service, S3-kompatibel) — noch nicht eingerichtet |
| E-Mail | Resend (kostenlos bis 3k/Monat) |
| Zahlungen | Stripe |
| KI | Anthropic API (Claude) |
| Deployment | Coolify (self-hosted, Teclast M20 Pro, N95, 8GB RAM, 256GB NVMe) |

## Design
- Farben: Forest Green (#1B3A2D), Honey/Amber (#C8861A), Cream (#FDFAF4)
- Fonts: Playfair Display (Serif, Headlines) + Inter (Sans, Body)
- Tailwind custom colors: `forest`, `honey`, `cream` (in tailwind.config.ts)

## Verifikationskonzept
- FCI-Zwingername als Pflichtfeld (UNIQUE constraint)
- Optionales Feld: Verband + Mitgliedsnummer → Badge
- Rasseliste = FCI-Liste in DB → Maltipoo etc. ausgeschlossen
- Falschangaben = AGB-Verstoß + Sperrung

## Pricing-Modell
| Produkt | Preis |
|---------|-------|
| Basis-Account | 0 € (max. 3 Inserate) |
| 24h Topanzeige | 1,00 € |
| Pro-Abo | 14,90 €/Monat |
| Premium-Abo | 29,90 €/Monat |
| Dienstleister Premium | 9,90 €/Monat |
| AdSense | nur auf Content-Seiten |
| Affiliates | CPA (Agila, Purina) |

## Environment Variables (Coolify)
```
DATABASE_URL=postgresql://whelply:...@mhpnpg79rlq99qdn62qpgfdx:5432/whelply
NEXTAUTH_URL=https://whelply.de
NEXTAUTH_SECRET=...
NEXT_PUBLIC_APP_URL=https://whelply.de
PREVIEW_PASSWORD=...
NIXPACKS_NODE_VERSION=22
```

## Workflow-Hinweise für Claude (wichtig!)
- **Datei-Workflow**: Claude erstellt/ändert Dateien unter `/mnt/user-data/outputs/whelply/[pfad]`
  (spiegelt die Repo-Struktur), präsentiert sie via present_files. User kopiert sie per
  GitHub Desktop ins lokale Repo, committet, pusht. Coolify deployt automatisch.
- **Migrations-Workflow**: Migrationen laufen NACH dem Build. Wenn neuer Code (z.B. Prisma
  Client) auf neue Spalten/Tabellen verweist, die in der Prod-DB noch nicht existieren,
  schlägt der Build/Start fehl, BEVOR die Migration läuft. Deshalb: neue Spalten/Tabellen
  IMMER vorab manuell per psql anlegen, bevor gepusht/deployed wird.
- **KRITISCH — psql-Befehle IMMER in diesem Format ausgeben**, damit der User sie 1:1
  kopieren kann (User tippt sonst rohes SQL direkt in die Shell, was fehlschlägt):
  ```bash
  psql -U whelply -d whelply -c "ALTER TABLE ... ;"
  ```
  Jeder Befehl als EINE zusammenhängende Zeile, komplettes SQL in doppelten Anführungszeichen
  nach `-c `. Mehrere Statements = mehrere separate `psql -c "..."`-Befehle, nicht alle in
  einer Zeile aneinandergehängt.
- **Nach erfolgreichem Deploy**: im App-Container `npx prisma migrate resolve --applied
  <migrations-ordner-name>` (exakter Ordnername, OHNE Punkt/Satzzeichen am Ende).
- **Falls der App-Container NICHT startet** (weil `migrate deploy` beim Hochfahren auf eine
  Migration trifft, deren Spalten schon per Hand angelegt wurden → "Spalte existiert bereits"
  → Crash-Loop): den Eintrag in `_prisma_migrations` DIREKT per psql einfügen, OHNE
  laufenden App-Container zu brauchen:
  ```bash
  psql -U whelply -d whelply -c "SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at;"
  ```
  Checksum der migration.sql berechnen (sha256sum), dann:
  ```bash
  psql -U whelply -d whelply -c "INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES ('<uuid>', '<sha256-checksum>', now(), '<migrations-ordner-name>', now(), <anzahl-statements>);"
  ```
  (UUID z.B. via `cat /proc/sys/kernel/random/uuid` generieren.)
- **Full Route Cache**: alle öffentlichen, datengetriebenen Seiten haben
  `export const dynamic = 'force-dynamic'` (sonst zeigen sie nach Datenänderungen
  veraltete, gecachte Inhalte bis zum nächsten Deploy). Neue öffentliche Seiten mit
  DB-Zugriff IMMER mit dieser Zeile anlegen.
- **`router.refresh()` in Client-Komponenten**: kann in Next.js 14 dazu führen, dass
  Client-Komponenten ihren lokalen State verlieren/zurücksetzen, wenn der Server-Baum neu
  gerendert wird. Bei Formularen, die nur sich selbst aktualisieren müssen (z.B. ThemeEditor),
  `router.refresh()` NICHT aufrufen — lokaler State reicht.

## Bekannte offene DB-Aufgabe
- `dam_id` in `litters` Tabelle ist noch NOT NULL in der DB → muss geändert werden:
  ```bash
  psql -U whelply -d whelply -c "ALTER TABLE litters ALTER COLUMN dam_id DROP NOT NULL;"
  ```
- Danach: `npx prisma db seed` im App-Container für deutsche Rassenamen

## Abgeschlossene Tasks
- [x] Task 1: Analyse chiens-de-france.com
- [x] Task 2: Datenbankschema (ERD + Prisma Schema)
- [x] Task 3: Tech-Stack + Projektgrundgerüst
- [x] Task 4: Next.js Projektstruktur + Grundseiten
- [x] Task 5: Authentifizierung (Registrierung mit Zwingername, Login, Session)
- [x] Task 6: Frontend — Startseite + Welpen-Suchseite (Design: grüner Hero, Honey-Akzent)
- [~] Task 7: Züchter-Dashboard — teilweise fertig (siehe Unterseiten unten)

## Task 7 — Dashboard Unterseiten (Stand)

### ✅ Fertig
- `/dashboard` — Übersicht mit Statistiken (inkl. Profilaufrufe), Würfe-Sektion, Inserate-Tabelle, Admin-Link für Admins
- `/dashboard/inserat-erstellen` — Inserat anlegen (Name/title, Rasse, optional Wurf-Zuordnung), leitet direkt zu Bearbeitung+Fotos weiter
  → primär für Einzeltiere ohne Wurf (adulte Hunde, Etalons)
- `/dashboard/inserat/[id]` — Inserat bearbeiten/löschen + Bildupload + Name + Wurf-Zuordnung
- `/dashboard/wurf-eintragen` — Wurf anlegen (Status: geplant/trächtig — "available"/"sold_out" erst
  möglich wenn Welpen existieren, serverseitig validiert), Mutter/Vater-Auswahl aus eigenen Hunden
  (gefiltert nach Rasse) oder externer Deckrüde als Freitext
- `/dashboard/wurf/[id]` — Wurf-Verwaltung: Titelbild-Upload, Status ändern (explizites
  Dropdown + Speichern-Button), Liste der Welpen mit Status/Preis/Foto
- `/dashboard/wurf/[id]/welpe-hinzufuegen` — Welpe zum Wurf hinzufügen: legt Dog + Listing
  zusammen an (Name, Geschlecht, Geburtsdatum, Farbe, Chip-Nr., Preis), leitet zu Fotos weiter
- `/dashboard/hund-eintragen` — "Zuchthund eintragen" (Rüde ODER Hündin, ersetzt altes
  ruede-eintragen), inkl. "als Deckrüde anbieten"-Flag für Rüden + Hinweistext "Dies ist
  KEIN Inserat"; diese Hunde stehen dann als Mutter/Vater beim Wurf-Eintragen zur Auswahl.
  Nach dem Anlegen → direkt zu `/dashboard/hund/[id]` (Bearbeiten + Foto-Upload)
- `/dashboard/hund/[id]` — Zuchthund bearbeiten: Profilbild-Upload, alle Stammdaten,
  Löschen (blockiert falls als Mutter/Vater eines Wurfs verlinkt)
- `/hund/[id]` — Öffentliche Zuchthund-Profilseite: Foto, Titel, Geburtsdatum/Alter,
  "Deckrüde verfügbar"-Badge falls isStud, Würfe als Mutter/Vater mit Link zu verfügbaren
  Welpen, Eigentümer-Vorschau-Banner mit "Bearbeiten"-Button (wie bei /welpen/[id])
- Dashboard-Sektion "Meine Zuchthunde" — alle eingetragenen Hunde mit Foto/Rasse/Geschlecht,
  klickbar zur Bearbeitung
- `/hunde` — Erwachsene Hunde zur Abgabe (Listing type=adult_dog, status=available),
  gleiche Filter (Rasse/Bundesland) wie /welpen, eigener Navbar-Punkt "Hunde"
- Inserat erstellen/bearbeiten: "Art des Inserats"-Dropdown (Erwachsener Hund / Welpe
  einzeln / Deckrüde-Angebot) — automatisch "Welpe" wenn ein Wurf verknüpft wird
- `/dashboard/profil` — Profil bearbeiten: Anzeigename, Bio, Webseite, Verband, Adresse/Telefon
  (mit Sichtbarkeits-Toggles showPhone/showAddress für öffentliche Anzeige)
- `/welpen/[id]` — Öffentliche Welpen-Detailseite: Bildergalerie, View-Counter, Alter (berechnet),
  Chip-Nr., Farbe, Eltern-Sektion (Mutter/Vater mit Titeln + Mini-Foto, ganze Karte klickbar,
  verlinkt zu /hund/[id] falls als Dog registriert), Wurfgeschwister-Sektion (verlinkt zu
  deren Listings), Eigentümer-Vorschau-Banner mit "Bearbeiten"-Button (auch für draft/reserved/sold)
- `/welpen`, `/`, `/zuechter/[slug]`, `/rassen/[slug]` — ListingCards zeigen jetzt den
  Hundenamen (title) als Haupttitel, Kennel als Subtext
- `/zuechter` — Züchter-Verzeichnis mit Filter nach Rasse/Bundesland
- `/zuechter/[slug]` — Öffentliche Züchter-Mini-Seite (Bio, Kontakt falls freigegeben, Welpen
  mit Status-Badges, Würfe inkl. Titelbild + korrekter Status-Badge (Geplant/Trächtig/Geboren/
  Verfügbar/Ausverkauft — vorher fälschlich immer "In Planung" außer bei available/sold_out),
  "Erwachsene Hunde zur Abgabe"-Sektion, "Zuchtrüden"-Sektion mit Foto + Honig-Badge,
  verlinkt zu /hund/[id])
- `/zuchtrueden` — Übersicht männlicher Zuchthunde, Deckrüden hervorgehoben, Filter nach Rasse
- `/rassen` — Rasselexikon, gruppiert nach FCI-Gruppe (alle 56 importierten Rassen)
- `/rassen/[slug]` — Rasse-Detail mit verfügbaren Welpen + Züchtern dieser Rasse
- `/dienste` — Dienstleister-Verzeichnis (aktuell leer, Onboarding fehlt noch)
- `/admin` — Admin-Dashboard (Stats, Züchter verwalten/verifizieren/löschen, Inserate löschen)
- API: `/api/inserate` (POST/PATCH/DELETE), `/api/wuerfe` (POST/PATCH), `/api/wuerfe/[id]/welpen` (POST),
  `/api/hunde` (POST), `/api/hunde/[id]` (PATCH/DELETE), `/api/profil` (PATCH),
  `/api/profil/check-subdomain` (GET), `/api/news` (POST), `/api/news/[id]` (PATCH/DELETE),
  `/api/admin/listings/[id]` (DELETE), `/api/admin/breeders/[id]` (PATCH/DELETE),
  `/api/upload` (POST: listingId/litterId/dogId/newsPostId/purpose[header|background|gallery];
  DELETE: mediaId ODER purpose), `/api/media/[...key]/view` (gestreamt),
  `/api/media-item/[id]` (Bildupload via Garage)
- router.refresh() nach Erstellen/Bearbeiten (inkl. Wurf-Erstellung — war ein Bugfix)

### ✅ Wurf-zentrierter Flow (Punkt 4) — FERTIG
- Workflow: a) Wurf anmelden (geplant/trächtig/geboren, optional Mutter/Vater + Titelbild)
  b) im Wurf-Dashboard einzelne Welpen hinzufügen (Dog + Listing zusammen)
  c) Wurf-Status "abgabebereit"/"ausverkauft" erst wählbar wenn ≥1 Welpe existiert (serverseitig + UI validiert)
- Suchseiten zeigen einzelne Welpen mit Namen (nicht nur Kennel)
- Detailseite zeigt Alter, Eltern (mit Links zu Dog-Profilen falls vorhanden), Wurfgeschwister
- Wurf nachträglich bearbeitbar (eigene "Wurf-Details"-Sektion im Wurf-Dashboard):
  Rasse, Mutter/Vater (Dropdown gefiltert nach Rasse, mit Reset bei Rassenwechsel),
  externer Deckrüde, erwartetes Datum, Geburtsdatum, Anzahl Welpen, Notizen
  → Rassenänderung wird automatisch auf alle bereits eingetragenen Welpen (Dog + Listing)
    dieses Wurfs übertragen, mit Warnhinweis im UI
- Status-Wechsel: explizites Dropdown + "Speichern"-Button (kein automatisches onChange mehr),
  planned↔pregnant jederzeit möglich, available/sold_out nur mit ≥1 Welpe
- Kein neues DB-Schema nötig für die Grundstruktur — dogId/litterId/dam/sire-Relationen
  existierten bereits im Schema, nur Workflow/UI fehlten
- Alter ruede-eintragen-Pfad ist obsolet (durch hund-eintragen ersetzt), Ordner kann manuell
  gelöscht werden, ist aber nicht mehr verlinkt

### ✅ UX-Polish & Konsistenz (2026-06-13) — FERTIG
- **"Erwartetes Datum" als Freitext**: `litters.expected_date` von DATE auf TEXT geändert
  (Migration 20260613010000_expected_date_text), z.B. "Ende Mai 2026" möglich. Im UI nur
  sichtbar bei Status planned/pregnant; bei born/available/sold_out zeigt sich stattdessen
  das Geburtsdatum (Datumsfeld) — beide Felder überlappen sich nie mehr
- **SaveToast-Komponente** (`src/components/SaveToast.tsx`): grünes "✓ Gespeichert"-Popup
  unten, verschwindet nach ~2,5s automatisch. Eingebaut in InseratEditForm, HundEditForm,
  ProfilForm, LitterDashboard (Status + Details) — einheitliches Save-Verhalten:
  Bearbeiten bleibt auf der Seite + Toast, Erstellen führt zum nächsten Schritt
  (Wurf→Wurf-Dashboard, Hund→Bearbeitungsseite mit Foto-Upload, Welpe→Inserat-Bearbeitung)
- **MobileNav / Hamburger-Menü** (`src/components/MobileNav.tsx`): öffentliche Navbar zeigt
  auf Mobile jetzt das volle Hauptmenü (Welpen, Hunde, Zuchtrüden, Züchter, Rassen, Dienste)
  + Login/Dashboard-Links über Hamburger; Dashboard-Header ebenso (Admin/Profil/Zur Website/Abmelden)
- `/welpen` und `/hunde` haben jetzt den gleichen grünen Hero-Balken wie alle anderen
  Verzeichnis-Seiten (vorher direkt Filterleiste ohne Header)
- Homepage "Für Züchter"-CTA und Footer-Spalte "Züchter" sind jetzt session-aware:
  eingeloggte Züchter sehen "Zum Dashboard" / Dashboard-Links statt Registrieren/Einloggen

### ✅ Theme-Editor Phase 1 (2026-06-14) — FERTIG
- Schema-Erweiterung `BreederProfile`: `subdomain` (unique), `themeColor`, `themeAccentColor`
  (Migration 20260613020000_subdomain_theme); `media.purpose` unterscheidet
  header/background/gallery-Bilder bei breederId-Medien
- `/dashboard/theme` — Theme & Branding: Primär-/Akzentfarbe (Farbwähler + Presets + Hex-Eingabe),
  Header- und Hintergrundbild-Upload (`BreederImageUploader`), Subdomain-Reservierung mit
  Live-Verfügbarkeitsprüfung (`/api/profil/check-subdomain`, `src/lib/subdomain.ts`)
- `/zuechter/[slug]` wendet Theme an: Primärfarbe als Hero-Hintergrund (oder Headerbild mit
  Dunkel-Overlay falls gesetzt), Akzentfarbe für Verband-Badge/"Verifiziert"/Deckrüde-Badge,
  Hintergrundbild als fixed Page-Background mit Cream-Overlay
- Subdomain wird nur RESERVIERT (Feld + Eindeutigkeitsprüfung) — die eigentliche
  Subdomain-Weiterleitung (kennelname.whelply.de → Züchterseite) ist **Phase 2** und braucht
  Wildcard-DNS + Wildcard-TLS (DNS-01-Challenge) + Middleware-Rewrite. Noch nicht begonnen.

### ✅ Große Zuchthund-Vorstellung, Aktuelles, Galerie, Bild-Performance (2026-06-14) — FERTIG
- **Dog.description** (Freitext, Migration 20260614010000_dog_description_news_posts): wenn im
  "Zuchthund bearbeiten"-Formular ausgefüllt, erscheint der Hund mit großem Foto + Text in
  eigener "Unsere Zuchthunde"-Sektion (heute Teil von `/zuechter/[slug]/zuchthunde`,
  s.u.), sonst nur in der kleinen Übersicht
- **Aktuelles** (NewsPost-Modell): `/dashboard/news` (Liste), `/dashboard/news/neu`,
  `/dashboard/news/[id]` (Titel, Text, optionales Bild). Öffentlich unter
  `/zuechter/[slug]/aktuelles`. API: `/api/news` (POST), `/api/news/[id]` (PATCH/DELETE)
- **Galerie**: `/dashboard/galerie` — Mehrfach-Upload (Drag&Drop), Grid mit Entfernen-Button,
  nutzt `media.purpose = 'gallery'` (keine neue Tabelle). Öffentlich unter
  `/zuechter/[slug]/galerie` mit Lightbox (s.u.).
  `/api/upload` DELETE akzeptiert jetzt `mediaId` für einzelne Galerie-Bilder
  (zusätzlich zu `purpose` für Header/Hintergrund)
- **Bild-Performance**: `src/lib/image-resize.ts` — alle Uploads (Listings, Zuchthunde,
  Würfe, Theme, News, Galerie) werden im Browser auf max. 1920px verkleinert + als JPEG
  komprimiert (Canvas API, kein neues Backend-Dependency). `/api/media/[...key]/route.ts`
  liefert Bilder jetzt gestreamt (`transformToWebStream()`) statt komplett im RAM zu puffern.

### ✅ Züchterseite als Unterseiten (2026-06-15) — FERTIG
Die Züchterseite war als eine lange Seite mit vielen Abschnitten zu unübersichtlich
(auch eine erste Sprungnav-Variante mit Sidebar/Anchor-Links wurde verworfen). Jetzt:
eigene Routen pro Bereich, alle mit gemeinsamem Hero + Tab-Navigation.
- `src/lib/breeder.ts` — gemeinsame Helper: `getBreederBySlug(slug)` (Profil + Header-/
  Hintergrundbild) und `getBreederTabs(breederId)` (Bool-Flags, welche Tabs Inhalt haben)
- `src/components/BreederPageHeader.tsx` — Hero (Bild/Theme-Farbe, Name, Ort, Verband-/
  Verifiziert-Badge) + horizontale Tab-Leiste (sticky unter der Navbar). Tabs: Profil,
  Welpen (immer), Zuchthunde, Würfe & Planung, Erwachsene Hunde, Aktuelles, Galerie
  (letztere 4 nur wenn `getBreederTabs` true liefert)
- `/zuechter/[slug]` — jetzt nur noch "Profil": Bio + Kontakt
- `/zuechter/[slug]/welpen` — Welpen-Inserate (Grid)
- `/zuechter/[slug]/zuchthunde` — große Einzelvorstellung (Dog.description) + Zuchtrüden-Grid
- `/zuechter/[slug]/wuerfe` — Würfe & Planung (alle, nicht mehr auf 10 begrenzt)
- `/zuechter/[slug]/hunde` — Erwachsene Hunde zur Abgabe (Grid)
- `/zuechter/[slug]/aktuelles`, `/zuechter/[slug]/galerie` — nutzen jetzt ebenfalls
  `BreederPageHeader`/`getBreederTabs` statt eigenem Mini-Header
- Alle Subseiten: `export const dynamic = 'force-dynamic'`

### ✅ Galerie-Lightbox (2026-06-15) — FERTIG
- Klick auf ein Galerie-Foto öffnet es groß in einem Overlay — reines CSS (`:target`-
  Pseudoklasse), kein JavaScript. Jedes Bild verlinkt auf `#foto-<id>`, das Ziel-Div ist
  per `hidden target:flex` ein-/ausblendbar.

### ✅ Titelbild-Bug behoben (2026-06-15) — FERTIG
- Bug: Wenn beim Inserat ein zweites Bild hochgeladen und danach das erste (Titelbild,
  `isPrimary`) gelöscht wurde, blieb das Inserat ohne Titelbild.
- Fix in `/api/media-item/[id]/route.ts` (DELETE): War das gelöschte Bild `isPrimary`,
  wird automatisch das verbleibende Bild mit der niedrigsten `sortOrder` zum neuen
  Titelbild. `ImageUploader.tsx` spiegelt das sofort im UI (kein Reload nötig).

### ❌ Fehlt noch (priorisiert)
- **GROSS — Subdomain-Routing Phase 2 (später):**
  - Wildcard-DNS (`*.whelply.de`) + Wildcard-TLS-Zertifikat (DNS-01-Challenge, braucht
    DNS-Provider-API-Zugriff in Coolify/Traefik — größter Aufwand)
  - Middleware-Rewrite: `<subdomain>.whelply.de` → `/zuechter/<subdomain>` (oder eigene Route)
  - Subdomain-Feld + Eindeutigkeitsprüfung existiert bereits (Phase 1)
- **GROSS — Google Maps auf Züchter-Seite (Punkt 7, später):**
  - Braucht Google Cloud API-Key mit Billing
  - Zeigt ungefähren Standort (Stadt-Ebene wegen Datenschutz, nicht exakte Adresse)
- `/dashboard/boost/[id]` — 1€ Boost buchen (Stripe Payment Intent)
- `/dashboard/upgrade` — Plan-Upgrade Seite
- `/impressum`, `/datenschutz`, `/agb` — Pflichtseiten
- Dienstleister-Onboarding (Registrierung als Service Provider)

### ✅ Bildupload — FERTIG
- Garage (S3-kompatibel, self-hosted via Coolify Docker Compose) als Objektspeicher
- Bucket: `whelply-media`, Access Key: `whelply-app-key`
- Architektur: Browser → `/api/upload` (whelply.de) → Server → Garage intern
  - Kein presigned-URL-Ansatz (TLS-Zertifikatsprobleme mit sslip.io-Domains)
  - Bilder werden server-seitig durchgeleitet (`/api/media/[...key]/view`), gestreamt
    statt komplett im RAM gepuffert (`transformToWebStream()`)
  - Vor dem Upload: Client-seitige Verkleinerung/Komprimierung auf max. 1920px / JPEG q=0.85
    via `src/lib/image-resize.ts` (Canvas API) — deutlich schnellere Ladezeiten,
    kein neues Backend-Dependency
- WICHTIG: Garage-Container braucht "Connect to Predefined Network" aktiviert in Coolify,
  damit der Whelply-App-Container ihn per Hostname `garage-<uuid>` erreichen kann
- ENV: MINIO_ENDPOINT (intern, z.B. http://garage-e10kdpxmer89o80eoxk3it6q:3900),
  MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET=whelply-media

### ✅ Admin-System — FERTIG
- UserRole.admin existiert im Schema. Ersten Admin setzen via:
  `psql -U whelply -d whelply -c "UPDATE users SET role = 'admin' WHERE email = '...';"`
- `/admin`: Stats (Nutzer, Züchter, Inserate, Aufrufe), Tab "Züchter" (Karteileichen rot markiert,
  Verifizierung togglen, Konto löschen mit Cascade), Tab "Inserate" (löschen, Aufrufe ansehen)
- VerificationLevel-Enum-Werte: none / email_verified / kennel_verified / doc_verified
  (NICHT "verband"/"fci" — das war ein Bug, jetzt gefixt)

### ✅ View-Tracking — FERTIG
- `listings.view_count` (Int, default 0), wird bei jedem Aufruf von /welpen/[id] erhöht
  (außer für den Eigentümer selbst)
- Sichtbar im Züchter-Dashboard (Gesamtsumme + pro Inserat) und im Admin-Bereich

### ✅ Private Kontaktdaten optional öffentlich — FERTIG
- breeder_profiles.show_phone / show_address (Boolean, default false)
- Im Profil-Formular als Checkboxen, steuern Anzeige auf /zuechter/[slug]
- city/state sind IMMER öffentlich sichtbar (für Standort-Filter), street/zip/phone nur wenn freigegeben

## Offene Tasks
- [ ] Task 7 Rest: Fehlende Seiten (siehe Liste oben)
- [ ] Task 8: Boost-Zahlung (Stripe Payment Intent für 1€)
- [ ] Task 9: KI-Features (Rassen-Finder, Textgenerator)
- [ ] Task 10: SEO + Bildupload (MinIO einrichten)
- [ ] Task 11: Pflichtseiten (Impressum, Datenschutz, AGB)

## Wichtige Entscheidungen
- Projektname: **Whelply** — Domain whelply.de
- Keine Mischlinge, kein Tierschutz — FCI-Rassenliste
- Stripe für Zahlungen, MinIO für Bilder, Resend für E-Mail
- Vorschaltseite aktiv (PREVIEW_PASSWORD in Coolify)
- Middleware: alwaysAllowed = ['/api/auth', '/api/preview-login', '/api/inserate', '/api/wuerfe', '/api/upload', '/api/media', '/api/media-item', '/api/profil', '/api/hunde', '/api/news', '/api/admin', '/admin', '/preview', '/_next', '/favicon.ico']
  → Jede neue API-Route (und neue Top-Level-Seiten wie /admin, die eigene Auth-Logik haben) muss hier eingetragen werden!
