-- MySQL initial schema for LoJix FM
-- Executed on container init via docker-entrypoint-initdb.d

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'dj',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tracks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(1024) NOT NULL,
  title VARCHAR(512),
  artist VARCHAR(512),
  album VARCHAR(512),
  duration INT,
  uploaded_by INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS play_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  track_id INT,
  title VARCHAR(512),
  artist VARCHAR(512),
  source VARCHAR(255),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration INT
);
