/**
 * A small QR code encoder (byte mode, error correction level M, versions 1 to
 * 40) that returns the modules as rows of booleans, for drawing as SVG. No
 * dependency: Cadus uses it to hand a shared link to a phone.
 */

/* ---------------------------------------------------------------- tables */

// Error-correction codewords per block and block counts for level M, versions 1–40: [ecPerBlock, g1Blocks, g1Data, g2Blocks, g2Data]
const EC_M: [number, number, number, number, number][] = [
  [10, 1, 16, 0, 0], [16, 1, 28, 0, 0], [26, 1, 44, 0, 0], [18, 2, 32, 0, 0], [24, 2, 43, 0, 0], [16, 4, 27, 0, 0], [18, 4, 31, 0, 0], [22, 2, 38, 2, 39], [22, 3, 36, 2, 37], [26, 4, 43, 1, 44],
  [30, 1, 50, 4, 51], [22, 6, 36, 2, 37], [22, 8, 37, 1, 38], [24, 4, 40, 5, 41], [24, 5, 41, 5, 42], [28, 7, 45, 3, 46], [28, 10, 46, 1, 47], [26, 9, 43, 4, 44], [26, 3, 44, 11, 45], [26, 3, 41, 13, 42],
  [26, 17, 42, 0, 0], [28, 17, 46, 0, 0], [28, 4, 47, 14, 48], [28, 6, 45, 14, 46], [28, 8, 47, 13, 48], [28, 19, 46, 4, 47], [28, 22, 45, 3, 46], [28, 3, 45, 23, 46], [28, 21, 45, 7, 46], [28, 19, 47, 10, 48],
  [28, 2, 46, 29, 47], [28, 10, 46, 23, 47], [28, 14, 46, 21, 47], [28, 14, 46, 23, 47], [28, 12, 47, 26, 48], [28, 6, 47, 34, 48], [28, 29, 46, 14, 47], [28, 13, 46, 32, 47], [28, 40, 47, 7, 48], [28, 18, 47, 31, 48],
];
const ALIGN: number[][] = [
  [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90],
  [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170],
];

/* ---------------------------------------------------------------- GF(256) */
const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
(() => { let x = 1; for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; } for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
const mul = (a: number, b: number) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);
function rsGenerator(n: number): number[] {
  let g = [1];
  for (let i = 0; i < n; i++) { const next = new Array(g.length + 1).fill(0); for (let j = 0; j < g.length; j++) { next[j] ^= g[j]; next[j + 1] ^= mul(g[j], EXP[i]); } g = next; }
  return g;
}
function rsEncode(data: number[], n: number): number[] {
  const g = rsGenerator(n);
  const r = new Array(n).fill(0);
  for (const d of data) { const f = d ^ r[0]; r.shift(); r.push(0); if (f) for (let j = 0; j < n; j++) r[j] ^= mul(g[j + 1], f); }
  return r;
}

/* ---------------------------------------------------------------- encoding */
function chooseVersion(len: number): number {
  for (let v = 1; v <= 40; v++) {
    const [ec, g1, d1, g2, d2] = EC_M[v - 1];
    const cap = g1 * d1 + g2 * d2;
    const header = v < 10 ? 2 : 3; // mode (4 bits) + length (8 or 16 bits), in bytes (rounded up)
    if (len + header <= cap) return v;
    void ec;
  }
  throw new Error("Too much data for a QR code");
}

function bitStream(bytes: Uint8Array, version: number, totalData: number): number[] {
  const bits: number[] = [];
  const push = (val: number, n: number) => { for (let i = n - 1; i >= 0; i--) bits.push((val >> i) & 1); };
  push(0b0100, 4);
  push(bytes.length, version < 10 ? 8 : 16);
  for (const b of bytes) push(b, 8);
  const max = totalData * 8;
  push(0, Math.min(4, max - bits.length));
  while (bits.length % 8) bits.push(0);
  const out: number[] = [];
  for (let i = 0; i < bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8).join(""), 2));
  for (let k = 0; out.length < totalData; k++) out.push(k % 2 ? 0x11 : 0xec);
  return out;
}

export type QrMatrix = boolean[][];

export function encodeQr(text: string): QrMatrix {
  const bytes = new TextEncoder().encode(text);
  const version = chooseVersion(bytes.length);
  const [ec, g1, d1, g2, d2] = EC_M[version - 1];
  const data = bitStream(bytes, version, g1 * d1 + g2 * d2);
  // Split into blocks and interleave.
  const blocks: number[][] = [], ecs: number[][] = [];
  let p = 0;
  for (let i = 0; i < g1 + g2; i++) { const n = i < g1 ? d1 : d2; const b = data.slice(p, p + n); p += n; blocks.push(b); ecs.push(rsEncode(b, ec)); }
  const codewords: number[] = [];
  const maxD = Math.max(d1, d2);
  for (let i = 0; i < maxD; i++) for (const b of blocks) if (i < b.length) codewords.push(b[i]);
  for (let i = 0; i < ec; i++) for (const e of ecs) codewords.push(e[i]);

  const size = version * 4 + 17;
  // Function modules first (finders, timing, alignment, format and version areas); everything else is data.
  const func: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const put = (r: number, c: number, v: boolean) => { if (r >= 0 && c >= 0 && r < size && c < size) { grid[r][c] = v; func[r][c] = true; } };
  const finder = (r0: number, c0: number) => { for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) put(r0 + i, c0 + j, i >= 0 && i <= 6 && j >= 0 && j <= 6 && (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4))); };
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
  for (let i = 8; i < size - 8; i++) { put(6, i, i % 2 === 0); put(i, 6, i % 2 === 0); }
  const al = ALIGN[version - 1];
  for (const r of al) for (const c of al) {
    // Skip the three that would sit on finders.
    if ((r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8)) continue;
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) put(r + i, c + j, Math.max(Math.abs(i), Math.abs(j)) !== 1);
  }
  for (let i = 0; i < 9; i++) if (i !== 6) { put(8, i, false); put(i, 8, false); }
  for (let i = 0; i < 8; i++) { put(8, size - 1 - i, false); put(size - 1 - i, 8, false); }
  if (version >= 7) for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { put(i, size - 11 + j, false); put(size - 11 + j, i, false); }

  // Place data in the zigzag, masking with pattern 0 ((r + c) even flips).
  const bits: number[] = [];
  for (const cw of codewords) for (let i = 7; i >= 0; i--) bits.push((cw >> i) & 1);
  let bi = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const upward = ((right + 1) & 2) === 0;
        const r = upward ? size - 1 - vert : vert;
        if (func[r][c]) continue;
        const bit = bi < bits.length ? bits[bi++] === 1 : false;
        grid[r][c] = (r + c) % 2 === 0 ? !bit : bit;
      }
    }
  }
  const out: QrMatrix = grid;

  // Format bits for level M (01) and mask 0 (000): 0b101010000010010 after BCH, XOR mask 101010000010010.
  const fmt = 0b101010000010010; // precomputed: level M, mask 0
  const fb = (i: number) => ((fmt >> (14 - i)) & 1) === 1;
  for (let i = 0; i < 6; i++) out[8][i] = fb(i);
  out[8][7] = fb(6); out[8][8] = fb(7); out[7][8] = fb(8);
  for (let i = 9; i < 15; i++) out[14 - i][8] = fb(i);
  for (let i = 0; i < 8; i++) out[size - 1 - i][8] = fb(i);
  for (let i = 8; i < 15; i++) out[8][size - 15 + i] = fb(i);
  out[size - 8][8] = true;
  if (version >= 7) {
    // Version information (18 bits): the 6-bit version followed by 12 BCH bits (generator 0x1f25).
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >> 11) & 1 ? 0x1f25 : 0);
    const vbits = (version << 12) | (rem & 0xfff);
    for (let i = 0; i < 18; i++) { const bit = ((vbits >> i) & 1) === 1; const a = Math.floor(i / 3), b = (i % 3) + size - 11; out[a][b] = bit; out[b][a] = bit; }
  }
  return out;
}

/** The QR code as an SVG string. */
export function qrSvg(text: string, size = 180, opts: { dark?: string; light?: string } = {}): string {
  const m = encodeQr(text);
  const n = m.length;
  const quiet = 2;
  const cell = size / (n + quiet * 2);
  let path = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c]) path += `M${((c + quiet) * cell).toFixed(2)} ${((r + quiet) * cell).toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h-${cell.toFixed(2)}z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${opts.light ?? "#fff"}"/><path d="${path}" fill="${opts.dark ?? "#000"}"/></svg>`;
}
