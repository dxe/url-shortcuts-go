# url-shortcuts-go

A URL shortening service written in Go.

Changes pushed to main are automatically deployed to prod via a GitHub Action.

## Running locally
1. Copy the docker-compose.example.yml file to docker-compose.yml.
2. Fill in your secrets.
3. ```docker compose up --build```