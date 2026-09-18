import { SECTIONS } from "./validate.js";

export async function readAllContent(env) {
  const { results } = await env.DB.prepare("SELECT section, data FROM content").all();
  const content = {};
  for (const row of results) content[row.section] = JSON.parse(row.data);
  return content;
}

export async function writeSection(env, section, value) {
  await env.DB.prepare("INSERT INTO content (section, data) VALUES (?, ?) ON CONFLICT(section) DO UPDATE SET data = excluded.data")
    .bind(section, JSON.stringify(value))
    .run();
}

export { SECTIONS };
