const express = require("express");
const { login, logout, sessionStatus, requireAuth } = require("../auth");
const { readContent, updateSection } = require("../store");
const { validateSection } = require("../validate");

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/session", sessionStatus);

router.get("/content", requireAuth, (req, res) => {
  res.json(readContent());
});

router.put("/content/:section", requireAuth, (req, res) => {
  const { section } = req.params;
  try {
    const value = validateSection(section, req.body);
    const content = updateSection(section, value);
    res.json(content);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

module.exports = router;
