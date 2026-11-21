import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  ShieldAlert, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  Film, 
  BarChart3, 
  CheckCircle2, 
  Loader2,
  ChevronLeft,
  TrendingUp,
  ShieldCheck,
  CreditCard
} from 'lucide-react';

export const LoginPage = ({ onNavigateToFeed, onNavigateToHome }) => {
  const { login, register, isSupabase } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleHomeClick = onNavigateToHome || onNavigateToFeed;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        onNavigateToFeed();
      } else {
        // STRICT: All registrations are client members
        const res = await register(email, password, fullName, 'client');
        if (res?.needsEmailConfirmation) {
          setSuccessMessage(res.message || 'Registration complete! Please check your email to verify your account, then sign in.');
          setMode('login');
          return;
        }
        onNavigateToFeed();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-[calc(100vh-140px)] bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 py-10 sm:py-16 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Background Decorative Gradient Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="max-w-5xl w-full bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col lg:flex-row relative z-10 border border-slate-800/40">
        
        {/* Left Column: Kalaga Wealth Showcase & Platform Overview */}
        <div className="lg:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 sm:p-12 text-white flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
          
          <div>
            {/* Top Brand Logo */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black text-xl">
                KW
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">Kalaga Wealth</h1>
                <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                  Strategic Wealth Advisory & Intelligence
                </p>
              </div>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight leading-tight mb-4 text-slate-100">
              High-Conviction Financial Insights & Investor Community
            </h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-8">
              Welcome to the private digital portal for Kalaga Wealth market commentaries, video insights, and community sentiment surveys.
            </p>

            {/* Platform Highlights */}
            <div className="space-y-3.5 mb-8">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-amber-200">Investor Membership: ₹149 / Month</h3>
                  <p className="text-[11px] text-slate-300">Scan & pay via UPI (9704875593@slc) to unlock the single scroll feed.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Curated Research & Market Insights</h3>
                  <p className="text-[11px] text-slate-400">Published directly by Kalaga Pavan Kishore.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Video Briefings & Media Feed</h3>
                  <p className="text-[11px] text-slate-400">Stream market analysis and multimedia presentations.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Interactive Investor Polls</h3>
                  <p className="text-[11px] text-slate-400">Vote on community asset allocation and sentiment questions.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Security & Authentication Notice */}
          <div className="pt-6 border-t border-slate-800 flex items-center space-x-3 text-slate-400">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                <span>Enterprise Authentication</span>
                {isSupabase && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-md font-semibold">
                    Supabase Connected
                  </span>
                )}
              </p>
              <p className="text-[11px] text-slate-400">
                Sole Administrator: <strong>Kalaga Pavan Kishore</strong>. Client accounts receive verified portal access.
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Authentication Form */}
        <div className="lg:w-1/2 p-8 sm:p-12 flex flex-col justify-between bg-white">
          
          <div>
            {/* Top Navigation Row */}
            <div className="flex items-center justify-between mb-8">
              <button
                type="button"
                onClick={handleHomeClick}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Return to Home Page</span>
              </button>
              <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Kalaga Wealth Member
              </span>
            </div>

            {/* Tab Switcher: Sign In vs Create Account */}
            <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setSuccessMessage(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                  mode === 'register'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Register as Client
              </button>
            </div>

            {/* Success Notification Alert */}
            {successMessage && (
              <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium leading-relaxed flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Message Alert */}
            {error && (
              <div className="mb-6 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium leading-relaxed">
                {error}
              </div>
            )}

            {/* Registration Informational Notice */}
            {mode === 'register' && (
              <div className="mb-5 p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start space-x-2.5 text-xs text-amber-900 leading-relaxed">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Administrator privileges are held exclusively by <strong>Kalaga Pavan Kishore</strong>. All new accounts register as verified <strong>Client / Investor members</strong>.
                </span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900 font-medium"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900 font-medium"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying credentials...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In to Kalaga Wealth' : 'Register Client Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Back to Home Link */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Want to review spotlight insights first?{' '}
              <button
                type="button"
                onClick={handleHomeClick}
                className="font-bold text-emerald-700 hover:underline inline-flex items-center"
              >
                <span>View Home Page Spotlight</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
