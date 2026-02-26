// components/collabora-editor/collabora-editor.component.ts

import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { UserService, User } from '../../services/user.service';

interface CollaboraSession {
  sessionId: string;
  wopiSrc: string;
  accessToken: string;
  collaboraUrl: string;
}

@Component({
  selector: 'app-collabora-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="collabora-editor-container">
      <div class="editor-header">
        <h3>📝 {{ documentName }}</h3>
        <div class="editor-actions">
          <button (click)="openInNewTab()" class="btn btn-primary" [disabled]="isLoading || error">
            🚀 Άνοιγμα σε νέα καρτέλα
          </button>
          <button (click)="closeEditor()" class="btn btn-secondary">
            ✕ Κλείσιμο
          </button>
        </div>
      </div>

      <div class="editor-loading" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Φόρτωση Collabora session...</p>
      </div>

      <div class="editor-error" *ngIf="error">
        <p>⚠️ {{ error }}</p>
        <button (click)="retry()" class="btn btn-primary">Επανάληψη</button>
      </div>

      <div class="editor-success" *ngIf="!isLoading && !error && collaboraUrl">
        <div class="success-message">
          <h4>✅ Collabora Session Δημιουργήθηκε!</h4>
          <p><strong>Έγγραφο:</strong> {{ documentName }}</p>
          <p><strong>Χρήστης:</strong> {{ currentUser.name }} ({{ getUserRoleLabel() }})</p>
          <p><strong>Δικαιώματα:</strong> {{ currentUser.role === 'secretary' ? 'Επεξεργασία' : 'Μόνο ανάγνωση' }}</p>
          
          <div class="action-buttons">
            <button (click)="openInNewTab()" class="btn btn-primary btn-large">
              🚀 Άνοιγμα Collabora Editor
            </button>
            <button (click)="copyCollaboraUrl()" class="btn btn-secondary">
              📋 Αντιγραφή URL
            </button>
          </div>
          
          <details class="technical-info">
            <summary>🔧 Τεχνικές Πληροφορίες</summary>
            <div class="tech-details">
              <p><strong>Document ID:</strong> {{ documentId }}</p>
              <p><strong>WOPI Src:</strong> {{ wopiSrc }}</p>
              <p><strong>Access Token:</strong> {{ accessToken ? '✅ Έγκυρο' : '❌ Λείπει' }}</p>
              <p><strong>Session ID:</strong> {{ sessionId }}</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .collabora-editor-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      z-index: 1000;
      display: flex;
      flex-direction: column;
    }

    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .editor-header h3 {
      margin: 0;
      font-size: 18px;
    }

    .editor-actions {
      display: flex;
      gap: 10px;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background: #0056b3;
    }

    .editor-loading, .editor-error {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .collabora-frame {
      flex: 1;
      width: 100%;
      border: none;
    }

    .editor-error {
      color: #721c24;
      text-align: center;
      padding: 40px 20px;
    }

    .editor-error p {
      font-size: 16px;
      margin: 0 0 20px 0;
    }

    .editor-success {
      padding: 30px;
      text-align: center;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .success-message {
      max-width: 600px;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .success-message h4 {
      color: #28a745;
      margin: 0 0 20px 0;
      font-size: 22px;
    }

    .success-message p {
      margin: 8px 0;
      color: #495057;
      font-size: 14px;
    }

    .action-buttons {
      margin: 30px 0;
      display: flex;
      gap: 15px;
      justify-content: center;
    }

    .btn-large {
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 700;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .technical-info {
      margin-top: 30px;
      text-align: left;
    }

    .technical-info summary {
      cursor: pointer;
      padding: 10px 0;
      font-weight: 600;
      color: #6c757d;
      border-bottom: 1px solid #dee2e6;
    }

    .tech-details {
      padding: 20px 0;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      background: #f8f9fa;
      margin-top: 10px;
      border-radius: 6px;
      padding: 20px;
    }

    .tech-details p {
      margin: 8px 0;
      word-break: break-all;
    }
  `]
})
export class CollaboraEditorComponent implements OnInit, OnDestroy {
  @Input() documentId: string = '';
  @Input() documentName: string = 'Document';
  @Input() readOnly: boolean = false;
  @Output() onClose = new EventEmitter<void>();
  // Remove hardcoded user inputs - will get from UserService
  @ViewChild('collaboraFrame') collaboraFrame?: ElementRef;

  collaboraUrl: SafeResourceUrl | null = null;
  isLoading: boolean = true;
  error: string = '';
  private apiUrl = `${environment.apiUrl}/collabora`;
  currentUser: User;
  
  // WOPI session details
  wopiSrc = '';
  accessToken = '';
  sessionId = '';

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {
    this.currentUser = this.userService.getCurrentUser();
  }

  ngOnInit(): void {
    // Subscribe to user changes
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Check if ID is provided via route params, else fallback to @Input
    this.route.paramMap.subscribe(params => {
      const idFromRoute = params.get('id');
      if (idFromRoute) {
        this.documentId = idFromRoute;
        this.documentName = `Document ${idFromRoute}`;
      }
      this.initializeEditor();
    });
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  async initializeEditor(): Promise<void> {
    if (!this.documentId) return;

    // Validate user information
    if (!this.currentUser.id) {
      this.error = 'User not authenticated. Please log in.';
      this.isLoading = false;
      return;
    }

    try {
      this.isLoading = true;
      this.error = '';

      console.log('🚀 Initializing Collabora editor for document:', this.documentId);
      console.log('👤 User context:', this.currentUser);

      const session = await this.http.post<CollaboraSession>(
        `${this.apiUrl}/sessions`,
        {
          documentId: this.documentId,
          fileName: this.documentName,
          readOnly: this.readOnly,
          userId: this.currentUser.id,
          role: this.currentUser.role
        }
      ).toPromise();

      if (!session) {
        throw new Error('Failed to create editing session');
      }

      console.log('✅ Collabora session created:', session);

      // Store session details for display and new tab functionality
      this.sessionId = session.sessionId;
      this.wopiSrc = session.wopiSrc;
      this.accessToken = session.accessToken;

      // Sanitize the URL for iframe (if needed) or new tab
      this.collaboraUrl = this.sanitizer.bypassSecurityTrustResourceUrl(session.collaboraUrl);

      console.log('📋 Session details stored:', {
        sessionId: this.sessionId,
        wopiSrc: this.wopiSrc,
        hasAccessToken: !!this.accessToken
      });

      this.isLoading = false;
    } catch (err: any) {
      console.error('❌ Error initializing Collabora editor:', err);
      this.error = err.error?.error || 'Σφάλμα κατά τη φόρτωση του editor';
      this.isLoading = false;
    }
  }

  onFrameLoad(): void {
    console.log('Collabora frame loaded');
  }

  closeEditor(): void {
    this.router.navigate(['/editor-setup']);
  }

  retry(): void {
    this.initializeEditor();
  }

  openInNewTab(): void {
    if (!this.collaboraUrl) {
      this.error = 'Η URL του Collabora δεν είναι έτοιμη';
      return;
    }

    try {
      // Extract the actual URL from SafeResourceUrl
      const urlString = (this.collaboraUrl as any).changingThisBreaksApplicationSecurity;
      
      // Open in new tab with specific features
      const newTab = window.open(
        urlString, 
        `collabora_${this.documentId}_${Date.now()}`,
        'width=1200,height=800,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,status=yes'
      );
      
      if (!newTab) {
        this.error = 'Δεν ήταν δυνατό το άνοιγμα του νέου tab. Ελέγξτε τις ρυθμίσεις popup.';
      } else {
        console.log('✅ Collabora άνοιξε σε νέο tab για document:', this.documentId);
        
        // Focus the new tab
        newTab.focus();
        
        // Optionally close the current editor overlay after successful opening
        setTimeout(() => {
          console.log('📝 Collabora editor άνοιξε επιτυχώς - κλείσιμο overlay');
        }, 1000);
      }
    } catch (error: any) {
      console.error('❌ Σφάλμα στο άνοιγμα νέου tab:', error);
      this.error = 'Δεν ήταν δυνατό το άνοιγμα του Collabora σε νέο tab';
    }
  }

  copyCollaboraUrl(): void {
    if (!this.collaboraUrl) {
      this.error = 'Η URL του Collabora δεν είναι διαθέσιμη'; 
      return;
    }
    
    try {
      const urlString = (this.collaboraUrl as any).changingThisBreaksApplicationSecurity;
      navigator.clipboard.writeText(urlString).then(() => {
        console.log('📋 URL αντιγράφηκε στο clipboard');
        // Could show a brief success message here
      }).catch((err) => {
        console.error('❌ Σφάλμα στην αντιγραφή URL:', err);
        this.error = 'Δεν ήταν δυνατή η αντιγραφή της URL';
      });
    } catch (error: any) {
      console.error('❌ Σφάλμα στην πρόσβαση στην URL:', error);
      this.error = 'Δεν ήταν δυνατή η αντιγραφή της URL';
    }
  }

  getUserRoleLabel(): string {
    return this.currentUser?.role === 'secretary' ? 'Γραμματέας' : 'Μέλος';
  }
}
