import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gitAPI } from '../services/api';
import Header from '../components/Header';
import BranchSelector from '../components/BranchSelector';
import FileEditor from '../components/FileEditor';
import CommitHistory from '../components/CommitHistory';

const RepoDetail = () => {
  const { repoName } = useParams();
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState('master');
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('files');

  useEffect(() => {
    loadRepoData();
  }, [repoName, currentBranch]);

  const loadRepoData = async () => {
    try {
      setLoading(true);
      // Load branches
      const branchRes = await gitAPI.listBranches(repoName);
      setBranches(branchRes.data.branches);

      // Load files
      const filesRes = await gitAPI.listFiles(repoName);
      setFiles(filesRes.data.files);

      // Load history
      const historyRes = await gitAPI.getHistory(repoName);
      setHistory(historyRes.data.history);
    } catch (err) {
      setError('Failed to load repository data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (branchName) => {
    try {
      await gitAPI.createBranch(repoName, branchName);
      await loadRepoData();
    } catch (err) {
      setError('Failed to create branch');
    }
  };

  const handleCheckoutBranch = async (branchName) => {
    try {
      await gitAPI.checkoutBranch(repoName, branchName);
      setCurrentBranch(branchName);
      setSelectedFile(null);
      await loadRepoData();
    } catch (err) {
      setError('Failed to checkout branch');
    }
  };

  const handleFileSelect = async (filePath) => {
    try {
      const res = await gitAPI.readFile(repoName, filePath);
      setSelectedFile(filePath);
      setFileContent(res.data.content);
    } catch (err) {
      setError('Failed to read file');
    }
  };

  const handleSaveFile = async (newContent) => {
    try {
      await gitAPI.writeFile(repoName, selectedFile, newContent);
      setFileContent(newContent);
    } catch (err) {
      setError('Failed to save file');
    }
  };

  const handleCommit = async (message) => {
    try {
      const filesToCommit = selectedFile ? [selectedFile] : files;
      await gitAPI.commit(repoName, filesToCommit, message);
      await loadRepoData();
    } catch (err) {
      setError('Failed to commit changes');
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container">
        <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px' }}>
          ← Back to Repositories
        </button>

        <h2 style={{ marginBottom: '20px' }}>{repoName}</h2>

        {error && (
          <div className="error" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <BranchSelector
          branches={branches}
          currentBranch={currentBranch}
          onCheckout={handleCheckoutBranch}
          onCreate={handleCreateBranch}
        />

        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            Files & Editor
          </button>
          <button
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Commit History
          </button>
        </div>

        {activeTab === 'files' && (
          <FileEditor
            repoName={repoName}
            files={files}
            selectedFile={selectedFile}
            fileContent={fileContent}
            onFileSelect={handleFileSelect}
            onSaveFile={handleSaveFile}
            onCommit={handleCommit}
          />
        )}

        {activeTab === 'history' && <CommitHistory history={history} />}
      </div>
    </div>
  );
};

export default RepoDetail;
