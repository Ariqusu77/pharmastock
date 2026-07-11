FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 4000

CMD ["sh", "-c", "node src/seed.js && node src/server.js"]
