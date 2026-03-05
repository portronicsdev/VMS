import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkoutVisit, getVisits } from "@/lib/api";

export default function Dashboard({ setScreen }) {

  const [search, setSearch] = useState("");
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {

    const timer = setTimeout(async () => {

      setLoading(true);

      try {

        const res = await getVisits({
          page,
          limit,
          ...(search ? { q: search } : {})
        });

        setVisits(res.data || []);
        setTotal(res.total || 0);

      } finally {

        setLoading(false);

      }

    }, 300);

    return () => clearTimeout(timer);

  }, [search, page]);

  const handleCheckout = async (id) => {

    await checkoutVisit(id);

    const refreshed = await getVisits({ page, limit });

    setVisits(refreshed.data || []);

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

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-6">

      <Card className="w-full max-w-6xl rounded-3xl shadow-2xl">

        <CardContent className="p-10 space-y-6">

          <div className="flex justify-between items-center">

            <h2 className="text-3xl font-bold">
              Visitor Dashboard
            </h2>

            <Button variant="outline" onClick={() => setScreen("home")}>
              Back
            </Button>

          </div>

          <Input
            placeholder="Search name / phone"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="h-14 text-lg"
          />

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