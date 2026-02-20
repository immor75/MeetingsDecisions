// components/document-upload/document-upload.component.ts

import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../services/document.service';
import { DocumentExtractionResponse, DecisionTemplate } from '../../models/document.models';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="upload-container">
      <h2>📄 Ανέβασμα Εισήγησης</h2>

      <div class="form-group">
        <label for="template-select">Επιλογή Προτύπου Απόφασης:</label>
        <select
          id="template-select"
          [(ngModel)]="selectedTemplateId"
          class="form-control">
          <option value="">-- Επιλέξτε Πρότυπο --</option>
          <option *ngFor="let template of templates" [value]="template.id">
            {{ template.name }}
          </option>
        </select>
        <small class="form-text" *ngIf="selectedTemplateId">
          {{ getTemplateDescription(selectedTemplateId) }}
        </small>
      </div>

      <div class="form-group">
        <label for="file-input">Έγγραφο Εισήγησης (.docx):</label>
        <div class="file-input-wrapper">
          <input
            type="file"
            id="file-input"
            (change)="onFileSelected($event)"
            accept=".docx"
            class="file-input"
            #fileInput>
          <button class="btn-browse" (click)="fileInput.click()">
            Επιλογή Αρχείου
          </button>
        </div>
      </div>

      <div *ngIf="selectedFile" class="file-info">
        <span class="file-icon">📎</span>
        <div class="file-details">
          <strong>{{ selectedFile.name }}</strong>
          <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
        </div>
        <button class="btn-remove" (click)="clearFile()">✕</button>
      </div>

      <button
        (click)="uploadAndExtract()"
        [disabled]="!selectedFile || !selectedTemplateId || isProcessing"
        class="btn btn-primary">
        <span *ngIf="!isProcessing">🔍 Ανάλυση Εγγράφου</span>
        <span *ngIf="isProcessing">
          <span class="spinner"></span> Επεξεργασία...
        </span>
      </button>

      <div *ngIf="error" class="alert alert-danger">
        ⚠️ {{ error }}
      </div>

      <div *ngIf="isProcessing" class="progress-info">
        ⏳ Εξαγωγή περιεχομένου από το έγγραφο...
      </div>
    </div>
  `,
  styles: [`
    .upload-container {
      padding: 25px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    h2 {
      margin: 0 0 20px 0;
      color: #2c3e50;
      font-size: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #34495e;
      font-size: 14px;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 2px solid #dfe6e9;
      border-radius: 8px;
      font-size: 14px;
      background: white;
      transition: all 0.3s;
    }

    .form-control:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }

    .form-text {
      display: block;
      margin-top: 5px;
      font-size: 12px;
      color: #7f8c8d;
      font-style: italic;
    }

    .file-input-wrapper {
      position: relative;
    }

    .file-input {
      display: none;
    }

    .btn-browse {
      width: 100%;
      padding: 12px;
      background: white;
      border: 2px dashed #3498db;
      border-radius: 8px;
      color: #3498db;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-browse:hover {
      background: #ebf5fb;
      border-color: #2980b9;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 15px;
      background: white;
      border-radius: 8px;
      margin: 15px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .file-icon {
      font-size: 24px;
    }

    .file-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .file-details strong {
      color: #2c3e50;
      font-size: 14px;
    }

    .file-size {
      color: #95a5a6;
      font-size: 12px;
    }

    .btn-remove {
      background: #e74c3c;
      color: white;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.3s;
    }

    .btn-remove:hover {
      background: #c0392b;
      transform: scale(1.1);
    }

    .btn {
      width: 100%;
      padding: 14px 24px;
      border: none;
      border-radius: 8px;
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
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid #ffffff;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 8px;
      vertical-align: middle;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .alert {
      padding: 14px;
      border-radius: 8px;
      margin-top: 15px;
      font-size: 14px;
    }

    .alert-danger {
      background: #fee;
      color: #c0392b;
      border: 1px solid #f5c6cb;
    }

    .progress-info {
      margin-top: 15px;
      padding: 12px;
      background: #d1ecf1;
      color: #0c5460;
      border-radius: 8px;
      font-size: 14px;
    }
  `]
})
export class DocumentUploadComponent implements OnInit {
  @Output() extractionComplete = new EventEmitter<DocumentExtractionResponse>();

  templates: DecisionTemplate[] = [];
  selectedTemplateId: string = '';
  selectedFile: File | null = null;
  isProcessing = false;
  error: string = '';

  constructor(private documentService: DocumentService) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.documentService.getTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;
        if (templates.length > 0) {
          this.selectedTemplateId = templates[0].id;
        }
      },
      error: (err) => {
        console.error('Error loading templates', err);
        this.error = 'Σφάλμα κατά τη φόρτωση των προτύπων';
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.endsWith('.docx')) {
        this.error = 'Παρακαλώ επιλέξτε αρχείο .docx';
        this.selectedFile = null;
        return;
      }
      this.selectedFile = file;
      this.error = '';
    }
  }

  clearFile(): void {
    this.selectedFile = null;
    this.error = '';
  }

  uploadAndExtract(): void {
    if (!this.selectedFile || !this.selectedTemplateId) {
      return;
    }

    this.isProcessing = true;
    this.error = '';

    this.documentService.extractProposal(this.selectedFile, this.selectedTemplateId)
      .subscribe({
        next: (response) => {
          this.isProcessing = false;
          console.log('Extraction successful:', response);
          this.extractionComplete.emit(response);
        },
        error: (err) => {
          this.isProcessing = false;
          console.error('Error extracting document', err);
          this.error = 'Σφάλμα κατά την επεξεργασία του εγγράφου. Παρακαλώ δοκιμάστε ξανά.';
        }
      });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getTemplateDescription(templateId: string): string {
    const template = this.templates.find(t => t.id === templateId);
    return template?.description || '';
  }
}