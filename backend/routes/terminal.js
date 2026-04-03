const express = require('express');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

const router = express.Router();

// POST /api/terminal/execute - Execute a command in a specific directory
router.post('/execute', async (req, res) => {
    try {
        const { command, workingPath } = req.body;
        
        if (!command || !command.trim()) {
            return res.status(400).json({ error: 'Command is required' });
        }

        // Make sure the working path is within the user's workspace
        let fullPath = req.workspaceRoot;
        if (workingPath) {
            fullPath = path.join(req.workspaceRoot, workingPath);
            // Security: ensure the path is within workspace
            if (!fullPath.startsWith(req.workspaceRoot)) {
                return res.status(400).json({ error: 'Invalid path' });
            }
        }

        // Ensure the directory exists
        if (!(await fs.pathExists(fullPath))) {
            return res.status(400).json({ error: 'Directory not found' });
        }

        // Check if it's a directory
        const stats = await fs.stat(fullPath);
        if (!stats.isDirectory()) {
            return res.status(400).json({ error: 'Path is not a directory' });
        }

        try {
            const output = execSync(command, {
                cwd: fullPath,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe']
            });

            res.json({
                success: true,
                output: output,
                workingPath: fullPath
            });
        } catch (execError) {
            // Command failed but we still return the output
            res.json({
                success: false,
                output: execError.stdout || '',
                error: execError.stderr || execError.message,
                workingPath: fullPath
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
