// src/pages/Settings.jsx
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

const BASE = import.meta.env.BASE_URL;

export default function Settings() {
  const [me, setMe] = useState(null);
  const [pw, setPw] = useState({ old: "", next: "", confirm: "" });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const vidRef = useRef(null);

  useEffect(() => { api.me().then(setMe).catch(() => setMe(null)); }, []);
  useEffect(() => { vidRef.current?.play().catch(() => {}); }, []);

  async function changePassword(e) {
    e.preventDefault();
    setMsg(null);
    if (!pw.old || !pw.next) return setMsg("Please fill all fields.");
    if (pw.next !== pw.confirm) return setMsg("New passwords do not match.");
    try {
      setBusy(true);
      await api.changePassword({ old_password: pw.old, new_password: pw.next });
      setMsg("Password updated successfully.");
      setPw({ old: "", next: "", confirm: "" });
    } catch (err) {
      setMsg(err.message || "Failed to change password");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount() {
    if (!confirm("Delete your account permanently? This cannot be undone.")) return;
    try {
      setBusy(true);
      await api.deleteAccount();
      localStorage.removeItem("safedocs_token");
      window.dispatchEvent(new Event("auth-changed"));
      window.location.assign("/auth");
    } catch (err) {
      setMsg(err.message || "Failed to delete account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen text-white">
      {/* Landing-style background */}
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

      <section className="relative z-10 mx-auto max-w-3xl px-4 py-14 md:py-16">
        {/* Contact.jsx-matched heading (same size/weight/tracking & color combo) */}
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
          <span className="text-white">Acc</span>
          <span className="text-blue-500">ount</span>
        </h1>

        <div className="mt-6 grid gap-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold mb-2">Profile</h2>
            <p className="text-sm text-slate-300 mb-3">
              These details help personalize your SafeDocs experience.
            </p>
            <div className="text-sm text-slate-200">
              <div>Email: <span className="text-slate-300">{me?.email || "—"}</span></div>
              <div>Joined: <span className="text-slate-300">{me?.created_at || "—"}</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
            {msg && <div className="mb-3 rounded-md bg-white/10 px-3 py-2 text-sm">{msg}</div>}
            <form onSubmit={changePassword} className="space-y-3">
              <input
                type="password"
                className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2"
                placeholder="Current password"
                value={pw.old}
                onChange={(e) => setPw((s) => ({ ...s, old: e.target.value }))}
              />
              <input
                type="password"
                className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2"
                placeholder="New password"
                value={pw.next}
                onChange={(e) => setPw((s) => ({ ...s, next: e.target.value }))}
              />
              <input
                type="password"
                className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2"
                placeholder="Confirm new password"
                value={pw.confirm}
                onChange={(e) => setPw((s) => ({ ...s, confirm: e.target.value }))}
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {busy ? "Please wait…" : "Update Password"}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold mb-2">Account Controls</h2>
            <p className="text-sm text-slate-300 mb-4">
              You can export your reports anytime. Your files are automatically deleted after 48 hours.
            </p>
            <button
              onClick={deleteAccount}
              disabled={busy}
              className="rounded-md bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
            >
              Delete Account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
