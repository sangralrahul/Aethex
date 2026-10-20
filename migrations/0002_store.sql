-- The store (worker/store.ts): cash-on-delivery orders, price and book requests,
-- and the store's own changes to the catalogue (prices, stock, hidden items).
-- Apply with:  npx wrangler d1 migrations apply aethex --remote
-- (The Worker also creates these tables on first use, so the store works before this is applied.)

-- Orders. The address, the priced lines and the status history are JSON. The
-- browser that placed an order keeps a random token; only its SHA-256 is stored.
CREATE TABLE IF NOT EXISTS store_orders (
  id          TEXT PRIMARY KEY,     -- AX<yymmdd>-<6 letters and digits>
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  status      TEXT NOT NULL,        -- placed, confirmed, shipped, delivered, cancelled
  user_id     TEXT,                 -- the account, when signed in
  email       TEXT,
  phone       TEXT NOT NULL,        -- 10 digits
  name        TEXT NOT NULL,
  pincode     TEXT NOT NULL,
  address     TEXT NOT NULL,
  lines       TEXT NOT NULL,
  item_count  INTEGER NOT NULL,
  subtotal    REAL NOT NULL,
  mrp_total   REAL NOT NULL,
  delivery    REAL NOT NULL,
  total       REAL NOT NULL,
  payment     TEXT NOT NULL DEFAULT 'cod',
  history     TEXT NOT NULL,
  tracking    TEXT,                 -- {"courier","number","url"}
  notes       TEXT,                 -- from the customer
  admin_note  TEXT,                 -- for the team only
  token_hash  TEXT NOT NULL,
  ip          TEXT
);
CREATE INDEX IF NOT EXISTS store_orders_created ON store_orders(created_at);
CREATE INDEX IF NOT EXISTS store_orders_user ON store_orders(user_id);
CREATE INDEX IF NOT EXISTS store_orders_email ON store_orders(email);
CREATE INDEX IF NOT EXISTS store_orders_phone ON store_orders(phone);

-- "Ask for the price", book requests and bulk orders.
CREATE TABLE IF NOT EXISTS store_enquiries (
  id         TEXT PRIMARY KEY,      -- AXQ-<yymmdd>-<6 letters and digits>
  created_at INTEGER NOT NULL,
  kind       TEXT NOT NULL,         -- price, book, bulk, general
  product_id INTEGER,
  variant_id TEXT,
  item       TEXT,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  email      TEXT,
  city       TEXT,
  qty        INTEGER,
  message    TEXT,
  status     TEXT NOT NULL DEFAULT 'new',   -- new, contacted, closed
  note       TEXT,
  user_id    TEXT,
  ip         TEXT
);
CREATE INDEX IF NOT EXISTS store_enquiries_created ON store_enquiries(created_at);

-- The store's changes to a catalogue product, set in the store admin:
-- {"price","mrp","inStock","hidden","countryOfOrigin","variants":{id:{"price","mrp","inStock"}}}
CREATE TABLE IF NOT EXISTS store_overrides (
  product_id INTEGER PRIMARY KEY,
  data       TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by TEXT
);
