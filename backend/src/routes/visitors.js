const express = require("express");
const Visitor = require("../models/Visitor");

const router = express.Router();

router.get("/:phone", async (req, res, next) => {
  try {
    if (!/^\d{10}$/.test(req.params.phone)) {
      return res.status(400).json({ message: "phone must be 10 digits" });
    }

    const visitor = await Visitor.findOne({ phone: req.params.phone }).lean();
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }
    return res.json(visitor);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { phone, name, company } = req.body;
    if (!phone || !name) {
      return res.status(400).json({ message: "phone and name are required" });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "phone must be 10 digits" });
    }

    const visitor = await Visitor.findOneAndUpdate(
      { phone },
      { name, company },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json(visitor);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
