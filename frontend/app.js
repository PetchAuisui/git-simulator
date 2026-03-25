// app.js — Git Simulator Frontend
// Communicates with the Express backend at /api/command

// ─── Config ──────────────────────────────────────────────────
const API_BASE = 'http://localhost:3001/api';
const SESSION_ID = 'session-' + Math.random().toString(36).slice(2, 9);

// ─── Branch color palette ─────────────────────────────────────
const BRANCH_COLORS = [
  '#58a6ff','#3fb950','#bc8cff','#f778ba',
  '#ff7b72','#39d353','#d29922','#56d364',
];
const colorMap = {};
let colorIdx = 0;
function getBranchColor(b) {
  if (!colorMap[b]) colorMap[b] = BRANCH_COLORS[colorIdx++ % BRANCH_COLORS.length];
  return colorMap[b];
}

// ─── DOM refs ────────────────────────────────────────────────
const outputEl   = document.getElementById('output');
const inputEl    = document.getElementById('cmd-input');
const graphWrap  = document.getElementById('graph-wrap');
const connEl     = document.getElementById('s-conn');

// ─── Output helpers ──────────────────────────────────────────
function appendLine(text, cls) {
  const d = document.createElement('div');
  d.className = cls;
  d.textContent = text;
  outputEl.appendChild(d);
  outputEl.scrollTop = outputEl.scrollHeight;
}

function printCmd(cmd) {
  const d = document.createElement('div');
  d.innerHTML =
    `<span class="line-prompt">$ </span>` +
    `<span class="line-cmd">${escH(cmd)}</span>`;
  outputEl.appendChild(d);
  outputEl.scrollTop = outputEl.scrollHeight;
}

function printLines(lines) {
  lines.forEach(({ text, type }) => {
    if (type === 'clear') { outputEl.innerHTML = ''; return; }
    const cls = {
      out:     'line-out',
      err:     'line-err',
      success: 'line-success',
      info:    'line-info',
      branch:  'line-branch',
      hash:    'line-hash',
      add:     'line-add',
    }[type] || 'line-out';
    appendLine(text, cls);
  });
}

function showLoading() {
  const d = document.createElement('div');
  d.className = 'line-out';
  d.id = 'loading-indicator';
  d.innerHTML =
    `<span class="loading-dot"></span>` +
    `<span class="loading-dot"></span>` +
    `<span class="loading-dot"></span>`;
  outputEl.appendChild(d);
  outputEl.scrollTop = outputEl.scrollHeight;
}
function hideLoading() {
  const el = document.getElementById('loading-indicator');
  if (el) el.remove();
}

function escH(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── API ─────────────────────────────────────────────────────
async function sendCommand(cmd) {
  showLoading();
  try {
    const res = await fetch(`${API_BASE}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: SESSION_ID, command: cmd }),
    });
    hideLoading();
    if (!res.ok) {
      appendLine(`API error: ${res.status} ${res.statusText}`, 'line-err');
      return;
    }
    const data = await res.json();
    printLines(data.lines || []);
    if (data.status) updateStatus(data.status);
    if (data.graph)  renderGraph(data.graph);
  } catch (e) {
    hideLoading();
    appendLine(`Network error: ${e.message}`, 'line-err');
    appendLine('ตรวจสอบว่า backend กำลังรันอยู่: cd backend && npm start', 'line-info');
    setConn(false);
  }
}

async function resetSession() {
  try {
    const res = await fetch(`${API_BASE}/reset/${SESSION_ID}`, { method: 'POST' });
    const data = await res.json();
    outputEl.innerHTML = '';
    if (data.status) updateStatus(data.status);
    if (data.graph)  renderGraph(data.graph);
    printWelcome();
    setConn(true);
  } catch (e) {
    appendLine('Reset failed: ' + e.message, 'line-err');
  }
}

async function checkConnection() {
  try {
    const res = await fetch(`${API_BASE}/sessions`, { signal: AbortSignal.timeout(3000) });
    setConn(res.ok);
  } catch {
    setConn(false);
  }
}

function setConn(ok) {
  connEl.textContent = ok ? '⬤ connected' : '⬤ offline';
  connEl.className = 'status-item status-conn ' + (ok ? 'ok' : 'error');
}

// ─── Status bar ──────────────────────────────────────────────
function updateStatus(s) {
  document.getElementById('s-branch').textContent    = s.initialized ? s.currentBranch : '-';
  document.getElementById('s-commits').textContent   = 0; // graph length updated separately
  document.getElementById('s-staged').textContent    = s.staged.length;
  document.getElementById('s-untracked').textContent = s.untracked.length;
}

// ─── Git Graph ───────────────────────────────────────────────
function renderGraph(commits) {
  document.getElementById('s-commits').textContent = commits.length;

  if (commits.length === 0) {
    graphWrap.innerHTML = `
      <div class="empty-graph">
        ยังไม่มี commit<br><br>
        เริ่มต้นด้วย:<br>
        <code>git init</code><br>
        <code>git add .</code><br>
        <code>git commit -m "first commit"</code>
      </div>`;
    return;
  }

  // Assign lane per branch (preserves insertion order)
  const lanes = {};
  let laneCount = 0;
  commits.forEach(c => {
    if (lanes[c.branch] === undefined) lanes[c.branch] = laneCount++;
  });

  const laneW  = 16;
  const svgW   = Math.max(laneCount, 1) * laneW + 4;
  let html = '';

  commits.forEach((c, idx) => {
    const lane  = lanes[c.branch] || 0;
    const color = getBranchColor(c.branch);
    const cx    = lane * laneW + 8;
    const cy    = 15;

    let svgContent = '';
    // vertical line up
    if (idx > 0) {
      svgContent += `<line x1="${cx}" y1="0" x2="${cx}" y2="${cy}" stroke="${color}" stroke-width="2" opacity=".6"/>`;
    }
    // vertical line down
    if (idx < commits.length - 1) {
      svgContent += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="30" stroke="${color}" stroke-width="2" opacity=".6"/>`;
    }
    // node circle
    const fill   = c.isHEAD ? color : 'var(--bg)';
    const glow   = c.isHEAD ? `<circle cx="${cx}" cy="${cy}" r="8" fill="none" stroke="${color}" stroke-width="1" opacity=".35"/>` : '';
    svgContent += `${glow}<circle cx="${cx}" cy="${cy}" r="4.5" fill="${fill}" stroke="${color}" stroke-width="1.8"/>`;

    // badges
    const branchBadges = (c.branchTips || []).map(b => {
      const bc  = getBranchColor(b);
      const cur = b === (window._currentBranch || '');
      return `<span class="g-badge" style="background:${bc}20;color:${bc};border:1px solid ${bc}40">${cur ? 'HEAD → ' : ''}${escH(b)}</span>`;
    }).join('');

    const tagBadges = (c.tagTips || []).map(t =>
      `<span class="g-badge" style="background:#d2992220;color:#d29922;border:1px solid #d2992240">🏷 ${escH(t)}</span>`
    ).join('');

    html += `
      <div class="graph-row">
        <svg width="${svgW}" height="30" style="flex-shrink:0">${svgContent}</svg>
        <div class="graph-info">
          <span class="g-hash">${c.hash.slice(0,7)}</span>
          <span class="g-msg">${escH(c.msg)}</span>
          ${branchBadges}${tagBadges}
        </div>
      </div>`;
  });

  graphWrap.innerHTML = html;
}

// ─── Tab switching ────────────────────────────────────────────
window.switchTab = function(tab, el) {
  document.querySelectorAll('.tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  el.setAttribute('aria-selected','true');
  document.getElementById('tab-' + tab).classList.add('active');
};

// ─── Cheatsheet ──────────────────────────────────────────────
const CHEAT_DATA = [
  { title: '🚀 เริ่มต้น (Setup)', cmds: [
    { code: 'git init',          desc: 'สร้าง repository ใหม่',          run: 'git init' },
    { code: 'git clone <url>',   desc: 'โคลน repository จาก remote',    run: 'git clone https://github.com/user/repo.git' },
    { code: 'git config --list', desc: 'ดู configuration ทั้งหมด',       run: 'git config --list' },
  ]},
  { title: '📁 Staging & Commits', cmds: [
    { code: 'git status',          desc: 'ดูสถานะ working tree',             run: 'git status' },
    { code: 'git add .',           desc: 'เพิ่มทุกไฟล์ใน staging',          run: 'git add .' },
    { code: 'git add <file>',      desc: 'เพิ่มไฟล์ที่ระบุ',                run: 'git add README.md' },
    { code: 'git commit -m "msg"', desc: 'บันทึก commit พร้อม message',       run: 'git commit -m "feat: add new feature"' },
    { code: 'git diff',            desc: 'ดูความต่างของไฟล์',               run: 'git diff' },
    { code: 'git log --oneline',   desc: 'ดูประวัติ commit แบบย่อ',         run: 'git log --oneline' },
    { code: 'git show',            desc: 'ดูรายละเอียด commit ล่าสุด',      run: 'git show' },
  ]},
  { title: '🌿 Branches', cmds: [
    { code: 'git branch',          desc: 'ดูรายการ branch ทั้งหมด',         run: 'git branch' },
    { code: 'git branch <name>',   desc: 'สร้าง branch ใหม่',              run: 'git branch feature/login' },
    { code: 'git checkout <b>',    desc: 'สลับไปยัง branch',               run: 'git checkout main' },
    { code: 'git checkout -b <n>', desc: 'สร้างและสลับ branch ใหม่',        run: 'git checkout -b feature/signup' },
    { code: 'git switch <branch>', desc: 'สลับ branch (คำสั่งใหม่)',         run: 'git switch main' },
    { code: 'git merge <branch>',  desc: 'รวม branch เข้าด้วยกัน',          run: 'git merge feature/login' },
    { code: 'git branch -d <n>',   desc: 'ลบ branch',                       run: 'git branch -d feature/login' },
  ]},
  { title: '⏪ Undo & Reset', cmds: [
    { code: 'git reset HEAD~1',       desc: 'ยกเลิก commit ล่าสุด (soft)',    run: 'git reset HEAD~1' },
    { code: 'git reset --hard HEAD~1',desc: 'ยกเลิก commit + ทิ้ง changes',   run: 'git reset --hard HEAD~1' },
    { code: 'git revert HEAD',        desc: 'สร้าง commit ยกเลิกการเปลี่ยน', run: 'git revert HEAD' },
    { code: 'git stash',              desc: 'บันทึก changes ชั่วคราว',        run: 'git stash' },
    { code: 'git stash pop',          desc: 'นำ stash กลับมา',               run: 'git stash pop' },
    { code: 'git stash list',         desc: 'ดูรายการ stash',                run: 'git stash list' },
  ]},
  { title: '🌐 Remote', cmds: [
    { code: 'git remote',   desc: 'ดู remote repositories',   run: 'git remote' },
    { code: 'git push',     desc: 'ส่ง commits ขึ้น remote',   run: 'git push' },
    { code: 'git pull',     desc: 'ดึง commits จาก remote',   run: 'git pull' },
    { code: 'git fetch',    desc: 'ดึงข้อมูลจาก remote',       run: 'git fetch' },
  ]},
  { title: '🏷 Tags & Advanced', cmds: [
    { code: 'git tag <name>',        desc: 'สร้าง tag',                     run: 'git tag v1.0.0' },
    { code: 'git tag',               desc: 'ดูรายการ tag',                  run: 'git tag' },
    { code: 'git rebase <branch>',   desc: 'ย้าย commit บน branch อื่น',    run: 'git rebase main' },
    { code: 'git cherry-pick <hash>',desc: 'นำ commit เฉพาะมาใช้',           run: 'git cherry-pick abc1234' },
  ]},
];

function buildCheatsheet() {
  const el = document.getElementById('cheatsheet');
  CHEAT_DATA.forEach(sec => {
    const section = document.createElement('div');
    section.className = 'cs-section';
    section.innerHTML = `<div class="cs-title">${sec.title}</div>`;
    sec.cmds.forEach(c => {
      const row = document.createElement('div');
      row.className = 'cs-cmd';
      row.title = 'คลิกเพื่อเติมคำสั่งใน terminal';
      row.innerHTML =
        `<span class="cs-code">${escH(c.code)}</span>` +
        `<span class="cs-desc">${c.desc}</span>`;
      row.addEventListener('click', () => {
        inputEl.value = c.run;
        inputEl.focus();
        // Switch to graph tab
        const graphTab = document.querySelector('[data-tab="graph"]');
        if (graphTab) switchTab('graph', graphTab);
      });
      section.appendChild(row);
    });
    el.appendChild(section);
  });
}

// ─── Quick-hint chips ─────────────────────────────────────────
const HINTS = [
  'git init', 'git add .', 'git status',
  'git commit -m "first commit"', 'git branch feature',
  'git checkout -b dev', 'git log --oneline', 'git merge feature',
  'git stash', 'git tag v1.0', 'help', 'clear',
];

function buildHints() {
  const el = document.getElementById('hints');
  HINTS.forEach(h => {
    const chip = document.createElement('span');
    chip.className = 'hint-chip';
    chip.textContent = h;
    chip.addEventListener('click', () => { inputEl.value = h; inputEl.focus(); });
    el.appendChild(chip);
  });
}

// ─── Input handling ───────────────────────────────────────────
const history = [];
let histIdx = -1;

inputEl.addEventListener('keydown', async e => {
  if (e.key === 'Enter') {
    const val = inputEl.value.trim();
    inputEl.value = '';
    if (!val) return;
    history.unshift(val);
    histIdx = -1;
    printCmd(val);
    await sendCommand(val);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (histIdx < history.length - 1) inputEl.value = history[++histIdx];
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (histIdx > 0) inputEl.value = history[--histIdx];
    else { histIdx = -1; inputEl.value = ''; }
  } else if (e.key === 'Tab') {
    e.preventDefault();
    const v = inputEl.value;
    const allCmds = [
      'git init','git status','git add .','git add ','git commit -m ""',
      'git branch','git checkout ','git checkout -b ','git merge ',
      'git log','git log --oneline','git diff','git stash',
      'git stash pop','git stash list','git tag','git push','git pull',
      'git fetch','git remote','git reset HEAD~1','git revert HEAD',
      'git show','git rebase ','git cherry-pick ','help','clear',
    ];
    const match = allCmds.find(c => c.startsWith(v) && c !== v);
    if (match) inputEl.value = match;
  }
});

document.getElementById('btn-reset').addEventListener('click', () => {
  if (confirm('รีเซ็ต session และเริ่มใหม่?')) resetSession();
});

// ─── Welcome message ─────────────────────────────────────────
function printWelcome() {
  const d = document.createElement('div');
  d.className = 'line-welcome';
  d.innerHTML =
    `<strong style="color:var(--blue);font-family:var(--mono);font-size:13px">⬡ Git Terminal Simulator</strong><br>` +
    `<span style="color:var(--muted);font-size:12px">เรียนรู้ Git ผ่านการพิมพ์คำสั่งจริง • frontend + backend แยกกัน</span>`;
  outputEl.appendChild(d);

  appendLine('', 'line-out');
  appendLine('💡 Tips:', 'line-info');
  appendLine('  • พิมพ์ help เพื่อดูรายการคำสั่ง', 'line-out');
  appendLine('  • กด Tab เพื่อ auto-complete', 'line-out');
  appendLine('  • กด ↑↓ เพื่อดูประวัติคำสั่ง', 'line-out');
  appendLine('  • คลิก Quick Commands ด้านล่างเพื่อเติมคำสั่ง', 'line-out');
  appendLine('', 'line-out');
  appendLine('─── เริ่มต้นด้วย: git init ───', 'line-out');
  appendLine('', 'line-out');
}

// ─── Init ────────────────────────────────────────────────────
(async function init() {
  buildCheatsheet();
  buildHints();
  printWelcome();
  await checkConnection();
  inputEl.focus();
})();
