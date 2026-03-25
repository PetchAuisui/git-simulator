// server.js — Git Simulator Express API

const express = require('express');
const cors = require('cors');
const GitRepo = require('./gitState');
const { runGitCommand } = require('./gitCommands');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── Session store (in-memory, keyed by sessionId) ───────────────────────────
// In production: replace with Redis or DB-backed sessions
const sessions = new Map();

function getSession(id) {
  if (!sessions.has(id)) {
    sessions.set(id, new GitRepo());
  }
  return sessions.get(id);
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/command
// Body: { sessionId, command }
// Returns: { lines, status, graph }
app.post('/api/command', (req, res) => {
  const { sessionId = 'default', command } = req.body;

  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'command is required' });
  }

  const repo = getSession(sessionId);
  const input = command.trim();

  // Handle non-git commands
  if (!input.startsWith('git ') && input !== 'git') {
    const builtins = handleBuiltin(input, repo);
    if (builtins !== null) {
      return res.json({
        lines: builtins,
        status: repo.getStatus(),
        graph: repo.getGraph(),
      });
    }
    return res.json({
      lines: [
        { text: `command not found: ${input.split(' ')[0]}`, type: 'err' },
        { text: "พิมพ์ help เพื่อดูคำสั่งที่ใช้ได้", type: 'out' },
      ],
      status: repo.getStatus(),
      graph: repo.getGraph(),
    });
  }

  // Parse git command
  const parts = input.split(/\s+/);
  const sub = parts[1];
  const args = parts.slice(2);

  const lines = runGitCommand(repo, sub, args);

  return res.json({
    lines,
    status: repo.getStatus(),
    graph: repo.getGraph(),
  });
});

// GET /api/status/:sessionId
app.get('/api/status/:sessionId', (req, res) => {
  const repo = getSession(req.params.sessionId);
  res.json(repo.getStatus());
});

// GET /api/graph/:sessionId
app.get('/api/graph/:sessionId', (req, res) => {
  const repo = getSession(req.params.sessionId);
  res.json(repo.getGraph());
});

// POST /api/reset/:sessionId
app.post('/api/reset/:sessionId', (req, res) => {
  const repo = getSession(req.params.sessionId);
  repo.reset();
  res.json({ ok: true, status: repo.getStatus(), graph: repo.getGraph() });
});

// GET /api/sessions (admin/debug)
app.get('/api/sessions', (req, res) => {
  res.json({ count: sessions.size, ids: [...sessions.keys()] });
});

// ─── Built-in non-git commands ────────────────────────────────────────────────
function handleBuiltin(input, repo) {
  const parts = input.split(/\s+/);
  const cmd = parts[0];

  if (cmd === 'clear') return [{ text: '__CLEAR__', type: 'clear' }];
  if (cmd === 'help') return buildHelp();
  if (cmd === 'ls') return [{ text: 'README.md  index.html  style.css  .git', type: 'out' }];
  if (cmd === 'pwd') return [{ text: `/home/user/${repo.repoName}`, type: 'out' }];
  if (cmd === 'echo') return [{ text: parts.slice(1).join(' '), type: 'out' }];
  return null; // unknown
}

function buildHelp() {
  const lines = [
    { text: '', type: 'out' },
    { text: '═══ Git Simulator Help ═══', type: 'info' },
    { text: '', type: 'out' },
    { text: 'คำสั่งที่ใช้ได้:', type: 'info' },
  ];
  const cmds = [
    ['git init', 'สร้าง repository ใหม่'],
    ['git status', 'ดูสถานะ working tree'],
    ['git add <file>', 'เพิ่มไฟล์ใน staging area'],
    ['git add .', 'เพิ่มทุกไฟล์'],
    ['git commit -m "msg"', 'บันทึก commit'],
    ['git log', 'ดูประวัติ commit'],
    ['git log --oneline', 'ดูประวัติแบบย่อ'],
    ['git branch', 'ดูรายการ branch'],
    ['git branch <name>', 'สร้าง branch ใหม่'],
    ['git checkout <branch>', 'สลับ branch'],
    ['git checkout -b <branch>', 'สร้างและสลับ branch'],
    ['git merge <branch>', 'รวม branch'],
    ['git stash', 'บันทึก working state ชั่วคราว'],
    ['git tag <name>', 'สร้าง tag'],
    ['git reset HEAD~1', 'ยกเลิก commit ล่าสุด'],
    ['clear', 'เคลียร์หน้าจอ'],
  ];
  cmds.forEach(([c, d]) => {
    lines.push({ text: `  ${c.padEnd(30)} ${d}`, type: 'out' });
  });
  lines.push({ text: '', type: 'out' });
  return lines;
}

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Git Simulator API running at http://localhost:${PORT}`);
  console.log(`   POST /api/command   — run a git command`);
  console.log(`   GET  /api/status/:id — get repo status`);
  console.log(`   GET  /api/graph/:id  — get commit graph`);
  console.log(`   POST /api/reset/:id  — reset session`);
});
