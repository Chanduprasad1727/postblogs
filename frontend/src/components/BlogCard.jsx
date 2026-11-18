import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Trash2, 
  ShieldCheck, 
  Film, 
  Image as ImageIcon, 
  BarChart2, 
  ChevronRight, 
  Eye, 
  Sparkles,
  Star
} from 'lucide-react';

export const BlogCard = ({ post, onDeletePost, onOpenPollModal, onToggleFeatured }) => {
  const { isAdmin } = useAuth();

  const isVideoUrl = (url) => {
    return (
      url.endsWith('.mp4') ||
      url.endsWith('.mov') ||
      url.endsWith('.webm') ||
      url.includes('youtube.com') ||
      url.includes('youtu.be')
    );
  };

  const isYouTube = (url) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeEmbedUrl = (url) => {
    try {
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      const match = url.match(/[?&]v=([^&]+)/);
      return match ? `https://www.youtube.com/embed/${match[1]}` : url;
    } catch {
      return url;
    }
  };

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
    <article className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col w-full">
      
      {/* Header: Author Info, Role Badge & Date */}
      <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center space-x-3.5">
          <img
            src={post.author.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.email}`}
            alt={post.author.full_name}
            className="w-11 h-11 rounded-full border border-slate-200 bg-slate-50 object-cover shadow-xs"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base text-slate-900">{post.author.full_name}</span>
              {post.author.role === 'admin' ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sole Admin</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-800">
                  <span>Client</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(post.created_at)}</span>
              </span>
              <span>•</span>
              <span>3 min read</span>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="flex items-center space-x-1.5">
            {onToggleFeatured && (
              <button
                onClick={() => onToggleFeatured(post.id)}
                title={post.is_featured ? "Remove from Home Page spotlight" : "Pin to Home Page spotlight"}
                className={`px-3 py-1.5 rounded-xl transition border text-xs font-bold flex items-center space-x-1 active:scale-95 ${
                  post.is_featured
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "text-slate-400 hover:text-amber-700 hover:bg-amber-50 border-slate-200"
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${post.is_featured ? "fill-amber-500 text-amber-500" : ""}`} />
                <span className="hidden sm:inline text-[11px]">{post.is_featured ? "Pinned on Home" : "Pin to Home"}</span>
              </button>
            )}
            <button
              onClick={() => onDeletePost(post.id)}
              title="Delete post (Admin Only)"
              className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition border border-transparent hover:border-red-100 active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Blog Post Content */}
      <div className="p-6 md:p-8 space-y-5">
        
        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
          {post.title}
        </h2>

        {/* Full-width Media Attachments (Video & Images) */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="space-y-4 my-4">
            {post.media_urls.map((url, idx) => {
              const video = isVideoUrl(url);

              if (video) {
                return (
                  <div 
                    key={idx} 
                    className="rounded-2xl overflow-hidden bg-black aspect-video shadow-md relative group border border-slate-900"
                  >
                    <div className="absolute top-3 left-3 z-10 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-white flex items-center space-x-1.5 shadow-sm">
                      <Film className="w-3.5 h-3.5 text-red-400" />
                      <span>Video Feed</span>
                    </div>

                    {isYouTube(url) ? (
                      <iframe
                        src={getYouTubeEmbedUrl(url)}
                        title={post.title}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    ) : (
                      <video
                        src={url}
                        controls
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                    )}
                  </div>
                );
              }

              // Image
              return (
                <div 
                  key={idx} 
                  className="rounded-2xl overflow-hidden bg-slate-100 max-h-[520px] relative group border border-slate-200/80 shadow-xs"
                >
                  <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-white flex items-center space-x-1.5 shadow-sm">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Attached Image</span>
                  </div>
                  <img
                    src={url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500"
                    loading="lazy"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Post Story Paragraphs */}
        <div className="text-slate-700 text-base leading-relaxed whitespace-pre-line font-normal">
          {post.content}
        </div>

        {/* Attached Poll Callout Card (Clicking opens Popup) */}
        {post.poll && (
          <div 
            onClick={() => onOpenPollModal(post.poll)}
            className="group cursor-pointer mt-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-300/70 hover:border-emerald-500 transition-all shadow-xs hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20 group-hover:scale-105 transition">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    Attached Community Poll
                  </span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                    {post.poll.total_votes} {post.poll.total_votes === 1 ? 'vote' : 'votes'}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-0.5 group-hover:text-emerald-900 transition leading-snug">
                  {post.poll.question}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Click to open description, view options, and vote.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm shrink-0 group-hover:shadow-md"
            >
              <span>{post.poll.user_voted_option_id ? 'View Poll Results' : 'Vote in Poll'}</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        )}

      </div>

      {/* Footer Details */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-slate-600">
            {post.media_type !== 'none' ? `Includes ${post.media_type}` : 'Text Story'}
          </span>
          {post.poll && (
            <span className="text-emerald-700 font-bold">
              ● Active Poll Attached
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 text-slate-400">
          <Eye className="w-3.5 h-3.5" />
          <span>Available for Clients</span>
        </div>
      </div>

    </article>
  );
};
