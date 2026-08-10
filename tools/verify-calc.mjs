import { calcVariant } from '../src/calc.js';
import { seedRezeptVarianten } from '../src/seedData.js';

const variants = seedRezeptVarianten();

const clean = variants.find(v => v.name.includes('1:15 Klar'));
const r = calcVariant(clean, 300);
console.log('V60 1:15 @300g ->', JSON.stringify({ coffee: r.coffee, water: r.water, bloom: r.bloom, pourStufen: r.pourStufen.map(s => ({ p: s.prozent, inc: +s.incrementalAmt.toFixed(1) })) }));

const iced = variants.find(v => v.name.includes('1:15 Klassisch'));
const r2 = calcVariant(iced, 300);
console.log('Iced 1:15 @300g ->', JSON.stringify({ coffee: r2.coffee, water: r2.water, ice: r2.ice, bloom: r2.bloom }));

const cb = variants.find(v => v.kategorie === 'coldbrew' && v.name.includes('1:13'));
const r3 = calcVariant(cb, 300);
console.log('Coldbrew 1:13 @300g ->', JSON.stringify({ coffee: r3.coffee, water: r3.water, ziehzeitSek: r3.ziehzeitSek }));
