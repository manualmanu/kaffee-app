import { el } from '../dom.js';
import { registerScreen, rerender } from '../router.js';
import { getTastings, getBohnen, getRezeptVarianten, exportJson, importJson } from '../state.js';
import { GESCHMACK_LABEL, EINDRUCK_LABEL } from '../constants.js';
import { fmt, fmtDatum } from '../format.js';
import { topbar } from '../components/topbar.js';
import { selectInput } from '../components/fieldGroup.js';
import { confirmDialog } from '../components/confirmDialog.js';

function tastingRow(t) {
  return el('div', { class: 'tasting-mini px-20' }, [
    el('div', { class: 'tasting-mini-row' }, [
      el('div', { style: 'font-size:15px;font-weight:800;font-family:var(--font-heading);' }, `${t.varianteName} · ${t.bohneName}`),
      el('div', { class: 'tasting-mini-date' }, fmtDatum(t.datum)),
    ]),
    el('div', { style: 'font-size:12.5px;opacity:.65;margin-top:3px;' },
      `${fmt(t.genutzteWerte.coffee)}g Bohnen · ${fmt(t.genutzteWerte.water)}g Wasser${t.genutzteWerte.ice != null ? ' · ' + fmt(t.genutzteWerte.ice) + 'g Eis' : ''}`),
    el('div', { class: 'tasting-mini-tags' }, [
      el('span', { class: 'tag tag-outline' }, GESCHMACK_LABEL[t.geschmack]),
      el('span', { class: 'tag tag-neutral' }, EINDRUCK_LABEL[t.eindruck]),
    ]),
    t.notiz ? el('div', { style: 'font-size:12px;opacity:.6;margin-top:8px;font-style:italic;' }, `„${t.notiz}"`) : null,
  ]);
}

function doExport() {
  const json = exportJson();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kaffee-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function render(ui) {
  const filter = ui.historyFilter;
  const beans = getBohnen();
  const variants = getRezeptVarianten();
  let tastings = getTastings();
  if (filter.bohneId) tastings = tastings.filter(t => t.bohneId === filter.bohneId);
  if (filter.varianteId) tastings = tastings.filter(t => t.varianteId === filter.varianteId);
  tastings = [...tastings].sort((a, b) => b.datum.localeCompare(a.datum));

  const bohneSelect = selectInput({
    value: filter.bohneId || '',
    options: [{ value: '', label: 'Alle Bohnen' }, ...beans.map(b => ({ value: b.id, label: b.name }))],
    onChange: (v) => { ui.historyFilter.bohneId = v || null; rerender(); },
  });
  const varianteSelect = selectInput({
    value: filter.varianteId || '',
    options: [{ value: '', label: 'Alle Varianten' }, ...variants.map(v => ({ value: v.id, label: v.name }))],
    onChange: (v) => { ui.historyFilter.varianteId = v || null; rerender(); },
  });

  const fileInput = el('input', {
    type: 'file', accept: 'application/json', style: 'display:none;',
    onchange: (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        confirmDialog({
          title: 'Backup importieren?',
          body: 'Alle aktuellen Daten werden durch den Inhalt der Datei ersetzt.',
          confirmLabel: 'Importieren',
          onConfirm: () => {
            try { importJson(reader.result); rerender(); }
            catch (err) { alert('Import fehlgeschlagen: ' + err.message); }
          },
        });
      };
      reader.readAsText(file);
      e.target.value = '';
    },
  });

  return el('div', { class: 'screen' }, [
    topbar({ crumb: '' }),
    el('h2', { class: 'screen-title' }, 'Verlauf'),
    el('div', { class: 'px-20', style: 'display:flex;gap:10px;margin-bottom:16px;' }, [bohneSelect, varianteSelect]),
    tastings.length === 0
      ? el('div', { class: 'empty-state' }, 'Noch keine Einträge. Brühe etwas und gib danach Feedback.')
      : el('div', {}, tastings.map(tastingRow)),
    el('div', { class: 'px-20', style: 'display:flex;gap:10px;margin-top:32px;padding-top:16px;border-top:2px solid var(--color-divider);' }, [
      el('button', { class: 'btn btn-secondary', type: 'button', onclick: doExport }, 'Backup exportieren'),
      el('button', { class: 'btn btn-secondary', type: 'button', onclick: () => fileInput.click() }, 'Backup importieren'),
      fileInput,
    ]),
  ]);
}

registerScreen('history', render);
