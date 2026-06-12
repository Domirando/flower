-- Multiple Telegram channels per user
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_channels TEXT[] NOT NULL DEFAULT '{}';

-- Spotify OAuth tokens
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_token   TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_refresh TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_expiry  TIMESTAMPTZ;

-- Copy existing primary channel into the array for existing users
UPDATE users SET telegram_channels = ARRAY[telegram_channel]
WHERE telegram_channel != '' AND array_length(telegram_channels, 1) IS NULL;

-- User-uploaded songs
CREATE TABLE IF NOT EXISTS songs (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT          NOT NULL,
    artist      TEXT          NOT NULL DEFAULT '',
    file_url    TEXT          NOT NULL,
    file_path   TEXT          NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS songs_user_id_idx ON songs(user_id);
