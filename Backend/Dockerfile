FROM node:20.12.2 AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Build the Nest app
RUN npm run build
RUN npx prisma generate

# Expose the port the app runs on
CMD ["npm", "run", "start:prod"]
EXPOSE 3000
