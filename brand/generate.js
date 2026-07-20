// Tone brand-kit generator.
// Rebuilds every SVG/PNG/ICO asset from the vector definition of the logo:
//   node brand/generate.js
// The mark is a mic capsule with a waveform cut out of it, sitting in a
// cradle — cream (#F7F3E9) on near-black (#0D0D0C), per the master logo.

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const CREAM = "#F7F3E9";
const BLACK = "#0D0D0C";

const OUT = __dirname;
const SVG_DIR = path.join(OUT, "svg");
const PNG_DIR = path.join(OUT, "png");
for (const d of [SVG_DIR, PNG_DIR]) fs.mkdirSync(d, { recursive: true });

// ---------- path helpers ----------

const rr = (x, y, w, h, r) =>
  `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} ` +
  `A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} ` +
  `V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`;

// counter-clockwise rounded rect — a hole under fill-rule nonzero
const rrCCW = (x, y, w, h, r) =>
  `M${x + r},${y} A${r},${r} 0 0 0 ${x},${y + r} V${y + h - r} A${r},${r} 0 0 0 ${x + r},${y + h} ` +
  `H${x + w - r} A${r},${r} 0 0 0 ${x + w},${y + h - r} V${y + r} A${r},${r} 0 0 0 ${x + w - r},${y} Z`;

// ---------- the mark (viewBox coords 0..1024, drawn 292..732 x, 190..910 y) ----------

// Mic capsule (stadium) with waveform bars punched out (fill-rule evenodd).
const capsule = rr(352, 190, 320, 450, 160);
const bars = [
  [359, 330, 500],
  [405, 260, 560],
  [451, 300, 610],
  [497, 230, 540],
  [543, 290, 620],
  [589, 250, 560],
  [635, 320, 510],
]
  .map(([x, y1, y2]) => rr(x, y1, 30, y2 - y1, 15))
  .join(" ");

function markGroup(color) {
  return `
  <g>
    <path fill="${color}" fill-rule="evenodd" d="${capsule} ${bars}"/>
    <path fill="none" stroke="${color}" stroke-width="44" stroke-linecap="round"
      d="M292,500 A220,220 0 0 0 732,500"/>
    <path fill="${color}" d="${rr(494, 730, 36, 140, 8)} ${rr(402, 870, 220, 40, 10)}"/>
  </g>`;
}

// ---------- the wordmark: T O N E as filled paths (no font dependency) ----------

function wordmarkGroup(color) {
  const t = 38; // stroke thickness
  const H = 140; // cap height
  let x = 0;
  const parts = [];
  // T (124 wide)
  parts.push(rr(x, 0, 124, t, 6), rr(x + 43, 0, t, H, 6));
  x += 124 + 38;
  // O (136 wide) — ring via nonzero winding (inner path reversed)
  parts.push(rr(x, 0, 136, H, 46), rrCCW(x + t, t, 136 - 2 * t, H - 2 * t, 24));
  x += 136 + 38;
  // N (124 wide)
  parts.push(
    rr(x, 0, t, H, 6),
    rr(x + 86, 0, t, H, 6),
    `M${x},0 L${x + t},0 L${x + 124},${H} L${x + 124 - t},${H} Z`
  );
  x += 124 + 38;
  // E (114 wide)
  parts.push(
    rr(x, 0, t, H, 6),
    rr(x, 0, 114, t, 6),
    rr(x, 51, 98, t, 6),
    rr(x, 102, 114, t, 6)
  );
  return `<path fill="${color}" d="${parts.join(" ")}"/>`;
}
const WORDMARK_W = 124 + 38 + 136 + 38 + 124 + 38 + 114; // 612

// ---------- SVG documents ----------

const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}\n</svg>\n`;

// Full lockup on a 1024 square (mark on top, TONE below)
function lockupBody(color, bg) {
  return `${bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ""}
  <g transform="translate(204.8,60) scale(0.6)">${markGroup(color)}</g>
  <g transform="translate(${512 - (WORDMARK_W * 0.72) / 2},690) scale(0.72)">${wordmarkGroup(color)}</g>`;
}

// Mark centered on a 1024 square
function markBody(color, bg) {
  return `${bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ""}
  <g transform="translate(0,-38)">${markGroup(color)}</g>`;
}

const files = {
  "tone-logo-dark.svg": svg(1024, 1024, lockupBody(CREAM, BLACK)), // master
  "tone-logo-cream.svg": svg(1024, 1024, lockupBody(CREAM, null)), // for dark surfaces
  "tone-logo-black.svg": svg(1024, 1024, lockupBody(BLACK, null)), // for light surfaces
  "tone-mark.svg": svg(1024, 1024, markBody(CREAM, null)),
  "tone-mark-black.svg": svg(1024, 1024, markBody(BLACK, null)),
  "tone-mark-on-dark.svg": svg(1024, 1024, markBody(CREAM, BLACK)), // app icon
  "tone-wordmark-cream.svg": svg(WORDMARK_W, 140, wordmarkGroup(CREAM)),
  "tone-wordmark-black.svg": svg(WORDMARK_W, 140, wordmarkGroup(BLACK)),
  // OG / social card 1200x630 — lockup centered on black
  "tone-og.svg": svg(
    1200,
    630,
    `<rect width="1200" height="630" fill="${BLACK}"/>
  <g transform="translate(190.4,-71) scale(0.8)">${lockupBody(CREAM, null)}</g>`
  ),
  // Maskable icon: mark shrunk into the 80% safe zone, full-bleed black
  "tone-maskable.svg": svg(
    1024,
    1024,
    `<rect width="1024" height="1024" fill="${BLACK}"/>
  <g transform="translate(153.6,153.6) scale(0.7)"><g transform="translate(0,-38)">${markGroup(CREAM)}</g></g>`
  ),
};

for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(SVG_DIR, name), content);
}

// ---------- rasterize ----------

async function png(svgName, outName, w, h = w) {
  const buf = fs.readFileSync(path.join(SVG_DIR, svgName));
  await sharp(buf).resize(w, h).png().toFile(path.join(PNG_DIR, outName));
}

(async () => {
  const iconSizes = [16, 32, 48, 64, 128, 256, 512, 1024];
  for (const s of iconSizes) {
    await png("tone-mark-on-dark.svg", `icon-${s}.png`, s);
  }
  await png("tone-mark-on-dark.svg", "apple-touch-icon.png", 180);
  await png("tone-maskable.svg", "maskable-512.png", 512);
  await png("tone-mark-on-dark.svg", "android-chrome-192.png", 192);
  await png("tone-maskable.svg", "android-chrome-512.png", 512);
  await png("tone-logo-dark.svg", "tone-logo-1024.png", 1024);
  await png("tone-logo-cream.svg", "tone-logo-transparent-1024.png", 1024);
  await png("tone-logo-black.svg", "tone-logo-light-1024.png", 1024);
  await png("tone-og.svg", "og-image.png", 1200, 630);

  const { default: pngToIco } = await import("png-to-ico");
  const ico = await pngToIco(
    [16, 32, 48].map((s) => path.join(PNG_DIR, `icon-${s}.png`))
  );
  fs.writeFileSync(path.join(OUT, "favicon.ico"), ico);

  console.log("Brand kit generated:", SVG_DIR, PNG_DIR);
})();
