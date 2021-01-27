FROM node:14-alpine

## INSTALL SERVER

RUN mkdir -p /app /app/data
WORKDIR /app

# Copy required files
COPY ./package.json ./package-lock.json ./tsconfig.json ./ormconfig.js ./

# Install dependencies
RUN npm ci

# Copy source files
COPY ./src ./src

# Build for production
ENV NODE_ENV production
RUN npm run build

# Add volumes
VOLUME /app/data

# Copy migration files
COPY ./migrations ./migrations

## RUN

ARG THERABOT_TOKEN
ARG DEBUG
CMD ["npm", "start"]
