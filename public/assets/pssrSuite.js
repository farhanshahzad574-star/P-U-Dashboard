/**
 * FPCL Executive Operations & Compliance Portal
 * Pre-Startup Safety Review (PSSR) Executive BI Suite
 * 
 * Google Sheet ID: 1PjGP79SLOhTJwFv4tPyRJeX07XEW5e9OBFWQ4aUefyY
 * Sheet Tab: PSSR
 */

(function () {
  'use strict';

  const HARDCODED_PSSR_SHEET_ID = '1PjGP79SLOhTJwFv4tPyRJeX07XEW5e9OBFWQ4aUefyY';
  const HARDCODED_PSSR_SHEET_TAB = 'PSSR';
  const HARDCODED_PSSR_SHEET_URL = `https://docs.google.com/spreadsheets/d/${HARDCODED_PSSR_SHEET_ID}/export?format=csv&sheet=${HARDCODED_PSSR_SHEET_TAB}`;

  const pssrSuite = {
    state: {
      searchQuery: '',
      yearFilter: 'all',       // Year from Date_of_Initiator
      areaFilter: 'all',       // Column C
      deptFilter: 'all',       // Column M (Responsibility)
      statusFilter: 'all',     // Column O (Status)
      page: 1,
      pageSize: 'all',            // 'all' | 50 | 25 | 15 (Complete sheet view)
      isSyncing: false,
      lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      selectedFinding: null,
      searchExpanded: false,
      barSortMode: 'total',    // 'total' | 'open' | 'closed' | 'alpha'
      isTargetDatesModalOpen: false,
      targetDatesModalSearch: '',
      targetDatesModalYear: 'all',
      targetDatesModalDept: 'all',
      targetDatesModalArea: 'all'
    },

    init() {
      window.FPCL_PSSR_SUITE = this;

      // Fast-paint from localStorage cache if present
      try {
        const cached = localStorage.getItem('FPCL_PSSR_DATA_CACHE');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.FPCL_PSSR_DATA = parsed;
          }
        }
      } catch (e) {}

      // Fallback to initial authentic dataset
      if (!window.FPCL_PSSR_DATA || window.FPCL_PSSR_DATA.length === 0) {
        if (Array.isArray(window.FPCL_PSSR_INITIAL_DATA) && window.FPCL_PSSR_INITIAL_DATA.length > 0) {
          window.FPCL_PSSR_DATA = [...window.FPCL_PSSR_INITIAL_DATA];
        }
      }

      // Sync stats to overview
      this.syncStatsToOverview();

      // Background live sync on load
      setTimeout(() => {
        this.syncLiveFeed({ silent: true });
      }, 700);

      // Periodic auto-sync every 60 seconds
      if (!this._autoSyncTimer) {
        this._autoSyncTimer = setInterval(() => {
          this.syncLiveFeed({ silent: true });
        }, 60000);
      }
    },

    getRawData() {
      if (Array.isArray(window.FPCL_PSSR_DATA) && window.FPCL_PSSR_DATA.length > 0) {
        return window.FPCL_PSSR_DATA;
      }
      if (Array.isArray(window.FPCL_PSSR_INITIAL_DATA)) {
        return window.FPCL_PSSR_INITIAL_DATA;
      }
      return [];
    },

    /**
     * Determines whether a status string is closed
     */
    isClosedStatus(status) {
      const s = (status || '').toLowerCase().trim();
      return s === 'close' || s === 'closed';
    },

    /**
     * Normalizes department name (e.g. "P.E" -> "PE", "-" -> "Unassigned")
     */
    normalizeDept(dept) {
      if (!dept || dept.trim() === '' || dept.trim() === '-') return 'Unassigned';
      const clean = dept.trim();
      if (clean.toLowerCase() === 'p.e') return 'PE';
      return clean;
    },

    /**
     * Extracts 4-digit year from Date_of_Initiator (e.g. "26/Aug/25" -> "2025", "12/Feb/26" -> "2026")
     */
    extractYear(dateStr) {
      if (!dateStr || typeof dateStr !== 'string') return '';
      const clean = dateStr.trim();
      if (!clean || clean === '-' || clean === 'N/A') return '';

      // Case 1: 4-digit year like 2024, 2025, 2026 anywhere in string
      const fourDigitMatch = clean.match(/\b(19\d\d|20\d\d)\b/);
      if (fourDigitMatch) {
        return fourDigitMatch[1];
      }

      // Case 2: DD/MMM/YY or DD-MMM-YY, e.g., 26/Aug/25 or 12-Feb-26
      const parts = clean.split(/[\/\-\.\s]+/);
      if (parts.length >= 3) {
        const lastPart = parts[parts.length - 1].trim();
        if (/^\d{2}$/.test(lastPart)) {
          const yrNum = parseInt(lastPart, 10);
          return yrNum < 50 ? String(2000 + yrNum) : String(1900 + yrNum);
        }
        const firstPart = parts[0].trim();
        if (/^\d{4}$/.test(firstPart)) {
          return firstPart;
        }
      }

      // Case 3: JS Date parsing fallback
      const parsed = new Date(clean);
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        if (y >= 1990 && y <= 2100) return String(y);
      }

      return '';
    },

    /**
     * Filters dataset by Year (Date_of_Initiator), Area (Col C), Responsibility (Col M), Status (Col O), and Search Query
     */
    getFilteredData() {
      const raw = this.getRawData();
      const s = this.state;
      const q = s.searchQuery.toLowerCase().trim();

      return raw.filter(item => {
        // Year filter (from column Date_of_Initiator)
        if (s.yearFilter && s.yearFilter !== 'all') {
          const itemYear = this.extractYear(item.dateOfInitiator);
          if (itemYear !== s.yearFilter) {
            return false;
          }
        }

        // Area filter (Column C)
        if (s.areaFilter !== 'all') {
          if ((item.area || '').toLowerCase() !== s.areaFilter.toLowerCase()) {
            return false;
          }
        }

        // Responsibility / Department filter (Column M)
        if (s.deptFilter !== 'all') {
          const dept = this.normalizeDept(item.responsibility);
          if (dept.toLowerCase() !== s.deptFilter.toLowerCase()) {
            return false;
          }
        }

        // Status filter (Column O)
        if (s.statusFilter !== 'all') {
          const itemStatus = (item.status || '').toLowerCase().trim();
          const targetStatus = s.statusFilter.toLowerCase().trim();
          if (targetStatus === 'close' || targetStatus === 'closed') {
            if (!this.isClosedStatus(item.status)) return false;
          } else if (targetStatus === 'open') {
            if (this.isClosedStatus(item.status)) return false;
          } else {
            if (itemStatus !== targetStatus) return false;
          }
        }

        // Search Query filter
        if (q) {
          const matchId = (item.id || '').toLowerCase().includes(q);
          const matchFacility = (item.facilityDescription || '').toLowerCase().includes(q);
          const matchArea = (item.area || '').toLowerCase().includes(q);
          const matchUnit = (item.initiatorUnit || '').toLowerCase().includes(q);
          const matchDate = (item.dateOfInitiator || '').toLowerCase().includes(q);
          const matchYear = this.extractYear(item.dateOfInitiator).includes(q);
          const matchOwner = (item.areaOwner || '').toLowerCase().includes(q);
          const matchDef = (item.acDeficiencies || '').toLowerCase().includes(q);
          const matchResp = (item.responsibility || '').toLowerCase().includes(q);
          const matchStatus = (item.status || '').toLowerCase().includes(q);
          const matchTargetDate = (item.targetDate || '').toLowerCase().includes(q);
          const matchCompDate = (item.completionDate || '').toLowerCase().includes(q);
          const matchRemarks = (item.remarks || '').toLowerCase().includes(q);
          const matchClarification = (item.clarification || '').toLowerCase().includes(q);

          if (!matchId && !matchFacility && !matchArea && !matchUnit && !matchOwner &&
              !matchDef && !matchResp && !matchStatus && !matchDate && !matchYear && !matchTargetDate && !matchCompDate &&
              !matchRemarks && !matchClarification) {
            return false;
          }
        }

        return true;
      });
    },

    /**
     * Aggregates stats for KPI cards
     */
    getKPIs(dataset) {
      const data = dataset || this.getFilteredData();
      const total = data.length;
      let closed = 0;
      let open = 0;

      data.forEach(item => {
        if (this.isClosedStatus(item.status)) {
          closed++;
        } else {
          open++;
        }
      });

      const percentage = total > 0 ? ((closed / total) * 100).toFixed(1) + '%' : '0.0%';

      return {
        total,
        closed,
        open,
        percentage
      };
    },

    /**
     * Aggregates department data for horizontal stacked bar chart
     */
    getDepartmentSummary(dataset) {
      const data = dataset || this.getFilteredData();
      const map = {};

      data.forEach(item => {
        const dept = this.normalizeDept(item.responsibility);
        if (!map[dept]) {
          map[dept] = { dept, total: 0, closed: 0, open: 0 };
        }
        map[dept].total++;
        if (this.isClosedStatus(item.status)) {
          map[dept].closed++;
        } else {
          map[dept].open++;
        }
      });

      const list = Object.values(map);
      const mode = this.state.barSortMode || 'total';

      return list.sort((a, b) => {
        if (mode === 'open') {
          if (b.open !== a.open) return b.open - a.open;
          return b.total - a.total;
        }
        if (mode === 'closed') {
          if (b.closed !== a.closed) return b.closed - a.closed;
          return b.total - a.total;
        }
        if (mode === 'alpha') {
          return a.dept.localeCompare(b.dept);
        }
        // Default: Sort descending by total observations (matching attached image)
        if (b.total !== a.total) return b.total - a.total;
        return a.dept.localeCompare(b.dept);
      });
    },

    /**
     * Cycles through bar chart sorting modes (By Total -> By Open -> By Closed -> By Name)
     */
    cycleSortBarMode() {
      const modes = ['total', 'open', 'closed', 'alpha'];
      const curIdx = modes.indexOf(this.state.barSortMode || 'total');
      this.state.barSortMode = modes[(curIdx + 1) % modes.length];
      this.render();
    },

    /**
     * Synchronizes PSSR stats back to DASHBOARD_REGISTRY on Overview page
     */
    syncStatsToOverview() {
      const raw = this.getRawData();
      if (!raw || raw.length === 0) return;

      const total = raw.length;
      let closed = 0;
      raw.forEach(i => {
        if (this.isClosedStatus(i.status)) closed++;
      });
      const open = total - closed;
      const rate = total > 0 ? ((closed / total) * 100).toFixed(1) + '%' : '0.0%';

      if (window.DASHBOARD_REGISTRY) {
        const pssrEntry = window.DASHBOARD_REGISTRY.find(d => d.id === 'pssr');
        if (pssrEntry) {
          pssrEntry.status = 'Active';
          pssrEntry.hasSheetLink = true;
          pssrEntry.kpis = { total, closed, inProgress: open, overdue: 0, compliance: rate };
          pssrEntry.punchList = { open, closed, total, rate };
          pssrEntry.statusComment = `${total} PSSR observations tracked (${closed} Closed, ${open} Open, ${rate} Completion Rate).`;
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

    /**
     * Parses Google Sheet CSV text into structured records
     */
    parseCsv(csvText) {
      if (!csvText || typeof csvText !== 'string') return [];

      const rows = [];
      let curRow = [];
      let curVal = '';
      let inQuotes = false;

      for (let i = 0; i < csvText.length; i++) {
        const c = csvText[i];
        if (c === '"') {
          if (inQuotes && csvText[i + 1] === '"') {
            curVal += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          curRow.push(curVal);
          curVal = '';
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
          if (c === '\r' && csvText[i + 1] === '\n') i++;
          curRow.push(curVal);
          curVal = '';
          if (curRow.length > 1 || (curRow.length === 1 && curRow[0] !== '')) {
            rows.push(curRow);
          }
          curRow = [];
        } else {
          curVal += c;
        }
      }
      if (curVal || curRow.length > 0) {
        curRow.push(curVal);
        rows.push(curRow);
      }

      if (rows.length < 2) return [];

      // Dynamically locate column indices from header row for resilience
      const headers = rows[0] || [];
      const colMap = {};
      headers.forEach((h, idx) => {
        const key = String(h || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        colMap[key] = idx;
      });

      const getColIdx = (keys, fallbackIdx) => {
        for (const k of keys) {
          const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (colMap[cleanKey] !== undefined) return colMap[cleanKey];
        }
        return fallbackIdx;
      };

      const idIdx = getColIdx(['id'], 0);
      const facilityIdx = getColIdx(['facilitydescription', 'facility_description'], 1);
      const areaIdx = getColIdx(['area'], 2);
      const unitIdx = getColIdx(['initiatorunit', 'initiator_unit'], 3);
      const dateInitIdx = getColIdx(['dateofinitiator', 'date_of_initiator', 'dateinitiator', 'date_initiator'], 4);
      const areaOwnerIdx = getColIdx(['areaowner', 'area_owner'], 5);
      const formIdx = getColIdx(['shortlongform', 'short_long_form'], 6);
      const bcPointsIdx = getColIdx(['bcpoints', 'bc_points'], 7);
      const commAuthIdx = getColIdx(['commissiongauthorizationafterclosureofbcpoints', 'commissioningauth', 'commissioningauthorization'], 8);
      const signDateIdx = getColIdx(['signingdateofauthorization', 'signingdateauth'], 9);
      const numAcIdx = getColIdx(['numberofacpoints', 'numacpoints'], 10);
      const acDefIdx = getColIdx(['acdeficiencies', 'ac_deficiencies'], 11);
      const respIdx = getColIdx(['responsibility'], 12);
      const targetDateIdx = getColIdx(['targetdate', 'target_date'], 13);
      const statusIdx = getColIdx(['statusopenclose', 'status'], 14);
      const ext1Idx = getColIdx(['targetdate1stextensions', 'targetdate1stext'], 15);
      const ext2Idx = getColIdx(['targetdate2ndextensions', 'targetdate2ndext'], 16);
      const ext3Idx = getColIdx(['targetdate3rdextensions', 'targetdate3rdext'], 17);
      const compDateIdx = getColIdx(['completiondate', 'completion_date'], 18);
      const compRemarksIdx = getColIdx(['completionremarks', 'completion_remarks'], 19);
      const clarIdx = getColIdx(['clarification'], 20);
      const resp2Idx = getColIdx(['responsibility2'], 21);
      const remarksIdx = getColIdx(['remarks'], 22);

      const dataRows = rows.slice(1);
      return dataRows.map((r, idx) => ({
        rowIdx: idx + 1,
        id: (r[idIdx] || '').trim(),
        facilityDescription: (r[facilityIdx] || '').trim(),
        area: (r[areaIdx] || '').trim(),
        initiatorUnit: (r[unitIdx] || '').trim(),
        dateOfInitiator: (r[dateInitIdx] || '').trim(),
        areaOwner: (r[areaOwnerIdx] || '').trim(),
        shortLongForm: (r[formIdx] || '').trim(),
        bcPoints: (r[bcPointsIdx] || '').trim(),
        commissioningAuth: (r[commAuthIdx] || '').trim(),
        signingDateAuth: (r[signDateIdx] || '').trim(),
        numAcPoints: (r[numAcIdx] || '').trim(),
        acDeficiencies: (r[acDefIdx] || '').trim(),
        responsibility: (r[respIdx] || '').trim(),
        targetDate: (r[targetDateIdx] || '').trim(),
        status: (r[statusIdx] || '').trim(),
        targetDate1stExt: (r[ext1Idx] || '').trim(),
        targetDate2ndExt: (r[ext2Idx] || '').trim(),
        targetDate3rdExt: (r[ext3Idx] || '').trim(),
        completionDate: (r[compDateIdx] || '').trim(),
        completionRemarks: (r[compRemarksIdx] || '').trim(),
        clarification: (r[clarIdx] || '').trim(),
        responsibility2: (r[resp2Idx] || '').trim(),
        remarks: (r[remarksIdx] || '').trim()
      }));
    },

    /**
     * Live sync feed from Google Sheet
     */
    async syncLiveFeed(options = {}) {
      const silent = options.silent || false;
      this.state.isSyncing = true;
      this.renderSyncButtonState(true);

      try {
        let csvText = '';

        // Attempt 1: Fetch through serverless proxy with live sheetTab PSSR
        try {
          const resp = await fetch('/api/sheets/fetch?sheetTab=PSSR&tileId=pssr', {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache, no-store' }
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.success && data.csvText) {
              csvText = data.csvText;
            }
          }
        } catch (e) {
          // continue to next attempt
        }

        // Attempt 2: Direct / JSONP via googleSheetSync.js
        if (!csvText && typeof window.fetchGoogleSheetData === 'function') {
          try {
            const res = await window.fetchGoogleSheetData(HARDCODED_PSSR_SHEET_URL, {
              sheetTab: HARDCODED_PSSR_SHEET_TAB
            });
            if (typeof res === 'string' && res.trim().length > 0) {
              csvText = res;
            } else if (res && res.csvText) {
              csvText = res.csvText;
            }
          } catch (e) {
            // continue
          }
        }

        // Attempt 2b: Direct JSONP via Google Visualization API
        if (!csvText && typeof window.fetchGoogleSheetViaJSONP === 'function') {
          try {
            const jsonpRes = await window.fetchGoogleSheetViaJSONP(HARDCODED_PSSR_SHEET_URL, {
              sheetTab: HARDCODED_PSSR_SHEET_TAB
            });
            if (jsonpRes && jsonpRes.csvText) {
              csvText = jsonpRes.csvText;
            }
          } catch (e) {
            // continue
          }
        }

        // Attempt 3: Direct CSV fetch with cache buster (safe try/catch against browser CORS)
        if (!csvText) {
          try {
            const directUrl = `${HARDCODED_PSSR_SHEET_URL}&_nocache=${Date.now()}`;
            const res = await fetch(directUrl, { cache: 'no-store' });
            if (res.ok) {
              const text = await res.text();
              if (text && !text.includes('<!DOCTYPE html>') && text.includes(',')) {
                csvText = text;
              }
            }
          } catch (directErr) {
            // Direct browser fetch blocked by CORS or network, handled gracefully
          }
        }

        if (csvText) {
          const parsed = this.parseCsv(csvText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.FPCL_PSSR_DATA = parsed;
            try {
              localStorage.setItem('FPCL_PSSR_DATA_CACHE', JSON.stringify(parsed));
            } catch (e) {}

            this.state.lastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            this.syncStatsToOverview();

            if (!silent && window.portalApp && typeof window.portalApp.showToast === 'function') {
              window.portalApp.showToast(`PSSR live feed synchronized (${parsed.length} observations).`, 'success');
            }
          }
        }
      } catch (err) {
        console.warn('PSSR live sync warning:', err);
        if (!silent && window.portalApp && typeof window.portalApp.showToast === 'function') {
          window.portalApp.showToast('Could not sync live feed: ' + (err.message || 'Network error'), 'error');
        }
      } finally {
        this.state.isSyncing = false;
        this.renderSyncButtonState(false);
        this.render();
      }
    },

    renderSyncButtonState(isSyncing) {
      const btn = document.getElementById('btn-pssr-sync-feed');
      if (btn) {
        if (isSyncing) {
          btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Syncing...</span>`;
          btn.classList.add('opacity-75', 'cursor-wait');
        } else {
          btn.innerHTML = `<i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i><span>Sync Feed</span>`;
          btn.classList.remove('opacity-75', 'cursor-wait');
        }
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons();
        }
      }
    },

    /**
     * CSV Export filtered by currently applied filters
     */
    exportFilteredCsv() {
      const filtered = this.getFilteredData();
      if (!filtered || filtered.length === 0) {
        if (window.portalApp && typeof window.portalApp.showToast === 'function') {
          window.portalApp.showToast('No observations match the current filter criteria.', 'warning');
        }
        return;
      }

      const headers = [
        'ID',
        'Facility_Description',
        'Area',
        'Initiator_Unit',
        'Date_of_Initiator',
        'Area_Owner',
        'Short_Long_Form',
        'BC_points',
        'Commissioning_Authorization',
        'Signing_Date_of_Authorization',
        'Number_of_AC_points',
        'AC_Deficiencies',
        'Responsibility',
        'Target_Date',
        'Status_(Open/Close)',
        'Target_Date_1st_Extensions',
        'Target_Date_2nd_Extensions',
        'Target_Date_3rd_Extensions',
        'Completion_Date',
        'Completion_Remarks',
        'Clarification',
        'Responsibility_2',
        'Remarks'
      ];

      const escapeCell = val => `"${String(val !== undefined && val !== null ? val : '').replace(/"/g, '""')}"`;

      const rows = filtered.map(item => [
        escapeCell(item.id),
        escapeCell(item.facilityDescription),
        escapeCell(item.area),
        escapeCell(item.initiatorUnit),
        escapeCell(item.dateOfInitiator),
        escapeCell(item.areaOwner),
        escapeCell(item.shortLongForm),
        escapeCell(item.bcPoints),
        escapeCell(item.commissioningAuth),
        escapeCell(item.signingDateAuth),
        escapeCell(item.numAcPoints),
        escapeCell(item.acDeficiencies),
        escapeCell(item.responsibility),
        escapeCell(item.targetDate),
        escapeCell(item.status),
        escapeCell(item.targetDate1stExt),
        escapeCell(item.targetDate2ndExt),
        escapeCell(item.targetDate3rdExt),
        escapeCell(item.completionDate),
        escapeCell(item.completionRemarks),
        escapeCell(item.clarification),
        escapeCell(item.responsibility2),
        escapeCell(item.remarks)
      ].join(','));

      const csvContent = [headers.map(escapeCell).join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 10);
      link.setAttribute('href', url);
      link.setAttribute('download', `FPCL_PSSR_Findings_Export_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (window.portalApp && typeof window.portalApp.showToast === 'function') {
        window.portalApp.showToast(`Exported ${filtered.length} filtered PSSR observations to CSV.`, 'success');
      }
    },

    /**
     * Resets all filters
     */
    resetFilters() {
      this.state.searchQuery = '';
      this.state.yearFilter = 'all';
      this.state.areaFilter = 'all';
      this.state.deptFilter = 'all';
      this.state.statusFilter = 'all';
      this.state.page = 1;
      this.state.pageSize = 'all';
      this.state.searchExpanded = false;
      this.render();

      if (window.portalApp && typeof window.portalApp.showToast === 'function') {
        window.portalApp.showToast('All filters have been reset.', 'info');
      }
    },

    setSearch(q) {
      this.state.searchQuery = q;
      this.state.page = 1;
      this.render();
    },

    setYearFilter(val) {
      this.state.yearFilter = val;
      this.state.page = 1;
      this.render();
    },

    setAreaFilter(val) {
      this.state.areaFilter = val;
      this.state.page = 1;
      this.render();
    },

    setDeptFilter(val) {
      this.state.deptFilter = val;
      this.state.page = 1;
      this.render();
    },

    setStatusFilter(val) {
      this.state.statusFilter = val;
      this.state.page = 1;
      this.render();
    },

    /**
     * Opens Target Dates & Extensions pop-up window for Open Observations
     * Shows Columns N (Target Date), P (1st Ext), Q (2nd Ext), R (3rd Ext), and U (Clarification)
     */
    openTargetDatesModal() {
      this.state.isTargetDatesModalOpen = true;
      this.state.targetDatesModalSearch = '';
      this.state.targetDatesModalYear = this.state.yearFilter !== 'all' ? this.state.yearFilter : 'all';
      this.state.targetDatesModalDept = this.state.deptFilter !== 'all' ? this.state.deptFilter : 'all';
      this.state.targetDatesModalArea = this.state.areaFilter !== 'all' ? this.state.areaFilter : 'all';
      this.render();

      // Bind ESC key to close modal
      if (!this._escListenerBound) {
        this._escListenerBound = true;
        window.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && this.state.isTargetDatesModalOpen) {
            this.closeTargetDatesModal();
          }
        });
      }
    },

    closeTargetDatesModal() {
      this.state.isTargetDatesModalOpen = false;
      this.render();
    },

    setTargetDatesSearch(q) {
      this.state.targetDatesModalSearch = q;
      this.renderTargetDatesModalBodyOnly();
    },

    setTargetDatesYear(yr) {
      this.state.targetDatesModalYear = yr;
      this.renderTargetDatesModalBodyOnly();
    },

    setTargetDatesDept(dept) {
      this.state.targetDatesModalDept = dept;
      this.renderTargetDatesModalBodyOnly();
    },

    setTargetDatesArea(area) {
      this.state.targetDatesModalArea = area;
      this.renderTargetDatesModalBodyOnly();
    },

    getOpenObservationsWithDates() {
      const raw = this.getRawData();
      const search = (this.state.targetDatesModalSearch || '').toLowerCase().trim();
      const yr = this.state.targetDatesModalYear || 'all';
      const dept = (this.state.targetDatesModalDept || 'all').toLowerCase();
      const area = (this.state.targetDatesModalArea || 'all').toLowerCase();

      return raw.filter(item => {
        // Only Open observations
        if (this.isClosedStatus(item.status)) return false;

        // Year filter (Date_of_Initiator)
        if (yr !== 'all') {
          const itemYr = this.extractYear(item.dateOfInitiator);
          if (itemYr !== yr) return false;
        }

        // Dept filter
        if (dept !== 'all') {
          const itemDept = this.normalizeDept(item.responsibility).toLowerCase();
          if (itemDept !== dept) return false;
        }

        // Area filter
        if (area !== 'all') {
          if ((item.area || '').toLowerCase() !== area) return false;
        }

        // Search in ID, Area, Owner, Deficiency, Resp, Col N, P, Q, R, U
        if (search) {
          const matchId = (item.id || '').toLowerCase().includes(search);
          const matchArea = (item.area || '').toLowerCase().includes(search);
          const matchOwner = (item.areaOwner || '').toLowerCase().includes(search);
          const matchDef = (item.acDeficiencies || '').toLowerCase().includes(search);
          const matchResp = (item.responsibility || '').toLowerCase().includes(search);
          const matchN = (item.targetDate || '').toLowerCase().includes(search);
          const matchP = (item.targetDate1stExt || '').toLowerCase().includes(search);
          const matchQ = (item.targetDate2ndExt || '').toLowerCase().includes(search);
          const matchR = (item.targetDate3rdExt || '').toLowerCase().includes(search);
          const matchU = (item.clarification || '').toLowerCase().includes(search);

          if (!matchId && !matchArea && !matchOwner && !matchDef && !matchResp &&
              !matchN && !matchP && !matchQ && !matchR && !matchU) {
            return false;
          }
        }

        return true;
      });
    },

    exportOpenDatesCsv() {
      const items = this.getOpenObservationsWithDates();
      if (!items || items.length === 0) {
        if (window.portalApp && typeof window.portalApp.showToast === 'function') {
          window.portalApp.showToast('No open observations to export.', 'info');
        }
        return;
      }

      const escapeCell = (val) => {
        if (val === null || val === undefined) return '""';
        const s = String(val).replace(/"/g, '""');
        return `"${s}"`;
      };

      const headers = [
        'ID (Col A)',
        'Facility Description (Col B)',
        'Area (Col C)',
        'Area Owner (Col F)',
        'Responsibility (Col M)',
        'AC Deficiencies (Col L)',
        'Target Date (Col N)',
        'Target Date 1st Extensions (Col P)',
        'Target Date 2nd Extensions (Col Q)',
        'Target Date 3rd Extensions (Col R)',
        'Clarification (Col U)',
        'Status (Col O)'
      ];

      const rows = items.map(item => [
        escapeCell(item.id),
        escapeCell(item.facilityDescription),
        escapeCell(item.area),
        escapeCell(item.areaOwner),
        escapeCell(item.responsibility),
        escapeCell(item.acDeficiencies),
        escapeCell(item.targetDate),
        escapeCell(item.targetDate1stExt),
        escapeCell(item.targetDate2ndExt),
        escapeCell(item.targetDate3rdExt),
        escapeCell(item.clarification),
        escapeCell(item.status || 'Open')
      ].join(','));

      const csvContent = [headers.map(escapeCell).join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `FPCL_PSSR_Open_Target_Dates_Col_N_P_Q_U_R_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    renderTargetDatesModalBodyOnly() {
      const mount = document.getElementById('pssr-target-dates-table-mount');
      const countEl = document.getElementById('pssr-target-dates-count');
      if (!mount) return;

      const items = this.getOpenObservationsWithDates();
      if (countEl) {
        countEl.textContent = `${items.length} open items`;
      }

      if (items.length === 0) {
        mount.innerHTML = `
          <tr>
            <td colspan="10" class="py-12 text-center text-slate-400 font-medium">
              No open observations match the current search or filters.
            </td>
          </tr>
        `;
        return;
      }

      mount.innerHTML = items.map((item, idx) => {
        const has1stExt = item.targetDate1stExt && item.targetDate1stExt.trim() !== '' && item.targetDate1stExt.trim() !== '-';
        const has2ndExt = item.targetDate2ndExt && item.targetDate2ndExt.trim() !== '' && item.targetDate2ndExt.trim() !== '-';
        const has3rdExt = item.targetDate3rdExt && item.targetDate3rdExt.trim() !== '' && item.targetDate3rdExt.trim() !== '-';
        const hasClarification = item.clarification && item.clarification.trim() !== '' && item.clarification.trim() !== '-';

        return `
          <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}">
            <!-- ID (Col A) -->
            <td class="px-3 py-3.5 font-mono font-black text-slate-800 text-xs whitespace-nowrap align-top">
              <span class="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">${item.id}</span>
            </td>

            <!-- Area (Col C) & Owner (Col F) -->
            <td class="px-3 py-3.5 text-xs align-top">
              <div class="font-extrabold text-slate-800">${item.area || '-'}</div>
              <div class="text-[11px] font-semibold text-slate-500">${item.areaOwner ? `Owner: ${item.areaOwner}` : ''}</div>
            </td>

            <!-- Responsibility (Col M) -->
            <td class="px-3 py-3.5 text-xs whitespace-nowrap align-top">
              <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200">
                ${item.responsibility || '-'}
              </span>
            </td>

            <!-- AC Deficiencies (Col L) - Full text completely visible -->
            <td class="px-4 py-3.5 text-xs text-slate-800 min-w-[340px] max-w-[550px] align-top">
              <div class="whitespace-pre-wrap break-words leading-relaxed select-text font-medium text-slate-900">${item.acDeficiencies || '-'}</div>
            </td>

            <!-- Target Date (Col N) -->
            <td class="px-3 py-3.5 text-xs font-mono whitespace-nowrap align-top">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-black bg-blue-50 text-blue-800 border border-blue-200">
                <i data-lucide="calendar" class="w-3.5 h-3.5 text-blue-600"></i>
                ${item.targetDate || '-'}
              </span>
            </td>

            <!-- Target Date 1st Extensions (Col P) -->
            <td class="px-3 py-3.5 text-xs font-mono whitespace-nowrap align-top">
              ${has1stExt ? `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-800 border border-amber-300">
                  <i data-lucide="clock" class="w-3 h-3 text-amber-600"></i>
                  ${item.targetDate1stExt}
                </span>
              ` : `<span class="text-slate-400 font-bold">-</span>`}
            </td>

            <!-- Target Date 2nd Extensions (Col Q) -->
            <td class="px-3 py-3.5 text-xs font-mono whitespace-nowrap align-top">
              ${has2ndExt ? `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-orange-50 text-orange-800 border border-orange-300">
                  <i data-lucide="clock" class="w-3 h-3 text-orange-600"></i>
                  ${item.targetDate2ndExt}
                </span>
              ` : `<span class="text-slate-400 font-bold">-</span>`}
            </td>

            <!-- Target Date 3rd Extensions (Col R) -->
            <td class="px-3 py-3.5 text-xs font-mono whitespace-nowrap align-top">
              ${has3rdExt ? `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-rose-50 text-rose-800 border border-rose-300">
                  <i data-lucide="alert-triangle" class="w-3 h-3 text-rose-600"></i>
                  ${item.targetDate3rdExt}
                </span>
              ` : `<span class="text-slate-400 font-bold">-</span>`}
            </td>

            <!-- Clarification (Col U) - Full text visible -->
            <td class="px-3.5 py-3.5 text-xs text-slate-700 min-w-[240px] max-w-[380px] align-top">
              ${hasClarification ? `
                <div class="bg-slate-50/80 p-2 rounded-lg border border-slate-200 text-xs font-medium whitespace-pre-wrap break-words leading-relaxed text-slate-800 select-text">
                  ${item.clarification}
                </div>
              ` : `<span class="text-slate-400 font-semibold">-</span>`}
            </td>

            <!-- Status (Col O) -->
            <td class="px-3 py-3.5 text-xs text-center whitespace-nowrap align-top">
              <span class="px-2.5 py-0.5 rounded-full font-black text-[11px] bg-rose-100 text-rose-700 border border-rose-200">
                ${item.status || 'Open'}
              </span>
            </td>
          </tr>
        `;
      }).join('');

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    setPage(p) {
      this.state.page = p;
      this.renderTableOnly();
    },

    setPageSize(size) {
      this.state.pageSize = size === 'all' ? 'all' : parseInt(size, 10);
      this.state.page = 1;
      this.renderTableOnly();
    },

    openFindingModal(item) {
      this.state.selectedFinding = item;
      const modal = document.getElementById('pssr-detail-modal');
      const content = document.getElementById('pssr-modal-content');
      if (!modal || !content) return;

      const isClosed = this.isClosedStatus(item.status);
      const statusBadge = isClosed
        ? `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Close</span>`
        : `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">${item.status || 'Open'}</span>`;

      content.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-lg text-sm font-black bg-blue-100 text-blue-800 border border-blue-300">PSSR ID: ${item.id}</span>
              ${statusBadge}
            </div>
            <span class="text-xs font-mono text-slate-500">Record #${item.rowIdx}</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Facility Description</div>
              <div class="font-bold text-slate-800 mt-0.5">${item.facilityDescription || '-'}</div>
            </div>
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Area (Column C)</div>
              <div class="font-bold text-slate-800 mt-0.5">${item.area || '-'}</div>
            </div>
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Initiator Unit & Date</div>
              <div class="font-bold text-slate-800 mt-0.5">${item.initiatorUnit || '-'} • ${item.dateOfInitiator || '-'}</div>
            </div>
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Area Owner & Form</div>
              <div class="font-bold text-slate-800 mt-0.5">${item.areaOwner || '-'} (${item.shortLongForm || '-'})</div>
            </div>
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 md:col-span-2">
              <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">AC Deficiencies / Action Item</div>
              <div class="font-semibold text-slate-900 mt-0.5">${item.acDeficiencies || '-'}</div>
            </div>
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Responsibility (Column M)</div>
              <div class="font-bold text-blue-700 mt-0.5">${item.responsibility || '-'}</div>
            </div>

            <!-- Target Dates & Extensions Section (Columns N, P, Q, R, U) -->
            <div class="md:col-span-2 bg-gradient-to-r from-blue-50/60 via-slate-50 to-amber-50/60 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                <span class="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <i data-lucide="calendar" class="w-4 h-4 text-blue-600"></i>
                  Target Dates & Extensions Schedule
                </span>
                <span class="text-[11px] font-bold text-slate-500 font-mono">Cols N, P, Q, R, U</span>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <!-- Col N: Target Date -->
                <div class="bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs">
                  <div class="text-[10px] font-black text-blue-700 uppercase tracking-wider">Target Date (Col N)</div>
                  <div class="font-mono font-black text-sm text-slate-900 mt-0.5">${item.targetDate || '-'}</div>
                </div>

                <!-- Col P: 1st Extension -->
                <div class="bg-white p-2.5 rounded-xl border border-amber-200 shadow-2xs">
                  <div class="text-[10px] font-black text-amber-700 uppercase tracking-wider">1st Ext (Col P)</div>
                  <div class="font-mono font-black text-sm text-amber-800 mt-0.5">${item.targetDate1stExt || '-'}</div>
                </div>

                <!-- Col Q: 2nd Extension -->
                <div class="bg-white p-2.5 rounded-xl border border-orange-200 shadow-2xs">
                  <div class="text-[10px] font-black text-orange-700 uppercase tracking-wider">2nd Ext (Col Q)</div>
                  <div class="font-mono font-black text-sm text-orange-800 mt-0.5">${item.targetDate2ndExt || '-'}</div>
                </div>

                <!-- Col R: 3rd Extension -->
                <div class="bg-white p-2.5 rounded-xl border border-rose-200 shadow-2xs">
                  <div class="text-[10px] font-black text-rose-700 uppercase tracking-wider">3rd Ext (Col R)</div>
                  <div class="font-mono font-black text-sm text-rose-800 mt-0.5">${item.targetDate3rdExt || '-'}</div>
                </div>
              </div>

              <!-- Col U: Clarification -->
              <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div class="text-[10px] font-black text-slate-600 uppercase tracking-wider">Clarification (Column U)</div>
                <div class="font-medium text-xs text-slate-800 mt-1 leading-relaxed">${item.clarification || 'No clarification notes recorded'}</div>
              </div>
            </div>

            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completion Date</div>
              <div class="font-bold text-slate-800 mt-0.5">${item.completionDate || '-'}</div>
            </div>
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Commissioning Authorization</div>
              <div class="font-bold text-slate-800 mt-0.5">${item.commissioningAuth || '-'} (${item.signingDateAuth || '-'})</div>
            </div>
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 md:col-span-2">
              <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completion Remarks / Notes</div>
              <div class="font-medium text-slate-700 mt-0.5">${item.completionRemarks || item.remarks || '-'}</div>
            </div>
          </div>
        </div>
      `;

      modal.classList.remove('hidden');
      modal.classList.add('flex');
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    closeFindingModal() {
      const modal = document.getElementById('pssr-detail-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      this.state.selectedFinding = null;
    },

    /**
     * Renders the complete PSSR Executive BI Suite inside #pssr-specialized-container
     */
    render() {
      const container = document.getElementById('pssr-specialized-container');
      if (!container) return;

      const raw = this.getRawData();
      const filtered = this.getFilteredData();
      const kpis = this.getKPIs(filtered);
      const deptSummary = this.getDepartmentSummary(filtered);

      // Collect unique filter options from raw dataset
      const years = Array.from(new Set(raw.map(i => this.extractYear(i.dateOfInitiator)).filter(Boolean))).sort();
      const areas = Array.from(new Set(raw.map(i => i.area).filter(Boolean))).sort();
      const depts = Array.from(new Set(raw.map(i => this.normalizeDept(i.responsibility)).filter(Boolean))).sort();
      const statuses = ['Close', 'Open', 'Extension'];

      const s = this.state;

      container.innerHTML = `
        <div class="space-y-4 sm:space-y-6">

          <!-- ========================================================================= -->
          <!-- 1. MAIN GRADIENT COLOR EYECATCHING BANNER AT TOP OF DASHBOARD               -->
          <!-- "dont add extra texts and detials just mention heading and important feature button as in attached image" -->
          <!-- ========================================================================= -->
          <div id="pssr-top-banner" class="rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl border border-teal-400/40 relative overflow-hidden transition-all duration-300"
               style="background: linear-gradient(135deg, #0F766E 0%, #0D9488 25%, #2563EB 70%, #7C3AED 100%);">
            
            <!-- Ambient Glow orbs -->
            <div class="absolute -top-12 -left-12 w-48 h-48 bg-emerald-400/25 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-12 -right-12 w-56 h-56 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none"></div>

            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
              <!-- Left: Clean Heading without extra fluff/text -->
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-md shrink-0">
                  <i data-lucide="check-circle-2" class="w-5 h-5 sm:w-6 sm:h-6 text-white"></i>
                </div>
                <div>
                  <h2 class="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight uppercase leading-tight">
                    PRE-STARTUP SAFETY REVIEW (PSSR)
                  </h2>
                </div>
              </div>

              <!-- Right: Important Feature Buttons matching attached image.png exactly -->
              <!-- [SEARCH FINDINGS] [↺ Reset Filters] [↓ Export CSV] [↻ Sync Feed] [⚙] -->
              <div class="flex flex-wrap items-center gap-2 shrink-0">
                
                <!-- 1. SEARCH FINDINGS Glassmorphic Pill Button / Input -->
                <div class="relative inline-flex items-center">
                  <div class="relative flex items-center bg-white/20 hover:bg-white/25 focus-within:bg-white/30 border border-white/40 backdrop-blur-md rounded-xl px-3 py-1.5 transition-all shadow-xs">
                    <i data-lucide="search" class="w-3.5 h-3.5 text-white/90 mr-1.5 shrink-0"></i>
                    <input
                      id="pssr-banner-search-input"
                      type="text"
                      placeholder="SEARCH FINDINGS"
                      value="${s.searchQuery ? s.searchQuery.replace(/"/g, '&quot;') : ''}"
                      oninput="FPCL_PSSR_SUITE.setSearch(this.value)"
                      class="bg-transparent text-white placeholder-white/80 font-bold text-xs uppercase tracking-wider focus:outline-none w-32 sm:w-40 leading-none"
                    />
                    ${s.searchQuery ? `
                    <button onclick="FPCL_PSSR_SUITE.setSearch('')" class="text-white/80 hover:text-white ml-1 p-0.5" title="Clear search">
                      <i data-lucide="x" class="w-3 h-3"></i>
                    </button>
                    ` : ''}
                  </div>
                </div>

                <!-- 2. Reset Filters -->
                <button
                  id="btn-pssr-reset-filters"
                  onclick="FPCL_PSSR_SUITE.resetFilters()"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-white/20 hover:bg-white/30 border border-white/40 shadow-xs backdrop-blur-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
                  title="Reset all filters"
                >
                  <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-white"></i>
                  <span>Reset Filters</span>
                </button>

                <!-- 3. Export CSV -->
                <button
                  id="btn-pssr-export-csv"
                  onclick="FPCL_PSSR_SUITE.exportFilteredCsv()"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-white/20 hover:bg-white/30 border border-white/40 shadow-xs backdrop-blur-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
                  title="Export filtered findings to CSV"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5 text-white"></i>
                  <span>Export CSV</span>
                </button>

                <!-- 4. Sync Feed -->
                <button
                  id="btn-pssr-sync-feed"
                  onclick="FPCL_PSSR_SUITE.syncLiveFeed()"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-white/20 hover:bg-white/30 border border-white/40 shadow-xs backdrop-blur-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
                  title="Sync live feed with Google Sheet"
                >
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-white"></i>
                  <span>Sync Feed</span>
                </button>

                <!-- 5. Settings / Sheet Info Button (⚙) -->
                <button
                  id="btn-pssr-settings"
                  onclick="window.open('https://docs.google.com/spreadsheets/d/${HARDCODED_PSSR_SHEET_ID}/edit#gid=0', '_blank')"
                  class="inline-flex items-center justify-center p-2 rounded-xl text-white bg-white/20 hover:bg-white/30 border border-white/40 shadow-xs backdrop-blur-md transition-all cursor-pointer active:scale-95"
                  title="Open PSSR Google Sheet in new tab"
                >
                  <i data-lucide="settings" class="w-3.5 h-3.5 text-white"></i>
                </button>

              </div>
            </div>
          </div>

          <!-- ========================================================================= -->
          <!-- 2. KPI CARDS                                                              -->
          <!-- "create KPI card values for Total observation , closed observations column O, -->
          <!--  open observations column O common and percentage completion                  -->
          <!--  (only mention KPI heading and value dont mention any other details.)"        -->
          <!-- ========================================================================= -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            
            <!-- KPI 1: Total observation -->
            <div class="bg-white rounded-2xl p-4 sm:p-5 border-t-4 border-slate-700 shadow-sm border-x border-b border-slate-200 card-hover-effect flex flex-col justify-between">
              <span class="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-wider leading-none">
                Total Observation
              </span>
              <div class="mt-2 sm:mt-3">
                <span class="text-3xl sm:text-4xl lg:text-5xl font-black font-mono text-slate-800 tracking-tight leading-none">
                  ${kpis.total}
                </span>
              </div>
            </div>

            <!-- KPI 2: closed observations -->
            <div class="bg-white rounded-2xl p-4 sm:p-5 border-t-4 border-emerald-500 shadow-sm border-x border-b border-slate-200 card-hover-effect flex flex-col justify-between">
              <span class="text-xs sm:text-sm font-black text-emerald-700 uppercase tracking-wider leading-none">
                Closed Observations
              </span>
              <div class="mt-2 sm:mt-3">
                <span class="text-3xl sm:text-4xl lg:text-5xl font-black font-mono text-emerald-600 tracking-tight leading-none">
                  ${kpis.closed}
                </span>
              </div>
            </div>

            <!-- KPI 3: open observations (Clickable) -->
            <div
              onclick="FPCL_PSSR_SUITE.openTargetDatesModal()"
              class="bg-white rounded-2xl p-4 sm:p-5 border-t-4 border-[#F43F5E] shadow-sm border-x border-b border-slate-200 card-hover-effect flex flex-col justify-between cursor-pointer group hover:shadow-md hover:border-[#F43F5E] transition-all relative overflow-hidden"
              title="Click to view Open Observations Target Dates (Column N, P, Q, U, R)"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs sm:text-sm font-black text-rose-700 uppercase tracking-wider leading-none">
                  Open Observations
                </span>
                <span class="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#F43F5E] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 group-hover:bg-[#F43F5E] group-hover:text-white transition-all">
                  Target Dates
                  <i data-lucide="external-link" class="w-3 h-3"></i>
                </span>
              </div>
              <div class="mt-2 sm:mt-3 flex items-baseline justify-between">
                <span class="text-3xl sm:text-4xl lg:text-5xl font-black font-mono text-[#F43F5E] tracking-tight leading-none">
                  ${kpis.open}
                </span>
                <span class="text-[11px] font-bold text-rose-500 underline decoration-rose-300 underline-offset-2 group-hover:text-rose-700">
                  Click to view dates ↗
                </span>
              </div>
            </div>

            <!-- KPI 4: percentage completion -->
            <div class="bg-white rounded-2xl p-4 sm:p-5 border-t-4 border-teal-500 shadow-sm border-x border-b border-slate-200 card-hover-effect flex flex-col justify-between">
              <span class="text-xs sm:text-sm font-black text-teal-700 uppercase tracking-wider leading-none">
                Percentage Completion
              </span>
              <div class="mt-2 sm:mt-3">
                <span class="text-3xl sm:text-4xl lg:text-5xl font-black font-mono text-teal-600 tracking-tight leading-none">
                  ${kpis.percentage}
                </span>
              </div>
            </div>

          </div>

          <!-- ========================================================================= -->
          <!-- 3. UNIVERSAL FILTERS BAR (DIRECTLY BELOW KPIS)                            -->
          <!-- Universal Filters (Year: Date_of_Initiator • Area • Responsibility • Status) -->
          <!-- ========================================================================= -->
          <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
              <div class="flex items-center gap-2">
                <i data-lucide="filter" class="w-4 h-4 text-blue-600"></i>
                <span class="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                  Universal Filters (Year: Date_of_Initiator • Column C: Area • Column M: Responsibility • Column O: Status)
                </span>
              </div>
              <div class="flex items-center gap-2 text-xs font-bold text-slate-500">
                <button
                  onclick="FPCL_PSSR_SUITE.openTargetDatesModal()"
                  class="px-2.5 py-1 rounded-xl text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  title="View Open Observations Target Dates (Column N, P, Q, U, R)"
                >
                  <i data-lucide="calendar" class="w-3.5 h-3.5 text-rose-600"></i>
                  <span>Target Dates (Col N, P, Q, U, R)</span>
                </button>
                <span>Active: <span class="text-blue-700 font-mono font-black">${filtered.length}</span> of ${raw.length}</span>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
              
              <!-- Filter 1: Year (Date_of_Initiator) -->
              <div class="space-y-1">
                <label class="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <i data-lucide="calendar" class="w-3 h-3 text-teal-600"></i>
                  <span>Year (Date_of_Initiator)</span>
                </label>
                <div class="relative">
                  <select
                    id="filter-pssr-year"
                    onchange="FPCL_PSSR_SUITE.setYearFilter(this.value)"
                    class="w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer transition-all"
                  >
                    <option value="all" ${s.yearFilter === 'all' ? 'selected' : ''}>All Years (${years.length})</option>
                    ${years.map(y => `<option value="${y}" ${s.yearFilter === y ? 'selected' : ''}>Year ${y}</option>`).join('')}
                  </select>
                </div>
              </div>

              <!-- Filter 2: Column C (Area) -->
              <div class="space-y-1">
                <label class="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  Area (Column C)
                </label>
                <div class="relative">
                  <select
                    id="filter-pssr-area"
                    onchange="FPCL_PSSR_SUITE.setAreaFilter(this.value)"
                    class="w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
                  >
                    <option value="all" ${s.areaFilter === 'all' ? 'selected' : ''}>All Areas (${areas.length})</option>
                    ${areas.map(a => `<option value="${a.replace(/"/g, '&quot;')}" ${s.areaFilter === a ? 'selected' : ''}>${a}</option>`).join('')}
                  </select>
                </div>
              </div>

              <!-- Filter 3: Column M (Responsibility / Department) -->
              <div class="space-y-1">
                <label class="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  Responsibility (Column M)
                </label>
                <div class="relative">
                  <select
                    id="filter-pssr-dept"
                    onchange="FPCL_PSSR_SUITE.setDeptFilter(this.value)"
                    class="w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
                  >
                    <option value="all" ${s.deptFilter === 'all' ? 'selected' : ''}>All Departments (${depts.length})</option>
                    ${depts.map(d => `<option value="${d.replace(/"/g, '&quot;')}" ${s.deptFilter === d ? 'selected' : ''}>${d}</option>`).join('')}
                  </select>
                </div>
              </div>

              <!-- Filter 4: Column O (Status Open/Close) -->
              <div class="space-y-1">
                <label class="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  Status (Column O)
                </label>
                <div class="relative">
                  <select
                    id="filter-pssr-status"
                    onchange="FPCL_PSSR_SUITE.setStatusFilter(this.value)"
                    class="w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
                  >
                    <option value="all" ${s.statusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
                    <option value="Close" ${s.statusFilter === 'Close' ? 'selected' : ''}>Closed (${raw.filter(i => this.isClosedStatus(i.status)).length})</option>
                    <option value="Open" ${s.statusFilter === 'Open' ? 'selected' : ''}>Open (${raw.filter(i => !this.isClosedStatus(i.status)).length})</option>
                    <option value="Extension" ${s.statusFilter === 'Extension' ? 'selected' : ''}>Extension (${raw.filter(i => (i.status || '').toLowerCase() === 'extension').length})</option>
                  </select>
                </div>
              </div>

              <!-- Filter 5: Text Search & Quick Reset -->
              <div class="space-y-1">
                <label class="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  Search Filter
                </label>
                <div class="flex items-center gap-1.5">
                  <div class="relative flex-1">
                    <input
                      type="text"
                      placeholder="Keyword / ID / Defect..."
                      value="${s.searchQuery ? s.searchQuery.replace(/"/g, '&quot;') : ''}"
                      oninput="FPCL_PSSR_SUITE.setSearch(this.value)"
                      class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    ${s.searchQuery ? `
                    <button onclick="FPCL_PSSR_SUITE.setSearch('')" class="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600">
                      <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    </button>
                    ` : ''}
                  </div>
                  <button
                    onclick="FPCL_PSSR_SUITE.resetFilters()"
                    class="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer shrink-0"
                    title="Reset all filters"
                  >
                    Reset
                  </button>
                </div>
              </div>

            </div>
          </div>

          <!-- ========================================================================= -->
          <!-- 4. HORIZONTAL STACK BAR CHART                                             -->
          <!-- "OPEN VS. CLOSED FINDINGS BY ACTION DEPARTMENT"                           -->
          <!-- Scheme & colors aligned with attached image:                              -->
          <!--  - Open segment (Red #F43F5E) on LEFT                                     -->
          <!--  - Closed segment (Green #10B981) on RIGHT                                -->
          <!--  - Values on bar with font size 12px bold white text                      -->
          <!--  - Gray track background with vertical gridlines                          -->
          <!--  - Sort button "⇅ By Total" at top right                                 -->
          <!--  - Right labels showing Total and Percentage: e.g. 12 (50%)               -->
          <!-- ========================================================================= -->
          <div class="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 gap-3">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <i data-lucide="bar-chart-2" class="w-4 h-4"></i>
                </div>
                <h3 class="text-xs sm:text-sm md:text-base font-black text-slate-800 tracking-tight uppercase">
                  OPEN VS. CLOSED FINDINGS BY ACTION DEPARTMENT
                </h3>
              </div>

              <!-- Right Controls: Sort Button & Legend -->
              <div class="flex items-center gap-3 self-end sm:self-auto flex-wrap">
                <!-- Sort Toggle Button -->
                <button
                  onclick="FPCL_PSSR_SUITE.cycleSortBarMode()"
                  class="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                  title="Toggle Sort Mode (By Total / By Open / By Closed / By Name)"
                >
                  <span class="text-slate-400 font-bold">⇅</span>
                  <span>${
                    s.barSortMode === 'open' ? 'By Open' :
                    s.barSortMode === 'closed' ? 'By Closed' :
                    s.barSortMode === 'alpha' ? 'By Name' : 'By Total'
                  }</span>
                </button>

                <!-- Legend -->
                <div class="flex items-center gap-3 text-xs font-bold">
                  <div
                    onclick="FPCL_PSSR_SUITE.openTargetDatesModal()"
                    class="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                    title="Click to view Open Observations Target Dates (Col N, P, Q, U, R)"
                  >
                    <span class="w-3.5 h-3.5 rounded-xs bg-[#F43F5E] inline-block shadow-2xs"></span>
                    <span class="text-slate-700 font-bold">Open</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="w-3.5 h-3.5 rounded-xs bg-[#10B981] inline-block shadow-2xs"></span>
                    <span class="text-slate-700 font-bold">Closed</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Horizontal Stacked Bars -->
            <div class="mt-4 space-y-3">
              ${deptSummary.length === 0 ? `
                <div class="py-8 text-center text-slate-400 font-medium">No departmental observations match active filters.</div>
              ` : deptSummary.map(item => {
                // Calculate max bar scale relative to maximum department total (matching visual proportion in image)
                const maxTotal = Math.max(...deptSummary.map(d => d.total), 1);
                const barWidthPct = Math.max((item.total / maxTotal) * 85, 12);
                const openPct = item.total > 0 ? (item.open / item.total) * 100 : 0;
                const closedPct = item.total > 0 ? (item.closed / item.total) * 100 : 0;
                const completionRate = item.total > 0 ? Math.round((item.closed / item.total) * 100) : 0;

                return `
                  <div class="flex items-center gap-2 sm:gap-4 py-1 group">
                    <!-- Department Label (Col M) -->
                    <div class="w-24 sm:w-36 md:w-44 shrink-0 text-right pr-2 sm:pr-3">
                      <span class="font-black text-xs sm:text-sm text-slate-800 truncate block" title="${item.dept}">${item.dept}</span>
                    </div>

                    <!-- Stacked Horizontal Bar Container & Track -->
                    <div class="flex-1 flex items-center">
                      <div class="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl h-8 sm:h-9 relative overflow-hidden flex items-center">
                        
                        <!-- Subtle Vertical Reference Grid Lines -->
                        <div class="absolute inset-0 flex justify-between pointer-events-none px-6 sm:px-12">
                          <div class="w-px h-full border-r border-dashed border-slate-200/90"></div>
                          <div class="w-px h-full border-r border-dashed border-slate-200/90"></div>
                          <div class="w-px h-full border-r border-dashed border-slate-200/90"></div>
                        </div>

                        <!-- Active Stacked Bar Width (Proportional to Max Total) -->
                        <div class="h-full flex items-center relative z-10 transition-all duration-300" style="width: ${barWidthPct}%;">
                          
                          <!-- Segment 1: OPEN (Red #F43F5E on LEFT - matching attached image) -->
                          ${item.open > 0 ? `
                            <div
                              onclick="FPCL_PSSR_SUITE.openTargetDatesModal()"
                              class="bg-[#F43F5E] hover:bg-[#E11D48] transition-all h-full flex items-center justify-center text-white cursor-pointer ${item.closed > 0 ? 'rounded-l-xl' : 'rounded-xl'}"
                              style="width: ${openPct}%;"
                              title="${item.dept}: ${item.open} Open (Click to view Target Dates & Extensions)"
                            >
                              <span style="font-size: 12px; font-weight: 700; color: #ffffff; line-height: 1; user-select: none;">
                                ${item.open}
                              </span>
                            </div>
                          ` : ''}

                          <!-- Segment 2: CLOSED (Green #10B981 on RIGHT - matching attached image) -->
                          ${item.closed > 0 ? `
                            <div
                              class="bg-[#10B981] hover:bg-[#059669] transition-all h-full flex items-center justify-center text-white ${item.open > 0 ? 'rounded-r-xl' : 'rounded-xl'}"
                              style="width: ${closedPct}%;"
                              title="${item.dept}: ${item.closed} Closed"
                            >
                              <span style="font-size: 12px; font-weight: 700; color: #ffffff; line-height: 1; user-select: none;">
                                ${item.closed}
                              </span>
                            </div>
                          ` : ''}

                        </div>
                      </div>
                    </div>

                    <!-- End Total Value and Percentage (e.g. 12 (50%)) -->
                    <div class="w-20 sm:w-28 shrink-0 pl-1 sm:pl-2 flex items-center gap-1.5 font-mono">
                      <span class="text-xs sm:text-sm font-black text-slate-900">${item.total}</span>
                      <span class="text-xs sm:text-sm font-black text-teal-600">(${completionRate}%)</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- ========================================================================= -->
          <!-- 5. DONUT CHART (ENLARGED)                                                 -->
          <!-- "make donut size bigger"                                                  -->
          <!-- ========================================================================= -->
          <div class="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 class="text-base sm:text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                <i data-lucide="pie-chart" class="w-5 h-5 text-indigo-600"></i>
                <span>Overall Status Breakdown</span>
              </h3>
              <span class="text-xs font-mono font-bold text-slate-500">Live PSSR Sync</span>
            </div>

            <div class="mt-6 flex flex-col lg:flex-row items-center justify-center gap-8 sm:gap-12">
              
              <!-- SVG Donut Chart with Increased Dimensions & Clean Readability -->
              <div class="relative w-64 h-64 sm:w-80 sm:h-80 md:w-92 md:h-92 shrink-0 flex items-center justify-center p-2">
                ${(() => {
                  const radius = 85;
                  const circumference = 2 * Math.PI * radius; // ~534.07
                  const total = kpis.total || 1;
                  const closedLength = (kpis.closed / total) * circumference;
                  const openLength = (kpis.open / total) * circumference;
                  const closedOffset = 0;
                  const openOffset = -closedLength;

                  return `
                    <svg class="w-full h-full transform -rotate-90" viewBox="0 0 220 220">
                      <defs>
                        <linearGradient id="pssr-donut-closed-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stop-color="#10B981"/>
                          <stop offset="100%" stop-color="#059669"/>
                        </linearGradient>
                        <linearGradient id="pssr-donut-open-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stop-color="#F43F5E"/>
                          <stop offset="100%" stop-color="#E11D48"/>
                        </linearGradient>
                      </defs>

                      <!-- Background track -->
                      <circle cx="110" cy="110" r="${radius}" fill="transparent" stroke="#F1F5F9" stroke-width="26"></circle>

                      <!-- Closed Arc (Emerald) -->
                      ${kpis.closed > 0 ? `
                        <circle cx="110" cy="110" r="${radius}" fill="transparent"
                          stroke="url(#pssr-donut-closed-grad)" stroke-width="26.5"
                          stroke-dasharray="${closedLength} ${circumference - closedLength}"
                          stroke-dashoffset="${closedOffset}"
                          stroke-linecap="round"></circle>
                      ` : ''}

                      <!-- Open Arc (Rose/Red) -->
                      ${kpis.open > 0 ? `
                        <circle cx="110" cy="110" r="${radius}" fill="transparent"
                          stroke="url(#pssr-donut-open-grad)" stroke-width="26"
                          stroke-dasharray="${openLength} ${circumference - openLength}"
                          stroke-dashoffset="${openOffset}"
                          stroke-linecap="round"></circle>
                      ` : ''}
                    </svg>

                    <!-- Donut Center Text -->
                    <div class="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                      <span class="text-4xl sm:text-5xl md:text-6xl font-black font-mono text-slate-900 tracking-tight leading-none">
                        ${kpis.percentage}
                      </span>
                      <span class="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest mt-2">
                        COMPLETION RATE
                      </span>
                    </div>
                  `;
                })()}
              </div>

              <!-- Legend Breakdown Details -->
              <div class="flex flex-col gap-4 min-w-[240px] w-full max-w-sm">
                
                <!-- Closed Card -->
                <div class="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div class="flex items-center gap-2.5">
                    <span class="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-xs shrink-0"></span>
                    <span class="text-xs sm:text-sm font-black text-emerald-900">Closed Observations</span>
                  </div>
                  <div class="text-right font-mono">
                    <span class="text-base sm:text-lg font-black text-emerald-950">${kpis.closed}</span>
                    <span class="text-xs font-bold text-emerald-700 ml-1">(${kpis.percentage})</span>
                  </div>
                </div>

                <!-- Open Card (Clickable to open Target Dates modal) -->
                <div
                  onclick="FPCL_PSSR_SUITE.openTargetDatesModal()"
                  class="flex flex-col gap-2 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 cursor-pointer hover:bg-rose-100 hover:border-rose-300 transition-all group"
                  title="Click to view Open Observations Target Dates (Col N, P, Q, U, R)"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                      <span class="w-3.5 h-3.5 rounded-full bg-[#F43F5E] shadow-xs shrink-0"></span>
                      <span class="text-xs sm:text-sm font-black text-rose-900">Open Observations</span>
                    </div>
                    <div class="text-right font-mono">
                      <span class="text-base sm:text-lg font-black text-rose-950">${kpis.open}</span>
                      <span class="text-xs font-bold text-rose-700 ml-1">(${kpis.total > 0 ? ((kpis.open / kpis.total) * 100).toFixed(1) : 0}%)</span>
                    </div>
                  </div>
                  <div class="flex items-center justify-between pt-1 border-t border-rose-200/60 text-[11px] font-bold text-rose-700">
                    <span>View Target Dates (Col N, P, Q, U, R)</span>
                    <i data-lucide="external-link" class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"></i>
                  </div>
                </div>

                <!-- Total Filtered Card -->
                <div class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div class="flex items-center gap-2.5">
                    <span class="w-3.5 h-3.5 rounded-full bg-slate-700 shadow-xs shrink-0"></span>
                    <span class="text-xs sm:text-sm font-black text-slate-800">Total Filtered</span>
                  </div>
                  <div class="text-right font-mono">
                    <span class="text-base sm:text-lg font-black text-slate-900">${kpis.total}</span>
                    <span class="text-xs font-bold text-slate-500 ml-1">(100%)</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

          <!-- ========================================================================= -->
          <!-- 6. COMPLETE SCROLLABLE EXCEL SHEET IN FORM OF TABLE                        -->
          <!-- "below it display complete scrollable excel sheet in form of table."       -->
          <!-- ========================================================================= -->
          <div id="pssr-table-container-card" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <!-- Table Header Toolbar -->
            <div class="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
                  <i data-lucide="table" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="text-sm sm:text-base font-black text-slate-800 tracking-tight uppercase">
                    PSSR Master Observation Records
                  </h3>
                  <p class="text-[11px] font-bold text-slate-500">
                    Complete sheet view (${filtered.length} total records • 23 columns)
                  </p>
                </div>
              </div>

              <!-- Page Size & Counts -->
              <div class="flex items-center gap-3 text-xs font-bold text-slate-600">
                <span>View:</span>
                <select
                  onchange="FPCL_PSSR_SUITE.setPageSize(this.value)"
                  class="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                >
                  <option value="all" ${s.pageSize === 'all' ? 'selected' : ''}>Complete Sheet (${filtered.length} rows)</option>
                  <option value="50" ${s.pageSize === 50 ? 'selected' : ''}>50 rows</option>
                  <option value="25" ${s.pageSize === 25 ? 'selected' : ''}>25 rows</option>
                  <option value="15" ${s.pageSize === 15 ? 'selected' : ''}>15 rows</option>
                </select>
                <button
                  onclick="FPCL_PSSR_SUITE.exportFilteredCsv()"
                  class="px-2.5 py-1 rounded-lg text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-300 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Export current view to CSV"
                >
                  <i data-lucide="download" class="w-3 h-3 text-teal-700"></i>
                  <span>Export</span>
                </button>
              </div>
            </div>

            <!-- Table View Container -->
            <div id="pssr-table-mount">
              <!-- Rendered via renderTableOnly() -->
            </div>
          </div>

        </div>

        <!-- Detail Modal for Inspection -->
        <div id="pssr-detail-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs hidden items-center justify-center p-4">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200">
              <div class="flex items-center gap-2 text-slate-800 font-bold text-base">
                <i data-lucide="file-text" class="w-5 h-5 text-blue-600"></i>
                <span>PSSR Observation Details</span>
              </div>
              <button onclick="FPCL_PSSR_SUITE.closeFindingModal()" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
            <div id="pssr-modal-content" class="overflow-y-auto flex-1 pr-1">
              <!-- Dynamic content -->
            </div>
            <div class="pt-3 border-t border-slate-200 flex justify-end">
              <button onclick="FPCL_PSSR_SUITE.closeFindingModal()" class="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 transition-all cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 7. OPEN OBSERVATIONS TARGET DATES POP-UP WINDOW                           -->
        <!-- Displays Columns N (Target Date), P (1st Ext), Q (2nd Ext),                -->
        <!-- R (3rd Ext), and U (Clarification) for Open Observations                  -->
        <!-- ========================================================================= -->
        ${s.isTargetDatesModalOpen ? `
        <div
          id="pssr-target-dates-modal"
          class="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onclick="if(event.target === this) FPCL_PSSR_SUITE.closeTargetDatesModal()"
        >
          <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-7xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            
            <!-- Modal Header -->
            <div class="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-rose-50/70 via-white to-slate-50 flex items-start justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-[#F43F5E] text-white flex items-center justify-center shadow-md shrink-0">
                  <i data-lucide="calendar-clock" class="w-5 h-5"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-rose-100 text-rose-800 border border-rose-200">
                      Open Observations Schedule
                    </span>
                    <span class="text-xs font-mono text-slate-500 font-bold" id="pssr-target-dates-count">
                      ${this.getOpenObservationsWithDates().length} open items
                    </span>
                  </div>
                  <h2 class="text-base sm:text-xl font-black text-slate-900 tracking-tight mt-1">
                    OPEN OBSERVATIONS — TARGET DATES & EXTENSIONS REVIEW
                  </h2>
                  <p class="text-xs text-slate-500 font-medium">
                    Showing Columns N (Target Date), P (1st Ext), Q (2nd Ext), R (3rd Ext), and U (Clarification)
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <button
                  onclick="FPCL_PSSR_SUITE.exportOpenDatesCsv()"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition-all cursor-pointer"
                  title="Export open observations with target dates to CSV"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5 text-slate-600"></i>
                  <span class="hidden sm:inline">Export CSV</span>
                </button>
                <button
                  onclick="FPCL_PSSR_SUITE.closeTargetDatesModal()"
                  class="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                  title="Close window (Esc)"
                >
                  <i data-lucide="x" class="w-5 h-5"></i>
                </button>
              </div>
            </div>

            <!-- Quick Filter & Search Bar Inside Modal -->
            <div class="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-3">
              <div class="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Filter by keyword, ID, area, department, or date..."
                  value="${s.targetDatesModalSearch ? s.targetDatesModalSearch.replace(/"/g, '&quot;') : ''}"
                  oninput="FPCL_PSSR_SUITE.setTargetDatesSearch(this.value)"
                  class="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs"
                />
                <div class="absolute right-3 top-2.5 text-slate-400 pointer-events-none">
                  <i data-lucide="search" class="w-4 h-4"></i>
                </div>
              </div>

              <div class="flex items-center gap-2 w-full sm:w-auto">
                <select
                  onchange="FPCL_PSSR_SUITE.setTargetDatesYear(this.value)"
                  class="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-2xs flex-1 sm:flex-initial"
                >
                  <option value="all" ${s.targetDatesModalYear === 'all' ? 'selected' : ''}>All Years (${years.length})</option>
                  ${years.map(y => `<option value="${y}" ${s.targetDatesModalYear === y ? 'selected' : ''}>Year ${y}</option>`).join('')}
                </select>

                <select
                  onchange="FPCL_PSSR_SUITE.setTargetDatesDept(this.value)"
                  class="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-2xs flex-1 sm:flex-initial"
                >
                  <option value="all" ${s.targetDatesModalDept === 'all' ? 'selected' : ''}>All Departments (${depts.length})</option>
                  ${depts.map(d => `<option value="${d.replace(/"/g, '&quot;')}" ${s.targetDatesModalDept === d ? 'selected' : ''}>${d}</option>`).join('')}
                </select>

                <select
                  onchange="FPCL_PSSR_SUITE.setTargetDatesArea(this.value)"
                  class="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-2xs flex-1 sm:flex-initial"
                >
                  <option value="all" ${s.targetDatesModalArea === 'all' ? 'selected' : ''}>All Areas (${areas.length})</option>
                  ${areas.map(a => `<option value="${a.replace(/"/g, '&quot;')}" ${s.targetDatesModalArea === a ? 'selected' : ''}>${a}</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- Table of Open Observations with Columns N, P, Q, U, R (Fully scrollable horizontally & vertically) -->
            <div class="overflow-x-auto overflow-y-auto flex-1 max-h-[66vh] border-b border-slate-200">
              <table class="w-full min-w-[1380px] border-collapse text-left text-xs">
                <thead class="bg-slate-100 sticky top-0 z-20 backdrop-blur-xs text-slate-700 border-b border-slate-200 shadow-2xs">
                  <tr>
                    <th class="px-3 py-3 font-black uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[70px]">ID (Col A)</th>
                    <th class="px-3 py-3 font-black uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[150px]">Area (Col C)</th>
                    <th class="px-3 py-3 font-black uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[140px]">Responsibility (Col M)</th>
                    <th class="px-4 py-3 font-black uppercase tracking-wider text-[11px] min-w-[340px]">AC Deficiency (Col L)</th>
                    <th class="px-3 py-3 font-black uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[135px] bg-blue-50/90 text-blue-900 border-x border-blue-100">Target Date (Col N)</th>
                    <th class="px-3 py-3 font-black uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[125px] bg-amber-50/90 text-amber-900 border-r border-amber-100">1st Ext (Col P)</th>
                    <th class="px-3 py-3 font-black uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[125px] bg-orange-50/90 text-orange-900 border-r border-orange-100">2nd Ext (Col Q)</th>
                    <th class="px-3 py-3 font-black uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[125px] bg-rose-50/90 text-rose-900 border-r border-rose-100">3rd Ext (Col R)</th>
                    <th class="px-3.5 py-3 font-black uppercase tracking-wider text-[11px] min-w-[240px]">Clarification (Col U)</th>
                    <th class="px-3 py-3 font-black uppercase tracking-wider text-[11px] text-center whitespace-nowrap min-w-[90px]">Status (Col O)</th>
                  </tr>
                </thead>
                <tbody id="pssr-target-dates-table-mount" class="divide-y divide-slate-100 bg-white">
                  <!-- Rendered dynamically -->
                </tbody>
              </table>
            </div>

            <!-- Modal Footer -->
            <div class="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
              <div class="font-medium text-center sm:text-left">
                Target dates and extensions update automatically when Google Sheet is edited.
              </div>
              <div class="flex items-center gap-2">
                <button
                  onclick="FPCL_PSSR_SUITE.exportOpenDatesCsv()"
                  class="px-3 py-1.5 rounded-xl font-bold bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 cursor-pointer shadow-2xs"
                >
                  Export CSV
                </button>
                <button
                  onclick="FPCL_PSSR_SUITE.closeTargetDatesModal()"
                  class="px-4 py-1.5 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 cursor-pointer shadow-2xs"
                >
                  Done
                </button>
              </div>
            </div>

          </div>
        </div>
        ` : ''}
      `;

      this.renderTableOnly();

      if (s.isTargetDatesModalOpen) {
        this.renderTargetDatesModalBodyOnly();
      }

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    /**
     * Renders only the scrollable Excel table component
     */
    renderTableOnly() {
      const mount = document.getElementById('pssr-table-mount');
      if (!mount) return;

      const filtered = this.getFilteredData();
      const s = this.state;

      const totalItems = filtered.length;
      const pageSize = s.pageSize === 'all' ? totalItems : s.pageSize;
      const totalPages = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 1;
      const currentPage = Math.min(Math.max(s.page, 1), totalPages);

      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = s.pageSize === 'all' ? totalItems : Math.min(startIndex + pageSize, totalItems);
      const pageData = filtered.slice(startIndex, endIndex);

      mount.innerHTML = `
        <!-- Complete Excel Sheet Table (No vertical scroll constraint - displays complete sheet) -->
        <div class="overflow-x-auto border-b border-slate-200">
          <table class="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead class="bg-slate-100/95 backdrop-blur-xs text-slate-700 uppercase font-black tracking-wider border-b-2 border-slate-300">
              <tr>
                <th class="px-3 py-3 border-r border-slate-200 text-center">#</th>
                <th class="px-3 py-3 border-r border-slate-200">ID (Col A)</th>
                <th class="px-4 py-3 border-r border-slate-200">Facility Description (Col B)</th>
                <th class="px-3 py-3 border-r border-slate-200">Area (Col C)</th>
                <th class="px-3 py-3 border-r border-slate-200">Initiator Unit (Col D)</th>
                <th class="px-3 py-3 border-r border-slate-200">Date Initiator (Date_of_Initiator)</th>
                <th class="px-3 py-3 border-r border-slate-200">Area Owner (Col F)</th>
                <th class="px-3 py-3 border-r border-slate-200">Form (Col G)</th>
                <th class="px-3 py-3 border-r border-slate-200 text-center">BC Pts (Col H)</th>
                <th class="px-4 py-3 border-r border-slate-200">Commissioning Auth (Col I)</th>
                <th class="px-3 py-3 border-r border-slate-200">Auth Date (Col J)</th>
                <th class="px-3 py-3 border-r border-slate-200 text-center">AC Pts (Col K)</th>
                <th class="px-6 py-3 border-r border-slate-200 min-w-[260px]">AC Deficiencies (Col L)</th>
                <th class="px-3 py-3 border-r border-slate-200 font-black text-blue-900">Responsibility (Col M)</th>
                <th class="px-3 py-3 border-r border-slate-200">Target Date (Col N)</th>
                <th class="px-3 py-3 border-r border-slate-200 font-black text-center">Status (Col O)</th>
                <th class="px-3 py-3 border-r border-slate-200">Target Ext 1 (Col P)</th>
                <th class="px-3 py-3 border-r border-slate-200">Target Ext 2 (Col Q)</th>
                <th class="px-3 py-3 border-r border-slate-200">Target Ext 3 (Col R)</th>
                <th class="px-3 py-3 border-r border-slate-200">Completion Date (Col S)</th>
                <th class="px-5 py-3 border-r border-slate-200 min-w-[200px]">Completion Remarks (Col T)</th>
                <th class="px-4 py-3 border-r border-slate-200">Clarification (Col U)</th>
                <th class="px-4 py-3 border-r border-slate-200">Remarks (Col W)</th>
                <th class="px-3 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 font-medium">
              ${pageData.length === 0 ? `
                <tr>
                  <td colspan="24" class="px-4 py-8 text-center text-slate-400 font-semibold">
                    No findings match the current filter selection.
                  </td>
                </tr>
              ` : pageData.map((item, idx) => {
                const isClosed = this.isClosedStatus(item.status);
                const isExtension = (item.status || '').toLowerCase() === 'extension';
                
                let statusBadge = '';
                if (isClosed) {
                  statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Close</span>`;
                } else if (isExtension) {
                  statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">Extension</span>`;
                } else {
                  statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">${item.status || 'Open'}</span>`;
                }

                return `
                  <tr class="hover:bg-blue-50/60 even:bg-slate-50/50 transition-colors cursor-pointer group" onclick="FPCL_PSSR_SUITE.openFindingModal(FPCL_PSSR_SUITE.getFilteredData()[${startIndex + idx}])">
                    <!-- Row Index -->
                    <td class="px-3 py-2.5 border-r border-slate-200 text-center font-mono text-slate-400 text-[11px]">${startIndex + idx + 1}</td>
                    
                    <!-- ID (Col A) -->
                    <td class="px-3 py-2.5 border-r border-slate-200 font-mono font-black text-blue-700">
                      <span class="px-2 py-0.5 rounded bg-blue-50 border border-blue-200">PSSR #${item.id}</span>
                    </td>

                    <!-- Facility Description (Col B) -->
                    <td class="px-4 py-2.5 border-r border-slate-200 font-bold text-slate-800 truncate max-w-[280px]" title="${item.facilityDescription}">${item.facilityDescription || '-'}</td>

                    <!-- Area (Col C) -->
                    <td class="px-3 py-2.5 border-r border-slate-200 font-bold text-teal-800">${item.area || '-'}</td>

                    <!-- Initiator Unit (Col D) -->
                    <td class="px-3 py-2.5 border-r border-slate-200 text-slate-700 font-semibold">${item.initiatorUnit || '-'}</td>

                    <!-- Date of Initiator (Col E) -->
                    <td class="px-3 py-2.5 border-r border-slate-200 font-mono text-slate-600">${item.dateOfInitiator || '-'}</td>

                    <!-- Area Owner (Col F) -->
                    <td class="px-3 py-2.5 border-r border-slate-200 text-slate-700 font-medium">${item.areaOwner || '-'}</td>

                    <!-- Short / Long Form (Col G) -->
                    <td class="px-3 py-2.5 border-r border-slate-200 text-slate-600">${item.shortLongForm || '-'}</td>

                    <!-- BC Points (Col H) -->
                    <td class="px-3 py-2.5 border-r border-slate-200 text-center font-mono font-bold text-slate-700">${item.bcPoints || '-'}</td>

                    <!-- Commissioning Auth (Col I) -->
                    <td class="px-4 py-2.5 border-r border-slate-200 text-slate-700 font-medium">${item.commissioningAuth || '-'}</td>

                    <!-- Auth Date (Col J) -->
                    <td class="px-3 py-2.5 border-r border-slate-200 font-mono text-slate-600">${item.signingDateAuth || '-'}</td>

                    <!-- Number of AC points (Col K) -->
                    <td class="px-3 py-2.5 border-r border-slate-200 text-center font-mono font-bold text-slate-700">${item.numAcPoints || '-'}</td>

                    <!-- AC Deficiencies (Col L) -->
                    <td class="px-6 py-2.5 border-r border-slate-200 font-medium text-slate-800 truncate max-w-[340px]" title="${item.acDeficiencies}">${item.acDeficiencies || '-'}</td>

                    <!-- Responsibility (Col M) -->
                    <td class="px-3 py-2.5 border-r border-slate-200 font-black text-blue-700 bg-blue-50/30">${item.responsibility || '-'}</td>

                    <!-- Target Date (Col N) -->
                    <td class="px-3 py-2.5 border-r border-slate-200 font-mono text-slate-700">${item.targetDate || '-'}</td>

                    <!-- Status (Col O) -->
                    <td class="px-3 py-2.5 border-r border-slate-200 text-center">${statusBadge}</td>

                    <!-- Target Ext 1 (Col P) -->
                    <td class="px-3 py-2.5 border-r border-slate-200 font-mono text-slate-500">${item.targetDate1stExt || '-'}</td>

                    <!-- Target Ext 2 (Col Q) -->
                    <td class="px-3 py-2.5 border-r border-slate-200 font-mono text-slate-500">${item.targetDate2ndExt || '-'}</td>

                    <!-- Target Ext 3 (Col R) -->
                    <td class="px-3 py-2.5 border-r border-slate-200 font-mono text-slate-500">${item.targetDate3rdExt || '-'}</td>

                    <!-- Completion Date (Col S) -->
                    <td class="px-3 py-2.5 border-r border-slate-200 font-mono font-bold text-slate-700">${item.completionDate || '-'}</td>

                    <!-- Completion Remarks (Col T) -->
                    <td class="px-5 py-2.5 border-r border-slate-200 text-slate-600 truncate max-w-[260px]" title="${item.completionRemarks}">${item.completionRemarks || '-'}</td>

                    <!-- Clarification (Col U) -->
                    <td class="px-4 py-2.5 border-r border-slate-200 text-slate-600 truncate max-w-[200px]" title="${item.clarification}">${item.clarification || '-'}</td>

                    <!-- Remarks (Col W) -->
                    <td class="px-4 py-2.5 border-r border-slate-200 text-slate-600 truncate max-w-[200px]" title="${item.remarks}">${item.remarks || '-'}</td>

                    <!-- Actions -->
                    <td class="px-3 py-2.5 text-center">
                      <button
                        onclick="event.stopPropagation(); FPCL_PSSR_SUITE.openFindingModal(FPCL_PSSR_SUITE.getFilteredData()[${startIndex + idx}])"
                        class="px-2 py-0.5 rounded text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Table Information & Pagination Footer -->
        <div class="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div class="text-slate-600 font-semibold flex items-center gap-2">
            ${s.pageSize === 'all'
              ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-teal-100 text-teal-800 border border-teal-200"><i data-lucide="check" class="w-3 h-3 text-teal-700"></i> Complete Sheet</span>
                 <span>Displaying all <span class="font-black text-slate-900">${totalItems}</span> master observations</span>`
              : `<span>Showing <span class="font-bold text-slate-900">${totalItems > 0 ? startIndex + 1 : 0}</span> to <span class="font-bold text-slate-900">${endIndex}</span> of <span class="font-bold text-slate-900">${totalItems}</span> observations</span>`}
          </div>

          ${totalPages > 1 && s.pageSize !== 'all' ? `
            <div class="flex items-center gap-1.5 self-center">
              <button
                onclick="FPCL_PSSR_SUITE.setPage(${currentPage - 1})"
                ${currentPage <= 1 ? 'disabled' : ''}
                class="px-2.5 py-1 rounded-lg border border-slate-300 font-bold ${currentPage <= 1 ? 'opacity-40 cursor-not-allowed text-slate-400' : 'hover:bg-white text-slate-700 cursor-pointer'}"
              >
                Previous
              </button>

              ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
                <button
                  onclick="FPCL_PSSR_SUITE.setPage(${p})"
                  class="w-7 h-7 rounded-lg font-bold ${p === currentPage ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-white border border-slate-200 text-slate-700 cursor-pointer'}"
                >
                  ${p}
                </button>
              `).join('')}

              <button
                onclick="FPCL_PSSR_SUITE.setPage(${currentPage + 1})"
                ${currentPage >= totalPages ? 'disabled' : ''}
                class="px-2.5 py-1 rounded-lg border border-slate-300 font-bold ${currentPage >= totalPages ? 'opacity-40 cursor-not-allowed text-slate-400' : 'hover:bg-white text-slate-700 cursor-pointer'}"
              >
                Next
              </button>
            </div>
          ` : `
            <div class="text-[11px] font-semibold text-slate-400 hidden sm:block">
              All rows loaded • Click any row to inspect details
            </div>
          `}
        </div>
      `;

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }
  };

  // Auto-initialize when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => pssrSuite.init());
  } else {
    pssrSuite.init();
  }
})();
