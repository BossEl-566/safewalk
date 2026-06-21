const express = require("express");

const { getAdminOverview } = require("../controllers/adminController");

const router = express.Router();

router.get("/overview", getAdminOverview);

module.exports = router;