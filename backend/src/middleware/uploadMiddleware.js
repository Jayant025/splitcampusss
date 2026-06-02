const fs = require("fs");
const path = require("path");

const multer = require("multer");

const AppError = require("../utils/appError");

const createUploader = (folderName) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, "../uploads", folderName);
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname);
      const safeBaseName = file.originalname
        .replace(extension, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);

      cb(null, `${Date.now()}-${safeBaseName || "image"}${extension}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
    const ext = path.extname(file.originalname).toLowerCase();
    const isMimetypeImage = file.mimetype.startsWith("image/");
    const isExtensionAllowed = allowedExtensions.includes(ext);

    if (isMimetypeImage && isExtensionAllowed) {
      cb(null, true);
      return;
    }

    cb(new AppError("Only standard image uploads (.png, .jpg, .jpeg, .webp, .gif) are allowed.", 400), false);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024
    }
  });
};

const buildFileUrl = (folderName, file) => {
  if (!file) {
    return "";
  }

  return `/uploads/${folderName}/${file.filename}`;
};

module.exports = {
  createUploader,
  buildFileUrl
};

