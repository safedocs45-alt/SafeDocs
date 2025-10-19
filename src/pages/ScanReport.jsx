// src/pages/ScanReport.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const BASE = import.meta.env.BASE_URL;

function authHeaders() {
  const t = localStorage.getItem("safedocs_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function apiUrl(u) {
  if (!u) return null;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/api/")) return u;
  if (u.startsWith("/report/") || u.startsWith("/download/")) return `${API_BASE}${u}`;
  return u;
}

function percent(v) {
  const n = typeof v === "number" ? v : 0;
  return Math.round(Math.max(0, Math.min(1, n)) * 100);
}

function humanBytes(n) {
  if (!n && n !== 0) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let val = Number(n) || 0;
  while (val >= 1024 && i < u.length - 1) { val /= 1024; i++; }
  return `${val.toFixed(2)} ${u[i]}`;
}

function Pill({ ok, children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold
      ${ok ? "bg-emerald-600/20 text-emerald-300" : "bg-red-600/20 text-red-300"}`}>
      {children}
    </span>
  );
}
function Bar({ value, color }) {
  const pct = Math.max(0, Math.min(100, (value || 0) * 100));
  return <div className="h-2 w-full rounded-full bg-white/10"><div className={`h-full ${color}`} style={{ width: `${pct}%` }} /></div>;
}

function filenameFromHeaders(headers, fallback) {
  const cd = headers.get("content-disposition") || "";
  const mStar = /filename\*=(?:UTF-8'')?("?)([^";]+)\1/i.exec(cd);
  if (mStar && mStar[2]) return decodeURIComponent(mStar[2]);
  const m = /filename="?([^"]+)"?/i.exec(cd);
  if (m && m[1]) return decodeURIComponent(m[1]);
  return fallback;
}
async function downloadViaFetch(url, fallbackName, overrideMime) {
  const resp = await fetch(url, { method: "GET", headers: { ...authHeaders() } });
  if (!resp.ok) {
    let body = "";
    try { body = await resp.text(); } catch {}
    const err = new Error(`Download failed (${resp.status}). ${body}`);
    err.status = resp.status; err.body = body; throw err;
  }
  const blob = await resp.blob();
  const filename = filenameFromHeaders(resp.headers, fallbackName);
  const mime = overrideMime || blob.type || "application/json";
  const fixed = blob.type ? blob : new Blob([blob], { type: mime });
  const a = document.createElement("a");
  const href = URL.createObjectURL(fixed);
  a.href = href; a.download = filename; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/* ---------- Findings helpers (unchanged) ---------- */
function explainFinding(f) {
  const id = (f.id || f.threat_type || f.title || "").toLowerCase();
  const indicator = f.indicator || f.message || f.description || "";
  if (id.includes("pdf") && id.includes("js")) {
    return "The PDF contains JavaScript or auto-execution hints such as /JavaScript or /OpenAction, which attackers often abuse to run code when the file opens.";
  }
  if (id.includes("vba") || id.includes("macro")) {
    return "The Office document includes a VBA macro (vbaProject.bin). Malicious macros can execute code when you enable content.";
  }
  if (id.includes("embedded") && (indicator.toLowerCase().includes("file") || indicator.toLowerCase().includes("object"))) {
    return "The file contains embedded objects/files, which can hide payloads or links out to the Internet.";
  }
  if (id.includes("rtf") && (indicator.toLowerCase().includes("object") || indicator.toLowerCase().includes("field"))) {
    return "The RTF uses embedded object/field constructs that are frequently abused to launch external content.";
  }
  if (id.includes("suspicious_strings")) {
    return "Suspicious scripting/command strings were found (e.g., JavaScript, shell, or PowerShell patterns).";
  }
  return indicator || "Potentially dangerous construct detected.";
}

function normalizeFinding(f) {
  if (!f || typeof f !== "object") {
    return { title: String(f), message: "", severity: "info", raw: f, explain: "" };
  }
  const title =
    f.id || f.threat_type || f.title || f.name || f.type ||
    (typeof f.message === "string" ? (f.message.length > 40 ? f.message.slice(0,40) + "…" : f.message) : null) || "signal";
  const message =
    f.message || f.indicator || f.description || f.details ||
    (f.action_taken ? `Action: ${f.action_taken}` : "") || "";
  const severity =
    (typeof f.severity === "string" && f.severity) ||
    (typeof f.sev === "string" && f.sev) ||
    (f.level ? String(f.level) : null) || "info";
  return { title: String(title), message: String(message), severity, explain: explainFinding(f), raw: f };
}

function extractFindings(obj) {
  if (!obj || typeof obj !== "object") return [];
  const paths = [
    ["findings"],
    ["report","findings"],
    ["report","report","findings"],
    ["report_doc","findings"],
    ["payload","findings"],
    ["meta","findings"],
    ["report","meta","findings"]
  ];
  for (const p of paths) {
    let n = obj;
    for (const k of p) n = n?.[k];
    if (Array.isArray(n) && n.length) return n;
  }
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (Array.isArray(v) && v.length && typeof v[0] === "object") {
      const keys = Object.keys(v[0] || {});
      const looks = ["id","message","threat_type","indicator","description"].some(x => keys.includes(x));
      if (looks) return v;
    }
  }
  return [];
}

function stripHtmlToText(html) {
  try {
    const div = document.createElement("div");
    div.innerHTML = html;
    return (div.textContent || div.innerText || "").trim();
  } catch {
    return html;
  }
}

export default function ScanReport() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [rawReport, setRawReport] = useState(null);
  const [rawText, setRawText] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const [downErr, setDownErr] = useState("");
  const vidRef = useRef(null);

  useEffect(() => { vidRef.current?.play().catch(() => {}); }, []);

  const result = useMemo(() => {
    if (state?.result) return state.result;
    const raw = localStorage.getItem("safedocs_last_scan");
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
  }, [state]);

  useEffect(() => {
    if (!result || Object.keys(result).length === 0) {
      navigate("/scan", { replace: true });
      return;
    }
    const urlRaw = result.report_api || (result.report_id ? `/report/${result.report_id}.json` : null);
    const url = apiUrl(urlRaw);

    (async () => {
      setRawReport(null); setRawText("");
      if (!url) return;
      try {
        const resp = await fetch(url, { headers: { ...authHeaders() } });
        const ctype = resp.headers.get("content-type") || "";
        if (!resp.ok) {
          const txt = await resp.text().catch(() => "");
          setRawText(`Report fetch failed (${resp.status}).\n${stripHtmlToText(txt)}`);
          return;
        }
        if (ctype.includes("application/json")) {
          const js = await resp.json();
          setRawReport(js);
        } else {
          const txt = await resp.text();
          setRawText(stripHtmlToText(txt));
        }
      } catch (e) {
        setRawText(String(e));
      }
    })();
  }, [result, navigate]);

  const meta = result.meta || result.report?.meta || {};
  const name = state?._client?.originalName || meta.file || result.filename || "Document";
  const sha = result.sha256 || meta.sha256 || "";
  const ext = (name.includes(".") ? name.slice(name.lastIndexOf(".")) : (meta.ext || "")).toLowerCase();

  const score = typeof result.risk_score === "number" ? result.risk_score : (result.report?.risk_score ?? 0);
  const verdict = result.verdict && result.verdict !== "scan_error" ? result.verdict : (score >= 0.5 ? "malicious" : "benign");

  const sigs = result.model_scores || result.signals || result.report?.signals || {};
  const pDL    = sigs.dl    ?? sigs.P_DL    ?? sigs.p_dl ?? 0;
  const pLGBM  = sigs.lgbm  ?? sigs.P_LGBM  ?? sigs.p_lgbm ?? 0;
  const pTree  = sigs.tree  ?? sigs.P_TREE  ?? sigs.p_tree ?? 0;
  const pRules = sigs.rules ?? sigs.P_RULES ?? sigs.p_rules ?? 0;

  const rawFindings = extractFindings(rawReport || result) || [];
  const findings = Array.isArray(rawFindings) ? rawFindings.map(normalizeFinding) : [];

  const synthesized = (() => {
    if (findings.length) return null;
    if (verdict !== "malicious") return null;
    const parts = [];
    if (pRules >= 0.25) parts.push("rule-based indicators");
    if (pDL >= 0.5) parts.push("deep-learning signal");
    if (pTree >= 0.5) parts.push("tree/entropy signal");
    if (pLGBM >= 0.5) parts.push("LGBM probability");
    if (!parts.length) return null;
    return {
      title: "Model-based malicious indicators",
      message: `Flagged based on: ${parts.join(", ")}.`,
      severity: "high",
      explain: "Although no specific construct was listed, the ensemble models strongly agreed this file resembles known malicious patterns.",
      raw: { signals: { pRules, pDL, pTree, pLGBM } },
    };
  })();

  const recommendations =
    Array.isArray(result.recommendations) && result.recommendations.length ? result.recommendations
    : Array.isArray(rawReport?.recommendations) && rawReport.recommendations.length ? rawReport.recommendations
    : [];

  const reportUrl = apiUrl(result.report_api || (result.report_id ? `/report/${result.report_id}.json` : null));
  const cleanUrl  = apiUrl(result.download_api || result.download_clean_url || (rawReport?.clean_id ? `/download/${rawReport.clean_id}` : null));

  const onDownloadReport = async () => {
    setDownErr("");
    const baseName = sha ? sha : (name.replace(/\.[^.]+$/, "") || "report");
    const localFilename = `${baseName}.report.json`;
    if (reportUrl) {
      try { await downloadViaFetch(reportUrl, localFilename, "application/json"); return; }
      catch (e) { /* fallback below */ }
    }
    try {
      const clientReport = {
        ok: true,
        engine: "safedocs-frontend-fallback",
        filename: name,
        original_sha256: sha || null,
        size_bytes: meta.size_bytes || meta.size || result.size,
        content_type: meta.mime_type || result.content_type || "application/octet-stream",
        verdict,
        risk_score: score,
        signals: { DL: pDL, LGBM: pLGBM, TREE: pTree, RULES: pRules },
        findings: rawFindings,
        generated_at: new Date().toISOString(),
        server_report: rawReport || undefined,
      };
      const blob = new Blob([JSON.stringify(clientReport, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      const href = URL.createObjectURL(blob);
      a.href = href; a.download = localFilename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch (e) {
      setDownErr(String(e));
    }
  };

  const onDownloadClean = async () => {
    setDownErr("");
    try {
      if (!cleanUrl) { setDownErr("No sanitized file was produced for this scan."); return; }
      const fallback =
        (rawReport?.clean_file?.filename && String(rawReport.clean_file.filename)) ||
        (result.clean_filename && String(result.clean_filename)) ||
        (sha ? `${sha}_clean${ext || ""}` : (name.replace(/\.[^.]+$/, "") || "document") + "_clean" + (ext || ""));
      await downloadViaFetch(cleanUrl, fallback);
    } catch (e) {
      setDownErr(String(e));
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white">
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

      <div className="relative z-10 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Match Contact.jsx heading style */}
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              <span className="text-white">Scan </span>
              <span className="text-blue-500">Report</span>
            </h1>
            <Link to="/scan" className="text-slate-300 hover:text-white">Scan another file →</Link>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-lg font-semibold truncate">{name}</div>
                <div className="text-sm text-slate-400 mt-1">
                  {humanBytes(meta.size_bytes || meta.size || result.size || 0)} • {meta.mime_type || result.content_type || "unknown"} •{" "}
                  SHA256: {sha ? sha.slice(0, 12) + "…" : "n/a"}
                </div>
              </div>
              <div className="text-right">
                <Pill ok={verdict !== "malicious"}>Verdict: {verdict}</Pill>
                <div className="mt-2 text-sm text-slate-400">Risk Score: {percent(score)}%</div>
              </div>
            </div>

            <div className="mt-4"><Bar value={score} color={verdict === "malicious" ? "bg-red-500" : "bg-emerald-400"} /></div>

            {/* Findings */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Findings</h2>
              {findings.length === 0 && !synthesized && (
                <div className="text-sm text-slate-400 space-y-2">
                  <div>No structured findings were reported.</div>
                  {verdict === "malicious" && (
                    <div className="rounded-md border border-rose-500/30 bg-rose-500/6 p-3 text-rose-300">
                      This file is flagged <strong>malicious</strong>, but the report didn’t include human-readable indicators.
                      Use <em>Download JSON Report</em> to review the server output.
                    </div>
                  )}
                </div>
              )}
              <ul className="space-y-2">
                {findings.map((f, i) => (
                  <li key={i} className="rounded-lg bg-slate-800/60 p-3">
                    <div className="text-sm">
                      <span className={`mr-2 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide
                        ${f.severity === "high" ? "bg-red-500/20 text-red-300"
                          : f.severity === "medium" ? "bg-amber-500/20 text-amber-300"
                          : "bg-slate-500/20 text-slate-300"}`}>
                        {String(f.severity || "info")}
                      </span>
                      <span className="font-semibold">{String(f.title || "signal")}</span>
                    </div>
                    <div className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{String(f.message)}</div>
                    {f.explain && (
                      <div className="mt-2 text-xs text-slate-400">
                        <strong>Why it’s risky:</strong> {f.explain}
                      </div>
                    )}
                    <details className="mt-2 text-xs text-slate-400">
                      <summary className="cursor-pointer">Raw finding</summary>
                      <pre className="mt-2 max-h-40 overflow-auto text-xs bg-black/40 p-2 rounded">{JSON.stringify(f.raw, null, 2)}</pre>
                    </details>
                  </li>
                ))}
                {synthesized && (
                  <li className="rounded-lg bg-slate-800/60 p-3">
                    <div className="text-sm">
                      <span className="mr-2 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide bg-red-500/20 text-red-300">high</span>
                      <span className="font-semibold">{synthesized.title}</span>
                    </div>
                    <div className="text-sm text-slate-300 mt-1">{synthesized.message}</div>
                    {synthesized.explain && <div className="mt-2 text-xs text-slate-400"><strong>Why it’s risky:</strong> {synthesized.explain}</div>}
                  </li>
                )}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Recommendations</h2>
              <ul className="list-disc pl-6 space-y-1 text-sm text-slate-300">
                {recommendations.length ? recommendations.map((r, i) => <li key={i}>{r}</li>) : <li>Handle unknown documents with caution.</li>}
              </ul>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button onClick={onDownloadReport} className="rounded-md px-4 py-2 bg-slate-800 hover:bg-slate-700">Download JSON Report</button>
              <button
                onClick={onDownloadClean}
                className={`rounded-md px-4 py-2 ${cleanUrl ? "bg-blue-600 hover:bg-blue-500" : "bg-slate-700/50 cursor-not-allowed"}`}
                disabled={!cleanUrl}
                title={!cleanUrl ? "No sanitized file was created for this scan." : ""}
              >
                Download Clean File
              </button>
            </div>

            {downErr && (
              <div className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300 text-sm">
                {downErr}
              </div>
            )}
          </div>

          {/* Raw server output */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Raw report</h2>
              <button className="rounded-md bg-slate-800 hover:bg-slate-700 px-3 py-1 text-sm" onClick={() => setShowRaw((s) => !s)}>
                {showRaw ? "Hide" : "Show"}
              </button>
            </div>
            {showRaw && (
              <>
                {rawReport ? (
                  <pre className="mt-3 max-h-96 overflow-auto bg-black/40 p-3 rounded text-xs">{JSON.stringify(rawReport, null, 2)}</pre>
                ) : rawText ? (
                  <pre className="mt-3 max-h-96 overflow-auto bg-black/40 p-3 rounded text-xs whitespace-pre-wrap">{rawText}</pre>
                ) : (
                  <div className="mt-3 text-sm text-slate-400">No server JSON was fetched for this report.</div>
                )}
              </>
            )}
          </div>

          {/* Model signals */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold mb-4">Model signals</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "DL", v: pDL },
                { label: "LGBM", v: pLGBM },
                { label: "Tree", v: pTree },
                { label: "Rules", v: pRules },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-slate-800 p-4">
                  <div className="text-sm text-slate-400">{m.label}</div>
                  <div className="mt-1 text-2xl font-bold">{percent(m.v)}%</div>
                  <div className="mt-2"><Bar value={m.v} color="bg-sky-400" /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
