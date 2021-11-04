# url-shortcuts-go

A URL shortening service written in Go + React.

## Running locally
### API
1. Copy the docker-compose.example.yml file to docker-compose.yml.
2. Fill in your secrets.
3. ```docker compose up --build```
### Frontend
1. ```yarn start```.
2. Navigate to ```http://localhost:3000/shortcuts```.

## Deployment
Changes pushed to main are automatically deployed to prod via GitHub Actions.
