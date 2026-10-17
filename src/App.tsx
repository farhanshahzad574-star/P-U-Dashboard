import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Flame,
  Shield,
  Layers,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Factory,
  Cpu,
  Activity,
  Award,
  Globe2,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | '60hz' | '50hz'>('all');

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F7FF] via-white to-[#F8FAFC] text-slate-800 font-sans selection:bg-orange-500/20 selection:text-orange-900">
      {/* Top Accent Gradient Border */}
      <div className="h-1.5 bg-gradient-to-r from-[#0066B3] via-[#004B87] via-[#EA580C] to-[#F97316] w-full shrink-0 sticky top-0 z-50" />

      {/* STICKY NAVIGATION BAR */}
      <header className="sticky top-1.5 z-40 bg-white/95 backdrop-blur-md border-b-2 border-blue-100 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center gap-3.5 cursor-pointer select-none" onClick={() => scrollToSection('hero')}>
            {/* FPCL Logo Emblem */}
            <div className="relative w-11 h-11 rounded-xl bg-white border border-blue-200 flex items-center justify-center shadow-sm overflow-hidden p-1">
              <svg viewBox="0 0 135 48" className="w-full h-auto px-0.5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="17" height="23" rx="2" fill="#F97316"/>
                <polygon points="11,3 6,13 10,13 5,23 14,11 10,11" fill="#0F172A"/>
                <path d="M 23 2 H 38 V 7 H 28 V 11 H 36 V 16 H 28 V 25 H 23 Z" fill="#0066B3"/>
                <path d="M 41 2 H 54 C 59 2 62 5 62 10 C 62 15 59 18 54 18 H 46 V 25 H 41 Z M 46 7 V 13 H 53 C 55 13 56 12 56 10 C 56 8 55 7 53 7 Z" fill="#0066B3"/>
                <path d="M 77 8 L 72 10 C 71 8 69 7 67 7 C 63 7 61 10 61 13.5 C 61 17 63 20 67 20 C 69 20 71 19 72 17 L 77 19 C 75 23 71 26 66 26 C 59 26 55 20.5 55 13.5 C 55 6.5 60 1 67 1 C 71 1 75 4 77 8 Z" fill="#0066B3"/>
                <path d="M 80 2 H 86 V 20 H 104 V 25 H 80 Z" fill="#0066B3"/>
                <polygon points="93,2 100,2 86,25 79,25" fill="#F97316"/>
                <polygon points="86,25 106,25 102,18 84,18" fill="#EA580C"/>
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#0066B3] leading-none">
                  FPCL
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-orange-50 text-[#EA580C] border border-orange-200 font-bold">
                  118 MW
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mt-0.5">
                FFBL Power Company Limited
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs xl:text-sm font-bold text-slate-600">
            <button
              onClick={() => scrollToSection('overview')}
              className="hover:text-[#EA580C] transition-colors cursor-pointer"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection('dual-frequency')}
              className="hover:text-[#0066B3] transition-colors cursor-pointer"
            >
              Dual Frequency
            </button>
            <button
              onClick={() => scrollToSection('cfb-technology')}
              className="hover:text-[#EA580C] transition-colors cursor-pointer"
            >
              CFB Technology
            </button>
            <button
              onClick={() => scrollToSection('specs')}
              className="hover:text-[#0066B3] transition-colors cursor-pointer"
            >
              Technical Specs
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="hover:text-[#EA580C] transition-colors cursor-pointer"
            >
              Contact
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => scrollToSection('specs')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#0066B3] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer"
            >
              Technical Datasheet
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#EA580C] to-[#F97316] hover:from-[#C2410C] hover:to-[#EA580C] shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
            >
              Plant Contact
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-blue-50 text-slate-700 hover:text-[#0066B3] border border-blue-200"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-b-2 border-blue-100 px-4 pt-3 pb-6 space-y-3"
            >
              <button
                onClick={() => scrollToSection('overview')}
                className="w-full text-left py-2 px-3 text-sm font-bold text-slate-700 hover:text-[#EA580C] rounded-lg hover:bg-orange-50"
              >
                Overview &amp; History
              </button>
              <button
                onClick={() => scrollToSection('dual-frequency')}
                className="w-full text-left py-2 px-3 text-sm font-bold text-slate-700 hover:text-[#0066B3] rounded-lg hover:bg-blue-50"
              >
                Dual Frequency (50Hz / 60Hz)
              </button>
              <button
                onClick={() => scrollToSection('cfb-technology')}
                className="w-full text-left py-2 px-3 text-sm font-bold text-slate-700 hover:text-[#EA580C] rounded-lg hover:bg-orange-50"
              >
                CFB Technology &amp; Boilers
              </button>
              <button
                onClick={() => scrollToSection('specs')}
                className="w-full text-left py-2 px-3 text-sm font-bold text-slate-700 hover:text-[#0066B3] rounded-lg hover:bg-blue-50"
              >
                Technical Specifications
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="w-full text-left py-2 px-3 text-sm font-bold text-slate-700 hover:text-[#EA580C] rounded-lg hover:bg-orange-50"
              >
                Contact &amp; Addresses
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="space-y-16 sm:space-y-24">
        {/* ========================================================================= */}
        {/* SECTION 1: HERO (Fpcl4.jpeg - Twilight Aerial Actual Plant Photo)         */}
        {/* ========================================================================= */}
        <section id="hero" className="relative pt-6 sm:pt-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden min-h-[500px] sm:min-h-[580px] lg:min-h-[640px] flex items-center justify-center p-6 sm:p-12 lg:p-16 border-2 border-blue-200 shadow-2xl">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img
                src="./assets/Fpcl4.jpeg"
                alt="FPCL 118 MW Power Plant Actual Aerial View"
                className="w-full h-full object-cover object-center filter brightness-65 contrast-110"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('/assets/')) {
                    target.src = '/assets/Fpcl4.jpeg';
                  }
                }}
              />
              {/* Brand Blue & Orange Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#001D3D] via-[#003566]/85 to-[#002244]/60" />
              <div className="absolute inset-0 bg-radial from-transparent via-[#001D3D]/40 to-[#001D3D]/90" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
              {/* Superheader Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/25 border border-orange-400/50 text-orange-200 text-xs sm:text-sm font-bold mb-6 shadow-lg backdrop-blur-md"
              >
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span>Excellence in Power generation • Port Qasim, Karachi</span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight drop-shadow-md"
              >
                Pioneering Non-EPC Power Generation in Pakistan
              </motion.h1>

              {/* Sub-headline */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-5 text-base sm:text-lg lg:text-xl text-blue-100 max-w-2xl leading-relaxed font-normal"
              >
                State-of-the-art 118 MW coal-fired power plant delivering dual-frequency reliability to K-Electric and Fauji Fertilizer Bin Qasim.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
              >
                <button
                  onClick={() => scrollToSection('specs')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FB923C] hover:from-[#C2410C] hover:to-[#EA580C] text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-orange-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Explore Technical Specs</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollToSection('contact')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-blue-50 text-[#0066B3] hover:text-[#004B87] font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-blue-950/20 cursor-pointer active:scale-95 border-2 border-white/90"
                >
                  Contact Us
                </button>
              </motion.div>

              {/* Metrics Strip */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-12 w-full grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl"
              >
                <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-3.5 text-center shadow-md">
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">118 MW</div>
                  <div className="text-[11px] text-blue-200 font-semibold mt-0.5">Installed Gross Capacity</div>
                </div>
                <div className="bg-white/10 border border-orange-400/30 backdrop-blur-md rounded-2xl p-3.5 text-center shadow-md">
                  <div className="text-xl sm:text-2xl font-black text-[#FB923C] font-mono">50 &amp; 60 Hz</div>
                  <div className="text-[11px] text-orange-200 font-semibold mt-0.5">Dual Simultaneous Frequency</div>
                </div>
                <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-3.5 text-center shadow-md">
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">2 × 250 MTPH</div>
                  <div className="text-[11px] text-blue-200 font-semibold mt-0.5">Hyundai CFB Boilers</div>
                </div>
                <div className="bg-white/10 border border-orange-400/30 backdrop-blur-md rounded-2xl p-3.5 text-center shadow-md">
                  <div className="text-xl sm:text-2xl font-black text-[#FB923C] font-mono">May 19, 2017</div>
                  <div className="text-[11px] text-orange-200 font-semibold mt-0.5">Commercial Operation (COD)</div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: COMPANY OVERVIEW & HISTORY (Fpcl 2.jpeg)                        */}
        {/* ========================================================================= */}
        <section id="overview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border-2 border-blue-100 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xl shadow-blue-900/5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#EA580C] bg-orange-50 px-3.5 py-1 rounded-full border border-orange-200">
                  <Factory className="w-4 h-4 text-[#EA580C]" />
                  <span>Company Overview &amp; History</span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#002B54] leading-tight">
                  Excellence Through In-House Execution
                </h2>

                <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                  FFBL Power Company Limited (FPCL) is an unlisted public limited company incorporated in June 2014 as a special purpose vehicle (SPV). FPCL accomplished a pioneering feat in Pakistan’s power sector by being completed on a <strong className="text-[#0066B3]">Non-EPC basis</strong> entirely through its in-house team of engineers and professionals.
                </p>

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Operating under NEPRA Generation License No. <strong className="text-[#002B54]">SGC/111/2015</strong>, FPCL commenced commercial operation on <strong className="text-[#002B54]">May 19, 2017</strong>. Since commissioning, it has consistently delivered dual-frequency reliability and baseload steam generation to power Pakistan’s industrial core.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                    <div className="text-[10px] font-mono text-[#0066B3] font-bold uppercase">June 2014</div>
                    <div className="text-xs font-bold text-[#002B54] mt-1">Incorporated as SPV</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Unlisted Public Limited</div>
                  </div>
                  <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200">
                    <div className="text-[10px] font-mono text-[#EA580C] font-bold uppercase">NEPRA License</div>
                    <div className="text-xs font-bold text-[#002B54] mt-1">No. SGC/111/2015</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Generation License</div>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                    <div className="text-[10px] font-mono text-[#0066B3] font-bold uppercase">May 19, 2017</div>
                    <div className="text-xs font-bold text-[#002B54] mt-1">COD Milestone</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Commercial Operation</div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="relative rounded-2xl overflow-hidden border-2 border-blue-200 shadow-xl group">
                  <img
                    src="./assets/Fpcl 2.jpeg"
                    alt="FPCL Actual Wide Plant and Coal Storage Dome Exterior"
                    className="w-full h-72 sm:h-80 lg:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('/assets/')) {
                        target.src = '/assets/Fpcl 2.jpeg';
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#001D3D]/90 via-transparent to-transparent" />
                  <div className="absolute bottom-3.5 left-4 right-4">
                    <span className="text-[10px] font-mono font-bold text-white bg-[#EA580C] px-2.5 py-0.5 rounded shadow-xs">
                      Port Qasim Complex
                    </span>
                    <p className="text-xs font-bold text-white mt-1.5 drop-shadow-sm">
                      Wide View of Plant Structure &amp; Environmental Coal Storage Dome
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: DUAL-FREQUENCY POWER SUPPLY (50 Hz & 60 Hz)                    */}
        {/* ========================================================================= */}
        <section id="dual-frequency" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border-2 border-blue-100 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xl shadow-blue-900/5 space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0066B3] bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200 mb-2">
                <Zap className="w-4 h-4 text-[#0066B3]" />
                <span>Dual-Frequency Engineering Innovation</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#002B54]">
                Powering Two Frequencies: 50 Hz &amp; 60 Hz
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-2">
                FPCL is engineered to simultaneously supply two distinct frequencies, ensuring utility grid stabilization and dedicated fertilizer manufacturing without interruption.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 50 Hz Card (K-Electric) - Royal Blue Theme */}
              <div className="rounded-2xl bg-gradient-to-br from-blue-50 via-white to-blue-100/40 border-2 border-blue-300 p-6 sm:p-8 relative overflow-hidden shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-[#0066B3]">50 Hz</span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#0066B3] text-white shadow-xs">
                    Utility Grid Interconnection
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#002B54] mb-2">
                  K-Electric (KE) Power Export
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                  FPCL exports up to <strong className="text-[#0066B3]">60 MW</strong> of reliable thermal electricity directly to K-Electric, supporting metropolitan Karachi’s industrial and residential grid demand.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 border-t border-blue-200/80 pt-4 font-medium">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0066B3] shrink-0" />
                    <span>Up to 60 MW continuous export capacity</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0066B3] shrink-0" />
                    <span>50 Hz STG Block: 1 × 60 MW turbine unit</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0066B3] shrink-0" />
                    <span>Direct 132 kV transmission interconnection</span>
                  </li>
                </ul>
              </div>

              {/* 60 Hz Card (FFBL) - Flame Orange Theme */}
              <div className="rounded-2xl bg-gradient-to-br from-orange-50 via-white to-amber-100/40 border-2 border-orange-300 p-6 sm:p-8 relative overflow-hidden shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-[#EA580C]">60 Hz</span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#EA580C] text-white shadow-xs">
                    Dedicated Industrial generation
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#002B54] mb-2">
                  Fauji Fertilizer Bin Qasim Limited (FFBL)
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                  Continuous baseload supply of 60 Hz power and high-pressure superheated steam directly to Pakistan’s flagship DAP and fertilizer production complex.
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 border-t border-orange-200/80 pt-4 font-medium">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#EA580C] shrink-0" />
                    <span>60 Hz STG Block: 2 × 24 MW + 1 × 10 MW generation units</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#EA580C] shrink-0" />
                    <span>Simultaneous export of high &amp; medium pressure process steam</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#EA580C] shrink-0" />
                    <span>Complete electrical islanding and plant protection safety</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: CFB TECHNOLOGY & BOILERS (DSCN9326.jpg - Single actual boiler) */}
        {/* ========================================================================= */}
        <section id="cfb-technology" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border-2 border-blue-100 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xl shadow-blue-900/5 space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#EA580C] bg-orange-50 px-3.5 py-1 rounded-full border border-orange-200 mb-2">
                <Flame className="w-4 h-4 text-[#EA580C]" />
                <span>Clean Combustion Leadership</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#002B54]">
                Advanced Circulating Fluidized Bed (CFB) Boilers
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-2">
                Featuring 02 × 250 MTPH CFB boilers from Hyundai Heavy Industries (HHI) – South Korea, combining low emissions, high thermal efficiency, and wide fuel flexibility.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Single Boiler Showcase (No Duplicate Pictures!) */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl overflow-hidden border-2 border-blue-200 shadow-xl group h-80 sm:h-96">
                  <img
                    src="./assets/DSCN9326.jpg"
                    alt="CFB Boiler Structure and Stack Actual Plant Photo"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('/assets/')) {
                        target.src = '/assets/DSCN9326.jpg';
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#001D3D]/90 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-[10px] font-mono font-bold text-white bg-[#0066B3] px-2.5 py-0.5 rounded shadow-xs">
                      Hyundai Heavy Industries (HHI)
                    </span>
                    <p className="text-xs font-bold text-white mt-1.5 drop-shadow-sm">
                      02 × 250 MTPH CFB Boiler Unit &amp; Stack Structure
                    </p>
                  </div>
                </div>
              </div>

              {/* Boiler Pillars */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-white border border-blue-200 shadow-xs">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#0066B3] text-white flex items-center justify-center shrink-0 shadow-md">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#002B54]">Environment Friendly</h3>
                      <p className="text-slate-600 text-xs sm:text-sm mt-1 leading-relaxed">
                        Ensures low NOx and SOx emissions through staged low-temperature combustion and in-situ limestone injection, comfortably exceeding Sindh Environmental Quality Standards (SEQS).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-50/70 to-white border border-orange-200 shadow-xs">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#EA580C] text-white flex items-center justify-center shrink-0 shadow-md">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#002B54]">High Thermal Efficiency</h3>
                      <p className="text-slate-600 text-xs sm:text-sm mt-1 leading-relaxed">
                        Fluidized bed cyclone particle recirculation captures high combustion heat rates while reducing specific auxiliary power consumption across varying steam loads.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-white border border-blue-200 shadow-xs">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#0066B3] text-white flex items-center justify-center shrink-0 shadow-md">
                      <Flame className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#002B54]">Fuel Flexibility (Thar Coal Ready)</h3>
                      <p className="text-slate-600 text-xs sm:text-sm mt-1 leading-relaxed">
                        Robust design capable of combusting diverse coal grades from imported coal to local indigenous blends, including up to <strong className="text-[#EA580C]">40% Thar coal blends</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: INFRASTRUCTURE & OPERATIONS (DSCN9295.jpg & DSC_2579.JPG)      */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coal Shed Internal */}
            <div className="bg-white rounded-3xl overflow-hidden border-2 border-blue-100 shadow-xl shadow-blue-900/5 group">
              <div className="h-64 sm:h-72 relative overflow-hidden">
                <img
                  src="./assets/DSCN9295.jpg"
                  alt="Inside Coal Storage Dome and Conveyor System Actual Photo"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('/assets/')) {
                      target.src = '/assets/DSCN9295.jpg';
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001D3D]/90 via-transparent to-transparent" />
                <div className="absolute bottom-3.5 left-4 right-4">
                  <span className="text-[10px] font-mono font-bold text-white bg-[#0066B3] px-2.5 py-0.5 rounded shadow-xs">
                    Bulk Material Handling
                  </span>
                  <h3 className="text-base font-bold text-white mt-1 drop-shadow-sm">
                    Enclosed Coal Storage Dome &amp; Conveyors
                  </h3>
                </div>
              </div>
              <div className="p-5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Fully covered aerodynamic dome with continuous automated stacker and reclaimer conveyor systems. Eliminates fugitive coal dust and protects the coastal environment.
              </div>
            </div>

            {/* Main Control room */}
            <div className="bg-white rounded-3xl overflow-hidden border-2 border-orange-100 shadow-xl shadow-orange-900/5 group">
              <div className="h-64 sm:h-72 relative overflow-hidden">
                <img
                  src="./assets/DSC_2579.JPG"
                  alt="Main Control Room Actual Plant Photo"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('/assets/')) {
                      target.src = '/assets/DSC_2579.JPG';
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001D3D]/90 via-transparent to-transparent" />
                <div className="absolute bottom-3.5 left-4 right-4">
                  <span className="text-[10px] font-mono font-bold text-white bg-[#EA580C] px-2.5 py-0.5 rounded shadow-xs">
                    Engineering &amp; Control
                  </span>
                  <h3 className="text-base font-bold text-white mt-1 drop-shadow-sm">
                    Main Control room
                  </h3>
                </div>
              </div>
              <div className="p-5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Equipped with centralized Distributed Control Systems (DCS) for synchronized generation, turbine governing, and continuous real-time plant parameters monitoring.
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 6: TECHNICAL SPECIFICATIONS & ENERGY BALANCE                      */}
        {/* ========================================================================= */}
        <section id="specs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border-2 border-blue-100 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xl shadow-blue-900/5 space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0066B3] bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200 mb-2">
                <Cpu className="w-4 h-4 text-[#0066B3]" />
                <span>Technical Data Sheet</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#002B54]">
                Technical Specifications &amp; Energy Balance
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-2">
                Verified plant architecture, installed generation capacities, and location profile.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-b from-orange-50 to-white border-2 border-orange-200 shadow-xs">
                <div className="text-[10px] font-mono text-[#EA580C] uppercase font-bold">Installed Capacity</div>
                <div className="text-2xl font-black text-[#002B54] font-mono mt-1">118 MW</div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium">Dual STG Blocks Total</div>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-b from-blue-50 to-white border-2 border-blue-200 shadow-xs">
                <div className="text-[10px] font-mono text-[#0066B3] uppercase font-bold">Boilers</div>
                <div className="text-2xl font-black text-[#0066B3] font-mono mt-1">02 × 250 MTPH</div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium">CFB Boilers (HHI Korea)</div>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-b from-orange-50 to-white border-2 border-orange-200 shadow-xs">
                <div className="text-[10px] font-mono text-[#EA580C] uppercase font-bold">60 Hz STG Block</div>
                <div className="text-2xl font-black text-[#EA580C] font-mono mt-1">58 MW Total</div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium">02 × 24 MW + 01 × 10 MW</div>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-b from-blue-50 to-white border-2 border-blue-200 shadow-xs">
                <div className="text-[10px] font-mono text-[#0066B3] uppercase font-bold">50 Hz STG Block</div>
                <div className="text-2xl font-black text-[#0066B3] font-mono mt-1">01 × 60 MW</div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium">Utility Export to K-Electric</div>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="rounded-2xl border-2 border-blue-100 overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#004B87] text-white font-mono uppercase text-[11px]">
                    <tr>
                      <th className="py-3.5 px-5 font-bold">System / Element</th>
                      <th className="py-3.5 px-5 font-bold">Configuration Value</th>
                      <th className="py-3.5 px-5 font-bold">Details / Technical Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100 text-slate-700 bg-white">
                    <tr className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-[#002B54]">Installed Capacity</td>
                      <td className="py-3.5 px-5 font-mono text-[#EA580C] font-black">118 MW Gross</td>
                      <td className="py-3.5 px-5">Full thermal and generation gross rating</td>
                    </tr>
                    <tr className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-[#002B54]">Steam Generators</td>
                      <td className="py-3.5 px-5 font-mono text-[#0066B3] font-bold">02 × 250 Metric Ton / Hour</td>
                      <td className="py-3.5 px-5">Hyundai Heavy Industries (HHI) CFB Boilers</td>
                    </tr>
                    <tr className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-[#002B54]">60 Hz STG Block</td>
                      <td className="py-3.5 px-5 font-mono text-[#EA580C] font-bold">02 × 24 MW + 01 × 10 MW</td>
                      <td className="py-3.5 px-5">Dedicated power and process steam for FFBL complex</td>
                    </tr>
                    <tr className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-[#002B54]">50 Hz STG Block</td>
                      <td className="py-3.5 px-5 font-mono text-[#0066B3] font-bold">01 × 60 MW</td>
                      <td className="py-3.5 px-5">Utility grid power export to K-Electric (KE)</td>
                    </tr>
                    <tr className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-[#002B54]">Plant Site Location</td>
                      <td className="py-3.5 px-5 font-mono font-bold">Approx. 100 Acres</td>
                      <td className="py-3.5 px-5">Eastern Industrial Zone of Port Qasim, Karachi, Sindh (Adjacent to FFBL Complex)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 7: CONTACT & LOCATIONS (Clean 2-card layout)                      */}
        {/* ========================================================================= */}
        <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border-2 border-blue-100 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xl shadow-blue-900/5 space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#EA580C] bg-orange-50 px-3.5 py-1 rounded-full border border-orange-200 mb-2">
                <MapPin className="w-4 h-4 text-[#EA580C]" />
                <span>Locations &amp; Contact</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#002B54]">
                Addresses &amp; Contact Details
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-2">
                Official addresses for the registered corporate office and power generation facility.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Registered Office Address */}
              <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#003B73] via-[#004B87] to-[#002244] text-white border-2 border-blue-300/40 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white border border-white/20 mb-4 backdrop-blur-md">
                    <Building2 className="w-3.5 h-3.5 text-[#FB923C]" />
                    <span>Registered Office</span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">
                    Head Office Islamabad
                  </h3>
                  <p className="text-blue-100 text-xs sm:text-sm leading-relaxed mb-4">
                    FFBL Power Company Limited<br />
                    FFBL Tower, C1/C2, Sector B, Jinnah Boulevard, DHA II,<br />
                    Islamabad, Pakistan
                  </p>
                </div>
                <div className="pt-4 border-t border-white/15 text-[11px] font-mono text-blue-200 flex items-center justify-between">
                  <span>Federal Capital</span>
                  <span className="text-[#FB923C] font-bold">Corporate Governance</span>
                </div>
              </div>

              {/* Card 2: Power Plant Site Address & Telephone */}
              <div className="p-6 sm:p-8 rounded-2xl bg-white border-2 border-orange-200 flex flex-col justify-between shadow-xl shadow-orange-900/5">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-[#EA580C] border border-orange-200 mb-4">
                    <Factory className="w-3.5 h-3.5 text-[#EA580C]" />
                    <span>Power Plant Site</span>
                  </div>
                  <h3 className="text-xl font-black text-[#002B54] mb-2">
                    Port Qasim Complex Karachi
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                    FFBL Power Company Limited<br />
                    EZ/I/P-1, Eastern Zone, Bin Qasim,<br />
                    Karachi – 75020, Pakistan
                  </p>
                  <div className="space-y-2 text-xs sm:text-sm text-slate-700 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#EA580C]" />
                      <span>Telephone (Plant Site): <strong className="text-[#002B54] font-black">+92 21 34724500</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#0066B3]" />
                      <span>UAN / PBX: <strong className="text-[#002B54] font-black">+92 21 34243333-5</strong></span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                  <span>Eastern Zone Port Qasim</span>
                  <span className="text-[#0066B3] font-bold">Generation Operations</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-20 bg-[#002244] border-t-4 border-[#EA580C] text-white text-xs py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-[#FB923C] text-base">FPCL</span>
            <span className="text-blue-300">·</span>
            <span className="font-semibold text-blue-100">FFBL Power Company Limited</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-medium text-blue-200">
            <button onClick={() => scrollToSection('contact')} className="hover:text-[#FB923C] transition-colors cursor-pointer">
              Registered Office (Islamabad)
            </button>
            <span>·</span>
            <button onClick={() => scrollToSection('contact')} className="hover:text-[#FB923C] transition-colors cursor-pointer">
              Plant Site (Karachi)
            </button>
          </div>

          <div className="font-mono text-[11px] text-blue-300 text-center md:text-right">
            © 2026 FFBL Power Company Limited (FPCL). All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
