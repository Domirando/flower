use axum::{
    extract::{Path, State},
    routing::{get, put},
    Json, Router,
};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::{auth::AuthUser, error::AppError, models::PostWithAuthor, AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_posts).post(create_post))
        .route("/:id", put(update_post).delete(delete_post))
}

#[derive(Deserialize)]
struct PostBody {
    content: String,
}

async fn list_posts(
    State(state): State<AppState>,
    _auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    let posts = sqlx::query_as::<_, PostWithAuthor>(
        r#"
        SELECT
            p.id, p.user_id, p.content, p.created_at, p.updated_at,
            u.full_name AS author_name,
            u.avatar_url AS author_avatar
        FROM posts p
        JOIN users u ON u.id = p.user_id
        ORDER BY p.created_at DESC
        "#,
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(json!({ "posts": posts })))
}

async fn create_post(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(body): Json<PostBody>,
) -> Result<Json<Value>, AppError> {
    let content = body.content.trim().to_string();
    if content.is_empty() {
        return Err(AppError::BadRequest("Content cannot be empty".into()));
    }

    let post = sqlx::query_as::<_, PostWithAuthor>(
        r#"
        WITH inserted AS (
            INSERT INTO posts (user_id, content) VALUES ($1, $2)
            RETURNING id, user_id, content, created_at, updated_at
        )
        SELECT i.id, i.user_id, i.content, i.created_at, i.updated_at,
               u.full_name AS author_name,
               u.avatar_url AS author_avatar
        FROM inserted i
        JOIN users u ON u.id = i.user_id
        "#,
    )
    .bind(auth.user_id)
    .bind(&content)
    .fetch_one(&state.db)
    .await?;

    // Post to Telegram if the user has a channel configured
    let _ = maybe_post_telegram(&state, auth.user_id, &content).await;

    Ok(Json(json!({ "post": post })))
}

async fn update_post(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(body): Json<PostBody>,
) -> Result<Json<Value>, AppError> {
    let content = body.content.trim().to_string();
    if content.is_empty() {
        return Err(AppError::BadRequest("Content cannot be empty".into()));
    }

    let result = sqlx::query(
        r#"
        UPDATE posts SET content = $1, updated_at = NOW()
        WHERE id = $2 AND user_id = $3
        "#,
    )
    .bind(&content)
    .bind(id)
    .bind(auth.user_id)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }

    Ok(Json(json!({ "success": true })))
}

async fn delete_post(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let result = sqlx::query(
        "DELETE FROM posts WHERE id = $1 AND user_id = $2",
    )
    .bind(id)
    .bind(auth.user_id)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }

    Ok(Json(json!({ "success": true })))
}

async fn maybe_post_telegram(
    state: &AppState,
    user_id: Uuid,
    text: &str,
) -> anyhow::Result<()> {
    if state.config.telegram_bot_token.is_empty() {
        return Ok(());
    }

    let telegram_channel: Option<String> =
        sqlx::query_scalar("SELECT telegram_channel FROM users WHERE id = $1")
            .bind(user_id)
            .fetch_optional(&state.db)
            .await?;

    let channel = match telegram_channel {
        Some(c) if !c.is_empty() => c,
        _ => return Ok(()),
    };

    let url = format!(
        "https://api.telegram.org/bot{}/sendMessage",
        state.config.telegram_bot_token
    );

    state
        .http
        .post(&url)
        .json(&serde_json::json!({ "chat_id": channel, "text": text }))
        .send()
        .await?;

    Ok(())
}
