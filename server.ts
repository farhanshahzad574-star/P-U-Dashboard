import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

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
  1. Plant Loss Recommendations (PLR): 451 Total Recommendations (420 Closed, 31 Open, 93.1% Closure Rate). 233 Generation Loss Incidents (206 Closed, 27 Open, 88.4% Resolution).
  2. Sub HSE - PSM: 121 Internal Audit Findings (76 Closed, 45 Open, 62.8% Closure Rate) across 13 Action Departments.
- 9 Dashboards are awaiting Google Sheet link integration (EHSEC, Sub HSE-P, Sub HSE-E&I, Sub HSE-Mech, Technical Audit, QA/QC, Environmental, Security, Operational Readiness).
- Total Linked Workload: 572 Total Items (451 Recs + 121 PSM Findings), 496 Closed (86.7% Overall Rate), 76 In-Progress / Open, 0 Overdue.
- Timeline Progress: Actual 87.8% vs Planned 95.0% (Aug benchmark).
- Data Readiness: Master sheet linked and verified for PLR & PSM (100% readiness).
`
  },
  'plr': {
    name: 'Plant Loss Recommendations (PLR)',
    description: 'Plant Loss Recommendations & Generation Loss Incidents Dashboard Suite',
    scopeKeywords: ['plr', 'plant loss', 'recommendation', 'incident', 'outage', 'machine', 'stg', 'boiler', 'cfb', 'power failure', 'mwh', 'loss', 'department', 'e&i', 'mechanical', 'operations', 'plant engineering', 'finance', 'fpcl-ke', 'scm', 'ke', 'trip', 'status', 'action'],
    context: `
You are the PLR Assistant for the Plant Loss Recommendations (PLR) dashboard on the FPCL Portal.
PLR Data Summary (linked to Google Sheet tabs PLRstatus & Recommendations):
1. PLR Incidents (233 total records):
   - 206 Closed, 27 Open (88.4% Resolution Rate).
   - Standardized Machine Breakdown (Column G in PLRstatus):
     * STG # 4: 155 outages (Primary outage driver, ~66.5% of all plant losses).
     * STG # 3: 19 outages.
     * Boiler # 1 (CFB-1): 16 outages.
     * STG # 2: 13 outages.
     * Boiler # 2 (CFB-2): 11 outages.
     * STG # 1: 10 outages.
     * Grid Demand / Low Load: 4 outages.
     * Total Power Failure: 2 outages.
     * Boiler # 1 & 2 (Combined): 2 outages.
     * Multiple Units (STG 1-3): 1 outage.
   - Total generation loss exceeds 1,100,000 MWh.
2. PLR Recommendations (451 total action records):
   - 420 Closed, 31 Open (93.1% Closure Rate).
   - Standardized Department Breakdown (Column F: actionBy in Recommendations):
     * E&I: 196 items (182 closed, 14 open).
     * FPCL-KE Operating Committee: 79 items (77 closed, 2 open).
     * Operations: 45 items (41 closed, 4 open).
     * Mechanical: 38 items (34 closed, 4 open).
     * Plant Engineering (PE): 28 items (26 closed, 2 open).
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
    name: 'Sub HSE - PSM',
    description: 'Process Safety Management (PSM) Internal Audit Findings Executive Dashboard',
    scopeKeywords: ['psm', 'sub hse', 'audit', 'findings', 'process safety', 'observation', 'cash', 'psg', 'operations', 'e&i', 'mechanical', 'hse', 'l&d', 'pha', 'moc', 'pssr', 'sop', 'mechanical integrity', 'training', 'contractor', 'emergency', 'closure', 'compliance'],
    context: `
You are the Sub HSE - PSM Assistant for the Process Safety Management internal audit dashboard.
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
  }
};

// POST /api/chat - Strictly scoped chatbot endpoint for Overview, PLR, and Sub HSE - PSM
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

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: message,
          config: {
            systemInstruction,
            temperature: 0.2,
          }
        });

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
        reply = `**PLR Standardized Machine Breakdown (233 Total Outages):**\n\n- **STG # 4**: 155 outages (Primary outage driver • 66.5% of total losses)\n- **STG # 3**: 19 outages\n- **Boiler # 1 (CFB-1)**: 16 outages\n- **STG # 2**: 13 outages\n- **Boiler # 2 (CFB-2)**: 11 outages\n- **STG # 1**: 10 outages\n- **Grid Demand / Low Load**: 4 outages\n- **Total Power Failure**: 2 outages\n- **Boiler # 1 & 2 Combined**: 2 outages\n- **Multiple Units (STG 1-3)**: 1 outage\n\n*Overall PLR Incident Resolution: 206 Closed, 27 Open (88.4% Resolution Rate).*`;
      } else if (lowerMsg.includes('department') || lowerMsg.includes('e&i') || lowerMsg.includes('mechanical') || lowerMsg.includes('operations') || lowerMsg.includes('recommendation') || lowerMsg.includes('action')) {
        reply = `**PLR Recommendations by Standardized Department (451 Total Records):**\n\n- **E&I**: 196 items (182 closed, 14 open • 92.9% rate)\n- **FPCL-KE Operating Committee**: 79 items (77 closed, 2 open)\n- **Operations**: 45 items (41 closed, 4 open)\n- **Mechanical**: 38 items (34 closed, 4 open)\n- **Plant Engineering (PE)**: 28 items (26 closed, 2 open)\n- **Finance / FPCL-KE O/C**: 25 items (24 closed, 1 open)\n- **SCM**: 11 items (11 closed, 0 open)\n- **KE**: 5 items (5 closed, 0 open)\n- **Mechanical & Inspection**: 4 items (4 closed, 0 open)\n- **Planning**: 2 items (2 closed, 0 open)\n- **HSE**: 1 item (1 closed, 0 open)\n- **Unassigned**: 10 items (6 closed, 4 open)\n\n*Overall Recommendation Status: 420 Closed, 31 Open (93.1% Closure Rate).*`;
      } else if (lowerMsg.includes('open') || lowerMsg.includes('status') || lowerMsg.includes('closure')) {
        reply = `**PLR Dashboard Status Summary:**\n\n- **Recommendations**: 451 Total — 420 Closed, 31 Open (**93.1% Closure Rate**)\n- **PLR Incidents**: 233 Total — 206 Closed, 27 Open (**88.4% Resolution Rate**)\n- **Open Recommendations Owners**: E&I (14), Operations (4), Mechanical (4), Unassigned (4), PE (2), FPCL-KE O/C (2), Finance (1).`;
      } else {
        reply = `The **Plant Loss Recommendations (PLR)** dashboard tracks 233 generation loss incidents and 451 engineering recommendations across FPCL. Key highlights:\n\n- **Incident Resolution**: 206 Closed, 27 Open (88.4%)\n- **Recommendation Closure**: 420 Closed, 31 Open (93.1%)\n- **Top Outage Unit**: STG # 4 (155 incidents)\n- **Top Action Department**: E&I (196 items)\n\nYou can ask me about specific machines, department action workloads, or open action items!`;
      }
    } else if (key === 'sub-hse-psm') {
      if (lowerMsg.includes('department') || lowerMsg.includes('cash') || lowerMsg.includes('psg') || lowerMsg.includes('who has') || lowerMsg.includes('most open')) {
        reply = `**Sub HSE - PSM Findings by Action Department (121 Total Findings):**\n\n- **Operations CASH**: 34 findings (23 closed, 11 open • 67.6%)\n- **Operations PSG**: 32 findings (20 closed, 12 open • 62.5%)\n- **E&I**: 16 findings (10 closed, 6 open • 62.5%)\n- **Mechanical**: 14 findings (9 closed, 5 open • 64.3%)\n- **HSE**: 10 findings (6 closed, 4 open • 60.0%)\n- **Learning & Development**: 4 findings (3 closed, 1 open)\n- **HR / Admin**: 3 findings (2 closed, 1 open)\n- **Procurement**: 2 findings (1 closed, 1 open)\n- **IT**: 2 findings (1 closed, 1 open)\n- **Civil**: 2 findings (1 closed, 1 open)\n- **Warehouse**: 2 findings (0 closed, 2 open)\n- **Security**: 1 finding (0 closed, 1 open)\n- **Laboratory**: 1 finding (0 closed, 1 open)\n\n*Overall PSM Status: 76 Closed, 45 Open (62.8% Closure Rate).*`;
      } else if (lowerMsg.includes('element') || lowerMsg.includes('pha') || lowerMsg.includes('moc') || lowerMsg.includes('sop') || lowerMsg.includes('integrity')) {
        reply = `**PSM Elements Tracked in Phase 1 Audit:**\n\n1. **Operating Procedures (SOPs)**: Standard operating envelope and interlocks\n2. **Training & Competency**: Operator qualifications and shift handovers\n3. **Mechanical Integrity (MI)**: Rotating equipment, flange torqueing, vibration alarms\n4. **Management of Change (MOC)**: Temporary vs permanent facility modifications\n5. **Pre-Startup Safety Review (PSSR)**: Safeguard verification prior to startup\n6. **Process Hazard Analysis (PHA)**: Hazard containment and toxic gas mitigation\n7. **Contractor Safety & Emergency Response**: Field permits and drill audits.`;
      } else {
        reply = `The **Sub HSE - PSM** dashboard tracks internal audit findings across FPCL:\n\n- **Total Audit Findings**: 121 observations\n- **Resolution Status**: 76 Closed, 45 Open (**62.8% Resolution Rate**)\n- **Largest Action Workloads**: Operations CASH (34 findings) and Operations PSG (32 findings)\n- **Elements Covered**: SOPs, Training, Mechanical Integrity, MOC, PSSR, and PHA.`;
      }
    } else {
      // Overview
      if (lowerMsg.includes('closure') || lowerMsg.includes('rate') || lowerMsg.includes('total') || lowerMsg.includes('rollup')) {
        reply = `**Executive Portal Rollup Statistics:**\n\n- **Total Tracked Workload**: 572 items across active Google Sheet connections\n- **Closed Items**: 496 closed\n- **Overall Closure Rate**: **86.7%**\n- **In-Progress Workload**: 76 items (31 PLR recommendations + 45 PSM audit findings)\n- **Overdue Items**: 0 items\n- **Monthly Progress**: 87.8% actual vs 95.0% planned.`;
      } else if (lowerMsg.includes('compare') || lowerMsg.includes('difference') || lowerMsg.includes('vs')) {
        reply = `**Comparison: PLR vs Sub HSE - PSM:**\n\n- **Plant Loss Recommendations (PLR)**:\n  * 451 Recommendations: 420 Closed, 31 Open (**93.1% Closure**)\n  * 233 Incidents: 206 Closed, 27 Open (**88.4% Resolution**)\n  * Key Focus: Machine generation outages (STG-4, Boilers) and engineering recommendations.\n\n- **Sub HSE - PSM**:\n  * 121 Audit Findings: 76 Closed, 45 Open (**62.8% Closure**)\n  * Key Focus: Process safety compliance across 13 departments (CASH, PSG, E&I, Mechanical).`;
      } else {
        reply = `Welcome to the **Executive Operations & Compliance Portal Overview Assistant**.\n\n- **Active Dashboards**: Plant Loss Recommendations (PLR) & Sub HSE - PSM\n- **Upcoming Dashboards**: 9 additional committee dashboards awaiting Google Sheet links\n- **Overall Compliance**: 86.7% across 572 active records\n\nAsk me any question regarding overall portal rollups, progress benchmarks, or module comparisons!`;
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

// POST /api/sheets/fetch - Live Google Sheets Tab CSV Proxy (supports tab 'Recommendations' and column E)
app.post('/api/sheets/fetch', async (req: Request, res: Response): Promise<void> => {
  try {
    const { url, sheetTab = 'Recommendations' } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ success: false, error: 'A valid Google Sheet URL is required.' });
      return;
    }

    const trimmedUrl = url.trim();
    let spreadsheetId = trimmedUrl;
    const match = trimmedUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      spreadsheetId = match[1];
    }

    const candidateUrls: string[] = [];

    // If a direct CSV or published link was given, try that first
    if (trimmedUrl.includes('output=csv') || trimmedUrl.includes('format=csv') || trimmedUrl.includes('/pub?')) {
      candidateUrls.push(trimmedUrl);
    }

    // Google Visualization API CSV export for specific tab (e.g. Recommendations)
    candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetTab)}`);
    // Standard Google Drive export URL
    candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=${encodeURIComponent(sheetTab)}`);

    let csvText = '';
    let successUrl = '';
    let lastError = '';

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
          if (text && !text.includes('<!DOCTYPE html>') && !text.includes('<html')) {
            csvText = text;
            successUrl = fetchUrl;
            break;
          }
        }
      } catch (err: any) {
        lastError = err?.message || 'Network request failed';
      }
    }

    if (!csvText) {
      res.status(400).json({
        success: false,
        error: `Could not retrieve CSV from Google Sheet tab "${sheetTab}". Please make sure the sheet is shared with "Anyone with the link can view" or published to the web. (${lastError})`
      });
      return;
    }

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
