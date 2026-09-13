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
	isSyncing = $state<boolean>(false);
	syncError = $state<string>('');
	hasLocalDataToMigrate = $state<boolean>(false);

	constructor() {
		if (browser) {
			this.checkLocalStorageMigrationNeeded();
			this.loadFromCloud();
		}
	}

	// Check if browser has legacy localStorage data that can be migrated to Cloudflare D1
	private checkLocalStorageMigrationNeeded() {
		if (!browser) return;
		try {
			const storedItems = localStorage.getItem('smart_fridge_items');
			if (storedItems) {
				const parsed = JSON.parse(storedItems);
				if (Array.isArray(parsed) && parsed.length > 0) {
					this.hasLocalDataToMigrate = true;
				}
			}
		} catch (e) {
			console.error('Error checking localStorage migration:', e);
		}
	}

	// Load data from Cloudflare D1 API backend
	async loadFromCloud() {
		if (!browser) return;
		this.isSyncing = true;
		this.syncError = '';

		try {
			const res = await fetch('/api/pantry');
			if (res.ok) {
				const data = await res.json();
				if (Array.isArray(data.items)) {
					this.items = data.items;
				}
				if (Array.isArray(data.customCategories)) {
					this.customCategories = data.customCategories;
				}
			} else if (res.status === 401) {
				// Fallback to local storage if unauthorized (will redirect to login)
				this.loadFromStorage();
			}
		} catch (e) {
			console.error('Failed to load pantry data from Cloudflare D1:', e);
			this.syncError = 'Errore di sincronizzazione cloud';
			this.loadFromStorage();
		} finally {
			this.isSyncing = false;
		}
	}

	// Migrate browser localStorage data to Cloudflare D1
	async syncLocalStorageToCloud(): Promise<boolean> {
		if (!browser) return false;
		this.isSyncing = true;

		try {
			const storedItemsStr = localStorage.getItem('smart_fridge_items');
			const storedCatsStr = localStorage.getItem('smart_fridge_custom_cats');

			const items: FoodItem[] = storedItemsStr ? JSON.parse(storedItemsStr) : [];
			const customCategories: string[] = storedCatsStr ? JSON.parse(storedCatsStr) : [];

			if (items.length === 0 && customCategories.length === 0) {
				this.hasLocalDataToMigrate = false;
				return true;
			}

			const res = await fetch('/api/pantry', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'bulk_sync',
					items,
					customCategories
				})
			});

			if (res.ok) {
				// Clear legacy local storage after successful sync to D1
				localStorage.removeItem('smart_fridge_items');
				localStorage.removeItem('smart_fridge_custom_cats');
				this.hasLocalDataToMigrate = false;
				await this.loadFromCloud();
				return true;
			}
			return false;
		} catch (e) {
			console.error('Migration failed:', e);
			return false;
		} finally {
			this.isSyncing = false;
		}
	}

	// Fallback load data from localStorage
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

	// All categories (default + custom)
	allCategories = $derived(() => {
		return [...DEFAULT_CATEGORIES, ...this.customCategories];
	});

	// Add a new food item
	async addItem(item: Omit<FoodItem, 'id' | 'addedDate'>) {
		const newItem: FoodItem = {
			...item,
			id: generateUUID(),
			addedDate: new Date().toISOString().split('T')[0]
		};

		// Optimistic UI update
		this.items.push(newItem);

		// Sync to Cloudflare D1
		if (browser) {
			try {
				await fetch('/api/pantry', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'add_item', item: newItem })
				});
			} catch (e) {
				console.error('Failed to save item to cloud D1:', e);
			}
		}
	}

	// Update an existing food item
	async updateItem(id: string, updatedFields: Partial<Omit<FoodItem, 'id' | 'addedDate'>>) {
		const index = this.items.findIndex((item) => item.id === id);
		if (index !== -1) {
			this.items[index] = { ...this.items[index], ...updatedFields };
			const updatedItem = this.items[index];

			// Sync to Cloudflare D1
			if (browser) {
				try {
					await fetch('/api/pantry', {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ item: updatedItem })
					});
				} catch (e) {
					console.error('Failed to update item in cloud D1:', e);
				}
			}
		}
	}

	// Delete a food item
	async removeItem(id: string) {
		this.items = this.items.filter((item) => item.id !== id);

		// Sync to Cloudflare D1
		if (browser) {
			try {
				await fetch('/api/pantry', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id })
				});
			} catch (e) {
				console.error('Failed to delete item from cloud D1:', e);
			}
		}
	}

	// Add a custom category if it doesn't exist already
	async addCustomCategory(category: string) {
		const cleanCat = category.trim();
		if (!cleanCat) return;

		const allCats = [...DEFAULT_CATEGORIES, ...this.customCategories].map((c) => c.toLowerCase());
		if (!allCats.includes(cleanCat.toLowerCase())) {
			const formattedCat = cleanCat.charAt(0).toUpperCase() + cleanCat.slice(1);
			this.customCategories.push(formattedCat);

			// Sync to Cloudflare D1
			if (browser) {
				try {
					await fetch('/api/pantry', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ action: 'add_category', category: formattedCat })
					});
				} catch (e) {
					console.error('Failed to add category to cloud D1:', e);
				}
			}
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
	async importJSON(jsonString: string): Promise<boolean> {
		try {
			const data = JSON.parse(jsonString);
			if (data && Array.isArray(data.items)) {
				this.items = data.items;
				if (Array.isArray(data.customCategories)) {
					this.customCategories = data.customCategories;
				}

				if (browser) {
					await fetch('/api/pantry', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							action: 'bulk_sync',
							items: this.items,
							customCategories: this.customCategories
						})
					});
				}
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
			result = result.filter((item) => item.category === this.selectedCategory);
		}

		// Filter by search query
		if (this.searchQuery.trim()) {
			const query = this.searchQuery.toLowerCase().trim();
			result = result.filter(
				(item) =>
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

		this.items.forEach((item) => {
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

		today.setHours(0, 0, 0, 0);
		expiry.setHours(0, 0, 0, 0);

		const diffTime = expiry.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	}
}

// Global store instance to be shared across components
export const pantryStore = new PantryStore();
