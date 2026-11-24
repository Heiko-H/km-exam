# KM Prüfungsprogramm

Eine responsive, offline-fähige PWA zur Vorbereitung und Durchführung von Kampfsportprüfungen. Die App besteht ausschließlich aus einem Frontend (Vite, React, TypeScript und Tailwind CSS); es gibt weder Backend noch Datenbank.

## Lokal starten

1. `pnpm install`
2. `.env.example` nach `.env.local` kopieren und `APP_PASSWORD` durch ein langes, zufälliges Passwort ersetzen (mindestens 12 Zeichen).
3. `pnpm dev`

Ohne `APP_PASSWORD` startet Vite absichtlich nicht. Tests laufen mit `pnpm test`, ein produktionsnaher Build mit `pnpm build`.

## Prüfungsdaten pflegen

- Techniken in `data/techniques.json` ergänzen. Jede Technik hat `level` (1–5), `text` und optional `details`. Texte müssen eindeutig sein; eine Technik darf nur einer Stufe zugeordnet werden.
- Allgemeine Aufgaben in `data/general-tasks.json` pflegen. Jede Aufgabe hat eine eindeutige `id`, einen `text` und optional `details`.
- Für jede Technik und allgemeine Aufgabe können Übersetzungen in `translations.en`, `translations.fr`, `translations.it` und `translations.es` ergänzt werden. Jede Übersetzung enthält `text` und – sofern der deutsche Eintrag `details` hat – auch übersetzte `details`. Deutsch bleibt die Ausgangssprache; fehlende Übersetzungen fallen auf Englisch und anschließend auf Deutsch zurück. Der Build weist auf fehlende Übersetzungen hin.
- Die Oberfläche ist auf Deutsch, Englisch, Französisch, Italienisch und Spanisch verfügbar. Die gewählte Sprache wird im Browser gespeichert und beim nächsten Öffnen wiederhergestellt.
- Beim Vite-Start/Build werden beide JSON-Dateien mit PBKDF2-SHA-256 (310.000 Iterationen) und AES-256-GCM verschlüsselt und als statisches Modul in das App-Bundle eingebettet. Es gibt zur Laufzeit keinen Datenabruf.

## Datenmodell, Speicherung und Migration

- **Kategorien:** `level-1` … `level-5`, `general` (allgemeine Aufgaben) und `other` („Sonstige“, z. B. für spätere Trainings; nicht Teil von Prüfungen). Bestehende Einträge mit `level` werden beim Build automatisch auf `category: "level-N"` abgebildet.
- **Felder einer Technik:** `id`, `category`, `tags` (Liste von Tag-IDs), `modification_date` (`YYYY-MM-DD` bzw. ISO-Zeitstempel), `text`, `details`, `translations`. Fehlen `id`, `tags` oder `modification_date`, ergänzt der Build sie (IDs stabil aus Stufe und Text).
- **Tags** stehen in `data/tags.json` (`id`, `text`, `modification_date`, `translations`). Ein Tag kann vielen Techniken zugeordnet sein und umgekehrt.
- **Lokale Speicherung:** Der Browser hat keine eingebaute SQLite-Datenbank (nur `localStorage`/IndexedDB; SQLite ginge nur per WebAssembly). Allgemeine Prüfungen sowie lokal bearbeitete Techniken und Tags liegen in `localStorage` und sind dort mit dem aus dem Passwort abgeleiteten Schlüssel (AES-GCM) verschlüsselt. Beim Laden gewinnt pro `id` der Eintrag mit dem neueren `modification_date`. Nach einem Passwortwechsel sind lokal gespeicherte Daten nicht mehr lesbar; dann gelten wieder die Daten aus dem Bundle.
- **Allgemeine Prüfungen** lassen sich in der Übersicht als JSON-Datei exportieren und wieder importieren (zusammengeführt über `modification_date`).
- **Migration:** `pnpm migration:sql` erzeugt aus den JSON-Dateien `migrations/001_initial.sql` (Tabellen für Techniken, Übersetzungen, Tags, Technik-Tag-Zuordnung und allgemeine Prüfungen mit Reihenfolge).

## Passwort und Sicherheitsgrenzen

Das Passwort wird **nicht** in den Quellcode geschrieben. Lokal kommt es aus der nicht eingecheckten `.env.local`; für GitHub Actions muss ein Repository-Secret namens `APP_PASSWORD` gesetzt werden. Beim nächsten Build wird das Secret zur Verschlüsselung der Daten verwendet. Die App prüft das Passwort, indem sie die Daten im Browser entschlüsselt; nach einem erfolgreichen Login bleibt der abgeleitete Schlüssel nur im `sessionStorage` des aktuellen Tabs. Fehlversuche erzeugen lokal gespeicherte Fibonacci-Wartezeiten.

Eine reine Frontend-App kann kein echtes Zugriffsgeheimnis gegenüber Personen schützen, die das ausgelieferte JavaScript kontrollieren oder beliebig verändern können. Die Verschlüsselung schützt insbesondere davor, Techniken und Details direkt lesbar im veröffentlichten Bundle zu finden; sie ersetzt keine serverseitige Authentifizierung und ist kein Schutz gegen gezielte Offline-Passwortversuche. Die JSON-Quelldateien im öffentlichen Git-Repository selbst sind nicht verschlüsselt. Wenn auch die Quelldaten geheim bleiben sollen, müssen sie aus dem öffentlichen Repository herausgehalten werden.

## Zufall und Persistenz

Die Auswahl nutzt SHA-256 über `Vorname|Nachname|Stufe|Gesamtanzahl Prüflinge` und Fisher-Yates zuerst innerhalb jeder gewählten Stufe und danach über alle ausgewählten Techniken. Gleich geschriebene Namen, dieselbe Stufe, Prüflingsanzahl und dasselbe lokale Datum ergeben dadurch bei identischem Datenstand dieselbe Reihenfolge. Groß-/Kleinschreibung bleibt im Seed erhalten; führende und abschließende Leerzeichen werden entfernt. Laufende Prüfung samt Bewertungen und Merktext wird im `localStorage` gespeichert.

## GitHub Pages

Das Repository muss `km-exam` heißen (Base-Pfad `/km-exam/`). In den Repository-Einstellungen unter **Secrets and variables → Actions** das Secret `APP_PASSWORD` setzen und GitHub Pages als Veröffentlichungsquelle **GitHub Actions** auswählen. Der Workflow `.github/workflows/deploy.yml` testet und baut die App bei Pushes auf `main` und veröffentlicht `dist`.

## App installieren

Die veröffentlichte Website ist eine Progressive Web App (PWA). Öffne sie über HTTPS und installiere sie über die Browserfunktion **App installieren** (Chrome/Android und unterstützte Desktop-Browser). Auf iPhone und iPad öffnest du die Seite in Safari, tippst auf **Teilen** und wählst **Zum Home-Bildschirm**. Die App kann anschließend wie eine installierte Anwendung im eigenen Fenster gestartet werden.

Die App prüft beim Öffnen, danach stündlich und bei Rückkehr in den Vordergrund auf neue Versionen. Bei einem Update erscheint ein Hinweis; die App wird nicht automatisch neu geladen. Wähle **App neu starten**, wenn du das Update sofort übernehmen möchtest, oder starte die App später selbst erneut.