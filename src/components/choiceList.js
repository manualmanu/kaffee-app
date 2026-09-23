import { el, ICON_CHEVRON, ICON_PLUS } from '../dom.js';

export function choiceListItem({ mono, kicker, title, meta, onClick }) {
  return el('button', { class: 'choice-list-item', type: 'button', onclick: onClick }, [
    mono != null ? el('div', { class: 'choice-list-mono' }, mono) : null,
    el('div', { class: 'choice-list-body' }, [
      kicker ? el('div', { class: 'topbar-kicker', style: 'margin-bottom:2px;' }, kicker) : null,
      el('div', { class: 'choice-list-title' }, title),
      meta ? el('div', { class: 'choice-list-meta' }, meta) : null,
    ]),
    ICON_CHEVRON(),
  ]);
}

export function addRow(label, onClick) {
  return el('button', { class: 'choice-list-item', type: 'button', onclick: onClick }, [
    el('div', { class: 'choice-list-mono', style: 'background:transparent;border:1px dashed var(--color-divider);color:var(--color-accent-700);' }, ICON_PLUS()),
    el('div', { class: 'choice-list-body' }, el('div', { class: 'choice-list-title choice-list-add' }, label)),
  ]);
}
