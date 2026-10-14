CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id    SERIAL PRIMARY KEY,
  slug  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL,
  blurb TEXT,
  sort  INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id             SERIAL PRIMARY KEY,
  slug           TEXT    NOT NULL UNIQUE,
  name           TEXT    NOT NULL,
  description    TEXT    NOT NULL,
  category_id    INT     REFERENCES categories(id) ON DELETE SET NULL,
  price          INT     NOT NULL CHECK (price >= 0),
  model_key      TEXT    NOT NULL,
  colors         JSONB   NOT NULL DEFAULT '[]',
  dims           JSONB   NOT NULL,
  kind           TEXT    NOT NULL DEFAULT 'floor' CHECK (kind IN ('floor', 'rug', 'small')),
  surface_height REAL,
  featured       BOOLEAN NOT NULL DEFAULT false,
  sort           INT     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id);

CREATE TABLE IF NOT EXISTS designs (
  id         SERIAL PRIMARY KEY,
  user_id    INT   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT  NOT NULL,
  room       JSONB NOT NULL,
  items      JSONB NOT NULL DEFAULT '[]',
  thumbnail  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS designs_user_idx ON designs(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT,
  email      TEXT,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- v2: real scanned products, full-house plans and orders
ALTER TABLE products ADD COLUMN IF NOT EXISTS model_url  TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url  TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS material   TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS credit     TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_url TEXT;

ALTER TABLE designs ADD COLUMN IF NOT EXISTS plan JSONB;

CREATE TABLE IF NOT EXISTS orders (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE SET NULL,
  design_id   INT REFERENCES designs(id) ON DELETE SET NULL,
  name        TEXT    NOT NULL,
  phone       TEXT    NOT NULL,
  governorate TEXT    NOT NULL,
  address     TEXT    NOT NULL,
  notes       TEXT,
  items       JSONB   NOT NULL,
  total       INT     NOT NULL CHECK (total >= 0),
  status      TEXT    NOT NULL DEFAULT 'new',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id, created_at DESC);

-- v4: products can be retired from the shop but stay resolvable for old designs
ALTER TABLE products ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
