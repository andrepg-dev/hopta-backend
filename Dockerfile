FROM node:20 AS builder

WORKDIR /app
COPY package*.json ./ 
RUN npm install
COPY . .
RUN npm run build

# production
FROM node:20

WORKDIR /app

# Copiar el package lock para instalar dependencias
COPY package*.json .
RUN npm install --production

# Copiamos el dist del run anterior
COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD [ "node", "dist/src/index.js" ]
