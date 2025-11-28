import { Router, Response } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { asyncHandler } from '../../utils/async-handler';
import { getPresignedUploadUrl, isYandexS3Configured } from '../../yandexS3';
import multer from 'multer';
import { uploadImageToYandexS3 } from '../../yandexS3';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'));
    }
  },
});

router.post('/upload-url', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { folder = 'instructions', fileName = 'image.jpg' } = req.body;
  
  if (!isYandexS3Configured()) {
    return res.status(500).json({ error: 'Yandex S3 not configured' });
  }

  const result = await getPresignedUploadUrl(fileName, folder);
  
  if (!result) {
    return res.status(500).json({ error: 'Failed to generate upload URL' });
  }
  
  res.json({ 
    uploadURL: result.uploadUrl, 
    publicUrl: result.publicUrl,
    method: 'PUT'
  });
}));

router.post('/confirm-upload', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { publicUrl } = req.body;
  
  if (!publicUrl) {
    return res.status(400).json({ error: 'publicUrl is required' });
  }

  res.json({ 
    objectPath: publicUrl,
    success: true
  });
}));

router.post('/upload', verifyToken, requireAdmin, upload.single('image'), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  const folder = (req.body.folder as string) || 'instructions';
  const originalName = req.file.originalname || 'image.jpg';

  const result = await uploadImageToYandexS3(
    req.file.buffer,
    originalName,
    folder
  );

  if (!result.success) {
    return res.status(500).json({ error: result.error || 'Failed to upload image' });
  }

  res.json({
    success: true,
    url: result.url,
    objectPath: result.url,
  });
}));

export default router;
