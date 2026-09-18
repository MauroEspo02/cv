import { clearSessionCookie, jsonResponse } from "../../_lib/auth.js";

export async function onRequestPost({ request }) {
  return jsonResponse({ authenticated: false }, { headers: { "Set-Cookie": clearSessionCookie(request) } });
}
