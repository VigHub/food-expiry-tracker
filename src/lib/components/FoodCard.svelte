<script lang="ts">
  import type { FoodItem } from '$lib/pantry.svelte';
  import { pantryStore } from '$lib/pantry.svelte';

  // Props
  let { 
    item, 
    onEdit, 
    onDelete 
  } = $props<{
    item: FoodItem;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
  }>();

  // Calculate days remaining
  const daysRemaining = $derived(pantryStore.getDaysRemaining(item.expiryDate));

  // Determine status
  const status = $derived(() => {
    if (daysRemaining < 0) return 'expired';
    if (daysRemaining <= 3) return 'warning';
    return 'fresh';
  });

  // Calculate shelf life percentage progress
  const progressPercent = $derived(() => {
    const addedTime = new Date(item.addedDate).getTime();
    const expiryTime = new Date(item.expiryDate).getTime();
    const todayTime = new Date(new Date().toISOString().split('T')[0]).getTime();

    const totalLife = expiryTime - addedTime;
    if (totalLife <= 0) {
      return daysRemaining < 0 ? 0 : 100;
    }

    const elapsed = todayTime - addedTime;
    const remaining = totalLife - elapsed;
    
    const percent = Math.round((remaining / totalLife) * 100);
    return Math.max(0, Math.min(100, percent));
  });

  // Get color for progress bar
  const progressColor = $derived(() => {
    if (status() === 'expired') return 'var(--accent-danger)';
    if (status() === 'warning') return 'var(--accent-warning)';
    return 'var(--accent-success)';
  });

  // Format expiration date nicely
  const formattedExpiryDate = $derived(() => {
    try {
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
      return new Date(item.expiryDate).toLocaleDateString('it-IT', options);
    } catch {
      return item.expiryDate;
    }
  });

  // Category Icon SVGs
  const categoryIcons: Record<string, any> = {
    'Vegetables': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`, // Carrot/Veg like paths
    'Fruits': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"/><path d="M12 6V2"/><path d="M12 2c1.5 1 3 1 3 3s-1.5 2-3 2"/></svg>`, // Apple
    'Meat': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5c-3 0-5.5 2.5-6 6-.5 3.5-3 5.5-5 6v1c3 0 5.5-2.5 6-6 .5-3.5 3-5.5 5-6V5z"/><path d="M14 6.5a2.5 2.5 0 0 1 5 0c0 3-4.5 9-6 10.5M10.5 13C8.5 15 5 18.5 5 18.5"/></svg>`, // Drumstick/Steak
    'Fish': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 12c-2.5-3-6-4-10-4-3 0-6 1.5-8 4 2 2.5 5 4 8 4 4 0 7.5-1 10-4z"/><path d="M3 12c0-2-1.5-3.5-2-4v8c.5-.5 2-2 2-4z"/><circle cx="18" cy="11" r="1"/></svg>`, // Fish
    'Dairy': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22h12V8l-3-4H9L6 8v14z"/><path d="M6 12h12"/><path d="M10 8h4"/></svg>`, // Milk carton
    'Bakery': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2z"/><path d="M7 11V7a3 3 0 0 1 6 0v4"/><path d="M11 11V5a3 3 0 0 1 6 0v6"/></svg>`, // Bread/Croissant
    'Pasta & Grains': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L4 7v10l8 5 8-5V7L12 2z"/><path d="M12 22V12"/><path d="M20 7l-8 5-8-5"/></svg>`, // Wheat/Grain box
    'Leftovers': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 18 0"/><path d="M21 12H3"/><path d="M12 3v18"/></svg>`, // Leftover Container
    'Other': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>` // Tag
  };

  const getIcon = (cat: string) => {
    return categoryIcons[cat] || categoryIcons['Other'];
  };

  // Get inline background color based on category
  const getCategoryColorClass = (cat: string): string => {
    switch (cat) {
      case 'Vegetables': return 'cat-veg';
      case 'Fruits': return 'cat-fruit';
      case 'Meat': return 'cat-meat';
      case 'Fish': return 'cat-fish';
      case 'Dairy': return 'cat-dairy';
      case 'Bakery': return 'cat-bakery';
      case 'Pasta & Grains': return 'cat-pasta';
      case 'Leftovers': return 'cat-leftovers';
      default: return 'cat-other';
    }
  };
</script>

<div class="food-card glass-panel status-{status()}" style="--item-cat-color: var(--cat-{item.category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')})">
  
  <div class="card-header">
    <div class="product-info-wrapper">
      {#if item.imageUrl}
        <img src={item.imageUrl} alt={item.name} class="product-thumbnail" />
      {:else}
        <div class="category-icon-wrapper {getCategoryColorClass(item.category)}">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html getIcon(item.category)}
        </div>
      {/if}

      <div class="title-details">
        <h4 class="product-title">{item.name}</h4>
        {#if item.brand}
          <span class="product-brand">{item.brand}</span>
        {/if}
        <div class="meta-row">
          <span class="category-tag">{item.category}</span>
          {#if item.quantity}
            <span class="quantity-tag">Q.ty: {item.quantity}</span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Status badge -->
    <div>
      {#if status() === 'expired'}
        <span class="badge badge-danger">Expired</span>
      {:else}
        <span class="badge badge-{status()}">
          {daysRemaining === 0 ? 'Today' : daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`}
        </span>
      {/if}
    </div>
  </div>

  {#if item.notes}
    <p class="notes-text">"{item.notes}"</p>
  {/if}

  <div class="card-footer">
    <div class="date-info">
      <span>Expires: <strong>{formattedExpiryDate()}</strong></span>
    </div>

    <div class="card-actions">
      <!-- Edit button -->
      <button class="action-btn edit-btn" aria-label="Edit item" onclick={() => onEdit(item.id)}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
        </svg>
      </button>
      
      <!-- Consume/Delete button -->
      <button class="action-btn delete-btn" aria-label="Consume item" onclick={() => onDelete(item.id)}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Expiry shelf life progress bar -->
  <div class="progress-bar-container">
    <div 
      class="progress-bar-fill" 
      style="width: {progressPercent()}%; background: {progressColor()}"
    ></div>
  </div>
</div>

<style>
  .food-card {
    border-radius: var(--radius-md);
    padding: 1rem;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .food-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background-color: var(--item-cat-color, var(--accent-primary));
  }

  .food-card:active {
    transform: scale(0.98);
  }

  /* Status border overrides */
  .status-expired {
    border-left: 4px solid var(--accent-danger) !important;
  }
  .status-warning {
    border-left: 4px solid var(--accent-warning) !important;
  }
  .status-fresh {
    border-left: 4px solid var(--accent-success) !important;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .product-info-wrapper {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex: 1;
  }

  .product-thumbnail {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    object-fit: cover;
    background: white;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .category-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .category-icon-wrapper svg {
    width: 24px;
    height: 24px;
  }

  /* Category color helpers */
  .cat-veg { background: rgba(16, 185, 129, 0.2); color: #34d399; }
  .cat-fruit { background: rgba(20, 184, 166, 0.2); color: #2dd4bf; }
  .cat-meat { background: rgba(244, 63, 94, 0.2); color: #fb7185; }
  .cat-fish { background: rgba(14, 165, 233, 0.2); color: #38bdf8; }
  .cat-dairy { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
  .cat-bakery { background: rgba(217, 119, 6, 0.2); color: #fbbf24; }
  .cat-pasta { background: rgba(132, 204, 22, 0.2); color: #a3e635; }
  .cat-leftovers { background: rgba(139, 92, 246, 0.2); color: #c084fc; }
  .cat-other { background: rgba(100, 116, 139, 0.2); color: #cbd5e1; }

  .title-details {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .product-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.2;
  }

  .product-brand {
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-weight: 400;
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.15rem;
  }

  .category-tag {
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--text-muted);
    background: rgba(255, 255, 255, 0.05);
    padding: 0.1rem 0.4rem;
    border-radius: var(--radius-sm);
  }

  .quantity-tag {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .notes-text {
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-style: italic;
    background: rgba(0, 0, 0, 0.15);
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    border-left: 2px solid rgba(255, 255, 255, 0.1);
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-top: auto;
  }

  .date-info strong {
    color: var(--text-primary);
  }

  .card-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.05);
    color: var(--text-secondary);
  }

  .action-btn svg {
    width: 1.1rem;
    height: 1.1rem;
  }

  .edit-btn:active {
    background: rgba(99, 102, 241, 0.2);
    color: #818cf8;
    border-color: rgba(99, 102, 241, 0.3);
  }

  .delete-btn:active {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
    border-color: rgba(239, 68, 68, 0.3);
  }

  /* Expiry Progress Bar */
  .progress-bar-container {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: rgba(255, 255, 255, 0.05);
  }

  .progress-bar-fill {
    height: 100%;
    transition: width 0.3s ease;
  }
</style>
