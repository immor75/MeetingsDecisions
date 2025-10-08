// components/section-mapper/section-mapper.component.ts

import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { DocumentSection, ContentMapping, TemplateBookmark } from '../../models/document.models';
import { MappingService } from '../../services/mapping.service';

@Component({
  selector: 'app-section-mapper',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="mapper-container">
      <h2>🔗 Αντιστοίχιση Περιεχομένου</h2>

      <div class="mapper-layout">
        <!-- Αριστερή στήλη - Sections από εισήγηση -->
        <div class="source-panel">
          <h3>📋 Περιεχόμενο Εισήγησης</h3>

          <div class="search-box">
            <input
              type="text"
              [(ngModel)]="searchText"
              (ngModelChange)="filterSections()"
              placeholder="🔍 Αναζήτηση..."
              class="form-control">
          </div>

          <div class="sections-count">
            {{ filteredSections.length }} από {{ sections.length }} τμήματα
          </div>

          <div
            cdkDropList
            #sourceList="cdkDropList"
            [cdkDropListData]="filteredSections"
            class="sections-list">

            <div
              *ngFor="let section of filteredSections"
              cdkDrag
              class="section-item"
              [class.mapped]="isMapped(section.id)"
              [class.selected]="selectedSection?.id === section.id"
              (click)="selectSection(section)">

              <div class="section-header">
                <span class="section-type-badge" [ngClass]="'type-' + section.type.toLowerCase()">
                  {{ section.type }}
                </span>
                <span *ngIf="isMapped(section.id)" class="mapped-badge">✓</span>
              </div>

              <div class="section-content" [innerHTML]="section.htmlContent"></div>

              <div class="section-actions" *ngIf="!isMapped(section.id)">
                <button
                  (click)="quickMap(section, $event)"
                  class="btn btn-sm btn-outline"
                  [disabled]="!hasAvailableBookmark()">
                  Γρήγορη Αντιστοίχιση
                </button>
              </div>

              <div class="section-actions" *ngIf="isMapped(section.id)">
                <button
                  (click)="removeMapping(section.id, $event)"
                  class="btn btn-sm btn-danger">
                  Αφαίρεση
                </button>
              </div>
            </div>

            <div *ngIf="filteredSections.length === 0" class="empty-state">
              <p>Δεν βρέθηκαν τμήματα</p>
            </div>
          </div>
        </div>

        <!-- Κεντρική στήλη - Mapping Controls -->
        <div class="mapping-controls" *ngIf="selectedSection">
          <h3>⚙️ Ρυθμίσεις</h3>

          <div class="selected-preview-box">
            <label>Επιλεγμένο Τμήμα:</label>
            <div class="selected-preview" [innerHTML]="selectedSection.htmlContent"></div>
          </div>

          <div class="form-group">
            <label for="target-bookmark">📍 Θέση στην Απόφαση:</label>
            <select
              id="target-bookmark"
              [(ngModel)]="selectedBookmark"
              class="form-control">
              <option value="">-- Επιλέξτε Θέση --</option>
              <option
                *ngFor="let bookmark of availableBookmarks"
                [value]="bookmark.name"
                [disabled]="isBookmarkUsed(bookmark.name)">
                {{ bookmark.displayName }}
                <span *ngIf="bookmark.isRequired">*</span>
                <span *ngIf="isBookmarkUsed(bookmark.name)">✓</span>
              </option>
            </select>
            <small class="form-text" *ngIf="selectedBookmark">
              {{ getBookmarkDescription(selectedBookmark) }}
            </small>
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                [(ngModel)]="preserveFormatting">
              <span>🎨 Διατήρηση Μορφοποίησης</span>
            </label>
          </div>

          <div class="form-group">
            <label>✏️ Επεξεργασία Κειμένου (προαιρετικό):</label>
            <textarea
              [(ngModel)]="editedContent"
              placeholder="Αφήστε κενό για αυτούσιο κείμενο ή επεξεργαστείτε..."
              rows="4"
              class="form-control"></textarea>
          </div>

          <div class="action-buttons">
            <button
              (click)="addMapping()"
              [disabled]="!selectedBookmark"
              class="btn btn-primary">
              ✅ Προσθήκη
            </button>
            <button
              (click)="clearSelection()"
              class="btn btn-secondary">
              ❌ Ακύρωση
            </button>
          </div>
        </div>

        <div class="mapping-controls empty-selection" *ngIf="!selectedSection">
          <div class="empty-state">
            <p>👈 Επιλέξτε ένα τμήμα από τα αριστερά</p>
          </div>
        </div>

        <!-- Δεξιά στήλη - Mapped Content -->
        <div class="target-panel">
          <h3>📝 Αντιστοιχίσεις</h3>

          <div class="bookmarks-list">
            <div
              *ngFor="let mapping of currentMappings; let i = index"
              class="bookmark-item">

              <div class="bookmark-header">
                <span class="bookmark-number">{{ i + 1 }}</span>
                <strong>{{ getBookmarkDisplayName(mapping.targetBookmark) }}</strong>
                <button
                  (click)="removeMapping(mapping.sourceSectionId, $event)"
                  class="btn-icon">
                  ✕
                </button>
              </div>

              <div class="bookmark-content">
                <div class="mapped-section-preview">
                  {{ getMappedSectionPreview(mapping.sourceSectionId) }}
                </div>
                <div class="mapping-options">
                  <span *ngIf="mapping.preserveFormatting" class="option-badge">🎨 Μορφοποίηση</span>
                  <span *ngIf="mapping.editedContent" class="option-badge">✏️ Επεξεργασμένο</span>
                </div>
              </div>
            </div>

            <div *ngIf="currentMappings.length === 0" class="empty-state">
              <p>Δεν υπάρχουν αντιστοιχίσεις ακόμα</p>
              <small>Επιλέξτε τμήματα και προσθέστε τα σε θέσεις</small>
            </div>
          </div>

          <div class="summary" *ngIf="currentMappings.length > 0">
            <strong>Σύνολο:</strong> {{ currentMappings.length }} αντιστοιχίσεις
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mapper-container {
      padding: 20px;
      background: #f8f9fa;
      border-radius: 12px;
    }

    h2 {
      margin: 0 0 25px 0;
      color: #2c3e50;
      font-size: 24px;
    }

    .mapper-layout {
      display: grid;
      grid-template-columns: 2fr 1.5fr 2fr;
      gap: 20px;
    }

    .source-panel, .target-panel, .mapping-controls {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-height: 700px;
      display: flex;
      flex-direction: column;
    }

    h3 {
      margin: 0 0 15px 0;
      font-size: 18px;
      color: #34495e;
      border-bottom: 2px solid #ecf0f1;
      padding-bottom: 10px;
    }

    .search-box {
      margin-bottom: 10px;
    }

    .sections-count {
      font-size: 12px;
      color: #7f8c8d;
      margin-bottom: 10px;
      padding: 5px 10px;
      background: #ecf0f1;
      border-radius: 4px;
      text-align: center;
    }

    .form-control {
      width: 100%;
      padding: 10px;
      border: 2px solid #dfe6e9;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.3s;
    }

    .form-control:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }

    .sections-list, .bookmarks-list {
      flex: 1;
      overflow-y: auto;
      margin-top: 10px;
    }

    .section-item, .bookmark-item {
      background: #f8f9fa;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .section-item:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }

    .section-item.selected {
      border-color: #3498db;
      background: #ebf5fb;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }

    .section-item.mapped {
      opacity: 0.7;
      background: #d5f4e6;
      border-color: #27ae60;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .section-type-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .type-paragraph { background: #3498db; color: white; }
    .type-heading { background: #2ecc71; color: white; }
    .type-table { background: #f39c12; color: white; }
    .type-list { background: #e74c3c; color: white; }

    .mapped-badge {
      background: #27ae60;
      color: white;
      padding: 3px 8px;
      border-radius: 50%;
      font-size: 12px;
      font-weight: bold;
    }

    .section-content {
      font-size: 13px;
      line-height: 1.6;
      margin-bottom: 10px;
      max-height: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #2c3e50;
    }

    .section-actions {
      display: flex;
      gap: 8px;
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

    .checkbox-group label {
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    .checkbox-group input[type="checkbox"] {
      width: 18px;
      height: 18px;
      margin-right: 8px;
      cursor: pointer;
    }

    .form-text {
      display: block;
      margin-top: 5px;
      font-size: 12px;
      color: #7f8c8d;
      font-style: italic;
    }

    .selected-preview-box {
      margin-bottom: 20px;
    }

    .selected-preview {
      padding: 12px;
      background: #f8f9fa;
      border: 2px solid #dee2e6;
      border-radius: 8px;
      font-size: 13px;
      max-height: 120px;
      overflow-y: auto;
      line-height: 1.6;
    }

    textarea.form-control {
      resize: vertical;
      font-family: inherit;
    }

    .btn {
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
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

    .btn-secondary {
      background: #95a5a6;
      color: white;
    }

    .btn-secondary:hover {
      background: #7f8c8d;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }

    .btn-outline {
      background: white;
      border: 2px solid #3498db;
      color: #3498db;
    }

    .btn-outline:hover:not(:disabled) {
      background: #3498db;
      color: white;
    }

    .btn-danger {
      background: #e74c3c;
      color: white;
    }

    .btn-danger:hover {
      background: #c0392b;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    .action-buttons {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .action-buttons .btn {
      flex: 1;
    }

    .bookmark-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }

    .bookmark-number {
      background: #3498db;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
    }

    .bookmark-header strong {
      flex: 1;
      color: #2c3e50;
      font-size: 14px;
    }

    .btn-icon {
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

    .btn-icon:hover {
      background: #c0392b;
      transform: scale(1.1);
    }

    .bookmark-content {
      font-size: 13px;
    }

    .mapped-section-preview {
      color: #7f8c8d;
      margin-bottom: 8px;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .mapping-options {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .option-badge {
      background: #ecf0f1;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      color: #34495e;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #95a5a6;
    }

    .empty-state p {
      margin: 0 0 5px 0;
      font-size: 16px;
    }

    .empty-state small {
      font-size: 12px;
    }

    .empty-selection {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .summary {
      margin-top: 15px;
      padding: 12px;
      background: #ecf0f1;
      border-radius: 8px;
      text-align: center;
      font-size: 14px;
    }

    .cdk-drag-preview {
      opacity: 0.8;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      border-radius: 8px;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    /* Scrollbar styling */
    .sections-list::-webkit-scrollbar,
    .bookmarks-list::-webkit-scrollbar {
      width: 8px;
    }

    .sections-list::-webkit-scrollbar-track,
    .bookmarks-list::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }

    .sections-list::-webkit-scrollbar-thumb,
    .bookmarks-list::-webkit-scrollbar-thumb {
      background: #bdc3c7;
      border-radius: 4px;
    }

    .sections-list::-webkit-scrollbar-thumb:hover,
    .bookmarks-list::-webkit-scrollbar-thumb:hover {
      background: #95a5a6;
    }

    @media (max-width: 1200px) {
      .mapper-layout {
        grid-template-columns: 1fr;
        gap: 15px;
      }

      .source-panel, .target-panel, .mapping-controls {
        max-height: 500px;
      }
    }
  `]
})
export class SectionMapperComponent implements OnInit {
  @Input() sections: DocumentSection[] = [];
  @Input() bookmarks: TemplateBookmark[] = [];

  filteredSections: DocumentSection[] = [];
  availableBookmarks: TemplateBookmark[] = [];
  currentMappings: ContentMapping[] = [];

  selectedSection: DocumentSection | null = null;
  selectedBookmark: string = '';
  preserveFormatting: boolean = true;
  editedContent: string = '';
  searchText: string = '';

  constructor(private mappingService: MappingService) {}

  ngOnInit(): void {
    this.filteredSections = [...this.sections];
    this.availableBookmarks = [...this.bookmarks];

    this.mappingService.mappings$.subscribe(mappings => {
      this.currentMappings = mappings;
    });
  }

  filterSections(): void {
    if (!this.searchText) {
      this.filteredSections = [...this.sections];
      return;
    }

    const search = this.searchText.toLowerCase();
    this.filteredSections = this.sections.filter(s =>
      s.content.toLowerCase().includes(search)
    );
  }

  selectSection(section: DocumentSection): void {
    this.selectedSection = section;
    this.editedContent = '';

    // Auto-select first available bookmark if none selected
    if (!this.selectedBookmark) {
      const available = this.availableBookmarks.find(b => !this.isBookmarkUsed(b.name));
      if (available) {
        this.selectedBookmark = available.name;
      }
    }
  }

  addMapping(): void {
    if (!this.selectedSection || !this.selectedBookmark) return;

    const mapping: ContentMapping = {
      sourceSectionId: this.selectedSection.id,
      targetBookmark: this.selectedBookmark,
      preserveFormatting: this.preserveFormatting,
      editedContent: this.editedContent || undefined,
      orderIndex: this.currentMappings.length
    };

    this.mappingService.addMapping(mapping);
    this.clearSelection();
  }

  quickMap(section: DocumentSection, event: Event): void {
    event.stopPropagation();

    const availableBookmark = this.availableBookmarks.find(
      b => !this.isBookmarkUsed(b.name)
    );

    if (availableBookmark) {
      const mapping: ContentMapping = {
        sourceSectionId: section.id,
        targetBookmark: availableBookmark.name,
        preserveFormatting: true,
        orderIndex: this.currentMappings.length
      };

      this.mappingService.addMapping(mapping);
    }
  }

  removeMapping(sectionId: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.mappingService.removeMapping(sectionId);
  }

  clearSelection(): void {
    this.selectedSection = null;
    this.selectedBookmark = '';
    this.editedContent = '';
  }

  isMapped(sectionId: string): boolean {
    return this.mappingService.hasMappingForSection(sectionId);
  }

  isBookmarkUsed(bookmarkName: string): boolean {
    return this.currentMappings.some(m => m.targetBookmark === bookmarkName);
  }

  hasAvailableBookmark(): boolean {
    return this.availableBookmarks.some(b => !this.isBookmarkUsed(b.name));
  }

  getBookmarkDisplayName(bookmarkName: string): string {
    const bookmark = this.bookmarks.find(b => b.name === bookmarkName);
    return bookmark?.displayName || bookmarkName;
  }

  getBookmarkDescription(bookmarkName: string): string {
    const bookmark = this.bookmarks.find(b => b.name === bookmarkName);
    return bookmark?.description || '';
  }

  getMappedSectionPreview(sectionId: string): string {
    const section = this.sections.find(s => s.id === sectionId);
    if (!section) return '';

    const text = section.content;
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  }
}