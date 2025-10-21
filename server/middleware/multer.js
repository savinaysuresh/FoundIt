// server/middleware/multer.js
import multer from 'multer';
import path from 'path';

// Set up storage. We use diskStorage so req.file.path is available.
// 'dest: "uploads/"' is a simpler alternative that does the same thing.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // The 'uploads' folder must exist in your server's root directory
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Create a unique filename
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// File filter (optional, but good practice)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // 5MB limit
});

export default upload;