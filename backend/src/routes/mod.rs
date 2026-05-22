pub mod auth;
pub mod books;
pub mod news;
pub mod posts;
pub mod telegram;

use axum::Json;
use serde_json::{json, Value};

pub async fn health() -> Json<Value> {
    Json(json!({ "status": "ok" }))
}
