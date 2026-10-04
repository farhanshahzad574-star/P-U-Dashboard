/**
 * Management Safety Audit (MSA) Dataset & Seed Definitions
 * Google Sheet ID: 11ggCusY-ZJj09bVcpbikHeupyvFTBxDHlytjhpbNRWw
 * Tabs: MSA (Observations) & MSA_Compliance (Department Compliance)
 */

(function () {
  'use strict';

  // Seed data from published Google Sheet tab: MSA
  window.FPCL_MSA_INITIAL_SEED = [
    {
      sr: '1',
      auditDate: '31-Mar-26',
      auditedBy: 'Karar Naqvi',
      areaInspected: 'Coal unloading, truck parking & associated area',
      observation: 'Helper was moving under the trailer during washing while the the truck was in start condition and driver was present inside the cabin',
      injuryPotential: 'Fatality',
      actionTaken: 'Stopped washing activity immediately. Asked Helper to come out. Informed driver to shut off engine. Washing resumed',
      groupResponsibleDept: 'P&D',
      groupResponsibleUnit: 'MV Shop',
      status: 'Close',
      targetDate: 'Rectified'
    },
    {
      sr: '2',
      auditDate: '31-Mar-26',
      auditedBy: 'Karar Naqvi',
      areaInspected: 'Coal unloading, truck parking & associated area',
      observation: "Main Door of Contract's office broken",
      injuryPotential: 'None',
      actionTaken: 'Communicated to HCM for priority rectification',
      groupResponsibleDept: 'P&D',
      groupResponsibleUnit: 'MV Shop',
      status: 'Open',
      targetDate: 'Rectified'
    },
    {
      sr: '3',
      auditDate: '31-Mar-26',
      auditedBy: 'Karar Naqvi',
      areaInspected: 'Coal unloading, truck parking & associated area',
      observation: 'Electric Water Cooler fell during hurricane and got damaged',
      injuryPotential: 'None',
      actionTaken: 'Informed Admin to rectify',
      groupResponsibleDept: 'Admin & Security',
      groupResponsibleUnit: 'Admin & Security',
      status: 'Close',
      targetDate: 'HCM to share'
    },
    {
      sr: '4',
      auditDate: '31-Mar-26',
      auditedBy: 'Karar Naqvi',
      areaInspected: 'Coal unloading, truck parking & associated area',
      observation: 'Padestal fan in Guard room at Gate # 09 plugged in with bare wires without plug',
      injuryPotential: 'Fatality',
      actionTaken: 'Fan stopped and Informed Admin to rectify',
      groupResponsibleDept: 'Admin & Security',
      groupResponsibleUnit: 'Admin & Security',
      status: 'Close',
      targetDate: 'Admin to share'
    },
    {
      sr: '5',
      auditDate: '31-Mar-26',
      auditedBy: 'Karar Naqvi',
      areaInspected: 'Coal unloading, truck parking & associated area',
      observation: 'No proper ventilation in Kitchen at Gate # 09 due to non-availability of fan and exhaust fan',
      injuryPotential: 'None',
      actionTaken: 'Informed Admin to check feasibility',
      groupResponsibleDept: 'Admin & Security',
      groupResponsibleUnit: 'Admin & Security',
      status: 'OPEN',
      targetDate: 'Admin to share'
    }
  ];

  // Seed data from published Google Sheet tab: MSA_Compliance
  window.FPCL_MSA_COMPLIANCE_INITIAL_SEED = [
    {
      sr: '1',
      department: 'P&D',
      plannedMsa: 12,
      actualMsa: 9,
      remainingMsa: 3,
      complianceRate: 75.0
    },
    {
      sr: '2',
      department: 'Electrical',
      plannedMsa: 12,
      actualMsa: 8,
      remainingMsa: 4,
      complianceRate: 66.7
    },
    {
      sr: '3',
      department: 'Machinery',
      plannedMsa: 12,
      actualMsa: 7,
      remainingMsa: 5,
      complianceRate: 58.3
    }
  ];
})();
