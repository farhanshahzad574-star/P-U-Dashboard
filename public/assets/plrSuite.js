/**
 * FPCL Executive Operations & Plant Integrity Portal
 * Specialized PLR (Plant Loss Reports) Dashboard Suite
 * 
 * Color Scheme:
 * - Executive Industrial Light Portal Theme (Matching FPCL Operations Portal baseline)
 * - Clean white cards (bg-white), subtle slate borders (border-slate-200), soft shadows
 * - Corporate Steel Blue (#2E6DA4), Emerald (#10b981) for Closed/Resolved, Rose (#f43f5e) for Open
 * 
 * Layout & Visuals:
 * - 4 Executive KPI Cards: Total PLRs (233), Open PLRs (27), Total Recommendations (451), Open Recommendations (31)
 * - Row 1 Visuals:
 *     - PLR by Machine (Column G of PLR tab | 233 Outages) (Donut + Clean Quick-Select Pills)
 *     - Overall recommendations Resolution & Status (Pie Chart: 420 Closed / 31 Open Recommendations or 206/27 Incidents + Resolution Ratio + Direct Filter Actions)
 * - Row 2 Visuals:
 *     - Action Recommendations Per Dept (451 Recs) (Stacked / Side-by-Side / Trend Bar Chart, full width covering page area)
 * - Row 3 Visuals:
 *     - Assigned Recommendations Trend (Closed vs. Open) (Full cover chips row without scrollbars + Bento Grid of Dept Progress Cards)
 * - Row 4 Master Log:
 *     - Plant Records & Outage Log with Dual Tabs: PLR Incidents (233) & Recommendations (451)
 *     - Search, dropdowns, clean light table, export CSV, pagination
 * - Dual-Sheet Inspection Modal:
 *     - Cross-referencing PLRStatus incident report and Recommendations tab action items via shared PLR #
 */

(function () {
  'use strict';

  window.portalApp = window.portalApp || {};
  window.portalApp.state = window.portalApp.state || {};
  window.FPCL_PLR_SUITE = window.portalApp;
  var portalApp = window.portalApp;

  // Root-Level Modal Container Acquisition (Guarantees DOM attachment at document.body across all environments)
  function getPlrModalContainer() {
    let el = document.getElementById('plr-data-modal-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'plr-data-modal-container';
      document.body.appendChild(el);
    } else if (el.parentElement !== document.body) {
      document.body.appendChild(el);
    }
    return el;
  }

  function getPlrInspectionContainer() {
    let el = document.getElementById('plr-inspection-modal-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'plr-inspection-modal-container';
      document.body.appendChild(el);
    } else if (el.parentElement !== document.body) {
      document.body.appendChild(el);
    }
    return el;
  }

  function getPlrActionContainer() {
    let el = document.getElementById('plr-action-modal-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'plr-action-modal-container';
      document.body.appendChild(el);
    } else if (el.parentElement !== document.body) {
      document.body.appendChild(el);
    }
    return el;
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getDefaultPlrState() {
    return {
      activeTab: 'incidents', // 'incidents' or 'recommendations'
      recChartMode: 'side-by-side', // 'side-by-side', 'stacked', 'trend'
      assignedTrendMode: 'entity', // 'entity' or 'yearly'
      assignedTrendViewType: 'side-by-side', // 'side-by-side' or 'trend'
      selectedMachine: 'all',
      selectedPriority: 'all',
      selectedDept: 'all',
      selectedYear: 'all',
      selectedEntity: 'all',
      selectedStatus: 'all',
      searchQuery: '',
      page: 1,
      pageSize: 15,
      // Recommendations tab state
      recSelectedEntity: 'all',
      recSelectedStatus: 'all',
      recSearchQuery: '',
      recPage: 1,
      recPageSize: 15,
      // Visual & Interactive Data Modal State
      resolutionMode: 'recommendations', // 'recommendations' or 'incidents'
      deptBarViewMode: 'chart', // 'chart', 'table', 'split'
      activeModal: null,
      // Focused PLR inspection
      focusedPlrNo: null
    };
  }

  function getPlrState() {
    if (!window.portalApp) window.portalApp = {};
    if (!window.portalApp.state) window.portalApp.state = {};
    if (!window.portalApp.state.plrState) {
      window.portalApp.state.plrState = getDefaultPlrState();
    }
    return window.portalApp.state.plrState;
  }

  // Baseline snapshots of preloaded recommendations and incidents for resetting
  window.FPCL_PLR_RECOMMENDATIONS_BASELINE = Array.isArray(window.FPCL_PLR_RECOMMENDATIONS)
    ? JSON.parse(JSON.stringify(window.FPCL_PLR_RECOMMENDATIONS))
    : [];
  window.FPCL_PLR_DATA_BASELINE = Array.isArray(window.FPCL_PLR_DATA)
    ? JSON.parse(JSON.stringify(window.FPCL_PLR_DATA))
    : [];

  // HARDCODED PERMANENT GOOGLE SHEET CONFIGURATION
  // Pre-configured, permanent URLs for Recommendations and PLR tabs so user does not need to re-enter them
  const HARDCODED_RECOMMENDATIONS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1LJOdN8T7UUjaZbSfsCrO_Hdg1eoAgqnuE7mJDGtB8qo/export?format=csv&gid=1344438021';
  const HARDCODED_PLR_STATUS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1LJOdN8T7UUjaZbSfsCrO_Hdg1eoAgqnuE7mJDGtB8qo/export?format=csv&gid=0';

  window.FPCL_HARDCODED_RECOMMENDATIONS_SHEET_URL = HARDCODED_RECOMMENDATIONS_SHEET_URL;
  window.FPCL_HARDCODED_PLR_STATUS_SHEET_URL = HARDCODED_PLR_STATUS_SHEET_URL;

  // Helper to cleanse any old cached or imported data where PE was written as Plant Engineering
  function cleansePeEntities(recs) {
    if (!Array.isArray(recs)) return { recs, modified: false };
    let modified = false;
    recs.forEach(r => {
      if (r && r.actionBy && /plant\s*engineering/i.test(r.actionBy)) {
        r.actionBy = r.actionBy
          .replace(/Plant\s+Engineering\s*\(\s*PE\s*\)/gi, 'PE')
          .replace(/PE\s*\(\s*Plant\s+Engineering\s*\)/gi, 'PE')
          .replace(/Plant\s+Engineering/gi, 'PE')
          .trim();
        if (r.category && /plant\s*engineering/i.test(r.category)) {
          r.category = r.actionBy;
        }
        modified = true;
      }
    });
    return { recs, modified };
  }

  // Restore modified recommendations and incidents from localStorage if present
  try {
    const savedRecs = localStorage.getItem('FPCL_PLR_RECOMMENDATIONS_UPDATED');
    if (savedRecs) {
      const parsedSaved = JSON.parse(savedRecs);
      const minCount = Array.isArray(window.FPCL_PLR_RECOMMENDATIONS_BASELINE) && window.FPCL_PLR_RECOMMENDATIONS_BASELINE.length >= 500
        ? window.FPCL_PLR_RECOMMENDATIONS_BASELINE.length
        : 534;
      if (Array.isArray(parsedSaved) && parsedSaved.length >= minCount) {
        const { recs, modified } = cleansePeEntities(parsedSaved);
        window.FPCL_PLR_RECOMMENDATIONS = recs;
        if (modified) {
          try {
            localStorage.setItem('FPCL_PLR_RECOMMENDATIONS_UPDATED', JSON.stringify(recs));
          } catch (e) {}
        }
      } else {
        localStorage.removeItem('FPCL_PLR_RECOMMENDATIONS_UPDATED');
      }
    }
  } catch (err) {
    console.warn('Could not restore cached recommendations from localStorage:', err);
  }

  // Also ensure in-memory baseline recommendations strictly maintain PE
  if (Array.isArray(window.FPCL_PLR_RECOMMENDATIONS)) {
    cleansePeEntities(window.FPCL_PLR_RECOMMENDATIONS);
  }

  try {
    const savedIncidents = localStorage.getItem('FPCL_PLR_INCIDENTS_UPDATED');
    if (savedIncidents) {
      const parsedInc = JSON.parse(savedIncidents);
      // Validate that cached incidents are authentic plant records and not corrupt dummy rows
      const hasPlantMachines = Array.isArray(parsedInc) && parsedInc.some(i => {
        const m = String(i.machine || '').toLowerCase();
        return m.includes('stg') || m.includes('boiler') || m.includes('cfb') || m.includes('b#');
      });
      if (Array.isArray(parsedInc) && parsedInc.length >= 50 && hasPlantMachines) {
        window.FPCL_PLR_DATA = parsedInc;
      } else {
        localStorage.removeItem('FPCL_PLR_INCIDENTS_UPDATED');
        if (window.FPCL_PLR_DATA_BASELINE) {
          window.FPCL_PLR_DATA = JSON.parse(JSON.stringify(window.FPCL_PLR_DATA_BASELINE));
        }
      }
    }
  } catch (err) {
    console.warn('Could not restore cached incidents from localStorage:', err);
  }

  // Initialize PLR state immediately
  window.portalApp.state.plrState = window.portalApp.state.plrState || getDefaultPlrState();

  function getPlrData() {
    return Array.isArray(window.FPCL_PLR_DATA) ? window.FPCL_PLR_DATA : [];
  }

  function getPlrRecs() {
    return Array.isArray(window.FPCL_PLR_RECOMMENDATIONS) ? window.FPCL_PLR_RECOMMENDATIONS : [];
  }

  /**
   * Generates dynamic description string for PLR with real-time counts:
   * "Official Plant Loss Recommendations tracking {totalRecs} engineering and operational action items across {deptCount} standardized departments ({closedRecs} Closed, {openRecs} Open, {recClosureRate} Closure Rate), linked to {totalIncidents} generation loss incidents across standardized machine classes ({closedIncidents} Closed, {openIncidents} Open, {incResolutionRate} Resolution)."
   */
  portalApp.getPlrDynamicDescription = function () {
    const s = getPlrState();
    const activeFilters = [];
    if (s.selectedMachine && s.selectedMachine !== 'all') activeFilters.push(`Machine: ${s.selectedMachine}`);
    if (s.selectedPriority && s.selectedPriority !== 'all') activeFilters.push(`Priority: ${s.selectedPriority}`);
    if (s.selectedDept && s.selectedDept !== 'all') activeFilters.push(`Dept: ${s.selectedDept}`);
    if (s.selectedYear && s.selectedYear !== 'all') activeFilters.push(`Year: ${s.selectedYear}`);
    if (s.selectedEntity && s.selectedEntity !== 'all') activeFilters.push(`Entity: ${s.selectedEntity}`);
    if (s.searchQuery && s.searchQuery.trim()) activeFilters.push(`Search: "${s.searchQuery.trim()}"`);

    const hasActiveFilters = activeFilters.length > 0;
    const recs = hasActiveFilters ? getFilteredPlrRecs() : getPlrRecs();
    const incidents = hasActiveFilters ? getFilteredPlrData() : getPlrData();

    const totalRecs = recs.length;
    const openRecs = recs.filter(r => (r.status || '').toLowerCase() === 'open').length;
    const closedRecs = totalRecs - openRecs;
    const recClosureRate = totalRecs > 0 ? ((closedRecs / totalRecs) * 100).toFixed(1) + '%' : '0.0%';

    const totalIncidents = incidents.length;
    const openIncidents = incidents.filter(i => (i.status || '').toLowerCase() === 'open').length;
    const closedIncidents = totalIncidents - openIncidents;
    const incResolutionRate = totalIncidents > 0 ? ((closedIncidents / totalIncidents) * 100).toFixed(1) + '%' : '0.0%';

    if (!hasActiveFilters) {
      let deptCount = 13;
      try {
        if (typeof getDeptRecsList === 'function') {
          const dList = getDeptRecsList(true);
          if (dList && dList.length) deptCount = dList.length;
        }
      } catch (e) {}
      return `Official Plant Loss Recommendations tracking ${totalRecs} engineering and operational action items across ${deptCount} standardized departments (${closedRecs} Closed, ${openRecs} Open, ${recClosureRate} Closure Rate), linked to ${totalIncidents} generation loss incidents across standardized machine classes (${closedIncidents} Closed, ${openIncidents} Open, ${incResolutionRate} Resolution).`;
    } else {
      return `Filtered Scope (${activeFilters.join(', ')}): Tracking ${totalRecs} recommendations (${closedRecs} Closed, ${openRecs} Open, ${recClosureRate} Closure Rate) and ${totalIncidents} generation loss incidents (${closedIncidents} Closed, ${openIncidents} Open, ${incResolutionRate} Resolution Rate).`;
    }
  };

  /**
   * Synchronize current PLR metrics to the Overview Dashboard registry and rollups
   */
  portalApp.syncPlrStatsToOverview = function () {
    const recs = getPlrRecs();
    const total = recs.length;
    const open = recs.filter(r => (r.status || '').toLowerCase() === 'open').length;
    const closed = total - open;
    const rate = total > 0 ? ((closed / total) * 100).toFixed(1) + '%' : '0.0%';

    const incidents = getPlrData();
    const totalInc = incidents.length;
    const openInc = incidents.filter(i => (i.status || '').toLowerCase() === 'open').length;
    const closedInc = totalInc - openInc;
    const incRate = totalInc > 0 ? ((closedInc / totalInc) * 100).toFixed(1) + '%' : '0.0%';

    const dynamicDesc = portalApp.getPlrDynamicDescription();

    const registry = window.DASHBOARD_REGISTRY || (typeof DASHBOARD_REGISTRY !== 'undefined' ? DASHBOARD_REGISTRY : null);
    if (registry) {
      const plrEntry = registry.find(d => d.id === 'plr');
      if (plrEntry) {
        plrEntry.department = 'Process';
        plrEntry.description = dynamicDesc;
        plrEntry.kpis = { total, closed, inProgress: open, overdue: 0, compliance: rate };
        plrEntry.punchList = { open, closed, total, rate };
        plrEntry.statusComment = `${total} Recommendations across standardized departments: ${closed} Closed, ${open} Open (${rate} Closure) • ${totalInc} PLR Incidents across standardized machines: ${closedInc} Closed, ${openInc} Open (${incRate} Resolution).`;
      }
    }

    const descEl = document.getElementById('detail-description');
    const ownerEl = document.getElementById('detail-owner');
    if (portalApp.state && portalApp.state.activeDashboardId === 'plr') {
      if (descEl) {
        descEl.textContent = '';
        descEl.style.display = 'none';
      }
      if (ownerEl) ownerEl.textContent = 'Process';
    }

    if (window.portalApp && typeof window.portalApp.updateRollupStats === 'function') {
      window.portalApp.updateRollupStats();
    }
    if (window.portalApp && typeof window.portalApp.renderCards === 'function') {
      window.portalApp.renderCards();
    }
    if (window.portalApp && typeof window.portalApp.renderComparisonChart === 'function') {
      window.portalApp.renderComparisonChart();
    }
  };

  // Run initial sync on load
  portalApp.syncPlrStatsToOverview();

  /**
   * RFC-4180 Compliant CSV Matrix Tokenizer
   * Properly parses quoted multiline strings, embedded commas, and CRLF
   */
  function parseRawCSVMatrix(csvText) {
    if (!csvText || typeof csvText !== 'string') return [];

    const rows = [];
    let currentRow = [];
    let currentVal = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentVal.trim());
        currentVal = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // handle CRLF
        }
        currentRow.push(currentVal.trim());
        currentVal = '';
        if (currentRow.some(val => val.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentVal += char;
      }
    }

    // Push trailing value if present
    if (currentVal.length > 0 || currentRow.length > 0) {
      currentRow.push(currentVal.trim());
      if (currentRow.some(val => val.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  }
  window.parseRawCSVMatrix = parseRawCSVMatrix;

  /**
   * RFC-4180 Compliant CSV Parser specifically tailored for Google Sheet Tab "Recommendations"
   * Picks recommendation text from Column E named "Recommendations" (or index 4)
   */
  window.parsePLRRecommendationsCSV = function (csvText) {
    if (!csvText || typeof csvText !== 'string') return [];

    const rows = parseRawCSVMatrix(csvText);
    if (rows.length < 2) return [];

    // Clean headers for index matching
    const headers = rows[0].map(h => (h || '').trim().toLowerCase().replace(/[^a-z0-9]/g, ''));

    const findCol = (keywords) => {
      return headers.findIndex(h => keywords.some(k => h.includes(k)));
    };

    // Specifically detect Column E (index 4) named "Recommendations"
    let colRec = findCol(['recommendation', 'recommendations', 'rec', 'actionrecommendation', 'correctiveaction']);
    if (colRec === -1 && rows[0].length >= 5) {
      colRec = 4; // Column E (0-indexed 4)
    }

    // S_No (Col A)
    let colSNo = findCol(['sno', 'sr', 's_no', 'serial', 'number']);
    if (colSNo === -1) colSNo = 0;

    // PLR # (Col B)
    let colPlr = findCol(['plr', 'plrno', 'ref', 'incidentno', 'incidentref']);
    if (colPlr === -1 && rows[0].length > 1) colPlr = 1;

    // Year (Col C)
    let colYear = findCol(['year', 'yr']);
    if (colYear === -1 && rows[0].length > 2) colYear = 2;

    // Date (Col D)
    let colDate = findCol(['date', 'dt']);
    if (colDate === -1 && rows[0].length > 3) colDate = 3;

    // Action Entity / Department (Col F: Column 6, 0-indexed 5)
    let colAction = findCol(['actionby', 'actionentity', 'responsibledepartment', 'department', 'dept', 'entity', 'owner', 'responsible', 'actiondept', 'actionparty']);
    if (colAction === -1 && rows[0].length > 5) colAction = 5;

    // Status (Col G: Column 7, 0-indexed 6)
    let colStatus = findCol(['status', 'openclose', 'state', 'condition']);
    if (colStatus === -1 && rows[0].length > 6) colStatus = 6;

    const parsedItems = [];

    // STRICT: Start from r = 1 (Row 2 in Google Sheet). Row 1 is header row and NEVER counted in dataset.
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      // Ensure this row is not a repeated header row by checking keywords
      const firstColLower = String(row[0] || '').trim().toLowerCase();
      const secondColLower = String(row[1] || '').trim().toLowerCase();
      if (firstColLower === 's_no' || firstColLower === 's.no' || secondColLower.includes('plr #') || secondColLower === 'plr') {
        continue; // skip repeated header
      }

      // Extract Action Entity / Department directly from Column F (index 5)
      let rawAction = '';
      if (row.length > 5 && row[5] !== undefined && row[5] !== null && String(row[5]).trim() !== '') {
        rawAction = String(row[5]).trim();
      } else if (colAction !== -1 && row[colAction] !== undefined && row[colAction] !== null) {
        rawAction = String(row[colAction]).trim();
      }

      // Strictly normalize any Plant Engineering variation to 'PE' directly as specified in Google Sheet Column F
      if (rawAction && /plant\s*engineering/i.test(rawAction)) {
        rawAction = rawAction
          .replace(/Plant\s+Engineering\s*\(\s*PE\s*\)/gi, 'PE')
          .replace(/PE\s*\(\s*Plant\s+Engineering\s*\)/gi, 'PE')
          .replace(/Plant\s+Engineering/gi, 'PE')
          .trim();
      }

      // Extract recommendation from Column E (index 4) named Recommendations
      let rawRec = (colRec !== -1 && row[colRec]) ? String(row[colRec]).trim() : (row.length > 4 ? String(row[4] || '').trim() : '');
      
      // If row has neither recommendation text nor action department, skip
      if (!rawRec && !rawAction) continue;
      if (!rawRec) {
        rawRec = `Action item for ${rawAction || 'Department'} (PLR #${row[colPlr] || r})`;
      }

      // Extract Status (Col G / index 6)
      let rawStatus = '';
      if (row.length > 6 && row[6] !== undefined && row[6] !== null && String(row[6]).trim() !== '') {
        rawStatus = String(row[6]).trim();
      } else if (colStatus !== -1 && row[colStatus] !== undefined && row[colStatus] !== null) {
        rawStatus = String(row[colStatus]).trim();
      }
      if (!rawStatus) rawStatus = 'Open';

      // Normalize status: "Closed", "Close", "Done", "Resolved", "Completed", "Yes" -> "Closed"; others -> "Open"
      let normStatus = 'Open';
      const sLower = rawStatus.toLowerCase().trim();
      if (sLower.includes('close') || sLower.includes('done') || sLower.includes('resolv') || sLower.includes('complet') || sLower === 'yes' || sLower === 'y') {
        normStatus = 'Closed';
      } else {
        normStatus = 'Open';
      }

      const rawPlr = (colPlr !== -1 && row[colPlr]) ? String(row[colPlr]).trim() : '';
      const plrMatch = rawPlr.match(/\d+/);
      const plrNo = plrMatch ? parseInt(plrMatch[0], 10) : (rawPlr || r);

      const rawSNo = (colSNo !== -1 && row[colSNo]) ? String(row[colSNo]).trim() : '';
      const sNo = rawSNo && !isNaN(parseInt(rawSNo, 10)) ? parseInt(rawSNo, 10) : (parsedItems.length + 1);

      const rawYear = (colYear !== -1 && row[colYear]) ? String(row[colYear]).trim() : '';
      const rawDate = (colDate !== -1 && row[colDate]) ? String(row[colDate]).trim() : '';

      parsedItems.push({
        sNo: sNo,
        plrNo: plrNo,
        year: rawYear ? (isNaN(parseInt(rawYear, 10)) ? rawYear : parseInt(rawYear, 10)) : 2025,
        date: rawDate,
        recommendation: rawRec, // Picked from Column E named Recommendations in Google Sheet tab Recommendations
        actionBy: rawAction || 'Unassigned', // Picked directly from Column F of tab Recommendations
        status: normStatus,
        category: rawAction || 'General'
      });
    }

    return parsedItems;
  };

  /**
   * Ingest CSV from Google Sheet tab named "PLR" (Incidents breakdown & status)
   * Strictly starts from row 2 (row 1 is header row and NEVER counted in dataset).
   * Column A: S_No
   * Column B: PLR #
   * Column C: Year
   * Column D: Date
   * Column E: Incident Description
   * Column F: Status (Open / Closed)
   * Column G: Machine Name (STG#4, B#1 / CFB-1, STG#3 / STG-03, etc.)
   * Column H: Priority
   * Column I: Responsible Department
   */
  window.parsePLRIncidentsCSV = function (csvText) {
    if (!csvText || typeof csvText !== 'string') return [];

    const rows = parseRawCSVMatrix(csvText);
    if (!rows || rows.length < 2) return [];

    // Find header row dynamically across the first 5 rows
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      const rowStrings = rows[i].map(c => String(c || '').toLowerCase().trim());
      const hasKeyHeaders = rowStrings.some(c => c.includes('plr') || c.includes('incident') || c.includes('machine') || c.includes('s_no') || c.includes('status'));
      if (hasKeyHeaders) {
        headerRowIdx = i;
        break;
      }
    }

    const headerRow = rows[headerRowIdx].map(h => String(h || '').trim().toLowerCase());

    const findCol = (terms) => {
      for (let i = 0; i < headerRow.length; i++) {
        const h = headerRow[i];
        if (terms.some(t => h.includes(t))) return i;
      }
      return -1;
    };

    let colSNo = findCol(['s_no', 's.no', 'sno', 'serial']);
    if (colSNo === -1 && rows[headerRowIdx].length > 0) colSNo = 0;

    let colPlr = findCol(['plr', 'finding', 'loss']);
    if (colPlr === -1 && rows[headerRowIdx].length > 1) colPlr = 1;

    let colYear = findCol(['year']);
    if (colYear === -1 && rows[headerRowIdx].length > 2) colYear = 2;

    let colDate = findCol(['date']);
    if (colDate === -1 && rows[headerRowIdx].length > 3) colDate = 3;

    let colIncident = findCol(['incident', 'description', 'title', 'event']);
    if (colIncident === -1 && rows[headerRowIdx].length > 4) colIncident = 4;

    let colStatus = findCol(['status', 'state', 'openclose']);
    if (colStatus === -1 && rows[headerRowIdx].length > 5) colStatus = 5;

    // Strictly use Column G (index 6) of PLR tab of Google Sheet for Machine
    let colMachine = findCol(['machine', 'equipment', 'unit', 'asset']);
    if (colMachine === -1 && rows[headerRowIdx].length > 6) colMachine = 6;
    if (colMachine === -1) colMachine = 6; // strictly Column G

    let colPriority = findCol(['priority', 'severity']);
    if (colPriority === -1 && rows[headerRowIdx].length > 7) colPriority = 7;

    let colDept = findCol(['department', 'dept', 'action by', 'responsible']);
    if (colDept === -1 && rows[headerRowIdx].length > 8) colDept = 8;

    const parsedIncidents = [];

    // STRICT: Start immediately after the detected header row. Never count header row in dataset.
    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      // Ensure this row is not a repeated header row or total/summary row
      const firstColLower = String(row[0] || '').trim().toLowerCase();
      const secondColLower = String(row[1] || '').trim().toLowerCase();
      if (
        firstColLower === 's_no' || firstColLower === 's.no' || secondColLower.includes('plr #') || secondColLower === 'plr' ||
        firstColLower.startsWith('total') || secondColLower.startsWith('total') || firstColLower.startsWith('count')
      ) {
        continue;
      }

      // Extract Incident description (Column E / index 4)
      const rawIncident = (colIncident !== -1 && row[colIncident]) ? String(row[colIncident]).trim() : (row.length > 4 ? String(row[4] || '').trim() : '');

      // Extract Machine strictly from Column G (index 6) of PLR tab of Google Sheet
      const rawMachine = (colMachine !== -1 && row[colMachine] !== undefined && row[colMachine] !== null && String(row[colMachine]).trim() !== '')
        ? String(row[colMachine]).trim()
        : (row.length > 6 && row[6] !== undefined && row[6] !== null ? String(row[6]).trim() : 'Other Equipment');

      // Extract Status (Column F / index 5)
      let rawStatus = (colStatus !== -1 && row[colStatus] !== undefined && row[colStatus] !== null) ? String(row[colStatus]).trim() : (row.length > 5 ? String(row[5] || '').trim() : '');

      // If all critical fields are blank, skip row
      if (!rawIncident && !rawMachine && !rawStatus) continue;

      // Normalize status: "Closed", "Close", "Done", "Resolved", "Completed", "Yes" -> "Closed"; otherwise -> "Open"
      let normStatus = 'Open';
      const sLower = rawStatus.toLowerCase().trim();
      if (sLower.includes('close') || sLower.includes('done') || sLower.includes('resolv') || sLower.includes('complet') || sLower === 'yes' || sLower === 'y') {
        normStatus = 'Closed';
      } else {
        normStatus = 'Open';
      }

      const rawPlr = (colPlr !== -1 && row[colPlr]) ? String(row[colPlr]).trim() : '';
      const plrMatch = rawPlr.match(/\d+/);
      const plrNo = plrMatch ? parseInt(plrMatch[0], 10) : (rawPlr || r);

      const rawSNo = (colSNo !== -1 && row[colSNo]) ? String(row[colSNo]).trim() : '';
      const sNo = rawSNo && !isNaN(parseInt(rawSNo, 10)) ? parseInt(rawSNo, 10) : (parsedIncidents.length + 1);

      const rawYear = (colYear !== -1 && row[colYear]) ? String(row[colYear]).trim() : '';
      const rawDate = (colDate !== -1 && row[colDate]) ? String(row[colDate]).trim() : '';
      const rawPriority = (colPriority !== -1 && row[colPriority]) ? String(row[colPriority]).trim() : 'Medium';
      const rawDept = (colDept !== -1 && row[colDept]) ? String(row[colDept]).trim() : 'E&I';

      parsedIncidents.push({
        sNo: sNo,
        plrNo: plrNo,
        year: rawYear ? (isNaN(parseInt(rawYear, 10)) ? rawYear : parseInt(rawYear, 10)) : 2025,
        date: rawDate,
        incident: rawIncident || `Plant outage event (PLR #${plrNo})`,
        status: normStatus,
        machine: rawMachine || 'Other Equipment',
        priority: rawPriority,
        dept: rawDept
      });
    }

    // Sanity check: Ensure the parsed data contains recognizable plant outage records
    const hasPlantData = parsedIncidents.some(i => {
      const m = String(i.machine || '').toLowerCase();
      const inc = String(i.incident || '').toLowerCase();
      return m.includes('stg') || m.includes('boiler') || m.includes('cfb') || m.includes('b#') || inc.includes('stg') || inc.includes('boiler') || inc.includes('trip') || inc.includes('outage');
    });

    if (parsedIncidents.length > 5 && !hasPlantData) {
      console.warn('parsePLRIncidentsCSV: Parsed sheet rows do not appear to be plant outage records.');
      return [];
    }

    return parsedIncidents;
  };

  /**
   * Dynamic Normalization & Department Extraction (Column F: ACTION ENTITY)
   * Ensures every department mentioned in Column F of the Google Sheet tab "Recommendations"
   * is accurately extracted, standardized, and accounted for in the Open vs. Closed Findings chart.
   * Handles single departments as well as multi-department entries (e.g. "E&I / Mechanical", "KE , E&I").
   */
  function splitAndNormalizeActionEntities(raw) {
    if (!raw || typeof raw !== 'string') return ['Unassigned'];
    let str = String(raw).trim();
    if (!str || str === '-' || str.toLowerCase() === 'none' || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'unassigned') {
      return ['Unassigned'];
    }

    // Strictly enforce source Google Sheet entity name: in Google Sheet Column F it is just 'PE'
    // Prevent any expansion into "Plant Engineering" or "Plant Engineering (PE)"
    str = str.replace(/Plant\s+Engineering\s*\(\s*PE\s*\)/gi, 'PE');
    str = str.replace(/PE\s*\(\s*Plant\s+Engineering\s*\)/gi, 'PE');
    str = str.replace(/Plant\s+Engineering/gi, 'PE');

    // Protect known multi-character tokens containing '&', '/', or parentheses
    str = str.replace(/E\s*&\s*I/gi, '__E_AND_I__');
    str = str.replace(/O\s*\/\s*C/gi, '__O_SLASH_C__');
    str = str.replace(/FPCL\s*-\s*KE/gi, '__FPCL_KE__');
    str = str.replace(/Maintenance\s*\/\s*Technical/gi, '__MAINT_TECH__');

    // Split by comma, slash, semicolon, newline, plus, ' and ' or isolated ' & '
    const parts = str.split(/[,;\n\r\+]|\s*\/\s*|\s+and\s+|\s+&\s+/i);

    const normalizeToken = (t) => {
      let s = t
        .replace(/__E_AND_I__/g, 'E&I')
        .replace(/__O_SLASH_C__/g, 'O/C')
        .replace(/__FPCL_KE__/g, 'FPCL-KE')
        .replace(/__MAINT_TECH__/g, 'Maintenance')
        .trim();

      if (!s || s === '-' || s.toLowerCase() === 'none' || s.toLowerCase() === 'n/a') return null;

      const lower = s.toLowerCase();
      // E&I variations
      if (lower === 'e&i' || lower === 'e & i' || lower === 'electrical' || lower === 'elect.' || lower.includes('electrical & instrumentation') || lower.includes('e&i') || lower.includes('fpcl e&i') || lower.includes('ffbl e&i')) {
        return 'E&I';
      }
      // Mechanical variations
      if (lower === 'mechanical' || lower === 'mech' || lower.includes('mechanical maintenance') || lower === 'maintenance / mechanical') {
        return 'Mechanical';
      }
      // Operations variations
      if (lower === 'operation' || lower === 'operations' || lower === 'ops' || lower === 'oprs' || lower.includes('ops-psg') || lower === 'process') {
        return 'Operations';
      }
      // PE entity directly as specified in Google Sheet - strictly keep as PE, never expand
      if (lower === 'pe' || lower === 'plant engineering' || lower.includes('plant engineering') || lower === 'plant eng' || lower.startsWith('pe ') || lower === 'pe/technical') {
        return 'PE';
      }
      // FPCL-KE O/C variations
      if (lower === 'fpcl-ke o/c' || lower === 'fpcl-ke' || lower === 'ke o/c' || lower === 'fpcl / ke o/c' || lower === 'fpcl-ke o/c ') {
        return 'FPCL-KE O/C';
      }
      // KE (K-Electric) variations
      if (lower === 'ke' || lower === 'k-electric') {
        return 'KE';
      }
      // Other distinct plant functional entities
      if (lower === 'finance' || lower === 'fin') return 'Finance';
      if (lower === 'scm' || lower === 'supply chain' || lower === 'supply chain management') return 'SCM';
      if (lower === 'hse' || lower === 'safety' || lower === 'environment') return 'HSE';
      if (lower === 'planning') return 'Planning';
      if (lower === 'hhi') return 'HHI';
      if (lower === 'bhge') return 'BHGE';
      if (lower === 'all' || lower === 'all departments') return 'All';
      if (lower === 'maintenance') return 'Maintenance';
      if (lower === 'inspection') return 'Inspection';

      // Capitalize first letter of any other custom department name found in Column F
      return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const results = [];
    parts.forEach(p => {
      const norm = normalizeToken(p);
      if (norm && !results.includes(norm)) results.push(norm);
    });

    return results.length > 0 ? results : ['Unassigned'];
  }

  function normalizeActionEntity(raw) {
    const list = splitAndNormalizeActionEntities(raw);
    return list.join(' / ');
  }

  /**
   * Check if a raw Action Entity string matches a target entity filter
   * Accounts for any department mentioned in Column F
   */
  function matchesActionEntity(rawActionBy, targetEntity) {
    if (!targetEntity || targetEntity === 'all') return true;
    const cleanTarget = normalizeActionEntity(targetEntity).toLowerCase();
    const entities = splitAndNormalizeActionEntities(rawActionBy);
    return entities.some(e => {
      const el = e.toLowerCase();
      return el === cleanTarget || cleanTarget.includes(el) || el.includes(cleanTarget);
    });
  }

  /**
   * Standardized Machine Categorization from Column G of PLR Google Sheet tab
   * Correctly groups:
   * - B#1, CFB-1 -> Boiler # 1 (CFB-1) (17 outages)
   * - STG#3, STG-03 -> STG # 3 (17 outages)
   * - STG#4, STG-04 -> STG # 4 (154 outages)
   * - STG#2, STG-02 -> STG # 2 (11 outages)
   * - B#2, CFB-2 -> Boiler # 2 (CFB-2) (11 outages)
   * - STG#1, STG-01 -> STG # 1 (10 outages)
   * - Miscellaneous / multi-unit outage events -> Other Equipment (13 outages)
   */
  function getMachineCategory(rawMachine) {
    if (!rawMachine) return 'Other Equipment';
    const str = String(rawMachine).trim();
    const lower = str.toLowerCase();

    // Multi-unit, grid, or general outage events belong to Other Equipment
    if (
      lower.includes('total power failure') ||
      lower.includes('low load') ||
      lower.includes('boiler # 1 / 2') ||
      lower.includes('boiler 1 / 2') ||
      lower.includes('boiler-1 / 2') ||
      lower.includes('boiler 1 & 2') ||
      lower.includes('stg-1 & stg-2') ||
      lower.includes('all machines') ||
      lower.includes('& stg') ||
      (str.includes('\n') && (lower.includes('stg') || lower.includes('cfb')))
    ) {
      return 'Other Equipment';
    }

    // Check STG units (handles STG#4, STG # 4, STG - 4, STG-4, STG-04, STG # 04, etc.)
    if (/\bstg\s*[#\-]?\s*0?4\b/i.test(str) || /^stg\s*[#\-]?\s*0?4$/i.test(str) || str === 'STG#4' || str === 'STG-04') return 'STG # 4';
    if (/\bstg\s*[#\-]?\s*0?3\b/i.test(str) || /^stg\s*[#\-]?\s*0?3$/i.test(str) || str === 'STG#3' || str === 'STG-03') return 'STG # 3';
    if (/\bstg\s*[#\-]?\s*0?2\b/i.test(str) || /^stg\s*[#\-]?\s*0?2$/i.test(str) || str === 'STG#2' || str === 'STG-02') return 'STG # 2';
    if (/\bstg\s*[#\-]?\s*0?1\b/i.test(str) || /^stg\s*[#\-]?\s*0?1$/i.test(str) || str === 'STG#1' || str === 'STG-01') return 'STG # 1';

    // Check Boilers / CFB (handles B#1, CFB-1, Boiler # 1, Boiler-1, Boiler 1, CFB 1, etc.)
    if (/^(?:cfb|boiler|b)\s*[#\-]?\s*0?1$/i.test(str) || /^(?:cfb|boiler|b)\s*[#\-]?\s*0?1\b/i.test(str) || str === 'B#1') return 'Boiler # 1 (CFB-1)';
    if (/^(?:cfb|boiler|b)\s*[#\-]?\s*0?2$/i.test(str) || /^(?:cfb|boiler|b)\s*[#\-]?\s*0?2\b/i.test(str) || str === 'B#2') return 'Boiler # 2 (CFB-2)';

    return 'Other Equipment';
  }

  /**
   * Dynamic calculation of machine outage breakdown from active PLR dataset
   */
  function getPlrMachinesBreakdown() {
    const records = getPlrData();
    const meta = [
      { name: 'STG # 4', color: '#1e40af' },
      { name: 'STG # 3', color: '#047857' },
      { name: 'Boiler # 1 (CFB-1)', color: '#7c3aed' },
      { name: 'STG # 2', color: '#0891b2' },
      { name: 'Boiler # 2 (CFB-2)', color: '#d97706' },
      { name: 'STG # 1', color: '#0284c7' },
      { name: 'Other Equipment', color: '#475569' }
    ];

    const countMap = {};
    meta.forEach(m => { countMap[m.name] = 0; });

    records.forEach(r => {
      const cat = getMachineCategory(r.machine);
      countMap[cat] = (countMap[cat] || 0) + 1;
    });

    const total = records.length || 1;
    return meta.map(m => {
      const count = countMap[m.name] || 0;
      const pct = Math.round((count / total) * 100);
      return {
        name: m.name,
        count: count,
        pct: pct,
        color: m.color
      };
    });
  }

  /**
   * Check if a raw Machine string matches a target machine filter
   */
  function matchesMachine(itemMachine, targetMachine) {
    if (!targetMachine || targetMachine === 'all') return true;
    const category = getMachineCategory(itemMachine);
    if (targetMachine === category) return true;

    if (targetMachine.includes('CFB-1') || targetMachine.includes('Boiler # 1') || targetMachine === 'B#1') {
      return category === 'Boiler # 1 (CFB-1)';
    }
    if (targetMachine.includes('CFB-2') || targetMachine.includes('Boiler # 2') || targetMachine === 'B#2') {
      return category === 'Boiler # 2 (CFB-2)';
    }
    if (targetMachine.includes('STG # 4') || targetMachine === 'STG#4' || targetMachine === 'STG-04') {
      return category === 'STG # 4';
    }
    if (targetMachine.includes('STG # 3') || targetMachine === 'STG#3' || targetMachine === 'STG-03') {
      return category === 'STG # 3';
    }
    if (targetMachine.includes('STG # 2') || targetMachine === 'STG#2' || targetMachine === 'STG-02') {
      return category === 'STG # 2';
    }
    if (targetMachine.includes('STG # 1') || targetMachine === 'STG#1' || targetMachine === 'STG-01') {
      return category === 'STG # 1';
    }
    if (targetMachine.toLowerCase().includes('other')) {
      return category === 'Other Equipment';
    }
    return false;
  }

  /**
   * Fast lookup map of recommendations by PLR #
   */
  function getRecsMapByPlr() {
    const recs = getPlrRecs();
    const map = new Map();
    recs.forEach(r => {
      const key = String(r.plrNo || '').trim().toUpperCase();
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    });
    return map;
  }

  /**
   * Fast lookup map of PLR incidents by PLR #
   */
  function getPlrsMap() {
    const data = getPlrData();
    const map = new Map();
    data.forEach(p => {
      const key = String(p.plrNo || '').trim().toUpperCase();
      if (key) map.set(key, p);
    });
    return map;
  }

  /**
   * Filtered PLR Incidents dataset based on the active image filters
   */
  function getFilteredPlrData() {
    const data = getPlrData();
    const s = getPlrState();
    const recsMap = getRecsMapByPlr();

    return data.filter(item => {
      // Machine filter (COL G)
      if (s.selectedMachine && s.selectedMachine !== 'all') {
        if (!matchesMachine(item.machine, s.selectedMachine)) {
          return false;
        }
      }

      // Priority filter (COL H)
      if (s.selectedPriority && s.selectedPriority !== 'all') {
        if (String(item.priority || '').toLowerCase() !== s.selectedPriority.toLowerCase()) {
          return false;
        }
      }

      // Resp Dept filter (COL I)
      if (s.selectedDept && s.selectedDept !== 'all') {
        if (!matchesActionEntity(item.dept, s.selectedDept)) {
          return false;
        }
      }

      // Year filter
      if (s.selectedYear && s.selectedYear !== 'all') {
        if (String(item.year || '') !== String(s.selectedYear)) {
          return false;
        }
      }

      // Action Entity filter (checks linked recommendations or incident dept)
      if (s.selectedEntity && s.selectedEntity !== 'all') {
        const linkedRecs = recsMap.get(String(item.plrNo || '').toUpperCase()) || [];
        const hasEntity = linkedRecs.some(r => matchesActionEntity(r.actionBy, s.selectedEntity)) ||
          matchesActionEntity(item.dept, s.selectedEntity);
        if (!hasEntity) return false;
      }

      // Status filter (COL F)
      if (s.selectedStatus && s.selectedStatus !== 'all') {
        if (String(item.status || '').toLowerCase() !== s.selectedStatus.toLowerCase()) {
          return false;
        }
      }

      // Search Query
      if (s.searchQuery && s.searchQuery.trim()) {
        const q = s.searchQuery.toLowerCase().trim();
        const match =
          String(item.plrNo || '').toLowerCase().includes(q) ||
          String(item.incident || '').toLowerCase().includes(q) ||
          String(item.machine || '').toLowerCase().includes(q) ||
          String(item.dept || '').toLowerCase().includes(q) ||
          String(item.priority || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }

  /**
   * Filtered PLR Recommendations dataset based on the active image filters
   */
  function getFilteredPlrRecs() {
    const raw = getPlrRecs();
    const plrsMap = getPlrsMap();
    const s = getPlrState();

    return raw.filter(item => {
      const parentPlr = plrsMap.get(String(item.plrNo || '').toUpperCase());

      // Entity filter (checks actionBy)
      const targetEntity = s.selectedEntity !== 'all' ? s.selectedEntity : (s.recSelectedEntity !== 'all' ? s.recSelectedEntity : null);
      if (targetEntity) {
        if (!matchesActionEntity(item.actionBy, targetEntity)) {
          return false;
        }
      }

      // Year filter
      if (s.selectedYear && s.selectedYear !== 'all') {
        const itemYear = item.year || (parentPlr ? parentPlr.year : null);
        if (String(itemYear || '') !== String(s.selectedYear)) {
          return false;
        }
      }

      // Machine filter via parent PLR
      if (s.selectedMachine && s.selectedMachine !== 'all') {
        if (!parentPlr || !matchesMachine(parentPlr.machine, s.selectedMachine)) {
          return false;
        }
      }

      // Priority filter via parent PLR
      if (s.selectedPriority && s.selectedPriority !== 'all') {
        if (!parentPlr || String(parentPlr.priority || '').toLowerCase() !== s.selectedPriority.toLowerCase()) {
          return false;
        }
      }

      // Dept filter
      if (s.selectedDept && s.selectedDept !== 'all') {
        const itemMatches = matchesActionEntity(item.actionBy, s.selectedDept);
        const parentMatches = parentPlr ? matchesActionEntity(parentPlr.dept, s.selectedDept) : false;
        if (!itemMatches && !parentMatches) {
          return false;
        }
      }

      // Status filter
      const targetStatus = s.selectedStatus !== 'all' ? s.selectedStatus : (s.recSelectedStatus !== 'all' ? s.recSelectedStatus : null);
      if (targetStatus) {
        if (String(item.status || '').toLowerCase() !== targetStatus.toLowerCase()) {
          return false;
        }
      }

      // Search Query
      const q = (s.recSearchQuery || '').toLowerCase().trim();
      if (q) {
        const match =
          String(item.plrNo || '').toLowerCase().includes(q) ||
          String(item.recommendation || '').toLowerCase().includes(q) ||
          String(item.actionBy || '').toLowerCase().includes(q) ||
          String(item.status || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }

  // Helper: Dynamically extract all unique Machines from Google Sheet tab PLRstatus (Column G: Machine)
  function getDistinctMachines() {
    const data = getPlrData();
    const counts = {};
    data.forEach(p => {
      const val = (p.machine || '').trim() || 'Auxiliary / Unspecified';
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))
      .map(name => ({ name, count: counts[name] }));
  }

  // Helper: Render complete <option> list for Machine dropdown
  function renderMachineSelectOptions(selectedVal) {
    const machines = getDistinctMachines();
    const total = getPlrData().length;
    let html = `<option value="all" ${selectedVal === 'all' ? 'selected' : ''}>All Machines (${total} Outages)</option>`;
    machines.forEach(m => {
      const isSel = String(selectedVal || '').toLowerCase() === m.name.toLowerCase();
      const escaped = m.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      html += `<option value="${escaped}" ${isSel ? 'selected' : ''}>${escaped} (${m.count} Outages)</option>`;
    });
    return html;
  }

  // Helper: Dynamically extract all unique Action Entities from Google Sheet tab Recommendations (Column F: actionBy)
  function getDistinctActionEntities() {
    const recs = getPlrRecs();
    const counts = {};
    recs.forEach(r => {
      const depts = splitAndNormalizeActionEntities(r.actionBy);
      const uniqueDeptsInRow = Array.from(new Set(depts));
      uniqueDeptsInRow.forEach(dept => {
        if (dept) {
          counts[dept] = (counts[dept] || 0) + 1;
        }
      });
    });
    // Sort descending by frequency, then alphabetically
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))
      .map(name => ({ name, count: counts[name] }));
  }

  // Helper: Render complete <option> list for Action Entity dropdowns
  function renderActionEntitySelectOptions(selectedVal) {
    const entities = getDistinctActionEntities();
    const total = getPlrRecs().length;
    let html = `<option value="all" ${selectedVal === 'all' ? 'selected' : ''}>All Entities (${total} Recs)</option>`;
    entities.forEach(e => {
      const isSel = String(selectedVal || '').toLowerCase() === e.name.toLowerCase();
      const escaped = e.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      html += `<option value="${escaped}" ${isSel ? 'selected' : ''}>${escaped} (${e.count} items)</option>`;
    });
    return html;
  }

  // Helper: Dynamically generate department recommendations breakdown for Action Recommendations Per Dept chart
  function getDeptRecsList(ignoreEntityFilter = true) {
    const raw = getPlrRecs();
    const plrsMap = getPlrsMap();
    const s = getPlrState();

    const filtered = raw.filter(item => {
      const parentPlr = plrsMap.get(String(item.plrNo || '').toUpperCase());

      // Entity filter (if not ignored)
      if (!ignoreEntityFilter) {
        const targetEntity = s.selectedEntity !== 'all' ? s.selectedEntity : (s.recSelectedEntity !== 'all' ? s.recSelectedEntity : null);
        if (targetEntity && !matchesActionEntity(item.actionBy, targetEntity)) {
          return false;
        }
      }

      // Year filter
      if (s.selectedYear && s.selectedYear !== 'all') {
        const itemYear = item.year || (parentPlr ? parentPlr.year : null);
        if (String(itemYear || '') !== String(s.selectedYear)) return false;
      }

      // Resp Dept filter (incident level)
      if (s.selectedDept && s.selectedDept !== 'all') {
        const itemMatches = matchesActionEntity(item.actionBy, s.selectedDept);
        const parentMatches = parentPlr ? matchesActionEntity(parentPlr.dept, s.selectedDept) : false;
        if (!itemMatches && !parentMatches) return false;
      }

      // Machine filter
      if (s.selectedMachine && s.selectedMachine !== 'all') {
        if (!parentPlr || !matchesMachine(parentPlr.machine, s.selectedMachine)) return false;
      }

      // Priority filter
      if (s.selectedPriority && s.selectedPriority !== 'all') {
        if (!parentPlr || String(parentPlr.priority || '').toLowerCase() !== s.selectedPriority.toLowerCase()) return false;
      }

      return true;
    });

    const map = new Map();
    filtered.forEach(r => {
      const depts = splitAndNormalizeActionEntities(r.actionBy);
      const isRecordOpen = (r.status || '').toLowerCase() === 'open';
      const uniqueDeptsInRow = Array.from(new Set(depts));
      uniqueDeptsInRow.forEach(dept => {
        if (!map.has(dept)) {
          map.set(dept, { name: dept, total: 0, open: 0, closed: 0 });
        }
        const item = map.get(dept);
        item.total++;
        if (isRecordOpen) {
          item.open++;
        } else {
          item.closed++;
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  }

  // Helper: Dynamically generate multi-year recommendations progression (2017–2025)
  function getYearlyRecsList() {
    const raw = getPlrRecs();
    const plrsMap = getPlrsMap();
    const s = getPlrState();

    const filtered = raw.filter(item => {
      const parentPlr = plrsMap.get(String(item.plrNo || '').toUpperCase());

      // Entity filter
      const targetEntity = s.selectedEntity !== 'all' ? s.selectedEntity : (s.recSelectedEntity !== 'all' ? s.recSelectedEntity : null);
      if (targetEntity && !matchesActionEntity(item.actionBy, targetEntity)) {
        return false;
      }

      // Machine filter
      if (s.selectedMachine && s.selectedMachine !== 'all') {
        if (!parentPlr) return false;
        const pMachine = String(parentPlr.machine || '').toLowerCase();
        const tMachine = s.selectedMachine.toLowerCase();
        if (tMachine === 'other equipment') {
          if (['stg # 4', 'stg # 3', 'stg # 1', 'stg # 2', 'boiler # 1', 'boiler # 2'].some(m => pMachine.includes(m))) return false;
        } else if (pMachine !== tMachine && !pMachine.includes(tMachine) && !tMachine.includes(pMachine)) {
          return false;
        }
      }

      // Priority filter
      if (s.selectedPriority && s.selectedPriority !== 'all') {
        if (!parentPlr || String(parentPlr.priority || '').toLowerCase() !== s.selectedPriority.toLowerCase()) return false;
      }

      return true;
    });

    const years = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];
    const map = new Map();
    years.forEach(y => map.set(y, { year: y, total: 0, closed: 0, open: 0 }));

    filtered.forEach(r => {
      const parentPlr = plrsMap.get(String(r.plrNo || '').toUpperCase());
      const y = String(r.year || (parentPlr ? parentPlr.year : '') || '2025');
      if (map.has(y)) {
        const item = map.get(y);
        item.total++;
        if ((r.status || '').toLowerCase() === 'open') item.open++;
        else item.closed++;
      }
    });

    return Array.from(map.values());
  }

  // Helper: Dynamically generate entity analytics breakdown for chips, bento cards & assigned trend
  function getEntityAnalyticsList() {
    const raw = getPlrRecs();
    const plrsMap = getPlrsMap();
    const s = getPlrState();

    const filtered = raw.filter(item => {
      const parentPlr = plrsMap.get(String(item.plrNo || '').toUpperCase());

      // Year filter
      if (s.selectedYear && s.selectedYear !== 'all') {
        const itemYear = item.year || (parentPlr ? parentPlr.year : null);
        if (String(itemYear || '') !== String(s.selectedYear)) return false;
      }

      // Machine filter
      if (s.selectedMachine && s.selectedMachine !== 'all') {
        if (!parentPlr || !matchesMachine(parentPlr.machine, s.selectedMachine)) return false;
      }

      // Priority filter
      if (s.selectedPriority && s.selectedPriority !== 'all') {
        if (!parentPlr || String(parentPlr.priority || '').toLowerCase() !== s.selectedPriority.toLowerCase()) return false;
      }

      return true;
    });

    const map = new Map();
    filtered.forEach(r => {
      const depts = splitAndNormalizeActionEntities(r.actionBy);
      const isRecordOpen = (r.status || '').toLowerCase() === 'open';
      const uniqueDeptsInRow = Array.from(new Set(depts));
      uniqueDeptsInRow.forEach(dept => {
        if (!map.has(dept)) {
          map.set(dept, { name: dept, items: 0, open: 0, closed: 0 });
        }
        const item = map.get(dept);
        item.items++;
        if (isRecordOpen) {
          item.open++;
        } else {
          item.closed++;
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => b.items - a.items || a.name.localeCompare(b.name));
  }

  // Filter Event Handlers matching attached image
  portalApp.handlePlrMachineChange = function (val) {
    const s = getPlrState();
    s.selectedMachine = val;
    s.page = 1;
    s.recPage = 1;
    portalApp.renderPlrSuite();
  };

  portalApp.handlePlrPriorityChange = function (val) {
    const s = getPlrState();
    s.selectedPriority = val;
    s.page = 1;
    s.recPage = 1;
    portalApp.renderPlrSuite();
  };

  portalApp.handlePlrDeptChange = function (val) {
    const s = getPlrState();
    s.selectedDept = val;
    s.page = 1;
    s.recPage = 1;
    portalApp.renderPlrSuite();
  };

  portalApp.handlePlrYearChange = function (val) {
    const s = getPlrState();
    s.selectedYear = val;
    s.page = 1;
    s.recPage = 1;
    portalApp.renderPlrSuite();
  };

  portalApp.handlePlrEntityChange = function (val) {
    const s = getPlrState();
    s.selectedEntity = val;
    s.recSelectedEntity = val;
    s.page = 1;
    s.recPage = 1;
    portalApp.renderPlrSuite();
  };

  portalApp.resetAllPlrImageFilters = function () {
    const s = getPlrState();
    s.selectedMachine = 'all';
    s.selectedPriority = 'all';
    s.selectedDept = 'all';
    s.selectedYear = 'all';
    s.selectedEntity = 'all';
    s.recSelectedEntity = 'all';
    s.selectedStatus = 'all';
    s.recSelectedStatus = 'all';
    s.searchQuery = '';
    s.recSearchQuery = '';
    s.page = 1;
    s.recPage = 1;
    portalApp.renderPlrSuite();
  };

  /**
   * Main Render Method for the PLR specialized container
   */
  portalApp.renderPlrSuite = function () {
    const container = document.getElementById('plr-specialized-container');
    if (!container) return;

    // Hide description below upper Plant Loss Recommendations title
    const descEl = document.getElementById('detail-description');
    if (descEl) {
      descEl.textContent = '';
      descEl.style.display = 'none';
    }

    // Hide Google Sheet link connection card in PLR header
    const connCard = document.getElementById('detail-connection-card');
    if (connCard) {
      connCard.classList.add('hidden');
    }

    // Keep green light and remove Active text in PLR header badge
    const statusText = document.getElementById('detail-status-text');
    if (statusText) {
      statusText.textContent = '';
      statusText.classList.add('hidden');
    }
    const statusBadge = document.getElementById('detail-status-badge');
    if (statusBadge) {
      statusBadge.className = 'inline-flex items-center justify-center p-1.5 rounded-full bg-emerald-50 border border-emerald-200 shadow-2xs';
      statusBadge.title = 'Active';
    }
    const statusDot = document.getElementById('detail-status-dot');
    if (statusDot) {
      statusDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.85)] animate-pulse';
    }

    const data = getFilteredPlrData();
    const recs = getFilteredPlrRecs();
    const s = getPlrState();

    // High Level Core Metrics calculated dynamically from active filters
    const totalPLRs = data.length;
    const openPLRs = data.filter(d => (d.status || '').toLowerCase() === 'open').length;
    const closedPLRs = totalPLRs - openPLRs;
    const plrClosureRate = totalPLRs > 0 ? ((closedPLRs / totalPLRs) * 100).toFixed(0) : 0;

    const totalRecs = recs.length;
    const openRecs = recs.filter(r => (r.status || '').toLowerCase() === 'open').length;
    const closedRecs = totalRecs - openRecs;
    const recClosureRate = totalRecs > 0 ? ((closedRecs / totalRecs) * 100).toFixed(0) : 0;

    const activeFilterCount = [
      s.selectedMachine !== 'all',
      s.selectedPriority !== 'all',
      s.selectedDept !== 'all',
      s.selectedYear !== 'all',
      s.selectedEntity !== 'all'
    ].filter(Boolean).length;
    const hasActiveFilters = activeFilterCount > 0;

    const isIncidents = s.resolutionMode === 'incidents';
    const resTotalCount = isIncidents ? totalPLRs : totalRecs;
    const resOpenCount = isIncidents ? openPLRs : openRecs;
    const resClosedCount = isIncidents ? closedPLRs : closedRecs;
    const resClosureRate = isIncidents ? plrClosureRate : recClosureRate;

    // Merge action features directly below the upper heading inside detail-header-card
    const extraToolbar = document.getElementById('detail-header-extra-toolbar');
    if (extraToolbar) {
      extraToolbar.innerHTML = `
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-0.5">
          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs" title="Google Sheet is permanently embedded and automatically refetches on page load/refresh">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Auto-Sync Live Sheet: Active
            </span>
            <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              ${totalPLRs} Incidents • ${totalRecs} Recommendations (${closedRecs} Closed, ${openRecs} Open • ${recClosureRate}% Closure)
            </span>
            <span class="text-xs text-slate-500 font-medium hidden sm:inline">
              Embedded Google Sheet: <span class="font-bold text-slate-700 font-mono">PLRs white dashboard</span> • Dual Tabs: <strong class="text-[#2E6DA4]">PLR</strong> (Outages) &amp; <strong class="text-emerald-700">Recommendations</strong>
            </span>
          </div>
          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onclick="portalApp.refreshFromLiveSheet()"
              class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Refetch latest rows and Open/Closed status from Google Sheet (Recommendations & PLR tabs)"
            >
              <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
              <span>Sync Live Sheet</span>
            </button>
            <button
              onclick="portalApp.openPlrSheetSyncModal()"
              class="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="View permanently embedded Google Sheet integration details and tabs"
            >
              <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>Sheet Config</span>
            </button>
            <button
              onclick="portalApp.resetAllPlrImageFilters()"
              class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Reset all filters across both tabs"
            >
              <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-[#2E6DA4]"></i>
              <span>Reset Filters</span>
            </button>
            <button
              onclick="portalApp.exportPlrCSV()"
              class="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#2E6DA4] hover:bg-[#235885] shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      `;
      extraToolbar.classList.remove('hidden');
    }

    container.innerHTML = `
      <div class="space-y-6 text-slate-800 font-sans antialiased">
        
        <!-- ========================================================================= -->
        <!-- EXECUTIVE FILTER SUITE (ATTACHED IMAGE FILTER CONTROLS)                   -->
        <!-- ========================================================================= -->
        <div class="rounded-2xl p-4 sm:p-5.5 shadow-lg border relative overflow-hidden" style="background: linear-gradient(135deg, #091a32 0%, #0c2340 100%); border-color: #1e3a5f;">
          <!-- Subtle ambient backdrop lighting -->
          <div class="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <!-- The 5 Dropdown Filters + Reset Button Grid -->
          <div class="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 items-end">
            
            <!-- Filter 1: MACHINE (COL G) -->
            <div class="space-y-1.5 sm:space-y-2">
              <div class="flex items-center gap-1.5 text-xs sm:text-[13px] font-mono font-black text-cyan-300 uppercase tracking-wider">
                <i data-lucide="cpu" class="w-4 h-4 text-cyan-400"></i>
                <span>MACHINE (COL G)</span>
              </div>
              <select
                onchange="portalApp.handlePlrMachineChange(this.value)"
                class="w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-[#1e3e66] bg-[#0c2138] text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 cursor-pointer shadow-inner"
              >
                ${renderMachineSelectOptions(s.selectedMachine)}
              </select>
            </div>

            <!-- Filter 2: PRIORITY (COL H) -->
            <div class="space-y-1.5 sm:space-y-2">
              <div class="flex items-center gap-1.5 text-xs sm:text-[13px] font-mono font-black text-rose-300 uppercase tracking-wider">
                <i data-lucide="shield-alert" class="w-4 h-4 text-rose-400"></i>
                <span>PRIORITY (COL H)</span>
              </div>
              <select
                onchange="portalApp.handlePlrPriorityChange(this.value)"
                class="w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-[#1e3e66] bg-[#0c2138] text-white focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 cursor-pointer shadow-inner"
              >
                <option value="all" ${s.selectedPriority === 'all' ? 'selected' : ''}>All Priorities</option>
                <option value="Critical" ${s.selectedPriority === 'Critical' ? 'selected' : ''}>Critical Priority</option>
                <option value="High" ${s.selectedPriority === 'High' ? 'selected' : ''}>High Priority</option>
                <option value="Medium" ${s.selectedPriority === 'Medium' ? 'selected' : ''}>Medium Priority</option>
                <option value="Low" ${s.selectedPriority === 'Low' ? 'selected' : ''}>Low Priority</option>
              </select>
            </div>

            <!-- Filter 3: DEPARTMENT (COL F) -->
            <div class="space-y-1.5 sm:space-y-2">
              <div class="flex items-center gap-1.5 text-xs sm:text-[13px] font-mono font-black text-amber-300 uppercase tracking-wider">
                <i data-lucide="briefcase" class="w-4 h-4 text-amber-400"></i>
                <span>DEPARTMENT (COL F)</span>
              </div>
              <select
                onchange="portalApp.handlePlrDeptChange(this.value)"
                class="w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-[#1e3e66] bg-[#0c2138] text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 cursor-pointer shadow-inner"
              >
                ${renderActionEntitySelectOptions(s.selectedDept)}
              </select>
            </div>

            <!-- Filter 4: YEAR FILTER -->
            <div class="space-y-1.5 sm:space-y-2">
              <div class="flex items-center gap-1.5 text-xs sm:text-[13px] font-mono font-black text-indigo-300 uppercase tracking-wider">
                <i data-lucide="calendar" class="w-4 h-4 text-indigo-400"></i>
                <span>YEAR FILTER</span>
              </div>
              <select
                onchange="portalApp.handlePlrYearChange(this.value)"
                class="w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-[#1e3e66] bg-[#0c2138] text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 cursor-pointer shadow-inner"
              >
                <option value="all" ${s.selectedYear === 'all' ? 'selected' : ''}>All Combined (2017–2025)</option>
                <option value="2025" ${s.selectedYear === '2025' ? 'selected' : ''}>2025</option>
                <option value="2024" ${s.selectedYear === '2024' ? 'selected' : ''}>2024</option>
                <option value="2023" ${s.selectedYear === '2023' ? 'selected' : ''}>2023</option>
                <option value="2022" ${s.selectedYear === '2022' ? 'selected' : ''}>2022</option>
                <option value="2021" ${s.selectedYear === '2021' ? 'selected' : ''}>2021</option>
                <option value="2020" ${s.selectedYear === '2020' ? 'selected' : ''}>2020</option>
                <option value="2019" ${s.selectedYear === '2019' ? 'selected' : ''}>2019</option>
                <option value="2018" ${s.selectedYear === '2018' ? 'selected' : ''}>2018</option>
                <option value="2017" ${s.selectedYear === '2017' ? 'selected' : ''}>2017</option>
              </select>
            </div>

            <!-- Filter 5: ACTION ENTITY -->
            <div class="space-y-1.5 sm:space-y-2">
              <div class="flex items-center gap-1.5 text-xs sm:text-[13px] font-mono font-black text-emerald-300 uppercase tracking-wider">
                <i data-lucide="building-2" class="w-4 h-4 text-emerald-400"></i>
                <span>ACTION ENTITY</span>
              </div>
              <select
                onchange="portalApp.handlePlrEntityChange(this.value)"
                class="w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-[#1e3e66] bg-[#0c2138] text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 cursor-pointer shadow-inner"
              >
                ${renderActionEntitySelectOptions(s.selectedEntity)}
              </select>
            </div>

            <!-- Filter 6: Reset All Button -->
            <div class="space-y-1.5 sm:space-y-2">
              <div class="text-xs sm:text-[13px] font-mono font-black text-slate-400 uppercase tracking-wider invisible">
                <span>ACTION</span>
              </div>
              <button
                onclick="portalApp.resetAllPlrImageFilters()"
                class="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white bg-[#132e4f] hover:bg-[#1a3d68] border border-[#254b77] hover:border-cyan-400 transition-all shadow-sm cursor-pointer"
                title="Reset all filters back to default"
              >
                <i data-lucide="rotate-ccw" class="w-4 h-4 text-cyan-300"></i>
                <span>Reset All</span>
              </button>
            </div>

          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 3. EXECUTIVE KPI CARDS: Total PLRs, Open PLRs, Total Recs, Open Recs      -->
        <!-- ========================================================================= -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- Card 1: TOTAL PLRs -->
          <div
            data-plr-kpi="total-plrs"
            onclick="(window.portalApp || portalApp).openPlrKpiModal('total-plrs')"
            class="bg-white border border-slate-200 hover:border-[#2E6DA4] hover:shadow-md hover:-translate-y-0.5 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden group transition-all cursor-pointer flex flex-col justify-between"
            title="Click to view all ${totalPLRs} Plant Loss Reports in pop-up window"
          >
            <div class="flex items-center justify-between text-slate-500 text-xs sm:text-sm font-bold uppercase tracking-wider">
              <span>Total PLRs</span>
              <span class="p-2 rounded-xl bg-blue-50 text-[#2E6DA4] border border-blue-100 group-hover:bg-blue-100 transition-colors">
                <i data-lucide="file-text" class="w-4 h-4 sm:w-5 sm:h-5"></i>
              </span>
            </div>
            <div class="mt-4 flex items-baseline justify-between gap-2">
              <span class="text-5xl sm:text-6xl font-black font-mono text-slate-900 tracking-tight kpi-metric-val">${totalPLRs}</span>
              <span class="text-xs sm:text-sm font-bold text-[#2E6DA4] font-mono">100%</span>
            </div>
          </div>

          <!-- Card 2: OPEN PLRs -->
          <div
            data-plr-kpi="open-plrs"
            onclick="(window.portalApp || portalApp).openPlrKpiModal('open-plrs')"
            class="bg-white border border-rose-200 hover:border-rose-400 hover:shadow-md hover:-translate-y-0.5 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden group transition-all cursor-pointer flex flex-col justify-between"
            title="Click to inspect all ${openPLRs} Open PLRs in pop-up window"
          >
            <div class="flex items-center justify-between text-slate-500 text-xs sm:text-sm font-bold uppercase tracking-wider">
              <span>Open PLRs</span>
              <span class="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 group-hover:bg-rose-100 transition-colors">
                <i data-lucide="alert-circle" class="w-4 h-4 sm:w-5 sm:h-5"></i>
              </span>
            </div>
            <div class="mt-4 flex items-baseline justify-between gap-2">
              <span class="text-5xl sm:text-6xl font-black font-mono text-rose-600 tracking-tight kpi-metric-val">${openPLRs}</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-bold bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                ${totalPLRs > 0 ? ((openPLRs / totalPLRs) * 100).toFixed(0) : 0}% of Total
              </span>
            </div>
          </div>

          <!-- Card 3: TOTAL RECOMMENDATIONS -->
          <div
            data-plr-kpi="total-recs"
            onclick="(window.portalApp || portalApp).openPlrKpiModal('total-recs')"
            class="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden group transition-all cursor-pointer flex flex-col justify-between"
            title="Click to view all ${totalRecs} Recommendations in pop-up window"
          >
            <div class="flex items-center justify-between text-slate-500 text-xs sm:text-sm font-bold uppercase tracking-wider">
              <span>Total Recommendations</span>
              <span class="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 group-hover:bg-sky-100 transition-colors">
                <i data-lucide="layers" class="w-4 h-4 sm:w-5 sm:h-5"></i>
              </span>
            </div>
            <div class="mt-4 flex items-baseline justify-between gap-2">
              <span class="text-5xl sm:text-6xl font-black font-mono text-slate-900 tracking-tight kpi-metric-val">${totalRecs}</span>
            </div>
          </div>

          <!-- Card 4: OPEN RECOMMENDATIONS -->
          <div
            data-plr-kpi="open-recs"
            onclick="(window.portalApp || portalApp).openPlrKpiModal('open-recs')"
            class="bg-white border border-amber-200 hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden group transition-all cursor-pointer flex flex-col justify-between"
            title="Click to view all ${openRecs} Open Recommendations in pop-up window"
          >
            <div class="flex items-center justify-between text-slate-500 text-xs sm:text-sm font-bold uppercase tracking-wider">
              <span>Open Recommendations</span>
              <span class="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 group-hover:bg-amber-100 transition-colors">
                <i data-lucide="clock" class="w-4 h-4 sm:w-5 sm:h-5"></i>
              </span>
            </div>
            <div class="mt-4 flex items-baseline justify-between gap-2">
              <span class="text-5xl sm:text-6xl font-black font-mono text-amber-600 tracking-tight kpi-metric-val">${openRecs}</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-bold bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                ${totalRecs > 0 ? ((openRecs / totalRecs) * 100).toFixed(0) : 0}% Open Obs
              </span>
            </div>
          </div>

        </div>

        <!-- ========================================================================= -->
        <!-- 3. MACHINE BREAKDOWN & RECOMMENDATIONS RESOLUTION (Non-scrollable, Cover Page Area)  -->
        <!-- ========================================================================= -->
        <div class="space-y-5">
          <!-- Row 1: Machine Breakdown & Overall recommendations Resolution (Balanced 2-Col Layout) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            <!-- Left Card: INCIDENT BREAKDOWN BY MACHINE -->
            <div class="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-[#2E6DA4] flex items-center justify-center shrink-0">
                    <i data-lucide="cpu" class="w-5 h-5"></i>
                  </div>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <h4 class="text-xs sm:text-sm font-extrabold text-slate-900 tracking-wide uppercase">PLR by Machine</h4>
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-[#1e40af] border border-blue-200">
                        PLR Tab • Column G
                      </span>
                    </div>
                  </div>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#1e40af] border border-blue-200 shrink-0">
                  ${totalPLRs} Outages
                </span>
              </div>

              <!-- SVG Donut Graphic -->
              <div id="plr-machine-donut-container" class="relative flex items-center justify-center py-2">
                <!-- Rendered dynamically -->
              </div>

              <!-- Quick Select Buttons (Non-scrollable, fully visible covering page area) -->
              <div class="pt-3 border-t border-slate-100">
                <div class="flex flex-wrap items-center gap-2" id="plr-machine-quick-select">
                  <!-- Rendered dynamically -->
                </div>
              </div>
            </div>

            <!-- Right Card: OVERALL RECOMMENDATIONS RESOLUTION -->
            <div class="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-[#047857] flex items-center justify-center shrink-0">
                    <i data-lucide="pie-chart" class="w-5 h-5"></i>
                  </div>
                  <div>
                    <h4 class="text-xs sm:text-sm font-extrabold text-slate-900 tracking-wide uppercase">Overall recommendations Resolution</h4>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <div class="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[10px] font-bold">
                    <button
                      onclick="portalApp.setResolutionMode('recommendations')"
                      class="px-2 py-0.5 rounded-md transition-all cursor-pointer ${!isIncidents ? 'bg-[#047857] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
                    >Recs</button>
                    <button
                      onclick="portalApp.setResolutionMode('incidents')"
                      class="px-2 py-0.5 rounded-md transition-all cursor-pointer ${isIncidents ? 'bg-[#2E6DA4] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
                    >Incidents</button>
                  </div>
                  <span data-plr-action="resolution-modal" data-status="Open" class="px-2.5 py-1 rounded-full text-xs font-black bg-red-50 text-[#B91C1C] border border-red-200 cursor-pointer" onclick="(window.portalApp || portalApp).openResolutionDataModal('Open')">
                    ${resOpenCount} Open
                  </span>
                  <span data-plr-action="resolution-modal" data-status="Closed" class="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-[#047857] border border-emerald-200 cursor-pointer" onclick="(window.portalApp || portalApp).openResolutionDataModal('Closed')">
                    ${resClosedCount} Closed
                  </span>
                </div>
              </div>

              <!-- SVG Resolution Pie Graphic -->
              <div id="plr-resolution-pie-container" class="relative flex items-center justify-center py-2">
                <!-- Rendered dynamically -->
              </div>

              <!-- Resolution Metrics & Quick Actions (Non-scrollable, fully visible covering page area) -->
              <div class="pt-3 border-t border-slate-100 space-y-3">
                <!-- Closure Progress Bar with Darker Corporate Tones (Interactive) -->
                <div class="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden flex cursor-pointer shadow-inner" title="${resClosureRate}% Closed (${resClosedCount}), ${100 - resClosureRate}% Open (${resOpenCount}) - Click green for Closed records, red for Open records">
                  <div data-plr-action="resolution-modal" data-status="Closed" class="h-full bg-[#047857] hover:brightness-110 transition-all" style="width: ${resClosureRate}%;" onclick="(window.portalApp || portalApp).openResolutionDataModal('Closed')"></div>
                  <div data-plr-action="resolution-modal" data-status="Open" class="h-full bg-[#B91C1C] hover:brightness-110 transition-all" style="width: ${100 - resClosureRate}%;" onclick="(window.portalApp || portalApp).openResolutionDataModal('Open')"></div>
                </div>
                <!-- Action Buttons Filter & Inspect -->
                <div class="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <div class="flex items-center gap-2">
                    <button
                      data-plr-action="resolution-modal"
                      data-status="all"
                      onclick="(window.portalApp || portalApp).openResolutionDataModal('all')"
                      class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300"
                    >
                      All ${isIncidents ? 'Incidents' : 'Recommendations'} (${resTotalCount})
                    </button>
                    <button
                      data-plr-action="resolution-modal"
                      data-status="Closed"
                      onclick="(window.portalApp || portalApp).openResolutionDataModal('Closed')"
                      class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border bg-emerald-50 hover:bg-emerald-100 text-[#047857] border-emerald-200"
                    >
                      Closed (${resClosedCount})
                    </button>
                  </div>
                  <button
                    data-plr-action="resolution-modal"
                    data-status="Open"
                    onclick="(window.portalApp || portalApp).openResolutionDataModal('Open')"
                    class="px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-xs bg-[#B91C1C] hover:bg-[#991B1B] text-white border-[#B91C1C]"
                  >
                    <i data-lucide="alert-circle" class="w-3.5 h-3.5"></i>
                    <span>Inspect ${resOpenCount} Open ${isIncidents ? 'PLRs' : 'Recs'}</span>
                    <i data-lucide="chevron-right" class="w-3 h-3"></i>
                  </button>
                </div>
              </div>

            </div>

          </div>

          <!-- Row 2: ACTION RECOMMENDATIONS PER DEPT (Sub HSE Visual Design matching User Attachment) -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <i data-lucide="bar-chart-3" class="w-5 h-5"></i>
                </div>
                <div>
                  <h4 class="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>OPEN VS. CLOSED FINDINGS BY RECOMMENDATIONS DEPARTMENT</span>
                  </h4>
                </div>
              </div>
              <div class="flex items-center gap-4 flex-wrap">
                <!-- Legend matching Sub HSE Dashboard Image -->
                <div class="flex items-center gap-3 text-xs font-bold font-mono">
                  <span class="inline-flex items-center gap-1.5">
                    <span class="w-3 h-3 rounded-xs bg-[#f43f5e]"></span>
                    <span class="text-slate-600">Open Findings</span>
                  </span>
                  <span class="inline-flex items-center gap-1.5">
                    <span class="w-3 h-3 rounded-xs bg-[#10b981]"></span>
                    <span class="text-slate-600">Closed Findings</span>
                  </span>
                </div>
                <!-- Google Sheet Sync & Config Modal Triggers -->
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    onclick="portalApp.refreshFromLiveSheet()"
                    class="p-1.5 rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors inline-flex items-center justify-center cursor-pointer shadow-xs"
                    title="Sync live status and rows directly from Google Sheet tab Recommendations"
                  >
                    <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-emerald-600"></i>
                  </button>
                  <button
                    type="button"
                    onclick="portalApp.openPlrSheetSyncModal()"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                    title="Configure Google Sheet URL & Integration"
                  >
                    <i data-lucide="settings" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
                <!-- View Mode Pills (Bar Chart / Table / Both Views) -->
                <div class="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px]">
                  <button
                    onclick="portalApp.setDeptBarViewMode('chart')"
                    class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${s.deptBarViewMode !== 'table' && s.deptBarViewMode !== 'split' ? 'bg-[#2E6DA4] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
                  >Bar Chart</button>
                  <button
                    onclick="portalApp.setDeptBarViewMode('table')"
                    class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${s.deptBarViewMode === 'table' ? 'bg-[#2E6DA4] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
                  >Table 1</button>
                  <button
                    onclick="portalApp.setDeptBarViewMode('split')"
                    class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${s.deptBarViewMode === 'split' ? 'bg-[#2E6DA4] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
                  >Both Views</button>
                </div>
              </div>
            </div>

            <!-- Dynamic Horizontal Bar Chart & Table 1 Container -->
            <div id="plr-dept-bar-chart-container" class="w-full min-h-[285px]">
              <!-- Rendered dynamically -->
            </div>

            <!-- Quick Filter & Explore Pills -->
            <div class="pt-3 border-t border-slate-100">
              <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">QUICK FILTER &amp; EXPLORE BY DEPT:</div>
              <div class="flex flex-wrap items-center gap-2 text-xs" id="plr-dept-quick-filters">
                <!-- Rendered dynamically -->
              </div>
            </div>
          </div>

        </div>

        <!-- ========================================================================= -->
        <!-- 4. PLANT RECORDS & OUTAGE LOG (Light Master Table)                         -->
        <!-- ========================================================================= -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <!-- Header with Dual Tabs -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#2E6DA4] flex items-center justify-center shrink-0">
                <i data-lucide="database" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 uppercase tracking-wider">Plant Records &amp; Outage Log</h3>
              </div>
            </div>

            <!-- Dual Tab Switcher -->
            <div class="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto">
              <button
                onclick="portalApp.setPlrTab('incidents')"
                class="px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  s.activeTab === 'incidents'
                    ? 'bg-[#2E6DA4] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }"
              >
                <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                <span>PLR Incidents (${totalPLRs})</span>
              </button>
              <button
                onclick="portalApp.setPlrTab('recommendations')"
                class="px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  s.activeTab === 'recommendations'
                    ? 'bg-[#2E6DA4] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }"
              >
                <i data-lucide="layers" class="w-3.5 h-3.5"></i>
                <span>Recommendations (${totalRecs})</span>
              </button>
            </div>
          </div>

          <!-- Filter Toolbar for Active Tab -->
          <div id="plr-table-toolbar-container">
            <!-- Rendered dynamically -->
          </div>

          <!-- Active Tab Table Body -->
          <div id="plr-table-body-container" class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <!-- Rendered dynamically -->
          </div>

          <!-- Pagination Bar -->
          <div id="plr-pagination-container" class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 6. DUAL-TRACKING PLR INSPECTION MODAL (Cross-sheet inspection)             -->
        <!-- ========================================================================= -->
        <div id="plr-inspection-modal-container">
          <!-- Rendered dynamically when a PLR is clicked -->
        </div>

        <!-- ========================================================================= -->
        <!-- 7. INTERACTIVE DRILLDOWN DATA MODAL CONTAINER                            -->
        <!-- ========================================================================= -->
        <div id="plr-data-modal-container"></div>

        <!-- ========================================================================= -->
        <!-- 8. GOOGLE SHEET SYNC & ACTION EDIT/ADD MODAL CONTAINER                   -->
        <!-- ========================================================================= -->
        <div id="plr-action-modal-container"></div>

      </div>
    `;

    // Render Sub-Components
    portalApp.renderMachineDonut();
    portalApp.renderDeptBarChart();
    portalApp.renderResolutionPie();
    portalApp.renderTableSection();

    if (window.lucide) window.lucide.createIcons();
  };

  /**
   * Tooltip System for PLR Interactive Visualizations
   */
  portalApp.getOrCreateTooltip = function () {
    let el = document.getElementById('plr-interactive-tooltip');
    if (!el) {
      el = document.createElement('div');
      el.id = 'plr-interactive-tooltip';
      el.className = 'fixed z-[9999] pointer-events-none transition-opacity duration-150 opacity-0 bg-slate-900/95 text-white text-xs rounded-xl px-3.5 py-2.5 shadow-2xl border border-slate-700/80 backdrop-blur-md max-w-xs';
      document.body.appendChild(el);
    }
    return el;
  };

  portalApp.showTooltip = function (e, opt) {
    const tip = portalApp.getOrCreateTooltip();
    let content = '';
    if (opt.badge) {
      content += `<div class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1" style="background-color: ${opt.color ? opt.color + '33' : '#38bdf833'}; color: ${opt.color || '#38bdf8'}">${opt.badge}</div>`;
    }
    if (opt.title) {
      content += `<div class="font-extrabold text-sm text-white">${opt.title}</div>`;
    }
    if (opt.subtitle) {
      content += `<div class="text-[11px] text-slate-400 mb-1.5">${opt.subtitle}</div>`;
    }
    if (opt.metrics && Array.isArray(opt.metrics)) {
      content += `<div class="space-y-0.5 my-1.5 pt-1.5 border-t border-slate-800">`;
      opt.metrics.forEach(m => {
        content += `<div class="flex items-center justify-between gap-3 text-[11px]">
          <span class="text-slate-400 font-medium">${m.label}:</span>
          <span class="font-mono font-bold text-white">${m.value}</span>
        </div>`;
      });
      content += `</div>`;
    }
    if (opt.hint) {
      content += `<div class="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] font-semibold text-cyan-300 flex items-center gap-1">
        <span>🔍</span> <span>${opt.hint}</span>
      </div>`;
    }

    tip.innerHTML = content;
    tip.style.opacity = '1';
    portalApp.moveTooltip(e);
  };

  portalApp.moveTooltip = function (e) {
    const tip = portalApp.getOrCreateTooltip();
    const pad = 14;
    let x = e.clientX + pad;
    let y = e.clientY + pad;

    const rect = tip.getBoundingClientRect();
    if (x + rect.width > window.innerWidth - 10) {
      x = e.clientX - rect.width - pad;
    }
    if (y + rect.height > window.innerHeight - 10) {
      y = e.clientY - rect.height - pad;
    }

    tip.style.left = `${Math.max(10, x)}px`;
    tip.style.top = `${Math.max(10, y)}px`;
  };

  portalApp.hideTooltip = function () {
    const tip = document.getElementById('plr-interactive-tooltip');
    if (tip) tip.style.opacity = '0';
  };

  // Dynamic getter for machine outage breakdown
  const getActiveMachinesList = () => getPlrMachinesBreakdown();

  /**
   * Hover handler for machine donut slice
   */
  portalApp.onMachineSliceHover = function (event, machineName, index) {
    const machines = getPlrMachinesBreakdown();
    const m = machines.find(it => it.name === machineName);
    if (!m) return;

    // Expand visible path
    const pathEl = document.getElementById(`plr-donut-slice-${index}`);
    if (pathEl) {
      pathEl.setAttribute('stroke-width', '40');
      pathEl.style.filter = `drop-shadow(0 0 10px ${m.color})`;
    }

    // Dynamic center feedback
    const nameEl = document.getElementById('plr-donut-center-name');
    const countEl = document.getElementById('plr-donut-center-count');
    const pctEl = document.getElementById('plr-donut-center-pct');
    const dotEl = document.getElementById('plr-donut-center-dot');

    if (nameEl) {
      nameEl.textContent = m.name;
      nameEl.title = m.name;
    }
    if (countEl) countEl.textContent = String(m.count);
    if (pctEl) pctEl.textContent = `${m.pct}% of Total Outages`;
    if (dotEl) dotEl.style.backgroundColor = m.color;

    // Show rich tooltip
    const totalRecords = getPlrData().length || 233;
    portalApp.showTooltip(event, {
      title: m.name,
      badge: 'Machine Asset',
      color: m.color,
      subtitle: 'Outage Incident Analysis',
      metrics: [
        { label: 'Outages', value: String(m.count) },
        { label: 'Outage Share', value: `${m.pct}%` },
        { label: 'Total Plant Outages', value: String(totalRecords) }
      ],
      hint: `Click to open and inspect all ${m.count} records for ${m.name}`
    });
  };

  /**
   * Mouse leave handler for machine donut slice
   */
  portalApp.onMachineSliceLeave = function (index) {
    portalApp.hideTooltip();

    const s = getPlrState();
    const machines = getPlrMachinesBreakdown();
    const item = machines[index];
    const isSelected = item && s.selectedMachine === item.name;
    const pathEl = document.getElementById(`plr-donut-slice-${index}`);
    if (pathEl) {
      pathEl.setAttribute('stroke-width', isSelected ? '38' : '32');
      pathEl.style.filter = isSelected && item ? `drop-shadow(0 2px 7px ${item.color}88)` : 'none';
    }

    // Restore center text
    const activeMachine = machines.find(m => m.name === s.selectedMachine) || machines[0] || { name: 'STG # 4', count: 154, pct: 66, color: '#1e40af' };
    const nameEl = document.getElementById('plr-donut-center-name');
    const countEl = document.getElementById('plr-donut-center-count');
    const pctEl = document.getElementById('plr-donut-center-pct');
    const dotEl = document.getElementById('plr-donut-center-dot');

    if (nameEl) {
      nameEl.textContent = activeMachine.name;
      nameEl.title = activeMachine.name;
    }
    if (countEl) countEl.textContent = String(activeMachine.count);
    if (pctEl) pctEl.textContent = `${activeMachine.pct}% of Total Outages`;
    if (dotEl) dotEl.style.backgroundColor = activeMachine.color || '#1e40af';
  };

  /**
   * Click handler for machine donut slice & quick select pills: selects and opens pop data modal
   */
  portalApp.onMachineSliceClick = function (machineName) {
    portalApp.hideTooltip();
    const s = getPlrState();
    s.selectedMachine = machineName;
    s.page = 1;

    // Re-render donut to show selected slice and center
    portalApp.renderMachineDonut();
    // Re-render table section below
    portalApp.renderTableSection();

    const machines = getPlrMachinesBreakdown();
    const m = machines.find(it => it.name === machineName) || { name: machineName, count: 0, pct: 0 };
    const escapedMachine = machineName.replace(/'/g, "\\'");

    // Open the interactive drilldown pop data modal
    portalApp.openPlrDataModal({
      type: 'incidents',
      title: 'Machine: ' + machineName,
      badge: 'Equipment Asset',
      subtitle: `${m.count} Outages (${m.pct}% of total plant outages)`,
      filterMachine: machineName
    });
  };

  /**
   * Click handler for the center of the donut
   */
  portalApp.onCenterDonutClick = function () {
    const s = getPlrState();
    const machines = getPlrMachinesBreakdown();
    const targetMachine = s.selectedMachine !== 'all' ? s.selectedMachine : 'STG # 4';
    const m = machines.find(it => it.name === targetMachine) || machines[0] || { name: targetMachine, count: 154, pct: 66 };
    portalApp.openPlrDataModal({
      type: 'incidents',
      title: 'Machine: ' + m.name,
      badge: 'Equipment Asset',
      subtitle: `${m.count} Outages (${m.pct}% of total plant outages)`,
      filterMachine: s.selectedMachine !== 'all' ? targetMachine : 'all'
    });
  };

  /**
   * 1. Machine Breakdown Donut (Interactive slices & center click to open incident records)
   */
  portalApp.renderMachineDonut = function () {
    const container = document.getElementById('plr-machine-donut-container');
    const quickSelContainer = document.getElementById('plr-machine-quick-select');
    if (!container) return;

    const s = getPlrState();
    const machines = getPlrMachinesBreakdown();

    const total = getPlrData().length || 233;
    const r = 124;
    const cx = 160;
    const cy = 160;
    const strokeWidth = 32;

    let cumulativeAngle = -Math.PI / 2;
    const sliceGroups = [];

    machines.forEach((m, idx) => {
      const sliceAngle = (m.count / total) * 2 * Math.PI;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + sliceAngle;
      cumulativeAngle += sliceAngle;

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const largeArc = sliceAngle > Math.PI ? 1 : 0;

      const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
      const isSelected = s.selectedMachine === m.name;
      const escapedMachine = m.name.replace(/'/g, "\\'");

      // Using a group with an invisible wider hit-path (stroke 50px)
      // guarantees that even the smallest slices (STG 1, Boiler 2, Other)
      // have an expansive, effortless click & hover target.
      sliceGroups.push(`
        <g
          id="plr-donut-slice-group-${idx}"
          class="cursor-pointer"
          data-plr-action="select-machine"
          data-machine="${escapedMachine}"
          onclick="(window.portalApp || portalApp).onMachineSliceClick('${escapedMachine}')"
          onmouseenter="portalApp.onMachineSliceHover(event, '${escapedMachine}', ${idx})"
          onmousemove="portalApp.moveTooltip(event)"
          onmouseleave="portalApp.onMachineSliceLeave(${idx})"
        >
          <!-- Invisible wide hit-test path (50px stroke width) -->
          <path
            d="${d}"
            fill="none"
            stroke="transparent"
            stroke-width="50"
            stroke-linecap="butt"
            style="pointer-events: stroke;"
          />
          <!-- Visible colored arc slice -->
          <path
            id="plr-donut-slice-${idx}"
            d="${d}"
            fill="none"
            stroke="${m.color}"
            stroke-width="${isSelected ? strokeWidth + 6 : strokeWidth}"
            stroke-linecap="butt"
            class="transition-all duration-200"
            style="pointer-events: none; ${isSelected ? `filter: drop-shadow(0 2px 7px ${m.color}88);` : ''}"
          />
          <title>${m.name}: ${m.count} Outages (${m.pct}%) - Click to open records</title>
        </g>
      `);
    });

    const activeMachine = machines.find(m => m.name === s.selectedMachine) || machines[0] || { name: 'STG # 4', count: 154, pct: 66, color: '#1e40af' };
    const escapedActiveMachine = activeMachine.name.replace(/'/g, "\\'");

    // Center interactive circle is sized to diameter 196px (radius 98px) inside the 216px inner hole.
    // This strictly prevents the center overlay from covering or intercepting clicks on the donut slices!
    container.innerHTML = `
      <div class="relative w-[300px] h-[300px] sm:w-[320px] sm:h-[320px] max-w-full aspect-square flex items-center justify-center">
        <svg viewBox="0 0 320 320" class="w-full h-full select-none">
          <!-- Soft Background Track Ring -->
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="${strokeWidth}" />
          ${sliceGroups.join('')}
        </svg>
        <div
          data-plr-action="donut-center"
          onclick="(window.portalApp || portalApp).onCenterDonutClick()"
          onmouseenter="portalApp.showTooltip(event, { title: '${escapedActiveMachine}', badge: 'Active Asset View', color: '${activeMachine.color || '#1e40af'}', subtitle: 'Incident Outages Explorer', metrics: [{ label: 'Selected Outages', value: '${activeMachine.count}' }, { label: 'Share', value: '${activeMachine.pct}%' }], hint: 'Click to open matching investigation records' })"
          onmousemove="portalApp.moveTooltip(event)"
          onmouseleave="portalApp.hideTooltip()"
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[196px] h-[196px] rounded-full flex flex-col items-center justify-center cursor-pointer text-center px-2.5 py-2 font-sans bg-white/95 hover:bg-slate-50 transition-all duration-150 group z-10 select-none shadow-[inset_0_1px_3px_rgba(0,0,0,0.03)]"
          title="Click to view outage records for ${activeMachine.name}"
        >
          <!-- Machine Name Badge (fitted cleanly into upper circular chord) -->
          <div id="plr-donut-center-badge" class="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/95 border border-slate-200/90 max-w-[164px] shadow-2xs group-hover:bg-blue-50/80 group-hover:border-blue-200 transition-all">
            <span id="plr-donut-center-dot" class="w-2 h-2 rounded-full shrink-0 transition-colors" style="background-color: ${activeMachine.color || '#1e40af'}"></span>
            <span id="plr-donut-center-name" class="text-[11px] sm:text-xs font-black text-slate-800 uppercase tracking-wide truncate max-w-[130px] leading-none group-hover:text-[#1e40af] transition-colors" title="${activeMachine.name}">${activeMachine.name}</span>
          </div>

          <!-- Outages Count in center -->
          <span id="plr-donut-center-count" class="text-4xl sm:text-[42px] font-black text-slate-900 tracking-tight leading-none my-1 font-sans group-hover:scale-105 transition-transform">${activeMachine.count}</span>

          <!-- Outage Share Subtitle (fitted on single line with whitespace-nowrap) -->
          <span id="plr-donut-center-pct" class="text-[11.5px] font-bold text-slate-600 font-sans tracking-tight whitespace-nowrap leading-none">${activeMachine.pct}% of Total Outages</span>

          <!-- Interactive inspect action hint -->
          <span class="text-[9.5px] font-extrabold text-[#1e40af] opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center gap-0.5 leading-none">
            <span>Inspect records</span>
            <i data-lucide="arrow-up-right" class="w-2.5 h-2.5"></i>
          </span>
        </div>
      </div>
    `;

    // Quick Select Buttons (each button also opens pop data on click)
    if (quickSelContainer) {
      quickSelContainer.innerHTML = machines.map(m => {
        const isSel = s.selectedMachine === m.name;
        const escaped = m.name.replace(/'/g, "\\'");
        return `
          <button
            data-plr-action="select-machine"
            data-machine="${escaped}"
            onclick="(window.portalApp || portalApp).onMachineSliceClick('${escaped}')"
            onmouseenter="portalApp.showTooltip(event, { title: '${escaped}', badge: 'Machine Asset', color: '${m.color}', subtitle: 'Outage Incident Analysis', metrics: [{ label: 'Outages', value: '${m.count}' }, { label: 'Outage Share', value: '${m.pct}%' }], hint: 'Click to select and open ${m.count} records' })"
            onmousemove="portalApp.moveTooltip(event)"
            onmouseleave="portalApp.hideTooltip()"
            class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              isSel
                ? 'bg-[#1e40af] text-white border-[#1e40af] font-black shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }"
            title="${m.name}: ${m.count} Outages (Click to open records)"
          >
            <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${m.color}"></span>
            <span class="truncate">${m.name}</span>
            <span class="font-mono font-semibold text-[11px] opacity-80">(${m.count})</span>
          </button>
        `;
      }).join('') + `
        <button
          data-plr-action="select-machine"
          data-machine="${escapedActiveMachine}"
          onclick="(window.portalApp || portalApp).onMachineSliceClick('${escapedActiveMachine}')"
          class="px-2.5 py-1 rounded-lg text-xs font-bold text-[#1e40af] bg-blue-50/80 hover:bg-blue-100 border border-blue-200 cursor-pointer flex items-center gap-1"
          title="Open modal displaying incident data for ${activeMachine.name}"
        >
          <i data-lucide="table" class="w-3 h-3"></i>
          <span>Inspect Data (${activeMachine.count})</span>
        </button>
      ` + (s.selectedMachine !== 'all' ? `
        <button
          onclick="(window.portalApp || portalApp).filterPlrByMachine('all')"
          class="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-300 cursor-pointer"
        >
          Clear Filter
        </button>
      ` : '');
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  };

  /**
   * Helper to format department and entity labels so they never overlap or spill over
   */
  function formatDeptLabel(name) {
    if (!name) return 'Unassigned';
    return String(name).trim();
  }

  /**
   * 2. Action Recommendations Per Dept (Sub HSE Dashboard Design & Interactivity)
   * Converts Action Recommendations Per Dept trend to Sub HSE Dashboard layout:
   * - Horizontal Stacked Bar Chart: Open Findings (#f43f5e) vs Closed Findings (#10b981)
   * - Table 1: Findings Status by Action Department with Department, Total, Open, Close, % Closure, and Actions
   * - View Mode Switching: Bar Chart, Table 1, or Both Views (Split)
   * - Clickable bars, rows, and counts to open filtered interactive data modal
   */
  portalApp.renderDeptBarChart = function () {
    const container = document.getElementById('plr-dept-bar-chart-container');
    const filterContainer = document.getElementById('plr-dept-quick-filters');
    if (!container) return;

    const s = getPlrState();
    const rawDepts = getDeptRecsList();

    if (!rawDepts || rawDepts.length === 0) {
      container.innerHTML = `
        <div class="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
          <i data-lucide="inbox" class="w-8 h-8 mb-1.5 opacity-60"></i>
          <span>No recommendation records matching the active filter criteria.</span>
        </div>
      `;
      if (filterContainer) filterContainer.innerHTML = '';
      return;
    }

    const chartDepts = rawDepts;
    const viewMode = s.deptBarViewMode || 'chart';

    // SVG Bar Chart Dimensions
    const w = 960;
    const padLeft = 190;
    const padRight = 64;
    const padTop = 32;
    const padBottom = 38;
    const rowH = 26;
    const h = padTop + chartDepts.length * rowH + padBottom;
    const chartW = w - padLeft - padRight;

    const peak = Math.max(...chartDepts.map(d => d.total), 1);
    const maxVal = Math.ceil(peak / 20) * 20 || 20;

    // Vertical Dotted Grid Lines
    const tickCount = 5;
    const xTicks = [];
    for (let i = 0; i <= tickCount; i++) {
      xTicks.push(Math.round((maxVal / tickCount) * i));
    }

    const gridSvg = xTicks.map(val => {
      const x = padLeft + (val / maxVal) * chartW;
      return `
        <line x1="${x}" y1="${padTop - 6}" x2="${x}" y2="${padTop + chartDepts.length * rowH + 6}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3 3"/>
        <text x="${x}" y="${padTop + chartDepts.length * rowH + 20}" fill="#64748b" font-size="10" font-family="monospace" font-weight="600" text-anchor="middle">${val}</text>
      `;
    }).join('');

    // Render Department Horizontal Stacked Rows
    const rowsSvg = chartDepts.map((d, index) => {
      const y = padTop + index * rowH;
      const openW = (d.open / maxVal) * chartW;
      const closedW = (d.closed / maxVal) * chartW;
      const isSelected = s.recSelectedEntity === d.name;
      const escapedDept = d.name.replace(/'/g, "\\'");
      const pct = d.total > 0 ? Math.round((d.closed / d.total) * 100) : 0;

      return `
        <g class="group cursor-pointer">
          <!-- Background Row Hover Strip -->
          <rect
            x="4"
            y="${y}"
            width="${w - 8}"
            height="${rowH - 4}"
            rx="4"
            fill="${isSelected ? '#f0f9ff' : 'transparent'}"
            class="group-hover:fill-slate-50 transition-colors"
          />

          <!-- Department Name Label on Y-axis -->
          <text
            x="${padLeft - 14}"
            y="${y + 14}"
            fill="${isSelected ? '#2E6DA4' : '#1e293b'}"
            font-size="11"
            font-weight="${isSelected ? '900' : '700'}"
            font-family="'Plus Jakarta Sans', system-ui, sans-serif"
            text-anchor="end"
            class="transition-colors group-hover:fill-[#2E6DA4]"
            onclick="portalApp.openPlrDataModal({ type: 'recommendations', title: 'Department: ' + '${escapedDept}', badge: 'Action Department', subtitle: '${d.total} Total Recommendations (${d.open} Open • ${d.closed} Closed)', filterDept: '${escapedDept}' })"
            onmouseenter="portalApp.showTooltip(event, { title: '${escapedDept}', badge: 'Action Department', color: '#2E6DA4', subtitle: 'Action Recommendations Overview', metrics: [{ label: 'Total Recommendations', value: '${d.total}' }, { label: 'Open Pending', value: '${d.open}' }, { label: 'Closed Resolved', value: '${d.closed}' }, { label: 'Closure Rate', value: '${pct}%' }], hint: 'Click to open department recommendation records' })"
            onmousemove="portalApp.moveTooltip(event)"
            onmouseleave="portalApp.hideTooltip()"
          >
            ${d.name}
            <title>${d.name}: ${d.total} Items (${d.open} Open, ${d.closed} Closed, ${pct}% Closure)</title>
          </text>

          <!-- Subtle Background Track Bar -->
          <rect
            x="${padLeft}"
            y="${y + 3}"
            width="${chartW}"
            height="15"
            rx="4"
            fill="#f1f5f9"
            class="group-hover:fill-slate-200/70 transition-colors"
            onclick="portalApp.openPlrDataModal({ type: 'recommendations', title: 'Department: ' + '${escapedDept}', badge: 'Action Department', subtitle: '${d.total} Total Recommendations', filterDept: '${escapedDept}' })"
          />

          <!-- Open Findings Bar (Rose-500 #f43f5e) -->
          ${d.open > 0 ? `
            <rect
              x="${padLeft}"
              y="${y + 3}"
              width="${openW}"
              height="15"
              rx="${d.closed > 0 ? '4 0 0 4' : '4'}"
              fill="#f43f5e"
              class="transition-all hover:brightness-110"
              onclick="portalApp.openPlrDataModal({ type: 'recommendations', title: 'Department: ' + '${escapedDept}', badge: 'Open Recommendations', subtitle: '${d.open} Open Pending Items', filterDept: '${escapedDept}', filterStatus: 'Open' })"
              onmouseenter="portalApp.showTooltip(event, { title: '${escapedDept}', badge: 'Open Findings', color: '#f43f5e', subtitle: 'Pending Implementation', metrics: [{ label: 'Open Recommendations', value: '${d.open}' }, { label: 'Dept Total', value: '${d.total}' }], hint: 'Click to open and inspect open items' })"
              onmousemove="portalApp.moveTooltip(event)"
              onmouseleave="portalApp.hideTooltip()"
            />
            ${openW >= 15 ? `
              <text
                x="${padLeft + openW / 2}"
                y="${y + 14.5}"
                fill="#ffffff"
                font-size="9.5"
                font-weight="900"
                font-family="monospace"
                text-anchor="middle"
                class="pointer-events-none select-none"
              >${d.open}</text>
            ` : ''}
          ` : ''}

          <!-- Closed Findings Bar (Emerald-500 #10b981) -->
          ${d.closed > 0 ? `
            <rect
              x="${padLeft + openW}"
              y="${y + 3}"
              width="${closedW}"
              height="15"
              rx="${d.open > 0 ? '0 4 4 0' : '4'}"
              fill="#10b981"
              class="transition-all hover:brightness-110"
              onclick="portalApp.openPlrDataModal({ type: 'recommendations', title: 'Department: ' + '${escapedDept}', badge: 'Closed Recommendations', subtitle: '${d.closed} Closed Resolved Items', filterDept: '${escapedDept}', filterStatus: 'Closed' })"
              onmouseenter="portalApp.showTooltip(event, { title: '${escapedDept}', badge: 'Closed Findings', color: '#10b981', subtitle: 'Resolved & Implemented', metrics: [{ label: 'Closed Recommendations', value: '${d.closed}' }, { label: 'Closure Rate', value: '${pct}%' }], hint: 'Click to open and inspect closed items' })"
              onmousemove="portalApp.moveTooltip(event)"
              onmouseleave="portalApp.hideTooltip()"
            />
            ${closedW >= 15 ? `
              <text
                x="${padLeft + openW + closedW / 2}"
                y="${y + 14.5}"
                fill="#ffffff"
                font-size="9.5"
                font-weight="900"
                font-family="monospace"
                text-anchor="middle"
                class="pointer-events-none select-none"
              >${d.closed}</text>
            ` : ''}
          ` : ''}

          <!-- Total Count Metric on the Right -->
          <text
            x="${padLeft + chartW + 12}"
            y="${y + 14}"
            fill="#64748b"
            font-size="11"
            font-weight="800"
            font-family="monospace"
            text-anchor="start"
            class="transition-colors group-hover:fill-[#2E6DA4]"
            onclick="portalApp.openPlrDataModal({ type: 'recommendations', title: 'Department: ' + '${escapedDept}', badge: 'Action Department', subtitle: '${d.total} Total Recommendations', filterDept: '${escapedDept}' })"
          >${d.total}</text>
        </g>
      `;
    }).join('');

    const chartHtml = `
      <div class="w-full overflow-x-auto select-none">
        <svg viewBox="0 0 ${w} ${h}" class="w-full min-w-[700px] h-auto overflow-hidden">
          ${gridSvg}
          ${rowsSvg}
        </svg>
      </div>
    `;

    // Table 1: Findings Status by Action Department (Sub HSE Image 2)
    const tableHtml = `
      <div class="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs">
        <div class="px-4 py-3 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-[#2E6DA4]"></span>
            <span class="text-xs font-black text-slate-800 tracking-wider uppercase font-sans">TABLE 1: FINDINGS STATUS BY RECOMMENDATIONS DEPARTMENT</span>
          </div>
          <span class="text-[11px] text-slate-500 font-medium">Click any row, open or closed number to view relevant items</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-2.5 px-4">DEPARTMENT</th>
                <th class="py-2.5 px-3 text-center">TOTAL</th>
                <th class="py-2.5 px-3 text-center text-rose-600">OPEN</th>
                <th class="py-2.5 px-3 text-center text-emerald-700">CLOSE</th>
                <th class="py-2.5 px-4 text-center">% CLOSURE</th>
                <th class="py-2.5 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${chartDepts.map(d => {
                const pct = d.total > 0 ? Math.round((d.closed / d.total) * 100) : 0;
                const escapedDept = d.name.replace(/'/g, "\\'");
                return `
                  <tr
                    class="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    data-plr-action="dept-recs"
                    data-dept="${escapedDept}"
                    data-title="Department: ${escapedDept}"
                    data-subtitle="${d.total} Recommendations (${d.open} Open • ${d.closed} Closed)"
                    onclick="(window.portalApp || portalApp).openPlrDataModal({ type: 'recommendations', title: 'Department: ' + '${escapedDept}', badge: 'Action Department', subtitle: '${d.total} Recommendations (${d.open} Open • ${d.closed} Closed)', filterDept: '${escapedDept}' })"
                  >
                    <td class="py-2.5 px-4 font-bold text-slate-800 group-hover:text-[#2E6DA4] flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-[#2E6DA4]"></span>
                      <span>${d.name}</span>
                    </td>
                    <td class="py-2.5 px-3 text-center font-mono font-bold text-slate-700">${d.total}</td>
                    <td
                      class="py-2.5 px-3 text-center font-mono font-extrabold text-rose-600 hover:underline cursor-pointer"
                      data-plr-action="dept-recs"
                      data-dept="${escapedDept}"
                      data-status="Open"
                      data-title="Department: ${escapedDept}"
                      data-subtitle="${d.open} Open Pending Items"
                      onclick="event.stopPropagation(); (window.portalApp || portalApp).openPlrDataModal({ type: 'recommendations', title: 'Department: ' + '${escapedDept}', badge: 'Open Recommendations', subtitle: '${d.open} Open Pending Items', filterDept: '${escapedDept}', filterStatus: 'Open' })"
                      title="Click to view Open items"
                    >${d.open}</td>
                    <td
                      class="py-2.5 px-3 text-center font-mono font-extrabold text-emerald-700 hover:underline cursor-pointer"
                      data-plr-action="dept-recs"
                      data-dept="${escapedDept}"
                      data-status="Closed"
                      data-title="Department: ${escapedDept}"
                      data-subtitle="${d.closed} Closed Resolved Items"
                      onclick="event.stopPropagation(); (window.portalApp || portalApp).openPlrDataModal({ type: 'recommendations', title: 'Department: ' + '${escapedDept}', badge: 'Closed Recommendations', subtitle: '${d.closed} Closed Resolved Items', filterDept: '${escapedDept}', filterStatus: 'Closed' })"
                      title="Click to view Closed items"
                    >${d.closed}</td>
                    <td class="py-2.5 px-4">
                      <div class="flex items-center gap-2 justify-center">
                        <div class="w-24 h-2 rounded-full bg-slate-100 overflow-hidden shrink-0">
                          <div class="h-full ${pct >= 85 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500'}" style="width: ${pct}%;"></div>
                        </div>
                        <span class="font-mono font-bold text-[11px] ${pct >= 85 ? 'text-emerald-700' : pct >= 60 ? 'text-amber-700' : 'text-rose-600'} w-10 text-right">${pct}%</span>
                      </div>
                    </td>
                    <td class="py-2.5 px-3 text-right">
                      <button
                        data-plr-action="dept-recs"
                        data-dept="${escapedDept}"
                        data-title="Department: ${escapedDept}"
                        data-subtitle="${d.total} Recommendations"
                        onclick="event.stopPropagation(); (window.portalApp || portalApp).openPlrDataModal({ type: 'recommendations', title: 'Department: ' + '${escapedDept}', badge: 'Action Department', subtitle: '${d.total} Recommendations', filterDept: '${escapedDept}' })"
                        class="px-2.5 py-1 rounded-md text-[11px] font-bold text-[#2E6DA4] bg-blue-50/70 hover:bg-blue-100 border border-blue-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>View</span>
                        <i data-lucide="chevron-right" class="w-3 h-3"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Render depending on active viewMode
    if (viewMode === 'table') {
      container.innerHTML = tableHtml;
    } else if (viewMode === 'split') {
      container.innerHTML = `
        <div class="space-y-5">
          ${chartHtml}
          ${tableHtml}
        </div>
      `;
    } else {
      // Default: 'chart' (Horizontal Stacked Bar Chart)
      container.innerHTML = chartHtml;
    }

    // Quick Filter Pills (Allowing instant single-click dept filtering)
    if (filterContainer) {
      filterContainer.innerHTML = rawDepts.map(d => {
        const isSel = s.recSelectedEntity === d.name;
        const escaped = d.name.replace(/'/g, "\\'");
        return `
          <button
            onclick="portalApp.filterRecByDeptDirect('${escaped}')"
            class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              isSel
                ? 'bg-[#2E6DA4] text-white border-[#2E6DA4] font-black shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }"
            title="${d.name}: ${d.total} Items"
          >
            <span>${d.name}</span>
            <span class="font-mono text-[11px] text-rose-600 font-bold">(${d.open} Open</span>
            <span class="font-mono text-[11px] text-emerald-700 font-bold">/${d.closed} Closed)</span>
          </button>
        `;
      }).join('') + (s.recSelectedEntity !== 'all' ? `
        <button
          onclick="portalApp.filterRecByDeptDirect('all')"
          class="px-2.5 py-1 rounded-lg text-xs font-bold text-[#2E6DA4] bg-white hover:bg-slate-50 border border-[#2E6DA4] cursor-pointer"
        >
          Clear Dept Filter
        </button>
      ` : '');
    }

    if (window.lucide) window.lucide.createIcons();
  };

  /**
   * Open Resolution Data Modal for Closed/Open slices in PLR Dashboard
   */
  portalApp.openResolutionDataModal = function (status) {
    const s = getPlrState();
    const isIncidents = s.resolutionMode === 'incidents';
    const type = isIncidents ? 'incidents' : 'recommendations';
    const isClosed = status === 'Closed';
    const isAll = status === 'all';

    const activeIncidents = getPlrData();
    const activeRecs = getPlrRecs();
    const incOpenCount = activeIncidents.filter(i => (i.status || '').toLowerCase() === 'open').length;
    const incClosedCount = activeIncidents.length - incOpenCount;
    const incTotalCount = activeIncidents.length || 1;
    const incClosedPct = Math.round((incClosedCount / incTotalCount) * 100);
    const incOpenPct = Math.round((incOpenCount / incTotalCount) * 100);

    const recOpenCount = activeRecs.filter(r => (r.status || '').toLowerCase() === 'open').length;
    const recClosedCount = activeRecs.length - recOpenCount;
    const recTotalCount = activeRecs.length || 1;
    const recClosedPct = Math.round((recClosedCount / recTotalCount) * 100);
    const recOpenPct = Math.round((recOpenCount / recTotalCount) * 100);

    let title, badge, subtitle;
    if (isIncidents) {
      if (isAll) {
        title = 'All Plant Outage Incidents';
        badge = 'All Incidents';
        subtitle = `${activeIncidents.length} Total Plant Loss Outages (${incClosedCount} Closed • ${incOpenCount} Open)`;
      } else if (isClosed) {
        title = 'Closed Plant Outage Incidents';
        badge = 'Closed Incidents';
        subtitle = `${incClosedCount} Resolved Incidents (${incClosedPct}% Resolution Rate)`;
      } else {
        title = 'Open Pending Plant Outages';
        badge = 'Open Incidents';
        subtitle = `${incOpenCount} Open Unresolved Outages (${incOpenPct}% Pending Resolution)`;
      }
    } else {
      if (isAll) {
        title = 'All Action Recommendations';
        badge = 'All Recommendations';
        subtitle = `${activeRecs.length} Total Recommendations (${recClosedCount} Closed • ${recOpenCount} Open)`;
      } else if (isClosed) {
        title = 'Closed Action Recommendations';
        badge = 'Closed Recommendations';
        subtitle = `${recClosedCount} Resolved Recommendations (${recClosedPct}% Resolution Rate)`;
      } else {
        title = 'Open Action Recommendations';
        badge = 'Open Recommendations';
        subtitle = `${recOpenCount} Open Pending Recommendations (${recOpenPct}% Pending Resolution)`;
      }
    }

    portalApp.openPlrDataModal({
      type: type,
      title: title,
      badge: badge,
      subtitle: subtitle,
      filterStatus: status
    });
  };

  /**
   * 3. Overall Recommendations / Incidents Resolution Pie Chart
   * Executive corporate styling, darker tones, large clear readable numbers with click-to-drilldown
   */
  portalApp.renderResolutionPie = function () {
    const container = document.getElementById('plr-resolution-pie-container');
    if (!container) return;

    const s = getPlrState();
    const isIncidents = s.resolutionMode === 'incidents';

    // Dynamic counts from active datasets
    const curIncidents = getPlrData();
    const curRecs = getPlrRecs();
    const dynIncOpen = curIncidents.filter(i => (i.status || '').toLowerCase() === 'open').length;
    const dynIncClosed = curIncidents.length - dynIncOpen;
    const dynRecOpen = curRecs.filter(r => (r.status || '').toLowerCase() === 'open').length;
    const dynRecClosed = curRecs.length - dynRecOpen;

    const closed = isIncidents ? dynIncClosed : dynRecClosed;
    const open = isIncidents ? dynIncOpen : dynRecOpen;
    const total = (closed + open) || 1;
    const closedPct = ((closed / total) * 100).toFixed(1);
    const openPct = ((open / total) * 100).toFixed(1);

    const r = 140;
    const cx = 160;
    const cy = 160;

    const closedAngle = (closed / total) * 2 * Math.PI;
    const startAngle = -Math.PI / 2;
    const endClosed = startAngle + closedAngle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endClosed);
    const y2 = cy + r * Math.sin(endClosed);

    const largeArcClosed = closedAngle > Math.PI ? 1 : 0;
    const largeArcOpen = (2 * Math.PI - closedAngle) > Math.PI ? 1 : 0;

    const dClosed = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcClosed} 1 ${x2} ${y2} Z`;
    const dOpen = `M ${cx} ${cy} L ${x2} ${y2} A ${r} ${r} 0 ${largeArcOpen} 1 ${x1} ${y1} Z`;

    // Midpoints for labels
    const midClosed = startAngle + closedAngle / 2;
    const lxClosed = cx + (r * 0.54) * Math.cos(midClosed);
    const lyClosed = cy + (r * 0.54) * Math.sin(midClosed);

    const midOpen = endClosed + ((2 * Math.PI - closedAngle) / 2);
    const lxOpen = cx + (r * 0.72) * Math.cos(midOpen);
    const lyOpen = cy + (r * 0.72) * Math.sin(midOpen);

    // Dark corporate tones
    const darkClosedColor = '#047857'; // Deep dark corporate emerald
    const darkOpenColor = '#B91C1C';   // Deep dark rich crimson

    const labelNoun = isIncidents ? 'Outages' : 'Recs';

    container.innerHTML = `
      <div class="relative w-[300px] h-[300px] sm:w-[320px] sm:h-[320px] max-w-full aspect-square flex items-center justify-center">
        <svg viewBox="0 0 320 320" class="w-full h-full select-none filter drop-shadow-sm">
          <defs>
            <filter id="plrTextShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.45"/>
            </filter>
          </defs>

          <!-- Closed Slice (Deep Dark Emerald) -->
          <path
            d="${dClosed}"
            fill="${darkClosedColor}"
            class="cursor-pointer transition-all hover:brightness-110 hover:opacity-95"
            data-plr-action="resolution-modal"
            data-status="Closed"
            onclick="(window.portalApp || portalApp).openResolutionDataModal('Closed')"
            onmouseenter="portalApp.showTooltip(event, { title: 'Closed ${isIncidents ? 'Incidents' : 'Recommendations'}', value: '${closed} of ${total} ${labelNoun} (${closedPct}%)', badge: 'RESOLVED', hint: 'Click to open detailed records window' })"
            onmouseleave="portalApp.hideTooltip()"
          >
            <title>Closed: ${closed} ${labelNoun} (${closedPct}%) - Click to open records</title>
          </path>

          <!-- Open Slice (Deep Dark Crimson) -->
          <path
            d="${dOpen}"
            fill="${darkOpenColor}"
            class="cursor-pointer transition-all hover:brightness-110 hover:opacity-95"
            data-plr-action="resolution-modal"
            data-status="Open"
            onclick="(window.portalApp || portalApp).openResolutionDataModal('Open')"
            onmouseenter="portalApp.showTooltip(event, { title: 'Open Pending ${isIncidents ? 'Incidents' : 'Recommendations'}', value: '${open} of ${total} ${labelNoun} (${openPct}%)', badge: 'ACTION REQUIRED', hint: 'Click to open detailed records window' })"
            onmouseleave="portalApp.hideTooltip()"
          >
            <title>Open: ${open} ${labelNoun} (${openPct}%) - Click to open records</title>
          </path>

          <!-- Clean White Slices Divider Lines -->
          <line x1="${cx}" y1="${cy}" x2="${x1}" y2="${y1}" stroke="#ffffff" stroke-width="3"/>
          <line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#ffffff" stroke-width="3"/>
          
          <!-- Closed slice labels -->
          <text
            x="${lxClosed}"
            y="${lyClosed - 8}"
            fill="#ffffff"
            font-size="30"
            font-weight="900"
            font-family="'Plus Jakarta Sans', system-ui, sans-serif"
            text-anchor="middle"
            filter="url(#plrTextShadow)"
            class="select-none pointer-events-none"
          >${closed}</text>
          <text
            x="${lxClosed}"
            y="${lyClosed + 16}"
            fill="#E2E8F0"
            font-size="15"
            font-weight="700"
            font-family="'Plus Jakarta Sans', system-ui, sans-serif"
            text-anchor="middle"
            filter="url(#plrTextShadow)"
            class="select-none tracking-wide pointer-events-none"
          >${closedPct}% Closed</text>
          
          <!-- Open slice labels -->
          <text
            x="${lxOpen}"
            y="${lyOpen - 6}"
            fill="#ffffff"
            font-size="20"
            font-weight="900"
            font-family="'Plus Jakarta Sans', system-ui, sans-serif"
            text-anchor="middle"
            filter="url(#plrTextShadow)"
            class="select-none pointer-events-none"
          >${open}</text>
          <text
            x="${lxOpen}"
            y="${lyOpen + 12}"
            fill="#FEE2E2"
            font-size="12"
            font-weight="700"
            font-family="'Plus Jakarta Sans', system-ui, sans-serif"
            text-anchor="middle"
            filter="url(#plrTextShadow)"
            class="select-none tracking-wide pointer-events-none"
          >${openPct}% Open</text>
        </svg>
      </div>
    `;
  };

  /**
   * 4a. Assigned Recommendations Trends Chart (Supports Side-by-Side Bars and Executive Trend Lines)
   */
  portalApp.renderAssignedTrendChart = function () {
    const container = document.getElementById('plr-assigned-trend-chart-container');
    if (!container) return;

    const s = getPlrState();

    const w = 960;
    const h = 330;
    const pad = { top: 32, right: 30, bottom: 125, left: 48 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;
    const baseY = pad.top + chartH;

    let items = [];
    const isYearly = s.assignedTrendMode === 'yearly';

    if (isYearly) {
      items = getYearlyRecsList();
    } else {
      const allEntities = getEntityAnalyticsList();
      // Directly map all distinct Column F entities - no "Other Entities" grouping
      items = allEntities.map(e => ({ label: e.name, total: e.items, closed: e.closed, open: e.open, raw: e.name }));
    }

    if (!items.length) {
      container.innerHTML = `
        <div class="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
          <i data-lucide="inbox" class="w-8 h-8 mb-1.5 opacity-60"></i>
          <span>No trend data available for current selection.</span>
        </div>
      `;
      return;
    }

    const peak = Math.max(...items.map(d => Math.max(d.total, d.closed, d.open)), 1);
    const maxVal = Math.ceil(peak / 20) * 20 || 20;

    // Y Axis Grid lines
    const tickCount = 4;
    const yTicks = [];
    for (let i = 0; i <= tickCount; i++) {
      yTicks.push(Math.round((maxVal / tickCount) * i));
    }

    const gridSvg = yTicks.map(val => {
      const y = pad.top + chartH - (val / maxVal) * chartH;
      return `
        <line x1="${pad.left}" y1="${y}" x2="${w - pad.right}" y2="${y}" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="3 3"/>
        <text x="${pad.left - 8}" y="${y + 3}" fill="#64748b" font-size="9" font-family="monospace" text-anchor="end">${val}</text>
      `;
    }).join('');

    const baselineSvg = `
      <line x1="${pad.left}" y1="${baseY}" x2="${w - pad.right}" y2="${baseY}" stroke="#cbd5e1" stroke-width="1.5"/>
    `;

    const step = chartW / items.length;

    let contentSvg = '';

    if (s.assignedTrendViewType === 'side-by-side') {
      const groupW = isYearly ? Math.min(50, Math.max(28, step * 0.65)) : Math.min(36, Math.max(20, step * 0.7));
      const gap = 3;
      const subW = (groupW - gap) / 2;

      contentSvg = items.map((d, i) => {
        const xCenter = pad.left + i * step + step / 2;
        const xStart = xCenter - groupW / 2;
        const xClosed = xStart;
        const xOpen = xStart + subW + gap;

        const openH = (d.open / maxVal) * chartH;
        const closedH = (d.closed / maxVal) * chartH;
        const yClosed = baseY - closedH;
        const yOpen = baseY - openH;

        const labelText = isYearly ? d.year : d.label;
        const cleanName = isYearly ? d.year : formatDeptLabel(d.label);
        const isSelected = isYearly ? (s.selectedYear === d.year) : (s.recSelectedEntity === d.raw);
        const escapedRaw = (d.raw || '').replace(/'/g, "\\'");
        const groupClickHandler = isYearly
          ? `portalApp.handlePlrYearChange('${d.year}'); portalApp.openPlrDataModal({ type: 'recommendations', title: 'Year ' + '${d.year}' + ' Recommendations', badge: 'Year ' + '${d.year}', subtitle: '${d.total} Recommendations (${d.closed} Closed • ${d.open} Open)', filterYear: '${d.year}', filterStatus: 'all' })`
          : `portalApp.filterRecByDeptDirect('${escapedRaw}'); portalApp.openPlrDataModal({ type: 'recommendations', title: 'Department: ' + '${cleanName}', badge: 'Action Department', subtitle: '${d.total} Recommendations (${d.closed} Closed • ${d.open} Open)', filterDept: '${escapedRaw}', filterStatus: 'all' })`;

        const closedBarClickHandler = `event.stopPropagation(); portalApp.openPlrDataModal({ type: 'recommendations', title: '${isYearly ? 'Year ' + d.year : 'Department: ' + cleanName} (Closed)', badge: 'Closed Recs', subtitle: '${d.closed} Closed Recommendations (${resPct}% resolved)', filterYear: '${isYearly ? d.year : 'all'}', filterDept: '${isYearly ? 'all' : escapedRaw}', filterStatus: 'Closed' })`;
        const openBarClickHandler = `event.stopPropagation(); portalApp.openPlrDataModal({ type: 'recommendations', title: '${isYearly ? 'Year ' + d.year : 'Department: ' + cleanName} (Open)', badge: 'Open Recs', subtitle: '${d.open} Open Pending Recommendations', filterYear: '${isYearly ? d.year : 'all'}', filterDept: '${isYearly ? 'all' : escapedRaw}', filterStatus: 'Open' })`;

        const resPct = d.total > 0 ? ((d.closed / d.total) * 100).toFixed(0) : 0;
        const labelY = baseY + 12;

        const yClosedVal = d.closed > 0 ? yClosed - 5 : baseY - 5;
        const yOpenVal = d.open > 0 ? yOpen - 5 : baseY - 5;
        const highestValY = Math.min(yClosedVal, yOpenVal);

        return `
          <g class="cursor-pointer group" onclick="${groupClickHandler}">
            <title>${labelText}&#10;Total: ${d.total} Recs (Click to view all)&#10;Closed: ${d.closed} (${resPct}%) (Click to view closed)&#10;Open: ${d.open} (Click to view open)</title>
            
            <!-- Hover column highlight -->
            <rect x="${xStart - 4}" y="${pad.top}" width="${groupW + 8}" height="${chartH}" fill="#f8fafc" rx="4" class="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>

            <!-- Closed Bar (Emerald) -->
            ${d.closed > 0 ? `
              <rect
                x="${xClosed}"
                y="${yClosed}"
                width="${subW}"
                height="${Math.max(closedH, 2)}"
                fill="#10b981"
                rx="2"
                class="transition-all group-hover:fill-[#059669] cursor-pointer"
                onclick="${closedBarClickHandler}"
              />
            ` : `
              <rect x="${xClosed}" y="${baseY - 2}" width="${subW}" height="2" fill="#cbd5e1" rx="1"/>
            `}

            <!-- Open Bar (Rose) -->
            ${d.open > 0 ? `
              <rect
                x="${xOpen}"
                y="${yOpen}"
                width="${subW}"
                height="${Math.max(openH, 2)}"
                fill="#f43f5e"
                rx="2"
                class="transition-all group-hover:fill-[#e11d48] cursor-pointer"
                onclick="${openBarClickHandler}"
              />
            ` : `
              <rect x="${xOpen}" y="${baseY - 2}" width="${subW}" height="2" fill="#e2e8f0" rx="1"/>
            `}

            <!-- Value for Closed Bar (Emerald) -->
            <text
              x="${xClosed + subW / 2}"
              y="${yClosedVal}"
              fill="${d.closed > 0 ? '#047857' : '#94a3b8'}"
              font-size="8"
              font-weight="900"
              font-family="monospace"
              text-anchor="middle"
            >${d.closed}</text>

            <!-- Value for Open Bar (Red) -->
            <text
              x="${xOpen + subW / 2}"
              y="${yOpenVal}"
              fill="${d.open > 0 ? '#b91c1c' : '#94a3b8'}"
              font-size="8"
              font-weight="900"
              font-family="monospace"
              text-anchor="middle"
            >${d.open}</text>

            <!-- Total indicator above pair -->
            <text
              x="${xCenter}"
              y="${highestValY - 8}"
              fill="#0f172a"
              font-size="8.5"
              font-weight="bold"
              font-family="monospace"
              text-anchor="middle"
            >${d.total}</text>

            <!-- Baseline tick mark -->
            <line x1="${xCenter}" y1="${baseY}" x2="${xCenter}" y2="${baseY + 5}" stroke="#cbd5e1" stroke-width="1.5"/>

            <!-- X Axis Label (Never merges with text below) -->
            <text
              x="${xCenter}"
              y="${labelY}"
              fill="${isSelected ? '#1e40af' : '#475569'}"
              font-size="8.5"
              font-weight="${isSelected ? '900' : '600'}"
              text-anchor="${isYearly ? 'middle' : 'end'}"
              ${isYearly ? '' : `transform="rotate(-52, ${xCenter}, ${labelY})"`}
              class="group-hover:fill-[#1e40af] transition-colors"
            >${cleanName}<title>${labelText} (${d.total} Recs)</title></text>
          </g>
        `;
      }).join('');
    } else {
      // Trend lines mode
      const pointsClosed = [];
      const pointsOpen = [];
      const pointsTotal = [];

      items.forEach((d, i) => {
        const cx = pad.left + i * step + step / 2;
        const cyClosed = pad.top + chartH - (d.closed / maxVal) * chartH;
        const cyOpen = pad.top + chartH - (d.open / maxVal) * chartH;
        const cyTotal = pad.top + chartH - (d.total / maxVal) * chartH;
        pointsClosed.push({ x: cx, y: cyClosed, item: d });
        pointsOpen.push({ x: cx, y: cyOpen, item: d });
        pointsTotal.push({ x: cx, y: cyTotal, item: d });
      });

      const getSmoothPath = (pts) => {
        if (!pts.length) return '';
        let p = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[i];
          const p1 = pts[i + 1];
          const cpX = (p0.x + p1.x) / 2;
          p += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
        }
        return p;
      };

      const pathClosed = getSmoothPath(pointsClosed);
      const pathOpen = getSmoothPath(pointsOpen);
      const pathTotal = getSmoothPath(pointsTotal);

      const areaClosed = pathClosed + ` L ${pointsClosed[pointsClosed.length - 1].x} ${baseY} L ${pointsClosed[0].x} ${baseY} Z`;
      const areaOpen = pathOpen + ` L ${pointsOpen[pointsOpen.length - 1].x} ${baseY} L ${pointsOpen[0].x} ${baseY} Z`;

      const nodesSvg = items.map((d, i) => {
        const ptC = pointsClosed[i];
        const ptO = pointsOpen[i];
        const ptT = pointsTotal[i];

        const labelText = isYearly ? d.year : d.label;
        const cleanName = isYearly ? d.year : formatDeptLabel(d.label);
        const isSelected = isYearly ? (s.selectedYear === d.year) : (s.recSelectedEntity === d.raw);
        const clickHandler = isYearly
          ? `portalApp.handlePlrYearChange('${d.year}')`
          : `portalApp.filterRecByDeptDirect('${(d.raw || '').replace(/'/g, "\\'")}')`;

        const resPct = d.total > 0 ? ((d.closed / d.total) * 100).toFixed(0) : 0;
        const labelY = baseY + 12;

        return `
          <g class="cursor-pointer group" onclick="${clickHandler}">
            <title>${labelText}&#10;Total: ${d.total} Recs&#10;Closed: ${d.closed} (${resPct}%)&#10;Open: ${d.open}</title>
            
            <!-- Hover guide line -->
            <line x1="${ptC.x}" y1="${pad.top}" x2="${ptC.x}" y2="${baseY}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="2 2" class="opacity-0 group-hover:opacity-100 transition-opacity"/>
            
            <!-- Closed Node (Emerald) & Value -->
            <circle cx="${ptC.x}" cy="${ptC.y}" r="4.5" fill="#047857" stroke="#ffffff" stroke-width="2" class="transition-transform group-hover:scale-125"/>
            <text x="${ptC.x}" y="${ptC.y - 7}" fill="#047857" font-size="8.5" font-weight="bold" font-family="monospace" text-anchor="middle">${d.closed}</text>
            
            <!-- Open Node (Crimson) & Value -->
            ${d.open > 0 ? `
              <circle cx="${ptO.x}" cy="${ptO.y}" r="6.5" fill="none" stroke="#B91C1C" stroke-width="1.5" opacity="0.6"/>
              <circle cx="${ptO.x}" cy="${ptO.y}" r="3.5" fill="#B91C1C" stroke="#ffffff" stroke-width="1.5"/>
              <text x="${ptO.x}" y="${ptO.y - 7}" fill="#B91C1C" font-size="8.5" font-weight="bold" font-family="monospace" text-anchor="middle">${d.open}</text>
            ` : ''}

            <!-- Total Callout Label on Top -->
            <text x="${ptT.x}" y="${ptT.y - 8}" fill="#0f172a" font-size="9" font-weight="900" font-family="monospace" text-anchor="middle">${d.total}</text>
            
            <!-- Baseline tick mark -->
            <line x1="${ptC.x}" y1="${baseY}" x2="${ptC.x}" y2="${baseY + 5}" stroke="#cbd5e1" stroke-width="1.5"/>

            <!-- X Axis Label (Never merges with text below) -->
            <text
              x="${ptC.x}"
              y="${labelY}"
              fill="${isSelected ? '#1e40af' : '#475569'}"
              font-size="8.5"
              font-weight="${isSelected ? '900' : '600'}"
              text-anchor="${isYearly ? 'middle' : 'end'}"
              ${isYearly ? '' : `transform="rotate(-52, ${ptC.x}, ${labelY})"`}
              class="group-hover:fill-[#1e40af] transition-colors"
            >${cleanName}<title>${labelText} (${d.total} Recs)</title></text>
          </g>
        `;
      }).join('');

      contentSvg = `
        <defs>
          <linearGradient id="plrAssignedGradClosed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#047857" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#047857" stop-opacity="0.01"/>
          </linearGradient>
          <linearGradient id="plrAssignedGradOpen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#B91C1C" stop-opacity="0.22"/>
            <stop offset="100%" stop-color="#B91C1C" stop-opacity="0.01"/>
          </linearGradient>
        </defs>
        <path d="${areaClosed}" fill="url(#plrAssignedGradClosed)"/>
        <path d="${areaOpen}" fill="url(#plrAssignedGradOpen)"/>
        <path d="${pathTotal}" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
        <path d="${pathClosed}" fill="none" stroke="#047857" stroke-width="2.5"/>
        <path d="${pathOpen}" fill="none" stroke="#B91C1C" stroke-width="2.5"/>
        ${nodesSvg}
      `;
    }

    container.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" class="w-full h-auto select-none overflow-hidden">
        ${gridSvg}
        ${baselineSvg}
        ${contentSvg}
      </svg>
    `;
  };

  /**
   * Toggle between Entity trend and Yearly trend
   */
  portalApp.setAssignedTrendMode = function (mode) {
    const s = getPlrState();
    s.assignedTrendMode = mode;
    portalApp.renderAssignedTrendChart();
    const btnEntity = document.getElementById('plr-assigned-mode-entity');
    const btnYearly = document.getElementById('plr-assigned-mode-yearly');
    if (btnEntity && btnYearly) {
      if (mode === 'entity') {
        btnEntity.className = 'px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer bg-[#2E6DA4] text-white shadow-xs';
        btnYearly.className = 'px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer text-slate-600 hover:text-slate-900';
      } else {
        btnEntity.className = 'px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer text-slate-600 hover:text-slate-900';
        btnYearly.className = 'px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer bg-[#2E6DA4] text-white shadow-xs';
      }
    }
  };

  /**
   * Toggle between Side-by-Side bars and Trend Lines for Assigned Recommendations
   */
  portalApp.setAssignedTrendViewType = function (viewType) {
    const s = getPlrState();
    s.assignedTrendViewType = viewType;
    portalApp.renderAssignedTrendChart();
    const btnBars = document.getElementById('plr-assigned-view-bars');
    const btnTrend = document.getElementById('plr-assigned-view-trend');
    if (btnBars && btnTrend) {
      if (viewType === 'side-by-side') {
        btnBars.className = 'px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer bg-[#2E6DA4] text-white shadow-xs';
        btnTrend.className = 'px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer text-slate-600 hover:text-slate-900';
      } else {
        btnBars.className = 'px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer text-slate-600 hover:text-slate-900';
        btnTrend.className = 'px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer bg-[#2E6DA4] text-white shadow-xs';
      }
    }
  };

  /**
   * 4b. Assigned Recommendations Trend: Chips & Bento Cards (Dynamic entities from Recommendations tab Column F)
   */
  portalApp.renderEntityChipsAndBento = function () {
    const chipsContainer = document.getElementById('plr-entity-chips-container');
    const bentoContainer = document.getElementById('plr-bento-cards-container');
    if (!chipsContainer || !bentoContainer) return;

    const s = getPlrState();

    // Data dynamically calculated from action entities in recommendations:
    const entityList = getEntityAnalyticsList();

    // Chips at the top (Non-scrollable flex wrap, completely visible across page area)
    chipsContainer.innerHTML = entityList.map(e => {
      const isSel = s.recSelectedEntity === e.name;
      return `
        <button
          onclick="portalApp.filterRecByDeptDirect('${e.name.replace(/'/g, "\\'")}')"
          class="px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
            isSel
              ? 'bg-[#1e40af] text-white border-[#1e40af] font-black shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }"
        >
          <span>${e.name}</span>
          ${e.open > 0 ? `
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-red-100 text-[#B91C1C]">
              ${e.open} open
            </span>
          ` : `
            <span class="w-3.5 h-3.5 rounded-full bg-emerald-100 text-[#047857] flex items-center justify-center text-[9px] font-bold">✓</span>
          `}
        </button>
      `;
    }).join('') + (s.recSelectedEntity !== 'all' ? `
      <button
        onclick="portalApp.filterRecByDeptDirect('all')"
        class="px-3 py-1 rounded-full text-xs font-bold text-[#1e40af] bg-white hover:bg-slate-50 border border-[#1e40af] cursor-pointer"
      >
        Clear Filter
      </button>
    ` : '');

    // Bento Grid Cards (All distinct Column F entities displayed in 4-column responsive grid covering the page area)
    bentoContainer.innerHTML = entityList.map(e => {
      const isSel = s.recSelectedEntity === e.name;
      const openPct = e.items > 0 ? ((e.open / e.items) * 100).toFixed(0) : 0;
      const closedPct = 100 - openPct;

      return `
        <div
          onclick="portalApp.filterRecByDeptDirect('${e.name.replace(/'/g, "\\'")}')"
          class="bg-white hover:bg-slate-50 border ${
            isSel ? 'border-[#1e40af] ring-1 ring-[#1e40af] bg-blue-50/20' : 'border-slate-200'
          } rounded-xl p-3.5 shadow-xs space-y-2.5 transition-all cursor-pointer group"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-bold text-slate-900 truncate group-hover:text-[#1e40af] transition-colors">${e.name}</span>
            <span class="text-[11px] font-sans text-slate-500 shrink-0 font-semibold">${e.items} items</span>
          </div>
          
          <!-- Split Progress Bar (Darker tones: Crimson for Open, Corporate Emerald for Closed) -->
          <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
            ${e.open > 0 ? `<div class="h-full bg-[#B91C1C]" style="width: ${openPct}%;"></div>` : ''}
            <div class="h-full bg-[#047857]" style="width: ${closedPct}%;"></div>
          </div>

          <div class="flex items-center justify-between text-[11px] font-sans font-bold pt-0.5">
            <span class="flex items-center gap-1 ${e.open > 0 ? 'text-[#B91C1C]' : 'text-slate-400'}">
              <span class="w-1.5 h-1.5 rounded-full ${e.open > 0 ? 'bg-[#B91C1C]' : 'bg-slate-300'}"></span>
              ${e.open} Open
            </span>
            <span class="flex items-center gap-1 text-[#047857]">
              <span class="w-1.5 h-1.5 rounded-full bg-[#047857]"></span>
              ${e.closed} Closed
            </span>
          </div>
        </div>
      `;
    }).join('');
  };

  /**
   * 5. Plant Records & Outage Log Table (Light Theme)
   */
  portalApp.renderTableSection = function () {
    const s = getPlrState();
    const toolbar = document.getElementById('plr-table-toolbar-container');
    const tableBody = document.getElementById('plr-table-body-container');
    const pagination = document.getElementById('plr-pagination-container');
    if (!toolbar || !tableBody) return;

    if (s.activeTab === 'incidents') {
      portalApp.renderIncidentsTable(toolbar, tableBody, pagination);
    } else {
      portalApp.renderRecommendationsTable(toolbar, tableBody, pagination);
    }
  };

  /**
   * Incidents Master Log Table (Light Theme)
   */
  portalApp.renderIncidentsTable = function (toolbar, tableBody, pagination) {
    const s = getPlrState();
    const recsMap = getRecsMapByPlr();

    // Use unified filtered dataset
    const filtered = getFilteredPlrData();
    const allInc = getPlrData();
    const allOpen = allInc.filter(i => (i.status || '').toLowerCase() === 'open').length;
    const allClosed = allInc.length - allOpen;

    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / s.pageSize) || 1;
    if (s.page > totalPages) s.page = totalPages;
    const startIdx = (s.page - 1) * s.pageSize;
    const pageItems = filtered.slice(startIdx, startIdx + s.pageSize);

    // Toolbar
    toolbar.innerHTML = `
      <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <!-- Search Input -->
        <div class="relative flex-1 max-w-md">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <i data-lucide="search" class="w-4 h-4"></i>
          </div>
          <input
            type="text"
            value="${s.searchQuery}"
            oninput="portalApp.searchPlr(this.value)"
            placeholder="Search PLR #, incident description, machine, priority.."
            class="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2E6DA4] focus:ring-1 focus:ring-[#2E6DA4]"
          />
          ${s.searchQuery ? `
            <button onclick="portalApp.searchPlr('')" class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          ` : ''}
        </div>

        <!-- Dropdowns & Count -->
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Dept Dropdown -->
          <div class="flex items-center gap-1.5 text-xs text-slate-700">
            <span class="font-bold text-slate-500">DEPT:</span>
            <select
              onchange="portalApp.filterPlrByDept(this.value)"
              class="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#2E6DA4] cursor-pointer"
            >
              ${renderActionEntitySelectOptions(s.selectedDept)}
            </select>
          </div>

          <!-- Status Dropdown -->
          <div class="flex items-center gap-1.5 text-xs text-slate-700">
            <span class="font-bold text-slate-500">STATUS:</span>
            <select
              onchange="portalApp.filterPlrByStatus(this.value)"
              class="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#2E6DA4] cursor-pointer"
            >
              <option value="all" ${s.selectedStatus === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="Closed" ${s.selectedStatus === 'Closed' ? 'selected' : ''}>Closed (${allClosed})</option>
              <option value="Open" ${s.selectedStatus === 'Open' ? 'selected' : ''}>Open (${allOpen})</option>
            </select>
          </div>

          <span class="text-xs font-mono text-slate-500">Showing <strong class="text-slate-900">${totalFiltered}</strong> records</span>

          <button
            onclick="portalApp.exportPlrCSV()"
            class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <i data-lucide="download" class="w-3.5 h-3.5 text-[#2E6DA4]"></i>
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    `;

    // Table Content matching exact columns:
    // S_NO | PLR # | YEAR | DATE | INCIDENT DESCRIPTION | MACHINE (COL G) | PRIORITY (COL H) | ACTION ENTITY (COL F) | STATUS (COL F) | VIEW
    tableBody.innerHTML = `
      <table class="w-full text-left text-xs sm:text-sm">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-600">
            <th class="py-3 px-3 w-14 text-center">S_NO</th>
            <th class="py-3 px-3 w-24">PLR #</th>
            <th class="py-3 px-3 w-20">YEAR</th>
            <th class="py-3 px-3 w-28">DATE</th>
            <th class="py-3 px-4 min-w-[320px]">INCIDENT DESCRIPTION</th>
            <th class="py-3 px-3 w-32">MACHINE (COL G)</th>
            <th class="py-3 px-3 w-24">PRIORITY (COL H)</th>
            <th class="py-3 px-3 w-32">ACTION ENTITY (COL F)</th>
            <th class="py-3 px-3 w-28">STATUS (COL F)</th>
            <th class="py-3 px-3 w-16 text-center">VIEW</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium">
          ${pageItems.length === 0 ? `
            <tr>
              <td colspan="10" class="py-8 text-center text-slate-500">
                No incidents match the active filters.
              </td>
            </tr>
          ` : pageItems.map(item => {
            const isOpen = (item.status || '').toLowerCase() === 'open';
            const recList = recsMap.get(String(item.plrNo).toUpperCase()) || [];
            const isHigh = (item.priority || '').toLowerCase() === 'high';

            return `
              <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3 px-3 font-mono text-center text-slate-500">${item.sNo}</td>
                <td class="py-3 px-3 font-mono font-bold">
                  <button
                    onclick="portalApp.openPlrInspectionModal(${item.plrNo})"
                    class="font-mono font-bold text-[#2E6DA4] hover:underline cursor-pointer flex items-center gap-1"
                    title="Inspect incident and ${recList.length} linked recommendations"
                  >
                    #${item.plrNo}
                    ${recList.length > 0 ? `<span class="text-[10px] text-slate-500 font-normal">(${recList.length} recs)</span>` : ''}
                  </button>
                </td>
                <td class="py-3 px-3 font-mono text-slate-600">${item.year}</td>
                <td class="py-3 px-3 font-mono text-slate-600">${item.date}</td>
                <td class="py-3 px-4 text-slate-800 text-xs leading-relaxed max-w-md">${item.incident}</td>
                <td class="py-3 px-3">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    <i data-lucide="cpu" class="w-3 h-3 text-[#2E6DA4]"></i>
                    ${item.machine}
                  </span>
                </td>
                <td class="py-3 px-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                    isHigh
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }">
                    ${item.priority || 'Low'}
                  </span>
                </td>
                <td class="py-3 px-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    ${item.dept || 'KE'}
                  </span>
                </td>
                <td class="py-3 px-3">
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    isOpen
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }">
                    <i data-lucide="${isOpen ? 'alert-circle' : 'check-circle-2'}" class="w-3 h-3"></i>
                    ${item.status}
                  </span>
                </td>
                <td class="py-3 px-3 text-center">
                  <button
                    onclick="portalApp.openPlrInspectionModal(${item.plrNo})"
                    class="p-1.5 rounded-lg text-slate-500 hover:text-[#2E6DA4] hover:bg-blue-50 transition-colors cursor-pointer"
                    title="View details & cross-sheet recommendations"
                  >
                    <i data-lucide="eye" class="w-4 h-4"></i>
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    // Pagination
    if (pagination) {
      pagination.innerHTML = `
        <div class="flex items-center gap-2">
          <span>Page <strong class="text-slate-900">${s.page}</strong> of <strong class="text-slate-900">${totalPages}</strong></span>
          <span class="text-slate-400">•</span>
          <span>Showing ${startIdx + 1} to ${Math.min(startIdx + s.pageSize, totalFiltered)} of ${totalFiltered}</span>
        </div>
        <div class="flex items-center gap-1">
          <button
            onclick="portalApp.setPlrPage(1)"
            ${s.page === 1 ? 'disabled' : ''}
            class="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50 shadow-xs"
          >First</button>
          <button
            onclick="portalApp.setPlrPage(${s.page - 1})"
            ${s.page === 1 ? 'disabled' : ''}
            class="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50 shadow-xs"
          >Prev</button>
          <span class="px-3 py-1 font-mono font-bold text-[#2E6DA4]">${s.page}</span>
          <button
            onclick="portalApp.setPlrPage(${s.page + 1})"
            ${s.page >= totalPages ? 'disabled' : ''}
            class="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50 shadow-xs"
          >Next</button>
          <button
            onclick="portalApp.setPlrPage(${totalPages})"
            ${s.page >= totalPages ? 'disabled' : ''}
            class="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50 shadow-xs"
          >Last</button>
        </div>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
  };

  /**
   * Recommendations Tab Table (Light Theme, 451 Recs linked via PLR #)
   */
  portalApp.renderRecommendationsTable = function (toolbar, tableBody, pagination) {
    const plrsMap = getPlrsMap();
    const s = getPlrState();

    const filtered = getFilteredPlrRecs();

    const rawAll = getPlrRecs();
    const totalRaw = rawAll.length;
    const rawOpenCount = rawAll.filter(r => (r.status || '').toLowerCase() === 'open').length;
    const rawClosedCount = totalRaw - rawOpenCount;

    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / s.recPageSize) || 1;
    if (s.recPage > totalPages) s.recPage = totalPages;
    const startIdx = (s.recPage - 1) * s.recPageSize;
    const pageItems = filtered.slice(startIdx, startIdx + s.recPageSize);

    // Toolbar
    toolbar.innerHTML = `
      <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <!-- Search Input -->
        <div class="relative flex-1 max-w-md">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <i data-lucide="search" class="w-4 h-4"></i>
          </div>
          <input
            type="text"
            value="${s.recSearchQuery}"
            oninput="portalApp.searchRec(this.value)"
            placeholder="Search recommendations, PLR #, entity, status.."
            class="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2E6DA4] focus:ring-1 focus:ring-[#2E6DA4]"
          />
          ${s.recSearchQuery ? `
            <button onclick="portalApp.searchRec('')" class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          ` : ''}
        </div>

        <!-- Entity Filter & Status & Actions -->
        <div class="flex flex-wrap items-center gap-2.5">
          <div class="flex items-center gap-1.5 text-xs text-slate-700">
            <span class="font-bold text-slate-500">ACTION ENTITY:</span>
            <select
              onchange="portalApp.filterRecByDeptDirect(this.value)"
              class="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#2E6DA4] cursor-pointer"
            >
              ${renderActionEntitySelectOptions(s.recSelectedEntity)}
            </select>
          </div>

          <div class="flex items-center gap-1.5 text-xs text-slate-700">
            <span class="font-bold text-slate-500">STATUS:</span>
            <select
              onchange="portalApp.filterRecByStatusDirect(this.value)"
              class="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#2E6DA4] cursor-pointer"
            >
              <option value="all" ${s.recSelectedStatus === 'all' ? 'selected' : ''}>All (${totalRaw})</option>
              <option value="Closed" ${s.recSelectedStatus === 'Closed' ? 'selected' : ''}>Closed (${rawClosedCount})</option>
              <option value="Open" ${s.recSelectedStatus === 'Open' ? 'selected' : ''}>Open (${rawOpenCount})</option>
            </select>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              onclick="portalApp.openPlrSheetSyncModal()"
              class="px-2 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              title="Sync recommendations from Google Sheet Tab Recommendations"
            >
              <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>Sync Sheet</span>
            </button>
          </div>

          <span class="text-xs font-sans text-slate-500">Showing <strong class="text-slate-900">${totalFiltered}</strong> of ${totalRaw}</span>
        </div>
      </div>
    `;

    // Table Content with Reciprocal PLR Linking
    tableBody.innerHTML = `
      <table class="w-full text-left text-xs sm:text-sm">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-600">
            <th class="py-3 px-3 w-14 text-center">S_NO</th>
            <th class="py-3 px-3 w-28">PLR # (COL B)</th>
            <th class="py-3 px-3 w-20">YEAR</th>
            <th class="py-3 px-3 w-28">DATE</th>
            <th class="py-3 px-4 min-w-[340px]">
              <div class="flex items-center gap-1.5">
                <span>RECOMMENDATIONS (COL E)</span>
                <span class="inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Tab: Recommendations</span>
              </div>
            </th>
            <th class="py-3 px-3 w-36">ACTION ENTITY (COL F)</th>
            <th class="py-3 px-3 w-32 text-center">STATUS (COL G)</th>
            <th class="py-3 px-3 w-40">LINKED PLR INCIDENT</th>
            <th class="py-3 px-3 w-24 text-center">ACTIONS</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium">
          ${pageItems.length === 0 ? `
            <tr>
              <td colspan="9" class="py-8 text-center text-slate-500">
                No recommendations match the active filter criteria.
              </td>
            </tr>
          ` : pageItems.map(item => {
            const isOpen = (item.status || '').toLowerCase() === 'open';
            const parentPlr = plrsMap.get(String(item.plrNo).toUpperCase());

            return `
              <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3 px-3 font-mono text-center text-slate-500">${item.sNo}</td>
                <td class="py-3 px-3 font-mono font-bold">
                  <button
                    onclick="portalApp.openPlrInspectionModal(${item.plrNo})"
                    class="font-mono font-bold text-[#2E6DA4] hover:underline cursor-pointer flex items-center gap-1"
                    title="Cross-reference PLR #${item.plrNo}"
                  >
                    #${item.plrNo}
                  </button>
                </td>
                <td class="py-3 px-3 font-mono text-slate-600">${item.year || (parentPlr ? parentPlr.year : '—')}</td>
                <td class="py-3 px-3 font-mono text-slate-600">${item.date || (parentPlr ? parentPlr.date : '—')}</td>
                <td class="py-3 px-4 text-slate-800 text-xs leading-relaxed max-w-lg">${item.recommendation}</td>
                <td class="py-3 px-3">
                  <div class="flex flex-wrap gap-1">
                    ${splitAndNormalizeActionEntities(item.actionBy).map(d => `
                      <span
                        onclick="portalApp.filterRecByDeptDirect('${d.replace(/'/g, "\\'")}', true)"
                        class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-blue-50 hover:text-[#2E6DA4] hover:border-blue-300 transition-colors cursor-pointer"
                        title="Filter by ${d}"
                      >
                        ${d}
                      </span>
                    `).join('')}
                  </div>
                </td>
                <td class="py-3 px-3 text-center">
                  <button
                    onclick="portalApp.toggleRecommendationStatus(${item.sNo})"
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                      isOpen
                        ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    }"
                    title="Click to toggle status: currently ${item.status}. Click to change to ${isOpen ? 'Closed' : 'Open'}"
                  >
                    <i data-lucide="${isOpen ? 'alert-circle' : 'check-circle-2'}" class="w-3.5 h-3.5 ${isOpen ? 'text-rose-600' : 'text-emerald-600'}"></i>
                    <span>${item.status}</span>
                    <i data-lucide="refresh-cw" class="w-2.5 h-2.5 opacity-40 ml-0.5"></i>
                  </button>
                </td>
                <td class="py-3 px-3 text-slate-600 text-xs truncate max-w-xs">
                  ${parentPlr ? `
                    <span class="inline-flex items-center gap-1 text-[11px] text-[#2E6DA4] hover:underline cursor-pointer" onclick="portalApp.openPlrInspectionModal(${item.plrNo})">
                      <span class="font-bold font-mono">[${parentPlr.machine}]</span>
                      <span class="truncate">${(parentPlr.incident || '').slice(0, 24)}...</span>
                    </span>
                  ` : '—'}
                </td>
                <td class="py-3 px-3 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      onclick="portalApp.openEditRecommendationModal(${item.sNo})"
                      class="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Edit recommendation text, department, status"
                    >
                      <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                    </button>
                    <button
                      onclick="portalApp.deleteRecommendation(${item.sNo})"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete recommendation"
                    >
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                    <button
                      onclick="portalApp.openPlrInspectionModal(${item.plrNo})"
                      class="p-1.5 rounded-lg text-slate-500 hover:text-[#2E6DA4] hover:bg-blue-50 transition-colors cursor-pointer"
                      title="View dual-sheet inspection modal"
                    >
                      <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    // Pagination
    if (pagination) {
      pagination.innerHTML = `
        <div class="flex items-center gap-2">
          <span>Page <strong class="text-slate-900">${s.recPage}</strong> of <strong class="text-slate-900">${totalPages}</strong></span>
          <span class="text-slate-400">•</span>
          <span>Showing ${startIdx + 1} to ${Math.min(startIdx + s.recPageSize, totalFiltered)} of ${totalFiltered}</span>
        </div>
        <div class="flex items-center gap-1">
          <button
            onclick="portalApp.setRecPage(1)"
            ${s.recPage === 1 ? 'disabled' : ''}
            class="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50 shadow-xs"
          >First</button>
          <button
            onclick="portalApp.setRecPage(${s.recPage - 1})"
            ${s.recPage === 1 ? 'disabled' : ''}
            class="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50 shadow-xs"
          >Prev</button>
          <span class="px-3 py-1 font-mono font-bold text-[#2E6DA4]">${s.recPage}</span>
          <button
            onclick="portalApp.setRecPage(${s.recPage + 1})"
            ${s.recPage >= totalPages ? 'disabled' : ''}
            class="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50 shadow-xs"
          >Next</button>
          <button
            onclick="portalApp.setRecPage(${totalPages})"
            ${s.recPage >= totalPages ? 'disabled' : ''}
            class="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50 shadow-xs"
          >Last</button>
        </div>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
  };

  /**
   * 6. Cross-Referenced PLR Inspection Modal (Light Theme)
   */
  portalApp.openPlrInspectionModal = function (plrNo) {
    const plrsMap = getPlrsMap();
    const recsMap = getRecsMapByPlr();

    const parentPlr = plrsMap.get(String(plrNo).toUpperCase());
    const linkedRecs = recsMap.get(String(plrNo).toUpperCase()) || [];

    const modalContainer = document.getElementById('plr-inspection-modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
        <div class="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          <!-- Modal Header -->
          <div class="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#2E6DA4] flex items-center justify-center shrink-0">
                <i data-lucide="layers" class="w-5 h-5"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-black text-slate-900">Cross-Sheet Tracking Inspection: PLR #${plrNo}</h3>
                  ${parentPlr ? `
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      (parentPlr.status || '').toLowerCase() === 'open'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }">${parentPlr.status} Incident</span>
                  ` : ''}
                </div>
                <p class="text-xs text-slate-500 mt-0.5">
                  Connected tracking across Tab <strong class="text-[#2E6DA4]">PLRStatus</strong> and Tab <strong class="text-emerald-700">Recommendations</strong>
                </p>
              </div>
            </div>
            <button
              onclick="portalApp.closePlrInspectionModal()"
              class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Modal Scrollable Body -->
          <div class="p-5 space-y-5 overflow-y-auto">
            
            <!-- Tab 1 Data: Incident Investigation Details -->
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-[#2E6DA4] uppercase tracking-wider flex items-center gap-1.5">
                  <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                  Tab: PLRStatus (Incident Investigation Report)
                </span>
                <span class="text-xs font-mono text-slate-500">PLR #${plrNo}</span>
              </div>

              ${parentPlr ? `
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 pb-2 border-b border-slate-200">
                  <div>
                    <span class="text-slate-500 text-[10px] block uppercase font-bold">Machine (Col G)</span>
                    <strong class="text-slate-900 font-mono">${parentPlr.machine}</strong>
                  </div>
                  <div>
                    <span class="text-slate-500 text-[10px] block uppercase font-bold">Outage Date</span>
                    <strong class="text-slate-900 font-mono">${parentPlr.date} (${parentPlr.year})</strong>
                  </div>
                  <div>
                    <span class="text-slate-500 text-[10px] block uppercase font-bold">Priority (Col H)</span>
                    <strong class="text-slate-900">${parentPlr.priority || 'Low'}</strong>
                  </div>
                  <div>
                    <span class="text-slate-500 text-[10px] block uppercase font-bold">Action Entity (Col I)</span>
                    <strong class="text-slate-900">${parentPlr.dept || 'KE'}</strong>
                  </div>
                </div>
                <div>
                  <span class="text-slate-500 text-[10px] block uppercase font-bold mb-1">Loss Narrative / Incident Description</span>
                  <p class="text-xs text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                    ${parentPlr.incident}
                  </p>
                </div>
              ` : `
                <p class="text-xs text-slate-500 italic">No corresponding row in PLRStatus tab.</p>
              `}
            </div>

            <!-- Tab 2 Data: Linked Action Recommendations -->
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <i data-lucide="check-square" class="w-3.5 h-3.5"></i>
                  Tab: Recommendations (${linkedRecs.length} Action Items Connected)
                </span>
                <span class="text-xs font-mono text-slate-500">Referenced by PLR #${plrNo}</span>
              </div>

              ${linkedRecs.length === 0 ? `
                <p class="text-xs text-slate-500 italic py-2">
                  No specific corrective actions logged for this PLR in Recommendations tab yet.
                </p>
              ` : `
                <div class="space-y-2.5">
                  ${linkedRecs.map((r, idx) => {
                    const isOp = (r.status || '').toLowerCase() === 'open';
                    return `
                      <div class="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                        <div class="flex items-center justify-between gap-2 flex-wrap">
                          <span class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span class="w-5 h-5 rounded-full bg-slate-100 text-[#2E6DA4] flex items-center justify-center text-[10px] font-mono font-bold">${idx + 1}</span>
                            <span class="text-[#2E6DA4]">${normalizeActionEntity(r.actionBy)}</span>
                          </span>
                          <button
                            onclick="portalApp.toggleRecommendationStatus(${r.sNo}, ${plrNo})"
                            class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer hover:scale-105 shadow-2xs ${
                              isOp ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            }"
                            title="Click to toggle status: currently ${r.status}. Click to change to ${isOp ? 'Closed' : 'Open'}"
                          >
                            <i data-lucide="${isOp ? 'alert-circle' : 'check-circle-2'}" class="w-3 h-3 ${isOp ? 'text-rose-600' : 'text-emerald-600'}"></i>
                            <span>${r.status}</span>
                            <i data-lucide="refresh-cw" class="w-2 h-2 opacity-40 ml-0.5"></i>
                          </button>
                        </div>
                        <p class="text-xs text-slate-700 leading-relaxed font-normal">
                          ${r.recommendation}
                        </p>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>

          </div>

          <!-- Modal Footer -->
          <div class="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <button
                onclick="portalApp.switchTabAndFilterPlr(${plrNo})"
                class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#2E6DA4] hover:bg-[#235885] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                <span>View Linked in Recommendations Tab</span>
              </button>
            </div>
            <button
              onclick="portalApp.closePlrInspectionModal()"
              class="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-xs"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  };

  portalApp.closePlrInspectionModal = function () {
    const modalContainer = document.getElementById('plr-inspection-modal-container');
    if (modalContainer) modalContainer.innerHTML = '';
  };

  /**
   * 7. Interactive Drilldown Data Modal (Matching Sub HSE - PSM Dashboard layout and UX)
   */

  /**
   * Dedicated entry point for KPI cards click drill-down
   * Slices data precisely according to the clicked metric and inherits active dashboard filters
   */
  portalApp.openPlrKpiModal = function (kpiType) {
    const s = getPlrState();
    const rawData = getPlrData();
    const rawRecs = getPlrRecs();

    // Inherit active filters from dashboard so drilldown matches the KPI card context
    const activeMachine = s.selectedMachine !== 'all' ? s.selectedMachine : 'all';
    const activePriority = s.selectedPriority !== 'all' ? s.selectedPriority : 'all';
    const activeDept = s.selectedDept !== 'all' ? s.selectedDept : (s.selectedEntity !== 'all' ? s.selectedEntity : 'all');
    const activeYear = s.selectedYear !== 'all' ? s.selectedYear : 'all';

    if (kpiType === 'total-plrs') {
      const openCount = rawData.filter(d => (d.status || '').toLowerCase() === 'open').length;
      const closedCount = rawData.length - openCount;
      const closureRate = rawData.length > 0 ? Math.round((closedCount / rawData.length) * 100) : 0;
      portalApp.openPlrDataModal({
        type: 'incidents',
        title: 'Total Plant Loss Reports (PLR Incident Log)',
        badge: `${rawData.length} Total Incidents`,
        subtitle: `Complete historical plant loss and outage reports (2017–2025) across STG, Boilers & Auxiliaries • ${closedCount} Closed (${closureRate}%), ${openCount} Open`,
        filterStatus: 'all',
        filterMachine: activeMachine,
        filterPriority: activePriority,
        filterDept: activeDept,
        filterYear: activeYear,
        kpiSource: 'total-plrs'
      });
    } else if (kpiType === 'open-plrs') {
      const openCount = rawData.filter(d => (d.status || '').toLowerCase() === 'open').length;
      portalApp.openPlrDataModal({
        type: 'incidents',
        title: 'Open Plant Loss Reports Under Active Investigation',
        badge: `${openCount} Open Incidents`,
        subtitle: 'Plant outages undergoing root-cause investigation, corrective maintenance, or pending closeout sign-off',
        filterStatus: 'Open',
        filterMachine: activeMachine,
        filterPriority: activePriority,
        filterDept: activeDept,
        filterYear: activeYear,
        kpiSource: 'open-plrs'
      });
    } else if (kpiType === 'total-recs') {
      const openRecs = rawRecs.filter(r => (r.status || '').toLowerCase() === 'open').length;
      const closedRecs = rawRecs.length - openRecs;
      const closureRate = rawRecs.length > 0 ? Math.round((closedRecs / rawRecs.length) * 100) : 0;
      portalApp.openPlrDataModal({
        type: 'recommendations',
        title: 'Total Corrective Action Recommendations',
        badge: `${rawRecs.length} Total Recommendations`,
        subtitle: `Corrective action items extracted across 14+ standardized Action Entities • ${closedRecs} Closed (${closureRate}%), ${openRecs} Open`,
        filterStatus: 'all',
        filterMachine: activeMachine,
        filterPriority: activePriority,
        filterDept: activeDept,
        filterYear: activeYear,
        kpiSource: 'total-recs'
      });
    } else if (kpiType === 'open-recs') {
      const openRecs = rawRecs.filter(r => (r.status || '').toLowerCase() === 'open').length;
      portalApp.openPlrDataModal({
        type: 'recommendations',
        title: 'Open Action Recommendations (Active Corrective Backlog)',
        badge: `${openRecs} Open Recommendations`,
        subtitle: 'Active corrective action items awaiting physical completion or engineering sign-off',
        filterStatus: 'Open',
        filterMachine: activeMachine,
        filterPriority: activePriority,
        filterDept: activeDept,
        filterYear: activeYear,
        kpiSource: 'open-recs'
      });
    }
  };

  portalApp.openPlrDataModal = function (opts = {}) {
    const s = getPlrState();
    const type = opts.type || 'incidents'; // 'incidents' or 'recommendations'
    const title = opts.title || (type === 'incidents' ? 'Plant Outage Incidents' : 'Action Recommendations');
    const badge = opts.badge || (type === 'incidents' ? 'Incident Outages' : 'Action Recommendations');
    const subtitle = opts.subtitle || 'Detailed operational records';
    const filterStatus = opts.filterStatus || 'all'; // 'all', 'Open', 'Closed'
    const filterMachine = opts.filterMachine || 'all';
    const filterDept = opts.filterDept || opts.filterEntity || 'all';
    const filterPriority = opts.filterPriority || 'all';
    const filterYear = opts.filterYear ? String(opts.filterYear).trim() : 'all';

    let allRecords = [];
    if (type === 'incidents') {
      allRecords = getPlrData();
    } else {
      allRecords = getPlrRecs();
    }

    s.activePlrModal = {
      type,
      title,
      badge,
      subtitle,
      filterMachine,
      filterDept,
      filterPriority,
      filterYear,
      activeStatusTab: filterStatus,
      searchQuery: '',
      allRecords: allRecords,
      kpiSource: opts.kpiSource || null,
      baseTitle: title,
      baseSubtitle: subtitle
    };

    portalApp.renderPlrDataModal();
  };

  portalApp.closePlrDataModal = function () {
    const s = getPlrState();
    s.activePlrModal = null;
    const container = document.getElementById('plr-data-modal-container');
    if (container) container.innerHTML = '';
  };

  portalApp.setPlrDataModalStatusTab = function (status) {
    const s = getPlrState();
    if (!s.activePlrModal) return;
    s.activePlrModal.activeStatusTab = status;
    portalApp.renderPlrDataModal();
  };

  portalApp.setPlrDataModalMachine = function (machine) {
    const s = getPlrState();
    if (!s.activePlrModal) return;
    s.activePlrModal.filterMachine = machine;
    portalApp.renderPlrDataModal();
  };

  portalApp.setPlrDataModalPriority = function (priority) {
    const s = getPlrState();
    if (!s.activePlrModal) return;
    s.activePlrModal.filterPriority = priority;
    portalApp.renderPlrDataModal();
  };

  portalApp.setPlrDataModalDept = function (dept) {
    const s = getPlrState();
    if (!s.activePlrModal) return;
    s.activePlrModal.filterDept = dept;
    portalApp.renderPlrDataModal();
  };

  portalApp.setPlrDataModalYear = function (year) {
    const s = getPlrState();
    if (!s.activePlrModal) return;
    s.activePlrModal.filterYear = year ? String(year).trim() : 'all';
    portalApp.renderPlrDataModal();
  };

  portalApp.resetPlrDataModalFilters = function () {
    const s = getPlrState();
    if (!s.activePlrModal) return;
    s.activePlrModal.activeStatusTab = 'all';
    s.activePlrModal.filterMachine = 'all';
    s.activePlrModal.filterPriority = 'all';
    s.activePlrModal.filterDept = 'all';
    s.activePlrModal.filterYear = 'all';
    s.activePlrModal.searchQuery = '';
    portalApp.renderPlrDataModal();
  };

  portalApp.filterPlrDataModalSearch = function (query) {
    const s = getPlrState();
    if (!s.activePlrModal) return;
    s.activePlrModal.searchQuery = query;
    portalApp.renderPlrDataModal(true);
  };

  /**
   * Toggle Recommendation status directly from inside the pop-up modal
   */
  portalApp.toggleRecStatusFromModal = function (sNo) {
    portalApp.toggleRecommendationStatus(sNo);
    const s = getPlrState();
    if (s.activePlrModal) {
      s.activePlrModal.allRecords = getPlrRecs();
      portalApp.renderPlrDataModal();
    }
  };

  portalApp.getPlrModalFilteredRecords = function () {
    const s = getPlrState();
    if (!s.activePlrModal) return [];
    const m = s.activePlrModal;
    let records = m.allRecords || [];
    const plrsMap = getPlrsMap();

    // 1. Filter by status tab (All, Open, Closed)
    if (m.activeStatusTab && m.activeStatusTab !== 'all') {
      const target = m.activeStatusTab.toLowerCase().trim();
      records = records.filter(r => (r.status || '').toLowerCase().trim() === target);
    }

    // 2. Filter by machine
    if (m.filterMachine && m.filterMachine !== 'all') {
      if (m.type === 'incidents') {
        records = records.filter(r => matchesMachine(r.machine, m.filterMachine));
      } else {
        records = records.filter(r => {
          const parent = plrsMap.get(String(r.plrNo).toUpperCase());
          return parent ? matchesMachine(parent.machine, m.filterMachine) : false;
        });
      }
    }

    // 3. Filter by priority (for incidents & recommendations linked to PLR)
    if (m.filterPriority && m.filterPriority !== 'all') {
      const targetPri = m.filterPriority.toLowerCase().trim();
      if (m.type === 'incidents') {
        records = records.filter(r => (r.priority || '').toLowerCase().trim() === targetPri);
      } else {
        records = records.filter(r => {
          const parent = plrsMap.get(String(r.plrNo).toUpperCase());
          return parent ? (parent.priority || '').toLowerCase().trim() === targetPri : false;
        });
      }
    }

    // 4. Filter by department / entity
    if (m.filterDept && m.filterDept !== 'all') {
      if (m.type === 'incidents') {
        records = records.filter(r => matchesActionEntity(r.dept, m.filterDept));
      } else {
        records = records.filter(r => matchesActionEntity(r.actionBy, m.filterDept));
      }
    }

    // 5. Filter by year
    if (m.filterYear && m.filterYear !== 'all') {
      const targetYear = String(m.filterYear).trim();
      records = records.filter(r => {
        let yr = r.year;
        if (!yr && m.type !== 'incidents') {
          const parent = plrsMap.get(String(r.plrNo).toUpperCase());
          if (parent) yr = parent.year;
        }
        return String(yr || '').trim() === targetYear;
      });
    }

    // 6. Filter by search query
    if (m.searchQuery && m.searchQuery.trim()) {
      const q = m.searchQuery.toLowerCase().trim();
      if (m.type === 'incidents') {
        records = records.filter(r =>
          String(r.plrNo || '').toLowerCase().includes(q) ||
          String(r.incident || '').toLowerCase().includes(q) ||
          String(r.machine || '').toLowerCase().includes(q) ||
          String(r.dept || '').toLowerCase().includes(q) ||
          String(r.priority || '').toLowerCase().includes(q) ||
          String(r.status || '').toLowerCase().includes(q) ||
          String(r.year || '').includes(q) ||
          String(r.date || '').toLowerCase().includes(q)
        );
      } else {
        records = records.filter(r => {
          const parent = plrsMap.get(String(r.plrNo).toUpperCase());
          const parentMachine = parent ? parent.machine : '';
          return (
            String(r.plrNo || '').toLowerCase().includes(q) ||
            String(r.sNo || '').toLowerCase().includes(q) ||
            String(r.recommendation || '').toLowerCase().includes(q) ||
            String(r.actionBy || '').toLowerCase().includes(q) ||
            String(parentMachine).toLowerCase().includes(q) ||
            String(r.status || '').toLowerCase().includes(q) ||
            String(r.year || '').includes(q) ||
            String(r.date || '').toLowerCase().includes(q)
          );
        });
      }
    }

    return records;
  };

  portalApp.renderPlrDataModal = function (maintainFocus = false) {
    const s = getPlrState();
    if (!s.activePlrModal) return;
    const m = s.activePlrModal;
    let container = document.getElementById('plr-data-modal-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'plr-data-modal-container';
      document.body.appendChild(container);
    }

    const records = portalApp.getPlrModalFilteredRecords();
    const allRecords = m.allRecords || [];
    const plrsMap = getPlrsMap();
    const isIncidents = m.type === 'incidents';

    // Compute dimensional records that match current Machine, Priority, Dept, Year and Search (independent of status tab)
    let scopedRecords = allRecords;

    if (m.filterMachine && m.filterMachine !== 'all') {
      if (isIncidents) {
        scopedRecords = scopedRecords.filter(r => matchesMachine(r.machine, m.filterMachine));
      } else {
        scopedRecords = scopedRecords.filter(r => {
          const parent = plrsMap.get(String(r.plrNo).toUpperCase());
          return parent ? matchesMachine(parent.machine, m.filterMachine) : false;
        });
      }
    }

    if (m.filterPriority && m.filterPriority !== 'all') {
      const targetPri = m.filterPriority.toLowerCase().trim();
      if (isIncidents) {
        scopedRecords = scopedRecords.filter(r => (r.priority || '').toLowerCase().trim() === targetPri);
      } else {
        scopedRecords = scopedRecords.filter(r => {
          const parent = plrsMap.get(String(r.plrNo).toUpperCase());
          return parent ? (parent.priority || '').toLowerCase().trim() === targetPri : false;
        });
      }
    }

    if (m.filterDept && m.filterDept !== 'all') {
      if (isIncidents) {
        scopedRecords = scopedRecords.filter(r => matchesActionEntity(r.dept, m.filterDept));
      } else {
        scopedRecords = scopedRecords.filter(r => matchesActionEntity(r.actionBy, m.filterDept));
      }
    }

    if (m.filterYear && m.filterYear !== 'all') {
      const targetYear = String(m.filterYear).trim();
      scopedRecords = scopedRecords.filter(r => {
        let yr = r.year;
        if (!yr && !isIncidents) {
          const parent = plrsMap.get(String(r.plrNo).toUpperCase());
          if (parent) yr = parent.year;
        }
        return String(yr || '').trim() === targetYear;
      });
    }

    if (m.searchQuery && m.searchQuery.trim()) {
      const q = m.searchQuery.toLowerCase().trim();
      if (isIncidents) {
        scopedRecords = scopedRecords.filter(r =>
          String(r.plrNo || '').toLowerCase().includes(q) ||
          String(r.incident || '').toLowerCase().includes(q) ||
          String(r.machine || '').toLowerCase().includes(q) ||
          String(r.dept || '').toLowerCase().includes(q) ||
          String(r.priority || '').toLowerCase().includes(q) ||
          String(r.status || '').toLowerCase().includes(q) ||
          String(r.year || '').includes(q) ||
          String(r.date || '').toLowerCase().includes(q)
        );
      } else {
        scopedRecords = scopedRecords.filter(r => {
          const parent = plrsMap.get(String(r.plrNo).toUpperCase());
          const parentMachine = parent ? parent.machine : '';
          return (
            String(r.plrNo || '').toLowerCase().includes(q) ||
            String(r.sNo || '').toLowerCase().includes(q) ||
            String(r.recommendation || '').toLowerCase().includes(q) ||
            String(r.actionBy || '').toLowerCase().includes(q) ||
            String(parentMachine).toLowerCase().includes(q) ||
            String(r.status || '').toLowerCase().includes(q) ||
            String(r.year || '').includes(q) ||
            String(r.date || '').toLowerCase().includes(q)
          );
        });
      }
    }

    const totalCount = scopedRecords.length;
    const openCount = scopedRecords.filter(r => (r.status || '').toLowerCase().trim() === 'open').length;
    const closedCount = totalCount - openCount;
    const closurePct = totalCount > 0 ? Math.round((closedCount / totalCount) * 100) : 0;

    // Standardized Machines list with accurate counts from allRecords
    const machineList = [
      'STG # 4',
      'STG # 3',
      'Boiler # 1 (CFB-1)',
      'STG # 2',
      'Boiler # 2 (CFB-2)',
      'STG # 1',
      'Other Equipment'
    ];
    const availableMachines = [
      { id: 'all', label: `All Machines (${allRecords.length})` },
      ...machineList.map(name => {
        const count = allRecords.filter(r => {
          if (isIncidents) return matchesMachine(r.machine, name);
          const parent = plrsMap.get(String(r.plrNo).toUpperCase());
          return parent ? matchesMachine(parent.machine, name) : false;
        }).length;
        return { id: name, label: `${name} (${count})` };
      })
    ];

    // Standardized Department options with counts from allRecords
    const baseDepts = [
      'E&I',
      'Mechanical',
      'Operations',
      'PE',
      'FPCL-KE O/C',
      'KE',
      'Finance',
      'SCM',
      'Inspection',
      'Planning',
      'HSE',
      'BHGE',
      'HHI'
    ];
    const availableDepts = [
      { id: 'all', label: `All Departments (${allRecords.length})` },
      ...baseDepts.map(deptName => {
        const count = allRecords.filter(r => {
          return matchesActionEntity(isIncidents ? r.dept : r.actionBy, deptName);
        }).length;
        return { id: deptName, label: `${deptName} (${count})` };
      }).filter(d => d.id === 'all' || d.label.includes('('))
    ];

    // Priority options with counts
    const priorityList = ['Critical', 'High', 'Medium', 'Low'];
    const availablePriorities = [
      { id: 'all', label: `All Priorities (${allRecords.length})` },
      ...priorityList.map(pri => {
        const count = allRecords.filter(r => {
          if (isIncidents) return (r.priority || '').toLowerCase().trim() === pri.toLowerCase();
          const parent = plrsMap.get(String(r.plrNo).toUpperCase());
          return parent ? (parent.priority || '').toLowerCase().trim() === pri.toLowerCase() : false;
        }).length;
        return { id: pri, label: `${pri} (${count})` };
      })
    ];

    // Year options with counts
    const yearList = ['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017'];
    const availableYears = [
      { id: 'all', label: `All Years (${allRecords.length})` },
      ...yearList.map(yr => {
        const count = allRecords.filter(r => {
          let y = r.year;
          if (!y && !isIncidents) {
            const parent = plrsMap.get(String(r.plrNo).toUpperCase());
            if (parent) y = parent.year;
          }
          return String(y || '').trim() === yr;
        }).length;
        return { id: yr, label: `${yr} (${count})` };
      })
    ];

    // Active filters tracking
    const activeFilters = [];
    if (m.activeStatusTab && m.activeStatusTab !== 'all') {
      activeFilters.push({
        label: `Status: ${m.activeStatusTab}`,
        clearCode: "portalApp.setPlrDataModalStatusTab('all')"
      });
    }
    if (m.filterMachine && m.filterMachine !== 'all') {
      activeFilters.push({
        label: `Machine: ${m.filterMachine}`,
        clearCode: "portalApp.setPlrDataModalMachine('all')"
      });
    }
    if (m.filterDept && m.filterDept !== 'all') {
      activeFilters.push({
        label: `Dept: ${m.filterDept}`,
        clearCode: "portalApp.setPlrDataModalDept('all')"
      });
    }
    if (m.filterPriority && m.filterPriority !== 'all') {
      activeFilters.push({
        label: `Priority: ${m.filterPriority}`,
        clearCode: "portalApp.setPlrDataModalPriority('all')"
      });
    }
    if (m.filterYear && m.filterYear !== 'all') {
      activeFilters.push({
        label: `Year: ${m.filterYear}`,
        clearCode: "portalApp.setPlrDataModalYear('all')"
      });
    }
    if (m.searchQuery && m.searchQuery.trim()) {
      activeFilters.push({
        label: `Search: "${m.searchQuery.trim()}"`,
        clearCode: "portalApp.filterPlrDataModalSearch('')"
      });
    }

    container.innerHTML = `
      <div class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6" style="pointer-events: auto;" onclick="if(event.target === this) (window.portalApp || portalApp).closePlrDataModal()">
        <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          <!-- Modal Header (Corporate Executive Styled) -->
          <div class="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="w-10 h-10 rounded-xl ${isIncidents ? 'bg-[#2E6DA4]' : 'bg-[#047857]'} text-white flex items-center justify-center shadow-sm shrink-0">
                <i data-lucide="${isIncidents ? 'cpu' : 'clipboard-check'}" class="w-5 h-5"></i>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">${m.title}</h3>
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${isIncidents ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'} shrink-0 font-mono">
                    ${records.length} of ${allRecords.length} ${isIncidents ? 'Incidents' : 'Recs'}
                  </span>
                  ${activeFilters.length > 0 ? `
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      ${activeFilters.length} Active ${activeFilters.length === 1 ? 'Filter' : 'Filters'}
                    </span>
                  ` : ''}
                </div>
                <p class="text-xs text-slate-500 mt-0.5 truncate">${m.subtitle}</p>
              </div>
            </div>
            
            <div class="flex items-center gap-2 shrink-0">
              ${activeFilters.length > 0 ? `
                <button
                  onclick="portalApp.resetPlrDataModalFilters()"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 shadow-2xs cursor-pointer transition-colors"
                  title="Reset all filters back to default"
                >
                  <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                  <span class="hidden sm:inline">Reset Filters</span>
                </button>
              ` : ''}
              <button
                onclick="portalApp.exportPlrModalCSV()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs cursor-pointer transition-colors"
                title="Export filtered records to CSV"
              >
                <i data-lucide="download" class="w-3.5 h-3.5 text-[#2E6DA4]"></i>
                <span class="hidden sm:inline">Export CSV</span>
              </button>
              <button
                onclick="portalApp.closePlrDataModal()"
                class="w-8 h-8 rounded-xl bg-white hover:bg-slate-200 text-slate-400 hover:text-slate-700 border border-slate-300 flex items-center justify-center cursor-pointer transition-colors"
                title="Close (Esc)"
              >
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <!-- Metrics & Filter Controls Bar -->
          <div class="px-4 sm:px-5 py-3 border-b border-slate-200 bg-white space-y-2.5">
            <!-- Top Row: Metrics & Status Toggle -->
            <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <!-- Summary KPIs -->
              <div class="flex items-center gap-2.5 flex-wrap text-xs">
                <span class="font-bold text-slate-600">Total in Scope: <strong class="text-slate-900 font-mono text-sm">${totalCount}</strong></span>
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  ${openCount} Open
                </span>
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  ${closedCount} Closed
                </span>
                <span class="text-xs font-bold ${isIncidents ? 'text-[#2E6DA4] bg-blue-50 border-blue-200' : 'text-emerald-800 bg-emerald-50 border-emerald-200'} font-mono px-2 py-0.5 rounded border">
                  ${closurePct}% Resolved
                </span>
              </div>

              <!-- Status Toggle Buttons -->
              <div class="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs shrink-0 self-start md:self-auto">
                <button
                  onclick="portalApp.setPlrDataModalStatusTab('all')"
                  class="px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${m.activeStatusTab === 'all' ? (isIncidents ? 'bg-[#2E6DA4] text-white shadow-2xs' : 'bg-[#047857] text-white shadow-2xs') : 'text-slate-600 hover:text-slate-900'}"
                >
                  All (${totalCount})
                </button>
                <button
                  onclick="portalApp.setPlrDataModalStatusTab('Open')"
                  class="px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${m.activeStatusTab.toLowerCase() === 'open' ? 'bg-[#B91C1C] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
                >
                  Open (${openCount})
                </button>
                <button
                  onclick="portalApp.setPlrDataModalStatusTab('Closed')"
                  class="px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${m.activeStatusTab.toLowerCase() === 'closed' ? 'bg-[#047857] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
                >
                  Closed (${closedCount})
                </button>
              </div>
            </div>

            <!-- Bottom Row: Filter Dropdowns & Search Box -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1 border-t border-slate-100">
              <!-- Machine Filter -->
              <div>
                <select
                  onchange="portalApp.setPlrDataModalMachine(this.value)"
                  class="w-full text-xs py-1.5 px-2 rounded-lg border ${m.filterMachine !== 'all' ? 'border-[#2E6DA4] bg-blue-50/60 font-bold text-[#1e40af]' : 'border-slate-300 bg-slate-50 text-slate-700'} focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2E6DA4] transition-colors cursor-pointer"
                  title="Filter by Machine / Equipment Asset"
                >
                  ${availableMachines.map(opt => `
                    <option value="${opt.id}" ${m.filterMachine === opt.id ? 'selected' : ''}>${opt.label}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Department Filter -->
              <div>
                <select
                  onchange="portalApp.setPlrDataModalDept(this.value)"
                  class="w-full text-xs py-1.5 px-2 rounded-lg border ${m.filterDept !== 'all' ? 'border-[#2E6DA4] bg-blue-50/60 font-bold text-[#1e40af]' : 'border-slate-300 bg-slate-50 text-slate-700'} focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2E6DA4] transition-colors cursor-pointer"
                  title="Filter by Department / Action Entity"
                >
                  ${availableDepts.map(opt => `
                    <option value="${opt.id}" ${m.filterDept === opt.id ? 'selected' : ''}>${opt.label}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Priority Filter -->
              <div>
                <select
                  onchange="portalApp.setPlrDataModalPriority(this.value)"
                  class="w-full text-xs py-1.5 px-2 rounded-lg border ${m.filterPriority !== 'all' ? 'border-[#2E6DA4] bg-blue-50/60 font-bold text-[#1e40af]' : 'border-slate-300 bg-slate-50 text-slate-700'} focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2E6DA4] transition-colors cursor-pointer"
                  title="Filter by Priority"
                >
                  ${availablePriorities.map(opt => `
                    <option value="${opt.id}" ${m.filterPriority === opt.id ? 'selected' : ''}>${opt.label}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Year Filter -->
              <div>
                <select
                  onchange="portalApp.setPlrDataModalYear(this.value)"
                  class="w-full text-xs py-1.5 px-2 rounded-lg border ${m.filterYear !== 'all' ? 'border-[#2E6DA4] bg-blue-50/60 font-bold text-[#1e40af]' : 'border-slate-300 bg-slate-50 text-slate-700'} focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2E6DA4] transition-colors cursor-pointer"
                  title="Filter by Year"
                >
                  ${availableYears.map(opt => `
                    <option value="${opt.id}" ${m.filterYear === opt.id ? 'selected' : ''}>${opt.label}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Search Box -->
              <div class="col-span-2 sm:col-span-1 relative">
                <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="search" class="w-3.5 h-3.5"></i>
                </div>
                <input
                  id="plr-modal-search-input"
                  type="text"
                  value="${m.searchQuery || ''}"
                  oninput="portalApp.filterPlrDataModalSearch(this.value)"
                  placeholder="Search records..."
                  class="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border ${m.searchQuery ? 'border-[#2E6DA4] bg-blue-50/40' : 'border-slate-300 bg-slate-50'} focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2E6DA4]"
                />
                ${m.searchQuery ? `
                  <button onclick="portalApp.filterPlrDataModalSearch('')" class="absolute right-2 top-2 text-slate-400 hover:text-slate-700 cursor-pointer" title="Clear search">
                    <i data-lucide="x" class="w-3 h-3"></i>
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Active Filters Chip Row -->
            ${activeFilters.length > 0 ? `
              <div class="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filtered by:</span>
                ${activeFilters.map(f => `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                    <span>${f.label}</span>
                    <button onclick="${f.clearCode}" class="hover:text-red-600 cursor-pointer p-0.5 rounded-full hover:bg-blue-100" title="Remove this filter">
                      <i data-lucide="x" class="w-2.5 h-2.5"></i>
                    </button>
                  </span>
                `).join('')}
                <button
                  onclick="portalApp.resetPlrDataModalFilters()"
                  class="text-[11px] text-[#2E6DA4] hover:underline font-bold ml-1 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            ` : ''}
          </div>

          <!-- Table Content -->
          <div class="overflow-y-auto flex-1 max-h-[62vh]">
            ${records.length === 0 ? `
              <div class="py-16 px-4 text-center text-slate-500 space-y-3">
                <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <i data-lucide="filter-x" class="w-6 h-6"></i>
                </div>
                <div>
                  <p class="text-sm font-bold text-slate-800">No records match your active filter criteria</p>
                  <p class="text-xs text-slate-400 mt-1">Try adjusting the machine, department, status, priority, or search term.</p>
                </div>
                <button
                  onclick="portalApp.resetPlrDataModalFilters()"
                  class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#2E6DA4] hover:bg-[#235885] transition-colors cursor-pointer shadow-xs"
                >
                  <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                  <span>Reset All Filters</span>
                </button>
              </div>
            ` : isIncidents ? `
              <table class="w-full text-left text-xs border-collapse">
                <thead class="sticky top-0 bg-slate-100/95 backdrop-blur-xs z-10 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th class="py-2.5 px-3 w-12 text-center">#</th>
                    <th class="py-2.5 px-3 w-20 font-mono">PLR #</th>
                    <th class="py-2.5 px-3 w-24">Date</th>
                    <th class="py-2.5 px-3">Loss Narrative & Incident Description</th>
                    <th class="py-2.5 px-3 w-32">Machine</th>
                    <th class="py-2.5 px-3 w-24">Entity</th>
                    <th class="py-2.5 px-3 w-20">Priority</th>
                    <th class="py-2.5 px-3 w-24 text-center">Status</th>
                    <th class="py-2.5 px-3 w-20 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-800">
                  ${records.map((r, idx) => {
                    const isOpen = (r.status || '').toLowerCase() === 'open';
                    const isHigh = (r.priority || '').toLowerCase() === 'high' || (r.priority || '').toLowerCase() === 'critical';
                    return `
                      <tr class="hover:bg-slate-50/80 transition-colors group">
                        <td class="py-2.5 px-3 font-mono text-center text-slate-400 text-[11px]">${idx + 1}</td>
                        <td class="py-2.5 px-3 font-mono font-bold text-[#2E6DA4] whitespace-nowrap">
                          <button
                            onclick="portalApp.openPlrInspectionModal(${r.plrNo})"
                            class="hover:underline cursor-pointer flex items-center gap-1 font-bold"
                            title="Inspect PLR #${r.plrNo} incident and recommendations"
                          >
                            <span>#${r.plrNo}</span>
                          </button>
                        </td>
                        <td class="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                          ${r.date || ''} <span class="text-slate-400">(${r.year})</span>
                        </td>
                        <td class="py-2.5 px-3 max-w-md">
                          <div class="line-clamp-2 text-slate-800 font-medium leading-relaxed" title="${(r.incident || '').replace(/"/g, '&quot;')}">
                            ${r.incident}
                          </div>
                        </td>
                        <td class="py-2.5 px-3 whitespace-nowrap">
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            <i data-lucide="cpu" class="w-3 h-3 text-[#2E6DA4]"></i>
                            <span>${r.machine}</span>
                          </span>
                        </td>
                        <td class="py-2.5 px-3 whitespace-nowrap">
                          <span class="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            ${r.dept || 'KE'}
                          </span>
                        </td>
                        <td class="py-2.5 px-3 whitespace-nowrap">
                          <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${isHigh ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}">
                            ${r.priority || 'Low'}
                          </span>
                        </td>
                        <td class="py-2.5 px-3 text-center whitespace-nowrap">
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isOpen ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }">
                            <span class="w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-rose-500' : 'bg-emerald-500'}"></span>
                            ${r.status}
                          </span>
                        </td>
                        <td class="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            onclick="portalApp.openPlrInspectionModal(${r.plrNo})"
                            class="px-2 py-1 rounded-md text-[11px] font-bold text-[#2E6DA4] bg-blue-50/70 hover:bg-blue-100 border border-blue-200 cursor-pointer inline-flex items-center gap-1 transition-colors"
                          >
                            <span>View</span>
                            <i data-lucide="chevron-right" class="w-3 h-3"></i>
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            ` : `
              <table class="w-full text-left text-xs border-collapse">
                <thead class="sticky top-0 bg-slate-100/95 backdrop-blur-xs z-10 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th class="py-2.5 px-3 w-12 text-center">#</th>
                    <th class="py-2.5 px-3 w-28 font-mono">Rec Ref</th>
                    <th class="py-2.5 px-3 w-32">Action Department</th>
                    <th class="py-2.5 px-3 w-32">Machine Asset</th>
                    <th class="py-2.5 px-3">Recommendation Details</th>
                    <th class="py-2.5 px-3 w-24">Parent PLR</th>
                    <th class="py-2.5 px-3 w-24">Date</th>
                    <th class="py-2.5 px-3 w-28 text-center">Status (Click to Toggle)</th>
                    <th class="py-2.5 px-3 w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-800">
                  ${records.map((r, idx) => {
                    const isOpen = (r.status || '').toLowerCase() === 'open';
                    const parentPlr = plrsMap.get(String(r.plrNo).toUpperCase());
                    const machineName = parentPlr ? parentPlr.machine : '—';
                    return `
                      <tr class="hover:bg-slate-50/80 transition-colors group">
                        <td class="py-2.5 px-3 font-mono text-center text-slate-400 text-[11px]">${idx + 1}</td>
                        <td class="py-2.5 px-3 font-mono font-bold text-[#047857] whitespace-nowrap">
                          <button
                            onclick="portalApp.openPlrInspectionModal(${r.plrNo})"
                            class="hover:underline cursor-pointer flex items-center gap-1 font-bold"
                            title="Inspect recommendation and linked PLR #${r.plrNo}"
                          >
                            <span>#${r.plrNo}-R${r.sNo}</span>
                          </button>
                        </td>
                        <td class="py-2.5 px-3 whitespace-nowrap">
                          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            <span class="w-1.5 h-1.5 rounded-full bg-[#2E6DA4]"></span>
                            <span>${normalizeActionEntity(r.actionBy)}</span>
                          </span>
                        </td>
                        <td class="py-2.5 px-3 whitespace-nowrap">
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            <i data-lucide="cpu" class="w-3 h-3 text-[#2E6DA4]"></i>
                            <span>${machineName}</span>
                          </span>
                        </td>
                        <td class="py-2.5 px-3 max-w-lg">
                          <div class="line-clamp-2 text-slate-800 font-medium leading-relaxed" title="${(r.recommendation || '').replace(/"/g, '&quot;')}">
                            ${r.recommendation}
                          </div>
                        </td>
                        <td class="py-2.5 px-3 whitespace-nowrap">
                          <button
                            onclick="portalApp.openPlrInspectionModal(${r.plrNo})"
                            class="text-[11px] font-mono font-bold text-[#2E6DA4] hover:underline cursor-pointer"
                            title="View Incident PLR #${r.plrNo}"
                          >
                            PLR #${r.plrNo}
                          </button>
                        </td>
                        <td class="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                          ${r.date || ''} <span class="text-slate-400">(${r.year})</span>
                        </td>
                        <td class="py-2.5 px-3 text-center whitespace-nowrap">
                          <button
                            onclick="portalApp.toggleRecStatusFromModal(${r.sNo})"
                            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
                              isOpen ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }"
                            title="Click to toggle status (Open / Closed)"
                          >
                            <span class="w-2 h-2 rounded-full ${isOpen ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}"></span>
                            <span>${r.status}</span>
                            <i data-lucide="refresh-cw" class="w-3 h-3 text-slate-400 group-hover:text-slate-600"></i>
                          </button>
                        </td>
                        <td class="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                          <button
                            onclick="portalApp.openEditRecommendationModal(${r.sNo})"
                            class="px-2 py-1 rounded-md text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer inline-flex items-center gap-1 transition-colors"
                            title="Edit recommendation details"
                          >
                            <i data-lucide="edit-3" class="w-3 h-3 text-slate-600"></i>
                            <span>Edit</span>
                          </button>
                          <button
                            onclick="portalApp.openPlrInspectionModal(${r.plrNo})"
                            class="px-2 py-1 rounded-md text-[11px] font-bold text-[#2E6DA4] bg-blue-50/70 hover:bg-blue-100 border border-blue-200 cursor-pointer inline-flex items-center gap-1 transition-colors"
                            title="Inspect Parent Incident PLR #${r.plrNo}"
                          >
                            <span>PLR</span>
                            <i data-lucide="chevron-right" class="w-3 h-3"></i>
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            `}
          </div>

          <!-- Modal Footer -->
          <div class="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>Showing <strong class="text-slate-800">${records.length}</strong> of <strong class="text-slate-800">${totalCount}</strong> matching records (${allRecords.length} total in catalog)</span>
            <div class="flex items-center gap-2">
              <button
                onclick="portalApp.exportPlrModalCSV()"
                class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              >
                Export CSV
              </button>
              <button
                onclick="portalApp.closePlrDataModal()"
                class="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#2E6DA4] hover:bg-[#235885] transition-colors cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    if (maintainFocus) {
      const input = document.getElementById('plr-modal-search-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  };

  /**
   * Export Filtered Modal Data to CSV
   */
  portalApp.exportPlrModalCSV = function () {
    const s = getPlrState();
    if (!s.activePlrModal) return;
    const m = s.activePlrModal;
    const records = portalApp.getPlrModalFilteredRecords();
    let csv = '';
    let filename = `FPCL_PLR_${m.type}_drilldown.csv`;

    if (m.type === 'incidents') {
      csv = 'S_NO,PLR_NO,YEAR,DATE,INCIDENT_DESCRIPTION,MACHINE,ACTION_ENTITY,PRIORITY,STATUS\n';
      records.forEach((r, idx) => {
        const row = [
          idx + 1,
          r.plrNo,
          r.year,
          `"${(r.date || '').replace(/"/g, '""')}"`,
          `"${(r.incident || '').replace(/"/g, '""')}"`,
          `"${(r.machine || '').replace(/"/g, '""')}"`,
          `"${(r.dept || '').replace(/"/g, '""')}"`,
          `"${(r.priority || '').replace(/"/g, '""')}"`,
          r.status
        ];
        csv += row.join(',') + '\n';
      });
    } else {
      csv = 'S_NO,PLR_NO,REC_NO,YEAR,DATE,ACTION_DEPARTMENT,RECOMMENDATION_DETAILS,STATUS\n';
      records.forEach((r, idx) => {
        const row = [
          idx + 1,
          r.plrNo,
          r.sNo,
          r.year,
          `"${(r.date || '').replace(/"/g, '""')}"`,
          `"${(r.actionBy || '').replace(/"/g, '""')}"`,
          `"${(r.recommendation || '').replace(/"/g, '""')}"`,
          r.status
        ];
        csv += row.join(',') + '\n';
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  portalApp.switchTabAndFilterPlr = function (plrNo) {
    portalApp.closePlrInspectionModal();
    const s = getPlrState();
    s.activeTab = 'recommendations';
    s.recSearchQuery = String(plrNo);
    s.recPage = 1;
    portalApp.renderPlrSuite();
    const el = document.getElementById('plr-table-toolbar-container');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Controllers & Filter Handlers
   */
  portalApp.setPlrTab = function (tab) {
    const s = getPlrState();
    s.activeTab = tab;
    portalApp.renderPlrSuite();
  };

  portalApp.setDeptBarViewMode = function (mode) {
    const s = getPlrState();
    s.deptBarViewMode = mode;
    portalApp.renderDeptBarChart();
    portalApp.renderPlrSuite();
  };

  portalApp.setResolutionMode = function (mode) {
    const s = getPlrState();
    s.resolutionMode = mode;
    portalApp.renderPlrSuite();
  };

  portalApp.setRecChartMode = function (mode) {
    const s = getPlrState();
    s.recChartMode = mode;
    portalApp.renderDeptBarChart();
    const btnTrend = document.getElementById('plr-rec-mode-trend');
    const btnStacked = document.getElementById('plr-rec-mode-stacked');
    const btnSide = document.getElementById('plr-rec-mode-side-by-side');
    if (btnTrend && btnStacked && btnSide) {
      btnTrend.className = `px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${mode === 'trend' ? 'bg-[#2E6DA4] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`;
      btnStacked.className = `px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${mode === 'stacked' ? 'bg-[#2E6DA4] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`;
      btnSide.className = `px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${mode === 'side-by-side' ? 'bg-[#2E6DA4] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`;
    }
  };

  portalApp.filterPlrByMachine = function (machine) {
    const s = getPlrState();
    s.selectedMachine = s.selectedMachine === machine ? 'all' : machine;
    s.page = 1;
    portalApp.renderPlrSuite();
  };

  portalApp.filterPlrByDept = function (dept) {
    const s = getPlrState();
    s.selectedDept = dept;
    s.page = 1;
    portalApp.renderTableSection();
  };

  portalApp.filterPlrByStatus = function (status) {
    const s = getPlrState();
    s.activeTab = 'incidents';
    s.selectedStatus = s.selectedStatus === status ? 'all' : status;
    s.page = 1;
    portalApp.renderPlrSuite();
    const el = document.getElementById('plr-table-toolbar-container');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  portalApp.searchPlr = function (val) {
    const s = getPlrState();
    s.searchQuery = val;
    s.page = 1;
    portalApp.renderTableSection();
  };

  portalApp.setPlrPage = function (page) {
    const s = getPlrState();
    s.page = page;
    portalApp.renderTableSection();
  };

  portalApp.filterRecByDeptDirect = function (dept, isToggle = false) {
    const s = getPlrState();
    s.activeTab = 'recommendations';
    if (isToggle) {
      s.recSelectedEntity = s.recSelectedEntity === dept ? 'all' : dept;
    } else {
      s.recSelectedEntity = dept || 'all';
    }
    s.selectedEntity = s.recSelectedEntity;
    s.recPage = 1;
    s.page = 1;
    portalApp.renderPlrSuite();
    const el = document.getElementById('plr-table-toolbar-container');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  portalApp.filterRecByStatusDirect = function (status) {
    const s = getPlrState();
    s.activeTab = 'recommendations';
    s.recSelectedStatus = s.recSelectedStatus === status ? 'all' : status;
    s.recPage = 1;
    portalApp.renderPlrSuite();
    const el = document.getElementById('plr-table-toolbar-container');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  portalApp.searchRec = function (val) {
    const s = getPlrState();
    s.recSearchQuery = val;
    s.recPage = 1;
    portalApp.renderTableSection();
  };

  portalApp.setRecPage = function (page) {
    const s = getPlrState();
    s.recPage = page;
    portalApp.renderTableSection();
  };

  portalApp.resetPlrFilters = function () {
    window.portalApp.state.plrState = getDefaultPlrState();
    portalApp.renderPlrSuite();
    if (portalApp.showToast) {
      portalApp.showToast('Filters Reset', 'All PLR diagnostic filters have been restored.', 'info');
    }
  };

  portalApp.exportPlrCSV = function () {
    const s = getPlrState();
    let csv = '';
    let filename = 'FPCL_PLR_Export.csv';

    if (s.activeTab === 'incidents') {
      const data = getPlrData();
      csv = 'S_NO,PLR_NO,YEAR,DATE,INCIDENT,MACHINE,PRIORITY,ACTION_ENTITY,STATUS\n';
      data.forEach(d => {
        const row = [
          d.sNo,
          d.plrNo,
          d.year,
          `"${(d.date || '').replace(/"/g, '""')}"`,
          `"${(d.incident || '').replace(/"/g, '""')}"`,
          `"${(d.machine || '').replace(/"/g, '""')}"`,
          `"${(d.priority || '').replace(/"/g, '""')}"`,
          `"${(d.dept || '').replace(/"/g, '""')}"`,
          d.status
        ];
        csv += row.join(',') + '\n';
      });
      filename = 'FPCL_PLR_Incidents_233.csv';
    } else {
      const data = getPlrRecs();
      csv = 'S_NO,PLR_NO,YEAR,DATE,RECOMMENDATION,ACTION_ENTITY,STATUS\n';
      data.forEach(d => {
        const row = [
          d.sNo,
          d.plrNo,
          d.year,
          `"${(d.date || '').replace(/"/g, '""')}"`,
          `"${(d.recommendation || '').replace(/"/g, '""')}"`,
          `"${(d.actionBy || '').replace(/"/g, '""')}"`,
          d.status
        ];
        csv += row.join(',') + '\n';
      });
      filename = 'FPCL_PLR_Recommendations_534.csv';
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /**
   * =========================================================================
   * GOOGLE SHEET RECOMMENDATIONS (COLUMN E) SYNC & DYNAMIC CRUD CONTROLLERS
   * When data is changed, added, or open/close status is changed, all dashboard
   * metrics, charts, bento grids, and overview rollups immediately reflect!
   * =========================================================================
   */

  portalApp.saveAndReflectRecChanges = function (title, msg) {
    try {
      localStorage.setItem('FPCL_PLR_RECOMMENDATIONS_UPDATED', JSON.stringify(window.FPCL_PLR_RECOMMENDATIONS));
    } catch (err) {
      console.warn('Could not persist recommendations to localStorage:', err);
    }
    portalApp.syncPlrStatsToOverview();
    portalApp.renderPlrSuite();

    if (title && portalApp.showToast) {
      portalApp.showToast(title, msg || 'Dashboard metrics and charts updated.', 'success');
    }
  };

  /**
   * Toggle status between Open and Closed directly from table or modal
   */
  portalApp.toggleRecommendationStatus = function (sNo, activeInspectionPlrNo) {
    const recs = getPlrRecs();
    const item = recs.find(r => r.sNo === sNo);
    if (!item) return;

    const oldStatus = item.status;
    const isNowOpen = (oldStatus || '').toLowerCase() === 'closed';
    item.status = isNowOpen ? 'Open' : 'Closed';

    portalApp.saveAndReflectRecChanges(
      'Status Updated',
      `Recommendation #${item.sNo} (PLR #${item.plrNo}) changed from ${oldStatus} to ${item.status}.`
    );

    // Keep inspection modal open and synchronized if user toggled from inside it
    if (activeInspectionPlrNo !== undefined && activeInspectionPlrNo !== null) {
      portalApp.openPlrInspectionModal(activeInspectionPlrNo);
    }
  };

  /**
   * Close Action / Sync Modal
   */
  portalApp.closeActionModal = function () {
    const container = document.getElementById('plr-action-modal-container');
    if (container) container.innerHTML = '';
  };

  /**
   * Open Modal to Add a New Recommendation (Picked into Column E: Recommendations)
   */
  portalApp.openAddRecommendationModal = function (prefillPlrNo) {
    const container = document.getElementById('plr-action-modal-container');
    if (!container) return;

    const recs = getPlrRecs();
    const nextSNo = recs.reduce((max, r) => Math.max(max, Number(r.sNo) || 0), 0) + 1;
    const plrs = getPlrData();

    // Default prefilled values
    const defPlr = prefillPlrNo || (plrs.length > 0 ? plrs[0].plrNo : 233);
    const parentPlr = plrs.find(p => String(p.plrNo) === String(defPlr));
    const defYear = parentPlr ? parentPlr.year : 2025;
    const defDate = parentPlr ? parentPlr.date : new Date().toLocaleDateString('en-GB');
    const defDept = parentPlr ? parentPlr.dept : 'E&I';

    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
          
          <!-- Header -->
          <div class="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <i data-lucide="plus-circle" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900">Add New Action Recommendation</h3>
                <p class="text-xs text-emerald-800 font-medium">Mapped directly to Google Sheet Tab: <strong class="font-bold">Recommendations</strong> &bull; <strong class="font-bold">Column E ("Recommendations")</strong></p>
              </div>
            </div>
            <button onclick="portalApp.closeActionModal()" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Form Body -->
          <div class="p-5 overflow-y-auto space-y-4 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">S_No (Col A)</label>
                <input
                  type="number"
                  id="plr-add-sno"
                  value="${nextSNo}"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-mono text-slate-800 font-bold focus:outline-none focus:border-emerald-600"
                  readonly
                />
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">PLR # (Col B)</label>
                <input
                  type="number"
                  id="plr-add-plrno"
                  value="${defPlr}"
                  placeholder="e.g. 214"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-900 font-bold focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Year (Col C)</label>
                <input
                  type="number"
                  id="plr-add-year"
                  value="${defYear}"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-900 font-bold focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Date (Col D)</label>
                <input
                  type="text"
                  id="plr-add-date"
                  value="${defDate}"
                  placeholder="e.g. 03/02/2025"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Action Entity / Dept (Col F)</label>
                <input
                  type="text"
                  id="plr-add-actionby"
                  value="${defDept}"
                  placeholder="e.g. Mechanical, E&I, OPS-PSG"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            <!-- Column E: Recommendations Field -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Recommendation Description (Column E - Recommendations) *</span>
                </label>
                <span class="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Required</span>
              </div>
              <textarea
                id="plr-add-rec"
                rows="4"
                placeholder="Enter detailed corrective action / maintenance recommendation as recorded in Column E of the Recommendations tab..."
                class="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 leading-relaxed font-normal"
                required
              ></textarea>
            </div>

            <!-- Column G: Status Field -->
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Status (Col G)</label>
              <div class="grid grid-cols-2 gap-3">
                <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input type="radio" name="plr-add-status" value="Open" checked class="text-rose-600 focus:ring-rose-500" />
                  <span class="flex items-center gap-1.5 font-bold text-rose-700 text-xs">
                    <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                    Open
                  </span>
                </label>
                <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input type="radio" name="plr-add-status" value="Closed" class="text-emerald-600 focus:ring-emerald-500" />
                  <span class="flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                    <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Closed
                  </span>
                </label>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <button
              type="button"
              onclick="portalApp.closeActionModal()"
              class="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 shadow-xs cursor-pointer hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onclick="portalApp.saveNewRecommendation()"
              class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Save Recommendation</span>
            </button>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  };

  /**
   * Save Newly Added Recommendation and Reflect on Dashboard
   */
  portalApp.saveNewRecommendation = function () {
    const snoEl = document.getElementById('plr-add-sno');
    const plrnoEl = document.getElementById('plr-add-plrno');
    const yearEl = document.getElementById('plr-add-year');
    const dateEl = document.getElementById('plr-add-date');
    const actionbyEl = document.getElementById('plr-add-actionby');
    const recEl = document.getElementById('plr-add-rec');
    const statusRadio = document.querySelector('input[name="plr-add-status"]:checked');

    if (!recEl || !recEl.value.trim()) {
      alert('Please provide the Recommendation text (Column E).');
      if (recEl) recEl.focus();
      return;
    }

    const sNo = snoEl ? parseInt(snoEl.value, 10) : Date.now();
    const plrNo = plrnoEl ? parseInt(plrnoEl.value, 10) : 0;
    const year = yearEl && yearEl.value ? parseInt(yearEl.value, 10) : 2025;
    const date = dateEl ? dateEl.value.trim() : '';
    let actionBy = actionbyEl && actionbyEl.value.trim() ? actionbyEl.value.trim() : 'Unassigned';
    if (/plant\s*engineering/i.test(actionBy)) {
      actionBy = actionBy
        .replace(/Plant\s+Engineering\s*\(\s*PE\s*\)/gi, 'PE')
        .replace(/PE\s*\(\s*Plant\s+Engineering\s*\)/gi, 'PE')
        .replace(/Plant\s+Engineering/gi, 'PE')
        .trim();
    }
    const recommendation = recEl.value.trim();
    const status = statusRadio ? statusRadio.value : 'Open';

    const newItem = {
      sNo,
      plrNo,
      year,
      date,
      recommendation,
      actionBy,
      status,
      category: actionBy
    };

    window.FPCL_PLR_RECOMMENDATIONS.unshift(newItem);
    portalApp.closeActionModal();

    portalApp.saveAndReflectRecChanges(
      'Recommendation Added',
      `New recommendation #${sNo} for PLR #${plrNo} added with status "${status}". Dashboard metrics and charts updated.`
    );
  };

  /**
   * Open Edit Recommendation Modal
   */
  portalApp.openEditRecommendationModal = function (sNo) {
    const container = document.getElementById('plr-action-modal-container');
    if (!container) return;

    const recs = getPlrRecs();
    const item = recs.find(r => r.sNo === sNo);
    if (!item) return;

    const isOpen = (item.status || '').toLowerCase() === 'open';

    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
          
          <!-- Header -->
          <div class="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-sky-50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-[#2E6DA4] text-white flex items-center justify-center shadow-xs">
                <i data-lucide="edit-3" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900">Edit Recommendation #${item.sNo}</h3>
                <p class="text-xs text-[#2E6DA4] font-medium">PLR #${item.plrNo} &bull; Tab: Recommendations &bull; Column E ("Recommendations")</p>
              </div>
            </div>
            <button onclick="portalApp.closeActionModal()" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="p-5 overflow-y-auto space-y-4 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">S_No (Col A)</label>
                <input
                  type="number"
                  value="${item.sNo}"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-mono text-slate-600 font-bold"
                  disabled
                />
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">PLR # (Col B)</label>
                <input
                  type="number"
                  id="plr-edit-plrno"
                  value="${item.plrNo}"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-900 font-bold focus:outline-none focus:border-[#2E6DA4] focus:ring-1 focus:ring-[#2E6DA4]"
                  required
                />
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Year (Col C)</label>
                <input
                  type="number"
                  id="plr-edit-year"
                  value="${item.year || 2025}"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-900 font-bold focus:outline-none focus:border-[#2E6DA4] focus:ring-1 focus:ring-[#2E6DA4]"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Date (Col D)</label>
                <input
                  type="text"
                  id="plr-edit-date"
                  value="${item.date || ''}"
                  placeholder="e.g. 03/02/2025"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-900 focus:outline-none focus:border-[#2E6DA4] focus:ring-1 focus:ring-[#2E6DA4]"
                />
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Action Entity / Dept (Col F)</label>
                <input
                  type="text"
                  id="plr-edit-actionby"
                  value="${item.actionBy || 'Unassigned'}"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none focus:border-[#2E6DA4] focus:ring-1 focus:ring-[#2E6DA4]"
                />
              </div>
            </div>

            <!-- Column E Recommendation Textarea -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-[#2E6DA4]"></span>
                  <span>Recommendation Description (Column E - Recommendations) *</span>
                </label>
                <span class="text-[10px] text-blue-800 font-mono font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Col E</span>
              </div>
              <textarea
                id="plr-edit-rec"
                rows="4"
                class="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:border-[#2E6DA4] focus:ring-1 focus:ring-[#2E6DA4] leading-relaxed font-normal"
                required
              >${item.recommendation || ''}</textarea>
            </div>

            <!-- Column G Status Options -->
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Status (Col G)</label>
              <div class="grid grid-cols-2 gap-3">
                <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input type="radio" name="plr-edit-status" value="Open" ${isOpen ? 'checked' : ''} class="text-rose-600 focus:ring-rose-500" />
                  <span class="flex items-center gap-1.5 font-bold text-rose-700 text-xs">
                    <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                    Open
                  </span>
                </label>
                <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input type="radio" name="plr-edit-status" value="Closed" ${!isOpen ? 'checked' : ''} class="text-emerald-600 focus:ring-emerald-500" />
                  <span class="flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                    <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Closed
                  </span>
                </label>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <button
              type="button"
              onclick="portalApp.closeActionModal()"
              class="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 shadow-xs cursor-pointer hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onclick="portalApp.saveEditRecommendation(${item.sNo})"
              class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#2E6DA4] hover:bg-[#235885] shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Save Changes</span>
            </button>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  };

  /**
   * Save Edited Recommendation
   */
  portalApp.saveEditRecommendation = function (sNo) {
    const recs = getPlrRecs();
    const item = recs.find(r => r.sNo === sNo);
    if (!item) return;

    const plrnoEl = document.getElementById('plr-edit-plrno');
    const yearEl = document.getElementById('plr-edit-year');
    const dateEl = document.getElementById('plr-edit-date');
    const actionbyEl = document.getElementById('plr-edit-actionby');
    const recEl = document.getElementById('plr-edit-rec');
    const statusRadio = document.querySelector('input[name="plr-edit-status"]:checked');

    if (!recEl || !recEl.value.trim()) {
      alert('Please provide the Recommendation text (Column E).');
      return;
    }

    item.plrNo = plrnoEl ? parseInt(plrnoEl.value, 10) : item.plrNo;
    item.year = yearEl && yearEl.value ? parseInt(yearEl.value, 10) : item.year;
    item.date = dateEl ? dateEl.value.trim() : item.date;
    let cleanActionBy = actionbyEl && actionbyEl.value.trim() ? actionbyEl.value.trim() : item.actionBy;
    if (cleanActionBy && /plant\s*engineering/i.test(cleanActionBy)) {
      cleanActionBy = cleanActionBy
        .replace(/Plant\s+Engineering\s*\(\s*PE\s*\)/gi, 'PE')
        .replace(/PE\s*\(\s*Plant\s+Engineering\s*\)/gi, 'PE')
        .replace(/Plant\s+Engineering/gi, 'PE')
        .trim();
    }
    item.actionBy = cleanActionBy;
    item.recommendation = recEl.value.trim();
    item.status = statusRadio ? statusRadio.value : item.status;
    item.category = item.actionBy;

    portalApp.closeActionModal();

    portalApp.saveAndReflectRecChanges(
      'Recommendation Updated',
      `Recommendation #${sNo} (PLR #${item.plrNo}) saved. Dashboard recalculated.`
    );
  };

  /**
   * Delete Recommendation
   */
  portalApp.deleteRecommendation = function (sNo) {
    const recs = getPlrRecs();
    const idx = recs.findIndex(r => r.sNo === sNo);
    if (idx === -1) return;

    const item = recs[idx];
    if (!confirm(`Are you sure you want to delete recommendation #${sNo} for PLR #${item.plrNo}? This change will reflect immediately on the dashboard.`)) {
      return;
    }

    recs.splice(idx, 1);
    portalApp.saveAndReflectRecChanges(
      'Recommendation Deleted',
      `Recommendation #${sNo} was removed from the dataset.`
    );
  };

  /**
   * Open Google Sheet Recommendations & PLR Status Sync Modal
   * Displays permanently embedded Google Sheet integration with dual rows:
   * 1. Already Embedded: Recommendations Google Sheet (Column E: Recommendations, Column F: Department, Column G: Status)
   * 2. Newly Embedded: PLRs Status & Incidents Google Sheet (Column E: Incident, Column F: Status, Column G: Machine, Column H: Priority, Column I: Dept)
   * Strict Row 2 start: Never counts Row 1 header.
   */
  portalApp.openPlrSheetSyncModal = function () {
    const container = document.getElementById('plr-action-modal-container');
    if (!container) return;

    const recs = getPlrRecs();
    const openRecCount = recs.filter(r => (r.status || '').toLowerCase() === 'open').length;
    const closedRecCount = recs.length - openRecCount;

    const incidents = getPlrData();
    const openIncCount = incidents.filter(i => (i.status || '').toLowerCase() === 'open').length;
    const closedIncCount = incidents.length - openIncCount;

    const defaultRecsUrl = (typeof localStorage !== 'undefined' && localStorage.getItem('FPCL_CONNECTED_SHEET_URL')) || (portalApp.state && portalApp.state.connectedSheetUrl) || HARDCODED_RECOMMENDATIONS_SHEET_URL;
    const defaultStatusUrl = (typeof localStorage !== 'undefined' && localStorage.getItem('FPCL_CONNECTED_PLR_STATUS_SHEET_URL')) || (portalApp.state && portalApp.state.connectedPlrStatusSheetUrl) || HARDCODED_PLR_STATUS_SHEET_URL;

    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[94vh]">
          
          <!-- Header -->
          <div class="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <i data-lucide="file-spreadsheet" class="w-5 h-5"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-black text-slate-900">Google Sheets Integration &amp; Live Sync</h3>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Dual Embedded Sources</span>
                </div>
                <p class="text-xs text-emerald-800 font-medium">Both sheets permanently embedded for live status updation on load and refresh</p>
              </div>
            </div>
            <button onclick="portalApp.closeActionModal()" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="p-5 overflow-y-auto space-y-4 text-xs">
            <!-- Specification Summary -->
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <i data-lucide="database" class="w-4 h-4 text-emerald-600"></i>
                  <span>Active Live Datasets (Row 2 Strict Start • Auto-Sync Active)</span>
                </span>
                <span class="inline-flex items-center gap-1 font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Status: Connected
                </span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div class="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <div class="text-slate-500 font-medium flex items-center justify-between">
                    <span>Source 1: Recommendations</span>
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Embedded</span>
                  </div>
                  <div class="font-bold text-slate-900 text-xs mt-0.5 font-mono">${recs.length} Recommendations (${closedRecCount} Closed, ${openRecCount} Open)</div>
                  <div class="text-[10px] text-emerald-700 mt-1">Col E: Recommendations • Col F: Dept • Col G: Status</div>
                </div>
                <div class="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <div class="text-slate-500 font-medium flex items-center justify-between">
                    <span>Source 2: PLRs Status &amp; Incidents</span>
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-200">Embedded</span>
                  </div>
                  <div class="font-bold text-slate-900 text-xs mt-0.5 font-mono">${incidents.length} Outages (${closedIncCount} Closed, ${openIncCount} Open)</div>
                  <div class="text-[10px] text-sky-700 mt-1">Col E: Incident • Col F: Status • Col G: Machine (Breakdown)</div>
                </div>
              </div>
            </div>

            <!-- Row 1: Recommendations Google Sheet (Already Embedded Sheet - Kept As Such) -->
            <div class="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2.5">
              <div class="flex items-center justify-between">
                <label class="block font-bold text-emerald-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <i data-lucide="layers" class="w-3.5 h-3.5 text-emerald-700"></i>
                  <span>1. Recommendations Google Sheet (Already Embedded Sheet)</span>
                </label>
                <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                  Target Tab: Recommendations
                </span>
              </div>
              <div class="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  id="plr-sheet-url-input"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  value="${defaultRecsUrl}"
                  class="flex-1 px-3.5 py-2 rounded-xl border border-emerald-300 bg-white font-mono text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
                <button
                  type="button"
                  onclick="portalApp.syncRecommendationsSheetOnly()"
                  class="px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 shadow-2xs transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Sync Recommendations sheet only"
                >
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                  <span>Sync Recs</span>
                </button>
              </div>
              <div class="flex items-center justify-between text-[10px] text-emerald-800">
                <span>Feeds: Action Recommendations per Dept, KPI Cards (Total &amp; Open Recs), and Recommendations Log.</span>
                <span class="font-mono font-bold">Col E, F, G</span>
              </div>
            </div>

            <!-- Row 2: PLRs Status Google Sheet (New Dedicated Row for PLR Status Updation) -->
            <div class="p-3.5 rounded-xl border border-sky-200 bg-sky-50/40 space-y-2.5">
              <div class="flex items-center justify-between">
                <label class="block font-bold text-sky-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <i data-lucide="cpu" class="w-3.5 h-3.5 text-sky-700"></i>
                  <span>2. PLRs Status &amp; Incidents Google Sheet (New Dedicated Row)</span>
                </label>
                <span class="text-[10px] font-bold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded-full border border-sky-300">
                  Target Tab: PLR / PLRstatus
                </span>
              </div>
              <div class="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  id="plr-status-sheet-url-input"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit or published CSV URL"
                  value="${defaultStatusUrl}"
                  class="flex-1 px-3.5 py-2 rounded-xl border border-sky-300 bg-white font-mono text-xs text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                />
                <button
                  type="button"
                  onclick="portalApp.syncPlrStatusSheetOnly()"
                  class="px-3 py-2 rounded-xl text-xs font-bold text-sky-800 bg-sky-100 hover:bg-sky-200 border border-sky-300 shadow-2xs transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Sync PLR Status sheet only"
                >
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                  <span>Sync PLR Status</span>
                </button>
              </div>
              <div class="flex items-center justify-between text-[10px] text-sky-800">
                <span>Feeds: PLR by Machine (Column G), PLRs KPI Cards (Total &amp; Open PLRs), and Plant Records PLR Incidents Log.</span>
                <span class="font-mono font-bold">Col B, E, F, G, H, I</span>
              </div>
            </div>

            <!-- Master Sync Both Sheets Action Button -->
            <div>
              <button
                type="button"
                id="plr-sync-action-btn"
                onclick="portalApp.syncAllPlrSheets({ silent: false, target: 'both' })"
                class="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-[#2E6DA4] hover:opacity-95 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                <span>Fetch &amp; Sync Both Sheets Now (Live Status Updation)</span>
              </button>
            </div>

            <!-- Divider -->
            <div class="relative flex py-1 items-center">
              <div class="flex-grow border-t border-slate-200"></div>
              <span class="flex-shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Manual CSV Backup Ingestion</span>
              <div class="flex-grow border-t border-slate-200"></div>
            </div>

            <!-- CSV Upload and Paste Options -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label class="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl bg-slate-50 hover:bg-emerald-50/50 cursor-pointer transition-colors text-center">
                <i data-lucide="upload" class="w-5 h-5 text-slate-500 mb-1"></i>
                <span class="font-bold text-slate-800 text-[11px]">Upload CSV File</span>
                <span class="text-[10px] text-slate-500 mt-0.5">Smart Detection: PLR Incidents or Recommendations</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  class="hidden"
                  onchange="portalApp.handlePlrSmartFileUpload(event)"
                />
              </label>

              <button
                type="button"
                onclick="portalApp.showPlrPasteArea()"
                class="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-200 hover:border-sky-500 rounded-xl bg-slate-50 hover:bg-sky-50/50 cursor-pointer transition-colors text-center"
              >
                <i data-lucide="clipboard" class="w-5 h-5 text-slate-500 mb-1"></i>
                <span class="font-bold text-slate-800 text-[11px]">Paste CSV Raw Text</span>
                <span class="text-[10px] text-slate-500 mt-0.5">Paste CSV rows directly</span>
              </button>
            </div>

            <!-- Hidden Paste Area -->
            <div id="plr-paste-container" class="hidden space-y-2">
              <textarea
                id="plr-paste-textarea"
                rows="4"
                placeholder="Paste CSV text here (with header row)..."
                class="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-[11px] focus:outline-none focus:border-emerald-600"
              ></textarea>
              <div class="flex gap-2">
                <button
                  type="button"
                  onclick="portalApp.importPlrSmartFromPastedCsv()"
                  class="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black transition-colors cursor-pointer"
                >
                  Auto-Detect &amp; Ingest
                </button>
                <button
                  type="button"
                  onclick="portalApp.importPlrIncidentsFromPastedCsv()"
                  class="px-3 py-2 rounded-xl text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
                >
                  As PLR Status
                </button>
                <button
                  type="button"
                  onclick="portalApp.importPlrRecommendationsFromPastedCsv()"
                  class="px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                >
                  As Recommendations
                </button>
              </div>
            </div>

            <!-- Status Feedback Container -->
            <div id="plr-sync-status-msg" class="hidden text-xs p-3 rounded-xl"></div>

          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick="portalApp.resetAllPlrToBaseline()"
                class="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 shadow-xs cursor-pointer transition-colors"
                title="Reset both incidents and recommendations back to original baseline records"
              >
                Reset All to Baseline
              </button>
              <button
                type="button"
                onclick="portalApp.resetPlrRecommendationsToBaseline()"
                class="px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 shadow-2xs cursor-pointer hover:bg-slate-100"
                title="Reset recommendations only"
              >
                Reset Recs
              </button>
              <button
                type="button"
                onclick="portalApp.resetPlrIncidentsToBaseline()"
                class="px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 shadow-2xs cursor-pointer hover:bg-slate-100"
                title="Reset incidents only"
              >
                Reset Incidents
              </button>
            </div>
            <button
              type="button"
              onclick="portalApp.closeActionModal()"
              class="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 shadow-xs cursor-pointer hover:bg-slate-100"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  };

  portalApp.showPlrPasteArea = function () {
    const el = document.getElementById('plr-paste-container');
    if (el) el.classList.toggle('hidden');
  };

  /**
   * Permanently Embedded Google Sheets Sync Engine (Dual Embedded Sheet URLs & Tabs)
   * Synchronizes:
   * 1. Recommendations Sheet (Tab: Recommendations -> Col E Recs, Col F Dept, Col G Status)
   * 2. PLRs Status Sheet (Tab: PLR / PLRstatus -> Col E Incident, Col F Status, Col G Machine, Col H Priority, Col I Dept)
   * Strict Row 2 start: Never counts Row 1 header.
   * Both permanently embedded for live status updation on page load and manual refresh.
   */
  portalApp.syncAllPlrSheets = async function (options = {}) {
    const isSilent = options.silent || false;
    const customRecUrl = options.url || null;
    const customStatusUrl = options.statusUrl || null;
    const targetSource = options.target || 'both'; // 'both', 'recs', 'incidents'

    const recsInput = document.getElementById('plr-sheet-url-input');
    const statusInput = document.getElementById('plr-status-sheet-url-input');
    const statusMsg = document.getElementById('plr-sync-status-msg');
    const btn = document.getElementById('plr-sync-action-btn');

    const savedRecUrl = customRecUrl || HARDCODED_RECOMMENDATIONS_SHEET_URL;
    const savedStatusUrl = customStatusUrl || HARDCODED_PLR_STATUS_SHEET_URL;

    if (!savedRecUrl && !savedStatusUrl) {
      if (isSilent) return;
      if (statusMsg) {
        statusMsg.className = 'text-xs p-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 block';
        statusMsg.innerHTML = 'Please enter a valid Google Sheet URL to synchronize.';
      }
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Syncing Live Embedded Sheets...</span>`;
      if (window.lucide) window.lucide.createIcons();
    }

    if (statusMsg) {
      statusMsg.className = 'text-xs p-3 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 block';
      statusMsg.innerHTML = `Fetching live data starting from Row 2 across embedded sheets...`;
    }

    const fetchTabCsv = async (sheetTab, targetUrl) => {
      let csvData = '';
      const urlToUse = targetUrl || savedRecUrl;
      if (!urlToUse) return '';

      const now = Date.now();
      const nonce = Math.floor(Math.random() * 10000000);
      const gidMatch = urlToUse.match(/[#?&]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : null;

      // 1. Resilient Multi-tier Google Sheet Fetcher (handles CORS on Vercel via JSONP + zero-cache)
      if (typeof window.fetchGoogleSheetData === 'function') {
        try {
          csvData = await window.fetchGoogleSheetData(urlToUse, { sheetTab, gid });
        } catch (e) {
          console.warn(`window.fetchGoogleSheetData error for tab ${sheetTab}:`, e);
        }
      }

      // 2. Direct JSONP fallback if window.fetchGoogleSheetData did not return text
      if (!csvData && typeof window.fetchGoogleSheetViaJSONP === 'function') {
        try {
          const jsonpRes = await window.fetchGoogleSheetViaJSONP(urlToUse, { sheetTab, gid });
          if (jsonpRes && jsonpRes.csvText && jsonpRes.csvText.length > 50) {
            csvData = jsonpRes.csvText;
          }
        } catch (e) {
          console.warn(`JSONP fallback failed for tab ${sheetTab}:`, e);
        }
      }

      // 3. Try server proxy (/api/sheets/fetch) with explicit zero-cache
      if (!csvData) {
        try {
          const res = await fetch('/api/sheets/fetch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
            cache: 'no-store',
            body: JSON.stringify({ url: urlToUse, sheetTab, gid, t: now, _nocache: nonce })
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.csvText) {
              csvData = json.csvText;
            }
          }
        } catch (err) {
          console.warn(`Proxy fetch failed for tab ${sheetTab} on ${urlToUse}:`, err);
        }
      }

      // 4. Client-side direct fallback with cache-busting
      if (!csvData) {
        let spreadsheetId = urlToUse;
        let isPublished = false;
        let pubBase = '';
        const pubMatch = urlToUse.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
        if (pubMatch) {
          isPublished = true;
          spreadsheetId = pubMatch[1];
          pubBase = `https://docs.google.com/spreadsheets/d/e/${spreadsheetId}/pub`;
        } else {
          const match = urlToUse.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
          if (match) spreadsheetId = match[1];
        }

        const candidateUrls = [];
        if (urlToUse.includes('output=csv') || urlToUse.includes('format=csv') || urlToUse.includes('/pub?')) {
          candidateUrls.push(urlToUse);
        } else if (urlToUse.includes('/pubhtml')) {
          candidateUrls.push(urlToUse.replace('/pubhtml', '/pub?output=csv'));
        }

        if (isPublished) {
          if (gid) candidateUrls.push(`${pubBase}?output=csv&gid=${gid}`);
          candidateUrls.push(`${pubBase}?output=csv&sheet=${encodeURIComponent(sheetTab)}`);
          candidateUrls.push(`${pubBase}?output=csv`);
        } else {
          if (gid) {
            candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`);
            candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`);
          }
          candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetTab)}`);
          candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=${encodeURIComponent(sheetTab)}`);
        }

        for (const candidate of candidateUrls) {
          try {
            const separator = candidate.includes('?') ? '&' : '?';
            const cacheBustedCandidate = `${candidate}${separator}_t=${now}&_nocache=${nonce}&t=${now}`;
            const fallbackRes = await fetch(cacheBustedCandidate, {
              method: 'GET',
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
            if (fallbackRes.ok) {
              const text = await fallbackRes.text();
              if (text && !text.includes('<!DOCTYPE html>') && !text.includes('<html') && !text.includes('google-site-verification')) {
                csvData = text;
                break;
              }
            }
          } catch (e) {}
        }
      }
      return csvData;
    };

    let recsUpdated = false;
    let incidentsUpdated = false;
    let recsSummary = '';
    let incidentsSummary = '';

    try {
      // 1. Sync Recommendations Sheet (if requested)
      if ((targetSource === 'both' || targetSource === 'recs') && savedRecUrl) {
        const recsCsv = await fetchTabCsv('Recommendations', savedRecUrl);
        if (recsCsv) {
          const parsedRecs = window.parsePLRRecommendationsCSV(recsCsv);
          if (parsedRecs && parsedRecs.length > 0) {
            window.FPCL_PLR_RECOMMENDATIONS = parsedRecs;
            try {
              localStorage.setItem('FPCL_PLR_RECOMMENDATIONS_UPDATED', JSON.stringify(parsedRecs));
            } catch (e) {}
            recsUpdated = true;
            const openCount = parsedRecs.filter(r => (r.status || '').toLowerCase() === 'open').length;
            const closedCount = parsedRecs.length - openCount;
            recsSummary = `${parsedRecs.length} Recommendations (${closedCount} Closed, ${openCount} Open)`;
          }
        }
      }

      // 2. Sync PLRs Status & Incidents Sheet (if requested)
      if ((targetSource === 'both' || targetSource === 'incidents' || targetSource === 'status') && savedStatusUrl) {
        const plrTabCandidates = ['PLRstatus', 'PLRStatus', 'PLR', 'PLR status', 'PLR Status', 'PLRs status', 'PLRs Status', 'PLRs', 'PLR Incident', 'Incidents', 'Outages', 'Sheet1'];
        let incidentsCsv = '';
        for (const tab of plrTabCandidates) {
          incidentsCsv = await fetchTabCsv(tab, savedStatusUrl);
          if (incidentsCsv && incidentsCsv.length > 100) {
            // Check if it parses into valid plant incidents
            const testParsed = window.parsePLRIncidentsCSV(incidentsCsv);
            if (testParsed && testParsed.length > 0) {
              break;
            }
          }
        }

        if (incidentsCsv) {
          const parsedIncidents = window.parsePLRIncidentsCSV(incidentsCsv);
          if (parsedIncidents && parsedIncidents.length > 0) {
            window.FPCL_PLR_DATA = parsedIncidents;
            try {
              localStorage.setItem('FPCL_PLR_INCIDENTS_UPDATED', JSON.stringify(parsedIncidents));
            } catch (e) {}
            incidentsUpdated = true;
            const openInc = parsedIncidents.filter(i => (i.status || '').toLowerCase() === 'open').length;
            const closedInc = parsedIncidents.length - openInc;
            incidentsSummary = `${parsedIncidents.length} Outages (${closedInc} Closed, ${openInc} Open)`;
          }
        }
      }

      // Persist permanently embedded sheet URLs
      if (savedRecUrl) {
        try {
          localStorage.setItem('FPCL_CONNECTED_SHEET_URL', savedRecUrl);
          if (portalApp.state) portalApp.state.connectedSheetUrl = savedRecUrl;
        } catch (e) {}
      }
      if (savedStatusUrl) {
        try {
          localStorage.setItem('FPCL_CONNECTED_PLR_STATUS_SHEET_URL', savedStatusUrl);
          if (portalApp.state) portalApp.state.connectedPlrStatusSheetUrl = savedStatusUrl;
        } catch (e) {}
      }

      if (recsUpdated || incidentsUpdated) {
        portalApp.syncPlrStatsToOverview();
        if (typeof portalApp.renderPlrSuite === 'function') {
          portalApp.renderPlrSuite();
        }

        const combinedMsg = [recsSummary, incidentsSummary].filter(Boolean).join(' • ');
        if (!isSilent) {
          portalApp.closeActionModal();
          portalApp.showToast('Embedded Sheets Synced', combinedMsg || 'Successfully refetched live data starting from Row 2.', 'success');
        } else {
          console.log('Live Google Sheets auto-sync completed:', combinedMsg);
        }
      } else {
        if (!isSilent) {
          throw new Error('Could not fetch data from connected sheet URLs. Please ensure the sheets are shared with "Anyone with the link can view".');
        }
      }

    } catch (err) {
      console.error('Google Sheet Sync error:', err);
      if (statusMsg) {
        statusMsg.className = 'text-xs p-3 rounded-xl bg-rose-50 text-rose-900 border border-rose-200 block';
        statusMsg.innerHTML = `<strong>Sync Notice:</strong> ${err.message || 'Could not reach sheet. Utilizing baseline data.'}`;
      }
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="refresh-cw" class="w-4 h-4"></i><span>Retry Fetch</span>`;
        if (window.lucide) window.lucide.createIcons();
      }
      if (!isSilent) {
        portalApp.showToast('Sync Notice', 'Could not refresh from live sheet. Using cached baseline data.', 'warning');
      }
    }
  };

  /**
   * Helper: Sync Recommendations Sheet Only
   */
  portalApp.syncRecommendationsSheetOnly = async function () {
    return portalApp.syncAllPlrSheets({ silent: false, target: 'recs' });
  };

  /**
   * Helper: Sync PLR Status Sheet Only
   */
  portalApp.syncPlrStatusSheetOnly = async function () {
    return portalApp.syncAllPlrSheets({ silent: false, target: 'status' });
  };

  /**
   * Compatibility wrapper for single-tab sync
   */
  portalApp.syncPlrRecommendationsFromSheet = async function (customUrl) {
    return portalApp.syncAllPlrSheets({ silent: false, url: customUrl });
  };

  /**
   * 1-Click Refresh directly from connected Google Sheet tabs Recommendations & PLR
   */
  portalApp.refreshFromLiveSheet = async function () {
    return portalApp.syncAllPlrSheets({ silent: false, target: 'both' });
  };

  /**
   * Smart CSV Upload (Auto-detects whether file is Incidents or Recommendations)
   */
  portalApp.handlePlrSmartFileUpload = function (event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target.result;
      const lowerHeader = (text.split('\n')[0] || '').toLowerCase();

      // If header contains machine, outage, or incident -> PLR Status
      if (lowerHeader.includes('machine') || lowerHeader.includes('outage') || (lowerHeader.includes('incident') && !lowerHeader.includes('recommendation'))) {
        const parsed = window.parsePLRIncidentsCSV(text);
        if (parsed && parsed.length > 0) {
          window.FPCL_PLR_DATA = parsed;
          try {
            localStorage.setItem('FPCL_PLR_INCIDENTS_UPDATED', JSON.stringify(parsed));
          } catch (err) {}
          portalApp.closeActionModal();
          portalApp.syncPlrStatsToOverview();
          portalApp.renderPlrSuite();
          portalApp.showToast('PLR Status Updated', `Parsed ${parsed.length} incidents from uploaded CSV. Machine breakdown & KPI cards updated.`, 'success');
          return;
        }
      }

      // Default or Recommendations
      const parsedRecs = window.parsePLRRecommendationsCSV(text);
      if (parsedRecs && parsedRecs.length > 0) {
        window.FPCL_PLR_RECOMMENDATIONS = parsedRecs;
        try {
          localStorage.setItem('FPCL_PLR_RECOMMENDATIONS_UPDATED', JSON.stringify(parsedRecs));
        } catch (err) {}
        portalApp.closeActionModal();
        portalApp.saveAndReflectRecChanges(
          'Recommendations Ingested',
          `Parsed ${parsedRecs.length} recommendations from Column E.`
        );
      } else {
        alert('Could not parse dataset from the uploaded file. Please ensure valid CSV formatting.');
      }
    };
    reader.readAsText(file);
  };

  portalApp.handlePlrRecommendationsFileUpload = function (event) {
    portalApp.handlePlrSmartFileUpload(event);
  };

  /**
   * Smart Paste Ingestion
   */
  portalApp.importPlrSmartFromPastedCsv = function () {
    const textarea = document.getElementById('plr-paste-textarea');
    if (!textarea || !textarea.value.trim()) {
      alert('Please paste CSV text into the box.');
      return;
    }
    const text = textarea.value.trim();
    const lowerHeader = (text.split('\n')[0] || '').toLowerCase();

    if (lowerHeader.includes('machine') || lowerHeader.includes('outage') || (lowerHeader.includes('incident') && !lowerHeader.includes('recommendation'))) {
      portalApp.importPlrIncidentsFromPastedCsv();
    } else {
      portalApp.importPlrRecommendationsFromPastedCsv();
    }
  };

  /**
   * Handle Pasted CSV Text for Recommendations
   */
  portalApp.importPlrRecommendationsFromPastedCsv = function () {
    const textarea = document.getElementById('plr-paste-textarea');
    if (!textarea || !textarea.value.trim()) {
      alert('Please paste CSV text into the box.');
      return;
    }

    const parsed = window.parsePLRRecommendationsCSV(textarea.value.trim());
    if (parsed && parsed.length > 0) {
      window.FPCL_PLR_RECOMMENDATIONS = parsed;
      try {
        localStorage.setItem('FPCL_PLR_RECOMMENDATIONS_UPDATED', JSON.stringify(parsed));
      } catch (e) {}
      portalApp.closeActionModal();
      portalApp.saveAndReflectRecChanges(
        'Recommendations Ingested',
        `Parsed ${parsed.length} recommendations from pasted text.`
      );
    } else {
      alert('Could not parse any recommendation rows. Please check the CSV formatting.');
    }
  };

  /**
   * Handle Pasted CSV Text for PLR Incidents
   */
  portalApp.importPlrIncidentsFromPastedCsv = function () {
    const textarea = document.getElementById('plr-paste-textarea');
    if (!textarea || !textarea.value.trim()) {
      alert('Please paste CSV text into the box.');
      return;
    }

    const parsed = window.parsePLRIncidentsCSV(textarea.value.trim());
    if (parsed && parsed.length > 0) {
      window.FPCL_PLR_DATA = parsed;
      try {
        localStorage.setItem('FPCL_PLR_INCIDENTS_UPDATED', JSON.stringify(parsed));
      } catch (e) {}
      portalApp.closeActionModal();
      portalApp.syncPlrStatsToOverview();
      portalApp.renderPlrSuite();
      portalApp.showToast('PLR Status Updated', `Parsed ${parsed.length} plant outages from pasted text. Machine breakdown and KPIs updated.`, 'success');
    } else {
      alert('Could not parse any incident rows. Please check the CSV formatting.');
    }
  };

  /**
   * Reset PLR Recommendations to Baseline
   */
  portalApp.resetPlrRecommendationsToBaseline = function () {
    if (!confirm('Are you sure you want to reset recommendations to the original 534 records? Any manual additions or edits will be reverted.')) {
      return;
    }

    localStorage.removeItem('FPCL_PLR_RECOMMENDATIONS_UPDATED');
    window.FPCL_PLR_RECOMMENDATIONS = Array.isArray(window.FPCL_PLR_RECOMMENDATIONS_BASELINE) && window.FPCL_PLR_RECOMMENDATIONS_BASELINE.length > 0
      ? JSON.parse(JSON.stringify(window.FPCL_PLR_RECOMMENDATIONS_BASELINE))
      : getPlrRecs();

    portalApp.closeActionModal();
    portalApp.saveAndReflectRecChanges(
      'Baseline Restored',
      'Original 534 recommendations restored and reflected across the portal.'
    );
  };

  /**
   * Reset PLR Incidents to Baseline
   */
  portalApp.resetPlrIncidentsToBaseline = function () {
    if (!confirm('Are you sure you want to reset incidents to the original 233 outage records?')) {
      return;
    }

    localStorage.removeItem('FPCL_PLR_INCIDENTS_UPDATED');
    window.FPCL_PLR_DATA = Array.isArray(window.FPCL_PLR_DATA_BASELINE) && window.FPCL_PLR_DATA_BASELINE.length > 0
      ? JSON.parse(JSON.stringify(window.FPCL_PLR_DATA_BASELINE))
      : getPlrData();

    portalApp.closeActionModal();
    portalApp.syncPlrStatsToOverview();
    portalApp.renderPlrSuite();
    portalApp.showToast('Incidents Restored', 'Original 233 incident outage records restored.', 'info');
  };

  /**
   * Reset All PLR Datasets to Baseline
   */
  portalApp.resetAllPlrToBaseline = function () {
    if (!confirm('Reset BOTH Recommendations (534 records) and Incident Outages (233 records) back to authentic baseline?')) {
      return;
    }

    localStorage.removeItem('FPCL_PLR_RECOMMENDATIONS_UPDATED');
    localStorage.removeItem('FPCL_PLR_INCIDENTS_UPDATED');

    window.FPCL_PLR_RECOMMENDATIONS = Array.isArray(window.FPCL_PLR_RECOMMENDATIONS_BASELINE) && window.FPCL_PLR_RECOMMENDATIONS_BASELINE.length > 0
      ? JSON.parse(JSON.stringify(window.FPCL_PLR_RECOMMENDATIONS_BASELINE))
      : getPlrRecs();

    window.FPCL_PLR_DATA = Array.isArray(window.FPCL_PLR_DATA_BASELINE) && window.FPCL_PLR_DATA_BASELINE.length > 0
      ? JSON.parse(JSON.stringify(window.FPCL_PLR_DATA_BASELINE))
      : getPlrData();

    portalApp.closeActionModal();
    portalApp.syncPlrStatsToOverview();
    portalApp.renderPlrSuite();
    portalApp.showToast('All Datasets Restored', 'Both recommendations and plant outages restored to authentic baseline.', 'success');
  };

  // Keyboard shortcut: Close PLR modals on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (portalApp.closePlrDataModal) portalApp.closePlrDataModal();
      if (portalApp.closePlrInspectionModal) portalApp.closePlrInspectionModal();
      if (portalApp.closeActionModal) portalApp.closeActionModal();
    }
  });

  // Global window bindings and fallback click delegation to guarantee modal popups in any environment
  window.portalApp = portalApp;
  window.openPlrKpiModal = function (kpiType) { return portalApp.openPlrKpiModal(kpiType); };
  window.openPlrDataModal = function (opts) { return portalApp.openPlrDataModal(opts); };
  window.openResolutionDataModal = function (status) { return portalApp.openResolutionDataModal(status); };
  window.closePlrDataModal = function () { return portalApp.closePlrDataModal(); };

  // Document-level delegation to capture clicks on KPI cards & resolution bars
  document.addEventListener('click', function (e) {
    const kpiEl = e.target.closest('[data-plr-kpi]');
    if (kpiEl && typeof portalApp.openPlrKpiModal === 'function') {
      const kpiType = kpiEl.getAttribute('data-plr-kpi');
      if (kpiType) {
        portalApp.openPlrKpiModal(kpiType);
        return;
      }
    }

    const resEl = e.target.closest('[data-plr-action="resolution-modal"]');
    if (resEl && typeof portalApp.openResolutionDataModal === 'function') {
      const status = resEl.getAttribute('data-status') || 'all';
      portalApp.openResolutionDataModal(status);
      return;
    }
  });

  // Automated background refresh every 60 seconds for continuous live Google Sheets updates
  if (typeof window !== 'undefined') {
    setTimeout(function () {
      if (typeof portalApp.syncAllPlrSheets === 'function') {
        portalApp.syncAllPlrSheets({ silent: true, target: 'both' });
      }
    }, 1200);

    setInterval(function () {
      if (typeof portalApp.syncAllPlrSheets === 'function') {
        portalApp.syncAllPlrSheets({ silent: true, target: 'both' });
      }
    }, 60000);
  }

})();
