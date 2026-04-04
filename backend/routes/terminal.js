const express = require('express');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
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

        // Ensure the user's workspace directory exists
        await fs.ensureDir(req.workspaceRoot);

        // Ensure the specific directory exists
        if (!(await fs.pathExists(fullPath))) {
            return res.status(400).json({ error: 'Directory not found' });
        }

        // Check if it's a directory
        const stats = await fs.stat(fullPath);
        if (!stats.isDirectory()) {
            return res.status(400).json({ error: 'Path is not a directory' });
        }

        // ─── Intercept commands that require interactive input ───────────────
        const trimmedCmd = command.trim();

        // git commit without -m → would open vim, intercept it
        if (/^git\s+commit\s*$/.test(trimmedCmd)) {
            return res.json({
                success: false,
                output: '',
                error: 'Please use: git commit -m "your message"\n(Interactive editor is not supported in this terminal)',
                workingPath: fullPath
            });
        }

        // Other interactive git commands
        const interactiveCommands = [
            /^git\s+rebase\s+-i/,
            /^git\s+add\s+-p/,
            /^git\s+add\s+--patch/,
        ];
        for (const pattern of interactiveCommands) {
            if (pattern.test(trimmedCmd)) {
                return res.json({
                    success: false,
                    output: '',
                    error: 'Interactive mode is not supported in this terminal.',
                    workingPath: fullPath
                });
            }
        }
        // ────────────────────────────────────────────────────────────────────

        try {
            // Use execAsync with a 10-second timeout to prevent permanent hangs
            const { stdout, stderr } = await execAsync(command, {
                cwd: fullPath,
                encoding: 'utf-8',
                timeout: 10000, // 10 seconds timeout
                env: {
                    ...process.env,
                    GIT_TERMINAL_PROMPT: '0',   // don't wait for credentials
                    GIT_EDITOR: 'true',           // use no-op editor (prevents hang)
                    EDITOR: 'true',
                    VISUAL: 'true',
                }
            });

            res.json({
                success: true,
                output: stdout || stderr || '',
                workingPath: fullPath
            });
        } catch (execError) {
            // Command failed — return stdout+stderr so user can see git's message
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
