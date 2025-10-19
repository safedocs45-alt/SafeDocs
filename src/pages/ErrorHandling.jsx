// src/pages/ErrorHandling.jsx
import { useLocation, Link } from "react-router-dom";

const BG = `${import.meta.env.BASE_URL}polygonScatter.png`;

const LABELS = {
  validation: "Validation Issue",
  too_large: "File Too Large",
  unsupported: "Unsupported Format",
  network_upload: "Upload Connection Failed",
  processing_timeout: "Processing Timeout",
  file_corruption: "File Corruption Detected",
  sanitization_failed: "Sanitization Failed",
};

export default function ErrorHandling() {
  const { state } = useLocation();
  const code = state?.code;
  const data = state?.data;

  return (
    <div className="relative bg-black min-h-screen">
      {/* background */}
      <div
        className="absolute inset-0 z-0 bg-repeat opacity-45"
        style={{
          backgroundImage: `url(${BG})`,
          backgroundSize: "480px",
          backgroundPosition: "center top",
          filter: "brightness(1.4) contrast(1.4)",
        }}
      />

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-14 md:py-16">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
          Error <span className="text-blue-500">Handling</span>
        </h1>

        {/* Focused banner if a specific error came from Scan */}
        {code && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-lg font-semibold text-white">
              {LABELS[code] || "Issue Detected"}
            </div>
            <div className="mt-2 text-sm text-slate-300 space-y-1">
              {code === "validation" && data?.invalid && (
                <>
                  <div>Some files could not be processed:</div>
                  <ul className="list-disc pl-5">
                    {data.invalid.map((x) => (
                      <li key={x.name}>
                        <span className="text-white">{x.name}</span> — {x.reason.replace("_", " ")}
                        {x.sizeMB && ` (${x.sizeMB} MB)`}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 text-slate-400">
                    Supported: {data.accept?.join(", ")} — Max size: {data.limitMB}MB
                  </div>
                </>
              )}

              {code === "network_upload" && (
                <div>
                  Connection interrupted while uploading {data?.fileCount ?? 1} file(s). Check your
                  internet, then retry.
                </div>
              )}
              {code === "processing_timeout" && (
                <div>
                  Processing exceeded the time limit (around {data?.atPercent ?? 0}% complete). Try
                  again later or use a smaller/simpler file.
                </div>
              )}
              {code === "file_corruption" && (
                <div>
                  The file appears corrupted ({data?.file || "your file"}). Re-download or obtain a
                  clean copy, then try again.
                </div>
              )}
              {code === "sanitization_failed" && (
                <div>Unable to safely remove detected threats. Manual review recommended.</div>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              <Link
                to="/scan"
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Upload New File
              </Link>
              <Link
                to="/contact"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
              >
                Contact Support
              </Link>
            </div>
          </div>
        )}

        {/* Reference library of scenarios (same as before) */}
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <Section title="Upload Failure Scenarios">
            <Card id="too_large" title="File Too Large" action="Try Another File">
              <List title="Error" items={["document.pdf (75MB) exceeds maximum size limit"]} />
              <List title="Solutions" items={["Maximum allowed: 50MB", "Compress or split the document"]} />
            </Card>
            <Card id="unsupported" title="Unsupported Format" action="Select Valid File">
              <List title="Supported Formats" items={["PDF (.pdf)", "Word (.docx)", "PowerPoint (.pptx)", "Excel (.xlsx)"]} />
            </Card>
            <Card id="network_upload" title="Upload Connection Failed" action="Retry Upload">
              <List title="Tips" items={["Check your internet connection", "Try again or use a smaller file"]} />
            </Card>
          </Section>

          <Section title="Scan Failure Scenarios">
            <Card id="file_corruption" title="File Corruption Detected" action="Re-download File">
              <List title="Possible Causes" items={["Incomplete download", "File system corruption", "Intentional obfuscation"]} />
            </Card>
            <Card id="processing_timeout" title="Processing Timeout" action="Retry Processing">
              <List title="Reasons" items={["Extremely complex document structure", "High server load", "Deeply embedded threats"]} />
            </Card>
            <Card id="sanitization_failed" title="Sanitization Failed" action="Contact Support">
              <List title="Action Required" items={["Manual review recommended", "Consider recreating the document from scratch"]} />
            </Card>
          </Section>
        </div>
      </section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}

function Card({ id, title, children, action }) {
  return (
    <div id={id} className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/70 to-slate-900/30 p-6 backdrop-blur-sm">
      <h4 className="text-white font-semibold">{title}</h4>
      <div className="mt-3 text-sm text-slate-300 space-y-1">{children}</div>
      {action && (
        <a href="/scan" className="mt-4 inline-block rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
          {action}
        </a>
      )}
    </div>
  );
}

function List({ title, items }) {
  return (
    <>
      <p className="text-slate-400">{title}:</p>
      <ul className="list-disc pl-5">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </>
  );
}
