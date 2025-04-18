const User = require("../models/User");


exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure experience is always an array with at least one item
    let experiences = user.experience || [];
    if (!Array.isArray(experiences) || experiences.length === 0) {
      experiences = [{
        hasExperience: false,
        organizationName: "",
        duration: "",
        details: "",
      }];
    }

    const mappedUser = {
      _id: user._id,
      fullName: user.fullName || "",
      email: user.email || "",
      rollNo: user.rollNo || "",
      mobileNo: user.mobileNo || "",
      whatsappNo: user.whatsappNo || "",
      mailId: user.mailId || "",
      fatherName: user.fatherName || "",
      fatherNumber: user.fatherNumber || "",
      school: user.school || "",
      existingBacklogs: user.existingBacklogs || "",
      areaOfInterest: user.areaOfInterest || "",
      readyToRelocate: user.readyToRelocate || false,
      education: user.education || {
        tenth: { percentage: "", passingYear: "" },
        twelfth: { percentage: "", passingYear: "" },
        graduation: { degree: "", percentageOrCGPA: "", passingYear: "" },
        masters: { degree: "", percentageOrCGPA: "", passingYear: "" },
      },
      certifications: user.certifications || [],
      skills: user.skills || [],
      experience: experiences,
      profilePhoto: user.profilePhoto || null,
      resume: user.resume || null,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json(mappedUser);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Process profile data helper function
const processProfileData = (req) => {
  try {
    // Create the update object from form data
    const updateFields = { ...req.body };
    
    // Parse JSON fields
    ['education', 'experience', 'certifications', 'skills'].forEach(field => {
      if (updateFields[field]) {
        try {
          updateFields[field] = JSON.parse(updateFields[field]);
          
          // Ensure experience is always an array
          if (field === 'experience' && !Array.isArray(updateFields[field])) {
            updateFields[field] = [updateFields[field]];
          }
        } catch (err) {
          console.error(`Error parsing ${field} data:`, err);
        }
      }
    });
    
    // Convert checkbox values to booleans
    if (updateFields.readyToRelocate) {
      updateFields.readyToRelocate = updateFields.readyToRelocate === "true";
    }
    
    // Convert boolean values in experience array
    if (Array.isArray(updateFields.experience)) {
      updateFields.experience = updateFields.experience.map(exp => ({
        ...exp,
        hasExperience: exp.hasExperience === true || exp.hasExperience === "true"
      }));
    }
    
    // Handle file uploads
    if (req.files) {
      // Handle profile photo and resume
      if (req.files.profilePhoto) {
        updateFields.profilePhoto = `/uploads/${req.files.profilePhoto[0].filename}`;
      } else if (req.body.profilePhoto) {
        updateFields.profilePhoto = req.body.profilePhoto.replace("http://localhost:3000", "");
      }
      
      if (req.files.resume) {
        updateFields.resume = `/uploads/${req.files.resume[0].filename}`;
      }
      
      // Process certification images
      if (updateFields.certifications && Array.isArray(updateFields.certifications)) {
        const processedCertifications = [];
        
        for (let i = 0; i < updateFields.certifications.length; i++) {
          const cert = { 
            name: updateFields.certifications[i].name,
            image: updateFields.certifications[i].image || "" // Preserve existing image
          };
          
          // Check if there's a new certification image
          const certFileKey = `certificationImage-${i}`;
          if (req.files[certFileKey]) {
            cert.image = `/uploads/${req.files[certFileKey][0].filename}`;
          }
          
          processedCertifications.push(cert);
        }
        
        updateFields.certifications = processedCertifications;
      }
    }
    
    return updateFields;
  } catch (error) {
    console.error("Error processing profile data:", error);
    throw error;
  }
};


// Complete student profile - For first-time profile completion
exports.completeProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateFields = processProfileData(req);
    
    // Handle experience array similarly to updateProfile
    if (updateFields.experience && Array.isArray(updateFields.experience)) {
      if (updateFields.experience.length === 1 && !updateFields.experience[0].hasExperience) {
        updateFields.experience = [{
          hasExperience: false,
          organizationName: "",
          duration: "",
          details: "",
        }];
      } else {
        updateFields.experience = updateFields.experience.filter(exp => exp.hasExperience);
      }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      updateFields, 
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ 
      success: true,
      message: "Profile completed successfully", 
      user: updatedUser 
    });
  } catch (error) {
    console.error("Error in completeProfile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update student profile for profile updates
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateFields = processProfileData(req);
    
    // If there's only one experience and hasExperience is false, ensure it's still an array
    if (updateFields.experience && Array.isArray(updateFields.experience)) {
      if (updateFields.experience.length === 1 && !updateFields.experience[0].hasExperience) {
        // Keep it as an array with one empty experience
        updateFields.experience = [{
          hasExperience: false,
          organizationName: "",
          duration: "",
          details: "",
        }];
      } else {
        // Filter out any experiences that don't have the hasExperience flag set to true
        updateFields.experience = updateFields.experience.filter(exp => exp.hasExperience);
      }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      updateFields, 
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Upload Profile Photo
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user._id;
    const filePath = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      userId, 
      { profilePhoto: filePath }, 
      { new: true }
    );

    res.status(200).json({ message: "Profile photo uploaded successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Upload Resume
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user._id;
    const filePath = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      userId, 
      { resume: filePath }, 
      { new: true }
    );

    res.status(200).json({ message: "Resume uploaded successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};