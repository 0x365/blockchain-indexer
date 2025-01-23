# Use a Node.js base image
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the application port (change if needed)
EXPOSE 3011
EXPOSE 3012
EXPOSE 3013

# Run the application
CMD ["node", "web3_indexer.js"]
CMD ["node", "web2_api.js"]
