const express = require("express");
const { body, validationResult } = require("express-validator"); //import body from express-validator
const router = express.Router();
const pool = require("../helpers/database");

// Validation and sanitization middleware
const validateExpense = [
  body("description")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Description is required"),
  body("amount")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number"),
  body("category")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Category is required"),
];

// Add an expense (POST) with validation
router.post("/", validateExpense, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { description, amount, category } = req.body;

  try {
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
// Update an expense (PUT)
router.put("/:id", validateExpense, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { description, amount, category } = req.body;
  const expenseId = req.params.id;

  try {
    const result = await pool.query(
      "UPDATE expenses SET description = $1, amount = $2, category = $3 WHERE id = $4 RETURNING *",
      [description, amount, category, expenseId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete an expense by ID (DELETE)
router.delete("/:id", async (req, res) => {
  const expenseId = req.params.id;

  try {
    const result = await pool.query(
      "DELETE FROM expenses WHERE id = $1 RETURNING *",
      [expenseId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
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
// Get total expenses (GET)
router.get("/total", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT SUM(amount) AS total FROM expenses"
    );
    // If no expenses, return 0
    res.json({ total: result.rows[0].total || 0 });
  } catch (error) {
    console.error("Error fetching total expenses:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update an expense (PUT)
/*router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, category } = req.body;

    if (!description || !amount || !category) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await pool.query(
      "UPDATE expenses SET description = $1, amount = $2, category = $3 WHERE id = $4 RETURNING *",
      [description, amount, category, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ error: "Server error" });
  }
});
*/

// Get total expenses (GET)
/*router.get("/total", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT SUM(amount) AS total FROM expenses"
    );
    res.json({ total: result.rows[0].total || 0 });
  } catch (error) {
    console.error("Error fetching total expenses:", error);
    res.status(500).json({ error: "Server error" });
  }
});
*/
module.exports = router;
