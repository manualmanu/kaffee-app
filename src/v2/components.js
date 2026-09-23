import { el } from '../dom.js';
import { cumulativeSteps, id, ratio, setRatio, setWater } from './model.js';
import { icon } from './icons.js';

export const fmt = n => new Intl.NumberFormat('de-CH', { maximumFractionDigits: 2 }).format(n);
export const fmtRatio = n => new Intl.NumberFormat('de-CH', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
const coffeeValue = n => Number.isFinite(n) ? Number(n.toFixed(1)) : '';
export const stamp = date => new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
export const shortDate = date => new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'short' }).format(new Date(date));
export const time = seconds => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
export const button = (label, action, kind = '', props = {}) => el('button', { type: 'button', class: `button ${kind}`, onclick: action, ...props }, label);
export const iconButton = (name, label, action, props = {}) => button(icon(name), action, 'icon-button', { 'aria-label': label, title: label, ...props });
export const hint = text => el('p', { class: 'muted' }, text);
export const errorBox = () => el('div', { class: 'error', role: 'alert', hidden: true });
export function showError(container, error) {
  container.textContent = error.message || String(error);
  container.hidden = false;
  container.scrollIntoView({ block: 'nearest' });
}
export function field(label, control, { unit, prefix, wide } = {}) {
  if (!control.hasAttribute('aria-label')) control.setAttribute('aria-label', label);
  const box = unit || prefix
    ? el('span', { class: 'affix-box' }, [prefix ? el('span', { class: 'affix' }, prefix) : null, control, unit ? el('span', { class: 'affix' }, unit) : null])
    : control;
  return el('label', { class: `field${wide ? ' wide' : ''}` }, [el('span', { class: 'field-label' }, label), box]);
}
export function input(value, change, props = {}) {
  return el('input', { type: 'text', value: value ?? '', oninput: event => change(event.target.value), ...props });
}
export function number(value, change, props = {}) {
  return input(value, () => {}, { type: 'number', inputmode: 'decimal', step: 'any', min: 0,
    oninput: event => change(event.target.value === '' ? null : event.target.valueAsNumber), ...props });
}
export function select(value, options, change, props = {}) {
  const control = el('select', { onchange: event => change(event.target.value), ...props },
    options.map(([key, label]) => el('option', { value: key }, label)));
  control.value = value;
  return control;
}
export function textarea(value, change, props = {}) {
  return el('textarea', { rows: 2, value, oninput: event => change(event.target.value), ...props });
}
export function segmented(options, value, change, props = {}) {
  const buttons = options.map(([key, label]) => button(label, () => {
    const result = change(key);
    const selected = result === undefined ? key : result;
    buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(options[i][0] === selected)));
  }, 'segment', { 'aria-pressed': String(key === value) }));
  return el('div', { class: 'segmented', role: 'group', ...props }, buttons);
}
const group = (title, children, aside = null) => el('section', { class: 'form-group' }, [
  el('div', { class: 'group-title' }, [el('h3', {}, title), aside]), ...children]);

// Editing is local to the draft. Inputs never replace the page while typing.
export function recipeEditor(recipe, { metadata = false, changed = () => {} } = {}) {
  const bindings = [];
  const stepsHost = el('div', { class: 'step-editor' });
  const stepStatus = el('span', { class: 'step-status', 'aria-live': 'polite' });
  const modes = new Map();
  const notify = () => { updateStatus(); changed(); };
  const round = n => Number.isFinite(n) ? Number(n.toFixed(2)) : '';
  function bind(key, label, aria, unit, options = {}) {
    const control = number(round(recipe[key]), value => { recipe[key] = value; notify(); }, { 'aria-label': aria, placeholder: '–', ...options });
    bindings.push(() => { control.value = round(recipe[key]); });
    return field(label, control, { unit });
  }
  const coffee = number(coffeeValue(recipe.coffee), value => { recipe.coffee = value; refreshRatio(); notify(); }, { required: true, min: 0.1, step: 0.1, 'aria-label': 'Kaffee (g)' });
  const water = number(round(recipe.water), value => {
    setWater(recipe, value ?? 0); refreshRatio(); renderSteps(); notify();
  }, { required: true, min: 0, 'aria-label': 'Wasser (g / ca. ml)' });
  const ice = number(round(recipe.ice), value => { recipe.ice = value ?? 0; refreshRatio(); notify(); }, { required: true, 'aria-label': 'Eis (g)' });
  const ratioInput = number(ratio(recipe), value => {
    if (value > 0) { setRatio(recipe, value); coffee.value = coffeeValue(recipe.coffee); notify(); }
  }, { min: 0.1, step: 0.1, required: true, 'aria-label': 'Verhältnis 1 :' });
  function refreshRatio() { ratioInput.value = recipe.coffee > 0 ? ratio(recipe).toFixed(1) : ''; }
  function updateStatus() {
    const remaining = recipe.water - recipe.steps.reduce((n, s) => n + (s.amount || 0), 0);
    const done = Math.abs(remaining) < 0.001;
    stepStatus.textContent = !recipe.steps.length ? '' : done ? 'Vollständig verteilt'
      : remaining > 0 ? `${fmt(remaining)} g offen` : `${fmt(-remaining)} g zu viel`;
    stepStatus.className = `step-status${recipe.steps.length && !done ? ' is-warning' : ''}`;
  }
  function renderSteps() {
    stepsHost.replaceChildren(...recipe.steps.map((step, index) => {
      const mode = modes.get(step.id) || 'add';
      const before = () => recipe.steps.slice(0, index).reduce((n, s) => n + s.amount, 0);
      const amount = number(round(mode === 'add' ? step.amount : before() + step.amount), value => {
        step.amount = mode === 'add' ? value : (value ?? 0) - before();
        notify();
        // Update later cumulative inputs without moving focus or the caret.
        stepsHost.querySelectorAll('[data-cumulative]').forEach(control => {
          const i = Number(control.dataset.cumulative);
          if (i > index) control.value = round(recipe.steps.slice(0, i + 1).reduce((n, s) => n + s.amount, 0));
        });
      }, { min: 0, required: true, 'aria-label': 'Wassermenge (g)', ...(mode === 'total' ? { 'data-cumulative': index } : {}) });
      const timing = select(step.timing?.kind || '', [['', 'Ohne Zeit'], ['at', 'Ab Start'], ['duration', 'Dauer']], value => {
        step.timing = value ? { kind: value, seconds: step.timing?.seconds ?? 0 } : null;
        renderSteps(); notify();
      }, { 'aria-label': 'Zeitangabe' });
      const swap = () => { [recipe.steps[index - 1], recipe.steps[index]] = [recipe.steps[index], recipe.steps[index - 1]]; renderSteps(); notify(); };
      return el('fieldset', { class: 'step-card' }, [
        el('legend', { class: 'sr-only' }, `Schritt ${index + 1}`),
        el('div', { class: 'step-head' }, [
          el('span', { class: 'step-num', 'aria-hidden': 'true' }, String(index + 1)),
          input(step.name, value => { step.name = value; notify(); }, { required: true, 'aria-label': 'Schrittname', class: 'step-name' }),
          iconButton('up', `Schritt ${index + 1} nach oben`, swap, { disabled: index === 0 }),
          iconButton('close', `Schritt ${index + 1} entfernen`, () => { recipe.steps.splice(index, 1); renderSteps(); notify(); }),
        ]),
        el('div', { class: 'grid two' }, [
          field('Menge', amount, { unit: 'g' }),
          field('Angabe', select(mode, [['add', 'Dazugiessen'], ['total', 'Auf total']], value => { modes.set(step.id, value); renderSteps(); }, { 'aria-label': 'Mengenangabe' })),
          field('Zeit', timing),
          step.timing ? field(step.timing.kind === 'at' ? 'Zeitpunkt' : 'Dauer', number(step.timing.seconds, value => { step.timing.seconds = value; notify(); }, { required: true, 'aria-label': 'Zeit (Sekunden)' }), { unit: 's' }) : null,
        ]),
      ]);
    }));
    updateStatus();
  }
  function addStep(name) {
    const rest = Math.max(0, recipe.water - recipe.steps.reduce((n, s) => n + s.amount, 0));
    recipe.steps.push({ id: id(), name, amount: rest, timing: null });
    renderSteps(); notify();
  }
  const cold = recipe.method === 'coldbrew';
  const node = el('div', { class: 'editor' }, [
    metadata ? group('Rezept', [
      field('Name', input(recipe.name, value => { recipe.name = value; changed(); }, { required: true, maxlength: 150, 'aria-label': 'Rezeptname' })),
      field('Quelle', input(recipe.source, value => { recipe.source = value.trim(); changed(); }, { type: 'url', placeholder: 'https://… (optional)', 'aria-label': 'Quellenlink (optional)' })),
    ]) : null,
    group('Mengen', [el('div', { class: 'grid two' }, [
      field('Kaffee', coffee, { unit: 'g' }), field('Wasser', water, { unit: 'g' }),
      recipe.method === 'iced' ? field('Eis', ice, { unit: 'g' }) : null,
      field(recipe.method === 'iced' ? 'Verhältnis inkl. Eis' : 'Verhältnis', ratioInput, { prefix: '1 :' }),
    ])]),
    group('Einstellungen', [el('div', { class: 'grid two' }, [
      bind('grind', 'Mahlgrad', 'Mahlgrad (optional)'),
      field('Einheit', input(recipe.grindUnit, value => { recipe.grindUnit = value; changed(); }, { required: true, placeholder: 'Klicks', 'aria-label': 'Mahlgrad-Einheit' })),
      bind('temperature', 'Temperatur', 'Temperatur (°C, optional)', '°C', { min: 0, max: 100 }),
      cold ? null : bind('brewSeconds', 'Brühzeit', 'Brühzeit gesamt (Sek., optional)', 's'),
      cold ? bind('steepMin', 'Ziehzeit', 'Ziehzeit (Stunden)', 'h') : null,
      cold ? bind('steepMax', 'bis', 'Bis (Stunden, optional)', 'h') : null,
    ])]),
    cold ? null : group('Aufgüsse', [stepsHost, el('div', { class: 'chip-row' }, [
      button([icon('plus'), 'Blooming'], () => addStep('Blooming'), 'chip', { 'aria-label': '+ Blooming' }),
      button([icon('plus'), 'Aufguss'], () => addStep('Aufguss'), 'chip', { 'aria-label': '+ Aufguss' }),
    ])], stepStatus),
    group('Notizen', [textarea(recipe.notes, value => { recipe.notes = value; changed(); }, { 'aria-label': 'Rezeptnotizen (optional)', placeholder: 'Optional' })]),
  ]);
  function refresh() {
    coffee.value = coffeeValue(recipe.coffee); water.value = round(recipe.water); ice.value = round(recipe.ice);
    refreshRatio(); bindings.forEach(fn => fn()); renderSteps();
  }
  renderSteps(); refreshRatio();
  return { node, refresh };
}

export const steepLabel = r => r.steepMin === null ? '–' : `${fmt(r.steepMin)}${r.steepMax !== null ? `–${fmt(r.steepMax)}` : ''} h`;

export function recipeSummary(recipe) {
  const stats = [
    ['Kaffee', fmt(coffeeValue(recipe.coffee)), 'g'], ['Wasser', fmt(recipe.water), 'g'],
    ...(recipe.method === 'iced' ? [['Eis', fmt(recipe.ice), 'g']] : []),
    ['Verhältnis', `1:${fmtRatio(ratio(recipe))}`, ''],
    ['Mahlgrad', recipe.grind === null ? '–' : fmt(recipe.grind), recipe.grind === null ? '' : recipe.grindUnit],
    ['Temperatur', recipe.temperature === null ? '–' : fmt(recipe.temperature), recipe.temperature === null ? '' : '°C'],
    ...(recipe.method === 'coldbrew' ? [['Ziehzeit', steepLabel(recipe), '']]
      : recipe.brewSeconds !== null ? [['Brühzeit', time(recipe.brewSeconds), '']] : []),
  ];
  return el('dl', { class: 'stats' }, stats.map(([label, value, unit]) => el('div', {}, [
    el('dt', {}, label), el('dd', {}, [value, unit ? el('span', { class: 'unit' }, ` ${unit}`) : null]),
  ])));
}

// Start times are only known for explicit points in time or after a known duration.
export function stepSchedule(recipe) {
  let cursor = 0;
  return cumulativeSteps(recipe).map(step => {
    const start = step.timing?.kind === 'at' ? step.timing.seconds : cursor;
    cursor = start !== null && step.timing?.kind === 'duration' ? start + step.timing.seconds : null;
    return { ...step, start };
  });
}
export function stepList(recipe) {
  return el('ol', { class: 'steps' }, stepSchedule(recipe).map(step => el('li', {}, [
    el('span', { class: 'step-at' }, step.start !== null ? time(step.start) : '–'),
    el('span', { class: 'step-copy' }, [el('strong', {}, step.name),
      el('span', {}, `+${fmt(step.amount)} g${step.timing?.kind === 'duration' ? ` · ${time(step.timing.seconds)}` : ''}`)]),
    el('span', { class: 'step-total' }, [fmt(step.cumulative), el('span', { class: 'unit' }, ' g')]),
  ])));
}
