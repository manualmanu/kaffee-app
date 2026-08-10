import { el } from '../../dom.js';
import { registerScreen, replace, back } from '../../router.js';
import { getBohne, addBohne, updateBohne, deleteBohne } from '../../state.js';
import { topbar } from '../../components/topbar.js';
import { field, textInput, dateInput, textArea } from '../../components/fieldGroup.js';
import { confirmDialog } from '../../components/confirmDialog.js';

function draftFromBean(b) {
  return { name: b.name, roester: b.roester, roestdatum: b.roestdatum || '', notizen: b.notizen || '' };
}

function emptyDraft() {
  return { name: '', roester: '', roestdatum: '', notizen: '' };
}

function render(ui) {
  const ctx = ui.formCtx;
  const editing = ctx.editId ? getBohne(ctx.editId) : null;
  const key = editing ? editing.id : 'new';
  if (!ui.beanFormDraft || ui.beanFormDraftKey !== key) {
    ui.beanFormDraft = editing ? draftFromBean(editing) : emptyDraft();
    ui.beanFormDraftKey = key;
  }
  const draft = ui.beanFormDraft;

  const save = (e) => {
    e.preventDefault();
    if (!draft.name.trim() || !draft.roester.trim()) return;
    const fields = {
      name: draft.name.trim(),
      roester: draft.roester.trim(),
      roestdatum: draft.roestdatum || null,
      notizen: draft.notizen.trim() || null,
    };
    let bean;
    if (editing) { updateBohne(editing.id, fields); bean = editing; }
    else { bean = addBohne(fields); }
    ui.beanFormDraft = null;
    if (ctx.mode === 'flow') replace('amount', { bohneId: bean.id });
    else back();
  };

  const del = () => confirmDialog({
    title: 'Bohne löschen?',
    body: `„${editing.name}" wird gelöscht.`,
    onConfirm: () => { deleteBohne(editing.id); ui.beanFormDraft = null; back(); },
  });

  return el('form', { class: 'screen', onsubmit: save }, [
    topbar({ crumb: editing ? 'Bearbeiten' : 'Neue Bohne', close: true }),
    el('h2', { class: 'screen-title' }, editing ? 'Bohne bearbeiten' : 'Neue Bohne'),
    el('div', { class: 'stack' }, [
      field('Name', textInput({ value: draft.name, required: true, onInput: (v) => { draft.name = v; } })),
      field('Röster', textInput({ value: draft.roester, required: true, onInput: (v) => { draft.roester = v; } })),
      field('Röstdatum (optional)', dateInput({ value: draft.roestdatum, onInput: (v) => { draft.roestdatum = v; } })),
      field('Notizen (optional)', textArea({ value: draft.notizen, onInput: (v) => { draft.notizen = v; } })),
      el('button', { class: 'btn btn-primary btn-block', type: 'submit' }, editing ? 'Speichern' : 'Anlegen'),
      editing ? el('button', { class: 'btn btn-secondary btn-block', type: 'button', onclick: del }, 'Löschen') : null,
    ]),
  ]);
}

registerScreen('beanForm', render);
