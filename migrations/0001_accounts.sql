-- Aethex accounts on Cloudflare D1 (database "aethex", binding DB).
-- Apply with:  npx wrangler d1 migrations apply aethex --remote

-- People. A person signs in with a password, an emailed code or Google;
-- the email address is the account, so all three reach the same account.
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT,              -- pbkdf2$<iterations>$<salt>$<hash>, NULL for Google/code-only accounts
  google_sub    TEXT UNIQUE,       -- Google account id, once linked
  avatar        TEXT,
  created_at    INTEGER NOT NULL,
  last_login_at INTEGER
);

-- Signed-in browsers. The cookie holds a random token; only its SHA-256 is stored.
CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);

-- Six-digit codes, stored hashed, one live code per address. A code proves the
-- address is yours: it signs you in, and it finishes a sign-up (the name and
-- password chosen at sign-up wait here until the code is entered).
CREATE TABLE IF NOT EXISTS email_codes (
  email            TEXT PRIMARY KEY,
  code_hash        TEXT NOT NULL,
  expires_at       INTEGER NOT NULL,
  attempts         INTEGER NOT NULL DEFAULT 0,
  sent_at          INTEGER NOT NULL,
  sent_today       INTEGER NOT NULL DEFAULT 1,
  day              TEXT NOT NULL,
  pending_name     TEXT,
  pending_password TEXT,
  pending_token    TEXT              -- SHA-256 of the sign-up cookie: only that browser can finish it
);

-- Google sign-in in progress: the state sent to Google (also kept in a cookie in
-- the browser that started it), the PKCE verifier, and where to return.
CREATE TABLE IF NOT EXISTS oauth_states (
  state      TEXT PRIMARY KEY,
  verifier   TEXT NOT NULL,
  return_to  TEXT NOT NULL,
  error_to   TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

-- Counters for rate limits (password tries, codes sent and checked, per address,
-- per network address and overall).
CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);

-- The Cadus profile filled in after the first sign-in.
CREATE TABLE IF NOT EXISTS profiles (
  user_id    TEXT PRIMARY KEY,
  data       TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Store carts of signed-in shoppers, for the reminder email.
CREATE TABLE IF NOT EXISTS carts (
  user_id     TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  items       TEXT NOT NULL,
  item_count  INTEGER NOT NULL,
  total       REAL NOT NULL,
  updated_at  INTEGER NOT NULL,
  notified_at INTEGER,              -- reminder sent for this version of the cart
  last_reminded_at INTEGER          -- at most one reminder a week
);
