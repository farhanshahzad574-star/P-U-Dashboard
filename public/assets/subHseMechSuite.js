/**
 * FPCL Executive Operations & Compliance Portal
 * Sub HSE – Mech (Mechanical HSE Sub-Committee) Executive BI Suite
 * 
 * Google Sheet ID: 1Put-VhgQkpG43kAuW_l3cRtj4MH6Dl3aa2gms9IaLqQ
 * Sheet Tab: Sub_HSE_Mech
 * 
 * Strict Scope & Isolation: Leaves Strategic, PLR, PSM Audits, PSM Validation, IMS, PSSR, CAPEX, Sub HSE - P, Sub HSE – E&I, EHSE untouched.
 */

(function () {
  'use strict';

  const SUB_HSE_MECH_SHEET_ID = '1Put-VhgQkpG43kAuW_l3cRtj4MH6Dl3aa2gms9IaLqQ';
  const SUB_HSE_MECH_SHEET_TAB = 'Sub_HSE_Mech';
  const SUB_HSE_MECH_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SUB_HSE_MECH_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SUB_HSE_MECH_SHEET_TAB)}`;

  const subHseMechSuite = {
    state: {
      searchQuery: '',
      refFilter: 'all',     // Column C: Reference #
      deptFilter: 'all',    // Column I: Action / Department
      statusFilter: 'all',  // Column J: Status (Closed / Open)
      isSyncing: false,
      lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      selectedObservation: null,
      isSettingsOpen: false
    },

    init() {
      window.FPCL_SUB_HSE_MECH_SUITE = this;

      // Cache retrieval
      try {
        const cached = localStorage.getItem('FPCL_SUB_HSE_MECH_CACHE');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.FPCL_SUB_HSE_MECH_DATA = parsed;
          }
        }
      } catch (e) {}

      // Fallback to seed data
      if (!window.FPCL_SUB_HSE_MECH_DATA || window.FPCL_SUB_HSE_MECH_DATA.length === 0) {
        if (window.FPCL_SUB_HSE_MECH_INITIAL_SEED) {
          window.FPCL_SUB_HSE_MECH_DATA = window.FPCL_SUB_HSE_MECH_INITIAL_SEED;
        }
      }

      // Propagate live stats to overview portal registry
      this.syncStatsToOverview();

      // Trigger automatic live Google Sheets sync
      setTimeout(() => {
        this.syncLiveFeed({ silent: true });
      }, 500);

      // Periodic auto-sync every 45 seconds
      if (!this._autoSyncTimer) {
        this._autoSyncTimer = setInterval(() => {
          this.syncLiveFeed({ silent: true });
        }, 45000);
      }
    },

    getRawData() {
      if (Array.isArray(window.FPCL_SUB_HSE_MECH_DATA) && window.FPCL_SUB_HSE_MECH_DATA.length > 0) {
        return window.FPCL_SUB_HSE_MECH_DATA;
      }
      if (Array.isArray(window.FPCL_SUB_HSE_MECH_INITIAL_SEED) && window.FPCL_SUB_HSE_MECH_INITIAL_SEED.length > 0) {
        return window.FPCL_SUB_HSE_MECH_INITIAL_SEED;
      }
      return [];
    },

    // Instruction: Count point as open if empty cell is found or any text other than Closed is found
    isItemClosed(item) {
      if (!item) return false;
      const s = String(item.status || '').trim().toLowerCase();
      return s === 'closed' || s === 'close';
    },

    getItemStatus(item) {
      return this.isItemClosed(item) ? 'Closed' : 'Open';
    },

    getFilteredData() {
      const raw = this.getRawData();
      const s = this.state;
      const q = (s.searchQuery || '').trim().toLowerCase();

      return raw.filter(item => {
        // Column C Filter: Reference #
        if (s.refFilter !== 'all' && item.refNo !== s.refFilter) {
          return false;
        }

        // Column I Filter: Responsibility Department (Action)
        if (s.deptFilter !== 'all' && item.action !== s.deptFilter) {
          return false;
        }

        // Column J Filter: Status (Closed vs Open) - Any non-Closed counts as Open
        if (s.statusFilter !== 'all') {
          const itemStatus = this.getItemStatus(item).toLowerCase();
          const targetStatus = s.statusFilter.toLowerCase();
          if (itemStatus !== targetStatus) {
            return false;
          }
        }

        // Search Query across all 12 columns
        if (q) {
          const text = [
            item.id,
            item.sNo,
            item.refNo,
            item.meetingDate,
            item.issuedDate,
            item.meetingAgenda,
            item.typeOfMeeting,
            item.mom,
            item.action,
            item.status,
            this.getItemStatus(item),
            item.targetDate,
            item.remarks
          ].join(' ').toLowerCase();

          if (!text.includes(q)) {
            return false;
          }
        }

        return true;
      });
    },

    // Sync live counts to Overview page button and cards
    syncStatsToOverview() {
      const raw = this.getRawData();
      if (!raw || raw.length === 0) return;

      const total = raw.length;
      const closed = raw.filter(i => this.isItemClosed(i)).length;
      const open = total - closed;
      const rate = total > 0 ? ((closed / total) * 100).toFixed(1) + '%' : '0.0%';

      if (window.DASHBOARD_REGISTRY) {
        const subHseMechEntry = window.DASHBOARD_REGISTRY.find(d => d.id === 'sub-hse-mech');
        if (subHseMechEntry) {
          subHseMechEntry.status = 'Active';
          subHseMechEntry.hasSheetLink = true;
          subHseMechEntry.kpis = { total, closed, inProgress: open, overdue: 0, compliance: rate };
          subHseMechEntry.punchList = { open, closed, total, rate };
          subHseMechEntry.dataReadiness = { master: '100%', signoff: '100%' };
          subHseMechEntry.statusComment = `Live Google Sheets: Sub_HSE_Mech Tab (${total} Observations, ${closed} Closed, ${open} Open • ${rate} Resolved)`;
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
          const directUrl = `${SUB_HSE_MECH_SHEET_URL}&_nocache=${Date.now()}`;
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
            const apiRes = await fetch(`/api/sheets/fetch?sheetTab=${encodeURIComponent(SUB_HSE_MECH_SHEET_TAB)}&_t=${Date.now()}`, {
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
            csvText = await window.fetchGoogleSheetData(SUB_HSE_MECH_SHEET_URL, {
              sheetTab: SUB_HSE_MECH_SHEET_TAB
            });
          } catch (e) {}
        }

        if (csvText && typeof window.parseSubHseMechCSV === 'function') {
          const parsed = window.parseSubHseMechCSV(csvText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.FPCL_SUB_HSE_MECH_DATA = parsed;
            try {
              localStorage.setItem('FPCL_SUB_HSE_MECH_CACHE', JSON.stringify(parsed));
            } catch (e) {}

            this.state.lastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            this.syncStatsToOverview();

            if (!silent && window.portalApp && window.portalApp.showToast) {
              window.portalApp.showToast(
                'Sub HSE – Mech Synced',
                `Synchronized ${parsed.length} observations live from Google Sheet.`,
                'success'
              );
            }
          }
        }
      } catch (err) {
        console.warn('Sub HSE – Mech sync warning:', err);
      } finally {
        this.state.isSyncing = false;
        this.updateSyncUI();
        const container = document.getElementById('sub-hse-mech-specialized-container');
        if (container && !container.classList.contains('hidden')) {
          this.render();
        }
      }
    },

    updateSyncUI() {
      if (typeof document === 'undefined' || !document.getElementById) return;
      const icon = document.getElementById('sub-hse-mech-sync-icon');
      if (icon) {
        if (this.state.isSyncing) {
          icon.classList.add('animate-spin');
        } else {
          icon.classList.remove('animate-spin');
        }
      }
    },

    // Filter mutators - apply globally across the whole dashboard
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
      this.state.refFilter = 'all';
      this.state.deptFilter = 'all';
      this.state.statusFilter = 'all';
      this.render();
      if (window.portalApp && window.portalApp.showToast) {
        window.portalApp.showToast('Filters Reset', 'All Sub HSE – Mech filters restored to default.', 'info');
      }
    },

    // Smooth horizontal scroll for lengthy sheet table
    scrollTable(amount) {
      const tableWrapper = document.getElementById('sub-hse-mech-table-scroller');
      if (tableWrapper) {
        tableWrapper.scrollBy({ left: amount, behavior: 'smooth' });
      }
    },

    scrollToStart() {
      const tableWrapper = document.getElementById('sub-hse-mech-table-scroller');
      if (tableWrapper) {
        tableWrapper.scrollTo({ left: 0, behavior: 'smooth' });
      }
    },

    scrollToEnd() {
      const tableWrapper = document.getElementById('sub-hse-mech-table-scroller');
      if (tableWrapper) {
        tableWrapper.scrollTo({ left: tableWrapper.scrollWidth, behavior: 'smooth' });
      }
    },

    // Export CSV strictly based on active filter
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
        'S.#',
        'Reference #',
        'Meeting Date',
        'Issued Date',
        'Meeting Agenda',
        'Type Of Meeting',
        'MoM',
        'Action',
        'Status',
        'Target Date',
        'Remarks'
      ];

      const rows = filtered.map(item => [
        `"${String(item.id || '').replace(/"/g, '""')}"`,
        `"${String(item.sNo || '').replace(/"/g, '""')}"`,
        `"${String(item.refNo || '').replace(/"/g, '""')}"`,
        `"${String(item.meetingDate || '').replace(/"/g, '""')}"`,
        `"${String(item.issuedDate || '').replace(/"/g, '""')}"`,
        `"${String(item.meetingAgenda || '').replace(/"/g, '""')}"`,
        `"${String(item.typeOfMeeting || '').replace(/"/g, '""')}"`,
        `"${String(item.mom || '').replace(/"/g, '""')}"`,
        `"${String(item.action || '').replace(/"/g, '""')}"`,
        `"${String(item.status || '').replace(/"/g, '""')}"`,
        `"${String(item.targetDate || '').replace(/"/g, '""')}"`,
        `"${String(item.remarks || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `Sub_HSE_Mech_Observations_Filtered_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (window.portalApp && window.portalApp.showToast) {
        window.portalApp.showToast(
          'CSV Exported',
          `Successfully exported ${filtered.length} filtered Sub HSE – Mech observations.`,
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
      const modalContainer = document.getElementById('sub-hse-mech-inspection-modal');
      if (modalContainer) {
        modalContainer.innerHTML = this.renderInspectionModalContent(item);
        modalContainer.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
      }
    },

    closeInspectionModal() {
      this.state.selectedObservation = null;
      const modalContainer = document.getElementById('sub-hse-mech-inspection-modal');
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
          <div class="bg-white rounded-2xl shadow-2xl border-2 border-cyan-400 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <!-- Modal Header -->
            <div class="bg-gradient-to-r from-[#0B132B] via-[#1C2541] via-[#1E3A8A] to-[#0D9488] text-white p-5 flex items-start justify-between">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/20 text-white border border-white/30">
                    Meeting ID: #${item.id} (Single Meeting)
                  </span>
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${isClose ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50' : 'bg-red-500/20 text-red-300 border-red-400/50'}">
                    ${displayStatus}
                  </span>
                </div>
                <h3 class="text-lg font-black tracking-tight text-white">${item.refNo ? `Ref #${item.refNo}` : 'Sub HSE – Mech Item'}</h3>
                <p class="text-xs text-cyan-200 font-mono">Date: ${item.meetingDate || '-'} • Issued: ${item.issuedDate || '-'}</p>
              </div>
              <button
                type="button"
                onclick="FPCL_SUB_HSE_MECH_SUITE.closeInspectionModal()"
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
                  <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Responsibility Dept (Col I)</span>
                  <span class="font-black text-sm text-blue-900 mt-0.5 block">${item.action || 'Unassigned'}</span>
                </div>
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Status (Col J)</span>
                  <span class="font-black text-sm ${isClose ? 'text-emerald-600' : 'text-red-600'} mt-0.5 block">${item.status || displayStatus}</span>
                </div>
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Type of Meeting</span>
                  <span class="font-black text-sm text-slate-800 mt-0.5 block">${item.typeOfMeeting || '-'}</span>
                </div>
              </div>

              <!-- Agenda Section -->
              <div class="bg-sky-50/70 p-4 rounded-xl border border-sky-100">
                <span class="text-[10px] uppercase font-bold text-sky-800 block tracking-wider mb-1">Meeting Agenda (Col F)</span>
                <p class="text-xs leading-relaxed text-slate-800 font-semibold whitespace-pre-line">${item.meetingAgenda || '-'}</p>
              </div>

              <!-- MoM / Recommendation Section -->
              <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">MoM / Recommendation (Col H)</span>
                <p class="text-xs leading-relaxed text-slate-900 font-bold whitespace-pre-line">${item.mom || '-'}</p>
              </div>

              <!-- Remarks Section -->
              ${item.remarks ? `
                <div class="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                  <span class="text-[10px] uppercase font-bold text-amber-800 block tracking-wider mb-0.5">Remarks (Col L)</span>
                  <p class="text-xs text-slate-700">${item.remarks}</p>
                </div>
              ` : ''}

              <!-- Meeting Context Note -->
              <div class="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <strong class="text-blue-900 font-bold">Meeting Note:</strong> Row carrying Meeting ID <strong>#${item.id}</strong> belongs to one single meeting. Multiple departments had responsibility against this session, with distinct recommendations.
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onclick="FPCL_SUB_HSE_MECH_SUITE.closeInspectionModal()"
                class="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer shadow-xs"
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
      const modalContainer = document.getElementById('sub-hse-mech-settings-modal');
      if (modalContainer) {
        modalContainer.innerHTML = `
          <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl border-2 border-cyan-400 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div class="bg-gradient-to-r from-[#0B132B] via-[#1C2541] via-[#1E3A8A] to-[#0D9488] text-white p-5 flex items-center justify-between">
                <div class="flex items-center gap-2 font-bold text-sm">
                  <i data-lucide="settings" class="w-4 h-4 text-cyan-300"></i>
                  <span>Sub HSE – Mech Google Sheet Integration</span>
                </div>
                <button
                  type="button"
                  onclick="FPCL_SUB_HSE_MECH_SUITE.closeSettingsModal()"
                  class="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <i data-lucide="x" class="w-4 h-4"></i>
                </button>
              </div>

              <div class="p-6 space-y-4 text-xs text-slate-700">
                <div class="space-y-1">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Google Sheet ID</span>
                  <div class="p-2.5 rounded-xl bg-slate-100 font-mono text-[11px] text-slate-800 break-all select-all border border-slate-200 font-bold">
                    ${SUB_HSE_MECH_SHEET_ID}
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Sheet Tab</span>
                    <div class="p-2.5 rounded-xl bg-slate-100 font-mono font-black text-[12px] text-blue-700 border border-slate-200">
                      ${SUB_HSE_MECH_SHEET_TAB}
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
                    href="${SUB_HSE_MECH_SHEET_URL}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="block p-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-100 font-mono text-[10px] text-blue-700 truncate border border-blue-200 transition-colors"
                    title="${SUB_HSE_MECH_SHEET_URL}"
                  >
                    ${SUB_HSE_MECH_SHEET_URL}
                  </a>
                </div>

                <div class="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                  Data synchronizes live from the public viewer Google Sheet tab <strong>${SUB_HSE_MECH_SHEET_TAB}</strong>. Click <strong>Sync Feed</strong> anytime to immediately pull latest row additions.
                </div>
              </div>

              <div class="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onclick="FPCL_SUB_HSE_MECH_SUITE.syncLiveFeed(); FPCL_SUB_HSE_MECH_SUITE.closeSettingsModal();"
                  class="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                  <span>Sync Feed Now</span>
                </button>
                <button
                  type="button"
                  onclick="FPCL_SUB_HSE_MECH_SUITE.closeSettingsModal()"
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
      const modalContainer = document.getElementById('sub-hse-mech-settings-modal');
      if (modalContainer) {
        modalContainer.classList.add('hidden');
        modalContainer.innerHTML = '';
      }
    },

    /**
     * Horizontal Stack Bar Chart with Bold Presentation Font Sizes
     * Plotted Side-by-Side in 2 balanced columns to reduce vertical length in meeting presentations.
     * Font sizes enlarged for high visibility in meetings & laptops:
     * - Department labels: font-size 15 (bold)
     * - On-bar values: font-size 13/14 (extra-bold with shadow)
     * - Summary labels: font-size 14 (bold)
     * Shows Total, Open, and Closed observation for each department (Column I: Action)
     */
    renderHorizontalStackedBarChart(deptList) {
      if (!deptList || deptList.length === 0) {
        return `<div class="text-center py-12 text-sm text-slate-400 font-bold">No department observation records match active filters</div>`;
      }

      const totalItems = deptList.length;
      const isMultiCol = totalItems > 4; // Side-by-side 2-column layout when more than 4 departments
      const numCols = isMultiCol ? 2 : 1;

      // Split into 2 columns for side-by-side plotting
      const mid = isMultiCol ? Math.ceil(totalItems / 2) : totalItems;
      const col1Depts = deptList.slice(0, mid);
      const col2Depts = isMultiCol ? deptList.slice(mid) : [];

      const maxTotal = Math.max(...deptList.map(d => d.total), 1);
      const tickMax = Math.max(4, Math.ceil(maxTotal / 2) * 2);

      // SVG Dimensions calibrated for wide meeting presentations & laptop screens
      const w = 1500;
      const padTop = 38;
      const padBottom = 54;
      const rowH = 58; // Roomy row height for enlarged text
      const barH = 34; // Prominent, thick bar
      const numRows = Math.max(col1Depts.length, col2Depts.length);
      const h = padTop + numRows * rowH + padBottom;

      // Width allocation for 2 side-by-side columns
      const colGap = 70;
      const colW = isMultiCol ? (w - colGap) / 2 : w;
      const padLeftCol = 220; // Room for department name
      const padRightCol = 140; // Room for summary count: Total (Cl, Op)
      const chartW = colW - padLeftCol - padRightCol;

      const renderColumnBars = (list, colOffset) => {
        return list.map((d, i) => {
          const y = padTop + i * rowH;
          const barY = y + 12;
          const centerY = barY + barH / 2;
          const startX = colOffset + padLeftCol;
          const openW = (d.open / tickMax) * chartW;
          const closeW = (d.close / tickMax) * chartW;
          const totalW = (d.total / tickMax) * chartW;
          const isSelected = this.state.deptFilter === d.name;

          // On-bar text values: 13-14px bold for crystal-clear presentation visibility
          let textSegments = '';

          if (d.close > 0) {
            const closeCenter = startX + closeW / 2;
            const showCloseText = closeW >= 24; // Ensure bar segment is wide enough
            if (showCloseText) {
              textSegments += `
                <text x="${closeCenter}" y="${centerY}" fill="#FFFFFF" font-size="13" font-weight="900" font-family="'Plus Jakarta Sans', system-ui, sans-serif" text-anchor="middle" dominant-baseline="central" style="filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.5));">
                  ${d.close}
                </text>
              `;
            }
          }

          if (d.open > 0) {
            const openCenter = startX + closeW + openW / 2;
            const showOpenText = openW >= 24;
            if (showOpenText) {
              textSegments += `
                <text x="${openCenter}" y="${centerY}" fill="#FFFFFF" font-size="13" font-weight="900" font-family="'Plus Jakarta Sans', system-ui, sans-serif" text-anchor="middle" dominant-baseline="central" style="filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.5));">
                  ${d.open}
                </text>
              `;
            }
          }

          // Truncate dept name if excessively long for clean look, with full title tooltip
          const deptDisplayName = d.name.length > 20 ? d.name.slice(0, 19) + '…' : d.name;

          return `
            <g
              class="cursor-pointer group"
              onclick="FPCL_SUB_HSE_MECH_SUITE.setDeptFilter('${this.state.deptFilter === d.name ? 'all' : d.name.replace(/'/g, "\\'")}')"
            >
              <title>${d.name}: Total ${d.total} (${d.close} Closed, ${d.open} Open • ${d.closureRate}% Resolved)</title>

              <!-- Row background highlight on hover/select -->
              <rect x="${colOffset}" y="${y}" width="${colW}" height="${rowH}" rx="8" fill="${isSelected ? '#E0F2FE' : 'transparent'}" class="group-hover:fill-sky-50/80 transition-colors"/>

              <!-- Department Label (Enlarged to 15px font size for meeting presentation) -->
              <text x="${startX - 14}" y="${centerY}" fill="${isSelected ? '#0284C7' : '#0F172A'}" font-size="15" font-weight="${isSelected ? '900' : '800'}" font-family="'Plus Jakarta Sans', system-ui, sans-serif" text-anchor="end" dominant-baseline="central" class="transition-colors group-hover:fill-sky-600">
                ${deptDisplayName}
              </text>

              <!-- Bar Background Track -->
              <rect x="${startX}" y="${barY}" width="${chartW}" height="${barH}" rx="7" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.2"/>

              <!-- Stacked Closed Segment (Vibrant Emerald) -->
              ${d.close > 0 ? `
                <rect
                  x="${startX}"
                  y="${barY}"
                  width="${closeW}"
                  height="${barH}"
                  rx="${d.open > 0 ? '7 0 0 7' : '7'}"
                  fill="#10B981"
                  class="transition-all opacity-95 group-hover:opacity-100"
                />
              ` : ''}

              <!-- Stacked Open Segment (Bold Red for open points) -->
              ${d.open > 0 ? `
                <rect
                  x="${startX + closeW}"
                  y="${barY}"
                  width="${openW}"
                  height="${barH}"
                  rx="${d.close > 0 ? '0 7 7 0' : '7'}"
                  fill="#EF4444"
                  class="transition-all opacity-95 group-hover:opacity-100"
                />
              ` : ''}

              <!-- On-Bar Enlarged Font-Size Values -->
              ${textSegments}

              <!-- Total, Open, and Closed Summary Value Label on the right (Enlarged 14px Font Size) -->
              <text x="${startX + totalW + 12}" y="${centerY}" fill="#0F172A" font-size="14" font-weight="900" font-family="'JetBrains Mono', 'Plus Jakarta Sans', monospace" dominant-baseline="central">
                ${d.total} <tspan fill="#64748B" font-size="12" font-weight="700">(${d.close} Cl, ${d.open} Op)</tspan>
              </text>
            </g>
          `;
        }).join('');
      };

      // X-Axis gridlines and ticks generator for each column
      const renderTicks = (colOffset) => {
        const tickStep = Math.max(1, Math.round(tickMax / 4));
        const ticks = [];
        for (let t = 0; t <= tickMax; t += tickStep) {
          ticks.push(t);
        }
        const startX = colOffset + padLeftCol;

        return ticks.map(t => {
          const x = startX + (t / tickMax) * chartW;
          return `
            <g>
              <line x1="${x}" y1="${padTop - 6}" x2="${x}" y2="${h - padBottom + 6}" stroke="#E2E8F0" stroke-dasharray="3,3" stroke-width="1.2"/>
              <text x="${x}" y="${h - padBottom + 26}" fill="#475569" font-size="13" font-weight="800" text-anchor="middle" font-family="'JetBrains Mono', monospace">${t}</text>
            </g>
          `;
        }).join('');
      };

      // Column 1 SVG
      const col1Svg = renderColumnBars(col1Depts, 0);
      const col1TicksSvg = renderTicks(0);

      // Column 2 SVG (if applicable)
      let col2Svg = '';
      let col2TicksSvg = '';
      let dividerSvg = '';

      if (isMultiCol) {
        const col2Offset = colW + colGap;
        col2Svg = renderColumnBars(col2Depts, col2Offset);
        col2TicksSvg = renderTicks(col2Offset);

        // Vertical divider between columns with subtle styling
        const divX = colW + colGap / 2;
        dividerSvg = `
          <line x1="${divX}" y1="${padTop}" x2="${divX}" y2="${h - padBottom}" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="6,4"/>
        `;
      }

      return `
        <svg viewBox="0 0 ${w} ${h}" class="w-full h-auto select-none" style="min-width: 820px;">
          ${dividerSvg}
          ${col1TicksSvg}
          ${col1Svg}
          ${col2TicksSvg}
          ${col2Svg}
        </svg>
      `;
    },

    /**
     * Large Donut Chart Engineered to Prevent Overlap in Both Laptop and Mobile Views
     * Inner cutout diameter is large (202px+), thicker stroke (38px) to look visually appealing
     */
    renderDonutChart(closedCount, openCount, totalCount) {
      if (totalCount === 0) {
        return `<div class="text-center py-12 text-xs text-slate-400 font-medium">No observation records to calculate</div>`;
      }

      const size = 380;
      const center = size / 2; // 190
      const radius = 120;
      const strokeWidth = 38; // Thicker ring for visually appealing presence
      const circumference = 2 * Math.PI * radius; // ~753.98

      const closedPct = Math.round((closedCount / totalCount) * 100);
      const openPct = 100 - closedPct;

      const closedOffset = 0;
      const closedDash = (closedPct / 100) * circumference;

      const openOffset = -closedDash;
      const openDash = (openPct / 100) * circumference;

      return `
        <div class="flex flex-col items-center justify-center p-3 select-none w-full">
          <!-- Large Donut SVG Wrapper (Optimized for both mobile and laptop views) -->
          <div class="relative w-64 h-64 min-[400px]:w-72 min-[400px]:h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[380px] lg:h-[380px] shrink-0 mx-auto">
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
                  onclick="FPCL_SUB_HSE_MECH_SUITE.setStatusFilter('${this.state.statusFilter === 'Closed' ? 'all' : 'Closed'}')"
                >
                  <title>Closed Observations: ${closedCount} (${closedPct}%)</title>
                </circle>
              ` : ''}
              <!-- Open Observations Arc (Bold Red as instructed for open points) -->
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
                  onclick="FPCL_SUB_HSE_MECH_SUITE.setStatusFilter('${this.state.statusFilter === 'Open' ? 'all' : 'Open'}')"
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
                  font-size="44"
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
                  font-size="12"
                  font-weight="900"
                  letter-spacing="2"
                  font-family="'Plus Jakarta Sans', system-ui, sans-serif"
                  class="select-none uppercase"
                >
                  COMPLETION
                </text>
                <text
                  x="${center}"
                  y="${center + 46}"
                  text-anchor="middle"
                  dominant-baseline="central"
                  fill="#059669"
                  font-size="11"
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
              onclick="FPCL_SUB_HSE_MECH_SUITE.setStatusFilter('${this.state.statusFilter === 'Closed' ? 'all' : 'Closed'}')"
              class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${this.state.statusFilter === 'Closed' ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200 hover:bg-slate-50'}"
            >
              <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span class="font-bold text-slate-700">Closed:</span>
              <span class="font-mono font-black text-emerald-700">${closedCount}</span>
              <span class="text-slate-400 font-bold">(${closedPct}%)</span>
            </button>

            <button
              type="button"
              onclick="FPCL_SUB_HSE_MECH_SUITE.setStatusFilter('${this.state.statusFilter === 'Open' ? 'all' : 'Open'}')"
              class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${this.state.statusFilter === 'Open' ? 'bg-red-50 border-red-400 ring-2 ring-red-500/20' : 'bg-white border-slate-200 hover:bg-slate-50'}"
            >
              <span class="w-3 h-3 rounded-full bg-red-500"></span>
              <span class="font-bold text-slate-700">Open:</span>
              <span class="font-mono font-black text-red-600">${openCount}</span>
              <span class="text-slate-400 font-bold">(${openPct}%)</span>
            </button>

            <button
              type="button"
              onclick="FPCL_SUB_HSE_MECH_SUITE.setStatusFilter('all')"
              class="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all cursor-pointer ${this.state.statusFilter === 'all' ? 'bg-sky-50/70 border-sky-300 text-sky-800' : 'bg-white'}"
            >
              <span class="w-2 h-2 rounded-full bg-sky-500"></span>
              <span class="font-bold">Total:</span>
              <span class="font-mono font-black">${totalCount}</span>
            </button>
          </div>
        </div>
      `;
    },

    // Main Render function for Sub HSE – Mech Dashboard
    render() {
      const container = document.getElementById('sub-hse-mech-specialized-container');
      if (!container) return;

      const raw = this.getRawData();
      const filtered = this.getFilteredData();
      const s = this.state;

      // KPI metrics calculations strictly based on Column J: Status (empty or non-Closed counts as Open)
      const totalFiltered = filtered.length;
      const closedFiltered = filtered.filter(i => this.isItemClosed(i)).length;
      const openFiltered = totalFiltered - closedFiltered;
      const completionPct = totalFiltered > 0 ? ((closedFiltered / totalFiltered) * 100).toFixed(1) + '%' : '0.0%';

      // Department breakdown for Horizontal Stacked Bar Chart (Column I: Action)
      const deptMap = {};
      filtered.forEach(item => {
        const d = (item.action && item.action.trim()) || 'Unassigned';
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

      // Distinct options for filters from dataset (Column C, Column I, Column J)
      const allRefNumbers = Array.from(new Set(raw.map(i => i.refNo).filter(Boolean))).sort();
      const allDepartments = Array.from(new Set(raw.map(i => i.action).filter(Boolean))).sort();

      const isAnyFilterActive =
        (s.searchQuery && s.searchQuery.trim().length > 0) ||
        s.refFilter !== 'all' ||
        s.deptFilter !== 'all' ||
        s.statusFilter !== 'all';

      container.innerHTML = `
        <div class="space-y-6 font-sans">

          <!-- ========================================================================= -->
          <!-- 1. Eye-Catching Gradient Banner at Top (Unique Colorful Perimeter Line)    -->
          <!-- Color Scheme: Modern stylish Midnight Obsidian / Cobalt / Cyan / Emerald    -->
          <!-- No extra texts and details: just heading & important feature buttons       -->
          <!-- ========================================================================= -->
          <div class="bg-gradient-to-r from-[#0B132B] via-[#1C2541] via-[#1E3A8A] via-[#0284C7] to-[#0D9488] text-white rounded-2xl p-5 sm:p-6 shadow-xl border-2 border-cyan-400 hover:border-cyan-300 shadow-[0_8px_32px_rgba(2,132,199,0.28)] relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all">
            <div class="absolute -right-10 -bottom-10 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl pointer-events-none"></div>

            <!-- Heading Only (No extra texts and details as strictly instructed) -->
            <div class="relative z-10 flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center text-cyan-300 shrink-0 shadow-xs">
                <i data-lucide="wrench" class="w-5 h-5"></i>
              </div>
              <h1 class="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">
                Sub HSE – Mech
              </h1>
            </div>

            <!-- Important Feature Buttons (Exact match to image: SEARCH FINDINGS, Reset Filters, Export CSV, Sync Feed, Settings) -->
            <div class="relative z-10 flex items-center flex-wrap gap-2.5">
              
              <!-- SEARCH FINDINGS Button / Input Pill -->
              <div class="relative flex items-center">
                <div class="flex items-center bg-white/10 hover:bg-white/15 border border-white/35 rounded-xl px-3 py-1.5 backdrop-blur-md transition-all shadow-xs">
                  <i data-lucide="search" class="w-3.5 h-3.5 text-white/80 mr-2 shrink-0"></i>
                  <input
                    type="text"
                    value="${(s.searchQuery || '').replace(/"/g, '&quot;')}"
                    oninput="FPCL_SUB_HSE_MECH_SUITE.setSearchQuery(this.value)"
                    placeholder="SEARCH FINDINGS"
                    class="bg-transparent text-white placeholder-white/75 text-xs font-black uppercase tracking-wider focus:outline-none w-36 sm:w-44"
                  />
                  ${s.searchQuery ? `
                    <button
                      type="button"
                      onclick="FPCL_SUB_HSE_MECH_SUITE.clearSearch()"
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
                onclick="FPCL_SUB_HSE_MECH_SUITE.resetFilters()"
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide bg-white/10 hover:bg-white/20 text-white border border-white/35 backdrop-blur-md transition-all cursor-pointer shadow-xs active:scale-95"
                title="Reset all filters"
              >
                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-white/90"></i>
                <span>Reset Filters</span>
              </button>

              <!-- Export CSV Button (Based on active filter) -->
              <button
                type="button"
                onclick="FPCL_SUB_HSE_MECH_SUITE.exportFilteredCSV()"
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide bg-white/10 hover:bg-white/20 text-white border border-white/35 backdrop-blur-md transition-all cursor-pointer shadow-xs active:scale-95"
                title="Download CSV based on active filter"
              >
                <i data-lucide="download" class="w-3.5 h-3.5 text-white/90"></i>
                <span>Export CSV</span>
              </button>

              <!-- Sync Feed Button -->
              <button
                type="button"
                onclick="FPCL_SUB_HSE_MECH_SUITE.syncLiveFeed()"
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide bg-white/10 hover:bg-white/20 text-white border border-white/35 backdrop-blur-md transition-all cursor-pointer shadow-xs active:scale-95"
                title="Sync live from Google Sheet"
              >
                <i id="sub-hse-mech-sync-icon" data-lucide="refresh-cw" class="w-3.5 h-3.5 text-white/90 ${s.isSyncing ? 'animate-spin' : ''}"></i>
                <span>Sync Feed</span>
              </button>

              <!-- Settings Gear Button -->
              <button
                type="button"
                onclick="FPCL_SUB_HSE_MECH_SUITE.openSettingsModal()"
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
          <!-- Red color for open points strictly enforced                               -->
          <!-- ========================================================================= -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- KPI 1: Total Observation (Unique Cyan Perimeter Line) -->
            <div
              onclick="FPCL_SUB_HSE_MECH_SUITE.resetFilters()"
              class="bg-white border-2 border-cyan-400 hover:border-cyan-500 rounded-2xl p-5 relative overflow-hidden cursor-pointer shadow-[0_0_18px_rgba(6,182,212,0.22)] transition-all group flex flex-col items-center justify-center text-center min-h-[140px]"
              title="Click to reset filters"
            >
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600"></div>
              <div class="text-slate-800 text-xs sm:text-sm font-black tracking-wider uppercase text-center w-full">
                TOTAL OBSERVATION
              </div>
              <div class="mt-3 text-center w-full flex items-center justify-center">
                <span class="text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-900 text-center">${totalFiltered}</span>
              </div>
            </div>

            <!-- KPI 2: Closed Observations Column H (Unique Emerald Perimeter Line) -->
            <div
              onclick="FPCL_SUB_HSE_MECH_SUITE.setStatusFilter('Closed')"
              class="bg-white border-2 border-emerald-400 hover:border-emerald-500 rounded-2xl p-5 relative overflow-hidden cursor-pointer shadow-[0_0_18px_rgba(16,185,129,0.22)] transition-all group flex flex-col items-center justify-center text-center min-h-[140px]"
              title="Click to filter Closed observations"
            >
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-green-600"></div>
              <div class="text-emerald-900 text-xs sm:text-sm font-black tracking-wider uppercase text-center w-full">
                CLOSED OBSERVATIONS
              </div>
              <div class="mt-3 text-center w-full flex items-center justify-center">
                <span class="text-5xl sm:text-6xl font-black font-mono tracking-tight text-emerald-600 text-center">${closedFiltered}</span>
              </div>
            </div>

            <!-- KPI 3: Open Observations Column H (Unique Red Perimeter Line, Red Color for Value) -->
            <div
              onclick="FPCL_SUB_HSE_MECH_SUITE.setStatusFilter('Open')"
              class="bg-white border-2 border-rose-500 hover:border-red-600 rounded-2xl p-5 relative overflow-hidden cursor-pointer shadow-[0_0_18px_rgba(239,68,68,0.25)] transition-all group flex flex-col items-center justify-center text-center min-h-[140px]"
              title="Click to filter Open observations"
            >
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-red-600 to-red-700"></div>
              <div class="text-red-900 text-xs sm:text-sm font-black tracking-wider uppercase text-center w-full">
                OPEN OBSERVATIONS
              </div>
              <div class="mt-3 text-center w-full flex items-center justify-center">
                <span class="text-5xl sm:text-6xl font-black font-mono tracking-tight text-red-600 text-center">${openFiltered}</span>
              </div>
            </div>

            <!-- KPI 4: Percentage Completion (Unique Blue Perimeter Line) -->
            <div
              class="bg-white border-2 border-blue-500 hover:border-blue-600 rounded-2xl p-5 relative overflow-hidden shadow-[0_0_18px_rgba(59,130,246,0.22)] transition-all flex flex-col items-center justify-center text-center min-h-[140px]"
            >
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-600 to-cyan-500"></div>
              <div class="text-blue-950 text-xs sm:text-sm font-black tracking-wider uppercase text-center w-full">
                PERCENTAGE COMPLETION
              </div>
              <div class="mt-3 text-center w-full flex items-center justify-center">
                <span class="text-5xl sm:text-6xl font-black font-mono tracking-tight text-blue-600 text-center">${completionPct}</span>
              </div>
            </div>

          </div>

          <!-- ========================================================================= -->
          <!-- 3. FILTERS (Below KPIs, No Heading to Filter Banner as Instructed)          -->
          <!-- Uses Column C (Reference #), Column I (Action/Dept), Column J (Status)      -->
          <!-- ========================================================================= -->
          <div class="bg-white border-2 border-sky-400/80 hover:border-sky-500 rounded-2xl p-4 sm:p-5 shadow-[0_0_16px_rgba(14,165,233,0.18)] relative overflow-hidden transition-all">
            <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 via-blue-600 to-teal-500"></div>

            ${isAnyFilterActive ? `
              <div class="flex justify-end pb-2.5">
                <button
                  type="button"
                  onclick="FPCL_SUB_HSE_MECH_SUITE.resetFilters()"
                  class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                  <span>Clear All Filters</span>
                </button>
              </div>
            ` : ''}

            <!-- 3 Filter Dropdowns: Column C, Column I, Column J -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              <!-- Filter 1: Column C (Reference #) -->
              <div class="space-y-1">
                <label class="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
                  <span>Reference # (Col C)</span>
                  <span class="text-sky-600 font-mono text-[10px]">${allRefNumbers.length} options</span>
                </label>
                <div class="relative">
                  <select
                    onchange="FPCL_SUB_HSE_MECH_SUITE.setRefFilter(this.value)"
                    class="w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none transition-all cursor-pointer"
                  >
                    <option value="all" ${s.refFilter === 'all' ? 'selected' : ''}>All Reference Numbers (${raw.length})</option>
                    ${allRefNumbers.map(r => `
                      <option value="${r}" ${s.refFilter === r ? 'selected' : ''}>${r}</option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <!-- Filter 2: Column I (Responsibility Department / Action) -->
              <div class="space-y-1">
                <label class="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
                  <span>Department (Col I)</span>
                  <span class="text-sky-600 font-mono text-[10px]">${allDepartments.length} depts</span>
                </label>
                <div class="relative">
                  <select
                    onchange="FPCL_SUB_HSE_MECH_SUITE.setDeptFilter(this.value)"
                    class="w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none transition-all cursor-pointer"
                  >
                    <option value="all" ${s.deptFilter === 'all' ? 'selected' : ''}>All Departments (${raw.length})</option>
                    ${allDepartments.map(d => `
                      <option value="${d}" ${s.deptFilter === d ? 'selected' : ''}>${d}</option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <!-- Filter 3: Column J (Status: Closed vs Open) -->
              <div class="space-y-1">
                <label class="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
                  <span>Status (Col J)</span>
                  <span class="text-sky-600 font-mono text-[10px]">Closed / Open</span>
                </label>
                <div class="relative">
                  <select
                    onchange="FPCL_SUB_HSE_MECH_SUITE.setStatusFilter(this.value)"
                    class="w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none transition-all cursor-pointer"
                  >
                    <option value="all" ${s.statusFilter === 'all' ? 'selected' : ''}>All Statuses (${totalFiltered})</option>
                    <option value="Closed" ${s.statusFilter === 'Closed' ? 'selected' : ''}>Closed (${raw.filter(i => this.isItemClosed(i)).length})</option>
                    <option value="Open" ${s.statusFilter === 'Open' ? 'selected' : ''}>Open (${raw.length - raw.filter(i => this.isItemClosed(i)).length})</option>
                  </select>
                </div>
              </div>

            </div>
          </div>

          <!-- ========================================================================= -->
          <!-- 4. VISUALS SECTION: OBSERVATIONS BY DEPARTMENT & DONUT RESOLUTION BREAKDOWN -->
          <!-- Observations by Department is plotted side-by-side in 2 columns across full   -->
          <!-- width so length is reduced, with prominent enlarged fonts for presentation.   -->
          <!-- Donut chart is thick and large, ensuring text inside never overlaps.         -->
          <!-- Unique colorful lines at perimeter of each visual card.                       -->
          <!-- ========================================================================= -->
          <div class="space-y-6">
            
            <!-- Observations by Department Visual Card (Full Width with Side-by-Side 2-Column Plot) -->
            <div class="bg-white border-2 border-blue-400/90 hover:border-blue-500 rounded-2xl p-5 sm:p-6 shadow-[0_0_20px_rgba(59,130,246,0.18)] relative overflow-hidden transition-all">
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-600 via-sky-500 to-teal-500"></div>

              <div>
                <!-- Visual Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 mb-4">
                  <div class="flex items-center gap-2.5">
                    <span class="w-3 h-3 rounded-full bg-blue-600"></span>
                    <h3 class="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900">
                      Observations by Department (Col I)
                    </h3>
                    <span class="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Meeting Presentation Layout • Side-by-Side
                    </span>
                  </div>

                  <!-- Legend -->
                  <div class="flex items-center gap-4 text-xs">
                    <div class="flex items-center gap-1.5 font-bold text-slate-700">
                      <span class="w-3.5 h-3.5 rounded-sm bg-emerald-500"></span>
                      <span>Closed</span>
                    </div>
                    <div class="flex items-center gap-1.5 font-bold text-slate-700">
                      <span class="w-3.5 h-3.5 rounded-sm bg-red-500"></span>
                      <span>Open</span>
                    </div>
                  </div>
                </div>

                <!-- Side-by-Side Horizontal Stacked Bar Chart SVG -->
                <div class="overflow-x-auto w-full py-2">
                  ${this.renderHorizontalStackedBarChart(deptList)}
                </div>
              </div>

              <!-- Footer Guidance -->
              <div class="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 font-semibold">
                <span class="flex items-center gap-1.5 text-blue-700">
                  <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                  <span>Plotted side-by-side with high-contrast text & values calibrated for meeting presentation</span>
                </span>
                <span class="text-slate-400">Click any department bar to filter whole dashboard</span>
              </div>
            </div>

            <!-- Resolution Rate Breakdown Donut Card -->
            <div class="bg-white border-2 border-teal-400/90 hover:border-teal-500 rounded-2xl p-5 sm:p-6 shadow-[0_0_20px_rgba(20,184,166,0.18)] relative overflow-hidden transition-all">
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-400 via-emerald-500 to-cyan-500"></div>

              <div>
                <!-- Donut Header -->
                <div class="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 mb-3 w-full">
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full bg-teal-500"></span>
                    <h3 class="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900">
                      Resolution Rate Breakdown
                    </h3>
                  </div>
                  <span class="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                    Total Observations: ${totalFiltered}
                  </span>
                </div>

                <!-- Donut Chart Rendering (Large & Thick, guaranteed zero overlap) -->
                ${this.renderDonutChart(closedFiltered, openFiltered, totalFiltered)}
              </div>

              <!-- Donut Footer Note -->
              <div class="w-full mt-3 pt-3 border-t border-slate-100 text-center text-xs text-slate-400 font-medium">
                Click Closed or Open buttons in the legend above to filter observations
              </div>
            </div>

          </div>

          <!-- ========================================================================= -->
          <!-- 5. COMPLETE SCROLLABLE UP/DOWN & LEFT/RIGHT EXCEL SHEET TABLE               -->
          <!-- Dedicated scroll left/right buttons for lengthy sheet                      -->
          <!-- Displays all columns A to L with meeting ID groupings                       -->
          <!-- Unique colorful line at perimeter of table card                            -->
          <!-- ========================================================================= -->
          <div class="bg-white border-2 border-cyan-500/80 hover:border-cyan-600 rounded-2xl p-5 shadow-[0_0_20px_rgba(6,182,212,0.18)] relative overflow-hidden transition-all space-y-4">
            <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600"></div>

            <!-- Table Header Toolbar -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs">
                  <i data-lucide="table" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                    Sub HSE – Mech Complete Master Sheet
                  </h3>
                  <p class="text-[11px] text-slate-500">
                    Showing ${filtered.length} of ${raw.length} records • Tab: <strong>${SUB_HSE_MECH_SHEET_TAB}</strong>
                  </p>
                </div>
              </div>

              <!-- Dedicated Horizontal Scroll Controls for lengthy sheet -->
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onclick="FPCL_SUB_HSE_MECH_SUITE.scrollTable(-350)"
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Scroll Left"
                >
                  <i data-lucide="chevron-left" class="w-4 h-4"></i>
                  <span>Scroll Left</span>
                </button>
                <button
                  type="button"
                  onclick="FPCL_SUB_HSE_MECH_SUITE.scrollTable(350)"
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Scroll Right"
                >
                  <span>Scroll Right</span>
                  <i data-lucide="chevron-right" class="w-4 h-4"></i>
                </button>
                <button
                  type="button"
                  onclick="FPCL_SUB_HSE_MECH_SUITE.exportFilteredCSV()"
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white transition-all cursor-pointer shadow-2xs"
                  title="Export Current View"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <!-- Scrollable Table Container (Up/Down + Left/Right) -->
            <div id="sub-hse-mech-table-scroller" class="overflow-x-auto overflow-y-auto max-h-[520px] rounded-xl border border-slate-200 shadow-inner bg-slate-50/50">
              <table class="w-full text-left text-xs border-collapse min-w-[1700px]">
                <thead class="sticky top-0 z-20 bg-slate-100 text-slate-700 border-b border-slate-200 font-black text-[11px] uppercase tracking-wider shadow-xs">
                  <tr>
                    <th class="py-3 px-3 w-16 text-center">Sr.#</th>
                    <th class="py-3 px-3 w-28">Meeting ID (A)</th>
                    <th class="py-3 px-3 w-20">S.# (B)</th>
                    <th class="py-3 px-3 w-36">Reference # (C)</th>
                    <th class="py-3 px-3 w-32">Meeting Date (D)</th>
                    <th class="py-3 px-3 w-36">Issued Date (E)</th>
                    <th class="py-3 px-4 min-w-[320px]">Meeting Agenda (F)</th>
                    <th class="py-3 px-3 w-32">Type (G)</th>
                    <th class="py-3 px-4 min-w-[380px]">MoM / Recommendation (H)</th>
                    <th class="py-3 px-3 w-40">Action Dept (I)</th>
                    <th class="py-3 px-3 w-32 text-center">Status (J)</th>
                    <th class="py-3 px-3 w-28">Target Date (K)</th>
                    <th class="py-3 px-4 min-w-[280px]">Remarks (L)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 bg-white">
                  ${filtered.length === 0 ? `
                    <tr>
                      <td colspan="13" class="py-12 text-center text-xs text-slate-400 font-medium">
                        No observation records match your filter criteria.
                      </td>
                    </tr>
                  ` : filtered.map((item, idx) => {
                    const isClosed = this.isItemClosed(item);
                    const meetingIdNum = parseInt(item.id, 10) || 1;
                    const meetingBgTint = meetingIdNum % 2 === 0 ? 'bg-sky-50/30' : 'bg-white';

                    return `
                      <tr
                        class="hover:bg-cyan-50/60 transition-colors cursor-pointer group ${meetingBgTint}"
                        onclick="FPCL_SUB_HSE_MECH_SUITE.inspectObservation('${item.sr}')"
                        title="Click to inspect full details for #${item.sr}"
                      >
                        <!-- Sr -->
                        <td class="py-2.5 px-3 text-center font-mono font-bold text-slate-400 group-hover:text-cyan-700">
                          ${item.sr}
                        </td>

                        <!-- Column A: ID (Single Meeting indicator) -->
                        <td class="py-2.5 px-3">
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 group-hover:border-blue-300">
                            Meeting #${item.id}
                          </span>
                        </td>

                        <!-- Column B: S.# -->
                        <td class="py-2.5 px-3 font-mono font-semibold text-slate-600">
                          ${item.sNo || '-'}
                        </td>

                        <!-- Column C: Reference # -->
                        <td class="py-2.5 px-3 font-mono font-bold text-slate-800">
                          ${item.refNo || '-'}
                        </td>

                        <!-- Column D: Meeting Date -->
                        <td class="py-2.5 px-3 font-semibold text-slate-600 whitespace-nowrap">
                          ${item.meetingDate || '-'}
                        </td>

                        <!-- Column E: Issued Date -->
                        <td class="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          ${item.issuedDate || '-'}
                        </td>

                        <!-- Column F: Meeting Agenda -->
                        <td class="py-2.5 px-4 font-semibold text-slate-800 leading-snug whitespace-pre-line">
                          ${item.meetingAgenda || '-'}
                        </td>

                        <!-- Column G: Type of Meeting -->
                        <td class="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                          ${item.typeOfMeeting || '-'}
                        </td>

                        <!-- Column H: MoM / Recommendations -->
                        <td class="py-2.5 px-4 font-bold text-slate-900 leading-snug whitespace-pre-line">
                          ${item.mom || '-'}
                        </td>

                        <!-- Column I: Action (Responsibility Department) -->
                        <td class="py-2.5 px-3 font-black text-blue-800">
                          <span class="px-2 py-0.5 rounded bg-blue-50 border border-blue-100">
                            ${item.action || 'Unassigned'}
                          </span>
                        </td>

                        <!-- Column J: Status (Closed in Green, Open in Bold Red) -->
                        <td class="py-2.5 px-3 text-center">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black border ${isClosed ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-red-50 text-red-600 border-red-300'}">
                            <span class="w-1.5 h-1.5 rounded-full mr-1.5 ${isClosed ? 'bg-emerald-500' : 'bg-red-500'}"></span>
                            ${item.status || (isClosed ? 'Closed' : 'Open')}
                          </span>
                        </td>

                        <!-- Column K: Target Date -->
                        <td class="py-2.5 px-3 font-mono text-slate-500">
                          ${item.targetDate || '-'}
                        </td>

                        <!-- Column L: Remarks -->
                        <td class="py-2.5 px-4 text-slate-600 leading-relaxed">
                          ${item.remarks || '-'}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Table Footer Note -->
            <div class="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 gap-2">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-cyan-500"></span>
                <span>Column A carries Meeting ID: rows sharing the same ID belong to a single Sub_HSE_Mech meeting session.</span>
              </div>
              <div class="flex items-center gap-3 font-mono">
                <span>Total Items: ${filtered.length}</span>
                <span class="text-emerald-600 font-bold">${closedFiltered} Closed</span>
                <span class="text-red-600 font-bold">${openFiltered} Open</span>
              </div>
            </div>

          </div>

          <!-- Modals placeholders -->
          <div id="sub-hse-mech-inspection-modal" class="hidden"></div>
          <div id="sub-hse-mech-settings-modal" class="hidden"></div>

        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  };

  // Auto-init on page load
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => subHseMechSuite.init());
    } else {
      subHseMechSuite.init();
    }
  }

  window.FPCL_SUB_HSE_MECH_SUITE = subHseMechSuite;

})();
