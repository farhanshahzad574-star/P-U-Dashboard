/**
 * Vercel Serverless Function / Next.js API Route: /api/sheets/fetch
 * Live Google Sheets proxy with zero static caching guarantees
 */

// Next.js App Router / Serverless Dynamic Directives
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { getSheetUrlForTile, STRATEGIC_TILE_REGISTRY, getCandidateTabsForTile } from '../strategic/_registry.ts';

function convertGvizTableToCsv(table: any): string {
  if (!table || !Array.isArray(table.cols)) return '';

  const colCount = table.cols.length;
  const hasColLabels = table.cols.some((c: any) => c && c.label && c.label.trim().length > 0);
  let headers = '';
  let dataRows = table.rows || [];

  if (hasColLabels) {
    headers = table.cols.map((col: any) => {
      const label = (col && (col.label || col.id)) || '';
      return `"${String(label).replace(/"/g, '""')}"`;
    }).join(',');
  } else if (dataRows.length > 0 && dataRows[0] && Array.isArray(dataRows[0].c)) {
    headers = dataRows[0].c.map((cell: any) => {
      const val = cell ? (cell.f !== undefined && cell.f !== null ? cell.f : cell.v) : '';
      return `"${String(val || '').replace(/"/g, '""')}"`;
    }).join(',');
    dataRows = dataRows.slice(1);
  } else {
    headers = table.cols.map((col: any) => `"${String((col && col.id) || '').replace(/"/g, '""')}"`).join(',');
  }

  const rows = dataRows.map((row: any) => {
    if (!row || !Array.isArray(row.c)) return '';
    const cells = [];
    for (let c = 0; c < colCount; c++) {
      const cell = row.c[c];
      if (!cell || cell.v === null || cell.v === undefined) {
        cells.push('""');
      } else {
        const val = (cell.f !== undefined && cell.f !== null) ? cell.f : cell.v;
        cells.push(`"${String(val).replace(/"/g, '""')}"`);
      }
    }
    return cells.join(',');
  });

  return [headers, ...rows].join('\r\n');
}

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    const query = req.query || {};
    let url = body.url || query.url;
    const sheetTab = body.sheetTab || query.sheetTab || 'Recommendations';
    const customGid = body.gid || query.gid;

    // Resolve URL from environment variables or registry if not provided or pointing to placeholder
    if (!url || typeof url !== 'string' || url.includes('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')) {
      const sLower = (sheetTab || '').toLowerCase();
      const rawTileId = (body.tileId || query.tileId || '').toLowerCase();
      const normalizedTileId = rawTileId === 'admin_security' || rawTileId === 'admin & security' ? 'admin-security' : rawTileId;

      if (normalizedTileId && STRATEGIC_TILE_REGISTRY[normalizedTileId]) {
        url = getSheetUrlForTile(normalizedTileId);
      } else if (sLower === 'scm' || sLower.includes('scm') || normalizedTileId === 'scm') {
        url = getSheetUrlForTile('scm');
      } else if (normalizedTileId.includes('admin') || normalizedTileId.includes('security') || sLower.includes('admin') || sLower.includes('security')) {
        url = getSheetUrlForTile('admin-security');
      } else if (sLower.includes('validation') || sLower.includes('valid')) {
        url = process.env.PSM_Validation_sheet_URL || process.env.PSM_VALIDATION_SHEET_URL || process.env.PSM_Validation_sheet || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTyc0eRsaIpv3DWLdBbEplWo5FqrNwuCFpFrXM4_A6pRTkQgHz56DaN9FMV0cuCkQXnXfPDyKS_nsYC/pub?gid=1928323828&single=true&output=csv';
      } else if (sLower.includes('hseq') || sLower.includes('kpi')) {
        url = process.env.HSEQ_KPI || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTyc0eRsaIpv3DWLdBbEplWo5FqrNwuCFpFrXM4_A6pRTkQgHz56DaN9FMV0cuCkQXnXfPDyKS_nsYC/pub?gid=553516171&single=true&output=csv';
      } else if ((sLower.includes('plr') || sLower.includes('status')) && process.env.PLR_STATUS_SHEET_URL) {
        url = process.env.PLR_STATUS_SHEET_URL;
      } else if (sLower.includes('ims') || (normalizedTileId && normalizedTileId.includes('ims'))) {
        url = process.env.IMS_AUDIT_SHEET_URL || process.env.IMS_SHEET_URL || process.env.GOOGLE_SHEET_IMS || 'https://docs.google.com/spreadsheets/d/1amCHA8y_tqgR8dCJgXjjAXgUH5TESAXx8QZycRRHTi0/export?format=csv&sheet=IMS_Audit';
      } else if (sLower.includes('pssr') || normalizedTileId.includes('pssr')) {
        url = process.env.PSSR_SHEET_URL || process.env.GOOGLE_SHEET_PSSR || (process.env.PSSR_SHEET_ID ? `https://docs.google.com/spreadsheets/d/${process.env.PSSR_SHEET_ID}/export?format=csv&sheet=PSSR` : 'https://docs.google.com/spreadsheets/d/1PjGP79SLOhTJwFv4tPyRJeX07XEW5e9OBFWQ4aUefyY/export?format=csv&sheet=PSSR');
      } else if (sLower.includes('capex') || (normalizedTileId && normalizedTileId.includes('capex'))) {
        url = process.env.CAPEX || process.env.CAPEX_SHEET_URL || 'https://docs.google.com/spreadsheets/d/13ys4PbggcQq0H06Rh6cScAtdVnlrY-yyiWxA4e6dDzc/gviz/tq?tqx=out:csv&sheet=CAPEX';
      } else if (sLower.includes('sub_hse_p') || sLower.includes('sub-hse-p') || sLower === 'sub_hse_p' || (normalizedTileId && normalizedTileId.includes('sub-hse-p'))) {
        url = process.env.Sub_HSE_P || process.env.SUB_HSE_P || process.env.SUB_HSE_P_SHEET_URL || (process.env.SUB_HSE_P_SHEET_ID ? `https://docs.google.com/spreadsheets/d/${process.env.SUB_HSE_P_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sub_HSE_P` : 'https://docs.google.com/spreadsheets/d/1hhO-goFXJlKSr32dSIHQMfEC7XRQsQly7iJCfP39Wjw/gviz/tq?tqx=out:csv&sheet=Sub_HSE_P');
      } else if (sLower.includes('sub_hse_ei') || sLower.includes('sub_hse _e&i') || sLower.includes('sub-hse-ei') || sLower.includes('e&i') || (normalizedTileId && normalizedTileId.includes('sub-hse-ei'))) {
        url = process.env.Sub_HSE_EI || process.env.SUB_HSE_EI || process.env.SUB_HSE_EI_SHEET_URL || (process.env.SUB_HSE_EI_SHEET_ID ? `https://docs.google.com/spreadsheets/d/${process.env.SUB_HSE_EI_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sub_HSE%20_E%26I` : 'https://docs.google.com/spreadsheets/d/1ZcxlHSoQk4MjHFs7m0hfujM_7ud8JNNrMQg0cLq-Ruw/gviz/tq?tqx=out:csv&sheet=Sub_HSE%20_E%26I');
      } else if (sLower.includes('sub_hse_mech') || sLower.includes('sub-hse-mech') || sLower.includes('mech') || (normalizedTileId && normalizedTileId.includes('sub-hse-mech'))) {
        url = process.env.Sub_HSE_Mech || process.env.SUB_HSE_MECH || process.env.SUB_HSE_MECH_SHEET_URL || (process.env.SUB_HSE_MECH_SHEET_ID ? `https://docs.google.com/spreadsheets/d/${process.env.SUB_HSE_MECH_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sub_HSE_Mech` : 'https://docs.google.com/spreadsheets/d/1Put-VhgQkpG43kAuW_l3cRtj4MH6Dl3aa2gms9IaLqQ/gviz/tq?tqx=out:csv&sheet=Sub_HSE_Mech');
      } else if (sLower === 'ehse' || sLower.includes('ehse') || (normalizedTileId && normalizedTileId.includes('ehse'))) {
        url = process.env.EHSE || process.env.EHSE_SHEET_URL || (process.env.EHSE_SHEET_ID ? `https://docs.google.com/spreadsheets/d/${process.env.EHSE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=EHSE` : 'https://docs.google.com/spreadsheets/d/1I4oX4kPr6d0_7q--9OcoJWs0W7IQG1dK1rBmNO7BlGo/gviz/tq?tqx=out:csv&sheet=EHSE');
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

    const gidMatch = trimmedUrl.match(/[#?&]gid=([0-9]+)/);
    const gid = customGid || (gidMatch ? gidMatch[1] : null);

    const rawTileId = (body.tileId || query.tileId || '').toLowerCase();
    const normalizedTileId = rawTileId === 'admin_security' || rawTileId === 'admin & security' ? 'admin-security' : rawTileId;

    const candidateTabs: string[] = [];
    if (sheetTab) candidateTabs.push(sheetTab);

    if (normalizedTileId) {
      const tileTabs = getCandidateTabsForTile(normalizedTileId, url);
      tileTabs.forEach(t => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    }

    const sLower = (sheetTab || '').toLowerCase();
    if (sLower === 'scm' || sLower.includes('scm') || normalizedTileId === 'scm') {
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
    } else if (sLower.includes('ims')) {
      const extraImsTabs = ['IMS_Audit', 'IMS Audit', 'IMS_Audits', 'IMS Audits', 'IMS', 'Sheet1'];
      extraImsTabs.forEach(t => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower.includes('pssr') || (normalizedTileId && normalizedTileId.includes('pssr'))) {
      const extraPssrTabs = ['PSSR', 'pssr', 'Sheet1'];
      extraPssrTabs.forEach(t => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower.includes('capex') || (normalizedTileId && normalizedTileId.includes('capex')) || trimmedUrl.includes('13ys4PbggcQq0H06Rh6cScAtdVnlrY-yyiWxA4e6dDzc')) {
      const extraCapexTabs = ['CAPEX', 'Capex', 'capex', 'Sheet1'];
      extraCapexTabs.forEach(t => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower.includes('sub_hse_p') || sLower.includes('sub-hse-p') || trimmedUrl.includes('1hhO-goFXJlKSr32dSIHQMfEC7XRQsQly7iJCfP39Wjw')) {
      const extraSubHsePTabs = ['Sub_HSE_P', 'Sub_HSE-P', 'Sub HSE P', 'Sub HSE - P', 'Sub_HSE_p', 'Sheet1'];
      extraSubHsePTabs.forEach(t => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower.includes('sub_hse_ei') || sLower.includes('sub_hse _e&i') || sLower.includes('sub-hse-ei') || sLower.includes('e&i') || trimmedUrl.includes('1ZcxlHSoQk4MjHFs7m0hfujM_7ud8JNNrMQg0cLq-Ruw')) {
      const extraSubHseEiTabs = ['Sub_HSE _E&I', 'Sub_HSE_E&I', 'Sub HSE - E&I', 'Sub_HSE-E&I', 'Sub HSE E&I', 'Sub_HSE _E and I', 'Sheet1'];
      extraSubHseEiTabs.forEach(t => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower.includes('sub_hse_mech') || sLower.includes('sub-hse-mech') || sLower.includes('mech') || trimmedUrl.includes('1Put-VhgQkpG43kAuW_l3cRtj4MH6Dl3aa2gms9IaLqQ')) {
      const extraSubHseMechTabs = ['Sub_HSE_Mech', 'Sub_HSE-Mech', 'Sub HSE Mech', 'Sub HSE - Mech', 'Sub_HSE_mech', 'Sheet1'];
      extraSubHseMechTabs.forEach(t => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    }

    const candidateUrls: string[] = [];

    if (isPublished) {
      for (const tab of candidateTabs) {
        candidateUrls.push(`${pubBase}?output=csv&sheet=${encodeURIComponent(tab)}`);
      }
      if (gid && gid !== '0') {
        candidateUrls.push(`${pubBase}?output=csv&gid=${gid}`);
      }
      candidateUrls.push(`${pubBase}?output=csv`);
      if (trimmedUrl.includes('output=csv') || trimmedUrl.includes('format=csv') || trimmedUrl.includes('/pub?')) {
        candidateUrls.push(trimmedUrl);
      }
    } else {
      // Prioritize gviz/tq out:csv directly with specific tabs - avoids Google 302 redirects on Vercel IPs
      for (const tab of candidateTabs) {
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`);
      }
      if (gid && gid !== '0') {
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`);
      }
      if (trimmedUrl.includes('gviz/tq')) {
        candidateUrls.push(trimmedUrl);
      }
      for (const tab of candidateTabs) {
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=${encodeURIComponent(tab)}`);
      }
      if (gid && gid !== '0') {
        candidateUrls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`);
      }
      if (trimmedUrl.includes('output=csv') || trimmedUrl.includes('format=csv')) {
        candidateUrls.push(trimmedUrl);
      }
    }

    let csvText = '';
    let successUrl = '';
    let lastError = '';
    const now = Date.now();
    const nonce = Math.floor(Math.random() * 10000000);

    const noCacheHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/csv,text/plain,*/*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    // Fast-path: Google Sheets API v4 if GOOGLE_API_KEY is configured
    const apiKey = process.env.GOOGLE_API_KEY;
    if (apiKey && spreadsheetId && !isPublished) {
      for (const tab of candidateTabs) {
        try {
          const sheetsApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tab)}?key=${apiKey}&_t=${now}`;
          const apiRes = await fetch(sheetsApiUrl, {
            cache: 'no-store',
            headers: noCacheHeaders
          });
          if (apiRes.ok) {
            const apiJson = await apiRes.json();
            if (apiJson && Array.isArray(apiJson.values) && apiJson.values.length > 0) {
              csvText = apiJson.values.map((row: any[]) =>
                row.map((val: any) => `"${String(val !== null && val !== undefined ? val : '').replace(/"/g, '""')}"`).join(',')
              ).join('\r\n');
              successUrl = sheetsApiUrl;
              break;
            }
          }
        } catch (apiErr) {
          // continue to other candidate methods
        }
      }
    }

    for (const fetchUrl of candidateUrls) {
      try {
        const separator = fetchUrl.includes('?') ? '&' : '?';
        const bustedUrl = `${fetchUrl}${separator}_t=${now}&_nocache=${nonce}&t=${now}`;

        const response = await fetch(bustedUrl, {
          method: 'GET',
          cache: 'no-store',
          headers: noCacheHeaders,
          redirect: 'follow'
        });

        if (response.ok) {
          const text = await response.text();
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
          const separator = gvizUrl.includes('?') ? '&' : '?';
          const bustedGvizUrl = `${gvizUrl}${separator}_t=${now}&_nocache=${nonce}&t=${now}`;

          const gvizRes = await fetch(bustedGvizUrl, {
            cache: 'no-store',
            headers: {
              'Accept': '*/*',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
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

    if (csvText) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.status(200).json({
        success: true,
        source: successUrl,
        sheetTab: sheetTab,
        rowCount: csvText.split('\n').filter(Boolean).length,
        csvText
      });
      return;
    }

    res.status(502).json({
      success: false,
      error: `Could not retrieve live CSV from Google Sheets: ${lastError || 'Sheet tab not found or restricted'}`
    });
  } catch (err: any) {
    console.error('Error in /api/sheets/fetch:', err);
    res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
  }
}
