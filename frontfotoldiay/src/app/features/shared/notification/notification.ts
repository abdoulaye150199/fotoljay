import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  payload?: any;
}

@Component({
  selector: 'app-notification',
  imports: [CommonModule],
  templateUrl: './notification.html',
  styleUrl: './notification.css'
})
export class Notification {
  @Input() notification!: NotificationData;
  @Output() markAsRead = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  onMarkAsRead() {
    if (!this.notification.isRead) {
      this.markAsRead.emit(this.notification.id);
    }
  }

  onDelete() {
    this.delete.emit(this.notification.id);
  }

  getNotificationIcon(): string {
    switch (this.notification.type) {
      case 'REPUBLIER_AVANT_SUPPRESSION':
        return '⚠️';
      case 'MODERATION_DECISION':
        return '📋';
      case 'GENERIC':
      default:
        return '🔔';
    }
  }

  getTimeAgo(): string {
    const now = new Date();
    const createdAt = new Date(this.notification.createdAt);
    const diffInMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays}j`;
  }
}
