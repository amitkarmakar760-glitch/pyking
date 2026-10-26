export type GenreOption = {
  id: string;
  bn: string;
  en: string;
  icon: string;
  desc: string;
};

export const GENRES: GenreOption[] = [
  { id: "runner", bn: "এন্ডলেস রানার", en: "Endless Runner", icon: "🏃", desc: "দৌড়াও, লাফ দাও, কয়েন কুড়াও — Subway Surfers স্টাইল" },
  { id: "arcade", bn: "আর্কেড ডজার", en: "Arcade Dodger", icon: "🛺", desc: "গাড়ি এড়িয়ে যতদূর যাওয়া যায় — এক হাতে খেলা যায়" },
  { id: "puzzle", bn: "পাজল", en: "Puzzle", icon: "🧩", desc: "মাথা খাটানো খেলা — Match-3, সাপ-লুডু, শব্দ" },
  { id: "tower", bn: "টাওয়ার ডিফেন্স", en: "Tower Defense", icon: "🏰", desc: "গ্রাম বাঁচাও — শত্রুর ঢেউ ঠেকাও" },
  { id: "racing", bn: "রেসিং", en: "Racing", icon: "🏎️", desc: "রিকশা/বাইক/নৌকা রেস — ঢাকার রাস্তায়" },
  { id: "cricket", bn: "ক্রিকেট", en: "Cricket", icon: "🏏", desc: "গলি ক্রিকেট — ব্যাটিং টাইমিং গেম" },
  { id: "fishing", bn: "মাছ ধরা", en: "Fishing / Catcher", icon: "🎣", desc: "পদ্মার মাঝি — বঁড়শি ফেলে বড় মাছ" },
  { id: "horror", bn: "হরর অ্যাডভেঞ্চার", en: "Horror Adventure", icon: "👻", desc: "ভুতের বাড়ি — টর্চ নিয়ে রহস্য সমাধান" },
];

export const THEMES = [
  { id: "dhaka", bn: "ঢাকার রাস্তা 🛻", en: "Dhaka City streets with rickshaws, CNGs, buses, billboards in Bangla" },
  { id: "village", bn: "বাংলার গ্রাম 🌾", en: "Bangladeshi village with paddy fields, ponds, tin-shed houses, palm trees" },
  { id: "sundarban", bn: "সুন্দরবন 🐯", en: "Sundarbans mangrove forest with Royal Bengal Tiger, deer, rivers and boats" },
  { id: "padma", bn: "পদ্মা নদী 🌊", en: "Padma river with fishing boats, launch, sunset sky, hilsa fish" },
  { id: "cyber", bn: "সাইবার ঢাকা ২০৫০ 🤖", en: "Cyberpunk Dhaka 2050 with neon rickshaws, flyovers, holograms" },
  { id: "mughal", bn: "মুঘল আমল 🕌", en: "Mughal-era Bengal with Lalbagh Fort, palanquins, royal soldiers" },
  { id: "space", bn: "মহাকাশ 🚀", en: "Space with Bangladeshi satellite vibes, planets, astronauts" },
  { id: "haunted", bn: "ভুতুড়ে হাভেলি 🏚️", en: "Abandoned haunted zamindar haveli at night, fog, lanterns" },
];

export const ART_STYLES = [
  { id: "pixel", bn: "পিক্সেল আর্ট 👾", en: "vibrant pixel-art (16-bit retro, chunky sprites)" },
  { id: "cartoon", bn: "কার্টুন 🧸", en: "cheerful cartoon / casual mobile style with bold outlines" },
  { id: "lowpoly", bn: "লো-পলি 3D 🧊", en: "colorful low-poly 3D optimized for low-end phones" },
  { id: "flat", bn: "ফ্ল্যাট 2D 🎨", en: "clean flat 2D vector style like Alto's Adventure" },
  { id: "neon", bn: "নিয়ন আর্কেড 🕹️", en: "glowing neon arcade style on dark background" },
];

export const CONTROLS = [
  { id: "onetap", bn: "ওয়ান-ট্যাপ 👆", en: "one-tap control (tap to jump / shoot — perfect for bus-auto gameplay)" },
  { id: "swipe", bn: "সোয়াইপ ↔️", en: "swipe + tap controls (left/right/up/down like Subway Surfers)" },
  { id: "tilt", bn: "টিল্ট 📱", en: "tilt / accelerometer steering with touch boost button" },
  { id: "drag", bn: "ড্র্যাগ ✋", en: "drag-to-move control (finger follows player precisely)" },
  { id: "buttons", bn: "বাটন 🎮", en: "on-screen left/right/action buttons (classic arcade)" },
];

export const DIFFICULTY = [
  { id: "easy", bn: "সহজ 😌", en: "easy and relaxing, kid-friendly" },
  { id: "medium", bn: "মাঝারি 🙂", en: "medium with gradually increasing challenge" },
  { id: "hard", bn: "কঠিন 😈", en: "hardcore with fast progression for skilled players" },
];

export type GameIdea = {
  id: string;
  titleBn: string;
  titleEn: string;
  tagline: string;
  genre: string;
  emoji: string;
  color: string;
  fun: number;
  offline: string;
  size: string;
  buildTime: string;
  bestFor: string;
  prompt: string;
};

export const GAME_IDEAS: GameIdea[] = [
  {
    id: "rickshaw-rush",
    titleBn: "রিকশা রাশ",
    titleEn: "Rickshaw Rush",
    tagline: "জ্যাম ঠেলে ঢাকার রাস্তায় টপ স্পিড! বাম-ডান কাটিয়ে কয়েন কুড়াও।",
    genre: "আর্কেড ডজার",
    emoji: "🛺",
    color: "from-lime-300 to-emerald-500",
    fun: 95,
    offline: "100% অফলাইন",
    size: "~25 MB",
    buildTime: "২-৩ সপ্তাহ",
    bestFor: "প্রথম গেম হিসেবে বেস্ট — কোড সহজ, মজা গ্যারান্টিড",
    prompt: `Create a 2D offline Android arcade dodger game called "Rickshaw Rush" using Godot 4 (GDScript) or Unity 2D.

CONCEPT: Player drives a colorful cycle-rickshaw through endless Dhaka traffic. Dodge buses, CNGs, trucks. Collect coins and "cha" power-ups. One crash = lose 1 of 3 lives. Speed increases every 30 seconds.

GAMEPLAY LOOP (60-second fun loop): Start run → dodge + collect coins → near-miss gives combo bonus + slow-mo for 1s → crash loses life → game over screen shows score, best score, coins → tap to restart in 1 second. Daily challenge seed + endless mode.

CONTROLS: Left/right swipe or tilt steering + auto-accelerate. Big touch zones for thumbs. Haptic vibrate on near-miss and crash.

LEVELS / PROGRESSION: 3 unlockable routes (Mirpur Road, Padma Bridge, Marine Drive) with different traffic density and background. 6 rickshaws to unlock with coins (different speed/handling). Missions: "100 near-miss", "collect 500 coins in one run".

ART: Cheerful cartoon 2D, portrait mode, bold outlines, Bangla billboards on roadside. 60 FPS on 2GB RAM phones. All assets bundled locally.

AUDIO: All audio offline (.ogg). Rickshaw bell, horn, coin chime, Dhaka street ambience loop, upbeat dhol-drum BGM with mute toggle.

OFFLINE REQUIREMENTS: Zero internet needed after install. High-score + coins in local save (PlayerPrefs / ConfigFile). APK under 30MB. No Firebase, no ads SDK required for core loop (optional rewarded ads only when online).

TECH: Godot 4 export to Android (API 24+), portrait 720x1280, object pooling for traffic, delta-based movement, pause on app-hide.

POLISH: Juice — screen shake on crash, coin magnet FX, confetti on new high-score, tutorial overlay in Bangla (3 slides, skippable).`,
  },
  {
    id: "hilsa-hunter",
    titleBn: "ইলিশ হান্টার",
    titleEn: "Hilsa Hunter",
    tagline: "বঁড়শি ফেলো, সুতো টানো — পদ্মার সবচেয়ে বড় ইলিশটা তোমার!",
    genre: "হাইপার-ক্যাজুয়াল",
    emoji: "🐟",
    color: "from-cyan-300 to-blue-600",
    fun: 90,
    offline: "100% অফলাইন",
    size: "~20 MB",
    buildTime: "১-২ সপ্তাহ",
    bestFor: "সবচেয়ে সহজ — ১০০ লাইন লজিকেই প্রোটোটাইপ",
    prompt: `Create a hyper-casual offline Android fishing game "Hilsa Hunter" in Flutter Flame or Godot 4.

CONCEPT: Side-view river. Tap-and-hold to drop hook, release to set depth, drag to dodge small fish and catch the biggest HILSA. Tension meter — too much pull snaps the line. Weigh-in after each catch with funny Bangla commentary ("বাহ! ২ কেজির ইলিশ!").

GAMEPLAY LOOP: Choose spot (Padma / Meghna / Sea) → 60-second round → catch fish → sell for coins → upgrade rod/line/boat → unlock new spots. Perfect for 2-minute bus rides.

CONTROLS: One-finger only. Hold to sink, release to float, tilt slightly to sway hook. Big "TAN!" button alternative for accessibility.

PROGRESSION: 20 fish species with rarity (common puti → legendary golden hilsa). Aquarium collection screen stored locally. 15 upgrade levels. Offline daily reward streak.

ART: Clean flat 2D, gradient water with parallax weeds, day/sunset/night cycle per round. Portrait. Cute chubby fish.

AUDIO: Fully offline — water plop, reel click, success fanfare with flute, lo-fi river ambience.

OFFLINE REQUIREMENTS: No internet ever needed. Local JSON save. APK < 25MB. Battery-friendly (30 FPS cap option).

TECH: Flutter Flame or Godot. Fixed timestep physics for hook swing. Haptics on bite.

POLISH: Bite vibration + "!" popup, slow-mo on legendary catch, share-screenshot button (works offline, saves to gallery), Bangla + English language toggle.`,
  },
  {
    id: "gram-defense",
    titleBn: "গ্রাম ডিফেন্স",
    titleEn: "Gram Defense",
    tagline: "বন্যা আর ডাকাতের ঢেউ ঠেকাও — বাঁশের টাওয়ার বসাও!",
    genre: "টাওয়ার ডিফেন্স",
    emoji: "🏰",
    color: "from-amber-300 to-orange-600",
    fun: 93,
    offline: "100% অফলাইন",
    size: "~40 MB",
    buildTime: "৩-৪ সপ্তাহ",
    bestFor: "স্ট্র্যাটেজি পছন্দ করলে — লম্বা খেলার মজা",
    prompt: `Create an offline 2D tower-defense Android game "Gram Defense" in Godot 4 or Unity 2D.

CONCEPT: Protect a Bangladeshi village from waves of flood-water spirits ("bonna-bhut") and dacoits. Place bamboo towers along a winding village path: Dhol-Blaster (splash), Gulti-Sniper (long range), Lantern (slows ghosts), Kola-Cannon (heavy). Earn "dhan" currency per kill.

GAMEPLAY LOOP: 30 hand-designed waves across 3 maps (Paddy Field, River Char, Haunted Bazar). Pre-wave build phase (30s) → wave → repair/upgrade → next wave. 3-star rating per map stored offline.

CONTROLS: Tap to select tower spot, tap card to build, drag to target, pinch-zoom. Landscape mode. Full touch UI with big buttons.

PROGRESSION: Tower upgrade tree (3 tiers each), hero "Lathial Sardar" with movable position + special ability (Lathi Spin). Unlock via stars, no IAP needed.

ART: Vibrant cartoon top-down 2.5D, day-night per 5 waves with lantern glow. All sprites in one atlas for performance on 2GB RAM.

AUDIO: Offline .ogg — dhol war drums that intensify per wave, tower shots, villager cheers. Mute + volume sliders.

OFFLINE REQUIREMENTS: Fully offline campaign. Save in local file. APK < 45MB. No accounts.

TECH: Godot 4, AStar path or fixed waypoint path, object pools for enemies/projectiles, 60 FPS target, adaptive difficulty (if player fails twice, offer "Sohoj Mode").

POLISH: Wave preview, 2x speed toggle, Bangla tutorial with voice-line text, boss every 10 waves with HP bar, victory fireworks.`,
  },
  {
    id: "gully-cricket",
    titleBn: "গলি ক্রিকেট",
    titleEn: "Gully Cricket",
    tagline: "এক বল, এক সুযোগ — টাইমিং ঠিক হলেই ছক্কা!",
    genre: "স্পোর্টস",
    emoji: "🏏",
    color: "from-rose-300 to-red-600",
    fun: 96,
    offline: "100% অফলাইন",
    size: "~35 MB",
    buildTime: "২-৪ সপ্তাহ",
    bestFor: "বাংলাদেশে সবচেয়ে বেশি ডাউনলোড পাওয়ার চান্স",
    prompt: `Create an offline one-tap Android cricket timing game "Gully Cricket" in Unity 2D or Godot 4.

CONCEPT: Street cricket batting only. Bowler auto-bowls with varied speed/spin (tennis ball physics). Player taps at the perfect moment — timing bar shows Early/Perfect/Late. Perfect = six over the tin-shed. 3 stumps = out. Chase target scores in "Para Tournament".

GAMEPLAY LOOP: Pick match (1 over / 5 over / tournament) → bat each ball → score + combo for consecutive boundaries → win coins → unlock bats/balls/grounds. Super-over tiebreaker. CPU bowler AI with 4 difficulty personalities.

CONTROLS: Single big HIT button + optional swipe direction to aim (leg/off). Portrait, thumb-friendly. Practice nets mode with ball machine.

PROGRESSION: 8 grounds (Mirpur Gully → Cox's Bazar Beach), 12 bats with power/timing stats, 50 missions ("Hit 3 sixes in a row"). Local leaderboard vs CPU legends (Mashrafe-mode etc. as parody names).

ART: Punchy cartoon 3/4 view, juicy ball trail, camera zoom on six, crowd of para kids cheering. 60 FPS, low-poly background.

AUDIO: Offline — bat "thock", crowd cheer, "HOWZAT!" shout, dhol on six. Commentary text in Bangla slang ("লা জবাব ছক্কা!").

OFFLINE REQUIREMENTS: No internet. Tournament brackets + stats in local save. APK < 40MB.

TECH: Deterministic ball physics (custom, not full physics engine, for fairness), input latency < 50ms, pause on call.

POLISH: Slow-mo perfect-hit cam, ball-by-ball replay, haptics on bat contact, Bangla tutorial in 20 seconds.`,
  },
  {
    id: "bhuter-bari",
    titleBn: "ভূতের বাড়ি",
    titleEn: "Bhuter Bari",
    tagline: "টর্চ হাতে জমিদার বাড়ির ৫টা রহস্য ভেদ করো!",
    genre: "হরর পাজল",
    emoji: "👻",
    color: "from-violet-300 to-purple-700",
    fun: 88,
    offline: "100% অফলাইন",
    size: "~45 MB",
    buildTime: "৩-৫ সপ্তাহ",
    bestFor: "গল্প ভালোবাসলে — ইউটিউবাররা খেলবেই",
    prompt: `Create an offline 2D top-down horror-puzzle Android game "Bhuter Bari" in Godot 4.

CONCEPT: Explore a 5-room abandoned zamindar house at night with a torch (limited battery). Solve Bangla riddle-puzzles to unlock each room, avoid/exorcise the "Chaya" ghost that hunts when your lantern flickers. Story told via found letters (Bangla). 45-minute campaign + endless "Tike Thako" survival mode.

GAMEPLAY LOOP: Enter room → find clue → solve puzzle (match janala pattern, arrange family photo, decode letter) → ghost gets faster → exorcise with collected "tobiz" → next room. Battery pickups force routing decisions.

CONTROLS: Virtual joystick to move, tap to interact, drag to aim torch. Portrait. Auto-save at each room (offline).

PROGRESSION: 5 story chapters + 3 endings based on letters found. Jumpscare toggle (friendly mode for kids). Puzzle hints cost "sahos points".

ART: Dark atmospheric pixel-art with dynamic torch lighting (2D lights), fog particles, film-grain overlay. Optimized: single light + baked shadows for low-end.

AUDIO: Fully offline horror — rain loop, thunder, heartbeat near ghost, lantern buzz, Bangla whisper SFX (synthesized), no BGM (silence = scary) + stinger on chase.

OFFLINE REQUIREMENTS: Everything local. Save slots in ConfigFile. APK < 50MB.

TECH: Godot 4 with PointLight2D, NavigationAgent2D for ghost AI (patrol → investigate noise → chase), state machine, headphones recommended prompt.

POLISH: Flicker when battery low, ghost glimpse in mirror, chapter select, content warning screen, Bangla + English subtitles.`,
  },
  {
    id: "shobdo-khela",
    titleBn: "শব্দ খেলা",
    titleEn: "Shobdo Khela",
    tagline: "বাংলা Wordle! ৫ অক্ষরের শব্দ ধরো ৬ চেষ্টায়।",
    genre: "ওয়ার্ড পাজল",
    emoji: "🔤",
    color: "from-teal-200 to-emerald-600",
    fun: 85,
    offline: "100% অফলাইন",
    size: "~15 MB",
    buildTime: "১ সপ্তাহ",
    bestFor: "সবচেয়ে কম সাইজ — সবার ফোনে চলবে",
    prompt: `Create an offline Bangla word-guessing Android game "Shobdo Khela" (Bangla Wordle) in Flutter or React Native + local build.

CONCEPT: Guess the 5-letter Bangla word in 6 tries. Custom Bangla keyboard with jukto-borno support. Green = correct place, yellow = exists, grey = absent. Daily word (date-seeded, works offline) + unlimited practice + "Para Battle" pass-and-play 2-player on one phone.

GAMEPLAY LOOP: Daily word (3 min) → streak + stats → practice mode → weekly "Kothin Shobdo" challenge. 2000+ curated Bangla word list bundled in-app (JSON), no downloads.

CONTROLS: Tap Bangla letter keys, backspace, enter. Haptic on flip. Portrait. Large fonts for parents/grandparents.

PROGRESSION: Streak, win %, guess distribution chart (all local), 4/5/6-letter modes, hints (reveal one letter, 3 per day, regen offline via timer).

ART: Clean minimal, night-friendly dark/light theme, satisfying tile flip + bounce animation, confetti on win.

AUDIO: Subtle offline clicks + win chime, mute toggle.

OFFLINE REQUIREMENTS: 100% offline forever. Word list + logic local. APK < 15MB. Works on Android 7+.

TECH: Flutter (single codebase). Seeded RNG by date for daily word. SharedPreferences for stats. No network permission at all (mention in Play listing for trust).

POLISH: Onboarding with example in Bangla, share result as emoji grid (copies to clipboard offline), accessibility font scaling, kid-safe word list filter.`,
  },
];

export function buildCustomPrompt(opts: {
  genre: string;
  theme: string;
  art: string;
  control: string;
  difficulty: string;
  name: string;
}): { english: string; bangla: string } {
  const g = GENRES.find((x) => x.id === opts.genre) ?? GENRES[1];
  const t = THEMES.find((x) => x.id === opts.theme) ?? THEMES[0];
  const a = ART_STYLES.find((x) => x.id === opts.art) ?? ART_STYLES[1];
  const c = CONTROLS.find((x) => x.id === opts.control) ?? CONTROLS[1];
  const d = DIFFICULTY.find((x) => x.id === opts.difficulty) ?? DIFFICULTY[1];
  const name = opts.name.trim() || "Amar Game";

  const english = `Create a 100% OFFLINE Android game called "${name}" — genre: ${g.en}.

CONCEPT & SETTING: ${g.desc}. World theme: ${t.en}. Make the fun loop understandable in 10 seconds and addictive for 10 minutes.

CORE LOOP: Start in 1 tap (no login, no loading hell) → play a 60–90 second run/round → instant score + reward → 1-tap restart. Add juicy feedback: screen shake, particles, combo popups, slow-mo on big moments.

CONTROLS: ${c.en}. Must be playable with one hand on a bus. Big touch targets (min 64px), haptics on key actions, full pause when app is hidden or on incoming call.

DIFFICULTY: ${d.en}. First 60 seconds = guaranteed fun (tutorial baked into gameplay, max 3 hint bubbles in Bangla). Then ramp challenge smoothly. If player fails 2x in a row, secretly ease difficulty 10%.

LEVELS / CONTENT: At least 3 maps/modes + 20+ missions/achievements + unlockables (characters/skins) purchasable with in-game coins only. Daily challenge using date-seed (works offline).

ART: ${a.en}. Portrait (unless racing/TD → landscape ok). 60 FPS on 2GB RAM devices. All assets bundled in APK. Bangla signage/text where it adds charm.

AUDIO (all offline .ogg): Jump/hit/coin SFX, success fanfare, ambient loop matching theme, upbeat BGM with mute + volume sliders. No streaming, no downloads.

OFFLINE & PERFORMANCE: Zero internet required after install. Local save (JSON/PlayerPrefs). APK under 40MB. No Firebase/ads SDK in core loop. Target Android API 24+ (Android 7). 30 FPS fallback toggle for weak phones. Battery-friendly: cap particles, pause when hidden.

TECH: Build in Godot 4 (GDScript) OR Unity 2D OR Flutter Flame — your choice, but export a signed AAB. Use object pooling, delta-time movement, fixed timestep for fairness.

POLISH CHECKLIST: App icon + splash, Bangla tutorial (max 20 sec, skippable), settings (sound/music/vibration/language BN-EN), high-score screen with confetti on new best, share-score screenshot saved to gallery offline, content-rating friendly (no gore), Play Store listing text in Bangla + English.

DELIVERABLE: Full project source + exported APK + 30-sec gameplay description for Play Store + 3 promo lines in Bangla.`;

  const bangla = `তুমি "${name}" নামে একটা ১০০% অফলাইন Android গেম বানাও — ধরন: ${g.bn} (${g.en})।

থিম: ${t.bn} — মানে ${t.en}।
আর্ট: ${a.bn}।
কন্ট্রোল: ${c.bn} — এক হাতে বাসে বসেও খেলা যাবে।
লেভেল: ${d.bn} — প্রথম ১ মিনিটে মজা পেতেই হবে, তারপর আস্তে আস্তে কঠিন হবে।

যা যা থাকতেই হবে:
১) ১ ট্যাপে খেলা শুরু — লগইন/লোডিং ঝামেলা নেই। ৬০-৯০ সেকেন্ডের রান, শেষে স্কোর + কয়েন, আবার ১ ট্যাপে রিস্টার্ট।
২) জুসি ফিল — কয়েনে ঝনঝন, ক্র্যাশে ভাইব্রেশন + স্ক্রিন-শেক, হাই-স্কোরে কনফেতি।
৩) কমপক্ষে ৩টা ম্যাপ/মোড + ২০টা মিশন + কয়েন দিয়ে আনলক করা ক্যারেক্টার।
৪) সব সেভ ফোনেই (ইন্টারনেট ছাড়া), APK ৪০MB-এর নিচে, 2GB RAM-এ 60 FPS।
৫) বাংলা টিউটোরিয়াল (২০ সেকেন্ড, স্কিপ করা যায়), সাউন্ড/ভাইব্রেশন সেটিং, বাংলা-ইংরেজি ভাষা।
৬) Godot 4 / Unity / Flutter Flame — যেকোনো একটায় বানিয়ে signed APK দাও + Play Store-এর জন্য বাংলায় ৩ লাইন প্রোমো লিখে দাও।`;

  return { english, bangla };
}
