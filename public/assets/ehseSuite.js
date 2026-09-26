/**
 * FPCL Executive Operations & Compliance Portal
 * EHSE (Executive HSE Committee) Executive BI Suite
 * 
 * Google Sheet ID: 1I4oX4kPr6d0_7q--9OcoJWs0W7IQG1dK1rBmNO7BlGo
 * Sheet Tab: EHSE
 * 
 * Features:
 * - Real-time zero-cache live Google Sheets synchronization
 * - Eye-catching top gradient banner (heading and important feature buttons only)
 * - Unique colorful perimeter lines on each visual card and KPI card
 * - 4 Executive KPI cards: Total observation, Closed observations column H, Open observations column H (RED color), Percentage completion
 *   (Strictly only KPI heading and value, center aligned, no other details)
 * - Multi-dimensional drilldown filters below KPIs: Column C (Year from Date of Meeting), Column D (Ref. #), Column G (Responsibility Dept), Column H (Status)
 *   (No heading to filter banner)
 * - Horizontal Stacked Bar Chart with font-size 12 values on bar with total open (red) and close (emerald) observation for each department
 * - Large Donut Chart engineered so text in both laptop and mobile view fits inside without overlapping the donut (thicker donut ring)
 * - Complete scrollable up-down and left-right Excel sheet in form of table with all Columns A through I
 * - Navigation buttons for left-right scrolling lengthy sheet
 * - Distinct visual grouping for Column A (Meeting ID)
 * - Filter-based CSV export
 */

(function () {
  'use strict';

  const EHSE_SHEET_ID = '1I4oX4kPr6d0_7q--9OcoJWs0W7IQG1dK1rBmNO7BlGo';
  const EHSE_SHEET_TAB = 'EHSE';
  const EHSE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${EHSE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${EHSE_SHEET_TAB}`;

  const ehseSuite = {
    state: {
      searchQuery: '',
      yearFilter: 'all',    // Column C: Year from Date of Meeting
      refFilter: 'all',     // Column D: Ref. #
      deptFilter: 'all',    // Column G: Responsibility Department (Action by)
      statusFilter: 'all',  // Column H: Status (Open / Close)
      isSyncing: false,
      lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      selectedObservation: null,
      isSettingsOpen: false
    },

    init() {
      window.FPCL_EHSE_SUITE = this;

      // Fast cache retrieval
      try {
        const cached = localStorage.getItem('FPCL_EHSE_CACHE');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.FPCL_EHSE_DATA = parsed;
          }
        }
      } catch (e) {}

      // Fallback to initial seed if empty
      if (!window.FPCL_EHSE_DATA || window.FPCL_EHSE_DATA.length === 0) {
        if (window.FPCL_EHSE_INITIAL_SEED) {
          window.FPCL_EHSE_DATA = window.FPCL_EHSE_INITIAL_SEED;
        }
      }

      // Propagate live stats to overview portal registry
      this.syncStatsToOverview();

      // Trigger automatic live Google Sheets sync
      setTimeout(() => {
        this.syncLiveFeed({ silent: true });
      }, 500);

      // Periodic auto-sync every 45 seconds so live sheet updates reflect immediately
      if (!this._autoSyncTimer) {
        this._autoSyncTimer = setInterval(() => {
          this.syncLiveFeed({ silent: true });
        }, 45000);
      }
    },

    getRawData() {
      if (Array.isArray(window.FPCL_EHSE_DATA) && window.FPCL_EHSE_DATA.length > 0) {
        return window.FPCL_EHSE_DATA;
      }
      if (Array.isArray(window.FPCL_EHSE_INITIAL_SEED) && window.FPCL_EHSE_INITIAL_SEED.length > 0) {
        return window.FPCL_EHSE_INITIAL_SEED;
      }
      return [];
    },

    // Extraction of Year from Column C: Date of Meeting
    extractYearFromDate(dateStr) {
      if (!dateStr) return '';
      const str = String(dateStr).trim();
      if (!str || str === '-' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') return '';

      // Check for 4-digit year (e.g. 2024, 2025, 2026)
      const fourDigitMatch = str.match(/\b(19\d\d|20\d\d)\b/);
      if (fourDigitMatch) return fourDigitMatch[1];

      // Check for 2-digit year at end (e.g. 23-Apr-25, 12/12/25, 4-Jun-24, 23-04-25)
      const twoDigitEndMatch = str.match(/(?:[-/.\s])(\d{2})$/);
      if (twoDigitEndMatch) {
        const yr2 = parseInt(twoDigitEndMatch[1], 10);
        return String(yr2 >= 50 ? 1900 + yr2 : 2000 + yr2);
      }

      // Check for 2-digit year at beginning (e.g. 25-04-23)
      const twoDigitStartMatch = str.match(/^(\d{2})[-/.]\d{1,2}[-/.]\d{1,2}$/);
      if (twoDigitStartMatch) {
        const yr2 = parseInt(twoDigitStartMatch[1], 10);
        return String(yr2 >= 50 ? 1900 + yr2 : 2000 + yr2);
      }

      // Try Date.parse
      const parsedTime = Date.parse(str);
      if (!isNaN(parsedTime)) {
        const d = new Date(parsedTime);
        const yr = d.getFullYear();
        if (yr >= 1990 && yr <= 2099) return String(yr);
      }

      return '';
    },

    getItemYear(item) {
      if (!item) return '';
      if (item.year) return String(item.year);
      return this.extractYearFromDate(item.dateOfMeeting);
    },

    // Helper to evaluate item status (instruction: count point as open if empty cell is found)
    isItemClosed(item) {
      if (!item) return false;
      const s = String(item.openClose || '').trim().toLowerCase();
      return s === 'close' || s.includes('close') || s.includes('complete') || s.includes('done');
    },

    getItemStatus(item) {
      return this.isItemClosed(item) ? 'Close' : 'Open';
    },

    getFilteredData() {
      const raw = this.getRawData();
      const s = this.state;
      const q = (s.searchQuery || '').trim().toLowerCase();

      return raw.filter(item => {
        // Column C Filter: Year from Date of Meeting
        if (s.yearFilter !== 'all') {
          const itemYear = this.getItemYear(item);
          if (s.yearFilter === 'unknown') {
            if (itemYear) return false;
          } else if (itemYear !== s.yearFilter) {
            return false;
          }
        }

        // Column D Filter: Ref. #
        if (s.refFilter !== 'all' && item.refNo !== s.refFilter) {
          return false;
        }

        // Column G Filter: Responsibility Department (Action by)
        if (s.deptFilter !== 'all' && item.actionBy !== s.deptFilter) {
          return false;
        }

        // Column H Filter: Status (Open / Close) - Empty cell counts as Open
        if (s.statusFilter !== 'all') {
          const itemStatus = this.getItemStatus(item).toLowerCase();
          const targetStatus = s.statusFilter.toLowerCase();
          if (itemStatus !== targetStatus) {
            return false;
          }
        }

        // Search Query (across ID, Subject, Date, Ref, Agenda, Recommendations, Action by, Status, Remarks)
        if (q) {
          const text = [
            item.id,
            item.subject,
            item.dateOfMeeting,
            item.refNo,
            item.agenda,
            item.recommendations,
            item.actionBy,
            this.getItemStatus(item),
            item.remarks
          ].join(' ').toLowerCase();

          if (!text.includes(q)) {
            return false;
          }
        }

        return true;
      });
    },

    // Sync live counts to Overview page cards and comparison chart
    syncStatsToOverview() {
      const raw = this.getRawData();
      if (!raw || raw.length === 0) return;

      const total = raw.length;
      const closed = raw.filter(i => this.isItemClosed(i)).length;
      const open = total - closed;
      const rate = total > 0 ? ((closed / total) * 100).toFixed(1) + '%' : '0.0%';

      if (window.DASHBOARD_REGISTRY) {
        const ehseEntry = window.DASHBOARD_REGISTRY.find(d => d.id === 'executive-hse-committee-ehsec' || d.id === 'ehse');
        if (ehseEntry) {
          ehseEntry.status = 'Active';
          ehseEntry.hasSheetLink = true;
          ehseEntry.kpis = { total, closed, inProgress: open, overdue: 0, compliance: rate };
          ehseEntry.punchList = { open, closed, total, rate };
          ehseEntry.statusComment = `Live Google Sheets: EHSE Tab (${total} Observations, ${closed} Closed, ${open} Open • ${rate} Resolved)`;
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
      }
    },

    // Live Google Sheets synchronization
    async syncLiveFeed(opts = {}) {
      const silent = !!opts.silent;
      this.state.isSyncing = true;
      this.updateSyncUI();

      try {
        let csvText = '';

        // Priority 1: Direct CORS-free fetch from Google Sheets CSV GViz
        try {
          const directUrl = `${EHSE_SHEET_URL}&_nocache=${Date.now()}`;
          const directRes = await fetch(directUrl, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache, no-store' }
          });
          if (directRes.ok) {
            const txt = await directRes.text();
            if (txt && !txt.includes('<!DOCTYPE html>') && txt.includes(',')) {
              csvText = txt;
            }
          }
        } catch (e) {}

        // Priority 2: Server API endpoint proxy
        if (!csvText) {
          try {
            const apiRes = await fetch(`/api/sheets/fetch?sheetTab=${encodeURIComponent(EHSE_SHEET_TAB)}&_t=${Date.now()}`, {
              cache: 'no-store'
            });
            if (apiRes.ok) {
              const json = await apiRes.json();
              if (json && json.csvText) {
                csvText = json.csvText;
              }
            }
          } catch (e) {}
        }

        // Priority 3: Global fetchGoogleSheetData helper if available
        if (!csvText && typeof window.fetchGoogleSheetData === 'function') {
          try {
            csvText = await window.fetchGoogleSheetData(EHSE_SHEET_URL, {
              sheetTab: EHSE_SHEET_TAB
            });
          } catch (e) {}
        }

        if (csvText && typeof window.parseEhseCSV === 'function') {
          const parsed = window.parseEhseCSV(csvText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.FPCL_EHSE_DATA = parsed;
            try {
              localStorage.setItem('FPCL_EHSE_CACHE', JSON.stringify(parsed));
            } catch (e) {}

            this.state.lastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            this.syncStatsToOverview();

            if (!silent && window.portalApp && window.portalApp.showToast) {
              window.portalApp.showToast(
                'EHSE Synced',
                `Synchronized ${parsed.length} observations live from Google Sheet.`,
                'success'
              );
            }
          }
        }
      } catch (err) {
        console.warn('EHSE sync warning:', err);
      } finally {
        this.state.isSyncing = false;
        this.updateSyncUI();
        const container = document.getElementById('ehse-specialized-container');
        if (container && !container.classList.contains('hidden')) {
          this.render();
        }
      }
    },

    updateSyncUI() {
      const icon = document.getElementById('ehse-sync-icon');
      if (icon) {
        if (this.state.isSyncing) {
          icon.classList.add('animate-spin');
        } else {
          icon.classList.remove('animate-spin');
        }
      }
    },

    // Filter mutators - apply globally across all visuals
    setYearFilter(val) {
      this.state.yearFilter = val;
      this.render();
    },

    setRefFilter(val) {
      this.state.refFilter = val;
      this.render();
    },

    setDeptFilter(val) {
      this.state.deptFilter = val;
      this.render();
    },

    setStatusFilter(val) {
      this.state.statusFilter = val;
      this.render();
    },

    setSearchQuery(val) {
      this.state.searchQuery = val;
      this.render();
    },

    clearSearch() {
      this.state.searchQuery = '';
      this.render();
    },

    resetFilters() {
      this.state.searchQuery = '';
      this.state.yearFilter = 'all';
      this.state.refFilter = 'all';
      this.state.deptFilter = 'all';
      this.state.statusFilter = 'all';
      this.render();
      if (window.portalApp && window.portalApp.showToast) {
        window.portalApp.showToast('Filters Reset', 'All EHSE filters restored to default.', 'info');
      }
    },

    // Table Scrolling Helpers for Left-Right browsing
    scrollTable(delta) {
      const el = document.getElementById('ehse-table-scroller');
      if (el) {
        el.scrollBy({ left: delta, behavior: 'smooth' });
      }
    },

    scrollToStart() {
      const el = document.getElementById('ehse-table-scroller');
      if (el) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      }
    },

    scrollToEnd() {
      const el = document.getElementById('ehse-table-scroller');
      if (el) {
        el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
      }
    },

    // Export CSV strictly based on currently active filters
    exportFilteredCSV() {
      const filtered = this.getFilteredData();
      if (!filtered || filtered.length === 0) {
        if (window.portalApp && window.portalApp.showToast) {
          window.portalApp.showToast('Export Notice', 'No observations match the current filter criteria.', 'warning');
        }
        return;
      }

      const headers = [
        'ID',
        'Subject',
        'Date of Meeting',
        'Ref. #',
        'Agenda',
        'Recommendations',
        'Action by',
        'Open Close',
        'Remarks'
      ];

      const rows = filtered.map(item => [
        `"${String(item.id || '').replace(/"/g, '""')}"`,
        `"${String(item.subject || '').replace(/"/g, '""')}"`,
        `"${String(item.dateOfMeeting || '').replace(/"/g, '""')}"`,
        `"${String(item.refNo || '').replace(/"/g, '""')}"`,
        `"${String(item.agenda || '').replace(/"/g, '""')}"`,
        `"${String(item.recommendations || '').replace(/"/g, '""')}"`,
        `"${String(item.actionBy || '').replace(/"/g, '""')}"`,
        `"${String(item.openClose || '').replace(/"/g, '""')}"`,
        `"${String(item.remarks || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `EHSE_Observations_Filtered_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (window.portalApp && window.portalApp.showToast) {
        window.portalApp.showToast(
          'CSV Exported',
          `Successfully exported ${filtered.length} filtered EHSE observations.`,
          'success'
        );
      }
    },

    // Modal Inspection for Observation item
    inspectObservation(sr) {
      const raw = this.getRawData();
      const item = raw.find(i => String(i.sr) === String(sr));
      if (!item) return;

      this.state.selectedObservation = item;
      const modalContainer = document.getElementById('ehse-inspection-modal');
      if (modalContainer) {
        modalContainer.innerHTML = this.renderInspectionModalContent(item);
        modalContainer.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
      }
    },

    closeInspectionModal() {
      this.state.selectedObservation = null;
      const modalContainer = document.getElementById('ehse-inspection-modal');
      if (modalContainer) {
        modalContainer.classList.add('hidden');
        modalContainer.innerHTML = '';
      }
    },

    renderInspectionModalContent(item) {
      const isClose = this.isItemClosed(item);
      const displayStatus = this.getItemStatus(item);

      return `
        <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl border-2 border-teal-500/80 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <!-- Modal Header -->
            <div class="bg-gradient-to-r from-[#031B4E] via-[#0A3A60] via-[#0D5C75] via-[#0B7A75] to-[#10B981] text-white p-5 flex items-start justify-between">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/20 text-white border border-white/30">
                    Meeting ID: #${item.id}
                  </span>
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${isClose ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50' : 'bg-red-500/20 text-red-300 border-red-400/50'}">
                    ${displayStatus}
                  </span>
                </div>
                <h3 class="text-lg font-black tracking-tight text-white">${item.subject || 'EHSE Meeting'}</h3>
                <p class="text-xs text-teal-200 font-mono">Ref. #${item.refNo} • Date: ${item.dateOfMeeting}</p>
              </div>
              <button
                type="button"
                onclick="FPCL_EHSE_SUITE.closeInspectionModal()"
                class="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="Close"
              >
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>

            <!-- Modal Body Details -->
            <div class="p-6 space-y-4 text-slate-800 text-xs">
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Responsibility Dept</span>
                  <span class="font-black text-sm text-teal-950 mt-0.5 block">${item.actionBy || 'Info'}</span>
                </div>
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Status (Col H)</span>
                  <span class="font-black text-sm ${isClose ? 'text-emerald-600' : 'text-red-600'} mt-0.5 block">${displayStatus}</span>
                </div>
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Date of Meeting</span>
                  <span class="font-black text-sm text-slate-800 mt-0.5 block">${item.dateOfMeeting || '-'}</span>
                </div>
              </div>

              <!-- Agenda Section -->
              <div class="bg-teal-50/60 p-4 rounded-xl border border-teal-100">
                <span class="text-[10px] uppercase font-bold text-teal-800 block tracking-wider mb-1">Agenda Topic</span>
                <p class="text-xs leading-relaxed text-slate-800 font-semibold">${item.agenda || '-'}</p>
              </div>

              <!-- Recommendation Section -->
              <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">Recommendation / Observation Details</span>
                <p class="text-xs leading-relaxed text-slate-900 font-bold whitespace-pre-line">${item.recommendations || '-'}</p>
              </div>

              <!-- Remarks Section -->
              ${item.remarks ? `
                <div class="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                  <span class="text-[10px] uppercase font-bold text-amber-800 block tracking-wider mb-0.5">Remarks</span>
                  <p class="text-xs text-slate-700">${item.remarks}</p>
                </div>
              ` : ''}

              <!-- Meeting Context Note -->
              <div class="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <strong class="text-teal-900 font-bold">Meeting Note:</strong> All rows carrying Meeting ID <strong>#${item.id}</strong> originate from the same single EHSE meeting. Multiple departments had responsibility against this session, with distinct recommendations.
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onclick="FPCL_EHSE_SUITE.closeInspectionModal()"
                class="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      `;
    },

    // Settings Modal
    openSettingsModal() {
      this.state.isSettingsOpen = true;
      const modalContainer = document.getElementById('ehse-settings-modal');
      if (modalContainer) {
        modalContainer.innerHTML = `
          <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl border-2 border-teal-500/80 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div class="bg-gradient-to-r from-[#031B4E] via-[#0A3A60] via-[#0D5C75] via-[#0B7A75] to-[#10B981] text-white p-5 flex items-center justify-between">
                <div class="flex items-center gap-2 font-bold text-sm">
                  <i data-lucide="settings" class="w-4 h-4 text-emerald-300"></i>
                  <span>EHSE Google Sheet Integration</span>
                </div>
                <button
                  type="button"
                  onclick="FPCL_EHSE_SUITE.closeSettingsModal()"
                  class="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <i data-lucide="x" class="w-4 h-4"></i>
                </button>
              </div>

              <div class="p-6 space-y-4 text-xs text-slate-700">
                <div class="space-y-1">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Google Sheet ID</span>
                  <div class="p-2.5 rounded-xl bg-slate-100 font-mono text-[11px] text-slate-800 break-all select-all border border-slate-200 font-bold">
                    ${EHSE_SHEET_ID}
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Sheet Tab</span>
                    <div class="p-2.5 rounded-xl bg-slate-100 font-mono font-black text-[12px] text-teal-700 border border-slate-200">
                      ${EHSE_SHEET_TAB}
                    </div>
                  </div>
                  <div class="space-y-1">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Live Status</span>
                    <div class="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200 flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Connected & Active</span>
                    </div>
                  </div>
                </div>

                <div class="space-y-1">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Direct CSV Feed Link</span>
                  <a
                    href="${EHSE_SHEET_URL}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="block p-2.5 rounded-xl bg-teal-50/70 hover:bg-teal-100 font-mono text-[10px] text-teal-800 truncate border border-teal-200 transition-colors"
                    title="${EHSE_SHEET_URL}"
                  >
                    ${EHSE_SHEET_URL}
                  </a>
                </div>

                <div class="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                  Data synchronizes automatically from the public viewer Google Sheet tab <strong>EHSE</strong>. Click <strong>Sync Feed</strong> anytime to immediately pull the latest row additions.
                </div>
              </div>

              <div class="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onclick="FPCL_EHSE_SUITE.syncLiveFeed(); FPCL_EHSE_SUITE.closeSettingsModal();"
                  class="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                  <span>Sync Feed Now</span>
                </button>
                <button
                  type="button"
                  onclick="FPCL_EHSE_SUITE.closeSettingsModal()"
                  class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        `;
        modalContainer.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
      }
    },

    closeSettingsModal() {
      this.state.isSettingsOpen = false;
      const modalContainer = document.getElementById('ehse-settings-modal');
      if (modalContainer) {
        modalContainer.classList.add('hidden');
        modalContainer.innerHTML = '';
      }
    },

    /**
     * Horizontal Stacked Bar Chart with Font Size 12 Values on Bar
     * Shows Total, Open (Red), and Closed (Emerald) observation for each department (from Column G)
     */
    renderHorizontalStackedBarChart(deptList) {
      if (!deptList || deptList.length === 0) {
        return `<div class="text-center py-10 text-xs text-slate-400 font-medium">No department observation records match active filters</div>`;
      }

      const maxTotal = Math.max(...deptList.map(d => d.total), 1);
      const tickMax = Math.max(5, Math.ceil(maxTotal / 2) * 2);

      const w = 1000;
      const padLeft = 240;
      const padRight = 180;
      const padTop = 32;
      const padBottom = 48;
      const rowH = 54;
      const barH = 32;
      const chartW = w - padLeft - padRight;
      const h = padTop + deptList.length * rowH + padBottom;

      const barsSvg = deptList.map((d, i) => {
        const y = padTop + i * rowH;
        const barY = y + 11;
        const centerY = barY + barH / 2;
        const openW = (d.open / tickMax) * chartW;
        const closeW = (d.close / tickMax) * chartW;
        const totalW = (d.total / tickMax) * chartW;
        const isSelected = this.state.deptFilter === d.name;

        // Font size 12 values strictly placed on the bars
        let textSegments = '';

        if (d.close > 0) {
          const closeCenter = padLeft + closeW / 2;
          textSegments += `
            <text x="${closeCenter}" y="${centerY}" fill="#FFFFFF" font-size="12" font-weight="800" font-family="'Plus Jakarta Sans', system-ui, sans-serif" text-anchor="middle" dominant-baseline="central">
              ${d.close}
            </text>
          `;
        }

        if (d.open > 0) {
          const openCenter = padLeft + closeW + openW / 2;
          textSegments += `
            <text x="${openCenter}" y="${centerY}" fill="#FFFFFF" font-size="12" font-weight="800" font-family="'Plus Jakarta Sans', system-ui, sans-serif" text-anchor="middle" dominant-baseline="central">
              ${d.open}
            </text>
          `;
        }

        return `
          <g
            class="cursor-pointer group"
            onclick="FPCL_EHSE_SUITE.setDeptFilter('${this.state.deptFilter === d.name ? 'all' : d.name.replace(/'/g, "\\'")}')"
          >
            <title>${d.name}: Total ${d.total} (${d.close} Closed, ${d.open} Open • ${d.closureRate}% Resolved)</title>

            <!-- Row hover highlight -->
            <rect x="0" y="${y}" width="${w}" height="${rowH}" fill="${isSelected ? '#F0FDFA' : 'transparent'}" class="group-hover:fill-teal-50/70 transition-colors rounded-xl"/>

            <!-- Department Label (Column G) -->
            <text x="${padLeft - 16}" y="${centerY}" fill="${isSelected ? '#0F766E' : '#1E293B'}" font-size="13" font-weight="${isSelected ? '800' : '700'}" font-family="'Plus Jakarta Sans', system-ui, sans-serif" text-anchor="end" dominant-baseline="central" class="transition-colors group-hover:fill-teal-700">
              ${d.name}
            </text>

            <!-- Bar Background Track -->
            <rect x="${padLeft}" y="${barY}" width="${chartW}" height="${barH}" rx="7" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="1"/>

            <!-- Stacked Closed Segment (Vibrant Emerald) -->
            ${d.close > 0 ? `
              <rect
                x="${padLeft}"
                y="${barY}"
                width="${closeW}"
                height="${barH}"
                rx="${d.open > 0 ? '7 0 0 7' : '7'}"
                fill="#10B981"
                class="transition-all opacity-95 group-hover:opacity-100"
              />
            ` : ''}

            <!-- Stacked Open Segment (Vibrant Red - as explicitly instructed for open points) -->
            ${d.open > 0 ? `
              <rect
                x="${padLeft + closeW}"
                y="${barY}"
                width="${openW}"
                height="${barH}"
                rx="${d.close > 0 ? '0 7 7 0' : '7'}"
                fill="#EF4444"
                class="transition-all opacity-95 group-hover:opacity-100"
              />
            ` : ''}

            <!-- On-Bar Font-Size 12 Values -->
            ${textSegments}

            <!-- Total, Open, and Closed Summary Value Label on the right of the bar (Font size 12) -->
            <text x="${padLeft + totalW + 14}" y="${centerY}" fill="#1E293B" font-size="12" font-weight="800" font-family="'Plus Jakarta Sans', system-ui, sans-serif" dominant-baseline="central">
              ${d.total} Total (${d.close} Cl, ${d.open} Op)
            </text>
          </g>
        `;
      }).join('');

      // X-Axis gridlines and ticks
      const tickStep = Math.max(1, Math.round(tickMax / 5));
      const ticks = [];
      for (let t = 0; t <= tickMax; t += tickStep) {
        ticks.push(t);
      }

      const ticksSvg = ticks.map(t => {
        const x = padLeft + (t / tickMax) * chartW;
        return `
          <g>
            <line x1="${x}" y1="${padTop - 8}" x2="${x}" y2="${h - padBottom + 6}" stroke="#E2E8F0" stroke-dasharray="3,3" stroke-width="1"/>
            <text x="${x}" y="${h - padBottom + 22}" fill="#64748B" font-size="11" font-weight="700" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif">${t}</text>
          </g>
        `;
      }).join('');

      return `
        <svg viewBox="0 0 ${w} ${h}" class="w-full h-auto select-none" style="min-width: 650px;">
          ${ticksSvg}
          ${barsSvg}
        </svg>
      `;
    },

    /**
     * Large Donut Chart Engineered to Prevent Overlap in Both Laptop and Mobile Views
     * Thick donut ring (stroke-width: 32) looking visually appealing
     * Inner cutout diameter is large enough (260px+) that text scales cleanly without touching the ring
     */
    renderDonutChart(closedCount, openCount, totalCount) {
      if (totalCount === 0) {
        return `<div class="text-center py-12 text-xs text-slate-400 font-medium">No observation records to calculate</div>`;
      }

      // Large SVG viewport with spacious center radius (radius = 130, stroke = 32)
      const size = 380;
      const center = size / 2; // 190
      const radius = 130;
      const strokeWidth = 32;
      const circumference = 2 * Math.PI * radius; // ~816.8

      const closedPct = Math.round((closedCount / totalCount) * 100);
      const openPct = 100 - closedPct;

      const closedOffset = 0;
      const closedDash = (closedPct / 100) * circumference;

      const openOffset = -closedDash;
      const openDash = (openPct / 100) * circumference;

      return `
        <div class="flex flex-col items-center justify-center p-3 select-none w-full">
          <!-- Large Donut SVG Wrapper (Optimized for both mobile and laptop views) -->
          <div class="relative w-64 h-64 min-[400px]:w-72 min-[400px]:h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[400px] lg:h-[400px] shrink-0 mx-auto">
            <svg viewBox="0 0 ${size} ${size}" class="w-full h-full transform -rotate-90">
              <!-- Background Track Ring -->
              <circle
                cx="${center}"
                cy="${center}"
                r="${radius}"
                fill="none"
                stroke="#F1F5F9"
                stroke-width="${strokeWidth}"
              />
              <!-- Closed Observations Arc (Emerald) -->
              ${closedCount > 0 ? `
                <circle
                  cx="${center}"
                  cy="${center}"
                  r="${radius}"
                  fill="none"
                  stroke="#10B981"
                  stroke-width="${strokeWidth}"
                  stroke-dasharray="${closedDash} ${circumference}"
                  stroke-dashoffset="${closedOffset}"
                  class="transition-all duration-500 hover:opacity-90 cursor-pointer"
                  onclick="FPCL_EHSE_SUITE.setStatusFilter('${this.state.statusFilter === 'Close' ? 'all' : 'Close'}')"
                >
                  <title>Closed Observations: ${closedCount} (${closedPct}%)</title>
                </circle>
              ` : ''}
              <!-- Open Observations Arc (Vibrant Red for open points) -->
              ${openCount > 0 ? `
                <circle
                  cx="${center}"
                  cy="${center}"
                  r="${radius}"
                  fill="none"
                  stroke="#EF4444"
                  stroke-width="${strokeWidth}"
                  stroke-dasharray="${openDash} ${circumference}"
                  stroke-dashoffset="${openOffset}"
                  class="transition-all duration-500 hover:opacity-90 cursor-pointer"
                  onclick="FPCL_EHSE_SUITE.setStatusFilter('${this.state.statusFilter === 'Open' ? 'all' : 'Open'}')"
                >
                  <title>Open Observations: ${openCount} (${openPct}%)</title>
                </circle>
              ` : ''}

              <!-- Vector-embedded center text ensuring absolute zero overlap on any screen resolution -->
              <g class="transform rotate-90" style="transform-origin: ${center}px ${center}px;">
                <text
                  x="${center}"
                  y="${center - 16}"
                  text-anchor="middle"
                  dominant-baseline="central"
                  fill="#0F172A"
                  font-size="48"
                  font-weight="900"
                  font-family="'JetBrains Mono', 'Plus Jakarta Sans', monospace"
                  class="select-none"
                >
                  ${closedPct}%
                </text>
                <text
                  x="${center}"
                  y="${center + 24}"
                  text-anchor="middle"
                  dominant-baseline="central"
                  fill="#64748B"
                  font-size="13"
                  font-weight="900"
                  letter-spacing="2"
                  font-family="'Plus Jakarta Sans', system-ui, sans-serif"
                  class="select-none uppercase"
                >
                  COMPLETION
                </text>
                <text
                  x="${center}"
                  y="${center + 48}"
                  text-anchor="middle"
                  dominant-baseline="central"
                  fill="#059669"
                  font-size="12"
                  font-weight="800"
                  font-family="'Plus Jakarta Sans', system-ui, sans-serif"
                  class="select-none"
                >
                  ${closedCount} of ${totalCount} Closed
                </text>
              </g>
            </svg>
          </div>

          <!-- Interactive Donut Legend -->
          <div class="mt-4 flex items-center justify-center gap-3 sm:gap-4 flex-wrap text-xs">
            <button
              type="button"
              onclick="FPCL_EHSE_SUITE.setStatusFilter('${this.state.statusFilter === 'Close' ? 'all' : 'Close'}')"
              class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${this.state.statusFilter === 'Close' ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200 hover:bg-slate-50'}"
            >
              <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span class="font-bold text-slate-700">Closed:</span>
              <span class="font-mono font-black text-emerald-700">${closedCount}</span>
              <span class="text-slate-400 font-bold">(${closedPct}%)</span>
            </button>

            <button
              type="button"
              onclick="FPCL_EHSE_SUITE.setStatusFilter('${this.state.statusFilter === 'Open' ? 'all' : 'Open'}')"
              class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${this.state.statusFilter === 'Open' ? 'bg-red-50 border-red-400 ring-2 ring-red-500/20' : 'bg-white border-slate-200 hover:bg-slate-50'}"
            >
              <span class="w-3 h-3 rounded-full bg-red-500"></span>
              <span class="font-bold text-slate-700">Open:</span>
              <span class="font-mono font-black text-red-600">${openCount}</span>
              <span class="text-slate-400 font-bold">(${openPct}%)</span>
            </button>

            <button
              type="button"
              onclick="FPCL_EHSE_SUITE.setStatusFilter('all')"
              class="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all cursor-pointer ${this.state.statusFilter === 'all' ? 'bg-teal-50/70 border-teal-300 text-teal-800' : 'bg-white'}"
            >
              <span class="w-2 h-2 rounded-full bg-teal-500"></span>
              <span class="font-bold">Total:</span>
              <span class="font-mono font-black">${totalCount}</span>
            </button>
          </div>
        </div>
      `;
    },

    // Main Render function for the EHSE Dashboard
    render() {
      const container = document.getElementById('ehse-specialized-container');
      if (!container) return;

      const raw = this.getRawData();
      const filtered = this.getFilteredData();
      const s = this.state;

      // KPI metrics calculations strictly based on Column H: Open Close (empty cell counts as Open)
      const totalFiltered = filtered.length;
      const closedFiltered = filtered.filter(i => this.isItemClosed(i)).length;
      const openFiltered = totalFiltered - closedFiltered;
      const completionPct = totalFiltered > 0 ? ((closedFiltered / totalFiltered) * 100).toFixed(1) + '%' : '0.0%';

      // Department breakdown for Horizontal Stacked Bar Chart (Column G: Action by)
      const deptMap = {};
      filtered.forEach(item => {
        const d = (item.actionBy && item.actionBy.trim()) || 'Unassigned';
        if (!deptMap[d]) {
          deptMap[d] = { name: d, total: 0, closed: 0, open: 0 };
        }
        deptMap[d].total++;
        if (this.isItemClosed(item)) {
          deptMap[d].closed++;
        } else {
          deptMap[d].open++;
        }
      });

      const deptList = Object.values(deptMap)
        .map(d => ({
          name: d.name,
          total: d.total,
          close: d.closed,
          open: d.open,
          closureRate: d.total > 0 ? Math.round((d.closed / d.total) * 100) : 0
        }))
        .sort((a, b) => b.total - a.total);

      // Distinct options for filters from dataset
      const yearSet = new Set();
      let hasUnknownYear = false;
      raw.forEach(item => {
        const yr = this.getItemYear(item);
        if (yr) {
          yearSet.add(yr);
        } else {
          hasUnknownYear = true;
        }
      });
      const allYears = Array.from(yearSet).sort((a, b) => b.localeCompare(a));
      const allRefNumbers = Array.from(new Set(raw.map(i => i.refNo).filter(Boolean))).sort();
      const allDepartments = Array.from(new Set(raw.map(i => i.actionBy).filter(Boolean))).sort();
      const rawClosedCount = raw.filter(i => this.isItemClosed(i)).length;
      const rawOpenCount = raw.length - rawClosedCount;

      const isAnyFilterActive =
        (s.searchQuery && s.searchQuery.trim().length > 0) ||
        s.yearFilter !== 'all' ||
        s.refFilter !== 'all' ||
        s.deptFilter !== 'all' ||
        s.statusFilter !== 'all';

      container.innerHTML = `
        <div class="space-y-6 font-sans">

          <!-- ========================================================================= -->
          <!-- 1. Eye-Catching Gradient Banner at Top (Unique Colorful Perimeter Line)    -->
          <!-- Modern Stylish Color Scheme: Deep Ocean Navy & Emerald-Teal Gradient      -->
          <!-- Only heading & important feature buttons as strictly instructed           -->
          <!-- ========================================================================= -->
          <div class="bg-gradient-to-r from-[#031B4E] via-[#0A3A60] via-[#0D5C75] via-[#0B7A75] to-[#10B981] text-white rounded-2xl p-5 sm:p-6 shadow-xl border-2 border-teal-400/90 hover:border-teal-300 shadow-[0_6px_28px_rgba(20,184,166,0.25)] relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all">
            <div class="absolute -right-10 -bottom-10 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none"></div>

            <!-- Heading Only (No extra texts and details as strictly instructed) -->
            <div class="relative z-10 flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center text-teal-200 shrink-0 shadow-xs">
                <i data-lucide="shield-check" class="w-5 h-5"></i>
              </div>
              <h1 class="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">
                EHSE Executive Dashboard
              </h1>
            </div>

            <!-- Important Feature Buttons (Exact match to user image: SEARCH FINDINGS, Reset Filters, Export CSV, Sync Feed, Settings) -->
            <div class="relative z-10 flex items-center flex-wrap gap-2.5">
              
              <!-- SEARCH FINDINGS Button / Input Pill -->
              <div class="relative flex items-center">
                <div class="flex items-center bg-white/10 hover:bg-white/15 border border-white/35 rounded-xl px-3 py-1.5 backdrop-blur-md transition-all shadow-xs">
                  <i data-lucide="search" class="w-3.5 h-3.5 text-white/80 mr-2 shrink-0"></i>
                  <input
                    type="text"
                    value="${(s.searchQuery || '').replace(/"/g, '&quot;')}"
                    oninput="FPCL_EHSE_SUITE.setSearchQuery(this.value)"
                    placeholder="SEARCH FINDINGS"
                    class="bg-transparent text-white placeholder-white/75 text-xs font-black uppercase tracking-wider focus:outline-none w-36 sm:w-44"
                  />
                  ${s.searchQuery ? `
                    <button
                      type="button"
                      onclick="FPCL_EHSE_SUITE.clearSearch()"
                      class="text-white/70 hover:text-white ml-1 cursor-pointer"
                      title="Clear search"
                    >
                      <i data-lucide="x" class="w-3 h-3"></i>
                    </button>
                  ` : ''}
                </div>
              </div>

              <!-- Reset Filters Button -->
              <button
                type="button"
                onclick="FPCL_EHSE_SUITE.resetFilters()"
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide bg-white/10 hover:bg-white/20 text-white border border-white/35 backdrop-blur-md transition-all cursor-pointer shadow-xs active:scale-95"
                title="Reset all filters"
              >
                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-white/90"></i>
                <span>Reset Filters</span>
              </button>

              <!-- Export CSV Button (Based on active filter) -->
              <button
                type="button"
                onclick="FPCL_EHSE_SUITE.exportFilteredCSV()"
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide bg-white/10 hover:bg-white/20 text-white border border-white/35 backdrop-blur-md transition-all cursor-pointer shadow-xs active:scale-95"
                title="Download CSV based on active filter"
              >
                <i data-lucide="download" class="w-3.5 h-3.5 text-white/90"></i>
                <span>Export CSV</span>
              </button>

              <!-- Sync Feed Button -->
              <button
                type="button"
                onclick="FPCL_EHSE_SUITE.syncLiveFeed()"
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide bg-white/10 hover:bg-white/20 text-white border border-white/35 backdrop-blur-md transition-all cursor-pointer shadow-xs active:scale-95"
                title="Sync live from Google Sheet"
              >
                <i id="ehse-sync-icon" data-lucide="refresh-cw" class="w-3.5 h-3.5 text-white/90 ${s.isSyncing ? 'animate-spin' : ''}"></i>
                <span>Sync Feed</span>
              </button>

              <!-- Settings Gear Button -->
              <button
                type="button"
                onclick="FPCL_EHSE_SUITE.openSettingsModal()"
                class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/35 backdrop-blur-md transition-all cursor-pointer shadow-xs active:scale-95"
                title="View Google Sheet connection details"
              >
                <i data-lucide="settings" class="w-4 h-4 text-white/90"></i>
              </button>
            </div>
          </div>

          <!-- ========================================================================= -->
          <!-- 2. UNIQUE COLORFUL LINES AT PERIMETER OF EACH KPI CARD                     -->
          <!-- (Strictly only KPI heading and value, center-aligned without subtitles)    -->
          <!-- Red color for open points as strictly required                             -->
          <!-- ========================================================================= -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- KPI 1: Total Observation (Unique Blue/Indigo Perimeter Line) -->
            <div
              onclick="FPCL_EHSE_SUITE.resetFilters()"
              class="bg-white border-2 border-blue-500/80 hover:border-blue-600 rounded-2xl p-5 relative overflow-hidden cursor-pointer shadow-[0_4px_18px_rgba(59,130,246,0.18)] transition-all group flex flex-col items-center justify-center text-center min-h-[140px]"
              title="Click to reset filters"
            >
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500"></div>
              <div class="text-blue-900 text-xs sm:text-sm font-black tracking-wider uppercase text-center w-full">
                TOTAL OBSERVATION
              </div>
              <div class="mt-3 text-center w-full flex items-center justify-center">
                <span class="text-5xl sm:text-6xl font-black font-mono tracking-tight text-blue-950 text-center">${totalFiltered}</span>
              </div>
            </div>

            <!-- KPI 2: Closed Observations Column H (Unique Emerald/Teal Perimeter Line) -->
            <div
              onclick="FPCL_EHSE_SUITE.setStatusFilter('Close')"
              class="bg-white border-2 border-emerald-500/80 hover:border-emerald-600 rounded-2xl p-5 relative overflow-hidden cursor-pointer shadow-[0_4px_18px_rgba(16,185,129,0.18)] transition-all group flex flex-col items-center justify-center text-center min-h-[140px]"
              title="Click to filter Closed observations"
            >
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600"></div>
              <div class="text-emerald-800 text-xs sm:text-sm font-black tracking-wider uppercase text-center w-full">
                CLOSED OBSERVATIONS
              </div>
              <div class="mt-3 text-center w-full flex items-center justify-center">
                <span class="text-5xl sm:text-6xl font-black font-mono tracking-tight text-emerald-600 text-center">${closedFiltered}</span>
              </div>
            </div>

            <!-- KPI 3: Open Observations Column H (Unique Red Perimeter Line & Red Text) -->
            <div
              onclick="FPCL_EHSE_SUITE.setStatusFilter('Open')"
              class="bg-white border-2 border-red-500/80 hover:border-red-600 rounded-2xl p-5 relative overflow-hidden cursor-pointer shadow-[0_4px_18px_rgba(239,68,68,0.22)] transition-all group flex flex-col items-center justify-center text-center min-h-[140px]"
              title="Click to filter Open observations"
            >
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500"></div>
              <div class="text-red-700 text-xs sm:text-sm font-black tracking-wider uppercase text-center w-full">
                OPEN OBSERVATIONS
              </div>
              <div class="mt-3 text-center w-full flex items-center justify-center">
                <span class="text-5xl sm:text-6xl font-black font-mono tracking-tight text-red-600 text-center">${openFiltered}</span>
              </div>
            </div>

            <!-- KPI 4: Percentage Completion (Unique Purple/Cyan Perimeter Line) -->
            <div
              class="bg-white border-2 border-purple-500/80 hover:border-purple-600 rounded-2xl p-5 relative overflow-hidden shadow-[0_4px_18px_rgba(168,85,247,0.18)] transition-all flex flex-col items-center justify-center text-center min-h-[140px]"
            >
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500"></div>
              <div class="text-purple-900 text-xs sm:text-sm font-black tracking-wider uppercase text-center w-full">
                PERCENTAGE COMPLETION
              </div>
              <div class="mt-3 text-center w-full flex items-center justify-center">
                <span class="text-5xl sm:text-6xl font-black font-mono tracking-tight text-purple-700 text-center">${completionPct}</span>
              </div>
            </div>

          </div>

          <!-- ========================================================================= -->
          <!-- 3. MULTI-DIMENSIONAL FILTERS (Unique Teal/Cyan Perimeter Line)               -->
          <!-- No heading on filter banner as instructed                                 -->
          <!-- Columns C, D, G, and H for filter creation                                 -->
          <!-- ========================================================================= -->
          <div class="bg-white border-2 border-teal-500/80 hover:border-teal-600 rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_rgba(20,184,166,0.16)] relative overflow-hidden transition-all">
            <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600"></div>

            ${isAnyFilterActive ? `
              <div class="flex justify-end pb-2.5">
                <button
                  type="button"
                  onclick="FPCL_EHSE_SUITE.resetFilters()"
                  class="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                  <span>Clear Active Filters</span>
                </button>
              </div>
            ` : ''}

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              <!-- Filter 1: Column C (Year from Date of Meeting) -->
              <div class="space-y-1">
                <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Column C: Year (Date of Meeting)
                </label>
                <select
                  onchange="FPCL_EHSE_SUITE.setYearFilter(this.value)"
                  class="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer transition-colors shadow-2xs"
                >
                  <option value="all" ${s.yearFilter === 'all' ? 'selected' : ''}>All Years (${allYears.length > 0 ? allYears.length : 'All'})</option>
                  ${allYears.map(yr => {
                    const yrCount = raw.filter(i => this.getItemYear(i) === yr).length;
                    return `<option value="${yr}" ${s.yearFilter === yr ? 'selected' : ''}>${yr} (${yrCount})</option>`;
                  }).join('')}
                  ${hasUnknownYear ? `
                    <option value="unknown" ${s.yearFilter === 'unknown' ? 'selected' : ''}>Unknown Year</option>
                  ` : ''}
                </select>
              </div>

              <!-- Filter 2: Column D (Ref. #) -->
              <div class="space-y-1">
                <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Column D: Ref. #
                </label>
                <select
                  onchange="FPCL_EHSE_SUITE.setRefFilter(this.value)"
                  class="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer transition-colors shadow-2xs"
                >
                  <option value="all" ${s.refFilter === 'all' ? 'selected' : ''}>All Ref. Numbers (${allRefNumbers.length})</option>
                  ${allRefNumbers.map(ref => `
                    <option value="${ref}" ${s.refFilter === ref ? 'selected' : ''}>${ref}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Filter 3: Column G (Responsibility Department / Action by) -->
              <div class="space-y-1">
                <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Column G: Responsibility Dept (Action by)
                </label>
                <select
                  onchange="FPCL_EHSE_SUITE.setDeptFilter(this.value)"
                  class="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer transition-colors shadow-2xs"
                >
                  <option value="all" ${s.deptFilter === 'all' ? 'selected' : ''}>All Departments (${allDepartments.length})</option>
                  ${allDepartments.map(dept => `
                    <option value="${dept}" ${s.deptFilter === dept ? 'selected' : ''}>${dept}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Filter 4: Column H (Status: Open / Close) -->
              <div class="space-y-1">
                <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Column H: Status (Open Close)
                </label>
                <select
                  onchange="FPCL_EHSE_SUITE.setStatusFilter(this.value)"
                  class="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer transition-colors shadow-2xs"
                >
                  <option value="all" ${s.statusFilter === 'all' ? 'selected' : ''}>All Statuses (Open & Close)</option>
                  <option value="Close" ${s.statusFilter === 'Close' ? 'selected' : ''}>Close (${rawClosedCount})</option>
                  <option value="Open" ${s.statusFilter === 'Open' ? 'selected' : ''}>Open (${rawOpenCount})</option>
                </select>
              </div>

            </div>
          </div>

          <!-- ========================================================================= -->
          <!-- 4. HORIZONTAL STACKED BAR CHART (Unique Indigo/Sky Perimeter Line)          -->
          <!-- Values on bar have 12 font size as instructed                              -->
          <!-- Open points in Red, Closed points in Emerald                              -->
          <!-- ========================================================================= -->
          <div class="bg-white border-2 border-indigo-500/80 hover:border-indigo-600 rounded-2xl p-5 sm:p-6 shadow-[0_4px_18px_rgba(99,102,241,0.16)] relative overflow-hidden space-y-4 transition-all">
            <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500"></div>

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 pt-1">
              <div>
                <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <i data-lucide="bar-chart-3" class="w-4 h-4 text-indigo-600"></i>
                  <span>Observations by Responsibility Department (Column G)</span>
                </h3>
              </div>
              
              <!-- Legend with Closed (Emerald) and Open (Red) -->
              <div class="flex items-center gap-4 text-xs font-bold">
                <div class="flex items-center gap-1.5 text-slate-700">
                  <span class="w-3.5 h-3.5 rounded-xs bg-[#10B981]"></span>
                  <span>Closed</span>
                </div>
                <div class="flex items-center gap-1.5 text-slate-700">
                  <span class="w-3.5 h-3.5 rounded-xs bg-[#EF4444]"></span>
                  <span>Open</span>
                </div>
              </div>
            </div>

            <!-- Horizontal Stacked Bar Chart SVG with 12 font size values -->
            <div class="w-full overflow-x-auto">
              ${this.renderHorizontalStackedBarChart(deptList)}
            </div>
          </div>

          <!-- ========================================================================= -->
          <!-- 5. LARGE DONUT CHART (Unique Teal/Emerald Perimeter Line)                  -->
          <!-- Text inside engineered to fit without overlapping in laptop & mobile       -->
          <!-- Thicker donut ring for rich visual appeal                                  -->
          <!-- ========================================================================= -->
          <div class="bg-white border-2 border-teal-400/80 hover:border-teal-500 rounded-2xl p-5 sm:p-6 shadow-[0_4px_18px_rgba(20,184,166,0.16)] relative overflow-hidden space-y-4 transition-all">
            <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500"></div>

            <div class="flex items-center justify-between border-b border-slate-100 pb-3 pt-1">
              <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <i data-lucide="pie-chart" class="w-4 h-4 text-teal-600"></i>
                <span>Observations Status Resolution Ratio</span>
              </h3>
            </div>

            <!-- Large Donut Chart Component with Zero-Overlap Center Typography -->
            ${this.renderDonutChart(closedFiltered, openFiltered, totalFiltered)}
          </div>

          <!-- ========================================================================= -->
          <!-- 6. COMPLETE SCROLLABLE EXCEL SHEET IN FORM OF TABLE (Unique Sky Perimeter)  -->
          <!-- Scrollable UP-DOWN and LEFT-RIGHT with Excel Headers & Navigation Buttons  -->
          <!-- ========================================================================= -->
          <div class="bg-white border-2 border-sky-400/80 hover:border-sky-500 rounded-2xl p-4 sm:p-6 shadow-[0_4px_18px_rgba(14,165,233,0.16)] relative overflow-hidden space-y-4 transition-all">
            <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600"></div>

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 pt-1">
              <div class="space-y-0.5">
                <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <i data-lucide="table" class="w-4 h-4 text-sky-600"></i>
                  <span>EHSE Complete Observations Master Sheet</span>
                </h3>
                <p class="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                  <span>Showing <strong>${totalFiltered}</strong> of <strong>${raw.length}</strong> records</span>
                  <span>•</span>
                  <span>Scroll ↕ up/down and ↔ left/right to browse all 9 columns</span>
                  <span>•</span>
                  <span>Column A with same ID represents one single meeting</span>
                </p>
              </div>

              <!-- Quick Table Actions: Left/Right Scroll Buttons & CSV Export -->
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Navigation buttons for left-right scrolling lengthy sheet -->
                <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onclick="FPCL_EHSE_SUITE.scrollToStart()"
                    class="p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-white transition-all cursor-pointer"
                    title="Jump to first column (Col A)"
                  >
                    <i data-lucide="chevrons-left" class="w-4 h-4"></i>
                  </button>
                  <button
                    type="button"
                    onclick="FPCL_EHSE_SUITE.scrollTable(-320)"
                    class="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 hover:text-teal-700 hover:bg-white flex items-center gap-1 transition-all cursor-pointer"
                    title="Scroll sheet left"
                  >
                    <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
                    <span>Scroll Left</span>
                  </button>
                  <button
                    type="button"
                    onclick="FPCL_EHSE_SUITE.scrollTable(320)"
                    class="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 hover:text-teal-700 hover:bg-white flex items-center gap-1 transition-all cursor-pointer"
                    title="Scroll sheet right"
                  >
                    <span>Scroll Right</span>
                    <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                  </button>
                  <button
                    type="button"
                    onclick="FPCL_EHSE_SUITE.scrollToEnd()"
                    class="p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-white transition-all cursor-pointer"
                    title="Jump to last column (Col I)"
                  >
                    <i data-lucide="chevrons-right" class="w-4 h-4"></i>
                  </button>
                </div>

                <button
                  type="button"
                  onclick="FPCL_EHSE_SUITE.exportFilteredCSV()"
                  class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition-colors cursor-pointer shadow-2xs"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <!-- Complete Scrollable UP-DOWN and LEFT-RIGHT Excel Sheet Container -->
            <div id="ehse-table-scroller" class="w-full overflow-x-auto overflow-y-auto max-h-[640px] rounded-xl border border-slate-200/90 shadow-2xs bg-white">
              <table class="min-w-[1250px] w-full text-left border-collapse text-xs select-text">
                <!-- Sticky Excel Column Letters Row (Row 1) -->
                <thead class="sticky top-0 z-20 shadow-xs">
                  <tr class="bg-slate-200 text-slate-600 text-[10px] font-mono font-bold uppercase tracking-wider border-b border-slate-300">
                    <th class="py-1 px-3 text-center border-r border-slate-300 w-12 bg-slate-200">#</th>
                    <th class="py-1 px-3 border-r border-slate-300 w-20 bg-slate-200">Col A</th>
                    <th class="py-1 px-3 border-r border-slate-300 min-w-[200px] bg-slate-200">Col B</th>
                    <th class="py-1 px-3 border-r border-slate-300 w-28 bg-slate-200">Col C</th>
                    <th class="py-1 px-3 border-r border-slate-300 w-36 bg-slate-200">Col D</th>
                    <th class="py-1 px-3 border-r border-slate-300 min-w-[240px] bg-slate-200">Col E</th>
                    <th class="py-1 px-3 border-r border-slate-300 min-w-[340px] bg-slate-200">Col F</th>
                    <th class="py-1 px-3 border-r border-slate-300 w-40 bg-slate-200">Col G</th>
                    <th class="py-1 px-3 border-r border-slate-300 text-center w-28 bg-slate-200">Col H</th>
                    <th class="py-1 px-3 min-w-[140px] bg-slate-200">Col I</th>
                  </tr>
                  <!-- Descriptive Header Row (Row 2) -->
                  <tr class="bg-slate-100 text-slate-800 text-[11px] font-black uppercase tracking-wider border-b border-slate-300">
                    <th class="py-2.5 px-3 text-center border-r border-slate-200 bg-slate-100">Sr.</th>
                    <th class="py-2.5 px-3 border-r border-slate-200 bg-slate-100">ID</th>
                    <th class="py-2.5 px-3 border-r border-slate-200 bg-slate-100">Subject</th>
                    <th class="py-2.5 px-3 border-r border-slate-200 bg-slate-100">Date of Meeting</th>
                    <th class="py-2.5 px-3 border-r border-slate-200 bg-slate-100">Ref. #</th>
                    <th class="py-2.5 px-3 border-r border-slate-200 bg-slate-100">Agenda</th>
                    <th class="py-2.5 px-3 border-r border-slate-200 bg-slate-100">Recommendations</th>
                    <th class="py-2.5 px-3 border-r border-slate-200 bg-slate-100">Action by</th>
                    <th class="py-2.5 px-3 border-r border-slate-200 text-center bg-slate-100">Open Close</th>
                    <th class="py-2.5 px-3 bg-slate-100">Remarks</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 font-medium text-slate-800">
                  ${filtered.length === 0 ? `
                    <tr>
                      <td colspan="10" class="py-12 text-center text-slate-400">
                        <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
                        <p class="font-bold text-sm text-slate-700">No matching observations found</p>
                        <p class="text-xs mt-1">Try clearing or adjusting your filter selection.</p>
                        <button
                          type="button"
                          onclick="FPCL_EHSE_SUITE.resetFilters()"
                          class="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 font-bold hover:bg-teal-100 cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      </td>
                    </tr>
                  ` : filtered.map((item, idx) => {
                    const isClose = this.isItemClosed(item);
                    const displayStatus = this.getItemStatus(item);
                    
                    // Distinct ID Color Badge to emphasize rows sharing the same Meeting ID
                    const idColor = String(item.id) === '69'
                      ? 'bg-teal-100 text-teal-900 border-teal-300'
                      : (String(item.id) === '70'
                        ? 'bg-blue-100 text-blue-900 border-blue-300'
                        : 'bg-purple-100 text-purple-900 border-purple-300');

                    return `
                      <tr
                        onclick="FPCL_EHSE_SUITE.inspectObservation(${item.sr})"
                        class="hover:bg-teal-50/50 transition-colors cursor-pointer group divide-x divide-slate-100"
                        title="Click to inspect full details for row #${idx + 1}"
                      >
                        <!-- Row # -->
                        <td class="py-3 px-3 text-center font-mono text-slate-400 font-bold text-[11px] bg-slate-50/60">${idx + 1}</td>

                        <!-- Col A: ID -->
                        <td class="py-3 px-3 font-mono font-bold whitespace-nowrap">
                          <span class="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-mono font-black border ${idColor} shadow-2xs">
                            #${item.id}
                          </span>
                        </td>

                        <!-- Col B: Subject -->
                        <td class="py-3 px-3 font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                          ${item.subject || '-'}
                        </td>

                        <!-- Col C: Date of Meeting -->
                        <td class="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          ${item.dateOfMeeting || '-'}
                        </td>

                        <!-- Col D: Ref. # -->
                        <td class="py-3 px-3 font-mono text-[11px] text-teal-700 whitespace-nowrap font-bold">
                          ${item.refNo || '-'}
                        </td>

                        <!-- Col E: Agenda -->
                        <td class="py-3 px-3 text-slate-700 leading-relaxed max-w-xs">
                          <div class="line-clamp-2" title="${(item.agenda || '').replace(/"/g, '&quot;')}">
                            ${item.agenda || '-'}
                          </div>
                        </td>

                        <!-- Col F: Recommendations -->
                        <td class="py-3 px-3 text-slate-800 font-semibold leading-relaxed max-w-sm">
                          <div class="line-clamp-3" title="${(item.recommendations || '').replace(/"/g, '&quot;')}">
                            ${item.recommendations || '-'}
                          </div>
                        </td>

                        <!-- Col G: Action by -->
                        <td class="py-3 px-3 whitespace-nowrap">
                          <span class="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            ${item.actionBy || 'Info'}
                          </span>
                        </td>

                        <!-- Col H: Open Close (Red for Open, Emerald for Close) -->
                        <td class="py-3 px-3 text-center whitespace-nowrap">
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${isClose ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-700 border-red-300'}">
                            <span class="w-1.5 h-1.5 rounded-full ${isClose ? 'bg-emerald-500' : 'bg-red-500'}"></span>
                            ${displayStatus}
                          </span>
                        </td>

                        <!-- Col I: Remarks -->
                        <td class="py-3 px-3 text-slate-500 text-[11px] max-w-xs truncate" title="${(item.remarks || '').replace(/"/g, '&quot;')}">
                          ${item.remarks || '—'}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Footer Note on Meeting Structure (Column A ID Grouping) -->
            <div class="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
              <div class="flex items-center gap-2">
                <i data-lucide="info" class="w-3.5 h-3.5 text-teal-600 shrink-0"></i>
                <span>Column A rows carrying the same ID represent one single meeting of EHSE. Multiple departments (Column G) have responsibility against different recommendations (Columns F, H, I).</span>
              </div>
              <div class="shrink-0 font-mono text-[11px]">
                Google Sheet ID: <strong>${EHSE_SHEET_ID}</strong> • Tab: <strong>${EHSE_SHEET_TAB}</strong>
              </div>
            </div>
          </div>

        </div>

        <!-- Inspection Modal Container -->
        <div id="ehse-inspection-modal" class="hidden"></div>

        <!-- Settings Modal Container -->
        <div id="ehse-settings-modal" class="hidden"></div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  };

  // Attach to window and auto-initialize
  window.FPCL_EHSE_SUITE = ehseSuite;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ehseSuite.init());
  } else {
    ehseSuite.init();
  }

})();
