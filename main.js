(() => {
  "use strict";

  const CFG = window.LOVE_CONFIG;
  const {
    enhanceParticleColor,
    getParticleGrid,
    getParticleImageRect,
    getParticlePhotoVisibility,
    getPausedMorphTime,
    getResizedPhotoCycle,
    shiftMorphStartAfterPause,
  } = window.ParticlePhoto;

  const matrixCanvas = document.getElementById("matrixCanvas");
  const fxCanvas = document.getElementById("fxCanvas");

  const mctx = matrixCanvas.getContext("2d", {
    alpha: false,
  });

  const fctx = fxCanvas.getContext("2d", {
    alpha: true,
  });

  const photoStage = document.getElementById("photoStage");

  const satelliteLayer = document.getElementById("satelliteLayer");

  const heroFrame = document.getElementById("heroFrame");

  const heroPhoto = document.getElementById("heroPhoto");

  const lanternStage = document.getElementById("lanternStage");

  const lanternBackLayer = document.getElementById("lanternBackLayer");

  const treeScene = document.querySelector(".treeScene");

  const sakuraCanvas = document.getElementById("sakuraCanvas");

  const lanternLayer = document.getElementById("lanternLayer");

  const fireflyLayer = document.getElementById("fireflyLayer");

  const memoryViewer = document.getElementById("memoryViewer");

  const memoryPhoto = document.getElementById("memoryPhoto");

  const memoryClose = document.getElementById("memoryClose");

  const memoryPrev = document.getElementById("memoryPrev");

  const memoryNext = document.getElementById("memoryNext");

  const replayBtn = document.getElementById("replayBtn");

  const debugTime = document.getElementById("debugTime");

  const midAutumnHome = document.getElementById("midAutumnHome");

  const startExperienceBtn = document.getElementById("startExperienceBtn");

  const params = new URLSearchParams(location.search);

  const debug = params.get("debug") === "1";

  const requestedStart = Math.max(0, Number(params.get("t") || 0) || 0);

  if (debug) {
    debugTime.classList.add("on");
  }

  let W = innerWidth;
  let H = innerHeight;
  let DPR = 1;

  let paused = false;
  let pauseStarted = 0;
  let pausedAccum = 0;

  let timelineStart = performance.now() - requestedStart * 1000;

  let lastPhase = "";
  let finished = false;

  let heroIndex = -1;

  let photoCycle = -1;
  let photoCycleStage = "";
  let photoFxAlpha = 1;

  // =========================================================
  // LOAD IMAGES
  // =========================================================

  const images = new Map();

  const imagePromises = CFG.photos.map(
    (src) =>
      new Promise((resolve) => {
        const img = new Image();

        img.onload = () => {
          images.set(src, img);

          resolve();
        };

        img.onerror = resolve;

        img.src = src;
      }),
  );

  // =========================================================
  // RESIZE
  // =========================================================

  function resize() {
    W = innerWidth;
    H = innerHeight;

    DPR = Math.min(devicePixelRatio || 1, 1.5);

    for (const c of [matrixCanvas, fxCanvas]) {
      c.width = Math.floor(W * DPR);

      c.height = Math.floor(H * DPR);

      c.style.width = `${W}px`;

      c.style.height = `${H}px`;
    }

    mctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    fctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    initMatrix();

    morph.rescale(W, H);

    photoCycle = getResizedPhotoCycle(lastPhase, photoCycle);
  }

  addEventListener("resize", resize, {
    passive: true,
  });

  // =========================================================
  // MATRIX RAIN
  // =========================================================

  const matrix = {
    columns: [],
    font: 13,
  };

  const glyphs = "01101001LOVE♥3 2 1アイウエオカキクケコ";
  const photoGlyphs = "LOVE♥♡✦✧01アイコイ";
  function initMatrix() {
    matrix.font = Math.max(10, Math.min(15, W / 95));

    const gap = CFG.matrixDensity;

    const count = Math.ceil(W / gap);

    matrix.columns = Array.from(
      {
        length: count,
      },

      (_, i) => ({
        x: i * gap + Math.random() * 5,

        y: Math.random() * H,

        speed: 35 + Math.random() * 115,

        len: 7 + Math.floor(Math.random() * 22),

        hue: ((i / count) * 270 + Math.random() * 45) % 360,

        seed: Math.random() * 1000,
      }),
    );
  }

  function drawMatrix(now, dt) {
    mctx.fillStyle = "rgba(1,2,5,0.18)";

    mctx.fillRect(0, 0, W, H);

    mctx.font = `${matrix.font}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;

    mctx.textAlign = "center";

    mctx.textBaseline = "middle";

    matrix.columns.forEach((c, ci) => {
      c.y += c.speed * dt;

      if (c.y - c.len * matrix.font > H + 20) {
        c.y = -Math.random() * H * 0.55;

        c.speed = 35 + Math.random() * 115;
      }

      for (let j = 0; j < c.len; j++) {
        const yy = c.y - j * matrix.font * 1.08;

        if (yy < -20 || yy > H + 20) {
          continue;
        }

        const a =
          Math.max(0, 1 - j / c.len) *
          (0.2 +
            0.56 * Math.max(0, Math.sin(c.seed + now * 0.00037 + ci * 0.1)));

        const hue = (c.hue + now * 0.012 + j * 1.5) % 360;

        mctx.fillStyle = `hsla(${hue},90%,${j === 0 ? 72 : 56}%,${a})`;

        const activeGlyphs = lastPhase === "photos" ? photoGlyphs : glyphs;

        const idx =
          Math.abs(Math.floor(now / 115) + ci * 7 + j * 3) %
          activeGlyphs.length;

        mctx.fillText(activeGlyphs[idx], c.x, yy);
      }
    });
  }

  // =========================================================
  // PARTICLE MORPH
  // =========================================================

  class MorphField {
    constructor() {
      this.items = [];

      this.start = 0;

      this.duration = 1000;

      this.kind = "dots";

      this.twinkle = 0;
    }

    rescale() {
      // Targets will be regenerated
      // whenever the phase changes.
    }

    currentPoint(p, now) {
      const q = Math.min(1, Math.max(0, (now - this.start) / this.duration));

      const e = 1 - Math.pow(1 - q, 3);

      return {
        x: p.sx + (p.tx - p.sx) * e,

        y: p.sy + (p.ty - p.sy) * e,

        a: p.sa + (p.ta - p.sa) * e,

        r: p.sr + (p.tr - p.sr) * e,

        g: p.sg + (p.tg - p.sg) * e,

        b: p.sb + (p.tb - p.sb) * e,

        e,
      };
    }

    morphTo(
      points,
      now,
      duration = 1050,
      fromMode = "current",
      composite = "lighter",
    ) {
      const old = this.items;

      const next = new Array(points.length);

      for (let i = 0; i < points.length; i++) {
        const target = points[i];

        let sx;
        let sy;

        let sr;
        let sg;
        let sb;
        let sa;

        if (old[i]) {
          const cur = this.currentPoint(old[i], now);

          sx = cur.x;

          sy = cur.y;

          sr = cur.r;

          sg = cur.g;

          sb = cur.b;

          sa = cur.a;
        } else {
          if (fromMode === "edges") {
            const side = Math.floor(Math.random() * 4);

            sx = side < 2 ? Math.random() * W : side === 2 ? -50 : W + 50;

            sy = side >= 2 ? Math.random() * H : side === 0 ? -50 : H + 50;
          } else {
            sx = W / 2 + (Math.random() - 0.5) * W * 0.9;

            sy = H / 2 + (Math.random() - 0.5) * H * 0.9;
          }

          sr = target.r;

          sg = target.g;

          sb = target.b;

          sa = 0;
        }

        next[i] = {
          sx,
          sy,

          tx: target.x,

          ty: target.y,

          sr,
          sg,
          sb,

          tr: target.r,

          tg: target.g,

          tb: target.b,

          sa,

          ta: target.a ?? 1,

          size: target.size || 1 + Math.random() * 1.5,

          seed: Math.random() * 999,
        };
      }

      this.items = next;

      this.start = now;

      this.duration = duration;

      this.kind = "dots";

      this.composite = composite;
    }

    explode(now, mode = "radial", duration = 760) {
      const next = this.items.map((p) => {
        const cur = this.currentPoint(p, now);

        let tx;
        let ty;

        if (mode === "horizontal") {
          const dir = Math.random() < 0.5 ? -1 : 1;

          tx = cur.x + dir * (W * 0.38 + Math.random() * W * 0.9);

          ty = cur.y + (Math.random() - 0.5) * 80;
        } else if (mode === "cloud") {
          const a = Math.random() * Math.PI * 2;

          const d = Math.min(W, H) * (0.035 + Math.random() * 0.34);

          const swirl = (cur.y - H / 2) * 0.055;

          tx = cur.x + Math.cos(a) * d + swirl;

          ty = cur.y + Math.sin(a) * d + (Math.random() - 0.5) * 55;
        } else {
          const a =
            Math.atan2(
              cur.y - H / 2,

              cur.x - W / 2,
            ) +
            (Math.random() - 0.5) * 1.4;

          const d = Math.min(W, H) * (0.32 + Math.random() * 1.1);

          tx = cur.x + Math.cos(a) * d;

          ty = cur.y + Math.sin(a) * d;
        }

        return {
          sx: cur.x,

          sy: cur.y,

          tx,
          ty,

          sr: cur.r,

          sg: cur.g,

          sb: cur.b,

          tr: cur.r,

          tg: cur.g,

          tb: cur.b,

          sa: cur.a,

          ta: mode === "cloud" ? 0.03 + Math.random() * 0.1 : 0,

          size: p.size,

          seed: p.seed,
        };
      });

      this.items = next;

      this.start = now;

      this.duration = duration;

      this.kind = mode === "horizontal" ? "streak" : "dots";
    }

    draw(now, globalAlpha = 1) {
      fctx.clearRect(0, 0, W, H);

      fctx.save();

      fctx.globalCompositeOperation = this.composite || "lighter";

      fctx.globalAlpha = globalAlpha;

      const streak = this.kind === "streak";

      for (let i = 0; i < this.items.length; i++) {
        const p = this.items[i];

        const q = Math.min(1, Math.max(0, (now - this.start) / this.duration));

        const e = 1 - Math.pow(1 - q, 3);

        let x = p.sx + (p.tx - p.sx) * e;

        let y = p.sy + (p.ty - p.sy) * e;

        const a = Math.max(0, p.sa + (p.ta - p.sa) * e);

        if (a < 0.015) {
          continue;
        }

        const jitter = Math.max(0, 1 - e) * 2.2;

        x += Math.sin(now * 0.006 + p.seed) * jitter;

        y += Math.cos(now * 0.0047 + p.seed * 1.7) * jitter;

        const r = p.sr + (p.tr - p.sr) * e;

        const g = p.sg + (p.tg - p.sg) * e;

        const b = p.sb + (p.tb - p.sb) * e;

        fctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${Math.min(0.95, a)})`;

        const s = p.size;

        if (streak) {
          fctx.fillRect(x, y, 4 + s * 5, Math.max(1, s * 0.8));
        } else {
          fctx.fillRect(x, y, s, s);
        }

        if (i % 43 === 0 && a > 0.45) {
          fctx.fillStyle = `rgba(255,255,255,${a * 0.25})`;

          fctx.fillRect(x - 1, y - 1, s + 2, s + 2);
        }
      }

      fctx.restore();
    }
  }

  const morph = new MorphField();

  // =========================================================
  // PARTICLE SAMPLING
  // =========================================================

  const sampleCanvas = document.createElement("canvas");

  const sctx = sampleCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  function maxParticles() {
    return W < 700 ? CFG.particleLimitMobile : CFG.particleLimitDesktop;
  }

  function rainbowAt(x, base = 110, span = 170, sat = 92, light = 58) {
    const h = (base + (x / W) * span) % 360;

    const c = hslToRgb(h / 360, sat / 100, light / 100);

    return [c[0], c[1], c[2]];
  }

  function hslToRgb(h, s, l) {
    let r;
    let g;
    let b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) {
          t += 1;
        }

        if (t > 1) {
          t -= 1;
        }

        if (t < 1 / 6) {
          return p + (q - p) * 6 * t;
        }

        if (t < 1 / 2) {
          return q;
        }

        if (t < 2 / 3) {
          return p + (q - p) * (2 / 3 - t) * 6;
        }

        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;

      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1 / 3);

      g = hue2rgb(p, q, h);

      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  function sampleText(text, opts = {}) {
    sampleCanvas.width = W;

    sampleCanvas.height = H;

    sctx.clearRect(0, 0, W, H);

    const isShort = text.length <= 2;

    const fontSize =
      opts.fontSize ||
      (isShort
        ? Math.min(H * 0.5, W * 0.36)
        : Math.min(W / (text.length * 0.72), H * 0.19));

    sctx.font = `900 ${fontSize}px Arial Black, Arial, sans-serif`;

    sctx.textAlign = "center";

    sctx.textBaseline = "middle";

    sctx.fillStyle = "#fff";

    sctx.fillText(text, W / 2, H / 2);

    const data = sctx.getImageData(0, 0, W, H).data;

    const lim = maxParticles();

    const estimatedArea = isShort
      ? fontSize * fontSize * 0.5
      : fontSize * fontSize * Math.min(6, text.length * 0.5);

    let step = Math.max(
      3,
      Math.round(Math.sqrt(Math.max(1, estimatedArea / lim))),
    );

    if (W < 700) {
      step = Math.max(step, 4);
    }

    const pts = [];

    const base = opts.baseHue ?? 100;

    const span = opts.hueSpan ?? 210;

    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        const a = data[(y * W + x) * 4 + 3];

        if (a > 80) {
          const [r, g, b] = rainbowAt(x, base, span, 94, opts.light ?? 60);

          pts.push({
            x: x + (Math.random() - 0.5) * 1.2,

            y: y + (Math.random() - 0.5) * 1.2,

            r,
            g,
            b,

            a: Math.min(1, a / 220),

            size: 1.1 + Math.random() * 1.5,
          });
        }
      }
    }

    if (pts.length > lim) {
      const stride = pts.length / lim;

      const out = [];

      for (let i = 0; i < lim; i++) {
        out.push(pts[Math.floor(i * stride)]);
      }

      return out;
    }

    return pts;
  }

  // =========================================================
  // IMAGE SAMPLING
  // =========================================================

  function imageRect(img) {
    return getParticleImageRect(W, H, img.naturalWidth, img.naturalHeight);
  }

  function sampleImage(img) {
    if (!img || !img.naturalWidth) {
      return [];
    }

    sampleCanvas.width = W;

    sampleCanvas.height = H;

    sctx.clearRect(0, 0, W, H);

    const r = imageRect(img);

    sctx.drawImage(img, r.x, r.y, r.w, r.h);

    const data = sctx.getImageData(0, 0, W, H).data;

    const grid = getParticleGrid(r.w, r.h, maxParticles());

    const step = grid.step;

    const pts = [];

    for (let y = Math.floor(r.y); y < r.y + r.h; y += step) {
      for (let x = Math.floor(r.x); x < r.x + r.w; x += step) {
        const idx = (y * W + x) * 4;

        if (data[idx + 3] > 50) {
          const [rr, gg, bb] = enhanceParticleColor(
            data[idx],
            data[idx + 1],
            data[idx + 2],
          );

          pts.push({
            x: x + (Math.random() - 0.5) * 0.9,

            y: y + (Math.random() - 0.5) * 0.9,

            r: rr,

            g: gg,

            b: bb,

            a: 0.94,

            size: grid.particleSize * (0.96 + Math.random() * 0.08),
          });
        }
      }
    }

    return pts;
  }

  // =========================================================
  // FLOATING PHOTO CARDS
  // =========================================================

  const cardRoutes = [
    {
      from: [-0.13, 0.08],

      to: [0.22, 0.23],

      delay: 0.25,

      duration: 5.4,

      z: -80,

      rz: -11,

      ry: 12,

      scale: 1.02,
    },

    {
      from: [1.12, 0.05],

      to: [0.78, 0.24],

      delay: 0.75,

      duration: 5.8,

      z: -150,

      rz: 9,

      ry: -14,

      scale: 0.88,
    },

    {
      from: [-0.14, 0.42],

      to: [0.18, 0.55],

      delay: 1.55,

      duration: 6.2,

      z: -55,

      rz: 7,

      ry: 10,

      scale: 1.08,
    },

    {
      from: [1.15, 0.48],

      to: [0.82, 0.6],

      delay: 2.15,

      duration: 5.5,

      z: -105,

      rz: -10,

      ry: -12,

      scale: 1,
    },

    {
      from: [0.18, -0.25],

      to: [0.3, 0.18],

      delay: 2.85,

      duration: 5.9,

      z: -205,

      rz: -6,

      ry: 8,

      scale: 0.8,
    },

    {
      from: [0.86, -0.23],

      to: [0.72, 0.2],

      delay: 3.35,

      duration: 6.3,

      z: -120,

      rz: 12,

      ry: -10,

      scale: 0.93,
    },

    {
      from: [0.07, 1.2],

      to: [0.24, 0.72],

      delay: 4.2,

      duration: 6.1,

      z: -180,

      rz: 8,

      ry: 8,

      scale: 0.84,
    },

    {
      from: [0.94, 1.18],

      to: [0.76, 0.73],

      delay: 4.8,

      duration: 5.7,

      z: -72,

      rz: -12,

      ry: -11,

      scale: 1.06,
    },

    {
      from: [-0.14, 0.83],

      to: [0.18, 0.68],

      delay: 5.55,

      duration: 5.9,

      z: -135,

      rz: -10,

      ry: 12,

      scale: 0.92,
    },

    {
      from: [1.14, 0.82],

      to: [0.81, 0.68],

      delay: 6.15,

      duration: 6.0,

      z: -210,

      rz: 7,

      ry: -10,

      scale: 0.82,
    },

    {
      from: [-0.15, 0.25],

      to: [0.15, 0.31],

      delay: 7.0,

      duration: 5.4,

      z: -95,

      rz: 13,

      ry: 11,

      scale: 0.98,
    },

    {
      from: [1.14, 0.2],

      to: [0.85, 0.31],

      delay: 7.65,

      duration: 5.6,

      z: -165,

      rz: -8,

      ry: -13,

      scale: 0.88,
    },
  ];

  const cards = [];

  function buildCards() {
    satelliteLayer.innerHTML = "";

    cards.length = 0;

    cardRoutes.forEach((route, i) => {
      const d = document.createElement("div");

      d.className = "memory-card";

      const im = document.createElement("img");

      im.alt = "";

      im.src = CFG.photos[(i * 3 + 2) % CFG.photos.length];

      d.appendChild(im);

      satelliteLayer.appendChild(d);

      cards.push({
        el: d,

        img: im,

        route,

        phase: Math.random() * Math.PI * 2,
      });
    });
  }

  buildCards();

  // =========================================================
  // INTERACTIVE BLOSSOM ISLAND
  // =========================================================

  let activeMemoryIndex = 0;

  let pendingMemoryOpen = 0;

  let flashingLantern = null;

  let sceneYaw = 0;

  let dragPointer = null;

  let lastPointerX = 0;

  let dragDistance = 0;

  let suppressLanternClickUntil = 0;

  const lanternButtons = [];

  function buildFireflies() {
    fireflyLayer.innerHTML = "";

    for (let i = 0; i < 46; i++) {
      const dot = document.createElement("i");

      dot.className = "firefly";

      dot.style.setProperty("--x", `${4 + ((i * 37) % 92)}%`);

      dot.style.setProperty("--y", `${6 + ((i * 53) % 86)}%`);

      dot.style.setProperty("--size", `${1.4 + (i % 4) * 0.7}px`);

      dot.style.setProperty("--delay", `${-((i * 0.37) % 6).toFixed(2)}s`);

      dot.style.setProperty("--duration", `${4.4 + (i % 7) * 0.55}s`);

      fireflyLayer.appendChild(dot);
    }
  }

  function buildLanterns() {
    lanternLayer.innerHTML = "";

    lanternBackLayer.innerHTML = "";

    lanternButtons.length = 0;

    CFG.photos.forEach((src, index) => {
      const button = document.createElement("button");

      button.className = "memory-lantern";

      button.type = "button";

      button.setAttribute("aria-label", `Mở ảnh kỷ niệm ${index + 1}`);

      button.style.setProperty("--scale", "1");

      button.dataset.photoIndex = String(index);

      button.innerHTML = `
          <span class="lantern-cap top"></span>
          <span class="lantern-body"></span>
          <span class="lantern-heart">♥</span>
          <span class="lantern-cap bottom"></span>
          <span class="lantern-tassel"></span>
        `;

      button.addEventListener("click", () => {
        if (performance.now() >= suppressLanternClickUntil) {
          if (pendingMemoryOpen) {
            clearTimeout(pendingMemoryOpen);
          }

          flashingLantern?.classList.remove("activating");

          flashingLantern = button;

          button.classList.add("activating");

          pendingMemoryOpen = setTimeout(() => {
            pendingMemoryOpen = 0;

            button.classList.remove("activating");

            flashingLantern = null;

            if (lanternStage.classList.contains("active")) {
              openMemory(index);
            }
          }, 340);
        }
      });

      lanternLayer.appendChild(button);

      lanternButtons.push(button);
    });
  }

  lanternStage.addEventListener("pointerdown", (event) => {
    if (memoryViewer.classList.contains("open")) {
      return;
    }

    dragPointer = event.pointerId;

    lastPointerX = event.clientX;

    dragDistance = 0;
  });

  lanternStage.addEventListener("pointermove", (event) => {
    if (event.pointerId !== dragPointer) {
      return;
    }

    const deltaX = event.clientX - lastPointerX;

    lastPointerX = event.clientX;

    dragDistance += Math.abs(deltaX);

    if (dragDistance > 4) {
      lanternStage.setPointerCapture(event.pointerId);

      sceneYaw = window.Scene3D.yawFromDrag(
        sceneYaw,
        deltaX,
        lanternStage.clientWidth,
      );

      event.preventDefault();
    }
  });

  function endSceneDrag(event) {
    if (event.pointerId !== dragPointer) {
      return;
    }

    if (dragDistance > 4) {
      suppressLanternClickUntil = performance.now() + 300;
    }

    dragPointer = null;

    if (lanternStage.hasPointerCapture(event.pointerId)) {
      lanternStage.releasePointerCapture(event.pointerId);
    }
  }

  lanternStage.addEventListener("pointerup", endSceneDrag);

  lanternStage.addEventListener("pointercancel", endSceneDrag);

  function openMemory(index) {
    activeMemoryIndex = (index + CFG.photos.length) % CFG.photos.length;

    const src = CFG.photos[activeMemoryIndex];

    memoryPhoto.classList.remove("loaded");

    memoryPhoto.onload = () => memoryPhoto.classList.add("loaded");

    memoryPhoto.src = src;

    memoryViewer.classList.add("open");

    memoryViewer.setAttribute("aria-hidden", "false");
  }

  function closeMemory() {
    if (pendingMemoryOpen) {
      clearTimeout(pendingMemoryOpen);
    }

    pendingMemoryOpen = 0;

    flashingLantern?.classList.remove("activating");

    flashingLantern = null;

    memoryViewer.classList.remove("open");

    memoryViewer.setAttribute("aria-hidden", "true");
  }

  function stepMemory(delta) {
    openMemory(activeMemoryIndex + delta);
  }

  memoryClose.addEventListener("click", closeMemory);

  memoryPrev.addEventListener("click", () => stepMemory(-1));

  memoryNext.addEventListener("click", () => stepMemory(1));

  memoryViewer.querySelectorAll("[data-close-memory]").forEach((el) => {
    el.addEventListener("click", closeMemory);
  });

  addEventListener("keydown", (e) => {
    if (!memoryViewer.classList.contains("open")) {
      return;
    }

    if (e.key === "Escape") {
      closeMemory();
    }

    if (e.key === "ArrowLeft") {
      stepMemory(-1);
    }

    if (e.key === "ArrowRight") {
      stepMemory(1);
    }
  });

  buildFireflies();

  buildLanterns();

  const drawSakura = window.SakuraRenderer.createRenderer(sakuraCanvas);

  function updateLanterns(time) {
    const rect = treeScene.getBoundingClientRect();

    lanternButtons.forEach((button, index) => {
      const world = window.Scene3D.lanternOrbit(index, time);

      const orbitScale = W < 720 ? 0.78 : 1;

      world.x *= orbitScale;

      world.z *= orbitScale;

      const point = window.Scene3D.projectPoint(world, sceneYaw);

      const parent = point.depth < -30 ? lanternBackLayer : lanternLayer;

      if (button.parentNode !== parent) {
        parent.appendChild(button);
      }

      const screenY = rect.top + (point.y * rect.height) / 650;

      const edgeFade = Math.min(
        1,

        Math.max(0, (screenY + 90) / 90),

        Math.max(0, (H + 90 - screenY) / 90),
      );

      button.style.left = `${rect.left + (point.x * rect.width) / 900}px`;

      button.style.top = `${screenY}px`;

      button.style.setProperty(
        "--scale",
        Math.max(
          0.52,

          Math.min(
            1.7,

            point.scale * (0.84 + (index % 4) * 0.07),
          ),
        ).toFixed(3),
      );

      button.style.opacity = String(edgeFade * (point.depth < -30 ? 0.72 : 1));

      button.style.pointerEvents = edgeFade < 0.5 ? "none" : "auto";
    });
  }

  function smoothstep(a, b, x) {
    if (a === b) {
      return x < a ? 0 : 1;
    }

    const q = Math.min(1, Math.max(0, (x - a) / (b - a)));

    return q * q * (3 - 2 * q);
  }

  function updateCards(photoT) {
    cards.forEach((c, i) => {
      const r = c.route;

      const active = photoT - r.delay;

      if (active < 0) {
        c.el.style.opacity = "0";

        return;
      }

      const loopLen = r.duration + 5.2;

      const loop = active % loopLen;

      if (loop > r.duration) {
        c.el.style.opacity = "0";

        return;
      }

      const p = loop / r.duration;

      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

      const nx = r.from[0] + (r.to[0] - r.from[0]) * e;

      const ny = r.from[1] + (r.to[1] - r.from[1]) * e;

      const driftX = Math.sin(photoT * 0.82 + c.phase + i * 0.37) * 12;

      const driftY = Math.cos(photoT * 0.68 + c.phase * 1.4) * 10;

      const depth = Math.sin(photoT * 0.52 + c.phase) * 28;

      const x = nx * W + driftX;

      const y = ny * H + driftY;

      const fadeIn = smoothstep(0, 0.12, p);

      const fadeOut = 1 - smoothstep(0.79, 1, p);

      const opacity = Math.max(
        0,

        fadeIn * fadeOut * (0.63 + (r.z > -110 ? 0.22 : 0.08)),
      );

      const baseW = (W < 700 ? 74 : 108) * r.scale;

      const tiltY = r.ry + Math.sin(photoT * 0.58 + c.phase) * 8;

      const tiltX = Math.cos(photoT * 0.43 + c.phase) * 4;

      const rotate = r.rz + Math.sin(photoT * 0.47 + c.phase) * 2.5;

      const breathe = 1 + Math.sin(photoT * 0.72 + c.phase) * 0.025;

      c.el.style.width = `${baseW}px`;

      c.el.style.left = `${x}px`;

      c.el.style.top = `${y}px`;

      c.el.style.opacity = String(opacity);

      c.el.style.transform = `
          translate3d(
            -50%,
            -50%,
            ${r.z + depth}px
          )
          rotateX(${tiltX}deg)
          rotateY(${tiltY}deg)
          rotateZ(${rotate}deg)
          scale(${breathe})
        `;
    });
  }

  // =========================================================
  // MAIN PHOTO
  // =========================================================

  function setHero(index) {
    index =
      ((index % CFG.heroPhotos.length) + CFG.heroPhotos.length) %
      CFG.heroPhotos.length;

    if (heroIndex === index) {
      return;
    }

    heroIndex = index;

    heroPhoto.src = CFG.heroPhotos[index];
  }

  // =========================================================
  // TIMELINE
  // =========================================================

  function setPhase(name, now) {
    if (name === lastPhase) {
      return;
    }

    lastPhase = name;

    if (name === "three") {
      morph.morphTo(
        sampleText("3", {
          baseHue: 70,

          hueSpan: 90,

          light: 62,
        }),

        now,

        900,

        "edges",
      );
    } else if (name === "boom3") {
      morph.explode(now, "radial", 650);
    } else if (name === "two") {
      morph.morphTo(
        sampleText("2", {
          baseHue: 160,

          hueSpan: 90,

          light: 62,
        }),

        now,

        850,

        "edges",
      );
    } else if (name === "boom2") {
      morph.explode(now, "radial", 600);
    } else if (name === "one") {
      morph.morphTo(
        sampleText("1", {
          baseHue: 195,

          hueSpan: 80,

          light: 60,
        }),

        now,

        820,

        "edges",
      );
    } else if (name === "streak1") {
      morph.explode(now, "horizontal", 720);
    } else if (name === "date") {
      morph.morphTo(
        sampleText(CFG.dateText, {
          baseHue: 18,

          hueSpan: 75,

          light: 57,
        }),

        now,

        950,

        "edges",
      );
    } else if (name === "streakDate") {
      morph.explode(now, "horizontal", 850);
    } else if (name === "love") {
      morph.morphTo(
        sampleText(CFG.loveText, {
          baseHue: 155,

          hueSpan: 150,

          light: 61,
        }),

        now,

        980,

        "edges",
      );
    } else if (name === "boomLove") {
      morph.explode(now, "radial", 900);
    } else if (name === "pet") {
      morph.morphTo(
        sampleText(CFG.petNameText, {
          baseHue: 272,

          hueSpan: 95,

          light: 61,
        }),

        now,

        900,

        "edges",
      );
    } else if (name === "boomPet") {
      morph.explode(now, "horizontal", 1050);
    } else if (name === "photos") {
      photoStage.classList.remove("active");

      lanternStage.classList.add("active");

      lanternStage.setAttribute("aria-hidden", "false");

      fxCanvas.classList.add("photo-mode");

      matrixCanvas.classList.add("photo-mode");
    } else {
      lanternStage.classList.remove("active");

      lanternStage.setAttribute("aria-hidden", "true");

      closeMemory();

      fxCanvas.classList.remove("photo-mode");

      matrixCanvas.classList.remove("photo-mode");
    }
  }

  function timelinePhase(t) {
    if (t < 2.55) {
      return "three";
    }

    if (t < 3.15) {
      return "boom3";
    }

    if (t < 4.75) {
      return "two";
    }

    if (t < 5.35) {
      return "boom2";
    }

    if (t < 6.85) {
      return "one";
    }

    if (t < 7.55) {
      return "streak1";
    }

    if (t < 9.95) {
      return "date";
    }

    if (t < 11.15) {
      return "streakDate";
    }

    if (t < 14.25) {
      return "love";
    }

    if (t < 15.35) {
      return "boomLove";
    }

    if (t < 17.85) {
      return "pet";
    }

    if (t < 19.05) {
      return "boomPet";
    }

    return "photos";
  }

  // =========================================================
  // PHOTO SEQUENCE
  // =========================================================

  const PHOTO_START = 19.05;

  const PHOTO_CYCLE = 3.2;

  const PHOTO_DISSOLVE_AT = 2.28;

  function updatePhotoTimeline(t, now) {
    if (t < PHOTO_START) {
      photoStage.classList.remove("active");

      lanternStage.classList.remove("active");

      lanternStage.setAttribute("aria-hidden", "true");

      heroFrame.style.opacity = "0";

      photoFxAlpha = 1;

      return;
    }

    // Từ đây trở đi chuyển sang
    // scene cây + lồng đèn tương tác.

    photoStage.classList.remove("active");

    lanternStage.classList.add("active");

    lanternStage.setAttribute("aria-hidden", "false");

    heroFrame.style.opacity = "0";

    photoFxAlpha = 1 - smoothstep(PHOTO_START, PHOTO_START + 1.45, t);
  }

  // =========================================================
  // CONTROLS
  // =========================================================

  function restart(offset = 0) {
    lanternStage.classList.toggle("instant", offset >= PHOTO_START);

    sceneYaw = 0;

    paused = false;

    pausedAccum = 0;

    pauseStarted = 0;

    finished = false;

    timelineStart = performance.now() - offset * 1000;

    lastPhase = "";

    heroIndex = -1;

    photoCycle = -1;

    photoCycleStage = "";

    photoFxAlpha = 1;

    replayBtn.classList.remove("show");

    photoStage.classList.remove("active");

    lanternStage.classList.remove("active");

    lanternStage.setAttribute("aria-hidden", "true");

    closeMemory();

    fxCanvas.classList.remove("photo-mode");

    matrixCanvas.classList.remove("photo-mode");

    heroFrame.classList.remove("visible", "switching");

    heroFrame.style.opacity = "0";

    heroFrame.style.transform = "translate3d(-50%,-50%,65px) scale(.965)";

    heroPhoto.style.filter = "";

    cards.forEach((c) => {
      c.el.style.opacity = "0";
    });

    morph.items = [];
  }

  function startExperience() {
    if (!midAutumnHome || !startExperienceBtn) {
      restart(0);
      return;
    }

    startExperienceBtn.disabled = true;

    // Phát nhạc nền khi bấm BẮT ĐẦU
    const bgMusic = document.getElementById("bgMusic");

    if (bgMusic) {
      bgMusic.volume = 0.5;

      bgMusic.play().catch((err) => {
        console.log("Không thể phát nhạc nền:", err);
      });
    }

    // Khi bấm BẮT ĐẦU,
    // animation cũ reset chính xác về 0.
    restart(0);

    midAutumnHome.classList.add("is-leaving");

    window.setTimeout(() => {
      midAutumnHome.style.display = "none";
    }, 950);
  }

  if (startExperienceBtn) {
    startExperienceBtn.addEventListener("click", startExperience);
  }

  function togglePause() {
    if (finished) {
      return;
    }

    if (!paused) {
      paused = true;

      pauseStarted = performance.now();
    } else {
      const resumedAt = performance.now();

      paused = false;

      pausedAccum += resumedAt - pauseStarted;

      morph.start = shiftMorphStartAfterPause(
        morph.start,
        pauseStarted,
        resumedAt,
      );
    }
  }

  function fullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();

      togglePause();
    }

    if (e.key.toLowerCase() === "r") {
      restart(0);
    }

    if (e.key.toLowerCase() === "f") {
      fullscreen();
    }
  });

  replayBtn.addEventListener("click", () => restart(0));

  // =========================================================
  // MAIN LOOP
  // =========================================================

  let lastFrame = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);

    let dt = Math.min(0.05, (now - lastFrame) / 1000);

    lastFrame = now;

    if (paused) {
      drawMatrix(now, 0);

      morph.draw(getPausedMorphTime(now, paused, pauseStarted), photoFxAlpha);

      return;
    }

    const t = (now - timelineStart - pausedAccum) / 1000;

    drawMatrix(now, dt);

    const phase = timelinePhase(Math.max(0, t));

    setPhase(phase, now);

    updatePhotoTimeline(t, now);

    if (t >= PHOTO_START) {
      if (dragPointer === null && !memoryViewer.classList.contains("open")) {
        sceneYaw += dt * 0.12;
      }

      drawSakura(t - PHOTO_START, sceneYaw);

      updateLanterns(t - PHOTO_START);
    }

    morph.draw(
      now,

      t >= PHOTO_START ? photoFxAlpha : 1,
    );

    if (debug) {
      debugTime.textContent = `${t.toFixed(2)}s · ${phase} · ${morph.items.length} particles`;
    }

    if (t >= CFG.duration && !finished) {
      finished = true;

      replayBtn.classList.add("show");
    }
  }

  // =========================================================
  // START
  // =========================================================

  resize();

  Promise.all(imagePromises).finally(() => {
    restart(requestedStart);

    // ?t=20 vẫn dùng để debug:
    // bỏ qua trang chủ và nhảy thẳng tới cây.

    if (requestedStart > 0 && midAutumnHome) {
      midAutumnHome.style.display = "none";
    }

    requestAnimationFrame(frame);
  });
})();
