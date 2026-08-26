FROM node:20 AS builder

WORKDIR /app
COPY package*.json ./ 
RUN npm install
COPY . .
RUN npm run build

# production
FROM node:20

WORKDIR /app

RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Copiar el package lock para instalar dependencias
COPY package*.json ./
RUN npm install --production

RUN rm -f /etc/nginx/sites-enabled/default
COPY nginx.conf /etc/nginx/conf.d/nginx.conf

# Copiamos el dist del run anterior
COPY --from=builder /app/dist ./dist

EXPOSE 80

CMD sh -c "node dist/src/index.js & nginx -g 'daemon off;'"
