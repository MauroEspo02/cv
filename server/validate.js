const ICONS = ["mail", "card", "phone", "image", "vector", "layout", "shapes", "video", "keys", "chat", "map", "sheet"];
const OBJECTS = ["jar", "stage", "passport", "generic"];

function fail(msg) {
  const err = new Error(msg);
  err.status = 400;
  throw err;
}

function str(v, label) {
  if (typeof v !== "string") fail(`${label} deve essere testo.`);
  return v;
}

function bilingual(v, label) {
  if (!v || typeof v !== "object") fail(`${label} deve avere le versioni "en" e "it".`);
  str(v.en, `${label}.en`);
  str(v.it, `${label}.it`);
  return v;
}

function array(v, label) {
  if (!Array.isArray(v)) fail(`${label} deve essere un elenco.`);
  return v;
}

function oneOf(v, list, label) {
  if (!list.includes(v)) fail(`${label} deve essere uno tra: ${list.join(", ")}.`);
  return v;
}

const validators = {
  hero(v) {
    if (!v || typeof v !== "object") fail("hero non valido.");
    str(v.name, "hero.name");
    ["en", "it"].forEach((l) => {
      if (!v.headline || !v.headline[l]) fail(`hero.headline.${l} mancante.`);
      str(v.headline[l].verb, `hero.headline.${l}.verb`);
      str(v.headline[l].word1, `hero.headline.${l}.word1`);
      str(v.headline[l].joiner, `hero.headline.${l}.joiner`);
      str(v.headline[l].word2, `hero.headline.${l}.word2`);
    });
    bilingual(v.intro, "hero.intro");
    array(v.route, "hero.route").forEach((stop, i) => {
      bilingual(stop.city, `hero.route[${i}].city`);
      str(stop.when, `hero.route[${i}].when`);
    });
    if (!v.current) fail("hero.current mancante.");
    bilingual(v.current.city, "hero.current.city");
    bilingual(v.current.when, "hero.current.when");
    if (!v.next) fail("hero.next mancante.");
    bilingual(v.next.when, "hero.next.when");
    return v;
  },
  links(v) {
    return array(v, "links").map((item, i) => {
      oneOf(item.icon, ICONS, `links[${i}].icon`);
      str(item.name, `links[${i}].name`);
      str(item.url, `links[${i}].url`);
      bilingual(item.desc, `links[${i}].desc`);
      return item;
    });
  },
  projects(v) {
    return array(v, "projects").map((item, i) => {
      str(item.title, `projects[${i}].title`);
      str(item.year, `projects[${i}].year`);
      str(item.url, `projects[${i}].url`);
      oneOf(item.object, OBJECTS, `projects[${i}].object`);
      if (item.model !== undefined && item.model !== "") str(item.model, `projects[${i}].model`);
      bilingual(item.kind, `projects[${i}].kind`);
      bilingual(item.text, `projects[${i}].text`);
      return item;
    });
  },
  work(v) {
    return array(v, "work").map((item, i) => {
      str(item.year, `work[${i}].year`);
      bilingual(item.title, `work[${i}].title`);
      bilingual(item.kind, `work[${i}].kind`);
      bilingual(item.text, `work[${i}].text`);
      return item;
    });
  },
  experience: validateOrgList("experience"),
  education: validateOrgList("education"),
  bio(v) {
    if (!v || typeof v !== "object") fail("bio non valida.");
    ["en", "it"].forEach((l) => array(v[l], `bio.${l}`).forEach((p, i) => str(p, `bio.${l}[${i}]`)));
    return v;
  },
  skills(v) {
    if (!v || !v.do || !v.languages) fail("skills non valida.");
    ["en", "it"].forEach((l) => array(v.do[l], `skills.do.${l}`).forEach((s, i) => str(s, `skills.do.${l}[${i}]`)));
    ["en", "it"].forEach((l) =>
      array(v.languages[l], `skills.languages.${l}`).forEach((item, i) => {
        str(item.language, `skills.languages.${l}[${i}].language`);
        str(item.level, `skills.languages.${l}[${i}].level`);
      })
    );
    return v;
  },
  tools(v) {
    return array(v, "tools").map((item, i) => {
      oneOf(item.icon, ICONS, `tools[${i}].icon`);
      str(item.name, `tools[${i}].name`);
      bilingual(item.desc, `tools[${i}].desc`);
      return item;
    });
  },
};

function validateOrgList(label) {
  return function (v) {
    return array(v, label).map((item, i) => {
      bilingual(item.org, `${label}[${i}].org`);
      bilingual(item.role, `${label}[${i}].role`);
      str(item.year, `${label}[${i}].year`);
      return item;
    });
  };
}

function validateSection(section, value) {
  const fn = validators[section];
  if (!fn) fail("Sezione sconosciuta: " + section);
  return fn(value);
}

module.exports = { validateSection, ICONS, OBJECTS };
