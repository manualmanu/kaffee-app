import { el } from '../dom.js';

export function confirmDialog({ title, body, confirmLabel = 'Löschen', cancelLabel = 'Abbrechen', onConfirm }) {
  const backdrop = el('div', { class: 'dialog-backdrop' });
  const close = () => backdrop.remove();
  const dialog = el('div', { class: 'dialog' }, [
    el('div', { class: 'dialog-title' }, title),
    el('div', { class: 'dialog-body' }, body),
    el('div', { class: 'dialog-actions' }, [
      el('button', { class: 'btn btn-secondary', onclick: close }, cancelLabel),
      el('button', { class: 'btn btn-primary', onclick: () => { close(); onConfirm(); } }, confirmLabel),
    ]),
  ]);
  backdrop.appendChild(dialog);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  document.body.appendChild(backdrop);
}
