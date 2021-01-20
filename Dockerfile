FROM node:14-alpine

## INSTALL SERVER

RUN mkdir -p /app /app/data
WORKDIR /app

# Copy required files
COPY ./package.json ./package-lock.json ./tsconfig.json ./ormconfig.js ./
COPY ./migrations ./migrations
COPY ./src ./src

# Install dependencies
RUN npm ci

# Build for production
ENV NODE_ENV production
RUN npm run build

# Add volumes
VOLUME /app/data

## RUN

ARG THERABOT_TOKEN
ARG DEBUG
CMD ["npm", "start"]
