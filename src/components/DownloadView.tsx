// ─── PYKING Download Center: Python .zip, GitHub push, Android APK ───────
import { useState } from "react";
import {
  Download, Copy, Check, Smartphone, Globe, Package, FileText,
  Terminal, ExternalLink, RefreshCw, FolderDown, MonitorDown,
} from "lucide-react";
import {
  downloadPythonKit, downloadOfflineHtml, downloadTextFile,
  GITHUB_COMMANDS, KIT_TREE, QUICK_FILES,
} from "../lib/downloadKit";

type PWAEvent = { prompt: () => void } | null;

export default function DownloadView({ installEvt, toast }: { installEvt: PWAEvent; toast: (t: string, e: string) => void }) {
  const [zipping, setZipping] = useState(false);
  const [zipInfo, setZipInfo] = useState<string | null>(null);
  const [copiedGit, setCopiedGit] = useState(false);

  const getKit = async () => {
    setZipping(true);
    try {
      const r = await downloadPythonKit();
      const kb = Math.round(r.bytes / 1024);
      setZipInfo(`${r.files} files • ${kb} KB downloaded`);
      toast(`pyking-python.zip downloaded (${kb} KB)`, "📦");
    } catch {
      toast("Zip failed — try a single file below", "⚠️");
    }
    setZipping(false);
  };

  const copyGit = async () => {
    try { await navigator.clipboard.writeText(GITHUB_COMMANDS); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = GITHUB_COMMANDS; document.body.appendChild(ta);
      ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopiedGit(true);
    setTimeout(() => setCopiedGit(false), 1500);
    toast("GitHub commands copied", "📋");
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold">⬇️ Download Center</h1>
      <p className="mt-1 text-white/55">Everything is in <b className="text-white">English</b>. Grab the Python source for GitHub, and pick your Android path.</p>

      {/* ── Python kit ── */}
      <section className="mt-5 overflow-hidden rounded-3xl border border-yellow-300/30 bg-gradient-to-br from-yellow-300/10 to-amber-500/5">
        <div className="flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-center">
          <div className="flex-1">
            <p className="font-mono2 text-[11px] tracking-widest text-yellow-300 uppercase">🐍 GitHub-ready source</p>
            <h2 className="font-display mt-1 text-2xl font-extrabold">Python project (.zip)</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-white/65">
              The complete runnable desktop edition: Streamlit app, safe code runner (5s timeout),
              grader, SQLite saves, spaced repetition — plus <b className="text-white">all 48 challenges as JSON</b>,
              README and the Android guide. Unzip and run <span className="font-mono2 text-yellow-200">streamlit run main.py</span>.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={getKit} disabled={zipping} className="flex items-center gap-2 rounded-2xl bg-yellow-300 px-7 py-3.5 font-display text-lg font-extrabold text-black transition hover:scale-105 disabled:opacity-60">
                {zipping ? <RefreshCw size={20} className="animate-spin" /> : <Download size={20} />}
                {zipping ? "Packing…" : "Download pyking-python.zip"}
              </button>
              {zipInfo && <span className="flex items-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-200">✓ {zipInfo}</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(QUICK_FILES) as (keyof typeof QUICK_FILES)[]).map((f) => (
                <button key={f} onClick={() => { downloadTextFile(f, QUICK_FILES[f]); toast(`${f} downloaded`, "📄"); }} className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-3.5 py-1.5 text-[13px] font-bold text-white/70 hover:border-yellow-300/50 hover:text-white">
                  <FileText size={13} /> {f}
                </button>
              ))}
            </div>
          </div>
          <div className="w-full shrink-0 overflow-hidden rounded-2xl border border-white/12 bg-black/50 lg:w-72">
            <p className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 text-xs font-bold text-white/60"><FolderDown size={14} /> INSIDE THE ZIP (25 files)</p>
            <ul className="max-h-56 space-y-1 overflow-y-auto p-4 font-mono2 text-[12px] text-white/65">
              {KIT_TREE.map((f) => <li key={f}>📄 {f}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* ── GitHub ── */}
      <section className="panel mt-4 overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 bg-black/30 px-6 py-4">
          <h2 className="font-display text-xl font-extrabold">🐙 Push it to GitHub (3 minutes)</h2>
          <p className="text-sm text-white/55">Unzip the kit, then run these commands inside the <span className="font-mono2 text-yellow-200">pyking/</span> folder.</p>
        </div>
        <div className="grid gap-4 p-6 lg:grid-cols-[1fr_260px]">
          <div className="overflow-hidden rounded-2xl border border-white/12 bg-black/60">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
              <span className="flex items-center gap-1.5 font-mono2 text-[11px] text-white/40"><Terminal size={13} /> terminal</span>
              <button onClick={copyGit} className="flex items-center gap-1 rounded-lg bg-yellow-300 px-3 py-1.5 text-xs font-extrabold text-black hover:bg-yellow-200">
                {copiedGit ? <Check size={13} /> : <Copy size={13} />} {copiedGit ? "Copied!" : "Copy all"}
              </button>
            </div>
            <pre className="overflow-x-auto p-4 font-mono2 text-[13px] leading-relaxed text-emerald-100/90">{GITHUB_COMMANDS}</pre>
          </div>
          <ol className="space-y-2.5 text-[14px] text-white/70">
            {[["1", "Create an empty repo named pyking on github.com (no README)."], ["2", "Replace <YOUR-USERNAME> with your GitHub name."], ["3", "Paste the commands → your code is live on GitHub."], ["4", "Tip: the kit already includes README + .gitignore."]].map(([n, t]) => (
              <li key={n} className="flex gap-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-300 font-display text-[13px] font-extrabold text-black">{n}</span>{t}</li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Android ── */}
      <section className="mt-4">
        <h2 className="font-display text-2xl font-extrabold">📱 Get the Android app / APK</h2>
        <p className="mt-1 text-[15px] text-white/55">The Streamlit app is a server app, so the Android edition is this web build (same 48 challenges). Four ways, easiest first:</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {/* A */}
          <div className="rounded-3xl border border-emerald-400/35 bg-emerald-400/8 p-6">
            <p className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-extrabold text-emerald-200 w-fit">A • EASIEST — 2 MIN</p>
            <h3 className="font-display mt-2 text-xl font-extrabold">Install as app (PWA)</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/65">Adds PYKING to your home screen — fullscreen, offline-ready, auto-updated. Works from any HTTPS host.</p>
            {installEvt ? (
              <button onClick={() => { installEvt.prompt(); toast("Follow the install prompt", "📲"); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 font-display font-extrabold text-black hover:bg-emerald-200">
                <Smartphone size={19} /> Install PYKING now
              </button>
            ) : (
              <div className="mt-3 rounded-xl border border-white/12 bg-black/40 p-3.5 text-[13px] leading-relaxed text-white/70">
                <b className="text-white">On your Android phone:</b> open this site in Chrome → tap <b>⋮</b> → <b>Add to Home screen</b> (or “Install app”). <span className="text-white/45">(The one-tap button appears automatically when Chrome offers install.)</span>
              </div>
            )}
          </div>
          {/* B */}
          <div className="rounded-3xl border border-violet-400/35 bg-violet-400/8 p-6">
            <p className="rounded-full bg-violet-400/20 px-3 py-1 text-xs font-extrabold text-violet-200 w-fit">B • REAL APK FILE</p>
            <h3 className="font-display mt-2 text-xl font-extrabold">PWABuilder APK</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/65">Turns the hosted app into a signed <b className="text-white">.apk</b> (sideload) or <b className="text-white">.aab</b> (Play Store). Manifest + service worker already included.</p>
            <ol className="mt-2 space-y-1.5 text-[13px] text-white/70">
              <li>1️⃣ Host this build on HTTPS (GitHub Pages / Netlify).</li>
              <li>2️⃣ Enter the URL at pwabuilder.com → Package for Android.</li>
              <li>3️⃣ Download the APK and install it on your phone.</li>
            </ol>
            <a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-300/50 bg-violet-400/15 px-5 py-3 font-display font-bold text-violet-100 hover:bg-violet-400/25">
              Open PWABuilder <ExternalLink size={16} />
            </a>
          </div>
          {/* C */}
          <div className="glass rounded-3xl p-6">
            <p className="rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-white/70 w-fit">C • DEVELOPERS</p>
            <h3 className="font-display mt-2 text-xl font-extrabold">Capacitor wrap</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/65">Full native Android Studio project from this single-file build (works offline in a WebView).</p>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-black/50 p-3 font-mono2 text-[12px] leading-relaxed text-white/75">npm i @capacitor/core @capacitor/cli @capacitor/android{"\n"}npx cap init PYKING com.example.pyking{"\n"}npx cap add android{"\n"}npx cap sync{"\n"}npx cap open android</pre>
            <p className="mt-1 text-[12px] text-white/45">Then: Build → Generate App Bundle in Android Studio.</p>
          </div>
          {/* D */}
          <div className="glass rounded-3xl p-6">
            <p className="rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-white/70 w-fit">D • NO BUILD NEEDED</p>
            <h3 className="font-display mt-2 text-xl font-extrabold">Offline HTML file</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/65">One .html file = the whole game. Copy it to your phone and open it in any browser. No install, no account.</p>
            <button onClick={() => { downloadOfflineHtml(); toast("pyking-offline.html downloaded", "📄"); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/8 px-5 py-3 font-display font-bold text-white hover:bg-white/15">
              <MonitorDown size={19} /> Download offline HTML
            </button>
            <p className="mt-2 text-[12px] leading-relaxed text-white/45">Note: live Python runs after one online load (Pyodide CDN); fully offline, the built-in checker still grades quests.</p>
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-[13px] leading-relaxed text-white/55">
          <Package size={16} className="mt-0.5 shrink-0 text-yellow-300" />
          <p><b className="text-white">Full steps with screenshots-checklist</b> are also inside the Python zip as <span className="font-mono2 text-yellow-200">ANDROID_APK_GUIDE.md</span>. Publishing to Google Play needs a $25 one-time Play Console account.</p>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[13px] text-white/45">
          <Globe size={14} /> Tip: free HTTPS hosting for Option A/B — GitHub Pages, Netlify Drop, Vercel, Cloudflare Pages.
        </div>
      </section>
    </main>
  );
}
