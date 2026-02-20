// components/decision-generator/decision-generator.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DocumentUploadComponent } from '../document-upload/document-upload.component';
import { SectionMapperComponent } from '../section-mapper/section-mapper.component';
import { CollaboraEditorComponent } from '../collabora-editor/collabora-editor.component';
import { DocumentService } from '../../services/document.service';
import { MappingService } from '../../services/mapping.service';
import {
  DocumentExtractionResponse,
  DocumentSection,
  TemplateBookmark,
  GenerateDecisionRequest
} from '../../models/document.models';

@Component({
  selector: 'app-decision-generator',
  standalone: true,
  imports: [CommonModule, DocumentUploadComponent, SectionMapperComponent, CollaboraEditorComponent],
  template: `
    <div class="generator-container">
      <header class="app-header">
        <h1>📋 Γεννήτρια Εγγράφων Αποφάσεων</h1>
        <p>Αυτόματη δημιουργία αποφάσεων από εισηγήσεις</p>
      </header>

      <!-- Step 1: Upload -->
      <div class="step" [class.completed]="currentStep > 1" [class.active]="currentStep === 1">
        <div class="step-header" (click)="goToStep(1)">
          <span class="step-number">1</span>
          <div class="step-info">
            <h2>Ανέβασμα Εισήγησης</h2>
            <p class="step-desc">Επιλέξτε το αρχείο εισήγησης και το πρότυπο</p>
          </div>
          <span class="step-status" *ngIf="currentStep > 1">✓</span>
        </div>

        <div class="step-content" *ngIf="currentStep === 1">
          <app-document-upload
            (extractionComplete)="onExtractionComplete($event)">
          </app-document-upload>
        </div>
      </div>

      <!-- Step 2: Mapping -->
      <div class="step" [class.completed]="currentStep > 2" [class.active]="currentStep === 2">
        <div class="step-header" (click)="goToStep(2)">
          <span class="step-number">2</span>
          <div class="step-info">
            <h2>Αντιστοίχιση Περιεχομένου</h2>
            <p class="step-desc">Επιλέξτε ποια τμήματα θα μεταφερθούν στην απόφαση</p>
          </div>
          <span class="step-status" *ngIf="currentStep > 2">✓</span>
        </div>

        <div class="step-content" *ngIf="currentStep === 2 && extractedData">
          <app-section-mapper
            [sections]="extractedData.sections"
            [bookmarks]="templateBookmarks">
          </app-section-mapper>

          <div class="navigation-buttons">
            <button (click)="goBack()" class="btn btn-secondary">
              ← Επιστροφή
            </button>
            <button
              (click)="proceedToPreview()"
              [disabled]="!hasMappings()"
              class="btn btn-primary">
              Συνέχεια στην Προεπισκόπηση →
            </button>
          </div>

          <div *ngIf="!hasMappings()" class="info-message">
            ℹ️ Προσθέστε τουλάχιστον μία αντιστοίχιση για να συνεχίσετε
          </div>
        </div>
      </div>

      <!-- Step 3: Preview & Generate -->
      <div class="step" [class.active]="currentStep === 3">
        <div class="step-header">
          <span class="step-number">3</span>
          <div class="step-info">
            <h2>Προεπισκόπηση & Δημιουργία</h2>
            <p class="step-desc">Ελέγξτε το αποτέλεσμα και δημιουργήστε την απόφαση</p>
          </div>
        </div>

        <div class="step-content" *ngIf="currentStep === 3">
          <div class="preview-actions">
            <button
              (click)="previewDocument()"
              [disabled]="isPreviewLoading"
              class="btn btn-outline">
              <span *ngIf="!isPreviewLoading">👁️ Προεπισκόπηση</span>
              <span *ngIf="isPreviewLoading">
                <span class="spinner"></span> Φόρτωση...
              </span>
            </button>

            <button
              (click)="generateDocument()"
              [disabled]="isGenerating"
              class="btn btn-success">
              <span *ngIf="!isGenerating">📄 Δημιουργία Απόφασης</span>
              <span *ngIf="isGenerating">
                <span class="spinner"></span> Δημιουργία...
              </span>
            </button>

            <button
              *ngIf="lastGeneratedDocumentId"
              (click)="editOnline()"
              class="btn btn-edit">
              ✏️ Επεξεργασία Online
            </button>
          </div>

          <app-collabora-editor
            *ngIf="showCollaboraEditor"
            [documentId]="lastGeneratedDocumentId"
            [documentName]="'Απόφαση_' + lastGeneratedDocumentId + '.docx'">
          </app-collabora-editor>

          <div *ngIf="previewHtml" class="preview-container">
            <div class="preview-header">
              <h3>👁️ Προεπισκόπηση Εγγράφου</h3>
              <button (click)="closePreview()" class="btn-close">✕</button>
            </div>
            <div class="preview-frame" [innerHTML]="previewHtml"></div>
          </div>

          <div class="navigation-buttons">
            <button (click)="goBack()" class="btn btn-secondary">
              ← Επιστροφή
            </button>
          </div>

          <div *ngIf="generationSuccess" class="alert alert-success">
            ✓ Η απόφαση δημιουργήθηκε και κατέβηκε επιτυχώς!
          </div>

          <div *ngIf="generationError" class="alert alert-error">
            ⚠️ {{ generationError }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .generator-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 30px 20px;
      min-height: 100vh;
    }

    .app-header {
      text-align: center;
      margin-bottom: 40px;
      padding: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      color: white;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
    }

    .app-header h1 {
      margin: 0 0 10px 0;
      font-size: 36px;
      font-weight: 700;
    }

    .app-header p {
      margin: 0;
      font-size: 16px;
      opacity: 0.9;
    }

    .step {
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      margin-bottom: 24px;
      overflow: hidden;
      transition: all 0.3s;
    }

    .step.active {
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
      border: 3px solid #667eea;
    }

    .step.completed {
      opacity: 0.9;
    }

    .step.completed .step-header {
      background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
    }

    .step-header {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px;
      background: #f8f9fa;
      cursor: pointer;
      transition: all 0.3s;
      user-select: none;
    }

    .step-header:hover {
      background: #e9ecef;
    }

    .step.active .step-header {
      background: linear-gradient(135deg, #ebf5fb 0%, #d6eaf8 100%);
    }

    .step-number {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #6c757d;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 22px;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .step.active .step-number {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      animation: pulse 2s infinite;
    }

    .step.completed .step-number {
      background: #28a745;
    }

    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
      }
      50% {
        box-shadow: 0 4px 16px rgba(102, 126, 234, 0.6);
      }
    }

    .step-info {
      flex: 1;
    }

    .step-info h2 {
      margin: 0 0 5px 0;
      font-size: 22px;
      color: #2c3e50;
    }

    .step-desc {
      margin: 0;
      font-size: 14px;
      color: #7f8c8d;
    }

    .step-status {
      font-size: 32px;
      color: #28a745;
    }

    .step-content {
      padding: 24px;
    }

    .navigation-buttons {
      display: flex;
      justify-content: space-between;
      gap: 15px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 2px solid #ecf0f1;
    }

    .navigation-buttons .btn {
      flex: 1;
      max-width: 250px;
    }

    .preview-actions {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
    }

    .preview-actions .btn {
      flex: 1;
    }

    .btn {
      padding: 14px 28px;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background: #95a5a6;
      color: white;
    }

    .btn-secondary:hover {
      background: #7f8c8d;
      transform: translateY(-2px);
    }

    .btn-success {
      background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(46, 204, 113, 0.4);
    }

    .btn-edit {
      background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
      color: white;
    }

    .btn-edit:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(243, 156, 18, 0.4);
    }

    .btn-outline {
      background: white;
      border: 3px solid #3498db;
      color: #3498db;
    }

    .btn-outline:hover:not(:disabled) {
      background: #3498db;
      color: white;
      transform: translateY(-2px);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 3px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .preview-container {
      margin-top: 20px;
      border: 3px solid #3498db;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(52, 152, 219, 0.2);
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      color: white;
    }

    .preview-header h3 {
      margin: 0;
      font-size: 18px;
    }

    .btn-close {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 20px;
      transition: all 0.3s;
    }

    .btn-close:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    .preview-frame {
      padding: 30px;
      background: white;
      min-height: 400px;
      max-height: 600px;
      overflow-y: auto;
    }

    .alert {
      padding: 16px 20px;
      border-radius: 10px;
      margin-top: 20px;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .alert-success {
      background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
      color: #155724;
      border: 2px solid #28a745;
    }

    .alert-error {
      background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
      color: #721c24;
      border: 2px solid #e74c3c;
    }

    .info-message {
      margin-top: 15px;
      padding: 12px 16px;
      background: #fff3cd;
      color: #856404;
      border-radius: 8px;
      border-left: 4px solid #ffc107;
      font-size: 14px;
    }

    @media (max-width: 768px) {
      .generator-container {
        padding: 15px 10px;
      }

      .app-header h1 {
        font-size: 24px;
      }

      .step-header {
        padding: 16px;
      }

      .step-number {
        width: 40px;
        height: 40px;
        font-size: 18px;
      }

      .step-info h2 {
        font-size: 18px;
      }

      .navigation-buttons {
        flex-direction: column;
      }

      .navigation-buttons .btn {
        max-width: 100%;
      }

      .preview-actions {
        flex-direction: column;
      }
    }
  `]
})
export class DecisionGeneratorComponent {
  currentStep: number = 1;
  extractedData: DocumentExtractionResponse | null = null;
  templateBookmarks: TemplateBookmark[] = [];
  previewHtml: string = '';
  isPreviewLoading: boolean = false;
  isGenerating: boolean = false;
  generationSuccess: boolean = false;
  generationError: string = '';
  lastGeneratedDocumentId: string = '';
  showCollaboraEditor: boolean = false;

  constructor(
    private documentService: DocumentService,
    private mappingService: MappingService
  ) {}

  onExtractionComplete(data: DocumentExtractionResponse): void {
    console.log('Extraction complete:', data);
    console.log('Sections count:', data.sections?.length);
    console.log('First section:', data.sections?.[0]);
    console.log('Available bookmarks:', data.availableBookmarks);

    this.extractedData = data;

    // Load template bookmarks
    this.documentService.getTemplateBookmarks('default').subscribe({
      next: (bookmarks) => {
        console.log('Bookmarks loaded:', bookmarks);
        this.templateBookmarks = bookmarks;
        this.currentStep = 2;
      },
      error: (err) => {
        console.error('Error loading bookmarks', err);
        alert('Σφάλμα κατά τη φόρτωση των bookmarks του template');
      }
    });
  }

  hasMappings(): boolean {
    return this.mappingService.getMappings().length > 0;
  }

  proceedToPreview(): void {
    if (this.hasMappings()) {
      this.currentStep = 3;
    }
  }

  goBack(): void {
    if (this.currentStep > 1) {
      this.currentStep--;

      if (this.currentStep === 1) {
        // Reset state
        this.extractedData = null;
        this.templateBookmarks = [];
        this.previewHtml = '';
        this.mappingService.clearMappings();
        this.generationSuccess = false;
        this.generationError = '';
      }
    }
  }

  goToStep(step: number): void {
    // Only allow going back to completed steps
    if (step < this.currentStep) {
      this.currentStep = step;
    }
  }

  closePreview(): void {
    this.previewHtml = '';
  }

  previewDocument(): void {
    this.isPreviewLoading = true;
    this.previewHtml = '';
    this.generationError = '';

    const request = this.buildGenerateRequest();

    this.documentService.previewDecision(request).subscribe({
      next: (html) => {
        this.previewHtml = html;
        this.isPreviewLoading = false;
      },
      error: (err) => {
        console.error('Preview error', err);
        this.isPreviewLoading = false;
        this.generationError = 'Σφάλμα κατά την προεπισκόπηση του εγγράφου';
      }
    });
  }

  generateDocument(): void {
    this.isGenerating = true;
    this.generationSuccess = false;
    this.generationError = '';

    const request = this.buildGenerateRequest();

    this.documentService.generateDecision(request).subscribe({
      next: (blob) => {
        this.isGenerating = false;
        this.generationSuccess = true;

        // Save the document ID for editing
        this.lastGeneratedDocumentId = request.metadata['DOCUMENT_ID'] ||
                                        `temp_${Date.now()}`;

        // Download the file
        const filename = `Αποφαση_${request.meetingId}_${this.formatDate(new Date())}.docx`;
        this.documentService.downloadDocument(blob, filename);

        // Show success message for 5 seconds
        setTimeout(() => {
          this.generationSuccess = false;
        }, 5000);
      },
      error: (err) => {
        console.error('Generation error', err);
        this.isGenerating = false;
        this.generationError = 'Σφάλμα κατά τη δημιουργία του εγγράφου. Παρακαλώ δοκιμάστε ξανά.';
      }
    });
  }

  editOnline(): void {
    this.showCollaboraEditor = true;
  }

  private buildGenerateRequest(): GenerateDecisionRequest {
    return {
      meetingId: 1, // TODO: Get from actual meeting context
      templateId: 'default',
      mappings: this.mappingService.getMappings(),
      metadata: {
        'MEETING_DATE': this.formatDate(new Date()),
        'DECISION_NUMBER': 'ΑΠ-' + Math.floor(Math.random() * 1000),
        'YEAR': new Date().getFullYear().toString(),
        'DOCUMENT_ID': this.extractedData?.documentId || '' // Pass the document ID
      }
    };
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('el-GR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
