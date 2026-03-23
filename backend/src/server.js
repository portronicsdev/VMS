require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// Supabase init (validates env vars)
require("./lib/supabase");

const authRouter = require("./routes/auth");
const visitorsRouter = require("./routes/visitors");
const visitsRouter = require("./routes/visits");
const { requireAuth } = require("./middleware/auth");

const app = express();

const PORT = process.env.PORT;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/visitors", requireAuth, visitorsRouter);
app.use("/api/visits", requireAuth, visitsRouter);

app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

app.listen(PORT, () => {
  console.log(`API listening on ${PORT} (Supabase)`);
});
