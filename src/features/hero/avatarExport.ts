const SIZE = 1024

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function save(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 2000)
  }, 'image/png')
}

function canvas() {
  const c = document.createElement('canvas')
  c.width = SIZE
  c.height = SIZE
  return c
}

/** Photo / toon portrait → round framed PNG with aura rays and a gold ring. */
export async function exportRoundImage(src: string, aura: string, filename: string) {
  const c = canvas()
  const ctx = c.getContext('2d')
  if (!ctx) return
  const mid = SIZE / 2
  // aura rays
  ctx.save()
  ctx.translate(mid, mid)
  ctx.fillStyle = aura
  ctx.globalAlpha = 0.45
  for (let i = 0; i < 16; i++) {
    ctx.rotate(Math.PI / 8)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(-28, -mid)
    ctx.lineTo(28, -mid)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
  // portrait
  const img = await loadImage(src)
  const r = SIZE * 0.4
  ctx.save()
  ctx.beginPath()
  ctx.arc(mid, mid, r, 0, Math.PI * 2)
  ctx.clip()
  ctx.fillStyle = aura
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.drawImage(img, mid - r, mid - r, r * 2, r * 2)
  ctx.restore()
  // ink + gold rings
  ctx.lineWidth = 14
  ctx.strokeStyle = '#1b1424'
  ctx.beginPath()
  ctx.arc(mid, mid, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 16
  ctx.strokeStyle = '#ffc53d'
  ctx.beginPath()
  ctx.arc(mid, mid, r + 15, 0, Math.PI * 2)
  ctx.stroke()
  save(c, filename)
}

/** Drawn (SVG) avatar → transparent PNG. */
export async function exportSvg(svg: SVGSVGElement, filename: string) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(SIZE))
  clone.setAttribute('height', String(SIZE))
  clone.removeAttribute('style') // drop live animation transforms
  const xml = new XMLSerializer().serializeToString(clone)
  const img = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`)
  const c = canvas()
  const ctx = c.getContext('2d')
  if (!ctx) return
  const pad = SIZE * 0.08
  ctx.drawImage(img, pad, pad, SIZE - pad * 2, SIZE - pad * 2)
  save(c, filename)
}

export const safeFileName = (name: string) => (name.trim() || 'sentinel').replace(/[^\w-]+/g, '-').toLowerCase()
