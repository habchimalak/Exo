# ---------- Étape 1 : build (compile TypeScript) ----------
FROM node:22-slim AS build
# npm 11 : même version que celle qui a créé package-lock.json
RUN npm install -g npm@11
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN NODE_OPTIONS=--max-old-space-size=3072 npm run build

# ---------- Étape 2 : image finale (légère) ----------
FROM node:22-slim
ENV NODE_ENV=production
RUN npm install -g npm@11
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# Dossiers de données (montés en volumes) + droits pour l'utilisateur non root
RUN mkdir -p /app/db /app/uploads && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "dist/main"]