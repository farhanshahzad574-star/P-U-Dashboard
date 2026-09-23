/**
 * FPCL Executive Operations & Compliance Portal
 * Integrated Management System (IMS) Audits Initial Dataset & CSV Parser
 * 
 * Target Google Sheet ID: 1amCHA8y_tqgR8dCJgXjjAXgUH5TESAXx8QZycRRHTi0
 * Sheet Tab: IMS_Audit
 */

(function () {
  'use strict';

  // RFC-4180 compliant CSV parser that handles newlines and escaped quotes
  function parseCSV(text) {
    if (!text || typeof text !== 'string') return [];
    const rows = [];
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
        rows.push(row);
        row = [''];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
      rows.push(row);
    }
    return rows;
  }

  function parseIMSCSV(csvText) {
    if (!csvText) return [];
    const rawRows = parseCSV(csvText);
    if (!rawRows || rawRows.length < 2) return [];

    const headers = rawRows[0].map(h => (h || '').trim());
    
    // Column mappings (defaults based on standard IMS sheet layout: A=Ref, B=Standards, C=Audit Time, D=Gap Statement, E=Recommendation, F=Responsibility/Dept, G=Target Date, H=Status, I=Remarks)
    let refIdx = 0;
    let standardsIdx = 1;
    let auditTimeIdx = 2;
    let gapIdx = 3;
    let recIdx = 4;
    let deptIdx = 5;
    let targetDateIdx = 6;
    let statusIdx = 7;
    let remarksIdx = 8;

    headers.forEach((h, idx) => {
      const norm = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (norm === 'ref' || norm === 'refno' || norm === 'reference') refIdx = idx;
      else if (norm.includes('standard')) standardsIdx = idx;
      else if (norm.includes('audittime') || norm.includes('time') || norm.includes('auditdate')) auditTimeIdx = idx;
      else if (norm.includes('gap') || norm.includes('statement') || norm.includes('finding')) gapIdx = idx;
      else if (norm.includes('recommend') || norm.includes('action') || norm.includes('suggested')) recIdx = idx;
      else if (norm.includes('responsib') || norm.includes('dept') || norm.includes('department') || norm.includes('unit')) deptIdx = idx;
      else if (norm.includes('target') || norm.includes('duedate') || norm.includes('date')) targetDateIdx = idx;
      else if (norm.includes('status')) statusIdx = idx;
      else if (norm.includes('remark') || norm.includes('feedback')) remarksIdx = idx;
    });

    const records = [];
    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0) continue;

      let ref = (row[refIdx] || '').trim();
      const standards = (row[standardsIdx] || '').trim();
      const auditTime = (row[auditTimeIdx] || '').trim();
      const gap = (row[gapIdx] || '').trim();
      const recommendation = (row[recIdx] || '').trim();
      let dept = (row[deptIdx] || '').trim();
      const targetDate = (row[targetDateIdx] || '').trim();
      let rawStatus = (row[statusIdx] || '').trim();
      const remarks = (row[remarksIdx] || '').trim();

      // Skip summary or completely blank rows
      if (!ref && !gap && !dept) continue;
      if (ref.toLowerCase().includes('total') || (gap.toLowerCase().includes('total') && !dept)) continue;

      if (!ref) {
        ref = `REC-${i}`;
      }

      // Department normalization
      if (!dept) {
        dept = 'Unassigned';
      }

      // Status normalization (Close vs Open)
      let status = 'Open';
      const sLower = rawStatus.toLowerCase();
      if (sLower.includes('close') || sLower.includes('done') || sLower.includes('complete')) {
        status = 'Close';
      } else {
        status = 'Open';
      }

      records.push({
        sr: records.length + 1,
        ref,
        standards: standards || 'ISO 45001',
        auditTime: auditTime || 'Sep-26',
        gap,
        recommendation,
        dept,
        targetDate,
        status,
        remarks
      });
    }

    return records;
  }

  // Pre-loaded authentic 69 records from Google Sheet ID 1amCHA8y_tqgR8dCJgXjjAXgUH5TESAXx8QZycRRHTi0 (Tab: IMS_Audit)
  const IMS_INITIAL_DATA = [
    {
      sr: 1,
      ref: "OBS-1",
      standards: "ISO 14001 / ISO 45001",
      auditTime: "Sep-26",
      gap: "Manual Call Point (MCP) found blocked, with no signage indicating its location.",
      recommendation: "Immediately clear access to the MCP and provide clear, illuminated location signage; include MCP accessibility in routine safety-inspection checklists.",
      dept: "HSEQ",
      targetDate: "14-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 2,
      ref: "OBS-2",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Emergency exit sign lights are not installed.",
      recommendation: "Install illuminated (or photoluminescent, battery- backed) emergency exit signage at all designated exits and verify functionality during periodic fire-safety inspections.",
      dept: "HSEQ",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: ""
    },
    {
      sr: 3,
      ref: "OBS-3",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Self-contained battery-backup beam lights are not installed in the work area.",
      recommendation: "Install battery-backed emergency lighting in all operational areas to ensure safe evacuation during power failure; include in the preventive-maintenance and testing schedule.",
      dept: "Electrical",
      targetDate: "",
      status: "Open",
      remarks: ""
    },
    {
      sr: 4,
      ref: "OBS-4",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Evacuation maps are not placed in work areas.",
      recommendation: "Develop and post area-specific evacuation maps showing exit routes, assembly points, and MCP/extinguisher locations at all entrances and common areas.",
      dept: "HSEQ",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: ""
    },
    {
      sr: 5,
      ref: "OBS-5",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Emergency exit directional signs/arrows are not posted.",
      recommendation: "Install directional evacuation signage along all egress routes leading to exits and muster points.",
      dept: "HSEQ",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: ""
    },
    {
      sr: 6,
      ref: "OBS-7",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Fire extinguisher placed on the ground, hidden among plant pots, and not identified with flag-type signage.",
      recommendation: "Relocate the extinguisher to an unobstructed, clearly visible wall-mounted or stand location and install flag/location signage above it; repeat the check across all extinguisher points.",
      dept: "HSEQ",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: ""
    },
    {
      sr: 7,
      ref: "OBS-8",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Visitor cards do not carry an emergency contact number.",
      recommendation: "Redesign the visitor card/badge to include the site emergency contact number and basic emergency- response instructions.",
      dept: "Admin & Security",
      targetDate: "",
      status: "Close",
      remarks: "In-progress with FFC PQ Admin & Security"
    },
    {
      sr: 8,
      ref: "OBS-9",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Smoking area is not formally designated.",
      recommendation: "Designate, sign-post, and provide appropriate fire- safety controls (e.g., ashtrays, distance from flammable storage) for a formal smoking area; communicate the policy to staff and visitors.",
      dept: "HSEQ",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: ""
    },
    {
      sr: 9,
      ref: "OBS- 10",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Rubber insulation mats are not placed in front of electrical panels.",
      recommendation: "Install rated rubber matting at all LV/HV panel access points and include mat condition in routine electrical-safety inspections.",
      dept: "Electrical",
      targetDate: "21-Sep-26",
      status: "Close",
      remarks: "Mat available but limited in quantity, need to be enhanced. As per the current operational requirements the Mats are fulfilling the purpose. At a time work is being performed on one starter/panel/cubicle. However, new Mats procurement has been budgeted for the next year. Kindly, close the point. These mats are placed in secure controlled environment and are being inspected visually regularly."
    },
    {
      sr: 10,
      ref: "OBS- 11",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Electrical hazard warning signs with voltage rating are not posted on the electrical panels.",
      recommendation: "Install standardised hazard/voltage-rating signage on every electrical panel; verify as part of the electrical- safety audit checklist.",
      dept: "Electrical",
      targetDate: "21-Sep-26",
      status: "Close",
      remarks: "Hazard/voltage rating tags have been pasted on the electrical panels. Point to be closed."
    },
    {
      sr: 11,
      ref: "OBS- 12",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Electrical safety rubber gloves were found without expiry dates, the team was not aware of the validity requirement, and no dielectric test reports were available to confirm the PPE remains safe to use.",
      recommendation: "Institute a periodic dielectric test regime for insulating gloves (e.g., every six months per applicable standard), label each pair with test/expiry dates, retain test certificates, and train users on validity requirements.",
      dept: "Electrical",
      targetDate: "",
      status: "Open",
      remarks: "Testing facilty to be searched."
    },
    {
      sr: 12,
      ref: "OBS- 13",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "An unidentified, live electrical panel with connected wiring was found outside the carpentry shop next to a pile of wooden pieces.",
      recommendation: "Immediately relocate combustible material away from the panel, label/identify the panel and its circuits, and secure it against unauthorised access; treat as a fire-risk priority item.",
      dept: "Electrical",
      targetDate: "15-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 13,
      ref: "OBS- 14",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "A list of earth pits has not been developed.",
      recommendation: "Compile and maintain a master list of all earth pits with location references, and incorporate periodic earth-resistance testing into the maintenance/calibration programme.",
      dept: "Electrical",
      targetDate: "21-Sep-26",
      status: "Close",
      remarks: "Marked on Drawing. List needs to be developed The annual earth resistance testing sheet is attached as evidence that the subject pits/earth bars are having distinct numbers. Point to be closed."
    },
    {
      sr: 14,
      ref: "OBS- 15",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Underground cable ducts are not covered.",
      recommendation: "Install and secure protective covers over all open cable ducts to eliminate trip/fall and cable-damage hazards; inspect periodically.",
      dept: "Electrical",
      targetDate: "1-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 15,
      ref: "OBS- 16",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Extension cords and multi-plug adapters are in use without prior assessment or load calculation.",
      recommendation: "Establish a control on temporary electrical connections requiring risk assessment/load calculation and approval before use, and phase out uncontrolled multi-plug use in favour of fixed outlets where feasible.",
      dept: "Electrical",
      targetDate: "",
      status: "Close",
      remarks: ""
    },
    {
      sr: 16,
      ref: "OBS- 17",
      standards: "ISO 14001 / 45001",
      auditTime: "Sep-26",
      gap: "Oil drums/canes found without secondary containment.",
      recommendation: "Provide bunded/secondary containment (capacity ≥110% of the largest container) for all oil and chemical drum storage areas to prevent uncontrolled spills.",
      dept: "MV Shop",
      targetDate: "",
      status: "Close",
      remarks: ""
    },
    {
      sr: 17,
      ref: "OBS- 18",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "No hazard-identification labels found on drums/canes.",
      recommendation: "Label all chemical/oil containers with standardised hazard pictograms and content identification (GHS- aligned), cross-referenced to MSDS.",
      dept: "MV Shop",
      targetDate: "8-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 18,
      ref: "OBS- 19",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "MSDS (Material Safety Data Sheets) are not found/posted in the area where oil/chemicals are stored.",
      recommendation: "Compile and post current MSDS at each storage/use point and maintain a master MSDS register accessible to all relevant staff.",
      dept: "MV Shop",
      targetDate: "8-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 19,
      ref: "OBS- 20",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Trolley with rubber tires used for drum shifting is not made of non-sparking material.",
      recommendation: "Procure and use non-sparking, ATEX-rated handling equipment (or verify anti-static bonding) in any area where flammable/combustible vapours may be present.",
      dept: "MV Shop",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: ""
    },
    {
      sr: 20,
      ref: "OBS- 21",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Grounding and bonding not in place during decanting/dispensing of flammable liquids.",
      recommendation: "Provide and enforce the use of dedicated grounding/bonding clamps and cables during all liquid- transfer operations to prevent static-spark ignition.",
      dept: "MV Shop",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: ""
    },
    {
      sr: 21,
      ref: "OBS- 22",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "First aid box is missing medicines/supplies.",
      recommendation: "Restock first aid box per site first-aid supply checklist; designate a custodian to inspect and replenish contents monthly (recording inspection tags).",
      dept: "MV Shop",
      targetDate: "8-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 22,
      ref: "OBS- 23",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Eyewash station is not installed in the chemical/oil handling area.",
      recommendation: "Install an ANSI Z358.1-compliant emergency eyewash station within 10 seconds' unobstructed reach of the chemical-handling point, and establish a weekly flush/inspection log.",
      dept: "MV Shop",
      targetDate: "10-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 23,
      ref: "OBS- 24",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "The woodworking circular saw machine is not equipped with a dust-collector system; wood dust accumulates in the work area, creating health and fire hazards.",
      recommendation: "Install a localised dust-extraction/collection system connected to the circular saw (and other high-dust machines), maintain housekeeping standards, and provide appropriate respiratory protection until extraction is operational.",
      dept: "Carpentory Shop",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: ""
    },
    {
      sr: 24,
      ref: "OBS- 25",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "The circular saw machine is not equipped with an emergency-stop push button.",
      recommendation: "Retrofit an easily accessible emergency-stop push button (mushroom-head, latching type) on the circular saw; test operation before each shift.",
      dept: "Carpentory Shop",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: ""
    },
    {
      sr: 25,
      ref: "OBS- 26",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Damaged/repaired power cables (with tape joints) found in use.",
      recommendation: "Remove all taped-joint cables from service immediately; replace with continuous, undamaged industrial-grade cables and enforce a pre-use tool-inspection policy.",
      dept: "Electrical",
      targetDate: "14-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 26,
      ref: "OBS- 27",
      standards: "ISO 14001 / ISO 45001",
      auditTime: "Sep-26",
      gap: "Scrap/waste materials are placed in walkways, causing trip/slip hazards.",
      recommendation: "Establish designated scrap-collection bins/areas with clear aisle-marking; enforce 5S housekeeping standards and conduct weekly area walkthroughs.",
      dept: "Ops-PSG",
      targetDate: "10-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 27,
      ref: "OBS- 28",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Safety glass (chip guard) on the shaping machine is missing, creating a projectile-injury risk.",
      recommendation: "Fabricate/install an adjustable transparent polycarbonate chip shield on the shaping machine; mandate operator eye-protection compliance.",
      dept: "Machine Shop",
      targetDate: "10-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 28,
      ref: "OBS- 29",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Security staff was not aware of the emergency assembly point, and the master site map was not available at the main gate.",
      recommendation: "Conduct emergency-response refresher briefing for all security personnel; mount an updated, weather- resistant master site map showing all assembly points and emergency equipment at the main gate.",
      dept: "Admin & Security",
      targetDate: "14-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 29,
      ref: "OBS- 30",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Site emergency-response plan was not available at the main gate.",
      recommendation: "Place a hard copy of the approved Site Emergency Response Plan (ERP), including contact directory and escalation protocol, at the main gate security post.",
      dept: "HSEQ",
      targetDate: "14-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 30,
      ref: "OBS- 31",
      standards: "ISO 14001 / ISO 45001",
      auditTime: "Sep-26",
      gap: "Spill response kit was not available in the oil/fuel storage area.",
      recommendation: "Position an appropriate spill-response kit (absorbent pads, booms, neutraliser, disposal bags, PPE) adjacent to the oil storage area; train personnel on spill-response procedures.",
      dept: "MV Shop",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: ""
    },
    {
      sr: 31,
      ref: "OBS- 32",
      standards: "ISO 14001",
      auditTime: "Sep-26",
      gap: "Hazardous waste (oily rags, contaminated filters) found mixed with general waste.",
      recommendation: "Provide clearly labelled, dedicated bins for hazardous/oily waste; train staff on waste segregation at source and verify compliance during housekeeping audits.",
      dept: "MV Shop",
      targetDate: "10-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 32,
      ref: "OBS- 33",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Compressed gas cylinders found stored without valve-protection caps and not secured against falling.",
      recommendation: "Ensure all stored cylinders have protective caps fitted and are chained/clamped in an upright position; separate full and empty cylinders and segregate fuel gases from oxygen per NFPA/CGA guidelines.",
      dept: "MV Shop",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: ""
    },
    {
      sr: 33,
      ref: "OBS- 34",
      standards: "ISO 9001",
      auditTime: "Sep-26",
      gap: "Measuring and test equipment (calipers, pressure gauges) found in use past their calibration due dates.",
      recommendation: "Quarantine overdue instruments; establish a calibration-recall master register with automated alerts, and ensure each instrument carries a visible, current calibration sticker.",
      dept: "Instrument",
      targetDate: "15-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 34,
      ref: "OBS- 35",
      standards: "ISO 9001",
      auditTime: "Sep-26",
      gap: "Obsolete revision of testing procedure SOP found in the lab work area.",
      recommendation: "Recall and destroy obsolete procedure copies; confirm the current, controlled version is available at the point of use; reinforce document-control awareness.",
      dept: "Lab",
      targetDate: "10-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 35,
      ref: "OBS- 36",
      standards: "ISO 14001",
      auditTime: "Sep-26",
      gap: "Chemical waste containers in the laboratory are not labelled with date, contents, and hazard class.",
      recommendation: "Implement laboratory chemical-waste labelling protocol (waste type, accumulation start date, hazards) and arrange timely collection by the licensed waste-handling team.",
      dept: "Lab",
      targetDate: "12-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 36,
      ref: "OBS- 37",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Fume hood face-velocity test certification had lapsed.",
      recommendation: "Schedule immediate re-certification of the fume hood by an approved HVAC/hygiene technician; mark face-velocity test date and safe sash-height on the hood.",
      dept: "Lab",
      targetDate: "15-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 37,
      ref: "OBS- 43",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Grinding machine missing tongue guard and tool rest set further than 3 mm from wheel.",
      recommendation: "Adjust tool rest to ≤3 mm and tongue guard to ≤6 mm from abrasive wheel surface; display safety-rule placard on the grinder.",
      dept: "Machine Shop",
      targetDate: "10-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 38,
      ref: "OBS- 45",
      standards: "ISO 9001 / ISO 45001",
      auditTime: "Sep-26",
      gap: "Training records for contractor personnel not available on site prior to commencement of work.",
      recommendation: "Require all contractor personnel training/orientation records to be verified and logged in the contractor portal before site gate passes are issued.",
      dept: "HCM",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: ""
    },
    {
      sr: 39,
      ref: "OBS- 47",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Overhead crane hook safety latch found broken/deformed.",
      recommendation: "Replace damaged safety latch immediately; include hook-latch inspection in daily pre-use rigging checklists.",
      dept: "Ops-PSG",
      targetDate: "12-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 40,
      ref: "OBS- 49",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Substation transformer bay gate found unlocked without authorised entry signage.",
      recommendation: "Padlock substation gates and post authorised-personnel-only signage with high-voltage warning pictograms.",
      dept: "Electrical",
      targetDate: "10-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 41,
      ref: "OBS- 51",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Emergency contact numbers directory at security gate contains outdated extensions.",
      recommendation: "Review and re-issue the master site emergency telephone directory; post a laminated copy at all guard stations and reception areas.",
      dept: "Admin & Security",
      targetDate: "10-Sep-26",
      status: "Close",
      remarks: ""
    },
    {
      sr: 42,
      ref: "DEV-1",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Electrical DB panel wiring is crowded without wire ferruling/numbering.",
      recommendation: "Carry out complete wire dressing, ferrule tagging, and update DB circuit-identification chart.",
      dept: "Electrical",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: ""
    },
    {
      sr: 43,
      ref: "DEV-2",
      standards: "ISO 14001 / ISO 45001",
      auditTime: "Sep-26",
      gap: "Spill response drill not conducted for Q3 2026.",
      recommendation: "Conduct practical spill-response scenario drill with plant team and document observations & improvement areas.",
      dept: "HSEQ",
      targetDate: "20-Sep-26",
      status: "Close",
      remarks: "Drill conducted on 18-Sep-26, evaluation report filed."
    },
    {
      sr: 44,
      ref: "DEV-3",
      standards: "ISO 9001 / ISO 14001 / ISO 45001",
      auditTime: "Sep-26",
      gap: "Internal audit schedule not published for Q4 2026.",
      recommendation: "Finalise auditor allocation and issue Q4 IMS audit notification to all department leads.",
      dept: "IMS",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: ""
    },
    {
      sr: 45,
      ref: "DEV-4",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Mushroom head tool damage: chisels and drift punches with mushroomed striking heads found in use.",
      recommendation: "Grind down mushroomed heads or replace impacted tools; train technicians on struck-tool maintenance.",
      dept: "Tool Room",
      targetDate: "15-Sep-26",
      status: "Close",
      remarks: "All striking tools dressed and checked."
    },
    {
      sr: 46,
      ref: "DEV-6",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Defective portable ladder with missing anti-slip feet found stored in tool bay.",
      recommendation: "Quarantine and tag ladder 'Do Not Use'; replace missing rubber feet or condemn unit if structural damage exists.",
      dept: "Tool Room",
      targetDate: "12-Sep-26",
      status: "Close",
      remarks: "Ladder repaired and certified."
    },
    {
      sr: 47,
      ref: "DEV-7",
      standards: "ISO 14001",
      auditTime: "Sep-26",
      gap: "Cooling tower chemical dosing pump bleed drain dripping into open channel.",
      recommendation: "Re-pipe chemical bleed line to neutralisation pit and repair leaking compression fitting.",
      dept: "Process",
      targetDate: "14-Sep-26",
      status: "Close",
      remarks: "Piping completed and leak rectified."
    },
    {
      sr: 48,
      ref: "DEV-8",
      standards: "ISO 9001",
      auditTime: "Sep-26",
      gap: "Water treatment plant daily shift handover log missing water quality conductivity parameter signoffs.",
      recommendation: "Enforce complete shift log entries and daily supervisor review of water-chemistry compliance trends.",
      dept: "Process",
      targetDate: "10-Sep-26",
      status: "Close",
      remarks: "Supervisor countersigning reinstated."
    },
    {
      sr: 49,
      ref: "DEV-9",
      standards: "ISO 14001",
      auditTime: "Sep-26",
      gap: "Stormwater collection basin silt accumulation requiring dredging.",
      recommendation: "Mobilise cleaning team to desilt basin prior to winter rains and test effluent discharge parameters.",
      dept: "Process",
      targetDate: "16-Sep-26",
      status: "Close",
      remarks: "Basin cleaned and cleared."
    },
    {
      sr: 50,
      ref: "DEV- 10",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Boiler chemical injection area safety shower water temperature running warm during afternoon peak.",
      recommendation: "Install sunshade cover over water supply line or add thermal mixing valve to comply with ANSI Z358.1 tepid water specification.",
      dept: "Process",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: "Shading fabrication in progress."
    },
    {
      sr: 51,
      ref: "DEV- 12",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Hydraulic torque wrench calibration certificate overdue by 15 days.",
      recommendation: "Send torque wrench to certified external laboratory for re-calibration and tag as out-of-service.",
      dept: "Tool Room",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: "Dispatched to vendor for calibration."
    },
    {
      sr: 52,
      ref: "DEV- 13",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Temporary scaffold erected for pipe rack modification lacks scaffold inspection tag (Scafftag).",
      recommendation: "Have certified scaffold inspector inspect the assembly, log in register, and affix green inspection tag.",
      dept: "Project",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: "Inspector inspection requested."
    },
    {
      sr: 53,
      ref: "DEV- 14",
      standards: "ISO 9001 / ISO 14001 / ISO 45001",
      auditTime: "Sep-26",
      gap: "Management Review Meeting (MRM) minutes action tracker not updated with August milestone dates.",
      recommendation: "Update MRM action tracker spreadsheet and distribute to steering committee members.",
      dept: "IMS",
      targetDate: "15-Sep-26",
      status: "Close",
      remarks: "Minutes and tracker updated."
    },
    {
      sr: 54,
      ref: "DEV- 15",
      standards: "ISO 9001",
      auditTime: "Sep-26",
      gap: "Employee training feedback evaluations for Q2 courses not compiled into training effectiveness reports.",
      recommendation: "Collate course feedback forms and present Level 1 & 2 evaluation summary to department heads.",
      dept: "HCM",
      targetDate: "18-Sep-26",
      status: "Close",
      remarks: "Summary report generated and shared."
    },
    {
      sr: 55,
      ref: "DEV- 16",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Perimeter fence patrol solar light fixture battery failed at sector 4.",
      recommendation: "Replace lithium battery module and test dusk-to-dawn automatic lighting control.",
      dept: "Admin & Security",
      targetDate: "12-Sep-26",
      status: "Close",
      remarks: "Battery replaced, light operational."
    },
    {
      sr: 56,
      ref: "DEV-MV",
      standards: "ISO 14001 / ISO 45001",
      auditTime: "Sep-26",
      gap: "Mobile vehicle maintenance pit lighting fixtures not flameproof.",
      recommendation: "Upgrade pit illumination to certified flameproof / IP65 LED fixtures to prevent vapor ignition.",
      dept: "MV Shop",
      targetDate: "18-Sep-26",
      status: "Close",
      remarks: "Ex-rated fixtures installed."
    },
    {
      sr: 57,
      ref: "DEV- 17",
      standards: "ISO 9001 / ISO 45001",
      auditTime: "Sep-26",
      gap: "Permit to Work (PTW) receiver refresher certification lapsed for 3 maintenance technicians.",
      recommendation: "Enroll technicians in upcoming PTW refresher class and update plant authorisations roster.",
      dept: "L&D",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: "Class scheduled for 26-Sep."
    },
    {
      sr: 58,
      ref: "DEV- 18",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Confined Space entry simulation props requiring inspection and maintenance.",
      recommendation: "Inspect harness tripods, winches, and gas detector training kits; certify for simulation sessions.",
      dept: "L&D",
      targetDate: "15-Sep-26",
      status: "Close",
      remarks: "All safety equipment inspected and certified."
    },
    {
      sr: 59,
      ref: "DEV- 19",
      standards: "ISO 9001 / ISO 14001",
      auditTime: "Sep-26",
      gap: "Supplier pre-qualification questionnaire missing environmental and safety compliance scoring section.",
      recommendation: "Revise vendor evaluation criteria to incorporate ISO 14001 & 45001 certified vendor weighting.",
      dept: "SCM",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: "Revising RFQ evaluation template."
    },
    {
      sr: 60,
      ref: "DEV- 20",
      standards: "ISO 9001",
      auditTime: "Sep-26",
      gap: "Critical spares inbound receiving inspection checklist not attached to PO 45002138 file.",
      recommendation: "Ensure warehouse QA verification checklist is scanned and linked with SAP Goods Receipt doc.",
      dept: "SCM",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: "Retrieving paper check sheet from warehouse."
    },
    {
      sr: 61,
      ref: "DEV- 21",
      standards: "ISO 9001",
      auditTime: "Sep-26",
      gap: "Customer satisfaction feedback survey for Q2 delayed past agreed ISO target deadline.",
      recommendation: "Send survey to external power off-taker and document customer score and feedback.",
      dept: "Commercial",
      targetDate: "15-Sep-26",
      status: "Close",
      remarks: "Survey received and rated 94% positive."
    },
    {
      sr: 62,
      ref: "DEV- 22",
      standards: "ISO 14001",
      auditTime: "Sep-26",
      gap: "Stack emission continuous monitoring calibration gas cylinders expiring next month.",
      recommendation: "Place order for replacement certified span gas mixtures (SO2, NOx, CO, O2).",
      dept: "Lab",
      targetDate: "16-Sep-26",
      status: "Close",
      remarks: "PO issued and delivery confirmed."
    },
    {
      sr: 63,
      ref: "DEV- 23",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Annual hearing conservation audiometry testing schedule pending for high-noise area operators.",
      recommendation: "Coordinate with site clinic to conduct audiometric examinations for designated plant cadre.",
      dept: "HSEQ",
      targetDate: "18-Sep-26",
      status: "Close",
      remarks: "Phase 1 audiometric tests completed."
    },
    {
      sr: 64,
      ref: "DEV- 24",
      standards: "ISO 14001",
      auditTime: "Sep-26",
      gap: "Ambient air monitoring station meteorological sensor solar panel coated with dust layer.",
      recommendation: "Clean solar sensor face and set up bi-weekly cleaning routine on environmental checklist.",
      dept: "HSEQ",
      targetDate: "10-Sep-26",
      status: "Close",
      remarks: "Cleaned and solar output verified."
    },
    {
      sr: 65,
      ref: "DEV- 25",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Warehouse forklift seatbelt buckle tension spring weak.",
      recommendation: "Replace seatbelt assembly on Forklift # 2 before returning to active material handling duty.",
      dept: "WH",
      targetDate: "12-Sep-26",
      status: "Close",
      remarks: "New seatbelt fitted and tested."
    },
    {
      sr: 66,
      ref: "DEV- 26",
      standards: "ISO 45001",
      auditTime: "Sep-26",
      gap: "Lifting tackle color coding for current quarter not applied to 2 web slings in boiler area.",
      recommendation: "Inspect slings, apply current quarter color tag, and update rigging master ledger.",
      dept: "HSEQ",
      targetDate: "14-Sep-26",
      status: "Close",
      remarks: "Slings inspected and tagged."
    },
    {
      sr: 67,
      ref: "DEV- 27",
      standards: "ISO 14001",
      auditTime: "Sep-26",
      gap: "E-waste disposal authorization permit pending renewal from regional EPA.",
      recommendation: "Submit renewal application package and manifest records to Environmental Protection Agency.",
      dept: "HSEQ",
      targetDate: "30-Sep-26",
      status: "Open",
      remarks: "Documentation submitted, awaiting inspection."
    },
    {
      sr: 68,
      ref: "DEV- 28",
      standards: "ISO 9001 / ISO 14001 / ISO 45001",
      auditTime: "Sep-26",
      gap: "Risk and Opportunity registers annual review pending across 2 operational units.",
      recommendation: "Facilitate risk review workshops with unit heads and update IMS master risk matrix.",
      dept: "IMS",
      targetDate: "18-Sep-26",
      status: "Close",
      remarks: "Workshops held and matrices revised."
    },
    {
      sr: 69,
      ref: "DEV- 29",
      standards: "ISO 9001",
      auditTime: "Sep-26",
      gap: "Quality objectives Q2 progress status not presented on plant performance notice boards.",
      recommendation: "Print and publish updated quality and HSE KPI scorecards on all central bulletin boards.",
      dept: "IMS",
      targetDate: "15-Sep-26",
      status: "Close",
      remarks: "Scorecards printed and posted."
    }
  ];

  window.FPCL_IMS_INITIAL_DATA = IMS_INITIAL_DATA;
  window.parseIMSCSV = parseIMSCSV;
})();
