import { el } from '../dom.js';
import { registerScreen, navigate } from '../router.js';
import { getVariantenByKategorie } from '../state.js';
import { KATEGORIE_LABEL } from '../constants.js';
import { fmtZeitRange, fmtStundenRange } from '../format.js';
import { topbar } from '../components/topbar.js';
import { choiceListItem, addRow } from '../components/choiceList.js';

function metaFor(v) {
  const grind = `Mahlgrad ${v.mahlgrad.wert} ${v.mahlgrad.einheit}`;
  if (v.kategorie === 'coldbrew') {
    return `${grind} · ${fmtStundenRange(v.ziehzeitSek.von, v.ziehzeitSek.bis)} ziehen`;
  }
  return `${grind} · ${fmtZeitRange(v.bruehzeitSek.von, v.bruehzeitSek.bis)}`;
}

function render(ui) {
  const variants = getVariantenByKategorie(ui.kategorie);
  const items = variants.map(v => choiceListItem({
    mono: '1:' + v.ratio,
    title: v.name,
    meta: metaFor(v),
    onClick: () => navigate('beanPicker', { varianteId: v.id, bohneId: null }),
  }));

  return el('div', { class: 'screen' }, [
    topbar({ crumb: KATEGORIE_LABEL[ui.kategorie] }),
    el('h2', { class: 'screen-title' }, 'Rezept wählen'),
    el('div', {}, items),
    variants.length === 0 ? el('div', { class: 'empty-state' }, 'Noch keine Variante für diese Kategorie.') : null,
    addRow('Neue Variante anlegen', () => navigate('variantForm', {
      formCtx: { type: 'variant', mode: 'flow', editId: null, kategorie: ui.kategorie },
    })),
  ]);
}

registerScreen('variantPicker', render);
