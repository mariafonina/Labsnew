// Object Storage Routes for Admin
// Based on Replit Object Storage integration (blueprint:javascript_object_storage)

import { Router, Response } from 'express';
import { verifyToken, requireAdmin, AuthRequest } from '../../auth';
import { ObjectStorageService, ObjectNotFoundError } from '../../objectStorage';
import { asyncHandler } from '../../utils/async-handler';

const router = Router();

// Get presigned upload URL for images
router.post('/upload-url', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { folder = 'instructions' } = req.body;
  
  const objectStorageService = new ObjectStorageService();
  const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadURL(folder);
  
  res.json({ 
    uploadURL, 
    objectPath,
    method: 'PUT'
  });
}));

// Confirm upload and set ACL policy
router.post('/confirm-upload', verifyToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { uploadURL, objectPath } = req.body;
  
  if (!uploadURL && !objectPath) {
    return res.status(400).json({ error: 'uploadURL or objectPath is required' });
  }

  const userId = String(req.userId);
  const objectStorageService = new ObjectStorageService();
  
  try {
    const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(
      uploadURL || objectPath,
      {
        owner: userId,
        visibility: 'public', // Images in articles should be publicly readable
      }
    );

    res.json({ 
      objectPath: normalizedPath,
      success: true
    });
  } catch (error) {
    console.error('Error confirming upload:', error);
    res.status(500).json({ error: 'Failed to confirm upload' });
  }
}));

export default router;
