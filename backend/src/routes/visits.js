const express = require("express");
const multer = require("multer");
const { supabase, toVisitRow } = require("../lib/supabase");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500000 }
});


/* =================================
   CREATE VISIT
================================= */

router.post("/", upload.single("photo"), async (req, res, next) => {

  try {

    const { phone, name, company, purpose, personToMeet } = req.body;

    if (!phone || !name || !personToMeet) {
      return res.status(400).json({
        message: "phone, name and personToMeet required"
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

    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "25", 10);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { q } = req.query;

    let query = supabase
      .from("visits")
      .select("*", { count: "exact" })
      .order("check_in_time", { ascending: false })
      .range(from, to);

    if (q) {
      query = query.or(
        `name.ilike.%${q}%,person_to_meet.ilike.%${q}%,phone.ilike.%${q}%`
      );
    }

    const { data, error, count } = await query;

    if (error) return next(error);

    res.json({
      data: (data || []).map(toVisitRow),
      page,
      limit,
      total: count
    });

  } catch (err) {

    next(err);

  }

});


module.exports = router;