import express from 'express';
import multer from 'multer';
import { requireAuth, attachProfile } from '../middleware/auth.js';
import { submitComplaint, getComplaint, getCitizenComplaints, getCitizenDashboard, trackComplaintByNumber } from '../controllers/complaintController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/citizen/dashboard', requireAuth, getCitizenDashboard);
router.get('/citizen/complaints', requireAuth, getCitizenComplaints);
router.post('/complaints', requireAuth, attachProfile, upload.single('image'), submitComplaint);
// Public track-by-number route — must be before :id to avoid collision
router.get('/complaints/track/:number', trackComplaintByNumber);
router.get('/complaints/:id', requireAuth, attachProfile, getComplaint);

export default router;
