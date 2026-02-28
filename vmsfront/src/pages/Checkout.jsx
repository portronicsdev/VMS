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
        const data = await getVisits({
          status: "active",
          ...(phone ? { phone } : {})
        });
        setVisitors(data);
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
      const refreshed = await getVisits({ status: "active", ...(phone ? { phone } : {}) });
      setVisitors(refreshed);
    } catch (error) {
      setMessage(error.message || "Unable to checkout visitor.");
    }
  };

  const formatTime = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className="rounded-2xl shadow-lg">
      <CardContent className="p-6 space-y-4">
        <Button variant="outline" onClick={() => setScreen("home")}>Back</Button>

        <h2 className="text-2xl font-semibold">Check Out</h2>

        <Input
          placeholder="Enter Phone Number"
          value={phone}
          maxLength={10}
          inputMode="numeric"
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          className="text-lg p-4"
        />
        {loading && <p className="text-sm text-gray-500">Loading active visitors...</p>}
        {message && <p className="text-sm text-gray-600">{message}</p>}

        <h3 className="text-lg font-semibold">Recent Visitors</h3>
        <div className="space-y-2">
          {visitors.map((v) => (
            <div key={v._id} className="flex justify-between items-center border p-2 rounded">
              <div>
                <p className="font-medium">{v.name}</p>
                <p className="text-sm text-gray-500">{formatTime(v.checkInTime)}</p>
              </div>
              <Button onClick={() => handleCheckout(v._id)}>Check Out</Button>
            </div>
          ))}
          {!loading && visitors.length === 0 && (
            <p className="text-sm text-gray-500">No active visitors.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}