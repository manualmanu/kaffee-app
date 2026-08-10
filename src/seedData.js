import { genId, nowIso } from './id.js';

// Bloom war im Prototyp "coffee × bloomRatio(2)" — hier auf % des heissen Wassers umgerechnet,
// damit es der Anforderung (Bloom-% statt fixer Ratio) entspricht. Pour-Stufen gab es im
// Prototyp nicht; hier mit zwei plausiblen Standard-Stufen (60% / 100%) vorbefüllt, frei editierbar.
function makeVariante({ kategorie, name, ratio, temperaturC, bloomProzent, bloomZeitSek,
  eisProzent, bruehzeitSek, ziehzeitSek, lagerort, grind, pourStufen, freitext, felder }) {
  const t = nowIso();
  return {
    id: genId(),
    kategorie,
    name,
    ratio,
    felder,
    temperaturC: temperaturC ?? null,
    bloomProzent: bloomProzent ?? null,
    bloomZeitSek: bloomZeitSek ?? null,
    eisProzent: eisProzent ?? null,
    pourStufen: (pourStufen || []).map(s => ({ id: genId(), ...s })),
    mahlgrad: { wert: grind, einheit: 'Klicks' },
    bruehzeitSek: bruehzeitSek ?? null,
    ziehzeitSek: ziehzeitSek ?? null,
    lagerort: lagerort ?? null,
    freitext: freitext || '',
    erstelltAm: t,
    aktualisiertAm: t,
  };
}

export function seedRezeptVarianten() {
  return [
    makeVariante({
      kategorie: 'v60', name: 'V60 · 1:15 Klar & Sauber', ratio: 15,
      felder: { temperatur: true, bloom: true, eis: false, pourStufen: true, lagerort: false },
      temperaturC: 94, bloomProzent: 13.3, bloomZeitSek: 30,
      bruehzeitSek: { von: 150, bis: 165 },
      pourStufen: [{ prozent: 60, zeitpunktSek: 75 }, { prozent: 100, zeitpunktSek: 165 }],
      grind: 22,
      freitext: 'Bloom 2x rühren',
    }),
    makeVariante({
      kategorie: 'v60', name: 'V60 · 1:16 Ausgewogen', ratio: 16,
      felder: { temperatur: true, bloom: true, eis: false, pourStufen: true, lagerort: false },
      temperaturC: 94, bloomProzent: 12.5, bloomZeitSek: 30,
      bruehzeitSek: { von: 165, bis: 180 },
      pourStufen: [{ prozent: 60, zeitpunktSek: 80 }, { prozent: 100, zeitpunktSek: 180 }],
      grind: 24,
    }),
    makeVariante({
      kategorie: 'v60', name: 'V60 · 1:17 Mild', ratio: 17,
      felder: { temperatur: true, bloom: true, eis: false, pourStufen: true, lagerort: false },
      temperaturC: 93, bloomProzent: 11.8, bloomZeitSek: 35,
      bruehzeitSek: { von: 180, bis: 195 },
      pourStufen: [{ prozent: 60, zeitpunktSek: 90 }, { prozent: 100, zeitpunktSek: 195 }],
      grind: 26,
    }),
    makeVariante({
      kategorie: 'iced', name: 'Japanese Iced · 1:13 Kräftig & Klar', ratio: 13,
      felder: { temperatur: true, bloom: true, eis: true, pourStufen: true, lagerort: false },
      temperaturC: 94, bloomProzent: 25.6, bloomZeitSek: 30, eisProzent: 40,
      bruehzeitSek: { von: 90, bis: 105 },
      pourStufen: [{ prozent: 60, zeitpunktSek: 45 }, { prozent: 100, zeitpunktSek: 105 }],
      grind: 20,
    }),
    makeVariante({
      kategorie: 'iced', name: 'Japanese Iced · 1:15 Klassisch', ratio: 15,
      felder: { temperatur: true, bloom: true, eis: true, pourStufen: true, lagerort: false },
      temperaturC: 94, bloomProzent: 22.2, bloomZeitSek: 30, eisProzent: 40,
      bruehzeitSek: { von: 105, bis: 120 },
      pourStufen: [{ prozent: 60, zeitpunktSek: 55 }, { prozent: 100, zeitpunktSek: 120 }],
      grind: 22,
    }),
    makeVariante({
      kategorie: 'iced', name: 'Japanese Iced · 1:16 Sanft & Fruchtig', ratio: 16,
      felder: { temperatur: true, bloom: true, eis: true, pourStufen: true, lagerort: false },
      temperaturC: 93, bloomProzent: 20.8, bloomZeitSek: 35, eisProzent: 40,
      bruehzeitSek: { von: 120, bis: 135 },
      pourStufen: [{ prozent: 60, zeitpunktSek: 60 }, { prozent: 100, zeitpunktSek: 135 }],
      grind: 24,
    }),
    makeVariante({
      kategorie: 'coldbrew', name: 'Cold Brew · 1:12 Kräftig', ratio: 12,
      felder: { temperatur: false, bloom: false, eis: false, pourStufen: false, lagerort: true },
      ziehzeitSek: { von: 57600, bis: 64800 },
      lagerort: 'Kühlschrank, Glasflasche',
      grind: 38,
    }),
    makeVariante({
      kategorie: 'coldbrew', name: 'Cold Brew · 1:13 Ausgewogen', ratio: 13,
      felder: { temperatur: false, bloom: false, eis: false, pourStufen: false, lagerort: true },
      ziehzeitSek: { von: 50400, bis: 57600 },
      lagerort: 'Kühlschrank, Glasflasche',
      grind: 36,
    }),
    makeVariante({
      kategorie: 'coldbrew', name: 'Cold Brew · 1:15 Leicht', ratio: 15,
      felder: { temperatur: false, bloom: false, eis: false, pourStufen: false, lagerort: true },
      ziehzeitSek: { von: 43200, bis: 50400 },
      lagerort: 'Kühlschrank, Glasflasche',
      grind: 34,
    }),
  ];
}

export function seedBohnen() {
  const t = nowIso();
  return [
    {
      id: genId(), name: 'Oscar Daza', roester: 'Four Hundred (MG)', roestdatum: null,
      notizen: 'Kolumbien · BioMaster Low Temperature Fermentation',
      erstelltAm: t, aktualisiertAm: t,
    },
    {
      id: genId(), name: 'Ceiba Marcala', roester: 'Four Hundred (MG)', roestdatum: null,
      notizen: 'Honduras · Honey Organic',
      erstelltAm: t, aktualisiertAm: t,
    },
  ];
}
