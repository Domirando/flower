use axum::{
    extract::{Multipart, Path, State},
    routing::{get, post, put},
    Json, Router,
};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::{auth::AuthUser, error::AppError, models::PostWithAuthor, AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_posts).post(create_post))
        .route("/mine", get(list_my_posts))
        .route("/upload-image", post(upload_image))
        .route("/:id", put(update_post).delete(delete_post))
}

#[derive(Deserialize)]
struct PostBody {
    content: String,
    /// Explicit list of Telegram channels to post to.
    /// If omitted the user's configured channels are used.
    channels: Option<Vec<String>>,
    /// Optional file attachments to send as Telegram documents alongside the post.
    attachments: Option<Vec<Attachment>>,
}

#[derive(Deserialize, Clone)]
struct Attachment {
    url: String,
    name: String,
    /// "document" | "audio" — determines which Telegram send* method is used
    #[serde(rename = "type")]
    kind: String,
}

// ── Markdown → Telegram HTML ──────────────────────────────────────────────────

/// Convert Markdown to Telegram-compatible HTML (parse_mode="HTML").
/// Supported: headers, bold, italic, strikethrough, inline code, fenced code
/// blocks, links, unordered lists, ordered lists, blockquotes.
/// Inline images are skipped (the poster is sent separately via sendPhoto).
fn markdown_to_telegram_html(text: &str) -> String {
    let lines: Vec<&str> = text.lines().collect();
    let mut out = String::with_capacity(text.len() + 64);
    let n = lines.len();
    let mut i = 0;
    let mut in_code_block = false;

    while i < n {
        let line = lines[i];

        // Fenced code block boundary
        if line.trim_start().starts_with("```") {
            if in_code_block {
                out.push_str("</pre>\n");
                in_code_block = false;
            } else {
                out.push_str("<pre>");
                in_code_block = true;
            }
            i += 1;
            continue;
        }

        if in_code_block {
            escape_html_into(&mut out, line);
            out.push('\n');
            i += 1;
            continue;
        }

        if line.trim().is_empty() {
            out.push('\n');
            i += 1;
            continue;
        }

        // Headings
        let heading_chars = line.chars().take_while(|&c| c == '#').count();
        if heading_chars > 0 && line.as_bytes().get(heading_chars) == Some(&b' ') {
            let rest = &line[heading_chars + 1..];
            if heading_chars <= 2 {
                out.push_str("<b>");
                process_inline(&mut out, rest);
                out.push_str("</b>\n");
            } else {
                out.push_str("<b><i>");
                process_inline(&mut out, rest);
                out.push_str("</i></b>\n");
            }
        } else if let Some(rest) = line.strip_prefix("- ").or_else(|| line.strip_prefix("* ")) {
            out.push_str("• ");
            process_inline(&mut out, rest);
            out.push('\n');
        } else if let Some(rest) = strip_ordered_list(line) {
            out.push_str("• ");
            process_inline(&mut out, rest);
            out.push('\n');
        } else if let Some(rest) = line.strip_prefix("> ") {
            out.push_str("<blockquote>");
            process_inline(&mut out, rest);
            out.push_str("</blockquote>\n");
        } else {
            process_inline(&mut out, line);
            out.push('\n');
        }

        i += 1;
    }

    if in_code_block {
        out.push_str("</pre>");
    }

    out.trim().to_string()
}

fn strip_ordered_list(line: &str) -> Option<&str> {
    let bytes = line.as_bytes();
    let mut j = 0;
    while j < bytes.len() && bytes[j].is_ascii_digit() {
        j += 1;
    }
    if j > 0 && bytes.get(j) == Some(&b'.') && bytes.get(j + 1) == Some(&b' ') {
        Some(&line[j + 2..])
    } else {
        None
    }
}

fn escape_html_into(out: &mut String, text: &str) {
    for c in text.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            c => out.push(c),
        }
    }
}

/// Parse inline Markdown spans and append Telegram HTML to `out`.
fn process_inline(out: &mut String, text: &str) {
    let chars: Vec<char> = text.chars().collect();
    let n = chars.len();
    let mut i = 0;

    while i < n {
        // Skip inline images: ![alt](url)
        if chars[i] == '!' && chars.get(i + 1) == Some(&'[') {
            if let Some(j) = find_char(&chars, i + 2, ']') {
                if chars.get(j + 1) == Some(&'(') {
                    if let Some(k) = find_char(&chars, j + 2, ')') {
                        i = k + 1;
                        continue;
                    }
                }
            }
        }

        // ~~strikethrough~~
        if chars[i] == '~' && chars.get(i + 1) == Some(&'~') {
            if let Some(j) = find_double(&chars, i + 2, '~') {
                out.push_str("<s>");
                escape_chars(out, &chars[i + 2..j]);
                out.push_str("</s>");
                i = j + 2;
                continue;
            }
        }

        // **bold**
        if chars[i] == '*' && chars.get(i + 1) == Some(&'*') {
            if let Some(j) = find_double(&chars, i + 2, '*') {
                out.push_str("<b>");
                escape_chars(out, &chars[i + 2..j]);
                out.push_str("</b>");
                i = j + 2;
                continue;
            }
        }

        // *italic* (single star, not followed by another star)
        if chars[i] == '*' && chars.get(i + 1) != Some(&'*') {
            if let Some(j) = find_char(&chars, i + 1, '*') {
                out.push_str("<i>");
                escape_chars(out, &chars[i + 1..j]);
                out.push_str("</i>");
                i = j + 1;
                continue;
            }
        }

        // _italic_
        if chars[i] == '_' {
            if let Some(j) = find_char(&chars, i + 1, '_') {
                out.push_str("<i>");
                escape_chars(out, &chars[i + 1..j]);
                out.push_str("</i>");
                i = j + 1;
                continue;
            }
        }

        // `inline code`
        if chars[i] == '`' {
            if let Some(j) = find_char(&chars, i + 1, '`') {
                out.push_str("<code>");
                escape_chars(out, &chars[i + 1..j]);
                out.push_str("</code>");
                i = j + 1;
                continue;
            }
        }

        // [link text](url)
        if chars[i] == '[' {
            if let Some(j) = find_char(&chars, i + 1, ']') {
                if chars.get(j + 1) == Some(&'(') {
                    if let Some(k) = find_char(&chars, j + 2, ')') {
                        let url: String = chars[j + 2..k].iter().collect();
                        if url.starts_with("http://") || url.starts_with("https://") {
                            out.push_str("<a href=\"");
                            for c in url.chars() {
                                if c == '&' { out.push_str("&amp;"); } else { out.push(c); }
                            }
                            out.push_str("\">");
                            escape_chars(out, &chars[i + 1..j]);
                            out.push_str("</a>");
                            i = k + 1;
                            continue;
                        }
                    }
                }
            }
        }

        match chars[i] {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            c => out.push(c),
        }
        i += 1;
    }
}

fn find_char(chars: &[char], start: usize, target: char) -> Option<usize> {
    chars[start..].iter().position(|&c| c == target).map(|p| start + p)
}

fn find_double(chars: &[char], start: usize, ch: char) -> Option<usize> {
    let mut i = start;
    while i + 1 < chars.len() {
        if chars[i] == ch && chars[i + 1] == ch {
            return Some(i);
        }
        i += 1;
    }
    None
}

fn escape_chars(out: &mut String, chars: &[char]) {
    for &c in chars {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            c => out.push(c),
        }
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/// Extract `![poster](url)` from the first line. Returns (poster_url, rest).
fn extract_poster(content: &str) -> (Option<String>, &str) {
    if let Some(rest) = content.strip_prefix("![poster](") {
        if let Some(paren) = rest.find(')') {
            let url = rest[..paren].to_string();
            let after = rest[paren + 1..].trim_start_matches('\n');
            return (Some(url), after);
        }
    }
    (None, content)
}

// ── Handlers ─────────────────────────────────────────────────────────────────

async fn list_posts(
    State(state): State<AppState>,
    _auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    let posts = sqlx::query_as::<_, PostWithAuthor>(
        r#"
        SELECT
            p.id, p.user_id, p.content, p.created_at, p.updated_at,
            p.telegram_channels,
            u.full_name  AS author_name,
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

async fn list_my_posts(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    let posts = sqlx::query_as::<_, PostWithAuthor>(
        r#"
        SELECT
            p.id, p.user_id, p.content, p.created_at, p.updated_at,
            p.telegram_channels,
            u.full_name  AS author_name,
            u.avatar_url AS author_avatar
        FROM posts p
        JOIN users u ON u.id = p.user_id
        WHERE p.user_id = $1
        ORDER BY p.created_at DESC
        "#,
    )
    .bind(auth.user_id)
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
               u.full_name AS author_name, u.avatar_url AS author_avatar
        FROM inserted i
        JOIN users u ON u.id = i.user_id
        "#,
    )
    .bind(auth.user_id)
    .bind(&content)
    .fetch_one(&state.db)
    .await?;

    let channels = if let Some(ref chs) = body.channels {
        chs.iter().filter(|c| !c.is_empty()).cloned().collect::<Vec<_>>()
    } else {
        let rows: Vec<String> =
            sqlx::query_scalar("SELECT UNNEST(telegram_channels) FROM users WHERE id = $1")
                .bind(auth.user_id)
                .fetch_all(&state.db)
                .await
                .unwrap_or_default();
        rows
    };

    // Persist which channels this post was sent to
    sqlx::query("UPDATE posts SET telegram_channels = $1 WHERE id = $2")
        .bind(&channels)
        .bind(post.id)
        .execute(&state.db)
        .await?;

    if !state.config.telegram_bot_token.is_empty() {
        let attachments = body.attachments.unwrap_or_default();
        for channel in &channels {
            let _ = send_to_telegram(&state, channel, &content, &attachments).await;
        }
    }

    let post = sqlx::query_as::<_, PostWithAuthor>(
        r#"
        SELECT
            p.id, p.user_id, p.content, p.created_at, p.updated_at,
            p.telegram_channels,
            u.full_name  AS author_name,
            u.avatar_url AS author_avatar
        FROM posts p
        JOIN users u ON u.id = p.user_id
        WHERE p.id = $1
        "#,
    )
    .bind(post.id)
    .fetch_one(&state.db)
    .await?;

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
        "UPDATE posts SET content = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3",
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

async fn upload_image(
    State(state): State<AppState>,
    _auth: AuthUser,
    mut multipart: Multipart,
) -> Result<Json<Value>, AppError> {
    let mut file_data: Option<(Vec<u8>, String)> = None;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::BadRequest(e.to_string()))?
    {
        if field.name().unwrap_or("") == "image" {
            let original_name = field.file_name().unwrap_or("image.bin").to_string();
            let data = field
                .bytes()
                .await
                .map_err(|e| AppError::BadRequest(e.to_string()))?;
            file_data = Some((data.to_vec(), original_name));
        }
    }

    let (data, original_name) =
        file_data.ok_or_else(|| AppError::BadRequest("Image is required".into()))?;

    let ext = original_name.rsplit('.').next().unwrap_or("bin").to_lowercase();
    if !matches!(ext.as_str(), "jpg" | "jpeg" | "png" | "gif" | "webp") {
        return Err(AppError::BadRequest("Unsupported image format".into()));
    }

    let url = if let Some(ref r2) = state.r2 {
        let key = format!("images/{}.{}", Uuid::new_v4(), ext);
        let mime = match ext.as_str() {
            "png" => "image/png",
            "gif" => "image/gif",
            "webp" => "image/webp",
            _ => "image/jpeg",
        };
        crate::routes::upload::upload_bytes_to_r2(r2, &state.config.r2_bucket, &key, data, mime)
            .await
            .map_err(|e| anyhow::anyhow!("R2 image upload failed: {e}"))?;
        format!("{}/{}", state.config.r2_public_url.trim_end_matches('/'), key)
    } else {
        let file_name = format!("{}.{}", Uuid::new_v4(), ext);
        let file_path = format!("uploads/images/{}", file_name);
        tokio::fs::write(&file_path, &data)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to save image: {e}"))?;
        format!("{}/uploads/images/{}", state.config.public_url, file_name)
    };

    Ok(Json(json!({ "url": url })))
}

// ── Telegram ─────────────────────────────────────────────────────────────────

async fn send_to_telegram(
    state: &AppState,
    channel: &str,
    content: &str,
    attachments: &[Attachment],
) -> anyhow::Result<()> {
    let (poster_url, body_text) = extract_poster(content);
    let html = markdown_to_telegram_html(body_text);
    let bot = &state.config.telegram_bot_token;

    if let Some(ref photo_url) = poster_url {
        let is_public_url = photo_url.starts_with("https://")
            && !photo_url.contains("localhost")
            && !photo_url.contains("127.0.0.1");

        if is_public_url {
            // R2 / CDN URL — Telegram can fetch it directly.
            let caption: String = html.chars().take(1024).collect();
            let mut body = json!({
                "chat_id": channel,
                "photo": photo_url,
            });
            if !caption.is_empty() {
                body["caption"] = json!(caption);
                body["parse_mode"] = json!("HTML");
            }
            state
                .http
                .post(format!("https://api.telegram.org/bot{bot}/sendPhoto"))
                .json(&body)
                .send()
                .await?;
        } else {
            // Local file — read bytes and upload as multipart.
            let local_path = photo_url
                .strip_prefix(&format!("{}/", state.config.public_url))
                .unwrap_or(photo_url);
            let file_data = tokio::fs::read(local_path)
                .await
                .map_err(|e| anyhow::anyhow!("Failed to read poster '{local_path}': {e}"))?;
            let ext = local_path.rsplit('.').next().unwrap_or("jpg").to_lowercase();
            let mime = match ext.as_str() {
                "png" => "image/png",
                "gif" => "image/gif",
                "webp" => "image/webp",
                _ => "image/jpeg",
            };
            let part = reqwest::multipart::Part::bytes(file_data)
                .file_name(format!("photo.{ext}"))
                .mime_str(mime)?;
            let mut form = reqwest::multipart::Form::new()
                .text("chat_id", channel.to_string())
                .part("photo", part);
            if !html.is_empty() {
                let caption: String = html.chars().take(1024).collect();
                form = form.text("caption", caption).text("parse_mode", "HTML");
            }
            state
                .http
                .post(format!("https://api.telegram.org/bot{bot}/sendPhoto"))
                .multipart(form)
                .send()
                .await?;
        }
    } else if !html.is_empty() {
        // Text-only message. Telegram sendMessage limit: 4096 chars.
        let text: String = html.chars().take(4096).collect();
        state
            .http
            .post(format!("https://api.telegram.org/bot{bot}/sendMessage"))
            .json(&json!({
                "chat_id":    channel,
                "text":       text,
                "parse_mode": "HTML",
            }))
            .send()
            .await?;
    }

    // Send file attachments as documents/audio.
    for att in attachments {
        if att.url.is_empty() {
            continue;
        }
        let method = if att.kind == "audio" { "sendAudio" } else { "sendDocument" };
        let file_field = if att.kind == "audio" { "audio" } else { "document" };
        let _ = state
            .http
            .post(format!("https://api.telegram.org/bot{bot}/{method}"))
            .json(&json!({
                "chat_id":    channel,
                file_field:   att.url,
                // attach filename via title caption if provided
                "caption":    att.name,
            }))
            .send()
            .await;
    }

    Ok(())
}
