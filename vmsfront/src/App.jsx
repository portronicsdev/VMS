import React, { useState } from "react";
import { useEffect } from "react";
import Home from "./pages/Home";
import CheckIn from "./pages/Checkin";
import CheckOut from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { clearAuth, getAuthToken, getAuthUser } from "@/lib/api";

export default function VisitorApp() {
  const [screen, setScreen] = useState("home");
  const [user, setUser] = useState(() =>
    getAuthToken() ? getAuthUser() : null
  );
  const [authNotice, setAuthNotice] = useState("");

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setScreen("home");
  };

  useEffect(() => {
    let timer = null;
    const onAuthLogout = (event) => {
      const message = event?.detail?.message || "Session expired. Please login again.";
      setAuthNotice(message);
      clearAuth();
      setUser(null);
      setScreen("home");
      timer = setTimeout(() => {
        setAuthNotice("");
      }, 2500);
    };
    window.addEventListener("vms:auth-logout", onAuthLogout);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("vms:auth-logout", onAuthLogout);
    };
  }, []);

  if (!user) {
    return <Login onLoginSuccess={setUser} notice={authNotice} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto pt-2">
        {/* Header */}
        <div className="relative flex items-center justify-center mb-2">
          {/* Center: Logo + Title */}
          <div className="flex items-center gap-2">
            <img
              src="/logo192.png"
              alt="VMS logo"
              className="h-10 w-10 rounded-lg"
            />
            <span className="font-semibold text-gray-800 text-xl">
              Visitor Management System
            </span>
          </div>

          {/* Right: Logout */}
          <button
            type="button"
            className="absolute right-0 text-sm text-gray-600 hover:text-gray-900 underline"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        {/* Screens */}
        {screen === "home" && <Home setScreen={setScreen} />}
        {screen === "checkin" && <CheckIn setScreen={setScreen} />}
        {screen === "checkout" && <CheckOut setScreen={setScreen} />}
        {screen === "dashboard" && <Dashboard setScreen={setScreen} />}
      </div>
    </div>
  );
}