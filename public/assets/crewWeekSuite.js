/**
 * FPCL Executive Operations & Compliance Portal
 * Crew Week Shift Roster & Personnel Suite
 * 
 * Google Sheet ID: 1vbclqX2smmSq2C4tu_fw44mApg1ng6wVZ9bgPC7aUBk
 * Tab: Crew_Week
 * 
 * Fetches published Google Sheet CSV endpoints dynamically using JavaScript
 * Real-time updates with zero-caching policy
 */

(function () {
  'use strict';

  const SHEET_ID = '1vbclqX2smmSq2C4tu_fw44mApg1ng6wVZ9bgPC7aUBk';
  const SHEET_TAB = 'Crew_Week';

  function parseCsvText(csv) {
    if (!csv || typeof csv !== 'string') return [];
    const rows = [];
    let curRow = [];
    let curField = '';
    let inQuotes = false;

    for (let i = 0; i < csv.length; i++) {
      const c = csv[i];
      if (inQuotes) {
        if (c === '"' && csv[i + 1] === '"') {
          curField += '"';
          i++;
        } else if (c === '"') {
          inQuotes = false;
        } else {
          curField += c;
        }
      } else {
        if (c === '"') {
          inQuotes = true;
        } else if (c === ',') {
          curRow.push(curField.trim());
          curField = '';
        } else if (c === '\n' || c === '\r') {
          if (c === '\r' && csv[i + 1] === '\n') i++;
          curRow.push(curField.trim());
          if (curRow.length > 1 || curRow[0] !== '') {
            rows.push(curRow);
          }
          curRow = [];
          curField = '';
        } else {
          curField += c;
        }
      }
    }
    if (curField || curRow.length) {
      curRow.push(curField.trim());
      if (curRow.length > 1 || curRow[0] !== '') {
        rows.push(curRow);
      }
    }

    if (rows.length <= 1) return [];

    const firstRowStr = (rows[0][0] || '').toLowerCase();
    const dataRows = firstRowStr.includes('sr') ? rows.slice(1) : rows;

    return dataRows
      .filter(r => r.length >= 2 && r[1])
      .map(r => ({
        sr: (r[0] || '').trim(),
        name: (r[1] || '').trim(),
        position: (r[2] || '').trim(),
        crewWeek: (r[3] || '').trim(),
        designation: (r[4] || '').trim(),
        orgUnit: (r[5] || '').trim(),
      }));
  }

  function getInitials(name) {
    if (!name) return 'FP';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function getCrewTheme(crewName) {
    const raw = (crewName || '').toLowerCase();
    if (raw.includes('"a"') || raw.includes('site a') || raw.endsWith(' a')) {
      return {
        key: 'A',
        label: 'Crew A',
        badge: 'bg-blue-100 text-blue-800 border-blue-300 ring-1 ring-blue-400/30',
        dot: 'bg-blue-600',
        avatarGrad: 'from-blue-600 to-indigo-600',
        lightBg: 'bg-blue-50/60',
        borderColor: 'border-blue-200'
      };
    }
    if (raw.includes('"b"') || raw.includes('site b') || raw.endsWith(' b')) {
      return {
        key: 'B',
        label: 'Crew B',
        badge: 'bg-teal-100 text-teal-800 border-teal-300 ring-1 ring-teal-400/30',
        dot: 'bg-teal-600',
        avatarGrad: 'from-teal-600 to-emerald-600',
        lightBg: 'bg-teal-50/60',
        borderColor: 'border-teal-200'
      };
    }
    if (raw.includes('"c"') || raw.includes('site c') || raw.endsWith(' c')) {
      return {
        key: 'C',
        label: 'Crew C',
        badge: 'bg-purple-100 text-purple-800 border-purple-300 ring-1 ring-purple-400/30',
        dot: 'bg-purple-600',
        avatarGrad: 'from-purple-600 to-fuchsia-600',
        lightBg: 'bg-purple-50/60',
        borderColor: 'border-purple-200'
      };
    }
    if (raw.includes('"d"') || raw.includes('site d') || raw.endsWith(' d')) {
      return {
        key: 'D',
        label: 'Crew D',
        badge: 'bg-amber-100 text-amber-800 border-amber-300 ring-1 ring-amber-400/30',
        dot: 'bg-amber-600',
        avatarGrad: 'from-amber-500 to-orange-600',
        lightBg: 'bg-amber-50/60',
        borderColor: 'border-amber-200'
      };
    }
    if (raw.includes('head office') || raw.includes('ho')) {
      return {
        key: 'HO',
        label: 'Head Office',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-300 ring-1 ring-indigo-400/30',
        dot: 'bg-indigo-600',
        avatarGrad: 'from-indigo-600 to-violet-700',
        lightBg: 'bg-indigo-50/60',
        borderColor: 'border-indigo-200'
      };
    }
    return {
      key: 'GEN',
      label: 'General Shift',
      badge: 'bg-cyan-100 text-cyan-800 border-cyan-300 ring-1 ring-cyan-400/30',
      dot: 'bg-cyan-600',
      avatarGrad: 'from-cyan-600 to-sky-600',
      lightBg: 'bg-cyan-50/60',
      borderColor: 'border-cyan-200'
    };
  }

  function getDesignationBadge(desig) {
    const raw = (desig || '').toLowerCase();
    if (raw === 'management') {
      return '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Management</span>';
    }
    if (raw.includes('junior')) {
      return '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300 shadow-2xs"><span class="w-1.5 h-1.5 rounded-full bg-sky-500"></span>Junior Management</span>';
    }
    if (raw === 'staff') {
      return '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Staff</span>';
    }
    return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300">${desig || '—'}</span>`;
  }

  const crewWeekSuite = {
    data: [],
    state: {
      searchQuery: '',
      crewFilter: 'all',
      desigFilter: 'all',
      orgUnitFilter: 'all',
      isFetching: false,
      lastUpdated: null,
    },
    autoSyncTimer: null,

    init() {
      window.FPCL_CREW_WEEK_SUITE = this;

      // Try reading from cache
      try {
        const cached = localStorage.getItem('FPCL_CREW_WEEK_CACHE');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.data = parsed;
          }
        }
      } catch (_e) {}

      // Fallback to initial seed if available
      if (!this.data || this.data.length === 0) {
        if (window.FPCL_CREW_WEEK_INITIAL_SEED && Array.isArray(window.FPCL_CREW_WEEK_INITIAL_SEED)) {
          this.data = window.FPCL_CREW_WEEK_INITIAL_SEED.slice();
        }
      }

      // Initial background sync
      setTimeout(() => {
        this.fetchLiveGoogleSheetData({ silent: true });
      }, 500);

      // Listen for visibility change
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden && this.isModalOpen()) {
            this.fetchLiveGoogleSheetData({ silent: true });
          }
        });
      }
    },

    isModalOpen() {
      const modal = document.getElementById('crew-week-modal');
      return modal && !modal.classList.contains('hidden');
    },

    /**
     * Fetch published Google Sheet CSV endpoints dynamically using JavaScript
     */
    async fetchLiveGoogleSheetData(opts = {}) {
      if (this.state.isFetching) return;
      this.state.isFetching = true;

      const refreshBtn = document.getElementById('crew-week-refresh-btn');
      if (refreshBtn) {
        refreshBtn.classList.add('animate-spin');
      }

      const now = Date.now();
      const nonce = Math.floor(Math.random() * 10000000);
      let newRecords = null;

      // Strategy 1: Google Visualization API CSV endpoint dynamically via JS fetch
      const csvEndpoints = [
        `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}&_t=${now}&_nocache=${nonce}`,
        `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&sheet=${encodeURIComponent(SHEET_TAB)}&_t=${now}&_nocache=${nonce}`,
        `/api/crew-week?_t=${now}&_nocache=${nonce}`,
        `/api/sheets/fetch?sheetId=${SHEET_ID}&sheetTab=${encodeURIComponent(SHEET_TAB)}&_t=${now}`
      ];

      for (const endpoint of csvEndpoints) {
        try {
          const res = await fetch(endpoint, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          });
          if (res.ok) {
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const json = await res.json();
              if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                newRecords = json.data;
                break;
              } else if (json.csvText) {
                const parsed = parseCsvText(json.csvText);
                if (parsed.length > 0) {
                  newRecords = parsed;
                  break;
                }
              }
            } else {
              const text = await res.text();
              if (text && !text.includes('<!DOCTYPE html>') && !text.includes('<html') && text.includes(',')) {
                const parsed = parseCsvText(text);
                if (parsed.length > 0) {
                  newRecords = parsed;
                  break;
                }
              }
            }
          }
        } catch (_err) {
          // Continue to next endpoint
        }
      }

      // Strategy 2: If direct fetch didn't return, try client-side JSONP script injection
      if (!newRecords && window.fetchGoogleSheetViaJSONP) {
        try {
          const jsonpResult = await window.fetchGoogleSheetViaJSONP(SHEET_ID, { sheetTab: SHEET_TAB });
          if (jsonpResult && jsonpResult.csvText) {
            const parsed = parseCsvText(jsonpResult.csvText);
            if (parsed.length > 0) {
              newRecords = parsed;
            }
          }
        } catch (_jsonpErr) {}
      }

      if (newRecords && newRecords.length > 0) {
        this.data = newRecords;
        this.state.lastUpdated = new Date();
        try {
          localStorage.setItem('FPCL_CREW_WEEK_CACHE', JSON.stringify(newRecords));
        } catch (_e) {}
      }

      this.state.isFetching = false;
      if (refreshBtn) {
        refreshBtn.classList.remove('animate-spin');
      }

      if (this.isModalOpen()) {
        this.updateStatsCards();
        this.renderTableOnly();
      }
    },

    openModal() {
      const modal = document.getElementById('crew-week-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        this.render();
        // Trigger fresh fetch dynamically
        this.fetchLiveGoogleSheetData({ silent: false });

        // Start auto-poll while modal is active
        if (!this.autoSyncTimer) {
          this.autoSyncTimer = setInterval(() => {
            if (this.isModalOpen()) {
              this.fetchLiveGoogleSheetData({ silent: true });
            }
          }, 25000);
        }
      }
    },

    closeModal() {
      const modal = document.getElementById('crew-week-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      if (this.autoSyncTimer) {
        clearInterval(this.autoSyncTimer);
        this.autoSyncTimer = null;
      }
    },

    setSearchQuery(q) {
      this.state.searchQuery = q || '';

      // Update clear button visibility without replacing the input element
      const clearBtn = document.getElementById('crew-week-search-clear-btn');
      if (clearBtn) {
        if (this.state.searchQuery) {
          clearBtn.classList.remove('hidden');
          clearBtn.classList.add('inline-flex');
        } else {
          clearBtn.classList.add('hidden');
          clearBtn.classList.remove('inline-flex');
        }
      }

      this.updateResetButtonState();
      this.renderTableOnly();
    },

    clearSearch() {
      this.state.searchQuery = '';
      const input = document.getElementById('crew-week-search-input');
      if (input) {
        input.value = '';
        input.focus();
      }
      const clearBtn = document.getElementById('crew-week-search-clear-btn');
      if (clearBtn) {
        clearBtn.classList.add('hidden');
        clearBtn.classList.remove('inline-flex');
      }
      this.updateResetButtonState();
      this.renderTableOnly();
    },

    setCrewFilter(c) {
      this.state.crewFilter = c;
      const crewSelect = document.getElementById('crew-week-crew-select');
      if (crewSelect && crewSelect.value !== c) crewSelect.value = c;
      this.updateFilterPillsUI();
      this.updateResetButtonState();
      this.renderTableOnly();
    },

    setDesigFilter(d) {
      this.state.desigFilter = d;
      const desigSelect = document.getElementById('crew-week-desig-select');
      if (desigSelect && desigSelect.value !== d) desigSelect.value = d;
      this.updateResetButtonState();
      this.renderTableOnly();
    },

    setOrgUnitFilter(u) {
      this.state.orgUnitFilter = u;
      const orgUnitSelect = document.getElementById('crew-week-orgunit-select');
      if (orgUnitSelect && orgUnitSelect.value !== u) orgUnitSelect.value = u;
      this.updateResetButtonState();
      this.renderTableOnly();
    },

    resetFilters() {
      this.state.searchQuery = '';
      this.state.crewFilter = 'all';
      this.state.desigFilter = 'all';
      this.state.orgUnitFilter = 'all';

      const searchInput = document.getElementById('crew-week-search-input');
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      const clearBtn = document.getElementById('crew-week-search-clear-btn');
      if (clearBtn) {
        clearBtn.classList.add('hidden');
        clearBtn.classList.remove('inline-flex');
      }

      const crewSelect = document.getElementById('crew-week-crew-select');
      if (crewSelect) crewSelect.value = 'all';

      const desigSelect = document.getElementById('crew-week-desig-select');
      if (desigSelect) desigSelect.value = 'all';

      const orgUnitSelect = document.getElementById('crew-week-orgunit-select');
      if (orgUnitSelect) orgUnitSelect.value = 'all';

      this.updateFilterPillsUI();
      this.updateResetButtonState();
      this.renderTableOnly();
    },

    updateResetButtonState() {
      const resetBtn = document.getElementById('crew-week-reset-filters-btn');
      if (resetBtn) {
        const hasFilters = this.state.searchQuery || this.state.crewFilter !== 'all' || this.state.desigFilter !== 'all' || this.state.orgUnitFilter !== 'all';
        if (hasFilters) {
          resetBtn.classList.remove('hidden');
          resetBtn.classList.add('inline-flex');
        } else {
          resetBtn.classList.add('hidden');
          resetBtn.classList.remove('inline-flex');
        }
      }
    },

    updateFilterPillsUI() {
      const allPills = document.querySelectorAll('[data-crew-pill]');
      allPills.forEach(pill => {
        const pillValue = pill.getAttribute('data-crew-pill');
        const isActive = this.state.crewFilter === pillValue;
        if (pillValue === 'all') {
          pill.className = `px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${isActive ? 'bg-slate-800 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`;
        } else if (pillValue === 'A') {
          pill.className = `px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${isActive ? 'bg-blue-600 text-white shadow-2xs ring-1 ring-blue-500' : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'}`;
        } else if (pillValue === 'B') {
          pill.className = `px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${isActive ? 'bg-teal-600 text-white shadow-2xs ring-1 ring-teal-500' : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'}`;
        } else if (pillValue === 'C') {
          pill.className = `px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${isActive ? 'bg-purple-600 text-white shadow-2xs ring-1 ring-purple-500' : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'}`;
        } else if (pillValue === 'D') {
          pill.className = `px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${isActive ? 'bg-amber-600 text-white shadow-2xs ring-1 ring-amber-500' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'}`;
        } else if (pillValue === 'PLANT_GEN') {
          pill.className = `px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${isActive ? 'bg-cyan-600 text-white shadow-2xs ring-1 ring-cyan-500' : 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200'}`;
        } else if (pillValue === 'HO') {
          pill.className = `px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${isActive ? 'bg-indigo-600 text-white shadow-2xs ring-1 ring-indigo-500' : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'}`;
        }
      });
    },

    getFilteredData() {
      const q = (this.state.searchQuery || '').toLowerCase().trim();
      const cFilter = this.state.crewFilter;
      const dFilter = this.state.desigFilter;
      const uFilter = this.state.orgUnitFilter;

      // Tokenize search query for flexible multi-word matching
      const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

      return (this.data || []).filter(item => {
        // Crew filter
        if (cFilter !== 'all') {
          const rawCrew = (item.crewWeek || '').toLowerCase();
          if (cFilter === 'A' && !rawCrew.includes('"a"') && !rawCrew.endsWith(' a')) return false;
          if (cFilter === 'B' && !rawCrew.includes('"b"') && !rawCrew.endsWith(' b')) return false;
          if (cFilter === 'C' && !rawCrew.includes('"c"') && !rawCrew.endsWith(' c')) return false;
          if (cFilter === 'D' && !rawCrew.includes('"d"') && !rawCrew.endsWith(' d')) return false;
          if (cFilter === 'HO' && !rawCrew.includes('head office')) return false;
          if (cFilter === 'PLANT_GEN' && (!rawCrew.includes('general shift plant') && !rawCrew.includes('plant site') || rawCrew.includes('"'))) return false;
        }

        // Designation filter
        if (dFilter !== 'all') {
          const rawDes = (item.designation || '').toLowerCase();
          if (dFilter === 'Management' && rawDes !== 'management') return false;
          if (dFilter === 'Junior Management' && !rawDes.includes('junior')) return false;
          if (dFilter === 'Staff' && rawDes !== 'staff') return false;
        }

        // Org Unit filter
        if (uFilter !== 'all') {
          if ((item.orgUnit || '') !== uFilter) return false;
        }

        // Free search query: all tokens must match somewhere in the row
        if (tokens.length > 0) {
          const haystack = `${item.sr} ${item.name} ${item.position} ${item.crewWeek} ${item.designation} ${item.orgUnit}`.toLowerCase();
          for (let i = 0; i < tokens.length; i++) {
            if (!haystack.includes(tokens[i])) return false;
          }
        }

        return true;
      });
    },

    exportCsv() {
      const filtered = this.getFilteredData();
      if (!filtered || filtered.length === 0) return;

      const headers = ['Sr', 'Name', 'Position', 'Crew week', 'Employee_designation', 'Organizational Unit'];
      const csvLines = [headers.join(',')];

      filtered.forEach(item => {
        const row = [
          `"${String(item.sr || '').replace(/"/g, '""')}"`,
          `"${String(item.name || '').replace(/"/g, '""')}"`,
          `"${String(item.position || '').replace(/"/g, '""')}"`,
          `"${String(item.crewWeek || '').replace(/"/g, '""')}"`,
          `"${String(item.designation || '').replace(/"/g, '""')}"`,
          `"${String(item.orgUnit || '').replace(/"/g, '""')}"`
        ];
        csvLines.push(row.join(','));
      });

      const blob = new Blob([csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Crew_Week_Personnel_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    updateStatsCards() {
      const statsContainer = document.getElementById('crew-week-stats-container');
      if (!statsContainer) return;

      const allData = this.data || [];
      let countA = 0;
      let countB = 0;
      let countC = 0;
      let countD = 0;
      let countGenPlant = 0;
      let countGenHO = 0;

      allData.forEach(item => {
        const rawCrew = (item.crewWeek || '').toLowerCase();
        if (rawCrew.includes('"a"') || rawCrew.endsWith(' a')) countA++;
        else if (rawCrew.includes('"b"') || rawCrew.endsWith(' b')) countB++;
        else if (rawCrew.includes('"c"') || rawCrew.endsWith(' c')) countC++;
        else if (rawCrew.includes('"d"') || rawCrew.endsWith(' d')) countD++;
        else if (rawCrew.includes('head office')) countGenHO++;
        else countGenPlant++;
      });

      statsContainer.innerHTML = `
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <!-- Total Personnel -->
          <div onclick="FPCL_CREW_WEEK_SUITE.setCrewFilter('all')" class="cursor-pointer group p-3 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border border-slate-700/80 shadow-xs hover:border-indigo-400 transition-all">
            <div class="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
              <span>Total Roster</span>
              <i data-lucide="users" class="w-4 h-4 text-indigo-400"></i>
            </div>
            <div class="text-2xl font-black tracking-tight text-white">${allData.length}</div>
            <div class="text-[10px] text-indigo-200/80 mt-1 font-medium">All Personnel</div>
          </div>

          <!-- Crew A -->
          <div onclick="FPCL_CREW_WEEK_SUITE.setCrewFilter('A')" class="cursor-pointer group p-3 rounded-xl bg-white border border-blue-200 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all ${this.state.crewFilter === 'A' ? 'ring-2 ring-blue-500 bg-blue-50/40' : ''}">
            <div class="flex items-center justify-between text-xs text-blue-900 font-bold mb-1">
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-blue-600"></span>Crew A</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">Shift</span>
            </div>
            <div class="text-2xl font-black text-blue-950">${countA}</div>
            <div class="text-[10px] text-blue-600 font-medium mt-1">Plant Site "A"</div>
          </div>

          <!-- Crew B -->
          <div onclick="FPCL_CREW_WEEK_SUITE.setCrewFilter('B')" class="cursor-pointer group p-3 rounded-xl bg-white border border-teal-200 shadow-2xs hover:border-teal-400 hover:shadow-xs transition-all ${this.state.crewFilter === 'B' ? 'ring-2 ring-teal-500 bg-teal-50/40' : ''}">
            <div class="flex items-center justify-between text-xs text-teal-900 font-bold mb-1">
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-teal-600"></span>Crew B</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 font-bold">Shift</span>
            </div>
            <div class="text-2xl font-black text-teal-950">${countB}</div>
            <div class="text-[10px] text-teal-600 font-medium mt-1">Plant Site "B"</div>
          </div>

          <!-- Crew C -->
          <div onclick="FPCL_CREW_WEEK_SUITE.setCrewFilter('C')" class="cursor-pointer group p-3 rounded-xl bg-white border border-purple-200 shadow-2xs hover:border-purple-400 hover:shadow-xs transition-all ${this.state.crewFilter === 'C' ? 'ring-2 ring-purple-500 bg-purple-50/40' : ''}">
            <div class="flex items-center justify-between text-xs text-purple-900 font-bold mb-1">
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-purple-600"></span>Crew C</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold">Shift</span>
            </div>
            <div class="text-2xl font-black text-purple-950">${countC}</div>
            <div class="text-[10px] text-purple-600 font-medium mt-1">Plant Site "C"</div>
          </div>

          <!-- Crew D -->
          <div onclick="FPCL_CREW_WEEK_SUITE.setCrewFilter('D')" class="cursor-pointer group p-3 rounded-xl bg-white border border-amber-200 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all ${this.state.crewFilter === 'D' ? 'ring-2 ring-amber-500 bg-amber-50/40' : ''}">
            <div class="flex items-center justify-between text-xs text-amber-900 font-bold mb-1">
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-600"></span>Crew D</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">Shift</span>
            </div>
            <div class="text-2xl font-black text-amber-950">${countD}</div>
            <div class="text-[10px] text-amber-600 font-medium mt-1">Plant Site "D"</div>
          </div>

          <!-- General Shifts -->
          <div onclick="FPCL_CREW_WEEK_SUITE.setCrewFilter('PLANT_GEN')" class="cursor-pointer group p-3 rounded-xl bg-white border border-cyan-200 shadow-2xs hover:border-cyan-400 hover:shadow-xs transition-all ${(this.state.crewFilter === 'PLANT_GEN' || this.state.crewFilter === 'HO') ? 'ring-2 ring-cyan-500 bg-cyan-50/40' : ''}">
            <div class="flex items-center justify-between text-xs text-cyan-900 font-bold mb-1">
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-cyan-600"></span>General</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded bg-cyan-100 text-cyan-800 font-bold">${countGenPlant + countGenHO}</span>
            </div>
            <div class="text-2xl font-black text-cyan-950">${countGenPlant} <span class="text-xs font-semibold text-slate-500">Plant / ${countGenHO} HO</span></div>
            <div class="text-[10px] text-cyan-700 font-medium mt-1">Day Personnel</div>
          </div>
        </div>
      `;

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    renderTableOnly() {
      const tableContainer = document.getElementById('crew-week-table-container');
      if (!tableContainer) return;

      const allData = this.data || [];
      const filtered = this.getFilteredData();

      if (filtered.length === 0) {
        tableContainer.innerHTML = `
          <div class="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <i data-lucide="search-x" class="w-6 h-6"></i>
            </div>
            <h4 class="text-base font-bold text-slate-800 mb-1">No Matching Personnel Found</h4>
            <p class="text-xs text-slate-500 max-w-sm mx-auto mb-4">No records matched your search query or selected filters.</p>
            <button
              type="button"
              onclick="FPCL_CREW_WEEK_SUITE.resetFilters()"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        `;
      } else {
        tableContainer.innerHTML = `
          <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <!-- Table Header Bar -->
            <div class="px-4 py-2.5 bg-gradient-to-r from-slate-100 via-indigo-50/40 to-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <i data-lucide="table" class="w-4 h-4 text-indigo-600"></i>
                <span class="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Crew Week Personnel Roster</span>
                <span id="crew-week-count-badge" class="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                  ${filtered.length} of ${allData.length} Records
                </span>
              </div>
              <div class="text-[11px] text-slate-500 font-medium">
                Showing active crew assignments
              </div>
            </div>

            <!-- Table Body Container -->
            <div class="overflow-x-auto max-h-[550px] overflow-y-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead class="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-slate-700 text-[11px] font-black uppercase tracking-wider shadow-2xs">
                  <tr>
                    <th class="py-3 px-3.5 w-14 text-center">Sr #</th>
                    <th class="py-3 px-4 min-w-[220px]">Employee Name</th>
                    <th class="py-3 px-4 min-w-[220px]">Position / Role</th>
                    <th class="py-3 px-4 min-w-[190px]">Crew Week / Shift</th>
                    <th class="py-3 px-4 min-w-[160px]">Designation</th>
                    <th class="py-3 px-4 min-w-[200px]">Organizational Unit</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-medium">
                  ${filtered.map((item, idx) => {
                    const theme = getCrewTheme(item.crewWeek);
                    const initials = getInitials(item.name);
                    const desigBadge = getDesignationBadge(item.designation);
                    const isEven = idx % 2 === 0;

                    return `
                      <tr class="${isEven ? 'bg-white' : 'bg-slate-50/50'} hover:bg-indigo-50/30 transition-colors group">
                        <!-- Sr -->
                        <td class="py-2.5 px-3.5 text-center">
                          <span class="inline-block px-1.5 py-0.5 rounded font-mono text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200">
                            ${item.sr || (idx + 1)}
                          </span>
                        </td>

                        <!-- Name with colorful gradient avatar -->
                        <td class="py-2.5 px-4">
                          <div class="flex items-center gap-2.5">
                            <span class="w-8 h-8 rounded-lg bg-gradient-to-tr ${theme.avatarGrad} text-white font-extrabold text-[11px] flex items-center justify-center shadow-2xs shrink-0 select-none">
                              ${initials}
                            </span>
                            <div class="min-w-0">
                              <div class="font-extrabold text-slate-900 group-hover:text-indigo-900 text-[13px] leading-tight truncate">
                                ${item.name || '—'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <!-- Position -->
                        <td class="py-2.5 px-4">
                          <div class="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                            <i data-lucide="briefcase" class="w-3 h-3 text-slate-400 shrink-0"></i>
                            <span>${item.position || '—'}</span>
                          </div>
                        </td>

                        <!-- Crew Week Badge -->
                        <td class="py-2.5 px-4 whitespace-nowrap">
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${theme.badge} shadow-2xs">
                            <span class="w-2 h-2 rounded-full ${theme.dot}"></span>
                            <span>${item.crewWeek || '—'}</span>
                          </span>
                        </td>

                        <!-- Designation -->
                        <td class="py-2.5 px-4 whitespace-nowrap">
                          ${desigBadge}
                        </td>

                        <!-- Organizational Unit -->
                        <td class="py-2.5 px-4">
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            <i data-lucide="building" class="w-3 h-3 text-slate-500 shrink-0"></i>
                            <span class="truncate">${item.orgUnit || '—'}</span>
                          </span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Table Footer -->
            <div class="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-700">Displaying ${filtered.length} of ${allData.length} Personnel</span>
                <span class="text-slate-300">•</span>
                <span>Sorted by Sheet Order (Sr #)</span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onclick="FPCL_CREW_WEEK_SUITE.exportCsv()"
                  class="font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <i data-lucide="download" class="w-3 h-3"></i> Download CSV
                </button>
              </div>
            </div>
          </div>
        `;
      }

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    render() {
      const container = document.getElementById('crew-week-modal-body');
      if (!container) return;

      const allData = this.data || [];
      const orgUnitSet = new Set();
      let countA = 0;
      let countB = 0;
      let countC = 0;
      let countD = 0;
      let countGenPlant = 0;
      let countGenHO = 0;
      let countMgmt = 0;
      let countJrMgmt = 0;
      let countStaff = 0;

      allData.forEach(item => {
        const rawCrew = (item.crewWeek || '').toLowerCase();
        if (rawCrew.includes('"a"') || rawCrew.endsWith(' a')) countA++;
        else if (rawCrew.includes('"b"') || rawCrew.endsWith(' b')) countB++;
        else if (rawCrew.includes('"c"') || rawCrew.endsWith(' c')) countC++;
        else if (rawCrew.includes('"d"') || rawCrew.endsWith(' d')) countD++;
        else if (rawCrew.includes('head office')) countGenHO++;
        else countGenPlant++;

        const rawDes = (item.designation || '').toLowerCase();
        if (rawDes === 'management') countMgmt++;
        else if (rawDes.includes('junior')) countJrMgmt++;
        else if (rawDes === 'staff') countStaff++;

        if (item.orgUnit) orgUnitSet.add(item.orgUnit);
      });

      const orgUnitsList = Array.from(orgUnitSet).sort();

      // Check if shell already mounted
      let filtersContainer = document.getElementById('crew-week-filters-container');
      if (!filtersContainer) {
        // Mount complete modal layout shell
        container.innerHTML = `
          <div class="space-y-4">
            <!-- 1. Top Metrics Grid -->
            <div id="crew-week-stats-container"></div>

            <!-- 2. Search & Filters Ribbon -->
            <div id="crew-week-filters-container" class="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-2xs space-y-3">
              <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <!-- Search Input: Stays permanent in DOM so typing is continuous and uninterrupted -->
                <div class="relative flex-1 min-w-[260px]">
                  <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                  <input
                    id="crew-week-search-input"
                    type="text"
                    autocomplete="off"
                    spellcheck="false"
                    placeholder="Search freely by any name, position, shift crew, or organizational unit..."
                    class="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-lg text-xs sm:text-sm font-medium text-slate-900 shadow-2xs focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  />
                  <button
                    id="crew-week-search-clear-btn"
                    type="button"
                    onclick="FPCL_CREW_WEEK_SUITE.clearSearch()"
                    class="hidden absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                  </button>
                </div>

                <!-- Dropdown Filters -->
                <div class="flex flex-wrap items-center gap-2">
                  <!-- Crew Dropdown -->
                  <div class="relative min-w-[130px]">
                    <select
                      id="crew-week-crew-select"
                      onchange="FPCL_CREW_WEEK_SUITE.setCrewFilter(this.value)"
                      class="w-full pl-2.5 pr-7 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 appearance-none outline-none focus:border-indigo-600 cursor-pointer shadow-2xs"
                    >
                      <option value="all">All Crews (${allData.length})</option>
                      <option value="A">Crew A (${countA})</option>
                      <option value="B">Crew B (${countB})</option>
                      <option value="C">Crew C (${countC})</option>
                      <option value="D">Crew D (${countD})</option>
                      <option value="PLANT_GEN">Gen. Plant Site (${countGenPlant})</option>
                      <option value="HO">Gen. Head Office (${countGenHO})</option>
                    </select>
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                  </div>

                  <!-- Designation Dropdown -->
                  <div class="relative min-w-[140px]">
                    <select
                      id="crew-week-desig-select"
                      onchange="FPCL_CREW_WEEK_SUITE.setDesigFilter(this.value)"
                      class="w-full pl-2.5 pr-7 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 appearance-none outline-none focus:border-indigo-600 cursor-pointer shadow-2xs"
                    >
                      <option value="all">All Designations</option>
                      <option value="Management">Management (${countMgmt})</option>
                      <option value="Junior Management">Junior Mgmt (${countJrMgmt})</option>
                      <option value="Staff">Staff (${countStaff})</option>
                    </select>
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                  </div>

                  <!-- Org Unit Dropdown -->
                  <div class="relative min-w-[160px] max-w-[220px]">
                    <select
                      id="crew-week-orgunit-select"
                      onchange="FPCL_CREW_WEEK_SUITE.setOrgUnitFilter(this.value)"
                      class="w-full pl-2.5 pr-7 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 appearance-none outline-none focus:border-indigo-600 cursor-pointer shadow-2xs truncate"
                    >
                      <option value="all">All Units (${orgUnitsList.length})</option>
                      ${orgUnitsList.map(u => `
                        <option value="${u}">${u}</option>
                      `).join('')}
                    </select>
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                  </div>

                  <!-- Reset Button -->
                  <button
                    id="crew-week-reset-filters-btn"
                    type="button"
                    onclick="FPCL_CREW_WEEK_SUITE.resetFilters()"
                    class="hidden items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer shadow-2xs"
                  >
                    <i data-lucide="rotate-ccw" class="w-3 h-3 text-slate-500"></i>
                    <span>Reset</span>
                  </button>

                  <!-- Export CSV Button -->
                  <button
                    type="button"
                    onclick="FPCL_CREW_WEEK_SUITE.exportCsv()"
                    class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-all cursor-pointer shadow-2xs"
                    title="Export filtered records to CSV"
                  >
                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                    <span>Export</span>
                  </button>
                </div>
              </div>

              <!-- Quick Crew Filter Pills -->
              <div class="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 text-xs">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filter by Crew:</span>
                <button
                  type="button"
                  data-crew-pill="all"
                  onclick="FPCL_CREW_WEEK_SUITE.setCrewFilter('all')"
                  class="px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer bg-slate-800 text-white shadow-2xs"
                >
                  All (${allData.length})
                </button>
                <button
                  type="button"
                  data-crew-pill="A"
                  onclick="FPCL_CREW_WEEK_SUITE.setCrewFilter('A')"
                  class="px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200"
                >
                  Crew A (${countA})
                </button>
                <button
                  type="button"
                  data-crew-pill="B"
                  onclick="FPCL_CREW_WEEK_SUITE.setCrewFilter('B')"
                  class="px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200"
                >
                  Crew B (${countB})
                </button>
                <button
                  type="button"
                  data-crew-pill="C"
                  onclick="FPCL_CREW_WEEK_SUITE.setCrewFilter('C')"
                  class="px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200"
                >
                  Crew C (${countC})
                </button>
                <button
                  type="button"
                  data-crew-pill="D"
                  onclick="FPCL_CREW_WEEK_SUITE.setCrewFilter('D')"
                  class="px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                >
                  Crew D (${countD})
                </button>
                <button
                  type="button"
                  data-crew-pill="PLANT_GEN"
                  onclick="FPCL_CREW_WEEK_SUITE.setCrewFilter('PLANT_GEN')"
                  class="px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200"
                >
                  Gen Shift Plant (${countGenPlant})
                </button>
                <button
                  type="button"
                  data-crew-pill="HO"
                  onclick="FPCL_CREW_WEEK_SUITE.setCrewFilter('HO')"
                  class="px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200"
                >
                  Head Office (${countGenHO})
                </button>
              </div>
            </div>

            <!-- 3. Dynamic Table Results Container -->
            <div id="crew-week-table-container"></div>
          </div>
        `;

        // Bind input event listener directly on the permanent input element
        const searchInput = document.getElementById('crew-week-search-input');
        if (searchInput) {
          searchInput.value = this.state.searchQuery || '';
          searchInput.addEventListener('input', (e) => {
            FPCL_CREW_WEEK_SUITE.setSearchQuery(e.target.value);
          });
        }
      }

      this.updateStatsCards();
      this.updateFilterPillsUI();
      this.updateResetButtonState();
      this.renderTableOnly();
    }
  };

  // Initialize suite
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => crewWeekSuite.init());
    } else {
      crewWeekSuite.init();
    }
  }

})();
