import { Routes } from '@angular/router';
import { DocumentUploadComponent } from './components/document-upload/document-upload.component';
import { SectionMapperComponent } from './components/section-mapper/section-mapper.component';
import { DecisionGeneratorComponent } from './components/decision-generator/decision-generator.component';
import { HomeComponent } from './components/home/home.component';
import { EditorSetupComponent } from './components/editor-setup/editor-setup.component';
import { CollaboraEditorComponent } from './components/collabora-editor/collabora-editor.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'upload', component: DocumentUploadComponent },
  { path: 'mapper', component: SectionMapperComponent },
  { path: 'generator', component: DecisionGeneratorComponent },
  { path: 'editor-setup', component: EditorSetupComponent },
  { path: 'editor/:id', component: CollaboraEditorComponent },
  { path: '**', redirectTo: '' }
];