/**
 * FPCL Executive Operations & Compliance Portal
 * Sub HSE - P (Production HSE Sub-Committee) Dataset & Parser
 * 
 * Google Sheet ID: 1hhO-goFXJlKSr32dSIHQMfEC7XRQsQly7iJCfP39Wjw
 * Tab: Sub_HSE_P
 * 
 * Schema:
 * - Column A: ID (Meeting ID number - single meeting of Sub HSE P)
 * - Column B: Subject (Meeting Subject)
 * - Column C: Date of Meeting
 * - Column D: Ref. #
 * - Column E: Agenda
 * - Column F: Recommendations
 * - Column G: Action by (Responsibility Department)
 * - Column H: Open Close (Status: Open / Close)
 * - Column I: Remaks (Remarks)
 */

(function () {
  'use strict';

  const INITIAL_SUB_HSE_P_OBSERVATIONS = [
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
      id: '69',
      subject: 'SUB HSE (P) Meeting No. 01/2025',
      dateOfMeeting: '23-Apr-25',
      refNo: 'TC-35. 1/01/2025',
      agenda: 'Installation of coal pelleting machine for testing purposes in coal open yard.',
      recommendations: '2. Chair instructed for provision of a protective shed covering the installation area of the coal pelleting machine to mitigate environmental exposuire to ensure safe operations.',
      actionBy: 'Mech.',
      openClose: 'Close',
      remarks: ''
    },
    {
      sr: 4,
      id: '69',
      subject: 'SUB HSE (P) Meeting No. 01/2025',
      dateOfMeeting: '23-Apr-25',
      refNo: 'TC-35. 1/01/2025',
      agenda: 'Installation of coal pelleting machine for testing purposes in coal open yard.',
      recommendations: '3. a)Owing to coal dust handling, it was suggested that all motors and electrical pannels to be in compliance with IP65 protection rating or alternate protection arrangement to be done to protect against rainfall/ harsh weather conditions.  b) E&I shall ensure that all electrical equipment complies with FPCL facility standards and specifications.',
      actionBy: 'E&I',
      openClose: 'Close',
      remarks: ''
    },
    {
      sr: 5,
      id: '69',
      subject: 'SUB HSE (P) Meeting No. 01/2025',
      dateOfMeeting: '23-Apr-25',
      refNo: 'TC-35. 1/01/2025',
      agenda: 'Installation of coal pelleting machine for testing purposes in coal open yard.',
      recommendations: '4. Proper SOP to be developed for separation of foreign materials/ hard particles before charging the collected dust batch into the system.',
      actionBy: 'OPS-CASH',
      openClose: 'Close',
      remarks: ''
    },
    {
      sr: 6,
      id: '69',
      subject: 'SUB HSE (P) Meeting No. 01/2025',
      dateOfMeeting: '23-Apr-25',
      refNo: 'TC-35. 1/01/2025',
      agenda: 'Installation of coal pelleting machine for testing purposes in coal open yard.',
      recommendations: '5. a) As the machine will be manually operated, necessary safety precautions regarding the manual handeling of coal dust and operation of machine shall be ensured. b) Operating procedure is to be developed and implemented for safe manual handling and the operation of the unit.',
      actionBy: 'OPS-CASH',
      openClose: 'Close',
      remarks: ''
    },
    {
      sr: 7,
      id: '70',
      subject: 'SUB HSE (P/M/E&I) Meeting No. 01/2025',
      dateOfMeeting: '12-Dec-25',
      refNo: 'TC-35.1/2/2025',
      agenda: '1. Update on action points assigned during 1st sub SOC P/M/E&I meeting on Local dryout of boilers hot cyclone A & B nose area refractory by inspection unit. 2. E&I update on power supply scheme for local dryout activity during ATA 2026.',
      recommendations: 'During 1st Sub SOC P/M/E&I held on October 28, 2025 forum was briefed on outcome of Mockup test and refactory dryout curve / procedure to be opted during ATA 2026.',
      actionBy: 'Info',
      openClose: 'Close',
      remarks: ''
    },
    {
      sr: 8,
      id: '70',
      subject: 'SUB HSE (P/M/E&I) Meeting No. 01/2025',
      dateOfMeeting: '12-Dec-25',
      refNo: 'TC-35.1/2/2025',
      agenda: '1. Update on action points assigned during 1st sub SOC P/M/E&I meeting on Local dryout of boilers hot cyclone A & B nose area refractory by inspection unit. 2. E&I update on power supply scheme for local dryout activity during ATA 2026.',
      recommendations: 'Following is the summary of action points assigned. i.Mockup test results/ observations to be shared with HHI for consent.',
      actionBy: 'Info',
      openClose: 'Close',
      remarks: ''
    },
    {
      sr: 9,
      id: '70',
      subject: 'SUB HSE (P/M/E&I) Meeting No. 01/2025',
      dateOfMeeting: '12-Dec-25',
      refNo: 'TC-35.1/2/2025',
      agenda: '1. Update on action points assigned during 1st sub SOC P/M/E&I meeting on Local dryout of boilers hot cyclone A & B nose area refractory by inspection unit. 2. E&I update on power supply scheme for local dryout activity during ATA 2026.',
      recommendations: 'ii. Obtain consent from HHI & refactory specialist regarding the heating sequence to be followed after local dry-out.',
      actionBy: 'Info',
      openClose: 'Close',
      remarks: ''
    },
    {
      sr: 10,
      id: '70',
      subject: 'SUB HSE (P/M/E&I) Meeting No. 01/2025',
      dateOfMeeting: '12-Dec-25',
      refNo: 'TC-35.1/2/2025',
      agenda: '1. Update on action points assigned during 1st sub SOC P/M/E&I meeting on Local dryout of boilers hot cyclone A & B nose area refractory by inspection unit. 2. E&I update on power supply scheme for local dryout activity during ATA 2026.',
      recommendations: 'iii. Get clarification from local consultant on possibility of local dry out up to 850 C.',
      actionBy: 'Info',
      openClose: 'Close',
      remarks: ''
    },
    {
      sr: 11,
      id: '70',
      subject: 'SUB HSE (P/M/E&I) Meeting No. 01/2025',
      dateOfMeeting: '12-Dec-25',
      refNo: 'TC-35.1/2/2025',
      agenda: '1. Update on action points assigned during 1st sub SOC P/M/E&I meeting on Local dryout of boilers hot cyclone A & B nose area refractory by inspection unit. 2. E&I update on power supply scheme for local dryout activity during ATA 2026.',
      recommendations: 'iv. Check if the heating system and supporting structure can withstand the increased temperation after insulation.',
      actionBy: 'Info',
      openClose: 'Close',
      remarks: ''
    },
    {
      sr: 12,
      id: '70',
      subject: 'SUB HSE (P/M/E&I) Meeting No. 01/2025',
      dateOfMeeting: '12-Dec-25',
      refNo: 'TC-35.1/2/2025',
      agenda: '1. Update on action points assigned during 1st sub SOC P/M/E&I meeting on Local dryout of boilers hot cyclone A & B nose area refractory by inspection unit. 2. E&I update on power supply scheme for local dryout activity during ATA 2026.',
      recommendations: 'v. Discuss the size of the cabels with vendor and check if the manway can be used with cables passing.',
      actionBy: 'Info',
      openClose: 'Close',
      remarks: ''
    },
    {
      sr: 13,
      id: '70',
      subject: 'SUB HSE (P/M/E&I) Meeting No. 01/2025',
      dateOfMeeting: '12-Dec-25',
      refNo: 'TC-35.1/2/2025',
      agenda: '1. Update on action points assigned during 1st sub SOC P/M/E&I meeting on Local dryout of boilers hot cyclone A & B nose area refractory by inspection unit. 2. E&I update on power supply scheme for local dryout activity during ATA 2026.',
      recommendations: 'vi. JSA of the complete job to developed.',
      actionBy: 'Info',
      openClose: 'Close',
      remarks: ''
    },
    {
      sr: 14,
      id: '70',
      subject: 'SUB HSE (P/M/E&I) Meeting No. 01/2025',
      dateOfMeeting: '12-Dec-25',
      refNo: 'TC-35.1/2/2025',
      agenda: '1. Update on action points assigned during 1st sub SOC P/M/E&I meeting on Local dryout of boilers hot cyclone A & B nose area refractory by inspection unit. 2. E&I update on power supply scheme for local dryout activity during ATA 2026.',
      recommendations: 'vii. FFC GM maintanance to be contacted for the possibility of online mortor filling from outside to control the temperature at nose area hot spot.',
      actionBy: 'Info',
      openClose: 'Close',
      remarks: ''
    },
    {
      sr: 15,
      id: '70',
      subject: 'SUB HSE (P/M/E&I) Meeting No. 01/2025',
      dateOfMeeting: '12-Dec-25',
      refNo: 'TC-35.1/2/2025',
      agenda: '1. Update on action points assigned during 1st sub SOC P/M/E&I meeting on Local dryout of boilers hot cyclone A & B nose area refractory by inspection unit. 2. E&I update on power supply scheme for local dryout activity during ATA 2026.',
      recommendations: 'viii. Discuss the total power requirement from local consultant and develop / present scheme for power supply at boilers for subject activity.',
      actionBy: 'Info',
      openClose: 'Close',
      remarks: ''
    },
    {
      sr: 16,
      id: '71',
      subject: 'SUB SOC (P) Meeting No. 02/25',
      dateOfMeeting: '4-Jun-25',
      refNo: 'TC-35.1/02/2025',
      agenda: '1. VFD Installation on PA Fans.',
      recommendations: 'Detailed presentation incorporating the modalities for installing VED to PA fan was presented. The package was approved by the chair as presented with directives to be addressed and presented in relevant Sub SOC (E&I). Following are the details of same.   Chair raised the concern that in the event of VED tripping and its subsequent transition to By-Pass mode, there is propbability of fan tripping on high in-rush current. Accordingly, chair directed to reviwed the same to avoid any tripping during bypass mode activation. E&I agreed to evaluate and present the outcome in relevant Sub SOC (E&I) forum.',
      actionBy: 'E&I',
      openClose: 'Close',
      remarks: ''
    },
    {
      sr: 17,
      id: '71',
      subject: 'SUB SOC (P) Meeting No. 02/25',
      dateOfMeeting: '4-Jun-25',
      refNo: 'TC-35.1/02/2025',
      agenda: '1. VFD Installation on PA Fans.',
      recommendations: 'Chair directed that proper time i.e. minimum 12 hours per boiler should be allocated in ATA-2026 plan for testing of VED bypass mode prior to startup.',
      actionBy: 'OPS/PE/PI anning',
      openClose: 'Close',
      remarks: ''
    },
    {
      sr: 18,
      id: '71',
      subject: 'SUB SOC (P) Meeting No. 02/25',
      dateOfMeeting: '4-Jun-25',
      refNo: 'TC-35.1/02/2025',
      agenda: '1. VFD Installation on PA Fans.',
      recommendations: 'On selection of VED from chinese vendors chair raised concern on criteria/ quality. Manager Technical nriefed that the chinese vendores have been throughly evaluated by E&I prior to selection and their reference in local industries / power plants have been souhjt. However, E&I to furthure ensure the specifications of Chinese equipment being provided that they fully meet the required technical standards. Same to be clarified at relevant Sub SOC (E&I) forum',
      actionBy: 'E&I',
      openClose: 'Close',
      remarks: ''
    },
    {
      sr: 19,
      id: '71',
      subject: 'SUB SOC (P) Meeting No. 02/25',
      dateOfMeeting: '4-Jun-25',
      refNo: 'TC-35.1/02/2025',
      agenda: '2. Linear heat detection & water sprinkle system - Hydraulic Analysis.',
      recommendations: 'a. Hydraulic analysis for tie-in points with process condition details, was approved as presented.',
      actionBy: 'Info',
      openClose: 'Close',
      remarks: ''
    },
    {
      sr: 20,
      id: '71',
      subject: 'SUB SOC (P) Meeting No. 02/25',
      dateOfMeeting: '4-Jun-25',
      refNo: 'TC-35.1/02/2025',
      agenda: '2. Linear heat detection & water sprinkle system - Hydraulic Analysis.',
      recommendations: 'b. Main header for water sprinkles off-takes at transfer tower TT#07 should be in a closed-loop circuit to avoid dead ends.',
      actionBy: 'PE/HSE',
      openClose: 'Close',
      remarks: ''
    }
  ];

  /**
   * RFC-4180 Compliant CSV text parser handling quotes, line breaks, commas, and formatting
   */
  function parseCSVToRows(text) {
    if (!text || typeof text !== 'string') return [];
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  }

  /**
   * Parses Sub_HSE_P CSV string into structured observation objects
   */
  window.parseSubHsePCSV = function (csvText) {
    if (!csvText || typeof csvText !== 'string' || csvText.trim().length === 0) {
      return INITIAL_SUB_HSE_P_OBSERVATIONS;
    }

    const rawRows = parseCSVToRows(csvText);
    if (!rawRows || rawRows.length < 2) {
      return INITIAL_SUB_HSE_P_OBSERVATIONS;
    }

    const headerRow = rawRows[0].map(h => (h || '').toLowerCase().replace(/[^a-z0-9]/g, ''));

    // Dynamic column index resolution with fallback positions A-I (0-8)
    let idIdx = headerRow.findIndex(h => h === 'id' || h.startsWith('id') || h === 'sr' || h === 'meetingid');
    if (idIdx === -1) idIdx = 0;

    let subjIdx = headerRow.findIndex(h => h.includes('subject') || h.includes('title') || h.includes('meetingname'));
    if (subjIdx === -1) subjIdx = 1;

    let dateIdx = headerRow.findIndex(h => h.includes('date') || h.includes('meetingdate'));
    if (dateIdx === -1) dateIdx = 2;

    let refIdx = headerRow.findIndex(h => h.includes('ref') || h.includes('tc') || h.includes('reference'));
    if (refIdx === -1) refIdx = 3;

    let agendaIdx = headerRow.findIndex(h => h.includes('agenda') || h.includes('topic') || h.includes('item'));
    if (agendaIdx === -1) agendaIdx = 4;

    let recIdx = headerRow.findIndex(h => h.includes('recommend') || h.includes('observation') || h.includes('actionpoint'));
    if (recIdx === -1) recIdx = 5;

    let actionByIdx = headerRow.findIndex(h => h.includes('actionby') || h.includes('action') || h.includes('dept') || h.includes('responsibility') || h.includes('owner'));
    if (actionByIdx === -1) actionByIdx = 6;

    let openCloseIdx = headerRow.findIndex(h => h.includes('openclose') || h.includes('status') || h.includes('state') || h.includes('closure'));
    if (openCloseIdx === -1) openCloseIdx = 7;

    let remarksIdx = headerRow.findIndex(h => h.includes('remark') || h.includes('remak') || h.includes('comment') || h.includes('note'));
    if (remarksIdx === -1) remarksIdx = 8;

    const parsedItems = [];
    let lastValidId = '';
    let lastValidSubj = '';
    let lastValidDate = '';
    let lastValidRef = '';
    let lastValidAgenda = '';

    for (let r = 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || row.length === 0 || !row.some(c => c && c.trim().length > 0)) {
        continue;
      }

      const rawId = (row[idIdx] || '').trim();
      const rawSubj = (row[subjIdx] || '').trim();
      const rawDate = (row[dateIdx] || '').trim();
      const rawRef = (row[refIdx] || '').trim();
      const rawAgenda = (row[agendaIdx] || '').trim();
      const rawRec = (row[recIdx] || '').trim();
      const rawActionBy = (row[actionByIdx] || '').trim();
      const rawOpenClose = (row[openCloseIdx] || '').trim();
      const rawRemarks = (row[remarksIdx] || '').trim();

      // If id is present, update last valid meeting context
      if (rawId) {
        lastValidId = rawId;
        if (rawSubj) lastValidSubj = rawSubj;
        if (rawDate) lastValidDate = rawDate;
        if (rawRef) lastValidRef = rawRef;
        if (rawAgenda) lastValidAgenda = rawAgenda;
      }

      // If recommendation, actionBy, or openClose is present, it's a valid row
      if (rawRec || rawActionBy || rawOpenClose || rawId) {
        // Standardize openClose status: Open vs Close
        // Instruction: Count point as open if empty cell is found
        let normalizedStatus = 'Open';
        const sTrim = (rawOpenClose || '').trim();
        const sLower = sTrim.toLowerCase();
        if (!sTrim) {
          normalizedStatus = 'Open'; // Count point as open if empty cell is found
        } else if (sLower.includes('close') || sLower.includes('complete') || sLower.includes('done')) {
          normalizedStatus = 'Close';
        } else {
          normalizedStatus = 'Open';
        }

        parsedItems.push({
          sr: parsedItems.length + 1,
          id: rawId || lastValidId || String(parsedItems.length + 1),
          subject: rawSubj || lastValidSubj || 'SUB HSE (P) Meeting',
          dateOfMeeting: rawDate || lastValidDate || '-',
          refNo: rawRef || lastValidRef || '-',
          agenda: rawAgenda || lastValidAgenda || '-',
          recommendations: rawRec || '-',
          actionBy: rawActionBy || 'Info',
          openClose: normalizedStatus,
          remarks: rawRemarks || ''
        });
      }
    }

    return parsedItems.length > 0 ? parsedItems : INITIAL_SUB_HSE_P_OBSERVATIONS;
  };

  // Expose global seed and active data
  window.FPCL_SUB_HSE_P_INITIAL_SEED = INITIAL_SUB_HSE_P_OBSERVATIONS;
  window.FPCL_SUB_HSE_P_DATA = INITIAL_SUB_HSE_P_OBSERVATIONS;

})();
