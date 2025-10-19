export default function Infrastructure() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="text-3xl md:text-4xl font-extrabold">Infrastructure</h1>
      <p className="mt-3 text-slate-300">
        FastAPI + MongoDB. Files live in GridFS (uploads/clean/reports). Clean
        files have a 48-hour TTL; metadata persists for analytics.
      </p>
      <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300 space-y-2">
        <p><b>Security:</b> JWT auth, server-side validation, checksums.</p>
        <p><b>Scale:</b> stateless API, horizontal scaling behind a proxy.</p>
        <p><b>Extensible:</b> optional VirusTotal hash lookups, etc.</p>
      </div>
    </section>
  );
}
