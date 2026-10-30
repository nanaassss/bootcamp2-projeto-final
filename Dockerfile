FROM node:20-alpine
 
WORKDIR /app
 
# Copia primeiro só os arquivos de dependências (melhora o cache do build)
COPY package*.json ./
RUN npm ci --omit=dev
 
# Copia o restante do código
COPY . .
 
EXPOSE 3000
 
CMD ["npm", "start"]
