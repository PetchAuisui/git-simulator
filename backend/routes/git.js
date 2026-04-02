const express = require('express');
const simpleGit = require('simple-git');
const fs = require('fs-extra');
const path = require('path');

const router = express.Router();

// Helper to initialize simple-git instance for a specific workspace
const getGit = (rootPath) => {
    return simpleGit(rootPath);
};

// POST /api/git/init - Initialize git repository
router.post('/init', async (req, res) => {
    try {
        const gitPath = path.join(req.workspaceRoot, '.git');
        if (await fs.pathExists(gitPath)) {
            return res.status(400).json({ error: 'Already a git repository' });
        }
        const git = getGit(req.workspaceRoot);
        await git.init();
        res.json({ success: true, message: 'Initialized empty Git repository' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/git/status - Get git status
router.get('/status', async (req, res) => {
    try {
        const gitPath = path.join(req.workspaceRoot, '.git');
        if (!(await fs.pathExists(gitPath))) {
            return res.json({ isRepo: false });
        }
        const git = getGit(req.workspaceRoot);

        const status = await git.status();
        
        // Parse the status into more frontend-friendly format
        // status.not_added -> Untracked
        // status.modified/deleted -> Modified
        // status.staged/created -> Staged
        
        res.json({
            isRepo: true,
            currentBranch: status.current,
            staged: status.staged.concat(status.created),
            modified: status.modified.concat(status.deleted),
            untracked: status.not_added,
            all: status.files
        });
    } catch (error) {
        // Simple-git might throw if .git exists but it's corrupted, or other reasons
        res.status(500).json({ error: error.message });
    }
});

// POST /api/git/add - Stage files
router.post('/add', async (req, res) => {
    try {
        const { files } = req.body; // array of paths or "."
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files specified to add' });
        }

        const git = getGit(req.workspaceRoot);
        await git.add(files);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/git/unstage - Unstage files
router.post('/unstage', async (req, res) => {
    try {
        const { files } = req.body;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files specified for unstage' });
        }

        const git = getGit(req.workspaceRoot);
        await git.reset(['HEAD', ...files]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// POST /api/git/commit - Commit staged files
router.post('/commit', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Commit message is required' });
        }

        const git = getGit(req.workspaceRoot);
        const status = await git.status();
        
        if (status.staged.length === 0 && status.created.length === 0) {
             return res.status(400).json({ error: 'Nothing to commit, working tree clean' });
        }

        const result = await git.commit(message);
        res.json({ success: true, commitId: result.commit, branch: result.branch });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
