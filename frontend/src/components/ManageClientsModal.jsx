import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  X, 
  Search, 
  Trash2, 
  Edit3, 
  Check, 
  AlertTriangle, 
  Vote, 
  Mail, 
  Calendar, 
  RefreshCw,
  ShieldAlert,
  UserCheck,
  CreditCard,
  CheckCircle2,
  Clock,
  Copy,
  AlertCircle,
  PlusCircle,
  Sparkles
} from 'lucide-react';

export const ManageClientsModal = ({ isOpen, onClose, onClientDeleted, onClientUpdated }) => {
  const { 
    token, 
    isAdmin, 
    membershipSettings, 
    isFreeMode, 
    isPaidMode, 
    membershipFee, 
    updateMembershipSettings 
  } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'active', 'unpaid'

  // Membership Mode & Price Controls
  const [targetMode, setTargetMode] = useState(membershipSettings?.membership_mode || 'paid');
  const [targetFee, setTargetFee] = useState(membershipSettings?.membership_fee || 149);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  useEffect(() => {
    if (membershipSettings) {
      setTargetMode(membershipSettings.membership_mode || 'paid');
      setTargetFee(membershipSettings.membership_fee || 149);
    }
  }, [membershipSettings]);
  
  // Edit Name state
  const [editingClientId, setEditingClientId] = useState(null);
  const [editName, setEditName] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete State
  const [deletingClient, setDeletingClient] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Membership Action loading & feedback
  const [membershipActionLoadingId, setMembershipActionLoadingId] = useState(null);
  const [copiedUtrId, setCopiedUtrId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Save Membership Mode / Desired Price
  const handleSaveMembershipSettings = async (e) => {
    e?.preventDefault();
    setIsSavingSettings(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await updateMembershipSettings({
        membership_mode: targetMode,
        membership_fee: Number(targetFee)
      });
      setSettingsSavedSuccess(true);
      setTimeout(() => setSettingsSavedSuccess(false), 4000);
      setSuccessMsg(
        targetMode === 'free'
          ? 'Free Access Mode enabled! All clients now have direct unrestricted access without payment prompts.'
          : `Paid Membership Mode active! Membership price set to ₹${targetFee}/month.`
      );
      fetchClients();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update membership settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Fetch clients from API
  const fetchClients = async () => {
    if (!token || !isAdmin) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/clients', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      } else {
        const err = await res.json().catch(() => ({ detail: 'Failed to fetch clients' }));
        setErrorMsg(err.detail || 'Could not load client list');
      }
    } catch {
      setErrorMsg('Network error while loading clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      setErrorMsg('');
      setSuccessMsg('');
      setEditingClientId(null);
      setDeletingClient(null);
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  // Filter clients by search query & status filter
  const filteredClients = clients.filter((c) => {
    // Search query filter
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (c.full_name && c.full_name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.last_payment_utr && c.last_payment_utr.toLowerCase().includes(q))
    );
    if (!matchesSearch) return false;

    // Status filter
    const status = c.membership_status || 'unpaid';
    if (statusFilter === 'pending') return status === 'pending';
    if (statusFilter === 'active') return status === 'active';
    if (statusFilter === 'unpaid') return status === 'unpaid' || status === 'expired';
    return true;
  });

  const totalVotesCast = clients.reduce((acc, c) => acc + (c.votes_count || 0), 0);
  const pendingCount = clients.filter((c) => (c.membership_status || 'unpaid') === 'pending').length;
  const activeCount = clients.filter((c) => (c.membership_status || 'unpaid') === 'active').length;
  const unpaidCount = clients.filter((c) => ['unpaid', 'expired'].includes(c.membership_status || 'unpaid')).length;

  // Handle Edit Name
  const handleStartEdit = (client) => {
    setEditingClientId(client.id);
    setEditName(client.full_name || '');
    setErrorMsg('');
  };

  const handleSaveEdit = async (clientId) => {
    if (!editName.trim()) {
      setErrorMsg('Client name cannot be empty');
      return;
    }
    setIsSavingEdit(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ full_name: editName.trim() })
      });

      if (res.ok) {
        const updated = await res.json();
        setClients((prev) =>
          prev.map((c) => (c.id === clientId ? { ...c, full_name: updated.full_name } : c))
        );
        setEditingClientId(null);
        setSuccessMsg(`Updated name for ${updated.email}`);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const err = await res.json().catch(() => ({ detail: 'Update failed' }));
        setErrorMsg(err.detail || 'Failed to update client');
      }
    } catch {
      setErrorMsg('Network error updating client');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Membership Actions (approve, extend, reject)
  const handleMembershipAction = async (client, action, days = 30) => {
    setMembershipActionLoadingId(client.id);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/membership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, days })
      });

      const data = await res.json();
      if (res.ok) {
        setClients((prev) =>
          prev.map((c) => (c.id === client.id ? { ...c, ...data.client } : c))
        );
        setSuccessMsg(data.message || `Membership updated for ${client.full_name}`);
        setTimeout(() => setSuccessMsg(''), 4000);
        if (onClientUpdated) onClientUpdated(client.id);
      } else {
        setErrorMsg(data.detail || 'Failed to update membership');
      }
    } catch {
      setErrorMsg('Network error updating membership');
    } finally {
      setMembershipActionLoadingId(null);
    }
  };

  // Copy UTR Number
  const handleCopyUtr = (clientId, utr) => {
    if (!utr) return;
    navigator.clipboard.writeText(utr);
    setCopiedUtrId(clientId);
    setTimeout(() => setCopiedUtrId(null), 3000);
  };

  // Handle Delete Client
  const handleConfirmDelete = async () => {
    if (!deletingClient) return;
    setIsDeleting(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/clients/${deletingClient.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setClients((prev) => prev.filter((c) => c.id !== deletingClient.id));
        setSuccessMsg(data.message || `Client ${deletingClient.full_name} deleted`);
        setTimeout(() => setSuccessMsg(''), 4000);
        if (onClientDeleted) onClientDeleted(deletingClient.id);
        setDeletingClient(null);
      } else {
        const err = await res.json().catch(() => ({ detail: 'Delete failed' }));
        setErrorMsg(err.detail || 'Could not delete client');
      }
    } catch {
      setErrorMsg('Network error while deleting client');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div 
        className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  Client & Membership Management
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full">
                  Sole Admin Panel
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Configure Free vs Paid access, set membership pricing, verify UPI payments, and manage investors.
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

        {/* Membership Mode & Pricing Configuration (Sole Admin Only) */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 text-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-extrabold text-white">Platform Access & Membership Mode</h4>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                  targetMode === 'free' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {targetMode === 'free' ? 'Free Access Mode' : `Paid Mode (₹${targetFee}/mo)`}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {targetMode === 'free'
                  ? 'All clients have direct unrestricted access. Payment details, UPI QR codes, and renewal notices are hidden from all clients.'
                  : `Clients must pay ₹${targetFee} via UPI to unlock research. Active clients see renewal countdowns.`}
              </p>
            </div>

            {/* Mode Selector Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setTargetMode('free')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  targetMode === 'free'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Free Access
              </button>
              <button
                type="button"
                onClick={() => setTargetMode('paid')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  targetMode === 'paid'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Paid Membership
              </button>
            </div>
          </div>

          {/* Mode-specific Pricing Controls */}
          {targetMode === 'paid' ? (
            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <label className="text-xs font-bold text-slate-200 block">
                    Desired Membership Cost (₹ / Month)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Clients will scan UPI QR and pay this custom amount to unlock
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={targetFee}
                    onChange={(e) => setTargetFee(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="149"
                  />
                </div>

                <button
                  type="button"
                  disabled={isSavingSettings || (membershipSettings?.membership_mode === targetMode && membershipSettings?.membership_fee === Number(targetFee))}
                  onClick={handleSaveMembershipSettings}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
                >
                  {isSavingSettings ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : settingsSavedSuccess ? (
                    <Check className="w-3.5 h-3.5 text-slate-950" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{settingsSavedSuccess ? 'Saved!' : 'Save Pricing'}</span>
                </button>
              </div>
            </div>
          ) : (
            targetMode !== membershipSettings?.membership_mode && (
              <div className="flex items-center justify-between p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300">
                <span>Free Access Mode selected. Click below to apply.</span>
                <button
                  type="button"
                  disabled={isSavingSettings}
                  onClick={handleSaveMembershipSettings}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center space-x-1"
                >
                  {isSavingSettings && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Apply Free Mode</span>
                </button>
              </div>
            )
          )}
        </div>

        {/* Action & Stats Bar */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200/80 space-y-4">
          
          {/* Pending Verification Notice Banner (Only relevant in Paid Mode) */}
          {targetMode === 'paid' && pendingCount > 0 && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-400/40 rounded-2xl flex items-center justify-between gap-3 text-amber-900 animate-in fade-in">
              <div className="flex items-center space-x-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <span className="text-xs font-bold">
                  {pendingCount} client{pendingCount > 1 ? 's are' : ' is'} waiting for ₹{targetFee} payment verification!
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition shadow-xs"
              >
                Review Pending
              </button>
            </div>
          )}

          {/* Metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">Total Clients</span>
                <span className="text-lg font-black text-slate-900">{clients.length}</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">
                  {targetMode === 'paid' ? `Pending (₹${targetFee})` : 'Free Mode'}
                </span>
                <span className="text-lg font-black text-amber-700">
                  {targetMode === 'paid' ? pendingCount : 'Active'}
                </span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">
                  {targetMode === 'paid' ? 'Active Paid' : 'Free Access'}
                </span>
                <span className="text-lg font-black text-emerald-700">
                  {targetMode === 'paid' ? activeCount : clients.length}
                </span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">Poll Votes Cast</span>
                <span className="text-lg font-black text-slate-900">{totalVotesCast}</span>
              </div>
              <button
                onClick={fetchClients}
                disabled={loading}
                title="Refresh Clients List"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filter Pills & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Filter Pills */}
            <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                All ({clients.length})
              </button>
              
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center space-x-1.5 ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-300'
                }`}
              >
                <span>Pending Approval</span>
                {pendingCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  statusFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200'
                }`}
              >
                Active ({activeCount})
              </button>

              <button
                onClick={() => setStatusFilter('unpaid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  statusFilter === 'unpaid'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-red-50 border border-slate-200'
                }`}
              >
                Unpaid / Expired ({unpaidCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, email, or UTR..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white shadow-xs"
              />
            </div>

          </div>

          {/* Notifications */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

        </div>

        {/* Client List Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-slate-100">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-500">Loading client registry from Supabase...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-14 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 p-8">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">No client accounts match this view</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try clearing your search or switching to "All" clients filter.'
                  : targetMode === 'free'
                    ? 'New investor sign-ups will appear here with instant free access.'
                    : `New investor sign-ups will appear here for review and ₹${targetFee} verification.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredClients.map((client) => {
                const isEditingThis = editingClientId === client.id;
                const status = client.membership_status || 'unpaid';
                const isPending = status === 'pending';
                const isActive = status === 'active';
                const isExpired = status === 'expired';
                const isActionLoading = membershipActionLoadingId === client.id;

                return (
                  <div
                    key={client.id}
                    className={`p-4 bg-white rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isPending 
                        ? 'border-amber-300 bg-amber-50/20 shadow-xs' 
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Left: Avatar & Personal Details */}
                    <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                      <img
                        src={client.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${client.email}`}
                        alt={client.full_name}
                        className="w-11 h-11 rounded-2xl border border-slate-200 bg-slate-50 object-cover shrink-0 shadow-xs mt-0.5"
                      />

                      <div className="min-w-0 flex-1">
                        {isEditingThis ? (
                          <div className="flex items-center space-x-2 my-1">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="px-2.5 py-1 text-xs border border-amber-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEdit(client.id)}
                              disabled={isSavingEdit}
                              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                              title="Save Name"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingClientId(null)}
                              className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {client.full_name}
                            </h4>
                            <button
                              onClick={() => handleStartEdit(client)}
                              title="Edit Client Name"
                              className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-amber-50 transition"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-[11px] text-slate-500">
                          <span className="flex items-center space-x-1">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[170px] sm:max-w-[220px]">{client.email}</span>
                          </span>

                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>Joined {formatDate(client.created_at)}</span>
                          </span>

                          <span className="flex items-center space-x-1">
                            <Vote className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{client.votes_count || 0} votes</span>
                          </span>
                        </div>

                        {/* UTR / Transaction verification row if available */}
                        {client.last_payment_utr && (
                          <div className="mt-2 flex items-center space-x-2 text-[11px] bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200 w-fit">
                            <span className="font-semibold text-slate-600">UPI Ref / UTR:</span>
                            <span className="font-mono font-bold text-slate-900">{client.last_payment_utr}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyUtr(client.id, client.last_payment_utr)}
                              title="Copy UTR number"
                              className="p-1 hover:text-amber-600 text-slate-400 transition"
                            >
                              {copiedUtrId === client.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Right: Membership Status & Admin Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      
                      {/* Membership Status Pill */}
                      <div>
                        {targetMode === 'free' ? (
                          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Free Access</span>
                          </div>
                        ) : isPending ? (
                          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                            <span>Pending ₹{targetFee}</span>
                          </div>
                        ) : isActive ? (
                          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>
                              Active {client.days_remaining != null ? `(${client.days_remaining}d)` : ''}
                            </span>
                          </div>
                        ) : isExpired ? (
                          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs font-bold">
                            <AlertCircle className="w-3.5 h-3.5 text-red-700" />
                            <span>Expired</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
                            <span>Unpaid</span>
                          </div>
                        )}
                      </div>

                      {/* Membership Action Buttons */}
                      <div className="flex items-center space-x-2">
                        {isPending ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleMembershipAction(client, 'approve', 30)}
                              disabled={isActionLoading}
                              title="Verify payment and activate 30-day membership"
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 flex items-center space-x-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve (30d)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMembershipAction(client, 'reject')}
                              disabled={isActionLoading}
                              title="Reject invalid payment UTR"
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 rounded-xl text-xs font-semibold transition"
                            >
                              Reject
                            </button>
                          </>
                        ) : isActive ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleMembershipAction(client, 'extend', 30)}
                              disabled={isActionLoading}
                              title="Extend membership by another 30 days"
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition active:scale-95"
                            >
                              +30 Days
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMembershipAction(client, 'reset')}
                              disabled={isActionLoading}
                              title="Reset membership to unpaid"
                              className="px-2 py-1.5 text-slate-400 hover:text-red-600 text-[11px] font-semibold"
                            >
                              Revoke
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMembershipAction(client, 'approve', 30)}
                            disabled={isActionLoading}
                            title="Manually grant 30-day membership"
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95"
                          >
                            Grant Access
                          </button>
                        )}

                        {/* Delete Client */}
                        <button
                          type="button"
                          onClick={() => setDeletingClient(client)}
                          title="Delete Client Account"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          {targetMode === 'free' ? (
            <span className="text-emerald-700 font-medium">Platform Mode: <strong>Free Access</strong> (Payment prompts disabled for clients)</span>
          ) : (
            <span>Official Payee UPI ID: <strong className="font-mono text-slate-800">9704875593@slc</strong> (₹{targetFee} / mo)</span>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
          >
            Close Panel
          </button>
        </div>

      </div>

      {/* Delete Confirmation Modal Overlay */}
      {deletingClient && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h4 className="text-base font-extrabold text-slate-900">
                Confirm Client Account Deletion
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900">{deletingClient.full_name}</strong>{' '}
                (<span className="text-slate-700 font-mono text-[11px]">{deletingClient.email}</span>)?
              </p>
              <div className="p-3 bg-red-50 rounded-xl text-[11px] text-red-800 text-left space-y-1 border border-red-200/80 mt-2">
                <p className="font-bold">This will permanently remove:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Client profile and account login credentials</li>
                  <li>Their membership records and UTR payment references</li>
                  <li>All {deletingClient.votes_count || 0} poll votes cast by this client</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingClient(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 transition flex items-center justify-center space-x-1.5"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
