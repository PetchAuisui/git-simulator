import { useState } from 'react';
import { gitApi } from '../api';
import { toast } from 'react-hot-toast';
import { CheckSquare, Square, GitCommit, FileText, GitBranch, RefreshCw, Plus, Minus } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function GitPanel({ gitStatus, refreshStatus }) {
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);

  // Group files by status for UI presentation
  const stagedFiles = gitStatus?.staged || [];
  const modifiedFiles = gitStatus?.modified?.filter(f => !stagedFiles.includes(f)) || [];
  const untrackedFiles = gitStatus?.untracked?.filter(f => !stagedFiles.includes(f)) || [];

  const handleStage = async (file) => {
    try {
      await gitApi.add([file]);
      refreshStatus();
    } catch (e) {
      toast.error('Failed to stage file');
    }
  };

  const handleUnstage = async (file) => {
    try {
      await gitApi.unstage([file]);
      refreshStatus();
    } catch (e) {
      toast.error('Failed to unstage file');
    }
  };

  const handleStageAll = async () => {
    try {
      await gitApi.add(['.']);
      refreshStatus();
    } catch (e) {
      toast.error('Failed to stage all files');
    }
  };

  const handleCommit = async (e) => {
    e.preventDefault();
    if (!commitMessage.trim()) {
      toast.error('Please enter a commit message');
      return;
    }
    if (stagedFiles.length === 0) {
      toast.error('No files staged for commit');
      return;
    }

    setIsCommitting(true);
    try {
      await gitApi.commit(commitMessage);
      toast.success('Committed successfully!');
      setCommitMessage('');
      refreshStatus();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Commit failed');
    } finally {
      setIsCommitting(false);
    }
  };

  const FileItemRow = ({ file, onAction, actionIcon, tooltip, colorClass }) => (
    <div className="flex items-center justify-between group hover:bg-slate-800/80 px-2 py-1.5 rounded transition-colors text-sm border-l-2 border-transparent hover:border-slate-500">
      <div className="flex items-center gap-2 truncate">
        <FileText size={14} className={colorClass} />
        <span className="truncate text-slate-300">{file}</span>
      </div>
      <button 
        onClick={() => onAction(file)} 
        title={tooltip}
        className="opacity-0 group-hover:opacity-100 p-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-all transform hover:scale-110 active:scale-95"
      >
        {actionIcon}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-6">
      
      {/* Visual Branch / Status Header */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex align-center justify-between shadow-inner">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg border border-slate-700">
              <GitBranch className="text-git-primary" size={20} />
            </div>
            <div>
               <div className="text-xs text-slate-400 font-medium">CURRENT BRANCH</div>
               <div className="font-mono text-emerald-400 font-bold">{gitStatus?.currentBranch || 'main'}</div>
            </div>
         </div>
         <button onClick={refreshStatus} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors self-center" title="Refresh Git Status">
            <RefreshCw size={18} />
         </button>
      </div>

      {/* Changes Tracker */}
      <div className="flex-1 overflow-auto flex flex-col gap-4 pr-2 custom-scrollbar">

        {/* Staged Changes */}
        <div>
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-emerald-900/50">
            <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare size={14} /> Staged Changes ({stagedFiles.length})
            </h3>
          </div>
          {stagedFiles.length === 0 ? (
            <div className="text-xs text-slate-500 italic pl-2">No staged changes</div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {stagedFiles.map((file) => (
                <FileItemRow 
                  key={file} 
                  file={file} 
                  onAction={handleUnstage} 
                  actionIcon={<Minus size={14} className="text-red-400" />} 
                  tooltip="Unstage file"
                  colorClass="text-emerald-400"
                />
              ))}
            </div>
          )}
        </div>

        {/* Unstaged Changes (Modified) */}
        <div>
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-orange-900/50 mt-4">
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <Square size={14} /> Modified Files ({modifiedFiles.length})
            </h3>
            {modifiedFiles.length > 0 && (
               <button onClick={handleStageAll} className="text-[10px] uppercase font-bold text-slate-400 hover:text-white bg-slate-800 px-2 py-0.5 rounded transition-colors">Stage All</button>
            )}
          </div>
          {modifiedFiles.length === 0 && untrackedFiles.length === 0 ? (
            <div className="text-xs text-slate-500 italic pl-2">No modifications</div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {modifiedFiles.map((file) => (
                <FileItemRow 
                  key={file} 
                  file={file} 
                  onAction={handleStage} 
                  actionIcon={<Plus size={14} className="text-emerald-400" />} 
                  tooltip="Stage file"
                  colorClass="text-orange-400"
                />
              ))}
              
              {/* Untracked */}
              {untrackedFiles.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-800 border-dashed">
                  <h4 className="text-[10px] text-slate-500 mb-1 pl-1 uppercase font-bold tracking-wide">Untracked</h4>
                  {untrackedFiles.map((file) => (
                    <FileItemRow 
                      key={file} 
                      file={file} 
                      onAction={handleStage} 
                      actionIcon={<Plus size={14} className="text-emerald-400" />} 
                      tooltip="Stage file"
                      colorClass="text-slate-500"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Commit Box */}
      <form onSubmit={handleCommit} className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-git-primary group-focus-within:bg-git-secondary transition-colors"></div>
        <textarea
          placeholder="Commit message..."
          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-git-primary focus:ring-1 focus:ring-git-primary transition-all resize-none mb-3 placeholder:text-slate-500 font-medium"
          rows={3}
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          disabled={isCommitting}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isCommitting || stagedFiles.length === 0 || !commitMessage.trim()}
            className={twMerge(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all",
              stagedFiles.length === 0 || !commitMessage.trim()
                ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                : "bg-git-primary hover:bg-git-secondary text-white shadow-[0_0_15px_rgba(241,78,50,0.3)] hover:shadow-[0_0_20px_rgba(241,78,50,0.5)] transform hover:-translate-y-0.5 active:translate-y-0"
            )}
          >
            <GitCommit size={16} />
            {isCommitting ? 'Committing...' : 'Commit Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
