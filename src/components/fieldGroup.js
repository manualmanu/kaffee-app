import { el } from '../dom.js';

let fieldIdCounter = 0;

export function field(labelText, inputNode) {
  const id = 'field-' + (++fieldIdCounter);
  if (inputNode && inputNode.setAttribute) inputNode.setAttribute('id', id);
  return el('div', { class: 'field' }, [
    el('label', { for: id }, labelText),
    inputNode,
  ]);
}

export function textInput({ value = '', placeholder = '', onInput, required = false }) {
  return el('input', { class: 'input', type: 'text', value, placeholder, required, oninput: (e) => onInput(e.target.value) });
}

export function numberInput({ value, placeholder = '', onInput, step = 'any', required = false, min, max }) {
  return el('input', {
    class: 'input', type: 'number', value: value ?? '', placeholder, step, required, min, max,
    oninput: (e) => onInput(e.target.value === '' ? '' : Number(e.target.value)),
  });
}

export function selectInput({ value, options, onChange }) {
  return el('select', { class: 'input', onchange: (e) => onChange(e.target.value) },
    options.map(o => el('option', { value: o.value, selected: o.value === value }, o.label))
  );
}

export function dateInput({ value = '', onInput }) {
  return el('input', { class: 'input', type: 'date', value: value || '', oninput: (e) => onInput(e.target.value) });
}

export function textArea({ value = '', placeholder = '', onInput }) {
  return el('textarea', { class: 'input', value, placeholder, oninput: (e) => onInput(e.target.value) });
}

export function checkRow({ label, checked, onChange }) {
  const input = el('input', { type: 'checkbox', checked, onchange: (e) => onChange(e.target.checked) });
  return el('label', { class: 'check-row' }, [input, label]);
}
