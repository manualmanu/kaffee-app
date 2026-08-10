import { el, ICON_HISTORY } from '../dom.js';
import { registerScreen, navigate } from '../router.js';
import { KATEGORIE_LABEL, KATEGORIE_MONO, BRAUART_KATEGORIEN } from '../constants.js';
import { getVariantenByKategorie } from '../state.js';
import { choiceListItem } from '../components/choiceList.js';

const KATEGORIE_BASE_DESC = {
  v60: 'Handaufguss',
  iced: 'Direkt auf Eis',
  coldbrew: 'Kalt gezogen, servierfertig',
};

function kategorieDesc(kat) {
  const count = getVariantenByKategorie(kat).length;
  return `${KATEGORIE_BASE_DESC[kat]} · ${count} Rezept${count === 1 ? '' : 'e'}`;
}

function render() {
  const top = el('div', { class: 'topbar' }, [
    el('div', { class: 'topbar-kicker' }, 'Kaffee'),
    el('button', { class: 'topbar-back', 'aria-label': 'Verlauf', onclick: () => navigate('history') }, ICON_HISTORY()),
  ]);

  const items = BRAUART_KATEGORIEN.map(kat => choiceListItem({
    mono: KATEGORIE_MONO[kat],
    title: KATEGORIE_LABEL[kat],
    meta: kategorieDesc(kat),
    onClick: () => navigate('variantPicker', { kategorie: kat, varianteId: null, bohneId: null }),
  }));

  const verwaltungLink = el('div', { class: 'px-20', style: 'margin-top:auto;padding-top:24px;' },
    el('button', { class: 'btn btn-secondary btn-block', onclick: () => navigate('verwaltungHub') }, 'Verwaltung')
  );

  return el('div', { class: 'screen' }, [
    top,
    el('h2', { class: 'screen-title' }, 'Methode wählen'),
    el('div', {}, items),
    verwaltungLink,
  ]);
}

registerScreen('home', render);
