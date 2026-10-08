/* Intro "caschetto": pixel-art bob spinning while the site loads.
   Shown once per browser session. Needs #bobIntro markup + /img/caschetto.png. */
(() => {
  const intro = document.getElementById("bobIntro");
  if (!intro) return;
  let seen = false;
  try { seen = sessionStorage.getItem("me-intro") === "1"; } catch (e) {}
  if (seen) { intro.remove(); return; }
  try { sessionStorage.setItem("me-intro", "1"); } catch (e) {}
  document.documentElement.classList.add("intro-on");

  const FRAMES = 24, W = 96, H = 96;
  const cv = intro.querySelector("#sprite"), ctx = cv.getContext("2d");
  const lineEl = intro.querySelector("#introLine"), blocksEl = intro.querySelector("#introBlocks");
  const veil = document.createElement("canvas"); veil.id = "introVeil"; veil.hidden = true; document.body.appendChild(veil);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NB = 16;
  for (let i = 0; i < NB; i++) blocksEl.appendChild(document.createElement("i"));
  const blocks = [...blocksEl.children];
  const it = (document.documentElement.lang || "en").startsWith("it") || (() => { try { return localStorage.getItem("me-lang") === "it"; } catch (e) { return false; } })();
  const LINES = it
    ? ["carico il gel", "pettino la frangia", "lucido il biondo", "mi sistemo il caschetto"]
    : ["applying the gel", "combing the fringe", "polishing the blond", "fixing my bowl cut"];

  function fit() {
    const s = Math.max(2, Math.floor(Math.min(innerWidth, innerHeight * .85) * .55 / W));
    cv.style.width = W * s + "px"; cv.style.height = 100 * s + "px";
    blocksEl.style.gap = Math.max(2, s) + "px";
    blocks.forEach(b => { b.style.width = b.style.height = Math.round(s * 3.4) + "px"; });
  }
  addEventListener("resize", fit); fit();

  const frame = document.createElement("canvas"); frame.width = W; frame.height = H;
  const fctx = frame.getContext("2d");
  const tiny = document.createElement("canvas"); const tctx = tiny.getContext("2d");
  [ctx, fctx, tctx].forEach(c => c.imageSmoothingEnabled = false);
  const sheet = new Image(); let sheetReady = false;
  sheet.onload = () => { sheetReady = true; };
  sheet.onerror = () => { sheetReady = true; };   // never block the site on the sprite
  sheet.src = "/img/caschetto.png";

  function shadow(off) {
    const cx = 48, cy = 92, rx = 26 - off, ry = 4;
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
      if (d > 1 || (d > .45 && (x + y) % 2)) continue;
      ctx.fillStyle = d < .45 ? "#E3DDF2" : "#ECE8F7";
      ctx.fillRect(cx + x, cy + y, 1, 1);
    }
  }
  function draw(f, block, bob) {
    fctx.clearRect(0, 0, W, H);
    if (sheet.naturalWidth) fctx.drawImage(sheet, f * W, 0, W, H, 0, 0, W, H);
    ctx.clearRect(0, 0, W, 100);
    shadow(bob ? 2 : 0);
    if (block > 1) {
      const w = Math.ceil(W / block), h = Math.ceil(H / block);
      tiny.width = w; tiny.height = h; tctx.imageSmoothingEnabled = false;
      tctx.drawImage(frame, 0, 0, w, h);
      ctx.drawImage(tiny, 0, 0, w, h, 0, -bob, w * block, h * block);
    } else ctx.drawImage(frame, 0, -bob);
  }

  // progress = slower of a minimum duration and the real page load (+ content)
  let pageLoaded = document.readyState === "complete";
  addEventListener("load", () => { pageLoaded = true; });
  const MIN_MS = reduce ? 600 : 2800, HARD_MS = 9000;
  let t0 = performance.now(), last = t0, shown = 0, f = 0, acc = 0, phase = "load", exitT = 0;
  const steps = [12, 8, 6, 4, 3, 2, 1, 1];

  function tick(now) {
    const dt = now - last; last = now;
    const t = now - t0;
    const ready = pageLoaded || t > HARD_MS;
    const target = Math.min(Math.min(t / MIN_MS, 1), ready ? 1 : .92) * 100;
    shown = Math.min(100, shown + Math.max(0, (target - shown) * .15));
    if (target === 100 && shown > 99.5) shown = 100;
    const p = Math.floor(shown);
    blocks.forEach((b, i) => b.classList.toggle("on", i < Math.round(p / 100 * NB)));
    lineEl.textContent = LINES[Math.min(LINES.length - 1, Math.floor(p / 100 * LINES.length))];
    const fps = phase === "spin" ? 40 : 12;
    acc += dt;
    if (!reduce) while (acc > 1000 / fps) { acc -= 1000 / fps; f = (f + 1) % FRAMES; }
    const block = steps[Math.min(steps.length - 1, Math.floor(p / 100 * (steps.length - 1)))];
    if (sheetReady) draw(f, block, reduce ? 0 : Math.floor(now / 330) % 2);
    if (phase === "load" && shown === 100 && sheetReady) { phase = "spin"; exitT = now; }
    if (phase === "spin" && now - exitT > (reduce ? 150 : 750)) { dissolve(); return; }
    requestAnimationFrame(tick);
  }

  function dissolve() {
    const cell = Math.max(24, Math.round(Math.min(innerWidth, innerHeight) / 14));
    const cols = Math.ceil(innerWidth / cell), rows = Math.ceil(innerHeight / cell);
    veil.width = cols; veil.height = rows;
    veil.style.width = cols * cell + "px"; veil.style.height = rows * cell + "px";
    const v = veil.getContext("2d"); v.fillStyle = "#ffffff"; v.fillRect(0, 0, cols, rows);
    veil.hidden = false; intro.remove();
    document.documentElement.classList.remove("intro-on");
    const order = [...Array(cols * rows).keys()].sort(() => Math.random() - .5);
    const dur = reduce ? 1 : 650, start = performance.now(); let i = 0;
    (function step(now) {
      const k = Math.min((now - start) / dur, 1), upto = Math.floor(k * order.length);
      for (; i < upto; i++) { const c = order[i]; v.clearRect(c % cols, Math.floor(c / cols), 1, 1); }
      if (k < 1) requestAnimationFrame(step); else veil.remove();
    })(start);
  }
  requestAnimationFrame(tick);
})();
