import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Copy-to-clipboard with a label swap that reverts on its own.
 *
 * Calibrate's share button, the Cite-as block's two copy buttons and every
 * section head's "Copy link" button all want the same shape: write to the
 * clipboard, flip a boolean for a couple of seconds, and fail quietly if the
 * browser refuses — the fallback is that the correct text is already on
 * screen (the address bar, or the citation itself) for the reader to select
 * by hand. Extracted here so that timing lives in one place instead of four.
 */
export function useCopy(revertAfterMs = 2000) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clear = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        // Clipboard access can be refused (permissions, insecure context).
        // The caller's own fallback text stays on screen either way.
        setCopied(false)
        return
      }
      setCopied(true)
      clear()
      timer.current = setTimeout(() => setCopied(false), revertAfterMs)
    },
    [clear, revertAfterMs],
  )

  // A settings change elsewhere (Calibrate's URL sync) can invalidate an
  // in-flight "copied" state before its timer fires.
  const reset = useCallback(() => {
    clear()
    setCopied(false)
  }, [clear])

  useEffect(() => clear, [clear])

  return { copied, copy, reset }
}
