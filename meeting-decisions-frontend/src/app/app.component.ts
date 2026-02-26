// app.component.ts

import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService, User } from './services/user.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
  template: `
    <div class="app-container">
      <nav class="app-nav">
        <div class="nav-content">
          <a routerLink="/" class="nav-brand">🏛️ Σύστημα Διαχείρισης Συλλογικών Οργάνων</a>
          <div class="nav-links">
            <a routerLink="/" class="nav-link" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Αρχική</a>
            
            <!-- User Info -->
            <div class="user-info" *ngIf="currentUser.id; else loginLink">
              <span class="user-badge">
                <span class="user-role">{{ getUserRoleLabel() }}</span>
                <span class="user-name">{{ currentUser.name }}</span>
              </span>
              <button (click)="logout()" class="logout-btn">Έξοδος</button>
            </div>
            <ng-template #loginLink>
              <a routerLink="/login" class="nav-link login-link">Σύνδεση</a>
            </ng-template>
          </div>
        </div>
      </nav>

      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      
      <footer class="app-footer">
        <p>&copy; 2026 - Σύστημα Διαχείρισης Συλλογικών Οργάνων</p>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding-bottom: 60px;
      position: relative;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .app-nav {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem 2rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .nav-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-brand {
      color: white;
      text-decoration: none;
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: -0.5px;
    }

    .nav-links {
      display: flex;
      gap: 1rem;
    }

    .nav-link {
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      transition: all 0.3s ease;
      font-weight: 500;
    }

    .nav-link:hover,
    .nav-link.active {
      color: white;
      background: rgba(255, 255, 255, 0.2);
    }

    .login-link {
      background: rgba(255, 255, 255, 0.15) !important;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-badge {
      background: rgba(255, 255, 255, 0.15);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-role {
      background: rgba(255, 255, 255, 0.2);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .user-name {
      color: white;
      font-weight: 500;
    }

    .logout-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.3s;
    }

    .logout-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .nav-link:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .nav-link.active {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .main-content {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .app-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(10px);
      color: white;
      text-align: center;
      padding: 15px;
      font-size: 14px;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    }

    .app-footer p {
      margin: 0;
      opacity: 0.9;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'meeting-decisions-frontend';
  currentUser: User = { id: '', name: '', role: 'member' };

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    // Subscribe to user changes
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  getUserRoleLabel(): string {
    return this.currentUser.role === 'secretary' ? '🏛️ Γραμματεία' : '👤 Μέλος';
  }

  logout(): void {
    this.userService.logout();
  }
}