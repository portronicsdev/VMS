const express = require("express");
const { supabase } = require("../lib/supabase");

const router = express.Router();

const SLOT_MIN = 9;
const SLOT_MAX = 20;

function toBookingRow(b, roomName, slotHours) {
  return {
    _id: b.id,
    roomId: b.room_id,
    roomName: roomName || null,
    bookingDate: b.booking_date,
    slotHours: (slotHours || []).sort((a, b) => a - b),
    bookedBy: b.booked_by,
    purpose: b.purpose,
    visitId: b.visit_id,
    status: b.status,
    createdAt: b.created_at
  };
}

/** GET /api/conference/rooms */
router.get("/rooms", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("conference_rooms")
      .select("id, name, capacity, is_active, created_at")
      .eq("is_active", true)
      .order("name");

    if (error) return next(error);
    res.json(
      (data || []).map((r) => ({
        _id: r.id,
        name: r.name,
        capacity: r.capacity,
        isActive: r.is_active,
        createdAt: r.created_at
      }))
    );
  } catch (e) {
    next(e);
  }
});

/** GET /api/conference/bookings?roomId=&date=&page=&pageSize= */
router.get("/bookings", async (req, res, next) => {
  try {
    const { roomId, date } = req.query;
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.pageSize || "10"), 10) || 10)
    );
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabase
      .from("conference_bookings")
      .select("id, room_id, booking_date, booked_by, purpose, visit_id, status, created_at", {
        count: "exact"
      })
      .eq("status", "booked")
      .order("booking_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (roomId) q = q.eq("room_id", roomId);
    if (date) q = q.eq("booking_date", date);

    const { data: bookings, error, count } = await q;
    if (error) return next(error);

    const list = bookings || [];
    const total = count || 0;
    if (list.length === 0) {
      return res.json({
        items: [],
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    }

    const roomIds = [...new Set(list.map((b) => b.room_id))];
    const { data: rooms } = await supabase
      .from("conference_rooms")
      .select("id, name")
      .in("id", roomIds);
    const roomMap = Object.fromEntries((rooms || []).map((r) => [r.id, r.name]));

    const bookingIds = list.map((b) => b.id);
    const { data: slotRows, error: slotErr } = await supabase
      .from("conference_booking_slots")
      .select("booking_id, slot_hour")
      .in("booking_id", bookingIds);
    if (slotErr) return next(slotErr);

    const byBooking = {};
    (slotRows || []).forEach((s) => {
      if (!byBooking[s.booking_id]) byBooking[s.booking_id] = [];
      byBooking[s.booking_id].push(s.slot_hour);
    });

    res.json({
      items: list.map((b) =>
        toBookingRow(b, roomMap[b.room_id] || null, byBooking[b.id] || [])
      ),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (e) {
    next(e);
  }
});

/** GET /api/conference/rooms/:roomId/taken-slots?date=YYYY-MM-DD */
router.get("/rooms/:roomId/taken-slots", async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: "date is required" });
    }

    const { data, error } = await supabase
      .from("conference_booking_slots")
      .select("slot_hour")
      .eq("room_id", roomId)
      .eq("booking_date", date);

    if (error) return next(error);

    const hours = [...new Set((data || []).map((r) => r.slot_hour))].sort(
      (a, b) => a - b
    );
    res.json({ takenSlotHours: hours });
  } catch (e) {
    next(e);
  }
});

/** POST /api/conference/bookings */
router.post("/bookings", async (req, res, next) => {
  try {
    const { roomId, date, slotHours, bookedBy, purpose, visitId } = req.body || {};

    if (!roomId || !date || !String(bookedBy).trim() || !String(purpose).trim()) {
      return res
        .status(400)
        .json({ message: "roomId, date, bookedBy, and purpose are required" });
    }

    const hours = Array.isArray(slotHours) ? slotHours : [];
    if (hours.length === 0) {
      return res.status(400).json({ message: "slotHours must be a non-empty array" });
    }

    const clean = [
      ...new Set(
        hours.map((h) => parseInt(String(h), 10)).filter((h) => !Number.isNaN(h))
      )
    ].sort((a, b) => a - b);

    for (const h of clean) {
      if (h < SLOT_MIN || h > SLOT_MAX) {
        return res.status(400).json({
          message: `Each slot must be between ${SLOT_MIN} and ${SLOT_MAX} (hour start)`
        });
      }
    }

    const { data: booking, error: bErr } = await supabase
      .from("conference_bookings")
      .insert({
        room_id: roomId,
        booking_date: date,
        booked_by: String(bookedBy).trim(),
        purpose: String(purpose).trim(),
        visit_id: visitId || null,
        status: "booked"
      })
      .select()
      .single();

    if (bErr) return next(bErr);

    const slotRows = clean.map((slot_hour) => ({
      booking_id: booking.id,
      room_id: roomId,
      booking_date: date,
      slot_hour
    }));

    const { error: sErr } = await supabase
      .from("conference_booking_slots")
      .insert(slotRows);

    if (sErr) {
      await supabase.from("conference_bookings").delete().eq("id", booking.id);
      if (sErr.code === "23505" || sErr.message?.includes("unique")) {
        return res
          .status(409)
          .json({ message: "One or more slots are already booked for this room" });
      }
      return next(sErr);
    }

    const { data: room } = await supabase
      .from("conference_rooms")
      .select("name")
      .eq("id", roomId)
      .single();

    res.status(201).json(
      toBookingRow(booking, room?.name || null, clean)
    );
  } catch (e) {
    next(e);
  }
});

/** PUT /api/conference/bookings/:id/cancel */
router.put("/bookings/:id/cancel", async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error: uErr } = await supabase
      .from("conference_bookings")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (uErr) return next(uErr);

    await supabase.from("conference_booking_slots").delete().eq("booking_id", id);

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
