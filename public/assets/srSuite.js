/**
 * FPCL Executive Operations & Compliance Portal
 * SR (Safety Review) Specialized Executive BI Suite
 * 
 * Google Sheet ID: 1V-klVfZrARyMBsjodjF52aQe6dzLtuBq64bgqcPAF1c
 * Tab: SR
 * 
 * Target Scope & Isolation: Performs operations strictly for sheet ID
 * 1V-klVfZrARyMBsjodjF52aQe6dzLtuBq64bgqcPAF1c and Tab named SR.
 */

(function () {
  'use strict';

  const SR_SPREADSHEET_ID = '1V-klVfZrARyMBsjodjF52aQe6dzLtuBq64bgqcPAF1c';
  const SR_TAB = 'SR';

  // Direct published Google Sheets CSV endpoint
  const SR_CSV_URL = `https://docs.google.com/spreadsheets/d/${SR_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SR_TAB)}`;

  const srSuite = {
    state: {
      searchQuery: '',
      yearFilter: String(new Date().getFullYear()), // Opens dynamically on current year filter (e.g. 2026)
      userHasChangedYear: false,                   // Tracks if user manually changed the year filter
      createdByFilter: 'all',                      // Filter from Column D: Created_By
      priorityFilter: 'all',                       // Filter from Column G: Priority
      statusFilter: 'all',                         // Filter from Column I: Notification_Status ('all', 'open', 'closed')
      isSyncing: false,
      lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSettingsOpen: false,
      tableScrollPos: 0
    },

    init() {
      window.FPCL_SR_SUITE = this;

      // Try reading SR dataset from localStorage cache
      try {
        const cached = localStorage.getItem('FPCL_SR_CACHE');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.FPCL_SR_DATA = parsed;
          }
        }
      } catch (e) {}

      // Fallback to initial seed if not yet loaded
      if (!window.FPCL_SR_DATA || window.FPCL_SR_DATA.length === 0) {
        if (window.FPCL_SR_INITIAL_SEED) {
          window.FPCL_SR_DATA = window.FPCL_SR_INITIAL_SEED.slice();
        }
      }

      // Default year filter to dynamic current year
      if (!this.state.userHasChangedYear) {
        this.state.yearFilter = this.getDefaultYear();
      }

      // Propagate stats to overview registry
      this.syncStatsToOverview();

      // Attempt initial background sync from live Google Sheet
      setTimeout(() => {
        this.syncLiveFeed({ silent: true });
      }, 400);
    },

    getRawData() {
      if (Array.isArray(window.FPCL_SR_DATA) && window.FPCL_SR_DATA.length > 0) {
        return window.FPCL_SR_DATA;
      }
      if (Array.isArray(window.FPCL_SR_INITIAL_SEED) && window.FPCL_SR_INITIAL_SEED.length > 0) {
        return window.FPCL_SR_INITIAL_SEED;
      }
      return [];
    },

    /**
     * Extracts 4-digit year string from Column C (Date)
     * Supports formats: "4-Jan-24" -> "2024", "2024-01-04" -> "2024", "2026", etc.
     */
    extractYear(dateStr) {
      if (!dateStr) return '';
      const s = String(dateStr).trim();
      if (!s) return '';
      
      // Match 4-digit year 1990-2099
      const fourDigitMatch = s.match(/\b(19\d\d|20\d\d)\b/);
      if (fourDigitMatch) {
        return fourDigitMatch[1];
      }
      
      // Match 2-digit year at end of date like "4-Jan-24" or "04/01/24"
      const twoDigitMatch = s.match(/[-/](\d{2})(?:\s|$|[^\d])/);
      if (twoDigitMatch) {
        const yr = parseInt(twoDigitMatch[1], 10);
        if (yr >= 10 && yr <= 50) return String(2000 + yr);
      }
      return '';
    },

    getDefaultYear() {
      return String(new Date().getFullYear());
    },

    getAvailableYears() {
      const raw = this.getRawData();
      const yearsSet = new Set();
      yearsSet.add(this.getDefaultYear()); // Always include current year

      raw.forEach(r => {
        const yr = this.extractYear(r.date);
        if (yr) yearsSet.add(yr);
      });

      return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
    },

    getAvailableCreators() {
      const raw = this.getRawData();
      const creatorsSet = new Set();
      raw.forEach(r => {
        const c = String(r.createdBy || '').trim();
        if (c) creatorsSet.add(c);
      });
      return Array.from(creatorsSet).sort();
    },

    getAvailablePriorities() {
      const raw = this.getRawData();
      const pSet = new Set();
      raw.forEach(r => {
        const p = String(r.priority || '').trim();
        if (p) pSet.add(p);
      });
      return Array.from(pSet).sort();
    },

    /**
     * Determine if an SR is closed or open according to specification:
     * Closed = 'Closed' (case-insensitive)
     * Open = empty cell or any text other than Closed
     */
    isClosed(statusStr) {
      const s = String(statusStr || '').trim().toLowerCase();
      return s === 'closed' || s === 'close';
    },

    /**
     * Filter data based on active state:
     * - Created_By (Col D)
     * - Year (Col C Date)
     * - Priority (Col G)
     * - Notification_Status (Col I)
     * - Search Query
     */
    getFilteredData() {
      const raw = this.getRawData();

      return raw.filter(item => {
        // Search query
        if (this.state.searchQuery) {
          const q = this.state.searchQuery.toLowerCase().trim();
          const match =
            String(item.id || '').toLowerCase().includes(q) ||
            String(item.notification || '').toLowerCase().includes(q) ||
            String(item.date || '').toLowerCase().includes(q) ||
            String(item.createdBy || '').toLowerCase().includes(q) ||
            String(item.description || '').toLowerCase().includes(q) ||
            String(item.problemStatement || '').toLowerCase().includes(q) ||
            String(item.priority || '').toLowerCase().includes(q) ||
            String(item.receivedByTechnical || '').toLowerCase().includes(q) ||
            String(item.notificationStatus || '').toLowerCase().includes(q);
          if (!match) return false;
        }

        // Year filter (from Column C Date)
        if (this.state.yearFilter && this.state.yearFilter !== 'all') {
          const yr = this.extractYear(item.date);
          if (yr && yr !== String(this.state.yearFilter)) {
            return false;
          }
          if (!yr && String(this.state.yearFilter) !== this.getDefaultYear()) {
            return false;
          }
        }

        // Created_By filter (from Column D)
        if (this.state.createdByFilter && this.state.createdByFilter !== 'all') {
          const creator = String(item.createdBy || '').trim().toLowerCase();
          if (creator !== this.state.createdByFilter.toLowerCase()) {
            return false;
          }
        }

        // Priority filter (from Column G)
        if (this.state.priorityFilter && this.state.priorityFilter !== 'all') {
          const prio = String(item.priority || '').trim().toLowerCase();
          if (prio !== this.state.priorityFilter.toLowerCase()) {
            return false;
          }
        }

        // Notification_Status filter (from Column I)
        if (this.state.statusFilter && this.state.statusFilter !== 'all') {
          const closed = this.isClosed(item.notificationStatus);
          if (this.state.statusFilter === 'closed' && !closed) return false;
          if (this.state.statusFilter === 'open' && closed) return false;
        }

        return true;
      });
    },

    /**
     * Calculate 4 Core KPIs:
     * 1- TOTAL SRs from column A named ID
     * 2- Open SRs from column I named Notification_Status (empty or not 'Closed')
     * 3- Closed SR from column I named Notification_Status
     * 4- Closure Rate in percentage from KPI 1 and KPI 3
     */
    calculateKpis(data) {
      const total = data.length;
      let closed = 0;
      let open = 0;

      data.forEach(r => {
        if (this.isClosed(r.notificationStatus)) {
          closed++;
        } else {
          open++;
        }
      });

      const closureRateNum = total > 0 ? (closed / total) * 100 : 0;
      const closureRate = closureRateNum.toFixed(1) + '%';

      return {
        total,
        closed,
        open,
        closureRate,
        closureRateNum
      };
    },

    /**
     * Group SRs by Unique Creators (Column D) for Donut Chart
     */
    getCreatorStats(data) {
      const map = {};
      data.forEach(r => {
        const creator = String(r.createdBy || 'Unassigned').trim();
        map[creator] = (map[creator] || 0) + 1;
      });

      const total = data.length;
      const colors = [
        '#8B5CF6', // Purple
        '#06B6D4', // Cyan
        '#EC4899', // Pink
        '#F59E0B', // Amber
        '#10B981', // Emerald
        '#3B82F6', // Blue
        '#6366F1', // Indigo
        '#14B8A6', // Teal
        '#F97316', // Orange
        '#D946EF'  // Fuchsia
      ];

      return Object.keys(map).map((creator, i) => {
        const count = map[creator];
        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
        return {
          creator,
          count,
          pct: parseFloat(pct),
          pctStr: pct + '%',
          color: colors[i % colors.length]
        };
      }).sort((a, b) => b.count - a.count);
    },

    /**
     * Group SRs by Priority for Horizontal Stack Bar Chart
     */
    getPriorityStats(data) {
      const map = {};
      data.forEach(r => {
        const p = String(r.priority || 'Normal').trim();
        if (!map[p]) {
          map[p] = { priority: p, total: 0, closed: 0, open: 0 };
        }
        map[p].total++;
        if (this.isClosed(r.notificationStatus)) {
          map[p].closed++;
        } else {
          map[p].open++;
        }
      });

      const list = Object.values(map);
      if (list.length === 0) {
        list.push({ priority: 'Normal', total: 0, closed: 0, open: 0 });
      }

      // Add overall/total row
      const overallClosed = data.filter(r => this.isClosed(r.notificationStatus)).length;
      const overallOpen = data.length - overallClosed;
      list.push({
        priority: 'Overall SRs',
        total: data.length,
        closed: overallClosed,
        open: overallOpen
      });

      return list;
    },

    /**
     * Synchronize stats into DASHBOARD_REGISTRY for Overview Page
     */
    syncStatsToOverview() {
      if (typeof window.DASHBOARD_REGISTRY !== 'undefined' && Array.isArray(window.DASHBOARD_REGISTRY)) {
        const entry = window.DASHBOARD_REGISTRY.find(d => d.id === 'sr');
        if (entry) {
          const raw = this.getRawData();
          const kpis = this.calculateKpis(raw);
          entry.kpis = {
            total: kpis.total,
            closed: kpis.closed,
            inProgress: kpis.open,
            overdue: 0,
            compliance: kpis.closureRate
          };
          entry.punchList = {
            open: kpis.open,
            closed: kpis.closed,
            total: kpis.total,
            rate: kpis.closureRate
          };
          entry.status = 'Active';
          entry.hasSheetLink = true;
          entry.cadence = 'Live Sync / Google Sheet';
        }
      }
    },

    /**
     * Robust CSV Parser that handles quoted multi-line fields
     */
    parseCSV(text) {
      const lines = [];
      let row = [];
      let inQuotes = false;
      let currentVal = '';

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            currentVal += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          row.push(currentVal.trim());
          currentVal = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
          row.push(currentVal.trim());
          if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
            lines.push(row);
          }
          row = [];
          currentVal = '';
        } else {
          currentVal += char;
        }
      }

      if (currentVal || row.length > 0) {
        row.push(currentVal.trim());
        lines.push(row);
      }

      if (lines.length < 2) return [];

      const parsedRecords = [];
      for (let r = 1; r < lines.length; r++) {
        const cols = lines[r];
        if (!cols || cols.length === 0 || !cols[0]) continue;

        parsedRecords.push({
          id: cols[0] || String(r),
          notification: cols[1] || '',
          date: cols[2] || '',
          createdBy: cols[3] || '',
          description: cols[4] || '',
          problemStatement: cols[5] || '',
          priority: cols[6] || 'Normal',
          receivedByTechnical: cols[7] || '',
          notificationStatus: cols[8] || ''
        });
      }

      return parsedRecords;
    },

    /**
     * Sync with live Google Sheet
     */
    async syncLiveFeed(options = {}) {
      const silent = options.silent === true;
      this.state.isSyncing = true;
      const syncBtn = document.getElementById('sr-sync-icon');
      if (syncBtn) syncBtn.classList.add('animate-spin');

      try {
        const timestamp = Date.now();
        const fetchUrl = `${SR_CSV_URL}&_nocache=${timestamp}`;

        let csvText = '';
        try {
          const resp = await fetch(fetchUrl, { cache: 'no-store' });
          if (resp.ok) {
            csvText = await resp.text();
          }
        } catch (fetchErr) {
          console.warn('[SR Suite] Direct Gviz fetch failed, trying proxy fallback:', fetchErr);
        }

        if (!csvText || csvText.indexOf('<!doctype') !== -1) {
          try {
            const proxyUrl = `/api/sheets/fetch?url=${encodeURIComponent(`https://docs.google.com/spreadsheets/d/${SR_SPREADSHEET_ID}/edit`)}&tab=${encodeURIComponent(SR_TAB)}`;
            const pResp = await fetch(proxyUrl);
            if (pResp.ok) {
              const pData = await pResp.json();
              if (pData && pData.csvText) {
                csvText = pData.csvText;
              }
            }
          } catch (pErr) {
            console.warn('[SR Suite] Proxy fetch fallback failed:', pErr);
          }
        }

        if (csvText && csvText.trim().length > 0 && csvText.indexOf('<!doctype') === -1) {
          const parsed = this.parseCSV(csvText);
          if (parsed && parsed.length > 0) {
            window.FPCL_SR_DATA = parsed;
            try {
              localStorage.setItem('FPCL_SR_CACHE', JSON.stringify(parsed));
            } catch (e) {}
          }
        }

        this.state.lastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.syncStatsToOverview();

        if (window.portalApp && typeof window.portalApp.renderComparisonChart === 'function') {
          window.portalApp.renderComparisonChart();
        }

        const container = document.getElementById('sr-specialized-container');
        if (container && !container.classList.contains('hidden') && !container.hidden) {
          this.render();
        }

        if (!silent && window.portalApp && typeof window.portalApp.showToast === 'function') {
          window.portalApp.showToast('SR Synced', `Updated records from live Google Sheet.`, 'success');
        }
      } catch (err) {
        console.error('[SR Suite] Live sync error:', err);
        if (!silent && window.portalApp && typeof window.portalApp.showToast === 'function') {
          window.portalApp.showToast('Sync Notice', 'Using cached/offline SR records.', 'info');
        }
      } finally {
        this.state.isSyncing = false;
        if (syncBtn) syncBtn.classList.remove('animate-spin');
      }
    },

    setCreatedByFilter(c) {
      this.state.createdByFilter = c;
      this.render();
    },

    setYearFilter(y) {
      this.state.userHasChangedYear = true;
      this.state.yearFilter = y;
      this.render();
    },

    setPriorityFilter(p) {
      this.state.priorityFilter = p;
      this.render();
    },

    setStatusFilter(s) {
      this.state.statusFilter = s;
      this.render();
    },

    setSearch(q) {
      this.state.searchQuery = q;
      this.render();
    },

    resetFilters() {
      this.state.searchQuery = '';
      this.state.yearFilter = this.getDefaultYear();
      this.state.userHasChangedYear = false;
      this.state.createdByFilter = 'all';
      this.state.priorityFilter = 'all';
      this.state.statusFilter = 'all';
      this.render();
    },

    /**
     * Export currently filtered records to CSV
     */
    exportFilteredCSV() {
      const data = this.getFilteredData();
      if (!data || data.length === 0) {
        if (window.portalApp && typeof window.portalApp.showToast === 'function') {
          window.portalApp.showToast('No Records', 'No SR records match active filters.', 'warning');
        }
        return;
      }

      const headers = [
        'ID',
        'Notification',
        'Date',
        'Created_By',
        'Description',
        'Problem_Statement',
        'Priority',
        'Received / Not_Received_by_Technical',
        'Notification_Status'
      ];

      const csvRows = data.map(r => [
        `"${String(r.id || '').replace(/"/g, '""')}"`,
        `"${String(r.notification || '').replace(/"/g, '""')}"`,
        `"${String(r.date || '').replace(/"/g, '""')}"`,
        `"${String(r.createdBy || '').replace(/"/g, '""')}"`,
        `"${String(r.description || '').replace(/"/g, '""')}"`,
        `"${String(r.problemStatement || '').replace(/"/g, '""')}"`,
        `"${String(r.priority || '').replace(/"/g, '""')}"`,
        `"${String(r.receivedByTechnical || '').replace(/"/g, '""')}"`,
        `"${String(r.notificationStatus || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...csvRows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `FPCL_SR_Filtered_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (window.portalApp && typeof window.portalApp.showToast === 'function') {
        window.portalApp.showToast('Export Successful', `Exported ${data.length} SR records based on active filters.`, 'success');
      }
    },

    scrollTable(direction) {
      const container = document.getElementById('sr-table-container');
      if (container) {
        const delta = direction === 'left' ? -380 : 380;
        container.scrollBy({ left: delta, behavior: 'smooth' });
      }
    },

    onOpen() {
      if (!window.FPCL_SR_DATA || window.FPCL_SR_DATA.length === 0) {
        if (window.FPCL_SR_INITIAL_SEED) {
          window.FPCL_SR_DATA = window.FPCL_SR_INITIAL_SEED.slice();
        }
      }

      if (!this.state.userHasChangedYear) {
        this.state.yearFilter = this.getDefaultYear();
      }

      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.syncLiveFeed({ silent: true });
    },

    /**
     * Main Render Function
     */
    render() {
      const container = document.getElementById('sr-specialized-container');
      if (!container) return;

      const filteredData = this.getFilteredData();
      const kpis = this.calculateKpis(filteredData);
      const priorityStats = this.getPriorityStats(filteredData);
      const creatorStats = this.getCreatorStats(filteredData);
      const availableYears = this.getAvailableYears();
      const availableCreators = this.getAvailableCreators();
      const availablePriorities = this.getAvailablePriorities();

      // Check if current dynamic year filter yielded 0 items while raw data has items
      const rawCount = this.getRawData().length;
      const isYearEmptyNotice = filteredData.length === 0 && rawCount > 0 && this.state.yearFilter !== 'all';

      container.innerHTML = `
        <div class="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
          
          <!-- ========================================================================= -->
          <!-- 1. COLORFUL EYE-CATCHING TOP BANNER                                       -->
          <!-- Modern stylish gradient: Deep Indigo Violet & Electric Fuchsia            -->
          <!-- Only heading & important feature buttons, no irrelevant info text         -->
          <!-- ========================================================================= -->
          <div
            id="sr-banner"
            class="relative overflow-hidden rounded-2xl p-4 sm:p-6 shadow-xl text-white"
            style="background: linear-gradient(135deg, #1E1B4B 0%, #4338CA 35%, #7C3AED 70%, #C026D3 100%); border: 1.5px solid rgba(192, 132, 252, 0.4);"
          >
            <!-- Luminous ambient gradient glows -->
            <div class="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-indigo-600/30 blur-3xl pointer-events-none"></div>

            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
              
              <!-- Left: Banner Heading (No extra irrelevant text) -->
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                  <i data-lucide="file-check" class="w-6 h-6 text-fuchsia-200"></i>
                </div>
                <div>
                  <h2 class="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight m-0">
                    SR
                  </h2>
                </div>
              </div>

              <!-- Right: Important Feature Buttons matching reference design -->
              <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 self-start md:self-auto">
                
                <!-- Search Findings Button / Input -->
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-white/70">
                    <i data-lucide="search" class="w-3.5 h-3.5"></i>
                  </div>
                  <input
                    id="sr-search-input"
                    type="text"
                    value="${this.escapeHtml(this.state.searchQuery || '')}"
                    placeholder="SEARCH FINDINGS"
                    class="pl-8 pr-7 py-1.5 bg-white/15 hover:bg-white/20 focus:bg-white text-white focus:text-slate-900 placeholder:text-white/80 focus:placeholder:text-slate-400 border border-white/30 focus:border-white rounded-lg text-xs font-bold tracking-wider uppercase transition-all outline-none shadow-inner w-36 sm:w-44"
                    oninput="FPCL_SR_SUITE.setSearch(this.value)"
                  />
                  ${this.state.searchQuery ? `
                    <button
                      type="button"
                      onclick="FPCL_SR_SUITE.setSearch('')"
                      class="absolute inset-y-0 right-0 pr-2 flex items-center text-white/80 hover:text-white cursor-pointer"
                    >
                      <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    </button>
                  ` : ''}
                </div>

                <!-- Reset Filters Button -->
                <button
                  type="button"
                  id="sr-reset-btn"
                  onclick="FPCL_SR_SUITE.resetFilters()"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-white/15 hover:bg-white/25 active:bg-white/30 border border-white/30 backdrop-blur-md shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                  title="Reset all filters to default"
                >
                  <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                  <span>Reset Filters</span>
                </button>

                <!-- Export CSV Button -->
                <button
                  type="button"
                  id="sr-export-btn"
                  onclick="FPCL_SR_SUITE.exportFilteredCSV()"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-white/15 hover:bg-white/25 active:bg-white/30 border border-white/30 backdrop-blur-md shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                  title="Export filtered SR records to CSV"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>Export CSV</span>
                </button>

                <!-- Sync Feed Button -->
                <button
                  type="button"
                  id="sr-sync-btn"
                  onclick="FPCL_SR_SUITE.syncLiveFeed({ silent: false })"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-white/20 hover:bg-white/30 active:bg-white/35 border border-white/35 backdrop-blur-md shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                  title="Refresh live feed from Google Sheet"
                >
                  <i id="sr-sync-icon" data-lucide="refresh-cw" class="w-3.5 h-3.5 ${this.state.isSyncing ? 'animate-spin' : ''}"></i>
                  <span>Sync Feed</span>
                </button>

                <!-- Settings / Info Button -->
                <button
                  type="button"
                  onclick="FPCL_SR_SUITE.toggleSettingsModal()"
                  class="p-1.5 rounded-lg text-white bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md shadow-xs transition-all cursor-pointer"
                  title="Google Sheet Link Settings"
                >
                  <i data-lucide="settings" class="w-4 h-4"></i>
                </button>
              </div>

            </div>
          </div>

          <!-- Dynamic Year Notification / Quick Switch (Helper when year filter has 0 records) -->
          ${isYearEmptyNotice ? `
            <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 animate-in fade-in">
              <div class="flex items-center gap-2">
                <i data-lucide="alert-circle" class="w-4 h-4 text-amber-600 shrink-0"></i>
                <span>Currently showing Year <strong>${this.state.yearFilter}</strong> (0 records found in dataset).</span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onclick="FPCL_SR_SUITE.setYearFilter('all')"
                  class="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Show All Years (${rawCount} Total)
                </button>
                <button
                  type="button"
                  onclick="FPCL_SR_SUITE.setYearFilter('2024')"
                  class="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  View Year 2024
                </button>
              </div>
            </div>
          ` : ''}


          <!-- ========================================================================= -->
          <!-- 2. 4 BESPOKE KPI CARDS                                                    -->
          <!-- Perimeter Borders: Custom border along the outer perimeter (edges)        -->
          <!-- Unique Color Scheme for each KPI box                                      -->
          <!-- Large font size, center aligned, only heading & value (red for open)      -->
          <!-- Mobile view: side by side to save space (grid-cols-2 lg:grid-cols-4)       -->
          <!-- ========================================================================= -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            <!-- KPI 1: TOTAL SRs from column A named ID -->
            <div
              class="relative overflow-hidden rounded-2xl p-4 sm:p-5 text-center flex flex-col items-center justify-center transition-all duration-200 hover:-translate-y-0.5 shadow-2xs hover:shadow-md"
              style="background: linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 100%); border: 2.5px solid #2563EB;"
            >
              <div class="text-xs sm:text-sm font-black uppercase tracking-wider text-blue-900 text-center leading-tight">
                TOTAL SRs
              </div>
              <div class="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-[#1D4ED8] my-2 leading-none text-center">
                ${kpis.total}
              </div>
            </div>

            <!-- KPI 2: Open SRs from column I named Notification_Status (Solid Red) -->
            <div
              class="relative overflow-hidden rounded-2xl p-4 sm:p-5 text-center flex flex-col items-center justify-center transition-all duration-200 hover:-translate-y-0.5 shadow-2xs hover:shadow-md"
              style="background: linear-gradient(180deg, #FEF2F2 0%, #FFFFFF 100%); border: 2.5px solid #DC2626;"
            >
              <div class="text-xs sm:text-sm font-black uppercase tracking-wider text-red-900 text-center leading-tight">
                Open SRs
              </div>
              <div class="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-[#DC2626] my-2 leading-none text-center">
                ${kpis.open}
              </div>
            </div>

            <!-- KPI 3: Closed SR from column I named Notification_Status (Solid Green) -->
            <div
              class="relative overflow-hidden rounded-2xl p-4 sm:p-5 text-center flex flex-col items-center justify-center transition-all duration-200 hover:-translate-y-0.5 shadow-2xs hover:shadow-md"
              style="background: linear-gradient(180deg, #ECFDF5 0%, #FFFFFF 100%); border: 2.5px solid #059669;"
            >
              <div class="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-900 text-center leading-tight">
                Closed SR
              </div>
              <div class="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-[#0B8A5A] my-2 leading-none text-center">
                ${kpis.closed}
              </div>
            </div>

            <!-- KPI 4: Closure Rate in percentage from KPI 1 and KPI 3 -->
            <div
              class="relative overflow-hidden rounded-2xl p-4 sm:p-5 text-center flex flex-col items-center justify-center transition-all duration-200 hover:-translate-y-0.5 shadow-2xs hover:shadow-md"
              style="background: linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 100%); border: 2.5px solid #7C3AED;"
            >
              <div class="text-xs sm:text-sm font-black uppercase tracking-wider text-purple-900 text-center leading-tight">
                Closure Rate
              </div>
              <div class="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-[#7C3AED] my-2 leading-none text-center">
                ${kpis.closureRate}
              </div>
            </div>

          </div>


          <!-- ========================================================================= -->
          <!-- 3. DYNAMIC FILTERS BAR                                                     -->
          <!-- No heading given to filter banner, simply displayed                        -->
          <!-- Mobile view: side by side to save space (grid-cols-2 lg:grid-cols-4)       -->
          <!-- Perimeter border with unique gradient / styling                           -->
          <!-- Created_By (Col D), Year (Col C), Priority (Col G), Notification_Status (I)-->
          <!-- ========================================================================= -->
          <div
            id="sr-filters-box"
            class="bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-sm transition-all"
            style="border: 2px solid #8B5CF6;"
          >
            <!-- 4 filters side by side on mobile (grid-cols-2) and desktop (grid-cols-4) -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              
              <!-- Filter 1: Created_By (from Column D) -->
              <div class="min-w-0">
                <div class="relative">
                  <select
                    id="filter-sr-created-by"
                    onchange="FPCL_SR_SUITE.setCreatedByFilter(this.value)"
                    class="w-full pl-2.5 pr-7 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-purple-600 rounded-xl text-xs font-bold text-slate-800 shadow-2xs transition-all cursor-pointer outline-none appearance-none truncate"
                    title="Filter by Created_By (Column D)"
                  >
                    <option value="all" ${this.state.createdByFilter === 'all' ? 'selected' : ''}>All Creators</option>
                    ${availableCreators.map(c => `
                      <option value="${this.escapeHtml(c)}" ${this.state.createdByFilter.toLowerCase() === c.toLowerCase() ? 'selected' : ''}>${this.escapeHtml(c)}</option>
                    `).join('')}
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                  </div>
                </div>
              </div>

              <!-- Filter 2: Year from Column C Date (Opens dynamically on current year) -->
              <div class="min-w-0">
                <div class="relative">
                  <select
                    id="filter-sr-year"
                    onchange="FPCL_SR_SUITE.setYearFilter(this.value)"
                    class="w-full pl-2.5 pr-7 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-purple-600 rounded-xl text-xs font-bold text-slate-800 shadow-2xs transition-all cursor-pointer outline-none appearance-none truncate"
                    title="Filter by Year from Date (Column C)"
                  >
                    <option value="all" ${this.state.yearFilter === 'all' ? 'selected' : ''}>All Years</option>
                    ${availableYears.map(y => `
                      <option value="${y}" ${this.state.yearFilter === String(y) ? 'selected' : ''}>Year: ${y}</option>
                    `).join('')}
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                  </div>
                </div>
              </div>

              <!-- Filter 3: Priority from Column G -->
              <div class="min-w-0">
                <div class="relative">
                  <select
                    id="filter-sr-priority"
                    onchange="FPCL_SR_SUITE.setPriorityFilter(this.value)"
                    class="w-full pl-2.5 pr-7 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-purple-600 rounded-xl text-xs font-bold text-slate-800 shadow-2xs transition-all cursor-pointer outline-none appearance-none truncate"
                    title="Filter by Priority (Column G)"
                  >
                    <option value="all" ${this.state.priorityFilter === 'all' ? 'selected' : ''}>All Priorities</option>
                    ${availablePriorities.map(p => `
                      <option value="${this.escapeHtml(p)}" ${this.state.priorityFilter.toLowerCase() === p.toLowerCase() ? 'selected' : ''}>Priority: ${this.escapeHtml(p)}</option>
                    `).join('')}
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                  </div>
                </div>
              </div>

              <!-- Filter 4: Notification_Status from Column I -->
              <div class="min-w-0">
                <div class="relative">
                  <select
                    id="filter-sr-status"
                    onchange="FPCL_SR_SUITE.setStatusFilter(this.value)"
                    class="w-full pl-2.5 pr-7 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-purple-600 rounded-xl text-xs font-bold text-slate-800 shadow-2xs transition-all cursor-pointer outline-none appearance-none truncate"
                    title="Filter by Notification_Status (Column I)"
                  >
                    <option value="all" ${this.state.statusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
                    <option value="closed" ${this.state.statusFilter === 'closed' ? 'selected' : ''}>Closed</option>
                    <option value="open" ${this.state.statusFilter === 'open' ? 'selected' : ''}>Open</option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                  </div>
                </div>
              </div>

            </div>
          </div>


          <!-- ========================================================================= -->
          <!-- 4. TWO SIDE-BY-SIDE VISUALS WITH PERIMETER BORDERS & UNIQUE COLOR SCHEMES -->
          <!-- Visual 1: Horizontal Stack Bar Chart (SR open/Close status)                -->
          <!-- Visual 2: Donut Chart (SRs created by individual)                         -->
          <!-- Solid colors only: Closed = #0B8A5A, Open = #DC2626, Total = #1D4ED8      -->
          <!-- ========================================================================= -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            <!-- VISUAL 1: HORIZONTAL STACK BAR CHART -->
            <!-- Perimeter Border: Royal Blue Perimeter Edge -->
            <div
              class="bg-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 flex flex-col justify-between"
              style="border: 2px solid #1D4ED8;"
            >
              <!-- Chart Header: Heading only, no text detail below -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                <h3 class="text-sm sm:text-base font-black text-[#1E293B] tracking-tight m-0" style="font-size: 14px;">
                  SR open/Close status
                </h3>

                <!-- Legend chips with light tinted backgrounds -->
                <div class="flex flex-wrap items-center gap-1.5 font-bold" style="font-size: 11px;">
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-[#1E3A8A] border border-blue-200">
                    <span class="w-2.5 h-2.5 rounded-xs bg-[#1D4ED8]"></span>
                    <span>Total</span>
                  </span>
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-[#0B8A5A] border border-emerald-200">
                    <span class="w-2.5 h-2.5 rounded-xs bg-[#0B8A5A]"></span>
                    <span>Closed</span>
                  </span>
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-50 text-[#DC2626] border border-red-200">
                    <span class="w-2.5 h-2.5 rounded-xs bg-[#DC2626]"></span>
                    <span>Open</span>
                  </span>
                </div>
              </div>

              <!-- SVG Horizontal Stacked Bar Chart -->
              <div class="w-full overflow-x-auto min-h-[260px] flex items-center justify-center">
                ${this.renderHorizontalStackChart(priorityStats)}
              </div>
            </div>


            <!-- VISUAL 2: DONUT CHART (SRs created by individual) -->
            <!-- Perimeter Border: Vivid Violet / Purple Perimeter Edge -->
            <div
              class="bg-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 flex flex-col justify-between"
              style="border: 2px solid #7C3AED;"
            >
              <!-- Donut Header: Heading only, no text detail below -->
              <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 class="text-sm sm:text-base font-black text-[#1E293B] tracking-tight m-0" style="font-size: 14px;">
                  SRs created by individual
                </h3>
              </div>

              <!-- Thick Large Donut Chart with Centered Text Fitting Inside without overlapping -->
              <div class="flex-1 flex flex-col items-center justify-center py-2">
                ${this.renderIndividualDonut(creatorStats, kpis.total)}
              </div>

              <!-- Legends at bottom with heading SRs created by individual -->
              <div class="pt-2.5 border-t border-slate-100">
                <div class="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2 text-center">
                  SRs created by individual
                </div>
                <div class="flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
                  ${creatorStats.length === 0 ? `
                    <span class="text-slate-400 text-xs">No records available</span>
                  ` : creatorStats.map(c => `
                    <span class="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs hover:bg-slate-100 transition-colors">
                      <span class="w-3 h-3 rounded-xs shrink-0" style="background-color: ${c.color};"></span>
                      <span class="text-slate-800">${this.escapeHtml(c.creator)}:</span>
                      <span class="font-mono text-slate-900 font-extrabold">${c.count} (${c.pctStr})</span>
                    </span>
                  `).join('')}
                </div>
              </div>
            </div>

          </div>


          <!-- ========================================================================= -->
          <!-- 5. COMPLETE SCROLLABLE EXCEL TABLE (UP/DOWN AND LEFT/RIGHT)                -->
          <!-- Left / Right scroll buttons for lengthy sheets                            -->
          <!-- Text wrap for long cells (Description, Problem Statement)                 -->
          <!-- Perimeter Border with unique color scheme                                 -->
          <!-- ========================================================================= -->
          <div
            class="bg-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3"
            style="border: 2px solid #0EA5E9;"
          >
            <!-- Table Header Toolbar -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                  <i data-lucide="table" class="w-4 h-4"></i>
                </div>
                <h3 class="text-sm sm:text-base font-black text-[#1E293B] tracking-tight m-0">
                  Safety Review (SR) Data Records (${filteredData.length} Rows)
                </h3>
              </div>

              <!-- Right: Scroll Buttons & Columns Indicator -->
              <div class="flex items-center gap-2 self-end sm:self-auto">
                <div class="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onclick="FPCL_SR_SUITE.scrollTable('left')"
                    class="p-1.5 rounded text-slate-700 hover:text-slate-900 hover:bg-white transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                    title="Scroll left"
                  >
                    <i data-lucide="chevron-left" class="w-4 h-4"></i>
                    <span class="hidden sm:inline">Scroll Left</span>
                  </button>
                  <button
                    type="button"
                    onclick="FPCL_SR_SUITE.scrollTable('right')"
                    class="p-1.5 rounded text-slate-700 hover:text-slate-900 hover:bg-white transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                    title="Scroll right"
                  >
                    <span class="hidden sm:inline">Scroll Right</span>
                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Scrollable Table Box: up/down & left/right scrollable -->
            <div
              id="sr-table-container"
              class="w-full overflow-x-auto overflow-y-auto max-h-[520px] rounded-xl border border-slate-200 bg-white shadow-inner"
            >
              <table class="w-full text-left border-collapse text-xs select-text">
                <thead class="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 shadow-2xs">
                  <tr class="text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap">
                    <th class="py-3 px-3.5 bg-blue-50/80 text-blue-950 border-r border-slate-200 text-center">ID</th>
                    <th class="py-3 px-3.5 bg-blue-50/80 text-blue-950 border-r border-slate-200">Notification</th>
                    <th class="py-3 px-3.5 bg-purple-50/80 text-purple-950 border-r border-slate-200">Date</th>
                    <th class="py-3 px-3.5 bg-purple-50/80 text-purple-950 border-r border-slate-200">Created_By</th>
                    <th class="py-3 px-4 border-r border-slate-200 min-w-[240px]">Description</th>
                    <th class="py-3 px-4 border-r border-slate-200 min-w-[320px]">Problem_Statement</th>
                    <th class="py-3 px-3.5 border-r border-slate-200 text-center">Priority</th>
                    <th class="py-3 px-3.5 border-r border-slate-200">Received / Not_Received_by_Technical</th>
                    <th class="py-3 px-3.5 text-center bg-slate-200/60 font-black">Notification_Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-800">
                  ${filteredData.length === 0 ? `
                    <tr>
                      <td colspan="9" class="py-12 text-center text-slate-400 font-medium">
                        No SR records matched your filter criteria.
                      </td>
                    </tr>
                  ` : filteredData.map((r, idx) => {
                    const closed = this.isClosed(r.notificationStatus);
                    const isUrgent = String(r.priority || '').trim().toLowerCase() === 'urgent';

                    return `
                      <tr class="hover:bg-slate-50/90 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}">
                        <!-- 1. ID -->
                        <td class="py-2.5 px-3.5 font-mono font-bold text-center text-blue-900 whitespace-nowrap border-r border-slate-200 bg-blue-50/30">
                          ${this.escapeHtml(r.id || '-')}
                        </td>
                        <!-- 2. Notification -->
                        <td class="py-2.5 px-3.5 font-mono font-bold text-slate-800 whitespace-nowrap border-r border-slate-200">
                          ${this.escapeHtml(r.notification || '-')}
                        </td>
                        <!-- 3. Date -->
                        <td class="py-2.5 px-3.5 font-medium text-slate-700 whitespace-nowrap border-r border-slate-200">
                          ${this.escapeHtml(r.date || '-')}
                        </td>
                        <!-- 4. Created_By -->
                        <td class="py-2.5 px-3.5 font-bold text-purple-950 whitespace-nowrap border-r border-slate-200 bg-purple-50/20">
                          ${this.escapeHtml(r.createdBy || '-')}
                        </td>
                        <!-- 5. Description (Wrapped) -->
                        <td class="py-2.5 px-4 text-slate-800 break-words whitespace-normal border-r border-slate-200 leading-relaxed max-w-sm">
                          ${this.escapeHtml(r.description || '-')}
                        </td>
                        <!-- 6. Problem_Statement (Wrapped) -->
                        <td class="py-2.5 px-4 text-slate-700 break-words whitespace-pre-line border-r border-slate-200 leading-relaxed max-w-md">
                          ${this.escapeHtml(r.problemStatement || '-')}
                        </td>
                        <!-- 7. Priority -->
                        <td class="py-2.5 px-3.5 text-center whitespace-nowrap border-r border-slate-200">
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black ${isUrgent ? 'bg-rose-100 text-[#E11D48] border border-rose-300' : 'bg-slate-100 text-slate-700 border border-slate-300'}">
                            ${this.escapeHtml(r.priority || 'Normal')}
                          </span>
                        </td>
                        <!-- 8. Received / Not_Received_by_Technical -->
                        <td class="py-2.5 px-3.5 text-slate-700 whitespace-nowrap border-r border-slate-200">
                          ${this.escapeHtml(r.receivedByTechnical || '-')}
                        </td>
                        <!-- 9. Notification_Status -->
                        <td class="py-2.5 px-3.5 text-center whitespace-nowrap">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black ${closed ? 'bg-emerald-100 text-[#0B8A5A] border border-emerald-300' : 'bg-red-100 text-[#DC2626] border border-red-300'}">
                            ${this.escapeHtml(r.notificationStatus || 'Open')}
                          </span>
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

      if (window.lucide) {
        window.lucide.createIcons();
      }
    },

    /**
     * Render SVG Horizontal Stack Bar Chart:
     * Heading: "SR open/Close status"
     * Solid colors only:
     * Closed = #0B8A5A (Green)
     * Open = #DC2626 (Red)
     * Total = #1D4ED8 (Blue), text in navy #1E3A8A
     * Green at left/bottom, red on top/outer end with slightly rounded corners
     * White percentage labels inside bars
     * Number relevant to bar written inside bar, total number written outside bar
     * White rounded tooltips with a blue top border
     * Light grey dashed horizontal gridlines on plain white background
     * Font size: 12px
     */
    renderHorizontalStackChart(stats) {
      if (!stats || stats.length === 0) {
        return `
          <div class="h-48 flex items-center justify-center text-slate-400 text-xs">
            No SR status data available.
          </div>
        `;
      }

      const COLOR_CLOSED = '#0B8A5A'; // Solid green
      const COLOR_OPEN = '#DC2626';   // Solid red
      const COLOR_TOTAL = '#1D4ED8';  // Solid blue
      const COLOR_NAVY = '#1E3A8A';

      const width = 560;
      const barH = 24;
      const gap = 18;
      const padL = 130;
      const padR = 50;
      const padT = 20;
      const padB = 30;

      const plotW = width - padL - padR;
      const height = padT + (stats.length * (barH + gap)) + padB;

      const maxTotal = Math.max(...stats.map(d => d.total), 1);
      const xMax = Math.max(1, maxTotal);

      // Light grey dashed horizontal gridlines
      const gridTicks = [0, Math.ceil(xMax * 0.25), Math.ceil(xMax * 0.5), Math.ceil(xMax * 0.75), xMax];
      const uniqueTicks = Array.from(new Set(gridTicks));

      const gridSvg = uniqueTicks.map(t => {
        const xPos = padL + (t / xMax) * plotW;
        return `
          <line x1="${xPos}" y1="${padT}" x2="${xPos}" y2="${height - padB}" stroke="#E2E8F0" stroke-width="1.2" stroke-dasharray="4 4"/>
          <text x="${xPos}" y="${height - padB + 16}" fill="#64748B" font-size="11" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="bold" text-anchor="middle">${t}</text>
        `;
      }).join('');

      const barsSvg = stats.map((item, idx) => {
        const yPos = padT + idx * (barH + gap);
        const closedW = (item.closed / xMax) * plotW;
        const openW = (item.open / xMax) * plotW;
        const totalW = (item.total / xMax) * plotW;

        const closedPct = item.total > 0 ? Math.round((item.closed / item.total) * 100) : 0;
        const openPct = item.total > 0 ? Math.round((item.open / item.total) * 100) : 0;

        const cornerR = 4;
        let barMarkup = '';

        if (item.closed > 0 && item.open > 0) {
          barMarkup = `
            <!-- Green base segment (#0B8A5A) -->
            <rect x="${padL}" y="${yPos}" width="${closedW}" height="${barH}" fill="${COLOR_CLOSED}" rx="${item.open === 0 ? cornerR : 0}" class="transition-opacity hover:opacity-90"/>
            ${closedW >= 24 ? `<text x="${padL + closedW / 2}" y="${yPos + barH / 2 + 4}" fill="#FFFFFF" font-size="12" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="middle" pointer-events="none">${item.closed} (${closedPct}%)</text>` : ''}
            <!-- Red outer segment (#DC2626) with slightly rounded outer corners -->
            <rect x="${padL + closedW}" y="${yPos}" width="${openW}" height="${barH}" fill="${COLOR_OPEN}" rx="${cornerR}" class="transition-opacity hover:opacity-90"/>
            ${openW >= 24 ? `<text x="${padL + closedW + openW / 2}" y="${yPos + barH / 2 + 4}" fill="#FFFFFF" font-size="12" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="middle" pointer-events="none">${item.open} (${openPct}%)</text>` : ''}
          `;
        } else if (item.closed > 0) {
          barMarkup = `
            <rect x="${padL}" y="${yPos}" width="${closedW}" height="${barH}" fill="${COLOR_CLOSED}" rx="${cornerR}" class="transition-opacity hover:opacity-90"/>
            ${closedW >= 24 ? `<text x="${padL + closedW / 2}" y="${yPos + barH / 2 + 4}" fill="#FFFFFF" font-size="12" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="middle" pointer-events="none">${item.closed} (${closedPct}%)</text>` : ''}
          `;
        } else if (item.open > 0) {
          barMarkup = `
            <rect x="${padL}" y="${yPos}" width="${openW}" height="${barH}" fill="${COLOR_OPEN}" rx="${cornerR}" class="transition-opacity hover:opacity-90"/>
            ${openW >= 24 ? `<text x="${padL + openW / 2}" y="${yPos + barH / 2 + 4}" fill="#FFFFFF" font-size="12" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="middle" pointer-events="none">${item.open} (${openPct}%)</text>` : ''}
          `;
        }

        // Native SVG Title Tooltip with requested layout
        const tooltipStr = `${item.priority}:\n• Total: ${item.total}\n• Closed (Green): ${item.closed} (${closedPct}%)\n• Open (Red): ${item.open} (${openPct}%)`;

        return `
          <g class="group cursor-pointer">
            <title>${tooltipStr}</title>
            <!-- Label (12 font size) -->
            <text x="${padL - 12}" y="${yPos + barH / 2 + 4}" fill="#1E293B" font-size="12" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="end">
              ${this.escapeHtml(item.priority)}
            </text>
            <!-- Stacked bar segments -->
            ${barMarkup}
            <!-- Total count label outside on far right (navy #1E3A8A) -->
            <text x="${padL + totalW + 8}" y="${yPos + barH / 2 + 4}" fill="${COLOR_NAVY}" font-size="12" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900">
              ${item.total}
            </text>
          </g>
        `;
      }).join('');

      return `
        <svg viewBox="0 0 ${width} ${height}" class="w-full h-auto select-none overflow-visible">
          <!-- Plain white background -->
          <rect width="${width}" height="${height}" fill="#FFFFFF" rx="8"/>
          <!-- Grid lines -->
          ${gridSvg}
          <!-- Vertical Base line -->
          <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${height - padB}" stroke="#64748B" stroke-width="2"/>
          <!-- Bars -->
          ${barsSvg}
        </svg>
      `;
    },

    /**
     * Render Thick, Large Donut Chart:
     * Heading: SRs created by individual
     * Thick visually appealing geometry, text fits comfortably inside without overlapping
     */
    renderIndividualDonut(stats, total) {
      if (!stats || stats.length === 0 || total === 0) {
        return `
          <div class="h-56 flex items-center justify-center text-slate-400 text-xs">
            No creator records available.
          </div>
        `;
      }

      const radius = 70;
      const circumference = 2 * Math.PI * radius;

      let accumulatedLen = 0;
      const segmentsSvg = stats.map(s => {
        const segLen = (s.pct / 100) * circumference;
        const offset = -accumulatedLen;
        accumulatedLen += segLen;

        return `
          <circle
            cx="100" cy="100" r="${radius}" fill="transparent"
            stroke="${s.color}" stroke-width="28"
            stroke-dasharray="${segLen} ${circumference - segLen}"
            stroke-dashoffset="${offset}"
            class="transition-all duration-500 hover:opacity-90 cursor-pointer"
          >
            <title>${this.escapeHtml(s.creator)}: ${s.count} SRs (${s.pctStr})</title>
          </circle>
        `;
      }).join('');

      return `
        <div class="relative flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 mx-auto">
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            <!-- Background track circle -->
            <circle cx="100" cy="100" r="${radius}" fill="transparent" stroke="#F1F5F9" stroke-width="27"></circle>
            <!-- Colored Donut Segments -->
            ${segmentsSvg}
          </svg>

          <!-- Inside Donut Center: Large font, center aligned, fitting comfortably inside without overlapping -->
          <div class="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none px-4">
            <span class="text-3xl sm:text-4xl lg:text-[44px] font-black font-mono tracking-tight text-[#1E293B] leading-none">
              ${total}
            </span>
            <span class="text-[11px] sm:text-xs font-black text-slate-500 uppercase tracking-widest mt-1.5 leading-none">
              TOTAL SRs
            </span>
            <span class="text-[10px] font-bold text-slate-400 font-mono mt-1">
              ${stats.length} ${stats.length === 1 ? 'Creator' : 'Creators'}
            </span>
          </div>
        </div>
      `;
    },

    toggleSettingsModal() {
      const modal = document.getElementById('integration-modal');
      if (modal) {
        const input = document.getElementById('sheet-url-input');
        if (input) {
          input.value = SR_CSV_URL;
        }
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
    },

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };

  srSuite.init();
})();
