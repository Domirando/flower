use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub full_name: String,
    pub bio: String,
    pub interests: Vec<String>,
    pub telegram_channel: String,
    pub telegram_channels: Vec<String>,
    pub telegram_channel_names: Vec<String>,
    pub avatar_url: String,
    pub created_at: DateTime<Utc>,
    // Spotify fields: stored but not serialised to the client
    #[sqlx(default)]
    #[serde(skip)]
    pub spotify_token: String,
    #[sqlx(default)]
    #[serde(skip)]
    pub spotify_refresh: String,
    #[sqlx(default)]
    #[serde(skip)]
    pub spotify_expiry: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Post {
    pub id: Uuid,
    pub user_id: Uuid,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct PostWithAuthor {
    pub id: Uuid,
    pub user_id: Uuid,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub author_name: String,
    pub author_avatar: String,
    #[sqlx(default)]
    pub telegram_channels: Vec<String>,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Book {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub authors: Vec<String>,
    pub file_url: String,
    pub file_path: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Song {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub artist: String,
    pub file_url: String,
    pub created_at: DateTime<Utc>,
}
