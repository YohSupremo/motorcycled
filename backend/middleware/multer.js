import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = /png|jpeg|jpg|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);

  if (ext && mime) return cb(null, true);

  cb(new Error("Invalid file type"));
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

export default upload;
