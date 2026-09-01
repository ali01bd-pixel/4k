# SVG → EPS Converter

A GitHub Pages-compatible, client-side SVG to EPS converter. It runs completely in the browser and does not upload SVG files to a server.

## Deploy to GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html`, `styles.css`, `app.js`, and this `README.md` to the repository root.
3. In **Settings → Pages**, choose **Deploy from a branch**, select your main branch and `/ (root)`.
4. Wait for GitHub Pages to publish the site.

No Node.js build step is required.

## What the converter handles

- SVG paths including line, cubic, quadratic and arc commands.
- Rectangles, rounded rectangles, circles, ellipses, lines, polygons and polylines.
- Common transforms: matrix, translate, scale, rotate, skewX, skewY.
- Basic fills, strokes, dash patterns, line caps/joins, fill rules and common CSS class declarations.
- Basic SVG `<use>` references.
- Live PostScript text using standard PDF/PostScript families (Helvetica, Times, Courier) as a compatibility fallback.
- EPSF-3.0 metadata, BoundingBox and HiResBoundingBox.
- Multiple SVGs in one browser session.

## Important production note

This frontend intentionally reports unsupported SVG effects rather than pretending they were reproduced. Complex filters, arbitrary external fonts, masks, blend modes and raster-image decoding need a dedicated rendering engine for pixel-perfect parity.

For professional artwork where exact Illustrator/CorelDRAW reproduction is mandatory, consider a WASM-based rendering backend or a server-side converter built with Inkscape/librsvg/Ghostscript. The static GitHub Pages build is best for clean vector SVG artwork.
