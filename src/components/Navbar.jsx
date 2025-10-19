// src/components/Navbar.jsx
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL;

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authed, setAuthed] = useState(!!localStorage.getItem("safedocs_token"));

  useEffect(() => {
    const sync = () => setAuthed(!!localStorage.getItem("safedocs_token"));
    sync();

    const onStorage = (e) => { if (e.key === "safedocs_token") sync(); };
    window.addEventListener("storage", onStorage);

    const onAuthChanged = () => sync();
    window.addEventListener("auth-changed", onAuthChanged);
    window.addEventListener("safedocs:auth-changed", onAuthChanged);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth-changed", onAuthChanged);
      window.removeEventListener("safedocs:auth-changed", onAuthChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  function signOut() {
    localStorage.removeItem("safedocs_token");
    setAuthed(false);
    window.dispatchEvent(new Event("auth-changed"));
    window.dispatchEvent(new Event("safedocs:auth-changed"));
    navigate("/auth");
  }

  const linkBase = "px-3 py-2 rounded hover:bg-white/5 transition-colors text-sm font-medium";
  const active = "text-white border-b-2 border-indigo-500 -mb-[2px] rounded-b-none";

  return (
    <header className="sticky top-0 z-30 bg-black/80 backdrop-blur border-b border-white/10">
      <nav className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
        {/* Brand (logo only, same slot where text used to be) */}
        <Link to="/" aria-label="SafeDocs Home" className="flex items-center gap-2 select-none">
          <img
            src={`${BASE}SafeDocs1.png`}
            alt="SafeDocs"
            className="h-7 w-auto md:h-8"
            loading="eager"
            decoding="async"
            draggable="false"
          />
        </Link>

        {/* Primary nav */}
        <div className="flex items-center gap-6 ml-auto">
          <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? active : "text-slate-300"}`}>Home</NavLink>
          <NavLink to="/about" className={({ isActive }) => `${linkBase} ${isActive ? active : "text-slate-300"}`}>About</NavLink>
          <NavLink to="/contact" className={({ isActive }) => `${linkBase} ${isActive ? active : "text-slate-300"}`}>Contact</NavLink>
          <NavLink to="/scan" className={({ isActive }) => `${linkBase} ${isActive ? active : "text-slate-300"}`}>Scan</NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `${linkBase} ${isActive ? active : "text-slate-300"}`}>Dashboard</NavLink>
          <NavLink to="/settings" className={({ isActive }) => `${linkBase} ${isActive ? active : "text-slate-300"}`}>Settings</NavLink>
        </div>

        {/* Auth CTA */}
        <div className="flex items-center gap-3">
          {!authed ? (
            <Link to="/auth" className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold hover:bg-indigo-400">Sign in</Link>
          ) : (
            <button onClick={signOut} className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold hover:bg-slate-700">Sign out</button>
          )}
        </div>
      </nav>
    </header>
  );
}
