use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::get,
    Router,
};
use serde_json::json;
use std::{fs, net::SocketAddr, sync::Arc};
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;

struct AppState {
    image_dir: String,
}

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState {
        image_dir: "images".to_string(),
    });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/images", get(list_images))
        .nest_service("/timelapse", ServeDir::new(&state.image_dir))
        .layer(cors)
        .with_state(state);

    // let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await
        .unwrap();
    // println!("Server running at http://{}", addr);

    axum::serve(listener, app).await.unwrap();
}

async fn list_images(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    match fs::read_dir(&state.image_dir) {
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
        Err(_) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to read directory",
        )
            .into_response(),
    }
}
