import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  ShieldCheck, 
  BarChart3, 
  Film, 
  Users, 
  Mail, 
  ExternalLink, 
  CheckCircle2, 
  Star, 
  Calendar,
  Layers,
  Award,
  BookOpen
} from 'lucide-react';

export const HomePage = ({ 
  posts = [], 
  polls = [], 
  onNavigateToFeed, 
  onNavigateToLogin,
  onOpenPollModal,
  onToggleFeatured,
  onOpenManageClients
}) => {
  const { user, isAdmin } = useAuth();

  // Filter posts that admin marked as featured on Home
  const featuredPosts = posts.filter((p) => p.is_featured);
  // Fallback to top 2 posts if none explicitly marked
  const displayPosts = featuredPosts.length > 0 ? featuredPosts : posts.slice(0, 2);

  // Latest poll
  const latestPoll = polls[0];

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-amber-500/15 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          
          {/* Eyebrow Tag */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-900 border border-amber-400/40 text-amber-300 text-xs font-bold tracking-wide mb-8 shadow-sm">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Strategic Wealth Intelligence & Capital Preservation</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto text-slate-100">
            Disciplined Investing. <br />
            <span className="bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-300 bg-clip-text text-transparent">
              Generational Wealth.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Authored and managed exclusively by <span className="font-bold text-white">Kalaga Pavan Kishore</span>. High-conviction asset allocation analysis, macroeconomic research, and real-time community sentiment surveys.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={onNavigateToFeed}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 transition active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>Explore Research Feed</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!user ? (
              <button
                onClick={onNavigateToLogin}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition active:scale-95"
              >
                Sign In / Join Portal
              </button>
            ) : (
              <span className="text-xs text-slate-400 font-medium sm:pl-2">
                Signed in as <strong className="text-white">{user.full_name}</strong>
              </span>
            )}
          </div>

          {/* Core Highlights Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-4xl mx-auto pt-10 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Single Administrator</span>
              </div>
              <p className="text-sm font-semibold text-slate-200">100% In-house analysis by Kalaga Pavan Kishore</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>Asset Compounding</span>
              </div>
              <p className="text-sm font-semibold text-slate-200">Equities, Fixed Income & Multi-Asset Strategies</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
              <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase mb-1">
                <BarChart3 className="w-4 h-4" />
                <span>Community Polls</span>
              </div>
              <p className="text-sm font-semibold text-slate-200">Active investor sentiment & polling</p>
            </div>
          </div>

        </div>
      </section>


      {/* 2. FEATURED RESEARCH BLOGS (CURATED BY ADMIN) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Curated by Administrator</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Market Intelligence
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select publications highlighted by Kalaga Pavan Kishore for the home portal.
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-3">
            {isAdmin && (
              <>
                <button
                  onClick={onOpenManageClients}
                  className="inline-flex items-center space-x-1.5 text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold px-3 py-1.5 rounded-xl border border-amber-300 shadow-xs transition active:scale-95"
                >
                  <Users className="w-3.5 h-3.5 text-amber-600" />
                  <span>Manage Clients</span>
                </button>
                <span className="text-xs bg-slate-100 text-slate-700 font-medium px-3 py-1 rounded-full border border-slate-200 hidden sm:inline-block">
                  Admin: Click ★ on cards to toggle featured
                </span>
              </>
            )}
            <button
              onClick={onNavigateToFeed}
              className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              <span>View All {posts.length} Publications</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Featured Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {displayPosts.map((post) => {
            const hasMedia = post.media_urls && post.media_urls.length > 0;
            const firstMedia = hasMedia ? post.media_urls[0] : null;
            const isVideo = firstMedia && (firstMedia.endsWith('.mp4') || firstMedia.includes('youtube'));

            return (
              <div 
                key={post.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
              >
                {/* Media Image Thumbnail or Video Preview */}
                {hasMedia && (
                  <div className="relative aspect-video bg-slate-900 overflow-hidden">
                    {isVideo ? (
                      <div className="w-full h-full flex items-center justify-center bg-black/80">
                        <Film className="w-12 h-12 text-white/80" />
                        <span className="absolute bottom-3 left-3 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                          Video Included
                        </span>
                      </div>
                    ) : (
                      <img
                        src={firstMedia}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        loading="lazy"
                      />
                    )}

                    {/* Featured Star Badge */}
                    {post.is_featured && (
                      <div className="absolute top-3 left-3 bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md flex items-center space-x-1">
                        <Star className="w-3.5 h-3.5 fill-white" />
                        <span>Featured</span>
                      </div>
                    )}

                    {/* Admin Toggle Button */}
                    {isAdmin && onToggleFeatured && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFeatured(post.id);
                        }}
                        title={post.is_featured ? "Remove from Home" : "Pin to Home"}
                        className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 hover:bg-white text-slate-800 shadow-md text-xs font-bold transition active:scale-95"
                      >
                        <Star className={`w-4 h-4 ${post.is_featured ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mb-3">
                      <span className="font-bold text-slate-700">Kalaga Pavan Kishore</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(post.created_at)}</span>
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition leading-snug mb-3">
                      {post.title}
                    </h3>

                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-4">
                      {post.content}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={onNavigateToFeed}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      <span>Read Insight in Feed</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                    </button>

                    {post.poll && (
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ● Poll Attached
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </section>


      {/* 3. ABOUT KALAGA WEALTH */}
      <section className="py-20 bg-slate-900 text-white border-y border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Narrative */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                <span>Our Philosophy & Leadership</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                About Kalaga Wealth
              </h2>

              <p className="text-slate-300 text-base leading-relaxed">
                Founded and directed by <strong className="text-white">Kalaga Pavan Kishore</strong>, <strong>Kalaga Wealth</strong> was established to provide uncompromised, data-driven financial perspectives and strategic asset allocation advisory.
              </p>

              <p className="text-slate-300 text-base leading-relaxed">
                Rather than chasing ephemeral market fads, our advisory model prioritizes the enduring principles of compound growth, drawdown management, and prudent multi-asset distribution across equities, mutual funds, sovereign gold, and debt securities.
              </p>

              {/* 3 Core Tenets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <h4 className="text-sm font-bold text-amber-300 mb-1">Data-Driven Conviction</h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    Macroeconomic fundamentals and cash-flow valuations over speculative noise.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <h4 className="text-sm font-bold text-emerald-300 mb-1">Direct Advisory</h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    Exclusive, direct commentary authored personally by Kalaga Pavan Kishore.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Quote & Profile Card */}
            <div className="lg:col-span-5">
              <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/20 shadow-2xl relative">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xl mb-6">
                  KW
                </div>

                <blockquote className="text-base font-semibold text-slate-100 italic leading-relaxed mb-6">
                  "Wealth creation is rarely about predicting tomorrow's headlines; it is about building resilient asset allocations that compound quietly across decades."
                </blockquote>

                <div className="pt-4 border-t border-slate-800 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/30 text-amber-300 flex items-center justify-center font-bold text-sm">
                    KPK
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Kalaga Pavan Kishore</h4>
                    <p className="text-xs text-amber-400 font-semibold">Sole Administrator & Managing Wealth Advisor</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* 4. INVESTOR SENTIMENT / COMMUNITY POLL SPOTLIGHT */}
      {latestPoll && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-slate-100 border border-emerald-300/80 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Live Community Poll Spotlight</span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 leading-snug mb-2">
                {latestPoll.question}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {latestPoll.description || "Cast your vote to see real-time investor community sentiment."}
              </p>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
                <Users className="w-3.5 h-3.5" />
                <span>{latestPoll.total_votes} total responses recorded</span>
              </div>
            </div>

            <button
              onClick={() => onOpenPollModal(latestPoll)}
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition active:scale-95 shrink-0 flex items-center space-x-2"
            >
              <span>{latestPoll.user_voted_option_id ? 'View Live Poll Stats' : 'Vote in This Poll'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}


      {/* 5. CALL TO ACTION: SIGN-IN / SIGN-UP */}
      {!user && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/90 shadow-xl max-w-3xl mx-auto">
            <Sparkles className="w-10 h-10 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
              Join the Kalaga Wealth Investor Community
            </h2>
            <p className="text-sm text-slate-600 mb-8 max-w-lg mx-auto">
              Create your complimentary Client account to cast votes in investor polls, review full video presentations, and access ongoing financial commentaries.
            </p>
            <button
              onClick={onNavigateToLogin}
              className="px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition active:scale-95"
            >
              Sign In / Register as Client
            </button>
          </div>
        </section>
      )}

    </div>
  );
};
