# ------------------------
# Stage 1 — Build Stage
# ------------------------

# Official Node.js 18 Alpine image for the build stage
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if present) into the container
COPY package*.json ./

# Install all dependencies using a clean install for consistency and speed
RUN npm ci

# Copy the rest of the application source code into the container
COPY . .

# Build the application (typically compiles TypeScript or bundles frontend code)
RUN npm run build

# ------------------------
# Stage 2 — Runtime Stage
# ------------------------

# Use a fresh Node.js 18 Alpine image for the final runtime container (smaller and cleaner)
FROM node:18-alpine

# Set the working directory inside the runtime container
WORKDIR /app

# Set the environment variable to production to optimize performance
# ENV NODE_ENV=production

# Copy only the built output and package.json files from the build stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies (devDependencies are skipped)
RUN npm ci --only=production

# Expose port 3000 (so external systems know which port the app runs on)
EXPOSE 3000

# Define the default command to start the application
CMD ["npm", "run", "start:prod"]
