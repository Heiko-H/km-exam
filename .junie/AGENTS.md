# Verbindliche UI-Regeln

- Uhrzeiten werden immer mit einem nativen Timepicker ausgewählt. Ein Timepicker darf niemals mit Stunden- oder Minuten-Buttons umgesetzt werden. Für Prüfungstermine gelten 08:00 bis 20:00 Uhr in 15-Minuten-Schritten.
- Druckansichten dürfen niemals Hintergrundfarben oder Schatten verwenden. Hintergründe bleiben transparent, damit keine Druckerfarbe verschwendet wird.
- Inhaltscontainer verwenden die gemeinsame Klasse `app-container`: 100 % Breite, maximal 64 rem, zentriert; horizontaler Innenabstand 0,75 rem, ab 40 rem 1,5 rem und ab 64 rem 2 rem. Breakpoints und Abstände werden zentral in `src/style.css` definiert, damit alle Seiten auf Desktop und Mobilgeräten gleich breit ausgerichtet sind.