// Reine Skalierungs-Logik, generalisiert aus dem Design-Prototyp.
// Mahlgrad, Temperatur und Zeit skalieren NIE mit der Zielmenge — nur Bohnen/Wasser/Bloom/Eis/Pour-Stufen.

export function calcVariant(variante, zielmenge, mahlgradOverride) {
  if (!Number.isFinite(variante.ratio) || variante.ratio <= 0) {
    throw new Error('Ungültige Ratio: ' + variante.ratio);
  }
  const coffee = zielmenge / variante.ratio;
  const mahlgrad = mahlgradOverride || variante.mahlgrad;

  if (variante.kategorie === 'coldbrew') {
    return {
      coffee,
      water: zielmenge,
      ice: null,
      bloom: null,
      bloomZeitSek: null,
      pourStufen: [],
      mahlgrad,
      temperaturC: variante.felder.temperatur ? variante.temperaturC : null,
      lagerort: variante.felder.lagerort ? variante.lagerort : null,
      bruehzeitSek: null,
      ziehzeitSek: variante.ziehzeitSek,
    };
  }

  const eisAmt = variante.felder.eis ? zielmenge * (variante.eisProzent / 100) : 0;
  const heissWasser = zielmenge - eisAmt;
  const bloomAmt = variante.felder.bloom ? heissWasser * (variante.bloomProzent / 100) : 0;

  let prevCum = bloomAmt;
  const pourStufen = variante.felder.pourStufen
    ? [...(variante.pourStufen || [])]
        .sort((a, b) => a.prozent - b.prozent)
        .map(stufe => {
          const cum = heissWasser * (stufe.prozent / 100);
          const incrementalAmt = cum - prevCum;
          prevCum = cum;
          return { ...stufe, cumAmt: cum, incrementalAmt };
        })
    : [];

  return {
    coffee,
    water: heissWasser,
    ice: variante.felder.eis ? eisAmt : null,
    bloom: variante.felder.bloom ? bloomAmt : null,
    bloomZeitSek: variante.felder.bloom ? variante.bloomZeitSek : null,
    pourStufen,
    mahlgrad,
    temperaturC: variante.felder.temperatur ? variante.temperaturC : null,
    bruehzeitSek: variante.bruehzeitSek || null,
    ziehzeitSek: null,
    lagerort: null,
  };
}
