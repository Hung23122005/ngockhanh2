window.LOVE_CONFIG = {
  duration: 32.5,
  dateText: "TRUNG THU 2026",
  loveText: "GỬI NGỌC KHÁNH",
  petNameText: "MÓN QUÀ NHỎ NÈ",
  // Portrait-oriented photos are used as the large center image.
  heroPhotos: [
    "assets/photos/1.jpeg",
    "assets/photos/2.jpeg",
    "assets/photos/3.jpeg",
    "assets/photos/5.jpeg",
    "assets/photos/13.jpeg",
    "assets/photos/14.jpeg",
    "assets/photos/15.jpeg",
    "assets/photos/4.jpeg",
  ],
  // All supplied images can appear as small floating memories.
  photos: Array.from(
    { length: 19 },
    (_, i) => `assets/photos/${String(i + 1).padStart(2, "0")}.jpeg`,
  ),
  particleLimitDesktop: 36000,
  particleLimitMobile: 16000,
  matrixDensity: 15,
  autoPlay: true,
};
