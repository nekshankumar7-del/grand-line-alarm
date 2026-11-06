import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { loadFaceLandmarkerImage, loadSelfieSegmenter } from '@/features/vision/visionTasks'

/**
 * Turns the user's captured photo into an anime-style portrait — entirely on-device.
 *
 *  1. Multi-class segmentation (hair / face skin / body skin / clothes) — keep only the person
 *     connected to the face (removes stray background blobs and out-of-frame black bars)
 *  2. Face landmarks → gentle anime proportions (bigger eyes, slimmer jaw)
 *  3. Kuwahara smoothing → stable regions
 *  4. Per-region anime colouring: flat base tone + crisp shadow band (+ hair highlight band)
 *  5. Ink: silhouette outline, region-boundary lines, facial-feature linework
 *  6. Anime details: lashes, eye catchlights, blush
 *
 * Output: transparent PNG (the aura/background is drawn by the UI by the UI).
 */

export const TOON_VERSION = 4
const S = 640

const BG = 0
const HAIR = 1
const BODY = 2
const FACE = 3
const CLOTHES = 4
const OTHER = 5

const INK: [number, number, number] = [27, 20, 36]

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
const mix = (a: number, b: number, t: number) => a + (b - a) * t

function gaussianBlur(src: Float32Array, sigma: number) {
  const r = Math.ceil(sigma * 2.5)
  const kernel = new Float32Array(r * 2 + 1)
  let sum = 0
  for (let i = -r; i <= r; i++) sum += kernel[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma))
  for (let i = 0; i < kernel.length; i++) kernel[i] /= sum
  const tmp = new Float32Array(src.length)
  const out = new Float32Array(src.length)
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      let acc = 0
      for (let k = -r; k <= r; k++) acc += src[y * S + clamp(x + k, 0, S - 1)] * kernel[k + r]
      tmp[y * S + x] = acc
    }
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      let acc = 0
      for (let k = -r; k <= r; k++) acc += tmp[clamp(y + k, 0, S - 1) * S + x] * kernel[k + r]
      out[y * S + x] = acc
    }
  return out
}

/* ---------- segmentation ---------- */

async function analyse(canvas: HTMLCanvasElement) {
  let lm: NormalizedLandmark[] | null = null
  let classes: Uint8Array | null = null
  try {
    lm = (await loadFaceLandmarkerImage()).detect(canvas).faceLandmarks[0] ?? null
  } catch {
    /* proportions/details skipped */
  }
  try {
    const result = (await loadSelfieSegmenter()).segment(canvas)
    const masks = result.confidenceMasks ?? []
    if (masks.length >= 6) {
      const data = masks.map((m) => m.getAsFloat32Array())
      const n = data[0].length
      classes = new Uint8Array(n)
      for (let i = 0; i < n; i++) {
        let best = 0
        for (let c = 1; c < data.length; c++) if (data[c][i] > data[best][i]) best = c
        classes[i] = best
      }
    }
    result.close()
  } catch {
    /* fall back to whole image */
  }
  return { lm, classes }
}

/** Keep only the person region connected to the face; drop pure-black (out-of-frame) pixels. */
function isolatePerson(classes: Uint8Array, rgba: Uint8ClampedArray, seedX: number, seedY: number) {
  for (let i = 0; i < classes.length; i++) {
    if (rgba[i * 4] + rgba[i * 4 + 1] + rgba[i * 4 + 2] < 8) classes[i] = BG
  }
  const keep = new Uint8Array(classes.length)
  let seed = clamp(Math.round(seedY), 0, S - 1) * S + clamp(Math.round(seedX), 0, S - 1)
  if (classes[seed] === BG) {
    // nearest person pixel to the seed
    let bestD = Infinity
    for (let i = 0; i < classes.length; i++) {
      if (classes[i] === BG) continue
      const d = (i % S - seedX) ** 2 + (Math.floor(i / S) - seedY) ** 2
      if (d < bestD) {
        bestD = d
        seed = i
      }
    }
  }
  const stack = [seed]
  keep[seed] = 1
  while (stack.length) {
    const i = stack.pop()!
    const x = i % S
    const y = (i / S) | 0
    for (const j of [x > 0 ? i - 1 : -1, x < S - 1 ? i + 1 : -1, y > 0 ? i - S : -1, y < S - 1 ? i + S : -1]) {
      if (j >= 0 && !keep[j] && classes[j] !== BG) {
        keep[j] = 1
        stack.push(j)
      }
    }
  }
  for (let i = 0; i < classes.length; i++) if (!keep[i]) classes[i] = BG
}

/* ---------- warp (anime proportions) ---------- */

interface Bulge { cx: number; cy: number; r: number; strength: number }
interface Pinch { cx: number; cy: number; r: number; dir: number; amount: number }

function warp(rgba: Uint8ClampedArray, classes: Uint8Array, bulges: Bulge[], pinches: Pinch[]) {
  const outRgb = new Uint8ClampedArray(rgba.length)
  const outCls = new Uint8Array(classes.length)
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let sx = x
      let sy = y
      for (const p of pinches) {
        const d = Math.hypot(sx - p.cx, sy - p.cy)
        if (d < p.r) sx += p.dir * p.amount * (1 - d / p.r) ** 2
      }
      for (const b of bulges) {
        const dx = sx - b.cx
        const dy = sy - b.cy
        const d2 = dx * dx + dy * dy
        if (d2 < b.r * b.r) {
          const f = 1 - b.strength * (1 - d2 / (b.r * b.r))
          sx = b.cx + dx * f
          sy = b.cy + dy * f
        }
      }
      const x0 = clamp(Math.floor(sx), 0, S - 2)
      const y0 = clamp(Math.floor(sy), 0, S - 2)
      const fx = clamp(sx - x0, 0, 1)
      const fy = clamp(sy - y0, 0, 1)
      const o = (y * S + x) * 4
      for (let c = 0; c < 3; c++) {
        const a = rgba[(y0 * S + x0) * 4 + c]
        const b = rgba[(y0 * S + x0 + 1) * 4 + c]
        const cc = rgba[((y0 + 1) * S + x0) * 4 + c]
        const d = rgba[((y0 + 1) * S + x0 + 1) * 4 + c]
        outRgb[o + c] = (a * (1 - fx) + b * fx) * (1 - fy) + (cc * (1 - fx) + d * fx) * fy
      }
      outRgb[o + 3] = 255
      outCls[y * S + x] = classes[clamp(Math.round(sy), 0, S - 1) * S + clamp(Math.round(sx), 0, S - 1)]
    }
  }
  return { rgba: outRgb, classes: outCls }
}

/* ---------- Kuwahara smoothing (summed-area tables) ---------- */

function kuwahara(rgba: Uint8ClampedArray, r: number) {
  const W = S + 1
  const sat = [0, 1, 2].map(() => new Float64Array(W * W))
  const satL = new Float64Array(W * W)
  const satL2 = new Float64Array(W * W)
  for (let y = 1; y <= S; y++) {
    for (let x = 1; x <= S; x++) {
      const o = ((y - 1) * S + (x - 1)) * 4
      const i = y * W + x
      const L = rgba[o] * 0.299 + rgba[o + 1] * 0.587 + rgba[o + 2] * 0.114
      for (let c = 0; c < 3; c++) sat[c][i] = rgba[o + c] + sat[c][i - 1] + sat[c][i - W] - sat[c][i - W - 1]
      satL[i] = L + satL[i - 1] + satL[i - W] - satL[i - W - 1]
      satL2[i] = L * L + satL2[i - 1] + satL2[i - W] - satL2[i - W - 1]
    }
  }
  const q = (t: Float64Array, x0: number, y0: number, x1: number, y1: number) => t[(y1 + 1) * W + x1 + 1] - t[y0 * W + x1 + 1] - t[(y1 + 1) * W + x0] + t[y0 * W + x0]
  const out = new Uint8ClampedArray(rgba.length)
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let best = Infinity
      let box = [x, y, x, y]
      for (const [qx0, qy0, qx1, qy1] of [
        [x - r, y - r, x, y],
        [x, y - r, x + r, y],
        [x - r, y, x, y + r],
        [x, y, x + r, y + r],
      ]) {
        const x0 = clamp(qx0, 0, S - 1), y0 = clamp(qy0, 0, S - 1), x1 = clamp(qx1, 0, S - 1), y1 = clamp(qy1, 0, S - 1)
        const n = (x1 - x0 + 1) * (y1 - y0 + 1)
        const m = q(satL, x0, y0, x1, y1) / n
        const v = q(satL2, x0, y0, x1, y1) / n - m * m
        if (v < best) {
          best = v
          box = [x0, y0, x1, y1]
        }
      }
      const n = (box[2] - box[0] + 1) * (box[3] - box[1] + 1)
      const o = (y * S + x) * 4
      for (let c = 0; c < 3; c++) out[o + c] = q(sat[c], box[0], box[1], box[2], box[3]) / n
      out[o + 3] = 255
    }
  }
  return out
}

/* ---------- region palettes ---------- */

interface Palette {
  base: [number, number, number]
  meanL: number
}

function regionPalette(rgba: Uint8ClampedArray, L: Float32Array, classes: Uint8Array, match: (c: number) => boolean): Palette | null {
  // Median luminance, then average colour of pixels near the median (robust to shadows/highlights).
  const lums: number[] = []
  for (let i = 0; i < classes.length; i++) if (match(classes[i])) lums.push(L[i])
  if (lums.length < 50) return null
  lums.sort((a, b) => a - b)
  const med = lums[(lums.length / 2) | 0]
  let r = 0, g = 0, b = 0, n = 0
  for (let i = 0; i < classes.length; i++) {
    if (!match(classes[i]) || Math.abs(L[i] - med) > 25) continue
    r += rgba[i * 4]
    g += rgba[i * 4 + 1]
    b += rgba[i * 4 + 2]
    n++
  }
  if (!n) return null
  return { base: [r / n, g / n, b / n], meanL: med }
}

function saturate(c: [number, number, number], amount: number, bright = 1): [number, number, number] {
  const gray = (c[0] + c[1] + c[2]) / 3
  return c.map((v) => clamp((gray + (v - gray) * amount) * bright, 0, 255)) as [number, number, number]
}

/* ---------- main ---------- */

const UPPER_LID_A = [33, 246, 161, 160, 159, 158, 157, 173, 133]
const UPPER_LID_B = [263, 466, 388, 387, 386, 385, 384, 398, 362]

export async function toonify(photo: string): Promise<string> {
  const img = await loadImage(photo)
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return photo
  ctx.drawImage(img, 0, 0, S, S)

  const { lm, classes: rawClasses } = await analyse(canvas)
  const frame = ctx.getImageData(0, 0, S, S)
  const P = (i: number) => ({ x: lm![i].x * S, y: lm![i].y * S })
  let classes = rawClasses ?? new Uint8Array(S * S).fill(FACE)
  if (rawClasses) {
    const seed = lm ? P(1) : { x: S / 2, y: S / 2 }
    isolatePerson(classes, frame.data, seed.x, seed.y)
  }

  /* proportions */
  let eyes: Array<{ c: { x: number; y: number }; w: number; lid: number[] }> = []
  const EYE_STRENGTH = 0.3
  if (lm && lm.length >= 478) {
    const faceW = Math.hypot(P(454).x - P(234).x, P(454).y - P(234).y)
    eyes = [
      { c: P(468), w: Math.hypot(P(33).x - P(133).x, P(33).y - P(133).y), lid: UPPER_LID_A },
      { c: P(473), w: Math.hypot(P(263).x - P(362).x, P(263).y - P(362).y), lid: UPPER_LID_B },
    ]
    const midX = P(152).x
    const warped = warp(
      frame.data,
      classes,
      eyes.map((e) => ({ cx: e.c.x, cy: e.c.y, r: e.w * 1.05, strength: EYE_STRENGTH })),
      [172, 397].map((j) => {
        const p = P(j)
        return { cx: p.x, cy: p.y, r: faceW * 0.38, dir: p.x < midX ? -1 : 1, amount: faceW * 0.065 }
      }),
    )
    frame.data.set(warped.rgba)
    classes = warped.classes
  }

  /* smoothing + luminance */
  // One light pass: removes camera noise but keeps lashes, strands and fine features.
  const painted = kuwahara(frame.data, 2)
  const Lraw = new Float32Array(S * S)
  for (let i = 0; i < Lraw.length; i++) Lraw[i] = painted[i * 4] * 0.299 + painted[i * 4 + 1] * 0.587 + painted[i * 4 + 2] * 0.114
  const Ls = gaussianBlur(Lraw, 1.2)

  /* palettes per region */
  const skinPal = regionPalette(painted, Lraw, classes, (c) => c === FACE || c === BODY)
  const hairPal = regionPalette(painted, Lraw, classes, (c) => c === HAIR)
  const clothPal = regionPalette(painted, Lraw, classes, (c) => c === CLOTHES || c === OTHER)

  /* feature linework (face only) */
  const g1 = gaussianBlur(Lraw, 0.8)
  const g2 = gaussianBlur(Lraw, 1.4)

  /* silhouette */
  const person = new Float32Array(S * S)
  for (let i = 0; i < person.length; i++) person[i] = classes[i] !== BG ? 1 : 0
  const soft = gaussianBlur(person, 1.0)
  const spread = gaussianBlur(person, 2.4)

  const out = frame.data
  for (let i = 0; i < S * S; i++) {
    const o = i * 4
    const cls = classes[i]
    const x = i % S
    const y = (i / S) | 0
    let r = painted[o], g = painted[o + 1], b = painted[o + 2]

    if (cls !== BG) {
      const L = Ls[i]
      if ((cls === FACE || cls === BODY) && skinPal) {
        const light = saturate(skinPal.base, 1.15, 1.1)
        const shade = saturate([skinPal.base[0] * 0.86, skinPal.base[1] * 0.74, skinPal.base[2] * 0.74], 1.2)
        const t = smoothstep(skinPal.meanL * 0.8, skinPal.meanL * 0.9, L)
        const flat = [mix(shade[0], light[0], t), mix(shade[1], light[1], t), mix(shade[2], light[2], t)]
        // Keep dark features (eyes, brows, facial hair) and lips readable.
        const dark = 1 - smoothstep(skinPal.meanL * 0.42, skinPal.meanL * 0.6, L)
        const keep = cls === FACE ? 0.42 : 0.3
        r = mix(mix(flat[0], r, keep), mix(INK[0], r, 0.35), dark)
        g = mix(mix(flat[1], g, keep), mix(INK[1], g, 0.35), dark)
        b = mix(mix(flat[2], b, keep), mix(INK[2], b, 0.35), dark)
      } else if (cls === HAIR && hairPal) {
        const base = saturate(hairPal.base, 1.25)
        const darkTone = base.map((v) => v * 0.6)
        const hi = base.map((v) => clamp(v * 1.35 + 45, 0, 255))
        const tDark = smoothstep(hairPal.meanL * 0.78, hairPal.meanL * 0.9, L)
        const tHi = smoothstep(hairPal.meanL * 1.3, hairPal.meanL * 1.45, L)
        // Keep ~30% of the real strand detail so hair reads as hair, not a flat blob.
        r = mix(mix(mix(darkTone[0], base[0], tDark), hi[0], tHi), r, 0.3)
        g = mix(mix(mix(darkTone[1], base[1], tDark), hi[1], tHi), g, 0.3)
        b = mix(mix(mix(darkTone[2], base[2], tDark), hi[2], tHi), b, 0.3)
      } else if (clothPal) {
        const base = saturate(clothPal.base, 1.3, 1.05)
        const t = smoothstep(clothPal.meanL * 0.75, clothPal.meanL * 0.88, L)
        r = mix(base[0] * 0.72, base[0], t)
        g = mix(base[1] * 0.72, base[1], t)
        b = mix(base[2] * 0.75, base[2], t)
      }

      // facial feature ink
      let ink = 0
      if (cls === FACE) {
        const e = g1[i] - 0.98 * g2[i]
        ink = clamp((-e - 2) / 3.5, 0, 1) * 0.7
      }
      // region-boundary lines (hair/skin/clothes)
      for (const [dx, dy] of [[2, 0], [0, 2], [-2, 0], [0, -2]]) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= S || ny >= S) continue
        const nc = classes[ny * S + nx]
        if (nc !== BG && nc !== cls && !((nc === FACE || nc === BODY) && (cls === FACE || cls === BODY))) ink = Math.max(ink, 0.8)
      }
      r = mix(r, INK[0], ink)
      g = mix(g, INK[1], ink)
      b = mix(b, INK[2], ink)
    }

    // silhouette outline + soft alpha
    const alpha = smoothstep(0.4, 0.6, soft[i])
    const outline = smoothstep(0.06, 0.25, spread[i]) * (1 - smoothstep(0.75, 0.95, spread[i]))
    const edgeInk = outline * (1 - alpha * 0.5)
    out[o] = clamp(mix(r, INK[0], edgeInk), 0, 255)
    out[o + 1] = clamp(mix(g, INK[1], edgeInk), 0, 255)
    out[o + 2] = clamp(mix(b, INK[2], edgeInk), 0, 255)
    out[o + 3] = rawClasses ? Math.max(alpha, outline) * 255 : 255
  }

  /* clarity: unsharp mask on the coloured result */
  for (let c = 0; c < 3; c++) {
    const chan = new Float32Array(S * S)
    for (let i = 0; i < chan.length; i++) chan[i] = out[i * 4 + c]
    const blurred = gaussianBlur(chan, 1.1)
    for (let i = 0; i < chan.length; i++) out[i * 4 + c] = clamp(chan[i] + (chan[i] - blurred[i]) * 0.75, 0, 255)
  }
  ctx.putImageData(frame, 0, 0)

  /* anime details */
  if (eyes.length) {
    const grow = 1 + EYE_STRENGTH * 0.9
    for (const eye of eyes) {
      const pts = eye.lid.map((i) => {
        const p = P(i)
        return { x: eye.c.x + (p.x - eye.c.x) * grow, y: eye.c.y + (p.y - eye.c.y) * grow }
      })
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = 'rgba(27,20,36,0.95)'
      ctx.lineWidth = Math.max(3, eye.w * 0.15)
      ctx.beginPath()
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
      ctx.stroke()
      const outer = pts[0]
      const dir = Math.sign(outer.x - eye.c.x) || 1
      ctx.beginPath()
      ctx.moveTo(outer.x, outer.y)
      ctx.lineTo(outer.x + dir * eye.w * 0.24, outer.y - eye.w * 0.18)
      ctx.stroke()
      const rr = eye.w * 0.11
      ctx.fillStyle = 'rgba(255,255,255,0.97)'
      ctx.beginPath()
      ctx.ellipse(eye.c.x + rr * 0.9, eye.c.y - rr * 0.9, rr, rr * 1.15, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(eye.c.x - rr * 0.8, eye.c.y + rr * 0.9, rr * 0.45, 0, Math.PI * 2)
      ctx.fill()
    }
    for (const i of [50, 280]) {
      const p = P(i)
      const rad = eyes[0].w * 0.7
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad)
      grad.addColorStop(0, 'rgba(255,120,140,0.38)')
      grad.addColorStop(1, 'rgba(255,120,140,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.ellipse(p.x, p.y, rad, rad * 0.55, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  return canvas.toDataURL('image/png')
}
