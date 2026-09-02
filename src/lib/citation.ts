import type { Author } from '../content/site'

/** The subset of `paper` (src/content/site.ts) a citation is built from. */
export interface CitationSource {
  readonly title: string
  readonly authors: readonly Author[]
  readonly datePublished: string
  readonly publisher: string
  readonly copublisher: string
  readonly doi: string
  readonly doiUrl: string
}

const MONTHS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const

/**
 * A BibTeX field value. Braces and newlines are load-bearing to BibTeX's own
 * grammar, so a field containing either is rejected by
 * scripts/check-citation.ts rather than silently escaped here — the paper's
 * fields are prose written for this page and should never need either
 * character; if one ever does, the generator needs a real decision about how
 * to escape it, not a guess.
 */
function field(value: string): string {
  return `{${value}}`
}

/**
 * A BibTeX entry for the paper. `@techreport` rather than `@misc`: the paper
 * is a numbered report from an institution (the taskforce), not an
 * unpublished note, and `@techreport`'s `institution` field is what lets
 * BibTeX/biblatex and reference managers render that relationship correctly.
 * `@misc` would drop the publisher onto an `institution`-less entry that most
 * styles then omit.
 *
 * The key follows `<first author><year>architecting` — short, stable, and
 * distinctive to this paper — matching the shape the brief specifies.
 */
export function bibtex(paper: CitationSource): string {
  const [first] = paper.authors
  const [year, month] = paper.datePublished.split('-')
  const monthName = MONTHS[Number(month) - 1]
  if (!first || !year || !monthName) {
    throw new Error('bibtex(): paper is missing an author, year or month.')
  }

  const key = `${first.family.toLowerCase()}${year}architecting`
  const authorField = paper.authors.map((a) => `${a.family}, ${a.given}`).join(' and ')

  const lines = [
    `@techreport{${key},`,
    `  author = ${field(authorField)},`,
    `  title = ${field(paper.title)},`,
    `  institution = ${field(paper.publisher)},`,
    `  year = ${field(year)},`,
    `  month = ${monthName},`,
    `  doi = ${field(paper.doi)},`,
    `  url = ${field(paper.doiUrl)},`,
    `  note = ${field(`Co-published by ${paper.copublisher}`)},`,
    '}',
  ]
  return lines.join('\n')
}
