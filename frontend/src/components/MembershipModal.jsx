import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Check, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  TrendingUp, 
  ArrowRight,
  CreditCard,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const MembershipModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, token, refreshUser, isFreeMode, isPaidMode, membershipFee, membershipSettings } = useAuth();
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const upiId = membershipSettings?.upi_id || '9704875593@slc';
  const payeeName = membershipSettings?.payee_name || 'Kalaga Wealth';
  const amount = String(membershipFee || 149);
  const note = `Monthly Membership ₹${amount}`;

  // Standard UPI URI
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 4) {
      setErrorMsg('Please enter a valid UPI Reference / UTR Number (usually 12 digits).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/membership/submit-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          utr_number: cleanUtr,
          amount: Number(amount),
          upi_id: upiId
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Payment submitted! Administrator Kalaga Pavan Kishore will verify your UTR and activate your membership.');
        setUtrNumber('');
        if (refreshUser) await refreshUser();
        if (onSuccess) onSuccess(data);
      } else {
        setErrorMsg(data.detail || 'Failed to submit payment verification.');
      }
    } catch {
      setErrorMsg('Network error while submitting payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const status = user?.membership_status || 'unpaid';
  const isPending = status === 'pending';
  const isActive = status === 'active';
  const isExpired = status === 'expired';

  const formatExpiry = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  if (isFreeMode) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
        <div 
          className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  Free Investor Access
                </h3>
                <p className="text-xs text-emerald-400 font-semibold">
                  Complimentary Research Access
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-slate-900">
                Direct Unrestricted Access Active
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Kalaga Wealth platform is currently in Free Access Mode. You have full complimentary access to all market research briefs, financial models, and community polls without any membership fee.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition active:scale-95"
            >
              Continue to Research Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-amber-500/20">
              ₹
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  Kalaga Wealth Membership
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full">
                  ₹{amount} / Month
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Unlock exclusive research briefs, video commentaries & investor surveys.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Active Status Banner */}
          {isActive && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-3 text-xs text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm text-emerald-800">Your Monthly Membership is Active!</p>
                <p className="text-slate-600 mt-0.5">
                  You have full unlimited access to the single scroll feed and private community polls.
                  {user.membership_expires_at && (
                    <span className="block font-semibold mt-1">
                      Valid through: <span className="text-emerald-700">{formatExpiry(user.membership_expires_at)}</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Pending Status Banner */}
          {isPending && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-xs text-amber-900">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="font-extrabold text-sm text-amber-800">Payment Verification in Progress</p>
                <p className="text-slate-600 mt-0.5">
                  Your payment submission with UTR <strong className="font-mono text-slate-800">{user.last_payment_utr}</strong> is pending review by Sole Administrator <strong>Kalaga Pavan Kishore</strong>.
                </p>
                <p className="text-amber-800 text-[11px] font-semibold mt-1.5">
                  Approval usually takes just a few minutes. You may submit an updated UTR below if needed.
                </p>
              </div>
            </div>
          )}

          {/* Expired Status Banner */}
          {isExpired && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-xs text-red-900">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm text-red-800">Membership Expired</p>
                <p className="text-slate-600 mt-0.5">
                  Your 30-day membership has completed. Please scan and pay ₹{amount} below to renew your access for the upcoming month.
                </p>
              </div>
            </div>
          )}

          {/* Value Proposition Pills */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center space-x-2.5">
              <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium text-slate-700">Macro Wealth Briefs</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-medium text-slate-700">Private Community Polls</span>
            </div>
          </div>

          {/* Payment Card & QR Code Box */}
          <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center gap-6">
              
              {/* Dynamic Crisp UPI QR Code */}
              <div className="bg-white p-3 rounded-2xl shadow-xl border-4 border-amber-400 shrink-0 flex flex-col items-center">
                <QRCodeSVG
                  value={upiLink}
                  size={155}
                  level="H"
                  includeMargin={false}
                />
                <span className="text-[10px] font-black text-slate-900 mt-1 tracking-wider uppercase">
                  Scan & Pay ₹{amount}
                </span>
              </div>

              {/* Payment Details & Quick Actions */}
              <div className="space-y-3.5 text-center sm:text-left flex-1 min-w-0">
                <div>
                  <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase block">
                    Step 1: Scan QR or Transfer via UPI
                  </span>
                  <h4 className="text-xl font-black text-white mt-0.5">
                    ₹{amount} <span className="text-xs font-normal text-slate-300">/ monthly membership</span>
                  </h4>
                </div>

                {/* UPI ID Pill with Copy button */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between space-x-2">
                  <div className="min-w-0 text-left">
                    <span className="text-[10px] text-slate-400 block font-medium">Official UPI ID</span>
                    <span className="text-xs font-mono font-bold text-amber-300 truncate block">
                      {upiId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition active:scale-95 flex items-center space-x-1 text-[11px] font-semibold shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Mobile Intent link button */}
                <a
                  href={upiLink}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition active:scale-95"
                >
                  <span>Pay via UPI App</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <p className="text-[10px] text-slate-400">
                  Supported: PhonePe, Google Pay, Paytm, BHIM, Cred, Navi, Amazon Pay & any banking app.
                </p>
              </div>

            </div>
          </div>

          {/* Step 2: Submit UTR / Reference Form */}
          <form onSubmit={handleSubmitPayment} className="space-y-3.5 pt-1">
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1 mb-1">
                <span>Step 2: Enter UPI Transaction Reference / UTR Number</span>
                <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                After completing the ₹{amount} payment in your UPI app, copy the 12-digit UTR / UPI Reference No. from the receipt and paste it here for instant verification.
              </p>
              
              <div className="relative">
                <input
                  type="text"
                  required
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 432198765432 or UPI transaction ID"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50/50"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition active:scale-95 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Verification...</span>
                </>
              ) : (
                <>
                  <span>Submit Payment Verification (₹{amount})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sole Admin Verification: Kalaga Pavan Kishore</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-700 hover:text-slate-900"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
