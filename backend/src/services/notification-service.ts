// ============================================================
// /backend/src/services/notification-service.ts
// Service for managing in-app user notifications
// ============================================================
import { logger } from '../config/logger';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  createdAt: string;
  link?: string;
}

// In-memory store for rapid prototyping.
// In production, this should map to a SQLite/Postgres DB using your ORM.
let notificationsStore: Notification[] = [];

class NotificationService {
  public async getNotifications(userId: string): Promise<Notification[]> {
    try {
      return notificationsStore
        .filter(n => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  public async getUnreadCount(userId: string): Promise<number> {
    try {
      return notificationsStore.filter(n => n.userId === userId && !n.read).length;
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw new Error('Failed to get unread count');
    }
  }

  public async createNotification(payload: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<Notification> {
    try {
      const newNotification: Notification = {
        ...payload,
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        read: false,
        createdAt: new Date().toISOString(),
      };

      notificationsStore.unshift(newNotification);

      if (notificationsStore.length > 100) {
        notificationsStore = notificationsStore.slice(0, 100);
      }

      logger.info(`Notification created: ${newNotification.title}`);
      return newNotification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  public async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const index = notificationsStore.findIndex(n => n.id === notificationId && n.userId === userId);
      if (index !== -1) {
        notificationsStore[index].read = true;
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Error marking notification as read (ID: ${notificationId}):`, error);
      throw new Error('Failed to mark notification as read');
    }
  }

  public async markAllAsRead(userId: string): Promise<boolean> {
    try {
      let updated = false;
      notificationsStore.forEach(n => {
        if (n.userId === userId && !n.read) {
          n.read = true;
          updated = true;
        }
      });
      return updated;
    } catch (error) {
      logger.error(`Error marking all notifications as read for user ${userId}:`, error);
      throw new Error('Failed to mark all notifications as read');
    }
  }
}

export const notificationService = new NotificationService();
