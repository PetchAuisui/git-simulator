import React from 'react';

const CommitHistory = ({ history }) => {
  return (
    <div className="card">
      <h3>Commit History</h3>
      {history.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
          No commits yet
        </p>
      ) : (
        <ul className="commit-list">
          {history.map((commit) => (
            <li key={commit.hash} className="commit-item">
              <div style={{ marginBottom: '8px' }}>
                <strong>{commit.message}</strong>
              </div>
              <div className="commit-hash">Hash: {commit.hash.substring(0, 7)}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Author: {commit.author_name}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Date: {new Date(commit.date).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CommitHistory;
