/**
 * ============================================================================
 * LUMEN PRODUCTIVITY OS - CLIENT ENGINE
 * Full-Stack Goal Hierarchy, Hourly Micro-Schedule, & Serverless Synchronization
 * ============================================================================
 */

(function () {
  'use strict';

  // --- Constants & Config ---
  const STORAGE_KEY = 'lumen_productivity_data_v2';
  const AUTH_TOKEN_KEY = 'lumen_jwt_token';
  const AUTH_USER_KEY = 'lumen_user_info';
  const THEME_KEY = 'lumen_theme';

  const CIRCLE_CIRCUMFERENCE = 289; // 2 * PI * 46

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
    { key: '23:00', label: '11:00 PM - 12:00 AM' },
  ];

  const DEFAULT_CATEGORIES = [
    'Deep Work',
    'Core Focus',
    'Meetings',
    'Health & Fitness',
    'Learning',
    'Routine Admin',
    'Rest & Recharge'
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
    year_data: {
      yearly_goals: [],
      four_months: {},
      weekly_plans: {},
      daily_logs: {}
    }
  };

  let debounceSaveTimeout = null;

  // --- DOM Elements Cache ---
  const dom = {
    html: document.documentElement,
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    yearSelector: document.getElementById('yearSelector'),
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
    authTriggerBtn: document.getElementById('authTriggerBtn'),
    userEmailDisplay: document.getElementById('userEmailDisplay'),
    userAvatarText: document.getElementById('userAvatarText'),
    logoutBtn: document.getElementById('logoutBtn'),
    dbStatusBadge: document.getElementById('dbStatusBadge'),

    // Dashboard Rings
    dailyRingProgress: document.getElementById('dailyRingProgress'),
    dailyPercentageText: document.getElementById('dailyPercentageText'),
    dailyBlockRatio: document.getElementById('dailyBlockRatio'),
    dailyStatusPill: document.getElementById('dailyStatusPill'),

    weeklyRingProgress: document.getElementById('weeklyRingProgress'),
    weeklyPercentageText: document.getElementById('weeklyPercentageText'),
    weeklyBlockRatio: document.getElementById('weeklyBlockRatio'),
    weeklyStatusPill: document.getElementById('weeklyStatusPill'),

    monthlyRingProgress: document.getElementById('monthlyRingProgress'),
    monthlyPercentageText: document.getElementById('monthlyPercentageText'),
    monthTargetRatio: document.getElementById('monthTargetRatio'),
    monthlyStatusPill: document.getElementById('monthlyStatusPill'),

    yearlyRingProgress: document.getElementById('yearlyRingProgress'),
    yearlyPercentageText: document.getElementById('yearlyPercentageText'),
    yearlyGoalRatio: document.getElementById('yearlyGoalRatio'),
    yearlyStatusPill: document.getElementById('yearlyStatusPill'),

    // Navigation Tabs & Views
    levelTabs: document.querySelectorAll('.level-tab-btn'),
    views: document.querySelectorAll('.hierarchy-view-section'),

    // Level 05: Hourly Micro
    hourlyViewDateHeading: document.getElementById('hourlyViewDateHeading'),
    dayPrimaryObjective: document.getElementById('dayPrimaryObjective'),
    hourlyTimelineContainer: document.getElementById('hourlyTimelineContainer'),
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

  let authMode = 'login'; // 'login' or 'register'

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  function initApp() {
    applyTheme(state.theme);
    loadInitialData();
    bindEventListeners();
    updateDateDisplay();
    renderAllViews();
    updateAllMetrics();

    // If authenticated, perform cloud sync
    if (state.token) {
      loadGoalsFromBackend();
    } else {
      updateSyncStatusUI('offline', 'Offline Mode (Local Storage)');
    }
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
    showToast(`Switched to ${nextTheme.toUpperCase()} theme`, 'info');
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
    dom.hourlyViewDateHeading = document.getElementById('hourlyViewDateHeading');
    if (dom.hourlyViewDateHeading) {
      dom.hourlyViewDateHeading.textContent = `${dayName}, ${fullDate}`;
    }
  }

  function shiftSelectedDate(days) {
    const d = parseISODate(state.currentDate);
    d.setDate(d.getDate() + days);
    state.currentDate = formatISODate(d);
    updateDateDisplay();
    renderHourlySchedule();
    renderSevenDaysGrid();
    updateAllMetrics();
  }

  // Calculate Sunday-Saturday boundaries for a given date
  function getWeekDateRange(dateStr) {
    const current = parseISODate(dateStr);
    const dayOfWeek = current.getDay(); // 0 is Sun, 6 is Sat
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
        console.error('Failed to parse local stored goals:', err);
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
        { id: 'g1', title: 'Achieve $250k ARR on SaaS Ecosystem', pillar: 'Career & Wealth', targetMetric: '$250,000 Revenue', status: 'In Progress' },
        { id: 'g2', title: 'Run a Sub-4 Hour Marathon', pillar: 'Health & Endurance', targetMetric: '42.2 km @ 5:35/km', status: 'In Progress' },
        { id: 'g3', title: 'Read 24 Non-Fiction Masterpieces', pillar: 'Mindset & Mastery', targetMetric: '24 Books', status: 'In Progress' },
        { id: 'g4', title: 'Build Cloud-Native AI Developer Tools', pillar: 'Engineering', targetMetric: '3 Production Apps', status: 'Achieved' }
      ],
      four_months: {
        h1: {
          m1: { target: 'Establish deep work morning cadence and architecture foundation', milestones: ['Design core system DB', 'Write serverless auth endpoints', 'Ship MVP v1.0'] },
          m2: { target: 'Scale feature set and automate deployment pipelines', milestones: ['Implement weekly sprint reviews', 'Add analytics dashboard'] },
          m3: { target: 'Optimization and user retention testing', milestones: ['Beta feedback loop', 'Performance audit'] },
          m4: { target: 'Horizon 1 retrospective & major milestone milestone launch', milestones: ['Public release launch', 'Review metrics'] }
        },
        h2: {
          m1: { target: 'Expansion of userbase & enterprise workflows', milestones: [] },
          m2: { target: 'Multi-device offline caching enhancements', milestones: [] },
          m3: { target: 'Q3 Product Iteration', milestones: [] },
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

    if (state.token) {
      updateSyncStatusUI('saving', 'Saving changes...');
      clearTimeout(debounceSaveTimeout);
      debounceSaveTimeout = setTimeout(() => {
        saveGoalsToBackend(state.year_data);
      }, 700);
    } else {
      updateSyncStatusUI('offline', 'Saved Locally');
    }
  }

  // ==========================================================================
  // BACKEND SERVERLESS SYNC API
  // ==========================================================================
  async function loadGoalsFromBackend() {
    if (!state.token) return;

    updateSyncStatusUI('saving', 'Syncing cloud...');
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
        showToast('Session expired. Please sign in again.', 'error');
        return;
      }

      const result = await response.json();
      if (result.success && result.data && Object.keys(result.data).length > 0) {
        state.year_data = result.data;
        saveDataLocally();
        renderAllViews();
        updateAllMetrics();
        updateSyncStatusUI('synced', 'Synced with Cloud');
      } else {
        // Cloud is empty, push local state to initialize cloud
        saveGoalsToBackend(state.year_data);
      }
    } catch (err) {
      console.warn('Backend sync unreachable, using local storage fallback:', err.message);
      updateSyncStatusUI('offline', 'Offline Mode (Local Storage)');
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
        updateSyncStatusUI('synced', 'Cloud Synced');
      } else {
        updateSyncStatusUI('offline', 'Sync Delayed');
      }
    } catch (err) {
      console.warn('Failed to sync to cloud:', err.message);
      updateSyncStatusUI('offline', 'Sync Paused (Offline)');
    }
  }

  function updateSyncStatusUI(status, label) {
    dom.syncDot.className = 'sync-dot';
    if (status === 'saving') {
      dom.syncDot.classList.add('saving');
    } else if (status === 'offline') {
      dom.syncDot.classList.add('offline');
    }

    dom.syncStatusText.textContent = label;
    if (dom.dbStatusBadge) {
      dom.dbStatusBadge.textContent = state.token
        ? `PostgreSQL Cloud: ${state.user?.email || 'Connected'}`
        : 'Storage: Local Browser Mode';
    }
  }

  // ==========================================================================
  // LEVEL 05: HOURLY MICRO-SCHEDULE (THE DAILY LOG)
  // ==========================================================================
  function renderHourlySchedule() {
    const dailyData = getDailyLog(state.currentDate);
    dom.dayPrimaryObjective.value = dailyData.objective || '';

    dom.hourlyTimelineContainer.innerHTML = '';
    const now = new Date();
    const currentHour = now.getHours();
    const isToday = state.currentDate === getTodayISODate();

    TIME_SLOTS.forEach(slot => {
      const hourData = dailyData.hours[slot.key] || {
        task: '',
        category: 'Deep Work',
        status: 'pending' // 'pending', 'completed', 'missed'
      };

      // Filter handling
      if (state.hourlyFilter !== 'all') {
        if (state.hourlyFilter === 'completed' && hourData.status !== 'completed') return;
        if (state.hourlyFilter === 'pending' && hourData.status !== 'pending') return;
        if (state.hourlyFilter === 'missed' && hourData.status !== 'missed') return;
      }

      const blockCard = document.createElement('div');
      blockCard.className = `hour-block-card glass-card status-${hourData.status}`;

      const slotHourNum = parseInt(slot.key.split(':')[0], 10);
      if (isToday && slotHourNum === currentHour) {
        blockCard.classList.add('is-current-hour');
      }

      // Time badge
      const timeBadge = document.createElement('span');
      timeBadge.className = 'hour-badge-time';
      timeBadge.textContent = slot.label.split(' - ')[0]; // E.g. 06:00 AM

      // Input group
      const inputGroup = document.createElement('div');
      inputGroup.className = 'hour-input-group';

      const taskInput = document.createElement('input');
      taskInput.type = 'text';
      taskInput.className = `hour-task-input ${hourData.status === 'completed' ? 'completed-task' : ''}`;
      taskInput.placeholder = 'Plan high-impact task for this block...';
      taskInput.value = hourData.task || '';

      taskInput.addEventListener('input', (e) => {
        hourData.task = e.target.value;
        dailyData.hours[slot.key] = hourData;
        queueAutoSave();
      });

      // Meta row: category dropdown
      const metaRow = document.createElement('div');
      metaRow.className = 'hour-meta-row';

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

      metaRow.appendChild(catSelect);
      inputGroup.appendChild(taskInput);
      inputGroup.appendChild(metaRow);

      // Status Controls (Pending, Complete, Missed)
      const statusControls = document.createElement('div');
      statusControls.className = 'hour-status-controls';

      const doneBtn = document.createElement('button');
      doneBtn.type = 'button';
      doneBtn.className = `status-btn ${hourData.status === 'completed' ? 'active-done' : ''}`;
      doneBtn.title = 'Mark Completed';
      doneBtn.innerHTML = '✓';

      const missedBtn = document.createElement('button');
      missedBtn.type = 'button';
      missedBtn.className = `status-btn ${hourData.status === 'missed' ? 'active-missed' : ''}`;
      missedBtn.title = 'Mark Missed/Incomplete';
      missedBtn.innerHTML = '✕';

      doneBtn.addEventListener('click', () => {
        if (hourData.status === 'completed') {
          hourData.status = 'pending';
        } else {
          hourData.status = 'completed';
        }
        dailyData.hours[slot.key] = hourData;
        queueAutoSave();
        renderHourlySchedule();
        renderSevenDaysGrid();
      });

      missedBtn.addEventListener('click', () => {
        if (hourData.status === 'missed') {
          hourData.status = 'pending';
        } else {
          hourData.status = 'missed';
        }
        dailyData.hours[slot.key] = hourData;
        queueAutoSave();
        renderHourlySchedule();
        renderSevenDaysGrid();
      });

      statusControls.appendChild(doneBtn);
      statusControls.appendChild(missedBtn);

      blockCard.appendChild(timeBadge);
      blockCard.appendChild(inputGroup);
      blockCard.appendChild(statusControls);

      dom.hourlyTimelineContainer.appendChild(blockCard);
    });
  }

  // Quick Action: Pre-populate standard routine
  function quickFillDailyRoutine() {
    const dailyData = getDailyLog(state.currentDate);
    const routineTemplate = {
      '06:00': { task: 'Morning hydration, mobility stretch, and meditation', category: 'Health & Fitness', status: 'pending' },
      '07:00': { task: 'Breakfast, espresso & review pre-week strategic notes', category: 'Routine Admin', status: 'pending' },
      '08:00': { task: 'Deep Work Block 1: Core system architecture & coding', category: 'Deep Work', status: 'pending' },
      '09:00': { task: 'Deep Work Block 1 (Cont): Critical technical delivery', category: 'Deep Work', status: 'pending' },
      '10:00': { task: 'Focused execution & code review / testing', category: 'Core Focus', status: 'pending' },
      '11:00': { task: 'Client standups & communications sync', category: 'Meetings', status: 'pending' },
      '12:00': { task: 'Nutritious lunch & 20-min outdoor sunlight walk', category: 'Rest & Recharge', status: 'pending' },
      '13:00': { task: 'Deep Work Block 2: Feature development & API integration', category: 'Deep Work', status: 'pending' },
      '14:00': { task: 'Deep Work Block 2 (Cont): Debugging & validation', category: 'Deep Work', status: 'pending' },
      '15:00': { task: 'Asynchronous emails, planning & documentation', category: 'Routine Admin', status: 'pending' },
      '16:00': { task: 'Gym strength training / cardio session', category: 'Health & Fitness', status: 'pending' },
      '17:00': { task: 'Post-workout recovery & daily wrap-up notes', category: 'Routine Admin', status: 'pending' },
      '18:00': { task: 'Dinner & quality family/friend connection', category: 'Rest & Recharge', status: 'pending' },
      '19:00': { task: 'Technical reading / continuous learning', category: 'Learning', status: 'pending' },
      '20:00': { task: 'Creative side projects & hobby exploration', category: 'Core Focus', status: 'pending' },
      '21:00': { task: 'Digital wind-down & next-day micro-schedule review', category: 'Routine Admin', status: 'pending' },
      '22:00': { task: 'Fiction reading & sleep preparation protocol', category: 'Rest & Recharge', status: 'pending' },
      '23:00': { task: 'Sleep & optimal physiological recovery', category: 'Rest & Recharge', status: 'pending' },
    };

    dailyData.hours = { ...routineTemplate };
    queueAutoSave();
    renderHourlySchedule();
    renderSevenDaysGrid();
    showToast('Standard high-performance routine loaded!', 'success');
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
    showToast('All planned hours marked complete!', 'success');
  }

  function clearDayLog() {
    if (confirm('Are you sure you want to clear all hourly blocks for this day?')) {
      const dailyData = getDailyLog(state.currentDate);
      dailyData.objective = '';
      dailyData.hours = {};
      queueAutoSave();
      renderHourlySchedule();
      renderSevenDaysGrid();
      showToast('Daily log cleared.', 'info');
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

      // Render 7-day card
      const card = document.createElement('div');
      card.className = `day-card glass-card ${dayStr === state.currentDate ? 'active-selected-day' : ''}`;
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
        updateAllMetrics();
      });

      dom.sevenDaysContainer.appendChild(card);

      // Render Review Log Table Row
      const tr = document.createElement('tr');
      const isSelectedDay = dayStr === state.currentDate;
      tr.innerHTML = `
        <td><strong>${dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</strong> ${dayStr === todayISO ? '<span class="today-badge-btn" style="padding: 0.1rem 0.4rem; font-size: 0.65rem;">Today</span>' : ''}</td>
        <td>${escapeHtml(dayLog.objective || '—')}</td>
        <td>${scheduled} blocks</td>
        <td style="color: var(--accent-emerald); font-weight: 700;">${completed}</td>
        <td style="color: var(--accent-rose); font-weight: 700;">${missed}</td>
        <td>
          <span style="font-family: var(--font-mono); font-weight: 700; color: ${pct >= 75 ? 'var(--accent-emerald)' : pct >= 50 ? 'var(--accent-cyan)' : 'var(--text-muted)'};">${pct}%</span>
        </td>
        <td>
          <button class="table-jump-btn" data-date="${dayStr}">${isSelectedDay ? 'Viewing' : 'Jump to Day'}</button>
        </td>
      `;

      tr.querySelector('.table-jump-btn').addEventListener('click', () => {
        state.currentDate = dayStr;
        updateDateDisplay();
        switchToLevel('micro');
        renderHourlySchedule();
        renderSevenDaysGrid();
        updateAllMetrics();
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
    dom.weeklyStrategyTitle.textContent = `Week ${state.selectedMonthWeek}: Pre-Week Strategic Intentions`;
    dom.weeklyStrategyText.value = weeklyPlan.strategy || '';

    // Render Rocks
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
      delBtn.innerHTML = '🗑️';
      delBtn.title = 'Remove Task';

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

  function addWeeklyRock() {
    const weeklyPlan = getWeeklyPlan();
    weeklyPlan.rocks.push({
      id: 'r_' + Date.now(),
      title: 'New high-impact weekly deliverable',
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

    const monthNamesMap = {
      h1: ['Month 1 (Jan / Horizon Start)', 'Month 2 (Feb / Acceleration)', 'Month 3 (Mar / Execution)', 'Month 4 (Apr / Culmination)'],
      h2: ['Month 5 (May / Horizon 2)', 'Month 6 (Jun / Mid-Year)', 'Month 7 (Jul / Peak Scale)', 'Month 8 (Aug / Consolidation)'],
      h3: ['Month 9 (Sep / Q3 Sprints)', 'Month 10 (Oct / Compounding)', 'Month 11 (Nov / Final Push)', 'Month 12 (Dec / Annual Victory)']
    };

    const monthTitles = monthNamesMap[state.currentHorizon] || ['Month 1', 'Month 2', 'Month 3', 'Month 4'];

    for (let i = 1; i <= 4; i++) {
      const mKey = `m${i}`;
      if (!horizonData[mKey]) {
        horizonData[mKey] = { target: '', milestones: [] };
      }
      const mData = horizonData[mKey];

      const card = document.createElement('div');
      card.className = 'month-horizon-card glass-card';

      card.innerHTML = `
        <div class="month-card-header">
          <span class="month-name-title">${monthTitles[i - 1]}</span>
          <span class="month-badge-tag">M0${i}</span>
        </div>
        <textarea class="month-target-textarea" placeholder="Write monthly targets & strategic focus...">${escapeHtml(mData.target || '')}</textarea>
        <div class="month-milestones-wrapper">
          <span class="month-milestone-title">Key Checkpoints & Deliverables</span>
          <div class="milestones-list-box" id="milestones_list_${mKey}"></div>
          <button class="action-mini-btn add-m-checkpoint-btn" style="align-self: flex-start; margin-top: 0.35rem;">+ Add Checkpoint</button>
        </div>
      `;

      // Textarea listener
      const ta = card.querySelector('.month-target-textarea');
      ta.addEventListener('input', (e) => {
        mData.target = e.target.value;
        queueAutoSave();
      });

      // Render milestones
      const milestonesBox = card.querySelector(`#milestones_list_${mKey}`);
      const renderMilestoneItems = () => {
        milestonesBox.innerHTML = '';
        (mData.milestones || []).forEach((msText, msIdx) => {
          const mItem = document.createElement('div');
          mItem.className = 'milestone-item';
          mItem.innerHTML = `
            <span>📍</span>
            <input type="text" class="milestone-input" value="${escapeHtml(msText)}" placeholder="Milestone description" />
            <button class="rock-del-btn" style="font-size: 0.75rem;">✕</button>
          `;

          const msInput = mItem.querySelector('.milestone-input');
          msInput.addEventListener('input', (e) => {
            mData.milestones[msIdx] = e.target.value;
            queueAutoSave();
          });

          mItem.querySelector('.rock-del-btn').addEventListener('click', () => {
            mData.milestones.splice(msIdx, 1);
            queueAutoSave();
            renderMilestoneItems();
          });

          milestonesBox.appendChild(mItem);
        });
      };

      renderMilestoneItems();

      // Add Checkpoint button
      card.querySelector('.add-m-checkpoint-btn').addEventListener('click', () => {
        if (!mData.milestones) mData.milestones = [];
        mData.milestones.push('Key delivery milestone');
        queueAutoSave();
        renderMilestoneItems();
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
      card.className = 'yearly-goal-card glass-card';

      card.innerHTML = `
        <div class="yearly-goal-top">
          <span class="pillar-badge">${escapeHtml(goal.pillar || 'Strategic Pillar')}</span>
          <button class="goal-delete-btn" title="Delete Goal">🗑️</button>
        </div>
        <input type="text" class="yearly-goal-title-input" value="${escapeHtml(goal.title || '')}" placeholder="High-Level Yearly Goal Title" />
        <div class="goal-metric-target-row">
          <span>Target Metric:</span>
          <input type="text" class="goal-metric-input" value="${escapeHtml(goal.targetMetric || '')}" placeholder="e.g. 100k Users or Sub-4hr Marathon" />
        </div>
        <div class="goal-card-footer">
          <span style="font-size: 0.75rem; color: var(--text-muted);">Status:</span>
          <select class="goal-status-select">
            <option value="In Progress" ${goal.status === 'In Progress' ? 'selected' : ''}>⏳ In Progress</option>
            <option value="Achieved" ${goal.status === 'Achieved' ? 'selected' : ''}>🎯 Achieved</option>
            <option value="Deferred" ${goal.status === 'Deferred' ? 'selected' : ''}>💤 Deferred</option>
          </select>
        </div>
      `;

      // Input listeners
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

  function addNewYearlyGoal() {
    if (!state.year_data.yearly_goals) {
      state.year_data.yearly_goals = [];
    }
    state.year_data.yearly_goals.push({
      id: 'yg_' + Date.now(),
      title: 'New High-Level Annual Vision Goal',
      pillar: 'Strategic Growth',
      targetMetric: '100% Target Met',
      status: 'In Progress'
    });
    queueAutoSave();
    renderYearlyGoals();
    updateAllMetrics();
  }

  // ==========================================================================
  // REAL-TIME PROGRESS TRACKER & DASHBOARD METRICS
  // ==========================================================================
  function updateAllMetrics() {
    // 1. Daily Focus Metric (Today's precision log)
    const todayLog = getDailyLog(state.currentDate);
    const todayHours = Object.values(todayLog.hours);
    const scheduledHours = todayHours.filter(h => h.task && h.task.trim().length > 0).length;
    const completedHours = todayHours.filter(h => h.status === 'completed' && h.task && h.task.trim().length > 0).length;

    const dailyPct = scheduledHours > 0 ? Math.round((completedHours / scheduledHours) * 100) : 0;
    setRingPercentage(dom.dailyRingProgress, dom.dailyPercentageText, dailyPct);
    dom.dailyBlockRatio.textContent = `${completedHours} / ${scheduledHours} hrs`;

    if (dailyPct >= 80) {
      dom.dailyStatusPill.innerHTML = '<span style="color: var(--accent-emerald);">🔥 Peak Momentum</span>';
    } else if (dailyPct >= 50) {
      dom.dailyStatusPill.innerHTML = '<span style="color: var(--accent-cyan);">⚡ High Focus</span>';
    } else if (scheduledHours > 0) {
      dom.dailyStatusPill.innerHTML = '<span style="color: var(--accent-amber);">⚠️ Building Pace</span>';
    } else {
      dom.dailyStatusPill.innerHTML = '<span>Standby</span>';
    }

    // 2. Weekly Pace Metric
    const weekDays = getWeekDateRange(state.currentDate);
    let weekScheduled = 0;
    let weekCompleted = 0;

    weekDays.forEach(dStr => {
      const dLog = state.year_data.daily_logs[dStr];
      if (dLog) {
        const arr = Object.values(dLog.hours);
        weekScheduled += arr.filter(h => h.task && h.task.trim().length > 0).length;
        weekCompleted += arr.filter(h => h.status === 'completed' && h.task && h.task.trim().length > 0).length;
      }
    });

    const weeklyPct = weekScheduled > 0 ? Math.round((weekCompleted / weekScheduled) * 100) : 0;
    setRingPercentage(dom.weeklyRingProgress, dom.weeklyPercentageText, weeklyPct);
    dom.weeklyBlockRatio.textContent = `${weekCompleted} / ${weekScheduled} done`;

    if (weeklyPct >= 75) {
      dom.weeklyStatusPill.innerHTML = '<span style="color: var(--accent-emerald);">🚀 Winning Week</span>';
    } else if (weeklyPct >= 40) {
      dom.weeklyStatusPill.innerHTML = '<span style="color: var(--accent-cyan);">⚡ On Track</span>';
    } else {
      dom.weeklyStatusPill.innerHTML = '<span>Needs Attention</span>';
    }

    // 3. 4-Month Horizon Progress
    const hData = state.year_data.four_months[state.currentHorizon] || {};
    let totalMilestones = 0;
    Object.values(hData).forEach(m => {
      totalMilestones += (m.milestones || []).length;
    });
    // Calculation fallback: weekly completion contributes to horizon sprint
    const monthlyPct = totalMilestones > 0 ? Math.min(100, Math.round((weekCompleted / Math.max(1, weekScheduled || 10)) * 60 + 25)) : (weeklyPct > 0 ? weeklyPct : 35);
    setRingPercentage(dom.monthlyRingProgress, dom.monthlyPercentageText, monthlyPct);
    dom.monthTargetRatio.textContent = `Horizon ${state.currentHorizon.toUpperCase()}`;

    // 4. Yearly Vision Progress
    const yGoals = state.year_data.yearly_goals || [];
    const totalGoals = yGoals.length;
    const achievedGoals = yGoals.filter(g => g.status === 'Achieved').length;
    const inProgressGoals = yGoals.filter(g => g.status === 'In Progress').length;

    const yearlyPct = totalGoals > 0 ? Math.round(((achievedGoals * 1.0 + inProgressGoals * 0.4) / totalGoals) * 100) : 0;
    setRingPercentage(dom.yearlyRingProgress, dom.yearlyPercentageText, yearlyPct);
    dom.yearlyGoalRatio.textContent = `${achievedGoals} / ${totalGoals} goals`;

    // Master Bar update
    dom.yearlyOverallBarFill.style.width = `${yearlyPct}%`;
    dom.yearlyOverallBarText.textContent = `${yearlyPct}% Complete`;
    dom.yearlyGoalsCountLegend.textContent = `${achievedGoals} of ${totalGoals} Key Targets Achieved`;

    if (yearlyPct >= 75) {
      dom.yearlyVisionStatusText.textContent = 'Domination Phase';
      dom.yearlyStatusPill.innerHTML = '<span style="color: var(--accent-emerald);">👑 North Star Met</span>';
    } else if (yearlyPct >= 35) {
      dom.yearlyVisionStatusText.textContent = 'Active Execution';
      dom.yearlyStatusPill.innerHTML = '<span style="color: var(--accent-amber);">🎯 Progressing</span>';
    } else {
      dom.yearlyVisionStatusText.textContent = 'In Conception';
      dom.yearlyStatusPill.innerHTML = '<span>Targeting</span>';
    }
  }

  function setRingPercentage(svgCircle, labelElem, percentage) {
    if (!svgCircle || !labelElem) return;
    const clamped = Math.max(0, Math.min(100, percentage));
    const offset = CIRCLE_CIRCUMFERENCE - (clamped / 100) * CIRCLE_CIRCUMFERENCE;
    svgCircle.style.strokeDashoffset = offset;
    labelElem.textContent = `${clamped}%`;
  }

  // ==========================================================================
  // NAVIGATION & VIEW SWITCHING
  // ==========================================================================
  function switchToLevel(levelKey) {
    state.currentLevel = levelKey;
    dom.levelTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.level === levelKey);
    });

    dom.views.forEach(view => {
      view.classList.toggle('active-view', view.id === `view-${levelKey}`);
    });

    // Refresh view specific components
    if (levelKey === 'micro') renderHourlySchedule();
    if (levelKey === 'daily') renderSevenDaysGrid();
    if (levelKey === 'weekly') renderWeeklyStrategyView();
    if (levelKey === 'monthly') renderFourMonthsHorizon();
    if (levelKey === 'yearly') renderYearlyGoals();

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
      dom.authModalHeading.textContent = 'Sign In to LUMEN';
      dom.authModalSubtitle.textContent = 'Restore your cloud state and sync your productivity log across devices.';
      dom.authSubmitBtnText.textContent = 'Sign In';
    } else {
      dom.tabSwitchRegister.classList.add('active');
      dom.tabSwitchLogin.classList.remove('active');
      dom.authModalHeading.textContent = 'Create an Account';
      dom.authModalSubtitle.textContent = 'Instantly provision your serverless cloud database storage on PostgreSQL.';
      dom.authSubmitBtnText.textContent = 'Create Account';
    }
  }

  async function handleAuthFormSubmit(e) {
    e.preventDefault();
    const email = dom.authEmail.value.trim();
    const password = dom.authPassword.value;

    if (!email || !password) {
      showAuthAlert('Please fill in both email and password.', 'error');
      return;
    }

    if (password.length < 6) {
      showAuthAlert('Password must be at least 6 characters.', 'error');
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
        throw new Error(data.error || 'Authentication request failed.');
      }

      // Success
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

      updateUserSessionUI();
      closeAuthModal();
      showToast(`Welcome back, ${data.user.email}!`, 'success');

      // Load or merge cloud goals
      await loadGoalsFromBackend();
    } catch (err) {
      showAuthAlert(err.message, 'error');
    } finally {
      setAuthLoading(false);
    }
  }

  function showAuthAlert(message, type = 'error') {
    dom.authAlertBox.textContent = message;
    dom.authAlertBox.className = `auth-alert ${type}`;
    dom.authAlertBox.classList.remove('hidden');
  }

  function setAuthLoading(isLoading) {
    dom.authSubmitBtn.disabled = isLoading;
    dom.authSpinner.classList.toggle('hidden', !isLoading);
    dom.authSubmitBtnText.classList.toggle('hidden', isLoading);
  }

  function updateUserSessionUI() {
    if (state.token && state.user) {
      dom.userEmailDisplay.textContent = state.user.email.split('@')[0];
      dom.userAvatarText.textContent = '✨';
      dom.logoutBtn.classList.remove('hidden');
      updateSyncStatusUI('synced', 'Cloud Synced');
    } else {
      dom.userEmailDisplay.textContent = 'Sign In';
      dom.userAvatarText.textContent = '👤';
      dom.logoutBtn.classList.add('hidden');
      updateSyncStatusUI('offline', 'Offline Mode (Local Storage)');
    }
  }

  function handleSignOut(notify = true) {
    state.token = null;
    state.user = null;
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    updateUserSessionUI();
    if (notify) showToast('Signed out successfully.', 'info');
  }

  // ==========================================================================
  // BACKUP & EXPORT/IMPORT
  // ==========================================================================
  function exportBackupJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.year_data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `lumen_productivity_backup_${getTodayISODate()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Productivity backup exported!', 'success');
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
          showToast('Productivity backup restored successfully!', 'success');
        }
      } catch (err) {
        showToast('Invalid JSON backup file.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ==========================================================================
  // TOAST NOTIFICATIONS & UTILITIES
  // ==========================================================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '⚠️' : '⚡';
    toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
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
  function bindEventListeners() {
    // Theme toggle
    dom.themeToggleBtn.addEventListener('click', toggleTheme);

    // Year selector
    dom.yearSelector.addEventListener('change', (e) => {
      state.selectedYear = e.target.value;
      renderYearlyGoals();
      updateAllMetrics();
      showToast(`Switched horizon to ${state.selectedYear}`, 'info');
    });

    // Date navigation
    dom.btnPrevDay.addEventListener('click', () => shiftSelectedDate(-1));
    dom.btnNextDay.addEventListener('click', () => shiftSelectedDate(1));
    dom.btnJumpToday.addEventListener('click', () => {
      state.currentDate = getTodayISODate();
      updateDateDisplay();
      renderHourlySchedule();
      renderSevenDaysGrid();
      updateAllMetrics();
    });

    dom.nativeDatePicker.addEventListener('change', (e) => {
      if (e.target.value) {
        state.currentDate = e.target.value;
        updateDateDisplay();
        renderHourlySchedule();
        renderSevenDaysGrid();
        updateAllMetrics();
      }
    });

    // Hierarchy Tabs
    dom.levelTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        switchToLevel(tab.dataset.level);
      });
    });

    // Level 05 Actions
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

    // Level 03: Weekly Strategy
    dom.monthWeekSelector.querySelectorAll('.sub-week-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        dom.monthWeekSelector.querySelectorAll('.sub-week-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedMonthWeek = parseInt(btn.dataset.weeknum, 10);
        renderWeeklyStrategyView();
      });
    });

    dom.weeklyStrategyText.addEventListener('input', (e) => {
      const wPlan = getWeeklyPlan();
      wPlan.strategy = e.target.value;
      queueAutoSave();
    });

    dom.btnAddWeeklyRock.addEventListener('click', addWeeklyRock);

    // Level 02: 4-Month Horizon toggles
    dom.horizonBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.horizonBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentHorizon = btn.dataset.horizon;
        renderFourMonthsHorizon();
        updateAllMetrics();
      });
    });

    // Level 01: Yearly Vision Actions
    dom.btnAddNewYearlyGoal.addEventListener('click', addNewYearlyGoal);

    // Auth Modal
    dom.authTriggerBtn.addEventListener('click', () => {
      if (state.token) {
        // Toggle or show info
        showToast(`Connected as ${state.user.email}`, 'info');
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
      const type = dom.authPassword.getAttribute('type') === 'password' ? 'text' : 'password';
      dom.authPassword.setAttribute('type', type);
    });

    // Force Sync on clicking badge
    dom.syncStatusBadge.addEventListener('click', () => {
      if (state.token) {
        loadGoalsFromBackend();
      } else {
        openAuthModal('login');
      }
    });

    // Backup Export / Import
    dom.btnExportData.addEventListener('click', exportBackupJSON);
    dom.btnImportData.addEventListener('click', () => dom.importFileInput.click());
    dom.importFileInput.addEventListener('change', importBackupJSON);
  }

  // --- Start the App on DOM Load ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
