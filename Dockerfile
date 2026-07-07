# ---- Build stage: compile TypeScript to dist/ ----
FROM node:24-alpine AS build

WORKDIR /app

# Install all dependencies (including dev) for the build.
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

# Compile the application.
COPY src ./src
RUN npm run build

# ---- Runtime stage: production image ----
FROM node:24-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Install production dependencies only. Everything is pure JavaScript now
# (SQLite is provided by Node's built-in node:sqlite), so there is no native
# compilation and no build toolchain is required.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy the compiled application from the build stage.
COPY --from=build /app/dist ./dist

# The SQLite database (data/therabot.db) and ESI cache (data/cache.json) live
# here; mounted as a volume in production.
RUN mkdir -p /app/data
VOLUME /app/data

CMD ["node", "dist/main.js"]
