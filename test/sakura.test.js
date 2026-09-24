const test = require('node:test');
const assert = require('node:assert/strict');

const { createBlossoms, fallingPetalPosition } = require('../sakura.js');

test('blossom layout is stable between redraws and covers both sides of the crown', () => {
  const first = createBlossoms(1800, 42);
  const second = createBlossoms(1800, 42);

  assert.deepEqual(first, second);
  assert.equal(first.length, 1800);
  assert.ok(first.some((petal) => petal.x < 0.25));
  assert.ok(first.some((petal) => petal.x > 0.75));
  assert.ok(first.every((petal) => petal.x >= 0 && petal.x <= 1 && petal.y >= 0 && petal.y < 0.65));
});

test('falling petals wrap back above the island after crossing the scene', () => {
  const petal = { x: 0.4, y: 0.1, speed: 0.2, sway: 0 };
  const start = fallingPetalPosition(petal, 0);
  const later = fallingPetalPosition(petal, 4);

  assert.ok(Math.abs(start.y - 0.1) < 1e-9);
  assert.ok(later.y < 0.1);
  assert.ok(later.y >= -0.1 && later.y < 0.7);
});
