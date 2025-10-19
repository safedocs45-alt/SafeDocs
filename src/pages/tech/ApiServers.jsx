export default function ApiServers() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="text-3xl md:text-4xl font-extrabold">API Servers</h1>
      <p className="mt-3 text-slate-300">
        FastAPI + Uvicorn expose auth, scanning, reporting, and secure download
        endpoints. CORS restricted to frontend origin in production.
      </p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300">
          <h3 className="font-semibold">Key routes</h3>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>/api/auth/signup, /api/auth/login, /api/auth/me</li>
            <li>/api/scan → persists scan + report</li>
            <li>/api/report/:id.json</li>
            <li>/api/download/:fileId (original/clean)</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300">
          <h3 className="font-semibold">Sanitization</h3>
          <p className="mt-2">
            Strip macros/OLE, neutralize JavaScript, rebuild objects and log
            changes for auditability.
          </p>
        </div>
      </div>
    </section>
  );
}
