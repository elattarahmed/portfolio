use axum::{ extract::State, response::{ Html, IntoResponse }, routing::get, Router };
use serde_json::Value;
use std::sync::Arc;
use tera::{ Context, Tera };
use tower_http::services::ServeDir;

struct AppState {
    tera: Tera,
    content: Value,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize Tera
    let tera = Tera::new("templates/**/*")?;

    // Load content.json
    let content_str = std::fs::read_to_string("assets/content.json")?;
    let content: Value = serde_json::from_str(&content_str)?;

    let app_state = Arc::new(AppState { tera, content });

    // Build our application with a route
    let app = Router::new()
        .route("/", get(index))
        .nest_service("/assets", ServeDir::new("assets"))
        .route_service("/style.css", tower_http::services::ServeFile::new("assets/style.css")) // Serve style.css at root for compatibility
        .with_state(app_state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:433").await?;
    println!("Listening on http://0.0.0.0:433");
    axum::serve(listener, app).await?;

    Ok(())
}

async fn index(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let mut context = Context::new();

    // Flatten content into context key-value pairs
    if let Some(obj) = state.content.as_object() {
        for (k, v) in obj {
            context.insert(k, v);
        }
    }

    match state.tera.render("index.html", &context) {
        Ok(rendered) => Html(rendered),
        Err(err) => {
            println!("Template rendering error: {}", err);
            Html(format!("Error rendering template: {}", err))
        }
    }
}
