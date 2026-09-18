import { checkPassword, createSessionCookie, jsonResponse, clientIp, isRateLimited, registerFailedAttempt, clearAttempts } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const ip = clientIp(request);

  if (await isRateLimited(env, ip)) {
    return jsonResponse({ error: "Troppi tentativi. Riprova tra qualche minuto." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Richiesta non valida." }, { status: 400 });
  }

  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return jsonResponse({ error: "ADMIN_PASSWORD o SESSION_SECRET non configurate sul server." }, { status: 500 });
  }

  const ok = await checkPassword(body.password, env);
  if (!ok) {
    await registerFailedAttempt(env, ip);
    return jsonResponse({ error: "Password errata." }, { status: 401 });
  }

  await clearAttempts(env, ip);
  const cookie = await createSessionCookie(request, env);
  return jsonResponse({ authenticated: true }, { headers: { "Set-Cookie": cookie } });
}
