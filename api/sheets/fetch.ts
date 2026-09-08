/**
 * Vercel Serverless Function: /api/sheets/fetch
 * Live Google Sheets proxy for Vercel deployments
 */

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
    const body = req.body || {};
    const query = req.query || {};
    const url = body.url || query.url;
    const sheetTab = body.sheetTab || query.sheetTab || 'Recommendations';
    const customGid = body.gid || query.gid;

    if (!url || typeof url !== 'string') {
      res.status(400).json({ success: false, error: 'A valid Google Sheet URL is required.' });
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

    const candidateTabs: string[] = [sheetTab];
    const sLower = (sheetTab || '').toLowerCase();
    if (sLower === 'plr' || sLower.includes('plr')) {
      const extraPlrTabs = ['PLRstatus', 'PLRStatus', 'PLR', 'PLRs', 'PLR status', 'PLR Status', 'PLRs status', 'PLRs Status', 'PLR Incident', 'PLR Incidents', 'Incidents', 'Incident', 'Outages', 'Plant Records'];
      extraPlrTabs.forEach(t => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    } else if (sLower === 'recommendations' || sLower.includes('rec')) {
      const extraRecTabs = ['Recommendations', 'Recommendation', 'Recs', 'PunchList', 'Actions'];
      extraRecTabs.forEach(t => {
        if (!candidateTabs.includes(t)) candidateTabs.push(t);
      });
    }

    const candidateUrls: string[] = [];
    if (trimmedUrl.includes('output=csv') || trimmedUrl.includes('format=csv') || trimmedUrl.includes('/pub?')) {
      candidateUrls.push(trimmedUrl);
    } else if (trimmedUrl.includes('/pubhtml')) {
      candidateUrls.push(trimmedUrl.replace('/pubhtml', '/pub?output=csv'));
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
    }

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

    if (csvText) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
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
