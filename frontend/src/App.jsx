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

function MainApp() {
  const { user, logout } = useContext(AuthContext);
  const [gitStatus, setGitStatus] = useState(null);
  const [isRepo, setIsRepo] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalPath, setTerminalPath] = useState('');

  const fetchGitStatus = useCallback(async () => {
    try {
      const { data } = await gitApi.status();
      setIsRepo(data.isRepo);
      if (data.isRepo) {
        setGitStatus(data);
      } else {
        setGitStatus(null);
      }
    } catch (error) {
      console.error('Failed to fetch git status:', error);
      toast.error('Failed to fetch git status');
    }
  }, []);

  useEffect(() => {
    fetchGitStatus();
  }, [fetchGitStatus]);

  const handleOpenTerminal = (path) => {
    setTerminalPath(path || '');
    setIsTerminalOpen(true);
  };

  const handleCloseTerminal = () => {
    setIsTerminalOpen(false);
    setTerminalPath('');
  };

  return (
    <div className="flex h-screen w-screen bg-slate-900 text-slate-50 overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="absolute top-0 left-0 w-full h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 z-10 shadow-md">
        <div className="flex items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent flex items-center gap-2">
            git simulator
            </h1>
            {isRepo && (
            <span className="ml-4 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-400">
                {gitStatus?.currentBranch || 'main'}
            </span>
            )}
        </div>
        <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Workspace: <span className="text-orange-400 font-medium">@{user?.username}</span></span>
            <button 
                onClick={logout}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
                Logout
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex w-full pt-14">
        {/* Left Pane - File Explorer */}
        <div className="w-1/3 min-w-[300px] border-r border-slate-800 bg-slate-900/50 flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900 font-medium text-slate-400 uppercase text-xs tracking-wider">
            File Explorer
          </div>
          <div className="flex-1 overflow-auto p-4">
             <FileExplorer onFileChange={fetchGitStatus} onOpenTerminal={handleOpenTerminal} />
          </div>
        </div>

        {/* Right Pane - Git Controls */}
        <div className="flex-1 flex flex-col bg-slate-900">
          <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
            <span className="font-medium text-slate-400 uppercase text-xs tracking-wider">
              Git Source Control
            </span>
          </div>
          
          <div className="flex-1 overflow-auto p-6">
            {isRepo ? (
              <GitPanel gitStatus={gitStatus} refreshStatus={fetchGitStatus} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                  <span className="text-3xl text-slate-600">📦</span>
                </div>
                <h3 className="text-lg font-medium text-slate-400">Not a Git Repository</h3>
                <p className="text-sm max-w-sm text-center">
                  The current workspace is not tracked by Git. Use the terminal to run <code className="bg-slate-800 px-2 py-1 rounded text-orange-400">git init</code> to initialize a repository.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terminal Window */}
      {isTerminalOpen && (
        <Terminal 
          workingPath={terminalPath}
          onClose={handleCloseTerminal}
          refreshStatus={fetchGitStatus}
          onRepoInitialized={fetchGitStatus}
        />
      )}
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
