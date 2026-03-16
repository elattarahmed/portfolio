use axum::{ extract::State, response::Html, routing::get, Router };
use serde_json::Value;
use std::sync::Arc;
use tower_http::services::{ ServeDir, ServeFile };
use tower_http::set_header::SetResponseHeaderLayer;
use axum::http::{ HeaderName, HeaderValue };
use tera::Tera;

struct AppState {
    tera: Tera,
}

const IP_ADDRESS: &str = "0.0.0.0:8443";

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let tera = Tera::new("templates/**/*.html")?;
    let app_state = Arc::new(AppState { tera });

    let app = Router::new()
        .route("/", get(render_index))
        .route("/projets-annuels", get(render_wip))
        .route_service("/style.css", ServeFile::new("assets/style.css"))
        .fallback_service(ServeDir::new("assets/static"))
        .with_state(app_state)
        .layer(
            SetResponseHeaderLayer::overriding(
                HeaderName::from_static("content-security-policy"),
                HeaderValue::from_static(
                    "default-src 'self'; \
                    script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; \
                    style-src 'self' https://fonts.googleapis.com; \
                    img-src 'self' data:; \
                    font-src 'self' https://fonts.gstatic.com; \
                    connect-src 'self' https://cloudflareinsights.com"
                )
            )
        )
        .layer(
            SetResponseHeaderLayer::overriding(
                HeaderName::from_static("x-frame-options"),
                HeaderValue::from_static("DENY")
            )
        )
        .layer(
            SetResponseHeaderLayer::overriding(
                HeaderName::from_static("cross-origin-opener-policy"),
                HeaderValue::from_static("same-origin")
            )
        );

    let listener = tokio::net::TcpListener::bind(IP_ADDRESS).await?;
    println!("Listening on http://{}", IP_ADDRESS);
    axum::serve(listener, app).await?;

    Ok(())
}

async fn render_index(State(state): State<Arc<AppState>>) -> Html<String> {
    let content_str = match std::fs::read_to_string("assets/content.json") {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Error reading content.json: {}", e);
            return Html("<p>Erreur lors du chargement du contenu.</p>".to_string());
        }
    };

    let content: Value = match serde_json::from_str(&content_str) {
        Ok(v) => v,
        Err(e) => {
            eprintln!("Error parsing content.json: {}", e);
            return Html("<p>Erreur lors du parsing du contenu.</p>".to_string());
        }
    };

    let mut ctx = tera::Context::new();
    if let Value::Object(map) = content {
        for (key, value) in map {
            ctx.insert(key, &value);
        }
    }

    match state.tera.render("index.html", &ctx) {
        Ok(html) => Html(html),
        Err(e) => {
            eprintln!("Template error: {}", e);
            Html("<p>Erreur de template.</p>".to_string())
        }
    }
}

async fn render_wip(State(state): State<Arc<AppState>>) -> Html<String> {
    match state.tera.render("wip.html", &tera::Context::new()) {
        Ok(html) => Html(html),
        Err(e) => {
            eprintln!("Template error: {}", e);
            Html("<p>Erreur de template.</p>".to_string())
        }
    }
}
