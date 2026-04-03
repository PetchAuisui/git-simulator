const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('./db');

const fileRoutes = require('./routes/files');
const gitRoutes = require('./routes/git');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// Initialize Database
db.initDB();

// Root workspace directory
const BASE_WORKSPACE = path.join(__dirname, '..', 'workspace');
fs.ensureDirSync(BASE_WORKSPACE);
console.log(`Base workspace map initialized at: ${BASE_WORKSPACE}`);

app.use(cors());
app.use(express.json());

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

app.get('/api/workspace', authenticate, (req, res) => {
    res.json({ workspaceRoot: req.workspaceRoot, username: req.user.username });
});

app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
});
