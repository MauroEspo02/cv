const ICONS = ["mail", "card", "phone", "image", "vector", "layout", "shapes", "video", "keys", "chat", "map", "sheet"];
const OBJECTS = ["jar", "stage", "passport", "generic", "ceramics", "tshirt", "music", "guitar", "sport", "map"];

const qs = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function getPath(obj, path) {
  return path.split(".").reduce((cur, key) => (cur == null ? undefined : cur[key]), obj);
}
function setPath(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
  cur[parts[parts.length - 1]] = value;
}

/* ---- field builders ---- */
function textField(label, path, value, area) {
  const tag = area ? "textarea" : "input";
  const attrs = area ? "" : ' type="text"';
  const valueAttr = area ? "" : ` value="${esc(value)}"`;
  const inner = area ? esc(value) : "";
  return `<div class="field"><label>${esc(label)}</label><${tag}${attrs} data-path="${path}"${valueAttr}>${inner}</${tag}></div>`;
}
function selectField(label, path, value, options) {
  const opts = options.map((o) => `<option value="${esc(o)}"${o === value ? " selected" : ""}>${esc(o)}</option>`).join("");
  return `<div class="field"><label>${esc(label)}</label><select data-path="${path}">${opts}</select></div>`;
}
function bilingualField(label, basePath, valueObj, area) {
  const mk = (lang) => {
    const v = valueObj && valueObj[lang];
    const tag = area ? "textarea" : "input";
    const attrs = area ? "" : ' type="text"';
    const valueAttr = area ? "" : ` value="${esc(v)}"`;
    const inner = area ? esc(v) : "";
    return `<div><span class="lang-tag">${lang.toUpperCase()}</span><${tag}${attrs} data-path="${basePath}.${lang}"${valueAttr}>${inner}</${tag}></div>`;
  };
  return `<div class="field"><label>${esc(label)}</label><div class="row-2">${mk("en")}${mk("it")}</div></div>`;
}

/* ---- list item chrome (add/remove/move) ---- */
function itemCard(section, arrayPath, index, label, innerHtml) {
  return `<div class="item-card">
    <div class="item-head">
      <span class="item-title">${esc(label)}</span>
      <div class="item-actions">
        <button type="button" class="icon-btn" data-action="up" data-section="${section}" data-array-path="${arrayPath}" data-index="${index}" title="Sposta su">↑</button>
        <button type="button" class="icon-btn" data-action="down" data-section="${section}" data-array-path="${arrayPath}" data-index="${index}" title="Sposta giù">↓</button>
        <button type="button" class="icon-btn danger" data-action="remove" data-section="${section}" data-array-path="${arrayPath}" data-index="${index}" title="Rimuovi">✕</button>
      </div>
    </div>
    ${innerHtml}
  </div>`;
}
function stringItemCard(section, arrayPath, index, value, area) {
  const tag = area ? "textarea" : "input";
  const attrs = area ? "" : ' type="text"';
  const valueAttr = area ? "" : ` value="${esc(value)}"`;
  const inner = area ? esc(value) : "";
  return `<div class="item-card">
    <div class="item-head">
      <span class="item-title">#${index + 1}</span>
      <div class="item-actions">
        <button type="button" class="icon-btn" data-action="up" data-section="${section}" data-array-path="${arrayPath}" data-index="${index}" title="Sposta su">↑</button>
        <button type="button" class="icon-btn" data-action="down" data-section="${section}" data-array-path="${arrayPath}" data-index="${index}" title="Sposta giù">↓</button>
        <button type="button" class="icon-btn danger" data-action="remove" data-section="${section}" data-array-path="${arrayPath}" data-index="${index}" title="Rimuovi">✕</button>
      </div>
    </div>
    <${tag}${attrs} data-path="${arrayPath}.${index}"${valueAttr}>${inner}</${tag}>
  </div>`;
}
function addButton(section, arrayPath, label) {
  return `<div class="list-actions"><button type="button" class="btn secondary" data-action="add" data-section="${section}" data-array-path="${arrayPath}">+ ${esc(label)}</button></div>`;
}
function saveFooter(section) {
  return `<div class="footer-actions"><button type="button" class="btn" data-action="save" data-section="${section}">Salva sezione</button></div>`;
}

/* ---- section renderers ---- */
function renderHero() {
  const h = content.hero;
  const headlineFields = (lang) => `
    <div class="row-2">
      ${textField("Verbo (" + lang.toUpperCase() + ")", `hero.headline.${lang}.verb`, h.headline[lang].verb)}
      ${textField("Parola 1 (" + lang.toUpperCase() + ")", `hero.headline.${lang}.word1`, h.headline[lang].word1)}
    </div>
    <div class="row-2">
      ${textField("Congiunzione (" + lang.toUpperCase() + ")", `hero.headline.${lang}.joiner`, h.headline[lang].joiner)}
      ${textField("Parola 2 (" + lang.toUpperCase() + ")", `hero.headline.${lang}.word2`, h.headline[lang].word2)}
    </div>`;

  qs('[data-body="hero"]').innerHTML = `
    ${textField("Nome", "hero.name", h.name)}
    <h3 class="sub-h">Titolo animato — EN</h3>${headlineFields("en")}
    <h3 class="sub-h">Titolo animato — IT</h3>${headlineFields("it")}
    ${bilingualField("Testo introduttivo", "hero.intro", h.intro, true)}
    <h3 class="sub-h">Percorso (tappe passate)</h3>
    ${h.route.map((stop, i) => itemCard("hero", "hero.route", i, (stop.city.it || "Tappa " + (i + 1)) + " · " + stop.when,
        bilingualField("Città", `hero.route.${i}.city`, stop.city) + textField("Anno", `hero.route.${i}.when`, stop.when)
      )).join("")}
    ${addButton("hero", "hero.route", "Aggiungi tappa")}
    <h3 class="sub-h">Tappa attuale</h3>
    ${bilingualField("Città", "hero.current.city", h.current.city)}
    ${bilingualField('Etichetta (es. "Oggi")', "hero.current.when", h.current.when)}
    <h3 class="sub-h">Prossima tappa (misteriosa)</h3>
    ${bilingualField('Etichetta (es. "In esplorazione")', "hero.next.when", h.next.when)}
  ` + saveFooter("hero");
}

function renderLinks() {
  const items = content.links;
  qs('[data-body="links"]').innerHTML = items.map((item, i) => itemCard("links", "links", i, item.name || "Link " + (i + 1),
    selectField("Icona", `links.${i}.icon`, item.icon, ICONS) +
    textField("Nome", `links.${i}.name`, item.name) +
    textField("URL", `links.${i}.url`, item.url) +
    bilingualField("Descrizione", `links.${i}.desc`, item.desc)
  )).join("") + addButton("links", "links", "Aggiungi link") + saveFooter("links");
}

function renderProjects() {
  const items = content.projects;
  qs('[data-body="projects"]').innerHTML = items.map((item, i) => itemCard("projects", "projects", i, item.title || "Progetto " + (i + 1),
    textField("Titolo", `projects.${i}.title`, item.title) +
    textField("Anno", `projects.${i}.year`, item.year) +
    textField("URL del sito", `projects.${i}.url`, item.url) +
    selectField("Forma 3D", `projects.${i}.object`, item.object, OBJECTS) +
    textField("Modello .glb (opzionale, sovrascrive la forma 3D)", `projects.${i}.model`, item.model) +
    bilingualField("Tipo di progetto", `projects.${i}.kind`, item.kind) +
    bilingualField("Descrizione", `projects.${i}.text`, item.text, true)
  )).join("") + addButton("projects", "projects", "Aggiungi progetto") + saveFooter("projects");
}

function renderWork() {
  const items = content.work;
  qs('[data-body="work"]').innerHTML = items.map((item, i) => itemCard("work", "work", i, (item.title && item.title.it) || "Lavoro " + (i + 1),
    textField("Anno", `work.${i}.year`, item.year) +
    bilingualField("Titolo", `work.${i}.title`, item.title) +
    bilingualField("Ruolo / contesto", `work.${i}.kind`, item.kind) +
    bilingualField("Descrizione", `work.${i}.text`, item.text, true)
  )).join("") + addButton("work", "work", "Aggiungi voce") + saveFooter("work");
}

function renderOrgList(section) {
  const items = content[section];
  qs(`[data-body="${section}"]`).innerHTML = items.map((item, i) => itemCard(section, section, i, (item.org && item.org.it) || "Voce " + (i + 1),
    bilingualField("Organizzazione / Ente", `${section}.${i}.org`, item.org) +
    bilingualField("Ruolo", `${section}.${i}.role`, item.role) +
    textField("Anno / periodo", `${section}.${i}.year`, item.year)
  )).join("") + addButton(section, section, "Aggiungi voce") + saveFooter(section);
}

function renderPassions() {
  const items = content.passions || [];
  qs('[data-body="passions"]').innerHTML = items.map((item, i) => itemCard("passions", "passions", i, (item.title && item.title.it) || "Passione " + (i + 1),
    bilingualField("Titolo", `passions.${i}.title`, item.title) +
    textField("URL (opzionale)", `passions.${i}.url`, item.url) +
    selectField("Forma 3D", `passions.${i}.object`, item.object, OBJECTS) +
    textField("Modello .glb (opzionale, sovrascrive la forma 3D)", `passions.${i}.model`, item.model) +
    bilingualField("Sottotitolo (opzionale)", `passions.${i}.kind`, item.kind) +
    bilingualField("Descrizione (opzionale)", `passions.${i}.text`, item.text, true)
  )).join("") + addButton("passions", "passions", "Aggiungi passione") + saveFooter("passions");
}

function renderTools() {
  const items = content.tools;
  qs('[data-body="tools"]').innerHTML = items.map((item, i) => itemCard("tools", "tools", i, item.name || "Strumento " + (i + 1),
    selectField("Icona", `tools.${i}.icon`, item.icon, ICONS) +
    textField("Nome", `tools.${i}.name`, item.name) +
    bilingualField("Descrizione", `tools.${i}.desc`, item.desc)
  )).join("") + addButton("tools", "tools", "Aggiungi strumento") + saveFooter("tools");
}

function renderBio() {
  const b = content.bio;
  qs('[data-body="bio"]').innerHTML = `
    <h3 class="sub-h">Paragrafi — EN</h3>
    ${b.en.map((p, i) => stringItemCard("bio", "bio.en", i, p, true)).join("")}
    ${addButton("bio", "bio.en", "Aggiungi paragrafo (EN)")}
    <h3 class="sub-h">Paragrafi — IT</h3>
    ${b.it.map((p, i) => stringItemCard("bio", "bio.it", i, p, true)).join("")}
    ${addButton("bio", "bio.it", "Aggiungi paragrafo (IT)")}
  ` + saveFooter("bio");
}

function renderSkills() {
  const s = content.skills;
  const doList = (lang) => s.do[lang].map((v, i) => stringItemCard("skills", `skills.do.${lang}`, i, v, false)).join("") +
    addButton("skills", `skills.do.${lang}`, "Aggiungi voce (" + lang.toUpperCase() + ")");
  const langList = (lang) => s.languages[lang].map((v, i) => itemCard("skills", `skills.languages.${lang}`, i, v.language || "Lingua " + (i + 1),
      textField("Lingua", `skills.languages.${lang}.${i}.language`, v.language) +
      textField("Livello", `skills.languages.${lang}.${i}.level`, v.level)
    )).join("") + addButton("skills", `skills.languages.${lang}`, "Aggiungi lingua (" + lang.toUpperCase() + ")");
  qs('[data-body="skills"]').innerHTML = `
    <h3 class="sub-h">Cosa faccio — EN</h3>${doList("en")}
    <h3 class="sub-h">Cosa faccio — IT</h3>${doList("it")}
    <h3 class="sub-h">Lingue — EN</h3>${langList("en")}
    <h3 class="sub-h">Lingue — IT</h3>${langList("it")}
  ` + saveFooter("skills");
}

const RENDER = {
  hero: renderHero,
  links: renderLinks,
  projects: renderProjects,
  work: renderWork,
  experience: () => renderOrgList("experience"),
  education: () => renderOrgList("education"),
  bio: renderBio,
  skills: renderSkills,
  tools: renderTools,
  passions: renderPassions,
};

function emptyFor(arrayPath) {
  if (arrayPath === "links") return { icon: "mail", name: "", url: "", desc: { en: "", it: "" } };
  if (arrayPath === "projects") return { title: "", year: "", url: "", object: "generic", model: "", kind: { en: "", it: "" }, text: { en: "", it: "" } };
  if (arrayPath === "work") return { year: "", title: { en: "", it: "" }, kind: { en: "", it: "" }, text: { en: "", it: "" } };
  if (arrayPath === "experience" || arrayPath === "education") return { org: { en: "", it: "" }, role: { en: "", it: "" }, year: "" };
  if (arrayPath === "tools") return { icon: "shapes", name: "", desc: { en: "", it: "" } };
  if (arrayPath === "passions") return { title: { en: "", it: "" }, object: "generic", model: "", url: "", kind: { en: "", it: "" }, text: { en: "", it: "" } };
  if (arrayPath === "hero.route") return { city: { en: "", it: "" }, when: "" };
  if (arrayPath.startsWith("bio.")) return "";
  if (arrayPath.startsWith("skills.do.")) return "";
  if (arrayPath.startsWith("skills.languages.")) return { language: "", level: "" };
  throw new Error("Tipo di elenco sconosciuto: " + arrayPath);
}

function markDirty(section) {
  const el = qs(`[data-status="${section}"]`);
  if (el) { el.textContent = "Modifiche non salvate"; el.className = "status"; }
}

async function saveSection(section) {
  const el = qs(`[data-status="${section}"]`);
  el.textContent = "Salvataggio…"; el.className = "status";
  try {
    const res = await fetch(`/api/admin/content/${section}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content[section]),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Errore durante il salvataggio.");
    el.textContent = "Salvato ✓"; el.className = "status ok";
  } catch (err) {
    el.textContent = err.message; el.className = "status err";
  }
}

/* ---- global state + delegated events ---- */
let content = null;
const appEl = qs(".app");

appEl.addEventListener("input", (e) => {
  const path = e.target.dataset.path;
  if (!path) return;
  setPath(content, path, e.target.value);
  markDirty(path.split(".")[0]);
});

appEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const { action, section, arrayPath } = btn.dataset;
  if (action === "save") return saveSection(section);
  const index = Number(btn.dataset.index);
  const arr = arrayPath ? getPath(content, arrayPath) : null;
  if (action === "add") {
    getPath(content, arrayPath).push(emptyFor(arrayPath));
  } else if (action === "remove") {
    if (!confirm("Rimuovere questo elemento?")) return;
    arr.splice(index, 1);
  } else if (action === "up") {
    if (index <= 0) return;
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
  } else if (action === "down") {
    if (index >= arr.length - 1) return;
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
  } else {
    return;
  }
  RENDER[section]();
  markDirty(section);
});

document.querySelectorAll("#tabs button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#tabs button").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
    btn.classList.add("active");
    qs(`#section-${btn.dataset.tab}`).classList.add("active");
  });
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST" });
  window.location.href = "index.html";
});

async function init() {
  const session = await fetch("/api/admin/session").then((r) => r.json());
  if (!session.authenticated) { window.location.href = "index.html"; return; }
  const res = await fetch("/api/admin/content");
  if (!res.ok) { alert("Impossibile caricare i contenuti."); return; }
  content = await res.json();
  Object.keys(RENDER).forEach((section) => RENDER[section]());
}
init();
