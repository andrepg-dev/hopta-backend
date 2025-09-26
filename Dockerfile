FROM node:20 AS builder

WORKDIR /app
COPY package*.json ./ 

RUN npm install

COPY . .

RUN npm run build

# production
FROM node:20

WORKDIR /app

RUN apt-get update && apt-get install -y nginx certbot python3-certbot-nginx && \
    rm -rf /var/lib/apt/lists/*

# Copiar el package lock para instalar dependencias
COPY package*.json .
RUN npm install --production

# Copiamos el dist del run anterior
COPY --from=builder /app/dist ./dist

# Copiar el archivo .env de la build a producción, esto solo en modo desarrollo
# COPY .env .

COPY nginx/backend.conf /etc/nginx/conf.d/backend.conf

# copiar script de entrypoint
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 80 443

ENTRYPOINT [ "/app/entrypoint.sh" ]
