FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG API_URL=http://localhost:3000
RUN sed -i "s|__API_URL__|$API_URL|g" src/environments/environment.prod.ts && \
    npm run build -- --configuration production

FROM nginx:alpine
COPY --from=builder /app/dist/fv-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
