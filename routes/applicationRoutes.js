const express = require("express");
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware"); 
const Application = require("../models/Application");
const Job = require("../models/Job");

const router = express.Router();

// Multer setup for resume upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, DOCX files are allowed"));
    }
  },
});

// Apply for a job
router.post("/", protect, upload.single("resume"), async (req, res) => {
  try {
    const { jobId, fullName, email, phone } = req.body;

    // Check if job exists and is approved
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.status !== "approved") return res.status(403).json({ message: "Job not approved yet" });
    if (job.expiryDate && new Date(job.expiryDate) < new Date()) {
      return res.status(403).json({ message: "Job application period has expired" });
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({ userId: req.user._id, jobId });
    if (existingApplication) return res.status(400).json({ message: "You have already applied for this job" });

    const resume = `/uploads/${req.file.filename}`;
    const application = new Application({
      userId: req.user._id,
      jobId,
      fullName,
      email,
      phone,
      resume,
    });

    await application.save();
    res.status(201).json({ message: "Application submitted successfully! Mazze karo!" });
  } catch (error) {
    console.error("Error applying for job:", error);
    res.status(500).json({ message: "Server error, bhai kuch gadbad ho gaya!" });
  }
});

// Get user's applications (for My Applications page)
router.get("/my-applications", protect, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user._id })
      .populate("jobId", "profiles companyName ctcOrStipend location offerType");
    res.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get applications for a job (for Admin)
router.get("/:jobId", protect, async (req, res) => {
  try {
    const applications = await Application.find({ jobId: req.params.jobId })
      .populate("userId", "fullName email phone");
    res.json(applications);
  } catch (error) {
    console.error("Error fetching job applications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;