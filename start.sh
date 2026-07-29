#!/bin/bash

echo "========================================="
echo "LPG PORTAL - Starting Application"
echo "========================================="

# Ensure environment is production
export NODE_ENV=production

# Check if pm2 is installed globally
if ! command -v pm2 &> /dev/null
then
    echo "PM2 is not installed globally. Running using 'node' directly..."
    node dist/server.cjs
else
    echo "Starting application with PM2..."
    pm2 start dist/server.cjs --name "lpgportal" || pm2 restart "lpgportal"
    echo "Application started in PM2!"
    echo "Run 'pm2 status' to view status or 'pm2 logs lpgportal' for logs."
fi
