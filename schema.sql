-- Database schema for Cloudflare D1 (SQLite)

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  expiryDate TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity TEXT,
  notes TEXT,
  barcode TEXT,
  brand TEXT,
  imageUrl TEXT,
  addedDate TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS custom_categories (
  name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
