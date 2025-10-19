// src/pages/Auth.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { api } from "../lib/api";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Auth() {
  const nav = useNavigate();
  const loc = useLocation();
  const initialMode = new URLSearchParams(loc.search).get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState(initialMode);
  const isSignup = mode === "signup";

  // where to go after login:
  const fromPath =
    (loc.state && loc.state.from && (loc.state.from.pathname || loc.state.from)) ||
    new URLSearchParams(loc.search).get("from") ||
    null;

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverMsg, setServerMsg] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  function validate() {
    const e = {};
    if (isSignup && !form.name.trim()) e.name = "Full name is required.";
    if (!emailRe.test(form.email)) e.email = "Enter a valid email.";
    if (form.password.length < 6) e.password = "Min 6 characters.";
    if (isSignup && form.password !== form.confirm) e.confirm = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function doSignup() {
    const email = form.email.trim().toLowerCase();
    await api.signup({ email, password: form.password });
    // Success: require explicit login
    setInfoMsg("Account created. Please log in to continue.");
    setMode("login");
  }

  async function doLogin() {
    const email = form.email.trim().toLowerCase();
    const out = await api.login({ email, password: form.password });
    const token = out?.access_token;
    if (!token) throw new Error("No token returned from server");
    localStorage.setItem("safedocs_token", token);
    window.dispatchEvent(new Event("auth-changed")); // refresh navbar state

    // If user was trying to reach a protected page, go there; otherwise /scan
    nav(fromPath || "/scan", { replace: true });
  }

  async function submit(ev) {
    ev.preventDefault();
    setServerMsg(null);
    setInfoMsg(null);
    if (!validate()) return;

    try {
      setBusy(true);
      if (isSignup) await doSignup();
      else await doLogin();
    } catch (err) {
      setServerMsg(err.message || "Request failed");
    } finally {
      setBusy(false);
    }
  }

  const hasToken = useMemo(() => !!localStorage.getItem("safedocs_token"), []);
  useEffect(() => {
    if (hasToken) nav("/scan", { replace: true });
  }, [hasToken, nav]);

  return (
    <section className="relative bg-black min-h-[80vh]">
      <div className="relative z-20 mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 md:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{isSignup ? "Create Account" : "Welcome Back"}</h2>
            <div className="text-sm text-slate-400">
              {isSignup ? "Already have an account?" : "New here?"}{" "}
              <button
                className="font-semibold text-indigo-400 hover:underline"
                onClick={() => {
                  setMode(isSignup ? "login" : "signup");
                  setServerMsg(null);
                  setInfoMsg(null);
                }}
              >
                {isSignup ? "Log in" : "Sign up"}
              </button>
            </div>
          </div>

          {serverMsg && (
            <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {serverMsg}
            </div>
          )}
          {infoMsg && (
            <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {infoMsg}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="mb-1 block text-sm text-slate-300">Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={change}
                  className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 outline-none ring-indigo-500 focus:ring"
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                />
                {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm text-slate-300">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={change}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 outline-none ring-indigo-500 focus:ring"
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={change}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 outline-none ring-indigo-500 focus:ring"
                placeholder="••••••••"
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
              {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password}</p>}
            </div>

            {isSignup && (
              <div>
                <label className="mb-1 block text-sm text-slate-300">Re-enter Password</label>
                <input
                  name="confirm"
                  type="password"
                  value={form.confirm}
                  onChange={change}
                  className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 outline-none ring-indigo-500 focus:ring"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {errors.confirm && <p className="mt-1 text-xs text-rose-400">{errors.confirm}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-indigo-500 px-4 py-2 font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
            >
              {busy ? "Please wait…" : isSignup ? "Create Account" : "Log In"}
            </button>

            {!isSignup && (
              <div className="text-right text-xs text-slate-400">
                Don’t have an account?{" "}
                <Link className="text-indigo-400 hover:underline" to="/auth?mode=signup">
                  Sign up
                </Link>
              </div>
            )}
          </form>
        </div>

        {/* right column stays simple & professional */}
        <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6">
          <h3 className="mb-3 text-lg font-semibold">Why sign in?</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            {[
              "Personal dashboard with your scan history",
              "Access to sanitized downloads",
              "Auto deletion policy tracking (48h retention)",
              "One-click JSON reports",
            ].map((t) => (
              <li key={t} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
