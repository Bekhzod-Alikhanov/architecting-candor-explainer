# Reference audit

Three sites were named as references. Two were studied in full. The third is inaccessible; that is recorded rather than papered over.

Audited 24 August 2026 against the live sites.

---

## 1. Thwing et al. — `thwingetal.app`

*"Architecture before enforcement · AI red lines, in the right order"*

**Structure.** Twelve numbered sections, ordered as an argument rather than as a table of contents: Enforceable global AI red lines → A list without an instrument → Who would do the measuring? → The Candidate → What the watchdog actually built → Two Clocks → Compliance without effect → The Rational Myth → Build it in the right order and it holds → The Detection Problem → The recommendation.

**What the central interactive actually does.** The *Sequencing Machine*. Four institutional goods — shared standards, comparable evaluation, credible information flows, legitimacy architecture — sit as toggles above an enforcement lever. The reader can pull enforcement before the four are in place and watch the regime collapse, then rebuild foundations-first and watch it hold. The interactive is doing real argumentative work, because the thesis is *sequence* and sequence is exactly what a toggle-and-lever machine can express. A second instrument, the *Detection Problem* benchmark, lets the reader change evaluation methodology — multiple-choice against open-ended, different scaffolds — and watch identical safety items reorder the model rankings, with spreads reaching 35.6 percentage points.

**How it scaffolds a first-time user.** Numbered walkthroughs, `Step 01 · Step 02 · Step 03`, attached to the historical parallel and to the measurement-sensitivity demonstration. `Scroll to walk through` appears ahead of major interactives. Filters and toggles disclose progressively rather than presenting a full control surface at once. This is the most transferable thing on the site, and the pattern the brief asks us to execute better.

**How its captions are written.** As claims, not labels. Section heads are propositions: "Compliance without effect", "Build it in the right order and it holds". Chart sub-captions carry the finding rather than naming the axes: "Why compliance held anyway", "What it fixes", "By resources, largely one institute today".

**Typography and palette.** Georgia for both `--serif` and `--display`, Inter for sans, JetBrains Mono for mono. Paper `#FDFCF8` and `#FAF8F2`; navy `#0A1B36`, `#1B2F54`, `#050E20`; ink `#14181F`; a crimson warn register at `#8B1F2A` with soft and deep variants; gold `#B8924A`; four mandate hues (`#2F5C86` research, `#3C6E55` standards, `#7A1F28` regulatory, `#B8924A` early). Underneath sits a genuinely serious craft layer: a six-step shadow scale, separate spring and ease easing tokens, `--measure 1080px` against `--measure-prose 720px`, and focus-ring glow tokens composed with `color-mix`.

**Weakest point.** Three, in order of consequence. First, every interactive is toggle-and-observe. The reader flips a switch and reads a consequence but is never asked to commit to a strategy and then be held to it, so the site can tell you premature enforcement fails yet cannot make you be the person who tried it. Second, the page runs at one temperature throughout — warm paper, one serif — while its content is built on oppositions: compliance against effectiveness, architecture against enforcement, the two clocks. The visual system carries none of that opposition, so the argument's structure has to be read rather than felt. Third, the display face is Georgia, a system serif standing in for a designed choice, and it is the one place the craft slips.

---

## 2. Middle powers — `middlepowers-arcadiaimpact.netlify.app`

*"Governing Beyond the Frontier: Mapping AI Middle-Powers' Approaches"*

**Structure.** Five numbered sections: 01 The Shape · 02 Existing Mandates · 03 Reach · 04 Institutions · 05 Next Steps.

**What the central interactive actually does.** A coverage matrix — jurisdictions down, four governance areas across: systemic risk assessment, evaluation and verification, red lines with incident monitoring, serious incident reporting. Each cell encodes legal tier as fill and route as a letter, `H` horizontal or `S` sectoral, with `▸` for proposal-only coverage and an em dash for confirmed absence. Clicking a row opens that jurisdiction's full instrument profile with tier and origin per instrument. Around it sit stacked bar charts with view toggles (By tier / By year / Hard law by year; By origin / By mandate) and a GROUP BY control (Instrument count / Global Majority / Region). Every chart carries `SAVE SVG / PNG`, a small thing that signals the page expects to be cited.

**How it scaffolds a first-time user.** It largely does not. Charts arrive with a caption and a view toggle, and the reader is left to work out what the toggle is for. The matrix is dense on arrival. This is the clearest gap between the two sibling sites.

**How its captions are written.** Very well — the strongest writing of the three. Section heads are findings: "Most middle-power GPAI governance is horizontal soft law", "Binding law is built on architecture with existing mandates", "Sectoral instruments are enforceable but narrow", "The bodies built for AI are the bodies that cannot enforce". Each chart carries a title stating the claim, a sub-caption stating the mechanism ("All 101 in-scope instruments. The softer the tier, the higher the share that is horizontal"), and a paragraph *after* the chart naming the consequence. Two moves are worth taking outright. Absence is treated as a finding rather than a gap — "A dash is a confirmed absence, which is a coded finding rather than a gap in the research". And derived data is flagged as derived: the purpose-built against pre-existing split "was coded for the explainer and is not a project codebook field, so every instrument behind it is listed in the profiles". Section 05 is five questions the mapping raises and cannot answer. That is the register of intellectual honesty this genre should run at.

**Typography and palette.** Inter for body and UI, Newsreader for serif display, `ui-monospace` for data. Surface `#faf9f5`, panels `#f2f0e9` and `#f7f5f0`, ink `#22302a` (a deep green-black), secondary ink `#3e5a66`, muted `#7c8b84`, grid `#e2e0d6`, rule `#dcd9cd`, absence `#eceae2`, and a single quantitative ramp from sage `#9bb2a4` to the ink green `#22302a`.

**Weakest point.** It is a map, not a mechanism. Everything is read-only: the reader filters, sorts, groups and exports, but never acts, never commits, and never meets a consequence. The best thing on the page, the coverage matrix, is a lookup table. Secondarily, one sage-to-green ramp is asked to carry four variables at once — tier by fill, route by letter, proposal by glyph, absence by dash — and the letter-and-glyph overloading is a legibility cost, though it does at least avoid encoding anything by colour alone.

---

## 3. `script.google.com/a/macros/arcadiaimpact.org/…/exec`

**Inaccessible.** The URL is a Google Apps Script web app published inside the `arcadiaimpact.org` Workspace domain. Fetched 24 August 2026; it returns no document content without an authenticated `arcadiaimpact.org` session. No audit is offered because none was possible. If it can be exported, or its content pasted, its lessons will be folded in and this section replaced.

---

## How this site will be better

Both sibling sites explain a finding. This one has the rarer opportunity, because *Architecting Candor*'s thesis is not a finding but a mechanism, and mechanisms can be operated. So the central interactive will not toggle-and-observe. It hands the reader an unfolding incident, makes them route every artifact themselves — including into the fourth bin, *do not write it down*, which is the strategy most readers arrive believing in — and then grades that routing on two scoreboards that pull against each other, discovery exposure against remediation capability. The reader loses first, on their own decisions, before the site argues anything; only then does the four-strategy comparison show that writing nothing barely reduces exposure, because Channel One telemetry is generated automatically, while it destroys the ability to fix the system. That is a conclusion the reader reaches rather than reads, and neither sibling attempts it. Around that centre, we take Thwing's numbered-step scaffolding and run it on every heavy instrument rather than on some, always moving the instrument's own state and always ending in an explicit release of control. We take Middle Powers' caption discipline and its honesty about derived data, labelling every simulated value on the screen that shows it rather than in a footnote. And we reject the one thing both share — a single warm paper temperature — because this paper's subject is a collision between two document systems that do not agree, and a site about that collision should be visibly built out of it.
