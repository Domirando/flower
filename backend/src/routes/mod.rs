pub mod auth;
pub mod books;
pub mod music;
pub mod news;
pub mod posts;
pub mod telegram;
pub mod upload;

use axum::Json;
use serde_json::{json, Value};

pub async fn health() -> Json<Value> {
    Json(json!({ "status": "ok" }))
}
