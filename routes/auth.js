const express = require("express");
const router = express.Router();
const pool = require("../helpers/database");
const {
  generateToken,
  hashPassword,
  comparePassword,
} = require("../helpers/auth");
const { body, validationResult } = require("express-validator");

// Signup
router.post(
  "/signup",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
  ],
  async (req, res) => {
    // Log the incoming request body
    console.log("Signup body received:", req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation failed:", errors.array()); // Log validation errors
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      const hashedPassword = await hashPassword(password);
      // Check if user already exists
      const existingUser = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );
      if (existingUser.rows.length > 0) {
        return res.status(400).json({  success: false,
          error: "email_exists",
          message: "Email already exists" });
      }
      const result = await pool.query(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *",
        [email, hashedPassword]
      );
      res.json({ token: generateToken(result.rows[0]) });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ error: "Registration failed" });
    }
  }
);

// Login
router.post("/login", async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const { email, password } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (user.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        error: "Login failed",
        message: "No account found with this email"
      });
    }

    const passwordValid = await comparePassword(password, user.rows[0].password_hash);
    if (!passwordValid) {
      return res.status(401).json({ 
        success: false,
        error: "Login failed",
        message: "Incorrect password"
      });
    }

    res.json({ 
      success: true,
      token: generateToken(user.rows[0])
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      error: "Server error",
      message: "An unexpected error occurred"
    });
  }
});

// Add password reset routes here...

module.exports = router;
