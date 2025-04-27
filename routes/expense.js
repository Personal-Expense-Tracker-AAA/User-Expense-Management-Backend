const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const pool = require("../helpers/database");
const { authenticateUser } = require("../helpers/auth");

// Protect all routes below this
router.use(authenticateUser);

// VALIDATION MIDDLEWARE =============================================
// Validates and sanitizes expense input data
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

// CRUD OPERATIONS ==================================================

/**
 * @route POST /expenses
 * @desc Create new expense
 * @access Private
 */
router.post("/", validateExpense, async (req, res) => {
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Destructure validated data// pulling out these 3 fields from the request body.
   const { description, amount, category } = req.body;

    // Create new expense with user association
    const result = await pool.query(
      `INSERT INTO expenses 
       (description, amount, category, user_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [description, amount, category, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("[EXPENSE CREATE ERROR]", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route PUT /expenses/:id
 * @desc Update existing expense
 * @access Private
 */
router.put("/:id", validateExpense, async (req, res) => {
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Get expense ID and validated data
    const expenseId = req.params.id;
    const { description, amount, category } = req.body;

    // Update expense with user verification
    const result = await pool.query(
      `UPDATE expenses 
       SET description = $1, amount = $2, category = $3 
       WHERE id = $4 AND user_id = $5 
       RETURNING *`,
      [description, amount, category, expenseId, req.user.id]
    );

    // Handle not found
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("[EXPENSE UPDATE ERROR]", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route DELETE /expenses/:id
 * @desc Delete existing expense
 * @access Private
 */
router.delete("/:id", async (req, res) => {
  try {
    const expenseId = req.params.id;

    // Delete expense with user verification
    const result = await pool.query(
      `DELETE FROM expenses 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [expenseId, req.user.id]
    );

    // Handle not found
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("[EXPENSE DELETE ERROR]", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DATA RETRIEVAL ===================================================

/**
 * @route GET /expenses
 * @desc Get all expenses for current user
 * @access Private
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM expenses 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("[EXPENSES FETCH ERROR]", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route GET /expenses/category-summary
 * @desc Get category-wise expense summary
 * @access Private
 */
router.get("/category-summary", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT category, SUM(amount) AS total 
       FROM expenses 
       WHERE user_id = $1 
       GROUP BY category 
       ORDER BY total DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("[CATEGORY SUMMARY ERROR]", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route GET /expenses/total
 * @desc Get total expenses for current user
 * @access Private
 */
router.get("/total", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT SUM(amount) AS total 
       FROM expenses 
       WHERE user_id = $1`,
      [req.user.id]
    );

    // Handle empty results
    const total = result.rows[0].total || 0;
    res.json({ total: parseFloat(total).toFixed(2) });
  } catch (error) {
    console.error("[TOTAL EXPENSES ERROR]", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route GET /expenses/filter
 * @desc Filter expenses by category and date range
 * @access Private
 */
router.get("/filter", async (req, res) => {
  const { category, startDate, endDate } = req.query;
  const userId = req.user.id;

  let query = `SELECT * FROM expenses WHERE user_id = $1`;
  const values = [userId];
  let count = 2;

  if (category) {
    query += ` AND category = $${count++}`;
    values.push(category);
  }
  if (startDate) {
    query += ` AND date >= $${count++}`;
    values.push(startDate);
  }
  if (endDate) {
    query += ` AND date <= $${count++}`;
    values.push(endDate);
  }

  try {
    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (error) {
    console.error("[FILTER EXPENSES ERROR]", error);
    res.status(500).json({ error: "Failed to fetch filtered expenses" });
  }
});

module.exports = router;
