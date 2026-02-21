FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Run build if using TS output, or just use tsx for dev
# Since we might use TSX for serving in dev:
CMD ["npx", "tsx", "src/server.ts"]
