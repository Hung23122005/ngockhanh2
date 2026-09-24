const test = require('node:test');
const assert = require('node:assert/strict');

const { projectPoint, lanternOrbit, yawFromDrag, createCanopyPoints } = require('../scene3d.js');

test('a point makes a complete turn and moves behind the tree at half a turn', () => {
  const point = { x: 200, y: 300, z: 0 };
  const front = projectPoint(point, 0);
  const side = projectPoint(point, Math.PI / 2);
  const back = projectPoint(point, Math.PI);
  const full = projectPoint(point, Math.PI * 2);

  assert.ok(front.x > 450);
  assert.ok(Math.abs(side.x - 450) < 0.001);
  assert.ok(back.x < 450);
  assert.ok(side.depth > front.depth);
  assert.ok(Math.abs(full.x - front.x) < 0.001);
  assert.ok(Math.abs(full.y - front.y) < 0.001);
});

test('lanterns travel around the tree and return to their starting point', () => {
  const start = lanternOrbit(3, 0);
  const opposite = lanternOrbit(3, 16);
  const complete = lanternOrbit(3, 32);

  assert.ok(start.x * opposite.x + start.z * opposite.z < 0);
  assert.ok(Math.abs(start.x - complete.x) < 0.001);
  assert.ok(Math.abs(start.z - complete.z) < 0.001);
  assert.notDeepEqual(lanternOrbit(3, 0), lanternOrbit(4, 0));
});

test('dragging across the scene allows a full turn', () => {
  assert.ok(Math.abs(yawFromDrag(0, 300, 300) - Math.PI * 2) < 0.001);
  assert.ok(Math.abs(yawFromDrag(Math.PI, -150, 300)) < 0.001);
});

test('lanterns rise slowly through the screen and restart below it', () => {
  const start = lanternOrbit(0, 0);
  const later = lanternOrbit(0, 2);
  const nearTop = lanternOrbit(0, 25.9);
  const restarted = lanternOrbit(0, 26);

  assert.ok(start.y > 900);
  assert.ok(later.y < start.y && later.y > 700);
  assert.ok(nearTop.y < -400);
  assert.ok(Math.abs(restarted.y - start.y) < 0.001);
  assert.notEqual(lanternOrbit(0, 0).y, lanternOrbit(1, 0).y);
});

test('the blossom crown tapers at the top from both front and side views', () => {
  const points = createCanopyPoints(5000, 42);
  assert.deepEqual(points, createCanopyPoints(5000, 42));
  assert.equal(points.length, 5000);

  for (const yaw of [0, Math.PI / 2]) {
    const top = points.filter((point) => point.y < 115).map((point) => Math.abs(projectPoint(point, yaw).x - 450));
    const middle = points.filter((point) => point.y > 180 && point.y < 250).map((point) => Math.abs(projectPoint(point, yaw).x - 450));
    assert.ok(top.length > 100);
    assert.ok(Math.max(...top) < Math.max(...middle) * 0.9);
  }
});
