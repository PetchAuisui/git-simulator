import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// User API
export const userAPI = {
  register: (username, password) =>
    API.post('/users/register', { username, password }),
  login: (username, password) =>
    API.post('/users/login', { username, password }),
  getMe: () => API.get('/users/me'),
  logout: () => API.post('/users/logout'),
};

// Git API
export const gitAPI = {
  // Repository operations
  createRepo: (repoName, initialContent) =>
    API.post('/git/repo/create', { repoName, initialContent }),
  listRepos: () => API.get('/git/repos'),

  // Branch operations
  createBranch: (repoName, branchName) =>
    API.post('/git/branch/create', { repoName, branchName }),
  listBranches: (repoName) => API.get(`/git/branches/${repoName}`),
  checkoutBranch: (repoName, branchName) =>
    API.post('/git/branch/checkout', { repoName, branchName }),

  // Commit operations
  commit: (repoName, files, message) =>
    API.post('/git/commit', { repoName, files, message }),
  getHistory: (repoName) => API.get(`/git/history/${repoName}`),

  // File operations
  writeFile: (repoName, filePath, content) =>
    API.post('/git/file/write', { repoName, filePath, content }),
  readFile: (repoName, filePath) =>
    API.get(`/git/file/read/${repoName}/${filePath}`),
  listFiles: (repoName, dirPath = '') => {
    const path = dirPath ? `${repoName}/${dirPath}` : repoName;
    return API.get(`/git/files/${path}`);
  },

  // Status
  getStatus: (repoName) => API.get(`/git/status/${repoName}`),

  // Execute command
  executeCommand: (repoName, command) =>
    API.post('/git/execute', { repoName, command }),
};

export default API;
