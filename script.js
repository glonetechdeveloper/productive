/**
 * ============================================================================
 * PRODUCTIVE WORKSPACE - CLIENT ENGINE
 * Minimalist Monochrome SaaS Interface | Zero Emojis | Full Sync
 * ============================================================================
 */

(function () {
  'use strict';

  // --- Constants & Config ---
  const STORAGE_KEY = 'productive_workspace_data_v1';
  const AUTH_TOKEN_KEY = 'productive_jwt_token';
  const AUTH_USER_KEY = 'productive_user_info';
  const THEME_KEY = 'productive_theme';
  const LAST_ACTIVE_KEY = 'productive_last_active_time';
  const SAVED_PROFILE_KEY = 'productive_saved_profile';
  const INACTIVITY_LIMIT_MS = 48 * 60 * 60 * 1000; // 48 Hours Inactivity Expiry Limit

  // PWA Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
      }).catch((err) => {
        console.warn('[PWA] ServiceWorker registration failed:', err);
      });
    });
  }

  /**
   * Dynamic Time Slots Generator
   * Generates hour slots based on user's configured schedule start/end hour
   */
  function getTimeSlots() {
    const settings = (state && state.year_data && state.year_data.settings) || {};
    const startStr = settings.schedule_start_hour || '05:00';
    const endStr = settings.schedule_end_hour || '23:00';

    let startHour = parseInt(startStr.split(':')[0], 10);
    let endHour = parseInt(endStr.split(':')[0], 10);

    if (isNaN(startHour)) startHour = 5;
    if (isNaN(endHour)) endHour = 23;
    if (endHour <= startHour) endHour = 23;

    const slots = [];
    for (let h = startHour; h <= endHour; h++) {
      const hh = String(h % 24).padStart(2, '0') + ':00';
      const nextH = String((h + 1) % 24).padStart(2, '0') + ':00';
      const ampm1 = (h % 24) >= 12 ? 'PM' : 'AM';
      const h12_1 = (h % 12 === 0 ? 12 : h % 12);
      const ampm2 = ((h + 1) % 24) >= 12 ? 'PM' : 'AM';
      const h12_2 = (((h + 1) % 12) === 0 ? 12 : ((h + 1) % 12));
      const label = `${String(h12_1).padStart(2, '0')}:00 ${ampm1} - ${String(h12_2).padStart(2, '0')}:00 ${ampm2}`;
      const shortBadge = `${String(h12_1).padStart(2, '0')}:00 ${ampm1}`;
      slots.push({ key: hh, label, shortBadge, hour: h });
    }
    return slots;
  }

  const DEFAULT_CATEGORIES = [
    'Deep Work',
    'Core Focus',
    'Meetings',
    'Health & Fitness',
    'Learning',
    'Admin & Ops',
    'Rest & Recharge'
  ];

  // SVG Icons Helpers (Zero Emojis)
  const ICONS = {
    check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    cross: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    info: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
    success: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    alert: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
  };

  // --- Built-in Default Routine Blueprints ---
  const BUILTIN_ROUTINES = [
    {
      id: 'builtin_std',
      name: 'Standard High-Performance Day',
      description: 'Balanced precision blueprint with deep work, health, learning, and wind-down',
      isBuiltin: true,
      hours: {
        '03:00': { task: 'Early wake-up, cold hydration & meditation', category: 'Health & Fitness' },
        '04:00': { task: 'Dawn silent focus: Highest-leverage creative sprint', category: 'Deep Work' },
        '05:00': { task: 'Morning mobility stretch, espresso & strategic day planning', category: 'Health & Fitness' },
        '06:00': { task: 'Morning routine & review strategic weekly sprint', category: 'Admin & Ops' },
        '07:00': { task: 'Nutritious breakfast & daily focus alignment', category: 'Admin & Ops' },
        '08:00': { task: 'Deep Work Block 1: Core system architecture & coding', category: 'Deep Work' },
        '09:00': { task: 'Deep Work Block 1 (Cont): Critical technical delivery', category: 'Deep Work' },
        '10:00': { task: 'Focused execution & code review / testing', category: 'Core Focus' },
        '11:00': { task: 'Client standups & communications sync', category: 'Meetings' },
        '12:00': { task: 'Nutritious lunch & 20-min outdoor walk', category: 'Rest & Recharge' },
        '13:00': { task: 'Deep Work Block 2: Feature development & API integration', category: 'Deep Work' },
        '14:00': { task: 'Deep Work Block 2 (Cont): Debugging & validation', category: 'Deep Work' },
        '15:00': { task: 'Asynchronous emails, planning & documentation', category: 'Admin & Ops' },
        '16:00': { task: 'Gym strength training / cardio session', category: 'Health & Fitness' },
        '17:00': { task: 'Post-workout recovery & daily wrap-up notes', category: 'Admin & Ops' },
        '18:00': { task: 'Dinner & quality family connection', category: 'Rest & Recharge' },
        '19:00': { task: 'Technical reading / continuous learning', category: 'Learning' },
        '20:00': { task: 'Creative side projects & exploration', category: 'Core Focus' },
        '21:00': { task: 'Digital wind-down & next-day review', category: 'Admin & Ops' },
        '22:00': { task: 'Reading & sleep preparation protocol', category: 'Rest & Recharge' },
        '23:00': { task: 'Sleep & recovery', category: 'Rest & Recharge' }
      }
    },
    {
      id: 'builtin_deepwork',
      name: 'Deep Work & Engineering Sprint',
      description: 'Heavy focus protocol for heads-down coding, problem solving, and zero distractions',
      isBuiltin: true,
      hours: {
        '03:00': { task: 'Dawn wake-up & pure silent focus', category: 'Deep Work' },
        '04:00': { task: 'Algorithmic design & math modeling', category: 'Deep Work' },
        '05:00': { task: 'Cold shower, hydration & day sprint roadmap setup', category: 'Health & Fitness' },
        '06:00': { task: 'Deep Sprint Warmup: Technical documentation review', category: 'Deep Work' },
        '07:00': { task: 'Light breakfast & daily technical roadmap review', category: 'Admin & Ops' },
        '08:00': { task: 'Deep Sprint Block 1: Core algorithmic architecture', category: 'Deep Work' },
        '09:00': { task: 'Deep Sprint Block 1: Feature implementation & refactoring', category: 'Deep Work' },
        '10:00': { task: 'Deep Sprint Block 1: Backend service APIs & DB integration', category: 'Deep Work' },
        '11:00': { task: 'Deep Sprint Block 1: Unit testing & automated CI checks', category: 'Deep Work' },
        '12:00': { task: 'Healthy lunch, stretch & cognitive reset walk', category: 'Rest & Recharge' },
        '13:00': { task: 'Deep Sprint Block 2: UI polish & interaction engineering', category: 'Deep Work' },
        '14:00': { task: 'Deep Sprint Block 2: Performance optimization & benchmarks', category: 'Deep Work' },
        '15:00': { task: 'Deep Sprint Block 2: PR reviews & staging deployment', category: 'Deep Work' },
        '16:00': { task: 'High-intensity workout / endurance cardio', category: 'Health & Fitness' },
        '17:00': { task: 'Shower, protein intake & async team messages', category: 'Admin & Ops' },
        '18:00': { task: 'Dinner & downtime away from screens', category: 'Rest & Recharge' },
        '19:00': { task: 'Engineering documentation & research paper reading', category: 'Learning' },
        '20:00': { task: 'Exploratory side prototype / tinkering', category: 'Core Focus' },
        '21:00': { task: 'Log day velocity, commit code & prepare next sprint', category: 'Admin & Ops' },
        '22:00': { task: 'Screen-free wind down & fiction reading', category: 'Rest & Recharge' },
        '23:00': { task: 'Deep sleep protocol', category: 'Rest & Recharge' }
      }
    },
    {
      id: 'builtin_executive',
      name: 'Executive & Strategy Cadence',
      description: 'Operational rhythm for leadership, team syncs, sprint planning, and client reviews',
      isBuiltin: true,
      hours: {
        '03:00': { task: 'Early meditation & peaceful reflection', category: 'Rest & Recharge' },
        '04:00': { task: 'Long-range vision journaling & market research', category: 'Core Focus' },
        '05:00': { task: 'Morning breathwork, journaling & executive priority setting', category: 'Health & Fitness' },
        '06:00': { task: 'Executive briefing, industry news & email triage', category: 'Admin & Ops' },
        '07:00': { task: 'Breakfast with family & morning check-in', category: 'Rest & Recharge' },
        '08:00': { task: 'Strategic planning & quarterly milestone review', category: 'Core Focus' },
        '09:00': { task: 'Leadership standup & team alignment sync', category: 'Meetings' },
        '10:00': { task: 'High-leverage business development & client calls', category: 'Meetings' },
        '11:00': { task: 'Financial audit, metrics review & operational KPIs', category: 'Admin & Ops' },
        '12:00': { task: 'Executive lunch meeting or mindful break', category: 'Rest & Recharge' },
        '13:00': { task: 'Deep Focus: Product roadmap & feature scoping', category: 'Core Focus' },
        '14:00': { task: 'Stakeholder presentations & design reviews', category: 'Meetings' },
        '15:00': { task: 'Hiring, 1-on-1 mentorship & talent syncs', category: 'Meetings' },
        '16:00': { task: 'Cardio workout / tennis / gym session', category: 'Health & Fitness' },
        '17:00': { task: 'Wrap-up emails, delegate action items & inbox zero', category: 'Admin & Ops' },
        '18:00': { task: 'Family dinner & relationship building', category: 'Rest & Recharge' },
        '19:00': { task: 'Business biography / leadership reading', category: 'Learning' },
        '20:00': { task: 'Creative journaling & long-range horizon ideation', category: 'Core Focus' },
        '21:00': { task: 'Review tomorrow calendar & schedule lock', category: 'Admin & Ops' },
        '22:00': { task: 'Herbal tea, meditation & wind down', category: 'Rest & Recharge' },
        '23:00': { task: 'Full restorative sleep', category: 'Rest & Recharge' }
      }
    },
    {
      id: 'builtin_weekend',
      name: 'Weekend Mastery & Recovery',
      description: 'Restorative weekend rhythm balancing mastery, endurance, side projects, and recovery',
      isBuiltin: true,
      hours: {
        '03:00': { task: 'Peaceful deep sleep', category: 'Rest & Recharge' },
        '04:00': { task: 'Quiet morning awakening & meditation', category: 'Rest & Recharge' },
        '05:00': { task: 'Gentle sunrise stretch & morning tea', category: 'Rest & Recharge' },
        '06:00': { task: 'Morning walk in nature & fresh air', category: 'Health & Fitness' },
        '07:00': { task: 'Nutritious breakfast, coffee & leisurely reflection', category: 'Rest & Recharge' },
        '08:00': { task: 'Long endurance outdoor run / cycling session', category: 'Health & Fitness' },
        '09:00': { task: 'Post-run stretching, foam roll & sauna / cold bath', category: 'Health & Fitness' },
        '10:00': { task: 'Passion project & creative software hacking', category: 'Core Focus' },
        '11:00': { task: 'Passion project: UI design & experimentation', category: 'Core Focus' },
        '12:00': { task: 'Casual lunch & socializing with friends', category: 'Rest & Recharge' },
        '13:00': { task: 'Deep reading: Philosophy, science & technology', category: 'Learning' },
        '14:00': { task: 'Course work, skill building & video lectures', category: 'Learning' },
        '15:00': { task: 'Outdoor park walk / nature immersion', category: 'Health & Fitness' },
        '16:00': { task: 'Personal admin, house organization & life chores', category: 'Admin & Ops' },
        '17:00': { task: 'Weekly retrospective & personal finance check', category: 'Admin & Ops' },
        '18:00': { task: 'Social dinner & relaxed conversation', category: 'Rest & Recharge' },
        '19:00': { task: 'Movie night / cultural entertainment', category: 'Rest & Recharge' },
        '20:00': { task: 'Unwinding & creative hobby tinkering', category: 'Core Focus' },
        '21:00': { task: 'Plan coming week Big Rocks & goals', category: 'Admin & Ops' },
        '22:00': { task: 'Reading fiction & calm preparation for sleep', category: 'Rest & Recharge' },
        '23:00': { task: 'Deep restful sleep', category: 'Rest & Recharge' }
      }
    }
  ];

  // --- Application State ---
  const state = {
    theme: localStorage.getItem(THEME_KEY) || 'dark',
    token: localStorage.getItem(AUTH_TOKEN_KEY) || null,
    user: JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null'),
    selectedYear: '2026',
    currentDate: getTodayISODate(),
    currentLevel: 'micro',
    hourlyFilter: 'all',
    currentHorizon: 'h1',
    selectedMonthWeek: 1,
    searchQuery: '',
    activeEditingRoutineId: null,
    year_data: {
      yearly_goals: [],
      four_months: {},
      weekly_plans: {},
      daily_logs: {},
      custom_routines: []
    }
  };

  let debounceSaveTimeout = null;
  let newItemType = 'block';

  // --- DOM Elements Cache ---
  const dom = {
    html: document.documentElement,
    sidebarPrimary: document.getElementById('sidebarPrimary'),
    sidebarToggleBtn: document.getElementById('sidebarToggleBtn'),
    sidebarToggleIcon: document.getElementById('sidebarToggleIcon'),
    mobileHamburgerBtn: document.getElementById('mobileHamburgerBtn'),
    mobileSidebarOverlay: document.getElementById('mobileSidebarOverlay'),
    sidebarMobileCloseBtn: document.getElementById('sidebarMobileCloseBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    globalSearchInput: document.getElementById('globalSearchInput'),
    subpanelSearchInput: document.getElementById('subpanelSearchInput'),
    subpanelItemsContainer: document.getElementById('subpanelItemsContainer'),
    dailyMiniProgressFill: document.getElementById('dailyMiniProgressFill'),
    yearSelector: document.getElementById('yearSelector'),
    btnQuickNewTask: document.getElementById('btnQuickNewTask'),
    btnPrevDay: document.getElementById('btnPrevDay'),
    btnNextDay: document.getElementById('btnNextDay'),
    btnJumpToday: document.getElementById('btnJumpToday'),
    nativeDatePicker: document.getElementById('nativeDatePicker'),
    datePickerWrapper: document.getElementById('datePickerWrapper'),
    displayDayName: document.getElementById('displayDayName'),
    displayFullDate: document.getElementById('displayFullDate'),
    syncStatusBadge: document.getElementById('syncStatusBadge'),
    syncDot: document.getElementById('syncDot'),
    syncStatusText: document.getElementById('syncStatusText'),
    sidebarSyncDot: document.getElementById('sidebarSyncDot'),
    btnSidebarSync: document.getElementById('btnSidebarSync'),
    btnSidebarBackup: document.getElementById('btnSidebarBackup'),
    authTriggerBtn: document.getElementById('authTriggerBtn'),
    userEmailDisplay: document.getElementById('userEmailDisplay'),
    userAvatarText: document.getElementById('userAvatarText'),
    topAvatarInitials: document.getElementById('topAvatarInitials'),
    userStatusSub: document.getElementById('userStatusSub'),
    logoutBtn: document.getElementById('logoutBtn'),
    dbStatusBadge: document.getElementById('dbStatusBadge'),
    sidebarTodayPendingBadge: document.getElementById('sidebarTodayPendingBadge'),
    sidebarRoutinesBadge: document.getElementById('sidebarRoutinesBadge'),

    // Navigation & Views
    navButtons: document.querySelectorAll('.nav-item-btn[data-level]'),
    views: document.querySelectorAll('.stage-view-pane'),

    // Level 05: Hourly Micro
    stageHeaderAvatar: document.getElementById('stageHeaderAvatar'),
    hourlyViewDateHeading: document.getElementById('hourlyViewDateHeading'),
    hourlyStatusSub: document.getElementById('hourlyStatusSub'),
    dayPrimaryObjective: document.getElementById('dayPrimaryObjective'),
    hourlyTimelineContainer: document.getElementById('hourlyTimelineContainer'),
    dailyBlockRatio: document.getElementById('dailyBlockRatio'),
    filterPills: document.querySelectorAll('.filter-pill'),
    routineDropdownWrapper: document.getElementById('routineDropdownWrapper'),
    btnRoutineDropdown: document.getElementById('btnRoutineDropdown'),
    routineDropdownMenu: document.getElementById('routineDropdownMenu'),
    routineDropdownCount: document.getElementById('routineDropdownCount'),
    routineCurrentDateLabel: document.getElementById('routineCurrentDateLabel'),
    routineDropdownList: document.getElementById('routineDropdownList'),
    btnDropdownCreateRoutine: document.getElementById('btnDropdownCreateRoutine'),
    btnDropdownManageRoutines: document.getElementById('btnDropdownManageRoutines'),
    btnCloseRoutineDropdown: document.getElementById('btnCloseRoutineDropdown'),
    btnMarkAllDayDone: document.getElementById('btnMarkAllDayDone'),
    btnClearDayLog: document.getElementById('btnClearDayLog'),

    // Routines Stage View
    btnCreateNewRoutinePage: document.getElementById('btnCreateNewRoutinePage'),
    btnReturnToTimeBlocks: document.getElementById('btnReturnToTimeBlocks'),
    heroTotalRoutinesCount: document.getElementById('heroTotalRoutinesCount'),
    routinesListContainer: document.getElementById('routinesListContainer'),
    routinesCardsGrid: document.getElementById('routinesCardsGrid'),
    routineEditorContainer: document.getElementById('routineEditorContainer'),
    routineEditorTitle: document.getElementById('routineEditorTitle'),
    btnRoutineEditorPreloadStd: document.getElementById('btnRoutineEditorPreloadStd'),
    btnRoutineEditorClearAll: document.getElementById('btnRoutineEditorClearAll'),
    routineNameInput: document.getElementById('routineNameInput'),
    routineDescInput: document.getElementById('routineDescInput'),
    routineBreakdownSummary: document.getElementById('routineBreakdownSummary'),
    routineCategoryChips: document.getElementById('routineCategoryChips'),
    routineHoursEditorFeed: document.getElementById('routineHoursEditorFeed'),
    btnCancelRoutineEdit: document.getElementById('btnCancelRoutineEdit'),
    btnDeleteCustomRoutine: document.getElementById('btnDeleteCustomRoutine'),
    btnSaveRoutineOnly: document.getElementById('btnSaveRoutineOnly'),
    btnSaveAndApplyRoutine: document.getElementById('btnSaveAndApplyRoutine'),

    // Level 04: Daily Sun-Sat
    sevenDaysContainer: document.getElementById('sevenDaysContainer'),
    currentWeekIdentifier: document.getElementById('currentWeekIdentifier'),
    weekAverageScoreBadge: document.getElementById('weekAverageScoreBadge'),
    weekReviewTableBody: document.getElementById('weekReviewTableBody'),

    // Level 03: Weekly Strategy
    monthWeekSelector: document.getElementById('monthWeekSelector'),
    weeklyStrategyTitle: document.getElementById('weeklyStrategyTitle'),
    weeklyStrategyText: document.getElementById('weeklyStrategyText'),
    weeklyRocksList: document.getElementById('weeklyRocksList'),
    btnAddWeeklyRock: document.getElementById('btnAddWeeklyRock'),

    // Level 02: 4-Month Horizon
    fourMonthsContainer: document.getElementById('fourMonthsContainer'),
    horizonBtns: document.querySelectorAll('.horizon-btn'),

    // Level 01: Yearly Vision
    yearlyMainTitle: document.getElementById('yearlyMainTitle'),
    yearlyOverallBarFill: document.getElementById('yearlyOverallBarFill'),
    yearlyOverallBarText: document.getElementById('yearlyOverallBarText'),
    yearlyGoalsCountLegend: document.getElementById('yearlyGoalsCountLegend'),
    yearlyVisionStatusText: document.getElementById('yearlyVisionStatusText'),
    yearlyGoalsContainer: document.getElementById('yearlyGoalsContainer'),
    btnAddNewYearlyGoal: document.getElementById('btnAddNewYearlyGoal'),

    // New Item Modal
    newItemModalBackdrop: document.getElementById('newItemModalBackdrop'),
    closeNewItemModalBtn: document.getElementById('closeNewItemModalBtn'),
    newItemTabs: document.getElementById('newItemTabs'),
    newItemForm: document.getElementById('newItemForm'),
    newBlockTime: document.getElementById('newBlockTime'),
    newBlockTask: document.getElementById('newBlockTask'),
    newBlockCategory: document.getElementById('newBlockCategory'),
    newRockWeek: document.getElementById('newRockWeek'),
    newRockTitle: document.getElementById('newRockTitle'),
    newMilestoneHorizon: document.getElementById('newMilestoneHorizon'),
    newMilestoneMonth: document.getElementById('newMilestoneMonth'),
    newMilestoneTitle: document.getElementById('newMilestoneTitle'),
    newGoalTitle: document.getElementById('newGoalTitle'),
    newGoalPillar: document.getElementById('newGoalPillar'),
    newGoalMetric: document.getElementById('newGoalMetric'),

    // Auth Modal
    authModalBackdrop: document.getElementById('authModalBackdrop'),
    closeAuthModalBtn: document.getElementById('closeAuthModalBtn'),
    tabSwitchLogin: document.getElementById('tabSwitchLogin'),
    tabSwitchRegister: document.getElementById('tabSwitchRegister'),
    authModalHeading: document.getElementById('authModalHeading'),
    authModalSubtitle: document.getElementById('authModalSubtitle'),
    authForm: document.getElementById('authForm'),
    authEmail: document.getElementById('authEmail'),
    authPassword: document.getElementById('authPassword'),
    togglePasswordBtn: document.getElementById('togglePasswordBtn'),
    authAlertBox: document.getElementById('authAlertBox'),
    authSubmitBtn: document.getElementById('authSubmitBtn'),
    authSubmitBtnText: document.getElementById('authSubmitBtnText'),
    authSpinner: document.getElementById('authSpinner'),
    btnContinueGuest: document.getElementById('btnContinueGuest'),

    // Backup
    btnExportData: document.getElementById('btnExportData'),
    btnImportData: document.getElementById('btnImportData'),
    importFileInput: document.getElementById('importFileInput'),
    toastContainer: document.getElementById('toastContainer'),

    // Auth Gateway Landing Screen
    appAuthGateway: document.getElementById('appAuthGateway'),
    gatewayWelcomePane: document.getElementById('gatewayWelcomePane'),
    gatewayAuthPane: document.getElementById('gatewayAuthPane'),
    gatewayUserAvatar: document.getElementById('gatewayUserAvatar'),
    gatewayUserName: document.getElementById('gatewayUserName'),
    gatewaySessionStatus: document.getElementById('gatewaySessionStatus'),
    btnGatewayContinue: document.getElementById('btnGatewayContinue'),
    btnGatewayContinueText: document.getElementById('btnGatewayContinueText'),
    btnGatewaySwitchAccount: document.getElementById('btnGatewaySwitchAccount'),
    gatewayExpiryNotice: document.getElementById('gatewayExpiryNotice'),
    btnGatewayTabLogin: document.getElementById('btnGatewayTabLogin'),
    btnGatewayTabRegister: document.getElementById('btnGatewayTabRegister'),
    gatewayAlertBox: document.getElementById('gatewayAlertBox'),
    gatewayAuthForm: document.getElementById('gatewayAuthForm'),
    gatewayNameGroup: document.getElementById('gatewayNameGroup'),
    gatewayNameInput: document.getElementById('gatewayNameInput'),
    gatewayEmailInput: document.getElementById('gatewayEmailInput'),
    gatewayPasswordInput: document.getElementById('gatewayPasswordInput'),
    btnGatewaySubmit: document.getElementById('btnGatewaySubmit'),
    gatewaySubmitText: document.getElementById('gatewaySubmitText'),
    gatewaySpinner: document.getElementById('gatewaySpinner'),
    btnGatewayBackToWelcome: document.getElementById('btnGatewayBackToWelcome'),

    // Schedule Hours Configuration
    btnOpenScheduleConfig: document.getElementById('btnOpenScheduleConfig'),
    scheduleRangeButtonText: document.getElementById('scheduleRangeButtonText'),
    btnRoutineEditorHours: document.getElementById('btnRoutineEditorHours'),
    routineEditorHoursLabel: document.getElementById('routineEditorHoursLabel'),
    scheduleHoursModalBackdrop: document.getElementById('scheduleHoursModalBackdrop'),
    btnCloseScheduleHoursModal: document.getElementById('btnCloseScheduleHoursModal'),
    schedulePresetsContainer: document.getElementById('schedulePresetsContainer'),
    scheduleStartHourSelect: document.getElementById('scheduleStartHourSelect'),
    scheduleEndHourSelect: document.getElementById('scheduleEndHourSelect'),
    scheduleHoursWindowText: document.getElementById('scheduleHoursWindowText'),
    btnCancelScheduleHours: document.getElementById('btnCancelScheduleHours'),
    btnApplyScheduleHours: document.getElementById('btnApplyScheduleHours')
  };

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  function initApp() {
    applyTheme(state.theme);
    loadInitialData();
    populateTimeSlotSelects();
    updateScheduleRangeButtonUI();
    bindEventListeners();
    updateDateDisplay();
    renderAllViews();
    updateAllMetrics();
    renderSubpanel();

    // Listen to user activity to refresh last active timestamp
    ['click', 'keydown', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, () => recordUserActivity(), { passive: true });
    });

    // Automatic Cloud Sync when coming online
    window.addEventListener('online', () => {
      showToast('Network connected. Syncing to database...', 'info');
      if (state.token) {
        saveGoalsToBackend(state.year_data);
      }
    });

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine && state.token) {
        saveGoalsToBackend(state.year_data);
      }
    });

    checkGatewaySessionState();

    if (state.token) {
      loadGoalsFromBackend();
    } else {
      updateSyncStatusUI('offline', 'Offline (Local)');
    }
  }

  function populateTimeSlotSelects() {
    if (!dom.newBlockTime) return;
    dom.newBlockTime.innerHTML = '';
    getTimeSlots().forEach(slot => {
      const opt = document.createElement('option');
      opt.value = slot.key;
      opt.textContent = slot.label;
      dom.newBlockTime.appendChild(opt);
    });
  }

  // ==========================================================================
  // THEME SWITCHER
  // ==========================================================================
  function applyTheme(theme) {
    state.theme = theme;
    dom.html.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  function toggleTheme() {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    showToast(`Switched to ${nextTheme.toUpperCase()} mode`, 'info');
  }

  // ==========================================================================
  // DATE & TIME HELPERS
  // ==========================================================================
  function getTodayISODate() {
    const d = new Date();
    return formatISODate(d);
  }

  function formatISODate(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function parseISODate(isoStr) {
    const [y, m, d] = isoStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function isFutureDate(dateStr) {
    const today = getTodayISODate();
    return dateStr > today;
  }

  function updateDateDisplay() {
    const d = parseISODate(state.currentDate);
    const todayISO = getTodayISODate();

    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const fullDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    dom.displayDayName.textContent = state.currentDate === todayISO ? 'Today' : dayName;
    dom.displayFullDate.textContent = fullDate;
    dom.nativeDatePicker.value = state.currentDate;

    if (dom.hourlyViewDateHeading) {
      dom.hourlyViewDateHeading.textContent = state.currentDate === todayISO ? `Today, ${fullDate}` : `${dayName}, ${fullDate}`;
    }

    const initials = state.currentDate === todayISO ? 'TD' : dayName.substring(0, 2).toUpperCase();
    if (dom.stageHeaderAvatar) {
      dom.stageHeaderAvatar.textContent = initials;
    }
  }

  function shiftSelectedDate(days) {
    const d = parseISODate(state.currentDate);
    d.setDate(d.getDate() + days);
    state.currentDate = formatISODate(d);
    updateDateDisplay();
    renderHourlySchedule();
    renderSevenDaysGrid();
    renderSubpanel();
    updateAllMetrics();
  }

  function getWeekDateRange(dateStr) {
    const current = parseISODate(dateStr);
    const dayOfWeek = current.getDay();
    const startSunday = new Date(current);
    startSunday.setDate(current.getDate() - dayOfWeek);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startSunday);
      d.setDate(startSunday.getDate() + i);
      weekDays.push(formatISODate(d));
    }
    return weekDays;
  }

  // ==========================================================================
  // DATA MANAGEMENT & SYNC
  // ==========================================================================
  function loadInitialData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        state.year_data = JSON.parse(stored);
        if (!state.year_data.custom_routines) {
          state.year_data.custom_routines = [];
        }
        if (!state.year_data.settings) {
          state.year_data.settings = { schedule_start_hour: '05:00', schedule_end_hour: '23:00' };
        }
      } catch (err) {
        console.error('Failed to parse local stored data:', err);
        state.year_data = createDefaultYearData();
      }
    } else {
      state.year_data = createDefaultYearData();
      saveDataLocally();
    }
  }

  function createDefaultYearData() {
    return {
      settings: {
        schedule_start_hour: '05:00',
        schedule_end_hour: '23:00'
      },
      yearly_goals: [
        { id: 'g1', title: 'Scale Enterprise SaaS Revenue to $250k ARR', pillar: 'Career & Growth', targetMetric: '$250,000 ARR', status: 'In Progress' },
        { id: 'g2', title: 'Complete Sub-4 Hour Marathon Championship', pillar: 'Health & Endurance', targetMetric: '42.2 km @ 5:35/km', status: 'In Progress' },
        { id: 'g3', title: 'Read 24 Non-Fiction Core Architecture Books', pillar: 'Mastery', targetMetric: '24 Books', status: 'In Progress' },
        { id: 'g4', title: 'Launch Production Cloud Developer Suite', pillar: 'Engineering', targetMetric: '3 Production Apps', status: 'Achieved' }
      ],
      four_months: {
        h1: {
          m1: { target: 'Establish deep work morning routine and architecture baseline', milestones: [{ text: 'Design core system DB', completed: true }, { text: 'Write serverless auth endpoints', completed: true }, { text: 'Ship MVP v1.0', completed: false }] },
          m2: { target: 'Scale feature set and automate deployment pipelines', milestones: [{ text: 'Implement weekly sprint reviews', completed: false }, { text: 'Add analytics dashboard', completed: false }] },
          m3: { target: 'Optimization and user retention testing', milestones: [{ text: 'Beta feedback loop', completed: false }, { text: 'Performance audit', completed: false }] },
          m4: { target: 'Horizon 1 retrospective & major milestone launch', milestones: [{ text: 'Public release launch', completed: false }, { text: 'Review metrics', completed: false }] }
        },
        h2: {
          m1: { target: 'Expansion of userbase & enterprise workflows', milestones: [{ text: 'Enterprise pilot rollout', completed: false }] },
          m2: { target: 'Multi-device offline caching enhancements', milestones: [] },
          m3: { target: 'Q3 Product Iteration & Performance', milestones: [] },
          m4: { target: 'Mid-year financial and health re-calibration', milestones: [] }
        },
        h3: {
          m1: { target: 'End-of-year compounding push', milestones: [] },
          m2: { target: 'Deep architectural refactoring', milestones: [] },
          m3: { target: 'Final sprint targets', milestones: [] },
          m4: { target: 'Annual retrospective & next year vision planning', milestones: [] }
        }
      },
      weekly_plans: {},
      daily_logs: {},
      custom_routines: []
    };
  }

  function getDailyLog(dateStr) {
    if (!state.year_data.daily_logs[dateStr]) {
      state.year_data.daily_logs[dateStr] = {
        objective: '',
        hours: {}
      };
    }
    return state.year_data.daily_logs[dateStr];
  }

  function getWeeklyPlanKey() {
    const d = parseISODate(state.currentDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-M${month}-W${state.selectedMonthWeek}`;
  }

  function getWeeklyPlan() {
    const key = getWeeklyPlanKey();
    if (!state.year_data.weekly_plans[key]) {
      state.year_data.weekly_plans[key] = {
        strategy: '',
        rocks: [
          { id: 'r1', title: 'Complete high-priority client architectural deliverables', completed: true },
          { id: 'r2', title: '5x Morning 6:00 AM Deep Work sprint execution', completed: false },
          { id: 'r3', title: 'Conduct weekly financial and time audit', completed: false }
        ]
      };
    }
    return state.year_data.weekly_plans[key];
  }

  function saveDataLocally() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.year_data));
  }

  function queueAutoSave() {
    saveDataLocally();
    updateAllMetrics();
    renderSubpanel();

    if (state.token && navigator.onLine) {
      updateSyncStatusUI('saving', 'Saving...');
      clearTimeout(debounceSaveTimeout);
      debounceSaveTimeout = setTimeout(() => {
        saveGoalsToBackend(state.year_data);
      }, 600);
    } else {
      updateSyncStatusUI('offline', 'Saved Locally');
    }
  }

  // ==========================================================================
  // BACKEND SERVERLESS SYNC API
  // ==========================================================================
  async function loadGoalsFromBackend() {
    if (!state.token || !navigator.onLine) return;

    updateSyncStatusUI('saving', 'Syncing...');
    try {
      const response = await fetch('/api/goals/sync', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${state.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        handleSignOut(false);
        showToast('Session expired. Please sign in again.', 'alert');
        return;
      }

      const result = await response.json();
      if (result.success && result.data && Object.keys(result.data).length > 0) {
        state.year_data = result.data;
        saveDataLocally();
        renderAllViews();
        updateAllMetrics();
        renderSubpanel();
        updateSyncStatusUI('synced', 'Synced');
      } else {
        saveGoalsToBackend(state.year_data);
      }
    } catch (err) {
      updateSyncStatusUI('offline', 'Offline Mode');
    }
  }

  async function saveGoalsToBackend(dataPayload) {
    if (!state.token || !navigator.onLine) return;

    try {
      const response = await fetch('/api/goals/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ year_data: dataPayload })
      });

      if (response.status === 401) {
        handleSignOut(false);
        return;
      }

      const result = await response.json();
      if (result.success) {
        updateSyncStatusUI('synced', 'Synced');
      } else {
        updateSyncStatusUI('offline', 'Sync Delayed');
      }
    } catch (err) {
      updateSyncStatusUI('offline', 'Offline');
    }
  }

  function updateSyncStatusUI(status, label) {
    dom.syncDot.className = 'sync-indicator-dot';
    dom.sidebarSyncDot.className = 'nav-status-dot';

    if (status === 'saving') {
      dom.syncDot.classList.add('saving');
    } else if (status === 'offline') {
      dom.syncDot.classList.add('offline');
      dom.sidebarSyncDot.style.backgroundColor = 'var(--text-dim)';
    } else {
      dom.sidebarSyncDot.style.backgroundColor = 'var(--status-online)';
    }

    dom.syncStatusText.textContent = label;
    if (dom.dbStatusBadge) {
      dom.dbStatusBadge.textContent = state.token
        ? `PostgreSQL Cloud: ${state.user?.email || 'Connected'}`
        : 'Storage: Local Browser Mode';
    }
  }

  // ==========================================================================
  // CONTEXTUAL SUB-PANEL RENDERING
  // ==========================================================================
  function renderSubpanel() {
    dom.subpanelItemsContainer.innerHTML = '';
    const q = (state.searchQuery || '').toLowerCase();

    if (state.currentLevel === 'micro' || state.currentLevel === 'daily') {
      const weekDays = getWeekDateRange(state.currentDate);
      const todayISO = getTodayISODate();

      weekDays.forEach(dayStr => {
        const dayDate = parseISODate(dayStr);
        const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
        const dayFull = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dayLog = state.year_data.daily_logs[dayStr] || { objective: '', hours: {} };

        const hoursEntries = Object.entries(dayLog.hours || {}).filter(([_, h]) => h.task && h.task.trim().length > 0);
        const scheduled = hoursEntries.length;
        const completed = hoursEntries.filter(([_, h]) => h.status === 'completed').length;
        const pending = scheduled - completed;

        // Search match against day name, date, objective, or any hourly task in that day
        if (q) {
          const nameMatches = dayName.toLowerCase().includes(q) || dayFull.toLowerCase().includes(q);
          const objMatches = (dayLog.objective || '').toLowerCase().includes(q);
          const taskMatches = hoursEntries.some(([slot, h]) => (h.task || '').toLowerCase().includes(q) || slot.includes(q) || (h.category || '').toLowerCase().includes(q));
          if (!nameMatches && !objMatches && !taskMatches) {
            return;
          }
        }

        const card = document.createElement('div');
        card.className = `subpanel-item-card ${dayStr === state.currentDate ? 'active' : ''}`;
        
        const avatarInitial = dayStr === todayISO ? 'TD' : dayName.substring(0, 2).toUpperCase();

        // Build preview timestamps snippet (up to 3 items)
        let previewHtml = '';
        if (hoursEntries.length > 0) {
          const sampleSlots = hoursEntries.slice(0, 3);
          const previewItems = sampleSlots.map(([slot, h]) => {
            const hNum = parseInt(slot.split(':')[0], 10);
            const ampm = hNum >= 12 ? 'PM' : 'AM';
            const h12 = (hNum % 12 === 0 ? 12 : hNum % 12);
            const badge = `${String(h12).padStart(2, '0')}${ampm}`;
            return `<div class="subpanel-preview-slot"><span class="subpanel-preview-time">${badge}</span><span class="subpanel-preview-task ${h.status === 'completed' ? 'completed-task' : ''}">${escapeHtml(h.task)}</span></div>`;
          }).join('');

          const moreCount = hoursEntries.length - sampleSlots.length;
          previewHtml = `
            <div class="subpanel-day-preview-list">
              ${previewItems}
              ${moreCount > 0 ? `<span style="font-size: 0.65rem; color: var(--text-muted); padding-left: 2px;">+${moreCount} more scheduled</span>` : ''}
            </div>
          `;
        }

        card.innerHTML = `
          <div class="subpanel-item-avatar">${avatarInitial}</div>
          <div class="subpanel-item-content">
            <div class="subpanel-item-row-top">
              <span class="subpanel-item-title">${dayStr === todayISO ? 'Today' : dayName} &bull; ${dayFull}</span>
              <span class="subpanel-item-time">${completed}/${scheduled}</span>
            </div>
            <div class="subpanel-item-row-sub">
              <span class="subpanel-item-snippet">${escapeHtml(dayLog.objective || 'No primary objective set')}</span>
              ${pending > 0 ? `<span class="subpanel-item-badge">${pending}</span>` : ''}
            </div>
            ${previewHtml}
          </div>
        `;

        card.addEventListener('click', () => {
          state.currentDate = dayStr;
          updateDateDisplay();
          renderHourlySchedule();
          renderSevenDaysGrid();
          renderSubpanel();
          updateAllMetrics();
        });

        dom.subpanelItemsContainer.appendChild(card);
      });
    } else if (state.currentLevel === 'weekly') {
      for (let w = 1; w <= 4; w++) {
        const wKey = `${parseISODate(state.currentDate).getFullYear()}-M${String(parseISODate(state.currentDate).getMonth() + 1).padStart(2, '0')}-W${w}`;
        const wPlan = state.year_data.weekly_plans[wKey] || { strategy: '', rocks: [] };
        const totalRocks = (wPlan.rocks || []).length;
        const doneRocks = (wPlan.rocks || []).filter(r => r.completed).length;

        if (q) {
          const matchStrat = (wPlan.strategy || '').toLowerCase().includes(q);
          const matchRocks = (wPlan.rocks || []).some(r => (r.title || '').toLowerCase().includes(q));
          const matchWeek = `week ${w}`.includes(q);
          if (!matchStrat && !matchRocks && !matchWeek) return;
        }

        const card = document.createElement('div');
        card.className = `subpanel-item-card ${state.selectedMonthWeek === w ? 'active' : ''}`;
        card.innerHTML = `
          <div class="subpanel-item-avatar">W${w}</div>
          <div class="subpanel-item-content">
            <div class="subpanel-item-row-top">
              <span class="subpanel-item-title">Week ${w} Sprint</span>
              <span class="subpanel-item-time">${doneRocks}/${totalRocks}</span>
            </div>
            <div class="subpanel-item-row-sub">
              <span class="subpanel-item-snippet">${wPlan.strategy ? escapeHtml(wPlan.strategy.substring(0, 32)) + '...' : 'Pre-week intentions'}</span>
            </div>
          </div>
        `;

        card.addEventListener('click', () => {
          state.selectedMonthWeek = w;
          dom.monthWeekSelector.querySelectorAll('.sub-week-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.weeknum, 10) === w);
          });
          renderWeeklyStrategyView();
          renderSubpanel();
        });

        dom.subpanelItemsContainer.appendChild(card);
      }
    } else if (state.currentLevel === 'monthly') {
      const horizons = [
        { id: 'h1', title: 'Horizon 1 (M1 - M4)', sub: 'Foundation & Acceleration' },
        { id: 'h2', title: 'Horizon 2 (M5 - M8)', sub: 'Peak Scale & Mid-Year' },
        { id: 'h3', title: 'Horizon 3 (M9 - M12)', sub: 'Compounding & Victory' }
      ];

      horizons.forEach(h => {
        if (q && !h.title.toLowerCase().includes(q) && !h.sub.toLowerCase().includes(q)) {
          return;
        }

        const card = document.createElement('div');
        card.className = `subpanel-item-card ${state.currentHorizon === h.id ? 'active' : ''}`;
        card.innerHTML = `
          <div class="subpanel-item-avatar">${h.id.toUpperCase()}</div>
          <div class="subpanel-item-content">
            <div class="subpanel-item-row-top">
              <span class="subpanel-item-title">${h.title}</span>
            </div>
            <div class="subpanel-item-row-sub">
              <span class="subpanel-item-snippet">${h.sub}</span>
            </div>
          </div>
        `;

        card.addEventListener('click', () => {
          state.currentHorizon = h.id;
          dom.horizonBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.horizon === h.id);
          });
          renderFourMonthsHorizon();
          renderSubpanel();
        });

        dom.subpanelItemsContainer.appendChild(card);
      });
    } else if (state.currentLevel === 'yearly') {
      const goals = state.year_data.yearly_goals || [];
      const pillars = ['All Goals', 'Career & Growth', 'Health & Endurance', 'Mastery', 'Engineering'];

      pillars.forEach((p, idx) => {
        const count = p === 'All Goals' ? goals.length : goals.filter(g => g.pillar === p).length;
        if (q && !p.toLowerCase().includes(q)) {
          return;
        }

        const card = document.createElement('div');
        card.className = `subpanel-item-card ${idx === 0 ? 'active' : ''}`;
        card.innerHTML = `
          <div class="subpanel-item-avatar">${p.substring(0, 2).toUpperCase()}</div>
          <div class="subpanel-item-content">
            <div class="subpanel-item-row-top">
              <span class="subpanel-item-title">${p}</span>
              <span class="subpanel-item-time">${count}</span>
            </div>
            <div class="subpanel-item-row-sub">
              <span class="subpanel-item-snippet">${p === 'All Goals' ? 'Complete Vision' : 'Strategic Pillar'}</span>
            </div>
          </div>
        `;
        dom.subpanelItemsContainer.appendChild(card);
      });
    } else if (state.currentLevel === 'routines') {
      const allRoutines = getAllRoutines();
      allRoutines.forEach(rt => {
        if (q && !rt.name.toLowerCase().includes(q) && !(rt.description || '').toLowerCase().includes(q)) {
          return;
        }
        const card = document.createElement('div');
        card.className = `subpanel-item-card ${state.activeEditingRoutineId === rt.id ? 'active' : ''}`;
        const initials = rt.name.substring(0, 2).toUpperCase();
        card.innerHTML = `
          <div class="subpanel-item-avatar">${initials}</div>
          <div class="subpanel-item-content">
            <div class="subpanel-item-row-top">
              <span class="subpanel-item-title">${escapeHtml(rt.name)}</span>
              <span class="subpanel-item-time">${rt.isBuiltin ? 'Preset' : 'Custom'}</span>
            </div>
            <div class="subpanel-item-row-sub">
              <span class="subpanel-item-snippet">${escapeHtml(rt.description || '18-hour daily blueprint')}</span>
            </div>
          </div>
        `;
        card.addEventListener('click', () => {
          // If editor is open, open in editor; else scroll to card in grid
          const editorOpen = dom.routineEditorContainer && !dom.routineEditorContainer.classList.contains('hidden');
          if (editorOpen) {
            openRoutineEditor(rt.id);
          } else {
            const cardEl = document.getElementById(`routine-card-${rt.id}`);
            if (cardEl) {
              cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              cardEl.classList.remove('routine-card-highlight');
              void cardEl.offsetWidth;
              cardEl.classList.add('routine-card-highlight');
              setTimeout(() => cardEl.classList.remove('routine-card-highlight'), 900);
            } else {
              openRoutineEditor(rt.id);
            }
          }
        });
        dom.subpanelItemsContainer.appendChild(card);
      });
    } else if (state.currentLevel === 'guide') {
      // Subpanel chapters for "How Abeg"
      const chapters = [
        { id: 'guide-sec-timeblocks', num: '01', title: 'Time Blocks', sub: 'Hourly precision log' },
        { id: 'guide-sec-routines', num: '02', title: 'Routine Blueprints', sub: '1-click 18h templates' },
        { id: 'guide-sec-matrix', num: '03', title: '7-Day Matrix', sub: 'Weekly cadence & reviews' },
        { id: 'guide-sec-weekly', num: '04', title: 'Weekly Strategy', sub: 'Pre-week & Big Rocks' },
        { id: 'guide-sec-horizons', num: '05', title: '4-Month Horizons', sub: 'Quarterly cycles' },
        { id: 'guide-sec-yearly', num: '06', title: 'Annual Vision', sub: 'North-star goals & metrics' },
        { id: 'guide-sec-system', num: '07', title: 'Cloud & Shortcuts', sub: 'Data safety & power tools' }
      ];

      chapters.forEach(ch => {
        if (q && !ch.title.toLowerCase().includes(q) && !ch.sub.toLowerCase().includes(q)) return;

        const card = document.createElement('div');
        card.className = 'subpanel-item-card';
        card.innerHTML = `
          <div class="subpanel-item-avatar">${ch.num}</div>
          <div class="subpanel-item-content">
            <div class="subpanel-item-row-top">
              <span class="subpanel-item-title">${ch.title}</span>
            </div>
            <div class="subpanel-item-row-sub">
              <span class="subpanel-item-snippet">${ch.sub}</span>
            </div>
          </div>
        `;

        card.addEventListener('click', () => {
          const el = document.getElementById(ch.id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });

        dom.subpanelItemsContainer.appendChild(card);
      });
    }
  }

  // ==========================================================================
  // LEVEL 05: HOURLY MICRO-SCHEDULE (TIME BLOCKS)
  // ==========================================================================
  function renderHourlySchedule() {
    const dailyData = getDailyLog(state.currentDate);
    dom.dayPrimaryObjective.value = dailyData.objective || '';

    dom.hourlyTimelineContainer.innerHTML = '';
    const now = new Date();
    const currentHour = now.getHours();
    const isToday = state.currentDate === getTodayISODate();
    const isFuture = isFutureDate(state.currentDate);
    const searchFilter = (state.searchQuery || '').toLowerCase();

    let scheduledCount = 0;
    let completedCount = 0;

    getTimeSlots().forEach(slot => {
      const hourData = dailyData.hours[slot.key] || {
        task: '',
        category: 'Deep Work',
        status: 'pending'
      };

      if (hourData.task && hourData.task.trim().length > 0) {
        scheduledCount++;
        if (hourData.status === 'completed') completedCount++;
      }

      if (state.hourlyFilter !== 'all') {
        if (state.hourlyFilter === 'completed' && hourData.status !== 'completed') return;
        if (state.hourlyFilter === 'pending' && hourData.status !== 'pending') return;
        if (state.hourlyFilter === 'missed' && hourData.status !== 'missed') return;
      }

      if (searchFilter) {
        const matches = (hourData.task || '').toLowerCase().includes(searchFilter) ||
                        slot.label.toLowerCase().includes(searchFilter) ||
                        (hourData.category || '').toLowerCase().includes(searchFilter);
        if (!matches) return;
      }

      const bubbleCard = document.createElement('div');
      bubbleCard.className = `hour-card-bubble status-${hourData.status}`;

      const slotHourNum = parseInt(slot.key.split(':')[0], 10);
      if (isToday && slotHourNum === currentHour) {
        bubbleCard.classList.add('is-current-hour');
      }

      const timeBadge = document.createElement('div');
      timeBadge.className = 'hour-time-badge';
      timeBadge.textContent = slot.label.split(' - ')[0];

      const inputWrap = document.createElement('div');
      inputWrap.className = 'hour-main-input-wrap';

      const taskInput = document.createElement('input');
      taskInput.type = 'text';
      taskInput.className = `hour-task-input ${hourData.status === 'completed' ? 'completed-task' : ''}`;
      taskInput.placeholder = 'Plan focus deliverable for this hour...';
      taskInput.value = hourData.task || '';

      taskInput.addEventListener('input', (e) => {
        hourData.task = e.target.value;
        dailyData.hours[slot.key] = hourData;
        queueAutoSave();
      });

      const metaLine = document.createElement('div');
      metaLine.className = 'hour-meta-line';

      const catSelect = document.createElement('select');
      catSelect.className = 'category-select';
      DEFAULT_CATEGORIES.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        if (hourData.category === cat) opt.selected = true;
        catSelect.appendChild(opt);
      });

      catSelect.addEventListener('change', (e) => {
        hourData.category = e.target.value;
        dailyData.hours[slot.key] = hourData;
        queueAutoSave();
      });

      metaLine.appendChild(catSelect);
      inputWrap.appendChild(taskInput);
      inputWrap.appendChild(metaLine);

      const actionToggles = document.createElement('div');
      actionToggles.className = 'hour-action-toggles';

      const doneBtn = document.createElement('button');
      doneBtn.type = 'button';
      doneBtn.className = `action-toggle-btn ${hourData.status === 'completed' ? 'active-done' : ''}`;
      doneBtn.title = isFuture ? 'Cannot complete a future day task' : 'Mark Complete';
      doneBtn.innerHTML = ICONS.check;
      if (isFuture) {
        doneBtn.style.opacity = '0.35';
        doneBtn.style.cursor = 'not-allowed';
      }

      const missedBtn = document.createElement('button');
      missedBtn.type = 'button';
      missedBtn.className = `action-toggle-btn ${hourData.status === 'missed' ? 'active-missed' : ''}`;
      missedBtn.title = isFuture ? 'Cannot mark future day task as missed' : 'Mark Missed';
      missedBtn.innerHTML = ICONS.cross;
      if (isFuture) {
        missedBtn.style.opacity = '0.35';
        missedBtn.style.cursor = 'not-allowed';
      }

      doneBtn.addEventListener('click', () => {
        if (isFuture) {
          showToast("Future days cannot be marked as completed yet", 'alert');
          return;
        }
        hourData.status = hourData.status === 'completed' ? 'pending' : 'completed';
        dailyData.hours[slot.key] = hourData;
        queueAutoSave();
        renderHourlySchedule();
        renderSevenDaysGrid();
      });

      missedBtn.addEventListener('click', () => {
        if (isFuture) {
          showToast("Future days cannot be marked as missed yet", 'alert');
          return;
        }
        hourData.status = hourData.status === 'missed' ? 'pending' : 'missed';
        dailyData.hours[slot.key] = hourData;
        queueAutoSave();
        renderHourlySchedule();
        renderSevenDaysGrid();
      });

      actionToggles.appendChild(doneBtn);
      actionToggles.appendChild(missedBtn);

      bubbleCard.appendChild(timeBadge);
      bubbleCard.appendChild(inputWrap);
      bubbleCard.appendChild(actionToggles);

      dom.hourlyTimelineContainer.appendChild(bubbleCard);
    });

    if (dom.hourlyStatusSub) {
      dom.hourlyStatusSub.textContent = `Active Timeline &bull; ${completedCount}/${scheduledCount} Done`;
    }
  }

  // ==========================================================================
  // ROUTINE BLUEPRINTS & ARCHITECT ENGINE
  // ==========================================================================
  function getAllRoutines() {
    const custom = (state.year_data && state.year_data.custom_routines) || [];
    return [...BUILTIN_ROUTINES, ...custom];
  }

  function getRoutineById(id) {
    return getAllRoutines().find(r => r.id === id);
  }

  function calculateRoutineDistribution(hoursObj) {
    const counts = {};
    DEFAULT_CATEGORIES.forEach(cat => { counts[cat] = 0; });
    let totalScheduled = 0;

    Object.values(hoursObj || {}).forEach(slot => {
      if (slot && slot.task && slot.task.trim().length > 0) {
        totalScheduled++;
        const cat = slot.category || 'Deep Work';
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });

    return { totalScheduled, counts };
  }

  // --- Routine Dropdown in Time Blocks Header ---
  function renderRoutineDropdown() {
    if (!dom.routineDropdownList) return;
    dom.routineDropdownList.innerHTML = '';

    const allRoutines = getAllRoutines();
    const d = parseISODate(state.currentDate);
    const todayISO = getTodayISODate();
    const dateLabel = state.currentDate === todayISO
      ? 'Today'
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (dom.routineCurrentDateLabel) {
      dom.routineCurrentDateLabel.textContent = dateLabel;
    }
    if (dom.routineDropdownCount) {
      dom.routineDropdownCount.textContent = `${allRoutines.length} Blueprints`;
    }

    allRoutines.forEach(rt => {
      const { totalScheduled, counts } = calculateRoutineDistribution(rt.hours);
      const topCats = Object.entries(counts)
        .filter(([_, cnt]) => cnt > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([c, cnt]) => `${cnt}h ${c}`)
        .join(', ');

      const item = document.createElement('div');
      item.className = 'routine-dropdown-item';
      item.innerHTML = `
        <div class="routine-item-info">
          <div class="routine-item-title-row">
            <span class="routine-item-name">${escapeHtml(rt.name)}</span>
            <span class="routine-preset-tag">${rt.isBuiltin ? 'Preset' : 'Custom'}</span>
          </div>
          <div class="routine-item-desc">${totalScheduled}/18h &bull; ${topCats || 'Full schedule'}</div>
        </div>
        <div class="routine-item-actions">
          <button type="button" class="btn-routine-apply-sm" title="Apply to ${dateLabel}">Apply</button>
          <button type="button" class="btn-routine-icon-sm" title="Edit blueprint">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
          </button>
        </div>
      `;

      item.querySelector('.btn-routine-apply-sm').addEventListener('click', (e) => {
        e.stopPropagation();
        applyRoutineToDate(rt.id, state.currentDate);
        closeRoutineDropdown();
      });

      item.querySelector('.btn-routine-icon-sm').addEventListener('click', (e) => {
        e.stopPropagation();
        closeRoutineDropdown();
        switchToLevel('routines');
        openRoutineEditor(rt.id);
      });

      item.addEventListener('click', () => {
        applyRoutineToDate(rt.id, state.currentDate);
        closeRoutineDropdown();
      });

      dom.routineDropdownList.appendChild(item);
    });
  }

  function toggleRoutineDropdown(forceOpen) {
    if (!dom.routineDropdownMenu) return;
    const isClosed = dom.routineDropdownMenu.classList.contains('hidden');
    const shouldOpen = forceOpen !== undefined ? forceOpen : isClosed;

    if (shouldOpen) {
      renderRoutineDropdown();
      dom.routineDropdownMenu.classList.remove('hidden');
      if (dom.btnRoutineDropdown) {
        dom.btnRoutineDropdown.classList.add('active');
        dom.btnRoutineDropdown.setAttribute('aria-expanded', 'true');
      }
    } else {
      dom.routineDropdownMenu.classList.add('hidden');
      if (dom.btnRoutineDropdown) {
        dom.btnRoutineDropdown.classList.remove('active');
        dom.btnRoutineDropdown.setAttribute('aria-expanded', 'false');
      }
    }
  }

  function closeRoutineDropdown() {
    toggleRoutineDropdown(false);
  }

  function applyRoutineToDate(routineId, dateStr) {
    const routine = getRoutineById(routineId);
    if (!routine) {
      showToast('Routine not found', 'alert');
      return;
    }

    const dailyData = getDailyLog(dateStr);
    getTimeSlots().forEach(slot => {
      const sourceSlot = routine.hours && routine.hours[slot.key];
      if (sourceSlot && sourceSlot.task && sourceSlot.task.trim() !== '') {
        dailyData.hours[slot.key] = {
          task: sourceSlot.task,
          category: sourceSlot.category || 'Deep Work',
          status: 'pending'
        };
      } else {
        delete dailyData.hours[slot.key];
      }
    });

    queueAutoSave();
    renderHourlySchedule();
    renderSevenDaysGrid();
    renderSubpanel();

    const d = parseISODate(dateStr);
    const dayLabel = dateStr === getTodayISODate() ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    showToast(`Loaded "${routine.name}" for ${dayLabel}`, 'success');
  }

  // --- Routines Stage View (Management & Builder Page) ---
  function renderRoutinesStageView() {
    const allRoutines = getAllRoutines();
    if (dom.heroTotalRoutinesCount) {
      dom.heroTotalRoutinesCount.textContent = String(allRoutines.length);
    }
    if (dom.sidebarRoutinesBadge) {
      dom.sidebarRoutinesBadge.textContent = String(allRoutines.length);
    }

    if (!dom.routinesCardsGrid) return;
    dom.routinesCardsGrid.innerHTML = '';
    const totalConfiguredHours = getTimeSlots().length;

    allRoutines.forEach(rt => {
      const { totalScheduled, counts } = calculateRoutineDistribution(rt.hours);
      const card = document.createElement('div');
      card.className = 'routine-card';
      card.id = `routine-card-${rt.id}`;

      const chipsHtml = Object.entries(counts)
        .filter(([_, cnt]) => cnt > 0)
        .map(([cat, cnt]) => `<span class="routine-card-chip">${cnt}h ${cat}</span>`)
        .join('');

      card.innerHTML = `
        <div>
          <div class="routine-card-header">
            <div class="routine-card-title-group">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <h4 class="routine-card-title">${escapeHtml(rt.name)}</h4>
                <span class="routine-preset-tag">${rt.isBuiltin ? 'PRESET' : 'CUSTOM'}</span>
              </div>
              <p class="routine-card-desc">${escapeHtml(rt.description || 'Optimized daily schedule')}</p>
            </div>
          </div>
          <div class="routine-card-stats" style="margin-top: 0.75rem;">
            <span class="routine-card-chip" style="font-weight: 700; color: var(--text-primary);">${totalScheduled}/${totalConfiguredHours} Hours Scheduled</span>
            ${chipsHtml}
          </div>
        </div>

        <div class="routine-card-actions">
          <div style="display: flex; gap: 0.4rem;">
            <button type="button" class="btn-routine-apply-card btn-primary-pill" style="padding: 0.35rem 0.8rem; font-size: 0.78rem;">
              Apply to Today
            </button>
            <button type="button" class="btn-routine-edit-card btn-secondary-sm" style="padding: 0.35rem 0.75rem;">
              ${rt.isBuiltin ? 'Customize Copy' : 'Edit'}
            </button>
          </div>
          <button type="button" class="btn-routine-delete-card icon-circle-btn" title="Delete routine" style="width: 28px; height: 28px;">
            ${ICONS.trash}
          </button>
        </div>
      `;

      card.querySelector('.btn-routine-apply-card').addEventListener('click', () => {
        applyRoutineToDate(rt.id, state.currentDate);
        switchToLevel('micro');
      });

      card.querySelector('.btn-routine-edit-card').addEventListener('click', () => {
        openRoutineEditor(rt.id);
      });

      const delBtn = card.querySelector('.btn-routine-delete-card');
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          deleteRoutine(rt.id);
        });
      }

      dom.routinesCardsGrid.appendChild(card);
    });
  }

  function openRoutineEditor(routineId) {
    state.activeEditingRoutineId = routineId || null;
    if (dom.routinesListContainer) dom.routinesListContainer.classList.add('hidden');
    if (dom.routineEditorContainer) dom.routineEditorContainer.classList.remove('hidden');

    let initialName = '';
    let initialDesc = '';
    let hoursData = {};

    if (routineId) {
      const found = getRoutineById(routineId);
      if (found) {
        initialName = found.isBuiltin ? `${found.name} (Custom)` : found.name;
        initialDesc = found.description || '';
        hoursData = JSON.parse(JSON.stringify(found.hours || {}));
        if (dom.routineEditorTitle) {
          dom.routineEditorTitle.textContent = found.isBuiltin ? `Create Blueprint from "${found.name}"` : `Edit "${found.name}"`;
        }
        if (dom.btnDeleteCustomRoutine) {
          dom.btnDeleteCustomRoutine.classList.remove('hidden');
        }
      }
    } else {
      if (dom.routineEditorTitle) {
        dom.routineEditorTitle.textContent = 'Create New Routine Blueprint';
      }
      if (dom.btnDeleteCustomRoutine) {
        dom.btnDeleteCustomRoutine.classList.add('hidden');
      }
    }

    if (dom.routineNameInput) dom.routineNameInput.value = initialName;
    if (dom.routineDescInput) dom.routineDescInput.value = initialDesc;

    populateRoutineEditorHours(hoursData);
    updateRoutineEditorLiveBreakdown();

    // Smooth scroll down to the editor inputs so user sees it right away
    setTimeout(() => {
      if (dom.routineEditorContainer) {
        dom.routineEditorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (dom.routineNameInput) {
        dom.routineNameInput.focus();
      }
    }, 100);
  }

  function closeRoutineEditor() {
    state.activeEditingRoutineId = null;
    if (dom.routineEditorContainer) dom.routineEditorContainer.classList.add('hidden');
    if (dom.routinesListContainer) dom.routinesListContainer.classList.remove('hidden');
    renderRoutinesStageView();
    renderSubpanel();
  }

  function populateRoutineEditorHours(hoursData) {
    if (!dom.routineHoursEditorFeed) return;
    dom.routineHoursEditorFeed.innerHTML = '';

    getTimeSlots().forEach(slot => {
      const current = (hoursData && hoursData[slot.key]) || { task: '', category: 'Deep Work' };
      const row = document.createElement('div');
      row.className = 'routine-hour-row-card';
      row.dataset.slot = slot.key;

      const catOptionsHtml = DEFAULT_CATEGORIES.map(cat => 
        `<option value="${cat}" ${current.category === cat ? 'selected' : ''}>${cat}</option>`
      ).join('');

      row.innerHTML = `
        <span class="routine-hour-badge">${slot.key}</span>
        <input type="text" class="routine-hour-task-input" placeholder="Task or focus area for ${slot.label.split(' - ')[0]}..." value="${escapeHtml(current.task || '')}" />
        <select class="routine-hour-category-select">
          ${catOptionsHtml}
        </select>
        <button type="button" class="btn-routine-hour-clear" title="Clear slot">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;

      const taskInput = row.querySelector('.routine-hour-task-input');
      const catSelect = row.querySelector('.routine-hour-category-select');
      const clearBtn = row.querySelector('.btn-routine-hour-clear');

      taskInput.addEventListener('input', updateRoutineEditorLiveBreakdown);
      catSelect.addEventListener('change', updateRoutineEditorLiveBreakdown);

      clearBtn.addEventListener('click', () => {
        taskInput.value = '';
        updateRoutineEditorLiveBreakdown();
      });

      dom.routineHoursEditorFeed.appendChild(row);
    });
  }

  function collectRoutineEditorHours() {
    const hours = {};
    if (!dom.routineHoursEditorFeed) return hours;

    const rows = dom.routineHoursEditorFeed.querySelectorAll('.routine-hour-row-card');
    rows.forEach(row => {
      const slotKey = row.dataset.slot;
      const taskVal = (row.querySelector('.routine-hour-task-input')?.value || '').trim();
      const catVal = row.querySelector('.routine-hour-category-select')?.value || 'Deep Work';

      if (taskVal.length > 0) {
        hours[slotKey] = {
          task: taskVal,
          category: catVal
        };
      }
    });

    return hours;
  }

  function updateRoutineEditorLiveBreakdown() {
    const hours = collectRoutineEditorHours();
    const { totalScheduled, counts } = calculateRoutineDistribution(hours);
    const totalConfigured = getTimeSlots().length;

    if (dom.routineBreakdownSummary) {
      dom.routineBreakdownSummary.textContent = `${totalScheduled} / ${totalConfigured} hours scheduled`;
    }

    if (dom.routineCategoryChips) {
      dom.routineCategoryChips.innerHTML = '';
      Object.entries(counts).forEach(([cat, cnt]) => {
        if (cnt > 0) {
          const chip = document.createElement('span');
          chip.className = 'routine-category-chip';
          chip.innerHTML = `${cat}: <strong>${cnt}h</strong>`;
          dom.routineCategoryChips.appendChild(chip);
        }
      });
      if (totalScheduled === 0) {
        dom.routineCategoryChips.innerHTML = '<span style="font-size: 0.74rem; color: var(--text-muted);">No tasks entered yet</span>';
      }
    }
  }

  function saveCurrentRoutineEditor(andApplyToToday) {
    const name = (dom.routineNameInput?.value || '').trim();
    if (!name) {
      showToast('Please enter a routine name', 'alert');
      dom.routineNameInput?.focus();
      return;
    }

    const desc = (dom.routineDescInput?.value || '').trim();
    const hours = collectRoutineEditorHours();

    if (!state.year_data.custom_routines) {
      state.year_data.custom_routines = [];
    }

    let savedId = state.activeEditingRoutineId;
    const isExistingCustom = savedId && !savedId.startsWith('builtin_');

    if (isExistingCustom) {
      const idx = state.year_data.custom_routines.findIndex(r => r.id === savedId);
      if (idx !== -1) {
        state.year_data.custom_routines[idx] = {
          id: savedId,
          name,
          description: desc,
          isBuiltin: false,
          hours
        };
      } else {
        savedId = 'rt_' + Date.now();
        state.year_data.custom_routines.push({
          id: savedId,
          name,
          description: desc,
          isBuiltin: false,
          hours
        });
      }
    } else {
      savedId = 'rt_' + Date.now();
      state.year_data.custom_routines.push({
        id: savedId,
        name,
        description: desc,
        isBuiltin: false,
        hours
      });
    }

    queueAutoSave();
    showToast(`Routine "${name}" saved successfully`, 'success');

    if (andApplyToToday) {
      applyRoutineToDate(savedId, state.currentDate);
      closeRoutineEditor();
      switchToLevel('micro');
    } else {
      closeRoutineEditor();
    }
  }

  function deleteRoutine(routineId) {
    const found = getRoutineById(routineId);
    const routineName = found ? found.name : 'this routine';
    if (!confirm(`Are you sure you want to delete "${routineName}"?`)) return;

    if (found && found.isBuiltin) {
      // Remove builtin from runtime list
      const idx = BUILTIN_ROUTINES.findIndex(r => r.id === routineId);
      if (idx !== -1) {
        BUILTIN_ROUTINES.splice(idx, 1);
      }
    } else if (state.year_data.custom_routines) {
      const idx = state.year_data.custom_routines.findIndex(r => r.id === routineId);
      if (idx !== -1) {
        state.year_data.custom_routines.splice(idx, 1);
      }
    }

    queueAutoSave();
    renderRoutinesStageView();
    renderSubpanel();
    if (dom.routineEditorContainer && !dom.routineEditorContainer.classList.contains('hidden')) {
      closeRoutineEditor();
    }
    showToast(`Deleted routine "${routineName}"`, 'info');
  }

  function markAllDayComplete() {
    if (isFutureDate(state.currentDate)) {
      showToast("Cannot mark all done on a future date", 'alert');
      return;
    }
    const dailyData = getDailyLog(state.currentDate);
    Object.keys(dailyData.hours).forEach(slotKey => {
      if (dailyData.hours[slotKey].task && dailyData.hours[slotKey].task.trim() !== '') {
        dailyData.hours[slotKey].status = 'completed';
      }
    });
    queueAutoSave();
    renderHourlySchedule();
    renderSevenDaysGrid();
    showToast('All scheduled blocks marked as complete', 'success');
  }

  function clearDayLog() {
    const dailyData = getDailyLog(state.currentDate);
    dailyData.objective = '';
    dailyData.hours = {};
    queueAutoSave();
    renderHourlySchedule();
    renderSevenDaysGrid();
    showToast('Daily log cleared', 'info');
  }

  // ==========================================================================
  // LEVEL 04: 7-DAY WEEK VIEW & HISTORICAL REVIEW LOG
  // ==========================================================================
  function renderSevenDaysGrid() {
    dom.sevenDaysContainer.innerHTML = '';
    const weekDays = getWeekDateRange(state.currentDate);
    const todayISO = getTodayISODate();
    const searchFilter = (state.searchQuery || '').toLowerCase();

    const d = parseISODate(state.currentDate);
    dom.currentWeekIdentifier.textContent = `Active Week &bull; ${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getFullYear()}`;

    let totalWeekCompleted = 0;
    let totalWeekScheduled = 0;

    dom.weekReviewTableBody.innerHTML = '';

    weekDays.forEach(dayStr => {
      const dayDate = parseISODate(dayStr);
      const dayNameShort = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = dayDate.getDate();

      const dayLog = state.year_data.daily_logs[dayStr] || { objective: '', hours: {} };
      const hoursArray = Object.values(dayLog.hours);
      const scheduled = hoursArray.filter(h => h.task && h.task.trim().length > 0).length;
      const completed = hoursArray.filter(h => h.status === 'completed' && h.task && h.task.trim().length > 0).length;
      const missed = hoursArray.filter(h => h.status === 'missed' && h.task && h.task.trim().length > 0).length;

      totalWeekScheduled += scheduled;
      totalWeekCompleted += completed;

      const pct = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;

      // Filter check for search query in 7-Day Matrix view
      let matchesSearch = true;
      if (searchFilter) {
        const matchesDay = dayNameShort.toLowerCase().includes(searchFilter) || String(dayNum).includes(searchFilter);
        const matchesObj = (dayLog.objective || '').toLowerCase().includes(searchFilter);
        const matchesTasks = hoursArray.some(h => (h.task || '').toLowerCase().includes(searchFilter) || (h.category || '').toLowerCase().includes(searchFilter));
        matchesSearch = matchesDay || matchesObj || matchesTasks;
      }

      const card = document.createElement('div');
      card.className = `day-card ${dayStr === state.currentDate ? 'active-selected-day' : ''}`;
      if (!matchesSearch) {
        card.style.opacity = '0.25';
      }
      card.innerHTML = `
        <span class="day-card-name">${dayNameShort}</span>
        <span class="day-card-num">${dayNum}</span>
        <div class="day-card-bar-wrapper">
          <div class="day-card-bar-fill" style="width: ${pct}%"></div>
        </div>
        <span class="day-card-stat">${completed}/${scheduled} hrs</span>
      `;

      card.addEventListener('click', () => {
        state.currentDate = dayStr;
        updateDateDisplay();
        renderHourlySchedule();
        renderSevenDaysGrid();
        renderSubpanel();
        updateAllMetrics();
      });

      dom.sevenDaysContainer.appendChild(card);

      if (matchesSearch) {
        const tr = document.createElement('tr');
        const isSelectedDay = dayStr === state.currentDate;
        tr.innerHTML = `
          <td><strong>${dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong> ${dayStr === todayISO ? '<span class="badge-tag" style="padding: 0.1rem 0.35rem; font-size: 0.65rem;">Today</span>' : ''}</td>
          <td>${escapeHtml(dayLog.objective || '—')}</td>
          <td>${scheduled}</td>
          <td style="font-weight: 600;">${completed}</td>
          <td style="color: var(--text-muted);">${missed}</td>
          <td>
            <span style="font-family: var(--font-mono); font-weight: 600;">${pct}%</span>
          </td>
          <td>
            <button class="table-jump-btn" data-date="${dayStr}">${isSelectedDay ? 'Viewing' : 'Open'}</button>
          </td>
        `;

        tr.querySelector('.table-jump-btn').addEventListener('click', () => {
          state.currentDate = dayStr;
          updateDateDisplay();
          switchToLevel('micro');
        });

        dom.weekReviewTableBody.appendChild(tr);
      }
    });

    const weekAvg = totalWeekScheduled > 0 ? Math.round((totalWeekCompleted / totalWeekScheduled) * 100) : 0;
    dom.weekAverageScoreBadge.textContent = `Week Avg: ${weekAvg}%`;
  }

  // ==========================================================================
  // LEVEL 03: WEEKLY PLANNING & PRE-WEEK STRATEGY
  // ==========================================================================
  function renderWeeklyStrategyView() {
    const weeklyPlan = getWeeklyPlan();
    dom.weeklyStrategyTitle.textContent = `Week ${state.selectedMonthWeek} Strategic Intentions`;
    dom.weeklyStrategyText.value = weeklyPlan.strategy || '';

    dom.weeklyRocksList.innerHTML = '';
    const q = (state.searchQuery || '').toLowerCase();

    weeklyPlan.rocks.forEach((rock, idx) => {
      if (q && !(rock.title || '').toLowerCase().includes(q)) {
        return;
      }

      const row = document.createElement('div');
      row.className = 'rock-item-row';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'rock-checkbox';
      cb.checked = !!rock.completed;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = `rock-input ${rock.completed ? 'done' : ''}`;
      input.value = rock.title || '';

      const delBtn = document.createElement('button');
      delBtn.className = 'rock-del-btn';
      delBtn.innerHTML = ICONS.trash;
      delBtn.title = 'Delete Deliverable';

      cb.addEventListener('change', () => {
        rock.completed = cb.checked;
        input.classList.toggle('done', cb.checked);
        queueAutoSave();
      });

      input.addEventListener('input', (e) => {
        rock.title = e.target.value;
        queueAutoSave();
      });

      delBtn.addEventListener('click', () => {
        weeklyPlan.rocks.splice(idx, 1);
        queueAutoSave();
        renderWeeklyStrategyView();
      });

      row.appendChild(cb);
      row.appendChild(input);
      row.appendChild(delBtn);
      dom.weeklyRocksList.appendChild(row);
    });
  }

  function addWeeklyRock(customTitle) {
    const weeklyPlan = getWeeklyPlan();
    weeklyPlan.rocks.push({
      id: 'r_' + Date.now(),
      title: customTitle || 'New high-impact weekly deliverable',
      completed: false
    });
    queueAutoSave();
    renderWeeklyStrategyView();
  }

  // ==========================================================================
  // LEVEL 02: 4-MONTH / MONTHLY HORIZON GOALS
  // ==========================================================================
  function renderFourMonthsHorizon() {
    dom.fourMonthsContainer.innerHTML = '';
    const horizonData = state.year_data.four_months[state.currentHorizon] || {};
    const q = (state.searchQuery || '').toLowerCase();

    const monthTitles = {
      h1: ['Month 1 (Foundation)', 'Month 2 (Acceleration)', 'Month 3 (Execution)', 'Month 4 (Launch & Review)'],
      h2: ['Month 5 (Expansion)', 'Month 6 (Mid-Year)', 'Month 7 (Scale)', 'Month 8 (Consolidation)'],
      h3: ['Month 9 (Q3 Sprints)', 'Month 10 (Compounding)', 'Month 11 (Final Push)', 'Month 12 (Annual Victory)']
    }[state.currentHorizon] || ['Month 1', 'Month 2', 'Month 3', 'Month 4'];

    for (let i = 1; i <= 4; i++) {
      const mKey = `m${i}`;
      if (!horizonData[mKey]) {
        horizonData[mKey] = { target: '', milestones: [] };
      }
      const mData = horizonData[mKey];

      // Normalize milestones to objects with { text, completed }
      if (mData.milestones && mData.milestones.length > 0) {
        mData.milestones = mData.milestones.map(ms => {
          if (typeof ms === 'string') {
            return { text: ms, completed: false };
          }
          return ms;
        });
      }

      const card = document.createElement('div');
      card.className = 'month-horizon-card';

      card.innerHTML = `
        <div class="month-card-header">
          <span class="month-name-title">${monthTitles[i - 1]}</span>
          <span class="month-badge-tag">M0${i}</span>
        </div>
        <textarea class="month-target-textarea" placeholder="Strategic targets & focus...">${escapeHtml(mData.target || '')}</textarea>
        <div class="month-milestones-wrapper">
          <span class="month-milestone-title">Key Checkpoints</span>
          <div class="milestones-list-box" id="milestones_list_${mKey}"></div>
          <button class="btn-secondary-sm add-m-checkpoint-btn" style="align-self: flex-start; margin-top: 0.35rem;">+ Add Checkpoint</button>
        </div>
      `;

      const ta = card.querySelector('.month-target-textarea');
      ta.addEventListener('input', (e) => {
        mData.target = e.target.value;
        queueAutoSave();
      });

      const milestonesBox = card.querySelector(`#milestones_list_${mKey}`);
      const renderMilestones = () => {
        milestonesBox.innerHTML = '';
        (mData.milestones || []).forEach((msObj, msIdx) => {
          const msText = typeof msObj === 'string' ? msObj : msObj.text;
          const isDone = typeof msObj === 'object' ? !!msObj.completed : false;

          if (q && !msText.toLowerCase().includes(q)) {
            return;
          }

          const mItem = document.createElement('div');
          mItem.className = 'milestone-item';
          mItem.innerHTML = `
            <input type="checkbox" class="milestone-checkbox" ${isDone ? 'checked' : ''} title="Mark checkpoint complete" />
            <input type="text" class="milestone-input ${isDone ? 'done' : ''}" value="${escapeHtml(msText || '')}" placeholder="Checkpoint description" />
            <button class="rock-del-btn" style="padding: 0 4px;" title="Delete checkpoint">${ICONS.cross}</button>
          `;

          const msCheckbox = mItem.querySelector('.milestone-checkbox');
          const msInput = mItem.querySelector('.milestone-input');

          msCheckbox.addEventListener('change', () => {
            if (typeof mData.milestones[msIdx] === 'string') {
              mData.milestones[msIdx] = { text: mData.milestones[msIdx], completed: msCheckbox.checked };
            } else {
              mData.milestones[msIdx].completed = msCheckbox.checked;
            }
            msInput.classList.toggle('done', msCheckbox.checked);
            queueAutoSave();
          });

          msInput.addEventListener('input', (e) => {
            if (typeof mData.milestones[msIdx] === 'string') {
              mData.milestones[msIdx] = { text: e.target.value, completed: isDone };
            } else {
              mData.milestones[msIdx].text = e.target.value;
            }
            queueAutoSave();
          });

          mItem.querySelector('.rock-del-btn').addEventListener('click', () => {
            mData.milestones.splice(msIdx, 1);
            queueAutoSave();
            renderMilestones();
          });

          milestonesBox.appendChild(mItem);
        });
      };

      renderMilestones();

      card.querySelector('.add-m-checkpoint-btn').addEventListener('click', () => {
        if (!mData.milestones) mData.milestones = [];
        mData.milestones.push({ text: 'Key delivery checkpoint', completed: false });
        queueAutoSave();
        renderMilestones();
      });

      dom.fourMonthsContainer.appendChild(card);
    }
  }

  // ==========================================================================
  // LEVEL 01: YEARLY VISION & ANNUAL GOALS
  // ==========================================================================
  function renderYearlyGoals() {
    dom.yearlyMainTitle.textContent = `${state.selectedYear} Master Vision & Annual Goals`;
    dom.yearlyGoalsContainer.innerHTML = '';
    const q = (state.searchQuery || '').toLowerCase();

    const goals = state.year_data.yearly_goals || [];

    goals.forEach((goal, idx) => {
      if (q) {
        const matchTitle = (goal.title || '').toLowerCase().includes(q);
        const matchPillar = (goal.pillar || '').toLowerCase().includes(q);
        const matchMetric = (goal.targetMetric || '').toLowerCase().includes(q);
        if (!matchTitle && !matchPillar && !matchMetric) return;
      }

      const card = document.createElement('div');
      card.className = 'yearly-goal-card';
      card.id = `goal-card-${goal.id}`;

      card.innerHTML = `
        <div class="yearly-goal-top">
          <span class="pillar-badge">${escapeHtml(goal.pillar || 'Strategic Pillar')}</span>
          <button class="goal-delete-btn" title="Delete Goal">${ICONS.trash}</button>
        </div>
        <input type="text" class="yearly-goal-title-input" value="${escapeHtml(goal.title || '')}" placeholder="Goal Title" />
        <div class="goal-metric-target-row">
          <span>Target Metric:</span>
          <input type="text" class="goal-metric-input" value="${escapeHtml(goal.targetMetric || '')}" placeholder="e.g. $250k ARR or 24 Books" />
        </div>
        <div class="goal-card-footer">
          <span style="font-size: 0.74rem; color: var(--text-muted);">Status:</span>
          <select class="goal-status-select">
            <option value="In Progress" ${goal.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Achieved" ${goal.status === 'Achieved' ? 'selected' : ''}>Achieved</option>
            <option value="Deferred" ${goal.status === 'Deferred' ? 'selected' : ''}>Deferred</option>
          </select>
        </div>
      `;

      card.querySelector('.yearly-goal-title-input').addEventListener('input', (e) => {
        goal.title = e.target.value;
        queueAutoSave();
      });

      card.querySelector('.goal-metric-input').addEventListener('input', (e) => {
        goal.targetMetric = e.target.value;
        queueAutoSave();
      });

      card.querySelector('.goal-status-select').addEventListener('change', (e) => {
        goal.status = e.target.value;
        queueAutoSave();
        updateAllMetrics();
      });

      card.querySelector('.goal-delete-btn').addEventListener('click', () => {
        goals.splice(idx, 1);
        queueAutoSave();
        renderYearlyGoals();
        updateAllMetrics();
      });

      dom.yearlyGoalsContainer.appendChild(card);
    });
  }

  function addNewYearlyGoal(customTitle, customPillar, customMetric) {
    if (!state.year_data.yearly_goals) {
      state.year_data.yearly_goals = [];
    }
    const newId = 'yg_' + Date.now();
    state.year_data.yearly_goals.push({
      id: newId,
      title: customTitle || 'New High-Level Annual Target',
      pillar: customPillar || 'Strategic Growth',
      targetMetric: customMetric || '100% Target Met',
      status: 'In Progress'
    });
    queueAutoSave();
    renderYearlyGoals();
    updateAllMetrics();

    // Smooth scroll down to the newly created goal card and add a bounce indicator animation
    setTimeout(() => {
      const cardEl = document.getElementById(`goal-card-${newId}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        cardEl.classList.remove('goal-card-bouncing');
        void cardEl.offsetWidth; // Trigger reflow
        cardEl.classList.add('goal-card-bouncing');
        const input = cardEl.querySelector('.yearly-goal-title-input');
        if (input) input.focus();
        setTimeout(() => cardEl.classList.remove('goal-card-bouncing'), 1200);
      }
    }, 80);
  }

  // ==========================================================================
  // DASHBOARD METRICS & REAL-TIME STATS
  // ==========================================================================
  function updateAllMetrics() {
    const todayLog = getDailyLog(state.currentDate);
    const todayHours = Object.values(todayLog.hours);
    const scheduledHours = todayHours.filter(h => h.task && h.task.trim().length > 0).length;
    const completedHours = todayHours.filter(h => h.status === 'completed' && h.task && h.task.trim().length > 0).length;
    const pendingHours = scheduledHours - completedHours;

    const dailyPct = scheduledHours > 0 ? Math.round((completedHours / scheduledHours) * 100) : 0;
    if (dom.dailyMiniProgressFill) {
      dom.dailyMiniProgressFill.style.width = `${dailyPct}%`;
    }
    dom.dailyBlockRatio.textContent = `${completedHours} / ${scheduledHours} hrs`;
    if (dom.sidebarTodayPendingBadge) {
      dom.sidebarTodayPendingBadge.textContent = String(pendingHours >= 0 ? pendingHours : 0);
    }
    if (dom.sidebarRoutinesBadge) {
      dom.sidebarRoutinesBadge.textContent = String(getAllRoutines().length);
    }

    const yGoals = state.year_data.yearly_goals || [];
    const totalGoals = yGoals.length;
    const achievedGoals = yGoals.filter(g => g.status === 'Achieved').length;
    const inProgressGoals = yGoals.filter(g => g.status === 'In Progress').length;

    const yearlyPct = totalGoals > 0 ? Math.round(((achievedGoals * 1.0 + inProgressGoals * 0.4) / totalGoals) * 100) : 0;

    dom.yearlyOverallBarFill.style.width = `${yearlyPct}%`;
    dom.yearlyOverallBarText.textContent = `${yearlyPct}% Complete`;
    dom.yearlyGoalsCountLegend.textContent = `${achievedGoals} of ${totalGoals} Key Targets Achieved`;
    dom.yearlyVisionStatusText.textContent = yearlyPct >= 75 ? 'Target Victory' : yearlyPct >= 35 ? 'Active Execution' : 'Planning Phase';
  }

  // ==========================================================================
  // NAVIGATION & VIEW SWITCHING
  // ==========================================================================
  function switchToLevel(levelKey) {
    state.currentLevel = levelKey;
    dom.navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.level === levelKey);
    });

    dom.views.forEach(view => {
      view.classList.toggle('active-view', view.id === `view-${levelKey}`);
    });

    if (levelKey === 'micro') renderHourlySchedule();
    if (levelKey === 'routines') renderRoutinesStageView();
    if (levelKey === 'daily') renderSevenDaysGrid();
    if (levelKey === 'weekly') renderWeeklyStrategyView();
    if (levelKey === 'monthly') renderFourMonthsHorizon();
    if (levelKey === 'yearly') renderYearlyGoals();

    renderSubpanel();
    updateAllMetrics();
  }

  function renderAllViews() {
    renderHourlySchedule();
    renderRoutinesStageView();
    renderSevenDaysGrid();
    renderWeeklyStrategyView();
    renderFourMonthsHorizon();
    renderYearlyGoals();
  }

  // ==========================================================================
  // QUICK "+ NEW ITEM" MODAL HANDLERS
  // ==========================================================================
  function openNewItemModal() {
    dom.newItemModalBackdrop.classList.remove('hidden');
    // Pre-select tab corresponding to active view if applicable
    if (state.currentLevel === 'weekly') {
      switchNewItemTab('rock');
    } else if (state.currentLevel === 'monthly') {
      switchNewItemTab('milestone');
    } else if (state.currentLevel === 'yearly') {
      switchNewItemTab('goal');
    } else {
      switchNewItemTab('block');
    }
  }

  function closeNewItemModal() {
    dom.newItemModalBackdrop.classList.add('hidden');
  }

  function switchNewItemTab(tabType) {
    newItemType = tabType;
    dom.newItemTabs.querySelectorAll('.modal-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === tabType);
    });

    document.getElementById('formSecBlock').classList.toggle('hidden', tabType !== 'block');
    document.getElementById('formSecRock').classList.toggle('hidden', tabType !== 'rock');
    document.getElementById('formSecMilestone').classList.toggle('hidden', tabType !== 'milestone');
    document.getElementById('formSecGoal').classList.toggle('hidden', tabType !== 'goal');
  }

  function handleNewItemSubmit(e) {
    e.preventDefault();

    if (newItemType === 'block') {
      const timeKey = dom.newBlockTime.value;
      const taskText = dom.newBlockTask.value.trim();
      const category = dom.newBlockCategory.value;

      if (!taskText) {
        showToast('Please enter a task description', 'alert');
        return;
      }

      const dailyData = getDailyLog(state.currentDate);
      dailyData.hours[timeKey] = {
        task: taskText,
        category: category,
        status: 'pending'
      };

      queueAutoSave();
      renderHourlySchedule();
      closeNewItemModal();
      dom.newBlockTask.value = '';
      switchToLevel('micro');
      showToast(`Time block scheduled for ${timeKey}`, 'success');
    } else if (newItemType === 'rock') {
      const weekNum = parseInt(dom.newRockWeek.value, 10);
      const title = dom.newRockTitle.value.trim();

      if (!title) {
        showToast('Please enter a deliverable title', 'alert');
        return;
      }

      state.selectedMonthWeek = weekNum;
      addWeeklyRock(title);
      closeNewItemModal();
      dom.newRockTitle.value = '';
      switchToLevel('weekly');
      showToast(`Deliverable added to Week ${weekNum}`, 'success');
    } else if (newItemType === 'milestone') {
      const horizonKey = dom.newMilestoneHorizon.value;
      const monthKey = dom.newMilestoneMonth.value;
      const title = dom.newMilestoneTitle.value.trim();

      if (!title) {
        showToast('Please enter a checkpoint title', 'alert');
        return;
      }

      state.currentHorizon = horizonKey;
      if (!state.year_data.four_months[horizonKey]) {
        state.year_data.four_months[horizonKey] = {};
      }
      if (!state.year_data.four_months[horizonKey][monthKey]) {
        state.year_data.four_months[horizonKey][monthKey] = { target: '', milestones: [] };
      }
      state.year_data.four_months[horizonKey][monthKey].milestones.push({ text: title, completed: false });

      queueAutoSave();
      renderFourMonthsHorizon();
      closeNewItemModal();
      dom.newMilestoneTitle.value = '';
      switchToLevel('monthly');
      showToast(`Checkpoint added to ${horizonKey.toUpperCase()}`, 'success');
    } else if (newItemType === 'goal') {
      const title = dom.newGoalTitle.value.trim();
      const pillar = dom.newGoalPillar.value.trim() || 'Strategic Growth';
      const metric = dom.newGoalMetric.value.trim() || 'Target Metric';

      if (!title) {
        showToast('Please enter a goal title', 'alert');
        return;
      }

      addNewYearlyGoal(title, pillar, metric);
      closeNewItemModal();
      dom.newGoalTitle.value = '';
      switchToLevel('yearly');
      showToast('Annual goal created', 'success');
    }
  }

  // ==========================================================================
  // AUTHENTICATION & MODAL LOGIC
  // ==========================================================================
  function openAuthModal(mode = 'login') {
    authMode = mode;
    updateAuthModalModeUI();
    dom.authAlertBox.classList.add('hidden');
    dom.authEmail.value = '';
    dom.authPassword.value = '';
    dom.authModalBackdrop.classList.remove('hidden');
  }

  function closeAuthModal() {
    dom.authModalBackdrop.classList.add('hidden');
  }

  function updateAuthModalModeUI() {
    if (authMode === 'login') {
      dom.tabSwitchLogin.classList.add('active');
      dom.tabSwitchRegister.classList.remove('active');
      dom.authModalHeading.textContent = 'Sign In';
      dom.authModalSubtitle.textContent = 'Sign in to sync your productivity data across devices via PostgreSQL.';
      dom.authSubmitBtnText.textContent = 'Sign In';
    } else {
      dom.tabSwitchRegister.classList.add('active');
      dom.tabSwitchLogin.classList.remove('active');
      dom.authModalHeading.textContent = 'Create Account';
      dom.authModalSubtitle.textContent = 'Provision your cloud storage on PostgreSQL.';
      dom.authSubmitBtnText.textContent = 'Create Account';
    }
  }

  async function handleAuthFormSubmit(e) {
    e.preventDefault();
    const email = dom.authEmail.value.trim();
    const password = dom.authPassword.value;

    if (!email || !password) {
      showAuthAlert('Please fill in both email and password.');
      return;
    }

    if (password.length < 6) {
      showAuthAlert('Password must be at least 6 characters.');
      return;
    }

    setAuthLoading(true);
    dom.authAlertBox.classList.add('hidden');

    const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      state.token = data.token;
      state.user = data.user;
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

      updateUserSessionUI();
      closeAuthModal();
      showToast(`Welcome, ${data.user.email}!`, 'success');
      await loadGoalsFromBackend();
    } catch (err) {
      showAuthAlert(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function showAuthAlert(message) {
    dom.authAlertBox.textContent = message;
    dom.authAlertBox.classList.remove('hidden');
  }

  function setAuthLoading(isLoading) {
    dom.authSubmitBtn.disabled = isLoading;
    dom.authSpinner.classList.toggle('hidden', !isLoading);
    dom.authSubmitBtnText.classList.toggle('hidden', isLoading);
  }

  function updateUserSessionUI() {
    if (state.token && state.user) {
      const emailInitial = (state.user.email || 'US').substring(0, 2).toUpperCase();
      dom.userEmailDisplay.textContent = state.user.email.split('@')[0];
      dom.userAvatarText.textContent = emailInitial;
      dom.topAvatarInitials.textContent = emailInitial;
      dom.userStatusSub.textContent = 'Cloud Active';
      dom.logoutBtn.classList.remove('hidden');
      updateSyncStatusUI('synced', 'Synced');
    } else {
      dom.userEmailDisplay.textContent = 'Guest User';
      dom.userAvatarText.textContent = 'PR';
      dom.topAvatarInitials.textContent = 'PR';
      dom.userStatusSub.textContent = 'Local Mode';
      dom.logoutBtn.classList.add('hidden');
      updateSyncStatusUI('offline', 'Offline (Local)');
    }
  }

  function handleSignOut(notify = true) {
    state.token = null;
    state.user = null;
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    updateUserSessionUI();
    if (notify) showToast('Signed out', 'info');
    showGatewayAuthPane('login');
    if (dom.appAuthGateway) dom.appAuthGateway.classList.remove('hidden');
  }

  // ==========================================================================
  // AUTH GATEWAY & SESSION INACTIVITY (48h LIMIT)
  // ==========================================================================
  function getSavedProfile() {
    try {
      const stored = localStorage.getItem(SAVED_PROFILE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    if (state.user && state.user.name) {
      return { name: state.user.name, email: state.user.email || 'prince@workspace.io' };
    }
    return null;
  }

  function saveSavedProfile(name, email) {
    const profile = { name: name || 'Prince', email: email || 'prince@workspace.io' };
    localStorage.setItem(SAVED_PROFILE_KEY, JSON.stringify(profile));
    return profile;
  }

  function getLastActiveTime() {
    const val = localStorage.getItem(LAST_ACTIVE_KEY);
    if (!val) return 0;
    const num = parseInt(val, 10);
    return isNaN(num) ? 0 : num;
  }

  function recordUserActivity() {
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  }

  function checkGatewaySessionState() {
    if (!dom.appAuthGateway) return;

    const profile = getSavedProfile();
    const lastActive = getLastActiveTime();
    const now = Date.now();
    const elapsed = now - lastActive;
    const isExpired = lastActive > 0 && elapsed >= INACTIVITY_LIMIT_MS;
    const isFirstVisit = !profile || lastActive === 0;

    if (isFirstVisit) {
      // First time user: directly show Create Account mode
      if (dom.gatewayExpiryNotice) {
        dom.gatewayExpiryNotice.classList.add('hidden');
      }
      showGatewayAuthPane('register');
      dom.appAuthGateway.classList.remove('hidden');
      return;
    }

    if (isExpired) {
      if (dom.gatewayExpiryNotice) {
        dom.gatewayExpiryNotice.classList.remove('hidden');
      }
      showGatewayAuthPane('login');
      dom.appAuthGateway.classList.remove('hidden');
      return;
    }

    // Active session (< 48h): Show quick resume card
    if (dom.gatewayUserName) dom.gatewayUserName.textContent = profile.name || 'Prince';
    if (dom.btnGatewayContinueText) dom.btnGatewayContinueText.textContent = `Continue as ${profile.name || 'Prince'}`;
    if (dom.gatewayUserAvatar) {
      const initials = (profile.name || 'Prince').substring(0, 2).toUpperCase();
      dom.gatewayUserAvatar.textContent = initials;
    }

    if (dom.gatewaySessionStatus) {
      const hoursAgo = Math.floor(elapsed / (1000 * 60 * 60));
      const minsAgo = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
      let timeStr = 'Just now';
      if (hoursAgo > 0) {
        timeStr = `${hoursAgo}h ${minsAgo}m ago`;
      } else if (minsAgo > 0) {
        timeStr = `${minsAgo}m ago`;
      }
      dom.gatewaySessionStatus.textContent = `Last active: ${timeStr} · Active Session (< 48h)`;
    }
    showGatewayWelcomePane();
    dom.appAuthGateway.classList.remove('hidden');
  }

  function showGatewayWelcomePane() {
    if (dom.gatewayWelcomePane) dom.gatewayWelcomePane.classList.remove('hidden');
    if (dom.gatewayAuthPane) dom.gatewayAuthPane.classList.add('hidden');
  }

  function showGatewayAuthPane(mode = 'login') {
    if (dom.gatewayWelcomePane) dom.gatewayWelcomePane.classList.add('hidden');
    if (dom.gatewayAuthPane) dom.gatewayAuthPane.classList.remove('hidden');
    setGatewayAuthMode(mode);
  }

  function setGatewayAuthMode(mode) {
    authMode = mode;
    if (dom.btnGatewayTabLogin) dom.btnGatewayTabLogin.classList.toggle('active', mode === 'login');
    if (dom.btnGatewayTabRegister) dom.btnGatewayTabRegister.classList.toggle('active', mode === 'register');
    if (dom.gatewayNameGroup) dom.gatewayNameGroup.classList.toggle('hidden', mode === 'login');
    if (dom.gatewaySubmitText) dom.gatewaySubmitText.textContent = mode === 'login' ? 'Sign In & Enter Workspace' : 'Create Account & Continue';
    if (dom.gatewayAlertBox) dom.gatewayAlertBox.classList.add('hidden');
  }

  function unlockAppSession(profile) {
    if (profile) {
      saveSavedProfile(profile.name, profile.email);
    }
    recordUserActivity();
    if (dom.appAuthGateway) {
      dom.appAuthGateway.classList.add('hidden');
    }
    showToast(`Welcome back, ${(profile && profile.name) || (getSavedProfile() && getSavedProfile().name) || 'Prince'}`, 'success');
  }

  function handleGatewayAuthSubmit(e) {
    e.preventDefault();
    const email = (dom.gatewayEmailInput?.value || '').trim();
    const password = (dom.gatewayPasswordInput?.value || '').trim();
    const name = (dom.gatewayNameInput?.value || '').trim() || (email ? email.split('@')[0] : 'Prince');

    if (!email || !password) {
      if (dom.gatewayAlertBox) {
        dom.gatewayAlertBox.textContent = 'Please enter both email and password';
        dom.gatewayAlertBox.classList.remove('hidden');
      }
      return;
    }

    if (dom.gatewaySpinner) dom.gatewaySpinner.classList.remove('hidden');
    if (dom.btnGatewaySubmit) dom.btnGatewaySubmit.disabled = true;

    setTimeout(() => {
      if (dom.gatewaySpinner) dom.gatewaySpinner.classList.add('hidden');
      if (dom.btnGatewaySubmit) dom.btnGatewaySubmit.disabled = false;

      const profile = saveSavedProfile(name, email);
      state.user = { email, name };
      state.token = 'demo_token_' + Date.now();
      localStorage.setItem(AUTH_TOKEN_KEY, state.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(state.user));
      updateUserSessionUI();
      unlockAppSession(profile);
    }, 450);
  }

  // ==========================================================================
  // SCHEDULE HOURS CONFIGURATION & PRESETS
  // ==========================================================================
  const SCHEDULE_PRESETS = [
    { start: '03:00', end: '23:00', title: '03:00 AM · Early Bird Protocol', desc: 'Ultra-early 21-hour focus window' },
    { start: '04:00', end: '23:00', title: '04:00 AM · Dawn Sprint Master', desc: '20-hour high-output rhythm' },
    { start: '05:00', end: '23:00', title: '05:00 AM · Optimal 5 AM Day (Recommended)', desc: '19-hour balanced schedule' },
    { start: '06:00', end: '23:00', title: '06:00 AM · Standard Cadence', desc: '18-hour classic productive day' },
    { start: '07:00', end: '23:00', title: '07:00 AM · Gentle Morning', desc: '17-hour focused workday' }
  ];

  function openScheduleHoursModal() {
    const settings = (state.year_data && state.year_data.settings) || { schedule_start_hour: '05:00', schedule_end_hour: '23:00' };
    const curStart = settings.schedule_start_hour || '05:00';
    const curEnd = settings.schedule_end_hour || '23:00';

    if (dom.scheduleStartHourSelect) dom.scheduleStartHourSelect.value = curStart;
    if (dom.scheduleEndHourSelect) dom.scheduleEndHourSelect.value = curEnd;

    renderSchedulePresets(curStart, curEnd);
    updateScheduleModalSummary(curStart, curEnd);

    if (dom.scheduleHoursModalBackdrop) {
      dom.scheduleHoursModalBackdrop.classList.remove('hidden');
    }
  }

  function closeScheduleHoursModal() {
    if (dom.scheduleHoursModalBackdrop) {
      dom.scheduleHoursModalBackdrop.classList.add('hidden');
    }
  }

  function renderSchedulePresets(activeStart, activeEnd) {
    if (!dom.schedulePresetsContainer) return;
    dom.schedulePresetsContainer.innerHTML = '';

    SCHEDULE_PRESETS.forEach(preset => {
      const isSelected = preset.start === activeStart && preset.end === activeEnd;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `preset-pill-btn ${isSelected ? 'active' : ''}`;
      btn.innerHTML = `
        <div class="preset-pill-header">
          <span class="preset-pill-title">${preset.title}</span>
          ${isSelected ? '<span class="preset-active-tag">ACTIVE</span>' : ''}
        </div>
        <p class="preset-pill-desc">${preset.desc}</p>
      `;
      btn.addEventListener('click', () => {
        if (dom.scheduleStartHourSelect) dom.scheduleStartHourSelect.value = preset.start;
        if (dom.scheduleEndHourSelect) dom.scheduleEndHourSelect.value = preset.end;
        renderSchedulePresets(preset.start, preset.end);
        updateScheduleModalSummary(preset.start, preset.end);
      });
      dom.schedulePresetsContainer.appendChild(btn);
    });
  }

  function updateScheduleModalSummary(startStr, endStr) {
    if (!dom.scheduleHoursWindowText) return;
    const startH = parseInt((startStr || '05:00').split(':')[0], 10);
    const endH = parseInt((endStr || '23:00').split(':')[0], 10);
    const totalH = (endH - startH + 1);
    const startLabel = formatHourBadge(startH);
    const endLabel = formatHourBadge(endH + 1);
    dom.scheduleHoursWindowText.textContent = `${startLabel} to ${endLabel} (${totalH} hours active daily)`;
  }

  function formatHourBadge(hour) {
    const h = hour % 24;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, '0')}:00 ${ampm}`;
  }

  function applyScheduleHours() {
    const startStr = dom.scheduleStartHourSelect?.value || '05:00';
    const endStr = dom.scheduleEndHourSelect?.value || '23:00';

    const startH = parseInt(startStr.split(':')[0], 10);
    const endH = parseInt(endStr.split(':')[0], 10);

    if (endH <= startH) {
      showToast('End hour must be later than start hour', 'alert');
      return;
    }

    if (!state.year_data.settings) {
      state.year_data.settings = {};
    }
    state.year_data.settings.schedule_start_hour = startStr;
    state.year_data.settings.schedule_end_hour = endStr;

    saveDataLocally();
    closeScheduleHoursModal();
    updateScheduleRangeButtonUI();
    populateTimeSlotSelects();
    renderHourlySchedule();
    if (state.currentLevel === 'routines') {
      renderRoutinesStageView();
      if (state.activeEditingRoutineId !== null) {
        openRoutineEditor(state.activeEditingRoutineId);
      }
    }
    renderSubpanel();
    showToast(`Schedule hours updated: ${formatHourBadge(startH)} - ${formatHourBadge(endH + 1)}`, 'success');
  }

  function updateScheduleRangeButtonUI() {
    const settings = (state.year_data && state.year_data.settings) || { schedule_start_hour: '05:00', schedule_end_hour: '23:00' };
    const startStr = settings.schedule_start_hour || '05:00';
    const endStr = settings.schedule_end_hour || '23:00';
    const startH = parseInt(startStr.split(':')[0], 10);
    const endH = parseInt(endStr.split(':')[0], 10);
    const totalH = (endH - startH + 1);
    const label = `${formatHourBadge(startH)} - ${formatHourBadge(endH + 1)} (${totalH}h)`;

    if (dom.scheduleRangeButtonText) {
      dom.scheduleRangeButtonText.textContent = label;
    }
    if (dom.routineEditorHoursLabel) {
      dom.routineEditorHoursLabel.textContent = label;
    }
  }

  // ==========================================================================
  // BACKUP EXPORT & IMPORT
  // ==========================================================================
  function exportBackupJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.year_data, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `productive_backup_${getTodayISODate()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Backup exported successfully', 'success');
  }

  function importBackupJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (importedData && typeof importedData === 'object') {
          state.year_data = importedData;
          queueAutoSave();
          renderAllViews();
          updateAllMetrics();
          renderSubpanel();
          showToast('Data restored successfully', 'success');
        }
      } catch (err) {
        showToast('Invalid backup file', 'alert');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ==========================================================================
  // TOAST NOTIFICATIONS (Zero Emojis)
  // ==========================================================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconSvg = type === 'success' ? ICONS.success : type === 'alert' ? ICONS.alert : ICONS.info;
    toast.innerHTML = `<span class="toast-icon">${iconSvg}</span><span>${escapeHtml(message)}</span>`;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 2800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================================================
  // EVENT LISTENERS BINDING
  // ==========================================================================

  // Mobile sidebar toggle helpers
  function isMobileView() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  function openMobileSidebar() {
    dom.sidebarPrimary.classList.add('mobile-open');
    dom.mobileSidebarOverlay.classList.add('active');
    dom.mobileHamburgerBtn.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileSidebar() {
    dom.sidebarPrimary.classList.remove('mobile-open');
    dom.mobileSidebarOverlay.classList.remove('active');
    dom.mobileHamburgerBtn.classList.remove('active');
    document.body.style.overflow = '';
  }

  function toggleMobileSidebar() {
    const isOpen = dom.sidebarPrimary.classList.contains('mobile-open');
    if (isOpen) {
      closeMobileSidebar();
    } else {
      openMobileSidebar();
    }
  }

  function bindEventListeners() {
    // Mobile hamburger toggle
    dom.mobileHamburgerBtn.addEventListener('click', toggleMobileSidebar);
    dom.mobileSidebarOverlay.addEventListener('click', closeMobileSidebar);
    dom.sidebarMobileCloseBtn.addEventListener('click', closeMobileSidebar);

    // Chevron Sidebar toggle: < to collapse, > to expand (desktop only)
    dom.sidebarToggleBtn.addEventListener('click', () => {
      const isCollapsed = dom.sidebarPrimary.classList.toggle('collapsed');
      dom.sidebarToggleBtn.setAttribute('title', isCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
    });

    // Theme toggle
    dom.themeToggleBtn.addEventListener('click', toggleTheme);

    // Global Search Bar & Keyboard Shortcut '/'
    dom.globalSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (dom.subpanelSearchInput) dom.subpanelSearchInput.value = state.searchQuery;
      renderHourlySchedule();
      renderSubpanel();
    });

    dom.subpanelSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (dom.globalSearchInput) dom.globalSearchInput.value = state.searchQuery;
      renderHourlySchedule();
      renderSubpanel();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        dom.globalSearchInput.focus();
      }
      if (e.key === 'Escape') {
        closeNewItemModal();
        closeAuthModal();
        closeMobileSidebar();
      }
    });

    // Quick + New button opens creation modal
    dom.btnQuickNewTask.addEventListener('click', openNewItemModal);
    dom.closeNewItemModalBtn.addEventListener('click', closeNewItemModal);
    dom.newItemTabs.querySelectorAll('.modal-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        switchNewItemTab(btn.dataset.type);
      });
    });
    dom.newItemForm.addEventListener('submit', handleNewItemSubmit);

    // Year selector
    dom.yearSelector.addEventListener('change', (e) => {
      state.selectedYear = e.target.value;
      renderYearlyGoals();
      updateAllMetrics();
      showToast(`Selected horizon ${state.selectedYear}`, 'info');
    });

    // Date navigation
    dom.btnPrevDay.addEventListener('click', () => shiftSelectedDate(-1));
    dom.btnNextDay.addEventListener('click', () => shiftSelectedDate(1));
    dom.btnJumpToday.addEventListener('click', () => {
      state.currentDate = getTodayISODate();
      updateDateDisplay();
      renderHourlySchedule();
      renderSevenDaysGrid();
      renderSubpanel();
      updateAllMetrics();
    });

    dom.nativeDatePicker.addEventListener('change', (e) => {
      if (e.target.value) {
        state.currentDate = e.target.value;
        updateDateDisplay();
        renderHourlySchedule();
        renderSevenDaysGrid();
        renderSubpanel();
        updateAllMetrics();
      }
    });

    // Navigation Tabs (including "How Abeg")
    dom.navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        switchToLevel(btn.dataset.level);
        // Auto-close sidebar on mobile after navigation
        if (isMobileView()) {
          closeMobileSidebar();
        }
      });
    });

    // Sidebar Cloud Sync & Backup triggers
    dom.btnSidebarSync.addEventListener('click', () => {
      if (state.token) {
        loadGoalsFromBackend();
      } else {
        openAuthModal('login');
      }
    });

    dom.btnSidebarBackup.addEventListener('click', exportBackupJSON);

    // Hourly Actions & Routine Dropdown
    dom.dayPrimaryObjective.addEventListener('input', (e) => {
      const dLog = getDailyLog(state.currentDate);
      dLog.objective = e.target.value;
      queueAutoSave();
    });

    dom.filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        dom.filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.hourlyFilter = pill.dataset.filter;
        renderHourlySchedule();
      });
    });

    if (dom.btnRoutineDropdown) {
      dom.btnRoutineDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleRoutineDropdown();
      });
    }

    if (dom.btnDropdownCreateRoutine) {
      dom.btnDropdownCreateRoutine.addEventListener('click', (e) => {
        e.stopPropagation();
        closeRoutineDropdown();
        switchToLevel('routines');
        openRoutineEditor(null);
      });
    }

    if (dom.btnDropdownManageRoutines) {
      dom.btnDropdownManageRoutines.addEventListener('click', (e) => {
        e.stopPropagation();
        closeRoutineDropdown();
        switchToLevel('routines');
      });
    }

    if (dom.btnCloseRoutineDropdown) {
      dom.btnCloseRoutineDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        closeRoutineDropdown();
      });
    }

    // Routines Stage View & Editor Actions
    if (dom.btnCreateNewRoutinePage) {
      dom.btnCreateNewRoutinePage.addEventListener('click', () => {
        openRoutineEditor(null);
      });
    }

    if (dom.btnReturnToTimeBlocks) {
      dom.btnReturnToTimeBlocks.addEventListener('click', () => {
        switchToLevel('micro');
      });
    }

    if (dom.btnRoutineEditorPreloadStd) {
      dom.btnRoutineEditorPreloadStd.addEventListener('click', () => {
        const std = getRoutineById('builtin_std');
        if (std) {
          populateRoutineEditorHours(std.hours);
          updateRoutineEditorLiveBreakdown();
          showToast('Loaded standard template slots into editor', 'info');
        }
      });
    }

    if (dom.btnRoutineEditorClearAll) {
      dom.btnRoutineEditorClearAll.addEventListener('click', () => {
        populateRoutineEditorHours({});
        updateRoutineEditorLiveBreakdown();
        showToast('All slots cleared', 'info');
      });
    }

    if (dom.btnCancelRoutineEdit) {
      dom.btnCancelRoutineEdit.addEventListener('click', closeRoutineEditor);
    }

    if (dom.btnDeleteCustomRoutine) {
      dom.btnDeleteCustomRoutine.addEventListener('click', () => {
        if (state.activeEditingRoutineId) {
          deleteCustomRoutine(state.activeEditingRoutineId);
        }
      });
    }

    if (dom.btnSaveRoutineOnly) {
      dom.btnSaveRoutineOnly.addEventListener('click', () => {
        saveCurrentRoutineEditor(false);
      });
    }

    if (dom.btnSaveAndApplyRoutine) {
      dom.btnSaveAndApplyRoutine.addEventListener('click', () => {
        saveCurrentRoutineEditor(true);
      });
    }

    // Global outside click & escape key dismiss
    document.addEventListener('click', (e) => {
      if (dom.routineDropdownWrapper && !dom.routineDropdownWrapper.contains(e.target)) {
        closeRoutineDropdown();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeRoutineDropdown();
      }
    });

    dom.btnMarkAllDayDone.addEventListener('click', markAllDayComplete);
    dom.btnClearDayLog.addEventListener('click', clearDayLog);

    // Weekly Actions
    dom.monthWeekSelector.querySelectorAll('.sub-week-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        dom.monthWeekSelector.querySelectorAll('.sub-week-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedMonthWeek = parseInt(btn.dataset.weeknum, 10);
        renderWeeklyStrategyView();
        renderSubpanel();
      });
    });

    dom.weeklyStrategyText.addEventListener('input', (e) => {
      const wPlan = getWeeklyPlan();
      wPlan.strategy = e.target.value;
      queueAutoSave();
    });

    dom.btnAddWeeklyRock.addEventListener('click', () => addWeeklyRock());

    // 4-Month Horizons
    dom.horizonBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.horizonBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentHorizon = btn.dataset.horizon;
        renderFourMonthsHorizon();
        renderSubpanel();
        updateAllMetrics();
      });
    });

    // Yearly Goals
    dom.btnAddNewYearlyGoal.addEventListener('click', () => addNewYearlyGoal());

    // Auth Modal
    dom.authTriggerBtn.addEventListener('click', () => {
      if (state.token) {
        showToast(`Signed in as ${state.user.email}`, 'info');
      } else {
        openAuthModal('login');
      }
    });

    dom.closeAuthModalBtn.addEventListener('click', closeAuthModal);
    dom.tabSwitchLogin.addEventListener('click', () => {
      authMode = 'login';
      updateAuthModalModeUI();
    });
    dom.tabSwitchRegister.addEventListener('click', () => {
      authMode = 'register';
      updateAuthModalModeUI();
    });
    dom.authForm.addEventListener('submit', handleAuthFormSubmit);
    dom.logoutBtn.addEventListener('click', () => handleSignOut(true));
    dom.btnContinueGuest.addEventListener('click', closeAuthModal);

    dom.togglePasswordBtn.addEventListener('click', () => {
      const isPwd = dom.authPassword.getAttribute('type') === 'password';
      dom.authPassword.setAttribute('type', isPwd ? 'text' : 'password');
    });

    dom.syncStatusBadge.addEventListener('click', () => {
      if (state.token) {
        loadGoalsFromBackend();
      } else {
        openAuthModal('login');
      }
    });

    // Data Export & Import
    dom.btnExportData.addEventListener('click', exportBackupJSON);
    dom.btnImportData.addEventListener('click', () => dom.importFileInput.click());
    dom.importFileInput.addEventListener('change', importBackupJSON);

    // Auth Gateway Listeners
    if (dom.btnGatewayContinue) {
      dom.btnGatewayContinue.addEventListener('click', () => {
        unlockAppSession(getSavedProfile());
      });
    }

    if (dom.btnGatewaySwitchAccount) {
      dom.btnGatewaySwitchAccount.addEventListener('click', () => {
        showGatewayAuthPane('login');
      });
    }

    if (dom.btnGatewayTabLogin) {
      dom.btnGatewayTabLogin.addEventListener('click', () => {
        setGatewayAuthMode('login');
      });
    }

    if (dom.btnGatewayTabRegister) {
      dom.btnGatewayTabRegister.addEventListener('click', () => {
        setGatewayAuthMode('register');
      });
    }

    if (dom.gatewayAuthForm) {
      dom.gatewayAuthForm.addEventListener('submit', handleGatewayAuthSubmit);
    }

    if (dom.btnGatewayBackToWelcome) {
      dom.btnGatewayBackToWelcome.addEventListener('click', () => {
        showGatewayWelcomePane();
      });
    }

    // Schedule Hours Configuration Listeners
    if (dom.btnOpenScheduleConfig) {
      dom.btnOpenScheduleConfig.addEventListener('click', openScheduleHoursModal);
    }

    if (dom.btnRoutineEditorHours) {
      dom.btnRoutineEditorHours.addEventListener('click', openScheduleHoursModal);
    }

    if (dom.btnCloseScheduleHoursModal) {
      dom.btnCloseScheduleHoursModal.addEventListener('click', closeScheduleHoursModal);
    }

    if (dom.btnCancelScheduleHours) {
      dom.btnCancelScheduleHours.addEventListener('click', closeScheduleHoursModal);
    }

    if (dom.btnApplyScheduleHours) {
      dom.btnApplyScheduleHours.addEventListener('click', applyScheduleHours);
    }

    if (dom.scheduleStartHourSelect) {
      dom.scheduleStartHourSelect.addEventListener('change', () => {
        updateScheduleModalSummary(dom.scheduleStartHourSelect.value, dom.scheduleEndHourSelect?.value);
      });
    }

    if (dom.scheduleEndHourSelect) {
      dom.scheduleEndHourSelect.addEventListener('change', () => {
        updateScheduleModalSummary(dom.scheduleStartHourSelect?.value, dom.scheduleEndHourSelect.value);
      });
    }
  }

  // --- Initialize App on DOM Load ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
