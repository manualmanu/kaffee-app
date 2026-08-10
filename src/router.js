import { el } from './dom.js';

const screens = {};
let stack = ['home'];
let ui = {
  kategorie: null,
  varianteId: null,
  bohneId: null,
  amount: 300,
  tastingDraft: null,
  historyFilter: { bohneId: null, varianteId: null },
  formCtx: null, // { type: 'bean'|'variant', mode: 'flow'|'verwaltung', editId, kategorie }
};

export function registerScreen(name, renderFn) {
  screens[name] = renderFn;
}

export function getUi() { return ui; }

export function navigate(screen, patch = {}) {
  ui = { ...ui, ...patch };
  stack.push(screen);
  render();
}

export function replace(screen, patch = {}) {
  ui = { ...ui, ...patch };
  stack[stack.length - 1] = screen;
  render();
}

export function back() {
  if (stack.length > 1) stack.pop();
  render();
}

export function resetTo(screen, patch = {}) {
  ui = { ...ui, ...patch };
  stack = [screen];
  render();
}

export function currentScreen() {
  return stack[stack.length - 1];
}

// Re-render der aktuellen Ansicht ohne Navigation — für strukturelle Änderungen an
// direkt mutierten Draft-Objekten (z.B. Pour-Stufe hinzufügen/entfernen).
export function rerender() {
  render();
}

export function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  const name = currentScreen();
  const renderFn = screens[name];
  if (!renderFn) {
    app.appendChild(el('div', { class: 'screen px-20' }, 'Unbekannter Screen: ' + name));
    return;
  }
  app.appendChild(renderFn(ui));
}
