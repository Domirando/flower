use axum::{
    extract::{Query, State},
    routing::get,
    Json, Router,
};
use serde::Deserialize;
use serde_json::{json, Value};
use std::io::BufReader;

use crate::{error::AppError, AppState};

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(get_news))
}

#[derive(Deserialize)]
struct NewsParams {
    interests: Option<String>,
}

async fn get_news(
    State(state): State<AppState>,
    Query(params): Query<NewsParams>,
) -> Result<Json<Value>, AppError> {
    let bytes = state
        .http
        .get("https://feeds.bbci.co.uk/news/rss.xml")
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("Failed to fetch news feed: {e}"))?
        .bytes()
        .await
        .map_err(|e| anyhow::anyhow!("Failed to read news feed: {e}"))?;

    let channel = rss::Channel::read_from(BufReader::new(&bytes[..]))
        .map_err(|e| anyhow::anyhow!("Failed to parse RSS feed: {e}"))?;

    let mut items: Vec<Value> = channel
        .items()
        .iter()
        .map(|item| {
            let thumbnail = item
                .enclosure()
                .map(|e| e.url().to_string())
                .or_else(|| {
                    item.content().and_then(|c| {
                        let start = c.find("src=\"")?;
                        let rest = &c[start + 5..];
                        let end = rest.find('"')?;
                        Some(rest[..end].to_string())
                    })
                });

            json!({
                "title": item.title().unwrap_or(""),
                "link": item.link().unwrap_or(""),
                "pubDate": item.pub_date().unwrap_or(""),
                "content": item.content().unwrap_or(""),
                "snippet": item.description().unwrap_or(""),
                "thumbnail": thumbnail,
            })
        })
        .collect();

    if let Some(interests_str) = &params.interests {
        let interest_list: Vec<String> = interests_str
            .split(',')
            .map(|i| i.trim().to_lowercase())
            .filter(|i| !i.is_empty())
            .collect();

        items.sort_by(|a, b| {
            let matches = |v: &Value| -> bool {
                let title = v["title"].as_str().unwrap_or("").to_lowercase();
                let snippet = v["snippet"].as_str().unwrap_or("").to_lowercase();
                interest_list
                    .iter()
                    .any(|i| title.contains(i.as_str()) || snippet.contains(i.as_str()))
            };
            matches(b).cmp(&matches(a))
        });
    }

    Ok(Json(json!({ "items": items })))
}
