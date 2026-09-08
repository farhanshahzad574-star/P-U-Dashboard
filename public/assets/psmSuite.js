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
      isSyncing: false,
      lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      selectedFinding: null
    },

    init() {
      window.FPCL_PSM_SUITE = this;

      // Always ensure hardcoded Google Sheet CSV URL is active
      if (!window.FPCL_PSM_SHEET_URL || window.FPCL_PSM_SHEET_URL.includes('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')) {
        window.FPCL_PSM_SHEET_URL = HARDCODED_PSM_SHEET_URL;
      }
      try {
        const storedUrl = localStorage.getItem('FPCL_PSM_SHEET_URL');
        if (storedUrl && !storedUrl.includes('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')) {
          window.FPCL_PSM_SHEET_URL = storedUrl;
        } else {
          window.FPCL_PSM_SHEET_URL = HARDCODED_PSM_SHEET_URL;
          localStorage.setItem('FPCL_PSM_SHEET_URL', HARDCODED_PSM_SHEET_URL);
        }
      } catch (e) {}

      // Fast-paint from localStorage cache if present
      try {
        const cached = localStorage.getItem('FPCL_PSM_DATA_CACHE');
        if (cached) {
          const parsedCached = JSON.parse(cached);
          if (Array.isArray(parsedCached) && parsedCached.length > 0) {
            window.FPCL_PSM_DATA = parsedCached;
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
      }, 700);

      // Periodic auto-sync every 60 seconds so sheet additions/deletions reflect live
      if (!this._autoSyncTimer) {
        this._autoSyncTimer = setInterval(() => {
          this.syncLiveFeed({ silent: true });
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
          psmEntry.kpis = { total, closed, inProgress: open, overdue: 0, compliance: rate };
          psmEntry.punchList = { open, closed, total, rate };
          psmEntry.statusComment = `${total} audit observations tracked across ${depts.size} Action Departments (${closed} Closed, ${open} Open, ${rate} Closure Rate).`;
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

    // Main render method mounted on #psm-specialized-container
    render() {
      const container = document.getElementById('psm-specialized-container');
      if (!container) return;

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

      container.innerHTML = `
        <div class="space-y-6 font-sans antialiased text-slate-800">
          
          <!-- ========================================================================= -->
          <!-- 1. TOP EXECUTIVE BI HEADER BAR                                           -->
          <!-- ========================================================================= -->
          <div class="bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-teal-400/40 relative overflow-hidden">
            <!-- Subtle backdrop gradient glow -->
            <div class="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-300/20 rounded-full blur-3xl pointer-events-none"></div>

            <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div class="flex items-start sm:items-center gap-3.5">
                <div class="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center shadow-lg backdrop-blur-xs shrink-0 border border-white/25">
                  <i data-lucide="shield-check" class="w-6 h-6"></i>
                </div>
                <div>
                  <div class="flex flex-wrap items-center gap-2.5">
                    <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                      PSM INTERNAL AUDIT FINDINGS
                    </h2>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                      EXECUTIVE BI
                    </span>
                  </div>
                  <p class="text-xs sm:text-sm text-teal-100 font-medium mt-0.5">
                    Compliance, Action Department Tracking & Resolution Analytics • <span class="text-white font-bold">Phase 1 2026 Audit Findings Data</span>
                  </p>
                </div>
              </div>

              <!-- Top Right Controls -->
              <div class="flex items-center flex-wrap gap-2.5">
                <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/25">
                  <span class="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                  <span>LIVE SHEETS CONNECTED</span>
                </div>

                <button
                  onclick="FPCL_PSM_SUITE.syncLiveFeed()"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-all shadow-xs cursor-pointer"
                  title="Force re-sync from Google Sheets"
                >
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5 ${s.isSyncing ? 'animate-spin' : ''}"></i>
                  <span>Sync Feed</span>
                </button>

                <button
                  onclick="FPCL_PSM_SUITE.openConfigModal()"
                  class="inline-flex items-center gap-1.5 p-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-all shadow-xs cursor-pointer"
                  title="Configure Google Sheet Link"
                >
                  <i data-lucide="settings" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- ========================================================================= -->
          <!-- 2. AUDIT STATUS BAR & QUICK ACTION CONTROLS                               -->
          <!-- ========================================================================= -->
          <div class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                <i data-lucide="file-check-2" class="w-5 h-5"></i>
              </div>
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-black text-sm sm:text-base px-3 py-1 rounded-lg bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 text-white shadow-xs tracking-wide">PSM INTERNAL AUDIT FINDINGS</span>
                  <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">Phase 1 2026 Audit</span>
                </div>
                <p class="text-xs text-slate-500 mt-1">Live Compliance, Action Department Tracking & Conditional % Closure Progress</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                onclick="FPCL_PSM_SUITE.resetAllFilters()"
                class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-2xs cursor-pointer"
                title="Reset all filter selections"
              >
                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                <span>Reset All Filters</span>
              </button>

              <button
                onclick="FPCL_PSM_SUITE.exportFilteredCSV()"
                class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm cursor-pointer"
                title="Export currently filtered records to CSV"
              >
                <i data-lucide="download" class="w-3.5 h-3.5"></i>
                <span>Export CSV</span>
              </button>

              <button
                onclick="FPCL_PSM_SUITE.syncLiveFeed()"
                class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-sm cursor-pointer"
              >
                <i data-lucide="refresh-cw" class="w-3.5 h-3.5 ${s.isSyncing ? 'animate-spin' : ''}"></i>
                <span>Sync Feed</span>
              </button>
            </div>
          </div>

          <!-- ========================================================================= -->
          <!-- 3. TOP 4 EXECUTIVE KPI SUMMARY CARDS (DYNAMICALLY COMPUTED)               -->
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
                <span class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-900 kpi-metric-val">${totalFiltered}</span>
                ${totalFiltered !== totalRaw ? `<span class="text-sm font-mono text-slate-400">/ ${totalRaw}</span>` : ''}
              </div>
              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                <span class="text-teal-600 font-semibold group-hover:underline flex items-center gap-1">
                  <span>Explore records</span>
                  <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
                </span>
                <span class="px-2.5 py-0.5 rounded text-xs font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                  100% Ingested
                </span>
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
                <span class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-rose-600 kpi-metric-val">${openCount}</span>
                <span class="text-sm font-mono font-bold text-rose-700">(${openPercentage}%)</span>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                <span class="text-rose-600 font-semibold group-hover:underline flex items-center gap-1">
                  <span>Explore open</span>
                  <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
                </span>
                <span class="px-2.5 py-0.5 rounded text-xs font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200">
                  ${openPercentage}% Active
                </span>
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
                <span class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-emerald-600 kpi-metric-val">${closedCount}</span>
                <span class="text-sm font-mono font-bold text-emerald-700">(${closurePercentage}%)</span>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                <span class="text-emerald-600 font-semibold group-hover:underline flex items-center gap-1">
                  <span>Explore closed</span>
                  <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
                </span>
                <span class="px-2.5 py-0.5 rounded text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ${closurePercentage}% Completed
                </span>
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
                <span class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-teal-600 kpi-metric-val">${closurePercentage}%</span>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-xs sm:text-sm">
                <div class="flex items-center justify-between text-slate-600 text-xs font-semibold">
                  <span>Audit Resolution</span>
                  <span class="font-mono font-bold text-slate-800">${closedCount} / ${totalFiltered}</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                  <div class="bg-teal-500 h-2.5 rounded-full transition-all duration-500" style="width: ${closurePercentage}%;"></div>
                </div>
              </div>
            </div>

          </div>

          <!-- ========================================================================= -->
          <!-- 4. INTERACTIVE DRILL-DOWN & FILTERS BAR                                   -->
          <!-- ========================================================================= -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div class="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                <i data-lucide="sliders-horizontal" class="w-4 h-4 text-teal-600"></i>
                <span>INTERACTIVE DRILL-DOWN & FILTERS</span>
                <span class="text-slate-400 normal-case font-medium text-[11px]">(Click any value, bar or chart to filter)</span>
              </div>
              <button
                onclick="FPCL_PSM_SUITE.resetAllFilters()"
                class="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-teal-600 cursor-pointer self-start sm:self-auto"
              >
                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                <span>Reset All</span>
              </button>
            </div>

            <!-- Filter Controls Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
              
              <!-- 1. Search Findings -->
              <div class="xl:col-span-1">
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <i data-lucide="search" class="w-3 h-3"></i> SEARCH FINDINGS
                </label>
                <div class="relative">
                  <input
                    type="text"
                    value="${s.searchQuery}"
                    oninput="FPCL_PSM_SUITE.setSearchQuery(this.value)"
                    placeholder="Keywords, obs..."
                    class="w-full pl-3 pr-7 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                  ${s.searchQuery ? `
                    <button onclick="FPCL_PSM_SUITE.clearSearch()" class="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
                      <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    </button>
                  ` : ''}
                </div>
              </div>

              <!-- 2. Status Filter -->
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">STATUS</label>
                <select
                  onchange="FPCL_PSM_SUITE.setStatusFilter(this.value)"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="all" ${s.statusFilter === 'all' ? 'selected' : ''}>All Statuses (${totalRaw})</option>
                  <option value="Open" ${s.statusFilter === 'Open' ? 'selected' : ''}>Open</option>
                  <option value="Close" ${s.statusFilter === 'Close' ? 'selected' : ''}>Close</option>
                </select>
              </div>

              <!-- 3. Action Department -->
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">ACTION DEPT</label>
                <select
                  onchange="FPCL_PSM_SUITE.setDeptFilter(this.value)"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="all" ${s.deptFilter === 'all' ? 'selected' : ''}>All Departments</option>
                  ${allDepts.map(d => `<option value="${d}" ${s.deptFilter === d ? 'selected' : ''}>${d}</option>`).join('')}
                </select>
              </div>

              <!-- 4. Action Unit -->
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">ACTION UNIT</label>
                <select
                  onchange="FPCL_PSM_SUITE.setUnitFilter(this.value)"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="all" ${s.unitFilter === 'all' ? 'selected' : ''}>All Action Units</option>
                  ${allUnits.map(u => `<option value="${u}" ${s.unitFilter === u ? 'selected' : ''}>${u}</option>`).join('')}
                </select>
              </div>

              <!-- 5. PSM Element -->
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">PSM ELEMENT</label>
                <select
                  onchange="FPCL_PSM_SUITE.setElementFilter(this.value)"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="all" ${s.elementFilter === 'all' ? 'selected' : ''}>All PSM Elements</option>
                  ${allElements.map(e => `<option value="${e}" ${s.elementFilter === e ? 'selected' : ''}>${e}</option>`).join('')}
                </select>
              </div>

              <!-- 6. Nature / Severity -->
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">NATURE / SEVERITY</label>
                <select
                  onchange="FPCL_PSM_SUITE.setNatureFilter(this.value)"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="all" ${s.natureFilter === 'all' ? 'selected' : ''}>All Severities</option>
                  ${allNatures.map(n => `<option value="${n}" ${s.natureFilter === n ? 'selected' : ''}>${n}</option>`).join('')}
                </select>
              </div>

              <!-- 7. Audit No -->
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">AUDIT NO</label>
                <select
                  onchange="FPCL_PSM_SUITE.setAuditFilter(this.value)"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
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
            
            <!-- Left Chart (7 cols): Open vs Closed by Action Department -->
            <div class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 class="text-xs sm:text-sm font-black tracking-wide text-slate-900 flex items-center gap-2 uppercase">
                    <i data-lucide="bar-chart-3" class="w-4 h-4 text-teal-600"></i>
                    <span>OPEN VS. CLOSED FINDINGS BY ACTION DEPARTMENT</span>
                  </h3>
                  <p class="text-[11px] text-slate-500">Click any bar to filter & view items</p>
                </div>
                <!-- Legend -->
                <div class="flex items-center gap-3 text-xs font-bold font-mono">
                  <span class="inline-flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                    <span class="text-slate-600">Open Findings</span>
                  </span>
                  <span class="inline-flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-sm bg-teal-500"></span>
                    <span class="text-slate-600">Closed Findings</span>
                  </span>
                </div>
              </div>

              <!-- Horizontal SVG Bar Chart -->
              <div id="psm-dept-bar-chart" class="w-full overflow-x-auto">
                ${this.renderDepartmentBarChart(deptList)}
              </div>
            </div>

            <!-- Right Chart (5 cols): Audit Breakdown Donut -->
            <div class="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 class="text-xs sm:text-sm font-black tracking-wide text-slate-900 flex items-center gap-2 uppercase">
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

          <!-- ========================================================================= -->
          <!-- 6. TABLES ROW: TABLE 1 (DEPARTMENT) & TABLE 2 (ACTION UNIT)              -->
          <!-- ========================================================================= -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            <!-- Table 1: Findings Status by Action Department -->
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-teal-500"></div>
                  <h4 class="text-xs sm:text-sm font-black text-slate-900 uppercase">TABLE 1: FINDINGS STATUS BY ACTION DEPARTMENT</h4>
                </div>
                <span class="text-[11px] text-teal-600 font-semibold">🖱️ Click row or count to open</span>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px] bg-slate-50">
                      <th class="py-2.5 px-3 cursor-pointer hover:text-teal-600" onclick="FPCL_PSM_SUITE.sortDeptTable('name')">
                        DEPARTMENT ${s.deptTableSort.col === 'name' ? (s.deptTableSort.dir === 'asc' ? '↑' : '↓') : '↕'}
                      </th>
                      <th class="py-2.5 px-3 text-center cursor-pointer hover:text-teal-600" onclick="FPCL_PSM_SUITE.sortDeptTable('total')">
                        TOTAL ${s.deptTableSort.col === 'total' ? (s.deptTableSort.dir === 'asc' ? '↑' : '↓') : '↕'}
                      </th>
                      <th class="py-2.5 px-3 text-center cursor-pointer hover:text-rose-600" onclick="FPCL_PSM_SUITE.sortDeptTable('open')">
                        OPEN ${s.deptTableSort.col === 'open' ? (s.deptTableSort.dir === 'asc' ? '↑' : '↓') : '↕'}
                      </th>
                      <th class="py-2.5 px-3 text-center cursor-pointer hover:text-emerald-600" onclick="FPCL_PSM_SUITE.sortDeptTable('close')">
                        CLOSE ${s.deptTableSort.col === 'close' ? (s.deptTableSort.dir === 'asc' ? '↑' : '↓') : '↕'}
                      </th>
                      <th class="py-2.5 px-3 text-center cursor-pointer hover:text-teal-600 min-w-[120px]" onclick="FPCL_PSM_SUITE.sortDeptTable('closureRate')">
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
                          class="hover:bg-teal-50/40 transition-colors cursor-pointer group ${isSelected ? 'bg-teal-50/70 font-bold' : ''}"
                        >
                          <td class="py-2.5 px-3 font-semibold text-slate-900 group-hover:text-teal-700">
                            <span class="group-hover:underline">${d.name}</span>
                          </td>
                          <td class="py-2.5 px-3 text-center font-mono font-bold text-slate-900">${d.total}</td>
                          <td
                            class="py-2.5 px-3 text-center font-mono font-bold ${d.open > 0 ? 'text-rose-600 hover:bg-rose-100 rounded-md transition-colors' : 'text-slate-400'}"
                            onclick="event.stopPropagation(); FPCL_PSM_SUITE.openDataModal({ title: '${d.name.replace(/'/g, "\\'")} — Open Findings', badge: 'Active Open', subtitle: '${d.open} Open Findings', filterDept: '${d.name.replace(/'/g, "\\'")}', filterStatus: 'Open' })"
                            title="Click to view Open findings for ${d.name}"
                          >
                            ${d.open}
                          </td>
                          <td
                            class="py-2.5 px-3 text-center font-mono font-bold ${d.close > 0 ? 'text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors' : 'text-slate-400'}"
                            onclick="event.stopPropagation(); FPCL_PSM_SUITE.openDataModal({ title: '${d.name.replace(/'/g, "\\'")} — Closed Findings', badge: 'Resolved', subtitle: '${d.close} Closed Findings', filterDept: '${d.name.replace(/'/g, "\\'")}', filterStatus: 'Close' })"
                            title="Click to view Closed findings for ${d.name}"
                          >
                            ${d.close}
                          </td>
                          <td class="py-2.5 px-3 text-center">
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
                      <td class="py-3 px-3 uppercase tracking-wider">TOTAL / SUMMARY</td>
                      <td class="py-3 px-3 text-center font-mono">${sumDeptTotal}</td>
                      <td class="py-3 px-3 text-center font-mono text-rose-600">${sumDeptOpen}</td>
                      <td class="py-3 px-3 text-center font-mono text-emerald-600">${sumDeptClose}</td>
                      <td class="py-3 px-3 text-center">
                        ${this.renderProgressPill(sumDeptClosure)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Table 2: Findings Status by Action Unit -->
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-indigo-500"></div>
                  <h4 class="text-xs sm:text-sm font-black text-slate-900 uppercase">TABLE 2: FINDINGS STATUS BY ACTION UNIT</h4>
                </div>
                <span class="text-[11px] text-indigo-600 font-semibold">🖱️ Click row or count to open</span>
              </div>

              <div class="overflow-x-auto max-h-[500px]">
                <table class="w-full text-left text-xs border-collapse">
                  <thead class="sticky top-0 bg-slate-50 z-10">
                    <tr class="border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <th class="py-2.5 px-3 cursor-pointer hover:text-indigo-600" onclick="FPCL_PSM_SUITE.sortUnitTable('name')">
                        ACTION UNIT ${s.unitTableSort.col === 'name' ? (s.unitTableSort.dir === 'asc' ? '↑' : '↓') : '↕'}
                      </th>
                      <th class="py-2.5 px-3 text-center cursor-pointer hover:text-indigo-600" onclick="FPCL_PSM_SUITE.sortUnitTable('total')">
                        TOTAL ${s.unitTableSort.col === 'total' ? (s.unitTableSort.dir === 'asc' ? '↑' : '↓') : '↕'}
                      </th>
                      <th class="py-2.5 px-3 text-center cursor-pointer hover:text-rose-600" onclick="FPCL_PSM_SUITE.sortUnitTable('open')">
                        OPEN ${s.unitTableSort.col === 'open' ? (s.unitTableSort.dir === 'asc' ? '↑' : '↓') : '↕'}
                      </th>
                      <th class="py-2.5 px-3 text-center cursor-pointer hover:text-emerald-600" onclick="FPCL_PSM_SUITE.sortUnitTable('close')">
                        CLOSE ${s.unitTableSort.col === 'close' ? (s.unitTableSort.dir === 'asc' ? '↑' : '↓') : '↕'}
                      </th>
                      <th class="py-2.5 px-3 text-center cursor-pointer hover:text-indigo-600 min-w-[120px]" onclick="FPCL_PSM_SUITE.sortUnitTable('closureRate')">
                        % CLOSURE ${s.unitTableSort.col === 'closureRate' ? (s.unitTableSort.dir === 'asc' ? '↑' : '↓') : '↕'}
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 text-slate-800">
                    ${unitList.map(u => {
                      const isSelected = s.unitFilter === u.name;
                      return `
                        <tr
                          onclick="FPCL_PSM_SUITE.openDataModal({ title: 'Action Unit: ${u.name.replace(/'/g, "\\'")}', badge: 'Action Unit', subtitle: '${u.total} Findings (${u.open} Open, ${u.close} Closed)', filterUnit: '${u.name.replace(/'/g, "\\'")}' })"
                          onmouseenter="FPCL_PSM_SUITE.showTooltip(event, { title: '${u.name.replace(/'/g, "\\'")}', badge: 'Table 2', color: '#6366F1', subtitle: 'Action Unit Row', metrics: [{ label: 'Total', value: '${u.total}' }, { label: 'Open', value: '${u.open}', color: '#F43F5E' }, { label: 'Closed', value: '${u.close}', color: '#10B981' }, { label: 'Closure Rate', value: '${u.closureRate}%' }], hint: 'Click to open findings for ${u.name.replace(/'/g, "\\'")}' })"
                          onmousemove="FPCL_PSM_SUITE.moveTooltip(event)"
                          onmouseleave="FPCL_PSM_SUITE.hideTooltip()"
                          class="hover:bg-indigo-50/40 transition-colors cursor-pointer group ${isSelected ? 'bg-indigo-50/70 font-bold' : ''}"
                        >
                          <td class="py-2.5 px-3 font-semibold text-slate-900 group-hover:text-indigo-700">
                            <span class="group-hover:underline">${u.name}</span>
                          </td>
                          <td class="py-2.5 px-3 text-center font-mono font-bold text-slate-900">${u.total}</td>
                          <td
                            class="py-2.5 px-3 text-center font-mono font-bold ${u.open > 0 ? 'text-rose-600 hover:bg-rose-100 rounded-md transition-colors' : 'text-slate-400'}"
                            onclick="event.stopPropagation(); FPCL_PSM_SUITE.openDataModal({ title: '${u.name.replace(/'/g, "\\'")} — Open Findings', badge: 'Active Open', subtitle: '${u.open} Open Findings', filterUnit: '${u.name.replace(/'/g, "\\'")}', filterStatus: 'Open' })"
                            title="Click to view Open findings for ${u.name}"
                          >
                            ${u.open}
                          </td>
                          <td
                            class="py-2.5 px-3 text-center font-mono font-bold ${u.close > 0 ? 'text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors' : 'text-slate-400'}"
                            onclick="event.stopPropagation(); FPCL_PSM_SUITE.openDataModal({ title: '${u.name.replace(/'/g, "\\'")} — Closed Findings', badge: 'Resolved', subtitle: '${u.close} Closed Findings', filterUnit: '${u.name.replace(/'/g, "\\'")}', filterStatus: 'Close' })"
                            title="Click to view Closed findings for ${u.name}"
                          >
                            ${u.close}
                          </td>
                          <td class="py-2.5 px-3 text-center">
                            ${this.renderProgressPill(u.closureRate)}
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                  <!-- Total Summary Row -->
                  <tfoot class="sticky bottom-0 bg-slate-100">
                    <tr
                      class="font-black text-slate-900 border-t-2 border-slate-300 cursor-pointer hover:bg-slate-200 transition-colors"
                      onclick="FPCL_PSM_SUITE.openDataModal({ title: 'All Action Units Summary', badge: 'Summary', subtitle: '${sumUnitTotal} Total Findings (${sumUnitOpen} Open, ${sumUnitClose} Closed)' })"
                      onmouseenter="FPCL_PSM_SUITE.showTooltip(event, { title: 'All Units Total', badge: 'Summary Row', color: '#0F172A', subtitle: 'Overall Unit Scope', metrics: [{ label: 'Total', value: '${sumUnitTotal}' }, { label: 'Open', value: '${sumUnitOpen}', color: '#F43F5E' }, { label: 'Closed', value: '${sumUnitClose}', color: '#10B981' }, { label: 'Rate', value: '${sumUnitClosure}%' }], hint: 'Click to open all action unit records' })"
                      onmousemove="FPCL_PSM_SUITE.moveTooltip(event)"
                      onmouseleave="FPCL_PSM_SUITE.hideTooltip()"
                    >
                      <td class="py-3 px-3 uppercase tracking-wider">TOTAL / SUMMARY</td>
                      <td class="py-3 px-3 text-center font-mono">${sumUnitTotal}</td>
                      <td class="py-3 px-3 text-center font-mono text-rose-600">${sumUnitOpen}</td>
                      <td class="py-3 px-3 text-center font-mono text-emerald-600">${sumUnitClose}</td>
                      <td class="py-3 px-3 text-center">
                        ${this.renderProgressPill(sumUnitClosure)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

          </div>

          <!-- ========================================================================= -->
          <!-- 7. DETAILED PSM AUDIT OBSERVATION RECORDS TABLE                           -->
          <!-- ========================================================================= -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div class="flex items-center gap-2.5">
                <div class="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                  <i data-lucide="table" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                    PSM AUDIT OBSERVATION RECORDS
                  </h3>
                  <p class="text-xs text-slate-500">
                    Showing <strong class="text-slate-800">${pageItems.length}</strong> of <strong class="text-slate-800">${filtered.length}</strong> filtered findings (Click any row to inspect complete details)
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 self-start sm:self-auto">
                <label for="psm-page-size" class="text-xs font-bold text-slate-500">Rows:</label>
                <select
                  id="psm-page-size"
                  onchange="FPCL_PSM_SUITE.setPageSize(this.value)"
                  class="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="10" ${s.pageSize === '10' ? 'selected' : ''}>10</option>
                  <option value="15" ${s.pageSize === '15' ? 'selected' : ''}>15</option>
                  <option value="25" ${s.pageSize === '25' ? 'selected' : ''}>25</option>
                  <option value="50" ${s.pageSize === '50' ? 'selected' : ''}>50</option>
                  <option value="all" ${s.pageSize === 'all' ? 'selected' : ''}>All (${filtered.length})</option>
                </select>
              </div>
            </div>

            <!-- Findings Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th class="py-3 px-3">OBS #</th>
                    <th class="py-3 px-3">PSM ELEMENT</th>
                    <th class="py-3 px-3">ACTION DEPT</th>
                    <th class="py-3 px-3">ACTION UNIT</th>
                    <th class="py-3 px-4 min-w-[280px]">OBSERVATION / FINDINGS</th>
                    <th class="py-3 px-3 text-center">STATUS</th>
                    <th class="py-3 px-3">HSEQ REMARKS</th>
                    <th class="py-3 px-3 text-center">INSPECT</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-800">
                  ${pageItems.length === 0 ? `
                    <tr>
                      <td colspan="8" class="text-center py-10 text-slate-400">
                        <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
                        No audit findings match your selected filter criteria.
                      </td>
                    </tr>
                  ` : pageItems.map(item => {
                    const isClosed = item.status === 'Close';
                    return `
                      <tr 
                        onclick="FPCL_PSM_SUITE.inspectFinding('${item.observationNo}')"
                        class="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <!-- OBS # -->
                        <td class="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          <div>${item.observationNo}</div>
                          <div class="text-[10px] text-slate-400 font-sans font-normal">${item.auditNo}</div>
                        </td>

                        <!-- PSM Element -->
                        <td class="py-3 px-3 whitespace-nowrap">
                          <span class="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold font-mono border ${this.getElementBadgeStyle(item.psmElement)}">
                            ${item.psmElement}
                          </span>
                        </td>

                        <!-- Action Dept -->
                        <td class="py-3 px-3 font-medium text-slate-900 whitespace-nowrap">
                          ${item.actionDepartment}
                        </td>

                        <!-- Action Unit -->
                        <td class="py-3 px-3 text-slate-600 whitespace-nowrap font-mono">
                          ${item.actionUnit}
                        </td>

                        <!-- Observation / Findings -->
                        <td class="py-3 px-4 text-slate-700 leading-relaxed font-medium">
                          <div class="line-clamp-2" title="${item.finding.replace(/"/g, '&quot;')}">
                            ${item.finding}
                          </div>
                        </td>

                        <!-- Status Badge -->
                        <td class="py-3 px-3 text-center whitespace-nowrap">
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isClosed 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }">
                            <i data-lucide="${isClosed ? 'check' : 'alert-circle'}" class="w-3 h-3"></i>
                            <span>${item.status}</span>
                          </span>
                        </td>

                        <!-- HSEQ Remarks -->
                        <td class="py-3 px-3 text-slate-500 text-[11px] max-w-[200px] truncate" title="${(item.hseqRemarks || '').replace(/"/g, '&quot;')}">
                          ${item.hseqRemarks || '—'}
                        </td>

                        <!-- Inspect Button -->
                        <td class="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            onclick="event.stopPropagation(); FPCL_PSM_SUITE.inspectFinding('${item.observationNo}')"
                            class="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition-colors"
                            title="Inspect complete details"
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

            <!-- Pagination Bar -->
            ${totalPages > 1 ? `
              <div class="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span class="text-slate-500 font-medium">
                  Page <strong class="text-slate-800">${currentPage}</strong> of <strong class="text-slate-800">${totalPages}</strong>
                </span>
                <div class="flex items-center gap-1">
                  <button
                    onclick="FPCL_PSM_SUITE.setPage(${currentPage - 1})"
                    ${currentPage <= 1 ? 'disabled class="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed"' : 'class="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"'}
                  >
                    Previous
                  </button>
                  ${Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      p = currentPage - 2 + i;
                      if (p > totalPages) p = totalPages - (4 - i);
                    }
                    const isActive = p === currentPage;
                    return `
                      <button
                        onclick="FPCL_PSM_SUITE.setPage(${p})"
                        class="px-3 py-1.5 rounded-lg font-bold ${isActive ? 'bg-teal-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer'}"
                      >
                        ${p}
                      </button>
                    `;
                  }).join('')}
                  <button
                    onclick="FPCL_PSM_SUITE.setPage(${currentPage + 1})"
                    ${currentPage >= totalPages ? 'disabled class="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed"' : 'class="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"'}
                  >
                    Next
                  </button>
                </div>
              </div>
            ` : ''}

          </div>

        </div>

        <!-- ========================================================================= -->
        <!-- 8. FINDING INSPECTION MODAL                                               -->
        <!-- ========================================================================= -->
        <div id="psm-inspection-modal" class="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs hidden items-center justify-center p-4">
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
    },

    // Horizontal grouped/stacked bar chart for departments
    renderDepartmentBarChart(deptList) {
      if (!deptList || deptList.length === 0) {
        return `<div class="text-center py-8 text-xs text-slate-400">No data available</div>`;
      }

      // Find maximum total to scale bars
      const maxTotal = Math.max(...deptList.map(d => d.total), 1);
      // Axis ticks up to max (e.g. 0, 5, 10, 15, 20, 25, 30)
      const tickMax = Math.ceil(maxTotal / 5) * 5;
      const ticks = [];
      for (let t = 0; t <= tickMax; t += 5) {
        ticks.push(t);
      }

      const rowHeight = 36;
      const chartHeight = deptList.length * rowHeight + 40;
      const svgWidth = 650;
      const labelWidth = 130;
      const plotWidth = svgWidth - labelWidth - 30;

      const barsSvg = deptList.map((d, i) => {
        const y = i * rowHeight + 10;
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
            <rect x="0" y="${y - 4}" width="${svgWidth}" height="${rowHeight}" fill="${isSelected ? '#F0FDFA' : 'transparent'}" class="group-hover:fill-teal-50/50 transition-colors rounded-md"/>
            
            <!-- Department Label -->
            <text x="${labelWidth - 10}" y="${y + 16}" fill="${isSelected ? '#0D9488' : '#334155'}" font-size="11" font-weight="${isSelected ? '900' : '700'}" text-anchor="end" class="transition-colors group-hover:fill-teal-700">
              ${d.name}
            </text>

            <!-- Background Track -->
            <rect x="${labelWidth}" y="${y + 4}" width="${plotWidth}" height="18" rx="4" fill="#F1F5F9"/>

            <!-- Open Findings Bar (Rose) -->
            ${d.open > 0 ? `
              <rect
                x="${labelWidth}"
                y="${y + 4}"
                width="${openW}"
                height="18"
                rx="${d.close > 0 ? '4 0 0 4' : '4'}"
                fill="#F43F5E"
                class="transition-all opacity-95 group-hover:opacity-100 cursor-pointer"
                onclick="event.stopPropagation(); FPCL_PSM_SUITE.openDataModal({ title: '${d.name.replace(/'/g, "\\'")} — Open Findings', badge: 'Active Open', subtitle: '${d.open} Open Findings Requiring Action', filterDept: '${d.name.replace(/'/g, "\\'")}', filterStatus: 'Open' })"
                onmouseenter="event.stopPropagation(); FPCL_PSM_SUITE.showTooltip(event, { title: '${d.name.replace(/'/g, "\\'")} — Open', badge: 'Active Open', color: '#F43F5E', subtitle: 'Action Pending', metrics: [{ label: 'Open Count', value: '${d.open}', color: '#F43F5E' }, { label: 'Dept Total', value: '${d.total}' }], hint: 'Click to open ${d.open} Open findings' })"
                onmousemove="event.stopPropagation(); FPCL_PSM_SUITE.moveTooltip(event)"
                onmouseleave="event.stopPropagation(); FPCL_PSM_SUITE.hideTooltip()"
              >
                <title>${d.name} Open: ${d.open} findings</title>
              </rect>
              ${openW > 14 ? `
                <text x="${labelWidth + openW / 2}" y="${y + 16}" fill="#ffffff" font-size="10" font-weight="900" font-family="monospace" text-anchor="middle" pointer-events="none">${d.open}</text>
              ` : ''}
            ` : ''}

            <!-- Closed Findings Bar (Teal) -->
            ${d.close > 0 ? `
              <rect
                x="${labelWidth + openW}"
                y="${y + 4}"
                width="${closeW}"
                height="18"
                rx="${d.open > 0 ? '0 4 4 0' : '4'}"
                fill="#10B981"
                class="transition-all opacity-95 group-hover:opacity-100 cursor-pointer"
                onclick="event.stopPropagation(); FPCL_PSM_SUITE.openDataModal({ title: '${d.name.replace(/'/g, "\\'")} — Closed Findings', badge: 'Resolved', subtitle: '${d.close} Closed & Verified Findings', filterDept: '${d.name.replace(/'/g, "\\'")}', filterStatus: 'Close' })"
                onmouseenter="event.stopPropagation(); FPCL_PSM_SUITE.showTooltip(event, { title: '${d.name.replace(/'/g, "\\'")} — Closed', badge: 'Resolved', color: '#10B981', subtitle: 'Completed Findings', metrics: [{ label: 'Closed Count', value: '${d.close}', color: '#10B981' }, { label: 'Dept Total', value: '${d.total}' }, { label: 'Resolution Rate', value: '${d.closureRate}%' }], hint: 'Click to open ${d.close} Closed findings' })"
                onmousemove="event.stopPropagation(); FPCL_PSM_SUITE.moveTooltip(event)"
                onmouseleave="event.stopPropagation(); FPCL_PSM_SUITE.hideTooltip()"
              >
                <title>${d.name} Closed: ${d.close} findings</title>
              </rect>
              ${closeW > 14 ? `
                <text x="${labelWidth + openW + closeW / 2}" y="${y + 16}" fill="#ffffff" font-size="10" font-weight="900" font-family="monospace" text-anchor="middle" pointer-events="none">${d.close}</text>
              ` : ''}
            ` : ''}

            <!-- Total count label at end of bar -->
            <text x="${labelWidth + totalW + 8}" y="${y + 16}" fill="#64748B" font-size="10" font-weight="bold" font-family="monospace">
              ${d.total}
            </text>
          </g>
        `;
      }).join('');

      // Grid line ticks
      const gridSvg = ticks.map(t => {
        const x = labelWidth + (t / tickMax) * plotWidth;
        return `
          <line x1="${x}" y1="5" x2="${x}" y2="${deptList.length * rowHeight + 10}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="2 2"/>
          <text x="${x}" y="${deptList.length * rowHeight + 25}" fill="#94A3B8" font-size="10" font-family="monospace" text-anchor="middle">${t}</text>
        `;
      }).join('');

      return `
        <svg viewBox="0 0 ${svgWidth} ${chartHeight}" class="w-full h-auto select-none overflow-visible">
          ${gridSvg}
          ${barsSvg}
        </svg>
      `;
    },

    // Interactive Donut Chart for Audit Breakdown
    renderBreakdownDonut(filteredData) {
      const isElement = this.state.chartBreakdownMode === 'element';
      const items = isElement ? this.getElementAggregation(filteredData) : this.getSeverityAggregation(filteredData);
      
      if (items.length === 0) {
        return `<div class="text-center py-6 text-xs text-slate-400">No records available</div>`;
      }

      // Elegant palette colors for slices
      const colors = ['#0D9488', '#0284C7', '#6366F1', '#EC4899', '#F59E0B', '#8B5CF6', '#10B981'];

      const total = items.reduce((acc, it) => acc + it.count, 0);
      const radius = 56;
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
            cx="75" cy="75" r="${radius}"
            fill="transparent"
            stroke="${color}"
            stroke-width="${isFiltered ? '24' : '20'}"
            stroke-dasharray="${sliceLength} ${circumference - sliceLength}"
            stroke-dashoffset="${offset}"
            class="transition-all duration-300 cursor-pointer hover:opacity-80"
            onclick="FPCL_PSM_SUITE.openDataModal({ title: '${isElement ? 'PSM Element: ' : 'Severity: '}${it.name.replace(/'/g, "\\'")}', badge: '${isElement ? 'PSM Element' : 'Severity'}', subtitle: '${it.count} Findings (${it.percentage}% of audit scope)', ${isElement ? "filterElement: '" + it.name.replace(/'/g, "\\'") + "'" : "filterNature: '" + it.name.replace(/'/g, "\\'") + "'"} })"
            onmouseenter="FPCL_PSM_SUITE.showTooltip(event, { title: '${it.name.replace(/'/g, "\\'")}', badge: '${isElement ? 'PSM Element' : 'Severity'}', color: '${color}', subtitle: 'Audit Breakdown Slice', metrics: [{ label: 'Count', value: '${it.count}' }, { label: 'Share of Audit', value: '${it.percentage}%' }, { label: 'Total In Scope', value: '${total}' }], hint: 'Click to open ${it.count} findings for ${it.name.replace(/'/g, "\\'")}' })"
            onmousemove="FPCL_PSM_SUITE.moveTooltip(event)"
            onmouseleave="FPCL_PSM_SUITE.hideTooltip()"
          >
            <title>${it.name}: ${it.count} (${it.percentage}%) - Click to open data records</title>
          </circle>
        `;
      }).join('');

      const legendHtml = items.map((it, i) => {
        const color = colors[i % colors.length];
        const isFiltered = (isElement && this.state.elementFilter === it.name) || (!isElement && this.state.natureFilter === it.name);
        return `
          <button
            onclick="FPCL_PSM_SUITE.openDataModal({ title: '${isElement ? 'PSM Element: ' : 'Severity: '}${it.name.replace(/'/g, "\\'")}', badge: '${isElement ? 'PSM Element' : 'Severity'}', subtitle: '${it.count} Findings (${it.percentage}% of audit scope)', ${isElement ? "filterElement: '" + it.name.replace(/'/g, "\\'") + "'" : "filterNature: '" + it.name.replace(/'/g, "\\'") + "'"} })"
            onmouseenter="FPCL_PSM_SUITE.showTooltip(event, { title: '${it.name.replace(/'/g, "\\'")}', badge: '${isElement ? 'PSM Element' : 'Severity'}', color: '${color}', subtitle: 'Audit Filter Tag', metrics: [{ label: 'Count', value: '${it.count}' }, { label: 'Share', value: '${it.percentage}%' }], hint: 'Click to explore ${it.count} findings' })"
            onmousemove="FPCL_PSM_SUITE.moveTooltip(event)"
            onmouseleave="FPCL_PSM_SUITE.hideTooltip()"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all text-left cursor-pointer ${
              isFiltered 
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-bold' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }"
          >
            <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${color};"></span>
            <span class="text-xs font-bold truncate max-w-[90px]">${it.name}</span>
            <span class="text-[11px] font-mono opacity-75">(${it.count})</span>
          </button>
        `;
      }).join('');

      return `
        <div class="flex flex-col sm:flex-row items-center justify-center gap-6">
          <!-- Donut SVG -->
          <div class="relative w-40 h-40 shrink-0">
            <svg viewBox="0 0 150 150" class="w-full h-full transform -rotate-90">
              <circle cx="75" cy="75" r="${radius}" fill="transparent" stroke="#F1F5F9" stroke-width="20"/>
              ${slicesSvg}
            </svg>
            <div
              onclick="FPCL_PSM_SUITE.openDataModal({ title: 'Complete Audit Scope', badge: 'All Findings', subtitle: '${total} Total Findings Across All Elements' })"
              onmouseenter="FPCL_PSM_SUITE.showTooltip(event, { title: 'Audit Scope', badge: 'All Findings', color: '#0F172A', subtitle: '${isElement ? 'All PSM Elements' : 'All Severity Levels'}', metrics: [{ label: 'Total In Scope', value: '${total}' }], hint: 'Click to open all ${total} audit records' })"
              onmousemove="FPCL_PSM_SUITE.moveTooltip(event)"
              onmouseleave="FPCL_PSM_SUITE.hideTooltip()"
              class="absolute inset-0 flex flex-col items-center justify-center cursor-pointer text-center group rounded-full hover:bg-slate-100/50 transition-colors"
              title="Click to view all ${total} findings"
            >
              <span class="text-xl font-black font-mono text-slate-900 group-hover:text-teal-700 transition-colors">${total}</span>
              <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-teal-600 transition-colors">FINDINGS</span>
            </div>
          </div>

          <!-- Legend Tags -->
          <div class="flex flex-wrap items-center justify-center gap-2 max-w-[220px]">
            ${legendHtml}
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
      this.state.searchQuery = val;
      this.state.page = 1;
      this.render();
    },

    clearSearch() {
      this.state.searchQuery = '';
      this.state.page = 1;
      this.render();
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
      if (!isSilent) this.render();

      this._syncPromise = (async () => {
        let targetUrl = window.FPCL_PSM_SHEET_URL || HARDCODED_PSM_SHEET_URL;
        
        // Auto-convert edit link or standard doc link to CSV export link
        if (targetUrl.includes('/edit')) {
          const base = targetUrl.split('/edit')[0];
          targetUrl = `${base}/export?format=csv&gid=0`;
        } else if (!targetUrl.includes('format=csv') && !targetUrl.includes('output=csv') && targetUrl.includes('/spreadsheets/d/')) {
          const match = targetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
          if (match) {
            targetUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=0`;
          }
        }

        let csvText = '';

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

        // Fallback: Try server proxy (/api/sheets/fetch)
        if (!csvText) {
          try {
            const res = await fetch('/api/sheets/fetch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: targetUrl, sheetTab: 'PSM', gid: '0' })
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

        // Fallback: Client-side direct fetch
        if (!csvText) {
          try {
            const resp = await fetch(targetUrl, { method: 'GET', cache: 'no-cache' });
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
        if (!isSilent) this.render();
      });

      return this._syncPromise;
    },

    // Export current filtered findings to CSV file
    exportFilteredCSV() {
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
    openDataModal(config) {
      this.hideTooltip();
      const raw = this.getRawData();
      let records = [];

      if (Array.isArray(config.records)) {
        records = config.records;
      } else {
        records = raw.filter(item => {
          if (config.filterDept && item.actionDepartment !== config.filterDept) return false;
          if (config.filterUnit && item.actionUnit !== config.filterUnit) return false;
          if (config.filterElement && item.psmElement !== config.filterElement) return false;
          if (config.filterNature && item.nature !== config.filterNature) return false;
          if (config.filterStatus && config.filterStatus !== 'all' && item.status.toLowerCase() !== config.filterStatus.toLowerCase()) return false;
          return true;
        });
      }

      this.state.activeModal = {
        title: config.title || 'PSM Audit Data Records',
        subtitle: config.subtitle || 'Filtered Findings Explorer',
        badge: config.badge || 'Audit Findings',
        filterDept: config.filterDept || null,
        filterUnit: config.filterUnit || null,
        filterElement: config.filterElement || null,
        filterNature: config.filterNature || null,
        filterStatus: config.filterStatus || 'all',
        allRecords: records,
        searchQuery: '',
        activeStatusTab: config.filterStatus && config.filterStatus !== 'all' ? config.filterStatus : 'all'
      };

      this.renderDataModal();
    },

    closeDataModal() {
      this.state.activeModal = null;
      const modalEl = document.getElementById('psm-data-modal-container');
      if (modalEl) modalEl.innerHTML = '';
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
      if (m.filterDept) this.state.deptFilter = m.filterDept;
      if (m.filterUnit) this.state.unitFilter = m.filterUnit;
      if (m.filterElement) this.state.elementFilter = m.filterElement;
      if (m.filterNature) this.state.natureFilter = m.filterNature;
      if (m.activeStatusTab && m.activeStatusTab !== 'all') {
        this.state.statusFilter = m.activeStatusTab;
      }
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

    getModalFilteredRecords() {
      if (!this.state.activeModal) return [];
      const m = this.state.activeModal;
      let records = m.allRecords || [];

      if (m.activeStatusTab !== 'all') {
        records = records.filter(r => r.status.toLowerCase() === m.activeStatusTab.toLowerCase());
      }

      if (m.searchQuery.trim()) {
        const q = m.searchQuery.toLowerCase();
        records = records.filter(r =>
          (r.observationNo && r.observationNo.toLowerCase().includes(q)) ||
          (r.finding && r.finding.toLowerCase().includes(q)) ||
          (r.actionDepartment && r.actionDepartment.toLowerCase().includes(q)) ||
          (r.actionUnit && r.actionUnit.toLowerCase().includes(q)) ||
          (r.psmElement && r.psmElement.toLowerCase().includes(q)) ||
          (r.nature && r.nature.toLowerCase().includes(q)) ||
          (r.auditNo && r.auditNo.toLowerCase().includes(q))
        );
      }

      return records;
    },

    renderDataModal(maintainScroll = false) {
      if (!this.state.activeModal) return;
      const m = this.state.activeModal;
      const container = document.getElementById('psm-data-modal-container');
      if (!container) return;

      const records = this.getModalFilteredRecords();
      const allRecords = m.allRecords || [];
      const totalCount = allRecords.length;
      const openCount = allRecords.filter(r => r.status === 'Open').length;
      const closedCount = allRecords.filter(r => r.status === 'Close').length;
      const closurePct = totalCount > 0 ? Math.round((closedCount / totalCount) * 100) : 0;

      container.innerHTML = `
        <div class="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5" onclick="if(event.target === this) FPCL_PSM_SUITE.closeDataModal()">
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
                  <p class="text-xs text-slate-500 mt-0.5 truncate">${m.subtitle}</p>
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
            <div class="px-5 py-3 border-b border-slate-200 bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <!-- Summary KPIs -->
              <div class="flex items-center gap-3 flex-wrap text-xs">
                <span class="font-bold text-slate-600">Total in Slice: <strong class="text-slate-900 font-mono text-sm">${totalCount}</strong></span>
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

              <!-- Status Toggle & Search -->
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

                <div class="relative w-44 sm:w-56">
                  <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <i data-lucide="search" class="w-3.5 h-3.5"></i>
                  </div>
                  <input
                    type="text"
                    value="${m.searchQuery}"
                    oninput="FPCL_PSM_SUITE.filterDataModalSearch(this.value)"
                    placeholder="Search slice..."
                    class="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  ${m.searchQuery ? `
                    <button onclick="FPCL_PSM_SUITE.filterDataModalSearch('')" class="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600">
                      <i data-lucide="x" class="w-3 h-3"></i>
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>

            <!-- Table of Findings -->
            <div class="overflow-y-auto flex-1 max-h-[55vh]">
              ${records.length === 0 ? `
                <div class="py-12 text-center text-slate-400 space-y-2">
                  <i data-lucide="inbox" class="w-8 h-8 mx-auto text-slate-300"></i>
                  <p class="text-xs font-semibold">No records match your filter criteria in this slice.</p>
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
