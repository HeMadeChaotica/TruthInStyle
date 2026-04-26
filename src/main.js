import './styles/global.css';
import { ACTION_MAP } from './config/actionMap.js';
import { controlPanelGlyphs, openingAssets, sectionAnchorGlyphs, triggerGlyphs } from './config/assetManifest.js';
import { CONTROL_PANEL_ORDER, ROUTE_MAP } from './config/sectionRegistry.js';
import { getClockItRegistrySnapshot } from './clockit/dropdownOptions.js';
import { archive_trend_intelligence } from './data/scaffoldData.js';
import { sealTruthForActiveDay } from './services/summationFlow.js';
import { appState, setActiveDay, setRoute, subscribe, toggleControlPanel } from './state/appState.js';

const app = document.getElementById('app');

function toISOFromMMDDYYYY(mmddyyyy) {
  const [m, d, y] = mmddyyyy.split('/');
  return `${y}-${m}-${d}`;
}

function toMMDDYYYYFromISO(iso) {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

function runAction(actionId) {
  const action = ACTION_MAP[actionId];
  if (!action) return;

  if (action.type === 'route') return setRoute(action.target);
  if (action.type === 'back') return history.back();
  if (action.type === 'control.panel.toggle') return toggleControlPanel();
  if (action.type === 'route.current-day') return setRoute(action.target);
  if (action.type === 'seal.summation') {
    sealTruthForActiveDay();
    setRoute('/hopewood');
  }
}

function renderOpening() {
  return `
    <section class="opening-screen">
      <img src="${openingAssets.scene0Entry}" alt="OPENING ASSET" />
      <button class="truth-entry" data-route="/the-assurer">ENTER</button>
    </section>
  `;
}

function renderDayChangerPlugin() {
  return `
    <div class="day-plugin">
      <input type="date" aria-label="DAY CHANGER" value="${toISOFromMMDDYYYY(appState.activeDay.activeDate)}" data-day-changer />
      <div class="day-stamp">${appState.activeDay.activeDate}</div>
      <div class="weekday-stamp">${appState.activeDay.activeWeekday}</div>
    </div>
  `;
}

function renderControlPanel() {
  const ordered = CONTROL_PANEL_ORDER.map((actionKey) => {
    if (actionKey === 'plugin-day-changer') return `<li>${renderDayChangerPlugin()}</li>`;
    return `<li><button data-action="${actionKey}"><img src="${controlPanelGlyphs[actionKey]}" alt="${actionKey}" /></button></li>`;
  }).join('');

  return `<aside class="control-panel ${appState.controlPanelOpen ? 'open' : ''}"><ul>${ordered}</ul></aside>`;
}

function renderSectionContent() {
  const current = ROUTE_MAP[appState.route];
  if (!current || current.path === '/') return '';

  if (appState.route === '/clock-it') {
    const registry = getClockItRegistrySnapshot().map((entry) => `<li>${entry.familyKey}: ${entry.values.length}</li>`).join('');
    return `<ul>${registry}</ul>`;
  }

  if (appState.route === '/hopewood') {
    const entries = Object.values(archive_trend_intelligence.hopewood_entries)
      .map((entry) => `<li>${entry.dateKey} ${entry.titleOfDay}</li>`)
      .join('');
    return `<ul>${entries}</ul>`;
  }

  if (appState.route === '/the-summation') {
    return `<button class="trigger-button" data-action="trigger-seal-the-truth"><img src="${triggerGlyphs.sealTheTruth}" alt="SEAL THE TRUTH" /></button>`;
  }

  if (appState.route === '/thicc-fitt') {
    return `<button class="trigger-button" data-action="trigger-crystal-dumbbell"><img src="${triggerGlyphs.crystalDumbbell}" alt="CRYSTAL DUMBBELL" /></button>`;
  }

  return '';
}

function renderSectionShell() {
  const current = ROUTE_MAP[appState.route];
  const anchor = sectionAnchorGlyphs[appState.route];
  const showEye = current?.hasEye;
  const eyeAction = current?.eyeActive ? 'trigger-eye-of-truth' : '';

  return `
    ${renderControlPanel()}
    <section class="section-screen">
      <img class="section-anchor" src="${anchor}" alt="SECTION ANCHOR" />
      <h1>${current.title}</h1>
      ${showEye ? `<button class="eye-of-truth ${current.eyeActive ? 'active' : 'inactive'}" ${eyeAction ? `data-action="${eyeAction}"` : 'disabled'}><img src="${triggerGlyphs.eyeOfTruth}" alt="EYE OF TRUTH" /></button>` : ''}
      <div class="section-content">${renderSectionContent()}</div>
      <button class="wand" data-action="toggle-control-panel"><img src="${triggerGlyphs.controlWand}" alt="CONTROL WAND" /></button>
    </section>
  `;
}

function bindEvents() {
  app.querySelectorAll('[data-route]').forEach((node) => {
    node.addEventListener('click', () => setRoute(node.dataset.route));
  });

  app.querySelectorAll('[data-action]').forEach((node) => {
    node.addEventListener('click', () => runAction(node.dataset.action));
  });

  app.querySelector('[data-day-changer]')?.addEventListener('change', (event) => {
    setActiveDay(toMMDDYYYYFromISO(event.target.value));
  });
}

function render() {
  app.innerHTML = appState.route === '/' ? renderOpening() : renderSectionShell();
  bindEvents();
}

subscribe(render);
setRoute('/');
