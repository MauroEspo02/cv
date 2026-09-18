import { readAllContent } from "../_lib/store.js";
import { jsonResponse } from "../_lib/auth.js";

export async function onRequestGet({ env }) {
  const content = await readAllContent(env);
  return jsonResponse(content);
}
