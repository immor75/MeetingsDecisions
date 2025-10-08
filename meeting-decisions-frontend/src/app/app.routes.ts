import { Routes } from '@angular/router';
import { DocumentUploadComponent } from './components/document-upload/document-upload.component';
import { SectionMapperComponent } from './components/section-mapper/section-mapper.component';
import { DecisionGeneratorComponent } from './components/decision-generator/decision-generator.component';

export const routes: Routes = [
  { path: '', redirectTo: '/upload', pathMatch: 'full' },
  { path: 'upload', component: DocumentUploadComponent },
  { path: 'mapper', component: SectionMapperComponent },
  { path: 'generator', component: DecisionGeneratorComponent },
  { path: '**', redirectTo: '/upload' }
];