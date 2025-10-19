export default function MiniLM() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="text-3xl md:text-4xl font-extrabold">MiniLM Embeddings</h1>
      <p className="mt-3 text-slate-300">
        We embed selected strings/content (script blocks, URLs, metadata) to
        surface semantic clues that classic features miss and improve triage.
      </p>
      <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3 text-sm text-slate-300">
        <p><b>Uses:</b> similarity, anomaly cues, richer explanations.</p>
        <p><b>Why MiniLM:</b> small, fast CPU inference, solid semantic signal.</p>
        <p><b>Privacy:</b> embeddings computed locally; no 3rd-party sharing.</p>
      </div>
    </section>
  );
}
