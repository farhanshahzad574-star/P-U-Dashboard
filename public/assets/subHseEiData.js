/**
 * FPCL Executive Operations & Compliance Portal
 * Sub HSE - E&I (Electrical & Instrumentation HSE Sub-Committee) Dataset & Parser
 * 
 * Target Google Sheet ID: 1ZcxlHSoQk4MjHFs7m0hfujM_7ud8JNNrMQg0cLq-Ruw
 * Tab: Sub_HSE _E&I
 * 
 * Schema:
 * - Column A: ID (Meeting ID number - single meeting of Sub HSE)
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

  const INITIAL_SUB_HSE_EI_OBSERVATIONS = [
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
      recommendations: 'The following was presented and approved by the chair.\n 1. A joint survey will be carried out by OPS-CASH, PE, ans E&I to identify the location in the coal open yard considering proper coal dust/pellet handling and availability of electrical power.',
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
      agenda: '1. Update on action points assigned during 1st sub SOC P/M/E&I meeting on Local dryout of boilers hot cyclone A & B nose area refractory by inspection unit.\n 2. E&I update on power supply scheme for local dryout activity during ATA 2026.',
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
      agenda: '1. Update on action points assigned during 1st sub SOC P/M/E&I meeting on Local dryout of boilers hot cyclone A & B nose area refractory by inspection unit.\n 2. E&I update on power supply scheme for local dryout activity during ATA 2026.',
      recommendations: 'Following is the summary of action points assigned.\n i.Mockup test results/ observations to be shared with HHI for consent.',
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
      agenda: '1. Update on action points assigned during 1st sub SOC P/M/E&I meeting on Local dryout of boilers hot cyclone A & B nose area refractory by inspection unit.\n 2. E&I update on power supply scheme for local dryout activity during ATA 2026.',
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
      agenda: '1. Update on action points assigned during 1st sub SOC P/M/E&I meeting on Local dryout of boilers hot cyclone A & B nose area refractory by inspection unit.\n 2. E&I update on power supply scheme for local dryout activity during ATA 2026.',
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
      agenda: '1. Update on action points assigned during 1st sub SOC P/M/E&I meeting on Local dryout of boilers hot cyclone A & B nose area refractory by inspection unit.\n 2. E&I update on power supply scheme for local dryout activity during ATA 2026.',
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
      agenda: '1. Update on action points assigned during 1st sub SOC P/M/E&I meeting on Local dryout of boilers hot cyclone A & B nose area refractory by inspection unit.\n 2. E&I update on power supply scheme for local dryout activity during ATA 2026.',
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
      agenda: '1. Update on action points assigned during 1st sub SOC P/M/E&I meeting on Local dryout of boilers hot cyclone A & B nose area refractory by inspection unit.\n 2. E&I update on power supply scheme for local dryout activity during ATA 2026.',
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
      agenda: '1. Update on action points assigned during 1st sub SOC P/M/E&I meeting on Local dryout of boilers hot cyclone A & B nose area refractory by inspection unit.\n 2. E&I update on power supply scheme for local dryout activity during ATA 2026.',
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
      agenda: '1. Update on action points assigned during 1st sub SOC P/M/E&I meeting on Local dryout of boilers hot cyclone A & B nose area refractory by inspection unit.\n 2. E&I update on power supply scheme for local dryout activity during ATA 2026.',
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
      recommendations: 'Detailed presentation incorporating the modalities for installing VED to PA fan was presented. The package was approved by the chair as presented with directives to be addressed and presented in relevant Sub SOC (E&I).\n Following are the details of same. \n \n Chair raised the concern that in the event of VED tripping and its subsequent transition to By-Pass mode, there is propbability of fan tripping on high in-rush current. Accordingly, chair directed to reviwed the same to avoid any tripping during bypass mode activation. E&I agreed to evaluate and present the outcome in relevant Sub SOC (E&I) forum.',
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
   * Universal CSV parser robust against multiline quotes, escaped quotes, and empty cells
   */
  function parseSubHseEiCSV(csvText) {
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
        if (cur.some(x => x && x.length > 0)) {
          rows.push(cur);
        }
        cur = [];
        field = '';
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
        // Empty cell found -> count as Open as strictly instructed
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
  window.FPCL_SUB_HSE_EI_INITIAL_SEED = INITIAL_SUB_HSE_EI_OBSERVATIONS;
  window.FPCL_SUB_HSE_EI_DATA = INITIAL_SUB_HSE_EI_OBSERVATIONS;
  window.parseSubHseEiCSV = parseSubHseEiCSV;

})();
