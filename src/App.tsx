// ─── PYKING: gamified Python learning ─────────────────────────────────────
// Screens: Adventure map → Challenge arena (real Python execution) → Review,
// Badges, Leaderboard, Blueprint. Progress auto-saves to localStorage (JSON).
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Swords, Map as MapIcon, History, Award, Trophy, BookOpen, Play, Send, Lightbulb,
  X, Heart, Flame, Zap, ChevronRight, Lock, Check, Star, Shield, Timer,
  Skull, Crown, ArrowRight, RefreshCw, Bug, Copy, Eye,
  FileText, Target, Rocket, Ghost, Medal, Download,
} from "lucide-react";
import { LEVELS, BADGES, rankFor } from "./data/levels";
import type { Challenge } from "./data/challengesA";
import {
  ALL_CHALLENGES, byLevel, getChallenge, highlightPython, loadPython, getEngineMode,
  gradeChallenge, explainError, loadSave, storeSave, tickStreak, recordFailure,
  completeChallenge, awardBadge, reviewQueue, isLevelUnlocked, levelProgress,
  type SaveData, type CaseResult,
} from "./lib/engine";
import DownloadView from "./components/DownloadView";

/* ═══════════════ tiny toast system ═══════════════ */
type Toast = { id: number; emoji: string; text: string };
let toastId = 0;

/* ═══════════════ Code editor (highlight overlay + auto-indent) ═══════════════ */
function CodeEditor({ code, setCode }: { code: string; setCode: (c: string) => void }) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutRef = useRef<HTMLDivElement>(null);
  const lines = code.split("\n").length;

  const sync = () => {
    const ta = taRef.current;
    if (!ta) return;
    if (preRef.current) { preRef.current.scrollTop = ta.scrollTop; preRef.current.scrollLeft = ta.scrollLeft; }
    if (gutRef.current) gutRef.current.scrollTop = ta.scrollTop;
  };
  useEffect(sync, [code]);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: en, value } = ta;
    if (e.key === "Tab") {
      e.preventDefault();
      setCode(value.slice(0, s) + "    " + value.slice(en));
      requestAnimationFrame(() => ta.setSelectionRange(s + 4, s + 4));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const cur = value.slice(0, s).split("\n").pop() || "";
      const indent = cur.match(/^ */)?.[0] || "";
      const extra = cur.trimEnd().endsWith(":") ? "    " : "";
      setCode(value.slice(0, s) + "\n" + indent + extra + value.slice(en));
      requestAnimationFrame(() => ta.setSelectionRange(s + 1 + indent.length + extra.length, s + 1 + indent.length + extra.length));
    }
  };

  return (
    <div className="code-editor-wrap overflow-hidden rounded-xl border border-white/12 bg-[#070b18]">
      <div className="flex items-center gap-1.5 border-b border-white/8 bg-black/30 px-4 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="font-mono2 ml-2 text-[11px] text-white/40">solution.py — Tab = 4 spaces</span>
      </div>
      <div className="flex h-[340px]">
        <div ref={gutRef} className="w-12 shrink-0 overflow-hidden border-r border-white/8 bg-black/20 py-4 text-right font-mono2 text-[14px] leading-[1.65] text-white/25 select-none">
          {Array.from({ length: lines }, (_, i) => <div key={i} className="pr-3">{i + 1}</div>)}
        </div>
        <div className="relative flex-1">
          <pre ref={preRef} aria-hidden className="absolute inset-0 overflow-hidden p-4"><code dangerouslySetInnerHTML={{ __html: highlightPython(code) + "\n" }} /></pre>
          <textarea
            ref={taRef} value={code} onChange={(e) => setCode(e.target.value)} onScroll={sync} onKeyDown={onKey}
            spellCheck={false} wrap="off" placeholder="# write your Python here..."
            className="absolute inset-0 h-full w-full overflow-auto p-4 outline-none placeholder:text-white/20"
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Challenge arena (the boss fight!) ═══════════════ */
function Arena({ ch, saveName, completed, onSolve, onFail, onClose, onNext, hasNext, isReview }:
  { ch: Challenge; saveName: string; completed: boolean; onSolve: (hearts: number) => void; onFail: () => void; onClose: () => void; onNext: () => void; hasNext: boolean; isReview: boolean }) {
  const [code, setCode] = useState(ch.starter);
  const [hearts, setHearts] = useState(3);
  const [results, setResults] = useState<CaseResult[] | null>(null);
  const [running, setRunning] = useState<"run" | "submit" | null>(null);
  const [solved, setSolved] = useState(false);
  const [crash, setCrash] = useState<string | null>(null);
  const [runOut, setRunOut] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSol, setShowSol] = useState(false);
  const [enemyHp, setEnemyHp] = useState(100);
  const [enemyFx, setEnemyFx] = useState("");
  const [dead, setDead] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);
  const [copied, setCopied] = useState(false);

  const doRun = async () => {
    setRunning("run"); setCrash(null); setResults(null);
    const preview: Challenge = { ...ch, tests: ch.tests ?? [{ stdin: "", expected: "", label: "Run ▶" }], func: undefined, funcCases: undefined };
    const r = await gradeChallenge(code, preview);
    setUsedFallback(r.fallback);
    if (r.crashed) { setCrash(r.crashed); setRunOut(null); }
    else setRunOut(r.results[0]?.got ?? "(no output)");
    setRunning(null);
  };

  const doSubmit = async () => {
    if (solved || hearts <= 0) return;
    setRunning("submit"); setCrash(null); setRunOut(null);
    const r = await gradeChallenge(code, ch);
    setUsedFallback(r.fallback);
    setRunning(null);
    if (r.crashed && r.results.length === 0) {
      setCrash(r.crashed); setResults(null);
      return; // crash on FIRST test = free retry, no heart lost (kindness!)
    }
    if (r.crashed) setCrash(r.crashed);
    setResults(r.results);
    const passed = r.results.filter((t) => t.pass).length;
    const total = r.results.length || 1;
    if (passed === total && total > 0) {
      setSolved(true); setDead(true); setEnemyHp(0); setEnemyFx("anim-enemy-die");
      setTimeout(() => onSolve(hearts), 900);
    } else {
      setEnemyHp(Math.round(100 * (1 - passed / total)));
      setEnemyFx("anim-enemy-hit"); setTimeout(() => setEnemyFx(""), 500);
      const left = hearts - 1;
      setHearts(left); onFail();
    }
  };

  const explained = crash ? explainError(crash) : null;
  const outOfHearts = hearts <= 0 && !solved;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#04060d]/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
        {/* header */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button onClick={onClose} className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-bold text-white/70 hover:bg-white/10">← Map</button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-extrabold sm:text-2xl">L{ch.level}.{ch.num} — {ch.title}</h2>
              {ch.boss && <span className="anim-glow rounded-full bg-rose-500/25 px-3 py-0.5 text-xs font-extrabold text-rose-200">⚔️ BOSS</span>}
              {isReview && <span className="rounded-full bg-cyan-500/20 px-3 py-0.5 text-xs font-bold text-cyan-200">🔁 REVIEW</span>}
            </div>
            <p className="text-sm text-white/50">{ch.concept} • {ch.xp} XP{completed ? " • already earned — practice mode" : ""}</p>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-white/12 bg-black/40 px-3 py-2">
            {[0, 1, 2].map((i) => <Heart key={i} size={20} className={i < hearts ? "fill-rose-500 text-rose-500" : "text-white/15"} />)}
          </div>
          <button onClick={onClose} className="rounded-xl border border-white/15 bg-white/5 p-2 text-white/70 hover:bg-white/10" aria-label="Close"><X size={20} /></button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[290px_1fr_270px]">
          {/* ── lesson column ── */}
          <div className="space-y-3">
            <div className="panel rounded-2xl p-4">
              <p className="font-mono2 text-[11px] tracking-widest text-amber-300/80 uppercase">📖 Lesson</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-white/80">{ch.lesson}</p>
            </div>
            <div className="rounded-2xl border border-yellow-300/25 bg-yellow-300/8 p-4">
              <p className="font-mono2 text-[11px] tracking-widest text-yellow-300 uppercase">🎯 Your quest</p>
              <p className="mt-1.5 text-[14px] leading-relaxed whitespace-pre-line text-white/90">{ch.task}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowHint(!showHint)} className="flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2.5 text-sm font-bold text-cyan-200 hover:bg-cyan-400/20">
                <Lightbulb size={16} /> Hint
              </button>
              <button onClick={() => setShowSol(!showSol)} className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-bold text-white/60 hover:bg-white/10">
                <Eye size={16} /> Solution
              </button>
            </div>
            {showHint && <div className="anim-pop rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-[14px] leading-relaxed text-cyan-100">💡 {ch.hint}</div>}
            {showSol && (
              <div className="anim-pop overflow-hidden rounded-2xl border border-white/15 bg-black/50">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                  <span className="text-xs font-bold text-white/50">⚠️ peeking forfeits the flawless bonus</span>
                  <button onClick={() => { navigator.clipboard.writeText(ch.solution).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1200); }} className="text-white/50 hover:text-white">{copied ? <Check size={15} /> : <Copy size={15} />}</button>
                </div>
                <pre className="overflow-x-auto p-4 font-mono2 text-[13px] leading-relaxed"><code dangerouslySetInnerHTML={{ __html: highlightPython(ch.solution) }} /></pre>
              </div>
            )}
          </div>

          {/* ── editor column ── */}
          <div className="space-y-3">
            <CodeEditor code={code} setCode={setCode} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <button onClick={doRun} disabled={running !== null} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/8 px-5 py-3 font-display font-bold text-white transition hover:bg-white/15 disabled:opacity-50">
                {running === "run" ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} />} Run
              </button>
              <button onClick={doSubmit} disabled={running !== null || solved || outOfHearts} className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-yellow-300 px-5 py-3 font-display text-lg font-extrabold text-black transition hover:scale-[1.01] hover:bg-yellow-200 disabled:opacity-40">
                {running === "submit" ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />} {solved ? "Victory! ⚔️" : "Attack! Submit"}
              </button>
            </div>
            {usedFallback && <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-[13px] text-amber-200">📴 Offline check mode (Pyodide CDN unreachable) — static analysis instead of live execution.</p>}

            {/* run output */}
            {runOut !== null && !crash && (
              <div className="overflow-hidden rounded-xl border border-white/12 bg-black/60">
                <p className="border-b border-white/10 px-4 py-1.5 font-mono2 text-[11px] text-white/40">▶ OUTPUT</p>
                <pre className="max-h-40 overflow-auto p-4 font-mono2 text-[13px] whitespace-pre-wrap text-emerald-200">{runOut || "(no output)"}</pre>
              </div>
            )}
            {/* crash explainer */}
            {crash && explained && (
              <div className="anim-pop overflow-hidden rounded-xl border border-rose-400/30 bg-rose-500/10">
                <p className="border-b border-rose-400/20 px-4 py-2 font-bold text-rose-200">{explained.title}</p>
                <p className="px-4 pt-2 text-[14px] text-white/80">🩹 {explained.tip}</p>
                <pre className="m-3 overflow-x-auto rounded-lg bg-black/60 p-3 font-mono2 text-[12px] text-rose-200/80">{crash}</pre>
                {results === null && <p className="px-4 pb-3 text-[13px] text-white/50">💝 Crashed before tests ran — <b>no heart lost</b>. Fix & resubmit, {saveName}!</p>}
              </div>
            )}
            {/* test results */}
            {results && (
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className={`anim-pop rounded-xl border p-3 ${r.pass ? "border-emerald-400/30 bg-emerald-400/8" : "border-rose-400/30 bg-rose-500/8"}`}>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${r.pass ? "bg-emerald-400 text-black" : "bg-rose-500 text-white"}`}>{r.pass ? <Check size={14} /> : <X size={14} />}</span>
                      <span className={r.pass ? "text-emerald-200" : "text-rose-200"}>Test {i + 1}: {r.label}</span>
                    </div>
                    {!r.pass && (
                      <div className="mt-2 grid gap-1.5 font-mono2 text-[12px] sm:grid-cols-2">
                        <div className="rounded-lg bg-black/50 p-2"><p className="text-white/35">YOUR OUTPUT</p><p className="whitespace-pre-wrap text-rose-200">{String(r.got).slice(0, 300) || "(empty)"}</p></div>
                        <div className="rounded-lg bg-black/50 p-2"><p className="text-white/35">EXPECTED</p><p className="whitespace-pre-wrap text-emerald-200">{String(r.want).slice(0, 300)}</p></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* victory / defeat panels */}
            {solved && (
              <div className="anim-pop rounded-2xl border border-yellow-300/40 bg-gradient-to-br from-yellow-300/15 to-amber-500/10 p-5 text-center">
                <p className="text-4xl">🎉</p>
                <h3 className="font-display mt-1 text-2xl font-extrabold text-yellow-200">Bug squashed!</h3>
                <p className="mt-1 text-white/70">+{ch.xp} XP{hearts === 3 ? " + 25 flawless bonus 💎" : ""}{completed ? " (practice — already banked)" : ""}</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  {hasNext && <button onClick={onNext} className="flex items-center justify-center gap-1 rounded-xl bg-yellow-300 px-6 py-2.5 font-display font-bold text-black hover:bg-yellow-200">Next quest <ArrowRight size={18} /></button>}
                  <button onClick={onClose} className="rounded-xl border border-white/20 px-6 py-2.5 font-bold text-white/80 hover:bg-white/10">Back to map</button>
                </div>
              </div>
            )}
            {outOfHearts && (
              <div className="anim-pop rounded-2xl border border-rose-400/40 bg-rose-500/10 p-5 text-center">
                <p className="text-4xl">💔</p>
                <h3 className="font-display mt-1 text-xl font-extrabold text-rose-200">Out of hearts!</h3>
                <p className="mt-1 text-sm text-white/65">The bug fought back… Re-read the lesson, peek at the solution, then retry with fresh hearts. This quest joins your <b>Review queue</b> 🔁</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <button onClick={() => { setHearts(3); setResults(null); setCrash(null); }} className="flex items-center justify-center gap-2 rounded-xl bg-rose-400 px-6 py-2.5 font-display font-bold text-black hover:bg-rose-300"><RefreshCw size={18} /> Retry (3 ♥)</button>
                  <button onClick={() => setShowSol(true)} className="rounded-xl border border-white/20 px-6 py-2.5 font-bold text-white/80 hover:bg-white/10">Study solution</button>
                </div>
              </div>
            )}
          </div>

          {/* ── enemy column ── */}
          <div className="space-y-3">
            <div className={`panel rounded-2xl p-5 text-center ${ch.boss ? "border-rose-400/30" : ""}`}>
              <div className={`mx-auto w-fit text-7xl ${dead ? "" : enemyFx}`} style={{ animation: dead ? undefined : undefined }}>
                <span className={dead ? "anim-enemy-die inline-block" : "inline-block"} style={{ animation: "floaty 3.5s ease-in-out infinite" }}>{dead ? "💥" : ch.bugEmoji}</span>
              </div>
              <h3 className="font-display mt-2 font-extrabold">{dead ? `${ch.bug} DEFEATED!` : ch.bug}</h3>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/60">
                <div className="hp-bar h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400" style={{ width: `${enemyHp}%` }} />
              </div>
              <p className="mt-1 font-mono2 text-xs text-white/50">BUG HP {enemyHp}/100</p>
              {ch.boss && !dead && <p className="mt-2 text-xs font-bold text-rose-300">👑 LEVEL BOSS — pass every test to slay it!</p>}
            </div>
            <div className="glass rounded-2xl p-4 text-[13px] leading-relaxed text-white/60">
              <p className="font-bold text-white/80">⚔️ How battle works</p>
              <p className="mt-1">• <b>Run</b> = practice swing (free, shows output)</p>
              <p>• <b>Attack</b> = graded submit (wrong = −1 ♥)</p>
              <p>• Crash on 1st test = free retry 💝</p>
              <p>• Fails return later in 🔁 Review</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ APP ═══════════════ */
type View = "adventure" | "review" | "badges" | "board" | "blueprint" | "download";

const RIVALS = [
  { name: "Guido 🐍", xp: 6800, cpu: true },
  { name: "Ada Lovelace", xp: 4300, cpu: true },
  { name: "Grumpy Goblin", xp: 1500, cpu: true },
  { name: "Script Kitten", xp: 250, cpu: true },
];

export default function App() {
  const [save, setSave] = useState<SaveData>(() => tickStreak(loadSave()).s);
  const [view, setView] = useState<View>("adventure");
  const [selLevel, setSelLevel] = useState(1);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isReview, setIsReview] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [engine, setEngine] = useState<string>(getEngineMode());
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(save.name);
  const [installEvt, setInstallEvt] = useState<{ prompt: () => void } | null>(null);

  useEffect(() => { storeSave(save); }, [save]);
  useEffect(() => { loadPython().then(() => setEngine(getEngineMode())); }, []);
  useEffect(() => {
    // PWA: capture the install prompt + register the offline service worker.
    const handler = (e: Event) => { e.preventDefault(); setInstallEvt(e as unknown as { prompt: () => void }); };
    window.addEventListener("beforeinstallprompt", handler);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => { /* single-file hosting: no SW */ });
    }
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const toast = (text: string, emoji: string) => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, text, emoji }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  };

  const rank = rankFor(save.xp);
  const doneCount = Object.keys(save.completed).length;
  const queue = useMemo(() => reviewQueue(save), [save]);
  const active = activeId ? getChallenge(activeId) : undefined;

  const nextUncompleted = useMemo(() => {
    for (const lvl of LEVELS) {
      if (!isLevelUnlocked(save, lvl.level)) break;
      const c = byLevel(lvl.level).find((x) => !save.completed[x.id]);
      if (c) return c;
    }
    return null;
  }, [save]);

  const openChallenge = (id: string, review = false) => { setActiveId(id); setIsReview(review); window.scrollTo(0, 0); };

  const handleSolve = (ch: Challenge, hearts: number) => {
    const before = new Set(save.badges);
    let n = save.completed[ch.id] ? save : completeChallenge(save, ch, hearts);
    if (isReview) {
      n = { ...n, reviewsCleared: n.reviewsCleared + 1 };
      if (n.reviewsCleared >= 5) n = awardBadge(n, "reviewer").s;
    }
    setSave(n);
    toast(`+${ch.xp}${hearts === 3 ? "+25" : ""} XP — ${ch.title}`, "⚡");
    n.badges.filter((b) => !before.has(b)).forEach((b) => {
      const bd = BADGES.find((x) => x.id === b);
      if (bd) setTimeout(() => toast(`Badge unlocked: ${bd.name}!`, bd.emoji), 600);
    });
  };

  const publishScore = () => {
    setSave((s) => ({ ...s, board: [...s.board.filter((e) => e.name !== s.name), { name: s.name, xp: s.xp, when: Date.now() }] }));
    toast("Score published to the local hall of fame!", "🏆");
  };

  const board = useMemo(() => {
    const me = { name: `${save.name} (you)`, xp: save.xp, cpu: false, you: true };
    return [...save.board.map((e) => ({ ...e, cpu: false, you: false })), ...RIVALS.map((r) => ({ ...r, when: 0, you: false })), me].sort((a, b) => b.xp - a.xp);
  }, [save]);

  const lvlChallenges = byLevel(selLevel);
  const selMeta = LEVELS.find((l) => l.level === selLevel)!;

  return (
    <div className="bg-dungeon min-h-screen">
      {/* toasts */}
      <div className="pointer-events-none fixed top-20 right-4 z-[60] flex w-72 flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="anim-pop flex items-center gap-2.5 rounded-2xl border border-yellow-300/40 bg-[#12172e]/95 px-4 py-3 shadow-xl backdrop-blur">
            <span className="text-2xl">{t.emoji}</span><p className="text-sm font-bold">{t.text}</p>
          </div>
        ))}
      </div>

      {/* ── top bar ── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#060913]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-300 to-amber-500 text-2xl shadow-lg">🐍</div>
            <div className="leading-tight">
              <p className="font-display text-lg font-extrabold">PYKING</p>
              <p className="font-mono2 text-[10px] tracking-widest text-white/40 uppercase">kill bugs • learn python</p>
            </div>
          </div>
          <nav className="mx-auto hidden items-center gap-1 md:flex">
            {([["adventure", "Adventure", MapIcon], ["review", `Review${queue.length ? ` (${queue.length})` : ""}`, History], ["badges", "Badges", Award], ["board", "Ranks", Trophy], ["blueprint", "Blueprint", BookOpen], ["download", "Download", Download]] as const).map(([v, label, Icon]) => (
              <button key={v} onClick={() => setView(v)} className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${view === v ? "bg-yellow-300 text-black" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
                <Icon size={16} /> {label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <span className="hidden items-center gap-1 rounded-full bg-orange-500/15 px-3 py-1.5 text-sm font-bold text-orange-300 sm:flex" title="Day streak"><Flame size={15} /> {save.streak}</span>
            <span className="flex items-center gap-1 rounded-full bg-yellow-300/15 px-3 py-1.5 text-sm font-bold text-yellow-200" title="Total XP"><Zap size={15} /> {save.xp}</span>
            <span className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold lg:flex ${engine === "pyodide" ? "bg-emerald-400/15 text-emerald-300" : engine === "fallback" ? "bg-amber-400/15 text-amber-300" : "bg-white/10 text-white/50"}`} title="Python execution engine">
              <span className={`h-2 w-2 rounded-full ${engine === "pyodide" ? "bg-emerald-400" : engine === "fallback" ? "bg-amber-400" : "animate-pulse bg-white/50"}`} />
              {engine === "pyodide" ? "Python live" : engine === "fallback" ? "Offline check" : "Loading Python…"}
            </span>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-white/8 px-4 py-2 md:hidden">
          {([["adventure", "🗺️ Map"], ["review", `🔁 Review${queue.length ? `(${queue.length})` : ""}`], ["badges", "🏅 Badges"], ["board", "🏆 Ranks"], ["blueprint", "📐 Plan"], ["download", "⬇️ Download"]] as const).map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold ${view === v ? "bg-yellow-300 text-black" : "bg-white/8 text-white/65"}`}>{label}</button>
          ))}
        </nav>
      </header>

      {/* ═══════ ADVENTURE ═══════ */}
      {view === "adventure" && (
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {/* hero */}
          <section className="relative overflow-hidden rounded-[26px] border border-white/12 bg-gradient-to-br from-indigo-950 via-[#0d1430] to-[#1a1030] p-7 sm:p-10">
            <div className="pointer-events-none absolute -top-10 right-10 text-[100px] opacity-20 sm:text-[150px]" style={{ animation: "floaty 5s ease-in-out infinite" }}>⚔️</div>
            <div className="pointer-events-none absolute bottom-4 left-1/3 text-5xl opacity-15" style={{ animation: "floaty 7s ease-in-out infinite" }}>🐍</div>
            <div className="relative max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-yellow-300/15 px-3 py-1 text-xs font-bold text-yellow-200">{rank.emoji} {rank.title}</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">{doneCount}/{ALL_CHALLENGES.length} quests cleared</span>
              </div>
              <h1 className="font-display mt-3 text-3xl font-extrabold sm:text-5xl">
                {editingName ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} maxLength={16} className="w-48 rounded-xl border border-yellow-300/50 bg-black/40 px-3 py-1 text-3xl font-extrabold outline-none" />
                    <button onClick={() => { setSave((s) => ({ ...s, name: nameDraft.trim() || "Hero" })); setEditingName(false); }} className="rounded-xl bg-yellow-300 px-4 py-2 text-base text-black">Save</button>
                  </span>
                ) : (
                  <>Greetings, <button onClick={() => { setNameDraft(save.name); setEditingName(true); }} className="text-yellow-300 underline decoration-dotted underline-offset-4 hover:text-yellow-200" title="click to rename">{save.name}</button>! 👋</>
                )}
              </h1>
              <p className="mt-2 text-white/60">Bugs infest the 9 dungeons. Write <b className="text-white">real Python</b> to slay them — every test you pass deals damage. Good luck, {save.name}.</p>
              {rank.next && (
                <div className="mt-4 max-w-md">
                  <div className="flex justify-between text-xs font-bold text-white/50"><span>Next: {rank.next.emoji} {rank.next.title}</span><span>{save.xp}/{rank.next.min} XP</span></div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-black/50"><div className="xp-bar h-full rounded-full bg-gradient-to-r from-yellow-300 to-amber-500" style={{ width: `${Math.round(rank.progress * 100)}%` }} /></div>
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                {nextUncompleted ? (
                  <button onClick={() => { setSelLevel(nextUncompleted.level); openChallenge(nextUncompleted.id); }} className="flex items-center gap-2 rounded-2xl bg-yellow-300 px-6 py-3 font-display font-extrabold text-black transition hover:scale-105">
                    <Swords size={20} /> Continue: {nextUncompleted.title}
                  </button>
                ) : (
                  <span className="flex items-center gap-2 rounded-2xl bg-yellow-300 px-6 py-3 font-display font-extrabold text-black"><Crown size={20} /> You beat PYKING! 👑</span>
                )}
                {queue.length > 0 && <button onClick={() => setView("review")} className="flex items-center gap-2 rounded-2xl border border-cyan-400/40 bg-cyan-400/10 px-6 py-3 font-display font-bold text-cyan-200 hover:bg-cyan-400/20"><History size={18} /> {queue.length} reviews due</button>}
              </div>
            </div>
          </section>

          {/* stats */}
          <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: <Zap size={18} />, v: save.xp, l: "Total XP", c: "text-yellow-300 bg-yellow-300/10" },
              { icon: <Flame size={18} />, v: `${save.streak}d`, l: `Streak (best ${save.bestStreak})`, c: "text-orange-300 bg-orange-400/10" },
              { icon: <Target size={18} />, v: `${doneCount}/${ALL_CHALLENGES.length}`, l: "Quests cleared", c: "text-emerald-300 bg-emerald-400/10" },
              { icon: <Medal size={18} />, v: `${save.badges.length}/${BADGES.length}`, l: "Badges earned", c: "text-violet-300 bg-violet-400/10" },
            ].map((s, i) => (
              <div key={i} className="glass flex items-center gap-3 rounded-2xl p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.c}`}>{s.icon}</div>
                <div><p className="font-display text-xl font-extrabold">{s.v}</p><p className="text-xs text-white/50">{s.l}</p></div>
              </div>
            ))}
          </section>

          {/* level map */}
          <section className="mt-8">
            <h2 className="font-display text-2xl font-extrabold">🗺️ The 9 Dungeons</h2>
            <p className="text-sm text-white/50">Clear every quest in a dungeon to unlock the next. Each ends with a boss. 💾 Progress auto-saves.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {LEVELS.map((l) => {
                const locked = !isLevelUnlocked(save, l.level);
                const p = levelProgress(save, l.level);
                const sel = selLevel === l.level;
                return (
                  <button key={l.level} disabled={locked} onClick={() => setSelLevel(l.level)} className={`relative overflow-hidden rounded-2xl border p-4 text-left transition ${sel ? "border-yellow-300/60 bg-white/8" : "border-white/10 bg-white/3 hover:border-white/25"} ${locked ? "opacity-45 saturate-50" : ""}`}>
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${l.color}`} />
                    <div className="flex items-start gap-3">
                      <span className="text-4xl">{locked ? <Lock size={30} className="mt-1 text-white/40" /> : l.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono2 text-[10px] tracking-widest text-white/40 uppercase">Level {l.level}</p>
                        <h3 className="font-display font-extrabold">{l.name}</h3>
                        <p className="truncate text-[13px] text-white/55">{l.subtitle}</p>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/50"><div className="xp-bar h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-400" style={{ width: `${p.pct * 100}%` }} /></div>
                        <p className="mt-1 text-xs text-white/45">{locked ? `🔒 ${l.requirement}` : `${p.done}/${p.total} quests • Boss: ${l.bossEmoji} ${l.bossName}`}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* selected level quests */}
          <section className="mt-6 rounded-[26px] border border-white/12 bg-white/2 p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-5xl">{selMeta.emoji}</span>
              <div>
                <p className="font-mono2 text-[11px] tracking-widest text-white/40 uppercase">Level {selMeta.level} — {isLevelUnlocked(save, selMeta.level) ? "unlocked ⚔️" : "locked 🔒"}</p>
                <h3 className="font-display text-2xl font-extrabold">{selMeta.name}</h3>
                <div className="mt-1 flex flex-wrap gap-1.5">{selMeta.topics.map((t) => <span key={t} className="rounded-full bg-white/8 px-2.5 py-0.5 text-xs font-bold text-white/65">{t}</span>)}</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {lvlChallenges.map((c, i) => {
                const done = !!save.completed[c.id];
                const prevDone = i === 0 || !!save.completed[lvlChallenges[i - 1].id];
                const open = prevDone && isLevelUnlocked(save, c.level);
                return (
                  <button key={c.id} disabled={!open} onClick={() => openChallenge(c.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition sm:gap-4 sm:p-4 ${done ? "border-emerald-400/30 bg-emerald-400/6" : c.boss ? "border-rose-400/35 bg-rose-500/8 hover:border-rose-300" : "border-white/10 bg-white/3 hover:border-yellow-300/50"} ${!open ? "opacity-40" : ""}`}>
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display font-extrabold ${done ? "bg-emerald-400 text-black" : c.boss ? "bg-rose-500/25 text-2xl" : "bg-white/10 text-lg"}`}>
                      {done ? <Check size={20} /> : c.boss ? c.bugEmoji : c.num}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-bold">{c.title}</span>
                        <span className="rounded-full bg-black/40 px-2 py-0.5 font-mono2 text-[11px] text-white/55">{c.concept}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] text-white/50">{c.bugEmoji} {c.bug} • +{c.xp} XP{save.failed[c.id] ? " • 🔁 needs review" : ""}</span>
                    </span>
                    {!open ? <Lock size={18} className="shrink-0 text-white/30" /> : <ChevronRight size={20} className="shrink-0 text-white/40" />}
                  </button>
                );
              })}
            </div>
          </section>
        </main>
      )}

      {/* ═══════ REVIEW ═══════ */}
      {view === "review" && (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <h1 className="font-display text-3xl font-extrabold">🔁 Review Dojo</h1>
          <p className="mt-1 text-white/55">Spaced repetition: failed quests return after <b>1 → 3 → 7 days</b>. Slay them for good to earn the <b>Comeback Kid</b> badge (clear 5).</p>
          <div className="glass mt-4 flex items-center gap-3 rounded-2xl p-4">
            <History size={22} className="text-cyan-300" />
            <p className="text-sm text-white/70"><b className="text-white">{save.reviewsCleared}</b> reviews cleared • <b className="text-white">{queue.length}</b> due now • {Object.keys(save.failed).length} total in rotation</p>
          </div>
          {queue.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-emerald-400/30 bg-emerald-400/8 p-10 text-center">
              <p className="text-6xl">🧘</p>
              <h2 className="font-display mt-2 text-2xl font-extrabold text-emerald-200">All clear, sensei!</h2>
              <p className="mt-1 text-white/60">No reviews due. Failed quests will appear here automatically.</p>
              <button onClick={() => setView("adventure")} className="mt-4 rounded-xl bg-emerald-300 px-6 py-2.5 font-display font-bold text-black">Back to adventure</button>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {queue.map((c) => (
                <button key={c.id} onClick={() => openChallenge(c.id, true)} className="flex w-full items-center gap-4 rounded-2xl border border-cyan-400/25 bg-cyan-400/6 p-4 text-left transition hover:border-cyan-300">
                  <span className="text-4xl">{c.bugEmoji}</span>
                  <span className="flex-1">
                    <span className="font-display font-bold">L{c.level}.{c.num} — {c.title}</span>
                    <span className="block text-[13px] text-white/50">Failed {save.failed[c.id]?.count || 1}× • {c.concept} • +{c.xp} XP</span>
                  </span>
                  <span className="flex items-center gap-1 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-extrabold text-black">Rematch <ChevronRight size={16} /></span>
                </button>
              ))}
            </div>
          )}
        </main>
      )}

      {/* ═══════ BADGES ═══════ */}
      {view === "badges" && (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <h1 className="font-display text-3xl font-extrabold">🏅 Trophy Hall</h1>
          <p className="mt-1 text-white/55">{save.badges.length} of {BADGES.length} badges earned. Bosses, streaks & flawless victories await…</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BADGES.map((b) => {
              const has = save.badges.includes(b.id);
              return (
                <div key={b.id} className={`rounded-2xl border p-5 text-center transition ${has ? "border-yellow-300/50 bg-yellow-300/8" : "border-white/10 bg-white/2 opacity-55"}`}>
                  <p className={`text-5xl ${has ? "" : "grayscale"}`}>{has ? b.emoji : "❔"}</p>
                  <h3 className="font-display mt-2 font-extrabold">{has ? b.name : "???"}</h3>
                  <p className="mt-0.5 text-[13px] text-white/60">{has ? b.desc : b.hint}</p>
                  {has && <p className="mt-2 inline-block rounded-full bg-yellow-300/20 px-3 py-0.5 text-xs font-bold text-yellow-200">✓ earned</p>}
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* ═══════ LEADERBOARD ═══════ */}
      {view === "board" && (
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <h1 className="font-display text-3xl font-extrabold">🏆 Hall of Fame <span className="text-base font-normal text-white/40">(local)</span></h1>
          <p className="mt-1 text-white/55">Stored in your browser as JSON — the web twin of the SQLite/JSON requirement. Beat the CPU rivals!</p>
          <div className="mt-5 overflow-hidden rounded-3xl border border-white/12">
            {board.map((e, i) => (
              <div key={i} className={`flex items-center gap-3 border-b border-white/8 px-5 py-3.5 last:border-0 ${"you" in e && e.you ? "bg-yellow-300/12" : i % 2 ? "bg-white/2" : ""}`}>
                <span className="w-8 text-center font-display text-xl font-extrabold">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                <span className="flex-1 font-bold">{"you" in e && e.you ? <span className="text-yellow-200">{e.name}</span> : e.name}{"cpu" in e && e.cpu ? <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 font-mono2 text-[10px] text-white/50">CPU</span> : null}</span>
                <span className="flex items-center gap-1 font-display font-extrabold text-yellow-200"><Zap size={15} /> {e.xp}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={publishScore} className="flex items-center gap-2 rounded-xl bg-yellow-300 px-6 py-2.5 font-display font-bold text-black hover:bg-yellow-200"><Trophy size={18} /> Publish my score ({save.xp} XP)</button>
            <button onClick={() => { if (confirm("Reset ALL progress? This cannot be undone!")) { localStorage.removeItem("pyking_save_v1"); location.reload(); } }} className="rounded-xl border border-rose-400/30 px-5 py-2.5 text-sm font-bold text-rose-300 hover:bg-rose-500/10">Reset progress</button>
          </div>
        </main>
      )}

      {/* ═══════ BLUEPRINT ═══════ */}
      {view === "blueprint" && (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <h1 className="font-display text-3xl font-extrabold">📐 Architecture Blueprint</h1>
          <p className="mt-1 text-white/55">Your requested project plan — plus how <b>this web build</b> mirrors the Python desktop design 1:1 so you can learn from both.</p>

          {/* phase plan */}
          <div className="mt-5 grid gap-2 sm:grid-cols-5">
            {[["Phase 1", "Curriculum & challenge JSON"], ["Phase 2", "Safe code runner (5s timeout)"], ["Phase 3", "Game loop: XP, hearts, bosses"], ["Phase 4", "Save system + review SRS"], ["Phase 5", "Polish: badges, ranks, UI"]].map(([t, d], i) => (
              <div key={i} className="rounded-2xl border border-emerald-400/30 bg-emerald-400/6 p-3">
                <p className="flex items-center gap-1 text-xs font-extrabold text-emerald-300"><Check size={13} /> {t} — DONE</p>
                <p className="mt-1 text-[13px] text-white/65">{d}</p>
              </div>
            ))}
          </div>

          {/* folder structure */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="panel overflow-hidden rounded-2xl">
              <p className="border-b border-white/10 bg-black/30 px-5 py-3 font-display font-bold">📁 Requested Python structure</p>
              <pre className="overflow-x-auto p-5 font-mono2 text-[12.5px] leading-relaxed text-white/75">{`pyking/
├── main.py              # entry point (UI picker)
├── requirements.txt     # nothing exotic: stdlib + UI lib
├── README.md            # setup + run instructions
├── challenges/
│   ├── level_01.json    # 10 challenges (variables…)
│   ├── level_02.json    # 10 challenges (conditionals)
│   ├── level_03.json    # 10 challenges (loops)
│   ├── ...              # levels 4–9, same schema
│   └── schema.json      # challenge file contract
├── engine/
│   ├── __init__.py
│   ├── runner.py        # subprocess + 5s timeout + stdin
│   ├── grader.py        # stdout & function-call tests
│   ├── errors.py        # friendly error explainer
│   ├── srs.py           # spaced-repetition scheduler
│   └── save.py          # SQLite (sqlite3) persistence
├── ui/
│   ├── __init__.py
│   └── app.py           # ★ Streamlit (recommended) ★
└── data/
    ├── pyking.db       # XP, hearts, streaks, badges
    └── leaderboard.json # local ranks`}</pre>
            </div>
            <div className="panel overflow-hidden rounded-2xl">
              <p className="border-b border-white/10 bg-black/30 px-5 py-3 font-display font-bold">🌐 This web build (same architecture!)</p>
              <pre className="overflow-x-auto p-5 font-mono2 text-[12.5px] leading-relaxed text-white/75">{`src/
├── App.tsx              # ← main.py + ui/app.py (all screens)
├── data/
│   ├── levels.ts        # curriculum: ranks, badges
│   ├── challengesA.ts   # ← challenges/level_01+02.json
│   ├── challengesB.ts   # ← challenges/level_03.json
│   └── challengesC.ts   # ← challenges/level_04-09.json
└── lib/
    └── engine.ts        # ← engine/ (runner, grader,
                         #    errors, srs, save) in one file

data/ → localStorage JSON (the "or JSON" option)
runner → Pyodide sandbox (browser twin of
         subprocess + timeout=5)`}</pre>
            </div>
          </div>

          {/* challenge schema */}
          <div className="panel mt-4 overflow-hidden rounded-2xl">
            <p className="border-b border-white/10 bg-black/30 px-5 py-3 font-display font-bold">🧩 Challenge JSON schema — add quests without touching code</p>
            <pre className="overflow-x-auto p-5 font-mono2 text-[12.5px] leading-relaxed text-emerald-100/80">{`{
  "id": "2-8", "level": 2, "num": 8,
  "title": "FizzBuzz Scout", "concept": "modulo + order",
  "bug": "Number Nymph", "bugEmoji": "🧝", "xp": 90,
  "lesson": "Check the COMBINED case first...",
  "task": "Read int n, then print Fizz/Buzz/...",
  "hint": "if n % 3 == 0 and n % 5 == 0 FIRST...",
  "starter": "# read n, print Fizz/Buzz/...\\n",
  "solution": "n = int(input())\\nif ...",
  "tests": [                       // stdout style…
    { "stdin": "15", "expected": "FizzBuzz", "label": "15 → FizzBuzz" }
  ],
  "func": "is_even",               // …OR function-call style
  "funcCases": [
    { "args": "4", "expected": "True", "label": "is_even(4)" }
  ]
}`}</pre>
          </div>

          {/* runner sketch + readme */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="panel overflow-hidden rounded-2xl">
              <p className="border-b border-white/10 bg-black/30 px-5 py-3 font-display font-bold">🛡️ engine/runner.py sketch (your Python version)</p>
              <pre className="overflow-x-auto p-5 font-mono2 text-[12.5px] leading-relaxed text-white/75">{`import subprocess, sys, json

def run_user_code(code: str, stdin: str = "") -> dict:
    """Run untrusted code with a 5-second kill switch."""
    try:
        done = subprocess.run(
            [sys.executable, "-c", code],
            input=stdin, capture_output=True,
            text=True, timeout=5,       # ← the safety net
        )
        return {"ok": done.returncode == 0,
                "out": done.stdout.strip(),
                "err": done.stderr.strip()[-500:]}
    except subprocess.TimeoutExpired:
        return {"ok": False, "out": "",
                "err": "Timeout: infinite loop?"}

# Grading = run per test case, compare .strip() output.
# Function tests: append a harness that calls the
# function and prints "__PYKING__" + json results
# (exactly like this web app does with Pyodide).`}</pre>
            </div>
            <div className="panel overflow-hidden rounded-2xl">
              <p className="border-b border-white/10 bg-black/30 px-5 py-3 font-display font-bold">📖 README — setup & run</p>
              <div className="space-y-3 p-5 text-[14px] leading-relaxed text-white/75">
                <p><b className="text-white">Why Streamlit?</b> One <span className="font-mono2 text-yellow-200">pip install streamlit</span>, real text areas + buttons, zero GUI boilerplate. Tkinter = clunky widgets, Pygame = overkill for forms, Flask = you rebuild everything.</p>
                <pre className="overflow-x-auto rounded-xl bg-black/50 p-3 font-mono2 text-[12.5px] text-emerald-100/85">{`# 1. Python 3.11+  →  python --version
# 2. Clone & install
git clone <your-repo> pyking && cd pyking
pip install -r requirements.txt   # streamlit
# 3. Play!
streamlit run main.py
# 4. Add quests: drop a JSON file in challenges/
#    (validated against challenges/schema.json)`}</pre>
                <p><b className="text-white">Safety:</b> subprocess + timeout=5, no network in player code, stderr truncated to 500 chars, infinite-loop guard warns on <span className="font-mono2 text-yellow-200">while True</span> without break.</p>
                <p><b className="text-white">Save:</b> <span className="font-mono2 text-yellow-200">data/pyking.db</span> via sqlite3 (tables: progress, reviews, badges, board). This web demo uses the JSON twin: localStorage.</p>
              </div>
            </div>
          </div>

          {/* decision cards */}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { i: <Shield size={20} />, t: "Safe by design", d: "Subprocess isolation + 5s timeout on desktop; Pyodide WASM sandbox here. Tracebacks are trimmed & translated to kid-friendly tips." },
              { i: <History size={20} />, t: "Spaced repetition", d: "Failures resurface after 1 → 3 → 7 days (engine/srs.py). The Review Dojo is the same scheduler with a katana." },
              { i: <Star size={20} />, t: "Juice = retention", d: "3 hearts, flawless bonus (+25 XP), 12 badges, 8 ranks, CPU rivals. Emotion per submit: shake, HP bars, confetti toasts." },
            ].map((c, i) => (
              <div key={i} className="glass rounded-2xl p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-300/15 text-yellow-300">{c.i}</div>
                <h3 className="font-display mt-2 font-bold">{c.t}</h3>
                <p className="mt-1 text-[13.5px] text-white/60">{c.d}</p>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ═══════ DOWNLOAD ═══════ */}
      {view === "download" && <DownloadView installEvt={installEvt} toast={toast} />}

      {/* arena overlay */}
      {active && (
        <Arena
          key={active.id} ch={active} saveName={save.name} completed={!!save.completed[active.id]} isReview={isReview}
          onSolve={(h) => handleSolve(active, h)}
          onFail={() => setSave((s) => recordFailure(s, active.id))}
          onClose={() => { setActiveId(null); setIsReview(false); }}
          hasNext={(() => { const l = byLevel(active.level); const i = l.findIndex((c) => c.id === active.id); return i < l.length - 1 || isLevelUnlocked(save, active.level + 1); })()}
          onNext={() => {
            const l = byLevel(active.level); const i = l.findIndex((c) => c.id === active.id);
            if (i < l.length - 1) openChallenge(l[i + 1].id, false);
            else { const nl = byLevel(active.level + 1)[0]; if (nl) { setSelLevel(nl.level); openChallenge(nl.id, false); } }
          }}
        />
      )}

      {/* mobile bottom pad + footer */}
      <footer className="border-t border-white/10 bg-black/40 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-center text-[13px] text-white/40 sm:px-6 md:flex-row md:text-left">
          <p>🐍⚔️ <b className="text-white/70">PYKING</b> — {ALL_CHALLENGES.length} quests • real Python in your browser • progress auto-saves as JSON</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Timer size={14} /> 5s timeout guard</span>
            <span className="flex items-center gap-1"><Bug size={14} /> {doneCount} bugs squashed</span>
            <span className="hidden items-center gap-1 sm:flex"><Ghost size={14} /> BUG KING awaits…</span>
          </div>
        </div>
      </footer>

      {/* fun floating bg icons */}
      <div className="pointer-events-none fixed bottom-6 left-5 hidden text-3xl opacity-20 xl:block" style={{ animation: "floaty 6s ease-in-out infinite" }}>🐍</div>
      <div className="pointer-events-none fixed top-1/3 right-4 hidden text-3xl opacity-20 xl:block" style={{ animation: "floaty 8s ease-in-out infinite" }}>👾</div>
    </div>
  );
}

// Re-export icons used conditionally to keep tree-shaking happy
export { FileText, Rocket, Skull };
