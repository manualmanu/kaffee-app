import { el } from '../../dom.js';
import { registerScreen, navigate } from '../../router.js';
import { getBohnen } from '../../state.js';
import { topbar } from '../../components/topbar.js';
import { choiceListItem, addRow } from '../../components/choiceList.js';

function render() {
  const beans = getBohnen();
  const items = beans.map(b => choiceListItem({
    kicker: b.roester,
    title: b.name,
    meta: b.notizen || '',
    onClick: () => navigate('beanDetail', { formCtx: { type: 'bean', editId: b.id } }),
  }));
  return el('div', { class: 'screen' }, [
    topbar({ crumb: 'Verwaltung' }),
    el('h2', { class: 'screen-title' }, 'Bohnen'),
    el('div', {}, items),
    beans.length === 0 ? el('div', { class: 'empty-state' }, 'Noch keine Bohne angelegt.') : null,
    addRow('Neue Bohne anlegen', () => navigate('beanForm', { formCtx: { type: 'bean', mode: 'verwaltung', editId: null } })),
  ]);
}

registerScreen('beanList', render);
