# Love Particle Video

A self-contained browser animation using the 19 photos in `assets/photos`.

## Flow

- Rainbow Matrix-style digital rain background
- Particle countdown: 3 -> 2 -> 1
- Particle date: `18.06.2026`
- `I LOVE YOU` particle text
- `CỤC TÌNH YÊU` particle text
- Particle explosion transition
- From about `19.05s`: a floating island with a particle cherry blossom tree, rabbits, and drifting lanterns appears
- 19 floating lanterns map one-to-one to the 19 photos in `assets/photos`
- Click/tap a lantern to open its photo
- Drag or swipe to rotate the island through 360 degrees; lanterns orbit the tree automatically
- In the photo viewer: close, previous, next, `Esc`, `Left`, and `Right` are supported
- No CDN and no external npm dependencies

## Run on Windows

Install Node.js 18+ and open a terminal in this folder:

```powershell
npm start
```

Open:

```text
http://localhost:3000
```

Controls:

- `Space` pause/resume before the timeline finishes
- `R` replay from the start
- `F` fullscreen
- `Esc` close an opened memory photo
- `Left / Right` move between memory photos while the viewer is open

## Preview the final blossom scene quickly

```text
http://localhost:3000/?t=20
```

## Change text/date

Edit `config.js`.

## Replace photos

Replace the files under `assets/photos/` while keeping the names `01.jpeg` through `19.jpeg`, or edit the `photos` array in `config.js`.
# ngockhanh2
