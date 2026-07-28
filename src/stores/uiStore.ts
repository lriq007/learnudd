import { create } from 'zustand';

interface UIState {
  searchQuery: string;
  activeTab: 'notes' | 'tutors';
  filters: {
    major: string;
    course: string;
    semester: string;
    materialType: string;
    minRating: number;
    maxPrice: number;
  };
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: 'notes' | 'tutors') => void;
  setFilters: (filters: Partial<UIState['filters']>) => void;
  resetFilters: () => void;
}

const defaultFilters = {
  major: '',
  course: '',
  semester: '',
  materialType: '',
  minRating: 0,
  maxPrice: 100000,
};

export const useUIStore = create<UIState>((set) => ({
  searchQuery: '',
  activeTab: 'notes',
  filters: defaultFilters,
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  resetFilters: () => set({ filters: defaultFilters }),
}));
