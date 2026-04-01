import React, { useState } from 'react';
import { gitAPI } from '../services/api';

const CreateRepoModal = ({ onClose, onSuccess }) => {
  const [repoName, setRepoName] = useState('');
  const [initialContent, setInitialContent] = useState('# New Repository\n\nThis is your new repository.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await gitAPI.createRepo(repoName, initialContent);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create repository');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Create New Repository</h2>
          <button onClick={onClose} style={{ background: 'none', width: '30px', height: '30px' }}>
            ✕
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Repository Name</label>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="my-awesome-repo"
              required
            />
          </div>

          <div className="form-group">
            <label>Initial Content (README.md)</label>
            <textarea
              value={initialContent}
              onChange={(e) => setInitialContent(e.target.value)}
              rows="6"
              placeholder="Enter initial content"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ background: '#6c757d', color: 'white' }}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Repository'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRepoModal;
