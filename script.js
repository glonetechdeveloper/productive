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

  const TIME_SLOTS = [
    { key: '06:00', label: '06:00 AM - 07:00 AM' },
    { key: '07:00', label: '07:00 AM - 08:00 AM' },
    { key: '08:00', label: '08:00 AM - 09:00 AM' },
    { key: '09:00', label: '09:00 AM - 10:00 AM' },
    { key: '10:00', label: '10:00 AM - 11:00 AM' },
    { key: '11:00', label: '11:00 AM - 12:00 PM' },
    { key: '12:00', label: '12:00 PM - 01:00 PM' },
    { key: '13:00', label: '01:00 PM - 02:00 PM' },
    { key: '14:00', label: '02:00 PM - 03:00 PM' },
    { key: '15:00', label: '03:00 PM - 04:00 PM' },
    { key: '16:00', label: '04:00 PM - 05:00 PM' },
    { key: '17:00', label: '05:00 PM - 06:00 PM' },
    { key: '18:00', label: '06:00 PM - 07:00 PM' },
    { key: '19:00', label: '07:00 PM - 08:00 PM' },
    { key: '20:00', label: '08:00 PM - 09:00 PM' },
    { key: '21:00', label: '09:00 PM - 10:00 PM' },
    { key: '22:00', label: '10:00 PM - 11:00 PM' },
    { key: '23:00', label: '11:00 PM - 12:00 AM' }
  ];

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
    trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    info: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
    success: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    alert: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
  };

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
    year_data: {
      yearly_goals: [],
      four_months: {},
      weekly_plans: {},
      daily_logs: {}
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
    btnQuickFillTemplate: document.getElementById('btnQuickFillTemplate'),
    btnMarkAllDayDone: document.getElementById('btnMarkAllDayDone'),
    btnClearDayLog: document.getElementById('btnClearDayLog'),

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
    toastContainer: document.getElementById('toastContainer')
  };

  let authMode = 'login';

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  function initApp() {
    applyTheme(state.theme);
    loadInitialData();
    populateTimeSlotSelects();
    bindEventListeners();
    updateDateDisplay();
    renderAllViews();
    updateAllMetrics();
    renderSubpanel();

    if (state.token) {
      loadGoalsFromBackend();
    } else {
      updateSyncStatusUI('offline', 'Offline (Local)');
    }
  }

  function populateTimeSlotSelects() {
    if (!dom.newBlockTime) return;
    dom.newBlockTime.innerHTML = '';
    TIME_SLOTS.forEach(slot => {
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
      yearly_goals: [
        { id: 'g1', title: 'Scale Enterprise SaaS Revenue to $250k ARR', pillar: 'Career & Growth', targetMetric: '$250,000 ARR', status: 'In Progress' },
        { id: 'g2', title: 'Complete Sub-4 Hour Marathon Championship', pillar: 'Health & Endurance', targetMetric: '42.2 km @ 5:35/km', status: 'In Progress' },
        { id: 'g3', title: 'Read 24 Non-Fiction Core Architecture Books', pillar: 'Mastery', targetMetric: '24 Books', status: 'In Progress' },
        { id: 'g4', title: 'Launch Production Cloud Developer Suite', pillar: 'Engineering', targetMetric: '3 Production Apps', status: 'Achieved' }
      ],
      four_months: {
        h1: {
          m1: { target: 'Establish deep work morning routine and architecture baseline', milestones: ['Design core system DB', 'Write serverless auth endpoints', 'Ship MVP v1.0'] },
          m2: { target: 'Scale feature set and automate deployment pipelines', milestones: ['Implement weekly sprint reviews', 'Add analytics dashboard'] },
          m3: { target: 'Optimization and user retention testing', milestones: ['Beta feedback loop', 'Performance audit'] },
          m4: { target: 'Horizon 1 retrospective & major milestone launch', milestones: ['Public release launch', 'Review metrics'] }
        },
        h2: {
          m1: { target: 'Expansion of userbase & enterprise workflows', milestones: ['Enterprise pilot rollout'] },
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
      daily_logs: {}
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

    if (state.token) {
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
    if (!state.token) return;

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
    if (!state.token) return;

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

    if (state.currentLevel === 'micro') {
      const weekDays = getWeekDateRange(state.currentDate);
      const todayISO = getTodayISODate();

      weekDays.forEach(dayStr => {
        const dayDate = parseISODate(dayStr);
        const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
        const dayFull = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dayLog = state.year_data.daily_logs[dayStr] || { objective: '', hours: {} };

        const hoursArr = Object.values(dayLog.hours);
        const scheduled = hoursArr.filter(h => h.task && h.task.trim().length > 0).length;
        const completed = hoursArr.filter(h => h.status === 'completed' && h.task && h.task.trim().length > 0).length;
        const pending = scheduled - completed;

        if (q && !dayName.toLowerCase().includes(q) && !dayLog.objective.toLowerCase().includes(q)) {
          return;
        }

        const card = document.createElement('div');
        card.className = `subpanel-item-card ${dayStr === state.currentDate ? 'active' : ''}`;
        
        const avatarInitial = dayStr === todayISO ? 'TD' : dayName.substring(0, 2).toUpperCase();

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
    } else if (state.currentLevel === 'guide') {
      // Subpanel chapters for "How Abeg"
      const chapters = [
        { id: 'guide-sec-timeblocks', num: '01', title: 'Time Blocks', sub: 'Hourly precision log' },
        { id: 'guide-sec-matrix', num: '02', title: '7-Day Matrix', sub: 'Weekly cadence & reviews' },
        { id: 'guide-sec-weekly', num: '03', title: 'Weekly Strategy', sub: 'Pre-week & Big Rocks' },
        { id: 'guide-sec-horizons', num: '04', title: '4-Month Horizons', sub: 'Quarterly cycles' },
        { id: 'guide-sec-yearly', num: '05', title: 'Annual Vision', sub: 'North-star goals & metrics' },
        { id: 'guide-sec-system', num: '06', title: 'Cloud & Shortcuts', sub: 'Data safety & power tools' }
      ];

      chapters.forEach(ch => {
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
    const searchFilter = (state.searchQuery || '').toLowerCase();

    let scheduledCount = 0;
    let completedCount = 0;

    TIME_SLOTS.forEach(slot => {
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
      doneBtn.title = 'Mark Complete';
      doneBtn.innerHTML = ICONS.check;

      const missedBtn = document.createElement('button');
      missedBtn.type = 'button';
      missedBtn.className = `action-toggle-btn ${hourData.status === 'missed' ? 'active-missed' : ''}`;
      missedBtn.title = 'Mark Missed';
      missedBtn.innerHTML = ICONS.cross;

      doneBtn.addEventListener('click', () => {
        hourData.status = hourData.status === 'completed' ? 'pending' : 'completed';
        dailyData.hours[slot.key] = hourData;
        queueAutoSave();
        renderHourlySchedule();
        renderSevenDaysGrid();
      });

      missedBtn.addEventListener('click', () => {
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

  function quickFillDailyRoutine() {
    const dailyData = getDailyLog(state.currentDate);
    const routineTemplate = {
      '06:00': { task: 'Morning hydration, mobility stretch, and focus planning', category: 'Health & Fitness', status: 'pending' },
      '07:00': { task: 'Breakfast, espresso & review strategic weekly sprint', category: 'Admin & Ops', status: 'pending' },
      '08:00': { task: 'Deep Work Block 1: Core system architecture & coding', category: 'Deep Work', status: 'pending' },
      '09:00': { task: 'Deep Work Block 1 (Cont): Critical technical delivery', category: 'Deep Work', status: 'pending' },
      '10:00': { task: 'Focused execution & code review / testing', category: 'Core Focus', status: 'pending' },
      '11:00': { task: 'Client standups & communications sync', category: 'Meetings', status: 'pending' },
      '12:00': { task: 'Nutritious lunch & 20-min outdoor walk', category: 'Rest & Recharge', status: 'pending' },
      '13:00': { task: 'Deep Work Block 2: Feature development & API integration', category: 'Deep Work', status: 'pending' },
      '14:00': { task: 'Deep Work Block 2 (Cont): Debugging & validation', category: 'Deep Work', status: 'pending' },
      '15:00': { task: 'Asynchronous emails, planning & documentation', category: 'Admin & Ops', status: 'pending' },
      '16:00': { task: 'Gym strength training / cardio session', category: 'Health & Fitness', status: 'pending' },
      '17:00': { task: 'Post-workout recovery & daily wrap-up notes', category: 'Admin & Ops', status: 'pending' },
      '18:00': { task: 'Dinner & quality family connection', category: 'Rest & Recharge', status: 'pending' },
      '19:00': { task: 'Technical reading / continuous learning', category: 'Learning', status: 'pending' },
      '20:00': { task: 'Creative side projects & exploration', category: 'Core Focus', status: 'pending' },
      '21:00': { task: 'Digital wind-down & next-day review', category: 'Admin & Ops', status: 'pending' },
      '22:00': { task: 'Reading & sleep preparation protocol', category: 'Rest & Recharge', status: 'pending' },
      '23:00': { task: 'Sleep & recovery', category: 'Rest & Recharge', status: 'pending' },
    };

    dailyData.hours = { ...routineTemplate };
    queueAutoSave();
    renderHourlySchedule();
    renderSevenDaysGrid();
    showToast('Standard routine loaded successfully', 'success');
  }

  function markAllDayComplete() {
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
    if (confirm('Clear all hourly blocks for this day?')) {
      const dailyData = getDailyLog(state.currentDate);
      dailyData.objective = '';
      dailyData.hours = {};
      queueAutoSave();
      renderHourlySchedule();
      renderSevenDaysGrid();
      showToast('Daily log cleared', 'info');
    }
  }

  // ==========================================================================
  // LEVEL 04: 7-DAY WEEK VIEW & HISTORICAL REVIEW LOG
  // ==========================================================================
  function renderSevenDaysGrid() {
    dom.sevenDaysContainer.innerHTML = '';
    const weekDays = getWeekDateRange(state.currentDate);
    const todayISO = getTodayISODate();

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

      const card = document.createElement('div');
      card.className = `day-card ${dayStr === state.currentDate ? 'active-selected-day' : ''}`;
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
    weeklyPlan.rocks.forEach((rock, idx) => {
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
        (mData.milestones || []).forEach((msText, msIdx) => {
          const mItem = document.createElement('div');
          mItem.className = 'milestone-item';
          mItem.innerHTML = `
            <span class="milestone-dot"></span>
            <input type="text" class="milestone-input" value="${escapeHtml(msText)}" placeholder="Checkpoint description" />
            <button class="rock-del-btn" style="padding: 0 4px;">${ICONS.cross}</button>
          `;

          const msInput = mItem.querySelector('.milestone-input');
          msInput.addEventListener('input', (e) => {
            mData.milestones[msIdx] = e.target.value;
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
        mData.milestones.push('Key delivery milestone');
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

    const goals = state.year_data.yearly_goals || [];

    goals.forEach((goal, idx) => {
      const card = document.createElement('div');
      card.className = 'yearly-goal-card';

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
    state.year_data.yearly_goals.push({
      id: 'yg_' + Date.now(),
      title: customTitle || 'New High-Level Annual Target',
      pillar: customPillar || 'Strategic Growth',
      targetMetric: customMetric || '100% Target Met',
      status: 'In Progress'
    });
    queueAutoSave();
    renderYearlyGoals();
    updateAllMetrics();
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
    if (levelKey === 'daily') renderSevenDaysGrid();
    if (levelKey === 'weekly') renderWeeklyStrategyView();
    if (levelKey === 'monthly') renderFourMonthsHorizon();
    if (levelKey === 'yearly') renderYearlyGoals();

    renderSubpanel();
    updateAllMetrics();
  }

  function renderAllViews() {
    renderHourlySchedule();
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
      state.year_data.four_months[horizonKey][monthKey].milestones.push(title);

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

    // Hourly Actions
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

    dom.btnQuickFillTemplate.addEventListener('click', quickFillDailyRoutine);
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
  }

  // --- Initialize App on DOM Load ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
