const express = require('express');
const router = express.Router();
const gitService = require('../services/gitService');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Create repository
router.post('/repo/create', requireAuth, async (req, res) => {
  try {
    const { repoName, initialContent } = req.body;

    if (!repoName) {
      return res.status(400).json({ error: 'Repository name is required' });
    }

    const repo = await gitService.createRepository(
      req.session.userId,
      repoName,
      initialContent || ''
    );
    res.json({ success: true, repo });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List repositories
router.get('/repos', requireAuth, async (req, res) => {
  try {
    const repos = await gitService.listRepositories(req.session.userId);
    res.json({ repos });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create branch
router.post('/branch/create', requireAuth, async (req, res) => {
  try {
    const { repoName, branchName } = req.body;

    if (!repoName || !branchName) {
      return res.status(400).json({ error: 'Repository name and branch name are required' });
    }

    const result = await gitService.createBranch(
      req.session.userId,
      repoName,
      branchName
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List branches
router.get('/branches/:repoName', requireAuth, async (req, res) => {
  try {
    const branches = await gitService.listBranches(
      req.session.userId,
      req.params.repoName
    );
    res.json({ branches });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Checkout branch
router.post('/branch/checkout', requireAuth, async (req, res) => {
  try {
    const { repoName, branchName } = req.body;

    if (!repoName || !branchName) {
      return res.status(400).json({ error: 'Repository name and branch name are required' });
    }

    const result = await gitService.checkoutBranch(
      req.session.userId,
      repoName,
      branchName
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Commit changes
router.post('/commit', requireAuth, async (req, res) => {
  try {
    const { repoName, files, message } = req.body;

    if (!repoName || !files || !message) {
      return res.status(400).json({ error: 'Repository name, files, and message are required' });
    }

    const result = await gitService.commit(
      req.session.userId,
      repoName,
      files,
      message
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get commit history
router.get('/history/:repoName', requireAuth, async (req, res) => {
  try {
    const history = await gitService.getCommitHistory(
      req.session.userId,
      req.params.repoName
    );
    res.json({ history });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Write file
router.post('/file/write', requireAuth, async (req, res) => {
  try {
    const { repoName, filePath, content } = req.body;

    if (!repoName || !filePath) {
      return res.status(400).json({ error: 'Repository name and file path are required' });
    }

    const result = await gitService.writeFile(
      req.session.userId,
      repoName,
      filePath,
      content || ''
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Read file
router.get('/file/read/:repoName/:filePath(*)', requireAuth, async (req, res) => {
  try {
    const result = await gitService.readFile(
      req.session.userId,
      req.params.repoName,
      req.params.filePath
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List files
router.get('/files/:repoName/:dirPath(*)?', requireAuth, async (req, res) => {
  try {
    const files = await gitService.listFiles(
      req.session.userId,
      req.params.repoName,
      req.params.dirPath
    );
    res.json({ files });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get status
router.get('/status/:repoName', requireAuth, async (req, res) => {
  try {
    const status = await gitService.getStatus(
      req.session.userId,
      req.params.repoName
    );
    res.json(status);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Execute git command
router.post('/execute', requireAuth, async (req, res) => {
  try {
    const { repoName, command } = req.body;

    if (!repoName || !command) {
      return res.status(400).json({ error: 'Repository name and command are required' });
    }

    const output = await gitService.executeCommand(
      req.session.userId,
      repoName,
      command
    );
    res.json({ output });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
