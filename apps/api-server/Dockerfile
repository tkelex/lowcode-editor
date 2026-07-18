FROM node:22-alpine AS build

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/editor-web/package.json ./apps/editor-web/package.json
COPY apps/api-server/package.json ./apps/api-server/package.json
COPY apps/publisher-web/package.json ./apps/publisher-web/package.json
COPY packages/lowcode-schema/package.json ./packages/lowcode-schema/package.json
COPY packages/lowcode-runtime/package.json ./packages/lowcode-runtime/package.json
RUN npm ci

COPY apps/api-server ./apps/api-server
COPY packages/lowcode-schema ./packages/lowcode-schema

RUN npm run prisma:generate
RUN npm run build:server

FROM node:22-alpine

WORKDIR /workspace/apps/api-server
ENV NODE_ENV=production

COPY --from=build /workspace/package.json /workspace/package-lock.json /workspace/
COPY --from=build /workspace/node_modules /workspace/node_modules
COPY --from=build /workspace/packages/lowcode-schema /workspace/packages/lowcode-schema
COPY --from=build /workspace/apps/api-server/package.json ./package.json
COPY --from=build /workspace/apps/api-server/dist ./dist
COPY --from=build /workspace/apps/api-server/prisma ./prisma

RUN mkdir -p /workspace/apps/api-server/uploads

EXPOSE 3000

CMD ["node", "dist/main.js"]
