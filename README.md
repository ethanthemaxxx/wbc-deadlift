# Deadlift — concept site

An original concept site for **Deadlift**, a fictional independent brand studio in Pittsburgh's Strip District. The structure, proportions, type scale, motion and interaction patterns follow a studied reference site. The identity, copy, images and code are new.

Static HTML, CSS and JS with no build step and relative paths, so it can be served from the root of a GitHub Pages subdomain.

## Pages

| Path | What it is |
|---|---|
| `index.html` | Home: fixed 9-point frame, DEAD/LIFT wordmark sandwich with 4 objects, live HUD, manifesto, studio film, text + flash emblem, 3D kettlebell, text + spray monogram, 4-object row, CTA, double marquee. A small inline script deals the shuffled objects before first paint (no swap, no wasted downloads); without JS a fixed set shows. |
| `work/index.html` | Desktop of draggable folders (BRANDS, PACKAGING, CAMPAIGNS, MOTION, ARCHIVE) that open glass windows and 840px case files, with a time/weather widget. `?view=list` (nav item INDEX) is the accessible list view. Phones and browsers without JS get the list view too. |
| `about/index.html` | Five sticky chapters on native scroll (no wheel hijacking). Black-and-white photos travel in on an arc. Text stays up until its pin leaves; the last chapter stays to the end. Chapters stack at 600px wide and below (photo first, like the home splits), and on screens 560px tall or less (200% zoom, phones held sideways). |
| `contact/index.html` | Large email link with a marker ellipse over a 3-column gallery of photos rising at different speeds (CSS only, with a pause button) |
| `404.html` | "This page didn't make the lift." It uses root-absolute paths so it works at any depth. |

Shared files: `css/site.css` (one stylesheet, tokens in `:root`) and `js/site.js` (nav strike-through, mobile menu, marker strokes, word reveal, clock, weather, pause buttons). Page scripts: `js/home.js`, `js/kettlebell.js` (ES module, lazy), `js/work.js` and `js/about.js`. `site.js` and the page script load before the CDN files, so the menu, clock and reveal work even if jsDelivr stalls.

The phone frame (burger menu, 56px footer, credit in the page flow) applies at 800px wide and below and also on screens 500px tall or less, so a phone held sideways does not get the desktop frame. `/work/` shows the desk only from 801×501 up.

## Fonts

- **Archivo** (Google Fonts), width axis 125 and weight 900: wordmark, CTA and 404. Width 62 is used for the condensed slogan on Contact.
- **General Sans 600** (Fontshare): manifestos and text blocks.
- **Lexend Exa 500** (Google Fonts), uppercase: nav, HUD, footer, labels and UI.
- **Big Shoulders Stencil Display 900** (Google Fonts): the stencilled capitals that replace the reference's blackletter capitals.
- **IBM Plex Mono 400** (Google Fonts): case-file text, 15/1.65.
- Local fallbacks (`Archivo Fallback`, `General Sans Fallback`, `Lexend Exa Fallback`, `Big Shoulders Fallback` in `site.css`) use Arial Black, Impact, Arial Bold and Arial with `size-adjust` and ascent/descent overrides measured against the web fonts, so text barely moves when the fonts arrive.

## Libraries (jsDelivr, pinned)

- GSAP 3.13.0 with InertiaPlugin (object fling on hover). Draggable loads only on /work/ (folders and windows), and attaches when it arrives. A small spring fallback runs on the home page if the CDN fails.
- three.js 0.170.0 (`three.module.min.js` + `RoomEnvironment` from `examples/jsm`) via an import map. It loads only when the kettlebell box comes near the viewport.
- Weather comes live from Open-Meteo (no API key), is cached for 30 minutes in sessionStorage, and falls back to fixed copy after 3 seconds or on error.

## What reproduces the reference

- The 9-point fixed frame: nav at 0/25/50/75/100% with the monogram in the centre, HUD at mid-hero height, and a fixed footer with a toggle, a centre slogan column with a scroll indicator, and the credit. `pointer-events: none` except on controls.
- The vw system: 10vw margins, 8vw between blocks, 80vw usable width, and 30px frame padding (20px at 800px and below).
- The hero sandwich: a 60vw wordmark box (900/369), back line at z −1, objects in a 4 × 16vw grid (1.6vw gap) translated into the same four slots. On phones the hero is 20/27, the wordmark 90vw, and objects sit in a 2-column grid with a 50vw row gap.
- Hover fling (velocity × 30 with inertia to 0, random ±15° wobble). Click swaps an object without repeating one on screen. Touch gets a pulse on load and swap on tap.
- First-visit intro with the same stages (mark → objects rise to a row → wordmark pops and objects jump to their slots → nav and footer slide in → HUD). It is shortened to 2.8 s, has a Skip button, and is skipped under reduced motion and in automated browsers (`navigator.webdriver`), so screenshot tools see the finished hero.
- Manifesto at 2.5vw/1.0 with a scroll-scrubbed word reveal (opacity .2 → 1, from block top at 90% of the viewport to bottom at 60%). Marked phrases stay at full opacity.
- The hand-drawn marker system (two-pass underline, ellipse, and nav strike-through on hover and on the active page). Strokes are generated per element and drawn on entry.
- 80vw × 50vw film (phones get a 720p cut; the poster and file load only when the film gets near), text + image splits (image rotated 1°, column-reverse on phones), the 2:1 corner-bracket 3D box (1:1 below 1024px) with 40px finish swatches and name pills (the active name stays visible on touch screens), a Pause button for the auto-rotation, a 4-up object row, CTA rotated −2°, and a double marquee of 21 × 17vw cards that reverses with scroll direction.
- Dashboard metaphor for work: glass windows (rgba(0,0,0,.65), blur 15px, radius 13px), 840px case files with a full-bleed image, mono text and a Launch button, and a light glass widget (blur 20px, radius 20px).

## What is original

- Name, monogram (a stencilled "DL" drawn as SVG paths), wordmark (live HTML text fitted to 60vw by script), colours (black and white with hazard-yellow `#ffd400` marker), fonts, all copy (from COPY.md), all images (from the project's own assets) and all code.
- The stencil capitals replace blackletter. GRAVITY mode replaces the reference's shooting game: objects fall, bounce and can be thrown, and folders drop on /work/. The 3D viewer shows a kettlebell built from primitives with three finishes and a dither dissolve. The intro is a CSS/SVG material sequence instead of a video.
- Accessibility additions the reference lacks: skip link, one h1 per page, real alt text, keyboard-operable objects and windows, visible focus, pause buttons for the film, marquee and gallery, and full `prefers-reduced-motion` support.

## Assets replaced or derived

All derived from the project's own `assets/`; the originals there are unchanged.

- **`illus-spray.webp`:** the delivered file had no transparency (a grey wall rectangle). Regenerated with an alpha matte taken from the paint's brightness and feathered edges, so only the yellow and white paint and its drips sit on the black page.
- **`desktop-wallpaper.webp` (/work/):** the delivered wallpaper was an iridescent kettlebell in a violet nebula, the only violet on the site and one kettlebell too many. Replaced with the project's chrome anvil (`objects/obj-anvil.webp`), desaturated, on pure black with a faint floor reflection.
- **Objects pool:** the kettlebell object is out of the pool (11 objects); the kettlebell stays as the 3D model.
- **`studio-loop-720.mp4`:** a 720×450 cut of the film (about 1.4 MB instead of 3.4 MB) served to screens 800px wide and below. **`studio-loop-poster.webp`** and **`studio-loop-poster-720.webp`:** WebP posters.
- **`work/case-*-690.webp`:** half-width case images for the list view (`srcset`) and the folder-window thumbnails.
- **`gallery/g-*.webp`:** 360×432 grayscale thumbnails for the Contact gallery (the photos are shown grayscale and dimmed at 180×216).
- **`favicon-32.png`, `apple-touch-icon.png`:** PNG renders of the SVG favicon.

## Assets built with CSS/SVG

- **Intro monogram:** SVG with three gradient/pattern fills (raw steel, hazard enamel, hard chrome) instead of a video clip.
- **3D fallback:** an inline SVG kettlebell with hazard stripes, shown when WebGL2 is unavailable.
- **Folder icons on /work/:** inline SVG steel folders: one paper sheet sticks out per case file (the empty ARCHIVE shows none), a strip of hazard tape across the lip at its own angle, and the stencil DL on the front.
- **Footer emblem (barbell) and scroll indicator:** inline SVG.
- **Favicon:** SVG.
- **`og.jpg`:** there was no share image in the assets, so `assets/og.jpg` is a 1200×630 crop of the studio film poster.
- **Image sizes:** the app's copies of the objects (480px), marquee photos (480px wide) and both illustrations (840px wide) are smaller re-encodes of the project assets, for faster loading. The originals in `assets/` are unchanged.
