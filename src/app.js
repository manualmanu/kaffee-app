import './state.js';
import { render } from './router.js';

import './screens/home.js';
import './screens/variantPicker.js';
import './screens/beanPicker.js';
import './screens/amount.js';
import './screens/result.js';
import './screens/tastingEntry.js';
import './screens/history.js';
import './screens/verwaltung/hub.js';
import './screens/verwaltung/beanList.js';
import './screens/verwaltung/beanDetail.js';
import './screens/verwaltung/beanForm.js';
import './screens/verwaltung/variantList.js';
import './screens/verwaltung/variantForm.js';

render();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
