import React from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';

const Header = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await userAPI.logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };

  return (
    <div className="header">
      <div className="header-content">
        <h1>🔧 Git Simulator</h1>
        <div className="header-nav">
          {user && <span>{user.username}</span>}
          <button
            className="primary"
            onClick={() => navigate('/dashboard')}
            style={{ padding: '8px 15px' }}
          >
            Dashboard
          </button>
          <button className="danger" onClick={handleLogout} style={{ padding: '8px 15px' }}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
