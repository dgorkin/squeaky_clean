// Generate minimal PNG icons for PWA
const fs = require('fs');

// Simple PNG generator for solid color icons with basic shapes
function createPNG(size) {
  // Create a minimal valid PNG with a green background
  const { createCanvas } = (() => {
    // We'll create raw PNG data manually for a simple solid-color icon
    // PNG structure: signature + IHDR + IDAT + IEND

    function crc32(buf) {
      let c = 0xffffffff;
      const table = new Int32Array(256);
      for (let n = 0; n < 256; n++) {
        let v = n;
        for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
        table[n] = v;
      }
      for (let i = 0; i < buf.length; i++) {
        c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
      }
      return (c ^ 0xffffffff) >>> 0;
    }

    function chunk(type, data) {
      const typeData = Buffer.concat([Buffer.from(type), data]);
      const len = Buffer.alloc(4);
      len.writeUInt32BE(data.length);
      const crc = Buffer.alloc(4);
      crc.writeUInt32BE(crc32(typeData));
      return Buffer.concat([len, typeData, crc]);
    }

    function deflateRaw(data) {
      const zlib = require('zlib');
      return zlib.deflateSync(data);
    }

    return {
      createCanvas: () => ({
        generate: () => {
          const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

          // IHDR
          const ihdr = Buffer.alloc(13);
          ihdr.writeUInt32BE(size, 0);
          ihdr.writeUInt32BE(size, 4);
          ihdr[8] = 8; // bit depth
          ihdr[9] = 2; // RGB
          ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

          // Image data: green background with white house shape
          const rowLen = 1 + size * 3; // filter byte + RGB per pixel
          const rawData = Buffer.alloc(rowLen * size);
          const cx = size / 2;
          const cy = size / 2;
          const r = size * 0.42; // radius for rounded rect area

          for (let y = 0; y < size; y++) {
            const rowOffset = y * rowLen;
            rawData[rowOffset] = 0; // no filter

            for (let x = 0; x < size; x++) {
              const px = rowOffset + 1 + x * 3;
              const dx = x - cx;
              const dy = y - cy;

              // Default: emerald green background (#10b981)
              let R = 16, G = 185, B = 129;

              // Rounded rect check (approximate)
              const margin = size * 0.05;
              const cornerR = size * 0.18;
              const inRect = x >= margin && x < size - margin && y >= margin && y < size - margin;

              if (!inRect) {
                R = 16; G = 185; B = 129;
              }

              // White house shape
              const houseBottom = cy + size * 0.2;
              const houseTop = cy - size * 0.05;
              const houseLeft = cx - size * 0.28;
              const houseRight = cx + size * 0.28;

              // Roof (triangle)
              const roofPeak = cy - size * 0.3;
              const roofLeft = cx - size * 0.35;
              const roofRight = cx + size * 0.35;
              const roofBottom = houseTop + size * 0.05;

              if (y >= roofPeak && y <= roofBottom) {
                const t = (y - roofPeak) / (roofBottom - roofPeak);
                const leftEdge = cx - t * (cx - roofLeft);
                const rightEdge = cx + t * (roofRight - cx);
                if (x >= leftEdge && x <= rightEdge) {
                  R = 255; G = 255; B = 255;
                }
              }

              // House body
              if (x >= houseLeft && x <= houseRight && y >= houseTop && y <= houseBottom) {
                R = 255; G = 255; B = 255;
              }

              // Door (green on white)
              const doorLeft = cx - size * 0.08;
              const doorRight = cx + size * 0.08;
              const doorTop = cy + size * 0.02;
              const doorBottom = houseBottom;
              if (x >= doorLeft && x <= doorRight && y >= doorTop && y <= doorBottom) {
                R = 16; G = 185; B = 129;
              }

              rawData[px] = R;
              rawData[px + 1] = G;
              rawData[px + 2] = B;
            }
          }

          const compressed = deflateRaw(rawData);
          const ihdrChunk = chunk('IHDR', ihdr);
          const idatChunk = chunk('IDAT', compressed);
          const iendChunk = chunk('IEND', Buffer.alloc(0));

          return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
        }
      })
    };
  })();

  return createCanvas().generate();
}

fs.writeFileSync('icon-192.png', createPNG(192));
fs.writeFileSync('icon-512.png', createPNG(512));
fs.writeFileSync('apple-touch-icon.png', createPNG(180));
console.log('Icons generated!');
