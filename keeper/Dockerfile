FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY dist ./dist
COPY .env .env
COPY secret_key.pem secret_key.pem

RUN chmod 400 secret_key.pem

CMD ["node", "dist/main.js"]
