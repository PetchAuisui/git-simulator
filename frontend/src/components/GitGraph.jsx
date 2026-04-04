import React, { useEffect, useRef, useCallback } from 'react';
import { GitCommit, User, Calendar } from 'lucide-react';

// ── สีแต่ละ lane ──────────────────────────────────────────────────────────
const LANE_COLORS = [
  '#f97316', // orange  (lane 0 — branch หลัก)
  '#3b82f6', // blue
  '#10b981', // emerald
  '#a855f7', // purple
  '#ef4444', // red
  '#eab308', // yellow
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
  '#f43f5e', // rose
];

const color = (lane) => LANE_COLORS[lane % LANE_COLORS.length];

// ── Canvas graph (เฉพาะส่วนเส้น + node) ─────────────────────────────────
function GraphCanvas({ commits, edges, totalLanes, hoveredHash, onHover }) {
  const canvasRef = useRef(null);

  const ROW_H = 56;   // ต้องตรงกับ card height
  const LANE_W = 20;
  const PAD_X = 12;
  const PAD_Y = 28;   // เว้นบนให้ card แรก center
  const R = 5;

  const getX = (lane) => PAD_X + lane * LANE_W + LANE_W / 2;
  const getY = (row) => PAD_Y + row * ROW_H + ROW_H / 2;

  const W = PAD_X * 2 + Math.max(totalLanes, 1) * LANE_W;
  const H = PAD_Y * 2 + commits.length * ROW_H;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !commits.length) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    // ── วาดเส้น edges ────────────────────────────────────────────────
    edges.forEach(e => {
      const x1 = getX(e.fromLane), y1 = getY(e.fromRow);
      const x2 = getX(e.toLane), y2 = getY(e.toRow);
      const edgeColor = color(e.toLane);

      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();

      if (x1 === x2) {
        // เส้นตรง (branch เดียวกัน)
        ctx.moveTo(x1, y1 + R + 1);
        ctx.lineTo(x2, y2 - R - 1);
      } else {
        // bezier curve สำหรับ branch แตก / merge
        const cp = (y1 + y2) / 2;
        ctx.moveTo(x1, y1 + R + 1);
        ctx.bezierCurveTo(x1, cp, x2, cp, x2, y2 - R - 1);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // ── วาด nodes ────────────────────────────────────────────────────
    commits.forEach(commit => {
      const cx = getX(commit.lane);
      const cy = getY(commit.row);
      const c = color(commit.lane);
      const isHovered = commit.hash === hoveredHash;
      const isLatest = commit.row === 0;
      const isMerge = commit.parents.length > 1;

      // glow ring
      if (isLatest || isHovered) {
        ctx.beginPath();
        ctx.arc(cx, cy, R + 4, 0, Math.PI * 2);
        ctx.fillStyle = c;
        ctx.globalAlpha = isHovered ? 0.35 : 0.18;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // วงกลมหลัก
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = isMerge ? c : '#0f172a';
      ctx.strokeStyle = c;
      ctx.lineWidth = isHovered ? 2.5 : 2;
      ctx.fill();
      ctx.stroke();

      // จุดกลาง (non-merge)
      if (!isMerge) {
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = c;
        ctx.fill();
      }
    });
  }, [commits, edges, totalLanes, hoveredHash, W, H]);

  // ── Hover detection ───────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = commits.find(c => {
      const dx = mx - getX(c.lane);
      const dy = my - getY(c.row);
      return Math.hypot(dx, dy) < 14;
    });
    onHover(hit?.hash ?? null);
  }, [commits, onHover]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', flexShrink: 0, width: W, minHeight: H }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => onHover(null)}
    />
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
// รับ prop เดิมที่ App.jsx ส่งมา: commits (array จาก /api/git/log)
// ถ้า backend ยังเป็นของเก่า (ไม่มี lane/edges) จะ fallback เป็น single-lane
export default function GitGraph({ commits: rawCommits }) {
  const [hoveredHash, setHoveredHash] = React.useState(null);

  // ── ตรวจว่า backend ส่ง lane มาด้วยหรือเปล่า ─────────────────────────
  // ถ้ายังไม่มี (develop branch เดิม) → assign lane = 0 ทั้งหมด
  const commits = React.useMemo(() => {
    if (!rawCommits?.length) return [];
    return rawCommits.map((c, i) => ({
      ...c,
      lane: c.lane ?? 0,
      row: c.row ?? i,
      parents: c.parents ?? [],
    }));
  }, [rawCommits]);

  // ── สร้าง edges จาก commits (ถ้า backend ไม่ส่ง edges มา) ───────────
  const edges = React.useMemo(() => {
    if (!commits.length) return [];
    const byHash = {};
    commits.forEach(c => { byHash[c.hash] = c; });
    const result = [];
    commits.forEach(c => {
      (c.parents || []).forEach(pid => {
        if (byHash[pid]) {
          result.push({
            fromHash: c.hash, fromLane: c.lane, fromRow: c.row,
            toHash: pid, toLane: byHash[pid].lane, toRow: byHash[pid].row,
          });
        }
      });
    });
    return result;
  }, [commits]);

  const totalLanes = React.useMemo(
    () => Math.max(1, ...commits.map(c => c.lane + 1)),
    [commits]
  );

  // ── Empty state ───────────────────────────────────────────────────────
  if (!commits.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800/50 border-dashed m-4">
        <GitCommit size={48} className="mb-4 opacity-20" />
        <p className="text-sm">No commit history yet.</p>
        <p className="text-xs mt-2 text-slate-600 font-mono italic">
          Make your first commit to see the graph!
        </p>
      </div>
    );
  }

  // ── Branch legend ─────────────────────────────────────────────────────
  // สร้าง map lane → branch name จาก branchRefs
  const laneNames = {};
  commits.forEach(c => {
    if (c.branchRefs?.length && !(c.lane in laneNames)) {
      laneNames[c.lane] = c.branchRefs[0];
    }
  });

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/50 pb-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="p-1 px-1.5 bg-orange-500/10 text-orange-400 rounded-md border border-orange-500/20 shadow-sm shadow-orange-500/10">
            GRAPH
          </span>
          VISUAL COMMIT LOG
        </h3>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700/50">
          {commits.length} COMMITS
        </span>
      </div>

      {/* ── Branch legend ── */}
      {Object.keys(laneNames).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Object.entries(laneNames).map(([lane, name]) => (
            <span
              key={lane}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{
                background: color(+lane) + '18',
                border: `1px solid ${color(+lane)}40`,
                color: color(+lane),
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ background: color(+lane) }}
              />
              {name}
            </span>
          ))}
        </div>
      )}

      {/* ── Graph + Cards (scroll) ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
        <div className="flex">

          {/* Canvas: เส้น + node */}
          <div className="relative flex-shrink-0" style={{ zIndex: 2 }}>
            <GraphCanvas
              commits={commits}
              edges={edges}
              totalLanes={totalLanes}
              hoveredHash={hoveredHash}
              onHover={setHoveredHash}
            />
          </div>

          {/* Commit cards */}
          <div className="flex-1 min-w-0">
            {commits.map((commit, idx) => {
              const isLatest = idx === 0;
              const isHovered = commit.hash === hoveredHash;
              const laneColor = color(commit.lane);

              return (
                <div
                  key={commit.hash}
                  style={{ height: 56 }}
                  className="flex items-center px-2"
                  onMouseEnter={() => setHoveredHash(commit.hash)}
                  onMouseLeave={() => setHoveredHash(null)}
                >
                  <div
                    className="w-full rounded-xl border transition-all duration-150 cursor-default"
                    style={{
                      background: isHovered
                        ? 'rgba(255,255,255,0.06)'
                        : isLatest
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(255,255,255,0.015)',
                      borderColor: isHovered
                        ? laneColor + '55'
                        : isLatest
                          ? 'rgba(255,255,255,0.12)'
                          : 'rgba(255,255,255,0.05)',
                      borderLeftWidth: isLatest ? 2 : 1,
                      borderLeftColor: isLatest ? laneColor : undefined,
                    }}
                  >
                    {/* Top row: hash · author · branch refs · date */}
                    <div className="flex items-center justify-between px-3 pt-2 pb-0.5 gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        {/* Hash */}
                        <span
                          className="font-mono text-[11px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0"
                          style={{
                            background: isLatest ? laneColor + '28' : 'rgba(255,255,255,0.07)',
                            color: isLatest ? laneColor : '#64748b',
                          }}
                        >
                          {commit.shortHash}
                        </span>

                        {/* Author */}
                        <span className="flex items-center gap-1 text-[11px] text-slate-500 flex-shrink-0">
                          <User size={10} />
                          {commit.author_name}
                        </span>

                        {/* Branch refs */}
                        {(commit.branchRefs || []).slice(0, 2).map(ref => (
                          <span
                            key={ref}
                            className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                            style={{
                              background: laneColor + '1a',
                              color: laneColor,
                              border: `1px solid ${laneColor}35`,
                            }}
                          >
                            {ref}
                          </span>
                        ))}

                        {/* Tags */}
                        {(commit.tags || []).map(tag => (
                          <span
                            key={tag}
                            className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25"
                          >
                            🏷 {tag}
                          </span>
                        ))}
                      </div>

                      {/* Date */}
                      <span className="flex items-center gap-1 text-[10px] text-slate-600 flex-shrink-0">
                        <Calendar size={10} />
                        {new Date(commit.date).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Commit message */}
                    <div className="px-3 pb-2 flex items-center justify-between gap-2">
                      <span
                        className="text-[12px] font-semibold truncate"
                        style={{ color: isLatest ? '#f1f5f9' : '#94a3b8' }}
                      >
                        {commit.message}
                      </span>
                      {isLatest && (
                        <span
                          className="text-[9px] font-black tracking-widest flex-shrink-0 uppercase"
                          style={{ color: laneColor + 'aa' }}
                        >
                          LATEST
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}