/**
 * Entry point for 404.html.
 *
 * It exists only to pull in the stylesheet, so the error page is drawn from the
 * same token layer as the site rather than from hex values inlined into a
 * standalone file. There is no React here: the page is static markup, and a
 * reader who has landed on a dead URL should not wait for a bundle to render an
 * apology.
 *
 * The stylesheet is a small dedicated one, not src/index.css — see the note at
 * the top of src/styles/notfound.css.
 */

import './styles/notfound.css'
