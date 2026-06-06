<script lang="ts">
  import { fade, slide } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { pantryStore } from '$lib/pantry.svelte';
  import FoodCard from '$lib/components/FoodCard.svelte';
  import FoodForm from '$lib/components/FoodForm.svelte';

  // State management
  let showForm = $state(false);
  let editingItemId = $state<string | null>(null);
  let showBackupPanel = $state(false);
  let fileInputRef = $state<HTMLInputElement | null>(null);
  let importSuccess = $state<boolean | null>(null);

  // Derived properties from store
  const items = $derived(pantryStore.filteredItems());
  const stats = $derived(pantryStore.stats());
  const categories = $derived(['All', ...pantryStore.allCategories()]);

  const handleEdit = (id: string) => {
    editingItemId = id;
    showForm = true;
  };

  const handleDelete = (id: string) => {
    if (confirm('Did you consume or throw away this item?')) {
      pantryStore.removeItem(id);
    }
  };

  const handleAddNew = () => {
    editingItemId = null;
    showForm = true;
  };

  const handleExport = () => {
    const jsonString = pantryStore.exportJSON();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smart_fridge_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      const text = await file.text();
      const success = pantryStore.importJSON(text);
      importSuccess = success;
      
      // Clear file input
      if (fileInputRef) fileInputRef.value = '';
      
      setTimeout(() => {
        importSuccess = null;
      }, 3000);
    }
  };
</script>

<!-- Header & Statistics -->
<header class="app-header glass-panel">
  <div class="header-top">
    <div class="title-group">
      <h1>Smart Fridge ❄️</h1>
      <p>Expiration date tracker</p>
    </div>
    
    <!-- Settings / Backup Button -->
    <button 
      class="settings-toggle-btn {showBackupPanel ? 'active' : ''}" 
      onclick={() => showBackupPanel = !showBackupPanel}
      aria-label="Backup and Restore menu"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    </button>
  </div>

  <!-- Backup Restore Panel (Collapsible) -->
  {#if showBackupPanel}
    <div class="backup-panel" transition:slide={{ duration: 200 }}>
      <h4>Backup & Restore</h4>
      <p class="panel-desc">Export data as JSON or restore from a previously exported file.</p>
      
      <div class="backup-actions">
        <button class="backup-btn export-btn" onclick={handleExport}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          Export Backup
        </button>
        
        <label class="backup-btn import-btn-label">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Import Backup
          <input 
            type="file" 
            accept=".json" 
            class="hidden-file-input" 
            bind:this={fileInputRef} 
            onchange={handleImport} 
          />
        </label>
      </div>

      {#if importSuccess === true}
        <p class="status-msg success">Backup imported successfully!</p>
      {:else if importSuccess === false}
        <p class="status-msg error">Failed to import backup. Invalid JSON file.</p>
      {/if}
    </div>
  {/if}

  <!-- Stats Grid -->
  <div class="stats-grid">
    <div class="stat-card">
      <span class="stat-value">{stats.total}</span>
      <span class="stat-label">Total Items</span>
    </div>
    
    <div class="stat-card ring-danger">
      <span class="stat-value text-danger">{stats.expired}</span>
      <span class="stat-label">Expired</span>
    </div>
    
    <div class="stat-card ring-warning">
      <span class="stat-value text-warning">{stats.expiringSoon}</span>
      <span class="stat-label">Expiring Soon</span>
    </div>
  </div>
</header>

<main class="dashboard-content">
  <!-- Search & Sorting Bar -->
  <div class="search-sort-bar">
    <div class="search-input-wrapper">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="search-icon">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input 
        type="text" 
        placeholder="Search food by name or brand..." 
        bind:value={pantryStore.searchQuery}
        class="search-input" 
      />
      {#if pantryStore.searchQuery}
        <button class="clear-search-btn" onclick={() => pantryStore.searchQuery = ''} aria-label="Clear search">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      {/if}
    </div>

    <!-- Sorting -->
    <div class="sort-selector">
      <label for="sort-select" class="sr-only">Sort by</label>
      <select id="sort-select" class="sort-select" bind:value={pantryStore.sortBy}>
        <option value="expiry">📅 Expiry Date</option>
        <option value="name">🔤 Alphabetical</option>
        <option value="added">⏱️ Added Date</option>
      </select>
    </div>
  </div>

  <!-- Horizontal Category Filters -->
  <div class="category-filters-container">
    <div class="category-filters">
      {#each categories as cat}
        <button 
          class="category-capsule {pantryStore.selectedCategory === cat ? 'active' : ''}" 
          onclick={() => pantryStore.selectedCategory = cat}
        >
          {cat}
        </button>
      {/each}
    </div>
  </div>

  <!-- Food Items List -->
  <div class="food-list-container">
    {#if items.length > 0}
      <div class="food-list">
        {#each items as item (item.id)}
          <div 
            transition:slide={{ duration: 250 }} 
            animate:flip={{ duration: 250 }}
            class="food-card-wrapper"
          >
            <FoodCard 
              {item} 
              onEdit={handleEdit} 
              onDelete={handleDelete} 
            />
          </div>
        {/each}
      </div>
    {:else}
      <!-- Empty State -->
      <div class="empty-state" in:fade>
        <div class="empty-illustration">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
            <line x1="5" y1="10" x2="19" y2="10"/>
            <line x1="12" y1="2" x2="12" y2="10"/>
            <path d="M9 14h.01M9 17h.01M15 14h.01M15 17h.01"/>
          </svg>
        </div>
        <h3>No food tracked</h3>
        <p>Your search or category filter did not match any items in the fridge.</p>
        <button class="add-first-btn" onclick={handleAddNew}>
          Add Food Now
        </button>
      </div>
    {/if}
  </div>
</main>

<!-- Floating Action Button (FAB) -->
<button class="fab" onclick={handleAddNew} aria-label="Add new food">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
</button>

<!-- Slide-up Drawer Form for Add/Edit -->
{#if showForm}
  <FoodForm 
    editItemId={editingItemId} 
    onClose={() => showForm = false} 
  />
{/if}

<style>
  /* Layout components specific to Dashboard */
  .app-header {
    padding: 1.5rem;
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    border-top: none;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title-group h1 {
    font-size: 1.6rem;
    color: var(--text-primary);
  }

  .title-group p {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-top: 0.1rem;
  }

  .settings-toggle-btn {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--radius-full);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .settings-toggle-btn.active, .settings-toggle-btn:active {
    color: var(--accent-primary);
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.2);
  }

  .settings-toggle-btn svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  /* Backup Restore Panel */
  .backup-panel {
    background: rgba(0, 0, 0, 0.2);
    border-radius: var(--radius-md);
    padding: 1rem;
    border: 1px solid var(--surface-border);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .backup-panel h4 {
    font-size: 0.95rem;
    font-weight: 600;
  }

  .panel-desc {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .backup-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .backup-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.5rem;
    font-size: 0.85rem;
    font-weight: 500;
    border-radius: var(--radius-sm);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: var(--text-secondary);
    cursor: pointer;
  }

  .backup-btn svg {
    width: 0.95rem;
    height: 0.95rem;
  }

  .backup-btn:active {
    background: rgba(255, 255, 255, 0.1);
  }

  .export-btn:active {
    color: var(--accent-success);
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.2);
  }

  .import-btn-label {
    position: relative;
    cursor: pointer;
  }

  .hidden-file-input {
    position: absolute;
    width: 0.1px;
    height: 0.1px;
    opacity: 0;
    overflow: hidden;
    z-index: -1;
  }

  .status-msg {
    font-size: 0.8rem;
    font-weight: 500;
    text-align: center;
    margin-top: 0.25rem;
  }

  .status-msg.success { color: var(--accent-success); }
  .status-msg.error { color: var(--accent-danger); }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-md);
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.7rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  /* Stat Card rings colors */
  .ring-danger { border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.02); }
  .ring-warning { border-color: rgba(245, 158, 11, 0.2); background: rgba(245, 158, 11, 0.02); }

  .text-danger { color: #f87171; }
  .text-warning { color: #fbbf24; }

  /* Dashboard Content */
  .dashboard-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1.25rem 1rem;
    gap: 1.25rem;
    margin-bottom: 5.5rem; /* Allow space for FAB */
  }

  /* Search & Sorting Bar */
  .search-sort-bar {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    width: 100%;
  }

  .search-input-wrapper {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    width: 1.1rem;
    height: 1.1rem;
    color: var(--text-muted);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.65rem 2rem 0.65rem 2.2rem;
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-md);
    font-size: 0.9rem;
    color: var(--text-primary);
  }

  .search-input:focus {
    border-color: var(--accent-primary);
  }

  .clear-search-btn {
    position: absolute;
    right: 0.75rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .clear-search-btn svg {
    width: 1rem;
    height: 1rem;
  }

  .clear-search-btn:active {
    color: var(--text-primary);
  }

  .sort-selector {
    flex-shrink: 0;
  }

  .sort-select {
    padding: 0.65rem 0.5rem;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-md);
    font-size: 0.85rem;
    color: var(--text-primary);
  }

  /* Horizontal Category Scroller */
  .category-filters-container {
    width: 100%;
    overflow-x: auto;
    margin: -0.25rem 0;
    padding: 0.25rem 0;
    /* Hide scrollbars but keep functionality */
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }

  .category-filters-container::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }

  .category-filters {
    display: flex;
    gap: 0.5rem;
    width: max-content;
  }

  .category-capsule {
    padding: 0.45rem 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-full);
    font-size: 0.825rem;
    font-weight: 500;
    color: var(--text-secondary);
    transition: all var(--transition-fast);
  }

  .category-capsule.active {
    background: var(--accent-primary);
    color: white;
    border-color: var(--accent-primary);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
  }

  /* Food list */
  .food-list-container {
    flex: 1;
  }

  .food-list {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .food-card-wrapper {
    width: 100%;
  }

  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 4rem 1.5rem;
    background: rgba(255, 255, 255, 0.01);
    border: 1px dashed rgba(255, 255, 255, 0.05);
    border-radius: var(--radius-lg);
  }

  .empty-illustration {
    width: 72px;
    height: 72px;
    color: var(--text-muted);
    margin-bottom: 1.5rem;
  }

  .empty-state h3 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
  }

  .empty-state p {
    font-size: 0.875rem;
    color: var(--text-secondary);
    max-width: 260px;
    margin-bottom: 1.5rem;
    line-height: 1.4;
  }

  .add-first-btn {
    padding: 0.75rem 1.75rem;
    background: var(--accent-primary);
    color: white;
    border-radius: var(--radius-full);
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.25);
  }

  .add-first-btn:active {
    background: var(--accent-primary-hover);
    transform: scale(0.98);
  }

  /* Utility classes */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
</style>
