function createBlossoms(count, seed = 1) {
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const lobes = [
    [0.31, 0.31, 0.18, 0.16],
    [0.45, 0.23, 0.19, 0.19],
    [0.61, 0.24, 0.19, 0.18],
    [0.73, 0.32, 0.15, 0.15],
    [0.52, 0.37, 0.23, 0.12],
  ];

  return Array.from({ length: count }, () => {
    const [cx, cy, rx, ry] = lobes[Math.floor(random() * lobes.length)];
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random());
    return {
      x: Math.max(0, Math.min(1, cx + Math.cos(angle) * radius * rx)),
      y: Math.max(0, Math.min(0.64, cy + Math.sin(angle) * radius * ry)),
      size: 0.8 + random() * 2.4,
      alpha: 0.28 + random() * 0.62,
      shade: Math.floor(random() * 4),
      angle: random() * Math.PI * 2,
    };
  });
}

function fallingPetalPosition(petal, time) {
  const range = 0.85;
  const y = (((petal.y + 0.1 + time * petal.speed) % range) + range) % range - 0.1;
  return {
    x: petal.x + Math.sin(time * 1.2 + petal.sway) * 0.025,
    y,
  };
}

const api = { createBlossoms, fallingPetalPosition };

if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.SakuraScene = api;
