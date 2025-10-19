export default function LightGBM() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="text-3xl md:text-4xl font-extrabold">LightGBM Model</h1>
      <p className="mt-3 text-slate-300">
        Gradient-boosted trees on the same feature set capture higher-order
        interactions and boost precision on the high-risk tail with low latency.
      </p>
      <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3 text-sm text-slate-300">
        <p><b>Highlights:</b> leaf-wise growth, histogram binning.</p>
        <p><b>Calibration:</b> optional Platt/Isotonic for well-behaved risk.</p>
        <p><b>Blend:</b> ensembled with RF &amp; embedding heuristics for verdicts.</p>
      </div>
    </section>
  );
}
