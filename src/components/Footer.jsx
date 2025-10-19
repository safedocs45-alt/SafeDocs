// src/components/Footer.jsx
import { Link } from "react-router-dom";
import { FiMail } from "react-icons/fi";
import { SiGithub, SiLinkedin } from "react-icons/si";

export default function Footer() {
  return (
    <footer className="relative bg-black border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold">Quick Links</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/" className="text-slate-400 hover:text-white transition">Home</Link></li>
              <li><Link to="/about" className="text-slate-400 hover:text-white transition">About</Link></li>
              <li><Link to="/contact" className="text-slate-400 hover:text-white transition">Contact</Link></li>
            </ul>
          </div>

          {/* Tech pages — same route structure */}
          <div>
            <h3 className="text-white font-semibold">Tech</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/apiservers" className="text-slate-400 hover:text-white transition">API Servers</Link></li>
              <li><Link to="/infrastructure" className="text-slate-400 hover:text-white transition">Infrastructure</Link></li>
              <li><Link to="/lightgbm" className="text-slate-400 hover:text-white transition">LightGBM Model</Link></li>
              <li><Link to="/minilm" className="text-slate-400 hover:text-white transition">MiniLM Embeddings</Link></li>
              <li><Link to="/mongodb" className="text-slate-400 hover:text-white transition">MongoDB Data Model</Link></li>
              <li><Link to="/randomforest" className="text-slate-400 hover:text-white transition">Random Forest Model</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold">Contact Info</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>
                <a href="mailto:safedocs45@gmail.com" className="flex items-center gap-3 hover:text-white transition">
                  <span className="grid h-6 w-6 place-items-center rounded-md border border-white/10 bg-white/5">
                    <FiMail className="h-3.5 w-3.5 text-[#EA4335]" />
                  </span>
                  <span>safedocs45@gmail.com</span>
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/in/safedocs-undefined-865414384" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-white transition">
                  <span className="grid h-6 w-6 place-items-center rounded-md border border-white/10 bg-white/5">
                    <SiLinkedin className="h-3.5 w-3.5 text-[#0A66C2]" />
                  </span>
                  <span>www.linkedin.com/in/safedocs-undefined-865414384</span>
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-md border border-white/10 bg-white/5 text-slate-300">
                  <SiGithub className="h-3.5 w-3.5" />
                </span>
                <a href="#" className="hover:text-white transition">SafeDocs</a>
              </li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h3 className="text-white font-semibold">Disclaimer</h3>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Academic / Educational tool – Not enterprise-grade replacement
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-slate-400">
          <div className="flex flex-col gap-2 items-start justify-between md:flex-row md:items-center">
            <div>© {new Date().getFullYear()} SafeDocs. All rights reserved.</div>
            <div className="opacity-70">Secure. Private. Reliable.</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
