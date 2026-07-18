FROM node:22-alpine AS build

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/editor-web/package.json ./apps/editor-web/package.json
COPY apps/api-server/package.json ./apps/api-server/package.json
COPY apps/publisher-web/package.json ./apps/publisher-web/package.json
COPY packages/lowcode-schema/package.json ./packages/lowcode-schema/package.json
COPY packages/lowcode-runtime/package.json ./packages/lowcode-runtime/package.json
RUN npm ci

COPY apps/editor-web ./apps/editor-web
COPY packages ./packages

ARG VITE_API_BASE_URL=/api
ARG VITE_PUBLISHER_SITE_URL=
ARG VITE_LOWCODE_HTTP_ALLOWED_ORIGINS=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_PUBLISHER_SITE_URL=$VITE_PUBLISHER_SITE_URL
ENV VITE_LOWCODE_HTTP_ALLOWED_ORIGINS=$VITE_LOWCODE_HTTP_ALLOWED_ORIGINS

RUN npm run build:schema && npm run build:runtime && npm run build:editor

FROM nginx:1.27-alpine

COPY infra/nginx/web.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/editor-web/dist /usr/share/nginx/html

EXPOSE 80
