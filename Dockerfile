FROM node:20-alpine

# 1. Install build dependencies for bcrypt
RUN apk add --no-cache make gcc g++ python3

WORKDIR /app

# 2. Copy package files
COPY package*.json ./

# 3. COPY THE PRISMA FOLDER NOW (Fixes the "file not found" error)
COPY prisma ./prisma/

# 4. Clean install (This will now succeed even with the postinstall script)
RUN npm install

# 5. Copy the rest of the application code
COPY . .

EXPOSE 4100

CMD ["npm", "start"]