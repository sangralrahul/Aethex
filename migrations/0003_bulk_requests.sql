-- Bulk quotation requests from hospitals and medical colleges (aethex.in/hospitals,
-- aethex.in/medical-colleges). The Worker also creates this table on first use
-- (worker/store.ts, STORE_TABLES), so applying this file is optional:
--   npx wrangler d1 migrations apply aethex --remote
CREATE TABLE IF NOT EXISTS store_bulk_requests (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',      -- new, quoted, ordered, closed
  segment TEXT NOT NULL,                   -- hospital or college
  institution TEXT NOT NULL,
  inst_type TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  designation TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  gstin TEXT,
  address TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  need_by TEXT,
  notes TEXT,
  items TEXT NOT NULL,                     -- JSON: the products, options and quantities, with store prices then
  units INTEGER NOT NULL,
  est_total REAL NOT NULL,                 -- the priced items at store prices (a guide)
  unpriced INTEGER NOT NULL,               -- items whose price is on request
  admin_note TEXT,
  user_id TEXT,
  ip TEXT
);
CREATE INDEX IF NOT EXISTS store_bulk_requests_created ON store_bulk_requests(created_at);
