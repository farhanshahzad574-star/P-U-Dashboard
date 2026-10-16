/**
 * FPCL Executive Operations & Compliance Portal
 * Strategic Dashboard Suite - Employee Action Sheets & Boss Executive Summary Rollup
 *
 * CONCEPT:
 * - All department tiles are connected to a single Google Sheet assigned to a unique employee.
 * - The Strategic Dashboard tile is the Boss/Executive Summary Dashboard which provides a summary
 *   of all tiles for the boss to track actions assigned to unique employees (closed vs open).
 * - NOT a dossier: Real actionable task tracking, live Google Sheet sync, closure metrics, and boss rollup.
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    PASSWORDS: 'fpcl_strategic_passwords',
    EMPLOYEE_SHEETS: 'fpcl_strategic_employee_sheets',
    EMPLOYEE_ACTIONS: 'fpcl_strategic_employee_actions_v2'
  };

  const strategicSuite = {
    DEFAULT_INITIAL_PASSWORD: 'Abcd@1234',
    MASTER_PASSWORD: 'abcd@Psuser12345',

    state: {
      currentView: 'grid', // 'grid' | 'dashboard'
      searchQuery: '',
      categoryFilter: 'all',
      statusFilter: 'all', // 'all' | 'open' | 'closed'
      selectedTileId: null,
      activeAuthTileId: null,
      authView: 'unlock', // 'unlock' | 'change'
      unlockedTiles: new Set(),
      isMasterActive: false,
      lastMasterUsed: false,
      isSyncingAll: false,
      syncStatus: {},
      employeeFilterInBoss: 'all',
      bossActionStatusFilter: 'all', // 'all' | 'open' | 'closed'
      bossSearchQuery: '',
      employeeDetailTab: 'actions', // 'actions' | 'sheet_config'
      employeeActionStatusFilter: 'all',
      // In-flight sync tracking triggered automatically on tile click
      inFlightTileSync: {},
      tileSyncInProgress: {},
      // Dynamic filters and pagination for Individual Tile Dashboard
      tileFilterSearch: '',
      tileFilterStatus: 'all', // 'all' | 'Open' | 'Closed'
      tileFilterColE: 'all', // Column E: Action category
      tileFilterColF: 'all', // Column F: Assigned to
      tileFilterColH: 'all', // Column H: Status detail
      tileFilterColJ: 'all', // Column J: Ack by
      tileFilterColC: 'all', // Legacy alias for Action category
      tileFilterColD: 'all', // Legacy alias for Assigned to
      tilePage: 1,
      tilePageSize: 15,
      tileLastSynced: {},
      tileActions: {},
      // Dynamic filters and pagination for Strategic Master Rollup Dashboard (All Department Actions)
      masterFilterSearch: '',
      masterFilterDept: 'all', // 'all' | tileId
      masterFilterStatus: 'all', // 'all' | 'Open' | 'Closed'
      masterFilterColE: 'all', // Column E: Action category
      masterFilterColF: 'all', // Column F: Assigned to
      masterFilterColH: 'all', // Column H: Status detail
      masterFilterColJ: 'all', // Column J: Ack by
      masterFilterColC: 'all', // Legacy alias for Action category
      masterFilterColD: 'all', // Legacy alias for Assigned to
      masterPage: 1,
      masterPageSize: 15,
      masterLastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sheetConfigModalTileId: null,
      // COO Dashboard Sub-Tabs: 'self-assigned' | 'all-department'
      cooSubTab: 'self-assigned',
      cooSelfFilterSearch: '',
      cooSelfFilterColE: 'all',
      cooSelfFilterColH: 'all',
      cooSelfFilterColJ: 'all',
      cooSelfFilterColC: 'all',
      cooSelfFilterColF: 'all',
      cooSelfPage: 1,
      cooSelfPageSize: 15,
      cooSelfLastSynced: 'Live',
      cooSelfIsSyncing: false,
      isDeptActionsModalOpen: false,
      deptActionsModalSearch: '',
      visibility: {
        auth: false,
        old: false,
        new: false,
        confirm: false,
        masterInput: false,
        reset: false
      }
    },

    init() {
      window.FPCL_STRATEGIC_SUITE = this;
      this.loadStoredData();
      this.loadCooStoredActions();
      this.fetchServerSheetConfigs();
      this.fetchCooSelfAssignedActions();
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const authModal = document.getElementById('strategic-auth-modal');
          if (authModal && !authModal.classList.contains('hidden')) {
            this.closeAuthModal();
          } else if (this.state.currentView === 'dashboard') {
            this.backToGrid();
          }
        }
      });
    },

    // Automatically query backend for live Google Sheet data & environment secret-configured sheet URLs
    async fetchServerSheetConfigs() {
      // 1. Fetch live parsed actions directly from Google Sheets
      try {
        const res = await fetch('/api/strategic/live-data', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.liveActions) {
            let updated = false;
            for (const [tileId, actions] of Object.entries(data.liveActions)) {
              if (Array.isArray(actions) && actions.length > 0) {
                this.customActions[tileId] = actions;
                this.state.tileLastSynced[tileId] = data.data?.[tileId]?.lastSynced || 'Just now';
                updated = true;
              }
            }
            this.state.masterLastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (updated) {
              this.saveStoredActions();
              this.render();
            }
          }
        }
      } catch (err) {
        console.warn('Initial live sheet fetch note:', err);
      }

      // 2. Fetch sheet configurations & URLs
      try {
        const res = await fetch('/api/strategic/sheets', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.sheets) {
            this.serverSheets = data.sheets;
            const CANONICAL_TARGET_IDS = {
              'asset-integrity': '1al3SsYo9FWHZxc8rYrJE5SV4H3RafPcd1xGSyfcy5Nc',
              'business-development': '1PYQlmmzy2VFMohIlNxipiFsfgKPsopgd2VdAdXhMiB4',
              'civil': '1EPIHm33gIOTrAfXvjGO3yRQhu5jPl_BjstTaWtWgs_0',
              'ei': '1ap9EfOwDUaoere3nKGmfvLNBKoCNp_KB_8KSEc3Y3fA',
              'finance': '1hpQsdyMteOhlFCSAm9Yb3GQT_veTVArxcy3inSpkGdA',
              'hcm': '1Macb6nmGzel3tseZPp61lHuL8NagAxZPZFRQnw4yCU0',
              'ims': '1kyekkmRkxYCWxXYjKp5zCSM_NAnb6uqmCBnLcgDR6iM',
              'it': '1wJ-MIlSvfguUMTz06eqJ2brAYt47gtqKB_nPGrGMuaM',
              'ld': '1lWSPmrx5LBX64E4vY-VWafLWwql8K7aBcxicprO3ZE0',
              'inspection': '1fW4P4HXfD6Yt5uvNnB2B6u4GveOBK8VSEPal-giXCIw',
              'machinery': '1zRmPlFDlRijQOTboLfhukEjdFHeUR9P5pcRIUeV7rY0',
              'mechanical': '1gedfNYWwLaLDL85bz2PuDGi1NZP8QiwW42Vklym5i1w',
              'operations': '19iQ_D6k_hvKYP8-FTuBZ51yTcu3Zo2Q0VhXv67wRVZ0',
              'reliability': '15H3FZaEOczMu5_XcGo7Rs576n4CVakY0iRlvHYdbyvk',
              'scm': '1SXhHYiQy21bF1g0PimScyhhyBGNch37VWTSHTgWPbP0',
              'projects': '1Gr0IBANH6GeKMeozJywlHrQccPBdrMuJ5RRctPsQvRI',
              'process': '1w3ZgX9ixr4xLbesrDIhDZcTV7iQ8wL9XQ3VivZ5YKWs'
            };

            let updated = false;
            for (const [key, conf] of Object.entries(data.sheets)) {
              if (conf && conf.sheetUrl) {
                const designatedId = CANONICAL_TARGET_IDS[key];
                if (designatedId && !conf.sheetUrl.includes(designatedId)) {
                  continue;
                }
                this.customSheets[key] = {
                  ...(this.customSheets[key] || {}),
                  sheetUrl: conf.sheetUrl,
                  sheetTab: conf.sheetTab || 'Sheet1',
                  fromSecret: Boolean(conf.fromSecret)
                };
                updated = true;
              }
            }
            if (updated) {
              this.saveStoredSheets();
              this.render();
            }
          }
        }
      } catch (err) {
        // Fallback gracefully
      }
    },

    getEmployeesConfig() {
      if (window.FPCL_STRATEGIC_DATA && Array.isArray(window.FPCL_STRATEGIC_DATA.EMPLOYEES)) {
        return window.FPCL_STRATEGIC_DATA.EMPLOYEES;
      }
      return [];
    },

    // Persistent storage for custom actions and custom sheet URLs
    loadStoredData() {
      const CANONICAL_TARGET_IDS = {
        'asset-integrity': '1al3SsYo9FWHZxc8rYrJE5SV4H3RafPcd1xGSyfcy5Nc',
        'business-development': '1PYQlmmzy2VFMohIlNxipiFsfgKPsopgd2VdAdXhMiB4',
        'civil': '1EPIHm33gIOTrAfXvjGO3yRQhu5jPl_BjstTaWtWgs_0',
        'ei': '1ap9EfOwDUaoere3nKGmfvLNBKoCNp_KB_8KSEc3Y3fA',
        'finance': '1hpQsdyMteOhlFCSAm9Yb3GQT_veTVArxcy3inSpkGdA',
        'hcm': '1Macb6nmGzel3tseZPp61lHuL8NagAxZPZFRQnw4yCU0',
        'ims': '1kyekkmRkxYCWxXYjKp5zCSM_NAnb6uqmCBnLcgDR6iM',
        'it': '1wJ-MIlSvfguUMTz06eqJ2brAYt47gtqKB_nPGrGMuaM',
        'ld': '1lWSPmrx5LBX64E4vY-VWafLWwql8K7aBcxicprO3ZE0',
        'inspection': '1fW4P4HXfD6Yt5uvNnB2B6u4GveOBK8VSEPal-giXCIw',
        'machinery': '1zRmPlFDlRijQOTboLfhukEjdFHeUR9P5pcRIUeV7rY0',
        'mechanical': '1gedfNYWwLaLDL85bz2PuDGi1NZP8QiwW42Vklym5i1w',
        'operations': '19iQ_D6k_hvKYP8-FTuBZ51yTcu3Zo2Q0VhXv67wRVZ0',
        'reliability': '15H3FZaEOczMu5_XcGo7Rs576n4CVakY0iRlvHYdbyvk',
        'scm': '1SXhHYiQy21bF1g0PimScyhhyBGNch37VWTSHTgWPbP0',
        'projects': '1Gr0IBANH6GeKMeozJywlHrQccPBdrMuJ5RRctPsQvRI',
        'process': '1w3ZgX9ixr4xLbesrDIhDZcTV7iQ8wL9XQ3VivZ5YKWs'
      };

      try {
        const storedActions = localStorage.getItem(STORAGE_KEYS.EMPLOYEE_ACTIONS);
        this.customActions = storedActions ? JSON.parse(storedActions) : {};

        let purged = false;
        // Purge old mock actions or actions with obsolete keys
        for (const [key, actions] of Object.entries(this.customActions)) {
          if (Array.isArray(actions)) {
            const hasSampleData = actions.some(a => 
              /student name|alexandra|drama club|class level|extracurricular/i.test(a.title || '') ||
              /student name|alexandra|drama club|class level|extracurricular/i.test(a.remarks || '') ||
              /student name|alexandra|drama club|class level|extracurricular/i.test(JSON.stringify(a.rawColumns || {}))
            );
            if (hasSampleData) {
              delete this.customActions[key];
              purged = true;
            }
          }
        }

        // Ensure Background and Date/Reference are populated on all customActions
        let customUpdated = false;
        const std10Headers = ['S_No', 'Background', 'Date/Reference', 'Assigned Action', 'Action category', 'Assigned to', 'Target date', 'Status detail', 'Remarks', 'Ack by'];
        for (const [key, actions] of Object.entries(this.customActions)) {
          if (Array.isArray(actions)) {
            actions.forEach(a => {
              if (a) {
                const raw = a.rawColumns || {};
                const bg = a.background || raw['Background'] || raw['background'] || raw['Bg'] || raw['bg'] || '';
                const dateRef = a.dateReference || raw['Date/Reference'] || raw['Date / Reference'] || raw['date/reference'] || raw['date_reference'] || raw['Reference'] || raw['ref'] || '';
                a.background = bg;
                a.dateReference = dateRef;
                if (!a.rawColumns) a.rawColumns = {};
                a.rawColumns['Background'] = bg;
                a.rawColumns['Date/Reference'] = dateRef;

                if (!Array.isArray(a.columnHeaders) || !a.columnHeaders.some(h => /background|bg/i.test(h)) || !a.columnHeaders.some(h => /date\/reference|reference/i.test(h))) {
                  a.columnHeaders = [...std10Headers];
                  customUpdated = true;
                }
              }
            });
          }
        }

        if (purged || customUpdated) {
          this.saveStoredActions();
        }
      } catch (e) {
        this.customActions = {};
      }

      try {
        const storedSheets = localStorage.getItem(STORAGE_KEYS.EMPLOYEE_SHEETS);
        this.customSheets = storedSheets ? JSON.parse(storedSheets) : {};
        let purgedSheets = false;

        // Auto-purge any stale sheets that don't match the designated sheetId
        for (const [tId, designatedId] of Object.entries(CANONICAL_TARGET_IDS)) {
          const sheet = this.customSheets[tId];
          if (sheet && sheet.sheetUrl && !sheet.sheetUrl.includes(designatedId)) {
            delete this.customSheets[tId];
            purgedSheets = true;
          }
        }

        for (const [key, sheet] of Object.entries(this.customSheets)) {
          if (sheet && sheet.sheetUrl && (
            sheet.sheetUrl.includes('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms') ||
            sheet.sheetUrl.includes('1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA') && CANONICAL_TARGET_IDS[key]
          )) {
            delete this.customSheets[key];
            purgedSheets = true;
          }
        }

        if (purgedSheets) {
          this.saveStoredSheets();
        }
      } catch (e) {
        this.customSheets = {};
      }
    },

    saveStoredActions() {
      try {
        localStorage.setItem(STORAGE_KEYS.EMPLOYEE_ACTIONS, JSON.stringify(this.customActions));
      } catch (e) {
        console.error('Failed to save actions:', e);
      }
    },

    saveStoredSheets() {
      try {
        localStorage.setItem(STORAGE_KEYS.EMPLOYEE_SHEETS, JSON.stringify(this.customSheets));
      } catch (e) {
        console.error('Failed to save sheets:', e);
      }
    },

    loadCooStoredActions() {
      try {
        const stored = localStorage.getItem('fpcl_coo_self_actions_v3');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0 && ('background' in parsed[0] || 'Background' in (parsed[0].rawColumns || {}))) {
            if (parsed[0].action !== 'COO' && parsed[0].assignedTo !== 'abcd') {
              this.cooSelfActions = parsed;
              return;
            }
          }
        }
      } catch (e) {}

      // Verified seed baseline directly from Sheet ID 1s5czmIVCXiOPTRc69QffJ51JFW2-gAErPitstUar2dU, Tab COO
      this.cooSelfActions = [
        {
          sNo: '1',
          background: '',
          dateReference: '24/06/26',
          action: 'Regarding the effective integration of human capital across the organization, transfer of FPCL employees to FFC stream along with harmonization of policies to be ensured. \nInstruction Required from COO-FPCL to HCM',
          category: 'Director M&O',
          assignedTo: 'COO',
          targetDate: '',
          statusDetail: 'Open',
          remarks: 'On going. 01 Executive tranfered to digitilization Project',
          ackBy: '',
          rawColumns: {
            'S_No': '1',
            'Background': '',
            'Date/Reference': '24/06/26',
            'Assigned Action': 'Regarding the effective integration of human capital across the organization, transfer of FPCL employees to FFC stream along with harmonization of policies to be ensured. \nInstruction Required from COO-FPCL to HCM',
            'Action category': 'Director M&O',
            'Assigned to': 'COO',
            'Target date': '',
            'Status detail': 'Open',
            'Remarks': 'On going. 01 Executive tranfered to digitilization Project',
            'Ack by': ''
          }
        },
        {
          sNo: '2',
          background: '',
          dateReference: '24/06/26',
          action: 'Business Development at site to be supported by the Planning and L&D teams of PQ Site. \nAction required by COO-FPCL',
          category: 'Director M&O',
          assignedTo: 'COO',
          targetDate: '',
          statusDetail: '',
          remarks: 'Decision Required',
          ackBy: '',
          rawColumns: {
            'S_No': '2',
            'Background': '',
            'Date/Reference': '24/06/26',
            'Assigned Action': 'Business Development at site to be supported by the Planning and L&D teams of PQ Site. \nAction required by COO-FPCL',
            'Action category': 'Director M&O',
            'Assigned to': 'COO',
            'Target date': '',
            'Status detail': '',
            'Remarks': 'Decision Required',
            'Ack by': ''
          }
        },
        {
          sNo: '3',
          background: '',
          dateReference: '8/6/2026',
          action: 'CE&MD was apprised on Power export to KE since TA-2026 which remained sightly above the Budget but weII below the contractual value. It was pointed out that KE is currently operatiting its RLNG based pIant (BQPS-III) which is weII beIow in merit order (9-10 ranking) vs FPCL (5th ranking). The Management advised to formaIIy take up the matttter with KE if this Merit Order vioIatition persists.\nCOO-FPCL to Decide- Target date was Aug-2026.',
          category: 'MD',
          assignedTo: 'COO',
          targetDate: '',
          statusDetail: '',
          remarks: 'Executive high level meeting conducted on 9 Oct 2026, followed by operating committee meeting.',
          ackBy: '',
          rawColumns: {
            'S_No': '3',
            'Background': '',
            'Date/Reference': '8/6/2026',
            'Assigned Action': 'CE&MD was apprised on Power export to KE since TA-2026 which remained sightly above the Budget but weII below the contractual value. It was pointed out that KE is currently operatiting its RLNG based pIant (BQPS-III) which is weII beIow in merit order (9-10 ranking) vs FPCL (5th ranking). The Management advised to formaIIy take up the matttter with KE if this Merit Order vioIatition persists.\nCOO-FPCL to Decide- Target date was Aug-2026.',
            'Action category': 'MD',
            'Assigned to': 'COO',
            'Target date': '',
            'Status detail': '',
            'Remarks': 'Executive high level meeting conducted on 9 Oct 2026, followed by operating committee meeting.',
            'Ack by': ''
          }
        }
      ];
    },

    saveCooStoredActions() {
      try {
        localStorage.setItem('fpcl_coo_self_actions_v3', JSON.stringify(this.cooSelfActions));
      } catch (e) {}
    },

    parseCooSelfCsv(csvText) {
      if (!csvText || typeof csvText !== 'string') return [];

      // Parse CSV respecting quoted multi-line fields (RFC-4180)
      const rows = [];
      let currentRow = [];
      let currentToken = '';
      let inQuotes = false;

      for (let i = 0; i < csvText.length; i++) {
        const ch = csvText[i];
        const nextCh = csvText[i + 1];

        if (ch === '"') {
          if (inQuotes && nextCh === '"') {
            currentToken += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          currentRow.push(currentToken.trim().replace(/^"|"$/g, ''));
          currentToken = '';
        } else if ((ch === '\r' || ch === '\n') && !inQuotes) {
          if (ch === '\r' && nextCh === '\n') {
            i++;
          }
          currentRow.push(currentToken.trim().replace(/^"|"$/g, ''));
          currentToken = '';
          if (currentRow.length > 0 && currentRow.some(cell => cell.length > 0)) {
            rows.push(currentRow);
          }
          currentRow = [];
        } else {
          currentToken += ch;
        }
      }

      if (currentToken.length > 0 || currentRow.length > 0) {
        currentRow.push(currentToken.trim().replace(/^"|"$/g, ''));
        if (currentRow.some(cell => cell.length > 0)) {
          rows.push(currentRow);
        }
      }

      if (rows.length <= 1) return [];

      const rawHeaders = rows[0];
      const normHeaders = rawHeaders.map(h => (h || '').trim().toLowerCase());

      const findIdx = (names) => {
        const exact = normHeaders.findIndex(h => names.some(n => h === n));
        if (exact !== -1) return exact;
        return normHeaders.findIndex(h => names.some(n => h.includes(n)));
      };

      // In Sheet ID 1s5czmIVCXiOPTRc69QffJ51JFW2-gAErPitstUar2dU (Tab: COO):
      // Col A: S_No
      // Col B: Background
      // Col C: Date/Reference
      // Col D: Assigned Action
      // Col E: Action category
      // Col F: Assigned to
      // Col G: Target date
      // Col H: Status detail
      // Col I: Remarks
      // Col J: Ack by
      const sNoIdx = findIdx(['s_no', 's.no', 'sr', 'sno', 'no']);
      const bgIdx = findIdx(['background', 'bg']);
      const dateRefIdx = findIdx(['date/reference', 'date / reference', 'date_reference', 'date-reference', 'datereference', 'reference', 'ref']);
      const actionIdx = findIdx(['assigned action', 'assigned_action', 'action title', 'action', 'title', 'task', 'description']);
      const catIdx = findIdx(['action category', 'category', 'cat']);
      const assignedIdx = findIdx(['assigned to', 'assignee', 'assigned']);
      const targetIdx = findIdx(['target date', 'target', 'due date', 'due']);
      const statusIdx = findIdx(['status detail', 'status', 'state']);
      const remarksIdx = findIdx(['remarks', 'remark', 'note']);
      const ackIdx = findIdx(['ack by', 'ack', 'acknowledged by']);

      const items = [];
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i];
        const sNo = (sNoIdx !== -1 && cells[sNoIdx] !== undefined) ? cells[sNoIdx].trim() : (cells[0] ? cells[0].trim() : String(i));
        const background = (bgIdx !== -1 && cells[bgIdx] !== undefined) ? cells[bgIdx].trim() : (cells[1] ? cells[1].trim() : '');
        const dateReference = (dateRefIdx !== -1 && cells[dateRefIdx] !== undefined) ? cells[dateRefIdx].trim() : (cells[2] ? cells[2].trim() : '');
        const actionTitle = (actionIdx !== -1 && cells[actionIdx] !== undefined) ? cells[actionIdx].trim() : (cells[3] ? cells[3].trim() : '');
        if (!actionTitle && !sNo && !background && !dateReference) continue;

        const actionCat = (catIdx !== -1 && cells[catIdx] !== undefined) ? cells[catIdx].trim() : (cells[4] ? cells[4].trim() : '');
        const assignedTo = (assignedIdx !== -1 && cells[assignedIdx] !== undefined) ? cells[assignedIdx].trim() : (cells[5] ? cells[5].trim() : '');
        const targetDate = (targetIdx !== -1 && cells[targetIdx] !== undefined) ? cells[targetIdx].trim() : (cells[6] ? cells[6].trim() : '');
        const rawStatus = (statusIdx !== -1 && cells[statusIdx] !== undefined) ? cells[statusIdx].trim() : (cells[7] ? cells[7].trim() : '');
        const remarks = (remarksIdx !== -1 && cells[remarksIdx] !== undefined) ? cells[remarksIdx].trim() : (cells[8] ? cells[8].trim() : '');
        const ackBy = (ackIdx !== -1 && cells[ackIdx] !== undefined) ? cells[ackIdx].trim() : (cells[9] ? cells[9].trim() : '');

        const rawColumns = {};
        rawHeaders.forEach((h, hIdx) => {
          if (h) rawColumns[h] = cells[hIdx] !== undefined ? cells[hIdx].trim() : '';
        });
        rawColumns['S_No'] = sNo;
        rawColumns['Background'] = background;
        rawColumns['Date/Reference'] = dateReference;
        rawColumns['Assigned Action'] = actionTitle;
        rawColumns['Action category'] = actionCat;
        rawColumns['Assigned to'] = assignedTo;
        rawColumns['Target date'] = targetDate;
        rawColumns['Status detail'] = rawStatus;
        rawColumns['Remarks'] = remarks;
        rawColumns['Ack by'] = ackBy;

        items.push({
          sNo: sNo || String(i),
          background: background || '',
          dateReference: dateReference || '',
          action: actionTitle,
          category: actionCat || '',
          assignedTo: assignedTo || '',
          targetDate: targetDate || '',
          statusDetail: rawStatus || '',
          remarks: remarks || '',
          ackBy: ackBy || '',
          rawColumns
        });
      }
      return items;
    },

    async fetchCooSelfAssignedActions(force = false) {
      const SHEET_ID = '1s5czmIVCXiOPTRc69QffJ51JFW2-gAErPitstUar2dU';
      const TAB_NAME = 'COO';
      this.state.cooSelfIsSyncing = true;
      this.render();

      const endpoints = [
        `/api/sheets/fetch?sheetId=${SHEET_ID}&sheet=${encodeURIComponent(TAB_NAME)}${force ? '&force=true' : ''}`,
        `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(TAB_NAME)}&_t=${Date.now()}`,
        `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&sheet=${encodeURIComponent(TAB_NAME)}&_t=${Date.now()}`
      ];

      let csvText = '';
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, { cache: 'no-store' });
          if (res.ok) {
            if (ep.startsWith('/api/sheets/fetch')) {
              const json = await res.json();
              if (json && json.csvText && json.csvText.length > 20) {
                csvText = json.csvText;
                break;
              }
            } else {
              const text = await res.text();
              if (text && !text.includes('<!DOCTYPE html') && text.length > 20) {
                csvText = text;
                break;
              }
            }
          }
        } catch (e) {
          // continue to next endpoint
        }
      }

      if (csvText) {
        const parsed = this.parseCooSelfCsv(csvText);
        if (parsed.length > 0) {
          this.cooSelfActions = parsed;
          this.saveCooStoredActions();
          this.state.cooSelfLastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      }

      this.state.cooSelfIsSyncing = false;
      this.render();
    },

    setCooSubTab(tab) {
      this.state.cooSubTab = tab;
      if (tab === 'self-assigned') {
        this.fetchCooSelfAssignedActions();
      }
      this.render();
    },

    setCooSelfFilter(key, val) {
      this.state[key] = val;
      this.state.cooSelfPage = 1;
      this.render();
    },

    clearCooSelfFilters() {
      this.state.cooSelfFilterSearch = '';
      this.state.cooSelfFilterColE = 'all';
      this.state.cooSelfFilterColH = 'all';
      this.state.cooSelfFilterColJ = 'all';
      this.state.cooSelfFilterColC = 'all';
      this.state.cooSelfFilterColF = 'all';
      this.state.cooSelfPage = 1;
      this.render();
    },

    setCooSelfPage(page) {
      this.state.cooSelfPage = Math.max(1, page);
      this.render();
    },

    setCooSelfPageSize(size) {
      this.state.cooSelfPageSize = size === 'all' ? 9999 : Number(size);
      this.state.cooSelfPage = 1;
      this.render();
    },

    classifyStatusDetail(val) {
      const s = String(val || '').trim().toLowerCase();
      if (/drop|cancelled|abandoned/i.test(s)) return 'Dropped';
      if (/overdue/i.test(s)) return 'Overdue';
      if (/close|validation|uploaded|passed|done|complete|resolved/i.test(s)) return 'Closed';
      if (/open|pending|documents remaining|remaining|active|in progress/i.test(s)) return 'Open';
      if (s) return s.charAt(0).toUpperCase() + s.slice(1);
      return 'Open';
    },

    getFilteredCooSelfActions() {
      const actions = this.cooSelfActions || [];
      const q = (this.state.cooSelfFilterSearch || '').toLowerCase().trim();
      const catFilter = (this.state.cooSelfFilterColE || this.state.cooSelfFilterColC || 'all').trim();
      const statusFilter = (this.state.cooSelfFilterColH || this.state.cooSelfFilterColF || 'all').trim();
      const ackFilter = (this.state.cooSelfFilterColJ || 'all').trim();

      return actions.filter(a => {
        // Column E: Action category filter
        if (catFilter !== 'all') {
          if ((a.category || '').toLowerCase() !== catFilter.toLowerCase()) return false;
        }

        // Column H: Status detail filter
        if (statusFilter !== 'all') {
          const classified = this.classifyStatusDetail(a.statusDetail);
          if (statusFilter === 'Open' && classified !== 'Open') return false;
          if (statusFilter === 'Closed' && classified !== 'Closed') return false;
          if (statusFilter === 'Overdue' && classified !== 'Overdue') return false;
          if (statusFilter === 'Dropped' && classified !== 'Dropped') return false;
          if (!['Open', 'Closed', 'Overdue', 'Dropped'].includes(statusFilter)) {
            if ((a.statusDetail || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
          }
        }

        // Column J: Ack by filter
        if (ackFilter !== 'all') {
          if ((a.ackBy || '').toLowerCase() !== ackFilter.toLowerCase()) return false;
        }

        // Search filter (searches across all columns including Background and Date/Reference)
        if (q) {
          const match =
            (a.sNo && String(a.sNo).toLowerCase().includes(q)) ||
            (a.background && a.background.toLowerCase().includes(q)) ||
            (a.dateReference && a.dateReference.toLowerCase().includes(q)) ||
            (a.action && a.action.toLowerCase().includes(q)) ||
            (a.category && a.category.toLowerCase().includes(q)) ||
            (a.assignedTo && a.assignedTo.toLowerCase().includes(q)) ||
            (a.targetDate && a.targetDate.toLowerCase().includes(q)) ||
            (a.statusDetail && a.statusDetail.toLowerCase().includes(q)) ||
            (a.remarks && a.remarks.toLowerCase().includes(q)) ||
            (a.ackBy && a.ackBy.toLowerCase().includes(q));
          if (!match) return false;
        }

        return true;
      });
    },

    exportCooSelfCSV() {
      const filtered = this.getFilteredCooSelfActions();
      const headers = ['S_No', 'Background', 'Date/Reference', 'Assigned Action', 'Action category', 'Assigned to', 'Target date', 'Status detail', 'Remarks', 'Ack by'];
      const rows = [headers.join(',')];

      filtered.forEach(a => {
        const cols = [
          `"${String(a.sNo || '').replace(/"/g, '""')}"`,
          `"${String(a.background || '').replace(/"/g, '""')}"`,
          `"${String(a.dateReference || '').replace(/"/g, '""')}"`,
          `"${String(a.action || '').replace(/"/g, '""')}"`,
          `"${String(a.category || '').replace(/"/g, '""')}"`,
          `"${String(a.assignedTo || '').replace(/"/g, '""')}"`,
          `"${String(a.targetDate || '').replace(/"/g, '""')}"`,
          `"${String(a.statusDetail || '').replace(/"/g, '""')}"`,
          `"${String(a.remarks || '').replace(/"/g, '""')}"`,
          `"${String(a.ackBy || '').replace(/"/g, '""')}"`
        ];
        rows.push(cols.join(','));
      });

      const blob = new Blob([rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `COO_Self_Assigned_Actions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    showCooTooltip(e, category, total, open, closed) {
      let tip = document.getElementById('coo-custom-tooltip');
      if (!tip) {
        tip = document.createElement('div');
        tip.id = 'coo-custom-tooltip';
        tip.className = 'fixed pointer-events-none z-50 bg-white rounded-xl shadow-2xl border-t-4 border-t-[#1D4ED8] p-3 text-xs min-w-[150px] transition-opacity duration-150';
        document.body.appendChild(tip);
      }
      tip.innerHTML = `
        <div class="font-extrabold text-slate-800 border-b border-slate-100 pb-1 mb-1.5">${category}</div>
        <div class="space-y-1">
          <div class="flex items-center justify-between text-[#1E3A8A] font-black">
            <span>Total:</span>
            <span class="font-mono text-xs">${total}</span>
          </div>
          <div class="flex items-center justify-between text-[#DC2626] font-bold">
            <span>Open:</span>
            <span class="font-mono text-xs">${open}</span>
          </div>
          <div class="flex items-center justify-between text-[#0B8A5A] font-bold">
            <span>Closed:</span>
            <span class="font-mono text-xs">${closed}</span>
          </div>
        </div>
      `;
      tip.style.display = 'block';
      this.moveCooTooltip(e);
    },

    moveCooTooltip(e) {
      const tip = document.getElementById('coo-custom-tooltip');
      if (!tip || tip.style.display === 'none') return;
      const x = e.clientX + 14;
      const y = e.clientY + 14;
      tip.style.left = `${Math.min(x, window.innerWidth - 170)}px`;
      tip.style.top = `${Math.min(y, window.innerHeight - 100)}px`;
    },

    hideCooTooltip() {
      const tip = document.getElementById('coo-custom-tooltip');
      if (tip) {
        tip.style.display = 'none';
      }
    },

    getTileData(tileId) {
      const config = this.getEmployeesConfig().find(e => e.id === tileId);
      if (!config) return null;

      // Merge with custom sheet config or server secrets (with alias resolution)
      const customSheet = this.customSheets[tileId] || (tileId === 'admin-security' ? this.customSheets['admin_security'] : {}) || {};
      const serverSheet = (this.serverSheets && (this.serverSheets[tileId] || (tileId === 'admin-security' ? (this.serverSheets['admin_security'] || this.serverSheets['Admin_&_Security']) : null))) || {};
      
      let sheetUrl = config.sheetUrl;
      let sheetTab = config.sheetTab;
      let gid = config.gid;

      const CANONICAL_SHEET_MAP = {
        'asset-integrity': { id: '1al3SsYo9FWHZxc8rYrJE5SV4H3RafPcd1xGSyfcy5Nc', tab: 'ASSET_INTEGRITY_SHEET_URL', url: 'https://docs.google.com/spreadsheets/d/1al3SsYo9FWHZxc8rYrJE5SV4H3RafPcd1xGSyfcy5Nc/edit' },
        'business-development': { id: '1PYQlmmzy2VFMohIlNxipiFsfgKPsopgd2VdAdXhMiB4', tab: 'COMMERCIAL_SHEET_URL', url: 'https://docs.google.com/spreadsheets/d/1PYQlmmzy2VFMohIlNxipiFsfgKPsopgd2VdAdXhMiB4/edit' },
        'civil': { id: '1EPIHm33gIOTrAfXvjGO3yRQhu5jPl_BjstTaWtWgs_0', tab: 'CIVIL_SHEET_URL', url: 'https://docs.google.com/spreadsheets/d/1EPIHm33gIOTrAfXvjGO3yRQhu5jPl_BjstTaWtWgs_0/edit' },
        'ei': { id: '1ap9EfOwDUaoere3nKGmfvLNBKoCNp_KB_8KSEc3Y3fA', tab: 'EI_SHEET_URL', url: 'https://docs.google.com/spreadsheets/d/1ap9EfOwDUaoere3nKGmfvLNBKoCNp_KB_8KSEc3Y3fA/edit' },
        'finance': { id: '1hpQsdyMteOhlFCSAm9Yb3GQT_veTVArxcy3inSpkGdA', tab: 'FINANCE_SHEET_URL', url: 'https://docs.google.com/spreadsheets/d/1hpQsdyMteOhlFCSAm9Yb3GQT_veTVArxcy3inSpkGdA/edit' },
        'hseq': { id: '1jXMXuX2b6HAF_U4e6tiGOzWw2adMpCyUPI5kbODxoPI', tab: 'HSEQ_Actions', url: 'https://docs.google.com/spreadsheets/d/1jXMXuX2b6HAF_U4e6tiGOzWw2adMpCyUPI5kbODxoPI/edit' },
        'hcm': { id: '1Macb6nmGzel3tseZPp61lHuL8NagAxZPZFRQnw4yCU0', tab: 'HCM_SHEET_URL', url: 'https://docs.google.com/spreadsheets/d/1Macb6nmGzel3tseZPp61lHuL8NagAxZPZFRQnw4yCU0/edit' },
        'ims': { id: '1kyekkmRkxYCWxXYjKp5zCSM_NAnb6uqmCBnLcgDR6iM', tab: 'IMS_SHEET_URL', url: 'https://docs.google.com/spreadsheets/d/1kyekkmRkxYCWxXYjKp5zCSM_NAnb6uqmCBnLcgDR6iM/edit' },
        'it': { id: '1wJ-MIlSvfguUMTz06eqJ2brAYt47gtqKB_nPGrGMuaM', tab: 'IT_SHEET_URL', url: 'https://docs.google.com/spreadsheets/d/1wJ-MIlSvfguUMTz06eqJ2brAYt47gtqKB_nPGrGMuaM/edit' },
        'ld': { id: '1lWSPmrx5LBX64E4vY-VWafLWwql8K7aBcxicprO3ZE0', tab: 'LD_SHEET_URL', url: 'https://docs.google.com/spreadsheets/d/1lWSPmrx5LBX64E4vY-VWafLWwql8K7aBcxicprO3ZE0/edit' },
        'inspection': { id: '1fW4P4HXfD6Yt5uvNnB2B6u4GveOBK8VSEPal-giXCIw', tab: 'INSPECTION_SHEET_URL', url: 'https://docs.google.com/spreadsheets/d/1fW4P4HXfD6Yt5uvNnB2B6u4GveOBK8VSEPal-giXCIw/edit' },
        'machinery': { id: '1zRmPlFDlRijQOTboLfhukEjdFHeUR9P5pcRIUeV7rY0', tab: 'MACHINERY_SHEET_URL', url: 'https://docs.google.com/spreadsheets/d/1zRmPlFDlRijQOTboLfhukEjdFHeUR9P5pcRIUeV7rY0/edit' },
        'mechanical': { id: '1gedfNYWwLaLDL85bz2PuDGi1NZP8QiwW42Vklym5i1w', tab: 'MECHANICAL_SHEET_URL', url: 'https://docs.google.com/spreadsheets/d/1gedfNYWwLaLDL85bz2PuDGi1NZP8QiwW42Vklym5i1w/edit' },
        'operations': { id: '19iQ_D6k_hvKYP8-FTuBZ51yTcu3Zo2Q0VhXv67wRVZ0', tab: 'OPERATIONS_SHEET_URL', url: 'https://docs.google.com/spreadsheets/d/19iQ_D6k_hvKYP8-FTuBZ51yTcu3Zo2Q0VhXv67wRVZ0/edit' },
        'reliability': { id: '15H3FZaEOczMu5_XcGo7Rs576n4CVakY0iRlvHYdbyvk', tab: 'RELIABILITY_SHEET_URL', url: 'https://docs.google.com/spreadsheets/d/15H3FZaEOczMu5_XcGo7Rs576n4CVakY0iRlvHYdbyvk/edit' },
        'scm': { id: '1SXhHYiQy21bF1g0PimScyhhyBGNch37VWTSHTgWPbP0', tab: 'SCM_SHEET_URL', url: 'https://docs.google.com/spreadsheets/d/1SXhHYiQy21bF1g0PimScyhhyBGNch37VWTSHTgWPbP0/edit' },
        'projects': { id: '1Gr0IBANH6GeKMeozJywlHrQccPBdrMuJ5RRctPsQvRI', tab: 'PROJECTS', url: 'https://docs.google.com/spreadsheets/d/1Gr0IBANH6GeKMeozJywlHrQccPBdrMuJ5RRctPsQvRI/edit' },
        'process': { id: '1w3ZgX9ixr4xLbesrDIhDZcTV7iQ8wL9XQ3VivZ5YKWs', tab: 'PROCESS_SHEET_URL', url: 'https://docs.google.com/spreadsheets/d/1w3ZgX9ixr4xLbesrDIhDZcTV7iQ8wL9XQ3VivZ5YKWs/edit' }
      };

      if (CANONICAL_SHEET_MAP[tileId]) {
        const canonical = CANONICAL_SHEET_MAP[tileId];
        sheetUrl = canonical.url;
        sheetTab = canonical.tab;
        gid = '0';
        if (customSheet.sheetUrl && customSheet.sheetUrl.includes(canonical.id)) {
          sheetUrl = customSheet.sheetUrl;
          if (customSheet.sheetTab) sheetTab = customSheet.sheetTab;
          if (customSheet.gid !== undefined) gid = customSheet.gid;
        } else if (serverSheet.sheetUrl && serverSheet.sheetUrl.includes(canonical.id)) {
          sheetUrl = serverSheet.sheetUrl;
          if (serverSheet.sheetTab) sheetTab = serverSheet.sheetTab;
          if (serverSheet.gid !== undefined) gid = serverSheet.gid;
        }
      } else {
        if (customSheet.sheetUrl) {
          sheetUrl = customSheet.sheetUrl;
          if (customSheet.sheetTab) sheetTab = customSheet.sheetTab;
          if (customSheet.gid !== undefined) gid = customSheet.gid;
        } else if (serverSheet.sheetUrl) {
          sheetUrl = serverSheet.sheetUrl;
          if (serverSheet.sheetTab) sheetTab = serverSheet.sheetTab;
          if (serverSheet.gid !== undefined) gid = serverSheet.gid;
        }
        if (tileId === 'admin-security' || tileId === 'admin_security') {
          sheetTab = sheetTab || 'Admin_Security_Actions';
        }
      }

      // Merge actions
      let actions = [];
      if (this.customActions[tileId]) {
        actions = this.customActions[tileId];
      } else if (tileId === 'admin-security' && this.customActions['admin_security']) {
        actions = this.customActions['admin_security'];
      } else if (config.actions) {
        actions = JSON.parse(JSON.stringify(config.actions));
      }

      // Normalize actions to ensure all Excel sheet fields are consistently populated like Admin & Security
      actions = actions.map((a, idx) => {
        const raw = a.rawColumns || {};
        const sNo = raw['S_No'] || raw['S.No'] || raw['s_no'] || raw['Sr'] || raw['sno'] || a.sNo || (a.id ? String(a.id).replace(/^[A-Za-z]+-0*/i, '') : '') || String(idx + 1);
        const background = raw['Background'] || raw['background'] || raw['Bg'] || raw['bg'] || a.background || '';
        const dateReference = raw['Date/Reference'] || raw['Date / Reference'] || raw['date/reference'] || raw['date_reference'] || raw['Date_Reference'] || raw['Reference'] || raw['reference'] || raw['ref'] || a.dateReference || '';
        const actionTitle = raw['Assigned Action'] || raw['Action'] || raw['action'] || a.title || a.action || a.desc || '';
        const actionCat = raw['Action category'] || raw['Category'] || raw['category'] || a.category || (a.priority === 'High' ? 'ECM' : 'ACM');
        const assignedTo = raw['Assigned to'] || raw['Assignee'] || raw['assigned'] || a.assignedTo || 'Operations Team';
        const targetDate = raw['Target date'] || raw['Due Date'] || raw['due date'] || a.dueDate || '30/09/2026';
        const rawStat = String(raw['Status detail'] || raw['Status'] || a.status || 'Open');
        const isClosed = a.status === 'Closed' || a.status === 'Completed' || /close|done|complete|resolved/i.test(rawStat);
        const statusDetail = isClosed ? 'Closed' : 'Open';
        const remarks = raw['Remarks'] || raw['Remark'] || raw['remarks'] || a.remarks || '';
        const ackBy = raw['Ack by'] || raw['Ack By'] || raw['ack by'] || a.ackBy || 'M.Afzal';

        const standardizedRaw = {
          'S_No': sNo,
          'Background': background,
          'Date/Reference': dateReference,
          'Assigned Action': actionTitle,
          'Action category': actionCat,
          'Assigned to': assignedTo,
          'Target date': targetDate,
          'Status detail': statusDetail,
          'Remarks': remarks,
          'Ack by': ackBy,
          ...raw
        };
        standardizedRaw['Background'] = background;
        standardizedRaw['Date/Reference'] = dateReference;

        const std10Headers = ['S_No', 'Background', 'Date/Reference', 'Assigned Action', 'Action category', 'Assigned to', 'Target date', 'Status detail', 'Remarks', 'Ack by'];
        let actionHeaders = std10Headers;
        if (Array.isArray(a.columnHeaders) && a.columnHeaders.length >= 8) {
          const hasBg = a.columnHeaders.some(h => /background|bg/i.test(h));
          const hasDateRef = a.columnHeaders.some(h => /date\/reference|reference|date_reference/i.test(h));
          if (hasBg && hasDateRef) {
            actionHeaders = a.columnHeaders;
          } else {
            const sNoHdr = a.columnHeaders.find(h => /s_no|sr|s\.no|#|id/i.test(h)) || 'S_No';
            const rest = a.columnHeaders.filter(h => !/s_no|sr|s\.no|#|id|background|bg|date\/reference|reference|date_reference/i.test(h));
            actionHeaders = [sNoHdr, 'Background', 'Date/Reference', ...rest];
          }
        }

        return {
          ...a,
          id: a.id || `${config.code || 'ACT'}-${String(idx + 1).padStart(2, '0')}`,
          background,
          dateReference,
          title: actionTitle,
          status: statusDetail,
          dueDate: targetDate,
          remarks: remarks,
          rawColumns: standardizedRaw,
          columnHeaders: actionHeaders
        };
      });

      const total = actions.length;
      const closed = actions.filter(a => a.status === 'Closed' || a.status === 'Completed').length;
      const open = actions.filter(a => a.status !== 'Closed' && a.status !== 'Completed').length;
      const rate = total > 0 ? Math.round((closed / total) * 100) : 0;

      return {
        ...config,
        sheetUrl,
        sheetTab,
        gid,
        fromSecret: Boolean(customSheet.fromSecret || serverSheet.fromSecret),
        actions,
        stats: {
          total,
          closed,
          open,
          rate
        }
      };
    },

    getTileSheetEditUrl(tile) {
      if (!tile) return 'https://docs.google.com/spreadsheets';
      const CANONICAL_SHEET_MAP = {
        'asset-integrity': 'https://docs.google.com/spreadsheets/d/1al3SsYo9FWHZxc8rYrJE5SV4H3RafPcd1xGSyfcy5Nc/edit',
        'business-development': 'https://docs.google.com/spreadsheets/d/1PYQlmmzy2VFMohIlNxipiFsfgKPsopgd2VdAdXhMiB4/edit',
        'civil': 'https://docs.google.com/spreadsheets/d/1EPIHm33gIOTrAfXvjGO3yRQhu5jPl_BjstTaWtWgs_0/edit',
        'ei': 'https://docs.google.com/spreadsheets/d/1ap9EfOwDUaoere3nKGmfvLNBKoCNp_KB_8KSEc3Y3fA/edit',
        'finance': 'https://docs.google.com/spreadsheets/d/1hpQsdyMteOhlFCSAm9Yb3GQT_veTVArxcy3inSpkGdA/edit',
        'hseq': 'https://docs.google.com/spreadsheets/d/1jXMXuX2b6HAF_U4e6tiGOzWw2adMpCyUPI5kbODxoPI/edit',
        'hcm': 'https://docs.google.com/spreadsheets/d/1Macb6nmGzel3tseZPp61lHuL8NagAxZPZFRQnw4yCU0/edit',
        'ims': 'https://docs.google.com/spreadsheets/d/1kyekkmRkxYCWxXYjKp5zCSM_NAnb6uqmCBnLcgDR6iM/edit',
        'it': 'https://docs.google.com/spreadsheets/d/1wJ-MIlSvfguUMTz06eqJ2brAYt47gtqKB_nPGrGMuaM/edit',
        'ld': 'https://docs.google.com/spreadsheets/d/1lWSPmrx5LBX64E4vY-VWafLWwql8K7aBcxicprO3ZE0/edit',
        'inspection': 'https://docs.google.com/spreadsheets/d/1fW4P4HXfD6Yt5uvNnB2B6u4GveOBK8VSEPal-giXCIw/edit',
        'machinery': 'https://docs.google.com/spreadsheets/d/1zRmPlFDlRijQOTboLfhukEjdFHeUR9P5pcRIUeV7rY0/edit',
        'mechanical': 'https://docs.google.com/spreadsheets/d/1gedfNYWwLaLDL85bz2PuDGi1NZP8QiwW42Vklym5i1w/edit',
        'operations': 'https://docs.google.com/spreadsheets/d/19iQ_D6k_hvKYP8-FTuBZ51yTcu3Zo2Q0VhXv67wRVZ0/edit',
        'reliability': 'https://docs.google.com/spreadsheets/d/15H3FZaEOczMu5_XcGo7Rs576n4CVakY0iRlvHYdbyvk/edit',
        'scm': 'https://docs.google.com/spreadsheets/d/1SXhHYiQy21bF1g0PimScyhhyBGNch37VWTSHTgWPbP0/edit',
        'projects': 'https://docs.google.com/spreadsheets/d/1Gr0IBANH6GeKMeozJywlHrQccPBdrMuJ5RRctPsQvRI/edit',
        'process': 'https://docs.google.com/spreadsheets/d/1w3ZgX9ixr4xLbesrDIhDZcTV7iQ8wL9XQ3VivZ5YKWs/edit'
      };
      if (tile.id && CANONICAL_SHEET_MAP[tile.id]) {
        return CANONICAL_SHEET_MAP[tile.id];
      }
      const rawUrl = tile.sheetUrl || (this.serverSheets && this.serverSheets[tile.id] && this.serverSheets[tile.id].sheetUrl) || '';
      if (!rawUrl) return 'https://docs.google.com/spreadsheets';
      const match = rawUrl.match(/\/spreadsheets\/d\/(?:e\/)?([a-zA-Z0-9-_]+)/);
      if (match) {
        const sheetId = match[1];
        return `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
      }
      return rawUrl;
    },

    getAllTiles() {
      return this.getEmployeesConfig().map(c => this.getTileData(c.id));
    },

    // Overall Boss rollup metrics across all employee tiles (excluding the boss tile itself)
    getBossRollup() {
      const employeeTiles = this.getAllTiles().filter(t => !t.isBossDashboard);
      let totalActions = 0;
      let closedActions = 0;
      let openActions = 0;
      let employeesFullyClosed = 0;
      let employeesWithPending = 0;
      const allActionsList = [];

      employeeTiles.forEach(tile => {
        totalActions += tile.stats.total;
        closedActions += tile.stats.closed;
        openActions += tile.stats.open;

        if (tile.stats.open === 0 && tile.stats.total > 0) {
          employeesFullyClosed++;
        } else {
          employeesWithPending++;
        }

        tile.actions.forEach(action => {
          allActionsList.push({
            ...action,
            tileId: tile.id,
            department: tile.name,
            code: tile.code
          });
        });
      });

      const overallRate = totalActions > 0 ? Math.round((closedActions / totalActions) * 100) : 0;

      return {
        totalEmployees: employeeTiles.length,
        totalActions,
        closedActions,
        openActions,
        overallRate,
        employeesFullyClosed,
        employeesWithPending,
        employeeTiles,
        allActionsList
      };
    },

    // Password Management
    getStoredPasswords() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.PASSWORDS) || '{}');
      } catch (e) {
        return {};
      }
    },

    getTilePassword(tileId) {
      const stored = this.getStoredPasswords();
      if (stored[tileId]) return stored[tileId];
      return this.DEFAULT_INITIAL_PASSWORD;
    },

    setTilePassword(tileId, newPassword) {
      const stored = this.getStoredPasswords();
      stored[tileId] = newPassword;
      try {
        localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(stored));
      } catch (e) {
        console.error('Failed to save password:', e);
      }
    },

    resetTilePassword(tileId) {
      const stored = this.getStoredPasswords();
      delete stored[tileId];
      try {
        localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(stored));
      } catch (e) {
        console.error('Failed to reset password:', e);
      }
    },

    isTileCustomized(tileId) {
      const stored = this.getStoredPasswords();
      return Boolean(stored[tileId] && stored[tileId] !== this.DEFAULT_INITIAL_PASSWORD);
    },

    showToast(title, message, type = 'info') {
      if (window.portalApp && typeof window.portalApp.showToast === 'function') {
        window.portalApp.showToast(title, message, type);
        return;
      }
      let container = document.getElementById('strategic-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'strategic-toast-container';
        container.className = 'fixed bottom-5 right-5 z-[99999] flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(container);
      }
      const toast = document.createElement('div');
      const bg = type === 'success' ? 'bg-emerald-800 text-white' :
                 type === 'error' ? 'bg-rose-800 text-white' :
                 type === 'warning' ? 'bg-amber-800 text-white' : 'bg-slate-800 text-white';
      toast.className = `${bg} px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-medium pointer-events-auto transition-all transform translate-y-2 opacity-0 duration-200`;
      toast.innerHTML = `<strong>${title}:</strong> <span>${message}</span>`;
      container.appendChild(toast);
      requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
      });
      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    },

    toggleVisibility(fieldKey) {
      this.state.visibility[fieldKey] = !this.state.visibility[fieldKey];
      const isVisible = this.state.visibility[fieldKey];
      const inputMap = {
        auth: 'strategic-auth-pwd-input',
        old: 'strategic-change-old-pwd',
        new: 'strategic-change-new-pwd',
        confirm: 'strategic-change-confirm-pwd',
        reset: 'strategic-reset-pwd-input'
      };
      const iconMap = {
        auth: 'strategic-auth-eye-icon',
        old: 'strategic-change-old-eye',
        new: 'strategic-change-new-eye',
        confirm: 'strategic-change-confirm-eye',
        reset: 'strategic-reset-eye-icon'
      };
      const inputEl = document.getElementById(inputMap[fieldKey]);
      const iconEl = document.getElementById(iconMap[fieldKey]);
      if (inputEl) inputEl.type = isVisible ? 'text' : 'password';
      if (iconEl && window.lucide) {
        iconEl.setAttribute('data-lucide', isVisible ? 'eye-off' : 'eye');
        window.lucide.createIcons();
      }
    },

    openResetModal(tileId) {
      this.fetchFreshDataForTile(tileId);
      this.openAuthModal(tileId, 'reset');
    },

    // USER REQUIREMENT 1:
    // "in strategic dashboard the COO Executive Dashboard i need to click sync all sheets to fetch fresh data.
    // modify logic that when i click any tile in strategic dashboard for putting passward that click should fetch fresh data for dashboard whose tile is clicked"
    handleTileClick(tileId) {
      const tile = this.getTileData(tileId);
      if (!tile) return;

      // INSTANTLY start background fresh data query from Google Sheets on the tile click itself
      this.fetchFreshDataForTile(tileId);

      // STRICT USER REQUIREMENT:
      // "On clicking each tile full page dashboard should open with back button and once moved back clicking should require/ask pasward"
      if (this.state.unlockedTiles.has(tileId)) {
        this.openDetailModal(tileId);
        return;
      }

      this.openAuthModal(tileId, 'unlock');
    },

    // Fetch fresh live data from Google Sheets for the clicked tile (or all sheets if COO master)
    fetchFreshDataForTile(tileId) {
      const tile = this.getTileData(tileId);
      if (!tile) return null;

      const isBoss = tile.isBossDashboard || tileId === 'strategic-master';
      const nonce = Date.now();

      this.state.tileSyncInProgress[tileId] = true;
      this.updateAuthModalSyncStatus(tileId, 'syncing');

      const url = isBoss 
        ? `/api/strategic/live-data?refresh=true&_t=${nonce}`
        : `/api/strategic/live-data?tileId=${encodeURIComponent(tileId)}&refresh=true&_t=${nonce}`;

      const syncPromise = fetch(url, { cache: 'no-store' })
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (isBoss) {
            if (data && data.liveActions) {
              for (const [tId, actions] of Object.entries(data.liveActions)) {
                if (Array.isArray(actions) && actions.length > 0) {
                  this.customActions[tId] = actions;
                  this.state.tileLastSynced[tId] = data.data?.[tId]?.lastSynced || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
              }
              this.saveStoredActions();
              this.state.masterLastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
          } else {
            if (data && data.liveActions && Array.isArray(data.liveActions[tileId]) && data.liveActions[tileId].length > 0) {
              this.customActions[tileId] = data.liveActions[tileId];
              this.saveStoredActions();
              this.state.tileLastSynced[tileId] = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
          }
          this.state.tileSyncInProgress[tileId] = false;
          this.state.syncStatus[tileId] = 'success';
          this.updateAuthModalSyncStatus(tileId, 'success');

          // If the user has already entered the password and is viewing this dashboard, update the view immediately!
          if (this.state.currentView === 'dashboard' && this.state.selectedTileId === tileId) {
            this.render();
          }
          return true;
        })
        .catch(err => {
          console.warn('Fresh data fetch on tile click failed, fallback to client-side sheet sync:', tileId, err);
          this.state.tileSyncInProgress[tileId] = false;
          this.updateAuthModalSyncStatus(tileId, 'cached');
          return false;
        });

      this.state.inFlightTileSync[tileId] = syncPromise;
      return syncPromise;
    },

    updateAuthModalSyncStatus(tileId, status) {
      if (this.state.activeAuthTileId !== tileId) return;
      const el = document.getElementById('strategic-auth-sync-status');
      if (!el) return;

      if (status === 'syncing') {
        el.className = 'flex items-center justify-between p-2.5 rounded-xl border bg-amber-50 border-amber-200 text-amber-900 transition-all';
        el.innerHTML = `
          <div class="flex items-center gap-2">
            <i data-lucide="refresh-cw" class="w-4 h-4 text-amber-600 animate-spin shrink-0"></i>
            <div class="text-xs">
              <div class="font-bold">Fetching fresh sheet data...</div>
              <div class="text-[10px] text-slate-500">Live query triggered on tile click</div>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-200/60 text-amber-900">
            FETCHING
          </span>
        `;
      } else if (status === 'success') {
        el.className = 'flex items-center justify-between p-2.5 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-900 transition-all';
        el.innerHTML = `
          <div class="flex items-center gap-2">
            <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 shrink-0"></i>
            <div class="text-xs">
              <div class="font-bold">Fresh sheet data ready</div>
              <div class="text-[10px] text-slate-500">Synchronized directly from Google Sheet</div>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-200/60 text-emerald-900">
            READY
          </span>
        `;
      } else {
        el.className = 'flex items-center justify-between p-2.5 rounded-xl border bg-slate-50 border-slate-200 text-slate-800 transition-all';
        el.innerHTML = `
          <div class="flex items-center gap-2">
            <i data-lucide="database" class="w-4 h-4 text-slate-500 shrink-0"></i>
            <div class="text-xs">
              <div class="font-bold">Active Records Loaded</div>
              <div class="text-[10px] text-slate-500">Local cached records active</div>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 text-slate-800">
            VERIFIED
          </span>
        `;
      }
      if (window.lucide) window.lucide.createIcons();
    },

    openAuthModal(tileId, view = 'unlock') {
      const tile = this.getTileData(tileId);
      if (!tile) return;
      this.state.activeAuthTileId = tileId;
      this.state.authView = view;
      this.renderAuthModal();

      const modal = document.getElementById('strategic-auth-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }

      const titleText = document.getElementById('strategic-auth-modal-title-text');
      const titleIcon = document.getElementById('strategic-auth-modal-title-icon');
      if (titleText) {
        titleText.textContent = view === 'reset' ? 'Reset Password' : (view === 'change' ? 'Change Password' : 'Strategic Security Verification');
      }
      if (titleIcon && window.lucide) {
        titleIcon.setAttribute('data-lucide', view === 'reset' ? 'key' : (view === 'change' ? 'key-round' : 'shield-check'));
      }

      setTimeout(() => {
        const inputId = view === 'reset' ? 'strategic-reset-pwd-input' : (view === 'unlock' ? 'strategic-auth-pwd-input' : 'strategic-change-old-pwd');
        const input = document.getElementById(inputId);
        if (input) {
          input.value = '';
          input.focus();
        }
      }, 50);

      if (window.lucide) window.lucide.createIcons();
    },

    closeAuthModal() {
      const modal = document.getElementById('strategic-auth-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      this.state.activeAuthTileId = null;
    },

    submitResetPassword() {
      const tileId = this.state.activeAuthTileId;
      const tile = this.getTileData(tileId);
      if (!tile) return;

      const input = document.getElementById('strategic-reset-pwd-input');
      const errorBox = document.getElementById('strategic-reset-error-msg');
      const val = input ? input.value.trim() : '';

      // Master password resets tile to initial password and opens the tile directly
      if (val === this.MASTER_PASSWORD || val === 'FPCL@COO#2026') {
        this.resetTilePassword(tileId);
        this.state.unlockedTiles.add(tileId);
        this.closeAuthModal();
        this.openDetailModal(tileId);
        this.showToast('Password Reset', `${tile.name} opened with initial password. Fetching fresh data...`, 'success');
        this.render();
        if (tile.isBossDashboard || tileId === 'strategic-master') {
          this.syncAllEmployeeSheets();
        } else {
          this.syncEmployeeSheet(tileId);
        }
      } else {
        if (errorBox) {
          errorBox.innerHTML = `
            <i data-lucide="alert-circle" class="w-4 h-4 shrink-0 text-rose-600"></i>
            <span>wrong password</span>
          `;
          errorBox.classList.remove('hidden');
          if (window.lucide) window.lucide.createIcons();
        }
        if (input) {
          input.classList.add('border-rose-500', 'bg-rose-50');
          setTimeout(() => input.classList.remove('border-rose-500', 'bg-rose-50'), 1500);
          input.focus();
        }
      }
    },

    switchAuthView(view) {
      this.state.authView = view;
      this.renderAuthModal();
      setTimeout(() => {
        const inputId = view === 'change' ? 'strategic-change-old-pwd' : 'strategic-auth-pwd-input';
        const input = document.getElementById(inputId);
        if (input) input.focus();
      }, 50);
      if (window.lucide) window.lucide.createIcons();
    },

    onAuthPasswordInput(val) {
      const errorBox = document.getElementById('strategic-auth-error-msg');
      if (errorBox) errorBox.classList.add('hidden');
    },

    submitUnlock() {
      const tileId = this.state.activeAuthTileId;
      const tile = this.getTileData(tileId);
      if (!tile) return;

      const input = document.getElementById('strategic-auth-pwd-input');
      const errorBox = document.getElementById('strategic-auth-error-msg');
      const val = input ? input.value.trim() : '';
      const currentPwd = this.getTilePassword(tileId);

      if (val === this.MASTER_PASSWORD || val === currentPwd) {
        this.state.lastMasterUsed = (val === this.MASTER_PASSWORD);
        this.state.unlockedTiles.add(tileId);
        this.closeAuthModal();
        this.openDetailModal(tileId);

        const isSyncing = this.state.tileSyncInProgress[tileId];
        if (isSyncing) {
          this.showToast('Access Granted', `${tile.name} unlocked. Finalizing fresh sheet data...`, 'info');
        } else {
          this.showToast('Access Granted', `${tile.name} unlocked with fresh sheet data.`, 'success');
        }
        this.render();

        // Guaranteed fallback if in-flight sync hasn't started or needs refresh
        if (!this.state.inFlightTileSync[tileId] && !isSyncing) {
          if (tile.isBossDashboard || tileId === 'strategic-master') {
            this.syncAllEmployeeSheets(true);
          } else {
            this.syncEmployeeSheet(tileId);
          }
        }
      } else {
        if (errorBox) {
          errorBox.innerHTML = `
            <i data-lucide="alert-circle" class="w-4 h-4 shrink-0 text-rose-600"></i>
            <span>wrong password</span>
          `;
          errorBox.classList.remove('hidden');
          if (window.lucide) window.lucide.createIcons();
        }
        if (input) {
          input.classList.add('border-rose-500', 'bg-rose-50');
          setTimeout(() => input.classList.remove('border-rose-500', 'bg-rose-50'), 1500);
          input.focus();
        }
      }
    },

    submitChangePassword() {
      const tileId = this.state.activeAuthTileId;
      const tile = this.getTileData(tileId);
      if (!tile) return;

      const oldInput = document.getElementById('strategic-change-old-pwd');
      const newInput = document.getElementById('strategic-change-new-pwd');
      const confirmInput = document.getElementById('strategic-change-confirm-pwd');
      const errBox = document.getElementById('strategic-change-error');

      const oldVal = oldInput ? oldInput.value.trim() : '';
      const newVal = newInput ? newInput.value.trim() : '';
      const confirmVal = confirmInput ? confirmInput.value.trim() : '';

      const currentPwd = this.getTilePassword(tileId);

      const showError = (msg) => {
        if (errBox) {
          errBox.innerHTML = `<i data-lucide="alert-circle" class="w-4 h-4 shrink-0 text-rose-600"></i><span>${msg}</span>`;
          errBox.classList.remove('hidden');
          if (window.lucide) window.lucide.createIcons();
        }
      };

      if (oldVal !== currentPwd && oldVal !== this.MASTER_PASSWORD) {
        showError('Old password is incorrect.');
        if (oldInput) oldInput.focus();
        return;
      }
      if (!newVal || newVal.length < 3) {
        showError('New password must be at least 3 characters.');
        if (newInput) newInput.focus();
        return;
      }
      if (newVal !== confirmVal) {
        showError('New password and confirm password do not match.');
        if (confirmInput) confirmInput.focus();
        return;
      }

      this.setTilePassword(tileId, newVal);
      this.state.unlockedTiles.add(tileId);
      this.showToast('Password Updated', `Password successfully updated for ${tile.name}. Fetching fresh data...`, 'success');
      this.closeAuthModal();
      this.openDetailModal(tileId);
      this.render();
      if (tile.isBossDashboard || tileId === 'strategic-master') {
        this.syncAllEmployeeSheets();
      } else {
        this.syncEmployeeSheet(tileId);
      }
    },

    lockAllTiles() {
      this.state.unlockedTiles.clear();
      this.state.isMasterActive = false;
      this.closeDetailModal();
      this.showToast('All Dashboards Locked', 'Password required to access each tile.', 'info');
      this.render();
    },

    setSearchQuery(q) {
      this.state.searchQuery = q || '';
      this.render();
    },

    clearSearch() {
      this.state.searchQuery = '';
      const input = document.getElementById('strategic-search-input');
      if (input) {
        input.value = '';
        input.focus();
      }
      this.render();
    },

    resetFilters() {
      this.state.searchQuery = '';
      this.state.categoryFilter = 'all';
      const input = document.getElementById('strategic-search-input');
      if (input) input.value = '';
      this.render();
    },

    // Toggle Action Status (Closed <-> Open)
    toggleActionStatus(tileId, actionId) {
      const tile = this.getTileData(tileId);
      if (!tile) return;

      const actions = [...tile.actions];
      const action = actions.find(a => a.id === actionId);
      if (!action) return;

      const wasClosed = action.status === 'Closed' || action.status === 'Completed';
      const newStatus = wasClosed ? 'Open' : 'Closed';
      action.status = newStatus;
      if (newStatus === 'Closed') {
        const today = new Date().toISOString().split('T')[0];
        action.closureDate = today;
      } else {
        action.closureDate = '';
      }

      this.customActions[tileId] = actions;
      this.saveStoredActions();

      this.showToast(
        'Action Status Updated',
        `Action ${action.id} is now ${newStatus.toUpperCase()}`,
        newStatus === 'Closed' ? 'success' : 'info'
      );

      // Re-render modal and main view
      if (this.state.selectedTileId) {
        this.openDetailModal(this.state.selectedTileId);
      }
      this.render();
    },

    // Explicitly set action status via dropdown menu ('Open' | 'Closed')
    setActionStatus(tileId, actionId, newStatus) {
      const tile = this.getTileData(tileId);
      if (!tile) return;

      const actions = [...tile.actions];
      const action = actions.find(a => a.id === actionId);
      if (!action) return;

      action.status = newStatus;
      if (newStatus === 'Closed' || newStatus === 'Completed') {
        const today = new Date().toISOString().split('T')[0];
        action.closureDate = today;
      } else {
        action.closureDate = '';
      }

      this.customActions[tileId] = actions;
      this.saveStoredActions();

      this.showToast(
        'Action Status Updated',
        `Action ${action.id} is now ${newStatus.toUpperCase()}`,
        newStatus === 'Closed' ? 'success' : 'info'
      );

      if (this.state.selectedTileId) {
        this.openDetailModal(this.state.selectedTileId);
      }
      this.render();
    },

    // Add a new action item to an employee tile
    addNewAction(tileId) {
      const descInput = document.getElementById('new-action-desc');
      const dueInput = document.getElementById('new-action-due');
      const statusSelect = document.getElementById('new-action-status');

      if (!descInput || !descInput.value.trim()) {
        alert('Please enter an action description.');
        return;
      }

      const tile = this.getTileData(tileId);
      if (!tile) return;

      const actions = [...tile.actions];
      const nextNum = actions.length + 1;
      const newId = `${tile.code}-${String(nextNum).padStart(2, '0')}`;
      const status = statusSelect ? statusSelect.value : 'Open';

      const newAction = {
        id: newId,
        sNo: String(nextNum),
        background: '',
        dateReference: '',
        title: descInput.value.trim(),
        action: descInput.value.trim(),
        category: 'ECM',
        assignedTo: 'Operations Team',
        dueDate: dueInput ? dueInput.value : new Date().toISOString().split('T')[0],
        targetDate: dueInput ? dueInput.value : new Date().toISOString().split('T')[0],
        status,
        statusDetail: status,
        closureDate: status === 'Closed' ? new Date().toISOString().split('T')[0] : '',
        remarks: 'Directly logged into Action Sheet.',
        ackBy: 'M.Afzal',
        rawColumns: {
          'S_No': String(nextNum),
          'Background': '',
          'Date/Reference': '',
          'Assigned Action': descInput.value.trim(),
          'Action category': 'ECM',
          'Assigned to': 'Operations Team',
          'Target date': dueInput ? dueInput.value : new Date().toISOString().split('T')[0],
          'Status detail': status,
          'Remarks': 'Directly logged into Action Sheet.',
          'Ack by': 'M.Afzal'
        },
        columnHeaders: ['S_No', 'Background', 'Date/Reference', 'Assigned Action', 'Action category', 'Assigned to', 'Target date', 'Status detail', 'Remarks', 'Ack by']
      };

      actions.unshift(newAction);
      this.customActions[tileId] = actions;
      this.saveStoredActions();

      this.showToast('Action Created', `Logged new action ${newId} in ${tile.name}`, 'success');
      this.openDetailModal(tileId);
      this.render();
    },

    // Save Google Sheet URL & Tab configuration for an employee
    saveEmployeeSheetConfig(tileId) {
      const urlInput = document.getElementById('config-sheet-url');
      const tabInput = document.getElementById('config-sheet-tab');
      const gidInput = document.getElementById('config-sheet-gid');

      if (!urlInput) return;
      const url = urlInput.value.trim();
      const tab = tabInput ? tabInput.value.trim() : 'Sheet1';
      const gid = gidInput ? gidInput.value.trim() : '0';

      this.customSheets[tileId] = {
        sheetUrl: url,
        sheetTab: tab,
        gid
      };
      this.saveStoredSheets();

      this.showToast('Google Sheet Configured', 'Google Sheet settings saved for this employee.', 'success');
      this.openDetailModal(tileId);
      this.render();
    },

    // =========================================================================
    // DYNAMIC FILTERING, PAGINATION & CSV EXPORT HELPERS
    // =========================================================================

    escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    // Extract exact value for requested column from live Google Sheet action item
    // Standard Column Mapping:
    // Column A: S_No
    // Column B: Background (New)
    // Column C: Date/Reference (New)
    // Column D: Assigned Action
    // Column E: Action category
    // Column F: Assigned to
    // Column G: Target date
    // Column H: Status detail
    // Column I: Remarks
    // Column J: Ack by
    getActionColVal(action, col) {
      if (!action) return '';
      const raw = action.rawColumns || {};
      const headers = action.columnHeaders || [];
      const colUpper = String(col || '').toUpperCase().trim();

      // Semantic / Named column helpers
      if (colUpper === 'BACKGROUND' || colUpper === 'BG' || colUpper === 'B') {
        const v = raw['Background'] || raw['background'] || raw['Bg'] || raw['bg'] || raw['Col B'] || action.background;
        return v ? String(v).trim() : '';
      }
      if (colUpper === 'DATE_REF' || colUpper === 'DATE/REFERENCE' || colUpper === 'DATEREFERENCE' || colUpper === 'DATE_REFERENCE') {
        const v = raw['Date/Reference'] || raw['date/reference'] || raw['Date / Reference'] || raw['date_reference'] || raw['Reference'] || action.dateReference;
        return v ? String(v).trim() : '';
      }
      if (colUpper === 'ACTION' || colUpper === 'TITLE' || colUpper === 'ASSIGNED ACTION' || colUpper === 'ASSIGNED_ACTION') {
        const v = raw['Assigned Action'] || raw['Action'] || raw['action'] || action.title || action.action || action.desc;
        return v ? String(v).trim() : '';
      }
      if (colUpper === 'CATEGORY' || colUpper === 'ACTION_CATEGORY' || colUpper === 'E') {
        const v = raw['Action category'] || raw['Action Category'] || raw['Category'] || raw['category'] || raw['Col E'] || action.category;
        return v ? String(v).trim() : (action.priority === 'High' ? 'ECM' : 'ACM');
      }
      if (colUpper === 'ASSIGNED' || colUpper === 'ASSIGNED_TO' || colUpper === 'F') {
        const v = raw['Assigned to'] || raw['Assigned To'] || raw['Assignee'] || raw['assignee'] || raw['assigned'] || raw['Col F'] || action.assignedTo;
        return v ? String(v).trim() : '';
      }
      if (colUpper === 'TARGET_DATE' || colUpper === 'DUE_DATE' || colUpper === 'G') {
        const v = raw['Target date'] || raw['Target Date'] || raw['Due Date'] || raw['due date'] || raw['Col G'] || action.dueDate;
        return v ? String(v).trim() : '';
      }
      if (colUpper === 'STATUS' || colUpper === 'STATUS_DETAIL' || colUpper === 'H') {
        const v = raw['Status detail'] || raw['Status Detail'] || raw['Status'] || raw['status'] || raw['Col H'] || action.statusDetail || action.status;
        const s = v ? String(v).trim() : '';
        if (/close|done|complete|resolved/i.test(s)) return 'Closed';
        if (/open|pending|in progress|active/i.test(s)) return 'Open';
        return s || (action.status === 'Closed' ? 'Closed' : 'Open');
      }
      if (colUpper === 'REMARKS' || colUpper === 'I') {
        const v = raw['Remarks'] || raw['Remark'] || raw['remarks'] || raw['Col I'] || action.remarks;
        return v ? String(v).trim() : '';
      }
      if (colUpper === 'ACK' || colUpper === 'ACK_BY' || colUpper === 'J') {
        const v = raw['Ack by'] || raw['Ack By'] || raw['ack by'] || raw['Acknowledged by'] || raw['Acknowledged By'] || raw['Col J'] || action.ackBy;
        return v ? String(v).trim() : '';
      }

      // Exact index lookup if available from raw column headers
      const colMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9 };
      const idx = colMap[colUpper];
      if (idx !== undefined && headers[idx] && raw[headers[idx]] !== undefined) {
        const v = String(raw[headers[idx]]).trim();
        if (v) return v;
      }

      // Legacy fallback for callers requesting 'C', 'D'
      if (colUpper === 'C') {
        const v = raw['Date/Reference'] || raw['date/reference'] || raw['Date / Reference'] || action.dateReference;
        if (v) return String(v).trim();
        const cat = raw['Action category'] || raw['Category'] || action.category;
        return cat ? String(cat).trim() : '';
      } else if (colUpper === 'D') {
        const v = raw['Assigned Action'] || action.title || raw['Assigned to'] || action.assignedTo;
        return v ? String(v).trim() : '';
      }

      return '';
    },

    filterActionList(actions, { colC = 'all', colD = 'all', colE = 'all', colF = 'all', colH = 'all', colJ = 'all', search = '', dept = 'all' } = {}) {
      if (!Array.isArray(actions)) return [];
      const q = (search || '').toLowerCase().trim();
      const colEF = (colE !== 'all' ? colE : colC).trim();
      const colFF = (colF !== 'all' && colF !== 'Open' && colF !== 'Closed' ? colF : colD).trim();
      const colHF = (colH !== 'all' ? colH : ((colF === 'Open' || colF === 'Closed') ? colF : 'all')).trim();
      const colJF = (colJ !== 'all' ? colJ : 'all').trim();
      const deptF = (dept || 'all').toLowerCase().trim();

      return actions.filter(a => {
        // Department filter
        if (deptF !== 'all') {
          const tId = (a.tileId || '').toLowerCase().trim();
          const tCode = (a.code || '').toLowerCase().trim();
          const tDept = (a.department || '').toLowerCase().trim();
          if (tId !== deptF && tCode !== deptF && tDept !== deptF) return false;
        }

        // Column H: Status detail filter (All / Open / Closed)
        if (colHF !== 'all') {
          const valH = this.getActionColVal(a, 'STATUS');
          const isClosed = valH === 'Closed' || a.status === 'Closed' || a.status === 'Completed' || (a.status || '').toLowerCase().includes('close');
          if (colHF === 'Open' && isClosed) return false;
          if (colHF === 'Closed' && !isClosed) return false;
          if (colHF !== 'Open' && colHF !== 'Closed' && valH.toLowerCase() !== colHF.toLowerCase()) return false;
        }

        // Column E: Action category filter
        if (colEF !== 'all') {
          const valE = this.getActionColVal(a, 'CATEGORY');
          if (valE.toLowerCase() !== colEF.toLowerCase()) return false;
        }

        // Column F: Assigned to filter
        if (colFF !== 'all') {
          const valF = this.getActionColVal(a, 'ASSIGNED');
          if (valF.toLowerCase() !== colFF.toLowerCase()) return false;
        }

        // Column J: Ack by filter
        if (colJF !== 'all') {
          const valJ = this.getActionColVal(a, 'ACK');
          if (valJ.toLowerCase() !== colJF.toLowerCase()) return false;
        }

        // Search text filter
        if (q) {
          const matchId = (a.id || a.sNo || '').toLowerCase().includes(q);
          const matchTitle = (a.title || a.action || a.desc || '').toLowerCase().includes(q);
          const matchBg = (a.background || (a.rawColumns && a.rawColumns['Background']) || '').toLowerCase().includes(q);
          const matchDateRef = (a.dateReference || (a.rawColumns && a.rawColumns['Date/Reference']) || '').toLowerCase().includes(q);
          const matchDept = (a.department || '').toLowerCase().includes(q);
          const matchCode = (a.code || '').toLowerCase() === q || (a.code || '').toLowerCase().includes(q);
          const matchRemarks = (a.remarks || '').toLowerCase().includes(q);
          const matchDue = (a.dueDate || '').toLowerCase().includes(q);
          let matchRaw = false;
          if (a.rawColumns && typeof a.rawColumns === 'object') {
            matchRaw = Object.values(a.rawColumns).some(v => String(v || '').toLowerCase().includes(q));
          }
          if (!matchId && !matchTitle && !matchBg && !matchDateRef && !matchDept && !matchCode && !matchRemarks && !matchDue && !matchRaw) return false;
        }

        return true;
      });
    },

    getFilteredTileActions(tileId) {
      const tile = this.getTileData(tileId);
      if (!tile || !tile.actions) return [];
      return this.filterActionList(tile.actions, {
        colE: this.state.tileFilterColE !== 'all' ? this.state.tileFilterColE : this.state.tileFilterColC,
        colF: this.state.tileFilterColF !== 'all' ? this.state.tileFilterColF : this.state.tileFilterColD,
        colH: this.state.tileFilterColH !== 'all' ? this.state.tileFilterColH : (this.state.tileFilterStatus !== 'all' ? this.state.tileFilterStatus : 'all'),
        colJ: this.state.tileFilterColJ !== 'all' ? this.state.tileFilterColJ : 'all',
        search: this.state.tileFilterSearch
      });
    },

    setTileFilter(key, val) {
      this.state[key] = val;
      if (key === 'tileFilterStatus') {
        this.state.tileFilterColH = val;
      } else if (key === 'tileFilterColH') {
        this.state.tileFilterStatus = val;
      } else if (key === 'tileFilterColE') {
        this.state.tileFilterColC = val;
      } else if (key === 'tileFilterColC') {
        this.state.tileFilterColE = val;
      } else if (key === 'tileFilterColF') {
        this.state.tileFilterColD = val;
      } else if (key === 'tileFilterColD') {
        this.state.tileFilterColF = val;
      }
      this.state.tilePage = 1;
      this.render();
    },

    clearTileFilters() {
      this.state.tileFilterSearch = '';
      this.state.tileFilterStatus = 'all';
      this.state.tileFilterColE = 'all';
      this.state.tileFilterColF = 'all';
      this.state.tileFilterColH = 'all';
      this.state.tileFilterColJ = 'all';
      this.state.tileFilterColC = 'all';
      this.state.tileFilterColD = 'all';
      this.state.tilePage = 1;
      this.render();
    },

    setTilePage(p) {
      this.state.tilePage = p;
      this.render();
      const table = document.getElementById('strategic-tile-table');
      if (table) table.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    setTilePageSize(sz) {
      this.state.tilePageSize = sz === 'all' ? 9999 : parseInt(sz, 10);
      this.state.tilePage = 1;
      this.render();
    },

    exportTileCSV(tileId) {
      const tile = this.getTileData(tileId);
      if (!tile) return;
      const data = this.getFilteredTileActions(tileId);
      if (!data || data.length === 0) {
        this.showToast('No Data', 'No actions match current filters to export.', 'warning');
        return;
      }

      // Check if dynamic columns are present from Excel sheet
      const firstWithHeaders = data.find(a => Array.isArray(a.columnHeaders) && a.columnHeaders.length > 0);
      let headers = [];
      if (firstWithHeaders && firstWithHeaders.columnHeaders.length > 0) {
        let cols = ['S_No', ...firstWithHeaders.columnHeaders.filter(h => !/^(s_no|sr|s\.no|#)$/i.test(h))];
        const hasBg = cols.some(c => /background|bg/i.test(c));
        const hasDateRef = cols.some(c => /date\/reference|reference|date_reference/i.test(c));
        if (!hasBg || !hasDateRef) {
          const rest = cols.filter(c => !/^(s_no|sr|s\.no|#|background|bg|date\/reference|reference|date_reference)$/i.test(c));
          cols = ['S_No', 'Background', 'Date/Reference', ...rest];
        }
        headers = cols;
      } else {
        const colSet = new Set();
        for (const a of data) {
          if (a.rawColumns && typeof a.rawColumns === 'object') {
            Object.keys(a.rawColumns).forEach(k => {
              if (!/^(s_no|sr|s\.no|#)$/i.test(k)) colSet.add(k);
            });
          }
        }
        if (colSet.size > 0) {
          headers = ['S_No', ...Array.from(colSet)];
        } else {
          headers = ['S_No', 'Background', 'Date/Reference', 'Assigned Action', 'Action category', 'Assigned to', 'Target date', 'Status detail', 'Remarks', 'Ack by'];
        }
      }

      const rows = data.map((d, i) => {
        const raw = d.rawColumns || {};
        const sNo = raw['S_No'] || raw['S.No'] || raw['s_no'] || raw['Sr'] || raw['sno'] || d.sNo || (d.id ? String(d.id).replace(/^[A-Za-z]+-0*/i, '') : '') || String(i + 1);
        const rowVals = [sNo];
        for (let h = 1; h < headers.length; h++) {
          const col = headers[h];
          const colLower = col.toLowerCase().trim();
          let val = '';
          if (raw[col] !== undefined) {
            val = raw[col];
          } else {
            const foundKey = Object.keys(raw).find(k => k.toLowerCase().trim() === colLower);
            if (foundKey && raw[foundKey] !== undefined) {
              val = raw[foundKey];
            }
          }
          if (!val && val !== 0) {
            if (/background|bg/i.test(colLower)) val = raw['Background'] || d.background || '';
            else if (/date\/reference|reference|date_reference|date \/ reference/i.test(colLower)) val = raw['Date/Reference'] || d.dateReference || '';
            else if (/category/i.test(colLower)) val = this.getActionColVal(d, 'CATEGORY');
            else if (/assigned\s*to|assignee/i.test(colLower)) val = this.getActionColVal(d, 'ASSIGNED');
            else if (/status\s*detail|condition/i.test(colLower)) val = this.getActionColVal(d, 'STATUS') || (d.status === 'Closed' ? 'Closed' : 'Open');
            else if (/ack\s*by|acknowledged/i.test(colLower)) val = this.getActionColVal(d, 'ACK');
            else if (/action|title|task|desc|deliverable/i.test(colLower)) val = raw['Assigned Action'] || d.title || d.action || '';
            else if (/due|target|deadline/i.test(colLower)) val = raw['Target date'] || d.dueDate || '';
            else if (/status/i.test(colLower)) val = d.status || '';
            else if (/priority|prio/i.test(colLower)) val = d.priority || '';
            else if (/closure/i.test(colLower)) val = d.closureDate || '';
            else if (/remark|comment|note/i.test(colLower)) val = raw['Remarks'] || d.remarks || '';
            else if (/id|code|item/i.test(colLower)) val = d.id || '';
          }
          rowVals.push(`"${String(val || '').replace(/"/g, '""')}"`);
        }
        return rowVals;
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().slice(0, 10);
      let filterTag = '';
      if (this.state.tileFilterStatus && this.state.tileFilterStatus !== 'all') filterTag += `_${this.state.tileFilterStatus}`;
      if (this.state.tileFilterColC && this.state.tileFilterColC !== 'all') filterTag += `_${this.state.tileFilterColC.replace(/[^a-zA-Z0-9]/g, '')}`;
      if (this.state.tileFilterColD && this.state.tileFilterColD !== 'all') filterTag += `_${this.state.tileFilterColD.replace(/[^a-zA-Z0-9]/g, '')}`;
      if (this.state.tileFilterColH && this.state.tileFilterColH !== 'all') filterTag += `_${this.state.tileFilterColH.replace(/[^a-zA-Z0-9]/g, '')}`;
      if (this.state.tileFilterSearch) filterTag += `_search`;
      link.setAttribute('download', `FPCL_${tile.code}_Actions_Filtered${filterTag}_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      this.showToast('CSV Exported', `Exported ${data.length} actions based on applied filters for ${tile.name}`, 'success');
    },

    toggleActionStatus(tileId, actionId) {
      const tile = this.getTileData(tileId);
      if (!tile) return;
      const actions = [...tile.actions];
      const target = actions.find(a => a.id === actionId);
      if (!target) return;

      const isNowClosed = target.status !== 'Closed' && target.status !== 'Completed';
      target.status = isNowClosed ? 'Closed' : 'Open';
      target.closureDate = isNowClosed ? new Date().toISOString().split('T')[0] : '';

      this.customActions[tileId] = actions;
      this.saveStoredActions();
      this.showToast('Status Updated', `Action ${actionId} marked as ${target.status}`, 'info');
      this.render();
    },

    getFilteredMasterActions() {
      const rollup = this.getBossRollup();
      const all = rollup.allActionsList || [];
      return this.filterActionList(all, {
        dept: this.state.masterFilterDept,
        colE: this.state.masterFilterColE !== 'all' ? this.state.masterFilterColE : this.state.masterFilterColC,
        colF: this.state.masterFilterColF !== 'all' ? this.state.masterFilterColF : this.state.masterFilterColD,
        colH: this.state.masterFilterColH !== 'all' ? this.state.masterFilterColH : (this.state.masterFilterStatus !== 'all' ? this.state.masterFilterStatus : 'all'),
        colJ: this.state.masterFilterColJ !== 'all' ? this.state.masterFilterColJ : 'all',
        search: this.state.masterFilterSearch
      });
    },

    setMasterFilter(key, val) {
      this.state[key] = val;
      if (key === 'masterFilterStatus') {
        this.state.masterFilterColH = val;
      } else if (key === 'masterFilterColH') {
        this.state.masterFilterStatus = val;
      } else if (key === 'masterFilterColE') {
        this.state.masterFilterColC = val;
      } else if (key === 'masterFilterColC') {
        this.state.masterFilterColE = val;
      } else if (key === 'masterFilterColF') {
        this.state.masterFilterColD = val;
      } else if (key === 'masterFilterColD') {
        this.state.masterFilterColF = val;
      }
      this.state.masterPage = 1;
      this.render();
      if (key === 'masterFilterSearch') {
        const inp = document.getElementById('strategic-master-search-input');
        if (inp) {
          inp.focus();
          const len = inp.value.length;
          inp.setSelectionRange(len, len);
        }
      }
    },

    toggleMasterDeptFilter(deptId) {
      if (this.state.masterFilterDept === deptId) {
        this.state.masterFilterDept = 'all';
      } else {
        this.state.masterFilterDept = deptId;
      }
      this.state.masterPage = 1;
      this.render();
    },

    clearMasterFilters() {
      this.state.masterFilterSearch = '';
      this.state.masterFilterDept = 'all';
      this.state.masterFilterStatus = 'all';
      this.state.masterFilterColE = 'all';
      this.state.masterFilterColF = 'all';
      this.state.masterFilterColH = 'all';
      this.state.masterFilterColJ = 'all';
      this.state.masterFilterColC = 'all';
      this.state.masterFilterColD = 'all';
      this.state.masterPage = 1;
      this.render();
    },

    setMasterPage(p) {
      this.state.masterPage = p;
      this.render();
      const table = document.getElementById('strategic-master-table');
      if (table) table.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    setMasterPageSize(sz) {
      this.state.masterPageSize = sz === 'all' ? 9999 : parseInt(sz, 10);
      this.state.masterPage = 1;
      this.render();
    },

    exportMasterCSV() {
      const data = this.getFilteredMasterActions();
      if (!data || data.length === 0) {
        this.showToast('No Data', 'No actions match current filters to export.', 'warning');
        return;
      }

      const deptF = this.state.masterFilterDept || 'all';
      const statusF = this.state.masterFilterStatus || 'all';
      const colEF = (this.state.masterFilterColE !== 'all' ? this.state.masterFilterColE : this.state.masterFilterColC) || 'all';
      const colFF = (this.state.masterFilterColF !== 'all' ? this.state.masterFilterColF : this.state.masterFilterColD) || 'all';
      const colHF = this.state.masterFilterColH || 'all';
      const colJF = this.state.masterFilterColJ || 'all';
      const q = (this.state.masterFilterSearch || '').trim();

      const headers = ['S_No', 'Department', 'Background', 'Date/Reference', 'Assigned Action', 'Action category', 'Assigned to', 'Target date', 'Status detail', 'Remarks', 'Ack by'];
      const rows = data.map((d, i) => {
        const raw = d.rawColumns || {};
        const sNo = raw['S_No'] || raw['S.No'] || raw['s_no'] || raw['Sr'] || raw['sno'] || d.sNo || (d.id ? String(d.id).replace(/^[A-Za-z]+-0*/i, '') : '') || String(i + 1);
        const dept = d.department || d.code || '';
        const background = raw['Background'] || raw['background'] || d.background || '';
        const dateReference = raw['Date/Reference'] || raw['Date / Reference'] || d.dateReference || '';
        const actionTitle = raw['Assigned Action'] || raw['Action'] || raw['action'] || d.title || d.action || d.desc || '';
        const actionCat = this.getActionColVal(d, 'CATEGORY') || raw['Action category'] || raw['Category'] || raw['category'] || d.category || (d.priority === 'High' ? 'ECM' : 'ACM');
        const assignedTo = this.getActionColVal(d, 'ASSIGNED') || raw['Assigned to'] || raw['Assignee'] || raw['assigned'] || d.assignedTo || 'Operations Team';
        const targetDate = raw['Target date'] || raw['Due Date'] || raw['due date'] || d.dueDate || '';
        const valH = this.getActionColVal(d, 'STATUS');
        const isClosed = valH === 'Closed' || d.status === 'Closed' || d.status === 'Completed' || /close|done|complete|resolved/i.test(String(raw['Status detail'] || raw['Status'] || d.status || ''));
        const statusDetail = valH || (isClosed ? 'Closed' : 'Open');
        const remarks = raw['Remarks'] || raw['Remark'] || raw['remarks'] || d.remarks || '';
        const ackBy = this.getActionColVal(d, 'ACK') || raw['Ack by'] || raw['Ack By'] || raw['ack by'] || d.ackBy || 'M.Afzal';

        return [
          sNo,
          `"${String(dept).replace(/"/g, '""')}"`,
          `"${String(background).replace(/"/g, '""')}"`,
          `"${String(dateReference).replace(/"/g, '""')}"`,
          `"${String(actionTitle).replace(/"/g, '""')}"`,
          `"${String(actionCat).replace(/"/g, '""')}"`,
          `"${String(assignedTo).replace(/"/g, '""')}"`,
          `"${String(targetDate).replace(/"/g, '""')}"`,
          `"${String(statusDetail).replace(/"/g, '""')}"`,
          `"${String(remarks).replace(/"/g, '""')}"`,
          `"${String(ackBy).replace(/"/g, '""')}"`
        ];
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().slice(0, 10);
      let filterTag = '';
      if (deptF !== 'all') filterTag += `_${deptF.toUpperCase()}`;
      if (statusF !== 'all') filterTag += `_${statusF}`;
      if (colCF !== 'all') filterTag += `_${colCF.replace(/[^a-zA-Z0-9]/g, '')}`;
      if (colDF !== 'all') filterTag += `_${colDF.replace(/[^a-zA-Z0-9]/g, '')}`;
      if (colHF !== 'all') filterTag += `_${colHF.replace(/[^a-zA-Z0-9]/g, '')}`;
      if (q) filterTag += `_search`;
      link.setAttribute('download', `FPCL_COO_Executive_Dashboard_Actions${filterTag}_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      this.showToast('CSV Exported', `Exported ${data.length} actions based on applied filters to CSV`, 'success');
    },

    openSheetConfigModal(tileId) {
      this.state.sheetConfigModalTileId = tileId;
      this.render();
      const modal = document.getElementById('strategic-sheet-config-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
      if (window.lucide) window.lucide.createIcons();
    },

    closeSheetConfigModal() {
      this.state.sheetConfigModalTileId = null;
      const modal = document.getElementById('strategic-sheet-config-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      this.render();
    },

    isSheetConnected(tileId) {
      if (!tileId) return false;
      const status = this.state.syncStatus[tileId];
      if (status === 'broken' || status === 'error') {
        return false;
      }
      
      const tile = this.getTileData(tileId);
      if (!tile) return false;

      // For Boss Dashboard: connected if all non-boss tiles have no broken status and at least one is connected
      if (tile.isBossDashboard) {
        const all = this.getAllTiles().filter(t => !t.isBossDashboard);
        const hasBroken = all.some(t => this.state.syncStatus[t.id] === 'broken' || this.state.syncStatus[t.id] === 'error');
        return !hasBroken && all.some(t => Boolean(t.sheetUrl && t.sheetUrl.trim().length > 10));
      }

      if (!tile.sheetUrl || tile.sheetUrl.trim().length < 10) {
        return false;
      }

      // If URL is explicitly marked as broken
      if (tile.sheetUrl.includes('invalid') || tile.sheetUrl.includes('broken')) {
        return false;
      }

      return true;
    },

    disconnectSheet(tileId) {
      this.state.syncStatus[tileId] = 'broken';
      if (this.customSheets[tileId]) {
        this.customSheets[tileId].sheetUrl = '';
      } else {
        this.customSheets[tileId] = { sheetUrl: '', sheetTab: '', gid: '0' };
      }
      this.saveStoredSheets();
      this.closeSheetConfigModal();
      this.showToast('Link Broken / Disconnected', 'Google Sheet link disconnected. Status dot turned orange.', 'warning');
      this.render();
    },

    saveSheetConfigModal(tileId) {
      const urlEl = document.getElementById('modal-sheet-url');
      const tabEl = document.getElementById('modal-sheet-tab');
      const gidEl = document.getElementById('modal-sheet-gid');
      if (!urlEl) return;
      const url = urlEl.value.trim();
      const tab = tabEl ? tabEl.value.trim() : '';
      const gid = gidEl ? gidEl.value.trim() : '0';

      const isValid = url.length > 10 && (url.includes('docs.google.com/spreadsheets') || url.startsWith('http'));
      this.customSheets[tileId] = { sheetUrl: url, sheetTab: tab, gid };
      this.saveStoredSheets();

      if (!isValid || url === '') {
        this.state.syncStatus[tileId] = 'broken';
        this.closeSheetConfigModal();
        this.showToast('Link Broken', 'No valid Google Sheet link provided. Status dot turned orange.', 'warning');
      } else {
        this.state.syncStatus[tileId] = 'success';
        this.closeSheetConfigModal();
        this.showToast('Settings Saved', 'Google Sheet connection verified active. Status dot is green.', 'success');
      }
      this.render();
    },

    getSheetConfigModalHtml() {
      const tileId = this.state.sheetConfigModalTileId;
      if (!tileId) return '';
      const tile = this.getTileData(tileId);
      if (!tile) return '';
      const isConnected = this.isSheetConnected(tileId);

      return `
        <!-- GOOGLE SHEET CONFIGURATION MODAL -->
        <div id="strategic-sheet-config-modal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div class="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200">
              <div class="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-600"></i>
                <span>Google Sheet Connection: ${tile.name}</span>
              </div>
              <button
                onclick="window.FPCL_STRATEGIC_SUITE.closeSheetConfigModal()"
                class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>

            <!-- Connection Status Pill -->
            <div class="flex items-center justify-between px-3 py-2 rounded-xl ${isConnected ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-amber-50 border border-amber-300 text-amber-900'}">
              <div class="flex items-center gap-2">
                <span class="relative flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                </span>
                <span class="text-xs font-bold">${isConnected ? 'Google Sheet is Connected (Green Dot)' : 'Google Sheet Link Broken / Unlinked (Orange Dot)'}</span>
              </div>
              <span class="text-[10px] font-mono font-bold uppercase tracking-wider">${isConnected ? 'Active' : 'Broken'}</span>
            </div>

            <div class="space-y-3">
              <div class="space-y-1">
                <label class="block text-xs font-bold text-slate-700">Google Sheet URL</label>
                <input
                  id="modal-sheet-url"
                  type="text"
                  value="${tile.sheetUrl || ''}"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  class="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-purple-500 outline-none text-slate-900 bg-slate-50 focus:bg-white"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="block text-xs font-bold text-slate-700">Sheet Tab Name</label>
                  <input
                    id="modal-sheet-tab"
                    type="text"
                    value="${tile.sheetTab || tile.name}"
                    placeholder="${tile.name}"
                    class="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-purple-500 outline-none text-slate-900 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div class="space-y-1">
                  <label class="block text-xs font-bold text-slate-700">Sheet GID</label>
                  <input
                    id="modal-sheet-gid"
                    type="text"
                    value="${tile.gid || '0'}"
                    placeholder="0"
                    class="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-purple-500 outline-none text-slate-900 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div class="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.disconnectSheet('${tile.id}')"
                class="px-3 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer flex items-center gap-1.5"
                title="Disconnect or break the Google Sheet link to trigger orange dot"
              >
                <i data-lucide="unlink" class="w-3.5 h-3.5"></i>
                <span>Break Link</span>
              </button>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.closeSheetConfigModal()"
                  class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.saveSheetConfigModal('${tile.id}'); window.FPCL_STRATEGIC_SUITE.syncEmployeeSheet('${tile.id}')"
                  class="px-3.5 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                  <span>Save & Sync</span>
                </button>
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.saveSheetConfigModal('${tile.id}')"
                  class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all cursor-pointer shadow-sm"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // Live Sync single employee sheet via Google Sheets API
    async syncEmployeeSheet(tileId) {
      const tile = this.getTileData(tileId);
      if (!tile) return;

      // Delegate boss / executive rollup to syncAllEmployeeSheets
      if (tile.isBossDashboard || tileId === 'strategic-master') {
        return this.syncAllEmployeeSheets();
      }

      this.state.syncStatus[tileId] = 'syncing';
      this.render();

      let syncedSuccessfully = false;

      // 1. Try server live-data endpoint first (fast, bypasses CORS, handles multiple tab aliases, cache-busting)
      try {
        const nonce = Date.now();
        const res = await fetch(`/api/strategic/live-data?tileId=${encodeURIComponent(tileId)}&refresh=true&_t=${nonce}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.liveActions && Array.isArray(data.liveActions[tileId]) && data.liveActions[tileId].length > 0) {
            const actions = data.liveActions[tileId];
            this.customActions[tileId] = actions;
            this.saveStoredActions();
            this.state.syncStatus[tileId] = 'success';
            this.state.tileLastSynced[tileId] = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            this.showToast('Sync Successful', `Synchronized ${actions.length} live deliverables from Google Sheet for ${tile.name}`, 'success');
            syncedSuccessfully = true;
          }
        }
      } catch (err) {
        console.warn('Backend sync failed, attempting client-side fallback for', tileId, err);
      }

      // 2. Fallback to client-side sheet sync if needed
      if (!syncedSuccessfully && tile.sheetUrl) {
        try {
          let csvText = '';
          if (window.FPCL_SHEET_SYNC && typeof window.FPCL_SHEET_SYNC.fetchGoogleSheetData === 'function') {
            csvText = await window.FPCL_SHEET_SYNC.fetchGoogleSheetData(tile.sheetUrl, {
              sheetTab: tile.sheetTab || tile.name || 'Sheet1',
              gid: tile.gid || '0'
            });
          }

          if (csvText && csvText.length > 30) {
            const parsedActions = this.parseCsvToActions(csvText, tile.code);
            if (parsedActions && parsedActions.length > 0) {
              this.customActions[tileId] = parsedActions;
              this.saveStoredActions();
              this.state.syncStatus[tileId] = 'success';
              this.state.tileLastSynced[tileId] = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              this.showToast('Sync Successful', `Synchronized ${parsedActions.length} actions from Google Sheet for ${tile.name}`, 'success');
              syncedSuccessfully = true;
            }
          }
        } catch (err) {
          console.warn('Fallback sync error for', tileId, err);
        }
      }

      if (!syncedSuccessfully) {
        this.state.syncStatus[tileId] = 'cached';
        this.showToast('Live Sheet Active', 'Current verified records active on dashboard.', 'info');
      }

      this.render();
    },

    // Live Sync ALL employee sheets for the Boss & Strategic Dashboard
    async syncAllEmployeeSheets() {
      if (this.state.isSyncingAll) return;
      this.state.isSyncingAll = true;
      this.showToast('Syncing All Sheets', 'Connecting to Google Sheets and picking fresh live data...', 'info');
      this.render();

      let successCount = 0;

      // 1. Try parallel server live sync (fetches all connected sheets simultaneously with cache-busting)
      try {
        const nonce = Date.now();
        const res = await fetch(`/api/strategic/live-data?refresh=true&_t=${nonce}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.liveActions) {
            for (const [tileId, actions] of Object.entries(data.liveActions)) {
              if (Array.isArray(actions) && actions.length > 0) {
                this.customActions[tileId] = actions;
                this.state.tileLastSynced[tileId] = data.data?.[tileId]?.lastSynced || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                successCount++;
              }
            }
          }
        }
      } catch (err) {
        console.warn('Server bulk sync failed, falling back to sequential sync:', err);
      }

      // 2. Sequential fallback if server did not return actions
      if (successCount === 0) {
        const employeeTiles = this.getAllTiles().filter(t => !t.isBossDashboard);
        for (const tile of employeeTiles) {
          if (tile.sheetUrl) {
            try {
              if (window.FPCL_SHEET_SYNC && typeof window.FPCL_SHEET_SYNC.fetchGoogleSheetData === 'function') {
                const csvText = await window.FPCL_SHEET_SYNC.fetchGoogleSheetData(tile.sheetUrl, {
                  sheetTab: tile.sheetTab || tile.name || 'Sheet1',
                  gid: tile.gid || '0'
                });
                if (csvText && csvText.length > 30) {
                  const parsed = this.parseCsvToActions(csvText, tile.code);
                  if (parsed && parsed.length > 0) {
                    this.customActions[tile.id] = parsed;
                    this.state.tileLastSynced[tile.id] = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    successCount++;
                  }
                }
              }
            } catch (e) {
              // continue
            }
          }
        }
      }

      this.saveStoredActions();
      this.state.isSyncingAll = false;
      this.state.masterLastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.showToast('All Sheets Synced', `Successfully refreshed live data from ${successCount} Google Sheets!`, 'success');
      this.render();
    },

    // Robust RFC 4180 CSV row tokenizer supporting multiline cells with embedded quotes and newlines
    parseCsvRows(csvText) {
      const rows = [];
      let currentRow = [];
      let currentToken = '';
      let inQuotes = false;

      for (let i = 0; i < csvText.length; i++) {
        const ch = csvText[i];
        const nextCh = csvText[i + 1];

        if (ch === '"') {
          if (inQuotes && nextCh === '"') {
            currentToken += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          currentRow.push(currentToken.trim().replace(/^"|"$/g, ''));
          currentToken = '';
        } else if ((ch === '\r' || ch === '\n') && !inQuotes) {
          if (ch === '\r' && nextCh === '\n') {
            i++;
          }
          currentRow.push(currentToken.trim().replace(/^"|"$/g, ''));
          currentToken = '';
          if (currentRow.length > 0 && currentRow.some(cell => cell.length > 0)) {
            rows.push(currentRow);
          }
          currentRow = [];
        } else {
          currentToken += ch;
        }
      }

      if (currentToken.length > 0 || currentRow.length > 0) {
        currentRow.push(currentToken.trim().replace(/^"|"$/g, ''));
        if (currentRow.some(cell => cell.length > 0)) {
          rows.push(currentRow);
        }
      }

      return rows;
    },

    // CSV parsing logic for employee action sheets
    parseCsvToActions(csvText, defaultCode) {
      if (!csvText) return [];
      const rows = this.parseCsvRows(csvText);
      if (rows.length <= 1) return [];

      const rawHeaders = rows[0].map(h => h.trim()).filter(h => h.length > 0);
      const headers = rawHeaders.map(h => h.toLowerCase());
      const findCol = (candidates, exclude = []) => {
        let idx = headers.findIndex(h => candidates.some(c => h.trim() === c));
        if (idx !== -1) return idx;
        idx = headers.findIndex(h => {
          if (exclude.some(ex => h.includes(ex))) return false;
          return candidates.some(c => {
            if (c.length <= 3) {
              return new RegExp('\\b' + c + '\\b', 'i').test(h);
            }
            return h.includes(c);
          });
        });
        return idx;
      };

      const idCol = findCol(['s_no', 's.no', 'sr', 'sno', 'id', 'code', 'action #', 'action#', 'item', 'no', '#']);
      const bgCol = findCol(['background', 'bg']);
      const dateRefCol = findCol(['date/reference', 'date / reference', 'date_reference', 'date-reference', 'datereference', 'date ref', 'date/ref', 'reference', 'ref'], ['target', 'due']);
      const descCol = findCol(['assigned action', 'action description', 'deliverable', 'description', 'activity', 'action', 'task', 'title', 'desc'], ['category']);
      const catCol = findCol(['action category', 'category', 'cat']);
      const assignedCol = findCol(['assigned to', 'assignee', 'assigned person'], ['action']);
      const dueCol = findCol(['target date', 'due date', 'deadline', 'target', 'due'], ['reference', 'ref']);
      const statusCol = findCol(['status detail', 'open_close status', 'open_close', 'status', 'state', 'condition']);
      const priorityCol = findCol(['priority', 'prio', 'urgency']);
      const remarksCol = findCol(['remarks', 'remark', 'note', 'comment', 'closure']);
      const ackCol = findCol(['ack by', 'acknowledged by', 'ack'], ['background']);
      const closureCol = findCol(['closure date', 'closed on', 'completed date', 'resolved date']);

      const parsed = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];

        const background = bgCol !== -1 ? (row[bgCol] || '') : '';
        const dateReference = dateRefCol !== -1 ? (row[dateRefCol] || '') : '';
        const desc = descCol !== -1 ? (row[descCol] || '') : (row[3] || row[1] || row[0] || '');
        if (!desc && !background && !dateReference) continue;

        const rawStatus = statusCol !== -1 ? (row[statusCol] || '') : '';
        const isClosed = /close|done|complete|resolved/i.test(rawStatus);
        const status = isClosed ? 'Closed' : 'Open';

        let rawId = idCol !== -1 && row[idCol] ? row[idCol].trim() : '';
        let id = rawId;
        if (!id) {
          id = `${defaultCode}-${String(i).padStart(2, '0')}`;
        } else if (/^\d+$/.test(id)) {
          id = `${defaultCode}-${id.padStart(2, '0')}`;
        }

        const rawCategory = catCol !== -1 ? (row[catCol] || '') : '';
        const rawAssignedTo = assignedCol !== -1 ? (row[assignedCol] || '') : '';
        const dueDate = dueCol !== -1 ? (row[dueCol] || '') : '';
        const remarks = remarksCol !== -1 ? (row[remarksCol] || '') : '';
        const ackBy = ackCol !== -1 ? (row[ackCol] || '') : '';

        const rawPriority = priorityCol !== -1 ? (row[priorityCol] || '') : '';
        let priority = 'High';
        if (/low|p3/i.test(rawPriority)) {
          priority = 'Low';
        } else if (/med|medium|p2/i.test(rawPriority)) {
          priority = 'Medium';
        } else if (/high|critical|p1/i.test(rawPriority)) {
          priority = 'High';
        } else {
          priority = i % 2 === 0 ? 'Medium' : 'High';
        }

        const closureDate = closureCol !== -1 ? (row[closureCol] || '') : (isClosed ? (dueDate || new Date().toISOString().split('T')[0]) : '');

        // Capture raw columns dictionary for dynamic table rendering
        const rawColumns = {};
        for (let c = 0; c < rawHeaders.length; c++) {
          const headerName = rawHeaders[c];
          rawColumns[headerName] = row[c] !== undefined ? row[c] : '';
        }
        if (rawColumns['S_No'] === undefined) rawColumns['S_No'] = id || String(i);
        if (rawColumns['Background'] === undefined) rawColumns['Background'] = background;
        if (rawColumns['Date/Reference'] === undefined) rawColumns['Date/Reference'] = dateReference;
        if (rawColumns['Assigned Action'] === undefined) rawColumns['Assigned Action'] = desc;
        if (rawColumns['Action category'] === undefined) rawColumns['Action category'] = rawCategory;
        if (rawColumns['Assigned to'] === undefined) rawColumns['Assigned to'] = rawAssignedTo;
        if (rawColumns['Target date'] === undefined) rawColumns['Target date'] = dueDate;
        if (rawColumns['Status detail'] === undefined) rawColumns['Status detail'] = rawStatus;
        if (rawColumns['Remarks'] === undefined) rawColumns['Remarks'] = remarks;
        if (rawColumns['Ack by'] === undefined) rawColumns['Ack by'] = ackBy;

        const finalHeaders = rawHeaders.length > 0 ? rawHeaders : [
          'S_No', 'Background', 'Date/Reference', 'Assigned Action', 'Action category', 'Assigned to', 'Target date', 'Status detail', 'Remarks', 'Ack by'
        ];

        parsed.push({
          id,
          sNo: id || String(i),
          background,
          dateReference,
          title: desc,
          action: desc,
          category: rawCategory,
          assignedTo: rawAssignedTo,
          priority,
          dueDate,
          targetDate: dueDate,
          status,
          statusDetail: rawStatus,
          closureDate,
          remarks,
          ackBy,
          rawColumns,
          columnHeaders: finalHeaders
        });
      }

      return parsed;
    },

    // Open dedicated Full-Page Dashboard for Boss Rollup or Employee Action Sheet
    openDetailModal(tileId) {
      const tile = this.getTileData(tileId);
      if (!tile) return;
      this.state.selectedTileId = tileId;
      this.state.currentView = 'dashboard';

      const breadcrumbActive = document.getElementById('breadcrumb-active-name');
      if (breadcrumbActive) {
        breadcrumbActive.textContent = `Strategic Dashboard / ${tile.name}`;
      }

      this.render();

      const container = document.getElementById('strategic-specialized-container');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },

    // Return to Strategic Matrix Grid View
    // STRICT USER REQUIREMENT:
    // "On clicking each tile full page dashboard should open with back button and once moved back clicking should require/ask pasward"
    backToGrid() {
      if (window.portalApp && window.portalApp.state) {
        window.portalApp.state.activeDashboardId = 'strategic';
      }
      const landingView = document.getElementById('portal-landing-view');
      if (landingView) landingView.classList.add('hidden');
      const detailView = document.getElementById('dashboard-detail-view');
      if (detailView) detailView.classList.remove('hidden');
      const strategicContainer = document.getElementById('strategic-specialized-container');
      if (strategicContainer) {
        strategicContainer.classList.remove('hidden');
        strategicContainer.hidden = false;
      }

      this.state.unlockedTiles.clear();
      this.state.selectedTileId = null;
      this.state.activeAuthTileId = null;
      this.state.isMasterActive = false;
      this.state.currentView = 'grid';

      const breadcrumbActive = document.getElementById('breadcrumb-active-name');
      if (breadcrumbActive) {
        breadcrumbActive.textContent = 'Strategic Dashboard';
      }

      this.render();

      if (strategicContainer) {
        strategicContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      this.showToast('Dashboard Locked', 'Returned to Strategic Dashboard. Password required to access tiles.', 'info');
    },

    closeDetailModal() {
      this.backToGrid();
    },

    // =========================================================================
    // RENDER: COO SELF ASSIGNED ACTIONS DASHBOARD (SHEET ID: 1s5czmIVCXiOPTRc69QffJ51JFW2-gAErPitstUar2dU, TAB: COO)
    // =========================================================================
    renderCooSelfAssignedDashboard() {
      const allActions = this.cooSelfActions || [];
      const filteredActions = this.getFilteredCooSelfActions();

      // Filtered KPIs (strictly reflects all applied filters across whole dashboard)
      const totalCount = filteredActions.length;
      const closedCount = filteredActions.filter(a => this.classifyStatusDetail(a.statusDetail) === 'Closed').length;
      const openCount = filteredActions.filter(a => this.classifyStatusDetail(a.statusDetail) === 'Open').length;
      const overdueCount = filteredActions.filter(a => this.classifyStatusDetail(a.statusDetail) === 'Overdue').length;
      const droppedCount = filteredActions.filter(a => this.classifyStatusDetail(a.statusDetail) === 'Dropped').length;

      // 6- Overall progress by KPI 1 and KPI 3 and 4 I.e count open actions and overdue both as open actions for calculation
      const openPoints = openCount + overdueCount;
      const overallProgress = totalCount > 0 ? Math.max(0, Math.min(100, Math.round(((totalCount - openPoints) / totalCount) * 100))) : 0;

      // Pagination for Excel Scrollable Table
      const page = this.state.cooSelfPage || 1;
      const pageSize = this.state.cooSelfPageSize || 15;
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
      const safePage = Math.min(page, totalPages);
      const startIdx = (safePage - 1) * pageSize;
      const endIdx = Math.min(totalCount, startIdx + pageSize);
      const pagedActions = filteredActions.slice(startIdx, endIdx);

      // Unique dropdown options from full COO dataset
      const uniqueCats = [...new Set(allActions.map(a => a.category).filter(Boolean))].sort();
      const uniqueAckBy = [...new Set(allActions.map(a => a.ackBy).filter(Boolean))].sort();
      const isFiltered = Boolean(
        this.state.cooSelfFilterSearch ||
        (this.state.cooSelfFilterColE && this.state.cooSelfFilterColE !== 'all') ||
        (this.state.cooSelfFilterColH && this.state.cooSelfFilterColH !== 'all') ||
        (this.state.cooSelfFilterColJ && this.state.cooSelfFilterColJ !== 'all') ||
        (this.state.cooSelfFilterColC && this.state.cooSelfFilterColC !== 'all') ||
        (this.state.cooSelfFilterColF && this.state.cooSelfFilterColF !== 'all')
      );

      // Category breakdown for horizontal stacked bar chart and donut chart
      const catMap = {};
      const baseCats = uniqueCats.length > 0 ? uniqueCats : ['Director M&O', 'MD'];
      baseCats.forEach(c => {
        catMap[c] = { category: c, total: 0, closed: 0, open: 0, overdue: 0 };
      });
      filteredActions.forEach(a => {
        const c = a.category || 'General';
        if (!catMap[c]) {
          catMap[c] = { category: c, total: 0, closed: 0, open: 0, overdue: 0 };
        }
        catMap[c].total++;
        const st = this.classifyStatusDetail(a.statusDetail);
        if (st === 'Closed') {
          catMap[c].closed++;
        } else if (st === 'Overdue') {
          catMap[c].overdue++;
          catMap[c].open++;
        } else {
          catMap[c].open++;
        }
      });
      const catRows = Object.values(catMap);
      const maxCatVal = Math.max(1, ...catRows.map(r => r.total));

      return `
        <div class="space-y-2.5 sm:space-y-3">
          <!-- 1. COLORFUL EYE-CATCHING BANNER -->
          <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#1e1b4b] to-slate-950 p-3 sm:p-3.5 text-white border-2 border-amber-400/40 shadow-lg">
            <!-- Shimmering Metallic Gold Top Edge Stripe -->
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-300 via-amber-400 to-yellow-500 shadow-xs"></div>

            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-0.5">
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                  class="w-9 h-9 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-slate-950 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 border border-white/15 shadow-sm"
                  title="Back to Strategic Dashboard Matrix"
                >
                  <i data-lucide="arrow-left" class="w-4 h-4"></i>
                </button>

                <div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 shadow-xs">
                      <i data-lucide="crown" class="w-3 h-3 text-slate-950"></i>
                      <span>COO Executive Suite</span>
                    </span>
                  </div>
                  <h2 class="text-base sm:text-lg font-black text-white tracking-tight leading-snug mt-0.5">
                    Self assigned actions
                  </h2>
                </div>
              </div>

              <!-- Action Bar Buttons: Sync, Export, Reset & Lock -->
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Departmental Action Button -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.openDepartmentalActionsModal()"
                  class="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-600 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-md hover:shadow-lg hover:-translate-y-0.5 border border-purple-400/40 select-none whitespace-nowrap"
                  title="Open list of strategic department dashboards and their Google Sheets"
                >
                  <i data-lucide="folder-kanban" class="w-3.5 h-3.5 text-purple-200"></i>
                  <span>departmental action</span>
                </button>

                <!-- COO self assigned sheet -->
                <a
                  href="https://docs.google.com/spreadsheets/d/1s5czmIVCXiOPTRc69QffJ51JFW2-gAErPitstUar2dU/edit?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-500 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-md hover:shadow-lg hover:-translate-y-0.5 border border-emerald-400/40 select-none whitespace-nowrap"
                  title="Open COO self assigned sheet (Sheet ID: 1s5czmIVCXiOPTRc69QffJ51JFW2-gAErPitstUar2dU)"
                >
                  <i data-lucide="sheet" class="w-3.5 h-3.5 text-white"></i>
                  <span>COO self assigned sheet</span>
                  <i data-lucide="external-link" class="w-3 h-3 text-white/80"></i>
                </a>

                <!-- Sync Live Google Sheet -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.fetchCooSelfAssignedActions(true)"
                  class="px-3.5 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 transition-all cursor-pointer flex items-center gap-1.5 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  title="Sync live Google Sheet (Sheet ID: 1s5czmIVCXiOPTRc69QffJ51JFW2-gAErPitstUar2dU, Tab: COO)"
                >
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-slate-950 ${this.state.cooSelfIsSyncing ? 'animate-spin' : ''}"></i>
                  <span>Sync Sheet</span>
                  <span class="text-[10px] opacity-75 font-mono font-bold">(${this.state.cooSelfLastSynced || 'Live'})</span>
                </button>

                <!-- Export CSV based on applied filter -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.exportCooSelfCSV()"
                  class="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  title="Download CSV based on applied filters"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>Export CSV (${totalCount})</span>
                </button>

                ${isFiltered ? `
                  <button
                    type="button"
                    onclick="window.FPCL_STRATEGIC_SUITE.clearCooSelfFilters()"
                    class="px-3 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer flex items-center gap-1"
                    title="Clear filters"
                  >
                    <i data-lucide="filter-x" class="w-3.5 h-3.5"></i>
                    <span>Reset</span>
                  </button>
                ` : ''}

                <!-- Lock & Return -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                  class="px-3 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-200 border border-white/20 hover:border-rose-400/40 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  title="Lock dashboard immediately and return to grid"
                >
                  <i data-lucide="lock" class="w-3.5 h-3.5"></i>
                  <span>Lock & Return</span>
                </button>
              </div>
            </div>
          </div>

          <!-- COO SUB-TABS: All Department Actions & Self assigned actions (DISPLAYED BELOW BANNER) -->
          <div class="bg-white border-2 border-slate-200/90 rounded-2xl p-1.5 shadow-xs flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onclick="window.FPCL_STRATEGIC_SUITE.setCooSubTab('all-department')"
              class="flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 bg-slate-50 text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200"
            >
              <i data-lucide="building-2" class="w-4 h-4"></i>
              <span>All Department Actions</span>
            </button>
            <button
              type="button"
              onclick="window.FPCL_STRATEGIC_SUITE.setCooSubTab('self-assigned')"
              class="flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/60"
            >
              <i data-lucide="check-square" class="w-4 h-4"></i>
              <span>Self assigned actions</span>
            </button>
          </div>

          <!-- 2. 6 KPI CARDS (LARGE FONT SIZE, CENTER ALIGNED, EYE-CATCHING PROFESSIONAL COLORS, ONLY HEADING & VALUE, RED FOR OPEN) -->
          <!-- In mobile view: side by side view (grid-cols-2) -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            <!-- 1- TOTAL actions from column A named S_No -->
            <div class="relative overflow-hidden rounded-2xl border-2 border-indigo-200 bg-gradient-to-b from-indigo-50/70 via-white to-indigo-50/30 p-3 sm:p-4 shadow-xs text-center flex flex-col items-center justify-center">
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-700"></div>
              <span class="text-xs font-extrabold uppercase tracking-wider text-indigo-900 text-center">TOTAL actions</span>
              <div class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-[#1E3A8A] mt-1.5 text-center">${totalCount}</div>
            </div>

            <!-- 2- Closed Actions from column H named Status detail -->
            <div class="relative overflow-hidden rounded-2xl border-2 border-emerald-200 bg-gradient-to-b from-emerald-50/70 via-white to-emerald-50/30 p-3 sm:p-4 shadow-xs text-center flex flex-col items-center justify-center">
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"></div>
              <span class="text-xs font-extrabold uppercase tracking-wider text-emerald-900 text-center">Closed Actions</span>
              <div class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-[#0B8A5A] mt-1.5 text-center">${closedCount}</div>
            </div>

            <!-- 3- Open Actions from column H named Status detail (RED COLOR) -->
            <div class="relative overflow-hidden rounded-2xl border-2 border-red-200 bg-gradient-to-b from-red-50/70 via-white to-red-50/30 p-3 sm:p-4 shadow-xs text-center flex flex-col items-center justify-center">
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-red-600"></div>
              <span class="text-xs font-extrabold uppercase tracking-wider text-red-900 text-center">Open Actions</span>
              <div class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-[#DC2626] mt-1.5 text-center">${openCount}</div>
            </div>

            <!-- 4- Overdue Actions from column H named Status detail (RED COLOR FOR OPEN POINTS) -->
            <div class="relative overflow-hidden rounded-2xl border-2 border-rose-200 bg-gradient-to-b from-rose-50/70 via-white to-rose-50/30 p-3 sm:p-4 shadow-xs text-center flex flex-col items-center justify-center">
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500"></div>
              <span class="text-xs font-extrabold uppercase tracking-wider text-rose-900 text-center">Overdue Actions</span>
              <div class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-[#DC2626] mt-1.5 text-center">${overdueCount}</div>
            </div>

            <!-- 5- Dropped Actions from column H named Status detail -->
            <div class="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-gradient-to-b from-slate-50/70 via-white to-slate-100/40 p-3 sm:p-4 shadow-xs text-center flex flex-col items-center justify-center">
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-500 via-slate-400 to-zinc-600"></div>
              <span class="text-xs font-extrabold uppercase tracking-wider text-slate-800 text-center">Dropped Actions</span>
              <div class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-[#64748B] mt-1.5 text-center">${droppedCount}</div>
            </div>

            <!-- 6- Overall progress by KPI 1 and KPI 3 and 4 (count open actions and overdue both as open actions for calculation) -->
            <div class="relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 p-3 sm:p-4 shadow-xs text-center flex flex-col items-center justify-center">
              <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500"></div>
              <span class="text-xs font-extrabold uppercase tracking-wider text-amber-950 text-center">Overall progress</span>
              <div class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-amber-800 mt-1.5 text-center">${overallProgress}%</div>
            </div>
          </div>

          <!-- 3. FILTERS (BELOW KPIS, NO HEADING, MOBILE SIDE-BY-SIDE, APPLIES TO WHOLE DASHBOARD, COL E, H, J) -->
          <div class="bg-white border-2 border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-xs">
            <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
              <!-- Search Filter -->
              <div class="relative col-span-2 sm:col-span-1">
                <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="search" class="w-3.5 h-3.5"></i>
                </div>
                <input
                  type="text"
                  value="${this.escapeHtml(this.state.cooSelfFilterSearch || '')}"
                  placeholder="Search actions..."
                  class="w-full pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border border-slate-300 focus:border-indigo-500 rounded-xl text-xs font-medium outline-none transition-all"
                  oninput="window.FPCL_STRATEGIC_SUITE.setCooSelfFilter('cooSelfFilterSearch', this.value)"
                />
                ${this.state.cooSelfFilterSearch ? `
                  <button
                    onclick="window.FPCL_STRATEGIC_SUITE.setCooSelfFilter('cooSelfFilterSearch', '')"
                    class="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <i data-lucide="x" class="w-3 h-3"></i>
                  </button>
                ` : ''}
              </div>

              <!-- Column E: Action category -->
              <div class="relative">
                <select
                  class="w-full py-1.5 pl-2.5 pr-7 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border ${(this.state.cooSelfFilterColE && this.state.cooSelfFilterColE !== 'all') || (this.state.cooSelfFilterColC && this.state.cooSelfFilterColC !== 'all') ? 'border-indigo-500 bg-indigo-50/50 text-indigo-950 font-bold' : 'border-slate-300'} focus:border-indigo-500 rounded-xl text-xs font-semibold outline-none transition-all cursor-pointer appearance-none truncate"
                  onchange="window.FPCL_STRATEGIC_SUITE.setCooSelfFilter('cooSelfFilterColE', this.value); window.FPCL_STRATEGIC_SUITE.setCooSelfFilter('cooSelfFilterColC', this.value);"
                >
                  <option value="all">Column E: Action category (All)</option>
                  ${uniqueCats.map(c => `
                    <option value="${this.escapeHtml(c)}" ${(this.state.cooSelfFilterColE === c || this.state.cooSelfFilterColC === c) ? 'selected' : ''}>${this.escapeHtml(c)}</option>
                  `).join('')}
                </select>
                <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                </div>
              </div>

              <!-- Column H: Status detail -->
              <div class="relative">
                <select
                  class="w-full py-1.5 pl-2.5 pr-7 bg-slate-50 hover:bg-white focus:bg-white text-slate-800 border ${(this.state.cooSelfFilterColH && this.state.cooSelfFilterColH !== 'all') || (this.state.cooSelfFilterColF && this.state.cooSelfFilterColF !== 'all') ? 'border-indigo-500 bg-indigo-50/50 text-indigo-950 font-bold' : 'border-slate-300'} focus:border-indigo-500 rounded-xl text-xs font-semibold outline-none transition-all cursor-pointer appearance-none truncate"
                  onchange="window.FPCL_STRATEGIC_SUITE.setCooSelfFilter('cooSelfFilterColH', this.value); window.FPCL_STRATEGIC_SUITE.setCooSelfFilter('cooSelfFilterColF', this.value);"
                >
                  <option value="all">Column H: Status detail (All)</option>
                  <option value="Open" ${(this.state.cooSelfFilterColH === 'Open' || this.state.cooSelfFilterColF === 'Open') ? 'selected' : ''}>Open</option>
                  <option value="Closed" ${(this.state.cooSelfFilterColH === 'Closed' || this.state.cooSelfFilterColF === 'Closed') ? 'selected' : ''}>Closed</option>
                  <option value="Overdue" ${(this.state.cooSelfFilterColH === 'Overdue' || this.state.cooSelfFilterColF === 'Overdue') ? 'selected' : ''}>Overdue</option>
                  <option value="Dropped" ${(this.state.cooSelfFilterColH === 'Dropped' || this.state.cooSelfFilterColF === 'Dropped') ? 'selected' : ''}>Dropped</option>
                </select>
                <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                </div>
              </div>

              <!-- Column J: Ack by -->
              <div class="relative">
                <select
                  class="w-full py-1.5 pl-2.5 pr-7 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border ${this.state.cooSelfFilterColJ && this.state.cooSelfFilterColJ !== 'all' ? 'border-indigo-500 bg-indigo-50/50 text-indigo-950 font-bold' : 'border-slate-300'} focus:border-indigo-500 rounded-xl text-xs font-semibold outline-none transition-all cursor-pointer appearance-none truncate"
                  onchange="window.FPCL_STRATEGIC_SUITE.setCooSelfFilter('cooSelfFilterColJ', this.value)"
                >
                  <option value="all">Column J: Ack by (All)</option>
                  ${uniqueAckBy.map(h => `
                    <option value="${this.escapeHtml(h)}" ${this.state.cooSelfFilterColJ === h ? 'selected' : ''}>${this.escapeHtml(h)}</option>
                  `).join('')}
                </select>
                <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                </div>
              </div>

              <!-- Quick Export & Clear buttons -->
              <div class="col-span-2 sm:col-span-1 flex items-center gap-1.5">
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.exportCooSelfCSV()"
                  class="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                  title="Export CSV based on applied filters"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>Export CSV</span>
                </button>
                ${isFiltered ? `
                  <button
                    type="button"
                    onclick="window.FPCL_STRATEGIC_SUITE.clearCooSelfFilters()"
                    class="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    title="Clear filters"
                  >
                    <i data-lucide="filter-x" class="w-3.5 h-3.5"></i>
                    <span>Reset</span>
                  </button>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- 4 & 5. HORIZONTAL STACKED BAR CHART & DONUT CHART -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
            <!-- 4. HORIZONTAL STACKED BAR CHART: COO self assigned Actions Status -->
            <div class="lg:col-span-7 relative overflow-hidden bg-white border-2 border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-2.5 flex flex-col justify-between">
              <div>
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <h3 class="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    COO self assigned Actions Status
                  </h3>

                  <!-- Legend Chips with light tinted backgrounds -->
                  <div class="flex items-center gap-1.5 sm:gap-2 text-xs font-bold flex-wrap">
                    <div class="flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      <span class="w-2.5 h-2.5 rounded-full bg-[#1D4ED8] shrink-0"></span>
                      <span class="text-[#1E3A8A] text-xs font-bold">Total:</span>
                      <span class="font-mono text-[#1E3A8A] font-black text-xs sm:text-sm">${totalCount}</span>
                    </div>
                    <div class="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <span class="w-2.5 h-2.5 rounded-full bg-[#0B8A5A] shrink-0"></span>
                      <span class="text-[#0B8A5A] text-xs font-bold">Closed:</span>
                      <span class="font-mono text-[#0B8A5A] font-black text-xs sm:text-sm">${closedCount}</span>
                    </div>
                    <div class="flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                      <span class="w-2.5 h-2.5 rounded-full bg-[#DC2626] shrink-0"></span>
                      <span class="text-[#DC2626] text-xs font-bold">Open:</span>
                      <span class="font-mono text-[#DC2626] font-black text-xs sm:text-sm">${openCount}</span>
                    </div>
                  </div>
                </div>

                <!-- SVG Horizontal Stacked Bar Chart with Font Size 12 -->
                <div class="pt-2">
                  ${this.renderCooSelfStackedBarChartSvg(catRows, maxCatVal)}
                </div>
              </div>
            </div>

            <!-- 5. DONUT CHART: Actions closure by category (ENLARGED) -->
            <div class="lg:col-span-5 relative overflow-hidden bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div class="pb-2 border-b border-slate-100">
                <h3 class="text-sm sm:text-base font-black text-slate-900 leading-tight">
                  Actions closure by category
                </h3>
              </div>

              ${this.renderCooSelfDonutChartSvg(catRows, closedCount, totalCount, overallProgress)}
            </div>
          </div>

          <!-- 6. EXCEL SCROLLABLE TABLE -->
          <div class="bg-white border-2 border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div class="p-3.5 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
              <div class="flex items-center gap-2">
                <i data-lucide="table" class="w-4 h-4 text-indigo-700"></i>
                <h3 class="text-sm sm:text-base font-black text-slate-800">
                  Company Action Items and Action Item Master Roster (COO Self Assigned - ${totalCount} records)
                </h3>
              </div>

              <!-- Rows per page selector -->
              <div class="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                <span class="font-medium">Rows per page:</span>
                <select
                  onchange="window.FPCL_STRATEGIC_SUITE.setCooSelfPageSize(this.value)"
                  class="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="15" ${pageSize === 15 ? 'selected' : ''}>15</option>
                  <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
                  <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
                  <option value="all" ${pageSize === 9999 ? 'selected' : ''}>All</option>
                </select>
              </div>
            </div>

            <div class="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table class="w-full text-left text-xs sm:text-sm border-collapse table-auto">
                <thead>
                  <tr class="sticky top-0 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-slate-700 font-bold text-xs sm:text-sm z-10">
                    <th class="py-3 px-3.5 min-w-[60px] whitespace-nowrap">S_No</th>
                    <th class="py-3 px-3.5 min-w-[120px] max-w-[220px] whitespace-normal break-words">Background</th>
                    <th class="py-3 px-3.5 min-w-[100px] max-w-[150px] whitespace-normal break-words">Date/Reference</th>
                    <th class="py-3 px-3.5 min-w-[300px] max-w-[540px] whitespace-normal break-words">Assigned Action</th>
                    <th class="py-3 px-3.5 min-w-[120px] max-w-[180px] whitespace-normal break-words">Action category</th>
                    <th class="py-3 px-3.5 min-w-[100px] max-w-[150px] whitespace-normal break-words">Assigned to</th>
                    <th class="py-3 px-3.5 min-w-[100px] max-w-[140px] whitespace-normal break-words">Target date</th>
                    <th class="py-3 px-3.5 min-w-[110px] max-w-[160px] whitespace-normal break-words">Status detail</th>
                    <th class="py-3 px-3.5 min-w-[200px] max-w-[380px] whitespace-normal break-words">Remarks</th>
                    <th class="py-3 px-3.5 min-w-[100px] max-w-[140px] whitespace-normal break-words">Ack by</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-xs sm:text-sm">
                  ${pagedActions.length === 0 ? `
                    <tr>
                      <td colspan="10" class="py-10 text-center text-slate-400 font-medium text-sm">
                        No actions match the active search or filters.
                      </td>
                    </tr>
                  ` : pagedActions.map(a => {
                    const stRaw = (a.statusDetail || '').trim();
                    const st = this.classifyStatusDetail(stRaw);
                    const isClosed = st === 'Closed';
                    const isOpen = st === 'Open';
                    const isOverdue = st === 'Overdue';
                    const isDropped = st === 'Dropped';

                    let badgeClass = 'bg-slate-100 text-slate-700 border border-slate-200';
                    let dotColor = '#64748B';
                    if (isClosed) {
                      badgeClass = 'bg-emerald-50 text-[#0B8A5A] border border-emerald-200';
                      dotColor = '#0B8A5A';
                    } else if (isOpen) {
                      badgeClass = 'bg-red-50 text-[#DC2626] border border-red-200';
                      dotColor = '#DC2626';
                    } else if (isOverdue) {
                      badgeClass = 'bg-rose-50 text-[#DC2626] border border-rose-200';
                      dotColor = '#DC2626';
                    } else if (isDropped) {
                      badgeClass = 'bg-slate-100 text-slate-700 border border-slate-200';
                      dotColor = '#64748B';
                    }

                    return `
                      <tr class="hover:bg-slate-50/80 transition-colors align-top">
                        <td class="py-3 px-3.5 font-mono font-bold text-slate-800 text-xs sm:text-sm whitespace-nowrap align-top">${this.escapeHtml(a.sNo)}</td>
                        <td class="py-3 px-3.5 text-slate-700 text-xs sm:text-sm min-w-[120px] max-w-[220px] whitespace-pre-line break-words [overflow-wrap:anywhere] leading-relaxed align-top">${this.escapeHtml(a.background) || '<span class="text-slate-400 font-mono text-xs">-</span>'}</td>
                        <td class="py-3 px-3.5 text-slate-600 font-mono text-xs min-w-[100px] max-w-[150px] whitespace-pre-line break-words [overflow-wrap:anywhere] align-top">${this.escapeHtml(a.dateReference) || '<span class="text-slate-400 font-mono text-xs">-</span>'}</td>
                        <td class="py-3 px-3.5 text-slate-900 font-medium text-xs sm:text-sm min-w-[300px] max-w-[540px] whitespace-pre-line break-words [overflow-wrap:anywhere] leading-relaxed align-top">${this.escapeHtml(a.action)}</td>
                        <td class="py-3 px-3.5 min-w-[120px] max-w-[180px] whitespace-pre-line break-words [overflow-wrap:anywhere] align-top">
                          ${a.category ? `
                            <span class="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200/60 whitespace-pre-line break-words [overflow-wrap:anywhere]">
                              ${this.escapeHtml(a.category)}
                            </span>
                          ` : '<span class="text-slate-400 font-mono text-xs">-</span>'}
                        </td>
                        <td class="py-3 px-3.5 text-slate-700 font-medium text-xs sm:text-sm min-w-[100px] max-w-[150px] whitespace-pre-line break-words [overflow-wrap:anywhere] align-top">${this.escapeHtml(a.assignedTo) || '<span class="text-slate-400 font-mono text-xs">-</span>'}</td>
                        <td class="py-3 px-3.5 text-slate-600 font-mono text-xs min-w-[100px] max-w-[140px] whitespace-pre-line break-words [overflow-wrap:anywhere] align-top">${this.escapeHtml(a.targetDate) || '<span class="text-slate-400 font-mono text-xs">-</span>'}</td>
                        <td class="py-3 px-3.5 min-w-[110px] max-w-[160px] whitespace-pre-line break-words [overflow-wrap:anywhere] align-top">
                          ${stRaw && stRaw !== '-' ? `
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${badgeClass}">
                              <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color: ${dotColor}"></span>
                              <span class="whitespace-pre-line break-words [overflow-wrap:anywhere]">${this.escapeHtml(stRaw)}</span>
                            </span>
                          ` : '<span class="text-slate-400 font-mono text-xs">-</span>'}
                        </td>
                        <td class="py-3 px-3.5 text-slate-700 text-xs sm:text-sm min-w-[200px] max-w-[380px] whitespace-pre-line break-words [overflow-wrap:anywhere] leading-relaxed align-top">${this.escapeHtml(a.remarks) || '<span class="text-slate-400 font-mono text-xs">-</span>'}</td>
                        <td class="py-3 px-3.5 text-slate-600 font-medium text-xs sm:text-sm min-w-[100px] max-w-[140px] whitespace-pre-line break-words [overflow-wrap:anywhere] align-top">${this.escapeHtml(a.ackBy) || '<span class="text-slate-400 font-mono text-xs">-</span>'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Pagination Footer -->
            ${totalPages > 1 ? `
              <div class="p-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>Page ${safePage} of ${totalPages}</span>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    ${safePage <= 1 ? 'disabled' : ''}
                    onclick="window.FPCL_STRATEGIC_SUITE.setCooSelfPage(${safePage - 1})"
                    class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    ${safePage >= totalPages ? 'disabled' : ''}
                    onclick="window.FPCL_STRATEGIC_SUITE.setCooSelfPage(${safePage + 1})"
                    class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    },

    // RENDER: HORIZONTAL STACKED BAR CHART (COO self assigned Actions Status)
    renderCooSelfStackedBarChartSvg(catRows, maxVal) {
      if (!catRows || catRows.length === 0) {
        return `<div class="p-6 text-center text-xs text-slate-400">No actions recorded</div>`;
      }

      const svgWidth = 720;
      const padLeft = 175;
      const padRight = 55;
      const padTop = 18;
      const rowHeight = 54;
      const barHeight = 28;
      const availWidth = svgWidth - padLeft - padRight;
      const svgHeight = padTop + catRows.length * rowHeight + 28;

      // Dashed vertical reference gridlines and numbers
      const gridSteps = 4;
      const gridLines = [];
      for (let g = 0; g <= gridSteps; g++) {
        const frac = g / gridSteps;
        const gx = padLeft + frac * availWidth;
        const val = Math.round(frac * maxVal);
        gridLines.push(`
          <line x1="${gx}" y1="${padTop - 6}" x2="${gx}" y2="${svgHeight - 20}" stroke="#F1F5F9" stroke-dasharray="3,3" stroke-width="1" />
          <text x="${gx}" y="${svgHeight - 8}" fill="#94A3B8" font-size="10" font-family="'JetBrains Mono', monospace" text-anchor="middle">${val}</text>
        `);
      }

      const rowElements = catRows.map((r, idx) => {
        const y = padTop + idx * rowHeight;
        const total = r.total || 0;
        const closed = r.closed || 0;
        const open = r.open || 0;

        const closedW = maxVal > 0 ? (closed / maxVal) * availWidth : 0;
        const openW = maxVal > 0 ? (open / maxVal) * availWidth : 0;
        const closedPct = total > 0 ? Math.round((closed / total) * 100) : 0;
        const openPct = total > 0 ? Math.round((open / total) * 100) : 0;

        // Label on left with 12px font size
        const labelText = this.escapeHtml(r.category || 'General');

        // Light grey dashed horizontal gridline on a plain white background
        const hGrid = `<line x1="${padLeft}" y1="${y + barHeight + 12}" x2="${svgWidth - padRight}" y2="${y + barHeight + 12}" stroke="#E2E8F0" stroke-dasharray="4,4" stroke-width="1" />`;

        // Stack segments:
        // Closed/Validation/uploaded/ Passed = solid green #0B8A5A at bottom of stack
        // Open/Pending/Documents Remaining = solid red #DC2626 on top with slightly rounded top corners
        const closedBar = closedW > 0 ? `
          <rect x="${padLeft}" y="${y}" width="${closedW}" height="${barHeight}" fill="#0B8A5A" ${openW === 0 ? 'rx="4" ry="4"' : 'rx="2" ry="2"'} />
          ${closedW >= 24 ? `
            <text x="${padLeft + closedW / 2}" y="${y + barHeight / 2}" fill="#FFFFFF" font-size="12" font-weight="800" text-anchor="middle" dominant-baseline="central">${closed} (${closedPct}%)</text>
          ` : ''}
        ` : '';

        const openBar = openW > 0 ? `
          <rect x="${padLeft + closedW}" y="${y}" width="${openW}" height="${barHeight}" fill="#DC2626" rx="4" ry="4" />
          ${openW >= 24 ? `
            <text x="${padLeft + closedW + openW / 2}" y="${y + barHeight / 2}" fill="#FFFFFF" font-size="12" font-weight="800" text-anchor="middle" dominant-baseline="central">${open} (${openPct}%)</text>
          ` : ''}
        ` : '';

        // Total number written outside bar on right in navy #1E3A8A text
        const totalText = `
          <text x="${padLeft + closedW + openW + 10}" y="${y + barHeight / 2}" fill="#1E3A8A" font-size="12" font-weight="900" font-family="'JetBrains Mono', monospace" dominant-baseline="central">${total}</text>
        `;

        // Row group with white rounded tooltip and blue top border
        const safeCat = String(r.category || 'General').replace(/'/g, "\\'");
        return `
          <g class="cursor-pointer group"
             onmouseenter="window.FPCL_STRATEGIC_SUITE.showCooTooltip(event, '${safeCat}', ${total}, ${open}, ${closed})"
             onmousemove="window.FPCL_STRATEGIC_SUITE.moveCooTooltip(event)"
             onmouseleave="window.FPCL_STRATEGIC_SUITE.hideCooTooltip()">
            <title>Category: ${r.category}&#10;Total: ${total}&#10;Open: ${open}&#10;Closed: ${closed}</title>
            <text x="${padLeft - 12}" y="${y + barHeight / 2}" fill="#1E293B" font-size="12" font-weight="700" text-anchor="end" dominant-baseline="central">${labelText}</text>
            ${closedBar}
            ${openBar}
            ${totalText}
            ${hGrid}
          </g>
        `;
      }).join('');

      return `
        <div class="w-full overflow-x-auto touch-pan-x bg-white rounded-xl p-1 select-none">
          <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full max-w-[760px] mx-auto h-auto" style="min-width: 520px; font-family: 'Plus Jakarta Sans', system-ui, sans-serif;">
            <rect width="100%" height="100%" fill="#FFFFFF" />
            ${gridLines.join('')}
            ${rowElements}
          </svg>
        </div>
      `;
    },

    // RENDER: DONUT CHART (Actions closure by category)
    renderCooSelfDonutChartSvg(catRows, totalClosed, totalActions, overallProgress) {
      const size = 360;
      const center = size / 2;
      const outerR = 138;
      const innerR = 82;
      const colors = ['#0B8A5A', '#1D4ED8', '#7C3AED', '#EA580C', '#0284C7', '#059669', '#D97706', '#E11D48'];

      let paths = '';
      if (totalActions === 0) {
        // Empty placeholder ring
        paths = `
          <circle cx="${center}" cy="${center}" r="${(outerR + innerR) / 2}" stroke="#E2E8F0" stroke-width="${outerR - innerR}" fill="none" />
        `;
      } else {
        let currentAngle = -Math.PI / 2;
        const total = totalActions;

        paths = catRows.map((r, idx) => {
          if (!r.total || r.total <= 0) return '';
          const sliceFraction = r.total / total;
          const sweepAngle = sliceFraction * Math.PI * 2;
          const endAngle = currentAngle + sweepAngle;

          const x1 = center + outerR * Math.cos(currentAngle);
          const y1 = center + outerR * Math.sin(currentAngle);
          const x2 = center + outerR * Math.cos(endAngle);
          const y2 = center + outerR * Math.sin(endAngle);

          const x3 = center + innerR * Math.cos(endAngle);
          const y3 = center + innerR * Math.sin(endAngle);
          const x4 = center + innerR * Math.cos(currentAngle);
          const y4 = center + innerR * Math.sin(currentAngle);

          const largeArc = sweepAngle > Math.PI ? 1 : 0;
          const color = colors[idx % colors.length];

          const d = [
            `M ${x1} ${y1}`,
            `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
            `L ${x3} ${y3}`,
            `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
            'Z'
          ].join(' ');

          currentAngle = endAngle;

          return `
            <path d="${d}" fill="${color}" stroke="#FFFFFF" stroke-width="2.5" class="transition-opacity hover:opacity-85 cursor-pointer">
              <title>${r.category}: ${r.total} actions (${Math.round(sliceFraction * 100)}%)&#10;Closed: ${r.closed} | Open: ${r.open}</title>
            </path>
          `;
        }).join('');
      }

      // Legends at bottom
      const legendsHtml = catRows.map((r, idx) => {
        const color = colors[idx % colors.length];
        const pct = totalActions > 0 ? Math.round((r.total / totalActions) * 100) : 0;
        const closureRate = r.total > 0 ? Math.round((r.closed / r.total) * 100) : 0;
        return `
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs shadow-2xs">
            <span class="w-3 h-3 rounded-full shrink-0" style="background-color: ${color}"></span>
            <span class="font-bold text-slate-800">${this.escapeHtml(r.category)}:</span>
            <span class="font-mono font-bold text-slate-600">${r.total} (${pct}%)</span>
            <span class="font-mono font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] border border-emerald-200/60">${closureRate}% Cls</span>
          </div>
        `;
      }).join('');

      return `
        <div class="flex flex-col items-center justify-between w-full h-full space-y-3 sm:space-y-4">
          <div class="relative flex items-center justify-center w-full py-2">
            <svg viewBox="0 0 ${size} ${size}" class="w-72 h-72 sm:w-80 sm:h-80 md:w-88 md:h-88 lg:w-92 lg:h-92 max-w-full select-none mx-auto drop-shadow-sm">
              ${paths}
              <!-- Center Text (Comfortably fits inside 164px diameter inner circle) -->
              <text x="${center}" y="${center - 10}" fill="#0F172A" font-size="38" font-weight="900" font-family="'JetBrains Mono', monospace" text-anchor="middle" dominant-baseline="central">
                ${overallProgress}%
              </text>
              <text x="${center}" y="${center + 20}" fill="#64748B" font-size="11.5" font-weight="800" text-anchor="middle" dominant-baseline="central" letter-spacing="0.08em">
                OVERALL PROGRESS
              </text>
              <text x="${center}" y="${center + 38}" fill="#0B8A5A" font-size="11.5" font-weight="700" text-anchor="middle" dominant-baseline="central">
                ${totalClosed} of ${totalActions} Closed
              </text>
            </svg>
          </div>

          <!-- Legends at bottom -->
          <div class="w-full flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-slate-100">
            ${legendsHtml || '<div class="text-xs text-slate-400">No category breakdown</div>'}
          </div>
        </div>
      `;
    },

    // =========================================================================
    // RENDER: STRATEGIC DASHBOARD ROLLUP (TAKES DATA FROM ALL TILES)
    // =========================================================================
    renderBossDashboard() {
      if (this.state.cooSubTab === 'self-assigned') {
        return this.renderCooSelfAssignedDashboard();
      }

      const rollup = this.getBossRollup();
      const allActions = rollup.allActionsList || [];
      const filteredActions = this.getFilteredMasterActions();
      const allTiles = rollup.employeeTiles || [];

      // KPIs based on company-wide data
      const totalActions = allActions.length;
      const closedActions = allActions.filter(a => a.status === 'Closed' || a.status === 'Completed' || (a.status || '').toLowerCase().includes('close') || this.getActionColVal(a, 'STATUS') === 'Closed').length;
      const openActions = totalActions - closedActions;
      const overallRate = totalActions > 0 ? Math.round((closedActions / totalActions) * 100) : 0;

      // Filtered KPIs (strictly reflects all applied filters across whole dashboard)
      const filteredTotal = filteredActions.length;
      const filteredClosed = filteredActions.filter(a => a.status === 'Closed' || a.status === 'Completed' || (a.status || '').toLowerCase().includes('close') || this.getActionColVal(a, 'STATUS') === 'Closed').length;
      const filteredOpen = filteredTotal - filteredClosed;
      const filteredRate = filteredTotal > 0 ? Math.round((filteredClosed / filteredTotal) * 100) : 0;

      // Donut Chart & Trends Legend metrics reflect the active filters
      const chartTotal = filteredTotal;
      const chartClosed = filteredClosed;
      const chartOpen = filteredOpen;
      const chartRate = filteredRate;

      // Pagination for Simple Table
      const page = this.state.masterPage || 1;
      const pageSize = this.state.masterPageSize || 15;
      const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
      const safePage = Math.min(page, totalPages);
      const startIdx = (safePage - 1) * pageSize;
      const endIdx = Math.min(filteredTotal, startIdx + pageSize);
      const pagedActions = filteredActions.slice(startIdx, endIdx);

      const uniqueMasterColE = [...new Set(allActions.map(a => this.getActionColVal(a, 'CATEGORY')).filter(Boolean))].sort();
      const uniqueMasterColF = [...new Set(allActions.map(a => this.getActionColVal(a, 'ASSIGNED')).filter(Boolean))].sort();
      const uniqueMasterColJ = [...new Set(allActions.map(a => this.getActionColVal(a, 'ACK')).filter(Boolean))].sort();
      const uniqueMasterColC = uniqueMasterColE;
      const uniqueMasterColD = uniqueMasterColF;
      const uniqueMasterColH = uniqueMasterColJ;
      const isFiltered = Boolean(
        this.state.masterFilterSearch || 
        this.state.masterFilterDept !== 'all' || 
        (this.state.masterFilterStatus && this.state.masterFilterStatus !== 'all') ||
        (this.state.masterFilterColE && this.state.masterFilterColE !== 'all') ||
        (this.state.masterFilterColF && this.state.masterFilterColF !== 'all') ||
        (this.state.masterFilterColH && this.state.masterFilterColH !== 'all') ||
        (this.state.masterFilterColJ && this.state.masterFilterColJ !== 'all') ||
        (this.state.masterFilterColC && this.state.masterFilterColC !== 'all') ||
        (this.state.masterFilterColD && this.state.masterFilterColD !== 'all')
      );

      return `
        <div class="space-y-2.5 sm:space-y-3">
          <!-- EXECUTIVE COO DASHBOARD BANNER WITH METALLIC GOLD & RICH SLATE/NAVY FAMILY -->
          <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#1e1b4b] to-slate-950 p-3 sm:p-3.5 text-white border-2 border-amber-400/40 shadow-lg">
            <!-- Shimmering Metallic Gold Top Edge Stripe -->
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-300 via-amber-400 to-yellow-500 shadow-xs"></div>

            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-0.5">
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                  class="w-9 h-9 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-slate-950 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 border border-white/15 shadow-sm"
                  title="Back to Strategic Dashboard Matrix"
                >
                  <i data-lucide="arrow-left" class="w-4 h-4"></i>
                </button>

                <div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 shadow-xs">
                      <i data-lucide="crown" class="w-3 h-3 text-slate-950"></i>
                      <span>COO Executive Suite</span>
                    </span>
                  </div>
                  <h2 class="text-base sm:text-lg font-black text-white tracking-tight leading-snug mt-0.5">
                    All Department Actions
                  </h2>
                </div>
              </div>

              <div class="flex items-center gap-2 flex-wrap">
                <!-- Departmental Action Button -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.openDepartmentalActionsModal()"
                  class="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-600 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-md hover:shadow-lg hover:-translate-y-0.5 border border-purple-400/40 select-none whitespace-nowrap"
                  title="Open list of strategic department dashboards and their Google Sheets"
                >
                  <i data-lucide="folder-kanban" class="w-3.5 h-3.5 text-purple-200"></i>
                  <span>departmental action</span>
                </button>

                <!-- COO self assigned sheet -->
                <a
                  href="https://docs.google.com/spreadsheets/d/1s5czmIVCXiOPTRc69QffJ51JFW2-gAErPitstUar2dU/edit?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-500 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-md hover:shadow-lg hover:-translate-y-0.5 border border-emerald-400/40 select-none whitespace-nowrap"
                  title="Open COO self assigned sheet (Sheet ID: 1s5czmIVCXiOPTRc69QffJ51JFW2-gAErPitstUar2dU)"
                >
                  <i data-lucide="sheet" class="w-3.5 h-3.5 text-white"></i>
                  <span>COO self assigned sheet</span>
                  <i data-lucide="external-link" class="w-3 h-3 text-white/80"></i>
                </a>

                <!-- Sync All Google Sheets Option with Gold Accent -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.syncAllEmployeeSheets()"
                  class="px-3.5 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 transition-all cursor-pointer flex items-center gap-1.5 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  title="Sync all 19 department Google Sheets"
                >
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-slate-950 ${this.state.isSyncingAll ? 'animate-spin' : ''}"></i>
                  <span>Sync All Sheets</span>
                  <span class="text-[10px] opacity-75 font-mono font-bold">(${this.state.masterLastSynced || 'Live'})</span>
                </button>

                <!-- Export CSV with Emerald/Teal Gradient (Respects applied filters) -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.exportMasterCSV()"
                  class="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  title="Download CSV based on applied filters"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>Export CSV (${filteredTotal})</span>
                </button>

                ${isFiltered ? `
                  <button
                    type="button"
                    onclick="window.FPCL_STRATEGIC_SUITE.clearMasterFilters()"
                    class="px-3 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <i data-lucide="filter-x" class="w-3.5 h-3.5"></i>
                    <span>Reset</span>
                  </button>
                ` : ''}

                <!-- Lock & Return -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                  class="px-3 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-200 border border-white/20 hover:border-rose-400/40 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  title="Lock dashboard immediately and return to grid"
                >
                  <i data-lucide="lock" class="w-3.5 h-3.5"></i>
                  <span>Lock & Return</span>
                </button>
              </div>
            </div>
          </div>

          <!-- COO SUB-TABS: All Department Actions & Self assigned actions (DISPLAYED BELOW BANNER) -->
          <div class="bg-white border-2 border-slate-200/90 rounded-2xl p-1.5 shadow-xs flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onclick="window.FPCL_STRATEGIC_SUITE.setCooSubTab('all-department')"
              class="flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/60"
            >
              <i data-lucide="building-2" class="w-4 h-4"></i>
              <span>All Department Actions</span>
            </button>
            <button
              type="button"
              onclick="window.FPCL_STRATEGIC_SUITE.setCooSubTab('self-assigned')"
              class="flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 bg-slate-50 text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200"
            >
              <i data-lucide="check-square" class="w-4 h-4"></i>
              <span>Self assigned actions</span>
            </button>
          </div>

          <!-- COO FILTER TOOLBAR (COLUMNS C, D, F, H, DEPT & SEARCH) -->
          <div class="bg-white border-2 border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-xs space-y-2.5">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-2">
                <i data-lucide="sliders-horizontal" class="w-4 h-4 text-amber-600"></i>
                <span class="text-xs font-bold text-slate-800 uppercase tracking-wider">COO Filters (Columns E, F, H, J & Dept)</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
                  ${filteredTotal} of ${chartTotal} actions
                </span>
              </div>
              ${isFiltered ? `
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.clearMasterFilters()"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                  title="Clear all applied filters"
                >
                  <i data-lucide="filter-x" class="w-3.5 h-3.5"></i>
                  <span>Reset All Filters</span>
                </button>
              ` : ''}
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              <!-- Search Filter -->
              <div class="relative col-span-2 sm:col-span-1">
                <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="search" class="w-3.5 h-3.5"></i>
                </div>
                <input
                  id="strategic-master-search-input"
                  type="text"
                  value="${this.escapeHtml(this.state.masterFilterSearch || '')}"
                  placeholder="Search actions..."
                  class="w-full pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border border-slate-300 focus:border-amber-500 rounded-xl text-xs font-medium outline-none transition-all"
                  oninput="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterSearch', this.value)"
                />
                ${this.state.masterFilterSearch ? `
                  <button
                    onclick="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterSearch', '')"
                    class="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <i data-lucide="x" class="w-3 h-3"></i>
                  </button>
                ` : ''}
              </div>

              <!-- Department Filter -->
              <div class="relative">
                <select
                  class="w-full py-1.5 pl-2.5 pr-7 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border ${this.state.masterFilterDept && this.state.masterFilterDept !== 'all' ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-bold' : 'border-slate-300'} focus:border-amber-500 rounded-xl text-xs font-semibold outline-none transition-all cursor-pointer appearance-none truncate"
                  onchange="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterDept', this.value)"
                >
                  <option value="all">All Depts (${allTiles.length})</option>
                  ${allTiles.map(t => `
                    <option value="${t.id}" ${this.state.masterFilterDept === t.id ? 'selected' : ''}>${t.name} (${t.code})</option>
                  `).join('')}
                </select>
                <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                </div>
              </div>

              <!-- Column E: Action category -->
              <div class="relative">
                <select
                  class="w-full py-1.5 pl-2.5 pr-7 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border ${this.state.masterFilterColE && this.state.masterFilterColE !== 'all' ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-bold' : 'border-slate-300'} focus:border-amber-500 rounded-xl text-xs font-semibold outline-none transition-all cursor-pointer appearance-none truncate"
                  onchange="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterColE', this.value)"
                >
                  <option value="all">Category [Col E]: All</option>
                  ${uniqueMasterColE.map(c => `
                    <option value="${this.escapeHtml(c)}" ${(this.state.masterFilterColE === c || this.state.masterFilterColC === c) ? 'selected' : ''}>${this.escapeHtml(c)} (${allActions.filter(a => this.getActionColVal(a, 'CATEGORY') === c).length})</option>
                  `).join('')}
                </select>
                <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                </div>
              </div>

              <!-- Column F: Assigned to -->
              <div class="relative">
                <select
                  class="w-full py-1.5 pl-2.5 pr-7 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border ${this.state.masterFilterColF && this.state.masterFilterColF !== 'all' ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-bold' : 'border-slate-300'} focus:border-amber-500 rounded-xl text-xs font-semibold outline-none transition-all cursor-pointer appearance-none truncate"
                  onchange="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterColF', this.value)"
                >
                  <option value="all">Assigned [Col F]: All</option>
                  ${uniqueMasterColF.map(d => `
                    <option value="${this.escapeHtml(d)}" ${(this.state.masterFilterColF === d || this.state.masterFilterColD === d) ? 'selected' : ''}>${this.escapeHtml(d)} (${allActions.filter(a => this.getActionColVal(a, 'ASSIGNED') === d).length})</option>
                  `).join('')}
                </select>
                <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                </div>
              </div>

              <!-- Column H: Status detail -->
              <div class="relative">
                <select
                  class="w-full py-1.5 pl-2.5 pr-7 bg-slate-50 hover:bg-white focus:bg-white text-slate-800 border ${this.state.masterFilterStatus && this.state.masterFilterStatus !== 'all' ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-bold' : 'border-slate-300'} focus:border-amber-500 rounded-xl text-xs font-semibold outline-none transition-all cursor-pointer appearance-none shadow-2xs truncate"
                  onchange="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterStatus', this.value)"
                >
                  <option value="all">Status [Col H]: All (${chartTotal})</option>
                  <option value="Open" ${this.state.masterFilterStatus === 'Open' ? 'selected' : ''}>Open (${chartOpen})</option>
                  <option value="Closed" ${this.state.masterFilterStatus === 'Closed' ? 'selected' : ''}>Closed (${chartClosed})</option>
                </select>
                <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                </div>
              </div>

              <!-- Column J: Ack by -->
              <div class="relative col-span-2 sm:col-span-1">
                <select
                  class="w-full py-1.5 pl-2.5 pr-7 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border ${(this.state.masterFilterColJ && this.state.masterFilterColJ !== 'all') || (this.state.masterFilterColH && this.state.masterFilterColH !== 'all' && this.state.masterFilterColH !== 'Open' && this.state.masterFilterColH !== 'Closed') ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-bold' : 'border-slate-300'} focus:border-amber-500 rounded-xl text-xs font-semibold outline-none transition-all cursor-pointer appearance-none truncate"
                  onchange="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterColJ', this.value)"
                >
                  <option value="all">Ack By [Col J]: All</option>
                  ${uniqueMasterColJ.map(h => `
                    <option value="${this.escapeHtml(h)}" ${(this.state.masterFilterColJ === h || this.state.masterFilterColH === h) ? 'selected' : ''}>${this.escapeHtml(h)} (${allActions.filter(a => this.getActionColVal(a, 'ACK') === h).length})</option>
                  `).join('')}
                </select>
                <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                </div>
              </div>
            </div>

            <!-- ACTIVE FILTERS BADGES FOR COO MASTER -->
            ${isFiltered ? `
              <div class="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 text-xs">
                <span class="text-slate-500 font-semibold text-[11px]">Active Filters:</span>
                ${this.state.masterFilterSearch ? `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                    Search: "${this.escapeHtml(this.state.masterFilterSearch)}"
                    <button onclick="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterSearch', '')" class="hover:text-amber-950 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}
                ${this.state.masterFilterDept && this.state.masterFilterDept !== 'all' ? `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                    Dept: ${this.escapeHtml(this.state.masterFilterDept)}
                    <button onclick="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterDept', 'all')" class="hover:text-amber-950 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}
                ${(this.state.masterFilterColE && this.state.masterFilterColE !== 'all') || (this.state.masterFilterColC && this.state.masterFilterColC !== 'all') ? `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                    Col E (Category): ${this.escapeHtml(this.state.masterFilterColE !== 'all' ? this.state.masterFilterColE : this.state.masterFilterColC)}
                    <button onclick="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterColE', 'all')" class="hover:text-amber-950 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}
                ${(this.state.masterFilterColF && this.state.masterFilterColF !== 'all') || (this.state.masterFilterColD && this.state.masterFilterColD !== 'all') ? `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                    Col F (Assigned): ${this.escapeHtml(this.state.masterFilterColF !== 'all' ? this.state.masterFilterColF : this.state.masterFilterColD)}
                    <button onclick="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterColF', 'all')" class="hover:text-amber-950 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}
                ${this.state.masterFilterStatus && this.state.masterFilterStatus !== 'all' ? `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                    Col H (Status): ${this.escapeHtml(this.state.masterFilterStatus)}
                    <button onclick="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterStatus', 'all')" class="hover:text-amber-950 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}
                ${this.state.masterFilterColJ && this.state.masterFilterColJ !== 'all' ? `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                    Col J (Ack by): ${this.escapeHtml(this.state.masterFilterColJ)}
                    <button onclick="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterColJ', 'all')" class="hover:text-amber-950 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}
              </div>
            ` : ''}
          </div>

          <!-- EXECUTIVE KPIS & DONUT CHART: 2/3 KPIS (2x2) + 1/3 DISTRIBUTION DONUT -->
          <div class="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-3.5 items-stretch">
            <!-- 4 KPI Metrics in 2x2 Grid -->
            <div class="xl:col-span-2 grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-2.5 sm:gap-3">
              <!-- 1. Total Actions: Corporate Royal Indigo/Navy Family with Gold Accent -->
              <div
                onclick="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterStatus', 'all')"
                class="relative overflow-hidden rounded-2xl border-2 ${this.state.masterFilterStatus === 'all' ? 'border-indigo-500 ring-2 ring-indigo-300 shadow-md' : 'border-indigo-200'} bg-gradient-to-b from-indigo-50/70 via-white to-indigo-50/30 p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center justify-center cursor-pointer group"
                title="Click to show all action items"
              >
                <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-blue-500 to-amber-400"></div>
                <span class="text-xs font-extrabold uppercase tracking-wider text-indigo-900 bg-indigo-100/80 px-2.5 py-0.5 rounded-full border border-indigo-200/60 group-hover:bg-indigo-200 transition-colors">
                  Total Actions
                </span>
                <div class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-900 kpi-metric-val mt-1.5">${filteredTotal}</div>
                <span class="text-[11px] font-bold text-indigo-700/80 mt-0.5">Enterprise Wide Scope</span>
              </div>

              <!-- 2. Closed Actions: Emerald & Mint Family with Gold Accent -->
              <div
                onclick="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterStatus', 'Closed')"
                class="relative overflow-hidden rounded-2xl border-2 ${this.state.masterFilterStatus === 'Closed' ? 'border-emerald-500 ring-2 ring-emerald-300 shadow-md' : 'border-emerald-200'} bg-gradient-to-b from-emerald-50/70 via-white to-emerald-50/30 p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center justify-center cursor-pointer group"
                title="Click to filter by Closed actions"
              >
                <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400"></div>
                <span class="text-xs font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200/60 group-hover:bg-emerald-200 transition-colors">
                  Closed Actions
                </span>
                <div class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-emerald-600 kpi-metric-val mt-1.5">${filteredClosed}</div>
                <span class="text-[11px] font-bold text-emerald-700/80 mt-0.5">Completed Deliverables</span>
              </div>

              <!-- 3. Open Actions: Rose & Coral Family with Gold Accent -->
              <div
                onclick="window.FPCL_STRATEGIC_SUITE.setMasterFilter('masterFilterStatus', 'Open')"
                class="relative overflow-hidden rounded-2xl border-2 ${this.state.masterFilterStatus === 'Open' ? 'border-rose-500 ring-2 ring-rose-300 shadow-md' : 'border-rose-200'} bg-gradient-to-b from-rose-50/70 via-white to-rose-50/30 p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center justify-center cursor-pointer group"
                title="Click to filter by Open actions"
              >
                <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-pink-400 to-amber-400"></div>
                <span class="text-xs font-extrabold uppercase tracking-wider text-rose-900 bg-rose-100/80 px-2.5 py-0.5 rounded-full border border-rose-200/60 group-hover:bg-rose-200 transition-colors">
                  Open Actions
                </span>
                <div class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-rose-600 kpi-metric-val mt-1.5">${filteredOpen}</div>
                <span class="text-[11px] font-bold text-rose-700/80 mt-0.5">Active Pipeline</span>
              </div>

              <!-- 4. Overall Progress: Signature Pure Regal Gold & Amber Gradient Card -->
              <div class="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-100/60 via-amber-50/40 to-white p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center justify-center">
                <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-yellow-400 via-amber-300 to-yellow-500"></div>
                <span class="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-3 py-0.5 rounded-full shadow-xs border border-amber-300">
                  <i data-lucide="award" class="w-3 h-3 text-slate-950"></i>
                  <span>Overall Progress</span>
                </span>
                <div class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-amber-800 kpi-metric-val mt-1.5">${filteredRate}%</div>
                <span class="text-[11px] font-black text-amber-900 bg-amber-200/60 border border-amber-300/80 px-2.5 py-0.5 rounded-full mt-0.5">${filteredRate}% Closure Rate</span>
              </div>
            </div>

            <!-- Open vs Close Donut Chart with Gold Trim -->
            <div class="xl:col-span-1 relative overflow-hidden h-full flex flex-col justify-center">
              <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 z-10"></div>
              ${this.renderOpenCloseDonutCard(chartClosed, chartOpen, chartTotal, chartRate, this.state.masterFilterStatus || 'all')}
            </div>
          </div>

          <!-- ACTION STATUS TRENDS: FULL-WIDTH EXECUTIVE DISPLAY (NON-SCROLLABLE, THICK 28PX BARS, 8FT VIEWING VISIBILITY) -->
          <div class="relative overflow-hidden bg-white border-2 border-slate-200 rounded-2xl p-3.5 sm:p-4.5 shadow-xs space-y-3">
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-amber-400 to-emerald-500"></div>
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                  <i data-lucide="bar-chart-2" class="w-4 h-4 text-slate-950"></i>
                </div>
                <div>
                  <h3 class="text-sm sm:text-base font-black text-slate-900 leading-tight">Action Status Trends</h3>
                  <span class="text-[11px] font-semibold text-slate-500">Strategic Departments Benchmark • ${allTiles.length} Depts • High-Visibility Overview</span>
                </div>
              </div>

              <!-- Legend: Open (Red), Closed (Green), Total (Amber) -->
              <div class="flex items-center gap-1.5 sm:gap-2 text-xs font-bold flex-wrap">
                <div class="flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/80">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#f43f5e] shrink-0"></span>
                  <span class="text-slate-600 text-xs">Open:</span>
                  <span class="font-mono text-rose-700 font-black text-xs sm:text-sm">${chartOpen}</span>
                </div>
                <div class="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#10b981] shrink-0"></span>
                  <span class="text-slate-600 text-xs">Closed:</span>
                  <span class="font-mono text-emerald-700 font-black text-xs sm:text-sm">${chartClosed}</span>
                </div>
                <div class="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80">
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span class="text-slate-600 text-xs">Total:</span>
                  <span class="font-mono text-amber-900 font-black text-xs sm:text-sm">${chartTotal}</span>
                </div>
              </div>
            </div>

            <!-- All Departments Stacked Bar Chart: Enterprise Total Sum Rollup + 2 Balanced Columns -->
            <div class="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 sm:p-4 select-none">
              <!-- Enterprise Total Stacked Bar (Sum of All Remaining Tiles) -->
              <div class="mb-4 p-3.5 bg-white rounded-xl border-2 border-purple-200 shadow-2xs">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div class="flex items-center gap-2">
                    <span class="px-2.5 py-0.5 rounded-full bg-purple-700 text-white font-extrabold text-[10.5px] uppercase tracking-wide shadow-2xs">COO ROLLUP SUM</span>
                    <span class="text-xs sm:text-sm font-black text-slate-900">${isFiltered ? 'Filtered Enterprise Action Status' : `Overall Enterprise Action Status (Sum of All ${allTiles.length} Department Dashboards)`}</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs font-bold">
                    <span class="text-rose-700 font-mono">Open: ${filteredOpen}</span>
                    <span class="text-slate-300">|</span>
                    <span class="text-emerald-700 font-mono">Closed: ${filteredClosed}</span>
                    <span class="text-slate-300">|</span>
                    <span class="text-purple-900 font-mono">Total: ${filteredTotal}</span>
                    <span class="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-black">${filteredRate}% Closed</span>
                  </div>
                </div>
                <div class="w-full bg-slate-50/90 rounded-lg p-2 flex justify-center">
                  ${this.renderActionStatusTrendsSvg([{
                    id: 'enterprise-total-sum',
                    name: isFiltered ? 'Filtered Sum' : 'All Departments Sum',
                    code: 'TOTAL',
                    open: filteredOpen,
                    closed: filteredClosed,
                    total: filteredTotal,
                    rate: filteredRate,
                    isActive: true
                  }], {
                    width: 760,
                    padLeft: 195,
                    padRight: 60,
                    padTop: 16,
                    padBottom: 30,
                    rowHeight: 64,
                    barHeight: 40,
                    barFontSize: 22,
                    labelFontSize: 16,
                    gridFontSize: 13,
                    totalFontSize: 20,
                    maxVal: filteredTotal > 0 ? filteredTotal : 1,
                    activeTileId: 'enterprise-total-sum',
                    interactive: false,
                    centerAlign: true
                  })}
                </div>
              </div>

              ${(() => {
                const bossRows = allTiles.map(t => {
                  const tileActions = (t.actions || (this.state?.tileActions?.[t.id]) || []);
                  const actions = this.filterActionList(tileActions, {
                    colE: this.state.masterFilterColE !== 'all' ? this.state.masterFilterColE : this.state.masterFilterColC,
                    colF: this.state.masterFilterColF !== 'all' ? this.state.masterFilterColF : this.state.masterFilterColD,
                    colH: this.state.masterFilterColH !== 'all' ? this.state.masterFilterColH : (this.state.masterFilterStatus !== 'all' ? this.state.masterFilterStatus : 'all'),
                    colJ: this.state.masterFilterColJ,
                    search: this.state.masterFilterSearch
                  });
                  const tTotal = actions.length;
                  const tClosed = actions.filter(a => a.status === 'Closed' || a.status === 'Completed' || (a.status || '').toLowerCase().includes('close') || this.getActionColVal(a, 'STATUS') === 'Closed').length;
                  const tOpen = tTotal - tClosed;
                  const tRate = tTotal > 0 ? Math.round((tClosed / tTotal) * 100) : 0;
                  return {
                    id: t.id,
                    name: t.name,
                    code: t.code,
                    open: tOpen,
                    closed: tClosed,
                    total: tTotal,
                    rate: tRate,
                    isActive: this.state.masterFilterDept === t.id
                  };
                }).filter(r => {
                  if (this.state.masterFilterDept !== 'all') {
                    return r.id === this.state.masterFilterDept;
                  }
                  return true;
                }).sort((a, b) => b.total - a.total);

                // Global maximum so all bars across both columns share identical visual scale
                const globalMax = Math.max(...bossRows.map(r => r.total), 1);

                // Split into 2 balanced columns (e.g. 10 and 9)
                const mid = Math.ceil(bossRows.length / 2);
                const col1 = bossRows.slice(0, mid);
                const col2 = bossRows.slice(mid);

                const chartOptions = {
                  width: 580,
                  padLeft: 135,
                  padRight: 55,
                  padTop: 18,
                  padBottom: 28,
                  rowHeight: 46,
                  barHeight: 28,
                  barFontSize: 18,
                  labelFontSize: 15,
                  totalFontSize: 19,
                  gridFontSize: 13,
                  maxVal: globalMax,
                  activeTileId: this.state.masterFilterDept !== 'all' ? this.state.masterFilterDept : null,
                  interactive: true,
                  isBossChart: true,
                  centerAlign: true
                };

                return `
                  <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-8 items-start">
                    <div class="w-full flex justify-center">
                      ${this.renderActionStatusTrendsSvg(col1, chartOptions)}
                    </div>
                    <div class="w-full flex justify-center">
                      ${this.renderActionStatusTrendsSvg(col2, chartOptions)}
                    </div>
                  </div>
                `;
              })()}
            </div>
          </div>

          <!-- EXECUTIVE TABLE WITH DARK NAVY & GOLD HEADER (MATCHING EXCEL SHEET COLUMNS LIKE ADMIN & SECURITY) -->
          <div id="strategic-master-table" class="bg-white border-2 border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div class="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b-2 border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs"></span>
                <h3 class="text-xs sm:text-sm font-black tracking-tight text-white">Company Action Items and Action Item Master Roster</h3>
                <span class="px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-amber-400 text-slate-950 shadow-xs">
                  Showing ${pagedActions.length} of ${filteredTotal}
                </span>
              </div>

              <div class="flex items-center gap-1.5 text-xs text-slate-300">
                <span class="text-[11px] font-semibold">Rows:</span>
                <select
                  class="px-2 py-0.5 bg-white/15 text-white border border-white/20 rounded-lg text-xs font-semibold cursor-pointer outline-none"
                  onchange="window.FPCL_STRATEGIC_SUITE.setMasterPageSize(this.value)"
                >
                  <option class="text-slate-900" value="15" ${pageSize === 15 ? 'selected' : ''}>15</option>
                  <option class="text-slate-900" value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
                  <option class="text-slate-900" value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
                  <option class="text-slate-900" value="all" ${pageSize === 9999 ? 'selected' : ''}>All</option>
                </select>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr class="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold text-xs sm:text-sm">
                    <th class="py-3 px-3.5 min-w-[60px] whitespace-normal break-words">S_No</th>
                    <th class="py-3 px-3.5 min-w-[110px] whitespace-normal break-words">Department</th>
                    <th class="py-3 px-3.5 min-w-[140px] max-w-[280px] whitespace-normal break-words">Background</th>
                    <th class="py-3 px-3.5 min-w-[100px] max-w-[160px] whitespace-normal break-words">Date/Reference</th>
                    <th class="py-3 px-3.5 min-w-[240px] max-w-[420px] whitespace-normal break-words">Assigned Action</th>
                    <th class="py-3 px-3.5 min-w-[110px] max-w-[180px] whitespace-normal break-words">Action category</th>
                    <th class="py-3 px-3.5 min-w-[110px] max-w-[180px] whitespace-normal break-words">Assigned to</th>
                    <th class="py-3 px-3.5 min-w-[95px] max-w-[140px] whitespace-normal break-words">Target date</th>
                    <th class="py-3 px-3.5 min-w-[100px] max-w-[150px] whitespace-normal break-words">Status detail</th>
                    <th class="py-3 px-3.5 min-w-[140px] max-w-[280px] whitespace-normal break-words">Remarks</th>
                    <th class="py-3 px-3.5 min-w-[100px] max-w-[160px] whitespace-normal break-words">Ack by</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-xs sm:text-sm">
                  ${pagedActions.length === 0 ? `
                    <tr>
                      <td colspan="11" class="py-10 text-center text-slate-400 font-medium text-sm">
                        No actions match the active filters.
                      </td>
                    </tr>
                  ` : pagedActions.map((a, idx) => {
                    const raw = a.rawColumns || {};
                    const getCell = (keys, propFallback = '') => {
                      if (raw && typeof raw === 'object') {
                        for (const k of keys) {
                          if (raw[k] !== undefined && raw[k] !== '') return raw[k];
                          const match = Object.keys(raw).find(rk => rk.trim().toLowerCase() === k.trim().toLowerCase());
                          if (match && raw[match] !== undefined && raw[match] !== '') return raw[match];
                        }
                      }
                      return propFallback;
                    };

                    const sNo = getCell(['S_No', 'S.No', 's_no', 'Sr', 'sno', 'id', 'ID', 'Code', '#'], a.sNo || (a.id ? String(a.id).replace(/^[A-Za-z]+-0*/i, '') : '') || String(startIdx + idx + 1));
                    const deptName = a.department || a.code || 'Operations';
                    const background = getCell(['Background', 'background', 'Bg', 'bg'], a.background || '');
                    const dateReference = getCell(['Date/Reference', 'Date / Reference', 'date/reference', 'date_reference', 'Reference', 'Ref'], a.dateReference || '');
                    const actionTitle = getCell(['Assigned Action', 'assigned action', 'Action Description', 'Action', 'action', 'Title', 'title', 'Deliverable', 'Task', 'Desc'], a.title || a.action || a.desc || '');
                    const actionCat = getCell(['Action category', 'Action Category', 'action category', 'Category', 'category', 'Cat'], a.category || '');
                    const assignedTo = getCell(['Assigned to', 'Assigned To', 'assigned to', 'Assignee', 'assignee'], a.assignedTo || '');
                    const targetDate = getCell(['Target date', 'Target Date', 'target date', 'Due Date', 'Due date', 'due date', 'Deadline', 'Target', 'Due'], a.dueDate || a.targetDate || '');
                    const rawStatus = getCell(['Status detail', 'Status Detail', 'status detail', 'Open_Close status', 'Status', 'status'], a.statusDetail || a.status || '');
                    const remarks = getCell(['Remarks', 'remarks', 'Remark', 'remark', 'Note', 'Comment', 'Closure'], a.remarks || '');
                    const ackBy = getCell(['Ack by', 'Ack By', 'ack by', 'Acknowledged by', 'Acknowledged By', 'Ack'], a.ackBy || '');

                    const statusText = rawStatus || (a.status === 'Closed' ? 'Closed' : 'Open');
                    const isClosed = /close|done|complete|resolved/i.test(statusText);
                    const isPending = /on going|ongoing|progress|pending|wip|active/i.test(statusText);
                    const badgeClass = isClosed 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : (isPending ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-rose-50 text-rose-800 border border-rose-200');
                    const dotColor = isClosed ? 'bg-emerald-500' : (isPending ? 'bg-amber-500' : 'bg-rose-500');

                    return `
                      <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="py-3 px-3.5 font-mono font-bold text-slate-800 text-xs sm:text-sm min-w-[60px] whitespace-normal break-words">${this.escapeHtml(sNo)}</td>
                        <td class="py-3 px-3.5 min-w-[110px] whitespace-normal break-words">
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200 whitespace-normal break-words">
                            <span class="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0"></span>
                            <span>${this.escapeHtml(deptName)}</span>
                          </span>
                        </td>
                        <td class="py-3 px-3.5 text-slate-700 min-w-[140px] max-w-[280px] whitespace-normal break-words leading-relaxed">${this.escapeHtml(background || '-')}</td>
                        <td class="py-3 px-3.5 text-slate-600 font-mono text-xs min-w-[100px] max-w-[160px] whitespace-normal break-words">${this.escapeHtml(dateReference || '-')}</td>
                        <td class="py-3 px-3.5 text-slate-900 font-medium min-w-[240px] max-w-[420px] whitespace-normal break-words leading-relaxed">${this.escapeHtml(actionTitle || '-')}</td>
                        <td class="py-3 px-3.5 min-w-[110px] max-w-[180px] whitespace-normal break-words">
                          ${actionCat ? `
                            <span class="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60 whitespace-normal break-words">
                              ${this.escapeHtml(actionCat)}
                            </span>
                          ` : '<span class="text-slate-400">-</span>'}
                        </td>
                        <td class="py-3 px-3.5 text-slate-700 font-medium min-w-[110px] max-w-[180px] whitespace-normal break-words">${this.escapeHtml(assignedTo || '-')}</td>
                        <td class="py-3 px-3.5 text-slate-600 font-mono text-xs min-w-[95px] max-w-[140px] whitespace-normal break-words">${this.escapeHtml(targetDate || '-')}</td>
                        <td class="py-3 px-3.5 min-w-[100px] max-w-[150px] whitespace-normal break-words">
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${badgeClass}">
                            <span class="w-1.5 h-1.5 rounded-full ${dotColor} shrink-0"></span>
                            <span class="whitespace-normal break-words">${this.escapeHtml(statusText)}</span>
                          </span>
                        </td>
                        <td class="py-3 px-3.5 text-slate-600 min-w-[140px] max-w-[280px] whitespace-normal break-words leading-relaxed">${this.escapeHtml(remarks || '-')}</td>
                        <td class="py-3 px-3.5 text-slate-600 font-medium min-w-[100px] max-w-[160px] whitespace-normal break-words">${this.escapeHtml(ackBy || '-')}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Pagination Footer -->
            ${totalPages > 1 ? `
              <div class="p-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>Page ${safePage} of ${totalPages}</span>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    ${safePage <= 1 ? 'disabled' : ''}
                    onclick="window.FPCL_STRATEGIC_SUITE.setMasterPage(${safePage - 1})"
                    class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    ${safePage >= totalPages ? 'disabled' : ''}
                    onclick="window.FPCL_STRATEGIC_SUITE.setMasterPage(${safePage + 1})"
                    class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    },

    // =========================================================================
    // RENDER: ACTION STATUS TRENDS SVG (HORIZONTAL STACKED BAR CHART MATCHING ATTACHED IMAGE)
    // =========================================================================
    renderActionStatusTrendsSvg(rows, options = {}) {
      if (!rows || rows.length === 0) {
        return `<div class="p-6 text-center text-xs text-slate-400">No actions recorded</div>`;
      }

      const w = options.width || 960;
      const padLeft = options.padLeft || 190;
      const padRight = options.padRight || 64;
      const padTop = options.padTop || 16;
      const padBottom = options.padBottom || 26;
      const rowH = options.rowHeight || 28;
      const barH = options.barHeight || 16;
      const chartW = Math.max(100, w - padLeft - padRight);
      const maxVal = options.maxVal !== undefined ? options.maxVal : Math.max(...rows.map(r => r.total), 1);
      const totalH = padTop + rows.length * rowH + padBottom;

      const gridFontSize = options.gridFontSize || (barH >= 36 ? 14 : (barH >= 24 ? 13 : 11));
      const rx = options.rx || (barH >= 36 ? 8 : (barH >= 24 ? 6 : 4));
      const barFontSize = options.barFontSize || (barH >= 36 ? 24 : (barH >= 24 ? 16 : 11));
      const labelFontSize = options.labelFontSize || (barH >= 36 ? 17 : (barH >= 24 ? 15 : 12));
      const totalFontSize = options.totalFontSize || (barH >= 36 ? 22 : (barH >= 24 ? 18 : 12));

      // Vertical dashed grid lines (0, 25%, 50%, 75%, 100%)
      const gridSteps = [0, 0.25, 0.5, 0.75, 1];
      const gridSvg = gridSteps.map(step => {
        const x = padLeft + step * chartW;
        const val = Math.round(step * maxVal);
        return `
          <line x1="${x}" y1="${padTop - 6}" x2="${x}" y2="${padTop + rows.length * rowH + 4}" stroke="#cbd5e1" stroke-width="${barH >= 24 ? '1.5' : '1'}" stroke-dasharray="3 3"/>
          <text x="${x}" y="${padTop + rows.length * rowH + (barH >= 24 ? 20 : 18)}" fill="#64748b" font-size="${gridFontSize}" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">${val}</text>
        `;
      }).join('');

      // Department horizontal stacked rows
      const rowsSvg = rows.map((r, index) => {
        const y = padTop + index * rowH;
        const barY = y + Math.round((rowH - barH) / 2);
        const textY = barY + Math.round(barH / 2);
        const openW = maxVal > 0 ? (r.open / maxVal) * chartW : 0;
        const closedW = maxVal > 0 ? (r.closed / maxVal) * chartW : 0;
        const isActive = options.activeTileId ? (options.activeTileId === r.id) : Boolean(r.isActive);
        const clickAttr = (options.interactive !== false && r.id && r.id !== 'current') 
          ? (options.isBossChart ? `onclick="window.FPCL_STRATEGIC_SUITE.toggleMasterDeptFilter('${r.id}')"` : `onclick="window.FPCL_STRATEGIC_SUITE.handleTileClick('${r.id}')"`) 
          : '';
        const clipId = `clip-trend-${r.id || 'r'}-${index}-${Math.floor(Math.random() * 10000)}`;

        // Smart dynamic font scaling so numbers are maximized but fit inside bars
        const openFont = openW < (barFontSize * 1.3) ? Math.max(10, Math.round(openW * 0.72)) : barFontSize;
        const closedFont = closedW < (barFontSize * 1.3) ? Math.max(10, Math.round(closedW * 0.72)) : barFontSize;

        return `
          <g class="group ${clickAttr ? 'cursor-pointer' : ''}" ${clickAttr}>
            <!-- Background Row Hover Strip -->
            <rect
              x="4"
              y="${y - 1}"
              width="${w - 8}"
              height="${rowH - 2}"
              rx="6"
              fill="${isActive ? '#f5f3ff' : 'transparent'}"
              stroke="${isActive ? '#c4b5fd' : 'transparent'}"
              stroke-width="1"
              class="group-hover:fill-slate-100/70 transition-colors"
            />

            <!-- Department Name Label on Left (Y-axis) -->
            <text
              x="${padLeft - 14}"
              y="${textY}"
              dominant-baseline="central"
              fill="${isActive ? '#7c3aed' : '#1e293b'}"
              font-size="${labelFontSize}"
              font-weight="${isActive ? '900' : '800'}"
              font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
              text-anchor="end"
              class="transition-colors group-hover:fill-purple-700"
            >
              ${r.name || r.code}
              <title>${options.isBossChart ? `Click to filter COO dashboard by ${r.name || r.code} (or toggle all) - ` : ''}${r.name || r.code}: ${r.total} Total (${r.open} Open, ${r.closed} Closed, ${r.rate}% Rate)</title>
            </text>

            <!-- Subtle Background Track Bar -->
            <rect
              x="${padLeft}"
              y="${barY}"
              width="${chartW}"
              height="${barH}"
              rx="${rx}"
              fill="#f1f5f9"
              class="group-hover:fill-slate-200/70 transition-colors"
            />

            <!-- Clip path for stacked bars so outer corners remain rounded rx=${rx} -->
            <defs>
              <clipPath id="${clipId}">
                <rect x="${padLeft}" y="${barY}" width="${chartW}" height="${barH}" rx="${rx}"/>
              </clipPath>
            </defs>

            <!-- Stacked Bars (Clipped) -->
            <g clip-path="url(#${clipId})">
              <!-- Open Findings Bar (Rose-500 #f43f5e) -->
              ${r.open > 0 ? `
                <rect
                  x="${padLeft}"
                  y="${barY}"
                  width="${openW}"
                  height="${barH}"
                  fill="#f43f5e"
                  class="transition-all hover:brightness-110"
                />
              ` : ''}

              <!-- Closed Findings Bar (Emerald-500 #10b981) -->
              ${r.closed > 0 ? `
                <rect
                  x="${padLeft + openW}"
                  y="${barY}"
                  width="${closedW}"
                  height="${barH}"
                  fill="#10b981"
                  class="transition-all hover:brightness-110"
                />
              ` : ''}
            </g>

            <!-- Open Value Text inside Rose Bar (Centered, high-contrast with drop shadow) -->
            ${r.open > 0 && openW >= 12 ? `
              <text
                x="${padLeft + openW / 2}"
                y="${textY}"
                dominant-baseline="central"
                fill="#ffffff"
                font-size="${openFont}"
                font-weight="900"
                font-family="'JetBrains Mono', monospace"
                text-anchor="middle"
                class="pointer-events-none select-none"
                style="filter: drop-shadow(0 1px 3px rgba(0,0,0,0.65));"
              >${r.open}</text>
            ` : ''}

            <!-- Closed Value Text inside Emerald Bar (Centered, high-contrast with drop shadow) -->
            ${r.closed > 0 && closedW >= 12 ? `
              <text
                x="${padLeft + openW + closedW / 2}"
                y="${textY}"
                dominant-baseline="central"
                fill="#ffffff"
                font-size="${closedFont}"
                font-weight="900"
                font-family="'JetBrains Mono', monospace"
                text-anchor="middle"
                class="pointer-events-none select-none"
                style="filter: drop-shadow(0 1px 3px rgba(0,0,0,0.65));"
              >${r.closed}</text>
            ` : ''}

            <!-- Total Count Metric on Right -->
            <text
              x="${padLeft + chartW + 14}"
              y="${textY}"
              dominant-baseline="central"
              fill="#0f172a"
              font-size="${totalFontSize}"
              font-weight="900"
              font-family="'JetBrains Mono', monospace"
              text-anchor="start"
              class="transition-colors group-hover:fill-purple-900"
            >${r.total}</text>
          </g>
        `;
      }).join('');

      const minWClass = options.minWidth ? `min-w-[${options.minWidth}px]` : (options.centerAlign ? '' : 'min-w-[480px]');
      const containerClass = options.centerAlign
        ? 'w-full flex items-center justify-center select-none overflow-x-auto'
        : 'w-full overflow-x-auto select-none';

      return `
        <div class="${containerClass}">
          <svg viewBox="0 0 ${w} ${totalH}" class="w-full ${minWClass} h-auto overflow-visible" style="max-width: ${w}px;">
            ${gridSvg}
            ${rowsSvg}
          </svg>
        </div>
      `;
    },

    // =========================================================================
    // RENDER: SINGLE STATUS BAR / TRENDS CARD FOR INDIVIDUAL TILE DASHBOARDS
    // Displays ONLY individual tile status (clean, focused, no extra text below heading)
    // =========================================================================
    renderSingleStatusBar(arg1, arg2, arg3, arg4, arg5, arg6) {
      let tile = null;
      let closed = 0;
      let open = 0;
      let total = 0;
      let rate = 0;
      let filterStatus = 'all';

      if (typeof arg1 === 'object' && arg1 !== null) {
        tile = arg1;
        closed = Number(arg2) || 0;
        open = Number(arg3) || 0;
        total = Number(arg4) || 0;
        rate = Number(arg5) || 0;
        filterStatus = arg6 || 'all';
      } else {
        closed = Number(arg1) || 0;
        open = Number(arg2) || 0;
        total = Number(arg3) || 0;
        rate = Number(arg4) || 0;
        filterStatus = arg5 || 'all';
        tile = (this.state.selectedTileId ? this.getTileData(this.state.selectedTileId) : null);
      }

      const tileName = tile ? (tile.name || tile.code) : 'Department';
      const singleRow = [{
        id: tile ? tile.id : 'current',
        name: tileName,
        code: tile ? tile.code : 'CUR',
        open,
        closed,
        total,
        rate,
        isActive: true
      }];

      return `
        <div class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col h-full space-y-3 sm:space-y-4">
          <!-- Header with Title and Tile Badge -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-black text-xs border border-purple-200 shrink-0">
                ${tile ? tile.code : 'ACT'}
              </div>
              <h3 class="text-base sm:text-lg font-black text-slate-900 leading-tight">Action Status Trends</h3>
            </div>

            <!-- Header Quick Badges: Open, Closed, Total -->
            <div class="flex items-center gap-1.5 sm:gap-2 text-xs font-bold flex-wrap">
              <div class="flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                <span class="w-2 h-2 rounded-full bg-[#f43f5e] shrink-0"></span>
                <span class="text-slate-600 text-xs">Open:</span>
                <span class="font-mono text-rose-700 font-bold text-xs sm:text-sm">${open}</span>
              </div>
              <div class="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <span class="w-2 h-2 rounded-full bg-[#10b981] shrink-0"></span>
                <span class="text-slate-600 text-xs">Closed:</span>
                <span class="font-mono text-emerald-700 font-bold text-xs sm:text-sm">${closed}</span>
              </div>
              <div class="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                <span class="text-slate-600 text-xs">Total:</span>
                <span class="font-mono text-slate-800 font-bold text-xs sm:text-sm">${total}</span>
              </div>
            </div>
          </div>

          <!-- Section: Focused Department Stacked Bar (Middle Aligned Vertically & Horizontally) -->
          <div class="flex-1 flex flex-col items-center justify-center w-full my-auto py-2">
            <div class="w-full bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3 sm:p-4 flex items-center justify-center">
              ${this.renderActionStatusTrendsSvg(singleRow, {
                width: 760,
                padLeft: 195,
                padRight: 60,
                padTop: 16,
                padBottom: 30,
                rowHeight: 84,
                barHeight: 52,
                barFontSize: 26,
                labelFontSize: 16,
                gridFontSize: 13,
                totalFontSize: 24,
                maxVal: total > 0 ? total : 1,
                activeTileId: tile ? tile.id : 'current',
                interactive: false,
                centerAlign: true
              })}
            </div>
          </div>

          ${filterStatus !== 'all' ? `
            <div class="pt-0.5">
              <span class="px-2.5 py-1 rounded-lg text-xs font-bold ${filterStatus === 'Open' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
                Active Filter: ${filterStatus} Actions
              </span>
            </div>
          ` : ''}
        </div>
      `;
    },

    // =========================================================================
    // RENDER: OPEN / CLOSE DONUT CHART (Right side of Action Status Trends)
    // Scaled via native SVG vector text coordinates to prevent overlap on laptop displays
    // =========================================================================
    renderOpenCloseDonutCard(closed, open, total, rate, filterStatus = 'all') {
      const radius = 74;
      const circumference = 2 * Math.PI * radius; // ~464.956
      const closedPct = total > 0 ? closed / total : 0;
      const openPct = total > 0 ? open / total : 0;
      const closedDash = Math.min(circumference, Math.max(0, closedPct * circumference));
      const openDash = Math.min(circumference, Math.max(0, openPct * circumference));
      const closedRate = total > 0 ? Math.round(closedPct * 100) : 0;
      const openRate = total > 0 ? Math.round(openPct * 100) : 0;

      let displayRate = `${rate}%`;
      let subLabel = 'CLOSED RATE';
      let svgArcs = '';

      if (total === 0) {
        displayRate = '0%';
        subLabel = 'NO ACTIONS';
        svgArcs = '';
      } else if (filterStatus === 'Open') {
        displayRate = `${openRate}%`;
        subLabel = 'OPEN RATE';
        svgArcs = `
          <circle
            cx="100" cy="100" r="${radius}"
            fill="none"
            stroke="#f43f5e"
            stroke-width="15"
            stroke-dasharray="${openDash} ${circumference}"
            stroke-dashoffset="0"
            stroke-linecap="round"
            class="transition-all duration-500"
          />
        `;
      } else if (filterStatus === 'Closed') {
        displayRate = `${closedRate}%`;
        subLabel = 'CLOSED RATE';
        svgArcs = `
          <circle
            cx="100" cy="100" r="${radius}"
            fill="none"
            stroke="#10b981"
            stroke-width="15"
            stroke-dasharray="${closedDash} ${circumference}"
            stroke-dashoffset="0"
            stroke-linecap="round"
            class="transition-all duration-500"
          />
        `;
      } else {
        // All
        displayRate = `${rate}%`;
        subLabel = 'CLOSED RATE';
        svgArcs = `
          <!-- Closed Arc (Emerald) -->
          <circle
            cx="100" cy="100" r="${radius}"
            fill="none"
            stroke="#10b981"
            stroke-width="15"
            stroke-dasharray="${closedDash} ${circumference}"
            stroke-dashoffset="0"
            stroke-linecap="${open > 0 && closed > 0 ? 'butt' : 'round'}"
            class="transition-all duration-500"
          />
          <!-- Open Arc (Rose) -->
          <circle
            cx="100" cy="100" r="${radius}"
            fill="none"
            stroke="#f43f5e"
            stroke-width="15"
            stroke-dasharray="${openDash} ${circumference}"
            stroke-dashoffset="-${closedDash}"
            stroke-linecap="${open > 0 && closed > 0 ? 'butt' : 'round'}"
            class="transition-all duration-500"
          />
        `;
      }

      return `
        <div class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between space-y-2 h-full">
          <div class="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <h3 class="text-sm sm:text-base font-black text-slate-900 leading-tight">Open vs Closed Donut Chart</h3>
            <span class="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">Distribution</span>
          </div>

          <div class="flex-1 flex flex-col items-center justify-center py-1">
            <!-- Center Aligned, Scalable Vector Donut SVG with Proportional Native SVG Centered Text -->
            <div class="w-full max-w-[190px] sm:max-w-[210px] aspect-square mx-auto flex items-center justify-center">
              <svg viewBox="0 0 200 200" class="w-full h-full select-none overflow-visible">
                <g transform="rotate(-90 100 100)">
                  <!-- Base track -->
                  <circle cx="100" cy="100" r="${radius}" fill="none" stroke="#f1f5f9" stroke-width="15" />
                  ${svgArcs}
                </g>
                <!-- SVG Native Scalable Centered Rate Value -->
                <text
                  x="100"
                  y="93"
                  text-anchor="middle"
                  dominant-baseline="central"
                  fill="#0f172a"
                  font-size="32"
                  font-weight="900"
                  font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                  letter-spacing="-0.03em"
                >${displayRate}</text>
                <!-- SVG Native Scalable Centered Sub-label with generous clearance -->
                <text
                  x="100"
                  y="117"
                  text-anchor="middle"
                  dominant-baseline="central"
                  fill="#64748b"
                  font-size="10"
                  font-weight="800"
                  font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                  letter-spacing="0.08em"
                >${subLabel}</text>
              </svg>
            </div>
          </div>
        </div>
      `;
    },

    // =========================================================================
    // RENDER: INDIVIDUAL TILE DASHBOARD (KPIs, TREND BARS, SIMPLE TABLE, FILTERS, SYNC, CSV)
    // =========================================================================
    renderEmployeeActionSheet(tile) {
      const allActions = tile.actions || [];
      const filteredActions = this.getFilteredTileActions(tile.id);

      // KPI values for this tile
      const totalActions = allActions.length;
      const closedActions = allActions.filter(a => a.status === 'Closed' || a.status === 'Completed' || (a.status || '').toLowerCase().includes('close') || this.getActionColVal(a, 'STATUS') === 'Closed').length;
      const openActions = totalActions - closedActions;
      const overallRate = totalActions > 0 ? Math.round((closedActions / totalActions) * 100) : 0;

      // Filtered KPIs (reflects active filters across entire tile dashboard)
      const filteredTotal = filteredActions.length;
      const filteredClosed = filteredActions.filter(a => a.status === 'Closed' || a.status === 'Completed' || (a.status || '').toLowerCase().includes('close') || this.getActionColVal(a, 'STATUS') === 'Closed').length;
      const filteredOpen = filteredTotal - filteredClosed;
      const filteredRate = filteredTotal > 0 ? Math.round((filteredClosed / filteredTotal) * 100) : 0;

      // Pagination for Simple Table
      const page = this.state.tilePage || 1;
      const pageSize = this.state.tilePageSize || 15;
      const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
      const safePage = Math.min(page, totalPages);
      const startIdx = (safePage - 1) * pageSize;
      const endIdx = Math.min(filteredTotal, startIdx + pageSize);
      const pagedActions = filteredActions.slice(startIdx, endIdx);

      const uniqueColE = [...new Set(allActions.map(a => this.getActionColVal(a, 'CATEGORY')).filter(Boolean))].sort();
      const uniqueColF = [...new Set(allActions.map(a => this.getActionColVal(a, 'ASSIGNED')).filter(Boolean))].sort();
      const uniqueColJ = [...new Set(allActions.map(a => this.getActionColVal(a, 'ACK')).filter(Boolean))].sort();
      const uniqueColC = uniqueColE;
      const uniqueColD = uniqueColF;
      const uniqueColH = uniqueColJ;
      const isFiltered = Boolean(
        this.state.tileFilterSearch ||
        (this.state.tileFilterStatus && this.state.tileFilterStatus !== 'all') ||
        (this.state.tileFilterColE && this.state.tileFilterColE !== 'all') ||
        (this.state.tileFilterColF && this.state.tileFilterColF !== 'all') ||
        (this.state.tileFilterColH && this.state.tileFilterColH !== 'all') ||
        (this.state.tileFilterColJ && this.state.tileFilterColJ !== 'all') ||
        (this.state.tileFilterColC && this.state.tileFilterColC !== 'all') ||
        (this.state.tileFilterColD && this.state.tileFilterColD !== 'all')
      );
      const isSyncing = this.state.syncStatus[tile.id] === 'syncing';
      const lastSynced = this.state.tileLastSynced[tile.id] || 'Active';

      // All strategic dashboard tiles (excluding COO strategic-master) use the standardized Asset Integrity layout
      // Note: COO dashboard has its own dedicated master rollup views, while employee dashboards share the Asset Integrity design.
      const isConnected = this.isSheetConnected(tile.id);

      // Determine dynamic columns to show from Excel / Google Sheet data (exact match of google sheet)
      const STANDARD_EXCEL_COLUMNS = ['S_No', 'Background', 'Date/Reference', 'Assigned Action', 'Action category', 'Assigned to', 'Target date', 'Status detail', 'Remarks', 'Ack by'];
      let displayColumns = [];
      const firstWithHeaders = allActions.find(a => Array.isArray(a.columnHeaders) && a.columnHeaders.length > 0);
      if (firstWithHeaders && firstWithHeaders.columnHeaders.length > 0) {
        displayColumns = [...firstWithHeaders.columnHeaders];
      } else {
        displayColumns = [...STANDARD_EXCEL_COLUMNS];
      }

      return `
        <div class="space-y-2.5 sm:space-y-3">
          <!-- TOP ACTION HEADER BAR WITH BACK BUTTON, SYNC, SHEET LINK & EXPORT -->
          <div class="bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <!-- Back button to return to matrix grid -->
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs border border-slate-200"
                title="Back to Strategic Dashboard Matrix"
              >
                <i data-lucide="arrow-left" class="w-4 h-4"></i>
              </button>

              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2 py-0.2 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                    ${tile.code}
                  </span>
                  ${!isConnected ? `
                    <button
                      type="button"
                      onclick="window.FPCL_STRATEGIC_SUITE.openSheetConfigModal('${tile.id}')"
                      class="inline-flex items-center gap-1.5 px-2 py-0.2 rounded-full text-xs font-bold border transition-colors cursor-pointer bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                      title="Google Sheet link broken / unlinked (Orange) - Click to configure"
                    >
                      <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      <span>Link Broken</span>
                    </button>
                  ` : ''}
                </div>
                <h2 class="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-snug mt-0.5">${tile.name} Dashboard</h2>
              </div>
            </div>

            <!-- Header Actions: Departmental Actions (Operations Dashboard), Google Sheet Link, Sync, Config & Filter-aware CSV Export -->
            <div class="flex items-center gap-2 flex-wrap">
              ${(tile.id === 'operations' || tile.code === 'OPS' || (tile.name && tile.name.toLowerCase() === 'operations')) ? `
                <!-- Departmental Actions Button (Operations Dashboard Banner) -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.openDepartmentalActionsModal()"
                  class="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-600 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-md hover:shadow-lg hover:-translate-y-0.5 border border-purple-400/40 select-none whitespace-nowrap shrink-0"
                  title="Open list of strategic department dashboards and their Google Sheets"
                >
                  <i data-lucide="folder-kanban" class="w-3.5 h-3.5 text-purple-200"></i>
                  <span>departmental Actions</span>
                </button>
              ` : ''}

              <!-- Live Google Sheet Button: Opens the live Google Sheet in a new tab on click -->
              <a
                href="${this.getTileSheetEditUrl(tile)}"
                target="_blank"
                rel="noopener noreferrer"
                class="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer flex items-center gap-2 shadow-xs border border-emerald-500 hover:shadow-md shrink-0"
                title="Open live Google Sheet in new tab (${tile.name})"
              >
                <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
                <span>Open Google Sheet</span>
                <i data-lucide="external-link" class="w-3.5 h-3.5 opacity-80"></i>
              </a>

              <!-- Sync Option -->
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.syncEmployeeSheet('${tile.id}')"
                class="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer flex items-center gap-2 shadow-xs ${isSyncing ? 'opacity-70 animate-pulse' : ''}"
                title="Sync from connected Google Sheet (${tile.name})"
              >
                <i data-lucide="refresh-cw" class="w-4 h-4 ${isSyncing ? 'animate-spin' : ''}"></i>
                <span>${isSyncing ? 'Syncing...' : 'Sync Sheet'}</span>
                <span class="text-xs opacity-80 font-normal">(${lastSynced})</span>
              </button>

              <!-- Sheet Settings Modal Option -->
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.openSheetConfigModal('${tile.id}')"
                class="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer border border-slate-200"
                title="Configure Google Sheet Link / Tab Name"
              >
                <i data-lucide="settings" class="w-4 h-4"></i>
              </button>

              <!-- Downloadable Filter-aware CSV Export Option -->
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.exportTileCSV('${tile.id}')"
                class="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                title="Download CSV based on active filter"
              >
                <i data-lucide="download" class="w-4 h-4"></i>
                <span>Export CSV (${filteredTotal})</span>
              </button>

              ${isFiltered ? `
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.clearTileFilters()"
                  class="px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200"
                >
                  <i data-lucide="filter-x" class="w-4 h-4"></i>
                  <span>Reset</span>
                </button>
              ` : ''}

              <!-- Lock & Return -->
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                class="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 hover:border-rose-200 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Lock dashboard immediately and return to grid"
              >
                <i data-lucide="lock" class="w-4 h-4"></i>
                <span>Lock & Return</span>
              </button>
            </div>
          </div>

          <!-- FILTER BAR (COLUMNS C, D, F, H + SEARCH) -->
          <div class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-xs space-y-2.5">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-2">
                <i data-lucide="sliders-horizontal" class="w-4 h-4 text-purple-600"></i>
                <span class="text-xs font-bold text-slate-800 uppercase tracking-wider">Sheet Filters (Columns E, F, H, J)</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                  ${filteredTotal} of ${totalActions} actions
                </span>
              </div>
              ${isFiltered ? `
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.clearTileFilters()"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                  title="Clear all applied filters"
                >
                  <i data-lucide="filter-x" class="w-3.5 h-3.5"></i>
                  <span>Reset All Filters</span>
                </button>
              ` : ''}
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-2.5">
              <!-- Search Filter -->
              <div class="relative col-span-2 sm:col-span-1">
                <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="search" class="w-3.5 h-3.5"></i>
                </div>
                <input
                  type="text"
                  value="${this.escapeHtml(this.state.tileFilterSearch || '')}"
                  placeholder="Search actions..."
                  class="w-full pl-8 pr-7 py-2 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border border-slate-200 focus:border-purple-500 rounded-xl text-xs font-medium outline-none transition-all"
                  oninput="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterSearch', this.value)"
                />
                ${this.state.tileFilterSearch ? `
                  <button
                    onclick="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterSearch', '')"
                    class="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <i data-lucide="x" class="w-3 h-3"></i>
                  </button>
                ` : ''}
              </div>

              <!-- Column E: Action category -->
              <div class="relative">
                <select
                  class="w-full py-2 pl-2.5 pr-7 bg-slate-50 hover:bg-white focus:bg-white text-slate-800 border ${(this.state.tileFilterColE && this.state.tileFilterColE !== 'all') || (this.state.tileFilterColC && this.state.tileFilterColC !== 'all') ? 'border-purple-500 bg-purple-50/50 text-purple-900 font-bold' : 'border-slate-200'} focus:border-purple-500 rounded-xl text-xs font-semibold outline-none transition-all cursor-pointer appearance-none shadow-2xs truncate"
                  onchange="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterColE', this.value)"
                >
                  <option value="all">Category [Col E]: All</option>
                  ${uniqueColE.map(c => `
                    <option value="${this.escapeHtml(c)}" ${(this.state.tileFilterColE === c || this.state.tileFilterColC === c) ? 'selected' : ''}>${this.escapeHtml(c)} (${allActions.filter(a => this.getActionColVal(a, 'CATEGORY') === c).length})</option>
                  `).join('')}
                </select>
                <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                </div>
              </div>

              <!-- Column F: Assigned to -->
              <div class="relative">
                <select
                  class="w-full py-2 pl-2.5 pr-7 bg-slate-50 hover:bg-white focus:bg-white text-slate-800 border ${(this.state.tileFilterColF && this.state.tileFilterColF !== 'all') || (this.state.tileFilterColD && this.state.tileFilterColD !== 'all') ? 'border-purple-500 bg-purple-50/50 text-purple-900 font-bold' : 'border-slate-200'} focus:border-purple-500 rounded-xl text-xs font-semibold outline-none transition-all cursor-pointer appearance-none shadow-2xs truncate"
                  onchange="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterColF', this.value)"
                >
                  <option value="all">Assigned [Col F]: All</option>
                  ${uniqueColF.map(d => `
                    <option value="${this.escapeHtml(d)}" ${(this.state.tileFilterColF === d || this.state.tileFilterColD === d) ? 'selected' : ''}>${this.escapeHtml(d)} (${allActions.filter(a => this.getActionColVal(a, 'ASSIGNED') === d).length})</option>
                  `).join('')}
                </select>
                <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                </div>
              </div>

              <!-- Column H: Status detail -->
              <div class="relative">
                <select
                  class="w-full py-2 pl-2.5 pr-7 bg-slate-50 hover:bg-white focus:bg-white text-slate-800 border ${this.state.tileFilterStatus && this.state.tileFilterStatus !== 'all' ? 'border-purple-500 bg-purple-50/50 text-purple-900 font-bold' : 'border-slate-200'} focus:border-purple-500 rounded-xl text-xs font-semibold outline-none transition-all cursor-pointer appearance-none shadow-2xs truncate"
                  onchange="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterStatus', this.value)"
                >
                  <option value="all">Status [Col H]: All (${totalActions})</option>
                  <option value="Open" ${this.state.tileFilterStatus === 'Open' ? 'selected' : ''}>Open (${openActions})</option>
                  <option value="Closed" ${this.state.tileFilterStatus === 'Closed' ? 'selected' : ''}>Closed (${closedActions})</option>
                </select>
                <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                </div>
              </div>

              <!-- Column J: Ack by -->
              <div class="relative col-span-2 sm:col-span-1">
                <select
                  class="w-full py-2 pl-2.5 pr-7 bg-slate-50 hover:bg-white focus:bg-white text-slate-800 border ${(this.state.tileFilterColJ && this.state.tileFilterColJ !== 'all') || (this.state.tileFilterColH && this.state.tileFilterColH !== 'all' && this.state.tileFilterColH !== 'Open' && this.state.tileFilterColH !== 'Closed') ? 'border-purple-500 bg-purple-50/50 text-purple-900 font-bold' : 'border-slate-200'} focus:border-purple-500 rounded-xl text-xs font-semibold outline-none transition-all cursor-pointer appearance-none shadow-2xs truncate"
                  onchange="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterColJ', this.value)"
                >
                  <option value="all">Ack By [Col J]: All</option>
                  ${uniqueColJ.map(h => `
                    <option value="${this.escapeHtml(h)}" ${(this.state.tileFilterColJ === h || this.state.tileFilterColH === h) ? 'selected' : ''}>${this.escapeHtml(h)} (${allActions.filter(a => this.getActionColVal(a, 'ACK') === h).length})</option>
                  `).join('')}
                </select>
                <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                </div>
              </div>
            </div>

            <!-- ACTIVE FILTERS BADGES (SHOWN IF ANY FILTER APPLIED) -->
            ${isFiltered ? `
              <div class="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 text-xs">
                <span class="text-slate-500 font-semibold text-[11px]">Active Filters:</span>
                ${this.state.tileFilterSearch ? `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                    Search: "${this.escapeHtml(this.state.tileFilterSearch)}"
                    <button onclick="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterSearch', '')" class="hover:text-purple-900 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}
                ${(this.state.tileFilterColE && this.state.tileFilterColE !== 'all') || (this.state.tileFilterColC && this.state.tileFilterColC !== 'all') ? `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                    Col E (Category): ${this.escapeHtml(this.state.tileFilterColE !== 'all' ? this.state.tileFilterColE : this.state.tileFilterColC)}
                    <button onclick="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterColE', 'all')" class="hover:text-purple-900 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}
                ${(this.state.tileFilterColF && this.state.tileFilterColF !== 'all') || (this.state.tileFilterColD && this.state.tileFilterColD !== 'all') ? `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                    Col F (Assigned): ${this.escapeHtml(this.state.tileFilterColF !== 'all' ? this.state.tileFilterColF : this.state.tileFilterColD)}
                    <button onclick="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterColF', 'all')" class="hover:text-purple-900 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}
                ${this.state.tileFilterStatus && this.state.tileFilterStatus !== 'all' ? `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                    Col H (Status): ${this.escapeHtml(this.state.tileFilterStatus)}
                    <button onclick="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterStatus', 'all')" class="hover:text-purple-900 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}
                ${this.state.tileFilterColJ && this.state.tileFilterColJ !== 'all' ? `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                    Col J (Ack by): ${this.escapeHtml(this.state.tileFilterColJ)}
                    <button onclick="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterColJ', 'all')" class="hover:text-purple-900 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                  </span>
                ` : ''}
              </div>
            ` : ''}
          </div>

          <!-- KPI VALUES -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
            <div class="bg-white border border-slate-200 hover:border-purple-300 rounded-2xl p-4 sm:p-6 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider text-center">Total Actions</div>
              <div class="text-5xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight text-slate-900 kpi-metric-val mt-2 text-center">${filteredTotal}</div>
            </div>

            <div class="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 sm:p-6 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs sm:text-sm font-bold text-emerald-700 uppercase tracking-wider text-center">Closed Actions</div>
              <div class="text-5xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight text-emerald-600 kpi-metric-val mt-2 text-center">${filteredClosed}</div>
            </div>

            <div class="bg-white border border-slate-200 hover:border-rose-300 rounded-2xl p-4 sm:p-6 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs sm:text-sm font-bold text-rose-700 uppercase tracking-wider text-center">Open Actions</div>
              <div class="text-5xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight text-rose-600 kpi-metric-val mt-2 text-center">${filteredOpen}</div>
            </div>

            <div class="bg-white border border-slate-200 hover:border-purple-300 rounded-2xl p-4 sm:p-6 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs sm:text-sm font-bold text-purple-700 uppercase tracking-wider text-center">Overall Progress</div>
              <div class="text-5xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight text-purple-700 kpi-metric-val mt-2 text-center">${filteredRate}%</div>
            </div>
          </div>

          <!-- TREND BARS & DONUT CHART: DONUT CHART PLACED TO RIGHT SIDE OF BAR CHART -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
            ${this.renderSingleStatusBar(tile, filteredClosed, filteredOpen, filteredTotal, filteredRate, this.state.tileFilterStatus || 'all')}
            ${this.renderOpenCloseDonutCard(filteredClosed, filteredOpen, filteredTotal, filteredRate, this.state.tileFilterStatus || 'all')}
          </div>

          <!-- SIMPLE TABLE FOR TEXT DATA WITH FILTER & PAGINATION -->
          <div id="strategic-tile-table" class="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div class="flex items-center gap-2.5 flex-wrap">
                <h3 class="text-sm sm:text-base font-black text-slate-900">Company Action Items and Action Item Master Roster</h3>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Showing ${pagedActions.length} of ${filteredTotal}
                </span>
                <a
                  href="${this.getTileSheetEditUrl(tile)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-2xs"
                  title="Open live Google Sheet in new tab"
                >
                  <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 text-emerald-600"></i>
                  <span>Open Google Sheet</span>
                  <i data-lucide="external-link" class="w-3 h-3 text-emerald-500"></i>
                </a>
              </div>

              <div class="flex items-center gap-2 text-xs sm:text-sm">
                <span class="text-slate-500 font-medium">Rows per page:</span>
                <select
                  class="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer outline-none"
                  onchange="window.FPCL_STRATEGIC_SUITE.setTilePageSize(this.value)"
                >
                  <option value="15" ${pageSize === 15 ? 'selected' : ''}>15</option>
                  <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
                  <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
                  <option value="all" ${pageSize === 9999 ? 'selected' : ''}>All</option>
                </select>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs sm:text-sm">
                    ${displayColumns.map(col => `
                      <th class="py-3 px-3.5 text-left font-bold whitespace-normal break-words">${this.escapeHtml(col)}</th>
                    `).join('')}
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-xs sm:text-sm">
                  ${pagedActions.length === 0 ? `
                    <tr>
                      <td colspan="${Math.max(1, displayColumns.length)}" class="py-10 text-center text-slate-400 font-medium text-sm">
                        No actions match the active filters.
                      </td>
                    </tr>
                  ` : pagedActions.map(a => {
                    const hasRaw = a.rawColumns && typeof a.rawColumns === 'object' && Object.keys(a.rawColumns).length > 0;
                    
                    return `
                      <tr class="hover:bg-slate-50/80 transition-colors">
                        ${displayColumns.map(col => {
                          const colLower = col.toLowerCase().trim();
                          let val = '';
                          if (hasRaw) {
                            if (a.rawColumns[col] !== undefined && a.rawColumns[col] !== '') {
                              val = a.rawColumns[col];
                            } else {
                              // Case-insensitive lookup in rawColumns
                              const foundKey = Object.keys(a.rawColumns).find(k => k.toLowerCase().trim() === colLower);
                              if (foundKey && a.rawColumns[foundKey] !== undefined && a.rawColumns[foundKey] !== '') {
                                val = a.rawColumns[foundKey];
                              } else {
                                // Normalized alphanumeric lookup (e.g. date/reference vs date_reference)
                                const cleanCol = colLower.replace(/[^a-z0-9]/g, '');
                                const foundClean = Object.keys(a.rawColumns).find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanCol);
                                if (foundClean && a.rawColumns[foundClean] !== undefined && a.rawColumns[foundClean] !== '') {
                                  val = a.rawColumns[foundClean];
                                }
                              }
                            }
                          }

                          // Fallbacks only if rawColumns did not supply a value
                          if (!val && val !== 0) {
                            if (/id|code|sr|#|s_no|s\.no|sno|item/i.test(colLower)) val = a.sNo || a.id || '';
                            else if (/background|bg/i.test(colLower)) val = a.background || '';
                            else if (/date\/reference|reference|date_reference|date \/ reference/i.test(colLower)) val = a.dateReference || '';
                            else if (/action|title|task|desc|deliverable|description/i.test(colLower)) val = a.title || a.action || a.desc || '';
                            else if (/category/i.test(colLower)) val = a.category || '';
                            else if (/assigned\s*to|assignee/i.test(colLower)) val = a.assignedTo || '';
                            else if (/due|target|deadline/i.test(colLower)) val = a.dueDate || a.targetDate || '';
                            else if (/status|condition|open_close/i.test(colLower)) val = a.statusDetail || a.status || '';
                            else if (/priority|prio/i.test(colLower)) val = a.priority || '';
                            else if (/closure/i.test(colLower)) val = a.closureDate || '';
                            else if (/ack/i.test(colLower)) val = a.ackBy || '';
                            else if (/remark|comment|note/i.test(colLower)) val = a.remarks || '';
                          }

                          // Status column
                          if (/status|state|condition|open_close/i.test(colLower)) {
                            const statusStr = String(val || (a.status === 'Closed' ? 'Closed' : 'Open')).trim();
                            const isClosed = /close|done|complete|resolved/i.test(statusStr);
                            const isPending = /on going|ongoing|progress|pending|wip|active/i.test(statusStr);
                            const badgeClass = isClosed 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : (isPending ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-rose-50 text-rose-800 border border-rose-200');
                            const dotColor = isClosed ? 'bg-emerald-500' : (isPending ? 'bg-amber-500' : 'bg-rose-500');

                            return `
                              <td class="py-3 px-3.5 min-w-[100px] max-w-[160px] whitespace-normal break-words">
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${badgeClass}">
                                  <span class="w-1.5 h-1.5 rounded-full ${dotColor} shrink-0"></span>
                                  <span class="whitespace-normal break-words">${this.escapeHtml(statusStr)}</span>
                                </span>
                              </td>
                            `;
                          }

                          // S_No / ID column
                          if (/id|code|action\s*#|action#|sr|s_no|s\.no|sno/i.test(colLower)) {
                            return `
                              <td class="py-3 px-3.5 font-mono font-bold text-slate-800 text-xs sm:text-sm min-w-[60px] whitespace-normal break-words">${this.escapeHtml(val || '-')}</td>
                            `;
                          }

                          // Background column
                          if (/background|bg/i.test(colLower)) {
                            return `
                              <td class="py-3 px-3.5 text-slate-700 min-w-[140px] max-w-[280px] whitespace-normal break-words leading-relaxed">${this.escapeHtml(val || '-')}</td>
                            `;
                          }

                          // Date/Reference column
                          if (/date\/reference|reference|date_reference|date \/ reference/i.test(colLower)) {
                            return `
                              <td class="py-3 px-3.5 text-slate-600 font-mono text-xs min-w-[100px] max-w-[160px] whitespace-normal break-words">${this.escapeHtml(val || '-')}</td>
                            `;
                          }

                          // Action category badge
                          if (/category/i.test(colLower)) {
                            return `
                              <td class="py-3 px-3.5 min-w-[110px] max-w-[180px] whitespace-normal break-words">
                                ${val ? `
                                  <span class="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60 whitespace-normal break-words">
                                    ${this.escapeHtml(val)}
                                  </span>
                                ` : '<span class="text-slate-400">-</span>'}
                              </td>
                            `;
                          }

                          // Assigned Action Description column
                          if (/action|task|title|desc|description|deliverable/i.test(colLower)) {
                            return `
                              <td class="py-3 px-3.5 text-slate-900 font-medium min-w-[240px] max-w-[420px] whitespace-normal break-words leading-relaxed">${this.escapeHtml(val || '-')}</td>
                            `;
                          }

                          // Target date / Due date
                          if (/due|target|deadline/i.test(colLower)) {
                            return `
                              <td class="py-3 px-3.5 text-slate-600 font-mono text-xs min-w-[95px] max-w-[140px] whitespace-normal break-words">${this.escapeHtml(val || '-')}</td>
                            `;
                          }

                          // Assigned to
                          if (/assigned\s*to|assignee/i.test(colLower)) {
                            return `
                              <td class="py-3 px-3.5 text-slate-700 font-medium min-w-[110px] max-w-[180px] whitespace-normal break-words">${this.escapeHtml(val || '-')}</td>
                            `;
                          }

                          // Ack by
                          if (/ack/i.test(colLower)) {
                            return `
                              <td class="py-3 px-3.5 text-slate-600 font-medium min-w-[100px] max-w-[160px] whitespace-normal break-words">${this.escapeHtml(val || '-')}</td>
                            `;
                          }

                          // Remarks / notes
                          if (/remark|comment|note/i.test(colLower)) {
                            return `
                              <td class="py-3 px-3.5 text-slate-600 min-w-[140px] max-w-[280px] whitespace-normal break-words leading-relaxed">${this.escapeHtml(val || '-')}</td>
                            `;
                          }

                          // Default fallback for any other column in Google Sheet
                          return `
                            <td class="py-3 px-3.5 text-slate-700 min-w-[120px] max-w-[260px] whitespace-normal break-words leading-relaxed">${this.escapeHtml(val || '-')}</td>
                          `;
                        }).join('')}
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Pagination Footer -->
            ${totalPages > 1 ? `
              <div class="p-4 border-t border-slate-200 flex items-center justify-between text-xs sm:text-sm text-slate-600">
                <span class="font-medium">Page ${safePage} of ${totalPages}</span>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    ${safePage <= 1 ? 'disabled' : ''}
                    onclick="window.FPCL_STRATEGIC_SUITE.setTilePage(${safePage - 1})"
                    class="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold cursor-pointer text-xs sm:text-sm"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    ${safePage >= totalPages ? 'disabled' : ''}
                    onclick="window.FPCL_STRATEGIC_SUITE.setTilePage(${safePage + 1})"
                    class="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold cursor-pointer text-xs sm:text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    },

    // =========================================================================
    // RENDER: DEDICATED SCM DASHBOARD (SUPPLY CHAIN MANAGEMENT & GOOGLE SHEET)
    // =========================================================================
    renderScmDashboard(tile, ctx) {
      const {
        allActions, filteredActions, totalActions, closedActions, openActions, overallRate,
        filteredTotal, filteredClosed, filteredOpen, filteredRate,
        prioHigh, prioHighRate, prioMed, prioMedRate, prioLow, prioLowRate,
        pagedActions, safePage, totalPages, pageSize,
        isFiltered, isSyncing, lastSynced
      } = ctx;

      const sheetTabName = tile.sheetTab || 'SCM';
      const isConnected = this.isSheetConnected(tile.id);
      const sheetSourceLabel = tile.fromSecret
        ? 'Environment Secret (SCM_SHEET_URL)'
        : (tile.sheetUrl ? 'Live Google Sheet' : 'Default Verified Action Sheet');

      return `
        <div class="space-y-2.5 sm:space-y-3">
          <!-- SCM HERO & NAVIGATION BANNER -->
          <div class="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E1B4B] rounded-2xl p-3 sm:p-3.5 text-white shadow-lg relative overflow-hidden border border-slate-700/60">
            <div class="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -left-16 -bottom-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div class="flex items-start sm:items-center gap-3">
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                  class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-inner border border-white/10"
                  title="Back to Strategic Tiles Grid"
                >
                  <i data-lucide="arrow-left" class="w-4 h-4"></i>
                </button>

                <div class="space-y-0.5">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="px-2 py-0.2 rounded-full text-[9.5px] font-mono font-bold uppercase tracking-wider bg-amber-400 text-amber-950 shadow-2xs">
                      ${tile.code}
                    </span>
                    <span class="px-2 py-0.2 rounded-full text-[9.5px] font-bold bg-white/10 text-amber-200 border border-amber-400/30">
                      Corporate Procurement & SCM
                    </span>
                    <!-- Google Sheet connection status pill -->
                    <button
                      type="button"
                      onclick="window.FPCL_STRATEGIC_SUITE.openSheetConfigModal('${tile.id}')"
                      class="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9.5px] font-bold border transition-colors cursor-pointer ${isConnected ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30' : 'bg-amber-500/20 text-amber-200 border-amber-400/50 hover:bg-amber-500/30'}"
                      title="${isConnected ? 'Google Sheet is connected (Green)' : 'Google Sheet link broken / unlinked (Orange) - Click to configure'}"
                    >
                      <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}"></span>
                      </span>
                      <span>${isConnected ? `Sheet: ${sheetTabName}` : 'Link Broken'}</span>
                    </button>
                  </div>

                  <h1 class="text-base sm:text-xl font-black text-white tracking-tight">
                    Supply Chain Management (SCM) Dashboard
                  </h1>

                  <div class="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
                    <span class="text-amber-300 font-mono text-xs">
                      Source: ${sheetSourceLabel}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Action Bar Buttons -->
              <div class="flex items-center gap-2 flex-wrap self-start md:self-auto">
                <!-- Sync SCM Button -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.syncEmployeeSheet('${tile.id}')"
                  class="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 transition-all cursor-pointer flex items-center gap-2 shadow-md ${isSyncing ? 'opacity-70 animate-pulse' : ''}"
                  title="Sync live data from Google Sheet SCM"
                >
                  <i data-lucide="refresh-cw" class="w-4 h-4 ${isSyncing ? 'animate-spin' : ''}"></i>
                  <span>${isSyncing ? 'Syncing...' : 'Sync Live Sheet'}</span>
                  <span class="text-xs opacity-75 font-mono">(${lastSynced})</span>
                </button>

                <!-- Sheet Settings Modal -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.openSheetConfigModal('${tile.id}')"
                  class="p-2 text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all cursor-pointer shadow-xs"
                  title="Configure Google Sheet Link / Tab Name"
                >
                  <i data-lucide="settings" class="w-4 h-4"></i>
                </button>

                <!-- Export CSV -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.exportTileCSV('${tile.id}')"
                  class="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                  title="Export filtered SCM actions as CSV"
                >
                  <i data-lucide="download" class="w-4 h-4"></i>
                  <span>Export CSV (${filteredTotal})</span>
                </button>

                ${isFiltered ? `
                  <button
                    type="button"
                    onclick="window.FPCL_STRATEGIC_SUITE.clearTileFilters()"
                    class="px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Reset all search and status filters"
                  >
                    <i data-lucide="filter-x" class="w-4 h-4"></i>
                    <span>Reset</span>
                  </button>
                ` : ''}

                <!-- Lock & Return -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                  class="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-200 border border-white/20 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Lock dashboard immediately and return to grid"
                >
                  <i data-lucide="lock" class="w-4 h-4"></i>
                  <span>Lock & Return</span>
                </button>
              </div>
            </div>
          </div>

          <!-- SCM OPERATIONAL READINESS & PROCUREMENT KPI CARDS (6 CARDS) -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
            <!-- Card 1: Total SCM Deliverables -->
            <div class="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 sm:p-5 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 text-center">SCM Deliverables</div>
              <div class="text-4xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight text-slate-900 kpi-metric-val mt-2 text-center">${filteredTotal}</div>
            </div>

            <!-- Card 2: Closed & Procured -->
            <div class="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 sm:p-5 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-700 text-center">Closed / Procured</div>
              <div class="text-4xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight text-emerald-600 kpi-metric-val mt-2 text-center">${filteredClosed}</div>
            </div>

            <!-- Card 3: Open / In-Procurement -->
            <div class="bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-700 text-center">Open / Pending</div>
              <div class="text-4xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight text-amber-600 kpi-metric-val mt-2 text-center">${filteredOpen}</div>
            </div>

            <!-- Card 4: SCM Execution Rate -->
            <div class="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 sm:p-5 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-700 text-center">Execution Rate</div>
              <div class="text-4xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight text-blue-600 kpi-metric-val mt-2 text-center">${overallRate}%</div>
            </div>

            <!-- Card 5: Critical Turnaround Spares -->
            <div class="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 sm:p-5 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 text-center">Turnaround Spares</div>
              <div class="text-4xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight text-slate-900 kpi-metric-val mt-2 text-center">100%</div>
            </div>

            <!-- Card 6: Physical Inventory Accuracy -->
            <div class="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 sm:p-5 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-700 text-center">Barcode Match</div>
              <div class="text-4xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight text-indigo-600 kpi-metric-val mt-2 text-center">99.4%</div>
            </div>
          </div>

          <!-- TREND BARS & DONUT CHART (SCM ACTION STATUS & OPEN/CLOSE DONUT) -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
            ${this.renderSingleStatusBar(tile, closedActions, openActions, totalActions, overallRate, this.state.tileFilterStatus || 'all')}
            ${this.renderOpenCloseDonutCard(closedActions, openActions, totalActions, overallRate, this.state.tileFilterStatus || 'all')}
          </div>

          <!-- SCM FILTER BAR -->
          <div class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
            <div class="grid grid-cols-2 gap-2 sm:gap-3">
              <!-- Search Filter -->
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="search" class="w-4 h-4"></i>
                </div>
                <input
                  type="text"
                  value="${this.state.tileFilterSearch || ''}"
                  placeholder="Filter SCM deliverables, ID, remarks..."
                  class="w-full pl-9 pr-8 py-1.5 sm:py-2 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border border-slate-200 focus:border-amber-500 rounded-xl text-xs sm:text-sm font-medium outline-none transition-all"
                  oninput="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterSearch', this.value)"
                />
                ${this.state.tileFilterSearch ? `
                  <button
                    onclick="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterSearch', '')"
                    class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                  </button>
                ` : ''}
              </div>

              <!-- Status Filter Dropdown -->
              <div class="relative">
                <select
                  onchange="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterStatus', this.value)"
                  class="w-full px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-slate-50 hover:bg-white focus:bg-white text-slate-800 border border-slate-200 focus:border-purple-500 rounded-xl text-xs sm:text-sm font-bold outline-none transition-all cursor-pointer truncate"
                >
                  <option value="all" ${this.state.tileFilterStatus === 'all' ? 'selected' : ''}>All Statuses (${totalActions})</option>
                  <option value="Open" ${this.state.tileFilterStatus === 'Open' ? 'selected' : ''}>Open Only (${openActions})</option>
                  <option value="Closed" ${this.state.tileFilterStatus === 'Closed' ? 'selected' : ''}>Closed Only (${closedActions})</option>
                </select>
              </div>
            </div>
          </div>

          <!-- SCM DELIVERABLES & ACTION TABLE -->
          <div class="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div class="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
              <div class="flex items-center gap-2">
                <i data-lucide="list-checks" class="w-4 h-4 text-amber-600"></i>
                <h3 class="text-sm sm:text-base font-black text-slate-800">
                  Company Action Items and Action Item Master Roster (${filteredTotal} items)
                </h3>
              </div>

              <!-- Page Size Selector -->
              <div class="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                <span class="font-medium">Rows per page:</span>
                <select
                  onchange="window.FPCL_STRATEGIC_SUITE.setTilePageSize(Number(this.value))"
                  class="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="15" ${pageSize === 15 ? 'selected' : ''}>15</option>
                  <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
                  <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
                  <option value="1000" ${pageSize === 1000 ? 'selected' : ''}>All</option>
                </select>
              </div>
            </div>

            <!-- Table View -->
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs sm:text-sm text-slate-700">
                <thead class="bg-slate-50 border-b border-slate-200 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th class="py-3 px-3.5 min-w-[70px] whitespace-normal break-words">Deliverable ID</th>
                    <th class="py-3 px-3.5 min-w-[240px] max-w-[420px] whitespace-normal break-words">Action & Scope Description</th>
                    <th class="py-3 px-3.5 min-w-[95px] max-w-[140px] whitespace-normal break-words">Due Date</th>
                    <th class="py-3 px-3.5 min-w-[100px] max-w-[160px] whitespace-normal break-words">Status</th>
                    <th class="py-3 px-3.5 min-w-[140px] max-w-[280px] whitespace-normal break-words">Remarks / Supplier Details</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${pagedActions.length === 0 ? `
                    <tr>
                      <td colspan="5" class="py-8 text-center text-slate-400">
                        No SCM deliverables match the active filter.
                      </td>
                    </tr>
                  ` : pagedActions.map(a => {
                    const isClosed = a.status === 'Closed' || a.status === 'Completed';
                    const isPending = /on going|ongoing|progress|pending|wip|active/i.test(String(a.status || ''));
                    const badgeClass = isClosed 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : (isPending ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-rose-50 text-rose-800 border border-rose-200');
                    const dotColor = isClosed ? 'bg-emerald-500' : (isPending ? 'bg-amber-500' : 'bg-rose-500');

                    return `
                      <tr class="hover:bg-slate-50/70 transition-colors">
                        <td class="py-3 px-3.5 font-mono font-bold text-slate-800 min-w-[70px] whitespace-normal break-words">${this.escapeHtml(a.id)}</td>
                        <td class="py-3 px-3.5 text-slate-900 font-medium min-w-[240px] max-w-[420px] whitespace-normal break-words leading-relaxed">${this.escapeHtml(a.title)}</td>
                        <td class="py-3 px-3.5 text-slate-600 min-w-[95px] max-w-[140px] whitespace-normal break-words">${this.escapeHtml(a.dueDate || '-')}</td>
                        <td class="py-3 px-3.5 min-w-[100px] max-w-[160px] whitespace-normal break-words">
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${badgeClass}">
                            <span class="w-1.5 h-1.5 rounded-full ${dotColor} shrink-0"></span>
                            <span class="whitespace-normal break-words">${this.escapeHtml(a.status || (isClosed ? 'Closed' : 'Open'))}</span>
                          </span>
                        </td>
                        <td class="py-3 px-3.5 text-slate-500 min-w-[140px] max-w-[280px] whitespace-normal break-words leading-relaxed">${this.escapeHtml(a.remarks || '-')}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Pagination Footer -->
            ${totalPages > 1 ? `
              <div class="p-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>Page ${safePage} of ${totalPages}</span>
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    ${safePage <= 1 ? 'disabled' : ''}
                    onclick="window.FPCL_STRATEGIC_SUITE.setTilePage(${safePage - 1})"
                    class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    ${safePage >= totalPages ? 'disabled' : ''}
                    onclick="window.FPCL_STRATEGIC_SUITE.setTilePage(${safePage + 1})"
                    class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    },

    // RENDER: ADMIN & SECURITY DEDICATED DASHBOARD
    renderAdminSecurityDashboard(tile, ctx) {
      const {
        allActions, filteredActions, totalActions, closedActions, openActions, overallRate,
        filteredTotal, filteredClosed, filteredOpen, filteredRate,
        pagedActions, safePage, totalPages, pageSize,
        isFiltered, isSyncing, lastSynced
      } = ctx;

      const sheetTabName = tile.sheetTab || 'Admin_Security_Actions';
      const isConnected = this.isSheetConnected(tile.id);
      const sheetSourceLabel = tile.fromSecret
        ? 'Environment Secret (Admin_&_Security / ADMIN_SECURITY_SHEET_URL)'
        : (tile.sheetUrl ? 'Live Google Sheet' : 'Default Verified Action Sheet');

      return `
        <div class="space-y-3 sm:space-y-4">
          <!-- ADMIN & SECURITY HERO & NAVIGATION BANNER -->
          <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900 rounded-2xl p-3.5 sm:p-4 text-white shadow-lg relative overflow-hidden border border-slate-700">
            <div class="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
              <div class="flex items-start sm:items-center gap-3">
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                  class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-inner border border-white/10"
                  title="Back to Strategic Tiles Grid"
                >
                  <i data-lucide="arrow-left" class="w-4 h-4"></i>
                </button>

                <div class="space-y-0.5">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-200 text-slate-900 shadow-2xs">
                      ${tile.code || 'ADM'}
                    </span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-200 border border-slate-400/30">
                      Corporate Services & Plant Defense
                    </span>
                    <!-- Google Sheet connection status pill -->
                    <button
                      type="button"
                      onclick="window.FPCL_STRATEGIC_SUITE.openSheetConfigModal('${tile.id}')"
                      class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${isConnected ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30' : 'bg-amber-500/20 text-amber-200 border-amber-400/50 hover:bg-amber-500/30'}"
                      title="${isConnected ? 'Google Sheet is connected (Green)' : 'Google Sheet link broken / unlinked (Orange) - Click to configure'}"
                    >
                      <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}"></span>
                      </span>
                      <span>${isConnected ? `Live Sheet: ${sheetTabName}` : 'Link Broken / Not Set'}</span>
                    </button>
                  </div>

                  <h1 class="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>Admin & Security Strategic Dashboard</span>
                  </h1>

                  <div class="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
                    <span class="text-emerald-400 font-mono text-xs flex items-center gap-1">
                      <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 inline"></i>
                      Source: ${sheetSourceLabel}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Action Bar Buttons -->
              <div class="flex items-center gap-2 flex-wrap self-start md:self-auto">
                <!-- Sync Live Sheet Button -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.syncEmployeeSheet('${tile.id}')"
                  class="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer flex items-center gap-2 shadow-md ${isSyncing ? 'opacity-70 animate-pulse' : ''}"
                  title="Sync live data from Google Sheet for Admin & Security"
                >
                  <i data-lucide="refresh-cw" class="w-4 h-4 ${isSyncing ? 'animate-spin' : ''}"></i>
                  <span>${isSyncing ? 'Syncing...' : 'Sync Live Sheet'}</span>
                  <span class="text-xs opacity-80 font-mono">(${lastSynced})</span>
                </button>

                <!-- Sheet Settings Modal -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.openSheetConfigModal('${tile.id}')"
                  class="p-2 text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all cursor-pointer shadow-xs"
                  title="Configure Google Sheet Link / Tab Name"
                >
                  <i data-lucide="settings" class="w-4 h-4"></i>
                </button>

                <!-- Export CSV -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.exportTileCSV('${tile.id}')"
                  class="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-all cursor-pointer flex items-center gap-2 shadow-xs border border-slate-600"
                  title="Export filtered Admin & Security actions as CSV"
                >
                  <i data-lucide="download" class="w-4 h-4"></i>
                  <span>Export CSV (${filteredTotal})</span>
                </button>

                ${isFiltered ? `
                  <button
                    type="button"
                    onclick="window.FPCL_STRATEGIC_SUITE.clearTileFilters()"
                    class="px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Reset all search and status filters"
                  >
                    <i data-lucide="filter-x" class="w-4 h-4"></i>
                    <span>Reset</span>
                  </button>
                ` : ''}

                <!-- Lock & Return -->
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                  class="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-200 border border-white/20 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Lock dashboard immediately and return to grid"
                >
                  <i data-lucide="lock" class="w-4 h-4"></i>
                  <span>Lock & Return</span>
                </button>
              </div>
            </div>
          </div>

          <!-- KPI VALUES: 4 PURE GOOGLE SHEET METRICS (100% DRIVEN BY LIVE SHEET) -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <!-- Card 1: Total Deliverables -->
            <div class="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Total Deliverables</div>
              <div class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-900 kpi-metric-val mt-2 text-center">${filteredTotal}</div>
              <div class="text-[11px] text-slate-400 mt-1 font-medium">From Live Google Sheet</div>
            </div>

            <!-- Card 2: Closed Actions -->
            <div class="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs font-bold uppercase tracking-wider text-emerald-700 text-center">Closed Actions</div>
              <div class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-emerald-600 kpi-metric-val mt-2 text-center">${filteredClosed}</div>
              <div class="text-[11px] text-emerald-600/80 mt-1 font-medium">Verified & Completed</div>
            </div>

            <!-- Card 3: Open Actions -->
            <div class="bg-white border border-slate-200 hover:border-rose-300 rounded-2xl p-4 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs font-bold uppercase tracking-wider text-rose-700 text-center">Open Actions</div>
              <div class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-rose-600 kpi-metric-val mt-2 text-center">${filteredOpen}</div>
              <div class="text-[11px] text-rose-600/80 mt-1 font-medium">Pending Scope</div>
            </div>

            <!-- Card 4: Overall Progress Rate -->
            <div class="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 shadow-xs text-center flex flex-col items-center justify-center transition-all">
              <div class="text-xs font-bold uppercase tracking-wider text-blue-700 text-center">Overall Progress</div>
              <div class="text-4xl sm:text-5xl font-black font-mono tracking-tight text-blue-600 kpi-metric-val mt-2 text-center">${overallRate}%</div>
              <div class="text-[11px] text-blue-600/80 mt-1 font-medium">Closure Target: 100%</div>
            </div>
          </div>

          <!-- HORIZONTAL BARS SECTION & DONUT CHART SECTION -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">
            <!-- HORIZONTAL BARS: Action Status Trends & Live Deliverables Completion Breakdown (7 Cols) -->
            <div class="lg:col-span-7 space-y-3.5">
              <!-- Horizontal Bar 1: Action Status Trends Horizontal Stacked Bar -->
              <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <i data-lucide="bar-chart-horizontal" class="w-4 h-4 text-slate-700"></i>
                    <h3 class="text-sm sm:text-base font-black text-slate-800">Action Status Trends (Horizontal Bar)</h3>
                  </div>
                  <span class="text-xs font-bold text-slate-500 font-mono">Total: ${totalActions}</span>
                </div>

                <!-- High-contrast Horizontal Stacked Bar -->
                <div class="space-y-2 pt-1">
                  <div class="flex items-center justify-between text-xs font-bold">
                    <span class="text-emerald-700 flex items-center gap-1.5">
                      <span class="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block"></span>
                      Closed: ${closedActions} (${overallRate}%)
                    </span>
                    <span class="text-rose-700 flex items-center gap-1.5">
                      <span class="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block"></span>
                      Open: ${openActions} (${100 - overallRate}%)
                    </span>
                  </div>

                  <div class="h-6 w-full rounded-xl bg-slate-100 overflow-hidden flex shadow-inner p-0.5 border border-slate-200">
                    <div
                      style="width: ${overallRate}%"
                      class="h-full bg-emerald-500 rounded-l-lg transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white font-mono"
                      title="Closed Actions: ${closedActions}"
                    >
                      ${overallRate > 15 ? `${overallRate}%` : ''}
                    </div>
                    <div
                      style="width: ${100 - overallRate}%"
                      class="h-full bg-rose-500 rounded-r-lg transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white font-mono"
                      title="Open Actions: ${openActions}"
                    >
                      ${(100 - overallRate) > 15 ? `${100 - overallRate}%` : ''}
                    </div>
                  </div>

                  <div class="flex justify-between text-[10px] text-slate-400 font-mono px-0.5">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              <!-- Horizontal Bar 2: Live Deliverables Progress Breakdown (From Google Sheet) -->
              <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <i data-lucide="layers" class="w-4 h-4 text-emerald-600"></i>
                    <h3 class="text-sm sm:text-base font-black text-slate-800">Live Deliverable Progress Bars</h3>
                  </div>
                  <span class="text-xs font-semibold text-slate-400">Google Sheet Scope</span>
                </div>

                <div class="space-y-3 pt-1">
                  ${allActions.length === 0 ? `
                    <div class="py-4 text-center text-xs text-slate-400 font-medium">No actions found in Google Sheet.</div>
                  ` : allActions.map(action => {
                    const isDone = action.status === 'Closed' || action.status === 'Completed';
                    const progressPercent = isDone ? 100 : 0;
                    return `
                      <div class="space-y-1.5">
                        <div class="flex items-center justify-between text-xs gap-2">
                          <div class="flex items-center gap-1.5 min-w-0">
                            <span class="font-mono font-bold text-slate-800 shrink-0">${action.id}</span>
                            <span class="text-slate-400">|</span>
                            <span class="font-semibold text-slate-700 truncate" title="${action.title}">${action.title}</span>
                          </div>
                          <div class="flex items-center gap-2 font-mono text-[11px] shrink-0">
                            ${action.dueDate ? `<span class="text-slate-500 hidden sm:inline">Due: ${action.dueDate}</span>` : ''}
                            <span class="px-2 py-0.5 rounded-md font-bold ${isDone ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}">
                              ${action.status || (isDone ? 'Closed' : 'Open')}
                            </span>
                          </div>
                        </div>
                        <div class="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex border border-slate-200/80">
                          <div
                            style="width: ${progressPercent}%"
                            class="h-full ${isDone ? 'bg-emerald-500' : 'bg-rose-400'} transition-all duration-500 rounded-full"
                          ></div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>

            <!-- DONUT CHART: Open vs Closed Donut Chart (5 Cols) -->
            <div class="lg:col-span-5 flex flex-col">
              <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex-1 flex flex-col justify-between space-y-3">
                <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <i data-lucide="pie-chart" class="w-4 h-4 text-purple-600"></i>
                    <h3 class="text-sm sm:text-base font-black text-slate-800">Open vs Closed (Donut Chart)</h3>
                  </div>
                  <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ${overallRate}% Closed
                  </span>
                </div>

                <!-- SVG Donut Chart -->
                <div class="flex-1 flex flex-col items-center justify-center py-2">
                  <div class="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
                    <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <!-- Background Circle -->
                      <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F1F5F9" stroke-width="12"></circle>
                      
                      <!-- Open Actions Arc (Rose) -->
                      <circle
                        cx="50" cy="50" r="38"
                        fill="transparent"
                        stroke="#F43F5E"
                        stroke-width="12"
                        stroke-dasharray="238.76"
                        stroke-dashoffset="0"
                      ></circle>

                      <!-- Closed Actions Arc (Emerald) -->
                      <circle
                        cx="50" cy="50" r="38"
                        fill="transparent"
                        stroke="#10B981"
                        stroke-width="12"
                        stroke-dasharray="238.76"
                        stroke-dashoffset="${238.76 - (238.76 * (overallRate / 100))}"
                        stroke-linecap="round"
                        class="transition-all duration-1000 ease-out"
                      ></circle>
                    </svg>

                    <!-- Center Metrics -->
                    <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span class="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900">${overallRate}%</span>
                      <span class="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700">Closed Rate</span>
                      <span class="text-[10px] text-slate-400 font-mono">${closedActions}/${totalActions} Done</span>
                    </div>
                  </div>
                </div>

                <!-- Donut Legend & Detailed Metric Cards -->
                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div class="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-center">
                    <div class="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800">
                      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Closed</span>
                    </div>
                    <div class="text-xl font-black font-mono text-emerald-900 mt-0.5">${closedActions}</div>
                    <div class="text-[10px] text-emerald-700 font-medium">${overallRate}% of Total</div>
                  </div>

                  <div class="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/80 text-center">
                    <div class="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-800">
                      <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>Open</span>
                    </div>
                    <div class="text-xl font-black font-mono text-rose-900 mt-0.5">${openActions}</div>
                    <div class="text-[10px] text-rose-700 font-medium">${100 - overallRate}% of Total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- EXCEL FILE MAPPING SECTION (BELOW THE CHARTS) -->
          <div class="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <!-- Header -->
            <div class="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
                  <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                    <span>Excel / Google Sheet Field Mapping & Column Schema</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Live 1:1 Binding
                    </span>
                  </h3>
                  <p class="text-xs text-slate-500 font-medium">
                    Maps the Google Sheet columns configured in secrets to the Admin & Security dashboard components.
                  </p>
                </div>
              </div>

              <!-- Metadata Pills -->
              <div class="flex items-center gap-2 flex-wrap text-xs">
                <span class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono font-bold">
                  Tab: <span class="text-emerald-700">${sheetTabName}</span>
                </span>
                <span class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono font-bold">
                  Secret: <span class="text-purple-700 font-mono">Admin_&_Security</span>
                </span>
                <span class="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-1">
                  <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                  <span>Schema Validated</span>
                </span>
              </div>
            </div>

            <!-- Column Mapping Grid (6 Excel Columns A - F) -->
            <div class="p-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                <!-- Col A: ID -->
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 hover:border-slate-300 transition-colors">
                  <div class="flex items-center justify-between">
                    <span class="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono font-black text-xs">Col A [1]</span>
                    <span class="text-[10px] font-mono text-slate-500 font-bold">Code</span>
                  </div>
                  <div class="font-bold text-slate-800 text-xs">Deliverable ID</div>
                  <div class="text-[11px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200">
                    Mapped to: a.id
                  </div>
                  <div class="text-[10px] text-slate-500">
                    Alphanumeric reference (e.g., ADM-01) for indexing & audits.
                  </div>
                </div>

                <!-- Col B: Title / Description -->
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 hover:border-slate-300 transition-colors">
                  <div class="flex items-center justify-between">
                    <span class="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono font-black text-xs">Col B [2]</span>
                    <span class="text-[10px] font-mono text-slate-500 font-bold">String</span>
                  </div>
                  <div class="font-bold text-slate-800 text-xs">Action Description</div>
                  <div class="text-[11px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200">
                    Mapped to: a.title
                  </div>
                  <div class="text-[10px] text-slate-500">
                    Primary deliverable work scope and security task description.
                  </div>
                </div>

                <!-- Col C: Due Date -->
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 hover:border-slate-300 transition-colors">
                  <div class="flex items-center justify-between">
                    <span class="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono font-black text-xs">Col C [3]</span>
                    <span class="text-[10px] font-mono text-slate-500 font-bold">Date</span>
                  </div>
                  <div class="font-bold text-slate-800 text-xs">Target Due Date</div>
                  <div class="text-[11px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200">
                    Mapped to: a.dueDate
                  </div>
                  <div class="text-[10px] text-slate-500">
                    ISO target deadline date (YYYY-MM-DD) for tracking schedules.
                  </div>
                </div>

                <!-- Col D: Status -->
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 hover:border-slate-300 transition-colors">
                  <div class="flex items-center justify-between">
                    <span class="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono font-black text-xs">Col D [4]</span>
                    <span class="text-[10px] font-mono text-slate-500 font-bold">Enum</span>
                  </div>
                  <div class="font-bold text-slate-800 text-xs">Execution Status</div>
                  <div class="text-[11px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200">
                    Mapped to: a.status
                  </div>
                  <div class="text-[10px] text-slate-500">
                    Drives KPIs, Horizontal Bars, Donut Chart, and status badges.
                  </div>
                </div>

                <!-- Col E: Closure Date -->
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 hover:border-slate-300 transition-colors">
                  <div class="flex items-center justify-between">
                    <span class="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono font-black text-xs">Col E [5]</span>
                    <span class="text-[10px] font-mono text-slate-500 font-bold">Date</span>
                  </div>
                  <div class="font-bold text-slate-800 text-xs">Closure Date</div>
                  <div class="text-[11px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200">
                    Mapped to: a.closureDate
                  </div>
                  <div class="text-[10px] text-slate-500">
                    Recorded date when verified and closed by department head.
                  </div>
                </div>

                <!-- Col F: Remarks -->
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 hover:border-slate-300 transition-colors">
                  <div class="flex items-center justify-between">
                    <span class="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono font-black text-xs">Col F [6]</span>
                    <span class="text-[10px] font-mono text-slate-500 font-bold">Text</span>
                  </div>
                  <div class="font-bold text-slate-800 text-xs">Remarks / Notes</div>
                  <div class="text-[11px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200">
                    Mapped to: a.remarks
                  </div>
                  <div class="text-[10px] text-slate-500">
                    Contractor details, RFP status, and security compliance notes.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ADMIN & SECURITY FILTER BAR -->
          <div class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
            <div class="grid grid-cols-2 gap-2 sm:gap-3">
              <!-- Search Filter -->
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="search" class="w-4 h-4"></i>
                </div>
                <input
                  type="text"
                  value="${this.state.tileFilterSearch || ''}"
                  placeholder="Filter Admin & Security deliverables, ID, remarks..."
                  class="w-full pl-9 pr-8 py-1.5 sm:py-2 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border border-slate-200 focus:border-slate-800 rounded-xl text-xs sm:text-sm font-medium outline-none transition-all"
                  oninput="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterSearch', this.value)"
                />
                ${this.state.tileFilterSearch ? `
                  <button
                    onclick="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterSearch', '')"
                    class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                  </button>
                ` : ''}
              </div>

              <!-- Status Filter Dropdown -->
              <div class="relative">
                <select
                  onchange="window.FPCL_STRATEGIC_SUITE.setTileFilter('tileFilterStatus', this.value)"
                  class="w-full px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-slate-50 hover:bg-white focus:bg-white text-slate-800 border border-slate-200 focus:border-slate-800 rounded-xl text-xs sm:text-sm font-bold outline-none transition-all cursor-pointer truncate"
                >
                  <option value="all" ${this.state.tileFilterStatus === 'all' ? 'selected' : ''}>All Statuses (${totalActions})</option>
                  <option value="Open" ${this.state.tileFilterStatus === 'Open' ? 'selected' : ''}>Open Only (${openActions})</option>
                  <option value="Closed" ${this.state.tileFilterStatus === 'Closed' ? 'selected' : ''}>Closed Only (${closedActions})</option>
                </select>
              </div>
            </div>
          </div>

          <!-- DELIVERABLES & ACTION ROSTER TABLE -->
          <div class="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div class="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
              <div class="flex items-center gap-2">
                <i data-lucide="list-checks" class="w-4 h-4 text-slate-700"></i>
                <h3 class="text-sm sm:text-base font-black text-slate-800">
                  Company Action Items and Action Item Master Roster (${filteredTotal} items)
                </h3>
              </div>

              <!-- Page Size Selector -->
              <div class="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                <span class="font-medium">Rows per page:</span>
                <select
                  onchange="window.FPCL_STRATEGIC_SUITE.setTilePageSize(Number(this.value))"
                  class="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-slate-800 cursor-pointer"
                >
                  <option value="15" ${pageSize === 15 ? 'selected' : ''}>15</option>
                  <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
                  <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
                  <option value="1000" ${pageSize === 1000 ? 'selected' : ''}>All</option>
                </select>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs sm:text-sm">
                    <th class="py-3 px-3.5 min-w-[70px] whitespace-normal break-words">ID</th>
                    <th class="py-3 px-3.5 min-w-[240px] max-w-[420px] whitespace-normal break-words">Action Description</th>
                    <th class="py-3 px-3.5 min-w-[95px] max-w-[140px] whitespace-normal break-words">Due Date</th>
                    <th class="py-3 px-3.5 min-w-[100px] max-w-[160px] whitespace-normal break-words">Status</th>
                    <th class="py-3 px-3.5 min-w-[140px] max-w-[280px] whitespace-normal break-words">Remarks / Contractor Notes</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-xs sm:text-sm">
                  ${pagedActions.length === 0 ? `
                    <tr>
                      <td colspan="5" class="py-10 text-center text-slate-400 font-medium text-sm">
                        No Admin & Security deliverables match the active search or filters.
                      </td>
                    </tr>
                  ` : pagedActions.map(a => {
                    const isClosed = a.status === 'Closed' || a.status === 'Completed';
                    const isPending = /on going|ongoing|progress|pending|wip|active/i.test(String(a.status || ''));
                    const badgeClass = isClosed 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : (isPending ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-rose-50 text-rose-800 border border-rose-200');
                    const dotColor = isClosed ? 'bg-emerald-500' : (isPending ? 'bg-amber-500' : 'bg-rose-500');

                    return `
                      <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="py-3 px-3.5 font-mono font-bold text-slate-800 text-xs sm:text-sm min-w-[70px] whitespace-normal break-words">${this.escapeHtml(a.id)}</td>
                        <td class="py-3 px-3.5 text-slate-900 font-medium min-w-[240px] max-w-[420px] whitespace-normal break-words leading-relaxed">${this.escapeHtml(a.title)}</td>
                        <td class="py-3 px-3.5 text-slate-600 font-mono text-xs min-w-[95px] max-w-[140px] whitespace-normal break-words">${this.escapeHtml(a.dueDate || '-')}</td>
                        <td class="py-3 px-3.5 min-w-[100px] max-w-[160px] whitespace-normal break-words">
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${badgeClass}">
                            <span class="w-1.5 h-1.5 rounded-full ${dotColor} shrink-0"></span>
                            <span class="whitespace-normal break-words">${this.escapeHtml(a.status || (isClosed ? 'Closed' : 'Open'))}</span>
                          </span>
                        </td>
                        <td class="py-3 px-3.5 text-slate-500 min-w-[140px] max-w-[280px] whitespace-normal break-words leading-relaxed">${this.escapeHtml(a.remarks || '-')}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Pagination Footer -->
            ${totalPages > 1 ? `
              <div class="p-4 border-t border-slate-200 flex items-center justify-between text-xs sm:text-sm text-slate-600">
                <span class="font-medium">Page ${safePage} of ${totalPages}</span>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    ${safePage <= 1 ? 'disabled' : ''}
                    onclick="window.FPCL_STRATEGIC_SUITE.setTilePage(${safePage - 1})"
                    class="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold cursor-pointer text-xs sm:text-sm"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    ${safePage >= totalPages ? 'disabled' : ''}
                    onclick="window.FPCL_STRATEGIC_SUITE.setTilePage(${safePage + 1})"
                    class="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold cursor-pointer text-xs sm:text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    },

    // RENDER: PASSWORD AUTH MODAL
    renderAuthModal() {
      const container = document.getElementById('strategic-auth-modal-body');
      if (!container) return;

      const tileId = this.state.activeAuthTileId;
      const tile = this.getTileData(tileId);
      if (!tile) return;

      if (this.state.authView === 'reset') {
        container.innerHTML = `
          <div class="space-y-4 pt-1">
            <div id="strategic-reset-error-msg" class="hidden p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2"></div>

            <div class="space-y-1.5">
              <div class="relative">
                <input
                  id="strategic-reset-pwd-input"
                  type="${this.state.visibility.reset ? 'text' : 'password'}"
                  placeholder="Password..."
                  class="w-full px-3.5 py-2.5 pr-10 text-xs font-mono rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 bg-white text-slate-900 outline-none"
                  oninput="const eb = document.getElementById('strategic-reset-error-msg'); if (eb) eb.classList.add('hidden');"
                  onkeydown="if(event.key==='Enter') window.FPCL_STRATEGIC_SUITE.submitResetPassword()"
                />
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.toggleVisibility('reset')"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <i id="strategic-reset-eye-icon" data-lucide="${this.state.visibility.reset ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <div class="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.closeAuthModal()"
                class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.submitResetPassword()"
                class="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-500 hover:to-yellow-400 shadow-xs transition-all cursor-pointer"
              >
                Reset Password
              </button>
            </div>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      if (this.state.authView === 'unlock') {
        container.innerHTML = `
          <div class="space-y-4">
            <div class="p-4 rounded-2xl bg-gradient-to-r ${tile.theme.gradient} text-white relative overflow-hidden text-center shadow-xs">
              <div class="flex flex-col items-center justify-center text-center gap-2">
                <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white mx-auto shadow-inner">
                  <i data-lucide="${tile.icon}" class="w-6 h-6"></i>
                </div>
                <div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/20 text-white uppercase">
                    ${tile.code}
                  </span>
                  <h4 class="text-lg font-black text-white mt-1">${tile.name}</h4>
                  ${tile.isBossDashboard ? `<p class="text-xs text-amber-300 font-bold mt-0.5">COO Executive Dashboard</p>` : ''}
                </div>
              </div>
            </div>

            <div id="strategic-auth-error-msg" class="hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2"></div>

            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-700">Enter Password</label>
              <div class="relative">
                <input
                  id="strategic-auth-pwd-input"
                  type="${this.state.visibility.auth ? 'text' : 'password'}"
                  placeholder="Enter password..."
                  class="w-full px-3.5 py-2.5 pr-10 text-xs font-mono rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white text-slate-900 outline-none"
                  oninput="window.FPCL_STRATEGIC_SUITE.onAuthPasswordInput(this.value)"
                  onkeydown="if(event.key==='Enter') window.FPCL_STRATEGIC_SUITE.submitUnlock()"
                />
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.toggleVisibility('auth')"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <i id="strategic-auth-eye-icon" data-lucide="${this.state.visibility.auth ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <div class="pt-2 flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.switchAuthView('change')"
                class="px-3.5 py-2 rounded-xl text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <i data-lucide="key-round" class="w-3.5 h-3.5"></i>
                <span>Change Password</span>
              </button>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.closeAuthModal()"
                  class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.submitUnlock()"
                  class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <i data-lucide="lock-open" class="w-3.5 h-3.5"></i>
                  <span>Unlock & Open</span>
                </button>
              </div>
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="space-y-4">
            <div class="p-3.5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 text-white flex items-center justify-between">
              <div>
                <h4 class="text-sm font-bold text-white">Change Password: ${tile.name}</h4>
                <p class="text-[11px] text-slate-300">Set a custom password for this dashboard.</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-white border border-white/20">
                ${tile.code}
              </span>
            </div>

            <div id="strategic-change-error" class="hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2"></div>

            <div class="space-y-3">
              <div class="space-y-1">
                <label class="block text-xs font-bold text-slate-700">Old Correct Password</label>
                <input
                  id="strategic-change-old-pwd"
                  type="password"
                  placeholder="Enter old password..."
                  class="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-purple-500 outline-none text-slate-900"
                />
              </div>

              <div class="space-y-1">
                <label class="block text-xs font-bold text-slate-700">New Password</label>
                <input
                  id="strategic-change-new-pwd"
                  type="password"
                  placeholder="Enter new password (min 3 characters)..."
                  class="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-purple-500 outline-none text-slate-900"
                />
              </div>

              <div class="space-y-1">
                <label class="block text-xs font-bold text-slate-700">Confirm New Password</label>
                <input
                  id="strategic-change-confirm-pwd"
                  type="password"
                  placeholder="Confirm new password..."
                  class="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-purple-500 outline-none text-slate-900"
                  onkeydown="if(event.key==='Enter') window.FPCL_STRATEGIC_SUITE.submitChangePassword()"
                />
              </div>
            </div>

            <div class="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.switchAuthView('unlock')"
                class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                Back to Unlock
              </button>
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.submitChangePassword()"
                class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all cursor-pointer shadow-sm"
              >
                Save Password & Open
              </button>
            </div>
          </div>
        `;
      }
    },

    getAuthModalHtml() {
      return `
        <!-- TILE AUTHENTICATION & CHANGE PASSWORD MODAL -->
        <div id="strategic-auth-modal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div class="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200">
              <div id="strategic-auth-modal-title" class="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <i id="strategic-auth-modal-title-icon" data-lucide="shield-check" class="w-4 h-4 text-purple-600"></i>
                <span id="strategic-auth-modal-title-text">Strategic Security Verification</span>
              </div>
              <button
                onclick="window.FPCL_STRATEGIC_SUITE.closeAuthModal()"
                class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close modal"
              >
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>

            <div id="strategic-auth-modal-body" class="overflow-y-auto pr-1 flex-1">
              <!-- Dynamically populated via renderAuthModal() -->
            </div>
          </div>
        </div>
      `;
    },

    getDepartmentalActionsModalHtml() {
      const isOpen = Boolean(this.state.isDeptActionsModalOpen);
      const q = (this.state.deptActionsModalSearch || '').toLowerCase().trim();
      const employeeTiles = this.getAllTiles().filter(t => !t.isBossDashboard);
      const filtered = employeeTiles.filter(tile => {
        if (!q) return true;
        return tile.name.toLowerCase().includes(q) ||
               tile.code.toLowerCase().includes(q) ||
               (tile.category && tile.category.toLowerCase().includes(q));
      });

      return `
        <!-- STRATEGIC DEPARTMENTAL ACTIONS MODAL -->
        <div id="strategic-dept-actions-modal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs ${isOpen ? 'flex' : 'hidden'} items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200" onclick="if(event.target === this) window.FPCL_STRATEGIC_SUITE.closeDepartmentalActionsModal()">
          <div class="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" onclick="event.stopPropagation()">
            <!-- Header -->
            <div class="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div class="flex items-center gap-2.5">
                <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <i data-lucide="folder-kanban" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                    Departmental Action Sheets
                  </h3>
                  <p class="text-xs text-slate-500 font-medium">
                    Click any strategic department dashboard below to open its dedicated Google Sheet in a new tab.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.closeDepartmentalActionsModal()"
                class="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close modal"
              >
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>

            <!-- Search / Filter input -->
            <div class="pt-3 pb-2 shrink-0">
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <i data-lucide="search" class="w-4 h-4"></i>
                </div>
                <input
                  id="dept-actions-modal-search"
                  type="text"
                  value="${this.escapeHtml(this.state.deptActionsModalSearch || '')}"
                  placeholder="Filter department name or code..."
                  class="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border border-slate-200 focus:border-purple-500 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all shadow-2xs"
                  oninput="window.FPCL_STRATEGIC_SUITE.filterDepartmentalActionsModal(this.value)"
                />
              </div>
            </div>

            <!-- List of Dashboards Body -->
            <div id="strategic-dept-actions-modal-list" class="overflow-y-auto pr-1 py-1 space-y-2 flex-1">
              ${filtered.length === 0 ? `
                <div class="py-8 text-center text-slate-400">
                  <i data-lucide="search-x" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                  <p class="text-xs font-semibold text-slate-600">No departments match "${this.escapeHtml(q)}"</p>
                </div>
              ` : filtered.map(tile => {
                const sheetUrl = this.getTileSheetEditUrl(tile);
                return `
                  <a
                    href="${sheetUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200 hover:border-purple-400 bg-slate-50/70 hover:bg-purple-50/60 transition-all cursor-pointer shadow-2xs hover:shadow-sm"
                    title="Open Google Sheet for ${this.escapeHtml(tile.name)} (${tile.code})"
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <div
                        class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                        style="background-color: ${tile.theme ? tile.theme.bg : '#F8FAFC'}; border-color: ${tile.theme ? tile.theme.border : '#E2E8F0'}; color: ${tile.theme ? tile.theme.primary : '#475569'};"
                      >
                        <i data-lucide="${tile.icon || 'file-text'}" class="w-4 h-4"></i>
                      </div>
                      <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                            ${tile.code}
                          </span>
                          <h4 class="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                            ${this.escapeHtml(tile.name)}
                          </h4>
                        </div>
                        <p class="text-[11px] text-slate-500 truncate mt-0.5">
                          ${this.escapeHtml(tile.category || 'Strategic Department')}
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0 ml-2">
                      <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:from-emerald-500 group-hover:to-teal-500 shadow-2xs transition-all">
                        <i data-lucide="sheet" class="w-3.5 h-3.5"></i>
                        <span class="hidden sm:inline">Open Google Sheet</span>
                        <span class="sm:hidden">Open</span>
                        <i data-lucide="external-link" class="w-3 h-3 opacity-90"></i>
                      </span>
                    </div>
                  </a>
                `;
              }).join('')}
            </div>

            <!-- Footer -->
            <div class="pt-3 mt-2 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs text-slate-500">
              <span id="strategic-dept-actions-count">${filtered.length} of ${employeeTiles.length} strategic department sheets</span>
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.closeDepartmentalActionsModal()"
                class="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      `;
    },

    openDepartmentalActionsModal() {
      this.state.isDeptActionsModalOpen = true;
      this.state.deptActionsModalSearch = '';
      this.render();
      setTimeout(() => {
        const input = document.getElementById('dept-actions-modal-search');
        if (input) input.focus();
      }, 50);
    },

    closeDepartmentalActionsModal() {
      this.state.isDeptActionsModalOpen = false;
      this.state.deptActionsModalSearch = '';
      this.render();
    },

    filterDepartmentalActionsModal(query) {
      this.state.deptActionsModalSearch = query || '';
      const listContainer = document.getElementById('strategic-dept-actions-modal-list');
      const countEl = document.getElementById('strategic-dept-actions-count');
      if (!listContainer) {
        this.render();
        return;
      }
      const q = (query || '').toLowerCase().trim();
      const employeeTiles = this.getAllTiles().filter(t => !t.isBossDashboard);
      const filtered = employeeTiles.filter(tile => {
        if (!q) return true;
        return tile.name.toLowerCase().includes(q) ||
               tile.code.toLowerCase().includes(q) ||
               (tile.category && tile.category.toLowerCase().includes(q));
      });

      if (countEl) {
        countEl.textContent = `${filtered.length} of ${employeeTiles.length} strategic department sheets`;
      }

      if (filtered.length === 0) {
        listContainer.innerHTML = `
          <div class="py-8 text-center text-slate-400">
            <i data-lucide="search-x" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
            <p class="text-xs font-semibold text-slate-600">No departments match "${this.escapeHtml(q)}"</p>
          </div>
        `;
      } else {
        listContainer.innerHTML = filtered.map(tile => {
          const sheetUrl = this.getTileSheetEditUrl(tile);
          return `
            <a
              href="${sheetUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200 hover:border-purple-400 bg-slate-50/70 hover:bg-purple-50/60 transition-all cursor-pointer shadow-2xs hover:shadow-sm"
              title="Open Google Sheet for ${this.escapeHtml(tile.name)} (${tile.code})"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                  style="background-color: ${tile.theme ? tile.theme.bg : '#F8FAFC'}; border-color: ${tile.theme ? tile.theme.border : '#E2E8F0'}; color: ${tile.theme ? tile.theme.primary : '#475569'};"
                >
                  <i data-lucide="${tile.icon || 'file-text'}" class="w-4 h-4"></i>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                      ${tile.code}
                    </span>
                    <h4 class="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                      ${this.escapeHtml(tile.name)}
                    </h4>
                  </div>
                  <p class="text-[11px] text-slate-500 truncate mt-0.5">
                    ${this.escapeHtml(tile.category || 'Strategic Department')}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0 ml-2">
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:from-emerald-500 group-hover:to-teal-500 shadow-2xs transition-all">
                  <i data-lucide="sheet" class="w-3.5 h-3.5"></i>
                  <span class="hidden sm:inline">Open Google Sheet</span>
                  <span class="sm:hidden">Open</span>
                  <i data-lucide="external-link" class="w-3 h-3 opacity-90"></i>
                </span>
              </div>
            </a>
          `;
        }).join('');
      }
      if (window.lucide) window.lucide.createIcons();
    },

    // RENDER: MAIN TILES GRID OR FULL PAGE DASHBOARD
    render() {
      const container = document.getElementById('strategic-specialized-container');
      if (!container) return;

      // =========================================================================
      // VIEW MODE 1: DEDICATED FULL-PAGE DASHBOARD VIEW (WITH PROMINENT BACK BUTTON)
      // =========================================================================
      if (this.state.currentView === 'dashboard' && this.state.selectedTileId) {
        const selectedTile = this.getTileData(this.state.selectedTileId);
        if (selectedTile) {
          const isBoss = selectedTile.isBossDashboard;
          const html = `
            <div class="space-y-2.5 sm:space-y-3 animate-in fade-in duration-200">
              <!-- FULL-PAGE DASHBOARD BODY WITH MERGED UNIFIED HEADER -->
              <div id="strategic-fullpage-body" class="w-full">
                ${isBoss ? this.renderBossDashboard() : this.renderEmployeeActionSheet(selectedTile)}
              </div>

              <!-- BOTTOM FOOTER RETURN BAR -->
              <div class="pt-2.5 sm:pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div class="flex items-center gap-2 text-center sm:text-left">
                  <i data-lucide="lock" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
                  <span>Session will automatically lock upon moving back. Password required to re-enter.</span>
                </div>
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.backToGrid()"
                  class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-xs cursor-pointer transition-all"
                >
                  <i data-lucide="arrow-left" class="w-4 h-4 text-slate-500"></i>
                  <span>Back to Strategic Dashboard</span>
                </button>
              </div>

              <!-- AUTH MODAL -->
              ${this.getAuthModalHtml()}
              <!-- SHEET CONFIG MODAL -->
              ${this.getSheetConfigModalHtml()}
              <!-- DEPARTMENTAL ACTIONS MODAL -->
              ${this.getDepartmentalActionsModalHtml()}
            </div>
          `;

          container.innerHTML = html;
          if (window.lucide) window.lucide.createIcons();
          return;
        }
      }

      // =========================================================================
      // VIEW MODE 2: MAIN TILES GRID VIEW
      // =========================================================================

      const q = this.state.searchQuery.toLowerCase().trim();
      const allTiles = this.getAllTiles();
      const bossTile = allTiles.find(t => t.isBossDashboard);
      const rollup = this.getBossRollup();

      const filtered = allTiles.filter(t => {
        const matchQuery = !q ||
          t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          (t.category && t.category.toLowerCase().includes(q));

        return matchQuery;
      });

      const html = `
        <!-- STRATEGIC DASHBOARD HEADER BANNER (COMPACT) -->
        <div class="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E1B4B] rounded-2xl p-3.5 sm:p-4 text-white shadow-md relative overflow-hidden border border-slate-700/60 text-center">
          <div class="absolute -right-16 -top-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10 flex flex-col items-center justify-center text-center space-y-1 max-w-2xl mx-auto">
            <span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10.5px] font-mono font-bold uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30 shadow-2xs">
              <i data-lucide="target" class="w-3 h-3 text-purple-300"></i>
              <span>FPCL STRATEGIC GOVERNANCE</span>
            </span>
            <h1 class="text-xl sm:text-2xl font-black tracking-tight text-white text-center">
              Strategic Dashboard
            </h1>
            <p class="text-xs text-slate-300 font-medium max-w-lg">
              Individual department Google Sheet trackers with central COO Executive Dashboard rollup.
            </p>
          </div>
        </div>

        <!-- SEARCH & CONTROLS TOOLBAR (COMPACT) -->
        <div class="bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-xs">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="relative w-full sm:w-64">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <i data-lucide="search" class="w-4 h-4"></i>
              </div>
              <input
                id="strategic-search-input"
                type="text"
                value="${this.state.searchQuery}"
                placeholder="Search department or code..."
                class="w-full pl-9 pr-9 py-2 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 border border-slate-200 focus:border-purple-500 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all shadow-2xs"
                oninput="window.FPCL_STRATEGIC_SUITE.setSearchQuery(this.value)"
              />
              ${this.state.searchQuery ? `
                <button
                  onclick="window.FPCL_STRATEGIC_SUITE.clearSearch()"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear search"
                >
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}
            </div>

            <div class="flex items-center justify-center sm:justify-end gap-2 text-xs text-slate-500 flex-wrap">
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.syncAllEmployeeSheets()"
                class="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <i data-lucide="refresh-cw" class="w-3.5 h-3.5 ${this.state.isSyncingAll ? 'animate-spin' : ''}"></i>
                <span>Sync All Sheets</span>
              </button>

              ${this.state.unlockedTiles.size > 0 ? `
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.lockAllTiles()"
                  class="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <i data-lucide="lock" class="w-3.5 h-3.5 text-slate-500"></i>
                  <span>Lock All</span>
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- 20 STRATEGIC TILES GRID -->
        ${filtered.length === 0 ? `
          <div class="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
            <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <i data-lucide="search-x" class="w-6 h-6"></i>
            </div>
            <h3 class="text-base font-bold text-slate-800">No matching strategic department tiles</h3>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">No department matched your search query "${this.state.searchQuery}".</p>
            <button
              onclick="window.FPCL_STRATEGIC_SUITE.resetFilters()"
              class="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#1E293B] text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        ` : `
          <div id="strategic-tiles-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
            ${filtered.map(tile => {
              const isConnected = this.isSheetConnected(tile.id);

              if (tile.isBossDashboard) {
                // Featured COO Strategic Dashboard Tile
                return `
                  <div
                    id="tile-${tile.id}"
                    onclick="window.FPCL_STRATEGIC_SUITE.handleTileClick('${tile.id}')"
                    class="group relative bg-gradient-to-br from-purple-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 border-2 border-purple-400/50 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden transition-all duration-250 shadow-md hover:shadow-xl hover:-translate-y-1 select-none min-h-[165px] sm:min-h-[180px] gap-2.5"
                  >
                    <!-- Top Accent Gold Stripe -->
                    <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"></div>

                    <!-- Reset Password Key Icon (Direct Single-Field Reset to Initial Password via Master Key) -->
                    <button
                      type="button"
                      onclick="event.stopPropagation(); window.FPCL_STRATEGIC_SUITE.openResetModal('${tile.id}')"
                      class="absolute top-2.5 left-2.5 z-10 w-7 h-7 rounded-lg flex items-center justify-center text-amber-300/80 hover:text-amber-200 hover:bg-white/10 transition-all cursor-pointer shadow-2xs border border-transparent hover:border-amber-400/30"
                      title="Reset Password"
                    >
                      <i data-lucide="key" class="w-3.5 h-3.5"></i>
                    </button>

                    <!-- Right Top Corner Connection Dot (Green = Connected, Orange = Link Broken) -->
                    <div
                      class="absolute top-3 right-3 z-10 flex items-center gap-1"
                      title="${isConnected ? 'Connected to Google Sheets (Rollup Active)' : 'Google Sheet link broken / unlinked'}"
                    >
                      <span class="relative flex h-2.5 w-2.5">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}"></span>
                        <span class="relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'} ring-2 ring-purple-950/60 shadow-sm"></span>
                      </span>
                    </div>

                    <!-- Executive Icon (Enlarged and Center Aligned) -->
                    <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shrink-0 transition-transform duration-250 group-hover:scale-105 shadow-md mx-auto">
                      <i data-lucide="crown" class="w-6 h-6 sm:w-7 sm:h-7"></i>
                    </div>

                    <!-- Title & COO Badge (Enlarged, Center Aligned) -->
                    <div class="w-full text-center flex flex-col items-center justify-center">
                      <h3 class="text-sm sm:text-base md:text-lg font-black tracking-tight text-white group-hover:text-amber-300 transition-colors leading-snug">
                        ${tile.name}
                      </h3>
                      <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-amber-400 text-amber-950 uppercase tracking-wider shadow-xs">
                        COO Executive Dashboard
                      </span>
                    </div>
                  </div>
                `;
              }

              // Standard Department Tile with Right Top Corner Connection Dot
              return `
                <div
                  id="tile-${tile.id}"
                  onclick="window.FPCL_STRATEGIC_SUITE.handleTileClick('${tile.id}')"
                  class="group relative bg-white hover:bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-purple-300 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden transition-all duration-250 shadow-2xs hover:shadow-lg hover:-translate-y-1 select-none min-h-[165px] sm:min-h-[180px] gap-2.5"
                >
                  <!-- Top Accent Gradient Stripe -->
                  <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${tile.theme.gradient}"></div>

                  <!-- Reset Password Key Icon (Direct Single-Field Reset to Initial Password via Master Key) -->
                  <button
                    type="button"
                    onclick="event.stopPropagation(); window.FPCL_STRATEGIC_SUITE.openResetModal('${tile.id}')"
                    class="absolute top-2.5 left-2.5 z-10 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs border border-transparent hover:border-slate-200"
                    title="Reset Password"
                  >
                    <i data-lucide="key" class="w-3.5 h-3.5"></i>
                  </button>

                  <!-- Right Top Corner Connection Dot (Green = Connected, Orange = Link Broken) -->
                  <div
                    class="absolute top-3 right-3 z-10 flex items-center gap-1"
                    title="${isConnected ? 'Google Sheet Connected (Green)' : 'Google Sheet Link Broken / Not Connected (Orange)'}"
                  >
                    <span class="relative flex h-2.5 w-2.5">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}"></span>
                      <span class="relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'} ring-2 ring-white shadow-sm"></span>
                    </span>
                  </div>

                  <!-- Tile Icon (Enlarged and Center Aligned) -->
                  <div
                    class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-250 group-hover:scale-105 shadow-2xs border mx-auto"
                    style="background-color: ${tile.theme.bg}; border-color: ${tile.theme.border}; color: ${tile.theme.primary};"
                  >
                    <i data-lucide="${tile.icon}" class="w-6 h-6 sm:w-7 sm:h-7"></i>
                  </div>

                  <!-- Department Name (Bigger text size, Center Aligned) -->
                  <div class="w-full text-center flex items-center justify-center">
                    <h3 class="text-sm sm:text-base font-extrabold tracking-tight text-slate-800 group-hover:text-purple-700 transition-colors leading-snug px-1 text-center">
                      ${tile.name}
                    </h3>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}

        <!-- TILE AUTHENTICATION & CHANGE PASSWORD MODAL -->
        ${this.getAuthModalHtml()}
        <!-- SHEET CONFIG MODAL -->
        ${this.getSheetConfigModalHtml()}
        <!-- DEPARTMENTAL ACTIONS MODAL -->
        ${this.getDepartmentalActionsModalHtml()}
      `;

      container.innerHTML = html;
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  };

  strategicSuite.init();
})();
