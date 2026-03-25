// gitState.js — Core Git simulation state manager

class GitRepo {
  constructor() {
    this.reset();
  }

  reset() {
    this.initialized = false;
    this.currentBranch = 'main';
    this.branches = {};       // branchName -> [commitId, ...]
    this.commits = {};        // commitId -> commit object
    this.HEAD = null;
    this.staged = [];
    this.untracked = ['README.md', 'index.html', 'style.css'];
    this.working = [];
    this.stash = [];
    this.tags = {};
    this.remotes = { origin: 'https://github.com/user/my-project.git' };
    this.commitCounter = 0;
    this.hashCtr = 4096;
    this.repoName = 'my-project';
  }

  makeHash() {
    this.hashCtr += Math.floor(Math.random() * 300 + 50);
    return this.hashCtr.toString(16).padStart(7, '0');
  }

  createCommit(msg) {
    const hash = this.makeHash();
    const id = 'c' + (++this.commitCounter);
    const now = new Date();
    this.commits[id] = {
      id, hash, msg,
      parent: this.HEAD,
      branch: this.currentBranch,
      date: now.toISOString(),
      author: 'Developer <dev@example.com>',
    };
    if (!this.branches[this.currentBranch]) {
      this.branches[this.currentBranch] = [];
    }
    this.branches[this.currentBranch].push(id);
    this.HEAD = id;
    return this.commits[id];
  }

  getStatus() {
    return {
      initialized: this.initialized,
      currentBranch: this.currentBranch,
      HEAD: this.HEAD,
      staged: [...this.staged],
      untracked: [...this.untracked],
      stashCount: this.stash.length,
    };
  }

  getGraph() {
    const ids = Object.keys(this.commits).reverse();
    return ids.map(id => {
      const c = this.commits[id];
      const branchTips = Object.entries(this.branches)
        .filter(([, arr]) => arr[arr.length - 1] === id)
        .map(([b]) => b);
      const tagTips = Object.entries(this.tags)
        .filter(([, cid]) => cid === id)
        .map(([t]) => t);
      return {
        ...c,
        isHEAD: id === this.HEAD,
        branchTips,
        tagTips,
      };
    });
  }
}

module.exports = GitRepo;
