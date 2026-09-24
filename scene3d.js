(() => {
  function projectPoint(point, yaw) {
    const cosine = Math.cos(yaw);
    const sine = Math.sin(yaw);

    const rotatedX = point.x * cosine - point.z * sine;

    const depth = point.x * sine + point.z * cosine;

    const scale = 1400 / (1400 - depth);

    return {
      x: 450 + rotatedX * scale,

      y: 325 + (point.y - 325 + depth * 0.13) * scale,

      depth,
      scale,
    };
  }

  function lanternOrbit(index, time) {
    const angle = index * 2.39996 + (time * Math.PI) / 16;

    const radius = 420 + (index % 5) * 57;

    const rise = (((time / 26 + index / 19) % 1) + 1) % 1;

    return {
      x: Math.cos(angle) * radius,

      y: 1000 - rise * 1500,

      z: Math.sin(angle) * radius,
    };
  }

  function yawFromDrag(currentYaw, deltaX, width) {
    return currentYaw + (deltaX / Math.max(1, width)) * Math.PI * 2;
  }

  function createRandom(seed) {
    let state = seed >>> 0;

    return function random() {
      state = (state + 0x6d2b79f5) >>> 0;

      let value = state;

      value = Math.imul(value ^ (value >>> 15), value | 1);

      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gaussian(random) {
    let u = 0;
    let v = 0;

    while (u === 0) {
      u = random();
    }

    while (v === 0) {
      v = random();
    }

    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function weightedPick(items, random) {
    let total = 0;

    for (const item of items) {
      total += item.weight;
    }

    let value = random() * total;

    for (const item of items) {
      value -= item.weight;
      if (value <= 0) {
        return item;
      }
    }

    return items[items.length - 1];
  }

  function createCanopyPoints(count, seed = 1) {
    const random = createRandom(seed);

    const points = [];

    // ========================================================
    // MỤC TIÊU FORM:
    //
    // - nhìn chính diện: bầu, tròn, mềm
    // - nhìn góc nghiêng / top-ish: vẫn tròn,
    //   không bị dẹp ngang
    // - có top crown
    // - có mép hoa tủa ra
    // - có phần dưới phủ nhẹ
    //
    // => cách xử lý:
    // - không chỉ dùng 2 lobe trái/phải
    // - thêm front/back lobe để cây có chiều sâu 3D
    // - rx và rz gần nhau hơn
    // ========================================================

    const coreCount = Math.floor(count * 0.34);

    const shellCount = Math.floor(count * 0.18);

    const sprayCount = Math.floor(count * 0.2);

    const droopCount = Math.floor(count * 0.06);

    const topCount = Math.floor(count * 0.12);

    const sparkleCount =
      count - coreCount - shellCount - sprayCount - droopCount - topCount;

    // ========================================================
    // CORE LOBES
    // 2 bên + giữa + trước/sau
    // trước/sau giúp quay góc vẫn tròn
    // ========================================================
    const coreLobes = [
      {
        x: -118,
        y: 205,
        z: 0,
        rx: 146,
        ry: 88,
        rz: 132,
        weight: 1.1,
        seed: 0.8,
      },
      {
        x: 118,
        y: 205,
        z: 0,
        rx: 146,
        ry: 88,
        rz: 132,
        weight: 1.1,
        seed: 1.6,
      },
      {
        x: 0,
        y: 198,
        z: 0,
        rx: 118,
        ry: 82,
        rz: 114,
        weight: 1.0,
        seed: 2.4,
      },
      {
        x: 0,
        y: 206,
        z: -92,
        rx: 118,
        ry: 82,
        rz: 120,
        weight: 0.82,
        seed: 3.2,
      },
      {
        x: 0,
        y: 206,
        z: 92,
        rx: 118,
        ry: 82,
        rz: 120,
        weight: 0.82,
        seed: 4.0,
      },
    ];

    // ========================================================
    // TOP LOBES
    // đỉnh cây
    // ========================================================
    const topLobes = [
      {
        x: 0,
        y: 124,
        z: 0,
        rx: 104,
        ry: 76,
        rz: 98,
        weight: 1.15,
        seed: 4.8,
      },
      {
        x: -34,
        y: 145,
        z: -16,
        rx: 66,
        ry: 50,
        rz: 62,
        weight: 0.42,
        seed: 5.5,
      },
      {
        x: 34,
        y: 145,
        z: 16,
        rx: 66,
        ry: 50,
        rz: 62,
        weight: 0.42,
        seed: 6.2,
      },
    ];

    // ========================================================
    // DROOP LOBES
    // phủ nhẹ phía dưới, không kéo dài quá
    // ========================================================
    const droopLobes = [
      {
        x: -76,
        y: 270,
        z: 24,
        rx: 112,
        ry: 46,
        rz: 92,
        weight: 0.88,
        seed: 6.9,
      },
      {
        x: 76,
        y: 270,
        z: 24,
        rx: 112,
        ry: 46,
        rz: 92,
        weight: 0.88,
        seed: 7.5,
      },
      {
        x: 0,
        y: 260,
        z: 0,
        rx: 88,
        ry: 42,
        rz: 84,
        weight: 0.7,
        seed: 8.1,
      },
      {
        x: 0,
        y: 266,
        z: -52,
        rx: 76,
        ry: 40,
        rz: 72,
        weight: 0.4,
        seed: 8.7,
      },
      {
        x: 0,
        y: 266,
        z: 52,
        rx: 76,
        ry: 40,
        rz: 72,
        weight: 0.4,
        seed: 9.3,
      },
    ];

    function sampleFromLobe(lobe, mode) {
      const theta = random() * Math.PI * 2;

      let vertical = gaussian(random) * 0.52;

      if (mode === "top") {
        vertical -= 0.22;
      }

      if (mode === "droop") {
        vertical += 0.24;
      }

      vertical = clamp(vertical, -1.15, 1.15);

      const planar = Math.sqrt(
        Math.max(0, 1 - Math.min(vertical * vertical, 1)),
      );

      let radial;

      if (mode === "core") {
        radial = Math.pow(random(), 0.52);
      } else if (mode === "shell") {
        radial = 0.78 + random() * 0.3;
      } else if (mode === "spray") {
        radial = 0.96 + Math.pow(random(), 1.8) * 0.52;
      } else if (mode === "droop") {
        radial = 0.7 + random() * 0.36;
      } else {
        radial = Math.pow(random(), 0.58);
      }

      const irregular =
        1 +
        Math.sin(theta * 3.2 + lobe.seed) * 0.07 +
        Math.cos(theta * 5.8 - lobe.seed * 0.7) * 0.04 +
        Math.sin(theta * 9.6 + lobe.seed * 1.1) * 0.02;

      let burst = 1;

      if (mode === "spray") {
        burst += Math.pow(random(), 1.9) * 0.32;
      }

      if (mode === "top") {
        burst += Math.pow(random(), 2.1) * 0.15;
      }

      let x =
        lobe.x +
        Math.cos(theta) * lobe.rx * planar * radial * irregular * burst;

      let z =
        lobe.z +
        Math.sin(theta) * lobe.rz * planar * radial * irregular * burst;

      let y = lobe.y + vertical * lobe.ry * radial;

      if (mode === "droop") {
        y += 8 + Math.pow(random(), 0.75) * 22;
      }

      if (mode === "top") {
        y -= 8 + Math.pow(random(), 0.85) * 18;
      }

      if (mode === "spray") {
        y += Math.sin(theta * 4.6) * 4;
      }

      x += gaussian(random) * 6;
      y += gaussian(random) * 6;
      z += gaussian(random) * 6;

      return { x, y, z };
    }

    function pushPoint({ x, y, z, size, alpha, shade, kind, twinkle = 0 }) {
      points.push({
        x,
        y,
        z,
        size,
        alpha,
        shade,
        kind,
        twinkle,
      });
    }

    // ========================================================
    // 1) CORE
    // ========================================================
    for (let i = 0; i < coreCount; i++) {
      const lobe = weightedPick(coreLobes, random);

      const point = sampleFromLobe(lobe, "core");

      pushPoint({
        x: point.x,
        y: point.y,
        z: point.z,
        size: 1.0 + random() * 2.5,
        alpha: 0.44 + random() * 0.46,
        shade: Math.floor(random() * 4),
        kind: "core",
      });
    }

    // ========================================================
    // 2) SHELL
    // ========================================================
    const shellSources = [...coreLobes, ...topLobes];

    for (let i = 0; i < shellCount; i++) {
      const lobe = weightedPick(shellSources, random);

      const point = sampleFromLobe(lobe, "shell");

      pushPoint({
        x: point.x,
        y: point.y,
        z: point.z,
        size: 0.9 + random() * 2.2,
        alpha: 0.3 + random() * 0.48,
        shade: Math.floor(random() * 4),
        kind: "shell",
      });
    }

    // ========================================================
    // 3) SPRAY
    // Mép ngoài tủa đều cả x và z
    // để góc nghiêng không bị dẹp
    // ========================================================
    const spraySources = [
      {
        x: -126,
        y: 205,
        z: 0,
        rx: 158,
        ry: 96,
        rz: 146,
        weight: 1.0,
        seed: 10.0,
      },
      {
        x: 126,
        y: 205,
        z: 0,
        rx: 158,
        ry: 96,
        rz: 146,
        weight: 1.0,
        seed: 10.7,
      },
      {
        x: 0,
        y: 202,
        z: -100,
        rx: 132,
        ry: 92,
        rz: 132,
        weight: 0.9,
        seed: 11.4,
      },
      {
        x: 0,
        y: 202,
        z: 100,
        rx: 132,
        ry: 92,
        rz: 132,
        weight: 0.9,
        seed: 12.1,
      },
      {
        x: 0,
        y: 126,
        z: 0,
        rx: 112,
        ry: 86,
        rz: 108,
        weight: 0.78,
        seed: 12.8,
      },
    ];

    for (let i = 0; i < sprayCount; i++) {
      const lobe = weightedPick(spraySources, random);

      const point = sampleFromLobe(lobe, "spray");

      pushPoint({
        x: point.x,
        y: point.y,
        z: point.z,
        size: 0.7 + random() * 1.95,
        alpha: 0.18 + random() * 0.4,
        shade: Math.floor(random() * 4),
        kind: "spray",
      });
    }

    // ========================================================
    // 4) DROOP
    // ========================================================
    for (let i = 0; i < droopCount; i++) {
      const lobe = weightedPick(droopLobes, random);

      const point = sampleFromLobe(lobe, "droop");

      pushPoint({
        x: point.x,
        y: point.y,
        z: point.z,
        size: 0.92 + random() * 2.1,
        alpha: 0.3 + random() * 0.46,
        shade: Math.floor(random() * 4),
        kind: "droop",
      });
    }

    // ========================================================
    // 5) TOP
    // ========================================================
    for (let i = 0; i < topCount; i++) {
      const lobe = weightedPick(topLobes, random);

      const point = sampleFromLobe(lobe, "top");

      pushPoint({
        x: point.x,
        y: point.y,
        z: point.z,
        size: 0.95 + random() * 2.25,
        alpha: 0.34 + random() * 0.5,
        shade: Math.floor(random() * 4),
        kind: "top",
      });
    }

    // ========================================================
    // 6) SPARK
    // hạt sáng bao quanh canopy
    // cũng để vòng này bầu hơn theo z
    // ========================================================
    for (let i = 0; i < sparkleCount; i++) {
      const theta = random() * Math.PI * 2;

      const radius = 250 + Math.pow(random(), 1.7) * 120;

      const depthStretch = 0.9 + random() * 0.16;

      const x = Math.cos(theta) * radius + gaussian(random) * 12;

      const z = Math.sin(theta) * radius * depthStretch + gaussian(random) * 12;

      const y = 190 + gaussian(random) * 84;

      pushPoint({
        x,
        y,
        z,
        size: 0.75 + random() * 1.65,
        alpha: 0.14 + random() * 0.26,
        shade: 0,
        kind: "spark",
        twinkle: random() * Math.PI * 2,
      });
    }

    return points;
  }

  const api = {
    projectPoint,
    lanternOrbit,
    yawFromDrag,
    createCanopyPoints,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (typeof window !== "undefined") {
    window.Scene3D = api;
  }
})();
