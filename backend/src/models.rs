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
    pub avatar_url: String,
    pub created_at: DateTime<Utc>,
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
