// src/pages/Scan.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const BASE = import.meta.env.BASE_URL;

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

export default function Scan() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState(null);
  const inputRef = useRef();
  const vidRef = useRef(null);

  // background video autoplay
  useEffect(() => { vidRef.current?.play().catch(() => {}); }, []);

  // smooth progress while scanning
  useEffect(() => {
    if (!busy) return;
    setProgress(10);
    const a = setTimeout(() => setProgress(30), 350);
    const b = setTimeout(() => setProgress(55), 1000);
    const c = setTimeout(() => setProgress(80), 1800);
    const d = setTimeout(() => setProgress(92), 2600);
    return () => [a, b, c, d].forEach(clearTimeout);
  }, [busy]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }, []);

  const onBrowse = () => inputRef.current?.click();
  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleScan = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!file || busy) return;

    setErr(null);
    setBusy(true);
    setProgress((p) => (p < 12 ? 12 : p));

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await AuthorizedFetch(`/scan`, { method: "POST", body: form });

      // token expired → go to auth
      if (res.status === 401) {
        setBusy(false);
        navigate("/auth", { replace: true });
        return;
      }

      // robustly parse payload
      let data;
      try {
        data = await res.json();
      } catch {
        const txt = await res.text().catch(() => "");
        data = { ok: res.ok, status: res.status, raw: txt };
      }

      // Persist for ScanReport
      localStorage.setItem(
        "safedocs_last_scan",
        JSON.stringify({
          ...data,
          _client: { originalName: file.name, ts: Date.now() },
        })
      );
      if (data?.report_id) {
        localStorage.setItem("safedocs_last_report_id", data.report_id);
      }

      setProgress(100);
      setTimeout(
        () => navigate("/scanreport", { replace: true, state: { result: data } }),
        120
      );
    } catch (e2) {
      setErr(e2?.message || "Scan failed");
      setBusy(false);
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

      <section className="relative z-10 mx-auto max-w-3xl px-4 py-10">
        {/* Match Contact.jsx heading style */}
        <h1 className="text-center text-3xl md:text-5xl font-extrabold tracking-tight">
          <span className="text-white">Scan </span>
          <span className="text-blue-500">&amp; </span>
          <span className="text-white">Sanitize</span>
        </h1>
        <p className="mt-3 text-center text-sm text-slate-300">
          Drop a PDF, DOCX, PPTX, XLSX, or RTF. We’ll scan with the ensemble and sanitize by type.
        </p>

        {err && (
          <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-rose-300">
            {err}
          </div>
        )}

        <div
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
          onDrop={onDrop}
          className={`mt-6 rounded-2xl border-2 border-dashed p-10 text-center transition ${
            dragOver ? "border-indigo-400 bg-indigo-500/5" : "border-white/20 bg-slate-900/60"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={onFileChange}
            accept=".pdf,.docx,.pptx,.xlsx,.rtf"
          />
          <div className="text-slate-300">
            {file ? (
              <>
                <div className="text-sm">Selected file</div>
                <div className="mt-1 text-lg font-semibold">{file.name}</div>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold">Drag &amp; drop your document here</div>
                <div className="mt-1 text-sm">or</div>
                <button
                  type="button"
                  onClick={onBrowse}
                  className="mt-2 rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
                >
                  Browse files
                </button>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleScan} className="mt-6 flex items-center gap-3 justify-center">
          <button
            type="submit"
            disabled={!file || busy}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              !file || busy ? "bg-slate-700 text-slate-400" : "bg-indigo-500 hover:bg-indigo-400 text-white"
            }`}
          >
            {busy ? "Scanning…" : "Scan & Sanitize"}
          </button>
          {file && !busy && (
            <button
              type="button"
              onClick={() => setFile(null)}
              className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
            >
              Clear
            </button>
          )}
        </form>

        {busy && (
          <div className="mt-4">
            <div className="mb-1 text-xs text-slate-400 text-center">Processing</div>
            <div className="h-2 w-full overflow-hidden rounded bg-white/10">
              <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 text-xs text-slate-400 text-center">
              Upload → ML scan → Type-aware sanitization → Report + clean file
            </div>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <div className="text-sm font-semibold text-white">What happens after you click Scan?</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
            <li>File is uploaded securely and scanned by the ensemble.</li>
            <li>By type: PDF / OOXML / RTF sanitizers remove risky parts.</li>
            <li>Clean file + JSON report are saved; you’ll be taken to Scan Report automatically.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
