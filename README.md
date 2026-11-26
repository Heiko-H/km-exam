# KM Prüfungsprogramm

Eine responsive, offline-fähige PWA zur Vorbereitung und Durchführung von Kampfsportprüfungen. Die App besteht ausschließlich aus einem Frontend (Vite, React, TypeScript und Tailwind CSS); es gibt weder Backend noch Datenbank.

## Lokal starten

1. `pnpm install`
2. `.env.example` nach `.env.local` kopieren und `APP_PASSWORD` durch ein langes, zufälliges Passwort ersetzen (mindestens 12 Zeichen).
3. `pnpm dev`

Ohne `APP_PASSWORD` startet Vite absichtlich nicht. Tests laufen mit `pnpm test`, ein produktionsnaher Build mit `pnpm build`.

## Anmeldung

Die Anmeldung erfolgt mit der E-Mail eines Prüfers und dem gemeinsamen App-Passwort. Testprüfer im Prototyp: `peter@gmail.com`, `heiko@gmail.com` und `kai@gmail.com`. Das Passwort ist für alle Prüfer gleich; die Passwortfelder im Profil werden im Prototyp nicht gespeichert. Die Sitzung endet automatisch um 0 Uhr.

## Prüfungsdaten pflegen

- Techniken **und** allgemeine Aufgaben stehen gemeinsam in `data/techniques.json`; allgemeine Aufgaben haben `category: "general"`. Titel müssen eindeutig sein.
- Tags stehen in `data/tags.json`, die Prüfer des Prototyps in `data/examiners.json`.
- Für jeden Eintrag können Übersetzungen in `translations.en`, `translations.fr`, `translations.it` und `translations.es` ergänzt werden. Jede Übersetzung enthält `title` und optional `teaser` und `details`. Deutsch bleibt die Ausgangssprache; fehlende Übersetzungen fallen auf Englisch und anschließend auf Deutsch zurück. Der Build weist auf fehlende Übersetzungen hin.
- Die Oberfläche ist auf Deutsch, Englisch, Französisch, Italienisch und Spanisch verfügbar. Die gewählte Sprache wird im Browser gespeichert und beim nächsten Öffnen wiederhergestellt.
- Beim Vite-Start/Build werden alle JSON-Dateien mit PBKDF2-SHA-256 (310.000 Iterationen) und AES-256-GCM verschlüsselt und als statisches Modul in das App-Bundle eingebettet. Es gibt zur Laufzeit keinen Datenabruf.

## Datenmodell, Speicherung und Migration

- **IDs** sind immer UUIDs.
- **Kategorien:** `level-1` … `level-5`, `general` (allgemeine Aufgaben) und `other` („Sonstige“, z. B. für spätere Trainings; nicht Teil von Prüfungen).
- **Technik:** `id`, `category`, `tags` (Tag-UUIDs), `modification_date`, `title`, `teaser` (Kurzbeschreibung, max. 200 Zeichen), `details` (HTML aus dem WYSIWYG-Editor Tiptap; wird vor der Anzeige mit DOMPurify bereinigt), `translations`.
- **Tag:** `id`, `title`, `modification_date`, `translations`. Ein Tag kann vielen Techniken zugeordnet sein und umgekehrt.
- **Prüfer:** `id`, `name`, `email`, `shortcode` (eindeutig, wird überall als Kürzel-Tag angezeigt; der Name erscheint als Tooltip), `country`, `details`.
- **Prüfungscontainer** (Menüpunkt „Prüfung“): Ort, Datum, Beginn, Archiviert, verknüpfte Prüfer, Details, enthaltene Prüfungen (eigene Reihenfolge oder Zufallsauswahl) und Prüflinge (Name, E-Mail, Stufen, Prüfer-Kürzel, abgesagt). Prüfungen und Prüflinge gehören immer genau zu einem Container. Bearbeiten dürfen Ersteller und verknüpfte Prüfer, löschen nur der Ersteller. Die Übersicht ist nach Datum und danach nach Ort sortiert; archivierte Container erscheinen nur mit dem Filter „Archiviert“.
- **Bewertungen** werden pro Prüfung, Prüfling und Prüfer getrennt gespeichert (Bestanden, Wiederholt, T/R/K/S, Notizen, allgemeine Prüfernotiz und Gesamtentscheidung je Stufe). Beim Durchführen werden nur nicht abgesagte Prüflinge der passenden Stufe angeboten.
- **Lokale Speicherung:** Der Browser hat keine eingebaute SQLite-Datenbank (nur `localStorage`/IndexedDB; SQLite ginge nur per WebAssembly). Prüfungscontainer inklusive Bewertungen sowie lokal bearbeitete Techniken, Tags und Profile liegen in `localStorage` und sind dort mit dem aus dem Passwort abgeleiteten Schlüssel (AES-GCM) verschlüsselt. Beim Laden gewinnt pro `id` der Eintrag mit dem neueren `modification_date`. Nach einem Passwortwechsel sind lokal gespeicherte Daten nicht mehr lesbar; dann gelten wieder die Daten aus dem Bundle.
- **Kein Austausch zwischen Geräten:** Ohne Server sieht jedes Gerät nur seine eigenen Container und Bewertungen. Das Datenmodell ist bereits für mehrere Prüfer ausgelegt.
- **Migration:** `pnpm migration:sql` erzeugt aus den JSON-Dateien `migrations/001_initial.sql` (Tabellen für Techniken, Übersetzungen, Tags, Prüfer, Prüfungscontainer, Prüfungen, Prüflinge und Bewertungen; befüllt werden Techniken, Tags und Prüfer).

## Passwort und Sicherheitsgrenzen

Das Passwort wird **nicht** in den Quellcode geschrieben. Lokal kommt es aus der nicht eingecheckten `.env.local`; für GitHub Actions muss ein Repository-Secret namens `APP_PASSWORD` gesetzt werden. Beim nächsten Build wird das Secret zur Verschlüsselung der Daten verwendet. Die App prüft das Passwort, indem sie die Daten im Browser entschlüsselt; nach einem erfolgreichen Login bleibt der abgeleitete Schlüssel nur im `sessionStorage` des aktuellen Tabs. Fehlversuche erzeugen lokal gespeicherte Fibonacci-Wartezeiten.

Eine reine Frontend-App kann kein echtes Zugriffsgeheimnis gegenüber Personen schützen, die das ausgelieferte JavaScript kontrollieren oder beliebig verändern können. Die Verschlüsselung schützt insbesondere davor, Techniken und Details direkt lesbar im veröffentlichten Bundle zu finden; sie ersetzt keine serverseitige Authentifizierung und ist kein Schutz gegen gezielte Offline-Passwortversuche. Die JSON-Quelldateien im öffentlichen Git-Repository selbst sind nicht verschlüsselt. Wenn auch die Quelldaten geheim bleiben sollen, müssen sie aus dem öffentlichen Repository herausgehalten werden.

## Zufall und Persistenz

Eine Zufallsprüfung nutzt SHA-256 über `Ort|Datum|Stufe|laufende Nummer der Prüfung im Container` und Fisher-Yates zuerst innerhalb jeder Stufe und danach über alle ausgewählten Techniken. Die Liste wird einmalig beim Anlegen erzeugt und gespeichert; danach lässt sie sich wie eine eigene Prüfung bearbeiten. Alle Bewertungen werden sofort verschlüsselt im `localStorage` gespeichert; eine beendete Prüfung kann jederzeit erneut geöffnet werden.

## GitHub Pages

Das Repository muss `km-exam` heißen (Base-Pfad `/km-exam/`). In den Repository-Einstellungen unter **Secrets and variables → Actions** das Secret `APP_PASSWORD` setzen und GitHub Pages als Veröffentlichungsquelle **GitHub Actions** auswählen. Der Workflow `.github/workflows/deploy.yml` testet und baut die App bei Pushes auf `master` und veröffentlicht `dist`.

## App installieren

Die veröffentlichte Website ist eine Progressive Web App (PWA). Öffne sie über HTTPS und installiere sie über die Browserfunktion **App installieren** (Chrome/Android und unterstützte Desktop-Browser). Auf iPhone und iPad öffnest du die Seite in Safari, tippst auf **Teilen** und wählst **Zum Home-Bildschirm**. Die App kann anschließend wie eine installierte Anwendung im eigenen Fenster gestartet werden.

Die App prüft beim Öffnen, danach stündlich und bei Rückkehr in den Vordergrund auf neue Versionen. Bei einem Update erscheint ein Hinweis; die App wird nicht automatisch neu geladen. Wähle **App neu starten**, wenn du das Update sofort übernehmen möchtest, oder starte die App später selbst erneut.
