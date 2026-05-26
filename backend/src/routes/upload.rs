use axum::{extract::State, routing::post, Json, Router};
use serde::Deserialize;
use serde_json::{json, Value};
use std::time::Duration;
use uuid::Uuid;

use crate::{auth::AuthUser, error::AppError, AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/r2-presign", post(r2_presign))
        .route("/ut-presign", post(ut_presign))
}

#[derive(Deserialize)]
struct PresignRequest {
    filename: String,
    content_type: String,
    /// One of: "songs", "books", "images", "avatars"
    category: String,
}

/// Generate a Cloudflare R2 presigned PUT URL for direct browser → R2 uploads.
async fn r2_presign(
    State(state): State<AppState>,
    _auth: AuthUser,
    Json(body): Json<PresignRequest>,
) -> Result<Json<Value>, AppError> {
    let r2 = state
        .r2
        .as_ref()
        .ok_or_else(|| AppError::BadRequest("R2 storage is not configured on this server".into()))?;

    if !matches!(body.category.as_str(), "songs" | "books" | "images" | "avatars") {
        return Err(AppError::BadRequest(
            "category must be one of: songs, books, images, avatars".into(),
        ));
    }

    let ext = body.filename.rsplit('.').next().unwrap_or("bin").to_lowercase();
    let key = format!("{}/{}.{}", body.category, Uuid::new_v4(), ext);

    use aws_sdk_s3::presigning::PresigningConfig;

    let presigned = r2
        .put_object()
        .bucket(&state.config.r2_bucket)
        .key(&key)
        .content_type(&body.content_type)
        .presigned(
            PresigningConfig::expires_in(Duration::from_secs(3600))
                .map_err(|e| anyhow::anyhow!("PresigningConfig error: {e}"))?,
        )
        .await
        .map_err(|e| anyhow::anyhow!("Failed to generate R2 presigned URL: {e}"))?;

    let public_url = format!(
        "{}/{}",
        state.config.r2_public_url.trim_end_matches('/'),
        key
    );

    Ok(Json(json!({
        "upload_url": presigned.uri().to_string(),
        "key": key,
        "public_url": public_url,
    })))
}

#[derive(Deserialize)]
struct UTPresignRequest {
    filename: String,
    size: u64,
    #[serde(rename = "type")]
    content_type: String,
}

/// Get UploadThing presigned upload credentials for direct browser → UT uploads.
/// Requires UPLOADTHING_TOKEN env var.
async fn ut_presign(
    State(state): State<AppState>,
    _auth: AuthUser,
    Json(body): Json<UTPresignRequest>,
) -> Result<Json<Value>, AppError> {
    if state.config.uploadthing_token.is_empty() {
        return Err(AppError::BadRequest(
            "UploadThing is not configured on this server (UPLOADTHING_TOKEN missing)".into(),
        ));
    }

    let resp = state
        .http
        .post("https://api.uploadthing.com/v6/uploadFiles")
        .header("x-uploadthing-api-key", &state.config.uploadthing_token)
        .json(&json!({
            "files": [{
                "name": body.filename,
                "size": body.size,
                "type": body.content_type,
                "customId": null
            }],
            "acl": "public-read",
            "contentDisposition": "inline"
        }))
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("UploadThing request failed: {e}"))?;

    let data: Value = resp
        .json()
        .await
        .map_err(|e| anyhow::anyhow!("Failed to parse UploadThing response: {e}"))?;

    if let Some(err) = data.get("error") {
        return Err(AppError::BadRequest(
            err.as_str().unwrap_or("UploadThing error").to_string(),
        ));
    }

    let file_data = &data["data"][0];
    Ok(Json(json!({
        "url":      file_data["url"],
        "fields":   file_data["fields"],
        "file_url": file_data["fileUrl"],
        "key":      file_data["key"],
    })))
}

// ── Shared R2 helpers (used by other route modules) ──────────────────────────

/// Upload bytes to R2 and return the public URL.
pub async fn upload_bytes_to_r2(
    r2: &aws_sdk_s3::Client,
    bucket: &str,
    key: &str,
    data: Vec<u8>,
    content_type: &str,
) -> anyhow::Result<()> {
    use aws_sdk_s3::primitives::ByteStream;

    r2.put_object()
        .bucket(bucket)
        .key(key)
        .body(ByteStream::from(data))
        .content_type(content_type)
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("R2 upload failed: {e}"))?;

    Ok(())
}

/// Delete an object from R2 by key.
pub async fn delete_from_r2(
    r2: &aws_sdk_s3::Client,
    bucket: &str,
    key: &str,
) -> anyhow::Result<()> {
    r2.delete_object()
        .bucket(bucket)
        .key(key)
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("R2 delete failed: {e}"))?;
    Ok(())
}
