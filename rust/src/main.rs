use axum::{ routing::get, Json, Router };
use serde_json::Value;
use std::sync::Arc;
use tower_http::services::ServeDir;
use std::env;

struct AppState {
    _content: Value,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Shared state (no longer holds content in memory)
    let app_state = Arc::new(AppState { _content: Value::Null });

    // Build our application with a route
    let app = Router::new()
        .route("/api/content", get(get_content))
        .route_service(
            "/projets-annuels",
            tower_http::services::ServeFile::new("assets/static/wip.html")
        )
        .route_service("/style.css", tower_http::services::ServeFile::new("assets/style.css"))
        .nest_service("/assets", ServeDir::new("assets"))
        .nest_service("/tech-journey", ServeDir::new("assets/tech-journey"))
        .fallback_service(ServeDir::new("assets/static"))
        .with_state(app_state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8443").await?;
    println!("Listening on http://0.0.0.0:8443");
    axum::serve(listener, app).await?;

    Ok(())
}

async fn get_content() -> Json<Value> {
    println!("API Request received: /api/content");
    match std::fs::read_to_string("assets/content.json") {
        Ok(content_str) => {
            match serde_json::from_str(&content_str) {
                Ok(content) => Json(content),
                Err(e) => {
                    eprintln!("Error parsing content.json: {}", e);
                    Json(serde_json::json!({ "error": "Invalid JSON" }))
                }
            }
        }
        Err(e) => {
            let cwd = env::current_dir().unwrap_or_default();
            eprintln!("Error reading content.json: {} (CWD: {:?})", e, cwd);
            Json(serde_json::json!({ "error": "File not found" }))
        }
    }
}
