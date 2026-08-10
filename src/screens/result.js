import { el, ICON_CHEVRON } from '../dom.js';
import { registerScreen, navigate } from '../router.js';
import { getVariante, getBohne, getEffektiverMahlgrad, getTastingsFor } from '../state.js';
import { calcVariant } from '../calc.js';
import { fmt, fmtZeitRange, fmtStundenRange, fmtZeitMMSS, fmtDatum } from '../format.js';
import { GESCHMACK_LABEL, EINDRUCK_LABEL } from '../constants.js';
import { topbar } from '../components/topbar.js';

function statCell(label, value, unit, { span = false } = {}) {
  return el('div', { class: 'stat-cell' + (span ? ' span-all' : '') }, [
    el('div', { class: 'stat-label' }, label),
    el('div', { class: 'stat-value' }, [String(value), unit ? el('span', { class: 'stat-value-unit' }, ' ' + unit) : null]),
  ]);
}

function statCellSm(label, valueNode, { span = false } = {}) {
  return el('div', { class: 'stat-cell' + (span ? ' span-all' : '') }, [
    el('div', { class: 'stat-label' }, label),
    el('div', { class: 'stat-value-sm' }, valueNode),
  ]);
}

function pourStufenText(pourStufen) {
  return pourStufen.map(s => `${fmt(s.cumAmt)} g bei ${fmtZeitMMSS(s.zeitpunktSek)}`).join(' · ');
}

function renderStatGrid(r) {
  // "Regulär" gruppierte 2-Spalten-Zellen zuerst sammeln — bei ungerader Anzahl bekommt die
  // letzte automatisch volle Breite, sonst bliebe eine Lücke im Grid (leeres Feld ohne Partner).
  const regular = [
    { label: 'Bohnen', value: fmt(r.coffee), unit: 'g' },
    { label: 'Wasser', value: fmt(r.water), unit: 'g' },
  ];
  if (r.ice != null) regular.push({ label: 'Eis', value: fmt(r.ice), unit: 'g' });
  regular.push({ label: 'Mahlgrad', value: r.mahlgrad.wert, unit: r.mahlgrad.einheit });
  if (r.temperaturC != null) regular.push({ label: 'Temperatur', value: r.temperaturC, unit: '°C' });
  if (r.bloom != null) regular.push({ label: 'Bloom', small: true, value: fmt(r.bloom) + ' g', sub: r.bloomZeitSek + ' Sek. ziehen' });

  if (regular.length % 2 === 1) regular[regular.length - 1].span = true;

  const cells = regular.map(c => c.small
    ? statCellSm(c.label, [c.value, c.sub ? el('div', { style: 'font-size:12px;font-weight:400;opacity:.6;margin-top:2px;' }, c.sub) : null], { span: c.span })
    : statCell(c.label, c.value, c.unit, { span: c.span }));

  if (r.pourStufen && r.pourStufen.length) {
    cells.push(statCellSm('Pour-Stufen', pourStufenText(r.pourStufen), { span: true }));
  }
  if (r.bruehzeitSek) {
    cells.push(statCellSm('Brühzeit gesamt', fmtZeitRange(r.bruehzeitSek.von, r.bruehzeitSek.bis), { span: true }));
  }
  if (r.ziehzeitSek) {
    cells.push(statCellSm('Ziehzeit', fmtStundenRange(r.ziehzeitSek.von, r.ziehzeitSek.bis), { span: true }));
  }
  if (r.lagerort) {
    cells.push(statCellSm('Lagerort', r.lagerort, { span: true }));
  }
  return el('div', { class: 'stat-grid cols-2' }, cells);
}

function renderTastingMini(t) {
  return el('div', { class: 'tasting-mini' }, [
    el('div', { class: 'tasting-mini-row' }, [
      el('div', { style: 'font-size:13px;' }, `${fmt(t.genutzteWerte.mahlgrad.wert)} ${t.genutzteWerte.mahlgrad.einheit}`),
      el('div', { class: 'tasting-mini-date' }, fmtDatum(t.datum)),
    ]),
    el('div', { class: 'tasting-mini-tags' }, [
      el('span', { class: 'tag tag-outline' }, GESCHMACK_LABEL[t.geschmack]),
      el('span', { class: 'tag tag-neutral' }, EINDRUCK_LABEL[t.eindruck]),
    ]),
    t.notiz ? el('div', { style: 'font-size:12px;opacity:.6;margin-top:6px;font-style:italic;' }, `„${t.notiz}"`) : null,
  ]);
}

function render(ui) {
  const variante = getVariante(ui.varianteId);
  const bean = getBohne(ui.bohneId);
  const mahlgrad = getEffektiverMahlgrad(ui.bohneId, ui.varianteId);
  const r = calcVariant(variante, ui.amount, mahlgrad);
  const tastings = getTastingsFor(ui.bohneId, ui.varianteId);
  const crumb = [variante.name, bean.name].filter(Boolean).join(' · ');

  return el('div', { class: 'screen' }, [
    topbar({ crumb }),
    el('h2', { class: 'screen-title', style: 'margin-bottom:4px;' }, 'Dein Rezept'),
    el('div', { class: 'screen-sub' }, `${ui.amount} g Ziel · ${bean.name}`),
    el('div', { class: 'px-20', style: 'margin:0 0 12px;' },
      el('span', { class: mahlgrad.istStandard ? 'tag tag-neutral' : 'tag tag-accent' },
        mahlgrad.istStandard ? 'Standardwert' : 'Gespeicherte Einstellung')
    ),
    renderStatGrid(r),
    variante.freitext ? el('div', { class: 'px-20', style: 'margin-top:16px;font-size:13px;opacity:.75;' }, variante.freitext) : null,
    tastings.length ? el('div', { class: 'px-20', style: 'margin-top:24px;' }, [
      el('h6', { style: 'margin-bottom:8px;' }, 'Bisherige Tastings'),
      ...tastings.slice(0, 5).map(renderTastingMini),
    ]) : null,
    el('div', { class: 'spacer' }),
    el('div', { class: 'px-20', style: 'padding-top:16px;padding-bottom:0;' },
      el('button', {
        class: 'btn btn-primary btn-block',
        style: 'justify-content:space-between;',
        onclick: () => navigate('tastingEntry', {
          tastingDraft: { mahlgradWert: mahlgrad.wert, mahlgradEinheit: mahlgrad.einheit, geschmack: null, eindruck: null, notiz: '' },
        }),
      }, [el('span', {}, 'Fertig gebraut'), ICON_CHEVRON('var(--color-bg)')])
    ),
  ]);
}

registerScreen('result', render);
