# FIXO-APP web frontend (TanStack Start / React + Vite).
# Dev-style runtime so the whole team can open the app immediately.
FROM node:25-alpine
WORKDIR /app
ENV NODE_ENV=development

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
