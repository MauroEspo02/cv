/* L'omino con il caschetto: entra dal lungomare, si ferma e parla in un
   riquadro di dialogo in stile gioco, poi se ne va. */
function makeOmino(host, who, lines) {
  const SPR = [
    "....hhhhhh....",
    "..hhhhhhhhhh..",
    ".hhhhhhhhhhhh.",
    ".hhhhhhhhhhhh.",
    ".hhffffffffhh.",
    ".hhfeffffefhh.",
    ".hhffffffffhh.",
    ".hhffmmmmffhh.",
    "..hffffffffh..",
    "...ffffffff...",
    "....ssssss....",
    "..ssssssssss..",
    ".assssssssssa.",
    ".assssssssssa.",
    ".assssssssssa.",
    "..ssssssssss..",
    "...pppppppp...",
    "...pppppppp..."
  ];
  const COL = { h: "#E3A93C", f: "#F0C49A", e: "#2B2118", m: "#C9775F", s: "#F2F3F7", a: "#F0C49A", p: "#1B2A4A", b: "#101827" };
  const NS = "http://www.w3.org/2000/svg";

  function sprite(unit, fromRow, toRow, withLegs) {
    const svg = document.createElementNS(NS, "svg");
    const rows = toRow - fromRow;
    svg.setAttribute("viewBox", `0 ${fromRow * unit} ${14 * unit} ${rows * unit}`);
    svg.setAttribute("aria-hidden", "true");
    const rect = (x, y, w, h, c, into) => {
      const r = document.createElementNS(NS, "rect");
      r.setAttribute("x", x * unit); r.setAttribute("y", y * unit);
      r.setAttribute("width", w * unit); r.setAttribute("height", h * unit);
      r.setAttribute("fill", c); into.appendChild(r);
    };
    const body = document.createElementNS(NS, "g"); svg.appendChild(body);
    SPR.forEach((row, y) => {
      if (y < fromRow || y >= toRow) return;
      let x = 0;
      while (x < row.length) {
        const c = row[x];
        if (c === ".") { x++; continue; }
        let w = 1; while (row[x + w] === c) w++;
        rect(x, y, w, 1, COL[c], body);
        x += w;
      }
    });
    const legs = [];
    if (withLegs) [3, 9].forEach((lx, i) => {
      const leg = document.createElementNS(NS, "g");
      leg.setAttribute("class", "leg leg" + i);
      leg.style.transformOrigin = `${(lx + 1) * unit}px ${18 * unit}px`;
      rect(lx, 18, 2, 3, COL.p, leg);
      rect(lx - 1, 21, 3, 1, COL.b, leg);
      svg.appendChild(leg); legs.push(leg);
    });
    return svg;
  }

  const wrap = document.createElement("div");
  wrap.className = "omino";
  const guy = sprite(4, 0, 18, true);
  guy.setAttribute("class", "guy");
  guy.setAttribute("width", 14 * 4); guy.setAttribute("height", 22 * 4);
  guy.setAttribute("viewBox", `0 0 ${14 * 4} ${22 * 4}`);
  wrap.appendChild(guy);


  host.appendChild(wrap);

  // the dialogue box, in the manner of a handheld game
  const dlg = document.createElement("div");
  dlg.className = "dlg"; dlg.hidden = true;
  dlg.innerHTML = `
    <div class="dlg-box">
      <span class="dlg-name"></span>
      <p class="dlg-text"><span class="dlg-said"></span><i class="dlg-next" aria-hidden="true"></i></p>
    </div>
    <div class="dlg-face">
      <img class="face-px" src="/img/caschetto-faccia.png" alt="" width="296" height="300">
    </div>`;
  dlg.querySelector(".dlg-name").textContent = who;
  document.body.appendChild(dlg);
  const said = dlg.querySelector(".dlg-said");

  function setStyle(mode) {
    wrap.dataset.mode = mode; dlg.dataset.mode = mode;
    const r = mode === "smooth" ? 3.6 : 0;
    wrap.querySelectorAll("rect").forEach(el => el.setAttribute("rx", r));
    dlg.querySelectorAll("rect").forEach(el => el.setAttribute("rx", mode === "smooth" ? 9 : 0));
  }

  let timers = [], typing = 0;
  const clear = () => { timers.forEach(clearTimeout); timers = []; clearInterval(typing); };
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));

  let lang = "it", step = 0;
  const script = () => lines[lang];

  function type(text) {
    said.textContent = ""; dlg.classList.remove("ready");
    let i = 0;
    clearInterval(typing);
    typing = setInterval(() => {
      said.textContent = text.slice(0, ++i);
      if (i >= text.length) { clearInterval(typing); dlg.classList.add("ready"); }
    }, 38);
  }

  function show(i) {
    step = i;
    dlg.hidden = false;
    type(script()[i]);
  }

  function advance() {
    if (dlg.hidden) return;
    if (said.textContent !== script()[step]) {            // il testo si completa subito
      clearInterval(typing); said.textContent = script()[step]; dlg.classList.add("ready"); return;
    }
    if (step + 1 < script().length) show(step + 1); else dlg.hidden = true;
  }

  function play() {
    clear();
    wrap.classList.remove("walking");
    dlg.hidden = true; dlg.classList.remove("ready");
    wrap.style.transition = "none";
    wrap.style.transform = "translateX(-140px)";
    void wrap.offsetWidth;
    const stop = Math.round(Math.min(innerWidth * .17, 265));
    at(60, () => {
      wrap.style.transition = "transform 3.4s linear";
      wrap.classList.add("walking");
      wrap.style.transform = `translateX(${stop}px)`;
    });
    at(3500, () => { wrap.classList.remove("walking"); show(0); });
    at(7200, () => { if (!dlg.hidden && step === 0) show(1); });
    at(11600, () => {
      dlg.hidden = true;
      wrap.classList.add("walking");
      wrap.style.transition = "transform 4.2s linear";
      wrap.style.transform = `translateX(${innerWidth + 160}px)`;
    });
    at(16000, () => { wrap.classList.remove("walking"); wrap.style.transition = "none"; wrap.style.transform = "translateX(-140px)"; });
  }
  dlg.addEventListener("click", advance);

  function setLang(l) {
    lang = l;
    if (!dlg.hidden) { said.textContent = script()[step]; dlg.classList.add("ready"); }
  }

  return { play, setStyle, setLang, el: wrap, stop: clear };
}

/* Entra una volta per visita, poco dopo il caricamento. */
(() => {
  const host = document.createElement("div");
  host.className = "stagewalk";
  document.body.appendChild(host);
  const omino = makeOmino(host, "Caschetto", {
    it: ["Dai, assumetelo!", "Prova il sito anche in versione pixel!"],
    en: ["Go on, hire him!", "Try the site in the pixel version too!"]
  });
  window.ominoScene = omino;
  const go = () => setTimeout(() => omino.play(), 2200);
  if (document.readyState === "complete") go();
  else addEventListener("load", go);
})();
