import multer from 'multer';
import path from 'path';
import fs from 'fs';

const newsUploadsDir = path.join(process.cwd(), 'uploads', 'news');
const recordingsUploadsDir = path.join(process.cwd(), 'uploads', 'recordings');

if (!fs.existsSync(newsUploadsDir)) {
  fs.mkdirSync(newsUploadsDir, { recursive: true });
}

if (!fs.existsSync(recordingsUploadsDir)) {
  fs.mkdirSync(recordingsUploadsDir, { recursive: true });
}

const newsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, newsUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `news-${uniqueSuffix}${ext}`);
  }
});

const recordingsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, recordingsUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `recording-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Разрешены только изображения (JPEG, PNG, GIF, WebP)'));
  }
};

export const uploadNewsImage = multer({
  storage: newsStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

export const uploadRecordingImage = multer({
  storage: recordingsStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});
