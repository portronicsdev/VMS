const express = require("express");
const multer = require("multer");
const { supabase, toVisitRow } = require("../lib/supabase");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500000 }
});

function getISTDayStart(dateStr) {
  return new Date(`${dateStr}T00:00:00+05:30`);
}

function getISTNextDayStart(dateStr) {
  const next = new Date(`${dateStr}T00:00:00+05:30`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}


/* =================================
   CREATE VISIT
================================= */

router.post("/", upload.single("photo"), async (req, res, next) => {

  try {

    const { phone, name, company, purpose, personToMeet } = req.body;

    if (!phone || !name || !purpose || !personToMeet) {
      return res.status(400).json({
        message: "phone, name, purpose and personToMeet required"
      });
    }

    let photoUrl = null;

    if (req.file) {

      const fileName = `${Date.now()}_${phone}.jpg`;

      const { error } = await supabase.storage
        .from("visitor_photos")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype
        });

      if (!error) {

        const { data } = supabase.storage
          .from("visitor_photos")
          .getPublicUrl(fileName);

        photoUrl = data.publicUrl;
      }
    }


    const { data: visitor, error: visitorError } = await supabase
      .from("visitors")
      .upsert(
        { phone, name, company },
        { onConflict: "phone" }
      )
      .select()
      .single();

    if (visitorError) return next(visitorError);


    const { data: visit, error } = await supabase
      .from("visits")
      .insert({
        visitor_id: visitor.id,
        phone,
        name,
        purpose,
        person_to_meet: personToMeet,
        photo_url: photoUrl,
        check_in_time: new Date().toISOString()
      })
      .select()
      .single();

    if (error) return next(error);

    res.status(201).json(toVisitRow(visit));

  } catch (err) {

    next(err);

  }

});


/* =================================
   CHECKOUT
================================= */

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

    res.json(toVisitRow(data));

  } catch (err) {

    next(err);

  }

});


/* =================================
   GET VISITS (PAGINATED)
================================= */

router.get("/", async (req, res, next) => {
  try {
    const { date, startDate, endDate, name, phone, status, purpose, personToMeet, q } = req.query;
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "25", 10)));
    const from = (page - 1) * limit;
    const to = from + limit - 1;


    let query = supabase
      .from("visits")
      .select("*, visitors(company)", { count: "exact" })
      .order("check_in_time", { ascending: false })
      .range(from, to);

    if (q) {
      const safeQ = String(q).replace(/[%'\"\\]/g, "").slice(0, 100);
      query = query.or(
        `name.ilike.%${safeQ}%,person_to_meet.ilike.%${safeQ}%,phone.ilike.%${safeQ}%`
      );
    } else {
      if (name) query = query.ilike("name", `%${name}%`);
      if (personToMeet) query = query.ilike("person_to_meet", `%${personToMeet}%`);
      if (phone) query = query.ilike("phone", `%${phone}%`);
    }

    if (status) query = query.eq("status", status);
    if (purpose) query = query.ilike("purpose", `%${purpose}%`);

    if (date) {
      const start = getISTDayStart(date);
      const end = getISTNextDayStart(date);
      query = query
        .gte("check_in_time", start.toISOString())
        .lt("check_in_time", end.toISOString());
    }

    if (startDate || endDate) {
      const start = startDate ? getISTDayStart(startDate) : new Date("1970-01-01T00:00:00.000Z");
      const end = endDate ? getISTNextDayStart(endDate) : new Date();
      query = query
        .gte("check_in_time", start.toISOString())
        .lt("check_in_time", end.toISOString());
    }

    const { data, error, count } = await query;

    if (error) return next(error);

    console.log("[GET /api/visits] result:", {
      returned: (data || []).length,
      total: count ?? 0,
      page,
      limit
    });

    res.json({
      data: (data || []).map(toVisitRow),
      total: count ?? 0,
      page,
      limit
    });

  } catch (err) {

    next(err);

  }

});


module.exports = router;