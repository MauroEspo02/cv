/* Napoli pixelata: a generative pixel-art view of the gulf (sky, Vesuvio,
   sea, Castel dell'Ovo, Posillipo pine, a boat) drawn on a fixed canvas behind
   the page. Pastel palette taken from the site tokens so text stays readable.
   Usage: <canvas id="napoli"></canvas><script src="/napoli.js" defer></script> */
(() => {
  const cv = document.getElementById("napoli");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const C = {
    white: "#FFFFFF", sky1: "#EEF7FC", sky2: "#DCEFF8", sky3: "#C8E6F4", haze: "#D7EEEA",
    sun: "#FFFBE8", sun2: "#FFF1B8",
    far: "#9DC3C6", far2: "#86B0B9", farLit: "#B8D7D2", ridge: "#76A1AC", green: "#8EBFA2", green2: "#79AE93",
    sea: "#8FCDE6", sea2: "#62B0D8", sea3: "#3E92C6", foam: "#E8F7FC", glint: "#FFF4C2",
    coast: "#7FA9B3", win: "#4E86A0",
    castle: "#9CBFC7", castleLit: "#C2DCE2",
    pine: "#3F8F60", pine2: "#2D6F4D", pineLit: "#6FB57D", trunk: "#2F5D50",
    smoke: "#F6FBFC", boat: "#FFFFFF", boatRed: "#E8504A", rail: "#E6F3F7", railDark: "#B5D6E2"
  };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const dith = (x, y, t) => (BAYER[(y & 3) * 4 + (x & 3)] + .5) / 16 < t;

  // deterministic noise so the scene looks the same on every load
  const rnd = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  let W = 0, H = 0, PX = 4, img = null;

  function resize() {
    PX = innerWidth < 600 ? 4 : innerWidth < 1400 ? 6 : 7;
    W = Math.ceil(innerWidth / PX); H = Math.ceil(innerHeight / PX);
    cv.width = W; cv.height = H;
    cv.style.width = W * PX + "px"; cv.style.height = H * PX + "px";
    paintStatic();
  }

  const set = (d, x, y, hex) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    d[i] = parseInt(hex.slice(1, 3), 16); d[i + 1] = parseInt(hex.slice(3, 5), 16); d[i + 2] = parseInt(hex.slice(5, 7), 16); d[i + 3] = 255;
  };

  let horizon = 0, base = null;

  function paintStatic() {
    const id = ctx.createImageData(W, H), d = id.data;
    horizon = Math.round(H * (W < 140 ? .74 : .72));

    // sky: white -> pale blue -> sea haze, ordered-dither bands
    const stops = [[0, C.white], [.38, C.white], [.55, C.sky1], [.72, C.sky2], [.88, C.sky3], [1, C.haze]];
    for (let y = 0; y < horizon; y++) {
      const t = y / horizon;
      let k = 0; while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
      const [t0, c0] = stops[k], [t1, c1] = stops[k + 1];
      const f = (t - t0) / (t1 - t0);
      for (let x = 0; x < W; x++) set(d, x, y, dith(x, y, f) ? c1 : c0);
    }

    // sun, low over the sea on the left
    const sx = Math.round(W * .2), sy = horizon - Math.round(H * .055), sr = Math.max(5, Math.round(Math.min(W, H) * .045));
    for (let y = -sr; y <= sr; y++) for (let x = -sr; x <= sr; x++) {
      const r = Math.hypot(x, y) / sr;
      if (r <= 1 && sy + y < horizon) set(d, sx + x, sy + y, r < .72 ? C.sun : (dith(sx + x, sy + y, .5) ? C.sun2 : C.haze));
    }

    // Vesuvio seen from Naples: Somma on the left (lower, rounded, jagged),
    // the notch of the Valle del Gigante, then the Gran Cono (higher, truncated
    // crater top) with a long gentle flank down to the sea on the right.
    const P = [[0, 0], [.08, .1], [.17, .28], [.25, .5], [.31, .68], [.355, .79], [.39, .83], [.42, .82],
               [.45, .78], [.48, .7], [.51, .72], [.545, .86], [.57, .97], [.585, 1], [.62, 1], [.635, .985],
               [.665, .9], [.71, .72], [.77, .5], [.84, .3], [.92, .14], [1, .04]];
    const vx = W < 140 ? W * .58 : W * .62, vw = Math.max(W * .62, 110), vh = Math.min(H * .2, vw * .2);
    const prof = u => {
      if (u <= 0 || u >= 1) return 0;
      let i = 0; while (P[i + 1][0] < u) i++;
      const [u0, h0] = P[i], [u1, h1] = P[i + 1];
      return h0 + (h1 - h0) * (u - u0) / (u1 - u0);
    };
    const mount = x => {
      const u = (x - (vx - vw / 2)) / vw;
      let h = prof(u);
      if (u > .3 && u < .46) h += (rnd(Math.floor(x)) - .5) * .05;   // jagged Somma crest
      return Math.max(0, h) * vh;
    };
    // light from the left: each summit casts a diagonal shadow line down its right side
    const X = u => vx - vw / 2 + u * vw;
    const peaks = [[.4, .48], [.6, 1.01]];                 // [summit u, territory ends at u]
    for (let x = 0; x < W; x++) {
      const top = Math.round(horizon - mount(x));
      if (top >= horizon) continue;
      const u = (x - (vx - vw / 2)) / vw;
      const [pu] = peaks.find(p => u < p[1]) || peaks[1];
      const px = X(pu), ptop = horizon - mount(px);
      for (let y = top; y < horizon; y++) {
        const above = (horizon - y) / Math.max(1, vh);
        const edge = px + (y - ptop) * .55;                  // shadow boundary, slanting right
        let c = x < edge - 2 ? C.farLit : x > edge + 2 ? C.far2 : (dith(x, y, (x - edge + 2) / 4) ? C.far2 : C.far);
        if (x < edge - 2 && x > edge - 9 && dith(x, y, .35)) c = C.far;          // soft half-tone
        if (above < .3) c = dith(x, y, (.3 - above) / .3) ? (x > edge ? C.green2 : C.green) : c;
        if (y === top) c = x > edge ? C.ridge : C.far;
        set(d, x, y, c);
      }
    }

    // far coast with the city strip on the left of the mountain
    const coastEnd = Math.round(vx - vw * .44);
    for (let x = 0; x < coastEnd; x++) {
      const hh = 1 + Math.round(rnd(Math.floor(x / 2)) * 2);
      for (let y = horizon - hh; y < horizon; y++) set(d, x, y, C.coast);
      if (rnd(x * 7.3) > .7) set(d, x, horizon - hh - 1, C.coast);
    }

    // sea
    for (let y = horizon; y < H; y++) {
      const t = (y - horizon) / (H - horizon);
      for (let x = 0; x < W; x++) {
        let c = t < .35 ? (dith(x, y, t / .35) ? C.sea2 : C.sea) : (dith(x, y, (t - .35) / .65) ? C.sea3 : C.sea2);
        set(d, x, y, c);
      }
    }

    // Castel dell'Ovo on its rock, right side of the gulf
    const cx0 = Math.round(W < 140 ? W * .08 : W * .3), cy = horizon + Math.round((H - horizon) * .28), cw = Math.max(22, Math.round(W * .07));
    for (let x = -2; x < cw + 2; x++) for (let y = 0; y < 3; y++) set(d, cx0 + x, cy + y, C.coast);          // rock
    for (let x = 0; x < cw; x++) for (let y = 1; y < 7; y++) set(d, cx0 + x, cy - y, (x < cw * .45) ? C.castleLit : C.castle); // walls
    for (let x = 0; x < cw; x += 3) set(d, cx0 + x, cy - 7, C.castle);                                       // battlements
    const tw = Math.round(cw * .62);
    for (let x = tw; x < tw + 6; x++) for (let y = 7; y < 12; y++) set(d, cx0 + x, cy - y, C.castle);        // tower
    for (let x = tw; x < tw + 6; x += 2) set(d, cx0 + x, cy - 12, C.castle);
    for (let x = 3; x < cw - 2; x += 5) set(d, cx0 + x, cy - 4, C.win);

    // foreground: lungomare balustrade along the bottom
    const ry = H - Math.max(7, Math.round(H * .045));
    for (let x = 0; x < W; x++) {
      set(d, x, ry, C.railDark); set(d, x, ry + 1, C.rail);
      for (let y = ry + 2; y < H; y++) set(d, x, y, (x % 6 === 0 || x % 6 === 1) ? C.rail : (y > H - 3 ? C.railDark : (dith(x, y, .5) ? C.sea3 : C.sea2)));
    }
    for (let x = 0; x < W; x++) set(d, x, H - 2, C.railDark), set(d, x, H - 1, C.railDark);

    // Posillipo umbrella pine, leaning in from the left edge (not on phones: it sits under the text)
    const small = W < 140;
    if (!small) {
    const canW = Math.max(40, Math.round(W * (small ? .5 : .2))), canH = Math.max(10, Math.round(canW * .2));
    const px0 = small ? -Math.round(canW * .25) : Math.round(W * .015);
    const ptop = horizon - Math.round((H - horizon) * .2) - canH * 2;
    const trunkBase = px0 + Math.round(canW * .32), trunkTop = px0 + Math.round(canW * .55);
    for (let y = ptop + canH; y < ry; y++) {                                  // leaning, slightly curved trunk
      const k = (y - (ptop + canH)) / (ry - ptop - canH);
      const tx = Math.round(trunkTop + (trunkBase - trunkTop) * k + Math.sin(k * Math.PI) * canW * .06);
      const tw = 2 + (k > .7 ? 1 : 0);
      for (let w = 0; w < tw + 1; w++) set(d, tx + w, y, w === 0 ? C.pine : C.trunk);
    }
    // a couple of branches into the canopy
    for (let b = 0; b < 2; b++) for (let i = 0; i < canH * 1.2; i++) {
      const bx = trunkTop + (b ? 1 : -1) * Math.round(i * 1.4), by = ptop + canH - Math.round(i * .45);
      set(d, bx, by + canH * .25 | 0, C.trunk);
    }
    // canopy from overlapping flat clusters
    const clusters = [[.5, 0, 1], [.2, .25, .55], [.8, .2, .6], [.38, -.15, .5], [.66, -.1, .55]];
    clusters.forEach(([cu, cv, cs], ci) => {
      const ccx = px0 + canW * cu, ccy = ptop + canH * (.55 + cv), rx = canW * .5 * cs, ryy = canH * .55 * cs + 2;
      for (let y = Math.floor(ccy - ryy); y <= ccy + ryy; y++) for (let x = Math.floor(ccx - rx); x <= ccx + rx; x++) {
        const e = ((x - ccx) / rx) ** 2 + ((y - ccy) / ryy) ** 2 * (y < ccy ? 1.6 : 1);
        if (e > 1 - rnd(x * 3.7 + ci) * .25) continue;
        const v = (y - (ccy - ryy)) / (2 * ryy);
        let c = v < .4 ? (dith(x, y, .55) ? C.pineLit : C.pine) : v > .78 ? C.pine2 : C.pine;
        set(d, x, y, c);
      }
    });
    }

    base = id;
  }

  // animated layer: sea glints, sun path, Vesuvio smoke puff, a boat
  let frame = 0, raf = 0, lastT = 0;
  function tick(t) {
    raf = requestAnimationFrame(tick);
    if (t - lastT < 125) return;                  // 8 fps, it's pixel art
    lastT = t; frame++;
    draw();
  }
  function draw() {
    if (!base) return;
    ctx.putImageData(base, 0, 0);
    const seaH = H - horizon;
    // glints on the water
    ctx.fillStyle = C.foam;
    for (let i = 0; i < Math.round(W * seaH / 260); i++) {
      const y = horizon + 2 + Math.floor(rnd(i * 3.1) * (seaH - 12));
      const len = 2 + Math.floor(rnd(i * 5.7) * 4);
      const x = Math.floor((rnd(i * 9.2) * W + frame * (.4 + rnd(i) * .6)) % (W + 10)) - 5;
      if (((frame + i) % 9) < 6) ctx.fillRect(x, y, len, 1);
    }
    // golden path under the sun
    ctx.fillStyle = C.glint;
    const sx = Math.round(W * .2);
    for (let k = 0; k < 7; k++) {
      const y = horizon + 2 + k * 3;
      const w = 6 - Math.floor(k * .6) + ((frame + k) % 3);
      ctx.fillRect(sx - w + ((frame + k) % 2), y, w * 2 - 2, 1);
    }
    // smoke puff drifting off the cone (the old postcard pennacchio)
    const vx = W < 140 ? W * .58 : W * .62, vw = Math.max(W * .62, 110), vh = Math.min(H * .2, vw * .2);
    const cx = Math.round(vx - vw / 2 + vw * .6), cy = Math.round(horizon - vh - 1);
    ctx.fillStyle = C.smoke;
    for (let p = 0; p < 5; p++) {
      const age = (frame * .12 + p * 1.6) % 8;
      if (age > 6.5) continue;
      const r = age < 2 ? 1 : 2;
      const ox = cx + Math.floor(age * 2.6), oy = cy - 1 - Math.floor(age * 1.3);
      ctx.fillRect(ox - r + 1, oy - r, r * 2 - 1, r * 2 + 1);   // plus-shaped puff
      ctx.fillRect(ox - r, oy - r + 1, r * 2 + 1, r * 2 - 1);
    }
    // gozzo crossing the gulf
    const by = horizon + Math.round(seaH * .5);
    const bx = Math.round(((frame * .35) % (W + 40)) - 20);
    ctx.fillStyle = C.boat; ctx.fillRect(bx, by, 9, 2); ctx.fillRect(bx + 1, by + 2, 7, 1);
    ctx.fillStyle = C.boatRed; ctx.fillRect(bx, by + 1, 9, 1);
    ctx.fillStyle = C.boat; ctx.fillRect(bx + 4, by - 6, 1, 6); ctx.fillRect(bx + 5, by - 5, 3, 4);
    ctx.fillStyle = C.sea3; ctx.fillRect(bx + (frame % 2), by + 3, 9, 1);
  }

  addEventListener("resize", () => { resize(); draw(); });
  resize(); draw();
  if (!still) raf = requestAnimationFrame(tick);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (!still) raf = requestAnimationFrame(tick);
  });
  window.napoli = { pause() { cancelAnimationFrame(raf); }, play() { if (!still) { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); } } };
})();
