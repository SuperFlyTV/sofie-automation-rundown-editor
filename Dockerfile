# ---------- Build Stage ----------
FROM node:22-slim AS builder

# Set production environment
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Enable Corepack and prepare Yarn 4
RUN corepack enable && corepack prepare yarn@4.9.1 --activate

# Copy the entire repo
COPY . .

# Install all dependencies (incl. devDeps)
RUN yarn install --frozen-lockfile

# Build the app
RUN yarn build

RUN mkdir /app/data

# Default command (adjust as needed)
CMD ["yarn", "start"]

EXPOSE 3010/tcp