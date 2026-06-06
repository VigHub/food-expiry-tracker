export interface OFFProductInfo {
  name: string;
  brand?: string;
  category: string;
  imageUrl?: string;
  barcode: string;
}

// Map Open Food Facts categories/keywords to our app's categories
const categoryMapping: Record<string, string> = {
  'vegetables': 'Vegetables',
  'veg': 'Vegetables',
  'plants': 'Vegetables',
  'fruits': 'Fruits',
  'fruit': 'Fruits',
  'meats': 'Meat',
  'meat': 'Meat',
  'beef': 'Meat',
  'pork': 'Meat',
  'chicken': 'Meat',
  'poultry': 'Meat',
  'fish': 'Fish',
  'seafood': 'Fish',
  'dairies': 'Dairy',
  'dairy': 'Dairy',
  'milk': 'Dairy',
  'cheese': 'Dairy',
  'yogurt': 'Dairy',
  'bakery': 'Bakery',
  'bread': 'Bakery',
  'biscuits': 'Bakery',
  'cookies': 'Bakery',
  'cereals': 'Pasta & Grains',
  'pasta': 'Pasta & Grains',
  'rice': 'Pasta & Grains',
  'grains': 'Pasta & Grains',
  'noodle': 'Pasta & Grains',
  'meals': 'Leftovers',
  'prepared': 'Leftovers',
  'pizza': 'Leftovers',
};

function determineCategory(offCategoriesTags: string[] = [], productName = ''): string {
  const nameLower = productName.toLowerCase();
  
  // 1. Try mapping based on the categories tags from OFF
  for (const tag of offCategoriesTags) {
    const cleanTag = tag.replace('en:', '').toLowerCase();
    for (const [key, appCat] of Object.entries(categoryMapping)) {
      if (cleanTag.includes(key)) {
        return appCat;
      }
    }
  }

  // 2. Fallback to name keywords
  for (const [key, appCat] of Object.entries(categoryMapping)) {
    if (nameLower.includes(key)) {
      return appCat;
    }
  }

  // Extra Italian mapping helpers since user is in Italy!
  const italianMapping: Record<string, string> = {
    'verdura': 'Vegetables',
    'frutta': 'Fruits',
    'carne': 'Meat',
    'pollo': 'Meat',
    'pesce': 'Fish',
    'latte': 'Dairy',
    'formaggio': 'Dairy',
    'yogurt': 'Dairy',
    'pane': 'Bakery',
    'biscott': 'Bakery',
    'pasta': 'Pasta & Grains',
    'riso': 'Pasta & Grains',
    'uova': 'Dairy'
  };

  for (const [key, appCat] of Object.entries(italianMapping)) {
    if (nameLower.includes(key)) {
      return appCat;
    }
  }

  return 'Other';
}

export async function fetchProductFromOFF(barcode: string): Promise<OFFProductInfo | null> {
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode) return null;

  try {
    // We target v2 API, and set a custom User-Agent as requested by Open Food Facts usage policy
    const url = `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SmartFridgeExpiryTracker - WebApp - Version 1.0 - gviga@gmail.com'
      }
    });

    if (!response.ok) {
      console.warn(`OFF API returned status ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.status === 1 && data.product) {
      const p = data.product;
      
      // Extract properties
      const name = p.product_name_it || p.product_name || p.product_name_en || '';
      const brand = p.brands || '';
      const categoriesTags = p.categories_tags || [];
      const imageUrl = p.image_front_url || p.image_url || undefined;
      
      // Determine category
      const category = determineCategory(categoriesTags, name);

      return {
        name,
        brand,
        category,
        imageUrl,
        barcode: cleanBarcode
      };
    }
    
    return null;
  } catch (err) {
    console.error('Error fetching product from Open Food Facts:', err);
    return null;
  }
}
