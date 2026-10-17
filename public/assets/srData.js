/**
 * FPCL Executive Operations & Compliance Portal
 * SR (Safety Review) Initial Seed Dataset & Cache Manager
 * 
 * Google Sheet ID: 1V-klVfZrARyMBsjodjF52aQe6dzLtuBq64bgqcPAF1c
 * Tab: SR
 * 
 * Target Scope & Isolation: Performs operations strictly for sheet ID
 * 1V-klVfZrARyMBsjodjF52aQe6dzLtuBq64bgqcPAF1c and Tab named SR.
 */

(function () {
  'use strict';

  // Initial Seed Data directly mirrored from published Google Sheet
  const FPCL_SR_INITIAL_SEED = [
    {
      id: "1",
      notification: "25400000502",
      date: "4-Jan-24",
      createdBy: "OPSHFTCASH",
      description: "Manual bag-filling mechanism at ACU",
      problemStatement: "At Ash classification unit Micro fly ash product is being filled in the bags manually causing ash disperses in the area, and creating housekeeping issues. Therefore, a manual bag-filling mechanism for the micro ash product is required to prevent the spread of dust in the area.",
      priority: "Normal",
      receivedByTechnical: "Received by Technical",
      notificationStatus: "Closed"
    },
    {
      id: "2",
      notification: "25400000503",
      date: "13-Jan-24",
      createdBy: "AKHAN10",
      description: "Install Deflector plate at vol.feeder",
      problemStatement: "During utilization of coal blend of Local Lignite & imported sub-bituminous in Boilers, following major issues are observed in coal volumetric feeders.\n-Motor high amperes due to high drag force\n-Frequent choking of coal feeders\n-Chain links failure issue\nIn order to control above mentioned issues it is proposed to install deflector plates inside coal volumetric feeders as per HPS recommendation in closeout meeting, dated January 11, 2024.",
      priority: "Normal",
      receivedByTechnical: "Received by Technical",
      notificationStatus: "Closed"
    },
    {
      id: "3",
      notification: "25400000504",
      date: "5-Mar-24",
      createdBy: "UYAQOOB",
      description: "Inst Air Header For Thermal Coating Job",
      problemStatement: "Instrument Air Header Sizing Required To Execute Thermal Spray Coating Job During Boiler Outages\n\nCurrent Position:\nCurrently FPCL has 01 air header which was supplied with package supply by M/s LLC Russia. This header can suffice / support 02 thermal coating machines & 02 sand blasting setups.\n\nFuture Requirement:\nAs during ATA-2025, all thermal coating job scope will be executed in-house by FPCL team so new header is required to be designed and fabricated to facilitate 05 EA thermal spray machines, 05 EA sand blasting setups & 02 EA breathing air units.\n\nHereby, it is requested from process team to share the approved process package so that same can be shared with engineering team for IFC package and fabrication in workshop accordingly.\n\nKindly note that we have standard inlet & outlet connections for machines with specific air parameters so these should be considered in design. Also, while designing consider the existing compressors capacity to suffice the requirement.",
      priority: "Urgent",
      receivedByTechnical: "Received by Technical",
      notificationStatus: "Closed"
    }
  ];

  window.FPCL_SR_INITIAL_SEED = FPCL_SR_INITIAL_SEED;

  // Initialize or restore active dataset from localStorage if available
  try {
    const cached = localStorage.getItem('FPCL_SR_CACHE');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        window.FPCL_SR_DATA = parsed;
      } else {
        window.FPCL_SR_DATA = FPCL_SR_INITIAL_SEED.slice();
      }
    } else {
      window.FPCL_SR_DATA = FPCL_SR_INITIAL_SEED.slice();
    }
  } catch (e) {
    window.FPCL_SR_DATA = FPCL_SR_INITIAL_SEED.slice();
  }
})();
