// src/pages/Dashboard.jsx
import { useEffect, useState, useRef, useMemo } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const BASE = import.meta.env.BASE_URL;

/** Prefix relative backend paths with API_BASE so Vite dev server doesn’t intercept them. */
function apiUrl(u) {
  if (!u) return null;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/api/")) return u;
  if (u.startsWith("/report/") || u.startsWith("/download/")) return `${API_BASE}${u}`;
  return `${API_BASE}${u}`;
}

function AuthorizedFetch(path, opts = {}) {
  const t = localStorage.getItem("safedocs_token");
  return fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      Authorization: t ? `Bearer ${t}` : "",
    },
  });
}

// Helpers to download with Authorization (anchors can't add headers)
function authHeaders() {
  const t = localStorage.getItem("safedocs_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function filenameFromHeaders(headers, fallback) {
  const cd = headers.get("content-disposition") || "";
  const mStar = /filename\*=(?:UTF-8'')?("?)([^";]+)\1/i.exec(cd);
  if (mStar && mStar[2]) return decodeURIComponent(mStar[2]);
  const m = /filename="?([^"]+)"?/i.exec(cd);
  if (m && m[1]) return decodeURIComponent(m[1]);
  return fallback;
}

function extOf(name = "") {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i) : "";
}

async function downloadViaFetch(url, fallbackName, overrideMime) {
  const resp = await fetch(url, { method: "GET", headers: { ...authHeaders() } });
  if (!resp.ok) {
    let body = "";
    try { body = await resp.text(); } catch {}
    throw new Error(`Download failed (${resp.status}). ${body}`);
  }
  const blob = await resp.blob();
  const filename = filenameFromHeaders(resp.headers, fallbackName);
  const mime = overrideMime || blob.type || "application/octet-stream";
  const fixed = blob.type ? blob : new Blob([blob], { type: mime });

  const a = document.createElement("a");
  const href = URL.createObjectURL(fixed);
  a.href = href;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-1 text-3xl font-extrabold">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

/* ------------------------------- Chart utils ------------------------------- */
function useContainerSize() {
  const ref = useRef(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry?.contentRect?.width) setW(entry.contentRect.width);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return { ref, width: w };
}

function summarizeRisk(items) {
  const scores = items.map(x => +(+x.risk_score || 0));
  if (scores.length === 0) {
    return { avg: 0, median: 0, max: 0, highPct: 0, count: 0 };
  }
  const sum = scores.reduce((a, b) => a + b, 0);
  const avg = sum / scores.length;
  const sorted = [...scores].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const max = Math.max(...scores);
  // "High risk" = verdict malicious OR score >= 0.5 (adjust if your backend uses a different threshold)
  const highCount = items.filter(x => (x.verdict === "malicious") || ((+x.risk_score || 0) >= 0.5)).length;
  const highPct = highCount / scores.length;
  return { avg, median, max, highPct, count: scores.length };
}

function buildLinePath(points, w, h, pad) {
  if (points.length === 0) return "";
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;

  const xy = points.map((p, i) => {
    const x = pad.left + i * step;
    const y = pad.top + (1 - Math.min(1, Math.max(0, p.y))) * innerH;
    return [x, y];
  });

  return xy.reduce((acc, [x, y], i) => {
    return acc + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
  }, "");
}

/* --------------------------------- Page ---------------------------------- */
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState(null);
  const vidRef = useRef(null);

  async function load() {
    setErr(null);
    try {
      const a = await AuthorizedFetch(`/me/stats`);
      if (!a.ok) throw new Error("Failed loading stats");
      const s = await a.json();
      setStats(s);

      // pull more than 10 so the chart looks better; backend can ignore/limit safely
      const b = await AuthorizedFetch(`/me/scans?limit=40`);
      if (!b.ok) throw new Error("Failed loading scans");
      const j = await b.json();
      setItems(j.items || []);
    } catch (e) {
      setErr(e.message || "Failed to load dashboard");
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { vidRef.current?.play().catch(() => {}); }, []);

  // Prepare chart data (oldest -> newest)
  const recent = useMemo(() => {
    const arr = [...items].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return arr.slice(-30); // cap for visual clarity
  }, [items]);

  const summary = useMemo(() => summarizeRisk(recent), [recent]);

  const points = useMemo(() => {
    return recent.map(r => ({
      y: +(+r.risk_score || 0),        // 0..1
      verdict: r.verdict,
      filename: r.filename || "document",
      when: new Date(r.created_at),
    }));
  }, [recent]);

  /* ------------------------------- Chart dims ------------------------------ */
  const { ref: chartRef, width: chartW } = useContainerSize();
  const W = Math.max(560, chartW);   // responsive width
  const H = 240;
  const PAD = { left: 40, right: 16, top: 14, bottom: 26 };

  const path = useMemo(() => buildLinePath(points, W, H, PAD), [points, W, H]);
  const xStep = points.length > 1 ? (W - PAD.left - PAD.right) / (points.length - 1) : 0;

  return (
    <div className="relative min-h-screen text-white">
      {/* Landing-style background */}
      <video
        ref={vidRef}
        className="pointer-events-none fixed inset-0 -z-30 h-full w-full object-cover opacity-30"
        src={`${BASE}banneranimation.mp4`}
        autoPlay
        muted
        loop
        playsInline
        poster={`${BASE}bannerBackground.png`}
        style={{ filter: "brightness(0.9) contrast(1.05)" }}
      />
      <div className="fixed inset-0 -z-20 bg-black/40" />
      <div
        className="absolute inset-0 -z-10 bg-repeat opacity-45"
        style={{
          backgroundImage: `url(${BASE}polygonScatter.png)`,
          backgroundSize: "480px",
          backgroundPosition: "center top",
          filter: "brightness(1.4) contrast(1.4)",
        }}
      />

      <section className="relative z-10 p-6 max-w-6xl mx-auto">
        {/* Contact.jsx-matched heading */}
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
          <span className="text-white">Your </span>
          <span className="text-blue-500">Dashboard</span>
        </h1>

        {err && <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-rose-300">{err}</div>}

        {/* Top stat row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Scans" value={stats?.total_scans ?? 0} />
          <StatCard label="Benign" value={stats?.benign ?? 0} />
          <StatCard label="Malicious" value={stats?.malicious ?? 0} />
          <StatCard label="Last Activity" value={stats?.last_activity ? new Date(stats.last_activity).toLocaleString() : "—"} />
        </div>

        {/* ------------------------ Risk analysis + chart ------------------------ */}
        <div className="mt-6 rounded-xl border border-white/10 bg-slate-900/60 p-4">
          <div className="mb-3 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">Risk Analysis (last {summary.count || 0} scans)</div>
              <div className="text-xs text-slate-400">Computed from the same results shown in “Recent Scans”.</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full md:w-auto">
              <div className="rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2">
                <div className="text-[11px] text-slate-400">Avg Risk</div>
                <div className="text-xl font-bold">{summary.avg.toFixed(2)}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2">
                <div className="text-[11px] text-slate-400">Median</div>
                <div className="text-xl font-bold">{summary.median.toFixed(2)}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2">
                <div className="text-[11px] text-slate-400">Max</div>
                <div className="text-xl font-bold">{summary.max.toFixed(2)}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2">
                <div className="text-[11px] text-slate-400">High-Risk Rate</div>
                <div className="text-xl font-bold">{(summary.highPct * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div ref={chartRef} className="w-full">
            {points.length === 0 ? (
              <div className="h-40 grid place-items-center text-slate-500 text-sm">No scans yet to chart.</div>
            ) : (
              <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Risk score trend line chart">
                {/* Axes */}
                <g>
                  {/* Y ticks 0..1 */}
                  {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                    const y = PAD.top + (1 - t) * (H - PAD.top - PAD.bottom);
                    return (
                      <g key={t}>
                        <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} className="stroke-white/10" />
                        <text x={PAD.left - 8} y={y + 4} className="fill-slate-400 text-[10px]" textAnchor="end">
                          {t.toFixed(2)}
                        </text>
                      </g>
                    );
                  })}
                  {/* X labels: first, middle, last */}
                  {(() => {
                    const idxs = [0, Math.floor(points.length / 2), points.length - 1];
                    const labels = Array.from(new Set(idxs)).map(i => {
                      const x = PAD.left + i * xStep;
                      const dt = points[i].when;
                      const label = dt.toLocaleString();
                      return { i, x, label };
                    });
                    const baseY = H - PAD.bottom + 14;
                    return labels.map(({ i, x, label }) => (
                      <text key={i} x={x} y={baseY} className="fill-slate-400 text-[10px]" textAnchor="middle">
                        {label}
                      </text>
                    ));
                  })()}
                </g>

                {/* Threshold line @ 0.5 */}
                {(() => {
                  const y = PAD.top + (1 - 0.5) * (H - PAD.top - PAD.bottom);
                  return (
                    <g>
                      <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} className="stroke-rose-400/50" strokeDasharray="4 4" />
                      <text x={W - PAD.right} y={y - 6} textAnchor="end" className="fill-rose-400/70 text-[10px]">
                        Threshold 0.50
                      </text>
                    </g>
                  );
                })()}

                {/* Line */}
                <path d={path} className="fill-none stroke-indigo-400" strokeWidth="2" />

                {/* Points with native <title> tooltip */}
                {points.map((p, i) => {
                  const x = PAD.left + i * xStep;
                  const y = PAD.top + (1 - Math.min(1, Math.max(0, p.y))) * (H - PAD.top - PAD.bottom);
                  const fill = p.verdict === "malicious" || p.y >= 0.5 ? "#fb7185" /* rose-400 */ : "#34d399" /* emerald-400 */;
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r="3" fill={fill}>
                        <title>
                          {`${p.filename}\n${p.when.toLocaleString()}\nRisk: ${p.y.toFixed(2)} • ${p.verdict}`}
                        </title>
                      </circle>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* ---------------------------- Recent scans ---------------------------- */}
        <div className="mt-6 rounded-xl border border-white/10 bg-slate-900/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-slate-400">Recent Scans</div>
            <button onClick={load} className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-white/10">Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400">
                  <th className="text-left py-2">When</th>
                  <th className="text-left">File</th>
                  <th className="text-left">Verdict</th>
                  <th className="text-left">Risk</th>
                  <th className="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-500">No scans yet.</td>
                  </tr>
                )}
                {items.map((r) => (
                  <tr key={r.scan_id} className="border-t border-white/5">
                    <td className="py-2">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="truncate max-w-[240px]">{r.filename}</td>
                    <td className={r.verdict === "malicious" ? "text-rose-400" : "text-emerald-400"}>{r.verdict}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span>{(r.risk_score ?? 0).toFixed(2)}</span>
                        {/* tiny severity bar */}
                        <div className="h-2 w-24 bg-white/10 rounded">
                          <div
                            className={`h-2 rounded ${((r.risk_score ?? 0) >= 0.5 || r.verdict === "malicious") ? "bg-rose-400" : "bg-emerald-400"}`}
                            style={{ width: `${Math.min(100, Math.max(0, (r.risk_score ?? 0) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="space-x-2">
                      {r.report_url && (
                        <button
                          className="underline text-indigo-400"
                          onClick={() =>
                            downloadViaFetch(
                              apiUrl(r.report_url),
                              (r.filename ? r.filename.replace(/\.[^.]+$/, "") : "document") + ".report.json",
                              "application/json"
                            ).catch((e) => alert(String(e)))
                          }
                        >
                          Report
                        </button>
                      )}
                      {r.download_clean_url && (
                        <button
                          className="underline text-indigo-400"
                          onClick={() => {
                            const base = (r.filename ? r.filename.replace(/\.[^.]+$/, "") : "document") + "_clean";
                            const fallback = base + extOf(r.filename || "");
                            downloadViaFetch(apiUrl(r.download_clean_url), fallback)
                              .catch((e) => alert(String(e)));
                          }}
                        >
                          Clean file
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
