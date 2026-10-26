// ─── PYKING curriculum metadata: levels, ranks, badges ────────────────
// Well-commented: this file is the "table of contents" of the whole game.

/** One dungeon (level) on the adventure map. */
export type LevelMeta = {
  level: number;
  name: string;
  subtitle: string;
  topics: string[];
  emoji: string;
  color: string;      // tailwind gradient stops
  glow: string;
  bossName: string;
  bossEmoji: string;
  requirement: string;
};

export const LEVELS: LevelMeta[] = [
  { level: 1, name: "Print Caverns", subtitle: "Variables, types, print & input", topics: ["print()", "variables", "str / int / float / bool", "input()"], emoji: "🕯️", color: "from-emerald-400 to-teal-600", glow: "shadow-emerald-500/30", bossName: "Echo Ooze", bossEmoji: "🟢", requirement: "No requirement — start here!" },
  { level: 2, name: "Forked Forest", subtitle: "Conditionals: if / elif / else", topics: ["if / else", "elif chains", "comparison ops", "logical ops"], emoji: "🌲", color: "from-lime-400 to-green-600", glow: "shadow-lime-500/30", bossName: "Two-Faced Treant", bossEmoji: "🌳", requirement: "Clear Level 1" },
  { level: 3, name: "Loop Lagoon", subtitle: "for & while loops", topics: ["for + range()", "while", "break / continue", "nested loops"], emoji: "🌀", color: "from-cyan-400 to-blue-600", glow: "shadow-cyan-500/30", bossName: "Infinite Hydra", bossEmoji: "🐉", requirement: "Clear Level 2" },
  { level: 4, name: "Collection Crypt", subtitle: "Lists, tuples, dicts, sets", topics: ["lists & slicing", "tuples", "dicts", "sets & comprehensions"], emoji: "📦", color: "from-amber-400 to-orange-600", glow: "shadow-amber-500/30", bossName: "Mimic Chest", bossEmoji: "🧰", requirement: "Clear Level 3" },
  { level: 5, name: "Function Forge", subtitle: "Functions, scope, lambda", topics: ["def + return", "args / kwargs", "scope & closures", "lambda + map/filter"], emoji: "⚒️", color: "from-orange-400 to-red-600", glow: "shadow-orange-500/30", bossName: "Recursion Dragon", bossEmoji: "🐲", requirement: "Clear Level 4" },
  { level: 6, name: "OOP Observatory", subtitle: "Classes & inheritance", topics: ["classes & __init__", "methods", "inheritance", "dunder methods"], emoji: "🔭", color: "from-violet-400 to-purple-700", glow: "shadow-violet-500/30", bossName: "Polymorph Beholder", bossEmoji: "👁️", requirement: "Clear Level 5" },
  { level: 7, name: "Exception Abyss", subtitle: "Files & exceptions", topics: ["try / except", "raising errors", "file I/O", "with + JSON"], emoji: "🕳️", color: "from-rose-400 to-pink-700", glow: "shadow-rose-500/30", bossName: "Corrupted Kraken", bossEmoji: "🦑", requirement: "Clear Level 6" },
  { level: 8, name: "Meta Mountain", subtitle: "Modules, decorators, generators", topics: ["modules & pip", "decorators", "generators / yield", "itertools thinking"], emoji: "⛰️", color: "from-sky-300 to-indigo-600", glow: "shadow-sky-500/30", bossName: "The Grand Decorator", bossEmoji: "🧙", requirement: "Clear Level 7" },
  { level: 9, name: "Final Sanctum", subtitle: "Boss Level: mini project", topics: ["combine everything", "mini project", "code review"], emoji: "👑", color: "from-yellow-300 to-amber-600", glow: "shadow-yellow-500/40", bossName: "BUG KING NULL", bossEmoji: "👾", requirement: "Clear Level 8" },
];

/** Player rank titles based on total XP. */
export const RANKS: { min: number; title: string; emoji: string }[] = [
  { min: 0, title: "Script Kitten", emoji: "🐱" },
  { min: 300, title: "Bug Hunter", emoji: "🔍" },
  { min: 800, title: "Loop Ranger", emoji: "🏹" },
  { min: 1500, title: "Function Knight", emoji: "⚔️" },
  { min: 2500, title: "Class Wizard", emoji: "🧙" },
  { min: 3800, title: "Exception Slayer", emoji: "🛡️" },
  { min: 5200, title: "Python Archmage", emoji: "🐍" },
  { min: 7000, title: "BUG KING'S BANE", emoji: "👑" },
];

export function rankFor(xp: number) {
  let r = RANKS[0];
  for (const k of RANKS) if (xp >= k.min) r = k;
  const idx = RANKS.indexOf(r);
  const next = RANKS[idx + 1] ?? null;
  return { ...r, next, progress: next ? (xp - r.min) / (next.min - r.min) : 1 };
}

/** Badge definitions. `check` is evaluated in the store. */
export type Badge = { id: string; name: string; desc: string; emoji: string; hint: string };

export const BADGES: Badge[] = [
  { id: "first-blood", name: "First Blood", desc: "Pass your first challenge", emoji: "🩸", hint: "Complete any challenge" },
  { id: "flawless", name: "Flawless Victory", desc: "Pass a challenge with 3 hearts left", emoji: "💎", hint: "No mistakes on a challenge" },
  { id: "streak-3", name: "Warming Up", desc: "3-day streak", emoji: "🔥", hint: "Play 3 days in a row" },
  { id: "streak-7", name: "Unstoppable", desc: "7-day streak", emoji: "☄️", hint: "Play 7 days in a row" },
  { id: "boss-1", name: "Ooze Evaporator", desc: "Defeat the Level 1 boss", emoji: "🧪", hint: "Beat Echo Ooze" },
  { id: "boss-3", name: "Hydra Header", desc: "Defeat the Level 3 boss", emoji: "🐲", hint: "Beat the Infinite Hydra" },
  { id: "boss-5", name: "Dragon Tamer", desc: "Defeat the Level 5 boss", emoji: "🏆", hint: "Beat the Recursion Dragon" },
  { id: "boss-8", name: "Mountain Toppler", desc: "Defeat the Level 8 boss", emoji: "⛰️", hint: "Beat the Grand Decorator" },
  { id: "bugking", name: "BUG KING'S BANE", desc: "Finish the Final Sanctum", emoji: "👑", hint: "Complete the mini project" },
  { id: "scholar", name: "Scholar", desc: "Complete 25 challenges", emoji: "📚", hint: "Complete 25 challenges" },
  { id: "reviewer", name: "Comeback Kid", desc: "Clear 5 reviews", emoji: "🔁", hint: "Use Review Mode" },
  { id: "night-owl", name: "Night Owl", desc: "Code after midnight... or just late", emoji: "🦉", hint: "Play between 10pm–4am" },
];
