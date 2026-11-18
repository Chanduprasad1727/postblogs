import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart3, CheckCircle2, Loader2 } from 'lucide-react';

export const PollWidget = ({ poll, onVoteSuccess }) => {
  const { user, token } = useAuth();
  const [selectedOption, setSelectedOption] = useState(poll.user_voted_option_id || '');
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');

  if (!poll || !poll.options || poll.options.length === 0) return null;

  const hasVoted = Boolean(poll.user_voted_option_id);

  const handleVote = async (optionId) => {
    if (!token) {
      setError('Please sign in to vote.');
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
    <div className="mt-5 p-5 bg-gradient-to-br from-slate-50 to-slate-100/70 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm tracking-wide">
          <BarChart3 className="w-4 h-4 text-emerald-600" />
          <span>COMMUNITY POLL</span>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'}
        </span>
      </div>

      <h4 className="text-base font-semibold text-slate-900 mb-4">
        {poll.question}
      </h4>

      {error && (
        <div className="mb-3 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-2.5">
        {poll.options.map((option) => {
          const isVoted = poll.user_voted_option_id === option.id;
          const isSelected = selectedOption === option.id;

          return (
            <div
              key={option.id}
              onClick={() => !voting && handleVote(option.id)}
              className={`relative overflow-hidden cursor-pointer rounded-xl border transition-all p-3.5 flex items-center justify-between ${
                isVoted
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
              }`}
            >
              {/* Progress Bar Background fill */}
              <div
                className={`absolute left-0 top-0 bottom-0 transition-all duration-700 ease-out ${
                  isVoted ? 'bg-emerald-100/80' : 'bg-slate-100/90'
                }`}
                style={{ width: `${option.percentage}%` }}
              />

              {/* Option Text */}
              <div className="relative z-10 flex items-center space-x-3 pr-4">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                    isVoted
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : isSelected
                      ? 'border-emerald-500 bg-emerald-100'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isVoted && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-sm ${isVoted ? 'font-bold text-emerald-950' : 'font-medium text-slate-800'}`}>
                  {option.text}
                </span>
              </div>

              {/* Percentage & Vote Count */}
              <div className="relative z-10 flex items-center space-x-2 text-right">
                <span className="text-xs font-bold text-slate-700">
                  {option.percentage}%
                </span>
                <span className="text-xs text-slate-400">
                  ({option.vote_count})
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>
          {hasVoted ? '✓ Your vote is recorded' : 'Click an option to cast your vote'}
        </span>
        {voting && (
          <span className="flex items-center space-x-1 text-emerald-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Submitting...</span>
          </span>
        )}
      </div>
    </div>
  );
};
