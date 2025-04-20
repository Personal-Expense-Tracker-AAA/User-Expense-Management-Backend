require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const authRoutes = require("./routes/auth");
const expenseRoutes = require("./routes/expense");

const app = express();
const PORT = process.env.PORT || 5000;


// Middleware setup (order matters!)


app.use(
  cors({
    origin: [
      "http://localhost:5500",
      "http://127.0.0.1:5500", // Alternative localhost
    
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(bodyParser.json());

//app.use(cors({ /* your config */ }));

// Authentication middleware
const authenticate = (req, res, next) => {
  // Handle preflight requests
  if (req.method === "OPTIONS") return next();
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Routes
app.use("/auth", authRoutes);
app.use("/expenses", authenticate, expenseRoutes); // Protected routes

// Server startup with error handling
const server = app
  .listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`Port ${PORT} in use, trying port ${Number(PORT) + 1}...`);
      app.listen(Number(PORT) + 1);
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down server...");
  server.close(() => {
    console.log("Server stopped");
    process.exit(0);
  });
});
