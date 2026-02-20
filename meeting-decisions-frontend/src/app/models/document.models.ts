// models/document.models.ts

export interface DocumentSection {
  id: string;
  content: string;
  htmlContent: string;
  type: 'Paragraph' | 'Table' | 'List' | 'Heading' | 'Image';
  orderIndex: number;
  hasFormatting: boolean;
  styles: string[];
  isSelected?: boolean;
}

export interface ContentMapping {
  sourceSectionId: string;
  targetBookmark: string;
  preserveFormatting: boolean;
  editedContent?: string;
  orderIndex: number;
}

export interface TemplateBookmark {
  name: string;
  displayName: string;
  description: string;
  isRequired: boolean;
}

export interface GenerateDecisionRequest {
  meetingId: number;
  templateId: string;
  mappings: ContentMapping[];
  metadata: { [key: string]: string };
}

export interface DocumentExtractionResponse {
  documentId: string;
  sections: DocumentSection[];
  availableBookmarks: string[];
  documentMetadata: { [key: string]: string };
}

export interface DecisionTemplate {
  id: string;
  name: string;
  description: string;
  createdDate: Date;
}