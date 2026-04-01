import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Terminal from '../components/Terminal';
import { userAPI } from '../services/api';

const TerminalPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await userAPI.getMe();
        setUser(res.data.user);
      } catch (err) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await userAPI.logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1e1e1e', color: '#d4d4d4' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: '#252526',
        borderBottom: '1px solid #3e3e42',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={{ margin: 0, color: '#4ec9b0', fontSize: '20px' }}>
            🔧 Git Simulator
          </h1>
          {user && <span style={{ color: '#ccc', fontSize: '14px' }}>Welcome, {user.username}!</span>}
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            background: '#d32f2f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
          }}
        >
          Logout
        </button>
      </div>

      {/* Terminal */}
      <Terminal />
    </div>
  );
};

export default TerminalPage;
