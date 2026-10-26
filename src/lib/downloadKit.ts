// ─── PYKING Download Center ─────────────────────────────────────────────
// Generates the GitHub-ready Python project as a .zip (via JSZip), plus
// single-file downloads. 100% client-side — no server needed.
import JSZip from "jszip";
import { byLevel } from "./engine";

/* ═══════════════ Python project templates (all English, runnable) ═══════════════ */

const PY_MAIN = `"""PYKING launcher.

Run the game with:
    streamlit run main.py
"""
from ui.app import main


if __name__ == "__main__":
    main()
`;

const PY_REQUIREMENTS = `streamlit>=1.32
`;

const PY_GITIGNORE = `__pycache__/
*.py[cod]
.venv/
venv/
.streamlit/secrets.toml
data/*.db
.DS_Store
`;

const PY_ENGINE_INIT = `"""PYKING engine package: runner, grader, errors, srs, save."""
`;

const PY_UI_INIT = `"""PYKING UI package (Streamlit)."""
`;

const PY_RUNNER = `"""engine/runner.py — safely execute untrusted player code.

Uses subprocess with a 5-second timeout so infinite loops cannot
freeze the game. This mirrors the Pyodide sandbox in the web build.
"""
from __future__ import annotations

import re
import subprocess
import sys

TIMEOUT = 5  # seconds — the safety net


def run_user_code(code: str, stdin: str = "") -> dict:
    """Run one snippet. Returns {"ok": bool, "out": str, "err": str}."""
    try:
        done = subprocess.run(
            [sys.executable, "-c", code],
            input=stdin,
            capture_output=True,
            text=True,
            timeout=TIMEOUT,
        )
        return {
            "ok": done.returncode == 0,
            "out": done.stdout.strip(),
            "err": done.stderr.strip()[-500:],
        }
    except subprocess.TimeoutExpired:
        return {"ok": False, "out": "",
                "err": "TimeoutError: took longer than 5 seconds — infinite loop?"}


def looks_like_infinite_loop(code: str) -> bool:
    """Static guard: 'while True' with no break would hang."""
    return bool(re.search(r"while\\s+True\\s*:", code)) and "break" not in code
`;

const PY_GRADER = `"""engine/grader.py — grade a challenge against its tests.

Supports both styles used in challenges/*.json:
  1. stdout tests  -> run code with stdin, compare printed output
  2. function tests -> append a harness that calls func(*args) and
     prints "__PYKING__" + JSON so we can parse per-case results.
"""
from __future__ import annotations

import json

from .runner import run_user_code


def _norm(text: str) -> str:
    """Ignore trailing spaces per line + leading/trailing blank lines."""
    return "\\n".join(
        line.rstrip() for line in text.replace("\\r\\n", "\\n").split("\\n")
    ).strip()


def grade_stdout(code: str, tests: list[dict]) -> tuple[list[dict], str | None]:
    """Run code once per stdin test. Returns (results, crashed_error)."""
    results: list[dict] = []
    for case in tests:
        run = run_user_code(code, case.get("stdin", ""))
        if not run["ok"]:
            results.append({"pass": False, "got": run["out"] or "(crashed)",
                            "want": case["expected"], "label": case.get("label", "")})
            return results, run["err"]
        results.append({"pass": _norm(run["out"]) == _norm(case["expected"]),
                        "got": run["out"], "want": case["expected"],
                        "label": case.get("label", "")})
    return results, None


def grade_function(code: str, func: str, cases: list[dict]) -> tuple[list[dict], str | None]:
    """Inject a harness, run once, parse the JSON verdict line."""
    payload = json.dumps([{"args": c["args"], "want": c["expected"],
                           "label": c.get("label", "")} for c in cases])
    harness = "\\nimport json as _json\\n"
    harness += "__raw = _json.loads(" + repr(payload) + ")\\n"
    harness += "__out = []\\n"
    harness += "for __c in __raw:\\n"
    harness += '    __a = __c["args"].strip()\\n'
    harness += "    try:\\n"
    harness += '        __argv = eval("(" + __a + ",)") if __a else ()\\n'
    harness += "        __r = " + func + "(*__argv)\\n"
    harness += "        __got = repr(__r)\\n"
    harness += '        __out.append({"pass": __got == __c["want"], "got": __got, "want": __c["want"], "label": __c["label"]})\\n'
    harness += "    except Exception as __e:\\n"
    harness += '        __got = type(__e).__name__ + ": " + str(__e)\\n'
    harness += '        __out.append({"pass": repr(__got) == __c["want"], "got": __got, "want": __c["want"], "label": __c["label"]})\\n'
    harness += 'print("__PYKING__" + _json.dumps(__out))\\n'
    run = run_user_code(code + harness)
    marker = next((line for line in run["out"].split("\\n")
                   if line.startswith("__PYKING__")), None)
    if marker is None:
        return [], run["err"] or "Your code crashed before tests could run."
    return json.loads(marker.replace("__PYKING__", "")), None


def grade_challenge(code: str, challenge: dict) -> tuple[list[dict], str | None]:
    """Grade every test in a challenge dict. Returns (results, crashed)."""
    results: list[dict] = []
    if challenge.get("tests"):
        out, crashed = grade_stdout(code, challenge["tests"])
        results.extend(out)
        if crashed:
            return results, crashed
    if challenge.get("func") and challenge.get("funcCases"):
        out, crashed = grade_function(code, challenge["func"], challenge["funcCases"])
        results.extend(out)
        if crashed:
            return results, crashed
    return results, None
`;

const PY_ERRORS = `"""engine/errors.py — translate tracebacks into beginner-friendly tips."""
from __future__ import annotations

# (keyword, title, tip) — first match wins, so keep specific rules first.
RULES: list[tuple[str, str, str]] = [
    ("timeout", "Timed out (5s)",
     "Usually an infinite loop — check that your while condition changes!"),
    ("infinite", "Possible infinite loop",
     "You wrote 'while True' with no break — add a break!"),
    ("indentation", "Indentation error",
     "Code inside if/for/def/while needs exactly 4 spaces."),
    ("unterminated", "Unfinished string",
     "You opened a quote but never closed it."),
    ("eol while scanning", "Unfinished string",
     "You opened a quote but never closed it."),
    ("invalid syntax", "Syntax error",
     "Missing colon (:), bracket or quote. Check the line above too!"),
    ("syntaxerror", "Syntax error",
     "Python could not read your code — check colons, brackets, quotes."),
    ("nameerror", "Unknown name",
     "Typo? Or used before defining? Names are case-sensitive."),
    ("indexerror", "Index out of range",
     "First item is [0], last is [-1]."),
    ("keyerror", "Missing dict key",
     "That key is not in the dictionary — check spelling and capitals."),
    ("zerodivisionerror", "Division by zero",
     "Mathematically forbidden! Guard with an if first."),
    ("valueerror", "Bad value",
     "Right type, wrong value — e.g. int('abc') fails."),
    ("typeerror", "Type mismatch",
     "Mixed incompatible types — convert with int() / str() first."),
    ("attributeerror", "Wrong method",
     "That object has no such method (e.g. .append is lists-only)."),
    ("filenotfounderror", "File not found",
     "Did you write the file first, or misspell the name?"),
    ("eoferror", "Too many input() calls",
     "Your code reads more lines than the test provides."),
]


def explain_error(raw: str) -> tuple[str, str]:
    """Return (short_title, one_sentence_fix) for a traceback string."""
    low = raw.lower()
    for key, title, tip in RULES:
        if key in low:
            return title, tip
    return ("Runtime error",
            "Read the last error line — it names the exact problem!")
`;

const PY_SRS = `"""engine/srs.py — spaced repetition: failures return after 1 -> 3 -> 7 days."""
from __future__ import annotations

import time

GAPS_DAYS = (1, 3, 7)
DAY = 86400


def next_review(fail_count: int) -> int:
    """Unix timestamp for the next review of a challenge."""
    days = GAPS_DAYS[min(max(fail_count, 0), len(GAPS_DAYS) - 1)]
    return int(time.time()) + days * DAY


def is_due(next_review_ts: int, within_seconds: int = DAY) -> bool:
    """True if a review is due now (or within the coming window)."""
    return next_review_ts <= int(time.time()) + within_seconds
`;

const PY_SAVE = `"""engine/save.py — SQLite persistence (data/pyking.db).

Tables: progress (completed quests), reviews (SRS queue),
meta (xp / streak / counters), badges, board (leaderboard).
"""
from __future__ import annotations

import sqlite3
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS progress (id TEXT PRIMARY KEY, hearts INTEGER, done_at INTEGER);
CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, fails INTEGER, next_review INTEGER);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS badges (id TEXT PRIMARY KEY, earned_at INTEGER);
CREATE TABLE IF NOT EXISTS board (name TEXT, xp INTEGER, at INTEGER);
"""


def connect(db_path: str | Path = "data/pyking.db") -> sqlite3.Connection:
    db_path = Path(db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(db_path)
    con.executescript(SCHEMA)
    return con


def _meta(con: sqlite3.Connection, key: str, default: str = "0") -> str:
    row = con.execute("SELECT value FROM meta WHERE key = ?", (key,)).fetchone()
    return row[0] if row else default


def _set_meta(con: sqlite3.Connection, key: str, value: object) -> None:
    con.execute("INSERT OR REPLACE INTO meta(key, value) VALUES (?, ?)", (key, str(value)))
    con.commit()


def get_xp(con: sqlite3.Connection) -> int:
    return int(_meta(con, "xp"))


def add_xp(con: sqlite3.Connection, amount: int) -> None:
    _set_meta(con, "xp", get_xp(con) + amount)


def complete(con: sqlite3.Connection, cid: str, hearts: int) -> None:
    con.execute("INSERT OR REPLACE INTO progress(id, hearts, done_at)"
                " VALUES (?, ?, strftime('%s', 'now'))", (cid, hearts))
    con.execute("DELETE FROM reviews WHERE id = ?", (cid,))  # beaten: leave SRS queue
    con.commit()


def completed_ids(con: sqlite3.Connection) -> list[str]:
    return [row[0] for row in con.execute("SELECT id FROM progress")]


def record_fail(con: sqlite3.Connection, cid: str) -> None:
    from .srs import next_review
    row = con.execute("SELECT fails FROM reviews WHERE id = ?", (cid,)).fetchone()
    fails = (row[0] if row else 0) + 1
    con.execute("INSERT OR REPLACE INTO reviews(id, fails, next_review) VALUES (?, ?, ?)",
                (cid, fails, next_review(fails - 1)))
    con.commit()


def was_reviewed(con: sqlite3.Connection, cid: str) -> bool:
    return con.execute("SELECT 1 FROM reviews WHERE id = ?", (cid,)).fetchone() is not None


def due_reviews(con: sqlite3.Connection) -> list[tuple]:
    return [tuple(row) for row in con.execute(
        "SELECT id, fails, next_review FROM reviews"
        " WHERE next_review <= strftime('%s', 'now') + 86400"
        " ORDER BY next_review")]


def award_badge(con: sqlite3.Connection, bid: str) -> None:
    con.execute("INSERT OR IGNORE INTO badges(id, earned_at)"
                " VALUES (?, strftime('%s', 'now'))", (bid,))
    con.commit()


def get_badges(con: sqlite3.Connection) -> set[str]:
    return {row[0] for row in con.execute("SELECT id FROM badges")}


def bump_reviews(con: sqlite3.Connection) -> int:
    n = int(_meta(con, "reviews_cleared")) + 1
    _set_meta(con, "reviews_cleared", n)
    return n


def get_streak(con: sqlite3.Connection) -> tuple[int, str]:
    return int(_meta(con, "streak")), _meta(con, "last_day", "")


def touch_streak(con: sqlite3.Connection) -> None:
    from datetime import date, timedelta
    today = date.today().isoformat()
    streak, last = get_streak(con)
    if last == today:
        return
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    _set_meta(con, "streak", streak + 1 if last == yesterday else 1)
    _set_meta(con, "last_day", today)


def publish_score(con: sqlite3.Connection, name: str, xp: int) -> None:
    con.execute("DELETE FROM board WHERE name = ?", (name,))
    con.execute("INSERT INTO board(name, xp, at) VALUES (?, ?, strftime('%s', 'now'))",
                (name, xp))
    con.commit()


def top_board(con: sqlite3.Connection, limit: int = 10) -> list[tuple]:
    return [(row[0], row[1]) for row in con.execute(
        "SELECT name, xp FROM board ORDER BY xp DESC LIMIT ?", (limit,))]
`;

const PY_APP = `"""ui/app.py — PYKING Streamlit interface.

Screens: Adventure (dungeons + arena), Review (spaced repetition),
Badges, Ranks (local leaderboard). Run with:  streamlit run main.py
"""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

import streamlit as st

from engine.errors import explain_error
from engine.grader import grade_challenge
from engine.runner import looks_like_infinite_loop, run_user_code
from engine.save import (
    add_xp,
    award_badge,
    bump_reviews,
    complete,
    completed_ids,
    connect,
    due_reviews,
    get_badges,
    get_streak,
    get_xp,
    publish_score,
    record_fail,
    top_board,
    touch_streak,
    was_reviewed,
)

ROOT = Path(__file__).resolve().parent.parent
CHALLENGE_DIR = ROOT / "challenges"

LEVELS = [
    (1, "Print Caverns", "Variables, types, print & input"),
    (2, "Forked Forest", "Conditionals: if / elif / else"),
    (3, "Loop Lagoon", "for & while loops"),
    (4, "Collection Crypt", "Lists, tuples, dicts, sets"),
    (5, "Function Forge", "Functions, scope, lambda"),
    (6, "OOP Observatory", "Classes & inheritance"),
    (7, "Exception Abyss", "Files & exceptions"),
    (8, "Meta Mountain", "Modules, decorators, generators"),
    (9, "Final Sanctum", "Boss level: mini project"),
]

RANKS = [
    (0, "Script Kitten"), (300, "Bug Hunter"), (800, "Loop Ranger"),
    (1500, "Function Knight"), (2500, "Class Wizard"),
    (3800, "Exception Slayer"), (5200, "Python Archmage"),
    (7000, "BUG KING'S BANE"),
]

BADGES = [
    ("first-blood", "First Blood", "Pass your first challenge"),
    ("flawless", "Flawless Victory", "Pass with 3 hearts left"),
    ("streak-3", "Warming Up", "3-day streak"),
    ("streak-7", "Unstoppable", "7-day streak"),
    ("boss-1", "Ooze Evaporator", "Defeat the Level 1 boss"),
    ("boss-3", "Hydra Header", "Defeat the Level 3 boss"),
    ("boss-5", "Dragon Tamer", "Defeat the Level 5 boss"),
    ("boss-8", "Mountain Toppler", "Defeat the Level 8 boss"),
    ("bugking", "BUG KING'S BANE", "Finish the Final Sanctum"),
    ("scholar", "Scholar", "Complete 25 challenges"),
    ("reviewer", "Comeback Kid", "Clear 5 reviews"),
    ("night-owl", "Night Owl", "Code between 10pm and 4am"),
]

BOSS_BADGES = {"1-10": "boss-1", "3-10": "boss-3", "5-10": "boss-5",
               "8-5": "boss-8", "9-3": "bugking"}
RIVALS = [("Guido", 6800), ("Ada Lovelace", 4300),
          ("Grumpy Goblin", 1500), ("Script Kitten", 250)]


def load_challenges() -> list[dict]:
    """Load every challenges/level_*.json — add files, change no code!"""
    out: list[dict] = []
    for path in sorted(CHALLENGE_DIR.glob("level_*.json")):
        out.extend(json.loads(path.read_text(encoding="utf-8")))
    return sorted(out, key=lambda c: (c["level"], c["num"]))


def rank_for(xp: int) -> str:
    title = RANKS[0][1]
    for minimum, name in RANKS:
        if xp >= minimum:
            title = name
    return title


def level_unlocked(level: int, done: set[str], all_ch: list[dict]) -> bool:
    if level <= 1:
        return True
    prev = [c for c in all_ch if c["level"] == level - 1]
    return all(c["id"] in done for c in prev)


def grant_badges(con, ch: dict, hearts: int, from_review: bool) -> None:
    done = completed_ids(con)
    if len(done) == 1:
        award_badge(con, "first-blood")
    if hearts == 3:
        award_badge(con, "flawless")
    if ch["id"] in BOSS_BADGES:
        award_badge(con, BOSS_BADGES[ch["id"]])
    if len(done) >= 25:
        award_badge(con, "scholar")
    hour = datetime.now().hour
    if hour >= 22 or hour < 4:
        award_badge(con, "night-owl")
    streak, _ = get_streak(con)
    if streak >= 3:
        award_badge(con, "streak-3")
    if streak >= 7:
        award_badge(con, "streak-7")
    if from_review and bump_reviews(con) >= 5:
        award_badge(con, "reviewer")


def adventure(con, all_ch: list[dict], done: set[str]) -> None:
    st.header("Adventure")
    open_levels = [lvl for lvl, _, _ in LEVELS if level_unlocked(lvl, done, all_ch)]
    jump_level = st.session_state.pop("jump_level", None)
    level = st.selectbox(
        "Dungeon", open_levels,
        index=open_levels.index(jump_level) if jump_level in open_levels else 0,
        format_func=lambda n: "Level %d — %s" % (n, LEVELS[n - 1][1]),
    )
    level_ch = [c for c in all_ch if c["level"] == level]
    options = [c for i, c in enumerate(level_ch)
               if i == 0 or level_ch[i - 1]["id"] in done]
    ids = [c["id"] for c in options]
    jump_id = st.session_state.pop("jump_to", None)
    chosen_id = st.selectbox(
        "Quest", ids,
        index=ids.index(jump_id) if jump_id in ids else 0,
        format_func=lambda i: next(
            ("DONE " if c["id"] in done else "") + c["title"]
            for c in options if c["id"] == i),
    )
    ch = next(c for c in options if c["id"] == chosen_id)

    st.subheader("%s %s  (+%d XP)" % (ch["bugEmoji"], ch["title"], ch["xp"]))
    st.caption("%s  •  Foe: %s" % (ch["concept"], ch["bug"]))
    with st.expander("Lesson", expanded=True):
        st.write(ch["lesson"])
    st.info(ch["task"])
    col_h, col_s = st.columns(2)
    with col_h, st.expander("Hint"):
        st.write(ch["hint"])
    with col_s, st.expander("Solution (spoiler!)"):
        st.code(ch["solution"], language="python")

    hearts_key = "hearts_%s" % ch["id"]
    res_key = "res_%s" % ch["id"]
    hearts = st.session_state.get(hearts_key, 3)
    st.write("Hearts: " + "❤️" * hearts + "🤍" * (3 - hearts))

    code = st.text_area("solution.py", value=ch["starter"], height=280,
                        key="code_%s" % ch["id"])
    col_run, col_go = st.columns([1, 2])
    if col_run.button("Run", use_container_width=True):
        if looks_like_infinite_loop(code):
            st.error("Possible infinite loop: 'while True' with no break!")
        else:
            stdin = (ch.get("tests") or [{"stdin": ""}])[0].get("stdin", "")
            run = run_user_code(code, stdin)
            if run["ok"]:
                st.code(run["out"] or "(no output)")
            else:
                title, tip = explain_error(run["err"])
                st.error("%s — %s" % (title, tip))
                st.code(run["err"])

    if col_go.button("Attack! Submit", type="primary",
                     use_container_width=True, disabled=hearts <= 0):
        if looks_like_infinite_loop(code):
            st.error("Possible infinite loop: 'while True' with no break!")
        else:
            results, crashed = grade_challenge(code, ch)
            if crashed and not results:
                title, tip = explain_error(crashed)
                st.error("%s — %s (free retry, no heart lost)" % (title, tip))
                st.code(crashed)
            else:
                passed = sum(1 for r in results if r["pass"])
                if results and passed == len(results):
                    first_time = ch["id"] not in done
                    if first_time:
                        add_xp(con, ch["xp"] + (25 if hearts == 3 else 0))
                        was_rev = was_reviewed(con, ch["id"])
                        complete(con, ch["id"], hearts)
                        grant_badges(con, ch, hearts, from_review=was_rev)
                    st.session_state[res_key] = {"results": results, "crashed": crashed,
                                                 "victory": True, "first": first_time,
                                                 "celebrated": False}
                else:
                    st.session_state[hearts_key] = hearts - 1
                    record_fail(con, ch["id"])
                    st.session_state[res_key] = {"results": results, "crashed": crashed,
                                                 "victory": False}
                st.rerun()

    stored = st.session_state.get(res_key)
    if stored:
        for i, r in enumerate(stored["results"], 1):
            if r["pass"]:
                st.success("Test %d: %s — PASS" % (i, r["label"]))
            else:
                st.error("Test %d: %s — FAIL (got %r, want %r)"
                         % (i, r["label"], r["got"], r["want"]))
        if stored.get("crashed"):
            title, tip = explain_error(stored["crashed"])
            st.warning("%s — %s" % (title, tip))
        if stored.get("victory"):
            if not stored.get("celebrated"):
                st.balloons()
                stored["celebrated"] = True
            extra = "" if stored.get("first") else " (practice — XP already banked)"
            st.success("Bug squashed!" + extra)
    if hearts <= 0 and st.button("Retry (3 hearts)"):
        st.session_state[hearts_key] = 3
        st.session_state.pop(res_key, None)
        st.rerun()


def review_page(con, all_ch: list[dict], done: set[str]) -> None:
    st.header("Review Dojo")
    st.caption("Spaced repetition: failures return after 1 → 3 → 7 days.")
    by_id = {c["id"]: c for c in all_ch}
    open_due = [by_id[i] for i, _, _ in due_reviews(con)
                if i in by_id and i not in done]
    if not open_due:
        st.success("All clear! No reviews due.")
        return
    for c in open_due:
        with st.expander("%s L%d.%d — %s"
                         % (c["bugEmoji"], c["level"], c["num"], c["title"])):
            st.write(c["lesson"])
            st.info(c["task"])
            if st.button("Practice in Adventure", key="rev_%s" % c["id"]):
                st.session_state["jump_to"] = c["id"]
                st.session_state["jump_level"] = c["level"]
                st.session_state["nav"] = "Adventure"
                st.rerun()


def badges_page(con) -> None:
    st.header("Trophy Hall")
    earned = get_badges(con)
    cols = st.columns(3)
    for i, (bid, title, desc) in enumerate(BADGES):
        with cols[i % 3]:
            if bid in earned:
                st.success("**%s**\\n\\n%s" % (title, desc))
            else:
                st.caption("??? — %s" % desc)


def ranks_page(con, name: str) -> None:
    st.header("Hall of Fame (local)")
    xp = get_xp(con)
    if st.button("Publish my score (%d XP)" % xp):
        publish_score(con, name or "Hero", xp)
        st.success("Published!")
    table = sorted(top_board(con) + RIVALS + [(name or "Hero", xp)],
                   key=lambda row: row[1], reverse=True)
    st.table([{"#": i + 1, "Hero": hero, "XP": score}
              for i, (hero, score) in enumerate(table)])


def main() -> None:
    st.set_page_config(page_title="PYKING", page_icon="🐍", layout="wide")
    con = connect()
    touch_streak(con)
    all_ch = load_challenges()
    done = set(completed_ids(con))

    st.sidebar.title("PYKING")
    name = st.sidebar.text_input("Hero name", value="Hero", max_chars=16)
    xp = get_xp(con)
    streak, _ = get_streak(con)
    st.sidebar.metric("XP", xp)
    st.sidebar.write("Rank: **%s**" % rank_for(xp))
    st.sidebar.write("Streak: **%d day(s)**" % streak)
    st.sidebar.write("Quests: **%d/%d**" % (len(done), len(all_ch)))
    page = st.sidebar.radio("Go to", ["Adventure", "Review", "Badges", "Ranks"], key="nav")
    st.sidebar.divider()
    if st.sidebar.button("Reset progress"):
        con.close()
        Path("data/pyking.db").unlink(missing_ok=True)
        st.rerun()

    if page == "Adventure":
        adventure(con, all_ch, done)
    elif page == "Review":
        review_page(con, all_ch, done)
    elif page == "Badges":
        badges_page(con)
    else:
        ranks_page(con, name)
`;

const JSON_SCHEMA = `{
  "$comment": "Contract for challenges/level_*.json. Each file holds a JSON array of challenges. No new code needed to add quests — just drop a file here.",
  "type": "array",
  "items": {
    "type": "object",
    "required": ["id", "level", "num", "title", "concept", "bug", "bugEmoji", "lesson", "task", "hint", "starter", "solution", "xp"],
    "properties": {
      "id": { "type": "string", "example": "2-8" },
      "level": { "type": "integer", "minimum": 1, "maximum": 9 },
      "num": { "type": "integer", "description": "Position inside the level (boss is last)" },
      "title": { "type": "string" },
      "concept": { "type": "string", "description": "Short tag shown in the UI" },
      "bug": { "type": "string", "description": "Enemy name" },
      "bugEmoji": { "type": "string" },
      "lesson": { "type": "string" },
      "task": { "type": "string" },
      "hint": { "type": "string" },
      "starter": { "type": "string", "description": "Prefilled editor code" },
      "solution": { "type": "string" },
      "xp": { "type": "integer" },
      "boss": { "type": "boolean" },
      "tests": {
        "type": "array",
        "description": "Stdout style: run code with stdin, compare output",
        "items": {
          "type": "object",
          "required": ["stdin", "expected", "label"],
          "properties": {
            "stdin": { "type": "string" },
            "expected": { "type": "string" },
            "label": { "type": "string" }
          }
        }
      },
      "func": { "type": "string", "description": "Function name under test (function style)" },
      "funcCases": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["args", "expected", "label"],
          "properties": {
            "args": { "type": "string", "description": "Python argument source, e.g. \\"3, 9\\" or \\"'red'\\"" },
            "expected": { "type": "string", "description": "repr() of the expected return value" },
            "label": { "type": "string" }
          }
        }
      }
    }
  }
}
`;

const MD_README = `# PYKING — Learn Python by Fighting Bugs

A gamified Python learning game: solve real coding challenges to clear 9 dungeons,
earn XP, keep streaks, collect badges, and defeat the BUG KING.

> This is the desktop (Streamlit + SQLite) edition. A web edition with the same
> curriculum also exists — both share one challenge format.

## Features

- 9 levels, 48 challenges: variables → conditionals → loops → collections →
  functions → OOP → files/exceptions → decorators/generators → mini-project boss
- Real code execution with a 5-second timeout (infinite loops cannot freeze the game)
- XP, ranks, 3 hearts per quest, streaks, 12 badges, local leaderboard
- Boss fight at the end of every level
- Spaced repetition: failed quests return after 1 → 3 → 7 days (Review Dojo)
- SQLite save file: data/pyking.db
- Challenges live in JSON — add quests without touching Python code

## Quickstart

Requirements: Python 3.11 or newer.

~~~bash
# 1. (Optional but recommended) create a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\\Scripts\\activate

# 2. Install dependencies
pip install -r requirements.txt  # just streamlit

# 3. Play!
streamlit run main.py
~~~

Then open the local URL Streamlit prints (usually http://localhost:8501).

## Project structure

~~~text
pyking/
├── main.py              # entry point (run with streamlit)
├── requirements.txt
├── README.md
├── ANDROID_APK_GUIDE.md # how to get this game on Android
├── challenges/          # level_01.json ... level_09.json + schema.json
├── engine/              # runner, grader, errors, srs, save
├── ui/                  # Streamlit app (app.py)
└── data/                # pyking.db save file (auto-created)
~~~

## Adding challenges

1. Copy the shape of an existing object in challenges/level_01.json
   (the contract is documented in challenges/schema.json).
2. Append it to the right level file, or create challenges/level_10.json.
3. Restart the app — no code changes needed.

Two test styles are supported: "tests" (stdin → expected stdout) and
"func" + "funcCases" (call a function, compare repr of the return value).

## Safety model

- Player code runs in a subprocess with timeout=5.
- stderr is truncated to 500 chars; tracebacks are translated to friendly tips.
- A static guard warns on "while True" with no break.

## Push to GitHub

~~~bash
git init
git add .
git commit -m "feat: PYKING gamified Python learning app"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/pyking.git
git push -u origin main
~~~

## Android APK

The Streamlit app is a server app, so the Android edition is the web build
(same curriculum, installable). See ANDROID_APK_GUIDE.md for 4 options:
install-as-app (PWA), PWABuilder APK, Capacitor wrap, and offline HTML.

## License

MIT — learn from it, remix it, teach with it.
`;

const MD_APK_GUIDE = `# PYKING on Android — APK Guide (English)

You have 4 options, easiest first. Options A–C need the web build hosted on
HTTPS (GitHub Pages, Netlify, Vercel, or any static host). The web build ships
with manifest.webmanifest + sw.js + icon, so it is PWA-ready out of the box.

## Option A — Install as app / PWA (2 minutes, no APK file)

Best for personal use and classrooms.

1. Host the web build (or open its hosted URL) in Chrome on Android.
2. Tap the menu (three dots) → "Add to Home screen" (or "Install app").
3. PYKING now launches fullscreen like a native app, with offline support.

## Option B — Real APK via PWABuilder (recommended for sharing)

1. Host the web build on HTTPS and copy the URL.
2. Go to https://www.pwabuilder.com and enter the URL.
3. Fix any reported issue (manifest + icons + service worker are included,
   so it should score well). A 512px+ PNG icon may be requested — export one
   from icon.svg if asked.
4. Click "Package for Android" → download the .apk (debug) or .aab (Play Store).
5. Install the APK directly, or upload the AAB to Play Console ($25 one-time).

## Option C — Capacitor wrap (full native project)

1. npm install @capacitor/core @capacitor/cli @capacitor/android
2. npx cap init PYKING com.example.pyking
3. Copy the built web files into the Capacitor web directory.
4. npx cap add android && npx cap sync && npx cap open android
5. Build the APK/AAB in Android Studio (Build → Generate App Bundle).

## Option D — Offline single HTML file

The Download Center in the web app offers "Offline HTML": one .html file with
the whole game. Copy it to the phone and open it in any browser. Live Python
execution needs internet once (Pyodide CDN); without it the offline checker
still grades quests.

## FAQ

- Can the Streamlit (Python) app become an APK directly? No — Streamlit is a
  server framework. The Android edition is the web build (same 48 challenges).
- Play Store or sideload? PWABuilder output can be sideloaded as APK or
  published as AAB. Publishing needs a $25 Play Console account.
- Offline? Yes: the service worker caches the app shell; Pyodide caches after
  first load; the static grader covers fully-offline grading.
`;

/* ═══════════════ zip builder ═══════════════ */

function levelJson(level: number): string {
  const mapped = byLevel(level).map((c) => ({
    id: c.id, level: c.level, num: c.num, title: c.title, concept: c.concept,
    bug: c.bug, bugEmoji: c.bugEmoji, lesson: c.lesson, task: c.task,
    hint: c.hint, starter: c.starter, solution: c.solution, xp: c.xp,
    ...(c.boss ? { boss: true } : {}),
    ...(c.tests ? { tests: c.tests } : {}),
    ...(c.func ? { func: c.func, funcCases: c.funcCases } : {}),
  }));
  return JSON.stringify(mapped, null, 2) + "\n";
}

export const KIT_TREE = [
  "main.py", "requirements.txt", "README.md", "ANDROID_APK_GUIDE.md", ".gitignore",
  "engine/__init__.py", "engine/runner.py", "engine/grader.py", "engine/errors.py",
  "engine/srs.py", "engine/save.py",
  "ui/__init__.py", "ui/app.py",
  "challenges/schema.json", "challenges/level_01.json … level_09.json (48 quests)",
  "data/.gitkeep",
];

export const GITHUB_COMMANDS = `git init\ngit add .\ngit commit -m "feat: PYKING gamified Python learning app"\ngit branch -M main\ngit remote add origin https://github.com/<YOUR-USERNAME>/pyking.git\ngit push -u origin main`;

export async function downloadPythonKit(): Promise<{ bytes: number; files: number }> {
  const zip = new JSZip();
  const root = zip.folder("pyking");
  if (!root) throw new Error("zip init failed");
  root.file("main.py", PY_MAIN);
  root.file("requirements.txt", PY_REQUIREMENTS);
  root.file("README.md", MD_README);
  root.file("ANDROID_APK_GUIDE.md", MD_APK_GUIDE);
  root.file(".gitignore", PY_GITIGNORE);
  root.file("engine/__init__.py", PY_ENGINE_INIT);
  root.file("engine/runner.py", PY_RUNNER);
  root.file("engine/grader.py", PY_GRADER);
  root.file("engine/errors.py", PY_ERRORS);
  root.file("engine/srs.py", PY_SRS);
  root.file("engine/save.py", PY_SAVE);
  root.file("ui/__init__.py", PY_UI_INIT);
  root.file("ui/app.py", PY_APP);
  root.file("challenges/schema.json", JSON_SCHEMA);
  for (let lvl = 1; lvl <= 9; lvl++) {
    root.file(`challenges/level_${String(lvl).padStart(2, "0")}.json`, levelJson(lvl));
  }
  root.file("data/.gitkeep", "\n");
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  triggerDownload(URL.createObjectURL(blob), "pyking-python.zip");
  return { bytes: blob.size, files: 16 + 9 };
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  triggerDownload(URL.createObjectURL(blob), filename);
}

export function downloadOfflineHtml() {
  const html = "<!DOCTYPE html>\n" + document.documentElement.outerHTML;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  triggerDownload(URL.createObjectURL(blob), "pyking-offline.html");
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(href); }, 1500);
}

export const QUICK_FILES = { "README.md": MD_README, "main.py": PY_MAIN, "requirements.txt": PY_REQUIREMENTS };
