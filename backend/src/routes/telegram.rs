use axum::{
    extract::{Query, State},
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use serde_json::{json, Value};

use crate::{auth::AuthUser, error::AppError, AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/post", post(post_to_telegram))
        .route("/channel-name", get(get_channel_name))
}

// ── Public helper used by auth routes ─────────────────────────────────────────

/// Resolve a Telegram channel ID to a human-readable name via getChat.
/// Falls back to the raw ID string if the bot token is missing or the call fails.
pub async fn resolve_channel_name(
    http: &reqwest::Client,
    bot_token: &str,
    channel_id: &str,
) -> String {
    if bot_token.is_empty() || channel_id.trim().is_empty() {
        return channel_id.to_string();
    }
    let url = format!(
        "https://api.telegram.org/bot{}/getChat?chat_id={}",
        bot_token, channel_id
    );
    if let Ok(resp) = http.get(&url).send().await {
        if let Ok(data) = resp.json::<Value>().await {
            if data["ok"].as_bool() == Some(true) {
                let r = &data["result"];
                if let Some(title) = r["title"].as_str() {
                    return title.to_string();
                }
                if let Some(username) = r["username"].as_str() {
                    return format!("@{}", username);
                }
                if let Some(first) = r["first_name"].as_str() {
                    return first.to_string();
                }
            }
        }
    }
    channel_id.to_string()
}

// ── Handlers ──────────────────────────────────────────────────────────────────

/// Public endpoint — no auth needed so it can be called from the registration form.
#[derive(Deserialize)]
struct ChannelQuery {
    id: String,
}

async fn get_channel_name(
    State(state): State<AppState>,
    Query(params): Query<ChannelQuery>,
) -> Result<Json<Value>, AppError> {
    if state.config.telegram_bot_token.is_empty() {
        return Err(AppError::BadRequest("Telegram bot is not configured".into()));
    }
    let name = resolve_channel_name(&state.http, &state.config.telegram_bot_token, &params.id).await;
    Ok(Json(json!({ "id": params.id, "name": name })))
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
