FROM node:20-slim

# Install system dependencies (Python and LibreOffice)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    libreoffice-writer \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set up python environment
RUN ln -s /usr/bin/python3 /usr/bin/python
RUN pip3 install pdf2docx --break-system-packages

WORKDIR /app

# Copy project files
COPY package*.json ./
RUN npm install

COPY . .

# Build Next.js
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
