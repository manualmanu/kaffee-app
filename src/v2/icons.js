// Small, code-native marks: no images or network assets needed offline.
export function icon(name, className = '') {
  const paths = {
    brew: ['M5 5h12l-3 9H8L5 5Z', 'M8 18h6', 'M17 6h2a3 3 0 0 1-3 5'],
    beans: ['M17.5 5.5c3 3 1 8-2.5 11.5S7 21 4.5 18.5s-1-7 2.5-10.5 7.5-5.5 10.5-2.5Z', 'M16 6c-7 2-3 9-10 12'],
    history: ['M4 10a8 8 0 1 1 1 7', 'M4 5v5h5', 'M12 7v5l3 2'],
    settings: ['M4 7h16', 'M4 17h16', 'M8 4v6', 'M16 14v6'],
    arrow: ['M5 12h14', 'm13 6 6 6-6 6'],
    back: ['M19 12H5', 'm11 6-6 6 6 6'],
    plus: ['M12 5v14', 'M5 12h14'],
    minus: ['M5 12h14'],
    edit: ['m15 4 5 5-11 11H4v-5L15 4Z', 'm12 7 5 5'],
    play: ['m8 5 11 7-11 7V5Z'],
    pause: ['M8 5v14', 'M16 5v14'],
    check: ['m5 12 4 4L19 6'],
  };
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', width: '22', height: '22', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', class: className })) svg.setAttribute(key, value);
  for (const d of paths[name] || paths.brew) { const path = document.createElementNS(ns, 'path'); path.setAttribute('d', d); svg.append(path); }
  return svg;
}
