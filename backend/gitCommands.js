// gitCommands.js — Git command execution engine

function runGitCommand(repo, sub, args) {
  const lines = []; // { text, type } — type: out|success|err|info|branch|hash|add

  const out   = (t) => lines.push({ text: t, type: 'out' });
  const ok    = (t) => lines.push({ text: t, type: 'success' });
  const err   = (t) => lines.push({ text: t, type: 'err' });
  const info  = (t) => lines.push({ text: t, type: 'info' });
  const blank = ()  => lines.push({ text: '', type: 'out' });

  if (!sub) {
    err("usage: git <command> [<args>]");
    return lines;
  }

  switch (sub) {
    case 'init':        cmdInit(repo, args, { out, ok, err, info, blank }); break;
    case 'status':      cmdStatus(repo, { out, ok, err, info, blank }); break;
    case 'add':         cmdAdd(repo, args, { out, ok, err, info, blank }); break;
    case 'commit':      cmdCommit(repo, args, { out, ok, err, info, blank }); break;
    case 'branch':      cmdBranch(repo, args, { out, ok, err, info, blank, lines }); break;
    case 'checkout':    cmdCheckout(repo, args, { out, ok, err, info, blank }); break;
    case 'switch':      cmdSwitch(repo, args, { out, ok, err, info, blank }); break;
    case 'merge':       cmdMerge(repo, args, { out, ok, err, info, blank }); break;
    case 'log':         cmdLog(repo, args, { out, ok, err, info, blank, lines }); break;
    case 'diff':        cmdDiff(repo, { out, ok, err, info, blank, lines }); break;
    case 'reset':       cmdReset(repo, args, { out, ok, err, info, blank }); break;
    case 'revert':      cmdRevert(repo, args, { out, ok, err, info, blank }); break;
    case 'stash':       cmdStash(repo, args, { out, ok, err, info, blank }); break;
    case 'tag':         cmdTag(repo, args, { out, ok, err, info, blank }); break;
    case 'remote':      cmdRemote(repo, args, { out, ok, err, info, blank }); break;
    case 'push':        cmdPush(repo, args, { out, ok, err, info, blank }); break;
    case 'pull':        cmdPull(repo, args, { out, ok, err, info, blank }); break;
    case 'fetch':       cmdFetch(repo, { out, ok, err, info, blank }); break;
    case 'clone':       cmdClone(repo, args, { out, ok, err, info, blank }); break;
    case 'config':      cmdConfig(repo, args, { out, ok, err, info, blank }); break;
    case 'show':        cmdShow(repo, args, { out, ok, err, info, blank, lines }); break;
    case 'cherry-pick': cmdCherryPick(repo, args, { out, ok, err, info, blank }); break;
    case 'rebase':      cmdRebase(repo, args, { out, ok, err, info, blank }); break;
    default:
      err(`git: '${sub}' is not a git command. See 'git --help'`);
  }

  return lines;
}

// ─────────────────────────────────────────
// Individual command implementations
// ─────────────────────────────────────────

function requireInit(repo, fn) {
  if (!repo.initialized) { fn.err('fatal: not a git repository'); return false; }
  return true;
}

function cmdInit(repo, args, fn) {
  if (repo.initialized) {
    fn.out(`Reinitialized existing Git repository in ${repo.repoName}/.git/`);
    return;
  }
  repo.initialized = true;
  repo.branches['main'] = [];
  fn.ok(`Initialized empty Git repository in /home/user/${repo.repoName}/.git/`);
  fn.blank();
  fn.info('💡 ขั้นตอนต่อไป: git add <file>  →  git commit -m "message"');
}

function cmdStatus(repo, fn) {
  if (!requireInit(repo, fn)) return;
  fn.lines.push({ text: `On branch ${repo.currentBranch}`, type: 'branch' });
  if (!repo.HEAD) fn.out('No commits yet');
  fn.blank();
  if (repo.staged.length > 0) {
    fn.ok('Changes to be committed:');
    repo.staged.forEach(f => fn.lines.push({ text: `\tnew file:   ${f}`, type: 'add' }));
    fn.blank();
  }
  if (repo.untracked.length > 0) {
    fn.err('Untracked files:');
    repo.untracked.forEach(f => fn.err(`\t${f}`));
    fn.blank();
    fn.out('nothing added to commit but untracked files present (use "git add" to track)');
  }
  if (repo.staged.length === 0 && repo.untracked.length === 0) {
    fn.out('nothing to commit, working tree clean');
  }
}

function cmdAdd(repo, args, fn) {
  if (!requireInit(repo, fn)) return;
  const target = args[0];
  if (!target) { fn.out('Nothing specified, nothing added.'); return; }
  if (target === '.' || target === '-A' || target === '--all') {
    const moved = [...repo.untracked];
    repo.staged.push(...moved);
    repo.untracked = [];
    if (moved.length === 0) fn.out('nothing to add');
    else moved.forEach(f => fn.out(`add '${f}'`));
  } else {
    const idx = repo.untracked.indexOf(target);
    if (idx >= 0) {
      repo.untracked.splice(idx, 1);
      repo.staged.push(target);
      fn.out(`add '${target}'`);
    } else if (repo.staged.includes(target)) {
      fn.out(`'${target}' already in staging area`);
    } else {
      fn.err(`pathspec '${target}' did not match any files`);
    }
  }
}

function cmdCommit(repo, args, fn) {
  if (!requireInit(repo, fn)) return;
  if (repo.staged.length === 0) { fn.out('nothing to commit, working tree clean'); return; }
  const mIdx = args.indexOf('-m');
  if (mIdx < 0) { fn.err('Aborting commit due to empty commit message.'); fn.out('hint: use -m "your message"'); return; }
  const msg = args.slice(mIdx + 1).join(' ').replace(/^["']|["']$/g, '');
  if (!msg) { fn.err('Aborting commit due to empty commit message.'); return; }
  const c = repo.createCommit(msg);
  const files = [...repo.staged];
  repo.staged = [];
  fn.ok(`[${repo.currentBranch} ${c.hash.slice(0, 7)}] ${msg}`);
  fn.out(` ${files.length} file${files.length > 1 ? 's' : ''} changed`);
  files.forEach(f => fn.out(`  create mode 100644 ${f}`));
}

function cmdBranch(repo, args, fn) {
  if (!requireInit(repo, fn)) return;
  const dIdx = args.findIndex(a => a === '-d' || a === '-D');
  if (dIdx >= 0 && args[dIdx + 1]) {
    const name = args[dIdx + 1];
    if (name === repo.currentBranch) { fn.err(`error: Cannot delete branch '${name}' checked out`); return; }
    if (!repo.branches[name]) { fn.err(`error: branch '${name}' not found`); return; }
    delete repo.branches[name];
    fn.ok(`Deleted branch ${name}.`); return;
  }
  if (args[0] && !args[0].startsWith('-')) {
    const name = args[0];
    if (repo.branches[name]) { fn.err(`fatal: A branch named '${name}' already exists.`); return; }
    repo.branches[name] = [...(repo.branches[repo.currentBranch] || [])];
    fn.ok(`Created branch '${name}'`);
    fn.info(`💡 ใช้ git checkout ${name} เพื่อสลับไปใช้ branch นี้`); return;
  }
  // list
  Object.keys(repo.branches).forEach(b => {
    const cur = b === repo.currentBranch;
    fn.lines.push({ text: `${cur ? '* ' : '  '}${b}${cur ? ' (HEAD)' : ''}`, type: cur ? 'success' : 'branch' });
  });
}

function cmdCheckout(repo, args, fn) {
  if (!requireInit(repo, fn)) return;
  const bIdx = args.indexOf('-b');
  if (bIdx >= 0) {
    const name = args[bIdx + 1];
    if (!name) { fn.err('error: branch name required'); return; }
    if (repo.branches[name]) { fn.err(`fatal: A branch named '${name}' already exists.`); return; }
    repo.branches[name] = [...(repo.branches[repo.currentBranch] || [])];
    repo.currentBranch = name;
    fn.ok(`Switched to a new branch '${name}'`); return;
  }
  const target = args[0];
  if (!target) { fn.err('error: branch name required'); return; }
  if (!repo.branches[target]) { fn.err(`error: pathspec '${target}' did not match any file(s) known to git`); return; }
  repo.currentBranch = target;
  const arr = repo.branches[target];
  repo.HEAD = arr[arr.length - 1] || null;
  fn.ok(`Switched to branch '${target}'`);
}

function cmdSwitch(repo, args, fn) {
  if (!requireInit(repo, fn)) return;
  const cIdx = args.indexOf('-c');
  if (cIdx >= 0) { cmdCheckout(repo, ['-b', args[cIdx + 1]], fn); return; }
  cmdCheckout(repo, args, fn);
}

function cmdMerge(repo, args, fn) {
  if (!requireInit(repo, fn)) return;
  const target = args[0];
  if (!target) { fn.err('merge: no branch name given'); return; }
  if (!repo.branches[target]) { fn.err(`merge: '${target}' - not something we can merge`); return; }
  if (target === repo.currentBranch) { fn.out('Already up to date.'); return; }
  if (!repo.HEAD) { fn.err('error: no commits on current branch'); return; }
  const c = repo.createCommit(`Merge branch '${target}' into ${repo.currentBranch}`);
  fn.ok("Merge made by the 'ort' strategy.");
  fn.out(`[${repo.currentBranch} ${c.hash.slice(0, 7)}] Merge branch '${target}'`);
}

function cmdLog(repo, args, fn) {
  if (!requireInit(repo, fn)) return;
  const commits = Object.values(repo.commits).reverse();
  if (commits.length === 0) { fn.out('fatal: your current branch has no commits yet'); return; }
  const oneline = args.includes('--oneline');
  commits.slice(0, 20).forEach(c => {
    if (oneline) {
      fn.lines.push({ text: `${c.hash.slice(0, 7)} ${c.msg}`, type: 'hash' });
    } else {
      fn.lines.push({ text: `commit ${c.hash}`, type: 'hash' });
      fn.out(`Author: ${c.author}`);
      fn.out(`Date:   ${new Date(c.date).toLocaleString('th-TH')}`);
      fn.blank();
      fn.out(`    ${c.msg}`);
      fn.blank();
    }
  });
}

function cmdDiff(repo, fn) {
  if (!requireInit(repo, fn)) return;
  if (repo.staged.length === 0 && repo.untracked.length === 0) {
    fn.out('(no changes)'); return;
  }
  fn.out('diff --git a/index.html b/index.html');
  fn.out('--- a/index.html');
  fn.out('+++ b/index.html');
  fn.lines.push({ text: '+<h1>Hello World</h1>', type: 'add' });
  fn.lines.push({ text: '-<h1>Hello</h1>', type: 'err' });
}

function cmdReset(repo, args, fn) {
  if (!requireInit(repo, fn)) return;
  const isHardReset = args.includes('--hard');
  if (args.includes('HEAD~1') || args[args.length - 1] === 'HEAD~1') {
    if (!repo.HEAD) { fn.err('fatal: Failed to resolve HEAD as a valid ref'); return; }
    const prev = repo.commits[repo.HEAD];
    repo.HEAD = prev.parent || null;
    const arr = repo.branches[repo.currentBranch];
    if (arr && arr.length > 0) repo.branches[repo.currentBranch] = arr.slice(0, -1);
    const nowAt = repo.HEAD ? repo.commits[repo.HEAD].hash.slice(0, 7) : 'nothing';
    fn.ok(`HEAD is now at ${nowAt}`);
    if (isHardReset) fn.out('Changes discarded (--hard).');
  } else if (repo.staged.length > 0) {
    repo.untracked.push(...repo.staged);
    repo.staged = [];
    fn.ok('Unstaged all files');
  } else {
    fn.out('Already at initial state');
  }
}

function cmdRevert(repo, args, fn) {
  if (!requireInit(repo, fn)) return;
  if (!repo.HEAD) { fn.err('error: no commits to revert'); return; }
  const target = repo.commits[repo.HEAD];
  const c = repo.createCommit(`Revert "${target.msg}"`);
  fn.ok(`[${repo.currentBranch} ${c.hash.slice(0, 7)}] Revert "${target.msg}"`);
}

function cmdStash(repo, args, fn) {
  if (!requireInit(repo, fn)) return;
  const sub = args[0] || 'push';
  if (sub === 'push' || sub === 'save') {
    const entry = { staged: [...repo.staged], working: [...repo.working] };
    repo.stash.push(entry);
    repo.staged = [];
    fn.ok(`Saved working directory and index state WIP on ${repo.currentBranch}: stash@{${repo.stash.length - 1}}`);
  } else if (sub === 'pop') {
    if (repo.stash.length === 0) { fn.err('No stash entries found.'); return; }
    const e = repo.stash.pop();
    repo.staged.push(...e.staged);
    fn.ok('Applied stash@{0} and dropped');
  } else if (sub === 'list') {
    if (repo.stash.length === 0) { fn.out('(empty stash)'); return; }
    repo.stash.forEach((_, i) => fn.out(`stash@{${i}}: WIP on ${repo.currentBranch}`));
  } else if (sub === 'drop') {
    if (repo.stash.length === 0) { fn.err('No stash entry to drop'); return; }
    repo.stash.pop(); fn.ok('Dropped stash@{0}');
  } else {
    fn.err(`error: unknown stash subcommand: '${sub}'`);
  }
}

function cmdTag(repo, args, fn) {
  if (!requireInit(repo, fn)) return;
  if (args.length === 0) {
    const tags = Object.keys(repo.tags);
    if (tags.length === 0) fn.out('(no tags)');
    else tags.forEach(t => fn.out(t));
    return;
  }
  const name = args[0];
  if (!repo.HEAD) { fn.err('fatal: no commits'); return; }
  repo.tags[name] = repo.HEAD;
  fn.ok(`Created tag '${name}' at ${repo.commits[repo.HEAD].hash.slice(0, 7)}`);
}

function cmdRemote(repo, args, fn) {
  const sub = args[0];
  if (!sub || sub === '-v') {
    Object.entries(repo.remotes).forEach(([name, url]) => {
      fn.out(`${name}\t${url} (fetch)`);
      fn.out(`${name}\t${url} (push)`);
    });
  } else if (sub === 'add' && args[1] && args[2]) {
    repo.remotes[args[1]] = args[2];
    fn.ok(`Added remote '${args[1]}'`);
  }
}

function cmdPush(repo, args, fn) {
  if (!requireInit(repo, fn)) return;
  if (!repo.HEAD) { fn.err('error: failed to push some refs (no commits)'); return; }
  const total = Object.keys(repo.commits).length;
  fn.out(`Enumerating objects: ${total}, done.`);
  fn.out(`Counting objects: 100% (${total}/${total}), done.`);
  fn.ok('Writing objects: 100%, done.');
  fn.out(`To ${Object.values(repo.remotes)[0] || 'origin'}`);
  fn.ok(`   ${repo.commits[repo.HEAD].hash.slice(0, 7)}  ${repo.currentBranch} -> ${repo.currentBranch}`);
}

function cmdPull(repo, args, fn) {
  fn.ok('Already up to date.');
}

function cmdFetch(repo, fn) {
  const remote = Object.values(repo.remotes)[0] || 'https://github.com/user/repo.git';
  fn.out(`From ${remote}`);
  fn.out(` * branch            main     -> FETCH_HEAD`);
}

function cmdClone(repo, args, fn) {
  const url = args[0] || 'https://github.com/user/repo.git';
  const name = url.split('/').pop().replace('.git', '');
  fn.out(`Cloning into '${name}'...`);
  fn.out('remote: Enumerating objects: 10, done.');
  fn.out('remote: Counting objects: 100% (10/10), done.');
  fn.ok('Resolving deltas: done.');
}

function cmdConfig(repo, args, fn) {
  if (args[0] === '--list') {
    fn.out('user.name=Developer');
    fn.out('user.email=dev@example.com');
    fn.out('core.editor=vim'); return;
  }
  fn.ok(`git config ${args.join(' ')}: done`);
}

function cmdShow(repo, args, fn) {
  if (!repo.HEAD) { fn.err('fatal: not a git repository (or no commits)'); return; }
  const c = repo.commits[repo.HEAD];
  fn.lines.push({ text: `commit ${c.hash}`, type: 'hash' });
  fn.out(`Author: ${c.author}`);
  fn.out(`Date:   ${new Date(c.date).toLocaleString('th-TH')}`);
  fn.blank();
  fn.out(`    ${c.msg}`);
}

function cmdCherryPick(repo, args, fn) {
  if (!requireInit(repo, fn)) return;
  if (!args[0]) { fn.err('error: bad revision'); return; }
  const c = repo.createCommit(`cherry-pick: ${args[0]}`);
  fn.ok(`[${repo.currentBranch} ${c.hash.slice(0, 7)}] cherry-pick: ${args[0]}`);
}

function cmdRebase(repo, args, fn) {
  if (!requireInit(repo, fn)) return;
  if (!args[0]) { fn.err('error: no branch name given'); return; }
  fn.ok(`Successfully rebased and updated refs/heads/${repo.currentBranch}.`);
}

module.exports = { runGitCommand };
