import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';

// Aligning interface with backend
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

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            // In a real app we'd get token from AuthContext, assuming cookies/proxies for now or standard axios config
            const response = await axios.get('/api/notifications', {
                withCredentials: true
            });

            if (response.data.success) {
                setNotifications(response.data.data.notifications);
                setUnreadCount(response.data.data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();

        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markAsRead = async (id: string) => {
        try {
            // Optimistic UI update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            await axios.patch(`/api/notifications/${id}/read`, {}, { withCredentials: true });
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            // Revert on failure
            fetchNotifications();
        }
    };

    const markAllAsRead = async () => {
        try {
            // Optimistic UI update
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);

            await axios.patch('/api/notifications/read-all', {}, { withCredentials: true });
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
            // Revert on failure
            fetchNotifications();
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            fetchNotifications,
            markAsRead,
            markAllAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
