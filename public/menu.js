/* Menu d'ingresso: "Cosa cerchi?".
   Sta sopra la pagina gia' carica (non al posto suo, cosi' Google indicizza
   normalmente) e si chiude con Esc o toccando fuori dal riquadro. */
(() => {
  const gate = document.getElementById("gate");
  if (!gate) return;

  const T = {
    it: {
      hi: "Ciao!", iam: "Sono Mauro",
      bollo: "Qui metterò un disegno di nonna",
      lab: "Cosa cerchi?",
      opts: {
        cv:        ["Vedi il curriculum", "Stai assumendo? Esperienza, formazione e competenze in due minuti."],
        materiali: ["Scarica il materiale universitario", "Per colleghi e docenti: tesi, ricerche, mappe ed elaborati."],
        clean:     ["Curiosa tra i progetti", "Arrivi da LinkedIn o da una mail? Il sito normale: progetti, grafica, lavori."],
        pixel:     ["Esplora Carditopoli", "La versione pokémon del portfolio, con vari giochi. Creata con Claude."]
      }
    },
    en: {
      hi: "Hi!", iam: "I'm Mauro",
      bollo: "A drawing by my grandma goes here",
      lab: "What are you after?",
      opts: {
        cv:        ["See the CV", "Hiring? Experience, education and skills in two minutes."],
        materiali: ["Get the university material", "For colleagues and teachers: thesis, research, maps and coursework."],
        clean:     ["Browse the projects", "Here from LinkedIn or an email? The normal site: projects, graphics, work."],
        pixel:     ["Explore Carditopoli", "The pokémon version of the portfolio, with games inside. Built with Claude."]
      }
    }
  };

  /* parte in inglese; se chi arriva ha gia' scelto una lingua, si rispetta */
  let lang = "en";
  try { const s = localStorage.getItem("me-lang"); if (s === "it" || s === "en") lang = s; } catch (e) {}

  const card = gate.querySelector(".gate-card");
  const bollo = document.getElementById("gateBollo");

  function paint() {
    const t = T[lang];
    gate.querySelectorAll("[data-gate]").forEach(n => { n.textContent = t[n.dataset.gate] || ""; });
    gate.querySelectorAll("[data-gate-go]").forEach(b => {
      const [title, note] = t.opts[b.dataset.gateGo];
      b.querySelector("b").textContent = title;
      b.querySelector("small").textContent = note;
    });
    gate.querySelectorAll("[data-gate-lang]").forEach(b =>
      b.setAttribute("aria-pressed", String(b.dataset.gateLang === lang)));
    const cb = document.getElementById("gateClose");
    if (cb) cb.setAttribute("aria-label", lang === "it" ? "Chiudi" : "Close");
    const tb = document.getElementById("gateTheme");
    if (tb) {
      const dark = document.documentElement.dataset.theme === "dark";
      tb.setAttribute("aria-pressed", String(dark));
      tb.setAttribute("aria-label", lang === "it"
        ? (dark ? "Modalità chiara" : "Modalità scura")
        : (dark ? "Light mode" : "Dark mode"));
    }
    /* se il disegno di nonna c'e', il promemoria sparisce */
    if (bollo && bollo.complete && bollo.naturalWidth) {
      bollo.hidden = false;
      const txt = bollo.parentElement.querySelector("[data-gate='bollo']");
      if (txt) txt.hidden = true;
    }
  }

  /* Safari su iPhone non ridisegna gli strati fissi quando cambia il tema:
     si nasconde e si rimostra il menu per obbligarlo a rifare il disegno. */
  function repaint() {
    const d = gate.style.display;
    gate.style.display = "none";
    void gate.offsetHeight;
    gate.style.display = d;
  }

  function open() {
    gate.hidden = false;
    document.documentElement.classList.add("gate-on");
    /* il fuoco va sul riquadro, non sulla prima voce: altrimenti sembra gia' scelta */
    card.focus({ preventScroll: true });
  }

  function close() {
    gate.hidden = true;
    document.documentElement.classList.remove("gate-on");
  }

  function go(where) {
    if (where === "cv") { location.href = "/cv/"; return; }
    if (where === "materiali") { location.href = "/materiali/"; return; }
    if (window.siteGate) siteGate.setScene(where === "pixel" ? "pixel" : "clean", true);
    close();
  }

  gate.querySelectorAll("[data-gate-go]").forEach(b =>
    b.addEventListener("click", () => go(b.dataset.gateGo)));

  gate.querySelectorAll("[data-gate-lang]").forEach(b => b.addEventListener("click", () => {
    lang = b.dataset.gateLang;
    try { localStorage.setItem("me-lang", lang); } catch (e) {}
    if (window.siteGate) siteGate.setLang(lang);   /* cambia anche il sito sotto */
    paint();
  }));

  /* vie d'uscita: la crocetta in alto a destra oppure Esc */
  const closeBtn = document.getElementById("gateClose");
  if (closeBtn) closeBtn.addEventListener("click", close);

  /* chiaro e scuro anche da qui: col menu aperto il tasto del sito sta sotto */
  const themeBtn = document.getElementById("gateTheme");
  if (themeBtn) themeBtn.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    if (window.siteGate && siteGate.setTheme) siteGate.setTheme(next, true);
    else {
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("me-theme", next); } catch (e) {}
    }
    paint();
    repaint();
  });
  addEventListener("keydown", (e) => { if (!gate.hidden && e.key === "Escape") close(); });

  /* il fuoco resta dentro il riquadro finche' il menu e' aperto */
  addEventListener("keydown", (e) => {
    if (gate.hidden || e.key !== "Tab") return;
    const f = [...gate.querySelectorAll("button")].filter(n => n.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* la luce segue il mouse */
  if (!matchMedia("(hover: none)").matches) {
    card.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--gmx", ((e.clientX - r.left) / r.width * 100) + "%");
      card.style.setProperty("--gmy", ((e.clientY - r.top) / r.height * 100) + "%");
    });
  }

  if (bollo) bollo.addEventListener("load", paint);
  paint();
  open();
})();
