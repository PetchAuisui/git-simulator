import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gitAPI, userAPI } from '../services/api';
import Header from '../components/Header';
import RepoList from '../components/RepoList';
import CreateRepoModal from '../components/CreateRepoModal';

const Dashboard = () => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initDashboard = async () => {
      try {
        // Get current user
        const userRes = await userAPI.getMe();
        setUser(userRes.data.user);

        // Get repositories
        const reposRes = await gitAPI.listRepos();
        setRepos(reposRes.data.repos);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to load dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, [navigate]);

  const handleRepoCreated = async () => {
    // Refresh repo list
    const reposRes = await gitAPI.listRepos();
    setRepos(reposRes.data.repos);
    setShowModal(false);
  };

  if (loading) {
    return (
      <div>
        <Header user={user} />
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
      <Header user={user} />
      <div className="container">
        {error && <div className="error">{error}</div>}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
          }}
        >
          <h2>Your Repositories</h2>
          <button className="primary" onClick={() => setShowModal(true)}>
            + New Repository
          </button>
        </div>

        {repos.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <p>No repositories yet. Create one to get started!</p>
          </div>
        ) : (
          <RepoList repos={repos} />
        )}

        {showModal && (
          <CreateRepoModal
            onClose={() => setShowModal(false)}
            onSuccess={handleRepoCreated}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
