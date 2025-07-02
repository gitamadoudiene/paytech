const express = require("express");
const router = express.Router();
const { initiatePayment } = require("../controllers/paymentcontroller");

router.post("/pay", initiatePayment);

module.exports = router;
