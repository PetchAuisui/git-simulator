import { useState, useRef, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';
import { Send, X, Maximize2, Minimize2 } from 'lucide-react';

export default function Terminal({ workingPath, onClose, refreshStatus, onRepoInitialized }) {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
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

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button 
          onClick={() => setIsMinimized(false)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-2"
        >
          <span className="text-sm font-medium">Terminal</span>
          <Maximize2 size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-[600px] h-[400px] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-mono text-slate-300">
            {workingPath ? `~/workspace/${workingPath}` : '~/workspace'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearOutput}
            className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <Minimize2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Output Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-950 font-mono text-sm space-y-1">
        {output.length === 0 && (
          <div className="text-slate-500 text-xs">
            Welcome to Terminal. Try running: <span className="text-orange-400">git init</span>
          </div>
        )}
        
        {output.map((line, idx) => (
          <div key={idx}>
            {line.type === 'input' && (
              <div className="text-slate-400">
                <span className="text-emerald-400">$</span> <span className="text-slate-200">{line.text}</span>
              </div>
            )}
            {line.type === 'output' && (
              <div className="text-slate-300 whitespace-pre-wrap text-xs">
                {line.text}
              </div>
            )}
            {line.type === 'error' && (
              <div className="text-rose-400 whitespace-pre-wrap text-xs">
                {line.text}
              </div>
            )}
          </div>
        ))}
        <div ref={outputEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={executeCommand} className="flex items-center gap-2 px-4 py-3 border-t border-slate-700 bg-slate-900">
        <span className="text-emerald-400 font-mono">$</span>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter command (e.g., git init, ls, mkdir folder)..."
          className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-1 text-slate-200 outline-none focus:border-orange-500 text-sm font-mono"
          disabled={isLoading}
          autoFocus
        />
        <button
          type="submit"
          disabled={isLoading || !command.trim()}
          className="p-1.5 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded transition-colors"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
