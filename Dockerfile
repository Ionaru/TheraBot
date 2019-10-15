FROM node:12-alpine

## INSTALL SERVER

RUN mkdir -p /app /app/data
WORKDIR /app

# Copy required files
COPY ./package.json ./package-lock.json ./tsconfig.json ./ormconfig.js ./
COPY ./src ./src

# Install dependencies
RUN npm install

# Run database migrations
RUN npm run typeorm migration:run

# Build for production
ENV NODE_ENV production
RUN npm run build
RUN npm ci
RUN npm cache clean --force

# Add volumes
VOLUME /app/data

## RUN

ARG THERABOT_TOKEN
ARG DEBUG
CMD ["npm", "start"]
