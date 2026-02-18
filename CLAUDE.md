# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rusty is a timelapse viewer app with a Rust/Axum backend and vanilla TypeScript frontend, served behind an Nginx reverse proxy. It displays time-lapse images with responsive sizing and tap-based playback controls optimized for mobile.

## Build & Run Commands

### Frontend
```bash
make build                # Compiles TypeScript → frontend/dist/main.js
```

### Backend
```bash
cd backend && cargo run   # Starts API server on 127.0.0.1:3000
cargo fmt                 # Format Rust code (rustfmt.toml uses edition 2018)
cargo clippy              # Lint Rust code
```

### Nginx (reverse proxy on port 8080)
```bash
nginx -c ./nginx/nginx.conf -p ./       # Start
nginx -s stop -c ./nginx/nginx.conf -p ./  # Stop
```

### Image Resizing (ImageMagick)
```bash
cd backend/images
mogrify -path small -resize 640x480 -format jpg original/*.jpg
mogrify -path medium -resize 1280x720 -format jpg original/*.jpg
mogrify -path large -resize 1920x1080 -format jpg original/*.jpg
```

## Architecture

**Backend** (`backend/src/main.rs`): Axum async web server with two endpoints:
- `GET /images` — lists image filenames from the `original/` directory (JPG/PNG/WebP)
- `GET /image/{size}/{filename}` — serves an image at the requested size (small/medium/large/original)

State is an `Arc<HashMap>` mapping size names to directory paths under `backend/images/`.

**Frontend** (`frontend/src/main.ts`): Vanilla TypeScript with no framework. Fetches image list from `/api/images`, then plays them as a timelapse at 100ms intervals. Click zones divide the screen into thirds (prev/play-pause/next). Image size is selected based on viewport width (≤640→small, ≤1280→medium, ≤1920→large, >1920→original).

**Nginx** (`nginx/nginx.conf`): Reverse proxy on port 8080. Routes `/api/*` to the backend on port 3000, serves frontend static files directly. Handles CORS headers.

## Key Details

- No test framework is set up for either frontend or backend
- No linter is configured for the frontend
- TypeScript compiles to `frontend/dist/` which is gitignored
- Images are not checked into the repo; they live in `backend/images/{original,small,medium,large}/`
