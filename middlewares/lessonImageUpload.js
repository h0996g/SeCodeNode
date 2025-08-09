const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = "uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random number
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'lesson-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, jpg, png, gif, webp) are allowed!"));
  }
};

const upload = multer({ 
  storage, 
  limits: { fileSize: 1024 * 1024 * 10 }, // 10MB limit for lesson images
  fileFilter
});

// Create a wrapper middleware to handle boundary errors gracefully
const lessonUpload = (req, res, next) => {
  // Check if request has content-type multipart/form-data
  const contentType = req.get('Content-Type');
  
  if (!contentType || !contentType.includes('multipart/form-data')) {
    // If no multipart content-type, skip file upload and continue
    return next();
  }
  
  // Apply multer middleware
  upload.single("lessonImage")(req, res, (err) => {
    if (err) {
      // Handle multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          message: "File too large. Maximum size is 10MB." 
        });
      }
      if (err.message.includes('Only image files')) {
        return res.status(400).json({ 
          message: err.message 
        });
      }
      if (err.message.includes('Boundary not found')) {
        return res.status(400).json({ 
          message: "Invalid multipart form data. Please check your request format." 
        });
      }
      return res.status(400).json({ 
        message: "File upload error: " + err.message 
      });
    }
    next();
  });
};

module.exports = lessonUpload;