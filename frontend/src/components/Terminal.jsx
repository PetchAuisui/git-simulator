import { useState, useRef, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';
import { Send, X, Maximize2, Minimize2 } from 'lucide-react';

export default function Terminal({ workingPath, onClose, refreshStatus, onRepoInitialized }) {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const outputEndRef = useRef(null);

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  const executeCommand = async (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    setIsLoading(true);
    const commandToExecute = command.trim();
    
    // Add user command to output
    setOutput(prev => [...prev, { type: 'input', text: commandToExecute }]);
    
    try {
      const response = await api.post('/terminal/execute', {
        command: commandToExecute,
        workingPath: workingPath
      });

      // Add output
      if (response.data.output) {
        setOutput(prev => [...prev, { type: 'output', text: response.data.output }]);
      }

      // Check if it was a successful git init command
      if (commandToExecute === 'git init' && response.data.success) {
        toast.success('Git repository initialized!');
        if (onRepoInitialized) {
          onRepoInitialized();
        }
        if (refreshStatus) {
          refreshStatus();
        }
      }

      if (!response.data.success && response.data.error) {
        setOutput(prev => [...prev, { type: 'error', text: response.data.error }]);
      }

      setCommand('');
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Command execution failed';
      setOutput(prev => [...prev, { type: 'error', text: errorMsg }]);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearOutput = () => {
    setOutput([]);
  };

  return (
    <div className="flex-1 min-h-0 bg-slate-900 border-t border-slate-700/50 shadow-2xl flex flex-col z-10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 bg-slate-950/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Terminal Console
          </span>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/50 px-2 rounded-full border border-slate-700/30">
            {workingPath ? `~/workspace/${workingPath}` : '~/workspace'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearOutput}
            className="p-1 px-2 text-[10px] uppercase font-bold text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Output Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-950/80 font-mono text-xs space-y-1.5 custom-scrollbar">
        {output.length === 0 && (
          <div className="text-slate-600 italic">
            Welcome to Terminal. Try running: <span className="text-orange-400/80">git init</span>
          </div>
        )}
        
        {output.map((line, idx) => (
          <div key={idx} className="animate-in fade-in slide-in-from-left-1 duration-300">
            {line.type === 'input' && (
              <div className="text-slate-400 flex items-center gap-2">
                <span className="text-emerald-500 font-bold">$</span> <span className="text-slate-200">{line.text}</span>
              </div>
            )}
            {line.type === 'output' && (
              <div className="text-slate-300 whitespace-pre-wrap pl-4 border-l border-slate-800/50 ml-0.5 mt-0.5">
                {line.text}
              </div>
            )}
            {line.type === 'error' && (
              <div className="text-rose-400 whitespace-pre-wrap pl-4 border-l border-rose-900/30 ml-0.5 mt-0.5 font-bold">
                {line.text}
              </div>
            )}
          </div>
        ))}
        <div ref={outputEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={executeCommand} className="flex items-center gap-2 px-4 py-2 border-t border-slate-700/50 bg-slate-900/50">
        <span className="text-emerald-500 font-mono font-bold">$</span>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
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
    </div>
  );
}
