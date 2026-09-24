# Mid-Autumn Intro and Theme Design

## Goal

Turn the existing particle-memory animation into a Mid-Autumn gift from an
older brother to his younger sister while preserving the current Matrix-style
visual identity, timeline, particle-photo treatment, and controls.

## Recipient and Copy

The gift is for **NGUYỄN THỊ NGỌC KHÁNH**, born **15/12/2008**.

The existing `I LOVE YOU` particle scene becomes:

```text
HAPPY MID-AUTUMN, LITTLE SIS
```

The existing pet-name particle scene becomes a centered two-line scene:

```text
NGUYỄN THỊ NGỌC KHÁNH
15/12/2008
```

The text sampler must support multiple centered lines without shrinking the
name and date into one unreadably long line.

## Opening Experience

The page initially displays a full-screen gift cover above the existing
animation. The cover contains:

- a soft full moon, layered clouds, and restrained gold particle accents;
- the heading `A MID-AUTUMN GIFT FOR`;
- `NGUYỄN THỊ NGỌC KHÁNH` and `15/12/2008`;
- one primary `OPEN YOUR GIFT` button.

The existing animation must not advance behind the cover. Clicking the button
fades and disperses the cover, removes it from interaction, and starts the
existing timeline from exactly zero. Keyboard controls continue to work after
the gift is opened. Opening the gift requires no audio or fullscreen request.

## Main Animation Theme

The current dark Matrix presentation remains intact. Mid-Autumn decoration is
deliberately light rather than a complete recolor:

- four to six CSS lanterns sit near the left and right screen edges;
- lanterns use red, orange, and warm-gold light, with slow staggered swaying;
- a few warm sparks drift near the lanterns;
- decorations remain behind particle text and photos and never cover the
  central content;
- mobile uses fewer/smaller lanterns to keep the center clear;
- reduced-motion mode disables swaying and spark movement.

Particle text colors shift to a moon-gold, lantern-orange, and dusk-purple
palette. The countdown, photo particles, Matrix behavior, image sequence,
pause/replay/fullscreen controls, and timing remain unchanged apart from the
animation waiting for the opening-button click.

## Components and Data Flow

1. `config.js` stores the new English greeting, recipient name, and birth date.
2. `index.html` adds the gift-cover markup and a decorative lantern layer.
3. `style.css` renders the cover, moon, clouds, button, lanterns, responsive
   layout, and reduced-motion behavior.
4. `main.js` keeps the timeline in a waiting state until the button is clicked,
   then calls the existing restart path at offset zero.
5. The text sampler accepts one or more lines and generates centered particle
   targets for each line.

## Error and Accessibility Behavior

- The opening button is a native button with visible focus styling.
- The cover exposes a meaningful accessible label; purely decorative moon,
  clouds, lanterns, and sparks are hidden from assistive technology.
- If images fail to load, the opening cover and particle-text sequence still
  work; the existing image fallback behavior is preserved.
- On small screens, text wraps only at explicitly designed line boundaries and
  remains inside the viewport.

## Verification

- Unit tests cover multiline text layout inputs and the waiting/start state.
- Browser smoke checks cover desktop and mobile opening layouts.
- Verify that the timeline stays at zero before opening and begins at zero on
  click.
- Verify the two new particle scenes, name/date line spacing, lantern layering,
  reduced-motion behavior, and all existing keyboard controls.
- Run the complete Node test suite and JavaScript syntax checks.
