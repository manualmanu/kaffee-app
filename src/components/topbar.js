import { el, ICON_BACK, ICON_CLOSE } from '../dom.js';
import { back } from '../router.js';

export function topbar({ crumb = '', kicker = null, close = false, onBack } = {}) {
  const backBtn = el('button', {
    class: 'topbar-back',
    'aria-label': close ? 'Schliessen' : 'Zurück',
    onclick: onBack || back,
  }, close ? ICON_CLOSE() : ICON_BACK());
  return el('div', { class: 'topbar' }, [
    backBtn,
    kicker ? el('div', { class: 'topbar-kicker' }, kicker) : el('div', { class: 'topbar-crumb' }, crumb),
  ]);
}
