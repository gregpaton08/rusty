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
