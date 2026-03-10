// ============================================================
// /backend/src/api/notifications.ts
// Express routes for notifications
// ============================================================
import { Router } from 'express';
import { notificationService } from '../services/notification-service';
import { AuthRequest } from '../middleware/auth';

export const notificationRouter = Router();

function currentUserId(req: AuthRequest): string | null {
  return req.user?.userId ?? null;
}

// GET /api/notifications
notificationRouter.get('/', async (req, res) => {
  try {
    const userId = currentUserId(req as AuthRequest);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const notifications = await notificationService.getNotifications(userId);
    const unreadCount = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications
notificationRouter.post('/', async (req, res) => {
  try {
    const userId = currentUserId(req as AuthRequest);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { title, message, type, link } = req.body;

    if (!title || !message || !type) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const notification = await notificationService.createNotification({
      title,
      message,
      type,
      link,
      userId,
    });

    res.status(201).json({ success: true, data: notification });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to create notification' });
  }
});

// PATCH /api/notifications/:id/read
notificationRouter.patch('/:id/read', async (req, res) => {
  try {
    const userId = currentUserId(req as AuthRequest);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const success = await notificationService.markAsRead(id, userId);

    if (!success) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
});

// PATCH /api/notifications/read-all
notificationRouter.patch('/read-all', async (req, res) => {
  try {
    const userId = currentUserId(req as AuthRequest);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    await notificationService.markAllAsRead(userId);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to mark all as read' });
  }
});
