import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  LogOut,
  LayoutDashboard,
  Activity,
  CheckCircle2,
  TrendingUp,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

const CORRECT_PASSWORD = 'Abcd@1234';

// =========================================================================
// 1. Modern Dark-Themed Login Gate Component
// =========================================================================
interface LoginFormProps {
  onLoginSuccess: () => void;
}

function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    // Check entered password against required secret
    if (password === CORRECT_PASSWORD) {
      localStorage.setItem('app_authenticated', 'true');
      onLoginSuccess();
    } else {
      setError('Incorrect password');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0f172a] text-slate-100 flex items-center justify-center p-4 sm:p-6 relative font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Subtle Ambient Radial Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-indigo-500/10 rounded-full blur-3xl opacity-70" />
      </div>

      {/* Login Card Container (#1e293b) */}
      <div className="relative w-full max-w-md bg-[#1e293b] border border-slate-700/80 rounded-2xl shadow-2xl p-8 sm:p-10 z-10 transition-all">
        {/* Header with Security Emblem */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/25 mb-4 border border-indigo-400/30">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Executive Portal
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xs leading-relaxed">
            Please enter your password to unlock the dashboard
          </p>
        </div>

        {/* Error Alert ("Incorrect password") */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-sm animate-in fade-in duration-150">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span className="font-medium text-xs sm:text-sm">{error}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="password-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                disabled={isSubmitting}
                autoFocus
                placeholder="Enter access password"
                className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors pr-11 text-sm disabled:opacity-50"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Unlock Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#1e293b] transition-all duration-150 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span>Verifying credentials...</span>
            ) : (
              <>
                <span>Unlock Dashboard</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer Security Note */}
        <div className="mt-8 pt-5 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Client-Side Protected
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            localStorage Session
          </span>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 2. Main Dashboard Component
// =========================================================================
interface MainDashboardProps {
  onLogout: () => void;
}

function MainDashboard({ onLogout }: MainDashboardProps) {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation Bar with Log Out */}
      <header className="border-b border-slate-800 bg-[#1e293b]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white font-bold border border-indigo-400/30">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 tracking-tight">Executive Dashboard</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Authenticated
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Operations, Health, Safety, Environment & Strategic Portals
              </p>
            </div>
          </div>

          {/* Session Info & Log Out Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600/90 hover:text-white text-slate-300 text-xs font-medium border border-slate-700 hover:border-rose-500 transition-colors cursor-pointer"
              title="Lock terminal and return to login"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400 group-hover:text-white" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" /> Welcome to Protected Portal
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Live Executive Operational Dashboard
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Your session is verified and saved in browser storage (<code className="text-emerald-400 font-mono text-xs">app_authenticated = 'true'</code>). Refreshing the page preserves your access until you click Log Out.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[#0f172a] px-3.5 py-2 rounded-xl border border-slate-700 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 font-mono">Password: Abcd@1234</span>
            </div>
          </div>
        </div>

        {/* Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Safe Manhours</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">2,200,445</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Zero Lost Time Injury (LTI)</span>
            </div>
          </div>

          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>PLR Recommendations</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">93.1%</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>420 Closed / 31 Open</span>
            </div>
          </div>

          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>PSM Audit Resolution</span>
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">62.8%</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
              <span>76 Closed / 45 Open</span>
            </div>
          </div>

          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Executive Rollup</span>
              <ShieldCheck className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-bold text-white">86.7%</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-teal-400 font-medium">
              <span>496 Total Actions Closed</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// =========================================================================
// 3. Root App Component with Client-Side Password Gate
// =========================================================================
export default function App() {
  // 1. Authentication state defaulting to false
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // 2. Session Persistence: Check browser localStorage on initial load
  useEffect(() => {
    try {
      const isAuth = localStorage.getItem('app_authenticated') === 'true';
      if (isAuth) {
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.warn('Unable to access localStorage:', err);
    }
  }, []);

  // 3. Handle successful login
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // 4. Handle logout (clears session and returns to login gate)
  const handleLogout = () => {
    try {
      localStorage.removeItem('app_authenticated');
    } catch (err) {
      console.warn('Unable to remove from localStorage:', err);
    }
    setIsAuthenticated(false);
  };

  // 5. Conditional Rendering:
  // If not authenticated, render the login form.
  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  // If authenticated, render existing main dashboard layout.
  return <MainDashboard onLogout={handleLogout} />;
}
