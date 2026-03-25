import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkoutVisit, getVisits } from "@/lib/api";

export default function Dashboard({ setScreen }) {

  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const IST_TZ = "Asia/Kolkata";

  const toYMDInIST = (date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: IST_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date);

  const getISTDateRange = (filter) => {
    if (filter === "all") return {};

    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", { timeZone: IST_TZ }));
    const end = new Date(istNow);
    const start = new Date(istNow);
    const day = istNow.getDay(); // 0 Sun, 1 Mon, ...
    const mondayOffset = day === 0 ? 6 : day - 1;

    if (filter === "today") {
      const ymd = toYMDInIST(istNow);
      return { startDate: ymd, endDate: ymd };
    }

    if (filter === "yesterday") {
      start.setDate(start.getDate() - 1);
      const ymd = toYMDInIST(start);
      return { startDate: ymd, endDate: ymd };
    }

    if (filter === "thisWeek") {
      start.setDate(start.getDate() - mondayOffset);
      return { startDate: toYMDInIST(start), endDate: toYMDInIST(end) };
    }

    if (filter === "lastWeek") {
      const thisWeekStart = new Date(istNow);
      thisWeekStart.setDate(thisWeekStart.getDate() - mondayOffset);
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(thisWeekStart);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
      return { startDate: toYMDInIST(lastWeekStart), endDate: toYMDInIST(lastWeekEnd) };
    }

    if (filter === "thisMonth") {
      const y = istNow.getFullYear();
      const m = istNow.getMonth();
      const monthStart = new Date(y, m, 1);
      return { startDate: toYMDInIST(monthStart), endDate: toYMDInIST(end) };
    }

    if (filter === "lastMonth") {
      const y = istNow.getFullYear();
      const m = istNow.getMonth();
      const monthStart = new Date(y, m - 1, 1);
      const monthEnd = new Date(y, m, 0);
      return { startDate: toYMDInIST(monthStart), endDate: toYMDInIST(monthEnd) };
    }

    return {};
  };

  useEffect(() => {

    const timer = setTimeout(async () => {

      setLoading(true);

      try {

        const params = {
          page,
          limit,
          ...getISTDateRange(timeFilter),
          ...(search ? { q: search } : {})
        };

        console.log("[Dashboard] fetching visits with params:", params);
        const res = await getVisits(params);
        console.log("[Dashboard] raw response:", res);

        const rows = Array.isArray(res) ? res : (res?.data || []);
        const totalCount = Array.isArray(res) ? rows.length : (res?.total || 0);

        setVisits(rows);
        setTotal(totalCount);
        console.log("[Dashboard] rows loaded:", rows.length, "total:", totalCount);

      } catch (error) {
        console.error("[Dashboard] failed to load visits:", error);
      } finally {

        setLoading(false);

      }

    }, 300);

    return () => clearTimeout(timer);

  }, [search, page, timeFilter]);

  const handleCheckout = async (id) => {

    await checkoutVisit(id);

    console.log("[Dashboard] checkout success for visit id:", id);
    const refreshed = await getVisits({ page, limit });
    const rows = Array.isArray(refreshed) ? refreshed : (refreshed?.data || []);
    const totalCount = Array.isArray(refreshed) ? rows.length : (refreshed?.total || 0);
    setVisits(rows);
    setTotal(totalCount);
    console.log("[Dashboard] refreshed rows:", rows.length, "total:", totalCount);

  };

  const formatDateTime = (value) => {

    if (!value) return "--";
    const raw = String(value);
    const hasTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(raw);
    const normalized = hasTimezone ? raw : `${raw}Z`;
    const parsed = new Date(normalized);

    if (Number.isNaN(parsed.getTime())) return "--";

    return parsed.toLocaleString("en-GB", {
      timeZone: IST_TZ,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).toLowerCase();

  };

  return (

    <div className="bg-gradient-to-br from-slate-100 to-slate-200 py-2">

      <Card className="w-full max-w-6xl mx-auto rounded-3xl shadow-2xl">

        <CardContent className="p-10 space-y-6">

          <div className="flex justify-between items-center">

            <h2 className="text-3xl font-bold">
              Visitor Dashboard
            </h2>

            <Button variant="outline" onClick={() => setScreen("home")}>
              Back
            </Button>

          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <Input
              placeholder="Search name / phone"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="h-14 text-lg md:flex-1"
            />

            <div className="flex items-center gap-2 shrink-0">
              <p className="text-sm text-gray-600 whitespace-nowrap">Time Filter</p>
              <select
                value={timeFilter}
                onChange={(e) => {
                  setPage(1);
                  setTimeFilter(e.target.value);
                }}
                className="h-14 text-lg border rounded-md px-3 bg-white min-w-[170px]"
              >
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="thisWeek">This Week</option>
                <option value="lastWeek">Last Week</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
              </select>
            </div>
          </div>

          {loading && (
            <p className="text-sm text-gray-500">
              Loading visits...
            </p>
          )}

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-100">

                <tr>

                  <th className="p-3 text-left">Photo</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Company</th>
                  <th className="p-3 text-left">Phone</th>
                  <th className="p-3 text-left">Purpose</th>
                  <th className="p-3 text-left">Person</th>
                  <th className="p-3 text-left">Check In</th>
                  <th className="p-3 text-left">Check Out</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Action</th>

                </tr>

              </thead>

              <tbody>

                {visits.map((row) => (

                  <tr key={row._id} className="border-b">

                    <td className="p-3">

                      {row.photoUrl ? (

                        <img
                          src={row.photoUrl}
                          className="h-10 w-10 rounded object-cover cursor-pointer"
                          onClick={() => setZoomImage(row.photoUrl)}
                        />

                      ) : "--"}

                    </td>

                    <td className="p-3">{row.name}</td>
                    <td className="p-3">{row.company || "--"}</td>
                    <td className="p-3">{row.phone}</td>
                    <td className="p-3">{row.purpose}</td>
                    <td className="p-3">{row.personToMeet}</td>
                    <td className="p-3 whitespace-nowrap">{formatDateTime(row.checkInTime)}</td>
                    <td className="p-3 whitespace-nowrap">{formatDateTime(row.checkOutTime)}</td>
                    <td className="p-3">{row.status}</td>

                    <td className="p-3">

                      {row.status === "active" ? (

                        <Button
                          variant="outline"
                          onClick={() => handleCheckout(row._id)}
                        >
                          Check Out
                        </Button>

                      ) : "--"}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          <div className="flex justify-between items-center">

            <Button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Prev
            </Button>

            <span>
              Page {page} / {totalPages}
            </span>

            <Button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>

          </div>

        </CardContent>

      </Card>

      {zoomImage && (

        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setZoomImage(null)}
        >

          <img
            src={zoomImage}
            className="max-h-[90vh] max-w-[90vw] rounded shadow-lg"
          />

        </div>

      )}

    </div>

  );

}