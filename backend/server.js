const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const fileRoutes = require('./routes/files');
const gitRoutes = require('./routes/git');

const app = express();
const PORT = process.env.PORT || 3001;

// Define workspace root, use a dedicated workspace folder inside the project root
const WORKSPACE_ROOT = path.join(__dirname, '..', 'workspace');

// Ensure workspace exists
fs.ensureDirSync(WORKSPACE_ROOT);
console.log(`Workspace initialized at: ${WORKSPACE_ROOT}`);

app.use(cors());
app.use(express.json());

// Pass workspace root to routes via middleware
app.use((req, res, next) => {
    req.workspaceRoot = WORKSPACE_ROOT;
    next();
});

app.use('/api/files', fileRoutes);
app.use('/api/git', gitRoutes);

app.get('/api/workspace', (req, res) => {
    res.json({ workspaceRoot: WORKSPACE_ROOT });
});

app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
});
