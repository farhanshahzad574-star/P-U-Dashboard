/**
 * FPCL Executive Operations & Compliance Portal
 * EHSE (Executive HSE Committee) Dataset & Parser
 * 
 * Target Google Sheet ID: 1I4oX4kPr6d0_7q--9OcoJWs0W7IQG1dK1rBmNO7BlGo
 * Tab: EHSE
 * 
 * Schema:
 * - Column A: ID (Meeting ID number - single meeting of EHSE)
 * - Column B: Subject (Meeting Subject)
 * - Column C: Date of Meeting
 * - Column D: Ref. #
 * - Column E: Agenda
 * - Column F: Recommendations
 * - Column G: Action by (Responsibility Department)
 * - Column H: Open Close (Status: Open / Close - empty cell counts as Open)
 * - Column I: Remaks (Remarks)
 */

(function () {
  'use strict';

  const INITIAL_EHSE_OBSERVATIONS = [
    {
      sr: 1,
      id: '69',
      subject: 'SUB HSE (P) Meeting No. 01/2025',
      dateOfMeeting: '23-Apr-25',
      refNo: 'TC-35. 1/01/2025',
      agenda: 'Installation of coal pelleting machine for testing purposes in coal open yard.',
      recommendations: 'The committee was apprised on the purpose installation, machine specification and requirements for the coal pelleting machine at coal open yard.',
      actionBy: 'Info',
      openClose: 'Open',
      remarks: ''
    },
    {
      sr: 2,
      id: '69',
      subject: 'SUB HSE (P) Meeting No. 01/2025',
      dateOfMeeting: '23-Apr-25',
      refNo: 'TC-35. 1/01/2025',
      agenda: 'Installation of coal pelleting machine for testing purposes in coal open yard.',
      recommendations: 'The following was presented and approved by the chair. 1. A joint survey will be carried out by OPS-CASH, PE, ans E&I to identify the location in the coal open yard considering proper coal dust/pellet handling and availability of electrical power.',
      actionBy: 'OPS-CASH/PE/E&I',
      openClose: 'Open',
      remarks: ''
    },
    {
      sr: 3,
      id: '70',
      subject: 'SUB HSE (P/M/E&I) Meeting No. 01/2025',
      dateOfMeeting: '12-Dec-25',
      refNo: 'TC-35.1/2/2025',
      agenda: '1. Update on action points assigned during 1st sub SOC P/M/E&I meeting on Local dryout of boilers hot cyclone A & B nose area refractory by inspection unit. 2. E&I update on power supply scheme for local dryout activity during ATA 2026.',
      recommendations: 'During 1st Sub SOC P/M/E&I held on October 28, 2025 forum was briefed on outcome of Mockup test and refactory dryout curve / procedure to be opted during ATA 2026.',
      actionBy: 'Info',
      openClose: 'Open',
      remarks: ''
    },
    {
      sr: 4,
      id: '70',
      subject: 'SUB HSE (P/M/E&I) Meeting No. 01/2025',
      dateOfMeeting: '12-Dec-25',
      refNo: 'TC-35.1/2/2025',
      agenda: '1. Update on action points assigned during 1st sub SOC P/M/E&I meeting on Local dryout of boilers hot cyclone A & B nose area refractory by inspection unit. 2. E&I update on power supply scheme for local dryout activity during ATA 2026.',
      recommendations: 'Following is the summary of action points assigned. i.Mockup test results/ observations to be shared with HHI for consent.',
      actionBy: 'Info',
      openClose: 'Open',
      remarks: ''
    }
  ];

  /**
   * Robust CSV Parser that handles quoted multi-line fields and empty status cells
   */
  function parseEhseCSV(csvText) {
    if (!csvText || typeof csvText !== 'string') return [];

    const rows = [];
    let cur = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const c = csvText[i];
      if (c === '"') {
        if (inQuotes && csvText[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        cur.push(field.trim());
        field = '';
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && csvText[i + 1] === '\n') {
          i++;
        }
        cur.push(field.trim());
        field = '';
        if (cur.some(x => x && x.length > 0)) {
          rows.push(cur);
        }
        cur = [];
      } else {
        field += c;
      }
    }

    if (field || cur.length > 0) {
      cur.push(field.trim());
      if (cur.some(x => x && x.length > 0)) {
        rows.push(cur);
      }
    }

    if (rows.length < 2) return [];

    // Header row validation
    const headerRow = rows[0].map(h => String(h || '').trim().toLowerCase());
    const dataRows = rows.slice(1);

    // Map column indices dynamically
    let colId = 0;
    let colSubject = 1;
    let colDate = 2;
    let colRef = 3;
    let colAgenda = 4;
    let colRec = 5;
    let colAction = 6;
    let colStatus = 7;
    let colRemarks = 8;

    headerRow.forEach((h, idx) => {
      if (h === 'id') colId = idx;
      else if (h.includes('subject')) colSubject = idx;
      else if (h.includes('date')) colDate = idx;
      else if (h.includes('ref')) colRef = idx;
      else if (h.includes('agenda')) colAgenda = idx;
      else if (h.includes('rec')) colRec = idx;
      else if (h.includes('action') || h.includes('dept')) colAction = idx;
      else if (h.includes('open') || h.includes('close') || h.includes('status')) colStatus = idx;
      else if (h.includes('remak') || h.includes('remark')) colRemarks = idx;
    });

    const parsed = [];
    let runningSr = 1;

    for (let r = 0; r < dataRows.length; r++) {
      const row = dataRows[r];
      // Skip completely empty rows
      if (!row || !row.some(x => x && x.trim().length > 0)) continue;

      const rawId = (row[colId] || '').trim();
      const rawSubject = (row[colSubject] || '').trim();
      const rawDate = (row[colDate] || '').trim();
      const rawRef = (row[colRef] || '').trim();
      const rawAgenda = (row[colAgenda] || '').trim();
      const rawRec = (row[colRec] || '').trim();
      const rawAction = (row[colAction] || '').trim() || 'Info';
      
      // Column H: Count point as open if empty cell is found
      const rawStatusVal = (row[colStatus] || '').trim();
      let openClose = 'Open';
      if (rawStatusVal) {
        const sLower = rawStatusVal.toLowerCase();
        if (sLower === 'close' || sLower.includes('close') || sLower.includes('complete') || sLower.includes('done')) {
          openClose = 'Close';
        } else {
          openClose = 'Open';
        }
      } else {
        // Empty cell found -> strictly count point as open as required
        openClose = 'Open';
      }

      const rawRemarks = (row[colRemarks] || '').trim();

      // Only valid rows with an ID or Subject or Recommendation
      if (!rawId && !rawSubject && !rawRec) continue;

      parsed.push({
        sr: runningSr++,
        id: rawId,
        subject: rawSubject,
        dateOfMeeting: rawDate,
        refNo: rawRef,
        agenda: rawAgenda,
        recommendations: rawRec,
        actionBy: rawAction,
        openClose: openClose,
        remarks: rawRemarks
      });
    }

    return parsed;
  }

  // Export globally
  window.FPCL_EHSE_INITIAL_SEED = INITIAL_EHSE_OBSERVATIONS;
  window.FPCL_EHSE_DATA = INITIAL_EHSE_OBSERVATIONS;
  window.parseEhseCSV = parseEhseCSV;

})();
