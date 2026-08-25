# Architecting Candor — interactive explainer

Companion site to *Architecting Candor: Products Liability and AI Incident Knowledge Governance* (Celone, McGregor, Secret, Mignot, Bregman & Alikhanov; Arcadia Impact AI Governance Taskforce, August 2026).

The paper's thesis is a **mechanism**, so this site does not explain the three-channel Safety Translation Layer. It runs it. A reader routes an unfolding incident themselves, has the result graded by two systems that pull against each other, tries to push a causal conclusion outward through the one-way valve, and calibrates a telemetry tripwire against a simulated quarter of traffic.

---

## Local development

```bash
pnpm install
pnpm dev
```

Requires **pnpm** and **Node 24**. There is no backend, no database, no API key and no environment variable: the site is entirely static and every interactive computes in the browser.

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server with HMR |
| `pnpm build` | Typecheck, then production build to `dist/` |
| `pnpm preview` | Serve the production build |
| `pnpm typecheck` | TypeScript, strict, no emit |
| `pnpm check` | All four content-integrity suites (below) |
| `pnpm og` | Regenerate `public/og.png` and `public/favicon.svg` |

---

## Editing the content

**All prose, case data, artifact text, rules and thresholds live in `src/content/`. Nothing substantive lives in a component.** An author can rewrite any sentence on the site without opening a `.tsx` file.

| File | Section |
|---|---|
| `site.ts` | Metadata, citation, disclaimer, the About block, section register |
| `hero.ts` | 00 · The memo, and the double-read incident record |
| `pincer.ts` | 01 · The two forces |
| `timeline.ts` | 01 · Reclassification entries and the 9 December 2026 countdown |
| `signal.ts` | 02 · Translation loss, normalization of deviance, the decision to record |
| `artifacts.ts` | 03 · The fifteen-artifact deck and the per-artifact privilege rulings |
| `grading.ts` | 03 · Discovery outcomes, flags, the four strategies |
| `channels.ts` | 04 · Nodes, objects, arrows and every valve rule |
| `thresholds.ts` | 05 · The seven bands, the recommended shape, the defensibility bands |
| `regimes.ts` | 06 · The four comparative regimes and the target row |
| `statute.ts` | 07 · The four statutory principles and the four protections |
| `linter-rules.ts` | 08 · Linter categories, phrases, substitutes, the ticket template |
| `checklist.ts` | 08 · The printable implementation checklist |

### Content integrity rules

These are not stylistic preferences. They are the conditions under which the site can be linked from the paper.

1. **Every factual claim, case name, statute citation, date, figure and quotation traces to the paper.** Do not add facts from elsewhere, do not update case law, do not invent statistics.
2. **Anything the paper does not supply is marked on the screen that shows it**, not in a footnote. Three provenance marks exist for this, rendered by `src/components/Provenance.tsx`:
   - `simulated` — synthetic data written for this page (the incident, the artifact deck, the event stream)
   - `illustrative` — a numeric value the paper does not give (every threshold band value)
   - `paper` — traceable to the source, with a section reference
3. **Privilege defensibility is a qualitative band, never a percentage.** The paper supports no number here.
4. The paper's disclaimer appears verbatim in substance: nothing here is legal advice.

### The verification suites

Four scripts assert that the interactives still make the arguments they were built to make. They run against the content files, so a copy edit that quietly breaks an argument fails loudly instead of shipping.

```bash
pnpm check
```

- **`check-grading`** — routing everything through counsel must still be pierced more often than withheld; writing nothing must still produce the auto-captured telemetry, still lose the human record, and still raise a spoliation risk; the three-channel routing must still reach 7/7 remediation with no failed privilege claim.
- **`check-valve`** — at least four distinct illegal flows refused with a stated doctrinal reason (there are thirteen), every permitted flow the paper names actually permitted, nothing able to overwrite the pre-remediation state, and no causal or fault work able to escape Channel Two by any route.
- **`check-tripwire`** — collapsing the logging tier must visibly destroy near-miss capture without changing how often counsel is engaged; bands at maximum must miss real signals; the recommended shape must read as pre-committed.
- **`check-linter`** — all five categories exercised by the example, segments reconstruct the input exactly, word boundaries respected, and measurement-language text returns clean.

---

## Architecture

```
src/
  content/      All prose and data. Edit here.
  components/   Seam, Scaffold, ArguesBlock, SectionHead, Provenance, Deferred
  modules/      One directory per section
  lib/          grade.ts, valve.ts, tripwire.ts, lint.ts, prng.ts, countdown.ts
  styles/       tokens.css, base.css, seam.css, components.css, print.css
scripts/        Verification suites, screenshot tooling, OG renderer
docs/           reference-audit.md, design-plan.md
```

**Design.** Two incompatible document systems sharing one surface. The page ground is always the engineering console; the legal register appears only as bounded, stamped **document objects** sitting on it, which is the paper's own power relationship — facts are the substrate, legal judgment is a bounded space carved out of it. The signature element is **the seam**, which is not a divider but the one-way valve, and it appears only where a boundary genuinely exists in the argument. The full design plan and its self-critique are in [`docs/design-plan.md`](docs/design-plan.md).

**Colour.** Six source values in `src/styles/tokens.css`, each taken from a physical artifact in the paper's subject. **No raw hex value appears anywhere else in the project** — the OG card and the favicon are generated by reading the token file at build time for exactly this reason. Every derived step uses `color-mix()`. The contrast figures in the comments are worst-case across every surface a colour sits on, measured with axe-core rather than estimated.

**Type.** IBM Plex Mono and IBM Plex Sans for the console register, Spectral for the legal one. Self-hosted from `public/fonts` with only two weights preloaded — one per side of the seam in the hero. To refresh the faces, copy them out of the `@fontsource` devDependencies and keep the filenames.

**Routing.** Two entry points, `/` and `/linter`, resolved by a pathname switch in `src/main.tsx` rather than a routing library. Both deploy configs rewrite unknown paths to `index.html`.

**Code splitting.** Sections 02 to 08 are separate chunks, mounted by `src/components/Deferred.tsx` as the reader approaches them, or immediately if they arrived at that section's anchor. Initial JS is about 80 kB gzipped.

---

## Accessibility and performance

Measured against the production build, not the dev server.

| Route | Profile | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|---|
| `/` | desktop | 100 | 100 | 100 | 100 |
| `/` | mobile | 99 | 100 | 100 | 100 |
| `/linter` | desktop | 100 | 100 | 100 | 100 |
| `/linter` | mobile | 98 | 100 | 100 | 100 |

```bash
pnpm build
pnpm preview &
node scripts/audit-a11y.mjs http://localhost:4173
```

`audit-a11y.mjs` forces every deferred section to mount and drives each interactive into a used state before scanning, because an untouched instrument hides most of its own markup. It currently reports **no axe-core violations** across WCAG 2.0/2.1 A and AA plus best-practice rules.

Every interactive is fully keyboard operable. `prefers-reduced-motion` collapses all durations to 1ms and turns the valve's push-back into an immediate state change with the reason text appearing at once — the information is never carried by the animation. Nothing is distinguished by colour alone: the four routing bins, the discovery outcomes, the channel identities and the linter categories all carry a label and a second visual channel.

### Screenshot and print tooling

`scripts/shot.mjs` drives Chrome over the DevTools Protocol because `--headless --window-size` clamps the layout viewport to a 500px minimum, which silently renders narrow breakpoints at the wrong width and then crops them.

```bash
node scripts/shot.mjs <url> <out.png> [w] [h] [--mobile] [--full] [--rm]
                      [--at=<sel>] [--click=<sel>] [--eval=<js>]
                      [--print-media] [--pdf]
```

`--pdf` renders through the print stylesheet and reports the page count, which is how "the checklist prints to one page" is verified rather than assumed. `--print-media` applies the print rules to the live layout so they can be measured.

---

## Deployment

Fully static. Both configs are committed and either will work unchanged.

- **Vercel** — `vercel.json`. Framework preset `vite`, output `dist`, SPA rewrites that exclude `assets/`, `fonts/`, `og.png`, `favicon.svg`, `robots.txt` and `sitemap.xml`.
- **Netlify** — `netlify.toml`. Same publish directory and a catch-all 200 redirect to `index.html`.

Both set immutable caching on hashed assets and fonts, plus `X-Content-Type-Options`, `Referrer-Policy` and `X-Frame-Options`.

Update `meta.canonical` in `src/content/site.ts`, the `og:url` and `twitter` URLs in `index.html`, and the two URLs in `public/robots.txt` and `public/sitemap.xml` if the site lands on a different domain.

---

## About this snapshot

The site is a dated snapshot pinned to the August 2026 paper. The paper describes its own analysis as synchronic, capturing a legal and regulatory landscape moving faster than any single document can track; that applies with more force to a web page. Case law moves, regulations commence, and the countdown on the front page will expire and switch to a "now in force" state on 9 December 2026.

The interactives are illustrative reconstructions. The incident they follow did not happen, the artifacts were written for this page, and the event stream is generated in the browser from a fixed seed. None of it is drawn from any real firm, product or matter.

Nothing on the site is legal advice. Firms should consult counsel before relying on any legal principle described.
