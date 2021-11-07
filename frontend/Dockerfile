FROM node:lts AS builder
RUN mkdir /app
ADD . /app
WORKDIR /app
RUN yarn install && yarn build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/build ./shortcuts
COPY --from=builder /app/nginx/nginx.conf /etc/nginx/conf.d/default.conf
ENTRYPOINT ["nginx", "-g", "daemon off;"]