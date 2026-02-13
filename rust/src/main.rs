use axum::{ extract::State, routing::get, Json, Router };
use serde_json::Value;
use std::sync::Arc;
use tower_http::services::ServeDir;

struct AppState {
    _content: Value,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load content.json
    let content_str = std::fs::read_to_string("assets/content.json")?;
    let content: Value = serde_json::from_str(&content_str)?;

    let app_state = Arc::new(AppState { _content: content });

    // Build our application with a route
    let app = Router::new()
        .nest_service("/assets", ServeDir::new("assets"))
        .nest_service("/tech-journey", ServeDir::new("assets/tech-journey")) // Keep old route for now just in case
        .fallback_service(ServeDir::new("assets/static")) // Serve React app at root and fallback
        .route_service("/style.css", tower_http::services::ServeFile::new("assets/style.css"))
        .route("/api/content", get(get_content))
        .with_state(app_state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8443").await?;
    println!("Listening on http://0.0.0.0:8443");
    axum::serve(listener, app).await?;

    Ok(())
}

async fn get_content(State(state): State<Arc<AppState>>) -> Json<Value> {
    Json(state._content.clone())
}
