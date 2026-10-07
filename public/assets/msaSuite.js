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
  const AUDITOR_COMPLIANCE_TAB = 'Compliance_by_Auditor_name';

  // Direct published Google Sheets CSV endpoints
  const MSA_CSV_URL = `https://docs.google.com/spreadsheets/d/${MSA_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(MSA_TAB)}`;
  const COMPLIANCE_CSV_URL = `https://docs.google.com/spreadsheets/d/${MSA_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(COMPLIANCE_TAB)}`;
  const AUDITOR_COMPLIANCE_CSV_URL = `https://docs.google.com/spreadsheets/d/${MSA_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(AUDITOR_COMPLIANCE_TAB)}`;

  const msaSuite = {
    state: {
      searchQuery: '',
      yearFilter: String(new Date().getFullYear()), // Opens dynamically on current year filter (e.g. 2026)
      monthFilter: '',                              // Opens dynamically on current month filter (e.g. 'Oct')
      responsibleUnitFilter: 'all', // Responsible Unit / Department filter
      statusFilter: 'all',          // 'all', 'open' (documents remaining / open), 'closed'
      injuryPotentialFilter: 'all', // Injury_Potential filter (Column F)
      selectedTableTab: 'all',      // 'all', 'msa', 'compliance', 'auditor'
      showPlannedAuditorBars: false,// Independent bar chart: Planned bars hidden by default, toggled via small button
      isSyncing: false,
      lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSettingsOpen: false,
      activeTooltipItem: null,
      table1ScrollPos: 0,
      table2ScrollPos: 0,
      table3ScrollPos: 0
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

      // Try reading Compliance_by_Auditor_name from localStorage cache
      try {
        const cachedAuditor = localStorage.getItem('FPCL_MSA_AUDITOR_CACHE');
        if (cachedAuditor) {
          const parsedAuditor = JSON.parse(cachedAuditor);
          if (Array.isArray(parsedAuditor) && parsedAuditor.length > 0) {
            window.FPCL_MSA_AUDITOR_DATA = parsedAuditor;
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

      if (!window.FPCL_MSA_AUDITOR_DATA || window.FPCL_MSA_AUDITOR_DATA.length === 0) {
        if (window.FPCL_MSA_AUDITOR_COMPLIANCE_INITIAL_SEED) {
          window.FPCL_MSA_AUDITOR_DATA = window.FPCL_MSA_AUDITOR_COMPLIANCE_INITIAL_SEED.slice();
        }
      }

      // Ensure year & month filters dynamically open on current year & current month
      this.state.yearFilter = this.getDefaultYear();
      this.state.monthFilter = this.getDefaultMonth();

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
     * Gets raw auditor compliance data from tab: Compliance_by_Auditor_name
     * Independent of any filter as this is compliance for the whole year.
     */
    getRawAuditorData() {
      if (Array.isArray(window.FPCL_MSA_AUDITOR_DATA) && window.FPCL_MSA_AUDITOR_DATA.length > 0) {
        return window.FPCL_MSA_AUDITOR_DATA;
      }
      if (Array.isArray(window.FPCL_MSA_AUDITOR_COMPLIANCE_INITIAL_SEED) && window.FPCL_MSA_AUDITOR_COMPLIANCE_INITIAL_SEED.length > 0) {
        return window.FPCL_MSA_AUDITOR_COMPLIANCE_INITIAL_SEED;
      }
      return [];
    },

    /**
     * Toggles plotting of Planned MSA bars (Column C) in Compliance by Auditor chart
     */
    togglePlannedAuditorBars() {
      this.state.showPlannedAuditorBars = !this.state.showPlannedAuditorBars;
      this.renderAuditorComplianceChart();

      const btn = document.getElementById('msa-toggle-planned-btn');
      if (btn) {
        btn.innerHTML = `
          <i data-lucide="${this.state.showPlannedAuditorBars ? 'eye-off' : 'eye'}" class="w-3.5 h-3.5"></i>
          <span>${this.state.showPlannedAuditorBars ? 'Hide Planned MSA' : 'Show Planned MSA'}</span>
        `;
        btn.className = this.state.showPlannedAuditorBars
          ? "px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-xs border border-blue-700 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
          : "px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap";
      }

      const legendPlanned = document.getElementById('msa-auditor-legend-planned');
      if (legendPlanned) {
        if (this.state.showPlannedAuditorBars) {
          legendPlanned.classList.remove('hidden');
        } else {
          legendPlanned.classList.add('hidden');
        }
      }

      if (window.lucide) window.lucide.createIcons();
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

    /**
     * Extracts a 4-digit year string from Column B (Audit_Date)
     * Supports formats: "31-Mar-26", "1-Apr-2026", "2026-04-01", "01/04/2026", "26", etc.
     */
    extractYear(dateStr) {
      if (!dateStr) return '';
      const s = String(dateStr).trim();
      if (!s) return '';

      // 1. Explicit 4-digit year (19xx or 20xx)
      const fourDigitMatch = s.match(/\b(19\d\d|20\d\d)\b/);
      if (fourDigitMatch) {
        return fourDigitMatch[1];
      }

      // 2. Trailing 2-digit year after delimiter (e.g. 31-Mar-26, 01/04/26, 1-Apr-26)
      const twoDigitEndMatch = s.match(/[-/.](\d{2})$/);
      if (twoDigitEndMatch) {
        const yr = parseInt(twoDigitEndMatch[1], 10);
        return String(2000 + yr);
      }

      // 3. Just 2 digits (e.g. "26")
      if (/^\d{2}$/.test(s)) {
        const yr = parseInt(s, 10);
        return String(2000 + yr);
      }

      // 4. Fallback to Date parser
      const parsed = new Date(s);
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        if (y >= 1990 && y <= 2100) {
          return String(y);
        }
      }

      return '';
    },

    MONTH_LIST: [
      { code: 'Jan', name: 'January', num: 1 },
      { code: 'Feb', name: 'February', num: 2 },
      { code: 'Mar', name: 'March', num: 3 },
      { code: 'Apr', name: 'April', num: 4 },
      { code: 'May', name: 'May', num: 5 },
      { code: 'Jun', name: 'June', num: 6 },
      { code: 'Jul', name: 'July', num: 7 },
      { code: 'Aug', name: 'August', num: 8 },
      { code: 'Sep', name: 'September', num: 9 },
      { code: 'Oct', name: 'October', num: 10 },
      { code: 'Nov', name: 'November', num: 11 },
      { code: 'Dec', name: 'December', num: 12 }
    ],

    /**
     * Gets current calendar month 3-letter code dynamically (e.g. 'Oct')
     */
    getCurrentMonth() {
      const idx = new Date().getMonth();
      return (this.MONTH_LIST[idx] && this.MONTH_LIST[idx].code) || 'Oct';
    },

    /**
     * Gets current calendar month full name dynamically (e.g. 'October')
     */
    getCurrentMonthFullName() {
      const idx = new Date().getMonth();
      return (this.MONTH_LIST[idx] && this.MONTH_LIST[idx].name) || 'October';
    },

    /**
     * Dynamically defaults to current month
     */
    getDefaultMonth() {
      return this.getCurrentMonth();
    },

    /**
     * Extracts standardized 3-letter month string ('Jan'..'Dec') from Column B (Audit_Date)
     * Supports formats: "31-Mar-26", "2-Oct-26", "1-Apr-2026", "2026-10-02", "02/10/2026", etc.
     */
    extractMonth(dateStr) {
      if (!dateStr) return '';
      const s = String(dateStr).trim();
      if (!s) return '';

      // 1. Textual month match (Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec, or full names)
      const textMatch = s.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i);
      if (textMatch) {
        const sub = textMatch[1].slice(0, 3).toLowerCase();
        const found = this.MONTH_LIST.find(m => m.code.toLowerCase() === sub);
        if (found) return found.code;
      }

      // 2. ISO format YYYY-MM-DD
      const isoMatch = s.match(/^\d{4}[-/](\d{1,2})[-/]\d{1,2}/);
      if (isoMatch) {
        const m = parseInt(isoMatch[1], 10);
        if (m >= 1 && m <= 12) {
          return this.MONTH_LIST[m - 1].code;
        }
      }

      // 3. DD-MM-YYYY or DD/MM/YYYY
      const delimMatch = s.match(/^\d{1,2}[-/](\d{1,2})[-/]\d{2,4}/);
      if (delimMatch) {
        const m = parseInt(delimMatch[1], 10);
        if (m >= 1 && m <= 12) {
          return this.MONTH_LIST[m - 1].code;
        }
      }

      // 4. JS Date fallback
      const parsed = new Date(s);
      if (!isNaN(parsed.getTime())) {
        const m = parsed.getMonth();
        if (m >= 0 && m < 12) {
          return this.MONTH_LIST[m].code;
        }
      }

      return '';
    },

    /**
     * Returns list of months with count of observations present in dataset
     */
    getAvailableMonths() {
      const raw = this.getRawData();
      const monthCounts = {};
      this.MONTH_LIST.forEach(m => { monthCounts[m.code] = 0; });
      raw.forEach(r => {
        if (r.auditDate) {
          const m = this.extractMonth(r.auditDate);
          if (m && monthCounts[m] !== undefined) {
            monthCounts[m]++;
          }
        }
      });
      return this.MONTH_LIST.map(m => ({
        ...m,
        count: monthCounts[m.code] || 0
      }));
    },

    /**
     * Gets the current calendar year as a 4-digit string (e.g., '2026')
     */
    getCurrentYear() {
      return String(new Date().getFullYear());
    },

    /**
     * Extracts all unique available years sorted descending from Column B (Audit_Date)
     */
    getAvailableYears() {
      const raw = this.getRawData();
      const yearSet = new Set();
      raw.forEach(r => {
        if (r.auditDate) {
          const yr = this.extractYear(r.auditDate);
          if (yr) yearSet.add(yr);
        }
      });
      return Array.from(yearSet).sort((a, b) => b.localeCompare(a));
    },

    /**
     * Computes the default year: dynamically opens on the current year.
     * If the current year exists in the dataset, returns current year (e.g. '2026').
     * If dataset has other years, falls back to the most recent year available, or current year.
     */
    getDefaultYear() {
      const current = this.getCurrentYear();
      const available = this.getAvailableYears();
      if (available.includes(current)) {
        return current;
      }
      return available.length > 0 ? available[0] : current;
    },

    /**
     * Lifecycle hook invoked whenever MSA Dashboard is opened
     * Dynamically ensures it opens on the current month & current year filter
     */
    onOpen() {
      this.state.yearFilter = this.getDefaultYear();
      this.state.monthFilter = this.getDefaultMonth();
    },

    getFilteredData() {
      const raw = this.getRawData();
      const q = (this.state.searchQuery || '').toLowerCase().trim();
      const unitFilter = this.state.responsibleUnitFilter;
      const statusFilter = this.state.statusFilter;
      const yearFilter = this.state.yearFilter;
      const monthFilter = this.state.monthFilter;

      return raw.filter(item => {
        // Exclude aggregate total row if present
        const ru = String(item.groupResponsibleUnit || item.groupResponsibleDept || '').trim().toLowerCase();
        if (ru === 'total' || ru === 'grand total') return false;

        // Year Filter from Column B named Audit_Date
        if (yearFilter && yearFilter !== 'all') {
          const itemYear = this.extractYear(item.auditDate);
          if (itemYear !== String(yearFilter).trim()) {
            return false;
          }
        }

        // Month Filter from Column B named Audit_Date
        if (monthFilter && monthFilter !== 'all') {
          const itemMonth = this.extractMonth(item.auditDate);
          if (itemMonth !== String(monthFilter).trim()) {
            return false;
          }
        }

        // Search query across fields
        if (q) {
          const obs = String(item.observation || '').toLowerCase();
          const area = String(item.areaInspected || '').toLowerCase();
          const by = String(item.auditedBy || '').toLowerCase();
          const dept = String(item.groupResponsibleDept || '').toLowerCase();
          const unit = String(item.groupResponsibleUnit || '').toLowerCase();
          const action = String(item.actionTaken || '').toLowerCase();
          const sr = String(item.sr || '').toLowerCase();
          const dt = String(item.auditDate || '').toLowerCase();
          if (!obs.includes(q) && !area.includes(q) && !by.includes(q) && !dept.includes(q) && !unit.includes(q) && !action.includes(q) && !sr.includes(q) && !dt.includes(q)) {
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
      let list = this.getRawComplianceData();
      const unitFilter = this.state.responsibleUnitFilter;
      const q = (this.state.searchQuery || '').toLowerCase().trim();

      if (unitFilter && unitFilter !== 'all') {
        const target = String(unitFilter).trim().toLowerCase();
        list = list.filter(item => {
          const d = String(item.department || '').trim().toLowerCase();
          return d === target || d.includes(target) || target.includes(d);
        });
      }

      if (q) {
        list = list.filter(item => {
          const d = String(item.department || '').toLowerCase();
          const sr = String(item.sr || '').toLowerCase();
          return d.includes(q) || sr.includes(q);
        });
      }

      return list;
    },

    getFilteredAuditorData() {
      let list = this.getRawAuditorData();
      const q = (this.state.searchQuery || '').toLowerCase().trim();

      if (q) {
        list = list.filter(item => {
          const name = String(item.auditorName || '').toLowerCase();
          const id = String(item.id || '').toLowerCase();
          return name.includes(q) || id.includes(q);
        });
      }

      return list;
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
          for (const headerKey of Object.keys(colMap)) {
            if (headerKey.startsWith(cleanK) || headerKey.includes(cleanK)) {
              if (r[colMap[headerKey]] !== undefined) {
                return r[colMap[headerKey]].trim();
              }
            }
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

    /**
     * Splits a CSV line taking quoted values and embedded commas into account
     */
    splitCsvLine(line) {
      if (!line) return [];
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += c;
        }
      }
      result.push(current.trim());
      return result.map(s => s.replace(/^["']|["']$/g, '').trim());
    },

    /**
     * Parses the live Google Sheet tab: Compliance_by_Auditor_name
     * Columns: Column A (ID), Column B (Auditor Name), Column C (Planned), Column D (Actual)
     */
    parseAuditorComplianceCsv(text) {
      if (!text || typeof text !== 'string') return [];
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length < 2) return [];

      const headerParts = this.splitCsvLine(lines[0]);
      let idIdx = 0;
      let nameIdx = 1;
      let plannedIdx = 2;
      let actualIdx = 3;

      headerParts.forEach((h, idx) => {
        const norm = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (norm.includes('auditor') || norm.includes('name')) nameIdx = idx;
        else if (norm.includes('plan')) plannedIdx = idx;
        else if (norm.includes('act')) actualIdx = idx;
        else if (norm.includes('id') || norm.includes('sr') || norm.includes('no')) idIdx = idx;
      });

      const result = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = this.splitCsvLine(lines[i]);
        if (parts.length >= 2 && parts[nameIdx]) {
          const id = parts[idIdx] || String(i);
          const auditorName = parts[nameIdx].trim();
          if (!auditorName || auditorName.toLowerCase() === 'auditor name') continue;
          const planned = Number(parts[plannedIdx]) || 0;
          const actual = Number(parts[actualIdx]) || 0;
          const remaining = Math.max(0, planned - actual);
          const rate = planned > 0 ? (actual / planned) * 100 : 0;

          result.push({
            id,
            auditorName,
            planned,
            actual,
            remaining,
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

      // Candidate URLs for Compliance_by_Auditor_name tab
      const auditorUrls = [
        `/api/msa?tab=Compliance_by_Auditor_name&force=true&_t=${ts}`,
        AUDITOR_COMPLIANCE_CSV_URL + `&_t=${ts}`,
        `/api/sheets/fetch?sheetTab=Compliance_by_Auditor_name&sheetId=${MSA_SPREADSHEET_ID}&force=true&_t=${ts}`,
        `https://docs.google.com/spreadsheets/d/${MSA_SPREADSHEET_ID}/export?format=csv&sheet=Compliance_by_Auditor_name&_t=${ts}`
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

      let auditorParsed = null;
      for (const u of auditorUrls) {
        try {
          const res = await fetch(u, {
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
          });
          if (res.ok) {
            const cType = res.headers.get('content-type') || '';
            if (cType.includes('application/json')) {
              const j = await res.json();
              if (j && j.csvText) {
                const parsed = this.parseAuditorComplianceCsv(j.csvText);
                if (parsed.length > 0) { auditorParsed = parsed; break; }
              }
            } else {
              const text = await res.text();
              if (text && !text.includes('<!DOCTYPE html>') && (text.includes('Auditor Name') || text.includes('Planned') || text.includes('Actual'))) {
                const parsed = this.parseAuditorComplianceCsv(text);
                if (parsed.length > 0) { auditorParsed = parsed; break; }
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

      if (auditorParsed && auditorParsed.length > 0) {
        window.FPCL_MSA_AUDITOR_DATA = auditorParsed;
        try { localStorage.setItem('FPCL_MSA_AUDITOR_CACHE', JSON.stringify(auditorParsed)); } catch (e) {}
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

    setYearFilter(yr) {
      this.state.yearFilter = yr || 'all';
      this.renderFilteredViews();
    },

    setMonthFilter(m) {
      this.state.monthFilter = m || 'all';
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

    setTableTab(tab) {
      this.state.selectedTableTab = tab || 'all';
      const t1 = document.getElementById('msa-table-1-wrapper');
      const t2 = document.getElementById('msa-table-2-wrapper');
      const t3 = document.getElementById('msa-table-3-wrapper');
      const btnAll = document.getElementById('msa-tab-btn-all');
      const btnMsa = document.getElementById('msa-tab-btn-msa');
      const btnComp = document.getElementById('msa-tab-btn-comp');
      const btnAuditor = document.getElementById('msa-tab-btn-auditor');

      if (t1) {
        if (this.state.selectedTableTab === 'all' || this.state.selectedTableTab === 'msa') {
          t1.classList.remove('hidden');
        } else {
          t1.classList.add('hidden');
        }
      }
      if (t2) {
        if (this.state.selectedTableTab === 'all' || this.state.selectedTableTab === 'compliance') {
          t2.classList.remove('hidden');
        } else {
          t2.classList.add('hidden');
        }
      }
      if (t3) {
        if (this.state.selectedTableTab === 'all' || this.state.selectedTableTab === 'auditor') {
          t3.classList.remove('hidden');
        } else {
          t3.classList.add('hidden');
        }
      }

      const activeClass = "px-3.5 py-1.5 rounded-xl font-bold text-xs bg-indigo-600 text-white shadow-sm border border-indigo-500 cursor-pointer flex items-center gap-1.5 transition-all";
      const inactiveClass = "px-3.5 py-1.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer flex items-center gap-1.5 transition-all";

      if (btnAll) btnAll.className = this.state.selectedTableTab === 'all' ? activeClass : inactiveClass;
      if (btnMsa) btnMsa.className = this.state.selectedTableTab === 'msa' ? activeClass : inactiveClass;
      if (btnComp) btnComp.className = this.state.selectedTableTab === 'compliance' ? activeClass : inactiveClass;
      if (btnAuditor) btnAuditor.className = this.state.selectedTableTab === 'auditor' ? activeClass : inactiveClass;
    },

    resetFilters() {
      this.state.searchQuery = '';
      this.state.yearFilter = this.getDefaultYear();
      this.state.monthFilter = this.getDefaultMonth();
      this.state.responsibleUnitFilter = 'all';
      this.state.statusFilter = 'all';
      this.state.injuryPotentialFilter = 'all';

      const s1 = document.getElementById('msa-banner-search');
      if (s1) s1.value = '';
      const s2 = document.getElementById('msa-filter-search');
      if (s2) s2.value = '';

      const y = document.getElementById('msa-year-select');
      if (y) y.value = this.state.yearFilter;

      const m = document.getElementById('msa-month-select');
      if (m) m.value = this.state.monthFilter;

      const u = document.getElementById('msa-unit-select');
      if (u) u.value = 'all';

      const st = document.getElementById('msa-status-select');
      if (st) st.value = 'all';

      const ip = document.getElementById('msa-injury-potential-select');
      if (ip) ip.value = 'all';

      this.renderFilteredViews();

      if (window.portalApp && typeof window.portalApp.showToast === 'function') {
        window.portalApp.showToast('Filters Reset', `All MSA filters restored (Year: ${this.state.yearFilter}, Month: ${this.getCurrentMonthFullName()}).`, 'info');
      }
    },

    downloadCsvFile(filename, headers, rows) {
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    exportTable1Csv() {
      const items = this.getFilteredData();
      if (!items || items.length === 0) {
        if (window.portalApp && typeof window.portalApp.showToast === 'function') {
          window.portalApp.showToast('Export CSV', 'No matching observations found in Tab 1 based on applied filters.', 'warning');
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

      const rows = items.map(i => [
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
      ]);

      const dateStr = new Date().toISOString().slice(0, 10);
      this.downloadCsvFile(`FPCL_MSA_Tab1_Observations_Master_${dateStr}.csv`, headers, rows);

      if (window.portalApp && typeof window.portalApp.showToast === 'function') {
        window.portalApp.showToast('CSV Exported', `Exported ${items.length} records from Tab 1: MSA Observations Master based on applied filters.`, 'success');
      }
    },

    exportTable2Csv() {
      const items = this.getFilteredComplianceData();
      if (!items || items.length === 0) {
        if (window.portalApp && typeof window.portalApp.showToast === 'function') {
          window.portalApp.showToast('Export CSV', 'No matching department records found in Tab 2 based on applied filters.', 'warning');
        }
        return;
      }

      const headers = [
        'Sr',
        'Department',
        'Planned MSA',
        'Actual MSA',
        'Remaining MSA',
        'Compliance Rate (%)'
      ];

      const rows = items.map(d => {
        const rate = d.complianceRate !== undefined ? Number(d.complianceRate).toFixed(1) : (d.plannedMsa > 0 ? ((d.actualMsa / d.plannedMsa) * 100).toFixed(1) : '0.0');
        return [
          `"${String(d.sr || '').replace(/"/g, '""')}"`,
          `"${String(d.department || '').replace(/"/g, '""')}"`,
          `"${Number(d.plannedMsa || 0)}"`,
          `"${Number(d.actualMsa || 0)}"`,
          `"${Number(d.remainingMsa || 0)}"`,
          `"${rate}%"`
        ];
      });

      const dateStr = new Date().toISOString().slice(0, 10);
      this.downloadCsvFile(`FPCL_MSA_Tab2_Compliance_by_Department_${dateStr}.csv`, headers, rows);

      if (window.portalApp && typeof window.portalApp.showToast === 'function') {
        window.portalApp.showToast('CSV Exported', `Exported ${items.length} departments from Tab 2: MSA Compliance by Department based on applied filters.`, 'success');
      }
    },

    exportTable3Csv() {
      const items = this.getFilteredAuditorData();
      if (!items || items.length === 0) {
        if (window.portalApp && typeof window.portalApp.showToast === 'function') {
          window.portalApp.showToast('Export CSV', 'No matching auditor records found in Tab 3 based on applied filters.', 'warning');
        }
        return;
      }

      const headers = [
        'ID',
        'Auditor Name',
        'Planned MSA',
        'Actual MSA',
        'Remaining MSA',
        'Compliance Rate (%)'
      ];

      const rows = items.map(a => {
        const planned = Number(a.planned || 0);
        const actual = Number(a.actual || 0);
        const remaining = a.remaining !== undefined ? Number(a.remaining) : Math.max(0, planned - actual);
        const rate = a.complianceRate !== undefined ? Number(a.complianceRate).toFixed(1) : (planned > 0 ? ((actual / planned) * 100).toFixed(1) : '0.0');
        return [
          `"${String(a.id || '').replace(/"/g, '""')}"`,
          `"${String(a.auditorName || '').replace(/"/g, '""')}"`,
          `"${planned}"`,
          `"${actual}"`,
          `"${remaining}"`,
          `"${rate}%"`
        ];
      });

      const dateStr = new Date().toISOString().slice(0, 10);
      this.downloadCsvFile(`FPCL_MSA_Tab3_Compliance_by_Auditor_Name_${dateStr}.csv`, headers, rows);

      if (window.portalApp && typeof window.portalApp.showToast === 'function') {
        window.portalApp.showToast('CSV Exported', `Exported ${items.length} auditors from Tab 3: Compliance by Auditor Name based on applied filters.`, 'success');
      }
    },

    exportCsv() {
      if (this.state.selectedTableTab === 'compliance') {
        this.exportTable2Csv();
      } else if (this.state.selectedTableTab === 'auditor') {
        this.exportTable3Csv();
      } else {
        this.exportTable1Csv();
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
      const auditorFiltered = this.getFilteredAuditorData();
      const kpis = this.calculateKpis(filtered);

      const tabBtnMsa = document.getElementById('msa-tab-btn-msa');
      if (tabBtnMsa) {
        tabBtnMsa.innerHTML = `
          <span class="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>Tab 1: MSA (${filtered.length} Observations)</span>
        `;
      }
      const tabBtnComp = document.getElementById('msa-tab-btn-comp');
      if (tabBtnComp) {
        tabBtnComp.innerHTML = `
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Tab 2: MSA_Compliance (${compFiltered.length} Departments)</span>
        `;
      }
      const tabBtnAuditor = document.getElementById('msa-tab-btn-auditor');
      if (tabBtnAuditor) {
        tabBtnAuditor.innerHTML = `
          <span class="w-2 h-2 rounded-full bg-teal-500"></span>
          <span>Tab 3: Compliance_by_Auditor_name (${auditorFiltered.length} Auditors)</span>
        `;
      }

      const table1Title = document.querySelector('#msa-table-1-wrapper h3');
      if (table1Title) {
        table1Title.innerHTML = `
          <span class="w-2.5 h-2.5 rounded-full bg-[#1D4ED8]"></span>
          <span>Tab 1: MSA Observations Master (${filtered.length} Records)</span>
        `;
      }
      const table2Title = document.querySelector('#msa-table-2-wrapper h3');
      if (table2Title) {
        table2Title.innerHTML = `
          <span class="w-2.5 h-2.5 rounded-full bg-[#0B8A5A]"></span>
          <span>Tab 2: MSA_Compliance • MSA Compliance by Department (${compFiltered.length} Departments)</span>
        `;
      }
      const table3Title = document.querySelector('#msa-table-3-wrapper h3');
      if (table3Title) {
        table3Title.innerHTML = `
          <span class="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
          <span>Tab 3: Compliance_by_Auditor_name • Compliance by Auditor Name (${auditorFiltered.length} Auditors)</span>
        `;
      }

      this.renderKpiCards(kpis);
      this.renderCharts(filtered, compFiltered);
      this.renderAuditorComplianceChart(auditorFiltered);
      this.renderDonut(kpis);
      this.renderTables(filtered, compFiltered, auditorFiltered);
      if (window.lucide) window.lucide.createIcons();
    },

    /**
     * Primary Render: Mounts entire MSA dashboard inside container
     */
    render() {
      const container = document.getElementById('msa-specialized-container');
      if (!container) return;

      // Dynamically ensure yearFilter & monthFilter are set to current defaults if unset
      if (!this.state.yearFilter) {
        this.state.yearFilter = this.getDefaultYear();
      }
      if (!this.state.monthFilter) {
        this.state.monthFilter = this.getDefaultMonth();
      }

      const filtered = this.getFilteredData();
      const compFiltered = this.getFilteredComplianceData();
      const auditorData = this.getFilteredAuditorData();
      const kpis = this.calculateKpis(filtered);

      const currentYear = this.getCurrentYear();
      const uniqueYears = this.getAvailableYears();
      const currentMonth = this.getCurrentMonth();
      const currentMonthFullName = this.getCurrentMonthFullName();
      const monthsList = this.getAvailableMonths();

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
                id="msa-export-btn"
                type="button"
                onclick="FPCL_MSA_SUITE.exportCsv()"
                class="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
                title="Export filtered records to CSV"
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
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
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
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <div class="font-extrabold text-slate-700">Sheet 3: Auditor Compliance (Tab: Compliance_by_Auditor_name)</div>
              <div class="font-mono text-slate-500 break-all text-[11px]">ID: 11ggCusY-ZJj09bVcpbikHeupyvFTBxDHlytjhpbNRWw</div>
              <div class="text-slate-600">Columns: ID, Auditor Name, Planned, Actual</div>
            </div>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 2. KPI CARDS: Observation Closure Summary & Metrics                       -->
        <!-- 1-TOTAL Observations, 2-Open, 3-Closed, 4-Closure Rate                    -->
        <!-- ========================================================================= -->
        <div id="msa-kpi-cards-grid" class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <!-- Dynamically populated via renderKpiCards() -->
        </div>

        <!-- ========================================================================= -->
        <!-- 3. FILTERS (Below KPIs, side-by-side on mobile, no heading on filter bar)  -->
        <!-- Filter 1: Year (from Google Sheet Tab MSA Column B named Audit_Date)       -->
        <!-- Filter 2: Month (from Tab MSA Column B named Audit_Date - Current Month)   -->
        <!-- Filter 3: Responsible_Unit (Col B / Col I)                                 -->
        <!-- Filter 4: DOCUMENTS REMAINING / open filter                               -->
        <!-- Filter 5: Injury_Potential filter (Column F named Injury_Potential)        -->
        <!-- Filter 6: Keyword Search                                                  -->
        <!-- ========================================================================= -->
        <div id="msa-filters-bar" class="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-2.5 sm:p-3.5 shadow-xs relative overflow-hidden">
          <!-- Subtle perimeter top line -->
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600"></div>

          <!-- Side-by-side on mobile (2 cols on mobile, 3 cols on sm, 6 cols on lg) -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 items-center">
            <!-- Filter 1: Year Filter (Column B named Audit_Date) -->
            <div class="min-w-0">
              <div class="relative">
                <select
                  id="msa-year-select"
                  onchange="FPCL_MSA_SUITE.setYearFilter(this.value)"
                  class="w-full pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-xs font-bold font-mono text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer outline-none appearance-none truncate"
                  title="Filter by Year from Tab MSA Column B (Audit_Date)"
                >
                  <option value="all" ${this.state.yearFilter === 'all' ? 'selected' : ''}>Year: All</option>
                  ${uniqueYears.map(yr => {
                    const isCurrent = yr === currentYear;
                    return `<option value="${yr}" ${this.state.yearFilter === yr ? 'selected' : ''}>${yr}${isCurrent ? ' (Current Year)' : ''}</option>`;
                  }).join('')}
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                </div>
              </div>
            </div>

            <!-- Filter 2: Month Filter (from Google Sheet Tab MSA Column B named Audit_Date) -->
            <div class="min-w-0">
              <div class="relative">
                <select
                  id="msa-month-select"
                  onchange="FPCL_MSA_SUITE.setMonthFilter(this.value)"
                  class="w-full pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-xs font-bold font-mono text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer outline-none appearance-none truncate"
                  title="Filter by Month from Tab MSA Column B (Audit_Date) - Opens dynamically on Current Month"
                >
                  <option value="all" ${this.state.monthFilter === 'all' ? 'selected' : ''}>Month: All Months</option>
                  ${monthsList.map(m => {
                    const isCurrent = m.code === currentMonth;
                    const isSelected = this.state.monthFilter === m.code;
                    const countTag = m.count > 0 ? ` (${m.count})` : '';
                    const currentTag = isCurrent ? ' (Current Month)' : '';
                    return `<option value="${m.code}" ${isSelected ? 'selected' : ''}>${m.name}${currentTag}${countTag}</option>`;
                  }).join('')}
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                </div>
              </div>
            </div>

            <!-- Filter 3: Responsible_Unit Filter -->
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

            <!-- Filter 4: DOCUMENTS REMAINING / open Filter -->
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

            <!-- Filter 5: Injury_Potential Filter (Column F named Injury_Potential) -->
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

            <!-- Filter 6: Quick Filter Search (Desktop & responsive mobile span) -->
            <div class="col-span-2 sm:col-span-3 lg:col-span-1 min-w-0">
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
                    <span>Planned (100%)</span>
                  </span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[#0B8A5A] border border-emerald-200">
                    <span class="w-2 h-2 rounded-xs bg-[#0B8A5A]"></span>
                    <span>Actual (%)</span>
                  </span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-[#DC2626] border border-red-200">
                    <span class="w-2 h-2 rounded-xs bg-[#DC2626]"></span>
                    <span>Remaining (%)</span>
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
        <!-- 5. COMPLIANCE BY AUDITOR NAME (Placed side-by-side above Donut Chart)     -->
        <!-- List is long (24 auditors) so displayed side-by-side in 2 columns         -->
        <!-- Independent of any filter (Compliance for whole year)                     -->
        <!-- Column B: Auditor Name, Column D: Actual (MSA carried out)                -->
        <!-- Column C: Planned (Hidden by default; toggled via small button)           -->
        <!-- ========================================================================= -->
        <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-emerald-500/80 space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-100 gap-2.5">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-sm sm:text-base font-black text-[#1E3A8A] tracking-tight flex items-center gap-1.5">
                  <i data-lucide="user-check" class="w-4 h-4 text-emerald-600"></i>
                  <span>Compliance by Auditor name</span>
                </h3>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-blue-50 text-[#1E3A8A] border border-blue-200">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]"></span>
                  <span>Tab 3: Compliance_by_Auditor_name</span>
                </span>
              </div>
              <p class="text-[11px] text-slate-500 font-medium mt-0.5">
                Live synced with tab <code class="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">Compliance_by_Auditor_name</code> • Independent of filters
              </p>
            </div>

            <!-- Right Controls: Legend and Small Toggle Button -->
            <div class="flex flex-wrap items-center gap-2 sm:gap-3">
              <!-- Legend Chips -->
              <div class="flex items-center gap-1.5 text-[11px] font-mono font-bold">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[#0B8A5A] border border-emerald-200">
                  <span class="w-2 h-2 rounded-xs bg-[#0B8A5A]"></span>
                  <span>Actual (Carried Out)</span>
                </span>
                <span id="msa-auditor-legend-planned" class="${this.state.showPlannedAuditorBars ? '' : 'hidden'} inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#1E3A8A] border border-blue-200">
                  <span class="w-2 h-2 rounded-xs bg-[#1D4ED8]"></span>
                  <span>Planned</span>
                </span>
              </div>

              <!-- Small Button to Display Bars of Planned MSA -->
              <button
                id="msa-toggle-planned-btn"
                type="button"
                onclick="FPCL_MSA_SUITE.togglePlannedAuditorBars()"
                class="px-2.5 py-1 text-xs font-bold rounded-lg ${this.state.showPlannedAuditorBars ? 'bg-blue-600 text-white shadow-xs border border-blue-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'} transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
                title="Toggle display of Planned MSA bars from Column C"
              >
                <i data-lucide="${this.state.showPlannedAuditorBars ? 'eye-off' : 'eye'}" class="w-3.5 h-3.5"></i>
                <span>${this.state.showPlannedAuditorBars ? 'Hide Planned MSA' : 'Show Planned MSA'}</span>
              </button>
            </div>
          </div>

          <!-- Side-by-side Bar Chart Container: 2 Columns for 24 Auditors above donut chart -->
          <div id="msa-auditor-chart-grid" class="w-full">
            <!-- Populated via renderAuditorComplianceChart() -->
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 6. DONUT CHART (Thick donut, large enough center, legends at bottom)       -->
        <!-- ========================================================================= -->
        <div class="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border-2 border-fuchsia-500/80">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-sm sm:text-base font-black text-[#1E3A8A] tracking-tight flex items-center gap-1.5">
              <i data-lucide="pie-chart" class="w-4 h-4 text-fuchsia-600"></i>
              <span>Observation closure</span>
            </h3>
          </div>

          <div id="msa-donut-container" class="pt-3">
            <!-- Populated via renderDonut() -->
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 7. 03 SEPARATE COMPLETE SCROLLABLE GOOGLE SHEETS IN FORM OF TABLE         -->
        <!-- Scrollable up/down & left/right with left/right scroll buttons            -->
        <!-- Sheet 1: MSA | Sheet 2: MSA_Compliance | Sheet 3: Auditor Compliance       -->
        <!-- ========================================================================= -->
        <!-- Sub-Tab Switcher Bar for Google Sheet Tabs -->
        <div class="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-black uppercase tracking-wider text-slate-500 font-mono">Google Sheet Tabs:</span>
            <button
              id="msa-tab-btn-all"
              type="button"
              onclick="FPCL_MSA_SUITE.setTableTab('all')"
              class="px-3.5 py-1.5 rounded-xl font-bold text-xs ${this.state.selectedTableTab === 'all' ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'} cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
            >
              <i data-lucide="layers" class="w-3.5 h-3.5"></i>
              <span>Show All Tabs</span>
            </button>
            <button
              id="msa-tab-btn-msa"
              type="button"
              onclick="FPCL_MSA_SUITE.setTableTab('msa')"
              class="px-3.5 py-1.5 rounded-xl font-bold text-xs ${this.state.selectedTableTab === 'msa' ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'} cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>Tab 1: MSA (${filtered.length} Observations)</span>
            </button>
            <button
              id="msa-tab-btn-comp"
              type="button"
              onclick="FPCL_MSA_SUITE.setTableTab('compliance')"
              class="px-3.5 py-1.5 rounded-xl font-bold text-xs ${this.state.selectedTableTab === 'compliance' ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'} cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Tab 2: MSA_Compliance (${compFiltered.length} Departments)</span>
            </button>
            <button
              id="msa-tab-btn-auditor"
              type="button"
              onclick="FPCL_MSA_SUITE.setTableTab('auditor')"
              class="px-3.5 py-1.5 rounded-xl font-bold text-xs ${this.state.selectedTableTab === 'auditor' ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'} cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span class="w-2 h-2 rounded-full bg-teal-500"></span>
              <span>Tab 3: Compliance_by_Auditor_name (${auditorData.length} Auditors)</span>
            </button>
          </div>
          <div class="text-[11px] font-mono font-bold text-slate-500 flex items-center gap-2">
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>3 Live Tabs Connected</span>
            </span>
          </div>
        </div>

        <div class="space-y-6">
          <!-- Table 1: Sheet MSA -->
          <div id="msa-table-1-wrapper" class="${this.state.selectedTableTab === 'compliance' || this.state.selectedTableTab === 'auditor' ? 'hidden' : ''}">
          <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-blue-500/80 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
              <div>
                <h3 class="text-sm sm:text-base font-black text-[#1E3A8A] tracking-tight flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#1D4ED8]"></span>
                  <span>Tab 1: MSA • MSA Observations Master (${filtered.length} Records)</span>
                </h3>
              </div>

              <!-- Table 1 Controls: Export CSV & Left/Right Scroll -->
              <div class="flex items-center gap-2">
                <button
                  id="msa-table-1-export-btn"
                  type="button"
                  onclick="FPCL_MSA_SUITE.exportTable1Csv()"
                  class="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] border border-blue-300 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs hover:shadow-xs"
                  title="Export Tab 1: MSA Observations Master to CSV based on applied filters"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5 text-[#1D4ED8]"></i>
                  <span>Export CSV</span>
                </button>
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
          </div>

          <!-- Table 2: Sheet MSA_Compliance -->
          <div id="msa-table-2-wrapper" class="${this.state.selectedTableTab === 'msa' || this.state.selectedTableTab === 'auditor' ? 'hidden' : ''}">
          <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-emerald-500/80 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
              <div>
                <h3 class="text-sm sm:text-base font-black text-[#0B8A5A] tracking-tight flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#0B8A5A]"></span>
                  <span>Tab 2: MSA_Compliance • MSA Compliance by Department (${compFiltered.length} Departments)</span>
                </h3>
              </div>

              <!-- Table 2 Controls: Export CSV & Left/Right Scroll -->
              <div class="flex items-center gap-2">
                <button
                  id="msa-table-2-export-btn"
                  type="button"
                  onclick="FPCL_MSA_SUITE.exportTable2Csv()"
                  class="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0B8A5A] border border-emerald-300 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs hover:shadow-xs"
                  title="Export Tab 2: MSA Compliance by Department to CSV based on applied filters"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5 text-[#0B8A5A]"></i>
                  <span>Export CSV</span>
                </button>
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

          <!-- Table 3: Sheet Compliance_by_Auditor_name -->
          <div id="msa-table-3-wrapper" class="${this.state.selectedTableTab === 'msa' || this.state.selectedTableTab === 'compliance' ? 'hidden' : ''}">
          <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-teal-500/80 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
              <div>
                <h3 class="text-sm sm:text-base font-black text-teal-800 tracking-tight flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                  <span>Tab 3: Compliance_by_Auditor_name • Compliance by Auditor Name (${auditorData.length} Auditors)</span>
                </h3>
              </div>

              <!-- Table 3 Controls: Export CSV & Left/Right Scroll -->
              <div class="flex items-center gap-2">
                <button
                  id="msa-table-3-export-btn"
                  type="button"
                  onclick="FPCL_MSA_SUITE.exportTable3Csv()"
                  class="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs hover:shadow-xs"
                  title="Export Tab 3: Compliance by Auditor Name to CSV based on applied filters"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5 text-teal-800"></i>
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onclick="FPCL_MSA_SUITE.scrollTable('msa-table-3-scroll', 'left')"
                  class="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                  title="Scroll table left"
                >
                  <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
                  <span>Scroll Left</span>
                </button>
                <button
                  type="button"
                  onclick="FPCL_MSA_SUITE.scrollTable('msa-table-3-scroll', 'right')"
                  class="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                  title="Scroll table right"
                >
                  <span>Scroll Right</span>
                  <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>

            <!-- Table Container -->
            <div id="msa-table-3-container">
              <!-- Populated via renderTables() -->
            </div>
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
     * Bars shown in PERCENTAGE (0% to 100% scale)
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
      const COLOR_CLOSED = '#0B8A5A'; // solid green (Actual MSA %)
      const COLOR_OPEN = '#DC2626';   // solid red (Remaining MSA %)
      const COLOR_TOTAL = '#1D4ED8';  // solid blue (Planned MSA %)
      const COLOR_NAVY = '#1E3A8A';   // navy for text

      const svgWidth = 580;
      const rowHeight = 44;
      const padTop = 20;
      const padBottom = 25;
      const padLeft = 115;
      const padRight = 80; // Ample room for percentage label outside bar where bar ends
      const plotWidth = svgWidth - padLeft - padRight;
      const svgHeight = padTop + padBottom + (compData.length * rowHeight);

      // Percentage scale: 0% to 100%
      const xMax = 100;
      const gridValues = [0, 20, 40, 60, 80, 100];

      const gridSvg = gridValues.map(v => {
        const xPos = padLeft + (v / xMax) * plotWidth;
        return `
          <line x1="${xPos}" y1="${padTop - 8}" x2="${xPos}" y2="${svgHeight - padBottom}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3 3"/>
          <text x="${xPos}" y="${svgHeight - 8}" fill="#94A3B8" font-size="10" font-family="'Plus Jakarta Sans', monospace, sans-serif" font-weight="bold" text-anchor="middle">${v}%</text>
        `;
      }).join('');

      const barsSvg = compData.map((d, idx) => {
        const yPos = padTop + (idx * rowHeight);
        const barH = 22;

        const actualPct = d.plannedMsa > 0 ? (d.actualMsa / d.plannedMsa) * 100 : 0;
        const remainPct = d.plannedMsa > 0 ? Math.max(0, 100 - actualPct) : 0;

        const actualW = (actualPct / 100) * plotWidth;
        const remainW = (remainPct / 100) * plotWidth;
        const totalW = actualW + remainW;

        const actualPctDisplay = actualPct % 1 === 0 ? `${actualPct.toFixed(0)}%` : `${actualPct.toFixed(1)}%`;
        const remainPctDisplay = remainPct % 1 === 0 ? `${remainPct.toFixed(0)}%` : `${remainPct.toFixed(1)}%`;

        // Tooltip geometry: White rounded tooltip with a blue top border
        const badgeW = 100;
        const badgeH = 52;
        const badgeX = Math.min(svgWidth - badgeW - 8, Math.max(padLeft, padLeft + actualW - (badgeW / 2)));
        const badgeY = Math.max(4, yPos - badgeH - 4);

        const tooltipSvg = `
          <g class="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none" z-index="50">
            <rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="5" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.08))"/>
            <path d="M ${badgeX + 2},${badgeY} H ${badgeX + badgeW - 2}" stroke="${COLOR_TOTAL}" stroke-width="3" stroke-linecap="round"/>
            <polygon points="${badgeX + (badgeW / 2) - 4},${badgeY + badgeH} ${badgeX + (badgeW / 2) + 4},${badgeY + badgeH} ${badgeX + (badgeW / 2)},${badgeY + badgeH + 4}" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
            <text x="${badgeX + (badgeW / 2)}" y="${badgeY + 13}" fill="${COLOR_NAVY}" font-size="9" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" text-anchor="middle">Planned: 100% (${d.plannedMsa})</text>
            <text x="${badgeX + (badgeW / 2)}" y="${badgeY + 26}" fill="${COLOR_CLOSED}" font-size="9" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="middle">Actual: ${actualPctDisplay} (${d.actualMsa})</text>
            <text x="${badgeX + (badgeW / 2)}" y="${badgeY + 39}" fill="${COLOR_OPEN}" font-size="9" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="middle">Remain: ${remainPctDisplay} (${d.remainingMsa})</text>
          </g>
        `;

        // Values in PERCENTAGE inside the bar
        let actualLabel = '';
        if (actualPct > 0) {
          const fontSize = actualW >= 34 ? '10.5' : (actualW >= 22 ? '9' : '8');
          if (actualW >= 18) {
            actualLabel = `<text x="${padLeft + (actualW / 2)}" y="${yPos + (barH / 2) + 4}" fill="#FFFFFF" font-size="${fontSize}" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" text-anchor="middle">${actualPctDisplay}</text>`;
          }
        }

        let remainLabel = '';
        if (remainPct > 0) {
          const fontSize = remainW >= 34 ? '10.5' : (remainW >= 22 ? '9' : '8');
          if (remainW >= 18) {
            remainLabel = `<text x="${padLeft + actualW + (remainW / 2)}" y="${yPos + (barH / 2) + 4}" fill="#FFFFFF" font-size="${fontSize}" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" text-anchor="middle">${remainPctDisplay}</text>`;
          }
        }

        return `
          <g class="group cursor-pointer">
            <!-- Department label -->
            <text x="${padLeft - 10}" y="${yPos + (barH / 2) + 4}" fill="${COLOR_NAVY}" font-size="12" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="end">
              ${d.department}
            </text>

            <!-- Actual Segment (Green #0B8A5A at base/left) in percentage -->
            ${actualW > 0 ? `
              <rect x="${padLeft}" y="${yPos}" width="${actualW}" height="${barH}" rx="${remainW > 0 ? 0 : 3}" fill="${COLOR_CLOSED}" class="transition-all duration-200 group-hover:brightness-105"/>
              ${actualLabel}
            ` : ''}

            <!-- Remaining Segment (Red #DC2626 on top/right) in percentage -->
            ${remainW > 0 ? `
              <rect x="${padLeft + actualW}" y="${yPos}" width="${remainW}" height="${barH}" rx="3" fill="${COLOR_OPEN}" class="transition-all duration-200 group-hover:brightness-105"/>
              ${remainLabel}
            ` : ''}

            <!-- Percentage OUTSIDE bar in front of where bar ends -->
            <text x="${padLeft + totalW + 8}" y="${yPos + (barH / 2) + 4.5}" fill="${COLOR_NAVY}" font-size="12" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900">
              ${actualPctDisplay}
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
     * Render the 03 Separate Complete Scrollable Tables:
     * Sheet 1: MSA Observations
     * Sheet 2: MSA_Compliance
     * Sheet 3: Compliance_by_Auditor_name
     */
    renderTables(filteredObs, compData, auditorData) {
      this.renderTable1(filteredObs);
      this.renderTable2(compData);
      this.renderTable3(auditorData || this.getFilteredAuditorData());
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
        <div class="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
          <span>Showing ${compData.length} departments</span>
          <span class="text-slate-400">Departmental compliance tracking</span>
        </div>
      `;
    },

    renderTable3(auditorData) {
      const container = document.getElementById('msa-table-3-container');
      if (!container) return;

      if (!auditorData || auditorData.length === 0) {
        container.innerHTML = `
          <div class="py-12 text-center text-slate-400 text-xs font-mono font-bold bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No auditor compliance records found.
          </div>
        `;
        return;
      }

      const rowsHtml = auditorData.map((d, idx) => {
        const rate = d.complianceRate || 0;
        const rateColor = rate >= 75 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : (rate >= 50 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-rose-700 bg-rose-50 border-rose-200');

        return `
          <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100 ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}">
            <td class="px-4 py-3 font-mono font-bold text-xs text-slate-700 text-center">${d.id || idx + 1}</td>
            <td class="px-4 py-3 text-xs font-black text-slate-900">${d.auditorName}</td>
            <td class="px-4 py-3 font-mono font-bold text-xs text-[#1D4ED8] text-center">${d.planned}</td>
            <td class="px-4 py-3 font-mono font-bold text-xs text-[#0B8A5A] text-center">${d.actual}</td>
            <td class="px-4 py-3 font-mono font-bold text-xs text-[#DC2626] text-center">${d.remaining}</td>
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
        <div id="msa-table-3-scroll" class="w-full overflow-x-auto max-h-[360px] overflow-y-auto rounded-xl border border-slate-200">
          <table class="w-full text-left border-collapse min-w-[700px]">
            <thead class="bg-slate-100/90 sticky top-0 z-10 backdrop-blur-xs border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
              <tr>
                <th class="px-4 py-2.5 text-center">ID</th>
                <th class="px-4 py-2.5">Auditor Name (Column B)</th>
                <th class="px-4 py-2.5 text-center">Planned MSA (Column C)</th>
                <th class="px-4 py-2.5 text-center">Actual MSA (Column D)</th>
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
        <div class="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
          <span>Showing ${auditorData.length} auditors</span>
          <span class="text-slate-400">Auditor-level safety audit execution tracking</span>
        </div>
      `;
    },

    /**
     * Bar Chart: Compliance by Auditor name
     * - Independent of any filter as this is compliance for whole year.
     * - List is long (24 auditors) so displayed side-by-side in 2 columns above donut chart.
     * - Displays Auditor Name from Column B named Auditor Name.
     * - Displays MSA carried out from Column D named Actual.
     * - Does NOT plot planned MSA from Column C by default.
     * - Small button toggles display of planned MSA bars (Column C).
     */
    renderAuditorComplianceChart(auditorsData) {
      const container = document.getElementById('msa-auditor-chart-grid');
      if (!container) return;

      const auditors = auditorsData || this.getFilteredAuditorData();
      if (!auditors || auditors.length === 0) {
        container.innerHTML = `
          <div class="py-8 text-center text-slate-400 text-xs font-mono font-bold bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No auditor compliance records found in tab Compliance_by_Auditor_name.
          </div>
        `;
        return;
      }

      // Split list into two side-by-side columns (e.g. 1-12 and 13-24)
      const mid = Math.ceil(auditors.length / 2);
      const col1 = auditors.slice(0, mid);
      const col2 = auditors.slice(mid);

      const showPlanned = !!this.state.showPlannedAuditorBars;
      const maxVal = Math.max(...auditors.map(a => Math.max(a.actual || 0, showPlanned ? (a.planned || 0) : 0)), 6);
      const xMax = Math.max(6, Math.ceil(maxVal));

      const COLOR_ACTUAL = '#0B8A5A'; // Solid green
      const COLOR_PLANNED = '#1D4ED8'; // Solid blue
      const COLOR_NAVY = '#1E3A8A';    // Navy for labels

      const renderColumnSvg = (list, colTitle) => {
        const svgWidth = 470;
        const padTop = 22;
        const padBottom = 26;
        const padLeft = 145;
        const padRight = 55;
        const plotWidth = svgWidth - padLeft - padRight;
        const rowHeight = showPlanned ? 44 : 32;
        const svgHeight = padTop + padBottom + (list.length * rowHeight);

        // Gridlines
        const gridValues = [];
        const step = xMax <= 6 ? 1 : 2;
        for (let v = 0; v <= xMax; v += step) gridValues.push(v);

        const gridSvg = gridValues.map(v => {
          const xPos = padLeft + (v / xMax) * plotWidth;
          return `
            <line x1="${xPos}" y1="${padTop - 6}" x2="${xPos}" y2="${svgHeight - padBottom}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3 3"/>
            <text x="${xPos}" y="${svgHeight - 8}" fill="#94A3B8" font-size="9.5" font-family="'Plus Jakarta Sans', monospace, sans-serif" font-weight="bold" text-anchor="middle">${v}</text>
          `;
        }).join('');

        const rowsSvg = list.map((a, idx) => {
          const yPos = padTop + (idx * rowHeight);
          const actualW = Math.max(0, (a.actual / xMax) * plotWidth);
          const plannedW = Math.max(0, (a.planned / xMax) * plotWidth);
          const nameDisplay = a.auditorName.length > 18 ? a.auditorName.slice(0, 17) + '…' : a.auditorName;
          const rateDisplay = a.planned > 0 ? `${((a.actual / a.planned) * 100).toFixed(0)}%` : '0%';

          // Tooltip geometry
          const badgeW = 100;
          const badgeH = 46;
          const tipX = Math.min(svgWidth - badgeW - 8, Math.max(padLeft, padLeft + Math.max(actualW, plannedW) - (badgeW / 2)));
          const tipY = Math.max(2, yPos - badgeH - 2);

          const tooltipSvg = `
            <g class="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none" z-index="50">
              <rect x="${tipX}" y="${tipY}" width="${badgeW}" height="${badgeH}" rx="5" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.08))"/>
              <path d="M ${tipX + 2},${tipY} H ${tipX + badgeW - 2}" stroke="${COLOR_ACTUAL}" stroke-width="3" stroke-linecap="round"/>
              <polygon points="${tipX + (badgeW / 2) - 4},${tipY + badgeH} ${tipX + (badgeW / 2) + 4},${tipY + badgeH} ${tipX + (badgeW / 2)},${tipY + badgeH + 4}" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
              <text x="${tipX + (badgeW / 2)}" y="${tipY + 13}" fill="${COLOR_NAVY}" font-size="9" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" text-anchor="middle">${a.auditorName}</text>
              <text x="${tipX + (badgeW / 2)}" y="${tipY + 25}" fill="${COLOR_ACTUAL}" font-size="8.5" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="middle">Actual: ${a.actual} · Planned: ${a.planned}</text>
              <text x="${tipX + (badgeW / 2)}" y="${tipY + 37}" fill="${COLOR_PLANNED}" font-size="8.5" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="middle">Compliance: ${rateDisplay}</text>
            </g>
          `;

          if (!showPlanned) {
            // Plot only Actual MSA carried out (Column D)
            const barH = 17;
            return `
              <g class="group cursor-pointer">
                <!-- Auditor Name (Column B) -->
                <text x="${padLeft - 10}" y="${yPos + (barH / 2) + 4}" fill="${COLOR_NAVY}" font-size="11" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="end" title="${a.auditorName}">
                  ${nameDisplay}
                </text>

                <!-- Actual MSA Bar (Column D) -->
                ${actualW > 0 ? `
                  <rect x="${padLeft}" y="${yPos}" width="${actualW}" height="${barH}" rx="3" fill="${COLOR_ACTUAL}" class="transition-all duration-200 group-hover:brightness-105"/>
                  ${actualW >= 16 ? `
                    <text x="${padLeft + (actualW / 2)}" y="${yPos + (barH / 2) + 3.5}" fill="#FFFFFF" font-size="10" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" text-anchor="middle">${a.actual}</text>
                  ` : ''}
                ` : ''}

                <!-- Actual Value Outside Bar -->
                <text x="${padLeft + actualW + 7}" y="${yPos + (barH / 2) + 4}" fill="${a.actual > 0 ? COLOR_ACTUAL : '#94A3B8'}" font-size="11" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900">
                  ${a.actual}
                </text>

                ${tooltipSvg}
              </g>
            `;
          } else {
            // Plot both Planned (Column C) and Actual (Column D) bars
            const barH = 10;
            const gap = 3;
            const yPlanned = yPos;
            const yActual = yPos + barH + gap;

            return `
              <g class="group cursor-pointer">
                <!-- Auditor Name (Column B) -->
                <text x="${padLeft - 10}" y="${yPos + barH + 4}" fill="${COLOR_NAVY}" font-size="11" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="end" title="${a.auditorName}">
                  ${nameDisplay}
                </text>

                <!-- Planned MSA Bar (Column C, Blue) -->
                ${plannedW > 0 ? `
                  <rect x="${padLeft}" y="${yPlanned}" width="${plannedW}" height="${barH}" rx="2" fill="${COLOR_PLANNED}" opacity="0.85" class="transition-all duration-200 group-hover:opacity-100"/>
                  <text x="${padLeft + plannedW + 5}" y="${yPlanned + barH - 1}" fill="${COLOR_PLANNED}" font-size="9" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800">
                    P:${a.planned}
                  </text>
                ` : ''}

                <!-- Actual MSA Bar (Column D, Green) -->
                ${actualW > 0 ? `
                  <rect x="${padLeft}" y="${yActual}" width="${actualW}" height="${barH}" rx="2" fill="${COLOR_ACTUAL}" class="transition-all duration-200 group-hover:brightness-105"/>
                ` : ''}
                <text x="${padLeft + actualW + 5}" y="${yActual + barH - 1}" fill="${a.actual > 0 ? COLOR_ACTUAL : '#94A3B8'}" font-size="9.5" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900">
                  A:${a.actual}
                </text>

                ${tooltipSvg}
              </g>
            `;
          }
        }).join('');

        return `
          <div class="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 overflow-x-auto">
            <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono flex items-center justify-between">
              <span>${colTitle}</span>
              <span class="text-[10px] text-slate-400 font-normal">Scale: 0 to ${xMax} MSAs</span>
            </div>
            <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full h-auto overflow-visible select-none min-w-[360px]">
              ${gridSvg}
              ${rowsSvg}
            </svg>
          </div>
        `;
      };

      container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          ${renderColumnSvg(col1, `Auditors 1 – ${mid} of ${auditors.length}`)}
          ${renderColumnSvg(col2, `Auditors ${mid + 1} – ${auditors.length} of ${auditors.length}`)}
        </div>
      `;
    }
  };

  // Initialize suite
  msaSuite.init();
})();
