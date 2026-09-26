import multer from 'multer';
import path from 'path';
import fs from 'fs';
const dir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
fs.mkdirSync(dir, { recursive: true });
const storage = multer.diskStorage({
  destination: dir,
  filename: (_, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const allowed =
  /^(image\/(jpeg|png|webp)|video\/(mp4|webm)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document))$/;
export const uploadEvidence = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024, files: 5 },
  fileFilter: (_, file, cb) => cb(null, allowed.test(file.mimetype)),
}).array('evidence', 5);
