/**
 * FPCL Executive Operations & Compliance Portal
 * Integrated Management System (IMS) Audits Executive BI Suite
 * 
 * Google Sheet ID: 1amCHA8y_tqgR8dCJgXjjAXgUH5TESAXx8QZycRRHTi0
 * Sheet Tab: IMS_Audit
 * 
 * Design & Layout:
 * - Professional Executive BI color scheme & layout matching reference specification
 * - Top Navigation & Action Banner (Live Google Sheet status, Sync, Export, Reset, Sheet link)
 * - 4 Executive KPI Cards:
 *     1. TOTAL FINDINGS (Slate/Dark)
 *     2. OPEN FINDINGS (Rose/Red accent with % of total)
 *     3. CLOSED FINDINGS (Emerald green accent with % of total)
 *     4. % CLOSURE (Teal/Cyan accent)
 * - Clean Universal Filter Bar (Status, Action Dept, Standards, Quick Search, Reset)
 * - Main 2-Column Visuals Grid:
 *     Left: OPEN VS. CLOSED FINDINGS BY ACTION DEPARTMENT
 *           - Bar height 44px, spacious 68px row height
 *           - Inside values: bold 22px monospace with drop shadow (Open Coral-Red #F43F5E, Closed Emerald #10B981)
 *           - End values: Total 26px font-black, Closure Rate 20px font-extrabold (#0D9488)
 *           - Dept labels: 19px font-extrabold text-slate-800
 *           - Scale axis ticks: 18px bold monospace
 *           - Card title: uppercase 18px with enlarged legend badges
 *     Right: AUDIT BREAKDOWN
 *           - Metric tabs (Status / Standards)
 *           - Interactive SVG Donut Chart with center % and interactive legend
 * - Full-Width Excel Spreadsheet Findings Table with pagination, search, status badges, and detail modal
 */

(function () {
  'use strict';

  const HARDCODED_IMS_SHEET_ID = '1amCHA8y_tqgR8dCJgXjjAXgUH5TESAXx8QZycRRHTi0';
  const HARDCODED_IMS_SHEET_TAB = 'IMS_Audit';
  const HARDCODED_IMS_SHEET_URL = `https://docs.google.com/spreadsheets/d/${HARDCODED_IMS_SHEET_ID}/export?format=csv&sheet=${HARDCODED_IMS_SHEET_TAB}`;

  const imsSuite = {
    state: {
      searchQuery: '',
      deptFilter: 'all',
      statusFilter: 'all', // 'all' | 'Close' | 'Open'
      standardFilter: 'all',
      breakdownTab: 'status', // 'status' | 'standards'
      deptSortBy: 'total_desc', // 'total_desc' | 'name_asc'
      page: 1,
      pageSize: 15,
      isSyncing: false,
      lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      selectedFinding: null
    },

    init() {
      window.FPCL_IMS_SUITE = this;

      // Fast-paint from localStorage cache if present
      try {
        const cached = localStorage.getItem('FPCL_IMS_DATA_CACHE');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.FPCL_IMS_DATA = parsed;
          }
        }
      } catch (e) {}

      // Fallback to initial authentic dataset
      if (!window.FPCL_IMS_DATA || window.FPCL_IMS_DATA.length === 0) {
        if (Array.isArray(window.FPCL_IMS_INITIAL_DATA) && window.FPCL_IMS_INITIAL_DATA.length > 0) {
          window.FPCL_IMS_DATA = [...window.FPCL_IMS_INITIAL_DATA];
        }
      }

      // Sync stats to overview
      this.syncStatsToOverview();

      // Trigger background live sync on load
      setTimeout(() => {
        this.syncLiveFeed({ silent: true });
      }, 800);

      // Periodic auto-sync every 60 seconds
      if (!this._autoSyncTimer) {
        this._autoSyncTimer = setInterval(() => {
          this.syncLiveFeed({ silent: true });
        }, 60000);
      }
    },

    getRawData() {
      if (Array.isArray(window.FPCL_IMS_DATA) && window.FPCL_IMS_DATA.length > 0) {
        return window.FPCL_IMS_DATA;
      }
      if (Array.isArray(window.FPCL_IMS_INITIAL_DATA)) {
        return window.FPCL_IMS_INITIAL_DATA;
      }
      return [];
    },

    getFilteredData() {
      const raw = this.getRawData();
      const s = this.state;
      const q = s.searchQuery.toLowerCase().trim();

      return raw.filter(item => {
        // Status filter
        if (s.statusFilter !== 'all') {
          if (item.status.toLowerCase() !== s.statusFilter.toLowerCase()) {
            return false;
          }
        }

        // Department filter
        if (s.deptFilter !== 'all') {
          if (item.dept !== s.deptFilter) {
            return false;
          }
        }

        // Standard filter
        if (s.standardFilter !== 'all') {
          if (!item.standards.toLowerCase().includes(s.standardFilter.toLowerCase())) {
            return false;
          }
        }

        // Search query filter
        if (q) {
          const inRef = (item.ref || '').toLowerCase().includes(q);
          const inGap = (item.gap || '').toLowerCase().includes(q);
          const inRec = (item.recommendation || '').toLowerCase().includes(q);
          const inDept = (item.dept || '').toLowerCase().includes(q);
          const inRemarks = (item.remarks || '').toLowerCase().includes(q);
          const inStd = (item.standards || '').toLowerCase().includes(q);
          const inDate = (item.targetDate || '').toLowerCase().includes(q);
          if (!inRef && !inGap && !inRec && !inDept && !inRemarks && !inStd && !inDate) {
            return false;
          }
        }

        return true;
      });
    },

    getDepartmentSummary(dataset) {
      const data = dataset || this.getFilteredData();
      const deptMap = {};

      data.forEach(item => {
        const d = item.dept || 'Unassigned';
        if (!deptMap[d]) {
          deptMap[d] = { dept: d, total: 0, close: 0, open: 0 };
        }
        deptMap[d].total++;
        if (item.status === 'Close') {
          deptMap[d].close++;
        } else {
          deptMap[d].open++;
        }
      });

      const list = Object.values(deptMap).map(row => {
        const rate = row.total > 0 ? Math.round((row.close / row.total) * 100) : 0;
        return { ...row, rate };
      });

      // Sorting
      if (this.state.deptSortBy === 'name_asc') {
        list.sort((a, b) => a.dept.localeCompare(b.dept));
      } else {
        // Default: Total findings descending (Pareto executive view)
        list.sort((a, b) => b.total - a.total || a.dept.localeCompare(b.dept));
      }

      const total = list.reduce((acc, r) => acc + r.total, 0);
      const close = list.reduce((acc, r) => acc + r.close, 0);
      const open = list.reduce((acc, r) => acc + r.open, 0);
      const rate = total > 0 ? Math.round((close / total) * 100) : 0;

      return {
        list,
        grandTotal: { dept: 'Grand Total', total, close, open, rate }
      };
    },

    syncStatsToOverview() {
      const raw = this.getRawData();
      if (!raw || raw.length === 0) return;

      const total = raw.length;
      const closed = raw.filter(i => i.status === 'Close').length;
      const open = total - closed;
      const rate = total > 0 ? ((closed / total) * 100).toFixed(1) + '%' : '0.0%';
      const depts = new Set(raw.map(i => i.dept).filter(Boolean));

      if (window.DASHBOARD_REGISTRY) {
        const imsEntry = window.DASHBOARD_REGISTRY.find(d => d.id === 'ims-audits');
        if (imsEntry) {
          imsEntry.status = 'Active';
          imsEntry.hasSheetLink = true;
          imsEntry.kpis = { total, closed, inProgress: open, overdue: 0, compliance: rate };
          imsEntry.punchList = { open, closed, total, rate };
          imsEntry.dataReadiness = { master: '100%', signoff: '100%' };
          imsEntry.statusComment = `${total} audit observations tracked across ${depts.size} Departments (${closed} Closed, ${open} Open, ${rate} Closure Rate).`;
        }
      }

      if (window.portalApp) {
        if (typeof window.portalApp.updateRollupStats === 'function') {
          window.portalApp.updateRollupStats();
        }
        if (typeof window.portalApp.renderCards === 'function') {
          window.portalApp.renderCards();
        }
        if (typeof window.portalApp.renderNavMenu === 'function') {
          window.portalApp.renderNavMenu();
        }
      }
    },

    async syncLiveFeed(options = {}) {
      const isSilent = options.silent || false;
      if (this.state.isSyncing) return;

      this.state.isSyncing = true;
      const syncBtn = document.getElementById('ims-sync-btn');
      if (syncBtn) {
        const icon = syncBtn.querySelector('i, svg');
        if (icon) icon.classList.add('animate-spin');
      }

      try {
        let csvText = '';
        const targetUrl = HARDCODED_IMS_SHEET_URL;

        // Try resilient multi-tier sheet fetcher
        if (typeof window.fetchGoogleSheetData === 'function') {
          try {
            csvText = await window.fetchGoogleSheetData(targetUrl, {
              sheetTab: HARDCODED_IMS_SHEET_TAB,
              gid: '0'
            });
          } catch (e) {
            console.warn('IMS window.fetchGoogleSheetData error:', e);
          }
        }

        // Try direct JSONP via Google Visualization API
        if (!csvText && typeof window.fetchGoogleSheetViaJSONP === 'function') {
          try {
            const jsonpRes = await window.fetchGoogleSheetViaJSONP(targetUrl, {
              sheetTab: HARDCODED_IMS_SHEET_TAB,
              gid: '0'
            });
            if (jsonpRes && jsonpRes.csvText) {
              csvText = jsonpRes.csvText;
            }
          } catch (e) {
            console.warn('IMS JSONP fetch error:', e);
          }
        }

        // Try direct gviz out:csv
        if (!csvText) {
          try {
            const resp = await fetch(`https://docs.google.com/spreadsheets/d/${HARDCODED_IMS_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${HARDCODED_IMS_SHEET_TAB}&_t=${Date.now()}`);
            if (resp.ok) {
              const txt = await resp.text();
              if (txt && !txt.includes('<!DOCTYPE html>') && txt.length > 50) {
                csvText = txt;
              }
            }
          } catch (e) {}
        }

        if (csvText && typeof window.parseIMSCSV === 'function') {
          const parsed = window.parseIMSCSV(csvText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.FPCL_IMS_DATA = parsed;
            try {
              localStorage.setItem('FPCL_IMS_DATA_CACHE', JSON.stringify(parsed));
            } catch (e) {}
            this.state.lastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            this.syncStatsToOverview();
            if (!isSilent && window.portalApp && typeof window.portalApp.showToast === 'function') {
              window.portalApp.showToast('IMS Audits Live Feed Synced', `Fetched ${parsed.length} observations live from Google Sheet.`, 'success');
            }
          }
        }
      } catch (err) {
        console.error('Error syncing IMS live feed:', err);
        if (!isSilent && window.portalApp && typeof window.portalApp.showToast === 'function') {
          window.portalApp.showToast('Sync Warning', 'Could not sync live feed, using stored data.', 'warning');
        }
      } finally {
        this.state.isSyncing = false;
        if (syncBtn) {
          const icon = syncBtn.querySelector('i, svg');
          if (icon) icon.classList.remove('animate-spin');
        }
        if (window.portalApp && window.portalApp.state.activeDashboardId === 'ims-audits') {
          this.render();
        }
      }
    },

    resetFilters() {
      this.state.searchQuery = '';
      this.state.deptFilter = 'all';
      this.state.statusFilter = 'all';
      this.state.standardFilter = 'all';
      this.state.page = 1;
      this.render();
      if (window.portalApp && typeof window.portalApp.showToast === 'function') {
        window.portalApp.showToast('Filters Reset', 'All IMS Audit dashboard filters cleared.', 'info');
      }
    },

    setDeptFilter(dept) {
      this.state.deptFilter = dept || 'all';
      this.state.page = 1;
      this.render();
    },

    setStatusFilter(status) {
      this.state.statusFilter = status || 'all';
      this.state.page = 1;
      this.render();
    },

    setStandardFilter(std) {
      this.state.standardFilter = std || 'all';
      this.state.page = 1;
      this.render();
    },

    setBreakdownTab(tab) {
      this.state.breakdownTab = tab;
      this.render();
    },

    toggleDeptSort() {
      this.state.deptSortBy = this.state.deptSortBy === 'total_desc' ? 'name_asc' : 'total_desc';
      this.render();
    },

    exportCSV() {
      const data = this.getFilteredData();
      if (!data || data.length === 0) {
        if (window.portalApp) window.portalApp.showToast('Export', 'No observations match the current filter.', 'warning');
        return;
      }

      const headers = ['Ref.', 'Standards', 'Audit Time', 'Gap Statement', 'Recommendation/Suggested Action', 'Responsibility', 'Target Date', 'Status', 'Remarks / Feedback'];
      const csvRows = [headers.map(h => `"${h}"`).join(',')];

      data.forEach(item => {
        const row = [
          item.ref || '',
          item.standards || '',
          item.auditTime || '',
          (item.gap || '').replace(/"/g, '""'),
          (item.recommendation || '').replace(/"/g, '""'),
          item.dept || '',
          item.targetDate || '',
          item.status || '',
          (item.remarks || '').replace(/"/g, '""')
        ];
        csvRows.push(row.map(val => `"${val}"`).join(','));
      });

      const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `IMS_Audits_Export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (window.portalApp) {
        window.portalApp.showToast('CSV Export Ready', `Exported ${data.length} IMS observations.`, 'success');
      }
    },

    openDetailModal(item) {
      this.state.selectedFinding = item;
      this.renderModal();
    },

    closeDetailModal() {
      this.state.selectedFinding = null;
      const modal = document.getElementById('ims-detail-modal');
      if (modal) modal.remove();
    },

    renderModal() {
      const item = this.state.selectedFinding;
      if (!item) return;

      let modal = document.getElementById('ims-detail-modal');
      if (modal) modal.remove();

      const isClosed = item.status === 'Close';
      const statusBadge = isClosed
        ? `<span class="px-2.5 py-1 text-xs font-black rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Closed</span>`
        : `<span class="px-2.5 py-1 text-xs font-black rounded-full bg-rose-100 text-rose-800 border border-rose-300">Open</span>`;

      const modalHtml = `
        <div id="ims-detail-modal" class="portal-modal-backdrop" onclick="if(event.target === this) FPCL_IMS_SUITE.closeDetailModal()">
          <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200">
              <div class="flex items-center gap-2.5">
                <span class="px-3 py-1 rounded-lg text-sm font-mono font-black bg-blue-50 text-blue-800 border border-blue-200">${item.ref}</span>
                <span class="text-sm font-bold text-slate-700">${item.dept}</span>
                ${statusBadge}
              </div>
              <button onclick="FPCL_IMS_SUITE.closeDetailModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>
            
            <div class="space-y-4 overflow-y-auto pr-1 text-sm">
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span class="text-xs text-slate-500 block">Standards</span>
                  <span class="font-bold text-slate-800">${item.standards || '-'}</span>
                </div>
                <div>
                  <span class="text-xs text-slate-500 block">Audit Time</span>
                  <span class="font-bold text-slate-800">${item.auditTime || '-'}</span>
                </div>
                <div>
                  <span class="text-xs text-slate-500 block">Target Date</span>
                  <span class="font-bold ${item.targetDate ? 'text-slate-800' : 'text-slate-400 italic'}">${item.targetDate || 'Not specified'}</span>
                </div>
              </div>

              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <i data-lucide="alert-circle" class="w-4 h-4 text-amber-600"></i>
                  Gap Statement / Observation
                </h4>
                <div class="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-slate-800 font-medium leading-relaxed">
                  ${item.gap || 'No gap statement provided.'}
                </div>
              </div>

              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i>
                  Recommendation / Suggested Action
                </h4>
                <div class="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-slate-800 font-medium leading-relaxed">
                  ${item.recommendation || 'No recommendation provided.'}
                </div>
              </div>

              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <i data-lucide="message-square" class="w-4 h-4 text-blue-600"></i>
                  Remarks / Action Feedback
                </h4>
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed font-mono text-xs">
                  ${item.remarks ? item.remarks : '<span class="text-slate-400 italic font-sans">No remarks or action feedback recorded yet.</span>'}
                </div>
              </div>
            </div>

            <div class="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button onclick="FPCL_IMS_SUITE.closeDetailModal()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
      if (window.lucide) window.lucide.createIcons();
    },

    /**
     * Primary Render Orchestrator
     */
    render() {
      const container = document.getElementById('ims-specialized-container');
      if (!container) return;

      const raw = this.getRawData();
      const filtered = this.getFilteredData();
      const s = this.state;

      // Extract unique departments and standards for filter dropdowns
      const allDepts = Array.from(new Set(raw.map(i => i.dept).filter(Boolean))).sort();
      const allStandards = Array.from(new Set(raw.map(i => i.standards).filter(Boolean))).sort();

      // Department calculations
      const deptSummary = this.getDepartmentSummary(filtered);

      // Total KPIs across filtered dataset
      const totalCount = filtered.length;
      const closedCount = filtered.filter(i => i.status === 'Close').length;
      const openCount = totalCount - closedCount;
      const openPctStr = totalCount > 0 ? Math.round((openCount / totalCount) * 100) + '%' : '0%';
      const closedPctStr = totalCount > 0 ? Math.round((closedCount / totalCount) * 100) + '%' : '0%';
      const closureRate = totalCount > 0 ? ((closedCount / totalCount) * 100).toFixed(1) + '%' : '0.0%';

      // Max total for horizontal bar percentage width scaling
      const maxDeptObs = Math.max(...deptSummary.list.map(d => d.total), 1);
      // Scale upper bound in nice steps of 5 or 10
      const scaleStep = maxDeptObs <= 15 ? 5 : (maxDeptObs <= 35 ? 5 : 10);
      const scaleMax = Math.ceil(maxDeptObs / scaleStep) * scaleStep || 15;
      const scaleTicks = [];
      for (let t = 0; t <= scaleMax; t += scaleStep) {
        scaleTicks.push(t);
      }

      // Standards breakdown for Audit Breakdown tab
      const standardSummary = {};
      filtered.forEach(item => {
        const std = item.standards || 'General IMS';
        if (!standardSummary[std]) {
          standardSummary[std] = { name: std, total: 0, close: 0, open: 0 };
        }
        standardSummary[std].total++;
        if (item.status === 'Close') standardSummary[std].close++;
        else standardSummary[std].open++;
      });
      const standardsList = Object.values(standardSummary).sort((a, b) => b.total - a.total);

      // Pagination
      const pageSize = s.pageSize === 'all' ? filtered.length : parseInt(s.pageSize, 10);
      const totalPages = Math.max(1, Math.ceil(filtered.length / (pageSize || 1)));
      const currentPage = Math.min(s.page, totalPages);
      const startIdx = (currentPage - 1) * pageSize;
      const pageItems = filtered.slice(startIdx, startIdx + pageSize);

      let html = `
        <div class="space-y-5">

          <!-- ========================================================================= -->
          <!-- 1. PROFESSIONAL EXECUTIVE TOP BANNER & ACTION BAR                         -->
          <!-- ========================================================================= -->
          <div class="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl border border-slate-700/60 relative overflow-hidden transition-all duration-300">
            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <!-- Heading & Metadata -->
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/10 text-white flex items-center justify-center shadow-md backdrop-blur-xs shrink-0 border border-white/15">
                  <i data-lucide="clipboard-check" class="w-6 h-6 text-teal-400"></i>
                </div>
                <div>
                  <h1 class="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                    IMS Audits Dashboard
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 backdrop-blur-xs">
                      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Live Google Sheet
                    </span>
                  </h1>
                  <p class="text-xs sm:text-sm text-slate-300 mt-0.5">
                    Integrated Management System Internal Audit • Tab: <span class="font-mono text-teal-300 font-semibold">${HARDCODED_IMS_SHEET_TAB}</span>
                  </p>
                </div>
              </div>

              <!-- Executive Action Controls -->
              <div class="flex flex-wrap items-center gap-2">
                <button
                  id="ims-sync-btn"
                  onclick="FPCL_IMS_SUITE.syncLiveFeed({ silent: false, force: true })"
                  class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 border border-teal-400/40 text-white text-xs font-black shadow-md transition-all active:scale-95"
                  title="Pull latest live records from Google Sheet"
                >
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5 ${s.isSyncing ? 'animate-spin' : ''}"></i>
                  <span>Sync Live Feed</span>
                </button>

                <button
                  id="ims-export-btn"
                  onclick="FPCL_IMS_SUITE.exportCSV()"
                  class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold shadow-xs backdrop-blur-xs transition-all active:scale-95"
                  title="Export filtered findings to CSV"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5 text-teal-300"></i>
                  <span>Export CSV</span>
                </button>

                <button
                  id="ims-reset-btn"
                  onclick="FPCL_IMS_SUITE.resetFilters()"
                  class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold shadow-xs backdrop-blur-xs transition-all active:scale-95"
                  title="Clear all active filters"
                >
                  <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-amber-300"></i>
                  <span>Reset</span>
                </button>

                <a
                  href="${HARDCODED_IMS_SHEET_URL.replace('/export?format=csv&sheet=IMS_Audit', '/edit#gid=0')}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold shadow-xs backdrop-blur-xs transition-all"
                  title="Open Master Google Sheet"
                >
                  <i data-lucide="external-link" class="w-4 h-4 text-slate-300"></i>
                </a>
              </div>
            </div>
          </div>

          <!-- ========================================================================= -->
          <!-- 2. EXECUTIVE KPI CARDS (Matching Reference Layout & Style)                -->
          <!-- ========================================================================= -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- 1. TOTAL FINDINGS CARD -->
            <div class="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between relative overflow-hidden">
              <div class="flex items-center justify-between">
                <span class="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">1. TOTAL FINDINGS</span>
                <div class="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200">
                  <i data-lucide="files" class="w-3.5 h-3.5"></i>
                </div>
              </div>
              <div class="mt-3 flex items-baseline gap-2">
                <span class="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none">${totalCount}</span>
              </div>
            </div>

            <!-- 2. OPEN FINDINGS CARD -->
            <div class="bg-white rounded-xl border border-slate-200/90 border-t-4 border-t-rose-500 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between relative overflow-hidden">
              <div class="flex items-center justify-between">
                <span class="text-xs sm:text-sm font-bold text-rose-600 uppercase tracking-wider">2. OPEN FINDINGS</span>
                <div class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                  <i data-lucide="alert-circle" class="w-3.5 h-3.5"></i>
                </div>
              </div>
              <div class="mt-3 flex items-baseline gap-2.5">
                <span class="text-4xl sm:text-5xl font-black text-[#EF4444] tracking-tight leading-none">${openCount}</span>
                <span class="text-xl sm:text-2xl font-bold text-rose-500">(${openPctStr})</span>
              </div>
            </div>

            <!-- 3. CLOSED FINDINGS CARD -->
            <div class="bg-white rounded-xl border border-slate-200/90 border-t-4 border-t-emerald-500 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between relative overflow-hidden">
              <div class="flex items-center justify-between">
                <span class="text-xs sm:text-sm font-bold text-emerald-600 uppercase tracking-wider">3. CLOSED FINDINGS</span>
                <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
                </div>
              </div>
              <div class="mt-3 flex items-baseline gap-2.5">
                <span class="text-4xl sm:text-5xl font-black text-[#10B981] tracking-tight leading-none">${closedCount}</span>
                <span class="text-xl sm:text-2xl font-bold text-emerald-600">(${closedPctStr})</span>
              </div>
            </div>

            <!-- 4. % CLOSURE CARD -->
            <div class="bg-white rounded-xl border border-slate-200/90 border-t-4 border-t-teal-500 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between relative overflow-hidden">
              <div class="flex items-center justify-between">
                <span class="text-xs sm:text-sm font-bold text-teal-600 uppercase tracking-wider">4. % CLOSURE</span>
                <div class="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200">
                  <i data-lucide="trending-up" class="w-3.5 h-3.5"></i>
                </div>
              </div>
              <div class="mt-3 flex items-baseline gap-2">
                <span class="text-4xl sm:text-5xl font-black text-[#0D9488] tracking-tight leading-none">${closureRate}</span>
              </div>
            </div>

          </div>

          <!-- ========================================================================= -->
          <!-- 3. GLOBAL FILTER BAR (Matching Reference Image)                           -->
          <!-- ========================================================================= -->
          <div class="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              
              <!-- STATUS Filter -->
              <div>
                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                <select
                  onchange="FPCL_IMS_SUITE.setStatusFilter(this.value)"
                  class="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium text-slate-800 shadow-2xs"
                >
                  <option value="all" ${s.statusFilter === 'all' ? 'selected' : ''}>All Statuses (${raw.length})</option>
                  <option value="Close" ${s.statusFilter === 'Close' ? 'selected' : ''}>Closed (${raw.filter(i => i.status === 'Close').length})</option>
                  <option value="Open" ${s.statusFilter === 'Open' ? 'selected' : ''}>Open (${raw.filter(i => i.status === 'Open').length})</option>
                </select>
              </div>

              <!-- ACTION DEPT Filter -->
              <div>
                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Action Dept</label>
                <select
                  onchange="FPCL_IMS_SUITE.setDeptFilter(this.value)"
                  class="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium text-slate-800 shadow-2xs"
                >
                  <option value="all" ${s.deptFilter === 'all' ? 'selected' : ''}>All Departments (${allDepts.length})</option>
                  ${allDepts.map(d => {
                    const count = raw.filter(i => i.dept === d).length;
                    return `<option value="${d}" ${s.deptFilter === d ? 'selected' : ''}>${d} (${count})</option>`;
                  }).join('')}
                </select>
              </div>

              <!-- STANDARDS Filter -->
              <div>
                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Standards</label>
                <select
                  onchange="FPCL_IMS_SUITE.setStandardFilter(this.value)"
                  class="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium text-slate-800 shadow-2xs"
                >
                  <option value="all" ${s.standardFilter === 'all' ? 'selected' : ''}>All ISO Standards</option>
                  ${allStandards.map(std => {
                    const count = raw.filter(i => i.standards === std).length;
                    return `<option value="${std}" ${s.standardFilter === std ? 'selected' : ''}>${std} (${count})</option>`;
                  }).join('')}
                </select>
              </div>

              <!-- QUICK SEARCH Input -->
              <div>
                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Quick Search</label>
                <div class="relative">
                  <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                  <input
                    id="ims-search-input"
                    type="text"
                    placeholder="Search gap, rec, dept..."
                    value="${s.searchQuery}"
                    oninput="FPCL_IMS_SUITE.state.searchQuery = this.value; FPCL_IMS_SUITE.state.page = 1; FPCL_IMS_SUITE.render();"
                    class="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium text-slate-800 shadow-2xs"
                  />
                  ${s.searchQuery ? `
                    <button
                      onclick="FPCL_IMS_SUITE.state.searchQuery = ''; FPCL_IMS_SUITE.render();"
                      class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    </button>
                  ` : ''}
                </div>
              </div>

            </div>

            <!-- Active Filter Badges -->
            ${(s.searchQuery || s.deptFilter !== 'all' || s.statusFilter !== 'all' || s.standardFilter !== 'all') ? `
              <div class="flex flex-wrap items-center gap-1.5 pt-3 mt-3 border-t border-slate-100 text-xs">
                <span class="text-slate-400 font-bold mr-1">Active:</span>
                ${s.searchQuery ? `
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                    "${s.searchQuery}"
                    <button onclick="FPCL_IMS_SUITE.state.searchQuery=''; FPCL_IMS_SUITE.render();"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}
                ${s.deptFilter !== 'all' ? `
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-medium">
                    ${s.deptFilter}
                    <button onclick="FPCL_IMS_SUITE.setDeptFilter('all');"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}
                ${s.statusFilter !== 'all' ? `
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${s.statusFilter === 'Close' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'} border font-medium">
                    Status: ${s.statusFilter}
                    <button onclick="FPCL_IMS_SUITE.setStatusFilter('all');"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}
                ${s.standardFilter !== 'all' ? `
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                    ${s.standardFilter}
                    <button onclick="FPCL_IMS_SUITE.setStandardFilter('all');"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}
                <button
                  onclick="FPCL_IMS_SUITE.resetFilters()"
                  class="text-xs text-rose-600 hover:underline font-bold ml-1"
                >
                  Clear all
                </button>
              </div>
            ` : ''}
          </div>

          <!-- ========================================================================= -->
          <!-- 4. OPEN VS. CLOSED FINDINGS BY ACTION DEPARTMENT (Full Width)             -->
          <!-- ========================================================================= -->
          <div class="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            
            <!-- Card Header & Legends (Enlarged uppercase 18px title & legend badges) -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                  <i data-lucide="bar-chart-2" class="w-4 h-4"></i>
                </div>
                <!-- Uppercase 18px Card Title -->
                <h3 class="text-[18px] font-black uppercase tracking-tight text-slate-900">
                  Open vs. Closed Findings by Action Department
                </h3>
              </div>

              <!-- Enlarged Legend Badges & Sort Toggle -->
              <div class="flex items-center gap-4">
                <button
                  onclick="FPCL_IMS_SUITE.toggleDeptSort()"
                  class="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 border border-slate-200 rounded-lg px-2.5 py-1 hover:bg-slate-50 transition-colors"
                  title="Toggle Sort (Pareto Total vs Alphabetical)"
                >
                  <i data-lucide="arrow-up-down" class="w-3 h-3"></i>
                  <span>${s.deptSortBy === 'total_desc' ? 'By Total' : 'By Name'}</span>
                </button>

                <div class="flex items-center gap-3">
                  <span class="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
                    <span class="w-3.5 h-3.5 rounded-sm bg-[#F43F5E]"></span>
                    Open
                  </span>
                  <span class="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
                    <span class="w-3.5 h-3.5 rounded-sm bg-[#10B981]"></span>
                    Closed
                  </span>
                </div>
              </div>
            </div>

            <!-- The Horizontal Stacked Bar Chart Container -->
            <div class="space-y-1 overflow-x-auto pt-2 pb-2">
              <div class="w-full max-w-full space-y-1">
                
                ${deptSummary.list.map(row => {
                  const totalWidthPct = Math.min(100, Math.max(1, (row.total / scaleMax) * 100));
                  const openOfActivePct = row.total > 0 ? (row.open / row.total) * 100 : 0;
                  const closeOfActivePct = row.total > 0 ? (row.close / row.total) * 100 : 0;
                  const isSelected = s.deptFilter === row.dept;

                  return `
                    <!-- Spacious 68px Row (Responsive for mobile) -->
                    <div class="flex items-center gap-2 sm:gap-4 h-12 sm:h-[68px] px-1 sm:px-2 rounded-xl transition-colors ${isSelected ? 'bg-blue-50/70 ring-1 ring-blue-300' : 'hover:bg-slate-50/70'}">
                      
                      <!-- Department Label: Responsive font and width -->
                      <div class="w-24 sm:w-52 text-right shrink-0">
                        <button
                          onclick="FPCL_IMS_SUITE.setDeptFilter('${isSelected ? 'all' : row.dept}')"
                          class="text-xs sm:text-[19px] font-extrabold text-slate-800 hover:text-teal-700 truncate block w-full text-right transition-colors"
                          title="Filter by ${row.dept}"
                        >
                          ${row.dept}
                        </button>
                      </div>

                      <!-- Bar Track: Height responsive with background track -->
                      <div class="flex-1 relative h-7 sm:h-[44px] bg-[#F1F5F9] rounded-lg overflow-hidden flex items-center border border-slate-200/70">
                        
                        <!-- Subtle Vertical Dashed Grid Guide Lines -->
                        ${scaleTicks.slice(1, -1).map(tick => {
                          const tickPct = (tick / scaleMax) * 100;
                          return `<div class="absolute top-0 bottom-0 border-l border-dashed border-slate-300/80 pointer-events-none" style="left: ${tickPct}%;"></div>`;
                        }).join('')}

                        <!-- Stacked Active Bar (Open Red + Closed Green) -->
                        <div class="h-full flex relative z-10 transition-all duration-300 rounded-lg overflow-hidden" style="width: ${totalWidthPct}%;">
                          
                          <!-- Open Bar (Coral/Rose #F43F5E) -->
                          ${row.open > 0 ? `
                            <div
                              class="h-full bg-[#F43F5E] flex items-center justify-center text-white transition-opacity hover:opacity-95"
                              style="width: ${openOfActivePct}%;"
                              title="${row.dept}: ${row.open} Open"
                            >
                              <!-- Inside Bar: Responsive Bold Monospace with Contrast Shadow -->
                              <span class="text-xs sm:text-[22px] font-black font-mono leading-none" style="text-shadow: 0 1px 3px rgba(0,0,0,0.5);">
                                ${row.open}
                              </span>
                            </div>
                          ` : ''}

                          <!-- Closed Bar (Emerald #10B981) -->
                          ${row.close > 0 ? `
                            <div
                              class="h-full bg-[#10B981] flex items-center justify-center text-white transition-opacity hover:opacity-95"
                              style="width: ${closeOfActivePct}%;"
                              title="${row.dept}: ${row.close} Closed"
                            >
                              <!-- Inside Bar: Responsive Bold Monospace with Contrast Shadow -->
                              <span class="text-xs sm:text-[22px] font-black font-mono leading-none" style="text-shadow: 0 1px 3px rgba(0,0,0,0.5);">
                                ${row.close}
                              </span>
                            </div>
                          ` : ''}

                        </div>
                      </div>

                      <!-- Total & Closure Rate Values at the End of Each Bar -->
                      <div class="w-20 sm:w-40 flex items-baseline gap-1 sm:gap-2 shrink-0">
                        <!-- Total count: Responsive Extra-Bold -->
                        <span class="text-sm sm:text-[26px] font-black text-slate-900 leading-none">
                          ${row.total}
                        </span>
                        <!-- Closure Rate: Responsive Extra-Bold in Cyan/Teal -->
                        <span class="text-[11px] sm:text-[20px] font-extrabold text-[#0D9488] leading-none">
                          (${row.rate}%)
                        </span>
                      </div>

                    </div>
                  `;
                }).join('')}

                <!-- Scale Axis Ticks: Responsive Bold Monospace -->
                <div class="flex items-center gap-2 sm:gap-4 pt-3 border-t border-slate-200 mt-2">
                  <div class="w-24 sm:w-52 shrink-0 text-right">
                    <span class="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Observations Scale</span>
                  </div>
                  <div class="flex-1 relative h-7 flex items-center">
                    ${scaleTicks.map(tick => {
                      const tickPct = (tick / scaleMax) * 100;
                      const isFirst = tick === 0;
                      const isLast = tick === scaleMax;
                      return `
                        <div
                          class="absolute top-0 flex flex-col items-center pointer-events-none"
                          style="left: ${tickPct}%; transform: ${isFirst ? 'translateX(0)' : (isLast ? 'translateX(-100%)' : 'translateX(-50%)')};"
                        >
                          <div class="w-0.5 h-2 bg-slate-300"></div>
                          <!-- Responsive Bold Monospace Ticks -->
                          <span class="text-[10px] sm:text-[18px] font-bold font-mono text-slate-400">
                            ${tick}
                          </span>
                        </div>
                      `;
                    }).join('')}
                  </div>
                  <div class="w-20 sm:w-40 shrink-0"></div>
                </div>

              </div>
            </div>

          </div>

          <!-- ========================================================================= -->
          <!-- 5. AUDIT BREAKDOWN VISUAL (Plotted Directly Below Department Bars)         -->
          <!-- ========================================================================= -->
          <div class="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            
            <!-- Header with Title & Stats -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
                  <i data-lucide="pie-chart" class="w-4 h-4"></i>
                </div>
                <h3 class="text-[18px] font-black uppercase tracking-tight text-slate-900">
                  Audit Breakdown
                </h3>
              </div>

              <!-- Breakdown Metrics Summary -->
              <div class="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span class="w-2 h-2 rounded-full bg-[#10B981]"></span>
                  ${closedCount} Closed
                </span>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
                  <span class="w-2 h-2 rounded-full bg-[#F43F5E]"></span>
                  ${openCount} Open
                </span>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                  ${closureRate} Closure Rate
                </span>
              </div>
            </div>

            <!-- Two-Column Side-by-Side Interior Breakdown -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pt-2">
              
              <!-- Left Column: Resolution Status Donut (Expanded Size & Space) -->
              <div class="lg:col-span-5 xl:col-span-5 bg-slate-50/70 rounded-2xl p-6 border border-slate-200/80 flex flex-col items-center justify-between shadow-2xs">
                <div class="w-full text-center pb-2.5 border-b border-slate-200/60">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-600">Resolution Status Overview</span>
                </div>

                <!-- Enlarged SVG Donut Chart to comfortably fit closure rate text -->
                <div class="py-5 flex flex-col items-center justify-center w-full">
                  <div class="relative w-72 h-72 sm:w-80 sm:h-80 max-w-full">
                    ${(() => {
                      const radius = 90;
                      const circ = 2 * Math.PI * radius; // ~565.48
                      const closedArc = totalCount > 0 ? (closedCount / totalCount) * circ : 0;
                      const openArc = totalCount > 0 ? (openCount / totalCount) * circ : 0;
                      const closedOffset = 0;
                      const openOffset = -closedArc;

                      return `
                        <svg viewBox="0 0 220 220" class="w-full h-full -rotate-90">
                          <!-- Background Track -->
                          <circle cx="110" cy="110" r="${radius}" fill="none" stroke="#E2E8F0" stroke-width="24" />
                          <!-- Closed Arc (Emerald) -->
                          ${closedCount > 0 ? `
                            <circle
                              cx="110" cy="110" r="${radius}"
                              fill="none"
                              stroke="#10B981"
                              stroke-width="24"
                              stroke-dasharray="${closedArc} ${circ - closedArc}"
                              stroke-dashoffset="${closedOffset}"
                              class="cursor-pointer hover:opacity-90 transition-all"
                              onclick="FPCL_IMS_SUITE.setStatusFilter('Close')"
                            />
                          ` : ''}
                          <!-- Open Arc (Rose/Red) -->
                          ${openCount > 0 ? `
                            <circle
                              cx="110" cy="110" r="${radius}"
                              fill="none"
                              stroke="#F43F5E"
                              stroke-width="24"
                              stroke-dasharray="${openArc} ${circ - openArc}"
                              stroke-dashoffset="${openOffset}"
                              class="cursor-pointer hover:opacity-90 transition-all"
                              onclick="FPCL_IMS_SUITE.setStatusFilter('Open')"
                            />
                          ` : ''}
                        </svg>
                        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                          <span class="text-4xl sm:text-5xl font-black text-slate-900 leading-none tracking-tight">${closureRate}</span>
                          <span class="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-teal-600 mt-2">Closure Rate</span>
                        </div>
                      `;
                    })()}
                  </div>
                </div>

                <!-- Interactive Slices Filter Badges -->
                <div class="w-full grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/60">
                  <button
                    onclick="FPCL_IMS_SUITE.setStatusFilter('${s.statusFilter === 'Close' ? 'all' : 'Close'}')"
                    class="p-3 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 flex items-center justify-between transition-all ${s.statusFilter === 'Close' ? 'ring-2 ring-emerald-500 shadow-xs' : ''}"
                  >
                    <span class="flex items-center gap-2 font-bold text-emerald-800 text-xs sm:text-sm">
                      <span class="w-3 h-3 rounded-xs bg-[#10B981]"></span> Closed
                    </span>
                    <span class="font-black text-emerald-950 text-sm sm:text-base">${closedCount}</span>
                  </button>

                  <button
                    onclick="FPCL_IMS_SUITE.setStatusFilter('${s.statusFilter === 'Open' ? 'all' : 'Open'}')"
                    class="p-3 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 flex items-center justify-between transition-all ${s.statusFilter === 'Open' ? 'ring-2 ring-rose-500 shadow-xs' : ''}"
                  >
                    <span class="flex items-center gap-2 font-bold text-rose-800 text-xs sm:text-sm">
                      <span class="w-3 h-3 rounded-xs bg-[#F43F5E]"></span> Open
                    </span>
                    <span class="font-black text-rose-950 text-sm sm:text-base">${openCount}</span>
                  </button>
                </div>
              </div>

              <!-- Right Column: ISO Standards Compliance & Observations Distribution (Reduced Bar Length) -->
              <div class="lg:col-span-7 xl:col-span-7 flex flex-col justify-between space-y-3">
                <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-500">ISO Standards Observations Distribution</span>
                  <span class="text-xs font-mono text-slate-400">${standardsList.length} Standards Tracked</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  ${standardsList.map(std => {
                    const stdPct = totalCount > 0 ? Math.round((std.total / totalCount) * 100) : 0;
                    const isStdSelected = s.standardFilter === std.name;
                    const stdClosureRate = std.total > 0 ? Math.round((std.close / std.total) * 100) : 0;

                    return `
                      <button
                        onclick="FPCL_IMS_SUITE.setStandardFilter('${isStdSelected ? 'all' : std.name}')"
                        class="p-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/20 text-left transition-all ${isStdSelected ? 'bg-teal-50/60 ring-2 ring-teal-500 border-teal-300' : 'bg-slate-50/40'}"
                      >
                        <div class="flex items-center justify-between text-xs">
                          <span class="font-bold text-slate-900 truncate max-w-[150px]" title="${std.name}">${std.name}</span>
                          <span class="font-mono font-bold text-slate-700">${std.total} (${stdPct}%)</span>
                        </div>

                        <!-- Compact Progress Track with reduced length to give space to donut -->
                        <div class="w-full h-2.5 bg-slate-200 rounded-full mt-2 overflow-hidden flex">
                          <div class="bg-[#10B981] h-full" style="width: ${std.total > 0 ? (std.close / std.total) * 100 : 0}%" title="Closed: ${std.close}"></div>
                          <div class="bg-[#F43F5E] h-full" style="width: ${std.total > 0 ? (std.open / std.total) * 100 : 0}%" title="Open: ${std.open}"></div>
                        </div>

                        <div class="flex items-center justify-between mt-1.5 text-[11px]">
                          <span class="text-slate-500">Closed: <strong class="text-emerald-700">${std.close}</strong> • Open: <strong class="text-rose-700">${std.open}</strong></span>
                          <span class="font-extrabold ${stdClosureRate >= 70 ? 'text-emerald-700' : (stdClosureRate > 0 ? 'text-teal-700' : 'text-slate-500')}">${stdClosureRate}%</span>
                        </div>
                      </button>
                    `;
                  }).join('')}
                </div>

                <div class="pt-2 text-xs text-slate-400 flex items-center justify-between">
                  <span>Click any standard card to filter the entire dashboard</span>
                  <span>Target Audit Period: <strong class="text-slate-700">Sep 2026</strong></span>
                </div>
              </div>

            </div>

          </div>

          <!-- ========================================================================= -->
          <!-- 5. EXCEL SPREADSHEET TABLE (Clean Professional Executive BI Styling)      -->
          <!-- ========================================================================= -->
          <div class="bg-white rounded-xl shadow-xs border border-slate-200/90 overflow-hidden">
            <!-- Header Bar -->
            <div class="bg-slate-900 text-white px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-2.5">
                <i data-lucide="table" class="w-5 h-5 text-teal-400"></i>
                <div>
                  <h3 class="text-sm sm:text-base font-bold text-white tracking-wide">Excel Findings Sheet</h3>
                </div>
              </div>

              <!-- Rows Selector & Pagination -->
              <div class="flex items-center gap-3 text-xs">
                <div class="flex items-center gap-1.5">
                  <span class="text-slate-300">Rows:</span>
                  <select
                    onchange="FPCL_IMS_SUITE.state.pageSize = this.value; FPCL_IMS_SUITE.state.page = 1; FPCL_IMS_SUITE.render();"
                    class="py-1 px-2 rounded-lg bg-slate-800 text-white border border-slate-700 font-bold focus:outline-none"
                  >
                    <option value="10" ${s.pageSize == 10 ? 'selected' : ''}>10</option>
                    <option value="15" ${s.pageSize == 15 ? 'selected' : ''}>15</option>
                    <option value="25" ${s.pageSize == 25 ? 'selected' : ''}>25</option>
                    <option value="50" ${s.pageSize == 50 ? 'selected' : ''}>50</option>
                    <option value="all" ${s.pageSize === 'all' ? 'selected' : ''}>All (${filtered.length})</option>
                  </select>
                </div>

                <div class="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                  <button
                    onclick="if(FPCL_IMS_SUITE.state.page > 1){ FPCL_IMS_SUITE.state.page--; FPCL_IMS_SUITE.render(); }"
                    ${currentPage <= 1 ? 'disabled class="opacity-40 px-2 py-1 cursor-not-allowed"' : 'class="px-2 py-1 hover:bg-slate-700 rounded transition-colors"'}
                  >
                    <i data-lucide="chevron-left" class="w-4 h-4"></i>
                  </button>
                  <span class="px-2 font-mono font-bold text-slate-200">${currentPage} / ${totalPages}</span>
                  <button
                    onclick="if(FPCL_IMS_SUITE.state.page < ${totalPages}){ FPCL_IMS_SUITE.state.page++; FPCL_IMS_SUITE.render(); }"
                    ${currentPage >= totalPages ? 'disabled class="opacity-40 px-2 py-1 cursor-not-allowed"' : 'class="px-2 py-1 hover:bg-slate-700 rounded transition-colors"'}
                  >
                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Table Container -->
            <div class="overflow-x-auto">
              <table class="w-full text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold text-left select-none">
                    <th class="py-2.5 px-3 w-12 text-center border-r border-slate-200">#</th>
                    <th class="py-2.5 px-3 w-20 border-r border-slate-200">Ref.</th>
                    <th class="py-2.5 px-3 w-28 border-r border-slate-200">Standards</th>
                    <th class="py-2.5 px-3 w-20 border-r border-slate-200">Audit Time</th>
                    <th class="py-2.5 px-4 min-w-[240px] border-r border-slate-200">Gap Statement</th>
                    <th class="py-2.5 px-4 min-w-[240px] border-r border-slate-200">Recommendation / Action</th>
                    <th class="py-2.5 px-3 w-28 border-r border-slate-200">Department</th>
                    <th class="py-2.5 px-3 w-24 border-r border-slate-200">Target Date</th>
                    <th class="py-2.5 px-3 w-20 text-center border-r border-slate-200">Status</th>
                    <th class="py-2.5 px-4 min-w-[200px]">Remarks / Feedback</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-sans">
                  ${pageItems.length === 0 ? `
                    <tr>
                      <td colspan="10" class="py-8 text-center text-slate-500 font-medium">
                        No findings match the applied filters.
                        <button onclick="FPCL_IMS_SUITE.resetFilters()" class="text-teal-600 underline font-bold ml-1">Reset filters</button>
                      </td>
                    </tr>
                  ` : pageItems.map((item, idx) => {
                    const isClosed = item.status === 'Close';
                    const globalIdx = startIdx + idx + 1;

                    return `
                      <tr
                        onclick="FPCL_IMS_SUITE.openDetailModal(FPCL_IMS_SUITE.getRawData().find(x => x.sr === ${item.sr}))"
                        class="hover:bg-teal-50/40 cursor-pointer transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}"
                      >
                        <!-- # -->
                        <td class="py-2.5 px-2 text-center text-slate-400 font-mono border-r border-slate-100">${globalIdx}</td>

                        <!-- Ref -->
                        <td class="py-2.5 px-3 font-mono font-bold text-teal-700 whitespace-nowrap border-r border-slate-100">
                          ${item.ref}
                        </td>

                        <!-- Standards -->
                        <td class="py-2.5 px-3 text-slate-600 border-r border-slate-100 font-medium whitespace-nowrap">
                          ${item.standards || '-'}
                        </td>

                        <!-- Audit Time -->
                        <td class="py-2.5 px-3 text-slate-600 border-r border-slate-100 font-mono whitespace-nowrap">
                          ${item.auditTime || '-'}
                        </td>

                        <!-- Gap Statement -->
                        <td class="py-2.5 px-4 text-slate-800 border-r border-slate-100 leading-relaxed font-medium">
                          ${item.gap}
                        </td>

                        <!-- Recommendation -->
                        <td class="py-2.5 px-4 text-slate-700 border-r border-slate-100 leading-relaxed">
                          ${item.recommendation}
                        </td>

                        <!-- Department -->
                        <td class="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                          ${item.dept}
                        </td>

                        <!-- Target Date -->
                        <td class="py-2.5 px-3 text-slate-600 font-mono border-r border-slate-100 whitespace-nowrap ${item.targetDate ? '' : 'text-slate-400 italic'}">
                          ${item.targetDate || 'None'}
                        </td>

                        <!-- Status Badge -->
                        <td class="py-2.5 px-2 text-center border-r border-slate-100 whitespace-nowrap">
                          ${isClosed ? `
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Close
                            </span>
                          ` : `
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                              Open
                            </span>
                          `}
                        </td>

                        <!-- Remarks -->
                        <td class="py-2.5 px-4 text-slate-600 font-mono text-[11px] leading-relaxed">
                          ${item.remarks ? item.remarks : '<span class="text-slate-300 italic font-sans">-</span>'}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Table Footer -->
            <div class="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
              <div>
                Showing <strong>${pageItems.length > 0 ? startIdx + 1 : 0}</strong> to <strong>${startIdx + pageItems.length}</strong> of <strong>${filtered.length}</strong> records
              </div>
              <div class="flex items-center gap-2">
                <span>Click any finding row to view complete details</span>
              </div>
            </div>
          </div>

        </div>
      `;

      container.innerHTML = html;
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  };

  // Auto-initialize when script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => imsSuite.init());
  } else {
    imsSuite.init();
  }
})();
