# Visuelle Richtung — zur gemeinsamen Ausarbeitung

Grundlage sind die Bilder in `tools/inspiration/`. Die Sammlung zeigt unterschiedliche Anwendungen, aber eine wiederkehrende Gestaltung: starke Typografie, grosse Zahlen, Weissraum, Schwarz-Weiss-Kontraste, klare Raster und einzelne technische Details wie Skalen und feine Linien. Dies ist ein Vorschlag für die nächste Designrunde, noch keine abgeschlossene Gestaltungsvorgabe.

## Übergabe für den nächsten Schritt

Stand nach dem funktionalen Neuaufbau und den Mengenkorrekturen: **Als Nächstes steht die gemeinsame Design-Ausarbeitung an.** Die funktionalen Anforderungen sind bereits besprochen und umgesetzt. Sie müssen nicht erneut erhoben werden. Der Nutzer hat ausdrücklich mehrere verschiedene Inspirationen geliefert und kein einzelnes Design zur Kopie ausgewählt.

### Verbindliche Entscheidungen aus der ersten Designrunde

- Die Startseite enthält nur die Methodenauswahl. Eine Sektion «Zuletzt gebrüht» gehört nicht auf die Hauptseite; Versuche bleiben über Verlauf und das jeweilige Rezept erreichbar.
- Jede Seite verwendet denselben Titelmassstab und eine einzeilige Hauptüberschrift. Untertitel bzw. beschreibende Texte direkt unter dem Seitentitel werden nicht verwendet. Der kleine monospaced Kicker oberhalb des Titels bleibt als Orientierung erhalten.
- Listen verwenden denselben Header: dezente monospaced Bezeichnung links, optionale Aktion rechts, eine feine dunkle Trennlinie darunter.
- Listenelemente verwenden dasselbe Muster: grosse ruhige Textzeile, optionale kleine Metadatenzeile, Pfeil rechts. Die Methoden behalten ihre kleine laufende Kennung links; Rezept- und Bohnenzeilen erhalten keine zusätzliche Nummerierung oder Zähler rechts.
- Die aktuelle Richtung ist hell und typografisch: warmes Off-White, fast schwarzer Text, graue Linien, Signalrot nur für kleine Zustands- und Skalenakzente. Der Timer bleibt als dunkle, klar abgegrenzte Fläche.

### Nutzer und Ziel

- Persönliche App für einen Kaffee-Einsteiger, der Rezepte und den Einfluss von Mahlgrad, Verhältnis und weiteren Einstellungen kennenlernen möchte. Bohnen wechseln häufig. Aktuell eine Mühle; keine Geräteverwaltung nötig.
- Die erste App wurde als nicht flüssig und optisch schwach empfunden. Gewünscht sind eine schöne, moderne, stilvolle typografische Gestaltung und leichte, schöne Animationen.
- Die jetzige V2-Oberfläche ist eine funktionale Grundlage. Ihre grünen Akzente, abgerundeten Karten und Anordnung sind keine bestätigte endgültige Designvorgabe.
- Die visuelle Richtung unten ist die Interpretation des Assistenten aus den Referenzen. Insbesondere Signalrot, warme Weisswerte, dunkler Timer und die endgültige Schrift sind noch Vorschläge, keine ausdrücklich getroffenen Nutzerentscheidungen.

### Funktionale Leitplanken für alle Entwürfe

| Bereich | Bereits vereinbart |
| --- | --- |
| Methoden | Pour Over, Pour Over Ice, trinkfertiger Cold Brew. Weitere Methoden später möglich. |
| Hauptablauf | Methode → Rezept → Zubereitung. Menge, optionale Bohne und Anpassungen sind in der Zubereitung erreichbar. |
| Rezeptanlage | Manuelle Übernahme aus Videos/Webseiten, optional Quellenlink. Konkrete Mengen oder Verhältnis eingeben, ohne selbst Prozentwerte ausrechnen zu müssen. |
| Mengen | Kaffee in 0,1-g-Schritten; Zielmengensteuerung in 5-ml-Schritten. Verhältnis in allen Anzeigen mit genau einer Nachkommastelle. Intern präzise rechnen. |
| Zielmenge | Näherungsweise Wasser inklusive Eis, ohne Schätzung des Wasserverlusts im Kaffeesatz. Eis in Gramm wiegen. Unveränderte Quellrezepte dürfen Mengen ausserhalb des 5-ml-Rasters behalten. |
| Skalierung | Kaffee, Wasser, Eis, Blooming und Aufgussmengen skalieren gemeinsam; Mahlgrad, Temperatur und Zeiten bleiben gleich. Verhältnisänderung hält Wasser/Eis fest und berechnet Kaffee. |
| Aufgüsse | Optionales Blooming und beliebig viele Aufgüsse, auch nur Blooming plus ein Aufguss. Zugabe oder kumulierte Menge eingeben; Zeitpunkt ab Start, Dauer oder keine Zeit. |
| Brühbegleitung | Alle Schritte in einer Übersicht, optionaler Timer für Pour Over und Iced. Kein erzwungener Schrittassistent. Cold Brew zeigt nur die Ziel-Ziehzeit; der Nutzer trackt selbst. |
| Bohnen | Name erforderlich; Röster, Aufbereitung (Washed, Natural, Honey, Fermented usw. mit Freitext), Röstdatum, Notizen optional. Archivieren statt Verlust vergangener Versuche. |
| Einstellungen | Ausgangsrezept und einzelne Versuche unterscheiden. Bohne auswählen lädt nicht automatisch alte Einstellungen; «Letzten Versuch übernehmen» ausdrücklich anbieten. |
| Abschluss | «Fertig» speichert den Versuch. Bewertung sofort oder später, alle Felder optional und ohne Vorauswahl. |
| Bewertung | Gesamturteil gut / mittel / schlecht. Säure und Bitterkeit unabhängig jeweils zu wenig / passend / zu viel. Optionale Notiz. Es geht um persönliche Passung, nicht um eine objektive Intensitätsskala. |
| Lernen | Frühere Versuche wiederholen und den Verlauf nach Methode und Gesamturteil filtern. Keine automatischen Verbesserungshinweise. Gelungene Anpassungen ausdrücklich ins Ausgangsrezept übernehmen. |
| Daten | Lokal, offline, Export/Import. Kein Konto, Backend oder Sync. Alte V1-Daten werden nicht gebraucht; der implementierte Neustart fragt vor dem Entfernen nach Bestätigung. Neue V2-Daten beim Designumbau erhalten. |

### Konkreter Einstieg in die Designarbeit

1. Die Originalbilder erneut visuell ansehen; diese Zusammenfassung ersetzt nicht ihre Betrachtung. Es liegen 18 PNG-Dateien vor. Nicht den alten Prototyp unter `claude_design/` als neue Vorgabe behandeln.
2. Eine zusammenhängende Richtung anhand von Methodenauswahl, Rezeptauswahl, Zubereitung und Bewertung ausarbeiten. Den Schwerpunkt auf Typografie, Informationshierarchie und Mengenbedienung legen. Technische Skalen nur dort einsetzen, wo sie eine Funktion erklären oder bedienen.
3. Als durchgängiges Beispiel «Iced aus dem Video»: 19 g Kaffee, 120 g Wasser, 100 g Eis; 40 g Blooming mit 30 s Dauer, danach 80 g Aufguss bei 0:45. 220 ml auf 330 ml skalieren ergibt 28,5 g Kaffee, 180 g Wasser, 150 g Eis; Schritte 60 g und 120 g, kumuliert 60 g und 180 g. Verhältnis angezeigt 1 : 11,6.
4. Für den Verlauf dieselbe Bohne mit Mahlgrad 24 und 22 verwenden und die Filter für Methode sowie Gesamturteil zeigen. Eine Beispielbohne ist «Ethiopia», Aufbereitung «Anaerobic fermented». Diese Inhalte sind Demo-/Testdaten, keine ungefragt einzuspielenden Nutzerdaten.
5. Nach der Beurteilung der zentralen Ansichten die Gestaltung konsistent auf Rezepteditor, Bohnen, Verlauf und Datenansichten übertragen. Leere Sammlung, lange Namen, fehlende optionale Angaben, Eingabefehler und unbewertete Zustände mitdenken.

### Technischer Anschluss und geprüfter Stand

- Projekt: `D:\Claude\PWA_coffe_app`. Aktiver Einstieg: `index.html` → `src/v2/app.js` und `src/v2/app.css`. Vanilla JavaScript, kein Framework oder Build-Prozess. Keine neuen Abhängigkeiten für einfache Animationen erforderlich.
- Ansichten in `src/v2/app.js`; Formulare, Mengenfelder, Rezeptübersicht und Aufgüsse in `src/v2/components.js`. Berechnung/Validierung in `src/v2/model.js`, lokale Speicherung in `src/v2/store.js`. Weitere Details und Startbefehle in `README.md`.
- Lokal vorhanden: Archivo in 400, 600 und 800 unter `src/fonts/`. Andere Schriften sind noch nicht ausgewählt oder beschafft. Neue Schriften müssen bei Verwendung auch offline verfügbar sein.
- `src/v2/app.css` enthält bereits Fokuszustände, Touchflächen, tabellarische Zahlen und `prefers-reduced-motion`. Diese Eigenschaften beim Neugestalten bewahren. Den Skill `make-interfaces-feel-better` bei der Designumsetzung nutzen; dessen Anweisungen wurden in der bisherigen Arbeit bereits gelesen.
- Zahlenkorrektur umgesetzt: passende Schrittbasis statt des früheren `min=0.01`, Kaffee `step=0.1`, Zielmenge und Slider `step=5`, Verhältnisformatierung mit einer Nachkommastelle. Keine Rückkehr zu vier Nachkommastellen in berechneten Kaffee-/Verhältniseingaben.
- Bestehende Tests: `npm.cmd test` (alte Berechnungsprüfungen plus 17 V2-Tests), `npm.cmd run test:e2e`, `npm.cmd run test:pwa`. Nach dem Neuaufbau waren alle erfolgreich; nach der jüngsten Zahlenkorrektur wurde der vollständige E2E-Ablauf inklusive Offline-Prüfung erneut erfolgreich ausgeführt. Er prüft jetzt auch Pfeiltasten-Schritte, Slider-Schritte, Verhältnisrundung und den Erhalt einer unveränderten 222-ml-Vorlage.
- Mobile Aufnahmen des aktuellen funktionalen Stands: `tools/shots/v2-home.png`, `v2-brew.png`, `v2-history-filters.png`. Das sind keine Zielentwürfe. E2E prüft unter anderem Breiten von 320, 390 und 1100 px.
- Service-Worker-Cache aktuell `kaffee-shell-v4` in `sw.js`. Bei ausgelieferten Änderungen Version erhöhen und neue Assets in den Offline-Cache aufnehmen. Keine Veröffentlichung erfolgt; `test:deploy` gehört noch zum alten veröffentlichten Stand.
- Der Arbeitsbaum enthält schon vor dem Neuaufbau Änderungen des Nutzers und unversionierte Dateien. Alte Module und diese Änderungen wurden bewahrt. Keine pauschalen Resets, Löschungen oder Bereinigungen durchführen. Für Git-Lesezugriffe ist hier gegebenenfalls `git -c safe.directory=D:/Claude/PWA_coffe_app …` nötig.

## Was wir aus den Referenzen übernehmen

| Referenz | Beobachtung | Übertragung auf Kaffee |
| --- | --- | --- |
| Radio, `Screenshot 2026-08-07 103906.png` / `Screenshot 2026-09-05 134210.png` | Grosse Zahlen, typografische Listen, feine Skala mit rotem Marker | Zielmenge als zentrale Zahl; Mengensteuerung mit Skala; Rezeptauswahl als gut lesbare Textliste |
| Uhr, `Screenshot 2026-08-07 104714.png` | Deutlicher Grössenunterschied zwischen Hauptzahl und Metadaten, helle und dunkle Flächen | Timer und Kaffeemenge erhalten optisches Gewicht; Einheiten und Beschriftungen bleiben zurückhaltend |
| Plakate und Etiketten, `Screenshot 2026-08-07 120000.png`, `120022.png`, `120046.png` | Präzises Raster, grosse Groteskschrift, kleine technische Beschriftung und Trennlinien | Methodennummern, Rezeptdaten und Verlaufsfilter mit klarer Ausrichtung; kleine Monospace-Akzente für Zeiten und Einheiten |
| Musiklabel, `Screenshot 2026-09-05 134921.png` | Typografisches Menü und wenige, starke Aktionen | Grosse Rezeptnamen und ein klarer Abschluss des Brühvorgangs |
| Kaffeeprodukt, `Screenshot 2026-09-05 135345.png` | Reduzierte Produktinformation und viel freie Fläche | Bohnen als sorgfältig gesetzte Namen und Aufbereitungsangaben; Fotografie nur, wenn echte Bohnenbilder später verfügbar sind |
| BSL, `Screenshot 2026-09-05 135610.png` | Sehr grosse Wortmarke, konsequente Schwarz-Weiss-Gestaltung | Mutiger Massstab bei Überschriften, ohne Formulare und Bedienelemente zu verdrängen |

Der GitHub-Pages-Screenshot enthält eine Einstellungsseite und fliesst nicht als Stilreferenz ein. Die übrigen Referenzen zu Gesundheit, Stimmung und Meditation ergänzen das Bild durch ruhige Flächen, kreisförmige Bedienelemente und vereinzelte visuelle Akzente.

## Vorgeschlagene Gestaltung

**Helle, typografische Grundfläche mit einem präzisen Instrumentencharakter.** Warmes Weiss, fast schwarzer Text, neutrale Grautöne und ein kleiner Signalrot-Akzent für Auswahl oder Skalenmarker. Dunkle Flächen gezielt für den aktiven Timer einsetzen. Die Farbauswahl ist ein Vorschlag; das gemeinsame Prinzip der Referenzen ist der sparsame Farbeinsatz.

- Überschriften und Rezeptnamen tragen die Gestaltung. Deutlicher Wechsel zwischen grosser, eher normalgewichtiger Schrift und kleinen Beschriftungen. Die vorhandene Archivo zunächst als technische Grundlage verwenden; die endgültige Schriftwirkung anhand der Ansichten beurteilen.
- Methoden und Rezepte als grosszügige Zeilen mit feinen Trennlinien aufbauen. Flächen bündeln zusammengehörige Informationen; Rundungen auf interaktive Elemente konzentrieren.
- In der Zubereitung steht die Zielmenge im Mittelpunkt. Eine horizontale Skala und eine direkte Eingabe arbeiten zusammen. Zutaten stehen kompakt darunter, die optionale Bohne in einer leicht erreichbaren Zeile.
- Einstellungen einklappbar halten. Aufgüsse als ruhig gesetzte Reihenfolge mit Menge und Zeit; beim Timer dürfen die Ziffern gross werden, während die Schritte weiterhin erreichbar bleiben.
- Bewertungen als drei gut erreichbare Textoptionen darstellen. Auswahl über Kontrast, Form und Zustand kenntlich machen, nicht allein über Farbe.
- Verlauf mit zwei kleinen Filtern für Methode und Gesamturteil sowie einer ruhigen, einheitlichen Versuchsliste. Mobile Lesbarkeit hat Vorrang vor einem dekorativ engen Raster.

## Bewegung und Alltagstauglichkeit

Kurze Übergänge für Auswahl, Aufklappen und Ansichtswechsel. Mengeneingaben reagieren unmittelbar. Feste Ziffernbreiten verhindern springende Zahlen. Keine laufenden Partikeleffekte oder automatischen Karussells. Reduzierte Bewegung respektieren, Touchflächen mindestens 44 px, Tastatur und sichtbare Fokuszustände beibehalten.

Als nächste konkrete Entwürfe dienen Methodenauswahl, Zubereitung, Verlauf mit Filtern und Bewertung desselben Iced-Rezepts. So lässt sich die Richtung an den echten Aufgaben beurteilen, bevor sie auf Rezepteditor, Bohnen und Datenansichten übertragen wird.
