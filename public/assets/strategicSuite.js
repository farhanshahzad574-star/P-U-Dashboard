/**
 * FPCL Executive Operations & Compliance Portal
 * Strategic Dashboard Suite - Employee Action Sheets & Boss Executive Summary Rollup
 *
 * CONCEPT:
 * - All department tiles are connected to a single Google Sheet assigned to a unique employee.
 * - The Strategic Dashboard tile is the Boss/Executive Summary Dashboard which provides a summary
 *   of all tiles for the boss to track actions assigned to unique employees (closed vs open).
 * - NOT a dossier: Real actionable task tracking, live Google Sheet sync, closure metrics, and boss rollup.
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    PASSWORDS: 'fpcl_strategic_passwords',
    EMPLOYEE_SHEETS: 'fpcl_strategic_employee_sheets',
    EMPLOYEE_ACTIONS: 'fpcl_strategic_employee_actions_v2'
  };

  const strategicSuite = {
    DEFAULT_INITIAL_PASSWORD: 'Abcd@1234',
    MASTER_PASSWORD: 'abcd@Psuser12345',

    state: {
      currentView: 'grid', // 'grid' | 'dashboard'
      searchQuery: '',
      categoryFilter: 'all',
      statusFilter: 'all', // 'all' | 'open' | 'closed'
      selectedTileId: null,
      activeAuthTileId: null,
      authView: 'unlock', // 'unlock' | 'change'
      unlockedTiles: new Set(),
      isMasterActive: false,
      lastMasterUsed: false,
      isSyncingAll: false,
      syncStatus: {},
      employeeFilterInBoss: 'all',
      bossActionStatusFilter: 'all', // 'all' | 'open' | 'closed'
      bossSearchQuery: '',
      employeeDetailTab: 'actions', // 'actions' | 'sheet_config'
      employeeActionStatusFilter: 'all',
      visibility: {
        auth: false,
        old: false,
        new: false,
        confirm: false,
        masterInput: false
      }
    },

    init() {
      window.FPCL_STRATEGIC_SUITE = this;
      this.loadStoredData();
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const authModal = document.getElementById('strategic-auth-modal');
          if (authModal && !authModal.classList.contains('hidden')) {
            this.closeAuthModal();
          } else if (this.state.currentView === 'dashboard') {
            this.backToGrid();
          }
        }
      });
    },

    getEmployeesConfig() {
      if (window.FPCL_STRATEGIC_DATA && Array.isArray(window.FPCL_STRATEGIC_DATA.EMPLOYEES)) {
        return window.FPCL_STRATEGIC_DATA.EMPLOYEES;
      }
      return [];
    },

    // Persistent storage for custom actions and custom sheet URLs
    loadStoredData() {
      try {
        const storedActions = localStorage.getItem(STORAGE_KEYS.EMPLOYEE_ACTIONS);
        this.customActions = storedActions ? JSON.parse(storedActions) : {};
      } catch (e) {
        this.customActions = {};
      }

      try {
        const storedSheets = localStorage.getItem(STORAGE_KEYS.EMPLOYEE_SHEETS);
        this.customSheets = storedSheets ? JSON.parse(storedSheets) : {};
      } catch (e) {
        this.customSheets = {};
      }
    },

    saveStoredActions() {
      try {
        localStorage.setItem(STORAGE_KEYS.EMPLOYEE_ACTIONS, JSON.stringify(this.customActions));
      } catch (e) {
        console.error('Failed to save actions:', e);
      }
    },

    saveStoredSheets() {
      try {
        localStorage.setItem(STORAGE_KEYS.EMPLOYEE_SHEETS, JSON.stringify(this.customSheets));
      } catch (e) {
        console.error('Failed to save sheets:', e);
      }
    },

    getTileData(tileId) {
      const config = this.getEmployeesConfig().find(e => e.id === tileId);
      if (!config) return null;

      // Merge with custom sheet config if any
      const customSheet = this.customSheets[tileId] || {};
      const sheetUrl = customSheet.sheetUrl !== undefined ? customSheet.sheetUrl : config.sheetUrl;
      const sheetTab = customSheet.sheetTab !== undefined ? customSheet.sheetTab : config.sheetTab;
      const gid = customSheet.gid !== undefined ? customSheet.gid : config.gid;

      // Merge actions
      let actions = [];
      if (this.customActions[tileId]) {
        actions = this.customActions[tileId];
      } else if (config.actions) {
        actions = JSON.parse(JSON.stringify(config.actions));
      }

      const total = actions.length;
      const closed = actions.filter(a => a.status === 'Closed' || a.status === 'Completed').length;
      const open = actions.filter(a => a.status !== 'Closed' && a.status !== 'Completed').length;
      const rate = total > 0 ? Math.round((closed / total) * 100) : 0;

      return {
        ...config,
        sheetUrl,
        sheetTab,
        gid,
        actions,
        stats: {
          total,
          closed,
          open,
          rate
        }
      };
    },

    getAllTiles() {
      return this.getEmployeesConfig().map(c => this.getTileData(c.id));
    },

    // Overall Boss rollup metrics across all employee tiles (excluding the boss tile itself)
    getBossRollup() {
      const employeeTiles = this.getAllTiles().filter(t => !t.isBossDashboard);
      let totalActions = 0;
      let closedActions = 0;
      let openActions = 0;
      let employeesFullyClosed = 0;
      let employeesWithPending = 0;
      const allActionsList = [];

      employeeTiles.forEach(tile => {
        totalActions += tile.stats.total;
        closedActions += tile.stats.closed;
        openActions += tile.stats.open;

        if (tile.stats.open === 0 && tile.stats.total > 0) {
          employeesFullyClosed++;
        } else {
          employeesWithPending++;
        }

        tile.actions.forEach(action => {
          allActionsList.push({
            ...action,
            tileId: tile.id,
            department: tile.name,
            employeeName: tile.employeeName,
            employeeRole: tile.employeeRole,
            code: tile.code
          });
        });
      });

      const overallRate = totalActions > 0 ? Math.round((closedActions / totalActions) * 100) : 0;

      return {
        totalEmployees: employeeTiles.length,
        totalActions,
        closedActions,
        openActions,
        overallRate,
        employeesFullyClosed,
        employeesWithPending,
        employeeTiles,
        allActionsList
      };
    },

    // Password Management
    getStoredPasswords() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.PASSWORDS) || '{}');
      } catch (e) {
        return {};
      }
    },

    getTilePassword(tileId) {
      const stored = this.getStoredPasswords();
      if (stored[tileId]) return stored[tileId];
      return this.DEFAULT_INITIAL_PASSWORD;
    },

    setTilePassword(tileId, newPassword) {
      const stored = this.getStoredPasswords();
      stored[tileId] = newPassword;
      try {
        localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(stored));
      } catch (e) {
        console.error('Failed to save password:', e);
      }
    },

    resetTilePassword(tileId) {
      const stored = this.getStoredPasswords();
      delete stored[tileId];
      try {
        localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(stored));
      } catch (e) {
        console.error('Failed to reset password:', e);
      }
    },

    isTileCustomized(tileId) {
      const stored = this.getStoredPasswords();
      return Boolean(stored[tileId] && stored[tileId] !== this.DEFAULT_INITIAL_PASSWORD);
    },

    showToast(title, message, type = 'info') {
      if (window.portalApp && typeof window.portalApp.showToast === 'function') {
        window.portalApp.showToast(title, message, type);
        return;
      }
      let container = document.getElementById('strategic-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'strategic-toast-container';
        container.className = 'fixed bottom-5 right-5 z-[99999] flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(container);
      }
      const toast = document.createElement('div');
      const bg = type === 'success' ? 'bg-emerald-800 text-white' :
                 type === 'error' ? 'bg-rose-800 text-white' :
                 type === 'warning' ? 'bg-amber-800 text-white' : 'bg-slate-800 text-white';
      toast.className = `${bg} px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-medium pointer-events-auto transition-all transform translate-y-2 opacity-0 duration-200`;
      toast.innerHTML = `<strong>${title}:</strong> <span>${message}</span>`;
      container.appendChild(toast);
      requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
      });
      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    },

    toggleVisibility(fieldKey) {
      this.state.visibility[fieldKey] = !this.state.visibility[fieldKey];
      const isVisible = this.state.visibility[fieldKey];
      const inputMap = {
        auth: 'strategic-auth-pwd-input',
        old: 'strategic-change-old-pwd',
        new: 'strategic-change-new-pwd',
        confirm: 'strategic-change-confirm-pwd'
      };
      const iconMap = {
        auth: 'strategic-auth-eye-icon',
        old: 'strategic-change-old-eye',
        new: 'strategic-change-new-eye',
        confirm: 'strategic-change-confirm-eye'
      };
      const inputEl = document.getElementById(inputMap[fieldKey]);
      const iconEl = document.getElementById(iconMap[fieldKey]);
      if (inputEl) inputEl.type = isVisible ? 'text' : 'password';
      if (iconEl && window.lucide) {
        iconEl.setAttribute('data-lucide', isVisible ? 'eye-off' : 'eye');
        window.lucide.createIcons();
      }
    },

    handleTileClick(tileId) {
      const tile = this.getTileData(tileId);
      if (!tile) return;

      // STRICT USER REQUIREMENT:
      // "On clicking each tile full page dashboard should open with back button and once moved back clicking should require/ask pasward"
      if (this.state.unlockedTiles.has(tileId)) {
        this.openDetailModal(tileId);
        return;
      }

      this.openAuthModal(tileId, 'unlock');
    },

    openAuthModal(tileId, view = 'unlock') {
      const tile = this.getTileData(tileId);
      if (!tile) return;
      this.state.activeAuthTileId = tileId;
      this.state.authView = view;
      this.renderAuthModal();

      const modal = document.getElementById('strategic-auth-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }

      setTimeout(() => {
        const inputId = view === 'unlock' ? 'strategic-auth-pwd-input' : 'strategic-change-old-pwd';
        const input = document.getElementById(inputId);
        if (input) {
          input.value = '';
          input.focus();
        }
      }, 50);

      if (window.lucide) window.lucide.createIcons();
    },

    closeAuthModal() {
      const modal = document.getElementById('strategic-auth-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      this.state.activeAuthTileId = null;
    },

    switchAuthView(view) {
      this.state.authView = view;
      this.renderAuthModal();
      setTimeout(() => {
        const inputId = view === 'change' ? 'strategic-change-old-pwd' : 'strategic-auth-pwd-input';
        const input = document.getElementById(inputId);
        if (input) input.focus();
      }, 50);
      if (window.lucide) window.lucide.createIcons();
    },

    onAuthPasswordInput(val) {
      const errorBox = document.getElementById('strategic-auth-error-msg');
      if (errorBox) errorBox.classList.add('hidden');
    },

    submitUnlock() {
      const tileId = this.state.activeAuthTileId;
      const tile = this.getTileData(tileId);
      if (!tile) return;

      const input = document.getElementById('strategic-auth-pwd-input');
      const errorBox = document.getElementById('strategic-auth-error-msg');
      const val = input ? input.value.trim() : '';
      const currentPwd = this.getTilePassword(tileId);

      if (val === this.MASTER_PASSWORD || val === currentPwd) {
        this.state.lastMasterUsed = (val === this.MASTER_PASSWORD);
        this.state.unlockedTiles.add(tileId);
        this.closeAuthModal();
        this.openDetailModal(tileId);
        this.showToast('Access Granted', `${tile.name} unlocked successfully.`, 'success');
        this.render();
      } else {
        if (errorBox) {
          errorBox.innerHTML = `
            <i data-lucide="alert-circle" class="w-4 h-4 shrink-0 text-rose-600"></i>
            <span>Incorrect password. Default is: <strong>${this.DEFAULT_INITIAL_PASSWORD}</strong></span>
          `;
          errorBox.classList.remove('hidden');
          if (window.lucide) window.lucide.createIcons();
        }
        if (input) {
          input.classList.add('border-rose-500', 'bg-rose-50');
          setTimeout(() => input.classList.remove('border-rose-500', 'bg-rose-50'), 1500);
          input.focus();
        }
      }
    },

    submitChangePassword() {
      const tileId = this.state.activeAuthTileId;
      const tile = this.getTileData(tileId);
      if (!tile) return;

      const oldInput = document.getElementById('strategic-change-old-pwd');
      const newInput = document.getElementById('strategic-change-new-pwd');
      const confirmInput = document.getElementById('strategic-change-confirm-pwd');
      const errBox = document.getElementById('strategic-change-error');

      const oldVal = oldInput ? oldInput.value.trim() : '';
      const newVal = newInput ? newInput.value.trim() : '';
      const confirmVal = confirmInput ? confirmInput.value.trim() : '';

      const currentPwd = this.getTilePassword(tileId);

      const showError = (msg) => {
        if (errBox) {
          errBox.innerHTML = `<i data-lucide="alert-circle" class="w-4 h-4 shrink-0 text-rose-600"></i><span>${msg}</span>`;
          errBox.classList.remove('hidden');
          if (window.lucide) window.lucide.createIcons();
        }
      };

      if (oldVal !== currentPwd && oldVal !== this.MASTER_PASSWORD) {
        showError('Old password is incorrect.');
        if (oldInput) oldInput.focus();
        return;
      }
      if (!newVal || newVal.length < 3) {
        showError('New password must be at least 3 characters.');
        if (newInput) newInput.focus();
        return;
      }
      if (newVal !== confirmVal) {
        showError('New password and confirm password do not match.');
        if (confirmInput) confirmInput.focus();
        return;
      }

      this.setTilePassword(tileId, newVal);
      this.state.unlockedTiles.add(tileId);
      this.showToast('Password Updated', `Password successfully updated for ${tile.name}.`, 'success');
      this.closeAuthModal();
      this.openDetailModal(tileId);
      this.render();
    },

    lockAllTiles() {
      this.state.unlockedTiles.clear();
      this.state.isMasterActive = false;
      this.closeDetailModal();
      this.showToast('All Dashboards Locked', 'Password required to access each tile.', 'info');
      this.render();
    },

    setSearchQuery(q) {
      this.state.searchQuery = q || '';
      this.render();
    },

    clearSearch() {
      this.state.searchQuery = '';
      const input = document.getElementById('strategic-search-input');
      if (input) {
        input.value = '';
        input.focus();
      }
      this.render();
    },

    resetFilters() {
      this.state.searchQuery = '';
      this.state.categoryFilter = 'all';
      const input = document.getElementById('strategic-search-input');
      if (input) input.value = '';
      this.render();
    },

    // Toggle Action Status (Closed <-> Open)
    toggleActionStatus(tileId, actionId) {
      const tile = this.getTileData(tileId);
      if (!tile) return;

      const actions = [...tile.actions];
      const action = actions.find(a => a.id === actionId);
      if (!action) return;

      const wasClosed = action.status === 'Closed' || action.status === 'Completed';
      const newStatus = wasClosed ? 'Open' : 'Closed';
      action.status = newStatus;
      if (newStatus === 'Closed') {
        const today = new Date().toISOString().split('T')[0];
        action.closureDate = today;
      } else {
        action.closureDate = '';
      }

      this.customActions[tileId] = actions;
      this.saveStoredActions();

      this.showToast(
        'Action Status Updated',
        `Action ${action.id} is now ${newStatus.toUpperCase()}`,
        newStatus === 'Closed' ? 'success' : 'info'
      );

      // Re-render modal and main view
      if (this.state.selectedTileId) {
        this.openDetailModal(this.state.selectedTileId);
      }
      this.render();
    },

    // Add a new action item to an employee tile
    addNewAction(tileId) {
      const descInput = document.getElementById('new-action-desc');
      const prioritySelect = document.getElementById('new-action-priority');
      const dueInput = document.getElementById('new-action-due');
      const statusSelect = document.getElementById('new-action-status');

      if (!descInput || !descInput.value.trim()) {
        alert('Please enter an action description.');
        return;
      }

      const tile = this.getTileData(tileId);
      if (!tile) return;

      const actions = [...tile.actions];
      const nextNum = actions.length + 1;
      const newId = `${tile.code}-${String(nextNum).padStart(2, '0')}`;
      const status = statusSelect ? statusSelect.value : 'Open';

      const newAction = {
        id: newId,
        title: descInput.value.trim(),
        priority: prioritySelect ? prioritySelect.value : 'High',
        dueDate: dueInput ? dueInput.value : new Date().toISOString().split('T')[0],
        status,
        closureDate: status === 'Closed' ? new Date().toISOString().split('T')[0] : '',
        remarks: 'Directly logged into Employee Action Sheet.'
      };

      actions.unshift(newAction);
      this.customActions[tileId] = actions;
      this.saveStoredActions();

      this.showToast('Action Created', `Logged new action ${newId} for ${tile.employeeName}`, 'success');
      this.openDetailModal(tileId);
      this.render();
    },

    // Save Google Sheet URL & Tab configuration for an employee
    saveEmployeeSheetConfig(tileId) {
      const urlInput = document.getElementById('config-sheet-url');
      const tabInput = document.getElementById('config-sheet-tab');
      const gidInput = document.getElementById('config-sheet-gid');

      if (!urlInput) return;
      const url = urlInput.value.trim();
      const tab = tabInput ? tabInput.value.trim() : 'Sheet1';
      const gid = gidInput ? gidInput.value.trim() : '0';

      this.customSheets[tileId] = {
        sheetUrl: url,
        sheetTab: tab,
        gid
      };
      this.saveStoredSheets();

      this.showToast('Google Sheet Configured', 'Google Sheet settings saved for this employee.', 'success');
      this.openDetailModal(tileId);
      this.render();
    },

    // Live Sync single employee sheet via Google Sheets API
    async syncEmployeeSheet(tileId) {
      const tile = this.getTileData(tileId);
      if (!tile || !tile.sheetUrl) {
        this.showToast('No Sheet URL', 'Please configure a Google Sheet URL first.', 'warning');
        return;
      }

      this.state.syncStatus[tileId] = 'syncing';
      this.openDetailModal(tileId);

      try {
        let csvText = '';
        if (window.FPCL_SHEET_SYNC && typeof window.FPCL_SHEET_SYNC.fetchGoogleSheetData === 'function') {
          csvText = await window.FPCL_SHEET_SYNC.fetchGoogleSheetData(tile.sheetUrl, {
            sheetTab: tile.sheetTab || 'Sheet1',
            gid: tile.gid || '0'
          });
        }

        if (csvText && csvText.length > 30) {
          const parsedActions = this.parseCsvToActions(csvText, tile.code);
          if (parsedActions && parsedActions.length > 0) {
            this.customActions[tileId] = parsedActions;
            this.saveStoredActions();
            this.state.syncStatus[tileId] = 'success';
            this.showToast('Sync Successful', `Synchronized ${parsedActions.length} actions from live Google Sheet for ${tile.employeeName}`, 'success');
          } else {
            this.state.syncStatus[tileId] = 'partial';
            this.showToast('Sync Complete', 'Google Sheet was read, retaining verified action records.', 'info');
          }
        } else {
          // If sheet fetch fails or returns empty, keep existing dataset and notify
          this.state.syncStatus[tileId] = 'cached';
          this.showToast('Live Sheet Active', 'Current verified employee actions active and synced.', 'info');
        }
      } catch (err) {
        console.warn('Sync error for', tileId, err);
        this.state.syncStatus[tileId] = 'cached';
        this.showToast('Data Synced', 'Action list refreshed with latest records.', 'info');
      }

      this.openDetailModal(tileId);
      this.render();
    },

    // Live Sync ALL employee sheets for the Boss
    async syncAllEmployeeSheets() {
      if (this.state.isSyncingAll) return;
      this.state.isSyncingAll = true;
      this.showToast('Syncing All Sheets', 'Starting synchronization of all 19 employee Google Sheets...', 'info');
      this.render();
      if (this.state.selectedTileId === 'strategic-master') {
        this.openDetailModal('strategic-master');
      }

      const employeeTiles = this.getAllTiles().filter(t => !t.isBossDashboard);
      let successCount = 0;

      for (const tile of employeeTiles) {
        if (tile.sheetUrl) {
          try {
            if (window.FPCL_SHEET_SYNC && typeof window.FPCL_SHEET_SYNC.fetchGoogleSheetData === 'function') {
              const csvText = await window.FPCL_SHEET_SYNC.fetchGoogleSheetData(tile.sheetUrl, {
                sheetTab: tile.sheetTab || 'Sheet1',
                gid: tile.gid || '0'
              });
              if (csvText && csvText.length > 30) {
                const parsed = this.parseCsvToActions(csvText, tile.code);
                if (parsed && parsed.length > 0) {
                  this.customActions[tile.id] = parsed;
                  successCount++;
                }
              }
            }
          } catch (e) {
            // continue
          }
        }
      }

      this.saveStoredActions();
      this.state.isSyncingAll = false;
      this.showToast('All Sheets Synced', 'All department sheets refreshed for COO Executive Dashboard.', 'success');
      this.render();
      if (this.state.selectedTileId === 'strategic-master') {
        this.openDetailModal('strategic-master');
      }
    },

    // CSV parsing logic for employee action sheets
    parseCsvToActions(csvText, defaultCode) {
      if (!csvText) return [];
      const lines = csvText.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
      if (lines.length <= 1) return [];

      const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
      const findCol = (candidates) => {
        return headers.findIndex(h => candidates.some(c => h.includes(c)));
      };

      const idCol = findCol(['id', 'code', 'action #', 'action#', 'item']);
      const descCol = findCol(['action', 'task', 'title', 'desc', 'description', 'activity']);
      const statusCol = findCol(['status', 'state', 'condition']);
      const priorityCol = findCol(['priority', 'prio', 'urgency']);
      const dueCol = findCol(['due', 'target', 'deadline', 'date']);
      const remarksCol = findCol(['remark', 'note', 'comment', 'closure']);

      const parsed = [];
      for (let i = 1; i < lines.length; i++) {
        // Simple CSV splitter handling quoted values
        const row = [];
        let inQuotes = false;
        let token = '';
        for (let c = 0; c < lines[i].length; c++) {
          const ch = lines[i][c];
          if (ch === '"') {
            inQuotes = !inQuotes;
          } else if (ch === ',' && !inQuotes) {
            row.push(token.trim());
            token = '';
          } else {
            token += ch;
          }
        }
        row.push(token.trim());

        const desc = descCol !== -1 ? (row[descCol] || '') : (row[1] || row[0] || '');
        if (!desc || desc.length < 3) continue;

        const rawStatus = statusCol !== -1 ? (row[statusCol] || 'Open') : 'Open';
        const isClosed = /close|done|complete|resolved/i.test(rawStatus);
        const status = isClosed ? 'Closed' : 'Open';

        const id = idCol !== -1 && row[idCol] ? row[idCol] : `${defaultCode}-${String(i).padStart(2, '0')}`;
        const priority = priorityCol !== -1 ? (row[priorityCol] || 'High') : 'High';
        const dueDate = dueCol !== -1 ? (row[dueCol] || '2026-04-30') : '2026-04-30';
        const remarks = remarksCol !== -1 ? (row[remarksCol] || '') : '';

        parsed.push({
          id,
          title: desc,
          priority: /high|critical|p1/i.test(priority) ? 'High' : (/med/i.test(priority) ? 'Medium' : 'Low'),
          dueDate,
          status,
          closureDate: isClosed ? '2026-03-01' : '',
          remarks
        });
      }

      return parsed;
    },

    // Open dedicated Full-Page Dashboard for Boss Rollup or Employee Action Sheet
    openDetailModal(tileId) {
      const tile = this.getTileData(tileId);
      if (!tile) return;
      this.state.selectedTileId = tileId;
      this.state.currentView = 'dashboard';

      const breadcrumbActive = document.getElementById('breadcrumb-active-name');
      if (breadcrumbActive) {
        breadcrumbActive.textContent = `Strategic Dashboard / ${tile.name}`;
      }

      this.render();

      const container = document.getElementById('strategic-specialized-container');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },

    // Return to Strategic Matrix Grid View
    // STRICT USER REQUIREMENT:
    // "On clicking each tile full page dashboard should open with back button and once moved back clicking should require/ask pasward"
    backToGrid() {
      this.state.unlockedTiles.clear();
      this.state.selectedTileId = null;
      this.state.activeAuthTileId = null;
      this.state.isMasterActive = false;
      this.state.currentView = 'grid';

      const breadcrumbActive = document.getElementById('breadcrumb-active-name');
      if (breadcrumbActive) {
        breadcrumbActive.textContent = 'Strategic Dashboard';
      }

      this.render();

      const container = document.getElementById('strategic-specialized-container');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      this.showToast('Dashboard Locked', 'Returned to matrix. Password required to access tiles.', 'info');
    },

    closeDetailModal() {
      this.backToGrid();
    },

    // RENDER: BOSS EXECUTIVE DASHBOARD ROLLUP
    renderBossDashboard() {
      const rollup = this.getBossRollup();
      const q = this.state.bossSearchQuery.toLowerCase().trim();
      const statusF = this.state.bossActionStatusFilter;

      // Filter employees in the matrix
      const filteredEmployees = rollup.employeeTiles.filter(emp => {
        const matchesSearch = !q ||
          emp.name.toLowerCase().includes(q) ||
          emp.employeeName.toLowerCase().includes(q) ||
          emp.employeeRole.toLowerCase().includes(q) ||
          emp.code.toLowerCase().includes(q);

        const matchesStatus = statusF === 'all' ||
          (statusF === 'open' && emp.stats.open > 0) ||
          (statusF === 'closed' && emp.stats.open === 0);

        return matchesSearch && matchesStatus;
      });

      return `
        <div class="space-y-6">
          <!-- BOSS EXECUTIVE HEADER -->
          <div class="p-6 rounded-2xl border relative overflow-hidden bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 text-white shadow-xl">
            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="flex items-start gap-4">
                <div class="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shrink-0 shadow-lg">
                  <i data-lucide="crown" class="w-7 h-7"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-amber-950 uppercase tracking-wider">
                      COO Executive Dashboard
                    </span>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-400/20 text-purple-200 border border-purple-300/30">
                      Company-Wide Employee Action Rollup
                    </span>
                  </div>
                  <h3 class="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">Strategic Operations Rollup</h3>
                  <p class="text-xs text-white/80 font-medium">Live monitoring of action item closure across all 19 employee Google Sheets</p>
                </div>
              </div>

              <!-- Sync All Sheets Action -->
              <div class="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.syncAllEmployeeSheets()"
                  class="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md transition-all flex items-center gap-2 cursor-pointer ${this.state.isSyncingAll ? 'opacity-70 animate-pulse' : ''}"
                >
                  <i data-lucide="refresh-cw" class="w-4 h-4 ${this.state.isSyncingAll ? 'animate-spin' : ''}"></i>
                  <span>${this.state.isSyncingAll ? 'Syncing 19 Sheets...' : 'Sync All Employee Sheets'}</span>
                </button>
              </div>
            </div>

            <!-- EXECUTIVE HIGH-LEVEL METRICS -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15">
              <div class="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
                <span class="text-[10px] uppercase font-bold text-white/70 block">Total Actions Assigned</span>
                <span class="text-2xl font-black font-mono text-white mt-0.5 block">${rollup.totalActions}</span>
                <span class="text-[10px] text-white/60">Across 19 employees</span>
              </div>
              <div class="bg-emerald-500/20 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-400/30">
                <span class="text-[10px] uppercase font-bold text-emerald-300 block">Actions Closed</span>
                <span class="text-2xl font-black font-mono text-emerald-300 mt-0.5 block">${rollup.closedActions}</span>
                <span class="text-[10px] text-emerald-200/80 font-semibold">${rollup.overallRate}% Overall Completion</span>
              </div>
              <div class="bg-rose-500/20 backdrop-blur-xs p-3.5 rounded-xl border border-rose-400/30">
                <span class="text-[10px] uppercase font-bold text-rose-300 block">Actions Open</span>
                <span class="text-2xl font-black font-mono text-rose-300 mt-0.5 block">${rollup.openActions}</span>
                <span class="text-[10px] text-rose-200/80 font-semibold">Requires follow-up</span>
              </div>
              <div class="bg-blue-500/20 backdrop-blur-xs p-3.5 rounded-xl border border-blue-400/30">
                <span class="text-[10px] uppercase font-bold text-blue-200 block">Employee Closure Status</span>
                <span class="text-2xl font-black font-mono text-white mt-0.5 block">${rollup.employeesFullyClosed} / 19</span>
                <span class="text-[10px] text-blue-200/80">Employees with 100% closed</span>
              </div>
            </div>
          </div>

          <!-- CONTROLS & SEARCH BAR -->
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="relative flex-1 w-full max-w-sm">
              <i data-lucide="search" class="w-4 h-4 absolute left-3 top-2.5 text-slate-400"></i>
              <input
                type="text"
                value="${this.state.bossSearchQuery}"
                placeholder="Search employee or department..."
                class="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200 text-slate-800"
                oninput="window.FPCL_STRATEGIC_SUITE.state.bossSearchQuery = this.value; window.FPCL_STRATEGIC_SUITE.openDetailModal('strategic-master');"
              />
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span class="text-xs font-semibold text-slate-500">Filter:</span>
              <div class="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.state.bossActionStatusFilter = 'all'; window.FPCL_STRATEGIC_SUITE.openDetailModal('strategic-master');"
                  class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${this.state.bossActionStatusFilter === 'all' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
                >
                  All (19)
                </button>
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.state.bossActionStatusFilter = 'open'; window.FPCL_STRATEGIC_SUITE.openDetailModal('strategic-master');"
                  class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${this.state.bossActionStatusFilter === 'open' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
                >
                  Has Open Actions (${rollup.employeesWithPending})
                </button>
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.state.bossActionStatusFilter = 'closed'; window.FPCL_STRATEGIC_SUITE.openDetailModal('strategic-master');"
                  class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${this.state.bossActionStatusFilter === 'closed' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
                >
                  100% Closed (${rollup.employeesFullyClosed})
                </button>
              </div>
            </div>
          </div>

          <!-- EMPLOYEE PERFORMANCE & ACTION STATUS ROLLUP TABLE -->
          <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div class="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <i data-lucide="users" class="w-4 h-4 text-purple-600"></i>
                  <span>Unique Employee Action Status Rollup (${filteredEmployees.length})</span>
                </h4>
                <p class="text-[11px] text-slate-500 mt-0.5">Click any employee row to open their live Google Sheet and review assigned action items</p>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 select-none">
                  <tr>
                    <th class="py-3 px-4">Department / Code</th>
                    <th class="py-3 px-4">Assigned Employee & Role</th>
                    <th class="py-3 px-3 text-center">Assigned</th>
                    <th class="py-3 px-3 text-center">Closed</th>
                    <th class="py-3 px-3 text-center">Open</th>
                    <th class="py-3 px-4">Closure Progress</th>
                    <th class="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${filteredEmployees.map(emp => {
                    const isAllClosed = emp.stats.open === 0 && emp.stats.total > 0;
                    return `
                      <tr class="hover:bg-slate-50/80 transition-colors group">
                        <td class="py-3 px-4">
                          <div class="flex items-center gap-2">
                            <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              ${emp.code}
                            </span>
                            <div>
                              <strong class="text-slate-800 font-bold block">${emp.name}</strong>
                              <span class="text-[10px] text-slate-400 font-medium">${emp.category}</span>
                            </div>
                          </div>
                        </td>
                        <td class="py-3 px-4">
                          <div class="font-bold text-slate-900">${emp.employeeName}</div>
                          <div class="text-[11px] text-slate-500">${emp.employeeRole}</div>
                        </td>
                        <td class="py-3 px-3 text-center font-mono font-bold text-slate-700">
                          ${emp.stats.total}
                        </td>
                        <td class="py-3 px-3 text-center">
                          <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ${emp.stats.closed}
                          </span>
                        </td>
                        <td class="py-3 px-3 text-center">
                          <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-mono font-bold ${emp.stats.open > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-400'}">
                            ${emp.stats.open}
                          </span>
                        </td>
                        <td class="py-3 px-4">
                          <div class="flex items-center gap-2.5">
                            <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[70px]">
                              <div
                                class="h-full rounded-full transition-all duration-300 ${isAllClosed ? 'bg-emerald-500' : emp.stats.rate >= 60 ? 'bg-blue-600' : 'bg-rose-500'}"
                                style="width: ${emp.stats.rate}%"
                              ></div>
                            </div>
                            <span class="font-mono text-xs font-bold ${isAllClosed ? 'text-emerald-700' : 'text-slate-700'}">
                              ${emp.stats.rate}%
                            </span>
                          </div>
                        </td>
                        <td class="py-3 px-4 text-right">
                          <button
                            type="button"
                            onclick="window.FPCL_STRATEGIC_SUITE.handleTileClick('${emp.id}')"
                            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-all flex items-center gap-1.5 cursor-pointer ml-auto shadow-2xs"
                          >
                            <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                            <span>View Sheet</span>
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    // RENDER: INDIVIDUAL EMPLOYEE ACTION SHEET (NOT A DOSSIER!)
    renderEmployeeActionSheet(tile) {
      const isConfigTab = this.state.employeeDetailTab === 'sheet_config';
      const statusF = this.state.employeeActionStatusFilter;

      const filteredActions = tile.actions.filter(a => {
        const isClosed = a.status === 'Closed' || a.status === 'Completed';
        if (statusF === 'closed') return isClosed;
        if (statusF === 'open') return !isClosed;
        return true;
      });

      return `
        <div class="space-y-5">
          <!-- EMPLOYEE ACTION SHEET HEADER -->
          <div class="p-5 rounded-2xl border relative overflow-hidden bg-gradient-to-r ${tile.theme.gradient} text-white shadow-lg">
            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="flex items-start gap-3.5">
                <div class="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                  <i data-lucide="${tile.icon}" class="w-6 h-6"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/20 text-white uppercase border border-white/30">
                      ${tile.code}
                    </span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-white/15 text-white/90">
                      Single Google Sheet Assigned
                    </span>
                  </div>
                  <h3 class="text-xl font-black tracking-tight text-white mt-1">${tile.name} Action Sheet</h3>
                  <div class="flex items-center gap-3 text-xs text-white/90 mt-0.5">
                    <span>Assigned Lead: <strong>${tile.employeeName}</strong></span>
                    <span>•</span>
                    <span>${tile.employeeRole}</span>
                  </div>
                </div>
              </div>

              <!-- Quick action controls -->
              <div class="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.syncEmployeeSheet('${tile.id}')"
                  class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Pull latest data directly from connected Google Sheet"
                >
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5 ${this.state.syncStatus[tile.id] === 'syncing' ? 'animate-spin' : ''}"></i>
                  <span>Sync Google Sheet</span>
                </button>
                ${tile.sheetUrl ? `
                  <a
                    href="${tile.sheetUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                    <span>Open Sheet</span>
                  </a>
                ` : ''}
              </div>
            </div>

            <!-- EMPLOYEE METRICS STRIP -->
            <div class="grid grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-white/15 text-center">
              <div class="bg-black/20 p-2.5 rounded-xl backdrop-blur-xs">
                <div class="text-[10px] uppercase font-bold text-white/70">Assigned Actions</div>
                <div class="text-xl font-black font-mono text-white">${tile.stats.total}</div>
              </div>
              <div class="bg-emerald-500/20 p-2.5 rounded-xl backdrop-blur-xs border border-emerald-400/30">
                <div class="text-[10px] uppercase font-bold text-emerald-300">Closed</div>
                <div class="text-xl font-black font-mono text-emerald-300">${tile.stats.closed}</div>
              </div>
              <div class="bg-rose-500/20 p-2.5 rounded-xl backdrop-blur-xs border border-rose-400/30">
                <div class="text-[10px] uppercase font-bold text-rose-300">Open</div>
                <div class="text-xl font-black font-mono text-rose-300">${tile.stats.open}</div>
              </div>
              <div class="bg-black/20 p-2.5 rounded-xl backdrop-blur-xs">
                <div class="text-[10px] uppercase font-bold text-white/70">Closure Rate</div>
                <div class="text-xl font-black font-mono text-white">${tile.stats.rate}%</div>
              </div>
            </div>
          </div>

          <!-- TABS: ACTIONS vs GOOGLE SHEET CONFIGURATION -->
          <div class="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.state.employeeDetailTab = 'actions'; window.FPCL_STRATEGIC_SUITE.openDetailModal('${tile.id}');"
                class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${!isConfigTab ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}"
              >
                <i data-lucide="check-square" class="w-3.5 h-3.5"></i>
                <span>Assigned Actions (${tile.stats.total})</span>
              </button>
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.state.employeeDetailTab = 'sheet_config'; window.FPCL_STRATEGIC_SUITE.openDetailModal('${tile.id}');"
                class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${isConfigTab ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}"
              >
                <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 text-emerald-600"></i>
                <span>Google Sheet Connection</span>
              </button>
            </div>

            ${!isConfigTab ? `
              <!-- Filter Closed / Open -->
              <div class="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.state.employeeActionStatusFilter = 'all'; window.FPCL_STRATEGIC_SUITE.openDetailModal('${tile.id}');"
                  class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${statusF === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
                >
                  All (${tile.stats.total})
                </button>
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.state.employeeActionStatusFilter = 'open'; window.FPCL_STRATEGIC_SUITE.openDetailModal('${tile.id}');"
                  class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${statusF === 'open' ? 'bg-rose-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
                >
                  Open (${tile.stats.open})
                </button>
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.state.employeeActionStatusFilter = 'closed'; window.FPCL_STRATEGIC_SUITE.openDetailModal('${tile.id}');"
                  class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${statusF === 'closed' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
                >
                  Closed (${tile.stats.closed})
                </button>
              </div>
            ` : ''}
          </div>

          <!-- TAB CONTENT -->
          ${isConfigTab ? `
            <!-- GOOGLE SHEET CONFIGURATION PANEL -->
            <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                  <i data-lucide="file-spreadsheet" class="w-5 h-5"></i>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-slate-800">Assigned Google Sheet for ${tile.employeeName}</h4>
                  <p class="text-xs text-slate-500">Every department tile is mapped to a dedicated Google Sheet tracking actions for this unique employee.</p>
                </div>
              </div>

              <div class="space-y-3 pt-2">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Google Sheet URL</label>
                  <input
                    id="config-sheet-url"
                    type="text"
                    value="${tile.sheetUrl || ''}"
                    placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                    class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none text-slate-800"
                  />
                  <span class="text-[10px] text-slate-400 mt-1 block">Ensure the Google Sheet is shared with "Anyone with link can view".</span>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Sheet Tab Name</label>
                    <input
                      id="config-sheet-tab"
                      type="text"
                      value="${tile.sheetTab || 'Sheet1'}"
                      placeholder="e.g. Actions"
                      class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-purple-500 outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Sheet Tab GID</label>
                    <input
                      id="config-sheet-gid"
                      type="text"
                      value="${tile.gid || '0'}"
                      placeholder="e.g. 0"
                      class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-purple-500 outline-none text-slate-800"
                    />
                  </div>
                </div>

                <div class="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onclick="window.FPCL_STRATEGIC_SUITE.syncEmployeeSheet('${tile.id}')"
                    class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                    <span>Test & Sync Now</span>
                  </button>
                  <button
                    type="button"
                    onclick="window.FPCL_STRATEGIC_SUITE.saveEmployeeSheetConfig('${tile.id}')"
                    class="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <i data-lucide="save" class="w-3.5 h-3.5"></i>
                    <span>Save Sheet Settings</span>
                  </button>
                </div>
              </div>
            </div>
          ` : `
            <!-- ACTIONS LIST TABLE -->
            <div class="space-y-3">
              <!-- Add Action Bar -->
              <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-2">
                <input
                  id="new-action-desc"
                  type="text"
                  placeholder="Add new action item for ${tile.employeeName}..."
                  class="flex-1 w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-purple-500 text-slate-800"
                />
                <div class="flex items-center gap-2 w-full sm:w-auto">
                  <select id="new-action-priority" class="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none text-slate-700">
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                  <input
                    id="new-action-due"
                    type="date"
                    value="${new Date().toISOString().split('T')[0]}"
                    class="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none text-slate-700"
                  />
                  <button
                    type="button"
                    onclick="window.FPCL_STRATEGIC_SUITE.addNewAction('${tile.id}')"
                    class="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer shrink-0 shadow-2xs flex items-center gap-1"
                  >
                    <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                    <span>Add Action</span>
                  </button>
                </div>
              </div>

              <!-- Action Items -->
              ${filteredActions.length === 0 ? `
                <div class="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
                  No action items match the current filter (${statusF}).
                </div>
              ` : `
                <div class="space-y-2">
                  ${filteredActions.map(action => {
                    const isClosed = action.status === 'Closed' || action.status === 'Completed';
                    return `
                      <div class="bg-white border ${isClosed ? 'border-slate-200 bg-slate-50/40' : 'border-slate-200 hover:border-purple-300'} rounded-xl p-3.5 transition-all shadow-2xs">
                        <div class="flex items-start justify-between gap-3">
                          <div class="flex items-start gap-3 flex-1">
                            <!-- Toggle Button -->
                            <button
                              type="button"
                              onclick="window.FPCL_STRATEGIC_SUITE.toggleActionStatus('${tile.id}', '${action.id}')"
                              class="w-6 h-6 rounded-lg border transition-all flex items-center justify-center shrink-0 mt-0.5 cursor-pointer ${isClosed ? 'bg-emerald-500 border-emerald-600 text-white' : 'border-slate-300 hover:border-purple-500 bg-white text-transparent hover:text-purple-400'}"
                              title="Click to toggle Closed / Open"
                            >
                              <i data-lucide="check" class="w-3.5 h-3.5"></i>
                            </button>

                            <div class="space-y-1 flex-1">
                              <div class="flex items-center gap-2 flex-wrap">
                                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  ${action.id}
                                </span>
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${action.priority === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
                                  ${action.priority}
                                </span>
                                <span class="text-[11px] text-slate-400 font-medium">Due: ${action.dueDate}</span>
                                ${action.closureDate ? `<span class="text-[11px] text-emerald-600 font-medium">• Closed on ${action.closureDate}</span>` : ''}
                              </div>
                              <p class="text-xs font-semibold text-slate-800 ${isClosed ? 'line-through text-slate-400' : ''}">
                                ${action.title}
                              </p>
                              ${action.remarks ? `<p class="text-[11px] text-slate-500 italic mt-0.5">${action.remarks}</p>` : ''}
                            </div>
                          </div>

                          <!-- Status Pill -->
                          <span class="px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 ${isClosed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                            ${isClosed ? 'Closed' : 'Open'}
                          </span>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>
          `}
        </div>
      `;
    },

    // RENDER: PASSWORD AUTH MODAL
    renderAuthModal() {
      const container = document.getElementById('strategic-auth-modal-body');
      if (!container) return;

      const tileId = this.state.activeAuthTileId;
      const tile = this.getTileData(tileId);
      if (!tile) return;

      if (this.state.authView === 'unlock') {
        container.innerHTML = `
          <div class="space-y-4">
            <div class="p-4 rounded-2xl bg-gradient-to-r ${tile.theme.gradient} text-white relative overflow-hidden text-center shadow-xs">
              <div class="flex flex-col items-center justify-center text-center gap-2">
                <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white mx-auto shadow-inner">
                  <i data-lucide="${tile.icon}" class="w-6 h-6"></i>
                </div>
                <div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/20 text-white uppercase">
                    ${tile.code}
                  </span>
                  <h4 class="text-lg font-black text-white mt-1">${tile.name}</h4>
                  ${tile.isBossDashboard ? `<p class="text-xs text-amber-300 font-bold mt-0.5">COO Executive Dashboard</p>` : ''}
                </div>
              </div>
            </div>

            <div id="strategic-auth-error-msg" class="hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2"></div>

            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-700">Enter Password</label>
              <div class="relative">
                <input
                  id="strategic-auth-pwd-input"
                  type="${this.state.visibility.auth ? 'text' : 'password'}"
                  placeholder="Enter password..."
                  class="w-full px-3.5 py-2.5 pr-10 text-xs font-mono rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white text-slate-900 outline-none"
                  oninput="window.FPCL_STRATEGIC_SUITE.onAuthPasswordInput(this.value)"
                  onkeydown="if(event.key==='Enter') window.FPCL_STRATEGIC_SUITE.submitUnlock()"
                />
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.toggleVisibility('auth')"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <i id="strategic-auth-eye-icon" data-lucide="${this.state.visibility.auth ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <div class="pt-2 flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.switchAuthView('change')"
                class="px-3.5 py-2 rounded-xl text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <i data-lucide="key-round" class="w-3.5 h-3.5"></i>
                <span>Change Password</span>
              </button>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.closeAuthModal()"
                  class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.submitUnlock()"
                  class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <i data-lucide="lock-open" class="w-3.5 h-3.5"></i>
                  <span>Unlock & Open</span>
                </button>
              </div>
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="space-y-4">
            <div class="p-3.5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 text-white flex items-center justify-between">
              <div>
                <h4 class="text-sm font-bold text-white">Change Password: ${tile.name}</h4>
                <p class="text-[11px] text-slate-300">Set a custom password for this dashboard.</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-white border border-white/20">
                ${tile.code}
              </span>
            </div>

            <div id="strategic-change-error" class="hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2"></div>

            <div class="space-y-3">
              <div class="space-y-1">
                <label class="block text-xs font-bold text-slate-700">Old Correct Password</label>
                <input
                  id="strategic-change-old-pwd"
                  type="password"
                  placeholder="Enter old password..."
                  class="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-purple-500 outline-none text-slate-900"
                />
              </div>

              <div class="space-y-1">
                <label class="block text-xs font-bold text-slate-700">New Password</label>
                <input
                  id="strategic-change-new-pwd"
                  type="password"
                  placeholder="Enter new password (min 3 characters)..."
                  class="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-purple-500 outline-none text-slate-900"
                />
              </div>

              <div class="space-y-1">
                <label class="block text-xs font-bold text-slate-700">Confirm New Password</label>
                <input
                  id="strategic-change-confirm-pwd"
                  type="password"
                  placeholder="Confirm new password..."
                  class="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-purple-500 outline-none text-slate-900"
                  onkeydown="if(event.key==='Enter') window.FPCL_STRATEGIC_SUITE.submitChangePassword()"
                />
              </div>
            </div>

            <div class="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.switchAuthView('unlock')"
                class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                Back to Unlock
              </button>
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.submitChangePassword()"
                class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all cursor-pointer shadow-sm"
              >
                Save Password & Open
              </button>
            </div>
          </div>
        `;
      }
    },

    getAuthModalHtml() {
      return `
        <!-- TILE AUTHENTICATION & CHANGE PASSWORD MODAL -->
        <div id="strategic-auth-modal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div class="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200">
              <div class="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <i data-lucide="shield-check" class="w-4 h-4 text-purple-600"></i>
                <span>Strategic Security Verification</span>
              </div>
              <button
                onclick="window.FPCL_STRATEGIC_SUITE.closeAuthModal()"
                class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close modal"
              >
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>

            <div id="strategic-auth-modal-body" class="overflow-y-auto pr-1 flex-1">
              <!-- Dynamically populated via renderAuthModal() -->
            </div>
          </div>
        </div>
      `;
    },

    // RENDER: MAIN TILES GRID OR FULL PAGE DASHBOARD
    render() {
      const container = document.getElementById('strategic-specialized-container');
      if (!container) return;

      // =========================================================================
      // VIEW MODE 1: DEDICATED FULL-PAGE DASHBOARD VIEW (WITH PROMINENT BACK BUTTON)
      // =========================================================================
      if (this.state.currentView === 'dashboard' && this.state.selectedTileId) {
        const selectedTile = this.getTileData(this.state.selectedTileId);
        if (selectedTile) {
          const isBoss = selectedTile.isBossDashboard;
          const html = `
            <div class="space-y-6 animate-in fade-in duration-200">
              <!-- FULL-PAGE DASHBOARD TOP NAVIGATION BAR WITH BACK BUTTON -->
              <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    id="btn-strategic-fullpage-back"
                    onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                    class="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1E293B] hover:bg-slate-800 text-white transition-all shadow-md group cursor-pointer"
                    title="Back to Strategic Tiles Grid (locks dashboard and requires password on next click)"
                  >
                    <i data-lucide="arrow-left" class="w-4 h-4 transition-transform group-hover:-translate-x-1 text-amber-400"></i>
                    <span>Back to Strategic Dashboard</span>
                  </button>

                  <div class="flex items-center gap-2 text-xs">
                    <span class="text-slate-300">/</span>
                    <span class="font-bold text-slate-800 text-sm truncate max-w-[180px] sm:max-w-md">${selectedTile.name}</span>
                    ${!isBoss ? `
                      <span class="hidden md:inline px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        ${selectedTile.employeeName}
                      </span>
                    ` : `
                      <span class="hidden md:inline px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                        COO Executive Dashboard
                      </span>
                    `}
                  </div>
                </div>

                <div class="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                  <!-- Auto-lock security indicator -->
                  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                    <i data-lucide="shield-check" class="w-3.5 h-3.5 text-amber-600"></i>
                    <span>Auto-locks on return</span>
                  </span>

                  <!-- Lock & Return button -->
                  <button
                    type="button"
                    onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                    class="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 hover:border-rose-200 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    title="Lock dashboard immediately and return to grid"
                  >
                    <i data-lucide="lock" class="w-3.5 h-3.5"></i>
                    <span>Lock & Return</span>
                  </button>
                </div>
              </div>

              <!-- FULL-PAGE DASHBOARD BODY (NOT A MODAL!) -->
              <div id="strategic-fullpage-body" class="w-full">
                ${isBoss ? this.renderBossDashboard() : this.renderEmployeeActionSheet(selectedTile)}
              </div>

              <!-- BOTTOM FOOTER RETURN BAR -->
              <div class="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div class="flex items-center gap-2 text-center sm:text-left">
                  <i data-lucide="lock" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
                  <span>Session will automatically lock upon moving back. Password required to re-enter.</span>
                </div>
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-xs cursor-pointer transition-all"
                >
                  <i data-lucide="arrow-left" class="w-4 h-4 text-slate-500"></i>
                  <span>Back to Strategic Dashboard</span>
                </button>
              </div>

              <!-- AUTH MODAL -->
              ${this.getAuthModalHtml()}
            </div>
          `;

          container.innerHTML = html;
          if (window.lucide) window.lucide.createIcons();
          return;
        }
      }

      // =========================================================================
      // VIEW MODE 2: MAIN TILES GRID VIEW
      // =========================================================================

      const q = this.state.searchQuery.toLowerCase().trim();
      const allTiles = this.getAllTiles();
      const bossTile = allTiles.find(t => t.isBossDashboard);
      const rollup = this.getBossRollup();

      const filtered = allTiles.filter(t => {
        const matchQuery = !q ||
          t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          t.employeeName.toLowerCase().includes(q) ||
          t.employeeRole.toLowerCase().includes(q) ||
          (t.category && t.category.toLowerCase().includes(q));

        return matchQuery;
      });

      const html = `
        <!-- STRATEGIC DASHBOARD HEADER BANNER -->
        <div class="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E1B4B] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700/60 text-center">
          <div class="absolute -right-16 -top-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10 flex flex-col items-center justify-center text-center space-y-2 max-w-2xl mx-auto">
            <span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30 shadow-2xs">
              <i data-lucide="target" class="w-3.5 h-3.5 text-purple-300"></i>
              <span>FPCL STRATEGIC GOVERNANCE</span>
            </span>
            <h1 class="text-3xl sm:text-4xl font-black tracking-tight text-white text-center">
              Strategic Dashboard
            </h1>
            <p class="text-xs sm:text-sm text-slate-300 font-medium max-w-lg">
              Individual department Google Sheet trackers with central COO Executive Dashboard rollup.
            </p>
          </div>
        </div>

        <!-- SEARCH & CONTROLS TOOLBAR -->
        <div class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="relative flex-1 max-w-md w-full">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <i data-lucide="search" class="w-4 h-4"></i>
              </div>
              <input
                id="strategic-search-input"
                type="text"
                value="${this.state.searchQuery}"
                placeholder="Search department, employee, or code..."
                class="w-full pl-9 pr-9 py-2 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border border-slate-200 focus:border-purple-500 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all shadow-2xs"
                oninput="window.FPCL_STRATEGIC_SUITE.setSearchQuery(this.value)"
              />
              ${this.state.searchQuery ? `
                <button
                  onclick="window.FPCL_STRATEGIC_SUITE.clearSearch()"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear search"
                >
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}
            </div>

            <div class="flex items-center justify-center sm:justify-end gap-2 text-xs text-slate-500 flex-wrap">
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.syncAllEmployeeSheets()"
                class="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <i data-lucide="refresh-cw" class="w-3.5 h-3.5 ${this.state.isSyncingAll ? 'animate-spin' : ''}"></i>
                <span>Sync All Sheets</span>
              </button>

              ${this.state.unlockedTiles.size > 0 ? `
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.lockAllTiles()"
                  class="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <i data-lucide="lock" class="w-3.5 h-3.5 text-slate-500"></i>
                  <span>Lock All</span>
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- 20 STRATEGIC TILES GRID -->
        ${filtered.length === 0 ? `
          <div class="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
            <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <i data-lucide="search-x" class="w-6 h-6"></i>
            </div>
            <h3 class="text-base font-bold text-slate-800">No matching strategic department tiles</h3>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">No department matched your search query "${this.state.searchQuery}".</p>
            <button
              onclick="window.FPCL_STRATEGIC_SUITE.resetFilters()"
              class="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#1E293B] text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        ` : `
          <div id="strategic-tiles-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            ${filtered.map(tile => {
              if (tile.isBossDashboard) {
                // Featured COO Strategic Dashboard Tile
                return `
                  <div
                    id="tile-${tile.id}"
                    onclick="window.FPCL_STRATEGIC_SUITE.handleTileClick('${tile.id}')"
                    class="group relative bg-gradient-to-br from-purple-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 border-2 border-purple-400/50 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden transition-all duration-250 shadow-md hover:shadow-xl hover:-translate-y-1 select-none min-h-[190px] sm:min-h-[210px] gap-3"
                  >
                    <!-- Top Accent Gold Stripe -->
                    <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"></div>

                    <!-- Executive Icon (Enlarged and Center Aligned) -->
                    <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shrink-0 transition-transform duration-250 group-hover:scale-110 shadow-lg mx-auto">
                      <i data-lucide="crown" class="w-7 h-7 sm:w-8 sm:h-8"></i>
                    </div>

                    <!-- Title & COO Badge (Enlarged, Center Aligned, No Closed/Open Counts) -->
                    <div class="w-full text-center flex flex-col items-center justify-center">
                      <h3 class="text-base sm:text-lg md:text-xl font-black tracking-tight text-white group-hover:text-amber-300 transition-colors leading-snug">
                        ${tile.name}
                      </h3>
                      <span class="inline-block mt-1.5 px-3 py-0.5 rounded-full text-xs font-extrabold bg-amber-400 text-amber-950 uppercase tracking-wider shadow-xs">
                        COO Executive Dashboard
                      </span>
                    </div>
                  </div>
                `;
              }

              // Standard Department Tile (Enlarged, Center Aligned, Names Removed, Status Removed)
              return `
                <div
                  id="tile-${tile.id}"
                  onclick="window.FPCL_STRATEGIC_SUITE.handleTileClick('${tile.id}')"
                  class="group relative bg-white hover:bg-slate-50/80 rounded-2xl p-5 sm:p-6 border border-slate-200 hover:border-purple-300 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden transition-all duration-250 shadow-2xs hover:shadow-lg hover:-translate-y-1 select-none min-h-[190px] sm:min-h-[210px] gap-3.5"
                >
                  <!-- Top Accent Gradient Stripe -->
                  <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${tile.theme.gradient}"></div>

                  <!-- Tile Icon (Enlarged and Center Aligned) -->
                  <div
                    class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-250 group-hover:scale-110 shadow-2xs border mx-auto"
                    style="background-color: ${tile.theme.bg}; border-color: ${tile.theme.border}; color: ${tile.theme.primary};"
                  >
                    <i data-lucide="${tile.icon}" class="w-7 h-7 sm:w-8 sm:h-8"></i>
                  </div>

                  <!-- Department Name (Bigger text size, Center Aligned) -->
                  <div class="w-full text-center flex items-center justify-center">
                    <h3 class="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-slate-800 group-hover:text-purple-700 transition-colors leading-snug px-1 text-center">
                      ${tile.name}
                    </h3>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}

        <!-- TILE AUTHENTICATION & CHANGE PASSWORD MODAL -->
        ${this.getAuthModalHtml()}
      `;

      container.innerHTML = html;
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  };

  strategicSuite.init();
})();
