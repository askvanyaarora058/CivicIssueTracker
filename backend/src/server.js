const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const issueRoutes = require("./routes/issueRoutes");
const authenticateToken = require("./middleware/authMiddleware");

const app = express();

// CORS
app.use(cors({
    origin: "https://civicissuetracker.onrender.com",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204
}));

app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.json({
        message: "Civic Issue Tracker API is running"
    });
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Server is healthy"
    });
});

// Protected test route
app.get("/api/protected", authenticateToken, (req, res) => {
    res.json({
        message: "You accessed a protected route!",
        user: req.user
    });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});