FROM node:20-slim

# Install Playwright dependencies + Chromium
RUN apt-get update && apt-get install -y wget gnupg && \
    npx playwright install-deps chromium && \
    npm install -g playwright

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# Install Chromium for the crawler
RUN npx playwright install chromium

EXPOSE 8787
CMD ["node", "scripts/playwright-server.mjs"]
