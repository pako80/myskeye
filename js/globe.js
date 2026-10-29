/* Skeye hero globe: a 3D network of interconnected dots.
   Intro: camera starts close to the surface, then pulls back to an orbital view while the globe spins. */
(() => {
  const canvas = document.getElementById('globe');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hero = canvas.parentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Geometry: evenly spread dots on a Fibonacci sphere ----
  const N = 1100, GOLD = Math.PI * (3 - Math.sqrt(5));
  const pts = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - y * y), a = i * GOLD;
    pts.push({ x: Math.cos(a) * r, y, z: Math.sin(a) * r });
  }
  // dots that light up at random
  const LIT_COUNT = 18, lit = [];
  function spawnLit(el) {
    lit.push({ i: Math.floor(Math.random() * N), t: el, dur: 1.6 + Math.random() * 1.8 });
  }

  // ---- Camera / timing ----
  const D_START = 1.22, D_END = 3.1;       // camera distance from globe centre (radius = 1)
  const INTRO = 6.5, DELAY = 0.35;         // seconds
  const TILT_START = -0.15, TILT_END = 0.42; // radians
  const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 4)); // easeOutQuart
  const lerp = (a, b, t) => a + (b - a) * t;

  let W = 0, H = 0, dpr = 1, homeX = 0, homeY = 0, Rfinal = 0;
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    const wide = W > 900;
    Rfinal = wide ? Math.min(H * 0.46, W * 0.28) : Math.min(W * 0.46, H * 0.3);
    homeX = wide ? W * 0.72 : W * 0.5;
    homeY = wide ? H * 0.5 : H * 0.84;
  }

  let yaw = 0, last = 0, t0 = 0, mixT0 = null, running = false, raf = 0;

  function draw(now) {
    const el = reduce ? INTRO + DELAY : (now - t0) / 1000;
    const dt = Math.min((now - last) / 1000 || 0, 0.05); last = now;
    const e = ease((el - DELAY) / INTRO);

    const D = lerp(D_START, D_END, e);
    const tilt = lerp(TILT_START, TILT_END, e);
    const f = Rfinal * Math.sqrt(D_END * D_END - 1);          // focal length keeps final size = Rfinal
    const cx = lerp(W * 0.5, homeX, e), cy = lerp(H * 0.5, homeY, e);
    yaw += (reduce ? 0 : (0.11 + 0.75 * (1 - e)) * dt);          // fast at first, settles to a slow orbit

    // cross-fade into the photoreal Earth once the zoom-out has settled and its textures are ready
    const E = window.skEarth;
    if (!reduce && E && E.ready && mixT0 === null && el > DELAY + INTRO * 0.75) mixT0 = el;
    let mix = mixT0 === null ? 0 : Math.min(1, (el - mixT0) / 2.4);
    mix = mix * mix * (3 - 2 * mix);
    const earthState = () => ({ W, H, dpr, f: Rfinal * Math.sqrt(D_END * D_END - 1), dx: homeX - W / 2, dy: homeY - H / 2, D: D_END, yaw, tilt, mix });
    if (mix >= 1) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      canvas.style.opacity = '0';
      E.render(earthState());
      if (running) raf = requestAnimationFrame(draw);
      return;
    }
    canvas.style.opacity = String(1 - mix);

    const cyw = Math.cos(yaw), syw = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // project
    const P = new Array(N);
    const horizon = 1 / D;
    for (let i = 0; i < N; i++) {
      const p = pts[i];
      const x1 = p.x * cyw + p.z * syw, z1 = -p.x * syw + p.z * cyw;
      const y2 = p.y * ct - z1 * st, z2 = p.y * st + z1 * ct;
      const k = f / (D - z2);
      P[i] = { sx: cx + x1 * k, sy: cy - y2 * k, z: z2, k, vis: z2 > horizon * 0.92 };
    }

    // dots
    const kRef = f / (D_END - 1);
    for (let i = 0; i < N; i++) {
      const q = P[i];
      if (!q.vis) continue;
      const al = Math.max(0.1, (q.z - horizon * 0.6) / (1 - horizon * 0.6));
      const r = Math.max(0.7, 1.9 * (q.k / kRef) ** 0.9);
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, al * 0.95)})`;
      ctx.beginPath(); ctx.arc(q.sx, q.sy, r, 0, 7); ctx.fill();
    }
    // random lit dots
    if (!reduce) {
      for (let k = lit.length - 1; k >= 0; k--) if (el - lit[k].t > lit[k].dur) lit.splice(k, 1);
      while (lit.length < LIT_COUNT && Math.random() < 0.25) spawnLit(el);
    } else if (!lit.length) {
      for (let k = 0; k < LIT_COUNT; k++) lit.push({ i: Math.floor(((k + 0.5) / LIT_COUNT) * N), t: 0, dur: 2, still: true });
    }
    for (const L of lit) {
      const q = P[L.i];
      if (!q.vis || q.z < horizon + 0.12) continue;
      const env = L.still ? 0.8 : Math.sin(Math.PI * Math.min(1, (el - L.t) / L.dur));
      const sc = q.k / kRef;
      const gr = (5 + 14 * env) * sc;
      const g = ctx.createRadialGradient(q.sx, q.sy, 0, q.sx, q.sy, gr);
      g.addColorStop(0, `rgba(255,255,255,${0.75 * env})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.sx, q.sy, gr, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * env})`;
      ctx.beginPath(); ctx.arc(q.sx, q.sy, (2 + 1.8 * env) * sc, 0, 7); ctx.fill();
    }

    if (mix > 0) E.render(earthState());
    if (running && !reduce) raf = requestAnimationFrame(draw);
  }

  function start() {
    if (running) return;
    running = true; last = performance.now();
    if (!t0) t0 = last;
    raf = requestAnimationFrame(draw);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  resize();
  addEventListener('resize', () => { resize(); if (reduce) draw(performance.now()); });
  if (reduce) { draw(performance.now()); return; }
  new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop())).observe(hero);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
})();
