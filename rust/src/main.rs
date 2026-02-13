use axum::{ routing::get, Json, Router, response::IntoResponse };
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

async fn get_content() -> impl axum::response::IntoResponse {
    println!("API Request received: /api/content");

    let headers = [
        ("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate"),
        ("Pragma", "no-cache"),
        ("Expires", "0"),
    ];

    match std::fs::read_to_string("assets/content.json") {
        Ok(content_str) => {
            match serde_json::from_str::<Value>(&content_str) {
                Ok(content) => (headers, Json(content)).into_response(),
                Err(e) => {
                    eprintln!("Error parsing content.json: {}", e);
                    (headers, Json(serde_json::json!({ "error": "Invalid JSON" }))).into_response()
                }
            }
        }
        Err(e) => {
            let cwd = env::current_dir().unwrap_or_default();
            eprintln!("Error reading content.json: {} (CWD: {:?})", e, cwd);
            (headers, Json(serde_json::json!({ "error": "File not found" }))).into_response()
        }
    }
}
