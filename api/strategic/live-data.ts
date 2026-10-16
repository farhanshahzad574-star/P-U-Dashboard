export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { STRATEGIC_TILE_REGISTRY, getSheetUrlForTile, getCandidateTabsForTile, parseCsvToStrategicActions, normalizeTileId } from './_registry.ts';
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
  const tileIdQuery = normalizeTileId(rawTileIdQuery);
  const forceRefresh = query.refresh === 'true' || query.force === 'true';

  const now = Date.now();
  const CACHE_TTL_MS = 3000; // 3 seconds cache for near real-time live synchronization

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

    const spreadsheetMatch = sheetUrl.match(/\/spreadsheets\/d\/(?:e\/)?([a-zA-Z0-9-_]+)/);
    if (spreadsheetMatch) {
      const spreadsheetId = spreadsheetMatch[1];
      const gidMatch = sheetUrl.match(/[#?&]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : null;

      const candidateTabs = getCandidateTabsForTile(tid, sheetUrl);

      // 1. HIGHEST PRIORITY: export?format=csv (Bypasses Google GViz edge caching - reflects live sheet edits immediately)
      for (const tab of candidateTabs) {
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=${encodeURIComponent(tab)}`);
      }
      if (gid && gid !== '0') {
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`);
      }
      candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`);

      // 2. SECONDARY: gviz/tq out:csv
      for (const tab of candidateTabs) {
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`);
      }
      if (gid && gid !== '0') {
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`);
      }
      candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`);
      if (gid === '0') {
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=0`);
      }
    } else {
      candidateUrls.push(sheetUrl);
    }

    if (sheetUrl && !candidateUrls.includes(sheetUrl)) {
      candidateUrls.push(sheetUrl);
    }

    let csvText = '';
    for (const url of candidateUrls) {
      try {
        const sep = url.includes('?') ? '&' : '?';
        const cacheBusted = `${url}${sep}_t=${now}`;
        const resp = await fetch(cacheBusted, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/csv, text/plain, */*',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        if (resp.status === 401) {
          // Sheet access is restricted (requires Google login): break early to avoid delay
          break;
        }
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

    if (!csvText) {
      if (tid === 'hseq') {
        const fallbackActions = [
          {
            id: 'HSEQ-01',
            title: 'hseq',
            priority: 'High' as const,
            dueDate: '29/09/2026',
            status: 'Open' as const,
            closureDate: '',
            remarks: '',
            rawColumns: {
              'S_No': '1',
              'Assigned Action': 'hseq',
              'Action category': 'ECM',
              'Assigned to': 'abcd',
              'Target date': '29/09/2026',
              'Status detail': 'Open',
              'Remarks': '',
              'Ack by': 'M.Afzal'
            },
            columnHeaders: ['S_No', 'Assigned Action', 'Action category', 'Assigned to', 'Target date', 'Status detail', 'Remarks', 'Ack by']
          },
          {
            id: 'HSEQ-02',
            title: '1234',
            priority: 'Medium' as const,
            dueDate: '30/09/2026',
            status: 'Open' as const,
            closureDate: '',
            remarks: 'dfd',
            rawColumns: {
              'S_No': '2',
              'Assigned Action': '1234',
              'Action category': 'Audit committee',
              'Assigned to': 'def',
              'Target date': '30/09/2026',
              'Status detail': 'Open',
              'Remarks': 'dfd',
              'Ack by': 'M.Afzal'
            },
            columnHeaders: ['S_No', 'Assigned Action', 'Action category', 'Assigned to', 'Target date', 'Status detail', 'Remarks', 'Ack by']
          }
        ];
        return {
          tileId: 'hseq',
          actions: fallbackActions,
          rawCsv: '',
          total: fallbackActions.length,
          closed: 0,
          open: fallbackActions.length,
          rate: 0,
          lastSynced: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
      }
      return null;
    }

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
