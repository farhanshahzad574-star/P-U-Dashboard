/**
 * FPCL Executive Operations & Compliance Portal
 * Strategic Employee Sheets Dataset & Definitions
 * 
 * Each department tile is connected to a single Google Sheet assigned to a unique employee.
 * The Strategic Dashboard tile serves as the Boss/Executive Summary rollup across all employee sheets.
 */

(function () {
  'use strict';

  const STRATEGIC_EMPLOYEES_CONFIG = [
    {
      id: 'strategic-master',
      name: 'Strategic Dashboard',
      code: 'STRAT-COO',
      isBossDashboard: true,
      category: 'Executive & Governance',
      icon: 'target',
      employeeName: 'Executive Leadership (COO)',
      employeeRole: 'Chief Operating Officer',
      employeeEmail: 'coo.office@fpcl.com',
      sheetUrl: '',
      sheetTab: 'ExecutiveRollup',
      gid: '0',
      theme: {
        bg: '#FAF5FF',
        border: '#E9D5FF',
        primary: '#7C3AED',
        secondary: '#A855F7',
        text: '#581C87',
        gradient: 'from-purple-600 via-violet-600 to-indigo-700',
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-200'
      },
      description: 'Executive rollup dashboard for COO to track overall status of actions across all departments.'
    },
    {
      id: 'admin-security',
      name: 'Admin & Security',
      code: 'ADM',
      isBossDashboard: false,
      category: 'Corporate Services',
      icon: 'shield-check',
      employeeName: 'Tariq Mehmood',
      employeeRole: 'Head of Administration & Security',
      employeeEmail: 'tariq.mehmood@fpcl.com',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'Admin_Security_Actions',
      gid: '0',
      theme: {
        bg: '#F8FAFC',
        border: '#CBD5E1',
        primary: '#334155',
        secondary: '#64748B',
        text: '#0F172A',
        gradient: 'from-slate-700 via-slate-800 to-zinc-900',
        badgeBg: 'bg-slate-100 text-slate-800 border-slate-300'
      },
      actions: [
        { id: 'ADM-01', title: 'Complete annual plant biometric access audit and contractor gate permissions review', priority: 'High', status: 'Closed', dueDate: '2026-02-15', closureDate: '2026-02-14', remarks: 'Gate audit finalized with 100% badge compliance verification.' },
        { id: 'ADM-02', title: 'Upgrade perimeter CCTV surveillance network along East boundary line', priority: 'High', status: 'Open', dueDate: '2026-04-10', closureDate: '', remarks: 'Vendor procurement RFP in progress with SCM.' },
        { id: 'ADM-03', title: 'Renew municipal administrative licenses and security guard deployment roster', priority: 'Medium', status: 'Closed', dueDate: '2026-01-30', closureDate: '2026-01-28', remarks: 'Security contractor agreement renewed for FY 2026.' },
        { id: 'ADM-04', title: 'Implement smart vehicle tracking and visitor parking automated gate protocol', priority: 'Medium', status: 'Open', dueDate: '2026-05-01', closureDate: '', remarks: 'Sensors delivered, installation scheduled for next shutdown.' },
        { id: 'ADM-05', title: 'Audit emergency physical evacuation muster points and administrative safety signage', priority: 'High', status: 'Closed', dueDate: '2026-03-05', closureDate: '2026-03-04', remarks: 'All 8 muster points updated with high-visibility solar markers.' }
      ]
    },
    {
      id: 'asset-integrity',
      name: 'Asset Integrity',
      code: 'AI',
      isBossDashboard: false,
      category: 'Asset Integrity & Engineering',
      icon: 'activity',
      employeeName: 'Kashif Rehman',
      employeeRole: 'Asset Integrity Manager',
      employeeEmail: 'kashif.rehman@fpcl.com',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'Asset_Integrity_Actions',
      gid: '1',
      theme: {
        bg: '#FDF4FF',
        border: '#F0ABFC',
        primary: '#C026D3',
        secondary: '#E879F9',
        text: '#701A75',
        gradient: 'from-fuchsia-600 via-pink-600 to-rose-600',
        badgeBg: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200'
      },
      actions: [
        { id: 'AI-01', title: 'Execute ultrasonic thickness wall gauging on reformer convective bank tubes', priority: 'High', status: 'Closed', dueDate: '2026-02-20', closureDate: '2026-02-18', remarks: 'Remaining wall thickness well within allowable ASME Section VIII limits.' },
        { id: 'AI-02', title: 'Complete Risk-Based Inspection (RBI) reassessment for primary ammonia storage tank', priority: 'High', status: 'Closed', dueDate: '2026-03-01', closureDate: '2026-02-28', remarks: 'RBI models refreshed with API-581 methodology.' },
        { id: 'AI-03', title: 'Conduct corrosion under insulation (CUI) pulsed eddy-current scans on overhead lines', priority: 'High', status: 'Open', dueDate: '2026-04-15', closureDate: '', remarks: 'Scaffolding erection in progress for loops 104 and 106.' },
        { id: 'AI-04', title: 'Replace aging sacrificial cathodic protection anodes on underground cooling water piping', priority: 'Medium', status: 'Closed', dueDate: '2026-01-25', closureDate: '2026-01-22', remarks: '16 zinc anode beds installed and potential readings normalized.' },
        { id: 'AI-05', title: 'Finalize structural integrity survey on boiler feed water deaerator vessel', priority: 'High', status: 'Open', dueDate: '2026-04-30', closureDate: '', remarks: 'Internal inspection scheduled during upcoming planned turnaround.' }
      ]
    },
    {
      id: 'business-development',
      name: 'Business Development',
      code: 'BD',
      isBossDashboard: false,
      category: 'Strategic Commercial',
      icon: 'trending-up',
      employeeName: 'Salman Farooq',
      employeeRole: 'Head of Business Development',
      employeeEmail: 'salman.farooq@fpcl.com',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'Business_Development_Actions',
      gid: '2',
      theme: {
        bg: '#F0FDF4',
        border: '#BBF7D0',
        primary: '#16A34A',
        secondary: '#4ADE80',
        text: '#14532D',
        gradient: 'from-emerald-600 via-green-600 to-teal-700',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200'
      },
      actions: [
        { id: 'BD-01', title: 'Submit off-take tariff optimization proposal to national regulatory board', priority: 'High', status: 'Closed', dueDate: '2026-02-10', closureDate: '2026-02-09', remarks: 'Proposal accepted for hearing review.' },
        { id: 'BD-02', title: 'Prepare feasibility model for 25MW solar hybrid generation integration', priority: 'High', status: 'Open', dueDate: '2026-04-20', closureDate: '', remarks: 'Financial model drafted; awaiting grid interconnect study results.' },
        { id: 'BD-03', title: 'Negotiate long-term industrial CO2 byproduct commercial off-take agreement', priority: 'Medium', status: 'Closed', dueDate: '2026-03-12', closureDate: '2026-03-11', remarks: 'MOU signed with regional beverage and dry-ice consortium.' },
        { id: 'BD-04', title: 'Evaluate synthetic ammonia downstream chemical expansion opportunities', priority: 'Medium', status: 'Open', dueDate: '2026-05-15', closureDate: '', remarks: 'Market demand forecast report commissioned.' }
      ]
    },
    {
      id: 'civil',
      name: 'Civil',
      code: 'CIV',
      isBossDashboard: false,
      category: 'Engineering & Maintenance',
      icon: 'hard-hat',
      employeeName: 'Engr. Farhan Ali',
      employeeRole: 'Civil Infrastructure Lead',
      employeeEmail: 'farhan.ali@fpcl.com',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'Civil_Actions',
      gid: '3',
      theme: {
        bg: '#FFFBEB',
        border: '#FDE68A',
        primary: '#D97706',
        secondary: '#FBBF24',
        text: '#78350F',
        gradient: 'from-amber-600 via-orange-600 to-yellow-600',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200'
      },
      actions: [
        { id: 'CIV-01', title: 'Reinforce secondary containment bund walls surrounding chemical acid storage tanks', priority: 'High', status: 'Closed', dueDate: '2026-01-20', closureDate: '2026-01-18', remarks: 'Acid-resistant epoxy lining cured and hydrostatic tested.' },
        { id: 'CIV-02', title: 'Repair heavy plant crane road pavement along heavy transit corridor B', priority: 'Medium', status: 'Closed', dueDate: '2026-02-28', closureDate: '2026-02-26', remarks: 'Asphalt paving and load compaction completed.' },
        { id: 'CIV-03', title: 'Perform seismic settlement monitoring and optical leveling on turbine foundations', priority: 'High', status: 'Open', dueDate: '2026-04-05', closureDate: '', remarks: 'Laser benchmarks established; final differential settlement report due.' },
        { id: 'CIV-04', title: 'Waterproof electrical substation sub-basement ahead of monsoon season', priority: 'High', status: 'Open', dueDate: '2026-04-25', closureDate: '', remarks: 'Injecting crystalline polymer barrier in exterior retaining walls.' }
      ]
    },
    {
      id: 'ei',
      name: 'E&I',
      code: 'EI',
      isBossDashboard: false,
      category: 'Engineering & Maintenance',
      icon: 'cpu',
      employeeName: 'Zeeshan Haider',
      employeeRole: 'Electrical & Instrumentation Manager',
      employeeEmail: 'zeeshan.haider@fpcl.com',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'EI_Actions',
      gid: '4',
      theme: {
        bg: '#EFF6FF',
        border: '#BFDBFE',
        primary: '#2563EB',
        secondary: '#60A5FA',
        text: '#1E3A8A',
        gradient: 'from-blue-600 via-indigo-600 to-cyan-600',
        badgeBg: 'bg-blue-100 text-blue-800 border-blue-200'
      },
      actions: [
        { id: 'EI-01', title: 'Calibrate all critical SIL-3 safety trip interlock transmitters in syngas loop', priority: 'High', status: 'Closed', dueDate: '2026-02-12', closureDate: '2026-02-11', remarks: 'Hart field calibrator logs recorded with zero deviation.' },
        { id: 'EI-02', title: 'Thermal infrared scanning of 11kV medium voltage switchgear breaker panels', priority: 'High', status: 'Closed', dueDate: '2026-03-02', closureDate: '2026-03-01', remarks: 'No hot spots detected; busbar torque checks verified.' },
        { id: 'EI-03', title: 'Replace aging DCS redundant controller cards in Unit 2 control room', priority: 'High', status: 'Open', dueDate: '2026-04-12', closureDate: '', remarks: 'Cards received; firmware synchronization planned for weekend window.' },
        { id: 'EI-04', title: 'Commission battery backup bank and UPS load bank test in Substation 3', priority: 'Medium', status: 'Closed', dueDate: '2026-01-15', closureDate: '2026-01-14', remarks: 'Full 8-hour discharge test successfully validated.' },
        { id: 'EI-05', title: 'Inspect grounding grid resistivity across hazardous area Zone 1 classification zones', priority: 'Medium', status: 'Open', dueDate: '2026-05-10', closureDate: '', remarks: 'Ground resistance testing underway with fall-of-potential meter.' }
      ]
    },
    {
      id: 'finance',
      name: 'Finance',
      code: 'FIN',
      isBossDashboard: false,
      category: 'Corporate Services',
      icon: 'calculator',
      employeeName: 'Bilal Ahmed',
      employeeRole: 'Chief Financial Officer',
      employeeEmail: 'bilal.ahmed@fpcl.com',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'Finance_Actions',
      gid: '5',
      theme: {
        bg: '#F0FDF4',
        border: '#86EFAC',
        primary: '#059669',
        secondary: '#34D399',
        text: '#064E3B',
        gradient: 'from-emerald-700 via-teal-700 to-green-800',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300'
      },
      actions: [
        { id: 'FIN-01', title: 'Finalize Q4 statutory audited financial accounts and external auditor review', priority: 'High', status: 'Closed', dueDate: '2026-01-31', closureDate: '2026-01-30', remarks: 'Unqualified audit opinion issued by Big Four auditor.' },
        { id: 'FIN-02', title: 'Execute interest rate hedging strategy for plant debt restructuring', priority: 'High', status: 'Closed', dueDate: '2026-02-28', closureDate: '2026-02-27', remarks: 'Hedging instruments executed at favorable cap rates.' },
        { id: 'FIN-03', title: 'Implement automated ERP purchase order to vendor three-way matching module', priority: 'Medium', status: 'Open', dueDate: '2026-04-18', closureDate: '', remarks: 'ERP staging integration completed; user training underway.' },
        { id: 'FIN-04', title: 'Optimize working capital credit facility covenants with consortium banks', priority: 'High', status: 'Open', dueDate: '2026-05-05', closureDate: '', remarks: 'Term sheet under discussion with lead syndication bank.' }
      ]
    },
    {
      id: 'hseq',
      name: 'HSEQ',
      code: 'HSEQ',
      isBossDashboard: false,
      category: 'Health, Safety & Quality',
      icon: 'shield-alert',
      employeeName: 'Dr. Asim Shahzad',
      employeeRole: 'Director HSEQ & Sustainability',
      employeeEmail: 'asim.shahzad@fpcl.com',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'HSEQ_Actions',
      gid: '6',
      theme: {
        bg: '#FEF2F2',
        border: '#FECACA',
        primary: '#DC2626',
        secondary: '#F87171',
        text: '#7F1D1D',
        gradient: 'from-red-600 via-rose-600 to-pink-700',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200'
      },
      actions: [
        { id: 'HSEQ-01', title: 'Conduct comprehensive PSM Tier 1 & Tier 2 process safety compliance audit', priority: 'High', status: 'Closed', dueDate: '2026-02-05', closureDate: '2026-02-04', remarks: 'Audit concluded with zero critical non-conformances.' },
        { id: 'HSEQ-02', title: 'Close out all external ISO 14001 and ISO 45001 surveillance audit observations', priority: 'High', status: 'Closed', dueDate: '2026-03-10', closureDate: '2026-03-09', remarks: 'Corrective action reports accepted and verified by registrar.' },
        { id: 'HSEQ-03', title: 'Implement plant-wide behavior-based safety (BBS) observation digital reporting app', priority: 'Medium', status: 'Open', dueDate: '2026-04-15', closureDate: '', remarks: 'Pilot testing in Ammonia unit; rollout to full plant underway.' },
        { id: 'HSEQ-04', title: 'Conduct full-scale hazardous chemical leak mutual-aid drill with city fire brigade', priority: 'High', status: 'Closed', dueDate: '2026-01-28', closureDate: '2026-01-27', remarks: 'Emergency response time achieved within 4.2 minutes.' },
        { id: 'HSEQ-05', title: 'Update continuous stack emission monitoring system (CEMS) calibration certs', priority: 'Medium', status: 'Open', dueDate: '2026-04-30', closureDate: '', remarks: 'EPA inspector site audit scheduled for end of month.' }
      ]
    },
    {
      id: 'hcm',
      name: 'HCM',
      code: 'HCM',
      isBossDashboard: false,
      category: 'Corporate Services & People',
      icon: 'users',
      employeeName: 'Nadia Khan',
      employeeRole: 'Head of Human Capital Management',
      employeeEmail: 'nadia.khan@fpcl.com',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'HCM_Actions',
      gid: '7',
      theme: {
        bg: '#FDF2F8',
        border: '#FBCFE8',
        primary: '#DB2777',
        secondary: '#F472B6',
        text: '#831843',
        gradient: 'from-pink-600 via-rose-600 to-purple-700',
        badgeBg: 'bg-pink-100 text-pink-800 border-pink-200'
      },
      actions: [
        { id: 'HCM-01', title: 'Complete annual corporate performance appraisals and 360-degree feedback reviews', priority: 'High', status: 'Closed', dueDate: '2026-01-31', closureDate: '2026-01-29', remarks: '100% staff evaluation closed and approved by Executive Committee.' },
        { id: 'HCM-02', title: 'Recruit certified senior rotating equipment reliability engineer', priority: 'High', status: 'Closed', dueDate: '2026-02-25', closureDate: '2026-02-24', remarks: 'Candidate onboarded and orientation completed.' },
        { id: 'HCM-03', title: 'Roll out executive succession planning and critical talent bench assessment', priority: 'High', status: 'Open', dueDate: '2026-04-20', closureDate: '', remarks: 'Departmental gap analysis submitted to Plant Director.' },
        { id: 'HCM-04', title: 'Upgrade plant employee medical insurance coverage and wellness clinic protocols', priority: 'Medium', status: 'Closed', dueDate: '2026-03-01', closureDate: '2026-02-28', remarks: 'New cashless insurance provider cards distributed to all employees.' },
        { id: 'HCM-05', title: 'Implement digitized overtime approval and shift handover punch portal', priority: 'Medium', status: 'Open', dueDate: '2026-05-10', closureDate: '', remarks: 'Integration testing with SAP payroll module in progress.' }
      ]
    },
    {
      id: 'ims',
      name: 'IMS',
      code: 'IMS',
      isBossDashboard: false,
      category: 'Health, Safety & Quality',
      icon: 'file-check',
      employeeName: 'Usama Rauf',
      employeeRole: 'IMS & Compliance Lead',
      employeeEmail: 'usama.rauf@fpcl.com',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'IMS_Actions',
      gid: '8',
      theme: {
        bg: '#F5F3FF',
        border: '#DDD6FE',
        primary: '#6D28D9',
        secondary: '#A78BFA',
        text: '#4C1D95',
        gradient: 'from-violet-600 via-purple-600 to-indigo-700',
        badgeBg: 'bg-violet-100 text-violet-800 border-violet-200'
      },
      actions: [
        { id: 'IMS-01', title: 'Update plant Standard Operating Procedures (SOP) control repository for 2026', priority: 'High', status: 'Closed', dueDate: '2026-02-18', closureDate: '2026-02-16', remarks: 'All 142 operating procedures reviewed and archived in electronic DMS.' },
        { id: 'IMS-02', title: 'Conduct internal Management Review Meeting (MRM) for ISO 9001 quality system', priority: 'High', status: 'Closed', dueDate: '2026-03-05', closureDate: '2026-03-04', remarks: 'Minutes of MRM published with management commitment signatures.' },
        { id: 'IMS-03', title: 'Complete annual enterprise risk register assessment across all 20 departments', priority: 'High', status: 'Open', dueDate: '2026-04-15', closureDate: '', remarks: '17 department risk registers submitted; 3 pending review.' },
        { id: 'IMS-04', title: 'Digitize internal audit finding non-conformance tracking workflows', priority: 'Medium', status: 'Open', dueDate: '2026-05-01', closureDate: '', remarks: 'Workflow automated in Microsoft 365 SharePoint framework.' }
      ]
    },
    {
      id: 'it',
      name: 'Information Technology',
      code: 'IT',
      isBossDashboard: false,
      category: 'Corporate Services',
      icon: 'server',
      employeeName: 'Kamran Siddiqui',
      employeeRole: 'Chief Information Officer',
      employeeEmail: 'kamran.siddiqui@fpcl.com',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'IT_Actions',
      gid: '9',
      theme: {
        bg: '#F8FAFC',
        border: '#94A3B8',
        primary: '#475569',
        secondary: '#64748B',
        text: '#0F172A',
        gradient: 'from-slate-700 via-gray-800 to-zinc-900',
        badgeBg: 'bg-slate-100 text-slate-800 border-slate-300'
      },
      actions: [
        { id: 'IT-01', title: 'Deploy hardware next-generation firewall and OT/IT network perimeter DMZ', priority: 'High', status: 'Closed', dueDate: '2026-01-25', closureDate: '2026-01-24', remarks: 'Industrial DMZ air-gap strictly isolating plant DCS from corporate network.' },
        { id: 'IT-02', title: 'Complete annual cyber incident penetration testing and vulnerability scans', priority: 'High', status: 'Closed', dueDate: '2026-02-20', closureDate: '2026-02-19', remarks: 'No critical or high vulnerabilities identified; report submitted to Board.' },
        { id: 'IT-03', title: 'Upgrade datacenter hyper-converged virtualization cluster and backup SAN', priority: 'High', status: 'Open', dueDate: '2026-04-10', closureDate: '', remarks: 'Hardware racked and wired; data replication testing in progress.' },
        { id: 'IT-04', title: 'Implement multi-factor authentication (MFA) enforcement on all remote VPN users', priority: 'High', status: 'Closed', dueDate: '2026-03-01', closureDate: '2026-02-28', remarks: 'Zero-trust authenticator requirement applied to 100% remote logins.' },
        { id: 'IT-05', title: 'Migrate enterprise business intelligence reporting to real-time Google Cloud data lake', priority: 'Medium', status: 'Open', dueDate: '2026-05-15', closureDate: '', remarks: 'ETL pipelines from plant historian 80% operational.' }
      ]
    },
    {
      id: 'inspection',
      name: 'Inspection & Workshop Services',
      code: 'INSP',
      isBossDashboard: false,
      category: 'Asset Integrity & Engineering',
      icon: 'wrench',
      employeeName: 'Adnan Qureshi',
      employeeRole: 'Inspection & Reliability Specialist',
      employeeEmail: 'adnan.qureshi@fpcl.com',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'Inspection_Actions',
      gid: '10',
      theme: {
        bg: '#F0F9FF',
        border: '#BAE6FD',
        primary: '#0284C7',
        secondary: '#38BDF8',
        text: '#0C4A6E',
        gradient: 'from-sky-600 via-cyan-600 to-blue-700',
        badgeBg: 'bg-sky-100 text-sky-800 border-sky-200'
      },
      actions: [
        { id: 'INSP-01', title: 'Hydrostatic and pop-pressure bench testing of 48 safety relief valves (PSVs)', priority: 'High', status: 'Closed', dueDate: '2026-02-15', closureDate: '2026-02-14', remarks: 'All valves re-seated, certified, and sealed with inspection tags.' },
        { id: 'INSP-02', title: 'Complete non-destructive dye-penetrant testing (PT) on turbine rotor blades', priority: 'High', status: 'Closed', dueDate: '2026-03-08', closureDate: '2026-03-07', remarks: 'Zero fatigue surface indications observed; clearance specs met.' },
        { id: 'INSP-03', title: 'Overhaul centralized machine workshop lathe and CNC milling equipment', priority: 'Medium', status: 'Open', dueDate: '2026-04-18', closureDate: '', remarks: 'Spindle bearing kit awaiting customs clearance.' },
        { id: 'INSP-04', title: 'Recertify plant overhead gantry and mobile mobile cranes with third-party surveyor', priority: 'High', status: 'Closed', dueDate: '2026-01-30', closureDate: '2026-01-29', remarks: 'Load test certifications renewed for 12 months.' },
        { id: 'INSP-05', title: 'Conduct magnetic particle inspection (MPI) on primary reformer manifold welds', priority: 'High', status: 'Open', dueDate: '2026-05-01', closureDate: '', remarks: 'Inspection crew mobilized for upcoming scheduled inspection.' }
      ]
    },
    {
      id: 'ld',
      name: 'L&D',
      code: 'LD',
      isBossDashboard: false,
      category: 'Corporate Services & People',
      icon: 'graduation-cap',
      employeeName: 'Maryam Nawaz',
      employeeRole: 'Head of Learning & Development',
      employeeEmail: 'maryam.nawaz@fpcl.com',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'LD_Actions',
      gid: '11',
      theme: {
        bg: '#FFF1F2',
        border: '#FECDD3',
        primary: '#E11D48',
        secondary: '#FB7185',
        text: '#881337',
        gradient: 'from-rose-600 via-pink-600 to-red-700',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200'
      },
      actions: [
        { id: 'LD-01', title: 'Execute mandatory process safety management (PSM) refresher training for all operators', priority: 'High', status: 'Closed', dueDate: '2026-02-10', closureDate: '2026-02-09', remarks: '98.5% plant operational staff achieved passing score.' },
        { id: 'LD-02', title: 'Conduct high-voltage electrical safety and Arc Flash prevention certification', priority: 'High', status: 'Closed', dueDate: '2026-03-05', closureDate: '2026-03-04', remarks: 'E&I team certified under NFPA 70E standards.' },
        { id: 'LD-03', title: 'Launch 2026 Young Engineers Mentorship and Professional Development Program', priority: 'Medium', status: 'Closed', dueDate: '2026-01-20', closureDate: '2026-01-19', remarks: '14 graduate trainee engineers assigned senior mentors.' },
        { id: 'LD-04', title: 'Implement digital interactive dynamic simulation training for emergency shutdowns', priority: 'High', status: 'Open', dueDate: '2026-04-25', closureDate: '', remarks: 'Operator training simulator (OTS) software upgrade in progress.' },
        { id: 'LD-05', title: 'Audit departmental training matrix compliance against annual training targets', priority: 'Medium', status: 'Open', dueDate: '2026-05-10', closureDate: '', remarks: 'Mid-year audit underway; 74% training hours logged.' }
      ]
    },
    {
      id: 'machinery',
      name: 'Machinery',
      code: 'MACH',
      isBossDashboard: false,
      category: 'Asset Integrity & Engineering',
      icon: 'cog',
      employeeName: 'Irfan Ullah',
      employeeRole: 'Rotating Machinery Specialist',
      employeeEmail: 'irfan.ullah@fpcl.com',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'Machinery_Actions',
      gid: '12',
      theme: {
        bg: '#FFF7ED',
        border: '#FED7AA',
        primary: '#EA580C',
        secondary: '#FB923C',
        text: '#7C2D12',
        gradient: 'from-orange-600 via-amber-600 to-yellow-700',
        badgeBg: 'bg-orange-100 text-orange-800 border-orange-200'
      },
      actions: [
        { id: 'MACH-01', title: 'Complete high-pressure boiler feed water pump mechanical dry gas seal replacement', priority: 'High', status: 'Closed', dueDate: '2026-02-18', closureDate: '2026-02-17', remarks: 'Pump re-aligned using laser tool; vibration amplitude < 1.2 mm/s.' },
        { id: 'MACH-02', title: 'Overhaul synthesis gas centrifugal compressor lube oil console and filtration unit', priority: 'High', status: 'Closed', dueDate: '2026-03-01', closureDate: '2026-02-28', remarks: 'Dual filter elements replaced and oil cleanliness NAS Class 6 achieved.' },
        { id: 'MACH-03', title: 'Install continuous wireless online vibration monitoring sensors on auxiliary cooling fans', priority: 'Medium', status: 'Open', dueDate: '2026-04-20', closureDate: '', remarks: '12 out of 16 sensors mounted; gateway telemetry configured.' },
        { id: 'MACH-04', title: 'Inspect steam turbine governor hydraulic valve linkages and servo-cylinder travel', priority: 'High', status: 'Closed', dueDate: '2026-01-22', closureDate: '2026-01-21', remarks: 'Valve hysteresis test passed with full range stroke repeatability.' },
        { id: 'MACH-05', title: 'Recondition spare rotor for refrigeration ammonia screw compressor', priority: 'High', status: 'Open', dueDate: '2026-05-05', closureDate: '', remarks: 'Rotor sent to OEM specialized facility for dynamic balancing.' }
      ]
    },
    {
      id: 'mechanical',
      name: 'Mechanical',
      code: 'MECH',
      isBossDashboard: false,
      category: 'Asset Integrity & Engineering',
      icon: 'settings',
      employeeName: 'Waqas Munir',
      employeeRole: 'Head of Mechanical Maintenance',
      employeeEmail: 'waqas.munir@fpcl.com',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'Mechanical_Actions',
      gid: '13',
      theme: {
        bg: '#F8FAFC',
        border: '#CBD5E1',
        primary: '#475569',
        secondary: '#94A3B8',
        text: '#1E293B',
        gradient: 'from-slate-600 via-slate-700 to-gray-800',
        badgeBg: 'bg-slate-100 text-slate-800 border-slate-300'
      },
      actions: [
        { id: 'MECH-01', title: 'Hydro-jet cleaning and retubing of cooling water heat exchanger E-201', priority: 'High', status: 'Closed', dueDate: '2026-02-14', closureDate: '2026-02-13', remarks: 'Hydro test carried out at 1.5x design pressure with zero leakage.' },
        { id: 'MECH-02', title: 'Replace severely corroded piping spool on cooling tower recirculating header', priority: 'High', status: 'Closed', dueDate: '2026-02-28', closureDate: '2026-02-27', remarks: 'Fabrication, NDT radiography, and flange torqueing signed off.' },
        { id: 'MECH-03', title: 'Overhaul and reseat manual block isolation gate valves on steam main line', priority: 'High', status: 'Open', dueDate: '2026-04-12', closureDate: '', remarks: 'Valve gland packing and wedges prepared for hot-tap isolation.' },
        { id: 'MECH-04', title: 'Rebuild internal baffles and mist eliminators inside syngas separator vessel', priority: 'Medium', status: 'Closed', dueDate: '2026-01-20', closureDate: '2026-01-19', remarks: 'Stainless steel wire mesh pads renewed and secured.' },
        { id: 'MECH-05', title: 'Inspect and grease all critical plant manual expansion joints and pipe spring hangers', priority: 'Medium', status: 'Open', dueDate: '2026-04-30', closureDate: '', remarks: 'Spring travel indicators surveyed; 4 hangers need recalibration.' }
      ]
    },
    {
      id: 'operations',
      name: 'Operations',
      code: 'OPS',
      isBossDashboard: false,
      category: 'Operations',
      icon: 'play',
      employeeName: 'Rizwan Akhtar',
      employeeRole: 'Plant Operations Manager',
      employeeEmail: 'rizwan.akhtar@fpcl.com',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'Operations_Actions',
      gid: '14',
      theme: {
        bg: '#F0FDF4',
        border: '#86EFAC',
        primary: '#15803D',
        secondary: '#22C55E',
        text: '#14532D',
        gradient: 'from-green-600 via-emerald-600 to-teal-700',
        badgeBg: 'bg-green-100 text-green-800 border-green-200'
      },
      actions: [
        { id: 'OPS-01', title: 'Maintain plant steady-state throughput at 102% nameplate design capacity', priority: 'High', status: 'Closed', dueDate: '2026-02-28', closureDate: '2026-02-28', remarks: 'Record production achieved with specific energy consumption reduced.' },
        { id: 'OPS-02', title: 'Execute controlled catalyst regeneration and reduction sequence in converter', priority: 'High', status: 'Closed', dueDate: '2026-03-05', closureDate: '2026-03-04', remarks: 'Bed temperature profile remained stable within design envelope.' },
        { id: 'OPS-03', title: 'Optimize reformer steam-to-carbon ratio to reduce fuel gas consumption', priority: 'High', status: 'Open', dueDate: '2026-04-10', closureDate: '', remarks: 'Advanced Process Control (APC) algorithm fine-tuning in progress.' },
        { id: 'OPS-04', title: 'Perform chemical cleaning of boiler steam drum and demineralized water circuits', priority: 'High', status: 'Closed', dueDate: '2026-01-18', closureDate: '2026-01-17', remarks: 'Silica and iron carryover levels within strict boiler specs.' },
        { id: 'OPS-05', title: 'Conduct quarterly shift operator emergency response and isolation drills', priority: 'Medium', status: 'Open', dueDate: '2026-05-02', closureDate: '', remarks: 'Three out of four shifts completed; last shift planned for next week.' }
      ]
    },
    {
      id: 'reliability',
      name: 'Reliability',
      code: 'REL',
      isBossDashboard: false,
      category: 'Asset Integrity & Engineering',
      icon: 'gauge',
      employeeName: 'Hammad Raza',
      employeeRole: 'Plant Reliability Lead',
      employeeEmail: 'hammad.raza@fpcl.com',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'Reliability_Actions',
      gid: '15',
      theme: {
        bg: '#FDF4FF',
        border: '#E879F9',
        primary: '#A21CAF',
        secondary: '#C026D3',
        text: '#701A75',
        gradient: 'from-purple-600 via-fuchsia-600 to-pink-700',
        badgeBg: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200'
      },
      actions: [
        { id: 'REL-01', title: 'Perform Root Cause Analysis (RCA) on auxiliary lube oil trip incident', priority: 'High', status: 'Closed', dueDate: '2026-02-08', closureDate: '2026-02-07', remarks: 'RCA findings published and fail-safe solenoid replacement executed.' },
        { id: 'REL-02', title: 'Execute plant lube oil tribology and spectrographic ferrography analysis on all turbines', priority: 'High', status: 'Closed', dueDate: '2026-03-02', closureDate: '2026-03-01', remarks: 'No severe metal wear particles detected; oil life verified for 6 months.' },
        { id: 'REL-03', title: 'Establish AI-powered predictive anomaly detection models for primary rotating assets', priority: 'High', status: 'Open', dueDate: '2026-04-20', closureDate: '', remarks: 'Sensor streaming pipelines ingested into plant machine learning model.' },
        { id: 'REL-04', title: 'Update Bad Actor equipment list and preventive maintenance task frequencies', priority: 'Medium', status: 'Closed', dueDate: '2026-01-31', closureDate: '2026-01-30', remarks: 'Preventive maintenance tasks rationalized in SAP PM module.' },
        { id: 'REL-05', title: 'Deploy ultrasound acoustic leak detection on plant compressed air and steam traps', priority: 'Medium', status: 'Open', dueDate: '2026-05-12', closureDate: '', remarks: 'Survey 65% complete; 18 defective steam traps identified for turnaround.' }
      ]
    },
    {
      id: 'scm',
      name: 'SCM',
      code: 'SCM',
      isBossDashboard: false,
      category: 'Corporate Services',
      icon: 'truck',
      employeeName: 'Faisal Javed',
      employeeRole: 'Head of Supply Chain Management',
      employeeEmail: 'faisal.javed@fpcl.com',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'SCM_Actions',
      gid: '16',
      theme: {
        bg: '#FEFCE8',
        border: '#FEF08A',
        primary: '#CA8A04',
        secondary: '#EAB308',
        text: '#713F12',
        gradient: 'from-amber-600 via-yellow-600 to-orange-700',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200'
      },
      actions: [
        { id: 'SCM-01', title: 'Secure critical turnaround long-lead spare parts and high-alloy valve stock', priority: 'High', status: 'Closed', dueDate: '2026-02-15', closureDate: '2026-02-14', remarks: 'All critical spares received in central warehouse with QA inspection certs.' },
        { id: 'SCM-02', title: 'Negotiate bulk supply agreements for water treatment chemicals and specialty resins', priority: 'High', status: 'Closed', dueDate: '2026-03-01', closureDate: '2026-02-28', remarks: 'Annual framework contracts awarded with 8.4% cost savings.' },
        { id: 'SCM-03', title: 'Audit warehouse inventory accuracy through barcode cyclic stock counts', priority: 'Medium', status: 'Closed', dueDate: '2026-01-25', closureDate: '2026-01-24', remarks: 'Physical inventory match rate verified at 99.4%.' },
        { id: 'SCM-04', title: 'Establish secondary domestic supplier qualifications for catalyst pre-filters', priority: 'Medium', status: 'Open', dueDate: '2026-04-18', closureDate: '', remarks: 'Sample testing underway in plant quality lab.' },
        { id: 'SCM-05', title: 'Digitize vendor performance scoring and automated delivery tracking scorecard', priority: 'Medium', status: 'Open', dueDate: '2026-05-08', closureDate: '', remarks: 'Supplier portal integration module currently in user acceptance testing.' }
      ]
    },
    {
      id: 'projects',
      name: 'Projects',
      code: 'PRJ',
      isBossDashboard: false,
      category: 'Asset Integrity & Engineering',
      icon: 'briefcase',
      employeeName: 'Khurram Shah',
      employeeRole: 'Director Capital Projects',
      employeeEmail: 'khurram.shah@fpcl.com',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'Projects_Actions',
      gid: '17',
      theme: {
        bg: '#F5F5F4',
        border: '#D6D3D1',
        primary: '#57534E',
        secondary: '#78716C',
        text: '#1C1917',
        gradient: 'from-stone-700 via-stone-800 to-zinc-900',
        badgeBg: 'bg-stone-100 text-stone-800 border-stone-300'
      },
      actions: [
        { id: 'PRJ-01', title: 'Complete civil piling and equipment foundation for off-gas recovery unit project', priority: 'High', status: 'Closed', dueDate: '2026-02-22', closureDate: '2026-02-20', remarks: 'Concrete core testing confirmed 40 MPa strength specifications.' },
        { id: 'PRJ-02', title: 'Receive and inspect heavy-lift distillation column package at port facility', priority: 'High', status: 'Closed', dueDate: '2026-03-10', closureDate: '2026-03-09', remarks: 'Customs cleared and heavy multi-axle trailer transport mobilized to plant.' },
        { id: 'PRJ-03', title: 'Erect structural steel pipe racks for interconnecting utility bridge expansion', priority: 'High', status: 'Open', dueDate: '2026-04-22', closureDate: '', remarks: 'Steel framing 70% erected; torque tightening inspections underway.' },
        { id: 'PRJ-04', title: 'Commission emergency instrument air compressor skid auxiliary tie-ins', priority: 'Medium', status: 'Closed', dueDate: '2026-01-30', closureDate: '2026-01-29', remarks: 'Skid piped up and preliminary no-load run completed.' },
        { id: 'PRJ-05', title: 'Finalize detailed engineering package for cooling tower cell 5 expansion', priority: 'High', status: 'Open', dueDate: '2026-05-15', closureDate: '', remarks: '3D model review 90% completed with EPC engineering partner.' }
      ]
    },
    {
      id: 'process',
      name: 'Process',
      code: 'PROC',
      isBossDashboard: false,
      category: 'Asset Integrity & Engineering',
      icon: 'flask-conical',
      employeeName: 'Zubair Hassan',
      employeeRole: 'Lead Process Engineer',
      employeeEmail: 'zubair.hassan@fpcl.com',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      sheetTab: 'Process_Actions',
      gid: '18',
      theme: {
        bg: '#F0FDFA',
        border: '#99F6E4',
        primary: '#0D9488',
        secondary: '#2DD4BF',
        text: '#134E4A',
        gradient: 'from-teal-600 via-cyan-600 to-emerald-700',
        badgeBg: 'bg-teal-100 text-teal-800 border-teal-200'
      },
      actions: [
        { id: 'PROC-01', title: 'Conduct steady-state Aspen HYSYS simulation modeling for synthesis loop debottlenecking', priority: 'High', status: 'Closed', dueDate: '2026-02-16', closureDate: '2026-02-15', remarks: 'Validated 4.5% potential throughput gain with minor pressure adjustments.' },
        { id: 'PROC-02', title: 'Perform comprehensive HAZOP revalidation study on reformer fuel supply headers', priority: 'High', status: 'Closed', dueDate: '2026-03-04', closureDate: '2026-03-03', remarks: 'HAZOP workshop concluded with multidisciplinary signoff.' },
        { id: 'PROC-03', title: 'Optimize carbon dioxide removal amine solvent circulation rate to cut steam duty', priority: 'High', status: 'Open', dueDate: '2026-04-14', closureDate: '', remarks: 'Field trial at 92% solvent rate underway with continuous gas sampling.' },
        { id: 'PROC-04', title: 'Review and approve Management of Change (MOC) engineering safety packages for Q1', priority: 'Medium', status: 'Closed', dueDate: '2026-01-28', closureDate: '2026-01-27', remarks: '19 MOCs reviewed; 17 approved and 2 returned for technical revision.' },
        { id: 'PROC-05', title: 'Establish energy benchmark metrics and specific steam consumption tracking daily report', priority: 'Medium', status: 'Open', dueDate: '2026-04-28', closureDate: '', remarks: 'Automated calculation scripts deployed to plant information system.' }
      ]
    }
  ];

  window.FPCL_STRATEGIC_DATA = {
    EMPLOYEES: STRATEGIC_EMPLOYEES_CONFIG
  };
})();
