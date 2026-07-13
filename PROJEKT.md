# Whelply.de — Projektgedächtnis
<!-- Diese Datei am Anfang jeder neuen Claude-Konversation einfügen -->
<!-- Letzte Aktualisierung: 2026-07-13 -->

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
NEXT_PUBLIC_BASE_DOMAIN=whelply.de
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
- Migrations-Reihenfolge (Stand 2026-06-23, alle müssen applied sein):
  - `20260614010000_initial` (oder ähnlich — erster Batch)
  - `20260615010000_litter_name_health_tests`
  - `20260615020000_dog_health_info_text`
  - `20260615030000_litter_handover_date`
  - `20260615040000_theme_and_listing_fields`
  - `20260623010000_dog_parent_links`
  - `20260623020000_social_links`
  Nach jedem psql-Batch: `npx prisma migrate resolve --applied <migration_name>`

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
  Zuchthunde, Würfe & Planung, Erwachsene Hunde, Aktuelles, Galerie
  (letztere 4 nur wenn `getBreederTabs` true liefert; Profil immer)
- `/zuechter/[slug]` — nur noch "Profil": Bio (rich text, s.u.) + Kontakt
- `/zuechter/[slug]/zuchthunde` — große Einzelvorstellung (Dog.description) + Zuchtrüden-Grid
- `/zuechter/[slug]/wuerfe` — Würfe & Planung (s.u., jetzt inkl. Welpen-Übersicht)
- `/zuechter/[slug]/hunde` — Erwachsene Hunde zur Abgabe (Grid)
- `/zuechter/[slug]/aktuelles`, `/zuechter/[slug]/galerie` — nutzen ebenfalls
  `BreederPageHeader`/`getBreederTabs` statt eigenem Mini-Header
- Alle Subseiten: `export const dynamic = 'force-dynamic'`
- Eigene `/zuechter/[slug]/welpen`-Unterseite wieder ENTFERNT (Punkt 6, 2026-06-15,
  s.u.) — Welpen werden jetzt direkt bei ihrem Wurf unter "Würfe & Planung" gezeigt.

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

### ✅ Wurfname, Wurf-Detailseite, Gesundheitstests, Rich-Text-Bio (2026-06-15) — FERTIG
Migration `20260615010000_litter_name_health_tests`: `litters.name` (optionaler
Wurfname) + neue Tabelle `dog_health_tests` (id, dog_id, name, result, test_date,
sort_order).
- **Wurfname**: `LitterDashboard.tsx` → "Wurf-Details" hat neues Feld "Wurfname"
  (optional). Wird überall angezeigt, wo bisher nur die Rasse stand — Rasse bleibt
  als Zusatzinfo sichtbar, wenn ein Name gesetzt ist.
- **Würfe & Planung als zentrale Welpen-Übersicht (Punkt 6)**: `/zuechter/[slug]/wuerfe`
  zeigt jetzt pro Wurf: Foto, Name/Rasse, Status, bei `available` die Anzahl
  verfügbarer Rüden/Hündinnen (aus `listing.sex`), sowie Vater/Mutter. Jede Zeile ist
  klickbar → `/zuechter/[slug]/wuerfe/[litterId]` (NEU): Wurf-Detailseite mit
  Eltern-Karten (verlinkt zu `/hund/[id]`, externer Deckrüde als Text) und Grid aller
  Welpen-Inserate dieses Wurfs. Dadurch wurde die eigene `/welpen`-Unterseite überflüssig
  und entfernt.
- **Gesundheitstests pro Zuchthund**: ~~eigenes `DogHealthTest`-Modell mit
  Einzeleinträgen~~ — noch am selben Tag durch Freitext ersetzt (s. nächster
  Abschnitt), da Züchter oft sehr viele Tests dokumentieren.
- **Rich-Text "Über uns"**: `src/lib/richtext.tsx` — abhängigkeitsfreier Renderer für
  `**fett**` / `*kursiv*` + Zeilenumbrüche. `ProfilForm.tsx` hat B/I-Buttons über dem
  Bio-Feld (umschließen die Textauswahl mit `**`/`*`). `/zuechter/[slug]` rendert
  `renderRichText(breeder.bio)` statt Plain-Text.

### ✅ Iteration 2 (2026-06-15) — FERTIG
Migration `20260615020000_dog_health_info_text`: `dogs.health_info TEXT` (Freitext)
hinzugefügt, Tabelle `dog_health_tests` wieder gedroppt (Einzeleinträge waren zu
umständlich für Züchter mit vielen Tests).
- **Gesundheitstests als Freitext**: `Dog.healthInfo String? @db.Text`. Neues Feld
  "Gesundheitstests / Untersuchungen" in `HundEditForm.tsx` (Teil des normalen
  Speichervorgangs, kein separates API mehr). Anzeige als Fließtext auf `/hund/[id]`
  und unterhalb des Vorstellungstexts in der großen Zuchthund-Vorstellung
  (`/zuechter/[slug]/zuchthunde`).
- **Vorstellungstext auch auf Hund-Detailseite**: `/hund/[id]` zeigt jetzt zusätzlich
  einen "Über {Name}"-Abschnitt mit `dog.description` (vorher nur in der
  Zuchthunde-Übersicht der Züchterseite sichtbar).
- **Dashboard-Reorg**: "Profil bearbeiten" aus der Kopfzeile entfernt, jetzt erster
  Button in der "Meine Züchterseite"-Karte.
- **Tab-Reihenfolge** (`BreederPageHeader.tsx`): Profil – Würfe & Planung – Hunde zu
  vergeben – Zuchthunde – Aktuelles – Galerie. "Erwachsene Hunde" → "Hunde zu vergeben"
  umbenannt (Tab + Seitentitel `/zuechter/[slug]/hunde`); Alternativen wie "Hunde in
  neue Hände" wären auch möglich, falls gewünscht.
- **Tab-Leiste in Theme-Farbe**: aktiver Tab nutzt `themeAccentColor` (Fallback
  `themeColor`, sonst `forest`) für Unterstrich + Textfarbe.
- **Wurf-Detailseite** (`/zuechter/[slug]/wuerfe/[litterId]`): "Die Eltern"-Sektion
  jetzt UNTER der Welpen-Übersicht. Geburtsdatum prominent im Kopfbereich (langes
  Format "26. März 2026" + Status-Badge statt Fließtext "Geboren am..."). Welpen-Karten
  sind nach Geschlecht eingefärbt (`ListingCard` neuer `tint`-Prop: `male` = blau,
  `female` = rosa, `sold` = grau/abgedunkelt) inkl. kleiner Legende.
- **Würfe-Übersicht** (`/zuechter/[slug]/wuerfe`): größere Fotos/Schrift, bei
  geborenen Würfen Geburtsdatum (langes Format) + Gesamtzahl Rüden/Hündinnen,
  zusätzlich bei `available` die Anzahl noch verfügbarer Rüden/Hündinnen. Vater/Mutter
  als klickbare Badges (→ `/hund/[id]`, externer Deckrüde als reiner Text) unterhalb
  der Karte (separat verlinkt, um verschachtelte `<a>`-Tags zu vermeiden).

### ✅ Iteration 3 (2026-06-15) — FERTIG
Migration `20260615030000_litter_handover_date`: `litters.handover_date DATE`.
- **Reservierte/verkaufte Inserate bleiben öffentlich sichtbar**: `/welpen/[id]`
  blockiert für Nicht-Eigentümer jetzt nur noch `status === 'draft'` (vorher auch
  `reserved`/`sold`). Sichtbarer Status-Badge ("Reserviert"/"Verkauft") für Besucher.
  Spätere Aufgabe: zeitliche Begrenzung (~180 Tage) evaluieren.
- **Mobile "Meine Inserate"**: Tabelle (`hidden md:block`) bleibt für Desktop, neue
  Karten-Ansicht (`md:hidden`) zeigt Titel/Rasse, Status, Preis/Aufrufe/Boost und einen
  vollbreiten "Bearbeiten"-Button — vorher fiel der Button auf Mobilgeräten aus dem
  sichtbaren Bereich.
- **Welpenkarten-Einfärbung intensiver**: `ListingCard` `tint`-Prop jetzt
  `border-blue-300 bg-blue-100` (Rüde) / `border-pink-300 bg-pink-100` (Hündin) statt
  der vorherigen sehr dezenten `/60`-Opacity-Variante.
- **Würfe-Übersicht nochmal größer**: Bild `w-28 h-28`, Titel `text-xl`, Status-Badge
  und Eltern-Badges `text-sm`.
- **Abgabedatum statt "Anzahl Welpen (geplant)"**: `Litter.handoverDate`. In
  "Wurf-Details" (`LitterDashboard.tsx`) wird "Anzahl Welpen (geplant)" nur noch bei
  Status `planned`/`pregnant` angezeigt; bei `born`/`available`/`sold_out` erscheint
  stattdessen "Abgabedatum". Anzeige: `/welpen/[id]` ("Abgabebereit ab"),
  `/zuechter/[slug]/wuerfe` (in der "Verfügbar"-Zeile) und
  `/zuechter/[slug]/wuerfe/[litterId]` (im Kopfbereich).
- **Hintergrundbild prominenter + Lesbarkeit**: Overlay in `BreederPageHeader.tsx`
  von `bg-cream/85` auf `bg-cream/45` reduziert (Bild deutlich sichtbarer). Neue
  `src/components/BreederPageContent.tsx` — `bg-white/80 backdrop-blur-sm`-Panel,
  das den Seiteninhalt umschließt und so trotz sichtbarem Hintergrundbild lesbar
  bleibt. Auf allen 7 Unterseiten der Züchterseite eingebunden.

### ✅ Theme-Erweiterung + neue Navbar/Footer + Social Media (2026-06-15) — FERTIG
Migration `20260615040000_theme_and_listing_fields`: neue Theme-Felder in
`breeder_profiles` (`theme_bg_color`, `theme_nav_color`, `theme_font`, `theme_align`),
neue Welpen-Zusatzfelder in `listings` (`has_pedigree`, `is_vaccinated`, `is_dewormed`,
`is_chipped`, `is_insured`, `birth_location`, `chip_number`).
- **Slim-Navbar** `src/components/BreederNavbar.tsx` für alle Züchterseiten: nur
  "Whelply" links (→ `/`) + Dashboard-Link rechts, `h-10`, halbtransparent.
  Alle 7 Unterseiten nutzen `BreederNavbar` statt `Navbar`.
- **Header-Redesign** (`BreederPageHeader.tsx`): kein separates Headerbild mehr —
  nur noch das Hintergrundbild. Züchtername sehr groß (`text-5xl/6xl`), Google Font
  wählbar, Links/Mitte/Rechts-Ausrichtung, Rasse unter Name (aus `dogs[].breed`),
  Verband/Verifiziert nur noch kleine Badges. Tab-Nav nutzt `themeColor` als
  Hintergrund (weiße Tabs, Akzentfarbe für aktiven Tab-Unterstrich).
- **Theme-Dashboard** (`ThemeEditor.tsx`): 4 neue Sektionen — Schriftart (10 Google-
  Font-Optionen + Freitext + Live-Vorschau), Ausrichtung (Links/Mitte/Rechts),
  Hintergrundfarbe der Inhalts-Panels, Tab-Navigationsfarbe. `BreederPageContent`
  nimmt `bgColor` prop und rendert es als halbtransparentes Panel.
- **Social Media**: `socialInstagram`, `socialFacebook`, `socialTiktok`,
  `socialYoutube` in `breeder_profiles`. In "Profil bearbeiten" als URL-Felder.
- **Züchter-Footer** `src/components/BreederFooter.tsx`: Primärfarbe als Hintergrund,
  Social-Icons (Instagram, Facebook, TikTok, YouTube) mit SVG-Logos, Navigationslinks,
  Copyright. Auf allen 7 Unterseiten aktiv.
- **Welpen-Zusatzfelder** in `InseratEditForm.tsx`: Checkboxen für
  Ahnentafel/Geimpft/Entwurmt/Gechipt/Versichert, Geburtsort, Chipnummer — werden
  auf `/welpen/[id]` als grüne Badges + Detailzeilen angezeigt.
- **`/api/middleware.ts`**: `/api/hunde` muss in `alwaysAllowed` stehen (bereits drin).

### ✅ Stammbaum + Elterntier-Verknüpfung (2026-06-23) — FERTIG
Migration `20260623010000_dog_parent_links`: `dogs.parent_sire_id` + `dogs.parent_dam_id`
(self-referential FK mit `ON DELETE SET NULL`). Ersetzt die fehlerhafte
Wurf-Approximation (Hund erschien als sein eigener Vorfahre).
Migration `20260623020000_social_links`: `social_instagram/facebook/tiktok/youtube`
(falls noch nicht aus vorheriger Migration vorhanden — mit `IF NOT EXISTS` sicher).
- **"Elterntiere"-Sektion** in `HundEditForm.tsx`: Dropdown-Auswahl für Vater/Mutter
  aus allen auf Whelply eingetragenen Hunden (nach Geschlecht gefiltert, eigener Hund
  ausgeschlossen). `allDogs`-Prop vom Dashboard-Page übergeben.
- **Mini-Stammbaum** auf `/welpen/[id]`: Eltern (rosa/blau) + Großeltern darunter —
  jetzt immer alle 4 Großeltern-Slots sichtbar (leere = grauer Platzhalter).
  Zeigt Stammbaum nur wenn Litter `dam` oder `sire` hat.
- **Vollständiger Stammbaum** `/welpen/[id]/stammbaum`: 4 Generationen (Welpe →
  Eltern → Großeltern → Urgroßeltern) als verschachteltes Grid. Immer alle Felder
  angezeigt; leere Positionen grau mit "—". `parentSire`/`parentDam`-Relationen
  3 Ebenen tief abgefragt. Link vom Inserat direkt dorthin.
- **Bekannte Einschränkung**: Urgroßeltern-Ebene nur sichtbar wenn `parentSire` des
  Elternteils selbst `parentSire`/`parentDam` in Prisma includet hat — TypeScript-
  Casting mit `as any` für die 3. Ebene nötig (Prisma-Include-Tiefengrenze).

### Workflow-Hinweis (ergänzt 2026-06-23)
- Neue Komponenten (`BreederNavbar`, `BreederFooter`) wurden als "neue Dateien" in
  `src/components/` angelegt — müssen beim ersten Mal manuell in den Repo-Ordner
  kopiert werden, GitHub Desktop erkennt sie dann als neue Dateien.
- **PFLICHT: Nach jeder Dateiänderung IMMER die vollständigen Zielpfade aller geänderten
  Dateien in einer Tabelle angeben.** Keine Ausnahmen, auch nicht bei kleinen Fixes.
  Format: `| Dateiname | src/pfad/zur/datei/ |`
- Wenn GitHub Desktop keine Änderung an einer Datei erkennt, obwohl der Inhalt
  sich geändert hat: Datei im Texteditor öffnen, gesamten Inhalt ersetzen, speichern.
  Drag-&-Drop-Kopieren reicht manchmal nicht (Timestamp-Problem).

---

### ✅ Großes UI-Overhaul (2026-06-24 bis 2026-06-27) — FERTIG

#### Züchterseiten-Architektur
- **Tab-Nav** (`BreederTabNav.tsx`, Client): schmaler Balken im Normalzustand,
  bei Sticky auf volle Breite (IntersectionObserver). Nutzt `themeColor` als Hintergrund.
- **Kontakt-Sidebar** (`BreederContactSidebar.tsx`): sticky rechts neben Inhalt auf allen
  7 Unterseiten (nur `lg:`). Zeigt Zwingername, Anzeigename, Straße/PLZ/Ort (wenn freigegeben),
  Telefon, Website, Social-Icons, Verband/Verifiziert-Badge, "Kontakt aufnehmen"-Button.
  Props: `kennelName`, `displayName`, `street`, `zip`, `showAddress`, `phone`, `showPhone`,
  `website`, `social*`, `themeColor`, `themeAccentColor`, `verband`, `verificationLevel`.
- **BreederPageContent** unterstützt `sidebar` prop — rendert 2-Spalten-Layout auf Desktop.
- **Verband/Verifiziert** aus dem Header entfernt → nur noch in der Kontakt-Sidebar.
- **Header**: Rassenname jetzt `font-bold`, kein separater Header-Block mehr.
- `getBreederTabs` zählt jetzt `isStud=true` für beide Geschlechter.

#### Galerie-Lightbox
- `GalleryLightbox.tsx` nutzt `createPortal` → rendert in `document.body`,
  umgeht Stacking-Context-Probleme mit Sidebar. `z-[9999]`, sperrt Scroll.
- Keyboard-Navigation (←/→/Esc), Pfeile, Zähler.

#### Rich-Text-Bio + Bild-Upload
- `RichEditor.tsx`: Toolbar (B/I/Bild-URL/Bild-Upload/YouTube), stabiler Textarea.
  Hochgeladene Bilder erscheinen als Thumbnail-Chips unter dem Textarea (Dateiname
  sichtbar, kein langer API-Pfad). `×`-Button entfernt Bild aus dem Markdown.
- `src/lib/richtext.tsx`: rendert `**bold**`, `*italic*`, `![alt](url)` als Bild
  mit Bildunterschrift, `@youtube[id]` als responsive 16:9-Embed.
- Upload-Route (`/api/upload`) erlaubt jetzt `purpose=bio` — gibt nur URL zurück,
  kein DB-Eintrag. Bild landet in `breeders/<id>/bio-<timestamp>-<random>.<ext>`.

#### Zuchthunde-Seite (`/zuechter/[slug]/zuchthunde`)
- Neue Reihenfolge: **Zuchthündinnen** → **Zuchtrüden** → **In Zuchtrente**.
- Zuchtrente: Hunde mit `isStud=false` aber vorhandenem `description`-Text.
- Layout: große horizontale Karten (Bild links, Text rechts) für alle Sektionen.
- `isStud`-Checkbox für beide Geschlechter in `HundEditForm.tsx`.
- Elterntier-Auswahl (`ParentSearch`): Dropdown mit Echtzeitsuche, nur `isStud=true`-Hunde
  als Optionen (keine Welpen mehr auswählbar als Eltern).

#### Welpen/Würfe
- Welpenkarten in Wurfdetail: horizontales Layout wie Zuchthunde-Karten.
- Geschwister auf `/welpen/[id]`: farbcodiert (blau=Rüde, rosa=Hündin),
  auf Mobile horizontal scrollbar (`flex overflow-x-auto`, `w-40 flex-shrink-0`).
- "Würfe als Vater/Mutter" auf Hundeprofil: Link geht jetzt zur Wurfseite
  (`/zuechter/[slug]/wuerfe/[litterId]`), nicht mehr zum ersten Welpen.
- Wurfname in Elterntier-Auswahl und Dashboard immer prominent angezeigt.

#### Startseite
- Neue Sektionen nach "Aktuelle Welpen": **Züchter entdecken** (dunkler `bg-forest`-Hintergrund,
  Karten mit Hintergrundbild aus `media WHERE purpose='background'`) und
  **Hunde zu vergeben** (weiß, ListingCards für `type='adult_dog'`).
- Züchter-Karten: `flex flex-col` → weißer Inhalt immer bis unten bündig.
- Slug wird via `slugify(kennelName)` berechnet (kein DB-Feld `zuechterSlug`).

#### Layout-Vereinheitlichung
- Alle Listing-Seiten: `max-w-6xl`, `bg-cream` Hintergrund, `bg-forest` Header,
  Filterleiste mit `border-b border-stone-200 bg-stone-50`.
- Navbar: "Hunde" → "Unsere Hunde".
- Aktuelles-Seite: Jahresfilter mit `?jahr=` searchParam, `Array.from(new Set(...))`.

#### Upload-Limits
- Max. Dateigröße: 25MB in allen Uploadern und der API-Route.
- `next.config.js`: `experimental.serverActions.bodySizeLimit: '30mb'`.
- API-Route hat kein deprecated `export const config` mehr (App Router).

#### Kleinere Fixes
- Einzahl/Mehrzahl: "1 Rüde" / "1 Hündin" korrekt (nicht "1 Rüden").
- Farbcodierung (blau=Rüde, rosa=Hündin) auf allen ListingCard-Seiten (Startseite,
  `/welpen`, `/hunde`, `/rassen/[slug]`), inkl. Geschlechtsfilter auf `/welpen`.
- `zuchtrueden/page.tsx`: filtert jetzt `isStud: true` (vorher nur `sex: 'male'`).
- Jahresfilter Aktuelles: `Array.from(new Set(...))` statt `[...new Set()]`
  (TypeScript downlevel-Iterator-Kompatibilität).
- Dashboard "Meine Zuchthunde": zeigt nur `isStud=true`-Hunde.
- Galerie: Thumbnail-Grid, Lightbox via Portal.
- ThemeEditor: alle 4 Farben in einem Block, Schriftart mit Google-Fonts-Link,
  Header-Bild-Option entfernt (nur noch Hintergrundbild), Reihenfolge:
  Tab-Nav → Hintergrundfarbe → Ausrichtung → Schriftart.

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

---

### ✅ Session 2026-06-27 bis 2026-06-30 — FERTIG

#### Neue DB-Felder (Migrations erforderlich)
- `breeder_profiles.full_name` (TEXT, nullable) — echter Vor-/Nachname
- `breeder_profiles.show_full_name` (BOOLEAN, default false) — Anzeige auf Züchterseite
- `breeder_profiles.is_published` (BOOLEAN, default true) — Züchterseite ein-/ausschaltbar
- Migration: `20260627010000_full_name`, `20260627020000_is_published`
- DB-Befehle:
  ```sql
  ALTER TABLE breeder_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
  ALTER TABLE breeder_profiles ADD COLUMN IF NOT EXISTS show_full_name BOOLEAN NOT NULL DEFAULT FALSE;
  ALTER TABLE breeder_profiles ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;
  ```

#### Inserate-Limit
- Free-Plan Limit: 3 → **15** Inserate
- Geändert in: `api/inserate/route.ts`, `dashboard/inserat-erstellen/page.tsx`, `dashboard/page.tsx`

#### Welpen-Detailseite `/welpen/[id]` — komplett überarbeitet
- Neues Layout: Hero-Galerie oben (volle Breite, max 520px hoch), darunter 3-Spalten-Info-Grid
  (Eckdaten / Gesundheit & Dokumente / Züchter+Kontakt), dann Beschreibung (volle Breite), dann Stammbaum
- Galerie: Thumbnails, Prev/Next-Pfeile, Zoom-Icon, Lightbox per `createPortal` (klickbar, ESC, Pfeile)
- `ListingImageGallery.tsx` komplett neu

#### Wurfdetail Welpenkarten
- Layout: `h-52` fixe Höhe auf Desktop, Bild `w-52` (breit), alle Karten identisch hoch
- Mobile: `flex-col` (Bild oben h-48, Text darunter), Desktop `sm:flex-row`
- Gesundheits-Badges: einheitlich weiß mit `border border-stone-300`

#### BreederContactSidebar — neu
- Übersichtlicher, mehr Luft, klare Hierarchie
- Anzeigename, optional echter Name (wenn `showFullName=true`)
- Verband + Verifiziert-Badge
- Adresse, Telefon, Website, Social-Pill-Links
- Einheitlich auf allen 7 Züchter-Unterseiten

#### ProfilForm — Erweiterungen
- "Vor-/Nachname" + Checkbox "auf Züchterseite anzeigen" → jetzt in "Private Kontaktdaten"
- Toggle-Switch oben rechts: Züchterseite ein-/ausschalten (`isPublished`)
- Alle Züchter-Subpages gaten auf `isPublished === false` → `notFound()`

#### RichEditor — finale stabile Version
- Bilder werden als `[📷 dateiname.jpg]` Platzhalter im Textarea gezeigt (kein URL-Pfad)
- `toDisplay()` / `fromDisplay()` konvertieren sauber hin und zurück
- Bild wird an Cursorposition eingefügt (nicht ans Ende)
- Chips unter Textarea mit Thumbnail + Dateiname + ×-Button
- `renderRichText`: Dateinamen als Alt-Text werden NICHT als Bildunterschrift angezeigt

#### Startseite
- Neue Sektion "Züchter entdecken" (dunkelgrüner Hintergrund)
- Runde Badges (französischer Stil) an Bild/Text-Grenze: "Welpen Dispo" (Honig) / "Wurf Erwartet" (Blau)
- "Hunde zu vergeben" Sektion mit ListingCards
- Breiter-Karten: `aspect-[3/2]`, max 3 Spalten statt 4

#### Upload-Indikator
- `ImageUploader`: Spinner + "Wird hochgeladen… / Bitte warten" während Upload, Klick gesperrt
- `DogImageUploader`, `BreederImageUploader`, `LitterImageUploader`, `GalleryManager`:
  Inline-Spinner im Button + `disabled={uploading}`

#### Preis-Eingabe
- `step="50"` → `step="1"` in `InseratForm`, `WelpeForm`, `InseratEditForm` — jede ganze Zahl erlaubt

#### Zuchthunde-Seite
- Reihenfolge: Zuchthündinnen → Zuchtrüden → In Zuchtrente
- Große horizontale Karten (Bild links, Text rechts)
- `mt-12` Abstände zwischen den Sektionen

#### HundEditForm
- Nach erfolgreichem Speichern: Buttons "+ Weiteren Hund eintragen" und "Profil ansehen →"

#### Aktuelles-Seite
- Jahresfilter mit `Array.from(new Set(...))` (TS-kompatibel)
- Filter-Buttons für jedes Jahr in dem Posts existieren

#### Diverses
- Navbar: "Hunde" → "Erwachsene Hunde"
- Züchter-Tab-Nav: "Zuchthunde" → "Unsere Hunde"
- Zuchtrüden-Seite filtert jetzt `isStud: true` (nicht nur `sex: male`)
- Dashboard "Meine Zuchthunde" zeigt nur `isStud: true`
- Elterntier-Auswahl: nur `isStud: true` Hunde (keine Welpen)
- Geschwister auf `/welpen/[id]`: farbcodiert, auf Mobile horizontal scrollbar
- Wurflink auf Hundeprofil → Wurfseite (nicht erster Welpe)
- `ListingFilter.tsx` (neu): onChange-Client-Komponente ohne Submit-Button
- `renderRichText`: `<p>` durch `<div>` ersetzt (kein ungültiges `<div>` in `<p>`)

---

### ✅ Weitere Änderungen (2026-07-01) — FERTIG

#### Migrationen (müssen in dieser Reihenfolge applied werden)
- `20260627010000_full_name` — `full_name TEXT`, `show_full_name BOOLEAN DEFAULT FALSE`
- `20260627020000_is_published` — `is_published BOOLEAN DEFAULT TRUE`
- `20260701010000_is_active` — `is_active BOOLEAN DEFAULT TRUE`

#### BreederProfile — neue Felder
- `fullName` / `showFullName` — optionaler echter Name, auf Wunsch öffentlich sichtbar
- `isPublished` — Züchterseite ein-/ausschaltbar (alle 7 Unterseiten → `notFound()`)
- `isActive` — "Profil inaktiv" Status (Karte im Verzeichnis nicht klickbar, amber Badge)

#### Welpen-Detailseite — neues Layout
- Galerie oben groß (volle Breite, max 520px), klickbar mit Lightbox (`createPortal`)
- Thumbnails darunter scrollbar
- 3 Info-Kacheln: Eckdaten / Gesundheit & Dokumente / Züchter+Kontakt
- Beschreibung als volle Breite-Box darunter
- "Züchter-Profil ansehen" nur wenn `isPublished !== false`

#### Wurfdetail-Welpenkarten
- Feste Höhe `h-52`, Bild `w-52 object-cover` (alle Karten gleich hoch)
- Auf Mobile: Bild oben voll (`h-48`), Text darunter; ab `sm:`: horizontal `h-52`
- Gesundheits-Badges (Ahnentafel/Geimpft/Entwurmt/Gechipt) — einheitlich weiß mit Border

#### Züchter-Verzeichnis (`/zuechter`)
- Karten zeigen: Vor-/Nachname (wenn freigegeben), Ort, Rassen, Status-Badges
- "Welpen verfügbar" (Honey) / "Wurf erwartet/geplant" (Blau) als Status-Badges
- "Profil inaktiv" (Amber) / "Seite deaktiviert" (Grau) als Warn-Badges
- Karte nicht klickbar wenn `isActive=false` oder `isPublished=false`
- Litter-Status in Query (planned/pregnant) für Badge

#### ProfilForm — neue Toggles (im Abschnitt "Öffentliches Profil")
- "Seite sichtbar/versteckt" Toggle (isPublished)
- "Profil aktiv/inaktiv" Toggle (isActive, Amber wenn inaktiv)
- Vor-/Nachname + Checkbox "Namen anzeigen" → in "Private Kontaktdaten" verschoben

#### RichEditor + News
- `NewsPostForm` nutzt jetzt `RichEditor` (Bild-Upload, Formatierung, YouTube)
- News-Content auf Aktuelles-Seite wird mit `renderRichText` gerendert
- Emoji-Picker in Toolbar (32 Emojis als Dropdown)
- Bild an Cursorposition eingefügt (nicht ans Ende)
- Dateiname wird NICHT als Bildunterschrift angezeigt (nur echte Alt-Texte)

#### Inserate-Limit
- Free-Plan: 3 → **15** aktive Inserate (in API-Route, Dashboard-Anzeige und inserat-erstellen)

#### Upload-Indikator
- Alle Uploader: Spinner + gesperrter Button während Upload

#### Preis
- `step="1"` in allen Formularen — jede ganze Zahl erlaubt

#### Welpen-Übersicht (`/welpen`)
- Zeigt auch reservierte und verkaufte Welpen (`status: { in: [...] }`)

#### Deckrüden-Detail (`/hund/[id]`)
- "Züchter-Profil ansehen" und Badge zeigen korrektes Geschlecht ("Zuchthündin" / "Deckrüde verfügbar")
- Link nur wenn `isPublished !== false`

#### HundEditForm
- Nach Speichern: Buttons "+ Weiteren Hund eintragen" + "Profil ansehen →"



## Wichtige Entscheidungen
- Projektname: **Whelply** — Domain whelply.de
- Keine Mischlinge, kein Tierschutz — FCI-Rassenliste
- Stripe für Zahlungen, MinIO für Bilder, Resend für E-Mail
- Vorschaltseite aktiv (PREVIEW_PASSWORD in Coolify)
- Middleware: alwaysAllowed — siehe "Middleware alwaysAllowed (vollständig)" weiter unten für aktuelle Liste
  → Jede neue API-Route (und neue Top-Level-Seiten wie /admin, die eigene Auth-Logik haben) muss hier eingetragen werden!

---

### ✅ Weitere Änderungen (2026-07-02) — FERTIG

#### Migrationen
- `20260702010000_reviews_reports_bookmarks` — neue Tabellen `reviews`, `reports`, `bookmarks` + neue Felder auf `breeder_profiles` (`handover_location`, `visit_possible`, `dam_visit_possible`)

#### Neue Schema-Modelle
- `Review` — Nutzer bewertet Züchter (1-5 Sterne, Titel, Text; unique pro User+Züchter)
- `Report` — Nutzer meldet Inserat (Grund + optionaler Kommentar)
- `Bookmark` — Nutzer merkt sich Listing, Litter oder BreederProfile (toggle)

#### Neue API-Routen (alle in `middleware.ts` unter `alwaysAllowed`)
- `POST /api/auth/register` — jetzt mit `role` (buyer/breeder/service); `kennelName` nur für Züchter pflicht; `kennelName` Zod-Validierung per `.refine()` nur für `role=breeder`
- `POST /api/upgrade-to-breeder` — Konto zu Züchter upgraden (nicht rückgängig machbar)
- `GET/POST /api/bookmarks` — Merkliste abrufen / togglen
- `POST /api/reports` — Inserat melden
- `GET/POST /api/reviews` — Bewertungen abrufen / erstellen (upsert)

#### Neue Seiten
- `/dashboard/upgrade` — Formular zum Upgrade auf Züchter-Konto
- `/dashboard/merkliste` — Übersicht aller Bookmarks (Listings, Würfe, Züchter)

#### Neue Komponenten
- `BookmarkButton.tsx` — Toggle-Button (Lesezeichen-Icon), nutzt `/api/bookmarks`
- `ReportButton.tsx` — "Melden"-Link + Modal mit Grund-Auswahl
- `ReviewSection.tsx` — Bewertungen anzeigen + Formular (für eingeloggte Nutzer)
- `BreederStatusToggles.tsx` — Zwei Toggles (Seite öffentlich / Profil aktiv) direkt im Dashboard-Header rechts neben Zwingernamen; speichert sofort per PATCH ohne Reload

#### ProfilForm — neue Felder
- Übergabe & Besuch-Block: `handoverLocation`, `visitPossible`, `damVisitPossible`
- Toggles aus ProfilForm in `BreederStatusToggles` ausgelagert (Dashboard)

#### Registrierung
- Rollenauswahl (Welpensucher / Züchter / Dienstleister) mit Icon-Buttons
- Navbar: "Züchter werden" → "Registrieren"
- Zwingername-Feld erscheint nur bei Rolle=Züchter

#### isActive / isPublished Logik
- `isActive=false` → API setzt automatisch auch `isPublished=false`
- Inaktive Züchter verschwinden aus allen öffentlichen Seiten: `/zuechter`, `/welpen`, `/zuchtrueden`, `/hunde`, Startseite
- `/hunde` filtert `breeder: { isActive: true }`

#### Züchter-Profilseite (`/zuechter/[slug]`)
- Übergabe-Infos-Block (Ort, Besuch, Muttertier-Besuch)
- `ReviewSection` mit Sternebewertung
- `BookmarkButton` zum Merken

#### Welpen-Detailseite (`/welpen/[id]`)
- `BookmarkButton` + `ReportButton` im Preis-Bereich

---

### ✅ Weitere Änderungen (2026-07-03) — FERTIG

#### Infrastruktur
- `resend` npm-Package installiert (`npm install resend`)
- `.gitignore` eingerichtet — schließt `node_modules/`, `.next/`, `.env*` aus
- Umgebungsvariablen in Coolify: `RESEND_API_KEY` (von resend.com) + `CRON_SECRET` (selbst gewählt)
- Täglicher Cron-Job via cron-job.org: `GET https://whelply.de/api/cron/welpen-alerts?secret=CRON_SECRET` täglich 08:00 Uhr

#### Migrationen
- `20260702030000_welpen_alerts` — neue Tabelle `welpen_alerts` (`id`, `email`, `breed_id`, `state`, `created_at`)
- `20260702040000_welpen_alert_token` — `unsubscribe_token` (unique, NOT NULL) + `last_sent_at` auf `welpen_alerts`

#### Neues Schema-Modell: `WelpenAlert`
- Felder: `email`, `breedId?` (FK auf breeds), `state?`, `unsubscribeToken` (unique), `lastSentAt?`
- Relation: `Breed.alerts WelpenAlert[]`

#### Neue API-Routen (alle in middleware `alwaysAllowed`)
- `POST /api/welpen-alert` — Alert anlegen; generiert `unsubscribeToken` via `crypto.randomBytes`; verhindert Duplikate
- `GET /api/cron/welpen-alerts?secret=` — Cron-Endpoint; prüft `CRON_SECRET`; ruft `sendWelpenAlerts()` auf
- `DELETE /api/admin/reports/[id]` — Admin kann Meldungen löschen

#### Neue Seiten
- `/welpen-alert/abmelden/[token]` — DSGVO-konforme Abmeldeseite; löscht Alert sofort beim Aufruf; zeigt Bestätigung

#### Neue Komponenten
- `WelpenAlertButton.tsx` — Honey-Button "Alert einrichten" auf Welpen-Seite; öffnet Modal mit E-Mail-Eingabe + Filter-Anzeige + Datenschutzhinweis

#### Neue Lib
- `src/lib/mail-alerts.ts` — `sendWelpenAlerts()`:
  - Lädt alle neuen Listings der letzten 24h
  - Matched jeden Alert mit passenden Listings (Rasse + Bundesland)
  - Sendet HTML-Mail via Resend API (`fetch` direkt, kein SDK nötig)
  - Setzt `List-Unsubscribe` + `List-Unsubscribe-Post` Header (DSGVO/RFC 8058)
  - Aktualisiert `lastSentAt` nach erfolgreichem Versand
  - Überspringt wenn `RESEND_API_KEY` nicht gesetzt

#### Admin-Dashboard
- Neuer Tab "Meldungen" mit Lösch-Button pro Eintrag
- Neuer Tab "Nutzer" mit Lösch-Button (via `DELETE /api/admin/users/[id]`)
- Suchfeld in allen Tabs (Züchter, Inserate, Meldungen, Nutzer)
- Neue Nutzer-Tab zeigt E-Mail, Name, Rolle, Registrierungsdatum

#### Züchter-Verzeichnis (`/zuechter`)
- "Zuletzt eingetragene Züchter" Sektion (letzte 30 Tage, max 10, nur ohne aktive Filter)
- Kompakte Karten mit Zwingername, Rasse, Ort, Status-Badges (Welpen Dispo / Welpen à venir / Deckrüde)
- Karten zeigen jetzt Hintergrundbild (falls vorhanden)
- Drei runde Badges (Welpen Dispo Honey / Wurf erwartet Blau / Deckrüde Forest), Größe `w-16 h-16`
- `_count.dogs` (isStud) in Query für Deckrüden-Badge

#### Welpen-Seite (`/welpen`)
- 36 Inserate pro Seite (war 24)
- `WelpenAlertButton` erscheint rechts neben Breadcrumb (immer sichtbar)
- "Welpen demnächst erwartet"-Sektion nach der Pagination: zeigt bis zu 12 Würfe mit Status `pregnant`/`planned`, Mutter+Vater-Bild, Züchter, Ort, Datum

#### Homepage (`/`)
- 15 Welpen (war 8), 9 Züchter (unverändert), 6 Erwachsene Hunde (war 4 angezeigt)

#### Nutzer-Dashboard (`/dashboard/nutzer`)
- Name-Eingabe via `NutzerNameForm` + `PATCH /api/user-profile`
- `displayName` auf User-Modell (`display_name TEXT`)
- Migration `20260702020000_user_display_name`

#### Diverse Fixes
- Registrierung: `kennelName` nur für `role=breeder` validiert (`.refine()`); leere Strings werden vor Zod-Validierung entfernt
- Navbar: "Züchter werden" → "Registrieren"
- Login-Seite: "Als Züchter registrieren" → "Registrieren"
- Dashboard: Buyer/Service werden zu `/dashboard/nutzer` redirected (kein Loop mehr)
- `WelpeForm`: nach Speichern → Erfolgs-Screen mit "Inserat ansehen", "Fotos hinzufügen", "+ Weiteren Welpen anlegen"
- ProfilForm: Übergabe-Block entfernt (war redundant zur Züchter-Profilseite)
- Merkliste: BookmarkButton auf jeder Karte zum direkten Entmerken
- Welpen-Detail: BookmarkButton nur für Nicht-Züchter; ReportButton ganz unten

---

### ✅ Weitere Änderungen (2026-07-04) — FERTIG

#### Messaging-System
- Neue DB-Tabellen: `conversations` (unique user+breeder), `messages` (senderRole: 'user'|'breeder')
- Migration: `20260703010000_messaging`
- API: `POST /api/messages` — Conversation erstellen + erste Nachricht senden
- API: `GET /api/messages` — alle Conversations des eingeloggten Nutzers/Züchters
- API: `GET/POST /api/messages/[id]` — Einzelne Conversation + Antwort senden; markiert Nachrichten als gelesen
- `NachrichtButton.tsx` — Modal mit Texteingabe; `variant='dark'` für dunkle Hintergründe
- `ConversationView.tsx` — Client-Component mit Chatverlauf, Enter zum Senden, Auto-Scroll
- `/dashboard/nachrichten` — Posteingang für Züchter und Nutzer mit Ungelesen-Indikator
- `/dashboard/nachrichten/[id]` — Einzelne Konversation; Date-Serialisierung via `.toISOString()`
- Nachrichten-Link im Züchter-Dashboard mit rotem Badge (Zahl ungelesener Nachrichten)
- Nachrichten-Link im Nutzer-Dashboard mit rotem "X neu"-Badge
- `NachrichtButton` in `BreederContactSidebar` (ersetzt mailto-Link) — auf allen Züchter-Unterseiten
- `NachrichtButton` im Züchter-Kontaktkasten auf Welpen-Detailseite (`variant="dark"`)
- Kein Bookmark mehr auf Züchter-Profilseiten; nur noch auf Welpen/Hunde-Inseraten

#### Kontaktseite auf Züchterseiten
- Neuer Tab "Kontakt" auf allen Züchterseiten (immer sichtbar, auch ohne Inhalte)
- `/zuechter/[slug]/kontakt` — Kontaktformular mit Nachname, Vorname, E-Mail, Telefon, Betreff (Dropdown), Nachricht
- `KontaktForm.tsx` — sendet über `/api/messages`; zeigt Login-Hinweis wenn nicht angemeldet
- Adressblock unter dem Formular (wenn showAddress=true)
- Sidebar mit Kontaktdaten + NachrichtButton

#### Dashboard-Header vereinheitlicht
- `DashboardHeader.tsx` — Server Component mit importierter `signOutAction` aus `src/app/actions/auth.ts`
- Props: `title`, `backHref` (default: '/dashboard'), `backLabel` (default: 'Dashboard'), `action?`
- Layout: Whelply | ← Zurück | Titel (links) … Abmelden (rechts)
- Alle Formular-Komponenten nutzen `DashboardHeader`: ProfilForm, UeberUnsForm, ThemeEditor, HundForm, HundEditForm, InseratForm, InseratEditForm, LitterDashboard, NewsPostForm, RuedeForm, WelpeForm, WurfForm
- `WelpeForm`: zurück zu Wurf (`backHref={/dashboard/wurf/${litter.id}}`)
- `NewsPostForm`: zurück zu Aktuelles (`backHref="/dashboard/news"`)

#### Aktuelles-Dashboard
- "+ Neuer Beitrag"-Button rechtsbündig über der Beitragsliste (nicht mehr im Header)

#### "Über uns"-Seite im Dashboard
- Neuer Link "Über uns" zwischen "Profil bearbeiten" und "Theme & Branding"
- `/dashboard/ueber-uns` — nur Bio-Text (RichEditor); Karten-Bild bleibt in ProfilForm
- `UeberUnsForm.tsx` mit eigenem DashboardHeader

#### Züchter-Verzeichnis (`/zuechter`)
- Karten-Vorschaubild (`purpose='card'`) als Hintergrundbild der Karte
- Drei runde Badges `w-20 h-20` außerhalb der Karte (overflow-Problem gelöst durch separaten Wrapper)
- "Zuletzt eingetragene Züchter" am Ende der Seite (nicht oben), mit Link wenn isPublished=true
- Alert-Button nur bei aktiver Filterauswahl (Rasse oder Bundesland)

#### Welpen-Seite (`/welpen`)
- 36 Inserate pro Seite
- Alert-Button nur bei aktiver Filterauswahl

#### Sonstiges
- `breeder.ts`: `userId` in `getBreederBySlug` select hinzugefügt (für isOwnProfile-Check)
- ProfilForm: Telefon-Länge bleibt max. 20; bestehende Werte werden beim Laden auf 20 Zeichen gekürzt
- Middleware: `/api/messages`, `/api/cron`, `/welpen-alert` in alwaysAllowed

---

### ✅ Weitere Änderungen (2026-07-05) — FERTIG

#### Deckrüden Multi-Bild-Galerie
- `DogGalleryUploader.tsx` — komplett neu: Multi-Upload, Positions-Dropdown (Hauptbild/OL/OR/UL/UR/Galerie), Lösch-Button, Live-Vorschau-Grid
- `DogPhotoGrid.tsx` ← neu — Client-Component mit klickbarer Lightbox (Vor/Zurück, Zähler), 5er-Grid wenn Positionen gesetzt, sonst Einzelbild
- Galerie mit Positionen **nur für Deckrüden** (isStud=true). Für Zuchthündinnen: simpleMode ohne Positions-Dropdown — ein großes Bild + Thumbnails
- `HundEditForm.tsx` nutzt `DogGalleryUploader` mit `simpleMode` prop für nicht-Deckrüden
- Upload-API: dogId-Zweig hängt Bilder an statt sie zu überschreiben (existingCount + sortOrder)
- `media-item/[id]` PATCH für purpose-Updates; DELETE funktioniert jetzt auch für Hunde-Medien

#### Nachrichten-Badge Fix
- Root Cause: Züchter der anderen Züchter kontaktiert wird als `userId` (nicht `breederId`) in der Konversation gespeichert. Badge-Query suchte nur `conversation.breederId`
- Fix: `unreadCount` Query prüft jetzt BEIDE Seiten — als `breederId` UND als `userId` in Konversationen
- `sender_role='user'` für neue Nachrichten (Initiator), `sender_role='breeder'` für Antworten
- WhatsApp-Stil Badge: `ring-2 ring-white`, absolute `-top-2 -right-2`, halb überlappend
- `force-dynamic` auf Dashboard-Seite hinzugefügt (fehlte!)

#### Dashboard
- `export const dynamic = 'force-dynamic'` auf `/dashboard/page.tsx`
- `overflow: visible` inline auf "Meine Züchterseite"-Card für Badge-Sichtbarkeit

#### Kontaktformular
- Honeypot-Spam-Schutz in `KontaktForm.tsx`: verstecktes `website_url` Feld, bei Ausfüllung → fake success ohne Nachricht

#### Header
- `DashboardHeader.tsx` Höhe `h-16` (war `h-14`, jetzt gleich wie Dashboard-Hauptseite)

---

### ✅ Weitere Änderungen (2026-07-05 Nachtrag) — FERTIG

#### WICHTIGE REGEL: Wurfname
- Bei Würfen IMMER prominent den Wurfnamen anzeigen (l.name), nicht nur die Rasse
- Format: Wurfname als Haupttext, Rasse + Datum + Details als Untertext
- Gilt für ALLE Stellen wo Würfe angezeigt werden: Hund-Detail, Züchterseite, Dashboard

#### Deckrüden-Galerie & Bilder
- `DogGalleryUploader.tsx`: simpleMode zeigt "Als Titelbild setzen"-Button pro Bild
- `media-item/[id]` PATCH unterstützt jetzt `isPrimary` — setzt alle anderen Bilder desselben Hundes auf false
- Bild-Auswahl überall: `purpose='primary'` → `isPrimary=true` (ohne dog_bg) → erstes Nicht-dog_bg-Bild
- Media-Query überall: `orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }]`
- Zuchtrueden-Übersicht (`/zuchtrueden`): gleiche Bild-Auswahl-Logik
- DogPhotoGrid Lightbox: via `createPortal(document.body)`, z-[9999]

#### Zuchthunde-Übersichtsseite (Unsere Hunde)
- `DogCard`-Komponente: identisches Layout für Rüden und Hündinnen
- Feste Kartenhöhe `220px`, Bildbreite `w-56`, `overflow-hidden` auf Text
- Bearbeiten-Banner: gelber Balken wie auf `/hund/[id]`, `mt-4` Abstand zur Navigation
- Kein Thumbnail unter den Karten

#### Hund-Detailseite (Züchter-Layout)
- `/zuechter/[slug]/hund/[id]` — für Zuchthündinnen im Züchter-Layout
- Bearbeiten-Banner identisch zur `/hund/[id]` Seite
- Profil-ansehen-Link in HundEditForm: Hündinnen → `/zuechter/[slug]/hund/[id]`, Deckrüden → `/hund/[id]`
- `kennelName` wird an HundEditForm übergeben für korrekte URL-Generierung

#### Stammbaum 3 Generationen
- Korrekte Query-Verschachtelung: `parentInclude` → `gpInclude` → `ggpSelect`
- Level 1: Eltern (Bild + klickbar)
- Level 2: Großeltern (Bild + klickbar)  
- Level 3: Urgroßeltern (Name)
- Tabellen-Layout: alle 15 Felder immer sichtbar, fehlende mit "—" und gestricheltem Rand

---

### 📋 AKTUELLE DATEIÜBERSICHT (Stand 2026-07-05)

#### Neue Komponenten (Session 8-9)
- `DashboardHeader.tsx` — Einheitlicher Header für alle Dashboard-Unterseiten (Whelply | ← Zurück | Titel | Abmelden), h-16, `signOutAction` aus separater Server-Action-Datei
- `NachrichtButton.tsx` — Modal zum Nachrichtenschreiben, `variant='light'|'dark'`
- `ConversationView.tsx` — Chat-Ansicht mit Enter-zum-Senden, Auto-Scroll
- `KontaktForm.tsx` — Kontaktformular mit Honeypot-Spam-Schutz (verstecktes `website_url`-Feld)
- `DogGalleryUploader.tsx` — Multi-Upload für Hundebilder. Deckrüden: 5er-Grid mit Positions-Dropdown. Hündinnen: simpleMode mit "Als Titelbild setzen"-Button
- `DogPhotoGrid.tsx` — Client-Component: 5er-Grid oder Einzelbild + Lightbox via `createPortal(document.body)` z-[9999]
- `DogBgUploader.tsx` — Hintergrundbild-Upload für Deckrüden (purpose='dog_bg')
- `WelpenAlertButton.tsx` — Alert-Modal mit E-Mail-Eingabe, nur bei aktiver Filterauswahl
- `BreederStatusToggles.tsx` — isPublished/isActive-Toggles im Dashboard-Header

#### Neue Seiten (Session 8-9)
- `/dashboard/ueber-uns` — Bio-Editor (RichEditor), Kartenbild bleibt in ProfilForm
- `/dashboard/nachrichten` — Posteingang (beide Rollen), Ungelesen-Indikator
- `/dashboard/nachrichten/[id]` — Einzelne Konversation, Date-Serialisierung
- `/zuechter/[slug]/kontakt` — Kontaktformular im Züchter-Layout
- `/zuechter/[slug]/hund/[id]` — Hund-Detail im Züchter-Layout (für Zuchthündinnen)
- `/welpen-alert/abmelden/[token]` — DSGVO-Abmeldeseite
- `/api/messages` — GET (Liste) / POST (neue Nachricht senden)
- `/api/messages/[id]` — GET (Conversation + als gelesen markieren) / POST (Antwort)
- `/api/welpen-alert` — POST (Alert anlegen mit unsubscribeToken + Bestätigungsmail)
- `/api/cron/welpen-alerts` — GET (täglicher Versand via Resend)
- `/app/actions/auth.ts` — Server Action `signOutAction()` (aus DashboardHeader importiert)

#### Neue DB-Tabellen (Session 8-9)
- `conversations` — userId + breederId (unique), Timestamps
- `messages` — conversationId, senderRole ('user'|'breeder'), content, readAt
- `welpen_alerts` — email, breedId?, state?, unsubscribeToken (unique), lastSentAt

#### Wichtige Regeln & Patterns
- **Wurfname**: IMMER prominent anzeigen (`l.name || l.breed.nameDe`), Rasse als Detail darunter
- **Bild-Auswahl für Hunde**: `purpose='primary'` → `isPrimary=true` (ohne dog_bg) → erstes Nicht-dog_bg-Bild
- **Media-Ordering**: `orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }]`
- **Deckrüden-Features** (nur `isStud=true AND sex='male'`): 5er-Grid, Positions-Dropdown, Hintergrundbild (dog_bg), eigene Seite `/hund/[id]`
- **Zuchthündinnen** (`isStud=true AND sex='female'`): simpleMode, Titelbild-Auswahl, Detailseite im Züchter-Layout `/zuechter/[slug]/hund/[id]`
- **Nachrichten-Badge**: Query prüft BEIDE Seiten (als breederId UND als userId in Konversationen)
- **`force-dynamic`**: auf ALLEN Dashboard-Seiten und öffentlichen Datenseiten
- **Lightbox**: immer via `createPortal(document.body)` rendern, z-[9999]
- **DashboardHeader**: alle Unterseiten nutzen `DashboardHeader` mit `backHref`/`backLabel`/`action`

#### Middleware alwaysAllowed (vollständig)
`['/api/auth', '/api/preview-login', '/api/inserate', '/api/wuerfe', '/api/upload', '/api/media', '/api/media-item', '/api/profil', '/api/hunde', '/api/news', '/api/admin', '/api/bookmarks', '/api/reports', '/api/reviews', '/api/upgrade-to-breeder', '/api/user-profile', '/api/welpen-alert', '/api/cron', '/api/messages', '/api/artikel', '/api/passwort', '/api/produkte', '/api/profil/check-subdomain', '/welpen-alert', '/passwort-', '/admin', '/preview', '/_next', '/favicon.ico']`

#### Infrastruktur
- `resend` npm-Package für E-Mail-Versand
- `.gitignore`: `node_modules/`, `.next/`, `.env*`
- Coolify Env-Vars: `RESEND_API_KEY`, `CRON_SECRET`
- cron-job.org: `GET https://whelply.de/api/cron/welpen-alerts?secret=CRON_SECRET` täglich 08:00

---

### ✅ Weitere Änderungen (2026-07-08) — FERTIG

#### Deckrüden-Seiten-Design (individuell pro Hund)
- Neue DB-Felder auf `dogs`: `page_card_color`, `page_text_color`, `page_heading_color`, `page_bg_fixed`
- Migration: `20260705010000_dog_page_style`
- Im Backend (HundEditForm): Color-Picker für Karten-Hintergrund, Textfarbe, Überschriften; Dropdown für Hintergrundbild fixiert/scrollend — nur bei Deckrüden sichtbar
- Öffentliche Seite (`/hund/[id]`): Inhaltskarten verwenden die Custom-Farben; Hintergrundbild `fixed` oder `absolute` je nach Einstellung

#### Mobile Stammbaum
- Desktop: Tabellen-Layout (8 Spalten, alle 15 Positionen)
- Mobile (`md:hidden`): vertikales Layout mit `PedigreeBranch`-Komponente — Vater-Linie und Mutter-Linie untereinander, jeweils mit Großeltern und Urgroßeltern eingerückt
- `MiniCard`-Komponente für Urgroßeltern (Name + Label)

#### Unsere Hunde — alle Hunde anzeigen
- Dashboard: "Meine Hunde" zeigt ALLE Hunde (nicht nur isStud=true)
- Öffentliche Seite: Query ohne `isStud`-Filter; Sektionen "Hündinnen" (oben) und "Rüden" (unten)
- Welpen werden über `listings: { none: { type: 'puppy' } }` ausgefiltert
- isStud steuert nur: Deckrüde-Badge + Link zu `/hund/[id]` vs. normaler Badge + Link zu `/zuechter/[slug]/hund/[id]`
- Mobile: `flex-col md:flex-row`, Bild oben (h-48), Text darunter; Desktop: feste Höhe `md:h-[220px]`

#### Deckrüden-Übersicht (`/zuchtrueden`)
- Titel und Navbar: "Zuchtrüden" → "Deckrüden"
- Mobile: `aspect-square sm:aspect-[4/3]` für bessere Bilddarstellung
- Bild-Auswahl: kein `take`-Limit mehr; expliziter `purpose === null` Check verhindert dass dog_bg als Kartenbild erscheint

#### Homepage
- "Hunde zu vergeben" → "Erwachsene Hunde"
- "Erwachsene Hunde" (Untertitel) → "Hunde jeden Alters"
- Züchter-Bild: `purpose: 'card'` statt `purpose: 'background'`
- Filter: nur Züchter MIT Kartenbild werden angezeigt

#### HundEditForm
- Nach Speichern: `window.scrollTo({ top: 0, behavior: 'smooth' })`
- "+ Weiteren Hund eintragen" Link entfernt (war nur für Welpen relevant)
- "Profil ansehen" Link: `flex-col` auf Mobile für bessere Sichtbarkeit
- Style-Felder (pageCardColor, pageTextColor, pageHeadingColor, pageBgFixed) werden an API gesendet

#### Bildkompression
- `ImageUploader.tsx`: 1200px statt 1920px, 80% statt 85% Qualität — ca. halbe Dateigröße

#### Cron-Job: Welpen-Aufräumung
- `GET /api/cron/cleanup?secret=CRON_SECRET` — löscht Dog-Einträge verkaufter Welpen nach 3 Monaten
- Prüft: `listings.every(type='puppy', status='sold')` + `updatedAt < 90 Tage`
- Bei cron-job.org als wöchentlichen Job einrichten

#### Upload-API Bug-Fix
- `purpose: { not: 'dog_bg' }` in PostgreSQL schloss NULL-Werte aus → jeder neue Upload wurde isPrimary=true
- Fix: `OR: [{ purpose: null }, { purpose: { not: 'dog_bg' } }]`

#### WICHTIGE REGELN (ergänzt)
- **Prisma/PostgreSQL**: `purpose: { not: 'dog_bg' }` schließt NULL aus! Immer `OR: [{ purpose: null }, { purpose: { not: 'dog_bg' } }]` verwenden
- **Bild-Auswahl Reihenfolge**: `purpose='primary'` → `isPrimary=true && purpose===null` → `purpose===null` → `purpose!=='dog_bg'`
- **Media orderBy**: `[{ isPrimary: 'desc' }, { sortOrder: 'asc' }]` — kein `take`-Limit wenn purpose-Suche nötig
- **Deckrüden-Features**: nur bei `isStud=true AND sex='male'` — Grid, Hintergrund, Farbauswahl, eigene Seite `/hund/[id]`

---

### ✅ Weitere Änderungen (2026-07-09) — FERTIG

#### Deckrüden-Seite: Hintergrund & Styling
- Äußerer Wrapper-Container (`<div>`) mit `backgroundColor: pageBgColor` umschließt Navbar + main + Footer → kein weißer Bereich mehr am Ende
- Ein großer Inhalts-Rahmen (`rounded-2xl`, `backgroundColor: pageCardColor`) umschließt Foto-Grid + alle Karten
- Einzelne Karten bleiben weiß (`#ffffff`), nur der umgebende Container bekommt `pageCardColor`
- Gradient-Overlay: `transparent 0px → transparent 85vh → bgColor90 95vh → bgColor 100vh` — Bild oben sichtbar, sanfter Übergang unten
- Hintergrundbild-Container: `height: 100vh` bei fixiert UND scrollend — kein Zooming mehr bei scrollend
- `pageBgColor` — neue DB-Spalte für Seiten-Hintergrundfarbe (hinter dem Bild + am Ende der Seite)
- Migration: `20260708010000_dog_page_bg_color`
- Alle `cardStyle`/`hStyle`-Variablen durch direkte `dog.pageXxxColor`-Zugriffe ersetzt (IIFE-Scope-Problem)

#### Züchterseiten: Hintergrund-Optionen (wie Deckrüden)
- Neue DB-Felder auf `breeder_profiles`: `theme_bg_fixed` (boolean), `theme_bg_overlay` (text)
- Migration: `20260708020000_breeder_bg_options`
- `BreederHeaderData`-Typ: `themeBgFixed` und `themeBgOverlay` hinzugefügt
- `BreederPageHeader.tsx`: fixiert/scrollend Hintergrundbild, Gradient-Overlay, Body-Background via `<style>`-Tag
- `ThemeEditor.tsx`: Dropdown "Verhalten" (Fixiert/Scrollt mit) + Color-Picker "Seitenfarbe"
- `profil` API: `themeBgFixed` und `themeBgOverlay` in Schema + Update

#### Footer-Fix bei fixiertem Hintergrund
- `Footer.tsx`: `relative z-10` hinzugefügt
- `BreederFooter.tsx`: `relative z-10` hinzugefügt
- Problem war: fixierter Hintergrund (z-0) überdeckte die Footer

#### WICHTIGE REGELN (ergänzt)
- **Footer**: IMMER `relative z-10` auf Footer-Komponenten, damit sie über fixierten Hintergründen sichtbar bleiben
- **IIFE-Scope**: Keine Variablen innerhalb von IIFEs definieren und außerhalb referenzieren — stattdessen direkt `dog.xyz` / `breeder.xyz` nutzen
- **Hintergrundbild-Höhe**: Immer `height: 100vh` setzen, nie `inset-0` bei absolute (sonst dehnt sich Bild über gesamte Seitenhöhe)
- **Wurfname**: IMMER prominent anzeigen (`l.name || l.breed.nameDe`), Rasse als Detail darunter — gilt überall wo Würfe angezeigt werden

---

### ✅ Subdomain-Routing Phase 2 (2026-07-13) — FERTIG

#### Infrastruktur (Pangolin/Traefik)
- **Wildcard-Route in Traefik**: `config/traefik/dynamic_config.yml` erweitert mit `whelply-wildcard` Router
  - Regel: `HostRegexp('^[a-z0-9-]+\.whelply\.de$')` (Traefik v3 Syntax!)
  - Service: `10-Whelply-service@http` (referenziert Pangolins dynamisch verwalteten Service — Port-Änderungen egal)
  - `priority: 1` (niedrig, damit Pangolins `whelply.de`-Route Vorrang behält)
  - `certResolver: letsencrypt-dns` (Wildcard-Zertifikat)
  - HTTP→HTTPS Redirect via `redirect-to-https` Middleware
- **Pangolin**: Wildcard-Resources werden im UI nicht unterstützt → direkt in `dynamic_config.yml` gelöst
- **Coolify Env**: `NEXT_PUBLIC_BASE_DOMAIN=whelply.de` hinzugefügt

#### Next.js Middleware (`src/middleware.ts`)
- **Subdomain-Erkennung**: Host-Header wird gegen `NEXT_PUBLIC_BASE_DOMAIN` geprüft, `www` ignoriert
- **URL-Rewrite**: `bella.whelply.de/wuerfe` → intern `/zuechter/bella/wuerfe`
- **Redirect für saubere URLs**: `bella.whelply.de/zuechter/bella/wuerfe` → redirect zu `bella.whelply.de/wuerfe` (kein Duplicate Content)
- **skipRewrite-Liste** (Pfade die auf Subdomains NICHT umgeschrieben werden):
  `/api/`, `/_next/`, `/favicon.ico`, `/dashboard`, `/admin`, `/preview`, `/login`, `/registrieren`,
  `/passwort-`, `/welpen-alert`, `/zuechter/`, `/welpen/`, `/hunde/`, `/hund/`, `/zuchtrueden/`,
  `/rassen/`, `/ratgeber/`, `/dienste/`, `/impressum`, `/datenschutz`, `/agb`

#### Subdomain-Validierung (`src/lib/subdomain.ts`)
- `isValidSubdomain()` — Boolean-Check
- `validateSubdomain()` — gibt Error-String oder `null` zurück (für API-Routen)
- `normalizeSubdomain()` — Eingabe bereinigen
- `getBreederCanonicalUrl()` — kanonische URL (Subdomain bevorzugt, Fallback `/zuechter/slug`)
- **Reservierte Subdomains**: `www`, `api`, `admin`, `mail`, `ftp`, `app`, `dashboard`, `cdn`, `static`,
  `media`, `blog`, `shop`, `preview`, `staging`, `test`, `dev`, `help`, `support`, `status`, `docs`,
  `login`, `register`, `registrieren`, `account`, `billing`, `konto`, `welpen`, `zuechter`, `rassen`,
  `hunde`, `zuchtrueden`, `deckrueden`, `dienste`, `ratgeber`, `kontakt`, `impressum`, `datenschutz`,
  `agb`, `news`, `aktuelles`, `galerie`, `info`

#### Breeder-Lookup (`src/lib/breeder.ts`)
- `getBreederBySlug()` sucht jetzt auch nach `subdomain` (nicht nur `slugify(kennelName)`)
- `subdomain` im `findMany` select hinzugefügt

#### Canonical-Tags (`src/lib/breeder-metadata.ts`) — NEU
- `generateBreederMetadata(slug, subPath?, titleSuffix?)` — generiert Metadata mit `alternates.canonical` auf Subdomain-URL
- Muss in jeder `/zuechter/[slug]/...` Page als `generateMetadata` exportiert werden (9 Seiten):
  - `/zuechter/[slug]/page.tsx` (subPath: `''`)
  - `/zuechter/[slug]/zuchthunde/page.tsx` (subPath: `'/zuchthunde'`)
  - `/zuechter/[slug]/wuerfe/page.tsx` (subPath: `'/wuerfe'`)
  - `/zuechter/[slug]/wuerfe/[litterId]/page.tsx` (subPath: `` `/wuerfe/${params.litterId}` ``)
  - `/zuechter/[slug]/hunde/page.tsx` (subPath: `'/hunde'`)
  - `/zuechter/[slug]/hund/[id]/page.tsx` (subPath: `` `/hund/${params.id}` ``)
  - `/zuechter/[slug]/aktuelles/page.tsx` (subPath: `'/aktuelles'`)
  - `/zuechter/[slug]/galerie/page.tsx` (subPath: `'/galerie'`)
  - `/zuechter/[slug]/kontakt/page.tsx` (subPath: `'/kontakt'`)

#### ThemeEditor Fix
- Subdomain-Check URL korrigiert: `/api/subdomain-check?sub=` → `/api/profil/check-subdomain?subdomain=`
- Anzeige: `whelply.de/` → `.whelply.de`

#### Absolute URLs in Navigation
- `Navbar.tsx`, `BreederNavbar.tsx`, `Footer.tsx`, `BreederFooter.tsx`: alle Links nutzen jetzt
  `process.env.NEXT_PUBLIC_APP_URL` als Base-URL (absolute `<a>`-Tags statt relative `<Link>`),
  damit Links auf Subdomains korrekt zur Hauptdomain führen

#### WICHTIGE REGELN (ergänzt)
- **Subdomain-Routing**: Middleware erkennt `*.whelply.de` und schreibt intern auf `/zuechter/[subdomain]/...` um
- **Navigation**: Alle Links in Navbar/Footer MÜSSEN absolute URLs mit `NEXT_PUBLIC_APP_URL` verwenden (keine relativen `<Link>`-Tags), damit sie auf Subdomains korrekt zur Hauptdomain führen
- **Neue öffentliche Top-Level-Routen**: müssen in der `skipRewrite`-Liste der Middleware eingetragen werden
- **Traefik Wildcard**: liegt in `config/traefik/dynamic_config.yml`, NICHT in Pangolin UI (unterstützt keine Wildcards)
- **Service-Referenz**: `10-Whelply-service@http` — das `@http` ist zwingend nötig (cross-provider Referenz zwischen File- und HTTP-Provider)
- **Traefik v3 Syntax**: `HostRegexp('^regex$')` — NICHT die alte v2-Syntax `HostRegexp('{name:regex}')`

---

### 📁 DATEIPFADE — Wohin die Dateien müssen

Alle Dateien werden relativ zum Projekt-Root kopiert. Die Ordnerstruktur im Output entspricht 1:1 der im Projekt.

#### Komponenten → `src/components/`
- `Navbar.tsx`
- `Footer.tsx`
- `BreederFooter.tsx`
- `BreederPageHeader.tsx`
- `BreederPageContent.tsx`
- `BreederContactSidebar.tsx`
- `BreederNavbar.tsx`
- `ThemeEditor.tsx`
- `HundEditForm.tsx`
- `DogGalleryUploader.tsx`
- `DogPhotoGrid.tsx`
- `DogBgUploader.tsx`
- `ImageUploader.tsx`
- `NachrichtButton.tsx`
- `ConversationView.tsx`
- `KontaktForm.tsx`
- `WelpenAlertButton.tsx`
- `DashboardHeader.tsx`
- `ListingImageGallery.tsx`

#### Seiten → `src/app/...`
- `src/app/page.tsx` — Homepage
- `src/app/zuchtrueden/page.tsx` — Deckrüden-Übersicht
- `src/app/hund/[id]/page.tsx` — Deckrüden-Detailseite (öffentlich)
- `src/app/zuechter/[slug]/page.tsx` — Züchter-Hauptseite
- `src/app/zuechter/[slug]/zuchthunde/page.tsx` — Unsere Hunde
- `src/app/zuechter/[slug]/hund/[id]/page.tsx` — Hund-Detail im Züchter-Layout
- `src/app/zuechter/[slug]/kontakt/page.tsx` — Kontaktformular
- `src/app/dashboard/page.tsx` — Züchter-Dashboard
- `src/app/dashboard/hund/[id]/page.tsx` — Hund bearbeiten
- `src/app/dashboard/theme/page.tsx` — Theme-Editor
- `src/app/dashboard/nachrichten/page.tsx` — Posteingang
- `src/app/dashboard/nachrichten/[id]/page.tsx` — Einzelne Konversation

#### API-Routen → `src/app/api/...`
- `src/app/api/hunde/[id]/route.ts` — Hund CRUD
- `src/app/api/media-item/[id]/route.ts` — Media PATCH/DELETE (isPrimary, purpose)
- `src/app/api/upload/route.ts` — Bild-Upload
- `src/app/api/profil/route.ts` — Züchter-Profil + Theme
- `src/app/api/messages/route.ts` — Nachrichten
- `src/app/api/messages/[id]/route.ts` — Konversation
- `src/app/api/welpen-alert/route.ts` — Welpen-Alerts
- `src/app/api/cron/welpen-alerts/route.ts` — Täglicher Alert-Versand
- `src/app/api/cron/cleanup/route.ts` — Welpen-Aufräumung (3 Monate)

#### Sonstiges
- `src/app/actions/auth.ts` — Server Action signOutAction
- `src/lib/mail-alerts.ts` — Welpen-Alert E-Mail-Versand
- `src/lib/subdomain.ts` — Subdomain-Validierung, Reserved-Liste, Canonical-URL-Helper
- `src/lib/breeder-metadata.ts` — generateBreederMetadata für Canonical-Tags auf Züchterseiten
- `prisma/schema.prisma` — Datenbankschema
- `prisma/migrations/` — Migrationen (SQL ausführen + resolve)
- `.gitignore`

---

### ✅ Weitere Änderungen (2026-07-10) — FERTIG

#### Artikel-System (SEO-Infrastruktur)
- Neues `Article`-Model: slug, title, excerpt, content (Markdown), category (ratgeber/rassen/news), coverImageUrl, SEO-Felder, breedId (Int, FK auf breeds), isPublished, publishedAt
- Migration: `20260709010000_articles`
- API: `GET/POST /api/artikel`, `GET/PATCH/DELETE /api/artikel/[id]` — Admin-only
- `ArtikelEditor.tsx`: Titel, Auto-Slug, Kategorie, Rassen-Dropdown (Int→String Konvertierung!), Markdown-Textarea, Titelbild-URL, SEO-Felder, Veröffentlichungs-Checkbox
- Admin: `/admin/artikel` (Liste), `/admin/artikel/neu` und `/admin/artikel/[id]` (Editor) — Link im Admin-Dashboard-Overview
- Öffentlich: `/ratgeber` (Übersicht nach Kategorien), `/ratgeber/[slug]` (Detail mit Markdown-Rendering, Breadcrumb, SEO-Meta)
- `/rassen/[slug]` erweitert: zeigt Rassen-Artikel wenn vorhanden
- Navbar: "Ratgeber"-Link hinzugefügt
- Middleware: `/api/artikel` zur Whitelist

#### Admin: Hunde-Verwaltung
- Neuer "Hunde"-Tab im Admin-Dashboard mit Tabelle: Name, Rasse, Züchter, Typ-Badge (Deckrüde/Zuchthündin/Erw. Hund/Welpe/Zuchthund), Erstellungsdatum, Löschen-Button
- `DELETE /api/admin/dogs/[id]` — löscht Listings + Media + Dog
- Admin-Page (`/admin/page.tsx`) fetcht jetzt auch Dogs mit Breed, Breeder, Listings, Media

#### WICHTIG: Breed-ID ist Int!
- `breeds.id` ist `Int @id @default(autoincrement())` — NICHT String/cuid
- Bei Referenzen auf breeds immer `Int` verwenden (nicht String)
- Im Frontend String↔Int konvertieren: `String(breedId)` für Select-Values, `parseInt(breedId)` für API-Calls

#### ArtikelEditor: Bild-Upload + RichEditor
- Titelbild: Upload statt URL-Eingabe, nutzt `/api/upload` mit `resizeImage(1200, 0.80)`
- Inhalt: `RichEditor`-Komponente (wie Über-Uns) statt Markdown-Textarea — Bilder + YouTube einbettbar
- Vorschau-Link zeigt je nach Kategorie `/rassen/[slug]` oder `/ratgeber/[slug]`

#### FCI-Rassen: Vollständige Liste
- `prisma/seed-breeds.sql` — ~160 FCI-Rassen auf Deutsch, alle 10 Gruppen
- Inkl. populäre Designerrassen (Labradoodle, Goldendoodle, Maltipoo etc.)
- `fci_number` ist NICHT mehr unique (Varietäten teilen sich Nummern: Spitz=97, Dackel=148, Pudel=172)
- Migration: `20260710010000_breed_fci_not_unique` — entfernt den unique Index
- Ausführen: `psql -U whelply -d whelply -f prisma/seed-breeds.sql`
- `ON CONFLICT (slug) DO NOTHING` — überspringt bereits vorhandene Rassen

#### WICHTIG: Breed.fciNumber ist NICHT unique!
- Varietäten einer Rasse teilen sich die FCI-Nummer
- Slug ist der einzige unique Identifier neben der Auto-ID

#### Affiliate-Produkt-System
- `Product`-Model: ASIN (unique), Name, Bild (selbst gehostet), Kategorie, Beschreibung, Affiliate-Tag, optionales Preis-Feld (priceCents + priceUpdatedAt)
- Migration: `20260712020000_products`
- Admin: `/admin/produkte` — Produkte anlegen, bearbeiten, löschen (mit Bild-Upload)
- API: `GET/POST /api/produkte`, `PATCH/DELETE /api/produkte/[id]`
- RichEditor: Warenkorb-Button → ASIN eingeben → `:::produkt[ASIN]` Shortcode
- Rendering: `renderMarkdown()` akzeptiert optional eine `Map<string, ProductData>` — Artikel-Seiten extrahieren ASINs aus dem Content, laden Produkte aus DB, übergeben sie
- Produktkarte: Bild links, Name + Beschreibung rechts, "Bei Amazon ansehen →" Button mit Affiliate-Tag
- Kein Preis angezeigt (optional vorhanden für spätere PA-API Integration)
- Affiliate-Link: `https://www.amazon.de/dp/{ASIN}?tag={affiliateTag}` mit `rel="noopener nofollow sponsored"`
- **PA-API Vorbereitung**: priceCents, priceUpdatedAt, isAvailable Felder existieren bereits. Später kann ein Cron-Job (`/api/cron/update-products`) die Amazon PA-API abfragen und Preise + Verfügbarkeit automatisch aktualisieren (erfordert 3 qualifizierte Sales in 180 Tagen für API-Zugang)

#### Passwort-Management
- **Passwort ändern** (eingeloggt): Altes PW prüfen → neues PW hashen → Bestätigungsmail → Token-Link → PW gespeichert + alle Sessions gelöscht
- **Passwort vergessen** (nicht eingeloggt): E-Mail eingeben → Reset-Link → neues PW setzen
- DB: `password_change_requests` + `password_reset_tokens` Tabellen
- Migration: `20260712010000_password_tokens`
- Token: bcrypt-gehasht in DB, Klartext nur in E-Mail
- Rate-Limiting: max 3 offene Anfragen pro User
- Züchter: Passwort ändern auf `/dashboard/profil` (unter Profilformular)
- Nutzer: Passwort ändern auf `/dashboard/nutzer`
- Login: "Passwort vergessen?" Link → `/passwort-vergessen`
- Route-Schutz: Züchter können `/dashboard/nutzer` nicht aufrufen (redirect → `/dashboard`)
- Mail: Shared `src/lib/mail.ts` Utility mit Resend API

#### Wildcard-Subdomain Infrastruktur (erledigt)
- **Phase 1** (DNS + SSL) und **Phase 2** (Routing) sind beide abgeschlossen — siehe "Subdomain-Routing Phase 2" weiter oben
- **DNS**: Cloudflare als DNS-Provider (kostenlos), Domain bleibt bei Febas registriert. Nameserver bei Febas auf Cloudflare umgestellt. Alle Records auf "DNS only" (graue Wolke, kein Proxy).
- **Wildcard A-Record**: `*.whelply.de` → Server-IP bei Cloudflare angelegt
- **Traefik**: Zwei Certificate-Resolver konfiguriert:
  - `letsencrypt` (HTTP-01) → für sweethomelab.de, kebabkarte.de, pooppee.de
  - `letsencrypt-dns` (DNS-01 via Cloudflare) → nur für whelply.de
  - Cloudflare API Token als `CLOUDFLARE_DNS_API_TOKEN` in docker-compose.yml
- **Pangolin config.yml**: `prefer_wildcard_cert: true` + `cert_resolver: letsencrypt-dns` für whelply.de
- **Status**: Wildcard-Zertifikat `*.whelply.de` erfolgreich ausgestellt, HTTPS funktioniert für beliebige Subdomains
- **Backups**: docker-compose.yml.bak, traefik_config.yml.bak, config.yml.bak existieren

#### ~~Subdomain-Routing~~ → ✅ FERTIG (2026-07-13)
- Siehe "Subdomain-Routing Phase 2" weiter oben
