(function exposeParticlePhoto(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.ParticlePhoto = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  function getParticleGrid(width, height, limit) {
    const safeWidth = Math.max(1, Math.floor(width));
    const safeHeight = Math.max(1, Math.floor(height));
    const safeLimit = Math.max(1, Math.floor(limit));
    let step = Math.max(
      2,
      Math.ceil(Math.sqrt((safeWidth * safeHeight) / safeLimit)),
    );

    while (
      Math.ceil(safeWidth / step) * Math.ceil(safeHeight / step) >
      safeLimit
    ) {
      step += 1;
    }

    return {
      step,
      particleSize: Math.max(2, step * 0.88),
      columns: Math.ceil(safeWidth / step),
      rows: Math.ceil(safeHeight / step),
    };
  }

  function getParticleImageRect(
    viewportWidth,
    viewportHeight,
    imageWidth,
    imageHeight,
  ) {
    const mobile = viewportWidth < 700;
    const sizeBoost = 1.15;
    const maxWidth = viewportWidth * (mobile ? 0.62 : 0.34) * sizeBoost;
    const maxHeight = viewportHeight * (mobile ? 0.63 : 0.69) * sizeBoost;
    const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
    const width = imageWidth * scale;
    const height = imageHeight * scale;

    return {
      x: (viewportWidth - width) / 2,
      y: (viewportHeight - height) / 2,
      w: width,
      h: height,
    };
  }

  function getParticlePhotoVisibility() {
    return {
      photoAlpha: 0,
      particleAlpha: 1,
    };
  }

  function enhanceParticleColor(red, green, blue) {
    const enhance = (channel) => {
      const brightened = channel * 1.2 + 12;
      const contrasted = (brightened - 108) * 1.08 + 108;

      return Math.min(255, Math.max(0, Math.round(contrasted)));
    };

    return [enhance(red), enhance(green), enhance(blue)];
  }

  function getPausedMorphTime(now, paused, pauseStarted) {
    return paused ? pauseStarted : now;
  }

  function shiftMorphStartAfterPause(morphStart, pauseStarted, resumedAt) {
    return morphStart + Math.max(0, resumedAt - pauseStarted);
  }

  function getResizedPhotoCycle(phase, currentCycle) {
    return phase === "photos" ? -1 : currentCycle;
  }

  return {
    enhanceParticleColor,
    getParticleGrid,
    getParticleImageRect,
    getParticlePhotoVisibility,
    getPausedMorphTime,
    getResizedPhotoCycle,
    shiftMorphStartAfterPause,
  };
});
