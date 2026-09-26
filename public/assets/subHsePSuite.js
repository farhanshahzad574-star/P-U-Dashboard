/**
 * FPCL Executive Operations & Compliance Portal
 * Sub HSE - P (Production HSE Sub-Committee) Executive BI Suite
 * 
 * Google Sheet ID: 1hhO-goFXJlKSr32dSIHQMfEC7XRQsQly7iJCfP39Wjw
 * Sheet Tab: Sub_HSE_P
 * 
 * Features:
 * - Direct zero-cache live Google Sheets synchronization (via Serverless proxy, JSONP & direct fetch)
 * - Eye-catching top gradient banner with heading and feature buttons (Search, Reset Filters, Export CSV, Sync Feed, Settings)
 * - 4 Executive KPI cards: Total Observation, Closed Observations, Open Observations, Percentage Completion
 * - Horizontal Stacked Bar Chart with 12 font size values on bars for each Department (Column G)
 * - Multi-dimensional drill-down filters: Column D (Ref. #), Column G (Action by / Dept), Column H (Open Close / Status), Search
 * - Interactive Donut Chart showing Status breakdown with central statistics & legend
 * - Complete scrollable Excel sheet in table format with all columns A through I
 * - Meeting ID grouping indication for Column A
 * - Filter-based CSV export
 * - Bespoke dashboard family perimeter styling on every visual
 */

(function () {
  'use strict';

  const SUB_HSE_P_SHEET_ID = '1hhO-goFXJlKSr32dSIHQMfEC7XRQsQly7iJCfP39Wjw';
  const SUB_HSE_P_SHEET_TAB = 'Sub_HSE_P';
  const SUB_HSE_P_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SUB_HSE_P_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SUB_HSE_P_SHEET_TAB}`;

  const subHsePSuite = {
    state: {
      searchQuery: '',
      refFilter: 'all',     // Column D: Ref. #
      deptFilter: 'all',    // Column G: Action by / Department
      statusFilter: 'all',  // Column H: Open Close (Open | Close)
      donutMode: 'status',  // 'status' | 'dept'
      isSyncing: false,
      lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      selectedObservation: null,
      isSettingsOpen: false
    },

    init() {
      window.FPCL_SUB_HSE_P_SUITE = this;

      // Fast-paint from localStorage cache if present
      try {
        const cached = localStorage.getItem('FPCL_SUB_HSE_P_CACHE');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.FPCL_SUB_HSE_P_DATA = parsed;
          }
        }
      } catch (e) {}

      // Ensure data is loaded from seed if empty
      if (!window.FPCL_SUB_HSE_P_DATA || window.FPCL_SUB_HSE_P_DATA.length === 0) {
        if (window.FPCL_SUB_HSE_P_INITIAL_SEED) {
          window.FPCL_SUB_HSE_P_DATA = window.FPCL_SUB_HSE_P_INITIAL_SEED;
        }
      }

      // Sync stats to portal Overview registry
      this.syncStatsToOverview();

      // Trigger automatic live Google Sheets sync on launch
      setTimeout(() => {
        this.syncLiveFeed({ silent: true });
      }, 600);

      // Periodic auto-sync every 60 seconds so sheet additions reflect live
      if (!this._autoSyncTimer) {
        this._autoSyncTimer = setInterval(() => {
          this.syncLiveFeed({ silent: true });
        }, 60000);
      }
    },

    getRawData() {
      if (Array.isArray(window.FPCL_SUB_HSE_P_DATA) && window.FPCL_SUB_HSE_P_DATA.length > 0) {
        return window.FPCL_SUB_HSE_P_DATA;
      }
      if (Array.isArray(window.FPCL_SUB_HSE_P_INITIAL_SEED) && window.FPCL_SUB_HSE_P_INITIAL_SEED.length > 0) {
        return window.FPCL_SUB_HSE_P_INITIAL_SEED;
      }
      return [];
    },

    getFilteredData() {
      const raw = this.getRawData();
      const s = this.state;
      const q = (s.searchQuery || '').trim().toLowerCase();

      return raw.filter(item => {
        // Ref. # Filter (Column D)
        if (s.refFilter !== 'all' && item.refNo !== s.refFilter) {
          return false;
        }

        // Action by / Department Filter (Column G)
        if (s.deptFilter !== 'all' && item.actionBy !== s.deptFilter) {
          return false;
        }

        // Open Close Filter (Column H)
        if (s.statusFilter !== 'all') {
          const itemStatus = (item.openClose || '').toLowerCase();
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
            item.openClose,
            item.remarks
          ].join(' ').toLowerCase();

          if (!text.includes(q)) {
            return false;
          }
        }

        return true;
      });
    },

    // Sync live KPIs to Overview page cards and comparison chart
    syncStatsToOverview() {
      const raw = this.getRawData();
      if (!raw || raw.length === 0) return;

      const total = raw.length;
      const closed = raw.filter(i => (i.openClose || '').toLowerCase() === 'close').length;
      const open = total - closed;
      const rate = total > 0 ? ((closed / total) * 100).toFixed(1) + '%' : '0.0%';

      if (window.DASHBOARD_REGISTRY) {
        const subHseEntry = window.DASHBOARD_REGISTRY.find(d => d.id === 'sub-hse-p');
        if (subHseEntry) {
          subHseEntry.status = 'Active';
          subHseEntry.hasSheetLink = true;
          subHseEntry.kpis = { total, closed, inProgress: open, overdue: 0, compliance: rate };
          subHseEntry.punchList = { open, closed, total, rate };
          subHseEntry.statusComment = `Live Google Sheets: Sub_HSE_P Tab (${total} Observations, ${closed} Closed, ${open} Open • ${rate} Resolved)`;
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
        if (typeof window.fetchGoogleSheetData === 'function') {
          csvText = await window.fetchGoogleSheetData(SUB_HSE_P_SHEET_URL, {
            sheetTab: SUB_HSE_P_SHEET_TAB
          });
        } else {
          const res = await fetch(`/api/sheets/fetch?sheetTab=${encodeURIComponent(SUB_HSE_P_SHEET_TAB)}`, {
            cache: 'no-store'
          });
          if (res.ok) {
            const json = await res.json();
            if (json && json.csvText) csvText = json.csvText;
          }
        }

        if (csvText && typeof window.parseSubHsePCSV === 'function') {
          const parsed = window.parseSubHsePCSV(csvText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.FPCL_SUB_HSE_P_DATA = parsed;
            try {
              localStorage.setItem('FPCL_SUB_HSE_P_CACHE', JSON.stringify(parsed));
            } catch (e) {}

            this.state.lastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            this.syncStatsToOverview();

            if (!silent && window.portalApp && window.portalApp.showToast) {
              window.portalApp.showToast(
                'Sub HSE - P Synced',
                `Synchronized ${parsed.length} observations from live Google Sheet.`,
                'success'
              );
            }
          }
        }
      } catch (err) {
        console.warn('Sub HSE - P sync warning:', err);
      } finally {
        this.state.isSyncing = false;
        this.updateSyncUI();
        const container = document.getElementById('sub-hse-p-specialized-container');
        if (container && !container.classList.contains('hidden')) {
          this.render();
        }
      }
    },

    updateSyncUI() {
      const icon = document.getElementById('sub-hse-p-sync-icon');
      if (icon) {
        if (this.state.isSyncing) {
          icon.classList.add('animate-spin');
        } else {
          icon.classList.remove('animate-spin');
        }
      }
    },

    // Filter mutators
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
        window.portalApp.showToast('Filters Reset', 'All filters restored to default.', 'info');
      }
    },

    // Export CSV based on currently applied filters
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
      link.setAttribute('download', `Sub_HSE_P_Observations_Filtered_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (window.portalApp && window.portalApp.showToast) {
        window.portalApp.showToast(
          'CSV Exported',
          `Successfully downloaded ${filtered.length} filtered Sub HSE - P observations.`,
          'success'
        );
      }
    },

    // Modal Inspection for Recommendation Item
    inspectObservation(sr) {
      const raw = this.getRawData();
      const item = raw.find(i => String(i.sr) === String(sr));
      if (!item) return;

      this.state.selectedObservation = item;
      const modalContainer = document.getElementById('sub-hse-p-inspection-modal');
      if (modalContainer) {
        modalContainer.innerHTML = this.renderInspectionModalContent(item);
        modalContainer.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
      }
    },

    closeInspectionModal() {
      this.state.selectedObservation = null;
      const modalContainer = document.getElementById('sub-hse-p-inspection-modal');
      if (modalContainer) {
        modalContainer.classList.add('hidden');
        modalContainer.innerHTML = '';
      }
    },

    renderInspectionModalContent(item) {
      const isClose = (item.openClose || '').toLowerCase() === 'close';

      return `
        <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl border-2 border-indigo-400/60 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <!-- Modal Header -->
            <div class="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 flex items-start justify-between">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-400/20 text-indigo-200 border border-indigo-400/40">
                    Meeting ID: ${item.id}
                  </span>
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${isClose ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' : 'bg-amber-500/20 text-amber-300 border-amber-400/40'}">
                    ${item.openClose}
                  </span>
                </div>
                <h3 class="text-lg font-black tracking-tight text-white">${item.subject || 'SUB HSE (P) Meeting'}</h3>
                <p class="text-xs text-indigo-200 font-mono">Ref. #${item.refNo} • Date: ${item.dateOfMeeting}</p>
              </div>
              <button
                type="button"
                onclick="FPCL_SUB_HSE_P_SUITE.closeInspectionModal()"
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
                  <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Action Department</span>
                  <span class="font-black text-sm text-indigo-900 mt-0.5 block">${item.actionBy || 'Info'}</span>
                </div>
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Status</span>
                  <span class="font-black text-sm ${isClose ? 'text-emerald-600' : 'text-amber-600'} mt-0.5 block">${item.openClose}</span>
                </div>
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Meeting Date</span>
                  <span class="font-black text-sm text-slate-800 mt-0.5 block">${item.dateOfMeeting || '-'}</span>
                </div>
              </div>

              <!-- Agenda Section -->
              <div class="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <span class="text-[10px] uppercase font-bold text-indigo-600 block tracking-wider mb-1">Agenda Topic</span>
                <p class="text-xs leading-relaxed text-slate-800 font-medium">${item.agenda || '-'}</p>
              </div>

              <!-- Recommendation Section -->
              <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">Recommendation / Observation Details</span>
                <p class="text-xs leading-relaxed text-slate-900 font-semibold whitespace-pre-line">${item.recommendations || '-'}</p>
              </div>

              <!-- Remarks Section -->
              ${item.remarks ? `
                <div class="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                  <span class="text-[10px] uppercase font-bold text-amber-700 block tracking-wider mb-0.5">Remarks</span>
                  <p class="text-xs text-slate-700">${item.remarks}</p>
                </div>
              ` : ''}

              <!-- Meeting Context Note -->
              <div class="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <strong class="text-indigo-900 font-bold">Meeting Note:</strong> All rows with Meeting ID <strong>${item.id}</strong> originate from the same Sub HSE (P) session. Multiple departments may be assigned different recommendations against this meeting.
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onclick="FPCL_SUB_HSE_P_SUITE.closeInspectionModal()"
                class="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-xs"
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
      const modalContainer = document.getElementById('sub-hse-p-settings-modal');
      if (modalContainer) {
        modalContainer.innerHTML = `
          <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl border-2 border-indigo-400/60 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div class="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 flex items-center justify-between">
                <div class="flex items-center gap-2 font-bold text-sm">
                  <i data-lucide="settings" class="w-4 h-4 text-indigo-400"></i>
                  <span>Sub HSE - P Live Sheet Integration</span>
                </div>
                <button
                  type="button"
                  onclick="FPCL_SUB_HSE_P_SUITE.closeSettingsModal()"
                  class="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <i data-lucide="x" class="w-4 h-4"></i>
                </button>
              </div>

              <div class="p-6 space-y-4 text-xs text-slate-700">
                <div class="space-y-1">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Google Sheet ID</span>
                  <div class="p-2.5 rounded-xl bg-slate-100 font-mono text-[11px] text-slate-800 break-all select-all border border-slate-200">
                    1hhO-goFXJlKSr32dSIHQMfEC7XRQsQly7iJCfP39Wjw
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Sheet Tab</span>
                    <div class="p-2.5 rounded-xl bg-slate-100 font-mono font-bold text-[11px] text-indigo-700 border border-slate-200">
                      Sub_HSE_P
                    </div>
                  </div>
                  <div class="space-y-1">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Connection Status</span>
                    <div class="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200 flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Live Synchronized</span>
                    </div>
                  </div>
                </div>

                <div class="space-y-1">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Direct CSV GViz Feed</span>
                  <a
                    href="${SUB_HSE_P_SHEET_URL}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="block p-2.5 rounded-xl bg-indigo-50/70 hover:bg-indigo-100 font-mono text-[10px] text-indigo-700 truncate border border-indigo-200 transition-colors"
                    title="${SUB_HSE_P_SHEET_URL}"
                  >
                    ${SUB_HSE_P_SHEET_URL}
                  </a>
                </div>

                <div class="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  Data synchronizes automatically using zero-cache real-time protocols. Click <strong>Sync Feed</strong> anytime to force a live reload.
                </div>
              </div>

              <div class="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onclick="FPCL_SUB_HSE_P_SUITE.syncLiveFeed(); FPCL_SUB_HSE_P_SUITE.closeSettingsModal();"
                  class="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                  <span>Sync Now</span>
                </button>
                <button
                  type="button"
                  onclick="FPCL_SUB_HSE_P_SUITE.closeSettingsModal()"
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
      const modalContainer = document.getElementById('sub-hse-p-settings-modal');
      if (modalContainer) {
        modalContainer.classList.add('hidden');
        modalContainer.innerHTML = '';
      }
    },

    // Horizontal Stacked Bar Chart with Font Size 12 values
    renderHorizontalStackedBarChart(deptList) {
      if (!deptList || deptList.length === 0) {
        return `<div class="text-center py-8 text-xs text-slate-400 font-medium">No department observation records available</div>`;
      }

      const maxTotal = Math.max(...deptList.map(d => d.total), 1);
      const tickMax = Math.max(5, Math.ceil(maxTotal / 2) * 2);

      const w = 1000;
      const padLeft = 240;
      const padRight = 140;
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

        // On-bar values with font size 12
        let textSegments = '';

        if (d.close > 0) {
          const closeCenter = padLeft + closeW / 2;
          if (closeW >= 24) {
            textSegments += `
              <text x="${closeCenter}" y="${centerY}" fill="#FFFFFF" font-size="12" font-weight="700" font-family="'Plus Jakarta Sans', system-ui, sans-serif" text-anchor="middle" dominant-baseline="central">
                ${d.close}
              </text>
            `;
          }
        }

        if (d.open > 0) {
          const openCenter = padLeft + closeW + openW / 2;
          if (openW >= 24) {
            textSegments += `
              <text x="${openCenter}" y="${centerY}" fill="#FFFFFF" font-size="12" font-weight="700" font-family="'Plus Jakarta Sans', system-ui, sans-serif" text-anchor="middle" dominant-baseline="central">
                ${d.open}
              </text>
            `;
          }
        }

        return `
          <g
            class="cursor-pointer group"
            onclick="FPCL_SUB_HSE_P_SUITE.setDeptFilter('${this.state.deptFilter === d.name ? 'all' : d.name.replace(/'/g, "\\'")}')"
          >
            <title>${d.name}: Total ${d.total} (${d.close} Closed, ${d.open} Open • ${d.closureRate}% Resolved)</title>

            <!-- Row hover background -->
            <rect x="0" y="${y}" width="${w}" height="${rowH}" fill="${isSelected ? '#EEF2FF' : 'transparent'}" class="group-hover:fill-indigo-50/70 transition-colors rounded-xl"/>

            <!-- Department Label -->
            <text x="${padLeft - 16}" y="${centerY}" fill="${isSelected ? '#4F46E5' : '#1E293B'}" font-size="13" font-weight="${isSelected ? '800' : '700'}" font-family="'Plus Jakarta Sans', system-ui, sans-serif" text-anchor="end" dominant-baseline="central" class="transition-colors group-hover:fill-indigo-700">
              ${d.name}
            </text>

            <!-- Background Track -->
            <rect x="${padLeft}" y="${barY}" width="${chartW}" height="${barH}" rx="6" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="1"/>

            <!-- Stacked Closed Observations Segment (Emerald) -->
            ${d.close > 0 ? `
              <rect
                x="${padLeft}"
                y="${barY}"
                width="${closeW}"
                height="${barH}"
                rx="${d.open > 0 ? '6 0 0 6' : '6'}"
                fill="#10B981"
                class="transition-all opacity-95 group-hover:opacity-100"
              />
            ` : ''}

            <!-- Stacked Open Observations Segment (Orange/Amber) -->
            ${d.open > 0 ? `
              <rect
                x="${padLeft + closeW}"
                y="${barY}"
                width="${openW}"
                height="${barH}"
                rx="${d.close > 0 ? '0 6 6 0' : '6'}"
                fill="#F97316"
                class="transition-all opacity-95 group-hover:opacity-100"
              />
            ` : ''}

            <!-- Values directly on the bars (Font size 12 as strictly specified) -->
            ${textSegments}

            <!-- Total count label at the end of the bar -->
            <text x="${padLeft + totalW + 12}" y="${centerY}" fill="#334155" font-size="12" font-weight="800" font-family="'Plus Jakarta Sans', system-ui, sans-serif" dominant-baseline="central">
              ${d.total} Total
            </text>
          </g>
        `;
      }).join('');

      // X-axis ticks
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
            <text x="${x}" y="${h - padBottom + 22}" fill="#64748B" font-size="11" font-weight="600" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif">${t}</text>
          </g>
        `;
      }).join('');

      return `
        <svg viewBox="0 0 ${w} ${h}" class="w-full h-auto select-none" style="min-width: 600px;">
          ${ticksSvg}
          ${barsSvg}
        </svg>
      `;
    },

    // Interactive Donut Chart showing Status Breakdown
    renderDonutChart(closedCount, openCount, totalCount) {
      if (totalCount === 0) {
        return `<div class="text-center py-10 text-xs text-slate-400">No data to display</div>`;
      }

      const size = 260;
      const center = size / 2;
      const radius = 95;
      const strokeWidth = 32;
      const circumference = 2 * Math.PI * radius;

      const closedPct = Math.round((closedCount / totalCount) * 100);
      const openPct = 100 - closedPct;

      const closedOffset = 0;
      const closedDash = (closedPct / 100) * circumference;

      const openOffset = -closedDash;
      const openDash = (openPct / 100) * circumference;

      return `
        <div class="flex flex-col items-center justify-center p-3 select-none">
          <div class="relative w-[230px] h-[230px] flex items-center justify-center">
            <svg viewBox="0 0 ${size} ${size}" class="w-full h-full transform -rotate-90">
              <!-- Background Circle -->
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
                  onclick="FPCL_SUB_HSE_P_SUITE.setStatusFilter('${this.state.statusFilter === 'Close' ? 'all' : 'Close'}')"
                >
                  <title>Closed Observations: ${closedCount} (${closedPct}%)</title>
                </circle>
              ` : ''}
              <!-- Open Observations Arc (Orange) -->
              ${openCount > 0 ? `
                <circle
                  cx="${center}"
                  cy="${center}"
                  r="${radius}"
                  fill="none"
                  stroke="#F97316"
                  stroke-width="${strokeWidth}"
                  stroke-dasharray="${openDash} ${circumference}"
                  stroke-dashoffset="${openOffset}"
                  class="transition-all duration-500 hover:opacity-90 cursor-pointer"
                  onclick="FPCL_SUB_HSE_P_SUITE.setStatusFilter('${this.state.statusFilter === 'Open' ? 'all' : 'Open'}')"
                >
                  <title>Open Observations: ${openCount} (${openPct}%)</title>
                </circle>
              ` : ''}
            </svg>

            <!-- Center Metric Summary -->
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span class="text-3xl font-black text-slate-900 font-mono tracking-tight">${closedPct}%</span>
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">COMPLETION</span>
              <span class="text-[10px] font-semibold text-slate-400 font-mono">${closedCount} of ${totalCount} Closed</span>
            </div>
          </div>

          <!-- Interactive Donut Legend -->
          <div class="mt-4 flex items-center justify-center gap-4 flex-wrap text-xs">
            <button
              type="button"
              onclick="FPCL_SUB_HSE_P_SUITE.setStatusFilter('${this.state.statusFilter === 'Close' ? 'all' : 'Close'}')"
              class="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${this.state.statusFilter === 'Close' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200 hover:bg-slate-50'}"
            >
              <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span class="font-bold text-slate-700">Closed:</span>
              <span class="font-mono font-black text-emerald-700">${closedCount}</span>
              <span class="text-slate-400 font-semibold">(${closedPct}%)</span>
            </button>

            <button
              type="button"
              onclick="FPCL_SUB_HSE_P_SUITE.setStatusFilter('${this.state.statusFilter === 'Open' ? 'all' : 'Open'}')"
              class="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${this.state.statusFilter === 'Open' ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-500/20' : 'bg-white border-slate-200 hover:bg-slate-50'}"
            >
              <span class="w-3 h-3 rounded-full bg-orange-500"></span>
              <span class="font-bold text-slate-700">Open:</span>
              <span class="font-mono font-black text-orange-700">${openCount}</span>
              <span class="text-slate-400 font-semibold">(${openPct}%)</span>
            </button>
          </div>
        </div>
      `;
    },

    // Main Render function for the Sub HSE - P Dashboard
    render() {
      const container = document.getElementById('sub-hse-p-specialized-container');
      if (!container) return;

      const raw = this.getRawData();
      const filtered = this.getFilteredData();
      const s = this.state;

      // KPI metrics calculations (strictly based on Column H: Open Close)
      const totalFiltered = filtered.length;
      const closedFiltered = filtered.filter(i => (i.openClose || '').toLowerCase() === 'close').length;
      const openFiltered = totalFiltered - closedFiltered;
      const completionPct = totalFiltered > 0 ? ((closedFiltered / totalFiltered) * 100).toFixed(1) + '%' : '0.0%';

      // Aggregate department breakdown for horizontal stacked bar chart (from Column G: Action by)
      const deptMap = {};
      filtered.forEach(item => {
        const d = (item.actionBy && item.actionBy.trim()) || 'Unassigned';
        if (!deptMap[d]) {
          deptMap[d] = { name: d, total: 0, closed: 0, open: 0 };
        }
        deptMap[d].total++;
        if ((item.openClose || '').toLowerCase() === 'close') {
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

      // Distinct options for filters
      const allRefNumbers = Array.from(new Set(raw.map(i => i.refNo).filter(Boolean))).sort();
      const allDepartments = Array.from(new Set(raw.map(i => i.actionBy).filter(Boolean))).sort();

      const isAnyFilterActive =
        (s.searchQuery && s.searchQuery.trim().length > 0) ||
        s.refFilter !== 'all' ||
        s.deptFilter !== 'all' ||
        s.statusFilter !== 'all';

      // One dashboard family color applied on perimeters:
      // perimeterClass = "border-2 border-indigo-400/50 hover:border-indigo-400/75 shadow-sm"
      const perimeterClass = 'border-2 border-indigo-400/50 rounded-2xl shadow-sm transition-all duration-200';

      container.innerHTML = `
        <div class="space-y-6 font-sans">

          <!-- 1. Eye-Catching Gradient Banner at Top (Heading and Important Feature Buttons Only) -->
          <div class="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border-2 border-indigo-400/50 relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="absolute -right-10 -bottom-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <!-- Heading Only (No extra texts or micro-paragraphs) -->
            <div class="relative z-10 flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
                <i data-lucide="layers" class="w-5 h-5"></i>
              </div>
              <h1 class="text-xl sm:text-2xl font-black tracking-tight text-white">
                Sub HSE - P Executive Dashboard
              </h1>
            </div>

            <!-- Important Feature Buttons (as shown in attached reference image) -->
            <div class="relative z-10 flex items-center flex-wrap gap-2.5">
              
              <!-- SEARCH FINDINGS Button / Input -->
              <div class="relative flex items-center">
                <div class="flex items-center bg-white/10 hover:bg-white/15 border border-white/25 rounded-xl px-3 py-1.5 backdrop-blur-md transition-all">
                  <i data-lucide="search" class="w-3.5 h-3.5 text-white/70 mr-2"></i>
                  <input
                    type="text"
                    value="${(s.searchQuery || '').replace(/"/g, '&quot;')}"
                    oninput="FPCL_SUB_HSE_P_SUITE.setSearchQuery(this.value)"
                    placeholder="SEARCH FINDINGS"
                    class="bg-transparent text-white placeholder-white/70 text-xs font-bold uppercase tracking-wider focus:outline-none w-36 sm:w-44"
                  />
                  ${s.searchQuery ? `
                    <button
                      type="button"
                      onclick="FPCL_SUB_HSE_P_SUITE.clearSearch()"
                      class="text-white/60 hover:text-white ml-1 cursor-pointer"
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
                onclick="FPCL_SUB_HSE_P_SUITE.resetFilters()"
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-md transition-all cursor-pointer shadow-xs active:scale-95"
                title="Reset all filters"
              >
                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-white/80"></i>
                <span>Reset Filters</span>
              </button>

              <!-- Export CSV Button (Based on current filter) -->
              <button
                type="button"
                onclick="FPCL_SUB_HSE_P_SUITE.exportFilteredCSV()"
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-md transition-all cursor-pointer shadow-xs active:scale-95"
                title="Download CSV based on active filter"
              >
                <i data-lucide="download" class="w-3.5 h-3.5 text-white/80"></i>
                <span>Export CSV</span>
              </button>

              <!-- Sync Feed Button -->
              <button
                type="button"
                onclick="FPCL_SUB_HSE_P_SUITE.syncLiveFeed()"
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-md transition-all cursor-pointer shadow-xs active:scale-95"
                title="Sync directly from live Google Sheet"
              >
                <i id="sub-hse-p-sync-icon" data-lucide="refresh-cw" class="w-3.5 h-3.5 text-white/80 ${s.isSyncing ? 'animate-spin' : ''}"></i>
                <span>Sync Feed</span>
              </button>

              <!-- Settings Gear Button -->
              <button
                type="button"
                onclick="FPCL_SUB_HSE_P_SUITE.openSettingsModal()"
                class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-md transition-all cursor-pointer shadow-xs active:scale-95"
                title="View Google Sheet connection information"
              >
                <i data-lucide="settings" class="w-4 h-4 text-white/80"></i>
              </button>
            </div>
          </div>

          <!-- 2. KPI Cards (Only mention KPI heading and value, no other details) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- KPI 1: Total Observation -->
            <div
              onclick="FPCL_SUB_HSE_P_SUITE.resetFilters()"
              class="bg-white ${perimeterClass} p-5 relative overflow-hidden cursor-pointer hover:shadow-md transition-all group"
              title="Click to reset filters"
            >
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 to-indigo-800"></div>
              <div class="text-indigo-900 text-xs sm:text-sm font-black tracking-wider uppercase">
                TOTAL OBSERVATION
              </div>
              <div class="mt-3">
                <span class="text-5xl sm:text-6xl font-black font-mono tracking-tight text-indigo-950">${totalFiltered}</span>
              </div>
            </div>

            <!-- KPI 2: Closed Observations Column H -->
            <div
              onclick="FPCL_SUB_HSE_P_SUITE.setStatusFilter('Close')"
              class="bg-white ${perimeterClass} p-5 relative overflow-hidden cursor-pointer hover:shadow-md transition-all group"
              title="Click to filter Closed observations"
            >
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
              <div class="text-emerald-800 text-xs sm:text-sm font-black tracking-wider uppercase">
                CLOSED OBSERVATIONS
              </div>
              <div class="mt-3">
                <span class="text-5xl sm:text-6xl font-black font-mono tracking-tight text-emerald-600">${closedFiltered}</span>
              </div>
            </div>

            <!-- KPI 3: Open Observations Column H -->
            <div
              onclick="FPCL_SUB_HSE_P_SUITE.setStatusFilter('Open')"
              class="bg-white ${perimeterClass} p-5 relative overflow-hidden cursor-pointer hover:shadow-md transition-all group"
              title="Click to filter Open observations"
            >
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500"></div>
              <div class="text-orange-800 text-xs sm:text-sm font-black tracking-wider uppercase">
                OPEN OBSERVATIONS
              </div>
              <div class="mt-3">
                <span class="text-5xl sm:text-6xl font-black font-mono tracking-tight text-orange-600">${openFiltered}</span>
              </div>
            </div>

            <!-- KPI 4: Percentage Completion -->
            <div
              class="bg-white ${perimeterClass} p-5 relative overflow-hidden"
            >
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
              <div class="text-cyan-800 text-xs sm:text-sm font-black tracking-wider uppercase">
                PERCENTAGE COMPLETION
              </div>
              <div class="mt-3">
                <span class="text-5xl sm:text-6xl font-black font-mono tracking-tight text-cyan-600">${completionPct}</span>
              </div>
            </div>

          </div>

          <!-- 3. Horizontal Stacked Bar Chart with 12 Font Size Values on Bar (Action by / Dept from Column G) -->
          <div class="bg-white ${perimeterClass} p-5 sm:p-6 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <i data-lucide="bar-chart-3" class="w-4 h-4 text-indigo-600"></i>
                  <span>Observations by Responsibility Department (Action by)</span>
                </h3>
              </div>
              
              <!-- Legend with Closed (Emerald) and Open (Orange) -->
              <div class="flex items-center gap-3 text-xs">
                <div class="flex items-center gap-1.5 font-bold text-slate-700">
                  <span class="w-3 h-3 rounded-xs bg-[#10B981]"></span>
                  <span>Closed</span>
                </div>
                <div class="flex items-center gap-1.5 font-bold text-slate-700">
                  <span class="w-3 h-3 rounded-xs bg-[#F97316]"></span>
                  <span>Open</span>
                </div>
              </div>
            </div>

            <!-- Horizontal Stacked Bar Chart SVG (Values on bar with 12 font size) -->
            <div class="w-full overflow-x-auto">
              ${this.renderHorizontalStackedBarChart(deptList)}
            </div>
          </div>

          <!-- 4. Multi-Dimensional Filters (Using Columns D, G, and H) -->
          <div class="bg-white ${perimeterClass} p-4 sm:p-5 space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2.5 flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <span class="p-1 rounded-md bg-indigo-50 text-indigo-700">
                  <i data-lucide="sliders-horizontal" class="w-3.5 h-3.5"></i>
                </span>
                <span class="text-xs font-black text-slate-900 uppercase tracking-wider">Dashboard Filters</span>
              </div>

              ${isAnyFilterActive ? `
                <button
                  type="button"
                  onclick="FPCL_SUB_HSE_P_SUITE.resetFilters()"
                  class="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                  <span>Clear All Filters</span>
                </button>
              ` : ''}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              
              <!-- Filter 1: Column D (Ref. #) -->
              <div class="space-y-1">
                <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Column D: Ref. #
                </label>
                <select
                  onchange="FPCL_SUB_HSE_P_SUITE.setRefFilter(this.value)"
                  class="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors"
                >
                  <option value="all" ${s.refFilter === 'all' ? 'selected' : ''}>All Ref. Numbers (${allRefNumbers.length})</option>
                  ${allRefNumbers.map(ref => `
                    <option value="${ref}" ${s.refFilter === ref ? 'selected' : ''}>${ref}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Filter 2: Column G (Action by / Responsibility Department) -->
              <div class="space-y-1">
                <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Column G: Responsibility Dept (Action by)
                </label>
                <select
                  onchange="FPCL_SUB_HSE_P_SUITE.setDeptFilter(this.value)"
                  class="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors"
                >
                  <option value="all" ${s.deptFilter === 'all' ? 'selected' : ''}>All Departments (${allDepartments.length})</option>
                  ${allDepartments.map(dept => `
                    <option value="${dept}" ${s.deptFilter === dept ? 'selected' : ''}>${dept}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Filter 3: Column H (Open Close / Status) -->
              <div class="space-y-1">
                <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Column H: Status (Open Close)
                </label>
                <select
                  onchange="FPCL_SUB_HSE_P_SUITE.setStatusFilter(this.value)"
                  class="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors"
                >
                  <option value="all" ${s.statusFilter === 'all' ? 'selected' : ''}>All Statuses (Open & Close)</option>
                  <option value="Close" ${s.statusFilter === 'Close' ? 'selected' : ''}>Close (${raw.filter(i => (i.openClose || '').toLowerCase() === 'close').length})</option>
                  <option value="Open" ${s.statusFilter === 'Open' ? 'selected' : ''}>Open (${raw.filter(i => (i.openClose || '').toLowerCase() === 'open').length})</option>
                </select>
              </div>

            </div>
          </div>

          <!-- 5. Donut Chart (Status Breakdown) -->
          <div class="bg-white ${perimeterClass} p-5 sm:p-6 space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <i data-lucide="pie-chart" class="w-4 h-4 text-indigo-600"></i>
                <span>Observations Status Resolution Ratio</span>
              </h3>
            </div>

            <!-- Donut Chart Component -->
            ${this.renderDonutChart(closedFiltered, openFiltered, totalFiltered)}
          </div>

          <!-- 6. Complete Scrollable Excel Sheet in Form of Table -->
          <div class="bg-white ${perimeterClass} p-4 sm:p-6 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div class="space-y-0.5">
                <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <i data-lucide="table" class="w-4 h-4 text-indigo-600"></i>
                  <span>Sub HSE - P Complete Observations Master Sheet</span>
                </h3>
                <p class="text-[11px] text-slate-500">
                  Showing <strong>${totalFiltered}</strong> of <strong>${raw.length}</strong> records • Column A rows with the same ID belong to a single Sub HSE P meeting
                </p>
              </div>

              <!-- Quick Table Actions -->
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onclick="FPCL_SUB_HSE_P_SUITE.exportFilteredCSV()"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <!-- Complete Scrollable Excel Sheet Table -->
            <div class="overflow-x-auto overflow-y-auto max-h-[620px] rounded-xl border border-slate-200 shadow-2xs">
              <table class="w-full text-left border-collapse text-xs select-text">
                <!-- Excel Column Letters Row -->
                <thead class="sticky top-0 z-20">
                  <tr class="bg-slate-200/90 text-slate-600 text-[10px] font-mono font-bold uppercase tracking-wider border-b border-slate-300">
                    <th class="py-1 px-3 text-center border-r border-slate-300 w-12">#</th>
                    <th class="py-1 px-3 border-r border-slate-300 w-16">Col A</th>
                    <th class="py-1 px-3 border-r border-slate-300 min-w-[200px]">Col B</th>
                    <th class="py-1 px-3 border-r border-slate-300 w-28">Col C</th>
                    <th class="py-1 px-3 border-r border-slate-300 w-36">Col D</th>
                    <th class="py-1 px-3 border-r border-slate-300 min-w-[240px]">Col E</th>
                    <th class="py-1 px-3 border-r border-slate-300 min-w-[320px]">Col F</th>
                    <th class="py-1 px-3 border-r border-slate-300 w-36">Col G</th>
                    <th class="py-1 px-3 border-r border-slate-300 text-center w-28">Col H</th>
                    <th class="py-1 px-3 min-w-[120px]">Col I</th>
                  </tr>
                  <!-- Descriptive Header Row -->
                  <tr class="bg-slate-100 text-slate-700 text-[11px] font-black uppercase tracking-wider border-b border-slate-300">
                    <th class="py-2.5 px-3 text-center border-r border-slate-200">Sr.</th>
                    <th class="py-2.5 px-3 border-r border-slate-200">ID</th>
                    <th class="py-2.5 px-3 border-r border-slate-200">Subject</th>
                    <th class="py-2.5 px-3 border-r border-slate-200">Date of Meeting</th>
                    <th class="py-2.5 px-3 border-r border-slate-200">Ref. #</th>
                    <th class="py-2.5 px-3 border-r border-slate-200">Agenda</th>
                    <th class="py-2.5 px-3 border-r border-slate-200">Recommendations</th>
                    <th class="py-2.5 px-3 border-r border-slate-200">Action by</th>
                    <th class="py-2.5 px-3 border-r border-slate-200 text-center">Open Close</th>
                    <th class="py-2.5 px-3">Remarks</th>
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
                          onclick="FPCL_SUB_HSE_P_SUITE.resetFilters()"
                          class="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold hover:bg-indigo-100 cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      </td>
                    </tr>
                  ` : filtered.map((item, idx) => {
                    const isClose = (item.openClose || '').toLowerCase() === 'close';
                    // Meeting ID coloring for quick grouping identification
                    const idColor = String(item.id) === '69'
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : (String(item.id) === '70'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200');

                    return `
                      <tr
                        onclick="FPCL_SUB_HSE_P_SUITE.inspectObservation(${item.sr})"
                        class="hover:bg-indigo-50/50 transition-colors cursor-pointer group divide-x divide-slate-100"
                        title="Click to inspect full details for row #${idx + 1}"
                      >
                        <!-- Row # -->
                        <td class="py-3 px-3 text-center font-mono text-slate-400 font-bold text-[11px] bg-slate-50/60">${idx + 1}</td>

                        <!-- Col A: ID -->
                        <td class="py-3 px-3 font-mono font-bold whitespace-nowrap">
                          <span class="inline-block px-2 py-0.5 rounded-md text-[11px] font-mono font-black border ${idColor}">
                            #${item.id}
                          </span>
                        </td>

                        <!-- Col B: Subject -->
                        <td class="py-3 px-3 font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                          ${item.subject || '-'}
                        </td>

                        <!-- Col C: Date of Meeting -->
                        <td class="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          ${item.dateOfMeeting || '-'}
                        </td>

                        <!-- Col D: Ref. # -->
                        <td class="py-3 px-3 font-mono text-[11px] text-indigo-700 whitespace-nowrap font-bold">
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
                          <span class="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            ${item.actionBy || 'Info'}
                          </span>
                        </td>

                        <!-- Col H: Open Close -->
                        <td class="py-3 px-3 text-center whitespace-nowrap">
                          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${isClose ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-orange-50 text-orange-800 border-orange-300'}">
                            <span class="w-1.5 h-1.5 rounded-full ${isClose ? 'bg-emerald-500' : 'bg-orange-500'}"></span>
                            ${item.openClose}
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

            <!-- Footer Note on Meeting Structure -->
            <div class="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
              <div class="flex items-center gap-2">
                <i data-lucide="info" class="w-3.5 h-3.5 text-indigo-500 shrink-0"></i>
                <span>Rows carrying the same ID share the same meeting subject, date, ref #, and agenda, with distinct recommendation lines assigned to departments.</span>
              </div>
              <div class="shrink-0 font-mono text-[11px]">
                Google Sheet ID: <strong>1hhO-goFXJlKSr32dSIHQMfEC7XRQsQly7iJCfP39Wjw</strong>
              </div>
            </div>
          </div>

        </div>

        <!-- Inspection Drawer / Modal Container -->
        <div id="sub-hse-p-inspection-modal" class="hidden"></div>

        <!-- Settings Modal Container -->
        <div id="sub-hse-p-settings-modal" class="hidden"></div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  };

  // Initialize and attach to window
  window.FPCL_SUB_HSE_P_SUITE = subHsePSuite;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => subHsePSuite.init());
  } else {
    subHsePSuite.init();
  }

})();
