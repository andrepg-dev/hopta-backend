FROM node:22.17.1 AS builder

WORKDIR /app
COPY package*.json ./ 

RUN npm install

COPY . .

RUN npm run build

# production
FROM node:22.17.1

WORKDIR /app

# Copiar el package lock para instalar dependencias
COPY package*.json /app/
RUN npm install

# Copiamos el dist del run anterior
COPY --from=builder /app/dist ./dist

# Copiar el archivo .env de la build a producción, esto solo en modo desarrollo
COPY .env .

EXPOSE 3001

CMD ["node", "dist/src/index.js"]
