/**
 * FPCL Executive Operations & Compliance Portal
 * CAPEX (Capital Expenditure & Investment Projects) Executive BI Suite
 * 
 * Google Sheet ID: 13ys4PbggcQq0H06Rh6cScAtdVnlrY-yyiWxA4e6dDzc
 * Sheet Tab: CAPEX
 */

(function () {
  'use strict';

  const CAPEX_SHEET_ID = '13ys4PbggcQq0H06Rh6cScAtdVnlrY-yyiWxA4e6dDzc';
  const CAPEX_SHEET_TAB = 'CAPEX';
  const CAPEX_SHEET_URL = `https://docs.google.com/spreadsheets/d/${CAPEX_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${CAPEX_SHEET_TAB}`;

  // 36 Baseline 2027 CapEx Portfolio Projects matching executive specifications
  // Total: PKR 1,028.0 M | Major (>4.5M): 19 projects (PKR 997.2 M) | Minor (<=4.5M): 17 projects (PKR 30.8 M)
  // Replacements Major: PKR 751.7 M (75.4%) | New Major: PKR 245.5 M (24.6%)
  // Replacements Minor: PKR 17.9 M (58.0%) | New Minor: PKR 12.9 M (42.0%)
  // Categories: Reliability & Sustenance: 747 M (72.6%) | Others/Admin: 197 M (19.2%) | Efficiency: 49 M (4.8%) | HSE: 36 M (3.5%)
  const BASELINE_2027_PROJECTS = [
    // Major Projects (> 4.5 M) - 19 Projects
    {
      sr: 1,
      year: '2027',
      name: 'Boiler Tubes Thermal Spray Coating Job 2027',
      wbs: 'FL-2027-0002-INS-01',
      unit: 'Inspection',
      category: 'Reliability & Sustenance',
      reason: 'End Of Life / Tube erosion mitigation',
      type: 'Replacement',
      moc: 'Yes',
      budget: 120000000,
      priority: 'A',
      status: 'Open',
      serviceLife: '3 Years',
      quantity: '1 Lot',
      strategy: 'Approved Dec 2026 BOD; phased execution during ATA 2027 turnaround.',
      remarks: 'Thermal spray surface protection for water wall panels.',
      assigned: 'Inspection / Mechanical'
    },
    {
      sr: 2,
      year: '2027',
      name: 'SAP Rise ERP Modernization & Cloud Core',
      wbs: 'FL-2027-0001-TEC-01',
      unit: 'ICT',
      category: 'Others/Admin',
      reason: 'Digital Transformation & Cloud Migration',
      type: 'New',
      moc: 'No',
      budget: 135000000,
      priority: 'A',
      status: 'Open',
      serviceLife: '7 Years',
      quantity: '1 System',
      strategy: 'Enterprise cloud migration under multi-year technology upgrade.',
      remarks: 'Contract stage with SAP Pakistan; UAT scheduled Q3 2027.',
      assigned: 'ICT / Finance'
    },
    {
      sr: 3,
      year: '2027',
      name: 'Coal Shed Structural Rehabilitation & Truss Reinforcement',
      wbs: 'FL-2027-0003-MEC-01',
      unit: 'Maintenance',
      category: 'Reliability & Sustenance',
      reason: 'Plant Reliability & Corrosion Mitigation',
      type: 'Replacement',
      moc: 'Yes',
      budget: 115000000,
      priority: 'A',
      status: 'Open',
      serviceLife: '10 Years',
      quantity: '1 Civil/Mech Pack',
      strategy: 'Executing structural refurbishment to prevent coal moisture degradation.',
      remarks: 'Detailed engineering complete, vendor tender floated.',
      assigned: 'Mechanical / Civil'
    },
    {
      sr: 4,
      year: '2027',
      name: 'Economizer Bank & Lower Header Tubes Replacement',
      wbs: 'FL-2027-0002-PRO-01',
      unit: 'Inspection',
      category: 'Reliability & Sustenance',
      reason: 'HHI Technical Recommendation / EOL',
      type: 'Replacement',
      moc: 'Yes',
      budget: 105000000,
      priority: 'A',
      status: 'Open',
      serviceLife: '6 Years',
      quantity: '40 Tube Bundles',
      strategy: 'Executing in ATA 2027. High-alloy tubing procurement in progress.',
      remarks: 'Critical for boiler steam generation availability.',
      assigned: 'Inspection'
    },
    {
      sr: 5,
      year: '2027',
      name: 'STG #4 Turbine Blading & Rotor Refurbishment',
      wbs: 'FL-2027-0004-MEC-01',
      unit: 'Maintenance',
      category: 'Reliability & Sustenance',
      reason: 'Mitigation of Historical Outages (PLR Focus)',
      type: 'Replacement',
      moc: 'Yes',
      budget: 98000000,
      priority: 'A',
      status: 'Open',
      serviceLife: '8 Years',
      quantity: '1 Rotor Assembly',
      strategy: 'Major overhaul window aligned with planned grid shutdown.',
      remarks: 'Addresses turbine exhaust high temp alarms.',
      assigned: 'Maintenance / PE'
    },
    {
      sr: 6,
      year: '2027',
      name: 'Main Boiler Feedwater Pump (BFP-A/B) Overhaul & Impeller Upgrade',
      wbs: 'FL-2027-0005-MEC-02',
      unit: 'Maintenance',
      category: 'Reliability & Sustenance',
      reason: 'End Of Life & Hydraulic Wear',
      type: 'Replacement',
      moc: 'Yes',
      budget: 76000000,
      priority: 'A',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '2 Trains',
      strategy: 'Parallel train redundancy overhaul to prevent load curtailment.',
      remarks: 'OEM spares delivery expected March 2027.',
      assigned: 'Maintenance'
    },
    {
      sr: 7,
      year: '2027',
      name: 'Superheater Platens & Thermal Shielding Replacement',
      wbs: 'FL-2027-0006-INS-02',
      unit: 'Inspection',
      category: 'Reliability & Sustenance',
      reason: 'End Of Life / Creep Exposure',
      type: 'Replacement',
      moc: 'Yes',
      budget: 62000000,
      priority: 'A',
      status: 'Open',
      serviceLife: '6 Years',
      quantity: '1 Set',
      strategy: 'Turnaround ATA 2027 execution.',
      remarks: 'Creep analysis indicates replacement urgency.',
      assigned: 'Inspection'
    },
    {
      sr: 8,
      year: '2027',
      name: '132kV GIS Switchyard Circuit Breakers & CT/PT Overhaul',
      wbs: 'FL-2027-0003-ELE-02',
      unit: 'E&I',
      category: 'Reliability & Sustenance',
      reason: 'Sustenance & Grid Interconnection Integrity',
      type: 'Replacement',
      moc: 'Yes',
      budget: 48000000,
      priority: 'A',
      status: 'Open',
      serviceLife: '10 Years',
      quantity: '4 Bays',
      strategy: 'Coordinated with National Transmission & Dispatch Co.',
      remarks: 'SF6 gas handling certified team required.',
      assigned: 'E&I'
    },
    {
      sr: 9,
      year: '2027',
      name: 'Distributed Control System (DCS) Controller Hardware Refresh',
      wbs: 'FL-2027-0004-ELE-03',
      unit: 'E&I',
      category: 'Reliability & Sustenance',
      reason: 'Hardware Obsolescence & Vendor EOL',
      type: 'Replacement',
      moc: 'Yes',
      budget: 42000000,
      priority: 'A',
      status: 'Open',
      serviceLife: '8 Years',
      quantity: '1 Upgrade Kit',
      strategy: 'Hot-swap migration without plant shutdown disruption.',
      remarks: 'Pre-FAT testing planned at vendor facility.',
      assigned: 'E&I / Automation'
    },
    {
      sr: 10,
      year: '2027',
      name: 'Ash Handling Pneumatic Conveyor System Piping Upgrade',
      wbs: 'FL-2027-0007-MEC-03',
      unit: 'Maintenance',
      category: 'Reliability & Sustenance',
      reason: 'Erosion / Plant Reliability',
      type: 'Replacement',
      moc: 'Yes',
      budget: 38000000,
      priority: 'B',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '600m Piping',
      strategy: 'Replacement with basalt/ceramic lined piping.',
      remarks: 'Reduces fly-ash transport line puncture risk.',
      assigned: 'Maintenance'
    },
    {
      sr: 11,
      year: '2027',
      name: 'Boiler Water Wall Membrane Panel Replacement (Lower Evaporator)',
      wbs: 'FL-2027-0009-INS-03',
      unit: 'Inspection',
      category: 'Reliability & Sustenance',
      reason: 'End Of Life / Thinning Rate',
      type: 'Replacement',
      moc: 'Yes',
      budget: 47700000,
      priority: 'A',
      status: 'Open',
      serviceLife: '7 Years',
      quantity: '1 Lot',
      strategy: 'Phased fabrication and installation during scheduled outage.',
      remarks: 'Ultrasonic thickness survey findings confirmed.',
      assigned: 'Inspection'
    },
    {
      sr: 12,
      year: '2027',
      name: 'VFD Systems for Primary Air (PA) and Induced Draft (ID) Fans',
      wbs: 'FL-2027-0002-ELE-01',
      unit: 'E&I',
      category: 'Efficiency',
      reason: 'Energy Efficiency & Heat Rate Optimization',
      type: 'New',
      moc: 'Yes',
      budget: 49000000,
      priority: 'A',
      status: 'Open',
      serviceLife: '10 Years',
      quantity: '2 Units',
      strategy: 'Estimated 1.8 year financial payback from auxiliary power reduction.',
      remarks: 'Significant MWh savings on plant auxiliary consumption.',
      assigned: 'E&I'
    },
    {
      sr: 13,
      year: '2027',
      name: 'Solarization of FPCL Admin & Building Rooftops (500 kWp)',
      wbs: 'FL-2027-0001-ELE-02',
      unit: 'E&I',
      category: 'Others/Admin',
      reason: 'Green Energy Sustenance & Cost Reduction',
      type: 'New',
      moc: 'Yes',
      budget: 38000000,
      priority: 'B',
      status: 'Open',
      serviceLife: '15 Years',
      quantity: '500 kWp Array',
      strategy: 'Phased procurement across 2027–2028 with net-metering setup.',
      remarks: 'Rooftop structural load assessments verified.',
      assigned: 'E&I / SCM'
    },
    {
      sr: 14,
      year: '2027',
      name: 'Coal Conveyor Belts Deluge & Fire Suppression Automation (Phase II)',
      wbs: 'FL-2027-0002-HSE-01',
      unit: 'Project',
      category: 'HSE',
      reason: 'Legal Compliance with NEPRA / Stonehouse USA',
      type: 'New',
      moc: 'Yes',
      budget: 24000000,
      priority: 'A',
      status: 'Open',
      serviceLife: '10 Years',
      quantity: 'Phase II Sys',
      strategy: 'Statutory compliance for coal handling safety.',
      remarks: 'Linear heat detection cable and deluge valves included.',
      assigned: 'Project / HSE'
    },
    {
      sr: 15,
      year: '2027',
      name: 'Plant Emergency Siren & Integrated Mass Evacuation Audio',
      wbs: 'FL-2027-0004-HSE-03',
      unit: 'Project',
      category: 'Reliability & Sustenance',
      reason: 'OSHA / NEPRA Safety Mandatory Requirement',
      type: 'New',
      moc: 'Yes',
      budget: 21700000,
      priority: 'A',
      status: 'Open',
      serviceLife: '10 Years',
      quantity: 'Multi-Zone',
      strategy: 'Full plant acoustic coverage with backup DC power supplies.',
      remarks: 'Complies with emergency response guidelines.',
      assigned: 'Project / HSE'
    },
    {
      sr: 16,
      year: '2027',
      name: 'Reverse Osmosis (RO) Membrane Train-C Water Treatment Expansion',
      wbs: 'FL-2027-0008-PRO-02',
      unit: 'Equipment',
      category: 'Reliability & Sustenance',
      reason: 'High-purity Boiler Feedwater Sustenance',
      type: 'New',
      moc: 'Yes',
      budget: 18500000,
      priority: 'B',
      status: 'Open',
      serviceLife: '8 Years',
      quantity: '1 Skid Unit',
      strategy: 'Skid modular delivery to increase demin water reserve capacity.',
      remarks: 'Prevents silica carryover in high-pressure steam cycle.',
      assigned: 'Equipment / Chemistry'
    },
    {
      sr: 17,
      year: '2027',
      name: 'Security Perimeter CCTV & AI Surveillance Modernization',
      wbs: 'FL-2027-0002-ADM-01',
      unit: 'Admin',
      category: 'Others/Admin',
      reason: 'Security Compliance & Plant Perimeter Guarding',
      type: 'New',
      moc: 'No',
      budget: 14000000,
      priority: 'B',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '48 IP Cameras',
      strategy: 'Perimeter optical and thermal cameras linked to Central Control.',
      remarks: 'Admin & Security division execution.',
      assigned: 'Admin / Security'
    },
    {
      sr: 18,
      year: '2027',
      name: 'Wind Fencing Extension & Dust Barrier at South-East Boundary',
      wbs: 'FL-2027-0003-HSE-02',
      unit: 'HSE',
      category: 'HSE',
      reason: 'SEPA Environmental Regulations Compliance',
      type: 'New',
      moc: 'No',
      budget: 12000000,
      priority: 'B',
      status: 'Open',
      serviceLife: '8 Years',
      quantity: '180m Fence',
      strategy: 'Modular steel fencing to suppress fugitive coal dust.',
      remarks: 'SEPA environmental monitoring benchmark requirement.',
      assigned: 'HSE / Civil'
    },
    {
      sr: 19,
      year: '2027',
      name: 'SolidWorks & Engineering Modelling Software Perpetual Entitlement',
      wbs: 'FL-2027-0003-TEC-02',
      unit: 'ICT',
      category: 'Others/Admin',
      reason: 'Engineering Modelling Capability Sustenance',
      type: 'New',
      moc: 'No',
      budget: 8300000,
      priority: 'B',
      status: 'Close',
      serviceLife: 'Perpetual',
      quantity: '2 Licences',
      strategy: 'Vendor contract negotiated with 3-year maintenance entitlement.',
      remarks: 'Procured and operational for Plant Engineering team.',
      assigned: 'ICT / PE'
    },

    // Minor Projects (<= 4.5 M) - 17 Projects (Total PKR 30.8 M)
    // Replacements Minor: PKR 17.9 M (58%) | New Minor: PKR 12.9 M (42%)
    {
      sr: 20,
      year: '2027',
      name: 'Cisco Enterprise Network Core Switches Upgrade',
      wbs: 'FL-2027-0004-TEC-03',
      unit: 'ICT',
      category: 'Others/Admin',
      reason: 'Hardware Obsolescence & Port Failures',
      type: 'Replacement',
      moc: 'No',
      budget: 3800000,
      priority: 'B',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '4 Switches',
      strategy: 'High-availability redundancy in plant data backbone.',
      remarks: 'Procurement in progress via SCM.',
      assigned: 'ICT'
    },
    {
      sr: 21,
      year: '2027',
      name: 'Split ACs Replacements for Electrical Substations & Control Rooms',
      wbs: 'FL-2027-0005-ELE-04',
      unit: 'E&I',
      category: 'Others/Admin',
      reason: 'Ambient Cooling for Sensitive Electronics',
      type: 'Replacement',
      moc: 'No',
      budget: 3500000,
      priority: 'B',
      status: 'Close',
      serviceLife: '4 Years',
      quantity: '12 Units',
      strategy: 'Inverter-based energy efficient replacement.',
      remarks: 'Installed and commissioned.',
      assigned: 'E&I'
    },
    {
      sr: 22,
      year: '2027',
      name: 'ATEX Certified Industrial Vacuum Cleaner for Coal Handling',
      wbs: 'FL-2027-0005-HSE-04',
      unit: 'HSE',
      category: 'Reliability & Sustenance',
      reason: 'Explosion Prevention / Housekeeping',
      type: 'Replacement',
      moc: 'Yes',
      budget: 3200000,
      priority: 'B',
      status: 'Open',
      serviceLife: '4 Years',
      quantity: '2 Units',
      strategy: 'Compliance with combustible dust mitigation standards.',
      remarks: 'Replaces decommissioned vacuum unit.',
      assigned: 'HSE'
    },
    {
      sr: 23,
      year: '2027',
      name: 'Plant Vibration Analyzers & Diagnostic Transducers',
      wbs: 'FL-2027-0010-INS-04',
      unit: 'Inspection',
      category: 'Reliability & Sustenance',
      reason: 'Predictive Condition Monitoring',
      type: 'Replacement',
      moc: 'No',
      budget: 2900000,
      priority: 'A',
      status: 'Open',
      serviceLife: '4 Years',
      quantity: '3 Kits',
      strategy: 'Equips machinery reliability team with precision probes.',
      remarks: 'Critical for early bearing and misalignment detection.',
      assigned: 'Inspection'
    },
    {
      sr: 24,
      year: '2027',
      name: 'Boiler Drum Level Magnetic Gauge Retrofit',
      wbs: 'FL-2027-0006-ELE-05',
      unit: 'E&I',
      category: 'Reliability & Sustenance',
      reason: 'Legal Compliance with NEPRA / Glass Leaks',
      type: 'Replacement',
      moc: 'Yes',
      budget: 2100000,
      priority: 'A',
      status: 'Open',
      serviceLife: '6 Years',
      quantity: '2 Assemblies',
      strategy: 'Direct level visibility upgrade meeting ASME guidelines.',
      remarks: 'Eliminates sight glass blowouts.',
      assigned: 'E&I'
    },
    {
      sr: 25,
      year: '2027',
      name: 'Turbine Lube Oil Purifier Vacuum Coalescer Element',
      wbs: 'FL-2027-0011-MEC-04',
      unit: 'Maintenance',
      category: 'Reliability & Sustenance',
      reason: 'Oil Moisture Removal Sustenance',
      type: 'Replacement',
      moc: 'Yes',
      budget: 1900000,
      priority: 'A',
      status: 'Open',
      serviceLife: '2 Years',
      quantity: '1 Set',
      strategy: 'Essential for STG turbine bearing oil clean condition.',
      remarks: 'Maintains oil breakdown voltage and viscosity.',
      assigned: 'Maintenance'
    },
    {
      sr: 26,
      year: '2027',
      name: 'Safety Relief Valves (PSV) Testing Bench Overhaul',
      wbs: 'FL-2027-0012-INS-05',
      unit: 'Inspection',
      category: 'Reliability & Sustenance',
      reason: 'Annual Certification Mandatory',
      type: 'Replacement',
      moc: 'Yes',
      budget: 1300000,
      priority: 'A',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '1 Bench',
      strategy: 'In-house PSV calibration certification.',
      remarks: 'Maintains ASME compliance for plant boilers.',
      assigned: 'Inspection'
    },
    {
      sr: 27,
      year: '2027',
      name: 'Cooling Tower Fan Vibration Cutout Switches',
      wbs: 'FL-2027-0007-ELE-06',
      unit: 'E&I',
      category: 'Reliability & Sustenance',
      reason: 'Asset Protection Against Fan Blade Fracture',
      type: 'Replacement',
      moc: 'Yes',
      budget: 1200000,
      priority: 'B',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '6 Units',
      strategy: 'Protects cooling cell gearboxes from violent imbalance.',
      remarks: 'High priority for summer operating season.',
      assigned: 'E&I'
    },
    {
      sr: 28,
      year: '2027',
      name: 'Fog Cannon Coal Dust Suppression Mobile Unit',
      wbs: 'FL-2027-0006-HSE-05',
      unit: 'HSE',
      category: 'Others/Admin',
      reason: 'Coal Stockyard Dust Mitigation',
      type: 'New',
      moc: 'No',
      budget: 4100000,
      priority: 'B',
      status: 'Close',
      serviceLife: '6 Years',
      quantity: '1 Mobile Unit',
      strategy: 'Disperses fine mist plume over unloading stockpiles.',
      remarks: 'Delivered and operational.',
      assigned: 'HSE'
    },
    {
      sr: 29,
      year: '2027',
      name: 'AutoCAD Plant 3D Design Suite License Renewal',
      wbs: 'FL-2027-0007-TEC-06',
      unit: 'ICT',
      category: 'Others/Admin',
      reason: 'P&ID Revision & Isometric Modelling',
      type: 'New',
      moc: 'No',
      budget: 2900000,
      priority: 'B',
      status: 'Close',
      serviceLife: '3 Years',
      quantity: '3 Seats',
      strategy: 'Engineering drawing and as-built updating capability.',
      remarks: 'Software keys active and assigned.',
      assigned: 'ICT'
    },
    {
      sr: 30,
      year: '2027',
      name: 'Fuel Dispenser Smart RFID Flow Meters',
      wbs: 'FL-2027-0006-TEC-05',
      unit: 'ICT',
      category: 'Others/Admin',
      reason: 'Automated Fleet Fuel Reconciliation',
      type: 'New',
      moc: 'No',
      budget: 2400000,
      priority: 'C',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '2 Nozzles',
      strategy: 'Integrates heavy plant equipment fueling with SAP.',
      remarks: 'Technical evaluation stage with vendor.',
      assigned: 'ICT / Project'
    },
    {
      sr: 31,
      year: '2027',
      name: 'Smart Rugged Field Tablets for Operator Rounds & Logsheets',
      wbs: 'FL-2027-0008-TEC-07',
      unit: 'ICT',
      category: 'Others/Admin',
      reason: 'Digital Shift Logbooks & Paperless Plant',
      type: 'New',
      moc: 'No',
      budget: 1600000,
      priority: 'C',
      status: 'Close',
      serviceLife: '3 Years',
      quantity: '6 Tablets',
      strategy: 'Explosion-proof tablets for Operations round logging.',
      remarks: 'Field deployed to Shift Engineers.',
      assigned: 'ICT / Operations'
    },
    {
      sr: 32,
      year: '2027',
      name: 'Safety Emergency Shower & Eyewash Station Telemetry Sensors',
      wbs: 'FL-2027-0007-HSE-06',
      unit: 'Project',
      category: 'Others/Admin',
      reason: 'OSHA Rapid Emergency Response Monitoring',
      type: 'New',
      moc: 'No',
      budget: 900000,
      priority: 'B',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '10 Stations',
      strategy: 'Transmits alarm to main control room when shower pulled.',
      remarks: 'Enhances worker chemical burn rescue times.',
      assigned: 'Project / HSE'
    },
    {
      sr: 33,
      year: '2027',
      name: 'Perimeter Intrusion Detection Microwave Sensors',
      wbs: 'FL-2027-0003-ADM-02',
      unit: 'Admin',
      category: 'Others/Admin',
      reason: 'Physical Boundary Security Reinforcement',
      type: 'New',
      moc: 'No',
      budget: 500000,
      priority: 'B',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '4 Sectors',
      strategy: 'Provides invisible beam barrier along critical fence corners.',
      remarks: 'Admin & Security division implementation.',
      assigned: 'Admin'
    },
    {
      sr: 34,
      year: '2027',
      name: 'High-Angle Rescue Equipment & Confined Space Stretcher Kits',
      wbs: 'FL-2027-0008-HSE-07',
      unit: 'HSE',
      category: 'Others/Admin',
      reason: 'Emergency Preparedness for Boiler Confined Spaces',
      type: 'New',
      moc: 'No',
      budget: 300000,
      priority: 'C',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '2 Kits',
      strategy: 'Certifies technical rescue readiness inside CFB boiler furnace.',
      remarks: 'Staff drill training scheduled.',
      assigned: 'HSE'
    },
    {
      sr: 35,
      year: '2027',
      name: 'High-Performance Mobile Workstations for PE & Maintenance',
      wbs: 'FL-2027-0005-TEC-04',
      unit: 'ICT',
      category: 'Others/Admin',
      reason: 'CAD Modeling & Finite Element Analysis',
      type: 'New',
      moc: 'No',
      budget: 1200000,
      priority: 'B',
      status: 'Close',
      serviceLife: '4 Years',
      quantity: '4 Laptops',
      strategy: 'Procured for simulation and vibration analysis engineers.',
      remarks: 'Delivered and active.',
      assigned: 'ICT'
    },
    {
      sr: 36,
      year: '2027',
      name: 'Laboratory Gas Chromatograph Spectrometer Column Replacement',
      wbs: 'FL-2027-0013-INS-06',
      unit: 'Inspection',
      category: 'Others/Admin',
      reason: 'Coal & Flue Gas Sample Purity Testing',
      type: 'Replacement',
      moc: 'No',
      budget: 900000,
      priority: 'B',
      status: 'Close',
      serviceLife: '2 Years',
      quantity: '1 Column',
      strategy: 'Ensures accurate calorific value and sulfur verification.',
      remarks: 'Installed in plant chemical lab.',
      assigned: 'Inspection / Chemistry'
    }
  ];

  // Live rows from Google Sheet 13ys4PbggcQq0H06Rh6cScAtdVnlrY-yyiWxA4e6dDzc (CAPEX tab)
  const MULTI_YEAR_LIVE_SEED = [
    {
      sr: 1,
      year: '2024',
      name: 'Econ -4',
      wbs: 'FL-2024-0002-PRO-01',
      unit: 'Inspection',
      category: 'IT',
      reason: '',
      type: 'New',
      moc: 'Yes',
      budget: 4000000,
      consumed: 400000,
      commitment: 40000,
      available: 40,
      priority: 'A',
      status: 'Open',
      serviceLife: '',
      quantity: '4',
      strategy: 'To be executed in ATA 2027',
      remarks: 'in progress',
      assigned: 'Inspection'
    },
    {
      sr: 2,
      year: '2025',
      name: 'Econ-5',
      wbs: 'FL-2024-0002-PRO-01',
      unit: 'Operation',
      category: 'HSEQ',
      reason: '',
      type: 'New',
      moc: 'Yes',
      budget: 5000000,
      consumed: 500000,
      commitment: 50000,
      available: 50,
      priority: 'A',
      status: 'Open',
      serviceLife: '',
      quantity: '5',
      strategy: 'To be executed in ATA 2027',
      remarks: 'guidance needed',
      assigned: 'Operation'
    },
    {
      sr: 3,
      year: '2026',
      name: 'Econ -6',
      wbs: 'FL-2024-0002-PRO-01',
      unit: 'HSE',
      category: 'HSEQ',
      reason: '',
      type: 'Replacement',
      moc: 'No',
      budget: 6000000,
      consumed: 600000,
      commitment: 60000,
      available: 60,
      priority: 'B',
      status: 'Close',
      serviceLife: '',
      quantity: '6',
      strategy: 'To be executed in ATA 2027',
      remarks: 'completed',
      assigned: 'HSE'
    },
    {
      sr: 4,
      year: '2027',
      name: 'Econ-7',
      wbs: 'FL-2024-0002-PRO-01',
      unit: 'PE',
      category: 'Equipment',
      reason: '',
      type: 'Replacement',
      moc: 'No',
      budget: 7000000,
      consumed: 700000,
      commitment: 70000,
      available: 70,
      priority: 'B',
      status: 'Close',
      serviceLife: '',
      quantity: '7',
      strategy: 'To be executed in ATA 2027',
      remarks: 'completed',
      assigned: 'PE'
    },
      year: '2024',
      name: 'Fire protection systems For Coal Conveyor Belts & Crusher Baghouse',
      wbs: 'FL-2024-0002-HSE-01',
      unit: 'Project',
      category: 'HSE',
      reason: 'Fire & Explosion Protection',
      type: 'New',
      moc: 'No',
      budget: 43500000,
      consumed: 32546046,
      commitment: 9597879,
      available: 1356075,
      priority: 'B',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '1',
      strategy: 'Provide date of Completion. CAPEX will lapse at this year end.',
      remarks: '',
      assigned: 'Project'
    },
    {
      sr: 2,
      year: '2024',
      name: 'Fire protection systems For Coal Conveyor Belts & Crusher Baghouse',
      wbs: 'FL-2024-0002-HSE-01',
      unit: 'Maintenance',
      category: 'HSE',
      reason: 'Fire & Explosion Protection',
      type: 'New',
      moc: 'No',
      budget: 43500000,
      consumed: 32546046,
      commitment: 9597879,
      available: 1356075,
      priority: 'B',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '1',
      strategy: 'Provide date of Completion. CAPEX will lapse at this year end.',
      remarks: '',
      assigned: 'Maintenance'
    },
    {
      sr: 3,
      year: '2025',
      name: 'Coal Dust Study Recommendation by M/s Stonehouse (USA): Fire & Explosion protection systems of Coal Conveyor Belts (Linear Heat Detectors & water sprinklers) - Phase II',
      wbs: 'FL-2025-0002-HSE-01',
      unit: 'Equipment',
      category: 'HSE',
      reason: 'Stonehouse Recommendation',
      type: 'New',
      moc: 'No',
      budget: 88000000,
      consumed: 45011747,
      commitment: 42714379,
      available: 273874,
      priority: 'B',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '1',
      strategy: 'Provide date of Completion. CAPEX will lapse at this year end.',
      remarks: '',
      assigned: 'Equipment'
    },
    {
      sr: 3,
      year: '2025',
      name: 'Coal Dust Study Recommendation by M/s Stonehouse (USA): Fire & Explosion protection systems of Coal Conveyor Belts (Linear Heat Detectors & water sprinklers) - Phase II',
      wbs: 'FL-2025-0002-HSE-01',
      unit: 'Maintenance',
      category: 'HSE',
      reason: 'Stonehouse Recommendation',
      type: 'New',
      moc: 'No',
      budget: 88000000,
      consumed: 45011747,
      commitment: 42714379,
      available: 273874,
      priority: 'B',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '1',
      strategy: 'Provide date of Completion. CAPEX will lapse at this year end.',
      remarks: '',
      assigned: 'Maintenance'
    },
    {
      sr: 3,
      year: '2025',
      name: 'Coal Dust Study Recommendation by M/s Stonehouse (USA): Fire & Explosion protection systems of Coal Conveyor Belts (Linear Heat Detectors & water sprinklers) - Phase II',
      wbs: 'FL-2025-0002-HSE-01',
      unit: 'E&I',
      category: 'HSE',
      reason: 'Stonehouse Recommendation',
      type: 'New',
      moc: 'No',
      budget: 88000000,
      consumed: 45011747,
      commitment: 42714379,
      available: 273874,
      priority: 'B',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '1',
      strategy: 'Provide date of Completion. CAPEX will lapse at this year end.',
      remarks: '',
      assigned: 'E&I'
    },
    {
      sr: 4,
      year: '2025',
      name: 'Extension of Wind Fencing at the South-East side of Coal Shed',
      wbs: 'FL-2025-0002-HSE-02',
      unit: 'Project',
      category: 'HSE',
      reason: 'Coal Dust Mitigation',
      type: 'New',
      moc: 'No',
      budget: 66000000,
      consumed: 34569109,
      commitment: 3263321,
      available: 28167570,
      priority: 'B',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '1',
      strategy: 'Provide date of Completion. CAPEX will lapse at this year end.',
      remarks: '',
      assigned: 'Project'
    },
    {
      sr: 4,
      year: '2025',
      name: 'Extension of Wind Fencing at the South-East side of Coal Shed',
      wbs: 'FL-2025-0002-HSE-02',
      unit: 'Maintenance',
      category: 'HSE',
      reason: 'Coal Dust Mitigation',
      type: 'New',
      moc: 'No',
      budget: 66000000,
      consumed: 34569109,
      commitment: 3263321,
      available: 28167570,
      priority: 'B',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '1',
      strategy: 'Provide date of Completion. CAPEX will lapse at this year end.',
      remarks: '',
      assigned: 'Maintenance'
    },
    {
      sr: 5,
      year: '2025',
      name: 'Plant Emergency Siren System',
      wbs: 'FL-2025-0002-HSE-03',
      unit: 'E&I',
      category: 'HSE',
      reason: 'Plant Safety Siren System',
      type: 'New',
      moc: 'No',
      budget: 40000000,
      consumed: 21816581,
      commitment: 474964,
      available: 17708455,
      priority: 'B',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '1',
      strategy: 'Provide date of Completion.',
      remarks: '',
      assigned: 'E&I'
    },
    {
      sr: 6,
      year: '2025',
      name: 'Fog Cannon for coal dust mitigation / pile management',
      wbs: 'FL-2025-0002-HSE-04',
      unit: 'HSE',
      category: 'HSE',
      reason: 'Dust Mitigation',
      type: 'New',
      moc: 'No',
      budget: 9930000,
      consumed: 7685583,
      commitment: 0,
      available: 2244417,
      priority: 'B',
      status: 'Close',
      serviceLife: '5 Years',
      quantity: '1',
      strategy: 'Completed',
      remarks: '',
      assigned: 'HSE'
    },
    {
      sr: 7,
      year: '2025',
      name: 'ATEX Vacuum Cleaner for coal handling',
      wbs: 'FL-2025-0002-HSE-05',
      unit: 'Maintenance',
      category: 'HSE',
      reason: 'Dust Cleanliness Safety',
      type: 'New',
      moc: 'No',
      budget: 5000000,
      consumed: 5980469,
      commitment: 0,
      available: -980469,
      priority: 'B',
      status: 'Close',
      serviceLife: '5 Years',
      quantity: '1',
      strategy: 'Completed but Budget Overrun',
      remarks: '',
      assigned: 'Maintenance'
    },
    {
      sr: 8,
      year: '2025',
      name: 'Boiler Tubes Thermal Spray Coating - 2025',
      wbs: 'FL-2025-0002-INS-01',
      unit: 'Inspection',
      category: 'Reliability & Sustenance',
      reason: 'Tube Erosion Mitigation',
      type: 'Replacement',
      moc: 'Yes',
      budget: 85291228,
      consumed: 51517300,
      commitment: 17263982,
      available: 16509946,
      priority: 'A',
      status: 'Close',
      serviceLife: '3 Years',
      quantity: '1 Lot',
      strategy: 'Completed - Commitments to be closed',
      remarks: '',
      assigned: 'Inspection'
    },
    {
      sr: 9,
      year: '2025',
      name: 'VFD Electrical and Instrumentation',
      wbs: 'FL-2025-0002-PRO-01',
      unit: 'E&I',
      category: 'Efficiency',
      reason: 'Speed Drive Efficiency',
      type: 'New',
      moc: 'Yes',
      budget: 152750000,
      consumed: 115301154,
      commitment: 16703957,
      available: 20744889,
      priority: 'A',
      status: 'Close',
      serviceLife: '7 Years',
      quantity: '1 System',
      strategy: 'Completed - Commitments to be closed',
      remarks: '',
      assigned: 'E&I'
    },
    {
      sr: 10,
      year: '2025',
      name: 'Capex-Coal Shed Rehabiltation MEC (PKR 562,300,000)',
      wbs: 'FL-2025-0003-MEC-01',
      unit: 'Maintenance',
      category: 'Reliability & Sustenance',
      reason: 'Shed Structure Refurbishment',
      type: 'Replacement',
      moc: 'Yes',
      budget: 562300000,
      consumed: 542990547,
      commitment: 3437132,
      available: 15872321,
      priority: 'A',
      status: 'Close',
      serviceLife: '10 Years',
      quantity: '1 Package',
      strategy: 'Completed - Commitments to be closed',
      remarks: '',
      assigned: 'Maintenance'
    },
    {
      sr: 11,
      year: '2026',
      name: 'Boiler Tubes Thermal Spray Coating Job 2026 (Approved Sept 2025 BOD)',
      wbs: 'FL-2026-0001-INS-01',
      unit: 'Inspection',
      category: 'Reliability & Sustenance',
      reason: 'Tube Erosion Mitigation',
      type: 'Replacement',
      moc: 'Yes',
      budget: 120000000,
      consumed: 66349314,
      commitment: 0,
      available: 53650686,
      priority: 'A',
      status: 'Close',
      serviceLife: '3 Years',
      quantity: '1 Lot',
      strategy: 'Completed - Commitments to be closed',
      remarks: '',
      assigned: 'Inspection'
    },
    {
      sr: 12,
      year: '2026',
      name: 'Solarization - FPCL Building area (250 KW – Initial Phase)',
      wbs: 'FL-2026-0001-ELE-1',
      unit: 'E&I',
      category: 'Efficiency',
      reason: 'Solar Energy Generation',
      type: 'New',
      moc: 'No',
      budget: 25000000,
      consumed: 0,
      commitment: 0,
      available: 25000000,
      priority: 'B',
      status: 'Open',
      serviceLife: '15 Years',
      quantity: '250 KW',
      strategy: 'Please update status.',
      remarks: '',
      assigned: 'E&I'
    },
    {
      sr: 12,
      year: '2026',
      name: 'Solarization - FPCL Building area (250 KW – Initial Phase)',
      wbs: 'FL-2026-0001-ELE-1',
      unit: 'SCM',
      category: 'Efficiency',
      reason: 'Solar Energy Generation',
      type: 'New',
      moc: 'No',
      budget: 25000000,
      consumed: 0,
      commitment: 0,
      available: 25000000,
      priority: 'B',
      status: 'Open',
      serviceLife: '15 Years',
      quantity: '250 KW',
      strategy: 'Please update status.',
      remarks: '',
      assigned: 'SCM'
    },
    {
      sr: 13,
      year: '2026',
      name: '10x Split ACs (2 Ton) & 10x Split ACs (1.5 Ton)',
      wbs: 'FL-2026-0001-ELE-02',
      unit: 'E&I',
      category: 'Others/Admin',
      reason: 'HVAC Asset Replacement',
      type: 'Replacement',
      moc: 'No',
      budget: 5880000,
      consumed: 2294875,
      commitment: 1271635,
      available: 2313490,
      priority: 'B',
      status: 'Close',
      serviceLife: '5 Years',
      quantity: '20 Units',
      strategy: 'Completed - Commitments to be closed',
      remarks: '',
      assigned: 'E&I'
    },
    {
      sr: 14,
      year: '2026',
      name: 'Low Value Assets (07x Laptops)',
      wbs: 'FL-2026-0001-TEC-01',
      unit: 'ICT',
      category: 'Others/Admin',
      reason: 'Laptops Upgrade',
      type: 'New',
      moc: 'No',
      budget: 2708000,
      consumed: 0,
      commitment: 3150000,
      available: -442000,
      priority: 'B',
      status: 'Open',
      serviceLife: '4 Years',
      quantity: '7 Laptops',
      strategy: 'ICT to please update.',
      remarks: '',
      assigned: 'ICT'
    },
    {
      sr: 15,
      year: '2026',
      name: 'Low Value Assets (16x Desktops)',
      wbs: 'FL-2026-0001-TEC-02',
      unit: 'ICT',
      category: 'Others/Admin',
      reason: 'Desktops Upgrade',
      type: 'New',
      moc: 'No',
      budget: 5600000,
      consumed: 0,
      commitment: 5600000,
      available: 0,
      priority: 'B',
      status: 'Open',
      serviceLife: '4 Years',
      quantity: '16 Desktops',
      strategy: 'ICT to please update.',
      remarks: '',
      assigned: 'ICT'
    },
    {
      sr: 16,
      year: '2026',
      name: 'Low Value Assets (05x Tablets)',
      wbs: 'FL-2026-0001-TEC-03',
      unit: 'ICT',
      category: 'Others/Admin',
      reason: 'Field Inspection Tablets',
      type: 'New',
      moc: 'No',
      budget: 325000,
      consumed: 0,
      commitment: 0,
      available: 325000,
      priority: 'B',
      status: 'Open',
      serviceLife: '3 Years',
      quantity: '5 Tablets',
      strategy: 'ICT to please update.',
      remarks: '',
      assigned: 'ICT'
    },
    {
      sr: 17,
      year: '2026',
      name: 'Cisco Network Switches- Cisco (FPCL Plant fault Replacement)',
      wbs: 'FL-2026-0001-TEC-04',
      unit: 'ICT',
      category: 'Others/Admin',
      reason: 'Network Switch Fault Replacement',
      type: 'Replacement',
      moc: 'No',
      budget: 3600000,
      consumed: 0,
      commitment: 0,
      available: 3600000,
      priority: 'B',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '1 Lot',
      strategy: 'ICT to please update.',
      remarks: '',
      assigned: 'ICT'
    },
    {
      sr: 18,
      year: '2026',
      name: 'Procurement of AutoCAD Licenses (04 EA, 02 years validity)',
      wbs: 'FL-2026-0001-TEC-05',
      unit: 'ICT',
      category: 'Others/Admin',
      reason: 'CAD Software License',
      type: 'New',
      moc: 'No',
      budget: 3500000,
      consumed: 0,
      commitment: 3489486,
      available: 10514,
      priority: 'B',
      status: 'Close',
      serviceLife: '2 Years',
      quantity: '4 Licenses',
      strategy: 'Completed - Commitments to be closed',
      remarks: '',
      assigned: 'ICT'
    },
    {
      sr: 19,
      year: '2026',
      name: 'Procurement of SolidWorks Licenses (02 EA, Perpetual)',
      wbs: 'FL-2026-0001-TEC-06',
      unit: 'ICT',
      category: 'Others/Admin',
      reason: 'Engineering 3D Software',
      type: 'New',
      moc: 'No',
      budget: 7500000,
      consumed: 6440000,
      commitment: 840000,
      available: 220000,
      priority: 'B',
      status: 'Close',
      serviceLife: '5 Years',
      quantity: '2 Licenses',
      strategy: 'Completed - Commitments to be closed',
      remarks: '',
      assigned: 'ICT'
    },
    {
      sr: 20,
      year: '2026',
      name: 'SAP Rise Project',
      wbs: 'FL-2026-0001-TEC-07',
      unit: 'ICT',
      category: 'Others/Admin',
      reason: 'SAP ERP Cloud Upgrade',
      type: 'New',
      moc: 'No',
      budget: 135000000,
      consumed: 6760530,
      commitment: 0,
      available: 128239470,
      priority: 'A',
      status: 'Open',
      serviceLife: '7 Years',
      quantity: '1 System',
      strategy: 'To be confirmed from Faisal habib',
      remarks: '',
      assigned: 'ICT'
    },
    {
      sr: 21,
      year: '2026',
      name: 'Fuel Dispencing Barcode Solutions',
      wbs: 'FL-2026-0001-TEC-08',
      unit: 'Project',
      category: 'Others/Admin',
      reason: 'Fuel Dispensing Automation',
      type: 'New',
      moc: 'No',
      budget: 2100000,
      consumed: 0,
      commitment: 2545738,
      available: -445738,
      priority: 'B',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '1 System',
      strategy: 'Please update status.',
      remarks: '',
      assigned: 'Project'
    },
    {
      sr: 22,
      year: '2026',
      name: '(01x Laptops) for Anees Afzal',
      wbs: 'FL-2026-0001-TEC-09',
      unit: 'ICT',
      category: 'Others/Admin',
      reason: 'Engineer Workstation',
      type: 'New',
      moc: 'No',
      budget: 442000,
      consumed: 0,
      commitment: 442000,
      available: 0,
      priority: 'B',
      status: 'Close',
      serviceLife: '4 Years',
      quantity: '1 Laptop',
      strategy: 'Completed - Commitments to be closed',
      remarks: '',
      assigned: 'ICT'
    },
    {
      sr: 23,
      year: '2026',
      name: 'Security Cameras for Warehouse Yard and FPCL Entry Gate',
      wbs: 'FL-2026-0001-ADM-01',
      unit: 'Admin',
      category: 'Others/Admin',
      reason: 'Perimeter Security CCTV',
      type: 'New',
      moc: 'No',
      budget: 11000000,
      consumed: 0,
      commitment: 0,
      available: 11000000,
      priority: 'B',
      status: 'Open',
      serviceLife: '5 Years',
      quantity: '1 Package',
      strategy: 'Please update status.',
      remarks: '',
      assigned: 'Admin'
    }
  ];

  // Combine baseline projects
  const ALL_INITIAL_PROJECTS = [...MULTI_YEAR_LIVE_SEED, ...BASELINE_2027_PROJECTS];

  ALL_INITIAL_PROJECTS.forEach(p => {
    if (p.consumed === undefined) {
      if ((p.status || '').toLowerCase().includes('close')) {
        p.consumed = p.budget;
        p.commitment = 0;
        p.available = 0;
      } else {
        p.consumed = Math.round(p.budget * 0.35);
        p.commitment = Math.round(p.budget * 0.15);
        p.available = Math.max(0, p.budget - p.consumed - p.commitment);
      }
    }
  });

  const capexSuite = {
    state: {
      searchQuery: '',
      yearFilter: '', // Dynamically sets to latest year from Column B
      statusFilter: 'all',
      categoryFilter: 'all',
      unitFilter: 'all',
      typeFilter: 'all',
      priorityFilter: 'all',
      classFilter: 'all', // 'all' | 'major' | 'minor'
      page: 1,
      pageSize: 15, // 15 | 25 | 50 | 'all'
      sortColumn: 'sr',
      sortDirection: 'asc',
      selectedProject: null, // For drawer view
      currencyFormat: 'M', // 'M' or 'full'
      isSyncing: false,
      lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hoveredCategory: null,
      customSheetUrl: (function() { try { return localStorage.getItem('FPCL_CAPEX_CUSTOM_URL') || ''; } catch(e) { return ''; } })(),
      sheetConnected: false
    },

    init() {
      window.FPCL_CAPEX_SUITE = this;

      // Load cache if present
      try {
        const cached = localStorage.getItem('FPCL_CAPEX_DATA_CACHE');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.FPCL_CAPEX_DATA = parsed;
          }
        }
      } catch (e) {}

      if (!window.FPCL_CAPEX_DATA || window.FPCL_CAPEX_DATA.length === 0) {
        window.FPCL_CAPEX_DATA = JSON.parse(JSON.stringify(ALL_INITIAL_PROJECTS));
      }

      // Default year filter should open up with latest year from Column B
      const initialYears = [...new Set(this.getRawData().map(p => String(p.year || '').trim()).filter(Boolean))].sort((a, b) => b.localeCompare(a));
      if (initialYears.length > 0 && !this.state.yearFilter) {
        this.state.yearFilter = initialYears[0];
      }

      // Initial live sync after slight delay
      setTimeout(() => {
        this.syncLiveFeed({ silent: true });
      }, 600);

      // Periodic auto-sync every 60s
      if (!this._syncTimer) {
        this._syncTimer = setInterval(() => {
          this.syncLiveFeed({ silent: true });
        }, 60000);
      }
    },

    getRawData() {
      if (Array.isArray(window.FPCL_CAPEX_DATA) && window.FPCL_CAPEX_DATA.length > 0) {
        return window.FPCL_CAPEX_DATA;
      }
      return ALL_INITIAL_PROJECTS;
    },

    getFilteredData() {
      const raw = this.getRawData();
      const s = this.state;
      const q = s.searchQuery.toLowerCase().trim();

      return raw.filter(item => {
        // Year filter
        if (s.yearFilter !== 'all') {
          if (String(item.year || '').trim() !== String(s.yearFilter).trim()) {
            return false;
          }
        }

        // Status filter (Open / Close)
        if (s.statusFilter !== 'all') {
          const isClosed = (item.status || '').toLowerCase().includes('close');
          if (s.statusFilter === 'open' && isClosed) return false;
          if (s.statusFilter === 'close' && !isClosed) return false;
        }

        // Category filter
        if (s.categoryFilter !== 'all') {
          if ((item.category || '').toLowerCase() !== s.categoryFilter.toLowerCase()) {
            return false;
          }
        }

        // Unit filter
        if (s.unitFilter !== 'all') {
          if ((item.unit || '').toLowerCase() !== s.unitFilter.toLowerCase()) {
            return false;
          }
        }

        // Type filter (Replacement vs New)
        if (s.typeFilter !== 'all') {
          if ((item.type || '').toLowerCase() !== s.typeFilter.toLowerCase()) {
            return false;
          }
        }

        // Priority filter
        if (s.priorityFilter !== 'all') {
          if ((item.priority || '').toLowerCase() !== s.priorityFilter.toLowerCase()) {
            return false;
          }
        }

        // Class filter (Major >4.5M vs Minor <=4.5M)
        if (s.classFilter === 'major' && (item.budget || 0) <= 4500000) return false;
        if (s.classFilter === 'minor' && (item.budget || 0) > 4500000) return false;

        // Search Query across all textual columns
        if (q) {
          const matchName = (item.name || '').toLowerCase().includes(q);
          const matchWbs = (item.wbs || '').toLowerCase().includes(q);
          const matchUnit = (item.unit || '').toLowerCase().includes(q);
          const matchCat = (item.category || '').toLowerCase().includes(q);
          const matchReason = (item.reason || '').toLowerCase().includes(q);
          const matchType = (item.type || '').toLowerCase().includes(q);
          const matchRemarks = (item.remarks || '').toLowerCase().includes(q);
          const matchStrategy = (item.strategy || '').toLowerCase().includes(q);
          const matchYear = String(item.year || '').toLowerCase().includes(q);

          if (!matchName && !matchWbs && !matchUnit && !matchCat && !matchReason && !matchType && !matchRemarks && !matchStrategy && !matchYear) {
            return false;
          }
        }

        return true;
      });
    },

    getSortedData(dataset) {
      const data = [...(dataset || this.getFilteredData())];
      const { sortColumn, sortDirection } = this.state;
      const factor = sortDirection === 'asc' ? 1 : -1;

      return data.sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];

        if (['budget', 'consumed', 'commitment', 'available', 'sr'].includes(sortColumn)) {
          return ((Number(valA) || 0) - (Number(valB) || 0)) * factor;
        }

        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
        if (valA < valB) return -1 * factor;
        if (valA > valB) return 1 * factor;
        return 0;
      });
    },

    /**
     * Deduplicate projects by Serial Number (Column A) and Year so costs are counted ONLY ONCE
     */
    getUniqueProjects(dataset) {
      const list = dataset || this.getFilteredData();
      const seen = new Set();
      const unique = [];
      for (const p of list) {
        const srVal = p.sr !== undefined && p.sr !== null && String(p.sr).trim() !== '' ? String(p.sr).trim() : '';
        const yrVal = String(p.year || '').trim();
        const key = srVal ? `sr_${srVal}_${yrVal}` : `name_${String(p.name || '').trim().toLowerCase()}_${yrVal}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(p);
        }
      }
      return unique;
    },

    /**
     * Compute aggregated portfolio KPIs with deduplication
     */
    getKPIs(dataset) {
      const uniqueProjects = this.getUniqueProjects(dataset || this.getFilteredData());
      const totalProjects = uniqueProjects.length;

      let totalBudget = 0;
      let totalConsumed = 0;
      let totalCommitment = 0;
      let totalAvailable = 0;

      let majorBudget = 0;
      let majorCount = 0;
      let minorBudget = 0;
      let minorCount = 0;

      let replacementBudget = 0;
      let replacementCount = 0;
      let newBudget = 0;
      let newCount = 0;

      let majorReplacementBudget = 0;
      let majorReplacementCount = 0;
      let majorNewBudget = 0;
      let majorNewCount = 0;

      let minorReplacementBudget = 0;
      let minorReplacementCount = 0;
      let minorNewBudget = 0;
      let minorNewCount = 0;

      let mocCount = 0;
      let mocReplacementCount = 0;
      let mocNewCount = 0;

      const categories = {};

      uniqueProjects.forEach(item => {
        const b = Number(item.budget) || 0;
        totalBudget += b;
        totalConsumed += Number(item.consumed) || 0;
        totalCommitment += Number(item.commitment) || 0;
        totalAvailable += Number(item.available) || 0;

        // Cost from Column D: projects > 4.5M vs <= 4.5M
        const isMajor = b > 4500000;
        if (isMajor) {
          majorBudget += b;
          majorCount++;
        } else {
          minorBudget += b;
          minorCount++;
        }

        // Replacement or New from Column N
        const typeStr = String(item.type || '').toLowerCase();
        const isNew = typeStr.includes('new');
        if (isNew) {
          newBudget += b;
          newCount++;
          if (isMajor) {
            majorNewBudget += b;
            majorNewCount++;
          } else {
            minorNewBudget += b;
            minorNewCount++;
          }
        } else {
          replacementBudget += b;
          replacementCount++;
          if (isMajor) {
            majorReplacementBudget += b;
            majorReplacementCount++;
          } else {
            minorReplacementBudget += b;
            minorReplacementCount++;
          }
        }

        // MOC required or not from Column L
        const isMoc = String(item.moc || '').toLowerCase().includes('yes') || String(item.moc || '').toLowerCase() === 'y' || String(item.moc || '').toLowerCase().includes('req');
        if (isMoc) {
          mocCount++;
          if (isNew) mocNewCount++;
          else mocReplacementCount++;
        }

        // Category from Column O
        const cat = String(item.category || 'Others/Admin').trim() || 'Others/Admin';
        categories[cat] = (categories[cat] || 0) + b;
      });

      const majorTotal = majorBudget;
      const majorRepPct = majorTotal > 0 ? ((majorReplacementBudget / majorTotal) * 100).toFixed(1) : '0.0';
      const majorNewPct = majorTotal > 0 ? ((majorNewBudget / majorTotal) * 100).toFixed(1) : '0.0';

      const minorTotal = minorBudget;
      const minorRepPct = minorTotal > 0 ? ((minorReplacementBudget / minorTotal) * 100).toFixed(1) : '0.0';
      const minorNewPct = minorTotal > 0 ? ((minorNewBudget / minorTotal) * 100).toFixed(1) : '0.0';

      const replacementSharePct = totalBudget > 0 ? ((replacementBudget / totalBudget) * 100).toFixed(1) : '0.0';
      const newSharePct = totalBudget > 0 ? ((newBudget / totalBudget) * 100).toFixed(1) : '0.0';
      const majorSharePct = totalBudget > 0 ? ((majorBudget / totalBudget) * 100).toFixed(1) : '0.0';

      return {
        totalProjects,
        totalBudget,
        totalBudgetMillions: (totalBudget / 1000000).toFixed(1),
        totalConsumed,
        totalCommitment,
        totalAvailable,
        majorBudget,
        majorBudgetMillions: (majorBudget / 1000000).toFixed(1),
        majorCount,
        majorSharePct,
        minorBudget,
        minorBudgetMillions: (minorBudget / 1000000).toFixed(1),
        minorCount,
        replacementBudget,
        replacementBudgetMillions: (replacementBudget / 1000000).toFixed(1),
        replacementCount,
        replacementSharePct,
        newBudget,
        newBudgetMillions: (newBudget / 1000000).toFixed(1),
        newCount,
        newSharePct,
        mocCount,
        mocReplacementCount,
        mocNewCount,
        majorReplacementBudget,
        majorReplacementCount,
        majorNewBudget,
        majorNewCount,
        majorRepPct,
        majorNewPct,
        minorReplacementBudget,
        minorReplacementCount,
        minorNewBudget,
        minorNewCount,
        minorRepPct,
        minorNewPct,
        categories
      };
    },

    formatCurrency(val, compact = false) {
      const num = Number(val) || 0;
      if (compact || this.state.currencyFormat === 'M') {
        const millions = num / 1000000;
        return millions >= 1 ? `${millions.toFixed(1)} M` : `${(num / 1000).toFixed(0)} K`;
      }
      return `PKR ${num.toLocaleString('en-US')}`;
    },

    parseCsv(csvText) {
      if (!csvText || typeof csvText !== 'string') return [];

      // Robust CSV character parser supporting quoted newlines and escaped quotes
      const records = [];
      let currentRecord = [];
      let currentField = '';
      let inQuotes = false;
      for (let i = 0; i < csvText.length; i++) {
        const c = csvText[i];
        if (c === '"') {
          if (inQuotes && csvText[i + 1] === '"') {
            currentField += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          currentRecord.push(currentField.trim());
          currentField = '';
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
          if (c === '\r' && csvText[i + 1] === '\n') i++;
          currentRecord.push(currentField.trim());
          currentField = '';
          if (currentRecord.length > 1 || (currentRecord[0] && currentRecord[0] !== '')) {
            records.push(currentRecord);
          }
          currentRecord = [];
        } else {
          currentField += c;
        }
      }
      if (currentField.length > 0 || currentRecord.length > 0) {
        currentRecord.push(currentField.trim());
        records.push(currentRecord);
      }

      if (records.length < 2) return [];

      const headers = records[0];
      const colMap = {};
      headers.forEach((h, idx) => {
        const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        colMap[clean] = idx;
      });

      const parsedItems = [];
      for (let r = 1; r < records.length; r++) {
        const row = records[r];
        if (!row || row.length < 3) continue;

        // Helper: retrieve field by exact 0-indexed column letter priority first, then header aliases
        const getField = (colIdx, headerAliases, fallback = '') => {
          if (colIdx !== undefined && row[colIdx] !== undefined && String(row[colIdx]).trim() !== '') {
            return String(row[colIdx]).trim();
          }
          if (Array.isArray(headerAliases)) {
            for (const h of headerAliases) {
              const idx = colMap[h.toLowerCase().replace(/[^a-z0-9]/g, '')];
              if (idx !== undefined && row[idx] !== undefined && String(row[idx]).trim() !== '') {
                return String(row[idx]).trim();
              }
            }
          }
          return fallback;
        };

        const parseNum = (val) => {
          if (!val) return 0;
          const clean = String(val).replace(/,/g, '').replace(/[^\d.-]/g, '');
          return parseFloat(clean) || 0;
        };

        // Col A (idx 0): Sr#
        const srRaw = getField(0, ['sr', 'sr#', 'sno', 'id'], String(parsedItems.length + 1));
        const sr = parseInt(srRaw) || (parsedItems.length + 1);

        // Col B (idx 1): Year - Take Year from column B
        const year = getField(1, ['year', 'yr'], '2027');

        // Col C (idx 2): Projects (Project Name)
        const projectName = getField(2, ['projects', 'project', 'projectname', 'initiative', 'item'], '');
        if (!projectName) continue;

        // Col D (idx 3): Cost (Budget) - Take Cost from column D for projects less than or more than 4.5 million
        const costRaw = getField(3, ['budget', 'cost', 'capex', 'capexpkr', 'sanctioned', 'approved'], '0');
        const budget = parseNum(costRaw);

        // Col E (idx 4): Consumed (PKR)
        const consumed = parseNum(getField(4, ['consumed', 'consumedpkr', 'actual', 'spent'], '0'));

        // Col F (idx 5): Commitment (PKR)
        const commitment = parseNum(getField(5, ['commitment', 'committed', 'comm'], '0'));

        // Col G (idx 6): Available (PKR)
        let available = parseNum(getField(6, ['available', 'balance', 'remaining'], ''));
        if (!available && budget > 0 && (consumed > 0 || commitment > 0)) {
          available = Math.max(0, budget - consumed - commitment);
        }

        // Col H (idx 7): WBS Elements
        const wbs = getField(7, ['wbselements', 'wbs', 'wbselement'], `FL-${year}-${String(parsedItems.length + 1).padStart(4, '0')}`);

        // Col I (idx 8): unit/responsible unit - unit/responsible unit from column I
        const unit = getField(8, ['responsibleunit', 'unit', 'department', 'respunit'], 'Maintenance');

        // Col J (idx 9): Reason
        const reason = getField(9, ['reason', 'justification'], 'Plant Reliability Sustenance');

        // Col K (idx 10): Service life
        const serviceLife = getField(10, ['servicelife', 'life'], '5 Years');

        // Col L (idx 11): MOC required or not - MOC required or not from column L
        const rawMoc = getField(11, ['mocrequired', 'moc', 'moc_required'], 'No');
        const moc = (rawMoc.toLowerCase().includes('yes') || rawMoc.toLowerCase() === 'y' || rawMoc.toLowerCase().includes('req')) ? 'Yes' : 'No';

        // Col M (idx 12): Priority
        const priorityRaw = getField(12, ['priority', 'prio'], 'B');
        const priority = ['A', 'B', 'C'].includes(priorityRaw.toUpperCase().charAt(0)) ? priorityRaw.toUpperCase().charAt(0) : 'B';

        // Col N (idx 13): replacement or new projects - Take replacement or noew projects from column N
        const rawType = getField(13, ['replacementnew', 'replacement_new', 'type', 'nature'], '').trim();
        let type = 'Replacement';
        if (rawType.toLowerCase().includes('new')) {
          type = 'New';
        } else if (rawType.toLowerCase().includes('rep')) {
          type = 'Replacement';
        } else if (rawType) {
          type = rawType;
        } else {
          type = projectName.toLowerCase().includes('new') ? 'New' : 'Replacement';
        }

        // Col O (idx 14): category - Take category from column O
        let category = getField(14, ['category', 'cat', 'classification'], '').trim();
        if (!category) {
          category = budget > 40000000 ? 'Reliability & Sustenance' : 'Others/Admin';
        }

        // Col P (idx 15): Quantity - Quantity from column P
        const quantity = getField(15, ['quantity', 'qty'], '1 Lot');

        // Col Q (idx 16): Actions Assigned / Strategy
        const strategy = getField(16, ['actionsassigned', 'strategy', 'execution'], '');

        // Col R (idx 17): open close status - open close status from column R
        const rawStatus = getField(17, ['statusopenclose', 'status', 'status_open_close'], 'Open');
        const status = (rawStatus.toLowerCase().includes('close') || rawStatus.toLowerCase().includes('comp')) ? 'Close' : 'Open';

        // Col S (idx 18): End User Remarks / Current status
        const remarks = getField(18, ['enduserremarkscurrentstatus', 'remarks', 'statusremarks'], '');

        parsedItems.push({
          sr,
          year: String(year).trim(),
          name: projectName,
          budget,
          consumed,
          commitment,
          available,
          wbs,
          unit,
          reason,
          serviceLife,
          moc,
          priority,
          type,
          category,
          quantity,
          strategy,
          status,
          remarks,
          assigned: unit
        });
      }

      return parsedItems;
    },

    async syncLiveFeed(options = {}) {
      const silent = options.silent || false;
      this.state.isSyncing = true;
      this.renderSyncState(true);

      try {
        let csvText = '';

        // Attempt 0: Custom user-provided Sheet URL / Published CSV link
        if (this.state.customSheetUrl) {
          try {
            let customUrl = this.state.customSheetUrl.trim();
            if (customUrl.includes('/spreadsheets/d/') && !customUrl.includes('output=csv') && !customUrl.includes('gviz/tq')) {
              const m = customUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
              if (m) {
                customUrl = `https://docs.google.com/spreadsheets/d/${m[1]}/gviz/tq?tqx=out:csv&sheet=${CAPEX_SHEET_TAB}`;
              }
            }
            const res = await fetch(customUrl, { cache: 'no-store' });
            if (res.ok) {
              const t = await res.text();
              if (t && t.includes(',')) csvText = t;
            }
          } catch (e) {}
        }

        // Attempt 1: Server proxy
        if (!csvText) {
          try {
            const resp = await fetch(`/api/sheets/fetch?sheetTab=${CAPEX_SHEET_TAB}&tileId=capex`, {
              cache: 'no-store',
              headers: { 'Cache-Control': 'no-cache, no-store' }
            });
            if (resp.ok) {
              const data = await resp.json();
              if (data && data.success && data.csvText) {
                csvText = data.csvText;
              }
            }
          } catch (e) {}
        }

        // Attempt 2: Direct Google Sheet Sync Helper
        if (!csvText && typeof window.fetchGoogleSheetData === 'function') {
          try {
            csvText = await window.fetchGoogleSheetData(CAPEX_SHEET_URL, { sheetTab: CAPEX_SHEET_TAB });
          } catch (e) {}
        }

        // Attempt 3: Direct fetch with timestamp cache-buster
        if (!csvText) {
          const directUrl = `${CAPEX_SHEET_URL}&_nocache=${Date.now()}`;
          const res = await fetch(directUrl, { cache: 'no-store' });
          if (res.ok) {
            const text = await res.text();
            if (text && !text.includes('<!DOCTYPE html>') && text.includes(',')) {
              csvText = text;
            }
          }
        }

        if (csvText) {
          const parsed = this.parseCsv(csvText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.state.sheetConnected = true;

            // Live parsed rows take highest precedence
            const merged = [...parsed];
            const parsedKeys = new Set(parsed.map(p => `${(p.name || '').toLowerCase().trim()}_${String(p.year || '').trim()}`));
            ALL_INITIAL_PROJECTS.forEach(p => {
              const key = `${(p.name || '').toLowerCase().trim()}_${String(p.year || '').trim()}`;
              if (!parsedKeys.has(key)) {
                merged.push(p);
              }
            });

            window.FPCL_CAPEX_DATA = merged;
            try {
              localStorage.setItem('FPCL_CAPEX_DATA_CACHE', JSON.stringify(merged));
            } catch (e) {}

            // Update default year filter if not chosen
            const updatedYears = [...new Set(merged.map(p => String(p.year || '').trim()).filter(Boolean))].sort((a, b) => b.localeCompare(a));
            if (updatedYears.length > 0 && !this.state.yearFilter) {
              this.state.yearFilter = updatedYears[0];
            }

            this.state.lastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (!silent && window.portalApp && typeof window.portalApp.showToast === 'function') {
              window.portalApp.showToast(`CAPEX feed synchronized live with Google Sheet (${merged.length} projects).`, 'success');
            }
          }
        }
      } catch (err) {
        console.error('CAPEX live sync error:', err);
        if (!silent && window.portalApp && typeof window.portalApp.showToast === 'function') {
          window.portalApp.showToast('Could not sync live sheet: ' + (err.message || 'Network error'), 'error');
        }
      } finally {
        this.state.isSyncing = false;
        this.renderSyncState(false);
        this.render();
      }
    },

    renderSyncState(isSyncing) {
      const btn = document.getElementById('btn-capex-sync-feed');
      if (btn) {
        if (isSyncing) {
          btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Syncing...</span>`;
          btn.classList.add('opacity-75', 'cursor-wait');
        } else {
          btn.innerHTML = `<i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i><span>Sync Feed</span>`;
          btn.classList.remove('opacity-75', 'cursor-wait');
        }
        if (window.lucide) window.lucide.createIcons();
      }
    },

    exportCsv() {
      const dataset = this.getSortedData();
      if (!dataset || dataset.length === 0) {
        if (window.portalApp) window.portalApp.showToast('No project data to export.', 'info');
        return;
      }

      const headers = ['Sr#', 'Year', 'Project Name', 'WBS Element', 'Responsible Unit', 'Category', 'Reason / Justification', 'Type', 'MOC Required', 'CAPEX Budget (PKR)', 'Priority', 'Status', 'Strategy Notes', 'Remarks'];
      const rows = dataset.map(p => [
        p.sr,
        `"${p.year}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${p.wbs}"`,
        `"${p.unit}"`,
        `"${p.category}"`,
        `"${(p.reason || '').replace(/"/g, '""')}"`,
        `"${p.type}"`,
        `"${p.moc}"`,
        p.budget,
        `"${p.priority}"`,
        `"${p.status}"`,
        `"${(p.strategy || '').replace(/"/g, '""')}"`,
        `"${(p.remarks || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `FPCL_Plant_CapEx_Portfolio_2027_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (window.portalApp) {
        window.portalApp.showToast(`Exported ${dataset.length} projects to CSV.`, 'success');
      }
    },

    setCategoryFilter(cat) {
      if (this.state.categoryFilter === cat) {
        this.state.categoryFilter = 'all';
      } else {
        this.state.categoryFilter = cat;
      }
      this.state.page = 1;
      this.render();
      const tbl = document.getElementById('capex-master-table-section');
      if (tbl) tbl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    setClassFilter(cls, type) {
      this.state.classFilter = cls;
      if (type) this.state.typeFilter = type;
      this.state.page = 1;
      this.render();
      const tbl = document.getElementById('capex-master-table-section');
      if (tbl) tbl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    resetFilters() {
      this.state.searchQuery = '';
      this.state.yearFilter = 'all';
      this.state.statusFilter = 'all';
      this.state.categoryFilter = 'all';
      this.state.unitFilter = 'all';
      this.state.typeFilter = 'all';
      this.state.priorityFilter = 'all';
      this.state.classFilter = 'all';
      this.state.page = 1;
      this.render();
    },

    handleSort(col) {
      if (this.state.sortColumn === col) {
        this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.state.sortColumn = col;
        this.state.sortDirection = 'desc';
      }
      this.render();
    },

    openDrawer(project) {
      this.state.selectedProject = project;
      this.renderDrawer();
    },

    openDrawerByIndex(idx) {
      const sorted = this.getSortedData(this.getFilteredData());
      const item = sorted[idx];
      if (item) {
        this.openDrawer(item);
      }
    },

    closeDrawer() {
      this.state.selectedProject = null;
      const drawer = document.getElementById('capex-side-drawer-container');
      if (drawer) drawer.innerHTML = '';
    },

    renderDrawer() {
      const container = document.getElementById('capex-side-drawer-container');
      const p = this.state.selectedProject;
      if (!container || !p) return;

      const isMoc = (p.moc || '').toLowerCase() === 'yes';
      const isClosed = (p.status || '').toLowerCase().includes('close');
      const isMajor = (p.budget || 0) > 4500000;

      container.innerHTML = `
        <div class="fixed inset-0 z-50 overflow-hidden bg-[#0B1D3A]/60 backdrop-blur-xs transition-opacity duration-200 flex justify-end" onclick="window.FPCL_CAPEX_SUITE.closeDrawer()">
          <div class="relative w-full max-w-xl bg-white border-l border-[#E2E6EE] shadow-2xl h-full flex flex-col overflow-y-auto transform transition-transform duration-200" onclick="event.stopPropagation()">
            
            <!-- Drawer Header (Deep Navy with Gold Accent Hairline) -->
            <div class="p-6 bg-[#0B1D3A] border-b-2 border-b-[#D4AF37] text-white relative">
              <button onclick="window.FPCL_CAPEX_SUITE.closeDrawer()" class="absolute top-5 right-5 text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer" title="Close Panel">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
              <div class="flex items-center gap-2 mb-2.5 flex-wrap">
                <span class="px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase bg-transparent text-[#D4AF37] border border-[#D4AF37]/50">
                  ${p.wbs}
                </span>
                <span class="px-2 py-0.5 rounded-sm text-[10px] font-bold ${p.priority === 'A' ? 'bg-[#C0392B]/20 text-[#FF8E85] border border-[#C0392B]/50' : p.priority === 'B' ? 'bg-[#2E5EAA]/25 text-[#91B8F5] border border-[#2E5EAA]/40' : 'bg-[#7A8699]/25 text-[#CBD2DE] border border-[#7A8699]/40'}">
                  Priority ${p.priority}
                </span>
                <span class="px-2 py-0.5 rounded-sm text-[10px] font-bold ${isClosed ? 'bg-[#1F9E7C]/20 text-[#7DE3C5] border border-[#1F9E7C]/40' : 'bg-[#E8B84B]/20 text-[#FCE19B] border border-[#E8B84B]/40'}">
                  ${isClosed ? 'Completed' : 'Open / In-Progress'}
                </span>
              </div>
              <h3 class="text-lg sm:text-xl font-bold text-white leading-snug tracking-tight">
                ${p.name}
              </h3>
              <p class="text-xs text-slate-300 mt-1.5 flex items-center gap-1.5">
                <i data-lucide="building" class="w-3.5 h-3.5 text-[#D4AF37]"></i>
                Responsible Unit: <strong class="text-white font-medium">${p.unit}</strong>
              </p>
            </div>

            <!-- Drawer Body -->
            <div class="p-6 space-y-5 flex-1 text-[#1A1F2B] bg-[#F7F8FA]">

              <!-- Financial Metric Highlight Card -->
              <div class="p-4 rounded-md bg-white border border-[#E2E6EE] shadow-[0_1px_3px_rgba(11,29,58,0.04)] grid grid-cols-2 gap-4">
                <div>
                  <div class="text-[10px] uppercase font-bold text-[#7A8699] tracking-wider">CAPEX Sanctioned</div>
                  <div class="text-2xl font-bold font-mono text-[#0B1D3A] mt-0.5 tracking-tight">
                    PKR ${(p.budget / 1000000).toFixed(1)} M
                  </div>
                  <div class="text-[11px] font-mono text-[#7A8699] mt-0.5">
                    Rs. ${p.budget.toLocaleString('en-US')}
                  </div>
                </div>
                <div>
                  <div class="text-[10px] uppercase font-bold text-[#7A8699] tracking-wider">Portfolio Classification</div>
                  <div class="mt-1 flex flex-wrap gap-1.5">
                    <span class="px-2 py-0.5 rounded-sm text-[11px] font-bold ${isMajor ? 'bg-[#2E5EAA]/10 text-[#2E5EAA] border border-[#2E5EAA]/30' : 'bg-[#7A8699]/10 text-[#7A8699] border border-[#7A8699]/30'}">
                      ${isMajor ? 'Major (>4.5M)' : 'Minor (<4.5M)'}
                    </span>
                    <span class="px-2 py-0.5 rounded-sm text-[11px] font-bold ${p.type === 'Replacement' ? 'bg-[#2E5EAA]/10 text-[#2E5EAA] border border-[#2E5EAA]/30' : 'bg-[#D9782D]/10 text-[#D9782D] border border-[#D9782D]/30'}">
                      ${p.type}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Scope & Technical Justification -->
              <div class="space-y-1.5">
                <h4 class="text-[11px] font-bold uppercase tracking-wider text-[#7A8699] flex items-center gap-1.5">
                  <i data-lucide="file-text" class="w-3.5 h-3.5 text-[#0B1D3A]"></i>
                  Technical Justification & Operational Reason
                </h4>
                <div class="p-3.5 rounded-md bg-white border border-[#E2E6EE] text-xs text-[#1A1F2B] leading-relaxed shadow-[0_1px_2px_rgba(11,29,58,0.03)] font-medium">
                  ${p.reason}
                </div>
              </div>

              <!-- Strategy & Governance Notes -->
              <div class="space-y-1.5">
                <h4 class="text-[11px] font-bold uppercase tracking-wider text-[#7A8699] flex items-center gap-1.5">
                  <i data-lucide="compass" class="w-3.5 h-3.5 text-[#0B1D3A]"></i>
                  Execution Strategy & Board Milestones
                </h4>
                <div class="p-3.5 rounded-md bg-white border border-[#E2E6EE] text-xs text-[#1A1F2B] leading-relaxed shadow-[0_1px_2px_rgba(11,29,58,0.03)] font-medium">
                  ${p.strategy || 'Executing per approved 2027 capital expenditure program and corporate governance oversight.'}
                </div>
              </div>

              <!-- Process Safety & MOC Status (Crimson for mandatory compliance, slate for neutral) -->
              <div class="p-4 rounded-md border ${isMoc ? 'bg-[#C0392B]/5 border-[#C0392B]/30' : 'bg-white border-[#E2E6EE]'} flex items-start gap-3 shadow-[0_1px_2px_rgba(11,29,58,0.03)]">
                <div class="w-8 h-8 rounded-sm ${isMoc ? 'bg-[#C0392B] text-white' : 'bg-[#7A8699]/15 text-[#7A8699]'} flex items-center justify-center shrink-0">
                  <i data-lucide="${isMoc ? 'shield-alert' : 'shield'}" class="w-4 h-4"></i>
                </div>
                <div>
                  <div class="text-xs font-bold ${isMoc ? 'text-[#C0392B]' : 'text-[#1A1F2B]'}">
                    Management of Change (MOC): <strong>${isMoc ? 'Mandatory Statutory Compliance' : 'Not Required'}</strong>
                  </div>
                  <div class="text-[11px] text-[#7A8699] mt-0.5">
                    ${isMoc ? 'Requires Process Safety Management (PSM) sign-off, Process Hazard Analysis (PHA), and Pre-Startup Safety Review (PSSR).' : 'Standard routine asset maintenance without facility process envelope modification.'}
                  </div>
                </div>
              </div>

              <!-- Project Metadata Grid -->
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="p-3 rounded-md bg-white border border-[#E2E6EE] shadow-[0_1px_2px_rgba(11,29,58,0.03)]">
                  <span class="text-[#7A8699] block text-[10px] uppercase font-bold tracking-wider">Strategic Category</span>
                  <span class="font-bold text-[#1A1F2B] mt-1 block">${p.category}</span>
                </div>
                <div class="p-3 rounded-md bg-white border border-[#E2E6EE] shadow-[0_1px_2px_rgba(11,29,58,0.03)]">
                  <span class="text-[#7A8699] block text-[10px] uppercase font-bold tracking-wider">Expected Service Life</span>
                  <span class="font-bold text-[#1A1F2B] mt-1 block">${p.serviceLife || '5 Years'}</span>
                </div>
                <div class="p-3 rounded-md bg-white border border-[#E2E6EE] shadow-[0_1px_2px_rgba(11,29,58,0.03)]">
                  <span class="text-[#7A8699] block text-[10px] uppercase font-bold tracking-wider">Quantity / Scope</span>
                  <span class="font-bold text-[#1A1F2B] mt-1 block">${p.quantity || '1 Lot'}</span>
                </div>
                <div class="p-3 rounded-md bg-white border border-[#E2E6EE] shadow-[0_1px_2px_rgba(11,29,58,0.03)]">
                  <span class="text-[#7A8699] block text-[10px] uppercase font-bold tracking-wider">Responsible Lead</span>
                  <span class="font-bold text-[#1A1F2B] mt-1 block">${p.assigned || p.unit}</span>
                </div>
              </div>

              ${p.remarks ? `
              <div class="p-3 rounded-md bg-white border border-[#E2E6EE] text-xs text-[#1A1F2B] shadow-[0_1px_2px_rgba(11,29,58,0.03)]">
                <span class="text-[#7A8699] font-bold block text-[10px] uppercase tracking-wider mb-1">Status Remarks & End-User Notes</span>
                ${p.remarks}
              </div>
              ` : ''}

            </div>

            <!-- Drawer Footer -->
            <div class="p-4 bg-white border-t border-[#E2E6EE] flex items-center justify-between">
              <span class="text-[11px] font-mono text-[#7A8699]">Google Sheet: CAPEX Tab</span>
              <button onclick="window.FPCL_CAPEX_SUITE.closeDrawer()" class="px-5 py-2 bg-[#D4AF37] hover:bg-[#C59F2D] text-[#0B1D3A] text-xs font-bold rounded-md transition-colors cursor-pointer shadow-xs">
                Close Panel
              </button>
            </div>

          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    },

    render() {
      const container = document.getElementById('capex-specialized-container');
      if (!container) return;

      const s = this.state;
      const allProjects = this.getRawData();

      // Extract unique Years from Column B, sorted descending
      const rawYears = [...new Set(allProjects.map(p => String(p.year || '').trim()).filter(Boolean))].sort((a, b) => b.localeCompare(a));
      const years = rawYears.length > 0 ? rawYears : ['2027', '2026', '2025', '2024'];
      const latestYear = years[0];

      // Default year filter should open up with latest year from column B
      if (!s.yearFilter) {
        s.yearFilter = latestYear;
      }

      // Filter applies to complete dashboard including Master Table and KPI card values
      const filteredData = this.getFilteredData();
      const kpis = this.getKPIs(filteredData);
      const sortedData = this.getSortedData(filteredData);

      // Extract unique Units and Categories from Column I and Column O for filter dropdowns
      const units = [...new Set(allProjects.map(p => (p.unit || '').trim()).filter(Boolean))].sort();
      const dynamicCategories = [...new Set(allProjects.map(p => (p.category || '').trim()).filter(Boolean))].sort();

      // Pagination
      const pageSize = s.pageSize === 'all' ? sortedData.length : Number(s.pageSize);
      const totalPages = Math.ceil(sortedData.length / (pageSize || 1)) || 1;
      const currentPage = Math.min(s.page, totalPages);
      const startIdx = (currentPage - 1) * pageSize;
      const paginatedData = s.pageSize === 'all' ? sortedData : sortedData.slice(startIdx, startIdx + pageSize);

      const hasActiveFilters = s.yearFilter !== 'all' || s.statusFilter !== 'all' || s.categoryFilter !== 'all' || s.unitFilter !== 'all' || s.typeFilter !== 'all' || s.priorityFilter !== 'all' || s.classFilter !== 'all' || s.searchQuery.trim() !== '';

      const majorRepPct = parseFloat(kpis.majorRepPct) || 0;
      const majorNewPct = parseFloat(kpis.majorNewPct) || 0;
      const majorRepMillions = (kpis.majorReplacementBudget / 1000000).toFixed(1);
      const majorNewMillions = (kpis.majorNewBudget / 1000000).toFixed(1);

      const minorRepPct = parseFloat(kpis.minorRepPct) || 0;
      const minorNewPct = parseFloat(kpis.minorNewPct) || 0;
      const minorRepMillions = (kpis.minorReplacementBudget / 1000000).toFixed(1);
      const minorNewMillions = (kpis.minorNewBudget / 1000000).toFixed(1);

      container.innerHTML = `
        <div class="bg-[#F7F8FA] -m-2 sm:-m-4 md:-m-6 p-4 sm:p-6 md:p-8 text-[#1A1F2B] font-sans antialiased min-h-screen space-y-6">

          <!-- ========================================================================= -->
          <!-- 1. TOP BANNER: Main Heading & Function Buttons (No Extra Text)            -->
          <!-- ========================================================================= -->
          <div class="relative bg-gradient-to-r from-[#0B1D3A] via-[#122B55] to-[#1E3A8A] text-white rounded-xl border border-blue-900/50 p-5 sm:p-6 shadow-lg">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-center gap-3.5">
                <div class="w-12 h-12 rounded-xl bg-white/10 border border-[#D4AF37]/50 flex items-center justify-center shrink-0 text-[#D4AF37] shadow-inner">
                  <i data-lucide="circle-dollar-sign" class="w-7 h-7"></i>
                </div>
                <div>
                  <h1 class="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white m-0">
                    FPCL Plant CapEx Portfolio ${s.yearFilter !== 'all' ? `(${s.yearFilter})` : '(All Years)'}
                  </h1>
                  <p class="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                    <span>Target: <strong class="text-white">13ys4PbggcQq0H06Rh6cScAtdVnlrY-yyiWxA4e6dDzc</strong></span>
                    <span>•</span>
                    <span>Tab: <strong class="text-[#D4AF37]">CAPEX</strong></span>
                  </p>
                </div>
              </div>

              <!-- Function Buttons -->
              <div class="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  onclick="window.FPCL_CAPEX_SUITE.openSheetModal()"
                  class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-[#D4AF37]/50 transition-all cursor-pointer shadow-xs"
                  title="Configure Google Sheet link for live connection"
                >
                  <i data-lucide="link" class="w-3.5 h-3.5 text-[#D4AF37]"></i>
                  <span>${s.sheetConnected ? 'Live Sheet Connected' : 'Connect Live Sheet'}</span>
                </button>
                <button
                  onclick="window.FPCL_CAPEX_SUITE.state.currencyFormat = window.FPCL_CAPEX_SUITE.state.currencyFormat === 'M' ? 'full' : 'M'; window.FPCL_CAPEX_SUITE.render();"
                  class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/25 transition-all cursor-pointer shadow-xs"
                  title="Toggle Millions vs Full PKR"
                >
                  <i data-lucide="coins" class="w-3.5 h-3.5 text-[#D4AF37]"></i>
                  <span>${s.currencyFormat === 'M' ? 'Millions (M)' : 'Full PKR'}</span>
                </button>
                <button
                  onclick="portalApp.handleDropdownSelect('overview')"
                  class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/25 transition-all cursor-pointer shadow-xs"
                  title="Return to Executive Overview"
                >
                  <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
                  <span>Overview</span>
                </button>
                <button
                  id="btn-capex-sync-feed"
                  onclick="window.FPCL_CAPEX_SUITE.syncLiveFeed()"
                  class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-[#D4AF37]/50 transition-all cursor-pointer shadow-xs"
                  title="Sync Live with Google Sheets"
                >
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-[#D4AF37]"></i>
                  <span>Sync Feed</span>
                </button>
                <button
                  onclick="window.FPCL_CAPEX_SUITE.exportCsv()"
                  class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black bg-gradient-to-r from-[#D4AF37] to-[#E6C86E] hover:from-[#C59F2D] hover:to-[#D4AF37] text-[#0B1D3A] transition-all cursor-pointer shadow-md"
                  title="Export Filtered Projects to CSV"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>

          <!-- ========================================================================= -->
          <!-- 2. KPI VALUES: Center-Aligned, Clean & Colorful Boardroom Cards          -->
          <!-- ========================================================================= -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            
            <!-- Card 1: Total Portfolio (Gold/Navy Gradient) -->
            <div class="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0B1D3A] border border-amber-500/35 rounded-xl p-4 sm:p-5 shadow-md text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-0.5">
              <span class="text-[11px] uppercase font-extrabold tracking-wider text-slate-300">
                Total CapEx (Cost Col D)
              </span>
              <div class="mt-2 text-xl sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-amber-400">
                ${s.currencyFormat === 'M' ? `PKR ${kpis.totalBudgetMillions} M` : this.formatCurrency(kpis.totalBudget)}
              </div>
              <div class="mt-2 text-[11px] font-semibold text-slate-300">
                ${kpis.totalProjects} Projects • Rep: ${kpis.replacementCount} | New: ${kpis.newCount}
              </div>
            </div>

            <!-- Card 2: Major CapEx (>4.5M) (Royal Blue Gradient) -->
            <div class="bg-gradient-to-br from-[#0B1D3A] via-[#1E3A8A] to-[#172554] border border-blue-400/35 rounded-xl p-4 sm:p-5 shadow-md text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-0.5">
              <span class="text-[11px] uppercase font-extrabold tracking-wider text-blue-200">
                Major (>4.5M) (Col D)
              </span>
              <div class="mt-2 text-xl sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-blue-300">
                ${s.currencyFormat === 'M' ? `PKR ${kpis.majorBudgetMillions} M` : this.formatCurrency(kpis.majorBudget)}
              </div>
              <div class="mt-2 text-[11px] font-semibold text-blue-200">
                ${kpis.majorCount} Projects • Rep: ${kpis.majorReplacementCount} | New: ${kpis.majorNewCount}
              </div>
            </div>

            <!-- Card 3: Minor CapEx (<=4.5M) (Teal Gradient) -->
            <div class="bg-gradient-to-br from-[#0F2830] via-[#134E4A] to-[#042F2E] border border-teal-400/35 rounded-xl p-4 sm:p-5 shadow-md text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-0.5">
              <span class="text-[11px] uppercase font-extrabold tracking-wider text-teal-200">
                Minor (&le;4.5M) (Col D)
              </span>
              <div class="mt-2 text-xl sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-teal-300">
                ${s.currencyFormat === 'M' ? `PKR ${kpis.minorBudgetMillions} M` : this.formatCurrency(kpis.minorBudget)}
              </div>
              <div class="mt-2 text-[11px] font-semibold text-teal-200">
                ${kpis.minorCount} Projects • Rep: ${kpis.minorReplacementCount} | New: ${kpis.minorNewCount}
              </div>
            </div>

            <!-- Card 4: Replacements (Column N) (Burnt Orange Gradient) -->
            <div class="bg-gradient-to-br from-[#1C1917] via-[#292524] to-[#431407] border border-orange-400/35 rounded-xl p-4 sm:p-5 shadow-md text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-0.5">
              <span class="text-[11px] uppercase font-extrabold tracking-wider text-orange-200">
                Replacements (Col N)
              </span>
              <div class="mt-2 text-xl sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-orange-400">
                ${s.currencyFormat === 'M' ? `PKR ${kpis.replacementBudgetMillions} M` : this.formatCurrency(kpis.replacementBudget)}
              </div>
              <div class="mt-2 text-[11px] font-semibold text-orange-200">
                ${kpis.replacementCount} Projects • Replacement
              </div>
            </div>

            <!-- Card 5: New Installations (Column N) (Purple Gradient) -->
            <div class="bg-gradient-to-br from-[#2E1065] via-[#3B0764] to-[#1E1B4B] border border-purple-400/35 rounded-xl p-4 sm:p-5 shadow-md text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-0.5">
              <span class="text-[11px] uppercase font-extrabold tracking-wider text-purple-200">
                New Projects (Col N)
              </span>
              <div class="mt-2 text-xl sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-purple-300">
                ${s.currencyFormat === 'M' ? `PKR ${kpis.newBudgetMillions} M` : this.formatCurrency(kpis.newBudget)}
              </div>
              <div class="mt-2 text-[11px] font-semibold text-purple-200">
                ${kpis.newCount} Projects • New
              </div>
            </div>

            <!-- Card 6: MOC Required (Column L) (Emerald Gradient) -->
            <div class="bg-gradient-to-br from-[#022C22] via-[#064E3B] to-[#042F2E] border border-emerald-400/35 rounded-xl p-4 sm:p-5 shadow-md text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-0.5">
              <span class="text-[11px] uppercase font-extrabold tracking-wider text-emerald-200">
                MOC Required (Col L)
              </span>
              <div class="mt-2 text-xl sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-emerald-400">
                ${kpis.mocCount} Projects
              </div>
              <div class="mt-2 text-[11px] font-semibold text-emerald-200">
                Rep: ${kpis.mocReplacementCount} | New: ${kpis.mocNewCount}
              </div>
            </div>

          </div>

          <!-- ========================================================================= -->
          <!-- 3. FILTERS SECTION (BELOW KPI CARDS: Added Year & Open/Close Filters)     -->
          <!-- ========================================================================= -->
          <div class="bg-white border border-[#E2E6EE] rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#0B1D3A]"></span>
                <h3 class="text-sm font-black uppercase tracking-wider text-[#0B1D3A]">
                  Portfolio Filters & Search
                </h3>
                <span class="text-xs text-[#7A8699]">
                  (Showing ${filteredData.length} of ${allProjects.length} Projects)
                </span>
              </div>

              ${hasActiveFilters ? `
                <button
                  onclick="window.FPCL_CAPEX_SUITE.resetFilters()"
                  class="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer flex items-center gap-1 self-start md:self-auto"
                >
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                  Reset All Filters
                </button>
              ` : ''}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              
              <!-- Search Box -->
              <div class="relative sm:col-span-2 md:col-span-3 lg:col-span-2">
                <i data-lucide="search" class="w-4 h-4 text-[#7A8699] absolute left-3 top-1/2 -translate-y-1/2"></i>
                <input
                  type="text"
                  placeholder="Search project name, WBS, reason, unit..."
                  value="${s.searchQuery}"
                  oninput="window.FPCL_CAPEX_SUITE.state.searchQuery = this.value; window.FPCL_CAPEX_SUITE.state.page = 1; window.FPCL_CAPEX_SUITE.render();"
                  class="w-full pl-9 pr-8 py-2 rounded-lg text-xs bg-slate-50 border border-[#CBD2DE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1D3A]/20 focus:border-[#0B1D3A] text-[#1A1F2B] font-medium"
                />
                ${s.searchQuery ? `
                  <button onclick="window.FPCL_CAPEX_SUITE.state.searchQuery = ''; window.FPCL_CAPEX_SUITE.render();" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A8699] hover:text-[#1A1F2B]">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                  </button>
                ` : ''}
              </div>

              <!-- Year Filter (All years from Column B, default latest year) -->
              <div>
                <select
                  onchange="window.FPCL_CAPEX_SUITE.state.yearFilter = this.value; window.FPCL_CAPEX_SUITE.state.page = 1; window.FPCL_CAPEX_SUITE.render();"
                  class="w-full py-2 px-3 rounded-lg text-xs bg-slate-50 border border-[#CBD2DE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1D3A]/20 text-[#1A1F2B] font-semibold"
                >
                  <option value="all" ${s.yearFilter === 'all' ? 'selected' : ''}>All Years (Col B)</option>
                  ${years.map(y => `<option value="${y}" ${s.yearFilter === y ? 'selected' : ''}>Year ${y}</option>`).join('')}
                </select>
              </div>

              <!-- Open / Close Status Filter (Column R) -->
              <div>
                <select
                  onchange="window.FPCL_CAPEX_SUITE.state.statusFilter = this.value; window.FPCL_CAPEX_SUITE.state.page = 1; window.FPCL_CAPEX_SUITE.render();"
                  class="w-full py-2 px-3 rounded-lg text-xs bg-slate-50 border border-[#CBD2DE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1D3A]/20 text-[#1A1F2B] font-semibold"
                >
                  <option value="all" ${s.statusFilter === 'all' ? 'selected' : ''}>All Statuses (Col R)</option>
                  <option value="open" ${s.statusFilter === 'open' ? 'selected' : ''}>Status: Open</option>
                  <option value="close" ${s.statusFilter === 'close' ? 'selected' : ''}>Status: Close</option>
                </select>
              </div>

              <!-- Category Filter (Column O) -->
              <div>
                <select
                  onchange="window.FPCL_CAPEX_SUITE.state.categoryFilter = this.value; window.FPCL_CAPEX_SUITE.state.page = 1; window.FPCL_CAPEX_SUITE.render();"
                  class="w-full py-2 px-3 rounded-lg text-xs bg-slate-50 border border-[#CBD2DE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1D3A]/20 text-[#1A1F2B] font-semibold"
                >
                  <option value="all" ${s.categoryFilter === 'all' ? 'selected' : ''}>All Categories (Col O)</option>
                  ${dynamicCategories.map(c => `<option value="${c}" ${s.categoryFilter === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>

              <!-- Responsible Unit Filter (Column I) -->
              <div>
                <select
                  onchange="window.FPCL_CAPEX_SUITE.state.unitFilter = this.value; window.FPCL_CAPEX_SUITE.state.page = 1; window.FPCL_CAPEX_SUITE.render();"
                  class="w-full py-2 px-3 rounded-lg text-xs bg-slate-50 border border-[#CBD2DE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1D3A]/20 text-[#1A1F2B] font-semibold"
                >
                  <option value="all" ${s.unitFilter === 'all' ? 'selected' : ''}>All Units (Col I)</option>
                  ${units.map(u => `<option value="${u}" ${s.unitFilter === u ? 'selected' : ''}>${u}</option>`).join('')}
                </select>
              </div>

            </div>

            <!-- Active filter chips -->
            ${hasActiveFilters ? `
              <div class="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-slate-100">
                <span class="text-[#7A8699] font-bold">Active Filters:</span>
                ${s.yearFilter !== 'all' ? `<span class="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-bold">Year: ${s.yearFilter}</span>` : ''}
                ${s.statusFilter !== 'all' ? `<span class="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-bold">Status: ${s.statusFilter.toUpperCase()}</span>` : ''}
                ${s.categoryFilter !== 'all' ? `<span class="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-bold">Cat: ${s.categoryFilter}</span>` : ''}
                ${s.unitFilter !== 'all' ? `<span class="bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded font-bold">Unit: ${s.unitFilter}</span>` : ''}
                ${s.typeFilter !== 'all' ? `<span class="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded font-bold">Type: ${s.typeFilter}</span>` : ''}
                ${s.classFilter !== 'all' ? `<span class="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-bold">Class: ${s.classFilter.toUpperCase()}</span>` : ''}
                ${s.searchQuery ? `<span class="bg-slate-100 text-[#1A1F2B] border border-slate-300 px-2 py-0.5 rounded font-bold">"${s.searchQuery}"</span>` : ''}
              </div>
            ` : ''}
          </div>

          <!-- ========================================================================= -->
          <!-- 4. VISUAL ANALYTICS SECTION (SIDE-BY-SIDE RESPONSIVE)                     -->
          <!-- ========================================================================= -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            
            <!-- Visual 1: Category Breakdown Donut Chart (Enlarged Size, Text Fits Inside) -->
            <div class="bg-white border border-[#E2E6EE] rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div class="flex items-center justify-between pb-3 border-b border-[#E2E6EE]">
                <h3 class="text-base font-bold text-[#1A1F2B] flex items-center gap-2">
                  <i data-lucide="pie-chart" class="w-4 h-4 text-[#2E5EAA]"></i>
                  Category Breakdown
                </h3>
                ${s.categoryFilter !== 'all' ? `
                  <button onclick="window.FPCL_CAPEX_SUITE.setCategoryFilter('all')" class="text-xs text-[#0B1D3A] hover:underline font-bold bg-[#F7F8FA] border border-[#CBD2DE] px-2.5 py-1 rounded cursor-pointer">
                    Clear Filter
                  </button>
                ` : ''}
              </div>

              <!-- Donut SVG & Dynamic Legend -->
              <div class="py-5 flex flex-col sm:flex-row items-center justify-center gap-6">
                
                <!-- SVG Donut Chart (Enlarged to fit text comfortably inside in laptop view) -->
                <div class="relative w-72 h-72 sm:w-80 sm:h-80 md:w-84 md:h-84 shrink-0 flex items-center justify-center">
                  ${this.renderDonutSvg(kpis)}
                  <!-- Center Info Overlay fitted inside hole -->
                  <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4 select-none">
                    <span class="text-xs uppercase font-extrabold text-[#7A8699] tracking-wider">Total CapEx</span>
                    <span class="text-2xl sm:text-3xl font-black font-mono text-[#0B1D3A] tracking-tight leading-tight my-0.5">
                      PKR ${kpis.totalBudgetMillions}M
                    </span>
                    <span class="text-xs font-bold text-[#7A8699]">${kpis.totalProjects} Projects</span>
                    <span class="text-[11px] font-semibold text-[#2E5EAA] mt-0.5">Rep: ${kpis.replacementCount} | New: ${kpis.newCount}</span>
                  </div>
                </div>

                <!-- Interactive Category Legend List -->
                <div class="w-full sm:w-auto flex-1 space-y-2">
                  ${this.renderCategoryLegend(kpis)}
                </div>

              </div>
            </div>

            <!-- Visual 2: Class vs Type Stacked Bar Chart (Thicker Bars, Inside Text, Column N) -->
            <div class="bg-white border border-[#E2E6EE] rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div class="flex items-center justify-between pb-3 border-b border-[#E2E6EE]">
                <h3 class="text-base font-bold text-[#1A1F2B] flex items-center gap-2">
                  <i data-lucide="bar-chart-3" class="w-4 h-4 text-[#0B1D3A]"></i>
                  Type Breakdown by Value & Class
                </h3>
                ${s.classFilter !== 'all' || s.typeFilter !== 'all' ? `
                  <button onclick="window.FPCL_CAPEX_SUITE.setClassFilter('all', 'all')" class="text-xs text-[#0B1D3A] hover:underline font-bold bg-[#F7F8FA] border border-[#CBD2DE] px-2.5 py-1 rounded cursor-pointer">
                    Reset Filter
                  </button>
                ` : ''}
              </div>

              <!-- Legend Bar -->
              <div class="flex items-center justify-center gap-6 pt-2 text-xs">
                <div class="flex items-center gap-2">
                  <span class="w-3.5 h-3.5 rounded-sm bg-[#1E3A8A]"></span>
                  <span class="font-bold text-[#1A1F2B]">Replacements (Col N)</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-3.5 h-3.5 rounded-sm bg-[#D9782D]"></span>
                  <span class="font-bold text-[#1A1F2B]">New Installations (Col N)</span>
                </div>
              </div>

              <!-- Stacked Horizontal Bars (Thickened to 56px with non-overlapping embedded labels) -->
              <div class="py-4 space-y-6">
                
                <!-- Row 1: Major CapEx (>4.5M) -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <div class="flex items-center gap-1.5 font-bold text-[#1A1F2B]">
                      <span class="w-2.5 h-2.5 rounded-xs bg-[#1E3A8A]"></span>
                      <span class="text-sm">Major CapEx (>4.5M)</span>
                      <span class="text-[#7A8699] font-normal">(${kpis.majorCount} Projects)</span>
                    </div>
                    <div class="font-mono font-bold text-[#0B1D3A] text-sm">
                      PKR ${kpis.majorBudgetMillions} M
                    </div>
                  </div>
                  
                  <!-- Stacked Progress Bar (Thickness h-14 = 56px with non-overlapping inner text) -->
                  <div class="h-14 w-full bg-slate-100 rounded-lg overflow-hidden flex border border-[#CBD2DE] cursor-pointer shadow-inner">
                    <!-- Replacements Segment -->
                    ${majorRepPct > 0 ? `
                    <div
                      onclick="window.FPCL_CAPEX_SUITE.setClassFilter('major', 'Replacement')"
                      style="width: ${majorRepPct}%;"
                      class="h-full bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:opacity-95 transition-opacity flex items-center justify-between px-3 text-white font-semibold min-w-0"
                      title="Major Replacements: PKR ${majorRepMillions} M (${majorRepPct}%)"
                    >
                      <span class="text-xs truncate">Replacements</span>
                      <span class="font-mono text-[11px] sm:text-xs font-bold bg-black/30 px-2 py-0.5 rounded shrink-0 whitespace-nowrap">${majorRepPct}% • PKR ${majorRepMillions}M</span>
                    </div>
                    ` : ''}
                    <!-- New Segment -->
                    ${majorNewPct > 0 ? `
                    <div
                      onclick="window.FPCL_CAPEX_SUITE.setClassFilter('major', 'New')"
                      style="width: ${majorNewPct}%;"
                      class="h-full bg-gradient-to-r from-[#D9782D] to-[#F97316] hover:opacity-95 transition-opacity flex items-center justify-between px-3 text-white font-semibold min-w-0"
                      title="Major New Installations: PKR ${majorNewMillions} M (${majorNewPct}%)"
                    >
                      <span class="text-xs truncate">New</span>
                      <span class="font-mono text-[11px] sm:text-xs font-bold bg-black/30 px-2 py-0.5 rounded shrink-0 whitespace-nowrap">${majorNewPct}% • PKR ${majorNewMillions}M</span>
                    </div>
                    ` : ''}
                  </div>
                </div>

                <!-- Row 2: Minor CapEx (<4.5M) -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <div class="flex items-center gap-1.5 font-bold text-[#1A1F2B]">
                      <span class="w-2.5 h-2.5 rounded-xs bg-[#7A8699]"></span>
                      <span class="text-sm">Minor CapEx (<4.5M)</span>
                      <span class="text-[#7A8699] font-normal">(${kpis.minorCount} Projects)</span>
                    </div>
                    <div class="font-mono font-bold text-[#7A8699] text-sm">
                      PKR ${kpis.minorBudgetMillions} M
                    </div>
                  </div>
                  
                  <!-- Stacked Progress Bar (Thickness h-14 = 56px with non-overlapping inner text) -->
                  <div class="h-14 w-full bg-slate-100 rounded-lg overflow-hidden flex border border-[#CBD2DE] cursor-pointer shadow-inner">
                    <!-- Replacements Segment -->
                    ${minorRepPct > 0 ? `
                    <div
                      onclick="window.FPCL_CAPEX_SUITE.setClassFilter('minor', 'Replacement')"
                      style="width: ${minorRepPct}%;"
                      class="h-full bg-gradient-to-r from-[#1E3A8A]/90 to-[#2563EB]/90 hover:opacity-95 transition-opacity flex items-center justify-between px-3 text-white font-semibold min-w-0"
                      title="Minor Replacements: PKR ${minorRepMillions} M (${minorRepPct}%)"
                    >
                      <span class="text-xs truncate">Replacements</span>
                      <span class="font-mono text-[11px] sm:text-xs font-bold bg-black/30 px-2 py-0.5 rounded shrink-0 whitespace-nowrap">${minorRepPct}% • PKR ${minorRepMillions}M</span>
                    </div>
                    ` : ''}
                    <!-- New Segment -->
                    ${minorNewPct > 0 ? `
                    <div
                      onclick="window.FPCL_CAPEX_SUITE.setClassFilter('minor', 'New')"
                      style="width: ${minorNewPct}%;"
                      class="h-full bg-gradient-to-r from-[#D9782D]/90 to-[#F97316]/90 hover:opacity-95 transition-opacity flex items-center justify-between px-3 text-white font-semibold min-w-0"
                      title="Minor New Installations: PKR ${minorNewMillions} M (${minorNewPct}%)"
                    >
                      <span class="text-xs truncate">New</span>
                      <span class="font-mono text-[11px] sm:text-xs font-bold bg-black/30 px-2 py-0.5 rounded shrink-0 whitespace-nowrap">${minorNewPct}% • PKR ${minorNewMillions}M</span>
                    </div>
                    ` : ''}
                  </div>
                </div>

              </div>
            </div>

          </div>

          <!-- ========================================================================= -->
          <!-- 5. MASTER PROJECT DETAIL TABLE (ALL 19 EXCEL COLUMNS, FULLY SCROLLABLE)   -->
          <!-- ========================================================================= -->
          <div id="capex-master-table-section" class="bg-white border border-[#E2E6EE] rounded-xl shadow-md overflow-hidden">
            
            <!-- Table Header Bar -->
            <div class="p-4 sm:p-5 border-b border-[#E2E6EE] bg-[#F7F8FA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 class="text-base font-bold text-[#0B1D3A] flex items-center gap-2">
                  <i data-lucide="layers" class="w-4 h-4 text-[#0B1D3A]"></i>
                  Project Portfolio Detail Master Table
                </h3>
                <span class="text-xs text-[#7A8699]">
                  Showing all columns from spreadsheet • Horizontal scroll enabled • Click any row for scope notes
                </span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-xs font-semibold text-[#7A8699]">
                  Rows:
                </span>
                <select
                  onchange="window.FPCL_CAPEX_SUITE.state.pageSize = this.value; window.FPCL_CAPEX_SUITE.state.page = 1; window.FPCL_CAPEX_SUITE.render();"
                  class="py-1 px-2.5 rounded-lg bg-white border border-[#CBD2DE] text-xs font-bold text-[#1A1F2B] focus:outline-none"
                >
                  <option value="15" ${s.pageSize == 15 ? 'selected' : ''}>15 per page</option>
                  <option value="25" ${s.pageSize == 25 ? 'selected' : ''}>25 per page</option>
                  <option value="50" ${s.pageSize == 50 ? 'selected' : ''}>50 per page</option>
                  <option value="all" ${s.pageSize === 'all' ? 'selected' : ''}>All (${filteredData.length})</option>
                </select>
              </div>
            </div>

            <!-- Table Container (Horizontal Scrolling for All 19 Columns) -->
            <div class="overflow-x-auto">
              <table class="min-w-[2450px] text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-gradient-to-r from-[#0B1D3A] via-[#122B55] to-[#0B1D3A] text-white py-3.5 px-3 uppercase tracking-wider text-[11px] font-bold border-b border-[#D4AF37]/50 select-none sticky top-0 z-10">
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('sr')" class="py-3 px-3 cursor-pointer hover:bg-white/10 text-center w-14">
                      # ${this.renderSortArrow('sr')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('year')" class="py-3 px-3 cursor-pointer hover:bg-white/10 text-center w-16">
                      Year ${this.renderSortArrow('year')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('name')" class="py-3 px-3 cursor-pointer hover:bg-white/10 min-w-[260px]">
                      Projects ${this.renderSortArrow('name')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('budget')" class="py-3 px-3 cursor-pointer hover:bg-white/10 text-right min-w-[130px]">
                      Budget (PKR) ${this.renderSortArrow('budget')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('consumed')" class="py-3 px-3 cursor-pointer hover:bg-white/10 text-right min-w-[130px]">
                      Consumed (PKR) ${this.renderSortArrow('consumed')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('commitment')" class="py-3 px-3 cursor-pointer hover:bg-white/10 text-right min-w-[130px]">
                      Commitment (PKR) ${this.renderSortArrow('commitment')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('available')" class="py-3 px-3 cursor-pointer hover:bg-white/10 text-right min-w-[130px]">
                      Available (PKR) ${this.renderSortArrow('available')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('wbs')" class="py-3 px-3 cursor-pointer hover:bg-white/10 min-w-[160px]">
                      WBS Elements ${this.renderSortArrow('wbs')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('unit')" class="py-3 px-3 cursor-pointer hover:bg-white/10 min-w-[130px]">
                      Responsible Unit ${this.renderSortArrow('unit')}
                    </th>
                    <th class="py-3 px-3 min-w-[220px]">
                      Reason
                    </th>
                    <th class="py-3 px-3 text-center min-w-[100px]">
                      Service life
                    </th>
                    <th class="py-3 px-3 text-center min-w-[100px]">
                      MOC required
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('priority')" class="py-3 px-3 cursor-pointer hover:bg-white/10 text-center min-w-[90px]">
                      Priority ${this.renderSortArrow('priority')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('type')" class="py-3 px-3 cursor-pointer hover:bg-white/10 min-w-[130px]">
                      Replacement_New ${this.renderSortArrow('type')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('category')" class="py-3 px-3 cursor-pointer hover:bg-white/10 min-w-[170px]">
                      Category ${this.renderSortArrow('category')}
                    </th>
                    <th class="py-3 px-3 min-w-[110px]">
                      Quantity
                    </th>
                    <th class="py-3 px-3 min-w-[240px]">
                      Actions Assigned
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('status')" class="py-3 px-3 cursor-pointer hover:bg-white/10 text-center min-w-[110px]">
                      Status Open/Close ${this.renderSortArrow('status')}
                    </th>
                    <th class="py-3 px-3 min-w-[240px]">
                      End User Remarks / Current status
                    </th>
                    <th class="py-3 px-3 text-center sticky right-0 bg-[#0B1D3A] z-20 w-16">
                      Scope
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#EEF1F5] text-[#1A1F2B]">
                  ${paginatedData.length === 0 ? `
                    <tr>
                      <td colspan="20" class="py-12 text-center text-[#7A8699]">
                        <i data-lucide="folder-search" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
                        <div class="font-bold text-sm text-[#0B1D3A]">No Projects Match Current Filters</div>
                        <div class="text-xs mt-1">Try resetting active filters or clearing the search query.</div>
                      </td>
                    </tr>
                  ` : paginatedData.map((p, idx) => {
                    const isClosed = (p.status || '').toLowerCase().includes('close');
                    const isMoc = (p.moc || '').toLowerCase() === 'yes';
                    const isMajor = (p.budget || 0) > 4500000;
                    const rowNum = startIdx + idx + 1;

                    return `
                      <tr
                        onclick="window.FPCL_CAPEX_SUITE.openDrawerByIndex(${startIdx + idx})"
                        class="hover:bg-amber-50/40 even:bg-slate-50/60 transition-colors cursor-pointer group"
                      >
                        <!-- 1. # -->
                        <td class="py-3 px-3 text-center font-mono text-[#7A8699] font-bold">
                          ${p.sr || rowNum}
                        </td>

                        <!-- 2. Year -->
                        <td class="py-3 px-3 text-center font-mono">
                          <span class="px-2 py-0.5 rounded font-bold text-xs bg-slate-100 text-[#0B1D3A] border border-slate-200">
                            ${p.year || '2027'}
                          </span>
                        </td>

                        <!-- 3. Projects -->
                        <td class="py-3 px-3">
                          <div class="font-bold text-[#1A1F2B] group-hover:text-[#0B1D3A] transition-colors leading-snug">
                            ${p.name}
                          </div>
                          ${isMajor ? '<div class="text-[10px] text-[#2E5EAA] font-bold mt-0.5">• Major CapEx (>4.5M)</div>' : ''}
                        </td>

                        <!-- 4. Budget (PKR) -->
                        <td class="py-3 px-3 text-right font-mono font-bold whitespace-nowrap text-[#0B1D3A]" title="PKR ${(p.budget || 0).toLocaleString('en-US')}">
                          ${this.formatCurrency(p.budget)}
                        </td>

                        <!-- 5. Consumed (PKR) -->
                        <td class="py-3 px-3 text-right font-mono whitespace-nowrap text-[#1E3A8A]" title="PKR ${(p.consumed || 0).toLocaleString('en-US')}">
                          ${this.formatCurrency(p.consumed || 0)}
                        </td>

                        <!-- 6. Commitment (PKR) -->
                        <td class="py-3 px-3 text-right font-mono whitespace-nowrap text-[#D9782D]" title="PKR ${(p.commitment || 0).toLocaleString('en-US')}">
                          ${this.formatCurrency(p.commitment || 0)}
                        </td>

                        <!-- 7. Available (PKR) -->
                        <td class="py-3 px-3 text-right font-mono font-semibold whitespace-nowrap text-[#1F9E7C]" title="PKR ${(p.available || 0).toLocaleString('en-US')}">
                          ${this.formatCurrency(p.available || 0)}
                        </td>

                        <!-- 8. WBS Elements -->
                        <td class="py-3 px-3 whitespace-nowrap font-mono text-xs">
                          <code class="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-mono text-[11px]">
                            ${p.wbs || '-'}
                          </code>
                        </td>

                        <!-- 9. Responsible Unit -->
                        <td class="py-3 px-3 whitespace-nowrap">
                          <span class="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-[#1A1F2B] border border-[#CBD2DE]">
                            ${p.unit}
                          </span>
                        </td>

                        <!-- 10. Reason -->
                        <td class="py-3 px-3 text-[11px] text-slate-600 max-w-xs truncate" title="${p.reason || '-'}">
                          ${p.reason || '-'}
                        </td>

                        <!-- 11. Service life -->
                        <td class="py-3 px-3 text-center whitespace-nowrap text-[11px] font-mono text-slate-600">
                          ${p.serviceLife || '-'}
                        </td>

                        <!-- 12. MOC required -->
                        <td class="py-3 px-3 text-center whitespace-nowrap">
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${isMoc ? 'bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/30' : 'bg-slate-100 text-[#7A8699] border border-[#CBD2DE]'}">
                            ${p.moc}
                          </span>
                        </td>

                        <!-- 13. Priority -->
                        <td class="py-3 px-3 text-center whitespace-nowrap">
                          <span class="inline-flex items-center justify-center w-5 h-5 rounded-xs text-[10px] font-bold ${p.priority === 'A' ? 'bg-[#C0392B] text-white' : p.priority === 'B' ? 'bg-[#2E5EAA] text-white' : 'bg-[#7A8699] text-white'}">
                            ${p.priority}
                          </span>
                        </td>

                        <!-- 14. Replacement_New -->
                        <td class="py-3 px-3 whitespace-nowrap">
                          <span class="inline-block px-2 py-0.5 rounded text-[11px] font-bold ${p.type === 'Replacement' ? 'bg-[#2E5EAA]/10 text-[#2E5EAA] border border-[#2E5EAA]/25' : 'bg-[#D9782D]/10 text-[#D9782D] border border-[#D9782D]/25'}">
                            ${p.type}
                          </span>
                        </td>

                        <!-- 15. Category -->
                        <td class="py-3 px-3 whitespace-nowrap">
                          ${this.renderCategoryBadge(p.category)}
                        </td>

                        <!-- 16. Quantity -->
                        <td class="py-3 px-3 whitespace-nowrap text-[11px] font-mono text-slate-600">
                          ${p.quantity || '1 Lot'}
                        </td>

                        <!-- 17. Actions Assigned -->
                        <td class="py-3 px-3 text-[11px] text-slate-600 max-w-xs truncate" title="${p.strategy || '-'}">
                          ${p.strategy || '-'}
                        </td>

                        <!-- 18. Status Open/Close -->
                        <td class="py-3 px-3 text-center whitespace-nowrap">
                          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${isClosed ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-amber-50 text-amber-800 border border-amber-300'}">
                            <span class="w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                            ${isClosed ? 'Close' : 'Open'}
                          </span>
                        </td>

                        <!-- 19. End User Remarks / Current status -->
                        <td class="py-3 px-3 text-[11px] text-slate-600 max-w-xs truncate" title="${p.remarks || '-'}">
                          ${p.remarks || '-'}
                        </td>

                        <!-- 20. Scope Action Button (Sticky Right) -->
                        <td class="py-3 px-3 text-center whitespace-nowrap sticky right-0 bg-white group-hover:bg-amber-50/40 z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]" onclick="event.stopPropagation(); window.FPCL_CAPEX_SUITE.openDrawerByIndex(${startIdx + idx})">
                          <button class="p-1.5 rounded text-[#7A8699] hover:text-[#0B1D3A] hover:bg-slate-100 transition-colors" title="View Full Project Scope">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Pagination & Summary Bar -->
            <div class="p-3.5 border-t border-[#E2E6EE] bg-[#F7F8FA] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7A8699]">
              <div class="flex items-center gap-2">
                <span>Showing ${paginatedData.length ? startIdx + 1 : 0}–${Math.min(startIdx + paginatedData.length, filteredData.length)} of ${filteredData.length} projects</span>
              </div>

              <!-- Page Buttons -->
              ${s.pageSize !== 'all' && totalPages > 1 ? `
                <div class="flex items-center gap-1">
                  <button
                    onclick="window.FPCL_CAPEX_SUITE.state.page = Math.max(1, window.FPCL_CAPEX_SUITE.state.page - 1); window.FPCL_CAPEX_SUITE.render();"
                    ${currentPage <= 1 ? 'disabled class="opacity-40 cursor-not-allowed"' : 'class="hover:bg-[#E7EBF2] cursor-pointer"'}
                    class="p-1 rounded border border-[#CBD2DE] bg-white text-[#1A1F2B] transition-colors"
                  >
                    <i data-lucide="chevron-left" class="w-4 h-4"></i>
                  </button>
                  <span class="px-2 font-medium text-[#1A1F2B]">Page ${currentPage} of ${totalPages}</span>
                  <button
                    onclick="window.FPCL_CAPEX_SUITE.state.page = Math.min(${totalPages}, window.FPCL_CAPEX_SUITE.state.page + 1); window.FPCL_CAPEX_SUITE.render();"
                    ${currentPage >= totalPages ? 'disabled class="opacity-40 cursor-not-allowed"' : 'class="hover:bg-[#E7EBF2] cursor-pointer"'}
                    class="p-1 rounded border border-[#CBD2DE] bg-white text-[#1A1F2B] transition-colors"
                  >
                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                  </button>
                </div>
              ` : ''}
            </div>

          </div>

          <!-- ========================================================================= -->
          <!-- 6. SIDE DRAWER CONTAINER & SHEET MODAL                                    -->
          <!-- ========================================================================= -->
          <div id="capex-side-drawer-container"></div>
          <div id="capex-sheet-modal-container"></div>
        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }
    },

    renderSortArrow(col) {
      if (this.state.sortColumn !== col) return '';
      return this.state.sortDirection === 'asc' ? '↑' : '↓';
    },

    renderCategoryBadge(cat) {
      if (!cat) return '<span class="text-[#7A8699]">-</span>';
      const c = String(cat).trim();
      const colorMap = {
        'Reliability & Sustenance': 'bg-[#2E5EAA]/10 text-[#2E5EAA] border-[#2E5EAA]/25',
        'Efficiency': 'bg-[#D9782D]/10 text-[#D9782D] border-[#D9782D]/25',
        'HSE': 'bg-[#1F9E7C]/10 text-[#1F9E7C] border-[#1F9E7C]/25',
        'Others/Admin': 'bg-[#7A8699]/10 text-[#7A8699] border-[#7A8699]/25',
        'IT': 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/25'
      };
      if (colorMap[c]) {
        return `<span class="inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${colorMap[c]}">${c}</span>`;
      }
      return `<span class="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">${c}</span>`;
    },

    getCategoryColor(catName, index = 0) {
      const palette = {
        'Reliability & Sustenance': '#2E5EAA',
        'Others/Admin': '#7A8699',
        'Efficiency': '#D9782D',
        'HSE': '#1F9E7C',
        'IT': '#8B5CF6'
      };
      if (palette[catName]) return palette[catName];
      const extras = ['#D4AF37', '#0284C7', '#E11D48', '#10B981', '#F59E0B', '#6366F1', '#EC4899'];
      return extras[index % extras.length];
    },

    /**
     * Renders responsive SVG Donut Chart dynamically for all categories in Column O
     */
    renderDonutSvg(kpis) {
      const catTotals = {};
      const raw = this.getUniqueProjects(this.getFilteredData());
      raw.forEach(p => {
        const cat = (p.category || 'Others/Admin').trim() || 'Others/Admin';
        catTotals[cat] = (catTotals[cat] || 0) + (Number(p.budget) || 0);
      });

      const total = Object.values(catTotals).reduce((a, b) => a + b, 0) || 1;
      const sortedCats = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a]);

      const slices = sortedCats.map((catName, idx) => ({
        name: catName,
        pct: (catTotals[catName] || 0) / total,
        color: this.getCategoryColor(catName, idx)
      }));

      const cx = 150;
      const cy = 150;
      const r = 105;
      const strokeWidth = 36;
      const circumference = 2 * Math.PI * r;

      let accumulatedAngle = 0;
      const paths = slices.map((slice) => {
        if (slice.pct <= 0) return '';
        const strokeDasharray = `${slice.pct * circumference} ${circumference}`;
        const strokeDashoffset = -accumulatedAngle * circumference;
        accumulatedAngle += slice.pct;

        const isSelected = this.state.categoryFilter === slice.name;

        return `
          <circle
            cx="${cx}"
            cy="${cy}"
            r="${r}"
            fill="transparent"
            stroke="${slice.color}"
            stroke-width="${strokeWidth}"
            stroke-dasharray="${strokeDasharray}"
            stroke-dashoffset="${strokeDashoffset}"
            class="transition-all duration-200 cursor-pointer ${isSelected ? 'stroke-[42px] opacity-100' : 'hover:opacity-85'}"
            onclick="window.FPCL_CAPEX_SUITE.setCategoryFilter('${slice.name.replace(/'/g, "\\'")}')"
          >
            <title>${slice.name}: ${(slice.pct * 100).toFixed(1)}%</title>
          </circle>
        `;
      });

      return `
        <svg viewBox="0 0 300 300" class="w-full h-full transform -rotate-90">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="transparent" stroke="#EEF1F5" stroke-width="${strokeWidth}" />
          ${paths.join('')}
        </svg>
      `;
    },

    renderCategoryLegend(kpis) {
      const catTotals = {};
      const raw = this.getUniqueProjects(this.getFilteredData());
      raw.forEach(p => {
        const cat = (p.category || 'Others/Admin').trim() || 'Others/Admin';
        catTotals[cat] = (catTotals[cat] || 0) + (Number(p.budget) || 0);
      });

      const total = Object.values(catTotals).reduce((a, b) => a + b, 0) || 1;
      const sortedCats = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a]);

      const items = sortedCats.map((catName, idx) => {
        const val = catTotals[catName] || 0;
        const pct = ((val / total) * 100).toFixed(1) + '%';
        const color = this.getCategoryColor(catName, idx);

        return {
          name: catName,
          pct,
          val: `PKR ${(val / 1000000).toFixed(1)} M`,
          color
        };
      });

      return items.map(item => {
        const isSelected = this.state.categoryFilter === item.name;

        return `
          <div
            onclick="window.FPCL_CAPEX_SUITE.setCategoryFilter('${item.name.replace(/'/g, "\\'")}')"
            class="flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${isSelected ? 'bg-white border-[#D4AF37] ring-1 ring-[#D4AF37] shadow-sm' : 'bg-[#F7F8FA] border-[#E2E6EE] hover:border-[#CBD2DE]'}"
          >
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${item.color};"></span>
              <div>
                <span class="text-xs font-bold text-[#1A1F2B]">${item.name}</span>
                <span class="text-[10px] text-[#7A8699] block">Column O Category</span>
              </div>
            </div>
            <div class="text-right">
              <span class="font-mono font-bold text-xs text-[#0B1D3A]">${item.val}</span>
              <span class="text-[10px] font-semibold text-[#7A8699] block">(${item.pct})</span>
            </div>
          </div>
        `;
      }).join('');
    },

    openSheetModal() {
      const modal = document.getElementById('capex-sheet-modal-container');
      if (!modal) return;
      modal.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1D3A]/60 backdrop-blur-xs p-4" onclick="window.FPCL_CAPEX_SUITE.closeSheetModal()">
          <div class="bg-white rounded-xl shadow-2xl border border-[#CBD2DE] max-w-lg w-full p-6 space-y-4" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between pb-3 border-b border-[#E2E6EE]">
              <div class="flex items-center gap-2">
                <i data-lucide="sheet" class="w-5 h-5 text-[#0B1D3A]"></i>
                <h3 class="text-base font-bold text-[#0B1D3A]">Live Google Sheet Connection</h3>
              </div>
              <button onclick="window.FPCL_CAPEX_SUITE.closeSheetModal()" class="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>
            <div class="text-xs text-slate-600 space-y-2">
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div class="font-bold text-slate-800 mb-1">Target Specification:</div>
                <div class="font-mono text-[11px] text-slate-700">Sheet ID: <strong>13ys4PbggcQq0H06Rh6cScAtdVnlrY-yyiWxA4e6dDzc</strong></div>
                <div class="font-mono text-[11px] text-slate-700">Tab Name: <strong>CAPEX</strong></div>
              </div>
              <p class="text-slate-600">
                To connect the dashboard live and pick updated rows, you can paste the Google Sheet URL (or published CSV link) below:
              </p>
            </div>
            <div>
              <label class="block text-[11px] font-bold uppercase text-slate-600 mb-1">Google Sheet URL / Published CSV Link</label>
              <input
                id="capex-custom-url-input"
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/13ys4PbggcQq0H06Rh6cScAtdVnlrY-yyiWxA4e6dDzc/..."
                value="${this.state.customSheetUrl || ''}"
                class="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 border border-[#CBD2DE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1D3A]/20"
              />
            </div>
            <div class="flex items-center justify-between pt-3 border-t border-[#E2E6EE]">
              <button
                onclick="window.FPCL_CAPEX_SUITE.clearCustomSheetUrl()"
                class="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                Reset
              </button>
              <div class="flex items-center gap-2">
                <button
                  onclick="window.FPCL_CAPEX_SUITE.closeSheetModal()"
                  class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onclick="window.FPCL_CAPEX_SUITE.saveCustomSheetUrl()"
                  class="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#0B1D3A] hover:bg-[#122B55] text-white shadow-xs cursor-pointer"
                >
                  Save & Sync Feed
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    },

    closeSheetModal() {
      const modal = document.getElementById('capex-sheet-modal-container');
      if (modal) modal.innerHTML = '';
    },

    saveCustomSheetUrl() {
      const input = document.getElementById('capex-custom-url-input');
      if (input) {
        const val = input.value.trim();
        this.state.customSheetUrl = val;
        try {
          if (val) localStorage.setItem('FPCL_CAPEX_CUSTOM_URL', val);
          else localStorage.removeItem('FPCL_CAPEX_CUSTOM_URL');
        } catch (e) {}
        this.closeSheetModal();
        this.syncLiveFeed({ silent: false });
      }
    },

    clearCustomSheetUrl() {
      this.state.customSheetUrl = '';
      try { localStorage.removeItem('FPCL_CAPEX_CUSTOM_URL'); } catch (e) {}
      this.closeSheetModal();
      this.syncLiveFeed({ silent: false });
    }
  };

  capexSuite.init();
})();
