# build backend api
FROM golang:1.16.2-alpine3.13 AS builder-api
RUN mkdir /app
ADD . /app
WORKDIR /app
RUN go build -o url-shortcuts .

# build frontend
FROM node:16-alpine AS builder-frontend
RUN mkdir /app
ADD . /app
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# assemble composite container
FROM alpine:latest
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder-api /app/url-shortcuts /url-shortcuts
COPY --from=builder-frontend /app/frontend/build /web
ENTRYPOINT ["./url-shortcuts"]