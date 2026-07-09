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

# search.spaceships.app chains to the new Let's Encrypt root "ISRG Root YR" and
# serves an incomplete chain (it omits the cross-sign to the trusted ISRG Root
# X1). That new root is not yet in Node's bundled CA store, so TLS verification
# fails with UNABLE_TO_GET_ISSUER_CERT_LOCALLY. Supply the X1 cross-sign of Root
# YR as an extra trust anchor: this is exactly the certificate a browser fetches
# on its own via AIA chasing. Full verification stays on; nothing is disabled.
COPY deploy/isrg-root-yr-cross.pem /etc/ssl/certs/isrg-root-yr-cross.pem
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/isrg-root-yr-cross.pem

# The SQLite database (data/therabot.db) and ESI cache (data/cache.json) live
# here; mounted as a volume in production.
RUN mkdir -p /app/data
VOLUME /app/data

CMD ["node", "dist/main.js"]
