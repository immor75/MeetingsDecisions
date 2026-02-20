// services/document.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DocumentExtractionResponse,
  GenerateDecisionRequest,
  TemplateBookmark,
  DecisionTemplate
} from '../models/document.models';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) {}

  extractProposal(file: File, templateId: string): Observable<DocumentExtractionResponse> {
    const formData = new FormData();
    formData.append('File', file);
    formData.append('TemplateId', templateId);

    return this.http.post<DocumentExtractionResponse>(
      `${this.apiUrl}/proposals/extract`,
      formData
    );
  }

  generateDecision(request: GenerateDecisionRequest): Observable<Blob> {
    return this.http.post(
      `${this.apiUrl}/decisions/generate`,
      request,
      { responseType: 'blob' }
    );
  }

  previewDecision(request: GenerateDecisionRequest): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/decisions/preview`,
      request,
      { responseType: 'text' }
    );
  }

  getTemplateBookmarks(templateId: string): Observable<TemplateBookmark[]> {
    return this.http.get<TemplateBookmark[]>(
      `${this.apiUrl}/templates/${templateId}/bookmarks`
    );
  }

  getTemplates(): Observable<DecisionTemplate[]> {
    return this.http.get<DecisionTemplate[]>(`${this.apiUrl}/templates`);
  }

  downloadDocument(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}