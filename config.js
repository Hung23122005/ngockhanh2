window.LOVE_CONFIG = {
  duration: 32.5,
  dateText: "TRUNG THU 2026",
  loveText: "GỬI NGỌC KHÁNH",
  petNameText: "MÓN QUÀ NHỎ NÈ",
  // Portrait-oriented photos are used as the large center image.
  heroPhotos: [
    "assets/photos/01.jpeg",
    "assets/photos/02.jpeg",
    "assets/photos/03.jpeg",
    "assets/photos/05.jpeg",
    "assets/photos/13.jpeg",
    "assets/photos/14.jpeg",
    "assets/photos/15.jpeg",
    "assets/photos/17.jpeg",
    "assets/photos/19.jpeg",
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
