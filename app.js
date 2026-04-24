const ROUTES = {
  OPENING: "opening",
  ASSURER: "the.assurer",
  SUMMATION: "the.summation",
  HOPEWOOD: "hopewood",
  REMEMBER: "remember.me",
  YEARLY: "525,600",
  CLOCK: "clock.it",
  THICC: "thicc.fitt",
  EATER: "da.eater",
  WORK: "the.work",
};

const CONTROL_PANEL_NAV = [
  "day changer",
  "home",
  "back",
  ROUTES.SUMMATION,
  ROUTES.HOPEWOOD,
  ROUTES.THICC,
  ROUTES.EATER,
  ROUTES.REMEMBER,
  ROUTES.YEARLY,
  ROUTES.CLOCK,
  ROUTES.WORK,
];

const SECTION_PALLETS = {
  [ROUTES.ASSURER]: ["hematite", "copper", "obsidian", "mulberry", "pink weave"],
  [ROUTES.EATER]: ["smoked clay", "walnut", "garnet", "onyx", "pink weave"],
  [ROUTES.SUMMATION]: ["amethyst", "ink", "pewter", "mahogany", "pink weave"],
  [ROUTES.HOPEWOOD]: ["moss", "bronze", "ink", "emerald", "pink weave"],
  [ROUTES.REMEMBER]: ["violet stone", "charcoal", "moon metal", "plum", "pink weave"],
  [ROUTES.CLOCK]: ["teal ore", "graphite", "steel", "marine", "pink weave"],
  [ROUTES.THICC]: ["terra", "burnt umber", "black sand", "gold", "pink weave"],
  [ROUTES.YEARLY]: ["olive ore", "indigo", "slate", "amber", "pink weave"],
  [ROUTES.WORK]: ["smoke", "aluminum", "ink", "platinum", "pink weave"],
};

const anchorGlyph = {
  [ROUTES.ASSURER]: "◈",
  [ROUTES.EATER]: "◉",
  [ROUTES.SUMMATION]: "◍",
  [ROUTES.HOPEWOOD]: "◌",
  [ROUTES.REMEMBER]: "◐",
  [ROUTES.CLOCK]: "◒",
  [ROUTES.THICC]: "◓",
  [ROUTES.YEARLY]: "◎",
  [ROUTES.WORK]: "◇",
};

const STORAGE_KEY = "truthinstyle.execution.v2";
const state = {
  route: ROUTES.OPENING,
  panelOpen: false,
  date: todayISO(),
  hopewoodQuery: "",
  hopewoodTag: "",
  navHistory: [],
  model: loadModel(),
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function loadModel() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  return {
    section_registry: Object.values(ROUTES).filter((r) => r !== ROUTES.OPENING),
    controlled_vocabularies: {
      hopewood_qualifiers: ["energy", "focus", "food", "training", "sleep", "mindset"],
      remember_tags: ["WOW", "WTF", "PLOT TWIST"],
      eater_meal_types: ["breakfast", "lunch", "dinner", "snack"],
    },
    source_inputs: {},
    daily_synthesis: {},
    archive_intelligence: {
      hopewood_pages: [],
      yearly_trends: {},
      media_spine: [],
    },
  };
}

let persistTimer;
function persist() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.model));
  }, 225);
}

function ensureDayBucket() {
  const date = state.date;
  if (!state.model.source_inputs[date]) {
    state.model.source_inputs[date] = {
      day_record: { date, created_at: new Date().toISOString() },
      assurer: {
        receiver_field: "",
        distributed_questions: {
          physical: "",
          emotional: "",
          mental: "",
          spiritual: "",
          libido: "",
        },
        writer_cloud: "",
      },
      da_eater: {
        meals: [],
        macro_targets: { protein: 180, carbs: 180, fats: 60 },
        macro_actuals: { protein: 0, carbs: 0, fats: 0 },
        media: "",
        cheat_concepts: "",
      },
      remember_me: {
        calendar_note: "",
        standout_moments: ["", "", ""],
      },
      thicc_fitt: {
        personal_stream: "",
        client_stream: "",
        da_juice: "",
      },
      clock_it: {
        dropdowns: {
          hopewood_qualifiers: [...state.model.controlled_vocabularies.hopewood_qualifiers],
        },
        route_map_notes: "",
        utility_notes: "",
      },
    };
  }
  return state.model.source_inputs[date];
}

function routeMapLabel(route) {
  if (route === ROUTES.ASSURER) return "home";
  return route;
}

function go(route) {
  if (state.route !== route) state.navHistory.push(state.route);
  state.route = route;
  state.panelOpen = false;
  render();
}

function goBack() {
  state.route = state.navHistory.pop() || ROUTES.ASSURER;
  state.panelOpen = false;
  render();
}

function frame(route, content) {
  const palette = SECTION_PALLETS[route];
  return `
    <main class="section route-${cssSafe(route)}">
      <header class="section-header">
        <div class="anchor" title="top-left anchor emblem">${anchorGlyph[route] || "◈"}</div>
        <div>
          <h1>${route}</h1>
          <p class="palette">${palette.join(" • ")}</p>
        </div>
      </header>
      ${content}
      <button class="wand" id="open-panel" aria-label="open control panel">🪄</button>
    </main>
  `;
}

function renderOpening() {
  return `
  <main class="opening-scene">
    <div class="scene-0-entry" role="img" aria-label="scene-0-entry placeholder"></div>
    <h1>CHAOTICA</h1>
    <button id="tell-no-lies">Tell No Lies</button>
  </main>`;
}

function renderAssurer() {
  const d = ensureDayBucket().assurer;
  const q = d.distributed_questions;
  return frame(ROUTES.ASSURER, `
    <section class="card">
      <h2>Unified Receiver Field</h2>
      <textarea id="assurer-receiver" placeholder="Receive without distortion">${d.receiver_field}</textarea>
      <div class="split-grid">
        <label>physical<input id="q-physical" value="${q.physical}" /></label>
        <label>emotional<input id="q-emotional" value="${q.emotional}" /></label>
        <label>mental<input id="q-mental" value="${q.mental}" /></label>
        <label>spiritual<input id="q-spiritual" value="${q.spiritual}" /></label>
        <label>libido (moved here)<input id="q-libido" value="${q.libido}" /></label>
      </div>
      <label>writer cloud<textarea id="assurer-writer">${d.writer_cloud}</textarea></label>
    </section>
  `);
}

function renderEater() {
  const d = ensureDayBucket().da_eater;
  const mealRows = d.meals.map((m, i) => `<li>${m.type}: ${m.note} (${m.calories} cal)</li>`).join("");
  return frame(ROUTES.EATER, `
    <section class="card">
      <h2>intake command center</h2>
      <div class="split-grid">
        <label>meal type
          <select id="meal-type">${state.model.controlled_vocabularies.eater_meal_types.map((m) => `<option>${m}</option>`).join("")}</select>
        </label>
        <label>calories<input id="meal-cal" type="number" min="0" value="0" /></label>
      </div>
      <label>meal note<input id="meal-note" /></label>
      <button id="add-meal">add meal</button>
      <ul class="list">${mealRows || "<li>No meals logged.</li>"}</ul>
      <div class="macro-bars">
        ${macroBar("protein", d)}
        ${macroBar("carbs", d)}
        ${macroBar("fats", d)}
      </div>
      <label>media<textarea id="eater-media">${d.media}</textarea></label>
      <label>cheat concepts<textarea id="eater-cheat">${d.cheat_concepts}</textarea></label>
    </section>
  `);
}

function macroBar(name, d) {
  const target = d.macro_targets[name] || 1;
  const actual = d.macro_actuals[name] || 0;
  const pct = Math.max(0, Math.min(100, Math.round((actual / target) * 100)));
  return `<label>${name} ${actual}/${target}
    <input id="macro-${name}" type="number" min="0" value="${actual}" />
    <div class="bar"><span style="width:${pct}%"></span></div>
  </label>`;
}

function renderRemember() {
  const d = ensureDayBucket().remember_me;
  return frame(ROUTES.REMEMBER, `
    <section class="card">
      <h2>calendar + moments</h2>
      <label>month calendar note<textarea id="remember-calendar">${d.calendar_note}</textarea></label>
      <div class="split-grid">
        <label>WOW<input id="moment-0" value="${d.standout_moments[0] || ""}" /></label>
        <label>WTF<input id="moment-1" value="${d.standout_moments[1] || ""}" /></label>
        <label>PLOT TWIST<input id="moment-2" value="${d.standout_moments[2] || ""}" /></label>
      </div>
      <small>max 3 moments/day.</small>
    </section>
  `);
}

function renderThicc() {
  const d = ensureDayBucket().thicc_fitt;
  return frame(ROUTES.THICC, `
    <section class="card">
      <h2>Mista.Thicc domain</h2>
      <div class="split-grid two-col">
        <label>personal side<textarea id="thicc-personal">${d.personal_stream}</textarea></label>
        <label>client side (separate domain)<textarea id="thicc-client">${d.client_stream}</textarea></label>
      </div>
      <label>da.juice territory<textarea id="thicc-juice">${d.da_juice}</textarea></label>
      <button id="client-takeover">🏋️ dumbbell glyph opens client takeover</button>
    </section>
  `);
}

function renderClock() {
  const d = ensureDayBucket().clock_it;
  return frame(ROUTES.CLOCK, `
    <section class="card">
      <h2>edit control center</h2>
      <label>Hopewood qualifier dropdown inventory (comma separated)
        <textarea id="clock-qualifiers">${d.dropdowns.hopewood_qualifiers.join(", ")}</textarea>
      </label>
      <label>route/system maps<textarea id="clock-routes">${d.route_map_notes}</textarea></label>
      <label>utility/control authority<textarea id="clock-utilities">${d.utility_notes}</textarea></label>
    </section>
  `);
}

function renderSummation() {
  const sum = state.model.daily_synthesis[state.date];
  return frame(ROUTES.SUMMATION, `
    <section class="card summation">
      <h2>current-day transformation surface</h2>
      <article>${sum?.rendered_page || "No rendered page yet for this day."}</article>
      <button id="eye-of-truth" class="eye">👁 Eye of Truth — Summate</button>
      <p>Writes rendered page to Hopewood archive for ${state.date}.</p>
    </section>
  `);
}

function renderHopewood() {
  const pages = state.model.archive_intelligence.hopewood_pages;
  const options = state.model.controlled_vocabularies.hopewood_qualifiers
    .filter((q) => q !== "da.juice")
    .map((q) => `<option ${state.hopewoodTag === q ? "selected" : ""} value="${q}">${q}</option>`).join("");

  const filtered = pages
    .filter((p) => state.hopewoodQuery ? p.rendered_page.toLowerCase().includes(state.hopewoodQuery.toLowerCase()) : true)
    .filter((p) => state.hopewoodTag ? p.qualifiers.includes(state.hopewoodTag) : true);

  return frame(ROUTES.HOPEWOOD, `
    <section class="card">
      <h2>read-only sequential archive</h2>
      <div class="split-grid">
        <label>search<input id="hopewood-query" value="${state.hopewoodQuery}" /></label>
        <label>qualifier
          <select id="hopewood-tag">
            <option value="">all</option>
            ${options}
          </select>
        </label>
      </div>
      <ol class="list">${filtered.map((p) => `<li><strong>${p.date}</strong><pre>${escapeHtml(p.rendered_page)}</pre></li>`).join("") || "<li>No archive pages yet.</li>"}</ol>
      <small>no settings/utilities here.</small>
    </section>
  `);
}

function renderYearly() {
  const year = state.date.slice(0, 4);
  const trend = state.model.archive_intelligence.yearly_trends[year];
  return frame(ROUTES.YEARLY, `
    <section class="card">
      <h2>annual pattern reader</h2>
      <p>Reads normalized source truth + Hopewood metadata continuity.</p>
      <pre>${trend ? escapeHtml(JSON.stringify(trend, null, 2)) : "No trend aggregation yet for this year."}</pre>
    </section>
  `);
}

function renderWork() {
  return frame(ROUTES.WORK, `
    <section class="card"><h2>The Work</h2><p>Control.panel territory only. Not central assurer takeover.</p></section>
  `);
}

function renderControlPanel() {
  if (!state.panelOpen || state.route === ROUTES.OPENING) return "";
  return `<aside class="control-panel">
    <h2>control.panel</h2>
    <label>day changer<input type="date" id="day-changer" value="${state.date}"/></label>
    ${CONTROL_PANEL_NAV.slice(1).map((item) => `<button class="panel-link" data-item="${item}">${item}</button>`).join("")}
  </aside>`;
}

function performSummation() {
  const source = ensureDayBucket();
  const rendered = [
    `Date: ${state.date}`,
    `Receiver: ${source.assurer.receiver_field}`,
    `Questions: ${Object.values(source.assurer.distributed_questions).join(" | ")}`,
    `Writer Cloud: ${source.assurer.writer_cloud}`,
    `Meals: ${source.da_eater.meals.map((m) => `${m.type}:${m.note}`).join(", ") || "none"}`,
    `Macros: P${source.da_eater.macro_actuals.protein} C${source.da_eater.macro_actuals.carbs} F${source.da_eater.macro_actuals.fats}`,
    `Remember: ${source.remember_me.standout_moments.filter(Boolean).join(" ; ")}`,
    `Thicc Personal: ${source.thicc_fitt.personal_stream}`,
    `Thicc Client: ${source.thicc_fitt.client_stream}`,
  ].join("\n");

  const qualifiers = state.model.controlled_vocabularies.hopewood_qualifiers
    .filter((q) => rendered.toLowerCase().includes(q.slice(0, 3)) && q !== "da.juice");

  state.model.daily_synthesis[state.date] = {
    date: state.date,
    rendered_page: rendered,
    helper_prompts_version: "locked-v1",
    source_date: state.date,
    qualifiers,
  };

  const archive = state.model.archive_intelligence.hopewood_pages;
  const page = {
    date: state.date,
    rendered_page: rendered,
    qualifiers,
    source_metadata: {
      source_bucket: "daily_synthesis",
      archived_at: new Date().toISOString(),
    },
  };

  const existing = archive.findIndex((p) => p.date === state.date);
  if (existing >= 0) archive[existing] = page;
  else archive.unshift(page);

  aggregateYearly(state.date.slice(0, 4));
  persist();
  render();
}

function aggregateYearly(year) {
  const pages = state.model.archive_intelligence.hopewood_pages.filter((p) => p.date.startsWith(year));
  const sourceDays = Object.keys(state.model.source_inputs).filter((d) => d.startsWith(year));
  const qualifiers = {};
  for (const page of pages) {
    for (const q of page.qualifiers) qualifiers[q] = (qualifiers[q] || 0) + 1;
  }
  state.model.archive_intelligence.yearly_trends[year] = {
    year,
    source_day_count: sourceDays.length,
    hopewood_page_count: pages.length,
    missing_archive_days: sourceDays.filter((d) => !pages.some((p) => p.date === d)),
    qualifier_frequency: qualifiers,
    continuity_score: sourceDays.length ? Number((pages.length / sourceDays.length).toFixed(2)) : 0,
  };
}

function attachBehaviors() {
  document.getElementById("tell-no-lies")?.addEventListener("click", () => go(ROUTES.ASSURER));
  document.getElementById("open-panel")?.addEventListener("click", () => {
    state.panelOpen = !state.panelOpen;
    render();
  });

  document.querySelectorAll(".panel-link").forEach((el) => {
    el.addEventListener("click", () => {
      const item = el.dataset.item;
      if (item === "home") go(ROUTES.ASSURER);
      else if (item === "back") goBack();
      else go(item);
    });
  });

  document.getElementById("day-changer")?.addEventListener("change", (e) => {
    state.date = e.target.value;
    ensureDayBucket();
    persist();
    render();
  });

  bindAutosave();
}

function bindAutosave() {
  const bucket = ensureDayBucket();

  bindInput("assurer-receiver", (v) => bucket.assurer.receiver_field = v);
  bindInput("q-physical", (v) => bucket.assurer.distributed_questions.physical = v);
  bindInput("q-emotional", (v) => bucket.assurer.distributed_questions.emotional = v);
  bindInput("q-mental", (v) => bucket.assurer.distributed_questions.mental = v);
  bindInput("q-spiritual", (v) => bucket.assurer.distributed_questions.spiritual = v);
  bindInput("q-libido", (v) => bucket.assurer.distributed_questions.libido = v);
  bindInput("assurer-writer", (v) => bucket.assurer.writer_cloud = v);

  bindInput("macro-protein", (v) => bucket.da_eater.macro_actuals.protein = Number(v || 0));
  bindInput("macro-carbs", (v) => bucket.da_eater.macro_actuals.carbs = Number(v || 0));
  bindInput("macro-fats", (v) => bucket.da_eater.macro_actuals.fats = Number(v || 0));
  bindInput("eater-media", (v) => bucket.da_eater.media = v);
  bindInput("eater-cheat", (v) => bucket.da_eater.cheat_concepts = v);

  document.getElementById("add-meal")?.addEventListener("click", () => {
    const type = document.getElementById("meal-type")?.value || "meal";
    const note = document.getElementById("meal-note")?.value || "";
    const calories = Number(document.getElementById("meal-cal")?.value || 0);
    bucket.da_eater.meals.push({ type, note, calories });
    persist();
    render();
  });

  bindInput("remember-calendar", (v) => bucket.remember_me.calendar_note = v);
  [0, 1, 2].forEach((i) => bindInput(`moment-${i}`, (v) => bucket.remember_me.standout_moments[i] = v));

  bindInput("thicc-personal", (v) => bucket.thicc_fitt.personal_stream = v);
  bindInput("thicc-client", (v) => bucket.thicc_fitt.client_stream = v);
  bindInput("thicc-juice", (v) => bucket.thicc_fitt.da_juice = v);

  bindInput("clock-qualifiers", (v) => {
    const cleaned = v.split(",").map((x) => x.trim()).filter(Boolean).filter((x) => x !== "da.juice");
    bucket.clock_it.dropdowns.hopewood_qualifiers = cleaned;
    state.model.controlled_vocabularies.hopewood_qualifiers = cleaned;
  });
  bindInput("clock-routes", (v) => bucket.clock_it.route_map_notes = v);
  bindInput("clock-utilities", (v) => bucket.clock_it.utility_notes = v);

  document.getElementById("eye-of-truth")?.addEventListener("click", performSummation);

  bindInput("hopewood-query", (v) => {
    state.hopewoodQuery = v;
    render();
  });
  document.getElementById("hopewood-tag")?.addEventListener("change", (e) => {
    state.hopewoodTag = e.target.value;
    render();
  });

  document.getElementById("client-takeover")?.addEventListener("click", () => {
    alert("Client takeover panel is scoped and separated under thicc.fitt client domain.");
  });
}

function bindInput(id, setter) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", () => {
    setter(el.value);
    persist();
  });
}

function render() {
  const app = document.getElementById("app");
  let html = "";

  if (state.route === ROUTES.OPENING) html = renderOpening();
  if (state.route === ROUTES.ASSURER) html = renderAssurer();
  if (state.route === ROUTES.EATER) html = renderEater();
  if (state.route === ROUTES.SUMMATION) html = renderSummation();
  if (state.route === ROUTES.HOPEWOOD) html = renderHopewood();
  if (state.route === ROUTES.REMEMBER) html = renderRemember();
  if (state.route === ROUTES.YEARLY) html = renderYearly();
  if (state.route === ROUTES.CLOCK) html = renderClock();
  if (state.route === ROUTES.THICC) html = renderThicc();
  if (state.route === ROUTES.WORK) html = renderWork();

  app.innerHTML = `${html}${renderControlPanel()}`;
  attachBehaviors();
}

function cssSafe(route) {
  return route.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

render();
