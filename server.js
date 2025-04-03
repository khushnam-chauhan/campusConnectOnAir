require("dotenv").config();
const express = require("express");
const path= require('path');
const cors = require("cors");
const connectDb = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const profileRoutes = require("./routes/profileRoutes");
const userRoutes = require("./routes/userRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const app = express();

// Middleware

app.use(cors({
  origin: ["https://campusconnectkrmu.vercel.app", "https://campusconnect-test.onrender.com","https://campusconnectkrmu.onrender.com","http://localhost:5173/"], // Allow multiple origins
  methods: "GET, POST, PUT, DELETE, PATCH",
  allowedHeaders: "Content-Type, Authorization"
}));


// Handle preflight requests (important for PATCH, DELETE)
app.use((req, res, next) => {
  const allowedOrigins = ["https://campusconnectkrmu.vercel.app", "https://campusconnect-test.onrender.com"];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
      return res.sendStatus(204);
  }

  next();
});


  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  

// Static file serving
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/admin", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/applications", applicationRoutes);
// Connect DB
connectDb();

// Root API
app.get("/", (req, res) => {
    res.send("API connected...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));