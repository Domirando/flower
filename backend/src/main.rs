use axum::{extract::DefaultBodyLimit, routing::get, Router};
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use tower_http::{
    cors::{Any, CorsLayer},
    services::ServeDir,
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod auth;
mod config;
mod error;
mod models;
mod routes;

use config::Config;

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub config: Arc<Config>,
    pub http: reqwest::Client,
    pub r2: Option<aws_sdk_s3::Client>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "flower_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    dotenvy::dotenv().ok();

    let config = Arc::new(Config::from_env()?);

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await?;

    sqlx::migrate!("./migrations").run(&pool).await?;

    // Local upload dirs still used as fallback when R2 is not configured
    tokio::fs::create_dir_all("uploads/avatars").await?;
    tokio::fs::create_dir_all("uploads/books").await?;
    tokio::fs::create_dir_all("uploads/images").await?;
    tokio::fs::create_dir_all("uploads/songs").await?;

    let r2 = build_r2_client(&config);
    if r2.is_some() {
        tracing::info!("Cloudflare R2 storage configured (bucket: {})", config.r2_bucket);
    } else {
        tracing::warn!("R2 not configured");
    }

    let state = AppState {
        db: pool,
        config: config.clone(),
        http: reqwest::Client::new(),
        r2,
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(routes::health))
        .nest("/api/auth", routes::auth::router())
        .nest("/api/posts", routes::posts::router())
        .nest("/api/books", routes::books::router())
        .nest("/api/news", routes::news::router())
        .nest("/api/telegram", routes::telegram::router())
        .nest("/api/music", routes::music::router())
        .nest("/api/upload", routes::upload::router())
        .nest_service("/uploads", ServeDir::new("uploads"))
        .layer(DefaultBodyLimit::max(500 * 1024 * 1024)) // 500 MB — covers large audio/book uploads
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = format!("0.0.0.0:{}", config.port);
    tracing::info!("Listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

fn build_r2_client(config: &Config) -> Option<aws_sdk_s3::Client> {
    if !config.r2_configured() {
        return None;
    }
    use aws_credential_types::Credentials;
    use aws_sdk_s3::config::{BehaviorVersion, Region};

    let creds = Credentials::new(
        &config.r2_access_key_id,
        &config.r2_secret_access_key,
        None,
        None,
        "r2",
    );
    let s3_cfg = aws_sdk_s3::Config::builder()
        .behavior_version(BehaviorVersion::latest())
        .endpoint_url(format!(
            "https://{}.r2.cloudflarestorage.com",
            config.r2_account_id
        ))
        .credentials_provider(creds)
        .region(Region::new("auto"))
        .force_path_style(false)
        .build();
    Some(aws_sdk_s3::Client::from_conf(s3_cfg))
}
