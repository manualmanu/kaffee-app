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

function render(ui) {
  const ctx = ui.formCtx;
  const editing = ctx.editId ? getVariante(ctx.editId) : null;
  const key = editing ? editing.id : ('new:' + (ctx.kategorie || 'v60'));
  if (!ui.variantFormDraft || ui.variantFormDraftKey !== key) {
    ui.variantFormDraft = editing ? draftFromVariante(editing) : defaultDraftForKategorie(ctx.kategorie || 'v60');
    ui.variantFormDraftKey = key;
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
    field('Ratio (1 : x)', numberInput({ value: draft.ratio, required: true, onInput: (v) => { draft.ratio = v; } })),
    field(`Mahlgrad (${draft.mahlgradEinheit})`, numberInput({ value: draft.mahlgradWert, required: true, onInput: (v) => { draft.mahlgradWert = v; } })),
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
    rows.push(field('Bloom (% des heissen Wassers)', numberInput({ value: draft.bloomProzent, onInput: (v) => { draft.bloomProzent = v; } })));
    rows.push(field('Bloom-Ziehzeit (Sekunden)', numberInput({ value: draft.bloomZeitSek, onInput: (v) => { draft.bloomZeitSek = v; } })));
  }
  if (draft.felder.eis) {
    rows.push(field('Eis (% der Zielmenge)', numberInput({ value: draft.eisProzent, onInput: (v) => { draft.eisProzent = v; } })));
  }
  if (draft.felder.lagerort) {
    rows.push(field('Lagerort', textInput({ value: draft.lagerort, onInput: (v) => { draft.lagerort = v; } })));
  }

  if (draft.kategorie === 'coldbrew') {
    rows.push(el('div', { style: 'display:flex;gap:10px;' }, [
      field('Ziehzeit von (Std.)', numberInput({ value: draft.ziehzeitVonH, onInput: (v) => { draft.ziehzeitVonH = v; } })),
      field('Ziehzeit bis (Std.)', numberInput({ value: draft.ziehzeitBisH, onInput: (v) => { draft.ziehzeitBisH = v; } })),
    ]));
  } else {
    rows.push(el('div', { style: 'display:flex;gap:10px;' }, [
      field('Brühzeit von (Sek.)', numberInput({ value: draft.bruehzeitVon, onInput: (v) => { draft.bruehzeitVon = v; } })),
      field('Brühzeit bis (Sek.)', numberInput({ value: draft.bruehzeitBis, onInput: (v) => { draft.bruehzeitBis = v; } })),
    ]));
  }

  if (draft.felder.pourStufen) {
    rows.push(el('div', {}, [
      el('h6', { style: 'margin:8px 0;' }, 'Pour-Stufen'),
      ...draft.pourStufen.map(s => el('div', { class: 'stage-row' }, [
        field('Kumuliert %', numberInput({ value: s.prozent, onInput: (v) => { s.prozent = v; } })),
        field('Zeitpunkt (Sek.)', numberInput({ value: s.zeitpunktSek, onInput: (v) => { s.zeitpunktSek = v; } })),
        el('button', { class: 'stage-remove', type: 'button', 'aria-label': 'Stufe entfernen', onclick: () => removeStufe(s.id) }, '×'),
      ])),
      el('button', { class: 'btn btn-ghost', type: 'button', onclick: addStufe }, '+ Stufe hinzufügen'),
    ]));
  }

  rows.push(field('Freitext-Instruktionen (optional)', textArea({ value: draft.freitext, onInput: (v) => { draft.freitext = v; } })));

  const save = (e) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
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
      el('button', { class: 'btn btn-primary btn-block', type: 'submit' }, editing ? 'Speichern' : 'Anlegen'),
      editing ? el('button', { class: 'btn btn-secondary btn-block', type: 'button', onclick: del }, 'Löschen') : null,
    ]),
  ]);
}

registerScreen('variantForm', render);
