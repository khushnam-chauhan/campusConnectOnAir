const express = require("express");
const { 
  registerUser, 
  loginUser, 
  verifyEmail, 
  resendVerification 
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { check } = require("express-validator");

const router = express.Router();

router.post(
  "/register",
  [
    check("fullName", "Full name is required").not().isEmpty(),
    check("rollNo", "Roll No is required").not().isEmpty(),
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Password must be at least 6 characters").isLength({ min: 6 }),
  ],
  registerUser
);

router.post("/login", loginUser);

router.post("/verify-email", verifyEmail);

// New GET route to process verification directly
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }
  try {
    // Call verifyEmail and capture the response
    await verifyEmail({ body: { token } }, {
      status: (code) => ({
        json: (data) => {
          if (code === 200) {
            // Redirect to frontend with JWT in query or handle differently
            const redirectUrl = `https://campusconnectkrmu.onrender.com/login?auth-Container`;
            return res.redirect(redirectUrl);
          }
          return res.status(code).json(data);
        },
      }),
    });
  } catch (error) {
    console.error("Error in GET /api/auth/verify-email:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
router.post("/resend-verification", resendVerification);

router.get("/me", protect, (req, res) => {
  res.json({
    id: req.user._id,
    role: req.user.role,
    email: req.user.email,
    fullName: req.user.fullName,
  });
});

module.exports = router;