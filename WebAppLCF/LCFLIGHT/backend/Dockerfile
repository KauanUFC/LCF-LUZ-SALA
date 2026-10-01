FROM node:20-alpine AS build

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm ci

COPY src/ ./src/
RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY package.json ./
RUN npm ci --production

COPY --from=build /app/dist ./dist

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "dist/app.js"]