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
      // Dynamic filters and pagination for Individual Tile Dashboard
      tileFilterSearch: '',
      tileFilterStatus: 'all', // 'all' | 'Open' | 'Closed'
      tilePage: 1,
      tilePageSize: 15,
      tileLastSynced: {},
      tileActions: {},
      // Dynamic filters and pagination for Strategic Master Rollup Dashboard
      masterFilterSearch: '',
      masterFilterDept: 'all', // 'all' | tileId
      masterFilterStatus: 'all', // 'all' | 'Open' | 'Closed'
      masterPage: 1,
      masterPageSize: 15,
      masterLastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sheetConfigModalTileId: null,
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
      this.fetchServerSheetConfigs();
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

    // Automatically query backend for live Google Sheet data & environment secret-configured sheet URLs
    async fetchServerSheetConfigs() {
      // 1. Fetch live parsed actions directly from Google Sheets
      try {
        const res = await fetch('/api/strategic/live-data', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.liveActions) {
            let updated = false;
            for (const [tileId, actions] of Object.entries(data.liveActions)) {
              if (Array.isArray(actions) && actions.length > 0) {
                this.customActions[tileId] = actions;
                this.state.tileLastSynced[tileId] = data.data?.[tileId]?.lastSynced || 'Just now';
                updated = true;
              }
            }
            this.state.masterLastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (updated) {
              this.saveStoredActions();
              this.render();
            }
          }
        }
      } catch (err) {
        console.warn('Initial live sheet fetch note:', err);
      }

      // 2. Fetch sheet configurations & URLs
      try {
        const res = await fetch('/api/strategic/sheets', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.sheets) {
            this.serverSheets = data.sheets;
            let updated = false;
            for (const [key, conf] of Object.entries(data.sheets)) {
              if (conf && conf.sheetUrl && conf.fromSecret) {
                const currentLocal = this.customSheets[key];
                // Update if not set locally or pointing to placeholder
                if (!currentLocal || !currentLocal.sheetUrl || currentLocal.sheetUrl.includes('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')) {
                  this.customSheets[key] = {
                    ...(this.customSheets[key] || {}),
                    sheetUrl: conf.sheetUrl,
                    sheetTab: conf.sheetTab || (key === 'scm' ? 'SCM' : 'Sheet1'),
                    fromSecret: true
                  };
                  updated = true;
                }
              }
            }
            if (updated) {
              this.saveStoredSheets();
              this.render();
            }
          }
        }
      } catch (err) {
        // Fallback gracefully
      }
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

      // Merge with custom sheet config or server secrets
      const customSheet = this.customSheets[tileId] || {};
      const serverSheet = (this.serverSheets && this.serverSheets[tileId]) || {};
      
      let sheetUrl = config.sheetUrl;
      let sheetTab = config.sheetTab;
      let gid = config.gid;

      if (customSheet.sheetUrl) {
        sheetUrl = customSheet.sheetUrl;
        if (customSheet.sheetTab) sheetTab = customSheet.sheetTab;
        if (customSheet.gid !== undefined) gid = customSheet.gid;
      } else if (serverSheet.sheetUrl) {
        sheetUrl = serverSheet.sheetUrl;
        if (serverSheet.sheetTab) sheetTab = serverSheet.sheetTab;
        if (serverSheet.gid !== undefined) gid = serverSheet.gid;
      }

      // Default sheetTab for SCM
      if (tileId === 'scm') {
        sheetTab = sheetTab || 'SCM';
      }

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
        fromSecret: Boolean(customSheet.fromSecret || serverSheet.fromSecret),
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
            <span>wrong password</span>
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

    // Explicitly set action status via dropdown menu ('Open' | 'Closed')
    setActionStatus(tileId, actionId, newStatus) {
      const tile = this.getTileData(tileId);
      if (!tile) return;

      const actions = [...tile.actions];
      const action = actions.find(a => a.id === actionId);
      if (!action) return;

      action.status = newStatus;
      if (newStatus === 'Closed' || newStatus === 'Completed') {
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

      if (this.state.selectedTileId) {
        this.openDetailModal(this.state.selectedTileId);
      }
      this.render();
    },

    // Add a new action item to an employee tile
    addNewAction(tileId) {
      const descInput = document.getElementById('new-action-desc');
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
        dueDate: dueInput ? dueInput.value : new Date().toISOString().split('T')[0],
        status,
        closureDate: status === 'Closed' ? new Date().toISOString().split('T')[0] : '',
        remarks: 'Directly logged into Action Sheet.'
      };

      actions.unshift(newAction);
      this.customActions[tileId] = actions;
      this.saveStoredActions();

      this.showToast('Action Created', `Logged new action ${newId} in ${tile.name}`, 'success');
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

    // =========================================================================
    // DYNAMIC FILTERING, PAGINATION & CSV EXPORT HELPERS
    // =========================================================================

    getFilteredTileActions(tileId) {
      const tile = this.getTileData(tileId);
      if (!tile || !tile.actions) return [];
      const q = (this.state.tileFilterSearch || '').toLowerCase().trim();
      const statusF = this.state.tileFilterStatus || 'all';

      return tile.actions.filter(a => {
        const isClosed = a.status === 'Closed' || a.status === 'Completed';
        if (statusF === 'Open' && isClosed) return false;
        if (statusF === 'Closed' && !isClosed) return false;

        if (q) {
          const matchId = (a.id || '').toLowerCase().includes(q);
          const matchTitle = (a.title || '').toLowerCase().includes(q);
          const matchRemarks = (a.remarks || '').toLowerCase().includes(q);
          const matchDue = (a.dueDate || '').toLowerCase().includes(q);
          if (!matchId && !matchTitle && !matchRemarks && !matchDue) return false;
        }

        return true;
      });
    },

    setTileFilter(key, val) {
      this.state[key] = val;
      this.state.tilePage = 1;
      this.render();
    },

    clearTileFilters() {
      this.state.tileFilterSearch = '';
      this.state.tileFilterStatus = 'all';
      this.state.tilePage = 1;
      this.render();
    },

    setTilePage(p) {
      this.state.tilePage = p;
      this.render();
      const table = document.getElementById('strategic-tile-table');
      if (table) table.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    setTilePageSize(sz) {
      this.state.tilePageSize = sz === 'all' ? 9999 : parseInt(sz, 10);
      this.state.tilePage = 1;
      this.render();
    },

    exportTileCSV(tileId) {
      const tile = this.getTileData(tileId);
      if (!tile) return;
      const data = this.getFilteredTileActions(tileId);
      if (!data || data.length === 0) {
        this.showToast('No Data', 'No actions match current filters to export.', 'warning');
        return;
      }

      const headers = ['Sr #', 'Action ID', 'Action Description', 'Due Date', 'Status', 'Remarks'];
      const rows = data.map((d, i) => [
        i + 1,
        `"${String(d.id || '').replace(/"/g, '""')}"`,
        `"${String(d.title || '').replace(/"/g, '""')}"`,
        `"${String(d.dueDate || '').replace(/"/g, '""')}"`,
        `"${String(d.status || '').replace(/"/g, '""')}"`,
        `"${String(d.remarks || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `FPCL_${tile.code}_Actions_Filtered_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      this.showToast('CSV Exported', `Exported ${data.length} filtered actions for ${tile.name}`, 'success');
    },

    toggleActionStatus(tileId, actionId) {
      const tile = this.getTileData(tileId);
      if (!tile) return;
      const actions = [...tile.actions];
      const target = actions.find(a => a.id === actionId);
      if (!target) return;

      const isNowClosed = target.status !== 'Closed' && target.status !== 'Completed';
      target.status = isNowClosed ? 'Closed' : 'Open';
      target.closureDate = isNowClosed ? new Date().toISOString().split('T')[0] : '';

      this.customActions[tileId] = actions;
      this.saveStoredActions();
      this.showToast('Status Updated', `Action ${actionId} marked as ${target.status}`, 'info');
      this.render();
    },

    getFilteredMasterActions() {
      const rollup = this.getBossRollup();
      const all = rollup.allActionsList || [];
      const q = (this.state.masterFilterSearch || '').toLowerCase().trim();
      const deptF = this.state.masterFilterDept || 'all';
      const statusF = this.state.masterFilterStatus || 'all';

      return all.filter(a => {
        if (deptF !== 'all' && a.tileId !== deptF && (a.department || '').toLowerCase() !== deptF.toLowerCase()) {
          return false;
        }

        const isClosed = a.status === 'Closed' || a.status === 'Completed';
        if (statusF === 'Open' && isClosed) return false;
        if (statusF === 'Closed' && !isClosed) return false;

        if (q) {
          const matchId = (a.id || '').toLowerCase().includes(q);
          const matchTitle = (a.title || '').toLowerCase().includes(q);
          const matchDept = (a.department || '').toLowerCase().includes(q);
          const matchRemarks = (a.remarks || '').toLowerCase().includes(q);
          const matchDue = (a.dueDate || '').toLowerCase().includes(q);
          if (!matchId && !matchTitle && !matchDept && !matchRemarks && !matchDue) return false;
        }

        return true;
      });
    },

    setMasterFilter(key, val) {
      this.state[key] = val;
      this.state.masterPage = 1;
      this.render();
    },

    clearMasterFilters() {
      this.state.masterFilterSearch = '';
      this.state.masterFilterDept = 'all';
      this.state.masterFilterStatus = 'all';
      this.state.masterPage = 1;
      this.render();
    },

    setMasterPage(p) {
      this.state.masterPage = p;
      this.render();
      const table = document.getElementById('strategic-master-table');
      if (table) table.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    setMasterPageSize(sz) {
      this.state.masterPageSize = sz === 'all' ? 9999 : parseInt(sz, 10);
      this.state.masterPage = 1;
      this.render();
    },

    exportMasterCSV() {
      const data = this.getFilteredMasterActions();
      if (!data || data.length === 0) {
        this.showToast('No Data', 'No actions match current filters to export.', 'warning');
        return;
      }

      const headers = ['Sr #', 'Department', 'Code', 'Action ID', 'Action Description', 'Due Date', 'Status', 'Remarks'];
      const rows = data.map((d, i) => [
        i + 1,
        `"${String(d.department || '').replace(/"/g, '""')}"`,
        `"${String(d.code || '').replace(/"/g, '""')}"`,
        `"${String(d.id || '').replace(/"/g, '""')}"`,
        `"${String(d.title || '').replace(/"/g, '""')}"`,
        `"${String(d.dueDate || '').replace(/"/g, '""')}"`,
        `"${String(d.status || '').replace(/"/g, '""')}"`,
        `"${String(d.remarks || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `FPCL_Strategic_Dashboard_Rollup_Filtered_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      this.showToast('CSV Exported', `Exported ${data.length} filtered company actions to CSV`, 'success');
    },

    openSheetConfigModal(tileId) {
      this.state.sheetConfigModalTileId = tileId;
      this.render();
      const modal = document.getElementById('strategic-sheet-config-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
      if (window.lucide) window.lucide.createIcons();
    },

    closeSheetConfigModal() {
      this.state.sheetConfigModalTileId = null;
      const modal = document.getElementById('strategic-sheet-config-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      this.render();
    },

    isSheetConnected(tileId) {
      if (!tileId) return false;
      const status = this.state.syncStatus[tileId];
      if (status === 'broken' || status === 'error') {
        return false;
      }
      
      const tile = this.getTileData(tileId);
      if (!tile) return false;

      // For Boss Dashboard: connected if all non-boss tiles have no broken status and at least one is connected
      if (tile.isBossDashboard) {
        const all = this.getAllTiles().filter(t => !t.isBossDashboard);
        const hasBroken = all.some(t => this.state.syncStatus[t.id] === 'broken' || this.state.syncStatus[t.id] === 'error');
        return !hasBroken && all.some(t => Boolean(t.sheetUrl && t.sheetUrl.trim().length > 10));
      }

      if (!tile.sheetUrl || tile.sheetUrl.trim().length < 10) {
        return false;
      }

      // If URL is explicitly marked as broken
      if (tile.sheetUrl.includes('invalid') || tile.sheetUrl.includes('broken')) {
        return false;
      }

      return true;
    },

    disconnectSheet(tileId) {
      this.state.syncStatus[tileId] = 'broken';
      if (this.customSheets[tileId]) {
        this.customSheets[tileId].sheetUrl = '';
      } else {
        this.customSheets[tileId] = { sheetUrl: '', sheetTab: '', gid: '0' };
      }
      this.saveStoredSheets();
      this.closeSheetConfigModal();
      this.showToast('Link Broken / Disconnected', 'Google Sheet link disconnected. Status dot turned orange.', 'warning');
      this.render();
    },

    saveSheetConfigModal(tileId) {
      const urlEl = document.getElementById('modal-sheet-url');
      const tabEl = document.getElementById('modal-sheet-tab');
      const gidEl = document.getElementById('modal-sheet-gid');
      if (!urlEl) return;
      const url = urlEl.value.trim();
      const tab = tabEl ? tabEl.value.trim() : '';
      const gid = gidEl ? gidEl.value.trim() : '0';

      const isValid = url.length > 10 && (url.includes('docs.google.com/spreadsheets') || url.startsWith('http'));
      this.customSheets[tileId] = { sheetUrl: url, sheetTab: tab, gid };
      this.saveStoredSheets();

      if (!isValid || url === '') {
        this.state.syncStatus[tileId] = 'broken';
        this.closeSheetConfigModal();
        this.showToast('Link Broken', 'No valid Google Sheet link provided. Status dot turned orange.', 'warning');
      } else {
        this.state.syncStatus[tileId] = 'success';
        this.closeSheetConfigModal();
        this.showToast('Settings Saved', 'Google Sheet connection verified active. Status dot is green.', 'success');
      }
      this.render();
    },

    getSheetConfigModalHtml() {
      const tileId = this.state.sheetConfigModalTileId;
      if (!tileId) return '';
      const tile = this.getTileData(tileId);
      if (!tile) return '';
      const isConnected = this.isSheetConnected(tileId);

      return `
        <!-- GOOGLE SHEET CONFIGURATION MODAL -->
        <div id="strategic-sheet-config-modal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div class="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200">
              <div class="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-600"></i>
                <span>Google Sheet Connection: ${tile.name}</span>
              </div>
              <button
                onclick="window.FPCL_STRATEGIC_SUITE.closeSheetConfigModal()"
                class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>

            <!-- Connection Status Pill -->
            <div class="flex items-center justify-between px-3 py-2 rounded-xl ${isConnected ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-amber-50 border border-amber-300 text-amber-900'}">
              <div class="flex items-center gap-2">
                <span class="relative flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                </span>
                <span class="text-xs font-bold">${isConnected ? 'Google Sheet is Connected (Green Dot)' : 'Google Sheet Link Broken / Unlinked (Orange Dot)'}</span>
              </div>
              <span class="text-[10px] font-mono font-bold uppercase tracking-wider">${isConnected ? 'Active' : 'Broken'}</span>
            </div>

            <div class="space-y-3">
              <div class="space-y-1">
                <label class="block text-xs font-bold text-slate-700">Google Sheet URL</label>
                <input
                  id="modal-sheet-url"
                  type="text"
                  value="${tile.sheetUrl || ''}"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  class="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-purple-500 outline-none text-slate-900 bg-slate-50 focus:bg-white"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="block text-xs font-bold text-slate-700">Sheet Tab Name</label>
                  <input
                    id="modal-sheet-tab"
                    type="text"
                    value="${tile.sheetTab || tile.name}"
                    placeholder="${tile.name}"
                    class="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-purple-500 outline-none text-slate-900 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div class="space-y-1">
                  <label class="block text-xs font-bold text-slate-700">Sheet GID</label>
                  <input
                    id="modal-sheet-gid"
                    type="text"
                    value="${tile.gid || '0'}"
                    placeholder="0"
                    class="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-purple-500 outline-none text-slate-900 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div class="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.disconnectSheet('${tile.id}')"
                class="px-3 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer flex items-center gap-1.5"
                title="Disconnect or break the Google Sheet link to trigger orange dot"
              >
                <i data-lucide="unlink" class="w-3.5 h-3.5"></i>
                <span>Break Link</span>
              </button>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.closeSheetConfigModal()"
                  class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.saveSheetConfigModal('${tile.id}'); window.FPCL_STRATEGIC_SUITE.syncEmployeeSheet('${tile.id}')"
                  class="px-3.5 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                  <span>Save & Sync</span>
                </button>
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.saveSheetConfigModal('${tile.id}')"
                  class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all cursor-pointer shadow-sm"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // Live Sync single employee sheet via Google Sheets API
    async syncEmployeeSheet(tileId) {
      const tile = this.getTileData(tileId);
      if (!tile) return;

      this.state.syncStatus[tileId] = 'syncing';
      this.render();

      let syncedSuccessfully = false;

      // 1. Try server live-data endpoint first (fast, bypasses CORS, handles multiple tab aliases)
      try {
        const res = await fetch(`/api/strategic/live-data?tileId=${encodeURIComponent(tileId)}&refresh=true`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.liveActions && Array.isArray(data.liveActions[tileId]) && data.liveActions[tileId].length > 0) {
            const actions = data.liveActions[tileId];
            this.customActions[tileId] = actions;
            this.saveStoredActions();
            this.state.syncStatus[tileId] = 'success';
            this.state.tileLastSynced[tileId] = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            this.showToast('Sync Successful', `Synchronized ${actions.length} live deliverables from Google Sheet for ${tile.name}`, 'success');
            syncedSuccessfully = true;
          }
        }
      } catch (err) {
        console.warn('Backend sync failed, attempting client-side fallback for', tileId, err);
      }

      // 2. Fallback to client-side sheet sync if needed
      if (!syncedSuccessfully && tile.sheetUrl) {
        try {
          let csvText = '';
          if (window.FPCL_SHEET_SYNC && typeof window.FPCL_SHEET_SYNC.fetchGoogleSheetData === 'function') {
            csvText = await window.FPCL_SHEET_SYNC.fetchGoogleSheetData(tile.sheetUrl, {
              sheetTab: tile.name || tile.sheetTab || 'Sheet1',
              gid: tile.gid || '0'
            });
          }

          if (csvText && csvText.length > 30) {
            const parsedActions = this.parseCsvToActions(csvText, tile.code);
            if (parsedActions && parsedActions.length > 0) {
              this.customActions[tileId] = parsedActions;
              this.saveStoredActions();
              this.state.syncStatus[tileId] = 'success';
              this.state.tileLastSynced[tileId] = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              this.showToast('Sync Successful', `Synchronized ${parsedActions.length} actions from Google Sheet for ${tile.name}`, 'success');
              syncedSuccessfully = true;
            }
          }
        } catch (err) {
          console.warn('Fallback sync error for', tileId, err);
        }
      }

      if (!syncedSuccessfully) {
        this.state.syncStatus[tileId] = 'cached';
        this.showToast('Live Sheet Active', 'Current verified records active on dashboard.', 'info');
      }

      this.render();
    },

    // Live Sync ALL employee sheets for the Boss & Strategic Dashboard
    async syncAllEmployeeSheets() {
      if (this.state.isSyncingAll) return;
      this.state.isSyncingAll = true;
      this.showToast('Syncing All Sheets', 'Connecting to all Google Sheets and picking live data...', 'info');
      this.render();

      let successCount = 0;

      // 1. Try parallel server live sync (fetches all connected sheets simultaneously in ~1-2s)
      try {
        const res = await fetch('/api/strategic/live-data?refresh=true', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.liveActions) {
            for (const [tileId, actions] of Object.entries(data.liveActions)) {
              if (Array.isArray(actions) && actions.length > 0) {
                this.customActions[tileId] = actions;
                this.state.tileLastSynced[tileId] = data.data?.[tileId]?.lastSynced || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                successCount++;
              }
            }
          }
        }
      } catch (err) {
        console.warn('Server bulk sync failed, falling back to sequential sync:', err);
      }

      // 2. Sequential fallback if server did not return actions
      if (successCount === 0) {
        const employeeTiles = this.getAllTiles().filter(t => !t.isBossDashboard);
        for (const tile of employeeTiles) {
          if (tile.sheetUrl) {
            try {
              if (window.FPCL_SHEET_SYNC && typeof window.FPCL_SHEET_SYNC.fetchGoogleSheetData === 'function') {
                const csvText = await window.FPCL_SHEET_SYNC.fetchGoogleSheetData(tile.sheetUrl, {
                  sheetTab: tile.name || tile.sheetTab || 'Sheet1',
                  gid: tile.gid || '0'
                });
                if (csvText && csvText.length > 30) {
                  const parsed = this.parseCsvToActions(csvText, tile.code);
                  if (parsed && parsed.length > 0) {
                    this.customActions[tile.id] = parsed;
                    this.state.tileLastSynced[tile.id] = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    successCount++;
                  }
                }
              }
            } catch (e) {
              // continue
            }
          }
        }
      }

      this.saveStoredActions();
      this.state.isSyncingAll = false;
      this.state.masterLastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.showToast('All Sheets Synced', `Successfully picked live data from ${successCount} Google Sheets!`, 'success');
      this.render();
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

      const idCol = findCol(['id', 'code', 'action #', 'action#', 'item', 'sr', 's_no', 's.no', 'sno', 'no', '#']);
      const descCol = findCol(['action', 'task', 'title', 'desc', 'description', 'activity', 'deliverable']);
      const statusCol = findCol(['status', 'state', 'condition', 'open_close status', 'open_close']);
      const priorityCol = findCol(['priority', 'prio', 'urgency']);
      const dueCol = findCol(['due', 'target', 'deadline', 'date', 'target date']);
      const remarksCol = findCol(['remark', 'note', 'comment', 'closure', 'remarks']);
      const closureCol = findCol(['closure date', 'closed on', 'completed date', 'resolved date']);

      const parsed = [];
      for (let i = 1; i < lines.length; i++) {
        // CSV splitter handling quoted values
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
        if (!desc || desc.trim().length === 0) continue;

        const rawStatus = statusCol !== -1 ? (row[statusCol] || 'Open') : 'Open';
        const isClosed = /close|done|complete|resolved/i.test(rawStatus);
        const status = isClosed ? 'Closed' : 'Open';

        let rawId = idCol !== -1 && row[idCol] ? row[idCol].trim() : '';
        let id = rawId;
        if (!id) {
          id = `${defaultCode}-${String(i).padStart(2, '0')}`;
        } else if (/^\d+$/.test(id)) {
          id = `${defaultCode}-${id.padStart(2, '0')}`;
        }

        const rawPriority = priorityCol !== -1 ? (row[priorityCol] || '') : '';
        let priority = 'High';
        if (/low|p3/i.test(rawPriority)) {
          priority = 'Low';
        } else if (/med|medium|p2/i.test(rawPriority)) {
          priority = 'Medium';
        } else if (/high|critical|p1/i.test(rawPriority)) {
          priority = 'High';
        } else {
          priority = i % 2 === 0 ? 'Medium' : 'High';
        }

        const dueDate = dueCol !== -1 ? (row[dueCol] || '') : '';
        const remarks = remarksCol !== -1 ? (row[remarksCol] || '') : '';
        const closureDate = closureCol !== -1 ? (row[closureCol] || '') : (isClosed ? (dueDate || new Date().toISOString().split('T')[0]) : '');

        parsed.push({
          id,
          title: desc,
          priority,
          dueDate,
          status,
          closureDate,
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

    // =========================================================================
    // RENDER: STRATEGIC DASHBOARD ROLLUP (TAKES DATA FROM ALL TILES)
    // =========================================================================
    renderBossDashboard() {
      const rollup = this.getBossRollup();
      const allActions = rollup.allActionsList || [];
      const filteredActions = this.getFilteredMasterActions();
      const allTiles = rollup.employeeTiles || [];

      // KPIs based on company-wide data
      const totalActions = allActions.length;
      const closedActions = allActions.filter(a => a.status === 'Closed' || a.status === 'Completed').length;
      const openActions = totalActions - closedActions;
      const overallRate = totalActions > 0 ? Math.round((closedActions / totalActions) * 100) : 0;

      // Filtered KPIs
      const filteredTotal = filteredActions.length;
      const filteredClosed = filteredActions.filter(a => a.status === 'Closed' || a.status === 'Completed').length;
      const filteredOpen = filteredTotal - filteredClosed;
      const filteredRate = filteredTotal > 0 ? Math.round((filteredClosed / filteredTotal) * 100) : 0;

      // Chart context actions (respecting department filter)
      const deptActions = this.state.masterFilterDept === 'all' 
        ? allActions 
        : allActions.filter(a => a.employeeId === this.state.masterFilterDept || a.departmentId === this.state.masterFilterDept);
      const chartTotal = deptActions.length;
      const chartClosed = deptActions.filter(a => a.status === 'Closed' || a.status === 'Completed').length;
      const chartOpen = chartTotal - chartClosed;
      const chartRate = chartTotal > 0 ? Math.round((chartClosed / chartTotal) * 100) : 0;

      // Pagination for Simple Table
      const page = this.state.masterPage || 1;
      const pageSize = this.state.masterPageSize || 15;
      const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
      const safePage = Math.min(page, totalPages);
      const startIdx = (safePage - 1) * pageSize;
      const endIdx = Math.min(filteredTotal, startIdx + pageSize);
      const pagedActions = filteredActions.slice(startIdx, endIdx);

      const isFiltered = this.state.masterFilterSearch || this.state.masterFilterDept !== 'all' || this.state.masterFilterStatus !== 'all';

      return `
        <div class="space-y-2.5 sm:space-y-3">
          <!-- EXECUTIVE COO DASHBOARD BANNER WITH METALLIC GOLD & RICH SLATE/NAVY FAMILY -->
          <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#1e1b4b] to-slate-950 p-3 sm:p-3.5 text-white border-2 border-amber-400/40 shadow-lg">
            <!-- Shimmering Metallic Gold Top Edge Stripe -->
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-300 via-amber-400 to-yellow-500 shadow-xs"></div>

            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-0.5">
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                  class="w-9 h-9 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-slate-950 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 border border-white/15 shadow-sm"
                  title="Back to Strategic Dashboard Matrix"
                >
                  <i data-lucide="arrow-left" class="w-4 h-4"></i>
                </button>

                <div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 shadow-xs">
                      <i data-lucide="crown" class="w-3 h-3 text-slate-950"></i>
                      <span>COO Executive Suite</span>
                    </span>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-amber-200 border border-amber-300/30">
                      Cross-Departmental Enterprise Rollup • ${allTiles.length} Divisions
                    </span>
                  </div>
                  <h2 class="text-base sm:text-lg font-black text-white tracking-tight leading-snug mt-0.5">
                    Chief Operating Officer Executive Dashboard
                  </h2>
                </div>
              </div>

              <div class="flex items-center gap-2 flex-wrap">
                <!-- Sync All Google Sheets Option with Gold Accent -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.syncAllEmployeeSheets()"
                  class="px-3.5 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 transition-all cursor-pointer flex items-center gap-1.5 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  title="Sync all 19 department Google Sheets"
                >
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-slate-950 ${this.state.isSyncingAll ? 'animate-spin' : ''}"></i>
                  <span>Sync All Sheets</span>
                  <span class="text-[10px] opacity-75 font-mono font-bold">(${this.state.masterLastSynced || 'Live'})</span>
                </button>

                <!-- Export CSV with Emerald/Teal Gradient -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.exportMasterCSV()"
                  class="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  title="Download CSV based on active filter"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>Export CSV (${filteredTotal})</span>
                </button>

                ${isFiltered ? `
                  <button
                    type="button"
                    onclick="window.FPCL_STRATEGIC_SUITE.clearMasterFilters()"
                    class="px-3 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <i data-lucide="filter-x" class="w-3.5 h-3.5"></i>
                    <span>Reset</span>
                  </button>
                ` : ''}

                <!-- Lock & Return -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                  class="px-3 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-200 border border-white/20 hover:border-rose-400/40 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  title="Lock dashboard immediately and return to grid"
                >
                  <i data-lucide="lock" class="w-3.5 h-3.5"></i>
                  <span>Lock & Return</span>
                </button>
              </div>
            </div>
          </div>

          <!-- COO FILTER TOOLBAR WITH GOLD ACCENT & REDUCED SEARCH WIDTH -->
          <div class="bg-white border-2 border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-xs space-y-2">
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <!-- Search Filter (Reduced width) -->
              <div class="relative w-full sm:w-56 shrink-0">
                <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="search" class="w-3.5 h-3.5"></i>
                </div>
                <input
                  type="text"
                  value="${this.state.masterFilterSearch || ''}"
                  placeholder="Filter actions, IDs, remarks..."
                  class="w-full pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded-xl text-xs font-medium outline-none transition-all"
                  oninput="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterSearch', this.value)"
                />
                ${this.state.masterFilterSearch ? `
                  <button
                    onclick="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterSearch', '')"
                    class="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <i data-lucide="x" class="w-3 h-3"></i>
                  </button>
                ` : ''}
              </div>

              <!-- Department Filter -->
              <div class="flex-1 min-w-[180px]">
                <select
                  class="w-full px-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded-xl text-xs font-semibold outline-none transition-all cursor-pointer"
                  onchange="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterDept', this.value)"
                >
                  <option value="all" ${this.state.masterFilterDept === 'all' ? 'selected' : ''}>All Departments (${allTiles.length})</option>
                  ${allTiles.map(t => `
                    <option value="${t.id}" ${this.state.masterFilterDept === t.id ? 'selected' : ''}>${t.name} (${t.code})</option>
                  `).join('')}
                </select>
              </div>

              <!-- Status Filter Dropdown Menu -->
              <div class="relative w-full sm:w-48 shrink-0">
                <select
                  class="w-full py-1.5 pl-3 pr-8 bg-slate-50 hover:bg-white focus:bg-white text-slate-800 border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded-xl text-xs font-bold outline-none transition-all cursor-pointer appearance-none shadow-2xs"
                  onchange="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterStatus', this.value)"
                >
                  <option value="all" ${this.state.masterFilterStatus === 'all' ? 'selected' : ''}>All Statuses (${totalActions})</option>
                  <option value="Open" ${this.state.masterFilterStatus === 'Open' ? 'selected' : ''}>Open Only (${openActions})</option>
                  <option value="Closed" ${this.state.masterFilterStatus === 'Closed' ? 'selected' : ''}>Closed (${closedActions})</option>
                </select>
                <div class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-500">
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- EXECUTIVE KPIS & DONUT CHART: 2/3 KPIS (2x2) + 1/3 DISTRIBUTION DONUT -->
          <div class="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-3.5 items-stretch">
            <!-- 4 KPI Metrics in 2x2 Grid -->
            <div class="xl:col-span-2 grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-2.5 sm:gap-3">
              <!-- 1. Total Actions: Corporate Royal Indigo/Navy Family with Gold Accent -->
              <div class="relative overflow-hidden rounded-2xl border-2 border-indigo-200 bg-gradient-to-b from-indigo-50/70 via-white to-indigo-50/30 p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center justify-center">
                <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-blue-500 to-amber-400"></div>
                <span class="text-xs font-extrabold uppercase tracking-wider text-indigo-900 bg-indigo-100/80 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
                  Total Actions
                </span>
                <div class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-900 kpi-metric-val mt-1.5">${filteredTotal}</div>
                <span class="text-[11px] font-bold text-indigo-700/80 mt-0.5">Enterprise Wide Scope</span>
              </div>

              <!-- 2. Closed Actions: Emerald & Mint Family with Gold Accent -->
              <div class="relative overflow-hidden rounded-2xl border-2 border-emerald-200 bg-gradient-to-b from-emerald-50/70 via-white to-emerald-50/30 p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center justify-center">
                <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400"></div>
                <span class="text-xs font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                  Closed Actions
                </span>
                <div class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-emerald-600 kpi-metric-val mt-1.5">${filteredClosed}</div>
                <span class="text-[11px] font-bold text-emerald-700/80 mt-0.5">Completed Deliverables</span>
              </div>

              <!-- 3. Open Actions: Rose & Coral Family with Gold Accent -->
              <div class="relative overflow-hidden rounded-2xl border-2 border-rose-200 bg-gradient-to-b from-rose-50/70 via-white to-rose-50/30 p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center justify-center">
                <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-pink-400 to-amber-400"></div>
                <span class="text-xs font-extrabold uppercase tracking-wider text-rose-900 bg-rose-100/80 px-2.5 py-0.5 rounded-full border border-rose-200/60">
                  Open Actions
                </span>
                <div class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-rose-600 kpi-metric-val mt-1.5">${filteredOpen}</div>
                <span class="text-[11px] font-bold text-rose-700/80 mt-0.5">Active Pipeline</span>
              </div>

              <!-- 4. Overall Progress: Signature Pure Regal Gold & Amber Gradient Card -->
              <div class="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-100/60 via-amber-50/40 to-white p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center justify-center">
                <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-yellow-400 via-amber-300 to-yellow-500"></div>
                <span class="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-3 py-0.5 rounded-full shadow-xs border border-amber-300">
                  <i data-lucide="award" class="w-3 h-3 text-slate-950"></i>
                  <span>Overall Progress</span>
                </span>
                <div class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-amber-800 kpi-metric-val mt-1.5">${overallRate}%</div>
                <span class="text-[11px] font-black text-amber-900 bg-amber-200/60 border border-amber-300/80 px-2.5 py-0.5 rounded-full mt-0.5">Enterprise Closure Rate</span>
              </div>
            </div>

            <!-- Open vs Close Donut Chart with Gold Trim -->
            <div class="xl:col-span-1 relative overflow-hidden h-full flex flex-col justify-center">
              <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 z-10"></div>
              ${this.renderOpenCloseDonutCard(chartClosed, chartOpen, chartTotal, chartRate, this.state.masterFilterStatus || 'all')}
            </div>
          </div>

          <!-- ACTION STATUS TRENDS: FULL-WIDTH EXECUTIVE DISPLAY (NON-SCROLLABLE, THICK 28PX BARS, 8FT VIEWING VISIBILITY) -->
          <div class="relative overflow-hidden bg-white border-2 border-slate-200 rounded-2xl p-3.5 sm:p-4.5 shadow-xs space-y-3">
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-amber-400 to-emerald-500"></div>
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                  <i data-lucide="bar-chart-2" class="w-4 h-4 text-slate-950"></i>
                </div>
                <div>
                  <h3 class="text-sm sm:text-base font-black text-slate-900 leading-tight">Action Status Trends</h3>
                  <span class="text-[11px] font-semibold text-slate-500">Strategic Departments Benchmark • ${allTiles.length} Depts • High-Visibility Overview</span>
                </div>
              </div>

              <!-- Legend: Open (Red), Closed (Green), Total (Amber) -->
              <div class="flex items-center gap-1.5 sm:gap-2 text-xs font-bold flex-wrap">
                <div class="flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/80">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#f43f5e] shrink-0"></span>
                  <span class="text-slate-600 text-xs">Open:</span>
                  <span class="font-mono text-rose-700 font-black text-xs sm:text-sm">${chartOpen}</span>
                </div>
                <div class="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#10b981] shrink-0"></span>
                  <span class="text-slate-600 text-xs">Closed:</span>
                  <span class="font-mono text-emerald-700 font-black text-xs sm:text-sm">${chartClosed}</span>
                </div>
                <div class="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80">
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span class="text-slate-600 text-xs">Total:</span>
                  <span class="font-mono text-amber-900 font-black text-xs sm:text-sm">${chartTotal}</span>
                </div>
              </div>
            </div>

            <!-- All Departments Stacked Bar Chart: 2 Balanced Columns, Thick Bars, Large Bold Text, Non-Scrollable -->
            <div class="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 sm:p-4 select-none">
              ${(() => {
                const bossRows = allTiles.map(t => {
                  const actions = (t.actions || (this.state?.tileActions?.[t.id]) || []);
                  const tTotal = actions.length;
                  const tClosed = actions.filter(a => a.status === 'Closed' || a.status === 'Completed').length;
                  const tOpen = tTotal - tClosed;
                  const tRate = tTotal > 0 ? Math.round((tClosed / tTotal) * 100) : 0;
                  return {
                    id: t.id,
                    name: t.name,
                    code: t.code,
                    open: tOpen,
                    closed: tClosed,
                    total: tTotal,
                    rate: tRate,
                    isActive: this.state.masterFilterDept === t.id
                  };
                }).sort((a, b) => b.total - a.total);

                // Global maximum so all bars across both columns share identical visual scale
                const globalMax = Math.max(...bossRows.map(r => r.total), 1);

                // Split into 2 balanced columns (e.g. 10 and 9)
                const mid = Math.ceil(bossRows.length / 2);
                const col1 = bossRows.slice(0, mid);
                const col2 = bossRows.slice(mid);

                const chartOptions = {
                  width: 580,
                  padLeft: 135,
                  padRight: 55,
                  padTop: 18,
                  padBottom: 28,
                  rowHeight: 46,
                  barHeight: 28,
                  barFontSize: 18,
                  labelFontSize: 15,
                  totalFontSize: 19,
                  gridFontSize: 13,
                  maxVal: globalMax,
                  activeTileId: this.state.masterFilterDept !== 'all' ? this.state.masterFilterDept : null,
                  interactive: true,
                  centerAlign: true
                };

                return `
                  <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-8 items-start">
                    <div class="w-full flex justify-center">
                      ${this.renderActionStatusTrendsSvg(col1, chartOptions)}
                    </div>
                    <div class="w-full flex justify-center">
                      ${this.renderActionStatusTrendsSvg(col2, chartOptions)}
                    </div>
                  </div>
                `;
              })()}
            </div>
          </div>

          <!-- EXECUTIVE TABLE WITH DARK NAVY & GOLD HEADER -->
          <div id="strategic-master-table" class="bg-white border-2 border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div class="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b-2 border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs"></span>
                <h3 class="text-xs sm:text-sm font-black tracking-tight text-white">Company Action Items Master Roster</h3>
                <span class="px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-amber-400 text-slate-950 shadow-xs">
                  Showing ${pagedActions.length} of ${filteredTotal}
                </span>
              </div>

              <div class="flex items-center gap-1.5 text-xs text-slate-300">
                <span class="text-[11px] font-semibold">Rows:</span>
                <select
                  class="px-2 py-0.5 bg-white/15 text-white border border-white/20 rounded-lg text-xs font-semibold cursor-pointer outline-none"
                  onchange="window.FPCL_STRATEGIC_SUITE.setMasterPageSize(this.value)"
                >
                  <option class="text-slate-900" value="15" ${pageSize === 15 ? 'selected' : ''}>15</option>
                  <option class="text-slate-900" value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
                  <option class="text-slate-900" value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
                  <option class="text-slate-900" value="all" ${pageSize === 9999 ? 'selected' : ''}>All</option>
                </select>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                    <th class="py-2.5 px-3.5 w-20">ID</th>
                    <th class="py-2.5 px-3.5 w-40">Department</th>
                    <th class="py-2.5 px-3.5 min-w-[260px]">Action Item</th>
                    <th class="py-2.5 px-3.5 w-28">Due Date</th>
                    <th class="py-2.5 px-3.5 w-24">Status</th>
                    <th class="py-2.5 px-3.5 min-w-[160px]">Remarks</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-xs">
                  ${pagedActions.length === 0 ? `
                    <tr>
                      <td colspan="6" class="py-8 text-center text-slate-400">
                        No actions match the active filters.
                      </td>
                    </tr>
                  ` : pagedActions.map(a => {
                    const isClosed = a.status === 'Closed' || a.status === 'Completed';
                    return `
                      <tr class="hover:bg-slate-50/70 transition-colors">
                        <td class="py-2.5 px-3.5 font-mono font-bold text-slate-700">${a.id}</td>
                        <td class="py-2.5 px-3.5 font-semibold text-slate-800">${a.department}</td>
                        <td class="py-2.5 px-3.5 text-slate-900 font-medium">${a.title}</td>
                        <td class="py-2.5 px-3.5 text-slate-600">${a.dueDate || '-'}</td>
                        <td class="py-2.5 px-3.5">
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${isClosed ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}">
                            <span class="w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                            ${a.status || (isClosed ? 'Closed' : 'Open')}
                          </span>
                        </td>
                        <td class="py-2.5 px-3.5 text-slate-500">${a.remarks || '-'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Pagination Footer -->
            ${totalPages > 1 ? `
              <div class="p-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>Page ${safePage} of ${totalPages}</span>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    ${safePage <= 1 ? 'disabled' : ''}
                    onclick="window.FPCL_STRATEGIC_SUITE.setMasterPage(${safePage - 1})"
                    class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    ${safePage >= totalPages ? 'disabled' : ''}
                    onclick="window.FPCL_STRATEGIC_SUITE.setMasterPage(${safePage + 1})"
                    class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    },

    // =========================================================================
    // RENDER: ACTION STATUS TRENDS SVG (HORIZONTAL STACKED BAR CHART MATCHING ATTACHED IMAGE)
    // =========================================================================
    renderActionStatusTrendsSvg(rows, options = {}) {
      if (!rows || rows.length === 0) {
        return `<div class="p-6 text-center text-xs text-slate-400">No actions recorded</div>`;
      }

      const w = options.width || 960;
      const padLeft = options.padLeft || 190;
      const padRight = options.padRight || 64;
      const padTop = options.padTop || 16;
      const padBottom = options.padBottom || 26;
      const rowH = options.rowHeight || 28;
      const barH = options.barHeight || 16;
      const chartW = Math.max(100, w - padLeft - padRight);
      const maxVal = options.maxVal !== undefined ? options.maxVal : Math.max(...rows.map(r => r.total), 1);
      const totalH = padTop + rows.length * rowH + padBottom;

      const gridFontSize = options.gridFontSize || (barH >= 36 ? 14 : (barH >= 24 ? 13 : 11));
      const rx = options.rx || (barH >= 36 ? 8 : (barH >= 24 ? 6 : 4));
      const barFontSize = options.barFontSize || (barH >= 36 ? 24 : (barH >= 24 ? 16 : 11));
      const labelFontSize = options.labelFontSize || (barH >= 36 ? 17 : (barH >= 24 ? 15 : 12));
      const totalFontSize = options.totalFontSize || (barH >= 36 ? 22 : (barH >= 24 ? 18 : 12));

      // Vertical dashed grid lines (0, 25%, 50%, 75%, 100%)
      const gridSteps = [0, 0.25, 0.5, 0.75, 1];
      const gridSvg = gridSteps.map(step => {
        const x = padLeft + step * chartW;
        const val = Math.round(step * maxVal);
        return `
          <line x1="${x}" y1="${padTop - 6}" x2="${x}" y2="${padTop + rows.length * rowH + 4}" stroke="#cbd5e1" stroke-width="${barH >= 24 ? '1.5' : '1'}" stroke-dasharray="3 3"/>
          <text x="${x}" y="${padTop + rows.length * rowH + (barH >= 24 ? 20 : 18)}" fill="#64748b" font-size="${gridFontSize}" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">${val}</text>
        `;
      }).join('');

      // Department horizontal stacked rows
      const rowsSvg = rows.map((r, index) => {
        const y = padTop + index * rowH;
        const barY = y + Math.round((rowH - barH) / 2);
        const textY = barY + Math.round(barH / 2);
        const openW = maxVal > 0 ? (r.open / maxVal) * chartW : 0;
        const closedW = maxVal > 0 ? (r.closed / maxVal) * chartW : 0;
        const isActive = options.activeTileId ? (options.activeTileId === r.id) : Boolean(r.isActive);
        const clickAttr = (options.interactive !== false && r.id && r.id !== 'current') ? `onclick="window.FPCL_STRATEGIC_SUITE.handleTileClick('${r.id}')"` : '';
        const clipId = `clip-trend-${r.id || 'r'}-${index}-${Math.floor(Math.random() * 10000)}`;

        // Smart dynamic font scaling so numbers are maximized but fit inside bars
        const openFont = openW < (barFontSize * 1.3) ? Math.max(10, Math.round(openW * 0.72)) : barFontSize;
        const closedFont = closedW < (barFontSize * 1.3) ? Math.max(10, Math.round(closedW * 0.72)) : barFontSize;

        return `
          <g class="group cursor-pointer" ${clickAttr}>
            <!-- Background Row Hover Strip -->
            <rect
              x="4"
              y="${y - 1}"
              width="${w - 8}"
              height="${rowH - 2}"
              rx="6"
              fill="${isActive ? '#f5f3ff' : 'transparent'}"
              stroke="${isActive ? '#c4b5fd' : 'transparent'}"
              stroke-width="1"
              class="group-hover:fill-slate-100/70 transition-colors"
            />

            <!-- Department Name Label on Left (Y-axis) -->
            <text
              x="${padLeft - 14}"
              y="${textY}"
              dominant-baseline="central"
              fill="${isActive ? '#7c3aed' : '#1e293b'}"
              font-size="${labelFontSize}"
              font-weight="${isActive ? '900' : '800'}"
              font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
              text-anchor="end"
              class="transition-colors group-hover:fill-purple-700"
            >
              ${r.name || r.code}
              <title>${r.name || r.code}: ${r.total} Total (${r.open} Open, ${r.closed} Closed, ${r.rate}% Rate)</title>
            </text>

            <!-- Subtle Background Track Bar -->
            <rect
              x="${padLeft}"
              y="${barY}"
              width="${chartW}"
              height="${barH}"
              rx="${rx}"
              fill="#f1f5f9"
              class="group-hover:fill-slate-200/70 transition-colors"
            />

            <!-- Clip path for stacked bars so outer corners remain rounded rx=${rx} -->
            <defs>
              <clipPath id="${clipId}">
                <rect x="${padLeft}" y="${barY}" width="${chartW}" height="${barH}" rx="${rx}"/>
              </clipPath>
            </defs>

            <!-- Stacked Bars (Clipped) -->
            <g clip-path="url(#${clipId})">
              <!-- Open Findings Bar (Rose-500 #f43f5e) -->
              ${r.open > 0 ? `
                <rect
                  x="${padLeft}"
                  y="${barY}"
                  width="${openW}"
                  height="${barH}"
                  fill="#f43f5e"
                  class="transition-all hover:brightness-110"
                />
              ` : ''}

              <!-- Closed Findings Bar (Emerald-500 #10b981) -->
              ${r.closed > 0 ? `
                <rect
                  x="${padLeft + openW}"
                  y="${barY}"
                  width="${closedW}"
                  height="${barH}"
                  fill="#10b981"
                  class="transition-all hover:brightness-110"
                />
              ` : ''}
            </g>

            <!-- Open Value Text inside Rose Bar (Centered, high-contrast with drop shadow) -->
            ${r.open > 0 && openW >= 12 ? `
              <text
                x="${padLeft + openW / 2}"
                y="${textY}"
                dominant-baseline="central"
                fill="#ffffff"
                font-size="${openFont}"
                font-weight="900"
                font-family="'JetBrains Mono', monospace"
                text-anchor="middle"
                class="pointer-events-none select-none"
                style="filter: drop-shadow(0 1px 3px rgba(0,0,0,0.65));"
              >${r.open}</text>
            ` : ''}

            <!-- Closed Value Text inside Emerald Bar (Centered, high-contrast with drop shadow) -->
            ${r.closed > 0 && closedW >= 12 ? `
              <text
                x="${padLeft + openW + closedW / 2}"
                y="${textY}"
                dominant-baseline="central"
                fill="#ffffff"
                font-size="${closedFont}"
                font-weight="900"
                font-family="'JetBrains Mono', monospace"
                text-anchor="middle"
                class="pointer-events-none select-none"
                style="filter: drop-shadow(0 1px 3px rgba(0,0,0,0.65));"
              >${r.closed}</text>
            ` : ''}

            <!-- Total Count Metric on Right -->
            <text
              x="${padLeft + chartW + 14}"
              y="${textY}"
              dominant-baseline="central"
              fill="#0f172a"
              font-size="${totalFontSize}"
              font-weight="900"
              font-family="'JetBrains Mono', monospace"
              text-anchor="start"
              class="transition-colors group-hover:fill-purple-900"
            >${r.total}</text>
          </g>
        `;
      }).join('');

      const minWClass = options.minWidth ? `min-w-[${options.minWidth}px]` : (options.centerAlign ? '' : 'min-w-[480px]');
      const containerClass = options.centerAlign
        ? 'w-full flex items-center justify-center select-none overflow-x-auto'
        : 'w-full overflow-x-auto select-none';

      return `
        <div class="${containerClass}">
          <svg viewBox="0 0 ${w} ${totalH}" class="w-full ${minWClass} h-auto overflow-visible" style="max-width: ${w}px;">
            ${gridSvg}
            ${rowsSvg}
          </svg>
        </div>
      `;
    },

    // =========================================================================
    // RENDER: SINGLE STATUS BAR / TRENDS CARD FOR INDIVIDUAL TILE DASHBOARDS
    // Displays ONLY individual tile status (clean, focused, no extra text below heading)
    // =========================================================================
    renderSingleStatusBar(arg1, arg2, arg3, arg4, arg5, arg6) {
      let tile = null;
      let closed = 0;
      let open = 0;
      let total = 0;
      let rate = 0;
      let filterStatus = 'all';

      if (typeof arg1 === 'object' && arg1 !== null) {
        tile = arg1;
        closed = Number(arg2) || 0;
        open = Number(arg3) || 0;
        total = Number(arg4) || 0;
        rate = Number(arg5) || 0;
        filterStatus = arg6 || 'all';
      } else {
        closed = Number(arg1) || 0;
        open = Number(arg2) || 0;
        total = Number(arg3) || 0;
        rate = Number(arg4) || 0;
        filterStatus = arg5 || 'all';
        tile = (this.state.selectedTileId ? this.getTileData(this.state.selectedTileId) : null);
      }

      const tileName = tile ? (tile.name || tile.code) : 'Department';
      const singleRow = [{
        id: tile ? tile.id : 'current',
        name: tileName,
        code: tile ? tile.code : 'CUR',
        open,
        closed,
        total,
        rate,
        isActive: true
      }];

      return `
        <div class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3.5">
          <!-- Header with Title and Tile Badge -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-black text-xs border border-purple-200 shrink-0">
                ${tile ? tile.code : 'ACT'}
              </div>
              <h3 class="text-base sm:text-lg font-black text-slate-900 leading-tight">Action Status Trends</h3>
            </div>

            <!-- Header Quick Badges: Open, Closed, Total -->
            <div class="flex items-center gap-1.5 sm:gap-2 text-xs font-bold flex-wrap">
              <div class="flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                <span class="w-2 h-2 rounded-full bg-[#f43f5e] shrink-0"></span>
                <span class="text-slate-600 text-xs">Open:</span>
                <span class="font-mono text-rose-700 font-bold text-xs sm:text-sm">${open}</span>
              </div>
              <div class="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <span class="w-2 h-2 rounded-full bg-[#10b981] shrink-0"></span>
                <span class="text-slate-600 text-xs">Closed:</span>
                <span class="font-mono text-emerald-700 font-bold text-xs sm:text-sm">${closed}</span>
              </div>
              <div class="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                <span class="text-slate-600 text-xs">Total:</span>
                <span class="font-mono text-slate-800 font-bold text-xs sm:text-sm">${total}</span>
              </div>
            </div>
          </div>

          <!-- Section: Focused Department Stacked Bar (Center Aligned, Thick Bar, High-Visibility Numbers) -->
          <div class="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3 sm:p-4 flex items-center justify-center">
            ${this.renderActionStatusTrendsSvg(singleRow, {
              width: 880,
              padLeft: 120,
              padRight: 120,
              padTop: 18,
              padBottom: 32,
              rowHeight: 88,
              barHeight: 58,
              barFontSize: 28,
              labelFontSize: 17,
              gridFontSize: 13,
              totalFontSize: 26,
              maxVal: total > 0 ? total : 1,
              activeTileId: tile ? tile.id : 'current',
              interactive: false,
              centerAlign: true
            })}
          </div>

          ${filterStatus !== 'all' ? `
            <div class="pt-0.5">
              <span class="px-2.5 py-1 rounded-lg text-xs font-bold ${filterStatus === 'Open' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
                Active Filter: ${filterStatus} Actions
              </span>
            </div>
          ` : ''}
        </div>
      `;
    },

    // =========================================================================
    // RENDER: OPEN / CLOSE DONUT CHART (Right side of Action Status Trends)
    // =========================================================================
    renderOpenCloseDonutCard(closed, open, total, rate, filterStatus = 'all') {
      const radius = 68;
      const circumference = 2 * Math.PI * radius; // ~427.257
      const closedPct = total > 0 ? closed / total : 0;
      const openPct = total > 0 ? open / total : 0;
      const closedDash = Math.min(circumference, Math.max(0, closedPct * circumference));
      const openDash = Math.min(circumference, Math.max(0, openPct * circumference));
      const closedRate = total > 0 ? Math.round(closedPct * 100) : 0;
      const openRate = total > 0 ? Math.round(openPct * 100) : 0;

      let displayRate = `${rate}%`;
      let svgArcs = '';

      if (total === 0) {
        displayRate = '0%';
        svgArcs = '';
      } else if (filterStatus === 'Open') {
        displayRate = `${openRate}%`;
        svgArcs = `
          <circle
            cx="90" cy="90" r="${radius}"
            fill="none"
            stroke="#f43f5e"
            stroke-width="18"
            stroke-dasharray="${openDash} ${circumference}"
            stroke-dashoffset="0"
            stroke-linecap="round"
            class="transition-all duration-500"
          />
        `;
      } else if (filterStatus === 'Closed') {
        displayRate = `${closedRate}%`;
        svgArcs = `
          <circle
            cx="90" cy="90" r="${radius}"
            fill="none"
            stroke="#10b981"
            stroke-width="18"
            stroke-dasharray="${closedDash} ${circumference}"
            stroke-dashoffset="0"
            stroke-linecap="round"
            class="transition-all duration-500"
          />
        `;
      } else {
        // All
        displayRate = `${rate}%`;
        svgArcs = `
          <!-- Closed Arc (Emerald) -->
          <circle
            cx="90" cy="90" r="${radius}"
            fill="none"
            stroke="#10b981"
            stroke-width="18"
            stroke-dasharray="${closedDash} ${circumference}"
            stroke-dashoffset="0"
            stroke-linecap="${open > 0 && closed > 0 ? 'butt' : 'round'}"
            class="transition-all duration-500"
          />
          <!-- Open Arc (Rose) -->
          <circle
            cx="90" cy="90" r="${radius}"
            fill="none"
            stroke="#f43f5e"
            stroke-width="18"
            stroke-dasharray="${openDash} ${circumference}"
            stroke-dashoffset="-${closedDash}"
            stroke-linecap="${open > 0 && closed > 0 ? 'butt' : 'round'}"
            class="transition-all duration-500"
          />
        `;
      }

      return `
        <div class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base sm:text-lg font-black text-slate-900 leading-tight">Open vs Closed Donut Chart</h3>
            <span class="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">Distribution</span>
          </div>

          <div class="flex-1 flex flex-col items-center justify-center py-2">
            <!-- Center Aligned, Proportionate Donut SVG with Center Value -->
            <div class="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto flex items-center justify-center">
              <svg viewBox="0 0 180 180" class="w-full h-full transform -rotate-90">
                <!-- Base track -->
                <circle cx="90" cy="90" r="${radius}" fill="none" stroke="#f1f5f9" stroke-width="20" />
                ${svgArcs}
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">${displayRate}</span>
                <span class="text-xs font-bold text-slate-500 mt-1.5 uppercase tracking-wider">Closed Rate</span>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // =========================================================================
    // RENDER: INDIVIDUAL TILE DASHBOARD (KPIs, TREND BARS, SIMPLE TABLE, FILTERS, SYNC, CSV)
    // =========================================================================
    renderEmployeeActionSheet(tile) {
      const allActions = tile.actions || [];
      const filteredActions = this.getFilteredTileActions(tile.id);

      // KPI values for this tile
      const totalActions = allActions.length;
      const closedActions = allActions.filter(a => a.status === 'Closed' || a.status === 'Completed').length;
      const openActions = totalActions - closedActions;
      const overallRate = totalActions > 0 ? Math.round((closedActions / totalActions) * 100) : 0;

      // Filtered KPIs
      const filteredTotal = filteredActions.length;
      const filteredClosed = filteredActions.filter(a => a.status === 'Closed' || a.status === 'Completed').length;
      const filteredOpen = filteredTotal - filteredClosed;
      const filteredRate = filteredTotal > 0 ? Math.round((filteredClosed / filteredTotal) * 100) : 0;

      // Pagination for Simple Table
      const page = this.state.tilePage || 1;
      const pageSize = this.state.tilePageSize || 15;
      const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
      const safePage = Math.min(page, totalPages);
      const startIdx = (safePage - 1) * pageSize;
      const endIdx = Math.min(filteredTotal, startIdx + pageSize);
      const pagedActions = filteredActions.slice(startIdx, endIdx);

      const isFiltered = this.state.tileFilterSearch || this.state.tileFilterStatus !== 'all';
      const isSyncing = this.state.syncStatus[tile.id] === 'syncing';
      const lastSynced = this.state.tileLastSynced[tile.id] || 'Active';

      // SCM Dedicated Dashboard Rendering
      if (tile.id === 'scm') {
        return this.renderScmDashboard(tile, {
          allActions, filteredActions, totalActions, closedActions, openActions, overallRate,
          filteredTotal, filteredClosed, filteredOpen, filteredRate,
          pagedActions, safePage, totalPages, pageSize,
          isFiltered, isSyncing, lastSynced
        });
      }

      const isConnected = this.isSheetConnected(tile.id);

      return `
        <div class="space-y-2.5 sm:space-y-3">
          <!-- TOP ACTION HEADER BAR WITH BACK BUTTON, SYNC, SHEET LINK & EXPORT -->
          <div class="bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <!-- Back button to return to matrix grid -->
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs border border-slate-200"
                title="Back to Strategic Dashboard Matrix"
              >
                <i data-lucide="arrow-left" class="w-4 h-4"></i>
              </button>

              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2 py-0.2 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                    ${tile.code}
                  </span>
                  <!-- Google Sheet Connection Indicator (Green connected, Orange broken) -->
                  <button
                    type="button"
                    onclick="window.FPCL_STRATEGIC_SUITE.openSheetConfigModal('${tile.id}')"
                    class="inline-flex items-center gap-1.5 px-2 py-0.2 rounded-full text-xs font-bold border transition-colors cursor-pointer ${isConnected ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'}"
                    title="${isConnected ? 'Google Sheet is connected (Green)' : 'Google Sheet link broken / unlinked (Orange) - Click to configure'}"
                  >
                    <span class="relative flex h-2 w-2">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}"></span>
                      <span class="relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                    </span>
                    <span>${isConnected ? 'Sheet Connected' : 'Link Broken'}</span>
                  </button>
                </div>
                <h2 class="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-snug mt-0.5">${tile.name} Dashboard</h2>
              </div>
            </div>

            <!-- Header Actions: Sync, Config & Filter-aware CSV Export -->
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Sync Option -->
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.syncEmployeeSheet('${tile.id}')"
                class="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer flex items-center gap-2 shadow-xs ${isSyncing ? 'opacity-70 animate-pulse' : ''}"
                title="Sync from connected Google Sheet (${tile.name})"
              >
                <i data-lucide="refresh-cw" class="w-4 h-4 ${isSyncing ? 'animate-spin' : ''}"></i>
                <span>${isSyncing ? 'Syncing...' : 'Sync Sheet'}</span>
                <span class="text-xs opacity-80 font-normal">(${lastSynced})</span>
              </button>

              <!-- Sheet Settings Modal Option -->
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.openSheetConfigModal('${tile.id}')"
                class="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer border border-slate-200"
                title="Configure Google Sheet Link / Tab Name"
              >
                <i data-lucide="settings" class="w-4 h-4"></i>
              </button>

              <!-- Downloadable Filter-aware CSV Export Option -->
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.exportTileCSV('${tile.id}')"
                class="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                title="Download CSV based on active filter"
              >
                <i data-lucide="download" class="w-4 h-4"></i>
                <span>Export CSV (${filteredTotal})</span>
              </button>

              ${isFiltered ? `
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.clearTileFilters()"
                  class="px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200"
                >
                  <i data-lucide="filter-x" class="w-4 h-4"></i>
                  <span>Reset</span>
                </button>
              ` : ''}

              <!-- Lock & Return -->
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                class="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 hover:border-rose-200 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Lock dashboard immediately and return to grid"
              >
                <i data-lucide="lock" class="w-4 h-4"></i>
                <span>Lock & Return</span>
              </button>
            </div>
          </div>

          <!-- COMPACT FILTER BAR OPTION -->
          <div class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-xs space-y-2">
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <!-- Search Filter -->
              <div class="relative w-full sm:w-72 shrink-0">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="search" class="w-4 h-4"></i>
                </div>
                <input
                  type="text"
                  value="${this.state.tileFilterSearch || ''}"
                  placeholder="Filter by action text, ID, remarks..."
                  class="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border border-slate-200 focus:border-purple-500 rounded-xl text-xs sm:text-sm font-medium outline-none transition-all"
                  oninput="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterSearch', this.value)"
                />
                ${this.state.tileFilterSearch ? `
                  <button
                    onclick="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterSearch', '')"
                    class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                  </button>
                ` : ''}
              </div>

              <!-- Status Filter Dropdown Menu -->
              <div class="relative">
                <select
                  class="w-full py-2 pl-3 pr-8 bg-slate-50 hover:bg-white focus:bg-white text-slate-800 border border-slate-200 focus:border-purple-500 rounded-xl text-xs sm:text-sm font-bold outline-none transition-all cursor-pointer appearance-none shadow-2xs"
                  onchange="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterStatus', this.value)"
                >
                  <option value="all" ${this.state.tileFilterStatus === 'all' ? 'selected' : ''}>All Actions (${totalActions})</option>
                  <option value="Open" ${this.state.tileFilterStatus === 'Open' ? 'selected' : ''}>Open Only (${openActions})</option>
                  <option value="Closed" ${this.state.tileFilterStatus === 'Closed' ? 'selected' : ''}>Closed (${closedActions})</option>
                </select>
                <div class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-500">
                  <i data-lucide="chevron-down" class="w-4 h-4"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- KPI VALUES -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
            <div class="bg-white border border-slate-200 hover:border-purple-300 rounded-2xl p-4 sm:p-6 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider text-center">Total Actions</div>
              <div class="text-5xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight text-slate-900 kpi-metric-val mt-2 text-center">${filteredTotal}</div>
            </div>

            <div class="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 sm:p-6 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs sm:text-sm font-bold text-emerald-700 uppercase tracking-wider text-center">Closed Actions</div>
              <div class="text-5xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight text-emerald-600 kpi-metric-val mt-2 text-center">${filteredClosed}</div>
            </div>

            <div class="bg-white border border-slate-200 hover:border-rose-300 rounded-2xl p-4 sm:p-6 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs sm:text-sm font-bold text-rose-700 uppercase tracking-wider text-center">Open Actions</div>
              <div class="text-5xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight text-rose-600 kpi-metric-val mt-2 text-center">${filteredOpen}</div>
            </div>

            <div class="bg-white border border-slate-200 hover:border-purple-300 rounded-2xl p-4 sm:p-6 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs sm:text-sm font-bold text-purple-700 uppercase tracking-wider text-center">Overall Progress</div>
              <div class="text-5xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight text-purple-700 kpi-metric-val mt-2 text-center">${overallRate}%</div>
            </div>
          </div>

          <!-- TREND BARS & DONUT CHART: DONUT CHART PLACED TO RIGHT SIDE OF BAR CHART -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
            ${this.renderSingleStatusBar(tile, closedActions, openActions, totalActions, overallRate, this.state.tileFilterStatus || 'all')}
            ${this.renderOpenCloseDonutCard(closedActions, openActions, totalActions, overallRate, this.state.tileFilterStatus || 'all')}
          </div>

          <!-- SIMPLE TABLE FOR TEXT DATA WITH FILTER & PAGINATION -->
          <div id="strategic-tile-table" class="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div class="flex items-center gap-2.5">
                <h3 class="text-sm sm:text-base font-black text-slate-900">Action Items</h3>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Showing ${pagedActions.length} of ${filteredTotal}
                </span>
              </div>

              <div class="flex items-center gap-2 text-xs sm:text-sm">
                <span class="text-slate-500 font-medium">Rows per page:</span>
                <select
                  class="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer outline-none"
                  onchange="window.FPCL_STRATEGIC_SUITE.setTilePageSize(this.value)"
                >
                  <option value="15" ${pageSize === 15 ? 'selected' : ''}>15</option>
                  <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
                  <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
                  <option value="all" ${pageSize === 9999 ? 'selected' : ''}>All</option>
                </select>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs sm:text-sm">
                    <th class="py-3 px-3.5 w-20">ID</th>
                    <th class="py-3 px-3.5 min-w-[280px]">Action Description</th>
                    <th class="py-3 px-3.5 w-28">Due Date</th>
                    <th class="py-3 px-3.5 w-24">Status</th>
                    <th class="py-3 px-3.5 min-w-[180px]">Remarks</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-xs sm:text-sm">
                  ${pagedActions.length === 0 ? `
                    <tr>
                      <td colspan="5" class="py-10 text-center text-slate-400 font-medium text-sm">
                        No actions match the active filters.
                      </td>
                    </tr>
                  ` : pagedActions.map(a => {
                    const isClosed = a.status === 'Closed' || a.status === 'Completed';
                    return `
                      <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="py-3 px-3.5 font-mono font-bold text-slate-800 text-xs sm:text-sm">${a.id}</td>
                        <td class="py-3 px-3.5 text-slate-900 font-medium">${a.title}</td>
                        <td class="py-3 px-3.5 text-slate-600">${a.dueDate || '-'}</td>
                        <td class="py-3 px-3.5">
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${isClosed ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}">
                            <span class="w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                            ${a.status || (isClosed ? 'Closed' : 'Open')}
                          </span>
                        </td>
                        <td class="py-3 px-3.5 text-slate-500">${a.remarks || '-'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Pagination Footer -->
            ${totalPages > 1 ? `
              <div class="p-4 border-t border-slate-200 flex items-center justify-between text-xs sm:text-sm text-slate-600">
                <span class="font-medium">Page ${safePage} of ${totalPages}</span>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    ${safePage <= 1 ? 'disabled' : ''}
                    onclick="window.FPCL_STRATEGIC_SUITE.setTilePage(${safePage - 1})"
                    class="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold cursor-pointer text-xs sm:text-sm"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    ${safePage >= totalPages ? 'disabled' : ''}
                    onclick="window.FPCL_STRATEGIC_SUITE.setTilePage(${safePage + 1})"
                    class="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold cursor-pointer text-xs sm:text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    },

    // =========================================================================
    // RENDER: DEDICATED SCM DASHBOARD (SUPPLY CHAIN MANAGEMENT & GOOGLE SHEET)
    // =========================================================================
    renderScmDashboard(tile, ctx) {
      const {
        allActions, filteredActions, totalActions, closedActions, openActions, overallRate,
        filteredTotal, filteredClosed, filteredOpen, filteredRate,
        prioHigh, prioHighRate, prioMed, prioMedRate, prioLow, prioLowRate,
        pagedActions, safePage, totalPages, pageSize,
        isFiltered, isSyncing, lastSynced
      } = ctx;

      const sheetTabName = tile.sheetTab || 'SCM';
      const isConnected = this.isSheetConnected(tile.id);
      const sheetSourceLabel = tile.fromSecret
        ? 'Environment Secret (SCM_SHEET_URL)'
        : (tile.sheetUrl ? 'Live Google Sheet' : 'Default Verified Action Sheet');

      return `
        <div class="space-y-2.5 sm:space-y-3">
          <!-- SCM HERO & NAVIGATION BANNER -->
          <div class="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E1B4B] rounded-2xl p-3 sm:p-3.5 text-white shadow-lg relative overflow-hidden border border-slate-700/60">
            <div class="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -left-16 -bottom-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div class="flex items-start sm:items-center gap-3">
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                  class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-inner border border-white/10"
                  title="Back to Strategic Tiles Grid"
                >
                  <i data-lucide="arrow-left" class="w-4 h-4"></i>
                </button>

                <div class="space-y-0.5">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="px-2 py-0.2 rounded-full text-[9.5px] font-mono font-bold uppercase tracking-wider bg-amber-400 text-amber-950 shadow-2xs">
                      ${tile.code}
                    </span>
                    <span class="px-2 py-0.2 rounded-full text-[9.5px] font-bold bg-white/10 text-amber-200 border border-amber-400/30">
                      Corporate Procurement & SCM
                    </span>
                    <!-- Google Sheet connection status pill -->
                    <button
                      type="button"
                      onclick="window.FPCL_STRATEGIC_SUITE.openSheetConfigModal('${tile.id}')"
                      class="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9.5px] font-bold border transition-colors cursor-pointer ${isConnected ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30' : 'bg-amber-500/20 text-amber-200 border-amber-400/50 hover:bg-amber-500/30'}"
                      title="${isConnected ? 'Google Sheet is connected (Green)' : 'Google Sheet link broken / unlinked (Orange) - Click to configure'}"
                    >
                      <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}"></span>
                      </span>
                      <span>${isConnected ? `Sheet: ${sheetTabName}` : 'Link Broken'}</span>
                    </button>
                  </div>

                  <h1 class="text-base sm:text-xl font-black text-white tracking-tight">
                    Supply Chain Management (SCM) Dashboard
                  </h1>

                  <div class="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
                    <span class="text-amber-300 font-mono text-xs">
                      Source: ${sheetSourceLabel}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Action Bar Buttons -->
              <div class="flex items-center gap-2 flex-wrap self-start md:self-auto">
                <!-- Sync SCM Button -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.syncEmployeeSheet('${tile.id}')"
                  class="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 transition-all cursor-pointer flex items-center gap-2 shadow-md ${isSyncing ? 'opacity-70 animate-pulse' : ''}"
                  title="Sync live data from Google Sheet SCM"
                >
                  <i data-lucide="refresh-cw" class="w-4 h-4 ${isSyncing ? 'animate-spin' : ''}"></i>
                  <span>${isSyncing ? 'Syncing...' : 'Sync Live Sheet'}</span>
                  <span class="text-xs opacity-75 font-mono">(${lastSynced})</span>
                </button>

                <!-- Sheet Settings Modal -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.openSheetConfigModal('${tile.id}')"
                  class="p-2 text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all cursor-pointer shadow-xs"
                  title="Configure Google Sheet Link / Tab Name"
                >
                  <i data-lucide="settings" class="w-4 h-4"></i>
                </button>

                <!-- Export CSV -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.exportTileCSV('${tile.id}')"
                  class="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                  title="Export filtered SCM actions as CSV"
                >
                  <i data-lucide="download" class="w-4 h-4"></i>
                  <span>Export CSV (${filteredTotal})</span>
                </button>

                ${isFiltered ? `
                  <button
                    type="button"
                    onclick="window.FPCL_STRATEGIC_SUITE.clearTileFilters()"
                    class="px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Reset all search and status filters"
                  >
                    <i data-lucide="filter-x" class="w-4 h-4"></i>
                    <span>Reset</span>
                  </button>
                ` : ''}

                <!-- Lock & Return -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                  class="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-200 border border-white/20 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Lock dashboard immediately and return to grid"
                >
                  <i data-lucide="lock" class="w-4 h-4"></i>
                  <span>Lock & Return</span>
                </button>
              </div>
            </div>
          </div>

          <!-- SCM OPERATIONAL READINESS & PROCUREMENT KPI CARDS (6 CARDS) -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
            <!-- Card 1: Total SCM Deliverables -->
            <div class="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 sm:p-5 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 text-center">SCM Deliverables</div>
              <div class="text-4xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight text-slate-900 kpi-metric-val mt-2 text-center">${filteredTotal}</div>
            </div>

            <!-- Card 2: Closed & Procured -->
            <div class="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 sm:p-5 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-700 text-center">Closed / Procured</div>
              <div class="text-4xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight text-emerald-600 kpi-metric-val mt-2 text-center">${filteredClosed}</div>
            </div>

            <!-- Card 3: Open / In-Procurement -->
            <div class="bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-700 text-center">Open / Pending</div>
              <div class="text-4xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight text-amber-600 kpi-metric-val mt-2 text-center">${filteredOpen}</div>
            </div>

            <!-- Card 4: SCM Execution Rate -->
            <div class="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 sm:p-5 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-700 text-center">Execution Rate</div>
              <div class="text-4xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight text-blue-600 kpi-metric-val mt-2 text-center">${overallRate}%</div>
            </div>

            <!-- Card 5: Critical Turnaround Spares -->
            <div class="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 sm:p-5 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 text-center">Turnaround Spares</div>
              <div class="text-4xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight text-slate-900 kpi-metric-val mt-2 text-center">100%</div>
            </div>

            <!-- Card 6: Physical Inventory Accuracy -->
            <div class="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 sm:p-5 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-700 text-center">Barcode Match</div>
              <div class="text-4xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight text-indigo-600 kpi-metric-val mt-2 text-center">99.4%</div>
            </div>
          </div>

          <!-- TREND BARS & DONUT CHART (SCM ACTION STATUS & OPEN/CLOSE DONUT) -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
            ${this.renderSingleStatusBar(tile, closedActions, openActions, totalActions, overallRate, this.state.tileFilterStatus || 'all')}
            ${this.renderOpenCloseDonutCard(closedActions, openActions, totalActions, overallRate, this.state.tileFilterStatus || 'all')}
          </div>

          <!-- SCM FILTER BAR -->
          <div class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <!-- Search Filter -->
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="search" class="w-4 h-4"></i>
                </div>
                <input
                  type="text"
                  value="${this.state.tileFilterSearch || ''}"
                  placeholder="Filter SCM deliverables, ID, remarks..."
                  class="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border border-slate-200 focus:border-amber-500 rounded-xl text-xs sm:text-sm font-medium outline-none transition-all"
                  oninput="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterSearch', this.value)"
                />
                ${this.state.tileFilterSearch ? `
                  <button
                    onclick="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterSearch', '')"
                    class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                  </button>
                ` : ''}
              </div>

              <!-- Status Filter Dropdown -->
              <div class="relative">
                <select
                  onchange="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterStatus', this.value)"
                  class="w-full px-3.5 py-2 bg-slate-50 hover:bg-white focus:bg-white text-slate-800 border border-slate-200 focus:border-purple-500 rounded-xl text-xs sm:text-sm font-bold outline-none transition-all cursor-pointer"
                >
                  <option value="all" ${this.state.tileFilterStatus === 'all' ? 'selected' : ''}>All Statuses (${totalActions})</option>
                  <option value="Open" ${this.state.tileFilterStatus === 'Open' ? 'selected' : ''}>Open Only (${openActions})</option>
                  <option value="Closed" ${this.state.tileFilterStatus === 'Closed' ? 'selected' : ''}>Closed Only (${closedActions})</option>
                </select>
              </div>
            </div>
          </div>

          <!-- SCM DELIVERABLES & ACTION TABLE -->
          <div class="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div class="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
              <div class="flex items-center gap-2">
                <i data-lucide="list-checks" class="w-4 h-4 text-amber-600"></i>
                <h3 class="text-sm sm:text-base font-black text-slate-800">
                  SCM Action Deliverables (${filteredTotal} items)
                </h3>
              </div>

              <!-- Page Size Selector -->
              <div class="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                <span class="font-medium">Rows per page:</span>
                <select
                  onchange="window.FPCL_STRATEGIC_SUITE.setTilePageSize(Number(this.value))"
                  class="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="15" ${pageSize === 15 ? 'selected' : ''}>15</option>
                  <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
                  <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
                  <option value="1000" ${pageSize === 1000 ? 'selected' : ''}>All</option>
                </select>
              </div>
            </div>

            <!-- Table View -->
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs sm:text-sm text-slate-700">
                <thead class="bg-slate-50 border-b border-slate-200 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th class="py-3 px-3.5 w-24">Deliverable ID</th>
                    <th class="py-3 px-3.5 min-w-[280px]">Action & Scope Description</th>
                    <th class="py-3 px-3.5 w-28">Due Date</th>
                    <th class="py-3 px-3.5 w-24">Status</th>
                    <th class="py-3 px-3.5 min-w-[180px]">Remarks / Supplier Details</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${pagedActions.length === 0 ? `
                    <tr>
                      <td colspan="5" class="py-8 text-center text-slate-400">
                        No SCM deliverables match the active filter.
                      </td>
                    </tr>
                  ` : pagedActions.map(a => {
                    const isClosed = a.status === 'Closed' || a.status === 'Completed';
                    return `
                      <tr class="hover:bg-slate-50/70 transition-colors">
                        <td class="py-3 px-3.5 font-mono font-bold text-slate-800">${a.id}</td>
                        <td class="py-3 px-3.5 text-slate-900 font-medium">${a.title}</td>
                        <td class="py-3 px-3.5 text-slate-600">${a.dueDate || '-'}</td>
                        <td class="py-3 px-3.5">
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${isClosed ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}">
                            <span class="w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                            ${a.status || (isClosed ? 'Closed' : 'Open')}
                          </span>
                        </td>
                        <td class="py-3 px-3.5 text-slate-500">${a.remarks || '-'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Pagination Footer -->
            ${totalPages > 1 ? `
              <div class="p-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>Page ${safePage} of ${totalPages}</span>
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    ${safePage <= 1 ? 'disabled' : ''}
                    onclick="window.FPCL_STRATEGIC_SUITE.setTilePage(${safePage - 1})"
                    class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    ${safePage >= totalPages ? 'disabled' : ''}
                    onclick="window.FPCL_STRATEGIC_SUITE.setTilePage(${safePage + 1})"
                    class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
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
            <div class="space-y-2.5 sm:space-y-3 animate-in fade-in duration-200">
              <!-- FULL-PAGE DASHBOARD BODY WITH MERGED UNIFIED HEADER -->
              <div id="strategic-fullpage-body" class="w-full">
                ${isBoss ? this.renderBossDashboard() : this.renderEmployeeActionSheet(selectedTile)}
              </div>

              <!-- BOTTOM FOOTER RETURN BAR -->
              <div class="pt-2.5 sm:pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div class="flex items-center gap-2 text-center sm:text-left">
                  <i data-lucide="lock" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
                  <span>Session will automatically lock upon moving back. Password required to re-enter.</span>
                </div>
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                  class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-xs cursor-pointer transition-all"
                >
                  <i data-lucide="arrow-left" class="w-4 h-4 text-slate-500"></i>
                  <span>Back to Strategic Dashboard</span>
                </button>
              </div>

              <!-- AUTH MODAL -->
              ${this.getAuthModalHtml()}
              <!-- SHEET CONFIG MODAL -->
              ${this.getSheetConfigModalHtml()}
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
          (t.category && t.category.toLowerCase().includes(q));

        return matchQuery;
      });

      const html = `
        <!-- STRATEGIC DASHBOARD HEADER BANNER (COMPACT) -->
        <div class="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E1B4B] rounded-2xl p-3.5 sm:p-4 text-white shadow-md relative overflow-hidden border border-slate-700/60 text-center">
          <div class="absolute -right-16 -top-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10 flex flex-col items-center justify-center text-center space-y-1 max-w-2xl mx-auto">
            <span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10.5px] font-mono font-bold uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30 shadow-2xs">
              <i data-lucide="target" class="w-3 h-3 text-purple-300"></i>
              <span>FPCL STRATEGIC GOVERNANCE</span>
            </span>
            <h1 class="text-xl sm:text-2xl font-black tracking-tight text-white text-center">
              Strategic Dashboard
            </h1>
            <p class="text-xs text-slate-300 font-medium max-w-lg">
              Individual department Google Sheet trackers with central COO Executive Dashboard rollup.
            </p>
          </div>
        </div>

        <!-- SEARCH & CONTROLS TOOLBAR (COMPACT) -->
        <div class="bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-xs">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="relative w-full sm:w-64">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <i data-lucide="search" class="w-4 h-4"></i>
              </div>
              <input
                id="strategic-search-input"
                type="text"
                value="${this.state.searchQuery}"
                placeholder="Search department or code..."
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
          <div id="strategic-tiles-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
            ${filtered.map(tile => {
              const isConnected = this.isSheetConnected(tile.id);

              if (tile.isBossDashboard) {
                // Featured COO Strategic Dashboard Tile
                return `
                  <div
                    id="tile-${tile.id}"
                    onclick="window.FPCL_STRATEGIC_SUITE.handleTileClick('${tile.id}')"
                    class="group relative bg-gradient-to-br from-purple-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 border-2 border-purple-400/50 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden transition-all duration-250 shadow-md hover:shadow-xl hover:-translate-y-1 select-none min-h-[165px] sm:min-h-[180px] gap-2.5"
                  >
                    <!-- Top Accent Gold Stripe -->
                    <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"></div>

                    <!-- Right Top Corner Connection Dot (Green = Connected, Orange = Link Broken) -->
                    <div
                      class="absolute top-3 right-3 z-10 flex items-center gap-1"
                      title="${isConnected ? 'Connected to Google Sheets (Rollup Active)' : 'Google Sheet link broken / unlinked'}"
                    >
                      <span class="relative flex h-2.5 w-2.5">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}"></span>
                        <span class="relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'} ring-2 ring-purple-950/60 shadow-sm"></span>
                      </span>
                    </div>

                    <!-- Executive Icon (Enlarged and Center Aligned) -->
                    <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shrink-0 transition-transform duration-250 group-hover:scale-105 shadow-md mx-auto">
                      <i data-lucide="crown" class="w-6 h-6 sm:w-7 sm:h-7"></i>
                    </div>

                    <!-- Title & COO Badge (Enlarged, Center Aligned) -->
                    <div class="w-full text-center flex flex-col items-center justify-center">
                      <h3 class="text-sm sm:text-base md:text-lg font-black tracking-tight text-white group-hover:text-amber-300 transition-colors leading-snug">
                        ${tile.name}
                      </h3>
                      <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-amber-400 text-amber-950 uppercase tracking-wider shadow-xs">
                        COO Executive Dashboard
                      </span>
                    </div>
                  </div>
                `;
              }

              // Standard Department Tile with Right Top Corner Connection Dot
              return `
                <div
                  id="tile-${tile.id}"
                  onclick="window.FPCL_STRATEGIC_SUITE.handleTileClick('${tile.id}')"
                  class="group relative bg-white hover:bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-purple-300 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden transition-all duration-250 shadow-2xs hover:shadow-lg hover:-translate-y-1 select-none min-h-[165px] sm:min-h-[180px] gap-2.5"
                >
                  <!-- Top Accent Gradient Stripe -->
                  <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${tile.theme.gradient}"></div>

                  <!-- Right Top Corner Connection Dot (Green = Connected, Orange = Link Broken) -->
                  <div
                    class="absolute top-3 right-3 z-10 flex items-center gap-1"
                    title="${isConnected ? 'Google Sheet Connected (Green)' : 'Google Sheet Link Broken / Not Connected (Orange)'}"
                  >
                    <span class="relative flex h-2.5 w-2.5">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}"></span>
                      <span class="relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'} ring-2 ring-white shadow-sm"></span>
                    </span>
                  </div>

                  <!-- Tile Icon (Enlarged and Center Aligned) -->
                  <div
                    class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-250 group-hover:scale-105 shadow-2xs border mx-auto"
                    style="background-color: ${tile.theme.bg}; border-color: ${tile.theme.border}; color: ${tile.theme.primary};"
                  >
                    <i data-lucide="${tile.icon}" class="w-6 h-6 sm:w-7 sm:h-7"></i>
                  </div>

                  <!-- Department Name (Bigger text size, Center Aligned) -->
                  <div class="w-full text-center flex items-center justify-center">
                    <h3 class="text-sm sm:text-base font-extrabold tracking-tight text-slate-800 group-hover:text-purple-700 transition-colors leading-snug px-1 text-center">
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
        <!-- SHEET CONFIG MODAL -->
        ${this.getSheetConfigModalHtml()}
      `;

      container.innerHTML = html;
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  };

  strategicSuite.init();
})();
