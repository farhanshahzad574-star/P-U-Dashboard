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

  const kpiSuite = {
    state: {
      kpis: [],
      activeNodeId: 'coo', // default active node in organogram is COO FPCL
      activeCategoryFilter: 'all',
      searchQuery: '',
      selectedKpiForDrillDown: null,
      isSyncing: false,
      lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      syncError: null,
      viewMode: 'grid' // 'grid' | 'table' | 'split'
    },

    init() {
      window.FPCL_KPI_SUITE = this;

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

    selectOrganogramNode(nodeId) {
      this.state.activeNodeId = nodeId;
      this.renderOrganogram();
      this.renderScorecard();
      this.renderExecutiveSummaryCards();
      this.renderAnalyticsCharts();

      // Re-trigger lucide icons
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
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

      const org = window.FPCL_KPI_ORGANOGRAM;
      if (!org) return;

      const activeId = this.state.activeNodeId;
      const isCooActive = activeId === 'coo';

      // Render hierarchical SVG / Card tree structure
      container.innerHTML = `
        <div class="w-full flex flex-col items-center select-none py-1">
          <!-- LEVEL 1: COO FPCL (Top of Organogram) -->
          <div class="relative flex flex-col items-center">
            <button
              type="button"
              onclick="FPCL_KPI_SUITE.selectOrganogramNode('coo')"
              class="group relative flex flex-col items-center p-3 sm:p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left
                ${isCooActive ? 'bg-gradient-to-br from-amber-50 via-white to-amber-100/60 border-amber-500 shadow-lg shadow-amber-500/20 ring-4 ring-amber-400/30 scale-[1.02]' : 'bg-white border-slate-200/90 hover:border-amber-400 hover:shadow-md'}"
              style="min-width: 250px; max-width: 320px;"
            >
              <!-- Executive Badge Pill -->
              <div class="absolute -top-3 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-xs flex items-center gap-1.5">
                <i data-lucide="crown" class="w-3 h-3 text-amber-200"></i>
                <span>Executive Leadership (Click for All KPIs)</span>
              </div>

              <div class="flex items-center gap-3 w-full mt-1">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white flex items-center justify-center shrink-0 shadow-sm font-black text-lg">
                  <i data-lucide="award" class="w-6 h-6 text-white"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight">COO FPCL</h4>
                    <span class="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      100% Weightage
                    </span>
                  </div>
                  <p class="text-[11px] font-medium text-slate-600 truncate mt-0.5">Chief Operating Officer</p>
                  <div class="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-semibold">
                    <span class="inline-flex items-center gap-1 text-amber-700">
                      <i data-lucide="layers" class="w-3 h-3"></i>
                      All 7 Corporate KPIs
                    </span>
                    <span>•</span>
                    <span class="text-slate-500">Master Governance</span>
                  </div>
                </div>
              </div>

              ${isCooActive ? `
                <div class="mt-2.5 pt-2 border-t border-amber-200/70 w-full flex items-center justify-between text-[10px] text-amber-800 font-bold">
                  <span class="flex items-center gap-1">
                    <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-amber-600"></i>
                    Displaying Full Corporate Scorecard
                  </span>
                  <span class="underline">Active View</span>
                </div>
              ` : `
                <div class="mt-2 pt-1.5 border-t border-slate-100 w-full flex items-center justify-between text-[10px] text-slate-400 group-hover:text-amber-700 font-medium">
                  <span>Click to view all corporate KPIs</span>
                  <i data-lucide="arrow-right" class="w-3 h-3"></i>
                </div>
              `}
            </button>

            <!-- Vertical trunk down from COO -->
            <div class="w-0.5 h-6 bg-slate-300"></div>
          </div>

          <!-- Connecting Bus Bar to Senior Managers -->
          <div class="w-full max-w-5xl px-4 flex flex-col items-center">
            <!-- Horizontal crossbar linking the 4 Senior Manager branches -->
            <div class="w-[85%] h-0.5 bg-slate-300 relative">
              <div class="absolute left-0 top-0 w-0.5 h-4 bg-slate-300"></div>
              <div class="absolute left-[33%] top-0 w-0.5 h-4 bg-slate-300"></div>
              <div class="absolute left-[66%] top-0 w-0.5 h-4 bg-slate-300"></div>
              <div class="absolute right-0 top-0 w-0.5 h-4 bg-slate-300"></div>
            </div>

            <!-- LEVEL 2 & 3: The 4 Branches (Senior Managers & reporting Managers) -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 w-full mt-4">

              <!-- BRANCH 1: Senior Manager Production -> Manager Production (P&U) -->
              <div class="flex flex-col items-center space-y-2">
                <!-- Senior Manager Production -->
                <button
                  type="button"
                  onclick="FPCL_KPI_SUITE.selectOrganogramNode('sm-production')"
                  class="w-full text-left p-3 rounded-xl border-2 transition-all duration-150 cursor-pointer relative group
                    ${activeId === 'sm-production' ? 'bg-emerald-50 border-emerald-500 shadow-md ring-2 ring-emerald-400/30' : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs'}"
                >
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-xs">
                      <i data-lucide="factory" class="w-4 h-4"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="text-xs font-bold text-slate-900 leading-tight">Senior Manager Production</div>
                      <div class="text-[10px] text-slate-500 font-medium truncate">Reports to COO FPCL</div>
                    </div>
                  </div>
                  <div class="mt-2 flex items-center justify-between text-[10px]">
                    <span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Production & Ops</span>
                    <span class="text-slate-500 font-medium">1 subordinate</span>
                  </div>
                </button>

                <!-- Connector line to Manager -->
                <div class="w-0.5 h-3 bg-slate-300"></div>

                <!-- Manager Production (P&U) -->
                <button
                  type="button"
                  onclick="FPCL_KPI_SUITE.selectOrganogramNode('m-production-pu')"
                  class="w-full text-left p-2.5 rounded-xl border-2 transition-all duration-150 cursor-pointer relative group
                    ${activeId === 'm-production-pu' ? 'bg-teal-50 border-teal-500 shadow-md ring-2 ring-teal-400/30' : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-xs'}"
                >
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs text-xs">
                      <i data-lucide="activity" class="w-3.5 h-3.5"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="text-[11px] font-bold text-slate-900 leading-tight">Manager Production (P&U)</div>
                      <div class="text-[9px] text-slate-500 truncate">Power & Utilities</div>
                    </div>
                  </div>
                </button>
              </div>

              <!-- BRANCH 2: Senior Manager Commercial (No subordinate managers) -->
              <div class="flex flex-col items-center space-y-2">
                <button
                  type="button"
                  onclick="FPCL_KPI_SUITE.selectOrganogramNode('sm-commercial')"
                  class="w-full text-left p-3 rounded-xl border-2 transition-all duration-150 cursor-pointer relative group
                    ${activeId === 'sm-commercial' ? 'bg-orange-50 border-orange-500 shadow-md ring-2 ring-orange-400/30' : 'bg-white border-slate-200 hover:border-orange-300 hover:shadow-xs'}"
                >
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-xs">
                      <i data-lucide="trending-up" class="w-4 h-4"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="text-xs font-bold text-slate-900 leading-tight">Senior Manager Commercial</div>
                      <div class="text-[10px] text-slate-500 font-medium truncate">Reports to COO FPCL</div>
                    </div>
                  </div>
                  <div class="mt-2 flex items-center justify-between text-[10px]">
                    <span class="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 font-semibold">Commercial & SCM</span>
                    <span class="text-slate-400 font-medium">Direct report</span>
                  </div>
                </button>
                <div class="p-2 text-center text-[10px] text-slate-400 italic">
                  Direct commercial & fuel governance
                </div>
              </div>

              <!-- BRANCH 3: Senior Manager E&I -> Manager Electrical & Manager Instrument -->
              <div class="flex flex-col items-center space-y-2">
                <!-- Senior Manager E&I -->
                <button
                  type="button"
                  onclick="FPCL_KPI_SUITE.selectOrganogramNode('sm-ei')"
                  class="w-full text-left p-3 rounded-xl border-2 transition-all duration-150 cursor-pointer relative group
                    ${activeId === 'sm-ei' ? 'bg-purple-50 border-purple-500 shadow-md ring-2 ring-purple-400/30' : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-xs'}"
                >
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-xs">
                      <i data-lucide="zap" class="w-4 h-4"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="text-xs font-bold text-slate-900 leading-tight">Senior Manager E&I</div>
                      <div class="text-[10px] text-slate-500 font-medium truncate">Reports to COO FPCL</div>
                    </div>
                  </div>
                  <div class="mt-2 flex items-center justify-between text-[10px]">
                    <span class="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">Electrical & Inst</span>
                    <span class="text-slate-500 font-medium">2 subordinates</span>
                  </div>
                </button>

                <!-- Connector line to Managers -->
                <div class="w-0.5 h-2 bg-slate-300"></div>

                <div class="w-full space-y-1.5">
                  <!-- Manager Electrical -->
                  <button
                    type="button"
                    onclick="FPCL_KPI_SUITE.selectOrganogramNode('m-electrical')"
                    class="w-full text-left p-2 rounded-xl border-2 transition-all duration-150 cursor-pointer relative group
                      ${activeId === 'm-electrical' ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-400/30' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'}"
                  >
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                        <i data-lucide="cpu" class="w-3.5 h-3.5"></i>
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="text-[11px] font-bold text-slate-900 leading-tight">Manager Electrical</div>
                        <div class="text-[9px] text-slate-500 truncate">Electrical Systems</div>
                      </div>
                    </div>
                  </button>

                  <!-- Manager Instrument -->
                  <button
                    type="button"
                    onclick="FPCL_KPI_SUITE.selectOrganogramNode('m-instrument')"
                    class="w-full text-left p-2 rounded-xl border-2 transition-all duration-150 cursor-pointer relative group
                      ${activeId === 'm-instrument' ? 'bg-violet-50 border-violet-500 shadow-md ring-2 ring-violet-400/30' : 'bg-white border-slate-200 hover:border-violet-300 hover:shadow-xs'}"
                  >
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-md bg-violet-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                        <i data-lucide="sliders" class="w-3.5 h-3.5"></i>
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="text-[11px] font-bold text-slate-900 leading-tight">Manager Instrument</div>
                        <div class="text-[9px] text-slate-500 truncate">Instrumentation & Controls</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <!-- BRANCH 4: Senior Manager Mech Maint -> Manager Equipment, Manager Machinery, Manager Planning -->
              <div class="flex flex-col items-center space-y-2">
                <!-- Senior Manager Mech Maint -->
                <button
                  type="button"
                  onclick="FPCL_KPI_SUITE.selectOrganogramNode('sm-mech-maint')"
                  class="w-full text-left p-3 rounded-xl border-2 transition-all duration-150 cursor-pointer relative group
                    ${activeId === 'sm-mech-maint' ? 'bg-cyan-50 border-cyan-500 shadow-md ring-2 ring-cyan-400/30' : 'bg-white border-slate-200 hover:border-cyan-300 hover:shadow-xs'}"
                >
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-xs">
                      <i data-lucide="wrench" class="w-4 h-4"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="text-xs font-bold text-slate-900 leading-tight">Senior Manager Mech Maint</div>
                      <div class="text-[10px] text-slate-500 font-medium truncate">Reports to COO FPCL</div>
                    </div>
                  </div>
                  <div class="mt-2 flex items-center justify-between text-[10px]">
                    <span class="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 font-semibold">Mechanical Maint</span>
                    <span class="text-slate-500 font-medium">3 subordinates</span>
                  </div>
                </button>

                <!-- Connector line to Managers -->
                <div class="w-0.5 h-2 bg-slate-300"></div>

                <div class="w-full space-y-1.5">
                  <!-- Manager Equipment -->
                  <button
                    type="button"
                    onclick="FPCL_KPI_SUITE.selectOrganogramNode('m-equipment')"
                    class="w-full text-left p-2 rounded-xl border-2 transition-all duration-150 cursor-pointer relative group
                      ${activeId === 'm-equipment' ? 'bg-sky-50 border-sky-500 shadow-md ring-2 ring-sky-400/30' : 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-xs'}"
                  >
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-md bg-sky-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                        <i data-lucide="box" class="w-3.5 h-3.5"></i>
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="text-[11px] font-bold text-slate-900 leading-tight">Manager Equipment</div>
                        <div class="text-[9px] text-slate-500 truncate">Static Equipment</div>
                      </div>
                    </div>
                  </button>

                  <!-- Manager Machinery -->
                  <button
                    type="button"
                    onclick="FPCL_KPI_SUITE.selectOrganogramNode('m-machinery')"
                    class="w-full text-left p-2 rounded-xl border-2 transition-all duration-150 cursor-pointer relative group
                      ${activeId === 'm-machinery' ? 'bg-blue-50 border-blue-500 shadow-md ring-2 ring-blue-400/30' : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'}"
                  >
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                        <i data-lucide="cog" class="w-3.5 h-3.5"></i>
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="text-[11px] font-bold text-slate-900 leading-tight">Manager Machinery</div>
                        <div class="text-[9px] text-slate-500 truncate">Rotating Machinery</div>
                      </div>
                    </div>
                  </button>

                  <!-- Manager Planning -->
                  <button
                    type="button"
                    onclick="FPCL_KPI_SUITE.selectOrganogramNode('m-planning')"
                    class="w-full text-left p-2 rounded-xl border-2 transition-all duration-150 cursor-pointer relative group
                      ${activeId === 'm-planning' ? 'bg-teal-50 border-teal-500 shadow-md ring-2 ring-teal-400/30' : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-xs'}"
                  >
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-md bg-teal-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                        <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="text-[11px] font-bold text-slate-900 leading-tight">Manager Planning</div>
                        <div class="text-[9px] text-slate-500 truncate">Planning & TA</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      `;
    },

    renderExecutiveSummaryCards() {
      const container = document.getElementById('kpi-summary-cards');
      if (!container) return;

      const kpis = this.state.kpis || [];
      const netProfit = kpis.find(k => k.kpi.toLowerCase().includes('profit')) || {};
      const plantAvail = kpis.find(k => k.kpi.toLowerCase().includes('availability')) || {};
      const dispatchKe = kpis.find(k => k.kpi.toLowerCase().includes('dispatch')) || {};
      const coalSavings = kpis.find(k => k.kpi.toLowerCase().includes('coal')) || {};
      const sparesReduction = kpis.find(k => k.kpi.toLowerCase().includes('spares')) || {};
      const turnaround = kpis.find(k => k.kpi.toLowerCase().includes('ta') || k.kpi.toLowerCase().includes('planning')) || {};
      const safetyTrir = kpis.find(k => k.kpi.toLowerCase().includes('trir') || k.kpi.toLowerCase().includes('safe')) || {};

      container.innerHTML = `
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
      this.renderExecutiveSummaryCards();
      this.renderAnalyticsCharts();
      this.renderCategoryTabs();
      this.renderScorecard();

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    },

    openModal() {
      const modal = document.getElementById('kpis-suite-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
      }

      this.renderAll();
      // Trigger live sync in background if stale
      this.fetchLiveData();
    },

    closeModal() {
      const modal = document.getElementById('kpis-suite-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
      }
    }
  };

  // Initialize on script load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => kpiSuite.init());
  } else {
    kpiSuite.init();
  }

})();
