FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN NODE_ENV=development npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/build ./build
COPY content ./content
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "run", "start"]