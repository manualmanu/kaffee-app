import { el } from '../dom.js';
import { METHODS, clone, cumulativeSteps, id, makeBrew, newRecipe, parseBackup, ratio, scaleRecipe, total, validateBean, validateRecipe } from './model.js';
import { icon } from './icons.js';
import { createStore } from './store.js';
import { button, errorBox, field, fmt, fmtRatio, hint, input, number, recipeEditor, recipeSteps, recipeSummary, row, section, select, showError, stamp, textarea, time } from './components.js';

const store = createStore({
  getItem: key => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: key => localStorage.removeItem(key),
});
const root = document.getElementById('app');
let views = [{ page: 'home' }];
let index = 0;
let cleanup = () => {};
let rendered = false;
let notice = '';
const current = () => views[index];
history.replaceState({ coffee: index }, '');

function go(view, force = false) {
  if (!force && current().dirty && !confirm('Ungespeicherte Änderungen verwerfen?')) return;
  current().dirty = false;
  views = views.slice(0, index + 1);
  views.push(view);
  index++;
  history.pushState({ coffee: index }, '');
  render(true);
}
addEventListener('popstate', event => {
  const target = event.state?.coffee;
  if (!Number.isInteger(target) || !views[target] || target === index) return;
  if (current().dirty && !confirm('Ungespeicherte Änderungen verwerfen?')) {
    history.go(index - target);
    return;
  }
  current().dirty = false;
  index = target;
  render(true);
});
addEventListener('beforeunload', event => {
  if (current().dirty) { event.preventDefault(); event.returnValue = ''; }
});

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
function title(kicker, heading) {
  return el('header', { class: 'page-heading' }, [el('p', { class: 'eyebrow' }, kicker), el('h1', { tabindex: -1 }, heading)]);
}
function card(heading, description, action, eyebrow = '') {
  return button([el('span', { class: 'card-copy' }, [eyebrow ? el('span', { class: 'eyebrow' }, eyebrow) : null,
    el('strong', {}, heading), el('span', { class: 'muted' }, description)]), icon('arrow', 'card-arrow')], action, 'list-card');
}
function brewList(recipeId = null) {
  return store.data.brews.filter(b => !recipeId || b.recipeId === recipeId).sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}
function openBrew(recipe, beanId = '', baseline = null) {
  go({ page: 'brew', recipe: clone(recipe), beanId, baseline: baseline ? clone(baseline) : null, timer: { elapsed: 0, since: null } });
}

function home() {
  return [title('Brühen', 'Kaffee.'),
    el('div', { class: 'section-label' }, [el('span', {}, 'Methoden'), el('span', {}, '03')]),
    el('div', { class: 'method-list' }, Object.entries(METHODS).map(([key, method]) => {
      const count = store.data.recipes.filter(r => r.method === key).length;
      return button([
        el('span', { class: 'method-index' }, method.mark),
        el('span', { class: 'method-copy' }, [el('strong', {}, method.label), el('span', { class: 'muted' }, key === 'pourover' ? 'Heiss & von Hand' : key === 'iced' ? 'Heiss gebrüht, auf Eis' : 'Kalt & mit Zeit')]),
        el('span', { class: 'method-end' }, icon('arrow')),
      ], () => go({ page: 'recipes', method: key }), 'method-row', { 'aria-label': `${method.mark} ${method.label} · ${count} ${count === 1 ? 'Rezept' : 'Rezepte'}` });
    })),
  ];
}
function recipes(view) {
  const list = store.data.recipes.filter(r => r.method === view.method);
  return [title('Brühen', METHODS[view.method].label),
    el('div', { class: 'section-label list-header' }, [el('span', {}, 'Rezepte'), button('+ Neu', () => go({ page: 'recipeEdit', recipe: newRecipe(view.method), isNew: true }), 'quiet')]),
    !list.length ? section('Dein erstes Rezept', hint('Übernimm konkrete Mengen oder ein Verhältnis. Blooming und weitere Aufgüsse ergänzt du nur, wenn du sie brauchst.')) : null,
    el('div', { class: 'cards' }, list.map(recipe => card(recipe.name, `${fmt(total(recipe))} g · 1 : ${fmtRatio(ratio(recipe))} · ${brewList(recipe.id).length} Versuche`, () => openBrew(recipe)))),
  ];
}
function recipeEdit(view) {
  const error = errorBox();
  const editor = recipeEditor(view.recipe, { metadata: true, changed: () => { view.dirty = true; } });
  const form = el('form', { class: 'panel', onsubmit: event => {
    event.preventDefault();
    attempt(error, () => {
      view.recipe.name = view.recipe.name.trim();
      validateRecipe(view.recipe);
      store.change(data => {
        const i = data.recipes.findIndex(r => r.id === view.recipe.id);
        if (i < 0) data.recipes.push(clone(view.recipe)); else data.recipes[i] = clone(view.recipe);
      });
      view.dirty = false;
      notice = 'Rezept gespeichert.';
      openBrew(view.recipe);
    });
  } }, [editor.node, error, button('Rezept speichern', null, 'primary', { type: 'submit' })]);
  return [title(METHODS[view.recipe.method].label, view.isNew ? 'Neues Rezept' : 'Rezept bearbeiten'), form];
}
function brew(view) {
  if (view.completedId) { view.brewId = view.completedId; return rating(view); }
  const r = view.recipe;
  const error = errorBox();
  const summary = el('div');
  const steps = el('div');
  const stepCount = el('span');
  const changes = el('p', { class: 'change-note' });
  const lastHost = el('div');
  const notes = el('p', { class: 'recipe-notes' });
  const editor = recipeEditor(r, { changed: () => { view.dirty = true; refresh(); } });
  const range = input(total(r), () => {}, { type: 'range', min: 5, max: Math.max(2000, Math.ceil(total(r) / 5) * 5), step: 5,
    'aria-label': 'Zielmenge anpassen', oninput: event => scale(Number(event.target.value)) });
  const amount = number(Number(total(r).toFixed(4)), value => { if (value >= 5) scale(value, true); }, {
    required: true, min: 5, step: 5, 'aria-label': 'Zielmenge (ml)',
    onchange: event => { if (event.target.valueAsNumber >= 5) scale(Math.round(event.target.valueAsNumber / 5) * 5); },
  });
  const scaleLabels = el('div', { class: 'scale-labels', 'aria-hidden': true });
  const presets = [200, 300, 500, 1000].map(n => button(`${n} ml`, () => scale(n), 'quantity-preset', { 'aria-pressed': String(total(r) === n) }));
  function scale(value, preserveInput = false) {
    Object.assign(r, scaleRecipe(r, value));
    view.dirty = true;
    editor.refresh(); refresh(preserveInput);
  }
  function refresh(preserveInput = false) {
    const target = total(r);
    range.max = Math.max(2000, Math.ceil(target / 5) * 5); range.value = target;
    scaleLabels.replaceChildren(...[5, ...[.25, .5, .75, 1].map(f => Math.round(Number(range.max) * f / 5) * 5)].map(n => el('span', {}, fmt(n))));
    presets.forEach((preset, i) => preset.setAttribute('aria-pressed', String([200, 300, 500, 1000][i] === target)));
    if (!preserveInput) amount.value = Number(target.toFixed(4));
    summary.replaceChildren(recipeSummary(r)); steps.replaceChildren(recipeSteps(r));
    stepCount.textContent = r.method === 'coldbrew' ? 'Mit Zeit' : `${String(r.steps.length).padStart(2, '0')} Schritte`;
    notes.textContent = r.notes;
    changes.textContent = view.baseline ? changedSettings(view.baseline, r) : '';
  }
  const beanOptions = [['', 'Ohne Bohne zubereiten'], ...store.data.beans.filter(b => !b.archived || b.id === view.beanId).map(b => [b.id, b.name + (b.archived ? ' (archiviert)' : '')])];
  const beanSelect = select(view.beanId, beanOptions, value => { view.beanId = value; view.dirty = true; refreshLast(); }, { 'aria-label': 'Bohnen wählen' });
  function refreshLast() {
    const last = view.beanId ? brewList(r.id).find(b => b.bean?.id === view.beanId) : null;
    lastHost.replaceChildren(...(last ? [hint(`Zuletzt mit dieser Bohne: ${stamp(last.completedAt)}`), button('Letzten Versuch übernehmen', () => {
      Object.assign(r, clone(last.recipe)); view.baseline = clone(last.recipe); view.dirty = true;
      editor.refresh(); refresh(); notice = '';
    }, 'secondary')] : []));
  }
  const adjustments = el('details', { class: 'panel adjustment-panel' }, [el('summary', {}, 'Einstellungen für diesen Versuch anpassen'), editor.node]);
  const timer = r.method !== 'coldbrew' ? timerPanel(view) : null;
  const complete = button(['Fertig · Versuch speichern', icon('arrow')], null, 'primary', { type: 'submit' });
  // The scaling control is separate from recipe validation: an unchanged recipe
  // may legitimately start at e.g. 222 ml. User adjustments snap to 5 ml.
  const quantityPanel = el('section', { class: 'quantity-panel' }, [
    el('div', { class: 'section-label' }, [el('h2', {}, 'Deine Menge'), el('span', {}, '5 ml / Schritt')]),
    el('div', { class: 'amount-control' }, [
      button(icon('minus'), () => scale(Math.max(5, (Math.ceil(total(r) / 5) - 1) * 5)), 'amount-step', { 'aria-label': '5 ml weniger' }),
      el('div', { class: 'amount-number' }, [amount, el('span', {}, 'ml')]),
      button(icon('plus'), () => scale((Math.floor(total(r) / 5) + 1) * 5), 'amount-step', { 'aria-label': '5 ml mehr' }),
    ]),
    el('div', { class: 'ruler' }, [range, scaleLabels]),
    el('div', { class: 'quantity-presets' }, presets),
    hint('Wasser inkl. Eis. Die fertige Getränkemenge ist etwas kleiner.'),
    summary,
  ]);
  const form = revealInvalidFields(el('form', { class: 'brew-form', onsubmit: event => {
    event.preventDefault();
    attempt(error, () => {
      if (view.completedId) return;
      if (!Number.isFinite(amount.valueAsNumber) || amount.valueAsNumber < 5) {
        amount.reportValidity();
        throw new Error('Bitte eine Zielmenge von mindestens 5 ml eingeben.');
      }
      const bean = store.data.beans.find(b => b.id === view.beanId) || null;
      const saved = makeBrew(r, bean);
      store.change(data => { data.brews.unshift(saved); });
      view.completedId = saved.id; view.dirty = false; view.timer.since = null;
      go({ page: 'rating', brewId: saved.id }, true);
    });
  } }, [
    el('section', { class: 'bean-panel' }, [el('div', { class: 'bean-select-row' }, [field('Bohnen · optional', beanSelect),
      button(icon('plus'), () => {
        // Keep the preparation draft while adding a bean; return directly after saving.
        go({ page: 'beanEdit', bean: freshBean(), returnBrew: view }, true);
      }, 'icon-button', { 'aria-label': '+ Bohne anlegen' })]), lastHost]),
    changes, adjustments,
    el('section', { class: 'preparation-panel' }, [el('div', { class: 'section-label' }, [el('h2', {}, r.method === 'coldbrew' ? 'Ziehen lassen' : 'Zubereitung'), stepCount]), timer, steps, notes]),
    error,
    el('div', { class: 'finish-bar' }, [complete, hint('Speichert deine Einstellungen. Bewerten kannst du auch später.')]),
  ]));
  const applyError = errorBox();
  const apply = button('Einstellungen ins Ausgangsrezept übernehmen', () => attempt(applyError, () => {
    validateRecipe(r);
    if (!confirm('Das Ausgangsrezept mit diesen Mengen, Einstellungen und Schritten aktualisieren? Bisherige Versuche bleiben erhalten.')) return;
    store.change(data => {
      const i = data.recipes.findIndex(recipe => recipe.id === r.id);
      if (i < 0) throw new Error('Das Ausgangsrezept fehlt.');
      // Keep current recipe metadata when repeating a historical snapshot.
      const { name, source } = data.recipes[i];
      data.recipes[i] = { ...clone(r), name, source };
    });
    apply.textContent = 'Ins Ausgangsrezept übernommen';
  }), 'quiet');
  refresh(); refreshLast();
  return [title(`${METHODS[r.method].label} / Zubereitung`, r.name),
    el('div', { class: 'brew-toolbar' }, [button([icon('history'), 'Versuche'], () => go({ page: 'history', recipeId: r.id }), 'quiet', { 'aria-label': 'Versuche' }),
      button([icon('edit'), 'Rezept bearbeiten'], () => go({ page: 'recipeEdit', recipe: store.data.recipes.find(recipe => recipe.id === r.id), isNew: false }), 'quiet', { 'aria-label': 'Ausgangsrezept bearbeiten' })]),
    quantityPanel, form,
    el('div', { class: 'recipe-footer' }, [apply, r.source ? el('a', { href: r.source, target: '_blank', rel: 'noopener noreferrer', class: 'source-link' }, 'Originalrezept öffnen ↗') : null]), applyError,
  ];
}

function timerPanel(view) {
  const clock = el('output', { class: 'timer-value', 'aria-label': 'Verstrichene Brühzeit' });
  const timer = view.timer;
  const status = el('span', { class: 'timer-status' });
  const label = el('span');
  const elapsed = () => timer.elapsed + (timer.since === null ? 0 : Date.now() - timer.since);
  const toggle = button([el('span', { class: 'toggle-icons' }, [icon('play', 'play-icon'), icon('pause', 'pause-icon')]), label], () => {
    if (timer.since === null) timer.since = Date.now();
    else { timer.elapsed = elapsed(); timer.since = null; }
    tick();
  }, 'secondary');
  const reset = button('Zurücksetzen', () => { timer.elapsed = 0; timer.since = null; tick(); }, 'quiet');
  const tick = () => {
    clock.textContent = time(Math.floor(elapsed() / 1000));
    label.textContent = timer.since === null ? (timer.elapsed ? 'Timer fortsetzen' : 'Timer starten') : 'Timer pausieren';
    toggle.classList.toggle('is-running', timer.since !== null);
    status.textContent = timer.since === null ? (timer.elapsed ? 'Pausiert' : 'Bereit') : 'Läuft';
    status.classList.toggle('is-running', timer.since !== null);
  };
  tick();
  const interval = setInterval(tick, 250);
  cleanup = () => clearInterval(interval);
  return el('div', { class: 'timer' }, [el('div', { class: 'section-label' }, [el('span', {}, 'Brühzeit'), status]), clock, row(toggle, reset)]);
}

function changedSettings(before, after) {
  const changes = [];
  for (const [key, label, unit] of [['grind', 'Mahlgrad', ''], ['coffee', 'Kaffee', ' g'], ['water', 'Wasser', ' g'], ['ice', 'Eis', ' g'], ['temperature', 'Temperatur', ' °C'], ['brewSeconds', 'Brühzeit', ' s'], ['steepMin', 'Ziehzeit', ' h'], ['steepMax', 'Ziehzeit bis', ' h']]) {
    if (before[key] !== after[key]) changes.push(`${label}: ${after[key] === null ? 'offen' : fmt(after[key]) + unit} statt ${before[key] === null ? 'offen' : fmt(before[key]) + unit}`);
  }
  if (before.grindUnit !== after.grindUnit) changes.push(`Einheit: ${after.grindUnit} statt ${before.grindUnit}`);
  if (JSON.stringify(before.steps) !== JSON.stringify(after.steps)) changes.push('Aufgüsse angepasst');
  return changes.length ? changes.join(' · ') : 'Einstellungen aus dem gewählten Versuch übernommen.';
}
function brewCard(brew) {
  return card(brew.recipe.name, `${brew.bean?.name || 'Ohne Bohne'} · ${brew.rating.overall || 'Noch nicht bewertet'}`, () => go({ page: 'rating', brewId: brew.id }), stamp(brew.completedAt));
}
function historyView(view) {
  const method = view.filterMethod || '';
  const overall = view.filterOverall || '';
  const all = brewList(view.recipeId);
  const list = all.filter(brew => (!method || brew.recipe.method === method)
    && (!overall || (overall === 'unbewertet' ? !brew.rating.overall : brew.rating.overall === overall)));
  const methodFilter = select(method, [['', 'Alle Methoden'], ...Object.entries(METHODS).map(([key, value]) => [key, value.label])], value => { view.filterMethod = value; render(); }, { 'aria-label': 'Methode filtern' });
  const ratingFilter = select(overall, [['', 'Alle Urteile'], ['gut', 'Gut'], ['mittel', 'Mittel'], ['schlecht', 'Schlecht'], ['unbewertet', 'Noch nicht bewertet']], value => { view.filterOverall = value; render(); }, { 'aria-label': 'Gesamturteil filtern' });
  const listHost = el('div', { class: 'cards' }, list.map(brewCard));
  return [title('Verlauf', view.recipeId ? 'Versuche zum Rezept' : 'Alle Versuche'),
    el('div', { class: 'section-label list-header' }, [el('span', {}, 'Versuche'), el('span', {}, `${String(list.length).padStart(2, '0')} / ${String(all.length).padStart(2, '0')}`)]),
    el('div', { class: 'history-filters' }, [field('Methode', methodFilter), field('Gesamturteil', ratingFilter)]),
    !list.length ? section('Keine passenden Versuche', hint(all.length ? 'Ändere die Filter, um weitere Versuche zu sehen.' : 'Sobald du einen Kaffee mit «Fertig» abschliesst, erscheint der Versuch hier.')) : null,
    listHost];
}
function rating(view) {
  const brew = store.data.brews.find(b => b.id === view.brewId);
  if (!brew) return [title('Verlauf', 'Versuch nicht gefunden')];
  const draft = view.rating || (view.rating = clone(brew.rating));
  const error = errorBox();
  function choices(label, key, options) {
    const controls = options.map(value => button(value, () => {
      draft[key] = draft[key] === value ? null : value; view.dirty = true;
      controls.forEach((control, i) => control.setAttribute('aria-pressed', String(draft[key] === options[i])));
    }, 'choice', { 'aria-pressed': String(draft[key] === value) }));
    return el('fieldset', { class: 'rating-group' }, [el('legend', {}, label), el('div', { class: 'choices' }, controls)]);
  }
  const form = el('form', { class: 'panel rating-panel', onsubmit: event => {
    event.preventDefault();
    attempt(error, () => {
      store.change(data => { data.brews.find(b => b.id === brew.id).rating = clone(draft); });
      view.dirty = false; notice = 'Bewertung gespeichert.';
      go({ page: 'history', recipeId: brew.recipeId }, true);
    });
  } }, [el('h2', {}, 'Wie war dein Kaffee?'), hint('Alles optional. Erneutes Antippen hebt eine Auswahl auf.'),
    choices('Gesamturteil', 'overall', ['gut', 'mittel', 'schlecht']),
    choices('Säure', 'acidity', ['zu wenig', 'passend', 'zu viel']),
    choices('Bitterkeit', 'bitterness', ['zu wenig', 'passend', 'zu viel']),
    field('Notiz (optional)', textarea(draft.note, value => { draft.note = value; view.dirty = true; })), error,
    row(button('Bewertung speichern', null, 'primary', { type: 'submit' }), button('Später bewerten', () => go({ page: 'history', recipeId: brew.recipeId }), 'quiet')),
  ]);
  return [title('Versuch gespeichert', brew.recipe.name, `${stamp(brew.completedAt)} · ${brew.bean?.name || 'Ohne Bohne'}`), form,
    button('Diesen Versuch wiederholen', () => openBrew(brew.recipe, brew.bean?.id || '', brew.recipe), 'secondary'),
    section('Verwendete Einstellungen', recipeSummary(brew.recipe), recipeSteps(brew.recipe), brew.recipe.notes ? hint(brew.recipe.notes) : null,
      brew.bean ? hint(`${brew.bean.name}${brew.bean.processing ? ` · ${brew.bean.processing}` : ''}${brew.bean.roaster ? ` · ${brew.bean.roaster}` : ''}`) : null),
  ];
}
function freshBean() { return { id: id(), name: '', roaster: '', processing: '', roastDate: '', notes: '', archived: false }; }
function beans() {
  const list = store.data.beans;
  const renderBean = bean => card(bean.name, [bean.roaster, bean.processing].filter(Boolean).join(' · ') || 'Noch keine weiteren Angaben', () => go({ page: 'beanEdit', bean: clone(bean) }));
  return [title('Bohnen', 'Deine Bohnen'),
    el('div', { class: 'section-label list-header' }, [el('span', {}, 'Sammlung'), button('+ Neu', () => go({ page: 'beanEdit', bean: freshBean() }), 'quiet')]),
    !list.length ? section('Was ist in deiner Mühle?', hint('Ein Name reicht. Alles Weitere kannst du später ergänzen.')) : null,
    el('div', { class: 'cards' }, list.filter(b => !b.archived).map(renderBean)),
    list.some(b => b.archived) ? el('details', { class: 'panel' }, [el('summary', {}, 'Archivierte Bohnen'), ...list.filter(b => b.archived).map(renderBean)]) : null,
  ];
}
function beanEdit(view) {
  const b = view.bean;
  const error = errorBox();
  const exists = store.data.beans.some(bean => bean.id === b.id);
  const textField = (key, label, props = {}) => field(label, input(b[key], value => { b[key] = value; view.dirty = true; }, props));
  const form = el('form', { class: 'panel editor', onsubmit: event => {
    event.preventDefault();
    attempt(error, () => {
      b.name = b.name.trim(); validateBean(b);
      store.change(data => { const i = data.beans.findIndex(bean => bean.id === b.id); if (i < 0) data.beans.push(clone(b)); else data.beans[i] = clone(b); });
      view.dirty = false;
      if (view.returnBrew) {
        view.returnBrew.beanId = b.id; view.returnBrew.dirty = true;
        go(view.returnBrew, true);
      } else { notice = 'Bohne gespeichert.'; go({ page: 'beans' }, true); }
    });
  } }, [
    textField('name', 'Bohnenname', { required: true, maxlength: 150 }), textField('roaster', 'Röster (optional)'),
    textField('processing', 'Aufbereitung (optional)', { list: 'processing-options', placeholder: 'z. B. Washed oder Anaerobic fermented' }),
    el('datalist', { id: 'processing-options' }, ['Washed', 'Natural', 'Honey', 'Fermented', 'Anaerobic fermented', 'Carbonic maceration'].map(value => el('option', { value }))),
    textField('roastDate', 'Röstdatum (optional)', { type: 'date' }), field('Notizen (optional)', textarea(b.notes, value => { b.notes = value; view.dirty = true; })),
    error, button('Bohne speichern', null, 'primary', { type: 'submit' }),
    exists ? button(b.archived ? 'Bohne wieder aktivieren' : 'Bohne archivieren', () => attempt(error, () => {
      validateBean(b);
      store.change(data => { data.beans[data.beans.findIndex(bean => bean.id === b.id)] = { ...clone(b), archived: !b.archived }; });
      notice = b.archived ? 'Bohne wieder aktiviert.' : 'Bohne archiviert. Bisherige Versuche bleiben erhalten.';
      view.dirty = false; go({ page: 'beans' }, true);
    }), 'quiet') : null,
  ]);
  return [title('Bohnen', exists ? b.name : 'Neue Bohne'), form,
    exists ? section('Bisherige Versuche', ...brewList().filter(brew => brew.bean?.id === b.id).map(brewCard)) : null];
}

function importControl(error) {
  const file = input('', () => {}, { type: 'file', accept: '.json,application/json', 'aria-label': 'Backup-Datei', onchange: async event => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    try {
      const json = await selected.text();
      const parsed = parseBackup(json);
      if (!confirm(`Dieses Backup enthält ${parsed.recipes.length} Rezepte, ${parsed.beans.length} Bohnen und ${parsed.brews.length} Versuche. Alle aktuellen Daten ersetzen?`)) return;
      store.import(json);
      views = [{ page: 'home' }]; index = 0; history.replaceState({ coffee: 0 }, '');
      notice = 'Backup importiert.'; render(true);
    } catch (e) { showError(error, e); }
    finally { file.value = ''; }
  } });
  return field('Backup importieren', file);
}
function settings() {
  const error = errorBox();
  return [title('Daten', 'Lokal. Bei dir.'),
    section('Backup', button('Backup exportieren', () => attempt(error, () => download(store.export(), `kaffee-backup-${new Date().toISOString().slice(0, 10)}.json`)), 'primary'),
      importControl(error), hint('Ein Import ersetzt den aktuellen Stand nach deiner Bestätigung.'), error),
    section('Offline bereit', hint('Nach dem ersten vollständigen Laden ist die App auch ohne Internet nutzbar. Quellenlinks benötigen weiterhin eine Verbindung.')),
  ];
}
function recovery() {
  const error = errorBox();
  return [title('Daten', store.legacy ? 'Bereit für deine neuen Rezepte?' : 'Daten konnten nicht geladen werden.'),
    store.problem ? hint(store.problem) : null,
    section('Deine Möglichkeiten',
      button('Vorhandene Daten sichern', () => attempt(error, () => download(store.exportRaw(), 'kaffee-vor-neustart.json')), 'secondary'),
      button('Neustart bestätigen', () => attempt(error, () => {
        if (!confirm('Bisherige lokale Daten entfernen und mit einer leeren Sammlung starten? Ohne Backup lässt sich das nicht rückgängig machen.')) return;
        store.restart(); render(true);
      }), 'primary'), importControl(error), error),
  ];
}

function render(navigated = false) {
  cleanup(); cleanup = () => {};
  const view = current();
  const pages = { home, recipes, recipeEdit, brew, history: historyView, rating, beans, beanEdit, settings };
  const blocked = store.problem || store.legacy;
  const body = blocked ? recovery() : pages[view.page](view);
  const main = el('main', { id: 'main', class: `page page-${blocked ? 'recovery' : view.completedId ? 'rating' : view.page}${navigated && rendered ? ' enter' : ''}` }, body);
  const navigation = !blocked ? el('nav', { class: 'bottom-nav', 'aria-label': 'Hauptnavigation' }, [
    ...[['home', 'Brühen', 'brew'], ['beans', 'Bohnen', 'beans'], ['history', 'Verlauf', 'history'], ['settings', 'Daten', 'settings']].map(([page, label, glyph]) => button([el('span', { class: 'nav-icon' }, icon(glyph)), el('span', { class: 'nav-label' }, label)], () => go({ page }), '', {
      'aria-current': (view.page === page || (page === 'home' && ['recipes', 'recipeEdit', 'brew'].includes(view.page)) || (page === 'beans' && view.page === 'beanEdit') || (page === 'history' && view.page === 'rating')) ? 'page' : null,
    })),
  ]) : null;
  root.replaceChildren(el('div', { class: 'app-shell' }, [
    el('div', { class: 'top-line' }, [el('span', { class: 'wordmark' }, ['kaffee', el('span', {}, '.')]), index > 0 && !blocked ? button([icon('back'), 'Zurück'], () => history.back(), 'quiet') : el('span', { class: 'eyebrow' }, 'Dein Kaffeejournal')]),
    notice ? el('div', { class: 'notice', role: 'status' }, notice) : null, main, navigation,
  ]));
  notice = '';
  document.title = `${main.querySelector('h1')?.textContent || 'Kaffee'} · Kaffee`;
  if (navigated) { window.scrollTo(0, 0); main.querySelector('h1')?.focus({ preventScroll: true }); }
  rendered = true;
}
render();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
  // Register immediately: this module may finish loading after the window load event.
  navigator.serviceWorker.register('./sw.js').catch(error => {
    const warning = el('p', { class: 'notice', role: 'status' }, 'Offline-Speicherung ist gerade nicht verfügbar. Bitte später mit Internet neu öffnen.');
    root.prepend(warning);
    console.warn('Offline registration failed:', error.message);
  });
}
