# Mid-Autumn Intro and Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a click-to-open Mid-Autumn gift cover, sibling-focused English particle copy with a two-line name/date scene, and restrained lantern decoration without changing the existing particle-photo sequence.

**Architecture:** Keep the existing dependency-free HTML/CSS/Canvas application. Extend `particle-photo.js` with pure layout/timeline helpers that can be tested under Node, use those helpers from `main.js`, and implement the cover and lanterns as accessible semantic HTML plus CSS-only decoration.

**Tech Stack:** HTML5, CSS, browser Canvas 2D, vanilla JavaScript, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-20-mid-autumn-intro-theme-design.md`

## Global Constraints

- Preserve the current Matrix layout, countdown, date scene, particle-photo treatment, image order, transitions, and keyboard controls.
- The animation timeline remains at zero until `OPEN YOUR GIFT` is activated, then starts from exactly zero.
- Use the exact recipient `NGUYỄN THỊ NGỌC KHÁNH` and birth date `15/12/2008` in UTF-8.
- Use the exact greeting `HAPPY MID-AUTUMN, LITTLE SIS`.
- Add no npm or CDN dependencies.
- Keep lanterns behind central particle content; mobile displays fewer/smaller lanterns.
- Disable decorative movement under `prefers-reduced-motion: reduce`.
- This directory is not currently a Git repository. Do not initialize one implicitly; replace commit steps with a file/status checkpoint unless the user creates a repository.

## Review Focus

- A slow image load must not start the timeline or disable the gift button; Task 2 tests the independent closed/open state and Task 4 smoke-tests delayed load behavior.
- A double click or keyboard activation must start the experience only once; Task 2 tests idempotent state transition behavior.
- A long accented recipient name must remain readable on a 390px viewport; Task 1 tests explicit two-line layout and Task 4 captures a mobile render.
- Resizing while the cover is open must not accidentally start the timeline; Task 2 tests closed-state time and Task 4 resizes before opening.
- Reduced-motion users must receive static lanterns and an immediate, non-spinning cover fade; Task 3 adds the media-query behavior and Task 4 inspects it in Chrome emulation.

---

### Task 1: Mid-Autumn Copy and Multiline Particle Text

**Files:**
- Modify: `config.js`
- Modify: `particle-photo.js`
- Modify: `main.js` (`sampleText` and the `love`/`pet` phase palette)
- Test: `test/particle-photo.test.js`

**Interfaces:**
- Produces: `getParticleTextLayout(text, viewportWidth, viewportHeight, options) -> { fontSize, lineHeight, lines: Array<{ text, y }> }`.
- Consumes: existing `sampleText(text, opts)` and `window.LOVE_CONFIG`.

- [ ] **Step 1: Write failing multiline-layout tests**

Add `getParticleTextLayout` to the test import and add literal assertions:

```js
test("two-line recipient text remains centered and readable", () => {
  const layout = getParticleTextLayout(
    "NGUYỄN THỊ NGỌC KHÁNH\n15/12/2008",
    390,
    844,
  );

  assert.equal(layout.lines.length, 2);
  assert.equal(layout.lines[0].text, "NGUYỄN THỊ NGỌC KHÁNH");
  assert.equal(layout.lines[1].text, "15/12/2008");
  assert.ok(layout.fontSize >= 24);
  assert.ok(layout.lines[0].y < 422);
  assert.ok(layout.lines[1].y > 422);
});

test("countdown text keeps its large single-character sizing", () => {
  const layout = getParticleTextLayout("3", 390, 844);
  assert.equal(layout.lines.length, 1);
  assert.equal(layout.fontSize, Math.min(844 * 0.55, 390 * 0.42));
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm.cmd test`

Expected: FAIL because `getParticleTextLayout` is not exported.

- [ ] **Step 3: Implement the pure text-layout helper**

Add to `particle-photo.js` and export it:

```js
function getParticleTextLayout(text, viewportWidth, viewportHeight, options = {}) {
  const lines = String(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const safeLines = lines.length ? lines : [""];
  const longest = Math.max(1, ...safeLines.map((line) => line.length));
  const isShort = safeLines.length === 1 && longest <= 2;
  const heightCap = safeLines.length > 1 ? 0.17 : 0.26;
  const fontSize =
    options.fontSize ||
    (isShort
      ? Math.min(viewportHeight * 0.55, viewportWidth * 0.42)
      : Math.min(viewportWidth / (longest * 0.58), viewportHeight * heightCap));
  const lineHeight = fontSize * 1.18;
  const blockHeight = lineHeight * (safeLines.length - 1);

  return {
    fontSize,
    lineHeight,
    lines: safeLines.map((line, index) => ({
      text: line,
      y: viewportHeight / 2 - blockHeight / 2 + index * lineHeight,
    })),
  };
}
```

- [ ] **Step 4: Use the helper in the real canvas sampler**

In `main.js`, import the helper from `window.ParticlePhoto`. Replace the single `fillText` call and duplicated font-size formula in `sampleText` with:

```js
const layout = getParticleTextLayout(text, W, H, opts);
sctx.font = `900 ${layout.fontSize}px Arial Black, Arial, sans-serif`;
sctx.textAlign = "center";
sctx.textBaseline = "middle";
sctx.fillStyle = "#fff";
layout.lines.forEach((line) => sctx.fillText(line.text, W / 2, line.y));
```

Base `estimatedArea` on `layout.fontSize` and the sum of line lengths so particle sampling remains under `maxParticles()`.

- [ ] **Step 5: Replace copy and Mid-Autumn palettes**

Update `config.js`:

```js
loveText: "HAPPY MID-AUTUMN, LITTLE SIS",
petNameText: "NGUYỄN THỊ NGỌC KHÁNH\n15/12/2008",
recipientName: "NGUYỄN THỊ NGỌC KHÁNH",
birthDate: "15/12/2008",
```

Set `love` to gold/orange (`baseHue: 25`, `hueSpan: 35`, `light: 61`) and `pet` to gold/dusk purple (`baseHue: 38`, `hueSpan: 245`, `light: 63`).

- [ ] **Step 6: Verify GREEN and record a checkpoint**

Run: `npm.cmd test` and `node --check main.js && node --check particle-photo.js && node --check config.js` (use separate PowerShell commands if `&&` is unavailable).

Expected: all tests pass and all syntax checks exit 0.

Checkpoint files: `config.js`, `particle-photo.js`, `main.js`, `test/particle-photo.test.js`.

---

### Task 2: Gift-Opening Timeline Gate

**Files:**
- Modify: `index.html`
- Modify: `particle-photo.js`
- Modify: `main.js`
- Test: `test/particle-photo.test.js`

**Interfaces:**
- Produces: `getExperienceTime(opened, now, timelineStart, pausedAccum) -> number` in seconds.
- Produces: `openGift()` browser event handler with an idempotent `giftOpened` guard.
- Produces DOM IDs: `giftCover` and `openGiftBtn`.
- Consumes: the existing `restart(0)`, animation frame, and pause handling.

- [ ] **Step 1: Write failing timeline-gate tests**

```js
test("closed gift holds the experience at zero", () => {
  assert.equal(getExperienceTime(false, 50_000, 10_000, 0), 0);
});

test("opened gift measures time from the restarted timeline", () => {
  assert.equal(getExperienceTime(true, 12_500, 10_000, 500), 2);
});
```

Add a small idempotence helper test:

```js
test("gift can transition from closed to open only once", () => {
  assert.deepEqual(getGiftOpenTransition(false), { opened: true, shouldStart: true });
  assert.deepEqual(getGiftOpenTransition(true), { opened: true, shouldStart: false });
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm.cmd test`

Expected: FAIL because both helpers are missing.

- [ ] **Step 3: Implement and export timeline helpers**

```js
function getExperienceTime(opened, now, timelineStart, pausedAccum) {
  return opened ? (now - timelineStart - pausedAccum) / 1000 : 0;
}

function getGiftOpenTransition(opened) {
  return opened
    ? { opened: true, shouldStart: false }
    : { opened: true, shouldStart: true };
}
```

- [ ] **Step 4: Add the semantic gift-cover markup**

Insert near the end of `#app`, above the replay button:

```html
<section id="giftCover" aria-labelledby="giftTitle">
  <div class="coverMoon" aria-hidden="true"></div>
  <div class="coverCloud coverCloud-a" aria-hidden="true"></div>
  <div class="coverCloud coverCloud-b" aria-hidden="true"></div>
  <div class="giftCard">
    <p class="giftEyebrow">A MID-AUTUMN GIFT FOR</p>
    <h1 id="giftTitle">NGUYỄN THỊ NGỌC KHÁNH</h1>
    <p class="giftDate">15/12/2008</p>
    <button id="openGiftBtn" type="button">OPEN YOUR GIFT</button>
  </div>
</section>
```

- [ ] **Step 5: Gate the live animation and wire one-time opening**

In `main.js`, initialize `giftOpened = false`. In `frame(now)`, draw the Matrix background while closed but return before `setPhase`, `updatePhotoTimeline`, and `morph.draw`. Calculate `t` through `getExperienceTime` after opening.

Wire the button as follows after Task 3 adds the DOM:

```js
function openGift() {
  const transition = getGiftOpenTransition(giftOpened);
  giftOpened = transition.opened;
  if (!transition.shouldStart) return;

  giftCover.classList.add("opening");
  openGiftBtn.disabled = true;
  restart(0);
  giftCover.addEventListener(
    "transitionend",
    () => {
      giftCover.hidden = true;
    },
    { once: true },
  );
}
```

Add a 1.2-second fallback timer that sets `hidden = true` if a browser suppresses transition events. The fallback must check `giftOpened` and `giftCover.hidden` and must not call `restart` again.

- [ ] **Step 6: Keep controls inert until opening**

Return early from Space/R/F handlers when `giftOpened` is false, except allow Enter/Space to activate the focused native opening button through browser defaults. Replay after opening continues to call `restart(0)` without showing the cover again.

- [ ] **Step 7: Verify GREEN and record a checkpoint**

Run: `npm.cmd test`, `node --check main.js`, and `node --check particle-photo.js`.

Expected: all tests pass and syntax checks exit 0.

Checkpoint files: `index.html`, `particle-photo.js`, `main.js`, `test/particle-photo.test.js`.

---

### Task 3: Opening Cover and Lantern Presentation

**Files:**
- Modify: `index.html`
- Modify: `style.css`
- Modify: `main.js` (DOM queries and cover event binding only)

**Interfaces:**
- Produces DOM ID: `lanternLayer` and the final visual presentation for the Task 2 cover.
- Consumes: `window.LOVE_CONFIG.recipientName`, `birthDate`, Task 2 `openGift()`, `giftCover`, and `openGiftBtn`.

- [ ] **Step 1: Add decorative lantern markup beside the existing Task 2 cover**

Insert inside `#app`, above the canvases:

```html
<div id="lanternLayer" aria-hidden="true">
  <i class="lantern lantern-1"></i><i class="lantern lantern-2"></i>
  <i class="lantern lantern-3"></i><i class="lantern lantern-4"></i>
  <i class="lantern lantern-5"></i><i class="lantern lantern-6"></i>
</div>
```

- [ ] **Step 2: Style the cover without external assets**

Use a dark blue radial/linear gradient, a CSS radial-gradient moon, blurred cloud capsules, and a translucent bordered card. Required behavioral declarations:

```css
#giftCover { position: absolute; inset: 0; z-index: 50; }
#giftCover.opening { opacity: 0; transform: scale(1.035); pointer-events: none; }
#giftCover[hidden] { display: none; }
#openGiftBtn:focus-visible { outline: 3px solid #ffd77a; outline-offset: 4px; }
```

Keep the transition between 700ms and 900ms and make the recipient name responsive with `font-size: clamp(1.7rem, 5vw, 4.4rem)`.

- [ ] **Step 3: Build lightweight CSS lanterns and sparks**

Place `#lanternLayer` at `z-index: 2`, above Matrix but below `photoStage`/`fxCanvas`. Each `.lantern` uses a rounded red-orange body, gold ribs, a warm blurred glow, a top cord, and a tassel through pseudo-elements. Position three per edge with unique `animation-delay` values. Keep the central 64% of the viewport free of lantern bodies.

Use one sway animation based only on transforms:

```css
@keyframes lanternSway {
  0%, 100% { transform: rotate(-3deg) translateY(0); }
  50% { transform: rotate(3deg) translateY(8px); }
}
```

Create warm sparks with lantern box-shadow copies or lantern pseudo-elements; do not add JavaScript particles for decoration.

- [ ] **Step 4: Add responsive and reduced-motion behavior**

At portrait/mobile sizes, hide `.lantern-3` and `.lantern-6`, reduce bodies to 30–38px wide, and keep remaining lantern opacity at or below `0.72`.

Extend the existing reduced-motion query:

```css
@media (prefers-reduced-motion: reduce) {
  .lantern,
  .lantern::after,
  .coverCloud,
  .coverMoon { animation: none !important; }
  #giftCover { transition-duration: 1ms; }
}
```

- [ ] **Step 5: Bind cover content and opening action**

Query `giftCover` and `openGiftBtn` once in `main.js`, set the title/date from config to keep one source of truth, and bind `openGiftBtn.addEventListener("click", openGift)`.

- [ ] **Step 6: Run syntax checks and record a checkpoint**

Run: `node --check main.js`, `node --check config.js`, and `npm.cmd test`.

Expected: syntax checks exit 0 and the full test suite passes.

Checkpoint files: `index.html`, `style.css`, `main.js`.

---

### Task 4: Browser Verification and Regression Audit

**Files:**
- Modify only if verification exposes a requirement failure: `index.html`, `style.css`, `main.js`, `particle-photo.js`, `test/particle-photo.test.js`

**Interfaces:**
- Consumes all prior task outputs.
- Produces a verified browser experience; no new public API.

- [ ] **Step 1: Run the complete automated verification**

Run:

```powershell
npm.cmd test
node --check main.js
node --check particle-photo.js
node --check config.js
node --check server.js
```

Expected: every command exits 0 with zero failed tests.

- [ ] **Step 2: Render the unopened desktop state**

Start `node server.js` on an unused local port and capture a 1440×900 headless-Chrome screenshot at `/`. Confirm the cover is centered, recipient/date are legible, the button has sufficient contrast, the lanterns remain at the edges, and no particle timeline content is visible above the cover.

- [ ] **Step 3: Verify the timeline is held and opens exactly once**

Use Chrome DevTools or a small temporary browser script to wait at least three seconds before clicking `OPEN YOUR GIFT`. After clicking, confirm the debug timestamp begins near `0.00s`, a second click cannot restart it, and the cover becomes hidden after its transition.

- [ ] **Step 4: Verify particle copy and multiline recipient scene**

Open with debug controls after the cover is dismissed and inspect the former `love` and `pet` phases. Confirm the greeting is one readable line, the recipient/date are two centered lines, accents render correctly, and particle count stays at or below the configured platform limit.

- [ ] **Step 5: Verify mobile, resize, and reduced motion**

Capture a 390×844 viewport before opening, resize once while the cover is visible, then open it. Confirm four small lanterns remain at edges, the name does not clip, the timeline begins at zero, and image-particle resize behavior remains correct. Emulate reduced motion and confirm lantern/cloud movement stops and the cover exits immediately.

- [ ] **Step 6: Clean temporary artifacts and final checkpoint**

Stop only the server process started for this task. Delete only screenshots/profile files created for verification after visually inspecting them. Run `npm.cmd test` once more and confirm no `*preview*.png` files remain in the project.

Final checkpoint files: `config.js`, `index.html`, `style.css`, `main.js`, `particle-photo.js`, and `test/particle-photo.test.js`.
