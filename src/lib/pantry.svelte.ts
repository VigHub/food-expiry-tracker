import { browser } from '$app/environment';

// Fallback UUID v4 generator for non-secure contexts (e.g. HTTP on IP address)
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface FoodItem {
  id: string;
  name: string;
  expiryDate: string; // YYYY-MM-DD
  category: string;
  quantity?: string;
  notes?: string;
  barcode?: string;
  brand?: string;
  imageUrl?: string;
  addedDate: string; // YYYY-MM-DD
}

export const DEFAULT_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Meat',
  'Fish',
  'Dairy',
  'Bakery',
  'Pasta & Grains',
  'Leftovers',
  'Other'
];

export class PantryStore {
  // Reactive state using Svelte 5 runes
  items = $state<FoodItem[]>([]);
  customCategories = $state<string[]>([]);
  searchQuery = $state<string>('');
  selectedCategory = $state<string>('All');
  sortBy = $state<'expiry' | 'name' | 'added'>('expiry');

  constructor() {
    this.loadFromStorage();
  }

  // Helper to load data from localStorage on client side
  private loadFromStorage() {
    if (!browser) return;
    try {
      const storedItems = localStorage.getItem('smart_fridge_items');
      if (storedItems) {
        this.items = JSON.parse(storedItems);
      }
      
      const storedCats = localStorage.getItem('smart_fridge_custom_cats');
      if (storedCats) {
        this.customCategories = JSON.parse(storedCats);
      }
    } catch (e) {
      console.error('Failed to load pantry data from localStorage:', e);
    }
  }

  // Helper to save data to localStorage
  private saveToStorage() {
    if (!browser) return;
    try {
      localStorage.setItem('smart_fridge_items', JSON.stringify(this.items));
      localStorage.setItem('smart_fridge_custom_cats', JSON.stringify(this.customCategories));
    } catch (e) {
      console.error('Failed to save pantry data to localStorage:', e);
    }
  }

  // All categories (default + custom)
  allCategories = $derived(() => {
    return [...DEFAULT_CATEGORIES, ...this.customCategories];
  });

  // Add a new food item
  addItem(item: Omit<FoodItem, 'id' | 'addedDate'>) {
    const newItem: FoodItem = {
      ...item,
      id: generateUUID(),
      addedDate: new Date().toISOString().split('T')[0]
    };
    this.items.push(newItem);
    this.saveToStorage();
  }

  // Update an existing food item
  updateItem(id: string, updatedFields: Partial<Omit<FoodItem, 'id' | 'addedDate'>>) {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items[index] = { ...this.items[index], ...updatedFields };
      this.saveToStorage();
    }
  }

  // Delete a food item
  removeItem(id: string) {
    this.items = this.items.filter(item => item.id !== id);
    this.saveToStorage();
  }

  // Add a custom category if it doesn't exist already
  addCustomCategory(category: string) {
    const cleanCat = category.trim();
    if (!cleanCat) return;
    
    const allCats = [...DEFAULT_CATEGORIES, ...this.customCategories].map(c => c.toLowerCase());
    if (!allCats.includes(cleanCat.toLowerCase())) {
      // Capitalize first letter
      const formattedCat = cleanCat.charAt(0).toUpperCase() + cleanCat.slice(1);
      this.customCategories.push(formattedCat);
      this.saveToStorage();
    }
  }

  // Export pantry items as JSON string
  exportJSON(): string {
    const data = {
      items: this.items,
      customCategories: this.customCategories,
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  // Import pantry items from JSON
  importJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data && Array.isArray(data.items)) {
        this.items = data.items;
        if (Array.isArray(data.customCategories)) {
          this.customCategories = data.customCategories;
        }
        this.saveToStorage();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import JSON data:', e);
      return false;
    }
  }

  // Derived filtered items based on search and selected category
  filteredItems = $derived(() => {
    let result = [...this.items];

    // Filter by category
    if (this.selectedCategory !== 'All') {
      result = result.filter(item => item.category === this.selectedCategory);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      result = result.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          (item.brand && item.brand.toLowerCase().includes(query)) ||
          (item.notes && item.notes.toLowerCase().includes(query))
      );
    }

    // Sort items
    result.sort((a, b) => {
      if (this.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (this.sortBy === 'added') {
        return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
      }
      // Default: Expiry Date (soonest first)
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });

    return result;
  });

  // Derived stats
  stats = $derived(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr).getTime();
    const msInDay = 24 * 60 * 60 * 1000;

    let total = this.items.length;
    let expired = 0;
    let expiringSoon = 0; // within 3 days
    let fresh = 0;

    this.items.forEach(item => {
      const expiry = new Date(item.expiryDate).getTime();
      const diffDays = Math.ceil((expiry - today) / msInDay);

      if (diffDays < 0) {
        expired++;
      } else if (diffDays <= 3) {
        expiringSoon++;
      } else {
        fresh++;
      }
    });

    return { total, expired, expiringSoon, fresh };
  });

  // Helper to calculate days remaining for a specific item
  getDaysRemaining(expiryDate: string): number {
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);
    const expiry = new Date(expiryDate);
    
    // Reset hours to compare dates only
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}

// Global store instance to be shared across components
export const pantryStore = new PantryStore();
