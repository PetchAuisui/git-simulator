import { useState, useCallback, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import FileExplorer from './components/FileExplorer';
import GitPanel from './components/GitPanel';
import { gitApi } from './api';

function App() {
  const [gitStatus, setGitStatus] = useState(null);
  const [isRepo, setIsRepo] = useState(false);

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

  const handleInitRepo = async () => {
    try {
      await gitApi.init();
      toast.success('Git repository initialized!');
      fetchGitStatus();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to initialize repo');
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-900 text-slate-50 overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="absolute top-0 left-0 w-full h-14 bg-slate-950 border-b border-slate-800 flex items-center px-6 z-10 shadow-md">
        <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent flex items-center gap-2">
           Git Di Waa
        </h1>
        {isRepo && (
          <span className="ml-4 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-400">
            {gitStatus?.currentBranch || 'main'}
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="flex w-full pt-14">
        {/* Left Pane - File Explorer */}
        <div className="w-1/3 min-w-[300px] border-r border-slate-800 bg-slate-900/50 flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900 font-medium text-slate-400 uppercase text-xs tracking-wider">
            File Explorer
          </div>
          <div className="flex-1 overflow-auto p-4">
             <FileExplorer onFileChange={fetchGitStatus} />
          </div>
        </div>

        {/* Right Pane - Git Controls */}
        <div className="flex-1 flex flex-col bg-slate-900">
          <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
            <span className="font-medium text-slate-400 uppercase text-xs tracking-wider">
              Git Source Control
            </span>
            {!isRepo && (
               <button 
                onClick={handleInitRepo}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
               >
                 Initialize Repo
               </button>
            )}
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
                  The current workspace is not tracked by Git. Initialize a repository to start tracking files and changes.
                </p>
                <button 
                  onClick={handleInitRepo}
                  className="mt-4 px-4 py-2 rounded-lg bg-git-primary hover:bg-git-secondary text-white font-medium transition-colors shadow-lg shadow-orange-500/20"
                >
                  Create Git Repository
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
