-- Initial schema for LoJix FM
-- Run only on first postgres container init via docker-entrypoint-initdb.d

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'dj',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tracks (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  title TEXT,
  artist TEXT,
  album TEXT,
  duration INT,
  uploaded_by INT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS play_history (
  id SERIAL PRIMARY KEY,
  track_id INT,
  title TEXT,
  artist TEXT,
  source TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  duration INT
);
