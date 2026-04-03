import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:3002/api',
    timeout: 10000,
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Axios interceptors for debugging
api.interceptors.request.use(request => {
    console.log(`[API] Starting Request: ${request.method?.toUpperCase()} ${request.url}`, request.data);
    return request;
});

api.interceptors.response.use(
    response => {
        console.log(`[API] Response Received: ${response.status} ${response.config.url}`, response.data);
        return response;
    },
    error => {
        console.error(`[API] Error: ${error.message} ${error.config?.url}`, error.response?.data);
        return Promise.reject(error);
    }
);

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
    log: () => api.get('/git/log'),
};

export default api;
