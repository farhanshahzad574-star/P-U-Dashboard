/**
 * FPCL Executive Operations & Compliance Portal
 * CAPEX (Capital Expenditure & Investment Projects) Executive BI Suite
 * 
 * Google Sheet ID: 13ys4PbggcQq0H06Rh6cScAtdVnlrY-yyiWxA4e6dDzc
 * Sheet Tab: CAPEX
 * 
 * All details in this dashboard are dynamically picked from Google Sheet.
 * Prices in Google Sheet are in raw PKR (e.g., 1,000,000 means 1 Million PKR).
 */

(function () {
  'use strict';

  const CAPEX_SHEET_ID = '13ys4PbggcQq0H06Rh6cScAtdVnlrY-yyiWxA4e6dDzc';
  const CAPEX_SHEET_TAB = 'CAPEX';
  const CAPEX_SHEET_URL = `https://docs.google.com/spreadsheets/d/${CAPEX_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${CAPEX_SHEET_TAB}`;

  // Seed baseline matching current live Google Sheet tab CAPEX
  const INITIAL_CAPEX_PROJECTS = [
    {
      sr: 1,
      year: '2024',
      name: 'Econ -4',
      budget: 4000000,
      consumed: 400000,
      commitment: 40000,
      available: 40,
      wbs: 'FL-2024-0002-PRO-01',
      unit: 'Inspection',
      reason: 'Plant Reliability Sustenance',
      serviceLife: '5 Years',
      moc: 'Yes',
      priority: 'A',
      type: 'New',
      category: 'IT',
      quantity: '4',
      strategy: 'To be executed in ATA 2027',
      status: 'Open',
      remarks: 'in progress',
      assigned: 'Inspection',
      background: '',
      problem: '',
      justification: ''
    },
    {
      sr: 2,
      year: '2025',
      name: 'Econ-5',
      budget: 5000000,
      consumed: 500000,
      commitment: 50000,
      available: 50,
      wbs: 'FL-2024-0002-PRO-01',
      unit: 'Operation',
      reason: 'Plant Reliability Sustenance',
      serviceLife: '5 Years',
      moc: 'Yes',
      priority: 'A',
      type: 'New',
      category: 'HSEQ',
      quantity: '5',
      strategy: 'To be executed in ATA 2027',
      status: 'Open',
      remarks: 'guidance needed',
      assigned: 'Operation',
      background: '',
      problem: '',
      justification: ''
    },
    {
      sr: 3,
      year: '2026',
      name: 'Econ -6',
      budget: 6000000,
      consumed: 600000,
      commitment: 60000,
      available: 60,
      wbs: 'FL-2024-0002-PRO-01',
      unit: 'HSE',
      reason: 'Plant Reliability Sustenance',
      serviceLife: '5 Years',
      moc: 'No',
      priority: 'B',
      type: 'Replacement',
      category: 'HSEQ',
      quantity: '6',
      strategy: 'To be executed in ATA 2027',
      status: 'Close',
      remarks: 'completed',
      assigned: 'HSE',
      background: '',
      problem: '',
      justification: ''
    },
    {
      sr: 4,
      year: '2027',
      name: 'Econ-7',
      budget: 7000000,
      consumed: 700000,
      commitment: 70000,
      available: 70,
      wbs: 'FL-2024-0002-PRO-01',
      unit: 'PE',
      reason: 'Plant Reliability Sustenance',
      serviceLife: '5 Years',
      moc: 'No',
      priority: 'B',
      type: 'Replacement',
      category: 'Equipment',
      quantity: '7',
      strategy: 'To be executed in ATA 2027',
      status: 'Close',
      remarks: 'completed',
      assigned: 'PE',
      background: '',
      problem: '',
      justification: ''
    }
  ];

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const PPT_STYLES_CSS = `
    #capex-ppt-modal-container {
      position: fixed !important;
      inset: 0 !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 2147483647 !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #FFFFFF !important;
      --bg-a: #FFFFFF;
      --bg-b: #F8FAFC;
      --panel: #FFFFFF;
      --panel-2: #F8FAFC;
      --ink: #0F172A;
      --muted: #475569;
      --line: rgba(15,23,42,0.1);
      --gold: #D4AF37;
      --gold-ink: #785A18;
      --gold-tint: #FEF3C7;
      --emerald: #059669;
      --emerald-tint: #ECFDF5;
      --rust: #DC2626;
      --rust-tint: #FEF2F2;
      --navy: #1E1B4B;
      --navy-tint: #EEF2FF;
      --radius-lg: 0px;
      --radius-sm: 10px;
      --shadow: none;
    }
    #capex-ppt-modal-container:empty {
      display: none !important;
    }
    #capex-ppt-modal-container[data-theme="navy"] {
      --bg-a: #070D18;
      --bg-b: #0F172A;
      --panel: #FAF9F5;
      --panel-2: #F1EFEA;
      --ink: #0F172A;
      --muted: #64748B;
      --line: rgba(15,23,42,0.12);
      --navy: #0F2042;
      --navy-tint: #EEF2F9;
    }
    #capex-ppt-modal-container[data-theme="graphite"] {
      --bg-a: #090A0D;
      --bg-b: #12141A;
      --panel: #16181F;
      --panel-2: #1E212B;
      --ink: #F8FAFC;
      --muted: #94A3B8;
      --line: rgba(255,255,255,0.12);
      --navy: #1E293B;
      --navy-tint: #26334D;
    }
    #capex-ppt-modal-container[data-theme="emerald"] {
      --bg-a: #041B15;
      --bg-b: #082F25;
      --panel: #FAFCF9;
      --panel-2: #EEF6F0;
      --ink: #06281E;
      --muted: #4B6358;
      --line: rgba(6,40,30,0.12);
      --navy: #064E3B;
      --navy-tint: #D1FAE5;
    }

    .ppt-modal-backdrop {
      position: fixed !important;
      inset: 0 !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 2147483647 !important;
      display: flex;
      flex-direction: column;
      background: #FFFFFF;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: var(--ink);
      transition: background .35s ease;
    }

    .ppt-frame {
      width: 100vw !important;
      height: 100vh !important;
      max-width: 100vw !important;
      max-height: 100vh !important;
      background: #FFFFFF !important;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }
    @media (max-width: 900px) {
      .ppt-frame {
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
    }

    /* Eye-Catching Colorful Marketing Banner Header */
    .ppt-hero {
      background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 22%, #312E81 48%, #4338CA 74%, #6366F1 100%);
      color: #FFFFFF;
      padding: 12px 28px 10px;
      position: relative;
      flex-shrink: 0;
      box-shadow: 0 4px 20px -2px rgba(49,46,129,0.35);
      border-bottom: 3.5px solid #F59E0B;
    }
    @media (max-width: 768px) {
      .ppt-hero {
        padding: 10px 14px 8px;
      }
    }
    .ppt-hero::after {
      content: "";
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 8px;
      background: linear-gradient(180deg, #F59E0B, #EC4899 50%, #8B5CF6 100%);
    }

    .ppt-themebar {
      position: absolute;
      top: 10px;
      right: 22px;
      display: flex;
      align-items: center;
      gap: 7px;
      z-index: 10;
    }
    @media (max-width: 640px) {
      .ppt-themebar {
        top: 8px;
        right: 10px;
        gap: 5px;
      }
    }
    .ppt-theme-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .05em;
      color: #C7D2FE;
      margin-right: 2px;
    }
    @media (max-width: 640px) {
      .ppt-theme-label { display: none; }
    }
    .ppt-swatch {
      width: 19px;
      height: 19px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.7);
      cursor: pointer;
      padding: 0;
      outline: none;
      transition: transform .15s ease, box-shadow .15s ease;
    }
    .ppt-swatch:hover { transform: scale(1.2); }
    .ppt-swatch.active { box-shadow: 0 0 0 2.5px #F59E0B; transform: scale(1.15); }
    .ppt-swatch.white { background: #FFFFFF; border-color: #94A3B8; }
    .ppt-swatch.navy { background: #0F2042; }
    .ppt-swatch.graphite { background: #16181F; }
    .ppt-swatch.emerald { background: #064E3B; }

    .ppt-top-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(255,255,255,0.15);
      color: #FFFFFF;
      border: 1px solid rgba(255,255,255,0.3);
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all .15s ease;
      backdrop-filter: blur(4px);
    }
    .ppt-top-btn:hover {
      background: rgba(255,255,255,0.28);
      color: #FFFFFF;
      transform: translateY(-1px);
    }
    .ppt-top-btn.exit {
      background: rgba(239,68,68,0.35);
      border-color: rgba(239,68,68,0.6);
      color: #FFFFFF;
    }
    .ppt-top-btn.exit:hover {
      background: rgba(239,68,68,0.55);
    }

    .ppt-eyebrow-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 6px;
      padding-right: 220px;
    }
    @media (max-width: 640px) {
      .ppt-eyebrow-row {
        padding-right: 120px;
        gap: 5px;
      }
    }
    .ppt-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .03em;
      color: #0F172A;
      background: linear-gradient(135deg, #FDE047, #F59E0B);
      padding: 3px 10px;
      border-radius: 999px;
      box-shadow: 0 2px 8px -2px rgba(245,158,11,0.5);
    }
    .ppt-id-chip {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #FFFFFF;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.25);
      padding: 3px 9px;
      border-radius: 6px;
    }
    .ppt-filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #A7F3D0;
      background: rgba(16,185,129,0.2);
      border: 1px solid rgba(16,185,129,0.4);
      padding: 3px 8px;
      border-radius: 6px;
    }

    .ppt-title {
      font-family: 'Fraunces', serif;
      font-weight: 700;
      font-size: clamp(19px, 2.0vw, 32px);
      line-height: 1.18;
      margin: 0;
      letter-spacing: -0.015em;
      color: #FFFFFF;
      text-shadow: 0 2px 8px rgba(0,0,0,0.3);
      min-height: 1.15em;
    }

    .ppt-hero-meta {
      display: flex;
      gap: 12px;
      margin-top: 8px;
      flex-wrap: wrap;
    }
    @media (max-width: 640px) {
      .ppt-hero-meta {
        gap: 8px;
        margin-top: 6px;
      }
    }
    .ppt-meta-pill {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.22);
      border-radius: 7px;
      padding: 3px 9px;
      display: flex;
      align-items: center;
      gap: 7px;
      backdrop-filter: blur(4px);
    }
    .ppt-meta-pill .m-label {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .05em;
      color: #C7D2FE;
    }
    .ppt-meta-pill .m-value {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: clamp(11.5px, 0.95vw, 13.5px);
      color: #FFFFFF;
    }

    /* 6 Vibrant Marketing Feature Stat Tiles (Bigger text & values) */
    .ppt-stats {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 12px;
      padding: 10px 28px 6px;
      flex-shrink: 0;
      background: #FFFFFF;
    }
    @media (max-width: 1100px) {
      .ppt-stats { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 640px) {
      .ppt-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        padding: 8px 14px 4px;
      }
    }

    .ppt-stat {
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 12px;
      padding: 10px 14px 11px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      gap: 5px;
      box-shadow: 0 3px 10px -2px rgba(15,23,42,0.06);
      transition: transform .15s ease, box-shadow .15s ease;
      min-height: 76px;
    }
    .ppt-stat:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px -2px rgba(15,23,42,0.1);
    }
    .ppt-stat.wide { grid-column: span 2; }
    @media (max-width: 640px) {
      .ppt-stat.wide { grid-column: span 2; }
    }
    .ppt-stat .k {
      font-size: clamp(13px, 0.98vw, 16px);
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .04em;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      width: 100%;
      gap: 7px;
    }
    .ppt-stat .v {
      font-weight: 900;
      font-size: clamp(17.5px, 1.55vw, 25px);
      min-height: 1.2em;
      word-break: break-word;
      line-height: 1.2;
      text-align: center;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ppt-stat .v2 {
      display: none !important;
    }

    /* Vibrant Stat Theme Styling on White Background */
    .ppt-stat.priority {
      background: linear-gradient(180deg, #FEF2F2 0%, #FFFFFF 100%);
      border-color: #FECACA;
      border-left: 5px solid #DC2626;
    }
    .ppt-stat.priority .k { color: #DC2626; }
    .ppt-stat.priority .v { color: #991B1B; }

    .ppt-stat.budget {
      background: linear-gradient(180deg, #ECFDF5 0%, #FFFFFF 100%);
      border-color: #A7F3D0;
      border-left: 5px solid #059669;
    }
    .ppt-stat.budget .k { color: #059669; }
    .ppt-stat.budget .v {
      font-family: 'JetBrains Mono', monospace;
      font-size: clamp(20px, 1.85vw, 29px);
      color: #047857;
      font-weight: 900;
      text-align: center;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ppt-stat.type {
      background: linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 100%);
      border-color: #BFDBFE;
      border-left: 5px solid #2563EB;
    }
    .ppt-stat.type .k { color: #2563EB; }
    .ppt-stat.type .v { color: #1E40AF; }

    .ppt-stat.moc {
      background: linear-gradient(180deg, #FFFBEB 0%, #FFFFFF 100%);
      border-color: #FDE68A;
      border-left: 5px solid #D97706;
    }
    .ppt-stat.moc .k { color: #D97706; }
    .ppt-stat.moc .v { color: #92400E; }

    .ppt-stat.life {
      background: linear-gradient(180deg, #F0FDFA 0%, #FFFFFF 100%);
      border-color: #99F6E4;
      border-left: 5px solid #0D9488;
    }
    .ppt-stat.life .k { color: #0D9488; }
    .ppt-stat.life .v { color: #115E59; }

    /* 5 Main Body Content Tiles in Marketing Banner Styling */
    .ppt-body-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding: 6px 28px 4px;
      flex: 1;
      min-height: 0;
      background: #FFFFFF;
    }
    @media (max-width: 900px) {
      .ppt-body-grid {
        grid-template-columns: 1fr;
        gap: 10px;
        padding: 6px 14px 4px;
        flex: none;
      }
    }

    .ppt-col {
      display: flex;
      flex-direction: column;
      gap: 10px;
      height: 100%;
      min-height: 0;
    }
    @media (max-width: 900px) {
      .ppt-col {
        height: auto;
        min-height: auto;
      }
    }

    .ppt-card {
      background: #FFFFFF;
      border-radius: 12px;
      border: 1.5px solid #E2E8F0;
      padding: 8px 12px 10px;
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      box-shadow: 0 4px 14px -3px rgba(15,23,42,0.06);
      position: relative;
    }
    @media (max-width: 900px) {
      .ppt-card {
        flex: none;
        height: auto;
        max-height: 240px;
      }
    }

    /* Colorful Marketing Banner Header Strips on Each Card */
    .ppt-card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 12px;
      margin: -8px -12px 8px -12px;
      border-radius: 10px 10px 0 0;
      flex-shrink: 0;
      box-shadow: 0 2px 8px -2px rgba(0,0,0,0.15);
    }
    .ppt-card-head h3 {
      font-family: 'Fraunces', serif;
      font-weight: 700;
      font-size: clamp(13px, 1.0vw, 15.5px);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 7px;
      color: #FFFFFF;
      text-shadow: 0 1px 3px rgba(0,0,0,0.25);
    }

    /* Scrollable Text Body Container */
    .ppt-card-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      padding-right: 6px;
      scrollbar-width: thin;
      scrollbar-color: rgba(99,102,241,0.4) transparent;
    }
    .ppt-card-body::-webkit-scrollbar {
      width: 5px;
    }
    .ppt-card-body::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.03);
      border-radius: 999px;
    }
    .ppt-card-body::-webkit-scrollbar-thumb {
      background: rgba(99,102,241,0.4);
      border-radius: 999px;
    }
    .ppt-card-body::-webkit-scrollbar-thumb:hover {
      background: rgba(99,102,241,0.8);
    }
    .ppt-card-body p {
      margin: 0;
      font-size: clamp(12px, 0.88vw, 14px);
      line-height: 1.55;
      color: #1E293B;
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* Vibrant Banner Header Gradients & Border Colors for the 5 Tiles */
    .ppt-card.card-background {
      border-color: #BFDBFE;
      border-left: 5px solid #2563EB;
      box-shadow: 0 4px 14px -3px rgba(37,99,235,0.15);
    }
    .ppt-card.card-background .ppt-card-head {
      background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #38BDF8 100%);
    }

    .ppt-card.card-problem {
      border-color: #FECACA;
      border-left: 5px solid #DC2626;
      box-shadow: 0 4px 14px -3px rgba(220,38,38,0.15);
    }
    .ppt-card.card-problem .ppt-card-head {
      background: linear-gradient(135deg, #991B1B 0%, #DC2626 50%, #F87171 100%);
    }

    .ppt-card.card-reason {
      border-color: #FDE68A;
      border-left: 5px solid #D97706;
      box-shadow: 0 4px 14px -3px rgba(217,119,6,0.15);
    }
    .ppt-card.card-reason .ppt-card-head {
      background: linear-gradient(135deg, #9A3412 0%, #EA580C 50%, #FBBF24 100%);
    }

    .ppt-card.card-justification {
      border-color: #A7F3D0;
      border-left: 5px solid #059669;
      box-shadow: 0 4px 14px -3px rgba(5,150,105,0.15);
    }
    .ppt-card.card-justification .ppt-card-head {
      background: linear-gradient(135deg, #064E3B 0%, #059669 50%, #34D399 100%);
    }

    .ppt-card.card-status {
      border-color: #DDD6FE;
      border-left: 5px solid #7C3AED;
      box-shadow: 0 4px 14px -3px rgba(124,58,237,0.15);
    }
    .ppt-card.card-status .ppt-card-head {
      background: linear-gradient(135deg, #4C1D95 0%, #7C3AED 50%, #C084FC 100%);
    }

    .ppt-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 999px;
      letter-spacing: .02em;
    }
    .ppt-badge.open {
      background: #FEF3C7;
      color: #92400E;
      border: 1px solid #FDE68A;
    }
    .ppt-badge.closed {
      background: #D1FAE5;
      color: #065F46;
      border: 1px solid #A7F3D0;
    }

    /* Footer Navigation Bar */
    .ppt-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      padding: 8px 28px 10px;
      border-top: 1px solid #E2E8F0;
      background: #FFFFFF;
      flex-shrink: 0;
    }
    @media (max-width: 640px) {
      .ppt-footer {
        padding: 6px 14px 8px;
        gap: 6px;
      }
    }

    .ppt-counter {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 800;
      background: #EEF2FF;
      color: #3730A3;
      border: 1px solid #C7D2FE;
      padding: 4px 12px;
      border-radius: 999px;
    }

    .ppt-nav-btns {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ppt-btn {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-weight: 700;
      font-size: 12px;
      padding: 7px 14px;
      border-radius: 9px;
      border: 1px solid #CBD5E1;
      background: #F8FAFC;
      color: #1E293B;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: transform .12s ease, background .15s ease;
    }
    .ppt-btn:hover { background: #E2E8F0; transform: translateY(-1px); }
    .ppt-btn:active { transform: scale(.97); }
    .ppt-btn.primary {
      background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
      color: #FFFFFF;
      border: none;
      box-shadow: 0 2px 10px -2px rgba(79,70,229,0.4);
    }
    .ppt-btn.primary:hover {
      filter: brightness(1.15);
    }
    .ppt-btn.close {
      background: #FEE2E2;
      color: #991B1B;
      border-color: #FECACA;
    }
    .ppt-btn.close:hover {
      background: #FCA5A5;
      color: #7F1D1D;
    }

    .ppt-side-arrow {
      position: fixed;
      top: 52%;
      transform: translateY(-50%);
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(15,23,42,0.85);
      color: #FFFFFF;
      border: 1.5px solid rgba(255,255,255,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 2147483647;
      transition: all .2s ease;
      backdrop-filter: blur(6px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    }
    .ppt-side-arrow:hover {
      background: #4F46E5;
      border-color: #FFFFFF;
      transform: translateY(-50%) scale(1.1);
    }
    .ppt-side-arrow.left { left: 14px; }
    .ppt-side-arrow.right { right: 14px; }

    .ppt-fade {
      animation: pptFadeIn .25s ease;
    }
    @keyframes pptFadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  const capexSuite = {
    state: {
      searchQuery: '',
      yearFilter: 'all', // Defaults to 'all' so complete multi-year portfolio is visible
      statusFilter: 'all',
      categoryFilter: 'all',
      unitFilter: 'all',
      typeFilter: 'all',
      priorityFilter: 'all',
      classFilter: 'all', // 'all' | 'major' | 'minor'
      page: 1,
      pageSize: 15, // 15 | 25 | 50 | 'all'
      sortColumn: 'sr',
      sortDirection: 'asc',
      selectedProject: null, // For drawer view
      currencyFormat: 'M', // 'M' or 'full'
      isSyncing: false,
      lastSynced: 'Live',
      hoveredCategory: null,
      customSheetUrl: (function() { try { return localStorage.getItem('FPCL_CAPEX_CUSTOM_URL') || ''; } catch(e) { return ''; } })(),
      sheetConnected: true,
      pptActive: false,
      pptIndex: 0,
      pptTheme: 'white'
    },

    init() {
      window.FPCL_CAPEX_SUITE = this;

      // Inject or update PPT Mode styles into document head
      let styleEl = document.getElementById('capex-ppt-styles');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'capex-ppt-styles';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = PPT_STYLES_CSS;

      // Ensure modal container is directly attached to document.body
      if (!document.getElementById('capex-ppt-modal-container')) {
        const modalContainer = document.createElement('div');
        modalContainer.id = 'capex-ppt-modal-container';
        document.body.appendChild(modalContainer);
      }

      // Purge any stale cache that contained mock/dummy projects
      try {
        const cached = localStorage.getItem('FPCL_CAPEX_DATA_CACHE');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const hasDummy = parsed.some(p => (p.name || '').includes('Boiler Tubes Thermal') || (p.name || '').includes('SAP Rise'));
            const hasNewColumns = parsed.some(p => p.background !== undefined || p.problem !== undefined || p.justification !== undefined);
            if (!hasDummy && hasNewColumns) {
              window.FPCL_CAPEX_DATA = parsed;
            } else {
              localStorage.removeItem('FPCL_CAPEX_DATA_CACHE');
              window.FPCL_CAPEX_DATA = JSON.parse(JSON.stringify(INITIAL_CAPEX_PROJECTS));
            }
          }
        }
      } catch (e) {}

      if (!window.FPCL_CAPEX_DATA || window.FPCL_CAPEX_DATA.length === 0) {
        window.FPCL_CAPEX_DATA = JSON.parse(JSON.stringify(INITIAL_CAPEX_PROJECTS));
      }

      this.state.yearFilter = 'all';

      // Immediate live sync from Google Sheet
      this.syncLiveFeed({ silent: true });

      // Periodic auto-sync every 60 seconds
      if (!this._syncTimer) {
        this._syncTimer = setInterval(() => {
          this.syncLiveFeed({ silent: true });
        }, 60000);
      }
    },

    getRawData() {
      if (Array.isArray(window.FPCL_CAPEX_DATA) && window.FPCL_CAPEX_DATA.length > 0) {
        return window.FPCL_CAPEX_DATA;
      }
      return INITIAL_CAPEX_PROJECTS;
    },

    getFilteredData() {
      const raw = this.getRawData();
      const s = this.state;
      const q = (s.searchQuery || '').toLowerCase().trim();

      return raw.filter(item => {
        // Year filter
        if (s.yearFilter !== 'all') {
          if (String(item.year || '').trim() !== String(s.yearFilter).trim()) {
            return false;
          }
        }

        // Status filter (Open / Close)
        if (s.statusFilter !== 'all') {
          const isClosed = (item.status || '').toLowerCase().includes('close');
          if (s.statusFilter === 'open' && isClosed) return false;
          if (s.statusFilter === 'close' && !isClosed) return false;
        }

        // Category filter
        if (s.categoryFilter !== 'all') {
          if ((item.category || '').toLowerCase() !== s.categoryFilter.toLowerCase()) {
            return false;
          }
        }

        // Unit filter
        if (s.unitFilter !== 'all') {
          if ((item.unit || '').toLowerCase() !== s.unitFilter.toLowerCase()) {
            return false;
          }
        }

        // Type filter (Replacement vs New)
        if (s.typeFilter !== 'all') {
          if ((item.type || '').toLowerCase() !== s.typeFilter.toLowerCase()) {
            return false;
          }
        }

        // Priority filter
        if (s.priorityFilter !== 'all') {
          if ((item.priority || '').toLowerCase() !== s.priorityFilter.toLowerCase()) {
            return false;
          }
        }

        // Class filter (Major >4.5M vs Minor <=4.5M)
        if (s.classFilter === 'major' && (item.budget || 0) <= 4500000) return false;
        if (s.classFilter === 'minor' && (item.budget || 0) > 4500000) return false;

        // Search Query across all textual columns
        if (q) {
          const matchName = (item.name || '').toLowerCase().includes(q);
          const matchWbs = (item.wbs || '').toLowerCase().includes(q);
          const matchUnit = (item.unit || '').toLowerCase().includes(q);
          const matchCat = (item.category || '').toLowerCase().includes(q);
          const matchReason = (item.reason || '').toLowerCase().includes(q);
          const matchType = (item.type || '').toLowerCase().includes(q);
          const matchRemarks = (item.remarks || '').toLowerCase().includes(q);
          const matchStrategy = (item.strategy || '').toLowerCase().includes(q);
          const matchYear = String(item.year || '').toLowerCase().includes(q);
          const matchBg = (item.background || '').toLowerCase().includes(q);
          const matchProb = (item.problem || '').toLowerCase().includes(q);
          const matchJust = (item.justification || '').toLowerCase().includes(q);

          if (!matchName && !matchWbs && !matchUnit && !matchCat && !matchReason && !matchType && !matchRemarks && !matchStrategy && !matchYear && !matchBg && !matchProb && !matchJust) {
            return false;
          }
        }

        return true;
      });
    },

    getSortedData(dataset) {
      const list = dataset ? [...dataset] : [...this.getFilteredData()];
      const { sortColumn, sortDirection } = this.state;
      const factor = sortDirection === 'asc' ? 1 : -1;

      return list.sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];

        if (sortColumn === 'budget' || sortColumn === 'consumed' || sortColumn === 'commitment' || sortColumn === 'available' || sortColumn === 'sr') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
          return (valA - valB) * factor;
        }

        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
        if (valA < valB) return -1 * factor;
        if (valA > valB) return 1 * factor;
        return 0;
      });
    },

    getUniqueProjects(dataset) {
      const list = dataset || this.getFilteredData();
      const seen = new Set();
      const unique = [];
      for (const p of list) {
        const srVal = p.sr !== undefined && p.sr !== null && String(p.sr).trim() !== '' ? String(p.sr).trim() : '';
        const yrVal = String(p.year || '').trim();
        const key = srVal ? `sr_${srVal}_${yrVal}` : `name_${String(p.name || '').trim().toLowerCase()}_${yrVal}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(p);
        }
      }
      return unique;
    },

    getKPIs(dataset) {
      const uniqueProjects = this.getUniqueProjects(dataset || this.getFilteredData());
      const totalProjects = uniqueProjects.length;

      let totalBudget = 0;
      let totalConsumed = 0;
      let totalCommitment = 0;
      let totalAvailable = 0;

      let majorBudget = 0;
      let majorCount = 0;
      let minorBudget = 0;
      let minorCount = 0;

      let replacementBudget = 0;
      let replacementCount = 0;
      let newBudget = 0;
      let newCount = 0;

      let majorReplacementBudget = 0;
      let majorReplacementCount = 0;
      let majorNewBudget = 0;
      let majorNewCount = 0;

      let minorReplacementBudget = 0;
      let minorReplacementCount = 0;
      let minorNewBudget = 0;
      let minorNewCount = 0;

      let mocCount = 0;
      let mocReplacementCount = 0;
      let mocNewCount = 0;

      const categories = {};

      uniqueProjects.forEach(item => {
        const b = Number(item.budget) || 0;
        totalBudget += b;
        totalConsumed += Number(item.consumed) || 0;
        totalCommitment += Number(item.commitment) || 0;
        totalAvailable += Number(item.available) || 0;

        // Cost from Column D: projects > 4.5M (4,500,000 PKR) vs <= 4.5M
        const isMajor = b > 4500000;
        if (isMajor) {
          majorBudget += b;
          majorCount++;
        } else {
          minorBudget += b;
          minorCount++;
        }

        // Replacement or New from Column N
        const typeStr = String(item.type || '').toLowerCase();
        const isNew = typeStr.includes('new');
        if (isNew) {
          newBudget += b;
          newCount++;
          if (isMajor) {
            majorNewBudget += b;
            majorNewCount++;
          } else {
            minorNewBudget += b;
            minorNewCount++;
          }
        } else {
          replacementBudget += b;
          replacementCount++;
          if (isMajor) {
            majorReplacementBudget += b;
            majorReplacementCount++;
          } else {
            minorReplacementBudget += b;
            minorReplacementCount++;
          }
        }

        // MOC required or not from Column L
        const isMoc = String(item.moc || '').toLowerCase().includes('yes') || String(item.moc || '').toLowerCase() === 'y' || String(item.moc || '').toLowerCase().includes('req');
        if (isMoc) {
          mocCount++;
          if (isNew) mocNewCount++;
          else mocReplacementCount++;
        }

        // Category from Column O
        const cat = String(item.category || 'Others/Admin').trim() || 'Others/Admin';
        categories[cat] = (categories[cat] || 0) + b;
      });

      const majorTotal = majorBudget;
      const majorRepPct = majorTotal > 0 ? ((majorReplacementBudget / majorTotal) * 100).toFixed(1) : '0.0';
      const majorNewPct = majorTotal > 0 ? ((majorNewBudget / majorTotal) * 100).toFixed(1) : '0.0';

      const minorTotal = minorBudget;
      const minorRepPct = minorTotal > 0 ? ((minorReplacementBudget / minorTotal) * 100).toFixed(1) : '0.0';
      const minorNewPct = minorTotal > 0 ? ((minorNewBudget / minorTotal) * 100).toFixed(1) : '0.0';

      const replacementSharePct = totalBudget > 0 ? ((replacementBudget / totalBudget) * 100).toFixed(1) : '0.0';
      const newSharePct = totalBudget > 0 ? ((newBudget / totalBudget) * 100).toFixed(1) : '0.0';
      const majorSharePct = totalBudget > 0 ? ((majorBudget / totalBudget) * 100).toFixed(1) : '0.0';

      return {
        totalProjects,
        totalBudget,
        totalBudgetMillions: (totalBudget / 1000000).toFixed(1),
        totalConsumed,
        totalCommitment,
        totalAvailable,
        majorBudget,
        majorBudgetMillions: (majorBudget / 1000000).toFixed(1),
        majorCount,
        majorSharePct,
        minorBudget,
        minorBudgetMillions: (minorBudget / 1000000).toFixed(1),
        minorCount,
        replacementBudget,
        replacementBudgetMillions: (replacementBudget / 1000000).toFixed(1),
        replacementCount,
        replacementSharePct,
        newBudget,
        newBudgetMillions: (newBudget / 1000000).toFixed(1),
        newCount,
        newSharePct,
        mocCount,
        mocReplacementCount,
        mocNewCount,
        majorReplacementBudget,
        majorReplacementCount,
        majorNewBudget,
        majorNewCount,
        majorRepPct,
        majorNewPct,
        minorReplacementBudget,
        minorReplacementCount,
        minorNewBudget,
        minorNewCount,
        minorRepPct,
        minorNewPct,
        categories
      };
    },

    formatCurrency(val, compact = false) {
      const num = Number(val) || 0;
      const abs = Math.abs(num);
      if (compact || this.state.currencyFormat === 'M') {
        if (abs >= 1000000) {
          const millions = num / 1000000;
          return `${millions.toFixed(1)} M`;
        }
        if (abs >= 1000) {
          return `${(num / 1000).toFixed(0)} K`;
        }
        return `PKR ${num.toLocaleString('en-US')}`;
      }
      return `PKR ${num.toLocaleString('en-US')}`;
    },

    parseCsv(csvText) {
      if (!csvText || typeof csvText !== 'string') return [];

      const records = [];
      let currentRecord = [];
      let currentField = '';
      let inQuotes = false;
      for (let i = 0; i < csvText.length; i++) {
        const c = csvText[i];
        if (c === '"') {
          if (inQuotes && csvText[i + 1] === '"') {
            currentField += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          currentRecord.push(currentField.trim());
          currentField = '';
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
          if (c === '\r' && csvText[i + 1] === '\n') i++;
          currentRecord.push(currentField.trim());
          currentField = '';
          if (currentRecord.length > 1 || (currentRecord[0] && currentRecord[0] !== '')) {
            records.push(currentRecord);
          }
          currentRecord = [];
        } else {
          currentField += c;
        }
      }
      if (currentField.length > 0 || currentRecord.length > 0) {
        currentRecord.push(currentField.trim());
        records.push(currentRecord);
      }

      if (records.length < 2) return [];

      const headers = records[0];
      const colMap = {};
      headers.forEach((h, idx) => {
        const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        colMap[clean] = idx;
      });

      const parsedItems = [];
      for (let r = 1; r < records.length; r++) {
        const row = records[r];
        if (!row || row.length < 3) continue;

        const getField = (colIdx, headerAliases, fallback = '') => {
          if (colIdx !== undefined && row[colIdx] !== undefined && String(row[colIdx]).trim() !== '') {
            return String(row[colIdx]).trim();
          }
          if (Array.isArray(headerAliases)) {
            for (const h of headerAliases) {
              const idx = colMap[h.toLowerCase().replace(/[^a-z0-9]/g, '')];
              if (idx !== undefined && row[idx] !== undefined && String(row[idx]).trim() !== '') {
                return String(row[idx]).trim();
              }
            }
          }
          return fallback;
        };

        const parseNum = (val) => {
          if (!val) return 0;
          const clean = String(val).replace(/,/g, '').replace(/[^\d.-]/g, '');
          return parseFloat(clean) || 0;
        };

        // Col A (idx 0): Sr#
        const srRaw = getField(0, ['sr', 'sr#', 'sno', 'id'], String(parsedItems.length + 1));
        const sr = parseInt(srRaw) || (parsedItems.length + 1);

        // Col B (idx 1): Year
        const year = getField(1, ['year', 'yr'], '2027');

        // Col C (idx 2): Projects (Project Name)
        const projectName = getField(2, ['projects', 'project', 'projectname', 'initiative', 'item'], '');
        if (!projectName) continue;

        // Col D (idx 3): Cost (Budget_PKR) - Price is in raw PKR
        const costRaw = getField(3, ['budgetpkr', 'budget', 'cost', 'capex', 'capexpkr', 'sanctioned', 'approved'], '0');
        const budget = parseNum(costRaw);

        // Col E (idx 4): Consumed (Consumed_PKR)
        const consumed = parseNum(getField(4, ['consumedpkr', 'consumed', 'actual', 'spent'], '0'));

        // Col F (idx 5): Commitment (Commitment_PKR)
        const commitment = parseNum(getField(5, ['commitmentpkr', 'commitment', 'committed', 'comm'], '0'));

        // Col G (idx 6): Available (Available_PKR)
        let available = parseNum(getField(6, ['availablepkr', 'available', 'balance', 'remaining'], ''));
        if (available === 0 && budget > 0 && (consumed > 0 || commitment > 0)) {
          available = Math.max(0, budget - consumed - commitment);
        }

        // Col H (idx 7): WBS Elements
        const wbs = getField(7, ['wbselements', 'wbs', 'wbselement'], `FL-${year}-${String(parsedItems.length + 1).padStart(4, '0')}`);

        // Col I (idx 8): Responsible Unit
        const unit = getField(8, ['responsibleunit', 'unit', 'department', 'respunit'], '');

        // Col J (idx 9): Reason
        const reason = getField(9, ['reason'], '');

        // Col K (idx 10): Service life
        const serviceLife = getField(10, ['servicelife', 'service_life', 'life'], '');

        // Col L (idx 11): MOC required
        const rawMoc = getField(11, ['mocrequired', 'moc', 'moc_required'], '');
        let moc = '';
        if (rawMoc) {
          moc = (rawMoc.toLowerCase().includes('yes') || rawMoc.toLowerCase() === 'y' || rawMoc.toLowerCase().includes('req')) ? 'Yes' : (rawMoc.toLowerCase().includes('no') || rawMoc.toLowerCase() === 'n' ? 'No' : rawMoc);
        }

        // Col M (idx 12): Priority
        const priorityRaw = getField(12, ['priority', 'prio'], '');
        const priority = priorityRaw.trim();

        // Col N (idx 13): Replacement_New
        const rawType = getField(13, ['replacementnew', 'replacement_new', 'type', 'nature'], '').trim();
        let type = rawType;
        if (!type && projectName.toLowerCase().includes('new')) {
          type = 'New';
        }

        // Col O (idx 14): Category
        let category = getField(14, ['category', 'cat', 'classification'], '').trim();

        // Col P (idx 15): Quantity
        const quantity = getField(15, ['quantity', 'qty'], '');

        // Col Q (idx 16): Actions Assigned
        const strategy = getField(16, ['actionsassigned', 'actions_assigned', 'strategy', 'execution'], '');

        // Col R (idx 17): Status Open/Close
        const rawStatus = getField(17, ['statusopenclose', 'status', 'status_open_close'], '');
        const status = rawStatus ? (rawStatus.toLowerCase().includes('close') || rawStatus.toLowerCase().includes('comp') ? 'Close' : 'Open') : '';

        // Col S (idx 18): End User Remarks / Current status
        const remarks = getField(18, ['currentstatus', 'current_status', 'enduserremarkscurrentstatus', 'remarks', 'statusremarks'], '');

        // Col T (idx 19): Background
        const background = getField(19, ['background', 'bg', 'projectbackground', 'project_background'], '');

        // Col U (idx 20): Problem
        const problem = getField(20, ['problem', 'problemstatement', 'problem_statement', 'issue'], '');

        // Col V (idx 21): Justification
        const justification = getField(21, ['justification', 'projectjustification', 'project_justification'], '');

        parsedItems.push({
          sr,
          year: String(year).trim(),
          name: projectName,
          project: projectName,
          budget,
          budgetPKR: budget,
          consumed,
          commitment,
          available,
          wbs,
          unit,
          responsibleUnit: unit,
          reason,
          serviceLife,
          moc,
          mocRequired: moc,
          priority,
          type,
          replacementNew: type,
          category,
          quantity,
          strategy,
          status,
          remarks,
          currentStatus: remarks,
          assigned: unit,
          background,
          problem,
          justification
        });
      }

      return parsedItems;
    },

    async syncLiveFeed(options = {}) {
      const silent = options.silent || false;
      this.state.isSyncing = true;
      this.renderSyncState(true);

      try {
        let csvText = '';

        // Attempt 0: Custom user-provided Sheet URL if set
        if (this.state.customSheetUrl) {
          try {
            let customUrl = this.state.customSheetUrl.trim();
            if (customUrl.includes('/spreadsheets/d/') && !customUrl.includes('output=csv') && !customUrl.includes('gviz/tq')) {
              const m = customUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
              if (m) {
                customUrl = `https://docs.google.com/spreadsheets/d/${m[1]}/gviz/tq?tqx=out:csv&sheet=${CAPEX_SHEET_TAB}`;
              }
            }
            const res = await fetch(customUrl, { cache: 'no-store' });
            if (res.ok) {
              const t = await res.text();
              if (t && t.includes(',')) csvText = t;
            }
          } catch (e) {}
        }

        // Attempt 1: Server proxy route
        if (!csvText) {
          try {
            const resp = await fetch(`/api/sheets/fetch?sheetTab=${CAPEX_SHEET_TAB}&tileId=capex`, {
              cache: 'no-store',
              headers: { 'Cache-Control': 'no-cache, no-store' }
            });
            if (resp.ok) {
              const data = await resp.json();
              if (data && data.success && data.csvText) {
                csvText = data.csvText;
              }
            }
          } catch (e) {}
        }

        // Attempt 2: Direct Google Sheet fetch
        if (!csvText) {
          try {
            const directUrl = `${CAPEX_SHEET_URL}&_nocache=${Date.now()}`;
            const res = await fetch(directUrl, { cache: 'no-store' });
            if (res.ok) {
              const text = await res.text();
              if (text && !text.includes('<!DOCTYPE html>') && text.includes(',')) {
                csvText = text;
              }
            }
          } catch (e) {}
        }

        if (csvText) {
          const parsed = this.parseCsv(csvText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.state.sheetConnected = true;

            // Set purely the dynamic parsed rows from Google Sheet (no dummy merger)
            window.FPCL_CAPEX_DATA = parsed;
            try {
              localStorage.setItem('FPCL_CAPEX_DATA_CACHE', JSON.stringify(parsed));
            } catch (e) {}

            this.state.lastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (!silent && window.portalApp && typeof window.portalApp.showToast === 'function') {
              window.portalApp.showToast(`CAPEX feed synchronized live with Google Sheet (${parsed.length} projects).`, 'success');
            }
          }
        }
      } catch (err) {
        console.error('CAPEX live sync error:', err);
        if (!silent && window.portalApp && typeof window.portalApp.showToast === 'function') {
          window.portalApp.showToast('Could not sync live sheet: ' + (err.message || 'Network error'), 'error');
        }
      } finally {
        this.state.isSyncing = false;
        this.renderSyncState(false);
        this.render();
      }
    },

    renderSyncState(isSyncing) {
      const btn = document.getElementById('btn-capex-sync-feed');
      if (btn) {
        if (isSyncing) {
          btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Syncing...</span>`;
          btn.classList.add('opacity-75', 'cursor-wait');
        } else {
          btn.innerHTML = `<i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-[#D4AF37]"></i><span>Sync Feed</span>`;
          btn.classList.remove('opacity-75', 'cursor-wait');
        }
        if (window.lucide) window.lucide.createIcons();
      }
    },

    exportCsv() {
      const dataset = this.getSortedData();
      if (!dataset || dataset.length === 0) {
        if (window.portalApp) window.portalApp.showToast('No project data to export.', 'info');
        return;
      }

      const headers = ['Sr#', 'Year', 'Project Name', 'WBS Element', 'Responsible Unit', 'Category', 'Reason / Justification', 'Type', 'MOC Required', 'CAPEX Budget (PKR)', 'Consumed (PKR)', 'Commitment (PKR)', 'Available (PKR)', 'Priority', 'Status', 'Strategy Notes', 'Remarks', 'Background', 'Problem', 'Justification'];
      const rows = dataset.map(p => [
        p.sr,
        `"${p.year}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${p.wbs || ''}"`,
        `"${p.unit || ''}"`,
        `"${p.category || ''}"`,
        `"${(p.reason || '').replace(/"/g, '""')}"`,
        `"${p.type || ''}"`,
        `"${p.moc || ''}"`,
        p.budget,
        p.consumed || 0,
        p.commitment || 0,
        p.available || 0,
        `"${p.priority || ''}"`,
        `"${p.status || ''}"`,
        `"${(p.strategy || '').replace(/"/g, '""')}"`,
        `"${(p.remarks || '').replace(/"/g, '""')}"`,
        `"${(p.background || '').replace(/"/g, '""')}"`,
        `"${(p.problem || '').replace(/"/g, '""')}"`,
        `"${(p.justification || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `FPCL_CAPEX_Portfolio_${this.state.yearFilter || 'AllYears'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    setCategoryFilter(cat) {
      if (this.state.categoryFilter === cat) {
        this.state.categoryFilter = 'all';
      } else {
        this.state.categoryFilter = cat;
      }
      this.state.page = 1;
      this.render();
    },

    setClassFilter(cls, type) {
      if (this.state.classFilter === cls && (!type || this.state.typeFilter === type)) {
        this.state.classFilter = 'all';
        this.state.typeFilter = 'all';
      } else {
        this.state.classFilter = cls;
        if (type) this.state.typeFilter = type;
      }
      this.state.page = 1;
      this.render();
    },

    resetFilters() {
      this.state.searchQuery = '';
      this.state.yearFilter = 'all';
      this.state.statusFilter = 'all';
      this.state.categoryFilter = 'all';
      this.state.unitFilter = 'all';
      this.state.typeFilter = 'all';
      this.state.priorityFilter = 'all';
      this.state.classFilter = 'all';
      this.state.page = 1;
      this.render();
    },

    handleSort(col) {
      if (this.state.sortColumn === col) {
        this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.state.sortColumn = col;
        this.state.sortDirection = 'asc';
      }
      this.state.page = 1;
      this.render();
    },

    openDrawer(proj) {
      this.state.selectedProject = proj;
      this.renderDrawer();
    },

    openDrawerByIndex(idx) {
      const sorted = this.getSortedData();
      if (sorted && sorted[idx]) {
        this.openDrawer(sorted[idx]);
      }
    },

    closeDrawer() {
      this.state.selectedProject = null;
      const container = document.getElementById('capex-side-drawer-container');
      if (container) container.innerHTML = '';
    },

    renderDrawer() {
      const container = document.getElementById('capex-side-drawer-container');
      const p = this.state.selectedProject;
      if (!container || !p) return;

      const isMoc = (p.moc || '').toLowerCase() === 'yes';
      const isClosed = (p.status || '').toLowerCase().includes('close');
      const isMajor = (p.budget || 0) > 4500000;

      container.innerHTML = `
        <div class="fixed inset-0 z-50 overflow-hidden bg-[#0B1D3A]/60 backdrop-blur-xs transition-opacity duration-200 flex justify-end" onclick="window.FPCL_CAPEX_SUITE.closeDrawer()">
          <div class="relative w-full max-w-xl bg-white border-l border-[#E2E6EE] shadow-2xl h-full flex flex-col overflow-y-auto transform transition-transform duration-200" onclick="event.stopPropagation()">
            
            <!-- Drawer Header -->
            <div class="p-6 bg-[#0B1D3A] border-b-2 border-b-[#D4AF37] text-white relative">
              <button onclick="window.FPCL_CAPEX_SUITE.closeDrawer()" class="absolute top-5 right-5 text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer" title="Close Panel">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
              <div class="flex items-center gap-2 mb-2.5 flex-wrap">
                <span class="px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase bg-transparent text-[#D4AF37] border border-[#D4AF37]/50">
                  ${p.wbs}
                </span>
                <span class="px-2 py-0.5 rounded-sm text-[10px] font-bold ${p.priority === 'A' ? 'bg-[#C0392B]/20 text-[#FF8E85] border border-[#C0392B]/50' : p.priority === 'B' ? 'bg-[#2E5EAA]/25 text-[#91B8F5] border border-[#2E5EAA]/40' : 'bg-[#7A8699]/25 text-[#CBD2DE] border border-[#7A8699]/40'}">
                  Priority ${p.priority}
                </span>
                <span class="px-2 py-0.5 rounded-sm text-[10px] font-bold ${isClosed ? 'bg-[#1F9E7C]/20 text-[#7DE3C5] border border-[#1F9E7C]/40' : 'bg-[#E8B84B]/20 text-[#FCE19B] border border-[#E8B84B]/40'}">
                  ${isClosed ? 'Completed' : 'Open / In-Progress'}
                </span>
              </div>
              <h3 class="text-lg sm:text-xl font-bold text-white leading-snug tracking-tight">
                ${p.name}
              </h3>
              <p class="text-xs text-slate-300 mt-1.5 flex items-center gap-1.5">
                <i data-lucide="building" class="w-3.5 h-3.5 text-[#D4AF37]"></i>
                Responsible Unit: <strong class="text-white font-medium">${p.unit}</strong> • Year: <strong class="text-[#D4AF37]">${p.year}</strong>
              </p>
            </div>

            <!-- Drawer Body -->
            <div class="p-6 space-y-5 flex-1 text-[#1A1F2B] bg-[#F7F8FA]">

              <!-- Financial Metric Highlight Card -->
              <div class="p-4 rounded-md bg-white border border-[#E2E6EE] shadow-[0_1px_3px_rgba(11,29,58,0.04)] grid grid-cols-2 gap-4">
                <div>
                  <div class="text-[10px] uppercase font-bold text-[#7A8699] tracking-wider">CAPEX Sanctioned</div>
                  <div class="text-2xl font-bold font-mono text-[#0B1D3A] mt-0.5 tracking-tight">
                    PKR ${(p.budget / 1000000).toFixed(1)} M
                  </div>
                  <div class="text-[11px] font-mono text-[#7A8699] mt-0.5">
                    PKR ${(p.budget || 0).toLocaleString('en-US')}
                  </div>
                </div>
                <div>
                  <div class="text-[10px] uppercase font-bold text-[#7A8699] tracking-wider">Portfolio Classification</div>
                  <div class="mt-1 flex flex-wrap gap-1.5">
                    <span class="px-2 py-0.5 rounded-sm text-[11px] font-bold ${isMajor ? 'bg-[#2E5EAA]/10 text-[#2E5EAA] border border-[#2E5EAA]/30' : 'bg-[#7A8699]/10 text-[#7A8699] border border-[#7A8699]/30'}">
                      ${isMajor ? 'Major (>4.5M)' : 'Minor (≤4.5M)'}
                    </span>
                    <span class="px-2 py-0.5 rounded-sm text-[11px] font-bold ${p.type === 'Replacement' ? 'bg-[#2E5EAA]/10 text-[#2E5EAA] border border-[#2E5EAA]/30' : 'bg-[#D9782D]/10 text-[#D9782D] border border-[#D9782D]/30'}">
                      ${p.type}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Financial Allocations -->
              <div class="grid grid-cols-3 gap-3">
                <div class="p-3 rounded-md bg-white border border-[#E2E6EE]">
                  <div class="text-[10px] uppercase font-bold text-[#7A8699]">Consumed</div>
                  <div class="text-sm font-bold font-mono text-[#1E3A8A] mt-0.5">PKR ${(p.consumed || 0).toLocaleString('en-US')}</div>
                </div>
                <div class="p-3 rounded-md bg-white border border-[#E2E6EE]">
                  <div class="text-[10px] uppercase font-bold text-[#7A8699]">Commitment</div>
                  <div class="text-sm font-bold font-mono text-[#D9782D] mt-0.5">PKR ${(p.commitment || 0).toLocaleString('en-US')}</div>
                </div>
                <div class="p-3 rounded-md bg-white border border-[#E2E6EE]">
                  <div class="text-[10px] uppercase font-bold text-[#7A8699]">Available</div>
                  <div class="text-sm font-bold font-mono text-[#1F9E7C] mt-0.5">PKR ${(p.available || 0).toLocaleString('en-US')}</div>
                </div>
              </div>

              <!-- Scope & Technical Justification -->
              <div class="space-y-1.5">
                <h4 class="text-[11px] font-bold uppercase tracking-wider text-[#7A8699] flex items-center gap-1.5">
                  <i data-lucide="file-text" class="w-3.5 h-3.5 text-[#0B1D3A]"></i>
                  Technical Justification & Operational Reason
                </h4>
                <div class="p-3.5 rounded-md bg-white border border-[#E2E6EE] text-xs text-[#1A1F2B] leading-relaxed shadow-[0_1px_2px_rgba(11,29,58,0.03)] font-medium">
                  ${p.reason || 'Plant Reliability Sustenance & Operational Integrity'}
                </div>
              </div>

              ${p.background ? `
              <!-- Project Background (Column T) -->
              <div class="space-y-1.5">
                <h4 class="text-[11px] font-bold uppercase tracking-wider text-[#7A8699] flex items-center gap-1.5">
                  <i data-lucide="info" class="w-3.5 h-3.5 text-[#0B1D3A]"></i>
                  Background (Col T)
                </h4>
                <div class="p-3.5 rounded-md bg-white border border-[#E2E6EE] text-xs text-[#1A1F2B] leading-relaxed shadow-[0_1px_2px_rgba(11,29,58,0.03)] font-medium whitespace-pre-line">
                  ${p.background}
                </div>
              </div>
              ` : ''}

              ${p.problem ? `
              <!-- Problem Statement (Column U) -->
              <div class="space-y-1.5">
                <h4 class="text-[11px] font-bold uppercase tracking-wider text-[#7A8699] flex items-center gap-1.5">
                  <i data-lucide="alert-circle" class="w-3.5 h-3.5 text-[#0B1D3A]"></i>
                  Problem Statement (Col U)
                </h4>
                <div class="p-3.5 rounded-md bg-white border border-[#E2E6EE] text-xs text-[#1A1F2B] leading-relaxed shadow-[0_1px_2px_rgba(11,29,58,0.03)] font-medium whitespace-pre-line">
                  ${p.problem}
                </div>
              </div>
              ` : ''}

              ${p.justification ? `
              <!-- Project Justification (Column V) -->
              <div class="space-y-1.5">
                <h4 class="text-[11px] font-bold uppercase tracking-wider text-[#7A8699] flex items-center gap-1.5">
                  <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-[#0B1D3A]"></i>
                  Project Justification (Col V)
                </h4>
                <div class="p-3.5 rounded-md bg-white border border-[#E2E6EE] text-xs text-[#1A1F2B] leading-relaxed shadow-[0_1px_2px_rgba(11,29,58,0.03)] font-medium whitespace-pre-line">
                  ${p.justification}
                </div>
              </div>
              ` : ''}

              <!-- Strategy & Governance Notes -->
              <div class="space-y-1.5">
                <h4 class="text-[11px] font-bold uppercase tracking-wider text-[#7A8699] flex items-center gap-1.5">
                  <i data-lucide="compass" class="w-3.5 h-3.5 text-[#0B1D3A]"></i>
                  Execution Strategy & Milestones
                </h4>
                <div class="p-3.5 rounded-md bg-white border border-[#E2E6EE] text-xs text-[#1A1F2B] leading-relaxed shadow-[0_1px_2px_rgba(11,29,58,0.03)] font-medium">
                  ${p.strategy || 'To be executed per capital portfolio schedule and corporate governance oversight.'}
                </div>
              </div>

              <!-- Process Safety & MOC Status -->
              <div class="p-4 rounded-md border ${isMoc ? 'bg-[#C0392B]/5 border-[#C0392B]/30' : 'bg-white border-[#E2E6EE]'} flex items-start gap-3 shadow-[0_1px_2px_rgba(11,29,58,0.03)]">
                <div class="w-8 h-8 rounded-sm ${isMoc ? 'bg-[#C0392B] text-white' : 'bg-[#7A8699]/15 text-[#7A8699]'} flex items-center justify-center shrink-0">
                  <i data-lucide="${isMoc ? 'shield-alert' : 'shield'}" class="w-4 h-4"></i>
                </div>
                <div>
                  <div class="text-xs font-bold ${isMoc ? 'text-[#C0392B]' : 'text-[#1A1F2B]'}">
                    Management of Change (MOC): <strong>${isMoc ? 'Mandatory Statutory Compliance' : 'Not Required'}</strong>
                  </div>
                  <div class="text-[11px] text-[#7A8699] mt-0.5">
                    ${isMoc ? 'Requires Process Safety Management (PSM) sign-off, Process Hazard Analysis (PHA), and Pre-Startup Safety Review (PSSR).' : 'Standard routine asset maintenance without facility process envelope modification.'}
                  </div>
                </div>
              </div>

              <!-- Project Metadata Grid -->
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="p-3 rounded-md bg-white border border-[#E2E6EE] shadow-[0_1px_2px_rgba(11,29,58,0.03)]">
                  <span class="text-[#7A8699] block text-[10px] uppercase font-bold tracking-wider">Strategic Category</span>
                  <span class="font-bold text-[#1A1F2B] mt-1 block">${p.category}</span>
                </div>
                <div class="p-3 rounded-md bg-white border border-[#E2E6EE] shadow-[0_1px_2px_rgba(11,29,58,0.03)]">
                  <span class="text-[#7A8699] block text-[10px] uppercase font-bold tracking-wider">Expected Service Life</span>
                  <span class="font-bold text-[#1A1F2B] mt-1 block">${p.serviceLife || '5 Years'}</span>
                </div>
                <div class="p-3 rounded-md bg-white border border-[#E2E6EE] shadow-[0_1px_2px_rgba(11,29,58,0.03)]">
                  <span class="text-[#7A8699] block text-[10px] uppercase font-bold tracking-wider">Quantity / Scope</span>
                  <span class="font-bold text-[#1A1F2B] mt-1 block">${p.quantity || '1 Lot'}</span>
                </div>
                <div class="p-3 rounded-md bg-white border border-[#E2E6EE] shadow-[0_1px_2px_rgba(11,29,58,0.03)]">
                  <span class="text-[#7A8699] block text-[10px] uppercase font-bold tracking-wider">Responsible Lead</span>
                  <span class="font-bold text-[#1A1F2B] mt-1 block">${p.assigned || p.unit}</span>
                </div>
              </div>

              ${p.remarks ? `
              <div class="p-3 rounded-md bg-white border border-[#E2E6EE] text-xs text-[#1A1F2B] shadow-[0_1px_2px_rgba(11,29,58,0.03)]">
                <span class="text-[#7A8699] font-bold block text-[10px] uppercase tracking-wider mb-1">Status Remarks & End-User Notes</span>
                ${p.remarks}
              </div>
              ` : ''}

            </div>

            <!-- Drawer Footer -->
            <div class="p-4 bg-white border-t border-[#E2E6EE] flex items-center justify-between">
              <span class="text-[11px] font-mono text-[#7A8699]">Google Sheet: CAPEX Tab</span>
              <button onclick="window.FPCL_CAPEX_SUITE.closeDrawer()" class="px-5 py-2 bg-[#D4AF37] hover:bg-[#C59F2D] text-[#0B1D3A] text-xs font-bold rounded-md transition-colors cursor-pointer shadow-xs">
                Close Panel
              </button>
            </div>

          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    },

    render() {
      const container = document.getElementById('capex-specialized-container');
      if (!container) return;

      const s = this.state;
      const allProjects = this.getRawData();

      // Extract unique Years from Column B
      const rawYears = [...new Set(allProjects.map(p => String(p.year || '').trim()).filter(Boolean))].sort((a, b) => b.localeCompare(a));
      const years = rawYears.length > 0 ? rawYears : ['2027', '2026', '2025', '2024'];

      // Filtered data applies dynamically across Master Table and Visual Analytics
      const filteredData = this.getFilteredData();
      const kpis = this.getKPIs(filteredData);
      const sortedData = this.getSortedData(filteredData);

      // Unique Units and Categories dynamically from Google Sheet columns I and O
      const units = [...new Set(allProjects.map(p => (p.unit || '').trim()).filter(Boolean))].sort();
      const dynamicCategories = [...new Set(allProjects.map(p => (p.category || '').trim()).filter(Boolean))].sort();

      // Pagination
      const pageSize = s.pageSize === 'all' ? sortedData.length : Number(s.pageSize);
      const totalPages = Math.ceil(sortedData.length / (pageSize || 1)) || 1;
      const currentPage = Math.min(s.page, totalPages);
      const startIdx = (currentPage - 1) * pageSize;
      const paginatedData = s.pageSize === 'all' ? sortedData : sortedData.slice(startIdx, startIdx + pageSize);

      const hasActiveFilters = s.yearFilter !== 'all' || s.statusFilter !== 'all' || s.categoryFilter !== 'all' || s.unitFilter !== 'all' || s.typeFilter !== 'all' || s.priorityFilter !== 'all' || s.classFilter !== 'all' || (s.searchQuery && s.searchQuery.trim() !== '');

      const majorRepPct = parseFloat(kpis.majorRepPct) || 0;
      const majorNewPct = parseFloat(kpis.majorNewPct) || 0;
      const majorRepMillions = (kpis.majorReplacementBudget / 1000000).toFixed(1);
      const majorNewMillions = (kpis.majorNewBudget / 1000000).toFixed(1);

      const minorRepPct = parseFloat(kpis.minorRepPct) || 0;
      const minorNewPct = parseFloat(kpis.minorNewPct) || 0;
      const minorRepMillions = (kpis.minorReplacementBudget / 1000000).toFixed(1);
      const minorNewMillions = (kpis.minorNewBudget / 1000000).toFixed(1);

      container.innerHTML = `
        <div class="bg-[#F7F8FA] -m-2 sm:-m-4 md:-m-6 p-4 sm:p-6 md:p-8 text-[#1A1F2B] font-sans antialiased min-h-screen space-y-6">

          <!-- ========================================================================= -->
          <!-- 1. TOP BANNER: Main Heading & Dynamic Status                              -->
          <!-- ========================================================================= -->
          <div class="relative bg-gradient-to-r from-[#0B1D3A] via-[#122B55] to-[#1E3A8A] text-white rounded-xl border border-blue-900/50 p-5 sm:p-6 shadow-lg">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-center gap-3.5">
                <div class="w-12 h-12 rounded-xl bg-white/10 border border-[#D4AF37]/50 flex items-center justify-center shrink-0 text-[#D4AF37] shadow-inner">
                  <i data-lucide="circle-dollar-sign" class="w-7 h-7"></i>
                </div>
                <div>
                  <h1 class="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white m-0">
                    FPCL Plant CapEx Portfolio ${s.yearFilter !== 'all' ? `(${s.yearFilter})` : '(All Years)'}
                  </h1>
                </div>
              </div>

              <!-- Function Buttons -->
              <div class="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  id="btn-top-ppt-mode"
                  onclick="window.FPCL_CAPEX_SUITE.openPptMode()"
                  class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black bg-gradient-to-r from-[#B4923C] to-[#D4AF37] hover:from-[#9C7A2E] hover:to-[#B4923C] text-[#0B1220] transition-all cursor-pointer shadow-md active:scale-95"
                  title="Launch full-page Boardroom Slide Deck (PPT Mode)"
                >
                  <i data-lucide="presentation" class="w-3.5 h-3.5 text-[#0B1220]"></i>
                  <span>PPT Mode</span>
                </button>
                <button
                  onclick="window.FPCL_CAPEX_SUITE.state.currencyFormat = window.FPCL_CAPEX_SUITE.state.currencyFormat === 'M' ? 'full' : 'M'; window.FPCL_CAPEX_SUITE.render();"
                  class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/25 transition-all cursor-pointer shadow-xs"
                  title="Toggle Millions vs Full PKR (prices in Google Sheet are in raw PKR)"
                >
                  <i data-lucide="coins" class="w-3.5 h-3.5 text-[#D4AF37]"></i>
                  <span>${s.currencyFormat === 'M' ? 'View in Full PKR' : 'View in Millions (M)'}</span>
                </button>
                <button
                  onclick="portalApp.handleDropdownSelect('overview')"
                  class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/25 transition-all cursor-pointer shadow-xs"
                  title="Return to Executive Overview"
                >
                  <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
                  <span>Overview</span>
                </button>
                <button
                  id="btn-capex-sync-feed"
                  onclick="window.FPCL_CAPEX_SUITE.syncLiveFeed()"
                  class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-[#D4AF37]/50 transition-all cursor-pointer shadow-xs"
                  title="Fetch fresh data live from Google Sheet"
                >
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-[#D4AF37]"></i>
                  <span>Sync Feed</span>
                </button>
                <button
                  onclick="window.FPCL_CAPEX_SUITE.exportCsv()"
                  class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black bg-gradient-to-r from-[#D4AF37] to-[#E6C86E] hover:from-[#C59F2D] hover:to-[#D4AF37] text-[#0B1D3A] transition-all cursor-pointer shadow-md"
                  title="Export Filtered Projects to CSV"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>

          <!-- ========================================================================= -->
          <!-- 2. KPI VALUES: Dynamic Executive Boardroom Cards (Clean Titles & Gradients)-->
          <!-- ========================================================================= -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
            
            <!-- Card 1: Total Portfolio (Gold/Navy Gradient) -->
            <div class="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0B1D3A] border border-amber-500/35 rounded-xl p-3 sm:p-5 shadow-md text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-0.5">
              <span class="text-[10px] sm:text-[11px] uppercase font-extrabold tracking-wider text-slate-300">
                Total CapEx
              </span>
              <div class="mt-1.5 sm:mt-2 text-lg sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-amber-400">
                ${s.currencyFormat === 'M' ? `PKR ${kpis.totalBudgetMillions} M` : this.formatCurrency(kpis.totalBudget)}
              </div>
              <div class="text-[9px] sm:text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-full">
                PKR ${(kpis.totalBudget || 0).toLocaleString('en-US')}
              </div>
              <div class="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] font-semibold text-slate-300">
                ${kpis.totalProjects} Projects • Rep: ${kpis.replacementCount} | New: ${kpis.newCount}
              </div>
            </div>

            <!-- Card 2: Major CapEx (Royal Blue Gradient) -->
            <div class="bg-gradient-to-br from-[#0B1D3A] via-[#1E3A8A] to-[#172554] border border-blue-400/35 rounded-xl p-3 sm:p-5 shadow-md text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-0.5">
              <span class="text-[10px] sm:text-[11px] uppercase font-extrabold tracking-wider text-blue-200">
                Major CapEx
              </span>
              <div class="mt-1.5 sm:mt-2 text-lg sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-blue-300">
                ${s.currencyFormat === 'M' ? `PKR ${kpis.majorBudgetMillions} M` : this.formatCurrency(kpis.majorBudget)}
              </div>
              <div class="text-[9px] sm:text-[10px] text-blue-300/70 font-mono mt-0.5 truncate max-w-full">
                PKR ${(kpis.majorBudget || 0).toLocaleString('en-US')}
              </div>
              <div class="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] font-semibold text-blue-200">
                ${kpis.majorCount} Projects • Rep: ${kpis.majorReplacementCount} | New: ${kpis.majorNewCount}
              </div>
            </div>

            <!-- Card 3: Minor CapEx (Teal Gradient) -->
            <div class="bg-gradient-to-br from-[#0F2830] via-[#134E4A] to-[#042F2E] border border-teal-400/35 rounded-xl p-3 sm:p-5 shadow-md text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-0.5">
              <span class="text-[10px] sm:text-[11px] uppercase font-extrabold tracking-wider text-teal-200">
                Minor CapEx
              </span>
              <div class="mt-1.5 sm:mt-2 text-lg sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-teal-300">
                ${s.currencyFormat === 'M' ? `PKR ${kpis.minorBudgetMillions} M` : this.formatCurrency(kpis.minorBudget)}
              </div>
              <div class="text-[9px] sm:text-[10px] text-teal-300/70 font-mono mt-0.5 truncate max-w-full">
                PKR ${(kpis.minorBudget || 0).toLocaleString('en-US')}
              </div>
              <div class="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] font-semibold text-teal-200">
                ${kpis.minorCount} Projects • Rep: ${kpis.minorReplacementCount} | New: ${kpis.minorNewCount}
              </div>
            </div>

            <!-- Card 4: Replacements (Burnt Orange Gradient) -->
            <div class="bg-gradient-to-br from-[#1C1917] via-[#292524] to-[#431407] border border-orange-400/35 rounded-xl p-3 sm:p-5 shadow-md text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-0.5">
              <span class="text-[10px] sm:text-[11px] uppercase font-extrabold tracking-wider text-orange-200">
                Replacements
              </span>
              <div class="mt-1.5 sm:mt-2 text-lg sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-orange-400">
                ${s.currencyFormat === 'M' ? `PKR ${kpis.replacementBudgetMillions} M` : this.formatCurrency(kpis.replacementBudget)}
              </div>
              <div class="text-[9px] sm:text-[10px] text-orange-300/70 font-mono mt-0.5 truncate max-w-full">
                PKR ${(kpis.replacementBudget || 0).toLocaleString('en-US')}
              </div>
              <div class="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] font-semibold text-orange-200">
                ${kpis.replacementCount} Projects • Replacement
              </div>
            </div>

            <!-- Card 5: New Installations (Purple Gradient) -->
            <div class="bg-gradient-to-br from-[#2E1065] via-[#3B0764] to-[#1E1B4B] border border-purple-400/35 rounded-xl p-3 sm:p-5 shadow-md text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-0.5">
              <span class="text-[10px] sm:text-[11px] uppercase font-extrabold tracking-wider text-purple-200">
                New Projects
              </span>
              <div class="mt-1.5 sm:mt-2 text-lg sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-purple-300">
                ${s.currencyFormat === 'M' ? `PKR ${kpis.newBudgetMillions} M` : this.formatCurrency(kpis.newBudget)}
              </div>
              <div class="text-[9px] sm:text-[10px] text-purple-300/70 font-mono mt-0.5 truncate max-w-full">
                PKR ${(kpis.newBudget || 0).toLocaleString('en-US')}
              </div>
              <div class="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] font-semibold text-purple-200">
                ${kpis.newCount} Projects • New
              </div>
            </div>

            <!-- Card 6: MOC Required (Emerald Gradient) -->
            <div class="bg-gradient-to-br from-[#022C22] via-[#064E3B] to-[#042F2E] border border-emerald-400/35 rounded-xl p-3 sm:p-5 shadow-md text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-0.5">
              <span class="text-[10px] sm:text-[11px] uppercase font-extrabold tracking-wider text-emerald-200">
                MOC Required
              </span>
              <div class="mt-1.5 sm:mt-2 text-lg sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-emerald-400">
                ${kpis.mocCount} Projects
              </div>
              <div class="text-[9px] sm:text-[10px] text-emerald-300/70 font-mono mt-0.5 truncate max-w-full">
                Statutory Safety Compliance
              </div>
              <div class="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] font-semibold text-emerald-200">
                Rep: ${kpis.mocReplacementCount} | New: ${kpis.mocNewCount}
              </div>
            </div>

          </div>

          <!-- Financial Execution Highlights Sub-Bar: Styled identically with colorful boardroom gradients -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
            
            <!-- Card 7: Total Consumed (Navy/Blue Gradient) -->
            <div class="bg-gradient-to-br from-[#0B1D3A] via-[#1E3A8A] to-[#172554] border border-blue-400/35 rounded-xl p-3.5 sm:p-5 shadow-md text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-0.5">
              <span class="text-[10px] sm:text-[11px] uppercase font-extrabold tracking-wider text-blue-200">
                Total Consumed
              </span>
              <div class="mt-1.5 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-blue-300">
                ${s.currencyFormat === 'M' ? `PKR ${(kpis.totalConsumed / 1000000).toFixed(1)} M` : this.formatCurrency(kpis.totalConsumed)}
              </div>
              <div class="text-[9px] sm:text-[10px] text-blue-300/70 font-mono mt-0.5 truncate max-w-full">
                PKR ${(kpis.totalConsumed || 0).toLocaleString('en-US')}
              </div>
              <div class="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] font-semibold text-blue-200">
                ${kpis.totalBudget > 0 ? ((kpis.totalConsumed / kpis.totalBudget) * 100).toFixed(1) : '0.0'}% of Budget Consumed
              </div>
            </div>

            <!-- Card 8: Total Commitment (Bronze/Amber Gradient) -->
            <div class="bg-gradient-to-br from-[#1C1917] via-[#292524] to-[#431407] border border-orange-400/35 rounded-xl p-3.5 sm:p-5 shadow-md text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-0.5">
              <span class="text-[10px] sm:text-[11px] uppercase font-extrabold tracking-wider text-orange-200">
                Total Commitment
              </span>
              <div class="mt-1.5 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-orange-400">
                ${s.currencyFormat === 'M' ? (kpis.totalCommitment >= 1000000 ? `PKR ${(kpis.totalCommitment / 1000000).toFixed(1)} M` : `PKR ${(kpis.totalCommitment / 1000).toFixed(0)} K`) : this.formatCurrency(kpis.totalCommitment)}
              </div>
              <div class="text-[9px] sm:text-[10px] text-orange-300/70 font-mono mt-0.5 truncate max-w-full">
                PKR ${(kpis.totalCommitment || 0).toLocaleString('en-US')}
              </div>
              <div class="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] font-semibold text-orange-200">
                ${kpis.totalBudget > 0 ? ((kpis.totalCommitment / kpis.totalBudget) * 100).toFixed(1) : '0.0'}% of Budget Committed
              </div>
            </div>

            <!-- Card 9: Total Available (Emerald/Teal Gradient) -->
            <div class="bg-gradient-to-br from-[#022C22] via-[#064E3B] to-[#042F2E] border border-emerald-400/35 rounded-xl p-3.5 sm:p-5 shadow-md text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-0.5">
              <span class="text-[10px] sm:text-[11px] uppercase font-extrabold tracking-wider text-emerald-200">
                Total Available
              </span>
              <div class="mt-1.5 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-emerald-400">
                ${s.currencyFormat === 'M' ? (kpis.totalAvailable >= 1000000 ? `PKR ${(kpis.totalAvailable / 1000000).toFixed(1)} M` : `PKR ${(kpis.totalAvailable || 0).toLocaleString('en-US')}`) : this.formatCurrency(kpis.totalAvailable)}
              </div>
              <div class="text-[9px] sm:text-[10px] text-emerald-300/70 font-mono mt-0.5 truncate max-w-full">
                PKR ${(kpis.totalAvailable || 0).toLocaleString('en-US')}
              </div>
              <div class="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] font-semibold text-emerald-200">
                Uncommitted Capital Funds
              </div>
            </div>

          </div>

          <!-- ========================================================================= -->
          <!-- 3. FILTERS SECTION (Dynamic based on Google Sheet Columns)                -->
          <!-- ========================================================================= -->
          <div class="bg-white border border-[#E2E6EE] rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#0B1D3A]"></span>
                <h3 class="text-sm font-black uppercase tracking-wider text-[#0B1D3A]">
                  Portfolio Filters & Search
                </h3>
                <span class="text-xs text-[#7A8699]">
                  (Showing ${filteredData.length} of ${allProjects.length} Projects from Google Sheet)
                </span>
              </div>

              ${hasActiveFilters ? `
                <button
                  onclick="window.FPCL_CAPEX_SUITE.resetFilters()"
                  class="inline-flex items-center gap-1 text-xs text-[#C0392B] hover:text-[#962D22] font-bold cursor-pointer transition-colors"
                >
                  <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                  <span>Reset All Filters</span>
                </button>
              ` : ''}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
              
              <!-- Search Input -->
              <div class="relative">
                <i data-lucide="search" class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8699]"></i>
                <input
                  type="text"
                  placeholder="Search project name, WBS, unit..."
                  value="${s.searchQuery}"
                  oninput="window.FPCL_CAPEX_SUITE.state.searchQuery = this.value; window.FPCL_CAPEX_SUITE.state.page = 1; window.FPCL_CAPEX_SUITE.render();"
                  class="w-full pl-8 pr-7 py-2 rounded-lg text-xs bg-slate-50 border border-[#CBD2DE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1D3A]/20 text-[#1A1F2B] font-medium"
                />
                ${s.searchQuery ? `
                  <button onclick="window.FPCL_CAPEX_SUITE.state.searchQuery = ''; window.FPCL_CAPEX_SUITE.render();" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A8699] hover:text-[#1A1F2B]">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                  </button>
                ` : ''}
              </div>

              <!-- Filter 1: Year (Column B) -->
              <div>
                <select
                  onchange="window.FPCL_CAPEX_SUITE.state.yearFilter = this.value; window.FPCL_CAPEX_SUITE.state.page = 1; window.FPCL_CAPEX_SUITE.render();"
                  class="w-full py-2 px-3 rounded-lg text-xs bg-slate-50 border border-[#CBD2DE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1D3A]/20 text-[#1A1F2B] font-semibold"
                >
                  <option value="all" ${s.yearFilter === 'all' ? 'selected' : ''}>All Years (${allProjects.length})</option>
                  ${years.map(yr => {
                    const count = allProjects.filter(p => String(p.year || '').trim() === String(yr).trim()).length;
                    return `<option value="${yr}" ${s.yearFilter === yr ? 'selected' : ''}>Year ${yr} (${count})</option>`;
                  }).join('')}
                </select>
              </div>

              <!-- Filter 2: Open/Close Status (Column R) -->
              <div>
                <select
                  onchange="window.FPCL_CAPEX_SUITE.state.statusFilter = this.value; window.FPCL_CAPEX_SUITE.state.page = 1; window.FPCL_CAPEX_SUITE.render();"
                  class="w-full py-2 px-3 rounded-lg text-xs bg-slate-50 border border-[#CBD2DE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1D3A]/20 text-[#1A1F2B] font-semibold"
                >
                  <option value="all" ${s.statusFilter === 'all' ? 'selected' : ''}>All Statuses (Col R)</option>
                  <option value="open" ${s.statusFilter === 'open' ? 'selected' : ''}>Open / In-Progress</option>
                  <option value="close" ${s.statusFilter === 'close' ? 'selected' : ''}>Closed / Completed</option>
                </select>
              </div>

              <!-- Filter 3: Category (Column O) -->
              <div>
                <select
                  onchange="window.FPCL_CAPEX_SUITE.state.categoryFilter = this.value; window.FPCL_CAPEX_SUITE.state.page = 1; window.FPCL_CAPEX_SUITE.render();"
                  class="w-full py-2 px-3 rounded-lg text-xs bg-slate-50 border border-[#CBD2DE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1D3A]/20 text-[#1A1F2B] font-semibold"
                >
                  <option value="all" ${s.categoryFilter === 'all' ? 'selected' : ''}>All Categories (Col O)</option>
                  ${dynamicCategories.map(c => `<option value="${c}" ${s.categoryFilter === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>

              <!-- Filter 4: Unit (Column I) -->
              <div>
                <select
                  onchange="window.FPCL_CAPEX_SUITE.state.unitFilter = this.value; window.FPCL_CAPEX_SUITE.state.page = 1; window.FPCL_CAPEX_SUITE.render();"
                  class="w-full py-2 px-3 rounded-lg text-xs bg-slate-50 border border-[#CBD2DE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1D3A]/20 text-[#1A1F2B] font-semibold"
                >
                  <option value="all" ${s.unitFilter === 'all' ? 'selected' : ''}>All Units (Col I)</option>
                  ${units.map(u => `<option value="${u}" ${s.unitFilter === u ? 'selected' : ''}>${u}</option>`).join('')}
                </select>
              </div>

            </div>

            <!-- Active filter chips -->
            ${hasActiveFilters ? `
              <div class="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-slate-100">
                <span class="text-[#7A8699] font-bold">Active Filters:</span>
                ${s.yearFilter !== 'all' ? `<span class="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-bold">Year: ${s.yearFilter}</span>` : ''}
                ${s.statusFilter !== 'all' ? `<span class="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-bold">Status: ${s.statusFilter.toUpperCase()}</span>` : ''}
                ${s.categoryFilter !== 'all' ? `<span class="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-bold">Cat: ${s.categoryFilter}</span>` : ''}
                ${s.unitFilter !== 'all' ? `<span class="bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded font-bold">Unit: ${s.unitFilter}</span>` : ''}
                ${s.typeFilter !== 'all' ? `<span class="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded font-bold">Type: ${s.typeFilter}</span>` : ''}
                ${s.classFilter !== 'all' ? `<span class="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-bold">Class: ${s.classFilter.toUpperCase()}</span>` : ''}
                ${s.searchQuery ? `<span class="bg-slate-100 text-[#1A1F2B] border border-slate-300 px-2 py-0.5 rounded font-bold">"${s.searchQuery}"</span>` : ''}
              </div>
            ` : ''}
          </div>

          <!-- ========================================================================= -->
          <!-- 4. VISUAL ANALYTICS SECTION (DYNAMIC FROM GOOGLE SHEET DATA)              -->
          <!-- ========================================================================= -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            
            <!-- Visual 1: Category Breakdown Donut Chart & Legend -->
            <div class="bg-white border border-[#E2E6EE] rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div class="flex items-center justify-between pb-3 border-b border-[#E2E6EE]">
                <h3 class="text-base font-bold text-[#1A1F2B] flex items-center gap-2">
                  <i data-lucide="pie-chart" class="w-4 h-4 text-[#2E5EAA]"></i>
                  Category Breakdown
                </h3>
                ${s.categoryFilter !== 'all' ? `
                  <button onclick="window.FPCL_CAPEX_SUITE.setCategoryFilter('all')" class="text-xs text-[#0B1D3A] hover:underline font-bold bg-[#F7F8FA] border border-[#CBD2DE] px-2.5 py-1 rounded cursor-pointer">
                    Clear Filter
                  </button>
                ` : ''}
              </div>

              <!-- Donut SVG & Dynamic Legend -->
              <div class="py-5 flex flex-col sm:flex-row items-center justify-center gap-6">
                
                <!-- SVG Donut Chart (Responsive across mobile viewports without horizontal overflow) -->
                <div class="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 max-w-full shrink-0 flex items-center justify-center mx-auto">
                  ${this.renderDonutSvg(kpis)}
                  <!-- Center Info Overlay fitted inside enlarged donut hole -->
                  <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2 sm:p-4 select-none max-w-[190px] sm:max-w-[240px] mx-auto">
                    <span class="text-[10px] sm:text-xs uppercase font-extrabold text-[#7A8699] tracking-wider">Total CapEx</span>
                    <span class="text-xl sm:text-3xl md:text-4xl font-black font-mono text-[#0B1D3A] tracking-tight leading-none my-1">
                      PKR ${kpis.totalBudgetMillions}M
                    </span>
                    <span class="text-[11px] sm:text-xs font-bold text-[#7A8699] bg-slate-100/90 px-2 py-0.5 rounded-full border border-slate-200 mt-0.5">
                      ${kpis.totalProjects} Projects
                    </span>
                    <span class="text-[10px] sm:text-[11px] font-semibold text-[#2E5EAA] mt-1">
                      Rep: ${kpis.replacementCount} • New: ${kpis.newCount}
                    </span>
                  </div>
                </div>

                <!-- Interactive Category Legend List -->
                <div class="w-full sm:w-auto flex-1 space-y-2">
                  ${this.renderCategoryLegend(kpis)}
                </div>

              </div>
            </div>

            <!-- Visual 2: Class vs Type Stacked Bar Chart (Dynamic from Columns D & N) -->
            <div class="bg-white border border-[#E2E6EE] rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div class="flex items-center justify-between pb-3 border-b border-[#E2E6EE]">
                <h3 class="text-base font-bold text-[#1A1F2B] flex items-center gap-2">
                  <i data-lucide="bar-chart-3" class="w-4 h-4 text-[#0B1D3A]"></i>
                  Type Breakdown by Value & Class
                </h3>
                ${s.classFilter !== 'all' || s.typeFilter !== 'all' ? `
                  <button onclick="window.FPCL_CAPEX_SUITE.setClassFilter('all', 'all')" class="text-xs text-[#0B1D3A] hover:underline font-bold bg-[#F7F8FA] border border-[#CBD2DE] px-2.5 py-1 rounded cursor-pointer">
                    Reset Filter
                  </button>
                ` : ''}
              </div>

              <!-- Legend Bar -->
              <div class="flex items-center justify-center gap-6 pt-2 text-xs">
                <div class="flex items-center gap-2">
                  <span class="w-3.5 h-3.5 rounded-sm bg-[#1E3A8A]"></span>
                  <span class="font-bold text-[#1A1F2B]">Replacements</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-3.5 h-3.5 rounded-sm bg-[#D9782D]"></span>
                  <span class="font-bold text-[#1A1F2B]">New Installations</span>
                </div>
              </div>

              <!-- Stacked Horizontal Bars -->
              <div class="py-4 space-y-6">
                
                <!-- Row 1: Major CapEx -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <div class="flex items-center gap-1.5 font-bold text-[#1A1F2B]">
                      <span class="w-2.5 h-2.5 rounded-xs bg-[#1E3A8A]"></span>
                      <span class="text-sm">Major CapEx</span>
                      <span class="text-[#7A8699] font-normal">(${kpis.majorCount} Projects • >4.5M)</span>
                    </div>
                    <div class="font-mono font-bold text-[#0B1D3A] text-sm">
                      PKR ${kpis.majorBudgetMillions} M
                    </div>
                  </div>
                  
                  ${kpis.majorCount === 0 ? `
                    <div class="h-12 sm:h-14 w-full bg-slate-50 rounded-lg flex items-center justify-center text-xs text-slate-400 font-semibold italic border border-dashed border-slate-300">
                      No Major Projects (>4.5M) in selected filters
                    </div>
                  ` : `
                    <div class="h-12 sm:h-14 w-full bg-slate-100 rounded-lg overflow-hidden flex border border-[#CBD2DE] cursor-pointer shadow-inner">
                      ${majorRepPct > 0 ? `
                      <div
                        onclick="window.FPCL_CAPEX_SUITE.setClassFilter('major', 'Replacement')"
                        style="width: ${majorRepPct}%;"
                        class="h-full bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:opacity-95 transition-opacity flex items-center justify-between px-2 sm:px-3 text-white font-semibold min-w-0 overflow-hidden"
                        title="Major Replacements: PKR ${majorRepMillions} M (${majorRepPct}%)"
                      >
                        <span class="text-[11px] sm:text-xs truncate mr-1">Replacements</span>
                        <span class="font-mono text-[10px] sm:text-xs font-bold bg-black/30 px-1.5 sm:px-2 py-0.5 rounded shrink-0 whitespace-nowrap">${majorRepPct}%<span class="hidden sm:inline"> • PKR ${majorRepMillions}M</span></span>
                      </div>
                      ` : ''}
                      ${majorNewPct > 0 ? `
                      <div
                        onclick="window.FPCL_CAPEX_SUITE.setClassFilter('major', 'New')"
                        style="width: ${majorNewPct}%;"
                        class="h-full bg-gradient-to-r from-[#D9782D] to-[#F97316] hover:opacity-95 transition-opacity flex items-center justify-between px-2 sm:px-3 text-white font-semibold min-w-0 overflow-hidden"
                        title="Major New Installations: PKR ${majorNewMillions} M (${majorNewPct}%)"
                      >
                        <span class="text-[11px] sm:text-xs truncate mr-1">New</span>
                        <span class="font-mono text-[10px] sm:text-xs font-bold bg-black/30 px-1.5 sm:px-2 py-0.5 rounded shrink-0 whitespace-nowrap">${majorNewPct}%<span class="hidden sm:inline"> • PKR ${majorNewMillions}M</span></span>
                      </div>
                      ` : ''}
                    </div>
                  `}
                </div>

                <!-- Row 2: Minor CapEx -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <div class="flex items-center gap-1.5 font-bold text-[#1A1F2B]">
                      <span class="w-2.5 h-2.5 rounded-xs bg-[#7A8699]"></span>
                      <span class="text-sm">Minor CapEx</span>
                      <span class="text-[#7A8699] font-normal">(${kpis.minorCount} Projects • ≤4.5M)</span>
                    </div>
                    <div class="font-mono font-bold text-[#7A8699] text-sm">
                      PKR ${kpis.minorBudgetMillions} M
                    </div>
                  </div>
                  
                  ${kpis.minorCount === 0 ? `
                    <div class="h-12 sm:h-14 w-full bg-slate-50 rounded-lg flex items-center justify-center text-xs text-slate-400 font-semibold italic border border-dashed border-slate-300">
                      No Minor Projects (≤4.5M) in selected filters
                    </div>
                  ` : `
                    <div class="h-12 sm:h-14 w-full bg-slate-100 rounded-lg overflow-hidden flex border border-[#CBD2DE] cursor-pointer shadow-inner">
                      ${minorRepPct > 0 ? `
                      <div
                        onclick="window.FPCL_CAPEX_SUITE.setClassFilter('minor', 'Replacement')"
                        style="width: ${minorRepPct}%;"
                        class="h-full bg-gradient-to-r from-[#1E3A8A]/90 to-[#2563EB]/90 hover:opacity-95 transition-opacity flex items-center justify-between px-2 sm:px-3 text-white font-semibold min-w-0 overflow-hidden"
                        title="Minor Replacements: PKR ${minorRepMillions} M (${minorRepPct}%)"
                      >
                        <span class="text-[11px] sm:text-xs truncate mr-1">Replacements</span>
                        <span class="font-mono text-[10px] sm:text-xs font-bold bg-black/30 px-1.5 sm:px-2 py-0.5 rounded shrink-0 whitespace-nowrap">${minorRepPct}%<span class="hidden sm:inline"> • PKR ${minorRepMillions}M</span></span>
                      </div>
                      ` : ''}
                      ${minorNewPct > 0 ? `
                      <div
                        onclick="window.FPCL_CAPEX_SUITE.setClassFilter('minor', 'New')"
                        style="width: ${minorNewPct}%;"
                        class="h-full bg-gradient-to-r from-[#D9782D]/90 to-[#F97316]/90 hover:opacity-95 transition-opacity flex items-center justify-between px-2 sm:px-3 text-white font-semibold min-w-0 overflow-hidden"
                        title="Minor New Installations: PKR ${minorNewMillions} M (${minorNewPct}%)"
                      >
                        <span class="text-[11px] sm:text-xs truncate mr-1">New</span>
                        <span class="font-mono text-[10px] sm:text-xs font-bold bg-black/30 px-1.5 sm:px-2 py-0.5 rounded shrink-0 whitespace-nowrap">${minorNewPct}%<span class="hidden sm:inline"> • PKR ${minorNewMillions}M</span></span>
                      </div>
                      ` : ''}
                    </div>
                  `}
                </div>

              </div>
            </div>

          </div>

          <!-- ========================================================================= -->
          <!-- 5. PROJECT PORTFOLIO DETAIL MASTER TABLE (DYNAMIC GOOGLE SHEET ROWS)      -->
          <!-- ========================================================================= -->
          <div class="bg-white border border-[#E2E6EE] rounded-xl shadow-sm overflow-hidden">
            
            <!-- Table Header Bar with Top Horizontal Scroll Navigation -->
            <div class="p-4 sm:p-5 border-b border-[#E2E6EE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
              <div class="flex items-center gap-2.5 flex-wrap">
                <i data-lucide="table-2" class="w-5 h-5 text-[#0B1D3A]"></i>
                <h3 class="text-base font-bold text-[#1A1F2B]">
                  Project Portfolio Detail Master Table
                </h3>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0B1D3A]/5 text-[#0B1D3A] border border-[#0B1D3A]/15">
                  ${filteredData.length} Projects Live
                </span>
                <button
                  type="button"
                  id="btn-capex-ppt-mode"
                  onclick="window.FPCL_CAPEX_SUITE.openPptMode()"
                  class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold bg-gradient-to-r from-[#D4AF37] via-[#F59E0B] to-[#D97706] hover:brightness-110 text-[#0F172A] border border-[#CA8A04] shadow-md transition-all duration-150 cursor-pointer active:scale-95"
                  title="Launch Boardroom Fullscreen Slide Presentation (PPT Mode) for filtered projects"
                >
                  <i data-lucide="presentation" class="w-4 h-4 text-[#0F172A]"></i>
                  <span>PPT Mode</span>
                </button>
              </div>
              
              <div class="flex items-center gap-3">
                <!-- Top Horizontal Scroll Controls: Enables horizontal scroll without scrolling down -->
                <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-[#CBD2DE]">
                  <button
                    type="button"
                    onclick="window.FPCL_CAPEX_SUITE.scrollTableHorizontal(-320)"
                    class="px-2.5 py-1 rounded bg-white hover:bg-slate-200 text-[#0B1D3A] border border-slate-200 shadow-xs cursor-pointer flex items-center gap-1 text-xs font-bold transition-colors"
                    title="Scroll table left"
                  >
                    <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
                    <span>Scroll Left</span>
                  </button>
                  <button
                    type="button"
                    onclick="window.FPCL_CAPEX_SUITE.scrollTableHorizontal(320)"
                    class="px-2.5 py-1 rounded bg-white hover:bg-slate-200 text-[#0B1D3A] border border-slate-200 shadow-xs cursor-pointer flex items-center gap-1 text-xs font-bold transition-colors"
                    title="Scroll table right"
                  >
                    <span>Scroll Right</span>
                    <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                  </button>
                </div>

                <div class="flex items-center gap-1.5 text-xs text-[#7A8699]">
                  <span>Rows:</span>
                  <select
                    onchange="window.FPCL_CAPEX_SUITE.state.pageSize = this.value; window.FPCL_CAPEX_SUITE.state.page = 1; window.FPCL_CAPEX_SUITE.render();"
                    class="py-1 px-2 rounded border border-[#CBD2DE] bg-slate-50 text-xs font-semibold text-[#1A1F2B]"
                  >
                    <option value="15" ${s.pageSize === 15 ? 'selected' : ''}>15</option>
                    <option value="25" ${s.pageSize === 25 ? 'selected' : ''}>25</option>
                    <option value="50" ${s.pageSize === 50 ? 'selected' : ''}>50</option>
                    <option value="all" ${s.pageSize === 'all' ? 'selected' : ''}>All</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Top Synchronized Horizontal Scrollbar: Always visible at the top so users can scroll right without scrolling down -->
            <div
              id="capex-table-top-scroll"
              class="overflow-x-auto overflow-y-hidden border-b border-[#CBD2DE] bg-slate-100/90 py-1.5 px-1 select-none"
              title="Top Horizontal Scrollbar (drag to scroll columns horizontally)"
            >
              <div id="capex-table-top-scroll-inner" class="h-2.5" style="width: 3200px;"></div>
            </div>

            <!-- Scrollable Responsive Master Table -->
            <div id="capex-table-scroll-body" class="overflow-x-auto max-h-[620px] overflow-y-auto">
              <table id="capex-master-table" class="w-full text-left border-collapse text-xs min-w-[2800px]">
                <thead class="sticky top-0 z-20 bg-[#0B1D3A] text-white select-none">
                  <tr>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('sr')" class="py-3 px-3 cursor-pointer hover:bg-white/10 text-center w-14">
                      Sr# ${this.renderSortArrow('sr')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('year')" class="py-3 px-3 cursor-pointer hover:bg-white/10 text-center w-16">
                      Year ${this.renderSortArrow('year')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('name')" class="py-3 px-3 cursor-pointer hover:bg-white/10 min-w-[260px]">
                      Projects ${this.renderSortArrow('name')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('budget')" class="py-3 px-3 cursor-pointer hover:bg-white/10 text-right min-w-[140px]">
                      Budget (PKR) ${this.renderSortArrow('budget')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('consumed')" class="py-3 px-3 cursor-pointer hover:bg-white/10 text-right min-w-[140px]">
                      Consumed (PKR) ${this.renderSortArrow('consumed')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('commitment')" class="py-3 px-3 cursor-pointer hover:bg-white/10 text-right min-w-[140px]">
                      Commitment (PKR) ${this.renderSortArrow('commitment')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('available')" class="py-3 px-3 cursor-pointer hover:bg-white/10 text-right min-w-[140px]">
                      Available (PKR) ${this.renderSortArrow('available')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('wbs')" class="py-3 px-3 cursor-pointer hover:bg-white/10 min-w-[160px]">
                      WBS Elements ${this.renderSortArrow('wbs')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('unit')" class="py-3 px-3 cursor-pointer hover:bg-white/10 min-w-[130px]">
                      Responsible Unit ${this.renderSortArrow('unit')}
                    </th>
                    <th class="py-3 px-3 min-w-[220px]">
                      Reason
                    </th>
                    <th class="py-3 px-3 text-center min-w-[110px]">
                      Service Life
                    </th>
                    <th class="py-3 px-3 text-center min-w-[110px]">
                      MOC Required
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('priority')" class="py-3 px-3 cursor-pointer hover:bg-white/10 text-center min-w-[90px]">
                      Priority ${this.renderSortArrow('priority')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('type')" class="py-3 px-3 cursor-pointer hover:bg-white/10 min-w-[140px]">
                      Replacement / New ${this.renderSortArrow('type')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('category')" class="py-3 px-3 cursor-pointer hover:bg-white/10 min-w-[160px]">
                      Category ${this.renderSortArrow('category')}
                    </th>
                    <th class="py-3 px-3 text-center min-w-[90px]">
                      Quantity
                    </th>
                    <th class="py-3 px-3 min-w-[200px]">
                      Actions Assigned
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('status')" class="py-3 px-3 cursor-pointer hover:bg-white/10 text-center min-w-[110px]">
                      Status ${this.renderSortArrow('status')}
                    </th>
                    <th class="py-3 px-3 min-w-[220px]">
                      End User Remarks
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('background')" class="py-3 px-3 cursor-pointer hover:bg-white/10 min-w-[240px]">
                      Background ${this.renderSortArrow('background')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('problem')" class="py-3 px-3 cursor-pointer hover:bg-white/10 min-w-[240px]">
                      Problem ${this.renderSortArrow('problem')}
                    </th>
                    <th onclick="window.FPCL_CAPEX_SUITE.handleSort('justification')" class="py-3 px-3 cursor-pointer hover:bg-white/10 min-w-[240px]">
                      Justification ${this.renderSortArrow('justification')}
                    </th>
                    <th class="py-3 px-3 text-center sticky right-0 bg-[#0B1D3A] z-30 w-16">
                      View
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E2E6EE] bg-white">
                  ${paginatedData.length === 0 ? `
                    <tr>
                      <td colspan="23" class="py-12 text-center text-[#7A8699]">
                        <i data-lucide="folder-search" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
                        <div class="font-bold text-sm text-[#0B1D3A]">No Projects Match Current Filters</div>
                        <div class="text-xs mt-1">Try resetting active filters or clearing the search query.</div>
                      </td>
                    </tr>
                  ` : paginatedData.map((p, idx) => {
                    const isClosed = (p.status || '').toLowerCase().includes('close');
                    const isMoc = (p.moc || '').toLowerCase() === 'yes';
                    const isMajor = (p.budget || 0) > 4500000;
                    const rowNum = startIdx + idx + 1;

                    return `
                      <tr
                        onclick="window.FPCL_CAPEX_SUITE.openDrawerByIndex(${startIdx + idx})"
                        class="hover:bg-amber-50/40 even:bg-slate-50/60 transition-colors cursor-pointer group"
                      >
                        <!-- 1. # -->
                        <td class="py-3 px-3 text-center font-mono text-[#7A8699] font-bold">
                          ${p.sr || rowNum}
                        </td>

                        <!-- 2. Year -->
                        <td class="py-3 px-3 text-center font-mono">
                          <span class="px-2 py-0.5 rounded font-bold text-xs bg-slate-100 text-[#0B1D3A] border border-slate-200">
                            ${p.year || '2027'}
                          </span>
                        </td>

                        <!-- 3. Projects -->
                        <td class="py-3 px-3">
                          <div class="font-bold text-[#1A1F2B] group-hover:text-[#0B1D3A] transition-colors leading-snug">
                            ${p.name}
                          </div>
                          ${isMajor ? '<div class="text-[10px] text-[#2E5EAA] font-bold mt-0.5">• Major CapEx (>4.5M)</div>' : '<div class="text-[10px] text-teal-700 font-bold mt-0.5">• Minor CapEx (≤4.5M)</div>'}
                        </td>

                        <!-- 4. Budget (PKR) -->
                        <td class="py-3 px-3 text-right font-mono whitespace-nowrap">
                          <div class="font-bold text-[#0B1D3A]">${this.formatCurrency(p.budget)}</div>
                          <div class="text-[10px] text-slate-400 font-mono">PKR ${(p.budget || 0).toLocaleString('en-US')}</div>
                        </td>

                        <!-- 5. Consumed (PKR) -->
                        <td class="py-3 px-3 text-right font-mono whitespace-nowrap">
                          <div class="text-[#1E3A8A] font-semibold">${this.formatCurrency(p.consumed || 0)}</div>
                          <div class="text-[10px] text-slate-400 font-mono">PKR ${(p.consumed || 0).toLocaleString('en-US')}</div>
                        </td>

                        <!-- 6. Commitment (PKR) -->
                        <td class="py-3 px-3 text-right font-mono whitespace-nowrap">
                          <div class="text-[#D9782D] font-semibold">${this.formatCurrency(p.commitment || 0)}</div>
                          <div class="text-[10px] text-slate-400 font-mono">PKR ${(p.commitment || 0).toLocaleString('en-US')}</div>
                        </td>

                        <!-- 7. Available (PKR) -->
                        <td class="py-3 px-3 text-right font-mono whitespace-nowrap">
                          <div class="text-[#1F9E7C] font-semibold">${this.formatCurrency(p.available || 0)}</div>
                          <div class="text-[10px] text-slate-400 font-mono">PKR ${(p.available || 0).toLocaleString('en-US')}</div>
                        </td>

                        <!-- 8. WBS Elements -->
                        <td class="py-3 px-3 whitespace-nowrap font-mono text-xs">
                          <code class="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-mono text-[11px]">
                            ${p.wbs || '-'}
                          </code>
                        </td>

                        <!-- 9. Responsible Unit -->
                        <td class="py-3 px-3 whitespace-nowrap">
                          <span class="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-[#1A1F2B] border border-[#CBD2DE]">
                            ${p.unit}
                          </span>
                        </td>

                        <!-- 10. Reason -->
                        <td class="py-3 px-3 text-[11px] text-slate-600 max-w-xs truncate" title="${p.reason || '-'}">
                          ${p.reason || '-'}
                        </td>

                        <!-- 11. Service life -->
                        <td class="py-3 px-3 text-center whitespace-nowrap text-[11px] font-mono text-slate-600">
                          ${p.serviceLife || '-'}
                        </td>

                        <!-- 12. MOC required -->
                        <td class="py-3 px-3 text-center whitespace-nowrap">
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${isMoc ? 'bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/30' : 'bg-slate-100 text-[#7A8699] border border-[#CBD2DE]'}">
                            ${p.moc}
                          </span>
                        </td>

                        <!-- 13. Priority -->
                        <td class="py-3 px-3 text-center whitespace-nowrap">
                          <span class="inline-flex items-center justify-center w-5 h-5 rounded-xs text-[10px] font-bold ${p.priority === 'A' ? 'bg-[#C0392B] text-white' : p.priority === 'B' ? 'bg-[#2E5EAA] text-white' : 'bg-[#7A8699] text-white'}">
                            ${p.priority}
                          </span>
                        </td>

                        <!-- 14. Replacement_New -->
                        <td class="py-3 px-3 whitespace-nowrap">
                          <span class="inline-block px-2 py-0.5 rounded text-[11px] font-bold ${p.type === 'Replacement' ? 'bg-[#2E5EAA]/10 text-[#2E5EAA] border border-[#2E5EAA]/25' : 'bg-[#D9782D]/10 text-[#D9782D] border border-[#D9782D]/25'}">
                            ${p.type}
                          </span>
                        </td>

                        <!-- 15. Category -->
                        <td class="py-3 px-3 whitespace-nowrap">
                          ${this.renderCategoryBadge(p.category)}
                        </td>

                        <!-- 16. Quantity -->
                        <td class="py-3 px-3 whitespace-nowrap text-[11px] font-mono text-slate-600">
                          ${p.quantity || '1 Lot'}
                        </td>

                        <!-- 17. Actions Assigned -->
                        <td class="py-3 px-3 text-[11px] text-slate-600 max-w-xs truncate" title="${p.strategy || '-'}">
                          ${p.strategy || '-'}
                        </td>

                        <!-- 18. Status Open/Close -->
                        <td class="py-3 px-3 text-center whitespace-nowrap">
                          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${isClosed ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-amber-50 text-amber-800 border border-amber-300'}">
                            <span class="w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                            ${isClosed ? 'Close' : 'Open'}
                          </span>
                        </td>

                        <!-- 19. End User Remarks / Current status -->
                        <td class="py-3 px-3 text-[11px] text-slate-600 max-w-xs truncate" title="${p.remarks || '-'}">
                          ${p.remarks || '-'}
                        </td>

                        <!-- 20. Background (Column T) -->
                        <td class="py-3 px-3 text-[11px] text-slate-600 max-w-xs truncate" title="${p.background || '-'}">
                          ${p.background ? `<span class="text-slate-800">${p.background}</span>` : '<span class="text-slate-400 font-mono">-</span>'}
                        </td>

                        <!-- 21. Problem (Column U) -->
                        <td class="py-3 px-3 text-[11px] text-slate-600 max-w-xs truncate" title="${p.problem || '-'}">
                          ${p.problem ? `<span class="text-slate-800">${p.problem}</span>` : '<span class="text-slate-400 font-mono">-</span>'}
                        </td>

                        <!-- 22. Justification (Column V) -->
                        <td class="py-3 px-3 text-[11px] text-slate-600 max-w-xs truncate" title="${p.justification || '-'}">
                          ${p.justification ? `<span class="text-slate-800">${p.justification}</span>` : '<span class="text-slate-400 font-mono">-</span>'}
                        </td>

                        <!-- 23. Scope Action Button (Sticky Right) -->
                        <td class="py-3 px-3 text-center whitespace-nowrap sticky right-0 bg-white group-hover:bg-amber-50/40 z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                          <div class="flex items-center justify-center gap-1">
                            <button onclick="event.stopPropagation(); window.FPCL_CAPEX_SUITE.openPptMode(${startIdx + idx})" class="p-1.5 rounded text-[#B4923C] hover:text-[#7A5E1E] hover:bg-amber-50 transition-colors cursor-pointer" title="View slide in PPT Mode">
                              <i data-lucide="presentation" class="w-4 h-4"></i>
                            </button>
                            <button onclick="event.stopPropagation(); window.FPCL_CAPEX_SUITE.openDrawerByIndex(${startIdx + idx})" class="p-1.5 rounded text-[#7A8699] hover:text-[#0B1D3A] hover:bg-slate-100 transition-colors cursor-pointer" title="View Full Project Scope">
                              <i data-lucide="eye" class="w-4 h-4"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
                <!-- Summary Table Footer -->
                <tfoot class="bg-slate-100/90 font-bold border-t-2 border-[#CBD2DE] text-[#0B1D3A]">
                  <tr>
                    <td colspan="3" class="py-3 px-3 text-right uppercase tracking-wider text-[11px] text-[#7A8699]">
                      Total (${filteredData.length} Projects):
                    </td>
                    <td class="py-3 px-3 text-right font-mono font-black text-[#0B1D3A] whitespace-nowrap">
                      <div>${this.formatCurrency(kpis.totalBudget)}</div>
                      <div class="text-[10px] text-slate-500 font-mono font-normal">PKR ${kpis.totalBudget.toLocaleString('en-US')}</div>
                    </td>
                    <td class="py-3 px-3 text-right font-mono font-bold text-[#1E3A8A] whitespace-nowrap">
                      <div>${this.formatCurrency(kpis.totalConsumed)}</div>
                      <div class="text-[10px] text-slate-500 font-mono font-normal">PKR ${kpis.totalConsumed.toLocaleString('en-US')}</div>
                    </td>
                    <td class="py-3 px-3 text-right font-mono font-bold text-[#D9782D] whitespace-nowrap">
                      <div>${this.formatCurrency(kpis.totalCommitment)}</div>
                      <div class="text-[10px] text-slate-500 font-mono font-normal">PKR ${kpis.totalCommitment.toLocaleString('en-US')}</div>
                    </td>
                    <td class="py-3 px-3 text-right font-mono font-bold text-[#1F9E7C] whitespace-nowrap">
                      <div>${this.formatCurrency(kpis.totalAvailable)}</div>
                      <div class="text-[10px] text-slate-500 font-mono font-normal">PKR ${kpis.totalAvailable.toLocaleString('en-US')}</div>
                    </td>
                    <td colspan="16"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Pagination & Summary Bar -->
            <div class="p-3.5 border-t border-[#E2E6EE] bg-[#F7F8FA] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7A8699]">
              <div class="flex items-center gap-2">
                <span>Showing ${paginatedData.length ? startIdx + 1 : 0}–${Math.min(startIdx + paginatedData.length, filteredData.length)} of ${filteredData.length} projects</span>
                <span>•</span>
                <span>Filtered Total: <strong class="text-[#0B1D3A] font-mono">PKR ${kpis.totalBudgetMillions} M</strong></span>
              </div>

              ${totalPages > 1 ? `
                <div class="flex items-center gap-2">
                  <button
                    ${currentPage === 1 ? 'disabled' : ''}
                    onclick="window.FPCL_CAPEX_SUITE.state.page = Math.max(1, window.FPCL_CAPEX_SUITE.state.page - 1); window.FPCL_CAPEX_SUITE.render();"
                    class="px-2.5 py-1 rounded border border-[#CBD2DE] bg-white text-[#1A1F2B] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                  >
                    Prev
                  </button>
                  <span class="font-bold text-[#1A1F2B]">Page ${currentPage} of ${totalPages}</span>
                  <button
                    ${currentPage === totalPages ? 'disabled' : ''}
                    onclick="window.FPCL_CAPEX_SUITE.state.page = Math.min(${totalPages}, window.FPCL_CAPEX_SUITE.state.page + 1); window.FPCL_CAPEX_SUITE.render();"
                    class="px-2.5 py-1 rounded border border-[#CBD2DE] bg-white text-[#1A1F2B] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              ` : ''}
            </div>

          </div>

        </div>

        <!-- Slide-Over Drawer Container -->
        <div id="capex-side-drawer-container"></div>

        <!-- Google Sheet Link Modal -->
        <div id="capex-sheet-modal-container"></div>
      `;

      if (window.lucide) window.lucide.createIcons();

      // Initialize top horizontal scrollbar sync
      this.initScrollSync();
    },

    scrollTableHorizontal(amount) {
      const bodyScroll = document.getElementById('capex-table-scroll-body');
      const topScroll = document.getElementById('capex-table-top-scroll');
      if (bodyScroll) {
        bodyScroll.scrollBy({ left: amount, behavior: 'smooth' });
      }
      if (topScroll) {
        topScroll.scrollBy({ left: amount, behavior: 'smooth' });
      }
    },

    initScrollSync() {
      const topScroll = document.getElementById('capex-table-top-scroll');
      const bodyScroll = document.getElementById('capex-table-scroll-body');
      const inner = document.getElementById('capex-table-top-scroll-inner');
      const table = document.getElementById('capex-master-table');

      if (!topScroll || !bodyScroll) return;

      const updateWidth = () => {
        if (table && inner) {
          inner.style.width = `${table.scrollWidth}px`;
        }
      };

      updateWidth();
      setTimeout(updateWidth, 50);
      setTimeout(updateWidth, 200);

      let isSyncingTop = false;
      let isSyncingBody = false;

      topScroll.onscroll = () => {
        if (!isSyncingTop) {
          isSyncingBody = true;
          bodyScroll.scrollLeft = topScroll.scrollLeft;
        }
        isSyncingTop = false;
      };

      bodyScroll.onscroll = () => {
        if (!isSyncingBody) {
          isSyncingTop = true;
          topScroll.scrollLeft = bodyScroll.scrollLeft;
        }
        isSyncingBody = false;
      };
    },

    renderSortArrow(col) {
      if (this.state.sortColumn !== col) return '';
      return this.state.sortDirection === 'asc' ? '↑' : '↓';
    },

    renderCategoryBadge(cat) {
      if (!cat) return '<span class="text-[#7A8699]">-</span>';
      const c = String(cat).trim();
      const colorMap = {
        'IT': 'bg-purple-50 text-purple-700 border-purple-200',
        'HSEQ': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Equipment': 'bg-blue-50 text-blue-700 border-blue-200',
        'Reliability & Sustenance': 'bg-[#2E5EAA]/10 text-[#2E5EAA] border-[#2E5EAA]/25',
        'Efficiency': 'bg-[#D9782D]/10 text-[#D9782D] border-[#D9782D]/25',
        'HSE': 'bg-[#1F9E7C]/10 text-[#1F9E7C] border-[#1F9E7C]/25',
        'Others/Admin': 'bg-[#7A8699]/10 text-[#7A8699] border-[#7A8699]/25'
      };
      if (colorMap[c]) {
        return `<span class="inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${colorMap[c]}">${c}</span>`;
      }
      return `<span class="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">${c}</span>`;
    },

    getCategoryColor(catName, index = 0) {
      const palette = {
        'IT': '#8B5CF6',
        'HSEQ': '#10B981',
        'Equipment': '#2563EB',
        'Reliability & Sustenance': '#2E5EAA',
        'Others/Admin': '#7A8699',
        'Efficiency': '#D9782D',
        'HSE': '#1F9E7C'
      };
      if (palette[catName]) return palette[catName];
      const extras = ['#D4AF37', '#0284C7', '#E11D48', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#14B8A6'];
      return extras[index % extras.length];
    },

    renderDonutSvg(kpis) {
      const catTotals = {};
      const raw = this.getUniqueProjects(this.getFilteredData());
      raw.forEach(p => {
        const cat = (p.category || 'Uncategorized').trim() || 'Uncategorized';
        catTotals[cat] = (catTotals[cat] || 0) + (Number(p.budget) || 0);
      });

      const total = Object.values(catTotals).reduce((a, b) => a + b, 0) || 1;
      const sortedCats = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a]);

      if (sortedCats.length === 0) {
        return `
          <svg viewBox="0 0 380 380" class="w-full h-full">
            <circle cx="190" cy="190" r="138" fill="transparent" stroke="#E2E8F0" stroke-width="34" />
            <text x="190" y="195" text-anchor="middle" fill="#94A3B8" font-size="13">No Categories</text>
          </svg>
        `;
      }

      const slices = sortedCats.map((catName, idx) => ({
        name: catName,
        pct: (catTotals[catName] || 0) / total,
        color: this.getCategoryColor(catName, idx)
      }));

      const cx = 190;
      const cy = 190;
      const r = 138;
      const strokeWidth = 34;
      const circumference = 2 * Math.PI * r;

      let accumulatedAngle = 0;
      const paths = slices.map((slice) => {
        if (slice.pct <= 0) return '';
        const strokeDasharray = `${slice.pct * circumference} ${circumference}`;
        const strokeDashoffset = -accumulatedAngle * circumference;
        accumulatedAngle += slice.pct;

        const isSelected = this.state.categoryFilter === slice.name;

        return `
          <circle
            cx="${cx}"
            cy="${cy}"
            r="${r}"
            fill="transparent"
            stroke="${slice.color}"
            stroke-width="${strokeWidth}"
            stroke-dasharray="${strokeDasharray}"
            stroke-dashoffset="${strokeDashoffset}"
            class="transition-all duration-200 cursor-pointer ${isSelected ? 'stroke-[40px] opacity-100' : 'hover:opacity-85'}"
            onclick="window.FPCL_CAPEX_SUITE.setCategoryFilter('${slice.name.replace(/'/g, "\\'")}')"
          >
            <title>${slice.name}: ${(slice.pct * 100).toFixed(1)}%</title>
          </circle>
        `;
      });

      return `
        <svg viewBox="0 0 380 380" class="w-full h-full transform -rotate-90">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="transparent" stroke="#EEF1F5" stroke-width="${strokeWidth}" />
          ${paths.join('')}
        </svg>
      `;
    },

    renderCategoryLegend(kpis) {
      const catTotals = {};
      const raw = this.getUniqueProjects(this.getFilteredData());
      raw.forEach(p => {
        const cat = (p.category || 'Uncategorized').trim() || 'Uncategorized';
        catTotals[cat] = (catTotals[cat] || 0) + (Number(p.budget) || 0);
      });

      const total = Object.values(catTotals).reduce((a, b) => a + b, 0) || 1;
      const sortedCats = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a]);

      if (sortedCats.length === 0) {
        return '<div class="text-xs text-[#7A8699] italic p-3 text-center">No categories found in filtered projects.</div>';
      }

      const items = sortedCats.map((catName, idx) => {
        const val = catTotals[catName] || 0;
        const pct = ((val / total) * 100).toFixed(1) + '%';
        const color = this.getCategoryColor(catName, idx);

        return {
          name: catName,
          pct,
          val: `PKR ${(val / 1000000).toFixed(1)} M`,
          exact: `PKR ${val.toLocaleString('en-US')}`,
          color
        };
      });

      return items.map(item => {
        const isSelected = this.state.categoryFilter === item.name;

        return `
          <div
            onclick="window.FPCL_CAPEX_SUITE.setCategoryFilter('${item.name.replace(/'/g, "\\'")}')"
            class="flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${isSelected ? 'bg-white border-[#D4AF37] ring-1 ring-[#D4AF37] shadow-sm' : 'bg-[#F7F8FA] border-[#E2E6EE] hover:border-[#CBD2DE]'}"
          >
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${item.color};"></span>
              <div>
                <span class="text-xs font-bold text-[#1A1F2B]">${item.name}</span>
                <span class="text-[10px] text-[#7A8699] block font-mono">${item.exact}</span>
              </div>
            </div>
            <div class="text-right">
              <span class="font-mono font-bold text-xs text-[#0B1D3A]">${item.val}</span>
              <span class="text-[10px] font-semibold text-[#7A8699] block">(${item.pct})</span>
            </div>
          </div>
        `;
      }).join('');
    },

    openSheetModal() {
      const modal = document.getElementById('capex-sheet-modal-container');
      if (!modal) return;

      modal.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1D3A]/60 backdrop-blur-xs p-4" onclick="window.FPCL_CAPEX_SUITE.closeSheetModal()">
          <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#CBD2DE]" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between border-b border-[#E2E6EE] pb-3">
              <div class="flex items-center gap-2">
                <i data-lucide="sheet" class="w-5 h-5 text-[#2E5EAA]"></i>
                <h3 class="text-base font-bold text-[#0B1D3A]">Google Sheet Connection (CAPEX)</h3>
              </div>
              <button onclick="window.FPCL_CAPEX_SUITE.closeSheetModal()" class="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
            
            <div class="space-y-3 text-xs text-[#1A1F2B]">
              <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
                <div class="font-bold text-[#0B1D3A]">Target Google Sheet:</div>
                <div class="font-mono text-[11px] text-blue-900 break-all">${CAPEX_SHEET_ID}</div>
                <div class="font-semibold text-blue-800 mt-1">Target Tab: <code class="bg-white px-1 py-0.5 rounded border border-blue-300 font-bold">${CAPEX_SHEET_TAB}</code></div>
              </div>

              <div>
                <label class="block font-bold mb-1 text-[#0B1D3A]">Custom Google Sheet Published CSV URL (Optional Override):</label>
                <input
                  id="input-capex-custom-url"
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                  value="${this.state.customSheetUrl || ''}"
                  class="w-full p-2.5 border border-[#CBD2DE] rounded-lg text-xs font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1D3A]/20"
                />
                <p class="text-[11px] text-slate-500 mt-1">Leave empty to use the default target Google Sheet via backend proxy.</p>
              </div>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-[#E2E6EE]">
              <button
                onclick="window.FPCL_CAPEX_SUITE.clearCustomSheetUrl()"
                class="px-3 py-1.5 text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                Reset to Default
              </button>
              <div class="flex gap-2">
                <button
                  onclick="window.FPCL_CAPEX_SUITE.closeSheetModal()"
                  class="px-4 py-2 border border-[#CBD2DE] text-[#1A1F2B] font-bold rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  onclick="window.FPCL_CAPEX_SUITE.saveCustomSheetUrl()"
                  class="px-4 py-2 bg-[#0B1D3A] text-white font-bold rounded-lg hover:bg-[#122B55] cursor-pointer text-xs shadow-xs"
                >
                  Save & Sync
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    },

    closeSheetModal() {
      const modal = document.getElementById('capex-sheet-modal-container');
      if (modal) modal.innerHTML = '';
    },

    saveCustomSheetUrl() {
      const input = document.getElementById('input-capex-custom-url');
      if (input) {
        const val = input.value.trim();
        this.state.customSheetUrl = val;
        try {
          if (val) localStorage.setItem('FPCL_CAPEX_CUSTOM_URL', val);
          else localStorage.removeItem('FPCL_CAPEX_CUSTOM_URL');
        } catch (e) {}
      }
      this.closeSheetModal();
      this.syncLiveFeed();
    },

    clearCustomSheetUrl() {
      this.state.customSheetUrl = '';
      try {
        localStorage.removeItem('FPCL_CAPEX_CUSTOM_URL');
      } catch (e) {}
      this.closeSheetModal();
      this.syncLiveFeed();
    },

    openPptMode(index = 0) {
      const dataset = this.getSortedData();
      if (!dataset || dataset.length === 0) {
        if (window.portalApp && typeof window.portalApp.showToast === 'function') {
          window.portalApp.showToast('No projects found matching current filter.', 'info');
        } else {
          alert('No projects found matching current filter.');
        }
        return;
      }

      this.state.pptActive = true;
      this.state.pptIndex = Math.max(0, Math.min(Number(index) || 0, dataset.length - 1));

      // 1. Move or ensure modal container is directly attached to document.body for true edge-to-edge full screen
      let container = document.getElementById('capex-ppt-modal-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'capex-ppt-modal-container';
        document.body.appendChild(container);
      } else if (container.parentElement !== document.body) {
        document.body.appendChild(container);
      }

      // 2. Temporarily reset any html zoom (e.g. zoom: 75% on wall displays) so modal is 100% full screen
      if (!this._zoomOverridden) {
        this._prevHtmlZoom = document.documentElement.style.zoom;
        this._prevBodyOverflow = document.body.style.overflow;
        document.documentElement.style.zoom = '1';
        document.body.style.overflow = 'hidden';
        this._zoomOverridden = true;
      }

      // 3. Request native browser fullscreen on container or documentElement
      try {
        const elem = document.documentElement;
        if (!document.fullscreenElement && elem && elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {});
        }
      } catch (err) {}

      this.initPptKeyboard();
      this.renderPptSlide();
    },

    closePptMode() {
      this.state.pptActive = false;
      this.destroyPptKeyboard();

      // 1. Restore zoom and overflow
      if (this._zoomOverridden) {
        document.documentElement.style.zoom = this._prevHtmlZoom || '';
        document.body.style.overflow = this._prevBodyOverflow || '';
        this._zoomOverridden = false;
      }

      // 2. Exit fullscreen if active
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch (err) {}

      const container = document.getElementById('capex-ppt-modal-container');
      if (container) {
        container.innerHTML = '';
      }
    },

    toggleFullscreen() {
      try {
        if (!document.fullscreenElement) {
          const elem = document.documentElement;
          if (elem && elem.requestFullscreen) {
            elem.requestFullscreen().catch(() => {});
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        }
      } catch (err) {}
    },

    navigatePpt(dir) {
      const dataset = this.getSortedData();
      if (!dataset || dataset.length === 0) return;
      this.state.pptIndex = (this.state.pptIndex + dir + dataset.length) % dataset.length;
      this.renderPptSlide();
    },

    setPptTheme(name) {
      this.state.pptTheme = name;
      const container = document.getElementById('capex-ppt-modal-container');
      if (container) {
        container.setAttribute('data-theme', name);
      }
      const swatches = document.querySelectorAll('.ppt-swatch');
      swatches.forEach(s => {
        if (s.dataset.theme === name) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
    },

    initPptKeyboard() {
      if (this._pptKeyHandler) return;
      this._pptKeyHandler = (e) => {
        if (!this.state.pptActive) return;
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
          e.preventDefault();
          this.navigatePpt(1);
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          this.navigatePpt(-1);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.closePptMode();
        } else if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          this.toggleFullscreen();
        }
      };
      window.addEventListener('keydown', this._pptKeyHandler);

      this._pptFsHandler = () => {
        const fsBtn = document.getElementById('ppt-fs-icon');
        if (fsBtn) {
          if (document.fullscreenElement) {
            fsBtn.setAttribute('data-lucide', 'minimize');
          } else {
            fsBtn.setAttribute('data-lucide', 'maximize');
          }
          if (window.lucide) window.lucide.createIcons();
        }
      };
      document.addEventListener('fullscreenchange', this._pptFsHandler);
    },

    destroyPptKeyboard() {
      if (this._pptKeyHandler) {
        window.removeEventListener('keydown', this._pptKeyHandler);
        this._pptKeyHandler = null;
      }
      if (this._pptFsHandler) {
        document.removeEventListener('fullscreenchange', this._pptFsHandler);
        this._pptFsHandler = null;
      }
    },

    renderPptSlide() {
      const container = document.getElementById('capex-ppt-modal-container');
      if (!container || !this.state.pptActive) return;

      const dataset = this.getSortedData();
      const total = dataset.length;
      if (total === 0) {
        this.closePptMode();
        return;
      }

      const idx = Math.max(0, Math.min(this.state.pptIndex, total - 1));
      const p = dataset[idx];
      const theme = this.state.pptTheme || 'navy';
      container.setAttribute('data-theme', theme);

      // Raw PKR budget display & millions breakdown
      const rawBudget = Number(p.budget);
      const budgetVal = (p.budget !== undefined && p.budget !== null && p.budget !== '' && !isNaN(rawBudget))
        ? ('PKR ' + rawBudget.toLocaleString('en-US'))
        : (p.budget ? String(p.budget) : '');

      const budgetMillions = (rawBudget && rawBudget >= 1000000)
        ? `PKR ${(rawBudget / 1000000).toFixed(1)} M`
        : '';

      const isFs = Boolean(document.fullscreenElement);

      const s = this.state;
      const hasActiveFilters = s.yearFilter !== 'all' || s.statusFilter !== 'all' || s.categoryFilter !== 'all' || s.unitFilter !== 'all' || s.typeFilter !== 'all' || s.priorityFilter !== 'all' || s.classFilter !== 'all' || (s.searchQuery && s.searchQuery.trim() !== '');

      const filterSummary = [];
      if (s.yearFilter !== 'all') filterSummary.push(`Year: ${s.yearFilter}`);
      if (s.statusFilter !== 'all') filterSummary.push(`Status: ${s.statusFilter}`);
      if (s.categoryFilter !== 'all') filterSummary.push(`Cat: ${s.categoryFilter}`);
      if (s.unitFilter !== 'all') filterSummary.push(`Unit: ${s.unitFilter}`);
      if (s.typeFilter !== 'all') filterSummary.push(`Type: ${s.typeFilter}`);
      if (s.priorityFilter !== 'all') filterSummary.push(`Priority: ${s.priorityFilter}`);
      if (s.searchQuery) filterSummary.push(`"${s.searchQuery}"`);

      container.innerHTML = `
        <div class="ppt-modal-backdrop" onclick="if(event.target === this) window.FPCL_CAPEX_SUITE.closePptMode()">
          
          <!-- Floating Side Arrows (Desktop) -->
          <button
            type="button"
            class="ppt-side-arrow left hidden md:flex"
            onclick="window.FPCL_CAPEX_SUITE.navigatePpt(-1)"
            title="Previous Slide (← Left Arrow)"
          >
            <i data-lucide="chevron-left" class="w-6 h-6"></i>
          </button>
          
          <button
            type="button"
            class="ppt-side-arrow right hidden md:flex"
            onclick="window.FPCL_CAPEX_SUITE.navigatePpt(1)"
            title="Next Slide (→ Right Arrow)"
          >
            <i data-lucide="chevron-right" class="w-6 h-6"></i>
          </button>

          <!-- Full Screen Slide Frame -->
          <div class="ppt-frame" id="ppt-slide-frame" onclick="event.stopPropagation()">
            
            <!-- Hero Header with Fullscreen & Theme Controls -->
            <div class="ppt-hero">
              <div class="ppt-themebar">
                <span class="ppt-theme-label">Theme</span>
                <button class="ppt-swatch white ${theme === 'white' ? 'active' : ''}" data-theme="white" title="Marketing Banner (White)" onclick="window.FPCL_CAPEX_SUITE.setPptTheme('white')"></button>
                <button class="ppt-swatch navy ${theme === 'navy' ? 'active' : ''}" data-theme="navy" title="Executive Navy" onclick="window.FPCL_CAPEX_SUITE.setPptTheme('navy')"></button>
                <button class="ppt-swatch graphite ${theme === 'graphite' ? 'active' : ''}" data-theme="graphite" title="Graphite Dark" onclick="window.FPCL_CAPEX_SUITE.setPptTheme('graphite')"></button>
                <button class="ppt-swatch emerald ${theme === 'emerald' ? 'active' : ''}" data-theme="emerald" title="Deep Emerald" onclick="window.FPCL_CAPEX_SUITE.setPptTheme('emerald')"></button>
                
                <button
                  type="button"
                  class="ppt-top-btn"
                  onclick="window.FPCL_CAPEX_SUITE.toggleFullscreen()"
                  title="Toggle Fullscreen (F)"
                >
                  <i id="ppt-fs-icon" data-lucide="${isFs ? 'minimize' : 'maximize'}" class="w-3.5 h-3.5"></i>
                  <span class="hidden sm:inline">Fullscreen</span>
                </button>

                <button
                  type="button"
                  class="ppt-top-btn exit"
                  onclick="window.FPCL_CAPEX_SUITE.closePptMode()"
                  title="Exit Presentation (Esc)"
                >
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                  <span>Exit</span>
                </button>
              </div>

              <!-- Eyebrows / Meta Chips -->
              <div class="ppt-eyebrow-row">
                <span class="ppt-tag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  CAPEX Board Proposal
                </span>
                ${p.wbs ? `<span class="ppt-id-chip">${escapeHtml(p.wbs)}</span>` : `<span class="ppt-id-chip">ID: CPX-${escapeHtml(p.year || '2026')}-${String(p.sr || (idx + 1)).padStart(3, '0')}</span>`}
                ${hasActiveFilters ? `<span class="ppt-filter-chip"><i data-lucide="filter" class="w-3 h-3"></i> Filter: ${escapeHtml(filterSummary.join(', '))}</span>` : ''}
              </div>

              <!-- Main Project Title -->
              <h1 class="ppt-title ppt-fade">${escapeHtml(p.name || p.project || '')}</h1>

              <!-- Sub-bar: Year, Responsible Unit, Category -->
              <div class="ppt-hero-meta">
                <div class="ppt-meta-pill">
                  <i data-lucide="calendar" class="w-3.5 h-3.5 text-amber-400"></i>
                  <div>
                    <span class="m-label">Year:</span>
                    <span class="m-value">${escapeHtml(p.year || '')}</span>
                  </div>
                </div>

                <div class="ppt-meta-pill">
                  <i data-lucide="building-2" class="w-3.5 h-3.5 text-blue-400"></i>
                  <div>
                    <span class="m-label">Responsible Unit:</span>
                    <span class="m-value">${escapeHtml(p.unit || p.responsibleUnit || '')}</span>
                  </div>
                </div>

                <div class="ppt-meta-pill">
                  <i data-lucide="tag" class="w-3.5 h-3.5 text-emerald-400"></i>
                  <div>
                    <span class="m-label">Category:</span>
                    <span class="m-value">${escapeHtml(p.category || '')}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Stats Bar (Priority, Budget_PKR, Replacement_New, MOC_required, service life) -->
            <div class="ppt-stats">
              <div class="ppt-stat priority">
                <div class="k">
                  <i data-lucide="flame" class="w-4.5 h-4.5 text-[#DC2626]"></i>
                  <span>Priority</span>
                </div>
                <div class="v">${escapeHtml(p.priority ? (p.priority.toLowerCase().startsWith('prio') ? p.priority : 'Priority ' + p.priority) : '')}</div>
              </div>

              <div class="ppt-stat budget wide">
                <div class="k">
                  <i data-lucide="coins" class="w-4.5 h-4.5 text-[#059669]"></i>
                  <span>Requested Budget (PKR)</span>
                  ${budgetMillions ? `<span class="font-mono font-bold text-xs sm:text-[13px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full ml-1">${escapeHtml(budgetMillions)}</span>` : ''}
                </div>
                <div class="v">${escapeHtml(budgetVal)}</div>
              </div>

              <div class="ppt-stat type">
                <div class="k">
                  <i data-lucide="layers" class="w-4.5 h-4.5 text-[#2563EB]"></i>
                  <span>Replacement / New</span>
                </div>
                <div class="v">${escapeHtml(p.type || p.replacementNew || '')}</div>
              </div>

              <div class="ppt-stat moc">
                <div class="k">
                  <i data-lucide="shield-check" class="w-4.5 h-4.5 text-[#D97706]"></i>
                  <span>MOC Required</span>
                </div>
                <div class="v">${escapeHtml(p.moc || p.mocRequired || '')}</div>
              </div>

              <div class="ppt-stat life">
                <div class="k">
                  <i data-lucide="clock" class="w-4.5 h-4.5 text-[#0D9488]"></i>
                  <span>Service Life</span>
                </div>
                <div class="v">${escapeHtml(p.serviceLife || '')}</div>
              </div>
            </div>

            <!-- 5 Content Tiles in 2 Columns: Scrollable on Overflow -->
            <div class="ppt-body-grid">
              
              <!-- Column 1: Background, Problem, Reason -->
              <div class="ppt-col">
                <!-- Tile 1: Background -->
                <div class="ppt-card card-background">
                  <div class="ppt-card-head">
                    <h3><i data-lucide="book-open" class="w-4 h-4 text-white"></i>Background</h3>
                  </div>
                  <div class="ppt-card-body">
                    <p>${escapeHtml(p.background || '')}</p>
                  </div>
                </div>

                <!-- Tile 2: Problem -->
                <div class="ppt-card card-problem">
                  <div class="ppt-card-head">
                    <h3><i data-lucide="alert-triangle" class="w-4 h-4 text-white"></i>Problem</h3>
                  </div>
                  <div class="ppt-card-body">
                    <p>${escapeHtml(p.problem || '')}</p>
                  </div>
                </div>

                <!-- Tile 3: Reason -->
                <div class="ppt-card card-reason">
                  <div class="ppt-card-head">
                    <h3><i data-lucide="target" class="w-4 h-4 text-white"></i>Reason</h3>
                  </div>
                  <div class="ppt-card-body">
                    <p>${escapeHtml(p.reason || '')}</p>
                  </div>
                </div>
              </div>

              <!-- Column 2: Justification, Current status -->
              <div class="ppt-col">
                <!-- Tile 4: Justification -->
                <div class="ppt-card card-justification">
                  <div class="ppt-card-head">
                    <h3><i data-lucide="trending-up" class="w-4 h-4 text-white"></i>Justification</h3>
                  </div>
                  <div class="ppt-card-body">
                    <p>${escapeHtml(p.justification || '')}</p>
                  </div>
                </div>

                <!-- Tile 5: Current status -->
                <div class="ppt-card card-status">
                  <div class="ppt-card-head">
                    <h3><i data-lucide="activity" class="w-4 h-4 text-white"></i>Current status</h3>
                    ${p.status ? `<span class="ppt-badge ${String(p.status).toLowerCase().includes('close') ? 'closed' : 'open'}">${escapeHtml(p.status)}</span>` : ''}
                  </div>
                  <div class="ppt-card-body">
                    <p>${escapeHtml(p.currentStatus || p.remarks || '')}</p>
                  </div>
                </div>
              </div>

            </div>

            <!-- Footer Navigation Bar -->
            <div class="ppt-footer">
              <div class="flex items-center gap-3">
                <span class="ppt-counter">Project ${idx + 1} of ${total}</span>
                <span class="text-[11px] opacity-75 font-mono hidden sm:inline text-slate-500">
                  ${hasActiveFilters ? `(Filtered from ${this.getRawData().length} total)` : `(Full Portfolio)`}
                </span>
              </div>

              <div class="ppt-nav-btns">
                <button
                  type="button"
                  class="ppt-btn"
                  onclick="window.FPCL_CAPEX_SUITE.navigatePpt(-1)"
                  title="Previous Project (← Left Arrow)"
                >
                  <i data-lucide="chevron-left" class="w-4 h-4"></i>
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  class="ppt-btn primary"
                  onclick="window.FPCL_CAPEX_SUITE.navigatePpt(1)"
                  title="Next Project (→ Right Arrow / Space)"
                >
                  <span>Next Project</span>
                  <i data-lucide="chevron-right" class="w-4 h-4"></i>
                </button>
                <button
                  type="button"
                  class="ppt-btn close"
                  onclick="window.FPCL_CAPEX_SUITE.closePptMode()"
                  title="Exit Presentation (Esc)"
                >
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                  <span>Exit</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    }
  };

  // Auto-initialize when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => capexSuite.init());
  } else {
    capexSuite.init();
  }

})();
