const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { supabase } = require("../lib/supabase");
const { sendPasswordResetEmail } = require("../lib/mailer");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";
const REGISTER_API_KEY = process.env.REGISTER_API_KEY;
const FRONTEND_RESET_BASE_URL = process.env.CLIENT_ORIGIN || "http://localhost:5173";

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment");
}

router.post("/register", async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (!REGISTER_API_KEY || apiKey !== REGISTER_API_KEY) {
      return res.status(403).json({ message: "Forbidden: invalid API key" });
    }

    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: "email, password and name are required" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "password must be at least 6 characters" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const passwordHash = await bcrypt.hash(String(password), 10);

    const { data, error } = await supabase
      .from("app_users")
      .insert({
        email: normalizedEmail,
        name: String(name).trim(),
        password_hash: passwordHash
      })
      .select("id, email, name, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ message: "User already exists" });
      }
      return next(error);
    }

    return res.status(201).json({ user: data });
  } catch (error) {
    console.log("Error in register:", error);
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const { data: user, error } = await supabase
      .from("app_users")
      .select("id, email, name, password_hash")
      .eq("email", normalizedEmail)
      .single();

    if (error && error.code !== "PGRST116") return next(error);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(String(password), user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.log("Error in login:", error);
    return next(error);
  }
});

router.post("/logout", (req, res) => {
  return res.status(204).send();
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const { data: user, error } = await supabase
      .from("app_users")
      .select("id, email")
      .eq("email", normalizedEmail)
      .single();

    if (error && error.code !== "PGRST116") return next(error);

    // Do not reveal whether email exists
    if (!user) {
      return res.json({ message: "If this email is registered, reset link has been sent." });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from("app_users")
      .update({
        reset_token_hash: tokenHash,
        reset_token_expires_at: expiresAt
      })
      .eq("id", user.id);

    if (updateError) return next(updateError);

    const resetUrl = `${FRONTEND_RESET_BASE_URL}/?resetToken=${encodeURIComponent(rawToken)}`;
    await sendPasswordResetEmail({ to: user.email, resetUrl });

    return res.json({ message: "If this email is registered, reset link has been sent." });
  } catch (error) {
    console.log("Error in forgot-password:", error);
    return next(error);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: "token and newPassword are required" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "password must be at least 6 characters" });
    }

    const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
    const nowIso = new Date().toISOString();

    const { data: user, error } = await supabase
      .from("app_users")
      .select("id, reset_token_expires_at")
      .eq("reset_token_hash", tokenHash)
      .single();

    if (error && error.code !== "PGRST116") return next(error);
    if (!user || !user.reset_token_expires_at || user.reset_token_expires_at <= nowIso) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);

    const { error: updateError } = await supabase
      .from("app_users")
      .update({
        password_hash: passwordHash,
        reset_token_hash: null,
        reset_token_expires_at: null
      })
      .eq("id", user.id);

    if (updateError) return next(updateError);
    return res.json({ message: "Password reset successful" });
  } catch (error) {
    console.log("Error in reset-password:", error);
    return next(error);
  }
});

module.exports = router;
