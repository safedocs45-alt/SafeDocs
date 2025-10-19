export default function MongoDBPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="text-3xl md:text-4xl font-extrabold">MongoDB Data Model</h1>
      <p className="mt-3 text-slate-300">
        Users, scans, and reports in collections; files in GridFS. Ownership is
        enforced in queries; clean files TTL is 48 hours.
      </p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300">
          <h3 className="font-semibold">Collections</h3>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><b>users</b>: email, pw hash, createdAt</li>
            <li><b>scans</b>: userId, filename, verdict, risk, timestamps</li>
            <li><b>reports</b>: scanId, indicators, sanitizer log</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300">
          <h3 className="font-semibold">GridFS</h3>
          <p className="mt-2">Buckets: uploads, clean, reports.</p>
        </div>
      </div>
    </section>
  );
}
