import { el } from '../dom.js';

// options: [{ value, title, sub }]. Reine Anzeige/Auswahl-Komponente, keine Business-Logik.
export function choiceGroup(options, activeValue, onSelect) {
  return el('div', { class: 'choice-group' }, options.map(opt =>
    el('button', {
      class: 'choice-group-opt' + (opt.value === activeValue ? ' is-active' : ''),
      type: 'button',
      onclick: () => onSelect(opt.value),
    }, [
      el('div', { class: 'choice-group-opt-title' }, opt.title),
      opt.sub ? el('div', { class: 'choice-group-opt-sub' }, opt.sub) : null,
    ])
  ));
}
