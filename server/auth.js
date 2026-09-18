const crypto = require("crypto");

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map();

function tooManyAttempts(ip) {
  const entry = attempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    attempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function registerFailedAttempt(ip) {
  const entry = attempts.get(ip);
  if (!entry || Date.now() - entry.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: Date.now() });
  } else {
    entry.count += 1;
  }
}

function clearAttempts(ip) {
  attempts.delete(ip);
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // still run a comparison of equal length to avoid leaking length via timing
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function login(req, res) {
  const ip = req.ip;
  if (tooManyAttempts(ip)) {
    return res.status(429).json({ error: "Troppi tentativi. Riprova tra qualche minuto." });
  }
  const { password } = req.body || {};
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return res.status(500).json({ error: "ADMIN_PASSWORD non configurata sul server." });
  }
  if (typeof password !== "string" || !safeEqual(password, expected)) {
    registerFailedAttempt(ip);
    return res.status(401).json({ error: "Password errata." });
  }
  clearAttempts(ip);
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: "Errore di sessione." });
    req.session.authenticated = true;
    res.json({ authenticated: true });
  });
}

function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ authenticated: false });
  });
}

function sessionStatus(req, res) {
  res.json({ authenticated: Boolean(req.session && req.session.authenticated) });
}

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ error: "Accesso non autorizzato. Effettua il login." });
}

module.exports = { login, logout, sessionStatus, requireAuth };
