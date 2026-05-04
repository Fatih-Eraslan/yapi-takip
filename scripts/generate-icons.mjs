import sharp from "sharp";
import { mkdirSync } from "fs";

mkdirSync("public/icons", { recursive: true });

function buildingSvg(size) {
  const s = size;
  const pad = Math.round(s * 0.12);
  const w = s - pad * 2;

  const bldgW = Math.round(w * 0.62);
  const bldgH = Math.round(w * 0.58);
  const bldgX = pad + Math.round((w - bldgW) / 2);
  const bldgY = pad + Math.round(w * 0.22);

  const smW = Math.round(w * 0.26);
  const smH = Math.round(bldgH * 0.62);
  const smX = pad + Math.round(w * 0.04);
  const smY = bldgY + bldgH - smH;

  const groundY = bldgY + bldgH;

  const winW = Math.round(bldgW * 0.14);
  const winH = Math.round(bldgH * 0.14);
  const colGap = Math.round(bldgW / 4);
  const rowGap = Math.round(bldgH / 4);
  const winColor = "#bfdbfe";
  const winDim = "#1e40af";

  let windows = "";
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const wx = bldgX + colGap * (col + 0.5) - winW / 2;
      const wy = bldgY + rowGap * (row + 0.5) - winH / 2;
      const lit = (row === 0 && col === 1) || (row === 1 && col === 0) || (row === 2 && col === 2);
      windows += `<rect x="${Math.round(wx)}" y="${Math.round(wy)}" width="${winW}" height="${winH}" rx="${Math.round(winW * 0.25)}" fill="${lit ? winColor : winDim}" opacity="${lit ? 1 : 0.55}"/>`;
    }
  }

  const swW = Math.round(smW * 0.22);
  const swH = Math.round(smH * 0.18);
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const wx = smX + (smW / 3) * (col + 0.5) - swW / 2;
      const wy = smY + (smH / 3) * (row + 0.5) - swH / 2;
      windows += `<rect x="${Math.round(wx)}" y="${Math.round(wy)}" width="${swW}" height="${swH}" rx="${Math.round(swW * 0.25)}" fill="${winColor}" opacity="0.7"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1d4ed8"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
    <linearGradient id="bldg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#eff6ff"/>
      <stop offset="100%" stop-color="#dbeafe"/>
    </linearGradient>
    <linearGradient id="sm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e0f2fe"/>
      <stop offset="100%" stop-color="#bae6fd"/>
    </linearGradient>
  </defs>
  <rect width="${s}" height="${s}" rx="${Math.round(s * 0.2)}" fill="url(#bg)"/>
  <rect x="${pad}" y="${groundY}" width="${w}" height="${Math.round(s * 0.04)}" rx="${Math.round(s * 0.02)}" fill="#93c5fd" opacity="0.4"/>
  <rect x="${smX}" y="${smY}" width="${smW}" height="${smH}" rx="${Math.round(smW * 0.06)}" fill="url(#sm)"/>
  <rect x="${bldgX}" y="${bldgY}" width="${bldgW}" height="${bldgH}" rx="${Math.round(bldgW * 0.05)}" fill="url(#bldg)"/>
  <rect x="${bldgX - Math.round(bldgW * 0.04)}" y="${bldgY - Math.round(bldgH * 0.07)}" width="${bldgW + Math.round(bldgW * 0.08)}" height="${Math.round(bldgH * 0.07)}" rx="${Math.round(bldgW * 0.03)}" fill="#93c5fd"/>
  ${windows}
</svg>`;
}

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-180.png", size: 180 },
  { name: "icon-32.png", size: 32 },
  { name: "icon-16.png", size: 16 },
];

for (const { name, size } of sizes) {
  const svg = buildingSvg(size);
  await sharp(Buffer.from(svg)).png().toFile(`public/icons/${name}`);
  console.log(`✓ public/icons/${name}`);
}

await sharp(Buffer.from(buildingSvg(32))).png().toFile("public/favicon.png");
console.log("✓ public/favicon.png");
console.log("Tüm ikonlar oluşturuldu!");
