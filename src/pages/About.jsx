// src/pages/About.jsx
import { useEffect, useRef } from "react";
import {
  FiCpu,
  FiShield,
  FiFileText,
  FiSearch,
  FiCheckCircle,
  FiTrash2,
} from "react-icons/fi";

const BASE = import.meta.env.BASE_URL;

export default function About() {
  const vidRef = useRef(null);

  useEffect(() => {
    vidRef.current?.play().catch(() => {});
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Global background: same as Landing */}
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

      <section className="relative z-10 mx-auto max-w-5xl px-4 py-16 md:py-20">
        {/* Title centered (matches Contact heading style) */}
        <h1 className="text-center text-3xl md:text-5xl font-extrabold tracking-tight">
          <span className="text-white">About </span>
          <span className="text-blue-500">Safe</span>
          <span className="text-white">Docs</span>
        </h1>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <p className="text-slate-200">
            <strong>SafeDocs</strong> is a student-built, research-driven document
            security platform. We’re an undergraduate team focused on
            practical applications of ML/DL, automation, and cyber-threat
            detection. Our goal is to make file sharing safe for students,
            teams, and organizations without adding friction.
          </p>
          <p className="mt-4 text-slate-300">
            We designed SafeDocs after observing how document-borne malware
            (macros, weaponized PDFs/RTF, embedded scripts) routinely slips
            through email and collaboration workflows. Our north star is
            <em> useful but inert </em> documents: sanitize wherever possible;
            block only when necessary.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <div className="text-sm text-slate-400">What we built</div>
            <div className="mt-1 font-semibold">
              A hybrid scanner (LightGBM + Random Forest + MiniLM) with format-aware CDR.
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <div className="text-sm text-slate-400">Why it matters</div>
            <div className="mt-1 font-semibold">
              Real-world incidents frequently begin with a booby-trapped doc. We reduce that risk at the edge.
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <div className="text-sm text-slate-400">How we work</div>
            <div className="mt-1 font-semibold">
              Evidence-first engineering. We benchmark, iterate, and keep the pipeline explainable.
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold">Focused Areas</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-200">
            <li>ML/DL for security: feature engineering, calibration, and model ensembles.</li>
            <li>Content Disarm &amp; Reconstruction (CDR) for OOXML, PDF, and RTF.</li>
            <li>Secure engineering: JWT auth, per-user isolation, GridFS with 48h TTL.</li>
            <li>Operational visibility: JSON reports, per-user dashboards, audit events.</li>
          </ul>
        </div>

        {/* === (Merged) Features content === */}
        <div className="mt-12 h-px w-full bg-white/10" />

        <header className="mt-12 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            <span className="text-white">Powerful Document Protection</span>
            <br className="hidden md:block" />
            <span className="text-blue-500"> Sanitization &amp; Integrity</span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-slate-300/90 max-w-2xl mx-auto">
            Multi-format coverage, AI-powered detection, and cryptographic
            integrity checks—built to keep your files safe without retaining
            your data.
          </p>
        </header>

        <div className="mt-14 grid gap-10 md:grid-cols-2 lg:gap-12 mx-auto max-w-5xl">
          <FeatureBlock
            icon={<FiFileText className="h-8 w-8 text-blue-400" />}
            title="Multi-Format Support"
            subtitle="Comprehensive file coverage"
            bullets={["PDF", "Word (DOCX)", "PowerPoint (PPTX)", "Excel (XLSX)"]}
          />
          <FeatureBlock
            icon={<FiCpu className="h-8 w-8 text-orange-400" />}
            title="ML/DL Malware Detection"
            subtitle="Machine & deep learning analysis"
            bullets={[
              "Advanced pattern recognition",
              "Behavioral analysis",
              "95%+ accuracy rate",
              "Real-time threat assessment",
            ]}
          />
          <FeatureBlock
            icon={<FiSearch className="h-8 w-8 text-yellow-400" />}
            title="Threat Detection"
            subtitle="Comprehensive security scanning"
            bullets={[
              "Embedded JavaScript detection",
              "VBA macro analysis",
              "Suspicious object identification",
              "Hidden script discovery",
            ]}
          />
          <FeatureBlock
            icon={<FiCheckCircle className="h-8 w-8 text-green-400" />}
            title="File Integrity"
            subtitle="SHA-256 verification"
            bullets={[
              "Before/after hash comparison",
              "Content preservation guarantee",
              "Integrity validation",
              "Audit trail maintenance",
            ]}
          />
        </div>

        <section className="mt-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            <span className="text-white">Security </span>
            <span className="text-blue-500">Assurances</span>
          </h2>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mx-auto max-w-6xl">
            <SecurityTile
              icon={<FiShield className="h-10 w-10 text-blue-400" />}
              title="Isolated Secure Processing"
              caption="Files are processed in a sandboxed environment to prevent lateral movement or leaks."
            />
            <SecurityTile
              icon={<FiTrash2 className="h-10 w-10 text-red-400" />}
              title="Automatic File Deletion"
              caption="Input and intermediate artifacts are removed immediately after processing completes."
            />
            <SecurityTile
              icon={<FiCheckCircle className="h-10 w-10 text-green-400" />}
              title="Zero Data Retention"
              caption="No permanent storage of your documents or scan results—privacy by design."
            />
          </div>
        </section>
        {/* === end merged Features content === */}
      </section>
    </div>
  );
}

/* ---------- blocks (from Features.jsx) ---------- */

function FeatureBlock({ icon, title, subtitle, bullets }) {
  return (
    <article className="w-full max-w-xl flex items-start gap-4">
      {/* centered icon tile */}
      <div
        className="mt-1 flex h-12 w-12 items-center justify-center
        rounded-xl border border-white/40 bg-black/30 backdrop-blur-md
        transition-all duration-300
        hover:bg-blue-500/20 hover:border-blue-400 hover:shadow-[0_0_18px_rgba(59,130,246,0.45)]"
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* text */}
      <div className="text-left">
        <h3 className="text-xl font-extrabold text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-300/90 marker:text-slate-500 space-y-1.5">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function SecurityTile({ icon, title, caption }) {
  return (
    <div className="flex flex-col items-center group">
      <div
        className="flex flex-col items-center justify-center h-48 w-72 rounded-3xl
        border border-white/40 bg-black/20 backdrop-blur-md
        transition-all duration-300 ease-out
        hover:border-blue-400 hover:bg-blue-500/15
        hover:shadow-[0_0_24px_rgba(59,130,246,0.35)]
        hover:-translate-y-0.5
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
        tabIndex={0}
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="transition-colors duration-300 group-hover:scale-110">
            {icon}
          </div>
          <div className="text-white text-lg font-extrabold leading-tight text-center transition-colors duration-300 group-hover:text-blue-200">
            {title}
          </div>
        </div>
      </div>
      <p className="mt-3 w-72 text-center text-xs text-slate-300 transition-colors duration-300 group-hover:text-blue-200/80">
        {caption}
      </p>
    </div>
  );
}
