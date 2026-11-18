import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Image as ImageIcon, 
  Film, 
  BarChart2, 
  Plus, 
  Trash2, 
  Upload, 
  Loader2,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const { token, isAdmin } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState([]);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Poll state
  const [hasPoll, setHasPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isFeatured, setIsFeatured] = useState(false);

  if (!isOpen) return null;

  // Prevent non-admins from opening
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full text-center shadow-xl">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Admin Only Access</h3>
          <p className="text-sm text-slate-600 mb-5">
            Only users with the <span className="font-semibold text-amber-700">Admin</span> role can publish blogs, add media, and create polls.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to upload media file');
      }
      setMediaUrls((prev) => [...prev, data.url]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrl = () => {
    if (!newMediaUrl.trim()) return;
    setMediaUrls((prev) => [...prev, newMediaUrl.trim()]);
    setNewMediaUrl('');
  };

  const handleRemoveMedia = (index) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPollOption = () => {
    setPollOptions((prev) => [...prev, '']);
  };

  const handleRemovePollOption = (index) => {
    if (pollOptions.length <= 2) return;
    setPollOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index, value) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !content.trim()) {
      setError('Please provide both a title and content.');
      return;
    }

    if (hasPoll) {
      if (!pollQuestion.trim()) {
        setError('Please enter a question for the poll.');
        return;
      }
      const validOptions = pollOptions.filter((opt) => opt.trim().length > 0);
      if (validOptions.length < 2) {
        setError('Please provide at least 2 non-empty poll options.');
        return;
      }
    }

    setSubmitting(true);

    try {
      // Determine media type
      let mediaType = 'none';
      if (mediaUrls.length > 0) {
        const hasVideo = mediaUrls.some(
          (u) =>
            u.endsWith('.mp4') ||
            u.endsWith('.webm') ||
            u.includes('youtube.com') ||
            u.includes('youtu.be')
        );
        const hasImage = mediaUrls.some(
          (u) => !u.endsWith('.mp4') && !u.endsWith('.webm') && !u.includes('youtube')
        );
        if (hasVideo && hasImage) mediaType = 'mixed';
        else if (hasVideo) mediaType = 'video';
        else mediaType = 'image';
      }

      const payload = {
        title: title.trim(),
        content: content.trim(),
        media_urls: mediaUrls,
        media_type: mediaType,
        is_featured: isFeatured,
        poll: hasPoll
          ? {
              question: pollQuestion.trim(),
              options: pollOptions.filter((opt) => opt.trim().length > 0)
            }
          : null
      };

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to create post');
      }

      onPostCreated(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Create Blog Post</h3>
              <p className="text-xs text-slate-500 font-medium">
                Admin Publishing Panel (Markdown, Photos, Videos & Interactive Polls)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Post Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Next-Generation Cloud Systems & 2026 Tech Trends"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-semibold"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Blog Content / Story
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article, research breakdown, or news update here..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm leading-relaxed"
              required
            />
          </div>

          {/* Media Attachments Section (Images & Videos) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Film className="w-4 h-4 text-emerald-600" />
                <span>Media Attachments (Images & Videos)</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500 lowercase">
                Upload MP4/images or paste URLs
              </span>
            </label>

            {/* List attached media */}
            {mediaUrls.length > 0 && (
              <div className="mb-3 space-y-2">
                {mediaUrls.map((url, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                    <span className="truncate max-w-sm font-mono text-slate-600">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(i)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* URL input or file upload */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newMediaUrl}
                onChange={(e) => setNewMediaUrl(e.target.value)}
                placeholder="Paste Image URL or YouTube/MP4 video link..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddUrl}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
              >
                Add URL
              </button>
              
              <label className="flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold cursor-pointer hover:bg-emerald-100 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Interactive Poll Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <BarChart2 className="w-4 h-4 text-emerald-600" />
                <span>Attach Interactive Poll</span>
              </label>
              <input
                type="checkbox"
                checked={hasPoll}
                onChange={(e) => setHasPoll(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </div>

            {hasPoll && (
              <div className="space-y-3 mt-3 pt-3 border-t border-slate-200">
                <div>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Poll Question (e.g. Which technology stack is best for 2026?)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    Options for Clients to vote on:
                  </span>
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    className="flex items-center space-x-1 text-xs text-emerald-700 font-bold hover:text-emerald-800 mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Option</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pin to Home Page Spotlight Toggle */}
          <div className="flex items-center space-x-2.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
            />
            <label htmlFor="isFeatured" className="text-xs font-bold text-amber-950 cursor-pointer select-none">
              ★ Spotlight this publication on the Kalaga Wealth Home Page
            </label>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/30 transition hover:shadow-lg active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Post...</span>
                </>
              ) : (
                <span>Publish Post (Admin)</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
