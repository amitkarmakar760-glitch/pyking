// ─── PYKING challenges: Levels 1–2 (10 each) ────────────────────────────
// Each challenge = lesson + task + starter + hint + solution + auto-tests.
// Tests are either stdout tests (stdin → expected output) or function tests.

export type StdTest = { stdin: string; expected: string; label: string };
export type FuncTest = { args: string; expected: string; label: string };

export type Challenge = {
  id: string;
  level: number;
  num: number;
  title: string;
  concept: string;
  bug: string;
  bugEmoji: string;
  lesson: string;
  task: string;
  hint: string;
  starter: string;
  solution: string;
  xp: number;
  boss?: boolean;
  tests?: StdTest[];
  func?: string;
  funcCases?: FuncTest[];
};

export const CHALLENGES_A: Challenge[] = [
  // ═══════════════ LEVEL 1 — Print Caverns ═══════════════
  {
    id: "1-1", level: 1, num: 1, title: "First Words", concept: "print()",
    bug: "Silent Slime", bugEmoji: "🦠",
    lesson: "Every Python journey starts with `print()`. It displays text on screen. Text (a string) goes inside quotes: `print(\"Hello\")`. Numbers need no quotes: `print(42)`.",
    task: "Print exactly this line:\nHello, PYKING!",
    hint: "Use print() with the text in double quotes. Match capitals, comma and exclamation exactly!",
    starter: '# Print: Hello, PYKING!\n',
    solution: 'print("Hello, PYKING!")',
    xp: 40,
    tests: [{ stdin: "", expected: "Hello, PYKING!", label: "prints the greeting" }],
  },
  {
    id: "1-2", level: 1, num: 2, title: "Name & Number", concept: "variables",
    bug: "Forgetful Fungus", bugEmoji: "🍄",
    lesson: "A **variable** stores a value under a name: `hero = \"Nova\"` and `level = 5`. No `let`, no types to declare — just `name = value`. Print them like `print(hero)`.",
    task: "1. Create variable `hero` = \"Nova\"\n2. Create variable `level` = 5\n3. Print `hero`, then print `level` (two lines)",
    hint: "Two assignments, then two print() calls. Strings need quotes, numbers don't.",
    starter: '# 1. hero = "Nova"\n# 2. level = 5\n# 3. print both\n',
    solution: 'hero = "Nova"\nlevel = 5\nprint(hero)\nprint(level)',
    xp: 50,
    tests: [{ stdin: "", expected: "Nova\n5", label: "prints Nova then 5" }],
  },
  {
    id: "1-3", level: 1, num: 3, title: "What Type Is It?", concept: "data types",
    bug: "Type Termite", bugEmoji: "🐛",
    lesson: "Python's 4 core types: `str` (text), `int` (whole numbers), `float` (decimals), `bool` (True/False). `type(x).__name__` reveals a value's type as a string.",
    task: "Print the type names of these values, one per line:\n3.5  →  ?\nTrue  →  ?\n(\"hello\" is a str — that's your example)",
    hint: "print(type(3.5).__name__) gives 'float'. Do the same for True.",
    starter: 'print(type("hello").__name__)\n# now print the type names of 3.5 and True\n',
    solution: 'print(type("hello").__name__)\nprint(type(3.5).__name__)\nprint(type(True).__name__)',
    xp: 50,
    tests: [{ stdin: "", expected: "str\nfloat\nbool", label: "prints str, float, bool" }],
  },
  {
    id: "1-4", level: 1, num: 4, title: "F-String Magic", concept: "f-strings",
    bug: "Mumble Moth", bugEmoji: "🦋",
    lesson: "f-strings embed variables in text: `f\"{hero} is level {level}\"`. Put `f` before the quote, wrap variables in `{}`. Way cleaner than `\"...\" + ...` concatenation!",
    task: "Given `hero = \"Nova\"` and `level = 5` (already written), print exactly:\nNova is level 5",
    hint: "Use one print with an f-string: print(f\"{hero} is level {level}\")",
    starter: 'hero = "Nova"\nlevel = 5\n# print: Nova is level 5\n',
    solution: 'hero = "Nova"\nlevel = 5\nprint(f"{hero} is level {level}")',
    xp: 60,
    tests: [{ stdin: "", expected: "Nova is level 5", label: "f-string output matches" }],
  },
  {
    id: "1-5", level: 1, num: 5, title: "Hello, Stranger", concept: "input()",
    bug: "Echo Bat", bugEmoji: "🦇",
    lesson: "`input()` reads a line the player types and returns it as a **string**. `name = input()` then `print(f\"Hi, {name}!\")` greets anyone. Tests will feed different names automatically!",
    task: "1. Read a name with `input()` into `name`\n2. Print: Hi, <name>!\n(example: input Zed → Hi, Zed!)",
    hint: "name = input() on line 1, then an f-string print. The '!' goes INSIDE the string.",
    starter: '# 1. read name\n# 2. print Hi, <name>!\n',
    solution: 'name = input()\nprint(f"Hi, {name}!")',
    xp: 60,
    tests: [
      { stdin: "Zed", expected: "Hi, Zed!", label: "greets Zed" },
      { stdin: "Ada", expected: "Hi, Ada!", label: "greets Ada" },
    ],
  },
  {
    id: "1-6", level: 1, num: 6, title: "Double Trouble", concept: "int() conversion",
    bug: "String Snake", bugEmoji: "🐍",
    lesson: "`input()` ALWAYS returns a string — `\"21\" * 2` gives `\"2121\"`, not 42! Convert first: `n = int(input())`. Then `n * 2` is real math. (`float()` works for decimals.)",
    task: "1. Read an integer with `int(input())` into `n`\n2. Print `n` doubled (n * 2)",
    hint: "n = int(input()) then print(n * 2). Don't forget int() or '21' becomes '2121'!",
    starter: '# read int n, print n * 2\n',
    solution: 'n = int(input())\nprint(n * 2)',
    xp: 70,
    tests: [
      { stdin: "21", expected: "42", label: "21 → 42" },
      { stdin: "0", expected: "0", label: "0 → 0" },
      { stdin: "-5", expected: "-10", label: "-5 → -10" },
    ],
  },
  {
    id: "1-7", level: 1, num: 7, title: "Potion Math", concept: "operators",
    bug: "Gremlin of Chaos", bugEmoji: "👺",
    lesson: "Python math: `+  -  *  /  //  %  **`. With `a = 7` and `b = 3`: sum is 10, difference is 4, product is 21. Print each on its own line.",
    task: "Given a = 7 and b = 3, print (one per line):\n1. their sum\n2. their difference (a - b)\n3. their product",
    hint: "Three print lines: print(a + b), print(a - b), print(a * b).",
    starter: 'a = 7\nb = 3\n# print sum, difference, product\n',
    solution: 'a = 7\nb = 3\nprint(a + b)\nprint(a - b)\nprint(a * b)',
    xp: 60,
    tests: [{ stdin: "", expected: "10\n4\n21", label: "prints 10, 4, 21" }],
  },
  {
    id: "1-8", level: 1, num: 8, title: "Spell Repeater", concept: "string ops",
    bug: "Parrot Phantom", bugEmoji: "🦜",
    lesson: "Strings support `+` (join) and `*` (repeat)! `\"Py\" + \"!\"` → `\"Py!\"`, and `\"Py!\" * 3` → `\"Py!Py!Py!\"`. Casting with `str()` turns numbers into text.",
    task: "Print exactly:\nPy!Py!Py!\n(using the * operator, not by typing it 3 times!)",
    hint: "One line: print(\"Py!\" * 3). The * repeats a string!",
    starter: '# print Py!Py!Py! using *\n',
    solution: 'print("Py!" * 3)',
    xp: 50,
    tests: [{ stdin: "", expected: "Py!Py!Py!", label: "prints repeated spell" }],
  },
  {
    id: "1-9", level: 1, num: 9, title: "Measuring Magic", concept: "len()",
    bug: "Shrinking Shroom", bugEmoji: "🍄",
    lesson: "`len()` counts characters in a string (or items in a collection): `len(\"pyking\")` → 6. Spaces count too! Combine with input: `len(input())` measures whatever is typed.",
    task: "1. Read a word with `input()`\n2. Print its length using `len()`",
    hint: "word = input() then print(len(word)). For 'dragon' the answer is 6.",
    starter: '# read word, print its length\n',
    solution: 'word = input()\nprint(len(word))',
    xp: 60,
    tests: [
      { stdin: "dragon", expected: "6", label: "dragon → 6" },
      { stdin: "pyking", expected: "6", label: "pyking → 6" },
      { stdin: "a", expected: "1", label: "a → 1" },
    ],
  },
  {
    id: "1-10", level: 1, num: 10, title: "⚔️ BOSS: Echo Ooze", concept: "level 1 combined",
    bug: "Echo Ooze", bugEmoji: "🟢",
    lesson: "BOSS FIGHT! Combine everything: `input()` for text AND numbers, `int()` conversion, f-strings, and math. Read carefully — the Ooze checks EVERY line!",
    task: "1. Read `name` (string) and `num` (integer) — two input() lines\n2. Print exactly 3 lines:\nBrave <name> enters the cavern!\nLucky number: <num>\nNext level: <num+1>\n(Input Ada then 7 → see lines above with Ada/7/8)",
    hint: "name = input() then num = int(input()). Three f-string prints; the last one prints num + 1.",
    starter: '# read name (str) and num (int)\n# print the 3 prophecy lines\n',
    solution: 'name = input()\nnum = int(input())\nprint(f"Brave {name} enters the cavern!")\nprint(f"Lucky number: {num}")\nprint(f"Next level: {num + 1}")',
    xp: 150,
    boss: true,
    tests: [
      { stdin: "Ada\n7", expected: "Brave Ada enters the cavern!\nLucky number: 7\nNext level: 8", label: "Ada + 7 prophecy" },
      { stdin: "Zed\n99", expected: "Brave Zed enters the cavern!\nLucky number: 99\nNext level: 100", label: "Zed + 99 prophecy" },
    ],
  },

  // ═══════════════ LEVEL 2 — Forked Forest ═══════════════
  {
    id: "2-1", level: 2, num: 1, title: "Even or Odd?", concept: "if / else + %",
    bug: "Parity Pixie", bugEmoji: "🧚",
    lesson: "`if / else` runs code only when a condition is True. `%` (modulo) gives remainders: `n % 2 == 0` means even. Write `def is_even(n):` returning True/False. Note the colon + 4-space indent!",
    task: "Write function `is_even(n)`:\n• return True if n is even\n• return False otherwise",
    hint: "if n % 2 == 0: return True else: return False. (Pros write: return n % 2 == 0)",
    starter: 'def is_even(n):\n    # return True if n is even\n    pass\n',
    solution: 'def is_even(n):\n    if n % 2 == 0:\n        return True\n    else:\n        return False',
    xp: 60,
    func: "is_even",
    funcCases: [
      { args: "4", expected: "True", label: "is_even(4) is True" },
      { args: "7", expected: "False", label: "is_even(7) is False" },
      { args: "0", expected: "True", label: "is_even(0) is True" },
    ],
  },
  {
    id: "2-2", level: 2, num: 2, title: "Pass or Fail", concept: "comparisons",
    bug: "Grumpy Grader", bugEmoji: "🧌",
    lesson: "Comparison operators: `>  <  >=  <=  ==  !=`. An exam pass mark is 40: `if score >= 40: return \"Pass\"`. Remember `==` compares, `=` assigns — mixing them is the #1 beginner bug!",
    task: "Write function `verdict(score)`:\n• return \"Pass\" if score >= 40\n• return \"Fail\" otherwise",
    hint: "if score >= 40: return \"Pass\" else: return \"Fail\". Watch the capital P and F!",
    starter: 'def verdict(score):\n    # Pass if >= 40 else Fail\n    pass\n',
    solution: 'def verdict(score):\n    if score >= 40:\n        return "Pass"\n    else:\n        return "Fail"',
    xp: 60,
    func: "verdict",
    funcCases: [
      { args: "55", expected: "'Pass'", label: "55 → Pass" },
      { args: "40", expected: "'Pass'", label: "40 → Pass (boundary!)" },
      { args: "39", expected: "'Fail'", label: "39 → Fail" },
    ],
  },
  {
    id: "2-3", level: 2, num: 3, title: "Gate of Age", concept: "if/else + input",
    bug: "Gatekeeper Golem", bugEmoji: "🗿",
    lesson: "Combine Level 1 input skills with decisions: read an int, then branch. `age = int(input())`, then `if age >= 18: print(\"Adult\")` / `else: print(\"Minor\")`.",
    task: "1. Read integer `age`\n2. Print \"Adult\" if age >= 18, else print \"Minor\"",
    hint: "age = int(input()) then an if/else with two prints. Exact capitals!",
    starter: '# read age, print Adult or Minor\n',
    solution: 'age = int(input())\nif age >= 18:\n    print("Adult")\nelse:\n    print("Minor")',
    xp: 70,
    tests: [
      { stdin: "20", expected: "Adult", label: "20 → Adult" },
      { stdin: "18", expected: "Adult", label: "18 → Adult" },
      { stdin: "12", expected: "Minor", label: "12 → Minor" },
    ],
  },
  {
    id: "2-4", level: 2, num: 4, title: "Bigger Blade", concept: "two branches",
    bug: "Twin Troll", bugEmoji: "👹",
    lesson: "Two inputs, one winner: `def max_of(a, b):` returns the larger. `if a > b: return a` / `else: return b`. (Equal values → either is fine, `else` returns b.)",
    task: "Write function `max_of(a, b)` returning the larger of the two numbers",
    hint: "if a > b: return a else: return b. Test with (3, 9) → 9 and (10, 2) → 10.",
    starter: 'def max_of(a, b):\n    # return the larger\n    pass\n',
    solution: 'def max_of(a, b):\n    if a > b:\n        return a\n    else:\n        return b',
    xp: 70,
    func: "max_of",
    funcCases: [
      { args: "3, 9", expected: "9", label: "max_of(3, 9) → 9" },
      { args: "10, 2", expected: "10", label: "max_of(10, 2) → 10" },
      { args: "-4, -9", expected: "-4", label: "negatives work" },
    ],
  },
  {
    id: "2-5", level: 2, num: 5, title: "Traffic Treant", concept: "elif chains",
    bug: "Confused Centaur", bugEmoji: "🐴",
    lesson: "`elif` = else-if: check multiple conditions in order. `if light == \"red\": ... elif light == \"yellow\": ... else: ...`. Only the FIRST True branch runs!",
    task: "Write function `traffic(light)`:\n• \"red\" → \"Stop\"\n• \"yellow\" → \"Slow\"\n• anything else → \"Go\"",
    hint: "if light == \"red\": return \"Stop\" / elif light == \"yellow\": return \"Slow\" / else: return \"Go\"",
    starter: 'def traffic(light):\n    # red→Stop, yellow→Slow, else→Go\n    pass\n',
    solution: 'def traffic(light):\n    if light == "red":\n        return "Stop"\n    elif light == "yellow":\n        return "Slow"\n    else:\n        return "Go"',
    xp: 70,
    func: "traffic",
    funcCases: [
      { args: "'red'", expected: "'Stop'", label: "red → Stop" },
      { args: "'yellow'", expected: "'Slow'", label: "yellow → Slow" },
      { args: "'green'", expected: "'Go'", label: "green → Go" },
    ],
  },
  {
    id: "2-6", level: 2, num: 6, title: "Dungeon Entry", concept: "and / or / not",
    bug: "Bouncer Banshee", bugEmoji: "👻",
    lesson: "Combine conditions: `and` (both True), `or` (either True), `not` (flip). Entry needs age ≥ 12 AND a ticket: `return age >= 12 and has_ticket`. `has_ticket` is already True/False!",
    task: "Write function `can_enter(age, has_ticket)`:\n• return True only if age >= 12 AND has_ticket is True",
    hint: "One-liner: return age >= 12 and has_ticket. No if needed — the expression IS True/False!",
    starter: 'def can_enter(age, has_ticket):\n    # True if age>=12 and has_ticket\n    pass\n',
    solution: 'def can_enter(age, has_ticket):\n    return age >= 12 and has_ticket',
    xp: 80,
    func: "can_enter",
    funcCases: [
      { args: "15, True", expected: "True", label: "15 + ticket → True" },
      { args: "10, True", expected: "False", label: "too young → False" },
      { args: "20, False", expected: "False", label: "no ticket → False" },
    ],
  },
  {
    id: "2-7", level: 2, num: 7, title: "Ticket Tiers", concept: "elif ladder",
    bug: "Greedy Goblin", bugEmoji: "💰",
    lesson: "Order matters in elif ladders! Check smallest ranges first: `if age < 5: Free` → `elif age < 18: Child` → `elif age < 60: Adult` → `else: Senior`. Each branch inherits 'all above were False'.",
    task: "Write function `ticket(age)`:\n• age < 5 → \"Free\"\n• age < 18 → \"Child\"\n• age < 60 → \"Adult\"\n• else → \"Senior\"",
    hint: "Chain if/elif/elif/else with < 5, < 18, < 60 in that exact order.",
    starter: 'def ticket(age):\n    # Free / Child / Adult / Senior\n    pass\n',
    solution: 'def ticket(age):\n    if age < 5:\n        return "Free"\n    elif age < 18:\n        return "Child"\n    elif age < 60:\n        return "Adult"\n    else:\n        return "Senior"',
    xp: 80,
    func: "ticket",
    funcCases: [
      { args: "3", expected: "'Free'", label: "3 → Free" },
      { args: "16", expected: "'Child'", label: "16 → Child" },
      { args: "45", expected: "'Adult'", label: "45 → Adult" },
      { args: "70", expected: "'Senior'", label: "70 → Senior" },
    ],
  },
  {
    id: "2-8", level: 2, num: 8, title: "FizzBuzz Scout", concept: "modulo + order",
    bug: "Number Nymph", bugEmoji: "🧝",
    lesson: "The classic interview riddle! Check the COMBINED case first: divisible by 15 → FizzBuzz, elif by 3 → Fizz, elif by 5 → Buzz, else print the number itself. Wrong order = wrong answers!",
    task: "Read int n, then print:\n• \"FizzBuzz\" if divisible by 3 AND 5\n• \"Fizz\" if only by 3\n• \"Buzz\" if only by 5\n• otherwise print n itself",
    hint: "if n % 3 == 0 and n % 5 == 0 FIRST — then the single checks. Or use n % 15 == 0!",
    starter: '# read n, print Fizz/Buzz/FizzBuzz or n\n',
    solution: 'n = int(input())\nif n % 3 == 0 and n % 5 == 0:\n    print("FizzBuzz")\nelif n % 3 == 0:\n    print("Fizz")\nelif n % 5 == 0:\n    print("Buzz")\nelse:\n    print(n)',
    xp: 90,
    tests: [
      { stdin: "15", expected: "FizzBuzz", label: "15 → FizzBuzz" },
      { stdin: "9", expected: "Fizz", label: "9 → Fizz" },
      { stdin: "20", expected: "Buzz", label: "20 → Buzz" },
      { stdin: "7", expected: "7", label: "7 → 7" },
    ],
  },
  {
    id: "2-9", level: 2, num: 9, title: "Sign Seer", concept: "three-way branch",
    bug: "Oracle Ooze", bugEmoji: "🔮",
    lesson: "Three-way split: positive / negative / zero. `if n > 0: ... elif n < 0: ... else: ...` — the else catches exactly 0 since both comparisons were False. Neat!",
    task: "Write function `sign(n)`:\n• n > 0 → \"positive\"\n• n < 0 → \"negative\"\n• n == 0 → \"zero\"",
    hint: "if n > 0 / elif n < 0 / else. All lowercase outputs!",
    starter: 'def sign(n):\n    # positive / negative / zero\n    pass\n',
    solution: 'def sign(n):\n    if n > 0:\n        return "positive"\n    elif n < 0:\n        return "negative"\n    else:\n        return "zero"',
    xp: 70,
    func: "sign",
    funcCases: [
      { args: "10", expected: "'positive'", label: "10 → positive" },
      { args: "-3", expected: "'negative'", label: "-3 → negative" },
      { args: "0", expected: "'zero'", label: "0 → zero" },
    ],
  },
  {
    id: "2-10", level: 2, num: 10, title: "⚔️ BOSS: Two-Faced Treant", concept: "level 2 combined",
    bug: "Two-Faced Treant", bugEmoji: "🌳",
    lesson: "BOSS FIGHT! Heal, cap, then judge. Add the potion to HP, cap at 100 (`if hp > 100: hp = 100`), THEN branch: ≥70 Ready, ≥30 Heal more, else Retreat. Three skills, one function!",
    task: "Write function `battle(hp, potion)`:\n1. hp = hp + potion, but cap at 100 max\n2. return \"Ready for boss!\" if hp >= 70\n3. return \"Heal more!\" if hp >= 30\n4. else return \"Danger! Retreat!\"",
    hint: "hp = hp + potion first, then if hp > 100: hp = 100, then the elif ladder.",
    starter: 'def battle(hp, potion):\n    # heal, cap at 100, then judge\n    pass\n',
    solution: 'def battle(hp, potion):\n    hp = hp + potion\n    if hp > 100:\n        hp = 100\n    if hp >= 70:\n        return "Ready for boss!"\n    elif hp >= 30:\n        return "Heal more!"\n    else:\n        return "Danger! Retreat!"',
    xp: 160,
    boss: true,
    func: "battle",
    funcCases: [
      { args: "60, 20", expected: "'Ready for boss!'", label: "60+20 → Ready" },
      { args: "90, 50", expected: "'Ready for boss!'", label: "capped at 100 → Ready" },
      { args: "10, 25", expected: "'Heal more!'", label: "10+25 → Heal more" },
      { args: "5, 5", expected: "'Danger! Retreat!'", label: "5+5 → Retreat" },
    ],
  },
];
