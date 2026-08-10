import { el } from '../dom.js';
import { registerScreen, replace, resetTo } from '../router.js';
import { getVariante, getBohne, addTasting, upsertEinstellung } from '../state.js';
import { calcVariant } from '../calc.js';
import { GESCHMACK, GESCHMACK_LABEL, EINDRUCK, EINDRUCK_LABEL } from '../constants.js';
import { topbar } from '../components/topbar.js';
import { choiceGroup } from '../components/choiceGroup.js';
import { field, numberInput, textArea } from '../components/fieldGroup.js';

const GESCHMACK_SUB = {
  stark_sauer: 'Heller, spitzer Geschmack',
  leicht_sauer: 'Leicht heller Geschmack',
  ausgewogen: 'Genau richtig',
  leicht_bitter: 'Leicht schwerer Geschmack',
  stark_bitter: 'Schwerer, adstringierender Geschmack',
};

function render(ui) {
  const variante = getVariante(ui.varianteId);
  const bean = getBohne(ui.bohneId);
  const draft = ui.tastingDraft;

  const geschmackGroup = choiceGroup(
    GESCHMACK.map(g => ({ value: g, title: GESCHMACK_LABEL[g], sub: GESCHMACK_SUB[g] })),
    draft.geschmack,
    (v) => replace('tastingEntry', { tastingDraft: { ...draft, geschmack: v } })
  );

  const eindruckGroup = choiceGroup(
    EINDRUCK.map(e => ({ value: e, title: EINDRUCK_LABEL[e] })),
    draft.eindruck,
    (v) => replace('tastingEntry', { tastingDraft: { ...draft, eindruck: v } })
  );

  const mahlgradInput = numberInput({
    value: draft.mahlgradWert,
    onInput: (v) => { draft.mahlgradWert = v; },
  });

  const notizInput = textArea({
    value: draft.notiz,
    placeholder: 'Notiz (optional)',
    onInput: (v) => { draft.notiz = v; },
  });

  const canSave = !!draft.geschmack && !!draft.eindruck;

  const save = () => {
    if (!canSave) return;
    const mahlgrad = { wert: draft.mahlgradWert, einheit: draft.mahlgradEinheit };
    const r = calcVariant(variante, ui.amount, mahlgrad);
    addTasting({
      bohneId: ui.bohneId, varianteId: ui.varianteId,
      bohneName: bean.name, varianteName: variante.name, kategorie: variante.kategorie,
      genutzteWerte: {
        zielmenge: ui.amount, mahlgrad,
        coffee: r.coffee, water: r.water, ice: r.ice, bloom: r.bloom,
      },
      geschmack: draft.geschmack, eindruck: draft.eindruck, notiz: draft.notiz || null,
    });
    upsertEinstellung(ui.bohneId, ui.varianteId, mahlgrad);
    resetTo('home');
  };

  return el('div', { class: 'screen' }, [
    topbar({ crumb: [variante.name, bean.name].filter(Boolean).join(' · '), close: true }),
    el('h2', { class: 'screen-title' }, "Wie war's?"),
    el('div', { class: 'stack' }, [
      el('div', {}, [el('h6', { style: 'margin-bottom:8px;' }, 'Geschmack'), geschmackGroup]),
      el('div', {}, [el('h6', { style: 'margin-bottom:8px;' }, 'Gesamteindruck'), eindruckGroup]),
      field(`Einstellung für nächstes Mal (${draft.mahlgradEinheit})`, mahlgradInput),
      field('Notiz (optional)', notizInput),
      el('button', { class: 'btn btn-primary btn-block', disabled: !canSave, onclick: save }, 'Eintrag speichern'),
    ]),
  ]);
}

registerScreen('tastingEntry', render);
