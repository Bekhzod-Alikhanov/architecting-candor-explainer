/// <reference types="vite/client" />

/**
 * True when public/video/architecting-candor-explainer.mp4 was present at build
 * time. The video is not committed — see the note in vite.config.ts — so §09
 * renders its player only when the file actually shipped.
 */
declare const __HAS_EXPLAINER__: boolean
