use anyhow::Context;

pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub port: u16,
    pub public_url: String,
    pub frontend_url: String,
    pub telegram_bot_token: String,
    pub spotify_client_id: String,
    pub spotify_client_secret: String,
    pub spotify_redirect_uri: String,
    // Cloudflare R2
    pub r2_account_id: String,
    pub r2_access_key_id: String,
    pub r2_secret_access_key: String,
    pub r2_bucket: String,
    pub r2_public_url: String,
    // UploadThing (optional, for image CDN)
    pub uploadthing_token: String,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            database_url: std::env::var("DATABASE_URL").context("DATABASE_URL not set")?,
            jwt_secret: std::env::var("JWT_SECRET")
                .unwrap_or_else(|_| "change-me-in-production-use-a-long-random-secret".to_string()),
            port: std::env::var("PORT")
                .unwrap_or_else(|_| "4000".to_string())
                .parse()
                .context("PORT must be a number")?,
            public_url: std::env::var("PUBLIC_URL")
                .unwrap_or_else(|_| "http://localhost:4000".to_string()),
            frontend_url: std::env::var("FRONTEND_URL")
                .unwrap_or_else(|_| "http://localhost:3000".to_string()),
            telegram_bot_token: std::env::var("TELEGRAM_BOT_TOKEN").unwrap_or_default(),
            spotify_client_id: std::env::var("SPOTIFY_CLIENT_ID").unwrap_or_default(),
            spotify_client_secret: std::env::var("SPOTIFY_CLIENT_SECRET").unwrap_or_default(),
            spotify_redirect_uri: std::env::var("SPOTIFY_REDIRECT_URI")
                .unwrap_or_else(|_| "http://localhost:4000/api/music/spotify/callback".to_string()),
            r2_account_id: std::env::var("R2_ACCOUNT_ID").unwrap_or_default(),
            r2_access_key_id: std::env::var("R2_ACCESS_KEY_ID").unwrap_or_default(),
            r2_secret_access_key: std::env::var("R2_SECRET_ACCESS_KEY").unwrap_or_default(),
            r2_bucket: std::env::var("R2_BUCKET").unwrap_or_default(),
            r2_public_url: std::env::var("R2_PUBLIC_URL").unwrap_or_default(),
            uploadthing_token: std::env::var("UPLOADTHING_TOKEN").unwrap_or_default(),
        })
    }

    pub fn r2_configured(&self) -> bool {
        !self.r2_account_id.is_empty()
            && !self.r2_access_key_id.is_empty()
            && !self.r2_secret_access_key.is_empty()
            && !self.r2_bucket.is_empty()
    }
}
