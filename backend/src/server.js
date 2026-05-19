const express = require("express");
const cors = require("cors");
require("dotenv").config();

const cellRoutes = require("./routes/cellRoutes");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Cell Tracker API" });
});

app.use("/api", cellRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error" });
});

app.listen(port, () => {
  console.log(`Cell Tracker API running on port ${port}`);
});
