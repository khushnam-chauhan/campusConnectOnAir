const express = require("express");
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const { 
  completeProfile, 
  getProfile,
  uploadProfilePhoto,
  uploadResume,
  updateProfile
} = require("../controllers/profileController");
const User = require("../models/User"); // Add this to fetch user by ID

const router = express.Router();

// Consolidated Multer Configuration for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

// Define file fields for profile endpoints
const fileFields = [
  { name: "profilePhoto", maxCount: 1 },
  { name: "resume", maxCount: 1 }
];

for (let i = 0; i < 10; i++) {
  fileFields.push({ name: `certificationImage-${i}`, maxCount: 1 });
}

// Routes
router.get("/me", protect, getProfile);
router.put("/complete", protect, upload.fields(fileFields), completeProfile);
router.post("/update", protect, upload.fields(fileFields), updateProfile);
router.post("/upload-photo", protect, upload.single("profilePhoto"), uploadProfilePhoto);
router.post("/upload-resume", protect, upload.single("resume"), uploadResume);

// New route for admin to fetch any user's profile by ID
router.get("/user/:userId", protect, async (req, res) => {
  try {
    // Check if the requester is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    const user = await User.findById(req.params.userId)
      .select("-password") // Exclude password
      .lean(); // Convert to plain JS object
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;