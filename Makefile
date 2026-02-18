.PHONY: build clean

# Default target
build: node_modules
	npx tsc

# Install dependencies if they don't exist
node_modules: package.json
	npm install
	touch node_modules

# Clean built files
clean:
	rm -rf dist 

.PHONY: nginx-reload
nginx-reload:
	nginx -s reload

code2prompt:
	code2prompt . \
		--template project.hbs \
		--include "*.rs,*.ts,*.html,*.css,*.toml,*.conf" \
		--exclude "**/dist/**,**.md**,**.hbs**" \
		--output-file project_context.md
