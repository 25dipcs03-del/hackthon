import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  getAdminDashboard, getAdminComplaints, getAdminComplaint,
  updateComplaintStatus, assignComplaint, updatePriority,
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getAiInsights, getHotspots, getAdminNotifications, markNotificationRead,
  getUnreadNotificationCount, markAllNotificationsRead
} from '../controllers/adminController.js';

const router = express.Router();

// Admin routes
router.get('/admin/dashboard', requireAuth, requireAdmin, getAdminDashboard);
router.get('/admin/complaints', requireAuth, requireAdmin, getAdminComplaints);
router.get('/admin/complaints/:id', requireAuth, requireAdmin, getAdminComplaint);
router.put('/admin/complaints/:id/status', requireAuth, requireAdmin, updateComplaintStatus);
router.put('/admin/complaints/:id/assign', requireAuth, requireAdmin, assignComplaint);
router.put('/admin/complaints/:id/priority', requireAuth, requireAdmin, updatePriority);

// Department routes
router.get('/admin/departments', requireAuth, requireAdmin, getDepartments);
router.post('/admin/departments', requireAuth, requireAdmin, createDepartment);
router.put('/admin/departments/:id', requireAuth, requireAdmin, updateDepartment);
router.delete('/admin/departments/:id', requireAuth, requireAdmin, deleteDepartment);

// AI routes
router.get('/ai/insights', requireAuth, requireAdmin, getAiInsights);
router.get('/ai/hotspots', requireAuth, requireAdmin, getHotspots);

// Notifications — specific routes before parameterised ones
router.get('/admin/notifications/unread-count', requireAuth, requireAdmin, getUnreadNotificationCount);
router.get('/admin/notifications', requireAuth, requireAdmin, getAdminNotifications);
router.put('/admin/notifications/read-all', requireAuth, requireAdmin, markAllNotificationsRead);
router.put('/notifications/:id/read', requireAuth, markNotificationRead);

export default router;
