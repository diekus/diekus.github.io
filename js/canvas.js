/** Particle / constellation background canvas. */

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('bg-canvas'));
const ctx = canvas.getContext('2d');

const MAX_PARTICLES    = 80;
const CONNECTION_DIST  = 130;   // px — max distance to draw a connecting line
const BASE_SPEED       = 0.3;
const BURST_COUNT      = 16;

let particleColor = '#F71342';
let lineColor     = '#ffffff';
let particles     = [];
let animFrame     = null;
let paused        = false;

// ── Reduced-motion ─────────────────────────────────────────────────────────

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduced = motionQuery.matches;

// ── Colour sampling from CSS tokens ────────────────────────────────────────

function sampleColors() {
  const style = getComputedStyle(document.documentElement);
  // Particles: --color-accent  (red in both modes)
  // Lines:     --color-accent-2 (white in light, amber in dark)
  particleColor = (style.getPropertyValue('--color-accent')  || '').trim() || '#F71342';
  lineColor     = (style.getPropertyValue('--color-accent-2') || '').trim() || '#ffbb00';
}

// ── Particle class ──────────────────────────────────────────────────────────

class Particle {
  /**
   * @param {number|null} x  null → random across canvas
   * @param {number|null} y
   * @param {boolean}     burst  true → outward-drifting, fades out
   */
  constructor(x = null, y = null, burst = false) {
    this.x    = x ?? Math.random() * canvas.width;
    this.y    = y ?? Math.random() * canvas.height;
    this.size = 1.5 + Math.random() * 2;
    this.burst = burst;

    const angle = Math.random() * Math.PI * 2;
    const speed = burst
      ? 1.2 + Math.random() * 2.5
      : BASE_SPEED * (0.4 + Math.random() * 0.8);

    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    if (burst) {
      this.alpha   = 0.9;
      this.life    = 80 + Math.random() * 60;
      this.maxLife = this.life;
    } else {
      this.alpha = 0.3 + Math.random() * 0.5;
      this.life  = Infinity;
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.burst) {
      // Decelerate and fade
      this.vx   *= 0.965;
      this.vy   *= 0.965;
      this.life -= 1;
      this.alpha = (this.life / this.maxLife) * 0.9;
    } else {
      // Bounce off canvas edges
      if (this.x < 0)             { this.x = 0;             this.vx *= -1; }
      if (this.x > canvas.width)  { this.x = canvas.width;  this.vx *= -1; }
      if (this.y < 0)             { this.y = 0;             this.vy *= -1; }
      if (this.y > canvas.height) { this.y = canvas.height; this.vy *= -1; }
    }
  }

  isDead() {
    return this.burst && this.life <= 0;
  }
}

// ── Seed initial particles ─────────────────────────────────────────────────

function seed() {
  while (particles.length < MAX_PARTICLES) {
    particles.push(new Particle());
  }
}

// ── Draw ───────────────────────────────────────────────────────────────────

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Connecting lines
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx   = particles[i].x - particles[j].x;
      const dy   = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= CONNECTION_DIST) continue;

      const lineAlpha = (1 - dist / CONNECTION_DIST) * 0.35;
      ctx.globalAlpha = lineAlpha;
      ctx.strokeStyle = lineColor;
      ctx.lineWidth   = 0.8;
      ctx.beginPath();
      ctx.moveTo(particles[i].x, particles[i].y);
      ctx.lineTo(particles[j].x, particles[j].y);
      ctx.stroke();
    }
  }

  // Dots
  ctx.fillStyle = particleColor;
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawStatic() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = particleColor;
  for (const p of particles) {
    ctx.globalAlpha = p.alpha * 0.4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Animation loop ─────────────────────────────────────────────────────────

function animate() {
  if (paused || reduced) return;
  particles = particles.filter(p => !p.isDead());

  // Top up ambient particles lost to burst fade-out
  while (particles.filter(p => !p.burst).length < MAX_PARTICLES) {
    particles.push(new Particle());
  }

  for (const p of particles) p.update();
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
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  if (reduced) drawStatic();
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

// ── Click burst — listen on window so any click fires it ──────────────────

window.addEventListener('click', e => {
  if (reduced) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  for (let i = 0; i < BURST_COUNT; i++) {
    particles.push(new Particle(x, y, true));
  }
});

// ── Reduced-motion toggle ──────────────────────────────────────────────────

motionQuery.addEventListener('change', e => {
  reduced = e.matches;
  if (reduced) { stopLoop(); drawStatic(); }
  else startLoop();
});

// ── Bootstrap ─────────────────────────────────────────────────────────────

sampleColors();
resize();
seed();
if (!reduced) startLoop();
else drawStatic();
