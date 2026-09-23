# Kaffee

Persönliche, offlinefähige Kaffee-PWA für Pour Over, Pour Over Ice und trinkfertigen Cold Brew. Statisches HTML/CSS/JavaScript, ohne Backend, Konto oder Build-Schritt.

## Lokal starten

Im Projektordner `python -m http.server 8934 --bind 127.0.0.1` starten und `http://127.0.0.1:8934` öffnen. Alternativ die vorhandene `start-server.bat` verwenden. Die App benötigt HTTP über localhost oder HTTPS; direktes Öffnen als Datei unterstützt keine PWA-Funktionen.

## Neuer Ablauf

- Methode → Rezept → Zubereitung. Neue Rezepte werden manuell erfasst, mit optionalem Quellenlink.
- Zutaten direkt in Gramm eingeben oder das Verhältnis anpassen. Wasserangaben in ml können näherungsweise als Gramm übernommen werden; Eis wird gewogen. Das Verhältnis verwendet das gesamte Wasser inklusive Eis.
- Die Zielmenge skaliert alle Zutaten und Aufgüsse. Sie bezeichnet die eingesetzte Wasser-/Eismenge, nicht den exakten Ertrag nach dem Filtern. Mahlgrad, Temperatur und Zeiten bleiben konstant.
- Kaffee lässt sich in 0,1-g-Schritten, die Zielmenge in 5-ml-Schritten verändern. Verhältnisangaben erscheinen mit einer Nachkommastelle. Gerechnete Werte bleiben intern präzise; die Anzeige rundet. Eine unveränderte Rezeptvorlage darf auch eine Zielmenge ausserhalb des 5-ml-Rasters haben.
- Blooming und Aufgüsse sind optional. Mengen können als Zugabe oder kumuliert eingegeben werden. Sobald Schritte vorhanden sind, müssen sie zusammen die Wassermenge ergeben. Zeiten sind optional: Zeitpunkt ab Start oder Dauer. Die Übersicht zeigt alle Schritte; ein optionaler Timer zählt die verstrichene Zeit, ohne automatische Schrittwechsel oder Alarme.
- Cold Brew zeigt eine Ziehzeit oder einen Zeitraum in Stunden. Kein laufender Ansatz und keine Erinnerungen.
- Bohnen sind optional; Name genügt. Röster, frei ergänzbare Aufbereitung, Röstdatum und Notizen können ergänzt werden. Archivieren bewahrt vergangene Versuche.
- «Fertig» speichert die verwendeten Einstellungen als eigenständigen Versuch. Bewertungen können später ergänzt werden: gut/mittel/schlecht sowie Säure und Bitterkeit jeweils zu wenig/passend/zu viel.
- Versuche lassen sich wiederholen und im Verlauf nach Methode und Gesamturteil filtern. Rezeptwerte werden nur ausdrücklich überschrieben. Bei einer Bohnenauswahl ist die Übernahme des letzten Versuchs ebenfalls ausdrücklich.

## Daten und Offline-Nutzung

Version 2 verwendet `kaffee_state_v2` im lokalen Browser-Speicher. Export und Import sichern alle Rezepte, Bohnen und Versuche in einer versionierten JSON-Datei. Ein Import prüft auch verschachtelte Daten, IDs und Verweise und ersetzt den Stand erst nach Bestätigung. Fehlgeschlagene Schreibvorgänge ändern den Arbeitsspeicher nicht; erkannte Änderungen aus einem anderen Fenster verhindern ein unbemerktes Überschreiben.

Vorhandene V1-Daten werden nicht migriert. Die App bietet zunächst einen Export des alten Stands und einen bestätigten Neustart an. Beschädigte V2-Daten werden ebenfalls nicht stillschweigend ersetzt. Ohne Export lassen sich nach dem Neustart entfernte Daten nicht wiederherstellen. Das Löschen von Browserdaten entfernt auch die neue Sammlung.

Nach dem ersten vollständigen Laden und Aktivieren des Service Workers funktionieren die App und sämtliche lokalen Daten auch offline. Externe Quellenlinks benötigen Internet. Timer und noch nicht gespeicherte Formulare sind sitzungsgebunden; sie werden bei einem vollständigen Neuladen nicht wiederhergestellt. Bei ungespeicherten Änderungen warnt der Browser, soweit die Plattform das unterstützt.

## Entwicklung und Prüfung

Die aktive Implementierung liegt in `src/v2/`: `model.js` für Berechnung/Validierung, `store.js` für transaktionales Speichern, `components.js` für wiederverwendbare Formulare und `app.js` für die Ansichten. Die früheren Module bleiben zur Bewahrung bestehender lokaler Änderungen im Repository; `index.html` lädt ausschliesslich die neue Oberfläche.

Nach Installation der vorhandenen Dev-Abhängigkeiten:

```text
npm.cmd test
npm.cmd run test:e2e
npm.cmd run test:pwa
```

`npm.cmd` umgeht unter Windows lediglich die häufig deaktivierte PowerShell-Ausführung von `npm.ps1`. Auf anderen Systemen genügt `npm`. Die Browserprüfungen starten selbst einen lokalen Testserver und verwenden isolierte Browserdaten. Playwright benötigt einen installierten Chromium-Browser (`npx.cmd playwright install chromium`, falls noch nicht vorhanden).

Die Tests prüfen Mengen/Verhältnisse, Aufgüsse, Zeitangaben, unveränderte Versuchsdaten, optionale Bewertungen, Archivierung, Backups, Speicherfehler, Neustart und Offline-Nutzung. Mobile Bildschirmaufnahmen entstehen unter `tools/shots/v2-*.png`.

Bei Änderungen an ausgelieferten Dateien muss die Cache-Version in `sw.js` erhöht werden. Ein bestehender offener Tab erhält die neue Oberfläche beim nächsten Laden nach Aktivierung des aktualisierten Workers. `test:deploy` ist der vorhandene Prüfablauf für die frühere veröffentlichte App; für diese neue Version wurde keine Veröffentlichung vorgenommen.

## Gestaltungsstand

Die neue Oberfläche stellt die vereinbarten Funktionen mit klarer Typografie, mobil bedienbaren Feldern und dezenten, abschaltbaren Übergängen bereit. Die gemeinsame Auswahl einer endgültigen visuellen Richtung bleibt die anschliessende Designrunde.

Die Auswertung der bereitgestellten Inspirationsbilder und der Vorschlag für diese Runde stehen in [DESIGN.md](DESIGN.md). Die aktuelle Designrunde vereinheitlicht alle Seitentitel und Listen: einzeilige Haupttitel ohne Untertitel, derselbe Listenheader und ruhige Listenelemente mit Pfeil rechts. Die Hauptseite enthält nur die Methodenauswahl; «Zuletzt gebrüht» ist dort entfernt.
