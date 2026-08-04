const fs = require('fs');
const zlib = require('zlib');

function createPNG(width, height, drawFn) {
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      pixels[idx] = 0x1A;
      pixels[idx + 1] = 0x3C;
      pixels[idx + 2] = 0x2A;
      pixels[idx + 3] = 0xFF;
    }
  }
  drawFn(pixels, width, height);
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    rawData[y * (width * 4 + 1)] = 0;
    pixels.copy(rawData, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(rawData);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  function makeChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    const crcData = Buffer.concat([typeBuf, data]);
    crc.writeUInt32BE(crc32(crcData), 0);
    return Buffer.concat([length, typeBuf, data, crc]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

const crcTable = (() => {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function setPixel(pixels, w, x, y, r, g, b, a) {
  a = a || 255;
  if (x < 0 || y < 0 || x >= w) return;
  const idx = (y * w + x) * 4;
  if (idx + 3 >= pixels.length) return;
  pixels[idx] = r;
  pixels[idx + 1] = g;
  pixels[idx + 2] = b;
  pixels[idx + 3] = a;
}

function drawRect(pixels, w, x, y, rw, rh, r, g, b) {
  for (let dy = 0; dy < rh; dy++) {
    for (let dx = 0; dx < rw; dx++) {
      setPixel(pixels, w, x + dx, y + dy, r, g, b);
    }
  }
}

function drawIcon(pixels, w, h) {
  const s = w / 32;
  const leaf = [
    [10,4,4,1],[9,5,6,1],[8,6,8,1],[8,7,8,2],
    [9,9,6,1],[10,10,4,1],[11,11,2,1],
    [12,12,2,1],[13,13,2,1],[14,14,2,1],
    [15,15,2,1],[16,16,2,1]
  ];
  leaf.forEach(function(arr) {
    drawRect(pixels, w, Math.floor(arr[0]*s), Math.floor(arr[1]*s), Math.ceil(arr[2]*s), Math.ceil(arr[3]*s), 0x7D, 0xBF, 0x8A);
  });
  const hl = [[10,5,2,1],[9,6,2,1],[10,7,2,1]];
  hl.forEach(function(arr) {
    drawRect(pixels, w, Math.floor(arr[0]*s), Math.floor(arr[1]*s), Math.ceil(arr[2]*s), Math.ceil(arr[3]*s), 0xA8, 0xD8, 0xB0);
  });
  drawRect(pixels, w, Math.floor(20*s), Math.floor(18*s), Math.ceil(4*s), Math.ceil(4*s), 0xFF, 0xD5, 0x4F);
  drawRect(pixels, w, Math.floor(19*s), Math.floor(17*s), Math.ceil(2*s), Math.ceil(2*s), 0xE5, 0x73, 0x73);
  drawRect(pixels, w, Math.floor(23*s), Math.floor(17*s), Math.ceil(2*s), Math.ceil(2*s), 0xE5, 0x73, 0x73);
  drawRect(pixels, w, Math.floor(19*s), Math.floor(21*s), Math.ceil(2*s), Math.ceil(2*s), 0xE5, 0x73, 0x73);
  drawRect(pixels, w, Math.floor(23*s), Math.floor(21*s), Math.ceil(2*s), Math.ceil(2*s), 0xE5, 0x73, 0x73);
}

const png192 = createPNG(192, 192, drawIcon);
fs.writeFileSync('public/icons/icon-192.png', png192);
const png512 = createPNG(512, 512, drawIcon);
fs.writeFileSync('public/icons/icon-512.png', png512);
console.log('Icons generated: 192x192, 512x512');
