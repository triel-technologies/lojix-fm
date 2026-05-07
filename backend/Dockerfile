FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json .
RUN npm install --production

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/main.js"]
