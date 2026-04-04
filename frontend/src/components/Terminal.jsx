import { useState, useRef, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';

export default function Terminal({ workingPath, onClose, refreshStatus, onRepoInitialized }) {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Commit message prompt mode
  const [awaitingCommitMsg, setAwaitingCommitMsg] = useState(false);
  const [commitMsg, setCommitMsg] = useState('');
  const commitMsgRef = useRef(null);
  const inputRef = useRef(null);

  const outputEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  // Focus commit message input when prompt appears
  useEffect(() => {
    if (awaitingCommitMsg) {
      setTimeout(() => commitMsgRef.current?.focus(), 50);
    } else {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [awaitingCommitMsg]);

  // ─── Execute a real command via backend ─────────────────────────────────
  const runCommand = async (cmd) => {
    setIsLoading(true);
    try {
      const response = await api.post('/terminal/execute', {
        command: cmd,
        workingPath: workingPath,
      });

      if (response.data.output) {
        setOutput(prev => [...prev, { type: 'output', text: response.data.output }]);
      }

      if (!response.data.success && response.data.error) {
        setOutput(prev => [...prev, { type: 'error', text: response.data.error }]);
      }

      // Refresh git status after any git command
      if (cmd.startsWith('git ') && refreshStatus) {
        setTimeout(() => refreshStatus(), 300);
      }

      if (cmd === 'git init' && response.data.success) {
        toast.success('Git repository initialized!');
        if (onRepoInitialized) onRepoInitialized();
      }

      if (cmd.startsWith('git commit') && response.data.success) {
        toast.success('Committed!');
      }
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Command failed';
      setOutput(prev => [...prev, { type: 'error', text: msg }]);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Submit normal command ───────────────────────────────────────────────
  const handleCommandSubmit = async (e) => {
    e.preventDefault();
    const cmd = command.trim();
    if (!cmd) return;

    setCommand('');
    setOutput(prev => [...prev, { type: 'input', text: cmd }]);

    // Detect bare `git commit` (no -m flag) → switch to prompt mode
    if (/^git\s+commit\s*$/.test(cmd)) {
      setOutput(prev => [...prev, {
        type: 'prompt',
        text: 'Enter commit message (press Enter to confirm, Escape to cancel):',
      }]);
      setAwaitingCommitMsg(true);
      return;
    }

    await runCommand(cmd);
  };

  // ─── Submit commit message ───────────────────────────────────────────────
  const handleCommitMsgSubmit = async (e) => {
    e.preventDefault();
    const msg = commitMsg.trim();
    setCommitMsg('');
    setAwaitingCommitMsg(false);

    if (!msg) {
      setOutput(prev => [...prev, { type: 'error', text: 'Commit aborted: empty commit message.' }]);
      return;
    }

    const fullCmd = `git commit -m "${msg.replace(/"/g, '\\"')}"`;
    setOutput(prev => [...prev, { type: 'input', text: fullCmd }]);
    await runCommand(fullCmd);
  };

  const cancelCommitMsg = () => {
    setCommitMsg('');
    setAwaitingCommitMsg(false);
    setOutput(prev => [...prev, { type: 'error', text: 'Commit aborted.' }]);
  };

  const clearOutput = () => setOutput([]);

  return (
    <div className="flex-1 min-h-0 bg-slate-900 border-t border-slate-700/50 shadow-2xl flex flex-col z-10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 bg-slate-950/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Terminal Console
          </span>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/50 px-2 rounded-full border border-slate-700/30">
            {workingPath ? `~/workspace/${workingPath}` : '~/workspace'}
          </span>
        </div>
        <button
          onClick={clearOutput}
          className="p-1 px-2 text-[10px] uppercase font-bold text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Output Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-950/80 font-mono text-xs space-y-1.5 custom-scrollbar">
        {output.length === 0 && (
          <div className="text-slate-600 italic">
            Welcome to Terminal. Try running: <span className="text-orange-400/80">git init</span>
          </div>
        )}

        {output.map((line, idx) => (
          <div key={idx} className="animate-in fade-in slide-in-from-left-1 duration-200">
            {line.type === 'input' && (
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-emerald-500 font-bold">$</span>
                <span className="text-slate-200">{line.text}</span>
              </div>
            )}
            {line.type === 'output' && (
              <div className="text-slate-300 whitespace-pre-wrap pl-4 border-l border-slate-800/50 ml-0.5 mt-0.5">
                {line.text}
              </div>
            )}
            {line.type === 'error' && (
              <div className="text-rose-400 whitespace-pre-wrap pl-4 border-l border-rose-900/30 ml-0.5 mt-0.5">
                {line.text}
              </div>
            )}
            {line.type === 'prompt' && (
              <div className="text-yellow-400/80 pl-4 border-l border-yellow-900/30 ml-0.5 mt-0.5 italic">
                {line.text}
              </div>
            )}
          </div>
        ))}
        <div ref={outputEndRef} />
      </div>

      {/* ── Commit Message Prompt ── */}
      {awaitingCommitMsg && (
        <form
          onSubmit={handleCommitMsgSubmit}
          className="flex items-center gap-2 px-4 py-2 border-t border-yellow-700/40 bg-yellow-950/20"
        >
          <span className="text-yellow-400 font-mono font-bold text-xs shrink-0">
            Commit message:
          </span>
          <input
            ref={commitMsgRef}
            type="text"
            value={commitMsg}
            onChange={e => setCommitMsg(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') cancelCommitMsg(); }}
            placeholder='e.g. "add login page"'
            className="flex-1 bg-transparent text-slate-200 outline-none placeholder-slate-600 text-xs font-mono"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !commitMsg.trim()}
            className="p-1 px-3 bg-yellow-700 hover:bg-yellow-600 disabled:opacity-30 text-white rounded text-[10px] font-bold uppercase transition-all"
          >
            {isLoading ? '...' : 'Commit'}
          </button>
          <button
            type="button"
            onClick={cancelCommitMsg}
            className="p-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-[10px] font-bold uppercase transition-all"
          >
            Cancel
          </button>
        </form>
      )}

      {/* ── Normal Command Input ── */}
      {!awaitingCommitMsg && (
        <form
          onSubmit={handleCommandSubmit}
          className="flex items-center gap-2 px-4 py-2 border-t border-slate-700/50 bg-slate-900/50"
        >
          <span className="text-emerald-500 font-mono font-bold">$</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={e => setCommand(e.target.value)}
            placeholder="Enter command..."
            className="flex-1 bg-transparent text-slate-200 outline-none placeholder-slate-600 text-xs font-mono"
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || !command.trim()}
            className="p-1 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded text-[10px] font-bold uppercase transition-all"
          >
            {isLoading ? '...' : 'Run'}
          </button>
        </form>
      )}
    </div>
  );
}
