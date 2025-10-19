// src/pages/Landing.jsx
import { Link } from "react-router-dom";
import { FiLock, FiFolder } from "react-icons/fi";

const BASE = import.meta.env.BASE_URL;

export default function Landing() {
  return (
    <div className="relative">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            className="h-full w-full object-cover pointer-events-none"
            src={`${BASE}banneranimation.mp4`}
            autoPlay
            muted
            loop
            playsInline
            poster={`${BASE}bannerBackground.png`}
            style={{ filter: "brightness(0.9) contrast(1.05)" }}
          />
        </div>
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/20 via-black/55 to-black" />
        <div className="relative z-20 mx-auto max-w-7xl px-4 py-14 md:py-20 text-center">
          {/* Match Contact.jsx heading style */}
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            <span className="text-white">Safe</span>
            <span className="text-blue-500">Docs</span>
          </h1>
          <p className="mt-2 text-sm tracking-wide text-slate-300">
            Document Sanitization Tool for Safe File Sharing
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to="/auth?mode=signup"
              className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500"
            >
              Get Started
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/20"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="relative bg-black">
        <div
          className="absolute inset-0 z-0 bg-repeat opacity-45"
          style={{
            backgroundImage: `url(${BASE}polygonScatter.png)`,
            backgroundSize: "480px",
            backgroundPosition: "center top",
            filter: "brightness(1.4) contrast(1.4)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 md:py-16">
          <div className="mx-auto max-w-4xl grid gap-12 md:grid-cols-2 place-items-center">
            <div className="group flex items-center gap-6 justify-center">
              <div className="grid h-28 w-28 place-items-center rounded-2xl border border-white/50 bg-black/30 backdrop-blur-md">
                <FiFolder className="h-12 w-12 text-yellow-400" />
              </div>
              <div>
                <div className="text-base font-semibold text-white">Multiple File Types</div>
                <div className="mt-1 text-xs text-slate-300 leading-relaxed">PDF, DOCX, PPTX, XLSX, RTF</div>
              </div>
            </div>
            <div className="group flex items-center gap-6 justify-center">
              <div className="grid h-28 w-28 place-items-center rounded-2xl border border-white/50 bg-black/30 backdrop-blur-md">
                <FiLock className="h-12 w-12 text-blue-400" />
              </div>
              <div>
                <div className="text-base font-semibold text-white">Secure Processing</div>
                <div className="mt-1 text-xs text-slate-300 leading-relaxed">Files auto-deleted after sanitization</div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold">
              How SafeDocs <span className="text-blue-500">Works</span>
            </h2>
            <ol className="mx-auto mt-8 max-w-5xl space-y-4 text-left">
              {[
                ["Upload Document", "Drag and drop or browse to select your file"],
                ["ML/DL Analysis", "Models scan for malicious patterns and embedded scripts"],
                ["Safe Sanitization", "Threats removed while preserving content integrity"],
                ["Download Clean File", "Get the sanitized document with detailed report"],
              ].map(([title, sub], i) => (
                <li key={i} className="rounded-2xl bg-white/5 ring-1 ring-white/10 px-5 py-4">
                  <div className="text-lg font-semibold text-white">{String(i + 1).padStart(2, "0")}. {title}</div>
                  <div className="text-sm text-slate-300">{sub}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
