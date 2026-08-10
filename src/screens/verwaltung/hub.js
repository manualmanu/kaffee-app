import { el } from '../../dom.js';
import { registerScreen, navigate } from '../../router.js';
import { topbar } from '../../components/topbar.js';

function render() {
  return el('div', { class: 'screen' }, [
    topbar({ crumb: '' }),
    el('h2', { class: 'screen-title' }, 'Verwaltung'),
    el('div', { class: 'px-20', style: 'display:flex;flex-direction:column;gap:10px;' }, [
      el('button', { class: 'btn btn-secondary btn-block', onclick: () => navigate('beanList') }, 'Bohnen verwalten'),
      el('button', { class: 'btn btn-secondary btn-block', onclick: () => navigate('variantList') }, 'Rezept-Varianten verwalten'),
    ]),
  ]);
}

registerScreen('verwaltungHub', render);
