#!/bin/bash

# Quick server setup script for DigitalOcean
# Run this on a fresh Ubuntu 22.04 server

set -e

echo "🚀 Setting up EduConnect server..."
echo "===================================="

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install essential tools
echo "📦 Installing essential tools..."
apt install -y curl wget git ufw fail2ban htop

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
if ! command -v docker compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
fi

# Configure firewall
echo "🔥 Configuring firewall..."
ufw --force enable
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5000/tcp
ufw allow 8080/tcp
ufw allow 10000/udp
ufw allow 4443/tcp
echo "✅ Firewall configured"

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip)
echo ""
echo "✅ Server setup complete!"
echo ""
echo "📍 Your server IP: $SERVER_IP"
echo ""
echo "📝 Next steps:"
echo "1. Clone your repository: git clone YOUR_REPO_URL /opt/educonnect"
echo "2. Configure .env files (see QUICK_DEPLOY_DIGITALOCEAN.md)"
echo "3. Run: cd /opt/educonnect && ./deploy-digitalocean.sh"
echo ""


