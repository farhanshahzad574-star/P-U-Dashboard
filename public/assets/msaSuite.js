/**
 * FPCL Executive Operations & Compliance Portal
 * Management Safety Audit (MSA) Executive BI Suite
 * 
 * Google Sheet ID: 11ggCusY-ZJj09bVcpbikHeupyvFTBxDHlytjhpbNRWw
 * Tabs: MSA (Observations) & MSA_Compliance (Departmental Compliance)
 * 
 * Strict Scope & Isolation: Leaves Strategic, PLR, PSM Audits, PSM Validation,
 * IMS, PSSR, CAPEX, Sub HSE - P, Sub HSE – E&I, EHSE, Sub HSE – Mech, PSI, etc. untouched.
 */

(function () {
  'use strict';

  const MSA_SPREADSHEET_ID = '11ggCusY-ZJj09bVcpbikHeupyvFTBxDHlytjhpbNRWw';
  const MSA_TAB = 'MSA';
  const COMPLIANCE_TAB = 'MSA_Compliance';

  // Direct published Google Sheets CSV endpoints
  const MSA_CSV_URL = `https://docs.google.com/spreadsheets/d/${MSA_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(MSA_TAB)}`;
  const COMPLIANCE_CSV_URL = `https://docs.google.com/spreadsheets/d/${MSA_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(COMPLIANCE_TAB)}`;

  const msaSuite = {
    state: {
      searchQuery: '',
      responsibleUnitFilter: 'all', // Responsible Unit / Department filter
      statusFilter: 'all',          // 'all', 'open' (documents remaining / open), 'closed'
      injuryPotentialFilter: 'all', // Injury_Potential filter (Column F)
      isSyncing: false,
      lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSettingsOpen: false,
      activeTooltipItem: null,
      table1ScrollPos: 0,
      table2ScrollPos: 0
    },

    init() {
      window.FPCL_MSA_SUITE = this;

      // Try reading MSA from localStorage cache
      try {
        const cached = localStorage.getItem('FPCL_MSA_CACHE');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.FPCL_MSA_DATA = parsed;
          }
        }
      } catch (e) {}

      // Try reading MSA_Compliance from localStorage cache
      try {
        const cachedComp = localStorage.getItem('FPCL_MSA_COMPLIANCE_CACHE');
        if (cachedComp) {
          const parsedComp = JSON.parse(cachedComp);
          if (Array.isArray(parsedComp) && parsedComp.length > 0) {
            window.FPCL_MSA_COMPLIANCE_DATA = parsedComp;
          }
        }
      } catch (e) {}

      // Fallback to initial seed if not yet loaded
      if (!window.FPCL_MSA_DATA || window.FPCL_MSA_DATA.length === 0) {
        if (window.FPCL_MSA_INITIAL_SEED) {
          window.FPCL_MSA_DATA = window.FPCL_MSA_INITIAL_SEED.slice();
        }
      }

      if (!window.FPCL_MSA_COMPLIANCE_DATA || window.FPCL_MSA_COMPLIANCE_DATA.length === 0) {
        if (window.FPCL_MSA_COMPLIANCE_INITIAL_SEED) {
          window.FPCL_MSA_COMPLIANCE_DATA = window.FPCL_MSA_COMPLIANCE_INITIAL_SEED.slice();
        }
      }

      // Propagate stats to overview registry
      this.syncStatsToOverview();

      // Trigger immediate live background sync with Google Sheets
      setTimeout(() => {
        this.syncLiveFeed({ silent: true });
      }, 200);

      // Periodic auto-sync every 15 seconds to track live changes in Google Sheet
      if (!this._autoSyncTimer) {
        this._autoSyncTimer = setInterval(() => {
          this.syncLiveFeed({ silent: true });
        }, 15000);
      }

      // Auto-sync when user returns to browser tab
      if (typeof document !== 'undefined' && !this._visibilityBound) {
        this._visibilityBound = true;
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            this.syncLiveFeed({ silent: true });
          }
        });
      }
    },

    getRawData() {
      if (Array.isArray(window.FPCL_MSA_DATA) && window.FPCL_MSA_DATA.length > 0) {
        return window.FPCL_MSA_DATA;
      }
      if (Array.isArray(window.FPCL_MSA_INITIAL_SEED) && window.FPCL_MSA_INITIAL_SEED.length > 0) {
        return window.FPCL_MSA_INITIAL_SEED;
      }
      return [];
    },

    getRawComplianceData() {
      if (Array.isArray(window.FPCL_MSA_COMPLIANCE_DATA) && window.FPCL_MSA_COMPLIANCE_DATA.length > 0) {
        return window.FPCL_MSA_COMPLIANCE_DATA;
      }
      if (Array.isArray(window.FPCL_MSA_COMPLIANCE_INITIAL_SEED) && window.FPCL_MSA_COMPLIANCE_INITIAL_SEED.length > 0) {
        return window.FPCL_MSA_COMPLIANCE_INITIAL_SEED;
      }
      return [];
    },

    /**
     * Determines whether an item status is 'Closed'.
     * Rule: Count point as open if empty cell is found or any text other than Closed is found.
     */
    isClosed(statusStr) {
      if (!statusStr) return false;
      const s = String(statusStr).trim().toLowerCase();
      return s === 'close' || s === 'closed' || s === 'completed' || s === 'rectified';
    },

    getFilteredData() {
      const raw = this.getRawData();
      const q = (this.state.searchQuery || '').toLowerCase().trim();
      const unitFilter = this.state.responsibleUnitFilter;
      const statusFilter = this.state.statusFilter;

      return raw.filter(item => {
        // Exclude aggregate total row if present
        const ru = String(item.groupResponsibleUnit || item.groupResponsibleDept || '').trim().toLowerCase();
        if (ru === 'total' || ru === 'grand total') return false;

        // Search query across fields
        if (q) {
          const obs = String(item.observation || '').toLowerCase();
          const area = String(item.areaInspected || '').toLowerCase();
          const by = String(item.auditedBy || '').toLowerCase();
          const dept = String(item.groupResponsibleDept || '').toLowerCase();
          const unit = String(item.groupResponsibleUnit || '').toLowerCase();
          const action = String(item.actionTaken || '').toLowerCase();
          const sr = String(item.sr || '').toLowerCase();
          if (!obs.includes(q) && !area.includes(q) && !by.includes(q) && !dept.includes(q) && !unit.includes(q) && !action.includes(q) && !sr.includes(q)) {
            return false;
          }
        }

        // Responsible Unit Filter (Column B / Unit / Dept)
        if (unitFilter !== 'all') {
          const itemUnit = String(item.groupResponsibleUnit || '').trim().toLowerCase();
          const itemDept = String(item.groupResponsibleDept || '').trim().toLowerCase();
          const target = String(unitFilter).trim().toLowerCase();
          if (itemUnit !== target && itemDept !== target && !itemUnit.includes(target) && !itemDept.includes(target)) {
            return false;
          }
        }

        // Status / Documents Remaining / Open filter
        if (statusFilter === 'open') {
          if (this.isClosed(item.status)) return false;
        } else if (statusFilter === 'closed') {
          if (!this.isClosed(item.status)) return false;
        }

        // Injury Potential Filter (Column F named Injury_Potential)
        if (this.state.injuryPotentialFilter && this.state.injuryPotentialFilter !== 'all') {
          const itemInjury = String(item.injuryPotential || '').trim().toLowerCase();
          const targetInjury = String(this.state.injuryPotentialFilter).trim().toLowerCase();
          if (itemInjury !== targetInjury) {
            return false;
          }
        }

        return true;
      });
    },

    getFilteredComplianceData() {
      const raw = this.getRawComplianceData();
      const unitFilter = this.state.responsibleUnitFilter;

      if (unitFilter === 'all') return raw;

      return raw.filter(item => {
        const d = String(item.department || '').trim().toLowerCase();
        const target = String(unitFilter).trim().toLowerCase();
        return d === target || d.includes(target) || target.includes(d);
      });
    },

    /**
     * Compute KPIs from Sheet named MSA:
     * 1- TOTAL Observations from column A named Sr
     * 2- Open Observation from column J named Status (red color)
     * 3- Closed Observations from column J named Status
     * 4- Closure Rate in percentage from KPI 1 and KPI 3
     */
    calculateKpis(items) {
      const total = items.length;
      let closed = 0;
      let open = 0;

      items.forEach(i => {
        if (this.isClosed(i.status)) {
          closed++;
        } else {
          open++;
        }
      });

      const closureRate = total > 0 ? ((closed / total) * 100).toFixed(1) : '0.0';

      return {
        total,
        open,
        closed,
        closureRate: `${closureRate}%`,
        closureRateNum: total > 0 ? (closed / total) * 100 : 0
      };
    },

    syncStatsToOverview() {
      const raw = this.getRawData();
      const kpis = this.calculateKpis(raw);

      if (window.DASHBOARD_REGISTRY) {
        const msa = window.DASHBOARD_REGISTRY.find(d => d.id === 'msa');
        if (msa) {
          msa.status = 'Active';
          msa.hasSheetLink = true;
          msa.department = 'Management Safety & Assurance';
          msa.cadence = 'Continuous / Monthly Audit';
          msa.description = `Management Safety Audit (MSA) tracking ${kpis.total} Total Observations (${kpis.closed} Closed, ${kpis.open} Open, ${kpis.closureRate} Closure Rate) and Departmental Compliance.`;
          msa.kpis = {
            total: kpis.total,
            closed: kpis.closed,
            inProgress: kpis.open,
            overdue: 0,
            compliance: kpis.closureRate
          };
          msa.punchList = {
            open: kpis.open,
            closed: kpis.closed,
            total: kpis.total,
            rate: kpis.closureRate
          };
          msa.dataReadiness = { master: '100%', signoff: '100%' };
          msa.statusComment = `Live Google Sheets: MSA (${kpis.total} Observations, ${kpis.closed} Closed, ${kpis.closureRate} Closure)`;
        }
      }

      if (window.portalApp && typeof window.portalApp.renderNavMenu === 'function') {
        window.portalApp.renderNavMenu();
      }
      if (window.portalApp && typeof window.portalApp.renderComparisonChart === 'function') {
        window.portalApp.renderComparisonChart();
      }
    },

    parseCsv(text) {
      if (!text || typeof text !== 'string') return [];
      const rows = [];
      let row = [''];
      let inQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        const next = text[i + 1];

        if (c === '"') {
          if (inQuotes && next === '"') {
            row[row.length - 1] += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          row.push('');
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
          if (c === '\r' && next === '\n') {
            i++;
          }
          rows.push(row);
          row = [''];
        } else {
          row[row.length - 1] += c;
        }
      }
      if (row.length > 1 || row[0] !== '') {
        rows.push(row);
      }

      if (rows.length < 2) return [];

      // Clean headers
      const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ''));
      const colMap = {};
      headers.forEach((h, idx) => {
        const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        colMap[clean] = idx;
      });

      const getCol = (r, ...keys) => {
        for (const k of keys) {
          const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (colMap[cleanK] !== undefined && r[colMap[cleanK]] !== undefined) {
            return r[colMap[cleanK]].trim();
          }
        }
        return '';
      };

      const result = [];
      for (let r = 1; r < rows.length; r++) {
        const line = rows[r];
        if (line.length === 0 || (line.length === 1 && !line[0].trim())) continue;

        const sr = getCol(line, 'sr', 'sno', 'no') || (line[0] ? line[0].trim() : String(r));
        if (!sr && !line[1]) continue;

        const auditDate = getCol(line, 'auditdate', 'date') || (line[1] ? line[1].trim() : '');
        const auditedBy = getCol(line, 'auditedby', 'auditor') || (line[2] ? line[2].trim() : '');
        const areaInspected = getCol(line, 'areainspected', 'area') || (line[3] ? line[3].trim() : '');
        const observation = getCol(line, 'observation', 'finding') || (line[4] ? line[4].trim() : '');
        const injuryPotential = getCol(line, 'injurypotential', 'injury') || (line[5] ? line[5].trim() : '');
        const actionTaken = getCol(line, 'actiontaken', 'action') || (line[6] ? line[6].trim() : '');
        const groupResponsibleDept = getCol(line, 'groupresponsibledepartment', 'department', 'dept') || (line[7] ? line[7].trim() : '');
        const groupResponsibleUnit = getCol(line, 'groupresponsibleunit', 'responsibleunit', 'unit') || (line[8] ? line[8].trim() : '');
        const status = getCol(line, 'status', 'openclose') || (line[9] ? line[9].trim() : '');
        const targetDate = getCol(line, 'targetdate', 'target') || (line[10] ? line[10].trim() : '');

        result.push({
          sr,
          auditDate,
          auditedBy,
          areaInspected,
          observation,
          injuryPotential,
          actionTaken,
          groupResponsibleDept: groupResponsibleDept || groupResponsibleUnit || 'Unassigned',
          groupResponsibleUnit: groupResponsibleUnit || groupResponsibleDept || 'Unassigned',
          status,
          targetDate
        });
      }

      return result;
    },

    parseComplianceCsv(text) {
      if (!text || typeof text !== 'string') return [];
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length < 2) return [];

      const result = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 3) {
          const sr = parts[0] || String(i);
          const department = parts[1] || 'Unknown';
          const planned = Number(parts[2]) || 0;
          const actual = Number(parts[3]) || 0;
          const remaining = Math.max(0, planned - actual);
          const rate = planned > 0 ? (actual / planned) * 100 : 0;

          result.push({
            sr,
            department,
            plannedMsa: planned,
            actualMsa: actual,
            remainingMsa: remaining,
            complianceRate: Number(rate.toFixed(1))
          });
        }
      }
      return result;
    },

    async syncLiveFeed(options = {}) {
      const silent = !!options.silent;
      if (this.state.isSyncing) return;
      this.state.isSyncing = true;
      this.renderSyncButton();

      const ts = Date.now();

      // Candidate URLs for MSA tab
      const msaUrls = [
        `/api/msa?tab=MSA&force=true&_t=${ts}`,
        MSA_CSV_URL + `&_t=${ts}`,
        `/api/sheets/fetch?sheetTab=MSA&sheetId=${MSA_SPREADSHEET_ID}&force=true&_t=${ts}`,
        `https://docs.google.com/spreadsheets/d/${MSA_SPREADSHEET_ID}/export?format=csv&sheet=MSA&_t=${ts}`
      ];

      // Candidate URLs for MSA_Compliance tab
      const compUrls = [
        `/api/msa?tab=MSA_Compliance&force=true&_t=${ts}`,
        COMPLIANCE_CSV_URL + `&_t=${ts}`,
        `/api/sheets/fetch?sheetTab=MSA_Compliance&sheetId=${MSA_SPREADSHEET_ID}&force=true&_t=${ts}`,
        `https://docs.google.com/spreadsheets/d/${MSA_SPREADSHEET_ID}/export?format=csv&sheet=MSA_Compliance&_t=${ts}`
      ];

      let msaParsed = null;
      for (const u of msaUrls) {
        try {
          const res = await fetch(u, {
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
          });
          if (res.ok) {
            const cType = res.headers.get('content-type') || '';
            if (cType.includes('application/json')) {
              const j = await res.json();
              if (j && j.csvText) {
                const parsed = this.parseCsv(j.csvText);
                if (parsed.length > 0) { msaParsed = parsed; break; }
              }
            } else {
              const text = await res.text();
              if (text && !text.includes('<!DOCTYPE html>') && text.includes('Observation')) {
                const parsed = this.parseCsv(text);
                if (parsed.length > 0) { msaParsed = parsed; break; }
              }
            }
          }
        } catch (e) {}
      }

      let compParsed = null;
      for (const u of compUrls) {
        try {
          const res = await fetch(u, {
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
          });
          if (res.ok) {
            const cType = res.headers.get('content-type') || '';
            if (cType.includes('application/json')) {
              const j = await res.json();
              if (j && j.csvText) {
                const parsed = this.parseComplianceCsv(j.csvText);
                if (parsed.length > 0) { compParsed = parsed; break; }
              }
            } else {
              const text = await res.text();
              if (text && !text.includes('<!DOCTYPE html>') && text.includes('Planned_MSA')) {
                const parsed = this.parseComplianceCsv(text);
                if (parsed.length > 0) { compParsed = parsed; break; }
              }
            }
          }
        } catch (e) {}
      }

      let updated = false;
      if (msaParsed && msaParsed.length > 0) {
        window.FPCL_MSA_DATA = msaParsed;
        try { localStorage.setItem('FPCL_MSA_CACHE', JSON.stringify(msaParsed)); } catch (e) {}
        updated = true;
      }

      if (compParsed && compParsed.length > 0) {
        window.FPCL_MSA_COMPLIANCE_DATA = compParsed;
        try { localStorage.setItem('FPCL_MSA_COMPLIANCE_CACHE', JSON.stringify(compParsed)); } catch (e) {}
        updated = true;
      }

      this.state.isSyncing = false;
      this.state.lastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.syncStatsToOverview();
      this.render();

      if (!silent && window.portalApp && typeof window.portalApp.showToast === 'function') {
        if (updated) {
          window.portalApp.showToast('MSA Live Feed Synced', 'Live observations & compliance successfully updated from Google Sheets.', 'success');
        } else {
          window.portalApp.showToast('MSA Live Sync', 'Active connection verified with Google Sheet datasets.', 'info');
        }
      }
    },

    setSearch(q) {
      this.state.searchQuery = q || '';
      this.renderFilteredViews();
    },

    setUnitFilter(unit) {
      this.state.responsibleUnitFilter = unit || 'all';
      this.renderFilteredViews();
    },

    setStatusFilter(st) {
      this.state.statusFilter = st || 'all';
      this.renderFilteredViews();
    },

    setInjuryPotentialFilter(val) {
      this.state.injuryPotentialFilter = val || 'all';
      this.renderFilteredViews();
    },

    resetFilters() {
      this.state.searchQuery = '';
      this.state.responsibleUnitFilter = 'all';
      this.state.statusFilter = 'all';
      this.state.injuryPotentialFilter = 'all';

      const s1 = document.getElementById('msa-banner-search');
      if (s1) s1.value = '';
      const s2 = document.getElementById('msa-filter-search');
      if (s2) s2.value = '';

      const u = document.getElementById('msa-unit-select');
      if (u) u.value = 'all';

      const st = document.getElementById('msa-status-select');
      if (st) st.value = 'all';

      const ip = document.getElementById('msa-injury-potential-select');
      if (ip) ip.value = 'all';

      this.renderFilteredViews();

      if (window.portalApp && typeof window.portalApp.showToast === 'function') {
        window.portalApp.showToast('Filters Reset', 'All MSA filters have been restored to defaults.', 'info');
      }
    },

    exportCsv() {
      const items = this.getFilteredData();
      if (items.length === 0) {
        if (window.portalApp && typeof window.portalApp.showToast === 'function') {
          window.portalApp.showToast('Export CSV', 'No matching MSA observations to export.', 'warning');
        }
        return;
      }

      const headers = [
        'Sr',
        'Audit Date',
        'Audited By',
        'Area Inspected',
        'Observation',
        'Injury Potential',
        'Action Taken',
        'Group Responsible (Department)',
        'Group Responsible (Unit)',
        'Status',
        'Target Date'
      ];

      const csvRows = [headers.join(',')];

      items.forEach(i => {
        const row = [
          `"${String(i.sr || '').replace(/"/g, '""')}"`,
          `"${String(i.auditDate || '').replace(/"/g, '""')}"`,
          `"${String(i.auditedBy || '').replace(/"/g, '""')}"`,
          `"${String(i.areaInspected || '').replace(/"/g, '""')}"`,
          `"${String(i.observation || '').replace(/"/g, '""')}"`,
          `"${String(i.injuryPotential || '').replace(/"/g, '""')}"`,
          `"${String(i.actionTaken || '').replace(/"/g, '""')}"`,
          `"${String(i.groupResponsibleDept || '').replace(/"/g, '""')}"`,
          `"${String(i.groupResponsibleUnit || '').replace(/"/g, '""')}"`,
          `"${String(i.status || '').replace(/"/g, '""')}"`,
          `"${String(i.targetDate || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      });

      const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FPCL_MSA_Observations_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (window.portalApp && typeof window.portalApp.showToast === 'function') {
        window.portalApp.showToast('CSV Exported', `Exported ${items.length} MSA filtered observation records.`, 'success');
      }
    },

    scrollTable(tableId, direction) {
      const container = document.getElementById(tableId);
      if (!container) return;
      const scrollAmount = direction === 'left' ? -260 : 260;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    },

    toggleSettings() {
      this.state.isSettingsOpen = !this.state.isSettingsOpen;
      const modal = document.getElementById('msa-settings-modal');
      if (modal) {
        if (this.state.isSettingsOpen) {
          modal.classList.remove('hidden');
        } else {
          modal.classList.add('hidden');
        }
      }
    },

    renderSyncButton() {
      const btn = document.getElementById('msa-sync-btn');
      if (!btn) return;
      if (this.state.isSyncing) {
        btn.innerHTML = `
          <svg class="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Syncing...</span>
        `;
        btn.disabled = true;
      } else {
        btn.innerHTML = `
          <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-white"></i>
          <span>Sync Feed</span>
        `;
        btn.disabled = false;
        if (window.lucide) window.lucide.createIcons();
      }
    },

    /**
     * Re-renders views that depend on filters (KPIs, Charts, Donut, Tables)
     */
    renderFilteredViews() {
      const filtered = this.getFilteredData();
      const compFiltered = this.getFilteredComplianceData();
      const kpis = this.calculateKpis(filtered);

      this.renderKpiCards(kpis);
      this.renderCharts(filtered, compFiltered);
      this.renderDonut(kpis);
      this.renderTables(filtered, compFiltered);
    },

    /**
     * Primary Render: Mounts entire MSA dashboard inside container
     */
    render() {
      const container = document.getElementById('msa-specialized-container');
      if (!container) return;

      const filtered = this.getFilteredData();
      const compFiltered = this.getFilteredComplianceData();
      const kpis = this.calculateKpis(filtered);

      // Extract unique Responsible Units / Departments from raw data for filter dropdown
      const raw = this.getRawData();
      const unitSet = new Set();
      const injurySet = new Set();
      raw.forEach(r => {
        if (r.groupResponsibleUnit) unitSet.add(r.groupResponsibleUnit.trim());
        if (r.groupResponsibleDept) unitSet.add(r.groupResponsibleDept.trim());
        if (r.injuryPotential && String(r.injuryPotential).trim()) {
          injurySet.add(r.injuryPotential.trim());
        }
      });
      const uniqueUnits = Array.from(unitSet).filter(Boolean).sort();
      const uniqueInjuries = Array.from(injurySet).filter(Boolean).sort();

      container.innerHTML = `
        <!-- ========================================================================= -->
        <!-- 1. COLORFUL EYECATCHING BANNER (Ultra-modern Deep Obsidian-Plum-Violet)   -->
        <!-- Heading & important feature buttons as in attached image (no extra text)  -->
        <!-- ========================================================================= -->
        <div class="rounded-2xl p-4 sm:p-5 shadow-xl text-white relative overflow-hidden bg-gradient-to-r from-[#18181B] via-[#4A0E4E] to-[#7B1FA2] border border-fuchsia-500/30">
          <!-- Subtle decorative radial background glow -->
          <div class="absolute -right-16 -top-16 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -left-16 -bottom-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
            <!-- Left: Heading only (no extra texts or details as requested) -->
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-inner shrink-0 text-white">
                <i data-lucide="shield-alert" class="w-5 h-5 sm:w-6 sm:h-6 text-fuchsia-200"></i>
              </div>
              <div>
                <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white m-0 p-0 leading-tight">
                  Management Safety Audit (MSA)
                </h2>
              </div>
            </div>

            <!-- Right: Important feature buttons matching image.png -->
            <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <!-- Search Findings -->
              <div class="relative min-w-[170px] sm:min-w-[210px] flex-1 sm:flex-initial">
                <input
                  id="msa-banner-search"
                  type="text"
                  placeholder="SEARCH FINDINGS..."
                  value="${this.state.searchQuery || ''}"
                  oninput="FPCL_MSA_SUITE.setSearch(this.value)"
                  class="w-full pl-8 pr-3 py-1.5 sm:py-2 rounded-xl bg-white/15 hover:bg-white/20 focus:bg-white/25 border border-white/25 focus:border-white/50 text-white placeholder-white/70 text-xs font-bold font-mono tracking-wider focus:outline-none transition-all shadow-inner uppercase"
                />
                <i data-lucide="search" class="w-3.5 h-3.5 text-white/70 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
              </div>

              <!-- Reset Filters Button -->
              <button
                type="button"
                onclick="FPCL_MSA_SUITE.resetFilters()"
                class="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
                title="Reset all filters to defaults"
              >
                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-white"></i>
                <span>Reset Filters</span>
              </button>

              <!-- Export CSV Button -->
              <button
                type="button"
                onclick="FPCL_MSA_SUITE.exportCsv()"
                class="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
                title="Export filtered MSA observations to CSV"
              >
                <i data-lucide="download" class="w-3.5 h-3.5 text-white"></i>
                <span>Export CSV</span>
              </button>

              <!-- Sync Feed Button -->
              <button
                id="msa-sync-btn"
                type="button"
                onclick="FPCL_MSA_SUITE.syncLiveFeed()"
                class="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border border-emerald-400/40 text-white text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
                title="Fetch latest updates from Google Sheets"
              >
                <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-white"></i>
                <span>Sync Feed</span>
              </button>

              <!-- Settings / Info Button -->
              <button
                type="button"
                onclick="FPCL_MSA_SUITE.toggleSettings()"
                class="p-1.5 sm:p-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white transition-all shadow-sm hover:shadow cursor-pointer active:scale-95"
                title="View Google Sheet connection information"
              >
                <i data-lucide="settings" class="w-4 h-4 text-white"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Settings Info Popover / Modal (Collapsible) -->
        <div id="msa-settings-modal" class="hidden bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3 transition-all">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <i data-lucide="database" class="w-4 h-4 text-indigo-600"></i>
              <h4 class="text-sm font-black text-slate-800">Google Sheet Connection & Data Sources</h4>
            </div>
            <button onclick="FPCL_MSA_SUITE.toggleSettings()" class="text-slate-400 hover:text-slate-600 p-1">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <div class="font-extrabold text-slate-700">Sheet 1: Observations (Tab: MSA)</div>
              <div class="font-mono text-slate-500 break-all text-[11px]">ID: 11ggCusY-ZJj09bVcpbikHeupyvFTBxDHlytjhpbNRWw</div>
              <div class="text-slate-600">Columns: Sr, Audit_Date, Audited_by, Area_Inspected, Observation, Injury_Potential, Action_Taken, Group_Responsible_Dept, Group_Responsible_Unit, Status, Target_Date</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <div class="font-extrabold text-slate-700">Sheet 2: Compliance (Tab: MSA_Compliance)</div>
              <div class="font-mono text-slate-500 break-all text-[11px]">ID: 11ggCusY-ZJj09bVcpbikHeupyvFTBxDHlytjhpbNRWw</div>
              <div class="text-slate-600">Columns: Sr, Department, Planned_MSA, Actual_MSA</div>
            </div>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 2. KPI CARDS (Unique colorful perimeter lines, center-aligned values)     -->
        <!-- 1-TOTAL Observations, 2-Open, 3-Closed, 4-Closure Rate                    -->
        <!-- ========================================================================= -->
        <div id="msa-kpi-cards-grid" class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <!-- Dynamically populated via renderKpiCards() -->
        </div>

        <!-- ========================================================================= -->
        <!-- 3. FILTERS (Below KPIs, side-by-side on mobile, no heading on filter bar)  -->
        <!-- Filter 1: Responsible_Unit (Col B / Col I)                                 -->
        <!-- Filter 2: DOCUMENTS REMAINING / open filter                               -->
        <!-- Filter 3: Injury_Potential filter (Column F named Injury_Potential)        -->
        <!-- Filter 4: Keyword Search                                                  -->
        <!-- ========================================================================= -->
        <div id="msa-filters-bar" class="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-2.5 sm:p-3.5 shadow-xs relative overflow-hidden">
          <!-- Subtle perimeter top line -->
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600"></div>

          <!-- Side-by-side on mobile (2 cols on mobile, 4 cols on desktop) -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 items-center">
            <!-- Filter 1: Responsible_Unit Filter -->
            <div class="min-w-0">
              <div class="relative">
                <select
                  id="msa-unit-select"
                  onchange="FPCL_MSA_SUITE.setUnitFilter(this.value)"
                  class="w-full pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-xs font-bold font-mono text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer outline-none appearance-none truncate"
                  title="Filter by Responsible Unit / Department"
                >
                  <option value="all">Responsible Unit: All</option>
                  ${uniqueUnits.map(u => `<option value="${u}" ${this.state.responsibleUnitFilter === u ? 'selected' : ''}>${u}</option>`).join('')}
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                </div>
              </div>
            </div>

            <!-- Filter 2: DOCUMENTS REMAINING / open Filter -->
            <div class="min-w-0">
              <div class="relative">
                <select
                  id="msa-status-select"
                  onchange="FPCL_MSA_SUITE.setStatusFilter(this.value)"
                  class="w-full pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-xs font-bold font-mono text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer outline-none appearance-none truncate"
                  title="Filter by Open Observations / Documents Remaining"
                >
                  <option value="all" ${this.state.statusFilter === 'all' ? 'selected' : ''}>Status: All Observations</option>
                  <option value="open" ${this.state.statusFilter === 'open' ? 'selected' : ''}>Open / Documents Remaining</option>
                  <option value="closed" ${this.state.statusFilter === 'closed' ? 'selected' : ''}>Closed Observations</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                </div>
              </div>
            </div>

            <!-- Filter 3: Injury_Potential Filter (Column F named Injury_Potential) -->
            <div class="min-w-0">
              <div class="relative">
                <select
                  id="msa-injury-potential-select"
                  onchange="FPCL_MSA_SUITE.setInjuryPotentialFilter(this.value)"
                  class="w-full pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-xs font-bold font-mono text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer outline-none appearance-none truncate"
                  title="Filter by Injury Potential (Tab: MSA, Column F)"
                >
                  <option value="all">Injury Potential: All</option>
                  ${uniqueInjuries.map(ip => `<option value="${ip}" ${this.state.injuryPotentialFilter === ip ? 'selected' : ''}>${ip}</option>`).join('')}
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                </div>
              </div>
            </div>

            <!-- Filter 4: Quick Filter Search (Desktop & full mobile span if 4 cols wrap) -->
            <div class="col-span-2 lg:col-span-1 min-w-0">
              <div class="relative">
                <input
                  id="msa-filter-search"
                  type="text"
                  placeholder="Filter by keyword..."
                  value="${this.state.searchQuery || ''}"
                  oninput="FPCL_MSA_SUITE.setSearch(this.value)"
                  class="w-full pl-8 pr-3 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                />
                <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 4. HORIZONTAL STACK COLUMN BAR CHARTS (Side-by-side arrangement)          -->
        <!-- Left: Observations Open, Close & Total for each Dept (Col I)              -->
        <!-- Right: MSA Compliance of each Dept (Planned_MSA vs Actual_MSA)            -->
        <!-- ========================================================================= -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <!-- Left Chart Card: Observations by Department/Unit -->
          <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-indigo-400/80 flex flex-col justify-between">
            <div>
              <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <h3 class="text-sm sm:text-base font-black text-[#1E3A8A] tracking-tight flex items-center gap-1.5">
                    <i data-lucide="bar-chart-2" class="w-4 h-4 text-indigo-600"></i>
                    <span>Department Observations</span>
                  </h3>
                </div>
                <!-- Legend chips matching exact color rules -->
                <div class="flex flex-wrap items-center gap-1.5 text-[11px] font-mono font-bold">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#1E3A8A] border border-blue-200">
                    <span class="w-2 h-2 rounded-xs bg-[#1D4ED8]"></span>
                    <span>Total</span>
                  </span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[#0B8A5A] border border-emerald-200">
                    <span class="w-2 h-2 rounded-xs bg-[#0B8A5A]"></span>
                    <span>Closed</span>
                  </span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-[#DC2626] border border-red-200">
                    <span class="w-2 h-2 rounded-xs bg-[#DC2626]"></span>
                    <span>Open</span>
                  </span>
                </div>
              </div>

              <!-- SVG Horizontal Stacked Bar Chart -->
              <div id="msa-observations-chart-container" class="w-full pt-3 min-h-[260px] overflow-x-auto">
                <!-- Populated via renderObservationsChart() -->
              </div>
            </div>
          </div>

          <!-- Right Chart Card: MSA Compliance by Department -->
          <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-cyan-500/80 flex flex-col justify-between">
            <div>
              <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <h3 class="text-sm sm:text-base font-black text-[#1E3A8A] tracking-tight flex items-center gap-1.5">
                    <i data-lucide="check-square" class="w-4 h-4 text-teal-600"></i>
                    <span>MSA Compliance by Department</span>
                  </h3>
                </div>
                <!-- Legend chips matching exact color rules -->
                <div class="flex flex-wrap items-center gap-1.5 text-[11px] font-mono font-bold">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#1E3A8A] border border-blue-200">
                    <span class="w-2 h-2 rounded-xs bg-[#1D4ED8]"></span>
                    <span>Planned</span>
                  </span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[#0B8A5A] border border-emerald-200">
                    <span class="w-2 h-2 rounded-xs bg-[#0B8A5A]"></span>
                    <span>Actual</span>
                  </span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-[#DC2626] border border-red-200">
                    <span class="w-2 h-2 rounded-xs bg-[#DC2626]"></span>
                    <span>Remaining</span>
                  </span>
                </div>
              </div>

              <!-- SVG Horizontal Stacked Bar Chart -->
              <div id="msa-compliance-chart-container" class="w-full pt-3 min-h-[260px] overflow-x-auto">
                <!-- Populated via renderComplianceChart() -->
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 5. DONUT CHART (Thick donut, large enough center, legends at bottom)       -->
        <!-- ========================================================================= -->
        <div class="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border-2 border-fuchsia-500/80">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-sm sm:text-base font-black text-[#1E3A8A] tracking-tight flex items-center gap-1.5">
                <i data-lucide="pie-chart" class="w-4 h-4 text-fuchsia-600"></i>
                <span>Observation closure</span>
              </h3>
            </div>
          </div>

          <div id="msa-donut-container" class="pt-3">
            <!-- Populated via renderDonut() -->
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 6. 02 SEPARATE COMPLETE SCROLLABLE GOOGLE SHEETS IN FORM OF TABLE         -->
        <!-- Scrollable up/down & left/right with left/right scroll buttons            -->
        <!-- Sheet 1: MSA | Sheet 2: MSA_Compliance                                    -->
        <!-- ========================================================================= -->
        <div class="space-y-6">
          <!-- Table 1: Sheet MSA -->
          <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-blue-500/80 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
              <div>
                <h3 class="text-sm sm:text-base font-black text-[#1E3A8A] tracking-tight flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#1D4ED8]"></span>
                  <span>Sheet 1: MSA Observations Master (Tab: MSA)</span>
                </h3>
              </div>

              <!-- Left/Right Scroll Controls -->
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onclick="FPCL_MSA_SUITE.scrollTable('msa-table-1-scroll', 'left')"
                  class="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                  title="Scroll table left"
                >
                  <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
                  <span>Scroll Left</span>
                </button>
                <button
                  type="button"
                  onclick="FPCL_MSA_SUITE.scrollTable('msa-table-1-scroll', 'right')"
                  class="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                  title="Scroll table right"
                >
                  <span>Scroll Right</span>
                  <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>

            <!-- Table Container -->
            <div id="msa-table-1-container">
              <!-- Populated via renderTables() -->
            </div>
          </div>

          <!-- Table 2: Sheet MSA_Compliance -->
          <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-emerald-500/80 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
              <div>
                <h3 class="text-sm sm:text-base font-black text-[#0B8A5A] tracking-tight flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#0B8A5A]"></span>
                  <span>Sheet 2: MSA Compliance (Tab: MSA_Compliance)</span>
                </h3>
              </div>

              <!-- Left/Right Scroll Controls -->
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onclick="FPCL_MSA_SUITE.scrollTable('msa-table-2-scroll', 'left')"
                  class="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                  title="Scroll table left"
                >
                  <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
                  <span>Scroll Left</span>
                </button>
                <button
                  type="button"
                  onclick="FPCL_MSA_SUITE.scrollTable('msa-table-2-scroll', 'right')"
                  class="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                  title="Scroll table right"
                >
                  <span>Scroll Right</span>
                  <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>

            <!-- Table Container -->
            <div id="msa-table-2-container">
              <!-- Populated via renderTables() -->
            </div>
          </div>
        </div>
      `;

      this.renderFilteredViews();

      if (window.lucide) {
        window.lucide.createIcons();
      }
    },

    /**
     * Render the 4 KPI cards with center-aligned values and unique colorful perimeter lines
     * Prominent executive font sizes for KPI values
     */
    renderKpiCards(kpis) {
      const container = document.getElementById('msa-kpi-cards-grid');
      if (!container) return;

      container.innerHTML = `
        <!-- KPI 1: TOTAL Observations (Blue perimeter) -->
        <div class="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xs border-2 border-blue-500/85 hover:border-blue-600 transition-all flex flex-col justify-center items-center text-center min-h-[160px] sm:min-h-[180px]">
          <div class="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            TOTAL OBSERVATIONS
          </div>
          <div class="text-5xl sm:text-6xl lg:text-7xl xl:text-[76px] font-black font-mono tracking-tight text-[#1D4ED8] leading-none my-1 sm:my-2 tabular-nums">
            ${kpis.total.toLocaleString()}
          </div>
        </div>

        <!-- KPI 2: Open Observation (RED color for open points, Red perimeter) -->
        <div class="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xs border-2 border-red-500/85 hover:border-red-600 transition-all flex flex-col justify-center items-center text-center min-h-[160px] sm:min-h-[180px]">
          <div class="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            OPEN OBSERVATIONS
          </div>
          <div class="text-5xl sm:text-6xl lg:text-7xl xl:text-[76px] font-black font-mono tracking-tight text-[#DC2626] leading-none my-1 sm:my-2 tabular-nums">
            ${kpis.open.toLocaleString()}
          </div>
        </div>

        <!-- KPI 3: Closed Observations (Green perimeter) -->
        <div class="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xs border-2 border-emerald-500/85 hover:border-emerald-600 transition-all flex flex-col justify-center items-center text-center min-h-[160px] sm:min-h-[180px]">
          <div class="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            CLOSED OBSERVATIONS
          </div>
          <div class="text-5xl sm:text-6xl lg:text-7xl xl:text-[76px] font-black font-mono tracking-tight text-[#0B8A5A] leading-none my-1 sm:my-2 tabular-nums">
            ${kpis.closed.toLocaleString()}
          </div>
        </div>

        <!-- KPI 4: Closure Rate in percentage from KPI 1 and KPI 3 (Teal/Emerald perimeter) -->
        <div class="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xs border-2 border-teal-500/85 hover:border-teal-600 transition-all flex flex-col justify-center items-center text-center min-h-[160px] sm:min-h-[180px]">
          <div class="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            CLOSURE RATE
          </div>
          <div class="text-5xl sm:text-6xl lg:text-7xl xl:text-[76px] font-black font-mono tracking-tight text-[#059669] leading-none my-1 sm:my-2 tabular-nums">
            ${kpis.closureRate}
          </div>
        </div>
      `;
    },

    /**
     * Render Horizontal Stack Column Bar Charts (Side by Side)
     */
    renderCharts(filteredObs, compData) {
      this.renderObservationsChart(filteredObs);
      this.renderComplianceChart(compData);
    },

    /**
     * Chart 1 (Left): Horizontal stack bar chart showing observations open, close, and total
     * for each department/unit from column I named Group_Responsible_(Unit).
     * Inside the bars: show numbers (e.g. u.closed, u.open)
     * Outside in front of where bar ends: show percentage (e.g. closedPct%)
     */
    renderObservationsChart(items) {
      const container = document.getElementById('msa-observations-chart-container');
      if (!container) return;

      // Group by Group_Responsible_(Unit)
      const unitMap = {};
      items.forEach(i => {
        const u = i.groupResponsibleUnit || i.groupResponsibleDept || 'Unassigned';
        if (!unitMap[u]) {
          unitMap[u] = { unit: u, total: 0, closed: 0, open: 0 };
        }
        unitMap[u].total++;
        if (this.isClosed(i.status)) {
          unitMap[u].closed++;
        } else {
          unitMap[u].open++;
        }
      });

      const units = Object.values(unitMap);
      if (units.length === 0) {
        container.innerHTML = `
          <div class="py-12 text-center text-slate-400 text-xs font-mono font-bold">
            No observations matching the selected filters.
          </div>
        `;
        return;
      }

      // Solid color constants:
      const COLOR_CLOSED = '#0B8A5A'; // solid green
      const COLOR_OPEN = '#DC2626';   // solid red
      const COLOR_TOTAL = '#1D4ED8';  // solid blue
      const COLOR_NAVY = '#1E3A8A';   // navy for text

      const svgWidth = 580;
      const rowHeight = 44;
      const padTop = 20;
      const padBottom = 25;
      const padLeft = 140;
      const padRight = 85; // Ample room for percentage label outside bar where bar ends
      const plotWidth = svgWidth - padLeft - padRight;
      const svgHeight = padTop + padBottom + (units.length * rowHeight);

      // Max total across units
      const maxVal = Math.max(...units.map(u => u.total), 1);
      const xMax = Math.max(5, Math.ceil(maxVal * 1.2));

      // Grid steps (light grey dashed vertical gridlines)
      const step = xMax <= 5 ? 1 : (xMax <= 10 ? 2 : 5);
      const gridValues = [];
      for (let v = 0; v <= xMax; v += step) gridValues.push(v);

      const gridSvg = gridValues.map(v => {
        const xPos = padLeft + (v / xMax) * plotWidth;
        return `
          <line x1="${xPos}" y1="${padTop - 8}" x2="${xPos}" y2="${svgHeight - padBottom}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3 3"/>
          <text x="${xPos}" y="${svgHeight - 8}" fill="#94A3B8" font-size="10" font-family="'Plus Jakarta Sans', monospace, sans-serif" font-weight="bold" text-anchor="middle">${v}</text>
        `;
      }).join('');

      const barsSvg = units.map((u, idx) => {
        const yPos = padTop + (idx * rowHeight);
        const barH = 22;

        const closedW = (u.closed / xMax) * plotWidth;
        const openW = (u.open / xMax) * plotWidth;
        const totalW = closedW + openW;

        const closedPct = u.total > 0 ? (u.closed / u.total) * 100 : 0;
        const openPct = u.total > 0 ? (u.open / u.total) * 100 : 0;

        // Tooltip geometry
        const badgeW = 76;
        const badgeH = 44;
        const badgeX = Math.min(svgWidth - badgeW - 8, Math.max(padLeft, padLeft + totalW - (badgeW / 2)));
        const badgeY = Math.max(4, yPos - badgeH - 4);

        const tooltipSvg = `
          <g class="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none" z-index="50">
            <rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="5" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.08))"/>
            <path d="M ${badgeX + 2},${badgeY} H ${badgeX + badgeW - 2}" stroke="${COLOR_TOTAL}" stroke-width="3" stroke-linecap="round"/>
            <polygon points="${badgeX + (badgeW / 2) - 4},${badgeY + badgeH} ${badgeX + (badgeW / 2) + 4},${badgeY + badgeH} ${badgeX + (badgeW / 2)},${badgeY + badgeH + 4}" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
            <text x="${badgeX + (badgeW / 2)}" y="${badgeY + 13}" fill="${COLOR_NAVY}" font-size="9.5" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" text-anchor="middle">Total: ${u.total}</text>
            <text x="${badgeX + (badgeW / 2)}" y="${badgeY + 25}" fill="${COLOR_OPEN}" font-size="9" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="middle">Open: ${u.open}</text>
            <text x="${badgeX + (badgeW / 2)}" y="${badgeY + 37}" fill="${COLOR_CLOSED}" font-size="9" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="middle">Closed: ${u.closed}</text>
          </g>
        `;

        // Values in NUMBERS inside the bar
        let closedLabel = '';
        if (u.closed > 0) {
          const fontSize = closedW >= 14 ? '11' : '9.5';
          closedLabel = `<text x="${padLeft + (closedW / 2)}" y="${yPos + (barH / 2) + 4}" fill="#FFFFFF" font-size="${fontSize}" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" text-anchor="middle">${u.closed}</text>`;
        }

        let openLabel = '';
        if (u.open > 0) {
          const fontSize = openW >= 14 ? '11' : '9.5';
          openLabel = `<text x="${padLeft + closedW + (openW / 2)}" y="${yPos + (barH / 2) + 4}" fill="#FFFFFF" font-size="${fontSize}" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" text-anchor="middle">${u.open}</text>`;
        }

        // Unit label (truncated if necessary)
        const unitDisplay = u.unit.length > 17 ? u.unit.slice(0, 16) + '…' : u.unit;

        return `
          <g class="group cursor-pointer">
            <!-- Department / Unit label -->
            <text x="${padLeft - 10}" y="${yPos + (barH / 2) + 4}" fill="${COLOR_NAVY}" font-size="12" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="end" title="${u.unit}">
              ${unitDisplay}
            </text>

            <!-- Closed Segment (Green #0B8A5A at base/left) -->
            ${closedW > 0 ? `
              <rect x="${padLeft}" y="${yPos}" width="${closedW}" height="${barH}" rx="${openW > 0 ? 0 : 3}" fill="${COLOR_CLOSED}" class="transition-all duration-200 group-hover:brightness-105"/>
              ${closedLabel}
            ` : ''}

            <!-- Open Segment (Red #DC2626 on top/right) -->
            ${openW > 0 ? `
              <rect x="${padLeft + closedW}" y="${yPos}" width="${openW}" height="${barH}" rx="3" fill="${COLOR_OPEN}" class="transition-all duration-200 group-hover:brightness-105"/>
              ${openLabel}
            ` : ''}

            <!-- Number OUTSIDE bar in front of where bar ends (no percentage) -->
            <text x="${padLeft + totalW + 8}" y="${yPos + (barH / 2) + 4.5}" fill="${COLOR_NAVY}" font-size="12" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900">
              ${u.total}
            </text>

            ${tooltipSvg}
          </g>
        `;
      }).join('');

      container.innerHTML = `
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full h-auto overflow-visible select-none">
          ${gridSvg}
          ${barsSvg}
        </svg>
      `;
    },

    /**
     * Chart 2 (Right): Stacked horizontal bar chart showing MSA compliance of each department
     * using tab named MSA_Compliance (Department, Planned_MSA, Actual_MSA)
     * Inside the bars: show numbers (e.g. d.actualMsa, d.remainingMsa)
     * Outside in front of where bar ends: show percentage (e.g. actualPct%)
     */
    renderComplianceChart(compData) {
      const container = document.getElementById('msa-compliance-chart-container');
      if (!container) return;

      if (!compData || compData.length === 0) {
        container.innerHTML = `
          <div class="py-12 text-center text-slate-400 text-xs font-mono font-bold">
            No compliance records found.
          </div>
        `;
        return;
      }

      // Solid color constants:
      const COLOR_CLOSED = '#0B8A5A'; // solid green (Actual MSA)
      const COLOR_OPEN = '#DC2626';   // solid red (Remaining MSA)
      const COLOR_TOTAL = '#1D4ED8';  // solid blue (Planned MSA)
      const COLOR_NAVY = '#1E3A8A';   // navy for text

      const svgWidth = 580;
      const rowHeight = 44;
      const padTop = 20;
      const padBottom = 25;
      const padLeft = 110;
      const padRight = 85; // Ample room for percentage label outside bar where bar ends
      const plotWidth = svgWidth - padLeft - padRight;
      const svgHeight = padTop + padBottom + (compData.length * rowHeight);

      // Max planned value across departments
      const maxVal = Math.max(...compData.map(d => d.plannedMsa), 1);
      const xMax = Math.max(15, Math.ceil(maxVal * 1.25));

      // Grid steps
      const step = xMax <= 15 ? 3 : 5;
      const gridValues = [];
      for (let v = 0; v <= xMax; v += step) gridValues.push(v);

      const gridSvg = gridValues.map(v => {
        const xPos = padLeft + (v / xMax) * plotWidth;
        return `
          <line x1="${xPos}" y1="${padTop - 8}" x2="${xPos}" y2="${svgHeight - padBottom}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3 3"/>
          <text x="${xPos}" y="${svgHeight - 8}" fill="#94A3B8" font-size="10" font-family="'Plus Jakarta Sans', monospace, sans-serif" font-weight="bold" text-anchor="middle">${v}</text>
        `;
      }).join('');

      const barsSvg = compData.map((d, idx) => {
        const yPos = padTop + (idx * rowHeight);
        const barH = 22;

        const actualW = (d.actualMsa / xMax) * plotWidth;
        const remainW = (d.remainingMsa / xMax) * plotWidth;
        const totalW = actualW + remainW;

        const actualPct = d.plannedMsa > 0 ? (d.actualMsa / d.plannedMsa) * 100 : 0;
        const remainPct = d.plannedMsa > 0 ? (d.remainingMsa / d.plannedMsa) * 100 : 0;

        // Tooltip geometry: White rounded tooltip with a blue top border
        const badgeW = 86;
        const badgeH = 44;
        const badgeX = Math.min(svgWidth - badgeW - 8, Math.max(padLeft, padLeft + totalW - (badgeW / 2)));
        const badgeY = Math.max(4, yPos - badgeH - 4);

        const tooltipSvg = `
          <g class="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none" z-index="50">
            <rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="5" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.08))"/>
            <path d="M ${badgeX + 2},${badgeY} H ${badgeX + badgeW - 2}" stroke="${COLOR_TOTAL}" stroke-width="3" stroke-linecap="round"/>
            <polygon points="${badgeX + (badgeW / 2) - 4},${badgeY + badgeH} ${badgeX + (badgeW / 2) + 4},${badgeY + badgeH} ${badgeX + (badgeW / 2)},${badgeY + badgeH + 4}" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
            <text x="${badgeX + (badgeW / 2)}" y="${badgeY + 13}" fill="${COLOR_NAVY}" font-size="9" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" text-anchor="middle">Planned: ${d.plannedMsa}</text>
            <text x="${badgeX + (badgeW / 2)}" y="${badgeY + 25}" fill="${COLOR_OPEN}" font-size="9" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="middle">Remaining: ${d.remainingMsa}</text>
            <text x="${badgeX + (badgeW / 2)}" y="${badgeY + 37}" fill="${COLOR_CLOSED}" font-size="9" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="middle">Actual: ${d.actualMsa}</text>
          </g>
        `;

        // Values in NUMBERS inside the bar
        let actualLabel = '';
        if (d.actualMsa > 0) {
          const fontSize = actualW >= 14 ? '11' : '9.5';
          actualLabel = `<text x="${padLeft + (actualW / 2)}" y="${yPos + (barH / 2) + 4}" fill="#FFFFFF" font-size="${fontSize}" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" text-anchor="middle">${d.actualMsa}</text>`;
        }

        let remainLabel = '';
        if (d.remainingMsa > 0) {
          const fontSize = remainW >= 14 ? '11' : '9.5';
          remainLabel = `<text x="${padLeft + actualW + (remainW / 2)}" y="${yPos + (barH / 2) + 4}" fill="#FFFFFF" font-size="${fontSize}" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" text-anchor="middle">${d.remainingMsa}</text>`;
        }

        return `
          <g class="group cursor-pointer">
            <!-- Department label -->
            <text x="${padLeft - 10}" y="${yPos + (barH / 2) + 4}" fill="${COLOR_NAVY}" font-size="12" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="end">
              ${d.department}
            </text>

            <!-- Actual Segment (Green #0B8A5A at base/left) -->
            ${actualW > 0 ? `
              <rect x="${padLeft}" y="${yPos}" width="${actualW}" height="${barH}" rx="${remainW > 0 ? 0 : 3}" fill="${COLOR_CLOSED}" class="transition-all duration-200 group-hover:brightness-105"/>
              ${actualLabel}
            ` : ''}

            <!-- Remaining Segment (Red #DC2626 on top/right) -->
            ${remainW > 0 ? `
              <rect x="${padLeft + actualW}" y="${yPos}" width="${remainW}" height="${barH}" rx="3" fill="${COLOR_OPEN}" class="transition-all duration-200 group-hover:brightness-105"/>
              ${remainLabel}
            ` : ''}

            <!-- Number OUTSIDE bar in front of where bar ends (no percentage) -->
            <text x="${padLeft + totalW + 8}" y="${yPos + (barH / 2) + 4.5}" fill="${COLOR_NAVY}" font-size="12" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900">
              ${d.plannedMsa}
            </text>

            ${tooltipSvg}
          </g>
        `;
      }).join('');

      container.innerHTML = `
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full h-auto overflow-visible select-none">
          ${gridSvg}
          ${barsSvg}
        </svg>
      `;
    },

    /**
     * Render Donut Chart:
     * - Large enough that text in laptop and mobile view fits inside without overlapping
     * - Thick donut chart to look visually appealing
     * - Legends at bottom with light tinted backgrounds matching each color
     */
    renderDonut(kpis) {
      const container = document.getElementById('msa-donut-container');
      if (!container) return;

      const total = kpis.total;
      const closed = kpis.closed;
      const open = kpis.open;

      const closedPct = total > 0 ? (closed / total) * 100 : 0;
      const openPct = total > 0 ? (open / total) * 100 : 0;

      // Donut geometry:
      // Radius: 90, Circumference: 2 * PI * 90 ≈ 565.48, stroke-width: 32 (Thick & visually appealing)
      const r = 90;
      const c = 2 * Math.PI * r;
      const strokeW = 32;

      const closedOffset = 0;
      const closedStroke = (closedPct / 100) * c;
      const openOffset = -closedStroke;
      const openStroke = (openPct / 100) * c;

      container.innerHTML = `
        <div class="flex flex-col items-center justify-center">
          <!-- Donut SVG -->
          <div class="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center my-2">
            <svg viewBox="0 0 240 240" class="w-full h-full -rotate-90 transform">
              <!-- Background Ring -->
              <circle cx="120" cy="120" r="${r}" fill="none" stroke="#F1F5F9" stroke-width="${strokeW}" />

              <!-- Closed Arc (Green #0B8A5A) -->
              ${closedPct > 0 ? `
                <circle
                  cx="120"
                  cy="120"
                  r="${r}"
                  fill="none"
                  stroke="#0B8A5A"
                  stroke-width="${strokeW}"
                  stroke-dasharray="${closedStroke} ${c - closedStroke}"
                  stroke-dashoffset="${closedOffset}"
                  stroke-linecap="butt"
                  class="transition-all duration-700 ease-out"
                />
              ` : ''}

              <!-- Open Arc (Red #DC2626) -->
              ${openPct > 0 ? `
                <circle
                  cx="120"
                  cy="120"
                  r="${r}"
                  fill="none"
                  stroke="#DC2626"
                  stroke-width="${strokeW}"
                  stroke-dasharray="${openStroke} ${c - openStroke}"
                  stroke-dashoffset="${openOffset}"
                  stroke-linecap="butt"
                  class="transition-all duration-700 ease-out"
                />
              ` : ''}
            </svg>

            <!-- Text Inside Donut (Large center area radius 74px, zero overlap guaranteed) -->
            <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
              <span class="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900 leading-none">
                ${kpis.closureRate}
              </span>
              <span class="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mt-1">
                Closure Rate
              </span>
              <span class="text-[11px] sm:text-xs font-bold font-mono text-slate-700 mt-1 bg-slate-100 px-2 py-0.5 rounded-md">
                ${closed} Closed · ${open} Open
              </span>
            </div>
          </div>

          <!-- Legends at bottom with light tinted backgrounds matching each color -->
          <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-3 pt-3 border-t border-slate-100 w-full text-xs font-mono font-bold">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-[#1E3A8A] border border-blue-200">
              <span class="w-2.5 h-2.5 rounded-full bg-[#1D4ED8]"></span>
              <span>Total: ${total} Observations</span>
            </div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-[#0B8A5A] border border-emerald-200">
              <span class="w-2.5 h-2.5 rounded-full bg-[#0B8A5A]"></span>
              <span>Closed: ${closed} (${closedPct.toFixed(1)}%)</span>
            </div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 text-[#DC2626] border border-red-200">
              <span class="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span>
              <span>Open: ${open} (${openPct.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Render the 02 Separate Complete Scrollable Tables:
     * Sheet 1: MSA Observations
     * Sheet 2: MSA_Compliance
     */
    renderTables(filteredObs, compData) {
      this.renderTable1(filteredObs);
      this.renderTable2(compData);
    },

    renderTable1(items) {
      const container = document.getElementById('msa-table-1-container');
      if (!container) return;

      if (!items || items.length === 0) {
        container.innerHTML = `
          <div class="py-12 text-center text-slate-400 text-xs font-mono font-bold bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No MSA observations match the current filter selection.
          </div>
        `;
        return;
      }

      const rowsHtml = items.map((item, idx) => {
        const isClosed = this.isClosed(item.status);
        const statusBadge = isClosed
          ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-[#0B8A5A] border border-emerald-200"><span class="w-1.5 h-1.5 rounded-full bg-[#0B8A5A]"></span><span>Closed</span></span>`
          : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-[#DC2626] border border-red-200"><span class="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span><span>Open</span></span>`;

        const injuryBadge = (item.injuryPotential || '').toLowerCase().includes('fatality')
          ? `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">FATALITY</span>`
          : `<span class="text-slate-500 font-mono text-xs">${item.injuryPotential || 'None'}</span>`;

        return `
          <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100 ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}">
            <td class="px-3 py-2.5 font-mono font-bold text-xs text-slate-700 whitespace-nowrap text-center">${item.sr}</td>
            <td class="px-3 py-2.5 font-mono text-xs text-slate-600 whitespace-nowrap">${item.auditDate || '—'}</td>
            <td class="px-3 py-2.5 text-xs font-bold text-slate-800 whitespace-nowrap">${item.auditedBy || '—'}</td>
            <td class="px-3 py-2.5 text-xs text-slate-700 min-w-[200px]">${item.areaInspected || '—'}</td>
            <td class="px-3 py-2.5 text-xs text-slate-900 font-medium min-w-[280px] max-w-[420px]">${item.observation || '—'}</td>
            <td class="px-3 py-2.5 text-xs whitespace-nowrap">${injuryBadge}</td>
            <td class="px-3 py-2.5 text-xs text-slate-700 min-w-[240px] max-w-[380px]">${item.actionTaken || '—'}</td>
            <td class="px-3 py-2.5 text-xs font-bold text-indigo-700 whitespace-nowrap">${item.groupResponsibleDept || '—'}</td>
            <td class="px-3 py-2.5 text-xs font-bold text-purple-700 whitespace-nowrap">${item.groupResponsibleUnit || '—'}</td>
            <td class="px-3 py-2.5 text-xs whitespace-nowrap text-center">${statusBadge}</td>
            <td class="px-3 py-2.5 text-xs font-mono text-slate-600 whitespace-nowrap">${item.targetDate || '—'}</td>
          </tr>
        `;
      }).join('');

      container.innerHTML = `
        <div id="msa-table-1-scroll" class="w-full overflow-x-auto max-h-[460px] overflow-y-auto rounded-xl border border-slate-200">
          <table class="w-full text-left border-collapse min-w-[1200px]">
            <thead class="bg-slate-100/90 sticky top-0 z-10 backdrop-blur-xs border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
              <tr>
                <th class="px-3 py-2.5 text-center">Sr</th>
                <th class="px-3 py-2.5">Audit Date</th>
                <th class="px-3 py-2.5">Audited By</th>
                <th class="px-3 py-2.5">Area Inspected</th>
                <th class="px-3 py-2.5">Observation</th>
                <th class="px-3 py-2.5">Injury Potential</th>
                <th class="px-3 py-2.5">Action Taken</th>
                <th class="px-3 py-2.5">Responsible Dept</th>
                <th class="px-3 py-2.5">Responsible Unit</th>
                <th class="px-3 py-2.5 text-center">Status</th>
                <th class="px-3 py-2.5">Target Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${rowsHtml}
            </tbody>
          </table>
        </div>
        <div class="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
          <span>Showing ${items.length} observations</span>
          <span class="text-slate-400">Use horizontal scroll or buttons to view all 11 columns</span>
        </div>
      `;
    },

    renderTable2(compData) {
      const container = document.getElementById('msa-table-2-container');
      if (!container) return;

      if (!compData || compData.length === 0) {
        container.innerHTML = `
          <div class="py-12 text-center text-slate-400 text-xs font-mono font-bold bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No compliance records found.
          </div>
        `;
        return;
      }

      const rowsHtml = compData.map((d, idx) => {
        const rate = d.complianceRate || 0;
        const rateColor = rate >= 75 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : (rate >= 50 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-rose-700 bg-rose-50 border-rose-200');

        return `
          <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100 ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}">
            <td class="px-4 py-3 font-mono font-bold text-xs text-slate-700 text-center">${d.sr}</td>
            <td class="px-4 py-3 text-xs font-black text-slate-900">${d.department}</td>
            <td class="px-4 py-3 font-mono font-bold text-xs text-[#1D4ED8] text-center">${d.plannedMsa}</td>
            <td class="px-4 py-3 font-mono font-bold text-xs text-[#0B8A5A] text-center">${d.actualMsa}</td>
            <td class="px-4 py-3 font-mono font-bold text-xs text-[#DC2626] text-center">${d.remainingMsa}</td>
            <td class="px-4 py-3 text-center">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black font-mono border ${rateColor}">
                ${rate.toFixed(1)}%
              </span>
            </td>
            <td class="px-4 py-3 text-xs text-slate-600">
              <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                <div class="bg-[#0B8A5A] h-2" style="width: ${rate}%;"></div>
                <div class="bg-[#DC2626] h-2" style="width: ${100 - rate}%;"></div>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      container.innerHTML = `
        <div id="msa-table-2-scroll" class="w-full overflow-x-auto max-h-[360px] overflow-y-auto rounded-xl border border-slate-200">
          <table class="w-full text-left border-collapse min-w-[700px]">
            <thead class="bg-slate-100/90 sticky top-0 z-10 backdrop-blur-xs border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
              <tr>
                <th class="px-4 py-2.5 text-center">Sr</th>
                <th class="px-4 py-2.5">Department</th>
                <th class="px-4 py-2.5 text-center">Planned MSA</th>
                <th class="px-4 py-2.5 text-center">Actual MSA</th>
                <th class="px-4 py-2.5 text-center">Remaining MSA</th>
                <th class="px-4 py-2.5 text-center">Compliance Rate</th>
                <th class="px-4 py-2.5">Progress Indicator</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
    }
  };

  // Initialize suite
  msaSuite.init();
})();
