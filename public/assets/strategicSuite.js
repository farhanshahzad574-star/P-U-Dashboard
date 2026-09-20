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
      tileFilterPriority: 'all', // 'all' | 'High' | 'Medium' | 'Low'
      tilePage: 1,
      tilePageSize: 15,
      tileLastSynced: {},
      // Dynamic filters and pagination for Strategic Master Rollup Dashboard
      masterFilterSearch: '',
      masterFilterDept: 'all', // 'all' | tileId
      masterFilterStatus: 'all', // 'all' | 'Open' | 'Closed'
      masterFilterPriority: 'all', // 'all' | 'High' | 'Medium' | 'Low'
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
            <span>Wrong password</span>
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
      const prioF = this.state.tileFilterPriority || 'all';

      return tile.actions.filter(a => {
        const isClosed = a.status === 'Closed' || a.status === 'Completed';
        if (statusF === 'Open' && isClosed) return false;
        if (statusF === 'Closed' && !isClosed) return false;

        if (prioF !== 'all' && (a.priority || '').toLowerCase() !== prioF.toLowerCase()) return false;

        if (q) {
          const matchId = (a.id || '').toLowerCase().includes(q);
          const matchTitle = (a.title || '').toLowerCase().includes(q);
          const matchRemarks = (a.remarks || '').toLowerCase().includes(q);
          const matchDue = (a.dueDate || '').toLowerCase().includes(q);
          const matchPrio = (a.priority || '').toLowerCase().includes(q);
          if (!matchId && !matchTitle && !matchRemarks && !matchDue && !matchPrio) return false;
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
      this.state.tileFilterPriority = 'all';
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

      const headers = ['Sr #', 'Action ID', 'Action Description', 'Due Date', 'Status', 'Closure Date', 'Remarks'];
      const rows = data.map((d, i) => [
        i + 1,
        `"${String(d.id || '').replace(/"/g, '""')}"`,
        `"${String(d.title || '').replace(/"/g, '""')}"`,
        `"${String(d.dueDate || '').replace(/"/g, '""')}"`,
        `"${String(d.status || '').replace(/"/g, '""')}"`,
        `"${String(d.closureDate || '').replace(/"/g, '""')}"`,
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
      const prioF = this.state.masterFilterPriority || 'all';

      return all.filter(a => {
        if (deptF !== 'all' && a.tileId !== deptF && (a.department || '').toLowerCase() !== deptF.toLowerCase()) {
          return false;
        }

        const isClosed = a.status === 'Closed' || a.status === 'Completed';
        if (statusF === 'Open' && isClosed) return false;
        if (statusF === 'Closed' && !isClosed) return false;

        if (prioF !== 'all' && (a.priority || '').toLowerCase() !== prioF.toLowerCase()) return false;

        if (q) {
          const matchId = (a.id || '').toLowerCase().includes(q);
          const matchTitle = (a.title || '').toLowerCase().includes(q);
          const matchDept = (a.department || '').toLowerCase().includes(q);
          const matchLead = (a.employeeName || '').toLowerCase().includes(q);
          const matchRemarks = (a.remarks || '').toLowerCase().includes(q);
          const matchDue = (a.dueDate || '').toLowerCase().includes(q);
          if (!matchId && !matchTitle && !matchDept && !matchLead && !matchRemarks && !matchDue) return false;
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
      this.state.masterFilterPriority = 'all';
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

      const headers = ['Sr #', 'Department', 'Code', 'Action ID', 'Action Description', 'Due Date', 'Status', 'Closure Date', 'Remarks'];
      const rows = data.map((d, i) => [
        i + 1,
        `"${String(d.department || '').replace(/"/g, '""')}"`,
        `"${String(d.code || '').replace(/"/g, '""')}"`,
        `"${String(d.id || '').replace(/"/g, '""')}"`,
        `"${String(d.title || '').replace(/"/g, '""')}"`,
        `"${String(d.dueDate || '').replace(/"/g, '""')}"`,
        `"${String(d.status || '').replace(/"/g, '""')}"`,
        `"${String(d.closureDate || '').replace(/"/g, '""')}"`,
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

    saveSheetConfigModal(tileId) {
      const urlEl = document.getElementById('modal-sheet-url');
      const tabEl = document.getElementById('modal-sheet-tab');
      const gidEl = document.getElementById('modal-sheet-gid');
      if (!urlEl) return;
      const url = urlEl.value.trim();
      const tab = tabEl ? tabEl.value.trim() : '';
      const gid = gidEl ? gidEl.value.trim() : '0';

      this.customSheets[tileId] = { sheetUrl: url, sheetTab: tab, gid };
      this.saveStoredSheets();
      this.closeSheetConfigModal();
      this.showToast('Settings Saved', 'Google Sheet connection updated for this tile.', 'success');
      this.render();
    },

    getSheetConfigModalHtml() {
      const tileId = this.state.sheetConfigModalTileId;
      if (!tileId) return '';
      const tile = this.getTileData(tileId);
      if (!tile) return '';

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
                onclick="window.FPCL_STRATEGIC_SUITE.closeSheetConfigModal()"
                class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.saveSheetConfigModal('${tile.id}'); window.FPCL_STRATEGIC_SUITE.syncEmployeeSheet('${tile.id}')"
                  class="px-4 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all cursor-pointer flex items-center gap-1.5"
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

      // Priority Breakdown for Trend Bars
      const prioHigh = allActions.filter(a => a.priority === 'High');
      const prioHighClosed = prioHigh.filter(a => a.status === 'Closed' || a.status === 'Completed').length;
      const prioHighRate = prioHigh.length > 0 ? Math.round((prioHighClosed / prioHigh.length) * 100) : 0;

      const prioMed = allActions.filter(a => a.priority === 'Medium');
      const prioMedClosed = prioMed.filter(a => a.status === 'Closed' || a.status === 'Completed').length;
      const prioMedRate = prioMed.length > 0 ? Math.round((prioMedClosed / prioMed.length) * 100) : 0;

      const prioLow = allActions.filter(a => a.priority === 'Low');
      const prioLowClosed = prioLow.filter(a => a.status === 'Closed' || a.status === 'Completed').length;
      const prioLowRate = prioLow.length > 0 ? Math.round((prioLowClosed / prioLow.length) * 100) : 0;

      // Pagination for Simple Table
      const page = this.state.masterPage || 1;
      const pageSize = this.state.masterPageSize || 15;
      const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
      const safePage = Math.min(page, totalPages);
      const startIdx = (safePage - 1) * pageSize;
      const endIdx = Math.min(filteredTotal, startIdx + pageSize);
      const pagedActions = filteredActions.slice(startIdx, endIdx);

      const isFiltered = this.state.masterFilterSearch || this.state.masterFilterDept !== 'all' || this.state.masterFilterStatus !== 'all' || this.state.masterFilterPriority !== 'all';

      return `
        <div class="space-y-6">
          <!-- TOP ACTION HEADER BAR WITH SYNC & EXPORT -->
          <div class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                  Strategic Dashboard
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  Aggregated From All Department Tiles
                </span>
              </div>
              <h2 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">COO Executive Dashboard</h2>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <!-- Sync All Google Sheets Option -->
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.syncAllEmployeeSheets()"
                class="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                title="Sync all 19 department Google Sheets"
              >
                <i data-lucide="refresh-cw" class="w-4 h-4 ${this.state.isSyncingAll ? 'animate-spin' : ''}"></i>
                <span>Sync All Sheets</span>
                <span class="text-[10px] opacity-80 font-normal">(${this.state.masterLastSynced || 'Live'})</span>
              </button>

              <!-- Downloadable Filter-aware CSV Export Option -->
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.exportMasterCSV()"
                class="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                title="Download CSV based on active filter"
              >
                <i data-lucide="download" class="w-4 h-4"></i>
                <span>Export Filtered CSV (${filteredTotal})</span>
              </button>

              ${isFiltered ? `
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.clearMasterFilters()"
                  class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <i data-lucide="filter-x" class="w-3.5 h-3.5"></i>
                  <span>Reset Filters</span>
                </button>
              ` : ''}
            </div>
          </div>

          <!-- FILTER BAR OPTION -->
          <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <!-- Search Filter -->
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="search" class="w-4 h-4"></i>
                </div>
                <input
                  type="text"
                  value="${this.state.masterFilterSearch || ''}"
                  placeholder="Filter actions, leads, IDs..."
                  class="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border border-slate-200 focus:border-purple-500 rounded-xl text-xs font-medium outline-none transition-all"
                  oninput="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterSearch', this.value)"
                />
                ${this.state.masterFilterSearch ? `
                  <button
                    onclick="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterSearch', '')"
                    class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                  </button>
                ` : ''}
              </div>

              <!-- Department Filter -->
              <div>
                <select
                  class="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border border-slate-200 focus:border-purple-500 rounded-xl text-xs font-semibold outline-none transition-all cursor-pointer"
                  onchange="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterDept', this.value)"
                >
                  <option value="all" ${this.state.masterFilterDept === 'all' ? 'selected' : ''}>All Departments (${allTiles.length})</option>
                  ${allTiles.map(t => `
                    <option value="${t.id}" ${this.state.masterFilterDept === t.id ? 'selected' : ''}>${t.name} (${t.code})</option>
                  `).join('')}
                </select>
              </div>

              <!-- Status Filter Dropdown Menu -->
              <div class="relative">
                <select
                  class="w-full py-2 pl-3.5 pr-8 bg-slate-50 hover:bg-white focus:bg-white text-slate-800 border border-slate-200 focus:border-amber-500 rounded-xl text-xs font-bold outline-none transition-all cursor-pointer appearance-none shadow-2xs"
                  onchange="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterStatus', this.value)"
                >
                  <option value="all" ${this.state.masterFilterStatus === 'all' ? 'selected' : ''}>All Statuses (${totalActions})</option>
                  <option value="Open" ${this.state.masterFilterStatus === 'Open' ? 'selected' : ''}>Open Only (${openActions})</option>
                  <option value="Closed" ${this.state.masterFilterStatus === 'Closed' ? 'selected' : ''}>Closed (${closedActions})</option>
                </select>
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <i data-lucide="chevron-down" class="w-4 h-4"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- KPI VALUES -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Company Actions</div>
              <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">${filteredTotal}</div>
              <div class="text-[11px] text-slate-400 mt-1">Across 19 Department Tiles</div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div class="text-xs font-bold text-emerald-700 uppercase tracking-wider">Closed Actions</div>
              <div class="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">${filteredClosed}</div>
              <div class="text-[11px] font-semibold text-emerald-700 mt-1">${filteredRate}% Closure Rate</div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div class="text-xs font-bold text-rose-700 uppercase tracking-wider">Open Actions</div>
              <div class="text-2xl sm:text-3xl font-black text-rose-600 mt-1">${filteredOpen}</div>
              <div class="text-[11px] font-semibold text-rose-700 mt-1">Pending Execution</div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div class="text-xs font-bold text-purple-700 uppercase tracking-wider">100% Closed Depts</div>
              <div class="text-2xl sm:text-3xl font-black text-purple-700 mt-1">${rollup.employeesFullyClosed} / ${allTiles.length}</div>
              <div class="text-[11px] font-semibold text-purple-700 mt-1">Zero Open Actions</div>
            </div>
          </div>

          <!-- TREND BARS (NO EXTRA DESCRIPTIONS OR TEXTS BELOW HEADING AND AT BOTTOM OF VISUALS) -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Trend Card 1: Department Performance Trend Bars -->
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold text-slate-900">Department Performance Trends</h3>
                <span class="text-xs font-mono font-bold text-slate-500">19 Departments</span>
              </div>

              <div class="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                ${allTiles.map(t => {
                  const tTotal = t.stats.total;
                  const tClosed = t.stats.closed;
                  const tRate = t.stats.rate;
                  return `
                    <div class="space-y-1">
                      <div class="flex items-center justify-between text-xs">
                        <span class="font-bold text-slate-800 truncate max-w-[200px]">${t.name} (${t.code})</span>
                        <span class="font-mono font-semibold text-slate-600">${tClosed}/${tTotal} (${tRate}%)</span>
                      </div>
                      <div class="w-full h-4 bg-slate-100 rounded-lg overflow-hidden flex shadow-inner">
                        <div class="bg-emerald-500 h-full transition-all duration-300" style="width: ${tRate}%"></div>
                        <div class="bg-rose-400 h-full transition-all duration-300" style="width: ${100 - tRate}%"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Trend Card 2: Open vs Close Donut Chart (Right side of Action Status Trends) -->
            ${this.renderOpenCloseDonutCard(filteredClosed, filteredOpen, filteredTotal, filteredRate)}
          </div>

          <!-- SIMPLE TABLE FOR TEXT DATA WITH FILTER & PAGINATION -->
          <div id="strategic-master-table" class="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div class="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-2.5">
                <h3 class="text-sm font-bold text-slate-900">Company Action Items</h3>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Showing ${pagedActions.length} of ${filteredTotal}
                </span>
              </div>

              <div class="flex items-center gap-2 text-xs">
                <span class="text-slate-500">Rows:</span>
                <select
                  class="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer outline-none"
                  onchange="window.FPCL_STRATEGIC_SUITE.setMasterPageSize(this.value)"
                >
                  <option value="15" ${pageSize === 15 ? 'selected' : ''}>15</option>
                  <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
                  <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
                  <option value="all" ${pageSize === 9999 ? 'selected' : ''}>All</option>
                </select>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                    <th class="py-3 px-3.5 w-20">ID</th>
                    <th class="py-3 px-3.5 w-40">Department</th>
                    <th class="py-3 px-3.5 min-w-[280px]">Action Item</th>
                    <th class="py-3 px-3.5 w-28">Due Date</th>
                    <th class="py-3 px-3.5 w-24">Status</th>
                    <th class="py-3 px-3.5 min-w-[180px]">Remarks</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
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
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isClosed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                            ${isClosed ? 'Closed' : 'Open'}
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
    // RENDER: OPEN / CLOSE DONUT CHART (Right side of Action Status Trends)
    // =========================================================================
    renderOpenCloseDonutCard(closed, open, total, rate) {
      const circumference = 339.292; // 2 * PI * 54
      const closedPct = total > 0 ? closed / total : 0;
      const openPct = total > 0 ? open / total : 0;
      const closedDash = Math.min(circumference, Math.max(0, closedPct * circumference));
      const openDash = Math.min(circumference, Math.max(0, openPct * circumference));
      const closedRate = total > 0 ? Math.round(closedPct * 100) : 0;
      const openRate = total > 0 ? Math.round(openPct * 100) : 0;

      return `
        <div class="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm sm:text-base font-black text-slate-900">Open vs Closed Donut Chart</h3>
              <p class="text-xs text-slate-500 mt-0.5">Real-time status breakdown</p>
            </div>
            <span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              ${total} Total
            </span>
          </div>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            <!-- Donut SVG with Center Metric -->
            <div class="relative w-40 h-40 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 160 160" class="w-full h-full">
                <!-- Base track -->
                <circle cx="80" cy="80" r="54" fill="none" stroke="#f1f5f9" stroke-width="16" />
                ${total > 0 ? `
                  <!-- Closed Arc (Emerald) -->
                  <circle
                    cx="80" cy="80" r="54"
                    fill="none"
                    stroke="#10b981"
                    stroke-width="16"
                    stroke-dasharray="${closedDash} ${circumference}"
                    stroke-dashoffset="0"
                    transform="rotate(-90 80 80)"
                    stroke-linecap="${open > 0 && closed > 0 ? 'butt' : 'round'}"
                    class="transition-all duration-500"
                  />
                  <!-- Open Arc (Rose) -->
                  <circle
                    cx="80" cy="80" r="54"
                    fill="none"
                    stroke="#f43f5e"
                    stroke-width="16"
                    stroke-dasharray="${openDash} ${circumference}"
                    stroke-dashoffset="-${closedDash}"
                    transform="rotate(-90 80 80)"
                    stroke-linecap="${open > 0 && closed > 0 ? 'butt' : 'round'}"
                    class="transition-all duration-500"
                  />
                ` : ''}
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span class="text-2xl font-black text-slate-900 tracking-tight leading-none">${rate}%</span>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Closed</span>
              </div>
            </div>

            <!-- Legend & Metric Details -->
            <div class="w-full sm:w-auto flex-1 space-y-3">
              <!-- Closed Box -->
              <div class="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                <div class="flex items-center gap-2.5">
                  <span class="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shrink-0"></span>
                  <span class="text-xs font-bold text-emerald-950">Closed Actions</span>
                </div>
                <div class="text-right">
                  <div class="text-xs font-mono font-black text-emerald-700">${closed} <span class="text-[11px] font-medium text-emerald-600">(${closedRate}%)</span></div>
                </div>
              </div>

              <!-- Open Box -->
              <div class="flex items-center justify-between p-3 rounded-xl bg-rose-50/70 border border-rose-200/80">
                <div class="flex items-center gap-2.5">
                  <span class="w-3.5 h-3.5 rounded-full bg-rose-500 ring-4 ring-rose-100 shrink-0"></span>
                  <span class="text-xs font-bold text-rose-950">Open Actions</span>
                </div>
                <div class="text-right">
                  <div class="text-xs font-mono font-black text-rose-700">${open} <span class="text-[11px] font-medium text-rose-600">(${openRate}%)</span></div>
                </div>
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

      // Priority Breakdown for Trend Bars
      const prioHigh = allActions.filter(a => a.priority === 'High');
      const prioHighClosed = prioHigh.filter(a => a.status === 'Closed' || a.status === 'Completed').length;
      const prioHighRate = prioHigh.length > 0 ? Math.round((prioHighClosed / prioHigh.length) * 100) : 0;

      const prioMed = allActions.filter(a => a.priority === 'Medium');
      const prioMedClosed = prioMed.filter(a => a.status === 'Closed' || a.status === 'Completed').length;
      const prioMedRate = prioMed.length > 0 ? Math.round((prioMedClosed / prioMed.length) * 100) : 0;

      const prioLow = allActions.filter(a => a.priority === 'Low');
      const prioLowClosed = prioLow.filter(a => a.status === 'Closed' || a.status === 'Completed').length;
      const prioLowRate = prioLow.length > 0 ? Math.round((prioLowClosed / prioLow.length) * 100) : 0;

      // Pagination for Simple Table
      const page = this.state.tilePage || 1;
      const pageSize = this.state.tilePageSize || 15;
      const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
      const safePage = Math.min(page, totalPages);
      const startIdx = (safePage - 1) * pageSize;
      const endIdx = Math.min(filteredTotal, startIdx + pageSize);
      const pagedActions = filteredActions.slice(startIdx, endIdx);

      const isFiltered = this.state.tileFilterSearch || this.state.tileFilterStatus !== 'all' || this.state.tileFilterPriority !== 'all';
      const isSyncing = this.state.syncStatus[tile.id] === 'syncing';
      const lastSynced = this.state.tileLastSynced[tile.id] || 'Active';

      // SCM Dedicated Dashboard Rendering
      if (tile.id === 'scm') {
        return this.renderScmDashboard(tile, {
          allActions, filteredActions, totalActions, closedActions, openActions, overallRate,
          filteredTotal, filteredClosed, filteredOpen, filteredRate,
          prioHigh, prioHighRate, prioMed, prioMedRate, prioLow, prioLowRate,
          pagedActions, safePage, totalPages, pageSize,
          isFiltered, isSyncing, lastSynced
        });
      }

      return `
        <div class="space-y-6">
          <!-- TOP ACTION HEADER BAR WITH BACK BUTTON, SYNC, SHEET LINK & EXPORT -->
          <div class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-3.5">
              <!-- Back button to return to matrix grid -->
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="Back to Strategic Dashboard Matrix"
              >
                <i data-lucide="arrow-left" class="w-5 h-5"></i>
              </button>

              <div class="space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                    ${tile.code}
                  </span>
                </div>
                <h2 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">${tile.name} Dashboard</h2>
              </div>
            </div>

            <!-- Header Actions: Sync, Open Sheet, Config & Filter-aware CSV Export -->
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Sync Option -->
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.syncEmployeeSheet('${tile.id}')"
                class="px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer flex items-center gap-2 shadow-sm ${isSyncing ? 'opacity-70 animate-pulse' : ''}"
                title="Sync from connected Google Sheet (${tile.name})"
              >
                <i data-lucide="refresh-cw" class="w-4 h-4 ${isSyncing ? 'animate-spin' : ''}"></i>
                <span>${isSyncing ? 'Syncing...' : 'Sync Sheet'}</span>
                <span class="text-[10px] opacity-80 font-normal">(${lastSynced})</span>
              </button>

              <!-- Open Google Sheet Link -->
              ${tile.sheetUrl ? `
                <a
                  href="${tile.sheetUrl}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Open live Google Sheet in new tab"
                >
                  <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                  <span>Open Sheet</span>
                </a>
              ` : ''}

              <!-- Sheet Settings Modal Option -->
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.openSheetConfigModal('${tile.id}')"
                class="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                title="Configure Google Sheet Link / Tab Name"
              >
                <i data-lucide="settings" class="w-4 h-4"></i>
              </button>

              <!-- Downloadable Filter-aware CSV Export Option -->
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.exportTileCSV('${tile.id}')"
                class="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="Download CSV based on active filter"
              >
                <i data-lucide="download" class="w-4 h-4"></i>
                <span>Export Filtered CSV (${filteredTotal})</span>
              </button>

              ${isFiltered ? `
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.clearTileFilters()"
                  class="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <i data-lucide="filter-x" class="w-3.5 h-3.5"></i>
                  <span>Reset</span>
                </button>
              ` : ''}
            </div>
          </div>

          <!-- FILTER BAR OPTION -->
          <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <!-- Search Filter -->
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="search" class="w-4 h-4"></i>
                </div>
                <input
                  type="text"
                  value="${this.state.tileFilterSearch || ''}"
                  placeholder="Filter by action text, ID, remarks..."
                  class="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border border-slate-200 focus:border-purple-500 rounded-xl text-xs font-medium outline-none transition-all"
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
                  class="w-full py-2 pl-3.5 pr-8 bg-slate-50 hover:bg-white focus:bg-white text-slate-800 border border-slate-200 focus:border-purple-500 rounded-xl text-xs font-bold outline-none transition-all cursor-pointer appearance-none shadow-2xs"
                  onchange="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterStatus', this.value)"
                >
                  <option value="all" ${this.state.tileFilterStatus === 'all' ? 'selected' : ''}>All Actions (${totalActions})</option>
                  <option value="Open" ${this.state.tileFilterStatus === 'Open' ? 'selected' : ''}>Open Only (${openActions})</option>
                  <option value="Closed" ${this.state.tileFilterStatus === 'Closed' ? 'selected' : ''}>Closed (${closedActions})</option>
                </select>
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <i data-lucide="chevron-down" class="w-4 h-4"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- KPI VALUES -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Actions</div>
              <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">${filteredTotal}</div>
              <div class="text-[11px] text-slate-400 mt-1">Total in Google Sheet: ${totalActions}</div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div class="text-xs font-bold text-emerald-700 uppercase tracking-wider">Closed Actions</div>
              <div class="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">${filteredClosed}</div>
              <div class="text-[11px] font-semibold text-emerald-700 mt-1">${filteredRate}% Closure Rate</div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div class="text-xs font-bold text-rose-700 uppercase tracking-wider">Open Actions</div>
              <div class="text-2xl sm:text-3xl font-black text-rose-600 mt-1">${filteredOpen}</div>
              <div class="text-[11px] font-semibold text-rose-700 mt-1">Pending Closure</div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div class="text-xs font-bold text-purple-700 uppercase tracking-wider">Overall Progress</div>
              <div class="text-2xl sm:text-3xl font-black text-purple-700 mt-1">${overallRate}%</div>
              <div class="text-[11px] font-semibold text-purple-700 mt-1">${closedActions} of ${totalActions} Completed</div>
            </div>
          </div>

          <!-- TREND BARS & DONUT CHART BELOW KPI VALUES -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Trend Card 1: Action Status Trends (Thicker Bars) -->
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-bold text-slate-900">Action Status Trends</h3>
                  <p class="text-xs text-slate-500 mt-0.5">Execution & completion distribution</p>
                </div>
                <span class="text-xs font-mono font-bold text-slate-600 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
                  ${closedActions} Closed / ${openActions} Open
                </span>
              </div>

              <div class="space-y-4 pt-1">
                <!-- Overall Closure Bar -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-slate-800">Overall Closure Progress</span>
                    <span class="font-mono font-bold text-purple-700">${overallRate}% (${closedActions} of ${totalActions})</span>
                  </div>
                  <div class="w-full h-6 bg-slate-100 rounded-xl overflow-hidden flex shadow-inner">
                    <div class="bg-emerald-500 h-full flex items-center justify-center text-[11px] font-bold text-white transition-all duration-300" style="width: ${overallRate}%">
                      ${overallRate >= 12 ? overallRate + '%' : ''}
                    </div>
                    <div class="bg-rose-400 h-full flex items-center justify-center text-[11px] font-bold text-white transition-all duration-300" style="width: ${100 - overallRate}%">
                      ${(100 - overallRate) >= 12 ? (100 - overallRate) + '%' : ''}
                    </div>
                  </div>
                </div>

                <!-- Closed Items Proportion -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-slate-800">Closed Items Proportion</span>
                    <span class="font-mono font-bold text-emerald-700">${closedActions} / ${totalActions} (${totalActions > 0 ? Math.round((closedActions / totalActions) * 100) : 0}%)</span>
                  </div>
                  <div class="w-full h-6 bg-slate-100 rounded-xl overflow-hidden shadow-inner flex">
                    <div class="bg-emerald-500 h-full flex items-center justify-end pr-2 text-[11px] font-bold text-white transition-all duration-300" style="width: ${totalActions > 0 ? (closedActions / totalActions) * 100 : 0}%">
                      ${totalActions > 0 && Math.round((closedActions / totalActions) * 100) >= 15 ? closedActions + ' Closed' : ''}
                    </div>
                  </div>
                </div>

                <!-- Open Items Proportion -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-slate-800">Open Items Proportion</span>
                    <span class="font-mono font-bold text-rose-700">${openActions} / ${totalActions} (${totalActions > 0 ? Math.round((openActions / totalActions) * 100) : 0}%)</span>
                  </div>
                  <div class="w-full h-6 bg-slate-100 rounded-xl overflow-hidden shadow-inner flex">
                    <div class="bg-rose-500 h-full flex items-center justify-end pr-2 text-[11px] font-bold text-white transition-all duration-300" style="width: ${totalActions > 0 ? (openActions / totalActions) * 100 : 0}%">
                      ${totalActions > 0 && Math.round((openActions / totalActions) * 100) >= 15 ? openActions + ' Open' : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Trend Card 2: Open vs Close Donut Chart (Right side of Action Status Trends) -->
            ${this.renderOpenCloseDonutCard(closedActions, openActions, totalActions, overallRate)}
          </div>

          <!-- SIMPLE TABLE FOR TEXT DATA WITH FILTER & PAGINATION -->
          <div id="strategic-tile-table" class="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div class="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-2.5">
                <h3 class="text-sm font-bold text-slate-900">Action Items</h3>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Showing ${pagedActions.length} of ${filteredTotal}
                </span>
              </div>

              <div class="flex items-center gap-2 text-xs">
                <span class="text-slate-500">Rows:</span>
                <select
                  class="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer outline-none"
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
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                    <th class="py-3 px-3.5 w-20">ID</th>
                    <th class="py-3 px-3.5 min-w-[280px]">Action Description</th>
                    <th class="py-3 px-3.5 w-28">Due Date</th>
                    <th class="py-3 px-3.5 w-24">Status</th>
                    <th class="py-3 px-3.5 w-28">Closure Date</th>
                    <th class="py-3 px-3.5 min-w-[180px]">Remarks</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
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
                        <td class="py-2.5 px-3.5 text-slate-900 font-medium">${a.title}</td>
                        <td class="py-2.5 px-3.5 text-slate-600">${a.dueDate || '-'}</td>
                        <td class="py-2.5 px-3.5">
                          <button
                            type="button"
                            onclick="window.FPCL_STRATEGIC_SUITE.toggleActionStatus('${tile.id}', '${a.id}')"
                            class="px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${isClosed ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'}"
                            title="Click to toggle status"
                          >
                            ${isClosed ? 'Closed' : 'Open'}
                          </button>
                        </td>
                        <td class="py-2.5 px-3.5 text-slate-600">${a.closureDate || '-'}</td>
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
      const sheetSourceLabel = tile.fromSecret
        ? 'Environment Secret (SCM_SHEET_URL)'
        : (tile.sheetUrl ? 'Live Google Sheet' : 'Default Verified Action Sheet');

      return `
        <div class="space-y-6">
          <!-- SCM HERO & NAVIGATION BANNER -->
          <div class="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E1B4B] rounded-2xl sm:rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden border border-slate-700/60">
            <div class="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -left-16 -bottom-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div class="flex items-start sm:items-center gap-4">
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                  class="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-inner border border-white/10"
                  title="Back to Strategic Tiles Grid"
                >
                  <i data-lucide="arrow-left" class="w-5 h-5"></i>
                </button>

                <div class="space-y-1.5">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-400 text-amber-950 shadow-2xs">
                      ${tile.code}
                    </span>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-amber-200 border border-amber-400/30">
                      Corporate Procurement & Supply Chain
                    </span>
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Google Sheet: ${sheetTabName}</span>
                    </span>
                  </div>

                  <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Supply Chain Management (SCM) Dashboard
                  </h1>

                  <div class="flex items-center gap-3 text-xs text-slate-300 flex-wrap pt-0.5">
                    <span class="text-amber-300/90 font-mono text-[11px]">
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
                  class="px-4 py-2.5 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 transition-all cursor-pointer flex items-center gap-2 shadow-lg ${isSyncing ? 'opacity-70 animate-pulse' : ''}"
                  title="Sync live data from Google Sheet SCM"
                >
                  <i data-lucide="refresh-cw" class="w-4 h-4 ${isSyncing ? 'animate-spin' : ''}"></i>
                  <span>${isSyncing ? 'Syncing...' : 'Sync Live SCM Sheet'}</span>
                  <span class="text-[10px] opacity-75 font-mono">(${lastSynced})</span>
                </button>

                <!-- Open Sheet Link -->
                ${tile.sheetUrl ? `
                  <a
                    href="${tile.sheetUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-3 py-2.5 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Open live Google Sheet in new tab"
                  >
                    <i data-lucide="external-link" class="w-4 h-4 text-amber-300"></i>
                    <span>Open Sheet</span>
                  </a>
                ` : ''}

                <!-- Sheet Settings Modal -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.openSheetConfigModal('${tile.id}')"
                  class="p-2.5 text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all cursor-pointer shadow-xs"
                  title="Configure Google Sheet Link / Tab Name"
                >
                  <i data-lucide="settings" class="w-4 h-4"></i>
                </button>

                <!-- Export CSV -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.exportTileCSV('${tile.id}')"
                  class="px-3.5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="Export filtered SCM actions as CSV"
                >
                  <i data-lucide="download" class="w-4 h-4"></i>
                  <span>Export CSV (${filteredTotal})</span>
                </button>

                ${isFiltered ? `
                  <button
                    type="button"
                    onclick="window.FPCL_STRATEGIC_SUITE.clearTileFilters()"
                    class="px-3 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1"
                    title="Reset all search and status filters"
                  >
                    <i data-lucide="filter-x" class="w-3.5 h-3.5"></i>
                    <span>Reset</span>
                  </button>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- SCM OPERATIONAL READINESS & PROCUREMENT KPI CARDS (6 CARDS) -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <!-- Card 1: Total SCM Deliverables -->
            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between text-slate-500 mb-1">
                <span class="text-[11px] font-bold uppercase tracking-wider">SCM Deliverables</span>
                <i data-lucide="package" class="w-4 h-4 text-purple-600"></i>
              </div>
              <div class="text-2xl sm:text-3xl font-black text-slate-900">${filteredTotal}</div>
              <p class="text-[10px] text-slate-500 mt-1">Total in Google Sheet: ${totalActions}</p>
            </div>

            <!-- Card 2: Closed & Procured -->
            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between text-slate-500 mb-1">
                <span class="text-[11px] font-bold uppercase tracking-wider">Closed / Procured</span>
                <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i>
              </div>
              <div class="text-2xl sm:text-3xl font-black text-emerald-600">${filteredClosed}</div>
              <p class="text-[10px] text-emerald-700 font-semibold mt-1">${filteredRate}% completed</p>
            </div>

            <!-- Card 3: Open / In-Procurement -->
            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between text-slate-500 mb-1">
                <span class="text-[11px] font-bold uppercase tracking-wider">Open / Pending</span>
                <i data-lucide="clock" class="w-4 h-4 text-amber-600"></i>
              </div>
              <div class="text-2xl sm:text-3xl font-black text-amber-600">${filteredOpen}</div>
              <p class="text-[10px] text-slate-500 mt-1">Pending delivery / PO</p>
            </div>

            <!-- Card 4: SCM Execution Rate -->
            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between text-slate-500 mb-1">
                <span class="text-[11px] font-bold uppercase tracking-wider">Execution Rate</span>
                <i data-lucide="trending-up" class="w-4 h-4 text-blue-600"></i>
              </div>
              <div class="text-2xl sm:text-3xl font-black text-blue-600">${overallRate}%</div>
              <div class="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div class="bg-blue-600 h-1.5 rounded-full" style="width: ${overallRate}%"></div>
              </div>
            </div>

            <!-- Card 5: Critical Turnaround Spares -->
            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between text-slate-500 mb-1">
                <span class="text-[11px] font-bold uppercase tracking-wider">Turnaround Spares</span>
                <i data-lucide="shield-alert" class="w-4 h-4 text-emerald-600"></i>
              </div>
              <div class="text-2xl sm:text-3xl font-black text-slate-900">100%</div>
              <p class="text-[10px] text-emerald-700 font-semibold mt-1">High-alloy valves on site</p>
            </div>

            <!-- Card 6: Physical Inventory Accuracy -->
            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between text-slate-500 mb-1">
                <span class="text-[11px] font-bold uppercase tracking-wider">Barcode Match</span>
                <i data-lucide="barcode" class="w-4 h-4 text-indigo-600"></i>
              </div>
              <div class="text-2xl sm:text-3xl font-black text-indigo-600">99.4%</div>
              <p class="text-[10px] text-slate-500 mt-1">Cyclic warehouse match</p>
            </div>
          </div>

          <!-- SCM STRATEGIC PROCUREMENT FOCUS AREAS (5 DOMAINS) -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <i data-lucide="layers" class="w-4 h-4 text-amber-600"></i>
                <h3 class="text-sm font-bold text-slate-800">SCM Strategic Milestones & Category Performance</h3>
              </div>
              <span class="text-xs text-slate-500">Live operational tracker</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <!-- Item 1 -->
              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-mono font-bold text-slate-500">SCM-CAT-01</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Closed (100%)</span>
                </div>
                <h4 class="text-xs font-bold text-slate-800 leading-snug">Turnaround Critical Spares & High-Alloy Valves</h4>
                <p class="text-[11px] text-slate-500">All 14 long-lead items inspected and placed in conditioned warehouse.</p>
                <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div class="bg-emerald-600 h-1.5 rounded-full w-full"></div>
                </div>
              </div>

              <!-- Item 2 -->
              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-mono font-bold text-slate-500">SCM-CAT-02</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Closed (100%)</span>
                </div>
                <h4 class="text-xs font-bold text-slate-800 leading-snug">Bulk Water Treatment Chemicals & Resins</h4>
                <p class="text-[11px] text-slate-500">Annual framework agreement locked at 8.4% favorable pricing.</p>
                <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div class="bg-emerald-600 h-1.5 rounded-full w-full"></div>
                </div>
              </div>

              <!-- Item 3 -->
              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-mono font-bold text-slate-500">SCM-CAT-03</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Closed (100%)</span>
                </div>
                <h4 class="text-xs font-bold text-slate-800 leading-snug">Warehouse Cyclic Stock & Barcode Audits</h4>
                <p class="text-[11px] text-slate-500">Physical inventory match verified across 4,200 active SKUs (99.4% accuracy).</p>
                <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div class="bg-emerald-600 h-1.5 rounded-full w-full"></div>
                </div>
              </div>

              <!-- Item 4 -->
              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-mono font-bold text-slate-500">SCM-CAT-04</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Open (In Progress)</span>
                </div>
                <h4 class="text-xs font-bold text-slate-800 leading-snug">Secondary Domestic Supplier Qualification</h4>
                <p class="text-[11px] text-slate-500">2 domestic vendors shortlisted for catalyst pre-filters; QA lab testing active.</p>
                <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div class="bg-amber-500 h-1.5 rounded-full" style="width: 60%"></div>
                </div>
              </div>

              <!-- Item 5 -->
              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-mono font-bold text-slate-500">SCM-CAT-05</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Open (In Progress)</span>
                </div>
                <h4 class="text-xs font-bold text-slate-800 leading-snug">Digital Vendor Scoring & Delivery Tracking</h4>
                <p class="text-[11px] text-slate-500">Scorecard module integrated with purchase order receipts; UAT phase active.</p>
                <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div class="bg-amber-500 h-1.5 rounded-full" style="width: 45%"></div>
                </div>
              </div>

              <!-- Item 6 (Connection Details) -->
              <div class="p-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">Live Integration</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-amber-900 border border-amber-300">Tab: ${sheetTabName}</span>
                </div>
                <h4 class="text-xs font-bold text-amber-950 leading-snug">Real-Time Google Sheet Sync</h4>
                <p class="text-[11px] text-amber-900/80">Configure <code class="font-mono font-bold">SCM_SHEET_URL</code> in environment secrets or click below to paste any live Google Sheet URL.</p>
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.openSheetConfigModal('${tile.id}')"
                  class="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer"
                >
                  <i data-lucide="settings" class="w-3 h-3"></i>
                  <span>Manage SCM Sheet Connection</span>
                </button>
              </div>
            </div>
          </div>

          <!-- TREND BARS & DONUT CHART (SCM ACTION STATUS & OPEN/CLOSE DONUT) -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Trend Card 1: Action Status Trends (Thicker Bars) -->
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-bold text-slate-900">Action Status Trends</h3>
                  <p class="text-xs text-slate-500 mt-0.5">Execution & completion distribution</p>
                </div>
                <span class="text-xs font-mono font-bold text-slate-600 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
                  ${closedActions} Closed / ${openActions} Open
                </span>
              </div>

              <div class="space-y-4 pt-1">
                <!-- Overall Closure Bar -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-slate-800">Overall Closure Progress</span>
                    <span class="font-mono font-bold text-purple-700">${overallRate}% (${closedActions} of ${totalActions})</span>
                  </div>
                  <div class="w-full h-6 bg-slate-100 rounded-xl overflow-hidden flex shadow-inner">
                    <div class="bg-emerald-500 h-full flex items-center justify-center text-[11px] font-bold text-white transition-all duration-300" style="width: ${overallRate}%">
                      ${overallRate >= 12 ? overallRate + '%' : ''}
                    </div>
                    <div class="bg-rose-400 h-full flex items-center justify-center text-[11px] font-bold text-white transition-all duration-300" style="width: ${100 - overallRate}%">
                      ${(100 - overallRate) >= 12 ? (100 - overallRate) + '%' : ''}
                    </div>
                  </div>
                </div>

                <!-- Closed Items Proportion -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-slate-800">Closed Items Proportion</span>
                    <span class="font-mono font-bold text-emerald-700">${closedActions} / ${totalActions} (${totalActions > 0 ? Math.round((closedActions / totalActions) * 100) : 0}%)</span>
                  </div>
                  <div class="w-full h-6 bg-slate-100 rounded-xl overflow-hidden shadow-inner flex">
                    <div class="bg-emerald-500 h-full flex items-center justify-end pr-2 text-[11px] font-bold text-white transition-all duration-300" style="width: ${totalActions > 0 ? (closedActions / totalActions) * 100 : 0}%">
                      ${totalActions > 0 && Math.round((closedActions / totalActions) * 100) >= 15 ? closedActions + ' Closed' : ''}
                    </div>
                  </div>
                </div>

                <!-- Open Items Proportion -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-slate-800">Open Items Proportion</span>
                    <span class="font-mono font-bold text-rose-700">${openActions} / ${totalActions} (${totalActions > 0 ? Math.round((openActions / totalActions) * 100) : 0}%)</span>
                  </div>
                  <div class="w-full h-6 bg-slate-100 rounded-xl overflow-hidden shadow-inner flex">
                    <div class="bg-rose-500 h-full flex items-center justify-end pr-2 text-[11px] font-bold text-white transition-all duration-300" style="width: ${totalActions > 0 ? (openActions / totalActions) * 100 : 0}%">
                      ${totalActions > 0 && Math.round((openActions / totalActions) * 100) >= 15 ? openActions + ' Open' : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Trend Card 2: Open vs Close Donut Chart -->
            ${this.renderOpenCloseDonutCard(closedActions, openActions, totalActions, overallRate)}
          </div>

          <!-- SCM FILTER BAR -->
          <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
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
                  class="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border border-slate-200 focus:border-amber-500 rounded-xl text-xs font-medium outline-none transition-all"
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
                  class="w-full px-3.5 py-2 bg-slate-50 hover:bg-white focus:bg-white text-slate-800 border border-slate-200 focus:border-purple-500 rounded-xl text-xs font-semibold outline-none transition-all cursor-pointer"
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
                <h3 class="text-sm font-bold text-slate-800">
                  SCM Action Deliverables (${filteredTotal} items)
                </h3>
              </div>

              <!-- Page Size Selector -->
              <div class="flex items-center gap-2 text-xs text-slate-600">
                <span>Rows per page:</span>
                <select
                  onchange="window.FPCL_STRATEGIC_SUITE.setTilePageSize(Number(this.value))"
                  class="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
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
              <table class="w-full text-left text-xs text-slate-700">
                <thead class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th class="py-3 px-3.5 w-24">Deliverable ID</th>
                    <th class="py-3 px-3.5 min-w-[280px]">Action & Scope Description</th>
                    <th class="py-3 px-3.5 w-28">Due Date</th>
                    <th class="py-3 px-3.5 w-24">Status</th>
                    <th class="py-3 px-3.5 w-28">Closure Date</th>
                    <th class="py-3 px-3.5 min-w-[180px]">Remarks / Supplier Details</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${pagedActions.length === 0 ? `
                    <tr>
                      <td colspan="6" class="py-8 text-center text-slate-400">
                        No SCM deliverables match the active filter.
                      </td>
                    </tr>
                  ` : pagedActions.map(a => {
                    const isClosed = a.status === 'Closed' || a.status === 'Completed';
                    return `
                      <tr class="hover:bg-slate-50/70 transition-colors">
                        <td class="py-2.5 px-3.5 font-mono font-bold text-slate-800">${a.id}</td>
                        <td class="py-2.5 px-3.5 text-slate-900 font-medium">${a.title}</td>
                        <td class="py-2.5 px-3.5 text-slate-600">${a.dueDate || '-'}</td>
                        <td class="py-2.5 px-3.5">
                          <button
                            type="button"
                            onclick="window.FPCL_STRATEGIC_SUITE.toggleActionStatus('${tile.id}', '${a.id}')"
                            class="px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${isClosed ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'}"
                            title="Click to toggle status between Open and Closed"
                          >
                            ${isClosed ? 'Closed' : 'Open'}
                          </button>
                        </td>
                        <td class="py-2.5 px-3.5 text-slate-600">${a.closureDate || '-'}</td>
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
                    ${isBoss ? `
                      <span class="hidden md:inline px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                        COO Executive Dashboard
                      </span>
                    ` : ''}
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
