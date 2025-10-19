// src/pages/Contact.jsx
import { useState } from "react";

const BASE = import.meta.env.BASE_URL;

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    message: "",
  });
  const [sent, setSent] = useState(false);

  function change(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function submit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSent(true);
    setTimeout(() => setSent(false), 2500);
  }

  function reset() {
    setForm({ name: "", email: "", title: "", message: "" });
  }

  return (
    <div className="relative bg-black">
      {/* polygon background */}
      <div
        className="absolute inset-0 z-0 bg-repeat opacity-45"
        style={{
          backgroundImage: `url(${BASE}polygonScatter.png)`,
          backgroundSize: "480px",
          backgroundPosition: "center top",
          filter: "brightness(1.4) contrast(1.4)",
        }}
      />

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-14 md:py-16">
        {/* Title */}
        <h1 className="text-center text-3xl md:text-5xl font-extrabold tracking-tight">
          <span className="text-white">Get </span>
          <span className="text-blue-500">In </span>
          <span className="text-white">Touch</span>
        </h1>

        {/* Cards row */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Left: Contact Form */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/70 to-slate-900/30 p-6 md:p-8 backdrop-blur-sm">
            <h3 className="mb-5 text-lg font-semibold text-white">Contact Form</h3>

            <form onSubmit={submit} className="space-y-4">
              <input
                name="name"
                value={form.name}
                onChange={change}
                placeholder="Full Name"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={change}
                placeholder="Email address"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="title"
                value={form.title}
                onChange={change}
                placeholder="Title Here"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                rows={4}
                name="message"
                value={form.message}
                onChange={change}
                placeholder="Tell us about your inquiry"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-xl bg-black/60 px-5 py-2 text-sm font-semibold text-slate-200 hover:bg-black/70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  Save &amp; Update
                </button>
              </div>

              {sent && (
                <div className="mt-3 rounded-xl bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">
                  Thanks! We typically respond within 24–48 hours during academic terms.
                </div>
              )}
            </form>
          </div>

          {/* Right: Contact Information */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/70 to-slate-900/30 p-6 md:p-8 backdrop-blur-sm">
            <h3 className="mb-5 text-lg font-semibold text-white">Contact Information</h3>

            <dl className="space-y-5 text-sm">
              <div>
                <dt className="font-semibold text-white">Email</dt>
                <dd className="text-slate-300">safedocs45@gmail.com</dd>
              </div>

              <div>
                <dt className="font-semibold text-white">Academic Supervisor</dt>
                <dd className="text-slate-300">Mr. Jude Kirupanen</dd>
              </div>

              <div>
                <dt className="font-semibold text-white">Project Links</dt>
                <dd className="text-slate-300">
                  GitHub Repository
                  <br />
                  LinkedIn Profiles
                  <br />
                  Documentation
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-white">Quick Response</dt>
                <dd className="text-slate-300">
                  We typically respond to inquiries within 24–48 hours during academic terms.
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* FAQ section */}
        <section className="mt-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            FAQ’s
          </h2>

          <ul className="mt-8 space-y-8">
            <li>
              <div className="text-lg font-semibold text-white">
                Is SafeDos free to use?
              </div>
              <p className="mt-1 text-slate-300">
                Yes, SafeDocs is an academic project available for educational and research
                purposes.
              </p>
            </li>

            <li>
              <div className="text-lg font-semibold text-white">
                What file types are supported?
              </div>
              <p className="mt-1 text-slate-300">
                Currently we support PDF, DOCX, PPTX, and XLSX files up to 50MB in size.
              </p>
            </li>

            <li>
              <div className="text-lg font-semibold text-white">Is my data secure?</div>
              <p className="mt-1 text-slate-300">
                Yes, files are processed securely and automatically deleted after sanitization.
                We don’t store your documents.
              </p>
            </li>

            <li>
              <div className="text-lg font-semibold text-white">
                Can I use this for enterprise purposes?
              </div>
              <p className="mt-1 text-slate-300">
                SafeDocs is designed for academic/educational use. For enterprise needs, please
                reach out.
              </p>
            </li>
          </ul>
        </section>
      </section>
    </div>
  );
}
