const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

class GitService {
  constructor() {
    this.reposBasePath = path.join(__dirname, '../../repos');
  }

  // Get user repo directory path
  getUserRepoPath(userId) {
    return path.join(this.reposBasePath, userId);
  }

  // Get specific repository path
  getRepoPath(userId, repoName) {
    return path.join(this.getUserRepoPath(userId), repoName);
  }

  // Create a new repository
  async createRepository(userId, repoName, initialContent = '') {
    const repoPath = this.getRepoPath(userId, repoName);

    try {
      // Create directory if not exists
      if (!fs.existsSync(repoPath)) {
        fs.mkdirSync(repoPath, { recursive: true });
      }

      // Initialize git repo
      const git = simpleGit(repoPath);
      await git.init();

      // Configure git user
      await git.addConfig('user.email', `${userId}@git-simulator.local`);
      await git.addConfig('user.name', userId);

      // Create initial commit if content provided
      if (initialContent) {
        fs.writeFileSync(path.join(repoPath, 'README.md'), initialContent);
        await git.add('README.md');
        await git.commit('Initial commit');
      }

      // Save repo info to database
      const repoId = uuidv4();
      await db.run(
        'INSERT INTO repositories (id, "userId", "repoName", path) VALUES ($1, $2, $3, $4)',
        [repoId, userId, repoName, repoPath]
      );

      return { id: repoId, username: userId, repoName, path: repoPath };
    } catch (error) {
      throw new Error(`Failed to create repository: ${error.message}`);
    }
  }

  // List repositories for a user
  async listRepositories(userId) {
    const repos = await db.all(
      'SELECT * FROM repositories WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [userId]
    );
    return repos;
  }

  // Create a branch
  async createBranch(userId, repoName, branchName) {
    const repoPath = this.getRepoPath(userId, repoName);

    if (!fs.existsSync(repoPath)) {
      throw new Error('Repository not found');
    }

    try {
      const git = simpleGit(repoPath);
      await git.checkoutLocalBranch(branchName);
      return { success: true, branch: branchName };
    } catch (error) {
      throw new Error(`Failed to create branch: ${error.message}`);
    }
  }

  // List branches in a repository
  async listBranches(userId, repoName) {
    const repoPath = this.getRepoPath(userId, repoName);

    if (!fs.existsSync(repoPath)) {
      throw new Error('Repository not found');
    }

    try {
      const git = simpleGit(repoPath);
      const branches = await git.branch();
      return branches.all;
    } catch (error) {
      throw new Error(`Failed to list branches: ${error.message}`);
    }
  }

  // Checkout a branch
  async checkoutBranch(userId, repoName, branchName) {
    const repoPath = this.getRepoPath(userId, repoName);

    if (!fs.existsSync(repoPath)) {
      throw new Error('Repository not found');
    }

    try {
      const git = simpleGit(repoPath);
      await git.checkout(branchName);
      return { success: true, branch: branchName };
    } catch (error) {
      throw new Error(`Failed to checkout branch: ${error.message}`);
    }
  }

  // Commit changes
  async commit(userId, repoName, files, message) {
    const repoPath = this.getRepoPath(userId, repoName);

    if (!fs.existsSync(repoPath)) {
      throw new Error('Repository not found');
    }

    try {
      const git = simpleGit(repoPath);

      // Add files
      await git.add(files);

      // Commit
      const result = await git.commit(message);
      return { success: true, hash: result.commit };
    } catch (error) {
      throw new Error(`Failed to commit: ${error.message}`);
    }
  }

  // Get commit history
  async getCommitHistory(userId, repoName) {
    const repoPath = this.getRepoPath(userId, repoName);

    if (!fs.existsSync(repoPath)) {
      throw new Error('Repository not found');
    }

    try {
      const git = simpleGit(repoPath);
      const logs = await git.log(['-10']);
      return logs.all;
    } catch (error) {
      throw new Error(`Failed to get commit history: ${error.message}`);
    }
  }

  // Write file to repository
  async writeFile(userId, repoName, filePath, content) {
    const repoPath = this.getRepoPath(userId, repoName);
    const fullPath = path.join(repoPath, filePath);

    if (!fs.existsSync(repoPath)) {
      throw new Error('Repository not found');
    }

    try {
      // Create directories if they don't exist
      const dir = path.dirname(fullPath);
      fs.mkdirSync(dir, { recursive: true });

      // Write file
      fs.writeFileSync(fullPath, content);

      return { success: true, filePath };
    } catch (error) {
      throw new Error(`Failed to write file: ${error.message}`);
    }
  }

  // Read file from repository
  async readFile(userId, repoName, filePath) {
    const repoPath = this.getRepoPath(userId, repoName);
    const fullPath = path.join(repoPath, filePath);

    if (!fs.existsSync(repoPath)) {
      throw new Error('Repository not found');
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      return { filePath, content };
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  // List files in repository
  async listFiles(userId, repoName, dirPath = '') {
    const repoPath = this.getRepoPath(userId, repoName);
    const target = dirPath ? path.join(repoPath, dirPath) : repoPath;

    if (!fs.existsSync(repoPath)) {
      throw new Error('Repository not found');
    }

    try {
      const files = fs.readdirSync(target);
      return files.filter(f => f !== '.git');
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  // Get repository status
  async getStatus(userId, repoName) {
    const repoPath = this.getRepoPath(userId, repoName);

    if (!fs.existsSync(repoPath)) {
      throw new Error('Repository not found');
    }

    try {
      const git = simpleGit(repoPath);
      const status = await git.status();
      return status;
    } catch (error) {
      throw new Error(`Failed to get status: ${error.message}`);
    }
  }

  // Execute git command
  async executeCommand(userId, repoName, command) {
    const repoPath = this.getRepoPath(userId, repoName);

    if (!fs.existsSync(repoPath)) {
      throw new Error('Repository not found');
    }

    try {
      const git = simpleGit(repoPath);
      
      // Split command to get git subcommand
      const parts = command.trim().split(/\s+/);
      const gitCommand = parts[0];
      const args = parts.slice(1);

      let result;

      // Handle different git commands
      if (gitCommand === 'init') {
        const name = args[0] || repoName;
        const initPath = path.join(repoPath, name);
        if (!fs.existsSync(initPath)) {
          fs.mkdirSync(initPath, { recursive: true });
        }
        const newGit = simpleGit(initPath);
        await newGit.init();
        result = `Initialized empty Git repository in ${initPath}`;
      } else if (gitCommand === 'add') {
        if (args.length === 0) {
          throw new Error('Please specify files or use "." to add all');
        }
        await git.add(args);
        result = `Added files: ${args.join(', ')}`;
      } else if (gitCommand === 'commit') {
        const messageIndex = args.findIndex((arg) => arg === '-m');
        if (messageIndex === -1) {
          throw new Error('Commit requires -m flag with message');
        }
        const message = args.slice(messageIndex + 1).join(' ');
        const commitResult = await git.commit(message);
        result = `[master ${commitResult.commit.substring(0, 7)}] ${message}`;
      } else if (gitCommand === 'branch') {
        if (args.length === 0) {
          const branches = await git.branch();
          result = branches.all.map((b) => (b === branches.current ? `* ${b}` : `  ${b}`)).join('\n');
        } else {
          const branchName = args[0];
          await git.checkoutLocalBranch(branchName);
          result = `Created branch ${branchName}`;
        }
      } else if (gitCommand === 'checkout') {
        if (args.length === 0) {
          throw new Error('Please specify a branch name');
        }
        const branchName = args.join(' ');
        
        // Try to checkout, if it fails, create the branch
        try {
          await git.checkout(branchName);
          result = `Switched to branch '${branchName}'`;
        } catch (err) {
          await git.checkoutLocalBranch(branchName);
          result = `Created and switched to new branch '${branchName}'`;
        }
      } else if (gitCommand === 'log') {
        const logs = await git.log(['-10']);
        if (logs.all.length === 0) {
          result = 'No commits yet';
        } else {
          result = logs.all.map((log) => 
            `commit ${log.hash}\nAuthor: ${log.author_name}\nDate: ${log.date}\n\n    ${log.message}`
          ).join('\n\n');
        }
      } else if (gitCommand === 'status') {
        const status = await git.status();
        result = `On branch ${status.current}\n${status.files.map((f) => `${f.working_dir}${f.index} ${f.path}`).join('\n')}`;
      } else if (gitCommand === 'push' || gitCommand === 'pull') {
        result = `${gitCommand.toUpperCase()} is not available in this simulator (local repository only)`;
      } else {
        // Try to execute as raw git command through simpleGit
        result = await git.raw(parts);
      }

      return result || 'Command executed';
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = new GitService();
