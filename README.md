# Architecting Candor — interactive explainer

### **[architecting-candor.vercel.app →](https://architecting-candor.vercel.app)**

Companion site to *Architecting Candor: Products Liability and AI Incident Knowledge Governance* (Celone, McGregor, Secret, Mignot, Bregman & Alikhanov; Arcadia Impact AI Governance Taskforce, August 2026).

![One incident record shown twice: as a line of engineering telemetry and as a stamped discovery exhibit, divided by a vertical seam.](public/og.png)

The paper argues that AI firms are caught in a **documentation paradox**. Regulation and fiduciary duty compel them to write safety incidents down; American civil discovery lets plaintiffs compel production of exactly those documents. The result is that the knowledge which would make systems safer is systematically not recorded.

Its answer is a **mechanism** — a three-channel Safety Translation Layer. So this site does not explain the mechanism. It runs it.

---

## What you can actually do here

| | |
|---|---|
| **Route an incident** | Fifteen artifacts from an unfolding incident, four channels to put them in — including *Do not write it down*, the strategy most readers arrive believing in. Two scoreboards grade the result and pull against each other: what a plaintiff can get, and what an engineer can still fix. Every privilege outcome names the authority it rests on. |
| **Operate the valve** | Push a causal conclusion outward through the one-way valve and watch it refuse, with the doctrinal reason stated. Thirteen distinct refusals; every flow the paper permits actually works. |
| **Calibrate a tripwire** | Seven threshold bands against a seeded quarter of synthetic traffic. Collapse the logging tier and watch near-miss capture collapse with it while escalations hold steady — the move a regime designed under legal fear makes first. |
| **Lint a real ticket** | Paste your own incident ticket. Five categories of phrasing that would read as the firm's own findings, each with a measurement-form substitute. Runs entirely in your browser — [`/linter`](https://architecting-candor.vercel.app/linter) is shareable on its own. |
| **Print the checklist** | §08 prints to exactly one page, so it can go to a general counsel on paper. |

Ten numbered sections. Above 82rem a rail marks where you are; below that the same list opens from a control in the corner.

---

## The discipline this repository is really about

The site can only be linked from the paper if every claim on it survives scrutiny. Two mechanisms enforce that, and both are the interesting part of this codebase.

### 1. Content integrity

1. **Every factual claim, case name, statute citation, date, figure and quotation traces to the paper.** No facts from elsewhere, no updated case law, no invented statistics.
2. **Anything the paper does not supply is marked on the screen that shows it**, never in a footnote. Three provenance marks, rendered by [`src/components/Provenance.tsx`](src/components/Provenance.tsx):
   - `simulated` — synthetic data written for this page (the incident, the artifact deck, the event stream)
   - `illustrative` — a value the paper does not give (every threshold band)
   - `paper` — traceable to the source, with a section reference
3. **Privilege defensibility is a qualitative band, never a percentage.** The paper supports no number there.
4. Nothing on the site is legal advice, and it says so.

### 2. Suites that fail when an argument breaks

Four scripts assert the interactives still make the arguments they were built to make. They run against the content files, so a copy edit that quietly guts a claim fails loudly instead of shipping.

```bash
pnpm check
```

- **`check-grading`** — routing everything through counsel must still be pierced more often than withheld; writing nothing must still produce the auto-captured telemetry, still lose the human record, and still raise a spoliation risk; the three-channel routing must still reach 7/7 remediation with no failed privilege claim.
- **`check-valve`** — at least four distinct illegal flows refused with a stated doctrinal reason (there are thirteen), every permitted flow actually permitted, nothing able to overwrite the pre-remediation state, and no causal or fault work able to escape Channel Two by any route.
- **`check-tripwire`** — collapsing the logging tier must visibly destroy near-miss capture without changing how often counsel is engaged; bands at maximum must miss real signals; the recommended shape must read as pre-committed.
- **`check-linter`** — all five categories exercised by the example, segments reconstruct the input exactly, word boundaries respected, measurement-language text returns clean.

---

## Local development

```bash
pnpm install
pnpm dev
```

Requires **pnpm** and **Node 24**. No backend, no database, no API key, no environment variable — the site is entirely static and every interactive computes in the browser.

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server with HMR |
| `pnpm build` | Typecheck, then production build to `dist/` |
| `pnpm preview` | Serve the production build |
| `pnpm typecheck` | TypeScript, strict, no emit |
| `pnpm lint` | Biome — lint and format check |
| `pnpm check` | The four content-integrity suites above |
| `pnpm read:aloud` | Every user-facing string as one document, for the tone check |
| `pnpm og` | Regenerate `public/og.png`, `public/favicon.svg`, the PNG icon set and `public/site.webmanifest` from the token layer |

These three drive a real headless browser, so they need the production build already being served — run `pnpm build && pnpm preview` in another shell first. They are deliberately **not** part of `pnpm check`, which stays server-free.

| Command | What it does |
|---|---|
| `pnpm check:lighthouse` | Performance and accessibility, gated at 95, on mobile **and** desktop |
| `pnpm check:keyboard` | Drives all 22 interactives with real key events, at 1440 and again at 390 |
| `pnpm audit:a11y` | axe-core over every section, with all deferred content force-mounted |

**Continuous integration.** `pnpm lint`, `pnpm typecheck`, `pnpm check` and `pnpm build` run automatically in GitHub Actions on every push to `main` and every pull request (`.github/workflows/ci.yml`). Browser-driven checks — keyboard operability, axe-core accessibility audits on both routes, and Lighthouse performance and accessibility gated at 0.90 — run in a second job against `pnpm preview` of the built artifact. Vercel's own GitHub integration posts preview URLs on pull requests; enable "Comments on Pull Requests" in the Vercel project's Git settings to see them.

---

## Editing the content

**All prose, case data, artifact text, rules and thresholds live in [`src/content/`](src/content). Nothing substantive lives in a component.** An author can rewrite any sentence on the site without opening a `.tsx` file. Grepping the components for a capitalised English phrase returns nothing, and that is the intended state.

That includes strings a reader never sees. The accessible names — what a screen reader speaks for the seam, the sliders, the two charts and every control in Route the Record — live in the `a11y` block of `src/content/ui.ts` as functions taking their interpolations. They are prose someone hears, so they go through `pnpm read:aloud` with everything else instead of hiding in a template literal.

| File | Section |
|---|---|
| `site.ts` | Metadata, citation, disclaimer, the About block, the section register |
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
| `ui.ts` | Cross-cutting interface copy and every accessible name |

---

## Architecture

```
src/
  content/      All prose and data. Edit here.
  components/   Seam, Scaffold, ArguesBlock, SectionHead, SectionNav,
                Provenance, Deferred
  modules/      One directory per section
  lib/          grade.ts, valve.ts, tripwire.ts, lint.ts, prng.ts, countdown.ts
  styles/       reset.css, tokens.css, base.css, seam.css, components.css,
                print.css, notfound.css
scripts/        Verification suites, Lighthouse gate, screenshot tooling, OG renderer
docs/           reference-audit.md, design-plan.md
404.html        A real error page, built as a second Vite entry
```

**Design.** Two incompatible document systems sharing one surface. The page ground is always the engineering console; the legal register appears only as bounded, stamped **document objects** sitting on it — which is the paper's own power relationship, facts as the substrate and legal judgment as a space carved out of it. The signature element is **the seam**, not a divider but the one-way valve, and it appears only where a boundary genuinely exists in the argument. The full design plan, its self-critique, and the later widescreen revision are in [`docs/design-plan.md`](docs/design-plan.md).

**Colour.** Six source values in `src/styles/tokens.css`, each taken from a physical artifact in the paper's subject, expressed in OKLCH and mixed in OKLab. **No raw hex appears anywhere else in the project, except `src/styles/color-fallbacks.css`** — the build-time `color-mix()` fallback for Safari 15.4–16.1 (see that file's header and `scripts/color-fallbacks.mjs`). The OG card and favicon are generated by reading the token file at build time for the same reason. Contrast figures in the comments are worst-case across every surface a colour sits on, computed and then confirmed with axe-core rather than estimated.

**Type.** IBM Plex Mono and IBM Plex Sans for the console register, Spectral for the legal one. Self-hosted from `public/fonts` with two weights preloaded — one per side of the seam in the hero. To refresh the faces, copy them out of the `@fontsource` devDependencies and keep the filenames.

**Cascade layers.** `app-reset → app-tokens → app-base → app-components → app-modules → app-print`, declared in `src/index.css`. Module stylesheets are imported from their components, so the bundler injects them in module-graph order; layers make the outcome independent of that, which is what lets the print stylesheet win without a single `!important`.

**The reset.** `src/styles/reset.css` is Tailwind v4's `preflight.css`, vendored verbatim under the MIT licence and edited only where it looked up Tailwind's own theme, which now reads `--font-sans` and `--font-mono` straight from the token layer. Tailwind itself is gone: it generated no utility class this markup uses, and `build.cssCodeSplit: false` merges both entry stylesheets into the one sheet that serves `/`, `/linter` and `404.html`, so its preflight was being paid for twice for nothing in return. The reset stays because the layout leans on it — zeroed margins, `border: 0 solid`, headings and form controls that inherit, block-level replaced elements — and `app-reset` puts it below every author rule, which is where Tailwind's `@layer base` had it. Biome does not format `reset.css`; it is upstream's text. `scripts/diff-computed.mjs` is how the swap was checked: it walks every element of all three pages at 390 and 1440 in two builds and compares 37 computed properties each.

**Routing.** Two entry points, `/` and `/linter`, resolved by a pathname switch in `src/main.tsx` rather than a routing library. Both deploy configs rewrite **only** `/linter` to the SPA shell; anything else falls through to a real 404. `/linter` sets its own canonical, title and description on mount, because both routes are served from the same `index.html` and the sitemap lists them separately.

**The explainer video.** A 9½-minute video sits in §00 as the first "way in"
(a text link in §09 points back up to it), self-hosted so that watching it sends
no request to anyone but this domain — the same reason the linter runs in your
browser. `preload="none"` and a 22 kB poster mean nothing is fetched until you
press play; verified as zero bytes on load.

The 87 MB file **is committed** for now. It was briefly kept out of git and
shipped with the deployment upload instead, which broke as soon as it met
reality: the Vercel GitHub integration rebuilds production from the repository
on every push, so a push produced a site where the video existed but nothing on
the page linked to it. `.vercelignore` still exists and is worth knowing about:
without it the Vercel CLI falls back to `.gitignore`.

*Moving the video off git.* `explainer.src` in `src/content/site.ts` may be an
absolute URL; everything that depends on it (`downloadUrl`, the on-screen
hosting note) derives from that one value, and both host configs already allow
`https://*.public.blob.vercel-storage.com` in `media-src`. The steps:

1. Check the file starts with its index (`ffprobe -show_format` should show
   `moov` before `mdat`; if not, `ffmpeg -i in.mp4 -c copy -movflags +faststart out.mp4`).
2. `vercel blob put public/video/architecting-candor-explainer.mp4 --access public --content-type video/mp4 --cache-control-max-age 31536000`
   (`--access public` is required; the CSP only allows the public Blob host)
   and paste the returned URL into `explainer.src`.
3. `pnpm build`; the "Download the file" link becomes `?download=1` automatically.
4. Optionally shrink the repository: `git filter-repo --invert-paths --path public/video/architecting-candor-explainer.mp4 --force`,
   force-push, everyone re-clones (`.git` drops from about 90 MB to about 1 MB),
   and add `public/video/*.mp4` to `.gitignore`.

*Captions.* The video has **no caption track yet**, the site's one known
accessibility gap; axe reports it as *incomplete* because it cannot verify
captions programmatically. A fabricated or empty track would be worse than none,
so the pipeline ships unfilled: `src/content/transcript.ts` holds the cues
(draft them with Whisper from the mp4, then an author pass — one sentence per
cue, at most 84 characters), `pnpm vtt` writes
`public/video/architecting-candor-explainer.en.vtt`, and `pnpm check:vtt` keeps
the two in step. As soon as `cues` is non-empty the player gains a
`<track kind="captions">` and a transcript disclosure appears under it.

**Code splitting.** Sections 02 to 07 are separate chunks, mounted by `src/components/Deferred.tsx` as the reader approaches, or immediately if they arrived at that section's anchor. §08 is deliberately eager so the checklist is printable from anywhere. Initial JS is about 100 kB gzipped across 4 chunks — react 59.8 kB, main 30.5 kB, d3 9.4 kB, modulepreload-polyfill 0.4 kB — plus 19.3 kB gzipped CSS.

---

## Accessibility and performance

Measured against the **live production build**, three sampled runs per mobile figure.

| Route | Profile | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|---|
| `/` | desktop | 100 | 100 | 100 | 100 |
| `/` | mobile | 99 | 100 | 100 | 100 |
| `/linter` | desktop | 100 | 100 | 100 | 100 |
| `/linter` | mobile | 99 | 100 | 100 | 100 |

`check-keyboard.mjs` drives all **22 interactives** with genuine key events dispatched through the DevTools Protocol — not synthesised React events — and asserts each instrument's own state actually changed. It mounts every deferred section first, then re-emulates a 390px viewport to reach the controls that only exist there.

`audit-a11y.mjs` forces every deferred section to mount and drives each interactive into a used state before scanning, because an untouched instrument hides most of its own markup. It reports **no axe-core violations** across WCAG 2.0/2.1 A and AA plus best-practice rules, and prints axe's *incomplete* results too — those are where a contrast fault can hide, since axe abandons the rule wherever it cannot flatten a background.

Every interactive is fully keyboard operable. `prefers-reduced-motion` collapses all durations to 1 ms and turns the valve's push-back into an immediate state change with the reason appearing at once — information is never carried by animation alone. Nothing is distinguished by colour alone: the four routing bins, the discovery outcomes, the channel identities and the linter categories each carry a label and a second visual channel.

### Screenshot and print tooling

`scripts/shot.mjs` drives Chrome over the DevTools Protocol because `--headless --window-size` clamps the layout viewport to a 500 px minimum, which silently renders narrow breakpoints at the wrong width and then crops them.

```bash
node scripts/shot.mjs <url> <out.png> [w] [h] [--mobile] [--full] [--rm]
                      [--at=<sel>] [--click=<sel>] [--eval=<js>]
                      [--print-media] [--pdf]
```

`--pdf` renders through the print stylesheet and reports the page count, which is how *"the checklist prints to one page"* is verified rather than assumed. `--print-media` applies the print rules to the live layout so they can be measured.

`scripts/diff-computed.mjs` answers the other question — whether a change to the CSS *plumbing* changed anything a reader sees. Serve two builds and it walks both documents element by element at 390 and 1440, comparing 37 computed properties on each of the three pages, so a moved border colour is named rather than lost in a screenshot threshold.

```bash
pnpm exec vite preview --outDir <old-dist> --port 4174
pnpm exec vite preview --port 4173
node scripts/diff-computed.mjs http://localhost:4174 http://localhost:4173
```

---

## Deployment

Fully static. Both configs are committed and either works unchanged.

- **Vercel** — `vercel.json`. Framework preset `vite`, output `dist`, rewrites for `/linter` only.
- **Netlify** — `netlify.toml`. Same publish directory, the same `/linter` rewrite, and a catch-all to `404.html` with a real 404 status.

Both set immutable caching on hashed assets and fonts, plus `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, a `Permissions-Policy` that locks down the sensor/media APIs the page never uses, and a strict `Content-Security-Policy` (`default-src 'none'`, same-origin only for scripts, styles, fonts, media and connections). The site loads no third-party resources and has no inline scripts, so the policy costs nothing here — and it makes the linter's claim that "the page makes no network requests after it loads" enforceable by the browser rather than just true by inspection. `vite.config.ts` reads the same headers out of `vercel.json` for `pnpm preview`, so local runs see the identical policy.

If the site moves to a different domain, update `meta.canonical` and `meta.linterCanonical` in `src/content/site.ts`, the `og:url` and `twitter` URLs in `index.html`, and the URLs in `public/robots.txt` and `public/sitemap.xml`.

**Structured data and citation metadata.** Both routes carry a JSON-LD `@graph` — a `WebSite`, the paper's own `ScholarlyArticle` (all six authors, the DOI as `identifier`), and a `WebPage` (`/linter` adds a `WebApplication`) — plus Highwire `citation_*` tags, generated in `scripts/prerender.mjs`'s `buildHead()` from the same `src/content/site.ts` fields the rest of the head is built from, never hand-written. The `citation_*` tags exist for Zotero and Mendeley's one-click capture on this companion page; Google Scholar indexes the paper's own record at `citation_abstract_html_url`, not this site. `pnpm og` also rasterises `public/favicon.svg` into the icon set `public/icons/` and writes `public/site.webmanifest`, and rewrites the one literal hex value in `index.html`'s `theme-color` meta from the same token — so that value, like the OG card and favicon, never drifts from `src/styles/tokens.css` by hand. `scripts/check-dist.mjs` asserts the JSON-LD parses and carries the right author count and DOI, that the citation and icon/manifest tags are present, and that every icon `site.webmanifest` names actually exists in `dist/icons/`.

---

## About this snapshot

The site is a dated snapshot pinned to the August 2026 paper. The paper describes its own analysis as synchronic, capturing a legal and regulatory landscape moving faster than any single document can track; that applies with more force to a web page. Case law moves, regulations commence, and the countdown on the front page will expire and switch to a "now in force" state on 9 December 2026.

The interactives are illustrative reconstructions. The incident they follow did not happen, the artifacts were written for this page, and the event stream is generated in the browser from a fixed seed. None of it is drawn from any real firm, product or matter.

Nothing on the site is legal advice. Firms should consult counsel before relying on any legal principle described.

---

## Licence

Two licences, because this repository holds two different things.

| What | Licence |
|---|---|
| Software — components, modules, `lib/`, `styles/`, `scripts/`, build config | [MIT](LICENSE) |
| Written content — everything in `src/content/`, `docs/` and this README | [CC BY 4.0](LICENSE-CONTENT.md) |

Reusing the content? Credit the paper rather than this site — the citation is in [LICENSE-CONTENT.md](LICENSE-CONTENT.md).

Neither licence covers *Architecting Candor* itself. This is a companion to the paper, not a copy of it; the paper is published separately and carries its own terms. And no licence grant makes any of this legal advice.
