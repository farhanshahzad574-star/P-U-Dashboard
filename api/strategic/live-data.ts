export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { STRATEGIC_TILE_REGISTRY, getSheetUrlForTile, getCandidateTabsForTile, parseCsvToStrategicActions } from './_registry.ts';
import type { StrategicActionItem } from './_registry.ts';

// In-memory cache across warm serverless invocations
let strategicLiveCache: {
  timestamp: number;
  data: Record<string, {
    tileId: string;
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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const query = req.query || {};
  const rawTileIdQuery = typeof query.tileId === 'string' ? query.tileId.trim() : '';
  const tileIdQuery = rawTileIdQuery === 'admin_security' || rawTileIdQuery === 'Admin_&_Security' ? 'admin-security' : rawTileIdQuery;
  const forceRefresh = query.refresh === 'true' || query.force === 'true';

  const now = Date.now();
  const CACHE_TTL_MS = 20000; // 20 seconds cache

  // Serve from cache only if not force-refreshing and still fresh
  if (!forceRefresh && (now - strategicLiveCache.timestamp) < CACHE_TTL_MS && Object.keys(strategicLiveCache.data).length > 0) {
    if (tileIdQuery && strategicLiveCache.data[tileIdQuery]) {
      res.status(200).json({
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
      res.status(200).json({
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

    const candidateUrls: string[] = [];

    // Direct URL if already formatted as CSV or published export
    if (sheetUrl.includes('output=csv') || sheetUrl.includes('format=csv')) {
      candidateUrls.push(sheetUrl);
    }

    const spreadsheetMatch = sheetUrl.match(/\/spreadsheets\/d\/(?:e\/)?([a-zA-Z0-9-_]+)/);
    if (spreadsheetMatch) {
      const spreadsheetId = spreadsheetMatch[1];
      const gidMatch = sheetUrl.match(/[#?&]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : null;

      const candidateTabs = getCandidateTabsForTile(tid, sheetUrl);

      // Prioritize tab names first (vital for multi-tab shared sheets)
      for (const tab of candidateTabs) {
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`);
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=${encodeURIComponent(tab)}`);
      }

      // If specific non-zero GID was provided
      if (gid && gid !== '0') {
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`);
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`);
      }

      // Generic spreadsheet fallback
      candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`);
      candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`);
      if (gid === '0') {
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=0`);
      }
    } else {
      candidateUrls.push(sheetUrl);
    }

    let csvText = '';
    for (const url of candidateUrls) {
      try {
        const sep = url.includes('?') ? '&' : '?';
        const cacheBusted = `${url}${sep}_t=${now}`;
        const resp = await fetch(cacheBusted, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Strategic-Dashboard-Sync/2.0)',
            'Accept': 'text/csv, text/plain, */*',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        if (resp.ok) {
          const body = await resp.text();
          if (body && !body.includes('<!DOCTYPE html') && body.length > 20) {
            csvText = body;
            break;
          }
        }
      } catch (err) {
        // Continue to next candidate URL
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

    res.status(200).json({
      success: true,
      timestamp: now,
      data: tileIdQuery ? { [tileIdQuery]: updatedData[tileIdQuery] } : updatedData,
      liveActions: tileIdQuery ? { [tileIdQuery]: liveActions[tileIdQuery] } : liveActions
    });
  } catch (err: any) {
    console.error('Error in /api/strategic/live-data:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch live Google Sheet data' });
  }
}
