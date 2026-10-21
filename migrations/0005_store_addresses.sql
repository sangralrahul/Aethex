-- Addresses kept in a signed-in account, to pick at checkout. The Worker also
-- creates this table on first use (worker/store.ts, STORE_TABLES), so applying
-- this file is optional:
--   npx wrangler d1 migrations apply aethex --remote
-- The new columns on store_orders (gift, business, bank_ref: gift orders,
-- business buyers and bank transfers) are added by the Worker where missing
-- (STORE_COLUMNS), so they are not in this file.

CREATE TABLE IF NOT EXISTS store_addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label TEXT NOT NULL,                     -- Home, Hostel, Clinic, Work, ...
  data TEXT NOT NULL,                      -- JSON (lib/store/types.ts, Address, without an email)
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS store_addresses_user ON store_addresses(user_id);
