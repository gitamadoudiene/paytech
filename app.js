require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Configuration CORS
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:8080";
app.use(cors({ origin: allowedOrigin, optionsSuccessStatus: 200 }));

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
const paymentRoutes = require("./routes/paymentroute");
app.use("/api", paymentRoutes);

module.exports = app;
