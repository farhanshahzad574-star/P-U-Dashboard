/**
 * FPCL Executive Operations & Compliance Portal
 * Strategic Dashboard - Departmental Strategy & Performance Framework
 * 
 * Features 20 Professional Rounded Corner Tiles:
 * 1. Strategic Dashboard (First Featured Tile)
 * 2. Admin & Security
 * 3. Asset Integrity & IMS
 * 4. Business Development
 * 5. Civil
 * 6. E&I
 * 7. Finance
 * 8. HSEQ
 * 9. HCM
 * 10. IMS
 * 11. Information Technology
 * 12. Inspection & Workshop Services
 * 13. L&D
 * 14. Machinery
 * 15. Mechanical
 * 16. Operations
 * 17. Reliability
 * 18. SCM
 * 19. Technical
 * 20. Technical & HSE
 */

(function() {
  const STRATEGIC_TILES_DATA = [
    {
      id: 'strategic-master',
      name: 'Strategic Dashboard',
      code: 'STRAT',
      category: 'Corporate & Strategic Governance',
      isFeatured: true,
      icon: 'target',
      theme: {
        bg: '#FAF5FF',
        border: '#E9D5FF',
        primary: '#7C3AED',
        secondary: '#A855F7',
        text: '#581C87',
        gradient: 'from-purple-600 via-violet-600 to-indigo-700',
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-200'
      },
      subtitle: 'Executive Strategy & Corporate Direction',
      lead: 'Chief Executive & Board Governance',
      cadence: 'Quarterly Executive Milestones',
      progress: 94,
      status: 'Active',
      summary: 'Central corporate strategy, executive governance, long-term organizational transformation roadmaps, and cross-departmental milestone tracking.',
      tags: ['Corporate Vision', '2026 Roadmap', 'ESG Milestones', 'Executive KPIs'],
      initiatives: [
        { name: '2026 Operational Excellence & Zero-Harm Plant Program', owner: 'Executive Committee', target: 'Q4 2026', status: 'On Track', progress: 95 },
        { name: 'Enterprise Digital Transformation & Predictive Engineering', owner: 'Technical & IT Directorate', target: 'Q3 2026', status: 'On Track', progress: 90 },
        { name: 'Decarbonization & Energy Transition Feasibility Study', owner: 'Corporate Planning', target: 'Q4 2026', status: 'In Progress', progress: 85 }
      ],
      kpis: [
        { label: 'Strategic Alignment', val: '98%', status: 'Optimal' },
        { label: 'Milestones On-Track', val: '94%', status: 'Normal' },
        { label: 'Corporate OKRs', val: '12 Active', status: 'Optimal' }
      ]
    },
    {
      id: 'admin-security',
      name: 'Admin & Security',
      code: 'ADMIN',
      category: 'Corporate Services & People',
      icon: 'shield-check',
      theme: {
        bg: '#F8FAFC',
        border: '#CBD5E1',
        primary: '#334155',
        secondary: '#64748B',
        text: '#0F172A',
        gradient: 'from-slate-700 via-slate-800 to-zinc-900',
        badgeBg: 'bg-slate-100 text-slate-800 border-slate-300'
      },
      subtitle: 'Physical Security, Access & Facilities',
      lead: 'Head of Administration & Security',
      cadence: 'Monthly Governance Review',
      progress: 92,
      status: 'Active',
      summary: 'Perimeter defense, physical access control, security surveillance, facility asset management, and administrative logistics infrastructure.',
      tags: ['Access Control', 'CCTV AI', 'Facility Asset Mgt', 'Perimeter Defense'],
      initiatives: [
        { name: 'Biometric Gate Access & AI Video Surveillance Upgrade', owner: 'Security Operations', target: 'Q2 2026', status: 'Completed', progress: 100 },
        { name: 'Plant Perimeter Barrier Hardening & Patrol Protocols', owner: 'Security Team', target: 'Q3 2026', status: 'On Track', progress: 90 },
        { name: 'Facility Energy Optimization & Green Office Standards', owner: 'Admin Services', target: 'Q4 2026', status: 'In Progress', progress: 80 }
      ],
      kpis: [
        { label: 'Security Compliance', val: '100%', status: 'Optimal' },
        { label: 'Security Breaches', val: '0 Breaches', status: 'Optimal' },
        { label: 'Facility Uptime', val: '99.2%', status: 'Optimal' }
      ]
    },
    {
      id: 'asset-integrity-ims',
      name: 'Asset Integrity & IMS',
      code: 'AIM',
      category: 'Safety, Quality & Integrity',
      icon: 'activity',
      theme: {
        bg: '#F0F9FF',
        border: '#BAE6FD',
        primary: '#0284C7',
        secondary: '#38BDF8',
        text: '#0C4A6E',
        gradient: 'from-sky-600 via-cyan-600 to-blue-700',
        badgeBg: 'bg-sky-100 text-sky-800 border-sky-200'
      },
      subtitle: 'Asset Lifecycle & Pressure Boundary Integrity',
      lead: 'Lead Asset Integrity Engineer',
      cadence: 'Bi-Monthly Tracking',
      progress: 96,
      status: 'Active',
      summary: 'Plant-wide structural integrity, Risk-Based Inspection (RBI), pressure vessel corrosion surveillance, and IMS standard compliance.',
      tags: ['RBI Inspection', 'CUI Mitigation', 'Vessel Integrity', 'Corrosion Monitoring'],
      initiatives: [
        { name: 'Risk-Based Inspection (RBI) Program Rollout on Boilers', owner: 'Asset Integrity Unit', target: 'Q2 2026', status: 'Completed', progress: 100 },
        { name: 'Corrosion Under Insulation (CUI) Ultrasonic Survey', owner: 'Integrity & NDT Team', target: 'Q3 2026', status: 'On Track', progress: 95 },
        { name: 'ISO 55001 Asset Management Framework Re-certification', owner: 'IMS Section', target: 'Q4 2026', status: 'In Progress', progress: 88 }
      ],
      kpis: [
        { label: 'Integrity Index', val: '98.4%', status: 'Optimal' },
        { label: 'LOPC Incidents', val: '0 Events', status: 'Optimal' },
        { label: 'Overdue Inspections', val: '0 Items', status: 'Optimal' }
      ]
    },
    {
      id: 'business-development',
      name: 'Business Development',
      code: 'BD',
      category: 'Corporate & Strategic Governance',
      icon: 'trending-up',
      theme: {
        bg: '#ECFDF5',
        border: '#A7F3D0',
        primary: '#059669',
        secondary: '#34D399',
        text: '#064E3B',
        gradient: 'from-emerald-600 via-teal-600 to-green-700',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200'
      },
      subtitle: 'Commercial Expansion & Strategic Alliances',
      lead: 'Director of Business Development',
      cadence: 'Monthly Commercial Review',
      progress: 88,
      status: 'Active',
      summary: 'Power purchase agreements, commercial off-take ventures, auxiliary steam monetisation, and industrial energy supply agreements.',
      tags: ['Power Off-take', 'Steam Supply', 'PPA Negotiations', 'Growth Pipeline'],
      initiatives: [
        { name: 'Captive Power Expansion & Direct B2B Wheeling Tariffs', owner: 'BD Team', target: 'Q3 2026', status: 'On Track', progress: 85 },
        { name: 'Secondary Steam Supply to Neighboring Industrial Units', owner: 'Commercial Section', target: 'Q4 2026', status: 'In Progress', progress: 75 },
        { name: 'Hybrid Renewable Energy Integration Feasibility Study', owner: 'Strategy & BD', target: 'Q4 2026', status: 'In Progress', progress: 80 }
      ],
      kpis: [
        { label: 'Commercial Pipeline', val: '+$14M Opty', status: 'Optimal' },
        { label: 'Strategic MoUs', val: '3 Executed', status: 'Optimal' },
        { label: 'Contract Adherence', val: '100%', status: 'Optimal' }
      ]
    },
    {
      id: 'civil',
      name: 'Civil',
      code: 'CIVIL',
      category: 'Operations & Engineering',
      icon: 'building-2',
      theme: {
        bg: '#FFFBEB',
        border: '#FDE68A',
        primary: '#D97706',
        secondary: '#FBBF24',
        text: '#78350F',
        gradient: 'from-amber-600 via-yellow-600 to-orange-700',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200'
      },
      subtitle: 'Civil Infrastructure & Plant Foundations',
      lead: 'Head of Civil Engineering',
      cadence: 'Quarterly Survey Cycle',
      progress: 95,
      status: 'Active',
      summary: 'Structural integrity of turbine pedestals, boiler foundations, cooling tower civil basins, drainage networks, and seismic stabilization.',
      tags: ['Foundations', 'Cooling Basin', 'Structural Health', 'Settlement Surveys'],
      initiatives: [
        { name: 'Cooling Tower Concrete Basin Chemical Rehabilitation', owner: 'Civil Engineering', target: 'Q2 2026', status: 'Completed', progress: 100 },
        { name: 'Turbine Island Foundation Differential Settlement Survey', owner: 'Civil Specialists', target: 'Q3 2026', status: 'On Track', progress: 95 },
        { name: 'Plant Storm Water Drainage & Bund Wall Reinforcement', owner: 'Civil Maintenance', target: 'Q4 2026', status: 'On Track', progress: 90 }
      ],
      kpis: [
        { label: 'Structural Safety', val: '100%', status: 'Optimal' },
        { label: 'Foundation Health', val: 'Nominal', status: 'Optimal' },
        { label: 'Work Orders Done', val: '96.2%', status: 'Normal' }
      ]
    },
    {
      id: 'ei',
      name: 'E&I',
      code: 'E&I',
      category: 'Operations & Engineering',
      icon: 'zap',
      theme: {
        bg: '#FEF3C7',
        border: '#FCD34D',
        primary: '#B45309',
        secondary: '#F59E0B',
        text: '#78350F',
        gradient: 'from-amber-500 via-orange-600 to-red-600',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300'
      },
      subtitle: 'Electrical & Instrumentation Systems',
      lead: 'Manager Electrical & Instrumentation',
      cadence: 'Continuous & Monthly',
      progress: 96,
      status: 'Active',
      summary: 'High-voltage substations, DCS automation controllers, protection relays, transmitter calibrations, and Safety Instrumented Systems (SIS/SIL).',
      tags: ['132kV Substation', 'SIL Verification', 'DCS Optimization', 'Switchgear Relay'],
      initiatives: [
        { name: '132kV Substation Microprocessor Protection Relay Upgrade', owner: 'Electrical Section', target: 'Q2 2026', status: 'Completed', progress: 100 },
        { name: 'SIL-3 Safety Instrumented Loop Proof-Testing & Certification', owner: 'Instrumentation Unit', target: 'Q3 2026', status: 'On Track', progress: 95 },
        { name: 'DCS Controller Firmware Hardening & Redundant Ring Test', owner: 'Automation Team', target: 'Q4 2026', status: 'In Progress', progress: 85 }
      ],
      kpis: [
        { label: 'Instrument Availability', val: '99.9%', status: 'Optimal' },
        { label: 'Electrical Trips', val: '0 Events', status: 'Optimal' },
        { label: 'SIL Compliance', val: '100%', status: 'Optimal' }
      ]
    },
    {
      id: 'finance',
      name: 'Finance',
      code: 'FIN',
      category: 'Corporate & Strategic Governance',
      icon: 'banknote',
      theme: {
        bg: '#F0FDFA',
        border: '#99F6E4',
        primary: '#0D9488',
        secondary: '#2DD4BF',
        text: '#134E4A',
        gradient: 'from-teal-600 via-emerald-600 to-cyan-700',
        badgeBg: 'bg-teal-100 text-teal-800 border-teal-200'
      },
      subtitle: 'Financial Governance & Fiscal Management',
      lead: 'Chief Financial Officer',
      cadence: 'Monthly Closing & Forecasts',
      progress: 93,
      status: 'Active',
      summary: 'Fiscal governance, Capex/Opex budgetary control, fuel tariff reconciliation, statutory external audits, and working capital optimization.',
      tags: ['Budget Control', 'Tariff Model', 'Capex Efficiency', 'Fiscal Audits'],
      initiatives: [
        { name: 'Plant Heat Rate Fuel Cost Variance Rationalization', owner: 'Financial Planning', target: 'Q2 2026', status: 'Completed', progress: 100 },
        { name: 'Capital Expenditure (CAPEX) ROI Benchmarking for 2026 Turnaround', owner: 'Accounts & Finance', target: 'Q3 2026', status: 'On Track', progress: 92 },
        { name: 'ERP Automated Treasury & Vendor Payment Pipeline', owner: 'Finance Ops', target: 'Q4 2026', status: 'In Progress', progress: 85 }
      ],
      kpis: [
        { label: 'Budget Variance', val: '< 1.5%', status: 'Optimal' },
        { label: 'Audit Exceptions', val: '0 Findings', status: 'Optimal' },
        { label: 'Cash Flow Velocity', val: 'Healthy', status: 'Optimal' }
      ]
    },
    {
      id: 'hseq',
      name: 'HSEQ',
      code: 'HSEQ',
      category: 'Safety, Quality & Integrity',
      icon: 'shield-alert',
      theme: {
        bg: '#F0FDF4',
        border: '#BBF7D0',
        primary: '#16A34A',
        secondary: '#4ADE80',
        text: '#14532D',
        gradient: 'from-emerald-600 via-green-600 to-teal-700',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200'
      },
      subtitle: 'Health, Safety, Environment & Quality',
      lead: 'Head of HSEQ Directorate',
      cadence: 'Continuous & Monthly Review',
      progress: 98,
      status: 'Active',
      summary: 'Zero-Harm occupational health, behavioral safety culture, CEMS environmental emission compliance, and ISO 14001/45001 benchmarks.',
      tags: ['Safe Man-Hours', 'Zero Harm', 'CEMS Emission', 'BBS Audits'],
      initiatives: [
        { name: 'Behavioral-Based Safety (BBS) Field Coaching Campaign', owner: 'Safety Section', target: 'Q2 2026', status: 'Completed', progress: 100 },
        { name: 'Continuous Stack Emission (CEMS) Automated Regulatory Link', owner: 'Environment Team', target: 'Q3 2026', status: 'On Track', progress: 98 },
        { name: 'ISO 14001 & ISO 45001 Unified Triennial Surveillance Audit', owner: 'Quality Section', target: 'Q4 2026', status: 'On Track', progress: 95 }
      ],
      kpis: [
        { label: 'Safe Man-Hours', val: '6.24M Hrs', status: 'Optimal' },
        { label: 'LTI Frequency Rate', val: '0.00', status: 'Optimal' },
        { label: 'PTW Audit Score', val: '99.4%', status: 'Optimal' }
      ]
    },
    {
      id: 'hcm',
      name: 'HCM',
      code: 'HCM',
      category: 'Corporate Services & People',
      icon: 'users-round',
      theme: {
        bg: '#FFF1F2',
        border: '#FECDD3',
        primary: '#E11D48',
        secondary: '#FB7185',
        text: '#881337',
        gradient: 'from-rose-600 via-pink-600 to-red-700',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200'
      },
      subtitle: 'Human Capital & Organizational Development',
      lead: 'Head of Human Capital Management',
      cadence: 'Monthly HR Review',
      progress: 91,
      status: 'Active',
      summary: 'Strategic talent acquisition, technical succession planning, employee engagement, compensation governance, and leadership development.',
      tags: ['Succession Plan', 'Talent Retention', 'Employee Engagement', 'HRMS Portal'],
      initiatives: [
        { name: 'Key Engineering Succession & Critical Capability Matrix', owner: 'Talent Management', target: 'Q2 2026', status: 'Completed', progress: 100 },
        { name: 'Plant Employee Engagement & Well-being Survey 2026', owner: 'HR Operations', target: 'Q3 2026', status: 'On Track', progress: 90 },
        { name: 'Self-Service HRMS Mobile Workflow Deployment', owner: 'HCM Digital', target: 'Q4 2026', status: 'In Progress', progress: 80 }
      ],
      kpis: [
        { label: 'Critical Role Coverage', val: '100%', status: 'Optimal' },
        { label: 'Employee Turnover', val: '< 3.2%', status: 'Optimal' },
        { label: 'Staff Training Hours', val: '42 hrs/emp', status: 'Optimal' }
      ]
    },
    {
      id: 'ims',
      name: 'IMS',
      code: 'IMS',
      category: 'Safety, Quality & Integrity',
      icon: 'layers',
      theme: {
        bg: '#EEF2FF',
        border: '#C7D2FE',
        primary: '#4F46E5',
        secondary: '#818CF8',
        text: '#1E1B4B',
        gradient: 'from-indigo-600 via-blue-600 to-violet-700',
        badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200'
      },
      subtitle: 'Integrated Management Systems & ISO Standards',
      lead: 'Lead IMS & Compliance Specialist',
      cadence: 'Quarterly Governance Audit',
      progress: 94,
      status: 'Active',
      summary: 'ISO 9001/14001/45001/55001 integrated standards, internal quality audits, CAR/NCR lifecycle resolution, and SOP standard governance.',
      tags: ['ISO Standards', 'Internal Audits', 'NCR Resolution', 'SOP Governance'],
      initiatives: [
        { name: 'Annual Integrated Internal Audit Plan Execution (Phase 1 & 2)', owner: 'IMS Audit Team', target: 'Q2 2026', status: 'Completed', progress: 100 },
        { name: 'CAR Velocity: 30-Day Root-Cause Resolution Protocol', owner: 'Compliance Lead', target: 'Q3 2026', status: 'On Track', progress: 92 },
        { name: 'Electronic Document & SOP Version Control Modernization', owner: 'IMS Governance', target: 'Q4 2026', status: 'In Progress', progress: 88 }
      ],
      kpis: [
        { label: 'CAR Closure Rate', val: '94.5%', status: 'Optimal' },
        { label: 'Major Non-Conformances', val: '0 Active', status: 'Optimal' },
        { label: 'Audit Schedule', val: '100% On-Time', status: 'Optimal' }
      ]
    },
    {
      id: 'information-technology',
      name: 'Information Technology',
      code: 'IT',
      category: 'Corporate Services & People',
      icon: 'server',
      theme: {
        bg: '#F0F9FF',
        border: '#7DD3FC',
        primary: '#0284C7',
        secondary: '#38BDF8',
        text: '#0C4A6E',
        gradient: 'from-sky-600 via-blue-600 to-indigo-700',
        badgeBg: 'bg-sky-100 text-sky-800 border-sky-200'
      },
      subtitle: 'OT/IT Infrastructure & Cyber Resilience',
      lead: 'Head of Information Technology',
      cadence: 'Bi-Weekly Sprints',
      progress: 95,
      status: 'Active',
      summary: 'Industrial cybersecurity (Purdue model), OT network air-gapping, disaster recovery, cloud infrastructure, and ERP platform stability.',
      tags: ['Cybersecurity', 'OT Air-Gap', 'Disaster Recovery', 'Network Uptime'],
      initiatives: [
        { name: 'OT Industrial Network Air-Gap & Firewall Segmentation', owner: 'Cybersecurity Team', target: 'Q2 2026', status: 'Completed', progress: 100 },
        { name: 'Disaster Recovery (DR) Hot-Site Automated Failover Simulation', owner: 'Infrastructure Unit', target: 'Q3 2026', status: 'On Track', progress: 95 },
        { name: 'Enterprise Wi-Fi 6 Mesh for Field Operators & Tablets', owner: 'Network Engineering', target: 'Q4 2026', status: 'In Progress', progress: 85 }
      ],
      kpis: [
        { label: 'Infrastructure Uptime', val: '99.99%', status: 'Optimal' },
        { label: 'Cyber Incidents', val: '0 Breaches', status: 'Optimal' },
        { label: 'Mean Time To Recover', val: '< 15 mins', status: 'Optimal' }
      ]
    },
    {
      id: 'inspection-workshop-services',
      name: 'Inspection & Workshop Services',
      code: 'IWS',
      category: 'Safety, Quality & Integrity',
      icon: 'microscope',
      theme: {
        bg: '#F8FAFC',
        border: '#CBD5E1',
        primary: '#475569',
        secondary: '#94A3B8',
        text: '#1E293B',
        gradient: 'from-slate-600 via-gray-700 to-zinc-800',
        badgeBg: 'bg-slate-100 text-slate-800 border-slate-300'
      },
      subtitle: 'NDT, QA/QC, Machining & Reconditioning',
      lead: 'Superintendent Inspection & Workshop',
      cadence: 'Daily / Continuous Operations',
      progress: 97,
      status: 'Active',
      summary: 'Non-destructive testing (UT, MPI, Dye-Penetrant), safety valve test bench certification, precision lathe machining, and fabrication services.',
      tags: ['NDT Testing', 'Valve Certification', 'Precision Machining', 'Weld QA/QC'],
      initiatives: [
        { name: 'In-House Safety Valve Test Rig Calibration & Certification', owner: 'Workshop Specialists', target: 'Q2 2026', status: 'Completed', progress: 100 },
        { name: 'Ultrasonic Phased Array Testing on High-Pressure Boiler Welds', owner: 'NDT Team', target: 'Q3 2026', status: 'On Track', progress: 98 },
        { name: 'Precision CNC Turning Center Commissioning for Pump Impellers', owner: 'Machining Section', target: 'Q4 2026', status: 'On Track', progress: 90 }
      ],
      kpis: [
        { label: 'NDT Schedule Execution', val: '100%', status: 'Optimal' },
        { label: 'Valve Recertification', val: '100% Passed', status: 'Optimal' },
        { label: 'Rework Rate', val: '< 0.5%', status: 'Optimal' }
      ]
    },
    {
      id: 'ld',
      name: 'L&D',
      code: 'L&D',
      category: 'Corporate Services & People',
      icon: 'graduation-cap',
      theme: {
        bg: '#FAF5FF',
        border: '#DDD6FE',
        primary: '#7C3AED',
        secondary: '#A78BFA',
        text: '#4C1D95',
        gradient: 'from-purple-600 via-violet-600 to-indigo-700',
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-200'
      },
      subtitle: 'Learning, Competency & Cadre Qualification',
      lead: 'Lead Learning & Development Specialist',
      cadence: 'Continuous Monthly Cadence',
      progress: 99,
      status: 'Active',
      summary: 'Technical competency assurance, dynamic DCS power plant simulator modules, PSM validation training, and apprenticeship academies.',
      tags: ['DCS Simulator', 'PSM Validation', 'Competency Matrix', 'Cadre Certification'],
      initiatives: [
        { name: 'PSM Validation Protocol: 249 Personnel Qualification', owner: 'L&D & HSEQ', target: 'Q2 2026', status: 'Completed', progress: 100 },
        { name: 'Power Plant Dynamic DCS Full-Scope Simulator Modules', owner: 'Simulator Lead', target: 'Q3 2026', status: 'Completed', progress: 100 },
        { name: 'Junior Maintenance Cadre Skill Certification Program', owner: 'Technical Training', target: 'Q4 2026', status: 'On Track', progress: 95 }
      ],
      kpis: [
        { label: 'PSM Qualification', val: '100% Passed', status: 'Optimal' },
        { label: 'Tracked Personnel', val: '249 Personnel', status: 'Optimal' },
        { label: 'Training Score', val: '98.8%', status: 'Optimal' }
      ]
    },
    {
      id: 'machinery',
      name: 'Machinery',
      code: 'MACH',
      category: 'Operations & Engineering',
      icon: 'cog',
      theme: {
        bg: '#FFF7ED',
        border: '#FED7AA',
        primary: '#EA580C',
        secondary: '#FB923C',
        text: '#7C2D12',
        gradient: 'from-orange-600 via-amber-600 to-red-700',
        badgeBg: 'bg-orange-100 text-orange-800 border-orange-200'
      },
      subtitle: 'Turbines, Compressors & Rotating Equipment',
      lead: 'Lead Machinery Engineer',
      cadence: 'Daily Surveillance & Overhauls',
      progress: 95,
      status: 'Active',
      summary: 'Lifecycle performance of Steam Turbines (STG-1/2/3/4), Boiler Feed Pumps, draft fans, lube oil systems, and dynamic balancing.',
      tags: ['Steam Turbines', 'BFP Overhauls', 'Lube Oil Health', 'Dynamic Balancing'],
      initiatives: [
        { name: 'STG-4 HP/IP Turbine Blade Inspection & Clearance Survey', owner: 'Turbine Specialists', target: 'Q2 2026', status: 'Completed', progress: 100 },
        { name: 'Boiler Feed Pump (BFP-1A) Cartridge Overhaul & Seal Test', owner: 'Pump Section', target: 'Q3 2026', status: 'On Track', progress: 95 },
        { name: 'Electro-Hydraulic Governor (EHG) Actuator Diagnostic Overhaul', owner: 'Machinery Team', target: 'Q4 2026', status: 'In Progress', progress: 88 }
      ],
      kpis: [
        { label: 'Rotating Asset Uptime', val: '99.4%', status: 'Optimal' },
        { label: 'Turbine Vibration', val: '< 2.2 mm/s', status: 'Optimal' },
        { label: 'Trips Due to Lube Oil', val: '0 Events', status: 'Optimal' }
      ]
    },
    {
      id: 'mechanical',
      name: 'Mechanical',
      code: 'MECH',
      category: 'Operations & Engineering',
      icon: 'wrench',
      theme: {
        bg: '#FFF1F2',
        border: '#FECDD3',
        primary: '#E11D48',
        secondary: '#F43F5E',
        text: '#881337',
        gradient: 'from-rose-600 via-red-600 to-amber-700',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200'
      },
      subtitle: 'Boilers, Static Equipment & High-Pressure Piping',
      lead: 'Head of Mechanical Maintenance',
      cadence: 'Daily Rounds & Outages',
      progress: 93,
      status: 'Active',
      summary: 'CFB Boilers, superheater tubes, steam valves, condenser cooling loops, static pressure equipment, and heat exchangers.',
      tags: ['Boiler Tubes', 'Steam Valves', 'Condenser Health', 'Piping Stress'],
      initiatives: [
        { name: 'Boiler Superheater Tube Wall Thickness Mapping & Life Calc', owner: 'Boiler Team', target: 'Q2 2026', status: 'Completed', progress: 100 },
        { name: 'Main Steam Stop Valve Bypass Overhaul & Seating Lapping', owner: 'Valve Section', target: 'Q3 2026', status: 'On Track', progress: 92 },
        { name: 'Condenser Titanium Tube Bundle Hydro-Jetting & Vacuum Check', owner: 'Heat Exchanger Team', target: 'Q4 2026', status: 'In Progress', progress: 85 }
      ],
      kpis: [
        { label: 'Boiler Tube Leaks', val: '0 Leaks', status: 'Optimal' },
        { label: 'Static Equipment Health', val: '98.6%', status: 'Optimal' },
        { label: 'Preventive Closeout', val: '95.2%', status: 'Optimal' }
      ]
    },
    {
      id: 'operations',
      name: 'Operations',
      code: 'OPS',
      category: 'Operations & Engineering',
      icon: 'gauge',
      theme: {
        bg: '#EFF6FF',
        border: '#BFDBFE',
        primary: '#2563EB',
        secondary: '#60A5FA',
        text: '#1E3A8A',
        gradient: 'from-blue-600 via-indigo-600 to-cyan-600',
        badgeBg: 'bg-blue-100 text-blue-800 border-blue-200'
      },
      subtitle: 'Plant Generation, Dispatch & Shift Control',
      lead: 'Head of Plant Operations',
      cadence: '24/7 Continuous Shift Handover',
      progress: 97,
      status: 'Active',
      summary: 'Grid dispatch synchronization, Heat Rate optimization, steam cycle efficiency, water chemistry surveillance, and shift handover compliance.',
      tags: ['Grid Dispatch', 'Heat Rate', 'Cycle Efficiency', 'Shift Handover'],
      initiatives: [
        { name: 'Heat Rate Optimization via Optimal Excess Air Tuning', owner: 'Operations Shift Lead', target: 'Q2 2026', status: 'Completed', progress: 100 },
        { name: 'Automated Digital Shift Log & Handover Operator Mobility', owner: 'Ops Engineering', target: 'Q3 2026', status: 'On Track', progress: 95 },
        { name: 'Cold/Warm Startup Time Reduction Protocol Standardization', owner: 'Operations Team', target: 'Q4 2026', status: 'On Track', progress: 90 }
      ],
      kpis: [
        { label: 'Plant Availability', val: '98.7%', status: 'Optimal' },
        { label: 'Aux Power Consumption', val: '7.85%', status: 'Optimal' },
        { label: 'Trips on Handover', val: '0 Events', status: 'Optimal' }
      ]
    },
    {
      id: 'reliability',
      name: 'Reliability',
      code: 'REL',
      category: 'Operations & Engineering',
      icon: 'git-pull-request',
      theme: {
        bg: '#FFFBEB',
        border: '#FDE68A',
        primary: '#D97706',
        secondary: '#F59E0B',
        text: '#78350F',
        gradient: 'from-amber-600 via-orange-600 to-yellow-600',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200'
      },
      subtitle: 'Asset Reliability, Predictive RCM & Bad-Actor Eradication',
      lead: 'Lead Reliability & RCA Specialist',
      cadence: 'Monthly RCA & Reliability Forum',
      progress: 94,
      status: 'Active',
      summary: 'Reliability-Centered Maintenance (RCM), vibration telemetry analytics, oil ferrography, thermography, and PLR recommendation closeouts.',
      tags: ['RCM Analysis', 'Vibration Telemetry', 'PLR Actions', 'Bad-Actor Eradication'],
      initiatives: [
        { name: 'PLR 534 Engineering Action Items Systematic Closeout (91.8%)', owner: 'Reliability Taskforce', target: 'Q3 2026', status: 'On Track', progress: 92 },
        { name: 'Wireless IoT Vibration Monitoring Sensor Network Deployment', owner: 'Predictive Maintenance', target: 'Q3 2026', status: 'On Track', progress: 94 },
        { name: 'Top 5 Repetitive Trip Bad-Actor Engineering Elimination', owner: 'RCA Unit', target: 'Q4 2026', status: 'In Progress', progress: 88 }
      ],
      kpis: [
        { label: 'PLR Closure Velocity', val: '91.8%', status: 'Optimal' },
        { label: 'Unplanned Trips', val: '< 0.08 / GW', status: 'Optimal' },
        { label: 'Telemetry Coverage', val: '99.8%', status: 'Optimal' }
      ]
    },
    {
      id: 'scm',
      name: 'SCM',
      code: 'SCM',
      category: 'Corporate Services & People',
      icon: 'truck',
      theme: {
        bg: '#F0FDFA',
        border: '#99F6E4',
        primary: '#0D9488',
        secondary: '#14B8A6',
        text: '#134E4A',
        gradient: 'from-teal-600 via-emerald-600 to-cyan-700',
        badgeBg: 'bg-teal-100 text-teal-800 border-teal-200'
      },
      subtitle: 'Supply Chain, Procurement & Fuel Logistics',
      lead: 'Head of Supply Chain Management',
      cadence: 'Weekly Inventory Audits',
      progress: 96,
      status: 'Active',
      summary: 'Strategic spare parts availability, coal logistics and fuel stock security, supplier lifecycle evaluation, and warehouse modernization.',
      tags: ['Coal Logistics', 'Critical Spares', 'PR-to-PO Velocity', 'Vendor Audits'],
      initiatives: [
        { name: 'Turbine & Boiler Critical Spares Strategic Stock Security', owner: 'Procurement Team', target: 'Q2 2026', status: 'Completed', progress: 100 },
        { name: 'Coal Supply Logistics Buffer: Minimum 45-Day Plant Stock', owner: 'Fuel Logistics', target: 'Q3 2026', status: 'On Track', progress: 95 },
        { name: 'Vendor Scorecard & PR-to-PO Turnaround Compression (<18 Days)', owner: 'Contracts & SCM', target: 'Q4 2026', status: 'In Progress', progress: 90 }
      ],
      kpis: [
        { label: 'Critical Spare Availability', val: '99.6%', status: 'Optimal' },
        { label: 'Coal Stock Days', val: '48 Days', status: 'Optimal' },
        { label: 'PR-to-PO Velocity', val: '16.4 Days', status: 'Optimal' }
      ]
    },
    {
      id: 'technical',
      name: 'Technical',
      code: 'TECH',
      category: 'Operations & Engineering',
      icon: 'sliders',
      theme: {
        bg: '#EEF2FF',
        border: '#C7D2FE',
        primary: '#6366F1',
        secondary: '#818CF8',
        text: '#312E81',
        gradient: 'from-indigo-600 via-blue-600 to-violet-700',
        badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200'
      },
      subtitle: 'Process Engineering, Optimization & Studies',
      lead: 'Lead Technical Services Engineer',
      cadence: 'Bi-Monthly Performance Reviews',
      progress: 94,
      status: 'Active',
      summary: 'Thermodynamic plant cycle modeling, process simulation, design modifications, performance guarantee tests, and Management of Change (MOC).',
      tags: ['Thermodynamic Model', 'Cycle Efficiency', 'MOC Reviews', 'Process Studies'],
      initiatives: [
        { name: 'Thermodynamic Cycle Simulation Digital Twin Integration', owner: 'Process Engineering', target: 'Q2 2026', status: 'Completed', progress: 100 },
        { name: 'Cooling Water Syphon Energy Recovery & Vacuum Gain Study', owner: 'Technical Studies', target: 'Q3 2026', status: 'On Track', progress: 92 },
        { name: 'Technical Management of Change (MOC) Engineering Review Velocity', owner: 'Technical Team', target: 'Q4 2026', status: 'On Track', progress: 90 }
      ],
      kpis: [
        { label: 'MOC Reviews Executed', val: '100% On-Time', status: 'Optimal' },
        { label: 'Net Efficiency Gain', val: '+1.8 MW', status: 'Optimal' },
        { label: 'Engineering Studies', val: '8 Completed', status: 'Optimal' }
      ]
    },
    {
      id: 'technical-hse',
      name: 'Technical & HSE',
      code: 'T-HSE',
      category: 'Safety, Quality & Integrity',
      icon: 'shield',
      theme: {
        bg: '#ECFDF5',
        border: '#6EE7B7',
        primary: '#059669',
        secondary: '#10B981',
        text: '#064E3B',
        gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200'
      },
      subtitle: 'Process Safety Engineering & Critical Barriers',
      lead: 'Manager Technical & Process Safety',
      cadence: 'Monthly Process Safety Committee',
      progress: 97,
      status: 'Active',
      summary: 'PHA/HAZOP study execution, Safety Critical Equipment (SCE) barrier integrity, Bowtie barrier audits, and emergency containment systems.',
      tags: ['PHA / HAZOP', 'Barrier Integrity', 'SCE Audits', 'Process Safety'],
      initiatives: [
        { name: 'Process Hazard Analysis (PHA/HAZOP) Revalidation Cycle', owner: 'Process Safety Lead', target: 'Q2 2026', status: 'Completed', progress: 100 },
        { name: 'Safety Critical Equipment (SCE) Barrier Health Verification', owner: 'Technical Safety Unit', target: 'Q3 2026', status: 'On Track', progress: 96 },
        { name: 'Plant Emergency Isolation Valve (ESD) Fast-Trip Stroke Audits', owner: 'Cross-functional Team', target: 'Q4 2026', status: 'On Track', progress: 92 }
      ],
      kpis: [
        { label: 'SCE Barrier Health', val: '100%', status: 'Optimal' },
        { label: 'PHA Findings Closed', val: '98.2%', status: 'Optimal' },
        { label: 'ESD Trip Reliability', val: '100%', status: 'Optimal' }
      ]
    }
  ];

  const strategicSuite = {
    data: STRATEGIC_TILES_DATA,
    DEFAULT_INITIAL_PASSWORD: 'Abcd@1234',
    MASTER_PASSWORD: 'abcd@Psuser12345',
    STORAGE_KEY: 'fpcl_strategic_passwords',

    state: {
      searchQuery: '',
      categoryFilter: 'all',
      selectedTileId: null,
      activeAuthTileId: null,
      authView: 'unlock', // 'unlock' | 'change'
      unlockedTiles: new Set(),
      isMasterActive: false,
      lastMasterUsed: false,
      visibility: {
        auth: false,
        old: false,
        new: false,
        confirm: false,
        masterInput: false
      }
    },

    init() {
      // Export to window
      window.FPCL_STRATEGIC_SUITE = this;
    },

    // Persistent storage helpers for passwords
    getStoredPasswords() {
      try {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
      } catch (e) {
        return {};
      }
    },

    getTilePassword(tileId) {
      const stored = this.getStoredPasswords();
      return stored[tileId] || this.DEFAULT_INITIAL_PASSWORD;
    },

    setTilePassword(tileId, newPassword) {
      const stored = this.getStoredPasswords();
      stored[tileId] = newPassword;
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));
      } catch (e) {
        console.error('Failed to save strategic password:', e);
      }
    },

    resetTilePassword(tileId) {
      const stored = this.getStoredPasswords();
      delete stored[tileId];
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));
      } catch (e) {
        console.error('Failed to reset strategic password:', e);
      }
    },

    resetAllPasswords() {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch (e) {
        console.error('Failed to reset all passwords:', e);
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
        masterInput: 'strategic-master-modal-pwd'
      };
      const iconMap = {
        auth: 'strategic-auth-eye-icon',
        old: 'strategic-change-old-eye',
        new: 'strategic-change-new-eye',
        confirm: 'strategic-change-confirm-eye',
        masterInput: 'strategic-master-eye'
      };
      const inputEl = document.getElementById(inputMap[fieldKey]);
      const iconEl = document.getElementById(iconMap[fieldKey]);
      if (inputEl) {
        inputEl.type = isVisible ? 'text' : 'password';
      }
      if (iconEl && window.lucide) {
        iconEl.setAttribute('data-lucide', isVisible ? 'eye-off' : 'eye');
        window.lucide.createIcons();
      }
    },

    // Flow when clicking any tile in Strategic Dashboard
    handleTileClick(tileId) {
      const tile = this.data.find(t => t.id === tileId);
      if (!tile) return;

      // If unlocked in this session or master mode is active, open directly!
      if (this.state.isMasterActive || this.state.unlockedTiles.has(tileId)) {
        this.openDetailModal(tileId);
        return;
      }

      // Prompt for password
      this.openAuthModal(tileId, 'unlock');
    },

    openAuthModal(tileId, view = 'unlock') {
      const tile = this.data.find(t => t.id === tileId);
      if (!tile) return;
      this.state.activeAuthTileId = tileId;
      this.state.authView = view;
      this.renderAuthModal();

      const modal = document.getElementById('strategic-auth-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }

      setTimeout(() => {
        if (view === 'unlock') {
          const input = document.getElementById('strategic-auth-pwd-input');
          if (input) {
            input.value = '';
            input.focus();
          }
        } else {
          const oldInput = document.getElementById('strategic-change-old-pwd');
          if (oldInput) {
            oldInput.value = '';
            oldInput.focus();
          }
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

    switchAuthView(view) {
      this.state.authView = view;
      this.renderAuthModal();
      setTimeout(() => {
        if (view === 'change') {
          const oldInput = document.getElementById('strategic-change-old-pwd');
          if (oldInput) oldInput.focus();
        } else {
          const authInput = document.getElementById('strategic-auth-pwd-input');
          if (authInput) authInput.focus();
        }
      }, 50);
      if (window.lucide) window.lucide.createIcons();
    },

    onAuthPasswordInput(val) {
      const trimmed = (val || '').trim();
      const masterBanner = document.getElementById('strategic-master-detected-banner');
      const errorBox = document.getElementById('strategic-auth-error-msg');
      if (errorBox) errorBox.classList.add('hidden');

      if (trimmed === this.MASTER_PASSWORD) {
        if (masterBanner) masterBanner.classList.remove('hidden');
      } else {
        if (masterBanner) masterBanner.classList.add('hidden');
      }
    },

    submitUnlock() {
      const tileId = this.state.activeAuthTileId;
      const tile = this.data.find(t => t.id === tileId);
      if (!tile) return;

      const input = document.getElementById('strategic-auth-pwd-input');
      const errorBox = document.getElementById('strategic-auth-error-msg');
      const val = input ? input.value.trim() : '';
      const currentPwd = this.getTilePassword(tileId);

      if (val === this.MASTER_PASSWORD) {
        // Master password opens all dashboards!
        this.state.lastMasterUsed = true;
        this.state.unlockedTiles.add(tileId);
        this.closeAuthModal();
        this.openDetailModal(tileId);
        this.showToast('Master Access Verified', `Opened ${tile.name} with Master credentials.`, 'success');
        this.render();
      } else if (val === currentPwd) {
        this.state.lastMasterUsed = false;
        this.state.unlockedTiles.add(tileId);
        this.closeAuthModal();
        this.openDetailModal(tileId);
        this.showToast('Access Granted', `${tile.name} strategic dossier unlocked.`, 'success');
        this.render();
      } else {
        if (errorBox) {
          errorBox.innerHTML = `
            <i data-lucide="alert-circle" class="w-4 h-4 shrink-0 text-rose-600"></i>
            <span>Incorrect password. Default initial password is <strong>Abcd@1234</strong> or use Master Password <strong>abcd@Psuser12345</strong>.</span>
          `;
          errorBox.classList.remove('hidden');
          if (window.lucide) window.lucide.createIcons();
        }
        if (input) {
          input.classList.add('border-rose-500', 'bg-rose-50/50');
          setTimeout(() => {
            input.classList.remove('border-rose-500', 'bg-rose-50/50');
          }, 1500);
          input.focus();
        }
      }
    },

    submitChangePassword() {
      const tileId = this.state.activeAuthTileId;
      const tile = this.data.find(t => t.id === tileId);
      if (!tile) return;

      const oldInput = document.getElementById('strategic-change-old-pwd');
      const newInput = document.getElementById('strategic-change-new-pwd');
      const confirmInput = document.getElementById('strategic-change-confirm-pwd');
      const errorBox = document.getElementById('strategic-change-error');

      const oldVal = oldInput ? oldInput.value.trim() : '';
      const newVal = newInput ? newInput.value.trim() : '';
      const confirmVal = confirmInput ? confirmInput.value.trim() : '';
      const currentPwd = this.getTilePassword(tileId);

      const showError = (msg) => {
        if (errorBox) {
          errorBox.innerHTML = `
            <i data-lucide="alert-circle" class="w-4 h-4 shrink-0 text-rose-600"></i>
            <span>${msg}</span>
          `;
          errorBox.classList.remove('hidden');
          if (window.lucide) window.lucide.createIcons();
        }
      };

      // Requirement: "Passward will be chnagabale only when old correct passward will be given."
      if (oldVal !== currentPwd && oldVal !== this.MASTER_PASSWORD) {
        showError('Old password is incorrect! Password can only be changed when the old correct password is provided.');
        if (oldInput) {
          oldInput.classList.add('border-rose-500', 'bg-rose-50');
          oldInput.focus();
        }
        return;
      }

      if (!newVal || newVal.length < 3) {
        showError('New password must be at least 3 characters long.');
        if (newInput) newInput.focus();
        return;
      }

      if (newVal !== confirmVal) {
        showError('New password and confirm password do not match.');
        if (confirmInput) confirmInput.focus();
        return;
      }

      // Save new password
      this.setTilePassword(tileId, newVal);
      this.state.unlockedTiles.add(tileId);
      this.state.lastMasterUsed = false;

      this.showToast('Password Updated', `Password successfully changed for ${tile.name}. Opening dashboard...`, 'success');

      // Requirement: "After changing passward that passward entry should open."
      this.closeAuthModal();
      this.openDetailModal(tileId);
      this.render();
    },

    // Requirement: "when master passward is added there should be one button that will reset the passward to initial passward of Abcd@1234"
    resetActiveTileToDefault(tileIdParam) {
      const tileId = tileIdParam || this.state.activeAuthTileId || this.state.selectedTileId;
      if (!tileId) return;
      const tile = this.data.find(t => t.id === tileId);

      this.resetTilePassword(tileId);

      const successBanner = document.getElementById('strategic-reset-success-banner');
      if (successBanner) {
        successBanner.innerHTML = `
          <i data-lucide="check-circle" class="w-4 h-4 shrink-0 text-emerald-600"></i>
          <span>Password for <strong>${tile ? tile.name : 'this tile'}</strong> has been reset to initial password: <strong>Abcd@1234</strong></span>
        `;
        successBanner.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
      }

      const input = document.getElementById('strategic-auth-pwd-input');
      if (input) {
        input.value = this.DEFAULT_INITIAL_PASSWORD;
      }

      this.showToast('Password Reset', `Password reset to initial Abcd@1234 for ${tile ? tile.name : 'tile'}.`, 'success');
      this.render();
    },

    unlockAllDashboards() {
      this.data.forEach(t => this.state.unlockedTiles.add(t.id));
      this.state.isMasterActive = true;
      this.closeAuthModal();
      this.closeMasterModal();
      this.showToast('Master Access Granted', 'All 20 Department Dashboards are now unlocked.', 'success');
      this.render();

      if (this.state.selectedTileId) {
        this.openDetailModal(this.state.selectedTileId);
      }
    },

    lockTile(tileId) {
      this.state.unlockedTiles.delete(tileId);
      this.closeDetailModal();
      this.showToast('Tile Locked', 'Dashboard locked. Password required to access.', 'info');
      this.render();
    },

    lockAllTiles() {
      this.state.unlockedTiles.clear();
      this.state.isMasterActive = false;
      this.closeDetailModal();
      this.showToast('All Dashboards Locked', 'Initial password Abcd@1234 required to access each tile.', 'info');
      this.render();
    },

    openMasterModal() {
      const modal = document.getElementById('strategic-master-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        const input = document.getElementById('strategic-master-modal-pwd');
        if (input) {
          input.value = '';
          input.focus();
        }
        const masterActions = document.getElementById('strategic-master-actions-panel');
        if (masterActions) masterActions.classList.add('hidden');
        const errBox = document.getElementById('strategic-master-error');
        if (errBox) errBox.classList.add('hidden');
      }
      if (window.lucide) window.lucide.createIcons();
    },

    closeMasterModal() {
      const modal = document.getElementById('strategic-master-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    },

    onMasterModalInput(val) {
      const trimmed = (val || '').trim();
      const actionsPanel = document.getElementById('strategic-master-actions-panel');
      const errBox = document.getElementById('strategic-master-error');
      if (errBox) errBox.classList.add('hidden');

      if (trimmed === this.MASTER_PASSWORD) {
        if (actionsPanel) actionsPanel.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
      } else {
        if (actionsPanel) actionsPanel.classList.add('hidden');
      }
    },

    submitMasterModalUnlockAll() {
      const input = document.getElementById('strategic-master-modal-pwd');
      const val = input ? input.value.trim() : '';
      if (val === this.MASTER_PASSWORD || this.state.isMasterActive) {
        this.unlockAllDashboards();
      } else {
        const errBox = document.getElementById('strategic-master-error');
        if (errBox) {
          errBox.textContent = 'Invalid Master Password. Enter abcd@Psuser12345';
          errBox.classList.remove('hidden');
        }
      }
    },

    submitMasterModalResetAll() {
      const input = document.getElementById('strategic-master-modal-pwd');
      const val = input ? input.value.trim() : '';
      if (val === this.MASTER_PASSWORD || this.state.isMasterActive) {
        this.resetAllPasswords();
        this.closeMasterModal();
        this.showToast('Global Reset Complete', 'All 20 strategic dashboards reset to initial password Abcd@1234.', 'success');
        this.render();
      } else {
        const errBox = document.getElementById('strategic-master-error');
        if (errBox) {
          errBox.textContent = 'Invalid Master Password. Enter abcd@Psuser12345';
          errBox.classList.remove('hidden');
        }
      }
    },

    renderAuthModal() {
      const container = document.getElementById('strategic-auth-modal-body');
      if (!container) return;

      const tileId = this.state.activeAuthTileId;
      const tile = this.data.find(t => t.id === tileId);
      if (!tile) return;

      const isCustom = this.isTileCustomized(tileId);

      if (this.state.authView === 'unlock') {
        container.innerHTML = `
          <div class="space-y-4">
            <!-- Header Identity -->
            <div class="p-4 rounded-2xl bg-gradient-to-r ${tile.theme.gradient} text-white relative overflow-hidden shadow-xs">
              <div class="flex items-center gap-3 relative z-10">
                <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
                  <i data-lucide="${tile.icon}" class="w-5 h-5"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/20 text-white border border-white/30 uppercase">
                      ${tile.code}
                    </span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-amber-950 flex items-center gap-1">
                      <i data-lucide="lock" class="w-2.5 h-2.5"></i>
                      <span>Password Required</span>
                    </span>
                  </div>
                  <h4 class="text-base font-black text-white mt-1">${tile.name}</h4>
                  <p class="text-xs text-white/80">${tile.subtitle}</p>
                </div>
              </div>
            </div>

            <!-- Instructions Notice -->
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
              <i data-lucide="shield-check" class="w-4 h-4 text-purple-600 shrink-0 mt-0.5"></i>
              <div class="leading-relaxed">
                Enter password to open <strong>${tile.name}</strong>.
                <div class="mt-1 text-[11px] text-slate-500">
                  • Initial default password: <code class="px-1.5 py-0.5 rounded bg-slate-200/70 font-mono text-slate-800 font-bold">Abcd@1234</code><br/>
                  • Master password: <code class="px-1.5 py-0.5 rounded bg-slate-200/70 font-mono text-slate-800 font-bold">abcd@Psuser12345</code> (opens all dashboards)
                </div>
              </div>
            </div>

            <!-- Reset Success Banner -->
            <div id="strategic-reset-success-banner" class="hidden p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in"></div>

            <!-- Error Banner -->
            <div id="strategic-auth-error-msg" class="hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in"></div>

            <!-- Password Input -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-700">Enter Password</label>
              <div class="relative">
                <input
                  id="strategic-auth-pwd-input"
                  type="${this.state.visibility.auth ? 'text' : 'password'}"
                  placeholder="Enter tile password or Master password..."
                  class="w-full px-3.5 py-2.5 pr-10 text-xs font-mono font-medium rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white text-slate-900 transition-all outline-none"
                  oninput="window.FPCL_STRATEGIC_SUITE.onAuthPasswordInput(this.value)"
                  onkeydown="if(event.key==='Enter') window.FPCL_STRATEGIC_SUITE.submitUnlock()"
                />
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.toggleVisibility('auth')"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Toggle password visibility"
                >
                  <i id="strategic-auth-eye-icon" data-lucide="${this.state.visibility.auth ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <!-- MASTER PASSWORD DETECTED SPECIAL ACTION PANEL (Requirement: one button that will reset the passward to initial passward of Abcd@1234) -->
            <div id="strategic-master-detected-banner" class="hidden p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 space-y-2.5 animate-in fade-in">
              <div class="flex items-center gap-2 text-xs font-bold text-purple-800">
                <i data-lucide="shield-alert" class="w-4 h-4 text-purple-600"></i>
                <span>Master Administrator Credentials Verified!</span>
              </div>
              <p class="text-[11px] text-purple-700 leading-normal">
                Master password <code>abcd@Psuser12345</code> detected. You can unlock this tile, unlock all dashboards, or reset this tile's custom password back to initial defaults.
              </p>
              <div class="flex items-center gap-2 pt-1 flex-wrap">
                <!-- THE REQUIRED RESET BUTTON -->
                <button
                  type="button"
                  id="btn-master-reset-initial"
                  onclick="window.FPCL_STRATEGIC_SUITE.resetActiveTileToDefault()"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-amber-950 border border-amber-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  title="Click to reset password of this tile to Abcd@1234"
                >
                  <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                  <span>Reset Password to Initial (Abcd@1234)</span>
                </button>
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.unlockAllDashboards()"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <i data-lucide="unlock" class="w-3.5 h-3.5"></i>
                  <span>Unlock All 20 Dashboards</span>
                </button>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="pt-2 flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.switchAuthView('change')"
                class="px-3.5 py-2 rounded-xl text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <i data-lucide="key-round" class="w-3.5 h-3.5"></i>
                <span>Option of Changing Password</span>
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
        // Change Password Form
        container.innerHTML = `
          <div class="space-y-4">
            <!-- Header Identity -->
            <div class="p-3.5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 text-white flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                  <i data-lucide="key-round" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-white">Change Password: ${tile.name}</h4>
                  <p class="text-[11px] text-slate-300">Set a custom password for this strategic dashboard.</p>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-white border border-white/20">
                ${tile.code}
              </span>
            </div>

            <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <i data-lucide="info" class="w-4 h-4 text-amber-700 shrink-0 mt-0.5"></i>
              <span class="leading-relaxed">
                Password is <strong>changeable only when old correct password is given</strong>. After changing, this strategic dashboard will open immediately.
              </span>
            </div>

            <!-- Error Banner -->
            <div id="strategic-change-error" class="hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in"></div>

            <!-- Form Fields -->
            <div class="space-y-3">
              <!-- Old Password -->
              <div class="space-y-1">
                <label class="block text-xs font-bold text-slate-700">
                  Old Correct Password <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <input
                    id="strategic-change-old-pwd"
                    type="${this.state.visibility.old ? 'text' : 'password'}"
                    placeholder="Enter old correct password (or Master Password)..."
                    class="w-full px-3.5 py-2 pr-10 text-xs font-mono rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onclick="window.FPCL_STRATEGIC_SUITE.toggleVisibility('old')"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <i id="strategic-change-old-eye" data-lucide="${this.state.visibility.old ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>
                  </button>
                </div>
                <p class="text-[10px] text-slate-400 font-mono">Initial default was Abcd@1234</p>
              </div>

              <!-- New Password -->
              <div class="space-y-1">
                <label class="block text-xs font-bold text-slate-700">
                  New Password <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <input
                    id="strategic-change-new-pwd"
                    type="${this.state.visibility.new ? 'text' : 'password'}"
                    placeholder="Enter new password (min 3 characters)..."
                    class="w-full px-3.5 py-2 pr-10 text-xs font-mono rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onclick="window.FPCL_STRATEGIC_SUITE.toggleVisibility('new')"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <i id="strategic-change-new-eye" data-lucide="${this.state.visibility.new ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>

              <!-- Confirm New Password -->
              <div class="space-y-1">
                <label class="block text-xs font-bold text-slate-700">
                  Confirm New Password <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <input
                    id="strategic-change-confirm-pwd"
                    type="${this.state.visibility.confirm ? 'text' : 'password'}"
                    placeholder="Confirm new password..."
                    class="w-full px-3.5 py-2 pr-10 text-xs font-mono rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white text-slate-900 outline-none"
                    onkeydown="if(event.key==='Enter') window.FPCL_STRATEGIC_SUITE.submitChangePassword()"
                  />
                  <button
                    type="button"
                    onclick="window.FPCL_STRATEGIC_SUITE.toggleVisibility('confirm')"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <i id="strategic-change-confirm-eye" data-lucide="${this.state.visibility.confirm ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="pt-2 flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.switchAuthView('unlock')"
                class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
                <span>Back to Unlock</span>
              </button>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.closeAuthModal()"
                  class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.submitChangePassword()"
                  class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <i data-lucide="check" class="w-3.5 h-3.5"></i>
                  <span>Save Password & Open Tile</span>
                </button>
              </div>
            </div>
          </div>
        `;
      }
    },

    setSearchQuery(query) {
      this.state.searchQuery = query || '';
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

    setCategoryFilter(cat) {
      this.state.categoryFilter = cat;
      this.render();
    },

    resetFilters() {
      this.state.searchQuery = '';
      this.state.categoryFilter = 'all';
      const input = document.getElementById('strategic-search-input');
      if (input) input.value = '';
      this.render();
    },

    openDetailModal(tileId) {
      const tile = this.data.find(t => t.id === tileId);
      if (!tile) return;
      this.state.selectedTileId = tileId;

      const modal = document.getElementById('strategic-detail-modal');
      const content = document.getElementById('strategic-modal-body');
      if (!modal || !content) return;

      const isCustom = this.isTileCustomized(tileId);
      const isMaster = this.state.lastMasterUsed || this.state.isMasterActive;

      content.innerHTML = `
        <div class="space-y-6">
          <!-- Modal Header Banner -->
          <div class="p-5 rounded-2xl border relative overflow-hidden bg-gradient-to-r ${tile.theme.gradient} text-white shadow-md">
            <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-start gap-3.5">
                <div class="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                  <i data-lucide="${tile.icon}" class="w-6 h-6"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30">
                      ${tile.code}
                    </span>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/25 text-emerald-100 border border-emerald-300/40">
                      ${tile.status}
                    </span>
                    ${tile.isFeatured ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950 font-mono uppercase">Featured Tile</span>' : ''}
                    ${isMaster ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-400 text-purple-950 font-mono uppercase">Master Access</span>' : ''}
                  </div>
                  <h3 class="text-xl sm:text-2xl font-black tracking-tight mt-1 text-white">${tile.name}</h3>
                  <p class="text-xs sm:text-sm text-white/80 font-medium">${tile.subtitle}</p>
                </div>
              </div>
              <div class="sm:text-right bg-black/20 p-3 rounded-xl backdrop-blur-sm border border-white/10 shrink-0">
                <div class="text-[10px] uppercase font-bold tracking-wider text-white/70">Strategic Progress</div>
                <div class="text-2xl font-black font-mono text-white">${tile.progress}%</div>
                <div class="text-[10px] text-white/70">${tile.cadence}</div>
              </div>
            </div>

            <!-- Security Quick Action Toolbar inside Header -->
            <div class="relative z-10 mt-4 pt-3 border-t border-white/20 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-white/90">
                  <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-300"></i>
                  <span>Security: ${isCustom ? 'Custom Password Set' : 'Initial Password (Abcd@1234)'}</span>
                </span>
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.openAuthModal('${tile.id}', 'change')"
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/25 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Change this tile password"
                >
                  <i data-lucide="key-round" class="w-3.5 h-3.5"></i>
                  <span>Change Password</span>
                </button>
                ${(isMaster || isCustom) ? `
                  <button
                    type="button"
                    onclick="window.FPCL_STRATEGIC_SUITE.resetActiveTileToDefault('${tile.id}')"
                    class="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-amber-950 border border-amber-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Reset to default initial password Abcd@1234"
                  >
                    <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                    <span>Reset Password to Initial (Abcd@1234)</span>
                  </button>
                ` : ''}
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.lockTile('${tile.id}')"
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-black/25 hover:bg-black/35 text-white/90 border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Lock tile and close"
                >
                  <i data-lucide="lock" class="w-3.5 h-3.5"></i>
                  <span>Lock Tile</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Description & Lead -->
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span class="font-bold text-slate-700">Strategic Mandate:</span>
              <p class="text-slate-600 mt-0.5">${tile.summary}</p>
            </div>
            <div class="shrink-0 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Responsible Lead</span>
              <strong class="text-slate-800 text-xs">${tile.lead}</strong>
            </div>
          </div>

          <!-- Department KPIs -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <i data-lucide="bar-chart-3" class="w-3.5 h-3.5 text-blue-600"></i>
              <span>Key Performance Indicators</span>
            </h4>
            <div class="grid grid-cols-3 gap-3">
              ${tile.kpis.map(k => `
                <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs text-center">
                  <div class="text-[11px] font-medium text-slate-500 truncate">${k.label}</div>
                  <div class="text-lg font-black font-mono text-slate-800 mt-1">${k.val}</div>
                  <span class="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">${k.status}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Strategic Initiatives & 2026 Deliverables -->
          <div>
            <div class="flex items-center justify-between mb-2.5">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <i data-lucide="list-checks" class="w-3.5 h-3.5 text-purple-600"></i>
                <span>2026 Strategic Initiatives & Roadmaps</span>
              </h4>
              <span class="text-[11px] font-mono font-semibold text-slate-400">${tile.initiatives.length} Active Programs</span>
            </div>
            <div class="space-y-2.5">
              ${tile.initiatives.map((init, idx) => `
                <div class="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3.5 transition-all shadow-2xs">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-start gap-2.5">
                      <span class="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">${idx + 1}</span>
                      <div>
                        <h5 class="text-xs font-bold text-slate-800">${init.name}</h5>
                        <div class="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span>Owner: <strong class="text-slate-700 font-semibold">${init.owner}</strong></span>
                          <span>Target: <strong class="text-slate-700 font-semibold">${init.target}</strong></span>
                        </div>
                      </div>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                      init.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      init.status === 'On Track' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }">
                      ${init.status}
                    </span>
                  </div>
                  <!-- Progress bar -->
                  <div class="mt-2.5 flex items-center gap-2">
                    <div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full rounded-full ${
                        init.progress === 100 ? 'bg-emerald-500' :
                        init.progress >= 90 ? 'bg-blue-600' : 'bg-amber-500'
                      }" style="width: ${init.progress}%"></div>
                    </div>
                    <span class="text-[10px] font-mono font-bold text-slate-500">${init.progress}%</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Tags -->
          <div class="pt-2 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-1.5 flex-wrap">
              ${tile.tags.map(tag => `
                <span class="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">#${tag}</span>
              `).join('')}
            </div>
            <button
              onclick="window.FPCL_STRATEGIC_SUITE.copyTileSummary('${tile.id}')"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
              <span>Copy Brief</span>
            </button>
          </div>
        </div>
      `;

      modal.classList.remove('hidden');
      modal.classList.add('flex');
      if (window.lucide) window.lucide.createIcons();
    },

    closeDetailModal() {
      const modal = document.getElementById('strategic-detail-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      this.state.selectedTileId = null;
    },

    copyTileSummary(tileId) {
      const tile = this.data.find(t => t.id === tileId);
      if (!tile) return;
      const text = `FPCL Strategic Brief: ${tile.name} (${tile.code})\n` +
                   `Category: ${tile.category}\n` +
                   `Progress: ${tile.progress}% | Status: ${tile.status}\n` +
                   `Responsible Lead: ${tile.lead}\n` +
                   `Mandate: ${tile.summary}\n` +
                   `Active Initiatives: ${tile.initiatives.map(i => `\n- ${i.name} [${i.status} - ${i.progress}%]`).join('')}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          if (window.portalApp && typeof window.portalApp.showToast === 'function') {
            window.portalApp.showToast('Copied to Clipboard', `Strategic brief for ${tile.name} copied.`, 'success');
          }
        });
      }
    },

    render() {
      const container = document.getElementById('strategic-specialized-container');
      if (!container) return;

      const q = this.state.searchQuery.toLowerCase().trim();
      const filtered = this.data.filter(t => {
        const matchQuery = !q ||
          t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          t.subtitle.toLowerCase().includes(q) ||
          t.summary.toLowerCase().includes(q) ||
          t.lead.toLowerCase().includes(q) ||
          t.tags.some(tag => tag.toLowerCase().includes(q));

        const matchCategory = this.state.categoryFilter === 'all' || t.category === this.state.categoryFilter;
        return matchQuery && matchCategory;
      });

      // Aggregate statistics across tiles
      const totalTiles = this.data.length; // 20
      const totalInitiatives = this.data.reduce((acc, t) => acc + (t.initiatives ? t.initiatives.length : 0), 0);
      const avgProgress = Math.round(this.data.reduce((acc, t) => acc + t.progress, 0) / totalTiles);

      const html = `
        <!-- STRATEGIC DASHBOARD HEADER BANNER -->
        <div class="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E1B4B] rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden border border-slate-700/60">
          <div class="absolute -right-16 -top-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div class="space-y-2 max-w-3xl">
              <div class="flex items-center gap-2.5 flex-wrap">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30 shadow-2xs">
                  <i data-lucide="target" class="w-3.5 h-3.5 text-purple-300"></i>
                  <span>FPCL STRATEGIC GOVERNANCE</span>
                </span>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>20 Departmental Tiles Active</span>
                </span>
                <span class="text-xs text-slate-400 font-mono">2026 Framework</span>
              </div>
              <h1 class="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                Strategic Dashboard
              </h1>
              <p class="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                Departmental performance frameworks, operational transformation roadmaps, and executive milestone governance across all 20 specialized units.
              </p>
            </div>

            <!-- Quick Metrics Header Cards -->
            <div class="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
              <div class="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 text-center min-w-[95px] sm:min-w-[110px]">
                <span class="text-[10px] uppercase font-bold tracking-wider text-slate-300 block">Total Tiles</span>
                <span class="text-xl sm:text-2xl font-black font-mono text-white mt-0.5 block">${totalTiles}</span>
                <span class="text-[9px] text-purple-200 font-medium">100% Configured</span>
              </div>
              <div class="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 text-center min-w-[95px] sm:min-w-[110px]">
                <span class="text-[10px] uppercase font-bold tracking-wider text-slate-300 block">Initiatives</span>
                <span class="text-xl sm:text-2xl font-black font-mono text-white mt-0.5 block">${totalInitiatives}</span>
                <span class="text-[9px] text-emerald-300 font-medium">Active Programs</span>
              </div>
              <div class="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 text-center min-w-[95px] sm:min-w-[110px]">
                <span class="text-[10px] uppercase font-bold tracking-wider text-slate-300 block">Avg Progress</span>
                <span class="text-xl sm:text-2xl font-black font-mono text-emerald-300 mt-0.5 block">${avgProgress}%</span>
                <span class="text-[9px] text-slate-300 font-medium">On Schedule</span>
              </div>
            </div>
          </div>
        </div>

        <!-- SEARCH & CATEGORY FILTER TOOLBAR -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <!-- Search Input -->
            <div class="relative flex-1 max-w-md">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <i data-lucide="search" class="w-4 h-4"></i>
              </div>
              <input
                id="strategic-search-input"
                type="text"
                value="${this.state.searchQuery}"
                placeholder="Search department, initiative, keyword..."
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

            <!-- Counter & Master Controls -->
            <div class="flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-500 flex-wrap">
              <span class="font-medium mr-1 hidden md:inline">
                Showing <strong class="text-slate-800 font-bold">${filtered.length}</strong> of ${totalTiles} Tiles
              </span>
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.openMasterModal()"
                class="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Master Administrator Portal & Reset Controls"
              >
                <i data-lucide="shield-check" class="w-3.5 h-3.5 text-purple-600"></i>
                <span>Master Security</span>
              </button>
              ${(this.state.unlockedTiles.size > 0 || this.state.isMasterActive) ? `
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.lockAllTiles()"
                  class="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Lock all unlocked tiles"
                >
                  <i data-lucide="lock" class="w-3.5 h-3.5 text-slate-500"></i>
                  <span>Lock All (${this.state.isMasterActive ? 'All' : this.state.unlockedTiles.size})</span>
                </button>
              ` : ''}
              ${(this.state.searchQuery || this.state.categoryFilter !== 'all') ? `
                <button
                  type="button"
                  onclick="window.FPCL_STRATEGIC_SUITE.resetFilters()"
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                  <span>Reset</span>
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Category Filter Pills -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            ${[
              { id: 'all', label: 'All Departments (20)' },
              { id: 'Corporate & Strategic Governance', label: 'Corporate & Governance (4)' },
              { id: 'Operations & Engineering', label: 'Operations & Engineering (6)' },
              { id: 'Safety, Quality & Integrity', label: 'Safety & Quality (5)' },
              { id: 'Corporate Services & People', label: 'Support & People (5)' }
            ].map(cat => {
              const isActive = this.state.categoryFilter === cat.id;
              return `
                <button
                  onclick="window.FPCL_STRATEGIC_SUITE.setCategoryFilter('${cat.id}')"
                  class="px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer text-xs ${
                    isActive
                      ? 'bg-[#1E293B] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }"
                >
                  ${cat.label}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 20 PROFESSIONAL BEAUTIFUL ROUNDED CORNER TILES GRID -->
        ${filtered.length === 0 ? `
          <div class="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
            <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <i data-lucide="search-x" class="w-6 h-6"></i>
            </div>
            <h3 class="text-base font-bold text-slate-800">No matching strategic department tiles</h3>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">No department matched your search query "${this.state.searchQuery}". Try searching by another keyword or reset filters.</p>
            <button
              onclick="window.FPCL_STRATEGIC_SUITE.resetFilters()"
              class="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#1E293B] text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        ` : `
          <div id="strategic-tiles-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            ${filtered.map(tile => {
              const isUnlocked = this.state.isMasterActive || this.state.unlockedTiles.has(tile.id);
              const isCustom = this.isTileCustomized(tile.id);

              return `
                <div
                  id="tile-${tile.id}"
                  onclick="window.FPCL_STRATEGIC_SUITE.handleTileClick('${tile.id}')"
                  class="group relative bg-white hover:bg-slate-50/50 rounded-2xl p-5 border border-slate-200/90 hover:border-slate-300/90 flex flex-col justify-between cursor-pointer overflow-hidden transition-all duration-300 shadow-xs hover:shadow-xl hover:-translate-y-1.5 select-none"
                  style="min-height: 250px;"
                >
                  <!-- Top Accent Gradient Stripe -->
                  <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${tile.theme.gradient}"></div>

                  <div>
                    <!-- Tile Header: Icon, Code Badge, Lock/Unlock Status -->
                    <div class="flex items-start justify-between gap-2.5">
                      <div class="flex items-center gap-3">
                        <div
                          class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-2xs border"
                          style="background-color: ${tile.theme.bg}; border-color: ${tile.theme.border}; color: ${tile.theme.primary};"
                        >
                          <i data-lucide="${tile.icon}" class="w-5 h-5"></i>
                        </div>
                        <div>
                          <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold uppercase border ${tile.theme.badgeBg}">
                              ${tile.code}
                            </span>
                            ${tile.isFeatured ? `
                              <span class="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase bg-amber-100 text-amber-900 border border-amber-300">
                                FIRST TILE
                              </span>
                            ` : ''}
                          </div>
                          <span class="text-[10px] font-semibold text-slate-400 block mt-0.5 truncate max-w-[130px]">
                            ${tile.category}
                          </span>
                        </div>
                      </div>

                      <!-- Security status pill -->
                      <div class="flex items-center gap-1">
                        ${isUnlocked ? `
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shadow-2xs" title="Unlocked">
                            <i data-lucide="unlock" class="w-2.5 h-2.5"></i>
                            <span class="hidden xs:inline">Open</span>
                          </span>
                        ` : `
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 shadow-2xs" title="Protected (Default: Abcd@1234)">
                            <i data-lucide="lock" class="w-2.5 h-2.5 text-amber-600"></i>
                            <span class="hidden xs:inline">Locked</span>
                          </span>
                        `}
                        ${isCustom ? `
                          <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200" title="Custom Password Active">
                            Custom
                          </span>
                        ` : ''}
                      </div>
                    </div>

                    <!-- Department Title & Subtitle -->
                    <div class="mt-4 space-y-1">
                      <h3 class="text-base sm:text-lg font-black tracking-tight text-slate-800 group-hover:text-purple-700 transition-colors leading-snug">
                        ${tile.name}
                      </h3>
                      <p class="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                        ${tile.subtitle}
                      </p>
                    </div>

                    <!-- Strategic Progress Bar -->
                    <div class="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                      <div class="flex items-center justify-between text-[11px]">
                        <span class="text-slate-500 font-medium">Strategic Roadmap</span>
                        <span class="font-mono font-bold text-slate-700">${tile.progress}%</span>
                      </div>
                      <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all duration-500 bg-gradient-to-r ${tile.theme.gradient}"
                          style="width: ${tile.progress}%;"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <!-- Tile Footer: Initiatives count & Action Prompt -->
                  <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span class="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                      <i data-lucide="layers" class="w-3 h-3 text-slate-400"></i>
                      <span>${tile.initiatives.length} Initiatives</span>
                    </span>

                    <span class="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 group-hover:text-purple-900 group-hover:translate-x-0.5 transition-all">
                      <i data-lucide="${isUnlocked ? 'folder-open' : 'key-round'}" class="w-3.5 h-3.5"></i>
                      <span>${isUnlocked ? 'Open Dossier' : 'Unlock Tile'}</span>
                      <i data-lucide="arrow-right" class="w-3 h-3"></i>
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}

        <!-- MODAL 1: DETAILED TILE PERFORMANCE DOSSIER -->
        <div id="strategic-detail-modal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div class="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200">
              <div class="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <i data-lucide="target" class="w-4 h-4 text-purple-600"></i>
                <span>Department Strategic Performance Dossier</span>
              </div>
              <button
                onclick="window.FPCL_STRATEGIC_SUITE.closeDetailModal()"
                class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close modal"
              >
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>

            <div id="strategic-modal-body" class="overflow-y-auto pr-1 flex-1">
              <!-- Dynamically populated via openDetailModal() -->
            </div>

            <div class="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span class="text-[11px] text-slate-400 font-mono">FPCL Executive Strategy Portal</span>
              <button
                onclick="window.FPCL_STRATEGIC_SUITE.closeDetailModal()"
                class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        <!-- MODAL 2: TILE AUTHENTICATION & CHANGE PASSWORD MODAL -->
        <div id="strategic-auth-modal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div class="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200">
              <div class="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <i data-lucide="shield-check" class="w-4 h-4 text-purple-600"></i>
                <span>Strategic Security Verification</span>
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

        <!-- MODAL 3: MASTER SECURITY & PASSWORD RESET PORTAL -->
        <div id="strategic-master-modal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div class="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200">
              <div class="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <i data-lucide="shield-alert" class="w-4 h-4 text-purple-600"></i>
                <span>Master Security & Password Tools</span>
              </div>
              <button
                onclick="window.FPCL_STRATEGIC_SUITE.closeMasterModal()"
                class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close modal"
              >
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>

            <div class="overflow-y-auto pr-1 flex-1 space-y-4 text-xs">
              <!-- Banner -->
              <div class="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white space-y-1">
                <div class="flex items-center gap-2 font-bold text-sm text-purple-200">
                  <i data-lucide="key" class="w-4 h-4"></i>
                  <span>Master Administrator Access</span>
                </div>
                <p class="text-[11px] text-purple-200/80">
                  Enter master password <code class="px-1 py-0.5 rounded bg-white/20 text-white font-mono font-bold">abcd@Psuser12345</code> to unlock all dashboards or reset passwords back to the initial <code class="px-1 py-0.5 rounded bg-white/20 text-white font-mono font-bold">Abcd@1234</code>.
                </p>
              </div>

              <!-- Input -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-700">Enter Master Password</label>
                <div class="relative">
                  <input
                    id="strategic-master-modal-pwd"
                    type="password"
                    placeholder="Enter abcd@Psuser12345..."
                    class="w-full px-3.5 py-2.5 pr-10 text-xs font-mono rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white text-slate-900 outline-none"
                    oninput="window.FPCL_STRATEGIC_SUITE.onMasterModalInput(this.value)"
                    onkeydown="if(event.key==='Enter') window.FPCL_STRATEGIC_SUITE.submitMasterModalUnlockAll()"
                  />
                  <button
                    type="button"
                    onclick="window.FPCL_STRATEGIC_SUITE.toggleVisibility('masterInput')"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <i id="strategic-master-eye" data-lucide="eye" class="w-4 h-4"></i>
                  </button>
                </div>
                <div id="strategic-master-error" class="hidden text-xs text-rose-600 font-semibold mt-1"></div>
              </div>

              <!-- Master Actions Panel (Revealed when correct master password entered) -->
              <div id="strategic-master-actions-panel" class="hidden space-y-3 pt-2 border-t border-slate-200 animate-in fade-in">
                <div class="font-bold text-slate-700 flex items-center gap-1.5">
                  <i data-lucide="sliders" class="w-3.5 h-3.5 text-purple-600"></i>
                  <span>Master Administrator Actions</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <!-- Global Reset Button -->
                  <button
                    type="button"
                    onclick="window.FPCL_STRATEGIC_SUITE.submitMasterModalResetAll()"
                    class="p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 font-bold transition-all text-left flex items-start gap-2.5 cursor-pointer shadow-2xs"
                  >
                    <i data-lucide="rotate-ccw" class="w-4 h-4 text-amber-700 shrink-0 mt-0.5"></i>
                    <div>
                      <div>Reset All to Initial (Abcd@1234)</div>
                      <div class="text-[10px] text-amber-800/80 font-normal mt-0.5">Reverts all 20 departmental tile passwords to Abcd@1234</div>
                    </div>
                  </button>

                  <!-- Unlock All Button -->
                  <button
                    type="button"
                    onclick="window.FPCL_STRATEGIC_SUITE.submitMasterModalUnlockAll()"
                    class="p-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-950 font-bold transition-all text-left flex items-start gap-2.5 cursor-pointer shadow-2xs"
                  >
                    <i data-lucide="unlock" class="w-4 h-4 text-purple-700 shrink-0 mt-0.5"></i>
                    <div>
                      <div>Unlock All 20 Dashboards</div>
                      <div class="text-[10px] text-purple-800/80 font-normal mt-0.5">Grants full session access to all department dossiers</div>
                    </div>
                  </button>
                </div>

                <!-- Tile Status & Reset List -->
                <div class="space-y-2 pt-2">
                  <div class="text-xs font-bold text-slate-600 flex items-center justify-between">
                    <span>Department Tiles Status</span>
                    <span class="text-[10px] font-normal text-slate-400 font-mono">20 Total Tiles</span>
                  </div>
                  <div class="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                    ${this.data.map(t => {
                      const isCust = this.isTileCustomized(t.id);
                      return `
                        <div class="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2">
                          <div class="flex items-center gap-2 truncate">
                            <span class="w-2 h-2 rounded-full ${isCust ? 'bg-purple-500' : 'bg-emerald-500'} shrink-0"></span>
                            <span class="font-mono font-bold text-[11px] text-slate-700">${t.code}</span>
                            <span class="font-medium text-slate-600 truncate">${t.name}</span>
                          </div>
                          <div class="flex items-center gap-1.5 shrink-0">
                            <span class="text-[10px] font-mono ${isCust ? 'text-purple-700 font-bold' : 'text-slate-400'}">
                              ${isCust ? 'Custom Password' : 'Initial (Abcd@1234)'}
                            </span>
                            ${isCust ? `
                              <button
                                type="button"
                                onclick="window.FPCL_STRATEGIC_SUITE.resetActiveTileToDefault('${t.id}')"
                                class="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 cursor-pointer"
                                title="Reset to initial password Abcd@1234"
                              >
                                Reset
                              </button>
                            ` : ''}
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.lockAllTiles()"
                class="text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Lock All Dashboards
              </button>
              <button
                type="button"
                onclick="window.FPCL_STRATEGIC_SUITE.closeMasterModal()"
                class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      `;

      container.innerHTML = html;
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  };

  strategicSuite.init();
})();
