use axum::{
    extract::{Multipart, Path, Query, State},
    routing::{delete, get, post},
    Json, Router,
};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::{auth::AuthUser, error::AppError, models::Book, AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        // POST accepts JSON {title,authors,file_url,file_key?} after presigned R2 upload
        .route("/", get(list_books).post(create_book_json))
        // Multipart fallback: file goes through backend → R2/local
        .route("/upload", post(upload_book_multipart))
        .route("/:id", delete(delete_book))
        .route("/search", get(search_books))
}

#[derive(Deserialize)]
struct SearchQuery {
    q: Option<String>,
}

async fn list_books(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    let books = sqlx::query_as::<_, Book>(
        r#"
        SELECT id, user_id, title, authors, file_url, file_path, created_at
        FROM books WHERE user_id = $1
        ORDER BY created_at DESC
        "#,
    )
    .bind(auth.user_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(json!({ "books": books })))
}

#[derive(Deserialize)]
struct CreateBookBody {
    title: String,
    #[serde(default)]
    authors: Vec<String>,
    file_url: String,
    /// R2 key — stored in file_path for later deletion
    #[serde(default)]
    file_key: String,
}

/// Called after the frontend has uploaded the file directly to R2.
async fn create_book_json(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(body): Json<CreateBookBody>,
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

    let book = sqlx::query_as::<_, Book>(
        r#"
        INSERT INTO books (user_id, title, authors, file_url, file_path)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, title, authors, file_url, file_path, created_at
        "#,
    )
    .bind(auth.user_id)
    .bind(&title)
    .bind(&body.authors)
    .bind(body.file_url.trim())
    .bind(&file_path)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(json!({ "book": book })))
}

/// Multipart upload: file goes through backend then R2/local.
async fn upload_book_multipart(
    State(state): State<AppState>,
    auth: AuthUser,
    mut multipart: Multipart,
) -> Result<Json<Value>, AppError> {
    let mut title = String::new();
    let mut authors: Vec<String> = Vec::new();
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
            "authors" => {
                let raw = field
                    .text()
                    .await
                    .map_err(|e| AppError::BadRequest(e.to_string()))?;
                authors = raw
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .collect();
            }
            "file" => {
                let original_name = field.file_name().unwrap_or("book.bin").to_string();
                let data = field
                    .bytes()
                    .await
                    .map_err(|e| AppError::BadRequest(e.to_string()))?;
                file_data = Some((data.to_vec(), original_name));
            }
            _ => {}
        }
    }

    let title = title.trim().to_string();
    if title.is_empty() {
        return Err(AppError::BadRequest("Title is required".into()));
    }

    let (data, original_name) =
        file_data.ok_or_else(|| AppError::BadRequest("File is required".into()))?;

    let ext = original_name
        .rsplit('.')
        .next()
        .unwrap_or("bin")
        .to_lowercase();

    let (file_url, file_path) = if let Some(ref r2) = state.r2 {
        let key = format!("books/{}-{}.{}", auth.user_id, Uuid::new_v4(), ext);
        let mime = book_mime(&ext);
        crate::routes::upload::upload_bytes_to_r2(r2, &state.config.r2_bucket, &key, data, mime)
            .await
            .map_err(|e| anyhow::anyhow!("R2 book upload failed: {e}"))?;
        let url = format!("{}/{}", state.config.r2_public_url.trim_end_matches('/'), key);
        (url, key)
    } else {
        let file_name = format!("{}-{}.{}", auth.user_id, Uuid::new_v4(), ext);
        let local_path = format!("uploads/books/{}", file_name);
        tokio::fs::write(&local_path, &data)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to save file: {e}"))?;
        let url = format!("{}/uploads/books/{}", state.config.public_url, file_name);
        (url, local_path)
    };

    let book = sqlx::query_as::<_, Book>(
        r#"
        INSERT INTO books (user_id, title, authors, file_url, file_path)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, title, authors, file_url, file_path, created_at
        "#,
    )
    .bind(auth.user_id)
    .bind(&title)
    .bind(&authors)
    .bind(&file_url)
    .bind(&file_path)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(json!({ "book": book })))
}

async fn delete_book(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let file_path: Option<String> =
        sqlx::query_scalar("SELECT file_path FROM books WHERE id = $1 AND user_id = $2")
            .bind(id)
            .bind(auth.user_id)
            .fetch_optional(&state.db)
            .await?;

    let path = file_path.ok_or(AppError::NotFound)?;

    sqlx::query("DELETE FROM books WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(auth.user_id)
        .execute(&state.db)
        .await?;

    if let Some(ref r2) = state.r2 {
        if !path.starts_with("uploads/") && !path.starts_with('/') {
            let _ = crate::routes::upload::delete_from_r2(r2, &state.config.r2_bucket, &path).await;
        }
    } else {
        let _ = tokio::fs::remove_file(&path).await;
    }

    Ok(Json(json!({ "success": true })))
}

async fn search_books(
    State(state): State<AppState>,
    Query(params): Query<SearchQuery>,
) -> Result<Json<Value>, AppError> {
    let q = params
        .q
        .as_deref()
        .filter(|s| !s.is_empty())
        .ok_or_else(|| AppError::BadRequest("Search query is required".into()))?;

    let response = state
        .http
        .get("https://www.googleapis.com/books/v1/volumes")
        .query(&[("q", q), ("maxResults", "20")])
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("Books API request failed: {e}"))?;

    let data: Value = response
        .json()
        .await
        .map_err(|e| anyhow::anyhow!("Failed to parse books response: {e}"))?;

    let books: Vec<Value> = data["items"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .map(|item| {
            let info = &item["volumeInfo"];
            let title = info["title"].as_str().unwrap_or("").to_string();
            let authors: Vec<&str> = info["authors"]
                .as_array()
                .map(|a| a.iter().filter_map(|v| v.as_str()).collect())
                .unwrap_or_default();
            let first_author = authors.first().copied().unwrap_or("");
            json!({
                "id": item["id"].as_str().unwrap_or(""),
                "title": title,
                "authors": authors,
                "description": info["description"].as_str().unwrap_or(""),
                "thumbnail": info["imageLinks"]["thumbnail"].as_str().unwrap_or(""),
                "previewLink": info["volumeInfo"]["previewLink"].as_str().unwrap_or(""),
                "amazonLink": format!(
                    "https://www.amazon.com/s?k={}&i=stripbooks",
                    urlencoding::encode(&format!("{} {}", title, first_author))
                ),
                "zLibraryLink": format!(
                    "https://z-lib.gs/s/{}",
                    urlencoding::encode(&title)
                ),
            })
        })
        .collect();

    Ok(Json(json!({ "books": books })))
}

fn book_mime(ext: &str) -> &'static str {
    match ext {
        "pdf" => "application/pdf",
        "epub" => "application/epub+zip",
        "mobi" => "application/x-mobipocket-ebook",
        "fb2" => "application/x-fictionbook+xml",
        _ => "application/octet-stream",
    }
}

mod urlencoding {
    pub fn encode(s: &str) -> String {
        let mut out = String::with_capacity(s.len());
        for b in s.bytes() {
            match b {
                b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                    out.push(b as char);
                }
                _ => {
                    out.push_str(&format!("%{:02X}", b));
                }
            }
        }
        out
    }
}
