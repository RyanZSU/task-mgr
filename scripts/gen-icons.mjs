// Generates PWA icons (solid indigo square with a white checkmark) as PNGs.
// Run: node scripts/gen-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'icons')
mkdirSync(OUT_DIR, { recursive: true })

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

function png(size, pixelFn) {
  const raw = Buffer.alloc(size * (size * 4 + 1))
  let p = 0
  for (let y = 0; y < size; y++) {
    raw[p++] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelFn(x, y, size)
      raw[p++] = r
      raw[p++] = g
      raw[p++] = b
      raw[p++] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// Background + white checkmark
const BG = [63, 81, 181] // indigo 500
function segDist(px, py, ax, ay, bx, by) {
  const abx = bx - ax
  const aby = by - ay
  const apx = px - ax
  const apy = py - ay
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / (abx * abx + aby * aby)))
  const dx = px - (ax + abx * t)
  const dy = py - (ay + aby * t)
  return Math.sqrt(dx * dx + dy * dy)
}

function checker(x, y, size) {
  // checkmark segments in normalized coords
  const s = size
  const a = [0.26 * s, 0.52 * s]
  const b = [0.44 * s, 0.7 * s]
  const c = [0.78 * s, 0.34 * s]
  const th = 0.075 * s
  const d = Math.min(segDist(x, y, a[0], a[1], b[0], b[1]), segDist(x, y, b[0], b[1], c[0], c[1]))
  if (d < th) return [255, 255, 255, 255]
  // rounded corners: transparency outside a rounded rect
  const r = 0.18 * s
  const cx = Math.min(Math.max(x, r), s - r)
  const cy = Math.min(Math.max(y, r), s - r)
  const corner = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
  if (corner > r) return [0, 0, 0, 0]
  return [...BG, 255]
}

writeFileSync(join(OUT_DIR, 'icon-192.png'), png(192, checker))
writeFileSync(join(OUT_DIR, 'icon-512.png'), png(512, checker))
writeFileSync(join(OUT_DIR, 'maskable-512.png'), png(512, checker))
console.log('icons written to', OUT_DIR)