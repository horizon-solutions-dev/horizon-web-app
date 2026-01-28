import { MdClose, MdCheckCircle, MdWarning, MdInfo, MdLocalShipping } from "react-icons/md";
import "./NotificationsModal.scss";

export interface Notification {
  id: string;
  type: "info" | "warning" | "success" | "delivery";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
}

export default function NotificationsModal({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationsModalProps) {
  if (!isOpen) return null;

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <MdCheckCircle className="notification-icon success" />;
      case "warning":
        return <MdWarning className="notification-icon warning" />;
      case "delivery":
        return <MdLocalShipping className="notification-icon delivery" />;
      default:
        return <MdInfo className="notification-icon info" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <div className="notifications-modal-overlay" onClick={onClose} />
      <div className="notifications-modal">
        <div className="notifications-modal-header">
          <div className="header-content">
            <h3>Notificações</h3>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount} não lida{unreadCount !== 1 ? "s" : ""}</span>
            )}
          </div>
          <div className="header-actions">
            {unreadCount > 0 && onMarkAllAsRead && (
              <button className="mark-all-btn" onClick={onMarkAllAsRead}>
                Marcar todas como lidas
              </button>
            )}
            <button className="close-btn" onClick={onClose}>
              <MdClose />
            </button>
          </div>
        </div>

        <div className="notifications-modal-body">
          {notifications.length === 0 ? (
            <div className="no-notifications">
              <MdInfo className="empty-icon" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.read ? "read" : "unread"}`}
                  onClick={() => onMarkAsRead?.(notification.id)}
                >
                  <div className="notification-icon-container">
                    {getIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-time">{notification.time}</span>
                  </div>
                  {!notification.read && <div className="unread-indicator" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
