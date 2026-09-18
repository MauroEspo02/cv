import { writeSection, readAllContent } from "../../../_lib/store.js";
import { validateSection } from "../../../_lib/validate.js";
import { isAuthenticated, jsonResponse } from "../../../_lib/auth.js";

export async function onRequestPut({ request, env, params }) {
  if (!(await isAuthenticated(request, env))) {
    return jsonResponse({ error: "Accesso non autorizzato. Effettua il login." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Richiesta non valida." }, { status: 400 });
  }

  try {
    const value = validateSection(params.section, body);
    await writeSection(env, params.section, value);
  } catch (err) {
    return jsonResponse({ error: err.message }, { status: err.status || 400 });
  }

  const content = await readAllContent(env);
  return jsonResponse(content);
}
