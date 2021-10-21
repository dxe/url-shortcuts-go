FROM golang:1.16.2-alpine3.13 AS builder
RUN mkdir /app
ADD . /app
WORKDIR /app
RUN go build -o url-shortcuts .

FROM alpine:latest
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /app/url-shortcuts /url-shortcuts
ENTRYPOINT ["./url-shortcuts"]