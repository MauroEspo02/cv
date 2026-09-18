import { readAllContent } from "../../_lib/store.js";
import { isAuthenticated, jsonResponse } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  if (!(await isAuthenticated(request, env))) {
    return jsonResponse({ error: "Accesso non autorizzato. Effettua il login." }, { status: 401 });
  }
  const content = await readAllContent(env);
  return jsonResponse(content);
}
