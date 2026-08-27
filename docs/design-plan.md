# Design plan

Two passes, as the brief requires. Pass one is the plan. Pass two critiques it against the brief and revises. **The revisions in pass two are binding: where they conflict with pass one, pass two governs.**

---

# Pass one — the plan

## Where the visual language comes from

Not from "policy paper site". From the collision the paper is about.

An AI incident produces one event and two irreconcilable documents. The engineering console records `clf_conf=0.31 thr=0.60 sess=a9f1`. The discovery production records *Exhibit 14, ARC-000412, "…a classifier confidence of 0.31 against a deployment threshold of 0.60…"*. Same fact. Two document systems that do not agree on what a record is for, who authored it, what it proves, or how it should look.

The brief names the one honest risk worth taking: letting the page look like two incompatible document systems forced to share a surface. That is the design.

Source materials mined, all from the paper's own world: telemetry dashboards, incident tickets, privilege logs, Bates-stamped discovery production, exhibit stickers, redaction bars, threshold bands and alert tiers, append-only logs, chain of custody.

## Palette

Six named values. Each is taken from a physical artifact in the paper's subject, not from a mood.

| Token | Hex | What it actually is | Where it is used |
|---|---|---|---|
| `--console` | `#162127` | The telemetry dashboard ground. Desaturated slate with a blue-green cast — an instrument panel, not a void. | The page ground. Channel One and Channel Three surfaces. |
| `--exhibit` | `#E3E8E7` | A document photocopied and scanned to grayscale for production. Cool, faintly green, deliberately *not* cream. | Produced document objects, exhibits, Channel Two surfaces. |
| `--stamp` | `#7A3346` | Bates and exhibit stamp ink — oxidised, dull, red-purple. The colour of a rubber stamp on a produced page. | Production numbers, privilege marks, the review tier, counsel's register. |
| `--instrument` | `#3E8E96` | The measurement register. Cool teal, instrument-panel, no neon. | Telemetry, thresholds, measurement language, Channel One signals. |
| `--ochre` | `#8A7332` | The logging tier — dull, earthy, sitting visibly *beneath* the review tier. | The logging band, near-miss capture. |
| `--redact` | `#0B0F11` | An opaque redaction bar. | Redaction and withholding marks only. Never a page ground. |

**Why these and not the defaults.** Warm cream with a serif display and a terracotta accent is the register of the humane policy essay, and it is what both sibling sites already run; this paper is not humane, it is adversarial, and its subject is instrumentation. Near-black with a single acid accent is the register of the developer-tool landing page, which trivialises a paper about legal exposure. Both are refused on subject grounds, not taste.

**Semantic assignment, not decoration.** The logging tier is ochre and the review tier is stamp ink, because crossing the review threshold is the moment counsel takes custody. The colour tells you which document system now owns the record. That is the paper's argument rendered as a hue change.

**Derived steps** come from `color-mix()` in the token layer, never new hex values.

**Contrast, computed not assumed.** `--stamp` on `--exhibit` is 7.1:1 — passes AA and AAA for body. `--instrument` on `--console` is 4.3:1, which passes AA for large text but **fails for body text**, so the token layer ships `--instrument-lift` (instrument mixed toward exhibit) for anything at body size on the console ground. Raw `--instrument` is restricted to rules, marks and large numerals.

**Colour is never the sole carrier.** The four routing bins, the discovery outcome states, and the two threshold tiers each carry a text label and a distinct glyph or fill pattern in addition to hue.

## Type

Three faces, self-hosted via `@fontsource`. The pairing is the two-systems conceit made typographic.

| Role | Face | Why this one |
|---|---|---|
| Utility, data, telemetry, ticket text, captions, Bates stamps | **IBM Plex Mono** | The console's native voice. Tabular figures, unambiguous glyphs. |
| Console prose, UI, controls, section furniture | **IBM Plex Sans** | Designed for IBM's enterprise engineering systems — the actual vernacular being quoted. Same family as the mono. |
| The legal register: exhibits, quotations, doctrinal prose, display | **Spectral** | A serif with a documentary, faintly official cast, designed for extended screen reading. |

The point of the pairing: **the console speaks in one designed family across two widths; the law speaks in a different voice entirely.** The engineering side is internally coherent, the legal side is a foreign body. Neither is allowed to set the other's type.

Deliberately avoids Georgia, Newsreader, Inter and JetBrains Mono, all of which are in use on the sibling sites.

**Two scales, not one.** The console register runs a tight scale with `font-variant-numeric: tabular-nums` on every figure. The legal register runs a wider scale on a longer measure. They are not reconciled.

**Preload exactly two weights:** IBM Plex Mono 400 and Spectral 500 — the two faces the hero renders above the fold, one per side of the seam. Plex Sans loads with `swap` and first appears below the fold.

## The signature — the seam

One element, and everything else stays quiet around it.

A structural join running where the two document systems meet. It is not a divider and not decoration; it is **the one-way valve**, and it behaves:

- **Facts cross inward.** Drag telemetry from Channel One toward Channel Two and the seam accepts with a short magnetic snap.
- **Conclusions cannot cross outward.** Drag a causal conclusion, a fault characterisation or a litigation assessment toward a ticket, a dashboard or a public communication and the seam **refuses**: the object is pushed back on a damped spring, a stamp-ink hairline flashes along the join, and the doctrinal reason appears inside the seam itself.
- **It carries the production count.** The seam accumulates Bates-style numbers as the reader descends — `ARC-000001` upward. The page is an append-only production, and the numbering is chain of custody rather than ornament.
- **On narrow screens** it rotates to horizontal and divides the stacked registers, keeping identical behaviour.

The same gesture recurs in the hero, in Route the Record, and in the operable architecture — so that by §04 the reader already knows in their hands what the valve does before the page names it.

## Layout

**Hero (§00).** One incident record straddling the seam, rendered simultaneously as an engineering log line and as a discovery exhibit. The reader can pull the seam left or right to give either system more of the record; neither reading ever disappears.

```
┌────────────────────────────────────────────┬─────────────────────────────────────────┐
│  CHANNEL ONE · ordinary course             │           EXHIBIT 14                    │
│                                            │                                          │
│  2026-07-14T14:22:07.331Z                  │  "At 14:22 on 14 July the system         │
│  sess     a9f1c2                       ┃   │   returned the output at issue. The      │
│  model    asst-4.2 / policy 2026.07.3  ┃   │   classifier scored 0.31 against a       │
│  clf_conf 0.31    thr 0.60             ┃   │   deployment threshold of 0.60. The      │
│  guardrail.fire   +1.842s              ┃   │   guardrail activated 1.8 seconds        │
│  retrieval  4 docs / tool_calls 1      ┃   │   after the output was served."          │
│                                        ┃   │                                          │
│  measurement language                  ┃   │            ARC-000412  ▐▐  CONFIDENTIAL │
├────────────────────────────────────────┸───┴──────────────────────────────────────────┤
│  ◀ drag the seam ▶        one record. two readings. the firm does not choose which.   │
└───────────────────────────────────────────────────────────────────────────────────────┘

   Above: the Pinto memo, and the lesson counsel drew from it.
   Below: AI developers cannot decline to write it down. The system writes it for them.
```

Simulated-data label sits on the record itself, not in a footnote.

**Route the Record (§03).** Console-dominant. The deck is a console queue; the bins are four labelled destinations; the verdicts arrive as exhibit-coloured document objects with stamps.

```
┌─ 03 ROUTE THE RECORD ─────────────────────────────── ARC-000003 ─┐
│ A deployed assistant with a retrieval layer and a safety          │
│ classifier. A user reports harm. Telemetry shows the guardrail     │
│ fired late.                              ▟ SIMULATED INCIDENT ▙  │
├───────────────────────────────────────────────────────────────────┤
│  ┌── UNROUTED  7 of 14 ──┐   │ DISCOVERY EXPOSURE               │
│  │ ▣ slack_msg_0231      │   │ produced      ████████░░  8       │
│  │   "the guardrail      │   │ withheld           ██░░░  2       │
│  │    obviously failed"  │   │ pierced            █░░░░  1  ⚠    │
│  │   14:31  eng-chat     │   │ 407-excluded       █░░░░  1       │
│  └───────────────────────┘   │ spoliation risk    ██░░░  2  ⚠    │
│    ▲ ▼ move   1-4 route      │                                   │
│                              │ REMEDIATION CAPABILITY            │
│  ┌─1─────┐┌─2─────┐          │ model+deploy version   ✓          │
│  │ CH ONE││ CH TWO│          │ prompts and outputs    ✓          │
│  │ factual│privil.│          │ retrieval / tool       ✗ ── lost  │
│  │  ▓▓▓▓ ││ ▒▒▒   │          │ guardrail decisions    ✓          │
│  └───────┘└───────┘          │ drift and calibration  ✗ ── lost  │
│  ┌─3─────┐┌─4─────┐          │ threshold values       ✓          │
│  │ CH THREE│ DO NOT│          │ operating conditions   ✗ ── lost │
│  │ remed. ││ WRITE │          │                                   │
│  │  ░░░   ││ ██████│          │ "reproduction is system-state    │
│  └───────┘└───────┘          │  dependent, and the serving       │
│                              │  stack has since changed."        │
└───────────────────────────────────────────────────────────────────┘
              run the document request  ▸        [ 14 of 14 routed ]
```

The two scoreboards are always visible and move in opposite directions. Both are live regions.

**The architecture, operable (§04).** Three channels as live regions, every arrow clickable, the seam between Two and everything else.

```
┌─ 04 ─────────────────────────────────────────── ARC-000004 ─┐
│                                                              │
│  ┌ CHANNEL ONE ─┐  facts in  ┌ CHANNEL TWO ┐ work order out │
│  │ the factual  │ ─────────▶ │  privileged  │ ────────────▶ │
│  │   record     │      ┃     │   counsel +  │      ┃         │
│  │              │      ┃     │ safety review│      ┃    ┌ CH THREE ┐
│  │ append-only  │      ┃     │              │      ┃    │remediation│
│  │ discoverable │      ┃     │ Upjohn Kovel │      ┃    │ Rule 407 │
│  └──────┬───────┘      ┃     └──────────────┘      ┃    └────┬─────┘
│         │              ┃          ▲   ✕            ┃         │
│         │              ┃          │   └── refused ─┸─────────┘
│         │         THE SEAM        │       causal conclusions
│         │                         │       do not cross outward
│         └── enrich: fact + verification of completed change ──┘
│             (cannot overwrite the pre-remediation state)
│
│  drag an object. try to move it anywhere. the valve answers.
└──────────────────────────────────────────────────────────────┘
```

## Motion

**Earns its place.** The seam's refusal — a damped spring push-back, because refusal must feel physical. The product / not-a-product boundary migrating along the §01 timeline, because migration *is* the finding. The synthetic event stream flowing past the calibrator's bands, because the reader needs to see events fall on either side of a threshold. Score ticks. A stamp landing — a stamp impresses, it does not fade in.

**Does not.** Section entry fades. Parallax. Hover lifts. Decorative count-ups. Anything that would run identically on a site about a different paper.

**`prefers-reduced-motion`** collapses every scroll-triggered and physics animation to an instant state change. The seam's refusal becomes an immediate position reset with the reason text appearing at once — the *information* is never carried by the animation alone.

---

# Pass two — critique and revision

Read against the brief. Six findings; five changes.

### 1. The exhibit surface was drifting back toward the thing I rejected

**Problem.** A cool grey paper surface plus a serif is still, structurally, paper-and-serif. Squint at pass one and it could pass for the sibling sites at a different colour temperature. The brief's test is whether the design would survive having its content swapped out, and a two-tone paper/console split would.

**Change.** `--exhibit` is now **forbidden as a page background.** The page ground is `--console`, everywhere. The exhibit surface appears only as **bounded document objects** — exhibits, produced pages, verdict cards, quotations — with visible edges, stamps and drop shadows, sitting *on* the console ground.

**Why this is better than a cosmetic fix.** It states the paper's actual power relationship. Facts are the substrate the firm cannot opt out of; legal judgment is a bounded space carved out of that substrate. Channel One is the ground; Channel Two is an object on it. The layout now asserts what §1.2.1 argues — that the candour of the first channel is a precondition for the privileges of the second. And it stops resembling either sibling site.

### 2. The signature was becoming wallpaper

**Problem.** Pass one had the seam running the length of the page. A signature present everywhere is furniture, and the brief says spend boldness in one place and keep everything around it quiet.

**Change.** The seam appears **only where a boundary actually exists in the argument**: §00 hero, §03 Route the Record, §04 the architecture, §08 the linter. It is absent from §01, §02, §06, §07. The running Bates production numbers survive as a thin marginal element, since chain of custody genuinely is continuous, but the seam itself is not.

### 3. The numbering was decorative

**Problem.** The brief explicitly forbids decorative section markers while permitting numbering here, because the argument is a sequence. Pass one had numbers that were merely present.

**Change.** Each section number is set as a **Bates-style production stamp** — `ARC-000003` — incrementing down the page. The numbering is now the chain of custody, which is a thing the paper is actually about, and it does work: it tells the reader the page is an append-only production in which nothing has been removed.

### 4. "Simulated" labelling was underspecified

**Problem.** Pass one put a badge on the hero record and left the rest to the content rules. Rule 3 of the brief requires every screen containing simulated data to say so plainly, and the calibrator's numbers are a sharper case: the paper names all seven threshold dimensions and supplies **no values for any of them**.

**Change.** Three distinct visual states, defined in the token layer and used consistently:
- **`SIMULATED`** — hatched ochre corner flag. Synthetic incident streams, the artifact deck, the classifier figures.
- **`ILLUSTRATIVE`** — outlined, no fill. Any numeric value the paper does not supply, chiefly every calibrator band value.
- **`FROM THE PAPER`** — solid stamp with a section reference. Every figure, holding, date and quotation that traces to the source.

The reader can tell at a glance which of the three they are looking at, on the screen showing it. The "show the paper's recommended configuration" control animates only to the **tiered shape** — a logging tier beneath a review tier, which is what §3.2.2 actually recommends — with the values it lands on marked `ILLUSTRATIVE`.

### 5. `--instrument` failed body contrast and pass one nearly shipped it

**Problem.** Computed at 4.3:1 against `--console`. Passes AA large, fails AA body. Discovered by calculation, not by looking.

**Change.** Kept, with `--instrument-lift` required for body-size text on console and raw `--instrument` restricted to rules, marks and large numerals. Recorded here so it is not rediscovered as a bug in Phase 7.

### 6. What survived the critique

The two-register conceit, the seam-as-valve, the semantic tier colouring where the review tier wears counsel's ink, the two unreconciled type scales, and the Plex/Spectral pairing all survive. None of them would transfer to another paper, which is the test. What was generic in pass one — a modular scale, a token layer, Framer Motion, self-hosted fonts — is competence rather than design, and is not claimed as design here.

**One thing deliberately left risky.** The page will look like two document systems that do not belong together. That is not a defect to be smoothed out in review; it is the paper's entire subject, and smoothing it is the one change that would make this site ordinary.

---

# Pass three — the widescreen revision

Passes one and two designed a 1280px column. That was wrong for the machines
people actually read on: a 1440 laptop lost 80px of margin each side, a 1920
display lost 320px, and inside the column the section intro used 570px of 1180.
The site read as a narrow ribbon of prose on a large dark field.

The conceit did not change. Two document systems, one seam, the same palette and
the same two unreconciled type scales. What changed is the frame.

**Width goes to structure, not to measure.** 74ch is already the top of
comfortable, so widening the text columns would have traded one complaint for a
worse one. `--content-max` is 108rem, and the recovered width pays for a section
rail, wider instruments, and a second track beside each section intro.

**The rail.** Ten numbered sections and, before this, no way to move between
them except scrolling. It sits in what used to be empty margin, and below 82rem
— where that track does not exist — the same ten sections open from a floating
control instead. Its data is the `sections` register in `src/content/site.ts`,
which had existed unused since Phase 1.

**Two intro arrangements.** `.sect-headline` was capped at 22ch, which broke
every headline after two or three words and was most of the narrowness. At 30ch,
with a two-track intro: sections with a companion put their scaffold beside the
lead; sections without one put the deck beside the headline, which is what a
masthead does.

**Density.** Console body went 13px → 15px → 16px → 17px across three passes.
Section padding was up to 6rem at each end, so 12rem of nothing sat between one
argument and the next; it is now capped at 4rem.

**Prose.** 46 paragraphs of 50+ words became 16, almost entirely by splitting
rather than cutting — 42 words were removed in total, both times a sentence
restated in full later in the same section. The measurement that drove this is
in the close-out audit: about half the site's word count is instrument text a
reader scans rather than reads, so the total was never the number that mattered.
