use axum::{
    extract::{Multipart, Path, Query, State},
    response::Redirect,
    routing::{delete, get, post},
    Json, Router,
};
use chrono::Utc;
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::{auth::AuthUser, error::AppError, models::Song, AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        // Own songs — POST accepts JSON {title,artist,file_url,file_key?} (presigned-upload flow)
        .route("/songs", get(list_songs).post(create_song_json))
        // Multipart fallback: file goes through backend → R2/local
        .route("/songs/upload", post(upload_song_multipart))
        .route("/songs/:id", delete(delete_song))
        // Spotify OAuth
        .route("/spotify/auth-url", get(spotify_auth_url))
        .route("/spotify/callback", get(spotify_callback))
        .route("/spotify/disconnect", post(spotify_disconnect))
        // Spotify data
        .route("/spotify/status", get(spotify_status))
        .route("/spotify/token", get(spotify_token))
        .route("/spotify/playlists", get(spotify_playlists))
}

// ── Own songs ─────────────────────────────────────────────────────────────────

async fn list_songs(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    let songs = sqlx::query_as::<_, Song>(
        "SELECT id, user_id, title, artist, file_url, created_at FROM songs WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(auth.user_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(json!({ "songs": songs })))
}

#[derive(Deserialize)]
struct CreateSongBody {
    title: String,
    #[serde(default)]
    artist: String,
    file_url: String,
    /// R2 key — stored in file_path for later deletion
    #[serde(default)]
    file_key: String,
}

/// Called after the frontend has uploaded the file directly to R2 via presigned URL.
async fn create_song_json(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(body): Json<CreateSongBody>,
) -> Result<Json<Value>, AppError> {
    let title = body.title.trim().to_string();
    if title.is_empty() {
        return Err(AppError::BadRequest("Title is required".into()));
    }
    if body.file_url.trim().is_empty() {
        return Err(AppError::BadRequest("file_url is required".into()));
    }

    let file_path = if body.file_key.trim().is_empty() {
        body.file_url.trim().to_string()
    } else {
        body.file_key.trim().to_string()
    };

    let song = sqlx::query_as::<_, Song>(
        r#"
        INSERT INTO songs (user_id, title, artist, file_url, file_path)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, title, artist, file_url, created_at
        "#,
    )
    .bind(auth.user_id)
    .bind(&title)
    .bind(body.artist.trim())
    .bind(body.file_url.trim())
    .bind(&file_path)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(json!({ "song": song })))
}

/// Multipart upload: file sent through the backend, then stored on R2 (or local disk).
async fn upload_song_multipart(
    State(state): State<AppState>,
    auth: AuthUser,
    mut multipart: Multipart,
) -> Result<Json<Value>, AppError> {
    let mut title = String::new();
    let mut artist = String::new();
    let mut file_data: Option<(Vec<u8>, String)> = None;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::BadRequest(e.to_string()))?
    {
        let name = field.name().unwrap_or("").to_string();
        match name.as_str() {
            "title" => {
                title = field
                    .text()
                    .await
                    .map_err(|e| AppError::BadRequest(e.to_string()))?;
            }
            "artist" => {
                artist = field
                    .text()
                    .await
                    .map_err(|e| AppError::BadRequest(e.to_string()))?;
            }
            "file" => {
                let original_name = field.file_name().unwrap_or("song.bin").to_string();
                let data = field
                    .bytes()
                    .await
                    .map_err(|e| AppError::BadRequest(e.to_string()))?;
                file_data = Some((data.to_vec(), original_name));
            }
            _ => {}
        }
    }

    let (data, original_name) =
        file_data.ok_or_else(|| AppError::BadRequest("File is required".into()))?;

    let ext = original_name.rsplit('.').next().unwrap_or("bin").to_lowercase();
    if !matches!(ext.as_str(), "mp3" | "wav" | "flac" | "ogg" | "m4a" | "aac") {
        return Err(AppError::BadRequest("Unsupported audio format".into()));
    }

    let title = if title.trim().is_empty() {
        original_name
            .rsplit_once('.')
            .map(|(n, _)| n)
            .unwrap_or(&original_name)
            .to_string()
    } else {
        title.trim().to_string()
    };

    let (file_url, file_path) = if let Some(ref r2) = state.r2 {
        let key = format!("songs/{}-{}.{}", auth.user_id, Uuid::new_v4(), ext);
        let mime = audio_mime(&ext);
        crate::routes::upload::upload_bytes_to_r2(r2, &state.config.r2_bucket, &key, data, mime)
            .await
            .map_err(|e| anyhow::anyhow!("R2 song upload failed: {e}"))?;
        let url = format!("{}/{}", state.config.r2_public_url.trim_end_matches('/'), key);
        (url, key)
    } else {
        let file_name = format!("{}-{}.{}", auth.user_id, Uuid::new_v4(), ext);
        let local_path = format!("uploads/songs/{}", file_name);
        tokio::fs::write(&local_path, &data)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to save song: {e}"))?;
        let url = format!("{}/uploads/songs/{}", state.config.public_url, file_name);
        (url, local_path)
    };

    let song = sqlx::query_as::<_, Song>(
        r#"
        INSERT INTO songs (user_id, title, artist, file_url, file_path)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, title, artist, file_url, created_at
        "#,
    )
    .bind(auth.user_id)
    .bind(&title)
    .bind(artist.trim())
    .bind(&file_url)
    .bind(&file_path)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(json!({ "song": song })))
}

async fn delete_song(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let file_path: Option<String> =
        sqlx::query_scalar("SELECT file_path FROM songs WHERE id = $1 AND user_id = $2")
            .bind(id)
            .bind(auth.user_id)
            .fetch_optional(&state.db)
            .await?;

    let path = file_path.ok_or(AppError::NotFound)?;

    sqlx::query("DELETE FROM songs WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(auth.user_id)
        .execute(&state.db)
        .await?;

    // Delete from R2 if path looks like an R2 key (e.g. "songs/uuid.mp3")
    // Local paths start with "uploads/"
    if let Some(ref r2) = state.r2 {
        if !path.starts_with("uploads/") && !path.starts_with('/') {
            let _ = crate::routes::upload::delete_from_r2(r2, &state.config.r2_bucket, &path).await;
        }
    } else {
        let _ = tokio::fs::remove_file(&path).await;
    }

    Ok(Json(json!({ "success": true })))
}

fn audio_mime(ext: &str) -> &'static str {
    match ext {
        "mp3" => "audio/mpeg",
        "wav" => "audio/wav",
        "flac" => "audio/flac",
        "ogg" => "audio/ogg",
        "m4a" | "aac" => "audio/mp4",
        _ => "application/octet-stream",
    }
}

// ── Spotify OAuth ─────────────────────────────────────────────────────────────

async fn spotify_auth_url(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    if state.config.spotify_client_id.is_empty() {
        return Err(AppError::BadRequest("Spotify is not configured on this server".into()));
    }

    let scopes = "user-read-email playlist-read-private playlist-read-collaborative streaming user-read-playback-state user-modify-playback-state";
    let state_param = auth.user_id.to_string();

    let url = format!(
        "https://accounts.spotify.com/authorize?response_type=code&client_id={}&scope={}&redirect_uri={}&state={}",
        urlencoding(&state.config.spotify_client_id),
        urlencoding(scopes),
        urlencoding(&state.config.spotify_redirect_uri),
        urlencoding(&state_param),
    );

    Ok(Json(json!({ "url": url })))
}

#[derive(Deserialize)]
struct CallbackQuery {
    code: Option<String>,
    state: Option<String>,
    error: Option<String>,
}

async fn spotify_callback(
    State(state): State<AppState>,
    Query(params): Query<CallbackQuery>,
) -> Result<Redirect, AppError> {
    let frontend = state.config.frontend_url.trim_end_matches('/').to_string();

    if let Some(err) = params.error {
        return Ok(Redirect::temporary(&format!("{}/music?spotify_error={}", frontend, urlencoding(&err))));
    }

    let code = params.code.ok_or_else(|| AppError::BadRequest("Missing code".into()))?;
    let user_id_str = params.state.ok_or_else(|| AppError::BadRequest("Missing state".into()))?;
    let user_id = user_id_str.parse::<Uuid>().map_err(|_| AppError::BadRequest("Invalid state".into()))?;

    let token_resp = state
        .http
        .post("https://accounts.spotify.com/api/token")
        .basic_auth(&state.config.spotify_client_id, Some(&state.config.spotify_client_secret))
        .form(&[
            ("grant_type", "authorization_code"),
            ("code", &code),
            ("redirect_uri", &state.config.spotify_redirect_uri),
        ])
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("Spotify token request failed: {e}"))?;

    let token_json: Value = token_resp
        .json()
        .await
        .map_err(|e| anyhow::anyhow!("Failed to parse Spotify token response: {e}"))?;

    let access_token = token_json["access_token"]
        .as_str()
        .ok_or_else(|| AppError::BadRequest("No access token in Spotify response".into()))?;
    let refresh_token = token_json["refresh_token"].as_str().unwrap_or("");
    let expires_in = token_json["expires_in"].as_i64().unwrap_or(3600);
    let expiry = Utc::now() + chrono::Duration::seconds(expires_in);

    sqlx::query(
        "UPDATE users SET spotify_token = $1, spotify_refresh = $2, spotify_expiry = $3 WHERE id = $4",
    )
    .bind(access_token)
    .bind(refresh_token)
    .bind(expiry)
    .bind(user_id)
    .execute(&state.db)
    .await?;

    Ok(Redirect::temporary(&format!("{}/music?spotify_connected=true", frontend)))
}

async fn spotify_disconnect(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    sqlx::query(
        "UPDATE users SET spotify_token = '', spotify_refresh = '', spotify_expiry = NULL WHERE id = $1",
    )
    .bind(auth.user_id)
    .execute(&state.db)
    .await?;

    Ok(Json(json!({ "success": true })))
}

// ── Spotify data ──────────────────────────────────────────────────────────────

async fn spotify_status(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    let token: Option<String> =
        sqlx::query_scalar("SELECT spotify_token FROM users WHERE id = $1")
            .bind(auth.user_id)
            .fetch_optional(&state.db)
            .await?
            .flatten();

    let connected = token.map(|t| !t.is_empty()).unwrap_or(false);
    Ok(Json(json!({ "connected": connected })))
}

async fn spotify_token(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    struct Row {
        spotify_token: String,
        spotify_refresh: String,
        spotify_expiry: Option<chrono::DateTime<Utc>>,
    }
    impl<'r> sqlx::FromRow<'r, sqlx::postgres::PgRow> for Row {
        fn from_row(row: &'r sqlx::postgres::PgRow) -> Result<Self, sqlx::Error> {
            use sqlx::Row as _;
            Ok(Self {
                spotify_token: row.try_get("spotify_token")?,
                spotify_refresh: row.try_get("spotify_refresh")?,
                spotify_expiry: row.try_get("spotify_expiry")?,
            })
        }
    }

    let row = sqlx::query_as::<_, Row>(
        "SELECT spotify_token, spotify_refresh, spotify_expiry FROM users WHERE id = $1",
    )
    .bind(auth.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    if row.spotify_token.is_empty() {
        return Err(AppError::BadRequest("Spotify not connected".into()));
    }

    let needs_refresh = row
        .spotify_expiry
        .map(|exp| exp - chrono::Duration::minutes(5) < Utc::now())
        .unwrap_or(true);

    if needs_refresh && !row.spotify_refresh.is_empty() {
        let resp = state
            .http
            .post("https://accounts.spotify.com/api/token")
            .basic_auth(&state.config.spotify_client_id, Some(&state.config.spotify_client_secret))
            .form(&[
                ("grant_type", "refresh_token"),
                ("refresh_token", &row.spotify_refresh),
            ])
            .send()
            .await
            .map_err(|e| anyhow::anyhow!("Spotify refresh failed: {e}"))?;

        let token_json: Value = resp.json().await.map_err(|e| anyhow::anyhow!("{e}"))?;
        if let Some(new_token) = token_json["access_token"].as_str() {
            let expires_in = token_json["expires_in"].as_i64().unwrap_or(3600);
            let expiry = Utc::now() + chrono::Duration::seconds(expires_in);
            sqlx::query(
                "UPDATE users SET spotify_token = $1, spotify_expiry = $2 WHERE id = $3",
            )
            .bind(new_token)
            .bind(expiry)
            .bind(auth.user_id)
            .execute(&state.db)
            .await?;
            return Ok(Json(json!({ "access_token": new_token })));
        }
    }

    Ok(Json(json!({ "access_token": row.spotify_token })))
}

async fn spotify_playlists(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    let token_resp = spotify_token(State(state.clone()), auth).await?;
    let token = token_resp
        .0
        .get("access_token")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::BadRequest("Could not get Spotify token".into()))?
        .to_string();

    let resp = state
        .http
        .get("https://api.spotify.com/v1/me/playlists?limit=50")
        .bearer_auth(&token)
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("Spotify API error: {e}"))?;

    let data: Value = resp
        .json()
        .await
        .map_err(|e| anyhow::anyhow!("Failed to parse playlists: {e}"))?;

    Ok(Json(json!({ "playlists": data["items"] })))
}

// ── Utils ─────────────────────────────────────────────────────────────────────

fn urlencoding(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for b in s.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(b as char);
            }
            _ => out.push_str(&format!("%{:02X}", b)),
        }
    }
    out
}
