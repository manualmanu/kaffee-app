import { clone, emptyData, parseBackup, validateData } from './model.js';

export const STORAGE_KEY = 'kaffee_state_v2';
export const LEGACY_KEY = 'kaffee_state_v1';

export function createStore(storage) {
  let data = emptyData();
  let problem = null;
  let legacy = false;
  let lastSaved = null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    lastSaved = raw;
    if (raw !== null) data = parseBackup(raw);
    else legacy = storage.getItem(LEGACY_KEY) !== null;
  } catch (error) { problem = error.message; }

  function commit(next) {
    validateData(next);
    if (storage.getItem(STORAGE_KEY) !== lastSaved) throw new Error('Die Daten wurden in einem anderen Fenster geändert. Bitte diese Ansicht neu laden, bevor du speicherst.');
    const json = JSON.stringify(next);
    try { storage.setItem(STORAGE_KEY, json); }
    catch { throw new Error('Speichern nicht möglich. Der Gerätespeicher ist voll oder gesperrt. Bitte ein Backup exportieren.'); }
    data = clone(next);
    lastSaved = json;
    problem = null;
  }
  return {
    get data() { return clone(data); },
    get problem() { return problem; },
    get legacy() { return legacy; },
    change(fn) {
      if (problem || legacy) throw new Error('Bitte zuerst den Neustart oder die Datenwiederherstellung abschliessen.');
      const next = clone(data);
      fn(next);
      commit(next);
    },
    restart() {
      commit(emptyData());
      // The fresh version is durable before removing the obsolete data.
      storage.removeItem(LEGACY_KEY);
      legacy = false;
    },
    export() { return JSON.stringify(data, null, 2); },
    exportRaw() { return storage.getItem(STORAGE_KEY) ?? storage.getItem(LEGACY_KEY) ?? '{}'; },
    import(json) {
      const next = parseBackup(json);
      commit(next);
      legacy = false;
    },
  };
}
