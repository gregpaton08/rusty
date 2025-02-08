use axum::{
    extract::State,
    http::Method,
    response::{IntoResponse, Json},
    routing::get,
    Router,
};
use serde_json::json;
use std::{fs, net::SocketAddr, sync::Arc};
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;

struct AppState {
    image_dirs: std::collections::HashMap<String, String>,
}

#[tokio::main]
async fn main() {
    let image_dirs = std::collections::HashMap::from([
        ("original".to_string(), "images/original".to_string()),
        ("large".to_string(), "images/large".to_string()),
        ("medium".to_string(), "images/medium".to_string()),
        ("small".to_string(), "images/small".to_string()),
    ]);

    let state = Arc::new(AppState { image_dirs });

    let app = Router::new()
        .route("/images", get(list_images))
        .route("/image/{size}/{filename}", get(serve_image))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await.unwrap();

    axum::serve(listener, app).await.unwrap();

}

async fn list_images(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    match fs::read_dir(state.image_dirs.get("original").unwrap()) {
        Ok(entries) => {
            let mut images: Vec<String> = entries
                .filter_map(|entry| entry.ok())
                .filter(|entry| {
                    entry
                        .path()
                        .extension()
                        .map_or(false, |ext| ext == "jpg" || ext == "png" || ext == "webp")
                })
                .map(|entry| entry.file_name().to_string_lossy().into_owned())
                .collect();
            images.sort();
            Json(images).into_response()
        }
        Err(_) => (axum::http::StatusCode::INTERNAL_SERVER_ERROR, "Failed to read directory").into_response(),
    }
}

async fn serve_image(
    State(state): State<Arc<AppState>>,
    axum::extract::Path((size, filename)): axum::extract::Path<(String, String)>,
) -> impl IntoResponse {
    let size = match size.as_str() {
        "small" => "small",
        "medium" => "medium",
        "large" => "large",
        _ => "original",
    };

    if let Some(dir) = state.image_dirs.get(size) {
        let path = format!("{}/{}", dir, filename);
        match fs::read(&path) {
            Ok(data) => {
                let content_type = match filename.split('.').last() {
                    Some("jpg") | Some("jpeg") => "image/jpeg",
                    Some("png") => "image/png",
                    Some("webp") => "image/webp",
                    _ => "application/octet-stream",
                };
                ([(axum::http::header::CONTENT_TYPE, content_type)], data).into_response()
            }
            Err(_) => (
                axum::http::StatusCode::NOT_FOUND,
                "Image not found",
            )
                .into_response(),
        }
    } else {
        (
            axum::http::StatusCode::BAD_REQUEST,
            "Invalid size parameter",
        )
            .into_response()
    }
}
