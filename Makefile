.PHONY: build clean run-backend

# Default target: Build both
build: build-frontend build-backend

# --- Frontend ---
build-frontend:
	cd frontend && npm install && npx tsc

# --- Backend ---
build-backend:
	cd backend && cargo build --release

# --- Utilities ---
clean:
	rm -rf frontend/dist
	cd backend && cargo clean

# Run backend locally for testing
run-backend:
	cd backend && cargo run

.PHONY: nginx-reload
nginx-reload:
	nginx -s reload

code2prompt:
	code2prompt . \
		--template project.hbs \
		--include "*.rs,*.ts,*.html,*.css,*.toml,*.conf,*.json,Makefile" \
		--exclude "**/dist/**,**.md**,**.hbs**" \
		--output-file project_context.md
