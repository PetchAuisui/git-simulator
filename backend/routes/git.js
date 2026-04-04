const express = require('express');
const simpleGit = require('simple-git');
const fs = require('fs-extra');
const path = require('path');

const router = express.Router();

const getGit = (rootPath) => simpleGit(rootPath);

// POST /api/git/init
router.post('/init', async (req, res) => {
    try {
        const gitPath = path.join(req.workspaceRoot, '.git');
        if (await fs.pathExists(gitPath))
            return res.status(400).json({ error: 'Already a git repository' });
        const git = getGit(req.workspaceRoot);
        await git.init();
        res.json({ success: true, message: 'Initialized empty Git repository' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// GET /api/git/status
router.get('/status', async (req, res) => {
    try {
        const gitPath = path.join(req.workspaceRoot, '.git');
        if (!(await fs.pathExists(gitPath))) return res.json({ isRepo: false });
        const git = getGit(req.workspaceRoot);
        const status = await git.status();
        res.json({
            isRepo: true,
            currentBranch: status.current,
            staged: [...new Set([...status.staged, ...status.created])],
            modified: status.modified.concat(status.deleted).filter(
                f => !status.staged.includes(f) && !status.created.includes(f)
            ),
            untracked: status.not_added,
            all: status.files,
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /api/git/add
router.post('/add', async (req, res) => {
    try {
        const { files } = req.body;
        if (!files?.length) return res.status(400).json({ error: 'No files specified to add' });
        await getGit(req.workspaceRoot).add(files);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /api/git/unstage
router.post('/unstage', async (req, res) => {
    try {
        const { files } = req.body;
        if (!files?.length) return res.status(400).json({ error: 'No files specified for unstage' });
        await getGit(req.workspaceRoot).reset(['HEAD', ...files]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /api/git/commit
router.post('/commit', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Commit message is required' });
        const git = getGit(req.workspaceRoot);
        const status = await git.status();
        if (status.staged.length === 0 && status.created.length === 0)
            return res.status(400).json({ error: 'Nothing to commit, working tree clean' });
        const result = await git.commit(message);
        res.json({ success: true, commitId: result.commit, branch: result.branch });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// GET /api/git/log — multi-branch + lane layout
router.get('/log', async (req, res) => {
    try {
        const gitPath = path.join(req.workspaceRoot, '.git');
        if (!(await fs.pathExists(gitPath)))
            return res.json({ commits: [], edges: [], totalLanes: 1, currentBranch: null });

        const git = getGit(req.workspaceRoot);
        const branchSummary = await git.branch();

        // format: HASH|PARENTS|AUTHOR|UNIX_TS|SUBJECT|REFNAMES
        const logRaw = await git.raw([
            'log', '--all', '--topo-order',
            '--pretty=format:%H|%P|%an|%at|%s|%D',
            '--max-count=100',
        ]);

        if (!logRaw.trim()) {
            return res.json({
                commits: [], edges: [], totalLanes: 1,
                currentBranch: branchSummary.current,
                branches: Object.keys(branchSummary.branches),
            });
        }

        // ── Parse log lines ──────────────────────────────────────────────
        const rawCommits = logRaw.trim().split('\n').map(line => {
            const parts = line.split('|');
            const hash = (parts[0] || '').trim();
            const parents = (parts[1] || '').trim().split(' ').filter(Boolean);
            const authorName = (parts[2] || '').trim();
            const ts = parseInt(parts[3] || '0', 10);
            const subject = (parts[4] || '').trim();
            const refs = (parts[5] || '').trim();

            const refList = refs ? refs.split(',').map(r => r.trim()).filter(Boolean) : [];
            const tags = refList.filter(r => r.startsWith('tag: ')).map(r => r.slice(5));
            const branchRefs = refList
                .filter(r => !r.startsWith('tag: ') && r !== 'HEAD')
                .map(r => r.replace(/^HEAD -> /, ''));

            return {
                hash, shortHash: hash.slice(0, 7), parents, author_name: authorName,
                timestamp: ts, date: new Date(ts * 1000).toISOString(),
                message: subject, tags, branchRefs
            };
        }).filter(c => c.hash);

        // ── Lane assignment: greedy, newest → oldest ─────────────────────
        // openLanes = list of { hash, lane } รอ parent มาถึง
        const commitMap = {};
        rawCommits.forEach(c => { commitMap[c.hash] = c; });

        const openLanes = [];
        let nextLane = 0;

        rawCommits.forEach(commit => {
            let lane;
            const waitIdx = openLanes.findIndex(o => o.hash === commit.hash);

            if (waitIdx !== -1) {
                // มี lane รอรับ commit นี้อยู่แล้ว
                lane = openLanes[waitIdx].lane;
                openLanes.splice(waitIdx, 1);
            } else {
                // หา lane ว่างที่ index ต่ำสุด
                const used = new Set(openLanes.map(o => o.lane));
                lane = 0;
                while (used.has(lane)) lane++;
                if (lane >= nextLane) nextLane = lane + 1;
            }

            commit.lane = lane;

            // ลงทะเบียน parent ใน openLanes
            // parent[0] → lane เดิม (สืบทอดสาย)
            // parent[1+] → lane ใหม่ (merge source)
            commit.parents.forEach((pid, idx) => {
                if (!openLanes.find(o => o.hash === pid)) {
                    openLanes.push({ hash: pid, lane: idx === 0 ? lane : nextLane++ });
                }
            });
        });

        // ── Build edges ─────────────────────────────────────────────────
        const rowOf = {};
        rawCommits.forEach((c, i) => { rowOf[c.hash] = i; });

        const edges = [];
        rawCommits.forEach(commit => {
            commit.parents.forEach(pid => {
                if (commitMap[pid] !== undefined) {
                    edges.push({
                        fromHash: commit.hash, fromLane: commit.lane, fromRow: rowOf[commit.hash],
                        toHash: pid, toLane: commitMap[pid].lane, toRow: rowOf[pid],
                    });
                }
            });
        });

        res.json({
            currentBranch: branchSummary.current,
            branches: Object.keys(branchSummary.branches),
            totalLanes: nextLane || 1,
            commits: rawCommits.map((c, i) => ({ ...c, row: i })),
            edges,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;