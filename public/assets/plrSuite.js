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
      recChartMode: 'stacked', // 'stacked', 'side-by-side', 'trend'
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
          if (['stg # 4', 'stg # 3', 'stg # 1', 'stg # 2', 'cfb-1', 'cfb-2'].some(m => itemMachine.includes(m))) {
            return false;
          }
        } else if (!itemMachine.includes(targetMachine)) {
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
          if (['stg # 4', 'stg # 3', 'stg # 1', 'stg # 2', 'cfb-1', 'cfb-2'].some(m => pMachine.includes(m))) {
            return false;
          }
        } else if (!pMachine.includes(tMachine)) {
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

  // Helper: Dynamically generate entity analytics breakdown for chips and bento cards
  function getEntityAnalyticsList() {
    const recs = getPlrRecs();
    const map = new Map();
    recs.forEach(r => {
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
                <option value="all" ${s.selectedMachine === 'all' ? 'selected' : ''}>All Machines (233)</option>
                <option value="STG # 4" ${s.selectedMachine === 'STG # 4' ? 'selected' : ''}>STG # 4 (155 Outages)</option>
                <option value="STG # 3" ${s.selectedMachine === 'STG # 3' ? 'selected' : ''}>STG # 3 (17 Outages)</option>
                <option value="STG # 1" ${s.selectedMachine === 'STG # 1' ? 'selected' : ''}>STG # 1 (13 Outages)</option>
                <option value="STG # 2" ${s.selectedMachine === 'STG # 2' ? 'selected' : ''}>STG # 2 (12 Outages)</option>
                <option value="CFB-1" ${s.selectedMachine === 'CFB-1' ? 'selected' : ''}>CFB-1 (10 Outages)</option>
                <option value="CFB-2" ${s.selectedMachine === 'CFB-2' ? 'selected' : ''}>CFB-2 (8 Outages)</option>
                <option value="Auxiliary" ${s.selectedMachine === 'Auxiliary' ? 'selected' : ''}>Auxiliary</option>
                <option value="Other Equipment" ${s.selectedMachine === 'Other Equipment' ? 'selected' : ''}>Other Equipment (18)</option>
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

            <!-- Filter 3: RESP DEPT (COL I) -->
            <div class="space-y-1.5">
              <div class="flex items-center gap-1.5 text-[11px] font-mono font-black text-amber-300 uppercase tracking-wider">
                <i data-lucide="briefcase" class="w-3.5 h-3.5 text-amber-400"></i>
                <span>RESP DEPT (COL I)</span>
              </div>
              <select
                onchange="portalApp.handlePlrDeptChange(this.value)"
                class="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-[#1e3e66] bg-[#0c2138] text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 cursor-pointer shadow-inner"
              >
                <option value="all" ${s.selectedDept === 'all' ? 'selected' : ''}>All Resp Depts</option>
                <option value="KE" ${s.selectedDept === 'KE' ? 'selected' : ''}>KE</option>
                <option value="Mechanical" ${s.selectedDept === 'Mechanical' ? 'selected' : ''}>Mechanical</option>
                <option value="E&I" ${s.selectedDept === 'E&I' ? 'selected' : ''}>E&amp;I</option>
                <option value="OPS-PSG" ${s.selectedDept === 'OPS-PSG' ? 'selected' : ''}>OPS-PSG</option>
                <option value="Finance" ${s.selectedDept === 'Finance' ? 'selected' : ''}>Finance</option>
                <option value="Planning" ${s.selectedDept === 'Planning' ? 'selected' : ''}>Planning</option>
                <option value="HSE" ${s.selectedDept === 'HSE' ? 'selected' : ''}>HSE</option>
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
                  <p class="text-[11px] text-slate-500 mt-0.5">Open Observations (Rose) vs. Closed (Emerald) across 451 total recommendations</p>
                </div>
              </div>
              <div class="flex items-center gap-2 self-start sm:self-auto">
                <div class="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px]">
                  <button
                    onclick="portalApp.setRecChartMode('stacked')"
                    class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${s.recChartMode === 'stacked' ? 'bg-[#2E6DA4] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
                  >Stacked</button>
                  <button
                    onclick="portalApp.setRecChartMode('side-by-side')"
                    class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${s.recChartMode === 'side-by-side' ? 'bg-[#2E6DA4] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
                  >Side-by-Side</button>
                  <button
                    onclick="portalApp.setRecChartMode('trend')"
                    class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${s.recChartMode === 'trend' ? 'bg-[#2E6DA4] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
                  >Trend Lines</button>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-mono font-black bg-blue-50 text-[#2E6DA4] border border-blue-200">
                  451 Recs
                </span>
              </div>
            </div>

            <!-- Legend -->
            <div class="flex items-center justify-end gap-5 text-xs font-semibold">
              <span class="flex items-center gap-1.5 text-slate-700">
                <span class="w-3 h-3 rounded-xs bg-[#f43f5e]"></span> Open Observations (31)
              </span>
              <span class="flex items-center gap-1.5 text-slate-700">
                <span class="w-3 h-3 rounded-xs bg-[#10b981]"></span> Closed Observations (420)
              </span>
            </div>

            <!-- SVG Vertical Bar Chart (Wide, non-scrollable, responsive) -->
            <div id="plr-dept-bar-chart-container" class="w-full min-h-[220px]">
              <!-- Rendered dynamically -->
            </div>

            <!-- Quick Filter Pills (Fully covering width, no scrollbar) -->
            <div class="pt-3 border-t border-slate-100">
              <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">QUICK FILTER RECOMMENDATIONS BY DEPT:</div>
              <div class="flex flex-wrap items-center gap-2 text-xs" id="plr-dept-quick-filters">
                <!-- Rendered dynamically -->
              </div>
            </div>
          </div>

        </div>

        <!-- ========================================================================= -->
        <!-- 4. ASSIGNED RECOMMENDATIONS TREND (Non-scrollable, covers page area)       -->
        <!-- ========================================================================= -->
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full bg-[#2E6DA4]"></span>
              <h3 class="text-sm sm:text-base font-black tracking-wider text-slate-900 uppercase">
                Assigned Recommendations Trend (Closed vs. Open)
              </h3>
            </div>
            <span class="text-xs font-medium text-slate-500">Columns F (Action Entity) &amp; G (Status)</span>
          </div>

          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <!-- Non-scrollable wrap chip list showing all entities clearly -->
            <div class="flex flex-wrap items-center gap-2" id="plr-entity-chips-container">
              <!-- Rendered dynamically without inner scrollbars -->
            </div>

            <!-- 4-Column Bento Grid of Department Cards (Covers page area) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2" id="plr-bento-cards-container">
              <!-- Rendered dynamically -->
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
      { name: 'STG # 3', count: 17, pct: 7, color: '#047857' },
      { name: 'STG # 1', count: 13, pct: 6, color: '#0284c7' },
      { name: 'STG # 2', count: 12, pct: 5, color: '#0891b2' },
      { name: 'CFB-1', count: 10, pct: 4, color: '#7c3aed' },
      { name: 'CFB-2', count: 8, pct: 3, color: '#d97706' },
      { name: 'Other Equipment', count: 18, pct: 8, color: '#475569' }
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
   * 2. Action Recommendations Per Dept Bar Chart (Light Theme, Wide & Non-scrollable)
   */
  portalApp.renderDeptBarChart = function () {
    const container = document.getElementById('plr-dept-bar-chart-container');
    const filterContainer = document.getElementById('plr-dept-quick-filters');
    if (!container) return;

    const s = getPlrState();
    // Department breakdown:
    // E&I (191: 176 closed, 15 open)
    // FPCL-KE O/C & Finance (120: 107 closed, 13 open)
    // Operation/PSG (46: 46 closed, 0 open)
    // Maint/Mechanical (42: 40 closed, 2 open)
    // Other / SCM / HSE (19: 18 closed, 1 open)
    // Inspection (16: 16 closed, 0 open)
    // PE/Technical (12: 12 closed, 0 open)
    // Electrical (5: 5 closed, 0 open)
    const depts = [
      { name: 'E&I', total: 191, closed: 176, open: 15 },
      { name: 'FPCL-KE O/C & Finance', total: 120, closed: 107, open: 13 },
      { name: 'Operation/PSG', total: 46, closed: 46, open: 0 },
      { name: 'Maint/Mechanical', total: 42, closed: 40, open: 2 },
      { name: 'Other / SCM / HSE', total: 19, closed: 18, open: 1 },
      { name: 'Inspection', total: 16, closed: 16, open: 0 },
      { name: 'PE/Technical', total: 12, closed: 12, open: 0 },
      { name: 'Electrical', total: 5, closed: 5, open: 0 }
    ];

    const maxVal = 200;
    const w = 780;
    const h = 210;
    const pad = { top: 25, right: 20, bottom: 45, left: 35 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;
    const barWidth = 32;
    const step = chartW / depts.length;

    // Y Axis Grid lines
    const yTicks = [0, 40, 80, 120, 160, 200];
    const gridSvg = yTicks.map(val => {
      const y = pad.top + chartH - (val / maxVal) * chartH;
      return `
        <line x1="${pad.left}" y1="${y}" x2="${w - pad.right}" y2="${y}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3 3"/>
        <text x="${pad.left - 6}" y="${y + 3}" fill="#64748b" font-size="9" font-family="monospace" text-anchor="end">${val}</text>
      `;
    }).join('');

    const barsSvg = depts.map((d, i) => {
      const x = pad.left + i * step + (step - barWidth) / 2;
      const totalH = (d.total / maxVal) * chartH;
      const openH = (d.open / maxVal) * chartH;
      const closedH = (d.closed / maxVal) * chartH;

      const isSelected = s.recSelectedEntity === d.name;

      if (s.recChartMode === 'side-by-side') {
        const subW = barWidth / 2 - 1.5;
        const yClosed = pad.top + chartH - closedH;
        const yOpen = pad.top + chartH - openH;

        return `
          <g class="cursor-pointer group" onclick="portalApp.filterRecByDeptDirect('${d.name}')">
            <!-- Closed bar -->
            <rect x="${x}" y="${yClosed}" width="${subW}" height="${closedH}" fill="#10b981" rx="2" class="group-hover:opacity-85"/>
            <!-- Open bar -->
            <rect x="${x + subW + 3}" y="${yOpen}" width="${subW}" height="${openH}" fill="#f43f5e" rx="2" class="group-hover:opacity-85"/>
            <text x="${x + barWidth / 2}" y="${Math.min(yClosed, yOpen) - 4}" fill="#1e293b" font-size="9" font-weight="bold" font-family="monospace" text-anchor="middle">${d.total}</text>
            <text x="${x + barWidth / 2}" y="${h - 10}" fill="${isSelected ? '#2E6DA4' : '#475569'}" font-size="8.5" font-weight="${isSelected ? 'bold' : '600'}" text-anchor="end" transform="rotate(-26, ${x + barWidth / 2}, ${h - 10})">${d.name}</text>
          </g>
        `;
      }

      if (s.recChartMode === 'trend') {
        // Trend points
        const yTop = pad.top + chartH - totalH;
        return `
          <g class="cursor-pointer group" onclick="portalApp.filterRecByDeptDirect('${d.name}')">
            <circle cx="${x + barWidth / 2}" cy="${yTop}" r="5" fill="#2E6DA4" stroke="#ffffff" stroke-width="2"/>
            <text x="${x + barWidth / 2}" y="${yTop - 6}" fill="#2E6DA4" font-size="9" font-weight="bold" font-family="monospace" text-anchor="middle">${d.total}</text>
            <text x="${x + barWidth / 2}" y="${h - 10}" fill="${isSelected ? '#2E6DA4' : '#475569'}" font-size="8.5" font-weight="${isSelected ? 'bold' : '600'}" text-anchor="end" transform="rotate(-26, ${x + barWidth / 2}, ${h - 10})">${d.name}</text>
          </g>
        `;
      }

      // Default: Stacked Bar Chart
      const yBase = pad.top + chartH;
      const yClosed = yBase - closedH;
      const yOpen = yClosed - openH;

      return `
        <g class="cursor-pointer group" onclick="portalApp.filterRecByDeptDirect('${d.name}')">
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
          <text x="${x + barWidth / 2}" y="${yOpen - 5}" fill="#0f172a" font-size="9.5" font-weight="900" font-family="monospace" text-anchor="middle">${d.total}</text>
          <!-- Value inside closed bar if enough room -->
          ${closedH > 18 ? `
            <text x="${x + barWidth / 2}" y="${yClosed + closedH / 2 + 3}" fill="#ffffff" font-size="8.5" font-weight="bold" font-family="monospace" text-anchor="middle">${d.closed}</text>
          ` : ''}
          <!-- Value inside open bar if enough room -->
          ${openH > 12 ? `
            <text x="${x + barWidth / 2}" y="${yOpen + openH / 2 + 3}" fill="#ffffff" font-size="8" font-weight="bold" font-family="monospace" text-anchor="middle">${d.open}</text>
          ` : ''}
          <!-- X-Axis Label -->
          <text
            x="${x + barWidth / 2}"
            y="${h - 10}"
            fill="${isSelected ? '#2E6DA4' : '#475569'}"
            font-size="8.5"
            font-weight="${isSelected ? 'bold' : '600'}"
            text-anchor="end"
            transform="rotate(-26, ${x + barWidth / 2}, ${h - 10})"
            class="group-hover:fill-[#2E6DA4] transition-colors"
          >${d.name}</text>
        </g>
      `;
    }).join('');

    container.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" class="w-full h-auto select-none overflow-visible">
        ${gridSvg}
        ${barsSvg}
      </svg>
    `;

    // Quick Filter Pills (Fully visible covering card area, no scrollbars)
    if (filterContainer) {
      filterContainer.innerHTML = depts.map(d => {
        const isSel = s.recSelectedEntity === d.name;
        return `
          <button
            onclick="portalApp.filterRecByDeptDirect('${d.name}')"
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
   * 4. Assigned Recommendations Trend: Chips & Bento Cards (Dynamic entities from Recommendations tab Column F)
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

    // Bento Grid Cards (Top 16 entities displayed in 4-column responsive grid covering the page area)
    bentoContainer.innerHTML = entityList.slice(0, 16).map(e => {
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
              <option value="all" ${s.selectedDept === 'all' ? 'selected' : ''}>All Departments</option>
              <option value="KE" ${s.selectedDept === 'KE' ? 'selected' : ''}>KE</option>
              <option value="Mechanical" ${s.selectedDept === 'Mechanical' ? 'selected' : ''}>Mechanical</option>
              <option value="E&I" ${s.selectedDept === 'E&I' ? 'selected' : ''}>E&amp;I</option>
              <option value="OPS-PSG" ${s.selectedDept === 'OPS-PSG' ? 'selected' : ''}>OPS-PSG</option>
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
    // S_NO | PLR # | YEAR | DATE | INCIDENT DESCRIPTION | MACHINE (COL G) | PRIORITY (COL H) | ACTION ENTITY (COL I) | STATUS (COL F) | VIEW
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
            <th class="py-3 px-3 w-32">ACTION ENTITY (COL I)</th>
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
