import { useEffect, useRef, useState } from 'react'

/**
 * Debounces a status sentence for an sr-only `role="status"` region.
 *
 * A continuous input — dragging a range slider, typing a character at a time
 * — changes the underlying value dozens of times a second. Wired straight into
 * a live region, each of those changes queues its own announcement, and a
 * screen reader reads the queue in full long after the reader's hand has
 * stopped. Holding the text until it has been stable for `ms` collapses that
 * queue to the one announcement that matches where the reader actually landed.
 *
 * The initial value is the incoming text itself, and the timer is set only
 * inside an effect, which does not run during the prerender pass — so the
 * server-rendered markup, the first client render, and this hook's state all
 * agree with no timer ever running off the server.
 */
export function useDebouncedStatus(text: string, ms = 300): string {
  const [debounced, setDebounced] = useState(text)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timer.current = setTimeout(() => setDebounced(text), ms)
    return () => {
      if (timer.current !== null) clearTimeout(timer.current)
    }
  }, [text, ms])

  return debounced
}

/** The common case: a status sentence debounced by the standard 300 ms. */
export function useStatus(text: string): string {
  return useDebouncedStatus(text, 300)
}
