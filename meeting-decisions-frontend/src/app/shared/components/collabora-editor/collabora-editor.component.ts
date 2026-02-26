import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-collabora-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './collabora-editor.component.html',
  styleUrl: './collabora-editor.component.css'
})
export class CollaboraEditorComponent implements OnInit, AfterViewInit {
  @Input() fileId!: string;           // ID του εγγράφου
  @Input() fileName!: string;         // π.χ. "Απόφαση 12-2024.docx"
  @Input() readOnly: boolean = false; // view-only mode για μέλη ΣΟ

  @ViewChild('wopiForm') wopiForm!: ElementRef<HTMLFormElement>;

  collaboraUrl = '';
  accessToken = '';
  accessTokenTtl = 0;
  wopiSrcUrl = '';
  isLoading = true;
  error = '';

  // Τα URLs που κοινοποιείς μέσω environment
  private wopiHostUrl = `${window.location.protocol}//${window.location.hostname}:5000/wopi/files`; // Ο δικός σου backend

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.initEditor();
  }

  ngAfterViewInit(): void {
    // Το form submit γίνεται μετά τη φόρτωση των URLs
  }

  private initEditor(): void {
    // 1. Πάρε access token από backend
    this.http.post<{ token: string; ttl: number }>(
      `/api/documents/${this.fileId}/wopi-token`, {}
    ).subscribe({
      next: ({ token, ttl }) => {
        this.accessToken = token;
        this.accessTokenTtl = ttl;
        this.wopiSrcUrl = `${this.wopiHostUrl}/${this.fileId}`;

        // 2. Κατασκεύασε το Collabora URL από το discovery endpoint
        this.buildCollaboraUrl();
      },
      error: () => { this.error = 'Αδυναμία φόρτωσης εγγράφου.'; this.isLoading = false; }
    });
  }

  private buildCollaboraUrl(): void {
    // Το Collabora discovery endpoint επιστρέφει ποιο URL ανοίγει .docx αρχεία
    const action = this.readOnly ? 'view' : 'edit';

    // Συνήθως αυτό το κάνεις από backend για να μην εκθέτεις το Collabora URL
    // Εδώ simplified:
    this.http.get<{ editorUrl: string }>(
      `/api/documents/collabora-editor-url?fileId=${this.fileId}&action=${action}`
    ).subscribe({
      next: ({ editorUrl }) => {
        this.collaboraUrl = editorUrl;
        this.isLoading = false;
        // Submit form για να φορτωθεί το Collabora
        setTimeout(() => this.wopiForm?.nativeElement.submit(), 100);
      },
      error: () => { this.error = 'Αδυναμία επικοινωνίας με Collabora.'; this.isLoading = false; }
    });
  }
}