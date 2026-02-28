const express = require("express");
const Visit = require("../models/Visit");
const Visitor = require("../models/Visitor");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { phone, name, company, purpose, personToMeet, photoUrl } = req.body;
    if (!phone || !name || !purpose || !personToMeet) {
      return res.status(400).json({ message: "phone, name, purpose, personToMeet are required" });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "phone must be 10 digits" });
    }

    const visitor = await Visitor.findOneAndUpdate(
      { phone },
      { name, company },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const visit = await Visit.create({
      visitorId: visitor._id,
      phone,
      name,
      purpose,
      personToMeet,
      photoUrl
    });

    return res.status(201).json(visit);
  } catch (error) {
    return next(error);
  }
});

router.put("/:id/checkout", async (req, res, next) => {
  try {
    const visit = await Visit.findByIdAndUpdate(
      req.params.id,
      { status: "completed", checkOutTime: new Date() },
      { new: true }
    );

    if (!visit) {
      return res.status(404).json({ message: "Visit not found" });
    }

    return res.json(visit);
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { date, startDate, endDate, name, phone, status, purpose, personToMeet, q } = req.query;
    const query = {};

    if (status) query.status = status;
    if (purpose) query.purpose = { $regex: purpose, $options: "i" };

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { personToMeet: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } }
      ];
    } else {
      if (name) query.name = { $regex: name, $options: "i" };
      if (personToMeet) query.personToMeet = { $regex: personToMeet, $options: "i" };
      if (phone) query.phone = { $regex: phone, $options: "i" };
    }

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.checkInTime = { $gte: start, $lt: end };
    }

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date("1970-01-01");
      const end = endDate ? new Date(endDate) : new Date();
      end.setDate(end.getDate() + 1);
      query.checkInTime = { $gte: start, $lt: end };
    }

    const visits = await Visit.find(query).sort({ checkInTime: -1 }).lean();
    return res.json(visits);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
