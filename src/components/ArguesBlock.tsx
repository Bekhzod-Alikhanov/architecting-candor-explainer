/**
 * The labelled block that closes each interactive section, stating what the
 * interactive argues. The paper's voice, so it is set as a document object.
 */
export interface ArguesBlockProps {
  readonly label: string
  readonly body: string | readonly string[]
}

export function ArguesBlock({ label, body }: ArguesBlockProps) {
  const paras = typeof body === 'string' ? [body] : body
  return (
    <aside className="argues doc-object doc-object--scanned on-doc">
      <span className="argues__label">{label}</span>
      {paras.map((p) => (
        <p className="argues__body" key={p.slice(0, 28)}>
          {p}
        </p>
      ))}
    </aside>
  )
}
