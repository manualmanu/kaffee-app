import { el } from '../dom.js';
import { METHODS, clone, id, makeBrew, newRecipe, parseBackup, ratio, scaleRecipe, total, validateBean, validateRecipe } from './model.js';
import { icon } from './icons.js';
import { createStore } from './store.js';
import { button, errorBox, field, fmt, fmtRatio, hint, iconButton, input, number, recipeEditor, recipeSummary, segmented, select, shortDate, showError, stamp, steepLabel, stepList, stepSchedule, textarea, time } from './components.js';

const store = createStore({
  getItem: key => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: key => localStorage.removeItem(key),
});
const METHOD_KEY = 'kaffee_ui_method';
const TABS = [['home', 'Brühen', 'brew'], ['beans', 'Bohnen', 'beans'], ['history', 'Verlauf', 'history']];
const root = document.getElementById('app');
let views = [{ page: 'home' }];
let index = 0;
let cleanup = () => {};
let rendered = false;
let notice = '';
let ignoredPops = 0;
const current = () => views[index];
history.replaceState({ coffee: 0 }, '');

// The in-app stack is authoritative; browser history only mirrors "back".
const leaveOk = () => !current().dirty || confirm('Ungespeicherte Änderungen verwerfen?');
function go(view, force = false) {
  if (!force && !leaveOk()) return;
  current().dirty = false;
  views = views.slice(0, index + 1);
  views.push(view);
  index++;
  history.pushState({ coffee: index }, '');
  render(true);
}
function back(force = false) {
  if (index === 0 || (!force && !leaveOk())) return;
  current().dirty = false;
  index--;
  ignoredPops++;
  history.back();
  render(true);
}
function resetTo(stack) {
  current().dirty = false;
  views = stack;
  index = stack.length - 1;
  history.replaceState({ coffee: index }, '');
  render(true);
}
addEventListener('popstate', () => {
  if (ignoredPops) { ignoredPops--; return; }
  if (index === 0) return;
  if (!leaveOk()) { history.pushState({ coffee: index }, ''); return; }
  current().dirty = false;
  index--;
  render(true);
});
addEventListener('beforeunload', event => {
  if (current().dirty) { event.preventDefault(); event.returnValue = ''; }
});

function toast(message) {
  const node = el('div', { class: 'toast', role: 'status' }, message);
  document.body.append(node);
  setTimeout(() => node.classList.add('is-leaving'), 2200);
  setTimeout(() => node.remove(), 2600);
}
function download(contents, filename) {
  const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
  const anchor = el('a', { href: url, download: filename });
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function attempt(error, action) {
  try { action(); } catch (e) { showError(error, e); }
}
function revealInvalidFields(form) {
  // Native validation must be able to focus invalid controls in collapsed settings.
  form.addEventListener('invalid', event => {
    const details = event.target.closest('details');
    if (details) details.open = true;
  }, true);
  return form;
}
function listRow(title, meta, action, aside = null, props = {}) {
  return button([
    el('span', { class: 'row-copy' }, [el('strong', {}, title), meta ? el('span', {}, meta) : null]),
    aside ? el('span', { class: 'row-aside' }, aside) : null,
    icon('chevron', 'row-chevron'),
  ], action, 'list-row', props);
}
const list = (rows, empty) => rows.length ? el('div', { class: 'list' }, rows) : el('p', { class: 'empty' }, empty);
const cta = (label, props = {}) => button(label, null, 'primary cta-button', { type: 'submit', ...props });
const dataAction = () => iconButton('settings', 'Daten', () => go({ page: 'settings' }));
const brewList = (recipeId = null) => store.data.brews.filter(b => !recipeId || b.recipeId === recipeId).sort((a, b) => b.completedAt.localeCompare(a.completedAt));
const grindText = r => r.grind === null ? null : `${fmt(r.grind)} ${r.grindUnit}`;
const recipeMeta = r => [`${fmt(total(r))} ml`, `1:${fmtRatio(ratio(r))}`, grindText(r)].filter(Boolean).join(' · ');
const badge = overall => el('span', { class: `badge badge-${overall || 'open'}` }, overall || 'offen');
function openBrew(recipe, beanId = '', baseline = null) {
  go({ page: 'brew', recipe: clone(recipe), beanId, baseline: baseline ? clone(baseline) : null, timer: { elapsed: 0, since: null } });
}

function home(view) {
  const stored = localStorage.getItem(METHOD_KEY);
  const method = view.method || (METHODS[stored] ? stored : 'pourover');
  const recipes = store.data.recipes.filter(r => r.method === method);
  return {
    title: 'Brühen', actions: [dataAction()],
    body: [
      segmented(Object.entries(METHODS).map(([key, m]) => [key, m.label]), method, key => {
        view.method = key; localStorage.setItem(METHOD_KEY, key); render();
      }, { 'aria-label': 'Methode', class: 'segmented method-switch' }),
      el('div', { class: 'list' }, [
        ...recipes.map(r => listRow(r.name, recipeMeta(r), () => openBrew(r))),
        button([icon('plus'), 'Neues Rezept'], () => go({ page: 'recipeEdit', recipe: newRecipe(method), isNew: true }), 'add-row'),
      ]),
    ],
  };
}

function recipeEdit(view) {
  const error = errorBox();
  const editor = recipeEditor(view.recipe, { metadata: true, changed: () => { view.dirty = true; } });
  const form = revealInvalidFields(el('form', { id: 'recipe-form', class: 'stack', onsubmit: event => {
    event.preventDefault();
    attempt(error, () => {
      view.recipe.name = view.recipe.name.trim();
      validateRecipe(view.recipe);
      store.change(data => {
        const i = data.recipes.findIndex(r => r.id === view.recipe.id);
        if (i < 0) data.recipes.push(clone(view.recipe)); else data.recipes[i] = clone(view.recipe);
      });
      view.dirty = false;
      notice = 'Rezept gespeichert';
      if (view.isNew) {
        resetTo([{ page: 'home', method: view.recipe.method },
          { page: 'brew', recipe: clone(view.recipe), beanId: '', baseline: null, timer: { elapsed: 0, since: null } }]);
        return;
      }
      const previous = views[index - 1];
      if (previous?.page === 'brew') { previous.recipe = clone(view.recipe); previous.baseline = null; previous.dirty = false; }
      back(true);
    });
  } }, [editor.node, error]));
  return {
    kicker: METHODS[view.recipe.method].label, title: view.isNew ? 'Neues Rezept' : 'Rezept bearbeiten',
    body: [form], cta: cta('Speichern', { form: 'recipe-form' }),
  };
}

const sameSettings = (a, b) => JSON.stringify({ ...a, name: '', source: '' }) === JSON.stringify({ ...b, name: '', source: '' });

function brew(view) {
  const r = view.recipe;
  const error = errorBox();
  const summary = el('div');
  const changes = el('p', { class: 'change-note' });
  const applyHost = el('div');
  const lastHost = el('div');
  const editor = recipeEditor(r, { changed: () => { view.dirty = true; refresh(); } });
  const range = input(total(r), () => {}, { type: 'range', min: 5, max: Math.max(2000, Math.ceil(total(r) / 5) * 5), step: 5,
    'aria-label': 'Zielmenge anpassen', oninput: event => scale(Number(event.target.value)) });
  // Unchanged recipes may start off-grid (e.g. 222 ml); user adjustments snap to 5 ml.
  const amount = number(Number(total(r).toFixed(4)), value => { if (value >= 5) scale(value, true); }, {
    required: true, min: 5, step: 5, 'aria-label': 'Zielmenge (ml)',
    onchange: event => { if (event.target.valueAsNumber >= 5) scale(Math.round(event.target.valueAsNumber / 5) * 5); },
  });
  function scale(value, preserveInput = false) {
    Object.assign(r, scaleRecipe(r, value));
    view.dirty = true;
    editor.refresh(); refresh(preserveInput);
  }
  function refresh(preserveInput = false) {
    const target = total(r);
    range.max = Math.max(2000, Math.ceil(target / 5) * 5); range.value = target;
    range.style.setProperty('--fill', `${(target - 5) / (Number(range.max) - 5) * 100}%`);
    if (!preserveInput) amount.value = Number(target.toFixed(4));
    summary.replaceChildren(recipeSummary(r));
    changes.textContent = view.baseline ? changedSettings(view.baseline, r) : '';
    const saved = store.data.recipes.find(x => x.id === r.id);
    applyHost.replaceChildren(...(saved && !sameSettings(saved, r) ? [button('Als Standard ins Rezept übernehmen', () => attempt(error, () => {
      validateRecipe(r);
      if (!confirm('Das Rezept mit diesen Werten aktualisieren? Bisherige Versuche bleiben erhalten.')) return;
      store.change(data => {
        const i = data.recipes.findIndex(recipe => recipe.id === r.id);
        // Keep current recipe metadata when repeating a historical snapshot.
        const { name, source } = data.recipes[i];
        data.recipes[i] = { ...clone(r), name, source };
      });
      toast('Ins Rezept übernommen'); refresh(true);
    }), 'link-button')] : []));
  }
  const beans = store.data.beans.filter(b => !b.archived || b.id === view.beanId);
  const beanSelect = select(view.beanId, [['', 'Ohne Bohne'], ...beans.map(b => [b.id, b.name + (b.archived ? ' (archiviert)' : '')])],
    value => { view.beanId = value; view.dirty = true; refreshLast(); }, { 'aria-label': 'Bohnen wählen' });
  function refreshLast() {
    const last = view.beanId ? brewList(r.id).find(b => b.bean?.id === view.beanId) : null;
    lastHost.replaceChildren(...(last ? [button(['Letzten Versuch übernehmen', el('span', { class: 'muted' }, shortDate(last.completedAt))], () => {
      Object.assign(r, clone(last.recipe)); view.baseline = clone(last.recipe); view.dirty = true;
      editor.refresh(); refresh();
    }, 'link-button', { 'aria-label': 'Letzten Versuch übernehmen' })] : []));
  }
  const cold = r.method === 'coldbrew';
  // Outside the form: an unchanged off-grid amount (e.g. 222 ml) must not block native validation.
  const amountCard = el('section', { class: 'card amount-card', 'aria-label': 'Menge' }, [
      el('div', { class: 'amount-control' }, [
        iconButton('minus', '5 ml weniger', () => scale(Math.max(5, (Math.ceil(total(r) / 5) - 1) * 5)), { class: 'button icon-button round' }),
        el('div', { class: 'amount-number' }, [amount, el('span', {}, r.method === 'iced' ? 'ml inkl. Eis' : 'ml')]),
        iconButton('plus', '5 ml mehr', () => scale((Math.floor(total(r) / 5) + 1) * 5), { class: 'button icon-button round' }),
      ]),
      el('div', { class: 'ruler' }, range),
  ]);
  const form = revealInvalidFields(el('form', { id: 'brew-form', class: 'stack', onsubmit: event => {
    event.preventDefault();
    attempt(error, () => {
      if (!Number.isFinite(amount.valueAsNumber) || amount.valueAsNumber < 5) throw new Error('Bitte eine Zielmenge von mindestens 5 ml eingeben.');
      validateRecipe(r);
      error.hidden = true;
      go({ page: 'run', brew: view }, true);
    });
  } }, [
    el('section', { class: 'card' }, [summary,
      el('details', { class: 'adjust' }, [el('summary', {}, [icon('edit'), 'Werte anpassen']), editor.node]),
    ]),
    el('div', { class: 'card bean-row' }, [icon('beans', 'bean-icon'), beanSelect, iconButton('plus', 'Bohne anlegen', () => {
      // Keep the preparation draft while adding a bean; return directly after saving.
      go({ page: 'beanEdit', bean: freshBean(), returnBrew: view }, true);
    })]),
    lastHost, changes, applyHost, error,
  ]));
  refresh(); refreshLast();
  return {
    kicker: METHODS[r.method].label, title: r.name,
    meta: r.source ? el('a', { href: r.source, target: '_blank', rel: 'noopener noreferrer', class: 'source-link' }, ['Originalrezept', icon('link')]) : null,
    actions: [
      iconButton('history', 'Versuche', () => go({ page: 'history', recipeId: r.id })),
      iconButton('edit', 'Rezept bearbeiten', () => go({ page: 'recipeEdit', recipe: store.data.recipes.find(x => x.id === r.id), isNew: false })),
    ],
    body: [amountCard, form], cta: cta([cold ? 'Ansetzen' : 'Brühen starten', icon('arrow')], { form: 'brew-form' }),
  };
}

function run(view) {
  const b = view.brew;
  const r = b.recipe;
  const error = errorBox();
  const cold = r.method === 'coldbrew';
  const bean = store.data.beans.find(x => x.id === b.beanId);
  const facts = [`${fmt(Number(r.coffee.toFixed(1)))} g Kaffee`, `${fmt(r.water)} g Wasser`, r.method === 'iced' ? `${fmt(r.ice)} g Eis` : null,
    grindText(r), r.temperature !== null ? `${fmt(r.temperature)} °C` : null].filter(Boolean);
  const finish = button(['Fertig', icon('check')], () => attempt(error, () => {
    const saved = makeBrew(r, bean || null);
    store.change(data => { data.brews.unshift(saved); });
    b.dirty = false; b.timer.since = null;
    resetTo([{ page: 'home', method: r.method }, { page: 'rating', brewId: saved.id, fromBrew: true }]);
  }), 'primary cta-button');
  return {
    kicker: METHODS[r.method].label, title: cold ? 'Ansetzen' : 'Brühen',
    body: [
      el('ul', { class: 'facts', 'aria-label': 'Einstellungen' }, facts.map(f => el('li', {}, f))),
      cold ? el('section', { class: 'card steep-card' }, [el('span', { class: 'label' }, 'Ziehzeit'), el('strong', {}, steepLabel(r)), bean ? hint(bean.name) : null])
        : timerPanel(b.timer, r),
      r.method === 'iced' && r.steps.length ? hint(`${fmt(r.ice)} g Eis ins Gefäss, dann Waage tarieren.`) : null,
      r.notes ? el('p', { class: 'recipe-notes' }, r.notes) : null,
      error,
    ],
    cta: finish,
  };
}

function timerPanel(timer, r) {
  const schedule = stepSchedule(r);
  const steps = r.steps.length ? stepList(r) : null;
  const items = steps ? [...steps.children] : [];
  const clock = el('output', { class: 'timer-value', 'aria-label': 'Verstrichene Brühzeit' });
  const now = el('p', { class: 'timer-now', 'aria-live': 'polite' });
  const label = el('span');
  const elapsed = () => timer.elapsed + (timer.since === null ? 0 : Date.now() - timer.since);
  const toggle = button([el('span', { class: 'toggle-icons' }, [icon('play', 'play-icon'), icon('pause', 'pause-icon')]), label], () => {
    if (timer.since === null) timer.since = Date.now();
    else { timer.elapsed = elapsed(); timer.since = null; }
    tick();
  }, 'timer-toggle');
  const reset = iconButton('reset', 'Zurücksetzen', () => { timer.elapsed = 0; timer.since = null; tick(); });
  let lastNow = '';
  const tick = () => {
    const seconds = Math.floor(elapsed() / 1000);
    const started = timer.since !== null || timer.elapsed > 0;
    clock.textContent = time(seconds);
    label.textContent = timer.since !== null ? 'Pause' : timer.elapsed ? 'Weiter' : 'Start';
    toggle.classList.toggle('is-running', timer.since !== null);
    let active = -1;
    schedule.forEach((s, i) => { if (started && s.start !== null && s.start <= seconds) active = i; });
    items.forEach((item, i) => { item.classList.toggle('is-active', i === active); item.classList.toggle('is-done', i < active); });
    const next = schedule.find(s => s.start !== null && s.start > seconds);
    const text = !started ? (r.brewSeconds !== null ? `Ziel ${time(r.brewSeconds)}` : '')
      : [active >= 0 ? `${schedule[active].name} · auf ${fmt(schedule[active].cumulative)} g` : null, next ? `nächster in ${time(next.start - seconds)}` : null].filter(Boolean).join(' — ');
    if (text !== lastNow) { now.textContent = text; lastNow = text; }
  };
  tick();
  const interval = setInterval(tick, 250);
  cleanup = () => clearInterval(interval);
  return el('div', { class: 'stack' }, [
    el('section', { class: 'timer', 'aria-label': 'Timer' }, [clock, now, el('div', { class: 'timer-actions' }, [toggle, reset])]),
    steps ? el('section', { class: 'card' }, steps) : null,
  ]);
}

function changedSettings(before, after) {
  const changes = [];
  for (const [key, label, unit] of [['grind', 'Mahlgrad', ''], ['coffee', 'Kaffee', ' g'], ['water', 'Wasser', ' g'], ['ice', 'Eis', ' g'], ['temperature', 'Temperatur', ' °C'], ['brewSeconds', 'Brühzeit', ' s'], ['steepMin', 'Ziehzeit', ' h'], ['steepMax', 'Ziehzeit bis', ' h']]) {
    if (before[key] !== after[key]) changes.push(`${label}: ${after[key] === null ? 'offen' : fmt(after[key]) + unit} statt ${before[key] === null ? 'offen' : fmt(before[key]) + unit}`);
  }
  if (before.grindUnit !== after.grindUnit) changes.push(`Einheit: ${after.grindUnit} statt ${before.grindUnit}`);
  if (JSON.stringify(before.steps) !== JSON.stringify(after.steps)) changes.push('Aufgüsse angepasst');
  return changes.length ? changes.join(' · ') : 'Werte aus früherem Versuch';
}

function historyView(view) {
  const method = view.filterMethod || '';
  const overall = view.filterOverall || '';
  const all = brewList(view.recipeId);
  const recipe = view.recipeId ? store.data.recipes.find(r => r.id === view.recipeId) : null;
  const shown = all.filter(brew => (!method || brew.recipe.method === method)
    && (!overall || (overall === 'unbewertet' ? !brew.rating.overall : brew.rating.overall === overall)));
  const filters = el('div', { class: 'filters' }, [
    view.recipeId ? null : select(method, [['', 'Alle Methoden'], ...Object.entries(METHODS).map(([key, value]) => [key, value.label])], value => { view.filterMethod = value; render(); }, { 'aria-label': 'Methode filtern', class: 'pill-select' }),
    select(overall, [['', 'Alle Urteile'], ['gut', 'Gut'], ['mittel', 'Mittel'], ['schlecht', 'Schlecht'], ['unbewertet', 'Unbewertet']], value => { view.filterOverall = value; render(); }, { 'aria-label': 'Gesamturteil filtern', class: 'pill-select' }),
  ]);
  const rows = shown.map(brew => listRow(
    view.recipeId ? brew.bean?.name || 'Ohne Bohne' : brew.recipe.name,
    view.recipeId ? recipeMeta(brew.recipe) : [brew.bean?.name || 'Ohne Bohne', grindText(brew.recipe)].filter(Boolean).join(' · '),
    () => go({ page: 'rating', brewId: brew.id }),
    [el('span', { class: 'row-date' }, shortDate(brew.completedAt)), badge(brew.rating.overall)],
  ));
  return {
    kicker: recipe ? 'Versuche' : null, title: recipe ? recipe.name : 'Verlauf', actions: view.recipeId ? [] : [dataAction()],
    body: [all.length ? filters : null, list(rows, all.length ? 'Keine Versuche für diesen Filter.' : 'Noch keine Versuche. Nach dem Brühen erscheinen sie hier.')],
  };
}

function rating(view) {
  const brew = store.data.brews.find(b => b.id === view.brewId);
  if (!brew) return { title: 'Versuch nicht gefunden', body: [] };
  const draft = view.rating || (view.rating = clone(brew.rating));
  const error = errorBox();
  const choices = (label, key, options) => el('fieldset', { class: 'rating-group' }, [
    el('legend', {}, label),
    segmented(options.map(o => [o, o]), draft[key], value => {
      draft[key] = draft[key] === value ? null : value; view.dirty = true;
      return draft[key];
    }),
  ]);
  const form = el('form', { id: 'rating-form', class: 'card rating-card', onsubmit: event => {
    event.preventDefault();
    attempt(error, () => {
      store.change(data => { data.brews.find(b => b.id === brew.id).rating = clone(draft); });
      view.dirty = false;
      notice = 'Bewertung gespeichert';
      if (view.fromBrew) resetTo([views[0]]); else back(true);
    });
  } }, [
    choices('Gesamt', 'overall', ['gut', 'mittel', 'schlecht']),
    choices('Säure', 'acidity', ['zu wenig', 'passend', 'zu viel']),
    choices('Bitterkeit', 'bitterness', ['zu wenig', 'passend', 'zu viel']),
    field('Notiz', textarea(draft.note, value => { draft.note = value; view.dirty = true; }, { 'aria-label': 'Notiz (optional)', placeholder: 'Optional' })),
    error,
  ]);
  const r = brew.recipe;
  return {
    kicker: stamp(brew.completedAt), title: r.name, meta: el('p', { class: 'muted' }, brew.bean?.name || 'Ohne Bohne'), noBack: view.fromBrew,
    actions: view.fromBrew ? [button('Später', () => resetTo([views[0]]), 'text-button')]
      : [iconButton('repeat', 'Wiederholen', () => openBrew(r, brew.bean?.id || '', r))],
    body: [
      el('h2', { class: 'section-title' }, 'Wie war er?'), form,
      el('details', { class: 'card adjust' }, [el('summary', {}, 'Verwendete Werte'), el('div', { class: 'stack' }, [
        recipeSummary(r), r.steps.length ? stepList(r) : null, r.notes ? el('p', { class: 'recipe-notes' }, r.notes) : null,
      ])]),
    ],
    cta: cta('Bewertung speichern', { form: 'rating-form' }),
  };
}

function freshBean() { return { id: id(), name: '', roaster: '', processing: '', roastDate: '', notes: '', archived: false }; }
function roastAge(date) {
  if (!date) return null;
  const days = Math.floor((Date.now() - new Date(`${date}T00:00`)) / 864e5);
  return days <= 0 ? 'heute geröstet' : days === 1 ? 'vor 1 Tag geröstet' : `vor ${days} Tagen geröstet`;
}
function beans() {
  const all = store.data.beans;
  const row = bean => listRow(bean.name, [bean.roaster, bean.processing, roastAge(bean.roastDate)].filter(Boolean).join(' · '), () => go({ page: 'beanEdit', bean: clone(bean) }));
  const archived = all.filter(b => b.archived);
  return {
    title: 'Bohnen', actions: [iconButton('plus', 'Bohne anlegen', () => go({ page: 'beanEdit', bean: freshBean() })), dataAction()],
    body: [
      list(all.filter(b => !b.archived).map(row), 'Noch keine Bohnen. Ein Name reicht zum Anlegen.'),
      archived.length ? el('details', { class: 'archive' }, [el('summary', {}, `Archiviert · ${archived.length}`), el('div', { class: 'list' }, archived.map(row))]) : null,
    ],
  };
}
function beanEdit(view) {
  const b = view.bean;
  const error = errorBox();
  const exists = store.data.beans.some(bean => bean.id === b.id);
  const text = (key, label, props = {}) => field(label, input(b[key], value => { b[key] = value; view.dirty = true; }, props));
  const form = el('form', { id: 'bean-form', class: 'stack', onsubmit: event => {
    event.preventDefault();
    attempt(error, () => {
      b.name = b.name.trim(); validateBean(b);
      store.change(data => { const i = data.beans.findIndex(bean => bean.id === b.id); if (i < 0) data.beans.push(clone(b)); else data.beans[i] = clone(b); });
      view.dirty = false;
      notice = 'Bohne gespeichert';
      if (view.returnBrew) { view.returnBrew.beanId = b.id; view.returnBrew.dirty = true; }
      back(true);
    });
  } }, [
    el('section', { class: 'form-group' }, [
      text('name', 'Name', { required: true, maxlength: 150, 'aria-label': 'Bohnenname' }),
      el('div', { class: 'grid two' }, [
        text('roaster', 'Röster', { 'aria-label': 'Röster (optional)', placeholder: 'Optional' }),
        text('roastDate', 'Röstdatum', { type: 'date', 'aria-label': 'Röstdatum (optional)' }),
      ]),
      text('processing', 'Aufbereitung', { list: 'processing-options', placeholder: 'z. B. Washed', 'aria-label': 'Aufbereitung (optional)' }),
      el('datalist', { id: 'processing-options' }, ['Washed', 'Natural', 'Honey', 'Fermented', 'Anaerobic fermented', 'Carbonic maceration'].map(value => el('option', { value }))),
      field('Notizen', textarea(b.notes, value => { b.notes = value; view.dirty = true; }, { 'aria-label': 'Notizen (optional)', placeholder: 'Optional' })),
    ]),
    error,
  ]);
  const brews = exists ? brewList().filter(brew => brew.bean?.id === b.id) : [];
  return {
    kicker: 'Bohne', title: exists ? b.name || 'Bohne' : 'Neue Bohne',
    body: [form,
      brews.length ? el('section', { class: 'stack' }, [el('h2', { class: 'section-title' }, 'Versuche'),
        list(brews.map(brew => listRow(brew.recipe.name, recipeMeta(brew.recipe), () => go({ page: 'rating', brewId: brew.id }),
          [el('span', { class: 'row-date' }, shortDate(brew.completedAt)), badge(brew.rating.overall)])), '')]) : null,
      exists ? button(b.archived ? 'Wieder aktivieren' : 'Bohne archivieren', () => attempt(error, () => {
        validateBean(b);
        store.change(data => { data.beans[data.beans.findIndex(bean => bean.id === b.id)] = { ...clone(b), archived: !b.archived }; });
        notice = b.archived ? 'Bohne aktiviert' : 'Bohne archiviert';
        back(true);
      }), 'text-button danger') : null,
    ],
    cta: cta('Bohne speichern', { form: 'bean-form' }),
  };
}

function importControl(error) {
  const file = input('', () => {}, { type: 'file', accept: '.json,application/json', class: 'sr-only', 'aria-label': 'Backup-Datei', onchange: async event => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    try {
      const json = await selected.text();
      const parsed = parseBackup(json);
      if (!confirm(`Backup mit ${parsed.recipes.length} Rezepten, ${parsed.beans.length} Bohnen und ${parsed.brews.length} Versuchen. Alle aktuellen Daten ersetzen?`)) return;
      store.import(json);
      notice = 'Backup importiert';
      resetTo([{ page: 'home' }]);
    } catch (e) { showError(error, e); }
    finally { file.value = ''; }
  } });
  return el('label', { class: 'button secondary' }, ['Backup importieren', file]);
}
function settings() {
  const error = errorBox();
  const data = store.data;
  return {
    title: 'Daten',
    body: [
      el('dl', { class: 'card stats' }, [['Rezepte', data.recipes.length], ['Bohnen', data.beans.length], ['Versuche', data.brews.length]]
        .map(([label, value]) => el('div', {}, [el('dt', {}, label), el('dd', {}, String(value))]))),
      el('div', { class: 'stack tight' }, [
        button('Backup exportieren', () => attempt(error, () => download(store.export(), `kaffee-backup-${new Date().toISOString().slice(0, 10)}.json`)), 'primary'),
        importControl(error), error,
      ]),
      hint('Alle Daten bleiben auf diesem Gerät und funktionieren offline. Ein Import ersetzt den aktuellen Stand.'),
    ],
  };
}
function recovery() {
  const error = errorBox();
  return {
    title: store.legacy ? 'Neustart nötig' : 'Daten konnten nicht geladen werden.',
    body: [
      hint(store.problem || 'Diese Version nutzt ein neues Datenformat. Sichere die alten Daten, bevor du neu startest.'),
      el('div', { class: 'stack tight' }, [
        button('Vorhandene Daten sichern', () => attempt(error, () => download(store.exportRaw(), 'kaffee-vor-neustart.json')), 'secondary'),
        button('Neustart bestätigen', () => attempt(error, () => {
          if (!confirm('Bisherige lokale Daten entfernen und leer starten? Ohne Backup lässt sich das nicht rückgängig machen.')) return;
          store.restart(); resetTo([{ page: 'home' }]);
        }), 'primary'), importControl(error), error,
      ]),
    ],
  };
}

const PAGES = { home, recipeEdit, brew, run, history: historyView, rating, beans, beanEdit, settings };
function render(navigated = false) {
  cleanup(); cleanup = () => {};
  const view = current();
  const blocked = store.problem || store.legacy;
  const page = blocked ? recovery() : PAGES[view.page](view);
  view.title = page.title;
  const previous = index > 0 && !blocked && !page.noBack ? views[index - 1] : null;
  const backLabel = previous && (previous.title || TABS.find(([tab]) => tab === previous.page)?.[1] || 'Zurück');
  const topbar = el('header', { class: 'topbar' }, [
    previous ? button([icon('back'), el('span', {}, backLabel)], () => back(), 'back-button', { 'aria-label': 'Zurück' })
      : el('span', { class: 'wordmark' }, ['kaffee', el('span', {}, '.')]),
    el('div', { class: 'topbar-actions' }, page.actions || []),
  ]);
  const main = el('main', { id: 'main', class: `page page-${blocked ? 'recovery' : view.page}${navigated && rendered ? ' enter' : ''}` }, [
    el('div', { class: 'page-head' }, [page.kicker ? el('p', { class: 'kicker' }, page.kicker) : null, el('h1', { tabindex: -1 }, page.title), page.meta || null]),
    ...page.body,
    page.cta ? el('div', { class: 'cta' }, page.cta) : null,
  ]);
  const showNav = index === 0 && !blocked;
  const nav = showNav ? el('nav', { class: 'tabbar', 'aria-label': 'Hauptnavigation' }, TABS.map(([tab, label, glyph]) => button([icon(glyph), el('span', {}, label)], () => {
    if (views[0].page !== tab) resetTo([{ page: tab }]);
  }, 'tab', { 'aria-current': views[0].page === tab ? 'page' : null }))) : null;
  root.replaceChildren(el('div', { class: `app-shell${showNav ? ' has-nav' : ''}` }, [topbar, main, nav]));
  if (notice) { toast(notice); notice = ''; }
  document.title = `${page.title} · Kaffee`;
  if (navigated) { window.scrollTo(0, 0); main.querySelector('h1')?.focus({ preventScroll: true }); }
  rendered = true;
}
render();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
  // Register immediately: this module may finish loading after the window load event.
  navigator.serviceWorker.register('./sw.js').catch(error => {
    toast('Offline-Modus gerade nicht verfügbar');
    console.warn('Offline registration failed:', error.message);
  });
}
