const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./router/authRoutes");
const ngoRoutes = require("./router/ngoRoutes");
const ngoAdminRoutes = require("./router/ngoAdminRoutes");
const compaignRoutes = require("./router/compaignRoutes");
const donationRoutes = require("./router/donationRoutes");
const newsletterRoutes = require("./router/subscriberRoutes");

const app = express();


const corsOption = { origin: 'http://localhost:5173' }
app.use(cors(corsOption))

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/auth", authRoutes);
app.use("/ngo", ngoRoutes);
app.use("/admin", ngoAdminRoutes);
app.use("/compaigns", compaignRoutes);
app.use("/donations", donationRoutes);
app.use("/newsletter", newsletterRoutes);

module.exports = app;