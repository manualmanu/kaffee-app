import { el } from '../../dom.js';
import { registerScreen, replace, back, rerender } from '../../router.js';
import { getVariante, addVariante, updateVariante, deleteVariante } from '../../state.js';
import { genId } from '../../id.js';
import { BRAUART_KATEGORIEN, KATEGORIE_LABEL, KATEGORIE_FELD_MATRIX, FELD_LABEL } from '../../constants.js';
import { topbar } from '../../components/topbar.js';
import { field, textInput, numberInput, textArea, selectInput, checkRow } from '../../components/fieldGroup.js';
import { confirmDialog } from '../../components/confirmDialog.js';

function defaultDraftForKategorie(kategorie, carry = {}) {
  return {
    kategorie,
    name: carry.name ?? '',
    ratio: carry.ratio ?? 15,
    felder: { ...KATEGORIE_FELD_MATRIX[kategorie] },
    temperaturC: 94,
    bloomProzent: 13,
    bloomZeitSek: 30,
    eisProzent: 40,
    pourStufen: [],
    mahlgradWert: carry.mahlgradWert ?? 22,
    mahlgradEinheit: carry.mahlgradEinheit ?? 'Klicks',
    bruehzeitVon: 150, bruehzeitBis: 165,
    ziehzeitVonH: 14, ziehzeitBisH: 16,
    lagerort: '',
    freitext: carry.freitext ?? '',
  };
}

function draftFromVariante(v) {
  return {
    kategorie: v.kategorie,
    name: v.name,
    ratio: v.ratio,
    felder: { ...v.felder },
    temperaturC: v.temperaturC ?? 94,
    bloomProzent: v.bloomProzent ?? 13,
    bloomZeitSek: v.bloomZeitSek ?? 30,
    eisProzent: v.eisProzent ?? 40,
    pourStufen: (v.pourStufen || []).map(s => ({ ...s })),
    mahlgradWert: v.mahlgrad.wert,
    mahlgradEinheit: v.mahlgrad.einheit,
    bruehzeitVon: v.bruehzeitSek ? v.bruehzeitSek.von : 150,
    bruehzeitBis: v.bruehzeitSek ? v.bruehzeitSek.bis : 165,
    ziehzeitVonH: v.ziehzeitSek ? Math.round(v.ziehzeitSek.von / 3600) : 14,
    ziehzeitBisH: v.ziehzeitSek ? Math.round(v.ziehzeitSek.bis / 3600) : 16,
    lagerort: v.lagerort || '',
    freitext: v.freitext || '',
  };
}

function validateDraft(draft) {
  const errors = [];
  if (!(Number(draft.ratio) > 0)) errors.push('Ratio muss grösser als 0 sein.');
  if (!(Number(draft.mahlgradWert) > 0)) errors.push('Mahlgrad muss grösser als 0 sein.');
  if (draft.felder.bloom) {
    if (!(Number(draft.bloomProzent) >= 0 && Number(draft.bloomProzent) <= 100)) errors.push('Bloom % muss zwischen 0 und 100 liegen.');
    if (!(Number(draft.bloomZeitSek) > 0)) errors.push('Bloom-Ziehzeit muss grösser als 0 sein.');
  }
  if (draft.felder.eis && !(Number(draft.eisProzent) >= 0 && Number(draft.eisProzent) <= 100)) {
    errors.push('Eis % muss zwischen 0 und 100 liegen.');
  }
  if (draft.kategorie === 'coldbrew') {
    if (!(Number(draft.ziehzeitVonH) > 0) || !(Number(draft.ziehzeitBisH) > 0)) errors.push('Ziehzeiten müssen grösser als 0 sein.');
  } else if (!(Number(draft.bruehzeitVon) > 0) || !(Number(draft.bruehzeitBis) > 0)) {
    errors.push('Brühzeiten müssen grösser als 0 sein.');
  }
  if (draft.felder.pourStufen && draft.pourStufen.length) {
    const prozente = draft.pourStufen.map(s => Number(s.prozent));
    const sorted = [...prozente].sort((a, b) => a - b);
    if (!prozente.every((p, i) => p === sorted[i])) errors.push('Pour-Stufen müssen nach Prozent aufsteigend sortiert sein.');
    if (prozente.some(p => !(p > 0 && p <= 100))) errors.push('Pour-Stufen-Prozentwerte müssen zwischen 0 und 100 liegen.');
    if (draft.pourStufen.some(s => !(Number(s.zeitpunktSek) > 0))) errors.push('Pour-Stufen-Zeitpunkte müssen grösser als 0 sein.');
  }
  return errors;
}

function render(ui) {
  const ctx = ui.formCtx;
  const editing = ctx.editId ? getVariante(ctx.editId) : null;
  const key = editing ? editing.id : ('new:' + (ctx.kategorie || 'v60'));
  if (!ui.variantFormDraft || ui.variantFormDraftKey !== key) {
    ui.variantFormDraft = editing ? draftFromVariante(editing) : defaultDraftForKategorie(ctx.kategorie || 'v60');
    ui.variantFormDraftKey = key;
    ui.variantFormError = null;
  }
  const draft = ui.variantFormDraft;
  const matrix = KATEGORIE_FELD_MATRIX[draft.kategorie];

  const setKategorie = (kat) => {
    ui.variantFormDraft = defaultDraftForKategorie(kat, draft);
    rerender();
  };
  const toggleFeld = (key2, val) => { draft.felder[key2] = val; rerender(); };
  const addStufe = () => { draft.pourStufen.push({ id: genId(), prozent: 100, zeitpunktSek: 60 }); rerender(); };
  const removeStufe = (id) => { draft.pourStufen = draft.pourStufen.filter(s => s.id !== id); rerender(); };

  const rows = [
    field('Name', textInput({ value: draft.name, required: true, onInput: (v) => { draft.name = v; } })),
    field('Kategorie', selectInput({
      value: draft.kategorie,
      options: BRAUART_KATEGORIEN.map(k => ({ value: k, label: KATEGORIE_LABEL[k] })),
      onChange: setKategorie,
    })),
    field('Ratio (1 : x)', numberInput({ value: draft.ratio, required: true, min: 0.1, onInput: (v) => { draft.ratio = v; } })),
    field(`Mahlgrad (${draft.mahlgradEinheit})`, numberInput({ value: draft.mahlgradWert, required: true, min: 0.1, onInput: (v) => { draft.mahlgradWert = v; } })),
  ];

  rows.push(el('div', {}, [
    el('h6', { style: 'margin:8px 0;' }, 'Aktive Felder'),
    ...Object.keys(matrix).filter(k => matrix[k]).map(k =>
      checkRow({ label: FELD_LABEL[k], checked: draft.felder[k], onChange: (v) => toggleFeld(k, v) })
    ),
  ]));

  if (draft.felder.temperatur) {
    rows.push(field('Wassertemperatur (°C)', numberInput({ value: draft.temperaturC, onInput: (v) => { draft.temperaturC = v; } })));
  }
  if (draft.felder.bloom) {
    rows.push(field('Bloom (% des heissen Wassers)', numberInput({ value: draft.bloomProzent, min: 0, max: 100, onInput: (v) => { draft.bloomProzent = v; } })));
    rows.push(field('Bloom-Ziehzeit (Sekunden)', numberInput({ value: draft.bloomZeitSek, min: 1, onInput: (v) => { draft.bloomZeitSek = v; } })));
  }
  if (draft.felder.eis) {
    rows.push(field('Eis (% der Zielmenge)', numberInput({ value: draft.eisProzent, min: 0, max: 100, onInput: (v) => { draft.eisProzent = v; } })));
  }
  if (draft.felder.lagerort) {
    rows.push(field('Lagerort', textInput({ value: draft.lagerort, onInput: (v) => { draft.lagerort = v; } })));
  }

  if (draft.kategorie === 'coldbrew') {
    rows.push(el('div', { style: 'display:flex;gap:10px;' }, [
      field('Ziehzeit von (Std.)', numberInput({ value: draft.ziehzeitVonH, min: 1, onInput: (v) => { draft.ziehzeitVonH = v; } })),
      field('Ziehzeit bis (Std.)', numberInput({ value: draft.ziehzeitBisH, min: 1, onInput: (v) => { draft.ziehzeitBisH = v; } })),
    ]));
  } else {
    rows.push(el('div', { style: 'display:flex;gap:10px;' }, [
      field('Brühzeit von (Sek.)', numberInput({ value: draft.bruehzeitVon, min: 1, onInput: (v) => { draft.bruehzeitVon = v; } })),
      field('Brühzeit bis (Sek.)', numberInput({ value: draft.bruehzeitBis, min: 1, onInput: (v) => { draft.bruehzeitBis = v; } })),
    ]));
  }

  if (draft.felder.pourStufen) {
    rows.push(el('div', {}, [
      el('h6', { style: 'margin:8px 0;' }, 'Pour-Stufen'),
      ...draft.pourStufen.map(s => el('div', { class: 'stage-row' }, [
        field('Kumuliert %', numberInput({ value: s.prozent, min: 1, max: 100, onInput: (v) => { s.prozent = v; } })),
        field('Zeitpunkt (Sek.)', numberInput({ value: s.zeitpunktSek, min: 1, onInput: (v) => { s.zeitpunktSek = v; } })),
        el('button', { class: 'stage-remove', type: 'button', 'aria-label': 'Stufe entfernen', onclick: () => removeStufe(s.id) }, '×'),
      ])),
      el('button', { class: 'btn btn-ghost', type: 'button', onclick: addStufe }, '+ Stufe hinzufügen'),
    ]));
  }

  rows.push(field('Freitext-Instruktionen (optional)', textArea({ value: draft.freitext, onInput: (v) => { draft.freitext = v; } })));

  const save = (e) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    const errors = validateDraft(draft);
    if (errors.length) {
      ui.variantFormError = errors[0];
      rerender();
      return;
    }
    ui.variantFormError = null;
    const fields = {
      kategorie: draft.kategorie,
      name: draft.name.trim(),
      ratio: Number(draft.ratio),
      felder: draft.felder,
      temperaturC: draft.felder.temperatur ? Number(draft.temperaturC) : null,
      bloomProzent: draft.felder.bloom ? Number(draft.bloomProzent) : null,
      bloomZeitSek: draft.felder.bloom ? Number(draft.bloomZeitSek) : null,
      eisProzent: draft.felder.eis ? Number(draft.eisProzent) : null,
      pourStufen: draft.felder.pourStufen ? draft.pourStufen.map(s => ({ id: s.id, prozent: Number(s.prozent), zeitpunktSek: Number(s.zeitpunktSek) })) : [],
      mahlgrad: { wert: Number(draft.mahlgradWert), einheit: draft.mahlgradEinheit },
      bruehzeitSek: draft.kategorie === 'coldbrew' ? null : { von: Number(draft.bruehzeitVon), bis: Number(draft.bruehzeitBis) },
      ziehzeitSek: draft.kategorie === 'coldbrew' ? { von: Number(draft.ziehzeitVonH) * 3600, bis: Number(draft.ziehzeitBisH) * 3600 } : null,
      lagerort: draft.felder.lagerort ? (draft.lagerort.trim() || null) : null,
      freitext: draft.freitext.trim(),
    };
    let variante;
    if (editing) { updateVariante(editing.id, fields); variante = editing; }
    else { variante = addVariante(fields); }
    ui.variantFormDraft = null;
    // replace() statt navigate(): ersetzt den Formular-Eintrag im Stack, damit "Zurück" von
    // beanPicker sauber zur Varianten-Liste zurückführt statt zum (bereits gespeicherten) Formular.
    if (ctx.mode === 'flow') replace('beanPicker', { varianteId: variante.id });
    else back();
  };

  const del = () => confirmDialog({
    title: 'Variante löschen?',
    body: `„${editing.name}" wird gelöscht. Vorhandene Tastings bleiben im Verlauf sichtbar (Snapshot).`,
    onConfirm: () => { deleteVariante(editing.id); ui.variantFormDraft = null; back(); },
  });

  return el('form', { class: 'screen', onsubmit: save }, [
    topbar({ crumb: editing ? 'Bearbeiten' : 'Neue Variante', close: true }),
    el('h2', { class: 'screen-title' }, editing ? 'Variante bearbeiten' : 'Neue Variante'),
    el('div', { class: 'stack' }, [
      ...rows,
      ui.variantFormError ? el('div', { class: 'form-error', role: 'alert' }, ui.variantFormError) : null,
      el('button', { class: 'btn btn-primary btn-block', type: 'submit' }, editing ? 'Speichern' : 'Anlegen'),
      editing ? el('button', { class: 'btn btn-secondary btn-block', type: 'button', onclick: del }, 'Löschen') : null,
    ]),
  ]);
}

registerScreen('variantForm', render);
