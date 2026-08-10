import { el } from '../../dom.js';
import { registerScreen, navigate, back } from '../../router.js';
import { getBohne, getVariantenUebersichtFuerBohne, deleteBohne } from '../../state.js';
import { GESCHMACK_LABEL, EINDRUCK_LABEL } from '../../constants.js';
import { fmtDatum } from '../../format.js';
import { topbar } from '../../components/topbar.js';
import { confirmDialog } from '../../components/confirmDialog.js';

function render(ui) {
  const bean = getBohne(ui.formCtx.editId);
  if (!bean) {
    // back() ruft render() erneut auf — nicht synchron aus der laufenden render()-Funktion
    // heraus aufrufen (würde #app doppelt beschreiben), sondern auf den nächsten Tick verschieben.
    setTimeout(back, 0);
    return el('div', { class: 'screen' });
  }
  const uebersicht = getVariantenUebersichtFuerBohne(bean.id);

  const del = () => confirmDialog({
    title: 'Bohne löschen?',
    body: `„${bean.name}" wird gelöscht. Vorhandene Tastings bleiben im Verlauf sichtbar (Snapshot), lassen sich dieser Bohne aber nicht mehr zuordnen.`,
    onConfirm: () => { deleteBohne(bean.id); back(); },
  });

  return el('div', { class: 'screen' }, [
    topbar({ crumb: 'Bohnen' }),
    el('h2', { class: 'screen-title', style: 'margin-bottom:4px;' }, bean.name),
    el('div', { class: 'screen-sub' }, [bean.roester, bean.roestdatum].filter(Boolean).join(' · ')),
    bean.notizen ? el('div', { class: 'px-20', style: 'font-size:13px;opacity:.7;margin-bottom:16px;' }, bean.notizen) : null,
    el('div', { class: 'px-20', style: 'display:flex;gap:10px;margin-bottom:24px;' }, [
      el('button', { class: 'btn btn-secondary', onclick: () => navigate('beanForm', { formCtx: { type: 'bean', mode: 'verwaltung', editId: bean.id } }) }, 'Bearbeiten'),
      el('button', { class: 'btn btn-secondary', onclick: del }, 'Löschen'),
    ]),
    el('div', { class: 'px-20' }, el('h6', {}, 'Probierte Varianten')),
    uebersicht.length === 0
      ? el('div', { class: 'empty-state' }, 'Noch keine Tastings mit dieser Bohne.')
      : el('div', {}, uebersicht.map(u => el('div', { class: 'tasting-mini px-20' }, [
          el('div', { class: 'tasting-mini-row' }, [
            el('div', { style: 'font-size:15px;font-weight:800;font-family:var(--font-heading);' }, u.varianteName),
            el('div', { class: 'tasting-mini-date' }, fmtDatum(u.letztesTasting.datum)),
          ]),
          el('div', { class: 'tasting-mini-tags' }, [
            el('span', { class: 'tag tag-outline' }, GESCHMACK_LABEL[u.letztesTasting.geschmack]),
            el('span', { class: 'tag tag-neutral' }, EINDRUCK_LABEL[u.letztesTasting.eindruck]),
          ]),
        ]))),
  ]);
}

registerScreen('beanDetail', render);
