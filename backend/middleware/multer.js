import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowedExt = /png|jpeg|jpg|webp|pdf/;
  const allowedMime = /image\/(png|jpeg|jpg|webp)|application\/pdf/;
  const ext = allowedExt.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedMime.test(file.mimetype);

  if (ext && mime) return cb(null, true);

  cb(new Error("Invalid file type. Allowed: JPG, PNG, WebP, PDF"));
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export default upload;
