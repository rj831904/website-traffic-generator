# Apify Playwright base image with pre-installed Chromium, Firefox, WebKit and system dependencies
FROM apify/actor-node-playwright:20

# Copy package definitions
COPY package*.json ./

# Install production dependencies without dev packages
RUN npm --quiet set progress=false \
    && npm install --omit=dev --omit=optional \
    && echo "Installed dependencies successfully"

# Copy source code and actor configuration
COPY . ./

# Run the actor
CMD ["npm", "start"]
