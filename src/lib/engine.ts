// ─── PYKING engine: Python runner (Pyodide) + game state ─────────────────
// LEARNING NOTE: this file shows (1) how to run untrusted Python safely in a
// browser sandbox, and (2) how to model game state with pure functions.

import type { Challenge } from "../data/challengesA";
import { CHALLENGES_A } from "../data/challengesA";
import { CHALLENGES_B } from "../data/challengesB";
import { CHALLENGES_C } from "../data/challengesC";
import { BADGES } from "../data/levels";

/* ═══════════════ Challenge registry ═══════════════ */

export const ALL_CHALLENGES: Challenge[] = [...CHALLENGES_A, ...CHALLENGES_B, ...CHALLENGES_C];
export const byLevel = (lvl: number) => ALL_CHALLENGES.filter((c) => c.level === lvl).sort((a, b) => a.num - b.num);
export const getChallenge = (id: string) => ALL_CHALLENGES.find((c) => c.id === id);

/* ═══════════════ Python syntax highlighting (tiny regex tokenizer) ═══════════════ */

const PY_KW = new Set("False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield".split(" "));

export function highlightPython(code: string): string {
  // Escape HTML first, then wrap tokens in spans. Order: comments → strings → rest.
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = code.split("\n");
  return lines.map((line) => {
    let out = "", i = 0;
    const push = (cls: string, txt: string) => { out += `<span class="${cls}">${esc(txt)}</span>`; };
    while (i < line.length) {
      const ch = line[i];
      if (ch === "#") { push("tok-com", line.slice(i)); break; }                       // comment
      if (ch === '"' || ch === "'") {                                                  // string
        const q = ch; let j = i + 1, triple = line.slice(i, i + 3) === q.repeat(3);
        if (triple) j = i + 3;
        while (j < line.length) {
          if (line[j] === "\\") { j += 2; continue; }
          if (triple ? line.slice(j, j + 3) === q.repeat(3) : line[j] === q) { j += triple ? 3 : 1; break; }
          j++;
        }
        push("tok-str", line.slice(i, j)); i = j; continue;
      }
      if (ch === "@") { let j = i + 1; while (j < line.length && /[\w.]/.test(line[j])) j++; push("tok-dec", line.slice(i, j)); i = j; continue; }
      if (/\d/.test(ch)) { let j = i; while (j < line.length && /[\w.]/.test(line[j])) j++; push("tok-num", line.slice(i, j)); i = j; continue; }
      if (/[A-Za-z_]/.test(ch)) {
        let j = i; while (j < line.length && /\w/.test(line[j])) j++;
        const w = line.slice(i, j);
        if (PY_KW.has(w)) push("tok-kw", w);
        else if (w === "self") push("tok-self", w);
        else if (line.slice(j).match(/^\s*\(/)) push("tok-fn", w);
        else push("tok-plain", w);
        i = j; continue;
      }
      if ("+-*/%=<>!&|^~".includes(ch)) { push("tok-op", ch); i++; continue; }
      push("tok-plain", ch); i++;
    }
    return out + "\n";
  }).join("");
}

/* ═══════════════ Pyodide runner ═══════════════ */

type Pyodide = {
  runPythonAsync: (code: string, opts?: { globals?: unknown }) => Promise<unknown>;
  globals: { get: (k: string) => (...a: unknown[]) => unknown };
  setStdout: (o: { batched: (s: string) => void }) => void;
  setStderr: (o: { batched: (s: string) => void }) => void;
};

let pyodide: Pyodide | null = null;
let loadPromise: Promise<Pyodide | null> | null = null;
let engineMode: "pyodide" | "fallback" | "loading" = "loading";

export const getEngineMode = () => engineMode;
export const isPyReady = () => pyodide !== null;

export function loadPython(): Promise<Pyodide | null> {
  if (pyodide) return Promise.resolve(pyodide);
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const w = window as unknown as { loadPyodide?: (o?: object) => Promise<Pyodide> };
      if (!w.loadPyodide) throw new Error("pyodide CDN missing");
      // 20s grace for the CDN; afterwards we fall back to static checks.
      const timeout = new Promise<null>((_, rej) => setTimeout(() => rej(new Error("timeout")), 20000));
      pyodide = await Promise.race([w.loadPyodide({}), timeout]) as Pyodide;
      engineMode = "pyodide";
    } catch {
      pyodide = null;
      engineMode = "fallback";
    }
    return pyodide;
  })();
  return loadPromise;
}

export type RunResult = { ok: boolean; output: string; error: string; timedOut: boolean };

function withTimeout<T>(p: Promise<T>, ms: number): Promise<{ v: T | null; timedOut: boolean }> {
  return new Promise((res) => {
    const t = setTimeout(() => res({ v: null, timedOut: true }), ms);
    p.then((v) => { clearTimeout(t); res({ v, timedOut: false }); })
     .catch(() => { clearTimeout(t); res({ v: null, timedOut: false }); });
  });
}

/** Run one snippet with optional fake-stdin. Fresh namespace per run. */
async function execSnippet(code: string, stdinLines: string[]): Promise<RunResult> {
  if (!pyodide) return { ok: false, output: "", error: "ENGINE_NOT_READY", timedOut: false };
  // Static guard against the classic beginner freeze.
  if (/while\s+True\s*:/.test(code) && !/\bbreak\b/.test(code)) {
    return { ok: false, output: "", error: "InfiniteLoopGuard: 'while True' with no break would freeze your game — add a break!", timedOut: false };
  }
  const mock =
    `import sys\n_input_lines = ${JSON.stringify(stdinLines)}\n_input_iter = iter(_input_lines)\n` +
    `def input(prompt=""):\n    try:\n        return next(_input_iter)\n    except StopIteration:\n        raise EOFError("Your code called input() more times than the test provides")\n`;
  let out = "", err = "";
  pyodide.setStdout({ batched: (s) => { out += s + "\n"; } });
  pyodide.setStderr({ batched: (s) => { err += s + "\n"; } });
  try {
    const ns = pyodide.globals.get("dict")();                       // fresh namespace!
    const { timedOut } = await withTimeout(pyodide.runPythonAsync(mock + code, { globals: ns }), 5000);
    if (timedOut) return { ok: false, output: out.trimEnd(), error: "TimeoutError: took longer than 5 seconds — infinite loop?", timedOut: true };
    return { ok: err.trim() === "" && !/Error|Exception/.test(err), output: out.trimEnd(), error: err.trimEnd(), timedOut: false };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Pyodide wraps tracebacks; keep the last meaningful line(s).
    const lines = msg.split("\n").filter((l) => l.trim() && !l.includes("File \"<exec>\""));
    return { ok: false, output: out.trimEnd(), error: lines.slice(-3).join("\n"), timedOut: false };
  }
}

export type CaseResult = { pass: boolean; got: string; want: string; label: string; error?: string };

/** Grade a challenge: stdout tests and/or function-call tests. */
export async function gradeChallenge(code: string, ch: Challenge): Promise<{ results: CaseResult[]; crashed: string | null; fallback: boolean }> {
  if (!pyodide) {
    return { results: fallbackGrade(code, ch), crashed: null, fallback: true };
  }
  const results: CaseResult[] = [];
  // — stdout tests —
  if (ch.tests) {
    for (const t of ch.tests) {
      const lines = t.stdin === "" ? [] : t.stdin.split("\n");
      const r = await execSnippet(code, lines);
      if (!r.ok) {
        // Crashed (traceback): surface the error, mark remaining as failed.
        results.push({ pass: false, got: r.output || "(crashed)", want: t.expected, label: t.label, error: r.error });
        return { results, crashed: r.error, fallback: false };
      }
      const norm = (s: string) => s.replace(/\r\n/g, "\n").split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").trim();
      results.push({ pass: norm(r.output) === norm(t.expected), got: r.output, want: t.expected, label: t.label });
    }
  }
  // — function tests via an injected harness —
  if (ch.func && ch.funcCases) {
    const payload = JSON.stringify(ch.funcCases.map((c) => ({ args: c.args, want: c.expected, label: c.label })))
      .replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const harness = `
import json as _json
__raw = _json.loads('${payload}')
__out = []
for __c in __raw:
    __a = __c["args"].strip()
    try:
        __argv = eval("(" + __a + ",)") if __a else ()
        __r = ${ch.func}(*__argv)
        __got = repr(__r)
        __out.append({"pass": __got == __c["want"], "got": __got, "want": __c["want"], "label": __c["label"]})
    except Exception as __e:
        __got = f"{type(__e).__name__}: {__e}"
        __out.append({"pass": repr(__got) == __c["want"], "got": __got, "want": __c["want"], "label": __c["label"]})
print("__PYKING__" + _json.dumps(__out))`;
    const r = await execSnippet(code + "\n" + harness, []);
    const marker = r.output.split("\n").find((l) => l.startsWith("__PYKING__"));
    if (!marker) {
      const crashed = r.error || "Your code crashed before tests could run.";
      return { results, crashed, fallback: false };
    }
    try {
      const parsed = JSON.parse(marker.replace("__PYKING__", "")) as CaseResult[];
      results.push(...parsed);
    } catch {
      return { results, crashed: "Could not parse test results.", fallback: false };
    }
  }
  return { results, crashed: null, fallback: false };
}

/* ─── Fallback grader (no internet / CDN blocked): token-based static check ─── */

function tokensOf(src: string): Set<string> {
  return new Set((src.toLowerCase().match(/[a-z_][a-z0-9_]*/g) || []).filter((w) => w.length > 1 && !["the", "and", "for"].includes(w)));
}

function fallbackGrade(code: string, ch: Challenge): CaseResult[] {
  const starter = ch.starter.replace(/\s+/g, "");
  const body = code.replace(/\s+/g, "");
  if (!body || body === starter) {
    const all = [...(ch.tests || []).map((t) => ({ want: t.expected, label: t.label })), ...(ch.funcCases || []).map((c) => ({ want: c.expected, label: c.label }))];
    return all.map((t) => ({ pass: false, got: "(no code yet)", want: t.want, label: t.label }));
  }
  const want = tokensOf(ch.solution), have = tokensOf(code);
  let hit = 0; want.forEach((w) => { if (have.has(w)) hit++; });
  const score = want.size ? hit / want.size : 0;
  const pass = score >= 0.55;
  const mk = (wantOut: string, label: string): CaseResult =>
    pass ? { pass: true, got: "(offline check ✓)", want: wantOut, label } : { pass: false, got: `(offline check: similarity ${Math.round(score * 100)}%)`, want: wantOut, label };
  return [
    ...(ch.tests || []).map((t) => mk(t.expected, t.label)),
    ...(ch.funcCases || []).map((c) => mk(c.expected, c.label)),
  ];
}

/* ═══════════════ Friendly error explainer ═══════════════ */

export function explainError(raw: string): { title: string; tip: string } {
  const e = raw.toLowerCase();
  if (e.includes("infiniteLoopGuard".toLowerCase())) return { title: "🌀 Possible infinite loop", tip: "You wrote 'while True' with no break. The loop would run forever — add a break or a changing condition." };
  if (e.includes("timeout")) return { title: "⏱️ Timed out (5s)", tip: "Your code ran too long — usually an infinite loop. Check your while condition actually changes!" };
  if (e.includes("syntaxerror")) {
    if (e.includes("eol") || e.includes("unterminated")) return { title: "🔤 Unfinished string", tip: "You opened a quote but never closed it. Every \" needs a matching \"." };
    if (e.includes("indent")) return { title: "↔️ Indentation error", tip: "Python cares about spaces! Code inside if/for/def/while needs exactly 4 spaces." };
    if (e.includes("invalid syntax")) return { title: "📝 Syntax error", tip: "Missing colon (:), bracket or quote somewhere. Check the line above the error too!" };
    return { title: "📝 Syntax error", tip: "Python couldn't read your code — check colons, brackets and quotes." };
  }
  if (e.includes("nameerror")) { const m = raw.match(/name '(\w+)'/); return { title: `❓ Unknown name: ${m?.[1] || "?"}`, tip: "You used a variable/function that doesn't exist yet. Typo? Or defined AFTER you used it?" }; }
  if (e.includes("typeerror") && e.includes("argument")) return { title: "📦 Wrong arguments", tip: "You called a function with the wrong number of arguments. Count them!" };
  if (e.includes("typeerror")) return { title: "🧪 Type mismatch", tip: "You mixed types that don't work together (like \"text\" + 5). Convert with int() / str() first." };
  if (e.includes("indexerror")) return { title: "📋 Index out of range", tip: "You asked for list position that doesn't exist. Remember: first item is [0], last is [-1]!" };
  if (e.includes("keyerror")) return { title: "🔑 Missing dict key", tip: "That key isn't in the dictionary. Check spelling and capitals — keys are case-sensitive!" };
  if (e.includes("valueerror")) return { title: "⚠️ Bad value", tip: "Right type, wrong value — e.g. int(\"abc\") fails. Wrap risky conversions in try/except!" };
  if (e.includes("zerodivision")) return { title: "➗ Division by zero", tip: "You divided by 0 — mathematically forbidden! Guard with an if first." };
  if (e.includes("eoferror") || e.includes("no more input")) return { title: "⌨️ Too many input() calls", tip: "Your code reads more lines than the test provides. Remove extra input() calls." };
  if (e.includes("attributeerror")) return { title: "🔧 Wrong method", tip: "That object has no such method/attribute. E.g. .append works on lists, not strings!" };
  if (e.includes("filenotfound")) return { title: "📁 File not found", tip: "The file doesn't exist (yet). Did you write it first, or misspell the name?" };
  return { title: "💥 Runtime error", tip: "Your code started but crashed partway. Read the last error line — it names the exact problem!" };
}

/* ═══════════════ Game state (JSON persistence = the "SQLite or JSON" requirement) ═══════════════ */

export type SaveData = {
  name: string;
  xp: number;
  completed: Record<string, { hearts: number; when: number }>;
  failed: Record<string, { count: number; nextReview: number }>;
  reviewsCleared: number;
  streak: number;
  bestStreak: number;
  lastDay: string;                     // yyyy-mm-dd
  badges: string[];
  board: { name: string; xp: number; when: number }[];
  hintsUsed: number;
  runs: number;
};

const KEY = "pyking_save_v1";
const todayStr = () => new Date().toISOString().slice(0, 10);

export function defaultSave(): SaveData {
  return { name: "Hero", xp: 0, completed: {}, failed: {}, reviewsCleared: 0, streak: 0, bestStreak: 0, lastDay: "", badges: [], board: [], hintsUsed: 0, runs: 0 };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    return { ...defaultSave(), ...JSON.parse(raw) };
  } catch { return defaultSave(); }
}

export function storeSave(s: SaveData) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage full/blocked */ }
}

/** Update streak once per day. Returns possibly-new state + whether streak grew. */
export function tickStreak(s: SaveData): { s: SaveData; grew: boolean } {
  const today = todayStr();
  if (s.lastDay === today) return { s, grew: false };
  const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const continued = s.lastDay === y;
  const streak = continued ? s.streak + 1 : 1;
  return { s: { ...s, streak, bestStreak: Math.max(s.bestStreak, streak), lastDay: today }, grew: true };
}

export function awardBadge(s: SaveData, id: string): { s: SaveData; fresh: string | null } {
  if (s.badges.includes(id)) return { s, fresh: null };
  if (!BADGES.find((b) => b.id === id)) return { s, fresh: null };
  return { s: { ...s, badges: [...s.badges, id] }, fresh: id };
}

export function completeChallenge(s: SaveData, ch: Challenge, heartsLeft: number): SaveData {
  let next: SaveData = {
    ...s,
    xp: s.xp + ch.xp + (heartsLeft === 3 ? 25 : 0),       // flawless bonus
    completed: { ...s.completed, [ch.id]: { hearts: heartsLeft, when: Date.now() } },
    failed: Object.fromEntries(Object.entries(s.failed).filter(([k]) => k !== ch.id)),
  };
  // badges: first blood / flawless / scholar / bosses
  const grant = (id: string) => { next = awardBadge(next, id).s; };
  if (Object.keys(next.completed).length === 1) grant("first-blood");
  if (heartsLeft === 3) grant("flawless");
  if (Object.keys(next.completed).length >= 25) grant("scholar");
  if (ch.id === "1-10") grant("boss-1");
  if (ch.id === "3-10") grant("boss-3");
  if (ch.id === "5-10") grant("boss-5");
  if (ch.id === "8-5") grant("boss-8");
  if (ch.id === "9-3") grant("bugking");
  const hr = new Date().getHours();
  if (hr >= 22 || hr < 4) grant("night-owl");
  if (next.streak >= 3) grant("streak-3");
  if (next.streak >= 7) grant("streak-7");
  return next;
}

/** Record a failed submit → spaced repetition (1d, then 3d, then 7d). */
export function recordFailure(s: SaveData, id: string): SaveData {
  const prev = s.failed[id]?.count || 0;
  const gaps = [1, 3, 7];
  const days = gaps[Math.min(prev, gaps.length - 1)];
  return { ...s, failed: { ...s.failed, [id]: { count: prev + 1, nextReview: Date.now() + days * 86400000 } } };
}

export function reviewQueue(s: SaveData): Challenge[] {
  return Object.entries(s.failed)
    .filter(([, f]) => f.nextReview <= Date.now() + 86400000)   // due within a day
    .map(([id]) => getChallenge(id)).filter((c): c is Challenge => !!c && !s.completed[c.id]);
}

/** Level N unlocked if all of level N-1 completed (level 1 always open). */
export function isLevelUnlocked(s: SaveData, lvl: number): boolean {
  if (lvl <= 1) return true;
  return byLevel(lvl - 1).every((c) => s.completed[c.id]);
}

export function levelProgress(s: SaveData, lvl: number) {
  const all = byLevel(lvl);
  const done = all.filter((c) => s.completed[c.id]).length;
  return { done, total: all.length, pct: all.length ? done / all.length : 0 };
}
