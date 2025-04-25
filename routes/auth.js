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
<<<<<<< HEAD
      return res.status(400).json({ errors: errors.array() });
    }
=======
      console.log("Validation failed:", errors.array()); // Log validation errors
      return res.status(400).json({ errors: errors.array() });
    }

>>>>>>> 38b81d6d97fa8cbb4f5075667c06ad41756bfed0
    try {
      const { email, password } = req.body;
      const hashedPassword = await hashPassword(password);
      const result = await pool.query(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *",
        [email, hashedPassword]
      );
      res.json({ token: generateToken(result.rows[0]) });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ error: "User already exists" });
    }
  }
);

// Login
router.post("/login", async (req, res) => {
  try {
    console.log("Request body:", req.body); // Debugging line
    const { email, password } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (
      user.rows.length === 0 ||
      !(await comparePassword(password, user.rows[0].password_hash))
    ) {
      console.log("Login failed. Found user?", user.rows.length > 0);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ token: generateToken(user.rows[0]) });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Add password reset routes here...

module.exports = router;
