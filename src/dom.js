// Minimaler DOM-Helper, kein Framework. el('div', {class:'x', onclick: fn}, [child, 'text'])
export function el(tag, props, children) {
  const node = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value' && (tag === 'input' || tag === 'textarea')) node.value = v;
      else if (k === 'checked') node.checked = !!v;
      else if (k === 'disabled') node.disabled = !!v;
      else node.setAttribute(k, v);
    }
  }
  appendChildren(node, children);
  return node;
}

function appendChildren(node, children) {
  if (children == null) return;
  const list = Array.isArray(children) ? children : [children];
  for (const c of list) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) { appendChildren(node, c); continue; }
    node.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function svgIcon(shapes, { width = 18, height = 18, viewBox = '0 0 24 24' } = {}) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('fill', 'none');
  for (const { tag = 'path', ...attrs } of shapes) {
    const shape = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) shape.setAttribute(k, v);
    svg.appendChild(shape);
  }
  return svg;
}

export const ICON_BACK = () => svgIcon(
  [{ d: 'M9 1L1 9l8 8', stroke: 'var(--color-text)', 'stroke-width': '2.2', fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }],
  { width: 11, height: 18, viewBox: '0 0 11 18' }
);

export const ICON_CHEVRON = (color = 'var(--color-text)') => svgIcon(
  [{ d: 'M1 1l6 6-6 6', stroke: color, 'stroke-width': '2', fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }],
  { width: 9, height: 15, viewBox: '0 0 9 15' }
);

export const ICON_CLOSE = () => svgIcon(
  [{ d: 'M1 1l14 14M15 1L1 15', stroke: 'var(--color-text)', 'stroke-width': '2', 'stroke-linecap': 'round' }],
  { width: 15, height: 15, viewBox: '0 0 16 16' }
);

export const ICON_HISTORY = () => svgIcon(
  [
    { tag: 'circle', cx: 12, cy: 12, r: 9, stroke: 'var(--color-text)', 'stroke-width': '2' },
    { d: 'M12 7v5l3 3', stroke: 'var(--color-text)', 'stroke-width': '2', fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
  ],
  { width: 18, height: 18, viewBox: '0 0 24 24' }
);

export const ICON_SETTINGS = () => svgIcon(
  [
    { tag: 'circle', cx: 12, cy: 12, r: 3, stroke: 'var(--color-text)', 'stroke-width': '2' },
    { d: 'M12 3v3M12 18v3M21 12h-3M6 12H3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7L5.6 5.6', stroke: 'var(--color-text)', 'stroke-width': '2', 'stroke-linecap': 'round' },
  ],
  { width: 18, height: 18, viewBox: '0 0 24 24' }
);

export const ICON_PLUS = () => svgIcon(
  [{ d: 'M12 5v14M5 12h14', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round' }],
  { width: 14, height: 14, viewBox: '0 0 24 24' }
);

export const ICON_TRASH = () => svgIcon(
  [{ d: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13', stroke: 'var(--color-text)', 'stroke-width': '2', fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }],
  { width: 16, height: 16, viewBox: '0 0 24 24' }
);
