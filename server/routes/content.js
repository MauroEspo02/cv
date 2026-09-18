const express = require("express");
const { readContent } = require("../store");

const router = express.Router();

router.get("/content", (req, res) => {
  res.json(readContent());
});

module.exports = router;
