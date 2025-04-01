const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");
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

module.exports = router;
