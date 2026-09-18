const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "content.json");
const SECTIONS = ["hero", "links", "projects", "work", "experience", "education", "bio", "skills", "tools"];

function readContent() {
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(raw);
}

function writeContent(content) {
  const tmpFile = DATA_FILE + ".tmp";
  fs.writeFileSync(tmpFile, JSON.stringify(content, null, 2) + "\n", "utf8");
  fs.renameSync(tmpFile, DATA_FILE);
}

function isValidSection(section) {
  return SECTIONS.includes(section);
}

function updateSection(section, value) {
  if (!isValidSection(section)) {
    throw new Error("Sezione sconosciuta: " + section);
  }
  const content = readContent();
  content[section] = value;
  writeContent(content);
  return content;
}

module.exports = { readContent, writeContent, updateSection, isValidSection, SECTIONS };
