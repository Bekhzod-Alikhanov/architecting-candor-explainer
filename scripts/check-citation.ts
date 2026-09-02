/**
 * check-citation.ts — asserts the generated BibTeX entry and the APA citation
 * string in src/content/site.ts stay correct as the paper's metadata changes.
 *
 *   pnpm check:citation
 *
 * A malformed BibTeX entry (an unbalanced brace, an embedded newline, an
 * author dropped or reordered) is not something a build, a type check or a
 * lint pass would ever catch — it is a string that looks fine until someone
 * pastes it into a reference manager. This is the check that would.
 */

import { paper } from '../src/content/site'
import { bibtex } from '../src/lib/citation'

const failures: string[] = []
const check = (ok: boolean, msg: string) => {
  if (!ok) failures.push(msg)
}

const entry = bibtex(paper)
console.log('\nGenerated BibTeX')
console.log('─'.repeat(78))
console.log(entry)
console.log('─'.repeat(78))

// --- structural sanity: this has to be a well-formed BibTeX entry ----------

check(entry.startsWith('@techreport{'), 'The entry must open as an @techreport.')
check(entry.trimEnd().endsWith('}'), 'The entry must close with a brace.')

const opens = entry.split('{').length - 1
const closes = entry.split('}').length - 1
check(
  opens === closes,
  `Unbalanced braces: ${opens} "{" vs ${closes} "}". An unbalanced entry breaks every ` +
    'downstream BibTeX/biblatex parser.',
)

// The raw fields that feed the entry must not themselves carry a brace or a
// newline: field() wraps each one in a single outer {…}, so a brace inside
// the value would unbalance that pair, and a newline would split one field
// across two BibTeX lines.
const rawFields: [string, string][] = [
  ['paper.title', paper.title],
  ['paper.publisher', paper.publisher],
  ['paper.copublisher', paper.copublisher],
  ['paper.doi', paper.doi],
  ['paper.doiUrl', paper.doiUrl],
  ...paper.authors.flatMap((a): [string, string][] => [
    [`author ${a.name}.given`, a.given],
    [`author ${a.name}.family`, a.family],
  ]),
]
for (const [label, value] of rawFields) {
  check(!/[{}]/.test(value), `${label} contains a literal brace: "${value}".`)
  check(!/[\r\n]/.test(value), `${label} contains a newline: "${value}".`)
}

// --- the six authors, in paper order ----------------------------------------

check(paper.authors.length === 6, `The paper lists ${paper.authors.length} authors, expected 6.`)

const authorMatch = entry.match(/author = \{([^}]*)\}/)
check(authorMatch !== null, 'No author field found in the generated entry.')
const bibAuthors = (authorMatch?.[1] ?? '').split(' and ').map((s) => s.trim())

check(
  bibAuthors.length === paper.authors.length,
  `BibTeX lists ${bibAuthors.length} authors, the paper lists ${paper.authors.length}.`,
)
paper.authors.forEach((a, i) => {
  const expected = `${a.family}, ${a.given}`
  check(
    bibAuthors[i] === expected,
    `Author ${i + 1} should read "${expected}" in paper order, got "${bibAuthors[i]}".`,
  )
})

// --- the DOI, in both the BibTeX entry and the APA string -------------------

check(paper.doi.length > 0, 'paper.doi is empty.')
check(entry.includes(`doi = {${paper.doi}}`), 'The generated entry is missing the doi field.')
check(entry.includes(`url = {${paper.doiUrl}}`), 'The generated entry is missing the url field.')

check(
  paper.citation.includes(paper.doiUrl),
  'The APA citation string (paper.citation) does not end at the DOI URL — ' +
    'a reader following the citation would not land on the paper.',
)

// --- the BibTeX key --------------------------------------------------------

const [firstAuthor] = paper.authors
const [year] = paper.datePublished.split('-')
const expectedKey = `${firstAuthor?.family.toLowerCase()}${year}architecting`
check(
  entry.startsWith(`@techreport{${expectedKey},`),
  `Expected the key "${expectedKey}", derived from the first author and the publication year.`,
)

console.log(`\n${paper.authors.length} authors · DOI ${paper.doi} · key ${expectedKey}`)

if (failures.length) {
  console.error('\nFAILED:')
  for (const f of failures) console.error(`  · ${f}`)
  process.exit(1)
}
console.log('The BibTeX entry and the APA citation both check out.\n')
