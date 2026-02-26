// components/login/login.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>📋 Meeting Decisions Login</h2>
        <p>Select your role to continue:</p>
        
        <form (ngSubmit)="login()" class="login-form">
          <div class="form-group">
            <label for="username">Username:</label>
            <input 
              type="text" 
              id="username" 
              [(ngModel)]="username" 
              name="username" 
              required
              placeholder="Enter your username">
          </div>

          <div class="form-group">
            <label for="role">Role:</label>
            <select id="role" [(ngModel)]="selectedRole" name="role" required>
              <option value="secretary">🏛️ Secretary (Can Edit Documents)</option>
              <option value="member">👤 Member (View Only)</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary" [disabled]="!username">
            Login & Continue
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      max-width: 400px;
      width: 100%;
    }

    .login-card h2 {
      text-align: center;
      margin-bottom: 10px;
      color: #333;
    }

    .login-card p {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      color: #333;
      font-weight: 600;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .btn {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class LoginComponent {
  username: string = '';
  selectedRole: 'secretary' | 'member' = 'member';

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  login(): void {
    if (!this.username) return;

    this.userService.login(this.username, 'password', this.selectedRole).subscribe(() => {
      // Redirect to home page after login
      this.router.navigate(['/']);
    });
  }
}