import { Injectable, signal } from '@angular/core';

// Ported from src/stores/uiStore.ts (Zustand) to an injectable signal-based
// service.
export type UiTab = 'notes' | 'tutors';

export interface UiFilters {
  major: string;
  course: string;
  semester: string;
  materialType: string;
  minRating: number;
  maxPrice: number;
}

const defaultFilters: UiFilters = {
  major: '',
  course: '',
  semester: '',
  materialType: '',
  minRating: 0,
  maxPrice: 100000,
};

@Injectable({ providedIn: 'root' })
export class UiService {
  private readonly _searchQuery = signal('');
  private readonly _activeTab = signal<UiTab>('notes');
  private readonly _filters = signal<UiFilters>({ ...defaultFilters });

  readonly searchQuery = this._searchQuery.asReadonly();
  readonly activeTab = this._activeTab.asReadonly();
  readonly filters = this._filters.asReadonly();

  setSearchQuery(query: string): void {
    this._searchQuery.set(query);
  }

  setActiveTab(tab: UiTab): void {
    this._activeTab.set(tab);
  }

  setFilters(newFilters: Partial<UiFilters>): void {
    this._filters.update((filters) => ({ ...filters, ...newFilters }));
  }

  resetFilters(): void {
    this._filters.set({ ...defaultFilters });
  }
}
