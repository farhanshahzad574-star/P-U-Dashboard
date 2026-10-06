/**
 * FPCL Executive Operations & Compliance Portal
 * Safety Talks Specialized Executive BI Suite
 * 
 * Google Sheet ID: 1Fgx9ZEdHAQnH_oCuX0NdNO5_V3gEPHu0xjnqKk6GqWc
 * Tab: Safety_Talk
 * 
 * Target Scope & Isolation: Performs calculations and data syncing strictly for
 * the Safety_Talk tab on sheet 1Fgx9ZEdHAQnH_oCuX0NdNO5_V3gEPHu0xjnqKk6GqWc.
 */

(function () {
  'use strict';

  const SAFETY_TALK_SPREADSHEET_ID = '1Fgx9ZEdHAQnH_oCuX0NdNO5_V3gEPHu0xjnqKk6GqWc';
  const SAFETY_TALK_TAB = 'Safety_Talk';

  // Direct published Google Sheets CSV endpoint
  const SAFETY_TALK_CSV_URL = `https://docs.google.com/spreadsheets/d/${SAFETY_TALK_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SAFETY_TALK_TAB)}`;

  const safetyTalkSuite = {
    state: {
      searchQuery: '',
      yearFilter: String(new Date().getFullYear()), // Opens dynamically on current year filter
      userHasChangedYear: false, // Tracks if user manually changed the year filter after opening
      deptFilter: 'all',
      stStatusFilter: 'all', // 'all', 'yes', 'no'
      rStatusFilter: 'all',  // 'all', 'open', 'close'
      isSyncing: false,
      lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSettingsOpen: false,
      activeTooltipItem: null,
      tableScrollPos: 0
    },

    init() {
      window.FPCL_SAFETY_TALK_SUITE = this;

      // Try reading Safety Talks from localStorage cache
      try {
        const cached = localStorage.getItem('FPCL_SAFETY_TALK_CACHE');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.FPCL_SAFETY_TALK_DATA = parsed;
          }
        }
      } catch (e) {}

      // Fallback to initial seed if not yet loaded
      if (!window.FPCL_SAFETY_TALK_DATA || window.FPCL_SAFETY_TALK_DATA.length === 0) {
        if (window.FPCL_SAFETY_TALK_INITIAL_SEED) {
          window.FPCL_SAFETY_TALK_DATA = window.FPCL_SAFETY_TALK_INITIAL_SEED.slice();
        }
      }

      // Default year filter to dynamic current year
      if (!this.state.userHasChangedYear) {
        this.state.yearFilter = this.getDefaultYear();
      }

      // Propagate stats to overview registry
      this.syncStatsToOverview();

      // Trigger immediate live background sync with Google Sheet
      setTimeout(() => {
        this.syncLiveFeed({ silent: true });
      }, 250);

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
      if (Array.isArray(window.FPCL_SAFETY_TALK_DATA) && window.FPCL_SAFETY_TALK_DATA.length > 0) {
        return window.FPCL_SAFETY_TALK_DATA;
      }
      if (Array.isArray(window.FPCL_SAFETY_TALK_INITIAL_SEED) && window.FPCL_SAFETY_TALK_INITIAL_SEED.length > 0) {
        return window.FPCL_SAFETY_TALK_INITIAL_SEED;
      }
      return [];
    },

    /**
     * Extracts a 4-digit year string from Column D (Planned Date)
     */
    extractYear(dateStr) {
      if (!dateStr) return '';
      const s = String(dateStr).trim();
      if (!s) return '';
      const fourDigitMatch = s.match(/\b(19\d\d|20\d\d)\b/);
      if (fourDigitMatch) {
        return fourDigitMatch[1];
      }
      const twoDigitMatch = s.match(/[-/](\d{2})(?:\s|$|[^\d])/);
      if (twoDigitMatch) {
        const yr = parseInt(twoDigitMatch[1], 10);
        if (yr >= 15 && yr <= 45) return String(2000 + yr);
      }
      return '';
    },

    /**
     * Determine default year:
     * Opens dynamically on current year filter (e.g. 2026)
     */
    getDefaultYear() {
      const currentYear = String(new Date().getFullYear());
      return currentYear;
    },

    /**
     * Extract unique years from raw data for filter dropdown
     */
    getAvailableYears() {
      const raw = this.getRawData();
      const yearsSet = new Set();
      const currentYear = String(new Date().getFullYear());

      // Always include current year dynamically so it is available in the dropdown
      yearsSet.add(currentYear);

      raw.forEach(row => {
        const y = row.year || this.extractYear(row.plannedDate || row.actualDate);
        if (y) yearsSet.add(y);
      });

      const list = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
      return list;
    },

    /**
     * Extract unique departments from Column B (Dept)
     */
    getAvailableDepartments() {
      const raw = this.getRawData();
      const depts = new Set();
      raw.forEach(row => {
        const d = String(row.dept || '').trim();
        if (d && d !== '-' && d.toLowerCase() !== 'n/a') {
          depts.add(d);
        }
      });
      return Array.from(depts).sort();
    },

    /**
     * Parse raw CSV into structured Safety Talk records
     */
    parseCsv(csvText) {
      if (!csvText || typeof csvText !== 'string') return [];
      const lines = [];
      let row = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < csvText.length; i++) {
        const c = csvText[i];
        if (c === '"') {
          if (inQuotes && csvText[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
          if (c === '\r' && csvText[i + 1] === '\n') i++;
          row.push(current.trim());
          current = '';
          if (row.length > 1 || (row[0] && row[0] !== '')) {
            lines.push(row);
          }
          row = [];
        } else {
          current += c;
        }
      }
      if (current.length > 0 || row.length > 0) {
        row.push(current.trim());
        lines.push(row);
      }

      if (lines.length < 2) return [];

      const headers = lines[0].map(h => String(h || '').trim());
      const colMap = {};
      headers.forEach((h, idx) => {
        const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        colMap[clean] = idx;
      });

      const getCol = (r, aliases, fallbackIdx) => {
        for (const a of aliases) {
          const idx = colMap[a.toLowerCase().replace(/[^a-z0-9]/g, '')];
          if (idx !== undefined && r[idx] !== undefined) {
            return String(r[idx]).trim();
          }
        }
        if (fallbackIdx !== undefined && r[fallbackIdx] !== undefined) {
          return String(r[fallbackIdx]).trim();
        }
        return '';
      };

      const records = [];
      for (let i = 1; i < lines.length; i++) {
        const r = lines[i];
        if (!r || r.length < 2) continue;

        const sr = getCol(r, ['sr', 'sr#', 'sno', 'id'], 0);
        const dept = getCol(r, ['dept', 'department'], 1);
        const shift = getCol(r, ['shift'], 2);
        const plannedDate = getCol(r, ['planneddate', 'planned_date', 'plan_date'], 3);
        const actualDate = getCol(r, ['actualdate', 'actual_date'], 4);
        const feedbackSubmissionDate = getCol(r, ['feedbacksubmissiondate', 'feedback_date'], 5);
        const feedbackSubmission = getCol(r, ['feedbacksubmission', 'feedback_submission'], 6);
        const stStatus = getCol(r, ['ststatus', 'st_status', 'safetytalkstatus'], 7);
        const plannedTopic = getCol(r, ['plannedtopic', 'planned_topic', 'topic'], 8);
        const actualTopic = getCol(r, ['actualtopic', 'actual_topic'], 9);
        const plannedSpeaker = getCol(r, ['plannedspeaker', 'planned_speaker'], 10);
        const backupSpeaker = getCol(r, ['backupspeaker', 'backup_speaker'], 11);
        const actualSpeaker = getCol(r, ['actualspeaker', 'actual_speaker'], 12);
        const plannedTopicDelivered = getCol(r, ['plannedtopicdelivered', 'topicdelivered'], 13);
        const recommendations = getCol(r, ['recommendations', 'recommendation', 'recs'], 14);
        const rStatus = getCol(r, ['rstatus', 'r_status', 'recommendationstatus'], 15);
        const pendingWith = getCol(r, ['pendingwithresponsibleunit', 'pendingwith', 'responsibleunit'], 16);
        const targetDate = getCol(r, ['targetdate', 'target_date'], 17);
        const closureDate = getCol(r, ['closuredate', 'closure_date'], 18);
        const remarks = getCol(r, ['remarks', 'remark', 'notes'], 19);

        if (sr || dept || plannedTopic || stStatus) {
          records.push({
            sr: sr || String(records.length + 1),
            dept: dept || 'Unassigned',
            shift: shift || '',
            plannedDate: plannedDate || '',
            actualDate: actualDate || '',
            year: this.extractYear(plannedDate || actualDate) || '',
            feedbackSubmissionDate: feedbackSubmissionDate || '',
            feedbackSubmission: feedbackSubmission || '',
            stStatus: stStatus || 'No',
            plannedTopic: plannedTopic || '',
            actualTopic: actualTopic || '',
            plannedSpeaker: plannedSpeaker || '',
            backupSpeaker: backupSpeaker || '',
            actualSpeaker: actualSpeaker || '',
            plannedTopicDelivered: plannedTopicDelivered || '',
            recommendations: recommendations || '',
            rStatus: rStatus || '',
            pendingWith: pendingWith || '',
            targetDate: targetDate || '',
            closureDate: closureDate || '',
            remarks: remarks || ''
          });
        }
      }

      return records;
    },

    /**
     * Filter data according to active state:
     * - Year (from Column D Planned Date)
     * - Dept (from Column B Dept)
     * - ST Status (from Column H ST Status: Yes/No)
     * - R Status (from Column P R Status: Open/Close)
     * - Search Query
     */
    getFilteredData() {
      const raw = this.getRawData();
      const { searchQuery, yearFilter, deptFilter, stStatusFilter, rStatusFilter } = this.state;
      const q = (searchQuery || '').toLowerCase().trim();

      return raw.filter(row => {
        // 1. Year Filter
        if (yearFilter && yearFilter !== 'all') {
          const rowYear = row.year || this.extractYear(row.plannedDate || row.actualDate);
          if (rowYear !== yearFilter) return false;
        }

        // 2. Department Filter
        if (deptFilter && deptFilter !== 'all') {
          if (String(row.dept || '').trim().toLowerCase() !== deptFilter.toLowerCase()) {
            return false;
          }
        }

        // 3. ST Status Filter (Yes / No)
        if (stStatusFilter && stStatusFilter !== 'all') {
          const s = String(row.stStatus || '').trim().toLowerCase();
          const isYes = s === 'yes' || s === 'conducted' || s === 'delivered' || s === 'true';
          if (stStatusFilter === 'yes' && !isYes) return false;
          if (stStatusFilter === 'no' && isYes) return false;
        }

        // 4. R Status Filter (Open / Close)
        if (rStatusFilter && rStatusFilter !== 'all') {
          const rs = String(row.rStatus || '').trim().toLowerCase();
          const isOpen = rs === 'open';
          const isClose = rs === 'close' || rs === 'closed';
          if (rStatusFilter === 'open' && !isOpen) return false;
          if (rStatusFilter === 'close' && !isClose) return false;
        }

        // 5. Search Query
        if (q) {
          const searchHaystack = [
            row.sr,
            row.dept,
            row.shift,
            row.plannedDate,
            row.actualDate,
            row.stStatus,
            row.plannedTopic,
            row.actualTopic,
            row.plannedSpeaker,
            row.actualSpeaker,
            row.recommendations,
            row.rStatus,
            row.pendingWith,
            row.remarks
          ].join(' ').toLowerCase();

          if (!searchHaystack.includes(q)) return false;
        }

        return true;
      });
    },

    /**
     * Compute 8 KPIs exactly as specified:
     * 1. Planned Safety Talks from column A named Sr .
     * 2. Delivered Safety talks from column H named ST Status (Yes)
     * 3. Missing Safety Talks from difference of KPI 1 and 2
     * 4. Talk Completion Rate in percentage from KPI 1 and KPI 2
     * 5. Recommendations from Safety Talk from column O named Recommendations (empty cells not counted)
     * 6. Closed Recommendations from column P named R Status (only count open/close, other text ignored, empty not counted)
     * 7. Open Recommendations from column P named R Status (only count open/close, other text ignored, empty not counted)
     * 8. Recommendations Resolution Rate in percentage from KPI 5 and 6
     */
    calculateKpis(data) {
      const records = Array.isArray(data) ? data : this.getFilteredData();

      // KPI 1: Planned Safety Talks from Column A named Sr
      const plannedTalks = records.filter(r => r.sr && String(r.sr).trim() !== '').length;

      // KPI 2: Delivered Safety Talks from Column H named ST Status
      const deliveredTalks = records.filter(r => {
        const s = String(r.stStatus || '').trim().toLowerCase();
        return s === 'yes' || s === 'conducted' || s === 'delivered' || s === 'true';
      }).length;

      // KPI 3: Missing Safety Talks from difference of KPI 1 and 2
      const missingTalks = Math.max(0, plannedTalks - deliveredTalks);

      // KPI 4: Talk Completion Rate in percentage from KPI 1 and 2
      const talkCompletionRate = plannedTalks > 0
        ? ((deliveredTalks / plannedTalks) * 100).toFixed(1) + '%'
        : '0.0%';
      const talkCompletionRateNum = plannedTalks > 0
        ? Math.round((deliveredTalks / plannedTalks) * 100)
        : 0;

      // KPI 5: Recommendations from Safety Talk from Column O named Recommendations
      // "if cells are empty dont count them in calculations"
      const recsRows = records.filter(r => {
        if (!r.recommendations) return false;
        const recText = String(r.recommendations).trim().toLowerCase();
        return recText !== '' && recText !== '-' && recText !== 'no recommendations' && recText !== 'n/a';
      });
      const recommendationsCount = recsRows.length;

      // KPI 6: Closed Recommendations from Column P named R Status
      // "only count open close and any text other than open close don’t count, if cell is empty don’t count"
      const closedRecs = records.filter(r => {
        if (!r.rStatus) return false;
        const s = String(r.rStatus).trim().toLowerCase();
        return s === 'close' || s === 'closed';
      }).length;

      // KPI 7: Open Recommendations from Column P named R Status
      // "only count open close and any text other than open close don’t count, if cell is empty don’t count"
      const openRecs = records.filter(r => {
        if (!r.rStatus) return false;
        const s = String(r.rStatus).trim().toLowerCase();
        return s === 'open';
      }).length;

      // KPI 8: Recommendations Resolution Rate in percentage from KPI 5 and 6
      // If recommendationsCount is 0 but closedRecs + openRecs > 0, base on (closedRecs / (closedRecs + openRecs))
      const totalRecsBase = recommendationsCount > 0 ? recommendationsCount : (closedRecs + openRecs);
      const resolutionRate = totalRecsBase > 0
        ? ((closedRecs / totalRecsBase) * 100).toFixed(1) + '%'
        : '0.0%';
      const resolutionRateNum = totalRecsBase > 0
        ? Math.round((closedRecs / totalRecsBase) * 100)
        : 0;

      return {
        plannedTalks,
        deliveredTalks,
        missingTalks,
        talkCompletionRate,
        talkCompletionRateNum,
        recommendationsCount,
        closedRecs,
        openRecs,
        resolutionRate,
        resolutionRateNum
      };
    },

    /**
     * Compute Department-wise Safety Talk status (for stacked bar chart)
     */
    getDepartmentStats(data) {
      const records = Array.isArray(data) ? data : this.getFilteredData();
      const deptMap = {};

      records.forEach(r => {
        const d = String(r.dept || 'Unassigned').trim();
        if (!deptMap[d]) {
          deptMap[d] = {
            dept: d,
            total: 0,
            yes: 0,
            no: 0,
            closedRecs: 0,
            openRecs: 0
          };
        }
        deptMap[d].total++;
        const s = String(r.stStatus || '').trim().toLowerCase();
        if (s === 'yes' || s === 'conducted' || s === 'delivered' || s === 'true') {
          deptMap[d].yes++;
        } else {
          deptMap[d].no++;
        }

        const rs = String(r.rStatus || '').trim().toLowerCase();
        if (rs === 'close' || rs === 'closed') {
          deptMap[d].closedRecs++;
        } else if (rs === 'open') {
          deptMap[d].openRecs++;
        }
      });

      return Object.values(deptMap).sort((a, b) => b.total - a.total);
    },

    /**
     * Sync stats to Overview DASHBOARD_REGISTRY entry
     */
    syncStatsToOverview() {
      const kpis = this.calculateKpis(this.getRawData());
      if (Array.isArray(window.DASHBOARD_REGISTRY)) {
        const item = window.DASHBOARD_REGISTRY.find(d => d.id === 'safety-talks');
        if (item) {
          item.status = 'Active';
          item.hasSheetLink = true;
          item.kpis = {
            total: kpis.plannedTalks,
            closed: kpis.deliveredTalks,
            inProgress: kpis.missingTalks,
            overdue: 0,
            compliance: kpis.talkCompletionRate
          };
          item.punchList = {
            open: kpis.missingTalks,
            closed: kpis.deliveredTalks,
            total: kpis.plannedTalks,
            rate: kpis.talkCompletionRate
          };
          item.statusComment = `${kpis.plannedTalks} Planned Safety Talks (${kpis.deliveredTalks} Delivered, ${kpis.missingTalks} Missing • ${kpis.talkCompletionRate} Completion).`;
        }
      }
    },

    /**
     * Live Feed Synchronizer: fetches published CSV dynamically
     */
    async syncLiveFeed(options = {}) {
      const silent = Boolean(options.silent);
      if (this.state.isSyncing) return;
      this.state.isSyncing = true;
      this.updateSyncButtonState(true);

      const now = Date.now();
      const urls = [
        `/api/safety-talks?_t=${now}`,
        `${SAFETY_TALK_CSV_URL}&_t=${now}&_nocache=${Math.random()}`,
        `/api/sheets/fetch?sheetId=${SAFETY_TALK_SPREADSHEET_ID}&sheetTab=${encodeURIComponent(SAFETY_TALK_TAB)}&_t=${now}`
      ];

      let fetchedCsv = '';
      let directRecords = null;

      for (const u of urls) {
        try {
          const resp = await fetch(u, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          });
          if (resp.ok) {
            const rawText = await resp.text();
            const trimmed = (rawText || '').trim();

            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
              try {
                const j = JSON.parse(trimmed);
                if (j.success && Array.isArray(j.records) && j.records.length > 0) {
                  directRecords = j.records;
                  break;
                } else if (j.success && typeof j.csvText === 'string' && j.csvText.length > 0) {
                  fetchedCsv = j.csvText;
                  break;
                } else if (typeof j.csvText === 'string' && j.csvText.length > 0) {
                  fetchedCsv = j.csvText;
                  break;
                } else if (Array.isArray(j.data) && j.data.length > 0) {
                  directRecords = j.data;
                  break;
                }
              } catch (_jsonErr) {}
            } else if (!trimmed.includes('<!DOCTYPE html>') && (
              trimmed.includes('ST Status') || trimmed.includes('Planned Date') ||
              trimmed.includes('Dept') || trimmed.includes('Sr')
            )) {
              fetchedCsv = trimmed;
              break;
            }
          }
        } catch (_err) {
          // try next candidate URL
        }
      }

      this.state.isSyncing = false;
      this.updateSyncButtonState(false);

      let parsed = [];
      if (directRecords && directRecords.length > 0) {
        parsed = directRecords;
      } else if (fetchedCsv) {
        parsed = this.parseCsv(fetchedCsv);
      }

      if (parsed.length > 0) {
        window.FPCL_SAFETY_TALK_DATA = parsed;
        try {
          localStorage.setItem('FPCL_SAFETY_TALK_CACHE', JSON.stringify(parsed));
        } catch (e) {}

        this.state.lastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        this.syncStatsToOverview();

        if (window.portalApp && typeof window.portalApp.renderComparisonChart === 'function') {
          window.portalApp.renderComparisonChart();
        }

        // Re-render whenever Safety Talks dashboard container is visible
        const container = document.getElementById('safety-talks-specialized-container');
        if (container && !container.classList.contains('hidden') && !container.hidden) {
          this.render();
        }

        if (!silent && window.portalApp && typeof window.portalApp.showToast === 'function') {
          window.portalApp.showToast('Safety Talks Synced', `Updated ${parsed.length} safety talk records from live Google Sheet.`, 'success');
        }
        return;
      }

      if (!silent && window.portalApp && typeof window.portalApp.showToast === 'function') {
        window.portalApp.showToast('Sync Notice', 'Using existing Safety Talks records.', 'info');
      }
    },

    updateSyncButtonState(isSpinning) {
      const syncBtn = document.getElementById('safety-talk-sync-btn');
      const syncIcon = document.getElementById('safety-talk-sync-icon');
      if (syncIcon) {
        if (isSpinning) {
          syncIcon.classList.add('animate-spin');
        } else {
          syncIcon.classList.remove('animate-spin');
        }
      }
      if (syncBtn) {
        syncBtn.disabled = isSpinning;
      }
    },

    /**
     * Filter handlers
     */
    setYearFilter(y) {
      this.state.userHasChangedYear = true;
      this.state.yearFilter = y;
      this.render();
    },

    setDeptFilter(d) {
      this.state.deptFilter = d;
      this.render();
    },

    setStStatusFilter(s) {
      this.state.stStatusFilter = s;
      this.render();
    },

    setRStatusFilter(rs) {
      this.state.rStatusFilter = rs;
      this.render();
    },

    setSearch(q) {
      this.state.searchQuery = q;
      this.render();
    },

    resetFilters() {
      this.state.searchQuery = '';
      this.state.yearFilter = this.getDefaultYear();
      this.state.userHasChangedYear = false;
      this.state.deptFilter = 'all';
      this.state.stStatusFilter = 'all';
      this.state.rStatusFilter = 'all';
      this.render();
    },

    /**
     * Export currently filtered records to CSV
     */
    exportFilteredCSV() {
      const data = this.getFilteredData();
      if (!data || data.length === 0) {
        if (window.portalApp && typeof window.portalApp.showToast === 'function') {
          window.portalApp.showToast('No Records', 'No Safety Talks records match your active filter.', 'warning');
        }
        return;
      }

      const headers = [
        'Sr',
        'Dept',
        'Shift',
        'Planned Date',
        'Actual Date',
        'Feedback Submission date',
        'Feedback Submission',
        'ST Status',
        'Planned Topic',
        'Actual Topic',
        'Planned Speaker',
        'Backup Speaker',
        'Actual Speaker',
        'Planned Topic Delivered',
        'Recommendations',
        'R Status',
        'Pending with (Responsible Unit)',
        'Target Date',
        'Closure date',
        'Remarks'
      ];

      const csvRows = data.map(r => [
        `"${String(r.sr || '').replace(/"/g, '""')}"`,
        `"${String(r.dept || '').replace(/"/g, '""')}"`,
        `"${String(r.shift || '').replace(/"/g, '""')}"`,
        `"${String(r.plannedDate || '').replace(/"/g, '""')}"`,
        `"${String(r.actualDate || '').replace(/"/g, '""')}"`,
        `"${String(r.feedbackSubmissionDate || '').replace(/"/g, '""')}"`,
        `"${String(r.feedbackSubmission || '').replace(/"/g, '""')}"`,
        `"${String(r.stStatus || '').replace(/"/g, '""')}"`,
        `"${String(r.plannedTopic || '').replace(/"/g, '""')}"`,
        `"${String(r.actualTopic || '').replace(/"/g, '""')}"`,
        `"${String(r.plannedSpeaker || '').replace(/"/g, '""')}"`,
        `"${String(r.backupSpeaker || '').replace(/"/g, '""')}"`,
        `"${String(r.actualSpeaker || '').replace(/"/g, '""')}"`,
        `"${String(r.plannedTopicDelivered || '').replace(/"/g, '""')}"`,
        `"${String(r.recommendations || '').replace(/"/g, '""')}"`,
        `"${String(r.rStatus || '').replace(/"/g, '""')}"`,
        `"${String(r.pendingWith || '').replace(/"/g, '""')}"`,
        `"${String(r.targetDate || '').replace(/"/g, '""')}"`,
        `"${String(r.closureDate || '').replace(/"/g, '""')}"`,
        `"${String(r.remarks || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...csvRows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `FPCL_Safety_Talks_Filtered_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (window.portalApp && typeof window.portalApp.showToast === 'function') {
        window.portalApp.showToast('Export Successful', `Exported ${data.length} Safety Talk records based on active filters.`, 'success');
      }
    },

    /**
     * Smooth table scrolling left / right
     */
    scrollTable(direction) {
      const container = document.getElementById('safety-talk-table-container');
      if (container) {
        const delta = direction === 'left' ? -380 : 380;
        container.scrollBy({ left: delta, behavior: 'smooth' });
      }
    },

    /**
     * Dashboard Entrypoint: Called when Safety Talks view is selected
     * Make it open by default dynamically on current year filter.
     * After opening, if year filter is changed then it should NOT auto-change to current year.
     */
    onOpen() {
      if (!window.FPCL_SAFETY_TALK_DATA || window.FPCL_SAFETY_TALK_DATA.length === 0) {
        if (window.FPCL_SAFETY_TALK_INITIAL_SEED) {
          window.FPCL_SAFETY_TALK_DATA = window.FPCL_SAFETY_TALK_INITIAL_SEED.slice();
        }
      }

      // If user has not changed the year filter, open by default dynamically on current year filter
      if (!this.state.userHasChangedYear) {
        this.state.yearFilter = this.getDefaultYear();
      }

      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Trigger immediate background sync with live Google Sheet
      this.syncLiveFeed({ silent: true });
    },

    /**
     * Main Render Function
     */
    render() {
      const container = document.getElementById('safety-talks-specialized-container');
      if (!container) return;

      const filteredData = this.getFilteredData();
      const kpis = this.calculateKpis(filteredData);
      const deptStats = this.getDepartmentStats(filteredData);
      const availableYears = this.getAvailableYears();
      const availableDepts = this.getAvailableDepartments();

      container.innerHTML = `
        <div class="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
          
          <!-- ========================================================================= -->
          <!-- 1. COLORFUL EYE-CATCHING TOP BANNER                                       -->
          <!-- Modern stylish gradient: Deep Cobalt Sapphire & Electric Azure/Cyan       -->
          <!-- Only heading & important feature buttons, no irrelevant info text         -->
          <!-- ========================================================================= -->
          <div
            id="safety-talk-banner"
            class="relative overflow-hidden rounded-2xl p-4 sm:p-6 shadow-xl border border-sky-400/30 text-white"
            style="background: linear-gradient(135deg, #091E3A 0%, #103B6B 35%, #0284C7 70%, #06B6D4 100%);"
          >
            <!-- Subtle luminous gradient glows -->
            <div class="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-600/25 blur-3xl pointer-events-none"></div>

            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
              
              <!-- Left: Banner Heading (No extra irrelevant text) -->
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/15 backdrop-blur-md text-white flex items-center justify-center shrink-0 border border-white/25 shadow-inner">
                  <i data-lucide="messages-square" class="w-6 h-6 text-cyan-200"></i>
                </div>
                <div>
                  <h2 class="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight m-0">
                    Safety Talks
                  </h2>
                </div>
              </div>

              <!-- Right: Important Feature Buttons matching reference design -->
              <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 self-start md:self-auto">
                
                <!-- Search Findings Button / Input -->
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-white/70">
                    <i data-lucide="search" class="w-3.5 h-3.5"></i>
                  </div>
                  <input
                    id="safety-talk-search-input"
                    type="text"
                    value="${this.state.searchQuery || ''}"
                    placeholder="SEARCH FINDINGS"
                    class="pl-8 pr-7 py-1.5 bg-white/15 hover:bg-white/20 focus:bg-white text-white focus:text-slate-900 placeholder:text-white/80 focus:placeholder:text-slate-400 border border-white/30 focus:border-white rounded-lg text-xs font-bold tracking-wider uppercase transition-all outline-none shadow-inner w-36 sm:w-44"
                    oninput="FPCL_SAFETY_TALK_SUITE.setSearch(this.value)"
                  />
                  ${this.state.searchQuery ? `
                    <button
                      type="button"
                      onclick="FPCL_SAFETY_TALK_SUITE.setSearch('')"
                      class="absolute inset-y-0 right-0 pr-2 flex items-center text-white/80 hover:text-white cursor-pointer"
                    >
                      <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    </button>
                  ` : ''}
                </div>

                <!-- Reset Filters Button -->
                <button
                  type="button"
                  id="safety-talk-reset-btn"
                  onclick="FPCL_SAFETY_TALK_SUITE.resetFilters()"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-white/15 hover:bg-white/25 active:bg-white/30 border border-white/30 backdrop-blur-md shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                  title="Reset all filters to default"
                >
                  <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                  <span>Reset Filters</span>
                </button>

                <!-- Export CSV Button -->
                <button
                  type="button"
                  id="safety-talk-export-btn"
                  onclick="FPCL_SAFETY_TALK_SUITE.exportFilteredCSV()"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-white/15 hover:bg-white/25 active:bg-white/30 border border-white/30 backdrop-blur-md shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                  title="Export filtered Safety Talks to CSV"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>Export CSV</span>
                </button>

                <!-- Sync Feed Button -->
                <button
                  type="button"
                  id="safety-talk-sync-btn"
                  onclick="FPCL_SAFETY_TALK_SUITE.syncLiveFeed({ silent: false })"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-white/20 hover:bg-white/30 active:bg-white/35 border border-white/35 backdrop-blur-md shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                  title="Refresh live feed from Google Sheet"
                >
                  <i id="safety-talk-sync-icon" data-lucide="refresh-cw" class="w-3.5 h-3.5 ${this.state.isSyncing ? 'animate-spin' : ''}"></i>
                  <span>Sync Feed</span>
                </button>

                <!-- Settings / Info Button -->
                <button
                  type="button"
                  onclick="FPCL_SAFETY_TALK_SUITE.toggleSettingsModal()"
                  class="p-1.5 rounded-lg text-white bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md shadow-xs transition-all cursor-pointer"
                  title="Google Sheet Link Settings"
                >
                  <i data-lucide="settings" class="w-4 h-4"></i>
                </button>
              </div>

            </div>
          </div>


          <!-- ========================================================================= -->
          <!-- 2. 8 BESPOKE KPI CARDS                                                    -->
          <!-- Perimeter Borders: Custom border along the outer perimeter (edges)        -->
          <!-- Unique Color Scheme for each KPI box                                      -->
          <!-- Large center-aligned font, only heading & value (red for open points)     -->
          <!-- ========================================================================= -->
          <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
            
            <!-- KPI 1: Planned Safety Talks (Column A Sr) -->
            <div
              class="relative overflow-hidden rounded-xl p-3 sm:p-4 text-center flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-2xs hover:shadow-md"
              style="background: linear-gradient(180deg, #F0F9FF 0%, #FFFFFF 100%); border: 2px solid #0284C7;"
            >
              <div class="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-sky-800 leading-tight">
                Planned Safety Talks
              </div>
              <div class="text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-[#0369A1] my-2 leading-none">
                ${kpis.plannedTalks}
              </div>
            </div>

            <!-- KPI 2: Delivered Safety talks (Column H ST Status) -->
            <div
              class="relative overflow-hidden rounded-xl p-3 sm:p-4 text-center flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-2xs hover:shadow-md"
              style="background: linear-gradient(180deg, #ECFDF5 0%, #FFFFFF 100%); border: 2px solid #059669;"
            >
              <div class="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-emerald-800 leading-tight">
                Delivered Safety talks
              </div>
              <div class="text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-[#047857] my-2 leading-none">
                ${kpis.deliveredTalks}
              </div>
            </div>

            <!-- KPI 3: Missing Safety Talks (Difference of KPI 1 and 2) -->
            <div
              class="relative overflow-hidden rounded-xl p-3 sm:p-4 text-center flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-2xs hover:shadow-md"
              style="background: linear-gradient(180deg, #FFFBEB 0%, #FFFFFF 100%); border: 2px solid #D97706;"
            >
              <div class="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-amber-900 leading-tight">
                Missing Safety Talks
              </div>
              <div class="text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-[#B45309] my-2 leading-none">
                ${kpis.missingTalks}
              </div>
            </div>

            <!-- KPI 4: Talk Completion Rate (Percentage from KPI 1 and 2) -->
            <div
              class="relative overflow-hidden rounded-xl p-3 sm:p-4 text-center flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-2xs hover:shadow-md"
              style="background: linear-gradient(180deg, #F5F3FF 0%, #FFFFFF 100%); border: 2px solid #7C3AED;"
            >
              <div class="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-violet-900 leading-tight">
                Talk Completion Rate
              </div>
              <div class="text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-[#6D28D9] my-2 leading-none">
                ${kpis.talkCompletionRate}
              </div>
            </div>

            <!-- KPI 5: Recommendations from Safety Talk (Column O Recommendations) -->
            <div
              class="relative overflow-hidden rounded-xl p-3 sm:p-4 text-center flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-2xs hover:shadow-md"
              style="background: linear-gradient(180deg, #ECFEFF 0%, #FFFFFF 100%); border: 2px solid #0891B2;"
            >
              <div class="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-cyan-900 leading-tight">
                Recommendations
              </div>
              <div class="text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-[#0E7490] my-2 leading-none">
                ${kpis.recommendationsCount}
              </div>
            </div>

            <!-- KPI 6: Closed Recommendations (Column P R Status) -->
            <div
              class="relative overflow-hidden rounded-xl p-3 sm:p-4 text-center flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-2xs hover:shadow-md"
              style="background: linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%); border: 2px solid #0B8A5A;"
            >
              <div class="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-emerald-900 leading-tight">
                Closed Recommendations
              </div>
              <div class="text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-[#0B8A5A] my-2 leading-none">
                ${kpis.closedRecs}
              </div>
            </div>

            <!-- KPI 7: Open Recommendations (Column P R Status - Solid Red Color) -->
            <div
              class="relative overflow-hidden rounded-xl p-3 sm:p-4 text-center flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-2xs hover:shadow-md"
              style="background: linear-gradient(180deg, #FEF2F2 0%, #FFFFFF 100%); border: 2px solid #DC2626;"
            >
              <div class="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-red-900 leading-tight">
                Open Recommendations
              </div>
              <div class="text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-[#DC2626] my-2 leading-none">
                ${kpis.openRecs}
              </div>
            </div>

            <!-- KPI 8: Recommendations Resolution Rate (Percentage from KPI 5 & 6) -->
            <div
              class="relative overflow-hidden rounded-xl p-3 sm:p-4 text-center flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-2xs hover:shadow-md"
              style="background: linear-gradient(180deg, #FFF1F2 0%, #FFFFFF 100%); border: 2px solid #E11D48;"
            >
              <div class="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-rose-900 leading-tight">
                Resolution Rate
              </div>
              <div class="text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-[#BE123C] my-2 leading-none">
                ${kpis.resolutionRate}
              </div>
            </div>

          </div>


          <!-- ========================================================================= -->
          <!-- 3. DYNAMIC FILTERS BAR                                                     -->
          <!-- No heading given to filter banner, simply displayed                        -->
          <!-- Mobile view: side by side to save space                                    -->
          <!-- Year (Col D), Dept (Col B), ST Status (Col H), R Status (Col P)           -->
          <!-- Perimeter border with unique gradient                                     -->
          <!-- ========================================================================= -->
          <div
            id="safety-talk-filters-box"
            class="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-4 shadow-sm transition-all"
            style="border: 2px solid #38BDF8;"
          >
            <!-- Grid: 4 filters side by side on mobile and desktop -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              
              <!-- Filter 1: Year (Column D Planned Date - opens dynamically on current year) -->
              <div class="min-w-0">
                <div class="relative">
                  <select
                    id="filter-safety-year"
                    onchange="FPCL_SAFETY_TALK_SUITE.setYearFilter(this.value)"
                    class="w-full pl-2.5 pr-7 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-xs font-bold text-slate-800 shadow-2xs transition-all cursor-pointer outline-none appearance-none truncate"
                    title="Filter by Planned Year (Column D)"
                  >
                    <option value="all" ${this.state.yearFilter === 'all' ? 'selected' : ''}>All Years</option>
                    ${availableYears.map(y => `
                      <option value="${y}" ${this.state.yearFilter === String(y) ? 'selected' : ''}>Year: ${y}</option>
                    `).join('')}
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                  </div>
                </div>
              </div>

              <!-- Filter 2: Responsible Department (Column B Dept) -->
              <div class="min-w-0">
                <div class="relative">
                  <select
                    id="filter-safety-dept"
                    onchange="FPCL_SAFETY_TALK_SUITE.setDeptFilter(this.value)"
                    class="w-full pl-2.5 pr-7 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-xs font-bold text-slate-800 shadow-2xs transition-all cursor-pointer outline-none appearance-none truncate"
                    title="Filter by Responsible Department (Column B)"
                  >
                    <option value="all" ${this.state.deptFilter === 'all' ? 'selected' : ''}>All Departments</option>
                    ${availableDepts.map(d => `
                      <option value="${d}" ${this.state.deptFilter.toLowerCase() === d.toLowerCase() ? 'selected' : ''}>Dept: ${d}</option>
                    `).join('')}
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                  </div>
                </div>
              </div>

              <!-- Filter 3: ST Status Yes / No (Column H ST Status) -->
              <div class="min-w-0">
                <div class="relative">
                  <select
                    id="filter-safety-st-status"
                    onchange="FPCL_SAFETY_TALK_SUITE.setStStatusFilter(this.value)"
                    class="w-full pl-2.5 pr-7 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-xs font-bold text-slate-800 shadow-2xs transition-all cursor-pointer outline-none appearance-none truncate"
                    title="Filter by Safety Talk Conducted Yes/No (Column H)"
                  >
                    <option value="all" ${this.state.stStatusFilter === 'all' ? 'selected' : ''}>ST Status: All</option>
                    <option value="yes" ${this.state.stStatusFilter === 'yes' ? 'selected' : ''}>ST Status: Yes (Conducted)</option>
                    <option value="no" ${this.state.stStatusFilter === 'no' ? 'selected' : ''}>ST Status: No (Missing)</option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                  </div>
                </div>
              </div>

              <!-- Filter 4: Recommendations Open / Close (Column P R Status) -->
              <div class="min-w-0">
                <div class="relative">
                  <select
                    id="filter-safety-r-status"
                    onchange="FPCL_SAFETY_TALK_SUITE.setRStatusFilter(this.value)"
                    class="w-full pl-2.5 pr-7 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-xs font-bold text-slate-800 shadow-2xs transition-all cursor-pointer outline-none appearance-none truncate"
                    title="Filter by Recommendations Status (Column P)"
                  >
                    <option value="all" ${this.state.rStatusFilter === 'all' ? 'selected' : ''}>R Status: All</option>
                    <option value="open" ${this.state.rStatusFilter === 'open' ? 'selected' : ''}>R Status: Open</option>
                    <option value="close" ${this.state.rStatusFilter === 'close' ? 'selected' : ''}>R Status: Close</option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                  </div>
                </div>
              </div>

            </div>
          </div>


          <!-- ========================================================================= -->
          <!-- 4. TWO SIDE-BY-SIDE VISUALS WITH PERIMETER BORDERS & UNIQUE COLOR SCHEMES -->
          <!-- Visual 1: Department Wise Safety talk status (Horizontal Stack Bar Chart) -->
          <!-- Visual 2: Safety talk compliance (Thick Donut Chart with legends at bottom) -->
          <!-- Solid colors only: Yes/Closed = #0B8A5A, No/Open = #DC2626, Total = #1D4ED8 -->
          <!-- ========================================================================= -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            <!-- VISUAL 1: HORIZONTAL STACK BAR CHART -->
            <!-- Perimeter Border: Royal Blue Perimeter Edge -->
            <div
              class="bg-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 flex flex-col justify-between"
              style="border: 2px solid #1D4ED8;"
            >
              <!-- Chart Header: Heading only, no text detail below -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                <h3 class="text-sm sm:text-base font-black text-[#1E293B] tracking-tight m-0" style="font-size: 14px;">
                  Department Wise Safety talk status
                </h3>

                <!-- Legend chips with light tinted backgrounds -->
                <div class="flex flex-wrap items-center gap-1.5 font-bold" style="font-size: 11px;">
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-[#1E3A8A] border border-blue-200">
                    <span class="w-2.5 h-2.5 rounded-xs bg-[#1D4ED8]"></span>
                    <span>Total</span>
                  </span>
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-[#0B8A5A] border border-emerald-200">
                    <span class="w-2.5 h-2.5 rounded-xs bg-[#0B8A5A]"></span>
                    <span>Yes / Conducted</span>
                  </span>
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-50 text-[#DC2626] border border-red-200">
                    <span class="w-2.5 h-2.5 rounded-xs bg-[#DC2626]"></span>
                    <span>No / Missing</span>
                  </span>
                </div>
              </div>

              <!-- SVG Horizontal Stacked Bar Chart -->
              <div class="w-full overflow-x-auto min-h-[280px]">
                ${this.renderDepartmentHorizontalStackChart(deptStats)}
              </div>
            </div>


            <!-- VISUAL 2: SAFETY TALK COMPLIANCE DONUT CHART -->
            <!-- Perimeter Border: Vivid Emerald / Cyan Perimeter Edge -->
            <div
              class="bg-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 flex flex-col justify-between"
              style="border: 2px solid #059669;"
            >
              <!-- Donut Header: Heading only, no text detail below -->
              <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 class="text-sm sm:text-base font-black text-[#1E293B] tracking-tight m-0" style="font-size: 14px;">
                  Safety talk compliance
                </h3>
                <span class="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Col H: ST Status
                </span>
              </div>

              <!-- Thick Large Donut Chart with Centered Text Fitting Inside without overlapping -->
              <div class="flex-1 flex flex-col items-center justify-center py-2">
                ${this.renderSafetyTalkComplianceDonut(kpis)}
              </div>

              <!-- Legends at bottom with light tinted backgrounds matching each color -->
              <div class="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2.5 text-xs font-bold">
                <span class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 text-[#0B8A5A] border border-emerald-200 shadow-2xs">
                  <span class="w-3 h-3 rounded-xs bg-[#0B8A5A]"></span>
                  <span>Yes: <strong>${kpis.deliveredTalks}</strong> (${kpis.talkCompletionRate})</span>
                </span>
                <span class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-50 text-[#DC2626] border border-red-200 shadow-2xs">
                  <span class="w-3 h-3 rounded-xs bg-[#DC2626]"></span>
                  <span>No: <strong>${kpis.missingTalks}</strong> (${kpis.plannedTalks > 0 ? ((kpis.missingTalks / kpis.plannedTalks) * 100).toFixed(1) + '%' : '0.0%'})</span>
                </span>
                <span class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 text-[#1E3A8A] border border-blue-200 shadow-2xs">
                  <span class="w-3 h-3 rounded-xs bg-[#1D4ED8]"></span>
                  <span>Total Planned: <strong>${kpis.plannedTalks}</strong></span>
                </span>
              </div>
            </div>

          </div>


          <!-- ========================================================================= -->
          <!-- 5. COMPLETE SCROLLABLE EXCEL TABLE (UP/DOWN AND LEFT/RIGHT)                -->
          <!-- Column B, C, H, O, P displayed first, followed by all remaining columns   -->
          <!-- Dedicated scroll left & right buttons for lengthy sheets                  -->
          <!-- Perimeter Border with unique gradient / styling                           -->
          <!-- ========================================================================= -->
          <div
            class="bg-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3"
            style="border: 2px solid #6366F1;"
          >
            <!-- Table Header Toolbar -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <i data-lucide="table" class="w-4 h-4"></i>
                </div>
                <h3 class="text-sm sm:text-base font-black text-[#1E293B] tracking-tight m-0">
                  Safety Talks Data Records (${filteredData.length} Rows)
                </h3>
              </div>

              <!-- Right: Scroll Buttons & Counter -->
              <div class="flex items-center gap-2 self-end sm:self-auto">
                <span class="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Columns: B, C, H, O, P first
                </span>
                <div class="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onclick="FPCL_SAFETY_TALK_SUITE.scrollTable('left')"
                    class="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer"
                    title="Scroll left"
                  >
                    <i data-lucide="chevron-left" class="w-4 h-4"></i>
                  </button>
                  <button
                    type="button"
                    onclick="FPCL_SAFETY_TALK_SUITE.scrollTable('right')"
                    class="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer"
                    title="Scroll right"
                  >
                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Scrollable Table Box: up/down & left/right scrollable -->
            <div
              id="safety-talk-table-container"
              class="w-full overflow-x-auto overflow-y-auto max-h-[520px] rounded-xl border border-slate-200 bg-white"
            >
              <table class="w-full text-left border-collapse text-xs select-text">
                <thead class="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 shadow-2xs">
                  <tr class="text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-nowrap">
                    <!-- 5 Prioritized Columns first -->
                    <th class="py-3 px-3.5 bg-blue-50/80 text-blue-950 border-r border-slate-200">Dept (B)</th>
                    <th class="py-3 px-3 bg-blue-50/80 text-blue-950 border-r border-slate-200">Shift (C)</th>
                    <th class="py-3 px-3.5 bg-emerald-50/80 text-emerald-950 border-r border-slate-200 text-center">ST Status (H)</th>
                    <th class="py-3 px-4 bg-amber-50/80 text-amber-950 border-r border-slate-200">Recommendations (O)</th>
                    <th class="py-3 px-3 bg-amber-50/80 text-amber-950 border-r border-slate-200 text-center">R Status (P)</th>
                    
                    <!-- Remaining Columns in natural sheet order -->
                    <th class="py-3 px-3 border-r border-slate-200 text-center">Sr</th>
                    <th class="py-3 px-3.5 border-r border-slate-200">Planned Date (D)</th>
                    <th class="py-3 px-3.5 border-r border-slate-200">Actual Date (E)</th>
                    <th class="py-3 px-3.5 border-r border-slate-200">Feedback Sub. Date (F)</th>
                    <th class="py-3 px-3 border-r border-slate-200">Feedback Submission (G)</th>
                    <th class="py-3 px-4 border-r border-slate-200">Planned Topic (I)</th>
                    <th class="py-3 px-4 border-r border-slate-200">Actual Topic (J)</th>
                    <th class="py-3 px-3.5 border-r border-slate-200">Planned Speaker (K)</th>
                    <th class="py-3 px-3.5 border-r border-slate-200">Backup Speaker (L)</th>
                    <th class="py-3 px-3.5 border-r border-slate-200">Actual Speaker (M)</th>
                    <th class="py-3 px-3 border-r border-slate-200 text-center">Topic Delivered (N)</th>
                    <th class="py-3 px-3.5 border-r border-slate-200">Pending With (Q)</th>
                    <th class="py-3 px-3 border-r border-slate-200">Target Date (R)</th>
                    <th class="py-3 px-3 border-r border-slate-200">Closure Date (S)</th>
                    <th class="py-3 px-4">Remarks (T)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-800">
                  ${filteredData.length === 0 ? `
                    <tr>
                      <td colspan="20" class="py-12 text-center text-slate-400 font-medium">
                        No Safety Talks records matched your filter criteria.
                      </td>
                    </tr>
                  ` : filteredData.map((r, idx) => {
                    const stYes = String(r.stStatus || '').trim().toLowerCase() === 'yes';
                    const rOpen = String(r.rStatus || '').trim().toLowerCase() === 'open';
                    const rClose = String(r.rStatus || '').trim().toLowerCase() === 'close' || String(r.rStatus || '').trim().toLowerCase() === 'closed';

                    return `
                      <tr class="hover:bg-slate-50/80 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}">
                        <!-- 1. Dept (B) -->
                        <td class="py-2.5 px-3.5 font-bold text-slate-900 whitespace-nowrap border-r border-slate-200 bg-blue-50/30">
                          ${this.escapeHtml(r.dept || '-')}
                        </td>
                        <!-- 2. Shift (C) -->
                        <td class="py-2.5 px-3 font-mono font-bold text-slate-700 text-center whitespace-nowrap border-r border-slate-200 bg-blue-50/30">
                          ${this.escapeHtml(r.shift || '-')}
                        </td>
                        <!-- 3. ST Status (H) -->
                        <td class="py-2.5 px-3.5 text-center whitespace-nowrap border-r border-slate-200 bg-emerald-50/30">
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black ${stYes ? 'bg-emerald-100 text-[#0B8A5A] border border-emerald-300' : 'bg-red-100 text-[#DC2626] border border-red-300'}">
                            ${this.escapeHtml(r.stStatus || 'No')}
                          </span>
                        </td>
                        <!-- 4. Recommendations (O) -->
                        <td class="py-2.5 px-4 max-w-xs break-words text-slate-700 border-r border-slate-200 bg-amber-50/30">
                          ${r.recommendations ? this.escapeHtml(r.recommendations) : '<span class="text-slate-400 italic">None</span>'}
                        </td>
                        <!-- 5. R Status (P) -->
                        <td class="py-2.5 px-3 text-center whitespace-nowrap border-r border-slate-200 bg-amber-50/30">
                          ${rOpen ? `
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-red-100 text-[#DC2626] border border-red-300">
                              Open
                            </span>
                          ` : (rClose ? `
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-[#0B8A5A] border border-emerald-300">
                              Close
                            </span>
                          ` : `
                            <span class="text-slate-400 font-medium text-[11px]">
                              ${this.escapeHtml(r.rStatus || '-')}
                            </span>
                          `)}
                        </td>

                        <!-- Remaining Columns -->
                        <td class="py-2.5 px-3 font-mono text-center text-slate-500 border-r border-slate-200">
                          ${this.escapeHtml(r.sr || '')}
                        </td>
                        <td class="py-2.5 px-3.5 text-slate-600 whitespace-nowrap border-r border-slate-200">
                          ${this.escapeHtml(r.plannedDate || '-')}
                        </td>
                        <td class="py-2.5 px-3.5 text-slate-600 whitespace-nowrap border-r border-slate-200">
                          ${this.escapeHtml(r.actualDate || '-')}
                        </td>
                        <td class="py-2.5 px-3.5 text-slate-600 whitespace-nowrap border-r border-slate-200">
                          ${this.escapeHtml(r.feedbackSubmissionDate || '-')}
                        </td>
                        <td class="py-2.5 px-3 text-slate-600 whitespace-nowrap border-r border-slate-200">
                          ${this.escapeHtml(r.feedbackSubmission || '-')}
                        </td>
                        <td class="py-2.5 px-4 text-slate-700 max-w-sm break-words border-r border-slate-200">
                          ${this.escapeHtml(r.plannedTopic || '-')}
                        </td>
                        <td class="py-2.5 px-4 text-slate-700 max-w-sm break-words border-r border-slate-200">
                          ${this.escapeHtml(r.actualTopic || '-')}
                        </td>
                        <td class="py-2.5 px-3.5 text-slate-700 whitespace-nowrap border-r border-slate-200">
                          ${this.escapeHtml(r.plannedSpeaker || '-')}
                        </td>
                        <td class="py-2.5 px-3.5 text-slate-700 whitespace-nowrap border-r border-slate-200">
                          ${this.escapeHtml(r.backupSpeaker || '-')}
                        </td>
                        <td class="py-2.5 px-3.5 text-slate-700 whitespace-nowrap border-r border-slate-200">
                          ${this.escapeHtml(r.actualSpeaker || '-')}
                        </td>
                        <td class="py-2.5 px-3 text-center whitespace-nowrap border-r border-slate-200">
                          ${this.escapeHtml(r.plannedTopicDelivered || '-')}
                        </td>
                        <td class="py-2.5 px-3.5 text-slate-600 whitespace-nowrap border-r border-slate-200">
                          ${this.escapeHtml(r.pendingWith || '-')}
                        </td>
                        <td class="py-2.5 px-3 text-slate-600 whitespace-nowrap border-r border-slate-200">
                          ${this.escapeHtml(r.targetDate || '-')}
                        </td>
                        <td class="py-2.5 px-3 text-slate-600 whitespace-nowrap border-r border-slate-200">
                          ${this.escapeHtml(r.closureDate || '-')}
                        </td>
                        <td class="py-2.5 px-4 text-slate-600 max-w-xs break-words">
                          ${this.escapeHtml(r.remarks || '-')}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }
    },

    /**
     * Render SVG Horizontal Stack Bar Chart:
     * Heading: "Department Wise Safety talk status" (with column B Dept and column H ST Status)
     * Solid colors only:
     * Yes/Closed = #0B8A5A
     * No/Open = #DC2626
     * Total = #1D4ED8, navy #1E3A8A for text
     * Green at base/bottom, red on top/outer end with slightly rounded corners
     * White percentage labels inside bars
     * White rounded tooltips with a blue top border
     * Light grey dashed horizontal gridlines on plain white background
     * Font size: 12px
     */
    renderDepartmentHorizontalStackChart(deptStats) {
      if (!deptStats || deptStats.length === 0) {
        return `
          <div class="h-64 flex items-center justify-center text-slate-400 text-xs">
            No department data available.
          </div>
        `;
      }

      const COLOR_CLOSED = '#0B8A5A'; // Green (Yes/Conducted)
      const COLOR_OPEN = '#DC2626';   // Red (No/Missing)
      const COLOR_TOTAL = '#1D4ED8';  // Blue (Total)
      const COLOR_NAVY = '#1E3A8A';

      const width = 560;
      const barH = 24;
      const gap = 16;
      const padL = 160;
      const padR = 45;
      const padT = 20;
      const padB = 30;

      const plotW = width - padL - padR;
      const height = padT + (deptStats.length * (barH + gap)) + padB;

      const maxTotal = Math.max(...deptStats.map(d => d.total), 1);
      const xMax = Math.max(1, maxTotal);

      // Light grey dashed gridlines
      const gridTicks = [0, Math.ceil(xMax * 0.25), Math.ceil(xMax * 0.5), Math.ceil(xMax * 0.75), xMax];
      const uniqueTicks = Array.from(new Set(gridTicks));

      const gridSvg = uniqueTicks.map(t => {
        const xPos = padL + (t / xMax) * plotW;
        return `
          <line x1="${xPos}" y1="${padT}" x2="${xPos}" y2="${height - padB}" stroke="#E2E8F0" stroke-width="1.2" stroke-dasharray="4 4"/>
          <text x="${xPos}" y="${height - padB + 16}" fill="#64748B" font-size="11" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="bold" text-anchor="middle">${t}</text>
        `;
      }).join('');

      const barsSvg = deptStats.map((item, idx) => {
        const yPos = padT + idx * (barH + gap);
        const yesW = (item.yes / xMax) * plotW;
        const noW = (item.no / xMax) * plotW;
        const totalW = (item.total / xMax) * plotW;

        const yesPct = item.total > 0 ? Math.round((item.yes / item.total) * 100) : 0;
        const noPct = item.total > 0 ? Math.round((item.no / item.total) * 100) : 0;

        const cornerR = 4;
        let barMarkup = '';

        if (item.yes > 0 && item.no > 0) {
          barMarkup = `
            <!-- Green base segment (#0B8A5A) -->
            <rect x="${padL}" y="${yPos}" width="${yesW}" height="${barH}" fill="${COLOR_CLOSED}" rx="${item.no === 0 ? cornerR : 0}" class="transition-opacity hover:opacity-90"/>
            ${yesW >= 24 ? `<text x="${padL + yesW / 2}" y="${yPos + barH / 2 + 4}" fill="#FFFFFF" font-size="11" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="middle" pointer-events="none">${yesPct}%</text>` : ''}
            <!-- Red outer segment (#DC2626) with slightly rounded outer corners -->
            <rect x="${padL + yesW}" y="${yPos}" width="${noW}" height="${barH}" fill="${COLOR_OPEN}" rx="${cornerR}" class="transition-opacity hover:opacity-90"/>
            ${noW >= 24 ? `<text x="${padL + yesW + noW / 2}" y="${yPos + barH / 2 + 4}" fill="#FFFFFF" font-size="11" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="middle" pointer-events="none">${noPct}%</text>` : ''}
          `;
        } else if (item.yes > 0) {
          barMarkup = `
            <rect x="${padL}" y="${yPos}" width="${yesW}" height="${barH}" fill="${COLOR_CLOSED}" rx="${cornerR}" class="transition-opacity hover:opacity-90"/>
            ${yesW >= 24 ? `<text x="${padL + yesW / 2}" y="${yPos + barH / 2 + 4}" fill="#FFFFFF" font-size="11" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="middle" pointer-events="none">${yesPct}%</text>` : ''}
          `;
        } else if (item.no > 0) {
          barMarkup = `
            <rect x="${padL}" y="${yPos}" width="${noW}" height="${barH}" fill="${COLOR_OPEN}" rx="${cornerR}" class="transition-opacity hover:opacity-90"/>
            ${noW >= 24 ? `<text x="${padL + noW / 2}" y="${yPos + barH / 2 + 4}" fill="#FFFFFF" font-size="11" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="middle" pointer-events="none">${noPct}%</text>` : ''}
          `;
        }

        // Tooltip badge atop bar on hover (via native SVG title)
        const tooltipStr = `${item.dept}:\n• Total: ${item.total}\n• Yes (Conducted): ${item.yes} (${yesPct}%)\n• No (Missing): ${item.no} (${noPct}%)`;

        return `
          <g class="group cursor-pointer">
            <title>${tooltipStr}</title>
            <!-- Department Label (12 font size) -->
            <text x="${padL - 12}" y="${yPos + barH / 2 + 4}" fill="#1E293B" font-size="12" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" text-anchor="end">
              ${this.escapeHtml(item.dept)}
            </text>
            <!-- Stacked bar segments -->
            ${barMarkup}
            <!-- Total count label on far right -->
            <text x="${padL + totalW + 8}" y="${yPos + barH / 2 + 4}" fill="${COLOR_NAVY}" font-size="12" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900">
              ${item.total}
            </text>
          </g>
        `;
      }).join('');

      return `
        <svg viewBox="0 0 ${width} ${height}" class="w-full h-auto select-none overflow-visible">
          <!-- Plain white background -->
          <rect width="${width}" height="${height}" fill="#FFFFFF" rx="8"/>
          <!-- Grid lines -->
          ${gridSvg}
          <!-- Vertical Base line -->
          <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${height - padB}" stroke="#64748B" stroke-width="2"/>
          <!-- Bars -->
          ${barsSvg}
        </svg>
      `;
    },

    /**
     * Render Thick, Large Donut Chart:
     * Heading: Safety talk compliance
     * ST Status Yes and No in percentage
     * Center text fits comfortably inside without overlapping
     * Thicker donut visually appealing
     */
    renderSafetyTalkComplianceDonut(kpis) {
      const delivered = kpis.deliveredTalks;
      const missing = kpis.missingTalks;
      const total = kpis.plannedTalks;

      const COLOR_YES = '#0B8A5A'; // Solid Green
      const COLOR_NO = '#DC2626';  // Solid Red

      const yesPct = total > 0 ? (delivered / total) * 100 : 0;
      const noPct = total > 0 ? (missing / total) * 100 : 0;

      // Donut geometry: thick donut (stroke-width 28, radius 70, viewBox 200x200)
      const radius = 70;
      const circumference = 2 * Math.PI * radius;

      const yesLen = (yesPct / 100) * circumference;
      const noLen = (noPct / 100) * circumference;

      const yesOffset = 0;
      const noOffset = -yesLen;

      return `
        <div class="relative flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 mx-auto">
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            <!-- Background track circle -->
            <circle cx="100" cy="100" r="${radius}" fill="transparent" stroke="#F1F5F9" stroke-width="26"></circle>

            <!-- Yes / Conducted Segment (Solid Green #0B8A5A) -->
            ${yesLen > 0 ? `
              <circle
                cx="100" cy="100" r="${radius}" fill="transparent"
                stroke="${COLOR_YES}" stroke-width="27"
                stroke-dasharray="${yesLen} ${circumference - yesLen}"
                stroke-dashoffset="${yesOffset}"
                stroke-linecap="round"
                class="transition-all duration-500"
              ></circle>
            ` : ''}

            <!-- No / Missing Segment (Solid Red #DC2626) -->
            ${noLen > 0 ? `
              <circle
                cx="100" cy="100" r="${radius}" fill="transparent"
                stroke="${COLOR_NO}" stroke-width="27"
                stroke-dasharray="${noLen} ${circumference - noLen}"
                stroke-dashoffset="${noOffset}"
                stroke-linecap="round"
                class="transition-all duration-500"
              ></circle>
            ` : ''}
          </svg>

          <!-- Inside Donut Center: Large font, center aligned, fitting inside without overlapping -->
          <div class="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none px-4">
            <span class="text-3xl sm:text-4xl lg:text-[42px] font-black font-mono tracking-tight text-[#1E293B] leading-none">
              ${kpis.talkCompletionRate}
            </span>
            <span class="text-[11px] sm:text-xs font-black text-slate-500 uppercase tracking-widest mt-1.5 leading-none">
              COMPLIANCE
            </span>
            <span class="text-[10px] font-bold text-slate-400 font-mono mt-1">
              ${delivered} of ${total} Delivered
            </span>
          </div>
        </div>
      `;
    },

    toggleSettingsModal() {
      const modal = document.getElementById('integration-modal');
      if (modal) {
        const input = document.getElementById('sheet-url-input');
        if (input) {
          input.value = SAFETY_TALK_CSV_URL;
        }
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
    },

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };

  safetyTalkSuite.init();
})();
