// components/collabora-editor/collabora-editor.component.ts

import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

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
          <button (click)="closeEditor()" class="btn btn-secondary">
            ✕ Κλείσιμο
          </button>
        </div>
      </div>

      <div class="editor-loading" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Φόρτωση editor...</p>
      </div>

      <div class="editor-error" *ngIf="error">
        <p>⚠️ {{ error }}</p>
        <button (click)="retry()" class="btn btn-primary">Επανάληψη</button>
      </div>

      <iframe
        *ngIf="!isLoading && !error && collaboraUrl"
        [src]="collaboraUrl"
        class="collabora-frame"
        #collaboraFrame
        (load)="onFrameLoad()">
      </iframe>
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
    }

    .editor-error p {
      font-size: 16px;
      margin: 0;
    }
  `]
})
export class CollaboraEditorComponent implements OnInit, OnDestroy {
  @Input() documentId: string = '';
  @Input() documentName: string = 'Document';
  @Input() readOnly: boolean = false;
  @ViewChild('collaboraFrame') collaboraFrame?: ElementRef;

  collaboraUrl: SafeResourceUrl | null = null;
  isLoading: boolean = true;
  error: string = '';
  private apiUrl = `${environment.apiUrl}/collabora`;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
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

    try {
      this.isLoading = true;
      this.error = '';

      console.log('Initializing Collabora editor for document:', this.documentId);

      const session = await this.http.post<CollaboraSession>(
        `${this.apiUrl}/sessions`,
        {
          documentId: this.documentId,
          fileName: this.documentName,
          readOnly: this.readOnly
        }
      ).toPromise();

      if (!session) {
        throw new Error('Failed to create editing session');
      }

      console.log('Collabora session created:', session);

      // Sanitize the URL for iframe
      this.collaboraUrl = this.sanitizer.bypassSecurityTrustResourceUrl(session.collaboraUrl);

      this.isLoading = false;
    } catch (err: any) {
      console.error('Error initializing Collabora editor:', err);
      this.error = err.error?.error || 'Σφάλμα κατά τη φόρτωση του editor, το έγγραφο ίσως να μην υπάρχει!';
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
}
