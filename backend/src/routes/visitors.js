const express = require("express");
const { supabase, toVisitorRow } = require("../lib/supabase");

const router = express.Router();

router.get("/:phone", async (req, res, next) => {
  try {
    if (!/^\d{10}$/.test(req.params.phone)) {
      return res.status(400).json({ message: "phone must be 10 digits" });
    }

    const { data, error } = await supabase
      .from("visitors")
      .select("*")
      .eq("phone", req.params.phone)
      .single();

    if (error && error.code !== "PGRST116") return next(error);
    if (!data) {
      return res.status(404).json({ message: "Visitor not found" });
    }
    return res.json(toVisitorRow(data));
  } catch (error) {
              console.log("❌ Error in GET /api/visitors/:phone:", error);

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

    const { data, error } = await supabase
      .from("visitors")
      .upsert({ phone, name, company: company || null }, { onConflict: "phone" })
      .select()
      .single();

    if (error) return next(error);
    return res.status(201).json(toVisitorRow(data));
  } catch (error) {
    console.log("❌ Error in POST /api/visitors:", error);
    return next(error);
  }
});

module.exports = router;
