const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const path = require('path');

// Cloudinary Storage Configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine file type
    const fileExtension = path.extname(file.originalname).toLowerCase();
    let resourceType = 'raw'; // Default for PDFs and DOCX
    let folder = 'campus-ai/resumes';
    
    if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileExtension)) {
      resourceType = 'image';
      folder = 'campus-ai/documents';
    }

    return {
      folder: folder,
      resource_type: resourceType,
      allowed_formats: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
      public_id: `${file.fieldname}-${Date.now()}`,
      access_mode: 'public', // CRITICAL: Ensures public access
      type: 'upload',
      use_filename: true,
      unique_filename: true,
      overwrite: false
    };
  }
});

// File filter validation
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, PNG allowed.'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

upload.handleUploadError = handleUploadError;
module.exports = upload;
