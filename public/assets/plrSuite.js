/**
 * FPCL Executive Operations & Plant Integrity Portal
 * Specialized PLR (Plant Loss Reports) Dashboard Suite
 * 
 * Color Scheme:
 * - Executive Industrial Light Portal Theme (Matching FPCL Operations Portal baseline)
 * - Clean white cards (bg-white), subtle slate borders (border-slate-200), soft shadows
 * - Corporate Steel Blue (#2E6DA4), Emerald (#10b981) for Closed/Resolved, Rose (#f43f5e) for Open
 * 
 * Layout & Visuals:
 * - 4 Executive KPI Cards: Total PLRs (233), Open PLRs (27), Total Recommendations (451), Open Recommendations (31)
 * - Row 1 Visuals:
 *     - Incident Breakdown by Machine (Col B & Col G | 233 Outages) (Donut + Clean Quick-Select Pills)
 *     - Overall Incident Resolution & Status (Pie Chart: 206 Closed / 27 Open + Resolution Ratio + Direct Filter Actions)
 * - Row 2 Visuals:
 *     - Action Recommendations Per Dept (451 Recs) (Stacked / Side-by-Side / Trend Bar Chart, full width covering page area)
 * - Row 3 Visuals:
 *     - Assigned Recommendations Trend (Closed vs. Open) (Full cover chips row without scrollbars + Bento Grid of Dept Progress Cards)
 * - Row 4 Master Log:
 *     - Plant Records & Outage Log with Dual Tabs: PLR Incidents (233) & Recommendations (451)
 *     - Search, dropdowns, clean light table, export CSV, pagination
 * - Dual-Sheet Inspection Modal:
 *     - Cross-referencing PLRStatus incident report and Recommendations tab action items via shared PLR #
 */

(function () {
  'use strict';

  window.portalApp = window.portalApp || {};
  window.portalApp.state = window.portalApp.state || {};

  function getDefaultPlrState() {
    return {
      activeTab: 'incidents', // 'incidents' or 'recommendations'
      recChartMode: 'side-by-side', // 'side-by-side', 'stacked', 'trend'
      assignedTrendMode: 'entity', // 'entity' or 'yearly'
      assignedTrendViewType: 'side-by-side', // 'side-by-side' or 'trend'
      selectedMachine: 'all',
      selectedPriority: 'all',
      selectedDept: 'all',
      selectedYear: 'all',
      selectedEntity: 'all',
      selectedStatus: 'all',
      searchQuery: '',
      page: 1,
      pageSize: 15,
      // Recommendations tab state
      recSelectedEntity: 'all',
      recSelectedStatus: 'all',
      recSearchQuery: '',
      recPage: 1,
      recPageSize: 15,
      // Focused PLR inspection
      focusedPlrNo: null
    };
  }

  function getPlrState() {
    if (!window.portalApp) window.portalApp = {};
    if (!window.portalApp.state) window.portalApp.state = {};
    if (!window.portalApp.state.plrState) {
      window.portalApp.state.plrState = getDefaultPlrState();
    }
    return window.portalApp.state.plrState;
  }

  // Initialize PLR state immediately
  window.portalApp.state.plrState = window.portalApp.state.plrState || getDefaultPlrState();

  function getPlrData() {
    return Array.isArray(window.FPCL_PLR_DATA) ? window.FPCL_PLR_DATA : [];
  }

  function getPlrRecs() {
    return Array.isArray(window.FPCL_PLR_RECOMMENDATIONS) ? window.FPCL_PLR_RECOMMENDATIONS : [];
  }

  /**
   * Fast lookup map of recommendations by PLR #
   */
  function getRecsMapByPlr() {
    const recs = getPlrRecs();
    const map = new Map();
    recs.forEach(r => {
      const key = String(r.plrNo || '').trim().toUpperCase();
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    });
    return map;
  }

  /**
   * Fast lookup map of PLR incidents by PLR #
   */
  function getPlrsMap() {
    const data = getPlrData();
    const map = new Map();
    data.forEach(p => {
      const key = String(p.plrNo || '').trim().toUpperCase();
      if (key) map.set(key, p);
    });
    return map;
  }

  /**
   * Filtered PLR Incidents dataset based on the active image filters
   */
  function getFilteredPlrData() {
    const data = getPlrData();
    const s = getPlrState();
    const recsMap = getRecsMapByPlr();

    return data.filter(item => {
      // Machine filter (COL G)
      if (s.selectedMachine && s.selectedMachine !== 'all') {
        const itemMachine = String(item.machine || '').toLowerCase();
        const targetMachine = s.selectedMachine.toLowerCase();
        if (targetMachine === 'other equipment') {
          if (['stg # 4', 'stg # 3', 'stg # 1', 'stg # 2', 'boiler # 1', 'boiler # 2'].some(m => itemMachine.includes(m))) {
            return false;
          }
        } else if (itemMachine !== targetMachine && !itemMachine.includes(targetMachine) && !targetMachine.includes(itemMachine)) {
          return false;
        }
      }

      // Priority filter (COL H)
      if (s.selectedPriority && s.selectedPriority !== 'all') {
        if (String(item.priority || '').toLowerCase() !== s.selectedPriority.toLowerCase()) {
          return false;
        }
      }

      // Resp Dept filter (COL I)
      if (s.selectedDept && s.selectedDept !== 'all') {
        if (String(item.dept || '').toLowerCase() !== s.selectedDept.toLowerCase()) {
          return false;
        }
      }

      // Year filter
      if (s.selectedYear && s.selectedYear !== 'all') {
        if (String(item.year || '') !== String(s.selectedYear)) {
          return false;
        }
      }

      // Action Entity filter (checks linked recommendations or incident dept)
      if (s.selectedEntity && s.selectedEntity !== 'all') {
        const linkedRecs = recsMap.get(String(item.plrNo || '').toUpperCase()) || [];
        const hasEntity = linkedRecs.some(r => String(r.actionBy || '').toLowerCase() === s.selectedEntity.toLowerCase()) ||
          String(item.dept || '').toLowerCase() === s.selectedEntity.toLowerCase();
        if (!hasEntity) return false;
      }

      // Status filter (COL F)
      if (s.selectedStatus && s.selectedStatus !== 'all') {
        if (String(item.status || '').toLowerCase() !== s.selectedStatus.toLowerCase()) {
          return false;
        }
      }

      // Search Query
      if (s.searchQuery && s.searchQuery.trim()) {
        const q = s.searchQuery.toLowerCase().trim();
        const match =
          String(item.plrNo || '').toLowerCase().includes(q) ||
          String(item.incident || '').toLowerCase().includes(q) ||
          String(item.machine || '').toLowerCase().includes(q) ||
          String(item.dept || '').toLowerCase().includes(q) ||
          String(item.priority || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }

  /**
   * Filtered PLR Recommendations dataset based on the active image filters
   */
  function getFilteredPlrRecs() {
    const raw = getPlrRecs();
    const plrsMap = getPlrsMap();
    const s = getPlrState();

    return raw.filter(item => {
      const parentPlr = plrsMap.get(String(item.plrNo || '').toUpperCase());

      // Entity filter (checks actionBy)
      const targetEntity = s.selectedEntity !== 'all' ? s.selectedEntity : (s.recSelectedEntity !== 'all' ? s.recSelectedEntity : null);
      if (targetEntity) {
        if (String(item.actionBy || '').toLowerCase() !== targetEntity.toLowerCase()) {
          return false;
        }
      }

      // Year filter
      if (s.selectedYear && s.selectedYear !== 'all') {
        const itemYear = item.year || (parentPlr ? parentPlr.year : null);
        if (String(itemYear || '') !== String(s.selectedYear)) {
          return false;
        }
      }

      // Machine filter via parent PLR
      if (s.selectedMachine && s.selectedMachine !== 'all') {
        if (!parentPlr) return false;
        const pMachine = String(parentPlr.machine || '').toLowerCase();
        const tMachine = s.selectedMachine.toLowerCase();
        if (tMachine === 'other equipment') {
          if (['stg # 4', 'stg # 3', 'stg # 1', 'stg # 2', 'boiler # 1', 'boiler # 2'].some(m => pMachine.includes(m))) {
            return false;
          }
        } else if (pMachine !== tMachine && !pMachine.includes(tMachine) && !tMachine.includes(pMachine)) {
          return false;
        }
      }

      // Priority filter via parent PLR
      if (s.selectedPriority && s.selectedPriority !== 'all') {
        if (!parentPlr || String(parentPlr.priority || '').toLowerCase() !== s.selectedPriority.toLowerCase()) {
          return false;
        }
      }

      // Dept filter
      if (s.selectedDept && s.selectedDept !== 'all') {
        const itemDept = String(item.actionBy || '').toLowerCase();
        const pDept = parentPlr ? String(parentPlr.dept || '').toLowerCase() : '';
        if (itemDept !== s.selectedDept.toLowerCase() && pDept !== s.selectedDept.toLowerCase()) {
          return false;
        }
      }

      // Status filter
      const targetStatus = s.selectedStatus !== 'all' ? s.selectedStatus : (s.recSelectedStatus !== 'all' ? s.recSelectedStatus : null);
      if (targetStatus) {
        if (String(item.status || '').toLowerCase() !== targetStatus.toLowerCase()) {
          return false;
        }
      }

      // Search Query
      const q = (s.recSearchQuery || '').toLowerCase().trim();
      if (q) {
        const match =
          String(item.plrNo || '').toLowerCase().includes(q) ||
          String(item.recommendation || '').toLowerCase().includes(q) ||
          String(item.actionBy || '').toLowerCase().includes(q) ||
          String(item.status || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }

  // Helper: Dynamically extract all unique Machines from Google Sheet tab PLRstatus (Column G: Machine)
  function getDistinctMachines() {
    const data = getPlrData();
    const counts = {};
    data.forEach(p => {
      const val = (p.machine || '').trim() || 'Auxiliary / Unspecified';
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))
      .map(name => ({ name, count: counts[name] }));
  }

  // Helper: Render complete <option> list for Machine dropdown
  function renderMachineSelectOptions(selectedVal) {
    const machines = getDistinctMachines();
    const total = getPlrData().length;
    let html = `<option value="all" ${selectedVal === 'all' ? 'selected' : ''}>All Machines (${total} Outages)</option>`;
    machines.forEach(m => {
      const isSel = String(selectedVal || '').toLowerCase() === m.name.toLowerCase();
      const escaped = m.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      html += `<option value="${escaped}" ${isSel ? 'selected' : ''}>${escaped} (${m.count} Outages)</option>`;
    });
    return html;
  }

  // Helper: Dynamically extract all unique Action Entities from Google Sheet tab Recommendations (Column F: actionBy)
  function getDistinctActionEntities() {
    const recs = getPlrRecs();
    const counts = {};
    recs.forEach(r => {
      const val = (r.actionBy || '').trim();
      if (val) {
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    // Sort descending by frequency, then alphabetically
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))
      .map(name => ({ name, count: counts[name] }));
  }

  // Helper: Render complete <option> list for Action Entity dropdowns
  function renderActionEntitySelectOptions(selectedVal) {
    const entities = getDistinctActionEntities();
    const total = getPlrRecs().length;
    let html = `<option value="all" ${selectedVal === 'all' ? 'selected' : ''}>All Entities (${total} Recs)</option>`;
    entities.forEach(e => {
      const isSel = String(selectedVal || '').toLowerCase() === e.name.toLowerCase();
      const escaped = e.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      html += `<option value="${escaped}" ${isSel ? 'selected' : ''}>${escaped} (${e.count} items)</option>`;
    });
    return html;
  }

  // Helper: Dynamically generate department recommendations breakdown for Action Recommendations Per Dept chart
  function getDeptRecsList(ignoreEntityFilter = true) {
    const raw = getPlrRecs();
    const plrsMap = getPlrsMap();
    const s = getPlrState();

    const filtered = raw.filter(item => {
      const parentPlr = plrsMap.get(String(item.plrNo || '').toUpperCase());

      // Entity filter (if not ignored)
      if (!ignoreEntityFilter) {
        const targetEntity = s.selectedEntity !== 'all' ? s.selectedEntity : (s.recSelectedEntity !== 'all' ? s.recSelectedEntity : null);
        if (targetEntity && String(item.actionBy || '').toLowerCase() !== targetEntity.toLowerCase()) {
          return false;
        }
      }

      // Year filter
      if (s.selectedYear && s.selectedYear !== 'all') {
        const itemYear = item.year || (parentPlr ? parentPlr.year : null);
        if (String(itemYear || '') !== String(s.selectedYear)) return false;
      }

      // Machine filter
      if (s.selectedMachine && s.selectedMachine !== 'all') {
        if (!parentPlr) return false;
        const pMachine = String(parentPlr.machine || '').toLowerCase();
        const tMachine = s.selectedMachine.toLowerCase();
        if (tMachine === 'other equipment') {
          if (['stg # 4', 'stg # 3', 'stg # 1', 'stg # 2', 'boiler # 1', 'boiler # 2'].some(m => pMachine.includes(m))) return false;
        } else if (pMachine !== tMachine && !pMachine.includes(tMachine) && !tMachine.includes(pMachine)) {
          return false;
        }
      }

      // Priority filter
      if (s.selectedPriority && s.selectedPriority !== 'all') {
        if (!parentPlr || String(parentPlr.priority || '').toLowerCase() !== s.selectedPriority.toLowerCase()) return false;
      }

      // Resp Dept filter (incident level)
      if (s.selectedDept && s.selectedDept !== 'all') {
        const itemDept = String(item.actionBy || '').toLowerCase();
        const pDept = parentPlr ? String(parentPlr.dept || '').toLowerCase() : '';
        if (itemDept !== s.selectedDept.toLowerCase() && pDept !== s.selectedDept.toLowerCase()) return false;
      }

      return true;
    });

    const map = new Map();
    filtered.forEach(r => {
      const val = (r.actionBy || '').trim() || 'Unassigned';
      if (!map.has(val)) {
        map.set(val, { name: val, total: 0, open: 0, closed: 0 });
      }
      const item = map.get(val);
      item.total++;
      if ((r.status || '').toLowerCase() === 'open') {
        item.open++;
      } else {
        item.closed++;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  }

  // Helper: Dynamically generate multi-year recommendations progression (2017–2025)
  function getYearlyRecsList() {
    const raw = getPlrRecs();
    const plrsMap = getPlrsMap();
    const s = getPlrState();

    const filtered = raw.filter(item => {
      const parentPlr = plrsMap.get(String(item.plrNo || '').toUpperCase());

      // Entity filter
      const targetEntity = s.selectedEntity !== 'all' ? s.selectedEntity : (s.recSelectedEntity !== 'all' ? s.recSelectedEntity : null);
      if (targetEntity && String(item.actionBy || '').toLowerCase() !== targetEntity.toLowerCase()) {
        return false;
      }

      // Machine filter
      if (s.selectedMachine && s.selectedMachine !== 'all') {
        if (!parentPlr) return false;
        const pMachine = String(parentPlr.machine || '').toLowerCase();
        const tMachine = s.selectedMachine.toLowerCase();
        if (tMachine === 'other equipment') {
          if (['stg # 4', 'stg # 3', 'stg # 1', 'stg # 2', 'boiler # 1', 'boiler # 2'].some(m => pMachine.includes(m))) return false;
        } else if (pMachine !== tMachine && !pMachine.includes(tMachine) && !tMachine.includes(pMachine)) {
          return false;
        }
      }

      // Priority filter
      if (s.selectedPriority && s.selectedPriority !== 'all') {
        if (!parentPlr || String(parentPlr.priority || '').toLowerCase() !== s.selectedPriority.toLowerCase()) return false;
      }

      return true;
    });

    const years = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];
    const map = new Map();
    years.forEach(y => map.set(y, { year: y, total: 0, closed: 0, open: 0 }));

    filtered.forEach(r => {
      const parentPlr = plrsMap.get(String(r.plrNo || '').toUpperCase());
      const y = String(r.year || (parentPlr ? parentPlr.year : '') || '2025');
      if (map.has(y)) {
        const item = map.get(y);
        item.total++;
        if ((r.status || '').toLowerCase() === 'open') item.open++;
        else item.closed++;
      }
    });

    return Array.from(map.values());
  }

  // Helper: Dynamically generate entity analytics breakdown for chips, bento cards & assigned trend
  function getEntityAnalyticsList() {
    const raw = getPlrRecs();
    const plrsMap = getPlrsMap();
    const s = getPlrState();

    const filtered = raw.filter(item => {
      const parentPlr = plrsMap.get(String(item.plrNo || '').toUpperCase());

      // Year filter
      if (s.selectedYear && s.selectedYear !== 'all') {
        const itemYear = item.year || (parentPlr ? parentPlr.year : null);
        if (String(itemYear || '') !== String(s.selectedYear)) return false;
      }

      // Machine filter
      if (s.selectedMachine && s.selectedMachine !== 'all') {
        if (!parentPlr) return false;
        const pMachine = String(parentPlr.machine || '').toLowerCase();
        const tMachine = s.selectedMachine.toLowerCase();
        if (tMachine === 'other equipment') {
          if (['stg # 4', 'stg # 3', 'stg # 1', 'stg # 2', 'boiler # 1', 'boiler # 2'].some(m => pMachine.includes(m))) return false;
        } else if (pMachine !== tMachine && !pMachine.includes(tMachine) && !tMachine.includes(pMachine)) {
          return false;
        }
      }

      // Priority filter
      if (s.selectedPriority && s.selectedPriority !== 'all') {
        if (!parentPlr || String(parentPlr.priority || '').toLowerCase() !== s.selectedPriority.toLowerCase()) return false;
      }

      return true;
    });

    const map = new Map();
    filtered.forEach(r => {
      const val = (r.actionBy || '').trim() || 'Unassigned';
      if (!map.has(val)) {
        map.set(val, { name: val, items: 0, open: 0, closed: 0 });
      }
      const item = map.get(val);
      item.items++;
      if ((r.status || '').toLowerCase() === 'open') {
        item.open++;
      } else {
        item.closed++;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.items - a.items || a.name.localeCompare(b.name));
  }

  // Filter Event Handlers matching attached image
  portalApp.handlePlrMachineChange = function (val) {
    const s = getPlrState();
    s.selectedMachine = val;
    s.page = 1;
    s.recPage = 1;
    portalApp.renderPlrSuite();
  };

  portalApp.handlePlrPriorityChange = function (val) {
    const s = getPlrState();
    s.selectedPriority = val;
    s.page = 1;
    s.recPage = 1;
    portalApp.renderPlrSuite();
  };

  portalApp.handlePlrDeptChange = function (val) {
    const s = getPlrState();
    s.selectedDept = val;
    s.page = 1;
    s.recPage = 1;
    portalApp.renderPlrSuite();
  };

  portalApp.handlePlrYearChange = function (val) {
    const s = getPlrState();
    s.selectedYear = val;
    s.page = 1;
    s.recPage = 1;
    portalApp.renderPlrSuite();
  };

  portalApp.handlePlrEntityChange = function (val) {
    const s = getPlrState();
    s.selectedEntity = val;
    s.recSelectedEntity = val;
    s.page = 1;
    s.recPage = 1;
    portalApp.renderPlrSuite();
  };

  portalApp.resetAllPlrImageFilters = function () {
    const s = getPlrState();
    s.selectedMachine = 'all';
    s.selectedPriority = 'all';
    s.selectedDept = 'all';
    s.selectedYear = 'all';
    s.selectedEntity = 'all';
    s.recSelectedEntity = 'all';
    s.selectedStatus = 'all';
    s.recSelectedStatus = 'all';
    s.searchQuery = '';
    s.recSearchQuery = '';
    s.page = 1;
    s.recPage = 1;
    portalApp.renderPlrSuite();
  };

  /**
   * Main Render Method for the PLR specialized container
   */
  portalApp.renderPlrSuite = function () {
    const container = document.getElementById('plr-specialized-container');
    if (!container) return;

    const data = getFilteredPlrData();
    const recs = getFilteredPlrRecs();
    const s = getPlrState();

    // High Level Core Metrics calculated dynamically from active filters
    const totalPLRs = data.length;
    const openPLRs = data.filter(d => (d.status || '').toLowerCase() === 'open').length;
    const closedPLRs = totalPLRs - openPLRs;
    const plrClosureRate = totalPLRs > 0 ? ((closedPLRs / totalPLRs) * 100).toFixed(0) : 0;

    const totalRecs = recs.length;
    const openRecs = recs.filter(r => (r.status || '').toLowerCase() === 'open').length;
    const closedRecs = totalRecs - openRecs;
    const recClosureRate = totalRecs > 0 ? ((closedRecs / totalRecs) * 100).toFixed(0) : 0;

    const activeFilterCount = [
      s.selectedMachine !== 'all',
      s.selectedPriority !== 'all',
      s.selectedDept !== 'all',
      s.selectedYear !== 'all',
      s.selectedEntity !== 'all'
    ].filter(Boolean).length;
    const hasActiveFilters = activeFilterCount > 0;

    container.innerHTML = `
      <div class="space-y-6 text-slate-800 font-sans antialiased">
        
        <!-- ========================================================================= -->
        <!-- 1. TOP WORKBOOK CONNECTION & ACTION BAR (Light Theme)                     -->
        <!-- ========================================================================= -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2E6DA4] to-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <i data-lucide="activity" class="w-5 h-5 text-white"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-base sm:text-lg font-black text-slate-900 tracking-tight">Plant Loss Reports (PLR) Dashboard Suite</h3>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Connected Sheets Active
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  ${totalPLRs} Incidents • ${totalRecs} Recommendations
                </span>
              </div>
              <p class="text-xs text-slate-500 font-medium mt-0.5">
                Source Workbook: <span class="font-bold text-slate-700 font-mono">PLRs white dashboard</span> • Dual Tabs: <strong class="text-[#2E6DA4]">PLRStatus</strong> &amp; <strong class="text-emerald-700">Recommendations</strong>
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button
              onclick="portalApp.resetAllPlrImageFilters()"
              class="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Reset all filters across both tabs"
            >
              <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-[#2E6DA4]"></i>
              <span>Reset Filters</span>
            </button>
            <button
              onclick="portalApp.exportPlrCSV()"
              class="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#2E6DA4] hover:bg-[#235885] shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 2. EXECUTIVE FILTER SUITE (ATTACHED IMAGE FILTER CONTROLS)                 -->
        <!-- ========================================================================= -->
        <div class="rounded-2xl p-4 sm:p-5 shadow-lg border relative overflow-hidden" style="background: linear-gradient(135deg, #091a32 0%, #0c2340 100%); border-color: #1e3a5f;">
          <!-- Subtle ambient backdrop lighting -->
          <div class="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <!-- Top Filter Header / Status Row -->
          <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 mb-3.5 border-b border-[#1e3e66]">
            <div class="flex items-center gap-2.5">
              <span class="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                <i data-lucide="sliders-horizontal" class="w-4 h-4"></i>
              </span>
              <div>
                <h4 class="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <span>Executive Filter Controls</span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-500/30">
                    PLR Dynamic Slicers
                  </span>
                </h4>
                <p class="text-[11px] text-slate-300 font-medium">
                  Direct cross-sheet filtering across Machine, Priority, Resp Dept, Year &amp; Action Entity
                </p>
              </div>
            </div>
            
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-cyan-300 px-3 py-1 rounded-lg bg-[#0d2747] border border-[#1e4470] shadow-inner">
                ${hasActiveFilters ? `${activeFilterCount} Active Filters (${totalPLRs} PLRs • ${totalRecs} Recs)` : `All Combined (${totalPLRs} PLRs • ${totalRecs} Recs)`}
              </span>
            </div>
          </div>

          <!-- The 5 Dropdown Filters + Reset Button Grid (Matching Attached Image) -->
          <div class="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 items-end">
            
            <!-- Filter 1: MACHINE (COL G) -->
            <div class="space-y-1.5">
              <div class="flex items-center gap-1.5 text-[11px] font-mono font-black text-cyan-300 uppercase tracking-wider">
                <i data-lucide="cpu" class="w-3.5 h-3.5 text-cyan-400"></i>
                <span>MACHINE (COL G)</span>
              </div>
              <select
                onchange="portalApp.handlePlrMachineChange(this.value)"
                class="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-[#1e3e66] bg-[#0c2138] text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 cursor-pointer shadow-inner"
              >
                ${renderMachineSelectOptions(s.selectedMachine)}
              </select>
            </div>

            <!-- Filter 2: PRIORITY (COL H) -->
            <div class="space-y-1.5">
              <div class="flex items-center gap-1.5 text-[11px] font-mono font-black text-rose-300 uppercase tracking-wider">
                <i data-lucide="shield-alert" class="w-3.5 h-3.5 text-rose-400"></i>
                <span>PRIORITY (COL H)</span>
              </div>
              <select
                onchange="portalApp.handlePlrPriorityChange(this.value)"
                class="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-[#1e3e66] bg-[#0c2138] text-white focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 cursor-pointer shadow-inner"
              >
                <option value="all" ${s.selectedPriority === 'all' ? 'selected' : ''}>All Priorities</option>
                <option value="Critical" ${s.selectedPriority === 'Critical' ? 'selected' : ''}>Critical Priority</option>
                <option value="High" ${s.selectedPriority === 'High' ? 'selected' : ''}>High Priority</option>
                <option value="Medium" ${s.selectedPriority === 'Medium' ? 'selected' : ''}>Medium Priority</option>
                <option value="Low" ${s.selectedPriority === 'Low' ? 'selected' : ''}>Low Priority</option>
              </select>
            </div>

            <!-- Filter 3: DEPARTMENT (COL F) -->
            <div class="space-y-1.5">
              <div class="flex items-center gap-1.5 text-[11px] font-mono font-black text-amber-300 uppercase tracking-wider">
                <i data-lucide="briefcase" class="w-3.5 h-3.5 text-amber-400"></i>
                <span>DEPARTMENT (COL F)</span>
              </div>
              <select
                onchange="portalApp.handlePlrDeptChange(this.value)"
                class="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-[#1e3e66] bg-[#0c2138] text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 cursor-pointer shadow-inner"
              >
                ${renderActionEntitySelectOptions(s.selectedDept)}
              </select>
            </div>

            <!-- Filter 4: YEAR FILTER -->
            <div class="space-y-1.5">
              <div class="flex items-center gap-1.5 text-[11px] font-mono font-black text-indigo-300 uppercase tracking-wider">
                <i data-lucide="calendar" class="w-3.5 h-3.5 text-indigo-400"></i>
                <span>YEAR FILTER</span>
              </div>
              <select
                onchange="portalApp.handlePlrYearChange(this.value)"
                class="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-[#1e3e66] bg-[#0c2138] text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 cursor-pointer shadow-inner"
              >
                <option value="all" ${s.selectedYear === 'all' ? 'selected' : ''}>All Combined (2017–2025)</option>
                <option value="2025" ${s.selectedYear === '2025' ? 'selected' : ''}>2025</option>
                <option value="2024" ${s.selectedYear === '2024' ? 'selected' : ''}>2024</option>
                <option value="2023" ${s.selectedYear === '2023' ? 'selected' : ''}>2023</option>
                <option value="2022" ${s.selectedYear === '2022' ? 'selected' : ''}>2022</option>
                <option value="2021" ${s.selectedYear === '2021' ? 'selected' : ''}>2021</option>
                <option value="2020" ${s.selectedYear === '2020' ? 'selected' : ''}>2020</option>
                <option value="2019" ${s.selectedYear === '2019' ? 'selected' : ''}>2019</option>
                <option value="2018" ${s.selectedYear === '2018' ? 'selected' : ''}>2018</option>
                <option value="2017" ${s.selectedYear === '2017' ? 'selected' : ''}>2017</option>
              </select>
            </div>

            <!-- Filter 5: ACTION ENTITY -->
            <div class="space-y-1.5">
              <div class="flex items-center gap-1.5 text-[11px] font-mono font-black text-emerald-300 uppercase tracking-wider">
                <i data-lucide="building-2" class="w-3.5 h-3.5 text-emerald-400"></i>
                <span>ACTION ENTITY</span>
              </div>
              <select
                onchange="portalApp.handlePlrEntityChange(this.value)"
                class="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-[#1e3e66] bg-[#0c2138] text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 cursor-pointer shadow-inner"
              >
                ${renderActionEntitySelectOptions(s.selectedEntity)}
              </select>
            </div>

            <!-- Filter 6: Reset All Button -->
            <div class="space-y-1.5">
              <div class="text-[11px] font-mono font-black text-slate-400 uppercase tracking-wider invisible">
                <span>ACTION</span>
              </div>
              <button
                onclick="portalApp.resetAllPlrImageFilters()"
                class="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black text-white bg-[#132e4f] hover:bg-[#1a3d68] border border-[#254b77] hover:border-cyan-400 transition-all shadow-sm cursor-pointer"
                title="Reset all filters back to default"
              >
                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-cyan-300"></i>
                <span>Reset All</span>
              </button>
            </div>

          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 3. EXECUTIVE KPI CARDS: Total PLRs, Open PLRs, Total Recs, Open Recs      -->
        <!-- ========================================================================= -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- Card 1: TOTAL PLRs -->
          <div class="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden group transition-all">
            <div class="flex items-center justify-between text-slate-500 text-xs sm:text-sm font-bold uppercase tracking-wider">
              <span>Total PLRs</span>
              <span class="p-1.5 rounded-lg bg-blue-50 text-[#2E6DA4] border border-blue-100">
                <i data-lucide="file-text" class="w-4 h-4"></i>
              </span>
            </div>
            <div class="mt-3 mb-1.5 flex items-baseline gap-2">
              <span class="text-5xl sm:text-6xl font-black font-mono text-slate-900 tracking-tight kpi-metric-val">${totalPLRs}</span>
              <span class="text-xs sm:text-sm font-bold text-[#2E6DA4] font-mono">100%</span>
            </div>
            <div class="flex items-center justify-between text-xs sm:text-sm text-slate-500 mt-2">
              <span>Historical Scope (2017–2025)</span>
              <span class="font-bold text-emerald-700 font-mono">${closedPLRs} Closed (${plrClosureRate}%)</span>
            </div>
          </div>

          <!-- Card 2: OPEN PLRs -->
          <div
            onclick="portalApp.filterPlrByStatus('Open')"
            class="bg-white border border-rose-200 hover:border-rose-400 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden group transition-all cursor-pointer"
            title="Click to view all Open PLRs in table"
          >
            <div class="flex items-center justify-between text-slate-500 text-xs sm:text-sm font-bold uppercase tracking-wider">
              <span>Open PLRs</span>
              <span class="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                <i data-lucide="alert-circle" class="w-4 h-4"></i>
              </span>
            </div>
            <div class="mt-3 mb-1.5 flex items-baseline gap-2">
              <span class="text-5xl sm:text-6xl font-black font-mono text-rose-600 tracking-tight kpi-metric-val">${openPLRs}</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                ${totalPLRs > 0 ? ((openPLRs / totalPLRs) * 100).toFixed(0) : 0}% of Total
              </span>
            </div>
            <div class="flex items-center justify-between text-xs sm:text-sm text-slate-500 mt-2">
              <span>Under Active Investigation</span>
              <span class="font-bold text-rose-600 hover:underline flex items-center gap-1">Inspect &gt;</span>
            </div>
          </div>

          <!-- Card 3: TOTAL RECOMMENDATIONS -->
          <div
            onclick="portalApp.setPlrTab('recommendations')"
            class="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden group transition-all cursor-pointer"
            title="Click to view Recommendations Tab"
          >
            <div class="flex items-center justify-between text-slate-500 text-xs sm:text-sm font-bold uppercase tracking-wider">
              <span>Total Recommendations</span>
              <span class="p-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
                <i data-lucide="layers" class="w-4 h-4"></i>
              </span>
            </div>
            <div class="mt-3 mb-1.5 flex items-baseline gap-2">
              <span class="text-5xl sm:text-6xl font-black font-mono text-slate-900 tracking-tight kpi-metric-val">${totalRecs}</span>
              <span class="text-xs sm:text-sm font-bold text-[#2E6DA4] font-mono">16+ Entities</span>
            </div>
            <div class="flex items-center justify-between text-xs sm:text-sm text-slate-500 mt-2">
              <span>${closedRecs} Closed (${recClosureRate}%)</span>
              <span class="font-bold text-[#2E6DA4] hover:underline flex items-center gap-1">View Tab &gt;</span>
            </div>
          </div>

          <!-- Card 4: OPEN RECOMMENDATIONS -->
          <div
            onclick="portalApp.filterRecByStatusDirect('Open')"
            class="bg-white border border-amber-200 hover:border-amber-400 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden group transition-all cursor-pointer"
            title="Click to view Open Recommendations"
          >
            <div class="flex items-center justify-between text-slate-500 text-xs sm:text-sm font-bold uppercase tracking-wider">
              <span>Open Recommendations</span>
              <span class="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                <i data-lucide="clock" class="w-4 h-4"></i>
              </span>
            </div>
            <div class="mt-3 mb-1.5 flex items-baseline gap-2">
              <span class="text-5xl sm:text-6xl font-black font-mono text-amber-600 tracking-tight kpi-metric-val">${openRecs}</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                ${totalRecs > 0 ? ((openRecs / totalRecs) * 100).toFixed(0) : 0}% Open Obs
              </span>
            </div>
            <div class="flex items-center justify-between text-xs sm:text-sm text-slate-500 mt-2">
              <span>Active Corrective Actions</span>
              <span class="font-bold text-amber-700 hover:underline flex items-center gap-1">Inspect &gt;</span>
            </div>
          </div>

        </div>

        <!-- ========================================================================= -->
        <!-- 3. VISUAL DIAGNOSTICS & OUTAGE ANALYTICS (Non-scrollable, Cover Page Area)  -->
        <!-- ========================================================================= -->
        <div class="space-y-5">
          <!-- Section Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="w-2.5 h-2.5 rounded-full bg-[#2E6DA4]"></span>
              <h3 class="text-sm sm:text-base font-black tracking-wider text-slate-900 uppercase">
                Visual Diagnostics &amp; Outage Analytics
              </h3>
              <span class="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#2E6DA4] border border-blue-200 flex items-center gap-1.5">
                <i data-lucide="mouse-pointer" class="w-3 h-3"></i>
                Interactive Boardroom Analytics: Hover &amp; Click Any Element
              </span>
            </div>
            <span class="text-xs font-medium text-slate-500">Plant-Wide Historical Scope: 233 Outages</span>
          </div>

          <!-- Row 1: Machine Breakdown & Overall Incident Resolution (Balanced 2-Col Layout) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            <!-- Left Card: INCIDENT BREAKDOWN BY MACHINE -->
            <div class="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-[#2E6DA4] flex items-center justify-center shrink-0">
                    <i data-lucide="cpu" class="w-5 h-5"></i>
                  </div>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <h4 class="text-xs sm:text-sm font-extrabold text-slate-900 tracking-wide uppercase">Incident Breakdown by Machine</h4>
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Columns B &amp; G
                      </span>
                    </div>
                    <p class="text-[11px] text-slate-500 mt-0.5">Outages across STG units, Boilers &amp; Auxiliary Equipment</p>
                  </div>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#1e40af] border border-blue-200 shrink-0">
                  233 Outages
                </span>
              </div>

              <!-- SVG Donut Graphic -->
              <div id="plr-machine-donut-container" class="relative flex items-center justify-center py-2">
                <!-- Rendered dynamically -->
              </div>

              <!-- Quick Select Buttons (Non-scrollable, fully visible covering page area) -->
              <div class="pt-3 border-t border-slate-100">
                <div class="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
                  <span>Filter by Asset / Machine:</span>
                  <span class="text-[11px] font-normal text-slate-400">Click to isolate records</span>
                </div>
                <div class="flex flex-wrap items-center gap-2" id="plr-machine-quick-select">
                  <!-- Rendered dynamically -->
                </div>
              </div>
            </div>

            <!-- Right Card: OVERALL INCIDENT RESOLUTION -->
            <div class="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-[#047857] flex items-center justify-center shrink-0">
                    <i data-lucide="pie-chart" class="w-5 h-5"></i>
                  </div>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <h4 class="text-xs sm:text-sm font-extrabold text-slate-900 tracking-wide uppercase">Overall Incident Resolution</h4>
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Column F Status
                      </span>
                    </div>
                    <p class="text-[11px] text-slate-500 mt-0.5">Open (Action Pending) vs. Closed (Resolved)</p>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="px-2.5 py-1 rounded-full text-xs font-black bg-red-50 text-[#B91C1C] border border-red-200">
                    27 Open
                  </span>
                  <span class="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-[#047857] border border-emerald-200">
                    206 Closed
                  </span>
                </div>
              </div>

              <!-- SVG Resolution Pie Graphic -->
              <div id="plr-resolution-pie-container" class="relative flex items-center justify-center py-2">
                <!-- Rendered dynamically -->
              </div>

              <!-- Resolution Metrics & Quick Actions (Non-scrollable, fully visible covering page area) -->
              <div class="pt-3 border-t border-slate-100 space-y-3">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-700">Resolution Ratio: <strong class="text-[#047857] font-sans font-extrabold">88% Closed (${closedPLRs}/${totalPLRs})</strong></span>
                  <span class="text-xs text-slate-500 font-medium">Pending: <strong class="text-[#B91C1C] font-sans font-extrabold">12% Open (${openPLRs})</strong></span>
                </div>
                <!-- Closure Progress Bar with Darker Corporate Tones -->
                <div class="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                  <div class="h-full bg-[#047857]" style="width: ${plrClosureRate}%;"></div>
                  <div class="h-full bg-[#B91C1C]" style="width: ${100 - plrClosureRate}%;"></div>
                </div>
                <!-- Action Buttons Filter -->
                <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div class="flex items-center gap-2">
                    <button
                      onclick="portalApp.filterPlrByStatus('all')"
                      class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${s.selectedStatus === 'all' ? 'bg-[#2E6DA4] text-white border-[#2E6DA4]' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'}"
                    >
                      All Incidents (${totalPLRs})
                    </button>
                    <button
                      onclick="portalApp.filterPlrByStatus('Closed')"
                      class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${s.selectedStatus === 'Closed' ? 'bg-[#047857] text-white border-[#047857]' : 'bg-emerald-50 hover:bg-emerald-100 text-[#047857] border-emerald-200'}"
                    >
                      Closed (${closedPLRs})
                    </button>
                  </div>
                  <button
                    onclick="portalApp.filterPlrByStatus('Open')"
                    class="px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-xs ${s.selectedStatus === 'Open' ? 'bg-[#991B1B] text-white border-[#991B1B]' : 'bg-[#B91C1C] hover:bg-[#991B1B] text-white border-[#B91C1C]'}"
                  >
                    <i data-lucide="alert-circle" class="w-3.5 h-3.5"></i>
                    <span>Inspect 27 Open PLRs</span>
                    <i data-lucide="chevron-right" class="w-3 h-3"></i>
                  </button>
                </div>
              </div>

            </div>

          </div>

          <!-- Row 2: ACTION RECOMMENDATIONS PER DEPT (Full Width covering page area) -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-[#2E6DA4] flex items-center justify-center shrink-0">
                  <i data-lucide="layers" class="w-5 h-5"></i>
                </div>
                <div>
                  <h4 class="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">Action Recommendations Per Dept</h4>
                  <p class="text-[11px] text-slate-500 mt-0.5">Open Observations (Rose) vs. Closed (Emerald) across <span class="font-mono font-bold text-slate-700">${totalRecs}</span> total recommendations (<span class="text-emerald-700 font-mono font-bold">${closedRecs} Closed</span> • <span class="text-rose-600 font-mono font-bold">${openRecs} Open</span>)</p>
                </div>
              </div>
              <div class="flex items-center gap-2 self-start sm:self-auto">
                <div class="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px]">
                  <button
                    id="plr-rec-mode-side-by-side"
                    onclick="portalApp.setRecChartMode('side-by-side')"
                    class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${s.recChartMode === 'side-by-side' ? 'bg-[#2E6DA4] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
                  >Side-by-Side</button>
                  <button
                    id="plr-rec-mode-stacked"
                    onclick="portalApp.setRecChartMode('stacked')"
                    class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${s.recChartMode === 'stacked' ? 'bg-[#2E6DA4] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
                  >Stacked</button>
                  <button
                    id="plr-rec-mode-trend"
                    onclick="portalApp.setRecChartMode('trend')"
                    class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${s.recChartMode === 'trend' ? 'bg-[#2E6DA4] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
                  >Trend Lines</button>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-mono font-black bg-blue-50 text-[#2E6DA4] border border-blue-200">
                  ${totalRecs} Recs
                </span>
              </div>
            </div>

            <!-- Legend -->
            <div class="flex items-center justify-end gap-5 text-xs font-semibold">
              <span class="flex items-center gap-1.5 text-slate-700">
                <span class="w-3 h-3 rounded-xs bg-[#10b981]"></span> Closed Observations (${closedRecs})
              </span>
              <span class="flex items-center gap-1.5 text-slate-700">
                <span class="w-3 h-3 rounded-xs bg-[#f43f5e]"></span> Open Observations (${openRecs})
              </span>
              <span class="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                Total: ${totalRecs}
              </span>
            </div>

            <!-- SVG Vertical Bar / Trend Chart (Wide, non-scrollable, responsive) -->
            <div id="plr-dept-bar-chart-container" class="w-full min-h-[285px] mb-3">
              <!-- Rendered dynamically -->
            </div>

            <!-- Quick Filter Pills (Fully covering width, no scrollbar) -->
            <div class="pt-4 border-t border-slate-100 mt-2">
              <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">QUICK FILTER RECOMMENDATIONS BY DEPT:</div>
              <div class="flex flex-wrap items-center gap-2 text-xs" id="plr-dept-quick-filters">
                <!-- Rendered dynamically -->
              </div>
            </div>
          </div>

        </div>

        <!-- ========================================================================= -->
        <!-- 4. ASSIGNED RECOMMENDATIONS TREND (Closed vs. Open)                       -->
        <!-- ========================================================================= -->
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="w-2.5 h-2.5 rounded-full bg-[#2E6DA4]"></span>
              <h3 class="text-sm sm:text-base font-black tracking-wider text-slate-900 uppercase">
                Assigned Recommendations Trends (Closed vs. Open)
              </h3>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#2E6DA4] border border-blue-200">
                ${totalRecs} Actions • ${recClosureRate}% Closed
              </span>
            </div>
            <span class="text-xs font-medium text-slate-500">Columns F (Action Entity) &amp; G (Status)</span>
          </div>

          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <!-- Trend View Switcher & Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-[#047857] flex items-center justify-center shrink-0">
                  <i data-lucide="trending-up" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">Assigned Recommendations Progression &amp; Resolution Trend</h4>
                  <p class="text-[11px] text-slate-500 mt-0.5">Comparative tracking of Closed (Emerald) vs. Open (Rose) recommendations as per current active dataset</p>
                </div>
              </div>
              <div class="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <div class="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px]">
                  <button
                    id="plr-assigned-view-bars"
                    onclick="portalApp.setAssignedTrendViewType('side-by-side')"
                    class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${s.assignedTrendViewType === 'side-by-side' ? 'bg-[#2E6DA4] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
                  >Side-by-Side</button>
                  <button
                    id="plr-assigned-view-trend"
                    onclick="portalApp.setAssignedTrendViewType('trend')"
                    class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${s.assignedTrendViewType === 'trend' ? 'bg-[#2E6DA4] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
                  >Trend Lines</button>
                </div>
                <div class="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px]">
                  <button
                    id="plr-assigned-mode-entity"
                    onclick="portalApp.setAssignedTrendMode('entity')"
                    class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${s.assignedTrendMode === 'entity' ? 'bg-[#2E6DA4] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
                  >By Assigned Entity</button>
                  <button
                    id="plr-assigned-mode-yearly"
                    onclick="portalApp.setAssignedTrendMode('yearly')"
                    class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${s.assignedTrendMode === 'yearly' ? 'bg-[#2E6DA4] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
                  >Multi-Year Progression (2017–2025)</button>
                </div>
                <div class="flex items-center gap-3 text-xs font-semibold pl-2">
                  <span class="flex items-center gap-1.5 text-slate-700">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span> Closed (${closedRecs})
                  </span>
                  <span class="flex items-center gap-1.5 text-slate-700">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"></span> Open (${openRecs})
                  </span>
                </div>
              </div>
            </div>

            <!-- Dedicated SVG Trend Chart Container -->
            <div id="plr-assigned-trend-chart-container" class="w-full min-h-[285px] mb-3">
              <!-- Rendered dynamically -->
            </div>

            <!-- Quick Selection Chips -->
            <div class="pt-4 border-t border-slate-100 mt-2">
              <div class="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
                <span class="uppercase tracking-wider text-[11px] text-slate-500">FILTER RECOMMENDATIONS BY ASSIGNED ENTITY CHIPS:</span>
                <span class="text-[11px] font-normal text-slate-400">Click to filter table records</span>
              </div>
              <div class="flex flex-wrap items-center gap-2" id="plr-entity-chips-container">
                <!-- Rendered dynamically without inner scrollbars -->
              </div>
            </div>

            <!-- 4-Column Bento Grid of Department Cards (Covers page area) -->
            <div class="pt-3 border-t border-slate-100">
              <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                ENTITY RESOLUTION CARDS &amp; PROGRESS BREAKDOWN:
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" id="plr-bento-cards-container">
                <!-- Rendered dynamically -->
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 5. PLANT RECORDS & OUTAGE LOG (Light Master Table)                         -->
        <!-- ========================================================================= -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <!-- Header with Dual Tabs -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#2E6DA4] flex items-center justify-center shrink-0">
                <i data-lucide="database" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 uppercase tracking-wider">Plant Records &amp; Outage Log</h3>
                <p class="text-xs text-slate-500 mt-0.5">
                  ${s.activeTab === 'incidents' ? 'PLR Incident Investigation Rows (Tab: PLRStatus)' : 'Corrective Action Plan Rows (Tab: Recommendations)'}
                </p>
              </div>
            </div>

            <!-- Dual Tab Switcher -->
            <div class="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto">
              <button
                onclick="portalApp.setPlrTab('incidents')"
                class="px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  s.activeTab === 'incidents'
                    ? 'bg-[#2E6DA4] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }"
              >
                <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                <span>PLR Incidents (${totalPLRs})</span>
              </button>
              <button
                onclick="portalApp.setPlrTab('recommendations')"
                class="px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  s.activeTab === 'recommendations'
                    ? 'bg-[#2E6DA4] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }"
              >
                <i data-lucide="layers" class="w-3.5 h-3.5"></i>
                <span>Recommendations (${totalRecs})</span>
              </button>
            </div>
          </div>

          <!-- Filter Toolbar for Active Tab -->
          <div id="plr-table-toolbar-container">
            <!-- Rendered dynamically -->
          </div>

          <!-- Active Tab Table Body -->
          <div id="plr-table-body-container" class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <!-- Rendered dynamically -->
          </div>

          <!-- Pagination Bar -->
          <div id="plr-pagination-container" class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 6. DUAL-TRACKING PLR INSPECTION MODAL (Cross-sheet inspection)             -->
        <!-- ========================================================================= -->
        <div id="plr-inspection-modal-container">
          <!-- Rendered dynamically when a PLR is clicked -->
        </div>

      </div>
    `;

    // Render Sub-Components
    portalApp.renderMachineDonut();
    portalApp.renderDeptBarChart();
    portalApp.renderResolutionPie();
    portalApp.renderAssignedTrendChart();
    portalApp.renderEntityChipsAndBento();
    portalApp.renderTableSection();

    if (window.lucide) window.lucide.createIcons();
  };

  /**
   * 1. Machine Breakdown Donut (Light Theme, crisp contrast & professional typography)
   */
  portalApp.renderMachineDonut = function () {
    const container = document.getElementById('plr-machine-donut-container');
    const quickSelContainer = document.getElementById('plr-machine-quick-select');
    if (!container) return;

    const s = getPlrState();
    const machines = [
      { name: 'STG # 4', count: 155, pct: 67, color: '#1e40af' },
      { name: 'STG # 3', count: 19, pct: 8, color: '#047857' },
      { name: 'Boiler # 1 (CFB-1)', count: 16, pct: 7, color: '#7c3aed' },
      { name: 'STG # 2', count: 13, pct: 6, color: '#0891b2' },
      { name: 'Boiler # 2 (CFB-2)', count: 11, pct: 5, color: '#d97706' },
      { name: 'STG # 1', count: 10, pct: 4, color: '#0284c7' },
      { name: 'Other Equipment', count: 9, pct: 4, color: '#475569' }
    ];

    const total = 233;
    const r = 124;
    const cx = 160;
    const cy = 160;
    const strokeWidth = 32;

    let cumulativeAngle = -Math.PI / 2;
    const paths = [];

    machines.forEach(m => {
      const sliceAngle = (m.count / total) * 2 * Math.PI;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + sliceAngle;
      cumulativeAngle += sliceAngle;

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const largeArc = sliceAngle > Math.PI ? 1 : 0;

      const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
      const isSelected = s.selectedMachine === m.name;

      paths.push(`
        <path
          d="${d}"
          fill="none"
          stroke="${m.color}"
          stroke-width="${isSelected ? strokeWidth + 6 : strokeWidth}"
          class="cursor-pointer transition-all duration-300 hover:opacity-85"
          onclick="portalApp.filterPlrByMachine('${m.name}')"
        >
          <title>${m.name}: ${m.count} Outages (${m.pct}%)</title>
        </path>
      `);
    });

    const activeMachine = machines.find(m => m.name === s.selectedMachine) || { name: 'STG # 4', count: 155, pct: 67 };
    const isSTG4 = activeMachine.name.includes('STG # 4');

    container.innerHTML = `
      <div class="relative w-[300px] h-[300px] sm:w-[320px] sm:h-[320px] max-w-full aspect-square">
        <svg viewBox="0 0 320 320" class="w-full h-full select-none">
          <!-- Soft Background Track Ring -->
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="${strokeWidth}" />
          ${paths.join('')}
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4 font-sans">
          <span class="text-xs font-extrabold text-slate-600 uppercase tracking-wider leading-tight font-sans">${activeMachine.name}</span>
          ${isSTG4 ? `
            <span class="inline-flex items-center text-[10px] font-bold text-[#1e40af] bg-blue-50/90 px-2 py-0.5 rounded-full border border-blue-200/80 mt-0.5 font-sans">
              Primary Outage Driver
            </span>
          ` : `
            <span class="inline-flex items-center text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 mt-0.5 font-sans">
              Equipment Unit
            </span>
          `}
          <span class="text-4xl sm:text-[44px] font-black text-slate-900 tracking-tight leading-none my-1 font-sans">${activeMachine.count}</span>
          <span class="text-xs font-bold text-slate-600 font-sans tracking-tight">${activeMachine.pct}% of Total Outages</span>
        </div>
      </div>
    `;

    // Quick Select Buttons (Non-scrollable, all visible covering page area)
    if (quickSelContainer) {
      quickSelContainer.innerHTML = machines.map(m => {
        const isSel = s.selectedMachine === m.name;
        return `
          <button
            onclick="portalApp.filterPlrByMachine('${m.name}')"
            class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              isSel
                ? 'bg-[#1e40af] text-white border-[#1e40af] font-black shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }"
          >
            <span class="w-2 h-2 rounded-full" style="background-color: ${m.color}"></span>
            <span>${m.name}</span>
            <span class="font-sans font-semibold text-[11px] opacity-80">(${m.count})</span>
          </button>
        `;
      }).join('') + (s.selectedMachine !== 'all' ? `
        <button
          onclick="portalApp.filterPlrByMachine('all')"
          class="px-2.5 py-1 rounded-lg text-xs font-bold text-[#1e40af] bg-white hover:bg-slate-50 border border-[#1e40af] cursor-pointer"
        >
          Clear Selection
        </button>
      ` : '');
    }
  };

  /**
   * Helper to format department and entity labels so they never overlap or spill over
   */
  function formatDeptLabel(name) {
    if (!name) return 'Unassigned';
    return String(name).trim();
  }

  /**
   * 2. Action Recommendations Per Dept Bar/Trend Chart (Dynamic from modified data, Wide & Non-scrollable)
   */
  portalApp.renderDeptBarChart = function () {
    const container = document.getElementById('plr-dept-bar-chart-container');
    const filterContainer = document.getElementById('plr-dept-quick-filters');
    if (!container) return;

    const s = getPlrState();
    const rawDepts = getDeptRecsList();

    if (!rawDepts || rawDepts.length === 0) {
      container.innerHTML = `
        <div class="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
          <i data-lucide="inbox" class="w-8 h-8 mb-1.5 opacity-60"></i>
          <span>No recommendation records matching the active filter criteria.</span>
        </div>
      `;
      if (filterContainer) filterContainer.innerHTML = '';
      return;
    }

    // Direct authentic Column F departments across the entire chart (No "Other Depts" grouping)
    const chartDepts = rawDepts;

    const peak = Math.max(...chartDepts.map(d => Math.max(d.total, d.closed, d.open)), 1);
    const maxVal = Math.ceil(peak / 20) * 20 || 20;

    const w = 960;
    const h = 330;
    const pad = { top: 32, right: 28, bottom: 125, left: 48 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;
    const yBase = pad.top + chartH;
    const step = chartW / chartDepts.length;

    // Y Axis Grid lines (4 to 5 ticks)
    const tickCount = 4;
    const yTicks = [];
    for (let i = 0; i <= tickCount; i++) {
      yTicks.push(Math.round((maxVal / tickCount) * i));
    }
    const gridSvg = yTicks.map(val => {
      const y = pad.top + chartH - (val / maxVal) * chartH;
      return `
        <line x1="${pad.left}" y1="${y}" x2="${w - pad.right}" y2="${y}" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="3 3"/>
        <text x="${pad.left - 8}" y="${y + 3}" fill="#64748b" font-size="9" font-family="monospace" text-anchor="end">${val}</text>
      `;
    }).join('');

    const baselineSvg = `
      <line x1="${pad.left}" y1="${yBase}" x2="${w - pad.right}" y2="${yBase}" stroke="#cbd5e1" stroke-width="1.5"/>
    `;

    let contentSvg = '';

    if (s.recChartMode === 'trend') {
      // Trend lines with Area Fill using smooth Bezier curves
      const pointsTotal = [];
      const pointsClosed = [];
      const pointsOpen = [];

      chartDepts.forEach((d, i) => {
        const cx = pad.left + i * step + step / 2;
        const cyTotal = pad.top + chartH - (d.total / maxVal) * chartH;
        const cyClosed = pad.top + chartH - (d.closed / maxVal) * chartH;
        const cyOpen = pad.top + chartH - (d.open / maxVal) * chartH;
        pointsTotal.push({ x: cx, y: cyTotal, dept: d });
        pointsClosed.push({ x: cx, y: cyClosed, dept: d });
        pointsOpen.push({ x: cx, y: cyOpen, dept: d });
      });

      const getSmoothPath = (pts) => {
        if (!pts.length) return '';
        let p = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[i];
          const p1 = pts[i + 1];
          const cpX = (p0.x + p1.x) / 2;
          p += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
        }
        return p;
      };

      const pathTotal = getSmoothPath(pointsTotal);
      const pathClosed = getSmoothPath(pointsClosed);
      const pathOpen = getSmoothPath(pointsOpen);

      const areaTotal = pathTotal + ` L ${pointsTotal[pointsTotal.length - 1].x} ${yBase} L ${pointsTotal[0].x} ${yBase} Z`;
      const areaClosed = pathClosed + ` L ${pointsClosed[pointsClosed.length - 1].x} ${yBase} L ${pointsClosed[0].x} ${yBase} Z`;
      const areaOpen = pathOpen + ` L ${pointsOpen[pointsOpen.length - 1].x} ${yBase} L ${pointsOpen[0].x} ${yBase} Z`;

      const defs = `
        <defs>
          <linearGradient id="plrDeptGradTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2E6DA4" stop-opacity="0.22"/>
            <stop offset="100%" stop-color="#2E6DA4" stop-opacity="0.01"/>
          </linearGradient>
          <linearGradient id="plrDeptGradClosed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#047857" stop-opacity="0.28"/>
            <stop offset="100%" stop-color="#047857" stop-opacity="0.02"/>
          </linearGradient>
          <linearGradient id="plrDeptGradOpen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#B91C1C" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#B91C1C" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
      `;

      const nodesSvg = chartDepts.map((d, i) => {
        const ptT = pointsTotal[i];
        const ptC = pointsClosed[i];
        const ptO = pointsOpen[i];
        const isSelected = s.recSelectedEntity === d.name;
        const clickHandler = d.isGroup ? "portalApp.filterRecByDeptDirect('all')" : `portalApp.filterRecByDeptDirect('${d.name.replace(/'/g, "\\'")}')`;
        const labelY = yBase + 12;
        const cleanName = formatDeptLabel(d.name);

        return `
          <g class="cursor-pointer group" onclick="${clickHandler}">
            <title>${d.name}&#10;Total: ${d.total} Recs&#10;Closed: ${d.closed}&#10;Open: ${d.open}</title>
            <!-- Vertical guide line on hover -->
            <line x1="${ptT.x}" y1="${pad.top}" x2="${ptT.x}" y2="${yBase}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2" class="opacity-0 group-hover:opacity-100 transition-opacity"/>
            
            <!-- Closed Marker & Value -->
            <circle cx="${ptC.x}" cy="${ptC.y}" r="4.5" fill="#047857" stroke="#ffffff" stroke-width="1.5" class="transition-transform group-hover:scale-125"/>
            <text x="${ptC.x}" y="${ptC.y - 7}" fill="#047857" font-size="8.5" font-weight="bold" font-family="monospace" text-anchor="middle">${d.closed}</text>
            
            <!-- Open Marker & Value (with warning ring if > 0) -->
            ${d.open > 0 ? `
              <circle cx="${ptO.x}" cy="${ptO.y}" r="6.5" fill="none" stroke="#B91C1C" stroke-width="1.5" opacity="0.6"/>
              <circle cx="${ptO.x}" cy="${ptO.y}" r="3.5" fill="#B91C1C" stroke="#ffffff" stroke-width="1"/>
              <text x="${ptO.x}" y="${ptO.y - 7}" fill="#B91C1C" font-size="8.5" font-weight="bold" font-family="monospace" text-anchor="middle">${d.open}</text>
            ` : ''}

            <!-- Total Marker on Top -->
            <circle cx="${ptT.x}" cy="${ptT.y}" r="5" fill="#2E6DA4" stroke="#ffffff" stroke-width="2" class="transition-transform group-hover:scale-125"/>
            
            <!-- Total count label -->
            <text x="${ptT.x}" y="${ptT.y - 8}" fill="#0f172a" font-size="9" font-weight="900" font-family="monospace" text-anchor="middle">${d.total}</text>

            <!-- Baseline tick mark -->
            <line x1="${ptT.x}" y1="${yBase}" x2="${ptT.x}" y2="${yBase + 5}" stroke="#cbd5e1" stroke-width="1.5"/>
            
            <!-- X Axis Label (Exact Column F Department) -->
            <text
              x="${ptT.x}"
              y="${labelY}"
              fill="${isSelected ? '#1e40af' : '#475569'}"
              font-size="8.5"
              font-weight="${isSelected ? '900' : '600'}"
              text-anchor="end"
              transform="rotate(-52, ${ptT.x}, ${labelY})"
              class="group-hover:fill-[#1e40af] transition-colors"
            >${cleanName}<title>${d.name} (${d.total} Recs)</title></text>
          </g>
        `;
      }).join('');

      contentSvg = `
        ${defs}
        <path d="${areaTotal}" fill="url(#plrDeptGradTotal)"/>
        <path d="${areaClosed}" fill="url(#plrDeptGradClosed)"/>
        <path d="${areaOpen}" fill="url(#plrDeptGradOpen)"/>
        <path d="${pathTotal}" fill="none" stroke="#2E6DA4" stroke-width="2" stroke-dasharray="4 3"/>
        <path d="${pathClosed}" fill="none" stroke="#047857" stroke-width="2.5"/>
        <path d="${pathOpen}" fill="none" stroke="#B91C1C" stroke-width="2.5"/>
        ${nodesSvg}
      `;
    } else if (s.recChartMode === 'side-by-side') {
      const groupW = Math.min(36, Math.max(20, step * 0.7));
      const gap = 3;
      const subW = (groupW - gap) / 2;

      contentSvg = chartDepts.map((d, i) => {
        const xCenter = pad.left + i * step + step / 2;
        const xStart = xCenter - groupW / 2;
        const xClosed = xStart;
        const xOpen = xStart + subW + gap;

        const openH = (d.open / maxVal) * chartH;
        const closedH = (d.closed / maxVal) * chartH;
        const yClosed = yBase - closedH;
        const yOpen = yBase - openH;

        const isSelected = s.recSelectedEntity === d.name;
        const clickHandler = `portalApp.filterRecByDeptDirect('${d.name.replace(/'/g, "\\'")}')`;

        const labelY = yBase + 12;
        const cleanName = formatDeptLabel(d.name);

        const yClosedVal = d.closed > 0 ? yClosed - 5 : yBase - 5;
        const yOpenVal = d.open > 0 ? yOpen - 5 : yBase - 5;
        const highestValY = Math.min(yClosedVal, yOpenVal);

        return `
          <g class="cursor-pointer group" onclick="${clickHandler}">
            <title>${d.name}&#10;Total: ${d.total} Recs&#10;Closed: ${d.closed} (${d.total > 0 ? ((d.closed/d.total)*100).toFixed(0) : 0}%)&#10;Open: ${d.open}</title>
            
            <!-- Hover column highlight -->
            <rect x="${xStart - 4}" y="${pad.top}" width="${groupW + 8}" height="${chartH}" fill="#f8fafc" rx="4" class="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>

            <!-- Closed Bar (Emerald) -->
            ${d.closed > 0 ? `
              <rect
                x="${xClosed}"
                y="${yClosed}"
                width="${subW}"
                height="${Math.max(closedH, 2)}"
                fill="#10b981"
                rx="2"
                class="transition-all group-hover:fill-[#059669]"
              />
            ` : `
              <rect x="${xClosed}" y="${yBase - 2}" width="${subW}" height="2" fill="#cbd5e1" rx="1"/>
            `}

            <!-- Open Bar (Rose) -->
            ${d.open > 0 ? `
              <rect
                x="${xOpen}"
                y="${yOpen}"
                width="${subW}"
                height="${Math.max(openH, 2)}"
                fill="#f43f5e"
                rx="2"
                class="transition-all group-hover:fill-[#e11d48]"
              />
            ` : `
              <rect x="${xOpen}" y="${yBase - 2}" width="${subW}" height="2" fill="#e2e8f0" rx="1"/>
            `}

            <!-- Value for Closed Bar (Emerald) -->
            <text
              x="${xClosed + subW / 2}"
              y="${yClosedVal}"
              fill="${d.closed > 0 ? '#047857' : '#94a3b8'}"
              font-size="8"
              font-weight="900"
              font-family="monospace"
              text-anchor="middle"
            >${d.closed}</text>

            <!-- Value for Open Bar (Red) -->
            <text
              x="${xOpen + subW / 2}"
              y="${yOpenVal}"
              fill="${d.open > 0 ? '#b91c1c' : '#94a3b8'}"
              font-size="8"
              font-weight="900"
              font-family="monospace"
              text-anchor="middle"
            >${d.open}</text>

            <!-- Total indicator above pair -->
            <text
              x="${xCenter}"
              y="${highestValY - 8}"
              fill="#0f172a"
              font-size="8.5"
              font-weight="bold"
              font-family="monospace"
              text-anchor="middle"
            >${d.total}</text>

            <!-- Baseline tick mark -->
            <line x1="${xCenter}" y1="${yBase}" x2="${xCenter}" y2="${yBase + 5}" stroke="#cbd5e1" stroke-width="1.5"/>

            <!-- X Axis Label (Exact Column F Department) -->
            <text
              x="${xCenter}"
              y="${labelY}"
              fill="${isSelected ? '#1e40af' : '#475569'}"
              font-size="8.5"
              font-weight="${isSelected ? '900' : '600'}"
              text-anchor="end"
              transform="rotate(-52, ${xCenter}, ${labelY})"
              class="group-hover:fill-[#1e40af] transition-colors"
            >${cleanName}<title>${d.name} (${d.total} Recs)</title></text>
          </g>
        `;
      }).join('');
    } else {
      // Default: Stacked Bar Chart
      const barWidth = Math.min(26, Math.max(16, step * 0.55));
      contentSvg = chartDepts.map((d, i) => {
        const xCenter = pad.left + i * step + step / 2;
        const x = xCenter - barWidth / 2;
        const totalH = (d.total / maxVal) * chartH;
        const openH = (d.open / maxVal) * chartH;
        const closedH = (d.closed / maxVal) * chartH;
        const yClosed = yBase - closedH;
        const yOpen = yClosed - openH;
        const isSelected = s.recSelectedEntity === d.name;
        const clickHandler = `portalApp.filterRecByDeptDirect('${d.name.replace(/'/g, "\\'")}')`;

        const labelY = yBase + 12;
        const cleanName = formatDeptLabel(d.name);

        return `
          <g class="cursor-pointer group" onclick="${clickHandler}">
            <title>${d.name}&#10;Total: ${d.total} Recs&#10;Closed: ${d.closed}&#10;Open: ${d.open}</title>
            <!-- Closed Bar (Emerald) -->
            <rect
              x="${x}"
              y="${yClosed}"
              width="${barWidth}"
              height="${closedH}"
              fill="#10b981"
              rx="3"
              class="transition-opacity group-hover:opacity-85"
            />
            <!-- Open Bar (Rose) -->
            ${d.open > 0 ? `
              <rect
                x="${x}"
                y="${yOpen}"
                width="${barWidth}"
                height="${openH}"
                fill="#f43f5e"
                rx="3"
                class="transition-opacity group-hover:opacity-85"
              />
            ` : ''}
            <!-- Label on Top -->
            <text x="${xCenter}" y="${yOpen - 5}" fill="#0f172a" font-size="9" font-weight="900" font-family="monospace" text-anchor="middle">${d.total}</text>
            <!-- Value inside closed bar if enough room -->
            ${closedH > 18 ? `
              <text x="${xCenter}" y="${yClosed + closedH / 2 + 3}" fill="#ffffff" font-size="8" font-weight="bold" font-family="monospace" text-anchor="middle">${d.closed}</text>
            ` : ''}
            <!-- Value inside open bar if enough room -->
            ${openH > 12 ? `
              <text x="${xCenter}" y="${yOpen + openH / 2 + 3}" fill="#ffffff" font-size="8" font-weight="bold" font-family="monospace" text-anchor="middle">${d.open}</text>
            ` : ''}
            <!-- Baseline tick -->
            <line x1="${xCenter}" y1="${yBase}" x2="${xCenter}" y2="${yBase + 5}" stroke="#cbd5e1" stroke-width="1.5"/>
            <!-- X-Axis Label (Exact Column F Department) -->
            <text
              x="${xCenter}"
              y="${labelY}"
              fill="${isSelected ? '#2E6DA4' : '#475569'}"
              font-size="8.5"
              font-weight="${isSelected ? '900' : '600'}"
              text-anchor="end"
              transform="rotate(-52, ${xCenter}, ${labelY})"
              class="group-hover:fill-[#2E6DA4] transition-colors"
            >${cleanName}<title>${d.name} (${d.total} Recs)</title></text>
          </g>
        `;
      }).join('');
    }

    container.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" class="w-full h-auto select-none overflow-hidden">
        ${gridSvg}
        ${baselineSvg}
        ${contentSvg}
      </svg>
    `;

    // Quick Filter Pills (Displaying all departments dynamically from active dataset)
    if (filterContainer) {
      filterContainer.innerHTML = rawDepts.map(d => {
        const isSel = s.recSelectedEntity === d.name;
        return `
          <button
            onclick="portalApp.filterRecByDeptDirect('${d.name.replace(/'/g, "\\'")}')"
            class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              isSel
                ? 'bg-[#2E6DA4] text-white border-[#2E6DA4] font-black shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }"
          >
            <span>${d.name}</span>
            <span class="font-mono text-[11px] text-rose-600 font-bold">(${d.open} Open</span>
            <span class="font-mono text-[11px] text-emerald-700 font-bold">/${d.closed} Closed)</span>
          </button>
        `;
      }).join('') + (s.recSelectedEntity !== 'all' ? `
        <button
          onclick="portalApp.filterRecByDeptDirect('all')"
          class="px-2.5 py-1 rounded-lg text-xs font-bold text-[#2E6DA4] bg-white hover:bg-slate-50 border border-[#2E6DA4] cursor-pointer"
        >
          Clear Dept Filter
        </button>
      ` : '');
    }
  };

  /**
   * 3. Overall Incident Resolution Pie Chart (Executive corporate styling, darker tones, large clear readable numbers)
   */
  portalApp.renderResolutionPie = function () {
    const container = document.getElementById('plr-resolution-pie-container');
    if (!container) return;

    const closed = 206; // 88%
    const open = 27;    // 12%
    const total = closed + open; // 233

    const r = 96;
    const cx = 130;
    const cy = 130;

    // Closed slice: 88% = 318.2 degrees
    // Open slice: 12% = 43.2 degrees
    const closedAngle = (closed / total) * 2 * Math.PI;
    const startAngle = -Math.PI / 2;
    const endClosed = startAngle + closedAngle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endClosed);
    const y2 = cy + r * Math.sin(endClosed);

    const dClosed = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 1 1 ${x2} ${y2} Z`;
    const dOpen = `M ${cx} ${cy} L ${x2} ${y2} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`;

    // Midpoints for labels
    // Closed slice (88%): midClosed points comfortably into the bottom-right quadrant
    const midClosed = startAngle + closedAngle / 2;
    const lxClosed = cx + (r * 0.52) * Math.cos(midClosed);
    const lyClosed = cy + (r * 0.52) * Math.sin(midClosed);

    // Open slice (12%): midOpen points into the top-left quadrant
    const midOpen = endClosed + ((2 * Math.PI - closedAngle) / 2);
    const lxOpen = cx + (r * 0.72) * Math.cos(midOpen);
    const lyOpen = cy + (r * 0.72) * Math.sin(midOpen);

    // Professional darker colors:
    const darkClosedColor = '#047857'; // Deep dark corporate emerald
    const darkOpenColor = '#B91C1C';   // Deep dark rich crimson

    container.innerHTML = `
      <div class="relative w-[260px] h-[260px]">
        <svg viewBox="0 0 260 260" class="w-full h-full select-none filter drop-shadow-sm">
          <defs>
            <filter id="plrTextShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.45"/>
            </filter>
          </defs>

          <!-- Closed Slice (Deep Dark Emerald) -->
          <path
            d="${dClosed}"
            fill="${darkClosedColor}"
            class="cursor-pointer transition-all hover:brightness-110"
            onclick="portalApp.filterPlrByStatus('Closed')"
          >
            <title>Closed: ${closed} Outages (88%)</title>
          </path>

          <!-- Open Slice (Deep Dark Crimson) -->
          <path
            d="${dOpen}"
            fill="${darkOpenColor}"
            class="cursor-pointer transition-all hover:brightness-110"
            onclick="portalApp.filterPlrByStatus('Open')"
          >
            <title>Open: ${open} Outages (12%)</title>
          </path>

          <!-- Clean White Slices Divider Lines -->
          <line x1="${cx}" y1="${cy}" x2="${x1}" y2="${y1}" stroke="#ffffff" stroke-width="2.5"/>
          <line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#ffffff" stroke-width="2.5"/>
          
          <!-- Closed slice labels: Large, bold, highly legible font -->
          <text
            x="${lxClosed}"
            y="${lyClosed - 6}"
            fill="#ffffff"
            font-size="24"
            font-weight="900"
            font-family="'Plus Jakarta Sans', system-ui, sans-serif"
            text-anchor="middle"
            filter="url(#plrTextShadow)"
            class="select-none"
          >${closed}</text>
          <text
            x="${lxClosed}"
            y="${lyClosed + 12}"
            fill="#E2E8F0"
            font-size="13"
            font-weight="700"
            font-family="'Plus Jakarta Sans', system-ui, sans-serif"
            text-anchor="middle"
            filter="url(#plrTextShadow)"
            class="select-none tracking-wide"
          >88% Closed</text>
          
          <!-- Open slice labels: Large, clear, highly legible font -->
          <text
            x="${lxOpen}"
            y="${lyOpen - 5}"
            fill="#ffffff"
            font-size="19"
            font-weight="900"
            font-family="'Plus Jakarta Sans', system-ui, sans-serif"
            text-anchor="middle"
            filter="url(#plrTextShadow)"
            class="select-none"
          >${open}</text>
          <text
            x="${lxOpen}"
            y="${lyOpen + 11}"
            fill="#FEE2E2"
            font-size="11.5"
            font-weight="700"
            font-family="'Plus Jakarta Sans', system-ui, sans-serif"
            text-anchor="middle"
            filter="url(#plrTextShadow)"
            class="select-none tracking-wide"
          >12% Open</text>
        </svg>
      </div>
    `;
  };

  /**
   * 4a. Assigned Recommendations Trends Chart (Supports Side-by-Side Bars and Executive Trend Lines)
   */
  portalApp.renderAssignedTrendChart = function () {
    const container = document.getElementById('plr-assigned-trend-chart-container');
    if (!container) return;

    const s = getPlrState();

    const w = 960;
    const h = 330;
    const pad = { top: 32, right: 30, bottom: 125, left: 48 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;
    const baseY = pad.top + chartH;

    let items = [];
    const isYearly = s.assignedTrendMode === 'yearly';

    if (isYearly) {
      items = getYearlyRecsList();
    } else {
      const allEntities = getEntityAnalyticsList();
      // Directly map all distinct Column F entities - no "Other Entities" grouping
      items = allEntities.map(e => ({ label: e.name, total: e.items, closed: e.closed, open: e.open, raw: e.name }));
    }

    if (!items.length) {
      container.innerHTML = `
        <div class="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
          <i data-lucide="inbox" class="w-8 h-8 mb-1.5 opacity-60"></i>
          <span>No trend data available for current selection.</span>
        </div>
      `;
      return;
    }

    const peak = Math.max(...items.map(d => Math.max(d.total, d.closed, d.open)), 1);
    const maxVal = Math.ceil(peak / 20) * 20 || 20;

    // Y Axis Grid lines
    const tickCount = 4;
    const yTicks = [];
    for (let i = 0; i <= tickCount; i++) {
      yTicks.push(Math.round((maxVal / tickCount) * i));
    }

    const gridSvg = yTicks.map(val => {
      const y = pad.top + chartH - (val / maxVal) * chartH;
      return `
        <line x1="${pad.left}" y1="${y}" x2="${w - pad.right}" y2="${y}" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="3 3"/>
        <text x="${pad.left - 8}" y="${y + 3}" fill="#64748b" font-size="9" font-family="monospace" text-anchor="end">${val}</text>
      `;
    }).join('');

    const baselineSvg = `
      <line x1="${pad.left}" y1="${baseY}" x2="${w - pad.right}" y2="${baseY}" stroke="#cbd5e1" stroke-width="1.5"/>
    `;

    const step = chartW / items.length;

    let contentSvg = '';

    if (s.assignedTrendViewType === 'side-by-side') {
      const groupW = isYearly ? Math.min(50, Math.max(28, step * 0.65)) : Math.min(36, Math.max(20, step * 0.7));
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

        const labelText = isYearly ? d.year : d.label;
        const cleanName = isYearly ? d.year : formatDeptLabel(d.label);
        const isSelected = isYearly ? (s.selectedYear === d.year) : (s.recSelectedEntity === d.raw);
        const clickHandler = isYearly
          ? `portalApp.handlePlrYearChange('${d.year}')`
          : `portalApp.filterRecByDeptDirect('${(d.raw || '').replace(/'/g, "\\'")}')`;

        const resPct = d.total > 0 ? ((d.closed / d.total) * 100).toFixed(0) : 0;
        const labelY = baseY + 12;

        const yClosedVal = d.closed > 0 ? yClosed - 5 : baseY - 5;
        const yOpenVal = d.open > 0 ? yOpen - 5 : baseY - 5;
        const highestValY = Math.min(yClosedVal, yOpenVal);

        return `
          <g class="cursor-pointer group" onclick="${clickHandler}">
            <title>${labelText}&#10;Total: ${d.total} Recs&#10;Closed: ${d.closed} (${resPct}%)&#10;Open: ${d.open}</title>
            
            <!-- Hover column highlight -->
            <rect x="${xStart - 4}" y="${pad.top}" width="${groupW + 8}" height="${chartH}" fill="#f8fafc" rx="4" class="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>

            <!-- Closed Bar (Emerald) -->
            ${d.closed > 0 ? `
              <rect
                x="${xClosed}"
                y="${yClosed}"
                width="${subW}"
                height="${Math.max(closedH, 2)}"
                fill="#10b981"
                rx="2"
                class="transition-all group-hover:fill-[#059669]"
              />
            ` : `
              <rect x="${xClosed}" y="${baseY - 2}" width="${subW}" height="2" fill="#cbd5e1" rx="1"/>
            `}

            <!-- Open Bar (Rose) -->
            ${d.open > 0 ? `
              <rect
                x="${xOpen}"
                y="${yOpen}"
                width="${subW}"
                height="${Math.max(openH, 2)}"
                fill="#f43f5e"
                rx="2"
                class="transition-all group-hover:fill-[#e11d48]"
              />
            ` : `
              <rect x="${xOpen}" y="${baseY - 2}" width="${subW}" height="2" fill="#e2e8f0" rx="1"/>
            `}

            <!-- Value for Closed Bar (Emerald) -->
            <text
              x="${xClosed + subW / 2}"
              y="${yClosedVal}"
              fill="${d.closed > 0 ? '#047857' : '#94a3b8'}"
              font-size="8"
              font-weight="900"
              font-family="monospace"
              text-anchor="middle"
            >${d.closed}</text>

            <!-- Value for Open Bar (Red) -->
            <text
              x="${xOpen + subW / 2}"
              y="${yOpenVal}"
              fill="${d.open > 0 ? '#b91c1c' : '#94a3b8'}"
              font-size="8"
              font-weight="900"
              font-family="monospace"
              text-anchor="middle"
            >${d.open}</text>

            <!-- Total indicator above pair -->
            <text
              x="${xCenter}"
              y="${highestValY - 8}"
              fill="#0f172a"
              font-size="8.5"
              font-weight="bold"
              font-family="monospace"
              text-anchor="middle"
            >${d.total}</text>

            <!-- Baseline tick mark -->
            <line x1="${xCenter}" y1="${baseY}" x2="${xCenter}" y2="${baseY + 5}" stroke="#cbd5e1" stroke-width="1.5"/>

            <!-- X Axis Label (Never merges with text below) -->
            <text
              x="${xCenter}"
              y="${labelY}"
              fill="${isSelected ? '#1e40af' : '#475569'}"
              font-size="8.5"
              font-weight="${isSelected ? '900' : '600'}"
              text-anchor="${isYearly ? 'middle' : 'end'}"
              ${isYearly ? '' : `transform="rotate(-52, ${xCenter}, ${labelY})"`}
              class="group-hover:fill-[#1e40af] transition-colors"
            >${cleanName}<title>${labelText} (${d.total} Recs)</title></text>
          </g>
        `;
      }).join('');
    } else {
      // Trend lines mode
      const pointsClosed = [];
      const pointsOpen = [];
      const pointsTotal = [];

      items.forEach((d, i) => {
        const cx = pad.left + i * step + step / 2;
        const cyClosed = pad.top + chartH - (d.closed / maxVal) * chartH;
        const cyOpen = pad.top + chartH - (d.open / maxVal) * chartH;
        const cyTotal = pad.top + chartH - (d.total / maxVal) * chartH;
        pointsClosed.push({ x: cx, y: cyClosed, item: d });
        pointsOpen.push({ x: cx, y: cyOpen, item: d });
        pointsTotal.push({ x: cx, y: cyTotal, item: d });
      });

      const getSmoothPath = (pts) => {
        if (!pts.length) return '';
        let p = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[i];
          const p1 = pts[i + 1];
          const cpX = (p0.x + p1.x) / 2;
          p += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
        }
        return p;
      };

      const pathClosed = getSmoothPath(pointsClosed);
      const pathOpen = getSmoothPath(pointsOpen);
      const pathTotal = getSmoothPath(pointsTotal);

      const areaClosed = pathClosed + ` L ${pointsClosed[pointsClosed.length - 1].x} ${baseY} L ${pointsClosed[0].x} ${baseY} Z`;
      const areaOpen = pathOpen + ` L ${pointsOpen[pointsOpen.length - 1].x} ${baseY} L ${pointsOpen[0].x} ${baseY} Z`;

      const nodesSvg = items.map((d, i) => {
        const ptC = pointsClosed[i];
        const ptO = pointsOpen[i];
        const ptT = pointsTotal[i];

        const labelText = isYearly ? d.year : d.label;
        const cleanName = isYearly ? d.year : formatDeptLabel(d.label);
        const isSelected = isYearly ? (s.selectedYear === d.year) : (s.recSelectedEntity === d.raw);
        const clickHandler = isYearly
          ? `portalApp.handlePlrYearChange('${d.year}')`
          : `portalApp.filterRecByDeptDirect('${(d.raw || '').replace(/'/g, "\\'")}')`;

        const resPct = d.total > 0 ? ((d.closed / d.total) * 100).toFixed(0) : 0;
        const labelY = baseY + 12;

        return `
          <g class="cursor-pointer group" onclick="${clickHandler}">
            <title>${labelText}&#10;Total: ${d.total} Recs&#10;Closed: ${d.closed} (${resPct}%)&#10;Open: ${d.open}</title>
            
            <!-- Hover guide line -->
            <line x1="${ptC.x}" y1="${pad.top}" x2="${ptC.x}" y2="${baseY}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="2 2" class="opacity-0 group-hover:opacity-100 transition-opacity"/>
            
            <!-- Closed Node (Emerald) & Value -->
            <circle cx="${ptC.x}" cy="${ptC.y}" r="4.5" fill="#047857" stroke="#ffffff" stroke-width="2" class="transition-transform group-hover:scale-125"/>
            <text x="${ptC.x}" y="${ptC.y - 7}" fill="#047857" font-size="8.5" font-weight="bold" font-family="monospace" text-anchor="middle">${d.closed}</text>
            
            <!-- Open Node (Crimson) & Value -->
            ${d.open > 0 ? `
              <circle cx="${ptO.x}" cy="${ptO.y}" r="6.5" fill="none" stroke="#B91C1C" stroke-width="1.5" opacity="0.6"/>
              <circle cx="${ptO.x}" cy="${ptO.y}" r="3.5" fill="#B91C1C" stroke="#ffffff" stroke-width="1.5"/>
              <text x="${ptO.x}" y="${ptO.y - 7}" fill="#B91C1C" font-size="8.5" font-weight="bold" font-family="monospace" text-anchor="middle">${d.open}</text>
            ` : ''}

            <!-- Total Callout Label on Top -->
            <text x="${ptT.x}" y="${ptT.y - 8}" fill="#0f172a" font-size="9" font-weight="900" font-family="monospace" text-anchor="middle">${d.total}</text>
            
            <!-- Baseline tick mark -->
            <line x1="${ptC.x}" y1="${baseY}" x2="${ptC.x}" y2="${baseY + 5}" stroke="#cbd5e1" stroke-width="1.5"/>

            <!-- X Axis Label (Never merges with text below) -->
            <text
              x="${ptC.x}"
              y="${labelY}"
              fill="${isSelected ? '#1e40af' : '#475569'}"
              font-size="8.5"
              font-weight="${isSelected ? '900' : '600'}"
              text-anchor="${isYearly ? 'middle' : 'end'}"
              ${isYearly ? '' : `transform="rotate(-52, ${ptC.x}, ${labelY})"`}
              class="group-hover:fill-[#1e40af] transition-colors"
            >${cleanName}<title>${labelText} (${d.total} Recs)</title></text>
          </g>
        `;
      }).join('');

      contentSvg = `
        <defs>
          <linearGradient id="plrAssignedGradClosed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#047857" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#047857" stop-opacity="0.01"/>
          </linearGradient>
          <linearGradient id="plrAssignedGradOpen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#B91C1C" stop-opacity="0.22"/>
            <stop offset="100%" stop-color="#B91C1C" stop-opacity="0.01"/>
          </linearGradient>
        </defs>
        <path d="${areaClosed}" fill="url(#plrAssignedGradClosed)"/>
        <path d="${areaOpen}" fill="url(#plrAssignedGradOpen)"/>
        <path d="${pathTotal}" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
        <path d="${pathClosed}" fill="none" stroke="#047857" stroke-width="2.5"/>
        <path d="${pathOpen}" fill="none" stroke="#B91C1C" stroke-width="2.5"/>
        ${nodesSvg}
      `;
    }

    container.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" class="w-full h-auto select-none overflow-hidden">
        ${gridSvg}
        ${baselineSvg}
        ${contentSvg}
      </svg>
    `;
  };

  /**
   * Toggle between Entity trend and Yearly trend
   */
  portalApp.setAssignedTrendMode = function (mode) {
    const s = getPlrState();
    s.assignedTrendMode = mode;
    portalApp.renderAssignedTrendChart();
    const btnEntity = document.getElementById('plr-assigned-mode-entity');
    const btnYearly = document.getElementById('plr-assigned-mode-yearly');
    if (btnEntity && btnYearly) {
      if (mode === 'entity') {
        btnEntity.className = 'px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer bg-[#2E6DA4] text-white shadow-xs';
        btnYearly.className = 'px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer text-slate-600 hover:text-slate-900';
      } else {
        btnEntity.className = 'px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer text-slate-600 hover:text-slate-900';
        btnYearly.className = 'px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer bg-[#2E6DA4] text-white shadow-xs';
      }
    }
  };

  /**
   * Toggle between Side-by-Side bars and Trend Lines for Assigned Recommendations
   */
  portalApp.setAssignedTrendViewType = function (viewType) {
    const s = getPlrState();
    s.assignedTrendViewType = viewType;
    portalApp.renderAssignedTrendChart();
    const btnBars = document.getElementById('plr-assigned-view-bars');
    const btnTrend = document.getElementById('plr-assigned-view-trend');
    if (btnBars && btnTrend) {
      if (viewType === 'side-by-side') {
        btnBars.className = 'px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer bg-[#2E6DA4] text-white shadow-xs';
        btnTrend.className = 'px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer text-slate-600 hover:text-slate-900';
      } else {
        btnBars.className = 'px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer text-slate-600 hover:text-slate-900';
        btnTrend.className = 'px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer bg-[#2E6DA4] text-white shadow-xs';
      }
    }
  };

  /**
   * 4b. Assigned Recommendations Trend: Chips & Bento Cards (Dynamic entities from Recommendations tab Column F)
   */
  portalApp.renderEntityChipsAndBento = function () {
    const chipsContainer = document.getElementById('plr-entity-chips-container');
    const bentoContainer = document.getElementById('plr-bento-cards-container');
    if (!chipsContainer || !bentoContainer) return;

    const s = getPlrState();

    // Data dynamically calculated from action entities in recommendations:
    const entityList = getEntityAnalyticsList();

    // Chips at the top (Non-scrollable flex wrap, completely visible across page area)
    chipsContainer.innerHTML = entityList.map(e => {
      const isSel = s.recSelectedEntity === e.name;
      return `
        <button
          onclick="portalApp.filterRecByDeptDirect('${e.name.replace(/'/g, "\\'")}')"
          class="px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
            isSel
              ? 'bg-[#1e40af] text-white border-[#1e40af] font-black shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }"
        >
          <span>${e.name}</span>
          ${e.open > 0 ? `
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-red-100 text-[#B91C1C]">
              ${e.open} open
            </span>
          ` : `
            <span class="w-3.5 h-3.5 rounded-full bg-emerald-100 text-[#047857] flex items-center justify-center text-[9px] font-bold">✓</span>
          `}
        </button>
      `;
    }).join('') + (s.recSelectedEntity !== 'all' ? `
      <button
        onclick="portalApp.filterRecByDeptDirect('all')"
        class="px-3 py-1 rounded-full text-xs font-bold text-[#1e40af] bg-white hover:bg-slate-50 border border-[#1e40af] cursor-pointer"
      >
        Clear Filter
      </button>
    ` : '');

    // Bento Grid Cards (All distinct Column F entities displayed in 4-column responsive grid covering the page area)
    bentoContainer.innerHTML = entityList.map(e => {
      const isSel = s.recSelectedEntity === e.name;
      const openPct = e.items > 0 ? ((e.open / e.items) * 100).toFixed(0) : 0;
      const closedPct = 100 - openPct;

      return `
        <div
          onclick="portalApp.filterRecByDeptDirect('${e.name.replace(/'/g, "\\'")}')"
          class="bg-white hover:bg-slate-50 border ${
            isSel ? 'border-[#1e40af] ring-1 ring-[#1e40af] bg-blue-50/20' : 'border-slate-200'
          } rounded-xl p-3.5 shadow-xs space-y-2.5 transition-all cursor-pointer group"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-bold text-slate-900 truncate group-hover:text-[#1e40af] transition-colors">${e.name}</span>
            <span class="text-[11px] font-sans text-slate-500 shrink-0 font-semibold">${e.items} items</span>
          </div>
          
          <!-- Split Progress Bar (Darker tones: Crimson for Open, Corporate Emerald for Closed) -->
          <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
            ${e.open > 0 ? `<div class="h-full bg-[#B91C1C]" style="width: ${openPct}%;"></div>` : ''}
            <div class="h-full bg-[#047857]" style="width: ${closedPct}%;"></div>
          </div>

          <div class="flex items-center justify-between text-[11px] font-sans font-bold pt-0.5">
            <span class="flex items-center gap-1 ${e.open > 0 ? 'text-[#B91C1C]' : 'text-slate-400'}">
              <span class="w-1.5 h-1.5 rounded-full ${e.open > 0 ? 'bg-[#B91C1C]' : 'bg-slate-300'}"></span>
              ${e.open} Open
            </span>
            <span class="flex items-center gap-1 text-[#047857]">
              <span class="w-1.5 h-1.5 rounded-full bg-[#047857]"></span>
              ${e.closed} Closed
            </span>
          </div>
        </div>
      `;
    }).join('');
  };

  /**
   * 5. Plant Records & Outage Log Table (Light Theme)
   */
  portalApp.renderTableSection = function () {
    const s = getPlrState();
    const toolbar = document.getElementById('plr-table-toolbar-container');
    const tableBody = document.getElementById('plr-table-body-container');
    const pagination = document.getElementById('plr-pagination-container');
    if (!toolbar || !tableBody) return;

    if (s.activeTab === 'incidents') {
      portalApp.renderIncidentsTable(toolbar, tableBody, pagination);
    } else {
      portalApp.renderRecommendationsTable(toolbar, tableBody, pagination);
    }
  };

  /**
   * Incidents Master Log Table (Light Theme)
   */
  portalApp.renderIncidentsTable = function (toolbar, tableBody, pagination) {
    const s = getPlrState();
    const recsMap = getRecsMapByPlr();

    // Use unified filtered dataset
    const filtered = getFilteredPlrData();

    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / s.pageSize) || 1;
    if (s.page > totalPages) s.page = totalPages;
    const startIdx = (s.page - 1) * s.pageSize;
    const pageItems = filtered.slice(startIdx, startIdx + s.pageSize);

    // Toolbar
    toolbar.innerHTML = `
      <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <!-- Search Input -->
        <div class="relative flex-1 max-w-md">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <i data-lucide="search" class="w-4 h-4"></i>
          </div>
          <input
            type="text"
            value="${s.searchQuery}"
            oninput="portalApp.searchPlr(this.value)"
            placeholder="Search PLR #, incident description, machine, priority.."
            class="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2E6DA4] focus:ring-1 focus:ring-[#2E6DA4]"
          />
          ${s.searchQuery ? `
            <button onclick="portalApp.searchPlr('')" class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          ` : ''}
        </div>

        <!-- Dropdowns & Count -->
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Dept Dropdown -->
          <div class="flex items-center gap-1.5 text-xs text-slate-700">
            <span class="font-bold text-slate-500">DEPT:</span>
            <select
              onchange="portalApp.filterPlrByDept(this.value)"
              class="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#2E6DA4] cursor-pointer"
            >
              ${renderActionEntitySelectOptions(s.selectedDept)}
            </select>
          </div>

          <!-- Status Dropdown -->
          <div class="flex items-center gap-1.5 text-xs text-slate-700">
            <span class="font-bold text-slate-500">STATUS:</span>
            <select
              onchange="portalApp.filterPlrByStatus(this.value)"
              class="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#2E6DA4] cursor-pointer"
            >
              <option value="all" ${s.selectedStatus === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="Closed" ${s.selectedStatus === 'Closed' ? 'selected' : ''}>Closed (206)</option>
              <option value="Open" ${s.selectedStatus === 'Open' ? 'selected' : ''}>Open (27)</option>
            </select>
          </div>

          <span class="text-xs font-mono text-slate-500">Showing <strong class="text-slate-900">${totalFiltered}</strong> records</span>

          <button
            onclick="portalApp.exportPlrCSV()"
            class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <i data-lucide="download" class="w-3.5 h-3.5 text-[#2E6DA4]"></i>
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    `;

    // Table Content matching exact columns:
    // S_NO | PLR # | YEAR | DATE | INCIDENT DESCRIPTION | MACHINE (COL G) | PRIORITY (COL H) | ACTION ENTITY (COL F) | STATUS (COL F) | VIEW
    tableBody.innerHTML = `
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-600">
            <th class="py-3 px-3 w-14 text-center">S_NO</th>
            <th class="py-3 px-3 w-24">PLR #</th>
            <th class="py-3 px-3 w-20">YEAR</th>
            <th class="py-3 px-3 w-28">DATE</th>
            <th class="py-3 px-4 min-w-[320px]">INCIDENT DESCRIPTION</th>
            <th class="py-3 px-3 w-32">MACHINE (COL G)</th>
            <th class="py-3 px-3 w-24">PRIORITY (COL H)</th>
            <th class="py-3 px-3 w-32">ACTION ENTITY (COL F)</th>
            <th class="py-3 px-3 w-28">STATUS (COL F)</th>
            <th class="py-3 px-3 w-16 text-center">VIEW</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium">
          ${pageItems.length === 0 ? `
            <tr>
              <td colspan="10" class="py-8 text-center text-slate-500">
                No incidents match the active filters.
              </td>
            </tr>
          ` : pageItems.map(item => {
            const isOpen = (item.status || '').toLowerCase() === 'open';
            const recList = recsMap.get(String(item.plrNo).toUpperCase()) || [];
            const isHigh = (item.priority || '').toLowerCase() === 'high';

            return `
              <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3 px-3 font-mono text-center text-slate-500">${item.sNo}</td>
                <td class="py-3 px-3 font-mono font-bold">
                  <button
                    onclick="portalApp.openPlrInspectionModal(${item.plrNo})"
                    class="font-mono font-bold text-[#2E6DA4] hover:underline cursor-pointer flex items-center gap-1"
                    title="Inspect incident and ${recList.length} linked recommendations"
                  >
                    #${item.plrNo}
                    ${recList.length > 0 ? `<span class="text-[10px] text-slate-500 font-normal">(${recList.length} recs)</span>` : ''}
                  </button>
                </td>
                <td class="py-3 px-3 font-mono text-slate-600">${item.year}</td>
                <td class="py-3 px-3 font-mono text-slate-600">${item.date}</td>
                <td class="py-3 px-4 text-slate-800 text-xs leading-relaxed max-w-md">${item.incident}</td>
                <td class="py-3 px-3">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    <i data-lucide="cpu" class="w-3 h-3 text-[#2E6DA4]"></i>
                    ${item.machine}
                  </span>
                </td>
                <td class="py-3 px-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                    isHigh
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }">
                    ${item.priority || 'Low'}
                  </span>
                </td>
                <td class="py-3 px-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    ${item.dept || 'KE'}
                  </span>
                </td>
                <td class="py-3 px-3">
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    isOpen
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }">
                    <i data-lucide="${isOpen ? 'alert-circle' : 'check-circle-2'}" class="w-3 h-3"></i>
                    ${item.status}
                  </span>
                </td>
                <td class="py-3 px-3 text-center">
                  <button
                    onclick="portalApp.openPlrInspectionModal(${item.plrNo})"
                    class="p-1.5 rounded-lg text-slate-500 hover:text-[#2E6DA4] hover:bg-blue-50 transition-colors cursor-pointer"
                    title="View details & cross-sheet recommendations"
                  >
                    <i data-lucide="eye" class="w-4 h-4"></i>
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    // Pagination
    if (pagination) {
      pagination.innerHTML = `
        <div class="flex items-center gap-2">
          <span>Page <strong class="text-slate-900">${s.page}</strong> of <strong class="text-slate-900">${totalPages}</strong></span>
          <span class="text-slate-400">•</span>
          <span>Showing ${startIdx + 1} to ${Math.min(startIdx + s.pageSize, totalFiltered)} of ${totalFiltered}</span>
        </div>
        <div class="flex items-center gap-1">
          <button
            onclick="portalApp.setPlrPage(1)"
            ${s.page === 1 ? 'disabled' : ''}
            class="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50 shadow-xs"
          >First</button>
          <button
            onclick="portalApp.setPlrPage(${s.page - 1})"
            ${s.page === 1 ? 'disabled' : ''}
            class="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50 shadow-xs"
          >Prev</button>
          <span class="px-3 py-1 font-mono font-bold text-[#2E6DA4]">${s.page}</span>
          <button
            onclick="portalApp.setPlrPage(${s.page + 1})"
            ${s.page >= totalPages ? 'disabled' : ''}
            class="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50 shadow-xs"
          >Next</button>
          <button
            onclick="portalApp.setPlrPage(${totalPages})"
            ${s.page >= totalPages ? 'disabled' : ''}
            class="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50 shadow-xs"
          >Last</button>
        </div>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
  };

  /**
   * Recommendations Tab Table (Light Theme, 451 Recs linked via PLR #)
   */
  portalApp.renderRecommendationsTable = function (toolbar, tableBody, pagination) {
    const plrsMap = getPlrsMap();
    const s = getPlrState();

    const filtered = getFilteredPlrRecs();

    const totalRaw = getPlrRecs().length;
    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / s.recPageSize) || 1;
    if (s.recPage > totalPages) s.recPage = totalPages;
    const startIdx = (s.recPage - 1) * s.recPageSize;
    const pageItems = filtered.slice(startIdx, startIdx + s.recPageSize);

    // Toolbar
    toolbar.innerHTML = `
      <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <!-- Search Input -->
        <div class="relative flex-1 max-w-md">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <i data-lucide="search" class="w-4 h-4"></i>
          </div>
          <input
            type="text"
            value="${s.recSearchQuery}"
            oninput="portalApp.searchRec(this.value)"
            placeholder="Search recommendations, PLR #, entity, status.."
            class="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2E6DA4] focus:ring-1 focus:ring-[#2E6DA4]"
          />
          ${s.recSearchQuery ? `
            <button onclick="portalApp.searchRec('')" class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          ` : ''}
        </div>

        <!-- Entity Filter & Status -->
        <div class="flex flex-wrap items-center gap-2.5">
          <div class="flex items-center gap-1.5 text-xs text-slate-700">
            <span class="font-bold text-slate-500">ACTION ENTITY:</span>
            <select
              onchange="portalApp.filterRecByDeptDirect(this.value)"
              class="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#2E6DA4] cursor-pointer"
            >
              ${renderActionEntitySelectOptions(s.recSelectedEntity)}
            </select>
          </div>

          <div class="flex items-center gap-1.5 text-xs text-slate-700">
            <span class="font-bold text-slate-500">STATUS:</span>
            <select
              onchange="portalApp.filterRecByStatusDirect(this.value)"
              class="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#2E6DA4] cursor-pointer"
            >
              <option value="all" ${s.recSelectedStatus === 'all' ? 'selected' : ''}>All (${totalRaw})</option>
              <option value="Closed" ${s.recSelectedStatus === 'Closed' ? 'selected' : ''}>Closed (420)</option>
              <option value="Open" ${s.recSelectedStatus === 'Open' ? 'selected' : ''}>Open (31)</option>
            </select>
          </div>

          <span class="text-xs font-sans text-slate-500">Showing <strong class="text-slate-900">${totalFiltered}</strong> of ${totalRaw}</span>
        </div>
      </div>
    `;

    // Table Content with Reciprocal PLR Linking
    tableBody.innerHTML = `
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-600">
            <th class="py-3 px-3 w-14 text-center">S_NO</th>
            <th class="py-3 px-3 w-28">PLR # (COL B)</th>
            <th class="py-3 px-3 w-20">YEAR</th>
            <th class="py-3 px-3 w-28">DATE</th>
            <th class="py-3 px-4 min-w-[340px]">ACTION RECOMMENDATION</th>
            <th class="py-3 px-3 w-36">ACTION ENTITY (COL F)</th>
            <th class="py-3 px-3 w-28">STATUS (COL G)</th>
            <th class="py-3 px-3 w-40">LINKED PLR INCIDENT</th>
            <th class="py-3 px-3 w-16 text-center">VIEW</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium">
          ${pageItems.length === 0 ? `
            <tr>
              <td colspan="9" class="py-8 text-center text-slate-500">
                No recommendations match the active filter criteria.
              </td>
            </tr>
          ` : pageItems.map(item => {
            const isOpen = (item.status || '').toLowerCase() === 'open';
            const parentPlr = plrsMap.get(String(item.plrNo).toUpperCase());

            return `
              <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3 px-3 font-mono text-center text-slate-500">${item.sNo}</td>
                <td class="py-3 px-3 font-mono font-bold">
                  <button
                    onclick="portalApp.openPlrInspectionModal(${item.plrNo})"
                    class="font-mono font-bold text-[#2E6DA4] hover:underline cursor-pointer flex items-center gap-1"
                    title="Cross-reference PLR #${item.plrNo}"
                  >
                    #${item.plrNo}
                  </button>
                </td>
                <td class="py-3 px-3 font-mono text-slate-600">${item.year || (parentPlr ? parentPlr.year : '—')}</td>
                <td class="py-3 px-3 font-mono text-slate-600">${item.date || (parentPlr ? parentPlr.date : '—')}</td>
                <td class="py-3 px-4 text-slate-800 text-xs leading-relaxed max-w-lg">${item.recommendation}</td>
                <td class="py-3 px-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    ${item.actionBy}
                  </span>
                </td>
                <td class="py-3 px-3">
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    isOpen
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }">
                    <i data-lucide="${isOpen ? 'alert-circle' : 'check-circle-2'}" class="w-3 h-3"></i>
                    ${item.status}
                  </span>
                </td>
                <td class="py-3 px-3 text-slate-600 text-xs truncate max-w-xs">
                  ${parentPlr ? `
                    <span class="inline-flex items-center gap-1 text-[11px] text-[#2E6DA4] hover:underline cursor-pointer" onclick="portalApp.openPlrInspectionModal(${item.plrNo})">
                      <span class="font-bold font-mono">[${parentPlr.machine}]</span>
                      <span class="truncate">${(parentPlr.incident || '').slice(0, 24)}...</span>
                    </span>
                  ` : '—'}
                </td>
                <td class="py-3 px-3 text-center">
                  <button
                    onclick="portalApp.openPlrInspectionModal(${item.plrNo})"
                    class="p-1.5 rounded-lg text-slate-500 hover:text-[#2E6DA4] hover:bg-blue-50 transition-colors cursor-pointer"
                    title="View dual-sheet inspection modal"
                  >
                    <i data-lucide="eye" class="w-4 h-4"></i>
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    // Pagination
    if (pagination) {
      pagination.innerHTML = `
        <div class="flex items-center gap-2">
          <span>Page <strong class="text-slate-900">${s.recPage}</strong> of <strong class="text-slate-900">${totalPages}</strong></span>
          <span class="text-slate-400">•</span>
          <span>Showing ${startIdx + 1} to ${Math.min(startIdx + s.recPageSize, totalFiltered)} of ${totalFiltered}</span>
        </div>
        <div class="flex items-center gap-1">
          <button
            onclick="portalApp.setRecPage(1)"
            ${s.recPage === 1 ? 'disabled' : ''}
            class="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50 shadow-xs"
          >First</button>
          <button
            onclick="portalApp.setRecPage(${s.recPage - 1})"
            ${s.recPage === 1 ? 'disabled' : ''}
            class="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50 shadow-xs"
          >Prev</button>
          <span class="px-3 py-1 font-mono font-bold text-[#2E6DA4]">${s.recPage}</span>
          <button
            onclick="portalApp.setRecPage(${s.recPage + 1})"
            ${s.recPage >= totalPages ? 'disabled' : ''}
            class="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50 shadow-xs"
          >Next</button>
          <button
            onclick="portalApp.setRecPage(${totalPages})"
            ${s.recPage >= totalPages ? 'disabled' : ''}
            class="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50 shadow-xs"
          >Last</button>
        </div>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
  };

  /**
   * 6. Cross-Referenced PLR Inspection Modal (Light Theme)
   */
  portalApp.openPlrInspectionModal = function (plrNo) {
    const plrsMap = getPlrsMap();
    const recsMap = getRecsMapByPlr();

    const parentPlr = plrsMap.get(String(plrNo).toUpperCase());
    const linkedRecs = recsMap.get(String(plrNo).toUpperCase()) || [];

    const modalContainer = document.getElementById('plr-inspection-modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
        <div class="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          <!-- Modal Header -->
          <div class="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#2E6DA4] flex items-center justify-center shrink-0">
                <i data-lucide="layers" class="w-5 h-5"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-black text-slate-900">Cross-Sheet Tracking Inspection: PLR #${plrNo}</h3>
                  ${parentPlr ? `
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      (parentPlr.status || '').toLowerCase() === 'open'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }">${parentPlr.status} Incident</span>
                  ` : ''}
                </div>
                <p class="text-xs text-slate-500 mt-0.5">
                  Connected tracking across Tab <strong class="text-[#2E6DA4]">PLRStatus</strong> and Tab <strong class="text-emerald-700">Recommendations</strong>
                </p>
              </div>
            </div>
            <button
              onclick="portalApp.closePlrInspectionModal()"
              class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Modal Scrollable Body -->
          <div class="p-5 space-y-5 overflow-y-auto">
            
            <!-- Tab 1 Data: Incident Investigation Details -->
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-[#2E6DA4] uppercase tracking-wider flex items-center gap-1.5">
                  <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                  Tab: PLRStatus (Incident Investigation Report)
                </span>
                <span class="text-xs font-mono text-slate-500">PLR #${plrNo}</span>
              </div>

              ${parentPlr ? `
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 pb-2 border-b border-slate-200">
                  <div>
                    <span class="text-slate-500 text-[10px] block uppercase font-bold">Machine (Col G)</span>
                    <strong class="text-slate-900 font-mono">${parentPlr.machine}</strong>
                  </div>
                  <div>
                    <span class="text-slate-500 text-[10px] block uppercase font-bold">Outage Date</span>
                    <strong class="text-slate-900 font-mono">${parentPlr.date} (${parentPlr.year})</strong>
                  </div>
                  <div>
                    <span class="text-slate-500 text-[10px] block uppercase font-bold">Priority (Col H)</span>
                    <strong class="text-slate-900">${parentPlr.priority || 'Low'}</strong>
                  </div>
                  <div>
                    <span class="text-slate-500 text-[10px] block uppercase font-bold">Action Entity (Col I)</span>
                    <strong class="text-slate-900">${parentPlr.dept || 'KE'}</strong>
                  </div>
                </div>
                <div>
                  <span class="text-slate-500 text-[10px] block uppercase font-bold mb-1">Loss Narrative / Incident Description</span>
                  <p class="text-xs text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                    ${parentPlr.incident}
                  </p>
                </div>
              ` : `
                <p class="text-xs text-slate-500 italic">No corresponding row in PLRStatus tab.</p>
              `}
            </div>

            <!-- Tab 2 Data: Linked Action Recommendations -->
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <i data-lucide="check-square" class="w-3.5 h-3.5"></i>
                  Tab: Recommendations (${linkedRecs.length} Action Items Connected)
                </span>
                <span class="text-xs font-mono text-slate-500">Referenced by PLR #${plrNo}</span>
              </div>

              ${linkedRecs.length === 0 ? `
                <p class="text-xs text-slate-500 italic py-2">
                  No specific corrective actions logged for this PLR in Recommendations tab yet.
                </p>
              ` : `
                <div class="space-y-2.5">
                  ${linkedRecs.map((r, idx) => {
                    const isOp = (r.status || '').toLowerCase() === 'open';
                    return `
                      <div class="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                        <div class="flex items-center justify-between gap-2 flex-wrap">
                          <span class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span class="w-5 h-5 rounded-full bg-slate-100 text-[#2E6DA4] flex items-center justify-center text-[10px] font-mono font-bold">${idx + 1}</span>
                            <span class="text-[#2E6DA4]">${r.actionBy}</span>
                          </span>
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isOp ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }">
                            ${r.status}
                          </span>
                        </div>
                        <p class="text-xs text-slate-700 leading-relaxed font-normal">
                          ${r.recommendation}
                        </p>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>

          </div>

          <!-- Modal Footer -->
          <div class="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <button
              onclick="portalApp.switchTabAndFilterPlr(${plrNo})"
              class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#2E6DA4] hover:bg-[#235885] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
              <span>View All Linked in Recommendations Tab</span>
            </button>
            <button
              onclick="portalApp.closePlrInspectionModal()"
              class="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-xs"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  };

  portalApp.closePlrInspectionModal = function () {
    const modalContainer = document.getElementById('plr-inspection-modal-container');
    if (modalContainer) modalContainer.innerHTML = '';
  };

  portalApp.switchTabAndFilterPlr = function (plrNo) {
    portalApp.closePlrInspectionModal();
    const s = getPlrState();
    s.activeTab = 'recommendations';
    s.recSearchQuery = String(plrNo);
    s.recPage = 1;
    portalApp.renderPlrSuite();
    const el = document.getElementById('plr-table-toolbar-container');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Controllers & Filter Handlers
   */
  portalApp.setPlrTab = function (tab) {
    const s = getPlrState();
    s.activeTab = tab;
    portalApp.renderPlrSuite();
  };

  portalApp.setRecChartMode = function (mode) {
    const s = getPlrState();
    s.recChartMode = mode;
    portalApp.renderDeptBarChart();
    const btnTrend = document.getElementById('plr-rec-mode-trend');
    const btnStacked = document.getElementById('plr-rec-mode-stacked');
    const btnSide = document.getElementById('plr-rec-mode-side-by-side');
    if (btnTrend && btnStacked && btnSide) {
      btnTrend.className = `px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${mode === 'trend' ? 'bg-[#2E6DA4] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`;
      btnStacked.className = `px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${mode === 'stacked' ? 'bg-[#2E6DA4] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`;
      btnSide.className = `px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${mode === 'side-by-side' ? 'bg-[#2E6DA4] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`;
    }
  };

  portalApp.filterPlrByMachine = function (machine) {
    const s = getPlrState();
    s.selectedMachine = s.selectedMachine === machine ? 'all' : machine;
    s.page = 1;
    portalApp.renderPlrSuite();
  };

  portalApp.filterPlrByDept = function (dept) {
    const s = getPlrState();
    s.selectedDept = dept;
    s.page = 1;
    portalApp.renderTableSection();
  };

  portalApp.filterPlrByStatus = function (status) {
    const s = getPlrState();
    s.activeTab = 'incidents';
    s.selectedStatus = s.selectedStatus === status ? 'all' : status;
    s.page = 1;
    portalApp.renderPlrSuite();
    const el = document.getElementById('plr-table-toolbar-container');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  portalApp.searchPlr = function (val) {
    const s = getPlrState();
    s.searchQuery = val;
    s.page = 1;
    portalApp.renderTableSection();
  };

  portalApp.setPlrPage = function (page) {
    const s = getPlrState();
    s.page = page;
    portalApp.renderTableSection();
  };

  portalApp.filterRecByDeptDirect = function (dept) {
    const s = getPlrState();
    s.activeTab = 'recommendations';
    s.recSelectedEntity = s.recSelectedEntity === dept ? 'all' : dept;
    s.recPage = 1;
    portalApp.renderPlrSuite();
    const el = document.getElementById('plr-table-toolbar-container');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  portalApp.filterRecByStatusDirect = function (status) {
    const s = getPlrState();
    s.activeTab = 'recommendations';
    s.recSelectedStatus = s.recSelectedStatus === status ? 'all' : status;
    s.recPage = 1;
    portalApp.renderPlrSuite();
    const el = document.getElementById('plr-table-toolbar-container');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  portalApp.searchRec = function (val) {
    const s = getPlrState();
    s.recSearchQuery = val;
    s.recPage = 1;
    portalApp.renderTableSection();
  };

  portalApp.setRecPage = function (page) {
    const s = getPlrState();
    s.recPage = page;
    portalApp.renderTableSection();
  };

  portalApp.resetPlrFilters = function () {
    window.portalApp.state.plrState = getDefaultPlrState();
    portalApp.renderPlrSuite();
    if (portalApp.showToast) {
      portalApp.showToast('Filters Reset', 'All PLR diagnostic filters have been restored.', 'info');
    }
  };

  portalApp.exportPlrCSV = function () {
    const s = getPlrState();
    let csv = '';
    let filename = 'FPCL_PLR_Export.csv';

    if (s.activeTab === 'incidents') {
      const data = getPlrData();
      csv = 'S_NO,PLR_NO,YEAR,DATE,INCIDENT,MACHINE,PRIORITY,ACTION_ENTITY,STATUS\n';
      data.forEach(d => {
        const row = [
          d.sNo,
          d.plrNo,
          d.year,
          `"${(d.date || '').replace(/"/g, '""')}"`,
          `"${(d.incident || '').replace(/"/g, '""')}"`,
          `"${(d.machine || '').replace(/"/g, '""')}"`,
          `"${(d.priority || '').replace(/"/g, '""')}"`,
          `"${(d.dept || '').replace(/"/g, '""')}"`,
          d.status
        ];
        csv += row.join(',') + '\n';
      });
      filename = 'FPCL_PLR_Incidents_233.csv';
    } else {
      const data = getPlrRecs();
      csv = 'S_NO,PLR_NO,YEAR,DATE,RECOMMENDATION,ACTION_ENTITY,STATUS\n';
      data.forEach(d => {
        const row = [
          d.sNo,
          d.plrNo,
          d.year,
          `"${(d.date || '').replace(/"/g, '""')}"`,
          `"${(d.recommendation || '').replace(/"/g, '""')}"`,
          `"${(d.actionBy || '').replace(/"/g, '""')}"`,
          d.status
        ];
        csv += row.join(',') + '\n';
      });
      filename = 'FPCL_PLR_Recommendations_451.csv';
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

})();
