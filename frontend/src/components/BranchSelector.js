import React, { useState } from 'react';

const BranchSelector = ({ branches, currentBranch, onCheckout, onCreate }) => {
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    await onCreate(newBranchName);
    setNewBranchName('');
    setShowNewBranch(false);
  };

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div className="branch-selector">
        <label style={{ margin: 0 }}>Branch:</label>
        <select value={currentBranch} onChange={(e) => onCheckout(e.target.value)}>
          {branches.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>

        <button onClick={() => setShowNewBranch(!showNewBranch)} className="primary">
          + New Branch
        </button>
      </div>

      {showNewBranch && (
        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="new-branch-name"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateBranch()}
            />
            <button onClick={handleCreateBranch} className="primary">
              Create
            </button>
            <button
              onClick={() => setShowNewBranch(false)}
              style={{ background: '#6c757d', color: 'white' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchSelector;
