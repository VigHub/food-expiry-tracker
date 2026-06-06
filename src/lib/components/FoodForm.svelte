<script lang="ts">
  import { pantryStore } from '$lib/pantry.svelte';
  import type { FoodItem } from '$lib/pantry.svelte';
  import BarcodeScanner from './BarcodeScanner.svelte';
  import { fetchProductFromOFF } from '$lib/off';

  // Props
  let { 
    editItemId = null, 
    onClose 
  } = $props<{
    editItemId?: string | null;
    onClose: () => void;
  }>();

  // Local form state
  let name = $state('');
  let expiryDate = $state('');
  let category = $state('Vegetables');
  let quantity = $state('');
  let notes = $state('');
  let brand = $state('');
  let imageUrl = $state('');
  let barcode = $state('');

  // Scanner state
  let showScanner = $state(false);
  let isSearchingAPI = $state(false);
  let apiMessage = $state<string | null>(null);

  // Custom category addition
  let showCustomCatInput = $state(false);
  let customCatValue = $state('');

  // Set initial form values if we are editing an item
  $effect(() => {
    if (editItemId) {
      const item = pantryStore.items.find((i: FoodItem) => i.id === editItemId);
      if (item) {
        name = item.name;
        expiryDate = item.expiryDate;
        category = item.category;
        quantity = item.quantity || '';
        notes = item.notes || '';
        brand = item.brand || '';
        imageUrl = item.imageUrl || '';
        barcode = item.barcode || '';
      }
    } else {
      // Set default expiry date to today + 7 days
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      expiryDate = defaultDate.toISOString().split('T')[0];
    }
  });

  const handleSave = (e: SubmitEvent) => {
    e.preventDefault();
    if (!name.trim() || !expiryDate) return;

    const foodData = {
      name: name.trim(),
      expiryDate,
      category,
      quantity: quantity.trim() || undefined,
      notes: notes.trim() || undefined,
      brand: brand.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      barcode: barcode.trim() || undefined
    };

    if (editItemId) {
      pantryStore.updateItem(editItemId, foodData);
    } else {
      pantryStore.addItem(foodData);
    }

    onClose();
  };

  const handleScanSuccess = async (scannedCode: string) => {
    showScanner = false;
    isSearchingAPI = true;
    apiMessage = 'Looking up product info...';
    barcode = scannedCode;

    try {
      const product = await fetchProductFromOFF(scannedCode);
      if (product) {
        name = product.name;
        brand = product.brand || '';
        imageUrl = product.imageUrl || '';
        
        // Add category to pantryStore custom list if it isn't preset
        if (product.category && product.category !== 'Other') {
          pantryStore.addCustomCategory(product.category);
          category = product.category;
        } else {
          category = 'Other';
        }
        apiMessage = `Found: ${product.name}!`;
        setTimeout(() => { apiMessage = null; }, 2000);
      } else {
        apiMessage = 'Product not found in database. Please enter manually.';
        setTimeout(() => { apiMessage = null; }, 3000);
      }
    } catch (e) {
      console.error(e);
      apiMessage = 'Error connecting to search database.';
      setTimeout(() => { apiMessage = null; }, 3000);
    } finally {
      isSearchingAPI = false;
    }
  };

  const handleAddCustomCategory = () => {
    const cleanCat = customCatValue.trim();
    if (cleanCat) {
      pantryStore.addCustomCategory(cleanCat);
      
      // Auto-format clean name to match database
      const formattedCat = cleanCat.charAt(0).toUpperCase() + cleanCat.slice(1);
      category = formattedCat;
      customCatValue = '';
      showCustomCatInput = false;
    }
  };
</script>

{#if showScanner}
  <BarcodeScanner 
    onScanSuccess={handleScanSuccess} 
    onClose={() => showScanner = false} 
  />
{/if}

<div class="drawer-backdrop" onclick={onClose} role="presentation">
  <div class="drawer-content glass-panel" onclick={e => e.stopPropagation()} role="presentation">
    <div class="drawer-header">
      <h3>{editItemId ? 'Edit Food' : 'Add Food'}</h3>
      <button class="close-btn" onclick={onClose} aria-label="Close form">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Scan barcode helper bar -->
    {#if !editItemId}
      <button class="scanner-trigger-btn" onclick={() => showScanner = true}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="scan-icon">
          <path d="M4 4h4v4H4zm12 0h4v4h-4zM4 16h4v4H4zm12 4h4M12 4v16M4 12h16"/>
        </svg>
        <span>Scan Packaging Barcode</span>
      </button>
    {/if}

    {#if apiMessage}
      <div class="api-status-banner {isSearchingAPI ? 'loading' : ''}">
        {#if isSearchingAPI}
          <div class="spinner-small"></div>
        {/if}
        <span>{apiMessage}</span>
      </div>
    {/if}

    <form onsubmit={handleSave} class="drawer-form">
      <div class="form-group">
        <label class="form-label" for="food-name">Food Name *</label>
        <input 
          type="text" 
          id="food-name" 
          class="form-input" 
          placeholder="e.g. Latte Parzialmente Scremato" 
          bind:value={name} 
          required 
        />
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label class="form-label" for="food-brand">Brand (Optional)</label>
          <input 
            type="text" 
            id="food-brand" 
            class="form-input" 
            placeholder="e.g. Parmalat" 
            bind:value={brand} 
          />
        </div>
        <div class="form-group flex-1">
          <label class="form-label" for="food-qty">Quantity (Optional)</label>
          <input 
            type="text" 
            id="food-qty" 
            class="form-input" 
            placeholder="e.g. 1 Litro, 3 pezzi" 
            bind:value={quantity} 
          />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="food-expiry">Expiration Date *</label>
        <input 
          type="date" 
          id="food-expiry" 
          class="form-input" 
          bind:value={expiryDate} 
          required 
        />
      </div>

      <div class="form-group">
        <div class="form-label">
          <span>Category</span>
          <button 
            type="button" 
            class="add-cat-toggle" 
            onclick={() => showCustomCatInput = !showCustomCatInput}
          >
            {showCustomCatInput ? 'Cancel' : '+ New Category'}
          </button>
        </div>

        {#if showCustomCatInput}
          <div class="custom-cat-input-row">
            <input 
              type="text" 
              class="form-input" 
              placeholder="Custom category name..." 
              bind:value={customCatValue} 
            />
            <button 
              type="button" 
              class="add-cat-btn" 
              onclick={handleAddCustomCategory}
            >
              Add
            </button>
          </div>
        {:else}
          <select id="food-category" class="form-select" bind:value={category}>
            {#each pantryStore.allCategories() as cat}
              <option value={cat}>{cat}</option>
            {/each}
          </select>
        {/if}
      </div>

      <div class="form-group">
        <label class="form-label" for="food-notes">Notes (Optional)</label>
        <textarea 
          id="food-notes" 
          class="form-input form-textarea" 
          placeholder="Storage details or quick reminders..." 
          bind:value={notes} 
          rows="2"
        ></textarea>
      </div>

      <!-- If product image exists, show tiny preview -->
      {#if imageUrl}
        <div class="image-preview-box">
          <img src={imageUrl} alt="Scanned item preview" class="preview-img" />
          <div class="preview-details">
            <span>Scanned Product Image</span>
            <button type="button" class="remove-img-btn" onclick={() => imageUrl = ''}>Remove Image</button>
          </div>
        </div>
      {/if}

      <div class="form-submit-row">
        <button type="button" class="form-btn cancel-btn" onclick={onClose}>
          Cancel
        </button>
        <button type="submit" class="form-btn save-btn">
          {editItemId ? 'Save Changes' : 'Add to Fridge'}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .drawer-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(2, 6, 23, 0.65);
    backdrop-filter: blur(4px);
    z-index: 80;
    display: flex;
    align-items: flex-end; /* Drawer slide from bottom */
    justify-content: center;
  }

  .drawer-content {
    width: 100%;
    max-width: var(--max-width);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    border-bottom: none;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    max-height: 90vh;
    overflow-y: auto;
    animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes slide-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .drawer-header h3 {
    font-size: 1.35rem;
    color: var(--text-primary);
  }

  .close-btn {
    width: 2.2rem;
    height: 2.2rem;
    border-radius: var(--radius-full);
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:active {
    background: rgba(255, 255, 255, 0.1);
  }

  .close-btn svg {
    width: 1.2rem;
    height: 1.2rem;
  }

  /* Scanner integration button */
  .scanner-trigger-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    width: 100%;
    padding: 0.85rem;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(79, 70, 229, 0.1) 100%);
    border: 1px dashed rgba(99, 102, 241, 0.4);
    border-radius: var(--radius-md);
    color: #a5b4fc;
    font-weight: 500;
    transition: all var(--transition-fast);
  }

  .scanner-trigger-btn:active {
    background: rgba(99, 102, 241, 0.25);
    border-color: rgba(99, 102, 241, 0.6);
  }

  .scan-icon {
    width: 1.35rem;
    height: 1.35rem;
  }

  /* API banner status */
  .api-status-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.6rem;
    border-radius: var(--radius-sm);
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .api-status-banner.loading {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    color: var(--text-secondary);
  }

  .spinner-small {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-top-color: var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s infinite linear;
  }

  .drawer-form {
    display: flex;
    flex-direction: column;
  }

  .form-row {
    display: flex;
    gap: 0.75rem;
  }

  .flex-1 {
    flex: 1;
  }

  .form-textarea {
    resize: none;
  }

  .add-cat-toggle {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--accent-primary);
  }

  .custom-cat-input-row {
    display: flex;
    gap: 0.5rem;
  }

  .add-cat-btn {
    padding: 0.75rem 1.25rem;
    background: var(--accent-primary);
    color: white;
    border-radius: var(--radius-md);
    font-weight: 600;
  }

  .add-cat-btn:active {
    background: var(--accent-primary-hover);
  }

  /* Image preview */
  .image-preview-box {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem;
    background: rgba(0,0,0,0.2);
    border-radius: var(--radius-md);
    border: 1px solid var(--surface-border);
    margin-bottom: 1.25rem;
  }

  .preview-img {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-sm);
    object-fit: cover;
    background: white;
  }

  .preview-details {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .remove-img-btn {
    color: var(--accent-danger);
    font-size: 0.75rem;
    text-align: left;
    font-weight: 500;
  }

  /* Form actions */
  .form-submit-row {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .form-btn {
    flex: 1;
    padding: 0.9rem;
    border-radius: var(--radius-md);
    font-size: 1rem;
    font-weight: 600;
    text-align: center;
  }

  .cancel-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: var(--text-secondary);
  }

  .cancel-btn:active {
    background: rgba(255, 255, 255, 0.1);
  }

  .save-btn {
    background: linear-gradient(135deg, var(--accent-primary) 0%, #4f46e5 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.2);
  }

  .save-btn:active {
    transform: scale(0.98);
  }
</style>
