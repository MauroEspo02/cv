import { isAuthenticated, jsonResponse } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const authenticated = await isAuthenticated(request, env);
  return jsonResponse({ authenticated });
}
