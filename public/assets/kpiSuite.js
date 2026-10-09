/**
 * FPCL Executive Operations & Compliance Portal
 * KPIs Executive Organogram & BI Scorecard Suite
 * 
 * Google Sheet ID: 1gkO-kV44ABOuB2JB72FQbwLYdAcAZKBzcIBMBZnR8Ts
 * Sheet Tab: KPIs
 * 
 * Strict Scope & Isolation: Only manages the KPIs Organogram & Scorecard.
 * Leaves Strategic, PLR, PSM Audits, PSM Validation, IMS, PSSR, CAPEX,
 * Sub HSE – P, Sub HSE – E&I, EHSE, Sub HSE – Mech, Crew Week untouched.
 */

(function () {
  'use strict';

  const SHEET_ID = '1gkO-kV44ABOuB2JB72FQbwLYdAcAZKBzcIBMBZnR8Ts';
  const SHEET_TAB = 'KPIs';
  const PRIMARY_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}`;
  const PROXY_CSV_URL = `/api/sheets/fetch?sheetId=${SHEET_ID}&sheetTab=${encodeURIComponent(SHEET_TAB)}`;

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
          if (curRow.length > 1 || (curRow.length === 1 && curRow[0] !== '')) {
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
      if (curRow.length > 1 || (curRow.length === 1 && curRow[0] !== '')) {
        rows.push(curRow);
      }
    }
    return rows;
  }

  function getIconForKpi(name) {
    const n = (name || '').toLowerCase();
    if (n.includes('profit')) return 'banknote';
    if (n.includes('availability')) return 'activity';
    if (n.includes('dispatch')) return 'zap';
    if (n.includes('coal')) return 'flame';
    if (n.includes('spare') || n.includes('cost reduction')) return 'cog';
    if (n.includes('ta') || n.includes('turnaround') || n.includes('delay')) return 'calendar-check';
    if (n.includes('safe') || n.includes('trir') || n.includes('injury')) return 'shield-check';
    return 'target';
  }

  function getColorForKpi(cat) {
    const c = (cat || '').toLowerCase();
    if (c.includes('saving')) return 'emerald';
    if (c.includes('process') || c.includes('pi')) return 'purple';
    if (c.includes('business')) return 'blue';
    return 'indigo';
  }

  // Organization Structure Definition (Data-Driven JSON)
  const ORGANIZATION_DATA = {
    id: 'coo',
    title: 'COO FPCL',
    subtitle: 'Chief Operating Officer',
    level: 1,
    tag: '100% Weightage',
    weightageTooltip: 'Weightage in the corporate KPI scorecard',
    subordinatesCount: 4,
    role: 'Executive Operations Leadership',
    icon: 'crown',
    children: [
      {
        id: 'sm-production',
        title: 'Senior Manager Production',
        subtitle: 'Reports to COO FPCL',
        level: 2,
        department: 'Production',
        deptKey: 'production',
        tag: 'Production & Ops',
        icon: 'factory',
        subordinatesCount: 1,
        color: '#059669',
        borderTop: '#059669',
        bgTint: '#ECFDF5',
        borderTint: '#A7F3D0',
        tagBg: '#ECFDF5',
        tagText: '#065F46',
        tagBorder: '#A7F3D0',
        children: [
          {
            id: 'm-production-pu',
            title: 'Manager Production (P&U)',
            subtitle: 'Power & Utilities',
            level: 3,
            department: 'Production',
            deptKey: 'production',
            tag: 'Power & Utilities',
            icon: 'activity',
            hasIcon: true,
            reportingType: 'direct',
            subordinatesCount: 0,
            cardBg: '#F0FDF4',
            cardBorder: '#BBF7D0'
          }
        ]
      },
      {
        id: 'sm-commercial',
        title: 'Senior Manager Commercial',
        subtitle: 'Reports to COO FPCL',
        level: 2,
        department: 'Commercial',
        deptKey: 'commercial',
        tag: 'Commercial', // Changed from Commercial & SCM to Commercial
        icon: 'trending-up',
        subordinatesCount: 1,
        color: '#4F46E5',
        borderTop: '#4F46E5',
        bgTint: '#EEF2FF',
        borderTint: '#C7D2FE',
        tagBg: '#EEF2FF',
        tagText: '#3730A3',
        tagBorder: '#C7D2FE',
        children: [
          {
            id: 'm-commercial-fuel',
            title: 'Commercial & Fuel Portfolio',
            subtitle: 'Direct reporting to COO',
            level: 3,
            department: 'Commercial',
            deptKey: 'commercial',
            tag: 'Commercial',
            icon: null,
            hasIcon: false, // Strictly removed commercial and fuel portfolio icon as requested
            reportingType: 'functional',
            dashedCard: true, // Dashed card representation
            subordinatesCount: 0,
            cardBg: '#F5F3FF',
            cardBorder: '#C7D2FE'
          }
        ]
      },
      {
        id: 'sm-ei',
        title: 'Senior Manager E&I',
        subtitle: 'Reports to COO FPCL',
        level: 2,
        department: 'Electrical & Inst',
        deptKey: 'ei',
        tag: 'Electrical & Inst',
        icon: 'zap',
        subordinatesCount: 2,
        color: '#D97706',
        borderTop: '#D97706',
        bgTint: '#FFFBEB',
        borderTint: '#FDE68A',
        tagBg: '#FFFBEB',
        tagText: '#92400E',
        tagBorder: '#FDE68A',
        children: [
          {
            id: 'm-electrical',
            title: 'Manager Electrical',
            subtitle: 'Electrical Systems',
            level: 3,
            department: 'Electrical & Inst',
            deptKey: 'ei',
            tag: 'Electrical',
            icon: 'cpu',
            hasIcon: true,
            reportingType: 'direct',
            subordinatesCount: 0,
            cardBg: '#FEFCE8',
            cardBorder: '#FEF08A'
          },
          {
            id: 'm-instrument',
            title: 'Manager Instrument',
            subtitle: 'Instrumentation & Controls',
            level: 3,
            department: 'Electrical & Inst',
            deptKey: 'ei',
            tag: 'Controls',
            icon: 'sliders',
            hasIcon: true,
            reportingType: 'direct',
            subordinatesCount: 0,
            cardBg: '#FEFCE8',
            cardBorder: '#FEF08A'
          }
        ]
      },
      {
        id: 'sm-mech-maint',
        title: 'Senior Manager Mech Maint',
        subtitle: 'Reports to COO FPCL',
        level: 2,
        department: 'Mechanical Maint',
        deptKey: 'mech',
        tag: 'Mechanical Maint',
        icon: 'wrench',
        subordinatesCount: 3,
        color: '#E11D48',
        borderTop: '#E11D48',
        bgTint: '#FFF1F2',
        borderTint: '#FECDD3',
        tagBg: '#FFF1F2',
        tagText: '#9F1239',
        tagBorder: '#FECDD3',
        children: [
          {
            id: 'm-equipment',
            title: 'Manager Equipment',
            subtitle: 'Static Equipment',
            level: 3,
            department: 'Mechanical Maint',
            deptKey: 'mech',
            tag: 'Equipment',
            icon: 'box',
            hasIcon: true,
            reportingType: 'direct',
            subordinatesCount: 0,
            cardBg: '#FFF1F2',
            cardBorder: '#FECDD3'
          },
          {
            id: 'm-machinery',
            title: 'Manager Machinery',
            subtitle: 'Rotating Machinery',
            level: 3,
            department: 'Mechanical Maint',
            deptKey: 'mech',
            tag: 'Machinery',
            icon: 'cog',
            hasIcon: true,
            reportingType: 'direct',
            subordinatesCount: 0,
            cardBg: '#FFF1F2',
            cardBorder: '#FECDD3'
          },
          {
            id: 'm-planning',
            title: 'Manager Planning',
            subtitle: 'Maintenance Planning',
            level: 3,
            department: 'Mechanical Maint',
            deptKey: 'mech',
            tag: 'Planning',
            icon: 'calendar',
            hasIcon: true,
            reportingType: 'direct',
            subordinatesCount: 0,
            cardBg: '#FFF1F2',
            cardBorder: '#FECDD3'
          }
        ]
      }
    ]
  };

  // High-performance Inline SVG Icons
  const SVG_ICONS = {
    crown: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>',
    factory: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></svg>',
    'trending-up': '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
    zap: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    wrench: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    activity: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    cpu: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>',
    sliders: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>',
    box: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
    cog: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
    calendar: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    chevronDown: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    table: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>'
  };

  const kpiSuite = {
    state: {
      kpis: [],
      activeNodeId: 'coo', // default active node in organogram is COO FPCL
      collapsedBranches: {
        'sm-production': false,
        'sm-commercial': false,
        'sm-ei': false,
        'sm-mech-maint': false
      },
      activeCategoryFilter: 'all',
      searchQuery: '',
      popupSearchQuery: '',
      popupCategoryFilter: 'all',
      isCooPopupOpen: false,
      selectedKpiForDrillDown: null,
      isSyncing: false,
      lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      syncError: null,
      viewMode: 'grid' // 'grid' | 'table' | 'split'
    },

    init() {
      window.FPCL_KPI_SUITE = this;
      window.FPCL_KPI_ORGANOGRAM = ORGANIZATION_DATA;

      // Seed with pre-bundled fallback data if available
      if (window.FPCL_KPI_DATA && Array.isArray(window.FPCL_KPI_DATA)) {
        this.state.kpis = [...window.FPCL_KPI_DATA];
      }

      // Check local storage cache
      try {
        const cached = localStorage.getItem('FPCL_KPIS_CACHE_V2');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.state.kpis = parsed;
          }
        }
      } catch (e) {}

      // Automatically sync live data in the background
      this.fetchLiveData();
    },

    async fetchLiveData(showLoading = false) {
      if (this.state.isSyncing) return;
      this.state.isSyncing = true;
      this.state.syncError = null;
      this.updateSyncUI();

      try {
        let csvText = '';
        const now = Date.now();

        // 1. Try local serverless proxy first
        try {
          const res = await fetch(`${PROXY_CSV_URL}&_nocache=${now}`, {
            headers: { 'Cache-Control': 'no-cache, no-store' }
          });
          if (res.ok) {
            const json = await res.json();
            if (json && json.csvText && !json.csvText.includes('<!DOCTYPE html>')) {
              csvText = json.csvText;
            }
          }
        } catch (e) {}

        // 2. Try direct Google GViz CSV endpoint
        if (!csvText) {
          try {
            const directUrl = `${PRIMARY_CSV_URL}&_nocache=${now}&t=${now}`;
            const res = await fetch(directUrl, {
              headers: { 'Cache-Control': 'no-cache, no-store' }
            });
            if (res.ok) {
              const text = await res.text();
              if (text && !text.includes('<!DOCTYPE html>') && text.includes(',')) {
                csvText = text;
              }
            }
          } catch (e) {}
        }

        // 3. Try Universal Google Sheet Sync if available
        if (!csvText && window.FPCL_SHEET_SYNC && typeof window.FPCL_SHEET_SYNC.fetchGoogleSheetData === 'function') {
          try {
            const fetched = await window.FPCL_SHEET_SYNC.fetchGoogleSheetData(PRIMARY_CSV_URL, SHEET_TAB);
            if (fetched && !fetched.includes('<!DOCTYPE html>') && fetched.includes(',')) {
              csvText = fetched;
            }
          } catch (e) {}
        }

        // 4. Try dedicated /api/kpis endpoint
        if (!csvText) {
          try {
            const kpiRes = await fetch(`/api/kpis?_nocache=${now}`);
            if (kpiRes.ok) {
              const text = await kpiRes.text();
              if (text && !text.includes('<!DOCTYPE html>') && text.includes(',')) {
                csvText = text;
              }
            }
          } catch (e) {}
        }

        if (csvText) {
          const parsedKpis = this.parseKpiCsv(csvText);
          if (parsedKpis && parsedKpis.length > 0) {
            this.state.kpis = parsedKpis;
            this.state.lastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            try {
              localStorage.setItem('FPCL_KPIS_CACHE_V2', JSON.stringify(parsedKpis));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('KPI live sync notice:', err);
        this.state.syncError = err?.message || 'Sync error';
      } finally {
        this.state.isSyncing = false;
        this.updateSyncUI();
        this.renderAll();
        if (this.state.isCooPopupOpen) {
          this.renderCooHighlightsPopup();
        }
      }
    },

    parseKpiCsv(csvText) {
      const rawRows = parseCsvText(csvText);
      if (!rawRows || rawRows.length < 2) return this.state.kpis;

      // Find header row (usually contains 'Main Category', 'KPI', 'Lead Department')
      let headerIdx = 0;
      for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
        const rowJoin = rawRows[i].join(' ').toLowerCase();
        if (rowJoin.includes('kpi') || rowJoin.includes('lead department') || rowJoin.includes('main category')) {
          headerIdx = i;
          break;
        }
      }

      const headers = rawRows[headerIdx].map(h => (h || '').trim());
      const dataRows = rawRows.slice(headerIdx + 1);
      const results = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.length === 0 || row.every(c => !c || c.trim() === '')) continue;

        // Extract columns based on expected positions:
        // Col 0: Sr (e.g. 1, 2, 3)
        // Col 1: Main Category (e.g. "Business Results 36%")
        // Col 2: Each KPI Category (e.g. "Business Results", "Savings", "Process Improvement")
        // Col 3: KPI Name
        // Col 4: Weightage (e.g. "10%")
        // Col 5: Lead Department
        // Col 6: Secondary Stakeholders
        // Col 7: -95% Target
        // Col 8: Target (100%)
        // Col 9: Stretch Target (110%)

        const sr = row[0] || (i + 1).toString();
        const mainCat = row[1] || '';
        const kpiCat = row[2] || (mainCat.includes('Savings') ? 'Savings' : mainCat.includes('Process') ? 'Process Improvement' : 'Business Results');
        const kpi = row[3] || '';
        if (!kpi) continue;

        const weightStr = row[4] || '';
        let weightNum = 0;
        const weightMatch = weightStr.match(/(\d+(\.\d+)?)/);
        if (weightMatch) {
          weightNum = parseFloat(weightMatch[1]);
        }

        const leadDept = row[5] || 'All';
        const secondary = row[6] || '';
        const min95 = row[7] || '';
        const tgt100 = row[8] || '';
        const stretch110 = row[9] || '';

        results.push({
          sr: sr.trim(),
          mainCategory: mainCat.replace(/\n/g, ' ').trim(),
          mainCategoryWeight: mainCat.match(/\d+%/)?.[0] || '',
          kpiCategory: kpiCat.replace(/\n/g, ' ').trim(),
          kpi: kpi.replace(/\n/g, ' ').trim(),
          weightage: weightStr.trim() || `${weightNum}%`,
          weightageNum: weightNum,
          leadDept: leadDept.replace(/\n/g, ' ').trim(),
          secondaryStakeholders: secondary.replace(/\n/g, ' ').trim(),
          minTarget95: min95.replace(/\n/g, ' ').trim(),
          target100: tgt100.replace(/\n/g, ' ').trim(),
          stretchTarget110: stretch110.replace(/\n/g, ' ').trim(),
          unit: this.guessUnit(kpi, tgt100),
          icon: getIconForKpi(kpi),
          color: getColorForKpi(kpiCat || mainCat),
          description: this.getKpiDescription(kpi)
        });
      }

      return results.length > 0 ? results : this.state.kpis;
    },

    guessUnit(kpi, target) {
      const combined = `${kpi} ${target}`.toLowerCase();
      if (combined.includes('pkr') && combined.includes('billion')) return 'PKR Billions';
      if (combined.includes('pkr') && combined.includes('million')) return 'PKR Millions';
      if (combined.includes('mwh')) return 'MWh Power';
      if (combined.includes('days')) return 'Operating Days';
      if (combined.includes('trir')) return 'Safety TRIR Index';
      if (combined.includes('hrs') || combined.includes('delay')) return 'Outage Hours';
      return 'Index / Metric';
    },

    getKpiDescription(kpi) {
      const k = (kpi || '').toLowerCase();
      if (k.includes('profit')) return 'Corporate bottom-line net profit achievement benchmarked against FFBL Power Company Business Plan.';
      if (k.includes('availability')) return 'Annual power plant operational availability delivered to FFC Port Qasim, maximizing commercial readiness.';
      if (k.includes('dispatch')) return 'Grid electricity dispatched to K-Electric system in compliance with bilateral off-take requirements.';
      if (k.includes('coal')) return 'Cost reduction achieved through strategic indigenous Thar/Jhimpir coal blending substituting imported fuel.';
      if (k.includes('spares')) return 'Spare parts cost reduction migrating from original equipment supply (OES) to reverse engineering & OPM.';
      if (k.includes('ta')) return 'Annual turnaround (TA-2026/2027) outage scheduling, zero job rework, and long-lead material readiness.';
      if (k.includes('trir') || k.includes('safe')) return 'Total Recordable Incident Rate maintaining safe plant operations with zero lost time accidents.';
      return 'Key strategic and operational performance indicator tracked for FPCL executive leadership governance.';
    },

    // Retrieve active node metadata from organogram hierarchy
    findNode(nodeId, node = window.FPCL_KPI_ORGANOGRAM) {
      if (!node) return null;
      if (node.id === nodeId) return node;
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          const found = this.findNode(nodeId, child);
          if (found) return found;
        }
      }
      return null;
    },

    // Check if a KPI belongs to a selected node's scope
    isKpiInNodeScope(kpiItem, node) {
      if (!node || node.id === 'coo') return true; // COO sees all KPIs

      const lead = (kpiItem.leadDept || '').toLowerCase();
      const sec = (kpiItem.secondaryStakeholders || '').toLowerCase();
      const kpiName = (kpiItem.kpi || '').toLowerCase();
      const cat = (kpiItem.kpiCategory || '').toLowerCase();

      // Department keyword matching
      switch (node.id) {
        case 'sm-production':
        case 'm-production-pu':
          return lead.includes('ops') || lead.includes('maint') || sec.includes('ops') || 
                 lead.includes('all') || kpiName.includes('availability') || kpiName.includes('dispatch') || 
                 kpiName.includes('coal') || kpiName.includes('ta') || kpiName.includes('safe');

        case 'sm-commercial':
          return lead.includes('scm') || lead.includes('commercial') || lead.includes('bd') || 
                 sec.includes('operating committee') || lead.includes('all') ||
                 kpiName.includes('profit') || kpiName.includes('coal') || kpiName.includes('dispatch');

        case 'sm-ei':
        case 'm-electrical':
        case 'm-instrument':
          return lead.includes('e&i') || sec.includes('e&i') || lead.includes('all') ||
                 kpiName.includes('spares') || kpiName.includes('ta') || kpiName.includes('safe');

        case 'sm-mech-maint':
        case 'm-equipment':
        case 'm-machinery':
        case 'm-planning':
          return lead.includes('maint') || sec.includes('maint') || lead.includes('all') ||
                 kpiName.includes('availability') || kpiName.includes('spares') || 
                 kpiName.includes('ta') || kpiName.includes('safe');

        default:
          return true;
      }
    },

    getFilteredKpis() {
      const activeNode = this.findNode(this.state.activeNodeId);
      const query = (this.state.searchQuery || '').trim().toLowerCase();
      const catFilter = this.state.activeCategoryFilter;

      return (this.state.kpis || []).filter(item => {
        // 1. Organogram node filter
        if (activeNode && activeNode.id !== 'coo') {
          if (!this.isKpiInNodeScope(item, activeNode)) return false;
        }

        // 2. Category filter
        if (catFilter !== 'all') {
          const itemCat = (item.kpiCategory || '').toLowerCase();
          if (catFilter === 'business' && !itemCat.includes('business')) return false;
          if (catFilter === 'savings' && !itemCat.includes('saving')) return false;
          if (catFilter === 'pi' && !itemCat.includes('process') && !itemCat.includes('pi')) return false;
        }

        // 3. Search query
        if (query) {
          const matchStr = `${item.kpi} ${item.mainCategory} ${item.kpiCategory} ${item.leadDept} ${item.secondaryStakeholders} ${item.target100} ${item.minTarget95} ${item.stretchTarget110}`.toLowerCase();
          if (!matchStr.includes(query)) return false;
        }

        return true;
      });
    },

    onCooClick() {
      this.state.activeNodeId = 'coo';
      this.openCooHighlightsPopup();
    },

    toggleBranch(branchId) {
      if (!this.state.collapsedBranches) {
        this.state.collapsedBranches = {};
      }
      this.state.collapsedBranches[branchId] = !this.state.collapsedBranches[branchId];
      this.state.activeNodeId = branchId;
      this.renderOrganogram();
      this.renderScorecard();
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    expandAll() {
      if (!this.state.collapsedBranches) {
        this.state.collapsedBranches = {};
      }
      this.state.collapsedBranches['sm-production'] = false;
      this.state.collapsedBranches['sm-commercial'] = false;
      this.state.collapsedBranches['sm-ei'] = false;
      this.state.collapsedBranches['sm-mech-maint'] = false;
      this.renderOrganogram();
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    collapseAll() {
      if (!this.state.collapsedBranches) {
        this.state.collapsedBranches = {};
      }
      this.state.collapsedBranches['sm-production'] = true;
      this.state.collapsedBranches['sm-commercial'] = true;
      this.state.collapsedBranches['sm-ei'] = true;
      this.state.collapsedBranches['sm-mech-maint'] = true;
      this.renderOrganogram();
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    printOrganogram() {
      window.print();
    },

    selectOrganogramNode(nodeId) {
      this.state.activeNodeId = nodeId;
      if (nodeId === 'coo') {
        // Direct click on COO FPCL opens the full Google Sheet Scorecard Table modal
        this.openCooHighlightsPopup();
        return;
      }
      this.renderOrganogram();
      this.renderScorecard();
      this.renderExecutiveSummaryCards();
      this.renderAnalyticsCharts();

      // Re-trigger lucide icons
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    openCooHighlightsPopup() {
      this.state.isCooPopupOpen = true;
      this.state.activeNodeId = 'coo';
      const modal = document.getElementById('kpi-coo-highlights-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.style.removeProperty('display');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
      this.renderCooHighlightsPopup();
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    closeCooHighlightsPopup() {
      this.state.isCooPopupOpen = false;
      const modal = document.getElementById('kpi-coo-highlights-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modal.style.display = 'none';
      }
      const suiteModal = document.getElementById('kpis-suite-modal');
      if (suiteModal && !suiteModal.classList.contains('hidden')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    },

    setPopupSearchQuery(q) {
      this.state.popupSearchQuery = q || '';
      this.renderCooPopupScorecard();
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    setPopupCategoryFilter(cat) {
      this.state.popupCategoryFilter = cat;
      this.renderCooPopupCategoryTabs();
      this.renderCooPopupScorecard();
      this.renderCooPopupAnalytics();
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    getCooPopupFilteredKpis() {
      const query = (this.state.popupSearchQuery || '').trim().toLowerCase();
      const catFilter = this.state.popupCategoryFilter || 'all';

      return (this.state.kpis || []).filter(item => {
        if (catFilter !== 'all') {
          const itemCat = (item.kpiCategory || '').toLowerCase();
          if (catFilter === 'business' && !itemCat.includes('business')) return false;
          if (catFilter === 'savings' && !itemCat.includes('saving')) return false;
          if (catFilter === 'pi' && !itemCat.includes('process') && !itemCat.includes('pi')) return false;
        }

        if (query) {
          const matchStr = `${item.kpi} ${item.mainCategory} ${item.kpiCategory} ${item.leadDept} ${item.secondaryStakeholders} ${item.target100} ${item.minTarget95} ${item.stretchTarget110}`.toLowerCase();
          if (!matchStr.includes(query)) return false;
        }

        return true;
      });
    },

    renderCooHighlightsPopup() {
      this.renderExecutiveSummaryCards('kpi-popup-summary-cards');
      this.renderCooPopupAnalytics();
      this.renderCooPopupCategoryTabs();
      this.renderCooPopupScorecard();
    },

    renderCooPopupAnalytics() {
      const container = document.getElementById('kpi-popup-analytics-section');
      if (!container) return;

      const items = this.getCooPopupFilteredKpis();
      const totalWeight = items.reduce((acc, k) => acc + (k.weightageNum || 0), 0);

      let bizWeight = 0;
      let savWeight = 0;
      let piWeight = 0;

      items.forEach(k => {
        const c = (k.kpiCategory || '').toLowerCase();
        if (c.includes('saving')) savWeight += (k.weightageNum || 0);
        else if (c.includes('process') || c.includes('pi')) piWeight += (k.weightageNum || 0);
        else bizWeight += (k.weightageNum || 0);
      });

      container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Weightage Distribution Bar -->
          <div class="p-4 bg-white border border-amber-200/80 rounded-2xl shadow-xs lg:col-span-2 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                  <i data-lucide="bar-chart-2" class="w-3.5 h-3.5 text-amber-600"></i>
                  <span>Corporate KPI Weightage Horizon (100% Weightage)</span>
                </h4>
                <p class="text-[11px] text-slate-500">Governance balance across Business Results, Strategic Savings &amp; Process Improvements</p>
              </div>
              <span class="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-50 text-amber-900 border border-amber-300">
                Filtered Total: ${totalWeight}%
              </span>
            </div>

            <div class="h-6 w-full rounded-xl bg-slate-100 flex overflow-hidden p-0.5 shadow-inner">
              <div style="width: ${bizWeight > 0 ? (bizWeight / (totalWeight || 1) * 100) : 0}%" class="h-full bg-blue-600 rounded-l-lg transition-all flex items-center justify-center text-[10px] text-white font-bold" title="Business Results: ${bizWeight}%">
                ${bizWeight > 0 ? `${bizWeight}%` : ''}
              </div>
              <div style="width: ${savWeight > 0 ? (savWeight / (totalWeight || 1) * 100) : 0}%" class="h-full bg-emerald-600 transition-all flex items-center justify-center text-[10px] text-white font-bold" title="Savings: ${savWeight}%">
                ${savWeight > 0 ? `${savWeight}%` : ''}
              </div>
              <div style="width: ${piWeight > 0 ? (piWeight / (totalWeight || 1) * 100) : 0}%" class="h-full bg-purple-600 rounded-r-lg transition-all flex items-center justify-center text-[10px] text-white font-bold" title="Process Improvements: ${piWeight}%">
                ${piWeight > 0 ? `${piWeight}%` : ''}
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 pt-1 text-[11px]">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-blue-600 shrink-0"></span>
                <span class="text-slate-700 font-semibold">Business Results: <strong>${bizWeight}%</strong></span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-emerald-600 shrink-0"></span>
                <span class="text-slate-700 font-semibold">Savings: <strong>${savWeight}%</strong></span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-purple-600 shrink-0"></span>
                <span class="text-slate-700 font-semibold">Process Improvements: <strong>${piWeight}%</strong></span>
              </div>
            </div>
          </div>

          <!-- Governance Mandate Card -->
          <div class="p-4 bg-gradient-to-br from-amber-950 via-slate-900 to-amber-900 text-white rounded-2xl shadow-xs space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-400"></i>
                COO Executive Governance
              </span>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-mono bg-white/10 text-amber-200">Live Synchronized</span>
            </div>
            <h5 class="text-sm font-bold text-white tracking-tight">Scope: Chief Operating Officer (COO FPCL)</h5>
            <p class="text-[11px] text-amber-100/80 leading-relaxed">
              Consolidated 100% corporate scorecard reflecting all core business, thermal efficiency, cost optimization, reliability and safety targets.
            </p>
            <div class="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span class="text-slate-300">Total Filtered Metrics:</span>
              <span class="font-extrabold text-amber-300 text-xs">${items.length} Corporate KPIs</span>
            </div>
          </div>
        </div>
      `;
    },

    renderCooPopupCategoryTabs() {
      const container = document.getElementById('kpi-popup-category-tabs');
      if (!container) return;

      const current = this.state.popupCategoryFilter || 'all';
      const tabs = [
        { id: 'all', label: 'All Categories (100% Weight)', activeClass: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-xs border-transparent' },
        { id: 'business', label: 'Business Results (30%)', activeClass: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs border-transparent' },
        { id: 'savings', label: 'Strategic Savings (54%)', activeClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs border-transparent' },
        { id: 'pi', label: 'Process Improvements (16%)', activeClass: 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-xs border-transparent' }
      ];

      container.innerHTML = tabs.map(t => {
        const isActive = current === t.id;
        return `
          <button
            type="button"
            onclick="FPCL_KPI_SUITE.setPopupCategoryFilter('${t.id}')"
            class="px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border
              ${isActive ? t.activeClass : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200 shadow-2xs'}"
          >
            ${t.label}
          </button>
        `;
      }).join('');
    },

    renderCooPopupScorecard() {
      const container = document.getElementById('kpi-popup-matrix-container');
      if (!container) return;

      const items = this.getCooPopupFilteredKpis();

      if (items.length === 0) {
        container.innerHTML = `
          <div class="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
            <i data-lucide="search-x" class="w-10 h-10 text-slate-300 mx-auto mb-2"></i>
            <h4 class="text-sm font-bold text-slate-700">No Corporate KPIs Match Current Filter</h4>
            <p class="text-xs text-slate-500 mt-1">Try resetting the search or category filter.</p>
            <button
              type="button"
              onclick="FPCL_KPI_SUITE.setPopupCategoryFilter('all'); FPCL_KPI_SUITE.setPopupSearchQuery('');"
              class="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
          <!-- Colorful Table Header Ribbon -->
          <div class="p-4 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div class="flex items-center gap-2.5">
              <span class="p-2 rounded-xl bg-white/20 text-white shadow-2xs">
                <i data-lucide="table" class="w-5 h-5"></i>
              </span>
              <div>
                <h4 class="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                  <span>COO FPCL Corporate KPI Master Scorecard</span>
                </h4>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick="FPCL_KPI_SUITE.exportCsv()"
                class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-amber-50 text-amber-950 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Download CSV"
              >
                <i data-lucide="download" class="w-3.5 h-3.5 text-amber-700"></i>
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onclick="FPCL_KPI_SUITE.printReport()"
                class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/30 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Print Report"
              >
                <i data-lucide="printer" class="w-3.5 h-3.5 text-white"></i>
                <span>Print</span>
              </button>
            </div>
          </div>

          <!-- The Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="text-[11px] font-black uppercase tracking-wider text-slate-700 border-b border-slate-200">
                  <th class="py-3 px-3.5 w-12 text-center bg-slate-100/90 text-slate-700">Sr</th>
                  <th class="py-3 px-3.5 bg-blue-50/90 text-blue-950 border-l border-blue-200/80" style="min-width: 150px;">Category &amp; Weight</th>
                  <th class="py-3 px-3.5 bg-indigo-50/90 text-indigo-950 border-l border-indigo-200/80" style="min-width: 260px;">KPI Name &amp; Strategic Scope</th>
                  <th class="py-3 px-3.5 bg-slate-100/90 text-slate-800 border-l border-slate-200" style="min-width: 140px;">Lead Department</th>
                  <th class="py-3 px-3.5 bg-rose-100/90 text-rose-950 border-l border-rose-200 text-center" style="min-width: 140px;">
                    <div class="flex items-center justify-center gap-1">
                      <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-rose-600"></i>
                      <span>Threshold (-95%)</span>
                    </div>
                  </th>
                  <th class="py-3 px-3.5 bg-blue-100/90 text-blue-950 border-l border-blue-200 text-center" style="min-width: 150px;">
                    <div class="flex items-center justify-center gap-1">
                      <i data-lucide="target" class="w-3.5 h-3.5 text-blue-600"></i>
                      <span>Budget Plan (100%)</span>
                    </div>
                  </th>
                  <th class="py-3 px-3.5 bg-emerald-100/90 text-emerald-950 border-l border-emerald-200 text-center" style="min-width: 150px;">
                    <div class="flex items-center justify-center gap-1">
                      <i data-lucide="award" class="w-3.5 h-3.5 text-emerald-700"></i>
                      <span>Stretch Target (110%)</span>
                    </div>
                  </th>
                  <th class="py-3 px-3.5 bg-slate-100/90 text-slate-800 border-l border-slate-200 text-center" style="min-width: 90px;">Unit</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${items.map((k, idx) => {
                  const isSavings = (k.kpiCategory || '').toLowerCase().includes('saving');
                  const isProcess = (k.kpiCategory || '').toLowerCase().includes('process') || (k.kpiCategory || '').toLowerCase().includes('pi');
                  const isBiz = !isSavings && !isProcess;

                  let catBadgeClass = 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-900 border-blue-300';
                  let catIcon = 'trending-up';
                  let weightPillClass = 'bg-blue-600 text-white';
                  let iconBgClass = 'from-blue-500 to-indigo-600 text-white shadow-blue-500/20';
                  let rowHoverClass = 'hover:bg-blue-50/40';

                  if (isSavings) {
                    catBadgeClass = 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-950 border-emerald-300';
                    catIcon = 'leaf';
                    weightPillClass = 'bg-emerald-600 text-white';
                    iconBgClass = 'from-emerald-500 to-teal-600 text-white shadow-emerald-500/20';
                    rowHoverClass = 'hover:bg-emerald-50/40';
                  } else if (isProcess) {
                    catBadgeClass = 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-950 border-purple-300';
                    catIcon = 'sliders';
                    weightPillClass = 'bg-purple-600 text-white';
                    iconBgClass = 'from-purple-500 to-violet-600 text-white shadow-purple-500/20';
                    rowHoverClass = 'hover:bg-purple-50/40';
                  }

                  return `
                    <tr class="${rowHoverClass} transition-colors group">
                      <!-- Sr -->
                      <td class="py-3.5 px-3.5 text-center font-mono font-bold text-slate-500 bg-slate-50/40">
                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-200/80 text-slate-800 text-xs font-black">
                          ${k.sr}
                        </span>
                      </td>

                      <!-- Category & Weight -->
                      <td class="py-3.5 px-3.5 whitespace-nowrap border-l border-slate-100">
                        <div class="flex flex-col gap-1.5 items-start">
                          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black border shadow-2xs ${catBadgeClass}">
                            <i data-lucide="${catIcon}" class="w-3 h-3"></i>
                            ${k.kpiCategory}
                          </span>
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black shadow-2xs ${weightPillClass}">
                            <span>Weight:</span>
                            <span class="font-black">${k.weightage}</span>
                          </span>
                        </div>
                      </td>

                      <!-- KPI Title & Strategic Scope -->
                      <td class="py-3.5 px-3.5 border-l border-slate-100">
                        <div class="flex items-start gap-3">
                          <div class="w-8 h-8 rounded-xl bg-gradient-to-br ${iconBgClass} flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                            <i data-lucide="${k.icon}" class="w-4 h-4"></i>
                          </div>
                          <div class="min-w-0">
                            <div class="font-black text-slate-900 text-xs sm:text-sm leading-snug tracking-tight">
                              ${k.kpi}
                            </div>
                            <div class="text-[11px] text-slate-500 leading-relaxed mt-0.5 font-medium line-clamp-2">
                              ${k.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      <!-- Lead & Secondary Roles -->
                      <td class="py-3.5 px-3.5 border-l border-slate-100">
                        <div class="space-y-1">
                          <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            <span class="w-2 h-2 rounded-full bg-blue-600"></span>
                            <span>${k.leadDept}</span>
                          </div>
                          ${k.secondaryStakeholders ? `
                            <div class="text-[10px] text-slate-500 font-medium truncate" title="${k.secondaryStakeholders}">
                              Sec: ${k.secondaryStakeholders}
                            </div>
                          ` : ''}
                        </div>
                      </td>

                      <!-- Threshold -95% -->
                      <td class="py-3.5 px-3.5 bg-gradient-to-br from-rose-50/80 to-red-50/40 border-l border-rose-100 text-center">
                        <div class="font-mono text-xs font-black text-rose-950">
                          ${k.minTarget95 || '—'}
                        </div>
                        <div class="mt-1">
                          <span class="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-700 bg-rose-100/90 px-1.5 py-0.5 rounded border border-rose-200">
                            Min 95%
                          </span>
                        </div>
                      </td>

                      <!-- Budget Plan (100%) -->
                      <td class="py-3.5 px-3.5 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 border-l border-blue-100 text-center">
                        <div class="font-mono text-xs font-black text-blue-950">
                          ${k.target100 || '—'}
                        </div>
                        <div class="mt-1">
                          <span class="inline-flex items-center gap-0.5 text-[9px] font-black text-blue-800 bg-blue-100/90 px-1.5 py-0.5 rounded border border-blue-300">
                            Target 100%
                          </span>
                        </div>
                      </td>

                      <!-- Stretch Target (110%) -->
                      <td class="py-3.5 px-3.5 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 border-l border-emerald-100 text-center">
                        <div class="font-mono text-xs font-black text-emerald-950">
                          ${k.stretchTarget110 || '—'}
                        </div>
                        <div class="mt-1">
                          <span class="inline-flex items-center gap-1 text-[9px] font-black text-emerald-900 bg-emerald-200/90 px-1.5 py-0.5 rounded border border-emerald-400 shadow-2xs">
                            <i data-lucide="award" class="w-2.5 h-2.5 text-amber-600"></i>
                            Stretch 110%
                          </span>
                        </div>
                      </td>

                      <!-- Unit -->
                      <td class="py-3.5 px-3.5 text-center border-l border-slate-100">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-slate-100 text-slate-800 border border-slate-200 whitespace-nowrap">
                          ${k.unit || '—'}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    setCategoryFilter(cat) {
      this.state.activeCategoryFilter = cat;
      this.renderCategoryTabs();
      this.renderScorecard();
      this.renderAnalyticsCharts();

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    setSearchQuery(q) {
      this.state.searchQuery = q;
      this.renderScorecard();
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    openDrillDown(sr) {
      const item = (this.state.kpis || []).find(k => k.sr === sr || k.kpi === sr);
      if (!item) return;
      this.state.selectedKpiForDrillDown = item;
      this.renderDrillDownModal(item);
    },

    closeDrillDown() {
      this.state.selectedKpiForDrillDown = null;
      const modal = document.getElementById('kpi-drilldown-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    },

    renderDrillDownModal(item) {
      const modal = document.getElementById('kpi-drilldown-modal');
      if (!modal) return;

      const titleEl = document.getElementById('kpi-modal-title');
      const catEl = document.getElementById('kpi-modal-category');
      const bodyEl = document.getElementById('kpi-modal-body');

      if (titleEl) titleEl.textContent = item.kpi;
      if (catEl) catEl.innerHTML = `
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          ${item.kpiCategory} • Weight: ${item.weightage}
        </span>
      `;

      if (bodyEl) {
        bodyEl.innerHTML = `
          <div class="space-y-4 text-xs sm:text-sm">
            <!-- Strategic Overview Card -->
            <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div class="text-[11px] font-bold uppercase tracking-wider text-slate-500">KPI Objective & Overview</div>
              <p class="text-slate-700 leading-relaxed font-medium">${item.description}</p>
            </div>

            <!-- Target 3-Tier Horizon -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
                <div class="text-[10px] font-bold uppercase text-rose-700 tracking-wider flex items-center justify-between">
                  <span>Threshold</span>
                  <span class="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-mono text-[9px]">-95%</span>
                </div>
                <div class="mt-1.5 text-sm font-extrabold text-rose-950">${item.minTarget95 || '—'}</div>
                <div class="text-[10px] text-rose-700/80 mt-0.5">Minimum operational baseline</div>
              </div>

              <div class="p-3 bg-blue-50/70 border border-blue-200 rounded-xl ring-2 ring-blue-500/20">
                <div class="text-[10px] font-bold uppercase text-blue-700 tracking-wider flex items-center justify-between">
                  <span>Budget Target</span>
                  <span class="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[9px]">100% BP</span>
                </div>
                <div class="mt-1.5 text-sm font-extrabold text-blue-950">${item.target100 || '—'}</div>
                <div class="text-[10px] text-blue-700/80 mt-0.5">Business Plan 2026 Commitment</div>
              </div>

              <div class="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <div class="text-[10px] font-bold uppercase text-emerald-700 tracking-wider flex items-center justify-between">
                  <span>Stretch Target</span>
                  <span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[9px]">110%</span>
                </div>
                <div class="mt-1.5 text-sm font-extrabold text-emerald-950">${item.stretchTarget110 || '—'}</div>
                <div class="text-[10px] text-emerald-700/80 mt-0.5">Executive Excellence Milestone</div>
              </div>
            </div>

            <!-- Departmental Governance -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="p-3 bg-white border border-slate-200 rounded-xl">
                <div class="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Lead Responsibility</div>
                <div class="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <i data-lucide="building-2" class="w-4 h-4 text-blue-600"></i>
                  <span>${item.leadDept}</span>
                </div>
                <div class="text-[10px] text-slate-500 mt-1">Direct primary accountability for KPI delivery.</div>
              </div>

              <div class="p-3 bg-white border border-slate-200 rounded-xl">
                <div class="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Secondary Stakeholders</div>
                <div class="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <i data-lucide="users" class="w-4 h-4 text-indigo-600"></i>
                  <span>${item.secondaryStakeholders || 'Corporate Operating Committee / All'}</span>
                </div>
                <div class="text-[10px] text-slate-500 mt-1">Cross-functional review & alignment partners.</div>
              </div>
            </div>

            <!-- Organogram Alignment -->
            <div class="p-3 bg-gradient-to-r from-amber-50 to-blue-50 border border-amber-200/80 rounded-xl">
              <div class="text-[10px] font-bold uppercase text-amber-800 tracking-wider flex items-center gap-1">
                <i data-lucide="git-branch" class="w-3.5 h-3.5 text-amber-700"></i>
                <span>Executive Governance Hierarchy</span>
              </div>
              <div class="mt-2 text-xs text-slate-800 space-y-1">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded font-bold bg-amber-200 text-amber-900 text-[10px]">COO FPCL</span>
                  <span class="text-slate-400">➔</span>
                  <span class="font-medium text-slate-700">Senior Managers (${item.leadDept})</span>
                  <span class="text-slate-400">➔</span>
                  <span class="font-medium text-slate-600">Plant Unit Managers</span>
                </div>
                <div class="text-[11px] text-slate-600 mt-1">
                  Overall strategic governance held by COO FPCL with operational execution delegated to Senior Managers.
                </div>
              </div>
            </div>
          </div>
        `;
      }

      modal.classList.remove('hidden');
      modal.classList.add('flex');

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    exportCsv() {
      const items = this.getFilteredKpis();
      if (!items || items.length === 0) return;

      const headers = ['Sr', 'Main Category', 'Category', 'KPI', 'Weightage', 'Lead Department', 'Secondary Stakeholders', 'Threshold (-95%)', 'Budget Target (100%)', 'Stretch Target (110%)', 'Unit'];
      const rows = items.map(k => [
        `"${k.sr || ''}"`,
        `"${(k.mainCategory || '').replace(/"/g, '""')}"`,
        `"${(k.kpiCategory || '').replace(/"/g, '""')}"`,
        `"${(k.kpi || '').replace(/"/g, '""')}"`,
        `"${k.weightage || ''}"`,
        `"${(k.leadDept || '').replace(/"/g, '""')}"`,
        `"${(k.secondaryStakeholders || '').replace(/"/g, '""')}"`,
        `"${(k.minTarget95 || '').replace(/"/g, '""')}"`,
        `"${(k.target100 || '').replace(/"/g, '""')}"`,
        `"${(k.stretchTarget110 || '').replace(/"/g, '""')}"`,
        `"${(k.unit || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `FPCL_KPIs_Scorecard_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    exportJson() {
      const items = this.getFilteredKpis();
      const jsonContent = JSON.stringify({
        portal: 'FFBL Power Company Limited',
        report: 'Executive KPIs & Organogram Scorecard',
        generatedAt: new Date().toISOString(),
        activeHierarchyNode: this.state.activeNodeId,
        items
      }, null, 2);

      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `FPCL_KPIs_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    printReport() {
      window.print();
    },

    updateSyncUI() {
      const syncBtn = document.getElementById('kpi-sync-btn');
      const syncIcon = document.getElementById('kpi-sync-icon');
      const syncTimeEl = document.getElementById('kpi-last-sync-time');

      if (syncIcon) {
        if (this.state.isSyncing) {
          syncIcon.classList.add('animate-spin');
        } else {
          syncIcon.classList.remove('animate-spin');
        }
      }

      if (syncTimeEl) {
        syncTimeEl.textContent = this.state.lastSynced;
      }
    },

    renderOrganogram() {
      const container = document.getElementById('kpi-organogram-container');
      if (!container) return;

      const activeId = this.state.activeNodeId || 'coo';
      const isCooActive = activeId === 'coo';
      const root = ORGANIZATION_DATA;
      const collapsed = this.state.collapsedBranches || {};

      container.innerHTML = `
        <div class="w-full max-w-7xl mx-auto flex flex-col items-center select-none py-2 px-2 sm:px-4">
          <!-- A Header Above the Chart -->
          <div class="w-full mb-8 bg-white/90 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 class="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>FPCL Operations Organogram</span>
                <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">Interactive</span>
              </h2>
              <p class="text-xs sm:text-[13px] text-slate-500 font-medium mt-0.5">Performance Management Structure</p>
            </div>

            <!-- Legend & Toolbar -->
            <div class="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <!-- Small Legend -->
              <div class="flex flex-wrap items-center gap-2.5 text-[11px] font-medium text-slate-600 bg-slate-50/90 px-3 py-1.5 rounded-xl border border-slate-200/80">
                <div class="flex items-center gap-1.5">
                  <span class="w-4 h-0.5 bg-slate-400 rounded-full inline-block"></span>
                  <span>Direct reporting</span>
                </div>
                <span class="text-slate-300">•</span>
                <div class="flex items-center gap-1.5">
                  <span class="w-4 border-t-2 border-dashed border-indigo-400 inline-block"></span>
                  <span>Functional reporting</span>
                </div>
                <span class="text-slate-300 hidden sm:inline">•</span>
                <div class="hidden sm:flex items-center gap-2" title="Department Color System">
                  <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800">
                    <span class="w-2 h-2 rounded-full bg-[#059669]"></span> Production
                  </span>
                  <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-800">
                    <span class="w-2 h-2 rounded-full bg-[#4F46E5]"></span> Commercial
                  </span>
                  <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800">
                    <span class="w-2 h-2 rounded-full bg-[#D97706]"></span> E&amp;I
                  </span>
                  <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-800">
                    <span class="w-2 h-2 rounded-full bg-[#E11D48]"></span> Mechanical
                  </span>
                </div>
              </div>

              <!-- Toolbar Buttons -->
              <div class="flex items-center gap-1.5 no-print">
                <button
                  type="button"
                  onclick="FPCL_KPI_SUITE.expandAll()"
                  class="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="Expand all subordinate teams"
                >
                  Expand all
                </button>
                <button
                  type="button"
                  onclick="FPCL_KPI_SUITE.collapseAll()"
                  class="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="Collapse all subordinate teams"
                >
                  Collapse all
                </button>
                <button
                  type="button"
                  onclick="FPCL_KPI_SUITE.printOrganogram()"
                  class="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title="Print / Save as PDF in Landscape"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                  <span>Print / Save as PDF</span>
                </button>
              </div>
            </div>
          </div>

          <!-- LEVEL 1: COO FPCL CARD -->
          <div class="org-anim-level-1 relative flex flex-col items-center">
            <div
              role="button"
              tabindex="0"
              onclick="FPCL_KPI_SUITE.openCooHighlightsPopup()"
              onkeydown="if(event.key==='Enter'||event.key===' ')FPCL_KPI_SUITE.openCooHighlightsPopup()"
              class="org-card-hover group relative flex flex-col p-5 rounded-2xl cursor-pointer text-left overflow-hidden border transition-all duration-200"
              style="width: 375px; max-width: 100%; background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #312E81 100%); border-color: rgba(245, 158, 11, 0.45); box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.4), 0 8px 10px -6px rgba(15, 23, 42, 0.3);"
              title="Executive Scope: COO FPCL • Click to open Corporate KPI Scorecard Table"
            >
              <!-- Top Ribbon: Weightage Badge with Tooltip & Subordinates Chip -->
              <div class="flex items-center justify-between gap-2 mb-3.5">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/30 cursor-help"
                  title="Weightage in the corporate KPI scorecard"
                  data-tooltip="Weightage in the corporate KPI scorecard"
                >
                  ${SVG_ICONS.crown}
                  <span>${root.tag}</span>
                </span>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/10 text-slate-300 border border-white/10">
                  ${root.subordinatesCount} subordinates
                </span>
              </div>

              <!-- Header Info with Circular Badge -->
              <div class="flex items-start gap-3.5 w-full cursor-pointer" onclick="FPCL_KPI_SUITE.openCooHighlightsPopup()">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  ${SVG_ICONS.crown}
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg sm:text-[19px] font-bold text-white tracking-tight leading-tight">
                    ${root.title}
                  </h3>
                  <p class="text-[13px] text-slate-300 font-medium mt-0.5">${root.subtitle}</p>
                </div>
              </div>

              <!-- Corporate KPI Scorecard Table Action -->
              <div class="mt-4 pt-3 border-t border-white/15 w-full flex items-center justify-between text-xs font-semibold">
                <button
                  type="button"
                  onclick="event.stopPropagation(); FPCL_KPI_SUITE.openCooHighlightsPopup()"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-amber-300 bg-white/10 hover:bg-white/20 border border-amber-400/30 transition-all cursor-pointer shadow-xs active:scale-95 text-xs font-bold"
                  title="Open Corporate KPI Scorecard Table"
                >
                  ${SVG_ICONS.table}
                  <span>Corporate KPI Scorecard Table</span>
                </button>
                <span class="text-amber-300/80 text-[11px] font-medium hidden sm:inline">
                  Click to open
                </span>
              </div>
            </div>

            <!-- Vertical trunk down from COO -->
            <div class="w-0.5 h-6 bg-slate-300 relative">
              <div class="w-2 h-2 rounded-full bg-slate-400 absolute bottom-0 -left-[3px]"></div>
            </div>
          </div>

          <!-- DESKTOP HORIZONTAL TREE (Width >= 900px) -->
          <div class="hidden min-[900px]:flex flex-col items-center w-full max-w-7xl">
            <!-- Connecting Bus Bar to Senior Managers -->
            <div class="w-[78%] h-6 relative">
              <div class="h-0.5 bg-slate-300 w-full relative top-0">
                <!-- Drop into Col 1 (Production) -->
                <div class="absolute left-0 top-0 w-0.5 h-6 bg-slate-300">
                  <div class="w-1.5 h-1.5 rounded-full bg-slate-400 absolute bottom-0 -left-[2px]"></div>
                </div>
                <!-- Drop into Col 2 (Commercial) -->
                <div class="absolute left-[33.33%] top-0 w-0.5 h-6 bg-slate-300">
                  <div class="w-1.5 h-1.5 rounded-full bg-slate-400 absolute bottom-0 -left-[2px]"></div>
                </div>
                <!-- Drop into Col 3 (E&I) -->
                <div class="absolute left-[66.66%] top-0 w-0.5 h-6 bg-slate-300">
                  <div class="w-1.5 h-1.5 rounded-full bg-slate-400 absolute bottom-0 -left-[2px]"></div>
                </div>
                <!-- Drop into Col 4 (Mechanical) -->
                <div class="absolute right-0 top-0 w-0.5 h-6 bg-slate-300">
                  <div class="w-1.5 h-1.5 rounded-full bg-slate-400 absolute bottom-0 -left-[2px]"></div>
                </div>
              </div>
            </div>

            <!-- The 4 Columns Grid -->
            <div class="grid grid-cols-4 gap-5 w-full mt-2">
              ${root.children.map((sm, colIdx) => {
                const isBranchCollapsed = collapsed[sm.id] === true;
                const isColActive = activeId === sm.id;

                return `
                  <!-- COLUMN: ${sm.department} -->
                  <div class="org-anim-level-2 flex flex-col items-center w-full" style="animation-delay: ${0.08 * (colIdx + 1)}s">
                    <!-- LEVEL 2: Senior Manager Card -->
                    <div
                      role="button"
                      tabindex="0"
                      aria-expanded="${!isBranchCollapsed}"
                      onclick="FPCL_KPI_SUITE.toggleBranch('${sm.id}')"
                      onkeydown="if(event.key==='Enter'||event.key===' ')FPCL_KPI_SUITE.toggleBranch('${sm.id}')"
                      class="org-card-hover group relative flex flex-col justify-between w-full p-4 rounded-2xl bg-white border border-slate-200/90 shadow-md cursor-pointer transition-all duration-200 overflow-hidden ${isColActive ? 'ring-2 ring-indigo-500/40' : ''}"
                      style="border-top: 4px solid ${sm.borderTop}; min-height: 140px;"
                    >
                      <!-- Top Tag & Subordinates Pill -->
                      <div class="flex items-center justify-between gap-1 mb-2.5">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider" style="background-color: ${sm.tagBg}; color: ${sm.tagText}; border: 1px solid ${sm.tagBorder};">
                          ${sm.tag}
                        </span>
                        <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <span>${sm.subordinatesCount} ${sm.subordinatesCount === 1 ? 'subordinate' : 'subordinates'}</span>
                          <span class="transition-transform duration-200 text-slate-400 ${isBranchCollapsed ? '' : 'rotate-180'}">
                            ${SVG_ICONS.chevronDown}
                          </span>
                        </span>
                      </div>

                      <!-- Circular Icon Badge & Title -->
                      <div class="flex items-start gap-3 w-full">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform" style="background-color: ${sm.bgTint}; color: ${sm.color}; border: 1px solid ${sm.borderTint};">
                          ${SVG_ICONS[sm.icon] || ''}
                        </div>
                        <div class="min-w-0 flex-1">
                          <h4 class="text-[15px] font-bold text-slate-900 leading-snug break-words">
                            ${sm.title}
                          </h4>
                          <p class="text-[13px] text-slate-500 font-medium mt-0.5 break-words">${sm.subtitle}</p>
                        </div>
                      </div>
                    </div>

                    <!-- LEVEL 3: Subordinates Container with Smooth Animation -->
                    <div class="w-full flex flex-col items-center transition-all duration-300 ease-in-out ${isBranchCollapsed ? 'max-h-0 opacity-0 overflow-hidden pointer-events-none' : 'max-h-[800px] opacity-100 overflow-visible mt-2'}">
                      <!-- Connector line from Senior Manager to Manager(s) -->
                      <div class="w-0.5 h-4 ${sm.id === 'sm-commercial' ? 'border-l-2 border-dashed border-indigo-400' : 'bg-slate-300'} relative">
                        <div class="w-1.5 h-1.5 rounded-full ${sm.id === 'sm-commercial' ? 'bg-indigo-400' : 'bg-slate-400'} absolute bottom-0 -left-[2px]"></div>
                      </div>

                      <!-- Stacked Managers -->
                      <div class="w-full space-y-2.5">
                        ${sm.children.map(m => {
                          const isMActive = activeId === m.id;

                          if (m.dashedCard) {
                            // Commercial & Fuel Portfolio (Functional dashed card, NO ICON as strictly requested)
                            return `
                              <div
                                role="button"
                                tabindex="0"
                                onclick="FPCL_KPI_SUITE.selectOrganogramNode('${m.id}')"
                                onkeydown="if(event.key==='Enter'||event.key===' ')FPCL_KPI_SUITE.selectOrganogramNode('${m.id}')"
                                class="org-card-hover group relative flex flex-col p-3.5 rounded-2xl border-2 border-dashed border-[#C7D2FE] bg-[#F5F3FF] cursor-pointer transition-all duration-150 overflow-hidden shadow-2xs ${isMActive ? 'ring-2 ring-indigo-500/40' : ''}"
                              >
                                <div class="flex items-center justify-between gap-1 mb-1.5">
                                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white text-indigo-800 border border-indigo-200">
                                    ${m.tag}
                                  </span>
                                  <span class="text-[10px] font-semibold text-indigo-700">Functional</span>
                                </div>
                                <div>
                                  <h5 class="text-[13px] font-bold text-slate-900 leading-snug break-words">${m.title}</h5>
                                  <p class="text-[12px] text-slate-500 font-medium mt-0.5 break-words">${m.subtitle}</p>
                                </div>
                              </div>
                            `;
                          }

                          // Regular Manager Card (Lighter tinted parent color, subtle shadow, circular icon)
                          return `
                            <div
                              role="button"
                              tabindex="0"
                              onclick="FPCL_KPI_SUITE.selectOrganogramNode('${m.id}')"
                              onkeydown="if(event.key==='Enter'||event.key===' ')FPCL_KPI_SUITE.selectOrganogramNode('${m.id}')"
                              class="org-card-hover group relative flex items-center gap-3 w-full p-3 rounded-2xl border border-slate-200/80 cursor-pointer transition-all duration-150 overflow-hidden shadow-xs ${isMActive ? 'ring-2 ring-indigo-500/40' : ''}"
                              style="background-color: ${m.cardBg}; border-color: ${m.cardBorder};"
                            >
                              <div class="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-2xs" style="color: ${sm.color}; border: 1px solid ${sm.borderTint};">
                                ${SVG_ICONS[m.icon] || ''}
                              </div>
                              <div class="min-w-0 flex-1">
                                <h5 class="text-[13px] font-bold text-slate-900 leading-snug truncate">${m.title}</h5>
                                <p class="text-[11px] text-slate-500 font-medium truncate mt-0.5">${m.subtitle}</p>
                              </div>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- MOBILE & TABLET VERTICAL INDENTED TREE (Width < 900px) -->
          <div class="flex min-[900px]:hidden flex-col w-full max-w-xl mx-auto space-y-4 mt-2">
            ${root.children.map((sm) => {
              const isBranchCollapsed = collapsed[sm.id] === true;
              const isColActive = activeId === sm.id;

              return `
                <div class="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden" style="border-left: 4px solid ${sm.borderTop};">
                  <!-- Senior Manager Mobile Header -->
                  <div
                    role="button"
                    tabindex="0"
                    aria-expanded="${!isBranchCollapsed}"
                    onclick="FPCL_KPI_SUITE.toggleBranch('${sm.id}')"
                    class="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors ${isColActive ? 'bg-slate-50' : ''}"
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style="background-color: ${sm.bgTint}; color: ${sm.color}; border: 1px solid ${sm.borderTint};">
                        ${SVG_ICONS[sm.icon] || ''}
                      </div>
                      <div class="min-w-0">
                        <div class="flex items-center gap-2">
                          <h4 class="text-sm font-bold text-slate-900 leading-snug truncate">${sm.title}</h4>
                          <span class="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold uppercase" style="background-color: ${sm.tagBg}; color: ${sm.tagText};">
                            ${sm.tag}
                          </span>
                        </div>
                        <p class="text-xs text-slate-500 mt-0.5">${sm.subtitle}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0 text-slate-400">
                      <span class="text-xs font-semibold text-slate-500">${sm.subordinatesCount}</span>
                      <span class="transition-transform duration-200 ${isBranchCollapsed ? '' : 'rotate-180'}">
                        ${SVG_ICONS.chevronDown}
                      </span>
                    </div>
                  </div>

                  <!-- Subordinates Indented List -->
                  <div class="transition-all duration-300 ease-in-out ${isBranchCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[600px] opacity-100 overflow-visible border-t border-slate-100'}">
                    <div class="p-3 pl-8 space-y-2 bg-slate-50/60 relative">
                      <div class="absolute left-5 top-3 bottom-3 w-0.5 ${sm.id === 'sm-commercial' ? 'border-l-2 border-dashed border-indigo-300' : 'bg-slate-300'}"></div>
                      ${sm.children.map(m => {
                        if (m.dashedCard) {
                          return `
                            <div
                              role="button"
                              tabindex="0"
                              onclick="FPCL_KPI_SUITE.selectOrganogramNode('${m.id}')"
                              class="p-2.5 rounded-xl border-2 border-dashed border-[#C7D2FE] bg-[#F5F3FF] cursor-pointer"
                            >
                              <div class="text-xs font-bold text-slate-900">${m.title}</div>
                              <div class="text-[11px] text-slate-500">${m.subtitle}</div>
                            </div>
                          `;
                        }
                        return `
                          <div
                            role="button"
                            tabindex="0"
                            onclick="FPCL_KPI_SUITE.selectOrganogramNode('${m.id}')"
                            class="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2.5 cursor-pointer shadow-2xs"
                          >
                            <div class="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style="color: ${sm.color};">
                              ${SVG_ICONS[m.icon] || ''}
                            </div>
                            <div class="min-w-0 flex-1">
                              <div class="text-xs font-bold text-slate-900 truncate">${m.title}</div>
                              <div class="text-[11px] text-slate-500 truncate">${m.subtitle}</div>
                            </div>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    },

    renderExecutiveSummaryCards(targetId = null) {
      const targetIds = targetId ? [targetId] : ['kpi-summary-cards', 'kpi-popup-summary-cards'];
      const kpis = this.state.kpis || [];
      const netProfit = kpis.find(k => (k.kpi || '').toLowerCase().includes('profit')) || {};
      const plantAvail = kpis.find(k => (k.kpi || '').toLowerCase().includes('availability')) || {};
      const dispatchKe = kpis.find(k => (k.kpi || '').toLowerCase().includes('dispatch')) || {};
      const coalSavings = kpis.find(k => (k.kpi || '').toLowerCase().includes('coal')) || {};
      const sparesReduction = kpis.find(k => (k.kpi || '').toLowerCase().includes('spares')) || {};
      const turnaround = kpis.find(k => (k.kpi || '').toLowerCase().includes('ta') || (k.kpi || '').toLowerCase().includes('planning')) || {};
      const safetyTrir = kpis.find(k => (k.kpi || '').toLowerCase().includes('trir') || (k.kpi || '').toLowerCase().includes('safe')) || {};

      const cardsHtml = `
        <!-- Card 1: Net Profitability -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 border border-blue-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div class="flex items-center justify-between">
              <span class="p-2 rounded-xl bg-blue-100 text-blue-700">
                <i data-lucide="banknote" class="w-4 h-4"></i>
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                Weight: 10%
              </span>
            </div>
            <div class="mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Net Profitability</div>
            <div class="mt-1 text-base sm:text-lg font-black text-slate-900 tracking-tight">
              ${netProfit.target100 || 'PKR 4.88 Billion (BP)'}
            </div>
            <div class="text-[10px] text-slate-500 mt-0.5">Stretch: <strong class="text-blue-700 font-semibold">${netProfit.stretchTarget110 || 'PKR 5.08 Billion'}</strong></div>
          </div>
          <div class="mt-3 pt-2 border-t border-blue-100 flex items-center justify-between text-[10px] text-slate-600">
            <span>Threshold: ${netProfit.minTarget95 || 'PKR 4.6 B'}</span>
            <span class="font-bold text-blue-700">Lead: All</span>
          </div>
        </div>

        <!-- Card 2: Plant Availability -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 border border-emerald-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div class="flex items-center justify-between">
              <span class="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <i data-lucide="activity" class="w-4 h-4"></i>
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                Weight: 15%
              </span>
            </div>
            <div class="mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Plant Availability</div>
            <div class="mt-1 text-base sm:text-lg font-black text-slate-900 tracking-tight">
              ${plantAvail.target100 || '328 days (90%)'}
            </div>
            <div class="text-[10px] text-slate-500 mt-0.5">Stretch: <strong class="text-emerald-700 font-semibold">${plantAvail.stretchTarget110 || '335 days (92%)'}</strong></div>
          </div>
          <div class="mt-3 pt-2 border-t border-emerald-100 flex items-center justify-between text-[10px] text-slate-600">
            <span>Contractual: 310 days</span>
            <span class="font-bold text-emerald-700">Ops, Maint</span>
          </div>
        </div>

        <!-- Card 3: Dispatch KE -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 border border-amber-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div class="flex items-center justify-between">
              <span class="p-2 rounded-xl bg-amber-100 text-amber-700">
                <i data-lucide="zap" class="w-4 h-4"></i>
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                Weight: 5%
              </span>
            </div>
            <div class="mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Dispatch KE</div>
            <div class="mt-1 text-base sm:text-lg font-black text-slate-900 tracking-tight">
              ${dispatchKe.target100 || '170,000 MWh (BP)'}
            </div>
            <div class="text-[10px] text-slate-500 mt-0.5">Stretch: <strong class="text-amber-700 font-semibold">${dispatchKe.stretchTarget110 || '180,000 MWh'}</strong></div>
          </div>
          <div class="mt-3 pt-2 border-t border-amber-100 flex items-center justify-between text-[10px] text-slate-600">
            <span>Threshold: 160,000 MWh</span>
            <span class="font-bold text-amber-700">COO, BD, Eng</span>
          </div>
        </div>

        <!-- Card 4: Local Coal Sourcing -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-orange-50/80 via-white to-orange-50/30 border border-orange-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div class="flex items-center justify-between">
              <span class="p-2 rounded-xl bg-orange-100 text-orange-700">
                <i data-lucide="flame" class="w-4 h-4"></i>
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800">
                Weight: 4%
              </span>
            </div>
            <div class="mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Coal Sourcing Savings</div>
            <div class="mt-1 text-base sm:text-lg font-black text-slate-900 tracking-tight">
              ${coalSavings.target100 || 'PKR 70 Million'}
            </div>
            <div class="text-[10px] text-slate-500 mt-0.5">Stretch: <strong class="text-orange-700 font-semibold">${coalSavings.stretchTarget110 || 'PKR 90 Million'}</strong></div>
          </div>
          <div class="mt-3 pt-2 border-t border-orange-100 flex items-center justify-between text-[10px] text-slate-600">
            <span>Threshold: PKR 50M</span>
            <span class="font-bold text-orange-700">SCM / Comm</span>
          </div>
        </div>

        <!-- Card 5: Spares Optimization -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-cyan-50/80 via-white to-cyan-50/30 border border-cyan-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div class="flex items-center justify-between">
              <span class="p-2 rounded-xl bg-cyan-100 text-cyan-700">
                <i data-lucide="cog" class="w-4 h-4"></i>
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-800">
                Weight: 2%
              </span>
            </div>
            <div class="mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Spares Optimization</div>
            <div class="mt-1 text-base sm:text-lg font-black text-slate-900 tracking-tight">
              ${sparesReduction.target100 || 'PKR 50 Million'}
            </div>
            <div class="text-[10px] text-slate-500 mt-0.5">Stretch: <strong class="text-cyan-700 font-semibold">${sparesReduction.stretchTarget110 || 'PKR 60 Million'}</strong></div>
          </div>
          <div class="mt-3 pt-2 border-t border-cyan-100 flex items-center justify-between text-[10px] text-slate-600">
            <span>Threshold: PKR 40M</span>
            <span class="font-bold text-cyan-700">Maint, E&I</span>
          </div>
        </div>

        <!-- Card 6: TA Planning & Execution -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-purple-50/80 via-white to-purple-50/30 border border-purple-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div class="flex items-center justify-between">
              <span class="p-2 rounded-xl bg-purple-100 text-purple-700">
                <i data-lucide="calendar-check" class="w-4 h-4"></i>
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800">
                Weight: 4%
              </span>
            </div>
            <div class="mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Turnaround (TA) Planning</div>
            <div class="mt-1 text-base sm:text-lg font-black text-slate-900 tracking-tight">
              ${turnaround.target100 || '≤ 48 hrs Delay'}
            </div>
            <div class="text-[10px] text-slate-500 mt-0.5">Stretch: <strong class="text-purple-700 font-semibold">0 Delay / TA-2027 Ready</strong></div>
          </div>
          <div class="mt-3 pt-2 border-t border-purple-100 flex items-center justify-between text-[10px] text-slate-600">
            <span>Threshold: ≤ 96 hrs</span>
            <span class="font-bold text-purple-700">Cross-Plant Team</span>
          </div>
        </div>

        <!-- Card 7: Safe Plant Operations (TRIR) -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-rose-50/80 via-white to-rose-50/30 border border-rose-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div class="flex items-center justify-between">
              <span class="p-2 rounded-xl bg-rose-100 text-rose-700">
                <i data-lucide="shield-check" class="w-4 h-4"></i>
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                Weight: 4%
              </span>
            </div>
            <div class="mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Safe Operations & TRIR</div>
            <div class="mt-1 text-base sm:text-lg font-black text-slate-900 tracking-tight">
              ${safetyTrir.target100 || 'TRIR ≤ 0.65'}
            </div>
            <div class="text-[10px] text-slate-500 mt-0.5">Stretch: <strong class="text-rose-700 font-semibold">${safetyTrir.stretchTarget110 || 'TRIR ≤ 0.55'}</strong></div>
          </div>
          <div class="mt-3 pt-2 border-t border-rose-100 flex items-center justify-between text-[10px] text-slate-600">
            <span>Baseline: TRIR 0.70</span>
            <span class="font-bold text-rose-700">Lead: All</span>
          </div>
        </div>
      `;

      targetIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = cardsHtml;
      });
    },

    renderAnalyticsCharts() {
      const container = document.getElementById('kpi-analytics-section');
      if (!container) return;

      const items = this.getFilteredKpis();
      const totalWeight = items.reduce((acc, k) => acc + (k.weightageNum || 0), 0);

      // Group by category
      let bizWeight = 0;
      let savWeight = 0;
      let piWeight = 0;

      items.forEach(k => {
        const c = (k.kpiCategory || '').toLowerCase();
        if (c.includes('saving')) savWeight += (k.weightageNum || 0);
        else if (c.includes('process') || c.includes('pi')) piWeight += (k.weightageNum || 0);
        else bizWeight += (k.weightageNum || 0);
      });

      container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Weightage Distribution Bar -->
          <div class="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs lg:col-span-2 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-xs font-black uppercase text-slate-700 tracking-wider">KPI Weightage Distribution</h4>
                <p class="text-[11px] text-slate-500">Corporate balance across Business Results, Savings &amp; Process Improvements</p>
              </div>
              <span class="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                Filtered Total: ${totalWeight}%
              </span>
            </div>

            <!-- Segmented Progress Bar -->
            <div class="h-6 w-full rounded-xl bg-slate-100 flex overflow-hidden p-0.5 shadow-inner">
              <div style="width: ${bizWeight > 0 ? (bizWeight / (totalWeight || 1) * 100) : 0}%" class="h-full bg-blue-600 rounded-l-lg transition-all flex items-center justify-center text-[10px] text-white font-bold" title="Business Results: ${bizWeight}%">
                ${bizWeight > 0 ? `${bizWeight}%` : ''}
              </div>
              <div style="width: ${savWeight > 0 ? (savWeight / (totalWeight || 1) * 100) : 0}%" class="h-full bg-emerald-600 transition-all flex items-center justify-center text-[10px] text-white font-bold" title="Savings: ${savWeight}%">
                ${savWeight > 0 ? `${savWeight}%` : ''}
              </div>
              <div style="width: ${piWeight > 0 ? (piWeight / (totalWeight || 1) * 100) : 0}%" class="h-full bg-purple-600 rounded-r-lg transition-all flex items-center justify-center text-[10px] text-white font-bold" title="Process Improvements: ${piWeight}%">
                ${piWeight > 0 ? `${piWeight}%` : ''}
              </div>
            </div>

            <!-- Legend -->
            <div class="grid grid-cols-3 gap-2 pt-1 text-[11px]">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-blue-600 shrink-0"></span>
                <span class="text-slate-700 font-semibold">Business Results: <strong>${bizWeight}%</strong></span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-emerald-600 shrink-0"></span>
                <span class="text-slate-700 font-semibold">Savings: <strong>${savWeight}%</strong></span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-purple-600 shrink-0"></span>
                <span class="text-slate-700 font-semibold">Process Improvements: <strong>${piWeight}%</strong></span>
              </div>
            </div>
          </div>

          <!-- Governance Alignment Card -->
          <div class="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-xs space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <i data-lucide="shield" class="w-3.5 h-3.5"></i>
                Governance Architecture
              </span>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-mono bg-white/10 text-white">Live Synchronized</span>
            </div>
            <h5 class="text-sm font-bold text-white tracking-tight">Active Scope: ${this.findNode(this.state.activeNodeId)?.title || 'COO FPCL'}</h5>
            <p class="text-[11px] text-slate-300 leading-relaxed">
              Performance targets are calibrated at 3 tiers: Minimum baseline (-95%), Business Plan Budget (100%), and Stretch Outperformance (110%).
            </p>
            <div class="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span class="text-slate-400">Total Filtered Metrics:</span>
              <span class="font-extrabold text-white text-xs">${items.length} KPIs</span>
            </div>
          </div>
        </div>
      `;
    },

    renderCategoryTabs() {
      const container = document.getElementById('kpi-category-tabs');
      if (!container) return;

      const current = this.state.activeCategoryFilter;
      const tabs = [
        { id: 'all', label: 'All Categories' },
        { id: 'business', label: 'Business Results' },
        { id: 'savings', label: 'Savings' },
        { id: 'pi', label: 'Process Improvements' }
      ];

      container.innerHTML = tabs.map(t => `
        <button
          type="button"
          onclick="FPCL_KPI_SUITE.setCategoryFilter('${t.id}')"
          class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap
            ${current === t.id ? 'bg-[#2E6DA4] text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}"
        >
          ${t.label}
        </button>
      `).join('');
    },

    renderScorecard() {
      const container = document.getElementById('kpi-matrix-container');
      if (!container) return;

      const items = this.getFilteredKpis();
      const activeNode = this.findNode(this.state.activeNodeId);

      if (items.length === 0) {
        container.innerHTML = `
          <div class="p-8 text-center bg-white border border-slate-200 rounded-2xl">
            <i data-lucide="search-x" class="w-10 h-10 text-slate-300 mx-auto mb-2"></i>
            <h4 class="text-sm font-bold text-slate-700">No KPIs Match Current Filter</h4>
            <p class="text-xs text-slate-500 mt-1">Try resetting the search or selecting a different organogram designation.</p>
            <button
              type="button"
              onclick="FPCL_KPI_SUITE.selectOrganogramNode('coo'); FPCL_KPI_SUITE.setCategoryFilter('all'); FPCL_KPI_SUITE.setSearchQuery('');"
              class="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Reset to COO View (All KPIs)
            </button>
          </div>
        `;
        return;
      }

      // Render Executive Board-Ready Matrix Table with Drilldown
      container.innerHTML = `
        <div class="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <!-- Table Header Banner -->
          <div class="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                <i data-lucide="table" class="w-4 h-4"></i>
              </span>
              <div>
                <h4 class="text-xs sm:text-sm font-black text-slate-900 tracking-tight">Executive Scorecard &amp; 3-Tier Horizon Matrix</h4>
                <div class="text-[10px] text-slate-500 font-medium">
                  Showing ${items.length} KPIs for <strong class="text-blue-700">${activeNode ? activeNode.title : 'COO FPCL'}</strong>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick="FPCL_KPI_SUITE.exportCsv()"
                class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors flex items-center gap-1 shadow-2xs"
                title="Export Filtered CSV"
              >
                <i data-lucide="download" class="w-3.5 h-3.5 text-slate-500"></i>
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onclick="FPCL_KPI_SUITE.printReport()"
                class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors flex items-center gap-1 shadow-2xs"
                title="Print Executive Scorecard"
              >
                <i data-lucide="printer" class="w-3.5 h-3.5 text-slate-500"></i>
                <span>Print</span>
              </button>
            </div>
          </div>

          <!-- Responsive Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-100/80 text-[10px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <th class="py-2.5 px-3 w-12 text-center">Sr</th>
                  <th class="py-2.5 px-3">Category &amp; Weight</th>
                  <th class="py-2.5 px-3" style="min-width: 220px;">KPI Name &amp; Strategic Scope</th>
                  <th class="py-2.5 px-3">Lead &amp; Secondary Roles</th>
                  <th class="py-2.5 px-3 bg-rose-50/50 text-rose-900">Threshold (-95%)</th>
                  <th class="py-2.5 px-3 bg-blue-50/50 text-blue-900">Budget Plan (100%)</th>
                  <th class="py-2.5 px-3 bg-emerald-50/50 text-emerald-900">Stretch (110%)</th>
                  <th class="py-2.5 px-3 text-center">Drill Down</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${items.map(k => `
                  <tr class="hover:bg-slate-50/90 transition-colors group">
                    <!-- Sr -->
                    <td class="py-3 px-3 text-center font-mono font-bold text-slate-500">${k.sr}</td>

                    <!-- Category & Weight -->
                    <td class="py-3 px-3 whitespace-nowrap">
                      <div class="flex flex-col gap-1">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black ${
                          k.kpiCategory.includes('Saving') ? 'bg-emerald-100 text-emerald-800' :
                          k.kpiCategory.includes('Process') || k.kpiCategory.includes('PI') ? 'bg-purple-100 text-purple-800' :
                          'bg-blue-100 text-blue-800'
                        }">
                          ${k.kpiCategory}
                        </span>
                        <span class="text-[10px] font-extrabold text-slate-700">
                          Weight: <strong class="text-slate-900">${k.weightage}</strong>
                        </span>
                      </div>
                    </td>

                    <!-- KPI Name & Description -->
                    <td class="py-3 px-3">
                      <div class="flex items-start gap-2">
                        <span class="p-1.5 rounded-lg bg-slate-100 text-slate-700 shrink-0 mt-0.5 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                          <i data-lucide="${k.icon}" class="w-4 h-4"></i>
                        </span>
                        <div>
                          <div class="font-extrabold text-slate-900 leading-snug">${k.kpi}</div>
                          <div class="text-[10px] text-slate-500 leading-relaxed mt-0.5 line-clamp-2">${k.description}</div>
                        </div>
                      </div>
                    </td>

                    <!-- Lead & Secondary Roles -->
                    <td class="py-3 px-3">
                      <div class="space-y-1">
                        <div class="flex items-center gap-1 text-[11px] font-bold text-slate-800">
                          <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                          <span>Lead: ${k.leadDept}</span>
                        </div>
                        ${k.secondaryStakeholders ? `
                          <div class="text-[10px] text-slate-500 truncate" title="${k.secondaryStakeholders}">
                            Sec: ${k.secondaryStakeholders}
                          </div>
                        ` : ''}
                      </div>
                    </td>

                    <!-- Threshold -95% -->
                    <td class="py-3 px-3 bg-rose-50/30">
                      <div class="font-mono text-xs font-bold text-rose-900">
                        ${k.minTarget95 || '—'}
                      </div>
                    </td>

                    <!-- Budget Target 100% -->
                    <td class="py-3 px-3 bg-blue-50/30">
                      <div class="font-mono text-xs font-extrabold text-blue-950">
                        ${k.target100 || '—'}
                      </div>
                    </td>

                    <!-- Stretch Target 110% -->
                    <td class="py-3 px-3 bg-emerald-50/30">
                      <div class="font-mono text-xs font-bold text-emerald-900">
                        ${k.stretchTarget110 || '—'}
                      </div>
                    </td>

                    <!-- Drill Down Action -->
                    <td class="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onclick="FPCL_KPI_SUITE.openDrillDown('${k.sr}')"
                        class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition-all cursor-pointer shadow-2xs"
                        title="View Detailed Analysis"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    renderAll() {
      this.renderOrganogram();
      if (document.getElementById('kpi-summary-cards')) this.renderExecutiveSummaryCards();
      if (document.getElementById('kpi-analytics-section')) this.renderAnalyticsCharts();
      if (document.getElementById('kpi-category-tabs')) this.renderCategoryTabs();
      if (document.getElementById('kpi-matrix-container')) this.renderScorecard();

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    openModal() {
      const modal = document.getElementById('kpis-suite-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.style.removeProperty('display');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }

      // Ensure COO highlights popup is hidden so ONLY the organogram opens initially
      const cooPopup = document.getElementById('kpi-coo-highlights-modal');
      if (cooPopup) {
        cooPopup.classList.add('hidden');
        cooPopup.classList.remove('flex');
        cooPopup.style.display = 'none';
      }
      this.state.isCooPopupOpen = false;

      this.renderAll();
      // Trigger live sync in background if stale
      this.fetchLiveData();
    },

    closeModal() {
      const modal = document.getElementById('kpis-suite-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
      this.closeCooHighlightsPopup();
      this.closeDrillDown();
    }
  };

  // Keyboard shortcut: Escape key closes active KPI modal or COO popup
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const drilldown = document.getElementById('kpi-drilldown-modal');
      if (drilldown && !drilldown.classList.contains('hidden')) {
        kpiSuite.closeDrillDown();
        return;
      }
      const cooPopup = document.getElementById('kpi-coo-highlights-modal');
      if (cooPopup && !cooPopup.classList.contains('hidden')) {
        kpiSuite.closeCooHighlightsPopup();
        return;
      }
      const suiteModal = document.getElementById('kpis-suite-modal');
      if (suiteModal && !suiteModal.classList.contains('hidden')) {
        if (window.portalApp && typeof window.portalApp.closeKpisModal === 'function') {
          window.portalApp.closeKpisModal();
        } else {
          kpiSuite.closeModal();
        }
      }
    }
  });

  // Expose globally immediately
  window.FPCL_KPI_SUITE = kpiSuite;
  window.openKpisModal = function (event) {
    if (event && event.stopPropagation) event.stopPropagation();
    kpiSuite.openModal();
  };
  window.closeKpisModal = function () {
    kpiSuite.closeModal();
  };

  // Initialize on script load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => kpiSuite.init());
  } else {
    kpiSuite.init();
  }

})();
