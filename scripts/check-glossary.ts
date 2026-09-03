/**
 * check-glossary.ts — asserts the glossary (src/content/glossary.ts) and the
 * matcher it feeds (src/lib/termMatch.ts, src/lib/defineTerms.tsx) stay
 * consistent as either one changes.
 *
 *   pnpm check:glossary
 *
 * Four things a build, a type check or a lint pass would never catch:
 *
 *   - two entries sharing an id, which would make `<Term id>` ambiguous;
 *   - a definition for a term no section's prose ever actually uses — a
 *     glossary entry nobody would ever see opened;
 *   - the matcher wrapping the wrong span, or more than one occurrence of
 *     the same id in one call, so the reconstructed text stops being the
 *     original text;
 *   - a form containing a regex metacharacter (a stray "." or "(") being
 *     matched as regex syntax instead of the literal character it is.
 */

import * as artifacts from '../src/content/artifacts'
import * as channels from '../src/content/channels'
import * as checklist from '../src/content/checklist'
import { glossary, type GlossaryId } from '../src/content/glossary'
import * as grading from '../src/content/grading'
import * as hero from '../src/content/hero'
import * as linterRules from '../src/content/linter-rules'
import * as orientation from '../src/content/orientation'
import * as pincer from '../src/content/pincer'
import * as regimes from '../src/content/regimes'
import * as signal from '../src/content/signal'
import * as site from '../src/content/site'
import * as statute from '../src/content/statute'
import * as thresholds from '../src/content/thresholds'
import * as timeline from '../src/content/timeline'
import * as ui from '../src/content/ui'
import { escapeForRegex, findTerm } from '../src/lib/termMatch'
import { walkStrings } from './lib/prose'

const failures: string[] = []
const check = (ok: boolean, msg: string) => {
  if (!ok) failures.push(msg)
}

// --- ids must be unique -----------------------------------------------------

const ids = glossary.map((entry) => entry.id)
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
check(new Set(ids).size === ids.length, `Duplicate glossary id(s): ${dupes.join(', ')}.`)

// --- no orphan definitions ---------------------------------------------------
//
// Every module in src/content/*.ts EXCEPT glossary.ts itself, walked with the
// same walkStrings that scripts/read-aloud.ts and check-reading-time.ts use.
// glossary.ts is deliberately excluded: a form's own entry in its `forms`
// array is not an occurrence in the page's prose, and counting it would let
// a definition nothing on the page ever opens pass as if it were used.

const CONTENT_MODULES: Record<string, Record<string, unknown>> = {
  artifacts,
  channels,
  checklist,
  grading,
  hero,
  'linter-rules': linterRules,
  orientation,
  pincer,
  regimes,
  signal,
  site,
  statute,
  thresholds,
  timeline,
  ui,
}

const allStrings: string[] = []
for (const mod of Object.values(CONTENT_MODULES)) {
  for (const [k, v] of Object.entries(mod)) {
    if (typeof v === 'function') continue
    walkStrings(v, k, 0, (_key, value) => allStrings.push(value))
  }
}
// One haystack, not per-string matching, so a form that is only recognisable
// once two adjacent strings are read together is not falsely called an
// orphan.
const haystack = allStrings.join('\n')

for (const entry of glossary) {
  for (const form of entry.forms) {
    const re = new RegExp(`\\b${escapeForRegex(form)}\\b`, 'i')
    check(
      re.test(haystack),
      `Glossary entry "${entry.id}" has a form ("${form}") that appears nowhere in ` +
        'src/content/*.ts — an orphan definition nothing on the page would ever open.',
    )
  }
}

// --- the matcher itself ------------------------------------------------------

const ALL_IDS: readonly GlossaryId[] = glossary.map((e) => e.id)

for (const entry of glossary) {
  for (const form of entry.forms) {
    const text = `Some prose mentions ${form} in passing, then moves on.`
    const found = findTerm(text, ALL_IDS, new Set())
    check(
      found !== null,
      `findTerm found no match for "${entry.id}"'s form "${form}" in "${text}".`,
    )
    if (!found) continue

    check(
      found.id === entry.id,
      `findTerm matched form "${form}" to id "${found.id}", expected "${entry.id}".`,
    )
    check(
      found.before + found.match + found.after === text,
      `findTerm's before/match/after did not reconstruct the original text for form "${form}".`,
    )
    check(
      found.match.toLowerCase() === form.toLowerCase(),
      `findTerm's match ("${found.match}") did not equal the form it matched ("${form}").`,
    )
  }
}

// A second mention of an id already in `seen` must not be matched, however
// many of its forms are present.
{
  const entry = glossary.find((e) => e.forms.length > 0)!
  const [form] = entry.forms
  const text = `First mention of ${form}. Second mention of ${form} right here.`
  const seen = new Set<GlossaryId>([entry.id])
  check(
    findTerm(text, ALL_IDS, seen) === null,
    `findTerm matched an id already in "seen" ("${entry.id}") — a term already opened once ` +
      'in a section would be opened again on its second mention.',
  )
}

// Two forms of the same id starting at the same position — the longer,
// more specific one must win, or the button wraps only the shorter prefix.
{
  const entry = glossary.find((e) => e.id === 'privilege')!
  const text = 'The firm relies on privileged channel routing for this.'
  const found = findTerm(text, ALL_IDS, new Set())
  check(found !== null, 'findTerm found no match for the "privileged channel" tie-break case.')
  check(
    found?.match.toLowerCase() === 'privileged channel',
    `Expected the longer form "privileged channel" to win the tie, got "${found?.match}".`,
  )
  check(
    entry.id === found?.id,
    `Expected the "privileged channel" match to resolve to id "privilege", got "${found?.id}".`,
  )
}

// A full defineTerms-style pass over one paragraph mentioning several terms
// must reconstruct the original text exactly and open each id only once.
{
  const text =
    'Attorney-client privilege protects the advice, not the underlying facts subject to discovery. ' +
    'Work product is different: it protects material prepared because litigation is anticipated. ' +
    'A near miss is not the same as a near-miss report filed twice.'
  const seen = new Set<GlossaryId>()
  const opened: GlossaryId[] = []
  let remaining = text
  let rebuilt = ''
  let guard = 0
  for (;;) {
    guard += 1
    check(guard < 50, 'defineTerms-style loop did not terminate — check for an infinite loop.')
    if (guard >= 50) break
    const found = findTerm(remaining, ALL_IDS, seen)
    if (!found) {
      rebuilt += remaining
      break
    }
    rebuilt += found.before + found.match
    seen.add(found.id)
    opened.push(found.id)
    remaining = found.after
  }
  check(rebuilt === text, 'The reconstructed paragraph does not equal the original text.')
  check(
    opened.length === new Set(opened).size,
    `The same id was opened more than once in one pass: ${opened.join(', ')}.`,
  )
  check(
    opened.includes('privilege') && opened.includes('work-product') && opened.includes('near-miss'),
    `Expected privilege, work-product and near-miss to all be found, got: ${opened.join(', ')}.`,
  )
}

// --- metacharacters in a form are escaped, not read as regex syntax --------
//
// findTerm's own forms all come from glossary.ts, none of which contain a
// metacharacter today — so this exercises the escaping helper directly with
// a synthetic one, the way the brief asks.
{
  const literal = 'a.b'
  const re = new RegExp(`\\b${escapeForRegex(literal)}\\b`, 'i')
  check(re.test('the value a.b appears here'), 'Escaped form failed to match its own literal text.')
  check(
    !re.test('the value axb appears here'),
    'An unescaped "." in a form matched "x" as a wildcard — metacharacters are not being escaped.',
  )
}

if (failures.length) {
  console.error('\nFAILED:')
  for (const f of failures) console.error(`  · ${f}`)
  process.exit(1)
}
console.log(
  `\n${glossary.length} glossary entries, ${ids.length} ids, no orphans, matcher checks out.\n`,
)
