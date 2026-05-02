import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getConferenceBookings,
  getConferenceRooms,
  getTakenConferenceSlots,
  createConferenceBooking,
  cancelConferenceBooking
} from "@/lib/api";
import { Building2, ArrowLeft } from "lucide-react";

const SLOT_MIN = 9;
const SLOT_MAX = 20;
const SLOT_HOURS = Array.from({ length: SLOT_MAX - SLOT_MIN + 1 }, (_, i) => SLOT_MIN + i);

const slotLabel = (h) => `${String(h).padStart(2, "0")}:00`;

function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ConferenceRooms({ setScreen }) {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [boardBookings, setBoardBookings] = useState([]);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsPageSize, setBookingsPageSize] = useState(10);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(0);
  const [taken, setTaken] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState(todayYMD);
  const [bookedBy, setBookedBy] = useState("");
  const [purpose, setPurpose] = useState("");
  const [selectedSlots, setSelectedSlots] = useState(new Set());

  const [filterRoomId, setFilterRoomId] = useState("");
  const [filterDate, setFilterDate] = useState(todayYMD);
  const [boardDate, setBoardDate] = useState(todayYMD);
  const [showBookings, setShowBookings] = useState(false);

  const loadBoardBookings = async (dateValue) => {
    try {
      const result = await getConferenceBookings({
        date: dateValue,
        page: "1",
        pageSize: "500"
      });
      setBoardBookings(result?.items || []);
    } catch {
      setBoardBookings([]);
    }
  };

  const load = async (overrides = {}) => {
    setLoading(true);
    setError("");
    try {
      const p = {};
      const effectiveRoomId = overrides.filterRoomId ?? filterRoomId;
      const effectiveDate = overrides.filterDate ?? filterDate;
      const effectivePage = overrides.page ?? bookingsPage;
      const effectivePageSize = overrides.pageSize ?? bookingsPageSize;
      if (effectiveRoomId) p.roomId = effectiveRoomId;
      if (effectiveDate) p.date = effectiveDate;
      p.page = String(effectivePage);
      p.pageSize = String(effectivePageSize);
      const [rList, bList] = await Promise.all([
        getConferenceRooms(),
        getConferenceBookings(p)
      ]);
      setRooms(rList || []);
      setBookings(bList?.items || []);
      setBookingsTotal(bList?.pagination?.total || 0);
      setBookingsTotalPages(bList?.pagination?.totalPages || 0);
      setBookingsPage(bList?.pagination?.page || effectivePage);
      setBookingsPageSize(bList?.pagination?.pageSize || effectivePageSize);
    } catch (e) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getConferenceBookings({
          date: boardDate,
          page: "1",
          pageSize: "500"
        });
        if (!cancelled) setBoardBookings(result?.items || []);
      } catch {
        if (!cancelled) setBoardBookings([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [boardDate]);

  const applyFilter = () => {
    load({ page: 1 });
  };

  useEffect(() => {
    if (!roomId || !date) {
      setTaken([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { takenSlotHours = [] } = await getTakenConferenceSlots(roomId, date);
        if (!cancelled) setTaken(takenSlotHours);
      } catch {
        if (!cancelled) setTaken([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, date]);

  const toggleSlot = (h) => {
    if (taken.includes(h)) return;
    setSelectedSlots((prev) => {
      const n = new Set(prev);
      if (n.has(h)) n.delete(h);
      else n.add(h);
      return n;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!roomId || !bookedBy.trim() || !purpose.trim() || selectedSlots.size === 0) {
      window.alert("Select room, enter booked-by name, add purpose, and pick at least one hour.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createConferenceBooking({
        roomId,
        date,
        slotHours: [...selectedSlots].sort((a, b) => a - b),
        bookedBy: bookedBy.trim(),
        purpose: purpose.trim()
      });
      setSelectedSlots(new Set());
      setPurpose("");
      await Promise.all([load({ page: 1 }), loadBoardBookings(boardDate)]);
    } catch (err) {
      setError(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onCancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;

    // Optimistic UI removal to reflect cancellation instantly.
    setBookings((prev) => prev.filter((b) => b._id !== id));
    setBoardBookings((prev) => prev.filter((b) => b._id !== id));

    try {
      await cancelConferenceBooking(id);
      await Promise.all([load(), loadBoardBookings(boardDate)]);
    } catch (e) {
      setError(e?.message || "Cancel failed");
      await Promise.all([load(), loadBoardBookings(boardDate)]);
    }
  };

  const boardSlotMap = boardBookings.reduce((acc, booking) => {
    const roomKey = booking.roomId;
    if (!roomKey) return acc;
    if (!acc[roomKey]) acc[roomKey] = {};

    (booking.slotHours || []).forEach((hour) => {
      acc[roomKey][hour] = booking;
    });
    return acc;
  }, {});
  const canGoPrev = bookingsPage > 1;
  const canGoNext = bookingsPage < bookingsTotalPages;

  return (
    <div className="bg-gradient-to-br from-slate-100 to-slate-200 py-2">
      <Card className="w-full max-w-4xl mx-auto rounded-3xl shadow-2xl">
        <CardContent className="p-8 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              Conference rooms
            </h2>
            <Button variant="outline" onClick={() => setScreen("home")} className="flex gap-2">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {loading && <p className="text-sm text-gray-500">Loading…</p>}

          <div className="border rounded-xl p-3 bg-white/80 space-y-2">
            <div className="flex flex-wrap gap-3 justify-between items-end">
              <label className="text-sm">
                Date
                <Input
                  className="mt-1 h-9 w-44"
                  type="date"
                  value={boardDate}
                  onChange={(e) => setBoardDate(e.target.value)}
                />
              </label>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded bg-emerald-200 border border-emerald-400" />
                Free
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded bg-rose-200 border border-rose-400" />
                Booked
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 text-left sticky left-0 bg-slate-100 z-10 min-w-28">Room</th>
                    {SLOT_HOURS.map((h) => (
                      <th key={h} className="p-2 text-center whitespace-nowrap">
                        {slotLabel(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room._id} className="border-t">
                      <td className="p-2 sticky left-0 bg-white z-10">
                        <div className="font-medium">{room.name}</div>
                        <div className="text-[11px] text-gray-500">Cap {room.capacity}</div>
                      </td>
                      {SLOT_HOURS.map((h) => {
                        const booking = boardSlotMap?.[room._id]?.[h];
                        const isBooked = Boolean(booking);
                        return (
                          <td key={h} className="p-1">
                            <div
                              title={
                                isBooked
                                  ? `${room.name} • ${slotLabel(h)} • ${booking.bookedBy}${
                                      booking.purpose ? ` (${booking.purpose})` : ""
                                    }`
                                  : `${room.name} • ${slotLabel(h)} • Available`
                              }
                              className={[
                                "h-7 rounded border text-center leading-7 font-medium",
                                isBooked
                                  ? "bg-rose-200 border-rose-400 text-rose-800"
                                  : "bg-emerald-100 border-emerald-300 text-emerald-800"
                              ].join(" ")}
                            >
                              {isBooked ? "Booked" : "Free"}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rooms.length === 0 && !loading && (
                <p className="text-gray-500 text-sm py-2">No active rooms found.</p>
              )}
            </div>
          </div>

          <form onSubmit={submit} className="space-y-2 border rounded-xl p-1 bg-white/80">
            <h3 className="font-semibold text-slate-900">
              <span className="inline-flex items-center rounded-md bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5">
                New booking
              </span>
              <span className="ml-2 text-sm font-medium text-slate-700">
                (hours {SLOT_MIN}–{SLOT_MAX} local)
              </span>
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-sm">
                Room
                <select
                  className="mt-1 w-full border rounded-md h-10 px-2"
                  value={roomId}
                  onChange={(e) => {
                    setRoomId(e.target.value);
                    setSelectedSlots(new Set());
                  }}
                >
                  <option value="">Select…</option>
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Date
                <Input
                  className="mt-1 h-10"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSelectedSlots(new Set());
                  }}
                />
              </label>
            </div>
            <p className="text-xs text-gray-600">
              Unavailable hours are already booked (taken = locked).
            </p>
            <div className="flex flex-wrap gap-2">
              {SLOT_HOURS.map((h) => {
                  const isTaken = taken.includes(h);
                  const on = selectedSlots.has(h);
                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={isTaken}
                      onClick={() => toggleSlot(h)}
                      className={[
                        "px-2 py-1 rounded text-sm border",
                        isTaken
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : on
                            ? "bg-blue-600 text-white"
                            : "bg-white hover:bg-slate-50"
                      ].join(" ")}
                    >
                      {slotLabel(h)}
                    </button>
                  );
                })}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-sm col-span-2 sm:col-span-1">
                Booked by
                <Input
                  className="mt-1 h-10"
                  value={bookedBy}
                  onChange={(e) => setBookedBy(e.target.value)}
                  placeholder="Name or host"
                />
              </label>
              <label className="text-sm col-span-2 sm:col-span-1">
                Purpose
                <Input
                  className="mt-1 h-10"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                />
              </label>
            </div>
            <Button type="submit" disabled={saving || !roomId}>
              {saving ? "Saving…" : "Book"}
            </Button>
          </form>

          <div className="border rounded-xl p-1 bg-white/80 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <div>
                <h3 className="font-semibold text-slate-900">
                  <span className="inline-flex items-center rounded-md bg-violet-100 text-violet-900 border border-violet-300 px-2 py-0.5">
                    Existing bookings
                  </span>
                </h3>
                <p className="text-xs text-gray-600">
                  Starts focused on today. Expand only when you need details.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => setShowBookings((v) => !v)}>
                {showBookings ? "Hide bookings" : "Show bookings"}
              </Button>
            </div>

            {showBookings && (
              <>
                <div className="flex flex-wrap gap-2 items-end">
                  <label className="text-sm">
                    Filter room
                    <select
                      className="mt-1 w-40 border rounded-md h-9 px-2"
                      value={filterRoomId}
                      onChange={(e) => setFilterRoomId(e.target.value)}
                    >
                      <option value="">All</option>
                      {rooms.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    Filter date
                    <Input
                      className="mt-1 h-9 w-40"
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    />
                  </label>
                  <Button type="button" variant="outline" onClick={applyFilter}>
                    Apply
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      const d = todayYMD();
                      setFilterRoomId("");
                      setFilterDate(d);
                      load({ filterRoomId: "", filterDate: d, page: 1 });
                    }}
                  >
                    Reset to today
                  </Button>
                </div>

                <div className="overflow-x-auto text-sm">
                  <table className="w-full border mt-2">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">Room</th>
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Hours</th>
                        <th className="p-2 text-left">Booked by</th>
                        <th className="p-2 text-left">Purpose</th>
                        <th className="p-2 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b._id} className="border-b">
                          <td className="p-2">{b.roomName || "—"}</td>
                          <td className="p-2">{b.bookingDate}</td>
                          <td className="p-2">
                            {b.slotHours && b.slotHours.length
                              ? b.slotHours.map(slotLabel).join(", ")
                              : "—"}
                          </td>
                          <td className="p-2">{b.bookedBy}</td>
                          <td className="p-2">{b.purpose || "—"}</td>
                          <td className="p-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => onCancel(b._id)}
                            >
                              Cancel
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bookings.length === 0 && !loading && (
                    <p className="text-gray-500 text-sm py-2">No bookings for this filter.</p>
                  )}
                </div>

                <div className="flex flex-wrap justify-between items-center gap-2">
                  <p className="text-xs text-gray-600">
                    Page {bookingsPage} of {bookingsTotalPages || 1} • Total {bookingsTotal} bookings
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!canGoPrev || loading}
                      onClick={() => load({ page: bookingsPage - 1 })}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!canGoNext || loading}
                      onClick={() => load({ page: bookingsPage + 1 })}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
