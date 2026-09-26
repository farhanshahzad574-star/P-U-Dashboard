/**
 * FPCL Executive Operations & Compliance Portal
 * Sub HSE – Mech (Mechanical HSE Sub-Committee) Dataset & Parser
 * 
 * Target Google Sheet ID: 1Put-VhgQkpG43kAuW_l3cRtj4MH6Dl3aa2gms9IaLqQ
 * Tab: Sub_HSE_Mech
 * 
 * Strict Scope & Isolation: Leaves Strategic, PLR, PSM Audits, PSM Validation, IMS, PSSR, CAPEX, Sub HSE - P, Sub HSE – E&I, EHSE untouched.
 * 
 * Schema:
 * - Column A: ID (Meeting ID number - single meeting carrying same ID)
 * - Column B: S.# (Serial number)
 * - Column C: Reference # (Ref. Number for filter creation)
 * - Column D: Meeting Date
 * - Column E: Issued Date
 * - Column F: Meeting Agenda
 * - Column G: Type Of Meeting
 * - Column H: MoM (Minutes of Meeting / Recommendation description)
 * - Column I: Action (Responsibility Department for filter creation & Horizontal Stacked Bar Chart)
 * - Column J: Status (Status for filter creation & KPIs: Closed vs Open. Empty cell or non-Closed is counted as Open in RED)
 * - Column K: Target Date
 * - Column L: Remarks
 */

(function () {
  'use strict';

  const INITIAL_SUB_HSE_MECH_OBSERVATIONS = [
    {
      sr: 1,
      id: "1",
      sNo: "1",
      refNo: "F/T/SSM/0108",
      meetingDate: "1/2/2024",
      issuedDate: "Wednesday, January 3, 2024",
      meetingAgenda: "Installation of Rigging Structure for the Screw of Bed Ash Cooler (A, B, C) B # 01& 02",
      typeOfMeeting: "SUB-SOC(M)",
      mom: "Package was approved with following comments:",
      action: "Info",
      status: "open",
      targetDate: "",
      remarks: ""
    },
    {
      sr: 2,
      id: "1",
      sNo: "1",
      refNo: "F/T/SSM/0108",
      meetingDate: "1/2/2024",
      issuedDate: "Wednesday, January 3, 2024",
      meetingAgenda: "Installation of Rigging Structure for the Screw of Bed Ash Cooler (A, B, C) B # 01& 02",
      typeOfMeeting: "SUB-SOC(M)",
      mom: "Proposed rigging structure to be evaluated for additional modification to lift the whole Bed Ash Cooler (13 Ton).",
      action: "PTE",
      status: "open",
      targetDate: "",
      remarks: ""
    },
    {
      sr: 3,
      id: "1",
      sNo: "1",
      refNo: "F/T/SSM/0108",
      meetingDate: "1/2/2024",
      issuedDate: "Wednesday, January 3, 2024",
      meetingAgenda: "Installation of Rigging Structure for the Screw of Bed Ash Cooler (A, B, C) B # 01& 02",
      typeOfMeeting: "SUB-SOC(M)",
      mom: "Lifting capacity of the structure (03 Ton) should be marked on the beam.",
      action: "Mechanical",
      status: "open",
      targetDate: "",
      remarks: "Currently the same is not marked on the structure"
    },
    {
      sr: 4,
      id: "2",
      sNo: "2",
      refNo: "F/T/SSM/0109",
      meetingDate: "2/7/2024",
      issuedDate: "4/19/2024",
      meetingAgenda: "Application of Coating Inside Blowdown Tank to Prevent Repetitive Weld Build-Ups",
      typeOfMeeting: "SUB-SOC(M)",
      mom: "Proposal was approved with following comments:",
      action: "Info",
      status: "open",
      targetDate: "",
      remarks: ""
    },
    {
      sr: 5,
      id: "2",
      sNo: "2",
      refNo: "F/T/SSM/0109",
      meetingDate: "2/7/2024",
      issuedDate: "4/19/2024",
      meetingAgenda: "Application of Coating Inside Blowdown Tank to Prevent Repetitive Weld Build-Ups",
      typeOfMeeting: "SUB-SOC(M)",
      mom: "DuraPol UHT (Brush Grade) to be applied inside the blowdown tank (Boiler-2) in the bottom portion below the bottom of overflow elbow.",
      action: "Info",
      status: "open",
      targetDate: "",
      remarks: ""
    },
    {
      sr: 6,
      id: "2",
      sNo: "2",
      refNo: "F/T/SSM/0109",
      meetingDate: "2/7/2024",
      issuedDate: "4/19/2024",
      meetingAgenda: "Application of Coating Inside Blowdown Tank to Prevent Repetitive Weld Build-Ups",
      typeOfMeeting: "SUB-SOC(M)",
      mom: "Following points to be checked w.r.t coating material available in FFBL Warehouse.",
      action: "Unassigned",
      status: "open",
      targetDate: "",
      remarks: ""
    },
    {
      sr: 7,
      id: "2",
      sNo: "2",
      refNo: "F/T/SSM/0109",
      meetingDate: "2/7/2024",
      issuedDate: "4/19/2024",
      meetingAgenda: "Application of Coating Inside Blowdown Tank to Prevent Repetitive Weld Build-Ups",
      typeOfMeeting: "SUB-SOC(M)",
      mom: "Check the expiry date of the coating material.",
      action: "PTE / MM",
      status: "Closed",
      targetDate: "",
      remarks: "The available coating material was in service life and not expired."
    },
    {
      sr: 8,
      id: "2",
      sNo: "2",
      refNo: "F/T/SSM/0109",
      meetingDate: "2/7/2024",
      issuedDate: "4/19/2024",
      meetingAgenda: "Application of Coating Inside Blowdown Tank to Prevent Repetitive Weld Build-Ups",
      typeOfMeeting: "SUB-SOC(M)",
      mom: "Check the availability of Material Safety Data Sheet (MSDS) on the coating packing.",
      action: "PTE / MM",
      status: "Closed",
      targetDate: "",
      remarks: "MSDS of Durapol was available and shared with EU."
    },
    {
      sr: 9,
      id: "2",
      sNo: "2",
      refNo: "F/T/SSM/0109",
      meetingDate: "2/7/2024",
      issuedDate: "4/19/2024",
      meetingAgenda: "Application of Coating Inside Blowdown Tank to Prevent Repetitive Weld Build-Ups",
      typeOfMeeting: "SUB-SOC(M)",
      mom: "Coating application to be performed in-house. FFBL support may be taken.",
      action: "Workshop / Mechanical",
      status: "On Job Action",
      targetDate: "",
      remarks: "Coating was done internally by Workshop and Equipment team"
    },
    {
      sr: 10,
      id: "2",
      sNo: "2",
      refNo: "F/T/SSM/0109",
      meetingDate: "2/7/2024",
      issuedDate: "4/19/2024",
      meetingAgenda: "Application of Coating Inside Blowdown Tank to Prevent Repetitive Weld Build-Ups",
      typeOfMeeting: "SUB-SOC(M)",
      mom: "Coating application quality control to be ensured by Inspection as per Coating Datasheet.",
      action: "Inspection",
      status: "On Job Action",
      targetDate: "",
      remarks: "Complete QA during application was carried out"
    },
    {
      sr: 11,
      id: "3",
      sNo: "3",
      refNo: "F/T/SSM/0110",
      meetingDate: "3/28/2024",
      issuedDate: "4/19/2024",
      meetingAgenda: "Installation of Barrication around Coal Unloading Hoppers to Prevent Coal Overflow Inside Staircase\nProvision of Extension at Bed Ash Surge Hopper Access Platforms -Boiler 1&2 \nProvision of Shed at Paver Machine Area",
      typeOfMeeting: "SUB-SOC(M)",
      mom: "Package to be modified as per following comments.",
      action: "Info",
      status: "open",
      targetDate: "",
      remarks: ""
    },
    {
      sr: 12,
      id: "3",
      sNo: "3",
      refNo: "F/T/SSM/0110",
      meetingDate: "3/28/2024",
      issuedDate: "4/19/2024",
      meetingAgenda: "Installation of Barrication around Coal Unloading Hoppers to Prevent Coal Overflow Inside Staircase\nProvision of Extension at Bed Ash Surge Hopper Access Platforms -Boiler 1&2 \nProvision of Shed at Paver Machine Area",
      typeOfMeeting: "SUB-SOC(M)",
      mom: "Existing handling to be removed and RCC concrete wall to be installed at proposed locations instead of corrugated sheets.",
      action: "PTE / Civil",
      status: "Closed",
      targetDate: "",
      remarks: "The revised package considering RCC wall was issued and approved."
    },
    {
      sr: 13,
      id: "3",
      sNo: "3",
      refNo: "F/T/SSM/0110",
      meetingDate: "3/28/2024",
      issuedDate: "4/19/2024",
      meetingAgenda: "Installation of Barrication around Coal Unloading Hoppers to Prevent Coal Overflow Inside Staircase\nProvision of Extension at Bed Ash Surge Hopper Access Platforms -Boiler 1&2 \nProvision of Shed at Paver Machine Area",
      typeOfMeeting: "SUB-SOC(M)",
      mom: "Height of the wall to be kept 1 meter instead of proposed 1.5 meters height.",
      action: "PTE",
      status: "Closed",
      targetDate: "",
      remarks: "The hiegth of wall was kept 1.5 Mtr"
    }
  ];

  /**
   * Parse RFC 4180 CSV with quotes, newlines, and commas
   */
  function parseCSVLines(text) {
    const lines = [];
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
        if (c === '\r' && next === '\n') i++;
        if (row.length > 1 || row[0] !== '') {
          lines.push(row);
        }
        row = [''];
      } else {
        row[row.length - 1] += c;
      }
    }

    if (row.length > 1 || row[0] !== '') {
      lines.push(row);
    }

    return lines;
  }

  /**
   * Live CSV Parser for Sub HSE – Mech Google Sheet
   * Columns: ID, S.#, Reference #, Meeting Date, Issued Date, Meeting Agenda, Type Of Meeting, MoM, Action, Status, Target Date, Remarks
   */
  function parseSubHseMechCSV(csvText) {
    if (!csvText || typeof csvText !== 'string') return [];

    const rawRows = parseCSVLines(csvText.trim());
    if (rawRows.length < 2) return [];

    // Header index discovery
    let headerRowIdx = 0;
    for (let r = 0; r < Math.min(rawRows.length, 5); r++) {
      const rowStr = rawRows[r].map(c => String(c).toLowerCase()).join(' ');
      if (rowStr.includes('reference') || rowStr.includes('action') || rowStr.includes('status') || rowStr.includes('mom')) {
        headerRowIdx = r;
        break;
      }
    }

    const header = rawRows[headerRowIdx].map(c => String(c).trim().toLowerCase());
    const dataRows = rawRows.slice(headerRowIdx + 1);

    // Dynamic column finding
    let colId = header.findIndex(h => h === 'id' || h === 'meeting id' || h.startsWith('id'));
    let colSNo = header.findIndex(h => h === 's.#' || h === 's#' || h === 'sr' || h === 'sr.' || h === 's.no' || h === 's no');
    let colRef = header.findIndex(h => h.includes('reference') || h.includes('ref'));
    let colMeetingDate = header.findIndex(h => h.includes('meeting date') || (h.includes('meeting') && h.includes('date')));
    let colIssuedDate = header.findIndex(h => h.includes('issued date') || (h.includes('issued') && h.includes('date')));
    let colAgenda = header.findIndex(h => h.includes('agenda'));
    let colTypeOfMeeting = header.findIndex(h => h.includes('type of meeting') || h.includes('type'));
    let colMoM = header.findIndex(h => h === 'mom' || h.includes('minutes') || h.includes('recommendation'));
    let colAction = header.findIndex(h => h === 'action' || h.includes('responsibility') || h.includes('action by') || h.includes('dept'));
    let colStatus = header.findIndex(h => h === 'status' || h.includes('open') || h.includes('close'));
    let colTargetDate = header.findIndex(h => h.includes('target date') || h.includes('target'));
    let colRemarks = header.findIndex(h => h.includes('remark'));

    // Fallbacks to default 0-indexed positions: A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11
    if (colId === -1) colId = 0;
    if (colSNo === -1) colSNo = 1;
    if (colRef === -1) colRef = 2;
    if (colMeetingDate === -1) colMeetingDate = 3;
    if (colIssuedDate === -1) colIssuedDate = 4;
    if (colAgenda === -1) colAgenda = 5;
    if (colTypeOfMeeting === -1) colTypeOfMeeting = 6;
    if (colMoM === -1) colMoM = 7;
    if (colAction === -1) colAction = 8;
    if (colStatus === -1) colStatus = 9;
    if (colTargetDate === -1) colTargetDate = 10;
    if (colRemarks === -1) colRemarks = 11;

    const parsed = [];
    let runningSr = 1;

    for (let r = 0; r < dataRows.length; r++) {
      const row = dataRows[r];
      if (!row || !row.some(x => x && x.trim().length > 0)) continue;

      const rawId = (row[colId] || '').trim();
      const rawSNo = (row[colSNo] || '').trim();
      const rawRef = (row[colRef] || '').trim();
      const rawMeetingDate = (row[colMeetingDate] || '').trim();
      const rawIssuedDate = (row[colIssuedDate] || '').trim();
      const rawAgenda = (row[colAgenda] || '').trim();
      const rawTypeOfMeeting = (row[colTypeOfMeeting] || '').trim();
      const rawMoM = (row[colMoM] || '').trim();
      const rawAction = (row[colAction] || '').trim() || 'Info';
      const rawStatusVal = (row[colStatus] || '').trim();
      const rawTargetDate = (row[colTargetDate] || '').trim();
      const rawRemarks = (row[colRemarks] || '').trim();

      // Rule: Count point as open if empty cell is found or any text other than Closed is found
      let status = 'open';
      if (rawStatusVal) {
        const sLower = rawStatusVal.toLowerCase();
        if (sLower === 'closed' || sLower === 'close') {
          status = 'Closed';
        } else {
          status = rawStatusVal; // e.g. "open", "On Job Action" -> Counts as Open
        }
      } else {
        status = 'open';
      }

      // Ignore row if entirely empty
      if (!rawId && !rawRef && !rawMoM && !rawAgenda) continue;

      parsed.push({
        sr: runningSr++,
        id: rawId,
        sNo: rawSNo,
        refNo: rawRef,
        meetingDate: rawMeetingDate,
        issuedDate: rawIssuedDate,
        meetingAgenda: rawAgenda,
        typeOfMeeting: rawTypeOfMeeting,
        mom: rawMoM,
        action: rawAction,
        status: status,
        targetDate: rawTargetDate,
        remarks: rawRemarks
      });
    }

    return parsed;
  }

  // Export globally
  window.FPCL_SUB_HSE_MECH_INITIAL_SEED = INITIAL_SUB_HSE_MECH_OBSERVATIONS;
  window.FPCL_SUB_HSE_MECH_DATA = INITIAL_SUB_HSE_MECH_OBSERVATIONS;
  window.parseSubHseMechCSV = parseSubHseMechCSV;

})();
