const test = require("node:test");
const assert = require("node:assert/strict");

const {
  enhanceParticleColor,
  getParticleGrid,
  getParticleImageRect,
  getParticlePhotoVisibility,
  getPausedMorphTime,
  getResizedPhotoCycle,
  shiftMorphStartAfterPause,
} = require("../particle-photo.js");

test("particle photo never reveals the original image", () => {
  for (const time of [0, 0.42, 1.15, 2.2, 3.05]) {
    const visibility = getParticlePhotoVisibility(time);

    assert.equal(visibility.photoAlpha, 0);
    assert.equal(visibility.particleAlpha, 1);
  }
});

test("particle grid stays within its limit and covers most of every cell", () => {
  const grid = getParticleGrid(430, 720, 36_000);

  assert.equal(grid.step, 3);
  assert.equal(grid.particleSize, 2.64);
  assert.ok(grid.columns * grid.rows <= 36_000);
  assert.ok(grid.particleSize / grid.step >= 0.88);
});

test("particle grid remains dense on a small mobile image", () => {
  const grid = getParticleGrid(250, 500, 16_000);

  assert.equal(grid.step, 3);
  assert.equal(grid.particleSize, 2.64);
  assert.ok(grid.columns * grid.rows <= 16_000);
});

test("particle colors stay recognizable against the dark background", () => {
  assert.deepEqual(enhanceParticleColor(40, 80, 120), [56, 108, 160]);
  assert.deepEqual(enhanceParticleColor(0, 0, 0), [4, 4, 4]);
  assert.deepEqual(enhanceParticleColor(240, 250, 255), [255, 255, 255]);
});

test("paused morphs render at the instant pause started", () => {
  assert.equal(getPausedMorphTime(8_000, true, 5_000), 5_000);
  assert.equal(getPausedMorphTime(8_000, false, 5_000), 8_000);
  assert.equal(shiftMorphStartAfterPause(1_000, 5_000, 8_000), 4_000);
});

test("resize rebuilds particles only while the photo phase is active", () => {
  assert.equal(getResizedPhotoCycle("photos", 4), -1);
  assert.equal(getResizedPhotoCycle("love", 4), 4);
});

test("particle image uses the larger centered desktop frame", () => {
  const rect = getParticleImageRect(1_440, 900, 300, 400);

  assert.ok(Math.abs(rect.x - 452.19375) < 0.001);
  assert.ok(Math.abs(rect.y - 92.925) < 0.001);
  assert.ok(Math.abs(rect.w - 535.6125) < 0.001);
  assert.ok(Math.abs(rect.h - 714.15) < 0.001);
});

test("landscape particle images receive the same 15 percent desktop growth", () => {
  const rect = getParticleImageRect(1_440, 900, 400, 300);

  assert.ok(Math.abs(rect.w - 563.04) < 0.001);
  assert.ok(Math.abs(rect.h - 422.28) < 0.001);
});

test("particle image grows on mobile without touching the screen edges", () => {
  const rect = getParticleImageRect(390, 844, 300, 400);

  assert.ok(Math.abs(rect.x - 55.965) < 0.001);
  assert.ok(Math.abs(rect.y - 236.62) < 0.001);
  assert.ok(Math.abs(rect.w - 278.07) < 0.001);
  assert.ok(Math.abs(rect.h - 370.76) < 0.001);
});
