ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_channel_names TEXT[] NOT NULL DEFAULT '{}';
