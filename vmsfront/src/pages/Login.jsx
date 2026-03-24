import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPassword, login, resetPassword } from "@/lib/api";

export default function Login({ onLoginSuccess, notice = "" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const resetToken = new URLSearchParams(window.location.search).get("resetToken");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setSubmitting(true);
      const data = await login(email, password);
      onLoginSuccess(data?.user || null);
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    if (!email) {
      setError("Enter your email.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await forgotPassword(email);
      setInfo(res?.message || "If this email is registered, reset link has been sent.");
    } catch (err) {
      setError(err.message || "Unable to send reset email.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    if (!newPassword) {
      setError("Enter new password.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await resetPassword(resetToken, newPassword);
      setInfo(res?.message || "Password reset successful. Please login.");
      setNewPassword("");
      window.history.replaceState({}, "", window.location.pathname);
    } catch (err) {
      setError(err.message || "Unable to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-lg">
        <CardContent className="p-6 space-y-5">
          {notice && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {notice}
            </div>
          )}
          <div className="flex flex-col items-center text-center">
            <img
              src="/logo192.png"
              alt="VMS logo"
              className="h-16 w-16 rounded-xl mb-3"
            />
            <h1 className="text-2xl font-semibold">Visitor Management System</h1>
          </div>

          {resetToken ? (
            <form className="space-y-4" onSubmit={handleReset}>
              <div className="space-y-2">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="text-xs text-gray-600 underline"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                >
                  {showNewPassword ? "Hide password" : "Show password"}
                </button>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {info && <p className="text-sm text-green-700">{info}</p>}
              <Button className="w-full" type="submit" disabled={submitting}>
                {submitting ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={showForgot ? handleForgot : handleSubmit}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {!showForgot && (
              <div className="space-y-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="text-xs text-gray-600 underline"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide password" : "Show password"}
                </button>
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {info && <p className="text-sm text-green-700">{info}</p>}
            <Button className="w-full" type="submit" disabled={submitting}>
              {showForgot ? (submitting ? "Sending..." : "Send Reset Link") : (submitting ? "Signing in..." : "Login")}
            </Button>
            <button
              type="button"
              className="w-full text-sm text-gray-600 underline"
              onClick={() => {
                setShowForgot((prev) => !prev);
                setError("");
                setInfo("");
              }}
            >
              {showForgot ? "Back to Login" : "Forgot Password?"}
            </button>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
