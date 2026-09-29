/* Decler — reloj de arena: la arena cae mientras bajas; dale la vuelta y pasas de brunch a tapeo */
gsap.registerPlugin(ScrollTrigger);
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ---------- modo según la hora de Blanes ---------- */
const hour = +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', hourCycle: 'h23' }).format(new Date());
if (hour >= 17 || hour < 6) document.body.classList.add('night');

/* ---------- reloj de arena (canvas) ---------- */
const cv = $('#sand'), ctx = cv.getContext('2d');
const W = 300, H = 480, NECK = 7, MAXW = 118, TOP = 44, MID = 240, BOT = 436;
let topV = 1, flowing = 0, flips = 0;
const grains = [];
const hw = u => NECK + (MAXW - NECK) * Math.pow(1 - u, .62) * (1 - .38 * Math.pow(1 - u, 7)); // u: 0 borde → 1 cuello
function bulbPath(top) {
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) { const u = i / 40, y = top ? TOP + u * (MID - TOP) : BOT - u * (BOT - MID); ctx.lineTo(W / 2 - hw(u), y); }
  for (let i = 40; i >= 0; i--) { const u = i / 40, y = top ? TOP + u * (MID - TOP) : BOT - u * (BOT - MID); ctx.lineTo(W / 2 + hw(u), y); }
  ctx.closePath();
}
function draw() {
  const st = getComputedStyle(document.body);
  const sand = st.getPropertyValue('--sand').trim() || '#d9b77a', fg = st.getPropertyValue('--fg').trim();
  const flipped = flips % 2 === 1;
  const a = flipped ? 1 - topV : topV;          // arena dibujada arriba
  const b = 1 - a;                                // arena dibujada abajo
  ctx.clearRect(0, 0, W, H);
  // cristal
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  bulbPath(true); ctx.fill(); bulbPath(false); ctx.fill();
  // arena de arriba
  ctx.save(); bulbPath(true); ctx.clip();
  const lvl = TOP + (MID - TOP) * (1 - a * .88);
  ctx.fillStyle = sand; ctx.beginPath();
  ctx.moveTo(0, lvl); ctx.quadraticCurveTo(W / 2, lvl + 14 * a, W, lvl); ctx.lineTo(W, MID); ctx.lineTo(0, MID); ctx.closePath();
  if (a > .003) ctx.fill();
  ctx.restore();
  // arena de abajo: montaña
  ctx.save(); bulbPath(false); ctx.clip();
  const bl = BOT - (BOT - MID) * b * .86, peak = 22 * Math.sqrt(b);
  ctx.fillStyle = sand; ctx.beginPath();
  ctx.moveTo(0, bl + 6); ctx.quadraticCurveTo(W / 2, bl - peak * 2, W, bl + 6); ctx.lineTo(W, BOT); ctx.lineTo(0, BOT); ctx.closePath();
  if (b > .003) ctx.fill();
  ctx.restore();
  // chorro
  if (flowing > .05 && a > .003) {
    ctx.strokeStyle = sand; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(W / 2, MID - 6); ctx.lineTo(W / 2, bl - peak); ctx.stroke();
    for (let i = 0; i < 2; i++) grains.push({ x: W / 2 + (Math.random() - .5) * 3, y: MID, vy: 2 + Math.random() * 3, life: 1 });
  }
  ctx.fillStyle = sand;
  for (let i = grains.length - 1; i >= 0; i--) {
    const g = grains[i]; g.y += g.vy; g.vy += .35; g.x += (Math.random() - .5) * .6;
    if (g.y > bl - peak) grains.splice(i, 1); else ctx.fillRect(g.x, g.y, 1.6, 1.6);
  }
  // contorno del cristal
  ctx.strokeStyle = fg; ctx.globalAlpha = .55; ctx.lineWidth = 2;
  bulbPath(true); ctx.stroke(); bulbPath(false); ctx.stroke(); ctx.globalAlpha = 1;
  // brillo
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; ctx.beginPath();
  ctx.moveTo(W / 2 - 80, 80); ctx.quadraticCurveTo(W / 2 - 100, 130, W / 2 - 70, 190); ctx.stroke();
  // marco de madera
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(18, 14, W - 36, 26); ctx.fillRect(18, H - 40, W - 36, 26);
  ctx.fillStyle = '#8a5a36'; ctx.fillRect(26, 40, 10, H - 80); ctx.fillRect(W - 36, 40, 10, H - 80);
  ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(18, 14, W - 36, 5); ctx.fillRect(18, H - 40, W - 36, 5);
  ctx.restore();
}
let lastY = scrollY;
gsap.ticker.add(() => {
  const dy = Math.abs(scrollY - lastY); lastY = scrollY;
  const dh = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  if (dy > 0) { topV = Math.max(0, topV - dy / dh * 1.25); flowing = 1; }
  flowing *= .92;
  draw();
});

/* ---------- darle la vuelta: brunch ⇄ tapeo ---------- */
$('#flip').addEventListener('click', () => {
  flips++;
  topV = 1 - topV;
  if (topV < .05) topV = 1;
  gsap.to('#sand', { rotation: flips * 180, duration: 1.1, ease: 'back.inOut(1.4)' });
  gsap.timeline()
    .to('.hero__txt', { opacity: 0, y: 20, duration: .3 })
    .add(() => document.body.classList.toggle('night'))
    .to('.hero__txt', { opacity: 1, y: 0, duration: .6, ease: 'expo.out' });
  flowing = 1;
});

/* ---------- entrada ---------- */
gsap.timeline({ delay: .2 })
  .from('#sand', { rotation: -180, scale: .6, opacity: 0, duration: 1.4, ease: 'back.out(1.3)' })
  .from('.hero__title', { yPercent: 40, opacity: 0, duration: 1.1, ease: 'expo.out' }, '<.2')
  .from(['.hero .kicker', '.hero__script', '.hero__lead', '.hero__row', '.rate'], { y: 24, opacity: 0, duration: .8, stagger: .08, ease: 'expo.out' }, '<.3');
ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => $('.nav').classList.toggle('is-scrolled', s.scroll() > 30) });

/* ---------- momentos: fotos que se revelan como arena que cae ---------- */
const M = [['ig/p10', 'Mesa para compartir'], ['maps/g05', 'Calamares y gambas'], ['ig/p08', 'Tapa de foie'], ['maps/g06', 'La barra'], ['ig/p11', 'Bogavante'], ['maps/g12', 'Carne a la brasa'], ['ig/p12', 'Carpaccio'], ['ig/p06', 'Sobremesa'], ['maps/g04', 'Carne a la piedra']];
$('#grid').innerHTML = M.map(([s, a]) => `<figure><img src="assets/${s}.jpg" alt="${a}" loading="lazy"></figure>`).join('');
$$('#grid figure').forEach((f, i) => gsap.fromTo(f, { '--m': '0%' }, { '--m': '101%', duration: 1.3, ease: 'power2.inOut', delay: (i % 4) * .08, scrollTrigger: { trigger: f, start: 'top 90%', once: true } }));

/* ---------- apariciones ---------- */
$$('.amor__board, .amor__txt, .carta__head, .menu, .menu__pics, .brunch article, .terraza__txt, .reviews blockquote, .reserva > *').forEach(n => gsap.from(n, { y: 50, opacity: 0, duration: 1.1, ease: 'expo.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: n, start: 'top 88%', once: true } }));
