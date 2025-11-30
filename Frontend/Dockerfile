# Build stage
FROM node:18 AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Build the React app
RUN npm run build

# Serve the built files using 'serve'
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000"]
