/**
 * FPCL Executive Operations & Compliance Portal
 * Sub HSE - PSM (Process Safety Management) Dataset
 * Source: Process Safety Management Internal Audit Findings (Phase 1 June 2026)
 * Supports live Google Sheets CSV parsing and offline fallback
 */

window.FPCL_PSM_SHEET_URL = "https://docs.google.com/spreadsheets/d/1bFBRGKqIfO8Pn7qPSTU0pbdTB87ezDyXvVDnCbTGrx4/gviz/tq?tqx=out:csv&sheet=PSM";

// Robust RFC-4180 compliant CSV Parser supporting multiline quoted fields, escaped quotes, commas
window.parsePSMCSV = function(csvText) {
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

  if (rows.length < 2) return [];

  // Identify column indices from header
  const headers = rows[0].map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
  
  const findCol = (exactMatches, partialKeywords) => {
    const exactIdx = headers.findIndex(h => exactMatches.includes(h));
    if (exactIdx !== -1) return exactIdx;
    return headers.findIndex(h => partialKeywords.some(k => h.includes(k)));
  };

  const colSr = findCol(['sr', 'sno', 'serialno'], ['sr']);
  const colObs = findCol(['observationno', 'obsno', 'observationnumber'], ['obsno', 'observationno']);
  const colElement = findCol(['psmelement', 'element'], ['psmelement', 'element']);
  const colAudit = findCol(['auditno', 'auditnumber'], ['audit']);
  const colAuditeeDept = findCol(['auditeedepartment', 'auditeedept'], ['auditeedepartment', 'auditeedept']);
  const colAuditeeUnit = findCol(['auditeeunit'], ['auditeeunit']);
  const colFinding = findCol(['observationfindings', 'findings', 'finding', 'observationfinding', 'description'], ['finding', 'observationfinding']);
  const colActionDept = findCol(['actiondepartment', 'actiondept'], ['actiondept', 'actiondepartment']);
  const colActionUnit = findCol(['actionunit'], ['actionunit']);
  const colNature = findCol(['natureoffindings', 'nature'], ['nature', 'severity']);
  const colActionRemarks = findCol(['actiondepartmenetunitremarks', 'actiondepartmentremarks', 'actiondeptremarks'], ['actionremark', 'unitremark']);
  const colStatus = findCol(['statusopencloseoverdue', 'status'], ['status']);
  const colHseqRemarks = findCol(['hseqremarks', 'hseq'], ['hseq']);
  const colClosureDate = findCol(['closuredate'], ['closure']);
  const colAuditTeam = findCol(['auditteam'], ['team']);
  const colTargetDate = findCol(['targetdate'], ['target']);
  // Column Q (17th column, index 16) is named "Year" or "Audit Year"
  const colYear = findCol(['audityear', 'year', 'audityrs', 'years'], ['audityear', 'year']);

  const parsedItems = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    
    // Check if row has any meaningful content (skip trailing empty rows)
    const hasAnyContent = row.some(cell => cell && cell.trim().length > 0);
    if (!hasAnyContent) continue;

    const rawObs = (colObs !== -1 && row[colObs]) ? row[colObs].trim() : '';
    const rawFinding = (colFinding !== -1 && row[colFinding]) ? row[colFinding].trim() : '';
    // Skip row if it doesn't have an observation number and doesn't have a finding description
    if (!rawObs && !rawFinding) continue;

    const rawStatus = (colStatus !== -1 && row[colStatus]) ? row[colStatus].trim() : 'Open';
    // Normalize status: "Close", "Closed", "Closed." -> "Close"; "Overdue" -> "Overdue"; else "Open"
    let normStatus = 'Open';
    const sLower = rawStatus.toLowerCase();
    if (sLower.includes('close')) {
      normStatus = 'Close';
    } else if (sLower.includes('overdue')) {
      normStatus = 'Overdue';
    } else {
      normStatus = 'Open';
    }

    // Extract Year from Column Q (index 16) or header colYear
    let rawYear = '';
    if (colYear !== -1 && row[colYear] !== undefined && row[colYear] !== null) {
      rawYear = String(row[colYear]).trim();
    } else if (row.length > 16 && row[16] !== undefined && row[16] !== null) {
      rawYear = String(row[16]).trim();
    }

    let normYear = rawYear;
    if (!normYear) {
      const fallbackAudit = (colAudit !== -1 && row[colAudit]) ? row[colAudit] : (row[3] || '');
      const yearMatch = (fallbackAudit + ' ' + rawObs).match(/\b(20\d{2})\b/);
      if (yearMatch) {
        normYear = yearMatch[1];
      } else {
        normYear = '2026';
      }
    }

    const item = {
      sr: colSr !== -1 && row[colSr] ? parseInt(row[colSr], 10) || r : r,
      observationNo: rawObs || (colObs !== -1 ? row[colObs] : '') || `PSM-IA-2026-${String(r).padStart(4, '0')}`,
      psmElement: (colElement !== -1 ? row[colElement] : row[2]) || 'General',
      auditNo: (colAudit !== -1 ? row[colAudit] : row[3]) || 'Phase 1 June 2026',
      auditeeDepartment: (colAuditeeDept !== -1 ? row[colAuditeeDept] : row[4]) || '',
      auditeeUnit: (colAuditeeUnit !== -1 ? row[colAuditeeUnit] : row[5]) || '',
      finding: rawFinding || (colFinding !== -1 ? row[colFinding] : '') || '',
      actionDepartment: (colActionDept !== -1 ? row[colActionDept] : row[7]) || 'Unassigned',
      actionUnit: (colActionUnit !== -1 ? row[colActionUnit] : row[8]) || 'Unassigned',
      nature: (colNature !== -1 ? row[colNature] : row[9]) || 'Minor',
      actionRemarks: (colActionRemarks !== -1 ? row[colActionRemarks] : row[10]) || '',
      status: normStatus,
      rawStatus: rawStatus || normStatus,
      hseqRemarks: (colHseqRemarks !== -1 ? row[colHseqRemarks] : row[12]) || '',
      closureDate: (colClosureDate !== -1 && row[colClosureDate]) ? row[colClosureDate].trim() : (row[13] ? row[13].trim() : ''),
      auditTeam: (colAuditTeam !== -1 && row[colAuditTeam]) ? row[colAuditTeam].trim() : (row[14] ? row[14].trim() : ''),
      targetDate: (colTargetDate !== -1 && row[colTargetDate]) ? row[colTargetDate].trim() : (row[15] ? row[15].trim() : ''),
      year: normYear
    };

    parsedItems.push(item);
  }

  return parsedItems;
};

// Embedded Raw CSV representing the exact 121 findings from Google Sheets Phase 1 June 2026
window.FPCL_PSM_RAW_CSV = `Sr.,ObservationNo.,PSMElement,AuditNO,AuditeeDepartment,AuditeeUnit,Observation/Findings,ActionDepartment,ActionUnit,NatureofFindings,ActionDepartmenet/UnitRemarks,Status(Open/Close/Overdue),HSEQRemarks
1,PSM-IA-2026-0001,General,Phase 1 June 2026,Operations,CASH,Management attendence in D level meeting - Only JMC Attendance record found in files,Operations,CASH,Major,Management attandance in D level meeting is being marked with immediate effect.,Close,OK
2,PSM-IA-2026-0002,MC,Phase 1 June 2026,Operations,CASH,Monthly MSA plan compliance requires improvement,Operations,CASH,PSG,MSA compliance will be ensured by all MSA assigned persons,Close,ok
3,PSM-IA-2026-0003,MC,Phase 1 June 2026,Operations,CASH,Tracibility of PSM Training & Validation of COS employees need to be include in same list so that record to be maintained properly.,Operations,CASH,Minor,COS is also included in Tracibility document.,Close,
4,PSM-IA-2026-0004,RA&PHA,Phase 1 June 2026,Operations,CASH,"As per PHA Approved Plan (HAZOP Revalidation Plan), PHA of Coal handling was planned in May-26, However PHA Charter was approved on 16-June-2026.",Operations,CASH,Major,Kick of meeting was conducted on 20 May & accordingly charter was approved in June. PHA activities are in progress,Close,
5,PSM-IA-2026-0005,General,Phase 1 June 2026,Operations,CASH,"Employee Training Plan was available, however Training & Validation of PSM Elements was not covered in Training Plan",Operations,CASH,Minor,Training & Validation of PSM elements is already covered in L&D.,Open,shared responsibility between L&D +CASH Ops for case of cross training plans
6,PSM-IA-2026-0006,RA&PHA,Phase 1 June 2026,Operations,CASH,Basic Knowledge of RA&PPHA of JMCs observed Weak & requires further improvement.,Operations,CASH,Major,Trainings done on 21-July to enhance understanding on RA&PHA for the team,Close,
7,PSM-IA-2026-0007,RA&PHA,Phase 1 June 2026,Operations,CASH,Risk Assessment of operational activities was not conducted & record was not available,Operations,CASH,Major,JSA of coal shed along with addendum was already shared with PSM audit team which coveres the operational risk assessment,Close,ok
8,PSM-IA-2026-0008,PSI,Phase 1 June 2026,Operations,CASH,Records of packages observed scattered in files / not properly maintained.,Operations,CASH,Minor,Central data repository is being maintained,Close,Main responsibility with PTE
9,PSM-IA-2026-0009,General,Phase 1 June 2026,Operations,CASH,PSSR of nitrogen line package was not available (Missing Documentation),Operations,CASH,Major,Already discussed & Shared with Audit team,Close,ok
10,PSM-IA-2026-0010,PSI,Phase 1 June 2026,Operations,CASH,Safe operating envelope was not available,Operations,CASH,Major,Will be cover in PSI,Open,
11,PSM-IA-2026-0011,PSI,Phase 1 June 2026,Operations,CASH,List of Safety Critical Devices (SCDs) was not available.,Operations,CASH,Major,Will be cover in PSI,Close,Shared responsibility with PE&PTE
12,PSM-IA-2026-0012,General,Phase 1 June 2026,Operations,CASH,Document Control system was observed weak - as 5 different files were found in cabinet addressing Operating Procedures.,Operations,CASH,Minor,Copies are available for employee training purposes.,Close,ok Ensure only revised procedure is available.
13,PSM-IA-2026-0013,MC,Phase 1 June 2026,Operations,PSG,Senior Managements’ attendance record in D-Level meetings found missing.,Operations,PSG,Suggestion,Management Attendence sign off will be ensured from now onwards by all Management persons attending meeting,Close,OK
14,PSM-IA-2026-0014,MC,Phase 1 June 2026,Operations,PSG,Target dates & actions status were missing against MOMs of B-Level Meeting.,Operations,PSG,Minor,Format has been updated B by B level meeting Secretory,Open,Evidence required
15,PSM-IA-2026-0015,RA&PHA,Phase 1 June 2026,Operations,PSG,PHA/ RA related to the MOC-F and critical jobs were not accessible.,Operations,PSG,Major,All PHA's available placed in OPR PSG common folder.,Close,Noted
16,PSM-IA-2026-0016,RA&PHA,Phase 1 June 2026,Operations,PSG,Recommendation tracking / status was not available from previous PHAs.,Operations,PSG,Minor,HSE will share Tracking status of all Project Phase/Baseline PHA's to all départements in consultation with Manager Planning as discussed in Audit Meeting,Open,Point is still Open (HSE/ Operation)
17,PSM-IA-2026-0017,MOC-F,Phase 1 June 2026,Operations,PSG,PSSR is not being conducted for all Facility Changes.,Operations,PSG,Major,PSSR will be conducted for all facility changes as per procedure. Will be followed.,Close,
18,PSM-IA-2026-0018,MOC-F,Phase 1 June 2026,Operations,PSG,MOC initiation form and close out form is not being filled.,Operations,PSG,Minor,MOC close out form & initiation form is not the responsibility of OPR deptt as per approved procedure. Point will be discussed with HSE.,Open,Point is still Open (HSE/ Operation)
19,PSM-IA-2026-0019,MOC-F,Phase 1 June 2026,Operations,PSG,Temporary Air hose were applied to Boiler for hot spot without Temporary Change MOC approval,Operations,PSG,Major,Mentioned temporary change form will be issued,Open,Evidence required
20,PSM-IA-2026-0020,PSI,Phase 1 June 2026,Operations,PSG,No SCD list and Updated P&IDs were available,Operations,PSG,Major,"Updated P&ID's as of now were available however, updated P&ID's as per modifications is responsibility of Technical and SCD list development is part of PSI Package (in progress).",Close,Shared responsibility with PE&PTE
21,PSM-IA-2026-0021,RA&PHA,Phase 1 June 2026,Operations,PSG,Non-Compliance of Deferral protocols for PHA approved plan,Operations,PSG,Major,PHA Team Leads to initiate PSM Extension/Defferal form.,Open,Evidence required
22,PSM-IA-2026-0022,MC,Phase 1 June 2026,Reliability,Inspection,Monthly MSA plan compliance requires improvement,Admin & Security,Admin,Major,Please send the latest MSA plan for further action.,Close,On going
23,PSM-IA-2026-0023,MC,Phase 1 June 2026,Admin & Security,Admin,PSM Procedure was not accessible to Staff. Less awareness of PSM/ MC/ RAPHA,Admin & Security,Admin,Major,Relevant PSM material has been provided to all staff.,Close,Linke shared & awareness sessions conducted
24,PSM-IA-2026-0024,MC,Phase 1 June 2026,Admin & Security,Admin,Limited Management Presence Evidence found in D-Level Meeting,Admin & Security,Admin,Major,Point noted for compliance. Maximum management engagement will be ensured in future.,Close,noted
25,PSM-IA-2026-0025,MC,Phase 1 June 2026,Admin & Security,Admin,D-Level meeting not comply properly/ regularly in Mess. Unaware of Safety Policy/ Cardinal Rules,Admin & Security,Admin,Major,D-Level meetings will be held regularly and evidence will be shared with safety department,Close,Evidences to be verifed
26,PSM-IA-2026-0026,MOC-F,Phase 1 June 2026,Admin & Security,Admin,Limited awareness of MOC procedure. Not aware of how to access Level 1 and Level 2 procedures,Admin & Security,Admin,Minor,Point not understood as how this is related to administration. Please explain for the info of undersigned.,Close,Linke shared & awareness sessions conducted
27,PSM-IA-2026-0027,PSI,Phase 1 June 2026,Admin & Security,Admin,Limited awareness on PSI procedure. Not aware on how to access Level 1 and Level 2 procedures,Admin & Security,Admin,Minor,Point not understood as how this is related to administration. Please explain for the info of undersigned.,Close,Linke shared & awareness sessions conducted
28,PSM-IA-2026-0028,MC,Phase 1 June 2026,E&I,Instrument,Training and Validation record was not 100% for MC and RAPHA,E & I,Instrument,Minor,Communicated to respective members,Open,
29,PSM-IA-2026-0029,MC,Phase 1 June 2026,E&I,Instrument,MSA compliance was not 100% as per approved plan,E & I,Instrument,Major,noted,Close,On going
30,PSM-IA-2026-0030,RA&PHA,Phase 1 June 2026,E&I,Instrument,PHA/ RA related to the MOC-F and critical jobs were not accessible.,E & I,Instrument,Minor,Accessible in respective E&I packages,Close,action is linked with centralization
31,PSM-IA-2026-0031,MOC-F,Phase 1 June 2026,E&I,Instrument,PSSR is not being conducted for all Facility Changes related to E&I changes,E & I,Instrument,Major,"Conducted, One drive link has been updated",Close,"noted for future modifications, specially short PSSR"
32,PSM-IA-2026-0032,MOC-F,Phase 1 June 2026,E&I,Instrument,MOC initiation form and close out form is not being filled.,E & I,Electrical,Major,Drawing updated and shared via email also,Open,
33,PSM-IA-2026-0033,MOC-F,Phase 1 June 2026,E&I,Instrument,Level-III documents for Subtle Change & E&I MOC were not available,E & I,Instrument,Minor,,Open,Evidence required
34,PSM-IA-2026-0034,MC,Phase 1 June 2026,E&I,Instrument,2nd Party PSM audit observations report & status was not available,E & I,Instrument,Major,Shared with project engineering,Open,Evidence required
35,PSM-IA-2026-0035,MOC-F,Phase 1 June 2026,E&I,Instrument,Level-III documents for Subtle Change & E&I MOC were not available,E & I,Instrument,Minor,,Open,
36,PSM-IA-2026-0036,MOC-F,Phase 1 June 2026,E&I,Instrument,"A centralized Subtle Change Register/List is not available, resulting in effective monitoring and tracking of subtle changes across the facility.",E & I,Instrument,Minor,File uploaded into one drive,Open,Share evidences
37,PSM-IA-2026-0037,MC,Phase 1 June 2026,E&I,Instrument,Audit plan was not communicated down the line by UM,E & I,Electrical,Minor,,Close,On going
38,PSM-IA-2026-0038,MC,Phase 1 June 2026,E&I,Instrument,PSM KPIs for Year 2026 were not available,E & I,Electrical,Suggestion,,Close,
39,PSM-IA-2026-0039,MC,Phase 1 June 2026,E&I,Instrument,2nd Party PSM audit observations report & status was not available,E & I,Instrument,Major,,Open,
40,PSM-IA-2026-0040,RA&PHA,Phase 1 June 2026,E&I,Instrument,Access control for Subs station & SWG room was not implemented,E & I,Electrical,Minor,,Close,Done Through administrative Controls
41,PSM-IA-2026-0041,RA&PHA,Phase 1 June 2026,E&I,Instrument,Noise protection PPEs usage in high noise area of VFD room were not being followed,E & I,Electrical,Minor,,Close,"One time observation , though signagae & PPEs availble"
42,PSM-IA-2026-0042,RA&PHA,Phase 1 June 2026,E&I,Instrument,Arc flash study of SWG rooms was not available,E & I,Electrical,Minor,,Open,
43,PSM-IA-2026-0043,MOC-F,Phase 1 June 2026,E&I,Instrument,"SLD for VFD modification for B-01/02 for PA fans, were not updated",E & I,Electrical,Major,Update and shared,Close,email on dated 20-Aug-2016
44,PSM-IA-2026-0044,MOC-F,Phase 1 June 2026,E&I,Instrument,Actions of subtle changes were not being tracked or followed up,E & I,Electrical,Minor,"Excel type sheet available, however will be implemented after the development of enterprise software on organization level",Close,email on dated 20-Aug-2016
45,PSM-IA-2026-0045,PSI,Phase 1 June 2026,E&I,Instrument,"Centralized technical data i.e E&I Packages, SLDs etc , folder for Electrical department was not accessible to all engineers",E & I,Electrical,Minor,"PC share type folder availbale, however proper system will be implemented after the development organization level software",Close,"Only one of engineers , newly joined , needed access"
46,PSM-IA-2026-0046,MC,Phase 1 June 2026,Finance,Finance,No record for B-level & D-Level was found / accessable,Finance,Finance,Minor,,Open,Response awaited
47,PSM-IA-2026-0047,RA&PHA,Phase 1 June 2026,Finance,Finance,"Hazard Identification was conducted in Office based enviroment however, was found without approval / signed.",Finance,Finance,Major,HIRA Received,Close,email on dated 20-Aug-2026
48,PSM-IA-2026-0048,MC,Phase 1 June 2026,Reliability,Inspection,Monthly MSA plan compliance requires improvement,Finance,Finance,Major,,Open,Response awaited
49,PSM-IA-2026-0049,RA&PHA,Phase 1 June 2026,HSEQ,HSEQ,Checklist for the PHA applicability needs to be developed to clearly define the criteria for the PHA requirement for MOC(F).,HSEQ,HSEQ,Major,"Agreed, will be developed.",Open,to be done in line with FFC PQ
50,PSM-IA-2026-0050,MOC-F,Phase 1 June 2026,HSEQ,HSEQ,"No criteria is defined for Risk Assessment on when to conduct,Clarity was required on MOC initiation form as to who should initiate it.",HSEQ,HSEQ,Minor,Agreed,Open,to be done in line with FFC PQ
51,PSM-IA-2026-0051,MC,Phase 1 June 2026,HSEQ,HSEQ,As per procedure 3 topics should be discussed in D-Level Meeting same was not complied with.,HSEQ,HSEQ,Minor,Revised Guide Line Issued by Manager HSEQ on 21-July-2026,Close,"1. # of topics in D-Level Meetings (Clause 20.3.1):
 • Discussion / presentations on at least 02# topics (01#Safety, & 01# PSM) preferably by 02 different speakers. 
 • Environment topic shall be presented once every month, replacing either the Safety or PSM topic for that session."
52,PSM-IA-2026-0052,RA&PHA,Phase 1 June 2026,HSEQ,HSEQ,Risk assessment for modification job of any kind is not being performed by Projects till to date. Criteria for the RA to be developed for MOC-F packages.,HSEQ,HSEQ,Major,Agreed,Open,to be done in line with FFC PQ
53,PSM-IA-2026-0053,General,Phase 1 June 2026,HSEQ,HSEQ,"Only two fire extinguishers were observed within the entire field workshop. The adequacy, type, and distribution of fire extinguishers should be reviewed based on the workshop fire load, layout, and applicable fire protection standards to ensure sufficient emergency preparedness.",HSEQ,HSEQ,Suggestion,Reviwed,Close,"These are placed as per NFPA 15, however extra x 2 added in field workshops"
54,PSM-IA-2026-0054,MOC-F,Phase 1 June 2026,HSEQ,HSEQ,"Risk Review Forms are not being completed for temporary changes, as the responsibility for initiating and completing the form has not been clearly defined.",HSEQ,HSEQ,Major,Agreed,Close,Started from TRs of Mechnical Equipment
55,PSM-IA-2026-0055,General,Phase 1 June 2026,HSEQ,HSEQ,Employees were not aware of the formal process for reporting and escalating workplace health and safety concerns.,HSEQ,HSEQ,Suggestion,Frequently Awarness to be given,Close,Additional awreness is being given
56,PSM-IA-2026-0056,MC,Phase 1 June 2026,HSEQ,HSEQ,There is no plan available for D-level talks for HSE Unit,HSEQ,HSEQ,Major,Plan Prepared,Close,
57,PSM-IA-2026-0057,MC,Phase 1 June 2026,HSEQ,HSEQ,B- level MOMs actions status was not updated,HSEQ,HSEQ,Minor,Action updated,Close,Action updated
58,PSM-IA-2026-0058,MC,Phase 1 June 2026,HSEQ,HSEQ,Non-Compliance of MSA approved Procedure & MSA schedule to be highlited by HSE,HSEQ,HSEQ,Major,"Agreed, will be followed",Close,Started on monthly baisis in MM
59,PSM-IA-2026-0059,RA&PHA,Phase 1 June 2026,HSEQ,HSEQ,PHA matrix non-compliances observed and to be highlighted timely top management level,HSEQ,HSEQ,Major,"Agreed, will be highlighted timely",Close,Started to share on weekly basis.
60,PSM-IA-2026-0060,RA&PHA,Phase 1 June 2026,HSEQ,HSEQ,MSA Recommendations tracking mechanism and follow up was not available,HSEQ,HSEQ,Minor,Tracking Mechanism will be developed,Close,
61,PSM-IA-2026-0061,MC,Phase 1 June 2026,HSEQ,HSEQ,D-Level Feedback tracking mechanism and follow up was not available,HSEQ,HSEQ,Minor,Tracking Mechanism is developed,Close,Compiled will be shared this week
62,PSM-IA-2026-0062,General,Phase 1 June 2026,HSEQ,HSEQ,"Incident Investigation Reports Recommendations completion/compliance by the relevant departments, not being ensured, mechanism needs to be developed",HSEQ,HSEQ,Major,Trackiing Sheet developed,Close,Start updating reomendation
63,PSM-IA-2026-0063,MC,Phase 1 June 2026,L&D,L&D,B-Level meeting compliance records were not available with the Learning & Development (L&D) unit for verification.,L&D,L&D,Minor,Agreed,Open,
64,PSM-IA-2026-0064,MC,Phase 1 June 2026,L&D,L&D,"All mandatory Process Safety Management (PSM) training requirements to be incorporated into the respective departmental training plans. In addition, appropriate training records to be maintained jointly by the L&D and HSE departments.",L&D,L&D,Major,,Open,
65,PSM-IA-2026-0065,MC,Phase 1 June 2026,Mechanical,Machinery,"D-level meetings, Management Empolyees are not nominated for deleivering Safety Talk.",Mechanical,Machinery,Minor,Management employess have already nominated. However it will further improved,Close,Noted & Close
66,PSM-IA-2026-0066,RA&PHA,Phase 1 June 2026,Mechanical,Machinery,"In PHA Charter, nominated as member on call, however was attended the PHA Meeting / Session. Replacement Member approval record was not found.",Mechanical,Machinery,Minor,"Agreed. Only nominated member will be attend the the PHA meeting, if required.",Close,Closed on basis of instructions
67,PSM-IA-2026-0067,RA&PHA,Phase 1 June 2026,Mechanical,Machinery,No Risk Assessment record was available / found,Mechanical,Machinery,Major,Agreed. Risk assessment will be performed as per requirement of PSM,Close,HIRA evidence can be shared to close this action
68,PSM-IA-2026-0068,MC,Phase 1 June 2026,Mechanical,Machinery,Compliance of Shift Level Safety Talk (D-Level) was not done,Mechanical,Machinery,Major,Rotating shift personnel has been instructed to conduct weekly safety talk in the 1st Night Shift duty and continue this activity.,Close,Evidence received & Close
69,PSM-IA-2026-0069,MC,Phase 1 June 2026,Mechanical,Machinery,Monthly MSA plan compliance requires improvement,Mechanical,Machinery,Major,Will be followed,Close,
70,PSM-IA-2026-0070,MC,Phase 1 June 2026,Mechanical,Equipment,Non-compliance with the prescribed D-Level meetings for rotating shift personnel was observed. Records did not demonstrate that the meetings were being conducted in accordance with the established requirements.,Mechanical,Equipment,Major,Rotating shift personnel has been nstructed to conduct weekly safety talk in the 1st Night Shift duty and continue this activity.,Close,shared
71,PSM-IA-2026-0071,RA&PHA,Phase 1 June 2026,Mechanical,Equipment,"As specified in the RA & PHA Level 2 Procedure (Section 12.4.4), the Temporary Change Risk Review Form is required to be used for the risk evaluation of temporary changes. However, the required form was not being utilized during the review of temporary change packages.",Mechanical,Equipment,Major,"As the procedure for risk evaluation of temporary changes has been known, Risk evaluation for 02 temporary reapirs will be carried out in the fist week og August. Team has been formulated and will be led by EQPT Unit.",Close,RA forms initoated on route for approval
72,PSM-IA-2026-0072,MOC-F,Phase 1 June 2026,Mechanical,Equipment,"Risk Review Forms are not being completed for temporary changes, as the responsibility for initiating and completing the form has not been clearly defined.",Mechanical,Mechanical,Major,Will be followed,Close,"partial RA forms shared , to be completed and shared with HSEQ"
73,PSM-IA-2026-0073,MC,Phase 1 June 2026,Workshop,Machine-shop,"PSM SOPs, & Training records were not available & readily accessable.",Machinery,Machine-shop,Minor,,Close,
74,PSM-IA-2026-0074,MC,Phase 1 June 2026,Workshop,Civil,D-Level Meeting Plan was not available,Civil,Civil,Minor,,Open,
75,PSM-IA-2026-0075,MC,Phase 1 June 2026,Workshop,Civil,No record of B-level meeting was observed,Civil,Civil,Minor,,Open,
76,PSM-IA-2026-0076,RA&PHA,Phase 1 June 2026,Workshop,Machine-shop,Awarness of MC & RAPHA observed very low,Machinery,Machine-shop,Major,,Close,
77,PSM-IA-2026-0077,MC,Phase 1 June 2026,Workshop,Civil,No internal training and validation record is maintained to track the Training & validation.,Civil,Civil,Minor,,Close,
78,PSM-IA-2026-0079,MOC-F,Phase 1 June 2026,Reliability,Inspection,Risk Assesment was not being conducted for Temporary Change,Reliability,Inspection,Major,To be done by responsible units (initiating units). Area owner will ensure compliance,Open,
79,PSM-IA-2026-0078,MOC-F,Phase 1 June 2026,Workshop,Fabshop,Knowledge of MOC-F found unsatisfactory to workshop & tool room personnel & Civil Supervisor,Equipment,Fabshop,Major,,Open,
80,PSM-IA-2026-0080,MOC-F,Phase 1 June 2026,Reliability,Inspection,Level-III documents for T/C were not available,Reliability,Inspection,Minor,Need clarity (Please specify the missing form/forms),Open,Share evidences
81,PSM-IA-2026-0081,MC,Phase 1 June 2026,Reliability,Inspection,Newly inducted Employee (COS) not Trained & Validated,Reliability,Inspection,Major,Done,Close,Rcord availble in HSEq
82,PSM-IA-2026-0082,MC,Phase 1 June 2026,Reliability,Inspection,Training and Validation was not 100% for MC and RAPHA,Reliability,Inspection,Minor,100% completed for inspection unit on MC and RAPHA,Close,OK
83,PSM-IA-2026-0083,MC,Phase 1 June 2026,Reliability,Inspection,Monthly MSA plan compliance requires improvement,Reliability,Inspection,Major,MSA compliance has been improved from July,Close,In progress
84,PSM-IA-2026-0084,MC,Phase 1 June 2026,Admin & Security,Admin,Managements’ participation record in D-Level meetings found missing.,Admin & Security,Admin,Suggestion,D-Level committee is being attended by Sr. leadership and guidance is being provided where required.,Close,issue guidelines to PS on this as refresher being stewarding unit
85,PSM-IA-2026-0085,MOC-F,Phase 1 June 2026,HSEQ,HSEQ,"TR/TC changes, formal approval MOMs to be issued",Reliability,Inspection,Minor,MOMs to be issued by seceratory of relevant Sub HSE,Open,
86,PSM-IA-2026-0086,MC,Phase 1 June 2026,E&I,Electrical,2nd Party PSM audit observations report & status was not available,E & I,Electrical,Major,,Open,
87,PSM-IA-2026-0087,MC,Phase 1 June 2026,SCM,C&F,No records related to D-Level meeting feedback were available with the unit for verification.,SCM,C&F,Minor,,Close,Training Material Shared again to revised and improve
88,PSM-IA-2026-0088,MOC-F,Phase 1 June 2026,SCM,C&F,"Overall awareness and understanding of Process Safety Information (PSI), Management of Change (MOCF), and Risk Assessment & Process Hazard (RA&PH) were found to be inadequate.",SCM,C&F,Minor,,Close,Noted
89,PSM-IA-2026-0089,General,Phase 1 June 2026,Mechanical,Equipment,Management attendence in D level meeting - Only JMC Attendance record found in files,Mechanical,Equipment,Major,D-Level committee is being attended by Sr. leadership and guidance is being provided where required.,Open,
90,PSM-IA-2026-0090,MOC-F,Phase 1 June 2026,Operations,PSG,Risk Assessment was not being conducted for Facility Change as well,Technical,Process,Major,,Open,
91,PSM-IA-2026-0091,MOC-F,Phase 1 June 2026,Mechanical,Equipment,MOC initiation form and close out form is not being filled.,Technical,Project,Major,,Open,
92,PSM-IA-2026-0092,MOC-F,Phase 1 June 2026,E&I,Instrument,"Level-III documents for Subtle Change, T/C and E&I MOC were not available",E & I,Instrument,Minor,,Open,
93,PSM-IA-2026-0093,MC,Phase 1 June 2026,Operations,PSG,Monthly MSA plan compliance requires improvement,Operations,PSG,Major,,Close,Noted
94,PSM-IA-2026-0094,MC,Phase 1 June 2026,Admin & Security,Admin,Senior Managements’ attendance record in D-Level meetings found missing.,Admin & Security,Admin,Suggestion,D-Level committee is being attended by Sr. leadership and guidance is being provided where required.,Close,Attendance received
95,PSM-IA-2026-0095,General,Phase 1 June 2026,Technical,Project,Quality Checklist for D-level meetings is not filled by the unit.,Technical,Project,Minor,Same are now filled and record is being maintained in D-Lvel Meeting file.,Open,"Open till Completion, Target date required"
96,PSM-IA-2026-0096,MC,Phase 1 June 2026,Technical,Project,It is suggested to create common folder for PSM related documents of PTE for easy access.,Technical,Project,Suggestion,Same is covered in the PSI Dossier Development.,Close,noted
97,PSM-IA-2026-0097,MC,Phase 1 June 2026,Technical,Project,D-level meeting plan was not available with the unit,Technical,Project,Minor,"D-Level meeting plan is issued by Safety Coordinator, which is from Process Engineering.",Open,Evidence Required
98,PSM-IA-2026-0098,RA&PHA,Phase 1 June 2026,Technical,Project,Checkpoint in Mechanical package cover letter to be provided for Risk assessment requirement.,Technical,Project,Suggestion,Cover Letter of Mechanical Package is updated and same is included in the revised document.,Close,Noted
99,PSM-IA-2026-0099,RA&PHA,Phase 1 June 2026,Technical,Project,The trained from 3rd Party are not assigned RA&PHA (Rather non trained are assigned),Technical,Project,Minor,"This is a suggestion.
 
 As per PSM-WP-LEVEL-II-031, Clause 5.2.1 – Team Formation, the procedure states:
 
 ""The selection of the team members must be based on the skills needed for the planned studies.""
 
 The procedure specifies that team members should be selected based on the competencies required for the planned study. However, it does not state that the team members must have received training from a third-party organization.",Close,Sample Evidence Required
100,PSM-IA-2026-0100,MOC-F,Phase 1 June 2026,Technical,Project,MOC-F Closure Form is being used but is partially being filled out,Technical,Project,Minor,"Noted, All the gaps will be reviewed & addressed.",Close,Sample Evidence Required
101,PSM-IA-2026-0101,MOC-F,Phase 1 June 2026,Technical,Project,Compliance with the Facility Change Forms was not found (stewardship required),Technical,Project,Major,"Noted, All the gaps will be reviewed & addressed.",Open,Evidence of Change Information Form required.
102,PSM-IA-2026-0102,MOC-F,Phase 1 June 2026,Technical,Project,Compliance with the Change Information Form was not observed,Technical,Project,Minor,"As per PSM-WP-LEVEL-II-25, para 4.2 Change Request Inintation
 "" Following procedure shall be opted for initating change request
 SAP service notification request (X1, X2 or any other relevant type as per scope) "" 
 
 There is no need to inintate the change request form (Form # PSM-025-01 FACILITY CHANGE FORM).",Close,OK
103,PSM-IA-2026-0103,MOC-F,Phase 1 June 2026,Technical,Project,MOC Close-Out Form. A dedicated field verification checklist should be incorporated into the close-out documentation to ensure evidence of verification is maintained (Level-IV),Technical,Project,Suggestion,Suggestion noted,Close,Noted
104,PSM-IA-2026-0104,MOC-F,Phase 1 June 2026,Technical,Project,"The MOC reference number was not consistently recorded in the Close-Out Form. In addition, where the reference number was entered, an incorrect MOC Close-Out Form number (PSM-004-005) was used.",Technical,Project,Minor,"Noted, All the gaps will be reviewed & addressed.",Close,Ok
105,PSM-IA-2026-0105,MOC-F,Phase 1 June 2026,Technical,Project,The MOC Close-Out Form should be revised to incorporate Risk Assessment (RA) / Process Hazard Analysis (PHA) verification requirements and notification raising department identification should be included in the form (Level-IV),Technical,Project,Suggestion,Suggestion noted,Open,Noted
106,PSM-IA-2026-0106,PSI,Phase 1 June 2026,Technical,Project,"Development of the Process Safety Information (PSI) dossier is currently in progress. More than 10,000 documents have been identified for compilation and verification. Expected completion by First quarter of 2027.",Technical,Project,Major,PSI Dossier Development is in progress. Same is planned to be completed in Dec-26,Close,
107,PSM-IA-2026-0107,PSI,Phase 1 June 2026,Technical,Project,"Issued for Construction (IFC) packages are not maintained in a centralized document repository and are currently available only through email records. This creates a risk of delayed retrieval, inadequate document control, and potential loss of information in the event of the responsible engineer's unavailability. IFC packages should be maintained in a centralized repository until the Process Safety Information (PSI) management system is fully implemented and operational.",Technical,Project,Minor,"All the IFC Packages are uploaded on the SAP DMS modules, where it is accessible to all the employees with SAP. 
 All IFC packages are now also included in PSI Dossier. (Will be live after Dec-26)",Open,
108,PSM-IA-2026-0108,MOC-F,Phase 1 June 2026,E & I,Instrument,"Risk Review Forms are not being completed for temporary changes, as the responsibility for initiating and completing the form has not been clearly defined.",E & I,Instrument,Major,,Close,
109,PSM-IA-2026-0109,MC,Phase 1 June 2026,Technical,Process,Audit findings against 2nd party audit oby CHSEQ team wass not available with Lab team,Technical,Process,Major,Same is provided to the respective unit,Close,
110,PSM-IA-2026-0110,RA&PHA,Phase 1 June 2026,Technical,Laboratory,Chemical store key was openly accessible to all that can result in unauthorized / miss useage for access to high hazardeous chemicals,Technical,Laboratory,Suggestion,Suggestion noted,Open,
111,PSM-IA-2026-0111,RA&PHA,Phase 1 June 2026,Technical,Laboratory,Empty chemical bottles to be discarded timely and procedure to be developed,Technical,Laboratory,Minor,SOP is being worked out and will be implemented within target dat.,Close,
112,PSM-IA-2026-0112,MC,Phase 1 June 2026,Technical,Process,Participation of senior leadership in D level safety talk was limited,Technical,Process,Suggestion,D-Level committee is being attended by Sr. leadership and guidance is being provided where required.,Close,
113,PSM-IA-2026-0113,MOC-F,Phase 1 June 2026,Technical,Laboratory,Awarness of JMC employees need to be improved,Technical,Laboratory,Minor,All PSM procedures are being discussed in D Level committee for awareness of individuals,Close,Will be shared by Safety from now onwards
114,PSM-IA-2026-0114,General,Phase 1 June 2026,Technical,Process,PSM Procedures are not being shared for review and comments with lab,Technical,Process,Major,This point doesnot pertain to Process Engineering. It is sole responsibility of PSM team to include all stakeholders in loop of procedure review,Open,Evidence required
115,PSM-IA-2026-0115,MC,Phase 1 June 2026,Technical,Process,"Attendance sheets and feedback forms are available; however, some of the signatures are incomplete.",Technical,Process,Minor,Attendance sheet is now being signed by individuals available in subject meeting.,Open,Evidence required
116,PSM-IA-2026-0116,MC,Phase 1 June 2026,Technical,Process,B-level MOMs & actions status were not avialble,Technical,Process,Minor,Point pertains to PTE as UM PTE is chairman of B-Level committee. Furthermore record is being maintained now for same,Close,Noted
117,PSM-IA-2026-0117,RA&PHA,Phase 1 June 2026,Technical,Process,"Use PHA software instead of word/excel based working sheets to improve the quality/efficiency of PHA, as good practice.",Technical,Process,Suggestion,Noted and will be looked into for future compliance (if required),Close,Noted
118,PSM-IA-2026-0118,MOC-F,Phase 1 June 2026,Technical,Process,"Risk Assessment of Process package of VFD Modification for PA fans of boilers, did not mention Risk Ranking using Approved Risk Matrix (rather a generic format was used). PE agreed to implement for the future packages.",Technical,Process,Minor,The package was issued prior to RA&PHA module implementation and risk assesment was carried out as per requirement for the time. From now onwards procedure compliance is being maintained where required.\,Open,Target date required
119,PSM-IA-2026-0119,PSI,Phase 1 June 2026,Technical,Process,SCD approved list was not available,Technical,Process,Major,The same is being covered in PSI Dossier package.,Open,Target date required
120,PSM-IA-2026-0120,PSI,Phase 1 June 2026,Technical,Process,"All available P&IDs were of project completion phase. No updation was done onwards (auditees shared that few modifications are done in the field, but not updated in P&lDs)",Technical,Process,Major,The same is being covered in PSI Dossier package.,Open,
121,PSM-IA-2026-0121,MC,Phase 1 June 2026,Technical,Process,2nd Party PSM audit observations report & status was not available,Technical,Process,Major,,,Open,Evidence required`;

// Initial parsing on file load
window.FPCL_PSM_DATA = window.parsePSMCSV(window.FPCL_PSM_RAW_CSV);
