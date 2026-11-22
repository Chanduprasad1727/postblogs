import React, { useState, useEffect } from 'react';
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
  CreditCard,
  KeyRound,
  RefreshCw,
  Clock,
  AlertCircle
} from 'lucide-react';

export const LoginPage = ({ onNavigateToFeed, onNavigateToHome }) => {
  const { 
    login, 
    register, 
    isSupabase,
    sendPasswordResetOtp,
    verifyPasswordResetOtp,
    resetPassword 
  } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [forgotStep, setForgotStep] = useState('email'); // 'email' | 'otp' | 'new-password'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Forgot Password specific state
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleHomeClick = onNavigateToHome || onNavigateToFeed;

  // Resend OTP Cooldown timer
  useEffect(() => {
    let timer = null;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        onNavigateToFeed();
      } else if (mode === 'register') {
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

  // 1. Send OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address to receive the verification OTP.');
      return;
    }
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const res = await sendPasswordResetOtp(email);
      setSuccessMessage(res.message || 'OTP verification code sent to your email.');
      if (res.devOtpHint) {
        setDevOtpHint(res.devOtpHint);
      }
      setForgotStep('otp');
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to send verification OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Please enter a valid OTP verification code (e.g. 6 to 8 digits).');
      return;
    }
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const res = await verifyPasswordResetOtp(email, cleanOtp);
      setRecoveryToken(res.recoveryToken || '');
      setSuccessMessage('OTP verified successfully! Please enter your new password.');
      setForgotStep('new-password');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Reset Password
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match. Please re-enter your new password.');
      return;
    }
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const res = await resetPassword(email, newPassword, recoveryToken, otp);
      setSuccessMessage(res.message || 'Password reset successfully! You can now sign in with your new password.');
      setPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setOtp('');
      setRecoveryToken('');
      setDevOtpHint('');
      setMode('login');
      setForgotStep('email');
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchToForgot = () => {
    setMode('forgot');
    setForgotStep('email');
    setError('');
    setSuccessMessage('');
  };

  const switchToLogin = () => {
    setMode('login');
    setForgotStep('email');
    setError('');
    setSuccessMessage('');
  };

  const switchToRegister = () => {
    setMode('register');
    setForgotStep('email');
    setError('');
    setSuccessMessage('');
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
                <div className="text-xs">
                  <p className="font-extrabold text-amber-300">₹149 / Month Membership</p>
                  <p className="text-[11px] text-amber-200/80">Scan UPI QR to 9704875593@slc for instant approval</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Film className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-200">Institutional Video Research</p>
                  <p className="text-[11px] text-slate-400">Deep-dive equity & macroeconomic valuation models</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-200">Community Sentiment Polls</p>
                  <p className="text-[11px] text-slate-400">Real-time participatory pulse on market catalysts</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-200">Supabase OTP Verification</p>
                  <p className="text-[11px] text-slate-400">Zero-hassle secure email OTP password reset</p>
                </div>
              </div>
            </div>

            {/* Credibility Badge */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 space-y-1">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Client Architecture</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Supabase Cloud Authentication & PostgreSQL infrastructure with encrypted session management.
              </p>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="pt-8 border-t border-slate-800/80 text-xs text-slate-500 flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <span>© {new Date().getFullYear()} Kalaga Wealth</span>
              {isSupabase && (
                <span className="inline-flex items-center text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                  Supabase Connected
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Sole Administrator: <strong>Kalaga Pavan Kishore</strong>. Client accounts receive verified portal access.
            </p>
          </div>

        </div>

        {/* Right Column: Authentication & Password Reset Form */}
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

            {/* Mode Switcher */}
            {mode === 'forgot' ? (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Sign In</span>
                  </button>
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200">
                    Supabase Password Recovery
                  </span>
                </div>

                {/* Step Progress Indicators */}
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl text-center text-xs font-bold">
                  <div className={`py-1.5 rounded-xl transition ${forgotStep === 'email' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400'}`}>
                    1. Email
                  </div>
                  <div className={`py-1.5 rounded-xl transition ${forgotStep === 'otp' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400'}`}>
                    2. Verify OTP
                  </div>
                  <div className={`py-1.5 rounded-xl transition ${forgotStep === 'new-password' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400'}`}>
                    3. New Password
                  </div>
                </div>
              </div>
            ) : (
              /* Tab Switcher: Sign In vs Create Account */
              <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
                <button
                  type="button"
                  onClick={switchToLogin}
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
                  onClick={switchToRegister}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                    mode === 'register'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Register as Client
                </button>
              </div>
            )}

            {/* Success Notification Alert */}
            {successMessage && (
              <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium leading-relaxed flex items-start space-x-2.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Message Alert */}
            {error && (
              <div className="mb-6 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium leading-relaxed flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
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

            {/* ------------------- FORGOT PASSWORD MODE ------------------- */}
            {mode === 'forgot' ? (
              <div className="space-y-5">
                
                {/* STEP 1: Enter Email to Send OTP */}
                {forgotStep === 'email' && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                        Reset Your Password
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Enter your registered email address. Supabase will send a 6-digit OTP verification code to your inbox.
                      </p>
                    </div>

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

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending OTP code...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>Send Verification OTP</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* STEP 2: Enter & Verify OTP */}
                {forgotStep === 'otp' && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                        Verify Email OTP
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        We sent a verification code to <strong className="text-slate-800">{email}</strong>. Enter the OTP below:
                      </p>
                    </div>

                    {/* Dev OTP Hint if available */}
                    {devOtpHint && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                        <div>
                          <span className="font-bold">Recovery OTP Code: </span>
                          <span className="font-mono font-black text-slate-950 bg-amber-200/70 px-2 py-0.5 rounded text-sm tracking-wider">
                            {devOtpHint}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOtp(devOtpHint)}
                          className="text-[11px] font-bold text-amber-800 underline hover:text-amber-950 ml-2"
                        >
                          Auto-fill
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        6-Digit OTP Code
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\s+/g, ''))}
                          placeholder="e.g. 268742"
                          maxLength={12}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-slate-900 font-mono tracking-widest font-bold"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => { setForgotStep('email'); setError(''); }}
                        className="text-slate-500 hover:text-slate-800 underline"
                      >
                        Change Email
                      </button>

                      <button
                        type="button"
                        disabled={resendCooldown > 0 || loading}
                        onClick={handleSendOtp}
                        className={`font-bold transition ${
                          resendCooldown > 0 
                            ? 'text-slate-400 cursor-not-allowed' 
                            : 'text-amber-700 hover:text-amber-800 hover:underline'
                        }`}
                      >
                        {resendCooldown > 0 ? (
                          <span className="inline-flex items-center space-x-1">
                            <Clock className="w-3 h-3 inline" />
                            <span>Resend in {resendCooldown}s</span>
                          </span>
                        ) : (
                          'Resend OTP Code'
                        )}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying OTP code...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify OTP & Continue</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* STEP 3: Enter New Password */}
                {forgotStep === 'new-password' && (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                        Create New Password
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        OTP verified for <strong className="text-slate-800">{email}</strong>. Enter your new password below.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        New Password (min 6 characters)
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          minLength={6}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900 font-medium"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="••••••••"
                          minLength={6}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900 font-medium"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md transition active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Updating password...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Reset Password & Complete</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

              </div>
            ) : (
              /* ------------------- LOGIN & REGISTER FORM ------------------- */
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={switchToForgot}
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline transition"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
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
            )}
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
