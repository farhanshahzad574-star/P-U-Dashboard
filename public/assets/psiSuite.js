/**
 * FPCL Executive Operations & Compliance Portal
 * Process Safety Information (PSI) Executive BI Suite
 * 
 * Google Sheet ID: 1vWYE3G4W7TxHBVzsUJuu1Z-aufjXD-xFeodTpFUTZtY
 * Sheet Tab: PSI
 * 
 * Strict Scope & Isolation: Leaves Strategic, PLR, PSM Audits, PSM Validation, IMS, PSSR, CAPEX, Sub HSE - P, Sub HSE – E&I, EHSE, Sub HSE – Mech untouched.
 */

(function () {
  'use strict';

  const PSI_SHEET_ID = '1vWYE3G4W7TxHBVzsUJuu1Z-aufjXD-xFeodTpFUTZtY';
  const PSI_SHEET_TAB = 'PSI';
  const PSI_SHEET_URL = `https://docs.google.com/spreadsheets/d/${PSI_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(PSI_SHEET_TAB)}`;

  const psiSuite = {
    state: {
      searchQuery: '',
      responsibleUnitFilter: 'all', // Column B: Responsible_Unit
      plannedFilter: 'all',         // Column L to T: Planned columns
      actualFilter: 'all',          // Column C to K: Actual columns
      isSyncing: false,
      lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSettingsOpen: false,
      activeTooltipItem: null
    },

    init() {
      window.FPCL_PSI_SUITE = this;

      // Try reading from cache
      try {
        const cached = localStorage.getItem('FPCL_PSI_CACHE');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.FPCL_PSI_DATA = parsed;
          }
        }
      } catch (e) {}

      // Fallback to initial seed data
      if (!window.FPCL_PSI_DATA || window.FPCL_PSI_DATA.length === 0) {
        if (window.FPCL_PSI_INITIAL_SEED) {
          window.FPCL_PSI_DATA = window.FPCL_PSI_INITIAL_SEED.slice();
        }
      }

      // Propagate stats to overview registry
      this.syncStatsToOverview();

      // Immediate background live sync with Google Sheets on load/refresh
      setTimeout(() => {
        this.syncLiveFeed({ silent: true, force: true });
      }, 300);

      // Periodic auto-sync every 15 seconds to track live changes in Google Sheet
      if (!this._autoSyncTimer) {
        this._autoSyncTimer = setInterval(() => {
          this.syncLiveFeed({ silent: true, force: true });
        }, 15000);
      }

      // Auto-sync when user returns to the browser tab
      if (typeof document !== 'undefined' && !this._visibilityBound) {
        this._visibilityBound = true;
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            this.syncLiveFeed({ silent: true, force: true });
          }
        });
      }
    },

    getRawData() {
      if (Array.isArray(window.FPCL_PSI_DATA) && window.FPCL_PSI_DATA.length > 0) {
        return window.FPCL_PSI_DATA;
      }
      if (Array.isArray(window.FPCL_PSI_INITIAL_SEED) && window.FPCL_PSI_INITIAL_SEED.length > 0) {
        return window.FPCL_PSI_INITIAL_SEED;
      }
      return [];
    },

    getFilteredData() {
      const raw = this.getRawData();
      const q = (this.state.searchQuery || '').toLowerCase().trim();
      const unit = this.state.responsibleUnitFilter;

      return raw.filter(item => {
        // Exclude aggregate total row if present in raw data
        const ru = String(item.responsibleUnit || '').trim().toLowerCase();
        if (ru === 'total' || ru === 'grand total') return false;

        // Search match
        if (q) {
          const matchUnit = String(item.responsibleUnit || '').toLowerCase().includes(q);
          const matchId = String(item.id || '').toLowerCase().includes(q);
          if (!matchUnit && !matchId) return false;
        }

        // Responsible Unit Filter (Column B)
        if (unit !== 'all') {
          if (String(item.responsibleUnit || '').trim().toLowerCase() !== unit.toLowerCase()) {
            return false;
          }
        }

        return true;
      });
    },

    calculateTotals(items) {
      const totals = {
        actualSteamGen: 0,
        actualPowerGen: 0,
        actualCoalSorbent: 0,
        actualBalanceOfPlant: 0,
        actualGrid: 0,
        actualNonOperating: 0,
        actualHseq: 0,
        actualPlantGeneral: 0,
        totalUpload: 0, // Column K: Total Upload

        plannedSteamGen: 0,
        plannedPowerGen: 0,
        plannedCoalSorbent: 0,
        plannedBalanceOfPlant: 0,
        plannedGrid: 0,
        plannedNonOperating: 0,
        plannedHseq: 0,
        plannedPlantGeneral: 0,
        totalPlanned: 0, // Column T: Total Planned

        filteredPlanned: 0,
        filteredActual: 0,
        documentsRemaining: 0, // Pending (Red)
        overallPercent: 0,
        activePlannedLabel: 'Total Planned',
        activeActualLabel: 'Actual Uploaded'
      };

      items.forEach(i => {
        totals.actualSteamGen += Number(i.actualSteamGen) || 0;
        totals.actualPowerGen += Number(i.actualPowerGen) || 0;
        totals.actualCoalSorbent += Number(i.actualCoalSorbent) || 0;
        totals.actualBalanceOfPlant += Number(i.actualBalanceOfPlant) || 0;
        totals.actualGrid += Number(i.actualGrid) || 0;
        totals.actualNonOperating += Number(i.actualNonOperating) || 0;
        totals.actualHseq += Number(i.actualHseq) || 0;
        totals.actualPlantGeneral += Number(i.actualPlantGeneral) || 0;
        totals.totalUpload += Number(i.totalUpload) || 0;

        totals.plannedSteamGen += Number(i.plannedSteamGen) || 0;
        totals.plannedPowerGen += Number(i.plannedPowerGen) || 0;
        totals.plannedCoalSorbent += Number(i.plannedCoalSorbent) || 0;
        totals.plannedBalanceOfPlant += Number(i.plannedBalanceOfPlant) || 0;
        totals.plannedGrid += Number(i.plannedGrid) || 0;
        totals.plannedNonOperating += Number(i.plannedNonOperating) || 0;
        totals.plannedHseq += Number(i.plannedHseq) || 0;
        totals.plannedPlantGeneral += Number(i.plannedPlantGeneral) || 0;
        totals.totalPlanned += Number(i.totalPlanned) || 0;
      });

      // 1-to-1 Column Mapping between Planned (Col L to T) and Actual (Col C to K)
      const planColMap = {
        plannedSteamGen: { act: 'actualSteamGen', label: 'Planned Steam Gen' },
        plannedPowerGen: { act: 'actualPowerGen', label: 'Planned Power Gen' },
        plannedCoalSorbent: { act: 'actualCoalSorbent', label: 'Planned Coal & Sorbent' },
        plannedBalanceOfPlant: { act: 'actualBalanceOfPlant', label: 'Planned BOP' },
        plannedGrid: { act: 'actualGrid', label: 'Planned Grid' },
        plannedNonOperating: { act: 'actualNonOperating', label: 'Planned Non-Op' },
        plannedHseq: { act: 'actualHseq', label: 'Planned HSEQ' },
        plannedPlantGeneral: { act: 'actualPlantGeneral', label: 'Planned Plant Gen' },
        totalPlanned: { act: 'totalUpload', label: 'Total Planned' }
      };

      const actColMap = {
        actualSteamGen: { plan: 'plannedSteamGen', label: 'Actual Steam Gen' },
        actualPowerGen: { plan: 'plannedPowerGen', label: 'Actual Power Gen' },
        actualCoalSorbent: { plan: 'plannedCoalSorbent', label: 'Actual Coal & Sorbent' },
        actualBalanceOfPlant: { plan: 'plannedBalanceOfPlant', label: 'Actual BOP' },
        actualGrid: { plan: 'plannedGrid', label: 'Actual Grid' },
        actualNonOperating: { plan: 'plannedNonOperating', label: 'Actual Non-Op' },
        actualHseq: { plan: 'plannedHseq', label: 'Actual HSEQ' },
        actualPlantGeneral: { plan: 'plannedPlantGeneral', label: 'Actual Plant Gen' },
        totalUpload: { plan: 'totalPlanned', label: 'Total Upload' }
      };

      const pFilter = this.state.plannedFilter;
      const aFilter = this.state.actualFilter;

      // 1. Calculate filteredPlanned (Blue = Total Planned)
      if (pFilter && pFilter !== 'all' && totals[pFilter] !== undefined) {
        totals.filteredPlanned = totals[pFilter];
        totals.activePlannedLabel = planColMap[pFilter]?.label || 'Planned';
      } else if (aFilter && aFilter !== 'all' && actColMap[aFilter]) {
        const pairedPlanKey = actColMap[aFilter].plan;
        totals.filteredPlanned = totals[pairedPlanKey] !== undefined ? totals[pairedPlanKey] : totals.totalPlanned;
        totals.activePlannedLabel = actColMap[aFilter].label.replace('Actual', 'Planned');
      } else {
        totals.filteredPlanned = totals.totalPlanned;
        totals.activePlannedLabel = 'Total Planned';
      }

      // 2. Calculate filteredActual (Green = Actual Uploaded)
      if (aFilter && aFilter !== 'all' && totals[aFilter] !== undefined) {
        totals.filteredActual = totals[aFilter];
        totals.activeActualLabel = actColMap[aFilter]?.label || 'Actual Uploaded';
      } else if (pFilter && pFilter !== 'all' && planColMap[pFilter]) {
        const pairedActKey = planColMap[pFilter].act;
        totals.filteredActual = totals[pairedActKey] !== undefined ? totals[pairedActKey] : totals.totalUpload;
        totals.activeActualLabel = planColMap[pFilter].label.replace('Planned', 'Actual Uploaded');
      } else {
        totals.filteredActual = totals.totalUpload;
        totals.activeActualLabel = 'Actual Uploaded';
      }

      // 3. Red = Pending (Difference of Planned and Actual)
      totals.documentsRemaining = Math.max(0, totals.filteredPlanned - totals.filteredActual);

      // 4. Overall % Complete
      totals.overallPercent = totals.filteredPlanned > 0
        ? (totals.filteredActual / totals.filteredPlanned) * 100
        : 0;

      return totals;
    },

    getActivePlannedColumnKey() {
      const p = this.state.plannedFilter;
      const a = this.state.actualFilter;
      if (p && p !== 'all') return p;
      if (a && a !== 'all') {
        const actMap = {
          actualSteamGen: 'plannedSteamGen',
          actualPowerGen: 'plannedPowerGen',
          actualCoalSorbent: 'plannedCoalSorbent',
          actualBalanceOfPlant: 'plannedBalanceOfPlant',
          actualGrid: 'plannedGrid',
          actualNonOperating: 'plannedNonOperating',
          actualHseq: 'plannedHseq',
          actualPlantGeneral: 'plannedPlantGeneral',
          totalUpload: 'totalPlanned'
        };
        return actMap[a] || 'totalPlanned';
      }
      return 'totalPlanned';
    },

    getActiveActualColumnKey() {
      const p = this.state.plannedFilter;
      const a = this.state.actualFilter;
      if (a && a !== 'all') return a;
      if (p && p !== 'all') {
        const planMap = {
          plannedSteamGen: 'actualSteamGen',
          plannedPowerGen: 'actualPowerGen',
          plannedCoalSorbent: 'actualCoalSorbent',
          plannedBalanceOfPlant: 'actualBalanceOfPlant',
          plannedGrid: 'actualGrid',
          plannedNonOperating: 'actualNonOperating',
          plannedHseq: 'actualHseq',
          plannedPlantGeneral: 'actualPlantGeneral',
          totalPlanned: 'totalUpload'
        };
        return planMap[p] || 'totalUpload';
      }
      return 'totalUpload';
    },

    syncStatsToOverview() {
      const raw = this.getRawData().filter(i => {
        const ru = String(i.responsibleUnit || '').trim().toLowerCase();
        return ru !== 'total' && ru !== 'grand total';
      });
      const totals = this.calculateTotals(raw);

      if (window.DASHBOARD_REGISTRY) {
        const psi = window.DASHBOARD_REGISTRY.find(d => d.id === 'psi');
        if (psi) {
          psi.status = 'Active';
          psi.hasSheetLink = true;
          psi.kpis = {
            total: totals.totalPlanned,
            closed: totals.totalUpload,
            inProgress: totals.documentsRemaining,
            overdue: 0,
            compliance: totals.overallPercent.toFixed(1) + '%'
          };
          psi.punchList = {
            open: totals.documentsRemaining,
            closed: totals.totalUpload,
            total: totals.totalPlanned,
            rate: totals.overallPercent.toFixed(1) + '%'
          };
          psi.dataReadiness = { master: '100%', signoff: '100%' };
          psi.statusComment = `Live Google Sheets: PSI Tab (${totals.totalPlanned.toLocaleString()} Docs, ${totals.overallPercent.toFixed(1)}% Closed)`;
        }
      }

      if (window.portalApp && typeof window.portalApp.renderNavMenu === 'function') {
        window.portalApp.renderNavMenu();
      }
      if (window.portalApp && typeof window.portalApp.renderProgressComparisonChart === 'function') {
        window.portalApp.renderProgressComparisonChart();
      }
    },

    async syncLiveFeed(options = {}) {
      const silent = !!options.silent;
      const force = !!options.force;
      if (this.state.isSyncing) return;
      this.state.isSyncing = true;
      this.renderSyncButton();

      const ts = Date.now();
      const candidateUrls = [
        `/api/psi?force=true&_t=${ts}`,
        `/api/sheets/fetch?sheetTab=PSI&sheetId=${PSI_SHEET_ID}&force=true&_t=${ts}`,
        `https://docs.google.com/spreadsheets/d/${PSI_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(PSI_SHEET_TAB)}&_t=${ts}`,
        `https://docs.google.com/spreadsheets/d/${PSI_SHEET_ID}/export?format=csv&sheet=${encodeURIComponent(PSI_SHEET_TAB)}&_t=${ts}`
      ];

      let csvText = '';
      for (const url of candidateUrls) {
        try {
          const res = await fetch(url, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          });
          if (res.ok) {
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const json = await res.json();
              if (json && json.success && json.csvText) {
                csvText = json.csvText;
                break;
              } else if (json && json.data && Array.isArray(json.data) && json.data.length > 0) {
                window.FPCL_PSI_DATA = json.data;
                try {
                  localStorage.setItem('FPCL_PSI_CACHE', JSON.stringify(json.data));
                } catch (e) {}
                this.state.isSyncing = false;
                this.state.lastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                this.syncStatsToOverview();
                this.render();
                if (!silent && window.portalApp && typeof window.portalApp.showToast === 'function') {
                  window.portalApp.showToast('PSI Live Feed Synced', 'Live changes successfully updated from Google Sheet PSI tab.', 'success');
                }
                return;
              }
            } else {
              const text = await res.text();
              const lower = text.toLowerCase();
              if (text && !text.includes('<!DOCTYPE html>') && (lower.includes('responsible') || lower.includes('steam') || lower.includes('planned'))) {
                csvText = text;
                break;
              }
            }
          }
        } catch (e) {
          // Continue to next candidate
        }
      }

      if (csvText) {
        const parsed = this.parseCsv(csvText);
        if (parsed.length > 0) {
          window.FPCL_PSI_DATA = parsed;
          try {
            localStorage.setItem('FPCL_PSI_CACHE', JSON.stringify(parsed));
          } catch (e) {}
          this.state.isSyncing = false;
          this.state.lastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          this.syncStatsToOverview();
          this.render();
          if (!silent && window.portalApp && typeof window.portalApp.showToast === 'function') {
            window.portalApp.showToast('PSI Live Feed Synced', 'Live changes successfully updated from Google Sheet PSI tab.', 'success');
          }
          return;
        }
      }

      this.state.isSyncing = false;
      this.renderSyncButton();
      if (!silent && window.portalApp && typeof window.portalApp.showToast === 'function') {
        window.portalApp.showToast('PSI Live Sync', 'Using verified PSI dataset.', 'info');
      }
    },

    parseCsv(csvText) {
      if (!csvText) return [];
      const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) return [];

      const parseCsvLine = (line) => {
        const cells = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
              cur += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (ch === ',' && !inQuotes) {
            cells.push(cur.trim());
            cur = '';
          } else {
            cur += ch;
          }
        }
        cells.push(cur.trim());
        return cells.map(c => c.replace(/^"|"$/g, '').trim());
      };

      const headerCells = parseCsvLine(lines[0]);
      const normHeaders = headerCells.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

      const colIdx = {
        id: normHeaders.indexOf('id'),
        unit: normHeaders.findIndex(h => h.includes('responsible') || h === 'unit'),
        actSteam: normHeaders.findIndex(h => h.includes('actual') && h.includes('steam')),
        actPower: normHeaders.findIndex(h => h.includes('actual') && h.includes('power')),
        actCoal: normHeaders.findIndex(h => h.includes('actual') && (h.includes('coal') || h.includes('sorbent'))),
        actBop: normHeaders.findIndex(h => h.includes('actual') && (h.includes('balance') || h.includes('bop'))),
        actGrid: normHeaders.findIndex(h => h.includes('actual') && h.includes('grid')),
        actNonOp: normHeaders.findIndex(h => h.includes('actual') && (h.includes('non') || h.includes('operating'))),
        actHseq: normHeaders.findIndex(h => h.includes('actual') && h.includes('hseq')),
        actGeneral: normHeaders.findIndex(h => h.includes('actual') && (h.includes('general') || h.includes('plant'))),
        totalUpload: normHeaders.findIndex(h => h.includes('upload') || (h.includes('total') && h.includes('upload'))),

        planSteam: normHeaders.findIndex(h => h.includes('plan') && h.includes('steam')),
        planPower: normHeaders.findIndex(h => h.includes('plan') && h.includes('power')),
        planCoal: normHeaders.findIndex(h => h.includes('plan') && (h.includes('coal') || h.includes('sorbent'))),
        planBop: normHeaders.findIndex(h => h.includes('plan') && (h.includes('balance') || h.includes('bop'))),
        planGrid: normHeaders.findIndex(h => h.includes('plan') && h.includes('grid')),
        planNonOp: normHeaders.findIndex(h => h.includes('plan') && (h.includes('non') || h.includes('operating'))),
        planHseq: normHeaders.findIndex(h => h.includes('plan') && h.includes('hseq')),
        planGeneral: normHeaders.findIndex(h => h.includes('plan') && (h.includes('general') || h.includes('plant'))),
        totalPlanned: normHeaders.findIndex(h => h.includes('totalplanned') || (h.includes('total') && h.includes('plan')))
      };

      const parseNum = (val) => {
        if (val === undefined || val === null || val === '') return 0;
        const n = parseFloat(String(val).replace(/,/g, '').trim());
        return isNaN(n) ? 0 : n;
      };

      const results = [];
      for (let i = 1; i < lines.length; i++) {
        const cells = parseCsvLine(lines[i]);
        if (cells.length < 2) continue;

        const unitName = cells[colIdx.unit !== -1 ? colIdx.unit : 1] || '';
        if (!unitName || unitName.toLowerCase() === 'total' || unitName.toLowerCase() === 'grand total') {
          continue; // Skip aggregate summary row
        }

        const id = cells[colIdx.id !== -1 ? colIdx.id : 0] || String(results.length + 1);
        const actualSteamGen = parseNum(cells[colIdx.actSteam !== -1 ? colIdx.actSteam : 2]);
        const actualPowerGen = parseNum(cells[colIdx.actPower !== -1 ? colIdx.actPower : 3]);
        const actualCoalSorbent = parseNum(cells[colIdx.actCoal !== -1 ? colIdx.actCoal : 4]);
        const actualBalanceOfPlant = parseNum(cells[colIdx.actBop !== -1 ? colIdx.actBop : 5]);
        const actualGrid = parseNum(cells[colIdx.actGrid !== -1 ? colIdx.actGrid : 6]);
        const actualNonOperating = parseNum(cells[colIdx.actNonOp !== -1 ? colIdx.actNonOp : 7]);
        const actualHseq = parseNum(cells[colIdx.actHseq !== -1 ? colIdx.actHseq : 8]);
        const actualPlantGeneral = parseNum(cells[colIdx.actGeneral !== -1 ? colIdx.actGeneral : 9]);
        const totalUpload = parseNum(cells[colIdx.totalUpload !== -1 ? colIdx.totalUpload : 10]);

        const plannedSteamGen = parseNum(cells[colIdx.planSteam !== -1 ? colIdx.planSteam : 11]);
        const plannedPowerGen = parseNum(cells[colIdx.planPower !== -1 ? colIdx.planPower : 12]);
        const plannedCoalSorbent = parseNum(cells[colIdx.planCoal !== -1 ? colIdx.planCoal : 13]);
        const plannedBalanceOfPlant = parseNum(cells[colIdx.planBop !== -1 ? colIdx.planBop : 14]);
        const plannedGrid = parseNum(cells[colIdx.planGrid !== -1 ? colIdx.planGrid : 15]);
        const plannedNonOperating = parseNum(cells[colIdx.planNonOp !== -1 ? colIdx.planNonOp : 16]);
        const plannedHseq = parseNum(cells[colIdx.planHseq !== -1 ? colIdx.planHseq : 17]);
        const plannedPlantGeneral = parseNum(cells[colIdx.planGeneral !== -1 ? colIdx.planGeneral : 18]);
        const totalPlanned = parseNum(cells[colIdx.totalPlanned !== -1 ? colIdx.totalPlanned : 19]);

        const documentsRemaining = Math.max(0, totalPlanned - totalUpload);
        const percentComplete = totalPlanned > 0 ? (totalUpload / totalPlanned) * 100 : 0;

        results.push({
          id,
          responsibleUnit: unitName,
          actualSteamGen,
          actualPowerGen,
          actualCoalSorbent,
          actualBalanceOfPlant,
          actualGrid,
          actualNonOperating,
          actualHseq,
          actualPlantGeneral,
          totalUpload,
          plannedSteamGen,
          plannedPowerGen,
          plannedCoalSorbent,
          plannedBalanceOfPlant,
          plannedGrid,
          plannedNonOperating,
          plannedHseq,
          plannedPlantGeneral,
          totalPlanned,
          documentsRemaining,
          percentComplete
        });
      }

      return results;
    },

    setResponsibleUnitFilter(val) {
      this.state.responsibleUnitFilter = val;
      this.render();
    },

    setPlannedFilter(val) {
      this.state.plannedFilter = val;
      this.render();
    },

    setActualFilter(val) {
      this.state.actualFilter = val;
      this.render();
    },

    handleSearch(val) {
      this.state.searchQuery = val;
      this.render();
    },

    resetFilters() {
      this.state.searchQuery = '';
      this.state.responsibleUnitFilter = 'all';
      this.state.plannedFilter = 'all';
      this.state.actualFilter = 'all';
      const searchInput = document.getElementById('psi-search-input');
      if (searchInput) searchInput.value = '';
      this.render();
      if (window.portalApp && typeof window.portalApp.showToast === 'function') {
        window.portalApp.showToast('All PSI filters have been reset.', 'info');
      }
    },

    exportCsv() {
      const filtered = this.getFilteredData();
      if (filtered.length === 0) {
        if (window.portalApp && typeof window.portalApp.showToast === 'function') {
          window.portalApp.showToast('No matching records to export.', 'warning');
        }
        return;
      }

      const headers = [
        "ID",
        "Responsible_Unit",
        "Actual_Steam_Generation",
        "Actual_Power_Generation",
        "Actual_Coal_&_Sorbent_Handling",
        "Actual_Balance_of_Plant",
        "Actual _Grid",
        "Actual_Non_Operating_Areas",
        "Actual _HSEQ",
        "Actual_Plant General",
        "Total_Upload",
        "Planned_Steam_Generation",
        "Planned_Power_Generation",
        "Planned_Coal_&_Sorbent_Handling",
        "Planned _Balance_of_Plant",
        "Planned_Grid",
        "Planned_Non_Operating_Areas",
        "Planned_HSEQ",
        "Planned_Plant_General",
        "total_planned",
        "Documents_Remaining_Open",
        "Overall_Percent_Complete"
      ];

      const rows = filtered.map(item => [
        `"${String(item.id).replace(/"/g, '""')}"`,
        `"${String(item.responsibleUnit).replace(/"/g, '""')}"`,
        item.actualSteamGen,
        item.actualPowerGen,
        item.actualCoalSorbent,
        item.actualBalanceOfPlant,
        item.actualGrid,
        item.actualNonOperating,
        item.actualHseq,
        item.actualPlantGeneral,
        item.totalUpload,
        item.plannedSteamGen,
        item.plannedPowerGen,
        item.plannedCoalSorbent,
        item.plannedBalanceOfPlant,
        item.plannedGrid,
        item.plannedNonOperating,
        item.plannedHseq,
        item.plannedPlantGeneral,
        item.totalPlanned,
        item.documentsRemaining,
        `${(item.percentComplete || 0).toFixed(1)}%`
      ]);

      // Append Total row
      const totals = this.calculateTotals(filtered);
      rows.push([
        `"TOTAL"`,
        `"Filtered Total (${filtered.length} Units)"`,
        totals.actualSteamGen,
        totals.actualPowerGen,
        totals.actualCoalSorbent,
        totals.actualBalanceOfPlant,
        totals.actualGrid,
        totals.actualNonOperating,
        totals.actualHseq,
        totals.actualPlantGeneral,
        totals.totalUpload,
        totals.plannedSteamGen,
        totals.plannedPowerGen,
        totals.plannedCoalSorbent,
        totals.plannedBalanceOfPlant,
        totals.plannedGrid,
        totals.plannedNonOperating,
        totals.plannedHseq,
        totals.plannedPlantGeneral,
        totals.totalPlanned,
        totals.documentsRemaining,
        `${totals.overallPercent.toFixed(1)}%`
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `PSI_Export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (window.portalApp && typeof window.portalApp.showToast === 'function') {
        window.portalApp.showToast(`Exported ${filtered.length} PSI records based on active filters.`, 'success');
      }
    },

    scrollTable(direction) {
      const el = document.getElementById('psi-table-scroll-container');
      if (!el) return;
      const scrollAmount = 320;
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    },

    toggleSettingsModal() {
      this.state.isSettingsOpen = !this.state.isSettingsOpen;
      const modal = document.getElementById('psi-settings-modal');
      if (modal) {
        if (this.state.isSettingsOpen) {
          modal.classList.remove('hidden');
          modal.classList.add('flex');
        } else {
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        }
      }
    },

    renderSyncButton() {
      const icon = document.getElementById('psi-sync-icon');
      if (icon) {
        if (this.state.isSyncing) {
          icon.classList.add('animate-spin');
        } else {
          icon.classList.remove('animate-spin');
        }
      }
    },

    render() {
      const container = document.getElementById('psi-specialized-container');
      if (!container) return;

      const filtered = this.getFilteredData();
      const raw = this.getRawData().filter(i => {
        const ru = String(i.responsibleUnit || '').trim().toLowerCase();
        return ru !== 'total' && ru !== 'grand total';
      });
      const totals = this.calculateTotals(filtered);

      // Extract unique Responsible Units for Filter 1
      const allUnits = Array.from(new Set(raw.map(i => i.responsibleUnit).filter(Boolean))).sort();

      container.innerHTML = `
        <!-- ========================================================================= -->
        <!-- 1. GRADIENT COLOR EYECATCHING BANNER AT THE TOP (NO EXTRA TEXTS/DETAILS) -->
        <!-- ========================================================================= -->
        <div class="relative overflow-hidden rounded-2xl p-4 sm:p-5 shadow-lg border border-indigo-400/40" style="background: linear-gradient(135deg, #1E1B4B 0%, #312E81 35%, #1E40AF 75%, #0284C7 100%);">
          <!-- Ambient Glow Effect -->
          <div class="absolute -right-16 -top-16 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -left-16 -bottom-16 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
            
            <!-- Heading (Just mention heading, no extra texts and details) -->
            <div class="flex items-center gap-2.5 sm:gap-3">
              <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shrink-0 shadow-inner">
                <i data-lucide="gauge" class="w-5 h-5 sm:w-6 sm:h-6 text-cyan-200"></i>
              </div>
              <h2 class="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white m-0 p-0 leading-tight">
                Process Safety Information (PSI)
              </h2>
            </div>

            <!-- Important Feature Buttons (Matching attached image layout: Search, Reset Filters, Export CSV, Sync Feed, Settings) -->
            <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
              
              <!-- 1. Search Findings Input Button -->
              <div class="relative flex items-center">
                <i data-lucide="search" class="w-3.5 h-3.5 text-white/70 absolute left-2.5 pointer-events-none"></i>
                <input
                  id="psi-search-input"
                  type="text"
                  value="${this.state.searchQuery || ''}"
                  oninput="FPCL_PSI_SUITE.handleSearch(this.value)"
                  placeholder="SEARCH FINDINGS..."
                  class="pl-8 pr-3 py-1.5 rounded-lg text-xs font-bold text-white placeholder-white/75 bg-white/15 hover:bg-white/20 focus:bg-white/25 border border-white/35 backdrop-blur-md outline-none transition-all w-36 sm:w-44 focus:w-52 shadow-2xs"
                  title="Search by unit name or document ID"
                />
              </div>

              <!-- 2. Reset Filters Button -->
              <button
                type="button"
                onclick="FPCL_PSI_SUITE.resetFilters()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-white/15 hover:bg-white/25 border border-white/35 backdrop-blur-md shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap select-none"
                title="Reset all filters to default"
              >
                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-cyan-200"></i>
                <span>Reset Filters</span>
              </button>

              <!-- 3. Export CSV Button -->
              <button
                type="button"
                onclick="FPCL_PSI_SUITE.exportCsv()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-white/15 hover:bg-white/25 border border-white/35 backdrop-blur-md shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap select-none"
                title="Export filtered records as CSV spreadsheet"
              >
                <i data-lucide="download" class="w-3.5 h-3.5 text-emerald-300"></i>
                <span>Export CSV</span>
              </button>

              <!-- 4. Sync Feed Button -->
              <button
                type="button"
                onclick="FPCL_PSI_SUITE.syncLiveFeed({ silent: false, force: true })"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-white/15 hover:bg-white/25 border border-white/35 backdrop-blur-md shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap select-none"
                title="Synchronize live data directly from Google Sheet"
              >
                <i id="psi-sync-icon" data-lucide="refresh-cw" class="w-3.5 h-3.5 text-cyan-300 ${this.state.isSyncing ? 'animate-spin' : ''}"></i>
                <span>Sync Feed</span>
              </button>

              <!-- 5. Settings Icon Button (⚙) -->
              <button
                type="button"
                onclick="FPCL_PSI_SUITE.toggleSettingsModal()"
                class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white bg-white/15 hover:bg-white/25 border border-white/35 backdrop-blur-md shadow-2xs hover:shadow-xs transition-all cursor-pointer select-none"
                title="Google Sheet Integration & Details"
              >
                <i data-lucide="settings" class="w-4 h-4 text-cyan-200"></i>
              </button>

            </div>

          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 2. KPIS CARDS (LARGER CARDS & VALUES, CENTER ALIGNED, COLORFUL LINES)      -->
        <!-- Description: Blue = Total Planned, Green = Actual Uploaded, Red = Pending  -->
        <!-- ========================================================================= -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          
          <!-- KPI 1: TOTAL PLANNED (Blue #1D4ED8) -->
          <div class="bg-white rounded-2xl p-5 sm:p-6 lg:p-7 text-center flex flex-col justify-center items-center relative overflow-hidden transition-all hover:translate-y-[-2px] shadow-sm min-h-[125px] sm:min-h-[145px]"
               style="border: 3px solid #1D4ED8; box-shadow: 0 0 0 1px #1D4ED8, 0 6px 18px rgba(29, 78, 216, 0.15);">
            <div class="text-xs sm:text-sm lg:text-[15px] font-black uppercase tracking-wider text-slate-600 mb-1.5 leading-snug">
              TOTAL PLANNED
            </div>
            <div class="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight leading-tight text-center"
                 style="color: #1D4ED8;">
              ${totals.filteredPlanned.toLocaleString()}
            </div>
            ${totals.activePlannedLabel !== 'Total Planned' ? `
              <div class="text-[10px] sm:text-xs font-bold text-blue-600 mt-1 truncate max-w-full">
                ${totals.activePlannedLabel}
              </div>
            ` : ''}
          </div>

          <!-- KPI 2: ACTUAL UPLOADED (Green #0B8A5A) -->
          <div class="bg-white rounded-2xl p-5 sm:p-6 lg:p-7 text-center flex flex-col justify-center items-center relative overflow-hidden transition-all hover:translate-y-[-2px] shadow-sm min-h-[125px] sm:min-h-[145px]"
               style="border: 3px solid #0B8A5A; box-shadow: 0 0 0 1px #0B8A5A, 0 6px 18px rgba(11, 138, 90, 0.15);">
            <div class="text-xs sm:text-sm lg:text-[15px] font-black uppercase tracking-wider text-slate-600 mb-1.5 leading-snug">
              ACTUAL UPLOADED
            </div>
            <div class="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight leading-tight text-center"
                 style="color: #0B8A5A;">
              ${totals.filteredActual.toLocaleString()}
            </div>
            ${totals.activeActualLabel !== 'Actual Uploaded' ? `
              <div class="text-[10px] sm:text-xs font-bold text-emerald-600 mt-1 truncate max-w-full">
                ${totals.activeActualLabel}
              </div>
            ` : ''}
          </div>

          <!-- KPI 3: OVERALL % COMPLETE (Purple #7C3AED) -->
          <div class="bg-white rounded-2xl p-5 sm:p-6 lg:p-7 text-center flex flex-col justify-center items-center relative overflow-hidden transition-all hover:translate-y-[-2px] shadow-sm min-h-[125px] sm:min-h-[145px]"
               style="border: 3px solid #7C3AED; box-shadow: 0 0 0 1px #7C3AED, 0 6px 18px rgba(124, 58, 237, 0.15);">
            <div class="text-xs sm:text-sm lg:text-[15px] font-black uppercase tracking-wider text-slate-600 mb-1.5 leading-snug">
              OVERALL % COMPLETE
            </div>
            <div class="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight leading-tight text-center"
                 style="color: #7C3AED;">
              ${totals.overallPercent.toFixed(1)}%
            </div>
          </div>

          <!-- KPI 4: PENDING (Red #DC2626) -->
          <div class="bg-white rounded-2xl p-5 sm:p-6 lg:p-7 text-center flex flex-col justify-center items-center relative overflow-hidden transition-all hover:translate-y-[-2px] shadow-sm min-h-[125px] sm:min-h-[145px]"
               style="border: 3px solid #DC2626; box-shadow: 0 0 0 1px #DC2626, 0 6px 18px rgba(220, 38, 38, 0.18);">
            <div class="text-xs sm:text-sm lg:text-[15px] font-black uppercase tracking-wider text-slate-600 mb-1.5 leading-snug">
              PENDING
            </div>
            <div class="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight leading-tight text-center"
                 style="color: #DC2626;">
              ${totals.documentsRemaining.toLocaleString()}
            </div>
          </div>

        </div>

        <!-- ========================================================================= -->
        <!-- 3. FILTERS DIRECTLY BELOW KPIS (RESPONSIBLE UNIT, PLANNED, ACTUAL)        -->
        <!-- Mobile view: Side by side (grid-cols-2) to save vertical space           -->
        <!-- ========================================================================= -->
        <div class="bg-white rounded-2xl p-3.5 sm:p-4 shadow-sm relative overflow-hidden"
             style="border: 2px solid #6366F1; box-shadow: 0 0 0 1px #6366F1, 0 3px 10px rgba(99, 102, 241, 0.08);">
          
          <!-- No heading on filter banner as instructed -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 items-center">
            
            <!-- Filter 1: Column B named Responsible_Unit -->
            <div class="space-y-1">
              <label for="psi-unit-select" class="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-600 block truncate">
                Responsible Unit:
              </label>
              <div class="relative">
                <select
                  id="psi-unit-select"
                  onchange="FPCL_PSI_SUITE.setResponsibleUnitFilter(this.value)"
                  class="w-full pl-3 pr-8 py-2 bg-white hover:bg-slate-50 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-xs sm:text-sm font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer outline-none appearance-none truncate"
                  title="Filter dashboard by Responsible Unit (Column B)"
                >
                  <option value="all" ${this.state.responsibleUnitFilter === 'all' ? 'selected' : ''}>All Units (${raw.length})</option>
                  ${allUnits.map(u => `
                    <option value="${u}" ${this.state.responsibleUnitFilter.toLowerCase() === u.toLowerCase() ? 'selected' : ''}>${u}</option>
                  `).join('')}
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
                  <i data-lucide="chevron-down" class="w-4 h-4"></i>
                </div>
              </div>
            </div>

            <!-- Filter 2: Planned filter (Column L to T) -->
            <div class="space-y-1">
              <label for="psi-planned-select" class="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-blue-700 block truncate">
                Planned:
              </label>
              <div class="relative">
                <select
                  id="psi-planned-select"
                  onchange="FPCL_PSI_SUITE.setPlannedFilter(this.value)"
                  class="w-full pl-3 pr-8 py-2 bg-blue-50/40 hover:bg-blue-50 focus:bg-white border border-blue-300 focus:border-blue-600 rounded-xl text-xs sm:text-sm font-bold text-blue-950 shadow-2xs focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer outline-none appearance-none truncate"
                  title="Filter by Planned Columns (Column L to T)"
                >
                  <option value="all" ${this.state.plannedFilter === 'all' ? 'selected' : ''}>All Planned (Column L to T)</option>
                  <option value="plannedSteamGen" ${this.state.plannedFilter === 'plannedSteamGen' ? 'selected' : ''}>Planned Steam Generation (Col L)</option>
                  <option value="plannedPowerGen" ${this.state.plannedFilter === 'plannedPowerGen' ? 'selected' : ''}>Planned Power Generation (Col M)</option>
                  <option value="plannedCoalSorbent" ${this.state.plannedFilter === 'plannedCoalSorbent' ? 'selected' : ''}>Planned Coal &amp; Sorbent (Col N)</option>
                  <option value="plannedBalanceOfPlant" ${this.state.plannedFilter === 'plannedBalanceOfPlant' ? 'selected' : ''}>Planned Balance of Plant (Col O)</option>
                  <option value="plannedGrid" ${this.state.plannedFilter === 'plannedGrid' ? 'selected' : ''}>Planned Grid (Col P)</option>
                  <option value="plannedNonOperating" ${this.state.plannedFilter === 'plannedNonOperating' ? 'selected' : ''}>Planned Non-Operating (Col Q)</option>
                  <option value="plannedHseq" ${this.state.plannedFilter === 'plannedHseq' ? 'selected' : ''}>Planned HSEQ (Col R)</option>
                  <option value="plannedPlantGeneral" ${this.state.plannedFilter === 'plannedPlantGeneral' ? 'selected' : ''}>Planned Plant General (Col S)</option>
                  <option value="totalPlanned" ${this.state.plannedFilter === 'totalPlanned' ? 'selected' : ''}>Total Planned (Col T)</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-blue-500">
                  <i data-lucide="chevron-down" class="w-4 h-4"></i>
                </div>
              </div>
            </div>

            <!-- Filter 3: Actual filter (Column C to K) -->
            <div class="space-y-1">
              <label for="psi-actual-select" class="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-emerald-700 block truncate">
                Actual:
              </label>
              <div class="relative">
                <select
                  id="psi-actual-select"
                  onchange="FPCL_PSI_SUITE.setActualFilter(this.value)"
                  class="w-full pl-3 pr-8 py-2 bg-emerald-50/40 hover:bg-emerald-50 focus:bg-white border border-emerald-300 focus:border-emerald-600 rounded-xl text-xs sm:text-sm font-bold text-emerald-950 shadow-2xs focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer outline-none appearance-none truncate"
                  title="Filter by Actual Columns (Column C to K)"
                >
                  <option value="all" ${this.state.actualFilter === 'all' ? 'selected' : ''}>All Actual (Column C to K)</option>
                  <option value="actualSteamGen" ${this.state.actualFilter === 'actualSteamGen' ? 'selected' : ''}>Actual Steam Generation (Col C)</option>
                  <option value="actualPowerGen" ${this.state.actualFilter === 'actualPowerGen' ? 'selected' : ''}>Actual Power Generation (Col D)</option>
                  <option value="actualCoalSorbent" ${this.state.actualFilter === 'actualCoalSorbent' ? 'selected' : ''}>Actual Coal &amp; Sorbent (Col E)</option>
                  <option value="actualBalanceOfPlant" ${this.state.actualFilter === 'actualBalanceOfPlant' ? 'selected' : ''}>Actual Balance of Plant (Col F)</option>
                  <option value="actualGrid" ${this.state.actualFilter === 'actualGrid' ? 'selected' : ''}>Actual Grid (Col G)</option>
                  <option value="actualNonOperating" ${this.state.actualFilter === 'actualNonOperating' ? 'selected' : ''}>Actual Non-Operating (Col H)</option>
                  <option value="actualHseq" ${this.state.actualFilter === 'actualHseq' ? 'selected' : ''}>Actual HSEQ (Col I)</option>
                  <option value="actualPlantGeneral" ${this.state.actualFilter === 'actualPlantGeneral' ? 'selected' : ''}>Actual Plant General (Col J)</option>
                  <option value="totalUpload" ${this.state.actualFilter === 'totalUpload' ? 'selected' : ''}>Total Upload (Col K)</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-emerald-500">
                  <i data-lucide="chevron-down" class="w-4 h-4"></i>
                </div>
              </div>
            </div>

            <!-- Quick Filter Status Info Chip & Clear Button -->
            <div class="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0">
              <span class="text-xs font-mono font-bold text-slate-600 truncate">
                Showing <strong class="text-indigo-700 font-black">${filtered.length}</strong> Units
              </span>
              ${(this.state.responsibleUnitFilter !== 'all' || this.state.plannedFilter !== 'all' || this.state.actualFilter !== 'all' || this.state.searchQuery) ? `
                <button
                  type="button"
                  onclick="FPCL_PSI_SUITE.resetFilters()"
                  class="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                  title="Reset all filters"
                >
                  <i data-lucide="x" class="w-3 h-3"></i> Clear
                </button>
              ` : ''}
            </div>

          </div>

        </div>

        <!-- ========================================================================= -->
        <!-- 4. HORIZONTAL STACK COLUMN CHART (SOLID COLORS, 12 FONT, TOOLTIPS, CHIPS) -->
        <!-- ========================================================================= -->
        <div class="bg-white rounded-2xl p-4 sm:p-6 shadow-sm relative overflow-hidden"
             style="border: 2.5px solid #0284C7; box-shadow: 0 0 0 1px #0284C7, 0 4px 16px rgba(2, 132, 199, 0.08);">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <h3 class="text-sm sm:text-base font-black text-[#1E293B] tracking-wide flex items-center gap-2 m-0 p-0">
                <span>📊</span> Process Safety Information ${((this.state.plannedFilter && this.state.plannedFilter !== 'all' && this.state.plannedFilter !== 'totalPlanned') || (this.state.actualFilter && this.state.actualFilter !== 'all' && this.state.actualFilter !== 'totalUpload')) ? `— ${totals.activePlannedLabel || totals.activeActualLabel} By Responsible Unit` : 'By Technical Area'}
              </h3>
            </div>

            <!-- Legend Chips with light tinted backgrounds matching each solid color -->
            <div class="flex flex-wrap items-center gap-2 text-xs font-bold select-none">
              <!-- Total Planned Chip (Blue) -->
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold"
                    style="background-color: #DBEAFE; border-color: #BFDBFE; color: #1E3A8A;">
                <span class="w-2.5 h-2.5 rounded-xs" style="background-color: #1D4ED8;"></span>
                <span>Total Planned</span>
              </span>
              <!-- Actual Uploaded Chip (Green) -->
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold"
                    style="background-color: #E6F4EA; border-color: #BBF7D0; color: #0B8A5A;">
                <span class="w-2.5 h-2.5 rounded-xs" style="background-color: #0B8A5A;"></span>
                <span>Actual Uploaded</span>
              </span>
              <!-- Pending Chip (Red) -->
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold"
                    style="background-color: #FEE2E2; border-color: #FECACA; color: #DC2626;">
                <span class="w-2.5 h-2.5 rounded-xs" style="background-color: #DC2626;"></span>
                <span>Pending</span>
              </span>
            </div>
          </div>

          <!-- Stacked Column Chart SVG Container -->
          <div class="pt-4 overflow-x-auto">
            ${this.renderStackedColumnChartSvg(totals, filtered)}
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 5. DONUT CHART (LARGER & THICKER, TEXT FITS COMFORTABLY IN ALL SCREENS)    -->
        <!-- Legends at bottom, text inside donut in laptop and mobile fits comfortably -->
        <!-- ========================================================================= -->
        <div class="bg-white rounded-2xl p-5 sm:p-7 shadow-sm relative overflow-hidden flex flex-col items-center justify-center"
             style="border: 2.5px solid #7C3AED; box-shadow: 0 0 0 1px #7C3AED, 0 4px 16px rgba(124, 58, 237, 0.08);">
          
          <h3 class="text-base sm:text-lg font-black text-[#1E293B] tracking-wide mb-3 flex items-center gap-2 text-center">
            <span>⭕</span> PSI Overall Document Completion Status
          </h3>

          <!-- Donut Graphic Container (Enlarged and centered with high clearance) -->
          <div class="w-full max-w-[340px] sm:max-w-[420px] flex items-center justify-center my-3">
            ${this.renderDonutChartSvg(totals)}
          </div>

          <!-- Legends at bottom: Blue = Total Planned, Green = Actual Uploaded, Red = Pending -->
          <div class="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-3 pt-4 border-t border-slate-100 w-full text-xs sm:text-sm font-bold select-none">
            <!-- Blue = Total Planned -->
            <div class="flex items-center gap-2">
              <span class="w-3.5 h-3.5 rounded-full" style="background-color: #1D4ED8;"></span>
              <span class="text-slate-700">Total Planned:</span>
              <span class="font-mono font-black" style="color: #1D4ED8;">${totals.filteredPlanned.toLocaleString()} Docs</span>
            </div>
            <!-- Green = Actual Uploaded -->
            <div class="flex items-center gap-2">
              <span class="w-3.5 h-3.5 rounded-full" style="background-color: #0B8A5A;"></span>
              <span class="text-slate-700">Actual Uploaded:</span>
              <span class="font-mono font-black" style="color: #0B8A5A;">${totals.filteredActual.toLocaleString()} (${totals.overallPercent.toFixed(1)}%)</span>
            </div>
            <!-- Red = Pending -->
            <div class="flex items-center gap-2">
              <span class="w-3.5 h-3.5 rounded-full" style="background-color: #DC2626;"></span>
              <span class="text-slate-700">Pending:</span>
              <span class="font-mono font-black" style="color: #DC2626;">${totals.documentsRemaining.toLocaleString()} (${(totals.filteredPlanned > 0 ? (totals.documentsRemaining / totals.filteredPlanned * 100) : 0).toFixed(1)}%)</span>
            </div>
          </div>

        </div>

        <!-- ========================================================================= -->
        <!-- 6. COMPLETE SCROLLABLE EXCEL SHEET IN FORM OF TABLE                       -->
        <!-- Scrollable up/down and left/right. Buttons for left/right scrolling sheet -->
        <!-- ========================================================================= -->
        <div class="bg-white rounded-2xl p-4 sm:p-6 shadow-sm relative overflow-hidden space-y-3"
             style="border: 2.5px solid #0D9488; box-shadow: 0 0 0 1px #0D9488, 0 4px 16px rgba(13, 148, 136, 0.08);">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
            <div>
              <h3 class="text-sm sm:text-base font-black text-[#1E293B] tracking-wide flex items-center gap-2 m-0 p-0">
                <span>📋</span> Complete PSI Master Data Spreadsheet
              </h3>
              <p class="text-xs text-slate-500 font-medium mt-0.5">
                Full synchronized tabular view from Google Sheet ID <code class="font-mono text-teal-700 font-bold">1vWYE3G4W7TxHBVzsUJuu1Z-aufjXD-xFeodTpFUTZtY</code> (Tab: PSI)
              </p>
            </div>

            <!-- Left and Right Scroll Navigation Buttons -->
            <div class="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onclick="FPCL_PSI_SUITE.scrollTable('left')"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-all cursor-pointer select-none shadow-2xs active:scale-95"
                title="Scroll sheet left"
              >
                <i data-lucide="chevron-left" class="w-4 h-4"></i>
                <span>Scroll Left</span>
              </button>
              <button
                type="button"
                onclick="FPCL_PSI_SUITE.scrollTable('right')"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-all cursor-pointer select-none shadow-2xs active:scale-95"
                title="Scroll sheet right"
              >
                <span>Scroll Right</span>
                <i data-lucide="chevron-right" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <!-- Table Container: Scrollable up-down and left-right -->
          <div id="psi-table-scroll-container" class="overflow-x-auto max-h-[520px] overflow-y-auto border border-slate-200 rounded-xl">
            <table class="w-full border-collapse text-left text-xs font-sans min-w-[1400px]">
              <thead class="sticky top-0 z-20 bg-slate-100 border-b border-slate-300 text-slate-700 select-none shadow-xs">
                <tr>
                  <th class="py-2.5 px-3 font-extrabold uppercase tracking-wider text-center sticky left-0 z-30 bg-slate-100 border-r border-slate-200 w-14">ID</th>
                  <th class="py-2.5 px-3 font-extrabold uppercase tracking-wider text-left sticky left-14 z-30 bg-slate-100 border-r border-slate-200 min-w-[160px]">Responsible Unit</th>
                  
                  <!-- Actual Columns (Column Heading C to K) -->
                  <th class="py-2 px-2.5 font-bold uppercase tracking-wider text-right bg-emerald-50/60 text-emerald-900 border-r border-slate-200 ${this.getActiveActualColumnKey() === 'actualSteamGen' ? 'ring-2 ring-inset ring-emerald-600 bg-emerald-100' : ''}">
                    Act. Steam
                    ${this.getActiveActualColumnKey() === 'actualSteamGen' ? '<span class="block text-[8px] text-emerald-700 font-extrabold">● ACTIVE</span>' : ''}
                  </th>
                  <th class="py-2 px-2.5 font-bold uppercase tracking-wider text-right bg-emerald-50/60 text-emerald-900 border-r border-slate-200 ${this.getActiveActualColumnKey() === 'actualPowerGen' ? 'ring-2 ring-inset ring-emerald-600 bg-emerald-100' : ''}">
                    Act. Power
                    ${this.getActiveActualColumnKey() === 'actualPowerGen' ? '<span class="block text-[8px] text-emerald-700 font-extrabold">● ACTIVE</span>' : ''}
                  </th>
                  <th class="py-2 px-2.5 font-bold uppercase tracking-wider text-right bg-emerald-50/60 text-emerald-900 border-r border-slate-200 ${this.getActiveActualColumnKey() === 'actualCoalSorbent' ? 'ring-2 ring-inset ring-emerald-600 bg-emerald-100' : ''}">
                    Act. Coal/Sorbent
                    ${this.getActiveActualColumnKey() === 'actualCoalSorbent' ? '<span class="block text-[8px] text-emerald-700 font-extrabold">● ACTIVE</span>' : ''}
                  </th>
                  <th class="py-2 px-2.5 font-bold uppercase tracking-wider text-right bg-emerald-50/60 text-emerald-900 border-r border-slate-200 ${this.getActiveActualColumnKey() === 'actualBalanceOfPlant' ? 'ring-2 ring-inset ring-emerald-600 bg-emerald-100' : ''}">
                    Act. BOP
                    ${this.getActiveActualColumnKey() === 'actualBalanceOfPlant' ? '<span class="block text-[8px] text-emerald-700 font-extrabold">● ACTIVE</span>' : ''}
                  </th>
                  <th class="py-2 px-2.5 font-bold uppercase tracking-wider text-right bg-emerald-50/60 text-emerald-900 border-r border-slate-200 ${this.getActiveActualColumnKey() === 'actualGrid' ? 'ring-2 ring-inset ring-emerald-600 bg-emerald-100' : ''}">
                    Act. Grid
                    ${this.getActiveActualColumnKey() === 'actualGrid' ? '<span class="block text-[8px] text-emerald-700 font-extrabold">● ACTIVE</span>' : ''}
                  </th>
                  <th class="py-2 px-2.5 font-bold uppercase tracking-wider text-right bg-emerald-50/60 text-emerald-900 border-r border-slate-200 ${this.getActiveActualColumnKey() === 'actualNonOperating' ? 'ring-2 ring-inset ring-emerald-600 bg-emerald-100' : ''}">
                    Act. Non-Op
                    ${this.getActiveActualColumnKey() === 'actualNonOperating' ? '<span class="block text-[8px] text-emerald-700 font-extrabold">● ACTIVE</span>' : ''}
                  </th>
                  <th class="py-2 px-2.5 font-bold uppercase tracking-wider text-right bg-emerald-50/60 text-emerald-900 border-r border-slate-200 ${this.getActiveActualColumnKey() === 'actualHseq' ? 'ring-2 ring-inset ring-emerald-600 bg-emerald-100' : ''}">
                    Act. HSEQ
                    ${this.getActiveActualColumnKey() === 'actualHseq' ? '<span class="block text-[8px] text-emerald-700 font-extrabold">● ACTIVE</span>' : ''}
                  </th>
                  <th class="py-2 px-2.5 font-bold uppercase tracking-wider text-right bg-emerald-50/60 text-emerald-900 border-r border-slate-200 ${this.getActiveActualColumnKey() === 'actualPlantGeneral' ? 'ring-2 ring-inset ring-emerald-600 bg-emerald-100' : ''}">
                    Act. Plant Gen.
                    ${this.getActiveActualColumnKey() === 'actualPlantGeneral' ? '<span class="block text-[8px] text-emerald-700 font-extrabold">● ACTIVE</span>' : ''}
                  </th>
                  <!-- Col K: Actual Uploaded -->
                  <th class="py-2.5 px-3 font-black uppercase tracking-wider text-right bg-emerald-100/70 text-emerald-900 border-r-2 border-slate-300 ${this.getActiveActualColumnKey() === 'totalUpload' ? 'ring-2 ring-inset ring-emerald-600' : ''}">
                    Actual Uploaded
                  </th>

                  <!-- Planned Columns (Column Heading L to T) -->
                  <th class="py-2 px-2.5 font-bold uppercase tracking-wider text-right bg-blue-50/60 text-blue-900 border-r border-slate-200 ${this.getActivePlannedColumnKey() === 'plannedSteamGen' ? 'ring-2 ring-inset ring-blue-600 bg-blue-100' : ''}">
                    Plan Steam
                    ${this.getActivePlannedColumnKey() === 'plannedSteamGen' ? '<span class="block text-[8px] text-blue-700 font-extrabold">● ACTIVE</span>' : ''}
                  </th>
                  <th class="py-2 px-2.5 font-bold uppercase tracking-wider text-right bg-blue-50/60 text-blue-900 border-r border-slate-200 ${this.getActivePlannedColumnKey() === 'plannedPowerGen' ? 'ring-2 ring-inset ring-blue-600 bg-blue-100' : ''}">
                    Plan Power
                    ${this.getActivePlannedColumnKey() === 'plannedPowerGen' ? '<span class="block text-[8px] text-blue-700 font-extrabold">● ACTIVE</span>' : ''}
                  </th>
                  <th class="py-2 px-2.5 font-bold uppercase tracking-wider text-right bg-blue-50/60 text-blue-900 border-r border-slate-200 ${this.getActivePlannedColumnKey() === 'plannedCoalSorbent' ? 'ring-2 ring-inset ring-blue-600 bg-blue-100' : ''}">
                    Plan Coal/Sorbent
                    ${this.getActivePlannedColumnKey() === 'plannedCoalSorbent' ? '<span class="block text-[8px] text-blue-700 font-extrabold">● ACTIVE</span>' : ''}
                  </th>
                  <th class="py-2 px-2.5 font-bold uppercase tracking-wider text-right bg-blue-50/60 text-blue-900 border-r border-slate-200 ${this.getActivePlannedColumnKey() === 'plannedBalanceOfPlant' ? 'ring-2 ring-inset ring-blue-600 bg-blue-100' : ''}">
                    Plan BOP
                    ${this.getActivePlannedColumnKey() === 'plannedBalanceOfPlant' ? '<span class="block text-[8px] text-blue-700 font-extrabold">● ACTIVE</span>' : ''}
                  </th>
                  <th class="py-2 px-2.5 font-bold uppercase tracking-wider text-right bg-blue-50/60 text-blue-900 border-r border-slate-200 ${this.getActivePlannedColumnKey() === 'plannedGrid' ? 'ring-2 ring-inset ring-blue-600 bg-blue-100' : ''}">
                    Plan Grid
                    ${this.getActivePlannedColumnKey() === 'plannedGrid' ? '<span class="block text-[8px] text-blue-700 font-extrabold">● ACTIVE</span>' : ''}
                  </th>
                  <th class="py-2 px-2.5 font-bold uppercase tracking-wider text-right bg-blue-50/60 text-blue-900 border-r border-slate-200 ${this.getActivePlannedColumnKey() === 'plannedNonOperating' ? 'ring-2 ring-inset ring-blue-600 bg-blue-100' : ''}">
                    Plan Non-Op
                    ${this.getActivePlannedColumnKey() === 'plannedNonOperating' ? '<span class="block text-[8px] text-blue-700 font-extrabold">● ACTIVE</span>' : ''}
                  </th>
                  <th class="py-2 px-2.5 font-bold uppercase tracking-wider text-right bg-blue-50/60 text-blue-900 border-r border-slate-200 ${this.getActivePlannedColumnKey() === 'plannedHseq' ? 'ring-2 ring-inset ring-blue-600 bg-blue-100' : ''}">
                    Plan HSEQ
                    ${this.getActivePlannedColumnKey() === 'plannedHseq' ? '<span class="block text-[8px] text-blue-700 font-extrabold">● ACTIVE</span>' : ''}
                  </th>
                  <th class="py-2 px-2.5 font-bold uppercase tracking-wider text-right bg-blue-50/60 text-blue-900 border-r border-slate-200 ${this.getActivePlannedColumnKey() === 'plannedPlantGeneral' ? 'ring-2 ring-inset ring-blue-600 bg-blue-100' : ''}">
                    Plan Plant Gen.
                    ${this.getActivePlannedColumnKey() === 'plannedPlantGeneral' ? '<span class="block text-[8px] text-blue-700 font-extrabold">● ACTIVE</span>' : ''}
                  </th>
                  <!-- Col T: Total Planned -->
                  <th class="py-2.5 px-3 font-black uppercase tracking-wider text-right bg-blue-100/70 text-blue-900 border-r-2 border-slate-300 ${this.getActivePlannedColumnKey() === 'totalPlanned' ? 'ring-2 ring-inset ring-blue-600' : ''}">
                    Total Planned
                  </th>

                  <!-- Metrics: Red = Pending, Purple = Complete % -->
                  <th class="py-2.5 px-3 font-black uppercase tracking-wider text-right bg-rose-50 text-rose-900 border-r border-slate-200 min-w-[110px]">
                    Pending
                  </th>
                  <th class="py-2.5 px-3 font-black uppercase tracking-wider text-right bg-purple-50 text-purple-900 min-w-[100px]">
                    Complete %
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                ${filtered.map((item, idx) => {
                  const isEven = idx % 2 === 0;
                  const activePlanKey = this.getActivePlannedColumnKey();
                  const activeActKey = this.getActiveActualColumnKey();

                  const rowPlanned = (activePlanKey && item[activePlanKey] !== undefined)
                    ? (Number(item[activePlanKey]) || 0)
                    : (Number(item.totalPlanned) || 0);

                  const rowActual = (activeActKey && item[activeActKey] !== undefined)
                    ? (Number(item[activeActKey]) || 0)
                    : (Number(item.totalUpload) || 0);

                  const remaining = Math.max(0, rowPlanned - rowActual);
                  const isFull = remaining === 0 && rowPlanned > 0;
                  const rowPct = rowPlanned > 0 ? (rowActual / rowPlanned) * 100 : 0;

                  return `
                    <tr class="hover:bg-slate-50 transition-colors ${isEven ? 'bg-white' : 'bg-slate-50/40'}">
                      <td class="py-2 px-3 font-mono font-bold text-center text-slate-500 sticky left-0 z-10 ${isEven ? 'bg-white' : 'bg-slate-50'} border-r border-slate-200">${item.id}</td>
                      <td class="py-2 px-3 font-bold text-slate-800 sticky left-14 z-10 ${isEven ? 'bg-white' : 'bg-slate-50'} border-r border-slate-200 whitespace-nowrap">${item.responsibleUnit}</td>
                      
                      <!-- Actual Cells -->
                      <td class="py-2 px-2.5 font-mono text-right text-slate-700 border-r border-slate-200 ${activeActKey === 'actualSteamGen' ? 'bg-emerald-100/80 font-black text-emerald-950 ring-1 ring-inset ring-emerald-500' : ''}">${item.actualSteamGen.toLocaleString()}</td>
                      <td class="py-2 px-2.5 font-mono text-right text-slate-700 border-r border-slate-200 ${activeActKey === 'actualPowerGen' ? 'bg-emerald-100/80 font-black text-emerald-950 ring-1 ring-inset ring-emerald-500' : ''}">${item.actualPowerGen.toLocaleString()}</td>
                      <td class="py-2 px-2.5 font-mono text-right text-slate-700 border-r border-slate-200 ${activeActKey === 'actualCoalSorbent' ? 'bg-emerald-100/80 font-black text-emerald-950 ring-1 ring-inset ring-emerald-500' : ''}">${item.actualCoalSorbent.toLocaleString()}</td>
                      <td class="py-2 px-2.5 font-mono text-right text-slate-700 border-r border-slate-200 ${activeActKey === 'actualBalanceOfPlant' ? 'bg-emerald-100/80 font-black text-emerald-950 ring-1 ring-inset ring-emerald-500' : ''}">${item.actualBalanceOfPlant.toLocaleString()}</td>
                      <td class="py-2 px-2.5 font-mono text-right text-slate-700 border-r border-slate-200 ${activeActKey === 'actualGrid' ? 'bg-emerald-100/80 font-black text-emerald-950 ring-1 ring-inset ring-emerald-500' : ''}">${item.actualGrid.toLocaleString()}</td>
                      <td class="py-2 px-2.5 font-mono text-right text-slate-700 border-r border-slate-200 ${activeActKey === 'actualNonOperating' ? 'bg-emerald-100/80 font-black text-emerald-950 ring-1 ring-inset ring-emerald-500' : ''}">${item.actualNonOperating.toLocaleString()}</td>
                      <td class="py-2 px-2.5 font-mono text-right text-slate-700 border-r border-slate-200 ${activeActKey === 'actualHseq' ? 'bg-emerald-100/80 font-black text-emerald-950 ring-1 ring-inset ring-emerald-500' : ''}">${item.actualHseq.toLocaleString()}</td>
                      <td class="py-2 px-2.5 font-mono text-right text-slate-700 border-r border-slate-200 ${activeActKey === 'actualPlantGeneral' ? 'bg-emerald-100/80 font-black text-emerald-950 ring-1 ring-inset ring-emerald-500' : ''}">${item.actualPlantGeneral.toLocaleString()}</td>
                      <td class="py-2 px-3 font-mono font-black text-right border-r-2 border-slate-300 ${activeActKey === 'totalUpload' ? 'ring-2 ring-inset ring-emerald-600' : ''}" style="color: #0B8A5A; background-color: #F0FDF4;">${item.totalUpload.toLocaleString()}</td>

                      <!-- Planned Cells -->
                      <td class="py-2 px-2.5 font-mono text-right text-slate-700 border-r border-slate-200 ${activePlanKey === 'plannedSteamGen' ? 'bg-blue-100/80 font-black text-blue-950 ring-1 ring-inset ring-blue-500' : ''}">${item.plannedSteamGen.toLocaleString()}</td>
                      <td class="py-2 px-2.5 font-mono text-right text-slate-700 border-r border-slate-200 ${activePlanKey === 'plannedPowerGen' ? 'bg-blue-100/80 font-black text-blue-950 ring-1 ring-inset ring-blue-500' : ''}">${item.plannedPowerGen.toLocaleString()}</td>
                      <td class="py-2 px-2.5 font-mono text-right text-slate-700 border-r border-slate-200 ${activePlanKey === 'plannedCoalSorbent' ? 'bg-blue-100/80 font-black text-blue-950 ring-1 ring-inset ring-blue-500' : ''}">${item.plannedCoalSorbent.toLocaleString()}</td>
                      <td class="py-2 px-2.5 font-mono text-right text-slate-700 border-r border-slate-200 ${activePlanKey === 'plannedBalanceOfPlant' ? 'bg-blue-100/80 font-black text-blue-950 ring-1 ring-inset ring-blue-500' : ''}">${item.plannedBalanceOfPlant.toLocaleString()}</td>
                      <td class="py-2 px-2.5 font-mono text-right text-slate-700 border-r border-slate-200 ${activePlanKey === 'plannedGrid' ? 'bg-blue-100/80 font-black text-blue-950 ring-1 ring-inset ring-blue-500' : ''}">${item.plannedGrid.toLocaleString()}</td>
                      <td class="py-2 px-2.5 font-mono text-right text-slate-700 border-r border-slate-200 ${activePlanKey === 'plannedNonOperating' ? 'bg-blue-100/80 font-black text-blue-950 ring-1 ring-inset ring-blue-500' : ''}">${item.plannedNonOperating.toLocaleString()}</td>
                      <td class="py-2 px-2.5 font-mono text-right text-slate-700 border-r border-slate-200 ${activePlanKey === 'plannedHseq' ? 'bg-blue-100/80 font-black text-blue-950 ring-1 ring-inset ring-blue-500' : ''}">${item.plannedHseq.toLocaleString()}</td>
                      <td class="py-2 px-2.5 font-mono text-right text-slate-700 border-r border-slate-200 ${activePlanKey === 'plannedPlantGeneral' ? 'bg-blue-100/80 font-black text-blue-950 ring-1 ring-inset ring-blue-500' : ''}">${item.plannedPlantGeneral.toLocaleString()}</td>
                      <td class="py-2 px-3 font-mono font-black text-right border-r-2 border-slate-300 ${activePlanKey === 'totalPlanned' ? 'ring-2 ring-inset ring-blue-600' : ''}" style="color: #1D4ED8; background-color: #EFF6FF;">${item.totalPlanned.toLocaleString()}</td>

                      <!-- Metrics: Red = Pending, Purple = Complete % -->
                      <td class="py-2 px-3 font-mono font-black text-right border-r border-slate-200 ${remaining > 0 ? 'text-red-600 bg-red-50/50' : 'text-slate-400 bg-slate-50/30'}">
                        ${remaining > 0 ? remaining.toLocaleString() : '<span class="text-emerald-600">0</span>'}
                      </td>
                      <td class="py-2 px-3 font-mono font-black text-right ${isFull ? 'text-emerald-700 bg-emerald-50/60' : 'text-purple-700 bg-purple-50/40'}">
                        ${rowPct.toFixed(1)}%
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <!-- Sticky Summary Total Footer Row -->
              <tfoot class="sticky bottom-0 z-20 bg-slate-200 border-t-2 border-slate-400 font-mono font-black text-slate-900 shadow-md">
                <tr>
                  <td class="py-2.5 px-3 text-center sticky left-0 z-30 bg-slate-200 border-r border-slate-300">∑</td>
                  <td class="py-2.5 px-3 text-left sticky left-14 z-30 bg-slate-200 border-r border-slate-300 whitespace-nowrap uppercase tracking-wider">
                    Total (${filtered.length} Units)
                  </td>
                  
                  <td class="py-2.5 px-2.5 text-right border-r border-slate-300 ${this.getActiveActualColumnKey() === 'actualSteamGen' ? 'bg-emerald-300 ring-2 ring-emerald-600 font-black text-emerald-950' : ''}">${totals.actualSteamGen.toLocaleString()}</td>
                  <td class="py-2.5 px-2.5 text-right border-r border-slate-300 ${this.getActiveActualColumnKey() === 'actualPowerGen' ? 'bg-emerald-300 ring-2 ring-emerald-600 font-black text-emerald-950' : ''}">${totals.actualPowerGen.toLocaleString()}</td>
                  <td class="py-2.5 px-2.5 text-right border-r border-slate-300 ${this.getActiveActualColumnKey() === 'actualCoalSorbent' ? 'bg-emerald-300 ring-2 ring-emerald-600 font-black text-emerald-950' : ''}">${totals.actualCoalSorbent.toLocaleString()}</td>
                  <td class="py-2.5 px-2.5 text-right border-r border-slate-300 ${this.getActiveActualColumnKey() === 'actualBalanceOfPlant' ? 'bg-emerald-300 ring-2 ring-emerald-600 font-black text-emerald-950' : ''}">${totals.actualBalanceOfPlant.toLocaleString()}</td>
                  <td class="py-2.5 px-2.5 text-right border-r border-slate-300 ${this.getActiveActualColumnKey() === 'actualGrid' ? 'bg-emerald-300 ring-2 ring-emerald-600 font-black text-emerald-950' : ''}">${totals.actualGrid.toLocaleString()}</td>
                  <td class="py-2.5 px-2.5 text-right border-r border-slate-300 ${this.getActiveActualColumnKey() === 'actualNonOperating' ? 'bg-emerald-300 ring-2 ring-emerald-600 font-black text-emerald-950' : ''}">${totals.actualNonOperating.toLocaleString()}</td>
                  <td class="py-2.5 px-2.5 text-right border-r border-slate-300 ${this.getActiveActualColumnKey() === 'actualHseq' ? 'bg-emerald-300 ring-2 ring-emerald-600 font-black text-emerald-950' : ''}">${totals.actualHseq.toLocaleString()}</td>
                  <td class="py-2.5 px-2.5 text-right border-r border-slate-300 ${this.getActiveActualColumnKey() === 'actualPlantGeneral' ? 'bg-emerald-300 ring-2 ring-emerald-600 font-black text-emerald-950' : ''}">${totals.actualPlantGeneral.toLocaleString()}</td>
                  <td class="py-2.5 px-3 text-right border-r-2 border-slate-400 text-emerald-800 ${this.getActiveActualColumnKey() === 'totalUpload' ? 'bg-emerald-300 ring-2 ring-emerald-600 font-black' : 'bg-emerald-200/70'}">${totals.totalUpload.toLocaleString()}</td>

                  <td class="py-2.5 px-2.5 text-right border-r border-slate-300 ${this.getActivePlannedColumnKey() === 'plannedSteamGen' ? 'bg-blue-300 ring-2 ring-blue-600 font-black text-blue-950' : ''}">${totals.plannedSteamGen.toLocaleString()}</td>
                  <td class="py-2.5 px-2.5 text-right border-r border-slate-300 ${this.getActivePlannedColumnKey() === 'plannedPowerGen' ? 'bg-blue-300 ring-2 ring-blue-600 font-black text-blue-950' : ''}">${totals.plannedPowerGen.toLocaleString()}</td>
                  <td class="py-2.5 px-2.5 text-right border-r border-slate-300 ${this.getActivePlannedColumnKey() === 'plannedCoalSorbent' ? 'bg-blue-300 ring-2 ring-blue-600 font-black text-blue-950' : ''}">${totals.plannedCoalSorbent.toLocaleString()}</td>
                  <td class="py-2.5 px-2.5 text-right border-r border-slate-300 ${this.getActivePlannedColumnKey() === 'plannedBalanceOfPlant' ? 'bg-blue-300 ring-2 ring-blue-600 font-black text-blue-950' : ''}">${totals.plannedBalanceOfPlant.toLocaleString()}</td>
                  <td class="py-2.5 px-2.5 text-right border-r border-slate-300 ${this.getActivePlannedColumnKey() === 'plannedGrid' ? 'bg-blue-300 ring-2 ring-blue-600 font-black text-blue-950' : ''}">${totals.plannedGrid.toLocaleString()}</td>
                  <td class="py-2.5 px-2.5 text-right border-r border-slate-300 ${this.getActivePlannedColumnKey() === 'plannedNonOperating' ? 'bg-blue-300 ring-2 ring-blue-600 font-black text-blue-950' : ''}">${totals.plannedNonOperating.toLocaleString()}</td>
                  <td class="py-2.5 px-2.5 text-right border-r border-slate-300 ${this.getActivePlannedColumnKey() === 'plannedHseq' ? 'bg-blue-300 ring-2 ring-blue-600 font-black text-blue-950' : ''}">${totals.plannedHseq.toLocaleString()}</td>
                  <td class="py-2.5 px-2.5 text-right border-r border-slate-300 ${this.getActivePlannedColumnKey() === 'plannedPlantGeneral' ? 'bg-blue-300 ring-2 ring-blue-600 font-black text-blue-950' : ''}">${totals.plannedPlantGeneral.toLocaleString()}</td>
                  <td class="py-2.5 px-3 text-right border-r-2 border-slate-400 text-blue-900 ${this.getActivePlannedColumnKey() === 'totalPlanned' ? 'bg-blue-300 ring-2 ring-blue-600 font-black' : 'bg-blue-200/70'}">${totals.totalPlanned.toLocaleString()}</td>

                  <!-- Footer Metrics: Red = Pending, Purple = Complete % -->
                  <td class="py-2.5 px-3 text-right border-r border-slate-300 text-red-700 bg-red-100 font-black">${totals.documentsRemaining.toLocaleString()}</td>
                  <td class="py-2.5 px-3 text-right text-purple-900 bg-purple-100 font-black">${totals.overallPercent.toFixed(1)}%</td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>

        <!-- ========================================================================= -->
        <!-- 7. SETTINGS & GOOGLE SHEET CONNECTION MODAL                               -->
        <!-- ========================================================================= -->
        <div id="psi-settings-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs hidden items-center justify-center p-4">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <i data-lucide="sheet" class="w-5 h-5 text-indigo-600"></i>
                <h4 class="text-base font-black text-slate-900 m-0">PSI Google Sheet Integration</h4>
              </div>
              <button onclick="FPCL_PSI_SUITE.toggleSettingsModal()" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
            
            <div class="space-y-3 text-xs text-slate-600 font-sans">
              <div class="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                <div class="flex justify-between items-center py-1 border-b border-slate-200/70">
                  <span class="font-bold text-slate-500">Google Sheet ID:</span>
                  <span class="font-mono font-bold text-slate-900 selection:bg-indigo-100 select-all">${PSI_SHEET_ID}</span>
                </div>
                <div class="flex justify-between items-center py-1 border-b border-slate-200/70">
                  <span class="font-bold text-slate-500">Target Sheet Tab:</span>
                  <span class="font-mono font-bold text-indigo-600 selection:bg-indigo-100 select-all">${PSI_SHEET_TAB}</span>
                </div>
                <div class="flex justify-between items-center py-1 border-b border-slate-200/70">
                  <span class="font-bold text-slate-500">Sync Frequency:</span>
                  <span class="font-semibold text-slate-800">Auto every 60s + On-Demand Sync Feed</span>
                </div>
                <div class="flex justify-between items-center py-1">
                  <span class="font-bold text-slate-500">Last Synced:</span>
                  <span class="font-mono font-bold text-emerald-600">${this.state.lastSynced}</span>
                </div>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <a
                  href="${PSI_SHEET_URL}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all flex items-center gap-1.5"
                >
                  <i data-lucide="external-link" class="w-3.5 h-3.5"></i> View Google Sheet
                </a>
                <button
                  type="button"
                  onclick="FPCL_PSI_SUITE.syncLiveFeed({ silent: false, force: true }); FPCL_PSI_SUITE.toggleSettingsModal();"
                  class="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center gap-1.5"
                >
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Refresh Feed Now
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }
    },

    renderStackedColumnChartSvg(totals, filtered) {
      // Solid colors only as requested:
      // Actual Uploaded = solid green #0B8A5A
      // Pending = solid red #DC2626
      // Total Planned = solid blue #1D4ED8, with navy #1E3A8A for text
      const COLOR_CLOSED = '#0B8A5A';
      const COLOR_OPEN = '#DC2626';
      const COLOR_TOTAL = '#1D4ED8';
      const COLOR_NAVY = '#1E3A8A';

      const isFilteredByDiscipline = (this.state.plannedFilter && this.state.plannedFilter !== 'all' && this.state.plannedFilter !== 'totalPlanned') ||
                                     (this.state.actualFilter && this.state.actualFilter !== 'all' && this.state.actualFilter !== 'totalUpload');

      let categories = [];
      if (isFilteredByDiscipline) {
        const planKey = this.getActivePlannedColumnKey();
        const actKey = this.getActiveActualColumnKey();

        categories = (filtered || []).map(item => {
          const planned = Number(item[planKey]) || 0;
          const uploaded = Number(item[actKey]) || 0;
          return {
            label: item.responsibleUnit,
            planned: planned,
            uploaded: uploaded,
            isTotal: false
          };
        });

        // Add overall TOTAL bar
        categories.push({
          label: 'TOTAL',
          planned: totals.filteredPlanned,
          uploaded: totals.filteredActual,
          isTotal: true
        });
      } else {
        // 9 Categories as requested:
        // Steam Gen, Power Gen, Coal & Sorbent, Balance of Plant, Grid, Non-Op, HSEQ, Plant General, Total
        categories = [
          { label: 'Steam Gen', planned: totals.plannedSteamGen, uploaded: totals.actualSteamGen },
          { label: 'Power Gen', planned: totals.plannedPowerGen, uploaded: totals.actualPowerGen },
          { label: 'Coal/Sorbent', planned: totals.plannedCoalSorbent, uploaded: totals.actualCoalSorbent },
          { label: 'Balance Plant', planned: totals.plannedBalanceOfPlant, uploaded: totals.actualBalanceOfPlant },
          { label: 'Grid', planned: totals.plannedGrid, uploaded: totals.actualGrid },
          { label: 'Non-Operating', planned: totals.plannedNonOperating, uploaded: totals.actualNonOperating },
          { label: 'HSEQ', planned: totals.plannedHseq, uploaded: totals.actualHseq },
          { label: 'Plant General', planned: totals.plannedPlantGeneral, uploaded: totals.actualPlantGeneral },
          { label: 'TOTAL DOCS', planned: totals.totalPlanned, uploaded: totals.totalUpload, isTotal: true }
        ];
      }

      const width = Math.max(1100, categories.length * 85);
      const height = 380;
      const pad = { top: 68, right: 30, bottom: 65, left: 65 };
      const plotW = width - pad.left - pad.right;
      const plotH = height - pad.top - pad.bottom;
      const baseY = pad.top + plotH;

      // Scale based on maximum planned
      const maxVal = Math.max(...categories.map(c => Math.max(c.planned, c.uploaded)), 10);
      const yMax = maxVal > 10000 ? Math.ceil(maxVal * 1.15 / 2000) * 2000
                 : (maxVal > 2000 ? Math.ceil(maxVal * 1.15 / 500) * 500
                 : (maxVal > 500 ? Math.ceil(maxVal * 1.15 / 100) * 100 : Math.ceil(maxVal * 1.15 / 20) * 20));

      const slotW = plotW / categories.length;
      const colW = Math.min(52, Math.max(28, Math.round(slotW * 0.52)));

      // Step gridlines
      const stepCount = 5;
      const stepVal = Math.round(yMax / stepCount);
      const gridSteps = [];
      for (let s = 0; s <= stepCount; s++) {
        gridSteps.push(s * stepVal);
      }

      // Light grey dashed horizontal gridlines on a plain white background
      const gridSvg = gridSteps.map(v => {
        const yPos = baseY - (v / yMax) * plotH;
        return `
          <line x1="${pad.left}" y1="${yPos}" x2="${width - pad.right}" y2="${yPos}" stroke="#E2E8F0" stroke-width="1.2" stroke-dasharray="4 4"/>
          <text x="${pad.left - 10}" y="${yPos + 4}" fill="#64748B" font-size="12" font-family="'Plus Jakarta Sans', monospace, sans-serif" font-weight="bold" text-anchor="end">${v.toLocaleString()}</text>
        `;
      }).join('');

      // Columns
      const columnsSvg = categories.map((cat, i) => {
        const planned = cat.planned;
        const uploaded = cat.uploaded;
        const remaining = Math.max(0, planned - uploaded);

        const closedH = yMax > 0 ? (uploaded / yMax) * plotH : 0;
        const openH = yMax > 0 ? (remaining / yMax) * plotH : 0;
        const totalH = closedH + openH;

        const sum = uploaded + remaining;
        const closedPct = sum > 0 ? (uploaded / sum) * 100 : 0;
        const openPct = sum > 0 ? (remaining / sum) * 100 : 0;

        const slotX = pad.left + (i * slotW);
        const colX = slotX + (slotW - colW) / 2;
        const centerX = colX + (colW / 2);

        const yClosed = baseY - closedH;
        const yOpen = baseY - totalH;

        // Tooltip geometry: Total Planned (navy/blue), Actual Uploaded (green), Pending (red)
        const badgeW = 98;
        const badgeH = 50;
        const badgeX = centerX - (badgeW / 2);
        const badgeY = Math.max(10, (totalH > 0 ? yOpen - badgeH - 8 : baseY - badgeH - 8));

        const tooltipSvg = `
          <g class="transition-transform duration-200 group-hover:-translate-y-0.5" pointer-events="none">
            <!-- White rounded background with subtle border -->
            <rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
            <!-- Solid blue top border (#1D4ED8) -->
            <path d="M ${badgeX + 2},${badgeY} H ${badgeX + badgeW - 2}" stroke="${COLOR_TOTAL}" stroke-width="3" stroke-linecap="round"/>
            <!-- Bottom arrow pointer -->
            <polygon points="${centerX - 4},${badgeY + badgeH} ${centerX + 4},${badgeY + badgeH} ${centerX},${badgeY + badgeH + 4}" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
            <line x1="${centerX - 3.2}" y1="${badgeY + badgeH}" x2="${centerX + 3.2}" y2="${badgeY + badgeH}" stroke="#FFFFFF" stroke-width="1.5"/>
            <!-- Total Planned (blue #1D4ED8 / navy #1E3A8A) -->
            <text x="${centerX}" y="${badgeY + 14}" fill="${COLOR_NAVY}" font-size="10" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="900" text-anchor="middle">Total Planned: ${planned.toLocaleString()}</text>
            <!-- Actual Uploaded (green #0B8A5A) -->
            <text x="${centerX}" y="${badgeY + 27}" fill="${COLOR_CLOSED}" font-size="9" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800" text-anchor="middle">Actual Uploaded: ${uploaded.toLocaleString()}</text>
            <!-- Pending (red #DC2626) -->
            <text x="${centerX}" y="${badgeY + 40}" fill="${COLOR_OPEN}" font-size="9" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800" text-anchor="middle">Pending: ${remaining.toLocaleString()}</text>
          </g>
        `;

        const cornerR = 4;
        let columnBars = '';

        if (totalH === 0) {
          columnBars = `
            <rect x="${colX + colW * 0.15}" y="${baseY - 2}" width="${colW * 0.7}" height="2" fill="#E2E8F0"/>
            ${tooltipSvg}
          `;
        } else {
          if (closedH > 0 && openH > 0) {
            const r = Math.min(cornerR, openH, colW / 2);
            // Top segment: Pending (red #DC2626) with slightly rounded top corners
            const topPath = `M ${colX},${yOpen + r} a ${r},${r} 0 0 1 ${r},-${r} h ${colW - 2 * r} a ${r},${r} 0 0 1 ${r},${r} v ${openH - r} h -${colW} z`;
            columnBars = `
              <!-- Green (Actual Uploaded) at the bottom of each stack -->
              <rect x="${colX}" y="${yClosed}" width="${colW}" height="${closedH}" fill="${COLOR_CLOSED}" class="transition-opacity group-hover:opacity-90"/>
              ${closedH >= 16 && closedPct >= 10 ? `<text x="${centerX}" y="${yClosed + closedH / 2 + 4}" fill="#FFFFFF" font-size="10.5" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800" text-anchor="middle" pointer-events="none">${Math.round(closedPct)}%</text>` : ''}
              <!-- Red (Pending) on top, with slightly rounded top corners -->
              <path d="${topPath}" fill="${COLOR_OPEN}" class="transition-opacity group-hover:opacity-90"/>
              ${openH >= 16 && openPct >= 10 ? `<text x="${centerX}" y="${yOpen + openH / 2 + 4}" fill="#FFFFFF" font-size="10.5" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800" text-anchor="middle" pointer-events="none">${Math.round(openPct)}%</text>` : ''}
            `;
          } else if (closedH > 0) {
            const r = Math.min(cornerR, closedH, colW / 2);
            const path = `M ${colX},${yClosed + r} a ${r},${r} 0 0 1 ${r},-${r} h ${colW - 2 * r} a ${r},${r} 0 0 1 ${r},${r} v ${closedH - r} h -${colW} z`;
            columnBars = `
              <path d="${path}" fill="${COLOR_CLOSED}" class="transition-opacity group-hover:opacity-90"/>
              ${closedH >= 16 ? `<text x="${centerX}" y="${yClosed + closedH / 2 + 4}" fill="#FFFFFF" font-size="10.5" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800" text-anchor="middle" pointer-events="none">${Math.round(closedPct)}%</text>` : ''}
            `;
          } else if (openH > 0) {
            const r = Math.min(cornerR, openH, colW / 2);
            const path = `M ${colX},${yOpen + r} a ${r},${r} 0 0 1 ${r},-${r} h ${colW - 2 * r} a ${r},${r} 0 0 1 ${r},${r} v ${openH - r} h -${colW} z`;
            columnBars = `
              <path d="${path}" fill="${COLOR_OPEN}" class="transition-opacity group-hover:opacity-90"/>
              ${openH >= 16 ? `<text x="${centerX}" y="${yOpen + openH / 2 + 4}" fill="#FFFFFF" font-size="10.5" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800" text-anchor="middle" pointer-events="none">${Math.round(openPct)}%</text>` : ''}
            `;
          }

          columnBars += tooltipSvg;
        }

        return `
          <g class="cursor-pointer group">
            <title>${cat.label}: Total Planned ${planned.toLocaleString()}, Actual Uploaded ${uploaded.toLocaleString()}, Pending ${remaining.toLocaleString()}</title>
            <rect x="${slotX + 2}" y="${pad.top}" width="${slotW - 4}" height="${plotH}" rx="6" fill="transparent" class="group-hover:fill-slate-100/60 transition-colors"/>
            ${columnBars}
            <!-- X Axis Label (12 font size as instructed) -->
            <g transform="translate(${centerX}, ${baseY + 16})">
              <text transform="rotate(-25)" fill="${cat.isTotal ? '#1E3A8A' : '#1E293B'}" font-size="12" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="${cat.isTotal ? '900' : '800'}" text-anchor="end">
                ${cat.label}
              </text>
            </g>
          </g>
        `;
      }).join('');

      return `
        <svg viewBox="0 0 ${width} ${height}" class="min-w-[850px] w-full h-auto overflow-visible select-none">
          <!-- Plain white background as requested -->
          <rect width="${width}" height="${height}" fill="#FFFFFF" rx="8"/>
          <!-- Baseline -->
          <line x1="${pad.left}" y1="${baseY}" x2="${width - pad.right}" y2="${baseY}" stroke="#64748B" stroke-width="2"/>
          ${gridSvg}
          ${columnsSvg}
        </svg>
      `;
    },

    renderDonutChartSvg(totals) {
      // Donut thick and large enough so text fits comfortably without overlapping donut ring
      const size = 380;
      const center = size / 2; // 190
      const radius = 135;
      const strokeWidth = 38; // Substantially thicker ring as requested
      const innerRadius = radius - strokeWidth / 2; // 116px inner clearance (232px diameter)

      const circumference = 2 * Math.PI * radius; // ~848.23

      const closed = totals.filteredActual !== undefined ? totals.filteredActual : totals.totalUpload;
      const total = totals.filteredPlanned !== undefined ? totals.filteredPlanned : totals.totalPlanned;
      const open = totals.documentsRemaining !== undefined ? totals.documentsRemaining : Math.max(0, total - closed);

      const closedPct = total > 0 ? (closed / total) : 0;
      const openPct = total > 0 ? (open / total) : 0;

      const closedDash = closedPct * circumference;
      const openDash = openPct * circumference;

      // Start at top (-90 deg)
      // Solid green #0B8A5A for Actual Uploaded, solid red #DC2626 for Pending
      const COLOR_CLOSED = '#0B8A5A';
      const COLOR_OPEN = '#DC2626';

      return `
        <svg viewBox="0 0 ${size} ${size}" class="w-full h-auto max-w-[340px] sm:max-w-[400px] select-none" style="filter: drop-shadow(0 6px 16px rgba(0,0,0,0.04));">
          <!-- Background track circle -->
          <circle
            cx="${center}"
            cy="${center}"
            r="${radius}"
            fill="none"
            stroke="#F1F5F9"
            stroke-width="${strokeWidth}"
          />

          <!-- Actual Uploaded Segment: Solid Green #0B8A5A -->
          <circle
            cx="${center}"
            cy="${center}"
            r="${radius}"
            fill="none"
            stroke="${COLOR_CLOSED}"
            stroke-width="${strokeWidth}"
            stroke-dasharray="${closedDash} ${circumference - closedDash}"
            stroke-dashoffset="0"
            transform="rotate(-90 ${center} ${center})"
            stroke-linecap="butt"
            class="transition-all duration-700"
          />

          <!-- Pending Segment: Solid Red #DC2626 -->
          ${openDash > 0 ? `
            <circle
              cx="${center}"
              cy="${center}"
              r="${radius}"
              fill="none"
              stroke="${COLOR_OPEN}"
              stroke-width="${strokeWidth}"
              stroke-dasharray="${openDash} ${circumference - openDash}"
              stroke-dashoffset="${-closedDash}"
              transform="rotate(-90 ${center} ${center})"
              stroke-linecap="butt"
              class="transition-all duration-700"
            />
          ` : ''}

          <!-- Center Text Content (fits completely inside inner circle without overlapping donut in both laptop & mobile) -->
          <g transform="translate(${center}, ${center})" text-anchor="middle" pointer-events="none">
            <text y="-10" fill="#1E293B" font-size="40" font-family="'Plus Jakarta Sans', monospace, sans-serif" font-weight="900" letter-spacing="-0.03em">
              ${totals.overallPercent.toFixed(1)}%
            </text>
            <text y="16" fill="#64748B" font-size="12" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800" letter-spacing="0.08em">
              OVERALL COMPLETE
            </text>
            <text y="36" fill="#0B8A5A" font-size="12.5" font-family="'Plus Jakarta Sans', monospace, sans-serif" font-weight="800">
              ${closed.toLocaleString()} / ${total.toLocaleString()} Docs
            </text>
            ${totals.activePlannedLabel && totals.activePlannedLabel !== 'Total Planned' ? `
              <text y="52" fill="#1D4ED8" font-size="10" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800">
                ${totals.activePlannedLabel}
              </text>
            ` : ''}
          </g>
        </svg>
      `;
    }
  };

  // Auto-init
  psiSuite.init();
})();
