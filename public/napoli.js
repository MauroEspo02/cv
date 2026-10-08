/* Napoli pixelata: a generative pixel-art view of the gulf (sky, Vesuvio,
   sea, Castel dell'Ovo, Posillipo pine, lungomare, the boat "ENZO") drawn on a
   fixed canvas behind the page. Two moods: day (blue/green) and night (moon,
   stars, the lights of the city and of the towns on the Vesuvio).
   The theme follows <html data-theme="dark|light">; call napoli.refresh()
   after changing it (window.napoliScene.refresh). Usage: <canvas id="napoli"></canvas><script src="/napoli.js" defer></script> */
(() => {
  const cv = document.getElementById("napoli");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const DAY = {
    night: false,
    sky: ["#FFFFFF", "#FFFFFF", "#EEF7FC", "#DCEFF8", "#C8E6F4", "#D7EEEA"],
    orb: "#FFFBE8", orb2: "#FFF1B8", orbHalo: "#D7EEEA", orbSpot: "#FFF1B8",
    far: "#9DC3C6", far2: "#86B0B9", farLit: "#B8D7D2", ridge: "#76A1AC", green: "#8EBFA2", green2: "#79AE93",
    sea: "#8FCDE6", sea2: "#62B0D8", sea3: "#3E92C6", foam: "#E8F7FC", glint: "#FFF4C2",
    coast: "#7FA9B3", win: "#4E86A0", light: null,
    castle: "#9CBFC7", castleLit: "#C2DCE2",
    pine: "#3F8F60", pine2: "#2D6F4D", pineLit: "#6FB57D", trunk: "#2F5D50",
    smoke: "#F6FBFC", boat: "#FFFFFF", boatRed: "#E8504A", sail: "#FFFFFF", sailInk: "#1D5C3A", lantern: null,
    rail: "#E6F3F7", railDark: "#B5D6E2", post: "#6F98A6", lamp: "#E6F3F7"
  };
  const NIGHT = {
    night: true,
    sky: ["#050B1C", "#060E22", "#0A1630", "#0F1F40", "#15294F", "#1D355E"],
    orb: "#F6F2DA", orb2: "#E4DFC2", orbHalo: "#1F3558", orbSpot: "#D8D2B2",
    far: "#132438", far2: "#0E1C2E", farLit: "#1B3049", ridge: "#26446A", green: "#122733", green2: "#0E202B",
    sea: "#0F2649", sea2: "#0B1E3C", sea3: "#07152C", foam: "#2E5585", glint: "#F6F2DA",
    coast: "#0D1A2B", win: "#FFD27A", light: ["#FFD27A", "#FFE9B0", "#FFC15A"],
    castle: "#7A6A48", castleLit: "#B39A63",
    pine: "#10261F", pine2: "#0B1C17", pineLit: "#1A3A2D", trunk: "#0B1C17",
    smoke: "#24395A", boat: "#C9D6E6", boatRed: "#B8443F", sail: "#DCE5F0", sailInk: "#14263B", lantern: "#FFD27A",
    rail: "#1F3048", railDark: "#142234", post: "#0A1422", lamp: "#FFE3A0"
  };
  let C = DAY;

  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const dith = (x, y, t) => (BAYER[(y & 3) * 4 + (x & 3)] + .5) / 16 < t;
  const rnd = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  // 4x5 pixel letters for the sail
  const FONT = {
    E: ["1111", "1000", "1110", "1000", "1111"],
    N: ["1001", "1101", "1011", "1001", "1001"],
    Z: ["1111", "0001", "0110", "1000", "1111"],
    O: ["0110", "1001", "1001", "1001", "0110"]
  };

  let W = 0, H = 0, PX = 6, horizon = 0, base = null;
  let G = null;                 // scene geometry shared by static + animated layers
  let lights = [], stars = [];

  function resize() {
    PX = innerWidth < 600 ? 4 : innerWidth < 1400 ? 6 : 7;
    W = Math.max(1, Math.ceil(innerWidth / PX)); H = Math.max(1, Math.ceil(innerHeight / PX));
    cv.width = W; cv.height = H;
    cv.style.width = W * PX + "px"; cv.style.height = H * PX + "px";
    paintStatic();
  }

  const set = (d, x, y, hex) => {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    d[i] = parseInt(hex.slice(1, 3), 16); d[i + 1] = parseInt(hex.slice(3, 5), 16); d[i + 2] = parseInt(hex.slice(5, 7), 16); d[i + 3] = 255;
  };

  // Vesuvio seen from Naples: Somma on the left (lower, rounded, jagged), the
  // notch of the Valle del Gigante, the Gran Cono (higher, truncated crater top)
  // with a long gentle flank down to the sea on the right.
  const PROFILE = [[0, 0], [.08, .1], [.17, .28], [.25, .5], [.31, .68], [.355, .79], [.39, .83], [.42, .82],
                   [.45, .78], [.48, .7], [.51, .72], [.545, .86], [.57, .97], [.585, 1], [.62, 1], [.635, .985],
                   [.665, .9], [.71, .72], [.77, .5], [.84, .3], [.92, .14], [1, .04]];
  const prof = u => {
    if (u <= 0 || u >= 1) return 0;
    let i = 0; while (PROFILE[i + 1][0] < u) i++;
    const [u0, h0] = PROFILE[i], [u1, h1] = PROFILE[i + 1];
    return h0 + (h1 - h0) * (u - u0) / (u1 - u0);
  };

  function paintStatic() {
    const id = ctx.createImageData(W, H), d = id.data;
    const small = W < 140;
    horizon = Math.round(H * (small ? .74 : .72));
    const vx = small ? W * .58 : W * .62, vw = Math.max(W * .62, 110), vh = Math.min(H * .2, vw * .2);
    const ry = H - Math.max(7, Math.round(H * .045));
    G = { small, vx, vw, vh, ry,
          orbX: Math.round(W * (C.night ? (small ? .62 : .86) : .2)),
          orbY: C.night ? Math.round(small ? H * .09 : horizon * .42) : horizon - Math.round(H * .055),
          orbR: Math.max(5, Math.round(Math.min(W, H) * (C.night ? .04 : .045))) };
    const mount = x => {
      const u = (x - (vx - vw / 2)) / vw;
      let h = prof(u);
      if (u > .3 && u < .46) h += (rnd(Math.floor(x)) - .5) * .05;
      return Math.max(0, h) * vh;
    };
    lights = []; stars = [];

    // sky
    const S = C.sky, stops = [[0, S[0]], [.38, S[1]], [.55, S[2]], [.72, S[3]], [.88, S[4]], [1, S[5]]];
    for (let y = 0; y < horizon; y++) {
      const t = y / horizon;
      let k = 0; while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
      const [t0, c0] = stops[k], [t1, c1] = stops[k + 1];
      const f = (t - t0) / (t1 - t0);
      for (let x = 0; x < W; x++) set(d, x, y, dith(x, y, f) ? c1 : c0);
    }
    if (C.night) {
      const n = Math.round(W * horizon / 380);
      for (let i = 0; i < n; i++) {
        const x = Math.floor(rnd(i * 1.7) * W), y = Math.floor(rnd(i * 2.9 + 5) * horizon * .8);
        stars.push([x, y, rnd(i * 4.1) > .92]);
      }
    }

    // sun by day, full moon by night
    const { orbX: sx, orbY: sy, orbR: sr } = G;
    for (let y = -sr - 2; y <= sr + 2; y++) for (let x = -sr - 2; x <= sr + 2; x++) {
      const r = Math.hypot(x, y) / sr;
      if (sy + y >= horizon) continue;
      if (r <= 1) {
        let c = r < .72 ? C.orb : (dith(sx + x, sy + y, .5) ? C.orb2 : C.orbHalo);
        if (C.night && r < .9) {                     // lunar maria
          if (Math.hypot(x + sr * .3, y + sr * .2) < sr * .28 || Math.hypot(x - sr * .25, y - sr * .3) < sr * .22 || Math.hypot(x - sr * .1, y + sr * .45) < sr * .15) c = C.orbSpot;
        }
        set(d, sx + x, sy + y, c);
      } else if (C.night && r < 1.35 && dith(sx + x, sy + y, .35)) set(d, sx + x, sy + y, C.orbHalo);
    }

    // Vesuvio, light from the left: each summit casts a diagonal shadow down its right side
    const X = u => vx - vw / 2 + u * vw;
    const peaks = [[.4, .48], [.6, 1.01]];
    for (let x = 0; x < W; x++) {
      const top = Math.round(horizon - mount(x));
      if (top >= horizon) continue;
      const u = (x - (vx - vw / 2)) / vw;
      const [pu] = peaks.find(p => u < p[1]) || peaks[1];
      const px = X(pu), ptop = horizon - mount(px);
      for (let y = top; y < horizon; y++) {
        const above = (horizon - y) / Math.max(1, vh);
        const edge = px + (y - ptop) * .55;
        let c = x < edge - 2 ? C.farLit : x > edge + 2 ? C.far2 : (dith(x, y, (x - edge + 2) / 4) ? C.far2 : C.far);
        if (x < edge - 2 && x > edge - 9 && dith(x, y, .35)) c = C.far;
        const seam = X(.48);                                   // soften the Somma / Gran Cono join
        if (x >= seam && x < seam + 6 && c === C.farLit) c = dith(x, y, 1 - (x - seam) / 6) ? C.far2 : C.far;
        if (above < .3) c = dith(x, y, (.3 - above) / .3) ? (x > edge ? C.green2 : C.green) : c;
        if (y === top) c = x > edge ? C.ridge : C.far;
        set(d, x, y, c);
        // towns on the lower slopes (Ercolano, Torre del Greco...) light up at night
        if (C.night && above < .32 && rnd(x * 13.1 + y * 7.7) > (above < .12 ? .82 : .93)) lights.push([x, y]);
      }
    }

    // far coast with the city strip on the left of the mountain
    const coastEnd = Math.round(vx - vw * .44);
    for (let x = 0; x < coastEnd; x++) {
      const hh = 1 + Math.round(rnd(Math.floor(x / 2)) * 2);
      for (let y = horizon - hh; y < horizon; y++) {
        set(d, x, y, C.coast);
        if (C.night && rnd(x * 5.3 + y * 3.1) > .55) lights.push([x, y]);
      }
      if (rnd(x * 7.3) > .7) set(d, x, horizon - hh - 1, C.coast);
    }

    // sea
    for (let y = horizon; y < H; y++) {
      const t = (y - horizon) / (H - horizon);
      for (let x = 0; x < W; x++)
        set(d, x, y, t < .35 ? (dith(x, y, t / .35) ? C.sea2 : C.sea) : (dith(x, y, (t - .35) / .65) ? C.sea3 : C.sea2));
    }

    // Castel dell'Ovo on its rock (floodlit at night)
    const cx0 = Math.round(small ? W * .08 : W * .3), cy = horizon + Math.round((H - horizon) * .28), cw = Math.max(22, Math.round(W * .07));
    for (let x = -2; x < cw + 2; x++) for (let y = 0; y < 3; y++) set(d, cx0 + x, cy + y, C.coast);
    for (let x = 0; x < cw; x++) for (let y = 1; y < 7; y++) set(d, cx0 + x, cy - y, (x < cw * .45) ? C.castleLit : C.castle);
    for (let x = 0; x < cw; x += 3) set(d, cx0 + x, cy - 7, C.castle);
    const tw = Math.round(cw * .62);
    for (let x = tw; x < tw + 6; x++) for (let y = 7; y < 12; y++) set(d, cx0 + x, cy - y, C.castle);
    for (let x = tw; x < tw + 6; x += 2) set(d, cx0 + x, cy - 12, C.castle);
    for (let x = 3; x < cw - 2; x += 5) set(d, cx0 + x, cy - 4, C.win);
    if (C.night) for (let x = -2; x < cw + 2; x++) if (dith(cx0 + x, cy + 4, .5)) set(d, cx0 + x, cy + 4, C.castleLit); // reflection

    // lungomare balustrade with street lamps
    for (let x = 0; x < W; x++) {
      set(d, x, ry, C.railDark); set(d, x, ry + 1, C.rail);
      for (let y = ry + 2; y < H; y++) set(d, x, y, (x % 6 === 0 || x % 6 === 1) ? C.rail : (y > H - 3 ? C.railDark : (dith(x, y, .5) ? C.sea3 : C.sea2)));
    }
    for (let x = 0; x < W; x++) set(d, x, H - 2, C.railDark), set(d, x, H - 1, C.railDark);
    const gap = small ? 34 : 44;
    G.lamps = [];
    for (let x = Math.round(gap * .6); x < W; x += gap) {
      for (let y = ry - 9; y < ry; y++) set(d, x, y, C.post);
      set(d, x - 1, ry - 10, C.post); set(d, x + 1, ry - 10, C.post);
      set(d, x - 1, ry - 9, C.lamp); set(d, x + 1, ry - 9, C.lamp);
      G.lamps.push(x);
    }

    // Posillipo umbrella pine, leaning in from the left edge (not on phones: it sits under the text)
    if (!small) {
      const canW = Math.max(40, Math.round(W * .2)), canH = Math.max(10, Math.round(canW * .2));
      const px0 = Math.round(W * .015);
      const ptop = horizon - Math.round((H - horizon) * .2) - canH * 2;
      const trunkBase = px0 + Math.round(canW * .32), trunkTop = px0 + Math.round(canW * .55);
      for (let y = ptop + canH; y < ry; y++) {
        const k = (y - (ptop + canH)) / (ry - ptop - canH);
        const tx = Math.round(trunkTop + (trunkBase - trunkTop) * k + Math.sin(k * Math.PI) * canW * .06);
        const twk = 2 + (k > .7 ? 1 : 0);
        for (let w = 0; w < twk + 1; w++) set(d, tx + w, y, w === 0 ? C.pine : C.trunk);
      }
      for (let b = 0; b < 2; b++) for (let i = 0; i < canH * 1.2; i++) {
        const bx = trunkTop + (b ? 1 : -1) * Math.round(i * 1.4), by = ptop + canH - Math.round(i * .45);
        set(d, bx, by + canH * .25, C.trunk);
      }
      const clusters = [[.5, 0, 1], [.2, .25, .55], [.8, .2, .6], [.38, -.15, .5], [.66, -.1, .55]];
      clusters.forEach(([cu, cvv, cs], ci) => {
        const ccx = px0 + canW * cu, ccy = ptop + canH * (.55 + cvv), rx = canW * .5 * cs, ryy = canH * .55 * cs + 2;
        for (let y = Math.floor(ccy - ryy); y <= ccy + ryy; y++) for (let x = Math.floor(ccx - rx); x <= ccx + rx; x++) {
          const e = ((x - ccx) / rx) ** 2 + ((y - ccy) / ryy) ** 2 * (y < ccy ? 1.6 : 1);
          if (e > 1 - rnd(x * 3.7 + ci) * .25) continue;
          const v = (y - (ccy - ryy)) / (2 * ryy);
          set(d, x, y, v < .4 ? (dith(x, y, .55) ? C.pineLit : C.pine) : v > .78 ? C.pine2 : C.pine);
        }
      });
    }

    base = id;
  }

  // animated layer
  let frame = 0, raf = 0, lastT = 0;
  function tick(t) {
    raf = requestAnimationFrame(tick);
    if (t - lastT < 125) return;                   // 8 fps, it's pixel art
    lastT = t; frame++;
    draw();
  }
  const px = (x, y, w = 1, h = 1) => ctx.fillRect(x, y, w, h);

  function draw() {
    if (!base) return;
    ctx.putImageData(base, 0, 0);
    const seaH = H - horizon;

    if (C.night) {
      // twinkling stars
      stars.forEach(([x, y, big], i) => {
        const on = rnd(i + Math.floor(frame / 3) * 17.3) > .12;
        if (!on) return;
        ctx.fillStyle = rnd(i * 9.1) > .7 ? "#FFFFFF" : "#8FA9D9";
        px(x, y);
        if (big && (frame + i) % 12 < 6) { ctx.fillStyle = "#8FA9D9"; px(x - 1, y); px(x + 1, y); px(x, y - 1); px(x, y + 1); }
      });
      // city and Vesuvio lights, a few flicker
      lights.forEach(([x, y], i) => {
        if (rnd(i * 3.3 + Math.floor(frame / 4) * 1.9) < .06) return;
        ctx.fillStyle = C.light[i % 3]; px(x, y);
      });
      // lamp glow on the lungomare
      ctx.fillStyle = "rgba(255,210,122,.18)";
      G.lamps.forEach(x => { px(x - 3, G.ry - 12, 7, 6); px(x - 2, G.ry - 13, 5, 8); });
    }

    // glints on the water
    ctx.fillStyle = C.foam;
    for (let i = 0; i < Math.round(W * seaH / 260); i++) {
      const y = horizon + 2 + Math.floor(rnd(i * 3.1) * (seaH - 12));
      const len = 2 + Math.floor(rnd(i * 5.7) * 4);
      const x = Math.floor((rnd(i * 9.2) * W + frame * (.4 + rnd(i) * .6)) % (W + 10)) - 5;
      if (((frame + i) % 9) < 6) px(x, y, len, 1);
    }
    // light path under the sun / moon
    ctx.fillStyle = C.glint;
    const sx = G.orbX, rows = C.night ? 11 : 7;
    for (let k = 0; k < rows; k++) {
      const y = horizon + 2 + k * 3;
      const w = (C.night ? 4 : 6) - Math.floor(k * .4) + ((frame + k) % 3);
      if (w > 1) px(sx - w + ((frame + k) % 2), y, w * 2 - 2, 1);
    }
    // smoke puffs off the crater
    const cx = Math.round(G.vx - G.vw / 2 + G.vw * .6), cy = Math.round(horizon - G.vh - 1);
    ctx.fillStyle = C.smoke;
    for (let p = 0; p < 5; p++) {
      const age = (frame * .12 + p * 1.6) % 8;
      if (age > 6.5) continue;
      const r = age < 2 ? 1 : 2;
      const ox = cx + Math.floor(age * 2.6), oy = cy - 1 - Math.floor(age * 1.3);
      px(ox - r + 1, oy - r, r * 2 - 1, r * 2 + 1);
      px(ox - r, oy - r + 1, r * 2 + 1, r * 2 - 1);
    }
    boat(seaH);
  }

  // the gozzo "ENZO" crossing the gulf
  function boat(seaH) {
    const L = 30;
    const by = horizon + Math.round(seaH * (G.small ? .5 : .55));
    const bx = Math.round(((frame * .35) % (W + L * 2)) - L);
    const bob = frame % 8 < 4 ? 0 : 1;
    const y0 = by + bob;
    // hull with raised bow and stern
    ctx.fillStyle = C.boat;
    px(bx, y0 - 1, 2, 1); px(bx + L - 2, y0 - 2, 2, 2);
    px(bx, y0, L, 2); px(bx + 2, y0 + 2, L - 4, 1); px(bx + 4, y0 + 3, L - 8, 1);
    ctx.fillStyle = C.boatRed; px(bx + 1, y0 + 1, L - 2, 1);
    // mast and sail with the name
    const sw = 23, sh = 9, sx0 = bx + Math.round((L - sw) / 2) - 1, sy0 = y0 - sh - 2;
    ctx.fillStyle = C.post; px(sx0 + sw, sy0 - 2, 1, sh + 3);
    ctx.fillStyle = C.sail; px(sx0, sy0, sw, sh); px(sx0 + 1, sy0 - 1, sw - 1, 1);
    ctx.fillStyle = C.sailInk;
    "ENZO".split("").forEach((ch, i) => FONT[ch].forEach((row, ry) => [...row].forEach((b, rx) => { if (b === "1") px(sx0 + 2 + i * 5 + rx, sy0 + 2 + ry); })));
    if (C.lantern) { ctx.fillStyle = C.lantern; px(bx + L - 2, y0 - 4, 1, 1); ctx.fillStyle = "rgba(255,210,122,.25)"; px(bx + L - 4, y0 - 6, 5, 5); }
    // wake
    ctx.fillStyle = C.foam; px(bx - 3 - (frame % 2), y0 + 3, 3, 1); px(bx - 7 - (frame % 3), y0 + 2, 2, 1);
  }

  function applyTheme() { C = document.documentElement.dataset.theme === "dark" ? NIGHT : DAY; }
  addEventListener("resize", () => { resize(); draw(); });
  applyTheme(); resize(); draw();
  if (!still) raf = requestAnimationFrame(tick);
  document.addEventListener("visibilitychange", () => {
    cancelAnimationFrame(raf);
    if (!document.hidden && !still) raf = requestAnimationFrame(tick);
  });
  window.napoliScene = { refresh() { applyTheme(); paintStatic(); draw(); } };
})();
