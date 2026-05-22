use argon2::{
    password_hash::{rand_core::OsRng, SaltString},
    Argon2, PasswordHash, PasswordHasher, PasswordVerifier,
};
use axum::{
    extract::{Multipart, State},
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::{
    auth::{create_token, AuthUser},
    error::AppError,
    models::User,
    AppState,
};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/me", get(get_me).put(update_me))
        .route("/avatar", post(upload_avatar))
}

#[derive(Deserialize)]
struct RegisterRequest {
    email: String,
    password: String,
    full_name: String,
    bio: Option<String>,
    interests: Option<Vec<String>>,
    telegram_channel: Option<String>,
}

#[derive(Deserialize)]
struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Deserialize)]
struct UpdateProfileRequest {
    full_name: Option<String>,
    bio: Option<String>,
    interests: Option<Vec<String>>,
    telegram_channel: Option<String>,
}

async fn register(
    State(state): State<AppState>,
    Json(body): Json<RegisterRequest>,
) -> Result<Json<Value>, AppError> {
    let email = body.email.trim().to_lowercase();
    if email.is_empty() || body.password.is_empty() {
        return Err(AppError::BadRequest("Email and password are required".into()));
    }
    if body.password.len() < 6 {
        return Err(AppError::BadRequest(
            "Password must be at least 6 characters".into(),
        ));
    }

    let salt = SaltString::generate(&mut OsRng);
    let password_hash = Argon2::default()
        .hash_password(body.password.as_bytes(), &salt)
        .map_err(|e| AppError::BadRequest(e.to_string()))?
        .to_string();

    let full_name = body.full_name.trim().to_string();
    let bio = body.bio.unwrap_or_default();
    let interests = body.interests.unwrap_or_default();
    let telegram_channel = body.telegram_channel.unwrap_or_default();

    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (email, password_hash, full_name, bio, interests, telegram_channel)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, full_name, bio, interests, telegram_channel, avatar_url, created_at
        "#,
    )
    .bind(&email)
    .bind(&password_hash)
    .bind(&full_name)
    .bind(&bio)
    .bind(&interests)
    .bind(&telegram_channel)
    .fetch_one(&state.db)
    .await
    .map_err(|e| match e {
        sqlx::Error::Database(ref d) if d.constraint() == Some("users_email_key") => {
            AppError::BadRequest("Email already in use".into())
        }
        other => AppError::Sqlx(other),
    })?;

    let token =
        create_token(user.id, &state.config.jwt_secret).map_err(anyhow::Error::from)?;

    Ok(Json(json!({ "token": token, "user": user })))
}

async fn login(
    State(state): State<AppState>,
    Json(body): Json<LoginRequest>,
) -> Result<Json<Value>, AppError> {
    let email = body.email.trim().to_lowercase();

    struct Row {
        id: Uuid,
        password_hash: String,
    }
    impl<'r> sqlx::FromRow<'r, sqlx::postgres::PgRow> for Row {
        fn from_row(row: &'r sqlx::postgres::PgRow) -> Result<Self, sqlx::Error> {
            use sqlx::Row as _;
            Ok(Self {
                id: row.try_get("id")?,
                password_hash: row.try_get("password_hash")?,
            })
        }
    }

    let row = sqlx::query_as::<_, Row>(
        "SELECT id, password_hash FROM users WHERE email = $1",
    )
    .bind(&email)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::BadRequest("Invalid email or password".into()))?;

    let parsed = PasswordHash::new(&row.password_hash)
        .map_err(|_| AppError::BadRequest("Invalid credentials".into()))?;

    Argon2::default()
        .verify_password(body.password.as_bytes(), &parsed)
        .map_err(|_| AppError::BadRequest("Invalid email or password".into()))?;

    let user = sqlx::query_as::<_, User>(
        r#"
        SELECT id, email, full_name, bio, interests, telegram_channel, avatar_url, created_at
        FROM users WHERE id = $1
        "#,
    )
    .bind(row.id)
    .fetch_one(&state.db)
    .await?;

    let token =
        create_token(user.id, &state.config.jwt_secret).map_err(anyhow::Error::from)?;

    Ok(Json(json!({ "token": token, "user": user })))
}

async fn get_me(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<Json<User>, AppError> {
    let user = sqlx::query_as::<_, User>(
        r#"
        SELECT id, email, full_name, bio, interests, telegram_channel, avatar_url, created_at
        FROM users WHERE id = $1
        "#,
    )
    .bind(auth_user.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(Json(user))
}

async fn update_me(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(body): Json<UpdateProfileRequest>,
) -> Result<Json<User>, AppError> {
    let user = sqlx::query_as::<_, User>(
        r#"
        UPDATE users SET
            full_name        = COALESCE($2, full_name),
            bio              = COALESCE($3, bio),
            interests        = COALESCE($4, interests),
            telegram_channel = COALESCE($5, telegram_channel)
        WHERE id = $1
        RETURNING id, email, full_name, bio, interests, telegram_channel, avatar_url, created_at
        "#,
    )
    .bind(auth_user.user_id)
    .bind(body.full_name.as_deref())
    .bind(body.bio.as_deref())
    .bind(body.interests.as_deref())
    .bind(body.telegram_channel.as_deref())
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(Json(user))
}

async fn upload_avatar(
    State(state): State<AppState>,
    auth_user: AuthUser,
    mut multipart: Multipart,
) -> Result<Json<Value>, AppError> {
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::BadRequest(e.to_string()))?
    {
        if field.name() != Some("file") {
            continue;
        }

        let original_name = field
            .file_name()
            .unwrap_or("avatar.bin")
            .to_string();
        let ext = original_name
            .rsplit('.')
            .next()
            .unwrap_or("bin")
            .to_lowercase();

        let data = field
            .bytes()
            .await
            .map_err(|e| AppError::BadRequest(e.to_string()))?;

        let file_name = format!("{}.{}", auth_user.user_id, ext);
        let save_path = format!("uploads/avatars/{}", file_name);

        tokio::fs::write(&save_path, &data)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to save avatar: {e}"))?;

        let avatar_url = format!(
            "{}/uploads/avatars/{}",
            state.config.public_url, file_name
        );

        sqlx::query("UPDATE users SET avatar_url = $1 WHERE id = $2")
            .bind(&avatar_url)
            .bind(auth_user.user_id)
            .execute(&state.db)
            .await?;

        return Ok(Json(json!({ "avatar_url": avatar_url })));
    }

    Err(AppError::BadRequest("No file provided".into()))
}
