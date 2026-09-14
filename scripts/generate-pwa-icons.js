const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Write SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14b8a6" />
      <stop offset="50%" stop-color="#0d9488" />
      <stop offset="100%" stop-color="#0f766e" />
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#ccfbf1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#042f2e" flood-opacity="0.35" />
    </filter>
  </defs>
  
  <!-- Squircle Background -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  
  <!-- Canopy / Umbrella Arc and Symbol -->
  <g filter="url(#shadow)" fill="none" stroke="url(#glowGrad)" stroke-linecap="round" stroke-linejoin="round">
    <!-- Canopy Roof -->
    <path d="M 120 270 C 120 160, 392 160, 392 270 C 340 250, 310 250, 256 262 C 202 250, 172 250, 120 270 Z" fill="url(#glowGrad)" stroke-width="4" />
    
    <!-- Canopy Stem and Hook -->
    <path d="M 256 262 L 256 360 C 256 385, 230 385, 220 375" stroke="#ffffff" stroke-width="20" />
    
    <!-- Top Finial -->
    <path d="M 256 160 L 256 135" stroke="#ffffff" stroke-width="16" />
    
    <!-- Central Mind / Core Sparkle -->
    <circle cx="256" cy="215" r="14" fill="#0d9488" stroke="#ffffff" stroke-width="8" />
  </g>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent, 'utf-8');

// 2. Pure Node.js PNG Generator
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crc ^ buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ (-1)) >>> 0;
}

function makePng(width, height, drawPixel) {
  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y, width, height);
      const idx = y * rowSize + 1 + x * 4;
      raw[idx] = r;
      raw[idx+1] = g;
      raw[idx+2] = b;
      raw[idx+3] = a;
    }
  }
  const idatData = zlib.deflateSync(raw, { level: 9 });
  
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const c = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(c, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function renderSayebanIcon(size, isMaskable = false) {
  return makePng(size, size, (x, y, w, h) => {
    const nx = x / w;
    const ny = y / h;
    
    // Background corner radius
    const cx = Math.abs(nx - 0.5);
    const cy = Math.abs(ny - 0.5);
    const cornerR = isMaskable ? 0.5 : 0.22;
    
    let inBg = true;
    if (!isMaskable) {
      const qx = Math.max(0, cx - (0.5 - cornerR));
      const qy = Math.max(0, cy - (0.5 - cornerR));
      if (qx * qx + qy * qy > cornerR * cornerR) {
        inBg = false;
      }
    }
    
    if (!inBg) return [0, 0, 0, 0];

    // Teal gradient background (#14b8a6 to #0f766e)
    const t = (nx + ny) / 2;
    let r = Math.round(20 * (1 - t) + 15 * t);
    let g = Math.round(184 * (1 - t) + 118 * t);
    let b = Math.round(166 * (1 - t) + 110 * t);
    let a = 255;

    // Draw central canopy icon
    const scale = isMaskable ? 0.75 : 0.9;
    const px = (nx - 0.5) / scale + 0.5;
    const py = (ny - 0.5) / scale + 0.5;

    const dx = px - 0.5;
    const dy = py - 0.5;

    // Stem: x around 0.5, y between 0.50 and 0.72
    const stemDistX = Math.abs(px - 0.5);
    if (stemDistX < 0.022 && py >= 0.50 && py <= 0.72) {
      return [255, 255, 255, 255];
    }
    // Hook at bottom: circle center (0.47, 0.72), radius 0.03
    const hookDx = px - 0.47;
    const hookDy = py - 0.72;
    const hookDist = Math.sqrt(hookDx*hookDx + hookDy*hookDy);
    if (hookDist <= 0.035 && hookDist >= 0.015 && (py >= 0.70 || px <= 0.47)) {
      return [255, 255, 255, 255];
    }

    // Top finial
    if (stemDistX < 0.016 && py >= 0.26 && py <= 0.31) {
      return [255, 255, 255, 255];
    }

    // Canopy dome: y between 0.31 and 0.54, parabolic/elliptical arch
    if (py >= 0.31 && py <= 0.54) {
      const domeY = (py - 0.31) / 0.23;
      const maxHalfW = 0.28 * Math.sqrt(Math.max(0, 1 - Math.pow(1 - domeY, 2.2)));
      const bottomCut = 0.52 - 0.03 * Math.cos(dx * Math.PI * 4);
      if (Math.abs(dx) <= maxHalfW && py <= bottomCut) {
        const dotDist = Math.sqrt(dx*dx + (py - 0.42)*(py - 0.42));
        if (dotDist < 0.028) {
          return [13, 148, 136, 255]; // teal center
        }
        return [255, 255, 255, 255]; // white canopy
      }
    }

    return [r, g, b, a];
  });
}

console.log('Generating PWA PNG icons...');
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), renderSayebanIcon(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), renderSayebanIcon(512));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), renderSayebanIcon(180));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512.png'), renderSayebanIcon(512, true));
console.log('PWA icons created successfully!');
