import { useCallback, useSyncExternalStore } from 'react'

/**
 * Subscribe to a media query. Used to switch layouts at breakpoints where the
 * right interaction genuinely differs, rather than squeezing a desktop one.
 *
 * `useSyncExternalStore` rather than useState + useEffect, because the page is
 * prerendered: a state initialiser that reads `matchMedia` has no answer on the
 * server, and one that guesses would make the first client render disagree with
 * the markup being hydrated. This hook has a declared server answer instead,
 * React hydrates against exactly that, and the real match arrives in the
 * re-render immediately after. Layout that must be right *before* that
 * re-render belongs in a CSS media query, not here.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', onStoreChange)
      return () => mq.removeEventListener('change', onStoreChange)
    },
    [query],
  )

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])
  const getServerSnapshot = useCallback(() => serverValue, [serverValue])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
