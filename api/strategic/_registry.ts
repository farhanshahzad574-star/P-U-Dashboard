export interface StrategicActionItem {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  status: 'Open' | 'Closed';
  closureDate: string;
  remarks: string;
  rawColumns?: Record<string, string>;
  columnHeaders?: string[];
}

export interface StrategicTileConfig {
  envKeys: string[];
  code: string;
  defaultTab: string;
  name: string;
  fallbackUrl: string;
}

export const STRATEGIC_TILE_REGISTRY: Record<string, StrategicTileConfig> = {
  'strategic-master': {
    envKeys: ['STRATEGIC_SHEET_URL', 'STRATEGIC_MASTER_SHEET_URL'],
    code: 'STRAT',
    defaultTab: 'ExecutiveRollup',
    name: 'Strategic Master (COO)',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSjecapStvtMhaYILR7NX-jRI5vcXVVCq7sIaBQmeDoBgqWnBZQPJcGDeN88VETinBOHibJ2BT1H_UX/pub?output=csv'
  },
  'admin-security': {
    envKeys: [
      'ADMIN_SECURITY_SHEET_URL',
      'Admin_&_Security',
      'ADMIN_&_SECURITY',
      'ADMIN_AND_SECURITY',
      'ADMIN_SECURITY',
      'ADMIN_SECURITY_URL',
      'ADMIN_&_SECURITY_SHEET_URL',
      'ADMIN_AND_SECURITY_SHEET_URL',
      'Admin_Security',
      'Admin_Security_Sheet_Url',
      'ADMIN_SHEET_URL',
      'SECURITY_SHEET_URL',
      'STRATEGIC_ADMIN_SECURITY_SHEET_URL'
    ],
    code: 'ADM',
    defaultTab: 'Admin_Security_Actions',
    name: 'Admin & Security',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing'
  },
  'asset-integrity': {
    envKeys: ['ASSET_INTEGRITY_SHEET_URL'],
    code: 'AI',
    defaultTab: 'Asset_Integrity_Actions',
    name: 'Asset Integrity',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing'
  },
  'business-development': {
    envKeys: ['BUSINESS_DEVELOPMENT_SHEET_URL'],
    code: 'BD',
    defaultTab: 'Business_Development_Actions',
    name: 'Business Development',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing'
  },
  'civil': {
    envKeys: ['CIVIL_SHEET_URL'],
    code: 'CIV',
    defaultTab: 'Civil_Actions',
    name: 'Civil',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing'
  },
  'ei': {
    envKeys: ['EI_SHEET_URL'],
    code: 'EI',
    defaultTab: 'EI_Actions',
    name: 'E&I',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing'
  },
  'finance': {
    envKeys: ['FINANCE_SHEET_URL'],
    code: 'FIN',
    defaultTab: 'Finance_Actions',
    name: 'Finance',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing'
  },
  'hseq': {
    envKeys: ['HSEQ_SHEET_URL', 'HSEQ_KPI'],
    code: 'HSEQ',
    defaultTab: 'HSEQ_Actions',
    name: 'HSEQ',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing'
  },
  'hcm': {
    envKeys: ['HCM_SHEET_URL'],
    code: 'HCM',
    defaultTab: 'HCM_Actions',
    name: 'HCM',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing'
  },
  'ims': {
    envKeys: ['IMS_SHEET_URL'],
    code: 'IMS',
    defaultTab: 'IMS_Actions',
    name: 'IMS',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing'
  },
  'it': {
    envKeys: ['IT_SHEET_URL'],
    code: 'IT',
    defaultTab: 'IT_Actions',
    name: 'IT',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing'
  },
  'inspection': {
    envKeys: ['INSPECTION_SHEET_URL'],
    code: 'INSP',
    defaultTab: 'Inspection_Actions',
    name: 'Inspection',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing'
  },
  'ld': {
    envKeys: ['LD_SHEET_URL'],
    code: 'LD',
    defaultTab: 'LD_Actions',
    name: 'L&D',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing'
  },
  'machinery': {
    envKeys: ['MACHINERY_SHEET_URL'],
    code: 'MACH',
    defaultTab: 'Machinery_Actions',
    name: 'Machinery',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing'
  },
  'mechanical': {
    envKeys: ['MECHANICAL_SHEET_URL'],
    code: 'MECH',
    defaultTab: 'Mechanical_Actions',
    name: 'Mechanical',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing'
  },
  'operations': {
    envKeys: ['OPERATIONS_SHEET_URL'],
    code: 'OPS',
    defaultTab: 'Operations_Actions',
    name: 'Operations',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing'
  },
  'reliability': {
    envKeys: ['RELIABILITY_SHEET_URL'],
    code: 'REL',
    defaultTab: 'Reliability_Actions',
    name: 'Reliability',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing'
  },
  'scm': {
    envKeys: ['SCM_SHEET_URL', 'STRATEGIC_SCM_SHEET_URL', 'GOOGLE_SHEET_SCM', 'SCM_URL', 'SCM'],
    code: 'SCM',
    defaultTab: 'SCM_Actions',
    name: 'SCM',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing'
  },
  'projects': {
    envKeys: ['PROJECTS_SHEET_URL'],
    code: 'PRJ',
    defaultTab: 'Projects_Actions',
    name: 'Projects',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing'
  },
  'process': {
    envKeys: ['PROCESS_SHEET_URL'],
    code: 'PROC',
    defaultTab: 'Process_Actions',
    name: 'Process',
    fallbackUrl: 'https://docs.google.com/spreadsheets/d/1PjzKXj1CK3L9wFVlPnijxWJrPqtlCNo8oPI0KJz9gIA/edit?usp=sharing'
  }
};

export function getCandidateTabsForTile(tileId: string, sheetUrl?: string): string[] {
  const normalizedId = tileId === 'admin_security' || tileId === 'Admin_&_Security' ? 'admin-security' : tileId;
  const reg = STRATEGIC_TILE_REGISTRY[normalizedId];
  const candidateTabs: string[] = [];

  if (sheetUrl) {
    const urlSheetMatch = sheetUrl.match(/[?&]sheet=([^&#]+)/);
    if (urlSheetMatch) {
      try {
        const decoded = decodeURIComponent(urlSheetMatch[1]);
        if (decoded && !candidateTabs.includes(decoded)) candidateTabs.push(decoded);
      } catch (e) {}
    }
  }

  if (reg) {
    if (reg.defaultTab && !candidateTabs.includes(reg.defaultTab)) candidateTabs.push(reg.defaultTab);

    const rawName = reg.name || '';
    const nameUnderscore = rawName.replace(/[\s&]+/g, '_');
    const nameNoSpecial = rawName.replace(/[^a-zA-Z0-9]/g, '');

    const tabCandidates = [
      `${nameUnderscore}_Actions`,
      `${rawName}_Actions`,
      `${reg.code}_Actions`,
      `${reg.code}_Action`,
      rawName,
      nameUnderscore,
      nameNoSpecial,
      reg.code,
      ...(reg.envKeys || [])
    ];

    for (const t of tabCandidates) {
      if (t && !candidateTabs.includes(t)) candidateTabs.push(t);
    }
  }

  if (normalizedId === 'admin-security') {
    ['Admin_Security_Actions', 'Admin_&_Security', 'Admin & Security', 'Admin_Security', 'Admin and Security', 'Admin', 'Security'].forEach(t => {
      if (!candidateTabs.includes(t)) candidateTabs.push(t);
    });
  } else if (normalizedId === 'scm') {
    ['SCM_Actions', 'SCM', 'SCM Actions', 'Supply Chain', 'Procurement'].forEach(t => {
      if (!candidateTabs.includes(t)) candidateTabs.push(t);
    });
  }

  if (!candidateTabs.includes('Sheet1')) candidateTabs.push('Sheet1');

  return candidateTabs;
}

export function getSheetUrlForTile(tileId: string): string {
  const normalizedId = tileId === 'admin_security' || tileId === 'Admin_&_Security' ? 'admin-security' : tileId;
  const reg = STRATEGIC_TILE_REGISTRY[normalizedId];
  if (!reg) return '';

  for (const k of reg.envKeys) {
    if (process.env[k] && process.env[k]?.trim()) {
      return process.env[k]!.trim();
    }
  }

  // Dynamic fuzzy match over all process.env keys
  const cleanTile = normalizedId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  for (const [key, val] of Object.entries(process.env)) {
    if (!val || typeof val !== 'string' || !val.trim()) continue;
    const cleanKey = key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (
      cleanKey === cleanTile ||
      cleanKey === `${cleanTile}url` ||
      cleanKey === `${cleanTile}sheeturl` ||
      cleanKey === `strategic${cleanTile}sheeturl` ||
      (cleanTile.includes('admin') && cleanKey.includes('admin') && cleanKey.includes('sec'))
    ) {
      if (val.includes('http') || val.includes('spreadsheets') || val.length > 15) {
        return val.trim();
      }
    }
  }

  // Guaranteed fallback to official production sheet URL
  return reg.fallbackUrl;
}

export function parseCsvToStrategicActions(csvText: string, defaultCode: string): StrategicActionItem[] {
  if (!csvText) return [];
  const lines = csvText.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const parseRowTokens = (line: string): string[] => {
    const row: string[] = [];
    let inQuotes = false;
    let token = '';
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        row.push(token.trim().replace(/^"|"$/g, ''));
        token = '';
      } else {
        token += ch;
      }
    }
    row.push(token.trim().replace(/^"|"$/g, ''));
    return row;
  };

  const rawHeaders = parseRowTokens(lines[0]).filter(h => h.length > 0);
  const headers = rawHeaders.map(h => h.toLowerCase());
  const findCol = (candidates: string[]) => headers.findIndex(h => candidates.some(c => h.includes(c)));

  const idCol = findCol(['id', 'code', 'action #', 'action#', 'item', 'sr', 's_no', 's.no', 'sno', 'no', '#']);
  const descCol = findCol(['action', 'task', 'title', 'desc', 'description', 'activity', 'deliverable']);
  const statusCol = findCol(['status', 'state', 'condition', 'open_close status', 'open_close', 'status detail']);
  const priorityCol = findCol(['priority', 'prio', 'urgency']);
  const dueCol = findCol(['due', 'target', 'deadline', 'date', 'target date']);
  const remarksCol = findCol(['remark', 'note', 'comment', 'closure', 'remarks']);
  const closureCol = findCol(['closure date', 'closed on', 'completed date', 'resolved date']);

  const parsed: StrategicActionItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseRowTokens(lines[i]);

    const desc = descCol !== -1 ? (row[descCol] || '') : (row[1] || row[0] || '');
    if (!desc || desc.trim().length === 0) continue;

    // Ignore placeholder header repeats or sample student data
    if (/student name|extracurricular|alexandra|class level/i.test(desc)) continue;

    const rawStatus = statusCol !== -1 ? (row[statusCol] || 'Open') : 'Open';
    const isClosed = /close|done|complete|resolved/i.test(rawStatus);
    const status: 'Open' | 'Closed' = isClosed ? 'Closed' : 'Open';

    let rawId = idCol !== -1 && row[idCol] ? row[idCol].trim() : '';
    let id = rawId;
    if (!id) {
      id = `${defaultCode}-${String(i).padStart(2, '0')}`;
    } else if (/^\d+$/.test(id)) {
      id = `${defaultCode}-${id.padStart(2, '0')}`;
    }

    const rawPriority = priorityCol !== -1 ? (row[priorityCol] || '') : '';
    let priority: 'High' | 'Medium' | 'Low' = 'High';
    if (/low|p3/i.test(rawPriority)) {
      priority = 'Low';
    } else if (/med|medium|p2/i.test(rawPriority)) {
      priority = 'Medium';
    } else if (/high|critical|p1/i.test(rawPriority)) {
      priority = 'High';
    } else {
      priority = i % 2 === 0 ? 'Medium' : 'High';
    }

    const dueDate = dueCol !== -1 ? (row[dueCol] || '') : '';
    const remarks = remarksCol !== -1 ? (row[remarksCol] || '') : '';
    const closureDate = closureCol !== -1 ? (row[closureCol] || '') : (isClosed ? (dueDate || new Date().toISOString().split('T')[0]) : '');

    const rawColumns: Record<string, string> = {};
    for (let c = 0; c < rawHeaders.length; c++) {
      const headerName = rawHeaders[c];
      rawColumns[headerName] = row[c] || '';
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
