import { el } from '../dom.js';
import { registerScreen, navigate } from '../router.js';
import { getBohnen, getVariante } from '../state.js';
import { topbar } from '../components/topbar.js';
import { choiceListItem, addRow } from '../components/choiceList.js';

function render(ui) {
  const variante = getVariante(ui.varianteId);
  const beans = getBohnen();
  const items = beans.map(b => choiceListItem({
    kicker: b.roester,
    title: b.name,
    meta: b.notizen || '',
    onClick: () => navigate('amount', { bohneId: b.id }),
  }));

  return el('div', { class: 'screen' }, [
    topbar({ crumb: variante ? variante.name : '' }),
    el('h2', { class: 'screen-title' }, 'Bohne wählen'),
    el('div', {}, items),
    beans.length === 0 ? el('div', { class: 'empty-state' }, 'Noch keine Bohne angelegt.') : null,
    addRow('Neue Bohne anlegen', () => navigate('beanForm', {
      formCtx: { type: 'bean', mode: 'flow', editId: null },
    })),
  ]);
}

registerScreen('beanPicker', render);
