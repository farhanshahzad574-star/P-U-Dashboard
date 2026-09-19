/**
 * FPCL Executive Operations & Compliance Portal
 * Sub HSE - PSM (Process Safety Management) Executive BI Suite
 * 
 * Features:
 * - Dynamic aggregation from Google Sheets dataset (or CSV URL)
 * - 4 Executive KPI metric cards (Total, Open, Closed, % Closure)
 * - Multi-dimensional drill-down filters (Search, Status, Action Dept, Action Unit, PSM Element, Severity, Audit No)
 * - Interactive Horizontal Bar Chart: Open vs. Closed Findings by Action Department
 * - Interactive Donut Chart: Audit Breakdown with toggle for PSM Element vs. Severity
 * - Dual Data Tables: Table 1 (Action Department) & Table 2 (Action Unit) with sorting & visual progress bars
 * - Detailed Findings Record Table with pagination (10, 15, 25, 50, all) and Search
 * - Modal inspection drawer for full finding metadata
 * - Live Google Sheets sync feed & CSV Export functionality
 */

(function() {
  const HARDCODED_PSM_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1bFBRGKqIfO8Pn7qPSTU0pbdTB87ezDyXvVDnCbTGrx4/export?format=csv&gid=0';

  const psmSuite = {
    state: {
      activeSubDashboard: 'audits', // 'audits' | 'validation'
      searchQuery: '',
      statusFilter: 'all',     // 'all' | 'Open' | 'Close'
      deptFilter: 'all',       // Action Department
      unitFilter: 'all',       // Action Unit
      elementFilter: 'all',    // PSM Element (MC, RA&PHA, MOC-F, PSI, General)
      natureFilter: 'all',     // Severity / Nature (Major, Minor, Suggestion, PSG)
      auditFilter: 'all',      // Audit No
      chartBreakdownMode: 'element', // 'element' | 'severity'
      page: 1,
      pageSize: 15,
      deptTableSort: { col: 'total', dir: 'desc' },
      unitTableSort: { col: 'total', dir: 'desc' },
      deptBarViewMode: 'chart', // 'chart' | 'table' | 'split'
      auditTrendMode: 'dept', // 'dept' | 'audit'
      auditTrendViewType: 'side-by-side', // 'side-by-side' | 'trend' | 'stacked'
      isSyncing: false,
      lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      selectedFinding: null,

      // Dedicated state for PSM Validation Sub-Dashboard
      validationState: {
        searchQuery: '',
        trainingFilter: 'all',    // 'all' | 'Yes' | 'No'
        statusFilter: 'all',      // 'all' | 'Pass' | 'Fail' | 'Pending'
        deptFilter: 'all',        // Department
        cadreFilter: 'all',       // 'all' | 'Mngt' | 'JMC' | 'Staff'
        moduleFilter: 'all',      // 'all' | 'T&D'
        unitFilter: 'all',        // Unit
        deptBarViewMode: 'chart', // 'chart' | 'table' | 'split'
        trendMode: 'dept',        // 'dept' | 'cadre'
        trendViewType: 'side-by-side', // 'side-by-side' | 'trend' | 'stacked'
        page: 1,
        pageSize: 15,
        isSyncing: false,
        lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        selectedItem: null
      }
    },

    init() {
      window.FPCL_PSM_SUITE = this;

      // Permanently lock hardcoded Google Sheet CSV URL so connection never breaks
      window.FPCL_PSM_SHEET_URL = HARDCODED_PSM_SHEET_URL;
      try {
        localStorage.setItem('FPCL_PSM_SHEET_URL', HARDCODED_PSM_SHEET_URL);
      } catch (e) {}

      // Fast-paint from localStorage cache if present (PSM Audits)
      try {
        const cached = localStorage.getItem('FPCL_PSM_DATA_CACHE');
        if (cached) {
          const parsedCached = JSON.parse(cached);
          if (Array.isArray(parsedCached) && parsedCached.length > 0) {
            window.FPCL_PSM_DATA = parsedCached;
          }
        }
      } catch (e) {}

      // Fast-paint from localStorage cache if present (PSM Validation)
      try {
        const cachedVal = localStorage.getItem('FPCL_PSM_VALIDATION_CACHE');
        if (cachedVal) {
          const parsedVal = JSON.parse(cachedVal);
          if (Array.isArray(parsedVal) && parsedVal.length > 0) {
            window.FPCL_PSM_VALIDATION_DATA = parsedVal;
          }
        }
      } catch (e) {}

      // Auto-load embedded data if not yet loaded
      if (!window.FPCL_PSM_DATA && window.FPCL_PSM_RAW_CSV && typeof window.parsePSMCSV === 'function') {
        window.FPCL_PSM_DATA = window.parsePSMCSV(window.FPCL_PSM_RAW_CSV);
      }

      // Sync initial stats to portal Overview
      this.syncPsmStatsToOverview();

      // Trigger automatic live Google Sheets sync on launch
      setTimeout(() => {
        this.syncLiveFeed({ silent: true });
        this.syncValidationLiveFeed({ silent: true });
      }, 700);

      // Periodic auto-sync every 60 seconds so sheet additions/deletions reflect live
      if (!this._autoSyncTimer) {
        this._autoSyncTimer = setInterval(() => {
          this.syncLiveFeed({ silent: true });
          this.syncValidationLiveFeed({ silent: true });
        }, 60000);
      }
    },

    syncPsmStatsToOverview() {
      const data = this.getRawData();
      if (!data || data.length === 0) return;

      const total = data.length;
      const closed = data.filter(i => i.status === 'Close').length;
      const open = total - closed;
      const rate = total > 0 ? ((closed / total) * 100).toFixed(1) + '%' : '0.0%';

      const depts = new Set(data.map(i => i.actionDepartment).filter(Boolean));

      if (window.DASHBOARD_REGISTRY) {
        const psmEntry = window.DASHBOARD_REGISTRY.find(d => d.id === 'sub-hse-psm');
        if (psmEntry) {
          psmEntry.name = 'PSM Audits';
          psmEntry.code = 'PSM Audits';
          psmEntry.kpis = { total, closed, inProgress: open, overdue: 0, compliance: rate };
          psmEntry.punchList = { open, closed, total, rate };
          psmEntry.statusComment = `${total} audit observations tracked across ${depts.size} Action Departments (${closed} Closed, ${open} Open, ${rate} Closure Rate).`;
        }

        const valEntry = window.DASHBOARD_REGISTRY.find(d => d.id === 'psm-validation');
        if (valEntry) {
          const valRaw = (typeof this.getRawValidationData === 'function') ? this.getRawValidationData() : (window.FPCL_PSM_VALIDATION_DATA || []);
          if (valRaw && valRaw.length > 0) {
            const vTotal = valRaw.length;
            const vPassed = valRaw.filter(i => (i.status || '').toLowerCase() === 'pass').length;
            const vFailed = valRaw.filter(i => (i.status || '').toLowerCase() === 'fail').length;
            const vPending = vTotal - vPassed - vFailed;
            const vRate = vTotal > 0 ? ((vPassed / vTotal) * 100).toFixed(1) + '%' : '0.0%';
            valEntry.kpis = { total: vTotal, closed: vPassed, inProgress: vPending, overdue: 0, compliance: vRate };
            valEntry.punchList = { open: vPending, closed: vPassed, total: vTotal, rate: vRate };
            valEntry.statusComment = `${vTotal} personnel tracked in PSM Validation (${vPassed} Passed, ${vPending} Pending, ${vRate} Qualification Rate).`;
          }
        }
      }

      if (window.portalApp) {
        if (typeof window.portalApp.updateRollupStats === 'function') {
          window.portalApp.updateRollupStats();
        }
        if (typeof window.portalApp.renderCards === 'function') {
          window.portalApp.renderCards();
        }
        if (typeof window.portalApp.renderComparisonChart === 'function') {
          window.portalApp.renderComparisonChart();
        }
        if (typeof window.portalApp.renderPunchListTable === 'function') {
          window.portalApp.renderPunchListTable();
        }
      }
    },

    getRawData() {
      if (Array.isArray(window.FPCL_PSM_DATA) && window.FPCL_PSM_DATA.length > 0) {
        return window.FPCL_PSM_DATA;
      }
      if (window.FPCL_PSM_RAW_CSV && typeof window.parsePSMCSV === 'function') {
        window.FPCL_PSM_DATA = window.parsePSMCSV(window.FPCL_PSM_RAW_CSV);
        return window.FPCL_PSM_DATA;
      }
      return [];
    },

    // Apply all active filters to the dataset
    getFilteredData() {
      const raw = this.getRawData();
      const s = this.state;

      return raw.filter(item => {
        // Status filter
        if (s.statusFilter !== 'all') {
          if (item.status.toLowerCase() !== s.statusFilter.toLowerCase()) {
            return false;
          }
        }

        // Action Department filter
        if (s.deptFilter !== 'all') {
          if (item.actionDepartment !== s.deptFilter) {
            return false;
          }
        }

        // Action Unit filter
        if (s.unitFilter !== 'all') {
          if (item.actionUnit !== s.unitFilter) {
            return false;
          }
        }

        // PSM Element filter
        if (s.elementFilter !== 'all') {
          if (item.psmElement !== s.elementFilter) {
            return false;
          }
        }

        // Nature / Severity filter
        if (s.natureFilter !== 'all') {
          if (item.nature !== s.natureFilter) {
            return false;
          }
        }

        // Audit No filter
        if (s.auditFilter !== 'all') {
          if (item.auditNo !== s.auditFilter) {
            return false;
          }
        }

        // Keyword Search across multiple fields
        if (s.searchQuery.trim()) {
          const q = s.searchQuery.toLowerCase().trim();
          const match = 
            (item.observationNo && item.observationNo.toLowerCase().includes(q)) ||
            (item.finding && item.finding.toLowerCase().includes(q)) ||
            (item.actionDepartment && item.actionDepartment.toLowerCase().includes(q)) ||
            (item.actionUnit && item.actionUnit.toLowerCase().includes(q)) ||
            (item.psmElement && item.psmElement.toLowerCase().includes(q)) ||
            (item.nature && item.nature.toLowerCase().includes(q)) ||
            (item.actionRemarks && item.actionRemarks.toLowerCase().includes(q)) ||
            (item.hseqRemarks && item.hseqRemarks.toLowerCase().includes(q));
          
          if (!match) return false;
        }

        return true;
      });
    },

    // Aggregate dynamic statistics by department
    getDepartmentAggregation(data) {
      const map = {};
      data.forEach(item => {
        const dept = item.actionDepartment || 'Unassigned';
        if (!map[dept]) {
          map[dept] = { name: dept, total: 0, open: 0, close: 0 };
        }
        map[dept].total += 1;
        if (item.status === 'Close') {
          map[dept].close += 1;
        } else {
          map[dept].open += 1;
        }
      });

      const list = Object.values(map).map(d => ({
        ...d,
        closureRate: d.total > 0 ? Math.round((d.close / d.total) * 100) : 0
      }));

      // Sort
      const { col, dir } = this.state.deptTableSort;
      list.sort((a, b) => {
        let vA = a[col];
        let vB = b[col];
        if (typeof vA === 'string') {
          return dir === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
        }
        return dir === 'asc' ? vA - vB : vB - vA;
      });

      return list;
    },

    // Aggregate dynamic statistics by unit
    getUnitAggregation(data) {
      const map = {};
      data.forEach(item => {
        const unit = item.actionUnit || 'Unassigned';
        if (!map[unit]) {
          map[unit] = { name: unit, total: 0, open: 0, close: 0 };
        }
        map[unit].total += 1;
        if (item.status === 'Close') {
          map[unit].close += 1;
        } else {
          map[unit].open += 1;
        }
      });

      const list = Object.values(map).map(u => ({
        ...u,
        closureRate: u.total > 0 ? Math.round((u.close / u.total) * 100) : 0
      }));

      // Sort
      const { col, dir } = this.state.unitTableSort;
      list.sort((a, b) => {
        let vA = a[col];
        let vB = b[col];
        if (typeof vA === 'string') {
          return dir === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
        }
        return dir === 'asc' ? vA - vB : vB - vA;
      });

      return list;
    },

    // Aggregate by PSM Element
    getElementAggregation(data) {
      const map = {};
      data.forEach(item => {
        const el = item.psmElement || 'General';
        if (!map[el]) {
          map[el] = { name: el, count: 0, open: 0, close: 0 };
        }
        map[el].count += 1;
        if (item.status === 'Close') map[el].close += 1;
        else map[el].open += 1;
      });

      const total = data.length || 1;
      return Object.values(map)
        .sort((a, b) => b.count - a.count)
        .map(e => ({
          ...e,
          percentage: Math.round((e.count / total) * 100)
        }));
    },

    // Aggregate by Severity / Nature
    getSeverityAggregation(data) {
      const map = {};
      data.forEach(item => {
        const nat = item.nature || 'Minor';
        if (!map[nat]) {
          map[nat] = { name: nat, count: 0, open: 0, close: 0 };
        }
        map[nat].count += 1;
        if (item.status === 'Close') map[nat].close += 1;
        else map[nat].open += 1;
      });

      const total = data.length || 1;
      return Object.values(map)
        .sort((a, b) => b.count - a.count)
        .map(s => ({
          ...s,
          percentage: Math.round((s.count / total) * 100)
        }));
    },

    // Dynamic description generation reflecting live filters and metrics (empty per design)
    getDynamicDescription() {
      return '';
    },

    // Handle interactive click on donut slices or legends to filter dashboard and open data modal
    onDonutSliceClick(type, value) {
      this.hideTooltip();
      const raw = this.getRawData();
      if (type === 'element') {
        this.state.elementFilter = value;
        const records = raw.filter(d => d.psmElement === value);
        const openCount = records.filter(d => (d.status || '').toLowerCase() === 'open').length;
        const closedCount = records.length - openCount;
        this.render();
        this.openDataModal({
          title: `PSM Element: ${value}`,
          badge: 'PSM Element',
          subtitle: `${records.length} Findings in ${value} (${closedCount} Closed, ${openCount} Open)`,
          filterElement: value,
          filterDept: 'all',
          filterUnit: 'all',
          filterNature: 'all',
          filterStatus: 'all',
          records: records
        });
      } else {
        this.state.natureFilter = value;
        const records = raw.filter(d => d.nature === value);
        const openCount = records.filter(d => (d.status || '').toLowerCase() === 'open').length;
        const closedCount = records.length - openCount;
        this.render();
        this.openDataModal({
          title: `Severity: ${value}`,
          badge: 'Severity',
          subtitle: `${records.length} Findings with Severity ${value} (${closedCount} Closed, ${openCount} Open)`,
          filterNature: value,
          filterElement: 'all',
          filterDept: 'all',
          filterUnit: 'all',
          filterStatus: 'all',
          records: records
        });
      }
    },

    // Handle click on any general part of donut (center hub, background track, or donut wrapper)
    onDonutGeneralClick() {
      this.hideTooltip();
      const raw = this.getRawData();
      const total = raw.length;
      const openCount = raw.filter(d => (d.status || '').toLowerCase() === 'open').length;
      const closedCount = total - openCount;
      const isElement = this.state.chartBreakdownMode === 'element';
      this.openDataModal({
        title: isElement ? 'Audit Breakdown: All PSM Elements' : 'Audit Breakdown: All Severity Levels',
        badge: 'Audit Scope',
        subtitle: `${total} Total Audit Findings (${closedCount} Closed, ${openCount} Open)`,
        filterElement: 'all',
        filterDept: 'all',
        filterUnit: 'all',
        filterNature: 'all',
        filterStatus: 'all',
        records: raw
      });
    },

    // Switch between PSM Audits and PSM Validation sub-dashboards
    setSubDashboard(tab) {
      this.state.activeSubDashboard = tab === 'validation' ? 'validation' : 'audits';

      if (window.portalApp && window.portalApp.state) {
        window.portalApp.state.activeDashboardId = (tab === 'validation') ? 'psm-validation' : 'sub-hse-psm';
        document.body.setAttribute('data-active-dashboard', window.portalApp.state.activeDashboardId);
        if (typeof window.portalApp.renderNavMenu === 'function') {
          window.portalApp.renderNavMenu();
        }
      }

      const headerCard = document.getElementById('detail-header-card');
      const breadcrumbEl = document.getElementById('breadcrumb-active-name');
      const titleEl = document.getElementById('detail-title');
      const psmActions = document.getElementById('detail-psm-actions');
      const sheetKeyEl = document.getElementById('detail-sheet-key');
      const headerSearchInput = document.getElementById('psm-header-search-input');

      if (this.state.activeSubDashboard === 'audits') {
        if (headerCard) headerCard.classList.remove('hidden');
        if (breadcrumbEl) breadcrumbEl.textContent = 'PSM / PSM Audits';
        if (titleEl) {
          titleEl.textContent = 'PSM';
          titleEl.className = 'text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2';
        }
        if (psmActions) {
          psmActions.classList.remove('hidden');
          if (headerSearchInput) {
            headerSearchInput.placeholder = 'SEARCH FINDINGS...';
            headerSearchInput.value = this.state.searchQuery || '';
          }
        }
        if (sheetKeyEl) {
          const raw = this.getRawData();
          const closed = raw.filter(p => p.status === 'Close').length;
          const open = raw.length - closed;
          sheetKeyEl.textContent = `PSM Audit Phase 1 • ${raw.length} Observations (${closed} Closed, ${open} Open)`;
          sheetKeyEl.title = 'Live Google Sheets: PSM Audit Phase 1 June 2026';
        }
      } else {
        // Remove the top PSM banner bar on PSM Validation dashboard
        if (headerCard) headerCard.classList.add('hidden');
        if (breadcrumbEl) breadcrumbEl.textContent = 'PSM / PSM Validation';
        if (titleEl) {
          titleEl.textContent = 'PSM';
          titleEl.className = 'text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2';
        }
        if (psmActions) {
          psmActions.classList.remove('hidden');
          if (headerSearchInput) {
            headerSearchInput.placeholder = 'SEARCH PERSONNEL...';
            headerSearchInput.value = (this.state.validationState && this.state.validationState.searchQuery) || '';
          }
        }
        if (sheetKeyEl) {
          const vRaw = this.getRawValidationData();
          const vTrained = vRaw.filter(i => (i.training || '').toLowerCase() === 'yes').length;
          const vPassed = vRaw.filter(i => (i.status || '').toLowerCase() === 'pass').length;
          sheetKeyEl.textContent = `PSM Validation • ${vRaw.length} Personnel (${vTrained} Trained, ${vPassed} Passed)`;
          sheetKeyEl.title = 'Live Google Sheets: PSM_Validation_sheet_URL';
        }
      }

      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // -----------------------------------------------------------------------
    // PSM VALIDATION SUB-DASHBOARD DATA & CONTROLS
    // -----------------------------------------------------------------------
    getRawValidationData() {
      if (Array.isArray(window.FPCL_PSM_VALIDATION_DATA) && window.FPCL_PSM_VALIDATION_DATA.length > 0) {
        return window.FPCL_PSM_VALIDATION_DATA;
      }
      return [];
    },

    getFilteredValidationData() {
      const raw = this.getRawValidationData();
      const vs = this.state.validationState || {};
      const q = (vs.searchQuery || '').trim().toLowerCase();

      return raw.filter(item => {
        // Search query across all employee attributes
        if (q) {
          const match =
            (item.name && item.name.toLowerCase().includes(q)) ||
            (item.pNo && item.pNo.toLowerCase().includes(q)) ||
            (item.position && item.position.toLowerCase().includes(q)) ||
            (item.unit && item.unit.toLowerCase().includes(q)) ||
            (item.department && item.department.toLowerCase().includes(q)) ||
            (item.cadre && item.cadre.toLowerCase().includes(q)) ||
            (item.module && item.module.toLowerCase().includes(q)) ||
            (item.endUserRemarks && item.endUserRemarks.toLowerCase().includes(q)) ||
            (item.safetyRemarks && item.safetyRemarks.toLowerCase().includes(q));
          if (!match) return false;
        }

        // Training filter (Yes / No)
        if (vs.trainingFilter && vs.trainingFilter !== 'all') {
          if ((item.training || '').toLowerCase() !== vs.trainingFilter.toLowerCase()) return false;
        }

        // Validation Result / Status filter (Pass / Fail / Pending)
        if (vs.statusFilter && vs.statusFilter !== 'all') {
          if ((item.status || '').toLowerCase() !== vs.statusFilter.toLowerCase()) return false;
        }

        // Department filter
        if (vs.deptFilter && vs.deptFilter !== 'all') {
          if (item.department !== vs.deptFilter) return false;
        }

        // Unit filter
        if (vs.unitFilter && vs.unitFilter !== 'all') {
          if (item.unit !== vs.unitFilter) return false;
        }

        // Cadre filter (Mngt / JMC / Staff)
        if (vs.cadreFilter && vs.cadreFilter !== 'all') {
          if (item.cadre !== vs.cadreFilter) return false;
        }

        // Module filter (e.g. T&D)
        if (vs.moduleFilter && vs.moduleFilter !== 'all') {
          const m = (item.module && item.module.trim()) || 'T&D';
          if (m.toLowerCase() !== vs.moduleFilter.trim().toLowerCase()) return false;
        }

        return true;
      });
    },

    setValidationFilter(key, val) {
      if (!this.state.validationState) {
        this.state.validationState = {};
      }
      this.state.validationState[key] = val;
      this.state.validationState.page = 1;
      this.render();
    },

    clearValidationFilters() {
      if (!this.state.validationState) {
        this.state.validationState = {};
      }
      this.state.validationState.searchQuery = '';
      this.state.validationState.trainingFilter = 'all';
      this.state.validationState.statusFilter = 'all';
      this.state.validationState.deptFilter = 'all';
      this.state.validationState.cadreFilter = 'all';
      this.state.validationState.moduleFilter = 'all';
      this.state.validationState.unitFilter = 'all';
      this.state.validationState.page = 1;

      const headerSearch = document.getElementById('psm-header-search-input');
      if (headerSearch && this.state.activeSubDashboard === 'validation') {
        headerSearch.value = '';
      }

      this.render();
      if (window.portalApp && window.portalApp.showToast) {
        window.portalApp.showToast('Filters Cleared', 'Reset all PSM Validation filters to show all personnel.', 'info');
      }
    },

    setValidationPage(p) {
      if (!this.state.validationState) return;
      this.state.validationState.page = p;
      this.render();
      const table = document.getElementById('psm-val-records-table-container');
      if (table) table.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    setValidationPageSize(sz) {
      if (!this.state.validationState) return;
      this.state.validationState.pageSize = sz;
      this.state.validationState.page = 1;
      this.render();
    },

    setDeptBarViewMode(mode) {
      this.state.deptBarViewMode = mode;
      this.render();
    },

    setAuditTrendMode(mode) {
      this.state.auditTrendMode = mode;
      this.render();
    },

    setAuditTrendViewType(viewType) {
      this.state.auditTrendViewType = viewType;
      this.render();
    },

    setValidationDeptBarViewMode(mode) {
      if (!this.state.validationState) this.state.validationState = {};
      this.state.validationState.deptBarViewMode = mode;
      this.render();
    },

    setValidationTrendMode(mode) {
      if (!this.state.validationState) this.state.validationState = {};
      this.state.validationState.trendMode = mode;
      this.render();
    },

    setValidationTrendViewType(viewType) {
      if (!this.state.validationState) this.state.validationState = {};
      this.state.validationState.trendViewType = viewType;
      this.render();
    },

    // Filter-Aware CSV Export for PSM Validation
    exportValidationCSV() {
      const data = this.getFilteredValidationData();
      if (!data || data.length === 0) {
        if (window.portalApp && window.portalApp.showToast) {
          window.portalApp.showToast('No Data', 'No validation records match your current filter criteria.', 'warning');
        }
        return;
      }

      const headers = [
        'Sr #',
        'P. No.',
        'Name',
        'Position',
        'Unit',
        'Department',
        'Cadre',
        'Training',
        'Validation Status',
        'PSM Module',
        'End User Remarks',
        'Safety Remarks'
      ];

      const rows = data.map((d, i) => [
        d.sr || (i + 1),
        `"${String(d.pNo || '').replace(/"/g, '""')}"`,
        `"${String(d.name || '').replace(/"/g, '""')}"`,
        `"${String(d.position || '').replace(/"/g, '""')}"`,
        `"${String(d.unit || '').replace(/"/g, '""')}"`,
        `"${String(d.department || '').replace(/"/g, '""')}"`,
        `"${String(d.cadre || '').replace(/"/g, '""')}"`,
        `"${String(d.training || '').replace(/"/g, '""')}"`,
        `"${String(d.status || '').replace(/"/g, '""')}"`,
        `"${String(d.module || '').replace(/"/g, '""')}"`,
        `"${String(d.endUserRemarks || '').replace(/"/g, '""')}"`,
        `"${String(d.safetyRemarks || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `FPCL_PSM_Validation_Filtered_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (window.portalApp && window.portalApp.showToast) {
        window.portalApp.showToast(
          'CSV Export Ready',
          `Successfully exported ${data.length} filtered validation records to CSV.`,
          'success'
        );
      }
    },

    // Filter-Aware CSV Export for PSM Audits
    exportAuditsCSV() {
      const data = this.getFilteredData();
      if (!data || data.length === 0) {
        if (window.portalApp && window.portalApp.showToast) {
          window.portalApp.showToast('No Data', 'No audit findings match your current filter criteria.', 'warning');
        }
        return;
      }

      const headers = [
        'Sr.',
        'Observation No.',
        'PSM Element',
        'Audit No.',
        'Auditee Department',
        'Auditee Unit',
        'Observation / Findings',
        'Action Department',
        'Action Unit',
        'Nature of Findings',
        'Action Department Remarks',
        'Status',
        'HSEQ Remarks',
        'Closure Date',
        'Audit Team',
        'Target Date'
      ];

      const rows = data.map((d, i) => [
        i + 1,
        `"${String(d.observationNo || '').replace(/"/g, '""')}"`,
        `"${String(d.psmElement || '').replace(/"/g, '""')}"`,
        `"${String(d.auditNo || '').replace(/"/g, '""')}"`,
        `"${String(d.auditeeDepartment || '').replace(/"/g, '""')}"`,
        `"${String(d.auditeeUnit || '').replace(/"/g, '""')}"`,
        `"${String(d.finding || '').replace(/"/g, '""')}"`,
        `"${String(d.actionDepartment || '').replace(/"/g, '""')}"`,
        `"${String(d.actionUnit || '').replace(/"/g, '""')}"`,
        `"${String(d.nature || '').replace(/"/g, '""')}"`,
        `"${String(d.actionRemarks || '').replace(/"/g, '""')}"`,
        `"${String(d.status || '').replace(/"/g, '""')}"`,
        `"${String(d.hseqRemarks || '').replace(/"/g, '""')}"`,
        `"${String(d.closureDate || '').replace(/"/g, '""')}"`,
        `"${String(d.auditTeam || '').replace(/"/g, '""')}"`,
        `"${String(d.targetDate || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `FPCL_PSM_Audits_Filtered_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (window.portalApp && window.portalApp.showToast) {
        window.portalApp.showToast(
          'CSV Export Ready',
          `Successfully exported ${data.length} filtered audit findings to CSV.`,
          'success'
        );
      }
    },

    // Header Export CSV Button Handler
    exportFilteredCSV() {
      if (this.state.activeSubDashboard === 'validation') {
        this.exportValidationCSV();
      } else {
        this.exportAuditsCSV();
      }
    },

    // Header Reset Button Handler
    resetAllFilters() {
      if (this.state.activeSubDashboard === 'validation') {
        this.clearValidationFilters();
      } else {
        this.resetFilters();
      }
    },

    // Live Google Sheets synchronization for PSM Validation
    async syncValidationLiveFeed(opts = {}) {
      const silent = !!opts.silent;
      const vs = this.state.validationState || {};
      vs.isSyncing = true;

      const syncIcon = document.getElementById('psm-header-sync-icon');
      if (syncIcon) syncIcon.classList.add('animate-spin');

      try {
        const res = await fetch('/api/sheets/fetch?sheetTab=validation', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data && data.csvText && typeof window.parseValidationCSV === 'function') {
          const parsed = window.parseValidationCSV(data.csvText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.FPCL_PSM_VALIDATION_DATA = parsed;
            try {
              localStorage.setItem('FPCL_PSM_VALIDATION_CACHE', JSON.stringify(parsed));
            } catch (e) {}

            vs.lastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            this.syncPsmStatsToOverview();
            if (!silent && window.portalApp && window.portalApp.showToast) {
              window.portalApp.showToast(
                'Live Sheet Synced',
                `Synchronized ${parsed.length} PSM Validation records from Google Sheets.`,
                'success'
              );
            }
          }
        }
      } catch (err) {
        console.warn('Validation live sync warning (using baseline):', err);
      } finally {
        vs.isSyncing = false;
        if (syncIcon) syncIcon.classList.remove('animate-spin');
        if (this.state.activeSubDashboard === 'validation') {
          this.render();
        }
      }
    },

    // Modal Inspection for Personnel Validation Item
    inspectValidationItem(sr) {
      const raw = this.getRawValidationData();
      const item = raw.find(i => String(i.sr) === String(sr));
      if (!item) return;

      this.state.validationState.selectedItem = item;
      const modalContainer = document.getElementById('psm-validation-inspection-modal');
      if (modalContainer) {
        modalContainer.innerHTML = this.renderValidationInspectionModalContent(item);
        modalContainer.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
      }
    },

    closeValidationInspectionModal() {
      if (this.state.validationState) {
        this.state.validationState.selectedItem = null;
      }
      const modalContainer = document.getElementById('psm-validation-inspection-modal');
      if (modalContainer) {
        modalContainer.classList.add('hidden');
        modalContainer.innerHTML = '';
      }
    },

    renderValidationInspectionModalContent(item) {
      const isPass = (item.status || '').toLowerCase() === 'pass';
      const isTrained = (item.training || '').toLowerCase() === 'yes';

      return `
        <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <!-- Modal Header -->
            <div class="bg-gradient-to-r from-teal-800 to-slate-900 text-white p-5 flex items-start justify-between">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-400/20 text-teal-200 border border-teal-400/30">
                    P. No. ${item.pNo || 'N/A'}
                  </span>
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${isPass ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30' : 'bg-rose-500/20 text-rose-200 border border-rose-400/30'}">
                    ${item.status || 'Pending'}
                  </span>
                </div>
                <h3 class="text-xl font-black tracking-tight text-white">${item.name || 'Personnel Profile'}</h3>
                <p class="text-xs text-teal-100 font-medium">${item.position || 'N/A'} • ${item.department || 'N/A'}</p>
              </div>
              <button
                type="button"
                onclick="FPCL_PSM_SUITE.closeValidationInspectionModal()"
                class="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="Close modal"
              >
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>

            <!-- Modal Body Details -->
            <div class="p-6 space-y-5 text-slate-800 text-xs">
              <!-- Grid Matrix -->
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Cadre</span>
                  <span class="font-black text-sm text-slate-800 mt-0.5 block">${item.cadre || 'N/A'}</span>
                </div>
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Unit</span>
                  <span class="font-bold text-sm text-slate-800 mt-0.5 block font-mono">${item.unit || 'General'}</span>
                </div>
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">PSM Module</span>
                  <span class="font-bold text-sm text-teal-700 mt-0.5 block">${item.module || 'T&D'}</span>
                </div>
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Training Completed</span>
                  <span class="font-bold text-sm mt-0.5 flex items-center gap-1.5 ${isTrained ? 'text-emerald-700' : 'text-amber-700'}">
                    <span class="w-2 h-2 rounded-full ${isTrained ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                    ${item.training || 'No'}
                  </span>
                </div>
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Qualification Status</span>
                  <span class="font-bold text-sm mt-0.5 flex items-center gap-1.5 ${isPass ? 'text-emerald-700' : 'text-rose-700'}">
                    <span class="w-2 h-2 rounded-full ${isPass ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                    ${item.status || 'Pending'}
                  </span>
                </div>
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Record Serial</span>
                  <span class="font-mono font-bold text-sm text-slate-600 mt-0.5 block">#${item.sr || '1'}</span>
                </div>
              </div>

              <!-- Remarks Panels -->
              <div class="space-y-3 pt-1">
                <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span class="text-[10px] uppercase font-bold text-slate-500 block mb-1 tracking-wider">End User Remarks</span>
                  <p class="text-xs text-slate-700 leading-relaxed font-medium">
                    ${item.endUserRemarks ? item.endUserRemarks : '<span class="text-slate-400 italic">No specific remarks logged by end user.</span>'}
                  </p>
                </div>

                <div class="p-3.5 rounded-xl bg-teal-50/50 border border-teal-100">
                  <span class="text-[10px] uppercase font-bold text-teal-700 block mb-1 tracking-wider">Safety & HSEQ Remarks</span>
                  <p class="text-xs text-slate-700 leading-relaxed font-medium">
                    ${item.safetyRemarks ? item.safetyRemarks : '<span class="text-slate-400 italic">Compliant with current Process Safety Training & Development standard.</span>'}
                  </p>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onclick="FPCL_PSM_SUITE.setValidationFilter('deptFilter', '${item.department}'); FPCL_PSM_SUITE.closeValidationInspectionModal();"
                class="px-3.5 py-2 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-all cursor-pointer"
              >
                Filter for ${item.department}
              </button>
              <button
                type="button"
                onclick="FPCL_PSM_SUITE.closeValidationInspectionModal()"
                class="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-all cursor-pointer shadow-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      `;
    },

    // =======================================================================
    // FULL PRODUCTION PSM VALIDATION SUB-DASHBOARD
    // =======================================================================
    renderValidationSubDashboard() {
      const raw = this.getRawValidationData();
      const filtered = this.getFilteredValidationData();
      const vs = this.state.validationState || {};

      const totalRaw = raw.length;
      const totalFiltered = filtered.length;

      // Metrics computation
      const trainedYesCount = filtered.filter(i => (i.training || '').toLowerCase() === 'yes').length;
      const trainedNoCount = totalFiltered - trainedYesCount;
      const trainingPct = totalFiltered > 0 ? Math.round((trainedYesCount / totalFiltered) * 100) : 0;

      const passedCount = filtered.filter(i => (i.status || '').toLowerCase() === 'pass').length;
      const failedCount = filtered.filter(i => (i.status || '').toLowerCase() === 'fail').length;
      const pendingCount = totalFiltered - passedCount - failedCount;
      const passPct = totalFiltered > 0 ? Math.round((passedCount / totalFiltered) * 100) : 0;

      // Cadre metrics
      const mngtCount = filtered.filter(i => (i.cadre || '').toLowerCase() === 'mngt').length;
      const jmcCount = filtered.filter(i => (i.cadre || '').toLowerCase() === 'jmc').length;
      const staffCount = filtered.filter(i => (i.cadre || '').toLowerCase() === 'staff').length;

      // Cadre items with colorful palette for Donut Chart
      const cadreItems = [
        { key: 'JMC', label: 'Junior Management Cadre (JMC)', short: 'JMC', count: jmcCount, color: '#0284C7', desc: 'Shift supervisors, plant engineers & field technicians' },
        { key: 'Mngt', label: 'Management Cadre (Mngt)', short: 'Mngt', count: mngtCount, color: '#8B5CF6', desc: 'Senior operations, engineering & departmental leads' },
        { key: 'Staff', label: 'Staff Cadre', short: 'Staff', count: staffCount, color: '#10B981', desc: 'Operating crews, maintenance support & plant technicians' }
      ];

      // Dropdown Unique Values from RAW
      const allDepts = Array.from(new Set(raw.map(i => i.department).filter(Boolean))).sort();
      const allCadres = Array.from(new Set(raw.map(i => i.cadre).filter(Boolean))).sort();
      const allUnits = Array.from(new Set(raw.map(i => i.unit).filter(Boolean))).sort();
      const allModules = Array.from(new Set(raw.map(i => (i.module || '').trim()).filter(Boolean))).sort();
      if (allModules.length === 0) allModules.push('T&D');

      // Department Aggregations for Interactive Breakdown
      const deptMap = {};
      filtered.forEach(item => {
        const d = item.department || 'Unassigned';
        if (!deptMap[d]) {
          deptMap[d] = { total: 0, trained: 0, passed: 0 };
        }
        deptMap[d].total++;
        if ((item.training || '').toLowerCase() === 'yes') deptMap[d].trained++;
        if ((item.status || '').toLowerCase() === 'pass') deptMap[d].passed++;
      });
      const deptBreakdown = Object.entries(deptMap)
        .map(([name, stats]) => ({
          name,
          total: stats.total,
          trained: stats.trained,
          untrained: stats.total - stats.trained,
          compliance: stats.total > 0 ? Math.round((stats.trained / stats.total) * 100) : 0
        }))
        .sort((a, b) => b.total - a.total);

      // Module Validation Aggregations for Interactive Breakdown (Pass / Fail Bar Chart)
      const moduleMap = {};
      filtered.forEach(item => {
        const m = (item.module && item.module.trim()) || 'T&D';
        if (!moduleMap[m]) {
          moduleMap[m] = { total: 0, passed: 0, failed: 0, pending: 0 };
        }
        moduleMap[m].total++;
        const st = (item.status || '').trim().toLowerCase();
        if (st === 'pass') {
          moduleMap[m].passed++;
        } else if (st === 'fail') {
          moduleMap[m].failed++;
        } else {
          moduleMap[m].pending++;
        }
      });
      const moduleBreakdown = Object.entries(moduleMap)
        .map(([name, stats]) => ({
          name,
          total: stats.total,
          passed: stats.passed,
          failed: stats.failed,
          pending: stats.pending,
          passRate: stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0
        }))
        .sort((a, b) => b.total - a.total);

      // Cadre Qualification Aggregations for visual matrix in analytical section
      const cadreMap = {};
      filtered.forEach(item => {
        const c = (item.cadre && item.cadre.trim()) || 'Other';
        if (!cadreMap[c]) {
          cadreMap[c] = { total: 0, passed: 0, trained: 0 };
        }
        cadreMap[c].total++;
        if ((item.status || '').toLowerCase() === 'pass') cadreMap[c].passed++;
        if ((item.training || '').toLowerCase() === 'yes') cadreMap[c].trained++;
      });
      const cadreBreakdown = Object.entries(cadreMap)
        .map(([name, stats]) => ({
          name,
          total: stats.total,
          passed: stats.passed,
          trained: stats.trained,
          passRate: stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0,
          trainedRate: stats.total > 0 ? Math.round((stats.trained / stats.total) * 100) : 0
        }))
        .sort((a, b) => b.total - a.total);

      // Pagination slice for records table
      const pageSize = vs.pageSize === 'all' ? filtered.length : parseInt(vs.pageSize || 15, 10);
      const totalPages = Math.max(1, Math.ceil(filtered.length / (pageSize || 1)));
      const currentPage = Math.min(vs.page || 1, totalPages);
      const startIndex = (currentPage - 1) * pageSize;
      const pageItems = filtered.slice(startIndex, startIndex + pageSize);

      // Active filters checking
      const isAnyFilterActive =
        (vs.searchQuery && vs.searchQuery.trim() !== '') ||
        (vs.deptFilter && vs.deptFilter !== 'all') ||
        (vs.cadreFilter && vs.cadreFilter !== 'all') ||
        (vs.trainingFilter && vs.trainingFilter !== 'all') ||
        (vs.statusFilter && vs.statusFilter !== 'all') ||
        (vs.unitFilter && vs.unitFilter !== 'all') ||
        (vs.moduleFilter && vs.moduleFilter !== 'all');

      return `
        <!-- PSM VALIDATION SUB-DASHBOARD CONTAINER -->
        <div class="space-y-6 font-sans">

          <!-- 1. Executive Action & Live Status Bar (Streamlined) -->
          <div class="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white rounded-2xl px-5 py-3.5 shadow-sm border border-teal-500/30 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="absolute -right-10 -bottom-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="relative z-10 flex items-center gap-2">
              <span class="inline-flex items-center gap-2 text-xs text-slate-300 font-mono">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Last Synced: ${vs.lastSynced || 'Active'}</span>
              </span>
            </div>

            <!-- Top Quick Actions -->
            <div class="relative z-10 shrink-0 flex items-center flex-wrap gap-2.5">
              <button
                type="button"
                onclick="FPCL_PSM_SUITE.syncValidationLiveFeed()"
                class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Force re-fetch from Google Sheets"
              >
                <i data-lucide="refresh-cw" class="w-3.5 h-3.5 ${vs.isSyncing ? 'animate-spin' : ''}"></i>
                <span>${vs.isSyncing ? 'Syncing...' : 'Sync Live Sheet'}</span>
              </button>

              <button
                type="button"
                onclick="FPCL_PSM_SUITE.exportValidationCSV()"
                class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-900/30 transition-all cursor-pointer active:scale-95"
                title="Download CSV of current filtered personnel"
              >
                <i data-lucide="download" class="w-3.5 h-3.5"></i>
                <span>Export Filtered CSV (${totalFiltered})</span>
              </button>

              <button
                type="button"
                onclick="FPCL_PSM_SUITE.setSubDashboard('audits')"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Return to PSM Audits sub-dashboard"
              >
                <i data-lucide="shield-check" class="w-3.5 h-3.5 text-teal-300"></i>
                <span>View Audits</span>
              </button>
            </div>
          </div>

          <!-- 2. Top 4 Executive KPI Metric Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- Card 1: Total Personnel Tracked -->
            <div
              onclick="FPCL_PSM_SUITE.clearValidationFilters()"
              class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden cursor-pointer hover:border-slate-400 hover:shadow-sm transition-all group"
              title="Click to reset filters and view all personnel"
            >
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-slate-700 group-hover:bg-slate-900 transition-colors"></div>
              <div class="flex items-center justify-between text-slate-500 text-xs sm:text-sm font-bold tracking-wider uppercase">
                <span>1. TOTAL PERSONNEL</span>
                <span class="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                  <i data-lucide="users" class="w-4 h-4"></i>
                </span>
              </div>
              <div class="mt-3 flex items-baseline gap-2">
                <span class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-900">${totalFiltered}</span>
                <span class="text-xs font-mono font-bold text-slate-500">/ ${totalRaw} Total</span>
              </div>
              <div class="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                <span>Scope Coverage</span>
                <span class="font-bold text-slate-800">100% Cohort</span>
              </div>
            </div>

            <!-- Card 2: Training Completed -->
            <div
              onclick="FPCL_PSM_SUITE.setValidationFilter('trainingFilter', 'Yes')"
              class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden cursor-pointer hover:border-emerald-300 hover:shadow-sm transition-all group"
              title="Click to filter by Training: Yes"
            >
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500 group-hover:bg-emerald-600 transition-colors"></div>
              <div class="flex items-center justify-between text-emerald-800 text-xs sm:text-sm font-bold tracking-wider uppercase">
                <span>2. TRAINING COMPLETED</span>
                <span class="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <i data-lucide="award" class="w-4 h-4"></i>
                </span>
              </div>
              <div class="mt-3 flex items-baseline gap-2">
                <span class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-emerald-600">${trainedYesCount}</span>
                <span class="text-xs font-mono font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">${trainingPct}%</span>
              </div>
              <div class="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                <span>Pending / Gaps</span>
                <span class="font-bold text-amber-600">${trainedNoCount} Personnel</span>
              </div>
            </div>

            <!-- Card 3: Validation Passed -->
            <div
              onclick="FPCL_PSM_SUITE.setValidationFilter('statusFilter', 'Pass')"
              class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden cursor-pointer hover:border-teal-300 hover:shadow-sm transition-all group"
              title="Click to filter by Status: Pass"
            >
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-teal-600 group-hover:bg-teal-700 transition-colors"></div>
              <div class="flex items-center justify-between text-teal-800 text-xs sm:text-sm font-bold tracking-wider uppercase">
                <span>3. VALIDATION PASSED</span>
                <span class="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                  <i data-lucide="shield-check" class="w-4 h-4"></i>
                </span>
              </div>
              <div class="mt-3 flex items-baseline gap-2">
                <span class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-teal-700">${passedCount}</span>
                <span class="text-xs font-mono font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">${passPct}%</span>
              </div>
              <div class="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                <span>Failed / Pending</span>
                <span class="font-bold text-slate-700">${failedCount} Fail • ${pendingCount} Pending</span>
              </div>
            </div>

            <!-- Card 4: Module Validation Compliance -->
            <div
              onclick="FPCL_PSM_SUITE.setValidationFilter('moduleFilter', 'all')"
              class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group"
              title="Click to view all validation modules"
            >
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-blue-600 group-hover:bg-blue-700 transition-colors"></div>
              <div class="flex items-center justify-between text-blue-900 text-xs sm:text-sm font-bold tracking-wider uppercase">
                <span>4. MODULE VALIDATION</span>
                <span class="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <i data-lucide="shield-check" class="w-4 h-4"></i>
                </span>
              </div>
              <div class="mt-3 flex items-baseline gap-2 flex-wrap">
                <span class="text-2xl sm:text-3xl font-black font-mono tracking-tight text-blue-950">
                  ${moduleBreakdown.length} <span class="text-xs font-sans text-slate-500 font-bold">${moduleBreakdown.length === 1 ? 'Active Module' : 'Active Modules'}</span>
                </span>
              </div>
              <div class="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                <span>Validation Result</span>
                <span class="font-bold ${failedCount === 0 ? 'text-emerald-700 font-extrabold' : 'text-rose-600'}">
                  ${failedCount === 0 ? `${passedCount} Pass (100%)` : `${passedCount} Pass • ${failedCount} Fail`}
                </span>
              </div>
            </div>
          </div>

          <!-- 3. Filter Controls Grid Card -->
          <div class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <span class="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                  <i data-lucide="sliders-horizontal" class="w-4 h-4"></i>
                </span>
                <span class="text-xs font-black text-slate-900 uppercase tracking-wider">Filters</span>
              </div>

              ${isAnyFilterActive ? `
                <button
                  type="button"
                  onclick="FPCL_PSM_SUITE.clearValidationFilters()"
                  class="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200 transition-all cursor-pointer active:scale-95"
                >
                  <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                  <span>Clear All Filters</span>
                </button>
              ` : `
                <span class="text-xs text-slate-400 font-medium">No filters active</span>
              `}
            </div>

            <!-- Dropdown Filters Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              
              <!-- 1. Department -->
              <div class="space-y-1">
                <label class="font-bold text-slate-600 uppercase text-[10px] tracking-wider block">Department</label>
                <select
                  onchange="FPCL_PSM_SUITE.setValidationFilter('deptFilter', this.value)"
                  class="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer text-xs"
                >
                  <option value="all" ${vs.deptFilter === 'all' ? 'selected' : ''}>All Departments (${raw.length})</option>
                  ${allDepts.map(d => {
                    const c = raw.filter(r => r.department === d).length;
                    return `<option value="${d}" ${vs.deptFilter === d ? 'selected' : ''}>${d} (${c})</option>`;
                  }).join('')}
                </select>
              </div>

              <!-- 2. Cadre -->
              <div class="space-y-1">
                <label class="font-bold text-slate-600 uppercase text-[10px] tracking-wider block">Cadre</label>
                <select
                  onchange="FPCL_PSM_SUITE.setValidationFilter('cadreFilter', this.value)"
                  class="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer text-xs"
                >
                  <option value="all" ${vs.cadreFilter === 'all' ? 'selected' : ''}>All Cadres (${raw.length})</option>
                  ${allCadres.map(c => {
                    const cnt = raw.filter(r => r.cadre === c).length;
                    return `<option value="${c}" ${vs.cadreFilter === c ? 'selected' : ''}>${c} (${cnt})</option>`;
                  }).join('')}
                </select>
              </div>

              <!-- 3. Training Status -->
              <div class="space-y-1">
                <label class="font-bold text-slate-600 uppercase text-[10px] tracking-wider block">Training Status</label>
                <select
                  onchange="FPCL_PSM_SUITE.setValidationFilter('trainingFilter', this.value)"
                  class="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer text-xs"
                >
                  <option value="all" ${vs.trainingFilter === 'all' ? 'selected' : ''}>All Training (${raw.length})</option>
                  <option value="Yes" ${vs.trainingFilter === 'Yes' ? 'selected' : ''}>Training: Yes (${raw.filter(i => (i.training||'').toLowerCase() === 'yes').length})</option>
                  <option value="No" ${vs.trainingFilter === 'No' ? 'selected' : ''}>Training: No (${raw.filter(i => (i.training||'').toLowerCase() === 'no').length})</option>
                </select>
              </div>

              <!-- 4. Validation Result -->
              <div class="space-y-1">
                <label class="font-bold text-slate-600 uppercase text-[10px] tracking-wider block">Validation Result</label>
                <select
                  onchange="FPCL_PSM_SUITE.setValidationFilter('statusFilter', this.value)"
                  class="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer text-xs"
                >
                  <option value="all" ${vs.statusFilter === 'all' ? 'selected' : ''}>All Results (${raw.length})</option>
                  <option value="Pass" ${vs.statusFilter === 'Pass' ? 'selected' : ''}>Pass (${raw.filter(i => (i.status||'').toLowerCase() === 'pass').length})</option>
                  <option value="Fail" ${vs.statusFilter === 'Fail' ? 'selected' : ''}>Fail (${raw.filter(i => (i.status||'').toLowerCase() === 'fail').length})</option>
                </select>
              </div>

              <!-- 5. PSM Module -->
              <div class="space-y-1">
                <label class="font-bold text-slate-600 uppercase text-[10px] tracking-wider block">PSM Module</label>
                <select
                  onchange="FPCL_PSM_SUITE.setValidationFilter('moduleFilter', this.value)"
                  class="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl px-2.5 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer text-xs"
                >
                  <option value="all" ${vs.moduleFilter === 'all' ? 'selected' : ''}>All Modules (${raw.length})</option>
                  ${allModules.map(m => {
                    const cnt = raw.filter(r => (r.module || '').trim() === m).length;
                    return `<option value="${m}" ${vs.moduleFilter === m ? 'selected' : ''}>${m} (${cnt})</option>`;
                  }).join('')}
                </select>
              </div>

              <!-- 6. Search Personnel -->
              <div class="space-y-1">
                <label class="font-bold text-slate-600 uppercase text-[10px] tracking-wider block">Search Personnel</label>
                <div class="relative">
                  <input
                    type="text"
                    value="${vs.searchQuery || ''}"
                    oninput="FPCL_PSM_SUITE.setValidationFilter('searchQuery', this.value)"
                    placeholder="Name, P.No, Unit..."
                    class="w-full pl-7 pr-7 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none"></i>
                  ${vs.searchQuery ? `
                    <button
                      type="button"
                      onclick="FPCL_PSM_SUITE.setValidationFilter('searchQuery', '')"
                      class="absolute right-2 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    </button>
                  ` : ''}
                </div>
              </div>

            </div>

            <!-- Active Filter Badges -->
            ${isAnyFilterActive ? `
              <div class="pt-2 border-t border-slate-100 flex items-center flex-wrap gap-2 text-xs">
                <span class="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Active Filters:</span>
                
                ${vs.deptFilter && vs.deptFilter !== 'all' ? `
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                    Dept: ${vs.deptFilter}
                    <button onclick="FPCL_PSM_SUITE.setValidationFilter('deptFilter', 'all')" class="hover:text-rose-600 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}

                ${vs.cadreFilter && vs.cadreFilter !== 'all' ? `
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold">
                    Cadre: ${vs.cadreFilter}
                    <button onclick="FPCL_PSM_SUITE.setValidationFilter('cadreFilter', 'all')" class="hover:text-rose-600 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}

                ${vs.trainingFilter && vs.trainingFilter !== 'all' ? `
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                    Training: ${vs.trainingFilter}
                    <button onclick="FPCL_PSM_SUITE.setValidationFilter('trainingFilter', 'all')" class="hover:text-rose-600 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}

                ${vs.statusFilter && vs.statusFilter !== 'all' ? `
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                    Status: ${vs.statusFilter}
                    <button onclick="FPCL_PSM_SUITE.setValidationFilter('statusFilter', 'all')" class="hover:text-rose-600 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}

                ${vs.moduleFilter && vs.moduleFilter !== 'all' ? `
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-bold">
                    Module: ${vs.moduleFilter}
                    <button onclick="FPCL_PSM_SUITE.setValidationFilter('moduleFilter', 'all')" class="hover:text-rose-600 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}

                ${vs.searchQuery ? `
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 font-bold">
                    Search: "${vs.searchQuery}"
                    <button onclick="FPCL_PSM_SUITE.setValidationFilter('searchQuery', '')" class="hover:text-rose-600 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}
              </div>
            ` : ''}
          </div>

          <!-- 4. Analytical Breakdown Section (Department Training Matrix & Module Validation Matrix) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <!-- Left 6 Cols: Department Training Compliance Matrix -->
            <div class="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <div class="space-y-0.5">
                  <h4 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <i data-lucide="bar-chart-3" class="w-4 h-4 text-teal-600"></i>
                    <span>Department Training Compliance Matrix</span>
                  </h4>
                </div>
              </div>

              <!-- Horizontal SVG Bar Chart (Full Department Training Compliance Matrix) -->
              <div id="psm-val-dept-bar-chart" class="w-full overflow-x-auto">
                ${this.renderValidationDeptBarChart(deptBreakdown)}
              </div>
            </div>

            <!-- Right 6 Cols: Module Validation Compliance Matrix (Pass / Fail Bar Chart) -->
            <div class="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <div class="space-y-0.5">
                  <h4 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <i data-lucide="shield-check" class="w-4 h-4 text-blue-600"></i>
                    <span>Module Validation Compliance Matrix</span>
                  </h4>
                </div>
              </div>

              <!-- Horizontal SVG Bar Chart (Module Validation Compliance Matrix) -->
              <div id="psm-val-module-bar-chart" class="w-full overflow-x-auto">
                ${this.renderValidationModuleBarChart(moduleBreakdown)}
              </div>
            </div>

          </div>

          <!-- 5. Master Validation Protocol & Records Table Card -->
          <div id="psm-val-records-table-container" class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            
            <!-- Table Header Controls -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div class="space-y-0.5">
                <h4 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <i data-lucide="table" class="w-4 h-4 text-teal-600"></i>
                  <span>PSM Personnel Qualification & Validation Records</span>
                </h4>
              </div>

              <div class="flex items-center flex-wrap gap-2.5">
                <!-- Page Size Selector -->
                <div class="flex items-center gap-1.5 text-xs text-slate-500">
                  <span>Rows:</span>
                  <select
                    onchange="FPCL_PSM_SUITE.setValidationPageSize(this.value)"
                    class="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer text-xs"
                  >
                    <option value="10" ${vs.pageSize == 10 ? 'selected' : ''}>10</option>
                    <option value="15" ${vs.pageSize == 15 || !vs.pageSize ? 'selected' : ''}>15</option>
                    <option value="25" ${vs.pageSize == 25 ? 'selected' : ''}>25</option>
                    <option value="50" ${vs.pageSize == 50 ? 'selected' : ''}>50</option>
                    <option value="all" ${vs.pageSize === 'all' ? 'selected' : ''}>All (${totalFiltered})</option>
                  </select>
                </div>

                <!-- Export Filtered CSV Button -->
                <button
                  type="button"
                  onclick="FPCL_PSM_SUITE.exportValidationCSV()"
                  class="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95"
                  title="Download CSV based on active filters"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>Export Filtered CSV</span>
                </button>
              </div>
            </div>

            <!-- Responsive Table -->
            <div class="overflow-x-auto rounded-xl border border-slate-200">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
                    <th class="py-3 px-3 w-12 text-center">Sr.</th>
                    <th class="py-3 px-3 w-20">P. No.</th>
                    <th class="py-3 px-3">Employee Name</th>
                    <th class="py-3 px-3">Position & Unit</th>
                    <th class="py-3 px-3">Department</th>
                    <th class="py-3 px-3">Cadre</th>
                    <th class="py-3 px-3 text-center">Training</th>
                    <th class="py-3 px-3 text-center">Status</th>
                    <th class="py-3 px-3 text-center">Module</th>
                    <th class="py-3 px-3">Remarks</th>
                    <th class="py-3 px-3 text-center w-16">Profile</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                  ${pageItems.length === 0 ? `
                    <tr>
                      <td colspan="11" class="py-12 text-center text-slate-400">
                        <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
                        <p class="font-semibold text-sm text-slate-700">No personnel records found</p>
                        <p class="text-xs mt-1">Try adjusting your filters or search query.</p>
                        <button
                          type="button"
                          onclick="FPCL_PSM_SUITE.clearValidationFilters()"
                          class="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 font-bold hover:bg-teal-100 cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      </td>
                    </tr>
                  ` : pageItems.map((item, idx) => {
                    const rowNum = startIndex + idx + 1;
                    const isPass = (item.status || '').toLowerCase() === 'pass';
                    const isTrained = (item.training || '').toLowerCase() === 'yes';

                    // Cadre badge styling
                    let cadreBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                    if ((item.cadre || '').toLowerCase() === 'mngt') {
                      cadreBadge = 'bg-purple-50 text-purple-700 border-purple-200';
                    } else if ((item.cadre || '').toLowerCase() === 'jmc') {
                      cadreBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                    } else if ((item.cadre || '').toLowerCase() === 'staff') {
                      cadreBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    }

                    return `
                      <tr
                        onclick="FPCL_PSM_SUITE.inspectValidationItem(${item.sr})"
                        class="hover:bg-teal-50/40 transition-colors cursor-pointer group"
                      >
                        <td class="py-3 px-3 text-center font-mono text-slate-400 font-bold text-[11px]">${rowNum}</td>
                        <td class="py-3 px-3 font-mono font-bold text-slate-900">${item.pNo || '-'}</td>
                        <td class="py-3 px-3">
                          <span class="font-bold text-slate-900 block group-hover:text-teal-700 transition-colors">${item.name || '-'}</span>
                        </td>
                        <td class="py-3 px-3">
                          <span class="font-semibold text-slate-800 block">${item.position || '-'}</span>
                          <span class="text-[10px] font-mono text-slate-400">${item.unit || 'General'}</span>
                        </td>
                        <td class="py-3 px-3">
                          <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            ${item.department || '-'}
                          </span>
                        </td>
                        <td class="py-3 px-3">
                          <span class="px-2 py-0.5 rounded-md text-[11px] font-bold border ${cadreBadge}">
                            ${item.cadre || '-'}
                          </span>
                        </td>
                        <td class="py-3 px-3 text-center">
                          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isTrained ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
                            <span class="w-1.5 h-1.5 rounded-full ${isTrained ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                            ${item.training || 'No'}
                          </span>
                        </td>
                        <td class="py-3 px-3 text-center">
                          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isPass ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                            ${item.status || 'Pending'}
                          </span>
                        </td>
                        <td class="py-3 px-3 text-center font-mono font-bold text-teal-700 text-[11px]">
                          ${item.module || 'T&D'}
                        </td>
                        <td class="py-3 px-3 max-w-xs truncate text-[11px] text-slate-500" title="${item.endUserRemarks || item.safetyRemarks || 'No remarks'}">
                          ${item.endUserRemarks || item.safetyRemarks || '-'}
                        </td>
                        <td class="py-3 px-3 text-center">
                          <button
                            type="button"
                            onclick="event.stopPropagation(); FPCL_PSM_SUITE.inspectValidationItem(${item.sr});"
                            class="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-100 transition-colors cursor-pointer"
                            title="View Full Personnel Profile"
                          >
                            <i data-lucide="eye" class="w-4 h-4"></i>
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Pagination Footer -->
            <div class="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
              <div class="font-medium">
                Showing <strong>${pageItems.length > 0 ? startIndex + 1 : 0}</strong> to <strong>${Math.min(startIndex + pageSize, totalFiltered)}</strong> of <strong>${totalFiltered}</strong> personnel records
              </div>

              ${totalPages > 1 ? `
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    ${currentPage <= 1 ? 'disabled' : ''}
                    onclick="FPCL_PSM_SUITE.setValidationPage(${currentPage - 1})"
                    class="px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Prev
                  </button>
                  
                  <span class="px-2 font-mono font-bold text-slate-700">Page ${currentPage} of ${totalPages}</span>

                  <button
                    type="button"
                    ${currentPage >= totalPages ? 'disabled' : ''}
                    onclick="FPCL_PSM_SUITE.setValidationPage(${currentPage + 1})"
                    class="px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              ` : ''}
            </div>

          </div>

          <!-- Personnel Inspection Modal Anchor -->
          <div id="psm-validation-inspection-modal" class="hidden"></div>

        </div>
      `;
    },

    // Main render method mounted on #psm-specialized-container
    render() {
      const container = document.getElementById('psm-specialized-container');
      if (!container) return;

      // Keep detail-description hidden and clean for Sub HSE PSM banner
      const descEl = document.getElementById('detail-description');
      if (descEl) {
        descEl.textContent = '';
        descEl.style.display = 'none';
      }

      const raw = this.getRawData();
      const filtered = this.getFilteredData();

      // Overall metrics calculated dynamically from raw or filtered
      const totalRaw = raw.length;
      const totalFiltered = filtered.length;
      const openCount = filtered.filter(d => d.status === 'Open').length;
      const closedCount = filtered.filter(d => d.status === 'Close').length;
      const closurePercentage = totalFiltered > 0 ? Math.round((closedCount / totalFiltered) * 100) : 0;
      const openPercentage = totalFiltered > 0 ? Math.round((openCount / totalFiltered) * 100) : 0;

      // Dropdown option lists extracted dynamically from raw data
      const allDepts = Array.from(new Set(raw.map(d => d.actionDepartment).filter(Boolean))).sort();
      const allUnits = Array.from(new Set(raw.map(d => d.actionUnit).filter(Boolean))).sort();
      const allElements = Array.from(new Set(raw.map(d => d.psmElement).filter(Boolean))).sort();
      const allNatures = Array.from(new Set(raw.map(d => d.nature).filter(Boolean))).sort();
      const allAudits = Array.from(new Set(raw.map(d => d.auditNo).filter(Boolean))).sort();

      // Department & Unit Aggregations
      const deptList = this.getDepartmentAggregation(filtered);
      const unitList = this.getUnitAggregation(filtered);

      // Total summary calculations for tables
      const sumDeptTotal = deptList.reduce((acc, d) => acc + d.total, 0);
      const sumDeptOpen = deptList.reduce((acc, d) => acc + d.open, 0);
      const sumDeptClose = deptList.reduce((acc, d) => acc + d.close, 0);
      const sumDeptClosure = sumDeptTotal > 0 ? Math.round((sumDeptClose / sumDeptTotal) * 100) : 0;

      const sumUnitTotal = unitList.reduce((acc, u) => acc + u.total, 0);
      const sumUnitOpen = unitList.reduce((acc, u) => acc + u.open, 0);
      const sumUnitClose = unitList.reduce((acc, u) => acc + u.close, 0);
      const sumUnitClosure = sumUnitTotal > 0 ? Math.round((sumUnitClose / sumUnitTotal) * 100) : 0;

      // Pagination slice for records table
      const s = this.state;
      const pageSize = s.pageSize === 'all' ? filtered.length : parseInt(s.pageSize, 10);
      const totalPages = Math.max(1, Math.ceil(filtered.length / (pageSize || 1)));
      const currentPage = Math.min(s.page, totalPages);
      const startIndex = (currentPage - 1) * pageSize;
      const pageItems = filtered.slice(startIndex, startIndex + pageSize);

      const subDashboardNav = `
        <!-- ========================================================================= -->
        <!-- DUAL SUB-DASHBOARD TABS (1- PSM Audits | 2- PSM Validation)               -->
        <!-- ========================================================================= -->
        <div class="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center flex-wrap gap-2">
            <!-- Sub Dashboard 1: PSM Audits -->
            <button
              id="psm-subtab-audits"
              type="button"
              onclick="FPCL_PSM_SUITE.setSubDashboard('audits')"
              class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${s.activeSubDashboard === 'audits' ? 'bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 text-white shadow-md shadow-teal-600/25 ring-2 ring-teal-500/50' : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700 border border-slate-200/80 hover:text-slate-900'}"
              title="PSM Internal Audit Findings, Action Tracking & Analytics"
            >
              <i data-lucide="shield-check" class="w-4 h-4"></i>
              <span>1. PSM Audits</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${s.activeSubDashboard === 'audits' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'}">
                ${totalRaw} Findings
              </span>
            </button>

            <!-- Sub Dashboard 2: PSM Validation -->
            <button
              id="psm-subtab-validation"
              type="button"
              onclick="FPCL_PSM_SUITE.setSubDashboard('validation')"
              class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${s.activeSubDashboard === 'validation' ? 'bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 text-white shadow-md shadow-teal-600/25 ring-2 ring-teal-500/50' : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700 border border-slate-200/80 hover:text-slate-900'}"
              title="Process Safety Management Validation Protocol & Operational Verification Tracker"
            >
              <i data-lucide="check-circle-2" class="w-4 h-4"></i>
              <span>2. PSM Validation</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${s.activeSubDashboard === 'validation' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}">
                ${this.getRawValidationData().length} Personnel
              </span>
            </button>
          </div>

          <div class="flex items-center gap-2 text-xs text-slate-500">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 font-medium">
              <i data-lucide="layers" class="w-3.5 h-3.5 text-teal-600"></i>
              <span>Active Sub-Dashboard: <strong class="text-slate-800 font-bold">${s.activeSubDashboard === 'audits' ? 'PSM Audits' : 'PSM Validation'}</strong></span>
            </span>
          </div>
        </div>
      `;

      let activeSubContent = '';
      const headerCard = document.getElementById('detail-header-card');
      if (s.activeSubDashboard === 'validation') {
        if (headerCard) headerCard.classList.add('hidden');
        activeSubContent = this.renderValidationSubDashboard();
      } else {
        if (headerCard) headerCard.classList.remove('hidden');
        activeSubContent = `
          <!-- ========================================================================= -->
          <!-- TOP 4 EXECUTIVE KPI SUMMARY CARDS (DYNAMICALLY COMPUTED)                  -->
          <!-- ========================================================================= -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- Card 1: Total Findings -->
            <div 
              onclick="FPCL_PSM_SUITE.openDataModal({ title: 'Total PSM Audit Findings', badge: 'All Findings', subtitle: '${totalFiltered} findings in current view (${totalRaw} lifetime audit observations)', filterStatus: 'all' })"
              onmouseenter="FPCL_PSM_SUITE.showTooltip(event, { title: '1. Total Findings', badge: 'Scope', color: '#475569', subtitle: 'Audit Registry Overview', metrics: [{ label: 'Filtered Findings', value: '${totalFiltered}' }, { label: 'Total Ingested', value: '${totalRaw}' }, { label: 'Open', value: '${openCount}', color: '#F43F5E' }, { label: 'Closed', value: '${closedCount}', color: '#10B981' }], hint: 'Click to open and inspect all findings' })"
              onmousemove="FPCL_PSM_SUITE.moveTooltip(event)"
              onmouseleave="FPCL_PSM_SUITE.hideTooltip()"
              class="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group ${s.statusFilter === 'all' ? 'ring-2 ring-slate-400' : ''}"
            >
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-slate-600"></div>
              <div class="flex items-center justify-between text-slate-500 text-xs sm:text-sm font-bold tracking-wider uppercase">
                <span>1. TOTAL FINDINGS</span>
                <span class="p-1.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-colors">
                  <i data-lucide="files" class="w-4 h-4"></i>
                </span>
              </div>
              <div class="mt-3 flex items-baseline gap-2">
                <span class="text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-900 kpi-metric-val">${totalFiltered}</span>
                ${totalFiltered !== totalRaw ? `<span class="text-sm font-mono text-slate-400">/ ${totalRaw}</span>` : ''}
              </div>
            </div>

            <!-- Card 2: Open Findings -->
            <div 
              onclick="FPCL_PSM_SUITE.openDataModal({ title: 'Open PSM Audit Findings', badge: 'Active Open', subtitle: '${openCount} findings pending corrective action (${openPercentage}% of current scope)', filterStatus: 'Open' })"
              onmouseenter="FPCL_PSM_SUITE.showTooltip(event, { title: '2. Open Findings', badge: 'Active Open', color: '#F43F5E', subtitle: 'Corrective Action Required', metrics: [{ label: 'Pending Action', value: '${openCount}', color: '#F43F5E' }, { label: 'Active Ratio', value: '${openPercentage}%' }, { label: 'Filtered Scope', value: '${totalFiltered}' }], hint: 'Click to open all Open findings' })"
              onmousemove="FPCL_PSM_SUITE.moveTooltip(event)"
              onmouseleave="FPCL_PSM_SUITE.hideTooltip()"
              class="bg-white border border-slate-200 hover:border-rose-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group ${s.statusFilter === 'Open' ? 'ring-2 ring-rose-500 bg-rose-50/20' : ''}"
            >
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-rose-500"></div>
              <div class="flex items-center justify-between text-rose-700 text-xs sm:text-sm font-bold tracking-wider uppercase">
                <span>2. OPEN FINDINGS</span>
                <span class="p-1.5 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-100 transition-colors">
                  <i data-lucide="alert-circle" class="w-4 h-4"></i>
                </span>
              </div>
              <div class="mt-3 flex items-baseline gap-2">
                <span class="text-5xl sm:text-6xl font-black font-mono tracking-tight text-rose-600 kpi-metric-val">${openCount}</span>
                <span class="text-sm font-mono font-bold text-rose-700">(${openPercentage}%)</span>
              </div>
            </div>

            <!-- Card 3: Closed Findings -->
            <div 
              onclick="FPCL_PSM_SUITE.openDataModal({ title: 'Closed & Verified PSM Findings', badge: 'Resolved', subtitle: '${closedCount} findings successfully closed (${closurePercentage}% resolution rate)', filterStatus: 'Close' })"
              onmouseenter="FPCL_PSM_SUITE.showTooltip(event, { title: '3. Closed Findings', badge: 'Resolved', color: '#10B981', subtitle: 'Audit Verification Completed', metrics: [{ label: 'Resolved Count', value: '${closedCount}', color: '#10B981' }, { label: 'Resolution Rate', value: '${closurePercentage}%' }], hint: 'Click to open all Closed findings' })"
              onmousemove="FPCL_PSM_SUITE.moveTooltip(event)"
              onmouseleave="FPCL_PSM_SUITE.hideTooltip()"
              class="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group ${s.statusFilter === 'Close' ? 'ring-2 ring-emerald-500 bg-emerald-50/20' : ''}"
            >
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"></div>
              <div class="flex items-center justify-between text-emerald-700 text-xs sm:text-sm font-bold tracking-wider uppercase">
                <span>3. CLOSED FINDINGS</span>
                <span class="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                  <i data-lucide="check-circle" class="w-4 h-4"></i>
                </span>
              </div>
              <div class="mt-3 flex items-baseline gap-2">
                <span class="text-5xl sm:text-6xl font-black font-mono tracking-tight text-emerald-600 kpi-metric-val">${closedCount}</span>
                <span class="text-sm font-mono font-bold text-emerald-700">(${closurePercentage}%)</span>
              </div>
            </div>

            <!-- Card 4: % Closure -->
            <div
              onclick="FPCL_PSM_SUITE.openDataModal({ title: 'Compliance & Closure Summary', badge: '% Closure', subtitle: '${closurePercentage}% overall compliance rate (${closedCount} closed of ${totalFiltered} total in scope)', filterStatus: 'all' })"
              onmouseenter="FPCL_PSM_SUITE.showTooltip(event, { title: '4. % Closure Rate', badge: 'Compliance', color: '#0D9488', subtitle: 'Resolution Efficiency', metrics: [{ label: 'Closure Rate', value: '${closurePercentage}%' }, { label: 'Closed', value: '${closedCount}', color: '#10B981' }, { label: 'Open', value: '${openCount}', color: '#F43F5E' }], hint: 'Click to explore compliance breakdown' })"
              onmousemove="FPCL_PSM_SUITE.moveTooltip(event)"
              onmouseleave="FPCL_PSM_SUITE.hideTooltip()"
              class="bg-white border border-slate-200 hover:border-teal-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
            >
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-teal-500"></div>
              <div class="flex items-center justify-between text-teal-700 text-xs sm:text-sm font-bold tracking-wider uppercase">
                <span>4. % CLOSURE</span>
                <span class="p-1.5 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-100 transition-colors">
                  <i data-lucide="trending-up" class="w-4 h-4"></i>
                </span>
              </div>
              <div class="mt-3 flex items-baseline gap-2">
                <span class="text-5xl sm:text-6xl font-black font-mono tracking-tight text-teal-600 kpi-metric-val">${closurePercentage}%</span>
              </div>
            </div>

          </div>

          <!-- ========================================================================= -->
          <!-- 4. FILTER CONTROLS GRID                                                   -->
          <!-- ========================================================================= -->
          <div class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <!-- Filter Controls Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">

              <!-- 1. Status Filter -->
              <div>
                <label class="block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">STATUS</label>
                <select
                  onchange="FPCL_PSM_SUITE.setStatusFilter(this.value)"
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs"
                >
                  <option value="all" ${s.statusFilter === 'all' ? 'selected' : ''}>All Statuses (${totalRaw})</option>
                  <option value="Open" ${s.statusFilter === 'Open' ? 'selected' : ''}>Open</option>
                  <option value="Close" ${s.statusFilter === 'Close' ? 'selected' : ''}>Close</option>
                </select>
              </div>

              <!-- 2. Action Department -->
              <div>
                <label class="block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">ACTION DEPT</label>
                <select
                  onchange="FPCL_PSM_SUITE.setDeptFilter(this.value)"
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs"
                >
                  <option value="all" ${s.deptFilter === 'all' ? 'selected' : ''}>All Departments</option>
                  ${allDepts.map(d => `<option value="${d}" ${s.deptFilter === d ? 'selected' : ''}>${d}</option>`).join('')}
                </select>
              </div>

              <!-- 3. Action Unit -->
              <div>
                <label class="block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">ACTION UNIT</label>
                <select
                  onchange="FPCL_PSM_SUITE.setUnitFilter(this.value)"
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs"
                >
                  <option value="all" ${s.unitFilter === 'all' ? 'selected' : ''}>All Action Units</option>
                  ${allUnits.map(u => `<option value="${u}" ${s.unitFilter === u ? 'selected' : ''}>${u}</option>`).join('')}
                </select>
              </div>

              <!-- 4. PSM Element -->
              <div>
                <label class="block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">PSM ELEMENT</label>
                <select
                  onchange="FPCL_PSM_SUITE.setElementFilter(this.value)"
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs"
                >
                  <option value="all" ${s.elementFilter === 'all' ? 'selected' : ''}>All PSM Elements</option>
                  ${allElements.map(e => `<option value="${e}" ${s.elementFilter === e ? 'selected' : ''}>${e}</option>`).join('')}
                </select>
              </div>

              <!-- 5. Nature / Severity -->
              <div>
                <label class="block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">NATURE / SEVERITY</label>
                <select
                  onchange="FPCL_PSM_SUITE.setNatureFilter(this.value)"
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs"
                >
                  <option value="all" ${s.natureFilter === 'all' ? 'selected' : ''}>All Severities</option>
                  ${allNatures.map(n => `<option value="${n}" ${s.natureFilter === n ? 'selected' : ''}>${n}</option>`).join('')}
                </select>
              </div>

              <!-- 6. Audit No -->
              <div>
                <label class="block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">AUDIT NO</label>
                <select
                  onchange="FPCL_PSM_SUITE.setAuditFilter(this.value)"
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs"
                >
                  <option value="all" ${s.auditFilter === 'all' ? 'selected' : ''}>All Audit Numbers</option>
                  ${allAudits.map(a => `<option value="${a}" ${s.auditFilter === a ? 'selected' : ''}>${a}</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- Active Filter Badges (if any applied) -->
            ${this.renderActiveFilterPills()}
          </div>

          <!-- ========================================================================= -->
          <!-- 5. CHARTS ROW: BAR CHART (LEFT) + DONUT AUDIT BREAKDOWN (RIGHT)           -->
          <!-- ========================================================================= -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            <!-- Left Chart (6 cols): Open vs Closed by Action Department -->
            <div class="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 class="text-sm sm:text-base font-black tracking-wider text-slate-900 flex items-center gap-2 uppercase">
                    <i data-lucide="bar-chart-3" class="w-4 h-4 text-teal-600"></i>
                    <span>OPEN VS. CLOSED FINDINGS BY ACTION DEPARTMENT</span>
                  </h3>
                </div>
              </div>

              <!-- Horizontal SVG Bar Chart -->
              <div id="psm-dept-bar-chart" class="w-full overflow-x-auto">
                ${this.renderDepartmentBarChart(deptList)}
              </div>

              <!-- Legends of Department Findings Trend Placed at Bottom -->
              <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div class="flex items-center gap-3">
                  <button
                    onclick="FPCL_PSM_SUITE.openDataModal({ title: 'All Open Findings by Department', badge: 'Active Open', subtitle: '${openCount} Open findings across all departments', filterStatus: 'Open' })"
                    class="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold cursor-pointer hover:bg-rose-100 transition-colors shadow-2xs"
                    title="Click to view all Open findings in pop-up window"
                  >
                    <span class="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                    <span>Open Findings (${openCount})</span>
                  </button>
                  <button
                    onclick="FPCL_PSM_SUITE.openDataModal({ title: 'All Closed Findings by Department', badge: 'Resolved', subtitle: '${closedCount} Closed findings across all departments', filterStatus: 'Close' })"
                    class="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold cursor-pointer hover:bg-emerald-100 transition-colors shadow-2xs"
                    title="Click to view all Closed findings in pop-up window"
                  >
                    <span class="w-2.5 h-2.5 rounded-sm bg-teal-500"></span>
                    <span>Closed Findings (${closedCount})</span>
                  </button>
                </div>
                <div class="text-[11px] font-sans text-slate-400 font-medium">
                  Click any bar to inspect department data
                </div>
              </div>
            </div>

            <!-- Right Chart (6 cols): Audit Breakdown Donut -->
            <div class="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 class="text-sm sm:text-base font-black tracking-wider text-slate-900 flex items-center gap-2 uppercase">
                  <i data-lucide="pie-chart" class="w-4 h-4 text-indigo-600"></i>
                  <span>AUDIT BREAKDOWN</span>
                </h3>
                <!-- Toggle Mode: PSM Element vs Severity -->
                <div class="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                  <button
                    onclick="FPCL_PSM_SUITE.setBreakdownMode('element')"
                    class="px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${s.chartBreakdownMode === 'element' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}"
                  >
                    PSM Element
                  </button>
                  <button
                    onclick="FPCL_PSM_SUITE.setBreakdownMode('severity')"
                    class="px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${s.chartBreakdownMode === 'severity' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}"
                  >
                    Severity
                  </button>
                </div>
              </div>

              <!-- Donut SVG & Legend -->
              <div class="py-2">
                ${this.renderBreakdownDonut(filtered)}
              </div>

              <!-- Bottom Compliance Ratio Bar -->
              <div
                class="pt-3 border-t border-slate-100 space-y-1.5 cursor-pointer group"
                onclick="FPCL_PSM_SUITE.openDataModal({ title: 'Compliance & Resolution Ratio', badge: 'Compliance Bar', subtitle: '${closurePercentage}% resolved (${closedCount} closed, ${openCount} open of ${totalFiltered} in scope)' })"
                onmouseenter="FPCL_PSM_SUITE.showTooltip(event, { title: 'Compliance Ratio', badge: 'Resolution', color: '#0D9488', subtitle: 'Audit Progress Distribution', metrics: [{ label: 'Resolved Rate', value: '${closurePercentage}%', color: '#10B981' }, { label: 'Closed Findings', value: '${closedCount}', color: '#10B981' }, { label: 'Open Findings', value: '${openCount}', color: '#F43F5E' }, { label: 'Total In Scope', value: '${totalFiltered}' }], hint: 'Click bar to explore detailed audit records' })"
                onmousemove="FPCL_PSM_SUITE.moveTooltip(event)"
                onmouseleave="FPCL_PSM_SUITE.hideTooltip()"
              >
                <div class="flex items-center justify-between text-xs font-bold">
                  <span class="text-slate-600 group-hover:text-teal-700 transition-colors">Compliance Ratio</span>
                  <span class="text-teal-700 font-mono font-black">${closurePercentage}% Closure</span>
                </div>
                <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    class="bg-emerald-500 hover:bg-emerald-600 h-3 transition-colors cursor-pointer"
                    style="width: ${closurePercentage}%;"
                    title="Click to view Closed findings: ${closedCount}"
                    onclick="event.stopPropagation(); FPCL_PSM_SUITE.openDataModal({ title: 'Closed Audit Findings', badge: 'Resolved', subtitle: '${closedCount} closed audit findings', filterStatus: 'Close' })"
                  ></div>
                  <div
                    class="bg-rose-500 hover:bg-rose-600 h-3 transition-colors cursor-pointer"
                    style="width: ${openPercentage}%;"
                    title="Click to view Open findings: ${openCount}"
                    onclick="event.stopPropagation(); FPCL_PSM_SUITE.openDataModal({ title: 'Open Audit Findings', badge: 'Active Open', subtitle: '${openCount} open audit findings requiring resolution', filterStatus: 'Open' })"
                  ></div>
                </div>
                <div class="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500">
                  <span class="text-emerald-700 hover:underline cursor-pointer" onclick="event.stopPropagation(); FPCL_PSM_SUITE.openDataModal({ title: 'Closed Findings', badge: 'Resolved', filterStatus: 'Close' })">${closedCount} Closed</span>
                  <span class="text-rose-700 hover:underline cursor-pointer" onclick="event.stopPropagation(); FPCL_PSM_SUITE.openDataModal({ title: 'Open Findings', badge: 'Active Open', filterStatus: 'Open' })">${openCount} Open</span>
                </div>
              </div>

            </div>

          </div>
        `;
      }

      container.innerHTML = `
        <div class="space-y-6 font-sans antialiased text-slate-800">
          ${subDashboardNav}
          ${activeSubContent}
        </div>

        <!-- ========================================================================= -->
        <!-- 8. FINDING INSPECTION MODAL                                               -->
        <!-- ========================================================================= -->
        <div id="psm-inspection-modal" class="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs hidden items-center justify-center p-4">
          <div id="psm-modal-card" class="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <!-- Populated dynamically via inspectFinding() -->
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 9. GOOGLE SHEETS LIVE CONFIG MODAL                                        -->
        <!-- ========================================================================= -->
        <div id="psm-sheet-config-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs hidden items-center justify-center p-4">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200">
              <div class="flex items-center gap-2 text-slate-900 font-bold text-base">
                <i data-lucide="file-spreadsheet" class="w-5 h-5 text-teal-600"></i>
                <span>Google Sheet Live Integration</span>
              </div>
              <button onclick="FPCL_PSM_SUITE.closeConfigModal()" class="text-slate-400 hover:text-slate-600 p-1">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>

            <div class="space-y-3 text-xs text-slate-600">
              <p>
                Configure the published Google Sheets URL to stream live audit findings, statuses, and remarks:
              </p>
              <div>
                <label class="block text-slate-700 font-bold mb-1">Google Sheets URL or CSV Export Link:</label>
                <input
                  id="psm-sheet-url-input"
                  type="text"
                  value="${window.FPCL_PSM_SHEET_URL || ''}"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                />
                <p class="text-[11px] text-slate-400 mt-1">
                  Supports standard Google Sheets links, Published to Web CSV URLs, or Google Visualization CSV endpoints.
                </p>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button onclick="FPCL_PSM_SUITE.closeConfigModal()" class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer">
                Cancel
              </button>
              <button onclick="FPCL_PSM_SUITE.saveAndSyncSheetUrl()" class="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shadow-sm">
                Save & Fetch Live Data
              </button>
            </div>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 10. INTERACTIVE DRILLDOWN DATA MODAL CONTAINER                            -->
        <!-- ========================================================================= -->
        <div id="psm-data-modal-container"></div>
      `;

      // Re-initialize icons
      if (window.lucide) {
        window.lucide.createIcons();
      }

      // Synchronize header Search Finding input and clear button with current state
      const headerSearchInput = document.getElementById('psm-header-search-input');
      const headerClearBtn = document.getElementById('psm-header-clear-search-btn');
      if (headerSearchInput && document.activeElement !== headerSearchInput) {
        headerSearchInput.value = s.searchQuery || '';
      }
      if (headerClearBtn) {
        if (s.searchQuery) {
          headerClearBtn.classList.remove('hidden');
        } else {
          headerClearBtn.classList.add('hidden');
        }
      }

      // Keep header sync icon and timestamp synchronized
      const headerSyncIcon = document.getElementById('psm-header-sync-icon');
      if (headerSyncIcon) {
        if (s.isSyncing) {
          headerSyncIcon.classList.add('animate-spin');
        } else {
          headerSyncIcon.classList.remove('animate-spin');
        }
      }
      const lastSyncEl = document.getElementById('detail-last-sync');
      if (lastSyncEl && this.state.lastSynced) {
        lastSyncEl.textContent = this.state.lastSynced;
      }
    },

    // Upgraded 960px Horizontal grouped/stacked bar chart for departments (PLR consistent styling & text sizing)
    renderDepartmentBarChart(deptList) {
      if (!deptList || deptList.length === 0) {
        return `<div class="text-center py-8 text-xs text-slate-400">No data available</div>`;
      }

      // Find maximum total to scale bars
      const maxTotal = Math.max(...deptList.map(d => d.total), 1);
      // Axis ticks up to max (e.g. 0, 5, 10, 15, 20, 25, 30...)
      const tickMax = Math.ceil(maxTotal / 5) * 5 || 5;
      const ticks = [];
      for (let t = 0; t <= tickMax; t += 5) {
        ticks.push(t);
      }

      const rowHeight = 42;
      const chartHeight = deptList.length * rowHeight + 50;
      const svgWidth = 960;
      const labelWidth = 190;
      const plotWidth = svgWidth - labelWidth - 110;

      const barsSvg = deptList.map((d, i) => {
        const y = i * rowHeight + 12;
        const totalW = (d.total / tickMax) * plotWidth;
        const openW = (d.open / tickMax) * plotWidth;
        const closeW = (d.close / tickMax) * plotWidth;
        const isSelected = this.state.deptFilter === d.name;

        return `
          <g
            class="cursor-pointer group"
            onclick="FPCL_PSM_SUITE.openDataModal({ title: 'Department: ${d.name.replace(/'/g, "\\'")}', badge: 'Action Dept', subtitle: '${d.total} Findings (${d.open} Open, ${d.close} Closed • ${d.closureRate}% Resolved)', filterDept: '${d.name.replace(/'/g, "\\'")}' })"
            onmouseenter="FPCL_PSM_SUITE.showTooltip(event, { title: '${d.name.replace(/'/g, "\\'")}', badge: 'Action Dept', color: '#0D9488', subtitle: 'Department Findings Overview', metrics: [{ label: 'Total Findings', value: '${d.total}' }, { label: 'Open Findings', value: '${d.open}', color: '#F43F5E' }, { label: 'Closed Findings', value: '${d.close}', color: '#10B981' }, { label: 'Closure Rate', value: '${d.closureRate}%' }], hint: 'Click to open ${d.total} findings for ${d.name.replace(/'/g, "\\'")}' })"
            onmousemove="FPCL_PSM_SUITE.moveTooltip(event)"
            onmouseleave="FPCL_PSM_SUITE.hideTooltip()"
          >
            <title>${d.name}: ${d.total} Total (${d.open} Open, ${d.close} Closed • ${d.closureRate}% Resolved) - Click to open data</title>

            <!-- Row hover highlight -->
            <rect x="0" y="${y - 4}" width="${svgWidth}" height="${rowHeight}" fill="${isSelected ? '#F0FDFA' : 'transparent'}" class="group-hover:fill-teal-50/60 transition-colors rounded-lg"/>
            
            <!-- Department Label (Increased font size 13px bold) -->
            <text x="${labelWidth - 14}" y="${y + 16}" fill="${isSelected ? '#0D9488' : '#1E293B'}" font-size="13" font-weight="${isSelected ? '900' : '800'}" font-family="'Plus Jakarta Sans', system-ui, sans-serif" text-anchor="end" class="transition-colors group-hover:fill-teal-700">
              ${d.name}
            </text>

            <!-- Background Track -->
            <rect x="${labelWidth}" y="${y + 2}" width="${plotWidth}" height="22" rx="5" fill="#F1F5F9"/>

            <!-- Open Findings Bar (Rose) -->
            ${d.open > 0 ? `
              <rect
                x="${labelWidth}"
                y="${y + 2}"
                width="${openW}"
                height="22"
                rx="${d.close > 0 ? '5 0 0 5' : '5'}"
                fill="#F43F5E"
                class="transition-all opacity-95 group-hover:opacity-100 cursor-pointer"
                onclick="event.stopPropagation(); FPCL_PSM_SUITE.openDataModal({ title: '${d.name.replace(/'/g, "\\'")} — Open Findings', badge: 'Active Open', subtitle: '${d.open} Open Findings Requiring Action', filterDept: '${d.name.replace(/'/g, "\\'")}', filterStatus: 'Open' })"
                onmouseenter="event.stopPropagation(); FPCL_PSM_SUITE.showTooltip(event, { title: '${d.name.replace(/'/g, "\\'")} — Open', badge: 'Active Open', color: '#F43F5E', subtitle: 'Action Pending', metrics: [{ label: 'Open Count', value: '${d.open}', color: '#F43F5E' }, { label: 'Dept Total', value: '${d.total}' }], hint: 'Click to open ${d.open} Open findings' })"
                onmousemove="event.stopPropagation(); FPCL_PSM_SUITE.moveTooltip(event)"
                onmouseleave="event.stopPropagation(); FPCL_PSM_SUITE.hideTooltip()"
              >
                <title>${d.name} Open: ${d.open} findings</title>
              </rect>
              ${openW > 18 ? `
                <text x="${labelWidth + openW / 2}" y="${y + 17}" fill="#ffffff" font-size="12" font-weight="900" font-family="monospace" text-anchor="middle" pointer-events="none">${d.open}</text>
              ` : ''}
            ` : ''}

            <!-- Closed Findings Bar (Emerald) -->
            ${d.close > 0 ? `
              <rect
                x="${labelWidth + openW}"
                y="${y + 2}"
                width="${closeW}"
                height="22"
                rx="${d.open > 0 ? '0 5 5 0' : '5'}"
                fill="#10B981"
                class="transition-all opacity-95 group-hover:opacity-100 cursor-pointer"
                onclick="event.stopPropagation(); FPCL_PSM_SUITE.openDataModal({ title: '${d.name.replace(/'/g, "\\'")} — Closed Findings', badge: 'Resolved', subtitle: '${d.close} Closed & Verified Findings', filterDept: '${d.name.replace(/'/g, "\\'")}', filterStatus: 'Close' })"
                onmouseenter="event.stopPropagation(); FPCL_PSM_SUITE.showTooltip(event, { title: '${d.name.replace(/'/g, "\\'")} — Closed', badge: 'Resolved', color: '#10B981', subtitle: 'Completed Findings', metrics: [{ label: 'Closed Count', value: '${d.close}', color: '#10B981' }, { label: 'Dept Total', value: '${d.total}' }, { label: 'Resolution Rate', value: '${d.closureRate}%' }], hint: 'Click to open ${d.close} Closed findings' })"
                onmousemove="event.stopPropagation(); FPCL_PSM_SUITE.moveTooltip(event)"
                onmouseleave="event.stopPropagation(); FPCL_PSM_SUITE.hideTooltip()"
              >
                <title>${d.name} Closed: ${d.close} findings</title>
              </rect>
              ${closeW > 18 ? `
                <text x="${labelWidth + openW + closeW / 2}" y="${y + 17}" fill="#ffffff" font-size="12" font-weight="900" font-family="monospace" text-anchor="middle" pointer-events="none">${d.close}</text>
              ` : ''}
            ` : ''}

            <!-- Total count & Resolution % at end of bar -->
            <text x="${labelWidth + totalW + 12}" y="${y + 17}" fill="#0F172A" font-size="12" font-weight="900" font-family="'Plus Jakarta Sans', monospace">
              ${d.total} <tspan fill="#0D9488" font-size="11" font-weight="700">(${d.closureRate}%)</tspan>
            </text>
          </g>
        `;
      }).join('');

      // Grid line ticks with enhanced 11px font
      const gridSvg = ticks.map(t => {
        const x = labelWidth + (t / tickMax) * plotWidth;
        return `
          <line x1="${x}" y1="5" x2="${x}" y2="${deptList.length * rowHeight + 14}" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="3 3"/>
          <text x="${x}" y="${deptList.length * rowHeight + 32}" fill="#64748B" font-size="11" font-weight="700" font-family="monospace" text-anchor="middle">${t}</text>
        `;
      }).join('');

      return `
        <svg viewBox="0 0 ${svgWidth} ${chartHeight}" class="w-full h-auto select-none overflow-visible">
          ${gridSvg}
          ${barsSvg}
        </svg>
      `;
    },

    // Dedicated Table 1 component for Action Department Findings
    renderTable1(deptList) {
      const s = this.state;
      const sumDeptTotal = deptList.reduce((acc, d) => acc + d.total, 0);
      const sumDeptOpen = deptList.reduce((acc, d) => acc + d.open, 0);
      const sumDeptClose = deptList.reduce((acc, d) => acc + d.close, 0);
      const sumDeptClosure = sumDeptTotal > 0 ? Math.round((sumDeptClose / sumDeptTotal) * 100) : 0;

      return `
        <div class="overflow-x-auto rounded-xl border border-slate-200">
          <table class="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr class="border-b border-slate-200 text-slate-700 font-black uppercase tracking-wider text-xs bg-slate-100/80">
                <th class="py-3 px-3.5 cursor-pointer hover:text-teal-600" onclick="FPCL_PSM_SUITE.sortDeptTable('name')">
                  DEPARTMENT ${s.deptTableSort.col === 'name' ? (s.deptTableSort.dir === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th class="py-3 px-3 text-center cursor-pointer hover:text-teal-600" onclick="FPCL_PSM_SUITE.sortDeptTable('total')">
                  TOTAL ${s.deptTableSort.col === 'total' ? (s.deptTableSort.dir === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th class="py-3 px-3 text-center cursor-pointer hover:text-rose-600" onclick="FPCL_PSM_SUITE.sortDeptTable('open')">
                  OPEN ${s.deptTableSort.col === 'open' ? (s.deptTableSort.dir === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th class="py-3 px-3 text-center cursor-pointer hover:text-emerald-600" onclick="FPCL_PSM_SUITE.sortDeptTable('close')">
                  CLOSE ${s.deptTableSort.col === 'close' ? (s.deptTableSort.dir === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th class="py-3 px-3.5 text-center cursor-pointer hover:text-teal-600 min-w-[130px]" onclick="FPCL_PSM_SUITE.sortDeptTable('closureRate')">
                  % CLOSURE ${s.deptTableSort.col === 'closureRate' ? (s.deptTableSort.dir === 'asc' ? '↑' : '↓') : '↕'}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              ${deptList.map(d => {
                const isSelected = s.deptFilter === d.name;
                return `
                  <tr
                    onclick="FPCL_PSM_SUITE.openDataModal({ title: 'Department: ${d.name.replace(/'/g, "\\'")}', badge: 'Action Dept', subtitle: '${d.total} Findings (${d.open} Open, ${d.close} Closed)', filterDept: '${d.name.replace(/'/g, "\\'")}' })"
                    onmouseenter="FPCL_PSM_SUITE.showTooltip(event, { title: '${d.name.replace(/'/g, "\\'")}', badge: 'Table 1', color: '#0D9488', subtitle: 'Action Department Row', metrics: [{ label: 'Total', value: '${d.total}' }, { label: 'Open', value: '${d.open}', color: '#F43F5E' }, { label: 'Closed', value: '${d.close}', color: '#10B981' }, { label: 'Closure Rate', value: '${d.closureRate}%' }], hint: 'Click to open findings for ${d.name.replace(/'/g, "\\'")}' })"
                    onmousemove="FPCL_PSM_SUITE.moveTooltip(event)"
                    onmouseleave="FPCL_PSM_SUITE.hideTooltip()"
                    class="hover:bg-teal-50/50 transition-colors cursor-pointer group ${isSelected ? 'bg-teal-50 font-bold' : ''}"
                  >
                    <td class="py-3 px-3.5 font-bold text-slate-900 group-hover:text-teal-700">
                      <span class="group-hover:underline">${d.name}</span>
                    </td>
                    <td class="py-3 px-3 text-center font-mono font-black text-slate-900">${d.total}</td>
                    <td
                      class="py-3 px-3 text-center font-mono font-black ${d.open > 0 ? 'text-rose-600 hover:bg-rose-100 rounded-md transition-colors' : 'text-slate-400'}"
                      onclick="event.stopPropagation(); FPCL_PSM_SUITE.openDataModal({ title: '${d.name.replace(/'/g, "\\'")} — Open Findings', badge: 'Active Open', subtitle: '${d.open} Open Findings', filterDept: '${d.name.replace(/'/g, "\\'")}', filterStatus: 'Open' })"
                      title="Click to view Open findings for ${d.name}"
                    >
                      ${d.open}
                    </td>
                    <td
                      class="py-3 px-3 text-center font-mono font-black ${d.close > 0 ? 'text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors' : 'text-slate-400'}"
                      onclick="event.stopPropagation(); FPCL_PSM_SUITE.openDataModal({ title: '${d.name.replace(/'/g, "\\'")} — Closed Findings', badge: 'Resolved', subtitle: '${d.close} Closed Findings', filterDept: '${d.name.replace(/'/g, "\\'")}', filterStatus: 'Close' })"
                      title="Click to view Closed findings for ${d.name}"
                    >
                      ${d.close}
                    </td>
                    <td class="py-3 px-3.5 text-center">
                      ${this.renderProgressPill(d.closureRate)}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            <!-- Total Summary Row -->
            <tfoot>
              <tr
                class="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300 cursor-pointer hover:bg-slate-200 transition-colors"
                onclick="FPCL_PSM_SUITE.openDataModal({ title: 'All Departments Summary', badge: 'Summary', subtitle: '${sumDeptTotal} Total Findings (${sumDeptOpen} Open, ${sumDeptClose} Closed)' })"
                onmouseenter="FPCL_PSM_SUITE.showTooltip(event, { title: 'All Departments Total', badge: 'Summary Row', color: '#0F172A', subtitle: 'Overall Department Scope', metrics: [{ label: 'Total', value: '${sumDeptTotal}' }, { label: 'Open', value: '${sumDeptOpen}', color: '#F43F5E' }, { label: 'Closed', value: '${sumDeptClose}', color: '#10B981' }, { label: 'Rate', value: '${sumDeptClosure}%' }], hint: 'Click to open all department records' })"
                onmousemove="FPCL_PSM_SUITE.moveTooltip(event)"
                onmouseleave="FPCL_PSM_SUITE.hideTooltip()"
              >
                <td class="py-3 px-3.5 uppercase tracking-wider">TOTAL / SUMMARY</td>
                <td class="py-3 px-3 text-center font-mono text-base font-black">${sumDeptTotal}</td>
                <td class="py-3 px-3 text-center font-mono text-base font-black text-rose-600">${sumDeptOpen}</td>
                <td class="py-3 px-3 text-center font-mono text-base font-black text-emerald-600">${sumDeptClose}</td>
                <td class="py-3 px-3.5 text-center">
                  ${this.renderProgressPill(sumDeptClosure)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    },

    // Audit Findings Trends Chart (Open vs Closed Bars Trend - matching PLR's 960px SVG layout)
    renderAuditFindingsTrendChart() {
      const s = this.state;
      const filtered = this.getFilteredData();
      const isPeriod = s.auditTrendMode === 'audit';

      let items = [];
      if (isPeriod) {
        // Group by auditNo
        const auditMap = {};
        filtered.forEach(d => {
          const a = d.auditNo || 'Unspecified';
          if (!auditMap[a]) {
            auditMap[a] = { label: a, total: 0, open: 0, closed: 0, raw: a };
          }
          auditMap[a].total += 1;
          if ((d.status || '').toLowerCase() === 'close') auditMap[a].closed += 1;
          else auditMap[a].open += 1;
        });
        items = Object.values(auditMap).sort((a, b) => a.label.localeCompare(b.label));
      } else {
        // Group by actionDepartment
        const deptList = this.getDepartmentAggregation(filtered);
        items = deptList.map(d => ({
          label: d.name,
          total: d.total,
          closed: d.close,
          open: d.open,
          raw: d.name
        }));
      }

      if (!items.length) {
        return `
          <div class="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
            <i data-lucide="inbox" class="w-8 h-8 mb-1.5 opacity-60"></i>
            <span>No trend records available for current filter selection.</span>
          </div>
        `;
      }

      const w = 960;
      const h = 340;
      const pad = { top: 32, right: 30, bottom: 125, left: 52 };
      const chartW = w - pad.left - pad.right;
      const chartH = h - pad.top - pad.bottom;
      const baseY = pad.top + chartH;

      const peak = Math.max(...items.map(d => Math.max(d.total, d.closed, d.open)), 1);
      const maxVal = Math.ceil(peak / 10) * 10 || 10;

      // Y Axis Grid lines
      const tickCount = 4;
      const yTicks = [];
      for (let i = 0; i <= tickCount; i++) {
        yTicks.push(Math.round((maxVal / tickCount) * i));
      }

      const gridSvg = yTicks.map(val => {
        const y = pad.top + chartH - (val / maxVal) * chartH;
        return `
          <line x1="${pad.left}" y1="${y}" x2="${w - pad.right}" y2="${y}" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="3 3"/>
          <text x="${pad.left - 10}" y="${y + 4}" fill="#64748B" font-size="11" font-weight="700" font-family="monospace" text-anchor="end">${val}</text>
        `;
      }).join('');

      const baselineSvg = `
        <line x1="${pad.left}" y1="${baseY}" x2="${w - pad.right}" y2="${baseY}" stroke="#94A3B8" stroke-width="2"/>
      `;

      const step = chartW / items.length;
      let contentSvg = '';

      if (s.auditTrendViewType === 'side-by-side') {
        const groupW = isPeriod ? Math.min(60, Math.max(32, step * 0.65)) : Math.min(42, Math.max(24, step * 0.7));
        const gap = 3;
        const subW = (groupW - gap) / 2;

        contentSvg = items.map((d, i) => {
          const xCenter = pad.left + i * step + step / 2;
          const xStart = xCenter - groupW / 2;
          const xClosed = xStart;
          const xOpen = xStart + subW + gap;

          const openH = (d.open / maxVal) * chartH;
          const closedH = (d.closed / maxVal) * chartH;
          const yClosed = baseY - closedH;
          const yOpen = baseY - openH;

          const labelText = d.label;
          const isSelected = isPeriod ? (s.auditFilter === d.raw) : (s.deptFilter === d.raw);
          const escapedRaw = (d.raw || '').replace(/'/g, "\\'");
          
          const groupClickHandler = isPeriod
            ? `FPCL_PSM_SUITE.setAuditFilter('${escapedRaw}'); FPCL_PSM_SUITE.openDataModal({ title: 'Audit Period: ' + '${labelText}', badge: 'Audit No', subtitle: '${d.total} Findings (${d.closed} Closed • ${d.open} Open)', filterAudit: '${escapedRaw}' })`
            : `FPCL_PSM_SUITE.setDeptFilter('${escapedRaw}'); FPCL_PSM_SUITE.openDataModal({ title: 'Department: ' + '${labelText}', badge: 'Action Dept', subtitle: '${d.total} Findings (${d.closed} Closed • ${d.open} Open)', filterDept: '${escapedRaw}' })`;

          const closedBarClickHandler = `event.stopPropagation(); FPCL_PSM_SUITE.openDataModal({ title: '${labelText} (Closed)', badge: 'Closed', subtitle: '${d.closed} Closed findings', ${isPeriod ? `filterAudit: '${escapedRaw}'` : `filterDept: '${escapedRaw}'`}, filterStatus: 'Close' })`;
          const openBarClickHandler = `event.stopPropagation(); FPCL_PSM_SUITE.openDataModal({ title: '${labelText} (Open)', badge: 'Active Open', subtitle: '${d.open} Open pending findings', ${isPeriod ? `filterAudit: '${escapedRaw}'` : `filterDept: '${escapedRaw}'`}, filterStatus: 'Open' })`;

          const resPct = d.total > 0 ? ((d.closed / d.total) * 100).toFixed(0) : 0;
          const labelY = baseY + 14;

          const yClosedVal = d.closed > 0 ? yClosed - 6 : baseY - 6;
          const yOpenVal = d.open > 0 ? yOpen - 6 : baseY - 6;
          const highestValY = Math.min(yClosedVal, yOpenVal);

          return `
            <g class="cursor-pointer group" onclick="${groupClickHandler}">
              <title>${labelText}&#10;Total: ${d.total} Findings&#10;Closed: ${d.closed} (${resPct}%)&#10;Open: ${d.open}</title>
              
              <!-- Hover column highlight -->
              <rect x="${xStart - 5}" y="${pad.top}" width="${groupW + 10}" height="${chartH}" fill="#F8FAFC" rx="6" class="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>

              <!-- Closed Bar (Emerald) -->
              ${d.closed > 0 ? `
                <rect
                  x="${xClosed}"
                  y="${yClosed}"
                  width="${subW}"
                  height="${Math.max(closedH, 3)}"
                  fill="#10B981"
                  rx="3"
                  class="transition-all group-hover:fill-[#059669] cursor-pointer"
                  onclick="${closedBarClickHandler}"
                />
              ` : `
                <rect x="${xClosed}" y="${baseY - 2}" width="${subW}" height="2" fill="#CBD5E1" rx="1"/>
              `}

              <!-- Open Bar (Rose) -->
              ${d.open > 0 ? `
                <rect
                  x="${xOpen}"
                  y="${yOpen}"
                  width="${subW}"
                  height="${Math.max(openH, 3)}"
                  fill="#F43F5E"
                  rx="3"
                  class="transition-all group-hover:fill-[#E11D48] cursor-pointer"
                  onclick="${openBarClickHandler}"
                />
              ` : `
                <rect x="${xOpen}" y="${baseY - 2}" width="${subW}" height="2" fill="#E2E8F0" rx="1"/>
              `}

              <!-- Value for Closed Bar (Emerald - increased font size 11px) -->
              <text
                x="${xClosed + subW / 2}"
                y="${yClosedVal}"
                fill="${d.closed > 0 ? '#047857' : '#94A3B8'}"
                font-size="11"
                font-weight="900"
                font-family="monospace"
                text-anchor="middle"
              >${d.closed}</text>

              <!-- Value for Open Bar (Rose - increased font size 11px) -->
              <text
                x="${xOpen + subW / 2}"
                y="${yOpenVal}"
                fill="${d.open > 0 ? '#B91C1C' : '#94A3B8'}"
                font-size="11"
                font-weight="900"
                font-family="monospace"
                text-anchor="middle"
              >${d.open}</text>

              <!-- Total indicator above pair (increased font size 12px) -->
              <text
                x="${xCenter}"
                y="${highestValY - 10}"
                fill="#0F172A"
                font-size="12"
                font-weight="900"
                font-family="monospace"
                text-anchor="middle"
              >${d.total}</text>

              <!-- Baseline tick mark -->
              <line x1="${xCenter}" y1="${baseY}" x2="${xCenter}" y2="${baseY + 6}" stroke="#94A3B8" stroke-width="1.5"/>

              <!-- X Axis Label (Rotated 45 degrees, font size 11.5px bold) -->
              <text
                x="${xCenter}"
                y="${labelY}"
                fill="${isSelected ? '#0D9488' : '#334155'}"
                font-size="11.5"
                font-weight="${isSelected ? '900' : '700'}"
                font-family="'Plus Jakarta Sans', system-ui, sans-serif"
                text-anchor="end"
                transform="rotate(-45, ${xCenter}, ${labelY})"
                class="group-hover:fill-teal-700 transition-colors"
              >${labelText}<title>${labelText} (${d.total} Findings)</title></text>
            </g>
          `;
        }).join('');
      } else if (s.auditTrendViewType === 'trend') {
        // Executive Trend lines mode with data point pills
        const pointsClosed = [];
        const pointsOpen = [];
        const pointsTotal = [];

        items.forEach((d, i) => {
          const cx = pad.left + i * step + step / 2;
          const cyClosed = pad.top + chartH - (d.closed / maxVal) * chartH;
          const cyOpen = pad.top + chartH - (d.open / maxVal) * chartH;
          const cyTotal = pad.top + chartH - (d.total / maxVal) * chartH;
          pointsClosed.push({ x: cx, y: cyClosed, val: d.closed, d });
          pointsOpen.push({ x: cx, y: cyOpen, val: d.open, d });
          pointsTotal.push({ x: cx, y: cyTotal, val: d.total, d });
        });

        const lineClosedPath = pointsClosed.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const lineOpenPath = pointsOpen.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const lineTotalPath = pointsTotal.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

        contentSvg = `
          <!-- Total Path -->
          <path d="${lineTotalPath}" fill="none" stroke="#64748B" stroke-width="2.5" stroke-dasharray="4 4" opacity="0.8"/>
          <!-- Closed Path (Emerald) -->
          <path d="${lineClosedPath}" fill="none" stroke="#10B981" stroke-width="3.5" class="transition-all"/>
          <!-- Open Path (Rose) -->
          <path d="${lineOpenPath}" fill="none" stroke="#F43F5E" stroke-width="3.5" class="transition-all"/>

          <!-- Circles and values -->
          ${pointsClosed.map(p => `
            <circle cx="${p.x}" cy="${p.y}" r="5" fill="#10B981" stroke="#FFFFFF" stroke-width="2"/>
            <text x="${p.x}" y="${p.y - 10}" fill="#047857" font-size="11" font-weight="900" font-family="monospace" text-anchor="middle">${p.val}</text>
          `).join('')}

          ${pointsOpen.map(p => `
            <circle cx="${p.x}" cy="${p.y}" r="5" fill="#F43F5E" stroke="#FFFFFF" stroke-width="2"/>
            <text x="${p.x}" y="${p.y - 10}" fill="#B91C1C" font-size="11" font-weight="900" font-family="monospace" text-anchor="middle">${p.val}</text>
          `).join('')}

          <!-- X axis labels -->
          ${items.map((d, i) => {
            const xCenter = pad.left + i * step + step / 2;
            const labelY = baseY + 14;
            return `
              <line x1="${xCenter}" y1="${baseY}" x2="${xCenter}" y2="${baseY + 6}" stroke="#94A3B8" stroke-width="1.5"/>
              <text
                x="${xCenter}"
                y="${labelY}"
                fill="#334155"
                font-size="11.5"
                font-weight="700"
                font-family="'Plus Jakarta Sans', system-ui, sans-serif"
                text-anchor="end"
                transform="rotate(-45, ${xCenter}, ${labelY})"
              >${d.label}</text>
            `;
          }).join('')}
        `;
      } else {
        // Stacked Bars mode
        const groupW = Math.min(48, Math.max(26, step * 0.65));

        contentSvg = items.map((d, i) => {
          const xCenter = pad.left + i * step + step / 2;
          const xStart = xCenter - groupW / 2;
          const totalH = (d.total / maxVal) * chartH;
          const closedH = (d.closed / maxVal) * chartH;
          const openH = (d.open / maxVal) * chartH;

          const yClosed = baseY - closedH;
          const yOpen = yClosed - openH;
          const labelY = baseY + 14;

          return `
            <g class="cursor-pointer group" onclick="FPCL_PSM_SUITE.openDataModal({ title: '${d.label}', badge: 'Stacked Breakdown', subtitle: '${d.total} Total (${d.closed} Closed, ${d.open} Open)' })">
              <!-- Closed Stack (Emerald) -->
              <rect x="${xStart}" y="${yClosed}" width="${groupW}" height="${closedH}" fill="#10B981" rx="${openH > 0 ? '0 0 4 4' : '4'}"/>
              <!-- Open Stack (Rose) -->
              <rect x="${xStart}" y="${yOpen}" width="${groupW}" height="${openH}" fill="#F43F5E" rx="${closedH > 0 ? '4 4 0 0' : '4'}"/>
              
              <!-- Total number on top -->
              <text x="${xCenter}" y="${yOpen - 8}" fill="#0F172A" font-size="12" font-weight="900" font-family="monospace" text-anchor="middle">${d.total}</text>
              
              <line x1="${xCenter}" y1="${baseY}" x2="${xCenter}" y2="${baseY + 6}" stroke="#94A3B8" stroke-width="1.5"/>
              <text
                x="${xCenter}"
                y="${labelY}"
                fill="#334155"
                font-size="11.5"
                font-weight="700"
                font-family="'Plus Jakarta Sans', system-ui, sans-serif"
                text-anchor="end"
                transform="rotate(-45, ${xCenter}, ${labelY})"
              >${d.label}</text>
            </g>
          `;
        }).join('');
      }

      return `
        <svg viewBox="0 0 ${w} ${h}" class="w-full h-auto select-none overflow-visible">
          ${gridSvg}
          ${baselineSvg}
          ${contentSvg}
        </svg>
      `;
    },

    // Horizontal grouped/stacked bar chart for PSM Validation Departments (960px SVG layout)
    renderValidationDeptBarChart(deptBreakdown) {
      if (!deptBreakdown || deptBreakdown.length === 0) {
        return `<div class="text-center py-8 text-xs text-slate-400 font-medium">No department qualification records available</div>`;
      }

      const maxTotal = Math.max(...deptBreakdown.map(d => d.total), 1);
      const tickMax = Math.ceil(maxTotal / 5) * 5 || 5;
      const ticks = [];
      for (let t = 0; t <= tickMax; t += 5) {
        ticks.push(t);
      }

      const rowHeight = 42;
      const chartHeight = deptBreakdown.length * rowHeight + 50;
      const svgWidth = 960;
      const labelWidth = 190;
      const plotWidth = svgWidth - labelWidth - 110;

      const barsSvg = deptBreakdown.map((d, i) => {
        const y = i * rowHeight + 12;
        const totalW = (d.total / tickMax) * plotWidth;
        const trainedW = (d.trained / tickMax) * plotWidth;
        const untrainedW = (d.untrained / tickMax) * plotWidth;
        const isSelected = this.state.validationState && this.state.validationState.deptFilter === d.name;

        return `
          <g
            class="cursor-pointer group"
            onclick="FPCL_PSM_SUITE.setValidationFilter('deptFilter', '${isSelected ? 'all' : d.name}')"
            onmouseenter="FPCL_PSM_SUITE.showTooltip(event, { title: '${d.name.replace(/'/g, "\\'")}', badge: 'Department Matrix', color: '#0D9488', subtitle: 'Training Compliance Matrix', metrics: [{ label: 'Total Personnel', value: '${d.total}' }, { label: 'Trained Personnel', value: '${d.trained}', color: '#10B981' }, { label: 'Require Training', value: '${d.untrained}', color: '#F59E0B' }, { label: 'Compliance Rate', value: '${d.compliance}%' }], hint: 'Click to filter records for ${d.name.replace(/'/g, "\\'")}' })"
            onmousemove="FPCL_PSM_SUITE.moveTooltip(event)"
            onmouseleave="FPCL_PSM_SUITE.hideTooltip()"
            title="Click to filter by ${d.name} (${d.trained} Trained, ${d.untrained} Require Training)"
          >
            <!-- Row hover background -->
            <rect x="0" y="${y - 4}" width="${svgWidth}" height="${rowHeight}" fill="${isSelected ? '#F0FDFA' : 'transparent'}" class="group-hover:fill-teal-50/60 transition-colors rounded-lg"/>
            
            <!-- Department Label (13px bold) -->
            <text x="${labelWidth - 14}" y="${y + 16}" fill="${isSelected ? '#0D9488' : '#1E293B'}" font-size="13" font-weight="${isSelected ? '900' : '800'}" font-family="'Plus Jakarta Sans', system-ui, sans-serif" text-anchor="end" class="transition-colors group-hover:fill-teal-700">
              ${d.name}
            </text>

            <!-- Background Track -->
            <rect x="${labelWidth}" y="${y + 2}" width="${plotWidth}" height="22" rx="5" fill="#F1F5F9"/>

            <!-- Trained Personnel Bar (Emerald) -->
            ${d.trained > 0 ? `
              <rect
                x="${labelWidth}"
                y="${y + 2}"
                width="${trainedW}"
                height="22"
                rx="${d.untrained > 0 ? '5 0 0 5' : '5'}"
                fill="#10B981"
                class="transition-all opacity-95 group-hover:opacity-100"
              />
              ${trainedW > 18 ? `
                <text x="${labelWidth + trainedW / 2}" y="${y + 17}" fill="#ffffff" font-size="12" font-weight="900" font-family="monospace" text-anchor="middle" pointer-events="none">${d.trained}</text>
              ` : ''}
            ` : ''}

            <!-- Require Training / Untrained Bar (Amber) -->
            ${d.untrained > 0 ? `
              <rect
                x="${labelWidth + trainedW}"
                y="${y + 2}"
                width="${untrainedW}"
                height="22"
                rx="${d.trained > 0 ? '0 5 5 0' : '5'}"
                fill="#F59E0B"
                class="transition-all opacity-95 group-hover:opacity-100"
              />
              ${untrainedW > 18 ? `
                <text x="${labelWidth + trainedW + untrainedW / 2}" y="${y + 17}" fill="#ffffff" font-size="12" font-weight="900" font-family="monospace" text-anchor="middle" pointer-events="none">${d.untrained}</text>
              ` : ''}
            ` : ''}

            <!-- Total count & Compliance % label -->
            <text x="${labelWidth + totalW + 12}" y="${y + 17}" fill="#0F172A" font-size="12" font-weight="900" font-family="'Plus Jakarta Sans', monospace">
              ${d.total} <tspan fill="${d.compliance === 100 ? '#10B981' : '#F59E0B'}" font-size="11" font-weight="700">(${d.compliance}% Compliant)</tspan>
            </text>
          </g>
        `;
      }).join('');

      const gridSvg = ticks.map(t => {
        const x = labelWidth + (t / tickMax) * plotWidth;
        return `
          <line x1="${x}" y1="5" x2="${x}" y2="${deptBreakdown.length * rowHeight + 14}" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="3 3"/>
          <text x="${x}" y="${deptBreakdown.length * rowHeight + 32}" fill="#64748B" font-size="11" font-weight="700" font-family="monospace" text-anchor="middle">${t}</text>
        `;
      }).join('');

      return `
        <svg viewBox="0 0 ${svgWidth} ${chartHeight}" class="w-full h-auto select-none overflow-visible">
          ${gridSvg}
          ${barsSvg}
        </svg>
      `;
    },

    // Interactive Module Validation Compliance Matrix (Pass / Fail Bar Chart)
    renderValidationModuleBarChart(moduleBreakdown) {
      if (!moduleBreakdown || moduleBreakdown.length === 0) {
        return `
          <div class="py-12 text-center text-slate-400 font-medium text-xs">
            No module qualification records available
          </div>
        `;
      }

      const vs = this.state.validationState || {};
      const maxTotal = Math.max(...moduleBreakdown.map(m => m.total), 1);
      let step = 5;
      if (maxTotal > 150) step = 25;
      else if (maxTotal > 80) step = 10;
      else step = 5;
      const tickMax = Math.ceil(maxTotal / step) * step || step;
      const ticks = [];
      for (let t = 0; t <= tickMax; t += step) {
        ticks.push(t);
      }

      const rowHeight = 42;
      const chartHeight = moduleBreakdown.length * rowHeight + 50;
      const svgWidth = 960;
      const labelWidth = 190;
      const plotWidth = svgWidth - labelWidth - 110;

      const barsSvg = moduleBreakdown.map((m, index) => {
        const y = index * rowHeight + 12;
        const totalW = (m.total / tickMax) * plotWidth;
        const passedW = (m.passed / tickMax) * plotWidth;
        const failedW = (m.failed / tickMax) * plotWidth;
        const pendingW = (m.pending / tickMax) * plotWidth;
        const isSelected = vs.moduleFilter === m.name;

        return `
          <g class="cursor-pointer group select-none"
             onclick="FPCL_PSM_SUITE.setValidationFilter('moduleFilter', vs.moduleFilter === '${m.name.replace(/'/g, "\\'")}' ? 'all' : '${m.name.replace(/'/g, "\\'")}')"
             onmouseenter="FPCL_PSM_SUITE.showTooltip(event, { title: 'Module: ${m.name.replace(/'/g, "\\'")}', badge: '${m.passRate}% Pass Rate', color: '#2563EB', subtitle: 'Module Validation Compliance', metrics: [{ label: 'Total In Scope', value: '${m.total}' }, { label: 'Passed Validations', value: '${m.passed}' }, { label: 'Failed Validations', value: '${m.failed}' }, { label: 'Pass Rate', value: '${m.passRate}%' }], hint: 'Click to filter records by module ${m.name.replace(/'/g, "\\'")}' })"
             onmousemove="FPCL_PSM_SUITE.moveTooltip(event)"
             onmouseleave="FPCL_PSM_SUITE.hideTooltip()"
             title="Click to filter by ${m.name} (${m.passed} Passed, ${m.failed} Failed)">
            
            <!-- Row hover background -->
            <rect x="0" y="${y - 4}" width="${svgWidth}" height="${rowHeight}" fill="${isSelected ? '#EFF6FF' : 'transparent'}" class="group-hover:fill-blue-50/60 transition-colors rounded-lg"/>

            <!-- Module Label (13px bold, matching department matrix) -->
            <text x="${labelWidth - 14}" y="${y + 16}" fill="${isSelected ? '#1D4ED8' : '#1E293B'}" font-size="13" font-weight="${isSelected ? '900' : '800'}" font-family="'Plus Jakarta Sans', system-ui, sans-serif" text-anchor="end" class="transition-colors group-hover:fill-blue-700">
              ${m.name.length > 22 ? m.name.substring(0, 21) + '…' : m.name}
            </text>

            <!-- Background track bar -->
            <rect x="${labelWidth}" y="${y + 2}" width="${plotWidth}" height="22" rx="5" fill="#F1F5F9"/>

            <!-- Passed Segment (Emerald) -->
            ${m.passed > 0 ? `
              <rect
                x="${labelWidth}"
                y="${y + 2}"
                width="${passedW}"
                height="22"
                rx="${m.failed > 0 || m.pending > 0 ? '5 0 0 5' : '5'}"
                fill="#10B981"
                class="transition-all opacity-95 group-hover:opacity-100"
              />
              ${passedW > 18 ? `
                <text x="${labelWidth + passedW / 2}" y="${y + 17}" fill="#ffffff" font-size="12" font-weight="900" font-family="monospace" text-anchor="middle" pointer-events="none">${m.passed}</text>
              ` : ''}
            ` : ''}

            <!-- Failed Segment (Rose) -->
            ${m.failed > 0 ? `
              <rect
                x="${labelWidth + passedW}"
                y="${y + 2}"
                width="${failedW}"
                height="22"
                rx="${m.passed > 0 ? (m.pending > 0 ? '0' : '0 5 5 0') : (m.pending > 0 ? '5 0 0 5' : '5')}"
                fill="#EF4444"
                class="transition-all opacity-95 group-hover:opacity-100"
              />
              ${failedW > 18 ? `
                <text x="${labelWidth + passedW + failedW / 2}" y="${y + 17}" fill="#ffffff" font-size="12" font-weight="900" font-family="monospace" text-anchor="middle" pointer-events="none">${m.failed}</text>
              ` : ''}
            ` : ''}

            <!-- Pending Segment (Slate) -->
            ${m.pending > 0 ? `
              <rect
                x="${labelWidth + passedW + failedW}"
                y="${y + 2}"
                width="${pendingW}"
                height="22"
                rx="${m.passed > 0 || m.failed > 0 ? '0 5 5 0' : '5'}"
                fill="#94A3B8"
                class="transition-all opacity-95 group-hover:opacity-100"
              />
              ${pendingW > 18 ? `
                <text x="${labelWidth + passedW + failedW + pendingW / 2}" y="${y + 17}" fill="#ffffff" font-size="12" font-weight="900" font-family="monospace" text-anchor="middle" pointer-events="none">${m.pending}</text>
              ` : ''}
            ` : ''}

            <!-- Total count & Pass Rate % label -->
            <text x="${labelWidth + totalW + 12}" y="${y + 17}" fill="#0F172A" font-size="12" font-weight="900" font-family="'Plus Jakarta Sans', monospace">
              ${m.total} <tspan fill="${m.passRate === 100 ? '#10B981' : m.failed > 0 ? '#EF4444' : '#F59E0B'}" font-size="11" font-weight="700">(${m.passRate}% Pass)</tspan>
            </text>
          </g>
        `;
      }).join('');

      const gridSvg = ticks.map(t => {
        const x = labelWidth + (t / tickMax) * plotWidth;
        return `
          <line x1="${x}" y1="5" x2="${x}" y2="${moduleBreakdown.length * rowHeight + 14}" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="3 3"/>
          <text x="${x}" y="${moduleBreakdown.length * rowHeight + 32}" fill="#64748B" font-size="11" font-weight="700" font-family="monospace" text-anchor="middle">${t}</text>
        `;
      }).join('');

      return `
        <svg viewBox="0 0 ${svgWidth} ${chartHeight}" class="w-full h-auto select-none overflow-visible">
          ${gridSvg}
          ${barsSvg}
        </svg>
      `;
    },

    // Interactive Department Training Matrix Table for PSM Validation
    renderValidationDeptTable(deptBreakdown) {
      const vs = this.state.validationState || {};
      const sumTotal = deptBreakdown.reduce((acc, d) => acc + d.total, 0);
      const sumTrained = deptBreakdown.reduce((acc, d) => acc + d.trained, 0);
      const sumUntrained = deptBreakdown.reduce((acc, d) => acc + d.untrained, 0);
      const sumCompliance = sumTotal > 0 ? Math.round((sumTrained / sumTotal) * 100) : 0;

      return `
        <div class="overflow-x-auto rounded-xl border border-slate-200">
          <table class="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr class="border-b border-slate-200 text-slate-700 font-black uppercase tracking-wider text-xs bg-slate-100/80">
                <th class="py-3 px-3.5">DEPARTMENT</th>
                <th class="py-3 px-3 text-center">TOTAL PERSONNEL</th>
                <th class="py-3 px-3 text-center">TRAINED (YES)</th>
                <th class="py-3 px-3 text-center">REQUIRE TRAINING</th>
                <th class="py-3 px-3.5 text-center min-w-[130px]">% COMPLIANCE</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              ${deptBreakdown.map(d => {
                const isSelected = vs.deptFilter === d.name;
                return `
                  <tr
                    onclick="FPCL_PSM_SUITE.setValidationFilter('deptFilter', '${isSelected ? 'all' : d.name}')"
                    class="hover:bg-teal-50/50 transition-colors cursor-pointer group ${isSelected ? 'bg-teal-50 font-bold' : ''}"
                    title="Click to filter by ${d.name}"
                  >
                    <td class="py-3 px-3.5 font-bold text-slate-900 group-hover:text-teal-700">
                      <span class="group-hover:underline">${d.name}</span>
                    </td>
                    <td class="py-3 px-3 text-center font-mono font-black text-slate-900">${d.total}</td>
                    <td class="py-3 px-3 text-center font-mono font-black text-emerald-600">${d.trained}</td>
                    <td class="py-3 px-3 text-center font-mono font-black ${d.untrained > 0 ? 'text-amber-600' : 'text-slate-400'}">${d.untrained}</td>
                    <td class="py-3 px-3.5 text-center">
                      ${this.renderProgressPill(d.compliance)}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr class="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                <td class="py-3 px-3.5 uppercase tracking-wider">TOTAL / SUMMARY</td>
                <td class="py-3 px-3 text-center font-mono text-base font-black">${sumTotal}</td>
                <td class="py-3 px-3 text-center font-mono text-base font-black text-emerald-600">${sumTrained}</td>
                <td class="py-3 px-3 text-center font-mono text-base font-black text-amber-600">${sumUntrained}</td>
                <td class="py-3 px-3.5 text-center">
                  ${this.renderProgressPill(sumCompliance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    },

    // Validation Compliance & Cadre Trends Chart (Trained vs Require Training Bars Trend - 960px SVG)
    renderValidationTrendChart() {
      const vs = this.state.validationState || {};
      const filtered = this.getFilteredValidationData();
      const isCadre = vs.trendMode === 'cadre';

      let items = [];
      if (isCadre) {
        // Group by Cadre: Mngt, JMC, Staff
        const cadres = ['Mngt', 'JMC', 'Staff'];
        items = cadres.map(c => {
          const recs = filtered.filter(r => (r.cadre || '').toLowerCase() === c.toLowerCase());
          const total = recs.length;
          const trained = recs.filter(r => (r.training || '').toLowerCase() === 'yes').length;
          const untrained = total - trained;
          return {
            label: c === 'Mngt' ? 'Management (Mngt)' : c === 'JMC' ? 'Junior Management (JMC)' : 'Staff Cadre',
            total,
            trained,
            untrained,
            raw: c
          };
        });
      } else {
        // Group by Department
        const allDepts = Array.from(new Set(filtered.map(d => d.department).filter(Boolean))).sort();
        items = allDepts.map(d => {
          const recs = filtered.filter(r => r.department === d);
          const total = recs.length;
          const trained = recs.filter(r => (r.training || '').toLowerCase() === 'yes').length;
          const untrained = total - trained;
          return {
            label: d,
            total,
            trained,
            untrained,
            raw: d
          };
        });
      }

      if (!items.length) {
        return `
          <div class="h-44 flex flex-col items-center justify-center text-slate-400 text-xs font-medium">
            <i data-lucide="inbox" class="w-8 h-8 mb-1.5 opacity-60"></i>
            <span>No validation records found for the current filter criteria.</span>
          </div>
        `;
      }

      const w = 960;
      const h = 340;
      const pad = { top: 32, right: 30, bottom: 125, left: 52 };
      const chartW = w - pad.left - pad.right;
      const chartH = h - pad.top - pad.bottom;
      const baseY = pad.top + chartH;

      const peak = Math.max(...items.map(d => Math.max(d.total, d.trained, d.untrained)), 1);
      const maxVal = Math.ceil(peak / 10) * 10 || 10;

      const tickCount = 4;
      const yTicks = [];
      for (let i = 0; i <= tickCount; i++) {
        yTicks.push(Math.round((maxVal / tickCount) * i));
      }

      const gridSvg = yTicks.map(val => {
        const y = pad.top + chartH - (val / maxVal) * chartH;
        return `
          <line x1="${pad.left}" y1="${y}" x2="${w - pad.right}" y2="${y}" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="3 3"/>
          <text x="${pad.left - 10}" y="${y + 4}" fill="#64748B" font-size="11" font-weight="700" font-family="monospace" text-anchor="end">${val}</text>
        `;
      }).join('');

      const baselineSvg = `
        <line x1="${pad.left}" y1="${baseY}" x2="${w - pad.right}" y2="${baseY}" stroke="#94A3B8" stroke-width="2"/>
      `;

      const step = chartW / items.length;
      let contentSvg = '';

      if (vs.trendViewType === 'side-by-side' || !vs.trendViewType) {
        const groupW = isCadre ? Math.min(65, Math.max(38, step * 0.55)) : Math.min(42, Math.max(24, step * 0.7));
        const gap = 5;
        const subW = (groupW - gap) / 2;

        contentSvg = items.map((d, i) => {
          const xCenter = pad.left + i * step + step / 2;
          const xStart = xCenter - groupW / 2;
          const xTrained = xStart;
          const xUntrained = xStart + subW + gap;

          const trainedH = (d.trained / maxVal) * chartH;
          const untrainedH = (d.untrained / maxVal) * chartH;
          const yTrained = baseY - trainedH;
          const yUntrained = baseY - untrainedH;

          const labelText = d.label;
          const isSelected = isCadre ? (vs.cadreFilter === d.raw) : (vs.deptFilter === d.raw);
          const escapedRaw = (d.raw || '').replace(/'/g, "\\'");

          const groupClickHandler = isCadre
            ? `FPCL_PSM_SUITE.setValidationFilter('cadreFilter', '${escapedRaw}')`
            : `FPCL_PSM_SUITE.setValidationFilter('deptFilter', '${escapedRaw}')`;

          const compPct = d.total > 0 ? ((d.trained / d.total) * 100).toFixed(0) : 0;
          const labelY = baseY + 14;

          let yTrainedVal = d.trained > 0 ? yTrained - 6 : baseY - 6;
          let yUntrainedVal = d.untrained > 0 ? yUntrained - 6 : baseY - 6;
          if (d.trained > 0 && d.untrained > 0 && Math.abs(yTrained - yUntrained) < 16) {
            yTrainedVal = yTrainedVal - 14;
          }
          const highestValY = Math.min(yTrainedVal, yUntrainedVal);

          return `
            <g class="cursor-pointer group" onclick="${groupClickHandler}">
              <title>${labelText}&#10;Total: ${d.total} Personnel&#10;Trained: ${d.trained} (${compPct}%)&#10;Require Training: ${d.untrained}</title>
              
              <!-- Hover column highlight -->
              <rect x="${xStart - 5}" y="${pad.top}" width="${groupW + 10}" height="${chartH}" fill="#F8FAFC" rx="6" class="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>

              <!-- Trained Bar (Emerald) -->
              ${d.trained > 0 ? `
                <rect
                  x="${xTrained}"
                  y="${yTrained}"
                  width="${subW}"
                  height="${Math.max(trainedH, 3)}"
                  fill="#10B981"
                  rx="3"
                  class="transition-all group-hover:fill-[#059669]"
                />
              ` : `
                <rect x="${xTrained}" y="${baseY - 2}" width="${subW}" height="2" fill="#CBD5E1" rx="1"/>
              `}

              <!-- Require Training Bar (Amber) -->
              ${d.untrained > 0 ? `
                <rect
                  x="${xUntrained}"
                  y="${yUntrained}"
                  width="${subW}"
                  height="${Math.max(untrainedH, 3)}"
                  fill="#F59E0B"
                  rx="3"
                  class="transition-all group-hover:fill-[#D97706]"
                />
              ` : `
                <rect x="${xUntrained}" y="${baseY - 2}" width="${subW}" height="2" fill="#E2E8F0" rx="1"/>
              `}

              <!-- Value for Trained Bar (Emerald) -->
              <text
                x="${xTrained + subW / 2}"
                y="${yTrainedVal}"
                fill="${d.trained > 0 ? '#047857' : '#94A3B8'}"
                font-size="11"
                font-weight="900"
                font-family="monospace"
                text-anchor="middle"
              >${d.trained}</text>

              <!-- Value for Untrained Bar (Amber) -->
              <text
                x="${xUntrained + subW / 2}"
                y="${yUntrainedVal}"
                fill="${d.untrained > 0 ? '#B45309' : '#94A3B8'}"
                font-size="11"
                font-weight="900"
                font-family="monospace"
                text-anchor="middle"
              >${d.untrained}</text>

              <!-- Total indicator above pair -->
              <text
                x="${xCenter}"
                y="${highestValY - 10}"
                fill="#0F172A"
                font-size="12"
                font-weight="900"
                font-family="monospace"
                text-anchor="middle"
              >${d.total}</text>

              <line x1="${xCenter}" y1="${baseY}" x2="${xCenter}" y2="${baseY + 6}" stroke="#94A3B8" stroke-width="1.5"/>

              <!-- X Axis Label -->
              <text
                x="${xCenter}"
                y="${labelY}"
                fill="${isSelected ? '#0D9488' : '#334155'}"
                font-size="11.5"
                font-weight="${isSelected ? '900' : '700'}"
                font-family="'Plus Jakarta Sans', system-ui, sans-serif"
                text-anchor="end"
                transform="rotate(-45, ${xCenter}, ${labelY})"
                class="group-hover:fill-teal-700 transition-colors"
              >${labelText}<title>${labelText} (${d.total} Personnel)</title></text>
            </g>
          `;
        }).join('');
      } else if (vs.trendViewType === 'trend') {
        const pointsTrained = [];
        const pointsUntrained = [];
        const pointsTotal = [];

        items.forEach((d, i) => {
          const cx = pad.left + i * step + step / 2;
          const cyTrained = pad.top + chartH - (d.trained / maxVal) * chartH;
          const cyUntrained = pad.top + chartH - (d.untrained / maxVal) * chartH;
          const cyTotal = pad.top + chartH - (d.total / maxVal) * chartH;
          pointsTrained.push({ x: cx, y: cyTrained, val: d.trained, d });
          pointsUntrained.push({ x: cx, y: cyUntrained, val: d.untrained, d });
          pointsTotal.push({ x: cx, y: cyTotal, val: d.total, d });
        });

        const lineTrainedPath = pointsTrained.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const lineUntrainedPath = pointsUntrained.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const lineTotalPath = pointsTotal.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

        contentSvg = `
          <path d="${lineTotalPath}" fill="none" stroke="#64748B" stroke-width="2.5" stroke-dasharray="4 4" opacity="0.8"/>
          <path d="${lineTrainedPath}" fill="none" stroke="#10B981" stroke-width="3.5"/>
          <path d="${lineUntrainedPath}" fill="none" stroke="#F59E0B" stroke-width="3.5"/>

          ${pointsTrained.map(p => `
            <circle cx="${p.x}" cy="${p.y}" r="5" fill="#10B981" stroke="#FFFFFF" stroke-width="2"/>
            <text x="${p.x}" y="${p.y - 10}" fill="#047857" font-size="11" font-weight="900" font-family="monospace" text-anchor="middle">${p.val}</text>
          `).join('')}

          ${pointsUntrained.map(p => `
            <circle cx="${p.x}" cy="${p.y}" r="5" fill="#F59E0B" stroke="#FFFFFF" stroke-width="2"/>
            <text x="${p.x}" y="${p.y - 10}" fill="#B45309" font-size="11" font-weight="900" font-family="monospace" text-anchor="middle">${p.val}</text>
          `).join('')}

          ${items.map((d, i) => {
            const xCenter = pad.left + i * step + step / 2;
            const labelY = baseY + 14;
            return `
              <line x1="${xCenter}" y1="${baseY}" x2="${xCenter}" y2="${baseY + 6}" stroke="#94A3B8" stroke-width="1.5"/>
              <text
                x="${xCenter}"
                y="${labelY}"
                fill="#334155"
                font-size="11.5"
                font-weight="700"
                font-family="'Plus Jakarta Sans', system-ui, sans-serif"
                text-anchor="end"
                transform="rotate(-45, ${xCenter}, ${labelY})"
              >${d.label}</text>
            `;
          }).join('')}
        `;
      } else {
        // Stacked Bars mode
        const groupW = Math.min(48, Math.max(26, step * 0.65));

        contentSvg = items.map((d, i) => {
          const xCenter = pad.left + i * step + step / 2;
          const xStart = xCenter - groupW / 2;
          const totalH = (d.total / maxVal) * chartH;
          const trainedH = (d.trained / maxVal) * chartH;
          const untrainedH = (d.untrained / maxVal) * chartH;

          const yTrained = baseY - trainedH;
          const yUntrained = yTrained - untrainedH;
          const labelY = baseY + 14;

          return `
            <g class="cursor-pointer group">
              <rect x="${xStart}" y="${yTrained}" width="${groupW}" height="${trainedH}" fill="#10B981" rx="${untrainedH > 0 ? '0 0 4 4' : '4'}"/>
              <rect x="${xStart}" y="${yUntrained}" width="${groupW}" height="${untrainedH}" fill="#F59E0B" rx="${trainedH > 0 ? '4 4 0 0' : '4'}"/>
              
              <text x="${xCenter}" y="${yUntrained - 8}" fill="#0F172A" font-size="12" font-weight="900" font-family="monospace" text-anchor="middle">${d.total}</text>
              
              <line x1="${xCenter}" y1="${baseY}" x2="${xCenter}" y2="${baseY + 6}" stroke="#94A3B8" stroke-width="1.5"/>
              <text
                x="${xCenter}"
                y="${labelY}"
                fill="#334155"
                font-size="11.5"
                font-weight="700"
                font-family="'Plus Jakarta Sans', system-ui, sans-serif"
                text-anchor="end"
                transform="rotate(-45, ${xCenter}, ${labelY})"
              >${d.label}</text>
            </g>
          `;
        }).join('');
      }

      return `
        <svg viewBox="0 0 ${w} ${h}" class="w-full h-auto select-none overflow-visible">
          ${gridSvg}
          ${baselineSvg}
          ${contentSvg}
        </svg>
      `;
    },

    // Interactive Donut Chart for Audit Breakdown
    renderBreakdownDonut(filteredData) {
      const isElement = this.state.chartBreakdownMode === 'element';
      const items = isElement ? this.getElementAggregation(filteredData) : this.getSeverityAggregation(filteredData);
      
      if (items.length === 0) {
        return `<div class="text-center py-8 text-xs text-slate-400 font-medium">No records available in current scope</div>`;
      }

      // Elegant palette colors for slices
      const colors = ['#0D9488', '#0284C7', '#6366F1', '#EC4899', '#F59E0B', '#8B5CF6', '#10B981'];

      const total = items.reduce((acc, it) => acc + it.count, 0);
      const radius = 88;
      const circumference = 2 * Math.PI * radius;

      let currentOffset = 0;
      const slicesSvg = items.map((it, i) => {
        const color = colors[i % colors.length];
        const sliceLength = (it.count / (total || 1)) * circumference;
        const offset = currentOffset;
        currentOffset -= sliceLength;

        const isFiltered = (isElement && this.state.elementFilter === it.name) || (!isElement && this.state.natureFilter === it.name);

        return `
          <circle
            cx="120" cy="120" r="${radius}"
            fill="transparent"
            stroke="${color}"
            stroke-width="${isFiltered ? '32' : '26'}"
            stroke-dasharray="${sliceLength} ${circumference - sliceLength}"
            stroke-dashoffset="${offset}"
            style="cursor: pointer; pointer-events: stroke;"
            class="transition-all duration-300 hover:opacity-85 hover:stroke-[30px]"
            onclick="event.stopPropagation(); FPCL_PSM_SUITE.onDonutSliceClick('${isElement ? 'element' : 'nature'}', '${it.name.replace(/'/g, "\\'")}')"
            onmouseenter="FPCL_PSM_SUITE.showTooltip(event, { title: '${it.name.replace(/'/g, "\\'")}', badge: '${isElement ? 'PSM Element' : 'Severity'}', color: '${color}', subtitle: 'Audit Breakdown Slice', metrics: [{ label: 'Count', value: '${it.count}' }, { label: 'Share of Audit', value: '${it.percentage}%' }, { label: 'Total In Scope', value: '${total}' }], hint: 'Click to open pop-up window with ${it.count} findings for ${it.name.replace(/'/g, "\\'")}' })"
            onmousemove="FPCL_PSM_SUITE.moveTooltip(event)"
            onmouseleave="FPCL_PSM_SUITE.hideTooltip()"
          >
            <title>${it.name}: ${it.count} (${it.percentage}%) - Click to open relevant data records</title>
          </circle>
        `;
      }).join('');

      const legendHtml = items.map((it, i) => {
        const color = colors[i % colors.length];
        const isFiltered = (isElement && this.state.elementFilter === it.name) || (!isElement && this.state.natureFilter === it.name);
        return `
          <button
            onclick="event.stopPropagation(); FPCL_PSM_SUITE.onDonutSliceClick('${isElement ? 'element' : 'nature'}', '${it.name.replace(/'/g, "\\'")}')"
            onmouseenter="FPCL_PSM_SUITE.showTooltip(event, { title: '${it.name.replace(/'/g, "\\'")}', badge: '${isElement ? 'PSM Element' : 'Severity'}', color: '${color}', subtitle: 'Audit Filter Tag', metrics: [{ label: 'Count', value: '${it.count}' }, { label: 'Share', value: '${it.percentage}%' }], hint: 'Click to explore ${it.count} findings in pop-up window' })"
            onmousemove="FPCL_PSM_SUITE.moveTooltip(event)"
            onmouseleave="FPCL_PSM_SUITE.hideTooltip()"
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-left cursor-pointer ${
              isFiltered 
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm font-bold ring-2 ring-slate-400' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 shadow-2xs hover:border-slate-300'
            }"
            title="Click to pop up window for ${it.name}"
          >
            <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${color};"></span>
            <span class="text-xs font-bold truncate max-w-[130px] sm:max-w-[160px]">${it.name}</span>
            <span class="text-[11px] font-mono px-1.5 py-0.5 rounded font-semibold ${isFiltered ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'}">
              ${it.count} (${it.percentage}%)
            </span>
          </button>
        `;
      }).join('');

      return `
        <div class="flex flex-col items-center justify-center w-full gap-5">
          <!-- Enlarged Donut SVG -->
          <div
            class="relative w-48 h-48 min-[400px]:w-60 min-[400px]:h-60 sm:w-68 sm:h-68 shrink-0 cursor-pointer select-none"
            onclick="FPCL_PSM_SUITE.onDonutGeneralClick()"
            title="Click any part of donut to open data window"
          >
            <svg viewBox="0 0 240 240" class="w-full h-full transform -rotate-90">
              <!-- Background Track Ring (Clickable) -->
              <circle
                cx="120" cy="120" r="${radius}"
                fill="transparent"
                stroke="#F1F5F9"
                stroke-width="26"
                class="cursor-pointer transition-colors hover:stroke-slate-200"
                onclick="event.stopPropagation(); FPCL_PSM_SUITE.onDonutGeneralClick()"
              />
              ${slicesSvg}
            </svg>
            
            <!-- Interactive Center Hub -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none text-center">
              <div
                onclick="event.stopPropagation(); FPCL_PSM_SUITE.onDonutGeneralClick()"
                onmouseenter="FPCL_PSM_SUITE.showTooltip(event, { title: 'Complete Audit Scope', badge: 'All Findings', color: '#0F172A', subtitle: '${isElement ? 'All PSM Elements' : 'All Severity Levels'}', metrics: [{ label: 'Total In Scope', value: '${total}' }], hint: 'Click to open pop-up window for all ${total} audit records' })"
                onmousemove="FPCL_PSM_SUITE.moveTooltip(event)"
                onmouseleave="FPCL_PSM_SUITE.hideTooltip()"
                class="w-32 h-32 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center pointer-events-auto cursor-pointer bg-white hover:bg-slate-50 transition-all duration-200 group border border-slate-100 shadow-xs"
                title="Click to open pop-up window for all ${total} audit records"
              >
                <span class="text-3xl sm:text-4xl font-black font-mono text-slate-900 group-hover:text-teal-700 transition-colors leading-none">${total}</span>
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-teal-600 transition-colors mt-1.5">FINDINGS</span>
                <span class="text-[9px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 mt-2 opacity-90 group-hover:opacity-100 transition-opacity">Click for data</span>
              </div>
            </div>
          </div>

          <!-- Breakdown Legends Placed at Bottom -->
          <div class="w-full pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2">
            ${legendHtml}
          </div>
        </div>
      `;
    },

    // Interactive Colorful Donut Chart for Cadre Qualification Matrix
    renderCadreDonut(cadreItems, totalFiltered, vs) {
      if (!cadreItems || cadreItems.length === 0 || totalFiltered === 0) {
        return `
          <div class="text-center py-10 text-xs text-slate-400 font-medium">
            No personnel records match the current filters
          </div>
        `;
      }

      const total = totalFiltered || cadreItems.reduce((acc, c) => acc + c.count, 0) || 1;
      const radius = 96;
      const circumference = 2 * Math.PI * radius;

      let currentOffset = 0;
      const slicesSvg = cadreItems.map((c) => {
        if (c.count <= 0) return '';
        const pct = c.count / total;
        const sliceLength = pct * circumference;
        const offset = currentOffset;
        currentOffset -= sliceLength;

        const isFiltered = vs.cadreFilter === c.key;
        const strokeW = isFiltered ? '26' : '22';

        return `
          <circle
            cx="140" cy="140" r="${radius}"
            fill="transparent"
            stroke="${c.color}"
            stroke-width="${strokeW}"
            stroke-dasharray="${sliceLength} ${circumference - sliceLength}"
            stroke-dashoffset="${offset}"
            class="transition-all duration-300 hover:opacity-90 cursor-pointer"
            style="cursor: pointer; pointer-events: stroke;"
            onclick="FPCL_PSM_SUITE.setValidationFilter('cadreFilter', vs.cadreFilter === '${c.key}' ? 'all' : '${c.key}')"
            onmouseenter="FPCL_PSM_SUITE.showTooltip(event, { title: '${c.label.replace(/'/g, "\\'")}', badge: '${c.short}', color: '${c.color}', subtitle: 'Cadre Qualification', metrics: [{ label: 'Personnel', value: '${c.count}' }, { label: 'Cohort Share', value: '${Math.round(pct * 100)}%' }, { label: 'Total In Scope', value: '${total}' }], hint: 'Click to filter personnel by ${c.short}' })"
            onmousemove="FPCL_PSM_SUITE.moveTooltip(event)"
            onmouseleave="FPCL_PSM_SUITE.hideTooltip()"
          >
            <title>${c.label}: ${c.count} (${Math.round(pct * 100)}%)</title>
          </circle>
        `;
      }).join('');

      return `
        <div class="relative w-52 h-52 min-[400px]:w-64 min-[400px]:h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 shrink-0 cursor-pointer select-none mx-auto">
          <svg viewBox="0 0 280 280" class="w-full h-full transform -rotate-90">
            <!-- Background Track Ring -->
            <circle
              cx="140" cy="140" r="${radius}"
              fill="transparent"
              stroke="#F1F5F9"
              stroke-width="22"
              class="cursor-pointer hover:stroke-slate-200 transition-colors"
              onclick="FPCL_PSM_SUITE.setValidationFilter('cadreFilter', 'all')"
            />
            ${slicesSvg}
          </svg>

          <!-- Center Hub -->
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none text-center">
            <div
              onclick="FPCL_PSM_SUITE.setValidationFilter('cadreFilter', 'all')"
              class="w-32 h-32 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center pointer-events-auto cursor-pointer bg-white hover:bg-slate-50 transition-all border border-slate-100 shadow-xs group px-2"
              title="Click to reset Cadre filter"
              onmouseenter="FPCL_PSM_SUITE.showTooltip(event, { title: 'All Cadres', badge: 'Total Cohort', color: '#6366F1', subtitle: 'Cadre Scope', metrics: [{ label: 'Total Personnel', value: '${total}' }], hint: 'Click to reset cadre filter' })"
              onmousemove="FPCL_PSM_SUITE.moveTooltip(event)"
              onmouseleave="FPCL_PSM_SUITE.hideTooltip()"
            >
              <span class="text-3xl sm:text-4xl font-black font-mono text-slate-900 group-hover:text-indigo-600 transition-colors leading-none tracking-tight">${total}</span>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 group-hover:text-indigo-500 whitespace-nowrap">PERSONNEL</span>
              ${vs.cadreFilter && vs.cadreFilter !== 'all' ? `
                <span class="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 mt-1 whitespace-nowrap max-w-[110px] truncate">
                  ${vs.cadreFilter}
                </span>
              ` : `
                <span class="text-[9px] font-semibold text-slate-400 mt-0.5 whitespace-nowrap">3 Cadres</span>
              `}
            </div>
          </div>
        </div>
      `;
    },

    // Progress pill with color coding: >=80% green, 50-79% amber/yellow, <50% rose/orange
    renderProgressPill(rate) {
      let bgGrad = 'bg-teal-500';
      let textColor = 'text-teal-700';
      let border = 'border-teal-200';
      let badgeBg = 'bg-teal-50';

      if (rate >= 80) {
        bgGrad = 'bg-emerald-500';
        textColor = 'text-emerald-700';
        border = 'border-emerald-200';
        badgeBg = 'bg-emerald-50';
      } else if (rate >= 50) {
        bgGrad = 'bg-amber-500';
        textColor = 'text-amber-700';
        border = 'border-amber-200';
        badgeBg = 'bg-amber-50';
      } else {
        bgGrad = 'bg-rose-500';
        textColor = 'text-rose-700';
        border = 'border-rose-200';
        badgeBg = 'bg-rose-50';
      }

      return `
        <div class="flex items-center justify-center gap-2">
          <div class="w-14 bg-slate-200 rounded-full h-2 overflow-hidden">
            <div class="${bgGrad} h-2 rounded-full transition-all duration-300" style="width: ${rate}%;"></div>
          </div>
          <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${badgeBg} ${textColor} border ${border} min-w-[36px] text-right">
            ${rate}%
          </span>
        </div>
      `;
    },

    // Element badge styling
    getElementBadgeStyle(element) {
      const map = {
        'MC': 'bg-blue-50 text-blue-700 border-blue-200',
        'RA&PHA': 'bg-purple-50 text-purple-700 border-purple-200',
        'MOC-F': 'bg-teal-50 text-teal-700 border-teal-200',
        'PSI': 'bg-amber-50 text-amber-700 border-amber-200',
        'General': 'bg-slate-100 text-slate-700 border-slate-200'
      };
      return map[element] || 'bg-slate-50 text-slate-600 border-slate-200';
    },

    // Render active filter pills to allow quick removal
    renderActiveFilterPills() {
      const s = this.state;
      const pills = [];

      if (s.statusFilter !== 'all') {
        pills.push({ label: `Status: ${s.statusFilter}`, clear: () => this.setStatusFilter('all') });
      }
      if (s.deptFilter !== 'all') {
        pills.push({ label: `Dept: ${s.deptFilter}`, clear: () => this.setDeptFilter('all') });
      }
      if (s.unitFilter !== 'all') {
        pills.push({ label: `Unit: ${s.unitFilter}`, clear: () => this.setUnitFilter('all') });
      }
      if (s.elementFilter !== 'all') {
        pills.push({ label: `Element: ${s.elementFilter}`, clear: () => this.setElementFilter('all') });
      }
      if (s.natureFilter !== 'all') {
        pills.push({ label: `Severity: ${s.natureFilter}`, clear: () => this.setNatureFilter('all') });
      }
      if (s.auditFilter !== 'all') {
        pills.push({ label: `Audit: ${s.auditFilter}`, clear: () => this.setAuditFilter('all') });
      }
      if (s.searchQuery.trim()) {
        pills.push({ label: `Search: "${s.searchQuery}"`, clear: () => this.clearSearch() });
      }

      if (pills.length === 0) return '';

      return `
        <div class="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Filters:</span>
          ${pills.map((p, idx) => `
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs">
              <span>${p.label}</span>
              <button onclick="FPCL_PSM_SUITE.clearFilterIndex(${idx})" class="text-teal-600 hover:text-teal-900 cursor-pointer">
                <i data-lucide="x" class="w-3 h-3"></i>
              </button>
            </span>
          `).join('')}
          <button
            onclick="FPCL_PSM_SUITE.resetAllFilters()"
            class="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer ml-1"
          >
            Clear All
          </button>
        </div>
      `;
    },

    clearFilterIndex(idx) {
      const s = this.state;
      const pills = [];
      if (s.statusFilter !== 'all') pills.push(() => this.setStatusFilter('all'));
      if (s.deptFilter !== 'all') pills.push(() => this.setDeptFilter('all'));
      if (s.unitFilter !== 'all') pills.push(() => this.setUnitFilter('all'));
      if (s.elementFilter !== 'all') pills.push(() => this.setElementFilter('all'));
      if (s.natureFilter !== 'all') pills.push(() => this.setNatureFilter('all'));
      if (s.auditFilter !== 'all') pills.push(() => this.setAuditFilter('all'));
      if (s.searchQuery.trim()) pills.push(() => this.clearSearch());

      if (pills[idx]) {
        pills[idx]();
      }
    },

    // State Mutators & Filters
    setSearchQuery(val) {
      this.state.searchQuery = val || '';
      this.state.page = 1;
      const headerInput = document.getElementById('psm-header-search-input');
      const headerClearBtn = document.getElementById('psm-header-clear-search-btn');
      if (headerInput && headerInput !== document.activeElement) {
        headerInput.value = this.state.searchQuery;
      }
      if (headerClearBtn) {
        if (this.state.searchQuery) {
          headerClearBtn.classList.remove('hidden');
        } else {
          headerClearBtn.classList.add('hidden');
        }
      }
      const gridInput = document.getElementById('psm-search-input');
      if (gridInput && gridInput !== document.activeElement) {
        gridInput.value = this.state.searchQuery;
      }
      this.render();
    },

    clearSearch() {
      this.state.searchQuery = '';
      this.state.page = 1;
      const headerInput = document.getElementById('psm-header-search-input');
      const headerClearBtn = document.getElementById('psm-header-clear-search-btn');
      if (headerInput) {
        headerInput.value = '';
      }
      if (headerClearBtn) {
        headerClearBtn.classList.add('hidden');
      }
      const gridInput = document.getElementById('psm-search-input');
      if (gridInput) {
        gridInput.value = '';
      }
      this.render();
      if (headerInput) headerInput.focus();
    },

    setStatusFilter(status) {
      this.state.statusFilter = status;
      this.state.page = 1;
      this.render();
    },

    setDeptFilter(dept) {
      this.state.deptFilter = dept;
      this.state.page = 1;
      this.render();
    },

    setUnitFilter(unit) {
      this.state.unitFilter = unit;
      this.state.page = 1;
      this.render();
    },

    setElementFilter(el) {
      this.state.elementFilter = el;
      this.state.page = 1;
      this.render();
    },

    setNatureFilter(nat) {
      this.state.natureFilter = nat;
      this.state.page = 1;
      this.render();
    },

    setAuditFilter(audit) {
      this.state.auditFilter = audit;
      this.state.page = 1;
      this.render();
    },

    setBreakdownMode(mode) {
      this.state.chartBreakdownMode = mode;
      this.render();
    },

    setPage(page) {
      this.state.page = page;
      this.render();
    },

    setPageSize(size) {
      this.state.pageSize = size;
      this.state.page = 1;
      this.render();
    },

    sortDeptTable(col) {
      const cur = this.state.deptTableSort;
      if (cur.col === col) {
        cur.dir = cur.dir === 'asc' ? 'desc' : 'asc';
      } else {
        cur.col = col;
        cur.dir = 'desc';
      }
      this.render();
    },

    sortUnitTable(col) {
      const cur = this.state.unitTableSort;
      if (cur.col === col) {
        cur.dir = cur.dir === 'asc' ? 'desc' : 'asc';
      } else {
        cur.col = col;
        cur.dir = 'desc';
      }
      this.render();
    },

    resetAllFilters() {
      this.state.searchQuery = '';
      this.state.statusFilter = 'all';
      this.state.deptFilter = 'all';
      this.state.unitFilter = 'all';
      this.state.elementFilter = 'all';
      this.state.natureFilter = 'all';
      this.state.auditFilter = 'all';
      this.state.page = 1;
      this.render();
    },

    // Inspect individual finding modal
    inspectFinding(obsNo) {
      const raw = this.getRawData();
      const item = raw.find(d => d.observationNo === obsNo);
      if (!item) return;

      const modal = document.getElementById('psm-inspection-modal');
      const card = document.getElementById('psm-modal-card');
      if (!modal || !card) return;

      const isClosed = item.status === 'Close';

      card.innerHTML = `
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <div class="flex items-center gap-3">
            <span class="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <i data-lucide="shield-check" class="w-5 h-5"></i>
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-black text-slate-900 font-mono">${item.observationNo}</h3>
                <span class="px-2 py-0.5 rounded-full text-xs font-bold ${
                  isClosed ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-rose-50 text-rose-800 border border-rose-300'
                }">
                  ${item.status}
                </span>
              </div>
              <p class="text-xs text-slate-500">${item.auditNo}</p>
            </div>
          </div>
          <button onclick="FPCL_PSM_SUITE.closeModal()" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <!-- Metadata Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span class="text-slate-400 font-bold block text-[10px] uppercase">PSM Element</span>
              <span class="font-bold text-slate-800 font-mono">${item.psmElement}</span>
            </div>
            <div>
              <span class="text-slate-400 font-bold block text-[10px] uppercase">Nature / Severity</span>
              <span class="font-bold text-slate-800">${item.nature}</span>
            </div>
            <div>
              <span class="text-slate-400 font-bold block text-[10px] uppercase">Status</span>
              <span class="font-bold ${isClosed ? 'text-emerald-600' : 'text-rose-600'}">${item.status}</span>
            </div>
            <div>
              <span class="text-slate-400 font-bold block text-[10px] uppercase">Auditee Dept / Unit</span>
              <span class="font-medium text-slate-700">${item.auditeeDepartment || '—'} / ${item.auditeeUnit || '—'}</span>
            </div>
            <div>
              <span class="text-slate-400 font-bold block text-[10px] uppercase">Action Department</span>
              <span class="font-bold text-teal-800">${item.actionDepartment}</span>
            </div>
            <div>
              <span class="text-slate-400 font-bold block text-[10px] uppercase">Action Unit</span>
              <span class="font-bold text-teal-800">${item.actionUnit}</span>
            </div>
          </div>

          <!-- Finding Text -->
          <div class="space-y-1.5">
            <label class="font-black text-slate-700 uppercase tracking-wide text-[11px]">Observation / Findings:</label>
            <div class="p-3.5 bg-white rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-medium">
              ${item.finding}
            </div>
          </div>

          <!-- Action Dept Remarks -->
          <div class="space-y-1.5">
            <label class="font-black text-slate-700 uppercase tracking-wide text-[11px]">Action Department / Unit Remarks:</label>
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
              ${item.actionRemarks ? item.actionRemarks : '<span class="text-slate-400 italic">No department remarks recorded</span>'}
            </div>
          </div>

          <!-- HSEQ Remarks -->
          <div class="space-y-1.5">
            <label class="font-black text-teal-800 uppercase tracking-wide text-[11px]">HSEQ Verification Remarks:</label>
            <div class="p-3.5 bg-teal-50/60 rounded-xl border border-teal-200 text-teal-900 leading-relaxed font-medium">
              ${item.hseqRemarks ? item.hseqRemarks.replace(/\n/g, '<br/>') : '<span class="text-teal-600/70 italic">No HSEQ remarks recorded</span>'}
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
          <span class="text-slate-400 font-mono text-[11px]">Record #${item.sr}</span>
          <button onclick="FPCL_PSM_SUITE.closeModal()" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer">
            Close
          </button>
        </div>
      `;

      modal.classList.remove('hidden');
      modal.classList.add('flex');
      if (window.lucide) window.lucide.createIcons();
    },

    closeModal() {
      const modal = document.getElementById('psm-inspection-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    },

    openConfigModal() {
      const modal = document.getElementById('psm-sheet-config-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
    },

    closeConfigModal() {
      const modal = document.getElementById('psm-sheet-config-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    },

    // Save and re-sync from custom Google Sheet URL
    saveAndSyncSheetUrl() {
      const input = document.getElementById('psm-sheet-url-input');
      if (input && input.value.trim()) {
        window.FPCL_PSM_SHEET_URL = input.value.trim();
        try {
          localStorage.setItem('FPCL_PSM_SHEET_URL', window.FPCL_PSM_SHEET_URL);
        } catch (e) {}
      }
      this.closeConfigModal();
      this.syncLiveFeed({ silent: false });
    },

    // Live Feed Synchronization from Google Sheet (via server proxy with client fallback)
    async syncLiveFeed(options = {}) {
      const isSilent = options.silent || false;
      const isForce = options.force || false;
      const now = Date.now();

      // Return active in-flight sync promise to prevent duplicate concurrent network requests
      if (this._syncPromise) {
        return this._syncPromise;
      }

      // 10-second cache cooldown for non-forced requests
      if (!isForce && this._lastSyncTimestamp && (now - this._lastSyncTimestamp < 10000)) {
        return Promise.resolve(window.FPCL_PSM_DATA);
      }

      this.state.isSyncing = true;
      const headerSyncIcon = document.getElementById('psm-header-sync-icon');
      if (headerSyncIcon) headerSyncIcon.classList.add('animate-spin');
      if (!isSilent) this.render();

      this._syncPromise = (async () => {
        // Permanently lock to the authentic hardcoded Google Sheet URL so the connection cannot break
        const targetUrl = HARDCODED_PSM_SHEET_URL;

        let csvText = '';
        const now = Date.now();
        const nonce = Math.floor(Math.random() * 10000000);

        // Resilient Multi-tier Google Sheet Fetcher (bypasses CORS restrictions on Vercel)
        if (typeof window.fetchGoogleSheetData === 'function') {
          try {
            csvText = await window.fetchGoogleSheetData(targetUrl, { sheetTab: 'PSM', gid: '0' });
          } catch (e) {
            console.warn('window.fetchGoogleSheetData error:', e);
          }
        }

        // Direct JSONP fallback if window.fetchGoogleSheetData did not return text
        if (!csvText && typeof window.fetchGoogleSheetViaJSONP === 'function') {
          try {
            const jsonpRes = await window.fetchGoogleSheetViaJSONP(targetUrl, { sheetTab: 'PSM', gid: '0' });
            if (jsonpRes && jsonpRes.csvText) {
              csvText = jsonpRes.csvText;
            }
          } catch (e) {
            console.warn('JSONP fallback error:', e);
          }
        }

        // Fallback: Try server proxy (/api/sheets/fetch) with zero-cache
        if (!csvText) {
          try {
            const res = await fetch('/api/sheets/fetch', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              },
              cache: 'no-store',
              body: JSON.stringify({ url: targetUrl, sheetTab: 'PSM', gid: '0', t: now, _nocache: nonce })
            });
            if (res.ok) {
              const json = await res.json();
              if (json.success && json.csvText && json.csvText.length > 50) {
                csvText = json.csvText;
              }
            }
          } catch (proxyErr) {
            console.warn('Proxy fetch failed for PSM sheet:', proxyErr);
          }
        }

        // Fallback: Client-side direct fetch with cache-busting and explicit no-store
        if (!csvText) {
          try {
            const separator = targetUrl.includes('?') ? '&' : '?';
            const cacheBustedUrl = `${targetUrl}${separator}_t=${now}&_nocache=${nonce}&t=${now}`;
            const resp = await fetch(cacheBustedUrl, {
              method: 'GET',
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
            if (resp.ok) {
              csvText = await resp.text();
            }
          } catch (directErr) {
            console.warn('Direct fetch failed for PSM sheet:', directErr);
          }
        }

        try {
          if (csvText && typeof window.parsePSMCSV === 'function') {
            const parsed = window.parsePSMCSV(csvText);
            if (parsed.length > 0) {
              window.FPCL_PSM_DATA = parsed;
              try {
                localStorage.setItem('FPCL_PSM_DATA_CACHE', JSON.stringify(parsed));
              } catch (e) {}
              this.state.lastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              this._lastSyncTimestamp = Date.now();
              
              // Sync updated KPIs and counts to the Executive Overview dashboard
              this.syncPsmStatsToOverview();

              const closedCount = parsed.filter(p => p.status === 'Close').length;
              const openCount = parsed.length - closedCount;

              if (!isSilent && window.portalApp && typeof window.portalApp.showToast === 'function') {
                window.portalApp.showToast('Google Sheet Synced', `Successfully loaded ${parsed.length} audit observations (${closedCount} Closed, ${openCount} Open) live from Google Sheet.`, 'success');
              } else if (isSilent) {
                console.log(`Live PSM Google Sheet auto-sync completed: ${parsed.length} findings (${closedCount} Closed, ${openCount} Open)`);
              }
            }
          } else {
            // If fetch didn't return text and no data loaded yet, fallback to embedded raw CSV
            if ((!window.FPCL_PSM_DATA || window.FPCL_PSM_DATA.length === 0) && window.FPCL_PSM_RAW_CSV && typeof window.parsePSMCSV === 'function') {
              window.FPCL_PSM_DATA = window.parsePSMCSV(window.FPCL_PSM_RAW_CSV);
              this.syncPsmStatsToOverview();
            }
            if (!isSilent && window.portalApp && typeof window.portalApp.showToast === 'function') {
              window.portalApp.showToast('Sync Notice', 'Could not refresh from live sheet. Using current cached data.', 'warning');
            }
          }
        } catch (err) {
          console.warn('Google Sheet live parse error:', err);
        }
      })().finally(() => {
        this.state.isSyncing = false;
        this._syncPromise = null;
        const headerSyncIcon = document.getElementById('psm-header-sync-icon');
        if (headerSyncIcon) headerSyncIcon.classList.remove('animate-spin');
        const lastSyncEl = document.getElementById('detail-last-sync');
        if (lastSyncEl && this.state.lastSynced) {
          lastSyncEl.textContent = this.state.lastSynced;
        }
        if (!isSilent) this.render();
      });

      return this._syncPromise;
    },

    // Export current filtered findings to CSV file (delegates to validation export when in validation tab)
    exportFilteredCSV() {
      if (this.state.activeSubDashboard === 'validation') {
        this.exportValidationCSV();
        return;
      }

      const data = this.getFilteredData();
      if (!data || data.length === 0) return;

      const headers = [
        'Sr.',
        'ObservationNo.',
        'PSMElement',
        'AuditNO',
        'AuditeeDepartment',
        'AuditeeUnit',
        'Observation/Findings',
        'ActionDepartment',
        'ActionUnit',
        'NatureofFindings',
        'ActionDepartmenet/UnitRemarks',
        'Status',
        'HSEQRemarks'
      ];

      const rows = data.map((d, i) => [
        i + 1,
        `"${(d.observationNo || '').replace(/"/g, '""')}"`,
        `"${(d.psmElement || '').replace(/"/g, '""')}"`,
        `"${(d.auditNo || '').replace(/"/g, '""')}"`,
        `"${(d.auditeeDepartment || '').replace(/"/g, '""')}"`,
        `"${(d.auditeeUnit || '').replace(/"/g, '""')}"`,
        `"${(d.finding || '').replace(/"/g, '""')}"`,
        `"${(d.actionDepartment || '').replace(/"/g, '""')}"`,
        `"${(d.actionUnit || '').replace(/"/g, '""')}"`,
        `"${(d.nature || '').replace(/"/g, '""')}"`,
        `"${(d.actionRemarks || '').replace(/"/g, '""')}"`,
        `"${(d.status || '').replace(/"/g, '""')}"`,
        `"${(d.hseqRemarks || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `PSM_Internal_Audit_Findings_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    // =========================================================================
    // INTERACTIVE CHART TOOLTIPS ENGINE
    // =========================================================================
    getOrCreateTooltip() {
      let el = document.getElementById('fpcl-chart-tooltip');
      if (!el) {
        el = document.createElement('div');
        el.id = 'fpcl-chart-tooltip';
        el.className = 'fixed pointer-events-none z-[9999] hidden transition-opacity duration-100 shadow-2xl rounded-xl border p-3 text-xs select-none max-w-xs backdrop-blur-md';
        el.style.backgroundColor = 'rgba(15, 23, 42, 0.95)';
        el.style.color = '#ffffff';
        el.style.borderColor = '#334155';
        el.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)';
        document.body.appendChild(el);
      }
      return el;
    },

    showTooltip(e, opt) {
      const el = this.getOrCreateTooltip();
      const itemsHtml = (opt.metrics || []).map(m => `
        <div class="flex items-center justify-between gap-3 text-[11px] py-0.5">
          <span class="text-slate-300 font-medium">${m.label}:</span>
          <span class="font-mono font-bold ${m.color ? '' : 'text-slate-100'}" style="${m.color ? 'color: ' + m.color : ''}">${m.value}</span>
        </div>
      `).join('');

      el.innerHTML = `
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1.5">
            <div class="flex items-center gap-1.5 min-w-0">
              ${opt.color ? `<span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${opt.color}"></span>` : ''}
              <span class="font-black text-slate-100 text-xs truncate">${opt.title || ''}</span>
            </div>
            ${opt.badge ? `<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0 font-bold">${opt.badge}</span>` : ''}
          </div>
          ${opt.subtitle ? `<div class="text-[10px] font-bold text-teal-400 uppercase tracking-wider">${opt.subtitle}</div>` : ''}
          <div class="space-y-0.5 pt-0.5">
            ${itemsHtml}
          </div>
          <div class="pt-1.5 border-t border-slate-700/60 flex items-center gap-1 text-[10px] text-sky-400 font-semibold">
            <span>🖱️</span>
            <span>${opt.hint || 'Click to explore related data records'}</span>
          </div>
        </div>
      `;
      el.classList.remove('hidden');
      this.moveTooltip(e);
    },

    moveTooltip(e) {
      const el = document.getElementById('fpcl-chart-tooltip');
      if (!el || el.classList.contains('hidden')) return;
      const w = el.offsetWidth || 220;
      const h = el.offsetHeight || 120;
      let x = e.clientX + 16;
      let y = e.clientY + 16;
      if (x + w > window.innerWidth - 12) x = e.clientX - w - 16;
      if (y + h > window.innerHeight - 12) y = e.clientY - h - 16;
      el.style.left = Math.max(8, x) + 'px';
      el.style.top = Math.max(8, y) + 'px';
    },

    hideTooltip() {
      const el = document.getElementById('fpcl-chart-tooltip');
      if (el) el.classList.add('hidden');
    },

    // =========================================================================
    // DYNAMIC INTERACTIVE DATA RECORDS MODAL
    // =========================================================================
    openDataModal(config = {}) {
      this.hideTooltip();
      const raw = this.getRawData();
      let baseRecords = [];

      if (Array.isArray(config.records)) {
        baseRecords = config.records;
      } else {
        baseRecords = raw;
      }

      // Check filters: if passed in config, use them; otherwise inherit from main state or default to 'all'
      const filterDept = config.filterDept !== undefined ? config.filterDept : (this.state.deptFilter !== 'all' ? this.state.deptFilter : 'all');
      const filterUnit = config.filterUnit !== undefined ? config.filterUnit : (this.state.unitFilter !== 'all' ? this.state.unitFilter : 'all');
      const filterElement = config.filterElement !== undefined ? config.filterElement : (this.state.elementFilter !== 'all' ? this.state.elementFilter : 'all');
      const filterNature = config.filterNature !== undefined ? config.filterNature : (this.state.natureFilter !== 'all' ? this.state.natureFilter : 'all');
      
      let statusTab = 'all';
      if (config.filterStatus && config.filterStatus !== 'all') {
        statusTab = config.filterStatus;
      } else if (this.state.statusFilter !== 'all') {
        statusTab = this.state.statusFilter;
      }

      this.state.activeModal = {
        title: config.title || 'PSM Audit Data Records',
        subtitle: config.subtitle || 'Filtered Findings Explorer',
        badge: config.badge || 'Audit Findings',
        filterDept: filterDept || 'all',
        filterUnit: filterUnit || 'all',
        filterElement: filterElement || 'all',
        filterNature: filterNature || 'all',
        baseRecords: baseRecords,
        searchQuery: config.searchQuery || '',
        activeStatusTab: statusTab
      };

      this.renderDataModal();
    },

    closeDataModal() {
      this.state.activeModal = null;
      const modalEl = document.getElementById('psm-data-modal-container');
      if (modalEl) modalEl.innerHTML = '';
    },

    setModalDeptFilter(val) {
      if (!this.state.activeModal) return;
      this.state.activeModal.filterDept = val || 'all';
      this.renderDataModal(false);
    },

    setModalElementFilter(val) {
      if (!this.state.activeModal) return;
      this.state.activeModal.filterElement = val || 'all';
      this.renderDataModal(false);
    },

    setModalNatureFilter(val) {
      if (!this.state.activeModal) return;
      this.state.activeModal.filterNature = val || 'all';
      this.renderDataModal(false);
    },

    resetModalFilters() {
      if (!this.state.activeModal) return;
      this.state.activeModal.filterDept = 'all';
      this.state.activeModal.filterUnit = 'all';
      this.state.activeModal.filterElement = 'all';
      this.state.activeModal.filterNature = 'all';
      this.state.activeModal.activeStatusTab = 'all';
      this.state.activeModal.searchQuery = '';
      this.renderDataModal(false);
    },

    filterDataModalSearch(val) {
      if (!this.state.activeModal) return;
      this.state.activeModal.searchQuery = val || '';
      this.renderDataModal(false);
    },

    setDataModalStatusTab(tab) {
      if (!this.state.activeModal) return;
      this.state.activeModal.activeStatusTab = tab;
      this.renderDataModal(false);
    },

    applyModalFiltersToMain() {
      if (!this.state.activeModal) return;
      const m = this.state.activeModal;
      this.state.deptFilter = m.filterDept || 'all';
      this.state.unitFilter = m.filterUnit || 'all';
      this.state.elementFilter = m.filterElement || 'all';
      this.state.natureFilter = m.filterNature || 'all';
      this.state.statusFilter = m.activeStatusTab || 'all';
      if (m.searchQuery) this.state.searchQuery = m.searchQuery;
      this.closeDataModal();
      this.render();

      setTimeout(() => {
        const tableSec = document.getElementById('psm-records-table-container');
        if (tableSec) {
          tableSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    },

    exportModalCSV() {
      if (!this.state.activeModal) return;
      const m = this.state.activeModal;
      const data = this.getModalFilteredRecords();
      if (!data || data.length === 0) return;

      const headers = [
        'Sr.',
        'ObservationNo.',
        'PSMElement',
        'AuditNO',
        'AuditeeDepartment',
        'AuditeeUnit',
        'Observation/Findings',
        'ActionDepartment',
        'ActionUnit',
        'NatureofFindings',
        'ActionDepartmenet/UnitRemarks',
        'Status',
        'HSEQRemarks'
      ];

      const rows = data.map((d, i) => [
        i + 1,
        `"${(d.observationNo || '').replace(/"/g, '""')}"`,
        `"${(d.psmElement || '').replace(/"/g, '""')}"`,
        `"${(d.auditNo || '').replace(/"/g, '""')}"`,
        `"${(d.auditeeDepartment || '').replace(/"/g, '""')}"`,
        `"${(d.auditeeUnit || '').replace(/"/g, '""')}"`,
        `"${(d.finding || '').replace(/"/g, '""')}"`,
        `"${(d.actionDepartment || '').replace(/"/g, '""')}"`,
        `"${(d.actionUnit || '').replace(/"/g, '""')}"`,
        `"${(d.nature || '').replace(/"/g, '""')}"`,
        `"${(d.actionRemarks || '').replace(/"/g, '""')}"`,
        `"${(d.status || '').replace(/"/g, '""')}"`,
        `"${(d.hseqRemarks || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const safeTitle = (m.title || 'PSM_Records').replace(/[^a-zA-Z0-9]/g, '_');
      link.setAttribute('download', `${safeTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    getModalScopedRecords() {
      if (!this.state.activeModal) return [];
      const m = this.state.activeModal;
      const base = Array.isArray(m.baseRecords) ? m.baseRecords : this.getRawData();

      return base.filter(item => {
        if (m.filterDept && m.filterDept !== 'all' && item.actionDepartment !== m.filterDept) return false;
        if (m.filterUnit && m.filterUnit !== 'all' && item.actionUnit !== m.filterUnit) return false;
        if (m.filterElement && m.filterElement !== 'all' && item.psmElement !== m.filterElement) return false;
        if (m.filterNature && m.filterNature !== 'all' && item.nature !== m.filterNature) return false;
        return true;
      });
    },

    getModalFilteredRecords() {
      if (!this.state.activeModal) return [];
      const m = this.state.activeModal;
      let records = this.getModalScopedRecords();

      if (m.activeStatusTab && m.activeStatusTab !== 'all') {
        records = records.filter(r => (r.status || '').toLowerCase() === m.activeStatusTab.toLowerCase());
      }

      if (m.searchQuery && m.searchQuery.trim()) {
        const q = m.searchQuery.toLowerCase().trim();
        records = records.filter(r =>
          (r.observationNo && r.observationNo.toLowerCase().includes(q)) ||
          (r.finding && r.finding.toLowerCase().includes(q)) ||
          (r.actionDepartment && r.actionDepartment.toLowerCase().includes(q)) ||
          (r.actionUnit && r.actionUnit.toLowerCase().includes(q)) ||
          (r.psmElement && r.psmElement.toLowerCase().includes(q)) ||
          (r.nature && r.nature.toLowerCase().includes(q)) ||
          (r.auditNo && r.auditNo.toLowerCase().includes(q)) ||
          (r.actionRemarks && r.actionRemarks.toLowerCase().includes(q)) ||
          (r.hseqRemarks && r.hseqRemarks.toLowerCase().includes(q))
        );
      }

      return records;
    },

    renderDataModal(maintainScroll = false) {
      if (!this.state.activeModal) return;
      const m = this.state.activeModal;
      const container = document.getElementById('psm-data-modal-container');
      if (!container) return;

      const raw = this.getRawData();
      const allDepts = Array.from(new Set(raw.map(d => d.actionDepartment).filter(Boolean))).sort();
      const allElements = Array.from(new Set(raw.map(d => d.psmElement).filter(Boolean))).sort();
      const allNatures = Array.from(new Set(raw.map(d => d.nature).filter(Boolean))).sort();

      const scopedRecords = this.getModalScopedRecords();
      const records = this.getModalFilteredRecords();
      const totalCount = scopedRecords.length;
      const openCount = scopedRecords.filter(r => (r.status || '').toLowerCase() === 'open').length;
      const closedCount = totalCount - openCount;
      const closurePct = totalCount > 0 ? Math.round((closedCount / totalCount) * 100) : 0;

      const hasActiveFilters = (m.filterDept !== 'all' || m.filterElement !== 'all' || m.filterNature !== 'all' || m.activeStatusTab !== 'all' || !!m.searchQuery.trim());

      container.innerHTML = `
        <div class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5" onclick="if(event.target === this) FPCL_PSM_SUITE.closeDataModal()">
          <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <!-- Modal Header -->
            <div class="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm shrink-0">
                  <i data-lucide="database" class="w-5 h-5"></i>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">${m.title}</h3>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200 shrink-0 font-mono">${m.badge}</span>
                  </div>
                  <p class="text-xs text-slate-500 mt-0.5 truncate">${totalCount} Observations in Scope • ${closedCount} Closed • ${openCount} Open (${closurePct}% Compliance)</p>
                </div>
              </div>
              
              <div class="flex items-center gap-2 shrink-0">
                <button
                  onclick="FPCL_PSM_SUITE.exportModalCSV()"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-xs cursor-pointer transition-colors"
                  title="Export this data view to CSV"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span class="hidden sm:inline">Export CSV</span>
                </button>
                <button
                  onclick="FPCL_PSM_SUITE.closeDataModal()"
                  class="w-8 h-8 rounded-xl bg-white hover:bg-slate-200 text-slate-400 hover:text-slate-700 border border-slate-300 flex items-center justify-center cursor-pointer transition-colors"
                  title="Close (Esc)"
                >
                  <i data-lucide="x" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <!-- Metrics & Filter Bar -->
            <div class="px-5 py-3 border-b border-slate-200 bg-white flex flex-col gap-3">
              <!-- Top Row: Summary KPIs and Status Toggle -->
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <!-- Summary KPIs -->
                <div class="flex items-center gap-3 flex-wrap text-xs">
                  <span class="font-bold text-slate-600">Total in Scope: <strong class="text-slate-900 font-mono text-sm">${totalCount}</strong></span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    ${openCount} Open
                  </span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    ${closedCount} Closed
                  </span>
                  <span class="text-xs font-bold text-teal-700 font-mono bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    ${closurePct}% Resolved
                  </span>
                </div>

                <!-- Status Toggle Buttons -->
                <div class="flex items-center gap-2">
                  <div class="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                    <button
                      onclick="FPCL_PSM_SUITE.setDataModalStatusTab('all')"
                      class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${m.activeStatusTab === 'all' ? 'bg-teal-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
                    >
                      All (${totalCount})
                    </button>
                    <button
                      onclick="FPCL_PSM_SUITE.setDataModalStatusTab('Open')"
                      class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${m.activeStatusTab === 'Open' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
                    >
                      Open (${openCount})
                    </button>
                    <button
                      onclick="FPCL_PSM_SUITE.setDataModalStatusTab('Close')"
                      class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${m.activeStatusTab === 'Close' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
                    >
                      Closed (${closedCount})
                    </button>
                  </div>
                </div>
              </div>

              <!-- Bottom Row: Filter Dropdowns & Search Box -->
              <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                <!-- Department Dropdown -->
                <div class="flex items-center gap-1.5">
                  <span class="text-[11px] font-bold text-slate-500 uppercase">Dept:</span>
                  <select
                    onchange="FPCL_PSM_SUITE.setModalDeptFilter(this.value)"
                    class="py-1 px-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 text-xs focus:ring-1 focus:ring-teal-500 font-medium cursor-pointer"
                  >
                    <option value="all" ${m.filterDept === 'all' ? 'selected' : ''}>All Departments</option>
                    ${allDepts.map(d => `<option value="${d}" ${m.filterDept === d ? 'selected' : ''}>${d}</option>`).join('')}
                  </select>
                </div>

                <!-- PSM Element Dropdown -->
                <div class="flex items-center gap-1.5">
                  <span class="text-[11px] font-bold text-slate-500 uppercase">Element:</span>
                  <select
                    onchange="FPCL_PSM_SUITE.setModalElementFilter(this.value)"
                    class="py-1 px-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 text-xs focus:ring-1 focus:ring-teal-500 font-medium cursor-pointer"
                  >
                    <option value="all" ${m.filterElement === 'all' ? 'selected' : ''}>All Elements</option>
                    ${allElements.map(e => `<option value="${e}" ${m.filterElement === e ? 'selected' : ''}>${e}</option>`).join('')}
                  </select>
                </div>

                <!-- Severity Dropdown -->
                <div class="flex items-center gap-1.5">
                  <span class="text-[11px] font-bold text-slate-500 uppercase">Severity:</span>
                  <select
                    onchange="FPCL_PSM_SUITE.setModalNatureFilter(this.value)"
                    class="py-1 px-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 text-xs focus:ring-1 focus:ring-teal-500 font-medium cursor-pointer"
                  >
                    <option value="all" ${m.filterNature === 'all' ? 'selected' : ''}>All Severities</option>
                    ${allNatures.map(n => `<option value="${n}" ${m.filterNature === n ? 'selected' : ''}>${n}</option>`).join('')}
                  </select>
                </div>

                <!-- Search Input -->
                <div class="relative flex-1 min-w-[140px]">
                  <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <i data-lucide="search" class="w-3.5 h-3.5"></i>
                  </div>
                  <input
                    type="text"
                    value="${m.searchQuery}"
                    oninput="FPCL_PSM_SUITE.filterDataModalSearch(this.value)"
                    placeholder="Search slice..."
                    class="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  ${m.searchQuery ? `
                    <button onclick="FPCL_PSM_SUITE.filterDataModalSearch('')" class="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 cursor-pointer">
                      <i data-lucide="x" class="w-3 h-3"></i>
                    </button>
                  ` : ''}
                </div>

                <!-- Reset Filters Button -->
                ${hasActiveFilters ? `
                  <button
                    onclick="FPCL_PSM_SUITE.resetModalFilters()"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors font-bold text-xs cursor-pointer"
                    title="Reset all modal filters"
                  >
                    <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                    <span>Reset</span>
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Table of Findings -->
            <div class="overflow-y-auto flex-1 max-h-[55vh]">
              ${records.length === 0 ? `
                <div class="py-12 text-center text-slate-400 space-y-3">
                  <i data-lucide="inbox" class="w-8 h-8 mx-auto text-slate-300"></i>
                  <p class="text-xs font-semibold">No records match your filter criteria in this slice.</p>
                  <button
                    onclick="FPCL_PSM_SUITE.resetModalFilters()"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                    <span>Reset Filters to View All</span>
                  </button>
                </div>
              ` : `
                <table class="w-full text-left text-xs border-collapse">
                  <thead class="sticky top-0 bg-slate-100/95 backdrop-blur-xs z-10 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th class="py-2.5 px-3">Obs #</th>
                      <th class="py-2.5 px-3">Element</th>
                      <th class="py-2.5 px-3">Dept / Unit</th>
                      <th class="py-2.5 px-3">Finding & Observation Description</th>
                      <th class="py-2.5 px-3">Severity</th>
                      <th class="py-2.5 px-3 text-center">Status</th>
                      <th class="py-2.5 px-3 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 text-slate-800">
                    ${records.map(r => {
                      const isClosed = r.status === 'Close';
                      return `
                        <tr class="hover:bg-slate-50/80 transition-colors group">
                          <td class="py-2.5 px-3 font-mono font-bold text-teal-700 whitespace-nowrap">
                            <button
                              onclick="FPCL_PSM_SUITE.inspectFinding('${r.observationNo}')"
                              class="hover:underline text-left cursor-pointer flex items-center gap-1"
                              title="Click to inspect observation details"
                            >
                              <span>${r.observationNo}</span>
                            </button>
                          </td>
                          <td class="py-2.5 px-3 whitespace-nowrap">
                            <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold ${this.getElementBadgeStyle(r.psmElement)}">
                              ${r.psmElement || 'General'}
                            </span>
                          </td>
                          <td class="py-2.5 px-3 whitespace-nowrap">
                            <div class="font-bold text-slate-900">${r.actionDepartment}</div>
                            <div class="text-[10px] text-slate-400">${r.actionUnit}</div>
                          </td>
                          <td class="py-2.5 px-3 max-w-md">
                            <div class="line-clamp-2 text-slate-700 font-medium leading-relaxed" title="${(r.finding || '').replace(/"/g, '&quot;')}">
                              ${r.finding}
                            </div>
                          </td>
                          <td class="py-2.5 px-3 whitespace-nowrap">
                            <span class="text-[11px] font-semibold text-slate-700">${r.nature || '—'}</span>
                          </td>
                          <td class="py-2.5 px-3 text-center whitespace-nowrap">
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isClosed ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-rose-50 text-rose-800 border border-rose-300'
                            }">
                              <span class="w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                              ${r.status}
                            </span>
                          </td>
                          <td class="py-2.5 px-3 text-right whitespace-nowrap">
                            <button
                              onclick="FPCL_PSM_SUITE.inspectFinding('${r.observationNo}')"
                              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-teal-700 hover:text-teal-900 hover:bg-teal-50 border border-teal-200 transition-colors cursor-pointer"
                            >
                              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              `}
            </div>

            <!-- Modal Footer -->
            <div class="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span class="text-slate-500 font-medium">
                Showing <strong class="text-slate-800">${records.length}</strong> of <strong class="text-slate-800">${totalCount}</strong> findings in this interactive view
              </span>
              <div class="flex items-center gap-2">
                <button
                  onclick="FPCL_PSM_SUITE.applyModalFiltersToMain()"
                  class="px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <i data-lucide="filter" class="w-3.5 h-3.5"></i>
                  <span>Apply Filter to Main Page</span>
                </button>
                <button
                  onclick="FPCL_PSM_SUITE.closeDataModal()"
                  class="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  };

  // Auto-register on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    psmSuite.init();
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    psmSuite.init();
  }

  // Keyboard shortcut: Escape to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.FPCL_PSM_SUITE) {
      if (window.FPCL_PSM_SUITE.state && window.FPCL_PSM_SUITE.state.activeModal) {
        window.FPCL_PSM_SUITE.closeDataModal();
      }
    }
  });

})();
