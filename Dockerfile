FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Railway/clients connect over HTTP on this port
ENV PORT=8080
EXPOSE 8080

# Run the MCP server (Streamable HTTP) via tsx
CMD ["npm", "run", "start"]
