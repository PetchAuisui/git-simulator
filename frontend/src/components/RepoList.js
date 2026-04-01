import React from 'react';
import { useNavigate } from 'react-router-dom';

const RepoList = ({ repos }) => {
  const navigate = useNavigate();

  return (
    <div className="grid">
      {repos.map((repo) => (
        <div
          key={repo.id}
          className="repo-card"
          onClick={() => navigate(`/repo/${repo.repoName}`)}
        >
          <h3>📦 {repo.repoName}</h3>
          <p>Created: {new Date(repo.createdAt).toLocaleDateString()}</p>
          <button className="primary" onClick={(e) => {
            e.stopPropagation();
            navigate(`/repo/${repo.repoName}`);
          }}>
            Open
          </button>
        </div>
      ))}
    </div>
  );
};

export default RepoList;
