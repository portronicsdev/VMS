import React, { useState } from "react";
import Home from "./pages/Home";
import CheckIn from "./pages/Checkin";
import CheckOut from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";

export default function VisitorApp() {
  const [screen, setScreen] = useState("home");

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {screen === "home" && <Home setScreen={setScreen} />}
        {screen === "checkin" && <CheckIn setScreen={setScreen} />}
        {screen === "checkout" && <CheckOut setScreen={setScreen} />}
        {screen === "dashboard" && <Dashboard setScreen={setScreen} />}
      </div>
    </div>
  );
}