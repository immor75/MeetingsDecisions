// services/mapping.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ContentMapping } from '../models/document.models';

@Injectable({
  providedIn: 'root'
})
export class MappingService {
  private mappings = new BehaviorSubject<ContentMapping[]>([]);
  public mappings$: Observable<ContentMapping[]> = this.mappings.asObservable();

  addMapping(mapping: ContentMapping): void {
    const current = this.mappings.value;
    const updated = [...current, mapping];
    this.mappings.next(updated);
  }

  removeMapping(sourceSectionId: string): void {
    const current = this.mappings.value;
    const updated = current.filter(m => m.sourceSectionId !== sourceSectionId);
    this.mappings.next(updated);
  }

  updateMapping(sourceSectionId: string, updates: Partial<ContentMapping>): void {
    const current = this.mappings.value;
    const updated = current.map(m =>
      m.sourceSectionId === sourceSectionId
        ? { ...m, ...updates }
        : m
    );
    this.mappings.next(updated);
  }

  getMappings(): ContentMapping[] {
    return this.mappings.value;
  }

  clearMappings(): void {
    this.mappings.next([]);
  }

  hasMappingForSection(sectionId: string): boolean {
    return this.mappings.value.some(m => m.sourceSectionId === sectionId);
  }

  getMappingForSection(sectionId: string): ContentMapping | undefined {
    return this.mappings.value.find(m => m.sourceSectionId === sectionId);
  }
}