require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

const visitorsRouter = require("./routes/visitors");
const visitsRouter = require("./routes/visits");

const app = express();

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;


app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/visitors", visitorsRouter);
app.use("/api/visits", visitsRouter);

app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`API listening on ${PORT}`);
    });
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Mongo connection failed", error);
    process.exit(1);
  });
