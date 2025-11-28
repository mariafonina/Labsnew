// Public Object Serving Routes
// Based on Replit Object Storage integration (blueprint:javascript_object_storage)

import { Router } from 'express';
import { ObjectStorageService, ObjectNotFoundError } from '../objectStorage';
import { ObjectPermission } from '../objectAcl';

const router = Router();

// Serve objects (public access for images)
// Using regex pattern for path-to-regexp v8+ compatibility
router.get(/.*/, async (req, res) => {
  const objectStorageService = new ObjectStorageService();
  
  try {
    // req.path will be like /uploads/uuid-here
    const objectPath = `/objects${req.path}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
    
    // Check if user can access (for public images, visibility should be public)
    const canAccess = await objectStorageService.canAccessObjectEntity({
      objectFile,
      requestedPermission: ObjectPermission.READ,
    });
    
    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await objectStorageService.downloadObject(objectFile, res);
  } catch (error) {
    console.error('Error serving object:', error);
    if (error instanceof ObjectNotFoundError) {
      return res.status(404).json({ error: 'Object not found' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
