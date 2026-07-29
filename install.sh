#!/bin/bash

# Exit on error
set -e

echo "========================================="
echo "LPG PORTAL - Production Installation Script"
echo "========================================="

echo "1. Installing package dependencies..."
npm install

echo "2. Generating Prisma Client..."
npx prisma generate

echo "3. Installation completed successfully!"
echo "Please run './start.sh' to boot the application."
