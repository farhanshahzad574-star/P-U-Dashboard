import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Structured domain knowledge contexts for the 3 dashboards
const DASHBOARD_CONTEXTS: Record<string, { name: string; description: string; context: string; scopeKeywords: string[] }> = {
  'overview': {
    name: 'Overview',
    description: 'Executive Operations & Compliance Portal Overview Dashboard',
    scopeKeywords: ['overview', 'dashboard', 'portal', 'rollup', 'kpi', 'progress', 'timeline', 'punch list', 'readiness', 'compliance', 'closed', 'open', 'plr', 'psm', 'ehsec', 'sub hse', 'fpcl'],
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
  'plr': {
    name: 'PLR',
    description: 'PLR & Generation Loss Incidents Dashboard Suite',
    scopeKeywords: ['plr', 'production loss', 'production loss report', 'plant loss', 'recommendation', 'incident', 'outage', 'machine', 'stg', 'boiler', 'cfb', 'power failure', 'mwh', 'loss', 'department', 'e&i', 'mechanical', 'operations', 'plant engineering', 'finance', 'fpcl-ke', 'scm', 'ke', 'trip', 'status', 'action'],
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
  'sub-hse-psm': {
    name: 'PSM',
    description: 'Process Safety Management (PSM) Internal Audit Findings Executive Dashboard (Responsible Unit: HSEQ)',
    scopeKeywords: ['psm', 'sub hse', 'audit', 'findings', 'process safety', 'observation', 'cash', 'psg', 'operations', 'e&i', 'mechanical', 'hse', 'hseq', 'l&d', 'pha', 'moc', 'pssr', 'sop', 'mechanical integrity', 'training', 'contractor', 'emergency', 'closure', 'compliance'],
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
  'strategic': {
    name: 'Strategic',
    description: 'Executive Strategic Planning & Initiatives Dashboard',
    scopeKeywords: ['strategic', 'strategy', 'planning', 'milestone', 'initiative', 'governance', 'kpi', 'target', 'vision', 'long-term', 'roadmap', 'boss', 'matrix'],
    context: `
You are the Strategic Assistant for the Strategic dashboard on the FPCL Portal.
Tracks 20 Departmental Tiles across Plant Integrity, Operations, Corporate Services, and Governance.
Includes specialized dashboards for SCM (Supply Chain Management - Faisal Javed), Mechanical, Electrical & Instrumentation, Operations, Finance, IT, and more.
`
  },
  'scm': {
    name: 'SCM',
    description: 'Supply Chain Management Strategic Dashboard (Lead: Faisal Javed)',
    scopeKeywords: ['scm', 'supply chain', 'procurement', 'vendor', 'warehouse', 'spare', 'inventory', 'contract', 'purchase', 'rfq', 'faisal'],
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

// POST /api/chat - Strictly scoped chatbot endpoint for Overview, PLR, and PSM
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, dashboardId, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'A message string is required.' });
      return;
    }

    const key = (dashboardId || 'overview').toLowerCase();
    const config = DASHBOARD_CONTEXTS[key] || DASHBOARD_CONTEXTS['overview'];

    // Strict boundary check: Verify question relevance or check if out-of-scope
    const lowerMsg = message.toLowerCase().trim();
    
    // Obvious out-of-domain patterns
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

    const isExplicitlyOutOfScope = outOfScopePatterns.some(pattern => pattern.test(lowerMsg));

    // Regret message if outside dashboard scope
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

    // If Gemini client is available, run prompt through Gemini with strict system instruction
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
          model: 'gemini-3.8-flash',
          contents: message,
          config: {
            systemInstruction,
            temperature: 0.2,
          }
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Gemini API call timed out after 3500ms')), 3500);
        });

        const response = await Promise.race([geminiPromise, timeoutPromise]);

        const reply = response.text || regretResponse;

        res.json({
          reply,
          dashboardId: key,
          dashboardName: config.name,
          outOfScope: false
        });
        return;
      } catch (geminiErr: any) {
        console.error('Gemini API call failed, falling back to local domain knowledge engine:', geminiErr?.message);
        // Fallback to local deterministic response below
      }
    }

    // Local Deterministic Domain Engine fallback (works seamlessly even if no external API key is active)
    let reply = '';
    if (key === 'plr') {
      if (lowerMsg.includes('machine') || lowerMsg.includes('stg') || lowerMsg.includes('boiler') || lowerMsg.includes('outage') || lowerMsg.includes('equipment')) {
        reply = `**PLR Standardized Machine Breakdown (233 Total Outages):**\n\n- **STG # 4**: 154 outages (66.1% of total losses)\n- **STG # 3**: 17 outages\n- **Boiler # 1 (CFB-1)**: 17 outages\n- **STG # 2**: 11 outages\n- **Boiler # 2 (CFB-2)**: 11 outages\n- **STG # 1**: 10 outages\n- **Other Equipment / Multi-Unit**: 13 outages\n\n*Overall PLR Incident Resolution: 206 Closed, 27 Open (88.4% Resolution Rate).*`;
      } else if (lowerMsg.includes('department') || lowerMsg.includes('e&i') || lowerMsg.includes('mechanical') || lowerMsg.includes('operations') || lowerMsg.includes('recommendation') || lowerMsg.includes('action')) {
        reply = `**PLR Recommendations by Standardized Department (451 Total Records):**\n\n- **E&I**: 196 items (182 closed, 14 open • 92.9% rate)\n- **FPCL-KE Operating Committee**: 79 items (77 closed, 2 open)\n- **Operations**: 45 items (41 closed, 4 open)\n- **Mechanical**: 38 items (34 closed, 4 open)\n- **PE**: 28 items (26 closed, 2 open)\n- **Finance / FPCL-KE O/C**: 25 items (24 closed, 1 open)\n- **SCM**: 11 items (11 closed, 0 open)\n- **KE**: 5 items (5 closed, 0 open)\n- **Mechanical & Inspection**: 4 items (4 closed, 0 open)\n- **Planning**: 2 items (2 closed, 0 open)\n- **HSE**: 1 item (1 closed, 0 open)\n- **Unassigned**: 10 items (6 closed, 4 open)\n\n*Overall Recommendation Status: 420 Closed, 31 Open (93.1% Closure Rate).*`;
      } else if (lowerMsg.includes('open') || lowerMsg.includes('status') || lowerMsg.includes('closure')) {
        reply = `**PLR Dashboard Status Summary:**\n\n- **Recommendations**: 451 Total — 420 Closed, 31 Open (**93.1% Closure Rate**)\n- **PLR Incidents**: 233 Total — 206 Closed, 27 Open (**88.4% Resolution Rate**)\n- **Open Recommendations Owners**: E&I (14), Operations (4), Mechanical (4), Unassigned (4), PE (2), FPCL-KE O/C (2), Finance (1).`;
      } else {
        reply = `The **Plant Loss Recommendations (PLR)** dashboard tracks 233 generation loss incidents and 451 engineering recommendations across FPCL. Key highlights:\n\n- **Incident Resolution**: 206 Closed, 27 Open (88.4%)\n- **Recommendation Closure**: 420 Closed, 31 Open (93.1%)\n- **Top Outage Unit**: STG # 4 (155 incidents)\n- **Top Action Department**: E&I (196 items)\n\nYou can ask me about specific machines, department action workloads, or open action items!`;
      }
    } else if (key === 'sub-hse-psm') {
      if (lowerMsg.includes('department') || lowerMsg.includes('cash') || lowerMsg.includes('psg') || lowerMsg.includes('who has') || lowerMsg.includes('most open')) {
        reply = `**PSM Findings by Action Department (121 Total Findings):**\n\n- **Operations CASH**: 34 findings (23 closed, 11 open • 67.6%)\n- **Operations PSG**: 32 findings (20 closed, 12 open • 62.5%)\n- **E&I**: 16 findings (10 closed, 6 open • 62.5%)\n- **Mechanical**: 14 findings (9 closed, 5 open • 64.3%)\n- **HSE**: 10 findings (6 closed, 4 open • 60.0%)\n- **Learning & Development**: 4 findings (3 closed, 1 open)\n- **HR / Admin**: 3 findings (2 closed, 1 open)\n- **Procurement**: 2 findings (1 closed, 1 open)\n- **IT**: 2 findings (1 closed, 1 open)\n- **Civil**: 2 findings (1 closed, 1 open)\n- **Warehouse**: 2 findings (0 closed, 2 open)\n- **Security**: 1 finding (0 closed, 1 open)\n- **Laboratory**: 1 finding (0 closed, 1 open)\n\n*Overall PSM Status: 76 Closed, 45 Open (62.8% Closure Rate).*`;
      } else if (lowerMsg.includes('element') || lowerMsg.includes('pha') || lowerMsg.includes('moc') || lowerMsg.includes('sop') || lowerMsg.includes('integrity')) {
        reply = `**PSM Elements Tracked in Phase 1 Audit:**\n\n1. **Operating Procedures (SOPs)**: Standard operating envelope and interlocks\n2. **Training & Competency**: Operator qualifications and shift handovers\n3. **Mechanical Integrity (MI)**: Rotating equipment, flange torqueing, vibration alarms\n4. **Management of Change (MOC)**: Temporary vs permanent facility modifications\n5. **Pre-Startup Safety Review (PSSR)**: Safeguard verification prior to startup\n6. **Process Hazard Analysis (PHA)**: Hazard containment and toxic gas mitigation\n7. **Contractor Safety & Emergency Response**: Field permits and drill audits.`;
      } else {
        reply = `The **PSM** dashboard tracks internal audit findings across FPCL:\n\n- **Total Audit Findings**: 121 observations\n- **Resolution Status**: 76 Closed, 45 Open (**62.8% Resolution Rate**)\n- **Largest Action Workloads**: Operations CASH (34 findings) and Operations PSG (32 findings)\n- **Elements Covered**: SOPs, Training, Mechanical Integrity, MOC, PSSR, and PHA.`;
      }
    } else {
      // Overview
      if (lowerMsg.includes('hseq') || lowerMsg.includes('kpi') || lowerMsg.includes('safe manhours') || lowerMsg.includes('fire') || lowerMsg.includes('lti') || lowerMsg.includes('near miss') || lowerMsg.includes('first aid') || lowerMsg.includes('safety')) {
        reply = `**Live HSEQ Safety Key Performance Indicators (Google Sheet: HSEQ_KPI):**\n\n- **Safe Manhours**: **2,200,445 hours** (Zero Lost Time Injury milestone achieved)\n- **Fire Incidents**: **0** (Zero fire occurrences recorded)\n- **Lost Time Injury (LTI)**: **0** (Zero lost workday incidents)\n- **Medical Treatment Cases**: **0** (Nil physician cases)\n- **First Aid Cases**: **5** (Minor site clinic treatments managed)\n- **Near Misses**: **24** (Proactive reporting & hazard identification culture)\n\nThese metrics are synchronized live from the **HSEQ_KPI** Google Sheet tab.`;
      } else if (lowerMsg.includes('closure') || lowerMsg.includes('rate') || lowerMsg.includes('total') || lowerMsg.includes('rollup')) {
        reply = `**Executive Portal Rollup Statistics:**\n\n- **Total Tracked Workload**: 572 items across active Google Sheet connections\n- **Closed Items**: 496 closed\n- **Overall Closure Rate**: **86.7%**\n- **In-Progress Workload**: 76 items (31 PLR recommendations + 45 PSM audit findings)\n- **Overdue Items**: 0 items\n- **Monthly Progress**: 87.8% actual vs 95.0% planned.`;
      } else if (lowerMsg.includes('compare') || lowerMsg.includes('difference') || lowerMsg.includes('vs')) {
        reply = `**Comparison: PLR vs PSM:**\n\n- **Plant Loss Recommendations (PLR)**:\n  * 451 Recommendations: 420 Closed, 31 Open (**93.1% Closure**)\n  * 233 Incidents: 206 Closed, 27 Open (**88.4% Resolution**)\n  * Key Focus: Machine generation outages (STG-4, Boilers) and engineering recommendations.\n\n- **PSM**:\n  * 121 Audit Findings: 76 Closed, 45 Open (**62.8% Closure**)\n  * Key Focus: Process safety compliance across 13 departments (CASH, PSG, E&I, Mechanical).`;
      } else {
        reply = `Welcome to the **Executive Operations & Compliance Portal Overview Assistant**.\n\n- **Active Dashboards**: Plant Loss Recommendations (PLR) & PSM\n- **Upcoming Dashboards**: 9 additional committee dashboards awaiting Google Sheet links\n- **Overall Compliance**: 86.7% across 572 active records\n\nAsk me any question regarding overall portal rollups, progress benchmarks, or module comparisons!`;
      }
    }

    res.json({
      reply,
      dashboardId: key,
      dashboardName: config.name,
      outOfScope: false
    });
  } catch (err: any) {
    console.error('Server /api/chat error:', err);
    res.status(500).json({ error: 'Internal server error processing chat request.' });
  }
});

function convertGvizTableToCsv(table: any): string {
  if (!table || !Array.isArray(table.cols)) return '';
  const headers = table.cols.map((col: any) => {
    const label = (col && (col.label || col.id)) || '';
    return `"${String(label).replace(/"/g, '""')}"`;
  }).join(',');

  const rows = (table.rows || []).map((row: any) => {
    if (!row || !Array.isArray(row.c)) return '';
    return row.c.map((cell: any) => {
      if (!cell || cell.v === null || cell.v === undefined) return '""';
      const val = (cell.f !== undefined && cell.f !== null) ? cell.f : cell.v;
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  return [headers, ...rows].join('\r\n');
}

// GET /api/hseq-kpi - Live HSEQ KPI Feed from Google Sheet HSEQ_KPI
app.get('/api/hseq-kpi', async (req: Request, res: Response): Promise<void> => {
  try {
    let sheetUrl = (req.query?.url as string) || process.env.HSEQ_KPI || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTyc0eRsaIpv3DWLdBbEplWo5FqrNwuCFpFrXM4_A6pRTkQgHz56DaN9FMV0cuCkQXnXfPDyKS_nsYC/pub?gid=553516171&single=true&output=csv';
    sheetUrl = sheetUrl.trim();

    // Prepare candidate URLs
    const candidateUrls: string[] = [];
    if (sheetUrl.includes('/pub') && sheetUrl.includes('output=csv')) {
      candidateUrls.push(sheetUrl);
    } else if (sheetUrl.includes('/pub')) {
      const glue = sheetUrl.includes('?') ? '&' : '?';
      candidateUrls.push(`${sheetUrl}${glue}single=true&output=csv`);
      candidateUrls.push(sheetUrl);
    } else {
      // Standard spreadsheet URL
      const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        const id = match[1];
        const gidMatch = sheetUrl.match(/[#?&]gid=([0-9]+)/);
        const gid = gidMatch ? gidMatch[1] : '553516171';
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`);
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=HSEQ_KPI`);
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&sheet=HSEQ_KPI`);
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`);
      }
      candidateUrls.push(sheetUrl);
    }
    // Always append fallback official published URL
    candidateUrls.push('https://docs.google.com/spreadsheets/d/e/2PACX-1vTyc0eRsaIpv3DWLdBbEplWo5FqrNwuCFpFrXM4_A6pRTkQgHz56DaN9FMV0cuCkQXnXfPDyKS_nsYC/pub?gid=553516171&single=true&output=csv');

    let csvText = '';
    for (const testUrl of candidateUrls) {
      try {
        const response = await fetch(testUrl, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          }
        });
        if (response.ok) {
          const text = await response.text();
          if (text && !text.includes('<!DOCTYPE html>') && text.includes(',')) {
            csvText = text;
            break;
          }
        }
      } catch (fetchErr) {
        // try next candidate
      }
    }

    if (!csvText) {
      throw new Error('Could not fetch CSV content from HSEQ_KPI sheet candidate URLs');
    }

    const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('HSEQ_KPI sheet is empty or missing data rows');
    }

    const parseCsvRow = (rowStr: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map(s => s.replace(/^["']|["']$/g, '').trim());
    };

    const headers = parseCsvRow(lines[0]);
    const values = parseCsvRow(lines[1]);

    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h.toLowerCase().replace(/[^a-z0-9]/g, '')] = values[idx] !== undefined ? values[idx] : '';
    });

    const getNum = (keys: string[], defaultVal: number): number => {
      for (const k of keys) {
        const norm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (record[norm] !== undefined && record[norm] !== '') {
          const parsed = parseInt(record[norm].replace(/,/g, ''), 10);
          if (!isNaN(parsed)) return parsed;
        }
      }
      return defaultVal;
    };

    const safeManhours = getNum(['Safe Manhours', 'Safe_Manhours', 'SafeManhours', 'Manhours'], values[1] ? parseInt(values[1].replace(/,/g, ''), 10) : 2200445);
    const fire = getNum(['Fire', 'Fire Incidents'], values[2] ? parseInt(values[2].replace(/,/g, ''), 10) : 0);
    const lti = getNum(['LTI', 'Lost Time Injury'], values[3] ? parseInt(values[3].replace(/,/g, ''), 10) : 0);
    const medicalTreatment = getNum(['Medical Treatment', 'Medical_Treatment', 'Medical'], values[4] ? parseInt(values[4].replace(/,/g, ''), 10) : 0);
    const firstAidCase = getNum(['First Aid Case', 'First_Aid_Case', 'First Aid', 'FirstAidCase'], values[5] ? parseInt(values[5].replace(/,/g, ''), 10) : 5);
    const nearmiss = getNum(['Nearmiss', 'Near Miss', 'Near Misses'], values[6] ? parseInt(values[6].replace(/,/g, ''), 10) : 24);

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.json({
      success: true,
      sheetName: 'HSEQ_KPI',
      updatedAt: new Date().toISOString(),
      kpis: {
        safeManhours,
        fire,
        lti,
        medicalTreatment,
        firstAidCase,
        nearmiss
      },
      rawHeaders: headers,
      rawValues: values,
      csvText
    });
  } catch (err: any) {
    console.error('Error in /api/hseq-kpi:', err);
    res.json({
      success: false,
      error: err?.message || 'Failed to fetch HSEQ_KPI sheet',
      sheetName: 'HSEQ_KPI',
      updatedAt: new Date().toISOString(),
      kpis: {
        safeManhours: 2200445,
        fire: 0,
        lti: 0,
        medicalTreatment: 0,
        firstAidCase: 5,
        nearmiss: 24
      }
    });
  }
});

// POST & GET /api/sheets/fetch - Live Google Sheets Tab CSV Proxy (supports Recommendations and PLR tabs)
app.all('/api/sheets/fetch', async (req: Request, res: Response): Promise<void> => {
  try {
    let url = req.body?.url || req.query?.url;
    const sheetTab = req.body?.sheetTab || req.query?.sheetTab || 'Recommendations';
    const customGid = req.body?.gid || req.query?.gid;

    // Resolve URL from environment variables if not provided or default placeholder
    if (!url || typeof url !== 'string' || url.includes('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')) {
      const sLower = (sheetTab || '').toLowerCase();
      const tileId = (req.body?.tileId || req.query?.tileId || '').toLowerCase();
      if (sLower === 'scm' || sLower.includes('scm') || tileId === 'scm') {
        const scmSecret = process.env.SCM_SHEET_URL || process.env.STRATEGIC_SCM_SHEET_URL || process.env.GOOGLE_SHEET_SCM || process.env.SCM_URL || process.env.SCM;
        if (scmSecret) url = scmSecret;
      } else if (sLower.includes('validation') || sLower.includes('valid')) {
        url = process.env.PSM_Validation_sheet_URL || process.env.PSM_VALIDATION_SHEET_URL || process.env.PSM_Validation_sheet || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTyc0eRsaIpv3DWLdBbEplWo5FqrNwuCFpFrXM4_A6pRTkQgHz56DaN9FMV0cuCkQXnXfPDyKS_nsYC/pub?gid=1928323828&single=true&output=csv';
      } else if (sLower.includes('hseq') || sLower.includes('kpi')) {
        url = process.env.HSEQ_KPI || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTyc0eRsaIpv3DWLdBbEplWo5FqrNwuCFpFrXM4_A6pRTkQgHz56DaN9FMV0cuCkQXnXfPDyKS_nsYC/pub?gid=553516171&single=true&output=csv';
      } else if ((sLower.includes('plr') || sLower.includes('status')) && process.env.PLR_STATUS_SHEET_URL) {
        url = process.env.PLR_STATUS_SHEET_URL;
      } else if (sLower.includes('psm') && process.env.PSM_SHEET_URL) {
        url = process.env.PSM_SHEET_URL;
      } else if (process.env.RECOMMENDATIONS_SHEET_URL) {
        url = process.env.RECOMMENDATIONS_SHEET_URL;
      } else if (process.env.GOOGLE_SHEETS_CSV_URL) {
        url = process.env.GOOGLE_SHEETS_CSV_URL;
      } else if (process.env.NEXT_PUBLIC_SHEET_ID) {
        url = `https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_SHEET_ID}/export?format=csv`;
      }
    }

    if (!url || typeof url !== 'string') {
      res.status(400).json({ success: false, error: 'A valid Google Sheet URL or NEXT_PUBLIC_SHEET_ID environment variable is required.' });
      return;
    }

    const trimmedUrl = url.trim();
    let spreadsheetId = trimmedUrl;
    let isPublished = false;
    let pubBase = '';

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

    // Extract GID from URL if present
    const gidMatch = trimmedUrl.match(/[#?&]gid=([0-9]+)/);
    const gid = customGid || (gidMatch ? gidMatch[1] : null);

    // Build list of candidate sheet tabs to query
    const candidateTabs: string[] = [sheetTab];
    const sLower = (sheetTab || '').toLowerCase();
    if (sLower === 'scm' || sLower.includes('scm')) {
      const extraScmTabs = ['SCM', 'SCM_Actions', 'SCM Actions', 'Supply Chain', 'Procurement', 'Sheet1'];
      extraScmTabs.forEach(t => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower === 'plr' || sLower.includes('plr')) {
      const extraPlrTabs = ['PLRstatus', 'PLRStatus', 'PLR', 'PLRs', 'PLR status', 'PLR Status', 'PLRs status', 'PLRs Status', 'PLR Incident', 'PLR Incidents', 'Incidents', 'Incident', 'Outages', 'Plant Records'];
      extraPlrTabs.forEach(t => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower === 'recommendations' || sLower.includes('rec')) {
      const extraRecTabs = ['Recommendations', 'Recommendation', 'Recs', 'PunchList', 'Actions'];
      extraRecTabs.forEach(t => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower.includes('validation') || sLower.includes('valid')) {
      const extraValTabs = ['Validation', 'PSM Validation', 'PSM_Validation', 'Sheet1', 'Data'];
      extraValTabs.forEach(t => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    }

    const candidateUrls: string[] = [];

    // If a direct CSV or published link was given, try that first
    if (trimmedUrl.includes('output=csv') || trimmedUrl.includes('format=csv') || trimmedUrl.includes('/pub?')) {
      candidateUrls.push(trimmedUrl);
    } else if (trimmedUrl.includes('/pubhtml')) {
      let pubCsv = trimmedUrl.replace('/pubhtml', '/pub');
      if (pubCsv.includes('?')) {
        pubCsv += (pubCsv.includes('output=csv') ? '' : '&output=csv');
      } else {
        pubCsv += '?output=csv';
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
      // If GID is available from URL or params, prioritize direct gid queries
      if (gid) {
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`);
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`);
      }

      // Google Visualization API and export queries for candidate tabs
      for (const tab of candidateTabs) {
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`);
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=${encodeURIComponent(tab)}`);
      }

      // Universal fallback to primary/default sheet if tab-specific name was not matched
      candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`);
      candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`);
    }

    let csvText = '';
    let successUrl = '';
    let lastError = '';
    const now = Date.now();

    // Fast-path: Google Sheets API v4 if GOOGLE_API_KEY is configured
    const apiKey = process.env.GOOGLE_API_KEY;
    if (apiKey && spreadsheetId && !isPublished) {
      for (const tab of candidateTabs) {
        try {
          const sheetsApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tab)}?key=${apiKey}&_t=${now}`;
          const apiRes = await fetch(sheetsApiUrl, {
            cache: 'no-store',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              'Accept': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
          if (apiRes.ok) {
            const apiJson = (await apiRes.json()) as any;
            if (apiJson && Array.isArray(apiJson.values) && apiJson.values.length > 0) {
              csvText = apiJson.values.map((row: any[]) =>
                row.map((val: any) => `"${String(val !== null && val !== undefined ? val : '').replace(/"/g, '""')}"`).join(',')
              ).join('\r\n');
              successUrl = sheetsApiUrl;
              break;
            }
          }
        } catch (apiErr) {
          // continue to next method
        }
      }
    }

    if (!csvText) {
      for (const fetchUrl of candidateUrls) {
      try {
        const response = await fetch(fetchUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/csv,text/plain,*/*'
          },
          redirect: 'follow'
        });

        if (response.ok) {
          const text = await response.text();
          // Check if response is valid CSV rather than an HTML login / permission error
          if (text && !text.includes('<!DOCTYPE html>') && !text.includes('<html') && !text.includes('google-site-verification')) {
            csvText = text;
            successUrl = fetchUrl;
            break;
          }
        }
      } catch (err: any) {
        lastError = err?.message || 'Network request failed';
      }
    }
  }

    // Direct Google Visualization JSON fallback if out:csv was HTML-blocked
    if (!csvText && spreadsheetId) {
      const gvizCandidateUrls: string[] = [];
      if (gid) {
        gvizCandidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&gid=${gid}`);
      }
      for (const tab of candidateTabs) {
        gvizCandidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tab)}`);
      }

      for (const gvizUrl of gvizCandidateUrls) {
        try {
          const gvizRes = await fetch(gvizUrl, {
            headers: { 'Accept': '*/*' },
            redirect: 'follow'
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
          // ignore and continue
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

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json({
      success: true,
      sheetTab,
      spreadsheetId,
      csvText,
      fetchedFrom: successUrl
    });
  } catch (err: any) {
    console.error('Error in /api/sheets/fetch:', err);
    res.status(500).json({ success: false, error: err?.message || 'Internal server error fetching Google Sheet.' });
  }
});

import { STRATEGIC_TILE_REGISTRY, getSheetUrlForTile, parseCsvToStrategicActions } from './api/strategic/_registry.ts';
import type { StrategicActionItem } from './api/strategic/_registry.ts';

// In-memory cache for live strategic data
const strategicLiveCache: {
  timestamp: number;
  data: Record<string, {
    actions: StrategicActionItem[];
    rawCsv: string;
    total: number;
    closed: number;
    open: number;
    rate: number;
    lastSynced: string;
  }>;
} = {
  timestamp: 0,
  data: {}
};

// GET /api/strategic/sheets - Exposes configured Strategic Google Sheets
app.get('/api/strategic/sheets', (_req: Request, res: Response): void => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  const sheets: Record<string, any> = {};

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

  // Also include backward-compatible aliases
  sheets['boss'] = sheets['strategic-master'];
  sheets['admin_security'] = sheets['admin-security'];
  sheets['asset_integrity'] = sheets['asset-integrity'];
  sheets['business_dev'] = sheets['business-development'];

  res.json({
    success: true,
    sheets
  });
});

// GET /api/strategic/live-data - Fetches and returns live parsed Google Sheet deliverables
app.get('/api/strategic/live-data', async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  const rawTileIdQuery = typeof req.query.tileId === 'string' ? req.query.tileId.trim() : '';
  const tileIdQuery = rawTileIdQuery === 'admin_security' || rawTileIdQuery === 'Admin_&_Security' ? 'admin-security' : rawTileIdQuery;
  const forceRefresh = req.query.refresh === 'true' || req.query.force === 'true';

  const now = Date.now();
  const CACHE_TTL_MS = 20000; // 20 seconds cache

  // Check if cache is still fresh and covers request
  if (!forceRefresh && (now - strategicLiveCache.timestamp) < CACHE_TTL_MS && Object.keys(strategicLiveCache.data).length > 0) {
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
      const liveActions: Record<string, StrategicActionItem[]> = {};
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

    const spreadsheetMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!spreadsheetMatch) return null;
    const spreadsheetId = spreadsheetMatch[1];
    const gidMatch = sheetUrl.match(/[#?&]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : null;

    const candidateTabs = [reg.defaultTab];
    if (tid === 'admin-security') {
      const extraAdminTabs = ['Admin_Security_Actions', 'Admin_&_Security', 'Admin & Security', 'Admin_Security', 'Admin and Security', 'Admin', 'Security', 'Sheet1'];
      for (const t of extraAdminTabs) {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      }
    } else if (tid === 'scm') {
      const extraScmTabs = ['SCM', 'SCM_Actions', 'SCM Actions', 'Supply Chain', 'Procurement', 'Sheet1'];
      for (const t of extraScmTabs) {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      }
    }

    const candidateUrls: string[] = [];
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

    let csvText = '';
    for (const url of candidateUrls) {
      try {
        const resp = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Strategic-Dashboard-Sync/2.0)',
            'Accept': 'text/csv, text/plain, */*'
          }
        });
        if (resp.ok) {
          const body = await resp.text();
          if (body && !body.includes('<!DOCTYPE html') && body.length > 10) {
            csvText = body;
            break;
          }
        }
      } catch (err) {
        // Continue to next candidate
      }
    }

    if (!csvText) return null;

    const actions = parseCsvToStrategicActions(csvText, reg.code);
    const total = actions.length;
    const closed = actions.filter(a => a.status === 'Closed').length;
    const open = total - closed;
    const rate = total > 0 ? Math.round((closed / total) * 100) : 0;

    return {
      tileId: tid,
      actions,
      rawCsv: csvText,
      total,
      closed,
      open,
      rate,
      lastSynced: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  });

  try {
    const results = await Promise.all(fetchPromises);
    const updatedData: Record<string, any> = { ...strategicLiveCache.data };
    const liveActions: Record<string, StrategicActionItem[]> = {};

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
  } catch (err: any) {
    console.error('Error fetching live strategic sheet data:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch live Google Sheet data' });
  }
});

// Setup Vite development middleware or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FPCL Executive Portal Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
