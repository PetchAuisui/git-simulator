import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001/api',
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

export const authApi = {
    login: (username, password) => api.post('/auth/login', { username, password }),
    register: (username, password, firstName, lastName, dob) => api.post('/auth/register', { username, password, firstName, lastName, dob }),
};

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
