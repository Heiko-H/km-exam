# IKMI App – Projektregeln und aktueller Stand

Diese Datei beschreibt den **aktuellen Stand** der App, die verbindlichen Regeln und die Gründe dafür. Eine Änderungshistorie wird bewusst nicht geführt. Wenn sich Verhalten oder Regeln ändern, wird diese Datei angepasst, damit sie immer den Ist-Zustand beschreibt.

## 1. Arbeitsweise
- Handle wie ein Senior-Frontend-Entwickler: auf Usability, Barrierefreiheit, Konsistenz und saubere Struktur achten, nicht nur auf „funktioniert“.
- Bei unklaren oder widersprüchlichen Anforderungen **vor** der Umsetzung nachfragen (Empfehlung als erste Option). Der Auftraggeber wünscht das ausdrücklich.
- Kommunikation mit dem Auftraggeber auf Deutsch.
- Nach Codeänderungen prüfen: `pnpm exec tsc -b`, `pnpm test` und `pnpm build` mit temporärem Passwort (z. B. `$env:APP_PASSWORD='temporaeres-testpasswort-123'`, danach wieder entfernen). Ohne `APP_PASSWORD` bricht Vite absichtlich ab.
- Nicht selbstständig committen.
- Die README wird mit dem Code aktuell gehalten.

## 2. Produkt in Kürze
- Die PWA „IKMI App“ dient zur Planung, Durchführung und Besprechung von Kampfsport-Stufenprüfungen (Stufe 1–5).
- Der App-Titel lautet in **allen** Sprachen „IKMI App“.
- Es gibt nur ein Frontend: kein Backend, keine Datenbank, keine Laufzeit-Requests für Daten. Ein Server kommt später. Deshalb sind Upload, Download, „Daten aktualisieren“ und „Prüfung an Prüfling“ (E-Mail) derzeit Platzhalter.
- Die App wird meist auf Tablet und Handy genutzt, auch am PC mit Maus. Sie muss responsive sein und darf keine Internetverbindung voraussetzen, denn in Prüfungen ist oft kein Netz vorhanden.

## 3. Technik-Stack
- Vite, React, TypeScript, Tailwind CSS v4 (Tokens per `@theme` in `src/style.css`), jeweils aktuelle stabile Versionen.
- **Nur pnpm** verwenden, nicht npm und nicht yarn.
- Tests mit Vitest.
- PWA mit `vite-plugin-pwa`. Die Icons erzeugt `@vite-pwa/assets-generator` aus `public/pwa-icon.svg`: ein weißes „P“ auf orangem Schild vor dunklem Hintergrund.
- WYSIWYG-Editor ist Tiptap (`RichTextEditor.tsx`). Er bietet nur Fett, Kursiv, Schriftgröße, Aufzählung und nummerierte Liste. Die HTML-Anzeige läuft über `RichText.tsx` und wird immer mit DOMPurify bereinigt.
- Hosting auf GitHub Pages, Repository `km-exam`, Base-Pfad `/km-exam/`.
- Das Deployment steuert `.github/workflows/deploy.yml`. Es läuft bei Push auf `master` oder von Hand und nutzt Node 22, pnpm 10 und Actions auf Node-24-fähigen Versionen (checkout/setup-node/pnpm `@v6`, upload-pages-artifact/deploy-pages `@v5`). Der Workflow testet, baut mit `secrets.APP_PASSWORD` und veröffentlicht `dist`.

## 4. Passwort, Verschlüsselung, Login
- **Gemeinsames App-Passwort:** Es existiert nur als GitHub-Secret `APP_PASSWORD`, lokal in `.env.local` (nicht eingecheckt). Im Quellcode steht es nirgends.
  - Warum: Eine reine Frontend-App kann einen im Code liegenden Schlüssel nicht schützen.
- **Verschlüsselung beim Build:** `build/encrypt-plugin.ts` liest `data/*.json`, validiert sie und verschlüsselt sie mit PBKDF2-SHA-256 (310.000 Iterationen) und AES-256-GCM. Das Ergebnis wird als virtuelles Modul `virtual:encrypted-data` ins Bundle eingebettet.
- **Passwortprüfung:** Die App prüft das Passwort, indem sie die Daten entschlüsselt (`src/lib/crypto.ts`). Dafür gibt es keinen Ajax-Call.
- Ein geändertes Secret wirkt erst nach einem neuen Build.
- Die JSON-Quelldateien im Repository sind **Klartext**. Verschlüsselt ist nur das ausgelieferte Bundle.
- **Login:** E-Mail eines Prüfers (aus `data/examiners.json`, Groß-/Kleinschreibung egal) plus das gemeinsame Passwort.
  - Im Prototyp ist das Passwort für alle Prüfer gleich.
  - Eine unbekannte E-Mail zählt als Fehlversuch.
- **Fehlversuche:** Fibonacci-Wartezeit in Sekunden (1, 1, 2, 3, 5 …), gespeichert in `localStorage` (`src/lib/lockout.ts`), damit ein Neuladen die Sperre nicht umgeht.
- **Session:** Sie gilt pro Browser-Tab. Abgeleiteter Schlüssel, Datum und `examinerId` liegen in `sessionStorage`.
  - Die Session verfällt um **0 Uhr**: per Timer bis Mitternacht und zusätzlich per Prüfung bei `focus`/`visibilitychange`, weil Timer im Hintergrund gedrosselt werden.
  - Ein Reload im selben Tab ist kein neuer Login.
- **Nach jedem Login** erscheint die Startseite.

## 5. Datenmodell (`src/lib/types.ts`)
- **IDs sind immer UUIDs** (`crypto.randomUUID()`).
- **Kategorien:** `level-1` … `level-5`, `general` (allgemeine Aufgaben wie Sparring oder Schattenboxen) und `other` („Sonstige“).
  - „Sonstige“ ist nie Teil einer Prüfung, sondern für spätere Trainings gedacht.
  - Jede Technik hat genau eine Kategorie.
- **Technik:** `id`, `category`, `tags` (Tag-UUIDs, n:m), `modification_date` (ISO), `title` (Name), `teaser` (Kurzbeschreibung, Textarea, max. 200 Zeichen mit Zähler), `details` (HTML aus Tiptap) und `translations.{en,fr,it,es}` mit `{title, teaser?, details?}`.
  - Allgemeine Aufgaben sind normale Techniken mit `category: "general"` und stehen in `data/techniques.json`.
  - `modification_date` existiert, damit später beim Sync nur geänderte Datensätze übertragen werden.
- **Tag:** `id`, `title`, `modification_date`, `translations` (nur `title`). Einen anderen Inhalt hat ein Tag nicht. Beispiele: Pistole, Messer, Baton, Schlag, Tritt, Boden.
- **Prüfer (`Examiner`):** `id`, `name` (ein Feld für den ganzen Namen), `email`, `shortcode`, `country`, `details`, `modification_date`.
  - `shortcode` ist eindeutig.
  - Prüfer werden überall als Kürzel-Tag angezeigt, der Name erscheint als `title`/Tooltip.
  - Prototyp-Prüfer: peter@gmail.com, heiko@gmail.com, kai@gmail.com.
- **Prüfungstermin/Container (`ExamEvent`):** `id`, `location` (Ort), `date` (YYYY-MM-DD), `startTime` (HH:MM), `archived`, `examinerIds`, `details`, `createdBy`, `exams[]`, `candidates[]`, `results`, `modification_date`.
- **Prüfung (`ExamDefinition`):** `id`, `name`, `level`, `kind` (`general` | `random`), `techniqueIds[]` (geordnet), `seedNumber?`, `randomConfig?` (Anzahl je Stufe).
- **Prüfling (`Candidate`):** `id`, `name` (ein Feld), `email`, `levels[]` (ein Prüfling kann mehrere Stufen gleichzeitig ablegen), `examinerId` (Standard ist der eingeloggte Prüfer), `cancelled`.
- Prüfungen und Prüflinge sind in genau einem Container eingebettet (1:n). Sie lassen sich nicht in anderen Containern wiederverwenden.
- **Ergebnisse:** `results[examId][candidateId][examinerId] = { tasks: { [taskId]: { passed, repeated, note, ratings } }, generalNote, passed? }`.
  - Jeder Prüfer bewertet **getrennt**. Grund: Ohne Server gibt es keine gemeinsame Wahrheit, und ein späteres Zusammenführen soll keine Werte überschreiben.
  - `passed` auf Ebene der Prüfung ist die Bestanden-Stimme dieses Prüfers für diese Stufe.
- **Bewertungskriterien:** `technique` (T), `reflexes` (R), `conditioning` (K) und `stability` (S), jeweils 1–10 oder leer.
- Felder, die nur der Kompatibilität dienen (`text`, `level`, `generalTasks`, `PreparationSettings`, `ExamSession`, `ExamTask`), stammen aus dem alten Modell. Neu darf sie niemand verwenden.

## 6. Datenquellen und Speicherung
- `data/techniques.json`, `data/tags.json` und `data/examiners.json` sind die Quelle für den Build. Der Ordner wird gebraucht und darf nicht gelöscht werden.
- Der Build validiert die Daten: eindeutige UUIDs, gültige Kategorie, bekannte Tags, ISO-Datum. Fehlende Übersetzungen erzeugen nur eine Warnung.
- Der Browser hat kein eingebautes SQLite. Gespeichert wird deshalb in `localStorage`, verschlüsselt mit dem Session-Schlüssel (AES-GCM, `src/lib/secureStorage.ts`):
  - `km-exam:v2:local-data`: lokal bearbeitete Techniken, Tags und Prüferprofile.
  - `km-exam:v2:events`: alle Container inklusive Bewertungen.
- Zusammenführen mit den Bundle-Daten: pro `id` gewinnt das neuere `modification_date` (`src/lib/dataStore.ts`).
- Nach einem Passwortwechsel sind lokale Daten nicht mehr lesbar. Dann gelten wieder die Bundle-Daten.
- **Jede Bewertung wird sofort gespeichert.** Grund: Früher gingen Bewertungen verloren, wenn vor dem nächsten Prüfling kein PDF gespeichert wurde.
- Es gibt keinen Datenaustausch zwischen Geräten. Jedes Gerät sieht nur seine eigenen Container und Bewertungen; der Austausch kommt mit dem Server. Das Modell ist bereits auf mehrere Prüfer ausgelegt.
- **Migration für die spätere Datenbank:** `pnpm migration:sql` (`build/generate-sql-migration.mjs`) erzeugt `migrations/001_initial.sql` mit allen Tabellen und befüllt Techniken, Tags und Prüfer.
- Alte Daten aus früheren Modellen werden verworfen, nicht migriert (Entscheidung des Auftraggebers).

## 7. Navigation
- **Hamburger-Menü** (`NavigationMenu.tsx`), in dieser Reihenfolge: Startseite, Prüfung, Techniken, Trainings (Platzhalter), Daten aktualisieren (Platzhalter).
- Unten im Menü stehen „Profil“ (mit Kürzel-Tag) und „Logout“ (nicht „App sperren“). Oben stehen der Titel „IKMI App“ und die Sprachwahl.
- **Während eine Prüfung durchgeführt wird, gibt es nie einen Menü-Button.** Das verhindert versehentliches Verlassen.
- **Startseite** (`Home.tsx`): Überschrift „Willkommen in der IKMI App“ und ein Lorem-ipsum-Text als Platzhalter.
- Routen in `App.tsx`: `home`, `exams`, `techniques`, `training`, `refresh-data`, `profile`.
- `ExamsPage.tsx` verwaltet die Unteransichten `list`, `event`, `run` und `review`.

## 8. Prüfung (Menüpunkt „Prüfung“)
Früher gab es die Menüpunkte „Zufallsprüfung“ und „Allgemeine Prüfung“. Beide sind in „Prüfung“ aufgegangen, weil mehrere Prüflinge gleichzeitig geprüft und ihre Daten vorab erfasst werden müssen.

### Übersicht (`EventList.tsx`)
- Die Container stehen in einer **Tabelle** (keine einfache Liste) mit den Spalten Datum, Beginn, Ort, Prüfungen/Stufen, Prüflinge und Prüfer (als Kürzel-Tags).
- Sortieren geht per Klick auf die Spaltenköpfe (`aria-sort`).
- Die Startsortierung ist Datum aufsteigend, danach Ort. Dazu wird kein erklärender Text angezeigt.
- **Filter:**
  - Suchfeld.
  - Stufe als Buttons.
  - Checkbox „Nur beteiligte Prüfungen“, standardmäßig an: Sie zeigt nur Container, die man erstellt hat oder in denen man Prüfer ist.
  - Checkbox „Archiviert“: Archivierte Container erscheinen nur, wenn dieser Filter aktiv ist.
- „Neu“ legt einen leeren Container mit dem heutigen Datum an.
- Ein Klick auf eine Zeile öffnet die Terminseite.
- In der Liste wird **nichts gestartet und nichts gelöscht**. Grund: Bei vielen Prüfungen müsste man sonst suchen, und es käme leicht zu Fehlbedienung.

### Terminseite (`EventPage.tsx`)
- **Bearbeitungsmodi schließen sich gegenseitig aus:** `none`, `event`, `candidate` oder `exam`. Solange ein Modus aktiv ist, sind die anderen Bearbeiten-Buttons deaktiviert.
- Ein neuer Termin startet im Modus `event`. Prüflinge und Prüfungen lassen sich erst nach dem Speichern anlegen.
- **Termindaten:**
  - Ort (Text).
  - Datum über den kompakten Datumsbutton mit nativem Picker (`showPicker()` mit Fallback).
  - Beginn über den `TimePicker` mit Button-Reihen: Stunden 08–20, Minuten 00/15/30/45. Zwischen 20 und 8 Uhr finden nie Prüfungen statt.
  - Archiviert.
  - Prüfer als Chips (Mehrfachauswahl).
  - Details (Textarea für Adresse, Kosten, Verpflegung, Dauer usw.).
- **Rechte:** Bearbeiten dürfen der Ersteller und die verknüpften Prüfer, den Termin löschen nur der Ersteller. Andere Prüfer sehen den Termin nur.
- **Prüflinge:**
  - Eine Liste plus ein „+“-Icon. Das Formular öffnet in einem Modal, damit nicht ständig eine Eingabemaske sichtbar ist.
  - Felder: Name, E-Mail, Stufen als Checkbox-Buttons, Prüfer-Kürzel als Buttons.
  - Der Button heißt „Absagen“. Absagen und Löschen müssen in einem Bestätigungsmodal bestätigt werden.
  - Abgesagte Prüflinge können nicht bewertet werden.
- **Prüfungen:**
  - „Neue Prüfung“ legt eine Prüfung mit eigener Reihenfolge an, „Neue Zufallsprüfung“ eine Zufallsprüfung.
  - Die Art wird nur als Badge angezeigt. Es gibt keine Art-Buttons ohne Funktion, weil die früher verwirrt haben.
  - Die Stufe der Prüfung wird über Buttons gewählt und **filtert nichts**.
  - Techniken kommen über den `TechniquePicker` hinzu: ein großes Modal mit Suche, eigenem Kategorie-Filter als Buttons (Alle, Stufe 1–5, Allgemein, Sonstige), Seiten zu 25 Einträgen und Antippen zum Auswählen. Übernommen wird über das Disketten-Icon. Grund: Es wird hunderte Techniken geben, Checkbox-Listen reichen dafür nicht.
  - Die Reihenfolge lässt sich per Drag & Drop mit der Maus und per Pfeil hoch/runter ändern (Touch). Einträge lassen sich entfernen. Löschen einer Prüfung muss bestätigt werden.
  - Gestartet wird eine Prüfung hier über das Play-Icon.
  - Zu jeder Prüfung stehen Chips der zulässigen Prüflinge mit „Bestanden x/y Prüfer“. Ein Klick öffnet die Besprechung.
- **Zufallsprüfung:**
  - Der Seed ist SHA-256 über `Ort|Datum|Stufe|laufende Nummer` (`selectExamTechniques` in `src/lib/random.ts`). Daraus wird der PRNG sfc32 initialisiert.
  - Fisher-Yates läuft zuerst innerhalb jeder Stufe (die ersten n Techniken werden genommen), danach über die gesamte Auswahl, immer mit demselben Zufallsstrom.
  - Die Anzahl je Stufe wird mit dem `Stepper` gewählt (−5, −1, Zahl, +1, +5). Der Wertebereich reicht von 0 bis zur Anzahl der Techniken der Stufe.
  - Die Liste wird **einmal erzeugt und gespeichert**, danach ist sie frei bearbeitbar wie eine eigene Prüfung.
  - Grund: Alle Prüfer erhalten auf jedem Gerät dieselbe Auswahl, und mehrere Zufallsprüfungen im selben Container unterscheiden sich.

### Durchführung (`ExamRunner.tsx`)
- Angeboten werden nur Prüflinge, die nicht abgesagt haben und für die Stufe der Prüfung angemeldet sind (`candidatesForExam`).
- **Jede Technik ist eine eigene Folie.** Oben stehen fixiert Titel und Teaser, dazu ein Details-Button, der das Modal öffnet.
- Prev/Next-Pfeile sitzen fixiert am Bildschirmrand (Tastatur funktioniert auch). „Zum Anfang“ springt zur ersten Technik.
- **Prüflingswahl nur über Chips.** Antippen blendet eine Kachel ein oder aus, standardmäßig sind alle ausgewählt. Gruppen gibt es bewusst nicht mehr.
- Kacheln stehen im Grid mit 1, 2 oder 3 Spalten. Bei vielen Prüflingen ist vertikales Scrollen erlaubt.
- **„Prüfung beenden“** führt zurück zur Terminseite. Eine Prüfung lässt sich jederzeit erneut öffnen.

### Bewertung je Prüfling und Technik (`CandidateEvaluation.tsx`)
- **Bestanden:** echter Switch (`Switch.tsx`). Aus ist er rot mit X, an grün mit Haken.
- **Wiederholung:** Toggle-Button mit kreisendem Pfeil ↻ in Amber.
- **T/R/K/S-Buttons:**
  - Ohne Wert zeigt der Button nur den Buchstaben, unauffällig.
  - Mit Wert zeigt er z. B. „T 5“, die Zahl in der Primärfarbe.
  - Ein Klick öffnet ein **Popover**, kein Modal, damit die Technik sichtbar bleibt. Das Raster hat 3 Spalten: 1–9, darunter 10 und „Keine“.
  - Ein Klick auf einen Wert schließt das Popover, auch wenn derselbe Wert erneut gewählt wird. „Keine“ löscht die Bewertung.
- Persönliche Notiz je Aufgabe.
- Der Bestanden-Switch für die ganze Prüfung ist die Stimme dieses Prüfers.

### Besprechung (`ExamReview.tsx`)
- Nach der Prüfung wählen die Prüfer einen Prüfling und eine Prüfung (Stufe). Alle Techniken stehen dann untereinander und bleiben bearbeitbar. Jede Änderung wird gespeichert.
- Jeder Prüfer gibt seine Bestanden-Stimme getrennt je Stufe ab. Beispiel: Stufe 2 bestanden, Stufe 3 nicht.
- Angezeigt wird „Bestanden x/y Prüfer“. y ist die Zahl der verknüpften Prüfer, mindestens 1 (`passVotes`).
  - Grund: Ohne Internet sprechen sich die Prüfer mündlich ab. Die Zählung über mehrere Prüfer wird erst nach einem späteren Server-Sync aussagekräftig.
- Unten stehen die Durchschnitte für T/R/K/S. Gezählt werden **nur gesetzte Werte**; Beispiel: 2 und 4 ergeben „3,0“ (`ratings.ts`).
- Darunter steht die allgemeine Prüfernotiz als Textarea.
- Weitere Buttons: Drucken als Icon, „Prüfung an Prüfling“ (E-Mail-Platzhalter) und Zurück zur Terminseite.

### Druck / PDF (Print-CSS über Tailwind-`print:` und `src/style.css`)
- Hintergründe sind im Druck transparent, auch bei Durchschnitt und Prüfernotiz, damit keine Tinte verschwendet wird.
- Je Aufgabe möglichst eine Zeile:
  - Statt der Buttons erscheint nur der aktive Status: „Bestanden“ in Grün oder „Nicht bestanden“ in Rot.
  - Danach folgt, durch ein Leerzeichen getrennt, „(wiederholt)“ ohne Farbe.
  - Die Bewertungen stehen am rechten Rand.
- Die Notiz wird nur gedruckt, wenn eine vorhanden ist.
- Die Überschrift „Allgemeine Prüfernotiz“ hat Abstand zum Text. Der Text ist kleiner und nicht fett.
- Unter 640 px steht der Drucken-Button oben rechts auf Höhe des Namens. Es darf nur **einen** sichtbaren Drucken-Button geben.

## 9. Techniken-Editor (`TechniqueManager.tsx`)
- **Tabs:** Techniken und Tags.
- **Techniken-Tabelle:**
  - Spalten Name, Kategorie und Tags, sortierbar über die Spaltenköpfe.
  - Das Suchfeld heißt „Suchen“. Es durchsucht nur die aktuelle Sprache: Name, Details und Tag-Namen.
  - Der Kategorie-Filter steht ab Tablet-Breite neben dem Suchfeld.
- **Tags-Tabelle:** Spalten Name und Änderungsdatum, beide sortierbar.
- **Pagination** unten an der Liste, kompakt: „Einträge pro Seite“ als Segment 10/20/Alle, daneben „1–20 von N“ und Pfeile nach links und rechts.
- **Bearbeiten** in einem großen Modal mit Sprach-Tabs (Flaggen):
  - Technik: Title als Input, Kategorie als Buttons, Tags als Mehrfachauswahl, Teaser als Textarea mit Zähler (max. 200), Details per WYSIWYG.
  - Tag: Title.
- Der Speichern-Button heißt einfach „Speichern“ bzw. zeigt das Disketten-Icon, nie „Prüfung speichern“.
- Die Upload/Download-Buttons sind Platzhalter und deaktiviert.

## 10. Profil (`Profile.tsx`)
- Der eingeloggte Prüfer bearbeitet hier Name, E-Mail, Kürzel (eindeutig, wird validiert), Land und Details.
- Das Land wird aus einer über `Intl.DisplayNames` lokalisierten Liste gewählt.
- „Passwort“ und „Passwort wiederholen“ werden angezeigt, aber im Prototyp **nicht gespeichert**.

## 11. PWA und Updates
- Die App ist installierbar: auf Android/Chrome und Desktop (Chrome/Edge) über „App installieren“, auf iOS über Safari → Teilen → „Zum Home-Bildschirm“. Voraussetzung ist HTTPS oder `localhost` mit `pnpm build` und `pnpm preview`; mit `pnpm dev` entsteht kein Service Worker.
- `registerType: 'prompt'`: `UpdatePrompt.tsx` prüft beim Start, danach stündlich und bei Rückkehr in den Vordergrund.
- Bei einem Update erscheint ein Hinweis mit „App neu starten“ und „Später“. Die App lädt **nie automatisch** neu.
  - Grund: Ein automatischer Reload mitten in der Prüfung würde stören. Der Nutzer startet selbst neu.

## 12. Internationalisierung
- Sprachen in genau dieser Reihenfolge: **EN, IT, DE, FR, ES**.
- Die Sprache wird über ein Flaggen-Dropdown gewählt (`LanguageSelect.tsx`, SVG-Flaggen, weil Emoji-Flaggen unter Windows fehlen). Es steht oben rechts im Login und im Menü.
- Die Auswahl wird dauerhaft in `localStorage` (`km-exam:language`) gespeichert. Standard ist die Browsersprache, sonst Deutsch.
- Deutsch (`de`) ist die Ausgangssprache. Bestehende deutsche Texte nie ändern, außer es wird ausdrücklich verlangt.
- **Übersetzungsreihenfolge immer:** zuerst Deutsch → Englisch, danach Englisch als Basis für Französisch (`fr`), Italienisch (`it`) und Spanisch (`es`).
- UI-Texte stehen in `src/i18n/messages.ts`. Jeder neue Key muss in allen fünf Sprachen angelegt werden; ein Test prüft das.
- Übersetzungen von Techniken und Tags stehen in `data/*.json` unter `translations` (en, fr, it, es). Fallback ist gewählte Sprache → Englisch → Deutsch (`src/i18n/localize.ts`).
- Datumsformat: lokalisiert, Tag zweistellig, **Monat als Kurzname**, dann Jahr (z. B. „24. Nov. 2026“, `src/lib/date.ts`). So werden Tag und Monat nicht verwechselt.

## 13. Visuelles Design und Interaktion
- **Farben:**
  - Primärfarbe `rgb(255, 105, 0)` (`primary`), Hintergrund `#192a3d` (`app`), dazu `panel` (heller) und `field` (dunkler).
  - Immer Dark-Mode.
  - Schlichtes, professionelles Layout ohne Schnickschnack; nichts darf verspielt oder amateurhaft wirken.
- **Container-Breite:** alle Seiten `max-w-5xl` mit `px-3 py-5`, ab `sm` `px-6 py-8`. Seiten dürfen sich in der Breite nicht unterscheiden. Ausnahmen sind nur Login und Update-Banner.
- **Bestätigungen:** Für destruktive Aktionen immer ein In-App-Modal (`ConfirmModal.tsx`), **nie** `window.confirm()`.
- **Switches** müssen wie Switches aussehen und sich so verhalten, mit gleitendem Knopf (`Switch.tsx`, `role="switch"`), nicht wie Checkbox-Buttons.
- **Icons statt Text** in Buttons, wo immer möglich (`Icons.tsx`, `IconButton`). Beispiele: Speichern = Diskette, Bearbeiten = Stift, Löschen = Papierkorb, Drucken = Drucker, Info = i-Symbol.
  - Jeder Icon-Button braucht `aria-label` bzw. Tooltip.
- **Native Selects vermeiden**, weil sie auf Tablets schlecht bedienbar sind. Eine überschaubare Menge an Optionen wird als Button-Reihe bzw. Radio-Gruppe mit `aria-pressed` dargestellt. Das gilt für Stufen, Kategorien, Prüfer-Kürzel, Zeiten und Seitengröße.
- **Zahlen** werden nicht per Input eingegeben, sondern mit dem Stepper (−5/−1/+1/+5, begrenzt; an der Grenze deaktiviert).
- **Modals** (`Modal.tsx`, natives `<dialog>`) sind groß (`max-w-5xl`), weil der Hintergrund unwichtig ist. Escape und Klick auf den Hintergrund schließen sie. Der Titel ist der tatsächliche Titel des Inhalts, z. B. der Technikname bei Details.
- **Details** werden über ein Info-Symbol am Ende des Titels geöffnet (`InfoButton.tsx`, Modal). Es gibt kein Aufklappen und kein Hover, weil Hover auf Touch-Geräten nicht funktioniert.
- **Bearbeitungsmodi** schließen sich immer gegenseitig aus.
- Abstände großzügig wählen: Labels und Texte kleben nicht an Feldern. Klare Hierarchie, responsive Layouts, auf Tablet Felder nebeneinander, wo es sinnvoll ist.
- Nummerierung von Aufgaben dezent in der Primärfarbe.
- Barrierefreiheit: `aria-*`-Attribute, Fokusringe in der Primärfarbe, Touch-Ziele mindestens ca. 36–44 px.

## 14. Bekannte Einschränkungen und Altlasten
- Die Dateien `Preparation.tsx`, `Exam.tsx`, `GeneralExamList.tsx`, `GeneralExamRun.tsx`, `GeneralExamEditor.tsx`, `src/lib/generalExamImport.ts` und `src/lib/storage.ts` stammen aus dem alten Modell und werden nicht mehr eingebunden. `EventEditor.tsx` wird nur noch für `createEmptyEvent` genutzt. Die Dateien nicht weiterentwickeln; bei Gelegenheit nach Rücksprache entfernen.
- Import/Export von Containern gibt es nicht. Pro Gerät wird nur lokal gearbeitet.
- Das JS-Bundle ist durch Tiptap größer als 500 kB, deshalb warnt der Build.
- Bearbeitet ein Prüfer Techniken lokal, betrifft das nur sein Gerät.
