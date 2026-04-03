const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('./db');

const fileRoutes = require('./routes/files');
const gitRoutes = require('./routes/git');
const authRoutes = require('./routes/auth');
const terminalRoutes = require('./routes/terminal');

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// Initialize Database (moved to startServer)
// db.initDB();

// Root workspace directory
const BASE_WORKSPACE = path.join(__dirname, '..', 'workspace');
fs.ensureDirSync(BASE_WORKSPACE);
console.log(`Base workspace map initialized at: ${BASE_WORKSPACE}`);

const corsOptions = {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Diagnostic ping route
app.get('/ping', (req, res) => res.send('pong'));

app.use('/api/auth', authRoutes);

// Protected routes middleware
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { username: '...' }
        const userWorkspace = path.join(BASE_WORKSPACE, req.user.username);
        req.workspaceRoot = userWorkspace;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

// Apply auth middleware to file and git routes
app.use('/api/files', authenticate, fileRoutes);
app.use('/api/git', authenticate, gitRoutes);
app.use('/api/terminal', authenticate, terminalRoutes);

app.get('/api/workspace', authenticate, (req, res) => {
    res.json({ workspaceRoot: req.workspaceRoot, username: req.user.username });
});

// Initialize server in async function to await DB
const startServer = async () => {
    try {
        await db.initDB();
        
        app.listen(PORT, () => {
            console.log(`Backend server listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('Critical error during startup:', error);
        process.exit(1);
    }
};

startServer();
