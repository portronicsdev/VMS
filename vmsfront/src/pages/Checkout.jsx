import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkoutVisit, getVisits } from "@/lib/api";

export default function CheckOut({ setScreen }) {

  const [phone, setPhone] = useState("");
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {

    const timer = setTimeout(async () => {

      setLoading(true);
      setMessage("");

      try {

        const data = await getVisits();
        let list = Array.isArray(data) ? data : data?.data || [];

        list = list.filter(v => v.status === "active");

        if (phone) {
          list = list.filter(v => v.phone.includes(phone));
        }

        setVisitors(list);

      } catch (error) {

        setMessage(error.message || "Unable to load visitors.");

      } finally {

        setLoading(false);

      }

    }, 300);

    return () => clearTimeout(timer);

  }, [phone]);

  const handleCheckout = async (id) => {

    try {

      await checkoutVisit(id);

      const refreshed = await getVisits();
      let list = Array.isArray(refreshed) ? refreshed : refreshed?.data || [];

      list = list.filter(v => v.status === "active");

      if (phone) {
        list = list.filter(v => v.phone.includes(phone));
      }

      setVisitors(list);

    } catch (error) {

      setMessage(error.message || "Unable to checkout visitor.");

    }

  };

  const formatDateTime = (value) => {

    if (!value) return "--";

    return new Date(value).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

  };

  return (

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-6">

      <Card className="w-full max-w-4xl rounded-3xl shadow-2xl">

        <CardContent className="p-10 space-y-6">

          <div className="flex justify-between items-center">

            <h2 className="text-3xl font-bold">
              Visitor Check-Out
            </h2>

            <Button variant="outline" onClick={() => setScreen("home")}>
              Back
            </Button>

          </div>

          <Input
            placeholder="Search by Phone"
            value={phone}
            maxLength={10}
            inputMode="numeric"
            onChange={(e) =>
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            className="text-xl p-5 max-w-md"
          />

          {loading && (
            <p className="text-sm text-gray-500">
              Loading active visitors...
            </p>
          )}

          {message && (
            <p className="text-sm text-gray-600">
              {message}
            </p>
          )}

          <div className="space-y-3">

            {visitors.map((v) => (

              <div
                key={v._id}
                className="flex items-center justify-between bg-white border rounded-xl p-4 shadow-sm"
              >

                <div className="flex items-center gap-4">

                  {v.photoUrl ? (

                    <img
                      src={v.photoUrl}
                      className="h-14 w-14 rounded-lg object-cover"
                    />

                  ) : (

                    <div className="h-14 w-14 rounded-lg bg-gray-200" />

                  )}

                  <div>

                    <p className="font-semibold text-lg">
                      {v.name}
                    </p>

                    <p className="text-sm text-gray-500 whitespace-nowrap">
                      {formatDateTime(v.checkInTime)}
                    </p>

                  </div>

                </div>

                <Button
                  className="h-12 text-lg"
                  onClick={() => handleCheckout(v._id)}
                >
                  Check Out
                </Button>

              </div>

            ))}

            {!loading && visitors.length === 0 && (

              <p className="text-sm text-gray-500">
                No active visitors.
              </p>

            )}

          </div>

        </CardContent>

      </Card>

    </div>

  );

}