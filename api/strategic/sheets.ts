export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { STRATEGIC_TILE_REGISTRY, getSheetUrlForTile } from './_registry.ts';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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

  // Backward-compatible aliases
  sheets['boss'] = sheets['strategic-master'];
  sheets['admin_security'] = sheets['admin-security'];
  sheets['asset_integrity'] = sheets['asset-integrity'];
  sheets['business_dev'] = sheets['business-development'];

  res.status(200).json({
    success: true,
    sheets
  });
}
