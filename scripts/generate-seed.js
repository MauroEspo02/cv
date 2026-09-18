// Regenerates migrations/0002_seed.sql from data/content.json.
// Run after editing data/content.json by hand: node scripts/generate-seed.js
const fs = require("fs");
const path = require("path");

const content = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "content.json"), "utf8"));

function sqlString(value) {
  return "'" + value.replace(/'/g, "''") + "'";
}

// No leading SQL comment line here: the Cloudflare D1 web console executes
// statements as they're pasted and treats a comment-only first line as an
// empty query, which surfaces as a confusing "malformed request" error.
const lines = ["DELETE FROM content;"];
for (const [section, value] of Object.entries(content)) {
  lines.push(`INSERT INTO content (section, data) VALUES (${sqlString(section)}, ${sqlString(JSON.stringify(value))});`);
}

fs.writeFileSync(path.join(__dirname, "..", "migrations", "0002_seed.sql"), lines.join("\n") + "\n", "utf8");
console.log("Wrote migrations/0002_seed.sql");
