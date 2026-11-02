// Lluvia: hilos de luz que caen sobre el fondo, con un poco de viento
(() => {
  const cv = document.getElementById('lluvia');
  if (!cv || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, drops = [], raf = 0, visible = true, inView = true, last = 0;
  const WIND = 0.16; // inclinación: cuánto se corre en x por cada px que cae

  const make = (initial) => ({
    x: Math.random() * (W + H * WIND) - H * WIND,
    y: initial ? Math.random() * H : -Math.random() * 120,
    v: 380 + Math.random() * 520,       // px por segundo
    l: 14 + Math.random() * 34,         // largo del hilo
    a: 0.25 + Math.random() * 0.45,      // opacidad
    w: Math.random() < 0.2 ? 1.6 : 1,   // grosor
    c: Math.random() < 0.6 ? '2,8,22' : '5,20,50',
  });

  const size = () => {
    const r = cv.getBoundingClientRect();
    dpr = 1; // las gotas son finas: no hace falta más resolución
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(220, Math.max(70, (W * H) / 9000)));
    drops = Array.from({ length: n }, () => make(true));
  };

  const draw = (now) => {
    raf = 0;
    if (!visible || !inView) { last = 0; return; }
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    ctx.clearRect(0, 0, W, H);
    for (const d of drops) {
      d.y += d.v * dt;
      d.x += d.v * WIND * dt;
      if (d.y - d.l > H || d.x > W + 40) Object.assign(d, make(false));
      const x2 = d.x - d.l * WIND, y2 = d.y - d.l;
      const g = ctx.createLinearGradient(d.x, d.y, x2, y2);
      g.addColorStop(0, `rgba(${d.c},${d.a})`);
      g.addColorStop(1, `rgba(${d.c},0)`);
      ctx.strokeStyle = g;
      ctx.lineWidth = d.w;
      ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(x2, y2); ctx.stroke();
    }
    raf = requestAnimationFrame(draw);
  };
  const kick = () => { if (!raf && visible && inView) raf = requestAnimationFrame(draw); };

  new ResizeObserver(() => { size(); kick(); }).observe(cv);
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; kick(); }).observe(cv);
  document.addEventListener('visibilitychange', () => { visible = document.visibilityState === 'visible'; kick(); });
  size(); kick();
})();

// Tabs animados: la "píldora" sigue al mouse (hover) y vuelve al tab activo; el activo cambia con el scroll.
(() => {
  const nav = document.querySelector('.tabs');
  if (!nav) return;
  const pill = nav.querySelector('.tabs__pill');
  const tabs = [...nav.querySelectorAll('.tabs__tab')];
  let active = tabs[0];

  const moveTo = (tab) => {
    pill.style.width = tab.offsetWidth + 'px';
    pill.style.transform = `translateX(${tab.offsetLeft}px)`;
    pill.style.opacity = 1;
  };
  const setActive = (tab) => {
    if (tab === active) return;
    active.classList.remove('is-active');
    active = tab; tab.classList.add('is-active');
    moveTo(tab);
    if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: tab.offsetLeft - (nav.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
  };

  tabs.forEach((t) => {
    t.addEventListener('mouseenter', () => moveTo(t));
    t.addEventListener('focus', () => moveTo(t));
    t.addEventListener('click', () => setActive(t));
  });
  nav.addEventListener('mouseleave', () => moveTo(active));
  window.addEventListener('resize', () => moveTo(active));

  const targets = tabs.map((t) => document.getElementById(t.dataset.id));
  const onScroll = () => {
    const mid = window.innerHeight * 0.45;
    let cur = tabs[0];
    targets.forEach((el, i) => { if (el && el.getBoundingClientRect().top <= mid && i > 0) cur = tabs[i]; });
    setActive(cur);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { moveTo(active); onScroll(); });
  moveTo(active);
})();

// Texto "scramble": los caracteres se mezclan y se van acomodando hasta mostrar el texto final.
(() => {
  const els = [...document.querySelectorAll('[data-scramble]')];
  if (!els.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const DURATION = 900, STEP = 40; // ms
  const rnd = () => CHARS[Math.floor(Math.random() * CHARS.length)];
  const mix = (txt, done) => [...txt].map((c, i) => (c === ' ' || i < done ? c : rnd())).join('');

  const run = (el, delay) => {
    const txt = el.dataset.final;
    setTimeout(() => {
      const t0 = performance.now();
      let last = 0;
      const tick = (now) => {
        const p = Math.min((now - t0) / DURATION, 1);
        if (now - last >= STEP || p === 1) {
          last = now;
          el.textContent = p === 1 ? txt : mix(txt, Math.floor(p * txt.length));
        }
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
  };

  els.forEach((el) => {
    el.dataset.final = el.textContent;
    el.setAttribute('aria-label', el.dataset.final);
    if (reduce) return;
    el.style.minHeight = el.offsetHeight + 'px'; // el alto no salta mientras se mezcla
    el.textContent = mix(el.dataset.final, 0);
  });
  if (reduce) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const siblings = [...e.target.closest('ul').querySelectorAll('[data-scramble]')];
      run(e.target, siblings.indexOf(e.target) * 70);
    });
  }, { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
})();

// "Por qué" queda fijo mientras la sección oscura sube y lo cubre; si es más alto que la pantalla se fija por abajo.
(() => {
  const fixed = [...document.querySelectorAll('.porque, .soluciones')];
  if (!fixed.length) return;
  const fit = () => fixed.forEach((p) => { p.style.top = Math.min(0, window.innerHeight - p.offsetHeight) + 'px'; });
  fit();
  window.addEventListener('resize', fit);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
  // el gráfico crece cuando entra en pantalla
  const chart = document.querySelector('.chart');
  if (chart) new IntersectionObserver(([e], io) => { if (e.isIntersecting) { chart.classList.add('in'); io.disconnect(); } }, { threshold: 0.4 }).observe(chart);
})();

// Ideas: las tarjetas entran desde los costados y el título se "enciende" palabra por palabra con el scroll.
(() => {
  const sec = document.getElementById('ideas');
  if (!sec) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.2 });
  sec.querySelectorAll('.idea').forEach((el) => (reduce ? el.classList.add('in') : io.observe(el)));

  const title = sec.querySelector('[data-reveal-words]');
  if (!title || reduce) return;
  const words = title.textContent.trim().split(/\s+/);
  title.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
  const spans = [...title.querySelectorAll('.w')];
  const upd = () => {
    const r = title.getBoundingClientRect(), vh = window.innerHeight;
    const prog = Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (vh * 0.45)));
    const n = Math.round(prog * spans.length);
    spans.forEach((s, i) => s.classList.toggle('on', i < n));
  };
  window.addEventListener('scroll', upd, { passive: true });
  window.addEventListener('resize', upd);
  upd();
})();

// Frase en loop: cada letra sube de color y se inclina en ola (TextShimmerWave). Se divide en letras con su retardo.
(() => {
  const el = document.querySelector('[data-wave]');
  if (!el) return;
  const txt = el.textContent;
  const n = txt.length;
  const dur = 1, spread = 1, pause = n * 0.05; // igual que el componente original
  el.style.setProperty('--cycle', (dur + pause) + 's');
  el.style.setProperty('--step', (dur / (n / spread)) + 's');
  el.textContent = '';
  [...txt].forEach((ch, i) => {
    const s = document.createElement('span');
    s.className = 'c'; s.setAttribute('aria-hidden', 'true');
    s.style.setProperty('--i', i);
    s.textContent = ch === ' ' ? '\u00a0' : ch;
    el.appendChild(s);
  });
})();

// MacBook: aparece al entrar en pantalla y en el buscador se va escribiendo la pregunta, en loop.
(() => {
  const els = document.querySelectorAll('.cta [data-reveal]');
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.25 });
  els.forEach((el) => io.observe(el));

  const out = document.querySelector('.gs__typed');
  if (!out) return;
  const text = out.dataset.type;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { out.textContent = text; return; }
  let vis = false, started = false;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const run = async () => {
    for (;;) {
      while (!vis) await wait(300);
      for (let i = 1; i <= text.length; i++) { out.textContent = text.slice(0, i); await wait(i === 1 ? 600 : 95 + Math.random() * 70); }
      await wait(2600);
      for (let i = text.length; i >= 0; i--) { out.textContent = text.slice(0, i); await wait(32); }
      await wait(700);
    }
  };
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !started) { started = true; run(); } }, { threshold: 0.35 }).observe(document.querySelector('.mac'));
})();

// Botón magnético (Magnetic): sigue al puntero con un resorte suave cuando está cerca; el texto se mueve un poco más.
(() => {
  const els = [...document.querySelectorAll('[data-magnetic]')];
  if (!els.length || matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(hover: none)').matches) return;
  const RANGE = 200, K = 170, DAMP = 20; // rigidez y amortiguación (rebote ~0.1)
  const st = els.map((el) => ({ el, k: parseFloat(el.dataset.magnetic) || 0.2, x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 }));
  let px = -9999, py = -9999, raf = 0, last = 0;
  const target = () => {
    st.forEach((s) => {
      // el centro se mide sin la propia traslación, para no realimentarse
      const r = s.el.getBoundingClientRect();
      const cx = r.left + r.width / 2 - s.x, cy = r.top + r.height / 2 - s.y;
      const dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy);
      const near = d < RANGE + Math.max(r.width, r.height) / 2;
      s.tx = near ? dx * s.k : 0; s.ty = near ? dy * s.k : 0;
    });
  };
  const loop = (now) => {
    const dt = Math.min((now - last) / 1000, 0.032) || 0.016; last = now;
    let moving = false;
    st.forEach((s) => {
      s.vx += ((s.tx - s.x) * K - s.vx * DAMP) * dt; s.vy += ((s.ty - s.y) * K - s.vy * DAMP) * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.el.style.transform = `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0)`;
      if (Math.abs(s.vx) + Math.abs(s.vy) + Math.abs(s.tx - s.x) + Math.abs(s.ty - s.y) > 0.05) moving = true;
    });
    raf = moving ? requestAnimationFrame(loop) : 0;
  };
  window.addEventListener('pointermove', (e) => {
    px = e.clientX; py = e.clientY; target();
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
  }, { passive: true });
})();

// Ondas en blanco y negro: el negro de la sección se va convirtiendo en blanco hacia el footer (shader "Waves" de 21st.dev, en JS puro).
(() => {
  const canvas = document.getElementById('waves');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false });
  if (!gl) return;
  const VERT = `attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`;
  const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec3 u_colors[8];
uniform vec4 u_scene;
uniform vec4 u_shape;
uniform vec4 u_surface;
uniform vec4 u_finish;
uniform vec4 u_transform;
uniform vec4 u_space;
#define u_resolution u_scene.xy
#define u_time u_scene.z
#define u_colorCount u_scene.w
#define u_scale u_shape.x
#define u_intensity u_shape.y
#define u_warp u_shape.w
#define u_detail u_surface.x
#define u_contrast u_surface.y
#define u_grain u_finish.w
#define u_blur u_finish.z
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define u_seed u_transform.x
#else
#define u_seed mod(u_transform.x, 31.0)
#endif
#define u_rotate u_transform.y
#define u_drift u_transform.z
#define u_offset u_space.xy
float hash21(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float grainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.0, 9.2); a *= 0.5; }
  return v;
}
vec3 palette(float x) {
  float n = max(u_colorCount - 1.0, 1.0);
  float f = clamp(x, 0.0, 1.0) * n;
  vec3 col = u_colors[0];
  for (int i = 0; i < 7; i++) {
    if (float(i) < n) col = mix(col, u_colors[i + 1], smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));
  }
  return col;
}
vec3 shade(vec2 uv, vec2 p, float t) {
  float y = uv.y + sin(uv.x * (3.0 + u_intensity * 9.0) + t * 0.8) * 0.08 + (fbm(p * 2.0 + t * 0.1) - 0.5) * u_intensity * 0.6;
  return palette(y);
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  uv = p * min(u_resolution.x, u_resolution.y) / u_resolution.xy + 0.5;
  p *= u_scale;
  if (abs(u_rotate) > 0.0001) { float cr = cos(u_rotate), sr = sin(u_rotate); p = mat2(cr, -sr, sr, cr) * p; }
  p += u_offset;
  if (u_drift > 0.0001) p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));
  if (u_warp > 0.0) p += u_warp * (vec2(fbm(p * u_detail + u_seed), fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);
  vec3 col = shade(uv, p, u_time);
  if (abs(u_contrast - 1.0) > 0.0001) col = (col - 0.5) * u_contrast + 0.5;
  if (u_grain > 0.0001) col += (grainHash(gl_FragCoord.xy + vec2(u_seed * 17.0, u_seed * 31.0)) - 0.5) * u_grain;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  // De abajo (blanco) hacia arriba (negro de la sección)
  const COLORS = ['#ffffff', '#ffffff', '#ececec', '#a8a8a8', '#3a3a3a', '#0a0a0a', '#0a0a0a', '#0a0a0a'].map(hex);
  const U = { colorCount: 7, scale: 2.0, intensity: 0.54, warp: 0.042, detail: 1.536, contrast: 1.0, grain: 0.04, seed: 4012, rotate: 5.6549, offsetX: 0.11, offsetY: -0.19, drift: 0.116, timeScale: -0.727 };
  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_position');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(prog, n);
  const uScene = u('u_scene');
  gl.uniform3fv(u('u_colors'), new Float32Array(COLORS.flat()));
  gl.uniform4f(u('u_shape'), U.scale, U.intensity, 0.47, U.warp);
  gl.uniform4f(u('u_surface'), U.detail, U.contrast, 0, 1);
  gl.uniform4f(u('u_finish'), 0, 0, 0.0, U.grain);
  gl.uniform4f(u('u_transform'), U.seed, U.rotate, U.drift, 0);
  gl.uniform4f(u('u_space'), U.offsetX, U.offsetY, 0, 0);
  const resize = () => {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.round(r.width * dpr * 0.6)), h = Math.max(1, Math.round(r.height * dpr * 0.6)); // se ve difuso: no hace falta más resolución
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t0 = performance.now();
  let raf = 0, inView = false;
  const draw = (now) => {
    raf = 0;
    if (!inView) return;
    resize();
    gl.uniform4f(uScene, canvas.width, canvas.height, ((now - t0) / 1000) * U.timeScale, U.colorCount);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduce) raf = requestAnimationFrame(draw);
  };
  const kick = () => { if (!raf && inView) raf = requestAnimationFrame(draw); };
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; kick(); }).observe(canvas);
  new ResizeObserver(kick).observe(canvas);
})();
