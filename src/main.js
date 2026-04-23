import { CONTROL_PANEL_ORDER, ROUTE_MAP } from './config/sectionRegistry.js';
import { OPTION_SET_REGISTRY } from './clockit/dropdownOptions.js';
import { dayRecord, summationPrompts } from './data/scaffoldData.js';
import { buildSummationPayload, buildYearlyTrendScaffold } from './services/summationFlow.js';

const app = document.getElementById('app');
const state = { currentRoute: '/opening', panelOpen: false, hopewoodEntries: [] };

const routeTitles = {
  '/opening': 'CHAOTICA',
  '/the-assurer': 'THE.ASSURER',
  '/the-summation': 'THE.SUMMATION',
  '/hopewood': 'HOPEWOOD',
  '/remember-me': 'REMEMBER.ME',
  '/525-600': '525,600',
  '/clock-it': 'CLOCK.IT',
  '/thicc-fitt': 'THICC.FITT',
  '/da-eater': 'DA.EATER',
  '/the-work': 'THE WORK'
};

function route(path) {
  if (!ROUTE_MAP[path]) return;
  state.currentRoute = path;
  render();
}

function renderOpening() {
  return `
  <section class="opening">
    <div class="opening-image">scene-0-entry.jpeg</div>
    <h1>CHAOTICA</h1>
    <button class="opening-glow" data-route="/the-assurer">Tell No Lies</button>
  </section>`;
}

function renderControlPanel() {
  const items = CONTROL_PANEL_ORDER.map((item) => {
    const map = {
      'home': '/the-assurer',
      'the.summation': '/the-summation',
      'hopewood': '/hopewood',
      'thicc.fitt': '/thicc-fitt',
      'da.eater': '/da-eater',
      'remember.me': '/remember-me',
      '525,600': '/525-600',
      'clock.it': '/clock-it',
      'the work': '/the-work'
    };

    if (item === 'day changer') return `<li>${item}</li>`;
    if (item === 'back') return `<li><button data-action="back">back</button></li>`;
    return `<li><button data-route="${map[item]}">${item}</button></li>`;
  }).join('');

  return `<aside class="control-panel ${state.panelOpen ? 'open' : ''}"><ul>${items}</ul></aside>`;
}

function renderSection() {
  const title = routeTitles[state.currentRoute];
  if (!title) return '';

  if (state.currentRoute === '/the-summation') {
    return `<section><h2>${title}</h2><div class="center">Eye of Truth</div><button data-action="summate">Summate</button><ol>${summationPrompts.map((p)=>`<li>${p}</li>`).join('')}</ol></section>`;
  }

  if (state.currentRoute === '/hopewood') {
    const rows = state.hopewoodEntries.map((entry, i) => `<li>${i + 1}. ${entry.titleOfDay} + ${entry.dayDate}</li>`).join('');
    return `<section><h2>${title}</h2><p>Read-only remembrance archive.</p><p>Search filters include all dropdown qualifiers except da.juice.</p><ul>${rows}</ul></section>`;
  }

  if (state.currentRoute === '/525-600') {
    const trend = buildYearlyTrendScaffold(state.hopewoodEntries, [{ workSignal: 'Deep architecture pass complete.' }]);
    return `<section><h2>${title}</h2><pre>${JSON.stringify(trend, null, 2)}</pre></section>`;
  }

  if (state.currentRoute === '/clock-it') {
    return `<section><h2>${title}</h2><p>Dropdown headquarters + utility control center.</p><p>Managed set count: ${OPTION_SET_REGISTRY.length}</p></section>`;
  }

  if (state.currentRoute === '/the-assurer') {
    return `<section><h2>${title}</h2><p>Unified inflow receiver with distributed assessment, writer, intake, moments, calendar, thicc.fitt, and work signal previews.</p><div class="center">Eye of Truth</div><button data-route="/the-summation">Go to Summation</button></section>`;
  }

  return `<section><h2>${title}</h2><p>Section scaffold active.</p></section>`;
}

function render() {
  if (state.currentRoute === '/opening') {
    app.innerHTML = renderOpening();
  } else {
    app.innerHTML = `${renderControlPanel()}${renderSection()}<button class="truth-wand" data-action="toggle-panel">🪄</button>`;
  }

  app.querySelectorAll('[data-route]').forEach((el) => {
    el.addEventListener('click', () => route(el.getAttribute('data-route')));
  });

  app.querySelector('[data-action="toggle-panel"]')?.addEventListener('click', () => {
    state.panelOpen = !state.panelOpen;
    render();
  });

  app.querySelector('[data-action="back"]')?.addEventListener('click', () => history.back());

  app.querySelector('[data-action="summate"]')?.addEventListener('click', () => {
    const payload = buildSummationPayload(['Defined by architecture discipline.', 'Horny for structural correctness.', 'Future me: keep layers separate.']);
    state.hopewoodEntries.push(payload);
    route('/hopewood');
  });
}

route('/opening');
