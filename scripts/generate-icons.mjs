// node scripts/generate-icons.mjs
// İkon boyutlarını oluşturur. Gereksinim: npm install -g sharp-cli
// VEYA bu script yerine https://realfavicongenerator.net sitesini kullanabilirsin.

// Manuel yol (tarayıcıda):
// 1. https://realfavicongenerator.net adresine git
// 2. Bir bina ikonu veya logonu yükle
// 3. İndirilen ZIP'ten icon-192.png, icon-512.png, icon-180.png, icon-152.png dosyalarını
//    public/icons/ klasörüne koy

console.log(`
İkon oluşturmak için:

SEÇENEK 1 (Kolay — tarayıcı):
  https://realfavicongenerator.net
  → Dosya yükle → İndir → public/icons/ klasörüne koy

SEÇENEK 2 (CLI — sharp kuruluysa):
  npx sharp-cli -i logo.png -o public/icons/icon-192.png resize 192 192
  npx sharp-cli -i logo.png -o public/icons/icon-512.png resize 512 512
  npx sharp-cli -i logo.png -o public/icons/icon-180.png resize 180 180
  npx sharp-cli -i logo.png -o public/icons/icon-152.png resize 152 152

SEÇENEK 3 (Hızlı — placeholder):
  Aşağıdaki komutu çalıştır:
  node scripts/generate-icons.mjs --placeholder
`);

if (process.argv.includes("--placeholder")) {
  // Sharp olmadan basit PNG oluştur
  const { createCanvas } = await import("canvas").catch(() => {
    console.log("canvas paketi yok, manuel ikon gerekiyor");
    process.exit(0);
  });

  const sizes = [152, 180, 192, 512];
  for (const size of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, "#1e40af");
    grad.addColorStop(1, "#1e3a8a");
    ctx.fillStyle = grad;
    ctx.roundRect(0, 0, size, size, size * 0.2);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = `bold ${size * 0.45}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("YT", size / 2, size / 2);
    const { writeFileSync } = await import("fs");
    const buf = canvas.toBuffer("image/png");
    writeFileSync(`public/icons/icon-${size}.png`, buf);
    console.log(`✓ icon-${size}.png oluşturuldu`);
  }
}
