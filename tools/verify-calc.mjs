import assert from 'node:assert/strict';
import { calcVariant } from '../src/calc.js';
import { seedRezeptVarianten } from '../src/seedData.js';

const variants = seedRezeptVarianten();

function approx(actual, expected, msg, eps = 1e-6) {
  assert.ok(Math.abs(actual - expected) < eps, `${msg}: expected ${expected}, got ${actual}`);
}

// V60 1:15 Klar & Sauber @300g
{
  const v = variants.find(v => v.name.includes('1:15 Klar'));
  const r = calcVariant(v, 300);
  approx(r.coffee, 20, 'V60 coffee');
  approx(r.water, 300, 'V60 water');
  approx(r.bloom, 39.9, 'V60 bloom');
  approx(r.pourStufen[0].incrementalAmt, 140.1, 'V60 pour stage 1 incremental');
  approx(r.pourStufen[1].incrementalAmt, 120, 'V60 pour stage 2 incremental');
}
console.log('OK: V60 1:15 @300g');

// Japanese Iced 1:15 Klassisch @300g
{
  const v = variants.find(v => v.name.includes('1:15 Klassisch'));
  const r = calcVariant(v, 300);
  approx(r.coffee, 20, 'Iced coffee');
  approx(r.water, 180, 'Iced water');
  approx(r.ice, 120, 'Iced ice');
  approx(r.bloom, 39.96, 'Iced bloom');
}
console.log('OK: Iced 1:15 @300g');

// Cold Brew 1:13 Ausgewogen @300g
{
  const v = variants.find(v => v.kategorie === 'coldbrew' && v.name.includes('1:13'));
  const r = calcVariant(v, 300);
  approx(r.coffee, 300 / 13, 'Coldbrew coffee');
  approx(r.water, 300, 'Coldbrew water');
  assert.equal(r.ziehzeitSek.von, 50400, 'Coldbrew ziehzeit von');
  assert.equal(r.ziehzeitSek.bis, 57600, 'Coldbrew ziehzeit bis');
}
console.log('OK: Coldbrew 1:13 @300g');

// Grenzfall: ratio 0 muss einen Fehler werfen statt Infinity zu produzieren
{
  const v = { ...variants[0], ratio: 0 };
  assert.throws(() => calcVariant(v, 300), /Ungültige Ratio/, 'ratio=0 sollte werfen');
}
console.log('OK: ratio=0 wirft Fehler');

// Grenzfall: negative Ratio muss ebenfalls einen Fehler werfen
{
  const v = { ...variants[0], ratio: -5 };
  assert.throws(() => calcVariant(v, 300), /Ungültige Ratio/, 'ratio<0 sollte werfen');
}
console.log('OK: negative Ratio wirft Fehler');

// Grenzfall: unsortierte Pour-Stufen dürfen keine negativen Inkremente mehr erzeugen
{
  const v = variants.find(v => v.name.includes('1:15 Klar'));
  const shuffled = { ...v, pourStufen: [...v.pourStufen].reverse() };
  const r = calcVariant(shuffled, 300);
  for (const stufe of r.pourStufen) {
    assert.ok(stufe.incrementalAmt >= 0, `Pour-Stufe darf nicht negativ sein: ${stufe.incrementalAmt}`);
  }
  approx(r.pourStufen[0].prozent, 60, 'sortierte Pour-Stufe 1 prozent');
  approx(r.pourStufen[1].prozent, 100, 'sortierte Pour-Stufe 2 prozent');
}
console.log('OK: unsortierte Pour-Stufen werden korrekt sortiert berechnet');

console.log('Alle calc.js-Tests bestanden.');
