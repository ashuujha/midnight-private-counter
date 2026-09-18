# Midnight: Less revealed. More possible.

The interface pairs forest charcoal with sage, pale lime, and lavender. An original
Mandelbrot-inspired sculpture introduces the private-input/public-outcome idea.
The two-step proof lab contains the existing Lace connection and counter circuit.

## Artwork

- Tool: built-in Imagegen.
- Production asset: `public/images/fractal-hero.webp` (1536 × 1024, approximately 200 KiB).
- The original PNG was converted to WebP for delivery, without changing the composition.
- The artwork is illustrative, not a live visualization of wallet data.

Generation prompt:

```text
Use case: stylized-concept
Asset type: Original hero artwork for an elegant experimental blockchain dApp called Midnight.
Primary request: A mesmerizing three dimensional Mandelbrot-inspired fractal sculpture blending organic mathematical recursion with crystalline blockchain geometry. A large suspended sculptural torus with a luminous open center, branching into intricately nested coiled fern/nautilus-like fractal ridges and tiny translucent cubic crystalline blocks, like an otherworldly mathematical artifact.
Scene/backdrop: Seamless extremely dark graphite-green background #0c1211. Wide landscape 3:2 composition. Sculpture centered, fully visible with generous clear dark negative space around all edges; occupies approximately 75 percent height. No typography in artwork.
Style/medium: Ultra refined high end CGI art directed studio render, macro-level surface detail, soft volumetric light, editorial digital art. Fascinating but soothing psychedelic quality. Not a cartoon. Not a stock finance illustration.
Lighting/mood: Subdued, dreamy, quiet, tactile, cinematic. Soft luminous caustics and delicate metallic reflectivity, no harsh bright neon.
Color palette: Silvery mint, pale sage, pearl, soft lavender, muted violet iridescence. Almost-black forest charcoal environment. Small highlights of pale acid green.
Materials/textures: Iridescent ribbed glass and brushed liquid metal with tiny recursive fractal cubic structures, sharp sophisticated geometric details, physically believable shadows.
Constraints: One sculptural object, no text, no letters, no logos, no watermark, no planets, no bitcoin logos, no UI elements, no floating extra objects, no busy background. Beautiful aesthetically compelling original art.
```

## Type

Space Grotesk (display), DM Sans (body), and DM Mono (metadata) are served from
`public/fonts/`. They are sourced from Google Fonts. Their SIL Open Font License
files are included alongside the fonts.

## Motion and interaction

- The hero follows desktop pointer movement with a subtle perspective tilt.
- The sculpture floats slowly; orbital nodes and proof paths carry small light pulses.
- Sections reveal on entry, and wallet/proof states have visible feedback.
- The motion toggle pauses animations. The system reduced-motion preference disables
  animation, perspective movement, and smooth scrolling.
- The privacy explanation uses keyboard-accessible tabs. It never reads witness data.

## Wallet and proving

The deployed contract, network configuration, SDK adapters, and private witness
generation are retained. The proving module is imported when a circuit call starts,
so its WASM assets are not downloaded just to view the landing page. Copy controls
report clipboard failures. The DUST display uses four decimal places (with a
less-than indicator for smaller positive balances); copy buttons always use the
complete address. The exact DUST check remains in the transaction code.

A disconnect or wallet change clears the visible transaction result and prevents a
late result from being displayed under a different wallet. DUST is refreshed after
a successful transaction.

## Validation

- Production build and TypeScript check pass; all four existing contract tests pass.
- Browser layouts checked at 320, 390, 768, 1024, and 1440 pixels without horizontal overflow.
- Automated WCAG A/AA checks found no violations in the checked desktop/mobile
  disconnected screens or the desktop connected/success screen.
- Simulated connector checks cover connect/disconnect, rejection, wrong network,
  address copying, clipboard denial, DUST refresh, pending/confirmed/cancelled proofs,
  and late results after disconnect. No new on-chain transaction was submitted for
  this design review.
- The real proving module imports successfully in a browser from the production
  build. Its WASM is not requested on the initial landing page.
- Motion controls, pointer parallax, privacy tab keyboard controls, and system
  reduced motion were verified in the browser.
- Screenshots in `docs/screenshots/frontend-*.png` show the disconnected interface.
