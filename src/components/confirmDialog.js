import { el } from '../dom.js';

export function confirmDialog({ title, body, confirmLabel = 'Löschen', cancelLabel = 'Abbrechen', onConfirm }) {
  const previouslyFocused = document.activeElement;
  const backdrop = el('div', { class: 'dialog-backdrop' });
  const close = () => {
    backdrop.remove();
    document.removeEventListener('keydown', onKeydown);
    if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
  };
  const onKeydown = (e) => { if (e.key === 'Escape') close(); };
  const cancelBtn = el('button', { class: 'btn btn-secondary', onclick: close }, cancelLabel);
  const dialog = el('div', { class: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, [
    el('div', { class: 'dialog-title' }, title),
    el('div', { class: 'dialog-body' }, body),
    el('div', { class: 'dialog-actions' }, [
      cancelBtn,
      el('button', { class: 'btn btn-primary', onclick: () => { close(); onConfirm(); } }, confirmLabel),
    ]),
  ]);
  backdrop.appendChild(dialog);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', onKeydown);
  document.body.appendChild(backdrop);
  cancelBtn.focus();
}
