// Footer "Ridgeline Dither" (21st.dev) portado a JS puro: montañas en dither ordenado,
// bruma que se mueve, puntero que abre un claro y altímetro sobre la cresta.
// Paleta propia de Zócalo (azules glaciar sobre blanco).
(() => {
  const root = document.querySelector('.rdf-root');
  if (!root) return;
  const scene = root.querySelector('.rdf-scene');
  const canvas = scene.querySelector('canvas');
  const alt = root.querySelector('.rdf-alt');
  const altText = alt.querySelector('span');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // ── utilidades (igual que el original) ──
  const hex = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h.trim()); return m ? [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)] : null; };
  const pack = (c) => ((255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0;
  const BAYER = [
    0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26,
    12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
    15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
  ].map((v) => (v + 0.5) / 64);
  const dither = (tone, n, b) => { const t = tone < 0 ? 0 : tone > 1 ? 1 : tone; const v = Math.floor(t * (n - 1) + b); return v > n - 1 ? n - 1 : v; };
  const hash = (x, y, seed) => {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  const noise = (x, y, seed) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed), c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, y, seed, oct) => {
    let sum = 0, amp = 0.5, norm = 0;
    for (let o = 0; o < oct; o++) { sum += noise(x, y, seed + o * 31) * amp; norm += amp; x *= 2.03; y *= 2.03; amp *= 0.5; }
    return norm > 0 ? sum / norm : 0;
  };
  const smooth = (e0, e1, x) => { const t = e1 === e0 ? (x < e0 ? 0 : 1) : Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  const ease = (t) => { const c = t < 0 ? 0 : t > 1 ? 1 : t; return 1 - Math.pow(1 - c, 3); };
  const ridgeline = (cols, rows, i, layers, seed, margin) => {
    const k = layers > 1 ? i / (layers - 1) : 1;
    const n = cols + margin * 2, out = new Float32Array(n);
    const base = rows * (0.38 + 0.66 * Math.pow(k, 1.4));
    const amp = rows * (0.2 + 0.24 * k);
    const freq = 6 - 3.8 * k;
    const flankL = rows * 0.5 * k * k * k * (0.55 + 0.6 * hash(i, 11, seed));
    const flankR = rows * 0.5 * k * k * k * (0.55 + 0.6 * hash(i, 13, seed));
    const ceil = rows * 0.17;
    const tilt = (hash(i, 7, seed) - 0.5) * rows * 0.34 * (0.4 + k);
    const s = (seed | 0) * 13 + i * 101;
    for (let x = 0; x < n; x++) {
      const u = (x - margin) / cols;
      const r1 = 1 - Math.abs(noise(u * freq + i * 3.7, 0.5, s) * 2 - 1);
      const r2 = 1 - Math.abs(noise(u * freq * 2.3, 3.5, s + 1) * 2 - 1);
      const f = fbm(u * freq * 4.1, 9.5, s + 2, 3);
      const h = r1 * r1 * 0.62 + r2 * 0.24 + f * 0.14;
      const e = Math.min(1.2, Math.abs(u * 2 - 1));
      const y = base - h * amp + tilt * (u - 0.5) * 2 - (u < 0.5 ? flankL : flankR) * e * e * Math.sqrt(e);
      out[x] = y < ceil ? ceil - (ceil - y) * 0.25 : y;
    }
    return out;
  };
  const elevation = (crest, rows, layer, layers) => {
    const up = rows > 0 ? 1 - Math.min(1, Math.max(0, crest / rows)) : 0;
    return Math.round(420 + up * 2600 + (layers - 1 - layer) * 140);
  };

  // ── configuración ──
  const TONES = ['#ffffff', '#d6e6f4', '#a8cae7', '#6b9ecc', '#34679a', '#1a3e66', '#0b2140'];
  const O = { seed: 23, layers: 7, pixel: 2, mist: 0.8, drift: 1, radius: 130, interactive: true };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pal = new Uint32Array(TONES.map((t) => pack(hex(t))));
  const nTones = pal.length;
  const layers = O.layers;

  let p = 2, cols = 1, rows = 1, margin = 2, img = null, buf = new Uint32Array(0);
  let tops = [], pools = [];
  let colTop = new Float32Array(0), colSlope = new Float32Array(0), colPool = new Float32Array(0);
  let fog = new Float32Array(0), fw = 1, fh = 1, ceil = 0, fadeTo = 1;
  let raf = 0, visible = true, awake = true, lastDraw = 0, lastTick = performance.now();
  let tx = 0, ty = 0, ex = 0, ey = 0, inside = false, clear = 0, pt = 0, pe = 0, windV = 0, windX = 0;
  let altShown = false, altLabel = '';
  let revealAt = null;

  const layout = () => {
    const rect = scene.getBoundingClientRect();
    p = Math.max(1, Math.round(O.pixel));
    cols = Math.max(8, Math.ceil(rect.width / p));
    rows = Math.max(8, Math.ceil(rect.height / p));
    canvas.width = cols; canvas.height = rows;
    canvas.style.width = cols * p + 'px'; canvas.style.height = rows * p + 'px';
    img = ctx.createImageData(cols, rows);
    buf = new Uint32Array(img.data.buffer);
    margin = Math.ceil(cols * 0.045) + 3;
    ceil = Math.max(rows * 0.17, 92 / p);
    fadeTo = Math.max(rows * 0.3, 128 / p);
    tops = []; pools = [];
    for (let i = 0; i < layers; i++) {
      const t = ridgeline(cols, rows, i, layers, O.seed, margin);
      for (let x = 0; x < t.length; x++) if (t[x] < ceil) t[x] = ceil - (ceil - t[x]) * 0.2;
      const pool = new Float32Array(t.length);
      for (let x = 0; x < t.length; x++) pool[x] = 0.45 + 1.1 * fbm(((x - margin) / cols) * 4, i * 5.3, O.seed + 9, 2);
      tops.push(t); pools.push(pool);
    }
    colTop = new Float32Array(layers * cols); colSlope = new Float32Array(layers * cols); colPool = new Float32Array(layers * cols);
    fw = (cols >> 1) + 2; fh = (rows >> 1) + 2; fog = new Float32Array(fw * fh);
    awake = true;
  };

  const draw = (now) => {
    if (!img) return;
    const dt = Math.min(64, now - lastTick); lastTick = now;
    const live = O.interactive && !reduced;
    const age = revealAt === null ? -1 : now - revealAt;
    const easeF = 1 - Math.pow(0.82, dt / 16.7), slow = 1 - Math.pow(0.93, dt / 16.7);
    ex += (tx - ex) * easeF; ey += (ty - ey) * easeF;
    clear += ((inside && O.interactive ? 1 : 0) - clear) * slow;
    pe += ((live ? pt : 0) - pe) * slow;
    windV *= Math.pow(0.965, dt / 16.7); windX += (windV * dt) / 1000;
    const fogT = (reduced ? 0 : (now / 1000) * 0.045 * Math.max(0, O.drift)) + windX;

    const sx = 9 / cols, sy = 4.4 / rows;
    for (let gy = 0; gy < fh; gy++) {
      const ny = gy * sy;
      for (let gx = 0; gx < fw; gx++) {
        const nx = gx * sx + fogT;
        const warp = noise(nx * 0.45 - fogT * 0.6, ny * 0.8, 77) * 0.6;
        fog[gy * fw + gx] = smooth(0.3, 0.74, fbm(nx + warp, ny + warp * 0.4, 31, 3));
      }
    }

    const rev = new Float32Array(layers), k = new Float32Array(layers), toneBase = new Float32Array(layers), fogDepth = new Float32Array(layers);
    for (let i = 0; i < layers; i++) {
      k[i] = i / (layers - 1);
      rev[i] = age < 0 ? 0 : ease((age - 380 - i * 170) / 1300);
      toneBase[i] = 0.16 + 0.76 * Math.pow(k[i], 1.6);
      fogDepth[i] = rows * (0.08 + 0.42 * k[i]);
      const rise = (1 - rev[i]) * rows * 0.09;
      const shift = Math.round(pe * (0.25 + k[i]) * 0.75 * (margin - 3));
      const t = tops[i], last = t.length - 1;
      for (let x = 0; x < cols; x++) {
        const at = x + margin + shift;
        colTop[i * cols + x] = t[at] + rise;
        colSlope[i * cols + x] = t[Math.min(last, at + 2)] - t[Math.max(0, at - 2)];
        colPool[i * cols + x] = fogDepth[i] * pools[i][at];
      }
    }
    const lift = age < 0 ? 1 : 1 - ease((age - 900) / 1800);
    const mistK = Math.max(0, Math.min(1, O.mist));
    const r = Math.max(1, O.radius / p), r2 = r * r;

    for (let y = 0; y < rows; y++) {
      const fade = smooth(0, fadeTo, y), frow = (y >> 1) * fw, by = (y & 7) * 8, dyc = (y - ey) * 1.5;
      for (let x = 0; x < cols; x++) {
        let L = -1;
        for (let i = layers - 1; i >= 0; i--) if (y >= colTop[i * cols + x]) { L = i; break; }
        let tone = 0, mk = 0.3;
        if (L >= 0) {
          const kk = k[L], d = y - colTop[L * cols + x], depth = colPool[L * cols + x];
          const crest = 1 - smooth(0, depth, d) * (0.88 - 0.45 * kk);
          tone = toneBase[L] * crest;
          const sl = colSlope[L * cols + x] * 0.06;
          tone += (sl < -0.2 ? -0.2 : sl > 0.2 ? 0.2 : sl) * (1 - smooth(0, depth * 0.5, d));
          tone += (hash(x + Math.round(colTop[L * cols + x] * 7), d | 0, L) - 0.5) * 0.07 * kk;
          tone *= rev[L];
          mk = 0.95 - 0.5 * kk;
        } else {
          tone = 0.05 * smooth(rows * 0.15, rows * 0.6, y);
        }
        let m = fog[frow + (x >> 1)] * mistK * mk;
        if (clear > 0.01) {
          const dx = x - ex, q = (dx * dx + dyc * dyc) / r2;
          if (q < 4) { const c = clear * Math.exp(-q); m *= 1 - c * 0.92; if (L >= 0) tone += c * 0.16 * rev[L]; }
        }
        if (tone > 0.93) tone = 0.93;
        m += lift * 0.55; if (m > 1) m = 1;
        tone = (tone * (1 - m) + 0.09 * m * (1 - lift)) * fade;
        buf[y * cols + x] = pal[dither(tone, nTones, BAYER[by + (x & 7)])];
      }
    }
    ctx.putImageData(img, 0, 0);

    let show = false;
    if (inside && age > 1600) {
      const x = Math.max(0, Math.min(cols - 1, Math.round(ex)));
      for (let i = layers - 1; i >= 0; i--) {
        const crest = colTop[i * cols + x];
        if (ey >= crest - 6) {
          show = true;
          alt.style.transform = 'translate(' + (x * p).toFixed(1) + 'px,' + (crest * p).toFixed(1) + 'px)';
          const text = elevation(crest, rows, i, layers).toLocaleString('en-US') + ' m';
          if (text !== altLabel) { altLabel = text; altText.textContent = text; }
          break;
        }
      }
    }
    if (show !== altShown) { altShown = show; alt.style.opacity = show ? '1' : '0'; }

    const settling = Math.abs(tx - ex) + Math.abs(ty - ey) > 0.05 || Math.abs((inside && O.interactive ? 1 : 0) - clear) > 0.005 || Math.abs((live ? pt : 0) - pe) > 0.001 || Math.abs(windV) > 0.002;
    awake = (age >= 0 && age < 3400) || age < 0 || settling || (!reduced && O.drift > 0);
  };

  const busy = () => {
    const age = revealAt === null ? -1 : performance.now() - revealAt;
    return (age >= 0 && age < 3400) || inside || Math.abs(windV) > 0.002 || Math.abs(pt - pe) > 0.001;
  };
  const loop = (now) => {
    raf = 0;
    if (!visible) return;
    if (revealAt === null) { raf = requestAnimationFrame(loop); return; }
    if (busy() || now - lastDraw > 32) { draw(now); lastDraw = now; }
    if (awake) raf = requestAnimationFrame(loop);
  };
  const wake = () => { awake = true; if (!raf && visible) raf = requestAnimationFrame(loop); };

  root.addEventListener('pointermove', (e) => {
    const b = root.getBoundingClientRect();
    pt = b.width > 0 ? ((e.clientX - b.left) / b.width) * 2 - 1 : 0;
    const s = scene.getBoundingClientRect();
    const lx = (e.clientX - s.left) / p, ly = (e.clientY - s.top) / p;
    const was = inside;
    inside = lx >= 0 && ly >= 0 && lx < cols && ly < rows;
    tx = lx; ty = ly;
    if (inside && !was) { ex = tx; ey = ty; }
    wake();
  });
  root.addEventListener('pointerleave', () => { pt = 0; inside = false; wake(); });
  root.addEventListener('pointerdown', (e) => {
    if (reduced || !inside || e.target.closest('a,button')) return;
    windV += tx < cols / 2 ? 1.4 : -1.4; // una ráfaga empuja la bruma hacia el otro lado
    wake();
  });

  layout(); draw(performance.now()); wake();
  new ResizeObserver(() => { layout(); draw(performance.now()); wake(); }).observe(scene);
  new IntersectionObserver((entries) => {
    visible = entries[0] ? entries[0].isIntersecting : true;
    if (visible) { lastTick = performance.now(); wake(); }
  }).observe(root);

  // La entrada empieza una sola vez, cuando se ve un quinto del footer.
  const rio = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    if (revealAt === null) revealAt = reduced ? -Infinity : performance.now();
    root.classList.add('rdf-in');
    rio.disconnect();
  }, { threshold: 0.2 });
  rio.observe(root);
})();
