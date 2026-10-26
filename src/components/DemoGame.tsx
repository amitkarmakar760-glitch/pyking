import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Trophy, Coins, Heart, ChevronLeft, ChevronRight, Zap } from "lucide-react";

type Obstacle = { x: number; y: number; w: number; h: number; speed: number; kind: number; passed: boolean };
type Coin = { x: number; y: number; taken: boolean; phase: number };

const LANES = [0.18, 0.5, 0.82];

function beep(ctx: AudioContext, freq: number, dur: number, type: OscillatorType = "square", vol = 0.06) {
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.stop(ctx.currentTime + dur);
  } catch { /* noop */ }
}

export default function DemoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [best, setBest] = useState(() => Number(localStorage.getItem("rr_best") || 0));
  const [muted, setMuted] = useState(false);
  const [speedLevel, setSpeedLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState<"none" | "crash" | "coin">("none");

  const state = useRef({
    px: 0.5, targetX: 0.5,
    obstacles: [] as Obstacle[],
    coinsArr: [] as Coin[],
    dist: 0, roadOffset: 0,
    spawnT: 0, coinT: 0,
    elapsed: 0, shake: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
  });

  const audioRef = useRef<AudioContext | null>(null);
  const runningRef = useRef(false);
  const mutedRef = useRef(false);
  runningRef.current = running;
  mutedRef.current = muted;

  const W = 420, H = 640;

  const reset = useCallback(() => {
    state.current = {
      px: 0.5, targetX: 0.5, obstacles: [], coinsArr: [],
      dist: 0, roadOffset: 0, spawnT: 0, coinT: 0, elapsed: 0, shake: 0, particles: [],
    };
    setScore(0); setCoins(0); setLives(3); setSpeedLevel(1); setCombo(0); setGameOver(false);
  }, []);

  const start = useCallback(() => {
    if (!audioRef.current) {
      try { audioRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); } catch { /* noop */ }
    }
    audioRef.current?.resume().catch(() => {});
    if (gameOver) reset();
    setRunning(true);
  }, [gameOver, reset]);

  const move = useCallback((dir: -1 | 1) => {
    const s = state.current;
    const idx = LANES.reduce((bi, l, i) => (Math.abs(l - s.targetX) < Math.abs(LANES[bi] - s.targetX) ? i : bi), 0);
    const ni = Math.min(2, Math.max(0, idx + dir));
    s.targetX = LANES[ni];
    if (audioRef.current && !mutedRef.current) beep(audioRef.current, 320 + ni * 80, 0.07, "sine", 0.04);
  }, []);

  // keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { move(-1); if (runningRef.current) e.preventDefault(); }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { move(1); if (runningRef.current) e.preventDefault(); }
      if (e.key === " " || e.key === "Enter") {
        if (!runningRef.current) start();
      }
      if (e.key === "p" || e.key === "P") setRunning((r) => !r);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [move, start]);

  // touch drag on canvas
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    let sx = 0;
    const ts = (e: TouchEvent) => { sx = e.touches[0].clientX; };
    const tm = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - sx;
      if (Math.abs(dx) > 24) {
        const rect = c.getBoundingClientRect();
        const rel = (e.touches[0].clientX - rect.left) / rect.width;
        state.current.targetX = Math.min(0.85, Math.max(0.15, rel));
      }
      e.preventDefault();
    };
    c.addEventListener("touchstart", ts, { passive: true });
    c.addEventListener("touchmove", tm, { passive: false });
    return () => { c.removeEventListener("touchstart", ts); c.removeEventListener("touchmove", tm); };
  }, []);

  // main loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        const s = state.current;
        const speedBase = 260 + s.elapsed * 9;
        setSpeedLevel(Math.min(10, 1 + Math.floor(s.elapsed / 12)));

        if (runningRef.current && !gameOver) {
          s.elapsed += dt;
          s.dist += speedBase * dt;
          s.roadOffset = (s.roadOffset + speedBase * dt) % 60;
          // smooth player
          s.px += (s.targetX - s.px) * Math.min(1, dt * 10);

          // spawn obstacles
          s.spawnT -= dt;
          const interval = Math.max(0.45, 1.05 - s.elapsed * 0.012);
          if (s.spawnT <= 0) {
            s.spawnT = interval;
            const lane = LANES[Math.floor(Math.random() * 3)];
            // avoid blocking all lanes: max 2 obstacles at same y
            const recentTop = s.obstacles.filter((o) => o.y < 120).length;
            if (recentTop < 2) {
              s.obstacles.push({
                x: lane, y: -90, w: 0.2, h: 78,
                speed: speedBase * (0.85 + Math.random() * 0.3),
                kind: Math.floor(Math.random() * 4), passed: false,
              });
            }
          }
          // spawn coins
          s.coinT -= dt;
          if (s.coinT <= 0) {
            s.coinT = 0.7 + Math.random() * 0.9;
            s.coinsArr.push({ x: LANES[Math.floor(Math.random() * 3)], y: -30, taken: false, phase: Math.random() * 6 });
          }

          // update obstacles
          const pxw = 0.2;
          let crashed = false;
          for (const o of s.obstacles) {
            o.y += o.speed * dt;
            // near-miss
            if (!o.passed && o.y > H * 0.78) {
              o.passed = true;
              const dx = Math.abs(o.x - s.px);
              if (dx < 0.34 && dx > pxw / 2 + o.w / 2 - 0.02) {
                setCombo((c) => {
                  const n = c + 1;
                  if (audioRef.current && !mutedRef.current) beep(audioRef.current, 600 + n * 60, 0.12, "sine", 0.07);
                  return n;
                });
                setScore((sc) => sc + 25);
              } else {
                setCombo(0);
              }
            }
            // collision (player y ~ H*0.78)
            const py = H * 0.78;
            if (Math.abs(o.y + o.h / 2 - py) < (o.h / 2 + 26) && Math.abs(o.x - s.px) < (o.w / 2 + pxw / 2 - 0.03)) {
              crashed = true;
              o.y = H + 200;
              // particles
              for (let i = 0; i < 22; i++) {
                s.particles.push({ x: s.px * W, y: py, vx: (Math.random() - 0.5) * 420, vy: (Math.random() - 0.7) * 420, life: 1, color: ["#ff5252", "#ffb020", "#fff"][i % 3] });
              }
            }
          }
          s.obstacles = s.obstacles.filter((o) => o.y < H + 160);

          if (crashed) {
            s.shake = 14;
            setFlash("crash");
            setTimeout(() => setFlash("none"), 180);
            if (audioRef.current && !mutedRef.current) {
              beep(audioRef.current, 120, 0.3, "sawtooth", 0.12);
              setTimeout(() => audioRef.current && !mutedRef.current && beep(audioRef.current!, 80, 0.35, "sawtooth", 0.1), 60);
            }
            setLives((l) => {
              const nl = l - 1;
              if (nl <= 0) {
                setRunning(false);
                setGameOver(true);
                setBest((b) => {
                  const sc = Math.floor(s.dist / 10) + coins * 10;
                  const nb = Math.max(b, sc);
                  localStorage.setItem("rr_best", String(nb));
                  return nb;
                });
              }
              return Math.max(0, nl);
            });
            setCombo(0);
          }

          // coins
          for (const cn of s.coinsArr) {
            cn.y += speedBase * dt;
            cn.phase += dt * 6;
            const py = H * 0.78;
            if (!cn.taken && Math.abs(cn.y - py) < 40 && Math.abs(cn.x - s.px) < 0.13) {
              cn.taken = true;
              setCoins((c) => c + 1);
              setScore((sc) => sc + 10);
              setFlash("coin");
              setTimeout(() => setFlash("none"), 120);
              if (audioRef.current && !mutedRef.current) beep(audioRef.current, 880, 0.1, "sine", 0.08);
              for (let i = 0; i < 8; i++) {
                s.particles.push({ x: cn.x * W, y: cn.y, vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 260, life: 0.7, color: "#ffd54a" });
              }
            }
          }
          s.coinsArr = s.coinsArr.filter((c) => c.y < H + 40 && !c.taken);
          setScore(Math.floor(s.dist / 10) + coins * 10);

          // particles
          for (const p of s.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; p.life -= dt; }
          s.particles = s.particles.filter((p) => p.life > 0);
          if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 40);
        }

        // ---- RENDER ----
        ctx.save();
        if (s.shake > 0) ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);

        // sky/grass sides
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#0b1026");
        g.addColorStop(1, "#131a3a");
        ctx.fillStyle = g;
        ctx.fillRect(-20, -20, W + 40, H + 40);

        // side strips (footpath)
        ctx.fillStyle = "#1c2450";
        ctx.fillRect(0, 0, 26, H);
        ctx.fillRect(W - 26, 0, 26, H);
        // road
        ctx.fillStyle = "#232b55";
        ctx.fillRect(26, 0, W - 52, H);
        // lane dashes
        ctx.fillStyle = "rgba(200,255,46,0.75)";
        for (const lx of [0.34, 0.66]) {
          for (let y = -60 + s.roadOffset; y < H + 60; y += 60) {
            ctx.fillRect(W * lx - 3, y, 6, 30);
          }
        }
        // edge glow
        ctx.fillStyle = "#c8ff2e";
        ctx.fillRect(26, 0, 3, H);
        ctx.fillRect(W - 29, 0, 3, H);

        // Bangla billboards on side
        ctx.save();
        ctx.fillStyle = "rgba(255,176,32,0.14)";
        const bbY = H - ((s.roadOffset * 2) % (H + 200)) + 60;
        ctx.fillRect(2, bbY, 22, 90);
        ctx.fillRect(W - 24, (bbY + 260) % (H + 150) - 60, 22, 90);
        ctx.restore();

        // coins
        for (const cn of s.coinsArr) {
          const cx = cn.x * W, cy = cn.y;
          const sq = Math.abs(Math.sin(cn.phase));
          ctx.save();
          ctx.shadowColor = "#ffd54a"; ctx.shadowBlur = 14;
          ctx.fillStyle = "#ffd54a";
          ctx.beginPath();
          ctx.ellipse(cx, cy, 6 + 8 * sq, 14, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = "#8a5b00";
          ctx.font = "bold 11px sans-serif";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          if (sq > 0.4) ctx.fillText("৳", cx, cy);
          ctx.restore();
        }

        // obstacles (traffic)
        const kinds = [
          { body: "#ff5d5d", top: "#ff8a8a", label: "BUS", emoji: "🚌" },
          { body: "#3ec6ff", top: "#9be7ff", label: "CNG", emoji: "🛺" },
          { body: "#b678ff", top: "#d6b8ff", label: "TRUCK", emoji: "🚚" },
          { body: "#ffb020", top: "#ffe1a1", label: "CAR", emoji: "🚕" },
        ];
        for (const o of s.obstacles) {
          const k = kinds[o.kind];
          const ox = o.x * W, oy = o.y;
          const ow = o.w * W, oh = o.h;
          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
          ctx.fillStyle = k.body;
          ctx.beginPath();
          ctx.roundRect(ox - ow / 2, oy, ow, oh, 12);
          ctx.fill();
          ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.beginPath();
          ctx.roundRect(ox - ow / 2 + 8, oy + 10, ow - 16, 20, 6);
          ctx.fill();
          ctx.fillStyle = "rgba(0,0,0,0.55)";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(k.label, ox, oy + 56);
          ctx.font = "22px serif";
          ctx.fillText(k.emoji, ox, oy + 34);
          // headlights
          ctx.fillStyle = "#fff8c4";
          ctx.beginPath();
          ctx.arc(ox - ow / 2 + 10, oy + oh - 4, 5, 0, Math.PI * 2);
          ctx.arc(ox + ow / 2 - 10, oy + oh - 4, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // particles
        for (const p of s.particles) {
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
        }
        ctx.globalAlpha = 1;

        // player rickshaw
        const pxx = s.px * W, pyy = H * 0.78;
        ctx.save();
        ctx.shadowColor = "#c8ff2e"; ctx.shadowBlur = 22;
        ctx.fillStyle = "#c8ff2e";
        ctx.beginPath();
        ctx.roundRect(pxx - 42, pyy - 34, 84, 72, 16);
        ctx.fill();
        ctx.shadowBlur = 0;
        // canopy
        ctx.fillStyle = "#ff2e7e";
        ctx.beginPath();
        ctx.roundRect(pxx - 36, pyy - 30, 72, 22, 10);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("ঢাকা মেট্রো", pxx, pyy - 15);
        // driver
        ctx.font = "30px serif";
        ctx.fillText("🛺", pxx, pyy + 22);
        // wheels
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(pxx - 28, pyy + 36, 9, 0, Math.PI * 2);
        ctx.arc(pxx + 28, pyy + 36, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // flash overlays
        if (flash === "crash") { ctx.fillStyle = "rgba(255,40,40,0.25)"; ctx.fillRect(0, 0, W, H); }
        if (flash === "coin") { ctx.fillStyle = "rgba(255,213,74,0.12)"; ctx.fillRect(0, 0, W, H); }

        // combo popup
        if (combo >= 2) {
          ctx.fillStyle = "#c8ff2e";
          ctx.font = "bold 22px 'Baloo Da 2', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`🔥 COMBO x${combo}`, W / 2, 110);
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver, coins, flash, combo]);

  const finalScore = Math.floor(state.current.dist / 10) + coins * 10;

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr] items-start">
      {/* Game cabinet */}
      <div ref={wrapRef} className="relative mx-auto w-full max-w-[420px]">
        <div className="absolute -inset-3 rounded-[28px] bg-gradient-to-br from-lime-300/40 via-fuchsia-500/30 to-cyan-400/40 blur-xl" />
        <div className="relative overflow-hidden rounded-[24px] border border-white/15 bg-[#0b1026] shadow-2xl">
          {/* HUD */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-black/40 px-4 py-2.5 text-sm">
            <div className="flex items-center gap-1.5 font-bold text-lime-300">
              <Trophy size={15} /> <span className="font-grotesk tabular-nums">{score}</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Coins size={15} /> <span className="font-grotesk tabular-nums">{coins}</span>
            </div>
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <Heart key={i} size={15} className={i < lives ? "fill-rose-500 text-rose-500" : "text-white/20"} />
              ))}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-cyan-300">
              <Zap size={13} /> LV{speedLevel}
            </div>
          </div>

          <div className="relative">
            <canvas ref={canvasRef} width={W} height={H} className="game-canvas block h-auto w-full" />
            {!running && !gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#070712]/78 p-6 text-center backdrop-blur-sm">
                <div className="animate-bounce text-6xl">🛺</div>
                <h3 className="font-display text-3xl font-extrabold text-white">রিকশা রাশ</h3>
                <p className="max-w-[280px] text-sm text-white/70">
                  বাম-ডান সোয়াইপ করে জ্যাম এড়াও, কয়েন কুড়াও! <br />
                  <span className="text-lime-300">⌨️ ← → / A D</span> অথবা <span className="text-lime-300">👆 ড্র্যাগ</span>
                </p>
                <button onClick={start} className="group flex items-center gap-2 rounded-full bg-lime-300 px-8 py-3 font-display text-lg font-bold text-black transition hover:scale-105 hover:bg-lime-200">
                  <Play size={20} className="fill-black" /> খেলা শুরু
                </button>
                <p className="font-grotesk text-[11px] tracking-widest text-white/40 uppercase">100% অফলাইন ডেমো • কোনো নেট লাগে না</p>
              </div>
            )}
            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#070712]/85 p-6 text-center backdrop-blur-sm">
                <div className="text-6xl">💥</div>
                <h3 className="font-display text-3xl font-extrabold text-white">খেলা শেষ!</h3>
                <div className="glass rounded-2xl px-8 py-4">
                  <p className="text-xs tracking-widest text-white/50 uppercase">তোমার স্কোর</p>
                  <p className="font-grotesk text-5xl font-bold text-lime-300 tabular-nums">{finalScore}</p>
                  <p className="mt-1 text-sm text-amber-300">🪙 {coins} কয়েন • 🏆 বেস্ট {Math.max(best, finalScore)}</p>
                </div>
                {finalScore >= best && finalScore > 0 && (
                  <p className="animate-pulse rounded-full bg-fuchsia-500/20 px-4 py-1 text-sm font-bold text-fuchsia-300">🎉 নতুন হাই-স্কোর!</p>
                )}
                <button onClick={start} className="flex items-center gap-2 rounded-full bg-lime-300 px-8 py-3 font-display text-lg font-bold text-black transition hover:scale-105">
                  <RotateCcw size={20} /> আবার খেলো
                </button>
              </div>
            )}
          </div>

          {/* controls */}
          <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-black/40 px-4 py-3">
            <div className="flex gap-2">
              <button onTouchStart={() => move(-1)} onClick={() => move(-1)} className="rounded-xl border border-white/15 bg-white/10 p-3 text-white active:bg-lime-300 active:text-black" aria-label="বামে">
                <ChevronLeft size={22} />
              </button>
              <button onTouchStart={() => move(1)} onClick={() => move(1)} className="rounded-xl border border-white/15 bg-white/10 p-3 text-white active:bg-lime-300 active:text-black" aria-label="ডানে">
                <ChevronRight size={22} />
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMuted((m) => !m)} className="rounded-xl border border-white/15 bg-white/10 p-3 text-white" aria-label="সাউন্ড">
                {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              {running ? (
                <button onClick={() => setRunning(false)} className="rounded-xl border border-white/15 bg-white/10 p-3 text-white" aria-label="থামাও">
                  <Pause size={20} />
                </button>
              ) : (
                <button onClick={start} className="rounded-xl bg-lime-300 p-3 text-black" aria-label="চালাও">
                  <Play size={20} className="fill-black" />
                </button>
              )}
              <button onClick={() => { reset(); setRunning(true); }} className="rounded-xl border border-white/15 bg-white/10 p-3 text-white" aria-label="রিস্টার্ট">
                <RotateCcw size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Side info */}
      <div className="space-y-5">
        <div className="glass rounded-2xl p-6">
          <h4 className="font-display text-xl font-bold text-lime-300">🎮 এটা কেন মজার ডেমো?</h4>
          <ul className="mt-3 space-y-2.5 text-[15px] leading-relaxed text-white/80">
            <li>⚡ <b>১ ট্যাপে শুরু</b> — লগইন নেই, লোডিং নেই, বিরক্তি নেই।</li>
            <li>🪙 <b>৬০ সেকেন্ডের ফান-লুপ</b> — ডজ + কয়েন + কম্বো = ডোপামিন!</li>
            <li>📳 <b>জুসি ফিডব্যাক</b> — ভাইব্রেশন-সাউন্ড, স্ক্রিন-শেক, কম্বো পপআপ।</li>
            <li>📴 <b>ফুল অফলাইন</b> — এই গেমের কোডে কোনো নেট কল নেই, সাউন্ডও কোড দিয়ে বানানো।</li>
            <li>📱 <b>লো-এন্ড ফ্রেন্ডলি</b> — Canvas 2D, 2GB RAM-এও 60 FPS।</li>
          </ul>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
            <p className="font-grotesk text-xs tracking-widest text-amber-300 uppercase">কন্ট্রোল</p>
            <p className="mt-2 text-sm leading-relaxed text-white/85">ডেস্কটপে <b>← →</b> / <b>A D</b>, মোবাইলে <b>আঙুল ড্র্যাগ</b> বা নিচের বাটন। <b>Space</b> = শুরু, <b>P</b> = পজ।</p>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
            <p className="font-grotesk text-xs tracking-widest text-cyan-300 uppercase">প্রো টিপস</p>
            <p className="mt-2 text-sm leading-relaxed text-white/85">গাড়ির <b>গা ঘেঁষে</b> গেলে <b>COMBO বোনাস!</b> কয়েনের লাইন দেখে লেন বদলাও।</p>
          </div>
        </div>
        <div className="rounded-2xl border border-fuchsia-400/25 bg-gradient-to-br from-fuchsia-500/15 to-violet-600/15 p-6">
          <p className="font-display text-lg font-bold text-white">💡 এই ডেমোটাই তোমার গেম হতে পারে!</p>
          <p className="mt-1 text-sm text-white/70">নিচের <b className="text-lime-300">প্রম্পট ল্যাবে</b> গিয়ে "আর্কেড ডজার + ঢাকার রাস্তা" সিলেক্ট করে জেনারেট চাপো — এই গেমের ফুল Android প্রম্পট রেডি! 👇</p>
        </div>
      </div>
    </div>
  );
}
