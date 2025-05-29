FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./ 

RUN npm install

COPY . .

RUN npm run build

# production
FROM node:18-alpine

WORKDIR /app

# Copiar el package lock para instalar dependencias
COPY package*.json /app/
RUN npm install --production

# Copiamos el dist del run anterior
COPY --from=builder /app/dist ./dist

# Copiar el archivo .env de la build a producción
# COPY .env .

EXPOSE 3005

CMD ["node", "dist/src/index.js"]
