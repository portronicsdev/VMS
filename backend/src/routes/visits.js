const express = require("express");
const { supabase, toVisitRow } = require("../lib/supabase");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { phone, name, company, purpose, personToMeet, photoUrl } = req.body;
    if (!phone || !name || !purpose || !personToMeet) {
      return res.status(400).json({
        message: "phone, name, purpose, personToMeet are required"
      });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "phone must be 10 digits" });
    }

    const { data: visitor, error: visitorError } = await supabase
      .from("visitors")
      .upsert(
        { phone, name, company: company || null },
        { onConflict: "phone" }
      )
      .select()
      .single();

    if (visitorError) return next(visitorError);

    const { data: visit, error: visitError } = await supabase
      .from("visits")
      .insert({
        visitor_id: visitor.id,
        phone,
        name,
        purpose,
        person_to_meet: personToMeet,
        check_in_time: new Date().toISOString()
      })
      .select()
      .single();

    if (visitError) return next(visitError);
    return res.status(201).json(toVisitRow(visit));
  } catch (error) {
    return next(error);
  }
});

router.put("/:id/checkout", async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("visits")
      .update({
        status: "completed",
        check_out_time: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return next(error);
    if (!data) {
      return res.status(404).json({ message: "Visit not found" });
    }
    return res.json(toVisitRow(data));
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { date, startDate, endDate, name, phone, status, purpose, personToMeet, q } = req.query;

    let query = supabase.from("visits").select("*");

    if (status) query = query.eq("status", status);
    if (purpose) query = query.ilike("purpose", `%${purpose}%`);

    if (q) {
      const safeQ = String(q).replace(/[%'"\\]/g, "").slice(0, 100);
      query = query.or(`name.ilike.%${safeQ}%,person_to_meet.ilike.%${safeQ}%,phone.ilike.%${safeQ}%`);
    } else {
      if (name) query = query.ilike("name", `%${name}%`);
      if (personToMeet) query = query.ilike("person_to_meet", `%${personToMeet}%`);
      if (phone) query = query.ilike("phone", `%${phone}%`);
    }

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query = query
        .gte("check_in_time", start.toISOString())
        .lt("check_in_time", end.toISOString());
    }

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date("1970-01-01");
      const end = endDate ? new Date(endDate) : new Date();
      end.setDate(end.getDate() + 1);
      query = query
        .gte("check_in_time", start.toISOString())
        .lt("check_in_time", end.toISOString());
    }

    query = query.order("check_in_time", { ascending: false });

    const { data, error } = await query;

    if (error) return next(error);
    return res.json((data || []).map(toVisitRow));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
