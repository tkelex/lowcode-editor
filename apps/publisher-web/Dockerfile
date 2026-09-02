FROM node:22-alpine AS build

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/editor-web/package.json ./apps/editor-web/package.json
COPY apps/api-server/package.json ./apps/api-server/package.json
COPY apps/publisher-web/package.json ./apps/publisher-web/package.json
COPY packages/lowcode-schema/package.json ./packages/lowcode-schema/package.json
COPY packages/lowcode-runtime/package.json ./packages/lowcode-runtime/package.json
RUN npm ci

COPY apps/publisher-web ./apps/publisher-web
COPY packages ./packages

ARG PUBLISHER_API_BASE_URL=http://server:3000/api
ARG PUBLISHER_SITE_URL=http://localhost:5174
ARG PUBLISHER_REVALIDATE_SECRET=change-me-before-production
ARG PUBLISHER_LOWCODE_HTTP_ALLOWED_ORIGINS=
ENV PUBLISHER_API_BASE_URL=$PUBLISHER_API_BASE_URL
ENV PUBLISHER_SITE_URL=$PUBLISHER_SITE_URL
ENV PUBLISHER_REVALIDATE_SECRET=$PUBLISHER_REVALIDATE_SECRET
ENV PUBLISHER_LOWCODE_HTTP_ALLOWED_ORIGINS=$PUBLISHER_LOWCODE_HTTP_ALLOWED_ORIGINS

RUN npm run build:schema && npm run build:runtime && npm run build:publisher

FROM node:22-alpine

WORKDIR /workspace/apps/publisher-web
ENV NODE_ENV=production

COPY --from=build /workspace/node_modules /workspace/node_modules
COPY --from=build /workspace/packages /workspace/packages
COPY --from=build /workspace/apps/publisher-web/package.json ./package.json
COPY --from=build /workspace/apps/publisher-web/next.config.mjs ./next.config.mjs
COPY --from=build /workspace/apps/publisher-web/.next ./.next

EXPOSE 5174

CMD ["/workspace/node_modules/.bin/next", "start", "-p", "5174"]
