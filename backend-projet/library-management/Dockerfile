# ---------- Étape 1 : build (compile TypeScript) ----------
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- Étape 2 : image finale (légère) ----------
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# Dossiers de données (seront montés en volumes) + droits pour l'utilisateur non root
RUN mkdir -p /app/db /app/uploads && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "dist/main"]
