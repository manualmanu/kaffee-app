import { el, ICON_CHEVRON } from '../dom.js';
import { registerScreen, navigate, replace } from '../router.js';
import { getVariante, getBohne } from '../state.js';
import { AMOUNT_PRESETS } from '../constants.js';
import { topbar } from '../components/topbar.js';

function render(ui) {
  const variante = getVariante(ui.varianteId);
  const bean = getBohne(ui.bohneId);
  const crumb = [variante && variante.name, bean && bean.name].filter(Boolean).join(' · ');
  const amount = ui.amount || 300;

  const setAmount = (n) => {
    const clamped = Math.max(50, Math.min(2000, Math.round(n)));
    replace('amount', { amount: clamped });
  };

  const stepper = el('div', { class: 'amount-stepper' }, [
    el('button', { class: 'amount-btn', type: 'button', 'aria-label': 'Weniger', onclick: () => setAmount(amount - 25) }, '–'),
    el('div', { class: 'amount-value' }, amount + ' g'),
    el('button', { class: 'amount-btn', type: 'button', 'aria-label': 'Mehr', onclick: () => setAmount(amount + 25) }, '+'),
  ]);

  const presets = el('div', { class: 'amount-presets' }, AMOUNT_PRESETS.map(p =>
    el('button', {
      class: 'amount-preset' + (p === amount ? ' is-active' : ''),
      type: 'button',
      onclick: () => setAmount(p),
    }, p + ' g')
  ));

  return el('div', { class: 'screen' }, [
    topbar({ crumb }),
    el('h2', { class: 'screen-title' }, 'Zielmenge'),
    el('div', { class: 'stack', style: 'flex:1;align-items:center;justify-content:center;' }, [stepper, presets]),
    el('div', { class: 'px-20', style: 'padding-top:16px;' },
      el('button', {
        class: 'btn btn-primary btn-block',
        style: 'justify-content:space-between;',
        onclick: () => navigate('result'),
      }, [el('span', {}, 'Rezept berechnen'), ICON_CHEVRON('var(--color-bg)')])
    ),
  ]);
}

registerScreen('amount', render);
