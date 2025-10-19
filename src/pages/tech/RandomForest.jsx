export default function RandomForest() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="text-3xl md:text-4xl font-extrabold">Random Forest Model</h1>
      <p className="mt-3 text-slate-300">
        Our RF classifier consumes static document features (structure traits,
        header flags, object counts, macro/script presence) to assign a risk
        probability. We favor RF for robustness on tabular and mixed features.
      </p>
      <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3 text-sm text-slate-300">
        <p><b>Features:</b> file meta, object counts, entropy, macro flags, suspicious strings.</p>
        <p><b>Training:</b> K-fold CV; class-balancing; threshold via ROC-AUC &amp; F1.</p>
        <p><b>Why RF:</b> interpretable importances, fast inference, stable under drift.</p>
      </div>
    </section>
  );
}
