/**
 * FPCL Executive Operations & Compliance Portal
 * KPIs Dataset & Offline Fallback Cache
 * 
 * Target Google Sheet ID: 1gkO-kV44ABOuB2JB72FQbwLYdAcAZKBzcIBMBZnR8Ts
 * Sheet Tab: KPIs
 */

(function () {
  'use strict';

  window.FPCL_KPI_DATA = [
    {
      sr: "1",
      mainCategory: "Business Results",
      mainCategoryWeight: "36%",
      kpiCategory: "Business Results",
      kpi: "Net Profitability",
      weightage: "10%",
      weightageNum: 10,
      leadDept: "All",
      secondaryStakeholders: "COO, Finance, Executive Committee",
      minTarget95: "PKR 4.6 Billion",
      target100: "PKR 4.88 Billion (BP)",
      stretchTarget110: "PKR 5.08 Billion",
      unit: "PKR Billions",
      icon: "banknote",
      color: "blue",
      description: "Corporate net bottom-line financial profitability benchmarked against Business Plan (BP)."
    },
    {
      sr: "1",
      mainCategory: "Business Results",
      mainCategoryWeight: "37%",
      kpiCategory: "Business Results",
      kpi: "Plant Availability FFC (PQ)",
      weightage: "15%",
      weightageNum: 15,
      leadDept: "Ops, Maint",
      secondaryStakeholders: "Eng, Insp,",
      minTarget95: "310 days (Contractual 85%)",
      target100: "328 days (90%)",
      stretchTarget110: "335 days (92%)",
      unit: "Operating Days / %",
      icon: "activity",
      color: "emerald",
      description: "Continuous operational availability of power generation assets delivered to FFC Port Qasim."
    },
    {
      sr: "1",
      mainCategory: "Business Results",
      mainCategoryWeight: "38%",
      kpiCategory: "Business Results",
      kpi: "Dispatch KE",
      weightage: "5%",
      weightageNum: 5,
      leadDept: "COO, BD, Eng, SCM",
      secondaryStakeholders: "Operating Committee Members",
      minTarget95: "160,000 MWh (94% of BP)",
      target100: "170,000 MWh (BP)",
      stretchTarget110: "180,000 MWh (106% of BP)",
      unit: "MWh Export",
      icon: "zap",
      color: "amber",
      description: "Total electricity export dispatched to K-Electric grid per off-take agreement."
    },
    {
      sr: "2",
      mainCategory: "Business Results",
      mainCategoryWeight: "39%",
      kpiCategory: "Savings",
      kpi: "Local Coal Sourcing & Utilization (Thar / Jhimpir / Any other)",
      weightage: "4%",
      weightageNum: 4,
      leadDept: "SCM / Commercial / Process",
      secondaryStakeholders: "Ops / Maint.",
      minTarget95: "Savings of PKR 50 Million",
      target100: "Savings of PKR 70 Million vs Imported Coal",
      stretchTarget110: "Savings of PKR 90 Million",
      unit: "PKR Millions",
      icon: "flame",
      color: "orange",
      description: "Cost rationalization through indigenous coal blending (Thar/Jhimpir) substituting imported coal."
    },
    {
      sr: "2",
      mainCategory: "Business Results",
      mainCategoryWeight: "40%",
      kpiCategory: "Savings",
      kpi: "Spares changed from OES to OPM / Non-Proprietary Sources / China Sourcing / Local Development thru. Reverse Engineering",
      weightage: "2%",
      weightageNum: 2,
      leadDept: "Maint, E&I",
      secondaryStakeholders: "Engg, MM",
      minTarget95: "Cost reduction of PKR 40 Million",
      target100: "Cost reduction of PKR 50 Million",
      stretchTarget110: "Cost reduction of PKR 60 Million",
      unit: "PKR Millions",
      icon: "cog",
      color: "cyan",
      description: "Procurement cost savings by migrating equipment spares to non-proprietary, OPM, and reverse-engineered sources."
    },
    {
      sr: "3",
      mainCategory: "Process Improvements 15%",
      mainCategoryWeight: "15%",
      kpiCategory: "Process Improvement (PI)",
      kpi: "Efficient TA -2026 planning with quality execution & Plan for TA 2027",
      weightage: "4%",
      weightageNum: 4,
      leadDept: "Maint, E&I, Insp, Ops, Safety, Eng, SCM",
      secondaryStakeholders: "Maint, E&I, Insp, Ops, Safety, Eng, SCM",
      minTarget95: "Upto or Less than 96 hrs delay / No Job repetition",
      target100: "Upto or Less than 48 hrs Delay / No Job repetition",
      stretchTarget110: "- No Delay / No Job repetition\n- Material / Services readiness for TA-2027",
      unit: "Hours Delay / Readiness",
      icon: "calendar-check",
      color: "indigo",
      description: "Flawless turnaround planning and quality outage execution with zero rework and advance TA-2027 procurement readiness."
    },
    {
      sr: "3",
      mainCategory: "Process Improvements 15%",
      mainCategoryWeight: "15%",
      kpiCategory: "PI",
      kpi: "Safe Plant Operations & Maintaining TRIR at or below set value",
      weightage: "4%",
      weightageNum: 4,
      leadDept: "All",
      secondaryStakeholders: "Safety, Operations, Maintenance",
      minTarget95: "TRIR = 0.70",
      target100: "TRIR = 0.65",
      stretchTarget110: "TRIR = 0.55",
      unit: "TRIR Index",
      icon: "shield-check",
      color: "rose",
      description: "Total Recordable Incident Rate safety governance maintaining world-class personal & process safety standards."
    }
  ];

  // Organogram Structure Configuration
  window.FPCL_KPI_ORGANOGRAM = {
    id: "coo",
    title: "COO FPCL",
    fullTitle: "Chief Operating Officer - FPCL",
    role: "Executive Operations Leadership",
    reportsTo: "Board of Directors / CEO",
    color: "amber",
    badge: "Master Corporate View",
    leadDepts: ["All", "COO", "Executive"],
    kpiFilter: "all",
    avatarBg: "bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white",
    cardBg: "from-amber-50 via-white to-amber-50/30 border-amber-300",
    description: "Full strategic, operational, and financial governance across all plant departments and commercial off-takes.",
    children: [
      {
        id: "sm-production",
        title: "Senior Manager Production",
        fullTitle: "Senior Manager Production",
        role: "Plant Operations & Utilities",
        reportsTo: "COO FPCL",
        color: "indigo",
        badge: "Direct Report",
        leadDepts: ["Ops", "Operations", "Ops, Maint", "Process", "All"],
        kpiFilter: "production",
        avatarBg: "bg-gradient-to-br from-indigo-600 to-blue-700 text-white",
        cardBg: "from-indigo-50 via-white to-blue-50/30 border-indigo-300",
        description: "Oversees 24/7 power plant steam & electricity generation, availability benchmarks, and process efficiency.",
        children: [
          {
            id: "m-production-pu",
            title: "Manager Production (P&U)",
            fullTitle: "Manager Production (Power & Utilities)",
            role: "P&U Unit Operations",
            reportsTo: "Senior Manager Production",
            color: "teal",
            badge: "Operational Head",
            leadDepts: ["Ops", "Ops, Maint", "All"],
            kpiFilter: "production-pu",
            avatarBg: "bg-gradient-to-br from-teal-500 to-emerald-600 text-white",
            cardBg: "from-teal-50 via-white to-emerald-50/20 border-teal-200",
            description: "Direct shift management of Boilers, STGs, water treatment plant, fuel feeding, and utility export."
          }
        ]
      },
      {
        id: "sm-commercial",
        title: "Senior Manager Commercial",
        fullTitle: "Senior Manager Commercial",
        role: "Commercial Strategy",
        reportsTo: "COO FPCL",
        color: "indigo",
        badge: "Direct Report",
        leadDepts: ["SCM", "Commercial", "COO, BD, Eng, SCM", "SCM / Commercial / Process", "All"],
        kpiFilter: "commercial",
        avatarBg: "bg-gradient-to-br from-indigo-600 to-blue-700 text-white",
        cardBg: "from-indigo-50 via-white to-blue-50/30 border-indigo-300",
        description: "Manages power purchase agreements, K-Electric dispatches, indigenous coal procurement, and commercial savings.",
        children: []
      },
      {
        id: "sm-ei",
        title: "Senior Manager E&I",
        fullTitle: "Senior Manager Electrical & Instrumentation",
        role: "E&I Integrity & Automation",
        reportsTo: "COO FPCL",
        color: "indigo",
        badge: "Direct Report",
        leadDepts: ["E&I", "Maint, E&I", "Engg", "All"],
        kpiFilter: "ei",
        avatarBg: "bg-gradient-to-br from-indigo-600 to-blue-700 text-white",
        cardBg: "from-indigo-50 via-white to-blue-50/30 border-indigo-300",
        description: "Responsible for electrical grid reliability, switchgear, protection relays, DCS, and instrumentation maintenance.",
        children: [
          {
            id: "m-electrical",
            title: "Manager Electrical",
            fullTitle: "Manager Electrical Maintenance",
            role: "Electrical Systems",
            reportsTo: "Senior Manager E&I",
            color: "teal",
            badge: "E Maintenance",
            leadDepts: ["E&I", "Maint, E&I", "All"],
            kpiFilter: "electrical",
            avatarBg: "bg-gradient-to-br from-teal-500 to-emerald-600 text-white",
            cardBg: "from-teal-50 via-white to-emerald-50/20 border-teal-200",
            description: "High/medium voltage transformers, MV/LV switchgears, generator exciters, and electrical reverse-engineering."
          },
          {
            id: "m-instrument",
            title: "Manager Instrument",
            fullTitle: "Manager Instrumentation & Controls",
            role: "I&C Systems",
            reportsTo: "Senior Manager E&I",
            color: "teal",
            badge: "I&C Systems",
            leadDepts: ["E&I", "Maint, E&I", "All"],
            kpiFilter: "instrument",
            avatarBg: "bg-gradient-to-br from-teal-500 to-emerald-600 text-white",
            cardBg: "from-teal-50 via-white to-emerald-50/20 border-teal-200",
            description: "DCS control loops, turbine supervisory instrumentation, field transmitters, and automated control valves."
          }
        ]
      },
      {
        id: "sm-mech-maint",
        title: "Senior Manager Mech Maint",
        fullTitle: "Senior Manager Mechanical Maintenance",
        role: "Plant Machinery & Reliability",
        reportsTo: "COO FPCL",
        color: "indigo",
        badge: "Direct Report",
        leadDepts: ["Maint", "Maint, E&I", "Ops, Maint", "All"],
        kpiFilter: "mech-maint",
        avatarBg: "bg-gradient-to-br from-indigo-600 to-blue-700 text-white",
        cardBg: "from-indigo-50 via-white to-blue-50/30 border-indigo-300",
        description: "Leads mechanical asset integrity, rotating equipment overhaul, major turnaround execution, and spare parts optimization.",
        children: [
          {
            id: "m-equipment",
            title: "Manager Equipment",
            fullTitle: "Manager Static Equipment",
            role: "Boilers & Static Assets",
            reportsTo: "Senior Manager Mech Maint",
            color: "teal",
            badge: "Static Assets",
            leadDepts: ["Maint", "Maint, E&I", "All"],
            kpiFilter: "equipment",
            avatarBg: "bg-gradient-to-br from-teal-500 to-emerald-600 text-white",
            cardBg: "from-teal-50 via-white to-emerald-50/20 border-teal-200",
            description: "CFB Boilers, steam drums, piping networks, heat exchangers, cyclones, and structural inspections."
          },
          {
            id: "m-machinery",
            title: "Manager Machinery",
            fullTitle: "Manager Rotating Machinery",
            role: "Turbines & Rotating Assets",
            reportsTo: "Senior Manager Mech Maint",
            color: "teal",
            badge: "Rotating Assets",
            leadDepts: ["Maint", "Maint, E&I", "All"],
            kpiFilter: "machinery",
            avatarBg: "bg-gradient-to-br from-teal-500 to-emerald-600 text-white",
            cardBg: "from-teal-50 via-white to-emerald-50/20 border-teal-200",
            description: "Steam turbine generators, high-pressure boiler feed pumps, cooling water pumps, and air compressors."
          },
          {
            id: "m-planning",
            title: "Manager Planning",
            fullTitle: "Manager Maintenance Planning & TA",
            role: "Planning & TA Scheduling",
            reportsTo: "Senior Manager Mech Maint",
            color: "teal",
            badge: "Turnaround & PM",
            leadDepts: ["Maint", "Maint, E&I", "All"],
            kpiFilter: "planning",
            avatarBg: "bg-gradient-to-br from-teal-500 to-emerald-600 text-white",
            cardBg: "from-teal-50 via-white to-emerald-50/20 border-teal-200",
            description: "Turnaround (TA) critical path planning, CMMS preventive maintenance work orders, and long-lead spares logistics."
          }
        ]
      }
    ]
  };

})();
