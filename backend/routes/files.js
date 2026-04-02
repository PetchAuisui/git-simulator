const express = require('express');
const fs = require('fs-extra');
const path = require('path');

const router = express.Router();

// Helper to get safe absolute path
const getSafePath = (root, relativePath) => {
    const defaultVal = relativePath || '.';
    const safePath = path.normalize(path.join(root, defaultVal));
    if (!safePath.startsWith(root)) {
        throw new Error('Invalid path');
    }
    return safePath;
};

// GET /api/files - Get directory structure
router.get('/', async (req, res) => {
    try {
        const root = req.workspaceRoot;
        const dirPath = req.query.path ? getSafePath(root, req.query.path) : root;
        
        if (!(await fs.pathExists(dirPath))) {
            return res.status(404).json({ error: 'Path not found' });
        }

        const items = await fs.readdir(dirPath, { withFileTypes: true });
        
        const files = items.map(item => ({
            name: item.name,
            isDirectory: item.isDirectory(),
            path: path.relative(root, path.join(dirPath, item.name)).replace(/\\/g, '/')
        })).sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });

        res.json({ files });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/files - Create file or folder
router.post('/', async (req, res) => {
    try {
        const { targetPath, isDirectory } = req.body;
        if (!targetPath) return res.status(400).json({ error: 'Target path required' });
        
        const fullPath = getSafePath(req.workspaceRoot, targetPath);
        
        if (await fs.pathExists(fullPath)) {
            return res.status(400).json({ error: 'Already exists' });
        }

        if (isDirectory) {
            await fs.ensureDir(fullPath);
        } else {
            await fs.ensureFile(fullPath);
        }
        res.json({ success: true, path: targetPath });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/files - Rename/Move
router.put('/', async (req, res) => {
    try {
        const { oldPath, newPath } = req.body;
        if (!oldPath || !newPath) return res.status(400).json({ error: 'Old and new paths required' });

        const fullOldPath = getSafePath(req.workspaceRoot, oldPath);
        const fullNewPath = getSafePath(req.workspaceRoot, newPath);

        if (!(await fs.pathExists(fullOldPath))) {
            return res.status(404).json({ error: 'Source not found' });
        }
        if (await fs.pathExists(fullNewPath)) {
            return res.status(400).json({ error: 'Destination already exists' });
        }

        await fs.move(fullOldPath, fullNewPath);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/files - Delete file or folder
router.delete('/', async (req, res) => {
    try {
        const { targetPath } = req.query;
        if (!targetPath) return res.status(400).json({ error: 'Target path required' });

        const fullPath = getSafePath(req.workspaceRoot, targetPath);
        
        if (!(await fs.pathExists(fullPath))) {
            return res.status(404).json({ error: 'Not found' });
        }
        
        // Block deleting root workspace
        if (fullPath === req.workspaceRoot) {
             return res.status(400).json({ error: 'Cannot delete workspace root' });
        }

        await fs.remove(fullPath);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
