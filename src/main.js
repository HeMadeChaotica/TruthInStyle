import { ACTION_MAP } from './config/actionMap.js';
import { controlPanelGlyphs, openingAssets, sectionAnchorGlyphs, triggerGlyphs } from './config/assetManifest.js';
import { CONTROL_PANEL_ORDER, ROUTE_MAP } from './config/sectionRegistry.js';
import {
  addOptionToFamily,
  getClockItRegistrySnapshot,
  getOptionRecordsForFamily,
  getOptionsForFamily,
  renameOptionInFamily,
  reorderOptionInFamily,
  restoreDefaultFamily,
  setOptionActiveState
} from './clockit/dropdownOptions.js';
import { archive_trend_intelligence, source_inputs } from './data/scaffoldData.js';
import { sealTruthForActiveDay } from './services/summationFlow.js';
import {
  addThiccDossierTemplate,
  appState,
  renameThiccDossier,
  routeBackInApp,
  setActiveDay,
  setRoute,
  subscribe,
  toggleControlPanel,
  updateAssurerAssessmentField,
  updateAssurerWriterField
} from './state/appState.js';

let app;
let previousRoute = '/';
let floatingControlsVisible = true;
let floatingControlsTimer = null;
let assessmentDebounceTimer = null;
let writerDebounceTimer = null;
let selectedClockFamily = 'assessmentMood';

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

function shiftDateMMDDYYYY(mmddyyyy, deltaDays) {
  const [month, day, year] = mmddyyyy.split('/').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + deltaDays));
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const y = date.getUTCFullYear();
  return `${m}/${d}/${y}`;
}

function getAssessmentValue(assessment, keys, fallback = '') {
  for (const key of keys) {
    if (assessment?.[key] !== undefined && assessment?.[key] !== null && assessment?.[key] !== '') return assessment[key];
  }
  return fallback;
}

function runAction(actionId) {
  const action = ACTION_MAP[actionId];
  if (!action) return;

  if (action.type === 'route') return setRoute(action.target);
  if (action.type === 'back') return routeBackInApp();
  if (action.type === 'control.panel.toggle') return toggleControlPanel();
  if (action.type === 'route.current-day') return setRoute(action.target);
  if (action.type === 'seal.summation') {
    sealTruthForActiveDay();
    setRoute('/hopewood');
  }
}

function renderOpening() {
  return `<section class="opening-screen"><img src="${openingAssets.scene0Entry}" alt="OPENING ASSET" /><button class="opening-hotspot" aria-label="OPEN CHAOTICA" data-route="/the-assurer"></button></section>`;
}

function renderControlPanel() {
  const ordered = CONTROL_PANEL_ORDER.map((actionKey) => {
    if (actionKey === 'control-day-changer') return `<li><button class="day-plugin-button" aria-label="DAY CHANGER"><img src="${controlPanelGlyphs[actionKey]}" alt="day changer" /><input class="day-picker-overlay" type="date" aria-label="DAY CHANGER" value="${toISOFromMMDDYYYY(appState.activeDay.activeDate)}" data-day-changer /></button></li>`;
    return `<li><button data-action="${actionKey}"><img src="${controlPanelGlyphs[actionKey]}" alt="${actionKey}" /></button></li>`;
  }).join('');

  return `<aside class="control-panel ${appState.controlPanelOpen ? 'open' : ''}"><div class="control-date-tile"><span>${appState.activeDay.activeDate}</span><strong>${appState.activeDay.activeWeekday}</strong></div><ul>${ordered}<li class="panel-wand-filler" aria-hidden="true"><img src="${triggerGlyphs.controlWand}" alt="" /></li></ul></aside>`;
}

function renderAssurerLayout(anchor) {
  const activeDate = appState.activeDay.activeDate;
  const assessment = source_inputs.assurer_assessment[activeDate] ?? {};
  const writer = source_inputs.assurer_writer[activeDate] ?? { heresTheThing: '' };
  const macroSummary = source_inputs.da_eater_day[activeDate] ?? {};
  const thiccSummary = source_inputs.thicc_fitt_day[activeDate] ?? {};
  const standoutMoments = source_inputs.remember_me_moments[activeDate] ?? [];
  const mediaLibrary = source_inputs.media_library[activeDate] ?? source_inputs.media_library ?? {};

  const requiredAssessmentFields = [
    { key: 'titleOfDay', label: 'TITLE OF THE DAY', type: 'text' },
    { key: 'headHummer', label: 'HEAD HUMMER', type: 'text' },
    { key: 'wordOfDay', label: 'WORD OF THE DAY', type: 'text' },
    { key: 'assessmentMood', aliases: ['mood'], label: 'MOOD', type: 'dropdown' },
    { key: 'assessmentEra', aliases: ['era'], label: 'ERA', type: 'dropdown' },
    { key: 'assessmentSingleness', aliases: ['singlenessLevel'], label: 'SINGLENESS LEVEL', type: 'dropdown' },
    { key: 'lobitoCheckIn', aliases: ['libido', 'lobito'], label: 'LIBIDO / LOBITO CHECK-IN', type: 'dropdown' }
  ];

  const macroBars = [
    ['protein', 'PROTEIN', macroSummary.proteinProgress ?? 0],
    ['carbs', 'CARBS', macroSummary.carbsProgress ?? 0],
    ['fats', 'FATS', macroSummary.fatsProgress ?? 0],
    ['water', 'WATER', macroSummary.waterProgress ?? 0],
    ['calories', 'CALORIES', macroSummary.caloriesProgress ?? 0]
  ]
    .map(
      ([key, label, progress]) => `<div class="macro-bar-wrap" data-macro="${key}"><span>${label}</span><div class="macro-track"><div class="macro-fill" style="width:${Math.max(0, Math.min(100, Number(progress) || 0))}%"></div></div><strong>${Math.round(Number(progress) || 0)}%</strong></div>`
    )
    .join('');

  const fiveDayPreview = Array.from({ length: 5 }, (_, index) => {
    const dateKey = shiftDateMMDDYYYY(activeDate, index);
    const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(new Date(toISOFromMMDDYYYY(dateKey))).toUpperCase();
    const calendarItem = source_inputs.remember_me_calendar[dateKey];
    return { dateKey, weekday, item: Array.isArray(calendarItem) ? calendarItem[0] : calendarItem };
  });

  return `
    <div class="assurer-slab">
      <section class="assessment-fusion-field stage-card">
        <div class="assessment-grid">
          <div class="anchor-slot"><img class="assurer-anchor assurer-anchor-large" src="${anchor}" alt="SECTION ANCHOR" /></div>
          <div class="glam-date-tile">${appState.activeDay.activeWeekday} · ${activeDate}</div>
          ${requiredAssessmentFields
            .map(({ key, aliases = [], label, type }) =>
              type === 'dropdown'
                ? `<label class="assessment-pill field-${key}">${label}<select data-assessment-field="${key}"><option value="">SELECT</option>${getOptionsForFamily(key)
                    .map((option) => `<option value="${option}" ${getAssessmentValue(assessment, [key, ...aliases]) === option ? 'selected' : ''}>${option}</option>`)
                    .join('')}</select></label>`
                : `<label class="assessment-pill field-${key}">${label}<input data-assessment-field="${key}" value="${getAssessmentValue(assessment, [key, ...aliases])}" /></label>`
            )
            .join('')}
          <div class="moments-strip"><ul>${standoutMoments
            .slice(0, 3)
            .map((item) => `<li><b>${item?.type ?? 'WOW'}</b> · ${item?.title ?? item?.note ?? 'ENTRY'}</li>`)
            .join('') || '<li><b>WOW</b> · NO MOMENTS LOGGED</li>'}</ul></div>
        </div>
      </section>
      <section class="macro-progression-band stage-card" data-route="/da-eater"><h3>MACRO PROGRESSION</h3>${macroBars}</section>
      <section class="writer-cloud"><div class="cloud-shell"><textarea data-writer-field="heresTheThing">${writer.heresTheThing ?? ''}</textarea></div></section>
      <section class="thicc-moments stage-card" data-route="/thicc-fitt"><h3>THICC.FITT SUMMARY</h3><p>WORKOUT: ${(thiccSummary.workoutSignal ?? thiccSummary.workout ?? '—').toString()}</p><p>CARDIO: ${(thiccSummary.cardioSignal ?? thiccSummary.cardio ?? '—').toString()}</p><p>DA.JUICE: ${(thiccSummary.daJuice ?? thiccSummary.juice ?? '—').toString()}</p><p>BODY SIGNAL: ${(thiccSummary.bodySignal ?? thiccSummary.performanceNote ?? thiccSummary.bodyNote ?? '—').toString()}</p><p>NOTES: ${(thiccSummary.notes ?? thiccSummary.summary ?? '—').toString()}</p></section>
      <section class="remember-five-day stage-card" data-route="/remember-me"><h3>5-DAY PREVIEW</h3><ul class="mini-day-cards">${fiveDayPreview
        .map((item) => `<li><strong>${item.weekday}</strong><span>${item.dateKey}</span><em>${item.dateKey === activeDate ? 'TODAY' : item.item?.label ?? item.item?.title ?? item.item?.mark ?? 'OPEN'}</em></li>`)
        .join('')}</ul></section>
      <section class="intake-summary stage-card" data-route="/da-eater"><h3>DA.EATER SUMMARY</h3><p>MEALS LOGGED: ${(macroSummary.mealsLogged ?? macroSummary.mealCount ?? 0).toString()}</p><p>LAST MEAL: ${(macroSummary.lastMealNote ?? macroSummary.lastMeal ?? '—').toString()}</p><p>CHEAT/FLEX: ${(macroSummary.cheatSignal ?? macroSummary.flexSignal ?? '—').toString()}</p><p>PHOTO LOG: ${(macroSummary.photoLogCount ?? (macroSummary.mealPhotoPresent ?? macroSummary.photoPresent ? 1 : 0)).toString()} TODAY</p><p>INTAKE NOTE: ${(macroSummary.intakeNote ?? '—').toString().slice(0, 72)}</p><p>MEDIA: ${(mediaLibrary.latestMeal ?? mediaLibrary.lastImage ?? 'NOT LINKED').toString().slice(0, 42)}</p></section>
      <section class="eye-overlay"><button class="assurer-eye-bridge" data-action="trigger-eye-of-truth" aria-label="ROUTE TO THE SUMMATION"><img src="${triggerGlyphs.eyeOfTruth}" alt="EYE" /></button></section>
    </div>`;
}

function renderSummationLayout() { return `<div class="summation-layout"><section class="zone summation-render"><header>TITLE OF THE DAY · ${appState.activeDay.activeWeekday} · ${appState.activeDay.activeDate}</header></section><aside class="summation-support"><section class="zone bonus-questions">BONUS QUESTIONS AREA</section><section class="zone version-selector">VERSION SELECTOR: VERSION 1 / VERSION 2 / VERSION 3</section><section class="zone seal-zone"><button class="trigger-button" data-action="trigger-seal-the-truth"><img src="${triggerGlyphs.sealTheTruth}" alt="SEAL THE TRUTH" /></button></section></aside></div>`; }
function renderHopewoodLayout() { const entries = Object.values(archive_trend_intelligence.hopewood_entries).map((entry) => `<li>${entry.dateKey} ${entry.titleOfDay}</li>`).join(''); return `<div class="hopewood-layout"><section class="zone hopewood-search">SEARCH COLUMN</section><section class="zone hopewood-options">OPTIONS / SELECT COLUMN</section><section class="zone hopewood-book"><div>OPEN-BOOK DISPLAY AREA</div><ul>${entries}</ul></section></div>`; }
function renderRememberLayout() { const days = Array.from({ length: 35 }, (_, i) => `<div class="calendar-cell">DAY ${i + 1}</div>`).join(''); return `<div class="remember-layout"><section class="zone calendar-wall">${days}</section><section class="zone moments-zone">WOW · WTF · PLOT TWIST · UP TO 3 MOMENTS · PHOTO + DESCRIPTION</section><section class="zone remember-photo-zone">INTEGRATED PHOTO ZONES</section></div>`; }
function renderDaEaterLayout() { return `<div class="da-eater-layout"><section class="zone macro-progression">MACRO PROGRESSION</section><section class="zone meals-area">MEALS AREA</section><section class="zone flex-area">WEDNESDAY/SATURDAY CHEAT LOGS</section><section class="zone meal-photos">MEAL PHOTO LOG + UPLOAD ZONES</section><section class="zone intake-notes">ADDITIONAL INTAKE NOTES</section></div>`; }
function renderThiccFittLayout() { return `<div class="thicc-layout"><section class="zone workout-log">WORKOUT LOG</section><section class="zone media-zone">MEDIA</section><section class="zone notes-zone">NOTES</section><section class="zone cardio-zone">CARDIO</section><section class="zone da-juice-zone">DA.JUICE</section><section class="zone performance-zone">BODY / PERFORMANCE RECORDS</section><button class="trigger-button dumbbell-zone" data-action="trigger-crystal-dumbbell"><img src="${triggerGlyphs.crystalDumbbell}" alt="CRYSTAL DUMBBELL" /></button></div>`; }
function renderItsGettingThiccLayout() { const dossierTabs = appState.ui.thiccDossiers.map((item) => `<button class="dossier-tab">${item.label}</button>`).join(''); return `<div class="its-thicc-layout"><section class="zone dossier-toolbar">${dossierTabs}<button class="dossier-plus" data-action="clone-thicc-template">+</button></section><section class="zone dossier-grid"><div>IDENTITY BLOCK <input data-dossier-name placeholder="CLIENT NAME" /></div><div>PHOTO BLOCK</div><div>WEIGHT / BMI BLOCK</div><div>MACRO BLOCK</div></section></div>`; }

function render525600Layout() {
  return `<div class="annual-layout fixed-four"><section class="zone annual-box">TOP LEFT — Body + Fuel</section><section class="zone annual-box">TOP RIGHT — State + Signals</section><section class="zone annual-box">BOTTOM LEFT — Here’s the Thing</section><section class="zone annual-box">BOTTOM RIGHT — The Work Channel</section></div>`;
}

function renderClockItLayout() {
  const fallbackFamily = getClockItRegistrySnapshot()[0]?.familyKey ?? 'assessmentMood';
  const family = selectedClockFamily || fallbackFamily;
  const records = getOptionRecordsForFamily(family);
  return `<div class="clock-layout"><section class="zone dropdown-inventory"><h3>DROPDOWN FAMILY</h3><select data-clock-family>${getClockItRegistrySnapshot().map((entry) => `<option value="${entry.familyKey}" ${entry.familyKey === family ? 'selected' : ''}>${entry.familyKey}</option>`).join('')}</select><input data-clock-new placeholder="Add option" /><button data-clock-action="add">ADD OPTION</button><button data-clock-action="restore">RESTORE DEFAULTS</button></section><section class="zone macro-settings"><h3>OPTIONS</h3><ul class="clock-option-list">${records
    .map((item, index) => `<li><input value="${item.label}" data-clock-label="${index}" /><button data-clock-action="up" data-clock-index="${index}">↑</button><button data-clock-action="down" data-clock-index="${index}">↓</button><button data-clock-action="toggle" data-clock-index="${index}">${item.active ? 'DEACTIVATE' : 'ACTIVATE'}</button></li>`)
    .join('')}</ul></section><section class="zone system-map">CLOCK.IT edits all dropdown families from registry.</section></div>`;
}

function renderWorkLayout() { return `<div class="work-layout"><section class="zone chamber-space">CHAMBER OF WONDERS SPACE FOR ILLUSTRATION STUDIO</section><section class="zone floating-book">FLOATING BOOK UNDER EYE</section></div>`; }

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
  return `${renderControlPanel()}<section class="section-screen">${isAssurer ? '' : `<img class="section-anchor" src="${anchor}" alt="SECTION ANCHOR" />`}${showEye && !isAssurer ? `<button class="eye-of-truth eye-floating inactive ${controlsClass}" ${eyeAction ? `data-action="${eyeAction}"` : 'disabled'}><img src="${triggerGlyphs.eyeOfTruth}" alt="EYE OF TRUTH" /></button><div class="eye-shimmer floating-shimmer" aria-hidden="true"></div>` : ''}<div class="section-layout">${renderSectionContent(appState.route)}</div>${isAssurer ? '' : `<button class="wand ${controlsClass} ${appState.controlPanelOpen ? 'panel-open' : ''}" data-action="toggle-control-panel"><img src="${triggerGlyphs.controlWand}" alt="CONTROL WAND" /></button>`}</section>`;
}

function bindEvents() {
  app.querySelectorAll('[data-route]').forEach((node) => node.addEventListener('click', () => { app.classList.add('dissolve'); setTimeout(() => { app.classList.remove('dissolve'); setRoute(node.dataset.route); }, 220); }));

  app.querySelectorAll('[data-action]').forEach((node) => node.addEventListener('click', () => { if (node.dataset.action === 'clone-thicc-template') return addThiccDossierTemplate(); showFloatingControlsTemporarily(); runAction(node.dataset.action); }));

  app.querySelector('[data-day-changer]')?.addEventListener('change', (event) => setActiveDay(toMMDDYYYYFromISO(event.target.value)));
  app.querySelector('[data-dossier-name]')?.addEventListener('change', (event) => renameThiccDossier(appState.ui.thiccDossiers[0].id, event.target.value));

  app.querySelectorAll('[data-assessment-field]').forEach((node) => {
    if (node.tagName === 'SELECT') {
      node.addEventListener('change', (event) => updateAssurerAssessmentField(node.dataset.assessmentField, event.target.value));
      return;
    }
    const persist = () => updateAssurerAssessmentField(node.dataset.assessmentField, node.value);
    node.addEventListener('input', () => { clearTimeout(assessmentDebounceTimer); assessmentDebounceTimer = setTimeout(persist, 280); });
    node.addEventListener('blur', persist);
  });

  app.querySelectorAll('[data-writer-field]').forEach((node) => {
    const persist = () => updateAssurerWriterField(node.dataset.writerField, node.value);
    node.addEventListener('input', () => { clearTimeout(writerDebounceTimer); writerDebounceTimer = setTimeout(persist, 320); });
    node.addEventListener('blur', persist);
  });

  const getCurrentFamily = () => app.querySelector('[data-clock-family]')?.value || selectedClockFamily;
  app.querySelector('[data-clock-family]')?.addEventListener('change', (event) => { selectedClockFamily = event.target.value; render(); });
  app.querySelector('[data-clock-action="add"]')?.addEventListener('click', () => { addOptionToFamily(getCurrentFamily(), app.querySelector('[data-clock-new]')?.value ?? ''); render(); });
  app.querySelector('[data-clock-action="restore"]')?.addEventListener('click', () => { restoreDefaultFamily(getCurrentFamily()); render(); });

  app.querySelectorAll('[data-clock-label]').forEach((node) => node.addEventListener('change', () => { renameOptionInFamily(getCurrentFamily(), Number(node.dataset.clockLabel), node.value); render(); }));
  app.querySelectorAll('[data-clock-action="up"]').forEach((node) => node.addEventListener('click', () => { reorderOptionInFamily(getCurrentFamily(), Number(node.dataset.clockIndex), 'up'); render(); }));
  app.querySelectorAll('[data-clock-action="down"]').forEach((node) => node.addEventListener('click', () => { reorderOptionInFamily(getCurrentFamily(), Number(node.dataset.clockIndex), 'down'); render(); }));
  app.querySelectorAll('[data-clock-action="toggle"]').forEach((node) => node.addEventListener('click', () => {
    const index = Number(node.dataset.clockIndex);
    const active = getOptionRecordsForFamily(getCurrentFamily())[index]?.active;
    setOptionActiveState(getCurrentFamily(), index, !active);
    render();
  }));

  app.querySelector('.section-screen')?.addEventListener('pointerdown', showFloatingControlsTemporarily);
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
