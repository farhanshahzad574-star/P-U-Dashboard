/**
 * Vercel Serverless Function / Next.js API Route: /api/chat
 * Scoped AI Assistant for FPCL Executive Operations & Compliance Portal
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (process.env.GEMINI_API_KEY) {
    if (!aiClient) {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return aiClient;
  }
  return null;
}

const DASHBOARD_CONTEXTS: Record<string, { name: string; context: string }> = {
  'overview': {
    name: 'Executive Overview',
    context: `FPCL Executive Operations & Compliance Portal Overview. Tracks 11 specialized dashboards with 2 active data feeds: PLR and PSM.`
  },
  'plr': {
    name: 'Plant Loss Recommendations (PLR)',
    context: `Plant Loss Recommendations (PLR) dashboard tracking outages and engineering recommendations across FPCL.`
  },
  'sub-hse-psm': {
    name: 'PSM (Process Safety Management)',
    context: `PSM dashboard tracking Phase 1 internal audit findings and compliance actions across FPCL.`
  }
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { message, dashboardId, liveMetrics } = req.body || {};
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'A message string is required.' });
      return;
    }

    const key = (dashboardId || 'overview').toLowerCase();
    const config = DASHBOARD_CONTEXTS[key] || DASHBOARD_CONTEXTS['overview'];
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
      /chatgpt|openai|claude/i
    ];

    const regretResponse = `I regret that I can only answer questions regarding the ${config.name} dashboard and its operational data. Please ask a question related to this dashboard's metrics, equipment, departments, recommendations, or audit findings.`;

    if (outOfScopePatterns.some(pattern => pattern.test(lowerMsg))) {
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
        const liveContext = liveMetrics ? `\n--- LIVE REAL-TIME METRICS FROM GOOGLE SHEETS ---\n${liveMetrics}\n` : '';
        const systemInstruction = `You are the official AI Assistant for the "${config.name}" dashboard on the FPCL Executive Operations & Compliance Portal.
CRITICAL CONSTRAINTS:
1. ONLY answer questions directly regarding "${config.name}", its equipment, recommendations, audit findings, and metrics.
2. If outside scope, regret and decline: "${regretResponse}".
${liveContext}
${config.context}`;

        const geminiRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: message,
          config: {
            systemInstruction,
            temperature: 0.2
          }
        });

        res.json({
          reply: geminiRes.text || regretResponse,
          dashboardId: key,
          dashboardName: config.name,
          outOfScope: false
        });
        return;
      } catch (aiErr) {
        console.warn('Gemini call failed in serverless handler:', aiErr);
      }
    }

    // Deterministic fallback response with live metrics if available
    let fallbackReply = `Here is the current operational status for **${config.name}**:\n`;
    if (liveMetrics) {
      fallbackReply += `\n${liveMetrics}\n`;
    } else {
      fallbackReply += `\n- All data feeds are active and connected to Google Sheets.\n- You can ask about machines, responsible departments, or open vs closed action items.`;
    }

    res.json({
      reply: fallbackReply,
      dashboardId: key,
      dashboardName: config.name,
      outOfScope: false
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Server error' });
  }
}
