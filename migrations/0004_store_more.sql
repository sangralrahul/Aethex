-- Reviews, coupons, offers and alerts for the store. The Worker also creates
-- these tables on first use (worker/store.ts, STORE_TABLES), so applying this
-- file is optional:
--   npx wrangler d1 migrations apply aethex --remote
-- The new columns on store_orders (online payments, coupons) and
-- store_bulk_requests (the note an institution sees in its account) are added
-- by the Worker where missing (STORE_COLUMNS), so they are not in this file.

-- Reviews from buyers of delivered orders, shown once approved in the admin.
CREATE TABLE IF NOT EXISTS store_reviews (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  order_id TEXT NOT NULL,
  rating INTEGER NOT NULL,                 -- 1 to 5
  title TEXT,
  body TEXT NOT NULL,
  name TEXT NOT NULL,                      -- as the buyer chose to show it
  city TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, approved, rejected
  reply TEXT,                              -- the store's public reply
  user_id TEXT,
  ip TEXT
);
CREATE INDEX IF NOT EXISTS store_reviews_product ON store_reviews(product_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS store_reviews_order_product ON store_reviews(order_id, product_id);

-- Coupon codes and sales (offers), set in the admin. data: JSON (lib/store/types.ts, Coupon and Offer).
CREATE TABLE IF NOT EXISTS store_coupons (code TEXT PRIMARY KEY, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS store_offers (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, data TEXT NOT NULL);

-- Back-in-stock and price-drop alerts: one email each, from the hourly job.
CREATE TABLE IF NOT EXISTS store_alerts (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  variant_id TEXT NOT NULL DEFAULT '',     -- '' for the product as a whole
  kind TEXT NOT NULL,                      -- stock or price
  email TEXT NOT NULL,
  price_at REAL,                           -- the price when asked (price alerts)
  notified_at INTEGER,
  checked_at INTEGER,                      -- when the hourly job last looked at it
  token TEXT NOT NULL,                     -- for the "stop alerts" link
  ip TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS store_alerts_unique ON store_alerts(product_id, variant_id, kind, email);
CREATE INDEX IF NOT EXISTS store_alerts_open ON store_alerts(notified_at, product_id);
CREATE INDEX IF NOT EXISTS store_alerts_token ON store_alerts(token);
