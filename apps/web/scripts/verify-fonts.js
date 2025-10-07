const fs = require('fs');
const req = [
  'src/app/assets/fonts/inter/Inter-Variable.woff2',
  'src/app/assets/fonts/cinzel/Cinzel-Variable.woff2',
];

let ok = true;
for (const p of req) {
  try {
    const s = fs.statSync(p);
    if (!s.isFile() || s.size === 0) {
      console.error('❌ Font missing or empty:', p);
      ok = false;
    }
  } catch {
    console.error('❌ Font not found:', p);
    ok = false;
  }
}
if (!ok) process.exit(1);
console.log('✅ Fonts present and non-empty.');
