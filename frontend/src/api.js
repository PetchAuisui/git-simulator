import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001/api',
});

export const fileApi = {
    getTree: (path = '') => api.get('/files', { params: { path } }),
    createFile: (targetPath, isDirectory) => api.post('/files', { targetPath, isDirectory }),
    rename: (oldPath, newPath) => api.put('/files', { oldPath, newPath }),
    delete: (targetPath) => api.delete('/files', { params: { targetPath } }),
};

export const gitApi = {
    init: () => api.post('/git/init'),
    status: () => api.get('/git/status'),
    add: (files) => api.post('/git/add', { files }),
    unstage: (files) => api.post('/git/unstage', { files }),
    commit: (message) => api.post('/git/commit', { message }),
};

export default api;
