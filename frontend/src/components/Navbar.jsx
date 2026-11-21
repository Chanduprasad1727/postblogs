import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  PlusCircle, 
  LogOut, 
  LogIn,
  Home,
  Layers,
  Lock,
  Camera,
  Users
} from 'lucide-react';

export const Navbar = ({ 
  currentView = 'home',
  onNavigateToHome,
  onNavigateToFeed,
  onNavigateToLogin,
  onOpenCreatePost,
  onOpenManageClients,
  onOpenProfile
}) => {
  const { user, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Navigation Links */}
        <div className="flex items-center space-x-8">
          
          {/* Logo */}
          <div 
            onClick={onNavigateToHome}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-amber-500/20 group-hover:scale-105 transition">
              KW
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Kalaga Wealth
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Advisory & Insights
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200">
            <button
              onClick={onNavigateToHome}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                currentView === 'home'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <button
              onClick={onNavigateToFeed}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                currentView === 'feed'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Single Scroll Feed</span>
              {!user && (
                <span className="inline-flex items-center space-x-0.5 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-bold ml-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Members</span>
                </span>
              )}
            </button>
          </nav>

        </div>

        {/* Right side Actions */}
        <div className="flex items-center space-x-3">
          
          {/* Mobile feed switch button */}
          <button
            onClick={currentView === 'home' ? onNavigateToFeed : onNavigateToHome}
            className="md:hidden px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
          >
            {currentView === 'home' ? 'Feed' : 'Home'}
          </button>

          {isAdmin && (
            <>
              <button
                onClick={onOpenManageClients}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 font-bold text-xs shadow-xs transition active:scale-95"
                title="Manage and View Clients"
              >
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Clients</span>
              </button>

              <button
                onClick={onOpenCreatePost}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/30 transition hover:shadow-md active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Post</span>
              </button>
            </>
          )}

          {/* User profile / Change DP */}
          {user ? (
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
              <button
                onClick={onOpenProfile}
                title="Your Profile & Change DP"
                className="flex items-center space-x-2.5 hover:opacity-90 transition group p-1 -m-1 rounded-xl hover:bg-slate-100"
              >
                <div className="relative">
                  <img
                    src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                    alt={user.full_name}
                    className="w-8 h-8 rounded-full border border-slate-300 bg-white shadow-xs object-cover"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-600 text-white rounded-full p-0.5 shadow-xs group-hover:scale-110 transition">
                    <Camera className="w-2.5 h-2.5" />
                  </div>
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[130px] block leading-tight">
                    {user.full_name}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold block leading-tight">
                    Change DP
                  </span>
                </div>
              </button>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onNavigateToLogin}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
