import React, { useState, useEffect, useRef } from 'react';
import { gitAPI } from '../services/api';
import './Terminal.css';

const Terminal = () => {
  const [commandHistory, setCommandHistory] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentRepo, setCurrentRepo] = useState('');
  const [repos, setRepos] = useState([]);
  const [currentBranch, setCurrentBranch] = useState('master');
  const [loading, setLoading] = useState(false);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    loadRepos();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commandHistory]);

  const loadRepos = async () => {
    try {
      const res = await gitAPI.listRepos();
      setRepos(res.data.repos);
      if (res.data.repos.length > 0) {
        setCurrentRepo(res.data.repos[0].repoName);
        loadBranches(res.data.repos[0].repoName);
      }
    } catch (err) {
      addOutput('Error', 'Failed to load repositories', 'error');
    }
  };

  const loadBranches = async (repoName) => {
    try {
      const res = await gitAPI.listBranches(repoName);
      if (res.data.branches.length > 0) {
        setCurrentBranch(res.data.branches[0]);
      }
    } catch (err) {
      console.error('Failed to load branches');
    }
  };

  const addOutput = (command, output, type = 'output') => {
    setCommandHistory((prev) => [...prev, { command, output, type }]);
  };

  const executeCommand = async (cmd) => {
    const trimmedCmd = cmd.trim();

    // Add command to history
    addOutput(trimmedCmd, '', 'command');

    // Handle special built-in commands
    if (trimmedCmd === 'clear') {
      setCommandHistory([]);
      setCurrentInput('');
      return;
    }

    if (trimmedCmd.startsWith('cd ')) {
      const targetRepo = trimmedCmd.slice(3).trim();
      if (targetRepo === '..') {
        setCurrentRepo('');
        setCurrentInput('');
        return;
      }
      const repoExists = repos.some((r) => r.repoName === targetRepo);
      if (repoExists) {
        setCurrentRepo(targetRepo);
        loadBranches(targetRepo);
        addOutput('', '', 'output');
      } else {
        addOutput('', `bash: cd: ${targetRepo}: No such repository`, 'error');
      }
      setCurrentInput('');
      return;
    }

    if (trimmedCmd === 'ls' || trimmedCmd === 'ls -la') {
      if (!currentRepo) {
        const output = repos.map((r) => `  ${r.repoName}`).join('\n');
        addOutput('', output || 'No repositories', 'output');
      } else {
        try {
          const res = await gitAPI.listFiles(currentRepo);
          const output = res.data.files
            .map((f) => `  ${f}`)
            .join('\n');
          addOutput('', output || 'No files', 'output');
        } catch (err) {
          addOutput('', 'Failed to list files', 'error');
        }
      }
      setCurrentInput('');
      return;
    }

    if (trimmedCmd === 'pwd') {
      const output = currentRepo
        ? `/repos/${currentRepo}`
        : `/repos`;
      addOutput('', output, 'output');
      setCurrentInput('');
      return;
    }

    // Handle git commands
    setLoading(true);
    try {
      const result = await gitAPI.executeCommand(
        currentRepo,
        trimmedCmd
      );
      addOutput('', result.data.output || result.data.message, 'output');
      
      // Update branch if checkout command
      if (trimmedCmd.startsWith('git checkout ')) {
        const branchName = trimmedCmd.slice(13).trim();
        setCurrentBranch(branchName);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || 'Command failed';
      addOutput('', errorMsg, 'error');
    } finally {
      setLoading(false);
      setCurrentInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentInput.trim()) {
        executeCommand(currentInput);
        setHistoryIndex(-1);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = Math.min(
        historyIndex + 1,
        commandHistory.length - 1
      );
      if (newIndex >= 0) {
        const cmd = commandHistory[
          commandHistory.length - 1 - newIndex
        ]?.command;
        if (cmd) {
          setCurrentInput(cmd);
          setHistoryIndex(newIndex);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = Math.max(historyIndex - 1, -1);
      if (newIndex === -1) {
        setCurrentInput('');
      } else {
        const cmd = commandHistory[
          commandHistory.length - 1 - newIndex
        ]?.command;
        if (cmd) {
          setCurrentInput(cmd);
        }
      }
      setHistoryIndex(newIndex);
    }
  };

  return (
    <div className="terminal-container">
      <div className="terminal-sidebar">
        <h3>Repositories</h3>
        <div className="repo-list">
          {repos.length === 0 ? (
            <p className="empty-message">No repositories yet</p>
          ) : (
            repos.map((repo) => (
              <div
                key={repo.id}
                className={`repo-item ${
                  currentRepo === repo.repoName ? 'active' : ''
                }`}
                onClick={() => {
                  setCurrentRepo(repo.repoName);
                  loadBranches(repo.repoName);
                  addOutput(
                    '',
                    `Switched to repository: ${repo.repoName}`,
                    'output'
                  );
                }}
              >
                📦 {repo.repoName}
              </div>
            ))
          )}
        </div>

        <h3 style={{ marginTop: '30px' }}>Create Repo</h3>
        <input
          type="text"
          id="newRepoName"
          placeholder="repo-name"
          style={{
            display: 'block',
            width: '100%',
            padding: '8px',
            marginBottom: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
        <button
          className="create-repo-btn"
          onClick={async () => {
            const repoName = document.getElementById('newRepoName').value;
            if (!repoName) {
              addOutput('', 'Please enter repository name', 'error');
              return;
            }
            try {
              await gitAPI.createRepo(repoName, `# ${repoName}`);
              document.getElementById('newRepoName').value = '';
              loadRepos();
              addOutput(
                '',
                `Repository '${repoName}' created`,
                'output'
              );
            } catch (err) {
              addOutput(
                '',
                err.response?.data?.error || 'Failed to create repo',
                'error'
              );
            }
          }}
        >
          Create
        </button>
      </div>

      <div className="terminal-main">
        <div className="terminal-header">
          <div className="terminal-title">
            {currentRepo ? (
              <>
                <span className="repo-name">{currentRepo}</span>
                <span className="branch-badge">{currentBranch}</span>
              </>
            ) : (
              <span className="repo-name">/repos</span>
            )}
          </div>
          <div className="terminal-controls">
            <button
              onClick={() => {
                setCommandHistory([]);
                addOutput('', 'Terminal cleared', 'info');
              }}
              className="control-btn"
              title="Clear terminal"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="terminal-output">
          <div className="welcome-message">
            <p>🎓 Git Simulator Terminal</p>
            <p>Type 'help' for available commands</p>
            <p>Type 'git init [name]' to initialize a repository</p>
            <hr style={{ opacity: 0.2, margin: '15px 0' }} />
          </div>

          {commandHistory.map((item, idx) => (
            <div key={idx} className="terminal-line">
              {item.type === 'command' ? (
                <div className="command-line">
                  <span className="prompt">$ </span>
                  <span className="command-text">{item.command}</span>
                </div>
              ) : (
                <div className={`output-line output-${item.type}`}>
                  {item.output}
                </div>
              )}
            </div>
          ))}

          <div ref={terminalEndRef} />
        </div>

        <div className="terminal-input">
          <span className="prompt">$ </span>
          <input
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              currentRepo
                ? `${currentRepo} [${currentBranch}] > `
                : 'Enter command...'
            }
            disabled={loading}
            autoFocus
          />
          {loading && <span className="loading-spinner">⟳</span>}
        </div>

        <div className="terminal-help">
          <strong>Quick Commands:</strong>
          <ul>
            <li><code>git init</code> - Initialize a repository</li>
            <li><code>git add [file]</code> - Stage files</li>
            <li><code>git commit -m "[message]"</code> - Create commit</li>
            <li><code>git branch</code> - List branches</li>
            <li><code>git checkout [branch]</code> - Switch branch</li>
            <li><code>git log</code> - View commit history</li>
            <li><code>cd [repo-name]</code> - Switch repository</li>
            <li><code>ls</code> - List files</li>
            <li><code>pwd</code> - Print working directory</li>
            <li><code>clear</code> - Clear terminal</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
