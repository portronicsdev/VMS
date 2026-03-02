import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkoutVisit, getVisits } from "@/lib/api";

export default function Dashboard({ setScreen }) {
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("today");
  const [purpose, setPurpose] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const purposes = ["official", "personal", "interview", "delivery"];

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getPresetRange = () => {
    const today = new Date();
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const todayStart = startOfDay(today);

    if (timeFilter === "today") {
      return { start: todayStart, end: todayStart };
    }
    if (timeFilter === "yesterday") {
      const y = new Date(todayStart);
      y.setDate(y.getDate() - 1);
      return { start: y, end: y };
    }
    if (timeFilter === "thisWeek") {
      const dayIndex = (todayStart.getDay() + 6) % 7;
      const start = new Date(todayStart);
      start.setDate(start.getDate() - dayIndex);
      return { start, end: todayStart };
    }
    if (timeFilter === "lastWeek") {
      const dayIndex = (todayStart.getDay() + 6) % 7;
      const startThisWeek = new Date(todayStart);
      startThisWeek.setDate(startThisWeek.getDate() - dayIndex);
      const start = new Date(startThisWeek);
      start.setDate(start.getDate() - 7);
      const end = new Date(startThisWeek);
      end.setDate(end.getDate() - 1);
      return { start, end };
    }
    if (timeFilter === "thisMonth") {
      const start = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
      return { start, end: todayStart };
    }
    if (timeFilter === "lastMonth") {
      const start = new Date(todayStart.getFullYear(), todayStart.getMonth() - 1, 1);
      const end = new Date(todayStart.getFullYear(), todayStart.getMonth(), 0);
      return { start, end };
    }
    return null;
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setMessage("");
      setVisits([]);
      try {
        const params = {};
        if (search) params.q = search;
        if (purpose) params.purpose = purpose;

        if (timeFilter === "custom") {
          if (customStart) params.startDate = customStart;
          if (customEnd) params.endDate = customEnd;
        } else {
          const range = getPresetRange();
          if (range) {
            params.startDate = formatLocalDate(range.start);
            params.endDate = formatLocalDate(range.end);
          }
        }

        const data = await getVisits(params);
        setVisits(data);
      } catch (error) {
        setMessage(error.message || "Unable to load visits.");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, timeFilter, customStart, customEnd, purpose]);

  const handleCheckout = async (id) => {
    try {
      await checkoutVisit(id);
      const refreshed = await getVisits();
      setVisits(refreshed);
    } catch (error) {
      setMessage(error.message || "Unable to checkout visitor.");
    }
  };

  const formatTime = (value) => {
    if (!value) return "--";

    return new Date(value).toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "--";

    return new Date(value).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  return (
    <Card className="rounded-2xl shadow-lg">
      <CardContent className="p-6">
        <Button variant="outline" onClick={() => setScreen("home")}>Back</Button>

        <h2 className="text-2xl font-semibold mb-4">Visitors</h2>

        <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
          <div className="flex-1 min-w-[240px]">
            <p className="text-sm text-gray-600 mb-1">Search</p>
            <Input
              placeholder="Name, phone, or person"
              value={search}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d+$/.test(value)) {
                  setSearch(value.slice(0, 10));
                } else {
                  setSearch(value);
                }
              }}
              className="h-12 text-lg"
            />
          </div>
          <div className="w-full md:w-56">
            <p className="text-sm text-gray-600 mb-1">Time</p>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full h-12 border rounded-md px-3 text-lg bg-white"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="thisWeek">This Week</option>
              <option value="lastWeek">Last Week</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="w-full md:w-56">
            <p className="text-sm text-gray-600 mb-1">Purpose</p>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full h-12 border rounded-md px-3 text-lg bg-white"
            >
              <option value="">All</option>
              {purposes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
        {timeFilter === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">From</p>
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-12 text-lg"
              />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">To</p>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-12 text-lg"
              />
            </div>
          </div>
        )}
        {loading && <p className="text-sm text-gray-500 mb-3">Loading visits...</p>}
        {message && <p className="text-sm text-gray-600 mb-3">{message}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-2">Name</th>
                <th className="p-2">Phone</th>
                <th className="p-2">Purpose</th>
                <th className="p-2">Person</th>
                <th className="p-2">In</th>
                <th className="p-2">Out</th>
                <th className="p-2">Status</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((row) => (
                <tr key={row._id} className="border-b">
                  <td className="p-2">{row.name}</td>
                  <td className="p-2">{row.phone}</td>
                  <td className="p-2">{row.purpose}</td>
                  <td className="p-2">{row.personToMeet}</td>
                  <td className="p-2">{formatDateTime(row.checkInTime)}</td>
                  <td className="p-2">{formatDateTime(row.checkOutTime)}</td>
                  <td className="p-2">{row.status}</td>
                  <td className="p-2">
                    {row.status === "active" ? (
                      <Button variant="outline" onClick={() => handleCheckout(row._id)}>
                        Check Out
                      </Button>
                    ) : (
                      <span className="text-sm text-gray-500">--</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && visits.length === 0 && (
            <p className="text-sm text-gray-500 mt-3">No visits found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}