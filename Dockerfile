# ====================================================
# LPGPORTAL PRODUCTION DOCKERFILE
# ====================================================

# Step 1: Build Application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Step 2: Production Execution Image
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/index.html ./index.html

# Expose server port
EXPOSE 3000

ENV NODE_ENV=production

# Run start script
CMD ["npm", "run", "start"]
