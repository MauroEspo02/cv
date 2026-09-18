const COOKIE_NAME = "session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

async function hmac(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export async function checkPassword(password, env) {
  if (typeof password !== "string" || !env.ADMIN_PASSWORD || !env.SESSION_SECRET) return false;
  const [a, b] = await Promise.all([hmac(env.SESSION_SECRET, password), hmac(env.SESSION_SECRET, env.ADMIN_PASSWORD)]);
  return timingSafeEqual(a, b);
}

function cookieFlags(request) {
  const secure = new URL(request.url).protocol === "https:";
  return `HttpOnly; SameSite=Strict; Path=/${secure ? "; Secure" : ""}`;
}

export async function createSessionCookie(request, env) {
  const exp = Date.now() + SESSION_DURATION_MS;
  const sig = await hmac(env.SESSION_SECRET, String(exp));
  return `${COOKIE_NAME}=${exp}.${sig}; ${cookieFlags(request)}; Max-Age=${SESSION_DURATION_MS / 1000}`;
}

export function clearSessionCookie(request) {
  return `${COOKIE_NAME}=; ${cookieFlags(request)}; Max-Age=0`;
}

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const match = header.split(";").map((c) => c.trim()).find((c) => c.startsWith(name + "="));
  return match ? match.slice(name.length + 1) : null;
}

export async function isAuthenticated(request, env) {
  const value = getCookie(request, COOKIE_NAME);
  if (!value) return false;
  const [expStr, sig] = value.split(".");
  if (!expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  if (!env.SESSION_SECRET) return false;
  const expected = await hmac(env.SESSION_SECRET, expStr);
  return timingSafeEqual(sig, expected);
}

export function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

export function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

export async function isRateLimited(env, ip) {
  const row = await env.DB.prepare("SELECT count, first_attempt FROM login_attempts WHERE ip = ?").bind(ip).first();
  if (!row) return false;
  if (Date.now() - row.first_attempt > RATE_LIMIT_WINDOW_MS) return false;
  return row.count >= RATE_LIMIT_MAX;
}

export async function registerFailedAttempt(env, ip) {
  const now = Date.now();
  const row = await env.DB.prepare("SELECT count, first_attempt FROM login_attempts WHERE ip = ?").bind(ip).first();
  if (!row || now - row.first_attempt > RATE_LIMIT_WINDOW_MS) {
    await env.DB.prepare(
      "INSERT INTO login_attempts (ip, count, first_attempt) VALUES (?, 1, ?) ON CONFLICT(ip) DO UPDATE SET count = 1, first_attempt = excluded.first_attempt"
    ).bind(ip, now).run();
  } else {
    await env.DB.prepare("UPDATE login_attempts SET count = count + 1 WHERE ip = ?").bind(ip).run();
  }
}

export async function clearAttempts(env, ip) {
  await env.DB.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();
}
