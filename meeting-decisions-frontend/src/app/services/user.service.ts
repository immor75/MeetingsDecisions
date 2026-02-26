// services/user.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: string;
  name: string;
  role: 'secretary' | 'member';
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserSubject = new BehaviorSubject<User>({
    id: 'user123',
    name: 'Demo User', 
    role: 'secretary' // Default role - change as needed
  });

  public currentUser$ = this.currentUserSubject.asObservable();

  getCurrentUser(): User {
    return this.currentUserSubject.value;
  }

  setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  // Mock login - replace with real authentication
  login(username: string, password: string, role: 'secretary' | 'member' = 'member'): Observable<User> {
    const user: User = {
      id: `user_${username}`,
      name: username,
      role: role,
      email: `${username}@example.com`
    };
    
    this.setCurrentUser(user);
    return new BehaviorSubject(user).asObservable();
  }

  logout(): void {
    // Clear user data
    this.currentUserSubject.next({
      id: '',
      name: '',
      role: 'member'
    });
  }
}