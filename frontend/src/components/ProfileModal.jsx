import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Camera, 
  Upload, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  User, 
  Mail, 
  Sparkles,
  LogOut,
  RefreshCw,
  CreditCard,
  Clock,
  AlertCircle
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200'
];

export const ProfileModal = ({ isOpen, onClose, onOpenMembership }) => {
  const { user, isAdmin, uploadAvatar, updateProfile, logout, isSupabase } = useAuth();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  if (!isOpen || !user) return null;

  const currentAvatar = previewUrl || user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;

  // Trigger system file dialog
  const handleSelectFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection from user device
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 8MB.');
      return;
    }

    // Create instant local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setErrorMessage('');
    setSuccessMessage('');
    setUploading(true);

    try {
      const newUrl = await uploadAvatar(file);
      setSuccessMessage('Display photo updated successfully!');
      setPreviewUrl(newUrl);
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to upload photo. Please try again.');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle selecting a preset avatar
  const handleSelectPreset = async (presetUrl) => {
    setUploading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await updateProfile({ avatar_url: presetUrl });
      setPreviewUrl(presetUrl);
      setSuccessMessage('Display photo updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update avatar.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white rounded-[32px] max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black text-xs shadow-sm">
              KW
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Your Member Profile & DP
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Upload your custom display photo & account details
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

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Status Notifications */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Centered Avatar Display & Upload Section */}
          <div className="flex flex-col items-center text-center">
            
            {/* Avatar with Camera Overlay */}
            <div className="relative group cursor-pointer" onClick={handleSelectFileClick}>
              <div className="w-28 h-28 rounded-full ring-4 ring-emerald-500/20 shadow-xl overflow-hidden bg-slate-100 relative">
                <img
                  src={currentAvatar}
                  alt={user.full_name}
                  className="w-full h-full object-cover"
                />
                
                {/* Uploading Overlay Spinner */}
                {uploading && (
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-[11px] font-bold">
                    <Loader2 className="w-6 h-6 animate-spin mb-1 text-emerald-400" />
                    <span>Uploading...</span>
                  </div>
                )}

                {/* Hover overlay */}
                {!uploading && (
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white text-[11px] font-bold">
                    <Camera className="w-6 h-6 mb-1 text-white" />
                    <span>Change DP</span>
                  </div>
                )}
              </div>

              {/* Little Floating Camera Button badge */}
              <button
                type="button"
                className="absolute bottom-1 right-1 p-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md border-2 border-white transition active:scale-90"
                title="Upload Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Hidden Native File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
            />

            {/* Direct Upload Button */}
            <div className="mt-3">
              <button
                type="button"
                onClick={handleSelectFileClick}
                disabled={uploading}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo from Device</span>
              </button>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Supports JPG, PNG or WEBP (Max 8MB)
              </p>
            </div>

          </div>

          {/* Quick Preset Avatars Selection */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2 text-center">
              Or Choose a Preset Profile Photo:
            </span>
            <div className="flex items-center justify-center space-x-2.5">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(url)}
                  disabled={uploading}
                  className={`w-9 h-9 rounded-full overflow-hidden border-2 transition active:scale-90 ${
                    currentAvatar === url
                      ? 'border-emerald-600 ring-2 ring-emerald-500/30 scale-105'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* User Account Details Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Name:</span>
              </div>
              <span className="text-xs font-bold text-slate-900">{user.full_name}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Email:</span>
              </div>
              <span className="text-xs font-bold text-slate-900">{user.email}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-500">Account Role:</span>
              </div>
              <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
                isAdmin 
                  ? 'bg-amber-100/80 text-amber-900 border-amber-300' 
                  : 'bg-blue-100/80 text-blue-900 border-blue-300'
              }`}>
                {isAdmin ? 'Sole Administrator' : 'Client Member (Investor)'}
              </span>
            </div>
          </div>

          {/* Membership & Renewal Card for Clients */}
          {!isAdmin && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black tracking-tight text-white">Monthly Membership (₹149/mo)</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  user.membership_status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : user.membership_status === 'pending'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                    : 'bg-red-500/20 text-red-300 border border-red-500/40'
                }`}>
                  {user.membership_status === 'active' ? 'Active' : user.membership_status === 'pending' ? 'Pending Approval' : 'Unpaid / Expired'}
                </span>
              </div>

              {user.membership_status === 'active' ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Renewal Countdown:</span>
                    <span className="font-extrabold text-amber-300">
                      {user.days_remaining != null ? `${user.days_remaining} days left to renew` : 'Active'}
                    </span>
                  </div>
                  {user.membership_expires_at && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Valid until:</span>
                      <span className="font-mono text-slate-200">
                        {new Date(user.membership_expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {onOpenMembership && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenMembership();
                      }}
                      className="w-full mt-2 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition active:scale-95"
                    >
                      Renew Early / View UPI QR
                    </button>
                  )}
                </div>
              ) : user.membership_status === 'pending' ? (
                <div className="space-y-2 text-xs text-slate-300">
                  <p className="text-[11px] text-amber-200">
                    Submitted UTR: <strong className="font-mono text-white">{user.last_payment_utr || 'Pending'}</strong>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Administrator Kalaga Pavan Kishore is verifying your ₹149 payment.
                  </p>
                  {onOpenMembership && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenMembership();
                      }}
                      className="w-full mt-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
                    >
                      View Payment Details
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <p className="text-[11px] text-slate-400">
                    Payment required to access the single scroll research feed.
                  </p>
                  {onOpenMembership && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenMembership();
                      }}
                      className="w-full mt-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md transition active:scale-95"
                    >
                      Pay ₹149 via UPI (9704875593@slc)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
