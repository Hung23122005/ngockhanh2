(() => {
  const { projectPoint } = window.Scene3D;

  const colors = ["#fff8fc", "#fbe4ef", "#f2cede", "#dfaeca"];

  function createRenderer(canvas) {
    const ctx = canvas.getContext("2d");

    const blossoms = window.Scene3D.createCanopyPoints(24500, 2026);

    const falling = window.SakuraScene.createBlossoms(115, 168).map(
      (petal, index) => ({
        ...petal,
        y: petal.y - 0.17,
        speed: 0.025 + (index % 7) * 0.006,
        sway: petal.angle,
        z: Math.sin(petal.angle * 3.8) * 180,
      }),
    );

    function line(from, to, width, color, yaw) {
      const a = projectPoint(from, yaw);

      const b = projectPoint(to, yaw);

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineWidth = (width * (a.scale + b.scale)) / 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = color;
      ctx.stroke();
    }

    function drawIsland(yaw) {
      const tip = projectPoint(
        {
          x: 0,
          y: 620,
          z: 0,
        },
        yaw,
      );

      const ring = Array.from({ length: 28 }, (_, index) => {
        const angle = (index * Math.PI * 2) / 28;

        return projectPoint(
          {
            x: Math.cos(angle) * (344 + Math.sin(index * 2.7) * 8),
            y: 446 + Math.sin(index * 1.9) * 5,
            z: Math.sin(angle) * (172 + Math.cos(index * 1.5) * 5),
          },
          yaw,
        );
      });

      ctx.fillStyle = "rgba(173, 101, 144, .10)";
      ctx.beginPath();
      ctx.ellipse(450, 597, 315, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      const facets = ring
        .map((point, index) => ({
          point,
          next: ring[(index + 1) % ring.length],
          index,
        }))
        .sort(
          (a, b) => a.point.depth + a.next.depth - b.point.depth - b.next.depth,
        );

      for (const facet of facets) {
        ctx.beginPath();
        ctx.moveTo(facet.point.x, facet.point.y);
        ctx.lineTo(facet.next.x, facet.next.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.closePath();

        ctx.fillStyle =
          facet.index % 3 === 0
            ? "#32242e"
            : facet.index % 3 === 1
              ? "#241b25"
              : "#17131d";

        ctx.fill();

        ctx.strokeStyle = "rgba(123, 72, 91, .26)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.beginPath();
      ring.forEach((point, index) => {
        if (index) {
          ctx.lineTo(point.x, point.y);
        } else {
          ctx.moveTo(point.x, point.y);
        }
      });
      ctx.closePath();

      const ground = ctx.createLinearGradient(0, 400, 0, 510);

      ground.addColorStop(0, "#77747a");
      ground.addColorStop(1, "#3c3941");

      ctx.fillStyle = ground;
      ctx.fill();

      ctx.strokeStyle = "#72616d";
      ctx.lineWidth = 3;
      ctx.stroke();

      for (let i = 0; i < 17; i++) {
        const angle = i * 2.4;
        const radius = 80 + (i % 5) * 48;

        const pebble = projectPoint(
          {
            x: Math.cos(angle) * radius,
            y: 438,
            z: Math.sin(angle) * radius * 0.45,
          },
          yaw,
        );

        ctx.fillStyle = i % 3 ? "#353039" : "#29252f";

        ctx.beginPath();
        ctx.ellipse(
          pebble.x,
          pebble.y,
          5 * pebble.scale,
          3 * pebble.scale,
          angle,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }

    function drawCanopyAura(yaw, time) {
      const anchors = [
        {
          p: { x: 0, y: 185, z: 0 },
          w: 340,
          h: 225,
          a: 0.07,
          ox: 0,
          oy: 0,
        },
        {
          p: { x: -115, y: 190, z: 28 },
          w: 210,
          h: 150,
          a: 0.055,
          ox: -12,
          oy: 6,
        },
        {
          p: { x: 115, y: 188, z: -18 },
          w: 205,
          h: 148,
          a: 0.055,
          ox: 12,
          oy: 8,
        },
        {
          p: { x: 0, y: 262, z: 68 },
          w: 230,
          h: 120,
          a: 0.04,
          ox: 0,
          oy: 12,
        },
      ];

      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      for (const anchor of anchors) {
        const pos = projectPoint(anchor.p, yaw);

        const pulse = 0.92 + Math.sin(time * 0.65 + pos.depth * 0.01) * 0.05;

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 196, 226, ${anchor.a})`;
        ctx.shadowColor = "rgba(255, 196, 226, 0.22)";
        ctx.shadowBlur = 28;
        ctx.ellipse(
          pos.x + anchor.ox,
          pos.y + anchor.oy,
          anchor.w * pos.scale * pulse,
          anchor.h * pos.scale * pulse,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      ctx.restore();
    }

    function drawTree(yaw) {
      line(
        {
          x: 0,
          y: 446,
          z: 0,
        },
        {
          x: 0,
          y: 287,
          z: 0,
        },
        36,
        "#3a1d25",
        yaw,
      );

      line(
        {
          x: -5,
          y: 434,
          z: 4,
        },
        {
          x: -4,
          y: 296,
          z: 4,
        },
        22,
        "#73434b",
        yaw,
      );

      const mainBranches = [
        { angle: -2.75, length: 150, y: 214 },
        { angle: -2.28, length: 175, y: 192 },
        { angle: -1.72, length: 142, y: 172 },
        { angle: -1.08, length: 158, y: 188 },
        { angle: -0.48, length: 184, y: 203 },
        { angle: 0.06, length: 150, y: 193 },
        { angle: 0.56, length: 180, y: 201 },
        { angle: 1.12, length: 156, y: 184 },
        { angle: 1.72, length: 145, y: 170 },
        { angle: 2.26, length: 174, y: 190 },
        { angle: 2.8, length: 152, y: 211 },
      ];

      for (let i = 0; i < mainBranches.length; i++) {
        const branch = mainBranches[i];

        const angle = branch.angle;

        const middleRadius = branch.length * 0.42;

        const middle = {
          x: Math.cos(angle) * middleRadius,
          y: 278 - (18 + (i % 3) * 8),
          z: Math.sin(angle) * middleRadius * 0.76,
        };

        const end = {
          x: Math.cos(angle) * branch.length,
          y: branch.y,
          z: Math.sin(angle) * branch.length * 0.76,
        };

        line(
          {
            x: 0,
            y: 306,
            z: 0,
          },
          middle,
          7.8,
          "#613138",
          yaw,
        );

        line(middle, end, 3.0, "#76444c", yaw);

        const side = i % 2 === 0 ? 1 : -1;

        const sideAngle = angle + side * 0.37;

        const sideStart = {
          x: middle.x * 0.38 + end.x * 0.62,
          y: middle.y * 0.38 + end.y * 0.62,
          z: middle.z * 0.38 + end.z * 0.62,
        };

        const sideEnd = {
          x: sideStart.x + Math.cos(sideAngle) * 38,
          y: sideStart.y - 21,
          z: sideStart.z + Math.sin(sideAngle) * 31,
        };

        line(sideStart, sideEnd, 1.9, "#7a4750", yaw);
      }

      line(
        {
          x: 0,
          y: 307,
          z: 0,
        },
        {
          x: -42,
          y: 151,
          z: -18,
        },
        4,
        "#6d3d46",
        yaw,
      );

      line(
        {
          x: 0,
          y: 307,
          z: 0,
        },
        {
          x: 49,
          y: 144,
          z: 16,
        },
        4,
        "#6d3d46",
        yaw,
      );

      line(
        {
          x: -3,
          y: 296,
          z: 0,
        },
        {
          x: 5,
          y: 128,
          z: 0,
        },
        3.3,
        "#693943",
        yaw,
      );
    }

    function drawBlossoms(yaw, time) {
      const stride = innerWidth < 720 ? 2 : 1;

      const projected = [];

      for (let index = 0; index < blossoms.length; index += stride) {
        const petal = blossoms[index];
        const pos = projectPoint(petal, yaw);

        projected.push({
          petal,
          pos,
        });
      }

      projected.sort((a, b) => a.pos.depth - b.pos.depth);

      for (const item of projected) {
        const petal = item.petal;
        const pos = item.pos;

        let multiplier = 1.52;

        if (petal.kind === "core") {
          multiplier = 1.62;
        } else if (petal.kind === "shell") {
          multiplier = 1.58;
        } else if (petal.kind === "droop") {
          multiplier = 1.6;
        } else if (petal.kind === "spray") {
          multiplier = 1.36;
        } else if (petal.kind === "spark") {
          multiplier = 1.1;
        }

        const size = petal.size * pos.scale * multiplier;

        if (petal.kind === "spark") {
          const twinkle = 0.58 + 0.42 * Math.sin(time * 2.2 + petal.twinkle);

          ctx.globalAlpha = petal.alpha * twinkle;

          ctx.fillStyle = "rgba(255,245,250,1)";

          ctx.beginPath();
          ctx.arc(pos.x, pos.y, Math.max(0.8, size * 0.28), 0, Math.PI * 2);
          ctx.fill();

          if (twinkle > 0.82) {
            ctx.globalAlpha = petal.alpha * 0.55 * twinkle;

            ctx.fillRect(pos.x - size * 0.9, pos.y - 0.7, size * 1.8, 1.4);

            ctx.fillRect(pos.x - 0.7, pos.y - size * 0.9, 1.4, size * 1.8);
          }

          continue;
        }

        ctx.globalAlpha = petal.alpha;
        ctx.fillStyle = colors[petal.shade];

        if (petal.kind === "spray") {
          ctx.fillRect(
            pos.x - size * 0.45,
            pos.y - size * 0.42,
            size * 1.12,
            size * 0.78,
          );
        } else if (petal.shade === 0) {
          ctx.fillRect(
            pos.x - size * 0.55,
            pos.y - size * 0.45,
            size * 1.52,
            size * 0.83,
          );
        } else if (petal.shade === 1) {
          ctx.fillRect(
            pos.x - size * 0.46,
            pos.y - size * 0.5,
            size * 1.18,
            size,
          );
        } else {
          ctx.fillRect(
            pos.x - size * 0.5,
            pos.y - size * 0.5,
            size * 1.38,
            size * 0.9,
          );
        }
      }

      ctx.globalAlpha = 1;
    }

    function drawBunnies(yaw) {
      const bunnies = [
        {
          x: -205,
          z: 22,
          color: "#9870bb",
        },
        {
          x: -102,
          z: 82,
          color: "#eee1f0",
        },
        {
          x: 135,
          z: 95,
          color: "#9362b2",
        },
        {
          x: 232,
          z: -5,
          color: "#f1e2f1",
        },
      ]
        .map((bunny) => ({
          ...bunny,
          pos: projectPoint(
            {
              x: bunny.x,
              y: 427,
              z: bunny.z,
            },
            yaw,
          ),
        }))
        .sort((a, b) => a.pos.depth - b.pos.depth);

      for (const bunny of bunnies) {
        const { x, y, scale } = bunny.pos;

        ctx.fillStyle = "rgba(15, 10, 20, .44)";
        ctx.beginPath();
        ctx.ellipse(
          x,
          y + 18 * scale,
          19 * scale,
          4 * scale,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        ctx.fillStyle = bunny.color;

        for (const offset of [-7, 7]) {
          ctx.beginPath();
          ctx.ellipse(
            x + offset * scale,
            y - 18 * scale,
            5.8 * scale,
            21 * scale,
            offset * 0.012,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }

        ctx.beginPath();
        ctx.ellipse(
          x,
          y + 10 * scale,
          16 * scale,
          20 * scale,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        ctx.fillStyle = "#2d1b35";
        ctx.beginPath();
        ctx.arc(x + 10 * scale, y + 3 * scale, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawFalling(time, yaw) {
      for (const petal of falling) {
        const position = window.SakuraScene.fallingPetalPosition(petal, time);

        const pos = projectPoint(
          {
            x: (position.x - 0.5) * 820,
            y: position.y * 650,
            z: petal.z,
          },
          yaw,
        );

        ctx.globalAlpha = petal.alpha * 0.82;
        ctx.fillStyle = colors[petal.shade];

        ctx.fillRect(
          pos.x,
          pos.y,
          petal.size * pos.scale * 1.6,
          petal.size * pos.scale,
        );
      }

      ctx.globalAlpha = 1;
    }

    return function drawScene(time, yaw) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawIsland(yaw);

      // aura phía sau
      drawCanopyAura(yaw, time);

      // cành trước, hoa sau để hoa che cành
      drawTree(yaw);

      drawBlossoms(yaw, time);

      drawBunnies(yaw);

      drawFalling(time, yaw);
    };
  }

  window.SakuraRenderer = {
    createRenderer,
  };
})();
