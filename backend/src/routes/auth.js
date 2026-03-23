const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { supabase } = require("../lib/supabase");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";
const REGISTER_API_KEY = process.env.REGISTER_API_KEY;

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
    return next(error);
  }
});

router.post("/logout", (req, res) => {
  return res.status(204).send();
});

module.exports = router;
