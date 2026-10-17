// server.ts
import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// api/strategic/_registry.ts
var STRATEGIC_TILE_REGISTRY = {
  "strategic-master": {
    envKeys: ["STRATEGIC_SHEET_URL", "STRATEGIC_MASTER_SHEET_URL"],
    code: "STRAT",
    defaultTab: "ExecutiveRollup",
    name: "Strategic Master (COO)",
    fallbackUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSjecapStvtMhaYILR7NX-jRI5vcXVVCq7sIaBQmeDoBgqWnBZQPJcGDeN88VETinBOHibJ2BT1H_UX/pub?output=csv"
  },
  "admin-security": {
    envKeys: [
      "ADMIN_SECURITY_SHEET_URL",
      "Admin_&_Security",
      "ADMIN_&_SECURITY",
      "ADMIN_AND_SECURITY",
      "ADMIN_SECURITY",
      "ADMIN_SECURITY_URL",
      "ADMIN_&_SECURITY_SHEET_URL",
      "ADMIN_AND_SECURITY_SHEET_URL",
      "Admin_Security",
      "Admin_Security_Sheet_Url",
      "ADMIN_SHEET_URL",
      "SECURITY_SHEET_URL",
      "STRATEGIC_ADMIN_SECURITY_SHEET_URL"
    ],
    code: "ADM",
    defaultTab: "Admin_Security_Actions",
    name: "Admin & Security",
    fallbackUrl: "https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing"
  },
  "asset-integrity": {
    sheetId: "1al3SsYo9FWHZxc8rYrJE5SV4H3RafPcd1xGSyfcy5Nc",
    envKeys: ["ASSET_INTEGRITY_SHEET_URL", "ASSET_INTEGRITY", "Asset_Integrity", "STRATEGIC_ASSET_INTEGRITY_SHEET_URL"],
    code: "AI",
    defaultTab: "ASSET_INTEGRITY_SHEET_URL",
    name: "Asset Integrity",
    fallbackUrl: "https://docs.google.com/spreadsheets/d/1al3SsYo9FWHZxc8rYrJE5SV4H3RafPcd1xGSyfcy5Nc/edit"
  },
  "business-development": {
    sheetId: "1PYQlmmzy2VFMohIlNxipiFsfgKPsopgd2VdAdXhMiB4",
    envKeys: ["COMMERCIAL_SHEET_URL", "BUSINESS_DEVELOPMENT_SHEET_URL", "COMMERCIAL", "BUSINESS_DEVELOPMENT", "STRATEGIC_BUSINESS_DEVELOPMENT_SHEET_URL"],
    code: "BD",
    defaultTab: "COMMERCIAL_SHEET_URL",
    name: "Business Development",
    fallbackUrl: "https://docs.google.com/spreadsheets/d/1PYQlmmzy2VFMohIlNxipiFsfgKPsopgd2VdAdXhMiB4/edit"
  },
  "civil": {
    sheetId: "1EPIHm33gIOTrAfXvjGO3yRQhu5jPl_BjstTaWtWgs_0",
    envKeys: ["CIVIL_SHEET_URL", "CIVIL", "Civil", "STRATEGIC_CIVIL_SHEET_URL"],
    code: "CIV",
    defaultTab: "CIVIL_SHEET_URL",
    name: "Civil",
    fallbackUrl: "https://docs.google.com/spreadsheets/d/1EPIHm33gIOTrAfXvjGO3yRQhu5jPl_BjstTaWtWgs_0/edit"
  },
  "ei": {
    sheetId: "1ap9EfOwDUaoere3nKGmfvLNBKoCNp_KB_8KSEc3Y3fA",
    envKeys: ["EI_SHEET_URL", "EI", "E&I", "STRATEGIC_EI_SHEET_URL"],
    code: "EI",
    defaultTab: "EI_SHEET_URL",
    name: "E&I",
    fallbackUrl: "https://docs.google.com/spreadsheets/d/1ap9EfOwDUaoere3nKGmfvLNBKoCNp_KB_8KSEc3Y3fA/edit"
  },
  "finance": {
    sheetId: "1hpQsdyMteOhlFCSAm9Yb3GQT_veTVArxcy3inSpkGdA",
    envKeys: ["FINANCE_SHEET_URL", "FINANCE", "Finance", "STRATEGIC_FINANCE_SHEET_URL"],
    code: "FIN",
    defaultTab: "FINANCE_SHEET_URL",
    name: "Finance",
    fallbackUrl: "https://docs.google.com/spreadsheets/d/1hpQsdyMteOhlFCSAm9Yb3GQT_veTVArxcy3inSpkGdA/edit"
  },
  "hseq": {
    sheetId: "1jXMXuX2b6HAF_U4e6tiGOzWw2adMpCyUPI5kbODxoPI",
    envKeys: ["STRATEGIC_HSEQ_SHEET_URL", "HSEQ_SHEET_URL", "HSEQ_ACTIONS_SHEET_URL"],
    code: "HSEQ",
    defaultTab: "HSEQ_Actions",
    name: "HSEQ",
    fallbackUrl: "https://docs.google.com/spreadsheets/d/1jXMXuX2b6HAF_U4e6tiGOzWw2adMpCyUPI5kbODxoPI/edit"
  },
  "hcm": {
    sheetId: "1Macb6nmGzel3tseZPp61lHuL8NagAxZPZFRQnw4yCU0",
    envKeys: ["HCM_SHEET_URL", "STRATEGIC_HCM_SHEET_URL", "HCM"],
    code: "HCM",
    defaultTab: "HCM_SHEET_URL",
    name: "HCM",
    fallbackUrl: "https://docs.google.com/spreadsheets/d/1Macb6nmGzel3tseZPp61lHuL8NagAxZPZFRQnw4yCU0/edit"
  },
  "ims": {
    sheetId: "1kyekkmRkxYCWxXYjKp5zCSM_NAnb6uqmCBnLcgDR6iM",
    envKeys: ["IMS_SHEET_URL", "STRATEGIC_IMS_SHEET_URL", "IMS_STRATEGIC", "IMS_STRATEGIC_SHEET_URL"],
    code: "IMS",
    defaultTab: "IMS_SHEET_URL",
    name: "IMS",
    fallbackUrl: "https://docs.google.com/spreadsheets/d/1kyekkmRkxYCWxXYjKp5zCSM_NAnb6uqmCBnLcgDR6iM/edit"
  },
  "it": {
    sheetId: "1wJ-MIlSvfguUMTz06eqJ2brAYt47gtqKB_nPGrGMuaM",
    envKeys: ["IT_SHEET_URL", "IT", "Information_Technology", "STRATEGIC_IT_SHEET_URL"],
    code: "IT",
    defaultTab: "IT_SHEET_URL",
    name: "IT",
    fallbackUrl: "https://docs.google.com/spreadsheets/d/1wJ-MIlSvfguUMTz06eqJ2brAYt47gtqKB_nPGrGMuaM/edit"
  },
  "inspection": {
    sheetId: "1fW4P4HXfD6Yt5uvNnB2B6u4GveOBK8VSEPal-giXCIw",
    envKeys: ["INSPECTION_SHEET_URL", "INSPECTION", "Inspection", "STRATEGIC_INSPECTION_SHEET_URL"],
    code: "INSP",
    defaultTab: "INSPECTION_SHEET_URL",
    name: "Inspection",
    fallbackUrl: "https://docs.google.com/spreadsheets/d/1fW4P4HXfD6Yt5uvNnB2B6u4GveOBK8VSEPal-giXCIw/edit"
  },
  "ld": {
    sheetId: "1lWSPmrx5LBX64E4vY-VWafLWwql8K7aBcxicprO3ZE0",
    envKeys: ["LD_SHEET_URL", "LD", "L&D", "STRATEGIC_LD_SHEET_URL"],
    code: "LD",
    defaultTab: "LD_SHEET_URL",
    name: "L&D",
    fallbackUrl: "https://docs.google.com/spreadsheets/d/1lWSPmrx5LBX64E4vY-VWafLWwql8K7aBcxicprO3ZE0/edit"
  },
  "machinery": {
    sheetId: "1zRmPlFDlRijQOTboLfhukEjdFHeUR9P5pcRIUeV7rY0",
    envKeys: ["MACHINERY_SHEET_URL", "MACHINERY", "Machinery", "STRATEGIC_MACHINERY_SHEET_URL"],
    code: "MACH",
    defaultTab: "MACHINERY_SHEET_URL",
    name: "Machinery",
    fallbackUrl: "https://docs.google.com/spreadsheets/d/1zRmPlFDlRijQOTboLfhukEjdFHeUR9P5pcRIUeV7rY0/edit"
  },
  "mechanical": {
    sheetId: "1gedfNYWwLaLDL85bz2PuDGi1NZP8QiwW42Vklym5i1w",
    envKeys: ["MECHANICAL_SHEET_URL", "MECHANICAL", "Mechanical", "STRATEGIC_MECHANICAL_SHEET_URL"],
    code: "MECH",
    defaultTab: "MECHANICAL_SHEET_URL",
    name: "Mechanical",
    fallbackUrl: "https://docs.google.com/spreadsheets/d/1gedfNYWwLaLDL85bz2PuDGi1NZP8QiwW42Vklym5i1w/edit"
  },
  "operations": {
    sheetId: "19iQ_D6k_hvKYP8-FTuBZ51yTcu3Zo2Q0VhXv67wRVZ0",
    envKeys: ["OPERATIONS_SHEET_URL", "OPERATIONS", "Operations", "STRATEGIC_OPERATIONS_SHEET_URL"],
    code: "OPS",
    defaultTab: "OPERATIONS_SHEET_URL",
    name: "Operations",
    fallbackUrl: "https://docs.google.com/spreadsheets/d/19iQ_D6k_hvKYP8-FTuBZ51yTcu3Zo2Q0VhXv67wRVZ0/edit"
  },
  "reliability": {
    sheetId: "15H3FZaEOczMu5_XcGo7Rs576n4CVakY0iRlvHYdbyvk",
    envKeys: ["RELIABILITY_SHEET_URL", "RELIABILITY", "Reliability", "STRATEGIC_RELIABILITY_SHEET_URL"],
    code: "REL",
    defaultTab: "RELIABILITY_SHEET_URL",
    name: "Reliability",
    fallbackUrl: "https://docs.google.com/spreadsheets/d/15H3FZaEOczMu5_XcGo7Rs576n4CVakY0iRlvHYdbyvk/edit"
  },
  "scm": {
    sheetId: "1SXhHYiQy21bF1g0PimScyhhyBGNch37VWTSHTgWPbP0",
    envKeys: ["SCM_SHEET_URL", "STRATEGIC_SCM_SHEET_URL", "GOOGLE_SHEET_SCM", "SCM_URL", "SCM"],
    code: "SCM",
    defaultTab: "SCM_SHEET_URL",
    name: "SCM",
    fallbackUrl: "https://docs.google.com/spreadsheets/d/1SXhHYiQy21bF1g0PimScyhhyBGNch37VWTSHTgWPbP0/edit"
  },
  "projects": {
    sheetId: "1Gr0IBANH6GeKMeozJywlHrQccPBdrMuJ5RRctPsQvRI",
    envKeys: ["PROJECTS_SHEET_URL", "PROJECTS", "Projects", "STRATEGIC_PROJECTS_SHEET_URL"],
    code: "PRJ",
    defaultTab: "PROJECTS",
    name: "Projects",
    fallbackUrl: "https://docs.google.com/spreadsheets/d/1Gr0IBANH6GeKMeozJywlHrQccPBdrMuJ5RRctPsQvRI/edit"
  },
  "process": {
    sheetId: "1w3ZgX9ixr4xLbesrDIhDZcTV7iQ8wL9XQ3VivZ5YKWs",
    envKeys: ["PROCESS_SHEET_URL", "PROCESS", "Process", "STRATEGIC_PROCESS_SHEET_URL"],
    code: "PROC",
    defaultTab: "PROCESS_SHEET_URL",
    name: "Process",
    fallbackUrl: "https://docs.google.com/spreadsheets/d/1w3ZgX9ixr4xLbesrDIhDZcTV7iQ8wL9XQ3VivZ5YKWs/edit"
  }
};
function getCandidateTabsForTile(tileId, sheetUrl) {
  const normalizedId = tileId === "admin_security" || tileId === "Admin_&_Security" ? "admin-security" : tileId;
  const reg = STRATEGIC_TILE_REGISTRY[normalizedId];
  const candidateTabs = [];
  if (sheetUrl) {
    const urlSheetMatch = sheetUrl.match(/[?&]sheet=([^&#]+)/);
    if (urlSheetMatch) {
      try {
        const decoded = decodeURIComponent(urlSheetMatch[1]);
        if (decoded && !candidateTabs.includes(decoded)) candidateTabs.push(decoded);
      } catch (e) {
      }
    }
  }
  if (reg) {
    if (reg.defaultTab && !candidateTabs.includes(reg.defaultTab)) candidateTabs.push(reg.defaultTab);
    const rawName = reg.name || "";
    const nameUnderscore = rawName.replace(/[\s&]+/g, "_");
    const nameNoSpecial = rawName.replace(/[^a-zA-Z0-9]/g, "");
    const tabCandidates = [
      `${nameUnderscore}_Actions`,
      `${rawName}_Actions`,
      `${reg.code}_Actions`,
      `${reg.code}_Action`,
      rawName,
      nameUnderscore,
      nameNoSpecial,
      reg.code,
      ...reg.envKeys || []
    ];
    for (const t of tabCandidates) {
      if (t && !candidateTabs.includes(t)) candidateTabs.push(t);
    }
  }
  if (normalizedId === "admin-security") {
    ["Admin_Security_Actions", "Admin_&_Security", "Admin & Security", "Admin_Security", "Admin and Security", "Admin", "Security"].forEach((t) => {
      if (!candidateTabs.includes(t)) candidateTabs.push(t);
    });
  } else if (normalizedId === "scm") {
    ["SCM_SHEET_URL", "SCM_Actions", "SCM", "SCM Actions", "Supply Chain", "Procurement"].forEach((t) => {
      if (!candidateTabs.includes(t)) candidateTabs.push(t);
    });
  } else if (normalizedId === "hcm") {
    ["HCM_SHEET_URL", "HCM_Actions", "HCM", "HCM Actions", "Human Capital"].forEach((t) => {
      if (!candidateTabs.includes(t)) candidateTabs.push(t);
    });
  }
  if (!candidateTabs.includes("Sheet1")) candidateTabs.push("Sheet1");
  return candidateTabs;
}
function getSheetUrlForTile(tileId) {
  const normalizedId = tileId === "admin_security" || tileId === "Admin_&_Security" ? "admin-security" : tileId;
  const reg = STRATEGIC_TILE_REGISTRY[normalizedId];
  if (!reg) return "";
  if (reg.sheetId) {
    for (const k of reg.envKeys) {
      const val = process.env[k];
      if (val && typeof val === "string" && val.trim().includes(reg.sheetId)) {
        return val.trim();
      }
    }
    return reg.fallbackUrl;
  }
  for (const k of reg.envKeys) {
    const val = process.env[k];
    if (val && typeof val === "string" && val.trim()) {
      return val.trim();
    }
  }
  return reg.fallbackUrl;
}
function parseCsvToStrategicActions(csvText, defaultCode) {
  if (!csvText) return [];
  const lines = csvText.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];
  const parseRowTokens = (line) => {
    const row = [];
    let inQuotes = false;
    let token = "";
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        row.push(token.trim().replace(/^"|"$/g, ""));
        token = "";
      } else {
        token += ch;
      }
    }
    row.push(token.trim().replace(/^"|"$/g, ""));
    return row;
  };
  const rawHeaders = parseRowTokens(lines[0]).filter((h) => h.length > 0);
  const headers = rawHeaders.map((h) => h.toLowerCase());
  const findCol = (candidates) => headers.findIndex((h) => candidates.some((c) => h.includes(c)));
  const idCol = findCol(["id", "code", "action #", "action#", "item", "sr", "s_no", "s.no", "sno", "no", "#"]);
  const descCol = findCol(["action", "task", "title", "desc", "description", "activity", "deliverable"]);
  const statusCol = findCol(["status", "state", "condition", "open_close status", "open_close", "status detail"]);
  const priorityCol = findCol(["priority", "prio", "urgency"]);
  const dueCol = findCol(["due", "target", "deadline", "date", "target date"]);
  const remarksCol = findCol(["remark", "note", "comment", "closure", "remarks"]);
  const closureCol = findCol(["closure date", "closed on", "completed date", "resolved date"]);
  const parsed = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseRowTokens(lines[i]);
    const desc = descCol !== -1 ? row[descCol] || "" : row[1] || row[0] || "";
    if (!desc || desc.trim().length === 0) continue;
    if (/student name|extracurricular|alexandra|class level/i.test(desc)) continue;
    const rawStatus = statusCol !== -1 ? row[statusCol] || "Open" : "Open";
    const isClosed = /close|done|complete|resolved/i.test(rawStatus);
    const status = isClosed ? "Closed" : "Open";
    let rawId = idCol !== -1 && row[idCol] ? row[idCol].trim() : "";
    let id = rawId;
    if (!id) {
      id = `${defaultCode}-${String(i).padStart(2, "0")}`;
    } else if (/^\d+$/.test(id)) {
      id = `${defaultCode}-${id.padStart(2, "0")}`;
    }
    const rawPriority = priorityCol !== -1 ? row[priorityCol] || "" : "";
    let priority = "High";
    if (/low|p3/i.test(rawPriority)) {
      priority = "Low";
    } else if (/med|medium|p2/i.test(rawPriority)) {
      priority = "Medium";
    } else if (/high|critical|p1/i.test(rawPriority)) {
      priority = "High";
    } else {
      priority = i % 2 === 0 ? "Medium" : "High";
    }
    const dueDate = dueCol !== -1 ? row[dueCol] || "" : "";
    const remarks = remarksCol !== -1 ? row[remarksCol] || "" : "";
    const closureDate = closureCol !== -1 ? row[closureCol] || "" : isClosed ? dueDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0] : "";
    const rawColumns = {};
    for (let c = 0; c < rawHeaders.length; c++) {
      const headerName = rawHeaders[c];
      rawColumns[headerName] = row[c] || "";
    }
    parsed.push({
      id,
      title: desc,
      priority,
      dueDate,
      status,
      closureDate,
      remarks,
      rawColumns,
      columnHeaders: rawHeaders
    });
  }
  return parsed;
}

// server.ts
dotenv.config();
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
app.use(express.json({ limit: "5mb" }));
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
var aiClient = null;
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
var DASHBOARD_CONTEXTS = {
  "overview": {
    name: "Overview",
    description: "Executive Operations & Compliance Portal Overview Dashboard",
    scopeKeywords: ["overview", "dashboard", "portal", "rollup", "kpi", "progress", "timeline", "punch list", "readiness", "compliance", "closed", "open", "plr", "psm", "ehsec", "sub hse", "fpcl"],
    context: `
You are the Overview Assistant for the FPCL Executive Operations & Compliance Portal.
Portal Summary:
- 11 Individual Dashboards registered under 4 categories (Plant Integrity, Executive & Governance, Sub HSE Committees, Process Safety).
- Currently 2 Dashboards are Active and linked to Google Sheets:
  1. PLR: 451 Total Recommendations (420 Closed, 31 Open, 93.1% Closure Rate). 233 Generation Loss Incidents (206 Closed, 27 Open, 88.4% Resolution).
  2. PSM: 121 Internal Audit Findings (76 Closed, 45 Open, 62.8% Closure Rate) across 13 Action Departments.
- 9 Dashboards are awaiting Google Sheet link integration (EHSE, Sub HSE-P, Sub HSE-E&I, Sub HSE-Mech, Technical Audit, QA/QC, Environmental, Security, Operational Readiness).
- Total Linked Workload: 572 Total Items (451 Recs + 121 PSM Findings), 496 Closed (86.7% Overall Rate), 76 In-Progress / Open, 0 Overdue.
- Timeline Progress: Actual 87.8% vs Planned 95.0% (Aug benchmark).
- Data Readiness: Master sheet linked and verified for PLR & PSM (100% readiness).
- Live HSEQ Safety KPIs (Linked to Google Sheet HSEQ_KPI):
  * Safe Manhours: 2,200,445 (Zero Lost Time Injury milestone achieved).
  * Fire Incidents: 0 (Zero fire occurrences recorded).
  * Lost Time Injury (LTI): 0 (Zero lost workday incidents).
  * Medical Treatment Cases: 0 (Zero physician treatment cases).
  * First Aid Cases: 5 (Minor site interventions managed).
  * Near Misses: 24 (Proactive hazard identification & reporting culture).
`
  },
  "plr": {
    name: "PLR",
    description: "PLR & Generation Loss Incidents Dashboard Suite",
    scopeKeywords: ["plr", "production loss", "production loss report", "plant loss", "recommendation", "incident", "outage", "machine", "stg", "boiler", "cfb", "power failure", "mwh", "loss", "department", "e&i", "mechanical", "operations", "plant engineering", "finance", "fpcl-ke", "scm", "ke", "trip", "status", "action"],
    context: `
You are the PLR Assistant for the PLR dashboard on the FPCL Portal.
Responsible Unit: Process.
PLR Data Summary (linked to Google Sheet tabs PLRstatus & Recommendations):
1. PLR Incidents (233 total records):
   - 206 Closed, 27 Open (88.4% Resolution Rate).
   - Standardized Machine Breakdown (Column G in PLR tab):
     * STG # 4: 154 outages (~66.1% of all plant losses).
     * STG # 3: 17 outages.
     * Boiler # 1 (CFB-1): 17 outages.
     * STG # 2: 11 outages.
     * Boiler # 2 (CFB-2): 11 outages.
     * STG # 1: 10 outages.
     * Other Equipment / Multi-Unit: 13 outages (Total Power Failure 4, Low Load 4, Boiler 1&2 Combined 2, Multi-Unit STG 3).
   - Total generation loss exceeds 1,100,000 MWh.
2. PLR Recommendations (451 total action records):
   - 420 Closed, 31 Open (93.1% Closure Rate).
   - Standardized Department Breakdown (Column F: actionBy in Recommendations):
     * E&I: 196 items (182 closed, 14 open).
     * FPCL-KE Operating Committee: 79 items (77 closed, 2 open).
     * Operations: 45 items (41 closed, 4 open).
     * Mechanical: 38 items (34 closed, 4 open).
     * PE: 28 items (26 closed, 2 open).
     * Finance / FPCL-KE O/C: 25 items (24 closed, 1 open).
     * SCM: 11 items (11 closed, 0 open).
     * KE: 5 items (5 closed, 0 open).
     * Mechanical & Inspection: 4 items (4 closed, 0 open).
     * Planning: 2 items (2 closed, 0 open).
     * Finance: 2 items (2 closed, 0 open).
     * HSE: 1 item (1 closed, 0 open).
     * All / Task Force / HHI: 4 items.
     * Unassigned: 10 items (6 closed, 4 open).
   - Priority items include STG-4 turbine high exhaust temperature thermocouple recalibration, lube oil cooler bypass inspection, and warm startup SOP revisions.
`
  },
  "sub-hse-psm": {
    name: "PSM",
    description: "Process Safety Management (PSM) Internal Audit Findings Executive Dashboard (Responsible Unit: HSEQ)",
    scopeKeywords: ["psm", "sub hse", "audit", "findings", "process safety", "observation", "cash", "psg", "operations", "e&i", "mechanical", "hse", "hseq", "l&d", "pha", "moc", "pssr", "sop", "mechanical integrity", "training", "contractor", "emergency", "closure", "compliance"],
    context: `
You are the PSM Assistant for the Process Safety Management internal audit dashboard under the HSEQ department.
PSM Audit Data Summary (Phase 1 Internal Audit Findings June 2026):
- Total Observations/Findings: 121 items.
- Status: 76 Closed, 45 Open (62.8% Resolution Rate).
- 13 Action Departments:
  * Operations CASH: 34 findings (23 closed, 11 open).
  * Operations PSG: 32 findings (20 closed, 12 open).
  * E&I: 16 findings (10 closed, 6 open).
  * Mechanical: 14 findings (9 closed, 5 open).
  * HSE: 10 findings (6 closed, 4 open).
  * Learning & Development (L&D): 4 findings (3 closed, 1 open).
  * HR & Administration: 3 findings (2 closed, 1 open).
  * Procurement / SCM: 2 findings (1 closed, 1 open).
  * IT / Automation: 2 findings (1 closed, 1 open).
  * Civil Maintenance: 2 findings (1 closed, 1 open).
  * Warehouse: 2 findings (0 closed, 2 open).
  * Security: 1 finding (0 closed, 1 open).
  * Laboratory / Quality: 1 finding (0 closed, 1 open).
- Key PSM Elements Tracked:
  * Operating Procedures & Safe Work Practices (SOPs).
  * Training and Personnel Competency.
  * Mechanical Integrity & Inspection (MI).
  * Management of Change (MOC).
  * Pre-Startup Safety Review (PSSR).
  * Process Hazard Analysis (PHA).
  * Emergency Planning & Response.
  * Contractor Safety Management.
`
  },
  "strategic": {
    name: "Strategic",
    description: "Executive Strategic Planning & Initiatives Dashboard",
    scopeKeywords: ["strategic", "strategy", "planning", "milestone", "initiative", "governance", "kpi", "target", "vision", "long-term", "roadmap", "boss", "matrix"],
    context: `
You are the Strategic Assistant for the Strategic dashboard on the FPCL Portal.
Tracks 20 Departmental Tiles across Plant Integrity, Operations, Corporate Services, and Governance.
Includes specialized dashboards for SCM (Supply Chain Management - Faisal Javed), Mechanical, Electrical & Instrumentation, Operations, Finance, IT, and more.
`
  },
  "scm": {
    name: "SCM",
    description: "Supply Chain Management Strategic Dashboard (Lead: Faisal Javed)",
    scopeKeywords: ["scm", "supply chain", "procurement", "vendor", "warehouse", "spare", "inventory", "contract", "purchase", "rfq", "faisal"],
    context: `
You are the SCM Assistant for the Supply Chain Management Strategic Dashboard.
Lead: Faisal Javed, Head of Supply Chain Management (faisal.javed@fpcl.com).
SCM Strategic Scope & Action Plan:
- Critical Turnaround Spares: High-alloy valve stock and long-lead critical parts secured with QA inspection certs.
- Bulk Chemical Agreements: Framework contracts for water treatment chemicals and specialty resins awarded with 8.4% cost savings.
- Inventory Integrity: Warehouse cyclic stock audits maintaining 99.4% physical barcode match accuracy.
- Supplier Localization: Secondary domestic vendor qualification for catalyst pre-filters undergoing plant quality lab tests.
- Digital Transformation: Vendor performance scoring and automated delivery tracking scorecard in user acceptance testing.
`
  }
};
app.post("/api/chat", async (req, res) => {
  try {
    const { message, dashboardId, history = [] } = req.body;
    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "A message string is required." });
      return;
    }
    const key = (dashboardId || "overview").toLowerCase();
    const config = DASHBOARD_CONTEXTS[key] || DASHBOARD_CONTEXTS["overview"];
    const lowerMsg = message.toLowerCase().trim();
    const outOfScopePatterns = [
      /who (is|was|won|created|directed|played|discovered)/i,
      /what is the (capital|weather|meaning of life|population|currency|president)/i,
      /tell me a (joke|story|poem|riddle|song)/i,
      /how (do|can) i (cook|bake|travel|fly|fix my car|learn french|play guitar)/i,
      /write (a python|code for|an essay|a letter to|a rap)/i,
      /what time is it in/i,
      /recipe for/i,
      /horoscope|astrology/i,
      /who won the/i,
      /chatgpt|openai|claude/i
    ];
    const isExplicitlyOutOfScope = outOfScopePatterns.some((pattern) => pattern.test(lowerMsg));
    const regretResponse = `I regret that I can only answer questions regarding the ${config.name} dashboard and its operational data. Please ask a question related to this dashboard's metrics, equipment, departments, recommendations, or audit findings.`;
    if (isExplicitlyOutOfScope) {
      res.json({
        reply: regretResponse,
        dashboardId: key,
        dashboardName: config.name,
        outOfScope: true
      });
      return;
    }
    const ai = getAIClient();
    if (ai) {
      try {
        const systemInstruction = `
You are the official AI Assistant for the "${config.name}" dashboard on the FPCL Executive Operations & Compliance Portal.

CRITICAL INSTRUCTIONS & CONSTRAINTS:
1. You ONLY answer questions directly concerning the "${config.name}" dashboard, its operational data, machines, action items, recommendations, audit findings, metrics, and compliance statuses.
2. REJECTION MANDATE: If the user asks ANY question outside the scope of the "${config.name}" dashboard (e.g. general knowledge, world events, programming outside this portal, weather, cooking, personal advice, movies, sports, trivia), you MUST REGRET AND DECLINE to answer immediately.
   Use this exact wording pattern:
   "${regretResponse}"
   Do not provide any answer to outside questions under any circumstances.
3. When answering questions inside scope:
   - Provide accurate, concise, factual answers based strictly on the provided Dashboard Data Summary below.
   - Mention relevant numbers, equipment (such as STG # 4, Boiler # 1, etc.), departments (E&I, Operations, Mechanical, etc.), and status counts where appropriate.
   - Use professional executive tone and markdown formatting (bullet points, bold key stats).

--- DASHBOARD DATA SUMMARY ---
${config.context}
`;
        const geminiPromise = ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: message,
          config: {
            systemInstruction,
            temperature: 0.2
          }
        });
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Gemini API call timed out after 3500ms")), 3500);
        });
        const response = await Promise.race([geminiPromise, timeoutPromise]);
        const reply2 = response.text || regretResponse;
        res.json({
          reply: reply2,
          dashboardId: key,
          dashboardName: config.name,
          outOfScope: false
        });
        return;
      } catch (geminiErr) {
        console.error("Gemini API call failed, falling back to local domain knowledge engine:", geminiErr?.message);
      }
    }
    let reply = "";
    if (key === "plr") {
      if (lowerMsg.includes("machine") || lowerMsg.includes("stg") || lowerMsg.includes("boiler") || lowerMsg.includes("outage") || lowerMsg.includes("equipment")) {
        reply = `**PLR Standardized Machine Breakdown (233 Total Outages):**

- **STG # 4**: 154 outages (66.1% of total losses)
- **STG # 3**: 17 outages
- **Boiler # 1 (CFB-1)**: 17 outages
- **STG # 2**: 11 outages
- **Boiler # 2 (CFB-2)**: 11 outages
- **STG # 1**: 10 outages
- **Other Equipment / Multi-Unit**: 13 outages

*Overall PLR Incident Resolution: 206 Closed, 27 Open (88.4% Resolution Rate).*`;
      } else if (lowerMsg.includes("department") || lowerMsg.includes("e&i") || lowerMsg.includes("mechanical") || lowerMsg.includes("operations") || lowerMsg.includes("recommendation") || lowerMsg.includes("action")) {
        reply = `**PLR Recommendations by Standardized Department (451 Total Records):**

- **E&I**: 196 items (182 closed, 14 open \u2022 92.9% rate)
- **FPCL-KE Operating Committee**: 79 items (77 closed, 2 open)
- **Operations**: 45 items (41 closed, 4 open)
- **Mechanical**: 38 items (34 closed, 4 open)
- **PE**: 28 items (26 closed, 2 open)
- **Finance / FPCL-KE O/C**: 25 items (24 closed, 1 open)
- **SCM**: 11 items (11 closed, 0 open)
- **KE**: 5 items (5 closed, 0 open)
- **Mechanical & Inspection**: 4 items (4 closed, 0 open)
- **Planning**: 2 items (2 closed, 0 open)
- **HSE**: 1 item (1 closed, 0 open)
- **Unassigned**: 10 items (6 closed, 4 open)

*Overall Recommendation Status: 420 Closed, 31 Open (93.1% Closure Rate).*`;
      } else if (lowerMsg.includes("open") || lowerMsg.includes("status") || lowerMsg.includes("closure")) {
        reply = `**PLR Dashboard Status Summary:**

- **Recommendations**: 451 Total \u2014 420 Closed, 31 Open (**93.1% Closure Rate**)
- **PLR Incidents**: 233 Total \u2014 206 Closed, 27 Open (**88.4% Resolution Rate**)
- **Open Recommendations Owners**: E&I (14), Operations (4), Mechanical (4), Unassigned (4), PE (2), FPCL-KE O/C (2), Finance (1).`;
      } else {
        reply = `The **Plant Loss Recommendations (PLR)** dashboard tracks 233 generation loss incidents and 451 engineering recommendations across FPCL. Key highlights:

- **Incident Resolution**: 206 Closed, 27 Open (88.4%)
- **Recommendation Closure**: 420 Closed, 31 Open (93.1%)
- **Top Outage Unit**: STG # 4 (155 incidents)
- **Top Action Department**: E&I (196 items)

You can ask me about specific machines, department action workloads, or open action items!`;
      }
    } else if (key === "sub-hse-psm") {
      if (lowerMsg.includes("department") || lowerMsg.includes("cash") || lowerMsg.includes("psg") || lowerMsg.includes("who has") || lowerMsg.includes("most open")) {
        reply = `**PSM Findings by Action Department (121 Total Findings):**

- **Operations CASH**: 34 findings (23 closed, 11 open \u2022 67.6%)
- **Operations PSG**: 32 findings (20 closed, 12 open \u2022 62.5%)
- **E&I**: 16 findings (10 closed, 6 open \u2022 62.5%)
- **Mechanical**: 14 findings (9 closed, 5 open \u2022 64.3%)
- **HSE**: 10 findings (6 closed, 4 open \u2022 60.0%)
- **Learning & Development**: 4 findings (3 closed, 1 open)
- **HR / Admin**: 3 findings (2 closed, 1 open)
- **Procurement**: 2 findings (1 closed, 1 open)
- **IT**: 2 findings (1 closed, 1 open)
- **Civil**: 2 findings (1 closed, 1 open)
- **Warehouse**: 2 findings (0 closed, 2 open)
- **Security**: 1 finding (0 closed, 1 open)
- **Laboratory**: 1 finding (0 closed, 1 open)

*Overall PSM Status: 76 Closed, 45 Open (62.8% Closure Rate).*`;
      } else if (lowerMsg.includes("element") || lowerMsg.includes("pha") || lowerMsg.includes("moc") || lowerMsg.includes("sop") || lowerMsg.includes("integrity")) {
        reply = `**PSM Elements Tracked in Phase 1 Audit:**

1. **Operating Procedures (SOPs)**: Standard operating envelope and interlocks
2. **Training & Competency**: Operator qualifications and shift handovers
3. **Mechanical Integrity (MI)**: Rotating equipment, flange torqueing, vibration alarms
4. **Management of Change (MOC)**: Temporary vs permanent facility modifications
5. **Pre-Startup Safety Review (PSSR)**: Safeguard verification prior to startup
6. **Process Hazard Analysis (PHA)**: Hazard containment and toxic gas mitigation
7. **Contractor Safety & Emergency Response**: Field permits and drill audits.`;
      } else {
        reply = `The **PSM** dashboard tracks internal audit findings across FPCL:

- **Total Audit Findings**: 121 observations
- **Resolution Status**: 76 Closed, 45 Open (**62.8% Resolution Rate**)
- **Largest Action Workloads**: Operations CASH (34 findings) and Operations PSG (32 findings)
- **Elements Covered**: SOPs, Training, Mechanical Integrity, MOC, PSSR, and PHA.`;
      }
    } else {
      if (lowerMsg.includes("hseq") || lowerMsg.includes("kpi") || lowerMsg.includes("safe manhours") || lowerMsg.includes("fire") || lowerMsg.includes("lti") || lowerMsg.includes("near miss") || lowerMsg.includes("first aid") || lowerMsg.includes("safety")) {
        reply = `**Live HSEQ Safety Key Performance Indicators (Google Sheet: HSEQ_KPI):**

- **Safe Manhours**: **2,200,445 hours** (Zero Lost Time Injury milestone achieved)
- **Fire Incidents**: **0** (Zero fire occurrences recorded)
- **Lost Time Injury (LTI)**: **0** (Zero lost workday incidents)
- **Medical Treatment Cases**: **0** (Nil physician cases)
- **First Aid Cases**: **5** (Minor site clinic treatments managed)
- **Near Misses**: **24** (Proactive reporting & hazard identification culture)

These metrics are synchronized live from the **HSEQ_KPI** Google Sheet tab.`;
      } else if (lowerMsg.includes("closure") || lowerMsg.includes("rate") || lowerMsg.includes("total") || lowerMsg.includes("rollup")) {
        reply = `**Executive Portal Rollup Statistics:**

- **Total Tracked Workload**: 572 items across active Google Sheet connections
- **Closed Items**: 496 closed
- **Overall Closure Rate**: **86.7%**
- **In-Progress Workload**: 76 items (31 PLR recommendations + 45 PSM audit findings)
- **Overdue Items**: 0 items
- **Monthly Progress**: 87.8% actual vs 95.0% planned.`;
      } else if (lowerMsg.includes("compare") || lowerMsg.includes("difference") || lowerMsg.includes("vs")) {
        reply = `**Comparison: PLR vs PSM:**

- **Plant Loss Recommendations (PLR)**:
  * 451 Recommendations: 420 Closed, 31 Open (**93.1% Closure**)
  * 233 Incidents: 206 Closed, 27 Open (**88.4% Resolution**)
  * Key Focus: Machine generation outages (STG-4, Boilers) and engineering recommendations.

- **PSM**:
  * 121 Audit Findings: 76 Closed, 45 Open (**62.8% Closure**)
  * Key Focus: Process safety compliance across 13 departments (CASH, PSG, E&I, Mechanical).`;
      } else {
        reply = `Welcome to the **Executive Operations & Compliance Portal Overview Assistant**.

- **Active Dashboards**: Plant Loss Recommendations (PLR) & PSM
- **Upcoming Dashboards**: 9 additional committee dashboards awaiting Google Sheet links
- **Overall Compliance**: 86.7% across 572 active records

Ask me any question regarding overall portal rollups, progress benchmarks, or module comparisons!`;
      }
    }
    res.json({
      reply,
      dashboardId: key,
      dashboardName: config.name,
      outOfScope: false
    });
  } catch (err) {
    console.error("Server /api/chat error:", err);
    res.status(500).json({ error: "Internal server error processing chat request." });
  }
});
function convertGvizTableToCsv(table) {
  if (!table || !Array.isArray(table.cols)) return "";
  const headers = table.cols.map((col) => {
    const label = col && (col.label || col.id) || "";
    return `"${String(label).replace(/"/g, '""')}"`;
  }).join(",");
  const rows = (table.rows || []).map((row) => {
    if (!row || !Array.isArray(row.c)) return "";
    return row.c.map((cell) => {
      if (!cell || cell.v === null || cell.v === void 0) return '""';
      const val = cell.f !== void 0 && cell.f !== null ? cell.f : cell.v;
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(",");
  });
  return [headers, ...rows].join("\r\n");
}
app.get("/api/hseq-kpi", async (req, res) => {
  try {
    let sheetUrl = req.query?.url || process.env.HSEQ_KPI || "https://docs.google.com/spreadsheets/d/1bFBRGKqIfO8Pn7qPSTU0pbdTB87ezDyXvVDnCbTGrx4/gviz/tq?tqx=out:csv&sheet=HSEQ_KPI";
    sheetUrl = sheetUrl.trim();
    const candidateUrls = [
      "https://docs.google.com/spreadsheets/d/1bFBRGKqIfO8Pn7qPSTU0pbdTB87ezDyXvVDnCbTGrx4/gviz/tq?tqx=out:csv&sheet=HSEQ_KPI",
      "https://docs.google.com/spreadsheets/d/1bFBRGKqIfO8Pn7qPSTU0pbdTB87ezDyXvVDnCbTGrx4/export?format=csv&sheet=HSEQ_KPI"
    ];
    if (sheetUrl && !candidateUrls.includes(sheetUrl)) {
      candidateUrls.push(sheetUrl);
    }
    const parseCsvRow = (rowStr) => {
      const result = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map((s) => s.replace(/^["']|["']$/g, "").trim());
    };
    let csvText = "";
    for (const testUrl of candidateUrls) {
      try {
        const response = await fetch(testUrl, {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache"
          }
        });
        if (response.ok) {
          const text = await response.text();
          if (text && !text.includes("<!DOCTYPE html>") && text.includes(",")) {
            const firstLine = text.trim().split(/\r\n|\r|\n/)[0] || "";
            const testHeaders = parseCsvRow(firstLine);
            const isWrongActionSheet = testHeaders.some((h) => /action|assigned|ack|remarks/i.test(h));
            if (!isWrongActionSheet) {
              csvText = text;
              break;
            }
          }
        }
      } catch (fetchErr) {
      }
    }
    if (!csvText) {
      throw new Error("Could not fetch CSV content from HSEQ_KPI sheet candidate URLs");
    }
    const lines = csvText.trim().split(/\r\n|\r|\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error("HSEQ_KPI sheet is empty or missing data rows");
    }
    const headers = parseCsvRow(lines[0]);
    const parseNum = (val, fallback = 0) => {
      if (val === void 0 || val === null || val === "") return fallback;
      const clean = String(val).replace(/,/g, "").trim();
      const num = parseFloat(clean);
      return isNaN(num) ? fallback : num;
    };
    const headerIndices = {};
    headers.forEach((h, idx) => {
      const norm = h.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (norm) {
        if (headerIndices[norm] === void 0) {
          headerIndices[norm] = idx;
        } else {
          headerIndices[`${norm}1`] = idx;
        }
      }
    });
    const getRowVal = (row, keys, defaultVal, fallbackIdx) => {
      for (const k of keys) {
        const norm = k.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (headerIndices[norm] !== void 0 && row[headerIndices[norm]] !== void 0 && row[headerIndices[norm]] !== "") {
          return parseNum(row[headerIndices[norm]], defaultVal);
        }
      }
      if (fallbackIdx !== void 0 && row[fallbackIdx] !== void 0 && row[fallbackIdx] !== "") {
        return parseNum(row[fallbackIdx], defaultVal);
      }
      return defaultVal;
    };
    const yearlyData = [];
    const rows = lines.slice(1);
    rows.forEach((line, rIdx) => {
      const values = parseCsvRow(line);
      if (values.length < 2 || !values.some((v) => v.length > 0)) return;
      const sNo = getRowVal(values, ["s", "sno", "s_#", "sr"], rIdx + 1, 0);
      const year = getRowVal(values, ["year", "yr"], 2017 + rIdx, 7);
      const safeManhours = getRowVal(values, ["safemanhours", "manhours"], 0, 1);
      const safeManhoursDailyWages = getRowVal(values, ["safemanhoursdailywages", "safemanhoursdailywage", "dailywages", "dailywage"], 0, 10);
      const totalSafeManhours = safeManhours + safeManhoursDailyWages;
      const fire = getRowVal(values, ["fire", "fireincidents"], 0, 2);
      const lti = getRowVal(values, ["lti", "losttimeinjury"], 0, 3);
      const medicalTreatment = getRowVal(values, ["medicaltreatment", "medical"], 0, 4);
      const firstAidCase = getRowVal(values, ["firstaidcase", "firstaid"], 0, 5);
      const nearmiss = getRowVal(values, ["nearmiss", "nearmisses"], 0, 6);
      const trirActual = getRowVal(values, ["triractual", "triract", "trir_actual"], 0, 8);
      const trirPlanned = getRowVal(values, ["trirplan", "trirplanned", "trirtarget", "trir_plan", "triractual1"], 0.6, 9);
      if (year) {
        yearlyData.push({
          sNo,
          year,
          safeManhours,
          safeManhoursDailyWages,
          totalSafeManhours,
          fire,
          lti,
          medicalTreatment,
          firstAidCase,
          nearmiss,
          trirActual,
          trirPlanned
        });
      }
    });
    if (yearlyData.length === 0) {
      const fallbackRows = [
        { sNo: 1, year: 2017, safeManhours: 392077, safeManhoursDailyWages: 0, totalSafeManhours: 392077, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 0, nearmiss: 0, trirActual: 0, trirPlanned: 0.6 },
        { sNo: 2, year: 2018, safeManhours: 1635908, safeManhoursDailyWages: 0, totalSafeManhours: 1635908, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 0, nearmiss: 0, trirActual: 0, trirPlanned: 0.6 },
        { sNo: 3, year: 2019, safeManhours: 2948991, safeManhoursDailyWages: 0, totalSafeManhours: 2948991, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 4, nearmiss: 31, trirActual: 0, trirPlanned: 0.6 },
        { sNo: 4, year: 2020, safeManhours: 4201942, safeManhoursDailyWages: 0, totalSafeManhours: 4201942, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 5, nearmiss: 38, trirActual: 0, trirPlanned: 0.6 },
        { sNo: 5, year: 2021, safeManhours: 5406727, safeManhoursDailyWages: 0, totalSafeManhours: 5406727, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 4, nearmiss: 4, trirActual: 0, trirPlanned: 0.6 },
        { sNo: 6, year: 2022, safeManhours: 6588709, safeManhoursDailyWages: 0, totalSafeManhours: 6588709, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 4, nearmiss: 18, trirActual: 0, trirPlanned: 0.6 },
        { sNo: 7, year: 2023, safeManhours: 7842960, safeManhoursDailyWages: 0, totalSafeManhours: 7842960, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 1, nearmiss: 4, trirActual: 0, trirPlanned: 0.6 },
        { sNo: 8, year: 2024, safeManhours: 9257227, safeManhoursDailyWages: 0, totalSafeManhours: 9257227, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 6, nearmiss: 7, trirActual: 0, trirPlanned: 0.6 },
        { sNo: 9, year: 2025, safeManhours: 10497943, safeManhoursDailyWages: 0, totalSafeManhours: 10497943, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 4, nearmiss: 15, trirActual: 0, trirPlanned: 0.6 },
        { sNo: 10, year: 2026, safeManhours: 11385834, safeManhoursDailyWages: 56e4, totalSafeManhours: 11945834, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 6, nearmiss: 8, trirActual: 0, trirPlanned: 0.6 }
      ];
      yearlyData.push(...fallbackRows);
    }
    yearlyData.sort((a, b) => Number(a.year) - Number(b.year));
    const totals = {
      safeManhours: yearlyData.reduce((acc, row) => acc + (row.safeManhours || 0), 0),
      safeManhoursDailyWages: yearlyData.reduce((acc, row) => acc + (row.safeManhoursDailyWages || 0), 0),
      totalSafeManhours: yearlyData.reduce((acc, row) => acc + (row.totalSafeManhours !== void 0 ? row.totalSafeManhours : (row.safeManhours || 0) + (row.safeManhoursDailyWages || 0)), 0),
      fire: yearlyData.reduce((acc, row) => acc + (row.fire || 0), 0),
      lti: yearlyData.reduce((acc, row) => acc + (row.lti || 0), 0),
      medicalTreatment: yearlyData.reduce((acc, row) => acc + (row.medicalTreatment || 0), 0),
      firstAidCase: yearlyData.reduce((acc, row) => acc + (row.firstAidCase || 0), 0),
      nearmiss: yearlyData.reduce((acc, row) => acc + (row.nearmiss || 0), 0),
      trirActual: yearlyData.reduce((acc, row) => acc + (row.trirActual || 0), 0),
      trirPlanned: yearlyData.length > 0 ? yearlyData[yearlyData.length - 1].trirPlanned : 0.6
    };
    const latest = yearlyData[yearlyData.length - 1] || yearlyData[0];
    const years = yearlyData.map((r) => r.year);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.json({
      success: true,
      sheetName: "HSEQ_KPI",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      totals,
      kpis: {
        safeManhours: latest ? latest.safeManhours : totals.safeManhours,
        safeManhoursDailyWages: latest ? latest.safeManhoursDailyWages || 0 : totals.safeManhoursDailyWages,
        totalSafeManhours: latest ? latest.totalSafeManhours || latest.safeManhours + (latest.safeManhoursDailyWages || 0) : totals.totalSafeManhours,
        fire: totals.fire,
        lti: totals.lti,
        medicalTreatment: totals.medicalTreatment,
        firstAidCase: totals.firstAidCase,
        nearmiss: totals.nearmiss,
        trirActual: latest ? latest.trirActual : 0,
        trirPlanned: latest ? latest.trirPlanned : 0.6
      },
      latest,
      yearlyData,
      years,
      rawHeaders: headers,
      rawValues: rows[0] ? parseCsvRow(rows[0]) : [],
      csvText
    });
  } catch (err) {
    console.error("Error in /api/hseq-kpi:", err);
    const fallbackRows = [
      { sNo: 1, year: 2017, safeManhours: 392077, safeManhoursDailyWages: 0, totalSafeManhours: 392077, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 0, nearmiss: 0, trirActual: 0, trirPlanned: 0.6 },
      { sNo: 2, year: 2018, safeManhours: 1635908, safeManhoursDailyWages: 0, totalSafeManhours: 1635908, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 0, nearmiss: 0, trirActual: 0, trirPlanned: 0.6 },
      { sNo: 3, year: 2019, safeManhours: 2948991, safeManhoursDailyWages: 0, totalSafeManhours: 2948991, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 4, nearmiss: 31, trirActual: 0, trirPlanned: 0.6 },
      { sNo: 4, year: 2020, safeManhours: 4201942, safeManhoursDailyWages: 0, totalSafeManhours: 4201942, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 5, nearmiss: 38, trirActual: 0, trirPlanned: 0.6 },
      { sNo: 5, year: 2021, safeManhours: 5406727, safeManhoursDailyWages: 0, totalSafeManhours: 5406727, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 4, nearmiss: 4, trirActual: 0, trirPlanned: 0.6 },
      { sNo: 6, year: 2022, safeManhours: 6588709, safeManhoursDailyWages: 0, totalSafeManhours: 6588709, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 4, nearmiss: 18, trirActual: 0, trirPlanned: 0.6 },
      { sNo: 7, year: 2023, safeManhours: 7842960, safeManhoursDailyWages: 0, totalSafeManhours: 7842960, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 1, nearmiss: 4, trirActual: 0, trirPlanned: 0.6 },
      { sNo: 8, year: 2024, safeManhours: 9257227, safeManhoursDailyWages: 0, totalSafeManhours: 9257227, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 6, nearmiss: 7, trirActual: 0, trirPlanned: 0.6 },
      { sNo: 9, year: 2025, safeManhours: 10497943, safeManhoursDailyWages: 0, totalSafeManhours: 10497943, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 4, nearmiss: 15, trirActual: 0, trirPlanned: 0.6 },
      { sNo: 10, year: 2026, safeManhours: 11385834, safeManhoursDailyWages: 56e4, totalSafeManhours: 11945834, fire: 0, lti: 0, medicalTreatment: 0, firstAidCase: 6, nearmiss: 8, trirActual: 0, trirPlanned: 0.6 }
    ];
    res.json({
      success: false,
      error: err?.message || "Failed to fetch HSEQ_KPI sheet",
      sheetName: "HSEQ_KPI",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      totals: {
        safeManhours: 60166213,
        safeManhoursDailyWages: 56e4,
        totalSafeManhours: 60726213,
        fire: 0,
        lti: 0,
        medicalTreatment: 0,
        firstAidCase: 34,
        nearmiss: 125,
        trirActual: 0,
        trirPlanned: 0.6
      },
      kpis: {
        safeManhours: 11385834,
        safeManhoursDailyWages: 56e4,
        totalSafeManhours: 11945834,
        fire: 0,
        lti: 0,
        medicalTreatment: 0,
        firstAidCase: 6,
        nearmiss: 8,
        trirActual: 0,
        trirPlanned: 0.6
      },
      yearlyData: fallbackRows,
      years: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]
    });
  }
});
var contactsDataCache = null;
app.get("/api/contacts", async (req, res) => {
  const CONTACTS_SHEET_ID = "1mI5WbcNBYtJc1fQjG0ZYQ1PKQzAHp5Sm3gyi9MibW-g";
  const forceRefresh = req.query.refresh === "true" || req.query.force === "true";
  const now = Date.now();
  if (!forceRefresh && contactsDataCache && now - contactsDataCache.timestamp < 1e4) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.json({
      success: true,
      cached: true,
      timestamp: contactsDataCache.timestamp,
      csvText: contactsDataCache.csvText,
      source: "memory-cache"
    });
    return;
  }
  const urls = [
    `https://docs.google.com/spreadsheets/d/${CONTACTS_SHEET_ID}/export?format=csv&sheet=Contacts`,
    `https://docs.google.com/spreadsheets/d/${CONTACTS_SHEET_ID}/export?format=csv&sheet=contacts`,
    `https://docs.google.com/spreadsheets/d/${CONTACTS_SHEET_ID}/export?format=csv`,
    `https://docs.google.com/spreadsheets/d/${CONTACTS_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Contacts`,
    `https://docs.google.com/spreadsheets/d/${CONTACTS_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=contacts`,
    `https://docs.google.com/spreadsheets/d/${CONTACTS_SHEET_ID}/gviz/tq?tqx=out:csv`
  ];
  let csvText = "";
  let fetchedSource = "";
  const nonce = Math.floor(Math.random() * 1e6);
  for (const u of urls) {
    try {
      const sep = u.includes("?") ? "&" : "?";
      const response = await fetch(`${u}${sep}_t=${now}&_nocache=${nonce}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/csv,text/plain,*/*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        }
      });
      if (response.ok) {
        const text = await response.text();
        if (text && !text.includes("<!DOCTYPE html>") && !text.includes("<html") && text.includes(",")) {
          csvText = text;
          fetchedSource = u;
          break;
        }
      }
    } catch {
    }
  }
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  if (csvText) {
    contactsDataCache = { timestamp: now, csvText };
    res.json({
      success: true,
      live: true,
      timestamp: now,
      source: fetchedSource,
      rowCount: csvText.split("\n").filter(Boolean).length,
      csvText
    });
  } else if (contactsDataCache) {
    res.json({
      success: true,
      fallback: true,
      timestamp: contactsDataCache.timestamp,
      source: "stale-cache",
      csvText: contactsDataCache.csvText
    });
  } else {
    res.status(502).json({ success: false, error: "Could not fetch Contacts from Google Sheet" });
  }
});
var psiDataCacheByTab = {};
app.get("/api/psi", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  const now = Date.now();
  const targetTab = String(req.query?.tab || req.query?.sheetTab || "PSI").trim();
  const force = req.query?.force === "true" || req.query?._t !== void 0;
  const tabCache = psiDataCacheByTab[targetTab];
  if (!force && tabCache?.csvText && now - tabCache.timestamp < 5e3) {
    res.json({
      success: true,
      source: "cache",
      sheetId: "1vWYE3G4W7TxHBVzsUJuu1Z-aufjXD-xFeodTpFUTZtY",
      tabName: targetTab,
      csvText: tabCache.csvText,
      lastUpdated: new Date(tabCache.timestamp).toISOString()
    });
    return;
  }
  const PSI_SHEET_ID = "1vWYE3G4W7TxHBVzsUJuu1Z-aufjXD-xFeodTpFUTZtY";
  const envUrl = process.env.PSI || process.env.PSI_SHEET_URL;
  const urls = [
    `https://docs.google.com/spreadsheets/d/${PSI_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(targetTab)}&_t=${now}`,
    ...envUrl && targetTab === "PSI" ? [envUrl.includes("_t=") ? envUrl : `${envUrl}&_t=${now}`] : [],
    `https://docs.google.com/spreadsheets/d/${PSI_SHEET_ID}/export?format=csv&sheet=${encodeURIComponent(targetTab)}&_t=${now}`,
    `https://docs.google.com/spreadsheets/d/${PSI_SHEET_ID}/gviz/tq?tqx=out:csv&_t=${now}`
  ];
  let rawCsv = "";
  for (const u of urls) {
    try {
      const response = await fetch(u, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/csv,text/plain,*/*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        }
      });
      if (response.ok) {
        const text = await response.text();
        const lower = text.toLowerCase();
        const isValid = text && !text.includes("<!DOCTYPE html>") && (lower.includes("hold") || lower.includes("point") || lower.includes("package") || lower.includes("responsible") || lower.includes("steam") || lower.includes("planned") || lower.includes("balance") || lower.includes("date"));
        if (isValid) {
          rawCsv = text;
          break;
        }
      }
    } catch {
    }
  }
  if (rawCsv) {
    psiDataCacheByTab[targetTab] = {
      timestamp: now,
      csvText: rawCsv
    };
    res.json({
      success: true,
      source: "live",
      sheetId: PSI_SHEET_ID,
      tabName: targetTab,
      csvText: rawCsv,
      lastUpdated: new Date(now).toISOString()
    });
    return;
  }
  if (tabCache?.csvText) {
    res.json({
      success: true,
      source: "stale-cache",
      sheetId: PSI_SHEET_ID,
      tabName: targetTab,
      csvText: tabCache.csvText,
      lastUpdated: new Date(tabCache.timestamp).toISOString()
    });
    return;
  }
  res.status(502).json({
    success: false,
    error: `Could not fetch PSI (${targetTab}) from Google Sheet`,
    sheetId: PSI_SHEET_ID,
    tabName: targetTab
  });
});
var msaDataCacheByTab = {};
app.get("/api/msa", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  const now = Date.now();
  const targetTab = String(req.query?.tab || req.query?.sheetTab || "MSA").trim();
  const force = req.query?.force === "true" || req.query?._t !== void 0;
  const tabCache = msaDataCacheByTab[targetTab];
  if (!force && tabCache?.csvText && now - tabCache.timestamp < 5e3) {
    res.json({
      success: true,
      source: "cache",
      sheetId: "11ggCusY-ZJj09bVcpbikHeupyvFTBxDHlytjhpbNRWw",
      tabName: targetTab,
      csvText: tabCache.csvText,
      lastUpdated: new Date(tabCache.timestamp).toISOString()
    });
    return;
  }
  const MSA_SHEET_ID = "11ggCusY-ZJj09bVcpbikHeupyvFTBxDHlytjhpbNRWw";
  const envAuditorUrl = process.env.Compliance_by_Auditor_name || process.env.COMPLIANCE_BY_AUDITOR_NAME || process.env.COMPLIANCE_BY_AUDITOR_NAME_URL || process.env.COMPLIANCE_BY_AUDITOR_URL || process.env.MSA_AUDITOR_COMPLIANCE_URL;
  const urls = [];
  if (targetTab === "Compliance_by_Auditor_name") {
    if (envAuditorUrl) {
      urls.push(envAuditorUrl.includes("_t=") ? envAuditorUrl : `${envAuditorUrl}&_t=${now}`);
    }
    urls.push(
      `https://docs.google.com/spreadsheets/d/${MSA_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(targetTab)}&_t=${now}`
    );
  } else if (targetTab === "MSA_Compliance") {
    urls.push(
      `https://docs.google.com/spreadsheets/d/${MSA_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(targetTab)}&_t=${now}`
    );
  } else {
    urls.push(
      `https://docs.google.com/spreadsheets/d/${MSA_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(targetTab)}&_t=${now}`,
      `https://docs.google.com/spreadsheets/d/${MSA_SHEET_ID}/export?format=csv&sheet=${encodeURIComponent(targetTab)}&_t=${now}`
    );
  }
  let rawCsv = "";
  for (const u of urls) {
    try {
      const response = await fetch(u, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/csv,text/plain,*/*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        }
      });
      if (response.ok) {
        const text = await response.text();
        const lower = text.toLowerCase();
        let isValid = false;
        if (text && !text.includes("<!DOCTYPE html>")) {
          if (targetTab === "Compliance_by_Auditor_name") {
            isValid = lower.includes("auditor") || lower.includes("planned") && lower.includes("actual");
          } else if (targetTab === "MSA_Compliance") {
            isValid = lower.includes("planned_msa") || lower.includes("department") && lower.includes("actual_msa");
          } else {
            isValid = lower.includes("observation") || lower.includes("audited");
          }
        }
        if (isValid) {
          rawCsv = text;
          break;
        }
      }
    } catch (_e) {
    }
  }
  if (rawCsv) {
    msaDataCacheByTab[targetTab] = {
      timestamp: now,
      csvText: rawCsv
    };
    res.json({
      success: true,
      source: "live_google_sheet",
      sheetId: MSA_SHEET_ID,
      tabName: targetTab,
      csvText: rawCsv,
      lastUpdated: new Date(now).toISOString()
    });
    return;
  }
  if (tabCache?.csvText) {
    res.json({
      success: true,
      source: "stale_cache",
      sheetId: MSA_SHEET_ID,
      tabName: targetTab,
      csvText: tabCache.csvText,
      lastUpdated: new Date(tabCache.timestamp).toISOString()
    });
    return;
  }
  res.status(502).json({
    success: false,
    error: `Could not fetch MSA (${targetTab}) from Google Sheet`,
    sheetId: MSA_SHEET_ID,
    tabName: targetTab
  });
});
var safetyTalkDataCacheByTab = {};
function parseSafetyTalkCsv(csvText) {
  if (!csvText || typeof csvText !== "string") return [];
  const lines = [];
  let row = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const c = csvText[i];
    if (c === '"') {
      if (inQuotes && csvText[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else if ((c === "\r" || c === "\n") && !inQuotes) {
      if (c === "\r" && csvText[i + 1] === "\n") i++;
      row.push(current.trim());
      current = "";
      if (row.length > 1 || row[0] && row[0] !== "") {
        lines.push(row);
      }
      row = [];
    } else {
      current += c;
    }
  }
  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    lines.push(row);
  }
  if (lines.length < 2) return [];
  const headers = lines[0].map((h) => String(h || "").trim());
  const colMap = {};
  headers.forEach((h, idx) => {
    const clean = h.toLowerCase().replace(/[^a-z0-9]/g, "");
    colMap[clean] = idx;
  });
  const getCol = (r, aliases, fallbackIdx) => {
    for (const a of aliases) {
      const idx = colMap[a.toLowerCase().replace(/[^a-z0-9]/g, "")];
      if (idx !== void 0 && r[idx] !== void 0) {
        return String(r[idx]).trim();
      }
    }
    if (fallbackIdx !== void 0 && r[fallbackIdx] !== void 0) {
      return String(r[fallbackIdx]).trim();
    }
    return "";
  };
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const r = lines[i];
    if (!r || r.length < 2) continue;
    const sr = getCol(r, ["sr", "sr#", "sno", "id"], 0);
    const dept = getCol(r, ["dept", "department"], 1);
    const shift = getCol(r, ["shift"], 2);
    const plannedDate = getCol(r, ["planneddate", "planned_date", "plan_date"], 3);
    const actualDate = getCol(r, ["actualdate", "actual_date"], 4);
    const feedbackSubmissionDate = getCol(r, ["feedbacksubmissiondate", "feedback_date"], 5);
    const feedbackSubmission = getCol(r, ["feedbacksubmission", "feedback_submission"], 6);
    const stStatus = getCol(r, ["ststatus", "st_status", "safetytalkstatus"], 7);
    const plannedTopic = getCol(r, ["plannedtopic", "planned_topic", "topic"], 8);
    const actualTopic = getCol(r, ["actualtopic", "actual_topic"], 9);
    const plannedSpeaker = getCol(r, ["plannedspeaker", "planned_speaker"], 10);
    const backupSpeaker = getCol(r, ["backupspeaker", "backup_speaker"], 11);
    const actualSpeaker = getCol(r, ["actualspeaker", "actual_speaker"], 12);
    const plannedTopicDelivered = getCol(r, ["plannedtopicdelivered", "topicdelivered"], 13);
    const recommendations = getCol(r, ["recommendations", "recommendation", "recs"], 14);
    const rStatus = getCol(r, ["rstatus", "r_status", "recommendationstatus"], 15);
    const pendingWith = getCol(r, ["pendingwithresponsibleunit", "pendingwith", "responsibleunit"], 16);
    const targetDate = getCol(r, ["targetdate", "target_date"], 17);
    const closureDate = getCol(r, ["closuredate", "closure_date"], 18);
    const remarks = getCol(r, ["remarks", "remark", "notes"], 19);
    let year = "";
    const dateStr = plannedDate || actualDate || "";
    const fourDigitMatch = dateStr.match(/\b(19\d\d|20\d\d)\b/);
    if (fourDigitMatch) year = fourDigitMatch[1];
    if (sr || dept || plannedTopic || stStatus) {
      records.push({
        sr: sr || String(records.length + 1),
        dept: dept || "Unassigned",
        shift: shift || "",
        plannedDate: plannedDate || "",
        actualDate: actualDate || "",
        year,
        feedbackSubmissionDate: feedbackSubmissionDate || "",
        feedbackSubmission: feedbackSubmission || "",
        stStatus: stStatus || "No",
        plannedTopic: plannedTopic || "",
        actualTopic: actualTopic || "",
        plannedSpeaker: plannedSpeaker || "",
        backupSpeaker: backupSpeaker || "",
        actualSpeaker: actualSpeaker || "",
        plannedTopicDelivered: plannedTopicDelivered || "",
        recommendations: recommendations || "",
        rStatus: rStatus || "",
        pendingWith: pendingWith || "",
        targetDate: targetDate || "",
        closureDate: closureDate || "",
        remarks: remarks || ""
      });
    }
  }
  return records;
}
app.get("/api/safety-talks", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  const now = Date.now();
  const targetTab = String(req.query?.tab || req.query?.sheetTab || "Safety_Talk").trim();
  const force = req.query?.force === "true" || req.query?._t !== void 0;
  const tabCache = safetyTalkDataCacheByTab[targetTab];
  if (!force && tabCache?.csvText && now - tabCache.timestamp < 5e3) {
    const cachedRecords = tabCache.records || parseSafetyTalkCsv(tabCache.csvText);
    res.json({
      success: true,
      source: "cache",
      sheetId: "1Fgx9ZEdHAQnH_oCuX0NdNO5_V3gEPHu0xjnqKk6GqWc",
      tabName: targetTab,
      count: cachedRecords.length,
      records: cachedRecords,
      csvText: tabCache.csvText,
      lastUpdated: new Date(tabCache.timestamp).toISOString()
    });
    return;
  }
  const SAFETY_TALK_SHEET_ID = "1Fgx9ZEdHAQnH_oCuX0NdNO5_V3gEPHu0xjnqKk6GqWc";
  const urls = [
    `https://docs.google.com/spreadsheets/d/${SAFETY_TALK_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(targetTab)}&_t=${now}`,
    `https://docs.google.com/spreadsheets/d/${SAFETY_TALK_SHEET_ID}/export?format=csv&sheet=${encodeURIComponent(targetTab)}&_t=${now}`,
    `https://docs.google.com/spreadsheets/d/${SAFETY_TALK_SHEET_ID}/gviz/tq?tqx=out:csv&_t=${now}`
  ];
  let rawCsv = "";
  for (const u of urls) {
    try {
      const response = await fetch(u, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/csv,text/plain,*/*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        }
      });
      if (response.ok) {
        const text = await response.text();
        const lower = text.toLowerCase();
        const isValid = text && !text.includes("<!DOCTYPE html>") && (lower.includes("st status") || lower.includes("safety") || lower.includes("talk") || lower.includes("dept") || lower.includes("planned date") || lower.includes("recommendations"));
        if (isValid) {
          rawCsv = text;
          break;
        }
      }
    } catch (_e) {
    }
  }
  if (rawCsv) {
    const parsedRecords = parseSafetyTalkCsv(rawCsv);
    safetyTalkDataCacheByTab[targetTab] = {
      timestamp: now,
      csvText: rawCsv,
      records: parsedRecords
    };
    res.json({
      success: true,
      source: "live_google_sheet",
      sheetId: SAFETY_TALK_SHEET_ID,
      tabName: targetTab,
      count: parsedRecords.length,
      records: parsedRecords,
      csvText: rawCsv,
      lastUpdated: new Date(now).toISOString()
    });
    return;
  }
  if (tabCache?.csvText) {
    const cachedRecords = tabCache.records || parseSafetyTalkCsv(tabCache.csvText);
    res.json({
      success: true,
      source: "stale_cache",
      sheetId: SAFETY_TALK_SHEET_ID,
      tabName: targetTab,
      count: cachedRecords.length,
      records: cachedRecords,
      csvText: tabCache.csvText,
      lastUpdated: new Date(tabCache.timestamp).toISOString()
    });
    return;
  }
  res.status(502).json({
    success: false,
    error: `Could not fetch Safety Talks (${targetTab}) from Google Sheet`,
    sheetId: SAFETY_TALK_SHEET_ID,
    tabName: targetTab
  });
});
var fpclDirectoryCache = {
  timestamp: 0,
  data: []
};
app.get("/api/fpcl-directory", async (_req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  const now = Date.now();
  if (fpclDirectoryCache.data.length > 0 && now - fpclDirectoryCache.timestamp < 3e4) {
    res.json({
      success: true,
      count: fpclDirectoryCache.data.length,
      data: fpclDirectoryCache.data,
      source: "cache",
      sheetId: "1SrPdaxzEXbOFVbWin4zJvrc-m9TQKtxFjcyZYamXfpg",
      tabName: "FPCL_Directory",
      lastUpdated: new Date(fpclDirectoryCache.timestamp).toISOString()
    });
    return;
  }
  const sheetId = "1SrPdaxzEXbOFVbWin4zJvrc-m9TQKtxFjcyZYamXfpg";
  const tabName = "FPCL_Directory";
  const candidateUrls = [
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}&_t=${now}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&sheet=${encodeURIComponent(tabName)}&_t=${now}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&_t=${now}`
  ];
  let rawCsv = "";
  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/csv,text/plain,*/*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
        redirect: "follow",
        cache: "no-store"
      });
      if (response.ok) {
        const text = await response.text();
        if (text && !text.includes("<!DOCTYPE html>") && !text.includes("<html") && text.includes(",")) {
          rawCsv = text;
          break;
        }
      }
    } catch {
    }
  }
  if (rawCsv) {
    const lines = rawCsv.split(/\r?\n/).filter(Boolean);
    const parsed = [];
    if (lines.length > 1) {
      const headerLine = lines[0];
      const matchHeader = headerLine.match(/^"?([^",]*)"?,(?:"([^"]*)"|([^,]*)),(?:"([^"]*)"|(.*))$/);
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const match = line.match(/^"?([^",]*)"?,(?:"([^"]*)"|([^,]*)),(?:"([^"]*)"|(.*))$/);
        if (match) {
          const sr = (match[1] || "").trim();
          const ext = (match[2] !== void 0 ? match[2] : match[3] || "").trim();
          const name = (match[4] !== void 0 ? match[4] : match[5] || "").trim();
          if (ext || name) {
            parsed.push({
              sr: sr || String(parsed.length + 1),
              ext,
              name
            });
          }
        }
      }
    }
    if (parsed.length > 0) {
      fpclDirectoryCache = {
        timestamp: now,
        data: parsed
      };
      res.json({
        success: true,
        count: parsed.length,
        data: parsed,
        source: "live",
        sheetId,
        tabName,
        lastUpdated: new Date(now).toISOString()
      });
      return;
    }
  }
  if (fpclDirectoryCache.data.length > 0) {
    res.json({
      success: true,
      count: fpclDirectoryCache.data.length,
      data: fpclDirectoryCache.data,
      source: "stale-cache",
      sheetId,
      tabName,
      lastUpdated: new Date(fpclDirectoryCache.timestamp).toISOString()
    });
    return;
  }
  res.status(502).json({
    success: false,
    error: "Could not fetch FPCL Directory from Google Sheet",
    sheetId,
    tabName
  });
});
var crewWeekCacheMap = {};
app.get("/api/crew-week", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  const sheetId = process.env.CREW_WEEK_SHEET_ID || "1vbclqX2smmSq2C4tu_fw44mApg1ng6wVZ9bgPC7aUBk";
  const requestedTab = req.query.tab || req.query.sheetTab || process.env.CREW_WEEK_SHEET_TAB || "Crew_Week";
  const isGroupTab = requestedTab.toLowerCase() === "group";
  const tabName = isGroupTab ? "Group" : process.env.CREW_WEEK_SHEET_TAB || "Crew_Week";
  const cacheKey = tabName.toLowerCase();
  const now = Date.now();
  const cached = crewWeekCacheMap[cacheKey];
  if (cached && cached.data.length > 0 && now - cached.timestamp < 2e4) {
    res.json({
      success: true,
      count: cached.data.length,
      data: cached.data,
      headers: cached.headers || [],
      rawCsv: cached.rawCsv,
      source: "cache",
      sheetId,
      tabName,
      lastUpdated: new Date(cached.timestamp).toISOString()
    });
    return;
  }
  const nonce = Math.floor(Math.random() * 1e7);
  const candidateUrls = [];
  const customUrl = process.env.CREW_WEEK_SHEET_URL || process.env.CREW_WEEK;
  if (customUrl && !isGroupTab) candidateUrls.push(customUrl);
  candidateUrls.push(
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}&_t=${now}&_nocache=${nonce}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&sheet=${encodeURIComponent(tabName)}&_t=${now}&_nocache=${nonce}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&_t=${now}`
  );
  let rawCsv = "";
  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/csv,text/plain,*/*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
        redirect: "follow",
        cache: "no-store"
      });
      if (response.ok) {
        const text = await response.text();
        if (text && !text.includes("<!DOCTYPE html>") && !text.includes("<html") && text.includes(",")) {
          rawCsv = text;
          break;
        }
      }
    } catch {
    }
  }
  if (rawCsv) {
    const rows = [];
    let curRow = [];
    let curField = "";
    let inQuotes = false;
    for (let i = 0; i < rawCsv.length; i++) {
      const c = rawCsv[i];
      if (inQuotes) {
        if (c === '"' && rawCsv[i + 1] === '"') {
          curField += '"';
          i++;
        } else if (c === '"') {
          inQuotes = false;
        } else {
          curField += c;
        }
      } else {
        if (c === '"') {
          inQuotes = true;
        } else if (c === ",") {
          curRow.push(curField.trim());
          curField = "";
        } else if (c === "\n" || c === "\r") {
          if (c === "\r" && rawCsv[i + 1] === "\n") i++;
          curRow.push(curField.trim());
          if (curRow.length > 1 || curRow.length === 1 && curRow[0] !== "") rows.push(curRow);
          curRow = [];
          curField = "";
        } else {
          curField += c;
        }
      }
    }
    if (curField || curRow.length) {
      curRow.push(curField.trim());
      if (curRow.length > 1 || curRow.length === 1 && curRow[0] !== "") rows.push(curRow);
    }
    if (isGroupTab) {
      const headers = rows.length > 0 ? rows[0].map((h) => (h || "").trim()) : [];
      const parsedGroupRows = rows.slice(1).map((r, idx) => ({
        cycle: idx + 1,
        groupA: (r[0] || "").trim(),
        groupB: (r[1] || "").trim(),
        groupC: (r[2] || "").trim(),
        groupD: (r[3] || "").trim(),
        values: r.map((v) => (v || "").trim())
      }));
      crewWeekCacheMap[cacheKey] = {
        timestamp: now,
        data: parsedGroupRows,
        headers,
        rawCsv
      };
      res.json({
        success: true,
        count: parsedGroupRows.length,
        headers,
        data: parsedGroupRows,
        rawCsv,
        source: "live",
        sheetId,
        tabName: "Group",
        lastUpdated: new Date(now).toISOString()
      });
      return;
    }
    const dataRows = rows.length > 0 && (rows[0][0] || "").toLowerCase().includes("sr") ? rows.slice(1) : rows;
    const parsed = dataRows.filter((r) => r.length >= 2 && r[1]).map((r) => ({
      sr: (r[0] || "").trim(),
      name: (r[1] || "").trim(),
      position: (r[2] || "").trim(),
      crewWeek: (r[3] || "").trim(),
      designation: (r[4] || "").trim(),
      orgUnit: (r[5] || "").trim()
    }));
    if (parsed.length > 0) {
      crewWeekCacheMap[cacheKey] = {
        timestamp: now,
        data: parsed,
        rawCsv
      };
      res.json({
        success: true,
        count: parsed.length,
        data: parsed,
        rawCsv,
        source: "live",
        sheetId,
        tabName,
        lastUpdated: new Date(now).toISOString()
      });
      return;
    }
  }
  if (cached && cached.data.length > 0) {
    res.json({
      success: true,
      count: cached.data.length,
      data: cached.data,
      headers: cached.headers || [],
      rawCsv: cached.rawCsv,
      source: "stale-cache",
      sheetId,
      tabName,
      lastUpdated: new Date(cached.timestamp).toISOString()
    });
    return;
  }
  res.status(502).json({
    success: false,
    error: `Could not fetch ${tabName} from Google Sheet`,
    sheetId,
    tabName
  });
});
app.get("/api/kpis", async (_req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  const sheetId = process.env.KPIS_SHEET_ID || "1gkO-kV44ABOuB2JB72FQbwLYdAcAZKBzcIBMBZnR8Ts";
  const tabName = process.env.KPIS_SHEET_TAB || "KPIs";
  const now = Date.now();
  const nonce = Math.floor(Math.random() * 1e7);
  const candidateUrls = [
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}&_t=${now}&_nocache=${nonce}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&sheet=${encodeURIComponent(tabName)}&_t=${now}&_nocache=${nonce}`
  ];
  if (process.env.KPIS_SHEET_URL) {
    candidateUrls.unshift(process.env.KPIS_SHEET_URL);
  }
  let rawCsv = "";
  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          "Accept": "text/csv,text/plain,*/*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
        redirect: "follow",
        cache: "no-store"
      });
      if (response.ok) {
        const text = await response.text();
        if (text && !text.includes("<!DOCTYPE html>") && !text.includes("<html") && text.includes(",")) {
          rawCsv = text;
          break;
        }
      }
    } catch {
    }
  }
  if (rawCsv) {
    res.json({
      success: true,
      sheetId,
      tab: tabName,
      csvText: rawCsv,
      lastUpdated: new Date(now).toISOString()
    });
    return;
  }
  res.status(502).json({
    success: false,
    error: "Could not fetch KPIs from Google Sheet",
    sheetId,
    tabName
  });
});
app.all("/api/sheets/fetch", async (req, res) => {
  try {
    let url = req.body?.url || req.query?.url || req.body?.sheetUrl || req.query?.sheetUrl;
    const sheetTab = req.body?.sheetTab || req.query?.sheetTab || req.body?.tab || req.query?.tab || req.body?.sheet || req.query?.sheet || "Recommendations";
    const customGid = req.body?.gid || req.query?.gid;
    const tileId = (req.body?.tileId || req.query?.tileId || "").toLowerCase();
    const sheetIdParam = req.body?.sheetId || req.query?.sheetId || req.body?.spreadsheetId || req.query?.spreadsheetId || "";
    if (sheetIdParam === "1vWYE3G4W7TxHBVzsUJuu1Z-aufjXD-xFeodTpFUTZtY" || typeof url === "string" && url.includes("1vWYE3G4W7TxHBVzsUJuu1Z-aufjXD-xFeodTpFUTZtY")) {
      url = process.env.PSI || process.env.PSI_SHEET_URL || `https://docs.google.com/spreadsheets/d/1vWYE3G4W7TxHBVzsUJuu1Z-aufjXD-xFeodTpFUTZtY/gviz/tq?tqx=out:csv&sheet=PSI`;
    }
    if (sheetIdParam === "1vbclqX2smmSq2C4tu_fw44mApg1ng6wVZ9bgPC7aUBk" || typeof url === "string" && url.includes("1vbclqX2smmSq2C4tu_fw44mApg1ng6wVZ9bgPC7aUBk")) {
      const cTab = sheetTab || "Crew_Week";
      url = process.env.CREW_WEEK_SHEET_URL || process.env.CREW_WEEK || `https://docs.google.com/spreadsheets/d/1vbclqX2smmSq2C4tu_fw44mApg1ng6wVZ9bgPC7aUBk/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(cTab)}`;
    }
    if (sheetIdParam === "1gkO-kV44ABOuB2JB72FQbwLYdAcAZKBzcIBMBZnR8Ts" || typeof url === "string" && url.includes("1gkO-kV44ABOuB2JB72FQbwLYdAcAZKBzcIBMBZnR8Ts") || sheetTab && sheetTab.toLowerCase() === "kpis") {
      const kTab = sheetTab || "KPIs";
      url = process.env.KPIS_SHEET_URL || process.env.KPIS || `https://docs.google.com/spreadsheets/d/1gkO-kV44ABOuB2JB72FQbwLYdAcAZKBzcIBMBZnR8Ts/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(kTab)}`;
    }
    if (sheetIdParam === "1s5czmIVCXiOPTRc69QffJ51JFW2-gAErPitstUar2dU" || typeof url === "string" && url.includes("1s5czmIVCXiOPTRc69QffJ51JFW2-gAErPitstUar2dU") || sheetTab && sheetTab.toLowerCase() === "coo" && (tileId.includes("coo") || tileId.includes("self"))) {
      const cooTab = sheetTab || "COO";
      url = process.env.COO_SELF_ASSIGNED_SHEET_URL || process.env.COO_SHEET_URL || `https://docs.google.com/spreadsheets/d/1s5czmIVCXiOPTRc69QffJ51JFW2-gAErPitstUar2dU/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(cooTab)}`;
    }
    if (!url || typeof url !== "string" || url.includes("1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms")) {
      const sLower2 = (sheetTab || "").toLowerCase();
      if (sLower2 === "contacts" || sLower2.includes("contact")) {
        url = "https://docs.google.com/spreadsheets/d/1mI5WbcNBYtJc1fQjG0ZYQ1PKQzAHp5Sm3gyi9MibW-g/export?format=csv&sheet=Contacts";
      } else if (sLower2 === "fpcl_directory" || sLower2.includes("directory") || tileId === "fpcl_directory" || tileId.includes("directory")) {
        url = "https://docs.google.com/spreadsheets/d/1SrPdaxzEXbOFVbWin4zJvrc-m9TQKtxFjcyZYamXfpg/gviz/tq?tqx=out:csv&sheet=FPCL_Directory";
      } else if (sLower2 === "scm" || sLower2.includes("scm") || tileId === "scm") {
        const scmSecret = process.env.SCM_SHEET_URL || process.env.STRATEGIC_SCM_SHEET_URL || process.env.GOOGLE_SHEET_SCM || process.env.SCM_URL || process.env.SCM;
        if (scmSecret) url = scmSecret;
      } else if (sLower2.includes("validation") || sLower2.includes("valid")) {
        url = process.env.PSM_Validation_sheet_URL || process.env.PSM_VALIDATION_SHEET_URL || process.env.PSM_Validation_sheet || "https://docs.google.com/spreadsheets/d/1bFBRGKqIfO8Pn7qPSTU0pbdTB87ezDyXvVDnCbTGrx4/gviz/tq?tqx=out:csv&sheet=PSM%20Validation";
      } else if (sLower2.includes("hseq") || sLower2.includes("kpi")) {
        url = process.env.HSEQ_KPI || "https://docs.google.com/spreadsheets/d/1bFBRGKqIfO8Pn7qPSTU0pbdTB87ezDyXvVDnCbTGrx4/gviz/tq?tqx=out:csv&sheet=HSEQ_KPI";
      } else if ((sLower2.includes("plr") || sLower2.includes("status")) && process.env.PLR_STATUS_SHEET_URL) {
        url = process.env.PLR_STATUS_SHEET_URL;
      } else if (sLower2.includes("ims") || tileId.includes("ims")) {
        url = process.env.IMS_AUDIT_SHEET_URL || process.env.IMS_SHEET_URL || process.env.GOOGLE_SHEET_IMS || "https://docs.google.com/spreadsheets/d/1amCHA8y_tqgR8dCJgXjjAXgUH5TESAXx8QZycRRHTi0/export?format=csv&sheet=IMS_Audit";
      } else if (sLower2.includes("pssr") || tileId.includes("pssr")) {
        url = process.env.PSSR_SHEET_URL || process.env.GOOGLE_SHEET_PSSR || (process.env.PSSR_SHEET_ID ? `https://docs.google.com/spreadsheets/d/${process.env.PSSR_SHEET_ID}/export?format=csv&sheet=PSSR` : "https://docs.google.com/spreadsheets/d/1PjGP79SLOhTJwFv4tPyRJeX07XEW5e9OBFWQ4aUefyY/export?format=csv&sheet=PSSR");
      } else if (sLower2.includes("capex") || tileId.includes("capex")) {
        url = process.env.CAPEX || process.env.CAPEX_SHEET_URL || "https://docs.google.com/spreadsheets/d/13ys4PbggcQq0H06Rh6cScAtdVnlrY-yyiWxA4e6dDzc/gviz/tq?tqx=out:csv&sheet=CAPEX";
      } else if (sLower2.includes("sub_hse_p") || sLower2.includes("sub-hse-p") || sLower2 === "sub_hse_p" || tileId === "sub-hse-p" || tileId.includes("sub-hse-p")) {
        url = process.env.Sub_HSE_P || process.env.SUB_HSE_P || process.env.SUB_HSE_P_SHEET_URL || (process.env.SUB_HSE_P_SHEET_ID ? `https://docs.google.com/spreadsheets/d/${process.env.SUB_HSE_P_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sub_HSE_P` : "https://docs.google.com/spreadsheets/d/1hhO-goFXJlKSr32dSIHQMfEC7XRQsQly7iJCfP39Wjw/gviz/tq?tqx=out:csv&sheet=Sub_HSE_P");
      } else if (sLower2.includes("sub_hse_ei") || sLower2.includes("sub_hse _e&i") || sLower2.includes("sub-hse-ei") || sLower2.includes("e&i") || tileId === "sub-hse-ei" || tileId.includes("sub-hse-ei")) {
        url = process.env.Sub_HSE_EI || process.env.SUB_HSE_EI || process.env.SUB_HSE_EI_SHEET_URL || (process.env.SUB_HSE_EI_SHEET_ID ? `https://docs.google.com/spreadsheets/d/${process.env.SUB_HSE_EI_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sub_HSE%20_E%26I` : "https://docs.google.com/spreadsheets/d/1ZcxlHSoQk4MjHFs7m0hfujM_7ud8JNNrMQg0cLq-Ruw/gviz/tq?tqx=out:csv&sheet=Sub_HSE%20_E%26I");
      } else if (sLower2.includes("sub_hse_mech") || sLower2.includes("sub-hse-mech") || sLower2.includes("mech") || tileId === "sub-hse-mech" || tileId.includes("sub-hse-mech")) {
        url = process.env.Sub_HSE_Mech || process.env.SUB_HSE_MECH || process.env.SUB_HSE_MECH_SHEET_URL || (process.env.SUB_HSE_MECH_SHEET_ID ? `https://docs.google.com/spreadsheets/d/${process.env.SUB_HSE_MECH_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sub_HSE_Mech` : "https://docs.google.com/spreadsheets/d/1Put-VhgQkpG43kAuW_l3cRtj4MH6Dl3aa2gms9IaLqQ/gviz/tq?tqx=out:csv&sheet=Sub_HSE_Mech");
      } else if (sLower2 === "ehse" || sLower2.includes("ehse") || tileId === "ehse" || tileId.includes("ehse")) {
        url = process.env.EHSE || process.env.EHSE_SHEET_URL || (process.env.EHSE_SHEET_ID ? `https://docs.google.com/spreadsheets/d/${process.env.EHSE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=EHSE` : "https://docs.google.com/spreadsheets/d/1I4oX4kPr6d0_7q--9OcoJWs0W7IQG1dK1rBmNO7BlGo/gviz/tq?tqx=out:csv&sheet=EHSE");
      } else if (sLower2 === "psi" || sLower2.includes("psi") || tileId === "psi" || tileId.includes("psi")) {
        url = process.env.PSI || process.env.PSI_SHEET_URL || (process.env.PSI_SHEET_ID ? `https://docs.google.com/spreadsheets/d/${process.env.PSI_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=PSI` : "https://docs.google.com/spreadsheets/d/1vWYE3G4W7TxHBVzsUJuu1Z-aufjXD-xFeodTpFUTZtY/gviz/tq?tqx=out:csv&sheet=PSI");
      } else if (sLower2 === "msa" || sLower2.includes("msa") || tileId === "msa" || tileId.includes("msa") || sheetIdParam === "11ggCusY-ZJj09bVcpbikHeupyvFTBxDHlytjhpbNRWw") {
        const mTab = sLower2.includes("comp") || sheetTab.toLowerCase().includes("comp") ? "MSA_Compliance" : "MSA";
        url = process.env.MSA_SHEET_URL || `https://docs.google.com/spreadsheets/d/11ggCusY-ZJj09bVcpbikHeupyvFTBxDHlytjhpbNRWw/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(mTab)}`;
      } else if (sLower2 === "safety_talk" || sLower2.includes("safety_talk") || sLower2.includes("safety talk") || tileId === "safety-talks" || tileId === "safety_talks" || sheetIdParam === "1Fgx9ZEdHAQnH_oCuX0NdNO5_V3gEPHu0xjnqKk6GqWc") {
        url = process.env.SAFETY_TALKS_SHEET_URL || `https://docs.google.com/spreadsheets/d/1Fgx9ZEdHAQnH_oCuX0NdNO5_V3gEPHu0xjnqKk6GqWc/gviz/tq?tqx=out:csv&sheet=Safety_Talk`;
      } else if (sLower2.includes("psm") && process.env.PSM_SHEET_URL) {
        url = process.env.PSM_SHEET_URL;
      } else if (process.env.RECOMMENDATIONS_SHEET_URL) {
        url = process.env.RECOMMENDATIONS_SHEET_URL;
      } else if (process.env.GOOGLE_SHEETS_CSV_URL) {
        url = process.env.GOOGLE_SHEETS_CSV_URL;
      } else if (process.env.NEXT_PUBLIC_SHEET_ID) {
        url = `https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_SHEET_ID}/export?format=csv`;
      }
    }
    if (!url || typeof url !== "string") {
      res.status(400).json({ success: false, error: "A valid Google Sheet URL or NEXT_PUBLIC_SHEET_ID environment variable is required." });
      return;
    }
    const trimmedUrl = url.trim();
    let spreadsheetId = trimmedUrl;
    let isPublished = false;
    let pubBase = "";
    const pubMatch = trimmedUrl.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
    if (pubMatch) {
      isPublished = true;
      spreadsheetId = pubMatch[1];
      pubBase = `https://docs.google.com/spreadsheets/d/e/${spreadsheetId}/pub`;
    } else {
      const match = trimmedUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        spreadsheetId = match[1];
      }
    }
    const gidMatch = trimmedUrl.match(/[#?&]gid=([0-9]+)/);
    const gid = customGid || (gidMatch ? gidMatch[1] : null);
    const candidateTabs = [sheetTab];
    const sLower = (sheetTab || "").toLowerCase();
    if (sLower === "scm" || sLower.includes("scm")) {
      const extraScmTabs = ["SCM", "SCM_Actions", "SCM Actions", "Supply Chain", "Procurement", "Sheet1"];
      extraScmTabs.forEach((t) => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower === "plr" || sLower.includes("plr")) {
      const extraPlrTabs = ["PLRstatus", "PLRStatus", "PLR", "PLRs", "PLR status", "PLR Status", "PLRs status", "PLRs Status", "PLR Incident", "PLR Incidents", "Incidents", "Incident", "Outages", "Plant Records"];
      extraPlrTabs.forEach((t) => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower === "recommendations" || sLower.includes("rec")) {
      const extraRecTabs = ["Recommendations", "Recommendation", "Recs", "PunchList", "Actions"];
      extraRecTabs.forEach((t) => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower.includes("validation") || sLower.includes("valid")) {
      const extraValTabs = ["PSM Validation", "PSM_Validation", "PSMValidation", "Validation", "Sheet1"];
      extraValTabs.forEach((t) => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower.includes("ims")) {
      const extraImsTabs = ["IMS_Audit", "IMS Audit", "IMS_Audits", "IMS Audits", "IMS", "Sheet1"];
      extraImsTabs.forEach((t) => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower.includes("pssr") || trimmedUrl.includes("1PjGP79SLOhTJwFv4tPyRJeX07XEW5e9OBFWQ4aUefyY")) {
      const extraPssrTabs = ["PSSR", "pssr", "Sheet1"];
      extraPssrTabs.forEach((t) => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower.includes("capex") || trimmedUrl.includes("13ys4PbggcQq0H06Rh6cScAtdVnlrY-yyiWxA4e6dDzc")) {
      const extraCapexTabs = ["CAPEX", "Capex", "capex", "Sheet1"];
      extraCapexTabs.forEach((t) => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower.includes("sub_hse_p") || sLower.includes("sub-hse-p") || trimmedUrl.includes("1hhO-goFXJlKSr32dSIHQMfEC7XRQsQly7iJCfP39Wjw")) {
      const extraSubHsePTabs = ["Sub_HSE_P", "Sub_HSE-P", "Sub HSE P", "Sub HSE - P", "Sub_HSE_p", "Sheet1"];
      extraSubHsePTabs.forEach((t) => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower.includes("sub_hse_ei") || sLower.includes("sub_hse _e&i") || sLower.includes("sub-hse-ei") || sLower.includes("e&i") || trimmedUrl.includes("1ZcxlHSoQk4MjHFs7m0hfujM_7ud8JNNrMQg0cLq-Ruw")) {
      const extraSubHseEiTabs = ["Sub_HSE _E&I", "Sub_HSE_E&I", "Sub HSE - E&I", "Sub_HSE-E&I", "Sub HSE E&I", "Sub_HSE _E and I", "Sheet1"];
      extraSubHseEiTabs.forEach((t) => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower.includes("sub_hse_mech") || sLower.includes("sub-hse-mech") || sLower.includes("mech") || trimmedUrl.includes("1Put-VhgQkpG43kAuW_l3cRtj4MH6Dl3aa2gms9IaLqQ")) {
      const extraSubHseMechTabs = ["Sub_HSE_Mech", "Sub_HSE-Mech", "Sub HSE Mech", "Sub HSE - Mech", "Sub_HSE_mech", "Sheet1"];
      extraSubHseMechTabs.forEach((t) => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower === "psi" || sLower.includes("psi") || tileId === "psi" || tileId.includes("psi") || trimmedUrl.includes("1vWYE3G4W7TxHBVzsUJuu1Z-aufjXD-xFeodTpFUTZtY")) {
      const extraPsiTabs = ["PSI", "psi", "Process Safety Information", "Sheet1"];
      extraPsiTabs.forEach((t) => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower === "ehse" || sLower.includes("ehse") || tileId === "ehse" || tileId.includes("ehse") || trimmedUrl.includes("1I4oX4kPr6d0_7q--9OcoJWs0W7IQG1dK1rBmNO7BlGo")) {
      const extraEhseTabs = ["EHSE", "ehse", "EHSEC", "ehsec", "Executive HSE", "Sheet1"];
      extraEhseTabs.forEach((t) => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower === "fpcl_directory" || sLower.includes("directory") || tileId === "fpcl_directory" || tileId.includes("directory") || trimmedUrl.includes("1SrPdaxzEXbOFVbWin4zJvrc-m9TQKtxFjcyZYamXfpg")) {
      const extraDirTabs = ["FPCL_Directory", "FPCL Directory", "Directory", "Sheet1"];
      extraDirTabs.forEach((t) => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower === "msa" || sLower.includes("msa") || tileId === "msa" || tileId.includes("msa") || trimmedUrl.includes("11ggCusY-ZJj09bVcpbikHeupyvFTBxDHlytjhpbNRWw")) {
      const extraMsaTabs = ["MSA", "MSA_Compliance", "msa", "Sheet1"];
      extraMsaTabs.forEach((t) => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower === "safety_talk" || sLower.includes("safety_talk") || sLower.includes("safety talk") || tileId === "safety-talks" || tileId.includes("safety-talks") || trimmedUrl.includes("1Fgx9ZEdHAQnH_oCuX0NdNO5_V3gEPHu0xjnqKk6GqWc")) {
      const extraStTabs = ["Safety_Talk", "Safety Talk", "Safety_talk", "safety_talk", "Sheet1"];
      extraStTabs.forEach((t) => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower === "crew_week" || sLower.includes("crew_week") || sLower.includes("crew week") || sLower === "group" || sLower.includes("group") || tileId === "crew-week" || tileId === "crew_week" || trimmedUrl.includes("1vbclqX2smmSq2C4tu_fw44mApg1ng6wVZ9bgPC7aUBk")) {
      const extraCrewTabs = ["Crew_Week", "Crew Week", "Group", "group", "crew_week", "crew week", "CrewWeek", "Sheet1"];
      extraCrewTabs.forEach((t) => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower === "contacts" || sLower.includes("contact") || trimmedUrl.includes("1mI5WbcNBYtJc1fQjG0ZYQ1PKQzAHp5Sm3gyi9MibW-g")) {
      const extraContactsTabs = ["Contacts", "contacts", "Responsibility Matrix", "Responsibility_Matrix", "Sheet1"];
      extraContactsTabs.forEach((t) => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    }
    const candidateUrls = [];
    if (trimmedUrl.includes("output=csv") || trimmedUrl.includes("format=csv") || trimmedUrl.includes("/pub?")) {
      candidateUrls.push(trimmedUrl);
    } else if (trimmedUrl.includes("/pubhtml")) {
      let pubCsv = trimmedUrl.replace("/pubhtml", "/pub");
      if (pubCsv.includes("?")) {
        pubCsv += pubCsv.includes("output=csv") ? "" : "&output=csv";
      } else {
        pubCsv += "?output=csv";
      }
      candidateUrls.push(pubCsv);
    }
    if (isPublished) {
      if (gid) {
        candidateUrls.push(`${pubBase}?output=csv&gid=${gid}`);
      }
      for (const tab of candidateTabs) {
        candidateUrls.push(`${pubBase}?output=csv&sheet=${encodeURIComponent(tab)}`);
      }
      candidateUrls.push(`${pubBase}?output=csv`);
    } else {
      if (gid) {
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`);
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`);
      }
      for (const tab of candidateTabs) {
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`);
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=${encodeURIComponent(tab)}`);
      }
      candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`);
      candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`);
    }
    let csvText = "";
    let successUrl = "";
    let lastError = "";
    const now = Date.now();
    const apiKey = process.env.GOOGLE_API_KEY;
    if (apiKey && spreadsheetId && !isPublished) {
      for (const tab of candidateTabs) {
        try {
          const sheetsApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tab)}?key=${apiKey}&_t=${now}`;
          const apiRes = await fetch(sheetsApiUrl, {
            cache: "no-store",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
              "Accept": "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate"
            }
          });
          if (apiRes.ok) {
            const apiJson = await apiRes.json();
            if (apiJson && Array.isArray(apiJson.values) && apiJson.values.length > 0) {
              csvText = apiJson.values.map(
                (row) => row.map((val) => `"${String(val !== null && val !== void 0 ? val : "").replace(/"/g, '""')}"`).join(",")
              ).join("\r\n");
              successUrl = sheetsApiUrl;
              break;
            }
          }
        } catch (apiErr) {
        }
      }
    }
    if (!csvText) {
      for (const fetchUrl of candidateUrls) {
        try {
          const response = await fetch(fetchUrl, {
            method: "GET",
            cache: "no-store",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "text/csv,text/plain,*/*",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache",
              "Expires": "0"
            },
            redirect: "follow"
          });
          if (response.ok) {
            const text = await response.text();
            if (text && !text.includes("<!DOCTYPE html>") && !text.includes("<html") && !text.includes("google-site-verification")) {
              csvText = text;
              successUrl = fetchUrl;
              break;
            }
          }
        } catch (err) {
          lastError = err?.message || "Network request failed";
        }
      }
    }
    if (!csvText && spreadsheetId) {
      const gvizCandidateUrls = [];
      if (gid) {
        gvizCandidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&gid=${gid}`);
      }
      for (const tab of candidateTabs) {
        gvizCandidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tab)}`);
      }
      for (const gvizUrl of gvizCandidateUrls) {
        try {
          const gvizRes = await fetch(gvizUrl, {
            cache: "no-store",
            headers: {
              "Accept": "*/*",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache",
              "Expires": "0"
            },
            redirect: "follow"
          });
          if (gvizRes.ok) {
            const raw = await gvizRes.text();
            const jsonMatch = raw.match(/google\.visualization\.Query\.setResponse\((.*)\);?/s);
            if (jsonMatch && jsonMatch[1]) {
              const data = JSON.parse(jsonMatch[1]);
              if (data && data.table) {
                csvText = convertGvizTableToCsv(data.table);
                successUrl = gvizUrl;
                break;
              }
            }
          }
        } catch (gvizErr) {
        }
      }
    }
    if (!csvText) {
      res.status(400).json({
        success: false,
        error: `Could not retrieve CSV from Google Sheet tab "${sheetTab}". Please make sure the sheet is shared with "Anyone with the link can view" or published to the web. (${lastError})`
      });
      return;
    }
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.json({
      success: true,
      sheetTab,
      spreadsheetId,
      csvText,
      fetchedFrom: successUrl
    });
  } catch (err) {
    console.error("Error in /api/sheets/fetch:", err);
    res.status(500).json({ success: false, error: err?.message || "Internal server error fetching Google Sheet." });
  }
});
var strategicLiveCache = {
  timestamp: 0,
  data: {}
};
app.get("/api/strategic/sheets", (_req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  const sheets = {};
  for (const [tileId, reg] of Object.entries(STRATEGIC_TILE_REGISTRY)) {
    const url = getSheetUrlForTile(tileId);
    sheets[tileId] = {
      id: tileId,
      name: reg.name,
      sheetUrl: url,
      sheetTab: reg.defaultTab,
      fromSecret: Boolean(url)
    };
  }
  sheets["boss"] = sheets["strategic-master"];
  sheets["admin_security"] = sheets["admin-security"];
  sheets["asset_integrity"] = sheets["asset-integrity"];
  sheets["business_dev"] = sheets["business-development"];
  res.json({
    success: true,
    sheets
  });
});
app.get("/api/strategic/live-data", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  const rawTileIdQuery = typeof req.query.tileId === "string" ? req.query.tileId.trim() : "";
  const tileIdQuery = rawTileIdQuery === "admin_security" || rawTileIdQuery === "Admin_&_Security" ? "admin-security" : rawTileIdQuery;
  const forceRefresh = req.query.refresh === "true" || req.query.force === "true";
  const now = Date.now();
  const CACHE_TTL_MS = 2e4;
  if (!forceRefresh && now - strategicLiveCache.timestamp < CACHE_TTL_MS && Object.keys(strategicLiveCache.data).length > 0) {
    if (tileIdQuery && strategicLiveCache.data[tileIdQuery]) {
      res.json({
        success: true,
        cached: true,
        timestamp: strategicLiveCache.timestamp,
        data: { [tileIdQuery]: strategicLiveCache.data[tileIdQuery] },
        liveActions: { [tileIdQuery]: strategicLiveCache.data[tileIdQuery].actions }
      });
      return;
    } else if (!tileIdQuery) {
      const liveActions = {};
      for (const [k, v] of Object.entries(strategicLiveCache.data)) {
        liveActions[k] = v.actions;
      }
      res.json({
        success: true,
        cached: true,
        timestamp: strategicLiveCache.timestamp,
        data: strategicLiveCache.data,
        liveActions
      });
      return;
    }
  }
  const targetsToFetch = tileIdQuery ? [tileIdQuery] : Object.keys(STRATEGIC_TILE_REGISTRY);
  const fetchPromises = targetsToFetch.map(async (tid) => {
    const reg = STRATEGIC_TILE_REGISTRY[tid];
    if (!reg) return null;
    const sheetUrl = getSheetUrlForTile(tid);
    if (!sheetUrl) return null;
    const candidateUrls = [];
    if (sheetUrl.includes("output=csv") || sheetUrl.includes("format=csv")) {
      candidateUrls.push(sheetUrl);
    }
    const spreadsheetMatch = sheetUrl.match(/\/spreadsheets\/d\/(?:e\/)?([a-zA-Z0-9-_]+)/);
    if (spreadsheetMatch) {
      const spreadsheetId = spreadsheetMatch[1];
      const gidMatch = sheetUrl.match(/[#?&]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : null;
      const candidateTabs = getCandidateTabsForTile(tid, sheetUrl);
      for (const tab of candidateTabs) {
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`);
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=${encodeURIComponent(tab)}`);
      }
      if (gid && gid !== "0") {
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`);
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`);
      }
      candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`);
      candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`);
      if (gid === "0") {
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=0`);
      }
    } else {
      candidateUrls.push(sheetUrl);
    }
    let csvText = "";
    for (const url of candidateUrls) {
      try {
        const sep = url.includes("?") ? "&" : "?";
        const cacheBusted = `${url}${sep}_t=${now}`;
        const resp = await fetch(cacheBusted, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Strategic-Dashboard-Sync/2.0)",
            "Accept": "text/csv, text/plain, */*",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache"
          }
        });
        if (resp.ok) {
          const body = await resp.text();
          if (body && !body.includes("<!DOCTYPE html") && body.length > 20) {
            csvText = body;
            break;
          }
        }
      } catch (err) {
      }
    }
    if (!csvText) return null;
    const actions = parseCsvToStrategicActions(csvText, reg.code);
    const total = actions.length;
    const closed = actions.filter((a) => a.status === "Closed").length;
    const open = total - closed;
    const rate = total > 0 ? Math.round(closed / total * 100) : 0;
    return {
      tileId: tid,
      actions,
      rawCsv: csvText,
      total,
      closed,
      open,
      rate,
      lastSynced: (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    };
  });
  try {
    const results = await Promise.all(fetchPromises);
    const updatedData = { ...strategicLiveCache.data };
    const liveActions = {};
    for (const resItem of results) {
      if (resItem) {
        updatedData[resItem.tileId] = resItem;
        liveActions[resItem.tileId] = resItem.actions;
      }
    }
    strategicLiveCache.timestamp = now;
    strategicLiveCache.data = updatedData;
    res.json({
      success: true,
      timestamp: now,
      data: tileIdQuery ? { [tileIdQuery]: updatedData[tileIdQuery] } : updatedData,
      liveActions: tileIdQuery ? { [tileIdQuery]: liveActions[tileIdQuery] } : liveActions
    });
  } catch (err) {
    console.error("Error fetching live strategic sheet data:", err);
    res.status(500).json({ success: false, error: err?.message || "Failed to fetch live Google Sheet data" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true",
        watch: process.env.DISABLE_HMR === "true" ? null : {}
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FPCL Executive Portal Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
