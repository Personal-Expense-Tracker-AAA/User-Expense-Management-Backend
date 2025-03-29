const express = require("express");
const router = express.Router();
const pool = require("../helpers/database");

// Add an expense (POST)
router.post("/", async (req, res) => {
  try {
    const { description, amount, category } = req.body;
    if (!description || !amount || !category) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await pool.query(
      "INSERT INTO expenses (description, amount, category) VALUES ($1, $2, $3) RETURNING *",
      [description, amount, category]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all expenses (GET)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM expenses ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get total expenses grouped by category
router.get("/category-summary", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT category, SUM(amount) AS total FROM expenses GROUP BY category ORDER BY total DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching category-wise totals:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
