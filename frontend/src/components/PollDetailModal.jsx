import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  BarChart3, 
  CheckCircle2, 
  Loader2, 
  BookOpen, 
  Users, 
  Sparkles,
  Lock
} from 'lucide-react';

export const PollDetailModal = ({ poll, isOpen, onClose, onVoteSuccess }) => {
  const { user, token } = useAuth();
  const [selectedOption, setSelectedOption] = useState(poll?.user_voted_option_id || '');
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !poll) return null;

  const hasVoted = Boolean(poll.user_voted_option_id);

  const handleVote = async (optionId) => {
    if (!token) {
      setError('Please sign in to participate in the poll.');
      return;
    }
    setError('');
    setVoting(true);
    setSelectedOption(optionId);

    try {
      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ option_id: optionId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to submit vote');
      }
      if (onVoteSuccess) {
        onVoteSuccess(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-emerald-50/50 to-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Community Poll
                </span>
                {poll.post_title && (
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <BookOpen className="w-3 h-3 inline mr-1" />
                    <span>Blog Story Poll</span>
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">
                {poll.question}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Description Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Poll Background & Description</span>
            </h5>
            <p className="text-sm text-slate-700 leading-relaxed">
              {poll.description || "Share your opinion by casting a vote below. Results update in real-time."}
            </p>
            {poll.post_title && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200 text-xs text-slate-500 flex items-center space-x-1.5">
                <span className="font-semibold text-slate-700">Attached to story:</span>
                <span className="italic truncate text-slate-600">"{poll.post_title}"</span>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* Options & Voting */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Cast Your Vote:
              </span>
              <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
                <Users className="w-3.5 h-3.5" />
                <span>{poll.total_votes} total {poll.total_votes === 1 ? 'vote' : 'votes'}</span>
              </span>
            </div>

            <div className="space-y-3">
              {poll.options.map((option) => {
                const isVoted = poll.user_voted_option_id === option.id;

                return (
                  <div
                    key={option.id}
                    onClick={() => !voting && handleVote(option.id)}
                    className={`relative overflow-hidden cursor-pointer rounded-2xl border-2 transition-all p-4 flex items-center justify-between ${
                      isVoted
                        ? 'border-emerald-500 bg-emerald-50/60 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {/* Animated Percentage Fill Bar */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 transition-all duration-700 ease-out ${
                        isVoted ? 'bg-emerald-200/50' : 'bg-slate-100'
                      }`}
                      style={{ width: `${option.percentage}%` }}
                    />

                    {/* Option Details */}
                    <div className="relative z-10 flex items-center space-x-3.5 pr-4">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                          isVoted
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isVoted && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-sm ${isVoted ? 'font-bold text-emerald-950' : 'font-semibold text-slate-800'}`}>
                        {option.text}
                      </span>
                    </div>

                    {/* Percentage & Vote Count */}
                    <div className="relative z-10 flex items-center space-x-3 text-right">
                      <span className={`text-sm font-extrabold ${isVoted ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {option.percentage}%
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        ({option.vote_count})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            {hasVoted ? (
              <span className="text-emerald-700 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>You voted in this poll (click another option to change)</span>
              </span>
            ) : (
              <span>Click any option above to cast your vote</span>
            )}
            {voting && (
              <span className="flex items-center space-x-1 text-emerald-600 ml-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Updating live results...</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
