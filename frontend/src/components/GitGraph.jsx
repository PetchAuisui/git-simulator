import React from 'react';
import { GitCommit, User, Calendar, Hash } from 'lucide-react';

export default function GitGraph({ commits }) {
  if (!commits || commits.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800/50 border-dashed m-4">
        <GitCommit size={48} className="mb-4 opacity-20" />
        <p className="text-sm">No commit history yet.</p>
        <p className="text-xs mt-2 text-slate-600 font-mono italic">Make your first commit to see the graph!</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-6 border-b border-slate-800/50 pb-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="p-1 px-1.5 bg-orange-500/10 text-orange-400 rounded-md border border-orange-500/20 shadow-sm shadow-orange-500/10">GRAPH</span> 
            VISUAL COMMIT LOG
        </h3>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700/50">
            {commits.length} COMMITS
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 relative">
        {/* The Vertical Connection Line */}
        <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-orange-500 via-rose-500 to-slate-800 opacity-20 hidden md:block"></div>

        {commits.map((commit, index) => (
          <div key={commit.hash} className="relative group pl-2 md:pl-10 transition-all">
            {/* The Dot */}
            <div className={`absolute left-[22px] top-2 w-3 h-3 rounded-full border-2 border-slate-900 transition-all duration-300 group-hover:scale-125 z-10 hidden md:block ${
                index === 0 ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]" : "bg-slate-700"
            }`}></div>

            {/* The Card */}
            <div className={`p-4 rounded-xl border transition-all duration-500 hover:shadow-xl group-hover:border-slate-600/50 ${
                index === 0 ? "bg-slate-800/80 border-slate-700 shadow-lg shadow-orange-500/5" : "bg-slate-900/40 border-slate-800/50"
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        index === 0 ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "bg-slate-800 border-slate-700 text-slate-500"
                    }`}>
                      {commit.hash.substring(0, 7)}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <User size={12} className="opacity-50"/>
                        {commit.author_name}
                    </div>
                  </div>
                  <h4 className={`text-sm font-bold mb-2 ${index === 0 ? "text-slate-100" : "text-slate-300"}`}>
                    {commit.message}
                  </h4>
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 opacity-60">
                    <Calendar size={12}/>
                    {new Date(commit.date).toLocaleDateString()}
                </div>
              </div>
              
              {index === 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700/50 flex gap-4">
                   <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold opacity-80">LATEST COMMIT</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
