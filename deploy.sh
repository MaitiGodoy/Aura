#!/bin/bash
# Aura VPS Deploy Script
# Run on VPS: ssh user@2.24.71.246 'bash -s' < deploy.sh

set -e

echo "=== AURA VPS DEPLOY ==="
echo "Stopping old containers..."
docker-compose down || true

echo "Pulling latest code..."
cd /root/Aura || { echo "Directory /root/Aura not found!"; exit 1; }
git pull || { echo "Git pull failed!"; exit 1; }

echo "Building and starting containers..."
docker-compose up -d --build

echo "Waiting for services to start..."
sleep 5

echo "Checking containers..."
docker ps -a

echo "Checking API health..."
curl -s http://localhost:80/health || echo "Health check failed!"

echo ""
echo "=== DEPLOY COMPLETE ==="
echo "Access: http://2.24.71.246"
echo "API:    http://2.24.71.246/api/converse"
