import { el } from '../../dom.js';
import { registerScreen, navigate } from '../../router.js';
import { getRezeptVarianten } from '../../state.js';
import { BRAUART_KATEGORIEN, KATEGORIE_LABEL } from '../../constants.js';
import { topbar } from '../../components/topbar.js';
import { choiceListItem, addRow } from '../../components/choiceList.js';

function render() {
  const all = getRezeptVarianten();
  const sections = BRAUART_KATEGORIEN.map(kat => {
    const variants = all.filter(v => v.kategorie === kat);
    return el('div', {}, [
      el('h6', { class: 'px-20', style: 'margin:20px 0 4px;' }, KATEGORIE_LABEL[kat]),
      ...variants.map(v => choiceListItem({
        mono: '1:' + v.ratio,
        title: v.name,
        meta: '',
        onClick: () => navigate('variantForm', { formCtx: { type: 'variant', mode: 'verwaltung', editId: v.id, kategorie: v.kategorie } }),
      })),
      variants.length === 0 ? el('div', { class: 'empty-state', style: 'padding:16px 20px;' }, 'Keine Varianten.') : null,
      addRow('Neue Variante (' + KATEGORIE_LABEL[kat] + ')', () => navigate('variantForm', { formCtx: { type: 'variant', mode: 'verwaltung', editId: null, kategorie: kat } })),
    ]);
  });

  return el('div', { class: 'screen' }, [
    topbar({ crumb: 'Verwaltung' }),
    el('h2', { class: 'screen-title' }, 'Rezept-Varianten'),
    ...sections,
  ]);
}

registerScreen('variantList', render);
