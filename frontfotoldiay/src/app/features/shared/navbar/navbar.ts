import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../../core/auth';
import { ApiService } from '../../../core/api.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit, OnDestroy {
  isAuthenticated = false;
  currentUser: User | null = null;
  showNotifications = false;
  showMobileMenu = false;
  notifications: any[] = [];
  unreadCount = 0;
  private subscriptions: Subscription[] = [];
  private pollSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        this.isAuthenticated = !!user;
        if (user) {
          this.loadNotifications();
          this.startPolling();
        } else {
          this.stopPolling();
          this.notifications = [];
          this.unreadCount = 0;
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.stopPolling();
  }

  private startPolling() {
    this.stopPolling();
    // Poll every 30 seconds for new notifications
    this.pollSubscription = interval(30000).subscribe(() => {
      if (this.isAuthenticated) {
        this.loadUnreadCount();
      }
    });
  }

  private stopPolling() {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
      this.pollSubscription = undefined;
    }
  }

  async loadNotifications() {
    try {
      this.notifications = await this.apiService.getNotifications(10);
      this.loadUnreadCount();
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  async loadUnreadCount() {
    try {
      const result = await this.apiService.getUnreadCount();
      this.unreadCount = result.count;
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  async markNotificationAsRead(notificationId: string) {
    try {
      await this.apiService.markNotificationAsRead(notificationId);
      this.loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async markAllAsRead() {
    try {
      await this.apiService.markAllNotificationsAsRead();
      this.loadNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  async deleteNotification(notificationId: string) {
    try {
      await this.apiService.deleteNotification(notificationId);
      this.loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }
}
