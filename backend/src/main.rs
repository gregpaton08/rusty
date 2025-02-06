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
    image_dir: String,
}

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState {
        image_dir: "images".to_string(),
    });

    // Configure CORS to allow access from any origin
    let cors = CorsLayer::new()
        .allow_origin(Any) // Allow requests from any domain
        .allow_methods([Method::GET])
        .allow_headers(Any); // Allow all headers

    let app = Router::new()
        .route("/images", get(list_images))
        .nest_service("/timelapse", ServeDir::new(&state.image_dir))
        .layer(cors) // Apply the CORS layer
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000)); // Bind to all interfaces
    println!("Server running at http://{}", addr);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
    .await.unwrap();

    // axum::Server::bind(&addr)
    //     .serve(app.into_make_service())
    //     .await
    //     .unwrap();

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
        Err(_) => (axum::http::StatusCode::INTERNAL_SERVER_ERROR, "Failed to read directory").into_response(),
    }
}
