#!/bin/bash
set -e

echo "=== AURA VPS DEPLOY ==="

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Clone or update repo
cd /root || mkdir /root && cd /root
if [ -d "Aura" ]; then
    echo "Updating existing repo..."
    cd Aura && git pull
else
    echo "Cloning repo..."
    git clone https://github.com/MaitiGodoy/Aura.git
    cd Aura
fi

# Create .env with Groq API key (replace with your actual key)
echo "GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE" > .env

# Stop old containers
docker compose down --remove-orphans || true

# Build and start
docker compose up -d --build

# Wait for startup
sleep 5

# Verify
echo ""
echo "=== CONTAINER STATUS ==="
docker ps -a

echo ""
echo "=== HEALTH CHECK ==="
curl -s http://localhost:80/health || echo "Health check failed!"

echo ""
echo "=== DEPLOY COMPLETE ==="
echo "Frontend: http://<VPS_IP>"
echo "API:      http://<VPS_IP>/api/converse"
