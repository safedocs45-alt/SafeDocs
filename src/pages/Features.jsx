import {
  FiCpu,
  FiShield,
  FiFileText,
  FiSearch,
  FiCheckCircle,
  FiTrash2,
} from "react-icons/fi";

const BASE = import.meta.env.BASE_URL;

export default function Features() {
  return (
    <div className="relative bg-black">
      {/* polygon background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-repeat opacity-40"
        style={{
          backgroundImage: `url(${BASE}polygonScatter.png)`,
          backgroundSize: "480px",
          backgroundPosition: "center top",
          filter: "brightness(1.25) contrast(1.35)",
        }}
      />
      {/* subtle dark overlay to boost readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/60 via-black/70 to-black/90" />

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 md:py-20">
        {/* Title */}
        <header className="text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            <span className="text-white">Powerful Document Protection</span>
            <br className="hidden md:block" />
            <span className="text-blue-500"> Sanitization & Integrity</span>
          </h1>
          <p className="mt-4 text-sm md:text-base text-slate-300/90 max-w-2xl mx-auto">
            Multi-format coverage, AI-powered detection, and cryptographic
            integrity checks—built to keep your files safe without retaining
            your data.
          </p>
        </header>

        {/* Feature grid */}
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

        {/* Divider */}
        <div className="mt-16 h-px w-full bg-white/10" />

        {/* Security Features */}
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
      </section>
    </div>
  );
}

/* ---------- blocks ---------- */

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
