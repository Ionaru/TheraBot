FROM node:12-alpine

## INSTALL SERVER

RUN mkdir /app
WORKDIR /app

# Copy needed build files
COPY ./package.json ./package-lock.json ./tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY ./src ./src

# Build server for production
ENV NODE_ENV production
RUN npm run build
RUN npm ci
RUN npm cache clean --force

## RUN

CMD ["npm", "start"]
