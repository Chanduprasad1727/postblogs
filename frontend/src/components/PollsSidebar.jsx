import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  Plus, 
  Users, 
  Vote,
  Clock
} from 'lucide-react';

export const PollsSidebar = ({ polls, onSelectPoll, onOpenCreatePoll, onOpenManageClients }) => {
  const { user, isAdmin } = useAuth();
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'voted'

  const filteredPolls = polls.filter((poll) => {
    if (filter === 'voted') return Boolean(poll.user_voted_option_id);
    if (filter === 'pending') return !poll.user_voted_option_id;
    return true;
  });

  return (
    <aside className="w-full lg:w-80 shrink-0">
      <div className="sticky top-20 space-y-4">
        
        {/* Sidebar Header Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                  Kalaga Wealth Polls
                </h3>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-block border border-amber-200">
                  ● Investor Sentiment
                </span>
              </div>
            </div>

            {/* Admin quick actions: manage clients & add poll */}
            {isAdmin && (
              <div className="flex items-center space-x-1.5">
                {onOpenManageClients && (
                  <button
                    onClick={onOpenManageClients}
                    title="Manage Clients (Admin)"
                    className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-xs transition active:scale-95"
                  >
                    <Users className="w-4 h-4 text-amber-600" />
                  </button>
                )}
                {onOpenCreatePoll && (
                  <button
                    onClick={onOpenCreatePoll}
                    title="Create a new Poll (Admin)"
                    className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Click any poll to open description, see real-time community results, and vote.
          </p>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-1.5 rounded-lg transition text-[11px] ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({polls.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`flex-1 py-1.5 rounded-lg transition text-[11px] ${
                filter === 'pending'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('voted')}
              className={`flex-1 py-1.5 rounded-lg transition text-[11px] ${
                filter === 'voted'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Voted
            </button>
          </div>

        </div>

        {/* List of Polls in Sidebar */}
        <div className="space-y-3">
          {filteredPolls.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 text-center border border-slate-200/80 shadow-sm">
              <Vote className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No polls in this filter</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {filter === 'pending' ? 'You have voted in all active polls!' : 'Check back soon for new polls.'}
              </p>
            </div>
          ) : (
            filteredPolls.map((poll) => {
              const hasVoted = Boolean(poll.user_voted_option_id);
              // Find leading option
              const leadingOpt = poll.options.reduce((prev, current) => 
                (prev.vote_count > current.vote_count) ? prev : current, poll.options[0] || {}
              );

              return (
                <div
                  key={poll.id}
                  onClick={() => onSelectPoll(poll)}
                  className="group bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-emerald-500/80 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                >
                  {/* Subtle top indicator bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${hasVoted ? 'bg-emerald-500' : 'bg-slate-200 group-hover:bg-emerald-400'} transition`} />

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {poll.post_title ? 'Attached to Blog' : 'General Topic'}
                    </span>
                    {hasVoted ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Voted</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        <span>Vote Now</span>
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition leading-snug line-clamp-2 mb-2.5">
                    {poll.question}
                  </h4>

                  {/* Leading option preview */}
                  {leadingOpt && poll.total_votes > 0 && (
                    <div className="mb-3 bg-slate-50 p-2 rounded-xl text-[11px] border border-slate-100">
                      <div className="flex items-center justify-between text-slate-600 mb-1">
                        <span className="truncate max-w-[170px] font-medium">{leadingOpt.text}</span>
                        <span className="font-bold text-slate-900">{leadingOpt.percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${leadingOpt.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer info & CTA */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <span className="text-slate-400 text-[11px] flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'}</span>
                    </span>
                    <span className="font-bold text-emerald-700 group-hover:translate-x-0.5 transition flex items-center text-[11px]">
                      <span>Open Poll</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </aside>
  );
};
