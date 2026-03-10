import React, { useState, useRef, useEffect } from 'react';
import { Bell, Info, AlertTriangle, CheckCircle, AlertOctagon, X } from 'lucide-react';
import { useNotifications, Notification } from '../../contexts/NotificationContext';

export const NotificationDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initial fetch handled by context, but ensure polling is active while open? 
        // Handled globally by context polling anyway.
    }, []);

    // Close dropdown if clicked outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        // Handle link routing if needed
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'info':
                return <Info className="w-5 h-5 text-odyssey-mid" />;
            case 'success':
                return <CheckCircle className="w-5 h-5 text-odyssey-electric" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-odyssey-amber" />;
            case 'alert':
                return <AlertOctagon className="w-5 h-5 text-odyssey-red" />;
            default:
                return <Info className="w-5 h-5 text-odyssey-mid" />;
        }
    };

    const formatRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();

        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-odyssey-border transition-colors focus:outline-none"
            >
                <Bell className="w-6 h-6 text-odyssey-border hover:text-odyssey-accent transition-colors" />

                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-odyssey-electric opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-odyssey-electric border-[1.5px] border-odyssey-surface"></span>
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl glass shadow-2xl z-50 overflow-hidden animate-fade-in border border-odyssey-border">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-odyssey-border flex justify-between items-center bg-odyssey-surface/50">
                        <h3 className="text-white font-medium">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-odyssey-accent hover:text-white transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto scrollbar-thin">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground text-sm">
                                No notifications to display.
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`
                      p-4 border-b border-odyssey-border/50 hover:bg-odyssey-border/30 transition-colors cursor-pointer flex gap-3
                      ${!notif.read ? 'bg-odyssey-blue/10' : ''}
                    `}
                                    >
                                        <div className="flex-shrink-0 mt-1">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className={`text-sm font-medium leading-tight ${!notif.read ? 'text-white' : 'text-white/80'}`}>
                                                    {notif.title}
                                                </p>
                                                <span className="text-[10px] whitespace-nowrap text-muted-foreground">
                                                    {formatRelativeTime(notif.createdAt)}
                                                </span>
                                            </div>
                                            <p className={`text-xs mt-1 line-clamp-2 ${!notif.read ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                                                {notif.message}
                                            </p>
                                        </div>

                                        {!notif.read && (
                                            <div className="w-2 relative flex-shrink-0">
                                                <div className="absolute top-1 right-0 w-2 h-2 bg-odyssey-accent rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-2 text-center border-t border-odyssey-border bg-odyssey-surface/30">
                        <button
                            onClick={fetchNotifications}
                            className="text-xs text-muted-foreground hover:text-white transition-colors py-1 px-4"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
