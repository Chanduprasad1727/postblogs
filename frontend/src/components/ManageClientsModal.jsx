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
  UserCheck
} from 'lucide-react';

export const ManageClientsModal = ({ isOpen, onClose, onClientDeleted }) => {
  const { token, isAdmin } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingClientId, setEditingClientId] = useState(null);
  const [editName, setEditName] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingClient, setDeletingClient] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
    } catch (err) {
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

  // Filter clients by search query
  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.full_name && c.full_name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  const totalVotesCast = clients.reduce((acc, c) => acc + (c.votes_count || 0), 0);

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
        className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  Client Management
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Sole Administrator control: View, edit, and delete client investor accounts.
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

        {/* Action & Stats Bar */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200/80 space-y-4">
          
          {/* Metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">Total Clients</span>
                <span className="text-lg font-black text-slate-900">{clients.length}</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Vote className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">Poll Votes Cast</span>
                <span className="text-lg font-black text-slate-900">{totalVotesCast}</span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">Sync Status</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Supabase Live</span>
                </span>
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

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients by full name or email address..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white shadow-xs"
            />
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
              <h4 className="text-sm font-bold text-slate-700">No client accounts found</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                {searchQuery
                  ? `No clients matched "${searchQuery}". Clear your search.`
                  : 'New investor sign-ups will automatically appear here for review and management.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClients.map((client) => {
                const isEditingThis = editingClientId === client.id;

                return (
                  <div
                    key={client.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left: Avatar & Details */}
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <img
                        src={client.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${client.email}`}
                        alt={client.full_name}
                        className="w-11 h-11 rounded-2xl border border-slate-200 bg-slate-50 object-cover shrink-0 shadow-xs"
                      />

                      <div className="min-w-0">
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
                            <span className="truncate max-w-[180px] sm:max-w-[240px]">{client.email}</span>
                          </span>

                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{formatDate(client.created_at)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Participation & Delete Action */}
                    <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
                      
                      {/* Poll Votes badge */}
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        <Vote className="w-3 h-3 text-emerald-600" />
                        <span>{client.votes_count || 0} votes cast</span>
                      </div>

                      {/* Delete Client Button */}
                      <button
                        onClick={() => setDeletingClient(client)}
                        title="Delete Client Account"
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 text-xs font-semibold transition active:scale-95 group"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500 group-hover:text-white" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Sole Admin Privilege: Changes are synchronized directly with Supabase.</span>
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
                  <li>All {deletingClient.votes_count || 0} poll votes cast by this client</li>
                  <li>Their access to the single scroll research feed</li>
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
