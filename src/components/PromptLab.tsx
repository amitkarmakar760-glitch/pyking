import { useMemo, useState } from "react";
import { Dices, Copy, Check, Sparkles, Gamepad2, Palette, Map as MapIcon, Hand, Gauge, Type } from "lucide-react";
import { GENRES, THEMES, ART_STYLES, CONTROLS, DIFFICULTY, buildCustomPrompt } from "../data/gameData";

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="mb-2.5 flex items-center gap-2 font-grotesk text-xs font-bold tracking-[0.18em] text-lime-300/90 uppercase">
      {icon} {children}
    </p>
  );
}

export default function PromptLab() {
  const [genre, setGenre] = useState("arcade");
  const [theme, setTheme] = useState("dhaka");
  const [art, setArt] = useState("cartoon");
  const [control, setControl] = useState("swipe");
  const [difficulty, setDifficulty] = useState("medium");
  const [name, setName] = useState("Rickshaw Rush");
  const [tab, setTab] = useState<"en" | "bn">("en");
  const [copied, setCopied] = useState(false);

  const prompt = useMemo(
    () => buildCustomPrompt({ genre, theme, art, control, difficulty, name }),
    [genre, theme, art, control, difficulty, name]
  );

  const randomize = () => {
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    setGenre(pick(GENRES).id);
    setTheme(pick(THEMES).id);
    setArt(pick(ART_STYLES).id);
    setControl(pick(CONTROLS).id);
    setDifficulty(pick(DIFFICULTY).id);
    const names = ["Padma Panic", "Dhaka Drift", "Bhut FM", "Hilsa Hero", "Gully Kings", "Chai Rush", "Tiger Trail", "Launch Loot"];
    setName(pick(names));
  };

  const copy = async () => {
    const text = tab === "en" ? prompt.english : prompt.bangla;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const chip = (active: boolean) =>
    `rounded-xl border px-3.5 py-2 text-sm font-medium transition-all cursor-pointer ${
      active
        ? "border-lime-300 bg-lime-300 text-black font-bold shadow-[0_0_18px_rgba(200,255,46,0.35)] scale-[1.02]"
        : "border-white/12 bg-white/5 text-white/75 hover:border-white/30 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      {/* Options */}
      <div className="glass space-y-6 rounded-3xl p-6 sm:p-8">
        <div>
          <SectionLabel icon={<Type size={14} />}>১ • গেমের নাম দাও</SectionLabel>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={28}
            placeholder="যেমন: Rickshaw Rush"
            className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-display text-xl font-bold text-white outline-none placeholder:text-white/25 focus:border-lime-300 focus:ring-2 focus:ring-lime-300/30"
          />
        </div>

        <div>
          <SectionLabel icon={<Gamepad2 size={14} />}>২ • জনরা (খেলার ধরন)</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button key={g.id} onClick={() => setGenre(g.id)} className={chip(genre === g.id)} title={g.desc}>
                {g.icon} {g.bn}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[13px] text-white/50">{GENRES.find((g) => g.id === genre)?.desc}</p>
        </div>

        <div>
          <SectionLabel icon={<MapIcon size={14} />}>৩ • থিম (জগৎ)</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <button key={t.id} onClick={() => setTheme(t.id)} className={chip(theme === t.id)}>
                {t.bn}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <SectionLabel icon={<Palette size={14} />}>৪ • আর্ট স্টাইল</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {ART_STYLES.map((a) => (
                <button key={a.id} onClick={() => setArt(a.id)} className={chip(art === a.id)}>
                  {a.bn}
                </button>
              ))}
            </div>
          </div>
          <div>
            <SectionLabel icon={<Hand size={14} />}>৫ • কন্ট্রোল</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {CONTROLS.map((c) => (
                <button key={c.id} onClick={() => setControl(c.id)} className={chip(control === c.id)}>
                  {c.bn}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <SectionLabel icon={<Gauge size={14} />}>৬ • কাঠিন্য</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTY.map((d) => (
              <button key={d.id} onClick={() => setDifficulty(d.id)} className={chip(difficulty === d.id)}>
                {d.bn}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={randomize}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-500/20 to-violet-600/20 px-6 py-3.5 font-display text-lg font-bold text-white transition hover:scale-[1.01] hover:border-fuchsia-300"
        >
          <Dices size={20} /> সারপ্রাইজ! র‍্যান্ডম কম্বো
        </button>
      </div>

      {/* Output */}
      <div className="flex flex-col overflow-hidden rounded-3xl border border-white/12 bg-[#0a0a1a]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-5 py-4">
          <div className="flex items-center gap-2 font-display text-lg font-bold text-white">
            <Sparkles size={18} className="text-lime-300" /> তোমার প্রম্পট রেডি!
          </div>
          <div className="flex rounded-full border border-white/15 bg-white/5 p-1 text-sm font-bold">
            <button
              onClick={() => setTab("en")}
              className={`rounded-full px-4 py-1.5 transition ${tab === "en" ? "bg-lime-300 text-black" : "text-white/60 hover:text-white"}`}
            >
              English 🤖
            </button>
            <button
              onClick={() => setTab("bn")}
              className={`rounded-full px-4 py-1.5 transition ${tab === "bn" ? "bg-lime-300 text-black" : "text-white/60 hover:text-white"}`}
            >
              বাংলা 🇧🇩
            </button>
          </div>
        </div>
        <div className="max-h-[520px] flex-1 overflow-y-auto p-5 sm:p-6">
          <pre className="code-block text-[13.5px] leading-relaxed text-emerald-100/90">
            {tab === "en" ? prompt.english : prompt.bangla}
          </pre>
        </div>
        <div className="flex flex-col gap-3 border-t border-white/10 bg-black/30 p-4 sm:flex-row">
          <button
            onClick={copy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 py-3.5 font-display text-lg font-bold text-black transition hover:scale-[1.01] hover:bg-lime-200"
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
            {copied ? "কপি হয়ে গেছে! ✅" : "প্রম্পট কপি করো"}
          </button>
          <div className="flex items-center justify-center rounded-xl border border-white/12 px-4 py-2 text-xs text-white/55 sm:max-w-[220px]">
            💡 এই প্রম্পট ChatGPT / Claude / Gemini-তে পেস্ট করে কোড বানাও!
          </div>
        </div>
      </div>
    </div>
  );
}
