import { useState, useCallback, useEffect, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import FileExplorer from './components/FileExplorer';
import GitPanel from './components/GitPanel';
import Terminal from './components/Terminal';
import AuthScreen from './components/AuthScreen';
import LandingPage from './components/LandingPage';
import { AuthContext } from './contexts/AuthContext';
import { gitApi } from './api';
import GitGraph from './components/GitGraph';
import { GitCommit } from 'lucide-react';

function MainApp() {
  const { user, logout } = useContext(AuthContext);
  const [gitStatus, setGitStatus] = useState(null);
  const [gitLog, setGitLog] = useState([]);
  const [isRepo, setIsRepo] = useState(false);
  const [terminalPath, setTerminalPath] = useState('');
  const [fileRefreshKey, setFileRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const { data: statusData } = await gitApi.status();
      setIsRepo(statusData.isRepo);
      if (statusData.isRepo) {
        setGitStatus(statusData);
        const { data: logData } = await gitApi.log();
        setGitLog(logData.commits);
      } else {
        setGitStatus(null);
        setGitLog([]);
      }
      // Trigger FileExplorer to refresh its tree after any git operation
      setFileRefreshKey(k => k + 1);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenTerminal = (path) => {
    setTerminalPath(path || '');
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-50 overflow-hidden font-sans">
      <Toaster position="top-right" />
      
      {/* Top Navbar */}
      <div className="absolute top-0 left-0 w-full h-12 bg-slate-900/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
            <h1 className="text-lg font-black tracking-tighter bg-gradient-to-br from-orange-400 via-rose-500 to-purple-600 bg-clip-text text-transparent uppercase italic">
            git simulator
            </h1>
            <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Active Workspace</span>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-orange-400">
                    @{user?.username}
                </span>
            </div>
        </div>
        <div className="flex items-center gap-6">
            <button 
                onClick={logout}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-400 transition-colors"
            >
                Disconnect
            </button>
        </div>
      </div>

      {/* Workspace Area */}
      <div className="flex w-full h-full pt-12">
        
        {/* Left: File System */}
        <div className="w-64 min-w-[250px] border-r border-white/5 bg-slate-900/30 flex flex-col">
          <div className="px-4 py-3 border-b border-white/5 bg-slate-900/50">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Explorer</span>
          </div>
          <div className="flex-1 overflow-auto">
             <FileExplorer onFileChange={fetchData} onOpenTerminal={handleOpenTerminal} refreshKey={fileRefreshKey} />
          </div>
        </div>

        {/* Center: Visuals & Console */}
        <div className="flex-1 flex flex-col bg-slate-950">
           {/* Top: Git Graph */}
           <div className="flex-[1.5] border-b border-white/5 flex flex-col min-h-0 bg-gradient-to-b from-slate-900/20 to-transparent">
              {isRepo ? (
                <GitGraph commits={gitLog} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 p-10 text-center">
                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 animate-pulse">
                        <GitCommit size={32} className="opacity-20" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-tight">System Offline</h3>
                    <p className="text-xs max-w-xs leading-relaxed opacity-60">
                        No active repository detected in this workspace. <br/>
                        Initialize git via the terminal below to start simulation.
                    </p>
                </div>
              )}
           </div>

           {/* Bottom: Terminal */}
           <div className="flex-1 flex flex-col min-h-0">
             <Terminal 
                workingPath={terminalPath}
                refreshStatus={fetchData}
                onRepoInitialized={fetchData}
              />
           </div>
        </div>

        {/* Right: Git Actions */}
        <div className="w-80 min-w-[300px] border-l border-white/5 bg-slate-900/30 flex flex-col">
          <div className="px-4 py-3 border-b border-white/5 bg-slate-900/50">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Source Control</span>
          </div>
          <div className="flex-1 overflow-auto">
            {isRepo ? (
              <div className="p-4">
                <GitPanel gitStatus={gitStatus} refreshStatus={fetchData} />
              </div>
            ) : (
                <div className="p-8 text-center mt-10">
                    <p className="text-xs text-slate-600 italic">Stage and commit interface will activate once repository is initialized.</p>
                </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/workspace" />} />
      <Route path="/auth" element={!user ? <AuthScreen /> : <Navigate to="/workspace" />} />
      <Route path="/workspace" element={user ? <MainApp /> : <Navigate to="/auth" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
