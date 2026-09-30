/**
 * FPCL Executive Operations & Compliance Portal
 * FPCL Telephone Directory Suite
 * 
 * Connected to Live Google Sheet:
 * Sheet ID: 1SrPdaxzEXbOFVbWin4zJvrc-m9TQKtxFjcyZYamXfpg
 * Tab: FPCL_Directory
 */

(function () {
  'use strict';

  const SHEET_ID = '1SrPdaxzEXbOFVbWin4zJvrc-m9TQKtxFjcyZYamXfpg';
  const SHEET_TAB = 'FPCL_Directory';

  // Category Configuration with vibrant palette
  const CATEGORIES = {
    all: { id: 'all', label: 'All Contacts', icon: 'users', color: 'slate' },
    emergency: { id: 'emergency', label: 'Safety & Emergency', icon: 'alert-triangle', color: 'red', badgeBg: 'bg-red-500', textCol: 'text-red-700', bgCol: 'bg-red-50', borderCol: 'border-red-200' },
    executive: { id: 'executive', label: 'Executive & MD Office', icon: 'crown', color: 'indigo', badgeBg: 'bg-indigo-600', textCol: 'text-indigo-800', bgCol: 'bg-indigo-50', borderCol: 'border-indigo-200' },
    operations: { id: 'operations', label: 'Operations & MCR', icon: 'zap', color: 'cyan', badgeBg: 'bg-cyan-600', textCol: 'text-cyan-800', bgCol: 'bg-cyan-50', borderCol: 'border-cyan-200' },
    mechanical: { id: 'mechanical', label: 'Mechanical', icon: 'wrench', color: 'amber', badgeBg: 'bg-amber-600', textCol: 'text-amber-800', bgCol: 'bg-amber-50', borderCol: 'border-amber-200' },
    ei: { id: 'ei', label: 'Electrical & Inst (E&I)', icon: 'cpu', color: 'teal', badgeBg: 'bg-teal-600', textCol: 'text-teal-800', bgCol: 'bg-teal-50', borderCol: 'border-teal-200' },
    process_lab: { id: 'process_lab', label: 'Process & Lab', icon: 'flask-conical', color: 'purple', badgeBg: 'bg-purple-600', textCol: 'text-purple-800', bgCol: 'bg-purple-50', borderCol: 'border-purple-200' },
    admin_hr: { id: 'admin_hr', label: 'Admin & HR', icon: 'building-2', color: 'rose', badgeBg: 'bg-rose-600', textCol: 'text-rose-800', bgCol: 'bg-rose-50', borderCol: 'border-rose-200' },
    security: { id: 'security', label: 'Security & Gates', icon: 'shield', color: 'slate', badgeBg: 'bg-slate-700', textCol: 'text-slate-800', bgCol: 'bg-slate-100', borderCol: 'border-slate-300' },
    scm: { id: 'scm', label: 'SCM & Stores', icon: 'package', color: 'blue', badgeBg: 'bg-blue-600', textCol: 'text-blue-800', bgCol: 'bg-blue-50', borderCol: 'border-blue-200' },
    conference: { id: 'conference', label: 'Conference Rooms', icon: 'presentation', color: 'violet', badgeBg: 'bg-violet-600', textCol: 'text-violet-800', bgCol: 'bg-violet-50', borderCol: 'border-violet-200' }
  };

  function classifyContact(ext, name) {
    const sExt = String(ext || '').trim();
    const sName = String(name || '').trim().toLowerCase();
    const nExt = parseInt(sExt, 10);

    // 1. Emergency
    if (sExt === '8888' || sName.includes('emergency') || (sName.includes('safety') && sName.includes('fire'))) {
      return {
        categoryId: 'emergency',
        categoryLabel: 'Safety Emergency',
        gradient: 'from-red-600 via-rose-600 to-orange-600',
        badgeBg: 'bg-red-600 text-white',
        borderAccent: 'border-red-400',
        cardBg: 'bg-red-50/40',
        avatarBg: 'bg-gradient-to-tr from-red-600 to-rose-500 text-white',
        tagBg: 'bg-red-100 text-red-800 border-red-300',
        isEmergency: true
      };
    }

    // 2. Conference Rooms & Facilities
    if (sName.includes('conf') || sName.includes('conference') || sName.includes('meeting room')) {
      return {
        categoryId: 'conference',
        categoryLabel: 'Conference & Meetings',
        gradient: 'from-violet-600 to-purple-600',
        badgeBg: 'bg-violet-600 text-white',
        borderAccent: 'border-violet-300',
        cardBg: 'bg-violet-50/30',
        avatarBg: 'bg-gradient-to-tr from-violet-600 to-purple-500 text-white',
        tagBg: 'bg-violet-100 text-violet-800 border-violet-200',
        isEmergency: false
      };
    }

    // 3. Security, Gates & Containers
    if (sName.includes('gate') || sName.includes('allied') || sName.includes('irc container') || sName.includes('weighbridge') || (nExt >= 8250 && nExt <= 8269)) {
      return {
        categoryId: 'security',
        categoryLabel: 'Security & Site Access',
        gradient: 'from-slate-700 to-zinc-800',
        badgeBg: 'bg-slate-700 text-white',
        borderAccent: 'border-slate-300',
        cardBg: 'bg-slate-50/40',
        avatarBg: 'bg-gradient-to-tr from-slate-700 to-zinc-600 text-white',
        tagBg: 'bg-slate-200 text-slate-800 border-slate-300',
        isEmergency: false
      };
    }

    // 4. Executive & MD Office (8000 - 8199)
    if ((nExt >= 8000 && nExt < 8200) || sName.includes('md') || sName.includes('coo') || sName.includes('ce -') || sName.includes('director')) {
      return {
        categoryId: 'executive',
        categoryLabel: 'Executive & Management',
        gradient: 'from-indigo-600 via-purple-600 to-violet-700',
        badgeBg: 'bg-indigo-600 text-white',
        borderAccent: 'border-indigo-300',
        cardBg: 'bg-indigo-50/30',
        avatarBg: 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white',
        tagBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        isEmergency: false
      };
    }

    // 5. Operations & MCR / CCR (8300 - 8399)
    if ((nExt >= 8300 && nExt < 8400) || sName.includes('psg') || sName.includes('mcr') || sName.includes('lcr') || sName.includes('stg') || sName.includes('boiler') || sName.includes('opr') || sName.includes('shift engr') || sName.includes('panel')) {
      return {
        categoryId: 'operations',
        categoryLabel: 'Operations (PSG & CCR)',
        gradient: 'from-cyan-600 via-sky-600 to-blue-600',
        badgeBg: 'bg-cyan-600 text-white',
        borderAccent: 'border-cyan-300',
        cardBg: 'bg-cyan-50/30',
        avatarBg: 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white',
        tagBg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        isEmergency: false
      };
    }

    // 6. Mechanical Maintenance (8400 - 8499)
    if ((nExt >= 8400 && nExt < 8500) || sName.includes('mech') || sName.includes('workshop') || sName.includes('overhaul') || sName.includes('turb')) {
      return {
        categoryId: 'mechanical',
        categoryLabel: 'Mechanical Maintenance',
        gradient: 'from-amber-500 via-orange-500 to-amber-600',
        badgeBg: 'bg-amber-600 text-white',
        borderAccent: 'border-amber-300',
        cardBg: 'bg-amber-50/30',
        avatarBg: 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white',
        tagBg: 'bg-amber-100 text-amber-900 border-amber-200',
        isEmergency: false
      };
    }

    // 7. Electrical & Instrumentation (E&I) (8500 - 8599)
    if ((nExt >= 8500 && nExt < 8600) || sName.includes('e&i') || sName.includes('elect') || sName.includes('inst') || sName.includes('dcs') || sName.includes('substation')) {
      return {
        categoryId: 'ei',
        categoryLabel: 'Electrical & Inst (E&I)',
        gradient: 'from-teal-600 via-emerald-600 to-green-600',
        badgeBg: 'bg-teal-600 text-white',
        borderAccent: 'border-teal-300',
        cardBg: 'bg-teal-50/30',
        avatarBg: 'bg-gradient-to-tr from-teal-600 to-emerald-600 text-white',
        tagBg: 'bg-teal-100 text-teal-800 border-teal-200',
        isEmergency: false
      };
    }

    // 8. Process, Lab & Chemistry (8600 - 8699)
    if ((nExt >= 8600 && nExt < 8700) || sName.includes('lab') || sName.includes('chem') || sName.includes('water') || sName.includes('library') || sName.includes('process')) {
      return {
        categoryId: 'process_lab',
        categoryLabel: 'Process & Chemistry / Lab',
        gradient: 'from-purple-600 via-fuchsia-600 to-pink-600',
        badgeBg: 'bg-purple-600 text-white',
        borderAccent: 'border-purple-300',
        cardBg: 'bg-purple-50/30',
        avatarBg: 'bg-gradient-to-tr from-purple-600 to-fuchsia-600 text-white',
        tagBg: 'bg-purple-100 text-purple-800 border-purple-200',
        isEmergency: false
      };
    }

    // 9. SCM, Stores & Procurement (8700 - 8799)
    if ((nExt >= 8700 && nExt < 8800) || sName.includes('scm') || sName.includes('store') || sName.includes('material') || sName.includes('warehouse')) {
      return {
        categoryId: 'scm',
        categoryLabel: 'Supply Chain & Stores',
        gradient: 'from-blue-600 via-indigo-600 to-sky-600',
        badgeBg: 'bg-blue-600 text-white',
        borderAccent: 'border-blue-300',
        cardBg: 'bg-blue-50/30',
        avatarBg: 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white',
        tagBg: 'bg-blue-100 text-blue-800 border-blue-200',
        isEmergency: false
      };
    }

    // 10. Admin & HR (8200 - 8249, 8270 - 8299)
    if ((nExt >= 8200 && nExt < 8300) || sName.includes('admin') || sName.includes('hr') || sName.includes('reception') || sName.includes('kitchen') || sName.includes('cook')) {
      return {
        categoryId: 'admin_hr',
        categoryLabel: 'Administration & HR',
        gradient: 'from-rose-500 via-pink-600 to-rose-600',
        badgeBg: 'bg-rose-600 text-white',
        borderAccent: 'border-rose-300',
        cardBg: 'bg-rose-50/30',
        avatarBg: 'bg-gradient-to-tr from-rose-500 to-pink-600 text-white',
        tagBg: 'bg-rose-100 text-rose-800 border-rose-200',
        isEmergency: false
      };
    }

    // Default
    return {
      categoryId: 'operations',
      categoryLabel: 'Plant Personnel',
      gradient: 'from-teal-600 to-cyan-600',
      badgeBg: 'bg-teal-600 text-white',
      borderAccent: 'border-teal-200',
      cardBg: 'bg-teal-50/20',
      avatarBg: 'bg-gradient-to-tr from-teal-600 to-cyan-600 text-white',
      tagBg: 'bg-teal-100 text-teal-800 border-teal-200',
      isEmergency: false
    };
  }

  function getInitials(name) {
    if (!name) return 'FP';
    const clean = name.replace(/[-_()]/g, ' ').replace(/\s+/g, ' ').trim();
    const parts = clean.split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  class FPCLDirectorySuite {
    constructor() {
      this.rawContacts = [];
      this.filteredContacts = [];
      this.isLoading = false;
      this.lastSynced = null;
      this.activeCategory = 'all';
      this.searchQuery = '';
      this.sortBy = 'ext_asc';
      this.viewMode = 'table'; // 'table' | 'grid' (Table mode by default)
      this.sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=0`;

      this.initFromStorage();
    }

    initFromStorage() {
      try {
        const stored = localStorage.getItem('fpcl_directory_cache');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed.contacts) && parsed.contacts.length > 0) {
            this.rawContacts = parsed.contacts;
            this.lastSynced = parsed.lastSynced ? new Date(parsed.lastSynced) : null;
            this.filterAndRender();
          }
        }
      } catch (e) {
        console.warn('Could not read cached directory data', e);
      }
    }

    saveToStorage() {
      try {
        localStorage.setItem('fpcl_directory_cache', JSON.stringify({
          contacts: this.rawContacts,
          lastSynced: this.lastSynced ? this.lastSynced.toISOString() : null
        }));
      } catch (e) {
        // storage quota exceeded or disabled
      }
    }

    async fetchLiveData(force = false) {
      if (this.isLoading) return;
      this.isLoading = true;
      this.updateSyncUI();

      let contacts = null;

      // 1. Try local Express API route
      try {
        const res = await fetch('/api/fpcl-directory');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            contacts = json.data;
          }
        }
      } catch (e) {
        console.warn('Direct /api/fpcl-directory fetch failed, trying proxy...', e);
      }

      // 2. Try Universal Sheets Proxy
      if (!contacts) {
        try {
          const res = await fetch(`/api/sheets/fetch?sheetTab=${SHEET_TAB}&url=${encodeURIComponent(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_TAB}`)}`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.csvText) {
              contacts = this.parseCsv(json.csvText);
            }
          }
        } catch (e) {
          console.warn('/api/sheets/fetch failed, trying JSONP...', e);
        }
      }

      // 3. Try JSONP directly in browser
      if (!contacts && typeof window.fetchGoogleSheetViaJSONP === 'function') {
        try {
          const csvText = await window.fetchGoogleSheetViaJSONP(SHEET_ID, { sheetTab: SHEET_TAB });
          if (csvText) {
            contacts = this.parseCsv(csvText);
          }
        } catch (e) {
          console.warn('JSONP fetch failed', e);
        }
      }

      if (contacts && contacts.length > 0) {
        this.rawContacts = contacts.map(c => {
          const classification = classifyContact(c.ext, c.name);
          return {
            sr: c.sr,
            ext: c.ext,
            name: c.name,
            initials: getInitials(c.name),
            ...classification
          };
        });
        this.lastSynced = new Date();
        this.saveToStorage();
        this.showToast(`Synchronized ${this.rawContacts.length} contacts from Google Sheet!`, 'success');
      } else if (this.rawContacts.length === 0) {
        this.showToast('Unable to connect to Google Sheet. Retrying...', 'warning');
      }

      this.isLoading = false;
      this.filterAndRender();
      this.updateSyncUI();
    }

    parseCsv(csvText) {
      if (!csvText) return [];
      const lines = csvText.split(/\r?\n/).filter(Boolean);
      const result = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const match = line.match(/^"?([^",]*)"?,(?:"([^"]*)"|([^,]*)),(?:"([^"]*)"|(.*))$/);
        if (match) {
          const sr = (match[1] || '').trim();
          const ext = (match[2] !== undefined ? match[2] : match[3] || '').trim();
          const name = (match[4] !== undefined ? match[4] : match[5] || '').trim();
          if (ext || name) {
            result.push({ sr: sr || String(result.length + 1), ext, name });
          }
        }
      }
      return result;
    }

    setCategory(categoryId) {
      this.activeCategory = categoryId;
      this.filterAndRender();
    }

    setSearch(query) {
      this.searchQuery = (query || '').toLowerCase().trim();
      this.filterAndRender();
    }

    setViewMode(mode) {
      this.viewMode = mode === 'grid' ? 'grid' : 'table';
      const gridBtn = document.getElementById('directory-view-grid-btn');
      const tableBtn = document.getElementById('directory-view-table-btn');
      if (gridBtn && tableBtn) {
        if (this.viewMode === 'table') {
          tableBtn.classList.add('bg-white', 'text-teal-800', 'shadow-xs');
          tableBtn.classList.remove('text-slate-600');
          gridBtn.classList.remove('bg-white', 'text-teal-800', 'shadow-xs');
          gridBtn.classList.add('text-slate-600');
        } else {
          gridBtn.classList.add('bg-white', 'text-teal-800', 'shadow-xs');
          gridBtn.classList.remove('text-slate-600');
          tableBtn.classList.remove('bg-white', 'text-teal-800', 'shadow-xs');
          tableBtn.classList.add('text-slate-600');
        }
      }
      this.filterAndRender();
    }

    setSort(sortVal) {
      this.sortBy = sortVal;
      this.filterAndRender();
    }

    filterAndRender() {
      let list = [...this.rawContacts];

      // Filter by category
      if (this.activeCategory && this.activeCategory !== 'all') {
        list = list.filter(item => item.categoryId === this.activeCategory);
      }

      // Filter by search query
      if (this.searchQuery) {
        list = list.filter(item => {
          const ext = (item.ext || '').toLowerCase();
          const name = (item.name || '').toLowerCase();
          const cat = (item.categoryLabel || '').toLowerCase();
          return ext.includes(this.searchQuery) || name.includes(this.searchQuery) || cat.includes(this.searchQuery);
        });
      }

      // Sort
      list.sort((a, b) => {
        if (this.sortBy === 'ext_asc') return (parseInt(a.ext, 10) || 0) - (parseInt(b.ext, 10) || 0);
        if (this.sortBy === 'ext_desc') return (parseInt(b.ext, 10) || 0) - (parseInt(a.ext, 10) || 0);
        if (this.sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
        if (this.sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
        if (this.sortBy === 'sr_asc') return (parseInt(a.sr, 10) || 0) - (parseInt(b.sr, 10) || 0);
        return 0;
      });

      this.filteredContacts = list;
      this.render();
    }

    render() {
      const container = document.getElementById('directory-contacts-container');
      const countEl = document.getElementById('directory-result-count');
      const emptyEl = document.getElementById('directory-empty-state');
      const emergencyCardEl = document.getElementById('directory-emergency-alert');

      if (countEl) {
        countEl.textContent = `${this.filteredContacts.length} ${this.filteredContacts.length === 1 ? 'contact' : 'contacts'} found`;
      }

      this.updateCategoryTabs();

      if (!container) return;

      if (this.filteredContacts.length === 0) {
        container.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
      }

      if (emptyEl) emptyEl.classList.add('hidden');

      if (this.viewMode === 'grid') {
        container.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3';
        container.innerHTML = this.filteredContacts.map(c => this.renderCard(c)).join('');
      } else {
        container.className = 'w-full';
        container.innerHTML = this.renderTable(this.filteredContacts);
      }

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }

    renderCard(c) {
      const isEmergency = c.isEmergency;
      const cardBorder = isEmergency ? 'border-2 border-red-500 shadow-md ring-2 ring-red-400/30' : 'border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300';
      const extBtnTheme = isEmergency 
        ? 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400/40 animate-pulse'
        : 'bg-slate-900 hover:bg-teal-700 text-white';

      return `
        <div class="group relative rounded-xl bg-white p-3.5 flex flex-col justify-between transition-all duration-200 ${cardBorder} ${c.cardBg}">
          <!-- Top Accent Stripe -->
          <div class="absolute top-0 left-3 right-3 h-1 rounded-b-md bg-gradient-to-r ${c.gradient}"></div>

          <!-- Top Meta Row -->
          <div class="flex items-start justify-between gap-2 pt-1 mb-2.5">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${c.avatarBg}">
                ${isEmergency ? '<i data-lucide="alert-triangle" class="w-4 h-4"></i>' : c.initials}
              </div>
              <div class="min-w-0">
                <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide truncate max-w-[130px] border ${c.tagBg}">
                  ${c.categoryLabel}
                </span>
              </div>
            </div>
            <span class="text-[10px] font-mono text-slate-400 shrink-0 font-medium">#${c.sr}</span>
          </div>

          <!-- Contact Name -->
          <div class="mb-3">
            <h4 class="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-slate-950 transition-colors line-clamp-2 leading-snug" title="${c.name}">
              ${c.name}
            </h4>
          </div>

          <!-- Bottom Action Row: Big Extension + Copy -->
          <div class="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
            <div class="flex items-baseline gap-1">
              <span class="text-[10px] uppercase font-bold text-slate-400">Ext</span>
              <span class="text-sm font-extrabold font-mono ${isEmergency ? 'text-red-700' : 'text-slate-900'} tracking-wider">
                ${c.ext}
              </span>
            </div>
            
            <button
              type="button"
              onclick="portalDirectorySuite.copyExtension('${c.ext}', '${c.name.replace(/'/g, "\\'")}', event)"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-150 cursor-pointer shadow-2xs active:scale-95 ${extBtnTheme}"
              title="Copy Extension ${c.ext}"
            >
              <i data-lucide="copy" class="w-3 h-3"></i>
              <span>Copy</span>
            </button>
          </div>
        </div>
      `;
    }

    renderTable(contacts) {
      return `
        <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50/90 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th class="py-2.5 px-3 w-12 text-center">Sr.</th>
                <th class="py-2.5 px-3 w-28">Extension</th>
                <th class="py-2.5 px-4">Contact / Location</th>
                <th class="py-2.5 px-3">Department</th>
                <th class="py-2.5 px-3 text-right">Quick Dial</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              ${contacts.map(c => `
                <tr class="hover:bg-slate-50/80 transition-colors ${c.isEmergency ? 'bg-red-50/60 font-semibold' : ''}">
                  <td class="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">#${c.sr}</td>
                  <td class="py-2 px-3 font-mono">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-extrabold ${c.isEmergency ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-800 border border-slate-200'}">
                      <i data-lucide="phone" class="w-2.5 h-2.5"></i>
                      ${c.ext}
                    </span>
                  </td>
                  <td class="py-2 px-4 text-slate-900 font-bold text-xs sm:text-[13px]">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${c.avatarBg}">
                        ${c.initials}
                      </div>
                      <span class="truncate">${c.name}</span>
                    </div>
                  </td>
                  <td class="py-2 px-3">
                    <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${c.tagBg}">
                      ${c.categoryLabel}
                    </span>
                  </td>
                  <td class="py-2 px-3 text-right">
                    <button
                      type="button"
                      onclick="portalDirectorySuite.copyExtension('${c.ext}', '${c.name.replace(/'/g, "\\'")}', event)"
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                      title="Copy ${c.ext}"
                    >
                      <i data-lucide="copy" class="w-3 h-3"></i>
                      <span>Copy</span>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    updateCategoryTabs() {
      const container = document.getElementById('directory-category-tabs');
      if (!container) return;

      const counts = { all: this.rawContacts.length };
      Object.keys(CATEGORIES).forEach(k => {
        if (k !== 'all') {
          counts[k] = this.rawContacts.filter(c => c.categoryId === k).length;
        }
      });

      const tabs = [
        { id: 'all', label: 'All', icon: 'users', count: counts.all },
        { id: 'emergency', label: 'Safety (8888)', icon: 'alert-triangle', count: counts.emergency, isRed: true },
        { id: 'executive', label: 'Executive (8000s)', icon: 'crown', count: counts.executive },
        { id: 'operations', label: 'Operations & MCR (8300s)', icon: 'zap', count: counts.operations },
        { id: 'mechanical', label: 'Mechanical (8400s)', icon: 'wrench', count: counts.mechanical },
        { id: 'ei', label: 'E&I (8500s)', icon: 'cpu', count: counts.ei },
        { id: 'process_lab', label: 'Process & Lab (8600s)', icon: 'flask-conical', count: counts.process_lab },
        { id: 'admin_hr', label: 'Admin & HR (8200s)', icon: 'building-2', count: counts.admin_hr },
        { id: 'security', label: 'Security & Gates', icon: 'shield', count: counts.security },
        { id: 'scm', label: 'SCM & Stores (8700s)', icon: 'package', count: counts.scm },
        { id: 'conference', label: 'Conference Rooms', icon: 'presentation', count: counts.conference }
      ];

      container.innerHTML = tabs.map(t => {
        const isActive = this.activeCategory === t.id;
        let activeStyles = '';
        if (isActive) {
          activeStyles = t.isRed 
            ? 'bg-red-600 text-white shadow-xs border-red-600'
            : 'bg-teal-700 text-white shadow-xs border-teal-700';
        } else {
          activeStyles = t.isRed
            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50';
        }

        return `
          <button
            type="button"
            onclick="portalDirectorySuite.setCategory('${t.id}')"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeStyles}"
          >
            <i data-lucide="${t.icon}" class="w-3 h-3"></i>
            <span>${t.label}</span>
            <span class="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}">
              ${t.count || 0}
            </span>
          </button>
        `;
      }).join('');
    }

    updateSyncUI() {
      const syncStatusEl = document.getElementById('directory-sync-status');
      const syncTimeEl = document.getElementById('directory-sync-time');
      const refreshBtn = document.getElementById('directory-refresh-btn');

      if (syncStatusEl) {
        if (this.isLoading) {
          syncStatusEl.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span class="text-amber-700 font-semibold">Syncing with Google Sheet...</span>
          `;
        } else {
          syncStatusEl.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="text-emerald-700 font-semibold">Live Google Sheet Connected</span>
          `;
        }
      }

      if (syncTimeEl) {
        if (this.lastSynced) {
          const timeStr = this.lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          syncTimeEl.textContent = `Updated: ${timeStr}`;
        } else {
          syncTimeEl.textContent = 'Awaiting sync';
        }
      }

      if (refreshBtn) {
        const icon = refreshBtn.querySelector('i');
        if (icon) {
          if (this.isLoading) {
            icon.classList.add('animate-spin');
          } else {
            icon.classList.remove('animate-spin');
          }
        }
      }
    }

    copyExtension(ext, name, event) {
      if (event && event.stopPropagation) event.stopPropagation();
      const textToCopy = String(ext || '').trim();
      if (!textToCopy) return;

      const triggerBtn = event ? (event.currentTarget || event.target.closest('button')) : null;

      const doFeedback = () => {
        this.showToast(`Copied extension ${textToCopy} (${name || 'FPCL'}) to clipboard!`, 'success');
        if (triggerBtn) {
          const originalHtml = triggerBtn.innerHTML;
          triggerBtn.innerHTML = `<i data-lucide="check" class="w-3 h-3 text-emerald-400"></i><span class="text-emerald-300">Copied!</span>`;
          triggerBtn.classList.add('bg-emerald-800', 'text-white');
          if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
          }
          setTimeout(() => {
            triggerBtn.innerHTML = originalHtml;
            triggerBtn.classList.remove('bg-emerald-800', 'text-white');
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
              window.lucide.createIcons();
            }
          }, 1400);
        }
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(doFeedback).catch(() => {
          this.fallbackCopy(textToCopy);
          doFeedback();
        });
      } else {
        this.fallbackCopy(textToCopy);
        doFeedback();
      }
    }

    fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.warn('Fallback copy failed', err);
      }
      document.body.removeChild(ta);
    }

    showToast(message, type = 'info') {
      let toast = document.getElementById('directory-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'directory-toast';
        toast.className = 'fixed bottom-6 right-6 z-[9999] px-4 py-2.5 rounded-xl shadow-xl border text-xs font-bold transition-all duration-300 transform translate-y-8 opacity-0 flex items-center gap-2 pointer-events-none';
        document.body.appendChild(toast);
      }

      const styles = {
        success: 'bg-slate-900 text-white border-emerald-500/50 shadow-emerald-500/10',
        warning: 'bg-amber-900 text-white border-amber-500/50 shadow-amber-500/10',
        info: 'bg-slate-900 text-white border-slate-700'
      };

      toast.className = `fixed bottom-6 right-6 z-[9999] px-4 py-2.5 rounded-xl shadow-xl border text-xs font-bold transition-all duration-300 flex items-center gap-2 pointer-events-none ${styles[type] || styles.info}`;
      toast.innerHTML = `
        <span class="w-2 h-2 rounded-full ${type === 'success' ? 'bg-emerald-400' : 'bg-cyan-400'}"></span>
        <span>${message}</span>
      `;

      // Animate in
      requestAnimationFrame(() => {
        toast.classList.remove('translate-y-8', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
      });

      // Animate out
      if (this._toastTimer) clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-8', 'opacity-0');
      }, 2500);
    }
  }

  // Instantiate and bind to global
  window.portalDirectorySuite = new FPCLDirectorySuite();

  // Auto-fetch data on window load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.portalDirectorySuite.fetchLiveData();
    });
  } else {
    window.portalDirectorySuite.fetchLiveData();
  }
})();
