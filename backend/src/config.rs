use anyhow::Context;

pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub port: u16,
    pub public_url: String,
    pub telegram_bot_token: String,
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
            telegram_bot_token: std::env::var("TELEGRAM_BOT_TOKEN").unwrap_or_default(),
        })
    }
}
