import { el } from '../dom.js';
import { cumulativeSteps, id, ratio, setRatio, setWater } from './model.js';

export const fmt = n => new Intl.NumberFormat('de-CH', { maximumFractionDigits: 2 }).format(n);
export const fmtRatio = n => new Intl.NumberFormat('de-CH', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
const coffeeValue = n => Number.isFinite(n) ? Number(n.toFixed(1)) : '';
export const stamp = date => new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
export const time = seconds => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
export const button = (label, action, kind = '', props = {}) => el('button', { type: 'button', class: `button ${kind}`, onclick: action, ...props }, label);
export const hint = text => el('p', { class: 'muted' }, text);
export const row = (...children) => el('div', { class: 'actions' }, children);
export const section = (title, ...children) => el('section', { class: 'panel' }, [el('h2', {}, title), ...children]);
export const field = (label, control) => {
  if (!control.hasAttribute('aria-label')) control.setAttribute('aria-label', label);
  return el('label', { class: 'field' }, [el('span', {}, label), control]);
};
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
export function textarea(value, change) {
  return el('textarea', { rows: 3, value, oninput: event => change(event.target.value) });
}
export function showError(container, error) {
  container.textContent = error.message || String(error);
  container.hidden = false;
  container.scrollIntoView({ block: 'nearest' });
}
export const errorBox = () => el('div', { class: 'error', role: 'alert', hidden: true });

// Editing is local to the draft. Inputs never replace the page while typing.
export function recipeEditor(recipe, { metadata = false, changed = () => {} } = {}) {
  const bindings = [];
  const stepsHost = el('div', { class: 'step-editor' });
  const stepStatus = el('p', { class: 'muted', 'aria-live': 'polite' });
  const modes = new Map();
  const notify = () => { updateStatus(); changed(); };
  function bind(key, label, options = {}) {
    const control = number(recipe[key], value => { recipe[key] = value; notify(); }, options);
    bindings.push(() => { control.value = recipe[key] ?? ''; });
    return field(label, control);
  }
  const coffee = number(coffeeValue(recipe.coffee), value => { recipe.coffee = value; refreshRatio(); notify(); }, { required: true, min: 0.1, step: 0.1 });
  const water = number(recipe.water, value => {
    setWater(recipe, value ?? 0); refreshRatio(); renderSteps(); notify();
  }, { required: true, min: 0 });
  const ice = number(recipe.ice, value => { recipe.ice = value ?? 0; refreshRatio(); notify(); }, { required: true });
  const ratioInput = number(ratio(recipe), value => {
    if (value > 0) { setRatio(recipe, value); coffee.value = coffeeValue(recipe.coffee); notify(); }
  }, { min: 0.1, step: 0.1, required: true });
  function refreshRatio() { ratioInput.value = recipe.coffee > 0 ? ratio(recipe).toFixed(1) : ''; }
  function round(n) { return Number.isFinite(n) ? Number(n.toFixed(4)) : ''; }
  function updateStatus() {
    const used = recipe.steps.reduce((n, s) => n + (s.amount || 0), 0);
    const remaining = recipe.water - used;
    stepStatus.textContent = recipe.steps.length
      ? Math.abs(remaining) < 0.001 ? `Alle ${fmt(recipe.water)} g Wasser sind verteilt.`
        : remaining > 0 ? `Noch ${fmt(remaining)} g Wasser zu verteilen.` : `${fmt(-remaining)} g mehr als die Wassermenge. Bitte die Schritte anpassen.`
      : 'Optional: Blooming und Aufgüsse ergänzen. Ohne Schritte bleibt das Rezept eine Mengenübersicht.';
  }
  function renderSteps() {
    stepsHost.replaceChildren(...recipe.steps.map((step, index) => {
      const mode = modes.get(step.id) || 'add';
      const before = () => recipe.steps.slice(0, index).reduce((n, s) => n + s.amount, 0);
      const amount = number(mode === 'add' ? step.amount : before() + step.amount, value => {
        step.amount = mode === 'add' ? value : (value ?? 0) - before();
        notify();
        // Update later cumulative inputs without moving focus or the caret.
        stepsHost.querySelectorAll('[data-cumulative]').forEach(control => {
          const i = Number(control.dataset.cumulative);
          if (i > index) control.value = round(recipe.steps.slice(0, i + 1).reduce((n, s) => n + s.amount, 0));
        });
      }, { min: 0, required: true, ...(mode === 'total' ? { 'data-cumulative': index } : {}) });
      const timing = select(step.timing?.kind || '', [['', 'Keine Zeitangabe'], ['at', 'Zeitpunkt ab Start'], ['duration', 'Dauer']], value => {
        step.timing = value ? { kind: value, seconds: step.timing?.seconds ?? 0 } : null;
        renderSteps(); notify();
      });
      return el('fieldset', { class: 'step-card' }, [
        el('legend', {}, `Schritt ${index + 1}`),
        field('Schrittname', input(step.name, value => { step.name = value; notify(); }, { required: true })),
        el('div', { class: 'grid two' }, [
          field('Wassermenge (g)', amount),
          field('Mengenangabe', select(mode, [['add', 'Dazugiessen'], ['total', 'Auf insgesamt']], value => { modes.set(step.id, value); renderSteps(); })),
          field('Zeitangabe', timing),
          step.timing ? field('Zeit (Sekunden)', number(step.timing.seconds, value => { step.timing.seconds = value; notify(); }, { required: true })) : null,
        ]),
        row(
          button('Nach oben', () => { [recipe.steps[index - 1], recipe.steps[index]] = [recipe.steps[index], recipe.steps[index - 1]]; renderSteps(); notify(); }, 'quiet', { disabled: index === 0, 'aria-label': `Schritt ${index + 1} nach oben` }),
          button('Entfernen', () => { recipe.steps.splice(index, 1); renderSteps(); notify(); }, 'quiet', { 'aria-label': `Schritt ${index + 1} entfernen` }),
        ),
      ]);
    }));
    updateStatus();
  }
  const metadataFields = metadata ? [
    field('Rezeptname', input(recipe.name, value => { recipe.name = value; changed(); }, { required: true, maxlength: 150 })),
    field('Quellenlink (optional)', input(recipe.source, value => { recipe.source = value.trim(); changed(); }, { type: 'url', placeholder: 'https://…' })),
  ] : [];
  const settings = el('div', { class: 'grid two' }, [
    bind('grind', 'Mahlgrad (optional)'),
    field('Mahlgrad-Einheit', input(recipe.grindUnit, value => { recipe.grindUnit = value; changed(); }, { required: true, placeholder: 'Klicks' })),
    bind('temperature', 'Temperatur (°C, optional)', { min: 0, max: 100 }),
    recipe.method !== 'coldbrew' ? bind('brewSeconds', 'Brühzeit gesamt (Sek., optional)', { min: 0 }) : null,
    recipe.method === 'coldbrew' ? bind('steepMin', 'Ziehzeit (Stunden)', { min: 0 }) : null,
    recipe.method === 'coldbrew' ? bind('steepMax', 'Bis (Stunden, optional)', { min: 0 }) : null,
  ]);
  const steps = recipe.method !== 'coldbrew' ? [
    el('h3', {}, 'Blooming & Aufgüsse'), stepsHost, stepStatus,
    row(button('+ Blooming', () => addStep('Blooming')), button('+ Aufguss', () => addStep('Aufguss'))),
    hint('Beim Ändern der Wassermenge skalieren vorhandene Schritte mit. Die Zeiten bleiben gleich.'),
  ] : [];
  function addStep(name) {
    const rest = Math.max(0, recipe.water - recipe.steps.reduce((n, s) => n + s.amount, 0));
    recipe.steps.push({ id: id(), name, amount: rest, timing: null });
    renderSteps(); notify();
  }
  const node = el('div', { class: 'editor' }, [
    ...metadataFields,
    el('div', { class: 'grid two' }, [field('Kaffee (g)', coffee), field('Wasser (g / ca. ml)', water),
      recipe.method === 'iced' ? field('Eis (g)', ice) : null, field('Verhältnis 1 :', ratioInput)]),
    hint('Das Verhältnis verwendet Wasser inklusive Eis. Eine Verhältnisänderung passt nur die Kaffeemenge an. Eis bitte wiegen.'),
    settings, ...steps,
    field('Rezeptnotizen (optional)', textarea(recipe.notes, value => { recipe.notes = value; changed(); })),
  ]);
  function refresh() {
    coffee.value = coffeeValue(recipe.coffee); water.value = round(recipe.water); ice.value = round(recipe.ice);
    refreshRatio(); bindings.forEach(fn => fn()); renderSteps();
  }
  renderSteps(); refreshRatio();
  return { node, refresh };
}

export function recipeSummary(recipe) {
  const stats = [ ['Kaffee', `${fmt(coffeeValue(recipe.coffee))} g`], ['Wasser', `${fmt(recipe.water)} g`],
    ...(recipe.method === 'iced' ? [['Eis', `${fmt(recipe.ice)} g`]] : []),
    ['Verhältnis', `1 : ${fmtRatio(ratio(recipe))}`],
    ['Mahlgrad', recipe.grind === null ? 'Nicht festgelegt' : `${fmt(recipe.grind)} ${recipe.grindUnit}`],
    ...(recipe.temperature !== null ? [['Temperatur', `${fmt(recipe.temperature)} °C`]] : []),
  ];
  return el('dl', { class: 'stats' }, stats.map(([label, value]) => {
    const parts = /^(.*?)( g| °C| Klicks)$/.exec(value);
    return el('div', { class: ['Kaffee', 'Wasser', 'Eis'].includes(label) ? 'ingredient-stat' : 'setting-stat' }, [
      el('dt', {}, label), el('dd', {}, parts ? [parts[1], el('span', { class: 'stat-unit' }, parts[2])] : value),
    ]);
  }));
}
export function recipeSteps(recipe) {
  if (recipe.method === 'coldbrew') return el('div', {}, [
    el('h3', {}, 'Ziehzeit'),
    el('p', { class: 'time-label' }, recipe.steepMin === null ? 'Noch nicht festgelegt' : `${fmt(recipe.steepMin)}${recipe.steepMax !== null ? `–${fmt(recipe.steepMax)}` : ''} Stunden`),
    hint('Die Zeit überwachst du selbst. Nach dem Filtern ist dein Cold Brew trinkfertig.'),
  ]);
  return el('div', {}, [
    el('ol', { class: 'brew-steps' }, cumulativeSteps(recipe).map(step => el('li', {}, [
      el('div', {}, [el('strong', {}, step.name), step.timing ? el('span', { class: 'step-time' }, step.timing.kind === 'at' ? `Ab Start ${time(step.timing.seconds)}` : `Dauer ${time(step.timing.seconds)}`) : null]),
      el('p', {}, `${fmt(step.amount)} g dazu → insgesamt ${fmt(step.cumulative)} g Wasser`),
    ]))),
    !recipe.steps.length ? hint('Keine einzelnen Aufgüsse hinterlegt.') : null,
    recipe.method === 'iced' && recipe.steps.length ? hint('Die Gesamtwerte der Schritte zählen nur das Giesswasser. Eis separat abwiegen und die Waage vor dem Aufgiessen tarieren.') : null,
    recipe.brewSeconds !== null ? hint(`Brühzeit gesamt: ${time(recipe.brewSeconds)}`) : null,
  ]);
}
