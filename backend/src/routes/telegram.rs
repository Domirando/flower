use axum::{
    extract::State,
    routing::post,
    Json, Router,
};
use serde::Deserialize;
use serde_json::{json, Value};

use crate::{auth::AuthUser, error::AppError, AppState};

pub fn router() -> Router<AppState> {
    Router::new().route("/post", post(post_to_telegram))
}

#[derive(Deserialize)]
struct TelegramBody {
    text: String,
}

async fn post_to_telegram(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(body): Json<TelegramBody>,
) -> Result<Json<Value>, AppError> {
    let text = body.text.trim().to_string();
    if text.is_empty() {
        return Err(AppError::BadRequest("Text cannot be empty".into()));
    }

    if state.config.telegram_bot_token.is_empty() {
        return Err(AppError::BadRequest(
            "Telegram bot is not configured".into(),
        ));
    }

    let telegram_channel: Option<String> =
        sqlx::query_scalar("SELECT telegram_channel FROM users WHERE id = $1")
            .bind(auth.user_id)
            .fetch_optional(&state.db)
            .await?;

    let channel = telegram_channel
        .filter(|c| !c.is_empty())
        .ok_or_else(|| AppError::BadRequest("No Telegram channel configured".into()))?;

    let url = format!(
        "https://api.telegram.org/bot{}/sendMessage",
        state.config.telegram_bot_token
    );

    let resp = state
        .http
        .post(&url)
        .json(&json!({ "chat_id": channel, "text": text }))
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("Telegram request failed: {e}"))?;

    let result: Value = resp
        .json()
        .await
        .map_err(|e| anyhow::anyhow!("Failed to parse Telegram response: {e}"))?;

    if result["ok"].as_bool() != Some(true) {
        return Err(AppError::BadRequest(
            result["description"]
                .as_str()
                .unwrap_or("Telegram post failed")
                .to_string(),
        ));
    }

    Ok(Json(json!({ "success": true })))
}
