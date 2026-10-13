/** Gradient-blob background canvas. */

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('bg-canvas'));
const ctx = canvas.getContext('2d');

const SCALE         = 0.25;   // render at quarter resolution — gradients upscale smoothly
const BLOB_COUNT    = 5;
const PUSH_RADIUS   = 0.35;   // fraction of the larger viewport side
const PUSH_STRENGTH = 0.12;
const PULSE_LIFE    = 90;     // frames
const FOLLOW_EASE   = 0.0072; // how quickly the pointer glow catches up (per frame)
const SATURATION    = 0.8;    // blobs are 20% less saturated than the CSS tokens

let palette   = ['#0E5A85', '#7DB9B0', '#FF8A3D'];
let blobs     = [];
let pulses    = [];
let animFrame = null;
let paused    = false;
let time      = 0;

// Pointer state in CSS px; `strength` eases in/out as the pointer enters/leaves
const pointer = { x: 0, y: 0, tx: 0, ty: 0, strength: 0, active: false };

// ── Reduced-motion ─────────────────────────────────────────────────────────

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduced = motionQuery.matches;

// ── Colour sampling from CSS tokens ────────────────────────────────────────

function sampleColors() {
  const style = getComputedStyle(document.documentElement);
  const read = (name, fallback) => (style.getPropertyValue(name) || '').trim() || fallback;
  palette = [
    read('--color-accent',   '#0E5A85'),
    read('--color-accent-2', '#7DB9B0'),
    read('--color-accent-3', '#FF8A3D'),
  ];
  if (reduced) draw();
}

/**
 * '#rrggbb' → 'r, g, b' (desaturated by SATURATION) so alpha can be applied
 * in gradient stops. Scaling each channel's distance from the HSL lightness
 * scales HSL saturation by the same factor while keeping hue and lightness.
 */
function rgb(hex) {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const l = (Math.max(...c) + Math.min(...c)) / 2;
  return c.map(v => Math.round(l + (v - l) * SATURATION)).join(', ');
}

// ── Blobs ──────────────────────────────────────────────────────────────────

class Blob {
  constructor(i) {
    this.colorIndex = i % 3;
    // Home position as a fraction of the viewport, spread around the page
    this.hx = 0.15 + Math.random() * 0.7;
    this.hy = 0.15 + Math.random() * 0.7;
    this.radius = 0.35 + Math.random() * 0.25;   // fraction of the larger side
    this.alpha  = 0.45 + Math.random() * 0.25;
    // Lissajous drift — each blob wanders on its own slow orbit
    this.ax = 0.08 + Math.random() * 0.12;
    this.ay = 0.08 + Math.random() * 0.12;
    this.fx = 0.0015 + Math.random() * 0.002;
    this.fy = 0.0015 + Math.random() * 0.002;
    this.px = Math.random() * Math.PI * 2;
    this.py = Math.random() * Math.PI * 2;
    // Displacement from pointer, eased
    this.ox = 0;
    this.oy = 0;
  }

  position(w, h) {
    return {
      x: (this.hx + Math.sin(time * this.fx + this.px) * this.ax) * w + this.ox,
      y: (this.hy + Math.cos(time * this.fy + this.py) * this.ay) * h + this.oy,
    };
  }

  update(w, h) {
    const side = Math.max(w, h);
    const { x, y } = this.position(w, h);
    let tx = 0, ty = 0;

    // Drift away from the pointer, so the blobs part around the cursor
    if (pointer.strength > 0) {
      const dx = x - this.ox - pointer.x;
      const dy = y - this.oy - pointer.y;
      const dist = Math.hypot(dx, dy) || 1;
      const reach = PUSH_RADIUS * side;
      if (dist < reach) {
        const force = (1 - dist / reach) * PUSH_STRENGTH * side * pointer.strength;
        tx = (dx / dist) * force;
        ty = (dy / dist) * force;
      }
    }

    this.ox += (tx - this.ox) * 0.04;
    this.oy += (ty - this.oy) * 0.04;
  }
}

function seed() {
  blobs = Array.from({ length: BLOB_COUNT }, (_, i) => new Blob(i));
}

// ── Draw ───────────────────────────────────────────────────────────────────

function fillBlob(x, y, r, color, alpha) {
  const c = rgb(color);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0,   `rgba(${c}, ${alpha})`);
  g.addColorStop(0.5, `rgba(${c}, ${alpha * 0.45})`);
  g.addColorStop(1,   `rgba(${c}, 0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function draw() {
  const w = canvas.width / SCALE;
  const h = canvas.height / SCALE;
  const side = Math.max(w, h);

  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.clearRect(0, 0, w, h);

  for (const b of blobs) {
    const { x, y } = b.position(w, h);
    fillBlob(x, y, b.radius * side, palette[b.colorIndex], b.alpha);
  }

  // Soft glow that trails the pointer
  if (pointer.strength > 0.01) {
    fillBlob(pointer.x, pointer.y, 0.22 * side, palette[0], 0.5 * pointer.strength);
  }

  // Click pulses — expand and fade
  for (const p of pulses) {
    const t = 1 - p.life / PULSE_LIFE;
    fillBlob(p.x, p.y, (0.05 + t * 0.3) * side, palette[p.colorIndex], 0.6 * (1 - t));
  }
}

// ── Animation loop ─────────────────────────────────────────────────────────

function animate() {
  if (paused || reduced) return;
  const w = canvas.width / SCALE;
  const h = canvas.height / SCALE;

  time += 1;

  pointer.x += (pointer.tx - pointer.x) * FOLLOW_EASE;
  pointer.y += (pointer.ty - pointer.y) * FOLLOW_EASE;
  pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * 0.05;

  for (const b of blobs) b.update(w, h);
  for (const p of pulses) p.life -= 1;
  pulses = pulses.filter(p => p.life > 0);

  draw();
  animFrame = requestAnimationFrame(animate);
}

function startLoop() {
  if (animFrame) cancelAnimationFrame(animFrame);
  animate();
}

function stopLoop() {
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
}

// ── Resize ─────────────────────────────────────────────────────────────────

function resize() {
  canvas.width  = Math.max(1, Math.round(canvas.offsetWidth  * SCALE));
  canvas.height = Math.max(1, Math.round(canvas.offsetHeight * SCALE));
  if (reduced) draw();
}

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(canvas);

// ── Theme change — re-sample CSS colours ───────────────────────────────────

const themeObserver = new MutationObserver(sampleColors);
themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme'],
});

window.matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', sampleColors);

// ── Tab visibility — pause when hidden ────────────────────────────────────

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { paused = true;  stopLoop(); }
  else                 { paused = false; if (!reduced) startLoop(); }
});

// ── Pointer — listen on window so the canvas can stay pointer-events: none ─

function toCanvas(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

window.addEventListener('pointermove', e => {
  const { x, y } = toCanvas(e);
  if (!pointer.active && pointer.strength < 0.01) { pointer.x = x; pointer.y = y; }
  pointer.tx = x;
  pointer.ty = y;
  pointer.active = true;
}, { passive: true });

document.documentElement.addEventListener('pointerleave', () => { pointer.active = false; });
window.addEventListener('pointerup', e => { if (e.pointerType === 'touch') pointer.active = false; });
window.addEventListener('blur', () => { pointer.active = false; });

window.addEventListener('click', e => {
  if (reduced) return;
  const { x, y } = toCanvas(e);
  pulses.push({ x, y, life: PULSE_LIFE, colorIndex: pulses.length % 3 });
});

// ── Reduced-motion toggle ──────────────────────────────────────────────────

motionQuery.addEventListener('change', e => {
  reduced = e.matches;
  if (reduced) { stopLoop(); pulses = []; pointer.strength = 0; draw(); }
  else startLoop();
});

// ── Bootstrap ─────────────────────────────────────────────────────────────

seed();
sampleColors();
resize();
if (!reduced) startLoop();
else draw();
