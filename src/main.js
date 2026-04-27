import { ACTION_MAP } from './config/actionMap.js';
import { controlPanelGlyphs, openingAssets, sectionAnchorGlyphs, triggerGlyphs } from './config/assetManifest.js';
import { CONTROL_PANEL_ORDER, ROUTE_MAP } from './config/sectionRegistry.js';
import { getClockItRegistrySnapshot } from './clockit/dropdownOptions.js';
import { archive_trend_intelligence } from './data/scaffoldData.js';
import { sealTruthForActiveDay } from './services/summationFlow.js';
import { addThiccDossierTemplate, appState, renameThiccDossier, setActiveDay, setRoute, subscribe, toggleControlPanel } from './state/appState.js';

let app;
let previousRoute = '/';
let floatingControlsVisible = true;
let floatingControlsTimer = null;

function showFloatingControlsTemporarily() {
  floatingControlsVisible = true;
  clearTimeout(floatingControlsTimer);
  floatingControlsTimer = setTimeout(() => {
    floatingControlsVisible = false;
    render();
  }, 2000);
}

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
      <button class="opening-hotspot" aria-label="OPEN CHAOTICA" data-route="/the-assurer"></button>
    </section>
  `;
}

function renderDayChangerPlugin() {
  return `
    <div class="day-plugin">
      <input class="day-picker-overlay" type="date" aria-label="DAY CHANGER" value="${toISOFromMMDDYYYY(appState.activeDay.activeDate)}" data-day-changer />
      <div class="day-date">${appState.activeDay.activeDate}</div>
      <div>${appState.activeDay.activeWeekday}</div>
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

function renderAssurerLayout(anchor) {
  return `
    <div class="zone assurer-slab">
      <div class="zone anchor-territory"><img class="assurer-anchor" src="${anchor}" alt="SECTION ANCHOR" /></div>
      <div class="zone crystal-title-wrap">HEAD HUMMER · LIBIDO · MOOD · ERA · WORD OF THE DAY · SINGLENESS LEVEL</div>
      <div class="zone writer-cloud">HERE'S THE THING WRITER CLOUD</div>
      <div class="zone remember-five-day">REMEMBER.ME 5-DAY PREVIEW</div>
      <div class="zone standout-moment">MOMENTS</div>
      <div class="zone intake-summary">DA.EATER MEALS + PHOTO SUMMARY</div>
      <div class="zone macro-summary">DA.EATER MACRO PROGRESSION BARS</div>
      <div class="zone thicc-summary">THICC.FITT PERSONAL SUMMARY</div>
    </div>
  `;
}

function renderSummationLayout() {
  return `
    <div class="summation-layout">
      <section class="zone summation-render">
        <header>TITLE OF THE DAY · ${appState.activeDay.activeWeekday} · ${appState.activeDay.activeDate}</header>
      </section>
      <aside class="summation-support">
        <section class="zone bonus-questions">BONUS QUESTIONS AREA</section>
        <section class="zone version-selector">VERSION SELECTOR: VERSION 1 / VERSION 2 / VERSION 3</section>
        <section class="zone seal-zone">
          <button class="trigger-button" data-action="trigger-seal-the-truth"><img src="${triggerGlyphs.sealTheTruth}" alt="SEAL THE TRUTH" /></button>
        </section>
      </aside>
    </div>
  `;
}

function renderHopewoodLayout() {
  const entries = Object.values(archive_trend_intelligence.hopewood_entries)
    .map((entry) => `<li>${entry.dateKey} ${entry.titleOfDay}</li>`)
    .join('');

  return `
    <div class="hopewood-layout">
      <section class="zone hopewood-search">SEARCH COLUMN</section>
      <section class="zone hopewood-options">OPTIONS / SELECT COLUMN</section>
      <section class="zone hopewood-book">
        <div>OPEN-BOOK DISPLAY AREA</div>
        <ul>${entries}</ul>
      </section>
    </div>
  `;
}

function renderRememberLayout() {
  const days = Array.from({ length: 35 }, (_, i) => `<div class="calendar-cell">DAY ${i + 1}</div>`).join('');
  return `
    <div class="remember-layout">
      <section class="zone calendar-wall">${days}</section>
      <section class="zone moments-zone">WOW · WTF · PLOT TWIST · UP TO 3 MOMENTS · PHOTO + DESCRIPTION</section>
      <section class="zone remember-photo-zone">INTEGRATED PHOTO ZONES</section>
    </div>
  `;
}

function renderDaEaterLayout() {
  return `
    <div class="da-eater-layout">
      <section class="zone macro-progression">MACRO PROGRESSION</section>
      <section class="zone meals-area">MEALS AREA</section>
      <section class="zone flex-area">CHEAT / FLEX MEAL AREA</section>
      <section class="zone meal-photos">MEAL PHOTO LOG + UPLOAD ZONES</section>
      <section class="zone intake-notes">ADDITIONAL INTAKE NOTES</section>
    </div>
  `;
}

function renderThiccFittLayout() {
  return `
    <div class="thicc-layout">
      <section class="zone workout-log">WORKOUT LOG</section>
      <section class="zone media-zone">MEDIA</section>
      <section class="zone notes-zone">NOTES</section>
      <section class="zone cardio-zone">CARDIO</section>
      <section class="zone da-juice-zone">DA.JUICE</section>
      <section class="zone performance-zone">BODY / PERFORMANCE RECORDS</section>
      <button class="trigger-button dumbbell-zone" data-action="trigger-crystal-dumbbell"><img src="${triggerGlyphs.crystalDumbbell}" alt="CRYSTAL DUMBBELL" /></button>
    </div>
  `;
}

function renderItsGettingThiccLayout() {
  const dossierTabs = appState.ui.thiccDossiers.map((item) => `<button class="dossier-tab">${item.label}</button>`).join('');
  return `
    <div class="its-thicc-layout">
      <section class="zone dossier-toolbar">
        ${dossierTabs}
        <button class="dossier-plus" data-action="clone-thicc-template">+</button>
      </section>
      <section class="zone dossier-grid">
        <div>IDENTITY BLOCK <input data-dossier-name placeholder="CLIENT NAME" /></div>
        <div>PHOTO BLOCK</div>
        <div>WEIGHT / BMI BLOCK</div>
        <div>MACRO BLOCK</div>
        <div>MIRRORED DA.JUICE BLOCK</div>
        <div>TRAINING / REST WEEK CALENDAR</div>
        <div>EXERCISE PROGRAM WEEK CALENDAR</div>
        <div>PAYMENT SCHEDULE / DATE</div>
        <div>SPECIAL NOTES</div>
        <div>MYFITFOODS CHECK-IN</div>
        <div>CELEBRATION MOMENTS</div>
        <div>FOOD NARRATIVE</div>
        <div>MOVEMENT NARRATIVE</div>
        <div>MEDICAL ADVISORY NARRATIVE</div>
      </section>
    </div>
  `;
}

function render525600Layout() {
  return `
    <div class="annual-layout">
      <section class="zone annual-box">PATTERN BOX 1</section>
      <section class="zone annual-box">PATTERN BOX 2</section>
      <section class="zone annual-box">PATTERN BOX 3</section>
      <section class="zone annual-box">WORK FEED</section>
    </div>
  `;
}

function renderClockItLayout() {
  const registry = getClockItRegistrySnapshot().map((entry) => `<li>${entry.familyKey}</li>`).join('');
  return `
    <div class="clock-layout">
      <section class="zone dropdown-inventory"><ul>${registry}</ul></section>
      <section class="zone macro-settings">MACRO SETTINGS AREA</section>
      <section class="zone system-map">SYSTEM MAP / UTILITIES AREA</section>
    </div>
  `;
}

function renderWorkLayout() {
  return `
    <div class="work-layout">
      <section class="zone chamber-space">CHAMBER OF WONDERS SPACE FOR ILLUSTRATION STUDIO</section>
      <section class="zone floating-book">FLOATING BOOK UNDER EYE</section>
    </div>
  `;
}

function renderSectionContent(route) {
  if (route === '/the-assurer') return renderAssurerLayout(sectionAnchorGlyphs[route]);
  if (route === '/the-summation') return renderSummationLayout();
  if (route === '/hopewood') return renderHopewoodLayout();
  if (route === '/remember-me') return renderRememberLayout();
  if (route === '/da-eater') return renderDaEaterLayout();
  if (route === '/thicc-fitt') return renderThiccFittLayout();
  if (route === '/its-getting-thicc') return renderItsGettingThiccLayout();
  if (route === '/525600') return render525600Layout();
  if (route === '/clock-it') return renderClockItLayout();
  if (route === '/the-work') return renderWorkLayout();
  return '';
}

function renderSectionShell() {
  const current = ROUTE_MAP[appState.route];
  const anchor = sectionAnchorGlyphs[appState.route];
  const isAssurer = appState.route === '/the-assurer';
  const showEye = current?.hasEye;
  const eyeAction = current?.eyeActive ? 'trigger-eye-of-truth' : '';
  const controlsClass = floatingControlsVisible ? 'controls-visible' : 'controls-faded';

  return `
    ${renderControlPanel()}
    <section class="section-screen">
      ${isAssurer ? '' : `<img class="section-anchor" src="${anchor}" alt="SECTION ANCHOR" />`}
      ${showEye ? `<button class="eye-of-truth ${isAssurer ? 'eye-center active' : `eye-floating inactive ${controlsClass}`}" ${eyeAction ? `data-action="${eyeAction}"` : 'disabled'}><img src="${triggerGlyphs.eyeOfTruth}" alt="EYE OF TRUTH" /></button><div class="eye-shimmer ${isAssurer ? 'center-shimmer' : 'floating-shimmer'}" aria-hidden="true"></div>` : ''}
      <div class="section-layout">${renderSectionContent(appState.route)}</div>
      <button class="wand ${controlsClass} ${appState.controlPanelOpen ? 'panel-open' : ''}" data-action="toggle-control-panel"><img src="${triggerGlyphs.controlWand}" alt="CONTROL WAND" /></button>
    </section>
  `;
}

function bindEvents() {
  app.querySelectorAll('[data-route]').forEach((node) => {
    node.addEventListener('click', () => {
      app.classList.add('dissolve');
      setTimeout(() => {
        app.classList.remove('dissolve');
        setRoute(node.dataset.route);
      }, 220);
    });
  });

  app.querySelectorAll('[data-action]').forEach((node) => {
    node.addEventListener('click', () => {
      if (node.dataset.action === 'clone-thicc-template') return addThiccDossierTemplate();
      showFloatingControlsTemporarily();
      runAction(node.dataset.action);
    });
  });

  app.querySelector('[data-day-changer]')?.addEventListener('change', (event) => {
    setActiveDay(toMMDDYYYYFromISO(event.target.value));
  });

  app.querySelector('[data-dossier-name]')?.addEventListener('change', (event) => {
    renameThiccDossier(appState.ui.thiccDossiers[0].id, event.target.value);
  });

  app.querySelector('.section-screen')?.addEventListener('pointerdown', () => {
    showFloatingControlsTemporarily();
  });
}

function render() {
  if (!app) return;
  if (appState.route !== previousRoute && appState.route !== '/') {
    showFloatingControlsTemporarily();
    previousRoute = appState.route;
  }
  app.innerHTML = appState.route === '/' ? renderOpening() : renderSectionShell();
  bindEvents();
}

export function mountApp(rootElement) {
  app = rootElement;
  subscribe(render);
  setRoute('/');
}
