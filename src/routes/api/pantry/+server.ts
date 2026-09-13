import { json, type RequestHandler } from '@sveltejs/kit';

export interface D1FoodItem {
	id: string;
	name: string;
	expiryDate: string;
	category: string;
	quantity?: string;
	notes?: string;
	barcode?: string;
	brand?: string;
	imageUrl?: string;
	addedDate: string;
}

export const GET: RequestHandler = async ({ platform, locals }) => {
	if (!locals.authenticated) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const db = platform?.env?.DB;

	if (!db) {
		// Fallback for dev mode when D1 is not bound
		return json({ items: [], customCategories: [] });
	}

	try {
		const itemsResult = await db
			.prepare('SELECT id, name, expiryDate, category, quantity, notes, barcode, brand, imageUrl, addedDate FROM items')
			.all<D1FoodItem>();

		const categoriesResult = await db
			.prepare('SELECT name FROM custom_categories')
			.all<{ name: string }>();

		return json({
			items: itemsResult.results || [],
			customCategories: (categoriesResult.results || []).map((c) => c.name)
		});
	} catch (e) {
		console.error('Failed to query D1 database:', e);
		return json({ items: [], customCategories: [], error: String(e) });
	}
};

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	if (!locals.authenticated) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const db = platform?.env?.DB;
	const body = await request.json();

	if (!db) {
		return json({ success: true, warning: 'No D1 database binding active' });
	}

	try {
		if (body.action === 'add_item') {
			const item: D1FoodItem = body.item;
			await db
				.prepare(
					`INSERT OR REPLACE INTO items (id, name, expiryDate, category, quantity, notes, barcode, brand, imageUrl, addedDate)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(
					item.id,
					item.name,
					item.expiryDate,
					item.category,
					item.quantity || null,
					item.notes || null,
					item.barcode || null,
					item.brand || null,
					item.imageUrl || null,
					item.addedDate
				)
				.run();
			return json({ success: true });
		}

		if (body.action === 'add_category') {
			const { category } = body;
			if (category) {
				await db
					.prepare('INSERT OR IGNORE INTO custom_categories (name) VALUES (?)')
					.bind(category)
					.run();
			}
			return json({ success: true });
		}

		if (body.action === 'bulk_sync') {
			const { items = [], customCategories = [] } = body;

			// Bulk insert categories
			for (const cat of customCategories) {
				await db
					.prepare('INSERT OR IGNORE INTO custom_categories (name) VALUES (?)')
					.bind(cat)
					.run();
			}

			// Bulk insert items
			for (const item of items) {
				await db
					.prepare(
						`INSERT OR REPLACE INTO items (id, name, expiryDate, category, quantity, notes, barcode, brand, imageUrl, addedDate)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
					)
					.bind(
						item.id,
						item.name,
						item.expiryDate,
						item.category,
						item.quantity || null,
						item.notes || null,
						item.barcode || null,
						item.brand || null,
						item.imageUrl || null,
						item.addedDate
					)
					.run();
			}

			return json({ success: true, syncedItems: items.length });
		}

		return json({ error: 'Invalid action' }, { status: 400 });
	} catch (e) {
		console.error('Error handling POST /api/pantry:', e);
		return json({ error: String(e) }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request, platform, locals }) => {
	if (!locals.authenticated) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const db = platform?.env?.DB;
	const body = await request.json();

	if (!db) {
		return json({ success: true, warning: 'No D1 database binding active' });
	}

	try {
		const item: D1FoodItem = body.item;
		await db
			.prepare(
				`UPDATE items SET
         name = ?, expiryDate = ?, category = ?, quantity = ?, notes = ?, barcode = ?, brand = ?, imageUrl = ?
         WHERE id = ?`
			)
			.bind(
				item.name,
				item.expiryDate,
				item.category,
				item.quantity || null,
				item.notes || null,
				item.barcode || null,
				item.brand || null,
				item.imageUrl || null,
				item.id
			)
			.run();

		return json({ success: true });
	} catch (e) {
		console.error('Error handling PUT /api/pantry:', e);
		return json({ error: String(e) }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request, platform, locals }) => {
	if (!locals.authenticated) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const db = platform?.env?.DB;
	const body = await request.json();

	if (!db) {
		return json({ success: true, warning: 'No D1 database binding active' });
	}

	try {
		if (body.id) {
			await db.prepare('DELETE FROM items WHERE id = ?').bind(body.id).run();
			return json({ success: true });
		}
		return json({ error: 'Missing item id' }, { status: 400 });
	} catch (e) {
		console.error('Error handling DELETE /api/pantry:', e);
		return json({ error: String(e) }, { status: 500 });
	}
};
