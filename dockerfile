FROM node:16-alpine

WORKDIR /app

# Copiamos solo package.json y lock para instalar primero
COPY package*.json ./

# Instala dependencias, esto compilará 'bcrypt' nativo para Alpine
RUN npm install

# Ahora copia tu código
COPY . .

EXPOSE 3001

# Usa tu comando. Por ejemplo:
CMD ["npx", "ts-node", "-r", "tsconfig-paths/register", "src/index.ts"]


# FROM node:16-alpine

# WORKDIR /app

# COPY package*.json ./

# RUN npm install 

# COPY . .

# EXPOSE 3001

# CMD ["npx", "ts-node", "-r", "tsconfig-paths/register", "src/index.ts"]
