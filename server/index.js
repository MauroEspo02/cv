require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");

const contentRoutes = require("./routes/content");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

if (!process.env.ADMIN_PASSWORD) {
  console.warn("[avviso] ADMIN_PASSWORD non impostata: il login admin sarà disabilitato finché non la configuri (vedi .env.example).");
}

app.set("trust proxy", 1);
app.use(express.json());

app.use(
  session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET || "sviluppo-locale-non-sicuro",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "strict",
      secure: isProd,
      maxAge: 8 * 60 * 60 * 1000,
    },
  })
);

app.use("/api", contentRoutes);
app.use("/api/admin", adminRoutes);

app.use(express.static(path.join(__dirname, "..", "public")));

app.listen(PORT, () => {
  console.log(`Server pronto su http://localhost:${PORT}`);
  console.log(`Pannello admin su http://localhost:${PORT}/admin`);
});
