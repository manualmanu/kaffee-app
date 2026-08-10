export const BRAUART_KATEGORIEN = ['v60', 'iced', 'coldbrew'];

export const KATEGORIE_LABEL = {
  v60: 'Pour Over V60',
  iced: 'Japanese Iced Coffee',
  coldbrew: 'Cold Brew',
};

export const KATEGORIE_MONO = {
  v60: 'V6',
  iced: 'JI',
  coldbrew: 'CB',
};

// Welche Feld-Checkboxen in der Varianten-Verwaltung für eine Kategorie überhaupt angeboten werden.
export const KATEGORIE_FELD_MATRIX = {
  v60: { temperatur: true, bloom: true, eis: false, pourStufen: true, lagerort: false },
  iced: { temperatur: true, bloom: true, eis: true, pourStufen: true, lagerort: false },
  coldbrew: { temperatur: true, bloom: false, eis: false, pourStufen: false, lagerort: true },
};

export const FELD_LABEL = {
  temperatur: 'Wassertemperatur',
  bloom: 'Bloom',
  eis: 'Eis',
  pourStufen: 'Pour-Stufen',
  lagerort: 'Lagerort',
};

export const GESCHMACK = ['stark_sauer', 'leicht_sauer', 'ausgewogen', 'leicht_bitter', 'stark_bitter'];

export const GESCHMACK_LABEL = {
  stark_sauer: 'Stark sauer',
  leicht_sauer: 'Leicht sauer',
  ausgewogen: 'Ausgewogen',
  leicht_bitter: 'Leicht bitter',
  stark_bitter: 'Stark bitter',
};

export const EINDRUCK = ['gefiel_mir', 'neutral', 'gefiel_mir_nicht'];

export const EINDRUCK_LABEL = {
  gefiel_mir: 'Gefiel mir',
  neutral: 'Neutral',
  gefiel_mir_nicht: 'Gefiel mir nicht',
};

export const AMOUNT_PRESETS = [200, 300, 400, 600];

export const STORAGE_KEY = 'kaffee_state_v1';
