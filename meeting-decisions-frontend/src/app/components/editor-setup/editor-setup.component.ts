import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DocumentService } from '../../services/document.service';

@Component({
  selector: 'app-editor-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="setup-container">
      <div class="setup-card">
        <h2>✏️ Άνοιγμα Editor</h2>
        <p class="description">
          Επιλέξτε πώς θέλετε να ανοίξετε το έγγραφό σας στο περιβάλλον του Collabora.
        </p>

        <!-- Tabs Navigation -->
        <div class="tabs">
          <div 
            class="tab" 
            [class.active]="activeTab === 'upload'" 
            (click)="activeTab = 'upload'">
            Ανέβασμα Εγγράφου
          </div>
          <div 
            class="tab" 
            [class.active]="activeTab === 'id'" 
            (click)="activeTab = 'id'">
            Με υπάρχον ID
          </div>
        </div>
        
        <!-- Upload Tab Content -->
        <div class="tab-content" *ngIf="activeTab === 'upload'">
          <div 
            class="upload-area" 
            [class.drag-over]="isDragging"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            (click)="fileInput.click()">
            
            <input 
              type="file" 
              #fileInput 
              (change)="onFileSelected($event)" 
              accept=".docx" 
              style="display: none;">
            
            <div class="upload-icon">📄</div>
            <p class="upload-text" *ngIf="!selectedFile">
              Σύρετε και αφήστε ένα αρχείο <strong>.docx</strong> εδώ<br>ή κάντε κλικ για επιλογή
            </p>
            <p class="upload-text selected" *ngIf="selectedFile">
              Επιλεγμένο αρχείο:<br><strong>{{ selectedFile.name }}</strong>
            </p>
          </div>

          <!-- Error message -->
          <div class="error-message" *ngIf="uploadError">
            ⚠️ {{ uploadError }}
          </div>
          
          <button 
            type="button" 
            class="btn-submit"
            [disabled]="!selectedFile || isUploading"
            (click)="uploadAndOpen()">
            <span *ngIf="!isUploading">Άνοιγμα <span class="arrow">→</span></span>
            <span *ngIf="isUploading">Φόρτωση... ⏳</span>
          </button>
        </div>

        <!-- Existing ID Tab Content -->
        <div class="tab-content" *ngIf="activeTab === 'id'">
          <form (ngSubmit)="openEditorWithId()" #setupForm="ngForm">
            <div class="form-group">
              <label for="documentId">Αναγνωριστικό Εγγράφου (ID)</label>
              <input 
                type="text" 
                id="documentId" 
                name="documentId" 
                [(ngModel)]="documentId" 
                required 
                placeholder="π.χ. my_document_123"
                class="form-control"
                autocomplete="off"
              >
            </div>
            
            <button type="submit" [disabled]="!setupForm.form.valid || !documentId.trim()" class="btn-submit">
              Άνοιγμα <span class="arrow">→</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .setup-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 200px);
      padding: 2rem;
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .setup-card {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      width: 100%;
      max-width: 500px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(226, 232, 240, 0.8);
    }

    h2 {
      margin: 0 0 1rem 0;
      color: #2d3748;
      font-size: 1.75rem;
      font-weight: 700;
    }

    .description {
      color: #718096;
      margin-bottom: 2rem;
      line-height: 1.6;
      font-size: 1rem;
    }

    /* Tabs Styling */
    .tabs {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      border-bottom: 2px solid #edf2f7;
    }

    .tab {
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: #a0aec0;
      cursor: pointer;
      position: relative;
      transition: color 0.3s ease;
    }

    .tab:hover {
      color: #4a5568;
    }

    .tab.active {
      color: #805ad5;
    }

    .tab.active::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 2px;
      background: #805ad5;
      border-radius: 2px 2px 0 0;
    }

    .tab-content {
      animation: fadeIn 0.3s ease-out;
    }

    /* Upload Area Styling */
    .upload-area {
      border: 2px dashed #cbd5e0;
      border-radius: 12px;
      padding: 3rem 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #f8fafc;
      margin-bottom: 1.5rem;
    }

    .upload-area:hover, .upload-area.drag-over {
      border-color: #9f7aea;
      background: rgba(159, 122, 234, 0.05);
    }

    .upload-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.8;
    }

    .upload-text {
      color: #718096;
      font-size: 1.1rem;
      margin: 0;
      line-height: 1.5;
    }

    .upload-text.selected {
      color: #805ad5;
    }

    .error-message {
      color: #e53e3e;
      background: #fff5f5;
      padding: 0.75rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-size: 0.95rem;
      text-align: center;
    }

    /* Form Controls */
    .form-group {
      margin-bottom: 2rem;
    }

    label {
      display: block;
      margin-bottom: 0.75rem;
      color: #4a5568;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .form-control {
      width: 100%;
      padding: 1rem 1.25rem;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      font-size: 1rem;
      transition: all 0.3s ease;
      background: #f8fafc;
      color: #2d3748;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #9f7aea;
      background: white;
      box-shadow: 0 0 0 3px rgba(159, 122, 234, 0.2);
    }

    .form-control::placeholder {
      color: #cbd5e0;
    }

    /* Primary Button */
    .btn-submit {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #9f7aea 0%, #805ad5 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 15px rgba(128, 90, 213, 0.3);
    }

    .btn-submit:disabled {
      background: #cbd5e0;
      cursor: not-allowed;
      opacity: 0.7;
      transform: none;
      box-shadow: none;
    }

    .arrow {
      transition: transform 0.3s ease;
    }

    .btn-submit:hover:not(:disabled) .arrow {
      transform: translateX(4px);
    }
  `]
})
export class EditorSetupComponent {
  activeTab: 'upload' | 'id' = 'upload';

  // Existing ID variables
  documentId: string = '';

  // Upload variables
  selectedFile: File | null = null;
  isDragging = false;
  isUploading = false;
  uploadError = '';

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private router: Router,
    private documentService: DocumentService
  ) { }

  // Drag and Drop handlers
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File) {
    this.uploadError = '';

    if (!file.name.toLowerCase().endsWith('.docx')) {
      this.uploadError = 'Παρακαλώ επιλέξτε αρχείο .docx';
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
  }

  uploadAndOpen(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.uploadError = '';

    this.documentService.uploadForEditing(this.selectedFile).subscribe({
      next: (response) => {
        this.isUploading = false;
        this.router.navigate(['/editor', response.documentId]);
      },
      error: (err) => {
        console.error('Upload failed:', err);
        this.isUploading = false;
        this.uploadError = 'Αποτυχία ανεβάσματος εγγράφου. Καταχωρήστε ξανά.';
      }
    });
  }

  openEditorWithId(): void {
    if (this.documentId && this.documentId.trim()) {
      this.router.navigate(['/editor', this.documentId.trim()]);
    }
  }
}
