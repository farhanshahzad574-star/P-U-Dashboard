/**
 * FPCL Executive Operations & Compliance Portal
 * Universal Google Sheets Data Fetcher & Live Synchronizer
 * 
 * Zero-Cache Guarantees:
 * - Completely bypasses browser, CDN, and Vercel Edge caching with explicit 'no-store'
 * - Appends dynamic timestamp and random nonces to all CSV / GViz endpoints
 * - Native Google Visualization API JSONP protocol eliminates Cross-Origin (CORS) limits on Vercel
 * - Seamless multi-tier fallback (Serverless Proxy -> JSONP -> Direct -> CORS Proxy)
 */

(function () {
  'use strict';

  /**
   * Converts Google Visualization API table object to standard RFC-4180 CSV text
   */
  function convertGvizTableToCsv(table) {
    if (!table || !Array.isArray(table.cols)) return '';

    // Extract headers from column definitions
    const headers = table.cols.map(col => {
      const label = (col && (col.label || col.id)) || '';
      return `"${String(label).replace(/"/g, '""')}"`;
    }).join(',');

    // Extract data rows
    const rows = (table.rows || []).map(row => {
      if (!row || !Array.isArray(row.c)) return '';
      return row.c.map(cell => {
        if (!cell || cell.v === null || cell.v === undefined) return '""';
        // Prefer formatted value (f) if present (e.g. formatted dates, strings), else raw value (v)
        const val = (cell.f !== undefined && cell.f !== null) ? cell.f : cell.v;
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    });

    return [headers, ...rows].join('\r\n');
  }

  /**
   * Fetches Google Sheet data directly via Google Visualization JSONP script injection
   * Completely bypasses browser Cross-Origin (CORS) limits on ANY origin (Vercel, AI Studio, localhost)
   * Guaranteed zero-cache with dynamic nonce parameters
   */
  window.fetchGoogleSheetViaJSONP = function (urlOrId, options = {}) {
    return new Promise((resolve, reject) => {
      if (!urlOrId || typeof urlOrId !== 'string') {
        reject(new Error('Invalid Google Sheet URL or ID'));
        return;
      }

      const trimmed = urlOrId.trim();
      let spreadsheetId = trimmed;
      const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (idMatch) {
        spreadsheetId = idMatch[1];
      }

      // Extract GID
      const gidMatch = trimmed.match(/[#?&]gid=([0-9]+)/);
      const gid = options.gid !== undefined && options.gid !== null ? options.gid : (gidMatch ? gidMatch[1] : null);
      const sheetTab = options.sheetTab || null;

      const now = Date.now();
      const nonce = Math.floor(Math.random() * 10000000);
      const callbackName = 'gviz_jsonp_cb_' + now + '_' + nonce;
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;

      const timeoutMs = options.timeout || 15000;
      let timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Google Sheet JSONP request timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      function cleanup() {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        try {
          delete window[callbackName];
        } catch (e) {
          window[callbackName] = undefined;
        }
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      }

      window[callbackName] = function (data) {
        cleanup();
        if (!data || !data.table) {
          reject(new Error('Invalid Google Sheet response structure'));
          return;
        }

        try {
          const csvText = convertGvizTableToCsv(data.table);
          resolve({
            success: true,
            csvText,
            table: data.table,
            rowCount: (data.table.rows || []).length
          });
        } catch (convErr) {
          reject(convErr);
        }
      };

      script.onerror = function () {
        cleanup();
        reject(new Error('Failed to load Google Sheet visualization script. Sheet may not be public.'));
      };

      let gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=responseHandler:${callbackName}`;
      if (gid !== null && gid !== undefined && gid !== '') {
        gvizUrl += `&gid=${gid}`;
      } else if (sheetTab) {
        gvizUrl += `&sheet=${encodeURIComponent(sheetTab)}`;
      }

      // Absolute cache-busting timestamp + random token guarantees immediate reflection of edits
      gvizUrl += `&_t=${now}&_nocache=${nonce}&t=${now}`;

      script.src = gvizUrl;
      (document.head || document.documentElement).appendChild(script);
    });
  };

  /**
   * Resilient multi-tier Google Sheet fetch orchestrator with strict zero-cache policy:
   * Tier 1: Local / Vercel Server API Proxy (/api/sheets/fetch) with cache: 'no-store'
   * Tier 2: Client-side Google Visualization API JSONP (zero CORS, zero cache)
   * Tier 3: Direct browser fetch with cache: 'no-store' and Cache-Control headers
   * Tier 4: Public CORS Proxy fallback (allorigins) with cache-busting query
   */
  window.fetchGoogleSheetData = async function (targetUrl, options = {}) {
    const sheetTab = options.sheetTab || 'Sheet1';
    const gid = options.gid !== undefined ? options.gid : null;
    const now = Date.now();
    const nonce = Math.floor(Math.random() * 10000000);

    const noCacheHeaders = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    // 1. First attempt: Server / Serverless API proxy (/api/sheets/fetch)
    try {
      const proxyRes = await fetch('/api/sheets/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...noCacheHeaders
        },
        body: JSON.stringify({ url: targetUrl, sheetTab, gid, t: now, _nocache: nonce }),
        cache: 'no-store'
      });
      if (proxyRes.ok) {
        const json = await proxyRes.json();
        if (json.success && json.csvText && json.csvText.length > 50) {
          return json.csvText;
        }
      }
    } catch (e) {
      // Server proxy unavailable (e.g. static host without serverless functions) - proceed to JSONP
    }

    // 2. Second attempt: Direct JSONP via Google Visualization API (native browser, no CORS restrictions on Vercel)
    try {
      const jsonpResult = await window.fetchGoogleSheetViaJSONP(targetUrl, { gid, sheetTab });
      if (jsonpResult && jsonpResult.csvText && jsonpResult.csvText.length > 50) {
        return jsonpResult.csvText;
      }
    } catch (jsonpErr) {
      console.warn(`JSONP fetch failed for ${sheetTab} (${targetUrl}):`, jsonpErr);
    }

    // 3. Third attempt: Direct fetch with strict zero-cache flags
    try {
      let candidateUrl = targetUrl;
      if (candidateUrl.includes('/edit')) {
        candidateUrl = candidateUrl.split('/edit')[0] + (gid ? `/export?format=csv&gid=${gid}` : '/export?format=csv');
      }
      const separator = candidateUrl.includes('?') ? '&' : '?';
      const cacheBustedUrl = `${candidateUrl}${separator}_t=${now}&_nocache=${nonce}&t=${now}`;

      const directRes = await fetch(cacheBustedUrl, {
        method: 'GET',
        cache: 'no-store',
        headers: noCacheHeaders
      });
      if (directRes.ok) {
        const text = await directRes.text();
        if (text && !text.includes('<!DOCTYPE html>') && !text.includes('<html') && text.length > 50) {
          return text;
        }
      }
    } catch (directErr) {
      // Direct fetch blocked by CORS or network
    }

    // 4. Fourth attempt: Resilient public CORS proxy
    try {
      const separator = targetUrl.includes('?') ? '&' : '?';
      const targetWithBuster = `${targetUrl}${separator}_t=${now}&t=${now}`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetWithBuster)}&_t=${now}`;
      const proxyRes = await fetch(proxyUrl, {
        cache: 'no-store',
        headers: noCacheHeaders
      });
      if (proxyRes.ok) {
        const text = await proxyRes.text();
        if (text && !text.includes('<!DOCTYPE html>') && !text.includes('<html') && text.length > 50) {
          return text;
        }
      }
    } catch (proxyErr) {
      // Proxy failed
    }

    return '';
  };

  window.FPCL_SHEET_SYNC = {
    convertGvizTableToCsv,
    fetchGoogleSheetViaJSONP: window.fetchGoogleSheetViaJSONP,
    fetchGoogleSheetData: window.fetchGoogleSheetData
  };

})();
