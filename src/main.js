import { CONTROL_PANEL_ORDER, ROUTE_MAP } from './config/sectionRegistry.js';
import { ACTION_MAP } from './config/actionMap.js';
import { openingAssets, sectionAnchors, triggers } from './config/assetManifest.js';
import { OPTION_SET_REGISTRY } from './clockit/dropdownOptions.js';
import { summationPrompts } from './data/scaffoldData.js';
import { buildSummationPayload, buildYearlyTrendScaffold } from './services/summationFlow.js';

const app = document.getElementById('app');
const state = { currentRoute: '/', panelOpen: false, hopewoodEntries: [] };

const routeTitles = {
  '/': 'CHAOTICA',
  '/the-assurer': 'THE.ASSURER',
  '/the-summation': 'THE.SUMMATION',
  '/hopewood': 'HOPEWOOD',
  '/remember-me': 'REMEMBER.ME',
  '/525600': '525,600',
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

function runAction(actionId) {
  const action = ACTION_MAP[actionId];
  if (!action) return;

  if (action.type === 'router.back') {
    history.back();
    return;
  }

  if (action.type === 'open' && action.target === 'control.panel') {
    state.panelOpen = !state.panelOpen;
    render();
    return;
  }

  if (action.type === 'trigger-summation-flow') {
    route(action.target);
    return;
  }

  if (action.type === 'route') {
    route(action.target);
  }
}

function renderOpening() {
  return `
  <section class="opening">
    <img class="opening-image" src="${openingAssets.scene0Entry}" alt="CHAOTICA opening wand" />
    <h1>CHAOTICA</h1>
    <button class="opening-glow" data-route="/the-assurer">TELL NO LIES</button>
  </section>`;
}

function renderControlPanel() {
  const labelMap = {
    'control-home': 'home',
    'control-back': 'back',
    'control-the-summation': 'the.summation',
    'control-hopewood': 'hopewood',
    'control-thicc-fitt': 'thicc.fitt',
    'control-da-eater': 'da.eater',
    'control-remember-me': 'remember.me',
    'control-525600': '525,600',
    'control-clock-it': 'clock.it',
    'control-the-work': 'the work'
  };

  const items = CONTROL_PANEL_ORDER.map((item) => (
    `<li><button data-action="${item}">${labelMap[item]}</button></li>`
  )).join('');

  return `<aside class="control-panel ${state.panelOpen ? 'open' : ''}"><ul>${items}</ul></aside>`;
}

function renderSection() {
  const title = routeTitles[state.currentRoute];
  if (!title) return '';

  if (state.currentRoute === '/the-summation') {
    return `<section><h2>${title}</h2><img class="center" src="${triggers.eyeOfTruth}" alt="Eye of Truth" /><button data-action="summate">Summate</button><ol>${summationPrompts.map((p) => `<li>${p}</li>`).join('')}</ol></section>`;
  }

  if (state.currentRoute === '/hopewood') {
    const rows = state.hopewoodEntries.map((entry, i) => `<li>${i + 1}. ${entry.titleOfDay} + ${entry.dayDate}</li>`).join('');
    return `<section><h2>${title}</h2><p>Read-only remembrance archive.</p><p>Search filters include all dropdown qualifiers except da.juice.</p><ul>${rows}</ul></section>`;
  }

  if (state.currentRoute === '/525600') {
    const trend = buildYearlyTrendScaffold(state.hopewoodEntries, [{ workSignal: 'Deep architecture pass complete.' }]);
    return `<section><h2>${title}</h2><pre>${JSON.stringify(trend, null, 2)}</pre></section>`;
  }

  if (state.currentRoute === '/clock-it') {
    return `<section><h2>${title}</h2><p>Dropdown headquarters + utility control center.</p><p>Managed set count: ${OPTION_SET_REGISTRY.length}</p></section>`;
  }

  if (state.currentRoute === '/the-assurer') {
    return `<section><h2>${title}</h2><p>Unified inflow receiver with distributed assessment, writer, intake, moments, calendar, thicc.fitt, and work signal previews.</p><img class="center" src="${triggers.eyeOfTruth}" alt="Eye of Truth" /><button data-action="trigger-eye-of-truth">Go to Summation</button></section>`;
  }

  return `<section><h2>${title}</h2><p>Section scaffold active.</p></section>`;
}

function render() {
  if (state.currentRoute === '/') {
    app.innerHTML = renderOpening();
  } else {
    app.innerHTML = `${renderControlPanel()}${renderSection()}<button class="truth-wand" data-action="anchor-control-panel-wand"><img src="${sectionAnchors.controlPanelWand}" alt="control.panel wand" /></button>`;
  }

  app.querySelectorAll('[data-route]').forEach((el) => {
    el.addEventListener('click', () => route(el.getAttribute('data-route')));
  });

  app.querySelectorAll('[data-action]').forEach((el) => {
    const actionId = el.getAttribute('data-action');
    if (actionId === 'summate') return;
    el.addEventListener('click', () => runAction(actionId));
  });

  app.querySelector('[data-action="summate"]')?.addEventListener('click', () => {
    const payload = buildSummationPayload(['Defined by architecture discipline.', 'Horny for structural correctness.', 'Future me: keep layers separate.']);
    state.hopewoodEntries.push(payload);
    route('/hopewood');
  });
}

route('/');
