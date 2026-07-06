const DATA_FILES = {
  calendario: { path: "data/calendario_br.json" },
  kpis: { path: "data/kpis_dia.json" },
  funil: { path: "data/funil_dia.json" },
  produtos: { path: "data/produtos_dia.json" },
  lancamentosProdutos: { path: "data/lancamentos_produtos_dia.json", optional: true },
  campanhas: { path: "data/campanhas_dia.json" },
  utms: { path: "data/utms_dia.json" },
  estoque: { path: "data/estoque.json" },
  metas: { path: "data/metas_comerciais.json", optional: true },
  manifest: { path: "data/manifest.json", optional: true },
  eventosManuais: { path: "data/eventos_manuais.json", optional: true },
  lancamentosModelos: { path: "data/lancamentos_modelos.json", optional: true },
  lancamentosInvestimentos: { path: "data/lancamentos_investimentos.json", optional: true },
};

const MANUAL_EVENTS_STORAGE_KEY = "reise_eventos_manuais";
const MANUAL_EVENTS_DELETED_KEY = "reise_eventos_manuais_excluidos";
const PRODUCTION_API_BASE = "https://calendario-reise.vercel.app";
const API_BASE = resolveApiBase();

const COMPARISON_LABELS = {
  previousPeriod: "Período anterior",
  previousYear: "Ano anterior",
  previousMonth: "Mês anterior",
  nextYear: "Ano posterior",
  nextMonth: "Mês posterior",
  manualMonth: "Mesmo mês de outro ano",
  manualYear: "Mesmo mês de outro ano",
  previousYearEvent: "Mesmo evento do ano anterior",
  averagePreviousYears: "Média dos últimos anos",
  freeDate: "Data livre",
  target: "Meta",
  none: "Sem comparação",
};

const PERIOD_TYPE_LABELS = {
  today: "Hoje",
  yesterday: "Ontem",
  selectedDay: "Data selecionada",
  selectedPeriod: "Período selecionado",
  last7: "Últimos 7 dias",
  last15: "Últimos 15 dias",
  last30: "Últimos 30 dias",
  previous7: "7 dias anteriores",
  next7: "7 dias posteriores",
  previous15: "15 dias anteriores",
  next15: "15 dias posteriores",
  previous30: "30 dias anteriores",
  next30: "30 dias posteriores",
  previousMonthPeriod: "Mês anterior",
  nextMonthPeriod: "Mês posterior",
  previousYearPeriod: "Ano anterior",
  nextYearPeriod: "Ano posterior",
  fullCurrentMonth: "Mês atual",
  fullCurrentYear: "Ano atual",
  freePeriod: "Data livre",
};

const FLUCTUATION_METRICS = [
  { key: "receita_total", label: "Faturamento", formatter: formatCurrency },
  { key: "pedidos_aprovados", label: "Pedidos", formatter: formatInteger },
  { key: "ticket_medio", label: "Ticket médio", formatter: formatCurrency },
  { key: "sessoes", label: "Sessões", formatter: formatInteger },
  { key: "add_to_cart", label: "Add to cart", formatter: formatInteger },
  { key: "begin_checkout", label: "Checkout", formatter: formatInteger },
  { key: "abandono_carrinho_estimado", label: "Abandono carrinho", formatter: formatInteger },
  { key: "abandono_checkout_estimado", label: "Abandono checkout", formatter: formatInteger },
  { key: "clientes_novos", label: "Clientes novos", formatter: formatInteger },
  { key: "clientes_recorrentes", label: "Clientes recorrentes", formatter: formatInteger },
  { key: "investimento_total_mkt", label: "Investimento", formatter: formatCurrency },
  { key: "roas_mkt", label: "ROAS", formatter: formatRoas },
  { key: "taxa_conversao", label: "Conversão", formatter: formatPercent },
];

const CHART_FONT_FAMILY = 'Inter, "Segoe UI", Arial, sans-serif';
const CHART_TEXT_COLOR = "#59615d";
const CHART_GRID_COLOR = "rgba(18, 55, 47, 0.07)";
const LAUNCH_CHART_CANVAS_IDS = new Set([
  "launchCurveChart",
  "launchDailyChart",
  "launchItemsCurveChart",
  "launchMultiplierChart",
  "launchMixChart",
  "launchWeeklyRevenueChart",
]);
const LAUNCH_PALETTE = {
  gt: { line: "#b98d43", fill: "rgba(185, 141, 67, 0.08)" },
  gtcollection: { line: "#b98d43", fill: "rgba(185, 141, 67, 0.08)" },
  avant: { line: "#1e5a49", fill: "rgba(30, 90, 73, 0.08)" },
  phantom: { line: "#a3483f", fill: "rgba(163, 72, 63, 0.08)" },
  monochrome: { line: "#16463a", fill: "rgba(22, 70, 58, 0.08)" },
};
const LAUNCH_MODEL_COLOR_PALETTE = [
  "#16463a",
  "#b98d43",
  "#a3483f",
  "#1e5a49",
  "#12372f",
  "#8b6424",
];
const CHART_FALLBACK_COLORS = ["#1e5a49", "#b98d43", "#a3483f", "#16463a", "#12372f", "#8b6424"];

const LAUNCH_MODEL_ALIAS_TERMS = {
  monochrome: [
    "RS8 Avant Monochrome",
    "RS8Avant Monochrome",
    "RS8AvantMonochrome",
    "RS8 Avant Mono",
    "RS8Avant Mono",
    "RS8AvantMono",
  ],
};

const LAUNCH_MODEL_PATTERNS = [
  {
    pattern:
      /\bmonochrome\b|\brs\s*8\s*monochrome\b|\brs8monochrome\b|\brs\s*8\s*avant\s*monochrome\b|\brs8avantmonochrome\b|\brs\s*8\s*avant\s*mono\b|\brs8avantmono\b/,
    name: "Monochrome",
  },
  { pattern: /\bavant\b|\brs\s*[678]\s*avant\b|\brs[678]avant\b/, name: "Avant" },
  { pattern: /\bgt\b|\brs\s*[67]\s*gt\b|\brs[67]gt\b|\bknit\s*gt\b|\bknitgt\b|\b911\s*gt\b|\b911gt\b/, name: "GT" },
  { pattern: /\bphantom\b|\bphantom\s*(slip|easy|knit)\b|\bphantom(slip|easy|knit)\b/, name: "Phantom" },
  { pattern: /\brs\s*8\s*avant\b|\brs8avant\b/, name: "RS8 Avant" },
  { pattern: /\brs\s*7\s*avant\b|\brs7avant\b/, name: "RS7 Avant" },
  { pattern: /\brs\s*6\s*avant\b|\brs6avant\b/, name: "RS6 Avant" },
  { pattern: /\brs\s*6\s*gt\b|\brs6gt\b/, name: "RS6 GT" },
  { pattern: /\brs\s*7\s*gt\b|\brs7gt\b/, name: "RS7 GT" },
  { pattern: /\bknit\s*gt\b|\bknitgt\b/, name: "KNIT GT" },
  { pattern: /\b911\s*gt\b|\b911gt\b/, name: "911 GT" },
  { pattern: /\brs\s*8\b|\brs8\b/, name: "RS8" },
  { pattern: /\brs\s*7\b|\brs7\b/, name: "RS7" },
  { pattern: /\brs\s*6\b|\brs6\b/, name: "RS6" },
  { pattern: /\bphantom\s*slip\b|\bphantomslip\b/, name: "Phantom Slip" },
  { pattern: /\bphantom\s*easy\b|\bphantomeasy\b/, name: "Phantom Easy" },
  { pattern: /\bphantom\s*knit\b|\bphantomknit\b/, name: "Phantom Knit" },
  { pattern: /\bphantom\b/, name: "Phantom" },
  { pattern: /\bmacan\b/, name: "Macan I" },
  { pattern: /\brsx\b|\btn\s*rsx\b/, name: "RSX" },
  { pattern: /\bdenver\b/, name: "Denver" },
  { pattern: /\bmunich\b/, name: "Munich" },
  { pattern: /\bmanhattan\b/, name: "Manhattan" },
  { pattern: /\bessential\b/, name: "Essential" },
  { pattern: /\bzurich\b/, name: "Zurich" },
];

const LAUNCH_SHOE_MODEL_FAMILIES = new Set(["monochrome", "avant", "gt", "phantom"]);

const LAUNCH_TOPIC_RULES = [
  {
    label: "Tenis",
    pattern:
      /\b(tenis|sneaker|sapatenis|rs8|rs7|rs6|rsx|phantom|macan|munich|manhattan|denver|zurich|knit|911|monochrome)\b/,
  },
  { label: "Camisas", pattern: /\b(camisa|camiseta|polo|t\s*shirt|tshirt|tee)\b/ },
  { label: "Calcas", pattern: /\b(calca|calcas|pants|jeans|jogger)\b/ },
  { label: "Mochilas", pattern: /\b(mochila|backpack|bag)\b/ },
  { label: "Bermudas", pattern: /\b(bermuda|short|shorts)\b/ },
  { label: "Jaquetas", pattern: /\b(jaqueta|jacket|casaco|moletom|hoodie|sweatshirt)\b/ },
  { label: "Acessorios", pattern: /\b(bone|cap|meia|sock|cinto|carteira|necessaire|mala|acessorio|acessorios)\b/ },
];

const LAUNCH_COLOR_CODES = {
  AB: "All Black",
  AW: "All White",
  B: "Branco",
  C: "Cinza",
  CF: "Marrom",
  CT: "Caqui",
  M: "Marrom",
  MAR: "Marrom",
  MC: "Cinza",
  MR: "Marinho",
  O: "Oliva",
  OW: "Off White",
  P: "Preto",
  PTO: "Preto",
};

const LAUNCH_COLOR_WORDS = [
  "All Black",
  "All White",
  "Azul Marinho",
  "Branco",
  "Camurca",
  "Caqui",
  "Caramelo",
  "Cinza",
  "Marinho",
  "Marrom Oliva",
  "Marrom",
  "Nude",
  "Off White",
  "Oliva",
  "Preto",
  "Prata",
  "Verde oliva",
];

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const state = {
  data: {},
  indexes: {},
  year: 2026,
  month: 0,
  compareMode: "none",
  compareMonth: 0,
  compareYear: 2025,
  periodType: "fullCurrentMonth",
  freePeriodStart: "",
  freePeriodEnd: "",
  freeCompareStart: "",
  freeCompareEnd: "",
  selectedDate: null,
  selectionStart: null,
  selectionEnd: null,
  dragStart: null,
  isDragging: false,
  wasDragging: false,
  analysisActivated: false,
  openMenu: null,
  editingManualEventId: null,
  deletedManualEventIds: [],
  charts: {},
  missing: [],
  apiAvailable: false,
  backendStatus: null,
  isRefreshingNow: false,
  isSavingManualEvent: false,
  deletingManualEventId: null,
  loadedAt: null,
  lastEventApiError: "",
  activeView: "calendar",
  launch: {
    eventId: "",
    productKeys: [],
    productTopic: "",
    launchDate: "",
    windowDays: 90,
  },
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  state.activeView = resolveInitialView();
  bindControls();
  configureChartDefaults();
  await loadData();
  buildIndexes();
  populateSelectors();
  await refreshBackendStatus(true);
  window.setInterval(() => refreshBackendStatus(true), 60000);
  renderDashboard();
}

function resolveInitialView() {
  return window.location.hash === "#lancamentos" || window.location.hash === "#launches"
    ? "launches"
    : "calendar";
}

function bindControls() {
  document.querySelectorAll("[data-view-tab]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.viewTab));
  });
  document.getElementById("prevMonthButton").addEventListener("click", () => shiftMonth(-1));
  document.getElementById("nextMonthButton").addEventListener("click", () => shiftMonth(1));
  document.getElementById("todayButton").addEventListener("click", goToToday);
  document.getElementById("clearSelectionButton").addEventListener("click", clearSelection);
  document.getElementById("refreshNowButton").addEventListener("click", refreshNow);
  document.getElementById("periodMenuButton").addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu("period");
  });
  document.getElementById("comparisonMenuButton").addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu("comparison");
  });
  document.getElementById("manualEventsMenuButton").addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu("manual");
  });
  document.getElementById("closeManualEventsButton").addEventListener("click", closeMenus);
  document.querySelector('[data-menu-root="manual"]').addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeMenus();
  });

  document.getElementById("yearSelect").addEventListener("change", (event) => {
    state.year = Number(event.target.value);
    clearSelection(false);
    renderDashboard();
  });

  document.getElementById("monthSelect").addEventListener("change", (event) => {
    state.month = Number(event.target.value);
    clearSelection(false);
    renderDashboard();
  });

  document.getElementById("compareYearSelect").addEventListener("change", (event) => {
    state.compareYear = Number(event.target.value);
    state.analysisActivated = true;
    updateControlVisibility();
  });

  ["freePeriodStart", "freePeriodEnd", "freeCompareStart", "freeCompareEnd"].forEach((id) => {
    document.getElementById(id).addEventListener("change", (event) => {
      state[id] = event.target.value;
      state.analysisActivated = true;
      updateControlVisibility();
    });
  });

  document.querySelectorAll("[data-period-option]").forEach((button) => {
    button.addEventListener("click", () => applyPeriodOption(button.dataset.periodOption));
  });

  document.querySelectorAll("[data-compare-option]").forEach((button) => {
    button.addEventListener("click", () => applyComparisonOption(button.dataset.compareOption));
  });

  document.getElementById("applyFreePeriodButton").addEventListener("click", applyFreePeriod);
  document.getElementById("applyCompareYearButton").addEventListener("click", applyCompareYear);
  document.getElementById("applyFreeCompareButton").addEventListener("click", applyFreeCompare);

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".menu-root")) closeMenus();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenus();
  });
  window.addEventListener("hashchange", () => {
    state.activeView = resolveInitialView();
    updateActiveView();
    if (state.activeView === "launches") {
      populateLaunchControls();
      renderLaunchWorkbench();
    }
  });

  document.addEventListener("mouseup", () => {
    if (!state.isDragging) return;
    state.isDragging = false;
    state.dragStart = null;
    if (state.wasDragging || state.periodType !== "selectedPeriod") {
      syncPeriodTypeFromSelection();
    }
    renderDashboard();
  });

  document.querySelectorAll("[data-filter]").forEach((input) => {
    input.addEventListener("change", () => {
      renderCalendar();
      renderSelectedDetail();
      renderSummaryFluctuation();
    });
  });

  document.getElementById("addManualEventButton").addEventListener("click", () => {
    const form = document.getElementById("manualEventForm");
    if (!form.hidden && !state.editingManualEventId) {
      form.hidden = true;
      return;
    }
    resetManualEventForm();
    form.hidden = false;
    const today = toDateKey(state.year, state.month + 1, Math.min(new Date().getDate(), 28));
    document.getElementById("manualStartDate").value = today;
    document.getElementById("manualEndDate").value = today;
    document.getElementById("manualTitle").focus();
  });

  document.getElementById("cancelManualEventButton").addEventListener("click", () => {
    resetManualEventForm();
    document.getElementById("manualEventForm").hidden = true;
  });

  document.getElementById("manualEventForm").addEventListener("submit", saveManualEventFromForm);
  document.getElementById("exportManualEventsButton").addEventListener("click", exportManualEvents);
  document.getElementById("importManualEventsInput").addEventListener("change", importManualEvents);
  document.getElementById("manualEventsList").addEventListener("click", handleManualEventsListClick);
  document.getElementById("launchEventSelect").addEventListener("change", handleLaunchEventChange);
  document.getElementById("launchWindowSelect").addEventListener("change", (event) => {
    state.launch.windowDays = Number(event.target.value || 90);
    renderLaunchWorkbench();
  });
  document.getElementById("launchProductTopicSelect").addEventListener("change", handleLaunchProductTopicChange);
  document.getElementById("launchProductSelect").addEventListener("change", handleLaunchProductSelectChange);
  document.getElementById("launchSelectedProductsSummary").addEventListener("click", handleLaunchSelectedProductsClick);
  document.getElementById("launchSelectTopProductsButton").addEventListener("click", () => {
    const products = collectLaunchProducts();
    const topic = resolveLaunchProductTopic(products);
    const visibleProducts = getLaunchProductsByTopic(products, topic);
    state.launch.productKeys = visibleProducts.slice(0, 3).map((product) => product.key);
    renderLaunchProductPicker(products);
    renderLaunchWorkbench();
  });
  document.getElementById("launchClearProductsButton").addEventListener("click", () => {
    state.launch.productKeys = [];
    renderLaunchProductPicker(collectLaunchProducts());
    renderLaunchWorkbench();
  });
  document.getElementById("openLaunchItemsDrawerButton").addEventListener("click", openLaunchItemsDrawer);
  document.getElementById("closeLaunchItemsDrawerButton").addEventListener("click", closeLaunchItemsDrawer);
  document.getElementById("launchItemsDrawerBackdrop").addEventListener("click", closeLaunchItemsDrawer);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLaunchItemsDrawer();
  });
}

function switchView(view) {
  state.activeView = view === "launches" ? "launches" : "calendar";
  if (window.location.hash !== (state.activeView === "launches" ? "#lancamentos" : "")) {
    history.replaceState(null, "", state.activeView === "launches" ? "#lancamentos" : window.location.pathname + window.location.search);
  }
  updateActiveView();
  if (state.activeView === "launches") {
    populateLaunchControls();
    renderLaunchWorkbench();
  }
}

function updateActiveView() {
  const isLaunches = state.activeView === "launches";
  const calendar = document.getElementById("calendarWorkspace");
  const launches = document.getElementById("launchWorkbench");
  if (calendar) calendar.hidden = isLaunches;
  if (launches) launches.hidden = !isLaunches;

  document.querySelectorAll("[data-view-tab]").forEach((button) => {
    const active = button.dataset.viewTab === state.activeView;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function resolveApiBase() {
  const location = window.location;
  const params = new URLSearchParams(location.search);

  if (params.get("api") === "prod") return PRODUCTION_API_BASE;
  if (location.protocol === "file:") return PRODUCTION_API_BASE;
  return "";
}

function toggleMenu(menuName) {
  const shouldOpen = state.openMenu !== menuName;
  closeMenus();
  if (!shouldOpen) return;

  const root = document.querySelector(`[data-menu-root="${menuName}"]`);
  if (!root) return;
  const menu = root.querySelector(".floating-menu");
  const button = root.querySelector(".menu-trigger");
  state.openMenu = menuName;
  root.classList.add("is-open");
  menu.hidden = false;
  button.setAttribute("aria-expanded", "true");
  if (menuName === "manual") renderManualEventsList();
  updateControlVisibility();
}

function closeMenus() {
  document.querySelectorAll("[data-menu-root]").forEach((root) => {
    const menu = root.querySelector(".floating-menu");
    const button = root.querySelector(".menu-trigger");
    root.classList.remove("is-open");
    if (menu) menu.hidden = true;
    if (button) button.setAttribute("aria-expanded", "false");
  });
  state.openMenu = null;
}

function applyPeriodOption(periodType) {
  state.periodType = periodType;
  state.analysisActivated = true;
  updateControlVisibility();
  if (periodType === "freePeriod") {
    document.getElementById("freePeriodStart").focus();
    return;
  }
  closeMenus();
  renderDashboard();
}

function applyFreePeriod() {
  state.periodType = "freePeriod";
  state.freePeriodStart = document.getElementById("freePeriodStart").value;
  state.freePeriodEnd = document.getElementById("freePeriodEnd").value;
  state.analysisActivated = true;
  closeMenus();
  renderDashboard();
}

function applyComparisonOption(compareMode) {
  state.compareMode = compareMode;
  state.analysisActivated = true;
  updateControlVisibility();
  if (compareMode === "manualYear") {
    document.getElementById("compareYearSelect").focus();
    return;
  }
  if (compareMode === "freeDate") {
    document.getElementById("freeCompareStart").focus();
    return;
  }
  closeMenus();
  renderDashboard();
}

function applyCompareYear() {
  state.compareMode = "manualYear";
  state.compareYear = Number(document.getElementById("compareYearSelect").value);
  state.analysisActivated = true;
  closeMenus();
  renderDashboard();
}

function applyFreeCompare() {
  state.compareMode = "freeDate";
  state.freeCompareStart = document.getElementById("freeCompareStart").value;
  state.freeCompareEnd = document.getElementById("freeCompareEnd").value;
  state.analysisActivated = true;
  closeMenus();
  renderDashboard();
}

function shiftMonth(delta) {
  const next = new Date(state.year, state.month + delta, 1);
  state.year = next.getFullYear();
  state.month = next.getMonth();
  clearSelection(false);
  ensureYearOption(state.year);
  renderDashboard();
}

function goToToday() {
  const today = new Date();
  state.year = today.getFullYear();
  state.month = today.getMonth();
  ensureYearOption(state.year);
  setSingleDateSelection(toDateKey(state.year, state.month + 1, today.getDate()));
  renderDashboard();
}

function clearSelection(shouldRender = true) {
  state.selectedDate = null;
  state.selectionStart = null;
  state.selectionEnd = null;
  state.dragStart = null;
  state.isDragging = false;
  state.analysisActivated = false;
  state.periodType = "fullCurrentMonth";
  if (shouldRender) renderDashboard();
}

function applyControlState() {
  state.analysisActivated = true;
  state.compareYear = Number(document.getElementById("compareYearSelect").value);
  state.freePeriodStart = document.getElementById("freePeriodStart").value;
  state.freePeriodEnd = document.getElementById("freePeriodEnd").value;
  state.freeCompareStart = document.getElementById("freeCompareStart").value;
  state.freeCompareEnd = document.getElementById("freeCompareEnd").value;
  updateControlVisibility();
  ensureYearOption(state.year);
  renderDashboard();
}

async function loadData() {
  state.missing = [];
  const apiPayload = await loadDataFromApi();
  if (apiPayload) {
    state.apiAvailable = true;
    state.data = normalizeCalendarPayload(apiPayload);
    state.deletedManualEventIds = [];
    state.backendStatus = {
      ...(state.backendStatus || {}),
      updated_at: apiPayload.atualizado_em || state.backendStatus?.updated_at,
    };
    state.loadedAt = apiPayload.atualizado_em || state.loadedAt;
    renderDataStatus();
    renderBackendStatus();
    return;
  }

  state.apiAvailable = false;
  const entries = await Promise.all(
    Object.entries(DATA_FILES).map(async ([key, config]) => {
      try {
        const path = config.path;
        const response = await fetch(path, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const text = await response.text();
        return [key, JSON.parse(text || "[]")];
      } catch (error) {
        if (!config.optional) {
          state.missing.push(`${config.path}`);
        }
        return [key, []];
      }
    })
  );

  state.data = normalizeCalendarPayload(Object.fromEntries(entries));
  state.loadedAt = state.data.manifest?.generated_at || new Date().toISOString();
  state.deletedManualEventIds = loadDeletedManualEventIds();
  state.data.eventosManuais = normalizeManualEventsList(
    mergeManualEvents(state.data.eventosManuais || [], loadManualEventsFromStorage()).filter(
      (event) => !state.deletedManualEventIds.includes(event.id)
    )
  );
  renderDataStatus();
  renderBackendStatus();
}

async function loadDataFromApi() {
  try {
    const response = await fetch(`${API_BASE}/api/calendar-data`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const events = await loadManualEventsFromApi();
    if (events) payload.eventos_manuais = events;
    return payload;
  } catch (error) {
    return null;
  }
}

async function loadManualEventsFromApi() {
  try {
    const response = await fetch(`${API_BASE}/api/events`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    return null;
  }
}

function normalizeCalendarPayload(payload = {}) {
  const analytics = payload.analytics || null;
  return {
    calendario: payload.calendario || [],
    kpis: payload.kpis || [],
    funil: payload.funil || [],
    produtos: payload.produtos || [],
    lancamentosProdutos: payload.lancamentos_produtos || payload.lancamentosProdutos || [],
    campanhas: payload.campanhas || [],
    utms: payload.utms || [],
    estoque: payload.estoque || [],
    metas: payload.metas || {},
    manifest: payload.manifest || {},
    eventosManuais: normalizeManualEventsList(payload.eventos_manuais || payload.eventosManuais || []),
    lancamentosModelos: normalizeLaunchModelConfigList(payload.lancamentos_modelos || payload.lancamentosModelos || []),
    lancamentosInvestimentos: normalizeLaunchInvestmentList(
      payload.lancamentos_investimentos || payload.lancamentosInvestimentos || []
    ),
    analytics,
    dataQuality: payload.data_quality || payload.dataQuality || analytics?.data_quality || null,
  };
}

function normalizeManualEventsList(events = []) {
  return (Array.isArray(events) ? events : [])
    .filter(isActiveManualEvent)
    .map((event) => ({
      ...event,
      id: event.id || event.event_id || buildManualEventId(event),
      event_id: event.event_id || event.id || buildManualEventId(event),
    }));
}

function normalizeLaunchModelConfigList(rows = []) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => String(row.status || "Ativo").toLowerCase() !== "excluido")
    .map((row) => {
      const modelName = cleanLaunchText(row.modelo || row.model || row.nome_modelo || row.nome || row.linha || "");
      const modelId = cleanLaunchText(row.modelo_id || row.model_id || modelName);
      const officialLaunchDate = normalizeDateKey(row.data_oficial || row.lancamento_oficial || row.official_launch_date || "");
      const dayZeroBase = normalizeDateKey(row.day_zero_base || row.data_base || row.data_lancamento_base || "");
      const launchDate = dayZeroBase || normalizeDateKey(row.data_lancamento || row.launch_date || row.data_inicio || row.data);
      const searchTerms = [
        modelName,
        row.linha,
        row.termos_busca,
        row.sku_prefixos,
        row.sku_prefix,
        row.product_key,
      ]
        .flatMap((value) => splitLaunchTerms(value || ""))
        .concat(launchModelAliasTerms(modelName))
        .concat(launchModelAliasTerms(modelId))
        .filter(Boolean);
      return {
        ...row,
        modelo_id: modelId,
        modelo: modelName,
        model_key: slug(modelId || modelName),
        data_lancamento: launchDate,
        data_oficial: officialLaunchDate,
        day_zero_base: dayZeroBase || launchDate,
        linha: cleanLaunchText(row.linha || ""),
        topico: cleanLaunchText(row.topico || row.categoria || row.tipo || ""),
        termos_busca: [...new Set(searchTerms)],
        confiabilidade: cleanLaunchText(row.confiabilidade || row.reliability || ""),
        status: cleanLaunchText(row.status || "Ativo"),
        observacao: cleanLaunchText(row.observacao || row.obs || ""),
      };
    })
    .filter((row) => row.modelo && row.model_key);
}

function normalizeLaunchInvestmentList(rows = []) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => String(row.status || "Ativo").toLowerCase() !== "excluido")
    .map((row) => {
      const modelName = cleanLaunchText(row.modelo || row.model || row.nome_modelo || row.nome || "");
      const modelId = cleanLaunchText(row.modelo_id || row.model_id || modelName);
      const launchDate = normalizeDateKey(row.data_lancamento || row.launch_date || row.data);
      return {
        ...row,
        modelo_id: modelId,
        modelo: modelName,
        model_key: slug(modelId || modelName),
        data_lancamento: launchDate,
        data_inicio: normalizeDateKey(row.data_inicio || row.start_date || row.data || launchDate),
        data_fim: normalizeDateKey(row.data_fim || row.end_date || row.data_inicio || row.data || launchDate),
        janela: cleanLaunchText(row.janela || row.window || ""),
        canal: cleanLaunchText(row.canal || row.channel || "Planejado"),
        investimento_planejado: parseLaunchNumber(row.investimento_planejado),
        investimento_real: parseLaunchNumber(row.investimento_real || row.investimento),
        receita_planejada: parseLaunchNumber(row.receita_planejada || row.receita_meta),
        receita_real: parseLaunchNumber(row.receita_real || row.receita),
        pedidos_planejados: parseLaunchNumber(row.pedidos_planejados || row.pedidos_meta),
        pedidos_reais: parseLaunchNumber(row.pedidos_reais || row.pedidos),
        status: cleanLaunchText(row.status || "Ativo"),
        observacao: cleanLaunchText(row.observacao || row.obs || ""),
      };
    })
    .filter((row) => row.modelo && row.model_key);
}

function isActiveManualEvent(event = {}) {
  const status = slug(event.status || "");
  return status !== "excluido" && !event.deleted_at;
}

function renderDataStatus() {
  const status = document.getElementById("dataStatus");
  if (state.apiAvailable) {
    status.textContent = "API compartilhada conectada. Eventos manuais e dados vêm do backend central.";
    return;
  }
  if (!state.missing.length) {
    status.textContent =
      "API não disponível. Dashboard em modo local com JSONs e localStorage como fallback temporário.";
    return;
  }

  status.textContent =
    `Alguns JSONs não foram carregados (${state.missing.join(", ")}). Confirme que o servidor foi iniciado dentro da pasta calendario-reise.`;
}

async function refreshBackendStatus(silent = false) {
  const previousLoadedAt = state.loadedAt;
  try {
    const response = await fetch(`${API_BASE}/api/status`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.backendStatus = await response.json();
    state.apiAvailable = true;
    if (
      previousLoadedAt &&
      state.backendStatus.updated_at &&
      state.backendStatus.updated_at !== previousLoadedAt &&
      !state.isRefreshingNow
    ) {
      await loadData();
      buildIndexes();
      populateSelectorsPreservingSelection();
      renderDashboard();
    }
  } catch (error) {
    if (!silent) {
      state.backendStatus = {
        updated_at: null,
        next_update_at: null,
        is_refreshing: false,
        source_status: { error: "API indisponível" },
      };
    }
    state.apiAvailable = false;
  }
  renderBackendStatus();
}

function renderBackendStatus() {
  const pill = document.getElementById("backendStatusPill");
  const text = document.getElementById("backendStatusText");
  const lastUpdate = document.getElementById("lastUpdateText");
  const nextUpdate = document.getElementById("nextUpdateText");
  const button = document.getElementById("refreshNowButton");
  if (!pill || !text || !lastUpdate || !nextUpdate || !button) return;

  const status = state.backendStatus || {};
  const sourceStatus = status.source_status || {};
  const isRefreshing = Boolean(status.is_refreshing || state.isRefreshingNow);
  const isScheduled = sourceStatus.refresh_loop_enabled !== false;
  pill.textContent = state.apiAvailable ? "API compartilhada" : "Modo local";
  text.textContent = state.apiAvailable
    ? isRefreshing
      ? "Atualizando dados..."
      : isScheduled
        ? "Dados sincronizados"
        : "Dados prontos sob demanda"
    : "API indisponível; usando fallback local";
  lastUpdate.textContent = formatBackendDateTime(status.updated_at);
  nextUpdate.textContent = isScheduled ? formatBackendDateTime(status.next_update_at) : "Sob demanda";
  button.disabled = !state.apiAvailable || isRefreshing;
  button.textContent = isRefreshing ? "Atualizando..." : "Atualizar agora";
}

async function refreshNow() {
  if (state.isRefreshingNow) return;
  state.isRefreshingNow = true;
  renderBackendStatus();
  try {
    const response = await fetch(`${API_BASE}/api/refresh`, { method: "POST" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      setDataStatusMessage(payload.message || "Não foi possível atualizar agora.");
      await refreshBackendStatus(true);
      return;
    }
    await loadData();
    buildIndexes();
    populateSelectorsPreservingSelection();
    renderDashboard();
    setDataStatusMessage("Dados atualizados pelo backend central.");
  } catch (error) {
    state.apiAvailable = false;
    setDataStatusMessage("API indisponível. Não foi possível atualizar agora.");
  } finally {
    state.isRefreshingNow = false;
    await refreshBackendStatus(true);
    renderBackendStatus();
  }
}

function setDataStatusMessage(message) {
  const status = document.getElementById("dataStatus");
  if (status) status.textContent = message;
}

function populateSelectorsPreservingSelection() {
  const currentYear = state.year;
  const currentMonth = state.month;
  const currentCompareYear = state.compareYear;
  populateSelectors();
  state.year = currentYear;
  state.month = currentMonth;
  state.compareYear = currentCompareYear;
  ensureYearOption(state.year);
  ensureYearOption(state.compareYear, document.getElementById("compareYearSelect"));
  document.getElementById("yearSelect").value = String(state.year);
  document.getElementById("monthSelect").value = String(state.month);
  document.getElementById("compareYearSelect").value = String(state.compareYear);
  updateControlVisibility();
}

function buildIndexes() {
  state.indexes.kpis = indexByDate(state.data.kpis);
  state.indexes.funil = indexByDate(state.data.funil);
  state.indexes.produtos = groupByDate(state.data.produtos);
  state.indexes.lancamentosProdutos = groupByDate(state.data.lancamentosProdutos || []);
  state.indexes.campanhas = groupByDate(state.data.campanhas);
  state.indexes.utms = groupByDate(state.data.utms);
  state.indexes.estoque = indexBySku(state.data.estoque);
  state.indexes.manualEvents = normalizeManualEventsList(state.data.eventosManuais || []);
  state.data.eventosManuais = state.indexes.manualEvents;
}

function populateSelectors() {
  const yearSelect = document.getElementById("yearSelect");
  const monthSelect = document.getElementById("monthSelect");
  const compareYearSelect = document.getElementById("compareYearSelect");
  const years = collectYears();
  const today = new Date();
  const fallbackYear = years.includes(today.getFullYear())
    ? today.getFullYear()
    : years[years.length - 1] || 2026;

  state.year = fallbackYear;
  state.month = state.year === today.getFullYear() ? today.getMonth() : 0;
  state.compareYear = state.year - 1;

  yearSelect.innerHTML = years
    .map((year) => `<option value="${year}">${year}</option>`)
    .join("");
  yearSelect.value = String(state.year);

  monthSelect.innerHTML = MONTH_NAMES.map(
    (month, index) => `<option value="${index}">${month}</option>`
  ).join("");
  monthSelect.value = String(state.month);

  compareYearSelect.innerHTML = years
    .map((year) => `<option value="${year}">${year}</option>`)
    .join("");
  ensureYearOption(state.compareYear, compareYearSelect);
  compareYearSelect.value = String(state.compareYear);

  updateControlVisibility();
}

function collectYears() {
  const years = new Set([2024, 2025, 2026]);
  [
    ...(state.data.calendario || []),
    ...(state.data.kpis || []),
    ...(state.data.eventosManuais || []),
  ].forEach((item) => {
    const year = Number(
      item.ano || String(item.data || item.data_inicio || item.data_fim || "").slice(0, 4)
    );
    if (year) years.add(year);
  });
  return [...years].sort((a, b) => a - b);
}

function ensureYearOption(year, select = document.getElementById("yearSelect")) {
  if (![...select.options].some((option) => Number(option.value) === year)) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    select.appendChild(option);
    [...select.options]
      .sort((a, b) => Number(a.value) - Number(b.value))
      .forEach((option) => select.appendChild(option));
  }
}

function renderDashboard() {
  ensureYearOption(state.year);
  ensureYearOption(state.compareYear, document.getElementById("compareYearSelect"));
  document.getElementById("yearSelect").value = String(state.year);
  document.getElementById("monthSelect").value = String(state.month);
  document.getElementById("compareYearSelect").value = String(state.compareYear);
  document.getElementById("freePeriodStart").value = state.freePeriodStart;
  document.getElementById("freePeriodEnd").value = state.freePeriodEnd;
  document.getElementById("freeCompareStart").value = state.freeCompareStart;
  document.getElementById("freeCompareEnd").value = state.freeCompareEnd;
  updateActiveView();
  updateControlVisibility();
  updateComparisonStateClass();
  populateLaunchControls();
  renderCalendar();
  renderSummary();
  renderSummaryFluctuation();
  renderExecutiveIntelligence();
  renderCharts();
  renderTables();
  renderSelectedDetail();
  renderManualEventsList();
  if (state.activeView === "launches") renderLaunchWorkbench();
}

function updateComparisonStateClass() {
  const shell = document.querySelector(".page-shell");
  const context = buildComparisonContextForPeriod(resolveActivePeriod());
  const isActive = Boolean(context && state.compareMode !== "none");
  shell.classList.toggle("is-comparison-active", isActive);
  shell.classList.toggle("is-no-comparison", !isActive);
}

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const title = document.getElementById("monthTitle");
  const insight = document.getElementById("monthInsight");
  const daysInMonth = new Date(state.year, state.month + 1, 0).getDate();
  const firstWeekday = new Date(state.year, state.month, 1).getDay();
  const monthDates = getMonthDateKeys();
  const activePeriod = resolveActivePeriod();
  const calendarSelection = getCalendarSelectionPeriod();
  const activeKeys = new Set(calendarSelection.keys);
  const today = new Date();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const monthRevenue = monthDates.reduce((sum, key) => {
    return sum + getKpi(key).receita_total;
  }, 0);
  const monthEvents = monthDates.reduce((sum, key) => sum + getEventsForDate(key).length, 0);

  title.textContent = `${MONTH_NAMES[state.month]} ${state.year}`;
  insight.textContent = `${formatCurrency(monthRevenue)} no mês, com ${monthEvents} marcações comerciais ativas. Período ativo: ${activePeriod.label}.`;

  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(`<div class="day-cell is-empty" aria-hidden="true"></div>`);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = toDateKey(state.year, state.month + 1, day);
    const kpi = getKpi(dateKey);
    const events = getEventsForDate(dateKey);
    const primaryEvent = events[0];
    const isActive = activeKeys.has(dateKey);
    const isSingleActive = calendarSelection.keys.length === 1 && isActive;
    const selected = isSingleActive ? " is-selected" : "";
    const todayClass = dateKey === todayKey ? " is-today" : "";
    const rangeClass = isActive && calendarSelection.keys.length > 1 ? " is-in-range" : "";
    const startClass = dateKey === calendarSelection.start && calendarSelection.keys.length > 1 ? " is-range-start" : "";
    const endClass = dateKey === calendarSelection.end && calendarSelection.keys.length > 1 ? " is-range-end" : "";
    const markers = [...new Set(events.map((event) => event.tipo_evento))]
      .map((type) => `<span class="event-dot event-${slug(type)}" title="${type}"></span>`)
      .join("");

    cells.push(`
      <button class="day-cell${selected}${todayClass}${rangeClass}${startClass}${endClass}" type="button" data-date="${dateKey}" aria-label="${formatDateLong(dateKey)}">
        <span class="day-head">
          <span class="day-number">${day}</span>
          <span class="event-markers">${markers}</span>
        </span>
        <span class="event-name">${primaryEvent ? primaryEvent.nome_evento : ""}</span>
        <span class="day-metrics">
          <span>Receita <strong>${formatCompactCurrency(kpi.receita_total)}</strong></span>
          <span>Pedidos <strong>${formatInteger(kpi.pedidos_aprovados)}</strong></span>
        </span>
      </button>
    `);
  }

  grid.innerHTML = cells.join("");
  grid.querySelectorAll("[data-date]").forEach((button) => {
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
      startCalendarSelection(button.dataset.date);
    });
    button.addEventListener("mouseenter", () => updateCalendarSelection(button.dataset.date));
    button.addEventListener("click", () => {
      completeCalendarClick(button.dataset.date);
      renderCalendar();
      renderSelectedDetail();
      renderSummary();
      renderSummaryFluctuation();
      renderCharts();
      renderTables();
    });
  });
}

function startCalendarSelection(dateKey) {
  state.isDragging = true;
  state.wasDragging = false;
  if (
    state.periodType === "selectedPeriod" &&
    state.selectionStart &&
    state.selectionStart === state.selectionEnd &&
    state.selectionStart !== dateKey
  ) {
    state.dragStart = state.selectionStart;
    state.wasDragging = true;
    const [start, end] = sortDateKeys(state.selectionStart, dateKey);
    state.selectionStart = start;
    state.selectionEnd = end;
    state.selectedDate = null;
    return;
  }
  state.dragStart = dateKey;
  state.selectionStart = dateKey;
  state.selectionEnd = dateKey;
  state.selectedDate = dateKey;
}

function updateCalendarSelection(dateKey) {
  if (!state.isDragging || !state.dragStart) return;
  if (dateKey !== state.dragStart) {
    state.wasDragging = true;
  }
  const [start, end] = sortDateKeys(state.dragStart, dateKey);
  state.selectionStart = start;
  state.selectionEnd = end;
  state.selectedDate = start === end ? start : null;
  state.periodType = start === end ? "selectedDay" : "selectedPeriod";
  renderCalendar();
}

function completeCalendarClick(dateKey) {
  if (state.wasDragging) {
    state.wasDragging = false;
    syncPeriodTypeFromSelection();
    return;
  }

  if (
    state.periodType === "selectedPeriod" &&
    state.selectionStart === dateKey &&
    state.selectionEnd === dateKey
  ) {
    return;
  }

  if (state.periodType === "selectedPeriod" && state.selectionStart && state.selectionStart !== dateKey) {
    const [start, end] = sortDateKeys(state.selectionStart, dateKey);
    state.selectionStart = start;
    state.selectionEnd = end;
    state.selectedDate = null;
    return;
  }

  setSingleDateSelection(dateKey);
}

function setSingleDateSelection(dateKey) {
  state.selectedDate = dateKey;
  state.selectionStart = dateKey;
  state.selectionEnd = dateKey;
  state.periodType = "selectedDay";
}

function syncPeriodTypeFromSelection() {
  if (state.selectionStart && state.selectionEnd && state.selectionStart !== state.selectionEnd) {
    state.periodType = "selectedPeriod";
    state.selectedDate = null;
  } else if (state.selectionStart) {
    setSingleDateSelection(state.selectionStart);
  }
}

function renderSelectedDetail() {
  const period = resolveActivePeriod();
  const hasCalendarSelection = Boolean(state.selectedDate || state.selectionStart);
  if (!period.keys.length || (!hasCalendarSelection && !state.analysisActivated)) {
    document.getElementById("detailTitle").textContent = "Selecione uma data";
    document.getElementById("detailSubtitle").textContent =
      "Clique em um dia do calendário para abrir a leitura comercial.";
    document.getElementById("detailContent").innerHTML = "";
    return;
  }

  const metrics = getMetricSummary(period.keys);
  const events = getEventsForPeriod(period.keys);
  const event = events[0] || {};
  const manualEvents = events.filter((item) => item.manual);
  const products = period.keys.flatMap((dateKey) => state.indexes.produtos[dateKey] || []);
  const campaigns = period.keys.flatMap((dateKey) => state.indexes.campanhas[dateKey] || []);
  const utms = period.keys.flatMap((dateKey) => state.indexes.utms[dateKey] || []);
  const topProduct = aggregateProducts(products).find((item) => item.classificacao === "destaque");
  const fallingProduct = aggregateProducts(products).find((item) => item.classificacao === "queda");
  const mainCampaign = aggregateCampaigns(campaigns)[0];
  const mainUtm = aggregateUtms(utms)[0];
  const comparisonContext = buildComparisonContextForPeriod(period, event);
  const isComparisonActive = Boolean(comparisonContext && state.compareMode !== "none");
  const detailRows = isComparisonActive
    ? `
      ${metricRow(period.keys.length === 1 ? "Data" : "Data inicial", formatShortDate(period.start))}
      ${period.keys.length > 1 ? metricRow("Data final", formatShortDate(period.end)) : ""}
      ${metricRow("Período comparado", comparisonContext.baseline.label)}
      ${metricRow("Faturamento", formatCurrency(metrics.receita_total))}
      ${metricRow("Pedidos", formatInteger(metrics.pedidos_aprovados))}
      ${metricRow("Ticket médio", formatCurrency(metrics.ticket_medio))}
      ${metricRow("Conversão", formatPercent(metrics.taxa_conversao))}
      ${metricRow("ROAS", formatRoas(metrics.roas_mkt))}
      ${metricRow("Evento principal", event.nome_evento || "Sem marcação")}
      ${metricRow("Campanha principal", mainCampaign ? mainCampaign.campaign_name : "-")}
      ${metricRow("Produto destaque", topProduct ? topProduct.product_name : "-")}
      ${metricRow("Produto em queda", fallingProduct ? fallingProduct.product_name : "-")}
    `
    : `
      ${metricRow(period.keys.length === 1 ? "Data" : "Data inicial", formatShortDate(period.start))}
      ${period.keys.length > 1 ? metricRow("Data final", formatShortDate(period.end)) : ""}
      ${metricRow("Quantidade de dias", formatInteger(period.keys.length))}
      ${metricRow("Evento principal", event.nome_evento || "Sem marcação")}
      ${metricRow("Tipo do evento", event.tipo_evento || "-")}
      ${metricRow("Faturamento", formatCurrency(metrics.receita_total))}
      ${metricRow("Pedidos", formatInteger(metrics.pedidos_aprovados))}
      ${metricRow("Ticket médio", formatCurrency(metrics.ticket_medio))}
      ${metricRow("Sessões", formatInteger(metrics.sessoes))}
      ${metricRow("Add to cart", formatInteger(metrics.add_to_cart))}
      ${metricRow("Begin checkout", formatInteger(metrics.begin_checkout))}
      ${metricRow("Abandono carrinho estimado", formatInteger(metrics.abandono_carrinho_estimado))}
      ${metricRow("Abandono checkout estimado", formatInteger(metrics.abandono_checkout_estimado))}
      ${metricRow("Clientes novos", formatInteger(metrics.clientes_novos))}
      ${metricRow("Clientes recorrentes", formatInteger(metrics.clientes_recorrentes))}
      ${metricRow("Investimento", formatCurrency(metrics.investimento_total_mkt))}
      ${metricRow("ROAS", formatRoas(metrics.roas_mkt))}
      ${metricRow("Conversão", formatPercent(metrics.taxa_conversao))}
      ${metricRow("Campanha principal", mainCampaign ? mainCampaign.campaign_name : "-")}
      ${metricRow("UTM principal", mainUtm ? `${mainUtm.utm_source} / ${mainUtm.utm_campaign}` : "-")}
      ${metricRow("Produto destaque", topProduct ? topProduct.product_name : "-")}
      ${metricRow("Produto em queda", fallingProduct ? fallingProduct.product_name : "-")}
    `;

  document.getElementById("detailTitle").textContent =
    period.keys.length === 1 ? "Data selecionada" : "Período selecionado";
  document.getElementById("detailSubtitle").innerHTML = `
    ${period.label}${period.keys.length > 1 ? `<br>${formatInteger(period.keys.length)} dias` : ""}
  `;

  document.getElementById("detailContent").innerHTML = `
    ${renderAnalysisSummary(period, comparisonContext)}
    <div class="metric-list">
      ${detailRows}
    </div>
    ${renderManualEventsBlock(manualEvents)}
    ${renderComparisonDurationNote(period, comparisonContext)}
    ${renderManualComparisonNote(manualEvents, comparisonContext)}
  `;
}

function renderSummary() {
  const metrics = getMetricSummary(resolveActivePeriod().keys);

  document.getElementById("summaryRevenue").textContent = formatCurrency(metrics.receita_total);
  document.getElementById("summaryOrders").textContent = formatInteger(metrics.pedidos_aprovados);
  document.getElementById("summaryTicket").textContent = formatCurrency(metrics.ticket_medio);
  document.getElementById("summaryConversion").textContent = formatPercent(metrics.taxa_conversao);
  document.getElementById("summaryRoas").textContent = formatRoas(metrics.roas_mkt);
}

function renderExecutiveIntelligence() {
  const panel = document.getElementById("executiveIntelligence");
  const analytics = state.data.analytics;
  const forecast = analytics?.forecast || {};
  if (!panel || !analytics || !forecast.forecast_revenue) {
    if (panel) panel.hidden = true;
    return;
  }

  panel.hidden = false;
  document.getElementById("forecastRevenue").textContent = formatCurrency(forecast.forecast_revenue);
  document.getElementById("forecastMeta").textContent =
    `${forecast.month_label || "-"} · ${formatInteger(forecast.elapsed_days)} de ${formatInteger(forecast.total_days)} dias · ${targetSourceLabel(forecast)} · confiança ${forecast.confidence || "-"}`;
  document.getElementById("forecastCoverage").textContent = formatPercent(Number(forecast.target_coverage || 0));
  document.getElementById("forecastRemaining").textContent = formatCurrency(forecast.remaining_revenue);
  document.getElementById("forecastCutoff").textContent =
    analytics.data_cutoff ? `Dados até ${formatShortDate(analytics.data_cutoff)} · D-1` : "Dados até D-1";
  document.getElementById("analyticsDiagnostic").textContent = analytics.diagnostic || "";
  renderAutomationHealth(analytics.automation_health || {});
  renderDataQualityHealth(state.data.dataQuality || analytics.data_quality || {});

  const risk = slug(forecast.risk_level || "indefinido");
  const riskLabel = document.getElementById("forecastRisk");
  riskLabel.textContent = capitalize(forecast.risk_level || "-");
  riskLabel.className = `status-chip risk-${risk}`;

  const progress = document.getElementById("forecastProgressBar");
  const coverage = Math.max(0, Math.min(1.25, Number(forecast.target_coverage || 0)));
  progress.style.width = `${Math.max(4, Math.min(100, coverage * 100))}%`;
  progress.style.background = risk === "alto" ? "#9b3e37" : risk === "medio" ? "#8b6424" : "#174637";

  document.getElementById("analyticsSignalsList").innerHTML = renderSignalItems(analytics.signals || []);
  document.getElementById("upcomingEventsList").innerHTML = renderUpcomingEventItems(analytics.upcoming_events || []);
  document.getElementById("recommendationsList").innerHTML = renderRecommendationItems(analytics.recommendations || []);
  renderLaunchAnalysis(analytics.launch_analysis || []);
  const readinessList = document.getElementById("readinessPlaybookList");
  if (readinessList) {
    readinessList.innerHTML = renderReadinessPlaybookItems(analytics.readiness_playbook || []);
  }
  const actionPlanList = document.getElementById("actionPlanList");
  if (actionPlanList) {
    actionPlanList.innerHTML = renderActionPlanItems(analytics.action_plan || []);
  }
}

function renderAutomationHealth(health = {}) {
  const target = document.getElementById("automationHealth");
  if (!target) return;
  if (!Object.keys(health).length) {
    target.hidden = true;
    return;
  }
  target.hidden = false;
  target.className = `automation-health automation-${slug(health.status || "atencao")}`;
  target.innerHTML = `
    <div>
      <span>Automacao D-1</span>
      <strong>${escapeHtml(health.label || "-")}</strong>
    </div>
    <div class="automation-health-grid">
      <span>Fim dados: <strong>${formatShortDate(health.data_end)}</strong></span>
      <span>Linhas: <strong>${formatInteger(health.total_rows || 0)}</strong></span>
      <span>Arquivos: <strong>${formatInteger(health.total_files || 0)}</strong></span>
      <span>Modo: <strong>${escapeHtml(health.mode || "-")}</strong></span>
    </div>
  `;
}

function renderDataQualityHealth(quality = {}) {
  const target = document.getElementById("dataQualityHealth");
  if (!target) return;
  if (!quality || !Object.keys(quality).length) {
    target.hidden = true;
    return;
  }

  const alerts = Array.isArray(quality.alerts) ? quality.alerts.slice(0, 3) : [];
  const status = slug(quality.status || "atencao");
  target.hidden = false;
  target.className = `data-quality-health quality-${status}`;
  target.innerHTML = `
    <div class="data-quality-main">
      <span>Qualidade dos dados</span>
      <strong>${escapeHtml(quality.label || "-")}</strong>
      <p>${escapeHtml(quality.summary || "")}</p>
    </div>
    <div class="data-quality-grid">
      <span>Score: <strong>${formatInteger(quality.score || 0)}/100</strong></span>
      <span>D-1 esperado: <strong>${formatShortDate(quality.expected_d1)}</strong></span>
      <span>Fontes OK: <strong>${formatInteger(quality.healthy_sources || 0)}/${formatInteger(quality.total_sources || 0)}</strong></span>
      <span>Linhas: <strong>${formatInteger(quality.total_rows || 0)}</strong></span>
    </div>
    <ul class="data-quality-alerts">
      ${
        alerts.length
          ? alerts
              .map(
                (item) => `
                  <li class="quality-alert-${slug(item.severity || "info")}">
                    <strong>${escapeHtml(item.title || "-")}</strong>
                    <span>${escapeHtml(item.detail || "")}</span>
                  </li>
                `
              )
              .join("")
          : `<li class="quality-alert-ok"><strong>Sem alerta critico</strong><span>As fontes principais passaram nas checagens automaticas.</span></li>`
      }
    </ul>
  `;
}

function targetSourceLabel(forecast = {}) {
  if (forecast.target_source === "oficial") {
    return `meta oficial: ${forecast.target_label || "configurada"}`;
  }
  return "referencia sugerida";
}

function renderSignalItems(signals = []) {
  if (!signals.length) {
    return `<li><strong>Nenhum alerta crítico</strong><span>O período não tem sinal executivo relevante no momento.</span></li>`;
  }
  return signals
    .map(
      (signal) => `
        <li class="signal-${slug(signal.kind || "sinal")}">
          <span class="signal-label">${escapeHtml(signal.kind || "sinal")}</span>
          <strong>${escapeHtml(signal.title || "-")}</strong>
          <span>${escapeHtml(signal.detail || "")}</span>
        </li>
      `
    )
    .join("");
}

function renderUpcomingEventItems(events = []) {
  if (!events.length) {
    return `<li><strong>Sem data crítica</strong><span>Nenhuma sazonalidade relevante nos próximos 90 dias.</span></li>`;
  }
  return events
    .map(
      (event) => `
        <li>
          <strong>${escapeHtml(event.name || "-")}</strong>
          <span>${formatShortDate(event.date)} · faltam ${formatInteger(event.days_until)} dia(s)</span>
          <span>${escapeHtml(event.action || "")}</span>
        </li>
      `
    )
    .join("");
}

function renderRecommendationItems(recommendations = []) {
  if (!recommendations.length) {
    return `<li><strong>Sem recomendação automática</strong><span>Aguardando mais dados para sugerir próximos movimentos.</span></li>`;
  }
  return recommendations
    .map((recommendation) => `<li><span>${escapeHtml(recommendation)}</span></li>`)
    .join("");
}

function renderLaunchAnalysis(items = []) {
  const panel = document.getElementById("launchAnalysisPanel");
  const target = document.getElementById("launchAnalysisList");
  if (!panel || !target) return;
  panel.hidden = false;
  if (!items.length) {
    target.innerHTML = `
      <article class="launch-card launch-empty launch-planejado">
        <div class="launch-card-head">
          <div>
            <span>Aguardando lancamento</span>
            <h4>Nenhum lancamento ativo para comparar</h4>
          </div>
          <strong>configurar</strong>
        </div>
        <p>Crie um evento manual com tipo <strong>Lançamento de produto</strong> para liberar a comparacao.</p>
        <div class="launch-metrics launch-secondary">
          <span>Produto relacionado <strong>SKU, linha ou nome do produto</strong></span>
          <span>Campanha <strong>Nome ou UTM</strong></span>
          <span>Janela <strong>D0 a D+90</strong></span>
        </div>
        <p class="launch-diagnostic">Depois de salvo, este bloco cruza receita, pedidos, ticket, clientes novos, produto, estoque, midia e UTMs contra uma janela anterior comparavel.</p>
        <footer>Abra Campanhas e lançamentos, escolha o tipo Lançamento de produto e preencha Produto relacionado e Campanha relacionada.</footer>
      </article>
    `;
    return;
  }

  target.innerHTML = items.map(renderLaunchCard).join("");
}

function renderLaunchCard(item = {}) {
  const metrics = item.metrics || {};
  const product = item.product || {};
  const media = item.media || {};
  const windows = (item.windows || [])
    .filter((window) => window.available)
    .slice(0, 4)
    .map(
      (window) => `
        <span>
          <small>${escapeHtml(window.label || "-")}</small>
          <strong>${formatCurrency(window.revenue || 0)}</strong>
        </span>
      `
    )
    .join("");

  const status = slug(item.status || "planejado");
  const productName = product.primary_name || item.product_reference || "Produto nao vinculado";
  const mediaRoas = Number(media.roas || 0);
  const revenueLift = metrics.revenue_lift;

  return `
    <article class="launch-card launch-${status}">
      <div class="launch-card-head">
        <div>
          <span>${escapeHtml(item.phase || "lancamento")}</span>
          <h4>${escapeHtml(item.name || "-")}</h4>
        </div>
        <strong>${escapeHtml(item.status || "-")}</strong>
      </div>
      <p>${formatShortDate(item.start_date)} a ${formatShortDate(item.end_date)} · ${escapeHtml(item.owner || "Comercial")}</p>
      <div class="launch-metrics">
        <span>Receita <strong>${formatCurrency(metrics.revenue || 0)}</strong></span>
        <span>Pedidos <strong>${formatInteger(metrics.orders || 0)}</strong></span>
        <span>Ticket <strong>${formatCurrency(metrics.ticket || 0)}</strong></span>
        <span>% novos <strong>${formatPercent(metrics.new_customer_share || 0)}</strong></span>
      </div>
      <div class="launch-metrics launch-secondary">
        <span>Produto <strong>${escapeHtml(productName)}</strong></span>
        <span>Itens <strong>${formatInteger(product.items || 0)}</strong></span>
        <span>Invest. <strong>${formatCurrency(media.investment || 0)}</strong></span>
        <span>ROAS UTM <strong>${mediaRoas ? formatRoas(mediaRoas) : "-"}</strong></span>
      </div>
      <div class="launch-context">
        <span>${revenueLift === null || revenueLift === undefined ? "Sem baseline" : `Vs. baseline ${formatPercent(revenueLift, true)}`}</span>
        ${product.risk_status ? `<span>Estoque: ${escapeHtml(product.risk_status)}</span>` : ""}
        ${media.matched_campaigns || media.matched_utms ? `<span>${formatInteger(media.matched_campaigns || 0)} campanha(s) · ${formatInteger(media.matched_utms || 0)} UTM(s)</span>` : ""}
      </div>
      ${windows ? `<div class="launch-windows">${windows}</div>` : ""}
      <p class="launch-diagnostic">${escapeHtml(item.diagnostic || "")}</p>
      <footer>${escapeHtml(item.next_action || "")}</footer>
    </article>
  `;
}

function handleLaunchEventChange(event) {
  state.launch.eventId = event.target.value;
  const launchEvent = collectLaunchEvents().find((item) => item.id === state.launch.eventId);
  if (launchEvent) {
    const matchedKeys = matchProductKeysForLaunchEvent(launchEvent, collectLaunchProducts());
    if (matchedKeys.length) state.launch.productKeys = matchedKeys;
  }
  populateLaunchControls();
  renderLaunchWorkbench();
}

function populateLaunchControls() {
  const eventSelect = document.getElementById("launchEventSelect");
  const windowSelect = document.getElementById("launchWindowSelect");
  if (!eventSelect || !windowSelect) return;

  const events = collectLaunchEvents();
  const products = collectLaunchProducts();

  if (!state.launch.eventId && events.length) {
    state.launch.eventId = events[0].id;
    state.launch.productKeys = matchProductKeysForLaunchEvent(events[0], products);
  }
  if (!state.launch.productKeys.length && products.length) state.launch.productKeys = [products[0].key];
  resolveLaunchProductTopic(products);

  eventSelect.innerHTML = [
    `<option value="">Sem evento vinculado</option>`,
    ...events.map(
      (item) =>
        `<option value="${escapeHtml(item.id)}">${escapeHtml(item.titulo || item.nome_evento || "Lançamento")} · ${formatShortDate(item.data_inicio || item.data)}</option>`
    ),
  ].join("");
  eventSelect.value = state.launch.eventId || "";

  windowSelect.value = String(state.launch.windowDays || 90);
  renderLaunchProductPicker(products);
}

function renderLaunchProductPicker(products) {
  const topicSelect = document.getElementById("launchProductTopicSelect");
  const productSelect = document.getElementById("launchProductSelect");
  const count = document.getElementById("launchSelectedCount");
  const summary = document.getElementById("launchSelectedProductsSummary");
  if (!topicSelect || !productSelect || !count || !summary) return;

  const selected = products.filter((product) => state.launch.productKeys.includes(product.key));
  const groupedProducts = groupLaunchProductsByTopic(products);
  const activeTopic = resolveLaunchProductTopic(products);
  const topicProducts = getLaunchProductsByTopic(products, activeTopic);

  count.textContent = `${selected.length} selecionado${selected.length === 1 ? "" : "s"}`;
  summary.innerHTML = selected.length
    ? selected
        .slice(0, 6)
        .map(
          (product) =>
            `<button class="launch-selected-chip" type="button" data-selected-product-key="${escapeHtml(product.key)}">${escapeHtml(product.name)} <span aria-hidden="true">x</span></button>`
        )
        .join("")
    : `<span>Nenhum modelo selecionado</span>`;

  topicSelect.innerHTML =
    groupedProducts
      .map(
        ({ topic, items }) =>
          `<option value="${escapeHtml(topic)}">${escapeHtml(topic)} - ${formatInteger(items.length)} modelo${items.length === 1 ? "" : "s"}</option>`
      )
      .join("");
  topicSelect.value = activeTopic || "";
  topicSelect.disabled = !groupedProducts.length;

  productSelect.innerHTML = [
    `<option value="">${topicProducts.length ? "Selecionar modelo de tenis" : "Sem modelos neste tipo"}</option>`,
    ...topicProducts.map((product) => {
      const selectedLabel = state.launch.productKeys.includes(product.key) ? "Selecionado - " : "";
      const label = `${selectedLabel}${product.name} | ${launchProductDateLabel(product)} | ${formatCompactCurrency(product.revenue)}`;
      return `<option value="${escapeHtml(product.key)}">${escapeHtml(label)}</option>`;
    }),
  ].join("");
  productSelect.value = "";
  productSelect.disabled = !topicProducts.length;
}

function resolveLaunchProductTopic(products = []) {
  const groupedProducts = groupLaunchProductsByTopic(products);
  const topics = groupedProducts.map((group) => group.topic);
  if (state.launch.productTopic && topics.includes(state.launch.productTopic)) {
    return state.launch.productTopic;
  }
  const selected = products.find((product) => state.launch.productKeys.includes(product.key));
  state.launch.productTopic = selected?.topic || topics[0] || "";
  return state.launch.productTopic;
}

function getLaunchProductsByTopic(products = [], topic = "") {
  return products.filter((product) => (product.topic || "Outros") === topic);
}

function groupLaunchProductsByTopic(products = []) {
  const groups = new Map();
  products.forEach((product) => {
    const topic = product.topic || "Outros";
    if (!groups.has(topic)) groups.set(topic, []);
    groups.get(topic).push(product);
  });
  const topicOrder = [...LAUNCH_TOPIC_RULES.map((item) => item.label), "Outros"];
  return [...groups.entries()]
    .sort(([topicA], [topicB]) => {
      const indexA = topicOrder.includes(topicA) ? topicOrder.indexOf(topicA) : topicOrder.length;
      const indexB = topicOrder.includes(topicB) ? topicOrder.indexOf(topicB) : topicOrder.length;
      return indexA - indexB || String(topicA).localeCompare(String(topicB));
    })
    .map(([topic, items]) => ({ topic, items }));
}

function handleLaunchProductTopicChange(event) {
  const products = collectLaunchProducts();
  state.launch.productTopic = event.target.value || "";
  const topicKeys = new Set(getLaunchProductsByTopic(products, state.launch.productTopic).map((product) => product.key));
  state.launch.productKeys = state.launch.productKeys.filter((key) => topicKeys.has(key));
  renderLaunchProductPicker(products);
  renderLaunchWorkbench();
}

function handleLaunchProductSelectChange(event) {
  const key = event.target.value;
  if (!key) return;
  const selected = new Set(state.launch.productKeys);
  if (selected.has(key)) {
    selected.delete(key);
  } else {
    selected.add(key);
  }
  state.launch.productKeys = [...selected];
  renderLaunchProductPicker(collectLaunchProducts());
  renderLaunchWorkbench();
}

function handleLaunchSelectedProductsClick(event) {
  const chip = event.target.closest("[data-selected-product-key]");
  if (!chip) return;
  const key = chip.dataset.selectedProductKey;
  state.launch.productKeys = state.launch.productKeys.filter((item) => item !== key);
  renderLaunchProductPicker(collectLaunchProducts());
  renderLaunchWorkbench();
}

function openLaunchItemsDrawer() {
  const drawer = document.getElementById("launchItemsDrawer");
  const backdrop = document.getElementById("launchItemsDrawerBackdrop");
  if (!drawer || !backdrop) return;
  drawer.hidden = false;
  backdrop.hidden = false;
  drawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("launch-items-drawer-open");
  requestAnimationFrame(() => {
    drawer.classList.add("is-open");
    backdrop.classList.add("is-open");
    document.getElementById("closeLaunchItemsDrawerButton")?.focus();
  });
}

function closeLaunchItemsDrawer() {
  const drawer = document.getElementById("launchItemsDrawer");
  const backdrop = document.getElementById("launchItemsDrawerBackdrop");
  if (!drawer || !backdrop || drawer.hidden) return;
  drawer.classList.remove("is-open");
  backdrop.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("launch-items-drawer-open");
  window.setTimeout(() => {
    drawer.hidden = true;
    backdrop.hidden = true;
  }, 160);
}

function renderLaunchWorkbench() {
  const root = document.getElementById("launchWorkbench");
  if (!root || root.hidden) return;
  if (!state.loadedAt) {
    document.getElementById("launchInsight").innerHTML = `
      <strong>Carregando dados de lancamento.</strong>
      <span>A analise aparece assim que a API ou os JSONs locais terminarem de carregar.</span>
    `;
    return;
  }
  const analysis = buildLaunchWorkbenchAnalysis();
  renderLaunchInsight(analysis);
  renderLaunchMethodology(analysis);
  renderLaunchHero(analysis);
  renderLaunchMetricGrid(analysis);
  renderLaunchComparison(analysis);
  renderLaunchProductCards(analysis);
  renderLaunchCurves(analysis);
  renderLaunchAcceleration(analysis);
  renderLaunchSeasonality(analysis);
  renderLaunchChannelBreakdown(analysis);
  renderLaunchWindowMatrix(analysis);
  renderLaunchProjection(analysis);
  renderLaunchWindowCards(analysis);
  renderLaunchProductTable(analysis);
  renderLaunchMediaGrid(analysis);
}

function buildLaunchWorkbenchAnalysis() {
  const products = collectLaunchProducts();
  const selectedProducts = products.filter((product) => state.launch.productKeys.includes(product.key));
  const launchEvent = collectLaunchEvents().find((event) => event.id === state.launch.eventId) || null;
  const windowDays = Number(state.launch.windowDays || 90);
  const cutoff = getDataCutoffKey();
  const fallbackLaunchDate = launchEvent?.data_inicio || state.launch.launchDate || cutoff || currentDateKey();
  const comparisonProducts = resolveLaunchComparisonProducts(products, selectedProducts);
  const productWindows = buildLaunchProductWindows(selectedProducts, windowDays, cutoff, fallbackLaunchDate);
  const comparisonWindows = buildLaunchProductWindows(comparisonProducts, windowDays, cutoff, fallbackLaunchDate);
  const benchmarkProducts = products.filter((product) => product.config || product.launchDate || state.launch.productKeys.includes(product.key));
  const benchmarkWindows = buildLaunchProductWindows(benchmarkProducts, 90, cutoff, fallbackLaunchDate);
  const launchDate = productWindows[0]?.launchDate || fallbackLaunchDate;
  const plannedEnd = maxDateKey(productWindows.map((item) => item.plannedEnd)) || addDays(launchDate, windowDays - 1);
  const actualEnd = maxDateKey(productWindows.map((item) => item.actualEnd)) || plannedEnd;
  const hasActuals = productWindows.some((item) => item.actualKeys.length);
  const actualKeys = uniqueDateKeys(productWindows.flatMap((item) => item.actualKeys));
  const baselineKeys = uniqueDateKeys(productWindows.flatMap((item) => item.baselineKeys));
  const productRows = filterProductRowsByWindows(productWindows, "actualKeys");
  const baselineProductRows = filterProductRowsByWindows(productWindows, "baselineKeys");
  const productSummary = summarizeLaunchWorkbenchProducts(productRows, selectedProducts);
  const baselineProductSummary = summarizeLaunchWorkbenchProducts(baselineProductRows, selectedProducts);
  const metrics = getMetricSummary(actualKeys);
  const baselineMetrics = getMetricSummary(baselineKeys);
  const media = summarizeLaunchWorkbenchMedia(actualKeys, launchEvent);
  const planning = summarizeLaunchPlanning(actualKeys, selectedProducts);
  const windows = buildLaunchWorkbenchWindows(productWindows, launchEvent);
  const curve = buildLaunchCurve(productWindows, selectedProducts);
  const acceleration = buildLaunchWeeklyAcceleration(productWindows, selectedProducts, launchEvent);
  const seasonality = summarizeLaunchSeasonality(productWindows);
  const comparison = buildLaunchComparisonRows(comparisonWindows);
  const dataSource = getLaunchProductSourceMeta();
  const methodology = buildLaunchMethodology(productWindows, selectedProducts, dataSource);
  const hero = buildLaunchHero(productWindows, benchmarkWindows);
  const windowMatrix = buildLaunchWindowMatrix(comparisonWindows);
  const projection = buildLaunchProjection(productWindows, benchmarkWindows);
  const generatedInsights = buildLaunchGeneratedInsights({ hero, projection, comparison, media, productSummary, metrics, methodology });

  return {
    launchEvent,
    launchDate,
    plannedEnd,
    actualEnd,
    cutoff,
    windowDays,
    hasActuals,
    actualKeys,
    baselineKeys,
    productWindows,
    comparisonProducts,
    comparisonWindows,
    selectedProducts,
    productSummary,
    baselineProductSummary,
    metrics,
    baselineMetrics,
    media,
    planning,
    windows,
    curve,
    acceleration,
    seasonality,
    comparison,
    dataSource,
    methodology,
    hero,
    windowMatrix,
    projection,
    generatedInsights,
    revenueVariation: calculateVariation(productSummary.revenue, baselineProductSummary.revenue),
    contextRevenueVariation: calculateVariation(metrics.receita_total, baselineMetrics.receita_total),
  };
}

function buildLaunchProductWindows(selectedProducts, windowDays, cutoff, fallbackLaunchDate) {
  return selectedProducts.map((product) => {
    const launchWindowStart = resolveLaunchWindowStart(product, fallbackLaunchDate);
    const launchDate = launchWindowStart.launchDate;
    const plannedEnd = addDays(launchDate, windowDays - 1);
    const actualEnd = cutoff && cutoff < plannedEnd ? cutoff : plannedEnd;
    const actualKeys = launchDate && actualEnd >= launchDate ? dateKeysBetween(launchDate, actualEnd) : [];
    const baselineKeys = actualKeys.length ? dateKeysBetween(addDays(launchDate, -actualKeys.length), addDays(launchDate, -1)) : [];
    return {
      product,
      productKey: product.key,
      launchDate,
      registeredLaunchDate: launchWindowStart.registeredLaunchDate,
      officialLaunchDate: launchWindowStart.officialLaunchDate,
      firstCapturedDate: launchWindowStart.firstCapturedDate,
      launchDateAdjusted: launchWindowStart.adjusted,
      plannedEnd,
      actualEnd,
      windowDays,
      actualKeys,
      baselineKeys,
    };
  });
}

function resolveLaunchWindowStart(product = {}, fallbackLaunchDate = "") {
  const registeredLaunchDate = product.launchDate || "";
  const officialLaunchDate = product.officialLaunchDate || registeredLaunchDate;
  const firstCapturedDate = product.firstDate && (product.revenue || product.items) ? product.firstDate : "";
  const hasFullLaunchRows = !getLaunchProductSourceMeta().isFallback;
  const adjusted = Boolean(
    hasFullLaunchRows &&
      registeredLaunchDate &&
      firstCapturedDate &&
      firstCapturedDate > registeredLaunchDate
  );

  return {
    registeredLaunchDate,
    officialLaunchDate,
    firstCapturedDate,
    adjusted,
    launchDate: adjusted ? firstCapturedDate : registeredLaunchDate || firstCapturedDate || officialLaunchDate || fallbackLaunchDate,
  };
}

function resolveLaunchComparisonProducts(products, selectedProducts) {
  return selectedProducts.filter((product) => product.launchDate || product.revenue || product.items);
}

function buildLaunchComparisonRows(productWindows) {
  const selectedKeys = new Set(state.launch.productKeys || []);
  const dataSource = getLaunchProductSourceMeta();
  return productWindows
    .map((window) => {
      const total = summarizeLaunchProductWindow(window, window.actualKeys.length || window.windowDays || 90);
      const d0 = summarizeLaunchProductWindow(window, 1);
      const d7 = summarizeLaunchProductWindow(window, 7);
      const d30 = summarizeLaunchProductWindow(window, 30);
      const d90 = summarizeLaunchProductWindow(window, 90);
      const peakWeek = findLaunchPeakWeek(window);
      const topProduct = total.byProduct[0] || {};
      const topColor = total.byColor?.[0] || topProduct.colorSummary?.[0] || null;
      const topSize = total.bySize?.[0] || topProduct.sizeSummary?.[0] || null;
      const sourceGap = dataSource.isFallback;

      return {
        key: window.productKey,
        name: window.product.name,
        isSelected: selectedKeys.has(window.productKey),
        launchDate: window.launchDate,
        launchDateLabel: launchWindowDateLabel(window, window.product),
        launchDateAdjusted: window.launchDateAdjusted,
        totalRevenue: total.revenue,
        totalItems: total.items,
        d0Revenue: d0.revenue,
        d7Revenue: d7.revenue,
        d30Revenue: d30.revenue,
        d90Revenue: d90.revenue,
        d0Status: launchComparisonValueStatus(sourceGap, d0),
        d7Status: launchComparisonValueStatus(sourceGap, d7),
        d30Status: launchComparisonValueStatus(sourceGap, d30),
        d90Status: launchComparisonValueStatus(sourceGap, d90),
        peakWeekLabel: peakWeek.label,
        peakWeekRevenue: peakWeek.revenue,
        pairsPerOrder: safeDivide(total.items, getMetricSummary(window.actualKeys).pedidos_aprovados),
        topColorLabel: topColor ? `${topColor.label} (${formatInteger(topColor.items)})` : "Sem cor",
        topSizeLabel: topSize ? `${topSize.label} (${formatInteger(topSize.items)})` : "Sem tamanho",
        topVariantLabel: [topColor?.label, topSize?.label].filter(Boolean).join(" / ") || "sem variante lider",
        sourceGap,
      };
    })
    .sort((a, b) => Number(b.isSelected) - Number(a.isSelected) || b.d90Revenue - a.d90Revenue || b.totalItems - a.totalItems);
}

function buildLaunchMethodology(productWindows, selectedProducts, dataSource) {
  const rows = productWindows.map((window) => {
    const dayZeroDate = window.registeredLaunchDate || window.launchDate || "";
    const gapDays =
      window.officialLaunchDate && window.firstCapturedDate
        ? Math.max(0, daysBetweenDateKeys(window.officialLaunchDate, window.firstCapturedDate))
        : null;
    const coverageGapDays =
      dayZeroDate && window.firstCapturedDate ? Math.max(0, daysBetweenDateKeys(dayZeroDate, window.firstCapturedDate)) : null;
    return {
      key: window.productKey,
      name: window.product?.name || window.productKey,
      officialLaunchDate: window.officialLaunchDate,
      dayZeroDate,
      firstCapturedDate: window.firstCapturedDate,
      effectiveLaunchDate: window.launchDate,
      gapDays,
      coverageGapDays,
      reliability: window.product?.config?.confiabilidade || classifyLaunchReliability(coverageGapDays, window.firstCapturedDate),
      adjusted: window.launchDateAdjusted,
    };
  });
  const launchRows = getLaunchProductRows();
  const hasCustomerFlag = launchRows.some((row) => Object.prototype.hasOwnProperty.call(row, "cliente_novo"));
  const hasOrderIdentity = launchRows.some((row) =>
    ["pedido_id", "order_id", "order_name", "source_order_id"].some((field) => row[field])
  );
  const alerts = [];

  rows
    .filter((row) => row.coverageGapDays > 0)
    .forEach((row) => {
      alerts.push({
        level: "warning",
        title: `${row.name}: gap de cobertura de ${formatInteger(row.coverageGapDays)} dia(s)`,
        detail: `D0 planilha ${formatShortDate(row.dayZeroDate)}; primeira venda na base ${formatShortDate(row.firstCapturedDate)}.`,
      });
    });
  if (!hasCustomerFlag) {
    alerts.push({
      level: "warning",
      title: "Cliente novo indisponivel por pedido",
      detail: "O JSON atual nao traz cliente_novo por pedido; % novos fica sinalizado como lacuna metodologica.",
    });
  }
  if (!hasOrderIdentity) {
    alerts.push({
      level: "warning",
      title: "Pedido por modelo indisponivel",
      detail: "A base de SKU/dia nao possui order_id/pedido_id; ticket medio por pedido usa apenas contexto geral quando exibido.",
    });
  }
  if (dataSource?.isFallback) {
    alerts.push({
      level: "critical",
      title: "Fonte parcial de produto",
      detail: "Sem lancamentos_produtos_dia.json completo, os dias sem linha nao podem ser interpretados como venda zero.",
    });
  }
  if (!state.data.lancamentosInvestimentos?.length) {
    alerts.push({
      level: "warning",
      title: "Investimentos de lancamento vazios",
      detail: "Midia e CRM aparecem como leitura incompleta ate a planilha de investimentos/disparos ser preenchida.",
    });
  }
  if (!selectedProducts.length) {
    alerts.push({
      level: "neutral",
      title: "Nenhum modelo selecionado",
      detail: "Selecione ao menos um modelo para calcular janelas, curvas e projecoes.",
    });
  }

  return {
    rows,
    alerts,
    hasCustomerFlag,
    hasOrderIdentity,
  };
}

function classifyLaunchReliability(gapDays, firstCapturedDate) {
  if (!firstCapturedDate) return "Sem venda capturada";
  if (gapDays === 0) return "Confiavel";
  if (gapDays > 0) return "Traction consolidada";
  return "Em validacao";
}

function buildLaunchHero(productWindows, benchmarkWindows) {
  const currentWindow = [...productWindows]
    .filter((window) => window.productKey)
    .sort((a, b) => String(b.officialLaunchDate || b.launchDate || "").localeCompare(String(a.officialLaunchDate || a.launchDate || "")))[0];
  if (!currentWindow) return null;

  const current = summarizeLaunchWindowFacts(currentWindow, 30);
  const referenceWindow = findPreviousCompleteLaunchWindow(currentWindow, benchmarkWindows, 30);
  const reference = referenceWindow ? summarizeLaunchWindowFacts(referenceWindow, 30) : null;
  const cards = [
    buildLaunchHeroCard("Faturamento 30d", current.revenue, reference?.revenue, formatCurrency),
    buildLaunchHeroCard("Pares 30d", current.items, reference?.items, formatInteger),
    buildLaunchHeroCard("Velocidade diaria", current.dailyRevenue, reference?.dailyRevenue, formatCurrency),
    buildLaunchHeroCard("Ticket por par", current.ticketPerItem, reference?.ticketPerItem, formatCurrency),
    buildLaunchHeroCard("Pedidos 30d", current.productOrders, reference?.productOrders, formatInteger, current.hasProductOrders),
    buildLaunchHeroCard("% clientes novos", current.newCustomerShare, reference?.newCustomerShare, formatPercent, current.hasNewCustomerData),
  ];

  return {
    currentWindow,
    referenceWindow,
    current,
    reference,
    cards,
  };
}

function buildLaunchHeroCard(label, value, referenceValue, formatter, available = true) {
  if (!available || value === null || value === undefined) {
    return { label, value: "-", delta: "Dado ausente no JSON atual", status: "missing" };
  }
  const variation = referenceValue === null || referenceValue === undefined ? null : calculateVariation(value, referenceValue);
  return {
    label,
    value: formatter(value),
    delta: variation ? `${variation.label} vs lancamento anterior` : "Sem benchmark completo anterior",
    status: variation?.direction || "neutral",
  };
}

function findPreviousCompleteLaunchWindow(currentWindow, benchmarkWindows, minDays = 30) {
  const currentDate = currentWindow.officialLaunchDate || currentWindow.launchDate || "";
  return [...benchmarkWindows]
    .filter((window) => window.productKey !== currentWindow.productKey)
    .filter((window) => (window.officialLaunchDate || window.launchDate || "") < currentDate)
    .filter((window) => !window.launchDateAdjusted)
    .filter((window) => window.actualKeys.length >= minDays)
    .filter((window) => summarizeLaunchWindowFacts(window, minDays).revenue > 0)
    .sort((a, b) => String(b.officialLaunchDate || b.launchDate || "").localeCompare(String(a.officialLaunchDate || a.launchDate || "")))[0] || null;
}

function buildLaunchWindowMatrix(productWindows) {
  return productWindows.flatMap((window) =>
    [15, 30, 90].map((days) => {
      const facts = summarizeLaunchWindowFacts(window, days);
      return {
        key: `${window.productKey}-${days}`,
        model: window.product?.name || window.productKey,
        label: `${days}d`,
        days,
        complete: window.actualKeys.length >= days,
        adjusted: window.launchDateAdjusted,
        ...facts,
      };
    })
  );
}

function buildLaunchProjection(productWindows, benchmarkWindows) {
  const currentWindow = [...productWindows]
    .filter((window) => window.productKey)
    .sort((a, b) => String(b.officialLaunchDate || b.launchDate || "").localeCompare(String(a.officialLaunchDate || a.launchDate || "")))[0];
  if (!currentWindow) {
    return { available: false, reason: "Selecione um modelo para projetar cenarios.", scenarios: [], benchmarks: [] };
  }

  const current30 = summarizeLaunchWindowFacts(currentWindow, 30);
  const current15 = summarizeLaunchWindowFacts(currentWindow, 15);
  const sourceDays = currentWindow.actualKeys.length >= 30 && current30.revenue > 0 ? 30 : 15;
  const source = sourceDays === 30 ? current30 : current15;
  const benchmarks = benchmarkWindows
    .filter((window) => window.productKey !== currentWindow.productKey)
    .filter((window) => !window.launchDateAdjusted)
    .filter((window) => window.actualKeys.length >= 90)
    .map((window) => {
      const base = summarizeLaunchWindowFacts(window, sourceDays);
      const d90 = summarizeLaunchWindowFacts(window, 90);
      return {
        model: window.product?.name || window.productKey,
        multiplier: safeDivide(d90.revenue, base.revenue),
        itemMultiplier: safeDivide(d90.items, base.items),
      };
    })
    .filter((row) => row.multiplier > 0);

  if (!source.revenue || !benchmarks.length) {
    return {
      available: false,
      reason: benchmarks.length
        ? "Ainda nao ha faturamento suficiente na janela atual."
        : "Aguardando ao menos um benchmark limpo com janela D+90 completa.",
      sourceDays,
      source,
      scenarios: [],
      benchmarks,
    };
  }

  const multipliers = benchmarks.map((row) => row.multiplier).sort((a, b) => a - b);
  const itemMultipliers = benchmarks.map((row) => row.itemMultiplier).filter((value) => value > 0).sort((a, b) => a - b);
  const average = multipliers.reduce((sum, value) => sum + value, 0) / multipliers.length;
  const itemAverage = itemMultipliers.length ? itemMultipliers.reduce((sum, value) => sum + value, 0) / itemMultipliers.length : average;
  const scenarioDefs = [
    ["Conservador", multipliers[0], itemMultipliers[0] || itemAverage],
    ["Base / target", average, itemAverage],
    ["Otimista", multipliers[multipliers.length - 1], itemMultipliers[itemMultipliers.length - 1] || itemAverage],
  ];

  return {
    available: true,
    sourceDays,
    source,
    benchmarks,
    scenarios: scenarioDefs.map(([label, multiplier, itemMultiplier]) => ({
      label,
      multiplier,
      revenue: source.revenue * multiplier,
      items: source.items * itemMultiplier,
    })),
  };
}

function buildLaunchGeneratedInsights({ hero, projection, comparison, media, productSummary, metrics, methodology }) {
  const insights = [];
  const currentName = hero?.currentWindow?.product?.name || "Modelo selecionado";
  const revenueCard = hero?.cards?.find((card) => card.label === "Faturamento 30d");
  const ticketCard = hero?.cards?.find((card) => card.label === "Ticket por par");
  if (revenueCard && revenueCard.status !== "missing") {
    insights.push(`${currentName}: faturamento 30d em ${revenueCard.value}; ${revenueCard.delta.toLowerCase()}.`);
  }
  if (ticketCard && ticketCard.status !== "missing") {
    insights.push(`Ticket por par em ${ticketCard.value}; use isso separado do ticket por pedido para nao distorcer compras multi-par.`);
  }
  const adjustedModels = methodology?.rows?.filter((row) => row.adjusted) || [];
  if (adjustedModels.length) {
    insights.push(`${adjustedModels.length} modelo(s) usam D0 SSOT por gap entre data oficial e primeira venda capturada.`);
  }
  if (projection?.available) {
    const target = projection.scenarios.find((scenario) => scenario.label === "Base / target");
    insights.push(`Cenario base projeta ${formatCurrency(target.revenue)} ate D+90 usando multiplicadores historicos limpos.`);
  } else if (projection?.reason) {
    insights.push(`Projecao D+90 indisponivel: ${projection.reason}`);
  }
  if (!media?.attributedRevenue) {
    insights.push("Midia/CRM sem receita atribuida suficiente na janela; interpretar ROAS como lacuna de tracking, nao como zero real.");
  }
  if (safeDivide(productSummary.items, metrics.pedidos_aprovados) > 1) {
    insights.push(`Pares por pedido acima de 1 (${formatRatio(safeDivide(productSummary.items, metrics.pedidos_aprovados))}), sinal de compra com multiplos pares no periodo.`);
  }
  return insights.slice(0, 5);
}

function summarizeLaunchWindowFacts(window, days) {
  const keys = (window.actualKeys || []).slice(0, Math.max(0, days));
  const rows = filterProductRowsByKeys(keys, [window.productKey]);
  const summary = summarizeLaunchWorkbenchProducts(rows, [window.product]);
  const metrics = getMetricSummary(keys);
  const productOrders = deriveLaunchProductOrders(rows);
  const newCustomerShare = deriveLaunchNewCustomerShare(rows);
  const ticketOrderDenominator = productOrders.value || 0;
  return {
    ...summary,
    keys,
    rows,
    metrics,
    capturedRows: rows.length,
    productOrders: productOrders.value,
    hasProductOrders: productOrders.available,
    newCustomerShare: newCustomerShare.value,
    hasNewCustomerData: newCustomerShare.available,
    ticketPerItem: safeDivide(summary.revenue, summary.items),
    ticketPerOrder: ticketOrderDenominator ? safeDivide(summary.revenue, ticketOrderDenominator) : null,
    pairsPerOrder: ticketOrderDenominator ? safeDivide(summary.items, ticketOrderDenominator) : null,
    contextTicket: safeDivide(summary.revenue, metrics.pedidos_aprovados),
    contextPairsPerOrder: safeDivide(summary.items, metrics.pedidos_aprovados),
    dailyRevenue: safeDivide(summary.revenue, keys.length),
  };
}

function deriveLaunchProductOrders(rows = []) {
  const orderFields = ["pedido_id", "order_id", "order_name", "source_order_id"];
  const ids = new Set();
  rows.forEach((row) => {
    orderFields.forEach((field) => {
      if (row[field]) ids.add(String(row[field]));
    });
  });
  if (ids.size) return { available: true, value: ids.size };

  const orderRows = rows.filter((row) => row.pedidos || row.pedidos_aprovados || row.orders);
  if (orderRows.length) {
    return {
      available: true,
      value: orderRows.reduce((sum, row) => sum + Number(row.pedidos || row.pedidos_aprovados || row.orders || 0), 0),
    };
  }
  return { available: false, value: null };
}

function deriveLaunchNewCustomerShare(rows = []) {
  if (!rows.some((row) => Object.prototype.hasOwnProperty.call(row, "cliente_novo"))) {
    return { available: false, value: null };
  }
  const orderMap = new Map();
  rows.forEach((row) => {
    const key = row.pedido_id || row.order_id || row.order_name || row.source_order_id || `${row.data}-${row.sku}-${row.cliente_novo}`;
    const current = orderMap.get(key) || { total: 0, newCustomers: 0 };
    current.total += 1;
    if (row.cliente_novo === true || row.cliente_novo === "true" || row.cliente_novo === 1 || row.cliente_novo === "1") {
      current.newCustomers = 1;
    }
    orderMap.set(key, current);
  });
  const orders = [...orderMap.values()];
  return { available: true, value: safeDivide(orders.reduce((sum, item) => sum + item.newCustomers, 0), orders.length) };
}

function summarizeLaunchProductWindow(window, days) {
  const keys = (window.actualKeys || []).slice(0, Math.max(0, days));
  const rows = filterProductRowsByKeys(keys, [window.productKey]);
  return {
    ...summarizeLaunchWorkbenchProducts(rows, [window.product]),
    capturedRows: rows.length,
    expectedDays: keys.length,
  };
}

function launchComparisonValueStatus(sourceGap, summary = {}) {
  if (summary.capturedRows || summary.revenue || summary.items) return "captured";
  return sourceGap ? "partial" : "zero";
}

function findLaunchPeakWeek(window) {
  const weekCount = Math.ceil((window.actualKeys || []).length / 7);
  let peak = { label: "Sem pico", revenue: 0 };
  for (let index = 0; index < weekCount; index += 1) {
    const start = index * 7;
    const summary = summarizeLaunchProductWindow(window, 7 + start);
    const previous = summarizeLaunchProductWindow(window, start);
    const revenue = summary.revenue - previous.revenue;
    if (revenue > peak.revenue) {
      peak = {
        label: `S${index + 1}`,
        revenue,
      };
    }
  }
  return peak;
}

function filterProductRowsByWindows(productWindows, keyField) {
  return productWindows.flatMap((window) => filterProductRowsByKeys(window[keyField] || [], [window.productKey]));
}

function renderLaunchInsight(analysis) {
  const target = document.getElementById("launchInsight");
  const status = document.getElementById("launchWorkbenchStatus");
  if (!target || !status) return;

  status.textContent = analysis.cutoff ? `Dados até ${formatShortDate(analysis.cutoff)}` : "Sem corte D-1";
  if (!analysis.selectedProducts.length) {
    target.innerHTML = `
      <strong>Selecione ao menos um modelo para iniciar.</strong>
      <span>A curva usa o cache D-1 ja exportado; trocar filtro nao consulta BigQuery.</span>
    `;
    return;
  }

  const eventName = analysis.launchEvent?.titulo || analysis.launchEvent?.nome_evento || "analise avulsa";
  const productLabel =
    analysis.selectedProducts.length === 1
      ? analysis.selectedProducts[0].name
      : `${analysis.selectedProducts.length} modelos selecionados`;
  const productVariation =
    analysis.revenueVariation.percentChange === null ? "sem baseline do produto" : analysis.revenueVariation.label;
  const actualText = analysis.hasActuals
    ? analysis.selectedProducts.length > 1
      ? `D0 a D+${Math.max(0, analysis.curve.labels.length - 1)} por modelo`
      : `${formatShortDate(analysis.launchDate)} a ${formatShortDate(analysis.actualEnd)}`
    : `lancamento futuro em ${formatShortDate(analysis.launchDate)}`;
  const relativeNote =
    analysis.selectedProducts.length > 1
      ? " Cada modelo usa a propria data de lancamento como D0 para comparar desempenho em dias relativos."
      : "";
  const adjustedCount = analysis.productWindows.filter((window) => window.launchDateAdjusted).length;
  const adjustedNote = adjustedCount
    ? ` ${adjustedCount} modelo(s) usam D0 SSOT porque a data oficial nao tem cobertura de SKU na base exportada.`
    : "";
  const sourceNote = analysis.dataSource?.isFallback
    ? " Fonte atual: recorte top/queda; rode o Apps Script atualizado para carregar a base completa de lancamentos."
    : " Fonte atual: base completa de lancamentos por SKU/dia.";

  target.innerHTML = `
    <strong>${escapeHtml(eventName)} · ${escapeHtml(productLabel)}</strong>
    <span>Janela analisada: ${actualText}.${relativeNote}${adjustedNote} Modelo vs baseline anterior: ${productVariation}. Contexto comercial: ${formatCurrency(analysis.metrics.receita_total)} e ${formatInteger(analysis.metrics.pedidos_aprovados)} pedidos.${sourceNote}</span>
    ${
      analysis.generatedInsights?.length
        ? `<ul>${analysis.generatedInsights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
        : ""
    }
  `;
}

function renderLaunchMethodology(analysis) {
  const target = document.getElementById("launchMethodologyPanel");
  if (!target) return;
  const rows = analysis.methodology?.rows || [];
  const alerts = analysis.methodology?.alerts || [];
  const rowHtml = rows
    .map(
      (row) => `
        <article class="launch-method-card ${row.adjusted ? "is-warning" : ""}">
          <span>${escapeHtml(row.reliability)}</span>
          <strong>${escapeHtml(row.name)}</strong>
          <small>Oficial ${row.officialLaunchDate ? formatShortDate(row.officialLaunchDate) : "-"} · D0 ${
            row.dayZeroDate ? formatShortDate(row.dayZeroDate) : "-"
          } · Base ${
            row.firstCapturedDate ? formatShortDate(row.firstCapturedDate) : "-"
          } · Gap ${row.coverageGapDays === null ? "-" : `${formatInteger(row.coverageGapDays)}d`}</small>
        </article>
      `
    )
    .join("");
  const alertHtml = alerts
    .slice(0, 5)
    .map(
      (alert) => `
        <li class="launch-method-alert-${escapeHtml(alert.level)}">
          <strong>${escapeHtml(alert.title)}</strong>
          <span>${escapeHtml(alert.detail)}</span>
        </li>
      `
    )
    .join("");

  target.innerHTML = `
    <div class="section-heading launch-method-heading">
      <div>
        <span class="eyebrow">Metodologia</span>
        <h2>Confiabilidade e limites da leitura</h2>
      </div>
      <span class="comparison-badge">${escapeHtml(analysis.dataSource?.label || "fonte nao identificada")}</span>
    </div>
    <div class="launch-method-grid">${rowHtml || `<p class="launch-intelligence-empty">Selecione modelos para calcular confiabilidade.</p>`}</div>
    <ul class="launch-method-alerts">${alertHtml}</ul>
  `;
}

function renderLaunchHero(analysis) {
  const target = document.getElementById("launchHeroPanel");
  if (!target) return;
  const hero = analysis.hero;
  if (!hero) {
    target.innerHTML = "";
    return;
  }
  const currentName = hero.currentWindow?.product?.name || "Modelo selecionado";
  const referenceName = hero.referenceWindow?.product?.name || "sem benchmark completo";

  target.innerHTML = `
    <div class="launch-hero-copy">
      <span class="eyebrow">Destaque 30d</span>
      <h2>${escapeHtml(currentName)}</h2>
      <p>Comparado contra ${escapeHtml(referenceName)}. Quando pedido, cliente novo ou CRM nao existem no JSON, o card fica sinalizado como lacuna.</p>
    </div>
    <div class="launch-hero-grid">
      ${hero.cards
        .map(
          (card) => `
            <article class="launch-hero-card launch-hero-${slug(card.status || "neutral")}">
              <span>${escapeHtml(card.label)}</span>
              <strong>${escapeHtml(card.value)}</strong>
              <small>${escapeHtml(card.delta)}</small>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderLaunchMetricGrid(analysis) {
  const target = document.getElementById("launchMetricGrid");
  if (!target) return;

  const productTicket = safeDivide(analysis.productSummary.revenue, analysis.productSummary.items);
  const newShare = safeDivide(
    analysis.metrics.clientes_novos,
    analysis.metrics.clientes_novos + analysis.metrics.clientes_recorrentes
  );
  const planning = analysis.planning || {};
  const topModel = [...(analysis.productSummary.byProduct || [])].sort((a, b) => b.items - a.items || b.revenue - a.revenue)[0];
  const topColor = analysis.productSummary.byColor?.[0] || null;
  const topSize = analysis.productSummary.bySize?.[0] || null;
  const pairsPerOrder = safeDivide(analysis.productSummary.items, analysis.metrics.pedidos_aprovados);
  const hasLaunchCustomerFlag = Boolean(analysis.methodology?.hasCustomerFlag);
  const hasLaunchOrderIdentity = Boolean(analysis.methodology?.hasOrderIdentity);
  const cards = [
    [
      "Tenis mais vendido",
      topModel ? escapeHtml(topModel.name) : "-",
      topModel ? `${formatInteger(topModel.items)} itens - ${formatCurrency(topModel.revenue)}` : "Sem venda no periodo",
    ],
    [
      "Cor lider",
      topColor ? escapeHtml(topColor.label) : "-",
      topColor ? `${formatInteger(topColor.items)} itens - ${formatCurrency(topColor.revenue)}` : "Sem cor mapeada",
    ],
    [
      "Tamanho lider",
      topSize ? escapeHtml(topSize.label) : "-",
      topSize ? `${formatInteger(topSize.items)} itens - ${formatCurrency(topSize.revenue)}` : "Sem tamanho mapeado",
    ],
    ["Receita modelo", formatCurrency(analysis.productSummary.revenue), variationBadge(analysis.revenueVariation)],
    ["Itens modelo", formatInteger(analysis.productSummary.items), `${formatCurrency(productTicket)} por item`],
    ["Faturamento geral", formatCurrency(analysis.metrics.receita_total), variationBadge(analysis.contextRevenueVariation)],
    ["Pedidos", formatInteger(analysis.metrics.pedidos_aprovados), `Ticket ${formatCurrency(analysis.metrics.ticket_medio)}`],
    ["Conversão", formatPercent(analysis.metrics.taxa_conversao), `${formatInteger(analysis.metrics.sessoes)} sessões`],
    [
      "Clientes novos",
      hasLaunchCustomerFlag ? formatPercent(newShare) : "-",
      hasLaunchCustomerFlag ? `${formatInteger(analysis.metrics.clientes_novos)} clientes` : "cliente_novo ausente no JSON do lancamento",
    ],
    [
      "Pares por pedido",
      hasLaunchOrderIdentity ? formatRatio(pairsPerOrder) : "-",
      hasLaunchOrderIdentity
        ? `${formatInteger(analysis.productSummary.items)} itens / ${formatInteger(analysis.metrics.pedidos_aprovados)} pedidos`
        : "order_id ausente; nao calcular como real",
    ],
    ["Investimento", formatCurrency(analysis.media.investment), `${formatDecimal(analysis.media.ordersPer1k)} pedidos / R$1k`],
    ["ROAS / CPA", `${formatRoas(analysis.media.roas)} · ${formatCurrency(analysis.media.cpa)}`, `${formatCurrency(analysis.media.attributedRevenue)} UTM`],
    ["Fonte da curva", analysis.dataSource?.label || "-", analysis.dataSource?.isFallback ? "Atualize o Apps Script para fechar os buracos" : "SKU/dia completo para lancamentos"],
  ];

  if (planning.rows) {
    cards.push(
      [
        "Invest. planilha",
        formatCurrency(planning.investmentReal || planning.investmentPlanned),
        `Planejado ${formatCurrency(planning.investmentPlanned)}`,
      ],
      [
        "Receita planilha",
        formatCurrency(planning.revenueReal || planning.revenuePlanned),
        `Planejado ${formatCurrency(planning.revenuePlanned)}`,
      ]
    );
  }

  target.innerHTML = cards
    .map(
      ([label, value, note]) => `
        <article class="launch-metric-card">
          <span>${label}</span>
          <strong>${value}</strong>
          <small>${note}</small>
        </article>
      `
    )
    .join("");
}

function renderLaunchComparison(analysis) {
  const panel = document.getElementById("launchComparisonPanel");
  const grid = document.getElementById("launchComparisonGrid");
  const table = document.getElementById("launchComparisonTable");
  const subtitle = document.getElementById("launchComparisonSubtitle");
  if (!panel || !grid || !table || !subtitle) return;

  panel.hidden = !analysis.selectedProducts.length;
  if (!analysis.selectedProducts.length) {
    grid.innerHTML = "";
    table.innerHTML = "";
    subtitle.textContent = "";
    return;
  }

  const rows = analysis.comparison || [];
  const hasRealComparison = analysis.selectedProducts.length > 1;
  subtitle.textContent = hasRealComparison
    ? `Comparando ${analysis.selectedProducts.length} modelos selecionados no mesmo eixo D+.`
    : "Leitura individual: selecione mais modelos ou use Comparar Top 3.";

  grid.innerHTML =
    [
      !hasRealComparison
        ? `<p class="launch-comparison-help">Este bloco nao adiciona modelos automaticamente. Para comparar curvas de lancamento, selecione 2 ou mais modelos no dropdown ou clique em Comparar Top 3.</p>`
        : "",
      rows
      .slice(0, 6)
      .map((row, index) => {
        const badge = hasRealComparison ? "Comparado" : "Selecionado";
        const evidence = row.launchDateAdjusted
          ? `D0 SSOT ajustado a partir da primeira venda capturada`
          : row.sourceGap
          ? `${formatInteger(row.totalItems)} itens na base parcial`
          : row.totalItems
            ? `${formatInteger(row.totalItems)} itens capturados`
            : "Sem venda na janela";
        return `
          <article class="launch-comparison-card ${row.isSelected ? "is-selected" : ""}">
            <div class="launch-comparison-card-head">
              <span>${escapeHtml(badge)} ${index + 1}</span>
              <strong>${escapeHtml(row.name)}</strong>
              <small>${escapeHtml(row.launchDateLabel)}</small>
            </div>
            <div class="launch-comparison-card-metrics">
              <span>D+7 <strong>${renderLaunchComparisonValue(row.d7Revenue, row.d7Status)}</strong></span>
              <span>D+30 <strong>${renderLaunchComparisonValue(row.d30Revenue, row.d30Status)}</strong></span>
              <span>D+90 <strong>${renderLaunchComparisonValue(row.d90Revenue, row.d90Status)}</strong></span>
              <span>Pico <strong>${escapeHtml(row.peakWeekLabel)}</strong></span>
            </div>
            <p>${escapeHtml(evidence)} · ${formatRatio(row.pairsPerOrder)} pares/pedido · ${escapeHtml(row.topVariantLabel)}</p>
          </article>
        `;
      })
      .join(""),
    ].join("") || `<p class="launch-intelligence-empty">Sem modelos comparaveis para esta selecao.</p>`;

  table.innerHTML =
    rows
      .map(
        (row) => `
          <tr class="${row.isSelected ? "is-selected" : ""}">
            <td><strong>${escapeHtml(row.name)}</strong><br><span>${escapeHtml(row.launchDateLabel)}</span></td>
            <td class="numeric-cell">${renderLaunchComparisonValue(row.d0Revenue, row.d0Status)}</td>
            <td class="numeric-cell">${renderLaunchComparisonValue(row.d7Revenue, row.d7Status)}</td>
            <td class="numeric-cell">${renderLaunchComparisonValue(row.d30Revenue, row.d30Status)}</td>
            <td class="numeric-cell">${renderLaunchComparisonValue(row.d90Revenue, row.d90Status)}</td>
            <td>${escapeHtml(row.peakWeekLabel)}<br><span>${formatCurrency(row.peakWeekRevenue)}</span></td>
            <td>${escapeHtml(row.topColorLabel)}</td>
            <td>${escapeHtml(row.topSizeLabel)}</td>
            <td>${
              row.launchDateAdjusted
                ? `<span class="status-chip warning">D0 SSOT</span>`
                : row.sourceGap
                  ? `<span class="status-chip warning">Base incompleta</span>`
                  : `<span class="status-chip success">Capturado</span>`
            }</td>
          </tr>
        `
      )
      .join("") || emptyTableRow(9);
}

function renderLaunchComparisonValue(value, status) {
  if (status === "partial") return `<span class="comparison-missing">Base parcial</span>`;
  return formatCurrency(value);
}

function renderLaunchProductCards(analysis) {
  const target = document.getElementById("launchProductCards");
  if (!target) return;

  if (!analysis.selectedProducts.length) {
    target.innerHTML = "";
    return;
  }

  const totalRevenue = analysis.productSummary.revenue || 0;
  target.innerHTML = analysis.selectedProducts
    .slice(0, 8)
    .map((product, index) => {
      const productWindow = analysis.productWindows.find((item) => item.productKey === product.key) || {
        product,
        actualKeys: analysis.actualKeys,
        baselineKeys: analysis.baselineKeys,
      };
      const current = summarizeLaunchWorkbenchProducts(
        filterProductRowsByKeys(productWindow.actualKeys, [product.key]),
        [product]
      );
      const baseline = summarizeLaunchWorkbenchProducts(
        filterProductRowsByKeys(productWindow.baselineKeys, [product.key]),
        [product]
      );
      const currentItem = current.byProduct[0] || { revenue: 0, items: 0 };
      const baselineItem = baseline.byProduct[0] || { revenue: 0, items: 0 };
      const variation = calculateVariation(currentItem.revenue, baselineItem.revenue);
      const share = safeDivide(currentItem.revenue, totalRevenue);
      const stock = summarizeLaunchStock(product);
      const colorRows = renderLaunchBreakdownBars(currentItem.colorSummary || product.colorSummary || [], currentItem.items || product.items);
      const sizeRows = renderLaunchSizeChips(currentItem.sizeSummary || product.sizeSummary || []);
      return `
        <article class="launch-product-card launch-product-tone-${(index % 6) + 1}">
          <div>
            <span>Modelo ${index + 1} - ${escapeHtml(launchWindowDateLabel(productWindow, product))}</span>
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(launchProductMetaLabel(product))}</p>
          </div>
          <div class="launch-product-card-metrics">
            <span>Receita <strong>${formatCurrency(currentItem.revenue)}</strong></span>
            <span>Itens <strong>${formatInteger(currentItem.items)}</strong></span>
            <span>Share <strong>${formatPercent(share)}</strong></span>
            <span>Vs. base <strong>${variation.label}</strong></span>
          </div>
          <div class="launch-variant-breakdown">
            <strong>Top cores</strong>
            ${colorRows || `<small>Sem cor mapeada</small>`}
          </div>
          <div class="launch-size-strip">
            <strong>Tamanhos</strong>
            <div>${sizeRows || `<span>Sem tamanho</span>`}</div>
          </div>
          <footer>
            <span>${stock.status ? `Estoque: ${escapeHtml(stock.status)}` : "Estoque sem sinal"}</span>
            <span>${formatCurrency(safeDivide(currentItem.revenue, currentItem.items))} por item</span>
          </footer>
        </article>
      `;
    })
    .join("");
}

function renderLaunchCurves(analysis) {
  const labels = analysis.curve.labels;
  const note = document.getElementById("launchCurveNote");
  const revenueDatasets = analysis.curve.revenueSeries.map((series, index) => ({
    label: series.label,
    data: series.values,
    color: launchChartColorForModel(series.label, analysis.curve.revenueSeries.map((item) => item.label)),
    fill: true,
  }));
  if (note) {
    note.textContent = analysis.curve.sourceGap
      ? "Fonte parcial: lacunas indicam dias sem captura no recorte atual, nao faturamento zero."
      : "Fonte completa: dias sem venda carregam o acumulado anterior.";
  }

  renderChart(
    "launchCurveChart",
    labels,
    revenueDatasets.length ? revenueDatasets : [{ label: "Receita", data: [], color: "#1e5a49", fill: true }],
    formatCurrency
  );
  renderChart(
    "launchDailyChart",
    labels,
    [
      { label: "Itens modelo", data: analysis.curve.dailyItems, color: "#b98d43", fill: false },
      { label: "Pedidos contexto", data: analysis.curve.dailyOrders, color: "#1e5a49", fill: false },
    ],
    formatInteger
  );
  renderChart("launchItemsCurveChart", labels, analysis.curve.itemSeries, formatInteger);
  renderChart("launchMultiplierChart", labels, analysis.curve.multiplierSeries, formatRoas);
  renderChart("launchMixChart", analysis.curve.weekLabels, analysis.curve.mixSeries, formatPercent);
  renderChart("launchWeeklyRevenueChart", analysis.curve.weekLabels, analysis.curve.weeklyRevenueSeries, formatCurrency);
}

function renderLaunchAcceleration(analysis) {
  const target = document.getElementById("launchAccelerationGrid");
  if (!target) return;
  const rows = analysis.acceleration || [];
  target.innerHTML =
    rows
      .slice(0, 8)
      .map(
        (row) => `
          <article class="launch-intelligence-card">
            <span>${escapeHtml(row.label)} - ${escapeHtml(row.range)}</span>
            <strong>${formatCurrency(row.revenue)}</strong>
            <small>${formatInteger(row.items)} itens - ${formatInteger(row.orders)} pedidos - ${formatRatio(row.pairsPerOrder)} pares/pedido</small>
            <em>${row.variation.label} vs semana anterior</em>
          </article>
        `
      )
      .join("") ||
    `<p class="launch-intelligence-empty">Sem semanas com venda para os modelos selecionados.</p>`;
}

function renderLaunchSeasonality(analysis) {
  const target = document.getElementById("launchSeasonalityList");
  if (!target) return;
  const rows = analysis.seasonality || [];
  target.innerHTML =
    rows
      .map(
        (row) => `
          <article class="launch-seasonality-row launch-seasonality-${slug(row.role)}">
            <div>
              <span>${escapeHtml(row.role)} - ${escapeHtml(row.type)}</span>
              <strong>${escapeHtml(row.title)}</strong>
              <small>${formatShortDate(row.start)} a ${formatShortDate(row.end)} - ${formatInteger(row.days)} dia(s) na janela</small>
            </div>
            <div>
              <strong>${formatCurrency(row.revenue)}</strong>
              <small>${formatInteger(row.orders)} pedidos - ${row.variation.label} vs periodo anterior</small>
            </div>
          </article>
        `
      )
      .join("") ||
    `<p class="launch-intelligence-empty">Nenhuma sazonalidade ou campanha cadastrada cruzou a janela dos modelos selecionados.</p>`;
}

function renderLaunchChannelBreakdown(analysis) {
  const target = document.getElementById("launchChannelBreakdown");
  if (!target) return;
  const channelRows = analysis.media.channelRows || [];
  const crm = channelRows.find((row) => row.channel === "CRM") || { revenue: 0, orders: 0, conversionProxy: 0 };
  const paid = channelRows.find((row) => row.channel === "Midia paga") || {
    revenue: 0,
    orders: 0,
    investment: analysis.media.investment,
    roas: analysis.media.roas,
    cpa: analysis.media.cpa,
  };
  const pairsPerOrder = safeDivide(analysis.productSummary.items, analysis.metrics.pedidos_aprovados);
  const hasLaunchOrderIdentity = Boolean(analysis.methodology?.hasOrderIdentity);
  const kpis = [
    [
      "Pares por pedido",
      hasLaunchOrderIdentity ? formatRatio(pairsPerOrder) : "-",
      hasLaunchOrderIdentity
        ? `${formatInteger(analysis.productSummary.items)} itens / ${formatInteger(analysis.metrics.pedidos_aprovados)} pedidos`
        : "order_id ausente no SKU/dia",
    ],
    ["CRM receita", formatCurrency(crm.revenue), `${formatInteger(crm.orders)} pedido(s) por UTM CRM`],
    ["CRM conversao", crm.conversionProxy ? formatPercent(crm.conversionProxy) : "-", "Proxy por clique/impressao quando existir"],
    ["Midia paga", formatRoas(paid.roas), `${formatCurrency(paid.investment || 0)} investido`],
  ];
  const channelHtml = channelRows
    .slice(0, 5)
    .map(
      (row) => `
        <div class="launch-channel-row">
          <span>${escapeHtml(row.channel)}</span>
          <strong>${formatCurrency(row.revenue)}</strong>
          <small>${formatInteger(row.orders)} pedidos - ${row.investment ? `${formatRoas(row.roas)} / CPA ${formatCurrency(row.cpa)}` : "sem custo mapeado"}</small>
        </div>
      `
    )
    .join("");

  target.innerHTML = `
    <div class="launch-channel-kpis">
      ${kpis
        .map(
          ([label, value, note]) => `
            <span>
              <small>${escapeHtml(label)}</small>
              <strong>${value}</strong>
              <em>${escapeHtml(note)}</em>
            </span>
          `
        )
        .join("")}
    </div>
    <div class="launch-channel-list">
      ${channelHtml || `<p class="launch-intelligence-empty">Sem UTM atribuida na janela.</p>`}
    </div>
  `;
}

function renderLaunchWindowMatrix(analysis) {
  const body = document.getElementById("launchWindowMatrixTable");
  if (!body) return;
  const rows = analysis.windowMatrix || [];
  body.innerHTML =
    rows
      .map((row) => {
        const ticketOrder = row.hasProductOrders ? formatCurrency(row.ticketPerOrder) : "Sem pedido";
        const newShare = row.hasNewCustomerData ? formatPercent(row.newCustomerShare) : "Sem campo";
        const status = row.adjusted
          ? `<span class="status-chip warning">D0 SSOT</span>`
          : row.complete
            ? `<span class="status-chip success">Completa</span>`
            : `<span class="status-chip warning">Parcial</span>`;
        return `
          <tr>
            <td><strong>${escapeHtml(row.model)}</strong></td>
            <td>${escapeHtml(row.label)}</td>
            <td class="numeric-cell">${formatCurrency(row.revenue)}</td>
            <td class="numeric-cell">${formatInteger(row.items)}</td>
            <td class="numeric-cell">${formatCurrency(row.ticketPerItem)}</td>
            <td class="numeric-cell">${ticketOrder}</td>
            <td class="numeric-cell">${newShare}</td>
            <td>${status}</td>
          </tr>
        `;
      })
      .join("") || emptyTableRow(8);
}

function renderLaunchProjection(analysis) {
  const target = document.getElementById("launchProjectionPanel");
  if (!target) return;
  const projection = analysis.projection || {};
  const scenarioHtml = projection.available
    ? projection.scenarios
        .map(
          (scenario) => `
            <article class="launch-projection-card">
              <span>${escapeHtml(scenario.label)}</span>
              <strong>${formatCurrency(scenario.revenue)}</strong>
              <small>${formatInteger(scenario.items)} pares estimados · multiplicador ${formatDecimal(scenario.multiplier)}x</small>
            </article>
          `
        )
        .join("")
    : `<p class="launch-intelligence-empty">${escapeHtml(projection.reason || "Sem dados suficientes para projetar.")}</p>`;
  const benchmarkText = projection.benchmarks?.length
    ? `${formatInteger(projection.benchmarks.length)} benchmark(s) limpo(s)`
    : "Sem benchmark D+90 completo";

  target.innerHTML = `
    <div class="section-heading launch-comparison-heading">
      <div>
        <span class="eyebrow">Projecao</span>
        <h2>Cenarios a partir de D+${Math.max(0, Number(projection.sourceDays || 0) - 1)}</h2>
      </div>
      <span class="comparison-badge">${escapeHtml(benchmarkText)}</span>
    </div>
    <div class="launch-projection-grid">${scenarioHtml}</div>
  `;
}

function renderLaunchWindowCards(analysis) {
  const target = document.getElementById("launchWindowCards");
  if (!target) return;
  target.innerHTML = analysis.windows
    .map(
      (window) => `
        <article class="launch-window-card">
          <span>${escapeHtml(window.label)}</span>
          <strong>${formatCurrency(window.productRevenue)}</strong>
          <small>${formatInteger(window.productItems)} itens · ${formatInteger(window.orders)} pedidos · ${formatRoas(window.roas)}</small>
        </article>
      `
    )
    .join("");
}

function renderLaunchProductTable(analysis) {
  const body = document.getElementById("launchProductTable");
  const summary = document.getElementById("launchItemsSummary");
  const drawerSummary = document.getElementById("launchItemsDrawerSummary");
  const openButton = document.getElementById("openLaunchItemsDrawerButton");
  if (!body) return;
  const variants = analysis.productSummary.byVariant || [];
  const topVariant = variants[0] || null;
  const topColor = analysis.productSummary.byColor?.[0] || null;
  const topSize = analysis.productSummary.bySize?.[0] || null;

  const summaryCards = [
    ["Variacoes", formatInteger(variants.length), `${formatInteger(analysis.productSummary.items)} itens`],
    ["Top item", topVariant ? topVariant.modelName || topVariant.name : "-", topVariant ? `${formatInteger(topVariant.items)} itens` : "Sem venda"],
    ["Cor lider", topColor ? topColor.label : "-", topColor ? `${formatInteger(topColor.items)} itens` : "Sem cor"],
    ["Tamanho lider", topSize ? topSize.label : "-", topSize ? `${formatInteger(topSize.items)} itens` : "Sem tamanho"],
  ];
  const summaryHtml = summaryCards
    .map(
      ([label, value, note]) => `
        <span>
          <small>${escapeHtml(label)}</small>
          <strong>${escapeHtml(value)}</strong>
          <em>${escapeHtml(note)}</em>
        </span>
      `
    )
    .join("");
  if (summary) summary.innerHTML = summaryHtml;
  if (drawerSummary) drawerSummary.innerHTML = summaryHtml;
  if (openButton) {
    openButton.disabled = !variants.length;
    openButton.textContent = variants.length ? "Ver itens" : "Sem itens";
  }

  body.innerHTML =
    variants
      .map((item) => {
        const stock = state.indexes.estoque[item.sku] || {};
        return `
          <tr>
            <td><strong>${escapeHtml(item.modelName || item.name)}</strong><br><span>${escapeHtml(item.sku || item.key)}</span></td>
            <td>${escapeHtml(item.color || "Sem cor")}</td>
            <td>${escapeHtml(item.size || "Sem tamanho")}</td>
            <td class="numeric-cell">${formatCurrency(item.revenue)}</td>
            <td class="numeric-cell">${formatInteger(item.items)}</td>
            <td class="numeric-cell">${formatCurrency(safeDivide(item.revenue, item.items))}</td>
            <td>${stock.risk_status ? `<span class="status-chip ${isStockRisky(stock.risk_status) ? "warning" : "success"}">${escapeHtml(stock.risk_status)}</span>` : "-"}</td>
          </tr>
        `;
      })
      .join("") || emptyTableRow(7);
}

function renderLaunchMediaGrid(analysis) {
  const target = document.getElementById("launchMediaGrid");
  if (!target) return;
  const media = analysis.media;
  const planning = analysis.planning || {};
  const items = [
    ["Investimento", formatCurrency(media.investment), `${formatInteger(media.campaigns)} campanha(s)`],
    ["Receita UTM", formatCurrency(media.attributedRevenue), `${formatInteger(media.attributedOrders)} pedido(s)`],
    ["ROAS", formatRoas(media.roas), `CPA ${formatCurrency(media.cpa)}`],
    ["Cliques", formatInteger(media.clicks), `CPC ${formatCurrency(media.cpc)}`],
    ["CTR", formatPercent(media.ctr), `${formatInteger(media.impressions)} impressões`],
    ["Pedidos / R$1k", formatDecimal(media.ordersPer1k), media.filtered ? "campanha vinculada" : "janela completa"],
  ];
  if (planning.rows) {
    items.push(
      ["Investimento planilha", formatCurrency(planning.investmentReal || planning.investmentPlanned), `${formatInteger(planning.rows)} linha(s)`],
      ["Receita planilha", formatCurrency(planning.revenueReal || planning.revenuePlanned), `Pedidos ${formatInteger(planning.ordersReal || planning.ordersPlanned)}`],
      ["ROAS planilha", formatRoas(planning.roas), `CPA ${formatCurrency(planning.cpa)}`]
    );
  }

  target.innerHTML = items
    .map(
      ([label, value, note]) => `
        <div class="launch-media-item">
          <span>${label}</span>
          <strong>${value}</strong>
          <small>${note}</small>
        </div>
      `
    )
    .join("");
}

function collectLaunchEvents() {
  return normalizeManualEventsList(state.data.eventosManuais || [])
    .filter(isLaunchManualEvent)
    .sort((a, b) => String(a.data_inicio || a.data || "").localeCompare(String(b.data_inicio || b.data || "")));
}

function isLaunchManualEvent(event = {}) {
  const text = normalizeComparableText(
    [event.tipo, event.tipo_evento, event.categoria, event.titulo, event.nome_evento, event.observacao].join(" ")
  );
  const compact = text.replace(/\s+/g, "");
  return compact.includes("lancamento") || text.includes("launch");
}

function getLaunchProductRows() {
  const launchRows = state.data.lancamentosProdutos || [];
  return launchRows.length ? launchRows : state.data.produtos || [];
}

function getLaunchProductRowsForDate(dateKey) {
  if ((state.data.lancamentosProdutos || []).length) {
    return state.indexes.lancamentosProdutos?.[dateKey] || [];
  }
  return state.indexes.produtos?.[dateKey] || [];
}

function getLaunchProductSourceMeta() {
  const hasFullLaunchRows = Boolean((state.data.lancamentosProdutos || []).length);
  return {
    key: hasFullLaunchRows ? "lancamentos_produtos_dia" : "produtos_dia",
    label: hasFullLaunchRows ? "base completa de lancamentos" : "recorte top/queda de produtos",
    isFallback: !hasFullLaunchRows,
  };
}

function collectLaunchProducts() {
  const map = new Map();
  const modelConfigs = state.data.lancamentosModelos || [];
  getLaunchProductRows().forEach((row) => {
    const identity = launchModelIdentity(row, modelConfigs);
    const key = identity.key;
    if (!key) return;
    const variant = parseLaunchVariant(row);
    const current = map.get(key) || {
      key,
      modelKey: key,
      sku: row.sku || "",
      productKey: row.product_key || "",
      name: identity.name,
      topic: identity.topic || inferLaunchProductTopic(row, identity.name),
      launchDate: identity.config?.data_lancamento || "",
      officialLaunchDate: identity.config?.data_oficial || identity.config?.data_lancamento || "",
      config: identity.config || null,
      firstDate: row.data || "",
      lastDate: row.data || "",
      revenue: 0,
      items: 0,
      skus: new Set(),
      colors: new Map(),
      sizes: new Map(),
    };
    current.sku = current.sku || row.sku || "";
    current.productKey = current.productKey || row.product_key || "";
    current.name = current.name || identity.name;
    current.topic = current.topic || identity.topic || inferLaunchProductTopic(row, identity.name);
    current.launchDate = current.launchDate || identity.config?.data_lancamento || "";
    current.officialLaunchDate = current.officialLaunchDate || identity.config?.data_oficial || identity.config?.data_lancamento || "";
    current.firstDate = !current.firstDate || row.data < current.firstDate ? row.data : current.firstDate;
    current.lastDate = !current.lastDate || row.data > current.lastDate ? row.data : current.lastDate;
    current.revenue += Number(row.receita_produto || 0);
    current.items += Number(row.itens_vendidos || 0);
    if (row.sku) current.skus.add(row.sku);
    addLaunchBreakdownValue(current.colors, variant.color, row);
    addLaunchBreakdownValue(current.sizes, variant.size, row);
    map.set(key, current);
  });

  modelConfigs.forEach((config) => {
    const configuredModel = launchConfiguredModelIdentity(config);
    if (map.has(configuredModel.key)) return;
    map.set(configuredModel.key, {
      key: configuredModel.key,
      modelKey: configuredModel.key,
      sku: "",
      productKey: "",
      name: configuredModel.name,
      topic: config.topico || inferLaunchProductTopic({}, config.modelo),
      launchDate: config.data_lancamento || "",
      officialLaunchDate: config.data_oficial || config.data_lancamento || "",
      config,
      firstDate: config.data_lancamento || "",
      lastDate: config.data_lancamento || "",
      revenue: 0,
      items: 0,
      skus: new Set(),
      colors: new Map(),
      sizes: new Map(),
    });
  });

  return [...map.values()]
    .map((product) => ({
      ...product,
      skuCount: product.skus.size,
      colorSummary: launchBreakdownEntries(product.colors, 3),
      sizeSummary: launchBreakdownEntries(product.sizes, 8),
      skus: [...product.skus],
    }))
    .sort((a, b) => b.revenue - a.revenue || String(a.name).localeCompare(String(b.name)));
}

function matchProductKeysForLaunchEvent(event, products) {
  const terms = splitLaunchTerms(event.produto_relacionado || event.titulo || event.nome_evento || "");
  if (!terms.length) return [];
  return products
    .filter((product) => {
      const text = normalizeComparableText(`${product.name} ${product.sku} ${product.productKey} ${product.key}`);
      return terms.some((term) => text.includes(term));
    })
    .map((product) => product.key)
    .slice(0, 8);
}

function splitLaunchTerms(value = "") {
  return String(value)
    .split(/[,;|/]+/)
    .map((item) => normalizeComparableText(item))
    .filter(Boolean);
}

function launchModelAliasTerms(modelName = "") {
  const key = modelColorKey(modelName);
  return (LAUNCH_MODEL_ALIAS_TERMS[key] || []).flatMap((term) => splitLaunchTerms(term));
}

function launchModelIdentity(row = {}, configs = []) {
  const text = normalizeComparableText(`${row.product_name || ""} ${row.product_key || ""} ${row.sku || ""}`);
  const matchedConfig = configs
    .map((config) => {
      const matchedTerms = (config.termos_busca || []).filter((term) => term && text.includes(term));
      return {
        config,
        score: matchedTerms.reduce((max, term) => Math.max(max, term.length), 0),
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.config;
  if (matchedConfig) {
    const configuredModel = launchConfiguredModelIdentity(matchedConfig);
    return {
      key: configuredModel.key,
      name: configuredModel.name,
      topic: matchedConfig.topico || inferLaunchProductTopic(row, matchedConfig.modelo),
      config: matchedConfig,
    };
  }

  const pattern = LAUNCH_MODEL_PATTERNS.find((item) => item.pattern.test(text));
  const name = pattern?.name || inferLaunchFallbackModelName(row);
  const modelKey = slug(name);
  const normalizedName = normalizeComparableText(name);
  const directConfig = configs.find((config) => {
    const configName = normalizeComparableText(config.modelo || "");
    return (
      config.model_key === modelKey ||
      configName === normalizedName ||
      launchModelConfigMatchesFamily(configName, normalizedName)
    );
  });
  if (directConfig) {
    const configName = normalizeComparableText(directConfig.modelo || "");
    const useFamilyIdentity = LAUNCH_SHOE_MODEL_FAMILIES.has(modelKey) && configName !== normalizedName;
    return {
      key: useFamilyIdentity ? modelKey : directConfig.model_key,
      name: useFamilyIdentity ? name : directConfig.modelo || name,
      topic: directConfig.topico || inferLaunchProductTopic(row, directConfig.modelo || name),
      config: directConfig,
    };
  }
  return { key: modelKey, name, topic: inferLaunchProductTopic(row, name), config: null };
}

function launchModelConfigMatchesFamily(configName = "", normalizedName = "") {
  if (!LAUNCH_SHOE_MODEL_FAMILIES.has(slug(normalizedName))) {
    return normalizedName.length >= 8 && configName.includes(normalizedName);
  }
  const familyToken = normalizeComparableText(normalizedName);
  return new RegExp(`(^|\\s)${escapeRegExp(familyToken)}(\\s|$)`).test(configName);
}

function launchConfiguredModelIdentity(config = {}) {
  const text = normalizeComparableText(`${config.modelo || ""} ${(config.termos_busca || []).join(" ")}`);
  const pattern = LAUNCH_MODEL_PATTERNS.find((item) => item.pattern.test(text));
  if (pattern && LAUNCH_SHOE_MODEL_FAMILIES.has(slug(pattern.name))) {
    return { key: slug(pattern.name), name: pattern.name };
  }
  return { key: config.model_key, name: config.modelo };
}

function inferLaunchFallbackModelName(row = {}) {
  const rawName = cleanLaunchText(row.product_name || row.product_key || row.sku || "Modelo sem nome");
  const beforeVariant = rawName.split(" - ")[0].trim();
  return beforeVariant || rawName;
}

function inferLaunchProductTopic(row = {}, modelName = "") {
  const text = normalizeComparableText(
    [modelName, row.product_name, row.product_key, row.sku, row.product_type, row.tipo, row.categoria].join(" ")
  );
  const rule = LAUNCH_TOPIC_RULES.find((item) => item.pattern.test(text));
  return rule?.label || "Outros";
}

function parseLaunchVariant(row = {}) {
  const name = cleanLaunchText(row.product_name || "");
  const skuParts = String(row.sku || "")
    .toUpperCase()
    .split("-")
    .filter(Boolean);
  const variantText = cleanLaunchText(row.variant_title || name.split(" - ").slice(1).join(" - "));
  const variantParts = variantText
    .split("/")
    .map((item) => cleanLaunchText(item))
    .filter(Boolean);
  const skuSize = [...skuParts].reverse().find((part) => /^\d{2}$|^(PP|P|M|G|GG|XG|XXG)$/i.test(part));
  const skuColorCode = skuParts.find((part) => LAUNCH_COLOR_CODES[part]);
  const variantColor = variantParts.find((part) => !isLaunchSizeLabel(part));
  const variantSize = variantParts.find(isLaunchSizeLabel);
  const color =
    variantColor ||
    (skuColorCode ? LAUNCH_COLOR_CODES[skuColorCode] : "") ||
    inferColorFromName(name) ||
    "Sem cor";
  const size = variantSize || skuSize || "Sem tamanho";
  return { color, size };
}

function isLaunchSizeLabel(value = "") {
  return /^\d{2}$|^(PP|P|M|G|GG|XG|XXG)$/i.test(cleanLaunchText(value));
}

function inferColorFromName(value = "") {
  const text = normalizeComparableText(value);
  const match = LAUNCH_COLOR_WORDS.find((color) => text.includes(normalizeComparableText(color)));
  return match || "";
}

function addLaunchBreakdownValue(map, label, row = {}) {
  const normalizedLabel = cleanLaunchText(label || "Nao informado");
  const current = map.get(normalizedLabel) || { label: normalizedLabel, revenue: 0, items: 0 };
  current.revenue += Number(row.receita_produto || 0);
  current.items += Number(row.itens_vendidos || 0);
  map.set(normalizedLabel, current);
}

function launchBreakdownEntries(map, limit = 5) {
  return [...map.values()].sort((a, b) => b.items - a.items || b.revenue - a.revenue).slice(0, limit);
}

function launchProductMetaLabel(product = {}, options = {}) {
  const colorCount = product.colorSummary?.length || 0;
  const sizeCount = product.sizeSummary?.length || 0;
  const skuCount = product.skuCount || product.skus?.length || 0;
  const includeLaunchDate = options.includeLaunchDate !== false;
  const parts = [];
  if (colorCount) parts.push(`${colorCount} cor${colorCount === 1 ? "" : "es"}`);
  if (sizeCount) parts.push(`${sizeCount} tamanho${sizeCount === 1 ? "" : "s"}`);
  if (skuCount) parts.push(`${skuCount} SKU${skuCount === 1 ? "" : "s"}`);
  if (includeLaunchDate && product.launchDate) parts.push(launchProductDateLabel(product));
  return parts.join(" · ") || product.productKey || product.sku || product.key;
}

function launchProductDateLabel(product = {}) {
  return product.launchDate ? `Lanc. ${formatShortDate(product.launchDate)}` : "Sem data";
}

function launchWindowDateLabel(window = {}, product = {}) {
  if (window.launchDateAdjusted && window.launchDate) {
    const official = window.officialLaunchDate ? ` (oficial ${formatShortDate(window.officialLaunchDate)})` : "";
    return `D0 SSOT ${formatShortDate(window.launchDate)}${official}`;
  }
  if (window.launchDate) return `D0 ${formatShortDate(window.launchDate)}`;
  return launchProductDateLabel(product);
}

function renderLaunchBreakdownBars(items = [], totalItems = 0) {
  return items
    .slice(0, 3)
    .map((item) => {
      const pct = Math.min(100, Math.max(4, safeDivide(item.items, totalItems) * 100));
      return `
        <div class="launch-breakdown-row">
          <span>${escapeHtml(item.label)}</span>
          <div><i style="width:${pct}%"></i></div>
          <strong>${formatInteger(item.items)}</strong>
        </div>
      `;
    })
    .join("");
}

function renderLaunchSizeChips(items = []) {
  return items
    .slice(0, 10)
    .map((item) => `<span>${escapeHtml(item.label)} · ${formatInteger(item.items)}</span>`)
    .join("");
}

function summarizeLaunchStock(product = {}) {
  const skus = product.skus?.length ? product.skus : [product.sku].filter(Boolean);
  const rows = skus.map((sku) => state.indexes.estoque[sku]).filter(Boolean);
  if (!rows.length) return { status: "", risky: 0 };
  const risky = rows.filter((row) => isStockRisky(row.risk_status)).length;
  const status = risky ? `${risky}/${rows.length} SKU em risco` : "Saudavel";
  return { status, risky };
}

function summarizeLaunchPlanning(dateKeys, selectedProducts) {
  const selectedKeys = new Set(selectedProducts.map((product) => product.key));
  const selectedNames = selectedProducts.map((product) => normalizeComparableText(product.name));
  const selectedStart = dateKeys[0] || "";
  const selectedEnd = dateKeys[dateKeys.length - 1] || "";
  const rows = (state.data.lancamentosInvestimentos || []).filter((row) => {
    const rowKey = row.model_key || slug(row.modelo_id || row.modelo || "");
    const rowName = normalizeComparableText(row.modelo || row.modelo_id || "");
    const rowStart = row.data_inicio || selectedStart;
    const rowEnd = row.data_fim || rowStart;
    const dateMatches = !dateKeys.length || !rowStart || !(rowEnd < selectedStart || rowStart > selectedEnd);
    return dateMatches && (selectedKeys.has(rowKey) || selectedNames.some((name) => name && rowName.includes(name)));
  });
  const investmentPlanned = rows.reduce((sum, row) => sum + Number(row.investimento_planejado || 0), 0);
  const investmentReal = rows.reduce((sum, row) => sum + Number(row.investimento_real || 0), 0);
  const revenuePlanned = rows.reduce((sum, row) => sum + Number(row.receita_planejada || 0), 0);
  const revenueReal = rows.reduce((sum, row) => sum + Number(row.receita_real || 0), 0);
  const ordersPlanned = rows.reduce((sum, row) => sum + Number(row.pedidos_planejados || 0), 0);
  const ordersReal = rows.reduce((sum, row) => sum + Number(row.pedidos_reais || 0), 0);
  const investmentForEfficiency = investmentReal || investmentPlanned;
  const revenueForEfficiency = revenueReal || revenuePlanned;
  const ordersForEfficiency = ordersReal || ordersPlanned;
  return {
    rows: rows.length,
    investmentPlanned,
    investmentReal,
    revenuePlanned,
    revenueReal,
    ordersPlanned,
    ordersReal,
    roas: safeDivide(revenueForEfficiency, investmentForEfficiency),
    cpa: safeDivide(investmentForEfficiency, ordersForEfficiency),
  };
}

function filterProductRowsByKeys(dateKeys, productKeys) {
  const keySet = new Set(productKeys);
  if (!dateKeys.length || !keySet.size) return [];
  const modelConfigs = state.data.lancamentosModelos || [];
  return dateKeys
    .flatMap((dateKey) => getLaunchProductRowsForDate(dateKey))
    .filter((row) => keySet.has(launchModelIdentity(row, modelConfigs).key));
}

function summarizeLaunchWorkbenchProducts(rows, selectedProducts) {
  const byKey = new Map(
    selectedProducts.map((product) => [
      product.key,
      { key: product.key, sku: product.sku, name: product.name, revenue: 0, items: 0, colors: new Map(), sizes: new Map() },
    ])
  );
  const byVariant = new Map();
  const byColor = new Map();
  const bySize = new Map();
  const modelConfigs = state.data.lancamentosModelos || [];

  rows.forEach((row) => {
    const identity = launchModelIdentity(row, modelConfigs);
    const key = identity.key;
    const variant = parseLaunchVariant(row);
    const current = byKey.get(key) || {
      key,
      sku: row.sku || "",
      name: identity.name,
      revenue: 0,
      items: 0,
      colors: new Map(),
      sizes: new Map(),
    };
    current.sku = current.sku || row.sku || "";
    current.name = current.name || identity.name;
    current.revenue += Number(row.receita_produto || 0);
    current.items += Number(row.itens_vendidos || 0);
    addLaunchBreakdownValue(current.colors, variant.color, row);
    addLaunchBreakdownValue(current.sizes, variant.size, row);
    byKey.set(key, current);

    const variantKey = `${key}:${variant.color}:${variant.size}:${row.sku || ""}`;
    const variantItem = byVariant.get(variantKey) || {
      key: variantKey,
      modelKey: key,
      modelName: identity.name,
      sku: row.sku || "",
      name: row.product_name || identity.name,
      color: variant.color,
      size: variant.size,
      revenue: 0,
      items: 0,
    };
    variantItem.revenue += Number(row.receita_produto || 0);
    variantItem.items += Number(row.itens_vendidos || 0);
    byVariant.set(variantKey, variantItem);
    addLaunchBreakdownValue(byColor, variant.color, row);
    addLaunchBreakdownValue(bySize, variant.size, row);
  });
  const byProduct = [...byKey.values()]
    .map((item) => ({
      ...item,
      colorSummary: launchBreakdownEntries(item.colors, 3),
      sizeSummary: launchBreakdownEntries(item.sizes, 8),
    }))
    .sort((a, b) => b.revenue - a.revenue);
  return {
    revenue: byProduct.reduce((sum, item) => sum + item.revenue, 0),
    items: byProduct.reduce((sum, item) => sum + item.items, 0),
    byProduct,
    byVariant: [...byVariant.values()].sort((a, b) => b.revenue - a.revenue),
    byColor: launchBreakdownEntries(byColor, 8),
    bySize: launchBreakdownEntries(bySize, 12),
  };
}

function summarizeLaunchWorkbenchMedia(dateKeys, event) {
  const terms = splitLaunchTerms(event?.campanha_relacionada || "");
  const campaignRows = dateKeys.flatMap((dateKey) => state.indexes.campanhas[dateKey] || []);
  const utmRows = dateKeys.flatMap((dateKey) => state.indexes.utms[dateKey] || []);
  const filteredCampaignRows = terms.length
    ? campaignRows.filter((row) => matchesLaunchTerm(row, terms, ["campaign_id", "campaign_name", "platform"]))
    : campaignRows;
  const filteredUtmRows = terms.length
    ? utmRows.filter((row) => matchesLaunchTerm(row, terms, ["utm_source", "utm_medium", "utm_campaign", "channel"]))
    : utmRows;
  const investment = filteredCampaignRows.reduce((sum, row) => sum + Number(row.investimento || 0), 0);
  const impressions = filteredCampaignRows.reduce((sum, row) => sum + Number(row.impressoes || 0), 0);
  const clicks = filteredCampaignRows.reduce((sum, row) => sum + Number(row.cliques || 0), 0);
  const attributedRevenue = filteredUtmRows.reduce((sum, row) => sum + Number(row.receita || 0), 0);
  const attributedOrders = filteredUtmRows.reduce((sum, row) => sum + Number(row.pedidos || 0), 0);
  const channelMap = new Map();
  filteredUtmRows.forEach((row) => {
    const channel = classifyLaunchChannel(row);
    const current = channelMap.get(channel) || {
      channel,
      revenue: 0,
      orders: 0,
      investment: 0,
      clicks: 0,
      impressions: 0,
      rows: 0,
    };
    current.revenue += Number(row.receita || 0);
    current.orders += Number(row.pedidos || 0);
    current.rows += 1;
    channelMap.set(channel, current);
  });
  const paidChannel = channelMap.get("Midia paga") || {
    channel: "Midia paga",
    revenue: 0,
    orders: 0,
    investment: 0,
    clicks: 0,
    impressions: 0,
    rows: 0,
  };
  paidChannel.investment += investment;
  paidChannel.clicks += clicks;
  paidChannel.impressions += impressions;
  channelMap.set("Midia paga", paidChannel);
  const channelRows = [...channelMap.values()]
    .map((row) => ({
      ...row,
      roas: safeDivide(row.revenue, row.investment),
      cpa: safeDivide(row.investment, row.orders),
      conversionProxy: safeDivide(row.orders, row.clicks || row.impressions || 0),
    }))
    .sort((a, b) => b.revenue - a.revenue || b.orders - a.orders);
  return {
    filtered: Boolean(terms.length),
    campaigns: new Set(filteredCampaignRows.map((row) => row.campaign_id || row.campaign_name)).size,
    utms: new Set(filteredUtmRows.map((row) => row.utm_campaign || row.channel)).size,
    investment,
    impressions,
    clicks,
    attributedRevenue,
    attributedOrders,
    ctr: safeDivide(clicks, impressions),
    cpc: safeDivide(investment, clicks),
    roas: safeDivide(attributedRevenue, investment),
    cpa: safeDivide(investment, attributedOrders),
    ordersPer1k: safeDivide(attributedOrders, investment / 1000),
    channelRows,
  };
}

function matchesLaunchTerm(row, terms, fields) {
  const text = normalizeComparableText(fields.map((field) => row[field] || "").join(" "));
  return terms.some((term) => text.includes(term));
}

function classifyLaunchChannel(row = {}) {
  const text = normalizeComparableText(
    [row.utm_source, row.utm_medium, row.utm_campaign, row.channel, row.last_source, row.last_source_type].join(" ")
  );
  if (/(crm|email|e-mail|mail|newsletter|whatsapp|wpp|sms|push|rdstation|rd station|klaviyo|activecampaign|flow)/.test(text)) {
    return "CRM";
  }
  if (/(meta|facebook|instagram|google|ads|cpc|paid|pago|performance|max|tiktok|bing|youtube|display|search)/.test(text)) {
    return "Midia paga";
  }
  if (/(organic|organico|seo|direct|direto|referral|social|unknown|unattributed|sem-campanha)/.test(text)) {
    return "Organico / direto";
  }
  return row.channel || row.utm_source || "Outros";
}

function buildLaunchWeeklyAcceleration(productWindows, selectedProducts, event) {
  const maxDays = Math.max(0, ...productWindows.map((window) => window.actualKeys.length));
  const weekCount = Math.ceil(maxDays / 7);
  let previousRevenue = 0;
  return Array.from({ length: weekCount }, (_, index) => {
    const startIndex = index * 7;
    const endIndex = startIndex + 7;
    const weekProductRows = productWindows.flatMap((window) =>
      filterProductRowsByKeys(window.actualKeys.slice(startIndex, endIndex), [window.productKey])
    );
    const contextKeys = uniqueDateKeys(productWindows.flatMap((window) => window.actualKeys.slice(startIndex, endIndex)));
    const products = summarizeLaunchWorkbenchProducts(weekProductRows, selectedProducts);
    const metrics = getMetricSummary(contextKeys);
    const media = summarizeLaunchWorkbenchMedia(contextKeys, event);
    const topProduct = products.byProduct[0] || null;
    const variation = index === 0 ? calculateVariation(products.revenue, 0) : calculateVariation(products.revenue, previousRevenue);
    previousRevenue = products.revenue;
    return {
      label: `Semana ${index + 1}`,
      range: `D+${startIndex} a D+${Math.max(startIndex, Math.min(endIndex - 1, maxDays - 1))}`,
      revenue: products.revenue,
      items: products.items,
      orders: metrics.pedidos_aprovados,
      roas: media.roas,
      topProduct,
      variation,
      pairsPerOrder: safeDivide(products.items, metrics.pedidos_aprovados),
      dailyAverage: safeDivide(products.revenue, contextKeys.length),
    };
  });
}

function summarizeLaunchSeasonality(productWindows) {
  const keys = uniqueDateKeys(productWindows.flatMap((window) => window.actualKeys));
  if (!keys.length) return [];
  const start = keys[0];
  const end = keys[keys.length - 1];
  const events = collectEventsInRange(start, end);
  return events
    .map((event) => {
      const eventStart = event.janela_inicio || event.data_inicio || event.data || start;
      const eventEnd = event.janela_fim || event.data_fim || eventStart;
      const overlapKeys = keys.filter((dateKey) => dateKey >= eventStart && dateKey <= eventEnd);
      const baselineKeys = overlapKeys.length
        ? dateKeysBetween(addDays(overlapKeys[0], -overlapKeys.length), addDays(overlapKeys[0], -1))
        : [];
      const metrics = getMetricSummary(overlapKeys);
      const baseline = getMetricSummary(baselineKeys);
      const variation = calculateVariation(metrics.receita_total, baseline.receita_total);
      return {
        id: event.id || `${eventStart}-${event.nome_evento || event.titulo || event.tipo_evento || "evento"}`,
        title: event.nome_evento || event.titulo || "Evento sem nome",
        type: event.tipo_evento || event.tipo || event.grupo_evento || "Calendario",
        start: eventStart,
        end: eventEnd,
        days: overlapKeys.length,
        revenue: metrics.receita_total,
        orders: metrics.pedidos_aprovados,
        variation,
        role: variation.direction === "negative" ? "Ofensor" : variation.direction === "positive" ? "Promotor" : "Neutro",
      };
    })
    .sort((a, b) => Number(b.days || 0) - Number(a.days || 0) || b.revenue - a.revenue)
    .slice(0, 8);
}

function collectEventsInRange(start, end) {
  const map = new Map();
  (state.data.calendario || []).forEach((event) => {
    const eventStart = event.janela_inicio || event.data_inicio || event.data;
    const eventEnd = event.janela_fim || event.data_fim || eventStart;
    if (!rangesOverlap(eventStart, eventEnd, start, end)) return;
    const key = `${eventStart}-${eventEnd}-${event.nome_evento || event.titulo || event.tipo_evento || ""}`;
    map.set(key, event);
  });
  normalizeManualEventsList(state.data.eventosManuais || []).forEach((event) => {
    const eventStart = event.data_inicio || event.data;
    const eventEnd = event.data_fim || eventStart;
    if (!rangesOverlap(eventStart, eventEnd, start, end)) return;
    const key = `${eventStart}-${eventEnd}-${event.event_id || event.id || event.titulo || ""}`;
    map.set(key, event);
  });
  return [...map.values()];
}

function buildLaunchWorkbenchWindows(productWindows, event) {
  const selectedProducts = productWindows.map((window) => window.product);
  return [1, 7, 15, 30, 90].map((days) => {
    const productRows = productWindows.flatMap((window) =>
      filterProductRowsByKeys(window.actualKeys.slice(0, days), [window.productKey])
    );
    const contextKeys = uniqueDateKeys(productWindows.flatMap((window) => window.actualKeys.slice(0, days)));
    const products = summarizeLaunchWorkbenchProducts(productRows, selectedProducts);
    const metrics = getMetricSummary(contextKeys);
    const media = summarizeLaunchWorkbenchMedia(contextKeys, event);
    return {
      label: days === 1 ? "D0" : `D+${days - 1}`,
      productRevenue: products.revenue,
      productItems: products.items,
      orders: metrics.pedidos_aprovados,
      roas: media.roas,
    };
  });
}

function buildLaunchCurve(productWindows, selectedProducts) {
  const sourceGap = getLaunchProductSourceMeta().isFallback;
  const maxDays = Math.max(0, ...productWindows.map((window) => window.actualKeys.length));
  const labels = Array.from({ length: maxDays }, (_, index) => `D+${index}`);
  const dailyItems = labels.map((_, index) => {
    let captured = false;
    const value = productWindows.reduce((sum, window) => {
      const dateKey = window.actualKeys[index];
      if (!dateKey) return sum;
      const rows = filterProductRowsByKeys([dateKey], [window.productKey]);
      if (rows.length) captured = true;
      const items = rows.reduce(
        (rowSum, row) => rowSum + Number(row.itens_vendidos || 0),
        0
      );
      return sum + items;
    }, 0);
    return sourceGap && !captured ? null : value;
  });
  const dailyOrders = labels.map((_, index) => {
    const keys = uniqueDateKeys(productWindows.map((window) => window.actualKeys[index]).filter(Boolean));
    return getMetricSummary(keys).pedidos_aprovados;
  });
  const revenueSeries = selectedProducts.slice(0, 6).map((product) => {
    let cumulative = 0;
    const productWindow = productWindows.find((window) => window.productKey === product.key);
    return {
      label: product.name,
      values: labels.map((_, index) => {
        const dateKey = productWindow?.actualKeys[index];
        if (!dateKey) return null;
        const rows = filterProductRowsByKeys([dateKey], [product.key]);
        if (sourceGap && !rows.length) return null;
        const dayRevenue = rows.reduce(
          (sum, row) => sum + Number(row.receita_produto || 0),
          0
        );
        cumulative += dayRevenue;
        return cumulative;
      }),
    };
  });
  const itemSeries = buildLaunchCumulativeSeries(productWindows, selectedProducts, labels, "itens_vendidos", sourceGap);
  const multiplierSeries = buildLaunchMultiplierSeries(productWindows, selectedProducts, labels, sourceGap);
  const weekly = buildLaunchWeeklyCurveSeries(productWindows, selectedProducts, sourceGap);
  return {
    labels,
    dailyItems,
    dailyOrders,
    revenueSeries,
    itemSeries,
    multiplierSeries,
    weekLabels: weekly.labels,
    mixSeries: weekly.mixSeries,
    weeklyRevenueSeries: weekly.revenueSeries,
    sourceGap,
  };
}

function buildLaunchCumulativeSeries(productWindows, selectedProducts, labels, field, sourceGap) {
  const productNames = selectedProducts.slice(0, 6).map((product) => product.name);
  return selectedProducts.slice(0, 6).map((product) => {
    let cumulative = 0;
    const productWindow = productWindows.find((window) => window.productKey === product.key);
    return {
      label: product.name,
      color: launchChartColorForModel(product.name, productNames),
      fill: false,
      values: labels.map((_, dayIndex) => {
        const dateKey = productWindow?.actualKeys[dayIndex];
        if (!dateKey) return null;
        const rows = filterProductRowsByKeys([dateKey], [product.key]);
        if (sourceGap && !rows.length) return null;
        cumulative += rows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
        return cumulative;
      }),
      data: labels.map((_, dayIndex) => {
        const dateKey = productWindow?.actualKeys[dayIndex];
        if (!dateKey) return null;
        const rows = filterProductRowsByKeys([dateKey], [product.key]);
        if (sourceGap && !rows.length) return null;
        return rows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
      }),
    };
  }).map((series) => {
    let cumulative = 0;
    return {
      label: series.label,
      color: series.color,
      fill: false,
      data: series.data.map((value) => {
        if (value === null) return null;
        cumulative += value;
        return cumulative;
      }),
    };
  });
}

function buildLaunchMultiplierSeries(productWindows, selectedProducts, labels, sourceGap) {
  const productNames = selectedProducts.slice(0, 6).map((product) => product.name);
  return selectedProducts.slice(0, 6).map((product) => {
    const productWindow = productWindows.find((window) => window.productKey === product.key);
    let cumulative = 0;
    let base15 = 0;
    const values = labels.map((_, dayIndex) => {
      const dateKey = productWindow?.actualKeys[dayIndex];
      if (!dateKey) return null;
      const rows = filterProductRowsByKeys([dateKey], [product.key]);
      if (sourceGap && !rows.length) return null;
      cumulative += rows.reduce((sum, row) => sum + Number(row.receita_produto || 0), 0);
      if (dayIndex === 14) base15 = cumulative;
      const base = base15 || (dayIndex >= 14 ? cumulative : 0);
      return base ? safeDivide(cumulative, base) : null;
    });
    return {
      label: product.name,
      color: launchChartColorForModel(product.name, productNames),
      fill: false,
      data: values,
    };
  });
}

function buildLaunchWeeklyCurveSeries(productWindows, selectedProducts, sourceGap) {
  const maxDays = Math.max(0, ...productWindows.map((window) => window.actualKeys.length));
  const weekCount = Math.ceil(maxDays / 7);
  const labels = Array.from({ length: weekCount }, (_, index) => `S${index + 1}`);
  const productNames = selectedProducts.slice(0, 6).map((product) => product.name);
  const weeklyValuesByProduct = selectedProducts.slice(0, 6).map((product) => {
    const productWindow = productWindows.find((window) => window.productKey === product.key);
    return labels.map((_, weekIndex) => {
      const start = weekIndex * 7;
      const keys = productWindow?.actualKeys.slice(start, start + 7) || [];
      const rows = keys.flatMap((dateKey) => filterProductRowsByKeys([dateKey], [product.key]));
      if (sourceGap && !rows.length) return null;
      return rows.reduce((sum, row) => sum + Number(row.receita_produto || 0), 0);
    });
  });
  const weeklyTotals = labels.map((_, weekIndex) =>
    weeklyValuesByProduct.reduce((sum, values) => sum + Number(values[weekIndex] || 0), 0)
  );
  return {
    labels,
    revenueSeries: selectedProducts.slice(0, 6).map((product, index) => ({
      label: product.name,
      color: launchChartColorForModel(product.name, productNames),
      fill: false,
      data: weeklyValuesByProduct[index] || [],
    })),
    mixSeries: selectedProducts.slice(0, 6).map((product, index) => ({
      label: product.name,
      color: launchChartColorForModel(product.name, productNames),
      fill: false,
      data: (weeklyValuesByProduct[index] || []).map((value, weekIndex) => safeDivide(value, weeklyTotals[weekIndex])),
    })),
  };
}

function launchChartColorForModel(modelName, modelNames = []) {
  return getLaunchColor(modelName, modelNames).line;
}

function getLaunchColor(modelName, modelNames = []) {
  const key = modelColorKey(modelName);
  if (LAUNCH_PALETTE[key]) return LAUNCH_PALETTE[key];

  const sheetKeys = (state.data.lancamentosModelos || []).map((model) => modelColorKey(model.modelo));
  const sortedKeys = [...new Set(sheetKeys.length ? sheetKeys : modelNames.map(modelColorKey).filter(Boolean))]
    .filter((item) => !LAUNCH_PALETTE[item])
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
  const index = sortedKeys.indexOf(key);
  const paletteIndex =
    index < 0 ? stableStringIndex(key, LAUNCH_MODEL_COLOR_PALETTE.length) : index % LAUNCH_MODEL_COLOR_PALETTE.length;
  const line = LAUNCH_MODEL_COLOR_PALETTE[paletteIndex];
  return { line, fill: colorWithAlpha(line, paletteIndex === 1 ? 0.06 : 0.08) };
}

function modelColorKey(value = "") {
  return slug(value).replace(/-/g, "");
}

function stableStringIndex(value, modulo) {
  const text = String(value || "");
  const hash = Array.from(text).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 9973, 17);
  return hash % modulo;
}

function getDataCutoffKey() {
  const analyticsCutoff = state.data.analytics?.data_cutoff || state.data.dataQuality?.data_cutoff;
  if (analyticsCutoff) return analyticsCutoff;
  return (state.data.kpis || [])
    .map((row) => row.data)
    .filter(Boolean)
    .sort()
    .pop();
}

function safeDivide(numerator, denominator) {
  const den = Number(denominator || 0);
  if (!den) return 0;
  return Number(numerator || 0) / den;
}

function renderReadinessPlaybookItems(items = []) {
  if (!items.length) {
    return `
      <article class="readiness-card readiness-monitorar">
        <div class="readiness-card-head">
          <span>Sem data critica</span>
          <strong>Monitorar</strong>
        </div>
        <h4>Nenhuma frente sazonal ativa</h4>
        <p>Nao ha data comercial relevante nos proximos 90 dias.</p>
      </article>
    `;
  }

  return items
    .map((item) => {
      const checklist = (item.checklist || [])
        .slice(0, 4)
        .map(
          (task) => `
            <li>
              <span>${escapeHtml(task.area || "-")}</span>
              <strong class="task-${slug(task.status || "status")}">${escapeHtml(task.status || "-")}</strong>
              <small>${escapeHtml(task.owner || "-")}</small>
            </li>
          `
        )
        .join("");
      const blockers = (item.blockers || [])
        .slice(0, 3)
        .map((blocker) => `<span>${escapeHtml(blocker)}</span>`)
        .join("");

      return `
        <article class="readiness-card readiness-${slug(item.status || "monitorar")}">
          <div class="readiness-card-head">
            <span>${escapeHtml(item.status || "monitorar")}</span>
            <strong>${formatInteger(item.score || 0)}% pronto</strong>
          </div>
          <h4>${escapeHtml(item.name || "-")}</h4>
          <p>${formatShortDate(item.date)} Â· faltam ${formatInteger(item.days_until)} dia(s)</p>
          <div class="readiness-metrics">
            <span>Lacuna: <strong>${formatCurrency(item.revenue_gap || 0)}</strong></span>
            <span>Ritmo diario: <strong>${formatCurrency(item.daily_required || 0)}</strong></span>
          </div>
          <ul class="readiness-checklist">${checklist}</ul>
          ${blockers ? `<div class="readiness-blockers">${blockers}</div>` : ""}
          <footer>${escapeHtml(item.main_action || "")}</footer>
        </article>
      `;
    })
    .join("");
}

function renderActionPlanItems(items = []) {
  if (!items.length) {
    return `<li><strong>Sem acao pendente</strong><span>O playbook nao encontrou pendencias executivas para as proximas datas.</span></li>`;
  }

  return items
    .map(
      (item) => `
        <li class="action-${slug(item.status || "planejar")}">
          <div>
            <strong>${escapeHtml(item.action || "-")}</strong>
            <span>${escapeHtml(item.event_name || "-")} &middot; ${escapeHtml(item.area || "-")}</span>
          </div>
          <div>
            <span>Dono: <strong>${escapeHtml(item.owner || "-")}</strong></span>
            <span>Prazo: <strong>${formatShortDate(item.due_date)}</strong></span>
            <span>Status: <strong>${escapeHtml(item.status || "-")}</strong></span>
          </div>
        </li>
      `
    )
    .join("");
}

function renderSummaryFluctuation() {
  const target = document.getElementById("summaryFluctuation");
  const context = buildComparisonContextForPeriod(resolveActivePeriod());
  if (!context) {
    target.hidden = true;
    target.innerHTML = "";
    return;
  }

  target.hidden = false;
  target.innerHTML = renderFluctuationPanel(context, "summary", true);
}

function renderCharts() {
  const period = resolveActivePeriod();
  const comparisonContext = buildComparisonContextForPeriod(period);
  const currentKeys =
    comparisonContext && state.compareMode !== "none"
      ? comparisonContext.current.keys || period.keys
      : period.keys;
  const comparisonKeys =
    comparisonContext && state.compareMode !== "none"
      ? comparisonContext.baseline.keys || []
      : [];

  const chartConfigs = [
    {
      canvasId: "revenueChart",
      label: "Faturamento",
      formatter: formatCurrency,
      value: (dateKey) => getKpi(dateKey).receita_total,
    },
    {
      canvasId: "ordersChart",
      label: "Pedidos",
      formatter: formatInteger,
      value: (dateKey) => getKpi(dateKey).pedidos_aprovados,
    },
    {
      canvasId: "ticketChart",
      label: "Ticket médio",
      formatter: formatCurrency,
      value: (dateKey) => getKpi(dateKey).ticket_medio,
    },
    {
      canvasId: "conversionChart",
      label: "Conversão",
      formatter: (value) => `${formatDecimal(value)}%`,
      value: (dateKey) => getKpi(dateKey).taxa_conversao * 100,
    },
    {
      canvasId: "roasChart",
      label: "ROAS",
      formatter: formatRoas,
      value: (dateKey) => getKpi(dateKey).roas_mkt,
    },
    {
      canvasId: "addToCartChart",
      label: "Add to cart",
      formatter: formatInteger,
      value: (dateKey) => Number(getFunil(dateKey).add_to_cart || 0),
    },
    {
      canvasId: "checkoutChart",
      label: "Checkout",
      formatter: formatInteger,
      value: (dateKey) => Number(getFunil(dateKey).begin_checkout || 0),
    },
  ];

  chartConfigs.forEach((config) => {
    const aligned = alignComparisonData(currentKeys, comparisonKeys, config.value);
    const hasComparison = comparisonKeys.length > 0;
    const labels = hasComparison
      ? aligned.map((row) => row.label)
      : currentKeys.map((dateKey) => formatShortDate(dateKey));
    const datasets = hasComparison
      ? [
          {
            label: "Atual",
            data: aligned.map((row) => row.valorAtual),
            color: "#1e5a49",
            fill: true,
          },
          {
            label: "Comparado",
            data: aligned.map((row) => row.valorComparado),
            color: "#b98d43",
            fill: false,
          },
        ]
      : [
          {
            label: config.label,
            data: aligned.map((row) => row.valorAtual),
            color: config.canvasId === "ordersChart" ? "#b98d43" : "#1e5a49",
            fill: true,
          },
        ];
    renderChart(config.canvasId, labels, datasets, config.formatter);
  });
}

function alignComparisonData(currentKeys, comparisonKeys, valueGetter) {
  const length = Math.max(currentKeys.length, comparisonKeys.length, 1);
  return Array.from({ length }, (_, index) => {
    const currentKey = currentKeys[index] || "";
    const comparisonKey = comparisonKeys[index] || "";
    return {
      label: comparisonKeys.length ? `D${index + 1}` : currentKey ? formatShortDate(currentKey) : `D${index + 1}`,
      dataAtual: currentKey,
      valorAtual: currentKey ? valueGetter(currentKey) : null,
      dataComparada: comparisonKey,
      valorComparado: comparisonKey ? valueGetter(comparisonKey) : null,
    };
  });
}

function renderChart(canvasId, labels, datasets, formatter) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (!window.Chart) {
    renderFallbackChart(canvas, datasets, formatter);
    return;
  }

  configureChartDefaults();

  canvas.style.display = "block";
  const fallback = canvas.parentElement.querySelector(".fallback-chart");
  if (fallback) fallback.remove();

  if (state.charts[canvasId]) {
    state.charts[canvasId].destroy();
  }

  const chartDatasets = normalizeChartDatasets(canvasId, datasets);
  const tickFormatter = formatter === formatCurrency ? formatChartCompactCurrency : formatter;
  const isCurrencyChart = formatter === formatCurrency;

  state.charts[canvasId] = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: chartDatasets.map((dataset) => ({
        label: dataset.label,
        data: dataset.data,
        borderColor: dataset.color,
        backgroundColor: dataset.fill ? dataset.fillColor || colorWithAlpha(dataset.color, 0.08) : "rgba(255, 255, 255, 0)",
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: dataset.color,
        pointBorderWidth: 1.5,
        fill: dataset.fill,
        tension: 0.35,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: chartDatasets.length > 1,
          position: "top",
          align: "start",
          labels: {
            boxWidth: 8,
            boxHeight: 8,
            color: CHART_TEXT_COLOR,
            font: { family: CHART_FONT_FAMILY, size: 11, weight: "600" },
            padding: 14,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: "#12372f",
          borderWidth: 0,
          cornerRadius: 6,
          displayColors: true,
          padding: 10,
          titleColor: "#ffffff",
          titleFont: { family: CHART_FONT_FAMILY, size: 11, weight: "700" },
          bodyColor: "rgba(255, 255, 255, 0.82)",
          bodyFont: { family: CHART_FONT_FAMILY, size: 11 },
          callbacks: {
            label: (context) =>
              isCurrencyChart
                ? ` ${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
                : ` ${context.dataset.label}: ${formatter(context.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          border: { display: false },
          grid: { display: false, drawBorder: false },
          ticks: {
            color: CHART_TEXT_COLOR,
            font: { family: CHART_FONT_FAMILY, size: 11 },
            padding: 6,
            maxRotation: 45,
            minRotation: 0,
          },
        },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: CHART_GRID_COLOR, drawBorder: false },
          ticks: {
            color: CHART_TEXT_COLOR,
            font: { family: CHART_FONT_FAMILY, size: 11 },
            padding: 6,
            callback: (value) => tickFormatter(value),
          },
        },
      },
    },
  });
}

function configureChartDefaults() {
  if (!window.Chart) return;
  Chart.defaults.plugins = Chart.defaults.plugins || {};
  Chart.defaults.plugins.legend = Chart.defaults.plugins.legend || {};
  Chart.defaults.plugins.legend.labels = Chart.defaults.plugins.legend.labels || {};
  Chart.defaults.plugins.tooltip = Chart.defaults.plugins.tooltip || {};
  Chart.defaults.scale = Chart.defaults.scale || {};
  Chart.defaults.scale.grid = Chart.defaults.scale.grid || {};
  Chart.defaults.scale.border = Chart.defaults.scale.border || {};
  Chart.defaults.scale.ticks = Chart.defaults.scale.ticks || {};
  Chart.defaults.font.family = CHART_FONT_FAMILY;
  Chart.defaults.font.size = 11;
  Chart.defaults.color = CHART_TEXT_COLOR;
  Chart.defaults.borderColor = CHART_GRID_COLOR;
  Chart.defaults.plugins.legend.align = "start";
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.boxWidth = 8;
  Chart.defaults.plugins.tooltip.backgroundColor = "#12372f";
  Chart.defaults.plugins.tooltip.titleColor = "#ffffff";
  Chart.defaults.plugins.tooltip.bodyColor = "rgba(255, 255, 255, 0.82)";
  Chart.defaults.plugins.tooltip.cornerRadius = 6;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.borderWidth = 0;
  Chart.defaults.scale.grid.color = "rgba(18, 55, 47, 0.06)";
  Chart.defaults.scale.grid.drawTicks = false;
  Chart.defaults.scale.border.display = false;
  Chart.defaults.scale.ticks.padding = 6;
}

function normalizeChartDatasets(canvasId, datasets) {
  const modelNames = datasets.map((dataset) => dataset.model || dataset.label).filter(Boolean);
  return datasets.map((dataset, index) => {
    const label = dataset.label || `Serie ${index + 1}`;
    const colorConfig = resolveChartDatasetColor(canvasId, dataset, index, modelNames);
    return {
      ...dataset,
      label,
      data: dataset.data || dataset.values || [],
      color: colorConfig.line,
      fillColor: colorConfig.fill,
      fill: Boolean(dataset.fill),
    };
  });
}

function resolveChartDatasetColor(canvasId, dataset, index, modelNames) {
  const label = dataset.model || dataset.label || "";
  if (LAUNCH_CHART_CANVAS_IDS.has(canvasId) && isLaunchModelLabel(label)) {
    return getLaunchColor(label, modelNames);
  }
  const line = dataset.color || CHART_FALLBACK_COLORS[index % CHART_FALLBACK_COLORS.length];
  return { line, fill: colorWithAlpha(line, 0.08) };
}

function isLaunchModelLabel(label) {
  return Boolean(modelColorKey(label)) && !["itensmodelo", "pedidoscontexto", "atual", "comparado"].includes(modelColorKey(label));
}

function colorWithAlpha(color, alpha) {
  const hex = String(color || "").replace("#", "").trim();
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    const [r, g, b] = hex.split("").map((char) => parseInt(char + char, 16));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    const value = parseInt(hex, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return "rgba(61, 82, 32, 0.08)";
}

function renderFallbackChart(canvas, datasets, formatter) {
  canvas.style.display = "none";
  const parent = canvas.parentElement;
  const oldFallback = parent.querySelector(".fallback-chart");
  if (oldFallback) oldFallback.remove();

  const values = (datasets[0].data || datasets[0].values || []).map((value) => Number(value || 0));
  const max = Math.max(...values, 1);
  const bars = values
    .map((value) => {
      const height = Math.max(4, (value / max) * 180);
      return `<span class="fallback-bar" style="height:${height}px"><span>${formatter(value)}</span></span>`;
    })
    .join("");
  parent.insertAdjacentHTML("beforeend", `<div class="fallback-chart">${bars}</div>`);
}

function renderTables() {
  const period = resolveActivePeriod();
  const comparisonContext = buildComparisonContextForPeriod(period);
  const comparisonActive = Boolean(
    comparisonContext &&
      state.compareMode !== "none" &&
      comparisonContext.baseline.keys &&
      comparisonContext.baseline.keys.length
  );

  renderProductsTable(period, comparisonContext, comparisonActive);
  renderCampaignsTable(period, comparisonContext, comparisonActive);
}

function renderProductsTable(period, comparisonContext, comparisonActive) {
  const body = document.getElementById("productsTable");
  const head = document.getElementById("productsTableHead");
  const panel = document.getElementById("productsPanel");
  const subtext = document.getElementById("productsTableSubtext");
  const products = period.keys.flatMap((dateKey) => state.indexes.produtos[dateKey] || []);

  setTableComparisonState(
    panel,
    subtext,
    comparisonActive,
    "Produtos comparados entre período atual e período selecionado para comparação",
    comparisonContext
  );

  if (comparisonActive) {
    head.innerHTML = `
      <tr>
        <th>Produto</th>
        <th>Classificação</th>
        <th class="numeric-cell">Itens atual</th>
        <th class="numeric-cell">Itens comparado</th>
        <th class="numeric-cell">Var. itens %</th>
        <th class="numeric-cell">Receita atual</th>
        <th class="numeric-cell">Receita comparada</th>
        <th class="numeric-cell">Var. receita %</th>
        <th>Estoque</th>
        <th>Status</th>
      </tr>
    `;
    renderProductsComparisonTable(body, products, comparisonContext);
    return;
  }

  head.innerHTML = `
    <tr>
      <th>Produto</th>
      <th>Classificação</th>
      <th class="numeric-cell">Itens</th>
      <th class="numeric-cell">Receita</th>
      <th>Estoque</th>
    </tr>
  `;

  const grouped = aggregateProducts(products).slice(0, 10);

  body.innerHTML =
    grouped
      .map((item) => {
        const stock = state.indexes.estoque[item.sku] || {};
        const warning = stock.risk_status && stock.risk_status !== "Saudável";
        return `
          <tr>
            <td><strong>${item.product_name}</strong><br><span>${item.variant_title || item.sku}</span></td>
            <td><span class="status-chip ${item.classificacao === "queda" ? "warning" : ""}">${capitalize(item.classificacao)}</span></td>
            <td class="numeric-cell">${formatInteger(item.itens_vendidos)}</td>
            <td class="numeric-cell">${formatCurrency(item.receita_produto)}</td>
            <td><span class="status-chip ${warning ? "warning" : ""}">${stock.risk_status || "-"}</span></td>
          </tr>
        `;
      })
      .join("") || emptyTableRow(5);
}

function renderCampaignsTable(period, comparisonContext, comparisonActive) {
  const body = document.getElementById("campaignsTable");
  const head = document.getElementById("campaignsTableHead");
  const panel = document.getElementById("campaignsPanel");
  const subtext = document.getElementById("campaignsTableSubtext");
  const activeKeys = period.keys;
  const campaigns = activeKeys.flatMap((dateKey) => state.indexes.campanhas[dateKey] || []);
  const utms = activeKeys.flatMap((dateKey) => state.indexes.utms[dateKey] || []);

  setTableComparisonState(
    panel,
    subtext,
    comparisonActive,
    "Origem da receita no período atual versus período comparado",
    comparisonContext
  );

  if (comparisonActive) {
    head.innerHTML = `
      <tr>
        <th>Origem</th>
        <th>Nome</th>
        <th class="numeric-cell">Pedidos atual</th>
        <th class="numeric-cell">Pedidos comparado</th>
        <th class="numeric-cell">Var. pedidos %</th>
        <th class="numeric-cell">Receita atual</th>
        <th class="numeric-cell">Receita comparada</th>
        <th class="numeric-cell">Var. receita %</th>
        <th class="numeric-cell">ROAS atual</th>
        <th class="numeric-cell">ROAS comparado</th>
        <th class="numeric-cell">Var. ROAS %</th>
      </tr>
    `;
    renderAcquisitionComparisonTable(body, campaigns, utms, comparisonContext);
    return;
  }

  head.innerHTML = `
    <tr>
      <th>Origem</th>
      <th>Nome</th>
      <th class="numeric-cell">Pedidos</th>
      <th class="numeric-cell">Receita</th>
      <th class="numeric-cell">ROAS</th>
    </tr>
  `;

  const rows = [
    ...aggregateCampaigns(campaigns).slice(0, 5).map((item) => ({
      source: item.platform,
      name: item.campaign_name,
      orders: item.pedidos_atribuidos,
      revenue: item.receita_atribuida,
      roas: item.roas,
    })),
    ...aggregateUtms(utms).slice(0, 5).map((item) => ({
      source: item.utm_source,
      name: item.utm_campaign,
      orders: item.pedidos,
      revenue: item.receita,
      roas: null,
    })),
  ];

  body.innerHTML =
    rows
      .map(
        (row) => `
          <tr>
            <td>${row.source}</td>
            <td><strong>${row.name}</strong></td>
            <td class="numeric-cell">${formatInteger(row.orders)}</td>
            <td class="numeric-cell">${formatCurrency(row.revenue)}</td>
            <td class="numeric-cell">${row.roas === null ? "-" : formatRoas(row.roas)}</td>
          </tr>
        `
      )
      .join("") || emptyTableRow(5);
}

function setTableComparisonState(panel, subtext, comparisonActive, description, comparisonContext) {
  panel.classList.toggle("is-comparison-table", comparisonActive);
  if (!subtext) return;

  subtext.hidden = !comparisonActive;
  subtext.innerHTML = comparisonActive
    ? `${description}<br><span class="comparison-badge">Comparando com: ${comparisonContext.baseline.label}</span>`
    : "";
}

function renderProductsComparisonTable(body, currentRows, comparisonContext) {
  const comparedRows = comparisonContext.baseline.keys.flatMap((dateKey) => state.indexes.produtos[dateKey] || []);
  const currentMap = aggregateProductsByComparisonKey(currentRows);
  const comparedMap = aggregateProductsByComparisonKey(comparedRows);
  const keys = [...new Set([...currentMap.keys(), ...comparedMap.keys()])];
  const rows = keys
    .map((key) => {
      const current = currentMap.get(key) || makeEmptyProduct(comparedMap.get(key), key);
      const compared = comparedMap.get(key) || makeEmptyProduct(current, key);
      const stock = state.indexes.estoque[current.sku || compared.sku] || {};
      const itemVariation = calculateVariation(current.itens_vendidos, compared.itens_vendidos);
      const revenueVariation = calculateVariation(current.receita_produto, compared.receita_produto);
      return {
        key,
        current,
        compared,
        stock,
        itemVariation,
        revenueVariation,
        classification: classifyProductComparison(current, compared, stock, itemVariation, revenueVariation),
      };
    })
    .sort((a, b) => {
      const aWeight = a.current.receita_produto + a.compared.receita_produto + Math.abs(a.revenueVariation.absoluteChange);
      const bWeight = b.current.receita_produto + b.compared.receita_produto + Math.abs(b.revenueVariation.absoluteChange);
      return bWeight - aWeight;
    })
    .slice(0, 12);

  body.innerHTML =
    rows
      .map((row) => {
        const status = row.stock.risk_status || "-";
        const statusWarning = isStockRisky(status);
        return `
          <tr>
            <td>
              <strong>${row.current.product_name || row.compared.product_name || row.key}</strong>
              <br><span>${row.current.variant_title || row.compared.variant_title || row.current.sku || row.compared.sku || "-"}</span>
            </td>
            <td><span class="status-chip ${classificationClass(row.classification)}">${row.classification}</span></td>
            <td class="numeric-cell">${formatInteger(row.current.itens_vendidos)}</td>
            <td class="numeric-cell">${formatInteger(row.compared.itens_vendidos)}</td>
            <td class="numeric-cell">${variationBadge(row.itemVariation)}</td>
            <td class="numeric-cell">${formatCurrency(row.current.receita_produto)}</td>
            <td class="numeric-cell">${formatCurrency(row.compared.receita_produto)}</td>
            <td class="numeric-cell">${variationBadge(row.revenueVariation)}</td>
            <td class="numeric-cell">${row.stock.stock_available === undefined ? "-" : formatInteger(row.stock.stock_available)}</td>
            <td><span class="status-chip ${statusWarning ? "warning" : ""}">${status}</span></td>
          </tr>
        `;
      })
      .join("") || emptyTableRow(10);
}

function renderAcquisitionComparisonTable(body, currentCampaignRows, currentUtmRows, comparisonContext) {
  const comparedCampaignRows = comparisonContext.baseline.keys.flatMap(
    (dateKey) => state.indexes.campanhas[dateKey] || []
  );
  const comparedUtmRows = comparisonContext.baseline.keys.flatMap((dateKey) => state.indexes.utms[dateKey] || []);
  const currentMap = aggregateAcquisitionByComparisonKey(currentCampaignRows, currentUtmRows);
  const comparedMap = aggregateAcquisitionByComparisonKey(comparedCampaignRows, comparedUtmRows);
  const keys = [...new Set([...currentMap.keys(), ...comparedMap.keys()])];
  const rows = keys
    .map((key) => {
      const current = currentMap.get(key) || makeEmptyAcquisition(comparedMap.get(key), key);
      const compared = comparedMap.get(key) || makeEmptyAcquisition(current, key);
      const ordersVariation = calculateVariation(current.orders, compared.orders);
      const revenueVariation = calculateVariation(current.revenue, compared.revenue);
      const roasVariation = calculateRoasVariation(current.roas, compared.roas);
      return {
        key,
        current,
        compared,
        ordersVariation,
        revenueVariation,
        roasVariation,
        status: classifyAcquisitionComparison(current, compared, revenueVariation, ordersVariation),
      };
    })
    .sort((a, b) => {
      const aWeight = a.current.revenue + a.compared.revenue + Math.abs(a.revenueVariation.absoluteChange);
      const bWeight = b.current.revenue + b.compared.revenue + Math.abs(b.revenueVariation.absoluteChange);
      return bWeight - aWeight;
    })
    .slice(0, 12);

  body.innerHTML =
    rows
      .map(
        (row) => `
          <tr>
            <td>${row.current.source || row.compared.source || "-"}</td>
            <td>
              <strong>${row.current.name || row.compared.name || row.key}</strong>
              ${row.status ? `<br><span class="status-chip ${classificationClass(row.status)}">${row.status}</span>` : ""}
            </td>
            <td class="numeric-cell">${formatInteger(row.current.orders)}</td>
            <td class="numeric-cell">${formatInteger(row.compared.orders)}</td>
            <td class="numeric-cell">${variationBadge(row.ordersVariation)}</td>
            <td class="numeric-cell">${formatCurrency(row.current.revenue)}</td>
            <td class="numeric-cell">${formatCurrency(row.compared.revenue)}</td>
            <td class="numeric-cell">${variationBadge(row.revenueVariation)}</td>
            <td class="numeric-cell">${formatOptionalRoas(row.current.roas)}</td>
            <td class="numeric-cell">${formatOptionalRoas(row.compared.roas)}</td>
            <td class="numeric-cell">${variationBadge(row.roasVariation)}</td>
          </tr>
        `
      )
      .join("") || emptyTableRow(11);
}

function getMonthDateKeys() {
  const daysInMonth = new Date(state.year, state.month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) =>
    toDateKey(state.year, state.month + 1, index + 1)
  );
}

function resolveActivePeriod() {
  const base = getBaseSelectedPeriod();

  if (state.periodType === "today") {
    return makePeriod([currentDateKey()], "Hoje");
  }

  if (state.periodType === "yesterday") {
    return makePeriod([currentDateKey(-1)], "Ontem");
  }

  if (state.periodType === "selectedDay") {
    const key = state.selectedDate || state.selectionStart || toDateKey(state.year, state.month + 1, 1);
    return makePeriod([key], "Dia selecionado");
  }

  if (state.periodType === "selectedPeriod") {
    return makePeriod(base.keys, "Período selecionado");
  }

  if (state.periodType === "previous7") return makePeriod(relativeDayRange(base.start, -7, -1), "7 dias anteriores");
  if (state.periodType === "next7") return makePeriod(relativeDayRange(base.end, 1, 7), "7 dias posteriores");
  if (state.periodType === "previous15") return makePeriod(relativeDayRange(base.start, -15, -1), "15 dias anteriores");
  if (state.periodType === "next15") return makePeriod(relativeDayRange(base.end, 1, 15), "15 dias posteriores");
  if (state.periodType === "previous30") return makePeriod(relativeDayRange(base.start, -30, -1), "30 dias anteriores");
  if (state.periodType === "next30") return makePeriod(relativeDayRange(base.end, 1, 30), "30 dias posteriores");
  if (state.periodType === "last7") return makePeriod(relativeDayRange(base.end, -6, 0), "Últimos 7 dias");
  if (state.periodType === "last15") return makePeriod(relativeDayRange(base.end, -14, 0), "Últimos 15 dias");
  if (state.periodType === "last30") return makePeriod(relativeDayRange(base.end, -29, 0), "Últimos 30 dias");

  if (state.periodType === "previousMonthPeriod") {
    const shifted = new Date(state.year, state.month - 1, 1);
    return makePeriod(getMonthDateKeysFor(shifted.getFullYear(), shifted.getMonth()), "Mês anterior");
  }

  if (state.periodType === "nextMonthPeriod") {
    const shifted = new Date(state.year, state.month + 1, 1);
    return makePeriod(getMonthDateKeysFor(shifted.getFullYear(), shifted.getMonth()), "Mês posterior");
  }

  if (state.periodType === "previousYearPeriod") {
    return makePeriod(shiftPeriodByYears(base.keys, -1), "Ano anterior");
  }

  if (state.periodType === "nextYearPeriod") {
    return makePeriod(shiftPeriodByYears(base.keys, 1), "Ano posterior");
  }

  if (state.periodType === "fullCurrentYear") {
    return makePeriod(dateKeysBetween(`${state.year}-01-01`, `${state.year}-12-31`), "Ano atual completo");
  }

  if (state.periodType === "freePeriod") {
    const start = state.freePeriodStart || base.start;
    const end = state.freePeriodEnd || state.freePeriodStart || base.end;
    return makePeriod(dateKeysBetween(...sortDateKeys(start, end)), "Data livre");
  }

  return makePeriod(getMonthDateKeysFor(state.year, state.month), "Mês atual completo");
}

function getBaseSelectedPeriod() {
  if (state.selectionStart && state.selectionEnd) {
    return makePeriod(dateKeysBetween(state.selectionStart, state.selectionEnd), "Período selecionado");
  }
  if (state.selectedDate) {
    return makePeriod([state.selectedDate], "Dia selecionado");
  }
  return makePeriod(getMonthDateKeysFor(state.year, state.month), "Mês atual completo");
}

function getCalendarSelectionPeriod() {
  if (state.selectionStart && state.selectionEnd) {
    return makePeriod(dateKeysBetween(state.selectionStart, state.selectionEnd), "Período selecionado");
  }
  if (state.selectedDate) {
    return makePeriod([state.selectedDate], "Data selecionada");
  }
  return makePeriod([], "");
}

function makePeriod(keys, typeLabel) {
  const sortedKeys = [...new Set(keys.filter(Boolean))].sort();
  const start = sortedKeys[0] || "";
  const end = sortedKeys[sortedKeys.length - 1] || start;
  const label =
    start && end && start !== end
      ? `${formatShortDate(start)} a ${formatShortDate(end)}`
      : start
        ? formatShortDate(start)
        : "sem período";
  return { start, end, keys: sortedKeys, label, typeLabel };
}

function relativeDayRange(anchorKey, startOffset, endOffset) {
  return dateKeysBetween(addDays(anchorKey, startOffset), addDays(anchorKey, endOffset));
}

function shiftPeriodByYears(keys, years) {
  return [...new Set(keys.map((key) => shiftDateKey(key, years, 0)))].sort();
}

function shiftPeriodByMonths(keys, months) {
  return [...new Set(keys.map((key) => shiftDateKey(key, 0, months)))].sort();
}

function shiftDateKey(dateKey, years, months) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const shiftedMonth = new Date(year + years, month - 1 + months, 1);
  const shiftedYear = shiftedMonth.getFullYear();
  const shiftedMonthIndex = shiftedMonth.getMonth();
  const lastDay = new Date(shiftedYear, shiftedMonthIndex + 1, 0).getDate();
  return toDateKey(shiftedYear, shiftedMonthIndex + 1, Math.min(day, lastDay));
}

function addDays(dateKey, amount) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return toDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function daysBetweenDateKeys(start, end) {
  if (!start || !end) return 0;
  const [startYear, startMonth, startDay] = start.split("-").map(Number);
  const [endYear, endMonth, endDay] = end.split("-").map(Number);
  const startDate = Date.UTC(startYear, startMonth - 1, startDay);
  const endDate = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.round((endDate - startDate) / 86400000);
}

function currentDateKey(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return toDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function sortDateKeys(a, b) {
  return a <= b ? [a, b] : [b, a];
}

function getEventsForDate(dateKey) {
  const filters = activeFilters();
  return [...(state.data.calendario || []), ...getManualEventsForDate(dateKey)]
    .filter((event) => filters.has(event.tipo_evento) || filters.has(event.categoria))
    .filter((event) => {
      const start = event.janela_inicio || event.data;
      const end = event.janela_fim || event.data;
      return dateKey >= start && dateKey <= end;
    })
    .sort((a, b) => priorityScore(b.prioridade) - priorityScore(a.prioridade));
}

function getEventsForPeriod(dateKeys) {
  const map = new Map();
  dateKeys.forEach((dateKey) => {
    getEventsForDate(dateKey).forEach((event) => {
      const key = event.id || `${event.nome_evento}-${event.janela_inicio}-${event.janela_fim}`;
      map.set(key, event);
    });
  });
  return [...map.values()].sort((a, b) => priorityScore(b.prioridade) - priorityScore(a.prioridade));
}

function getManualEventsForDate(dateKey) {
  return (state.data.eventosManuais || [])
    .filter(isActiveManualEvent)
    .filter((event) => {
      const start = event.data_inicio || event.data;
      const end = event.data_fim || start;
      return dateKey >= start && dateKey <= end;
    })
    .map(normalizeManualEvent);
}

function normalizeManualEvent(event) {
  const start = event.data_inicio || event.data;
  const end = event.data_fim || start;
  return {
    ...event,
    data: start,
    nome_evento: event.titulo || "Evento manual",
    grupo_evento: event.campanha_relacionada || event.titulo || event.tipo || "Evento manual",
    tipo_evento: event.tipo || "Campanha",
    categoria: event.categoria || categoryFromManualType(event.tipo),
    prioridade: event.prioridade || "Média",
    janela_inicio: start,
    janela_fim: end,
    observacao: event.observacao || "",
    manual: true,
  };
}

function getKpi(dateKey) {
  const row = state.indexes.kpis[dateKey] || {};
  const revenue = Number(row.receita_total || 0);
  const orders = Number(row.pedidos_aprovados || 0);
  const investment = Number(row.investimento_total_mkt || 0);
  const sessions = Number(row.sessoes || 0);
  return {
    receita_total: revenue,
    pedidos_aprovados: orders,
    ticket_medio: Number(row.ticket_medio || (orders ? revenue / orders : 0)),
    sessoes: sessions,
    taxa_conversao: Number(row.taxa_conversao || (sessions ? orders / sessions : 0)),
    investimento_total_mkt: investment,
    roas_mkt: Number(row.roas_mkt || (investment ? revenue / investment : 0)),
    cps_mkt: Number(row.cps_mkt || (sessions ? investment / sessions : 0)),
    clientes_novos: Number(row.clientes_novos || 0),
    clientes_recorrentes: Number(row.clientes_recorrentes || 0),
  };
}

function getFunil(dateKey) {
  return state.indexes.funil[dateKey] || {};
}

function buildComparisonContextForPeriod(period, event = null) {
  if (!period.keys.length || state.compareMode === "none") return null;

  if (state.compareMode === "previousPeriod") {
    const baselineKeys = relativeDayRange(period.start, -period.keys.length, -1);
    return makeComparisonContext({
      title: "Flutuação do período",
      currentLabel: period.label,
      currentKeys: period.keys,
      baselineLabel: labelForKeys(baselineKeys),
      baselineKeys,
    });
  }

  if (state.compareMode === "previousYear") {
    const baselineKeys = shiftPeriodByYears(period.keys, -1);
    return makeComparisonContext({
      title: "Flutuação do período",
      currentLabel: period.label,
      currentKeys: period.keys,
      baselineLabel: labelForKeys(baselineKeys),
      baselineKeys,
      note: durationNote(period.keys, baselineKeys),
    });
  }

  if (state.compareMode === "nextYear") {
    const baselineKeys = shiftPeriodByYears(period.keys, 1);
    return makeComparisonContext({
      title: "Flutuação do período",
      currentLabel: period.label,
      currentKeys: period.keys,
      baselineLabel: labelForKeys(baselineKeys),
      baselineKeys,
      note: durationNote(period.keys, baselineKeys),
    });
  }

  if (state.compareMode === "previousMonth") {
    const baselineKeys = shiftPeriodByMonths(period.keys, -1);
    return makeComparisonContext({
      title: "Flutuação do período",
      currentLabel: period.label,
      currentKeys: period.keys,
      baselineLabel: labelForKeys(baselineKeys),
      baselineKeys,
      note: durationNote(period.keys, baselineKeys),
    });
  }

  if (state.compareMode === "nextMonth") {
    const baselineKeys = shiftPeriodByMonths(period.keys, 1);
    return makeComparisonContext({
      title: "Flutuação do período",
      currentLabel: period.label,
      currentKeys: period.keys,
      baselineLabel: labelForKeys(baselineKeys),
      baselineKeys,
      note: durationNote(period.keys, baselineKeys),
    });
  }

  if (state.compareMode === "manualMonth" || state.compareMode === "manualYear") {
    const baselineKeys = period.keys.map((key) =>
      toDateKey(state.compareYear, Number(key.slice(5, 7)), Number(key.slice(8, 10)))
    );
    return makeComparisonContext({
      title: "Flutuação do período",
      currentLabel: period.label,
      currentKeys: period.keys,
      baselineLabel: labelForKeys(baselineKeys),
      baselineKeys,
      note: durationNote(period.keys, baselineKeys),
    });
  }

  if (state.compareMode === "freeDate") {
    const start = state.freeCompareStart;
    const end = state.freeCompareEnd || start;
    const baselineKeys = start ? dateKeysBetween(...sortDateKeys(start, end)) : [];
    return makeComparisonContext({
      title: "Flutuação do período",
      currentLabel: period.label,
      currentKeys: period.keys,
      baselineLabel: baselineKeys.length ? labelForKeys(baselineKeys) : "data livre não definida",
      baselineKeys,
      note: durationNote(period.keys, baselineKeys),
    });
  }

  if (state.compareMode === "previousYearEvent") {
    const currentEvent = event || getEventsForPeriod(period.keys).find((item) => item.nome_evento);
    if (!currentEvent) return null;
    const previousEvent = findComparableEvent(currentEvent, Number(currentEvent.janela_inicio.slice(0, 4)) - 1);
    const baselineKeys = previousEvent ? dateKeysBetween(previousEvent.janela_inicio, previousEvent.janela_fim) : [];
    return makeComparisonContext({
      title: "Flutuação do período",
      currentLabel: `${currentEvent.nome_evento} ${currentEvent.janela_inicio.slice(0, 4)}`,
      currentKeys: dateKeysBetween(currentEvent.janela_inicio, currentEvent.janela_fim),
      baselineLabel: previousEvent
        ? `${previousEvent.nome_evento} ${previousEvent.janela_inicio.slice(0, 4)}`
        : "evento anterior não encontrado",
      baselineKeys,
      note: previousEvent
        ? durationNote(dateKeysBetween(currentEvent.janela_inicio, currentEvent.janela_fim), baselineKeys)
        : "Evento sem equivalente no ano anterior. Comparação direta pode estar distorcida por lançamento/campanha nova.",
    });
  }

  if (state.compareMode === "target") {
    return makeComparisonContext({
      title: "Comparação com meta",
      currentLabel: period.label,
      currentKeys: period.keys,
      baselineLabel: "Meta não configurada",
      baselineKeys: [],
      note: "Meta ainda não configurada nos dados locais.",
    });
  }

  if (state.compareMode === "averagePreviousYears") {
    const currentYear = Number(period.start.slice(0, 4));
    const previousYears = availableYearsBefore(currentYear);
    const baselineBuckets = previousYears.map((year) => ({
      label: String(year),
      keys: period.keys.map((key) => shiftDateKey(key, year - Number(key.slice(0, 4)), 0)),
    }));
    return makeAverageComparisonContext({
      title: "Flutuação do período",
      currentLabel: period.label,
      currentKeys: period.keys,
      baselineBuckets,
    });
  }

  return null;
}

function labelForKeys(keys) {
  const period = makePeriod(keys, "");
  return period.label;
}

function durationNote(currentKeys, baselineKeys) {
  if (!baselineKeys.length) return "";
  return currentKeys.length !== baselineKeys.length
    ? "Períodos com durações diferentes podem distorcer a comparação."
    : "";
}

function renderComparisonDurationNote(period, comparisonContext) {
  if (!comparisonContext || !comparisonContext.note) return "";
  return `<div class="comparison-note">${comparisonContext.note}</div>`;
}

function renderAnalysisSummary(period, comparisonContext) {
  const comparisonText = comparisonContext ? comparisonContext.baseline.label : "Comparação desativada";
  return `
    <div class="analysis-summary">
      <strong>Análise</strong>
      <span>Período: ${PERIOD_TYPE_LABELS[state.periodType] || period.typeLabel || period.label}</span>
      <span>Comparação: ${COMPARISON_LABELS[state.compareMode] || "Sem comparação"}</span>
      <span>Comparando com: ${comparisonText}</span>
    </div>
  `;
}

function buildDetailComparisonContext(dateKey, event) {
  if (state.compareMode === "none") return null;

  if (state.compareMode === "previousYear") {
    const previousKey = previousYearDateKey(dateKey);
    return makeComparisonContext({
      title: "Flutuação do período",
      currentLabel: String(dateKey.slice(0, 4)),
      currentKeys: [dateKey],
      baselineLabel: String(Number(dateKey.slice(0, 4)) - 1),
      baselineKeys: [previousKey],
      event,
    });
  }

  if (state.compareMode === "previousYearMonth") {
    return makeComparisonContext({
      title: "Flutuação do período",
      currentLabel: `${MONTH_NAMES[state.month]} ${state.year}`,
      currentKeys: getMonthDateKeysFor(state.year, state.month),
      baselineLabel: `${MONTH_NAMES[state.month]} ${state.year - 1}`,
      baselineKeys: getMonthDateKeysFor(state.year - 1, state.month),
      event,
    });
  }

  if (state.compareMode === "previousYearEvent") {
    const currentEvent = event && event.nome_evento ? event : null;
    if (!currentEvent) return null;
    const previousEvent = findComparableEvent(currentEvent, state.year - 1);
    return makeComparisonContext({
      title: "Flutuação do período",
      currentLabel: `${currentEvent.nome_evento} ${state.year}`,
      currentKeys: dateKeysBetween(currentEvent.janela_inicio, currentEvent.janela_fim),
      baselineLabel: previousEvent
        ? `${previousEvent.nome_evento} ${state.year - 1}`
        : `Sem equivalente em ${state.year - 1}`,
      baselineKeys: previousEvent ? dateKeysBetween(previousEvent.janela_inicio, previousEvent.janela_fim) : [],
      event: currentEvent,
      note: previousEvent ? "" : "Evento sem equivalente no ano anterior. Comparação direta pode estar distorcida por lançamento/campanha nova.",
    });
  }

  if (state.compareMode === "averagePreviousYears") {
    const previousYears = availableYearsBefore(state.year);
    const baselineBuckets = previousYears.map((year) => ({
      label: String(year),
      keys: [toDateKey(year, state.month + 1, Number(dateKey.slice(8, 10)))],
    }));
    return makeAverageComparisonContext({
      title: "Flutuação do período",
      currentLabel: String(state.year),
      currentKeys: [dateKey],
      baselineBuckets,
      event,
    });
  }

  return null;
}

function buildSummaryComparisonContext() {
  if (state.compareMode === "none") return null;

  const selectedEvent = state.selectedDate
    ? getEventsForDate(state.selectedDate).find((event) => event.nome_evento)
    : null;

  if (state.compareMode === "previousYearEvent" && selectedEvent) {
    return buildDetailComparisonContext(state.selectedDate, selectedEvent);
  }

  if (state.compareMode === "averagePreviousYears") {
    const previousYears = availableYearsBefore(state.year);
    const baselineBuckets = previousYears.map((year) => ({
      label: String(year),
      keys: getMonthDateKeysFor(year, state.month),
    }));
    return makeAverageComparisonContext({
      title: "Flutuação do período",
      currentLabel: `${MONTH_NAMES[state.month]} ${state.year}`,
      currentKeys: getMonthDateKeysFor(state.year, state.month),
      baselineBuckets,
    });
  }

  return makeComparisonContext({
    title: "Flutuação do período",
    currentLabel: `${MONTH_NAMES[state.month]} ${state.year}`,
    currentKeys: getMonthDateKeysFor(state.year, state.month),
    baselineLabel: `${MONTH_NAMES[state.month]} ${state.year - 1}`,
    baselineKeys: getMonthDateKeysFor(state.year - 1, state.month),
    event: selectedEvent,
  });
}

function makeComparisonContext({ title, currentLabel, currentKeys, baselineLabel, baselineKeys, event, note = "" }) {
  const currentMetrics = getMetricSummary(currentKeys);
  const baselineMetrics = getMetricSummary(baselineKeys);
  return {
    mode: state.compareMode,
    title,
    event,
    note,
    current: { label: currentLabel, keys: currentKeys, metrics: currentMetrics },
    baseline: { label: baselineLabel, keys: baselineKeys, metrics: baselineMetrics },
  };
}

function makeAverageComparisonContext({ title, currentLabel, currentKeys, baselineBuckets, event }) {
  const populatedBuckets = baselineBuckets.filter((bucket) => bucket.keys.length);
  const metrics = populatedBuckets.map((bucket) => getMetricSummary(bucket.keys));
  return {
    mode: state.compareMode,
    title,
    event,
    note: populatedBuckets.length ? "" : "Sem anos anteriores disponíveis para média.",
    current: { label: currentLabel, keys: currentKeys, metrics: getMetricSummary(currentKeys) },
    baseline: {
      label: populatedBuckets.length
        ? `Média ${populatedBuckets.map((bucket) => bucket.label).join(", ")}`
        : "Média indisponível",
      keys: [],
      metrics: averageMetricSummaries(metrics),
    },
  };
}

function getMetricSummary(dateKeys) {
  const uniqueKeys = [...new Set(dateKeys)].filter(Boolean);
  const totals = uniqueKeys.reduce(
    (acc, dateKey) => {
      const kpi = getKpi(dateKey);
      const funil = getFunil(dateKey);
      acc.receita_total += kpi.receita_total;
      acc.pedidos_aprovados += kpi.pedidos_aprovados;
      acc.sessoes += kpi.sessoes || Number(funil.sessions || 0);
      acc.add_to_cart += Number(funil.add_to_cart || 0);
      acc.begin_checkout += Number(funil.begin_checkout || 0);
      acc.clientes_novos += kpi.clientes_novos;
      acc.clientes_recorrentes += kpi.clientes_recorrentes;
      acc.investimento_total_mkt += kpi.investimento_total_mkt;
      return acc;
    },
    {
      receita_total: 0,
      pedidos_aprovados: 0,
      ticket_medio: 0,
      sessoes: 0,
      add_to_cart: 0,
      begin_checkout: 0,
      clientes_novos: 0,
      clientes_recorrentes: 0,
      investimento_total_mkt: 0,
      roas_mkt: 0,
      abandono_carrinho_estimado: 0,
      abandono_checkout_estimado: 0,
      taxa_conversao: 0,
    }
  );

  totals.abandono_carrinho_estimado = Math.max(0, totals.add_to_cart - totals.begin_checkout);
  totals.abandono_checkout_estimado = Math.max(0, totals.begin_checkout - totals.pedidos_aprovados);
  totals.ticket_medio = totals.pedidos_aprovados
    ? totals.receita_total / totals.pedidos_aprovados
    : 0;
  totals.roas_mkt = totals.investimento_total_mkt
    ? totals.receita_total / totals.investimento_total_mkt
    : 0;
  totals.taxa_conversao = totals.sessoes ? totals.pedidos_aprovados / totals.sessoes : 0;
  return totals;
}

function averageMetricSummaries(metrics) {
  if (!metrics.length) return getMetricSummary([]);
  const totals = metrics.reduce((acc, item) => {
    FLUCTUATION_METRICS.forEach((metric) => {
      acc[metric.key] = (acc[metric.key] || 0) + Number(item[metric.key] || 0);
    });
    return acc;
  }, {});
  FLUCTUATION_METRICS.forEach((metric) => {
    totals[metric.key] = totals[metric.key] / metrics.length;
  });
  return totals;
}

function renderFluctuationPanel(context, variant = "summary", innerOnly = false) {
  if (!context || state.compareMode === "none") return "";
  const content = `
    <div class="fluctuation-head">
      <div>
        <span class="eyebrow">${COMPARISON_LABELS[state.compareMode]}</span>
        <h2>Flutuação do período</h2>
      </div>
      <p>Comparando ${context.current.label} com ${context.baseline.label}</p>
    </div>
    ${context.note ? `<div class="comparison-note">${context.note}</div>` : ""}
    <div class="fluctuation-grid">
      ${FLUCTUATION_METRICS.map((metric) => renderFluctuationMetric(metric, context)).join("")}
    </div>
  `;
  return innerOnly ? content : `<section class="fluctuation-panel">${content}</section>`;
}

function renderFluctuationMetric(metric, context) {
  const current = Number(context.current.metrics[metric.key] || 0);
  const baseline = Number(context.baseline.metrics[metric.key] || 0);
  const diff = baseline ? variation(current, baseline) : null;
  const absoluteDiff = current - baseline;
  return `
    <article class="fluctuation-card">
      <h3>${metric.label}</h3>
      <div class="fluctuation-line"><span>Atual</span><strong>${metric.formatter(current)}</strong></div>
      <div class="fluctuation-line"><span>Comparado</span><strong>${metric.formatter(baseline)}</strong></div>
      <div class="fluctuation-delta">Absoluta: ${formatSignedValue(absoluteDiff, metric.formatter)}</div>
      <div class="fluctuation-variation">Variação: ${trendValue(diff)}</div>
    </article>
  `;
}

function renderManualEventsBlock(events) {
  if (!events.length) return "";
  return `
    <div class="manual-event-list">
      <span class="eyebrow">Eventos no período</span>
      ${events
        .map(
          (event) => `
            <div class="manual-event-item">
              <strong>${event.nome_evento}</strong>
              <span>${event.tipo_evento} · ${formatShortDate(event.janela_inicio)} a ${formatShortDate(event.janela_fim)}</span>
              ${event.produto_relacionado ? `<span>Produto: ${event.produto_relacionado}</span>` : ""}
              ${event.campanha_relacionada ? `<span>Campanha: ${event.campanha_relacionada}</span>` : ""}
              ${event.observacao ? `<span>${event.observacao}</span>` : ""}
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderManualComparisonNote(manualEvents, context) {
  if (!manualEvents.length || state.compareMode === "none") return "";
  const hasBaseline = context && Number(context.baseline.metrics.receita_total || 0) > 0;
  if (hasBaseline) return "";
  return `
    <div class="comparison-note">
      Evento sem equivalente no período comparado. Comparação direta pode estar distorcida por lançamento/campanha nova.
    </div>
  `;
}

function findComparableEvent(event, targetYear) {
  const targetEvents = [
    ...(state.data.calendario || []),
    ...(state.data.eventosManuais || []).map(normalizeManualEvent),
  ].filter((candidate) => {
    const start = candidate.janela_inicio || candidate.data_inicio || candidate.data;
    return Number(String(start || "").slice(0, 4)) === targetYear;
  });

  const eventGroup = normalizeComparableText(event.grupo_evento || event.nome_evento);
  const eventName = normalizeComparableText(event.nome_evento);
  const eventCategory = normalizeComparableText(event.categoria || event.tipo_evento);
  return targetEvents.find((candidate) => {
    const candidateGroup = normalizeComparableText(candidate.grupo_evento || candidate.nome_evento);
    const candidateName = normalizeComparableText(candidate.nome_evento || candidate.titulo);
    const candidateCategory = normalizeComparableText(candidate.categoria || candidate.tipo_evento);
    return (
      candidateGroup === eventGroup ||
      candidateName === eventName ||
      (candidateCategory === eventCategory && candidateName.includes(eventName))
    );
  });
}

function availableYearsBefore(year) {
  return collectYears().filter((item) => item < year);
}

function getMonthDateKeysFor(year, monthIndex) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) =>
    toDateKey(year, monthIndex + 1, index + 1)
  );
}

function dateKeysBetween(start, end) {
  if (!start) return [];
  const keys = [];
  const [startYear, startMonth, startDay] = start.split("-").map(Number);
  const [endYear, endMonth, endDay] = (end || start).split("-").map(Number);
  const current = new Date(startYear, startMonth - 1, startDay);
  const final = new Date(endYear, endMonth - 1, endDay);
  while (current <= final) {
    keys.push(toDateKey(current.getFullYear(), current.getMonth() + 1, current.getDate()));
    current.setDate(current.getDate() + 1);
  }
  return keys;
}

function uniqueDateKeys(keys = []) {
  return [...new Set(keys.filter(Boolean))].sort();
}

function maxDateKey(keys = []) {
  return uniqueDateKeys(keys).pop() || "";
}

function rangesOverlap(start, end, rangeStart, rangeEnd) {
  if (!start || !rangeStart || !rangeEnd) return false;
  const safeEnd = end || start;
  return start <= rangeEnd && safeEnd >= rangeStart;
}

function categoryFromManualType(type = "") {
  if (["Campanha", "CRM", "Mídia paga"].includes(type)) return "Campanha";
  if (["Lançamento de produto", "Ação comercial"].includes(type)) return "Data comercial";
  return "Sazonalidade";
}

function priorityScore(priority) {
  if (typeof priority === "number") return priority;
  return { Alta: 90, Média: 60, Baixa: 30 }[priority] || Number(priority || 0);
}

function normalizeComparableText(value = "") {
  return slug(String(value)).replace(/-/g, " ").trim();
}

function cleanLaunchText(value = "") {
  return String(value || "").trim();
}

function normalizeDateKey(value = "") {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const brMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function parseLaunchNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  const text = String(value)
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const number = Number(text);
  return Number.isFinite(number) ? number : 0;
}

function loadManualEventsFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(MANUAL_EVENTS_STORAGE_KEY) || "[]");
  } catch (error) {
    return [];
  }
}

function loadDeletedManualEventIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(MANUAL_EVENTS_DELETED_KEY) || "[]");
    return Array.isArray(ids) ? ids : [];
  } catch (error) {
    return [];
  }
}

function persistManualEvents() {
  try {
    localStorage.setItem(MANUAL_EVENTS_STORAGE_KEY, JSON.stringify(state.data.eventosManuais || []));
    return true;
  } catch (error) {
    return false;
  }
}

function persistDeletedManualEventIds() {
  try {
    localStorage.setItem(MANUAL_EVENTS_DELETED_KEY, JSON.stringify(state.deletedManualEventIds || []));
    return true;
  } catch (error) {
    return false;
  }
}

function mergeManualEvents(fileEvents, storageEvents) {
  const map = new Map();
  [...fileEvents, ...storageEvents].forEach((event) => {
    if (!event) return;
    const id = event.id || buildManualEventId(event);
    map.set(id, { ...event, id });
  });
  return [...map.values()].sort((a, b) => String(a.data_inicio).localeCompare(String(b.data_inicio)));
}

function buildManualEventId(event) {
  const start = event.data_inicio || event.data || toDateKey(state.year, state.month + 1, 1);
  const end = event.data_fim || event.janela_fim || start;
  const base = [start, end, event.titulo || event.nome_evento || "evento", event.tipo || event.tipo_evento || ""]
    .join("_")
    .replace(/-/g, "_");
  return `manual_${slug(base).replace(/-/g, "_") || "evento"}`;
}

async function saveManualEventFromForm(event) {
  event.preventDefault();
  if (state.isSavingManualEvent) return;
  const form = event.currentTarget;
  setManualFormSaving(true);
  setManualStatus("Salvando evento...");
  const start = document.getElementById("manualStartDate").value;
  const end = document.getElementById("manualEndDate").value || start;
  const editingId = state.editingManualEventId;
  const eventId = editingId || `manual_${start.replace(/-/g, "_")}_${String(Date.now()).slice(-6)}`;
  const manualEvent = {
    id: eventId,
    event_id: eventId,
    data_inicio: start,
    data_fim: end < start ? start : end,
    titulo: document.getElementById("manualTitle").value.trim(),
    tipo: document.getElementById("manualType").value,
    categoria: categoryFromManualType(document.getElementById("manualType").value),
    produto_relacionado: document.getElementById("manualProduct").value.trim(),
    campanha_relacionada: document.getElementById("manualCampaign").value.trim(),
    prioridade: document.getElementById("manualPriority").value,
    responsavel: document.getElementById("manualOwner").value.trim(),
    observacao: document.getElementById("manualObservation").value.trim(),
    status: document.getElementById("manualStatusField").value,
  };

  try {
    const canUseSharedApi = state.apiAvailable || (await ensureSharedEventsApiReady());
    if (canUseSharedApi) {
      const saved = await saveManualEventWithApi(manualEvent, editingId);
      if (saved) {
        upsertManualEventLocally(saved);
        closeManualFormAfterSave(form, saved);
        const message = "Evento salvo na base compartilhada.";
        setManualStatus(message);
        closeMenus();
        renderDashboard();
        setDataStatusMessage(message);
        return;
      }
      setManualStatus(
        `Não foi possível salvar na base compartilhada. O evento não foi gravado. ${state.lastEventApiError || "Recarregue a página e tente novamente."}`
      );
      return;
    }

    state.data.eventosManuais = editingId
      ? (state.data.eventosManuais || []).map((item) => (item.id === editingId ? manualEvent : item))
      : mergeManualEvents(state.data.eventosManuais || [], [manualEvent]);
    state.deletedManualEventIds = (state.deletedManualEventIds || []).filter((id) => id !== manualEvent.id);
    buildIndexes();
    const persisted = persistManualEvents();
    persistDeletedManualEventIds();
    closeManualFormAfterSave(form, manualEvent);
    const message = persisted
      ? "Evento salvo no navegador. Use Exportar eventos manuais para gerar o JSON."
      : "Evento salvo nesta sessão. Use Exportar eventos manuais para baixar o JSON.";
    setManualStatus(message);
    closeMenus();
    renderDashboard();
    setDataStatusMessage(message);
  } finally {
    setManualFormSaving(false);
  }
}

function setManualFormSaving(isSaving) {
  state.isSavingManualEvent = isSaving;
  const form = document.getElementById("manualEventForm");
  if (!form) return;
  const submitButton = form.querySelector('button[type="submit"]');
  const cancelButton = document.getElementById("cancelManualEventButton");
  if (submitButton) {
    if (isSaving) submitButton.dataset.previousLabel = submitButton.textContent || "Salvar evento";
    submitButton.disabled = isSaving;
    submitButton.textContent = isSaving ? "Salvando..." : submitButton.dataset.previousLabel || "Salvar evento";
    if (!isSaving) delete submitButton.dataset.previousLabel;
  }
  if (cancelButton) cancelButton.disabled = isSaving;
  form.setAttribute("aria-busy", isSaving ? "true" : "false");
}

async function saveManualEventWithApi(manualEvent, editingId) {
  try {
    state.lastEventApiError = "";
    const url = editingId ? `${API_BASE}/api/events/${encodeURIComponent(editingId)}` : `${API_BASE}/api/events`;
    const method = editingId ? "PUT" : "POST";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiManualEventPayload(manualEvent)),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.detail || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    state.lastEventApiError = error.message || "Falha ao chamar /api/events.";
    state.apiAvailable = false;
    renderBackendStatus();
    return null;
  }
}

async function ensureSharedEventsApiReady() {
  await refreshBackendStatus(true);
  return state.apiAvailable;
}

function apiManualEventPayload(manualEvent) {
  return {
    data_inicio: manualEvent.data_inicio,
    data_fim: manualEvent.data_fim,
    titulo: manualEvent.titulo,
    tipo: manualEvent.tipo,
    categoria: manualEvent.categoria,
    produto_relacionado: manualEvent.produto_relacionado,
    campanha_relacionada: manualEvent.campanha_relacionada,
    prioridade: manualEvent.prioridade,
    responsavel: manualEvent.responsavel,
    observacao: manualEvent.observacao,
    status: manualEvent.status || "Ativo",
  };
}

function upsertManualEventLocally(event) {
  const normalized = normalizeManualEventsList([event])[0];
  if (!normalized) return;
  state.data.eventosManuais = mergeManualEvents(
    (state.data.eventosManuais || []).filter((item) => item.id !== normalized.id && item.event_id !== normalized.event_id),
    [normalized]
  );
  buildIndexes();
  populateSelectorsPreservingSelection();
}

function removeManualEventLocally(id) {
  state.data.eventosManuais = (state.data.eventosManuais || []).filter((event) => event.id !== id && event.event_id !== id);
  buildIndexes();
  populateSelectorsPreservingSelection();
}

async function reloadDataAfterManualEventChange() {
  await loadData();
  buildIndexes();
  populateSelectorsPreservingSelection();
}

function closeManualFormAfterSave(form, manualEvent) {
  form.reset();
  form.hidden = true;
  state.editingManualEventId = null;
  state.year = Number(manualEvent.data_inicio.slice(0, 4));
  state.month = Number(manualEvent.data_inicio.slice(5, 7)) - 1;
  state.selectedDate = manualEvent.data_inicio;
  ensureYearOption(state.year);
}

function resetManualEventForm() {
  const form = document.getElementById("manualEventForm");
  form.reset();
  state.editingManualEventId = null;
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = "Salvar evento";
}

function renderManualEventsList() {
  const target = document.getElementById("manualEventsList");
  if (!target) return;
  const events = getManualEventsForDisplayedMonth();

  target.innerHTML = `
    <div class="manual-list-head">
      <strong>Eventos manuais neste mês</strong>
      <span>${formatInteger(events.length)} evento(s)</span>
    </div>
    ${
      events.length
        ? events.map(renderManualEventListItem).join("")
        : '<p class="muted-empty">Nenhum evento manual cadastrado para este mês.</p>'
    }
  `;
}

function renderManualEventListItem(event) {
  const isDeleting = state.deletingManualEventId === event.id;
  return `
    <article class="manual-month-item">
      <div>
        <strong>${event.titulo || "Evento manual"}</strong>
        <span>${event.tipo || "-"} · ${formatShortDate(event.data_inicio)} a ${formatShortDate(event.data_fim || event.data_inicio)}</span>
        <span>Prioridade: ${event.prioridade || "-"}${event.responsavel ? ` · Responsável: ${event.responsavel}` : ""}</span>
      </div>
      <div class="manual-event-actions">
        <button class="secondary-button small-button" type="button" data-action="edit-manual" data-id="${event.id}" ${isDeleting ? "disabled" : ""}>Editar</button>
        <button class="secondary-button small-button danger-button" type="button" data-action="delete-manual" data-id="${event.id}" ${isDeleting ? "disabled" : ""}>${isDeleting ? "Excluindo..." : "Excluir"}</button>
      </div>
    </article>
  `;
}

function getManualEventsForDisplayedMonth() {
  const rangeStart = toDateKey(state.year, state.month + 1, 1);
  const rangeEnd = toDateKey(state.year, state.month + 1, new Date(state.year, state.month + 1, 0).getDate());
  return (state.data.eventosManuais || [])
    .filter(isActiveManualEvent)
    .filter((event) => rangesOverlap(event.data_inicio || event.data, event.data_fim || event.data_inicio || event.data, rangeStart, rangeEnd))
    .sort((a, b) => String(a.data_inicio).localeCompare(String(b.data_inicio)));
}

function handleManualEventsListClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  if (state.deletingManualEventId || button.disabled) return;
  const id = button.dataset.id;
  if (button.dataset.action === "edit-manual") {
    editManualEvent(id);
  }
  if (button.dataset.action === "delete-manual") {
    deleteManualEvent(id);
  }
}

function editManualEvent(id) {
  const manualEvent = (state.data.eventosManuais || []).find((event) => event.id === id);
  if (!manualEvent) return;
  state.editingManualEventId = id;
  const form = document.getElementById("manualEventForm");
  form.hidden = false;
  document.getElementById("manualTitle").value = manualEvent.titulo || "";
  document.getElementById("manualType").value = manualEvent.tipo || "Campanha";
  document.getElementById("manualStartDate").value = manualEvent.data_inicio || "";
  document.getElementById("manualEndDate").value = manualEvent.data_fim || manualEvent.data_inicio || "";
  document.getElementById("manualProduct").value = manualEvent.produto_relacionado || "";
  document.getElementById("manualCampaign").value = manualEvent.campanha_relacionada || "";
  document.getElementById("manualPriority").value = manualEvent.prioridade || "Média";
  document.getElementById("manualOwner").value = manualEvent.responsavel || "";
  document.getElementById("manualStatusField").value = manualEvent.status || "Ativo";
  document.getElementById("manualObservation").value = manualEvent.observacao || "";
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = "Salvar edição";
  document.getElementById("manualTitle").focus();
  setManualStatus("Editando evento manual.");
}

async function deleteManualEvent(id) {
  const manualEvent = (state.data.eventosManuais || []).find((event) => event.id === id);
  if (!manualEvent) return;
  if (!window.confirm("Tem certeza que deseja excluir este evento manual?")) return;

  state.deletingManualEventId = id;
  setManualStatus("Excluindo evento...");
  renderManualEventsList();

  try {
    const canUseSharedApi = state.apiAvailable || (await ensureSharedEventsApiReady());
    if (canUseSharedApi) {
      const deleted = await deleteManualEventWithApi(id);
      if (deleted) {
        if (state.editingManualEventId === id) {
          resetManualEventForm();
          document.getElementById("manualEventForm").hidden = true;
        }
        removeManualEventLocally(id);
        setManualStatus("Evento manual excluido da base compartilhada.");
        setDataStatusMessage("Evento manual excluido da base compartilhada.");
        renderDashboard();
        return;
      }
      setManualStatus(
        `Nao foi possivel excluir na base compartilhada. O evento continua ativo. ${state.lastEventApiError || "Recarregue a pagina e tente novamente."}`
      );
      return;
    }

    state.data.eventosManuais = (state.data.eventosManuais || []).filter((event) => event.id !== id);
    state.deletedManualEventIds = [...new Set([...(state.deletedManualEventIds || []), id])];
    if (state.editingManualEventId === id) {
      resetManualEventForm();
      document.getElementById("manualEventForm").hidden = true;
    }
    buildIndexes();
    persistManualEvents();
    persistDeletedManualEventIds();
    setManualStatus("Evento manual excluido do fallback local.");
    renderDashboard();
  } finally {
    state.deletingManualEventId = null;
    renderManualEventsList();
  }
}

async function deleteManualEventWithApi(id) {
  try {
    state.lastEventApiError = "";
    const response = await fetch(`${API_BASE}/api/events/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.detail || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    state.lastEventApiError = error.message || "Falha ao chamar DELETE /api/events.";
    state.apiAvailable = false;
    renderBackendStatus();
    return null;
  }
}
function exportManualEvents() {
  const payload = JSON.stringify(state.data.eventosManuais || [], null, 2);
  const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "eventos_manuais.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setManualStatus("Arquivo eventos_manuais.json exportado.");
}

function importManualEvents(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const imported = JSON.parse(String(reader.result || "[]"));
      if (!Array.isArray(imported)) {
        throw new Error("JSON precisa ser uma lista de eventos.");
      }
      if (state.apiAvailable) {
        await importManualEventsWithApi(imported);
        await reloadDataAfterManualEventChange();
        setManualStatus(`${imported.length} evento(s) importado(s) para a base compartilhada.`);
        renderDashboard();
        return;
      }
      state.data.eventosManuais = mergeManualEvents(state.data.eventosManuais || [], imported);
      const importedIds = new Set(mergeManualEvents([], imported).map((item) => item.id));
      state.deletedManualEventIds = (state.deletedManualEventIds || []).filter((id) => !importedIds.has(id));
      buildIndexes();
      persistManualEvents();
      persistDeletedManualEventIds();
      setManualStatus(`${imported.length} evento(s) importado(s).`);
      renderDashboard();
    } catch (error) {
      setManualStatus("Não foi possível importar o JSON de eventos manuais.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file, "utf-8");
}

async function importManualEventsWithApi(events) {
  for (const manualEvent of normalizeManualEventsList(events)) {
    const response = await fetch(`${API_BASE}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiManualEventPayload(manualEvent)),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  }
}

function setManualStatus(message) {
  document.getElementById("manualEventsStatus").textContent = message;
}

function updateControlVisibility() {
  const showCompareYear = state.compareMode === "manualYear" || state.compareMode === "manualMonth";
  const showFreeCompare = state.compareMode === "freeDate";

  const periodLabel = PERIOD_TYPE_LABELS[state.periodType] || "Período";
  const comparisonLabel = COMPARISON_LABELS[state.compareMode] || "Sem comparação";
  document.getElementById("periodButtonLabel").textContent = periodLabel;
  document.getElementById("comparisonButtonLabel").textContent = comparisonLabel;

  document.getElementById("compareYearSection").hidden = !showCompareYear;
  document.getElementById("freeCompareSection").hidden = !showFreeCompare;

  document.querySelectorAll("[data-period-option]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.periodOption === state.periodType);
  });
  document.querySelectorAll("[data-compare-option]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.compareOption === state.compareMode);
  });
}

function activeFilters() {
  return new Set(
    [...document.querySelectorAll("[data-filter]:checked")].map((input) => input.value)
  );
}

function indexByDate(rows = []) {
  return rows.reduce((acc, row) => {
    if (row.data) acc[row.data] = row;
    return acc;
  }, {});
}

function groupByDate(rows = []) {
  return rows.reduce((acc, row) => {
    if (!row.data) return acc;
    if (!acc[row.data]) acc[row.data] = [];
    acc[row.data].push(row);
    return acc;
  }, {});
}

function indexBySku(rows = []) {
  return rows.reduce((acc, row) => {
    if (row.sku) acc[row.sku] = row;
    return acc;
  }, {});
}

function aggregateProductsByComparisonKey(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const key = productComparisonKey(row);
    if (!key) return;
    const current =
      map.get(key) || {
        key,
        sku: row.sku || "",
        product_key: row.product_key || "",
        product_name: row.product_name || key,
        variant_title: row.variant_title || "",
        itens_vendidos: 0,
        receita_produto: 0,
        classificacao: row.classificacao || "",
      };
    current.sku = current.sku || row.sku || "";
    current.product_key = current.product_key || row.product_key || "";
    current.product_name = current.product_name || row.product_name || key;
    current.variant_title = current.variant_title || row.variant_title || "";
    current.itens_vendidos += Number(row.itens_vendidos || 0);
    current.receita_produto += Number(row.receita_produto || 0);
    if (row.classificacao === "queda" || row.classificacao === "destaque") {
      current.classificacao = row.classificacao;
    }
    map.set(key, current);
  });
  return map;
}

function productComparisonKey(row = {}) {
  return row.product_key || row.sku || row.product_name || "";
}

function makeEmptyProduct(reference = {}, key = "") {
  return {
    key,
    sku: reference.sku || "",
    product_key: reference.product_key || "",
    product_name: reference.product_name || key,
    variant_title: reference.variant_title || "",
    itens_vendidos: 0,
    receita_produto: 0,
    classificacao: "",
  };
}

function classifyProductComparison(current, compared, stock, itemVariation, revenueVariation) {
  const currentTotal = Number(current.receita_produto || 0) + Number(current.itens_vendidos || 0);
  const comparedTotal = Number(compared.receita_produto || 0) + Number(compared.itens_vendidos || 0);

  if (currentTotal > 0 && comparedTotal === 0) return "Novo no período";
  if (currentTotal === 0 && comparedTotal > 0) return "Sumiu no período";
  if (
    isStockRisky(stock.risk_status) &&
    (revenueVariation.direction === "negative" || itemVariation.direction === "negative")
  ) {
    return "Atenção";
  }
  if (Number(revenueVariation.percentChange || 0) <= -0.15 || Number(itemVariation.percentChange || 0) <= -0.15) {
    return "Queda";
  }
  if (Number(revenueVariation.percentChange || 0) >= 0.15 || Number(itemVariation.percentChange || 0) >= 0.15) {
    return "Destaque";
  }
  return "Estável";
}

function aggregateAcquisitionByComparisonKey(campaignRows, utmRows) {
  const map = new Map();

  campaignRows.forEach((row) => {
    const key = `campaign:${row.campaign_id || row.campaign_name || "sem-campanha"}`;
    const current = map.get(key) || {
      key,
      source: row.platform || "Campanha",
      name: row.campaign_name || row.campaign_id || "Campanha sem nome",
      orders: 0,
      revenue: 0,
      investment: 0,
      roas: null,
    };
    current.orders += Number(row.pedidos_atribuidos || 0);
    current.revenue += Number(row.receita_atribuida || 0);
    current.investment += Number(row.investimento || 0);
    current.roas = current.investment ? current.revenue / current.investment : null;
    map.set(key, current);
  });

  utmRows.forEach((row) => {
    const key = `utm:${row.utm_source || "-"}|${row.utm_medium || "-"}|${row.utm_campaign || "-"}`;
    const current = map.get(key) || {
      key,
      source: `${row.utm_source || "-"} / ${row.utm_medium || "-"}`,
      name: row.utm_campaign || row.channel || "UTM sem nome",
      orders: 0,
      revenue: 0,
      investment: 0,
      roas: null,
    };
    current.orders += Number(row.pedidos || 0);
    current.revenue += Number(row.receita || 0);
    map.set(key, current);
  });

  return map;
}

function makeEmptyAcquisition(reference = {}, key = "") {
  return {
    key,
    source: reference.source || "-",
    name: reference.name || key,
    orders: 0,
    revenue: 0,
    investment: 0,
    roas: null,
  };
}

function classifyAcquisitionComparison(current, compared, revenueVariation, ordersVariation) {
  const currentTotal = Number(current.revenue || 0) + Number(current.orders || 0);
  const comparedTotal = Number(compared.revenue || 0) + Number(compared.orders || 0);

  if (currentTotal > 0 && comparedTotal === 0) return "Nova no período";
  if (currentTotal === 0 && comparedTotal > 0) return "Sem performance atual";
  if (Number(revenueVariation.percentChange || 0) <= -0.15 || Number(ordersVariation.percentChange || 0) <= -0.15) {
    return "Queda";
  }
  if (Number(revenueVariation.percentChange || 0) >= 0.15 || Number(ordersVariation.percentChange || 0) >= 0.15) {
    return "Destaque";
  }
  return "";
}

function aggregateProducts(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const key = `${row.sku}-${row.classificacao}`;
    const current = map.get(key) || { ...row, itens_vendidos: 0, receita_produto: 0 };
    current.itens_vendidos += Number(row.itens_vendidos || 0);
    current.receita_produto += Number(row.receita_produto || 0);
    map.set(key, current);
  });
  return [...map.values()].sort((a, b) => {
    if (a.classificacao !== b.classificacao) return a.classificacao === "destaque" ? -1 : 1;
    return b.receita_produto - a.receita_produto;
  });
}

function aggregateCampaigns(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const key = row.campaign_name;
    const current = map.get(key) || {
      platform: row.platform,
      campaign_name: row.campaign_name,
      investimento: 0,
      receita_atribuida: 0,
      pedidos_atribuidos: 0,
    };
    current.investimento += Number(row.investimento || 0);
    current.receita_atribuida += Number(row.receita_atribuida || 0);
    current.pedidos_atribuidos += Number(row.pedidos_atribuidos || 0);
    current.roas = current.investimento ? current.receita_atribuida / current.investimento : 0;
    map.set(key, current);
  });
  return [...map.values()].sort((a, b) => b.receita_atribuida - a.receita_atribuida);
}

function aggregateUtms(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const key = `${row.utm_source}-${row.utm_campaign}`;
    const current = map.get(key) || {
      utm_source: row.utm_source,
      utm_campaign: row.utm_campaign,
      receita: 0,
      pedidos: 0,
    };
    current.receita += Number(row.receita || 0);
    current.pedidos += Number(row.pedidos || 0);
    map.set(key, current);
  });
  return [...map.values()].sort((a, b) => b.receita - a.receita);
}

function pickProduct(products, classification) {
  return products
    .filter((item) => item.classificacao === classification)
    .sort((a, b) => Number(b.receita_produto || 0) - Number(a.receita_produto || 0))[0];
}

function maxBy(rows, field) {
  return [...rows].sort((a, b) => Number(b[field] || 0) - Number(a[field] || 0))[0];
}

function metricRow(label, value) {
  return `<div class="metric-row"><span>${label}</span><strong>${value}</strong></div>`;
}

function trendValue(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return `<span class="trend-neutral">-</span>`;
  }
  if (Math.abs(value) < 0.0001) {
    return `<span class="trend-neutral">- ${formatPercent(0)}</span>`;
  }
  const className = value >= 0 ? "trend-up" : "trend-down";
  const arrow = value > 0 ? "↑" : "↓";
  return `<span class="${className}">${arrow} ${formatPercent(value, true)}</span>`;
}

function calculateVariation(current, comparison) {
  const currentValue = Number(current || 0);
  const comparisonValue = Number(comparison || 0);
  const absoluteChange = currentValue - comparisonValue;

  if (comparisonValue === 0 && currentValue > 0) {
    return {
      absoluteChange,
      percentChange: null,
      label: "Novo",
      direction: "positive",
    };
  }

  if (currentValue === 0 && comparisonValue > 0) {
    return {
      absoluteChange,
      percentChange: -1,
      label: "-100%",
      direction: "negative",
    };
  }

  if (currentValue === 0 && comparisonValue === 0) {
    return {
      absoluteChange: 0,
      percentChange: null,
      label: "-",
      direction: "neutral",
    };
  }

  const percentChange = absoluteChange / comparisonValue;
  return {
    absoluteChange,
    percentChange,
    label: formatPercent(percentChange, true),
    direction: percentChange > 0 ? "positive" : percentChange < 0 ? "negative" : "neutral",
  };
}

function calculateRoasVariation(current, comparison) {
  if (!comparison || !Number.isFinite(Number(comparison))) {
    return {
      absoluteChange: 0,
      percentChange: null,
      label: "-",
      direction: "neutral",
    };
  }
  return calculateVariation(current, comparison);
}

function variationBadge(result) {
  return `<span class="variation-pill ${result.direction}">${result.label}</span>`;
}

function classificationClass(value = "") {
  const normalized = slug(value);
  if (["queda", "sumiu-no-periodo", "sem-performance-atual"].includes(normalized)) return "danger";
  if (["atencao"].includes(normalized)) return "warning";
  if (["destaque", "novo-no-periodo", "nova-no-periodo"].includes(normalized)) return "success";
  if (["estavel"].includes(normalized)) return "neutral";
  return "";
}

function isStockRisky(status = "") {
  if (!status || status === "-") return false;
  return slug(status) !== "saudavel";
}

function formatOptionalRoas(value) {
  return value === null || value === undefined ? "-" : formatRoas(value);
}

function variation(current, previous) {
  if (!previous) return null;
  return (current - previous) / previous;
}

function previousYearDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return toDateKey(year - 1, month, day);
}

function toDateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDateLong(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatShortDate(dateKey) {
  if (!dateKey) return "-";
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatBackendDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatCompactCurrency(value) {
  const number = Number(value || 0);
  if (Math.abs(number) >= 1000000) return `R$ ${(number / 1000000).toFixed(1).replace(".", ",")} mi`;
  if (Math.abs(number) >= 1000) return `R$ ${(number / 1000).toFixed(0)} mil`;
  return formatCurrency(number);
}

function formatChartCompactCurrency(value) {
  const number = Number(value || 0);
  if (Math.abs(number) >= 1000000) return `R$ ${(number / 1000000).toFixed(1).replace(".", ",")}M`;
  if (Math.abs(number) >= 1000) return `R$ ${(number / 1000).toFixed(0)}k`;
  return formatCurrency(number);
}

function formatInteger(value) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatDecimal(value) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function formatRatio(value) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(Number(value || 0));
}

function formatPercent(value, signed = false) {
  const number = Number(value || 0);
  const sign = signed && number > 0 ? "+" : "";
  return `${sign}${formatDecimal(number * 100)}%`;
}

function formatRoas(value) {
  return `${formatDecimal(value)}x`;
}

function formatSignedValue(value, formatter) {
  if (!Number.isFinite(value)) return "-";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatter(Math.abs(value))}`;
}

function slug(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function capitalize(value = "") {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function emptyTableRow(colspan) {
  return `<tr><td colspan="${colspan}">Sem dados para o mês selecionado.</td></tr>`;
}
