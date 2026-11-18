import React from 'react';
import { 
  ExternalLink, 
  Mail, 
  ShieldCheck,
  Layers,
  Home,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Footer = ({ onNavigateToHome, onNavigateToFeed, onNavigateToLogin, onOpenProfile }) => {
  const { user, isAdmin } = useAuth();

  return (
    <footer className="bg-slate-950 text-white border-t border-slate-800/80 font-['Plus_Jakarta_Sans',sans-serif] relative overflow-hidden z-30">
      
      {/* Background Subtle Accent Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800/80">
          
          {/* Column 1: Brand & Sole Admin Profile */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-amber-500/20">
                KW
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-white block leading-tight">
                  Kalaga Wealth
                </span>
                <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase block">
                  Strategic Wealth Advisory & Intelligence
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              A private digital portal providing high-conviction market research, macro commentaries, multimedia presentations, and community investor polls authored by Sole Administrator <strong>Kalaga Pavan Kishore</strong>.
            </p>

            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sole Administrator: <strong>Kalaga Pavan Kishore</strong></span>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Platform Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={onNavigateToHome}
                  className="text-slate-400 hover:text-white transition flex items-center space-x-1.5"
                >
                  <Home className="w-3.5 h-3.5 text-slate-500" />
                  <span>Home Page Spotlight</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateToFeed}
                  className="text-slate-400 hover:text-white transition flex items-center space-x-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>Single Scroll Feed</span>
                </button>
              </li>
              {user ? (
                <li>
                  <button
                    type="button"
                    onClick={onOpenProfile}
                    className="text-slate-400 hover:text-white transition flex items-center space-x-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>My Profile & DP</span>
                  </button>
                </li>
              ) : (
                <li>
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    className="text-slate-400 hover:text-white transition flex items-center space-x-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Member Sign In / Register</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Column 3: Social & Connect */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Connect & Insights
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition inline-flex items-center space-x-1.5"
                >
                  <span>LinkedIn</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition inline-flex items-center space-x-1.5"
                >
                  <span>X (Twitter)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition inline-flex items-center space-x-1.5"
                >
                  <span>YouTube Channel</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@kalagawealth.com"
                  className="text-slate-400 hover:text-white transition inline-flex items-center space-x-1.5"
                >
                  <Mail className="w-3 h-3 text-slate-500" />
                  <span>Email Advisory Desk</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Strip: Copyright & Constant Pockethost.in Signature */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          
          <div className="flex items-center space-x-2 text-center sm:text-left">
            <span>© {new Date().getFullYear()} Kalaga Wealth. All rights reserved.</span>
          </div>

          {/* Mandatory Constant Signature */}
          <div className="text-center sm:text-right">
            <span className="text-slate-400">Build your brand Using </span>
            <a
              href="https://pockethost.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 font-extrabold hover:underline"
            >
              Pockethost.in
            </a>
          </div>

        </div>

      </div>

    </footer>
  );
};
